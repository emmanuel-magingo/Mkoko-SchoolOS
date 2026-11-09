import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Payment } from '../../../types/finance.types';
import { financeApi } from '../../../api/finance.api';
import { formatMoney } from '../../../utils/format';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface VoidPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onSuccess: (updatedPayment: Payment) => void;
}

export const VoidPaymentModal: React.FC<VoidPaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Void reason must be at least 5 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await financeApi.voidPayment(payment.id, {
        reason: reason.trim(),
      });

      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Financial Payment"
      description="Irreversible financial audit operation. Restores invoice balance."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Are you sure you want to void this payment?</p>
            <p className="text-[11px] leading-relaxed">
              This action is strictly irreversible and will be logged in the permanent school audit trail.
              The amount of <strong>{formatMoney(payment.amount, payment.currency)}</strong> will be credited back
              to invoice #{payment.invoice?.invoiceNumber || '—'}.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Audit Reason for Void <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify reason (e.g. Cheque bounced, entered wrong receipt amount, duplicate payment record)..."
            minLength={5}
            maxLength={500}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
          />
          <p className="text-[11px] text-slate-400">Minimum 5 characters required for compliance.</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || reason.trim().length < 5}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? 'Voiding Payment...' : 'Confirm Void Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
