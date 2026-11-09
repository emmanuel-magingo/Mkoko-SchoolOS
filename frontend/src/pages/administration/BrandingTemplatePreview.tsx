import React from 'react';
import { brandingAssetIdFromPath, PrivateBrandingImage } from '../../components/common/PrivateBrandingImage';

export interface BrandingPreviewSlot {
  designation: string;
  required: boolean;
  enabled: boolean;
  displayName?: string;
  assetId?: string;
}

export interface BrandingTemplatePreviewProps {
  documentType: string;
  title: string;
  configured: boolean;
  configuration: { headerText: string; footerText: string; includeLogo: boolean; includeStamp: boolean };
  slots: BrandingPreviewSlot[];
  school: { name?: string | null; address?: string | null; contactPhone?: string | null; motto?: string | null; logoUrl?: string | null };
  primaryColor: string;
  accentColor: string;
  stampAssetId?: string;
}

export const BrandingTemplatePreview: React.FC<BrandingTemplatePreviewProps> = ({
  documentType, title, configured, configuration, slots, school, primaryColor, accentColor, stampAssetId,
}) => (
  <section className="mx-auto max-w-3xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <header>
      <h2 className="font-semibold">Document preview</h2>
      <p className="text-sm text-slate-500">This preview uses the selected template and sample-only content.</p>
    </header>
    {!configured && <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No {documentType === 'REPORT_CARD' ? 'report card' : 'fee receipt'} template has been saved yet. This preview shows sample layout only. Configure and save this document type in Document Templates.</div>}
    <article data-testid="branding-document-preview" data-document-type={documentType} className="mx-auto max-w-3xl space-y-5 border p-8 shadow-sm" style={{ borderColor: accentColor }}>
      <header className="border-b-2 pb-4 text-center" style={{ borderColor: primaryColor }}>
        {configuration.includeLogo && school.logoUrl && (brandingAssetIdFromPath(school.logoUrl) ? <PrivateBrandingImage assetId={brandingAssetIdFromPath(school.logoUrl)!} alt="School logo" className="mx-auto mb-2 h-16 max-w-40 object-contain" /> : <img src={school.logoUrl} alt="School logo" className="mx-auto mb-2 h-16 max-w-40 object-contain" />)}
        <h2 className="text-xl font-bold" style={{ color: primaryColor }}>{school.name || 'School Name'}</h2>
        <p>{school.address || 'School address'} · {school.contactPhone || 'Contact phone'}</p>
        {configuration.headerText && <p>{configuration.headerText}</p>}
        {school.motto && <p className="italic">{school.motto}</p>}
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="text-xs text-slate-500">Sample preview · {new Date().toLocaleDateString()}</p>
      </header>
      {documentType === 'REPORT_CARD' ? (
        <div className="rounded border p-4"><h4 className="font-semibold">Sample academic summary</h4><p className="mt-2 text-sm">Student: Amina Example · Class: Sample Class · Term: Sample Term</p><div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm"><span className="rounded bg-slate-50 p-2">Mathematics · A</span><span className="rounded bg-slate-50 p-2">English · B+</span><span className="rounded bg-slate-50 p-2">Science · A-</span></div></div>
      ) : (
        <div className="rounded border p-4"><h4 className="font-semibold">Sample fee receipt</h4><p className="mt-2 text-sm">Student: Amina Example · Reference: SAMPLE-0001</p><p className="mt-1 text-sm">Amount: TSh 50,000 · Status: Sample only</p></div>
      )}
      {slots.some((slot) => slot.enabled) && <div className="grid grid-cols-2 gap-6 pt-2">{slots.filter((slot) => slot.enabled).map((slot, index) => <div key={`${slot.designation}-${index}`} className="min-h-24 border-b border-slate-400 text-center">{slot.assetId ? <><PrivateBrandingImage assetId={slot.assetId} alt={`${slot.displayName || slot.designation} signature`} className="mx-auto h-12 max-w-40 object-contain" /><div className="font-semibold">{slot.displayName}</div></> : <div className="mt-8 text-xs text-amber-700">{slot.required ? 'Required ' : ''}{slot.designation} signature unavailable</div>}<div className="mt-1 text-xs text-slate-600">{slot.designation}</div></div>)}</div>}
      {configuration.includeStamp && (stampAssetId ? <PrivateBrandingImage assetId={stampAssetId} alt="Official school stamp" className="mx-auto h-24 w-24 object-contain" /> : <p className="text-center text-xs text-amber-700">Stamp enabled, but no active stamp is uploaded.</p>)}
      {configuration.footerText && <footer className="border-t pt-3 text-center text-xs text-slate-500">{configuration.footerText}</footer>}
    </article>
  </section>
);
