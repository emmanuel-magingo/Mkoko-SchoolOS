import React, { useEffect, useState } from 'react';
import {
  Coins,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  payrollApi,
  CompensationProfile,
  CompensationStatus,
  PayrollComponentType,
} from '../../api/payrollApi';
import { staffApi, StaffProfile } from '../../api/hrApi';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const CompensationListPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permissions.MANAGE_COMPENSATION);
  const canViewSensitive = hasPermission(Permissions.VIEW_PAYROLL_SENSITIVE);

  const [profiles, setProfiles] = useState<CompensationProfile[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompensationStatus | ''>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    baseSalary: '',
    currency: 'TZS',
    effectiveFrom: '',
    components: [] as Array<{
      name: string;
      code: string;
      type: PayrollComponentType;
      amount: number;
    }>,
  });

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrollApi.getCompensationProfiles({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setProfiles(res.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load compensation profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [page, statusFilter]);

  const openCreateModal = async () => {
    setIsModalOpen(true);
    setCreateError(null);
    try {
      const res = await staffApi.getStaff({ limit: 100, status: 'ACTIVE' });
      setStaffList(res.data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComponent = () => {
    setFormData({
      ...formData,
      components: [
        ...formData.components,
        {
          name: '',
          code: '',
          type: 'HOUSING_ALLOWANCE',
          amount: 0,
        },
      ],
    });
  };

  const handleRemoveComponent = (idx: number) => {
    setFormData({
      ...formData,
      components: formData.components.filter((_, i) => i !== idx),
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError(null);
      await payrollApi.createCompensationProfile({
        employeeId: formData.employeeId,
        baseSalary: Number(formData.baseSalary),
        currency: formData.currency,
        effectiveFrom: formData.effectiveFrom,
        components: formData.components.map((c) => ({
          ...c,
          amount: Number(c.amount),
        })),
      });
      setIsModalOpen(false);
      setFormData({
        employeeId: '',
        baseSalary: '',
        currency: 'TZS',
        effectiveFrom: '',
        components: [],
      });
      fetchProfiles();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error?.message || 'Failed to configure compensation');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Compensation Profiles"
        description="Configure base salary benchmarks, allowances, and statutory deductions per staff member"
        action={
          canManage ? (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Configure Compensation
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

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchProfiles();
          }}
          className="flex items-center gap-2 max-w-sm w-full"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search staff name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CompensationStatus | '');
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUPERSEDED">Superseded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 space-y-2">
            <Coins className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No compensation profiles found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Effective Date</th>
                  {canViewSensitive && <th className="px-6 py-3 text-right">Base Salary</th>}
                  <th className="px-6 py-3">Allowances & Deductions</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {p.employee?.firstName} {p.employee?.lastName}
                      <div className="text-[11px] font-normal text-slate-400">
                        {p.employee?.employeeNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.employee?.jobTitle}</td>
                    <td className="px-6 py-4">
                      {new Date(p.effectiveFrom).toLocaleDateString()}
                      {p.effectiveTo && ` to ${new Date(p.effectiveTo).toLocaleDateString()}`}
                    </td>
                    {canViewSensitive && (
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                        {p.baseSalary != null
                          ? `${Number(p.baseSalary).toLocaleString()} ${p.currency}`
                          : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {p.components && p.components.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.components.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Base only</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          p.status === 'ACTIVE'
                            ? 'success'
                            : p.status === 'SUPERSEDED'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Employee Compensation"
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
              Select Staff Member
            </label>
            <select
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">-- Choose active employee --</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.employeeNumber} - {s.jobTitle})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Salary</label>
              <input
                type="number"
                required
                min={0}
                step="any"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                placeholder="1500000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date</label>
              <input
                type="date"
                required
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Dynamic Components Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Allowances & Deductions (Optional)
              </span>
              <button
                type="button"
                onClick={handleAddComponent}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                + Add Component
              </button>
            </div>

            {formData.components.map((comp, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Component #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveComponent(idx)}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Name (e.g. Housing)"
                    value={comp.name}
                    onChange={(e) => {
                      const updated = [...formData.components];
                      updated[idx].name = e.target.value;
                      updated[idx].code = e.target.value.toUpperCase().replace(/\s+/g, '_');
                      setFormData({ ...formData, components: updated });
                    }}
                    className="px-2 py-1 border border-slate-200 rounded text-xs"
                  />
                  <select
                    value={comp.type}
                    onChange={(e) => {
                      const updated = [...formData.components];
                      updated[idx].type = e.target.value as PayrollComponentType;
                      setFormData({ ...formData, components: updated });
                    }}
                    className="px-2 py-1 border border-slate-200 rounded text-xs"
                  >
                    <option value="HOUSING_ALLOWANCE">Housing Allowance</option>
                    <option value="TRANSPORT_ALLOWANCE">Transport Allowance</option>
                    <option value="RESPONSIBILITY_ALLOWANCE">Responsibility Allowance</option>
                    <option value="OVERTIME">Overtime</option>
                    <option value="OTHER_ALLOWANCE">Other Allowance</option>
                    <option value="TAX">Tax Deduction</option>
                    <option value="PENSION">Pension Deduction</option>
                    <option value="LOAN">Loan Deduction</option>
                    <option value="ADVANCE">Salary Advance</option>
                    <option value="ABSENCE_DEDUCTION">Absence Deduction</option>
                    <option value="OTHER_DEDUCTION">Other Deduction</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Amount"
                    value={comp.amount || ''}
                    onChange={(e) => {
                      const updated = [...formData.components];
                      updated[idx].amount = Number(e.target.value);
                      setFormData({ ...formData, components: updated });
                    }}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {createLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
