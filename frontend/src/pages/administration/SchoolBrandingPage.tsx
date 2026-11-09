import React, { useEffect, useState } from 'react';
import { Palette, School, Save, Stamp, Users, FileText, Eye } from 'lucide-react';
import { administrationApi, BrandingRecords, SchoolColors, SchoolSettings } from '../../api/administration';
import { useAuth } from '../../contexts/AuthContext';
import { BrandingTemplatePreview } from './BrandingTemplatePreview';
import { brandingAssetIdFromPath, PrivateBrandingImage } from '../../components/common/PrivateBrandingImage';

const defaults: SchoolColors = { primary: '#15803d', secondary: '#0f172a', accent: '#0284c7', sidebar: '#ffffff', surface: '#ffffff', background: '#f8fafc', text: '#1e293b' };
const tabs = [
  ['identity', 'School Identity', School], ['stamp', 'Official Stamp', Stamp], ['colors', 'UI Colours', Palette],
  ['signatures', 'Staff Signatures', Users], ['templates', 'Document Templates', FileText], ['preview', 'Document Preview', Eye],
] as const;
type Tab = typeof tabs[number][0];
type Staff = { id: string; firstName: string; lastName: string; jobTitle: string };
type Asset = BrandingRecords['assets'][number];

export const SchoolBrandingPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>('identity');
  const [identity, setIdentity] = useState<Partial<SchoolSettings>>({});
  const [colors, setColors] = useState<SchoolColors>(defaults);
  const [records, setRecords] = useState<BrandingRecords>({ assets: [], signatures: [], templates: [] });
  const [documentTypes, setDocumentTypes] = useState<Array<{documentType:string;title:string}>>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffProfileId, setStaffProfileId] = useState('');
  const [signatureAssetId, setSignatureAssetId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [designation, setDesignation] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [docType, setDocType] = useState('REPORT_CARD');
  const [docTitle, setDocTitle] = useState('Student Report Card');
  const [templateConfig, setTemplateConfig] = useState({ headerText: '', footerText: '', includeLogo: false, includeStamp: false });
  const [slots, setSlots] = useState<Array<{designation:string;required:boolean;enabled:boolean;staffProfileId?:string|null}>>([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshRecords = async () => { const result = await administrationApi.getBrandingRecords(); setRecords(result); };
  const loadStaff = async () => {
    setStaffLoading(true); setStaffError('');
    try { setStaff(await administrationApi.listBrandingStaff()); }
    catch (cause) { setStaffError(cause instanceof Error ? cause.message : 'Could not load school staff.'); }
    finally { setStaffLoading(false); }
  };
  const loadPage = async () => {
    setLoading(true); setError('');
    try {
      const [school, branding, data, types] = await Promise.all([administrationApi.getSchoolSettings(), administrationApi.getBranding(), administrationApi.getBrandingRecords(), administrationApi.getBrandingDocumentTypes()]);
      setIdentity(school); setColors(branding ?? defaults); setRecords(data); setDocumentTypes(types);
      if (types.length && !types.some((item) => item.documentType === docType)) setDocType(types[0].documentType);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load school branding.'); }
    finally { setLoading(false); }
    await loadStaff();
  };
  useEffect(() => { void loadPage(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      if (tab === 'identity') await administrationApi.updateSchoolSettings(identity);
      else if (tab === 'colors') { await administrationApi.updateBranding(colors); await refreshUser(); }
      else if (tab === 'signatures') {
        if (!staffProfileId || !signatureAssetId || !designation.trim()) throw new Error('Choose a staff member, signature image, and designation.');
        await administrationApi.saveBrandingSignature({ staffProfileId, assetId: signatureAssetId, displayName: displayName || staff.find((person) => person.id === staffProfileId)?.firstName || '', designation, active: true, validFrom: validFrom || null, validUntil: validUntil || null });
      } else if (tab === 'templates') {
        await administrationApi.saveDocumentTemplate({ documentType: docType, title: docTitle, configuration: templateConfig, signatorySlots: slots.filter((slot) => slot.designation.trim()) });
      }
      await refreshRecords(); setSuccess('School branding saved.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save school branding.'); }
    finally { setSaving(false); }
  };

  const upload = async (file?: File, kind?: 'LOGO'|'STAMP'|'SIGNATURE') => {
    if (!file || !kind) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const uploaded = await administrationApi.uploadBrandingAsset(file, kind) as { id: string };
      if (kind === 'LOGO') setIdentity((current) => ({ ...current, logoUrl: `/api/administration/branding/assets/${uploaded.id}/content` }));
      await refreshRecords(); setSuccess(`${kind === 'LOGO' ? 'School logo' : kind === 'STAMP' ? 'Official stamp' : 'Signature'} uploaded.`);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Upload failed.'); }
    finally { setSaving(false); }
  };
  const toggleAsset = async (asset: Asset) => {
    try { await administrationApi.setBrandingAssetActive(asset.id, !asset.active); await refreshRecords(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update asset.'); }
  };
  const toggleSignature = async (signature: BrandingRecords['signatures'][number]) => {
    try { await administrationApi.setBrandingSignatureActive(signature.id, !signature.active); await refreshRecords(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update signature.'); }
  };
  const isSignatureCurrent = (signature: BrandingRecords['signatures'][number]) => {
    const today = new Date(); today.setHours(0,0,0,0);
    return signature.active && signature.asset.active && (!signature.validFrom || new Date(signature.validFrom) <= today) && (!signature.validUntil || new Date(signature.validUntil) >= today);
  };
  const selectedTemplate = records.templates.find((template) => template.documentType === docType);
  const previewSlots = slots.map((slot) => {
    const match = slot.enabled && slot.staffProfileId ? records.signatures.find((signature) => isSignatureCurrent(signature) && signature.staffProfileId === slot.staffProfileId) : undefined;
    return { designation: slot.designation, required: slot.required, enabled: slot.enabled, displayName: match?.displayName, assetId: match?.asset.id };
  });
  const previewStamp = records.assets.find((asset) => asset.kind === 'STAMP' && asset.active)?.id;
  useEffect(() => {
    const template = records.templates.find((item) => item.documentType === docType);
    if (!template) {
      setDocTitle(docType === 'FEE_RECEIPT' ? 'Fee Receipt' : 'Student Report Card');
      setTemplateConfig({ headerText: '', footerText: '', includeLogo: false, includeStamp: false });
      setSlots([]);
      return;
    }
    setDocTitle(template.title);
    setTemplateConfig({ headerText: String(template.configuration.headerText ?? ''), footerText: String(template.configuration.footerText ?? ''), includeLogo: template.configuration.includeLogo === true, includeStamp: template.configuration.includeStamp === true });
    setSlots(template.signatorySlots.map((slot) => ({ designation: slot.designation, required: slot.required, enabled: slot.enabled !== false, staffProfileId: slot.staffProfileId ?? null })));
  }, [docType, records.templates]);
  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading school branding…</div>;

  return <div className="mx-auto max-w-5xl space-y-6">
    <header><h1 className="text-2xl font-bold text-slate-900">School Branding</h1><p className="mt-1 text-sm text-slate-500">Manage school identity, official assets, staff signatories, and document presentation.</p></header>
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="School Branding sections">{tabs.map(([id,label,Icon]) => <button key={id} type="button" onClick={() => {setTab(id);setError('');setSuccess('');}} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}><Icon size={16}/>{label}</button>)}</nav>
    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}<button type="button" onClick={() => void loadPage()} className="ml-3 font-semibold underline">Retry</button></div>}{success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

    {tab === 'identity' && <form onSubmit={save} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-2">
      {([['name','School name'],['motto','School motto'],['registrationNum','Registration number'],['address','Address'],['contactPhone','Contact phone'],['contactEmail','Email'],['website','Website'],['principalName','Principal name'],['establishedYear','Established year']] as const).map(([key,label]) => <label key={key} className="space-y-1 text-sm font-medium text-slate-700">{label}<input className={inputClass} type={key === 'contactEmail' ? 'email' : key === 'website' ? 'url' : key === 'establishedYear' ? 'number' : 'text'} value={(identity[key] as string | number | null | undefined) ?? ''} onChange={(e) => setIdentity((current) => ({ ...current, [key]: key === 'establishedYear' ? (e.target.value ? Number(e.target.value) : null) : e.target.value }))}/></label>)}
      </div><div className="space-y-2"><label className="block text-sm font-semibold">School logo (PNG, max 5 MB)<input type="file" accept="image/png,.png" className="mt-1 block w-full text-sm" onChange={(e) => void upload(e.target.files?.[0],'LOGO')}/></label>{identity.logoUrl && (brandingAssetIdFromPath(identity.logoUrl) ? <PrivateBrandingImage assetId={brandingAssetIdFromPath(identity.logoUrl)!} alt="Current school logo" className="h-20 max-w-48 object-contain"/> : <img src={identity.logoUrl} alt="Current school logo" className="h-20 max-w-48 object-contain"/>)}</div><SaveButton saving={saving}/></form>}

    {tab === 'stamp' && <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Official stamp</h2><p className="text-sm text-slate-500">Upload transparent PNG artwork. Replacements keep older files available to previously generated documents.</p><label className="block text-sm font-semibold">Upload stamp (PNG, max 5 MB)<input type="file" accept="image/png,.png" className="mt-1 block w-full text-sm" onChange={(e) => void upload(e.target.files?.[0],'STAMP')}/></label><AssetGrid assets={records.assets.filter((asset)=>asset.kind==='STAMP')} onToggle={toggleAsset}/></section>}

    {tab === 'colors' && <form onSubmit={save} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(colors).map(([key,value]) => <label key={key} className="space-y-1 text-sm font-medium capitalize text-slate-700">{key} color<div className="flex items-center gap-2"><input aria-label={`${key} color picker`} type="color" value={value} onChange={(e) => setColors((current) => ({...current,[key]:e.target.value}))} className="h-10 w-12 rounded border border-slate-300"/><input aria-label={`${key} hex value`} className={inputClass} value={value} pattern="^#[0-9a-fA-F]{6}$" onChange={(e) => setColors((current) => ({...current,[key]:e.target.value}))}/></div></label>)}</div><div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-4"><span className="w-full text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</span><button type="button" style={{backgroundColor:colors.primary}} className="rounded-lg px-4 py-2 text-sm font-bold text-white">Primary action</button><span style={{backgroundColor:colors.sidebar,color:colors.text,borderColor:colors.accent}} className="rounded-lg border px-4 py-2 text-sm">School workspace</span><span style={{backgroundColor:colors.accent}} className="rounded-lg px-4 py-2 text-sm font-semibold text-white">Accent</span></div><SaveButton saving={saving}/></form>}

    {tab === 'signatures' && (
      <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Staff signatures</h2>
        <p className="text-sm text-slate-500">A signature is assigned to a specific staff profile and designation. Staff with permission may manage their own signature; school administrators may manage school signatories.</p>
        {staffError && <div role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{staffError}<button type="button" className="ml-3 underline" onClick={() => void loadStaff()}>Retry staff list</button></div>}
        <label className="block text-sm font-medium">Signature image (PNG)<input type="file" accept="image/png,.png" className="mt-1 block w-full text-sm" onChange={(e) => void upload(e.target.files?.[0], 'SIGNATURE')} /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">Staff profile<select className={inputClass} disabled={staffLoading || !!staffError} value={staffProfileId} onChange={(e) => { setStaffProfileId(e.target.value); const person = staff.find((candidate) => candidate.id === e.target.value); setDisplayName(person ? `${person.firstName} ${person.lastName}` : ''); setDesignation(person?.jobTitle ?? ''); }}><option value="">{staffLoading ? 'Loading staff…' : staffError ? 'Staff list unavailable' : staff.length ? 'Select staff' : 'No active staff found'}</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}{person.jobTitle ? ` · ${person.jobTitle}` : ''}</option>)}</select></label>
          <label className="space-y-1 text-sm">Signature image<select className={inputClass} value={signatureAssetId} onChange={(e) => setSignatureAssetId(e.target.value)}><option value="">{records.assets.some((asset) => asset.kind === 'SIGNATURE' && asset.active) ? 'Select uploaded signature' : 'No active signature assets; upload one above'}</option>{records.assets.filter((asset) => asset.kind === 'SIGNATURE' && asset.active).map((asset) => <option key={asset.id} value={asset.id}>{asset.fileName}</option>)}</select></label>
          <label className="space-y-1 text-sm">Display name<input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></label>
          <label className="space-y-1 text-sm">Designation<input className={inputClass} value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Head of Mathematics" required /></label>
          <label className="space-y-1 text-sm">Valid from (optional)<input type="date" className={inputClass} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} /></label>
          <label className="space-y-1 text-sm">Valid until (optional)<input type="date" className={inputClass} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></label>
        </div>
        <SaveButton saving={saving} />
        <div className="divide-y">{records.signatures.map((signature) => <div key={signature.id} className="flex items-center justify-between py-3 text-sm"><span>{signature.displayName} · {signature.designation}</span><button type="button" onClick={() => void toggleSignature(signature)} className={isSignatureCurrent(signature) ? 'text-emerald-700' : 'text-slate-400'}>{isSignatureCurrent(signature) ? 'Active · Deactivate' : 'Inactive · Activate'}</button></div>)}</div>
      </form>
    )}

    {tab === 'templates' && <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold">Document templates</h2>
      <div className="grid gap-3 md:grid-cols-2"><label className="space-y-1 text-sm">Document type<select aria-label="Template document type" className={inputClass} disabled={!documentTypes.length} value={docType} onChange={(e)=>setDocType(e.target.value)}>{documentTypes.length?documentTypes.map((item)=><option key={item.documentType} value={item.documentType}>{item.title}</option>):<option value="">No supported document types available</option>}</select></label><label className="space-y-1 text-sm">Document title<input className={inputClass} value={docTitle} onChange={(e)=>setDocTitle(e.target.value)} required/></label></div>
      <div className="grid gap-3 md:grid-cols-2"><label className="space-y-1 text-sm">Header text<input className={inputClass} value={templateConfig.headerText} onChange={(e)=>setTemplateConfig((old)=>({...old,headerText:e.target.value}))}/></label><label className="space-y-1 text-sm">Footer text<input className={inputClass} value={templateConfig.footerText} onChange={(e)=>setTemplateConfig((old)=>({...old,footerText:e.target.value}))}/></label></div>
      <div className="flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={templateConfig.includeLogo} onChange={(e)=>setTemplateConfig((old)=>({...old,includeLogo:e.target.checked}))}/>Include school logo</label><label className="flex items-center gap-2"><input type="checkbox" checked={templateConfig.includeStamp} onChange={(e)=>setTemplateConfig((old)=>({...old,includeStamp:e.target.checked}))}/>Include official stamp</label></div>
      <div className="space-y-2"><div className="text-sm font-semibold">Signatory slots</div>{slots.map((slot,index)=><div key={index} className="grid gap-2 rounded border p-3 md:grid-cols-[1fr_1fr_auto_auto_auto]"><input className={inputClass} value={slot.designation} aria-label={`Signatory designation ${index+1}`} onChange={(e)=>setSlots((current)=>current.map((item,i)=>i===index?{...item,designation:e.target.value}:item))}/><select className={inputClass} aria-label={`Assigned signatory ${index+1}`} disabled={staffLoading||!!staffError} value={slot.staffProfileId??''} onChange={(e)=>setSlots((current)=>current.map((item,i)=>i===index?{...item,staffProfileId:e.target.value||null}:item))}><option value="">{staffLoading?'Loading staff…':staffError?'Staff list unavailable':'Choose staff signatory'}</option>{staff.map((person)=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</select><label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" checked={slot.enabled} onChange={(e)=>setSlots((current)=>current.map((item,i)=>i===index?{...item,enabled:e.target.checked,required:e.target.checked?item.required:false}:item))}/>Show</label><label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" checked={slot.required} disabled={!slot.enabled} onChange={(e)=>setSlots((current)=>current.map((item,i)=>i===index?{...item,required:e.target.checked}:item))}/>Required</label><button type="button" className="text-xs text-rose-700" onClick={()=>setSlots((current)=>current.filter((_,i)=>i!==index))}>Remove</button></div>)}{staffError&&<div role="alert" className="text-sm text-rose-700">{staffError}<button type="button" className="ml-2 underline" onClick={()=>void loadStaff()}>Retry</button></div>}<button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={()=>setSlots((current)=>[...current,{designation:'',required:false,enabled:true,staffProfileId:null}])}>Add signatory slot</button></div>
      <SaveButton saving={saving}/><div className="space-y-2">{records.templates.filter((template)=>documentTypes.some((item)=>item.documentType===template.documentType)).map((template)=><button type="button" key={template.id} onClick={()=>setDocType(template.documentType)} className={`block w-full rounded border p-3 text-left text-sm ${docType===template.documentType?'border-brand-500 bg-brand-50':''}`}><b>{template.title}</b><span className="ml-2 text-slate-500">{template.documentType}</span></button>)}</div>
    </form>}

    {tab === 'preview' && <div className="space-y-4"><label className="block max-w-sm space-y-1 text-sm">Preview document type<select aria-label="Preview document template" className={inputClass} disabled={!documentTypes.length} value={docType} onChange={(e) => setDocType(e.target.value)}>{documentTypes.length?documentTypes.map((item) => <option key={item.documentType} value={item.documentType}>{records.templates.find((template) => template.documentType === item.documentType)?.title ?? `${item.title} (not configured)`}</option>):<option value="">No supported document types available</option>}</select></label><BrandingTemplatePreview documentType={docType} title={docTitle} configured={!!selectedTemplate} configuration={templateConfig} slots={previewSlots} school={identity} primaryColor={colors.primary} accentColor={colors.accent} stampAssetId={previewStamp} /></div>}
  </div>;
};

const SaveButton: React.FC<{saving:boolean}> = ({saving}) => <div className="flex justify-end"><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={16}/>{saving?'Saving…':'Save changes'}</button></div>;
const AssetGrid: React.FC<{assets:Asset[];onToggle:(asset:Asset)=>void}> = ({assets,onToggle}) => <div className="grid gap-3 sm:grid-cols-2">{assets.map((asset)=><div key={asset.id} className="flex items-center gap-3 rounded-lg border p-3"><PrivateBrandingImage assetId={asset.id} alt={asset.fileName} className="h-16 w-16 object-contain"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{asset.fileName}</p><p className="text-xs text-slate-500">Uploaded {new Date(asset.createdAt).toLocaleDateString()}</p></div><button type="button" onClick={()=>onToggle(asset)} className="text-xs font-semibold text-brand-700">{asset.active?'Deactivate':'Activate'}</button></div>)}</div>;
