import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { DashboardMetrics } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  Users,
  Building2,
  Receipt,
  CreditCard,
  UserPlus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { AddStudentModal } from './students/AddStudentModal';
import { usePermissions } from '../hooks/usePermissions';
import { Permissions } from '../types/permissions';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'SENIOR_ACADEMIC_MASTER') {
    return <Navigate to="/academics" replace />;
  }
  if (user?.role === 'TEACHER') {
    return <Navigate to="/academics/operations/timetable" replace />;
  }
  return <SchoolDashboardPage />;
};

const SchoolDashboardPage: React.FC = () => {
  const { user, tenant } = useAuth();
  const { hasPermission } = usePermissions();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const res = await api
        .get<DashboardMetrics>('/dashboard/stats')
        .catch(() => api.get<DashboardMetrics>('/dashboard/metrics'));
      setMetrics(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const isSchoolAdminOrSuperAdmin =
    user?.role === 'SCHOOL_ADMIN' || user?.role === 'PLATFORM_ADMIN';

  const canViewFinanceCards = hasPermission(Permissions.VIEW_FINANCE);
  const canViewStudentsCard = hasPermission(Permissions.VIEW_STUDENTS);
  const canViewClassesCard = hasPermission(Permissions.MANAGE_CLASSES) || hasPermission(Permissions.VIEW_ACADEMICS);
  const canViewTeachersCard = hasPermission(Permissions.VIEW_STAFF) || hasPermission(Permissions.VIEW_ACADEMICS);

  const hasAnyKpiCards = canViewStudentsCard || canViewClassesCard || canViewTeachersCard || canViewFinanceCards;
  const canViewStudentBreakdown = hasPermission(Permissions.VIEW_STUDENTS) || hasPermission(Permissions.VIEW_ACADEMICS);
  const canViewRecentStudents = hasPermission(Permissions.VIEW_STUDENTS);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* School Welcome Hero - Shown only to school/system admins */}
      {isSchoolAdminOrSuperAdmin && (
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mkoko SchoolOS SaaS
                </span>
                <span className="text-slate-500">•</span>
                <Badge variant="warning" size="sm">
                  {tenant?.status || 'PILOT'} TENANT
                </Badge>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">
                {metrics?.school.name || tenant?.name || 'Mwilamvya Secondary School'}
              </h2>
              <p className="text-sm text-slate-300 max-w-xl">
                Centralized tenant operations, student registry vertical slice, and database-isolated school records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasPermission(Permissions.CREATE_STUDENTS) && (
                <button
                  id="dashboard-add-student-btn"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
              )}
              {hasPermission(Permissions.VIEW_STUDENTS) && (
                <Link
                  to="/students"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all flex items-center gap-2"
                >
                  <span>View Registry</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Metric Cards Grid - Strictly hide cards the user lacks permissions for */}
      {hasAnyKpiCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {canViewStudentsCard && (
            <StatCard
              title="Total Students"
              value={loading ? '...' : (metrics?.metrics.totalStudents ?? 0).toLocaleString()}
              subtitle="Enrolled in school registry"
              icon={Users}
              iconColor="text-brand-600"
              iconBg="bg-brand-50"
            />
          )}

          {canViewClassesCard && (
            <StatCard
              title="Active Classes"
              value={loading ? '...' : (metrics?.metrics.activeClasses ?? 0)}
              subtitle="Forms and Streams"
              icon={Building2}
              iconColor="text-sky-600"
              iconBg="bg-sky-50"
            />
          )}

          {canViewTeachersCard && (
            <StatCard
              title="Teaching Staff"
              value={loading ? '...' : (metrics?.metrics.teachersCount ?? 0).toLocaleString()}
              subtitle="Active educators"
              icon={GraduationCap}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
          )}

          {canViewFinanceCards && (
            <>
              <StatCard
                title="Outstanding Fees"
                value={
                  loading
                    ? '...'
                    : metrics?.metrics.finance !== null && metrics?.metrics.finance !== undefined
                    ? `TZS ${metrics.metrics.finance.totalOutstandingFees.toLocaleString()}`
                    : '—'
                }
                subtitle={
                  loading
                    ? 'Loading financials...'
                    : metrics?.metrics.finance !== null && metrics?.metrics.finance !== undefined
                    ? metrics.metrics.finance.totalInvoiced > 0
                      ? `${((metrics.metrics.finance.totalCollected / metrics.metrics.finance.totalInvoiced) * 100).toFixed(1)}% collection rate`
                      : 'No active fees'
                    : 'No financial data'
                }
                icon={Receipt}
                iconColor={metrics?.metrics.finance ? 'text-amber-600' : 'text-slate-400'}
                iconBg={metrics?.metrics.finance ? 'bg-amber-50' : 'bg-slate-100'}
              />

              <StatCard
                title="Today's Payments"
                value={
                  loading
                    ? '...'
                    : metrics?.metrics.finance !== null && metrics?.metrics.finance !== undefined
                    ? `TZS ${metrics.metrics.finance.todaysPaymentsTotal.toLocaleString()}`
                    : '—'
                }
                subtitle={
                  loading
                    ? 'Loading receipts...'
                    : metrics?.metrics.finance !== null && metrics?.metrics.finance !== undefined
                    ? `${metrics.metrics.finance.todaysReceiptsCount} payment${metrics.metrics.finance.todaysReceiptsCount === 1 ? '' : 's'} recorded today`
                    : 'No receipts today'
                }
                icon={CreditCard}
                iconColor={metrics?.metrics.finance ? 'text-emerald-600' : 'text-slate-400'}
                iconBg={metrics?.metrics.finance ? 'bg-emerald-50' : 'bg-slate-100'}
              />
            </>
          )}
        </div>
      )}

      {/* Secondary Dashboard Section: Registry Summary + Recent Activity */}
      {(canViewStudentBreakdown || canViewRecentStudents) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Distribution */}
          {canViewStudentBreakdown && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Student Breakdown</h3>
                <span className="text-xs font-semibold text-slate-400">By Lifecycle</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700">Active Students</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {metrics?.statusBreakdown.ACTIVE ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Inactive / Archived</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {metrics?.statusBreakdown.INACTIVE ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="text-xs font-semibold text-slate-700">Graduated Alumni</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {metrics?.statusBreakdown.GRADUATED ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-slate-700">Transferred Out</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {metrics?.statusBreakdown.TRANSFERRED ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Row-Level Security (RLS) is currently enforcing database-level boundary for{' '}
                  <strong>{tenant?.name}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Recent Student Registrations */}
          {canViewRecentStudents && (
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Registrations</h3>
                  <p className="text-xs text-slate-500">Latest enrolled students in this school</p>
                </div>
                <Link
                  to="/students"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Admission No.</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentStudents && metrics.recentStudents.length > 0 ? (
                  metrics.recentStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {s.admissionNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <Link to={`/students/${s.id}`} className="hover:text-brand-600">
                          {s.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{s.className}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={s.status === 'ACTIVE' ? 'success' : 'neutral'}
                          size="sm"
                          dot
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No student records found in this school tenant yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

      {/* Add Student Modal */}
      {hasPermission(Permissions.CREATE_STUDENTS) && (
        <AddStudentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            fetchDashboardMetrics();
          }}
        />
      )}
    </div>
  );
};
