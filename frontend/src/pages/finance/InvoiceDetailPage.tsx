import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { Invoice, Payment } from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { formatMoney, formatDate } from '../../utils/format';
import {
  Receipt,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Ban,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { RecordPaymentModal } from './modals/RecordPaymentModal';
import { VoidPaymentModal } from './modals/VoidPaymentModal';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const canRecordPayment = hasPermission(Permissions.RECORD_PAYMENT);
  const isReadOnly = !canManageFinance;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState<Payment | null>(null);
  const [voidingInvoice, setVoidingInvoice] = useState(false);

  const fetchInvoice = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getInvoice(id);
      setInvoice(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleVoidInvoice = async () => {
    if (!invoice) return;
    if (
      !window.confirm(
        `Void invoice #${invoice.invoiceNumber}? This action is irreversible and cancels all line items.`
      )
    ) {
      return;
    }

    try {
      setVoidingInvoice(true);
      const res = await financeApi.voidInvoice(invoice.id);
      setInvoice(res.data);
      setSuccessMessage(`Invoice #${res.data.invoiceNumber} has been voided.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void invoice');
    } finally {
      setVoidingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading invoice records...</span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Invoice Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'Unable to locate the requested invoice.'}</p>
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

  const outstandingBalance = Number(invoice.balance) || 0;
  const canRecordPaymentAction = canRecordPayment && invoice.status !== 'VOID' && outstandingBalance > 0;
  const canVoidInvoiceAction =
    canManageFinance &&
    invoice.status !== 'VOID' &&
    Number(invoice.paidAmount) === 0 &&
    (!invoice.payments || invoice.payments.length === 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back Link */}
      <Link
        to="/finance/invoices"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Invoices</span>
      </Link>

      {/* Success Notification */}
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
                  invoice.status === 'PAID'
                    ? 'success'
                    : invoice.status === 'PARTIALLY_PAID'
                    ? 'warning'
                    : invoice.status === 'ISSUED'
                    ? 'info'
                    : 'danger'
                }
                size="md"
                dot
              >
                {invoice.status}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                Issued: {formatDate(invoice.issueDate)}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-900">
              {invoice.invoiceNumber}
            </h2>
          </div>

          {/* Action Buttons */}
          {!isReadOnly ? (
            <div className="flex items-center gap-2">
              {canRecordPaymentAction && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              )}

              {canVoidInvoiceAction && (
                <button
                  onClick={handleVoidInvoice}
                  disabled={voidingInvoice}
                  className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Void Invoice"
                >
                  <Ban className="w-4 h-4" />
                  <span>Void Invoice</span>
                </button>
              )}
            </div>
          ) : (
            <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Read-Only Oversight</span>
            </div>
          )}
        </div>

        {/* Student & Date Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400">Student:</span>
            <div className="mt-0.5">
              <Link
                to={`/finance/students/${invoice.student.id}`}
                className="font-bold text-slate-900 hover:text-brand-600 text-sm flex items-center gap-1"
              >
                <span>
                  {invoice.student.firstName} {invoice.student.lastName}
                </span>
              </Link>
              <p className="text-[11px] text-slate-500 font-mono">
                Adm: {invoice.student.admissionNumber} {invoice.student.class ? `(${invoice.student.class.name})` : ''}
              </p>
            </div>
          </div>

          <div>
            <span className="text-slate-400">Academic Term:</span>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">
              Year {invoice.academicYear} {invoice.term ? `— ${invoice.term}` : ''}
            </p>
            <p className="text-[11px] text-slate-400">
              Due Date: {formatDate(invoice.dueDate)}
            </p>
          </div>

          <div>
            <span className="text-slate-400">Fee Structure Origin:</span>
            <p className="font-semibold text-slate-800 text-xs mt-0.5">
              {invoice.feeStructure?.name || 'Class Fee Schedule'}
            </p>
          </div>
        </div>

        {/* 3 Metric Cards for Invoiced, Paid, Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Invoiced
            </span>
            <p className="text-lg font-mono font-extrabold text-slate-900 mt-0.5">
              {formatMoney(invoice.totalAmount, invoice.currency)}
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Total Paid
            </span>
            <p className="text-lg font-mono font-extrabold text-emerald-800 mt-0.5">
              {formatMoney(invoice.paidAmount, invoice.currency)}
            </p>
          </div>

          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Outstanding Balance
            </span>
            <p className="text-lg font-mono font-black text-rose-700 mt-0.5">
              {formatMoney(invoice.balance, invoice.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Snapshot Line Items</h3>
          <span className="text-xs text-slate-400">{invoice.items?.length || 0} Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Fee Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{item.categoryName}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {item.description || <span className="text-slate-300 italic">—</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                    {formatMoney(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                  Invoice Total:
                </td>
                <td className="py-3 px-4 font-mono font-black text-slate-900 text-right text-sm">
                  {formatMoney(invoice.totalAmount, invoice.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment & Receipt History</h3>
            <p className="text-[11px] text-slate-400">Reconciled financial records for this invoice.</p>
          </div>
          <span className="text-xs text-slate-400">
            {invoice.payments?.length || 0} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt / Date</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.payments && invoice.payments.length > 0 ? (
                invoice.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-slate-900">
                        {p.receipt?.receiptNumber || 'RECEIPT PENDING'}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatDate(p.receivedAt)}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{p.reference}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === 'RECORDED' ? 'success' : 'danger'} size="sm" dot>
                        {p.status}
                      </Badge>
                      {p.status === 'VOIDED' && p.voidReason && (
                        <p className="text-[10px] text-rose-500 italic mt-0.5">
                          Reason: {p.voidReason}
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

                        {canManageFinance && p.status === 'RECORDED' && (
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
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No payments recorded for this invoice yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && invoice && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={invoice}
          onSuccess={() => {
            fetchInvoice();
            setSuccessMessage('Payment recorded successfully.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}

      {/* Void Payment Modal */}
      {voidingPayment && (
        <VoidPaymentModal
          isOpen={!!voidingPayment}
          onClose={() => setVoidingPayment(null)}
          payment={voidingPayment}
          onSuccess={() => {
            fetchInvoice();
            setSuccessMessage('Payment voided and balance restored successfully.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
};
