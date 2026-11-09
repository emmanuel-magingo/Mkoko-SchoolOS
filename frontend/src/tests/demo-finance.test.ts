import { describe, expect, it } from 'vitest';
import { debtors, financeTotals, initialDemoFinance, paidFor, payingStudents, paymentStatus, portalChildren, receiveSimulatedBankPayment, registerStudent, releasedPaymentsFor, reviewPayment, searchFinance, studentAccount } from '../pages/finance/demoFinanceModel';
import type { DemoFinanceState } from '../pages/finance/demoFinanceModel';
import { invoiceText, receiptText } from '../pages/finance/demoFinanceDocuments';

const now = '2026-11-08T10:00:00.000Z';
const ok = (r: ReturnType<typeof receiveSimulatedBankPayment>): DemoFinanceState => {
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const pay = (s: DemoFinanceState, bank: string, tx: string, ref: string, amt: number) => ok(receiveSimulatedBankPayment(s, bank, tx, ref, amt, now));

describe('demo finance', () => {
  it('registers a student with three term invoices', () => {
    const s = ok(registerStudent(initialDemoFinance(), '  Zawadi  Ali ', 'Form 1 • A', now, { name: 'Mama Ali' }));
    expect(s.students[s.students.length - 1].name).toBe('Zawadi Ali');
    expect(s.invoices).toHaveLength(12);
    const registered = s.students[s.students.length - 1];
    expect(registered.controlNumber).toBe('DEMO-CN-0005');
    expect(new Set(s.students.filter((student) => student.controlNumber).map((student) => student.controlNumber)).size).toBe(4);
    expect(invoiceText(s, s.invoices[s.invoices.length - 1])).toContain('DEMO-CN-0005');
    expect(registerStudent(s, 'zawadi ali', 'Form 1 • A', now, { name: 'Mama Ali' }).ok).toBe(false);
    expect(s.invoices[s.invoices.length - 1].year).toBe(2026);
    expect(portalChildren(s, s.parents[s.parents.length - 1].id).map((child) => child.name)).toEqual(['Zawadi Ali']);
    const next = ok(registerStudent(s, 'Juma Ali', 'Form 1 • A', now, { id: s.parents[s.parents.length - 1].id }));
    expect(next.students[next.students.length - 1].controlNumber).toBe('DEMO-CN-0006');
    expect(portalChildren(next, next.parents[next.parents.length - 1].id).map((child) => child.name)).toEqual(['Zawadi Ali', 'Juma Ali']);
    expect(portalChildren(next, 'missing')).toEqual([]);
    expect(registerStudent(s, 'Jane Ali', 'Form 1 • A', now, { id: 'missing' }).ok).toBe(false);
    expect(registerStudent(s, 'Jane Ali', 'Form 1 • A', now, { name: ' ' }).ok).toBe(false);
  });

  it('allocates oldest invoice first across terms', () => {
    const s = pay(initialDemoFinance(), 'NMB', 'T1', 'demo-cn-0001', 500000);
    expect(s.payments[0].allocations).toEqual([{ invoiceId: 'INV-001', amount: 200000 }, { invoiceId: 'INV-002', amount: 300000 }]);
    expect(paidFor(s, 'INV-003')).toBe(0);
    expect(studentAccount(s, 'MWL-2026-0142').balance).toBe(400000);
    expect(s.payments[0].receipt).toBe('RCT-001');
  });

  it.each(['NMB', 'CRDB', 'EXIM'])('matches a %s payment before review without releasing the receipt', (bank) => {
    const s = pay(initialDemoFinance(), bank, 'tx1', 'DEMO-CN-0001', 100000);
    expect(financeTotals(s).collected).toBe(100000);
    expect(releasedPaymentsFor(s, 'MWL-2026-0142')).toHaveLength(0);
  });

  it('keeps overpayment as credit', () => {
    const s = pay(initialDemoFinance(), 'CRDB', 'T9', 'DEMO-CN-0001', 1000000);
    const account = studentAccount(s, 'MWL-2026-0142');
    expect(account.balance).toBe(0);
    expect(account.credit).toBe(100000);
    const totals = financeTotals(s, now);
    expect(totals.credit).toBe(100000);
    expect(totals.todayCollected).toBe(1000000);
  });

  it('releases the receipt after review', () => {
    const s = pay(initialDemoFinance(), 'NMB', 'T1', 'DEMO-CN-0001', 300000);
    const r = reviewPayment(s, 'PAY-001', now);
    if (!r.ok) throw new Error(r.error);
    expect(releasedPaymentsFor(r.state, 'MWL-2026-0142')).toHaveLength(1);
    const text = receiptText(r.state, r.state.payments[0]);
    expect(text).toContain('PAID INVOICE & RECEIPT');
    expect(text).toContain('INV-001');
    expect(text).toContain('DEMO-CN-0001');
    expect(reviewPayment(r.state, 'PAY-001', now).ok).toBe(false);
    expect(invoiceText(r.state, r.state.invoices[0])).toContain('CRDB');
  });

  it('is idempotent per bank', () => {
    const a = pay(initialDemoFinance(), 'NMB', 'T1', 'DEMO-CN-0001', 100000);
    expect(ok(receiveSimulatedBankPayment(a, 'NMB', 't1', 'DEMO-CN-0001', 100000, now))).toBe(a);
    expect(receiveSimulatedBankPayment(a, 'NMB', 'T1', 'DEMO-CN-0001', 200000, now).ok).toBe(false);
    expect(pay(a, 'CRDB', 'T1', 'DEMO-CN-0001', 100000).payments).toHaveLength(2);
  });

  it('quarantines unmatched payments and rejects invalid input', () => {
    const base = initialDemoFinance();
    for (const [ref, amt] of [['', 1000], ['UNKNOWN', 1000], ['MWL-2026-0142', 1000]] as const) {
      const s = pay(base, 'EXIM', `X${ref}${amt}`, ref, amt);
      expect(s.payments[0].outcome).toBe('UNMATCHED');
      expect(financeTotals(s).collected).toBe(0);
      expect(financeTotals(s).exceptions).toBe(1);
    }
    expect(receiveSimulatedBankPayment(base, 'ABC', 'T', 'MWL-2026-0142', 1, now).ok).toBe(false);
    expect(receiveSimulatedBankPayment(base, 'NMB', 'T', 'MWL-2026-0142', -1, now).ok).toBe(false);
    expect(receiveSimulatedBankPayment(base, 'NMB', '', 'MWL-2026-0142', 1, now).ok).toBe(false);
  });

  it('lists debtors and searches', () => {
    const s = pay(initialDemoFinance(), 'NMB', 'T1', 'DEMO-CN-0001', 900000);
    expect(debtors(s).map((d) => d.student.name)).not.toContain('Amina Joseph');
    expect(debtors(s)).toHaveLength(2);
    expect(searchFinance(s, 'amina').payments).toHaveLength(1);
    expect(searchFinance(s, 'rct-001').payments).toHaveLength(1);
    expect(searchFinance(s, 'demo-cn-0001').students[0].name).toBe('Amina Joseph');
    expect(searchFinance(s, '').students).toHaveLength(0);
  });

  it('filters paid students and debtors by year and term with correct statuses', () => {
    let s = pay(initialDemoFinance(), 'NMB', 'T1', 'DEMO-CN-0001', 250000);
    s = pay(s, 'CRDB', 'T2', 'DEMO-CN-0002', 900000);
    const year = { year: 2026 };
    const term1 = { year: 2026, term: 'Term 1' };
    const term2 = { year: 2026, term: 'Term 2' };
    const term3 = { year: 2026, term: 'Term 3' };
    expect(payingStudents(s, year).map((row) => row.student.name)).toEqual(['Amina Joseph', 'Baraka Mushi']);
    expect(paymentStatus(studentAccount(s, 'MWL-2026-0142', year).total, studentAccount(s, 'MWL-2026-0142', year).paid)).toBe('Partial');
    expect(paymentStatus(studentAccount(s, 'MWL-2026-0138', year).total, studentAccount(s, 'MWL-2026-0138', year).paid)).toBe('Paid');
    expect(debtors(s, term1).map((row) => row.student.name)).toEqual(['Neema Peter']);
    expect(debtors(s, term2).map((row) => row.student.name)).toEqual(['Neema Peter', 'Amina Joseph']);
    expect(paymentStatus(300000, 0)).toBe('Unpaid');
    expect(payingStudents(s, term3).map((row) => row.student.name)).toEqual(['Baraka Mushi']);
    expect(payingStudents(s, { year: 2027 })).toEqual([]);
    expect(debtors(s, { year: 2027 })).toEqual([]);
  });

  it('refuses receipts for unmatched payments', () => {
    const s = pay(initialDemoFinance(), 'NMB', 'T', 'NOPE', 10);
    expect(() => receiptText(s, s.payments[0])).toThrow();
  });

  it('matches a newly registered student by their control number and quarantines inactive students', () => {
    const registered = ok(registerStudent(initialDemoFinance(), 'New Student', 'Form 1 • A', now, { name: 'New Parent' }));
    const student = registered.students[registered.students.length - 1];
    if (!student.controlNumber) throw new Error('Missing demo control number');
    const paid = pay(registered, 'EXIM', 'NEW1', ` ${student.controlNumber.toLowerCase()} `, 100000);
    expect(paid.payments[0].admission).toBe(student.admission);
    expect(studentAccount(paid, student.admission).balance).toBe(800000);
    const inactive = { ...registered, students: registered.students.map((s) => s.admission === student.admission ? { ...s, status: 'Pending' as const } : s) };
    const unmatched = pay(inactive, 'NMB', 'NEW2', student.controlNumber, 100000);
    expect(unmatched.payments[0].outcome).toBe('UNMATCHED');
    expect(studentAccount(unmatched, student.admission).balance).toBe(900000);
  });
});
