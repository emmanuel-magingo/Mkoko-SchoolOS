import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ShieldAlert,
  Trash2,
  CheckCircle,
  XCircle,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Filter,
  Printer,
  Plus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  getDutyRoster,
  getMyDutySchedule,
  assignDuty,
  signOffDuty,
  substituteDuty,
  getDutyDistribution,
  revokeDuty,
  DutyRosterAssignment,
  DutyDistributionSummary,
} from '../../api/timetableApi';
import { AcademicsApi } from '../../api/academics.api';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';

const DUTY_TYPES = [
  { value: 'WEEKLY_TOD', label: 'Teacher on Duty (TOD - Weekly General)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { value: 'MORNING_PREP', label: 'Morning Prep Supervision', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'NIGHT_PREP', label: 'Night Prep / Study Hall', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'ASSEMBLY', label: 'Morning Assembly', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'BREAK_SUPERVISION', label: 'Break Supervision', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'LUNCH_SUPERVISION', label: 'Lunch Supervision', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { value: 'EVENING_PREP', label: 'Evening Prep', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { value: 'SUPERVISED_STUDY', label: 'Supervised Study', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { value: 'WEEKEND_STUDY', label: 'Weekend Study', color: 'bg-violet-100 text-violet-800 border-violet-300' },
  { value: 'REMEDIAL_CLASS', label: 'Remedial Class', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { value: 'OTHER', label: 'Other Duty', color: 'bg-slate-100 text-slate-800 border-slate-300' },
];

export const DutyRosterPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permissions.MANAGE_DUTY_ROSTER);

  // Tabs: 'roster' | 'my-schedule' | 'distribution'
  const [activeTab, setActiveTab] = useState<'roster' | 'my-schedule' | 'distribution'>('roster');

  // Roster lists
  const [roster, setRoster] = useState<DutyRosterAssignment[]>([]);
  const [mySchedule, setMySchedule] = useState<DutyRosterAssignment[]>([]);
  const [distribution, setDistribution] = useState<DutyDistributionSummary | null>(null);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters for School Roster
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterDutyType, setFilterDutyType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<DutyRosterAssignment | null>(null);

  // Assign Form state
  const [assignForm, setAssignForm] = useState({
    teacherId: '',
    dutyType: 'MORNING_PREP',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '07:45',
    location: 'Campus Grounds',
    isExclusiveLocation: true,
    recurrenceRule: 'NONE',
    recurrenceEndDate: '',
  });

  // Sign-Off Form state
  const [signOffForm, setSignOffForm] = useState<{
    status: 'COMPLETED' | 'MISSED';
    notes: string;
    reasonIfMissed: string;
    supervisorNotes: string;
  }>({
    status: 'COMPLETED',
    notes: '',
    reasonIfMissed: '',
    supervisorNotes: '',
  });

  // Substitute Form state
  const [substituteForm, setSubstituteForm] = useState({
    substituteTeacherId: '',
    reason: '',
  });

  // 1. Fetch metadata (teachers)
  useEffect(() => {
    AcademicsApi.getTeachers()
      .then((res: any) => {
        setTeachers(res.data || []);
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Roster
  const fetchRoster = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDutyRoster({
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        teacherId: filterTeacherId || undefined,
        dutyType: filterDutyType || undefined,
        status: filterStatus || undefined,
      });
      setRoster(data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError(
          err?.response?.data?.error?.message ||
            'Access denied: Teacher on Duty access is strictly restricted to the assigned teacher for the relevant week or authorized academic supervisors.'
        );
      } else {
        setError(err?.response?.data?.error?.message || 'Error fetching duty roster');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterTeacherId, filterDutyType, filterStatus]);

  // 3. Fetch My Schedule
  const fetchMySchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMyDutySchedule();
      setMySchedule(data);
    } catch (err: any) {
      console.warn('Error fetching personal duty schedule:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 4. Fetch Distribution
  const fetchDistribution = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDutyDistribution({
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      });
      setDistribution(data);
    } catch (err: any) {
      console.warn('Error fetching duty distribution:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    if (activeTab === 'roster') {
      fetchRoster();
    } else if (activeTab === 'my-schedule') {
      fetchMySchedule();
    } else if (activeTab === 'distribution') {
      fetchDistribution();
    }
  }, [activeTab, fetchRoster, fetchMySchedule, fetchDistribution]);

  // Handlers
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await assignDuty(assignForm);
      setSuccessMsg('Duty assigned successfully.');
      setIsAssignModalOpen(false);
      fetchRoster();
      if (activeTab === 'distribution') fetchDistribution();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to assign duty. Please check conflicts.');
    }
  };

  const handleSignOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuty) return;
    try {
      setError(null);
      await signOffDuty(selectedDuty.id, signOffForm);
      setSuccessMsg('Duty status updated successfully.');
      setIsSignOffModalOpen(false);
      setSelectedDuty(null);
      if (activeTab === 'my-schedule') fetchMySchedule();
      else fetchRoster();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to sign off duty.');
    }
  };

  const handleSubstituteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuty) return;
    try {
      setError(null);
      await substituteDuty(selectedDuty.id, substituteForm);
      setSuccessMsg('Substitute teacher assigned successfully.');
      setIsSubstituteModalOpen(false);
      setSelectedDuty(null);
      fetchRoster();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to assign substitute.');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel or revoke this duty assignment?')) return;
    try {
      setError(null);
      await revokeDuty(id);
      setSuccessMsg('Duty revoked successfully.');
      fetchRoster();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to revoke duty.');
    }
  };

  const getDutyBadge = (dutyType: string) => {
    const found = DUTY_TYPES.find((d) => d.value === dutyType);
    return found ? (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${found.color}`}>
        {found.label}
      </span>
    ) : (
      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
        {dutyType}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">COMPLETED</span>;
      case 'MISSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300">MISSED</span>;
      case 'SUBSTITUTED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">SUBSTITUTED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-500 border border-slate-300">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">ASSIGNED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="School Duty Roster"
        description="Comprehensive management of teacher prep sessions, supervision duties, substitute tracking, and fair workload distribution."
        icon={ShieldAlert}
      />

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs and Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'roster'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            School Duty Roster
          </button>
          <button
            onClick={() => setActiveTab('my-schedule')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'my-schedule'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Duty Schedule
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'distribution'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Duty Fairness & Workload
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            title="Print Schedule"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                setAssignForm({
                  teacherId: teachers[0]?.id || '',
                  dutyType: 'MORNING_PREP',
                  title: 'Morning Prep Supervision',
                  date: new Date().toISOString().split('T')[0],
                  startTime: '07:00',
                  endTime: '07:45',
                  location: 'Assembly Ground',
                  isExclusiveLocation: true,
                  recurrenceRule: 'NONE',
                  recurrenceEndDate: '',
                });
                setIsAssignModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Assign Duty</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ALL SCHOOL DUTIES */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <Filter size={14} />
              <span>Filters:</span>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase">From Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase">To Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase">Duty Type</label>
              <select
                value={filterDutyType}
                onChange={(e) => setFilterDutyType(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="">All Duties</option>
                {DUTY_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase">Teacher</label>
              <select
                value={filterTeacherId}
                onChange={(e) => setFilterTeacherId(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md text-xs bg-white"
              >
                <option value="">All Statuses</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed</option>
                <option value="SUBSTITUTED">Substituted</option>
              </select>
            </div>

            {(filterStartDate || filterEndDate || filterDutyType || filterTeacherId || filterStatus) && (
              <button
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterDutyType('');
                  setFilterTeacherId('');
                  setFilterStatus('');
                }}
                className="text-xs text-rose-600 hover:underline pt-3 font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                Loading duty roster...
              </div>
            ) : roster.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No duty assignments found.</p>
                <p className="text-xs text-slate-400 mt-1">Use "+ Assign Duty" above to schedule prep sessions and supervision.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                    <tr>
                      <th className="px-4 py-3">Duty & Activity</th>
                      <th className="px-4 py-3">Assigned Teacher</th>
                      <th className="px-4 py-3">Date & Day</th>
                      <th className="px-4 py-3">Time Range</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roster.map((duty) => (
                      <tr key={duty.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{duty.title}</div>
                          <div className="mt-1">{getDutyBadge(duty.dutyType)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {duty.teacherName || `${duty.user?.firstName} ${duty.user?.lastName}`}
                          </div>
                          {duty.status === 'SUBSTITUTED' && duty.substituteHistory && duty.substituteHistory.length > 0 && (
                            <div className="text-[11px] text-amber-700 mt-0.5">
                              Substituted for: {duty.substituteHistory[duty.substituteHistory.length - 1].originalTeacherName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          <div>{duty.date || duty.startDate}</div>
                          <div className="text-[11px] text-slate-400 uppercase">{duty.dayOfWeek}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <Clock size={13} className="text-slate-400" />
                            <span>{duty.startTime} - {duty.endTime}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" />
                            <span>{duty.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(duty.status)}
                          {duty.signOff?.reasonIfMissed && (
                            <div className="text-[11px] text-rose-600 mt-1 max-w-[150px] truncate" title={duty.signOff.reasonIfMissed}>
                              Reason: {duty.signOff.reasonIfMissed}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Sign Off Button */}
                            <button
                              onClick={() => {
                                setSelectedDuty(duty);
                                setSignOffForm({
                                  status: duty.status === 'MISSED' ? 'MISSED' : 'COMPLETED',
                                  notes: duty.signOff?.notes || '',
                                  reasonIfMissed: duty.signOff?.reasonIfMissed || '',
                                  supervisorNotes: '',
                                });
                                setIsSignOffModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Sign off duty completion"
                            >
                              Sign Off
                            </button>

                            {/* Substitute Button */}
                            {canManage && duty.status !== 'COMPLETED' && (
                              <button
                                onClick={() => {
                                  setSelectedDuty(duty);
                                  setSubstituteForm({
                                    substituteTeacherId: teachers.find((t) => t.id !== duty.teacherId)?.id || '',
                                    reason: '',
                                  });
                                  setIsSubstituteModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                                title="Assign substitute teacher"
                              >
                                Substitute
                              </button>
                            )}

                            {/* Revoke Button */}
                            {canManage && (
                              <button
                                onClick={() => handleRevoke(duty.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                title="Revoke duty assignment"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY DUTIES (Personal Teacher View) */}
      {activeTab === 'my-schedule' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 text-base mb-1">My Personal Supervised Duties</h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorized personal duty schedule. Sign off after completing your supervised prep, assembly, or study session.
            </p>

            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading your schedule...</div>
            ) : mySchedule.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p className="font-medium text-slate-700">You have no upcoming duty assignments scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mySchedule.map((duty) => (
                  <div
                    key={duty.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        {getDutyBadge(duty.dutyType)}
                        {getStatusBadge(duty.status)}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{duty.title}</h4>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{duty.date || duty.startDate} ({duty.dayOfWeek})</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock size={13} className="text-slate-400" />
                          <span>{duty.startTime} - {duty.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{duty.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {duty.status === 'COMPLETED' ? 'Acknowledged' : 'Pending Action'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDuty(duty);
                          setSignOffForm({
                            status: 'COMPLETED',
                            notes: duty.signOff?.notes || '',
                            reasonIfMissed: '',
                            supervisorNotes: '',
                          });
                          setIsSignOffModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Sign Off Duty
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DUTY FAIRNESS & WORKLOAD DISTRIBUTION */}
      {activeTab === 'distribution' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Workload Fairness & Duty Allocation Metrics</h3>
            <p className="text-xs text-slate-500 mb-6">
              Assists Academic Masters in allocating prep sessions and supervision duties fairly across all teaching staff.
            </p>

            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading distribution metrics...</div>
            ) : !distribution ? (
              <div className="p-8 text-center text-slate-500">No duty metrics available.</div>
            ) : (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Total School Duties</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{distribution.totalDutiesAssigned}</p>
                    <span className="text-xs text-slate-400">Across {distribution.totalTeachers} teachers</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Average Per Teacher</span>
                    <p className="text-2xl font-bold text-brand-600 mt-1">{distribution.averageDutiesPerTeacher}</p>
                    <span className="text-xs text-slate-400">Target balance threshold</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Active Teachers Tracked</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{distribution.totalTeachers}</p>
                    <span className="text-xs text-slate-400">Available staff pool</span>
                  </div>
                </div>

                {/* Fairness Recommendation: Next Recommended Teachers */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserCheck size={16} className="text-emerald-600" />
                    <span>Recommended Next Teachers for Duty Allocation (Lowest Workload)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {distribution.recommendedNextTeachers.map((rec) => (
                      <div
                        key={rec.teacherId}
                        className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 shadow-sm flex items-center gap-2"
                      >
                        <span className="font-semibold text-emerald-800">{rec.teacherName}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px]">
                          {rec.totalDuties} duties ({rec.totalHours}h)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distribution Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Teacher</th>
                        <th className="px-4 py-3 text-center">Total Duties</th>
                        <th className="px-4 py-3 text-center">Completed</th>
                        <th className="px-4 py-3 text-center">Missed</th>
                        <th className="px-4 py-3 text-center">Total Hours</th>
                        <th className="px-4 py-3">Duty Types Covered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {distribution.distribution.map((dist) => {
                        const isUnderloaded = dist.totalDuties < distribution.averageDutiesPerTeacher;
                        return (
                          <tr key={dist.teacherId} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {dist.teacherName}
                              {isUnderloaded && (
                                <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Available for allocation
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-bold">{dist.totalDuties}</td>
                            <td className="px-4 py-3 text-center text-emerald-700 font-semibold">{dist.completedDuties}</td>
                            <td className="px-4 py-3 text-center text-rose-600 font-semibold">{dist.missedDuties}</td>
                            <td className="px-4 py-3 text-center font-mono">{dist.totalHours} hrs</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(dist.byType).map(([type, count]) => (
                                  <span key={type} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                                    {type.replace('_', ' ')}: {count}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN DUTY */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldAlert className="text-brand-600 w-5 h-5" />
                Assign Supervised School Duty
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block mb-1 text-slate-600 font-semibold">Teacher</label>
                <select
                  required
                  value={assignForm.teacherId}
                  onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">Duty Type</label>
                  <select
                    value={assignForm.dutyType}
                    onChange={(e) => {
                      const dt = e.target.value;
                      const found = DUTY_TYPES.find((d) => d.value === dt);
                      setAssignForm({
                        ...assignForm,
                        dutyType: dt,
                        title: found ? `${found.label} Supervision` : assignForm.title,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {DUTY_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">Title / Description</label>
                  <input
                    type="text"
                    required
                    value={assignForm.title}
                    onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">Duty Date</label>
                  <input
                    type="date"
                    required
                    value={assignForm.date}
                    onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">Start Time</label>
                  <input
                    type="time"
                    required
                    value={assignForm.startTime}
                    onChange={(e) => setAssignForm({ ...assignForm, startTime: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">End Time</label>
                  <input
                    type="time"
                    required
                    value={assignForm.endTime}
                    onChange={(e) => setAssignForm({ ...assignForm, endTime: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">Location / Area</label>
                  <input
                    type="text"
                    required
                    value={assignForm.location}
                    onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                    placeholder="e.g. Study Hall A, Dining Hall"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">Recurrence</label>
                  <select
                    value={assignForm.recurrenceRule}
                    onChange={(e) => setAssignForm({ ...assignForm, recurrenceRule: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="NONE">One-time Duty</option>
                    <option value="DAILY">Daily Recurrence</option>
                    <option value="WEEKLY">Weekly Recurrence</option>
                  </select>
                </div>
              </div>

              {assignForm.recurrenceRule !== 'NONE' && (
                <div>
                  <label className="block mb-1 text-slate-600 font-semibold">Recurrence End Date</label>
                  <input
                    type="date"
                    required
                    value={assignForm.recurrenceEndDate}
                    onChange={(e) => setAssignForm({ ...assignForm, recurrenceEndDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="exclusive"
                  checked={assignForm.isExclusiveLocation}
                  onChange={(e) => setAssignForm({ ...assignForm, isExclusiveLocation: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="exclusive" className="text-xs text-slate-600">
                  Exclusive location (prevents other duties from using this location simultaneously)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Confirm & Assign Duty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SIGN OFF DUTY */}
      {isSignOffModalOpen && selectedDuty && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Duty Sign-Off & Acknowledgment</h3>
              <button onClick={() => setIsSignOffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSignOffSubmit} className="p-5 space-y-4 text-xs font-medium text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-800 text-sm">{selectedDuty.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {selectedDuty.date} | {selectedDuty.startTime} - {selectedDuty.endTime} | {selectedDuty.location}
                </p>
              </div>

              <div>
                <label className="block mb-1 text-slate-600 font-semibold">Duty Completion Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSignOffForm({ ...signOffForm, status: 'COMPLETED' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      signOffForm.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle size={14} />
                    <span>Completed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignOffForm({ ...signOffForm, status: 'MISSED' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      signOffForm.status === 'MISSED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle size={14} />
                    <span>Missed</span>
                  </button>
                </div>
              </div>

              {signOffForm.status === 'MISSED' && (
                <div>
                  <label className="block mb-1 text-rose-700 font-semibold">
                    Reason for Missed Duty (Required)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={signOffForm.reasonIfMissed}
                    onChange={(e) => setSignOffForm({ ...signOffForm, reasonIfMissed: e.target.value })}
                    className="w-full p-2.5 border border-rose-300 rounded-lg text-xs bg-rose-50/30 focus:ring-2 focus:ring-rose-500"
                    placeholder="Describe reason for missed supervision..."
                  />
                </div>
              )}

              <div>
                <label className="block mb-1 text-slate-600 font-semibold">Notes / Follow-up (Optional)</label>
                <textarea
                  rows={2}
                  value={signOffForm.notes}
                  onChange={(e) => setSignOffForm({ ...signOffForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  placeholder="Observations during supervision, attendance notes, etc."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignOffModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Submit Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUBSTITUTE TEACHER */}
      {isSubstituteModalOpen && selectedDuty && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="text-amber-600 w-5 h-5" />
                Assign Substitute Teacher
              </h3>
              <button onClick={() => setIsSubstituteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubstituteSubmit} className="p-5 space-y-4 text-xs font-medium text-slate-700">
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900">
                <p className="font-bold text-xs">Original Duty: {selectedDuty.title}</p>
                <p className="text-[11px] mt-0.5">
                  Currently assigned to {selectedDuty.teacherName} on {selectedDuty.date} ({selectedDuty.startTime}-{selectedDuty.endTime})
                </p>
              </div>

              <div>
                <label className="block mb-1 text-slate-600 font-semibold">Select Substitute Teacher</label>
                <select
                  required
                  value={substituteForm.substituteTeacherId}
                  onChange={(e) => setSubstituteForm({ ...substituteForm, substituteTeacherId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choose Replacement Teacher...</option>
                  {teachers
                    .filter((t) => t.id !== selectedDuty.teacherId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-600 font-semibold">Reason for Substitution (Required)</label>
                <textarea
                  required
                  rows={3}
                  value={substituteForm.reason}
                  onChange={(e) => setSubstituteForm({ ...substituteForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                  placeholder="e.g. Teacher on official school travel, medical appointment, emergency leave..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubstituteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Confirm Substitute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
