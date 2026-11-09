import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { FinanceDashboardSummary } from '../../types/finance.types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatMoney, formatDate } from '../../utils/format';
import {
  Coins,
  Receipt,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Eye,
  Clock,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { CreateInvoiceModal } from './modals/CreateInvoiceModal';
import { AnalyticsPanel, HorizontalBars, TrendLine } from '../../components/common/AnalyticsCharts';

export const FinanceDashboardPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const isReadOnly = !canManageFinance;

  const [summary, setSummary] = useState<FinanceDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'overdue' | 'payments' | 'receipts' | 'activity'>('overview');
  const currency = summary?.currency ?? 'TZS';
  const collectionPoints = (summary?.collectionsByMonth ?? []).map((item) => ({
    label: new Date(`${item.period}-01T00:00:00`).toLocaleDateString('en', { month: 'short', year: '2-digit' }),
    period: item.period,
    value: item.amount,
  }));
  const invoicedPoints = (summary?.invoicedByMonth ?? []).map((item) => ({
    label: new Date(`${item.period}-01T00:00:00`).toLocaleDateString('en', { month: 'short', year: '2-digit' }),
    value: item.amount,
  }));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getDashboardSummary();
      setSummary(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial operations summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATED') || action.includes('PUBLISHED') || action.includes('RECORDED')) {
      return 'success';
    }
    if (action.includes('VOIDED') || action.includes('ARCHIVED')) {
      return 'danger';
    }
    return 'info';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Finance Operations Dashboard</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational fee governance, collection analytics, overdue tracking, and audit-safe financial ledgers.
          </p>
        </div>

        {!isReadOnly ? (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
            <Link
              to="/finance/fee-structures/new"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>New Fee Structure</span>
            </Link>
          </div>
        ) : (
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Read-Only Oversight</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Operational Metrics Cards (Section 3: Summary) */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Invoiced"
          value={loading ? '...' : formatMoney(summary?.totalInvoiced ?? 0, currency)}
          subtitle={`${summary?.invoicesCount ?? 0} issued invoices; excludes drafts`}
          icon={Receipt}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />

        <StatCard
          title="Total Collected"
          value={loading ? '...' : formatMoney(summary?.totalCollected ?? 0, currency)}
          subtitle="Reconciled payments & collections"
          icon={CreditCard}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Outstanding Balance"
          value={loading ? '...' : formatMoney(summary?.outstandingBalance ?? 0, currency)}
          subtitle={`${summary?.outstandingInvoicesCount ?? 0} unpaid / partial obligations`}
          icon={Coins}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />

        <StatCard
          title="Overdue Amount"
          value={loading ? '...' : formatMoney(summary?.overdueAmount ?? 0, currency)}
          subtitle={`${summary?.overdueInvoicesCount ?? 0} invoices past due`}
          icon={AlertTriangle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />

        <StatCard
          title="Collection Rate"
          value={loading ? '...' : `${summary?.collectionRate ?? 0}%`}
          subtitle={`${summary?.overdueInvoicesCount ?? 0} overdue invoices require attention`}
          icon={TrendingUp}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500" role="status">
          Loading financial analytics...
        </div>
      ) : error ? null : (
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <AnalyticsPanel title="Collections Trend" subtitle={`Recorded payments received by month (${currency}).`}>
            <TrendLine
              points={collectionPoints}
              color="#059669"
              suffix=""
              formatValue={(amount) => formatMoney(amount, currency)}
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Invoices by Issue Month" subtitle={`Amounts invoiced per month, not cash collected (${currency}).`}>
            <HorizontalBars
              points={invoicedPoints}
              color="#2563eb"
              formatValue={(amount) => formatMoney(amount, currency)}
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Invoice Status Overview" subtitle="Current status counts; overdue is a subset of unpaid or partially paid invoices.">
            <HorizontalBars
              points={[
                { label: 'Paid', value: summary?.invoiceStatusCounts.paid ?? 0 },
                { label: 'Unpaid', value: summary?.invoiceStatusCounts.unpaid ?? 0 },
                { label: 'Partially paid', value: summary?.invoiceStatusCounts.partiallyPaid ?? 0 },
                { label: 'Overdue', value: summary?.invoiceStatusCounts.overdue ?? 0 },
              ]}
              color="#d97706"
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Payments by Method" subtitle="Recorded payments by stored payment method.">
            <HorizontalBars
              points={(summary?.paymentsByMethod ?? []).map((payment) => ({
                label: payment.method.replace('_', ' '),
                value: payment.amount,
                detail: `${payment.count} payment${payment.count === 1 ? '' : 's'}`,
              }))}
              color="#7c3aed"
              formatValue={(amount) => formatMoney(amount, currency)}
            />
          </AnalyticsPanel>
        </div>
      )}

      {/* Operational Section Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Operations Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Overdue Invoices</span>
          {(summary?.overdueInvoicesCount ?? 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-black">
              {summary?.overdueInvoicesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Recent Payments</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'receipts'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Recent Receipts</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'activity'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Financial Audit Activity</span>
        </button>
      </div>

      {/* Tab: Overview (Dual Column: Recent Invoices & Recent Payments) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overdue / Outstanding Invoices Snapshot */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Outstanding & Overdue Invoices</span>
                </h3>
                <p className="text-[11px] text-slate-400">Invoices with outstanding balances</p>
              </div>
              <Link
                to="/finance/invoices?status=OUTSTANDING"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Balance</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : summary?.overdueInvoices && summary.overdueInvoices.length > 0 ? (
                    summary.overdueInvoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 text-[11px]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800">
                            {inv.student.firstName} {inv.student.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{inv.student.admissionNumber}</p>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-600 text-[11px]">
                          {formatMoney(inv.balance, inv.currency)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            OVERDUE
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/finance/invoices/${inv.id}`}
                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg inline-flex items-center transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No overdue invoices found. All fee collections are up to date!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments Snapshot */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Recent Payments</span>
                </h3>
                <p className="text-[11px] text-slate-400">Reconciled receipts & transactions</p>
              </div>
              <Link
                to="/finance/payments"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Receipt / Ref</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Loading payments...
                      </td>
                    </tr>
                  ) : summary?.recentPayments && summary.recentPayments.length > 0 ? (
                    summary.recentPayments.slice(0, 5).map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-mono font-bold text-slate-900 text-[11px]">
                            {pay.receipt?.receiptNumber || pay.reference}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatDate(pay.receivedAt)}</p>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {pay.student.firstName} {pay.student.lastName}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700 text-[11px]">
                          {formatMoney(pay.amount, pay.currency)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pay.status === 'VOIDED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/finance/receipts/${pay.id}`}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg inline-flex items-center transition-colors"
                            title="View Digital Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Overdue Invoices (Section 3 & 5) */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Overdue Invoices List</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Server-authoritative records where Due Date &lt; Current Date and Balance &gt; 0
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {summary?.overdueInvoicesCount ?? 0} Overdue
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.overdueInvoices && summary.overdueInvoices.length > 0 ? (
                  summary.overdueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link to={`/finance/invoices/${inv.id}`} className="hover:text-brand-600">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">
                          {inv.student.firstName} {inv.student.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{inv.student.admissionNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {inv.student.class?.name || 'Assigned'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-rose-600 font-mono">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {formatMoney(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700">
                        {formatMoney(inv.paidAmount, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-rose-600">
                        {formatMoney(inv.balance, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          OVERDUE
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/finance/invoices/${inv.id}`}
                          className="px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold rounded-lg hover:bg-brand-100 transition-colors text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Pay</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No overdue invoices. Outstanding fees are being collected on schedule!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Recent Payments (Section 3: Recent Payments) */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                <span>Reconciled Payments Ledger</span>
              </h3>
              <p className="text-[11px] text-slate-400">Historical transactions and void records</p>
            </div>
            <Link
              to="/finance/payments"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Full Payments Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.recentPayments && summary.recentPayments.length > 0 ? (
                  summary.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.receipt?.receiptNumber || 'RECEIPT'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(p.receivedAt)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {p.student.firstName} {p.student.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{p.reference}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {formatMoney(p.amount, p.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'VOIDED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/finance/receipts/${p.id}`}
                          className="px-2.5 py-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Recent Receipts (Section 3: Recent Receipts) */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-600" />
                <span>Recent Issued Receipts</span>
              </h3>
              <p className="text-[11px] text-slate-400">Digital receipts verified with financial integrity</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">Date Issued</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4 text-right">Digital Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.recentReceipts && summary.recentReceipts.length > 0 ? (
                  summary.recentReceipts.map((rcp) => (
                    <tr key={rcp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {rcp.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(rcp.issuedAt)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {rcp.payment?.student
                          ? `${rcp.payment.student.firstName} ${rcp.payment.student.lastName}`
                          : 'Student'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {formatMoney(rcp.amount, rcp.currency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {rcp.payment?.invoice?.invoiceNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/finance/receipts/${rcp.paymentId}`}
                          className="px-2.5 py-1 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View & Print</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No digital receipts issued yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Recent Financial Activity (Section 3: Recent Financial Activity) */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Financial Audit Stream</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Immutable audit trail of category, structure, invoice, payment, and void actions
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.recentFinancialActivity && summary.recentFinancialActivity.length > 0 ? (
                  summary.recentFinancialActivity.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {log.entityType}:{log.entityId ? log.entityId.substring(0, 8) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px] font-mono truncate max-w-xs">
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No financial audit logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
};
