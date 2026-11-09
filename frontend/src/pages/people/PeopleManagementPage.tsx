import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  UserCheck,
  KeyRound,
  MailCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import {
  peopleApi,
  staffApi,
  StaffManagementSummary,
  StaffActivityItem,
} from '../../api/hrApi';
import { StaffListPage } from '../hr/StaffListPage';
import { Badge } from '../../components/common/Badge';
import { TemporaryCredentialModal } from '../../components/hr/TemporaryCredentialModal';

type Section = 'overview' | 'staff' | 'activity';
const sectionNames: Record<Section, string> = {
  overview: 'Overview',
  staff: 'Staff Profiles',
  activity: 'Staff Activity',
};

export const PeopleManagementPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const canViewStaff = hasPermission(Permissions.VIEW_STAFF) || hasPermission(Permissions.MANAGE_STAFF);
  const canViewActivity =
    hasPermission(Permissions.VIEW_STAFF_ACTIVITY) ||
    hasPermission(Permissions.VIEW_STAFF) ||
    hasPermission(Permissions.MANAGE_STAFF);

  const availableSections: Section[] = [
    'overview',
    'staff',
    ...(canViewActivity ? ['activity' as Section] : []),
  ];

  const requestedSection = searchParams.get('section') as Section | null;
  const section: Section =
    requestedSection && availableSections.includes(requestedSection)
      ? requestedSection
      : 'overview';

  const chooseSection = (value: Section) =>
    setSearchParams(value === 'overview' ? {} : { section: value });

  return (
    <main className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage staff profiles, account provisioning, academic workloads, and invitation activity.
          </p>
        </div>
        {canViewStaff && (hasPermission(Permissions.CREATE_STAFF) || hasPermission(Permissions.MANAGE_STAFF)) && (
          <Link
            to="/staff/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all"
          >
            Register Staff
          </Link>
        )}
      </header>

      {/* Simplified 3-Tab Navigation */}
      <nav
        aria-label="Staff management navigation"
        className="flex gap-2 border-b border-slate-200 overflow-x-auto"
      >
        {availableSections.map((item) => (
          <button
            key={item}
            type="button"
            aria-current={section === item ? 'page' : undefined}
            onClick={() => chooseSection(item)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              section === item
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {sectionNames[item]}
          </button>
        ))}
      </nav>

      {section === 'overview' && (
        <StaffManagementOverview
          onNavigateToStaff={() => chooseSection('staff')}
          onNavigateToActivity={() => chooseSection('activity')}
        />
      )}

      {section === 'staff' && <StaffListPage />}

      {section === 'activity' && <StaffActivityPanel />}
    </main>
  );
};

interface OverviewProps {
  onNavigateToStaff: () => void;
  onNavigateToActivity: () => void;
}

const StaffManagementOverview: React.FC<OverviewProps> = ({
  onNavigateToStaff,
  onNavigateToActivity,
}) => {
  const [summary, setSummary] = useState<StaffManagementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await peopleApi.getSummary();
      setSummary(res.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load staff summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-xs">
        Loading staff overview indicators…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
        <span>{error}</span>
        <button onClick={() => void load()} className="font-semibold underline ml-4">
          Retry
        </button>
      </div>
    );
  }

  const totalStaff = summary?.indicators?.totalStaff ?? summary?.staff?.total ?? 0;
  const activeStaff = summary?.indicators?.activeStaff ?? summary?.staff?.active ?? 0;
  const staffWithAccounts = summary?.indicators?.staffWithAccounts ?? summary?.staff?.withAccounts ?? 0;
  const pendingInvitations = summary?.indicators?.pendingInvitations ?? summary?.accounts?.firstLoginPending ?? 0;

  return (
    <section className="space-y-6">
      {/* 4 Essential Indicator Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IndicatorCard
          label="Total Staff"
          value={totalStaff}
          description="Institutional employee records"
          icon={Users}
          colorClass="text-slate-900"
          bgClass="bg-slate-50 border-slate-200"
          onClick={onNavigateToStaff}
        />
        <IndicatorCard
          label="Active Staff"
          value={activeStaff}
          description="Currently active in employment"
          icon={UserCheck}
          colorClass="text-emerald-700"
          bgClass="bg-emerald-50/50 border-emerald-200"
          onClick={onNavigateToStaff}
        />
        <IndicatorCard
          label="Staff with Accounts"
          value={staffWithAccounts}
          description="Linked to SchoolOS login"
          icon={KeyRound}
          colorClass="text-indigo-700"
          bgClass="bg-indigo-50/50 border-indigo-200"
          onClick={onNavigateToStaff}
        />
        <IndicatorCard
          label="Pending Invitations"
          value={pendingInvitations}
          description="Awaiting first-login password setup"
          icon={MailCheck}
          colorClass="text-amber-700"
          bgClass="bg-amber-50/50 border-amber-200"
          onClick={onNavigateToActivity}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">
          Employment status (active/inactive) and account status (credential setup) are tracked as independent concepts.
        </p>
      </div>

      {/* Compact Recent Activity Feed */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Recent Account & Invitation Activity</h2>
          </div>
          <button
            onClick={onNavigateToActivity}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            View all activity →
          </button>
        </div>

        {summary?.recentActivity && summary.recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {summary.recentActivity.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{item.recipient}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{formatEventType(item.eventType)}</span>
                    <span>·</span>
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getEventBadgeVariant(item.eventType)} size="sm">
                    {formatEventType(item.eventType)}
                  </Badge>
                  <span className="text-xs text-slate-400">By {item.actor}</span>
                </div>
              </div>
            ))}
          </div>
        ) : summary?.activity && summary.activity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {summary.activity.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{item.actor}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{item.action.replace(/_/g, ' ')}</span>
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  {item.entityType}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4">No recent account or invitation activity recorded.</p>
        )}
      </div>
    </section>
  );
};

const IndicatorCard: React.FC<{
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  onClick?: () => void;
}> = ({ label, value, description, icon: Icon, colorClass, bgClass, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl border p-5 bg-white shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between`}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{label}</span>
      <div className={`p-2 rounded-xl border ${bgClass}`}>
        <Icon className={`w-4 h-4 ${colorClass}`} />
      </div>
    </div>
    <div className="mt-4">
      <div className={`text-3xl font-extrabold ${colorClass}`}>{value}</div>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  </div>
);

const StaffActivityPanel: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canResend = hasPermission(Permissions.UPDATE_STAFF) || hasPermission(Permissions.MANAGE_USERS);

  const [activities, setActivities] = useState<StaffActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const [credentialModalData, setCredentialModalData] = useState<{
    staffName: string;
    staffEmail?: string | null;
    employeeNumber: string;
    temporaryPassword: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionMessage(null);
    try {
      const res = await staffApi.getStaffActivity();
      setActivities(res.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load staff activity events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResetCredential = async (staffProfileId: string | null, userId: string | null, fallbackEmail?: string) => {
    const targetId = staffProfileId || userId;
    if (!targetId) return;

    try {
      setResendingId(targetId);
      setActionMessage(null);
      const res = await staffApi.resendInvitation(targetId);
      if (res.data.temporaryPassword) {
        setCredentialModalData({
          staffName: res.data.staffName || fallbackEmail || 'Staff Member',
          staffEmail: res.data.recipient,
          employeeNumber: res.data.employeeNumber || '—',
          temporaryPassword: res.data.temporaryPassword,
        });
      }
      setActionMessage({
        text: `New temporary credential generated for ${res.data.recipient || 'staff member'} (Attempt #${res.data.attemptCount}).`,
      });
      await load();
    } catch (err: any) {
      setActionMessage({
        text: err?.response?.data?.error?.message || 'Failed to generate temporary credential. Check 60-second rate limit.',
        isError: true,
      });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <section className="space-y-4">
      {credentialModalData && (
        <TemporaryCredentialModal
          isOpen={Boolean(credentialModalData)}
          onClose={() => setCredentialModalData(null)}
          staffName={credentialModalData.staffName}
          staffEmail={credentialModalData.staffEmail}
          employeeNumber={credentialModalData.employeeNumber}
          temporaryPassword={credentialModalData.temporaryPassword}
          isReset={true}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff Account & Credential Activity</h2>
          <p className="text-xs text-slate-500">
            Real-time audit log of account creation, temporary credentials, first login setups, and administrative resets.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            actionMessage.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {actionMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => void load()} className="font-semibold underline ml-3">
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">When</th>
                <th className="py-3 px-4">Staff Member / Account</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Attempt</th>
                <th className="py-3 px-4">Initiated By</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    Loading activity trail…
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    No staff account or credential events recorded yet.
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {item.staffName ? `${item.staffName}` : item.recipient}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                        {item.employeeNumber && <span className="font-semibold text-slate-700">{item.employeeNumber}</span>}
                        {item.employeeNumber && item.recipient && <span>·</span>}
                        {item.recipient && <span>{item.recipient}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getEventBadgeVariant(item.eventType)} size="sm">
                        {formatEventType(item.eventType)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                      #{item.attemptCount}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      <div>{item.actor}</div>
                      {item.actorRole && (
                        <div className="text-[11px] text-slate-400">{item.actorRole.replace(/_/g, ' ')}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.canResend && canResend && (
                        <button
                          type="button"
                          onClick={() => handleResetCredential(item.staffProfileId, item.userId, item.recipient)}
                          disabled={resendingId === (item.staffProfileId || item.userId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 disabled:opacity-50 transition-colors shadow-2xs"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          {resendingId === (item.staffProfileId || item.userId) ? 'Resetting…' : 'Reset Credential'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

function formatEventType(eventType: string): string {
  switch (eventType) {
    case 'ACCOUNT_CREATED':
      return 'Account Created';
    case 'TEMPORARY_CREDENTIAL_GENERATED':
      return 'Temporary Credential Generated';
    case 'TEMPORARY_CREDENTIAL_RESET':
      return 'Temporary Credential Reset';
    case 'FIRST_LOGIN_COMPLETED':
      return 'First Login Completed';
    case 'PASSWORD_CHANGED':
      return 'Password Changed';
    case 'ACCOUNT_STATUS_CHANGED':
      return 'Status Changed';
    default:
      return eventType.replace(/_/g, ' ');
  }
}

function getEventBadgeVariant(eventType: string): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
  switch (eventType) {
    case 'FIRST_LOGIN_COMPLETED':
    case 'ACCOUNT_CREATED':
      return 'success';
    case 'TEMPORARY_CREDENTIAL_GENERATED':
      return 'info';
    case 'TEMPORARY_CREDENTIAL_RESET':
    case 'PASSWORD_CHANGED':
      return 'warning';
    default:
      return 'neutral';
  }
}
