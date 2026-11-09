import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { FeeStructure } from '../../../types/finance.types';
import { financeApi } from '../../../api/finance.api';
import { formatMoney } from '../../../utils/format';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface PublishStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure: FeeStructure;
  onSuccess: (updated: FeeStructure) => void;
}

export const PublishStructureModal: React.FC<PublishStructureModalProps> = ({
  isOpen,
  onClose,
  structure,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await financeApi.publishFeeStructure(structure.id);
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish fee structure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Fee Structure?"
      description="Authorize fee structure for live billing and student invoicing."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Important Financial Notice</p>
            <p className="text-[11px] leading-relaxed">
              Once published, the fee structure and its financial items <strong>cannot be edited or deleted</strong>.
              It will become immediately available for student invoice generation across{' '}
              <strong>{structure.classLevel}</strong> for academic year <strong>{structure.academicYear}</strong>.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Structure Name:</span>
            <span className="font-bold text-slate-800">{structure.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Class & Year:</span>
            <span className="font-medium text-slate-700">
              {structure.classLevel} — {structure.academicYear} {structure.term ? `(${structure.term})` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Items:</span>
            <span className="font-medium text-slate-700">{structure.items?.length || 0} line items</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="font-bold text-slate-700">Total Authorized Amount:</span>
            <span className="font-mono font-black text-emerald-700 text-sm">
              {formatMoney(structure.totalAmount, structure.currency)}
            </span>
          </div>
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
            type="button"
            disabled={loading}
            onClick={handlePublish}
            className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? 'Publishing...' : 'Yes, Publish Fee Structure'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
