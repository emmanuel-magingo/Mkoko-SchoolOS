import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Invoice, Payment, PaymentMethod } from '../../../types/finance.types';
import { financeApi } from '../../../api/finance.api';
import { formatMoney } from '../../../utils/format';
import { AlertCircle, CheckCircle, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<Payment | null>(null);

  // Client-side idempotency key generated once per payment attempt modal session
  // Never regenerated on retry of the same attempt!
  const idempotencyKeyRef = useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPaymentMethod('CASH');
      setReference('');
      setError(null);
      setSuccessPayment(null);
      // Generate unique key once per payment attempt window
      idempotencyKeyRef.current = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }, [isOpen]);

  const invoiceBalance = Number(invoice.balance) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = Number(amount);

    if (isNaN(payNum) || payNum <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (payNum > invoiceBalance) {
      setError(`Payment amount (${formatMoney(payNum)}) exceeds current outstanding invoice balance (${formatMoney(invoiceBalance)})`);
      return;
    }

    if (!reference.trim()) {
      setError('Payment reference is required (e.g. Cash voucher number, M-Pesa ID, Bank slip number)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await financeApi.recordPayment({
        invoiceId: invoice.id,
        amount: payNum,
        paymentMethod,
        reference: reference.trim(),
        idempotencyKey: idempotencyKeyRef.current,
      });

      setSuccessPayment(res.data);
      onSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Invoice Payment"
      description={`Record official payment for invoice ${invoice.invoiceNumber}.`}
      maxWidth="md"
    >
      {successPayment ? (
        <div className="space-y-5 text-center py-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Payment Recorded Successfully</h4>
            <p className="text-xs text-slate-500">
              Receipt No:{' '}
              <span className="font-mono font-bold text-slate-800">
                {successPayment.receipt?.receiptNumber || 'ISSUED'}
              </span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {formatMoney(successPayment.amount, successPayment.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-slate-800">{successPayment.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono text-slate-800">{successPayment.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Updated Balance:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(successPayment.invoice?.balance ?? (invoiceBalance - Number(successPayment.amount)))}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Done
            </button>
            <Link
              to={`/finance/receipts/${successPayment.id}`}
              onClick={onClose}
              className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>View Digital Receipt</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Student:</span>
              <span className="font-semibold text-slate-900">
                {invoice.student.firstName} {invoice.student.lastName} ({invoice.student.admissionNumber})
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatMoney(invoice.totalAmount, invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-700">Outstanding Balance:</span>
              <span className="font-mono font-black text-rose-600 text-sm">
                {formatMoney(invoice.balance, invoice.currency)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Payment Amount (TZS) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(invoiceBalance))}
                className="text-[11px] text-brand-600 font-semibold hover:underline"
              >
                Pay Full Balance
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="1"
              max={invoiceBalance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 150000"
              className="w-full px-3.5 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {amount && !isNaN(Number(amount)) && (
              <p className="text-[11px] text-slate-500">
                Display: <span className="font-bold text-slate-800">{formatMoney(amount, invoice.currency)}</span>
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="CASH">CASH (Physical Cash at Bursar Office)</option>
              <option value="MOBILE_MONEY">MOBILE MONEY (M-Pesa / Airtel Money / Tigo Pesa)</option>
              <option value="BANK">BANK (Bank Deposit / Direct Transfer)</option>
              <option value="CARD">CARD (POS / Electronic Card)</option>
            </select>
          </div>

          {/* Reference */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Transaction / Voucher Reference <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. CSH-2026-0012, MPESA-QA8891, CRDB-DEP-9912"
              maxLength={100}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
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
              disabled={loading || invoiceBalance <= 0}
              className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {loading ? 'Processing Payment...' : 'Record Payment'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
