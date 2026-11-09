import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { financeApi } from '../../api/finance.api';
import { Payment } from '../../types/finance.types';
import { formatMoney, formatDate } from '../../utils/format';
import { BrandingImageFromPath } from '../../components/common/PrivateBrandingImage';
import {
  Printer,
  ArrowLeft,
  AlertCircle,
  Ban,
} from 'lucide-react';

export const DigitalReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useAuth();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await financeApi.getPayment(id);
        setPayment(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load receipt details');
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading digital receipt...</span>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Receipt Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'Unable to load payment or receipt records.'}</p>
        <Link
          to="/finance/payments"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payments</span>
        </Link>
      </div>
    );
  }

  const isVoided = payment.status === 'VOIDED';
  const branding = (payment.receipt?.brandingSnapshot ?? {}) as {
    school?: { name?: string; logoUrl?: string | null; address?: string | null; contactEmail?: string | null; contactPhone?: string | null; motto?: string | null };
    assets?: Array<{ id: string; kind: string; contentPath: string }>;
    signatories?: Array<{ designation: string; required: boolean; displayName?: string; contentPath?: string; missing?: boolean }>;
    template?: { configuration?: { includeLogo?: boolean; includeStamp?: boolean } } | null;
    colors?: { primary?: string } | null;
  };
  const receiptLogo = branding.template?.configuration?.includeLogo === false ? undefined : branding.assets?.find((asset) => asset.kind === 'LOGO')?.contentPath || branding.school?.logoUrl;
  const receiptStamp = branding.template?.configuration?.includeStamp === false ? undefined : branding.assets?.find((asset) => asset.kind === 'STAMP');
  const receiptPrimaryColor = /^#[0-9a-fA-F]{6}$/.test(branding.colors?.primary ?? '') ? branding.colors!.primary! : undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Non-Printable Top Navigation & Controls */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/finance/invoices/${payment.invoice.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoice</span>
        </Link>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md space-y-6 print:border-none print:shadow-none print:p-0 relative overflow-hidden">
        {/* Void Watermark if voided */}
        {isVoided && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <span className="text-8xl font-black text-rose-700 -rotate-45 select-none tracking-widest">
              VOIDED
            </span>
          </div>
        )}

        {/* School Header */}
        <div className="text-center space-y-1.5 border-b border-slate-200 pb-5">
          {receiptLogo ? <BrandingImageFromPath src={receiptLogo} alt={`${branding.school?.name || tenant?.name || 'School'} logo`} className="mx-auto h-10 max-w-36 object-contain"/> : <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-lg mx-auto shadow-sm">M</div>}
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase" style={receiptPrimaryColor ? {color:receiptPrimaryColor}:undefined}>
            {branding.school?.name || tenant?.name || 'School'}
          </h1>
          <p className="text-xs text-slate-500">School Code: {tenant?.code || 'SCH-001'}</p>
          {(branding.school?.address || branding.school?.contactPhone || branding.school?.contactEmail) && <p className="text-xs text-slate-500">{[branding.school.address,branding.school.contactPhone,branding.school.contactEmail].filter(Boolean).join(' · ')}</p>}
          {branding.school?.motto && <p className="text-xs italic text-slate-500">{branding.school.motto}</p>}
          <div className="pt-2">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded-full font-bold text-xs uppercase tracking-wider">
              {isVoided ? 'VOIDED RECEIPT' : 'OFFICIAL DIGITAL RECEIPT'}
            </span>
          </div>
        </div>

        {receiptStamp && <BrandingImageFromPath src={receiptStamp.contentPath} alt="Official school stamp" className="absolute right-8 top-24 h-16 w-16 object-contain"/>}
        {branding.template?.configuration?.includeStamp === true && !receiptStamp && <p className="text-center text-xs text-amber-700">Stamp is enabled in this receipt template but no active stamp is available.</p>}

        {isVoided && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <Ban className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">THIS RECEIPT IS VOIDED</p>
              {payment.voidReason && <p className="text-[11px] mt-0.5">Reason: {payment.voidReason}</p>}
            </div>
          </div>
        )}

        {/* Receipt Key Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Receipt No:</span>
            <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
              {payment.receipt?.receiptNumber || 'SCHOOL-RCP-PENDING'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-slate-400">Date Issued:</span>
            <p className="font-semibold text-slate-800 mt-0.5">{formatDate(payment.receivedAt)}</p>
          </div>

          <div>
            <span className="text-slate-400">Payment Reference:</span>
            <p className="font-mono font-semibold text-slate-800 mt-0.5">{payment.reference}</p>
          </div>

          <div className="text-right">
            <span className="text-slate-400">Payment Method:</span>
            <p className="font-semibold text-slate-800 mt-0.5">{payment.paymentMethod}</p>
          </div>

          <div>
            <span className="text-slate-400">Payment Status:</span>
            <p className="mt-0.5">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                  isVoided
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isVoided ? 'VOIDED' : 'PAID'}
              </span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-slate-400">Received By:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {payment.receipt?.issuedBy
                ? `${payment.receipt.issuedBy.firstName} ${payment.receipt.issuedBy.lastName}`
                : 'Bursar Office'}
            </p>
          </div>
        </div>

        {/* Student Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Student Information
          </span>
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900 text-sm">
              {payment.student.firstName} {payment.student.lastName}
            </p>
            <p className="font-mono font-semibold text-slate-600 text-xs">
              Adm: {payment.student.admissionNumber}
            </p>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
            <span>Class / Stream:</span>
            <span className="font-semibold text-slate-800">
              {payment.student.class?.name || 'Class Assigned'}
            </span>
          </div>
        </div>

        {/* Amount Big Display */}
        <div
          className={`p-5 rounded-2xl text-center space-y-1 ${
            isVoided
              ? 'bg-slate-100 border border-slate-200'
              : 'bg-emerald-50/70 border border-emerald-200'
          }`}
        >
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isVoided ? 'text-slate-500' : 'text-emerald-800'
            }`}
          >
            Amount {isVoided ? 'Reversed / Voided' : 'Received'}
          </span>
          <h2
            className={`text-3xl font-black font-mono ${
              isVoided ? 'text-slate-500 line-through' : 'text-emerald-900'
            }`}
          >
            {formatMoney(payment.amount, payment.currency)}
          </h2>
          <p className={`text-[11px] ${isVoided ? 'text-slate-400' : 'text-emerald-700'}`}>
            Currency: {payment.currency || 'TZS'}
          </p>
        </div>

        {/* Linked Invoice Details */}
        <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
          <div className="flex justify-between text-slate-600">
            <span>Settled Towards Invoice:</span>
            <span className="font-mono font-bold text-slate-800">{payment.invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Invoice Total Amount:</span>
            <span className="font-mono text-slate-800">
              {formatMoney(payment.invoice.totalAmount, payment.currency)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Invoice Remaining Balance:</span>
            <span className="font-mono font-bold text-rose-700">
              {formatMoney(payment.invoice.balance, payment.currency)}
            </span>
          </div>
        </div>

        {/* Footer Audit Signature */}
        {branding.signatories && branding.signatories.length > 0 && <div className="grid grid-cols-2 gap-5 border-t border-slate-100 pt-4">{branding.signatories.map((signatory,index)=><div key={`${signatory.designation}-${index}`} className="border-b border-slate-400 pb-2 text-center">{signatory.contentPath?<><BrandingImageFromPath src={signatory.contentPath} alt={`${signatory.displayName} signature`} className="mx-auto h-9 max-w-28 object-contain"/><p className="text-xs font-semibold">{signatory.displayName}</p></>:<p className="py-3 text-[10px] text-amber-700">{signatory.required?'Required ':''}{signatory.designation} signature unavailable</p>}<p className="text-[10px] text-slate-500">{signatory.designation}</p></div>)}</div>}
        <div className="pt-6 border-t border-slate-200 text-center space-y-2">
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>Cashier / Bursar: Received via SchoolOS</span>
            <span className="font-mono">Payment Ref: {payment.reference}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            This digital receipt is generated automatically by Mkoko SchoolOS and is historically preserved.
          </p>
        </div>
      </div>
    </div>
  );
};

