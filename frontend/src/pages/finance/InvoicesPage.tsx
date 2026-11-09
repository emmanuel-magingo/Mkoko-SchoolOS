import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { Invoice } from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { formatMoney, formatDate } from '../../utils/format';
import {
  Receipt,
  Search,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CreateInvoiceModal } from './modals/CreateInvoiceModal';
import { RecordPaymentModal } from './modals/RecordPaymentModal';

export const InvoicesPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const canRecordPayment = hasPermission(Permissions.RECORD_PAYMENT);
  const isReadOnly = !canManageFinance;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('');
  const [termFilter, setTermFilter] = useState<string>('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: {
        search?: string;
        status?: string;
        academicYear?: number;
        term?: string;
      } = {};

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (academicYearFilter) params.academicYear = Number(academicYearFilter);
      if (termFilter) params.term = termFilter;

      const res = await financeApi.getInvoices(params);
      setInvoices(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, academicYearFilter, termFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const isOverdue = (inv: Invoice) => {
    if (!inv.dueDate) return false;
    const isPastDue = new Date(inv.dueDate) < new Date();
    const hasBalance = Number(inv.balance) > 0;
    const isNotClosed = inv.status !== 'PAID' && inv.status !== 'VOID';
    return isPastDue && hasBalance && isNotClosed;
  };

  const getStatusBadge = (inv: Invoice) => {
    if (isOverdue(inv)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
          OVERDUE
        </span>
      );
    }

    switch (inv.status) {
      case 'PAID':
        return (
          <Badge variant="success" size="sm" dot>
            PAID
          </Badge>
        );
      case 'PARTIALLY_PAID':
        return (
          <Badge variant="warning" size="sm" dot>
            PARTIAL
          </Badge>
        );
      case 'ISSUED':
        return (
          <Badge variant="info" size="sm" dot>
            ISSUED
          </Badge>
        );
      case 'VOID':
        return (
          <Badge variant="danger" size="sm" dot>
            VOID
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm" dot>
            {inv.status}
          </Badge>
        );
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAcademicYearFilter('');
    setTermFilter('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Invoices</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative billing ledgers, overdue tracking, fee structures, and outstanding balances.
          </p>
        </div>

        {!isReadOnly ? (
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
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

      {/* Filter Tabs (Section 5: All, Outstanding, Overdue, Paid) */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            statusFilter === 'all'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Invoices
        </button>
        <button
          onClick={() => setStatusFilter('OUTSTANDING')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            statusFilter === 'OUTSTANDING'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Outstanding
        </button>
        <button
          onClick={() => setStatusFilter('OVERDUE')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1 ${
            statusFilter === 'OVERDUE'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Overdue</span>
        </button>
        <button
          onClick={() => setStatusFilter('PAID')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            statusFilter === 'PAID'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setStatusFilter('PARTIALLY_PAID')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            statusFilter === 'PARTIALLY_PAID'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Partially Paid
        </button>
        <button
          onClick={() => setStatusFilter('ISSUED')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            statusFilter === 'ISSUED'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Issued
        </button>
        <button
          onClick={() => setStatusFilter('VOID')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            statusFilter === 'VOID'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Void
        </button>
      </div>

      {/* Filter / Search Bar (Section 6: Search, Academic Year, Term) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, admission number, invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={academicYearFilter}
          onChange={(e) => setAcademicYearFilter(e.target.value)}
          className="w-full md:w-36 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Years</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>

        <select
          value={termFilter}
          onChange={(e) => setTermFilter(e.target.value)}
          className="w-full md:w-36 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Terms</option>
          <option value="TERM_1">Term 1</option>
          <option value="TERM_2">Term 2</option>
          <option value="TERM_3">Term 3</option>
          <option value="ANNUAL">Annual</option>
        </select>

        {(search || statusFilter !== 'all' || academicYearFilter || termFilter) && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Year/Term</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        to={`/finance/invoices/${inv.id}`}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/finance/students/${inv.student.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block"
                      >
                        {inv.student.firstName} {inv.student.lastName}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {inv.student.admissionNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {inv.student.class?.name ? (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {inv.student.class.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {inv.academicYear} {inv.term ? `• ${inv.term}` : ''}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-mono ${
                        isOverdue(inv) ? 'text-rose-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {formatMoney(inv.totalAmount, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                      {formatMoney(inv.paidAmount, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-rose-600">
                      {formatMoney(inv.balance, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(inv)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canRecordPayment && Number(inv.balance) > 0 && inv.status !== 'VOID' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                            title="Record Payment for Invoice"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                        <Link
                          to={`/finance/invoices/${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View Invoice Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No invoices found. {!isReadOnly && 'Click "Generate Invoice" to issue one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={() => {
          fetchInvoices();
          setSuccessMessage('Student invoice generated successfully.');
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

      {/* Record Payment Modal */}
      {payingInvoice && (
        <RecordPaymentModal
          isOpen={!!payingInvoice}
          onClose={() => setPayingInvoice(null)}
          invoice={payingInvoice}
          onSuccess={() => {
            fetchInvoices();
            setSuccessMessage(`Payment recorded successfully for invoice ${payingInvoice.invoiceNumber}.`);
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
};
