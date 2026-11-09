import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Copy, Check, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';

export interface TemporaryCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  staffEmail?: string | null;
  employeeNumber: string;
  temporaryPassword: string;
  isReset?: boolean;
}

export const TemporaryCredentialModal: React.FC<TemporaryCredentialModalProps> = ({
  isOpen,
  onClose,
  staffName,
  staffEmail,
  employeeNumber,
  temporaryPassword,
  isReset = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = temporaryPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReset ? 'New Temporary Credential Generated' : 'Temporary Account Credential'}
      description="Single-use activation credential for initial employee login"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Security Warning Banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-semibold">
              {isReset
                ? 'Previous credential has been invalidated.'
                : 'One-Time Security Display'}
            </p>
            <p className="text-amber-800 leading-relaxed">
              Please securely share this temporary password with the staff member.
              For system security, <strong>this temporary credential will not be displayed again</strong>.
              The staff member will be required to set their own permanent password on first login.
            </p>
          </div>
        </div>

        {/* Staff Details Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Staff Name:</span>
            <span className="font-semibold text-slate-900">{staffName}</span>
          </div>
          {staffEmail && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Account Email:</span>
              <span className="font-semibold text-slate-900">{staffEmail}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Employee Number:</span>
            <span className="font-mono font-bold text-slate-800">{employeeNumber}</span>
          </div>
        </div>

        {/* Temporary Credential Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Temporary Password / Single-Use OTP:
          </label>
          <div className="relative flex items-center justify-between rounded-xl border border-brand-300 bg-brand-50/40 p-3.5 shadow-inner">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <KeyRound className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="font-mono text-base font-bold text-brand-950 tracking-wider select-all break-all">
                {showPassword ? temporaryPassword : '••••••••••••••••'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/80 transition-colors"
                title={showPassword ? 'Hide credential' : 'Show credential'}
                aria-label={showPassword ? 'Hide credential' : 'Show credential'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            This credential expires upon password change or reset.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            I Have Saved This Credential — Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
