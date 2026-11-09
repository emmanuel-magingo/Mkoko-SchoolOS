import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { staffApi, StaffProfile, EmploymentStatus } from '../../api/hrApi';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';

export const StaffListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreateStaff = hasPermission(Permissions.CREATE_STAFF) || hasPermission(Permissions.MANAGE_STAFF);
  const canViewSensitive = hasPermission(Permissions.VIEW_STAFF_SENSITIVE);

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [category, setCategory] = useState<'ALL' | 'TEACHERS' | 'NON_TEACHING'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await staffApi.getStaff({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        category,
      });
      setStaffList(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load staff profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page, statusFilter, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStaff();
  };

  const getStatusBadgeVariant = (status: EmploymentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'info';
      case 'SUSPENDED':
        return 'warning';
      case 'TERMINATED':
      case 'INACTIVE':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & HR Directory"
        description="Manage institution employees, roles, operational records, and delegated authority"
        action={
          canCreateStaff && (
            <button
              onClick={() => navigate('/staff/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              ADD STAFF
            </button>
          )
        }
      />

      {/* Sensitive View indicator */}
      {canViewSensitive && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            You have <strong>VIEW_STAFF_SENSITIVE</strong> clearance. Sensitive identity and emergency contact details are accessible.
          </span>
        </div>
      )}

      <div role="tablist" aria-label="Staff category" className="flex flex-wrap gap-2">
        {([
          ['ALL', 'All Staff'],
          ['TEACHERS', 'Teachers'],
          ['NON_TEACHING', 'Non-teaching Staff'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={category === key}
            onClick={() => {
              setCategory(key);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${category === key ? 'bg-brand-700 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee # or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Employment Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_LEAVE">ON LEAVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="TERMINATED">TERMINATED</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Employee #</th>
                <th className="py-3.5 px-4">Role & Account</th>
                <th className="py-3.5 px-4">Department & Teaching Subjects</th>
                <th className="py-3.5 px-4">Employment Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    Loading staff directory...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No staff profiles found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {staff.firstName[0]}
                          {staff.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {staff.firstName} {staff.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      {staff.employeeNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{staff.user?.role?.replace(/_/g, ' ') || 'No linked account'}</p>
                      <p className={`text-xs ${staff.user?.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {staff.user ? (staff.user.isActive ? 'Account active' : 'Account inactive') : 'Account not linked'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{staff.jobTitle}</p>
                      <p className="text-xs text-slate-500">
                        {staff.user?.role === 'TEACHER'
                          ? staff.academicDepartment?.name || staff.user.academicDepartment?.name || 'Department requires review'
                          : staff.department?.name || 'Operational department unassigned'}
                      </p>
                      {staff.user?.role === 'TEACHER' && (
                        <p className="mt-1 text-xs text-slate-600">
                          Teaching subjects: {(staff.user.subjectQualifications || []).map((qualification) => qualification.subject.name).join(', ') || 'None assigned'}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        {staff.employmentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(staff.employmentStatus)} dot>
                        {staff.employmentStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/staff/${staff.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {staffList.length} of {total} employees
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-1 font-semibold text-slate-700">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 10 >= total || loading}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
