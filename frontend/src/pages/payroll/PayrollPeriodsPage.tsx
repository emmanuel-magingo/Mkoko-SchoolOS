import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  Plus,
  Filter,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { payrollApi, PayrollPeriod, PayrollPeriodStatus } from '../../api/payrollApi';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const PayrollPeriodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(Permissions.CREATE_PAYROLL);
  const canViewSensitive = hasPermission(Permissions.VIEW_PAYROLL_SENSITIVE);

  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PayrollPeriodStatus | ''>('');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: '',
    endDate: '',
    currency: 'TZS',
  });

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrollApi.getPayrollPeriods({
        page,
        limit: 15,
        status: statusFilter || undefined,
        year: yearFilter || undefined,
      });
      setPeriods(res.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [page, statusFilter, yearFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError(null);
      await payrollApi.createPayrollPeriod(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        startDate: '',
        endDate: '',
        currency: 'TZS',
      });
      fetchPeriods();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error?.message || 'Failed to create payroll period');
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusBadge = (status: PayrollPeriodStatus) => {
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
        return <Badge variant="success">Posted</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Periods"
        description="Manage regular monthly pay runs, calculations, and financial disbursement schedules"
        action={
          canCreate ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Payroll Period
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Filter:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PayrollPeriodStatus | '');
            setPage(1);
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CALCULATED">Calculated</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="FINALIZED">Finalized</option>
          <option value="POSTED">Posted</option>
        </select>

        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          {[0, 1, 2].map((offset) => {
            const yr = new Date().getFullYear() - offset;
            return (
              <option key={yr} value={yr}>
                {yr}
              </option>
            );
          })}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading payroll periods...</div>
        ) : periods.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 space-y-2">
            <CalendarRange className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No payroll periods found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Period #</th>
                  <th className="px-6 py-3">Period Name</th>
                  <th className="px-6 py-3">Date Range</th>
                  <th className="px-6 py-3">Employees</th>
                  {canViewSensitive && <th className="px-6 py-3 text-right">Net Payable</th>}
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {period.periodNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {period.name}
                      <div className="text-[11px] font-normal text-slate-400">
                        Year {period.year} • Month {period.month}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(period.startDate).toLocaleDateString()} -{' '}
                      {new Date(period.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium">{period.employeeCount} staff</td>
                    {canViewSensitive && (
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900">
                        {period.totalNet != null
                          ? `${Number(period.totalNet).toLocaleString()} ${period.currency}`
                          : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">{getStatusBadge(period.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/payroll/periods/${period.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Payroll Period"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Period Name (e.g. October 2026 Payroll)
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              placeholder="October 2026 Regular Salary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Month (1 - 12)</label>
              <input
                type="number"
                required
                min={1}
                max={12}
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {createLoading ? 'Creating...' : 'Create Period'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
