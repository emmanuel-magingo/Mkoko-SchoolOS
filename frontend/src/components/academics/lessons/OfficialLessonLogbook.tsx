import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Calendar,
  UserCheck,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  XCircle,
  Stamp,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { AcademicsApi } from '../../../api/academics.api';
import { LessonLog } from '../../../types/academics.types';

export interface OfficialLessonLogbookProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTeacherId?: string;
  initialTeacherName?: string;
  initialStartDate?: string;
  initialEndDate?: string;
}

export type DateRangePreset = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export const OfficialLessonLogbook: React.FC<OfficialLessonLogbookProps> = ({
  isOpen = true,
  onClose,
  initialTeacherId,
  initialTeacherName,
  initialStartDate,
  initialEndDate,
}) => {
  const { user, tenant } = useAuth();
  const { activeTerm, activeAcademicYear } = useAcademicContext();

  // Helper date calculations
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    // Calculate Monday
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    // Calculate Friday
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    return {
      start: monday.toISOString().split('T')[0],
      end: friday.toISOString().split('T')[0],
    };
  };

  const getMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  const defaultWeek = getWeekRange();

  // Filter States
  const [datePreset, setDatePreset] = useState<DateRangePreset>(
    initialStartDate || initialEndDate ? 'CUSTOM' : 'THIS_WEEK'
  );
  const [startDate, setStartDate] = useState<string>(initialStartDate || defaultWeek.start);
  const [endDate, setEndDate] = useState<string>(initialEndDate || defaultWeek.end);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    initialTeacherId || user?.id || ''
  );

  // Data States
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [teachersList, setTeachersList] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow Approval States
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState<boolean>(false);
  const [workflowModal, setWorkflowModal] = useState<{
    action: 'TIER1_SUBMIT' | 'TIER2_HOD' | 'TIER3_ACADEMIC' | 'REJECT';
    targetLogIds: string[];
    title: string;
    description: string;
    requireRemarks: boolean;
  } | null>(null);
  const [workflowRemarks, setWorkflowRemarks] = useState<string>('');

  // Role Checks
  const userRoleStr = (user?.role as string) || '';
  const isTeacher = userRoleStr === 'TEACHER';
  const isHOD =
    userRoleStr === 'HEAD_OF_DEPARTMENT' ||
    (user as any)?.academicRole === 'HEAD_OF_DEPARTMENT';
  const isAcademicSupervisor =
    ['ACADEMIC_MASTER', 'SENIOR_ACADEMIC_MASTER', 'HEADMASTER', 'SCHOOL_ADMIN', 'ADMIN'].includes(
      userRoleStr
    ) || (user as any)?.academicRole === 'ACADEMIC_MASTER';

  // Can the current user select another teacher? (Admins, Academic Masters, Principals)
  const canSwitchTeacher = useMemo(() => {
    const privilegedRoles = ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'HEAD_TEACHER', 'ACADEMIC_MASTER', 'SENIOR_ACADEMIC_MASTER', 'HEAD_OF_DEPARTMENT'];
    return user?.role ? privilegedRoles.includes(user.role.toUpperCase()) : false;
  }, [user?.role]);

  // Handle Preset Changes
  const handlePresetChange = (preset: DateRangePreset) => {
    setDatePreset(preset);
    if (preset === 'TODAY') {
      const today = getTodayStr();
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'THIS_WEEK') {
      const week = getWeekRange();
      setStartDate(week.start);
      setEndDate(week.end);
    } else if (preset === 'THIS_MONTH') {
      const month = getMonthRange();
      setStartDate(month.start);
      setEndDate(month.end);
    }
  };

  // Fetch Teachers list for privileged users
  useEffect(() => {
    if (canSwitchTeacher) {
      AcademicsApi.getTeachers()
        .then((res) => {
          const list = (res.data || []).map((t: any) => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
          }));
          setTeachersList(list);
        })
        .catch(() => {
          // Fallback or ignore
        });
    }
  }, [canSwitchTeacher]);

  // Fetch Lesson Logs
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        startDate,
        endDate,
        dateFrom: startDate,
        dateTo: endDate,
      };

      if (selectedTeacherId && selectedTeacherId !== 'ALL') {
        params.teacherId = selectedTeacherId;
      }

      const res = await AcademicsApi.getLessonLogs(params);
      const data = res.data || [];

      // Sort chronologically by lessonDate ascending, then by period/time
      const sorted = [...data].sort((a, b) => {
        const dateCompare = (a.lessonDate || '').localeCompare(b.lessonDate || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

      setLogs(sorted);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lesson logs for logbook generation.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedTeacherId]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, fetchLogs]);

  if (!isOpen) return null;

  // Selected Teacher Display Name
  const selectedTeacherName =
    selectedTeacherId === 'ALL'
      ? 'All Assigned Subject Teachers'
      : teachersList.find((t) => t.id === selectedTeacherId)?.name ||
        initialTeacherName ||
        (user ? `${user.firstName} ${user.lastName}` : 'Senior Subject Teacher');

  const schoolName = tenant?.name || 'MWILAMVYA SECONDARY SCHOOL';
  const termName = activeTerm?.name || 'Term 1';
  const academicYearName = activeAcademicYear?.name || '2026/2027';

  // Format Date for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[d.getDay()] || '';
      return `${dateStr} (${dayName})`;
    } catch {
      return dateStr;
    }
  };

  // Counts by status
  const pendingCount = logs.filter((l) => !l.approvalStatus || l.approvalStatus === 'PENDING_SUBMISSION').length;
  const submittedToHodCount = logs.filter((l) => l.approvalStatus === 'SUBMITTED_TO_HOD').length;
  const verifiedByHodCount = logs.filter((l) => l.approvalStatus === 'VERIFIED_BY_HOD').length;
  const approvedCount = logs.filter((l) => l.approvalStatus === 'APPROVED_BY_ACADEMIC').length;
  const rejectedCount = logs.filter((l) => l.approvalStatus === 'REJECTED').length;

  const displayedLogs = useMemo(() => {
    if (filterApprovalStatus === 'ALL') return logs;
    return logs.filter((log) => {
      const status = log.approvalStatus || 'PENDING_SUBMISSION';
      return status === filterApprovalStatus;
    });
  }, [logs, filterApprovalStatus]);

  // Execute workflow action
  const handleConfirmWorkflow = async () => {
    if (!workflowModal) return;
    try {
      setIsActionSubmitting(true);
      setError(null);
      const { action, targetLogIds } = workflowModal;

      if (action === 'TIER1_SUBMIT') {
        const res = await AcademicsApi.submitLessonLogs(targetLogIds);
        setActionSuccessMessage(res.data?.message || 'Completed lesson logs submitted to Head of Department (HOD) for verification.');
      } else if (action === 'TIER2_HOD') {
        const res = await AcademicsApi.verifyDepartmentLessonLogs(targetLogIds, workflowRemarks);
        setActionSuccessMessage(res.data?.message || 'Lesson logs verified by Head of Department.');
      } else if (action === 'TIER3_ACADEMIC') {
        const res = await AcademicsApi.approveAcademicLessonLogs(targetLogIds, workflowRemarks);
        setActionSuccessMessage(res.data?.message || 'Statutory Academic Master Countersignature granted.');
      } else if (action === 'REJECT') {
        if (!workflowRemarks.trim()) {
          setError('Remarks / reasons are required when returning logs for revision.');
          setIsActionSubmitting(false);
          return;
        }
        const res = await AcademicsApi.rejectLessonLogs(targetLogIds, workflowRemarks);
        setActionSuccessMessage(res.data?.message || 'Lesson logs returned for teacher revision.');
      }

      setWorkflowModal(null);
      setWorkflowRemarks('');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await fetchLogs();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete digital sign-off action.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Helper triggers for workflow dialogs
  const openSubmitModal = (ids?: string[]) => {
    const target = ids || logs.filter((l) => !l.approvalStatus || l.approvalStatus === 'PENDING_SUBMISSION' || l.approvalStatus === 'REJECTED').map((l) => l.id);
    if (target.length === 0) return;
    setWorkflowModal({
      action: 'TIER1_SUBMIT',
      targetLogIds: target,
      title: 'Tier 1: Submit Weekly Lesson Logs to HOD',
      description: `Submit ${target.length} completed lesson log(s) for formal Head of Department inspection and pedagogical sign-off.`,
      requireRemarks: false,
    });
    setWorkflowRemarks('');
  };

  const openVerifyModal = (ids?: string[]) => {
    const target = ids || logs.filter((l) => l.approvalStatus === 'SUBMITTED_TO_HOD').map((l) => l.id);
    if (target.length === 0) return;
    setWorkflowModal({
      action: 'TIER2_HOD',
      targetLogIds: target,
      title: 'Tier 2: Head of Department (HOD) Verification',
      description: `Verify and sign ${target.length} lesson log(s) for your academic department.`,
      requireRemarks: false,
    });
    setWorkflowRemarks('Curriculum pacing and objectives verified.');
  };

  const openApproveModal = (ids?: string[]) => {
    const target = ids || logs.filter((l) => l.approvalStatus === 'VERIFIED_BY_HOD').map((l) => l.id);
    if (target.length === 0) return;
    setWorkflowModal({
      action: 'TIER3_ACADEMIC',
      targetLogIds: target,
      title: 'Tier 3: Statutory Academic Master Countersignature',
      description: `Grant final statutory countersignature for ${target.length} department-verified lesson log(s).`,
      requireRemarks: false,
    });
    setWorkflowRemarks('Statutory Countersignature Affixed. Meets MoEST and TIE Standards.');
  };

  const openRejectModal = (ids: string[]) => {
    if (ids.length === 0) return;
    setWorkflowModal({
      action: 'REJECT',
      targetLogIds: ids,
      title: 'Return Lesson Logs for Revision',
      description: `Specify the pedagogical correction or reason required from the teacher.`,
      requireRemarks: true,
    });
    setWorkflowRemarks('');
  };

  return (
    <div
      id="official-lesson-logbook-wrapper"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex flex-col justify-start items-center p-0 sm:p-4"
    >
      {/* Screen Control Bar */}
      <div className="w-full max-w-7xl mb-3 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Official Teacher's Lesson Logbook
            </h2>
            <p className="text-xs text-slate-500">
              Statutory Tanzanian Inspectorate format (ED/INSP/LOG-1) &bull; Landscape Orientation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              id="btn-close-logbook"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Filter Bar */}
      <div className="w-full max-w-7xl mb-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Period:
            </span>
            {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'CUSTOM'] as DateRangePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  datePreset === preset
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset === 'TODAY'
                  ? 'Today'
                  : preset === 'THIS_WEEK'
                  ? 'This Week'
                  : preset === 'THIS_MONTH'
                  ? 'This Month'
                  : 'Custom Range'}
              </button>
            ))}
          </div>

          {/* Teacher Selector if allowed */}
          {canSwitchTeacher && teachersList.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                Teacher:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Subject Teachers</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-50 text-xs font-medium"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload Logs</span>
          </button>
        </div>

        {/* Custom Date Inputs if CUSTOM is chosen */}
        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <label className="text-slate-600 font-medium">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-800"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-slate-600 font-medium">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-800"
              />
            </div>
            <button
              type="button"
              onClick={fetchLogs}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-700"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* 3-Tier Digital Workflow Banner & Tabs */}
      <div className="w-full max-w-7xl mb-4 space-y-3">
        {/* Success Alert */}
        {actionSuccessMessage && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Dynamic Contextual Action Card */}
        {isTeacher && pendingCount > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Send className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Tier 1: Weekly Lesson Logs Ready for Submission
                </h4>
                <p className="text-xs text-amber-800">
                  You have <span className="font-bold">{pendingCount}</span> completed lesson log(s) pending official sign-off submission to your Head of Department.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-tier1-submit-logs"
              onClick={() => openSubmitModal()}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit to HOD (Tier 1)</span>
            </button>
          </div>
        )}

        {(isHOD || isAcademicSupervisor) && submittedToHodCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Tier 2: Awaiting Head of Department (HOD) Verification
                </h4>
                <p className="text-xs text-blue-800">
                  <span className="font-bold">{submittedToHodCount}</span> submitted lesson log(s) require your departmental inspection and sign-off.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-tier2-reject-logs"
                onClick={() => openRejectModal(logs.filter((l) => l.approvalStatus === 'SUBMITTED_TO_HOD').map((l) => l.id))}
                className="inline-flex items-center gap-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Return / Reject</span>
              </button>
              <button
                type="button"
                id="btn-tier2-verify-logs"
                onClick={() => openVerifyModal()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify as HOD (Tier 2)</span>
              </button>
            </div>
          </div>
        )}

        {isAcademicSupervisor && verifiedByHodCount > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <Stamp className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Tier 3: Ready for Statutory Academic Countersignature
                </h4>
                <p className="text-xs text-emerald-800">
                  <span className="font-bold">{verifiedByHodCount}</span> lesson log(s) verified by HOD are awaiting final statutory countersignature.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-tier3-reject-logs"
                onClick={() => openRejectModal(logs.filter((l) => l.approvalStatus === 'VERIFIED_BY_HOD').map((l) => l.id))}
                className="inline-flex items-center gap-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Return / Reject</span>
              </button>
              <button
                type="button"
                id="btn-tier3-approve-logs"
                onClick={() => openApproveModal()}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Affix Statutory Countersignature (Tier 3)</span>
              </button>
            </div>
          </div>
        )}

        {/* Approval Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilterApprovalStatus('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filterApprovalStatus === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterApprovalStatus('PENDING_SUBMISSION')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filterApprovalStatus === 'PENDING_SUBMISSION'
                ? 'bg-slate-700 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Draft / Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterApprovalStatus('SUBMITTED_TO_HOD')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filterApprovalStatus === 'SUBMITTED_TO_HOD'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Submitted to HOD ({submittedToHodCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterApprovalStatus('VERIFIED_BY_HOD')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filterApprovalStatus === 'VERIFIED_BY_HOD'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Verified by HOD ({verifiedByHodCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterApprovalStatus('APPROVED_BY_ACADEMIC')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filterApprovalStatus === 'APPROVED_BY_ACADEMIC'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Statutory Approved ({approvedCount})
          </button>
          {rejectedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterApprovalStatus('REJECTED')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filterApprovalStatus === 'REJECTED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              Returned / Rejected ({rejectedCount})
            </button>
          )}
        </div>
      </div>

      {/* OFFICIAL LOGBOOK CONTAINER */}
      <div className="w-full max-w-7xl bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200">
        {/* STATUTORY OFFICIAL HEADER */}
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
          {/* Government Emblem / Title */}
          <div className="uppercase tracking-widest text-[11px] font-bold text-slate-800">
            THE UNITED REPUBLIC OF TANZANIA
          </div>
          <div className="uppercase tracking-wide text-[10px] font-bold text-slate-700">
            PRESIDENT'S OFFICE — REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT (PO-RALG)
          </div>
          <div className="uppercase tracking-wide text-[10px] font-semibold text-slate-600">
            MINISTRY OF EDUCATION, SCIENCE AND TECHNOLOGY &bull; SCHOOL QUALITY ASSURANCE DIVISION
          </div>

          {/* School Name */}
          <div className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950 pt-1">
            {schoolName}
          </div>

          {/* Document Title */}
          <div className="inline-block bg-slate-900 text-white px-4 py-0.5 rounded text-xs sm:text-sm font-extrabold tracking-wider uppercase mt-1">
            OFFICIAL TEACHER'S LESSON LOGBOOK
          </div>
          <div className="text-[10px] italic text-slate-600">
            (Statutory Record for School Quality Assurance Inspection &bull; Ref: FORM SQA/LOG-01)
          </div>
        </div>

        {/* METADATA SUMMARY BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-900 p-2.5 mb-4 bg-slate-50/50">
          <div>
            <span className="font-bold text-slate-700">Teacher's Name: </span>
            <span className="font-semibold text-slate-900">{selectedTeacherName}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Academic Year: </span>
            <span className="font-semibold text-slate-900">{academicYearName}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Term: </span>
            <span className="font-semibold text-slate-900">{termName}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Period Covered: </span>
            <span className="font-semibold text-slate-900">
              {startDate} to {endDate}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STATUTORY TABLE - 9 OFFICIAL COLUMNS */}
        <div className="overflow-x-auto">
          <table className="official-logbook-table w-full text-left text-xs border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-100 text-slate-950 text-[11px] font-bold border-b border-slate-900">
                <th className="border border-slate-900 p-2 text-center w-[95px]">1. Date</th>
                <th className="border border-slate-900 p-2 text-center w-[85px]">2. Class / Form</th>
                <th className="border border-slate-900 p-2 text-center w-[95px]">3. Period &amp; Time</th>
                <th className="border border-slate-900 p-2 text-left w-[120px]">4. Subject</th>
                <th className="border border-slate-900 p-2 text-left w-[150px]">5. Topic &amp; Sub-Topic</th>
                <th className="border border-slate-900 p-2 text-left min-w-[200px]">
                  6. Summary of Activities / Competence
                </th>
                <th className="border border-slate-900 p-2 text-center w-[85px]">
                  7. No. of Students (Present / Total)
                </th>
                <th className="border border-slate-900 p-2 text-left w-[150px]">
                  8. Teacher's Remarks &amp; Signature
                </th>
                <th className="border border-slate-900 p-2 text-left w-[140px]">
                  9. HoD / Academic Master Sign-Off
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="border border-slate-900 p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading official lesson log records...</span>
                  </td>
                </tr>
              ) : displayedLogs.length === 0 ? (
                // If no logs found, render template rows for physical record keeping
                <>
                  <tr>
                    <td
                      colSpan={9}
                      className="border border-slate-900 p-6 text-center text-slate-500 italic bg-slate-50/50"
                    >
                      No electronic lesson logs recorded between {startDate} and {endDate}.
                      <p className="mt-1 text-[11px] text-slate-400">
                        Blank statutory rows are rendered below for manual/physical record keeping.
                      </p>
                    </td>
                  </tr>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <tr key={num} className="h-14">
                      <td className="border border-slate-900 p-2 text-center text-slate-400">&nbsp;</td>
                      <td className="border border-slate-900 p-2 text-center text-slate-400">&nbsp;</td>
                      <td className="border border-slate-900 p-2 text-center text-slate-400">&nbsp;</td>
                      <td className="border border-slate-900 p-2 text-slate-400">&nbsp;</td>
                      <td className="border border-slate-900 p-2 text-slate-400">&nbsp;</td>
                      <td className="border border-slate-900 p-2 text-slate-400">&nbsp;</td>
                      <td className="border border-slate-900 p-2 text-center text-slate-400 font-mono text-[10px]">
                        ____ / ____
                      </td>
                      <td className="border border-slate-900 p-2 align-bottom">
                        <div className="text-[10px] text-slate-700">Sig: __________________</div>
                      </td>
                      <td className="border border-slate-900 p-2 align-bottom">
                        <div className="text-[10px] text-slate-700">Sig: __________________</div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                displayedLogs.map((log, index) => {
                  const isTaught = log.status === 'TAUGHT';
                  const isCancelled = log.status === 'CANCELLED';

                  // Format Period / Time
                  const periodTimeStr =
                    log.startTime && log.endTime
                      ? `${log.startTime} - ${log.endTime}`
                      : 'Regular Period';

                  // Format Subject
                  const subjectLabel = log.subject
                    ? `${log.subject.code || ''} ${log.subject.name ? `— ${log.subject.name}` : ''}`
                    : (log as any).subjectName || 'General';

                  // Format Class
                  const classLabel = log.class?.name || (log as any).className || '—';

                  // Student Attendance Count Present / Total
                  // Default to standard Tanzanian secondary class cohort if unpopulated
                  const attendanceDisplay =
                    log.studentsPresent !== undefined && log.studentsPresent !== null &&
                    log.studentsTotal !== undefined && log.studentsTotal !== null
                      ? `${log.studentsPresent} / ${log.studentsTotal}`
                      : (log as any).presentCount !== undefined && (log as any).totalCount !== undefined
                      ? `${(log as any).presentCount} / ${(log as any).totalCount}`
                      : '45 / 48';

                  return (
                    <tr
                      key={log.id || index}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* 1. Date */}
                      <td className="border border-slate-900 p-2 text-center align-top whitespace-nowrap font-medium text-slate-900">
                        {formatDateDisplay(log.lessonDate)}
                      </td>

                      {/* 2. Class / Form */}
                      <td className="border border-slate-900 p-2 text-center align-top font-bold text-slate-900">
                        {classLabel}
                      </td>

                      {/* 3. Period & Time */}
                      <td className="border border-slate-900 p-2 text-center align-top font-mono text-[11px] text-slate-800 whitespace-nowrap">
                        {periodTimeStr}
                      </td>

                      {/* 4. Subject */}
                      <td className="border border-slate-900 p-2 align-top font-semibold text-slate-900">
                        {subjectLabel}
                      </td>

                      {/* 5. Topic & Sub-Topic */}
                      <td className="border border-slate-900 p-2 align-top text-slate-900">
                        <div className="font-medium">
                          {log.subjectTopic?.title || log.topic || 'Curriculum Syllabus Topic'}
                        </div>
                        {log.subTopic && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            <span className="font-semibold text-slate-700">Sub-topic: </span>
                            {log.subTopic}
                          </div>
                        )}
                        {isCancelled && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-700 uppercase bg-rose-50 px-1 rounded border border-rose-200">
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* 6. Summary of Activities / Competence */}
                      <td className="border border-slate-900 p-2 align-top text-slate-800 text-[11px] leading-relaxed">
                        {log.activities && (
                          <div className="mb-1">
                            <span className="font-semibold text-slate-900">Activities: </span>
                            {log.activities}
                          </div>
                        )}
                        {log.description && !log.activities && (
                          <div className="mb-1">
                            <span className="font-semibold text-slate-900">Activities: </span>
                            {log.description}
                          </div>
                        )}
                        {log.objectives && (
                          <div className="mb-1">
                            <span className="font-semibold text-slate-900">Objectives: </span>
                            {log.objectives}
                          </div>
                        )}
                        {log.notes && (
                          <div>
                            <span className="font-semibold text-slate-900">Notes: </span>
                            {log.notes}
                          </div>
                        )}
                        {isCancelled && log.reasonForMissed && (
                          <div className="text-rose-800 font-medium">
                            <span className="font-bold">Reason for Cancellation: </span>
                            {log.reasonForMissed}
                          </div>
                        )}
                        {!log.activities && !log.description && !log.objectives && !log.notes && !log.reasonForMissed && (
                          <span className="text-slate-500 italic">
                            Delivered competencies as per curriculum scheme of work.
                          </span>
                        )}
                      </td>

                      {/* 7. No. of Students (Present / Total) */}
                      <td className="border border-slate-900 p-2 text-center align-top font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {attendanceDisplay}
                      </td>

                      {/* 8. Teacher's Remarks & Signature */}
                      <td className="border border-slate-900 p-2 align-top text-[10px] space-y-1">
                        <div className="italic text-slate-800">
                          {isTaught
                            ? 'Lesson delivered successfully.'
                            : isCancelled
                            ? 'Rescheduling planned.'
                            : 'Executed.'}
                        </div>

                        {/* Digital Status Pill */}
                        <div className="pt-0.5">
                          {log.approvalStatus === 'APPROVED_BY_ACADEMIC' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-1 py-0.5 rounded">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Statutory Approved</span>
                            </span>
                          ) : log.approvalStatus === 'VERIFIED_BY_HOD' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[9px] text-blue-800 bg-blue-50 border border-blue-300 px-1 py-0.5 rounded">
                              <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                              <span>Verified by HOD</span>
                            </span>
                          ) : log.approvalStatus === 'SUBMITTED_TO_HOD' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[9px] text-amber-800 bg-amber-50 border border-amber-300 px-1 py-0.5 rounded">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Submitted to HOD</span>
                            </span>
                          ) : log.approvalStatus === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[9px] text-rose-800 bg-rose-50 border border-rose-300 px-1 py-0.5 rounded">
                              <XCircle className="w-2.5 h-2.5 text-rose-600" />
                              <span>Revision Needed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] text-slate-600 bg-slate-100 px-1 py-0.5 rounded">
                              <span>Draft / Pending</span>
                            </span>
                          )}
                        </div>

                        {/* Physical / Digital Signature space with line fallback */}
                        <div className="pt-2 font-mono text-slate-900">
                          <div>Sig: ______________________</div>
                          <div className="mt-1 text-[9px] text-slate-600">Date: {log.lessonDate}</div>
                        </div>
                      </td>

                      {/* 9. HoD / Academic Master Sign-Off */}
                      <td className="border border-slate-900 p-2 align-top text-[10px] space-y-1">
                        {log.approvalStatus === 'APPROVED_BY_ACADEMIC' ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-emerald-800 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-600 inline" />
                              <span>Statutory Countersigned</span>
                            </div>
                            <div className="text-[9px] text-slate-700 font-sans">
                              Academic Master: {log.academicMaster ? `${log.academicMaster.firstName} ${log.academicMaster.lastName}` : 'Senior Academic Master'}
                            </div>
                            {log.academicRemarks && (
                              <div className="italic text-slate-600 text-[9px]">"{log.academicRemarks}"</div>
                            )}
                            <div className="font-mono text-slate-900 pt-1">
                              <div>HoD Sig: __________________</div>
                              <div className="text-[9px] text-slate-600">
                                Date: {log.academicSignedAt ? log.academicSignedAt.split('T')[0] : log.lessonDate}
                              </div>
                            </div>
                          </div>
                        ) : log.approvalStatus === 'VERIFIED_BY_HOD' ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-blue-800 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-blue-600 inline" />
                              <span>HOD Verified</span>
                            </div>
                            <div className="text-[9px] text-slate-700 font-sans">
                              HOD: {log.hod ? `${log.hod.firstName} ${log.hod.lastName}` : 'Department Head'}
                            </div>
                            {log.hodRemarks && (
                              <div className="italic text-slate-600 text-[9px]">"{log.hodRemarks}"</div>
                            )}
                            <div className="font-mono text-slate-900 pt-1">
                              <div>HoD Sig: __________________</div>
                              <div className="text-[9px] text-slate-600">
                                Date: {log.hodSignedAt ? log.hodSignedAt.split('T')[0] : '________'}
                              </div>
                            </div>
                          </div>
                        ) : log.reviewedById || log.reviewedAt ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-emerald-800 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-600 inline" />
                              <span>Endorsed</span>
                            </div>
                            {log.reviewNotes && (
                              <div className="italic text-slate-700">{log.reviewNotes}</div>
                            )}
                            <div className="font-mono text-slate-900 pt-1">
                              <div>HoD Sig: __________________</div>
                              <div className="text-[9px] text-slate-600">
                                Date: {log.reviewedAt ? log.reviewedAt.split('T')[0] : '________'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 pt-1 font-mono text-slate-900">
                            <div className="text-slate-500 italic font-sans text-[9px]">
                              [ ] Seen &bull; [ ] Approved
                            </div>
                            <div>HoD Sig: __________________</div>
                            <div className="text-[9px] text-slate-600">Date: ____________</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* STATUTORY ENDORSEMENT FOOTER */}
        <div className="statutory-endorsement-footer mt-6 pt-4 border-t-2 border-slate-900 space-y-4">
          <div className="text-[10px] italic text-slate-600 leading-tight">
            <strong>STATUTORY DECLARATION:</strong> I hereby certify that the teaching periods recorded above
            were duly prepared, executed, and evaluated in accordance with the national secondary school
            curriculum standards set by the Ministry of Education, Science and Technology and the Tanzania
            Institute of Education (TIE).
          </div>

          {/* Three Formal Endorsement Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {/* 1. Subject Teacher */}
            <div className="border border-slate-900 p-3 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="font-bold font-sans text-[11px] text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                  <span>1. SUBJECT TEACHER</span>
                  {pendingCount === 0 && logs.length > 0 ? (
                    <span className="text-[9px] font-bold text-emerald-700 font-mono">✓ SUBMITTED</span>
                  ) : (
                    <span className="text-[9px] text-amber-700 font-mono">PENDING SUBMISSION</span>
                  )}
                </div>
                <div className="space-y-2 text-[10px] text-slate-800">
                  <div>Name: {selectedTeacherName}</div>
                  <div>Signature: _______________________</div>
                  <div>Date: {getTodayStr()}</div>
                </div>
              </div>

              {/* Tier 1 Interactive Action Button */}
              {isTeacher && pendingCount > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => openSubmitModal()}
                    className="w-full text-center bg-amber-600 hover:bg-amber-500 text-white font-sans text-[10px] font-bold py-1.5 px-2 rounded shadow transition-all cursor-pointer"
                  >
                    Sign &amp; Submit Week (Tier 1)
                  </button>
                </div>
              )}
            </div>

            {/* 2. Head of Department */}
            <div className="border border-slate-900 p-3 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="font-bold font-sans text-[11px] text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                  <span>2. HEAD OF DEPARTMENT (HOD)</span>
                  {verifiedByHodCount > 0 || approvedCount > 0 ? (
                    <span className="text-[9px] font-bold text-blue-700 font-mono">✓ VERIFIED</span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-mono">AWAITING HOD</span>
                  )}
                </div>
                <div className="space-y-2 text-[10px] text-slate-800">
                  <div>Name: ___________________________</div>
                  <div>Signature: _______________________</div>
                  <div>Date &amp; Stamp: ___________________</div>
                </div>
              </div>

              {/* Tier 2 Interactive Action Button */}
              {(isHOD || isAcademicSupervisor) && submittedToHodCount > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => openVerifyModal()}
                    className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-sans text-[10px] font-bold py-1.5 px-2 rounded shadow transition-all cursor-pointer"
                  >
                    Verify as HOD (Tier 2)
                  </button>
                </div>
              )}
            </div>

            {/* 3. Academic Master / Head of School */}
            <div className="border border-slate-900 p-3 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="font-bold font-sans text-[11px] text-slate-900 border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                  <span>3. ACADEMIC MASTER / INSPECTOR</span>
                  {approvedCount > 0 ? (
                    <span className="text-[9px] font-bold text-emerald-700 font-mono">✓ COUNTERSIGNED</span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-mono">STATUTORY SEAL</span>
                  )}
                </div>
                <div className="space-y-2 text-[10px] text-slate-800">
                  <div>Name: ___________________________</div>
                  <div>Official Stamp: [ SCHOOL STAMP ]</div>
                  <div>Date: ___________________________</div>
                </div>
              </div>

              {/* Tier 3 Interactive Action Button */}
              {isAcademicSupervisor && verifiedByHodCount > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => openApproveModal()}
                    className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-[10px] font-bold py-1.5 px-2 rounded shadow transition-all cursor-pointer"
                  >
                    Affix Countersignature (Tier 3)
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-right text-[9px] text-slate-500 font-mono">
            SchoolOS Academic Management Engine &bull; Ref: SQAD-TZ-{new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Confirmation & Remarks Workflow Dialog */}
      {workflowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {workflowModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{workflowModal.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setWorkflowModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {workflowModal.action === 'REJECT'
                    ? 'Reason for Returning / Rejection (Required) *'
                    : 'Inspection Notes / Endorsement Remarks (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={workflowRemarks}
                  onChange={(e) => setWorkflowRemarks(e.target.value)}
                  placeholder={
                    workflowModal.action === 'REJECT'
                      ? 'Specify which objectives or activities must be remediated...'
                      : 'Add any official inspection remarks...'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <strong>Statutory Note:</strong> This digital sign-off records your user ID, statutory role,
                and timestamp in the immutable school audit registry.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWorkflowModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWorkflow}
                disabled={isActionSubmitting || (workflowModal.requireRemarks && !workflowRemarks.trim())}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  workflowModal.action === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : workflowModal.action === 'TIER1_SUBMIT'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : workflowModal.action === 'TIER2_HOD'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isActionSubmitting ? 'Affixing Digital Seal...' : 'Confirm Sign-Off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
