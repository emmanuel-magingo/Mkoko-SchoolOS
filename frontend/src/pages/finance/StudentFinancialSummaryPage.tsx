import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { StudentFinancialSummary, Invoice } from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { formatMoney, formatDate } from '../../utils/format';
import {
  Coins,
  Receipt,
  CreditCard,
  ArrowLeft,
  Plus,
  AlertCircle,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { CreateInvoiceModal } from './modals/CreateInvoiceModal';
import { RecordPaymentModal } from './modals/RecordPaymentModal';

export const StudentFinancialSummaryPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const canRecordPayment = hasPermission(Permissions.RECORD_PAYMENT);
  const isReadOnly = !canManageFinance;

  const [summary, setSummary] = useState<StudentFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getStudentFinancialSummary(studentId);
      setSummary(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student financial summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [studentId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading student financial profile...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Student Profile Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'Unable to locate student financial history.'}</p>
        <Link
          to="/finance/invoices"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  const { student, invoices, recentPayments } = summary;

  const isOverdue = (inv: Invoice) => {
    if (!inv.dueDate) return false;
    const isPastDue = new Date(inv.dueDate) < new Date();
    const hasBalance = Number(inv.balance) > 0;
    const isNotClosed = inv.status !== 'PAID' && inv.status !== 'VOID';
    return isPastDue && hasBalance && isNotClosed;
  };

  const currentAcademicYear =
    invoices[0]?.academicYear || new Date().getFullYear();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/finance/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Finance</span>
          <span>/</span>
          <span>Student Accounts</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">{student.admissionNumber}</span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Student Profile Card (Section 4: Student, Admission Number, Class, Academic Year) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xl shadow-xs">
            {student.firstName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {student.firstName} {student.middleName ? `${student.middleName} ` : ''}
              {student.lastName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Adm: {student.admissionNumber}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Class: {student.class?.name || 'Class Assigned'}</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Academic Year: {currentAcademicYear}</span>
              </span>
            </div>
          </div>
        </div>

        {!isReadOnly ? (
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Invoice</span>
          </button>
        ) : (
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Read-Only Oversight</span>
          </div>
        )}
      </div>

      {/* Financial Aggregates Grid (Section 4: Total Invoiced, Total Paid, Outstanding) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Invoiced"
          value={formatMoney(summary.totalInvoiced, summary.currency)}
          subtitle={`${invoices.length} billing records issued`}
          icon={Receipt}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />

        <StatCard
          title="Total Paid"
          value={formatMoney(summary.totalPaid, summary.currency)}
          subtitle="Reconciled fee receipts"
          icon={CreditCard}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Outstanding Balance"
          value={formatMoney(summary.totalOutstanding, summary.currency)}
          subtitle="Net unpaid fee obligation"
          icon={Coins}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
      </div>

      {/* Invoice History (Section 4: Invoice Number, Structure, Issue Date, Due Date, Amount, Paid, Balance, Status) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Invoice History</h3>
            <p className="text-[11px] text-slate-400">All student billings and fee schedules</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Fee Structure</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
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
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {inv.feeStructure?.name || 'Class Fee Schedule'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.issueDate)}</td>
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
                    <td className="py-3.5 px-4">
                      {isOverdue(inv) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          OVERDUE
                        </span>
                      ) : (
                        <Badge
                          variant={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'warning'
                              : inv.status === 'ISSUED'
                              ? 'info'
                              : 'danger'
                          }
                          size="sm"
                          dot
                        >
                          {inv.status}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canRecordPayment && Number(inv.balance) > 0 && inv.status !== 'VOID' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                        <Link
                          to={`/finance/invoices/${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg inline-flex items-center transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices generated for this student yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History (Section 4: Receipt Number, Payment Date, Amount, Method, Reference, Status) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment History</h3>
            <p className="text-[11px] text-slate-400">
              Direct receipts and transactions (including historically preserved voided entries)
            </p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {recentPayments.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.length > 0 ? (
                recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        to={`/finance/receipts/${p.id}`}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {p.receipt?.receiptNumber || 'RECEIPT'}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(p.receivedAt)}
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
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {p.invoice?.invoiceNumber ? (
                        <Link
                          to={`/finance/invoices/${p.invoice.id}`}
                          className="hover:text-brand-600 font-semibold"
                        >
                          {p.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === 'VOIDED' ? (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            VOIDED
                          </span>
                          {p.voidReason && (
                            <p className="text-[10px] text-rose-600 max-w-xs truncate" title={p.voidReason}>
                              {p.voidReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="success" size="sm" dot>
                          PAID
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/finance/receipts/${p.id}`}
                        className="px-2.5 py-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        title="View Digital Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Receipt</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payment history recorded for this student yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        preselectedStudentId={student.id}
        onSuccess={() => {
          fetchSummary();
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
            fetchSummary();
            setSuccessMessage(`Payment recorded successfully for invoice ${payingInvoice.invoiceNumber}.`);
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
};
