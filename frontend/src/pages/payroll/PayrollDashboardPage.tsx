import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  Coins,
  ArrowRight,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { payrollApi, PayrollPeriod } from '../../api/payrollApi';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';

export const PayrollDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewPayroll = hasPermission(Permissions.VIEW_PAYROLL);
  const canCreatePayroll = hasPermission(Permissions.CREATE_PAYROLL);
  const canManageCompensation = hasPermission(Permissions.MANAGE_COMPENSATION);

  const [recentPeriods, setRecentPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (canViewPayroll) {
          const res = await payrollApi.getPayrollPeriods({ page: 1, limit: 5 });
          setRecentPeriods(res.data.items || []);
        }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Failed to load payroll overview');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [canViewPayroll]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral">Draft</Badge>;
      case 'CALCULATING':
        return <Badge variant="warning">Calculating</Badge>;
      case 'CALCULATED':
        return <Badge variant="info">Calculated</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="brand">Approved</Badge>;
      case 'FINALIZED':
        return <Badge variant="success">Finalized</Badge>;
      case 'POSTED':
        return <Badge variant="success">Posted to Finance</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll & Staff Compensation"
        description="Manage salary structures, monthly payroll lifecycles, approvals, and employee compensation"
        action={
          <div className="flex gap-2">
            {canCreatePayroll && (
              <button
                onClick={() => navigate('/payroll/periods')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Payroll Period
              </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canViewPayroll && (
          <div
            onClick={() => navigate('/payroll/periods')}
            className="group cursor-pointer bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-500 hover:shadow-md transition-all space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:scale-105 transition-transform">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Payroll Periods
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Initiate calculation, submit for review, approve, lock, and disburse monthly payrolls.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-brand-600">
              <span>View Periods</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {canManageCompensation && (
          <div
            onClick={() => navigate('/payroll/compensation')}
            className="group cursor-pointer bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Compensation Profiles
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure base salaries, allowances, and recurring deductions for staff members.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span>Manage Compensation</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </div>

      {/* Lifecycle Flow Visual Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          SchoolOS Governed Payroll Pipeline
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { step: '1. Draft', desc: 'Initialize period' },
            { step: '2. Calculate', desc: 'Snapshot salary & line items' },
            { step: '3. Review', desc: 'Audit numbers' },
            { step: '4. Approve', desc: 'Segregation of duties' },
            { step: '5. Finalize', desc: 'Immutable lock' },
            { step: '6. Post', desc: 'Finance disbursement' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1"
            >
              <span className="text-xs font-bold text-brand-400">{item.step}</span>
              <p className="text-[11px] text-slate-300 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payroll Periods Table */}
      {canViewPayroll && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Payroll Periods</h3>
              <p className="text-xs text-slate-500">Track status across current and historical payroll cycles</p>
            </div>
            <button
              onClick={() => navigate('/payroll/periods')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading payroll periods...</div>
          ) : recentPeriods.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 space-y-2">
              <CalendarRange className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No payroll periods created yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-6 py-3">Cycle</th>
                    <th className="px-6 py-3">Employees</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentPeriods.map((period) => (
                    <tr key={period.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {period.name}
                        <div className="text-[11px] font-normal text-slate-400">{period.periodNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(period.startDate).toLocaleDateString()} -{' '}
                        {new Date(period.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium">{period.employeeCount} staff</td>
                      <td className="px-6 py-4">{getStatusBadge(period.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/payroll/periods/${period.id}`)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
