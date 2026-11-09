import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { Payment } from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { formatMoney, formatDate } from '../../utils/format';
import {
  CreditCard,
  Search,
  Receipt,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { VoidPaymentModal } from './modals/VoidPaymentModal';

export const PaymentsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const isReadOnly = !canManageFinance;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [voidingPayment, setVoidingPayment] = useState<Payment | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; status?: string } = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await financeApi.getPayments(params);
      setPayments(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payments & Receipts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-reconciled financial transactions, digital receipts, and irreversible payment void records.
          </p>
        </div>

        {isReadOnly && (
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
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
            placeholder="Search receipt number, student name, reference..."
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
          <option value="RECORDED">Recorded</option>
          <option value="VOIDED">Voided</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        to={`/finance/receipts/${p.id}`}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {p.receipt?.receiptNumber || 'RECEIPT'}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(p.receivedAt)}</td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/finance/students/${p.student.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block"
                      >
                        {p.student.firstName} {p.student.lastName}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.student.admissionNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <Link
                        to={`/finance/invoices/${p.invoice.id}`}
                        className="text-brand-600 hover:underline font-semibold"
                      >
                        {p.invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.reference}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === 'RECORDED' ? 'success' : 'danger'} size="sm" dot>
                        {p.status}
                      </Badge>
                      {p.status === 'VOIDED' && p.voidReason && (
                        <p className="text-[10px] text-rose-500 italic mt-0.5">
                          Void: {p.voidReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/finance/receipts/${p.id}`}
                          className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          title="View Digital Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt</span>
                        </Link>

                        {!isReadOnly && p.status === 'RECORDED' && (
                          <button
                            onClick={() => setVoidingPayment(p)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Void Payment"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Payment Modal */}
      {voidingPayment && (
        <VoidPaymentModal
          isOpen={!!voidingPayment}
          onClose={() => setVoidingPayment(null)}
          payment={voidingPayment}
          onSuccess={() => {
            fetchPayments();
            setSuccessMessage('Payment voided and balance restored successfully.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
};
