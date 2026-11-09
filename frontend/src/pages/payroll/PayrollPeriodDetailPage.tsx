import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calculator,
  ClipboardCheck,
  CheckCircle2,
  Lock,
  Send,
  AlertCircle,
  FileText,
  ArrowLeft,
  Users,
  Coins,
} from 'lucide-react';
import {
  payrollApi,
  PayrollPeriod,
  PayrollRecord,
  PayrollPeriodStatus,
} from '../../api/payrollApi';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';

export const PayrollPeriodDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canCalculate = hasPermission(Permissions.CALCULATE_PAYROLL);
  const canReview = hasPermission(Permissions.REVIEW_PAYROLL);
  const canApprove = hasPermission(Permissions.APPROVE_PAYROLL);
  const canFinalize = hasPermission(Permissions.FINALIZE_PAYROLL);
  const canPost = hasPermission(Permissions.POST_PAYROLL);
  const canViewSensitive = hasPermission(Permissions.VIEW_PAYROLL_SENSITIVE);

  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review & Approval Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchPeriodData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [periodRes, recordsRes] = await Promise.all([
        payrollApi.getPayrollPeriodById(id),
        payrollApi.getPayrollRecordsByPeriod(id, { limit: 100 }),
      ]);
      setPeriod(periodRes.data);
      setRecords(recordsRes.data?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load payroll period details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodData();
  }, [id]);

  const handleAction = async (actionFn: () => Promise<any>, successText: string) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      await actionFn();
      setSuccessMsg(successText);
      await fetchPeriodData();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const onCalculate = () =>
    handleAction(() => payrollApi.calculatePayroll(id!), 'Payroll calculation completed successfully!');

  const onReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewModalOpen(false);
    await handleAction(
      () => payrollApi.reviewPayrollPeriod(id!, { notes }),
      'Payroll submitted and marked as Under Review'
    );
    setNotes('');
  };

  const onApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApproveModalOpen(false);
    await handleAction(
      () => payrollApi.approvePayrollPeriod(id!, { notes }),
      'Payroll period approved!'
    );
    setNotes('');
  };

  const onFinalize = () =>
    handleAction(
      () => payrollApi.finalizePayrollPeriod(id!),
      'Payroll finalized and locked! Payslips released to employees.'
    );

  const onPost = () =>
    handleAction(
      () => payrollApi.postPayrollFinance(id!),
      'Payroll successfully posted to Finance ledger with disbursement reference!'
    );

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading payroll period...</div>;
  }

  if (!period) {
    return <div className="p-12 text-center text-sm text-slate-500">Payroll period not found.</div>;
  }

  const steps: { label: string; status: PayrollPeriodStatus }[] = [
    { label: 'Draft', status: 'DRAFT' },
    { label: 'Calculated', status: 'CALCULATED' },
    { label: 'Review', status: 'UNDER_REVIEW' },
    { label: 'Approved', status: 'APPROVED' },
    { label: 'Finalized', status: 'FINALIZED' },
    { label: 'Posted', status: 'POSTED' },
  ];

  const getStepIndex = (st: PayrollPeriodStatus) => {
    switch (st) {
      case 'DRAFT':
        return 0;
      case 'CALCULATING':
        return 0.5;
      case 'CALCULATED':
        return 1;
      case 'UNDER_REVIEW':
        return 2;
      case 'APPROVED':
        return 3;
      case 'FINALIZED':
        return 4;
      case 'POSTED':
        return 5;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(period.status);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/payroll/periods')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{period.name}</h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {period.periodNumber}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Cycle: {new Date(period.startDate).toLocaleDateString()} –{' '}
            {new Date(period.endDate).toLocaleDateString()} • Currency: {period.currency}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(period.status === 'DRAFT' || period.status === 'CALCULATED') && canCalculate && (
            <button
              disabled={actionLoading}
              onClick={onCalculate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{period.status === 'CALCULATED' ? 'Re-Calculate' : 'Calculate Payroll'}</span>
            </button>
          )}

          {period.status === 'CALCULATED' && canReview && (
            <button
              disabled={actionLoading}
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Submit for Review</span>
            </button>
          )}

          {period.status === 'UNDER_REVIEW' && canApprove && (
            <button
              disabled={actionLoading}
              onClick={() => setIsApproveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Payroll</span>
            </button>
          )}

          {period.status === 'APPROVED' && canFinalize && (
            <button
              disabled={actionLoading}
              onClick={onFinalize}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>Finalize & Lock</span>
            </button>
          )}

          {period.status === 'FINALIZED' && canPost && (
            <button
              disabled={actionLoading}
              onClick={onPost}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Post to Finance</span>
            </button>
          )}

          {period.status === 'POSTED' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Disbursed ({period.financePostingReference || 'POSTED'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Visual Pipeline Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Lifecycle Progression
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {steps.map((st, idx) => {
            const isCompleted = currentStepIdx > idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div
                key={st.status}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-400 font-normal'
                }`}
              >
                <div className="text-[10px] tracking-wider uppercase mb-1">Step {idx + 1}</div>
                <div className="text-xs">{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Staff Eligible"
          value={`${period.employeeCount}`}
          subtitle="Processed employees"
          icon={Users}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          title="Gross Pay"
          value={
            canViewSensitive && period.totalGross != null
              ? `${Number(period.totalGross).toLocaleString()} ${period.currency}`
              : 'Protected'
          }
          subtitle="Total pre-tax earnings"
          icon={Coins}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <StatCard
          title="Total Deductions"
          value={
            canViewSensitive && period.totalDeductions != null
              ? `${Number(period.totalDeductions).toLocaleString()} ${period.currency}`
              : 'Protected'
          }
          subtitle="Tax, pension, loans"
          icon={FileText}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Net Payable"
          value={
            canViewSensitive && period.totalNet != null
              ? `${Number(period.totalNet).toLocaleString()} ${period.currency}`
              : 'Protected'
          }
          subtitle="Total net disbursement"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Audit & Notes Card if reviewed or approved */}
      {(period.reviewNotes || period.approvalNotes) && (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
          {period.reviewNotes && (
            <div>
              <span className="font-semibold text-amber-900">Review Notes: </span>
              <span className="text-amber-800">{period.reviewNotes}</span>
            </div>
          )}
          {period.approvalNotes && (
            <div>
              <span className="font-semibold text-emerald-900">Approval Notes: </span>
              <span className="text-emerald-800">{period.approvalNotes}</span>
            </div>
          )}
        </div>
      )}

      {/* Employee Payroll Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Employee Payroll Records</h3>
            <p className="text-xs text-slate-500">Calculated earnings and deductions snapshot</p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            {period.status === 'DRAFT'
              ? 'Click "Calculate Payroll" to evaluate eligible employees.'
              : 'No records calculated.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Payslip #</th>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Designation</th>
                  {canViewSensitive && (
                    <>
                      <th className="px-6 py-3 text-right">Base Salary</th>
                      <th className="px-6 py-3 text-right">Gross Pay</th>
                      <th className="px-6 py-3 text-right">Deductions</th>
                      <th className="px-6 py-3 text-right">Net Pay</th>
                    </>
                  )}
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {rec.payslipNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {rec.employeeNameSnapshot}
                      <div className="text-[11px] font-normal text-slate-400">
                        {rec.employeeNumberSnapshot}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{rec.jobTitleSnapshot}</td>
                    {canViewSensitive && (
                      <>
                        <td className="px-6 py-4 text-right font-mono">
                          {rec.baseSalarySnapshot != null
                            ? Number(rec.baseSalarySnapshot).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {rec.grossPay != null ? Number(rec.grossPay).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rose-600">
                          {rec.totalDeductions != null
                            ? `-${Number(rec.totalDeductions).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                          {rec.netPay != null ? Number(rec.netPay).toLocaleString() : '—'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          rec.status === 'PAID'
                            ? 'success'
                            : rec.status === 'FINALIZED'
                            ? 'brand'
                            : 'info'
                        }
                      >
                        {rec.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Submit Payroll for Review"
      >
        <form onSubmit={onReview} className="space-y-4">
          <p className="text-xs text-slate-600">
            Submit calculated payroll to designated reviewers. You may attach notes regarding
            anomalies or verification items.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Review Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              placeholder="Verified all attendance deductions and new hires..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700"
            >
              Confirm Submission
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Authorize & Approve Payroll"
      >
        <form onSubmit={onApprove} className="space-y-4">
          <p className="text-xs text-slate-600">
            Authorizing this payroll cycle certifies that figures are verified according to
            SchoolOS policy. Segregation of duties applies: creators and calculators cannot
            approve their own payroll.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approval Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              placeholder="Approved for finalization and disbursement..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              Approve Payroll
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
