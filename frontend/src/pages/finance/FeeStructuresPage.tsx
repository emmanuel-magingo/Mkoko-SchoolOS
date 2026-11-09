import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { FeeStructure, FeeStructureStatus } from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { formatMoney, formatDate } from '../../utils/format';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Eye,
  CheckCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { PublishStructureModal } from './modals/PublishStructureModal';
import { CreateInvoiceModal } from './modals/CreateInvoiceModal';

export const FeeStructuresPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const isReadOnly = !canManageFinance;

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [publishingStructure, setPublishingStructure] = useState<FeeStructure | null>(null);
  const [invoicingStructure, setInvoicingStructure] = useState<FeeStructure | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStructures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; status?: string } = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await financeApi.getFeeStructures(params);
      setStructures(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStructures();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStructures]);

  const getStatusBadge = (status: FeeStructureStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge variant="success" size="sm" dot>
            PUBLISHED
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge variant="warning" size="sm" dot>
            DRAFT
          </Badge>
        );
      case 'ARCHIVED':
        return (
          <Badge variant="neutral" size="sm" dot>
            ARCHIVED
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fee Structures</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Class-level billing blueprints with itemized fee schedules and strict publishing immutability.
          </p>
        </div>

        {!isReadOnly ? (
          <Link
            to="/finance/fee-structures/new"
            className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Structure</span>
          </Link>
        ) : (
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Read-Only Mode</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search structure name, class level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-44 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Structures Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Structure Name</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Class Level</th>
                <th className="py-3 px-4">Term</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading fee structures...
                  </td>
                </tr>
              ) : structures.length > 0 ? (
                structures.map((fs) => (
                  <tr key={fs.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link
                        to={`/finance/fee-structures/${fs.id}`}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {fs.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{fs.academicYear}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">{fs.classLevel}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{fs.term || 'Annual / All'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatMoney(fs.totalAmount, fs.currency)}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(fs.status)}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(fs.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/finance/fee-structures/${fs.id}`}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {!isReadOnly && fs.status === 'DRAFT' && (
                          <button
                            onClick={() => setPublishingStructure(fs)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Publish Fee Structure"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {!isReadOnly && fs.status === 'PUBLISHED' && (
                          <button
                            onClick={() => setInvoicingStructure(fs)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Generate Invoice for Student"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No fee structures found. {!isReadOnly && 'Click "Create Fee Structure" to build one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publish Structure Confirmation Modal */}
      {publishingStructure && (
        <PublishStructureModal
          isOpen={!!publishingStructure}
          onClose={() => setPublishingStructure(null)}
          structure={publishingStructure}
          onSuccess={(updated) => {
            fetchStructures();
            setSuccessMessage(`Fee structure "${updated.name}" was published successfully.`);
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}

      {/* Quick Generate Invoice Modal from Published Structure */}
      {invoicingStructure && (
        <CreateInvoiceModal
          isOpen={!!invoicingStructure}
          onClose={() => setInvoicingStructure(null)}
          preselectedStructureId={invoicingStructure.id}
          onSuccess={() => {
            setSuccessMessage('Student invoice generated successfully.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
};
