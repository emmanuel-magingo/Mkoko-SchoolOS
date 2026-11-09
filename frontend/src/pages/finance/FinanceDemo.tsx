import React, { useRef, useState } from 'react';
import { debtors, demoBanks, demoClasses, demoTerms, demoYear, financeTotals, initialDemoFinance, paidFor, payingStudents, paymentStatus, portalChildren, receiveSimulatedBankPayment, registerStudent, releasedPaymentsFor, reviewPayment, searchFinance, studentAccount } from './demoFinanceModel';
import type { DemoFinanceState, DemoResult } from './demoFinanceModel';
import { downloadDemoDocument, invoiceText, receiptText } from './demoFinanceDocuments';

export { financeTotals, initialDemoFinance };
export type { DemoStudent } from './demoFinanceModel';

const tabs = ['Overview', 'Register student', 'Students & invoices', 'Simulate bank payment', 'Accountant list', 'Debtors', 'Student & parent portal', 'Reports & exceptions'] as const;
type Tab = typeof tabs[number];
const money = (n: number) => `TZS ${n.toLocaleString('en-US')}`;
const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const btn = 'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

export const FinanceDemo: React.FC<{ onStateChange: (s: DemoFinanceState) => void }> = ({ onStateChange }) => {
  const [state, setState] = useState<DemoFinanceState>(initialDemoFinance);
  const stateRef = useRef(state);
  const [tab, setTab] = useState<Tab>('Overview');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState(demoClasses[0]);
  const [parentChoice, setParentChoice] = useState('new');
  const [parentName, setParentName] = useState('');
  const [bank, setBank] = useState<string>(demoBanks[0]);
  const [tx, setTx] = useState('');
  const [ref, setRef] = useState('');
  const [amount, setAmount] = useState('');
  const [isAccountant, setIsAccountant] = useState(false);
  const [portalMode, setPortalMode] = useState<'student' | 'parent'>('student');
  const [portalIdentity, setPortalIdentity] = useState('');
  const [portalSession, setPortalSession] = useState<{ mode: 'student' | 'parent'; id: string } | null>(null);
  const [childRef, setChildRef] = useState('');
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');

  const apply = (fn: (s: DemoFinanceState, now: string) => DemoResult) => {
    const result = fn(stateRef.current, new Date().toISOString());
    if (result.ok) {
      stateRef.current = result.state;
      setState(result.state);
      onStateChange(result.state);
      setMessage(result.message);
      setError('');
    } else {
      setError(result.error);
      setMessage('');
    }
    return result.ok;
  };
  const download = (file: string, text: string) => {
    downloadDemoDocument(file, text);
    setMessage(`Download requested: ${file}`);
    setError('');
  };

  const totals = financeTotals(state, new Date().toISOString());
  const portalOptions = !portalSession ? [] : portalSession.mode === 'parent'
    ? portalChildren(state, portalSession.id) : state.students.filter((s) => s.admission === portalSession.id);
  const activeRef = portalOptions.some((s) => s.admission === childRef) ? childRef : portalOptions[0]?.admission ?? '';
  const portalStudent = state.students.find((s) => s.admission === activeRef);
  const account = studentAccount(state, activeRef);
  const period = { year: demoYear, term: term || undefined };
  const payers = payingStudents(state, period);
  const found = searchFinance(state, query);
  const matched = state.payments.filter((p) => p.outcome === 'MATCHED');
  const unmatched = state.payments.filter((p) => p.outcome === 'UNMATCHED');

  return (
    <div className="space-y-4">
      <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        SIMULATION ONLY: no real bank (NMB, CRDB, EXIM) is connected, roles are not secured and data resets on reload.
      </p>
      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === t ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{t}</button>
        ))}
      </div>
      {message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {(tab === 'Students & invoices' || tab === 'Accountant list' || tab === 'Debtors') && (
        <div className={`${card} flex flex-wrap items-center gap-3 text-sm`}>
          <label htmlFor="demo-year">Mwaka wa ada</label>
          <select id="demo-year" className="rounded-lg border border-slate-300 px-2 py-1" value={demoYear} disabled>
            <option value={demoYear}>{demoYear}</option>
          </select>
          <label htmlFor="demo-term">Muhula</label>
          <select id="demo-term" className="rounded-lg border border-slate-300 px-2 py-1" value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="">Mwaka mzima</option>
            {demoTerms.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
          <span className="text-xs text-slate-500">Ada na mwaka ni za mfano.</span>
        </div>
      )}

      {tab === 'Overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([['Invoiced', totals.invoiced], ['Collected', totals.collected], ['Outstanding', totals.outstanding], ['Credit balances', totals.credit], ['Today\'s collections', totals.todayCollected], ['Unmatched', totals.unmatched], ['Students with balance', totals.studentsWithBalance], ['Pending exceptions', totals.exceptions]] as const).map(([l, v]) => (
            <article key={l} className={card}><p className="text-xs text-slate-500">{l}</p><p className="text-lg font-bold">{l === 'Students with balance' || l === 'Pending exceptions' ? v : money(v)}</p></article>
          ))}
        </div>
      )}

      {tab === 'Register student' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Sajili mwanafunzi na mzazi wake; control number na invoice za mfano za mwaka {demoYear} zitatengenezwa moja kwa moja.</p>
          <form className={`${card} grid gap-3 sm:grid-cols-2`} onSubmit={(e) => {
            e.preventDefault();
            if (apply((s, n) => registerStudent(s, name, className, n, parentChoice === 'new' ? { name: parentName } : { id: parentChoice }))) {
              setName(''); setParentName('');
            }
          }}>
            <input aria-label="Student name" className={input} placeholder="Student full name" value={name} onChange={(e) => setName(e.target.value)} />
            <select aria-label="Class" className={input} value={className} onChange={(e) => setClassName(e.target.value)}>
              {demoClasses.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select aria-label="Parent registration" className={input} value={parentChoice} onChange={(e) => setParentChoice(e.target.value)}>
              <option value="new">Mzazi mpya</option>
              {state.parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name} ({parent.id})</option>)}
            </select>
            {parentChoice === 'new' && <input aria-label="Parent name" className={input} placeholder="Jina la mzazi" value={parentName} onChange={(e) => setParentName(e.target.value)} />}
            <button className={btn} type="submit">Register & auto-invoice</button>
          </form>
        </div>
      )}

      {tab === 'Students & invoices' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Invoice zilizo na malipo katika kipindi kilichochaguliwa. Malipo hutokea hapa baada ya kuthibitishwa kwenye demo.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {state.invoices.filter((inv) => inv.year === period.year && (!period.term || inv.feeName === period.term) && paidFor(state, inv.id) > 0).map((inv) => (
              <article key={inv.id} className={card}>
                <p className="font-semibold">{inv.student}</p>
                <p className="text-xs text-slate-500">{inv.id} • Admission {inv.admission} • Control number ya mfano {state.students.find((s) => s.admission === inv.admission)?.controlNumber ?? 'Haijatolewa'} • {inv.className}</p>
                <p className="mt-1 text-sm">{inv.year} • {inv.feeName}: {money(inv.amount)} • Paid {money(paidFor(state, inv.id))} • Balance {money(inv.amount - paidFor(state, inv.id))} • {paymentStatus(inv.amount, paidFor(state, inv.id))}</p>
                <button className={`${btn} mt-3`} onClick={() => download(`${inv.id}-invoice.txt`, invoiceText(state, inv))}>Download invoice</button>
              </article>
            ))}
            {payers.length === 0 && <p className={`${card} text-sm text-slate-500`}>Hakuna invoice zenye malipo kwa kipindi hiki.</p>}
          </div>
        </div>
      )}

      {tab === 'Simulate bank payment' && (
        <form className={`${card} grid gap-3 sm:grid-cols-2`} onSubmit={(e) => { e.preventDefault(); apply((s, n) => receiveSimulatedBankPayment(s, bank, tx, ref, Number(amount), n)); }}>
          <div className="space-y-1 text-sm text-slate-600 sm:col-span-2">
            <p className="font-semibold">Jinsi ya kujaribu malipo (si malipo halisi)</p>
            <p>Chagua benki, andika namba ya muamala wa mfano (mfano TX-001), control number ya mwanafunzi ya mfano (mfano DEMO-CN-0001) na kiasi (mfano 500000), kisha bonyeza kitufe. Mfumo utagawanya fedha kwenye invoice za zamani kwanza. Control number isiyojulikana itaenda kwenye exceptions. Namba hizi si za malipo halisi.</p>
          </div>
          <select aria-label="Bank" className={input} value={bank} onChange={(e) => setBank(e.target.value)}>
            {demoBanks.map((b) => <option key={b}>{b}</option>)}
          </select>
          <input aria-label="Transaction ID" className={input} placeholder="Bank transaction ID" value={tx} onChange={(e) => setTx(e.target.value)} />
          <input aria-label="Demo control number" className={input} placeholder="Control number ya mfano, mfano DEMO-CN-0001" value={ref} onChange={(e) => setRef(e.target.value)} />
          <input aria-label="Amount" className={input} inputMode="numeric" placeholder="Amount (TZS)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className={btn} type="submit">Simulate bank confirmation</button>
        </form>
      )}

      {tab === 'Accountant list' && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            Role
            <select aria-label="Role" className="rounded-lg border border-slate-300 px-2 py-1" value={isAccountant ? 'accountant' : 'viewer'} onChange={(e) => setIsAccountant(e.target.value === 'accountant')}>
              <option value="viewer">Viewer</option>
              <option value="accountant">Demo accountant</option>
            </select>
          </label>
          <input aria-label="Search payments" className={input} placeholder="Tafuta jina, admission, control number, invoice, risiti au muamala" value={query} onChange={(e) => setQuery(e.target.value)} />
          {payers.filter((row) => !query.trim() || found.students.some((s) => s.admission === row.student.admission) ||
            found.invoices.some((i) => i.admission === row.student.admission) || found.payments.some((p) => p.admission === row.student.admission))
            .map((row) => (
              <article key={row.student.admission} className={card}>
                <p className="text-base font-bold">{row.student.name} • {row.student.admission}</p>
                <p className="text-xs text-slate-500">Control number ya mfano: {row.student.controlNumber ?? 'Haijatolewa'}</p>
                <p className="text-sm">{period.year} • {period.term || 'Mwaka mzima'} • Ada {money(row.total)} • Alilipa {money(row.paid)} • Baki {money(row.balance)} • {paymentStatus(row.total, row.paid)}</p>
                {row.invoices.map((invoice) => <p key={invoice.id} className="text-xs text-slate-600">{invoice.feeName} • {invoice.id} • {money(paidFor(state, invoice.id))} / {money(invoice.amount)} • {paymentStatus(invoice.amount, paidFor(state, invoice.id))}</p>)}
                {matched.filter((p) => p.admission === row.student.admission &&
                  (p.allocations.some((a) => row.invoices.some((invoice) => invoice.id === a.invoiceId)) ||
                    (!period.term && p.allocations.length === 0 && p.credit > 0))).map((p) => (
                  <div key={p.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <p className="text-sm">{p.id} • {p.bank} • {p.transactionId} • Muamala {money(p.amount)} • {p.review === 'REVIEWED' ? 'Viewed — receipt released' : 'Awaiting accountant view'}</p>
                    <button className={btn} disabled={!isAccountant || p.review === 'REVIEWED'} onClick={() => apply((s, n) => reviewPayment(s, p.id, n))}>Mark viewed</button>
                  </div>
                ))}
              </article>
            ))}
          {payers.length === 0 && <p className={`${card} text-sm text-slate-500`}>Hakuna wanafunzi waliolipa kwa kipindi hiki.</p>}
          {payers.length > 0 && query.trim() && !payers.some((row) => found.students.some((s) => s.admission === row.student.admission) || found.invoices.some((i) => i.admission === row.student.admission) || found.payments.some((p) => p.admission === row.student.admission)) && <p className={`${card} text-sm text-slate-500`}>Hakuna matokeo kwa kipindi hiki.</p>}
        </div>
      )}

      {tab === 'Debtors' && (
        <div className="space-y-4">
          <section className={card}>
            <h3 className="font-semibold">Wanafunzi wenye deni • {period.year} • {period.term || 'Mwaka mzima'}</h3>
            {debtors(state, period).length === 0 && <p className="text-sm text-slate-500">Hakuna deni kwa kipindi hiki.</p>}
            {debtors(state, period).map((d) => <p key={d.student.admission} className="border-t border-slate-100 py-2 text-sm">{d.student.name} • {d.student.admission} • {d.student.className} • Alilipa {money(d.paid)} / {money(d.total)} • Baki {money(d.balance)} • {paymentStatus(d.total, d.paid)}</p>)}
          </section>
        </div>
      )}

      {tab === 'Student & parent portal' && (
        <div className="space-y-3">
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Akaunti za mfano tu: kuchagua mtumiaji si login salama. Usitumie taarifa halisi.</p>
          {!portalSession ? <div className={`${card} grid gap-2 sm:grid-cols-2`}>
            <select aria-label="Portal user" className={input} value={portalMode} onChange={(e) => { setPortalMode(e.target.value === 'parent' ? 'parent' : 'student'); setPortalIdentity(''); }}>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
            <select aria-label="Demo account" className={input} value={portalIdentity} onChange={(e) => setPortalIdentity(e.target.value)}>
              <option value="">Chagua akaunti ya mfano</option>
              {portalMode === 'parent'
                ? state.parents.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)
                : state.students.map((s) => <option key={s.admission} value={s.admission}>{s.name} ({s.admission})</option>)}
            </select>
            <button type="button" className={btn} disabled={!portalIdentity} onClick={() => { setPortalSession({ mode: portalMode, id: portalIdentity }); setChildRef(''); }}>Fungua akaunti ya mfano</button>
          </div> : <div className="space-y-3">
          <button type="button" className={btn} onClick={() => { setPortalSession(null); setPortalIdentity(''); setChildRef(''); }}>Ondoka kwenye akaunti ya mfano</button>
          {portalSession.mode === 'parent' && <select aria-label="Child" className={input} value={activeRef} onChange={(e) => setChildRef(e.target.value)}>
            {portalOptions.map((s) => <option key={s.admission} value={s.admission}>{s.name} ({s.admission})</option>)}
          </select>}
          {portalOptions.length === 0 && <p className={card}>Hakuna mtoto aliyehusishwa na akaunti hii ya mfano.</p>}
          {portalStudent && (
            <article className={card}>
              <p className="font-semibold">{portalStudent.name} • Ref {portalStudent.admission}</p>
              <p className="text-sm">Control number ya mfano: {portalStudent.controlNumber ?? 'Haijatolewa'} (si ya malipo halisi)</p>
              <p className="text-sm">Total {money(account.total)} • Paid {money(account.paid)} • Balance {money(account.balance)} • Credit {money(account.credit)}</p>
              <ul className="mt-2 space-y-2">
                {account.invoices.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{inv.id} • {inv.year} • {inv.feeName} • Balance {money(inv.amount - paidFor(state, inv.id))} • {paymentStatus(inv.amount, paidFor(state, inv.id))}</span>
                    <button className={btn} onClick={() => download(`${inv.id}-invoice.txt`, invoiceText(state, inv))}>Download invoice</button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {releasedPaymentsFor(state, activeRef).map((p) => (
                  <button key={p.id} className={btn} onClick={() => download(`${p.receipt}-paid-invoice.txt`, receiptText(state, p))}>Download receipt {p.receipt}</button>
                ))}
              </div>
              {state.payments.some((p) => p.admission === activeRef && p.outcome === 'MATCHED' && p.review === 'PENDING') && (
                <p className="mt-2 text-xs text-amber-700">Awaiting accountant review</p>
              )}
            </article>
          )}
          </div>}
        </div>
      )}

      {tab === 'Reports & exceptions' && (
        <div className="space-y-4">
          <section className={card}>
            <h3 className="font-semibold">Unmatched payments</h3>
            {unmatched.length === 0 && <p className="text-sm text-slate-500">None.</p>}
            {unmatched.map((p) => <p key={p.id} className="text-sm">{p.id} • {p.bank} • {p.transactionId} • {money(p.amount)} — {p.exceptionReason}</p>)}
          </section>
          <section className={card}>
            <h3 className="font-semibold">Demo activity trail</h3>
            {state.audit.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
            {state.audit.map((a) => <p key={a.id} className="text-xs text-slate-600">{new Date(a.timestamp).toLocaleTimeString('en-GB')} • {a.action} • {a.details}</p>)}
          </section>
        </div>
      )}
    </div>
  );
};

export default FinanceDemo;
