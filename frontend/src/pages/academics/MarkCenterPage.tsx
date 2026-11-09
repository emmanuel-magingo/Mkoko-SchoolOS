import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Send,
  Plus,
  ArrowRight,
  RefreshCw,
  Users,
  Building,
  UploadCloud,
  FileCheck,
  Eye,
  Award,
  Lock,
  XCircle,
} from 'lucide-react';
import { markCenterApi, ExaminationPeriod } from '../../api/markCenterApi';
import { AcademicsApi } from '../../api/academics.api';
import { useAuth } from '../../contexts/AuthContext';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { Modal } from '../../components/common/Modal';

type ActiveTab =
  | 'overview'
  | 'periods'
  | 'timetable'
  | 'papers'
  | 'supervision'
  | 'notices'
  | 'marks-entry'
  | 'review'
  | 'results'
  | 'headteacher'
  | 'reports';

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  PREPARATION: { label: 'Preparation', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PUBLISHED: { label: 'Timetable Published', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  EXAMINATION_IN_PROGRESS: { label: 'Exams In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  MARK_ENTRY: { label: 'Mark Entry Open', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ACADEMIC_REVIEW: { label: 'Academic Review', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  HEADTEACHER_APPROVAL: { label: 'Headteacher Gatekeeper', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  APPROVED: { label: 'Approved by Headteacher', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  PUBLISHED_RESULTS: { label: 'Results Released', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  CLOSED: { label: 'Closed / Archived', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-300' },
};

export const MarkCenterPage: React.FC = () => {
  const { user } = useAuth();
  const { currentAcademicYearId, currentTermId, academicYears } = useAcademicContext();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [periods, setPeriods] = useState<ExaminationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<ExaminationPeriod | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Aux state for school classes, subjects, staff
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Modals state
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [isSupervisionModalOpen, setIsSupervisionModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Form inputs
  const [newPeriodData, setNewPeriodData] = useState({
    name: '',
    category: 'TERMINAL',
    educationLevel: 'O_LEVEL',
    startDate: '',
    endDate: '',
    markEntryStartDate: '',
    markEntryDeadline: '',
    gradingTemplate: 'O_LEVEL',
    instructions: '',
  });

  const [newSessionData, setNewSessionData] = useState({
    classId: '',
    subjectId: '',
    examDate: '',
    startTime: '08:30',
    endTime: '11:00',
    durationMinutes: 150,
    venueName: '',
  });

  const [newPaperData, setNewPaperData] = useState({
    subjectId: '',
    classId: '',
    paperUrl: '',
    paperFileName: '',
  });

  const [newSupervisionData, setNewSupervisionData] = useState({
    sessionId: '',
    supervisorId: '',
    venueName: '',
    notes: '',
  });

  const [newNoticeData, setNewNoticeData] = useState({
    departmentId: '',
    title: '',
    instructions: '',
    paperSubmissionDeadline: '',
    markEntryDeadline: '',
  });

  const [correctionData, setCorrectionData] = useState({
    classId: '',
    subjectId: '',
    reason: '',
  });

  const [rejectionReason, setRejectionReason] = useState('');

  // Controlled Mark Entry state
  const [entryClassId, setEntryClassId] = useState('');
  const [entrySubjectId, setEntrySubjectId] = useState('');
  const [studentRoster, setStudentRoster] = useState<any[]>([]);
  const [marksState, setMarksState] = useState<Record<string, { score: number; comments: string }>>({});

  // Review & Completeness state
  const [completenessData, setCompletenessData] = useState<any>(null);

  // Results calculation state
  const [resultsData, setResultsData] = useState<any>(null);

  // Load periods and auxiliary metadata
  const loadData = async () => {
    try {
      const [periodsRes, classesRes, subjectsRes, deptsRes] = await Promise.all([
        markCenterApi.getPeriods(),
        AcademicsApi.getClasses().catch(() => ({ data: [] })),
        AcademicsApi.getSubjects().catch(() => ({ data: [] })),
        AcademicsApi.getDepartments().catch(() => ({ data: [] })),
      ]);

      const periodList = periodsRes || [];
      setPeriods(periodList);

      if (periodList.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(periodList[0].id);
      }

      setClasses((classesRes as any)?.data || (classesRes as any) || []);
      setSubjects((subjectsRes as any)?.data || (subjectsRes as any) || []);
      setDepartments((deptsRes as any)?.data || (deptsRes as any) || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load Mark Center records.' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch detailed period when selectedPeriodId changes
  useEffect(() => {
    if (!selectedPeriodId) {
      setSelectedPeriod(null);
      return;
    }

    markCenterApi
      .getPeriodById(selectedPeriodId)
      .then((res) => setSelectedPeriod(res))
      .catch(() => setSelectedPeriod(null));
  }, [selectedPeriodId]);

  // Load completeness when in 'review' tab
  useEffect(() => {
    if (activeTab === 'review' && selectedPeriodId) {
      markCenterApi.getCompleteness(selectedPeriodId).then((res) => setCompletenessData(res)).catch(() => {});
    }
  }, [activeTab, selectedPeriodId]);

  // Load class student roster when class changes in marks entry
  useEffect(() => {
    if (entryClassId && activeTab === 'marks-entry') {
      const cls = classes.find((c) => c.id === entryClassId);
      if (cls && cls.students) {
        setStudentRoster(cls.students);
        const initialMarks: Record<string, { score: number; comments: string }> = {};
        cls.students.forEach((st: any) => {
          initialMarks[st.id] = { score: 0, comments: '' };
        });
        setMarksState(initialMarks);
      }
    }
  }, [entryClassId, classes, activeTab]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Actions
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const termId = currentTermId || (academicYears[0]?.terms?.[0]?.id) || '00000000-0000-0000-0000-000000000000';
      const academicYearId = currentAcademicYearId || academicYears[0]?.id || '00000000-0000-0000-0000-000000000000';

      const created = await markCenterApi.createPeriod({
        ...newPeriodData,
        termId,
        academicYearId,
      });

      showNotification('success', `Examination Period "${created.name}" created successfully.`);
      setIsNewPeriodModalOpen(false);
      await loadData();
      setSelectedPeriodId(created.id);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create examination period.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransitionStatus = async (targetStatus: string, reason?: string) => {
    if (!selectedPeriodId) return;
    setActionLoading(true);
    try {
      await markCenterApi.transitionPeriodStatus(selectedPeriodId, targetStatus, reason);
      showNotification('success', `Examination period transitioned to ${targetStatus}.`);
      const updated = await markCenterApi.getPeriodById(selectedPeriodId);
      setSelectedPeriod(updated);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'State transition failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId) return;
    setActionLoading(true);
    try {
      await markCenterApi.createTimetableSession(selectedPeriodId, newSessionData);
      showNotification('success', 'Examination session scheduled with conflict validation passed.');
      setIsSessionModalOpen(false);
      const updated = await markCenterApi.getPeriodById(selectedPeriodId);
      setSelectedPeriod(updated);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to schedule timetable session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId) return;
    setActionLoading(true);
    try {
      await markCenterApi.submitExaminationPaper(selectedPeriodId, newPaperData);
      showNotification('success', 'Examination paper submitted successfully. (Marking scheme omitted as intended).');
      setIsPaperModalOpen(false);
      const updated = await markCenterApi.getPeriodById(selectedPeriodId);
      setSelectedPeriod(updated);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to submit examination paper.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupervisionData.sessionId || !newSupervisionData.supervisorId) return;
    setActionLoading(true);
    try {
      await markCenterApi.assignSupervision(newSupervisionData.sessionId, {
        supervisorId: newSupervisionData.supervisorId,
        venueName: newSupervisionData.venueName,
        notes: newSupervisionData.notes,
      });
      showNotification('success', 'Supervisor assigned successfully.');
      setIsSupervisionModalOpen(false);
      if (selectedPeriodId) {
        const updated = await markCenterApi.getPeriodById(selectedPeriodId);
        setSelectedPeriod(updated);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to assign supervisor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId || !newNoticeData.departmentId) return;
    setActionLoading(true);
    try {
      await markCenterApi.createDepartmentNotice(selectedPeriodId, newNoticeData);
      showNotification('success', 'Department notice dispatched successfully.');
      setIsNoticeModalOpen(false);
      const updated = await markCenterApi.getPeriodById(selectedPeriodId);
      setSelectedPeriod(updated);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to dispatch department notice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnForCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId || !correctionData.reason.trim()) return;
    setActionLoading(true);
    try {
      await markCenterApi.returnMarksForCorrection(selectedPeriodId, correctionData);
      showNotification('success', 'Mark sheet returned to subject teacher for correction.');
      setIsCorrectionModalOpen(false);
      const comp = await markCenterApi.getCompleteness(selectedPeriodId);
      setCompletenessData(comp);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to return marks for correction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMarks = async (isDraft: boolean) => {
    if (!selectedPeriodId || !entryClassId || !entrySubjectId) return;
    setActionLoading(true);
    try {
      const marksPayload = Object.entries(marksState).map(([studentId, data]) => ({
        studentId,
        score: Number(data.score),
        comments: data.comments,
      }));

      await markCenterApi.recordMarks(selectedPeriodId, {
        classId: entryClassId,
        subjectId: entrySubjectId,
        marks: marksPayload,
        isDraft,
      });

      showNotification('success', isDraft ? 'Marks draft saved successfully.' : 'Official marks submitted for Academic Review.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to record marks.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCalculateResults = async () => {
    if (!selectedPeriodId) return;
    setActionLoading(true);
    try {
      const res = await markCenterApi.calculateResults(selectedPeriodId);
      setResultsData(res);
      showNotification('success', 'Results calculated and NECTA rankings generated successfully.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to calculate results.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHeadteacherApprove = async () => {
    if (!selectedPeriodId) return;
    setActionLoading(true);
    try {
      await markCenterApi.headteacherApproval(selectedPeriodId, 'APPROVE');
      showNotification('success', 'Examination results officially APPROVED by Headteacher.');
      const updated = await markCenterApi.getPeriodById(selectedPeriodId);
      setSelectedPeriod(updated);
    } catch (err: any) {
      showNotification('error', err.message || 'Headteacher approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHeadteacherReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await markCenterApi.headteacherApproval(selectedPeriodId, 'REJECT', rejectionReason);
      showNotification('success', 'Results returned to Academic Review with revision notice.');
      setIsRejectModalOpen(false);
      setRejectionReason('');
      const updated = await markCenterApi.getPeriodById(selectedPeriodId);
      setSelectedPeriod(updated);
    } catch (err: any) {
      showNotification('error', err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedPeriodId) return;
    setActionLoading(true);
    try {
      await markCenterApi.publishResults(selectedPeriodId);
      showNotification('success', 'Results and Report Cards released to students & parents!');
      const updated = await markCenterApi.getPeriodById(selectedPeriodId);
      setSelectedPeriod(updated);
    } catch (err: any) {
      showNotification('error', err.message || 'Results publication failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const currentBadge = selectedPeriod
    ? STATUS_BADGES[selectedPeriod.status] || STATUS_BADGES.DRAFT
    : STATUS_BADGES.DRAFT;

  const hasAcademicDelegation =
    Array.isArray((user as any)?.customPermissions) &&
    (user as any).customPermissions.includes('academics:manage_assessments');
  const isAcademicInitiator =
    user?.role === 'SENIOR_ACADEMIC_MASTER' ||
    hasAcademicDelegation;

  const hasApprovalDelegation =
    Array.isArray((user as any)?.customPermissions) &&
    (user as any).customPermissions.includes('academics:approve_grades');
  const isHeadteacher =
    user?.role === 'HEADMASTER' ||
    hasApprovalDelegation;

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Top Banner & Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs opacity-75 hover:opacity-100 font-semibold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Cockpit Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mark Center Workspace</h1>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  NECTA Standard
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Examination lifecycle orchestrator: timetable preparation, paper moderation, marks control, and Headteacher release.
              </p>
            </div>
          </div>

          {/* Period Selector & New Period Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Exam Period:</span>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {isAcademicInitiator && (
              <button
                onClick={() => setIsNewPeriodModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Exam Period
              </button>
            )}
          </div>
        </div>

        {/* Selected Period Status Matrix Strip */}
        {selectedPeriod && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg border font-semibold ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}>
                {currentBadge.label}
              </span>
              <span className="text-slate-500">
                Dates: <strong className="text-slate-700">{new Date(selectedPeriod.startDate).toLocaleDateString()} – {new Date(selectedPeriod.endDate).toLocaleDateString()}</strong>
              </span>
              <span className="text-slate-500">
                Curriculum Template: <strong className="text-slate-700">{selectedPeriod.gradingTemplate}</strong>
              </span>
            </div>

            {/* Quick Status Advancer */}
            <div className="flex items-center gap-2">
              {selectedPeriod.status === 'DRAFT' && (
                <button
                  onClick={() => handleTransitionStatus('PREPARATION')}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-1 cursor-pointer"
                >
                  Start Preparation <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {selectedPeriod.status === 'PREPARATION' && (
                <button
                  onClick={() => handleTransitionStatus('PUBLISHED')}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-1 cursor-pointer"
                >
                  Publish Timetable <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {selectedPeriod.status === 'PUBLISHED' && (
                <button
                  onClick={() => handleTransitionStatus('EXAMINATION_IN_PROGRESS')}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium flex items-center gap-1 cursor-pointer"
                >
                  Start Examinations <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {selectedPeriod.status === 'EXAMINATION_IN_PROGRESS' && (
                <button
                  onClick={() => handleTransitionStatus('MARK_ENTRY')}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-1 cursor-pointer"
                >
                  Open Mark Entry <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {selectedPeriod.status === 'MARK_ENTRY' && (
                <button
                  onClick={() => handleTransitionStatus('ACADEMIC_REVIEW')}
                  className="px-2.5 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center gap-1 cursor-pointer"
                >
                  Close & Submit for Academic Review <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {selectedPeriod.status === 'ACADEMIC_REVIEW' && (
                <button
                  onClick={() => handleTransitionStatus('HEADTEACHER_APPROVAL')}
                  className="px-2.5 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center gap-1 cursor-pointer"
                >
                  Submit to Headteacher <ShieldCheck className="w-3 h-3" />
                </button>
              )}
              {selectedPeriod.status === 'HEADTEACHER_APPROVAL' && isHeadteacher && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleHeadteacherApprove}
                    className="px-2.5 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Headteacher Approve <CheckCircle2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-2.5 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Reject with Reason <XCircle className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedPeriod.status === 'APPROVED' && (
                <button
                  onClick={handlePublishResults}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-1 cursor-pointer"
                >
                  Release Official Results <Send className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* High-Density Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview', icon: FileSpreadsheet },
          { id: 'periods', label: 'Exam Periods', icon: Calendar },
          { id: 'timetable', label: 'Timetable & Venues', icon: Clock },
          { id: 'papers', label: 'Exam Papers (Paper Only)', icon: UploadCloud },
          { id: 'supervision', label: 'Supervision & Invigilation', icon: Users },
          { id: 'notices', label: 'Department Coordination', icon: Building },
          { id: 'marks-entry', label: 'Controlled Mark Entry', icon: FileCheck },
          { id: 'review', label: 'Academic Review', icon: Eye },
          { id: 'results', label: 'Grading & Rankings', icon: Award },
          { id: 'headteacher', label: 'Headteacher Gatekeeper', icon: ShieldCheck },
          { id: 'reports', label: 'Report Cards & Publication', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-t-xl transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white border-t border-x border-slate-200 text-blue-700 font-bold shadow-2xs -mb-px'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview Cockpit */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Examination Lifecycle Flow
            </h3>
            <p className="text-xs text-slate-600">
              Mkoko SchoolOS strictly enforces structured examination governance. Teachers cannot enter marks outside active windows or without qualified specialization.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {[
                { stage: '1. Draft', desc: 'Initiation by Academic', active: selectedPeriod?.status === 'DRAFT' },
                { stage: '2. Preparation', desc: 'Timetables & Papers', active: selectedPeriod?.status === 'PREPARATION' },
                { stage: '3. Timetable', desc: 'Conflict-Free Matrix', active: selectedPeriod?.status === 'PUBLISHED' },
                { stage: '4. Invigilation', desc: 'Venues & Supervisors', active: selectedPeriod?.status === 'EXAMINATION_IN_PROGRESS' },
                { stage: '5. Mark Entry', desc: 'Teacher Window', active: selectedPeriod?.status === 'MARK_ENTRY' },
                { stage: '6. Review', desc: 'Completeness Check', active: selectedPeriod?.status === 'ACADEMIC_REVIEW' },
                { stage: '7. Gatekeeper', desc: 'Headteacher Approval', active: selectedPeriod?.status === 'HEADTEACHER_APPROVAL' },
                { stage: '8. Approved', desc: 'Ready for Release', active: selectedPeriod?.status === 'APPROVED' },
                { stage: '9. Release', desc: 'Report Cards Published', active: selectedPeriod?.status === 'PUBLISHED_RESULTS' },
                { stage: '10. Archive', desc: 'Immutable Record', active: selectedPeriod?.status === 'CLOSED' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    step.active
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{step.stage}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xl font-bold text-slate-900">{selectedPeriod?.sessions?.length || 0}</span>
                <p className="text-[11px] text-slate-500 font-medium">Scheduled Sessions</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xl font-bold text-slate-900">{selectedPeriod?.papers?.length || 0}</span>
                <p className="text-[11px] text-slate-500 font-medium">Exam Papers Uploaded</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xl font-bold text-slate-900">{selectedPeriod?.departmentNotices?.length || 0}</span>
                <p className="text-[11px] text-slate-500 font-medium">Department Notices</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Quick Actions</h3>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('timetable');
                  setIsSessionModalOpen(true);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">Schedule Exam Session</span>
                  <span className="text-[11px] text-slate-500">Detect room & class conflicts</span>
                </div>
                <Clock className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('papers');
                  setIsPaperModalOpen(true);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">Upload Exam Paper</span>
                  <span className="text-[11px] text-slate-500">Paper document only (no scheme)</span>
                </div>
                <UploadCloud className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={() => setActiveTab('marks-entry')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">Enter / Verify Marks</span>
                  <span className="text-[11px] text-slate-500">Controlled teacher grading roster</span>
                </div>
                <FileCheck className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => setActiveTab('headteacher')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">Headteacher Gatekeeper</span>
                  <span className="text-[11px] text-slate-500">Review and authorize publication</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-orange-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Examination Periods */}
      {activeTab === 'periods' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">All Configured Examination Periods</h3>
            <button
              onClick={() => setIsNewPeriodModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Exam Period
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Examination Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Level / Template</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((p) => {
                  const b = STATUS_BADGES[p.status] || STATUS_BADGES.DRAFT;
                  const isSelected = p.id === selectedPeriodId;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPeriodId(p.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {p.name}
                        {isSelected && <span className="ml-2 text-[10px] text-blue-600 font-bold">(Active)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.category}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.gradingTemplate}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${b.bg} ${b.text} ${b.border}`}>
                          {b.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPeriodId(p.id);
                            setActiveTab('overview');
                          }}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          Open Cockpit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Timetable & Venues */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Examination Timetable Matrix</h3>
              <p className="text-xs text-slate-500">Strict conflict prevention blocks overlapping sessions for the same class or venue.</p>
            </div>
            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Exam Session
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time Slot</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Venue</th>
                  <th className="py-2.5 px-3">Supervisors</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPeriod?.sessions && selectedPeriod.sessions.length > 0 ? (
                  selectedPeriod.sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{new Date(s.examDate).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {s.startTime} – {s.endTime} ({s.durationMinutes}m)
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">{s.class?.name}</td>
                      <td className="py-2.5 px-3 text-slate-800">{s.subject?.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.venueName || 'Unassigned'}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {s.supervisions && s.supervisions.length > 0
                          ? s.supervisions.map((sup: any) => `${sup.supervisor?.firstName} ${sup.supervisor?.lastName}`).join(', ')
                          : 'None allocated'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={async () => {
                            if (confirm('Delete this examination session?')) {
                              await markCenterApi.deleteTimetableSession(s.id);
                              const updated = await markCenterApi.getPeriodById(selectedPeriod.id);
                              setSelectedPeriod(updated);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No examination sessions scheduled yet. Click "Schedule Exam Session" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Examination Papers (Paper Only) */}
      {activeTab === 'papers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Examination Papers Submission & Moderation</h3>
              <p className="text-xs text-slate-500">
                Paper upload only. <strong>Marking schemes are strictly NOT mandatory</strong> and omitted from the process.
              </p>
            </div>
            <button
              onClick={() => setIsPaperModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 self-start cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Examination Paper
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Document File</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPeriod?.papers && selectedPeriod.papers.length > 0 ? (
                  selectedPeriod.papers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.subject?.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.class?.name || 'All Streams'}</td>
                      <td className="py-2.5 px-3 text-blue-600 font-medium">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {p.paperFileName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">v{p.version}</td>
                      <td className="py-2.5 px-3 text-slate-700">{p.teacher?.firstName} {p.teacher?.lastName}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'REVISION_REQUIRED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isAcademicInitiator && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                await markCenterApi.reviewExaminationPaper(p.id, { status: 'APPROVED' });
                                showNotification('success', 'Exam paper approved.');
                                const updated = await markCenterApi.getPeriodById(selectedPeriod.id);
                                setSelectedPeriod(updated);
                              }}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                const fb = prompt('Enter revision required feedback note:');
                                if (fb) {
                                  await markCenterApi.reviewExaminationPaper(p.id, {
                                    status: 'REVISION_REQUIRED',
                                    reviewFeedback: fb,
                                  });
                                  showNotification('success', 'Revision requested.');
                                  const updated = await markCenterApi.getPeriodById(selectedPeriod.id);
                                  setSelectedPeriod(updated);
                                }
                              }}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[11px] hover:bg-rose-700 transition cursor-pointer"
                            >
                              Revision
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No examination papers submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Supervision & Invigilation */}
      {activeTab === 'supervision' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Supervision & Invigilation Allocations</h3>
              <p className="text-xs text-slate-500">Assign supervisors to sessions. Overlap conflict checking protects invigilators from double-booking.</p>
            </div>
            <button
              onClick={() => setIsSupervisionModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Invigilator
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Session Date</th>
                  <th className="py-2.5 px-3">Class & Subject</th>
                  <th className="py-2.5 px-3">Venue</th>
                  <th className="py-2.5 px-3">Invigilator</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPeriod?.sessions && selectedPeriod.sessions.some((s) => s.supervisions && s.supervisions.length > 0) ? (
                  selectedPeriod.sessions.flatMap((s) =>
                    (s.supervisions || []).map((sup: any) => (
                      <tr key={sup.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{new Date(s.examDate).toLocaleDateString()} ({s.startTime}–{s.endTime})</td>
                        <td className="py-2.5 px-3 text-slate-800">{s.class?.name} — {s.subject?.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{sup.venueName || s.venueName || 'Main Hall'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{sup.supervisor?.firstName} {sup.supervisor?.lastName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{sup.notes || '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={async () => {
                              await markCenterApi.removeSupervision(sup.id);
                              showNotification('success', 'Supervision allocation removed.');
                              const updated = await markCenterApi.getPeriodById(selectedPeriod.id);
                              setSelectedPeriod(updated);
                            }}
                            className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No invigilators assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Department Coordination */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Department Notices & Readiness Tracking</h3>
              <p className="text-xs text-slate-500">Dispatch paper deadlines, marking windows, and track department acknowledgments.</p>
            </div>
            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Dispatch Department Notice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Notice Title</th>
                  <th className="py-2.5 px-3">Paper Submission Deadline</th>
                  <th className="py-2.5 px-3">Mark Entry Deadline</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Acknowledgment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPeriod?.departmentNotices && selectedPeriod.departmentNotices.length > 0 ? (
                  selectedPeriod.departmentNotices.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{n.department?.name} ({n.department?.code})</td>
                      <td className="py-2.5 px-3 text-slate-800">{n.title}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {n.paperSubmissionDeadline ? new Date(n.paperSubmissionDeadline).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {n.markEntryDeadline ? new Date(n.markEntryDeadline).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            n.status === 'ACKNOWLEDGED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {n.status === 'PENDING' ? (
                          <button
                            onClick={async () => {
                              await markCenterApi.acknowledgeNotice(n.id);
                              showNotification('success', 'Notice acknowledged.');
                              const updated = await markCenterApi.getPeriodById(selectedPeriod.id);
                              setSelectedPeriod(updated);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {n.acknowledgedBy?.firstName} ({new Date(n.acknowledgedAt).toLocaleDateString()})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No department notices dispatched yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Controlled Mark Entry */}
      {activeTab === 'marks-entry' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Controlled Marks Entry Roster</h3>
              <p className="text-xs text-slate-500">
                Mark entry is strictly locked to assigned and qualified teachers during the active MARK_ENTRY window.
              </p>
            </div>
            {selectedPeriod?.status !== 'MARK_ENTRY' && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Window Locked ({selectedPeriod?.status})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Class:</label>
              <select
                value={entryClassId}
                onChange={(e) => setEntryClassId(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="">Select a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Subject:</label>
              <select
                value={entrySubjectId}
                onChange={(e) => setEntrySubjectId(e.target.value)}
                className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="">Select a subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {studentRoster.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Admission No</th>
                      <th className="py-2.5 px-3">Student Full Name</th>
                      <th className="py-2.5 px-3 w-28">Score (0–100)</th>
                      <th className="py-2.5 px-3 w-24">Grade Preview</th>
                      <th className="py-2.5 px-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentRoster.map((st) => {
                      const scoreVal = marksState[st.id]?.score ?? 0;
                      let gradeLetter = 'F';
                      if (scoreVal >= 75) gradeLetter = 'A';
                      else if (scoreVal >= 65) gradeLetter = 'B';
                      else if (scoreVal >= 45) gradeLetter = 'C';
                      else if (scoreVal >= 30) gradeLetter = 'D';

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 font-semibold text-slate-700">{st.admissionNumber}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{st.firstName} {st.lastName}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={scoreVal}
                              disabled={selectedPeriod?.status !== 'MARK_ENTRY'}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setMarksState((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], score: val },
                                }));
                              }}
                              className="w-20 p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-center focus:outline-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {gradeLetter}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Optional remarks..."
                              value={marksState[st.id]?.comments ?? ''}
                              disabled={selectedPeriod?.status !== 'MARK_ENTRY'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMarksState((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], comments: val },
                                }));
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-500 disabled:bg-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedPeriod?.status === 'MARK_ENTRY' && (
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleSaveMarks(true)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSaveMarks(false)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Submit Final Marks
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              Select both a Class and Subject above to populate the student roster.
            </div>
          )}
        </div>
      )}

      {/* Tab: Academic Review & Completeness */}
      {activeTab === 'review' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Academic Review & Marks Completeness</h3>
              <p className="text-xs text-slate-500">
                Inspect submission progress, detect missing marks per subject, and return incomplete mark sheets for correction.
              </p>
            </div>
            <button
              onClick={() => {
                if (selectedPeriodId) {
                  markCenterApi.getCompleteness(selectedPeriodId).then((res) => setCompletenessData(res));
                }
              }}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {completenessData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-xl font-bold text-slate-900">{completenessData.overallExpected}</span>
                <p className="text-[11px] text-slate-500">Total Expected Marks</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-xl font-bold text-emerald-600">{completenessData.overallRecorded}</span>
                <p className="text-[11px] text-slate-500">Total Recorded Marks</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-xl font-bold text-blue-600">{completenessData.completionRate}%</span>
                <p className="text-[11px] text-slate-500">Overall Completion Rate</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Missing</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completenessData?.subjects && completenessData.subjects.length > 0 ? (
                  completenessData.subjects.map((sub: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.className}</td>
                      <td className="py-2.5 px-3 text-slate-800">{sub.subjectName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{sub.teacherName}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {sub.recordedMarks} / {sub.totalStudents}
                      </td>
                      <td className="py-2.5 px-3">
                        {sub.missingMarks > 0 ? (
                          <span className="text-rose-600 font-bold">{sub.missingMarks} missing</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            sub.status === 'COMPLETE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setCorrectionData({
                              classId: sub.classId,
                              subjectId: sub.subjectId,
                              reason: '',
                            });
                            setIsCorrectionModalOpen(true);
                          }}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Return for Correction
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No review data available for current selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Grading Engine & Rankings */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Grading Engine & Standard Rankings</h3>
              <p className="text-xs text-slate-500">
                Calculates Division I–IV & 0, total points, and competition rankings (1, 1, 3 for ties).
              </p>
            </div>
            <button
              onClick={handleCalculateResults}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 self-start shadow-xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              Process Results & Rankings
            </button>
          </div>

          {resultsData?.classes && resultsData.classes.length > 0 ? (
            <div className="space-y-6">
              {resultsData.classes.map((clsResult: any) => (
                <div key={clsResult.classId} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{clsResult.className} — Result Sheet</span>
                    <span className="text-slate-500 text-[11px] font-medium">{clsResult.totalStudents} Students Ranked</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-slate-600 font-semibold">
                          <th className="py-2 px-3 w-14">Rank</th>
                          <th className="py-2 px-3">Admission No</th>
                          <th className="py-2 px-3">Student Full Name</th>
                          <th className="py-2 px-3">Total Marks</th>
                          <th className="py-2 px-3">Average</th>
                          <th className="py-2 px-3">Points</th>
                          <th className="py-2 px-3">Division</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clsResult.results.map((stRes: any) => (
                          <tr key={stRes.studentId} className="hover:bg-slate-50/80 transition">
                            <td className="py-2 px-3 font-bold text-slate-900">#{stRes.rank}</td>
                            <td className="py-2 px-3 font-medium text-slate-600">{stRes.admissionNumber}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{stRes.studentName}</td>
                            <td className="py-2 px-3 text-slate-700">{stRes.totalMarks}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{stRes.averageScore}%</td>
                            <td className="py-2 px-3 text-slate-700">{stRes.totalPoints} pts</td>
                            <td className="py-2 px-3 font-bold text-blue-700">{stRes.division}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Click "Process Results & Rankings" above to run the grading engine and generate official standings.
            </div>
          )}
        </div>
      )}

      {/* Tab: Headteacher Gatekeeper */}
      {activeTab === 'headteacher' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-950">
            <ShieldCheck className="w-6 h-6 text-orange-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-orange-900">Final Gatekeeper Security Policy</p>
              <p className="text-orange-800 mt-0.5">
                Official examination results and report cards cannot be released or viewed by parents until the Headteacher records formal approval.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-slate-900">Current Period Gatekeeper Status</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <span className="text-slate-500 block text-[11px]">Period Name:</span>
                <span className="font-semibold text-slate-900">{selectedPeriod?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current State:</span>
                <span className="font-semibold text-slate-900">{selectedPeriod?.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Headteacher Approval:</span>
                <span className="font-semibold text-slate-900">
                  {selectedPeriod?.headteacherApprovedAt
                    ? `Approved on ${new Date(selectedPeriod.headteacherApprovedAt).toLocaleDateString()}`
                    : 'Pending Approval'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Approver:</span>
                <span className="font-semibold text-slate-900">
                  {selectedPeriod?.headteacherApprovedBy
                    ? `${selectedPeriod.headteacherApprovedBy.firstName} ${selectedPeriod.headteacherApprovedBy.lastName}`
                    : 'Awaiting Action'}
                </span>
              </div>
            </div>
          </div>

          {/* Action triggers */}
          {isHeadteacher ? (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleHeadteacherApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Examination Results
              </button>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Reject & Return for Revision
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Headteacher Gatekeeper: Final approval and rejection authority is strictly restricted to the Headmaster / School Administrator.</span>
            </div>
          )}
        </div>
      )}

      {/* Tab: Report Cards & Publication */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Results Release & Report Cards</h3>
              <p className="text-xs text-slate-500">
                Release canonical report cards to students and parents following Headteacher authorization.
              </p>
            </div>
            {selectedPeriod?.status === 'APPROVED' && (
              <button
                onClick={handlePublishResults}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Release Official Results
              </button>
            )}
            {selectedPeriod?.status === 'PUBLISHED_RESULTS' && (
              <span className="px-3 py-1.5 rounded-xl bg-green-50 text-green-800 border border-green-200 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Results are Live and Accessible to Parents
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Publication & Privacy Safeguards:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Results snapshots are immutable once published, safeguarding historical rankings against template changes.</li>
              <li>Parents are strictly scoped to view results for their linked children only via PostgreSQL Row-Level Security.</li>
              <li>Official Report Cards include NECTA Division, Average Score, Subject Grades, and Attendance summaries.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal: New Examination Period */}
      <Modal
        isOpen={isNewPeriodModalOpen}
        onClose={() => setIsNewPeriodModalOpen(false)}
        title="Create New Examination Period"
        description="Configure a unified examination cycle for the school."
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePeriod} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Examination Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. Term 1 Terminal Examination 2026"
              value={newPeriodData.name}
              onChange={(e) => setNewPeriodData({ ...newPeriodData, name: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category:</label>
              <select
                value={newPeriodData.category}
                onChange={(e) => setNewPeriodData({ ...newPeriodData, category: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="MID_TERM">Mid-Term Examination</option>
                <option value="TERMINAL">Terminal Examination</option>
                <option value="ANNUAL">Annual Examination</option>
                <option value="MOCK">Mock Examination</option>
                <option value="NATIONAL_PREP">National Prep (NECTA)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Grading Template:</label>
              <select
                value={newPeriodData.gradingTemplate}
                onChange={(e) => setNewPeriodData({ ...newPeriodData, gradingTemplate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="PRIMARY">PRIMARY (Std 1–7: Grades A-E)</option>
                <option value="O_LEVEL">O_LEVEL (Form 1–4: NECTA Best 7)</option>
                <option value="A_LEVEL">A_LEVEL (Form 5–6: ACSEE 3 Principal)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Start Date:</label>
              <input
                type="date"
                required
                value={newPeriodData.startDate}
                onChange={(e) => setNewPeriodData({ ...newPeriodData, startDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">End Date:</label>
              <input
                type="date"
                required
                value={newPeriodData.endDate}
                onChange={(e) => setNewPeriodData({ ...newPeriodData, endDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Instructions & Guidelines:</label>
            <textarea
              rows={2}
              placeholder="Instructions for teachers, departments, and invigilators..."
              value={newPeriodData.instructions}
              onChange={(e) => setNewPeriodData({ ...newPeriodData, instructions: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewPeriodModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Create Examination Period
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Schedule Session */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Schedule Examination Session"
        description="Assign a class, subject, and time slot. System automatically blocks conflicts."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Class:</label>
            <select
              required
              value={newSessionData.classId}
              onChange={(e) => setNewSessionData({ ...newSessionData, classId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 cursor-pointer"
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Subject:</label>
            <select
              required
              value={newSessionData.subjectId}
              onChange={(e) => setNewSessionData({ ...newSessionData, subjectId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 cursor-pointer"
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Exam Date:</label>
            <input
              type="date"
              required
              value={newSessionData.examDate}
              onChange={(e) => setNewSessionData({ ...newSessionData, examDate: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Start Time (HH:MM):</label>
              <input
                type="text"
                required
                value={newSessionData.startTime}
                onChange={(e) => setNewSessionData({ ...newSessionData, startTime: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">End Time (HH:MM):</label>
              <input
                type="text"
                required
                value={newSessionData.endTime}
                onChange={(e) => setNewSessionData({ ...newSessionData, endTime: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 text-center font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Venue / Examination Hall:</label>
            <input
              type="text"
              placeholder="e.g. Main Assembly Hall"
              value={newSessionData.venueName}
              onChange={(e) => setNewSessionData({ ...newSessionData, venueName: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Schedule Session
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload Examination Paper (Paper ONLY) */}
      <Modal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        title="Upload Examination Paper"
        description="Mandatory exam paper upload. Marking scheme is strictly omitted / not required."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitPaper} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Subject:</label>
            <select
              required
              value={newPaperData.subjectId}
              onChange={(e) => setNewPaperData({ ...newPaperData, subjectId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 cursor-pointer"
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Class (Optional):</label>
            <select
              value={newPaperData.classId}
              onChange={(e) => setNewPaperData({ ...newPaperData, classId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 cursor-pointer"
            >
              <option value="">All Streams</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Document File Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. form4-mathematics-terminal-2026.pdf"
              value={newPaperData.paperFileName}
              onChange={(e) => setNewPaperData({ ...newPaperData, paperFileName: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Paper URL / Cloud Storage Path:</label>
            <input
              type="text"
              required
              placeholder="e.g. /uploads/exam-papers/form4-mathematics-terminal-2026.pdf"
              value={newPaperData.paperUrl}
              onChange={(e) => setNewPaperData({ ...newPaperData, paperUrl: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
            <strong>Note:</strong> Marking scheme is not required and should not be attached.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaperModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Submit Paper
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Invigilator */}
      <Modal
        isOpen={isSupervisionModalOpen}
        onClose={() => setIsSupervisionModalOpen(false)}
        title="Assign Invigilator / Supervisor"
        description="Allocate staff to examine sessions with double-booking prevention."
        maxWidth="md"
      >
        <form onSubmit={handleAssignSupervision} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Select Exam Session:</label>
            <select
              required
              value={newSupervisionData.sessionId}
              onChange={(e) => setNewSupervisionData({ ...newSupervisionData, sessionId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 cursor-pointer"
            >
              <option value="">Select a session...</option>
              {selectedPeriod?.sessions?.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.examDate).toLocaleDateString()} ({s.startTime}–{s.endTime}) - {s.class?.name} ({s.subject?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Supervisor / Invigilator ID:</label>
            <input
              type="text"
              required
              placeholder="Enter User / Teacher UUID..."
              value={newSupervisionData.supervisorId}
              onChange={(e) => setNewSupervisionData({ ...newSupervisionData, supervisorId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Specific Venue (Optional):</label>
            <input
              type="text"
              placeholder="e.g. Examination Hall B"
              value={newSupervisionData.venueName}
              onChange={(e) => setNewSupervisionData({ ...newSupervisionData, venueName: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSupervisionModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Assign Invigilator
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Dispatch Department Notice */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Dispatch Department Examination Notice"
        description="Notify academic departments of deadlines for papers and marks."
        maxWidth="md"
      >
        <form onSubmit={handleCreateNotice} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Department:</label>
            <select
              required
              value={newNoticeData.departmentId}
              onChange={(e) => setNewNoticeData({ ...newNoticeData, departmentId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500 cursor-pointer"
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Notice Title:</label>
            <input
              type="text"
              required
              placeholder="e.g. Science Dept: Examination Paper Submission Instructions"
              value={newNoticeData.title}
              onChange={(e) => setNewNoticeData({ ...newNoticeData, title: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Paper Deadline:</label>
              <input
                type="date"
                value={newNoticeData.paperSubmissionDeadline}
                onChange={(e) => setNewNoticeData({ ...newNoticeData, paperSubmissionDeadline: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mark Entry Deadline:</label>
              <input
                type="date"
                value={newNoticeData.markEntryDeadline}
                onChange={(e) => setNewNoticeData({ ...newNoticeData, markEntryDeadline: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Instructions:</label>
            <textarea
              rows={3}
              placeholder="Guidance on paper formatting and standards..."
              value={newNoticeData.instructions}
              onChange={(e) => setNewNoticeData({ ...newNoticeData, instructions: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Dispatch Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Return Marks for Correction */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Return Marks for Teacher Correction"
        description="Notify the teacher to correct invalid or missing marks."
        maxWidth="md"
      >
        <form onSubmit={handleReturnForCorrection} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Correction Instructions:</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. 5 students have unentered marks; please complete the roster by tomorrow."
              value={correctionData.reason}
              onChange={(e) => setCorrectionData({ ...correctionData, reason: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !correctionData.reason.trim()}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              Return for Correction
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Headteacher Reject Reason */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Results & Return to Academic Review"
        description="Provide a clear, mandatory reason for the rejection so the Academic Master can resolve anomalies."
        maxWidth="md"
      >
        <form onSubmit={handleHeadteacherReject} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mandatory Rejection Reason:</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Physics practical marks appear unentered for stream B; please verify before publication."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !rejectionReason.trim()}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MarkCenterPage;
