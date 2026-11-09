export const demoBanks = ['NMB', 'CRDB', 'EXIM'] as const;
export type DemoBank = typeof demoBanks[number];
export const demoTerms = [
  { name: 'Term 1', amount: 200000 },
  { name: 'Term 2', amount: 300000 },
  { name: 'Term 3', amount: 400000 },
];
export const demoYear = 2026;
export const demoClasses = ['Form 1 • A', 'Form 1 • C', 'Form 2 • B', 'Form 3 • A', 'Form 4 • A'];

export interface DemoStudent {
  name: string;
  admission: string;
  controlNumber?: string;
  className: string;
  status: 'Active' | 'Pending';
}

export interface DemoParent {
  id: string;
  name: string;
  children: string[];
}

export const demoParents: DemoParent[] = [
  { id: 'P-1', name: 'Joseph Kimaro (parent)', children: ['MWL-2026-0142', 'MWL-2026-0138'] },
  { id: 'P-2', name: 'Grace Peter (parent)', children: ['MWL-2026-0129'] },
];

export interface DemoInvoice {
  id: string;
  admission: string;
  student: string;
  className: string;
  feeName: string;
  year: number;
  amount: number;
  issuedAt: string;
}

export interface DemoAllocation {
  invoiceId: string;
  amount: number;
}

export interface DemoPayment {
  id: string;
  bank: DemoBank;
  transactionId: string;
  reference: string;
  amount: number;
  receivedAt: string;
  outcome: 'MATCHED' | 'UNMATCHED';
  exceptionReason?: string;
  studentName?: string;
  admission?: string;
  allocations: DemoAllocation[];
  credit: number;
  receipt?: string;
  review: 'PENDING' | 'REVIEWED';
  reviewedAt?: string;
}

export interface DemoAudit {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface DemoFinanceState {
  students: DemoStudent[];
  parents: DemoParent[];
  invoices: DemoInvoice[];
  payments: DemoPayment[];
  audit: DemoAudit[];
}

export type DemoResult = { ok: true; state: DemoFinanceState; message: string } | { ok: false; error: string };

const initialStudents: DemoStudent[] = [
  { name: 'Amina Joseph', admission: 'MWL-2026-0142', controlNumber: 'DEMO-CN-0001', className: 'Form 3 • A', status: 'Active' },
  { name: 'Baraka Mushi', admission: 'MWL-2026-0138', controlNumber: 'DEMO-CN-0002', className: 'Form 2 • B', status: 'Active' },
  { name: 'Neema Peter', admission: 'MWL-2026-0129', controlNumber: 'DEMO-CN-0003', className: 'Form 4 • A', status: 'Active' },
  { name: 'Daniel Michael', admission: 'MWL-2026-0117', className: 'Form 1 • C', status: 'Pending' },
];

function nextId(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

function makeInvoices(student: DemoStudent, startCount: number, issuedAt: string): DemoInvoice[] {
  return demoTerms.map((term, index) => ({
    id: nextId('INV', startCount + index),
    admission: student.admission,
    student: student.name,
    className: student.className,
    feeName: term.name,
    year: demoYear,
    amount: term.amount,
    issuedAt,
  }));
}

export function initialDemoFinance(): DemoFinanceState {
  const students = initialStudents.map((student) => ({ ...student }));
  const invoices: DemoInvoice[] = [];
  students.filter((student) => student.status === 'Active').forEach((student) => {
    invoices.push(...makeInvoices(student, invoices.length, '2026-11-08T09:00:00.000Z'));
  });
  const parents = demoParents.map((parent) => ({ ...parent, children: [...parent.children] }));
  return { students, parents, invoices, payments: [], audit: [] };
}

export function paidFor(state: DemoFinanceState, invoiceId: string): number {
  return state.payments.filter((payment) => payment.outcome === 'MATCHED')
    .reduce((sum, payment) => sum + payment.allocations.filter((a) => a.invoiceId === invoiceId).reduce((s, a) => s + a.amount, 0), 0);
}

export interface DemoPeriod {
  year: number;
  term?: string;
}

export function studentAccount(state: DemoFinanceState, admission: string, period?: DemoPeriod) {
  const invoices = state.invoices.filter((invoice) => invoice.admission === admission &&
    (!period || (invoice.year === period.year && (!period.term || invoice.feeName === period.term))));
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = invoices.reduce((sum, invoice) => sum + paidFor(state, invoice.id), 0);
  const credit = state.payments.filter((p) => p.outcome === 'MATCHED' && p.admission === admission).reduce((sum, p) => sum + p.credit, 0);
  return { invoices, total, paid, balance: total - paid, credit };
}

export function financeTotals(state: DemoFinanceState, today?: string) {
  const matched = state.payments.filter((payment) => payment.outcome === 'MATCHED');
  const invoiced = state.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const collected = matched.reduce((sum, payment) => sum + payment.amount, 0);
  const allocated = matched.reduce((sum, payment) => sum + payment.amount - payment.credit, 0);
  const unmatched = state.payments.filter((payment) => payment.outcome === 'UNMATCHED').reduce((sum, payment) => sum + payment.amount, 0);
  const day = today?.slice(0, 10);
  return {
    invoiced,
    collected,
    outstanding: invoiced - allocated,
    credit: collected - allocated,
    unmatched,
    exceptions: state.payments.filter((payment) => payment.outcome === 'UNMATCHED').length,
    studentsWithBalance: state.students.filter((s) => studentAccount(state, s.admission).balance > 0).length,
    todayCollected: day ? matched.filter((p) => p.receivedAt.slice(0, 10) === day).reduce((sum, p) => sum + p.amount, 0) : 0,
  };
}

export function debtors(state: DemoFinanceState, period?: DemoPeriod) {
  return state.students
    .map((student) => ({ student, ...studentAccount(state, student.admission, period) }))
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}

export function paymentStatus(total: number, paid: number): 'Unpaid' | 'Partial' | 'Paid' {
  if (paid === 0) return 'Unpaid';
  return paid >= total ? 'Paid' : 'Partial';
}

export function payingStudents(state: DemoFinanceState, period: DemoPeriod) {
  return state.students
    .map((student) => ({ student, ...studentAccount(state, student.admission, period) }))
    .filter((row) => row.paid > 0);
}

export function portalChildren(state: DemoFinanceState, parentId: string): DemoStudent[] {
  const parent = state.parents.find((item) => item.id === parentId);
  return parent ? state.students.filter((student) => parent.children.includes(student.admission)) : [];
}

export function searchFinance(state: DemoFinanceState, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { students: [], invoices: [], payments: [] };
  const has = (value?: string) => !!value && value.toLowerCase().includes(q);
  return {
    students: state.students.filter((s) => has(s.name) || has(s.admission) || has(s.controlNumber)),
    invoices: state.invoices.filter((i) => has(i.id) || has(i.student) || has(i.admission)),
    payments: state.payments.filter((p) => has(p.id) || has(p.receipt) || has(p.transactionId) || has(p.reference) || has(p.studentName)),
  };
}

function record(state: DemoFinanceState, action: string, details: string, now: string): DemoFinanceState {
  return { ...state, audit: [{ id: nextId('LOG', state.audit.length), timestamp: now, action, details }, ...state.audit] };
}

export function registerStudent(state: DemoFinanceState, name: string, className: string, now: string, parent: { name: string } | { id: string }): DemoResult {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  if (!cleanName || cleanName.length > 80) return { ok: false, error: 'Enter a student name of up to 80 characters.' };
  if (!demoClasses.includes(className)) return { ok: false, error: 'Select a demo class.' };
  if (state.students.some((student) => student.name.toLowerCase() === cleanName.toLowerCase())) {
    return { ok: false, error: 'A student with this name already exists in the demo. Check the registry first.' };
  }
  const existingParent = 'id' in parent ? state.parents.find((item) => item.id === parent.id) : undefined;
  if ('id' in parent && !existingParent) return { ok: false, error: 'Select a registered demo parent.' };
  const parentName = 'name' in parent ? parent.name.trim().replace(/\s+/g, ' ') : '';
  if ('name' in parent && (!parentName || parentName.length > 80)) return { ok: false, error: 'Enter a parent name of up to 80 characters.' };
  let number = state.students.length + 1;
  let admission = `MWL-DEMO-${String(number).padStart(4, '0')}`;
  while (state.students.some((student) => student.admission === admission)) {
    number += 1;
    admission = `MWL-DEMO-${String(number).padStart(4, '0')}`;
  }
  let controlSequence = state.students.length + 1;
  let controlNumber = `DEMO-CN-${String(controlSequence).padStart(4, '0')}`;
  while (state.students.some((student) => student.controlNumber === controlNumber)) {
    controlSequence += 1;
    controlNumber = `DEMO-CN-${String(controlSequence).padStart(4, '0')}`;
  }
  const student: DemoStudent = { name: cleanName, admission, controlNumber, className, status: 'Active' };
  const invoices = makeInvoices(student, state.invoices.length, now);
  const parents = existingParent
    ? state.parents.map((item) => item.id === existingParent.id ? { ...item, children: [...item.children, admission] } : item)
    : [...state.parents, { id: nextId('P', state.parents.length), name: parentName, children: [admission] }];
  const updated = { ...state, parents, students: [...state.students, student], invoices: [...state.invoices, ...invoices] };
  return {
    ok: true,
    state: record(updated, 'Student registered and invoices issued', `${student.admission} • ${controlNumber} • ${invoices.map((i) => i.id).join(', ')}`, now),
    message: `${student.name} registered. Admission ${student.admission}; control number ya mfano ${controlNumber}; ${invoices.length} term invoices created.`,
  };
}

export function receiveSimulatedBankPayment(
  state: DemoFinanceState, bank: string, transactionId: string, reference: string, amount: number, now: string,
): DemoResult {
  const selectedBank = demoBanks.find((item) => item === bank);
  if (!selectedBank) return { ok: false, error: 'Select NMB, CRDB or EXIM.' };
  const transaction = transactionId.trim().toUpperCase();
  const studentRef = reference.trim().toUpperCase();
  if (!transaction || transaction.length > 80) return { ok: false, error: 'Enter a demo bank transaction ID of up to 80 characters.' };
  if (studentRef.length > 80) return { ok: false, error: 'Control number must be 80 characters or less.' };
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000_000) {
    return { ok: false, error: 'Enter a whole TZS amount between 1 and 1,000,000,000.' };
  }
  const existing = state.payments.find((payment) => payment.bank === selectedBank && payment.transactionId === transaction);
  if (existing) {
    if (existing.reference === studentRef && existing.amount === amount) {
      return { ok: true, state, message: `${selectedBank} ${transaction} was already received; no duplicate payment was created.` };
    }
    return { ok: false, error: 'This bank transaction ID already exists with different details. Investigate before continuing.' };
  }

  const student = state.students.find((item) => item.controlNumber === studentRef && item.status === 'Active');
  let reason: string | undefined;
  if (!studentRef) reason = 'Missing control number.';
  else if (!student) reason = 'Control number not found or student is inactive.';

  const allocations: DemoAllocation[] = [];
  let credit = 0;
  if (student) {
    // Oldest invoice first; anything left over is kept as credit.
    let remaining = amount;
    for (const invoice of state.invoices.filter((i) => i.admission === student.admission)) {
      const due = invoice.amount - paidFor(state, invoice.id);
      if (due <= 0 || remaining <= 0) continue;
      const applied = Math.min(due, remaining);
      allocations.push({ invoiceId: invoice.id, amount: applied });
      remaining -= applied;
    }
    credit = remaining;
  }

  const matched = !reason && student;
  const payment: DemoPayment = {
    id: nextId('PAY', state.payments.length), bank: selectedBank, transactionId: transaction, reference: studentRef,
    amount, receivedAt: now, outcome: matched ? 'MATCHED' : 'UNMATCHED', exceptionReason: reason,
    studentName: student?.name, admission: student?.admission,
    allocations: matched ? allocations : [], credit: matched ? credit : 0,
    receipt: matched ? nextId('RCT', state.payments.filter((item) => item.outcome === 'MATCHED').length) : undefined,
    review: 'PENDING',
  };
  const next = { ...state, payments: [...state.payments, payment] };
  const creditNote = payment.credit > 0 ? ` TZS ${payment.credit.toLocaleString('en-US')} kept as credit.` : '';
  return {
    ok: true,
    state: record(next, matched ? 'Simulated bank payment matched and allocated' : 'Simulated bank payment requires investigation', `${payment.id} • ${selectedBank} • ${transaction}`, now),
    message: matched
      ? `${payment.id} via ${selectedBank} matched to ${student?.name}, allocated oldest invoice first.${creditNote}`
      : `${payment.id} via ${selectedBank} is unmatched: ${reason} No student balance was changed.`,
  };
}

export function reviewPayment(state: DemoFinanceState, id: string, now: string): DemoResult {
  const payment = state.payments.find((item) => item.id === id);
  if (!payment || payment.outcome !== 'MATCHED' || payment.review !== 'PENDING') {
    return { ok: false, error: 'Only a matched payment awaiting review can be marked viewed.' };
  }
  const payments = state.payments.map((item) => item.id === id ? { ...item, review: 'REVIEWED' as const, reviewedAt: now } : item);
  return {
    ok: true,
    state: record({ ...state, payments }, 'Accountant viewed payment; receipt released to student (simulation)', id, now),
    message: `${id} marked viewed. The receipt for ${payment.studentName} is now ready to download in the student portal.`,
  };
}

export function releasedPaymentsFor(state: DemoFinanceState, admission: string): DemoPayment[] {
  return state.payments.filter((p) => p.outcome === 'MATCHED' && p.review === 'REVIEWED' && p.admission === admission);
}
