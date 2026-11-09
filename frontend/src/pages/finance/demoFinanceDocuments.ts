import { demoBanks, paidFor, studentAccount } from './demoFinanceModel';
import type { DemoFinanceState, DemoInvoice, DemoPayment } from './demoFinanceModel';

const money = (amount: number) => `TZS ${amount.toLocaleString('en-US')}`;
const date = (value: string) => new Date(value).toLocaleString('en-GB');

export function invoiceText(state: DemoFinanceState, invoice: DemoInvoice): string {
  const paid = paidFor(state, invoice.id);
  const student = state.students.find((item) => item.admission === invoice.admission);
  if (!student) throw new Error('Student for this demo invoice could not be found.');
  return [
    'DEMO INVOICE — NOT A REAL BILL OR PAYMENT INSTRUCTION',
    'Mwilamvya Secondary School (sample)',
    '',
    `Invoice: ${invoice.id}`,
    `Issued: ${date(invoice.issuedAt)}`,
    `Student: ${invoice.student}`,
    `Admission number: ${invoice.admission}`,
    `Demo control number (not valid for payment): ${student.controlNumber ?? 'not assigned'}`,
    `Class: ${invoice.className}`,
    `Fee: ${invoice.feeName} / ${invoice.year}`,
    `Invoice amount: ${money(invoice.amount)}`,
    `Simulated payments: ${money(paid)}`,
    `Current demo balance: ${money(invoice.amount - paid)}`,
    '',
    `Simulated banks: ${demoBanks.join(', ')}`,
    '',
    'No real payment service is connected. Do not use this document to make a payment.',
  ].join('\n');
}

export function receiptText(state: DemoFinanceState, payment: DemoPayment): string {
  if (payment.outcome !== 'MATCHED' || !payment.receipt || !payment.admission) {
    throw new Error('A demo receipt is available only for matched payments.');
  }
  const account = studentAccount(state, payment.admission);
  return [
    'DEMO PAID INVOICE & RECEIPT — NOT PROOF OF PAYMENT',
    'Mwilamvya Secondary School (sample)',
    '',
    `Receipt: ${payment.receipt}`,
    `Simulated bank: ${payment.bank}`,
    `Simulated transaction: ${payment.transactionId}`,
    `Simulated receipt date: ${date(payment.receivedAt)}`,
    `Student: ${payment.studentName}`,
    `Admission number: ${payment.admission}`,
    `Demo control number: ${payment.reference}`,
    `Simulated amount received: ${money(payment.amount)}`,
    'Allocated to (oldest invoice first):',
    ...payment.allocations.map((a) => `  ${a.invoiceId}: ${money(a.amount)}`),
    `Credit kept: ${money(payment.credit)}`,
    `Current demo total balance: ${money(account.balance)}`,
    `Accountant viewed: ${payment.reviewedAt ? date(payment.reviewedAt) : 'not yet'}`,
    '',
    'This is simulated data. No actual bank verification or payment took place.',
  ].join('\n');
}

export function downloadDemoDocument(filename: string, text: string): void {
  const blob = new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
