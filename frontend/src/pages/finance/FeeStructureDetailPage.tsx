import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { FeeStructure } from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { formatMoney, formatDate } from '../../utils/format';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  Archive,
  ShieldCheck,
} from 'lucide-react';
import { PublishStructureModal } from './modals/PublishStructureModal';
import { CreateInvoiceModal } from './modals/CreateInvoiceModal';

export const FeeStructureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const isReadOnly = !canManageFinance;

  const [structure, setStructure] = useState<FeeStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fetchStructure = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getFeeStructure(id);
      setStructure(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fee structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructure();
  }, [id]);

  const handleArchive = async () => {
    if (!structure) return;
    if (!window.confirm(`Archive fee structure "${structure.name}"? It will no longer be available for new billings.`)) {
      return;
    }

    try {
      const res = await financeApi.archiveFeeStructure(structure.id);
      setStructure(res.data);
      setSuccessMessage('Fee structure archived successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive fee structure');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading fee structure details...</span>
      </div>
    );
  }

  if (error || !structure) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Structure Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'Unable to locate the requested fee structure.'}</p>
        <Link
          to="/finance/fee-structures"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fee Structures</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <Link
        to="/finance/fee-structures"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Fee Structures</span>
      </Link>

      {/* Action Notices */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Badge
                variant={
                  structure.status === 'PUBLISHED'
                    ? 'success'
                    : structure.status === 'DRAFT'
                    ? 'warning'
                    : 'neutral'
                }
                size="md"
                dot
              >
                {structure.status}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                Created: {formatDate(structure.createdAt)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{structure.name}</h2>
          </div>

          {/* Action Buttons based on status & role */}
          {!isReadOnly ? (
            <div className="flex items-center gap-2">
              {structure.status === 'DRAFT' && (
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Publish Structure</span>
                </button>
              )}

              {structure.status === 'PUBLISHED' && (
                <>
                  <button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Student Invoice</span>
                  </button>

                  <button
                    onClick={handleArchive}
                    className="px-3 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    title="Archive Structure"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Read-Only Oversight</span>
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400">Class Level:</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{structure.classLevel}</p>
          </div>
          <div>
            <span className="text-slate-400">Academic Year:</span>
            <p className="font-bold text-slate-900 font-mono text-sm mt-0.5">{structure.academicYear}</p>
          </div>
          <div>
            <span className="text-slate-400">Term:</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{structure.term || 'Annual'}</p>
          </div>
          <div>
            <span className="text-slate-400">Total Authorized:</span>
            <p className="font-black text-emerald-700 font-mono text-base mt-0.5">
              {formatMoney(structure.totalAmount, structure.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Line Items Breakdown</h3>
          <span className="text-xs text-slate-400">{structure.items?.length || 0} Fee Categories</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Item Note</th>
                <th className="py-3 px-4 text-right">Amount (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {structure.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                      {item.feeCategory?.code || '—'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {item.feeCategory?.name || 'Unknown Category'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {item.description || <span className="text-slate-300 italic">—</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                    {formatMoney(item.amount, structure.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                  Total Blueprint Amount:
                </td>
                <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-right text-sm">
                  {formatMoney(structure.totalAmount, structure.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Publish Structure Confirmation Modal */}
      {isPublishModalOpen && (
        <PublishStructureModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          structure={structure}
          onSuccess={(updated) => {
            setStructure(updated);
            setSuccessMessage(`Fee structure "${updated.name}" is now PUBLISHED and available for live student invoicing.`);
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}

      {/* Generate Invoice Modal */}
      {isInvoiceModalOpen && (
        <CreateInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          preselectedStructureId={structure.id}
          onSuccess={() => {
            setSuccessMessage('Student invoice generated successfully.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
};
