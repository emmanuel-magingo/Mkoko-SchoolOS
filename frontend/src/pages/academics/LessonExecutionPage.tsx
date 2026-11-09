import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  MapPin,
  AlertCircle,
  FileText,
  BookMarked,
  Layers,
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { getMyWeeklySchedule, TeacherWeeklyScheduleResponse } from '../../api/timetableApi';
import { AcademicsApi } from '../../api/academics.api';
import { getTodayTeacherSchedule } from '../../api/attendance.api';
import { LessonLog } from '../../types/academics.types';
import { LessonLogModal } from '../../components/academics/lessons/LessonLogModal';
import { LessonPlansTab, LessonLogbookTab } from './tabs';
import { SubjectTopicsMapping } from './SubjectTopicsMapping';

type ContextualTab = 'schedule' | 'yearly-topics' | 'lesson-plan' | 'logbook';

interface SelectedPeriodContext {
  timetablePeriodId?: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  startTime: string;
  endTime: string;
  lessonDate: string;
}

export const LessonExecutionPage: React.FC = () => {
  const { user } = useAuth();
  const { activeTermId, activeTerm, activeAcademicYear } = useAcademicContext();

  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Derive Day of Week for selectedDate
  const getDayOfWeek = (dateStr: string): string => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const d = new Date(dateStr);
    return days[d.getDay()] || 'MONDAY';
  };

  const selectedDay = getDayOfWeek(selectedDate);

  const [schedule, setSchedule] = useState<TeacherWeeklyScheduleResponse | null>(null);
  const [lessonLogs, setLessonLogs] = useState<LessonLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<Array<{
    subject?: { id: string; name: string; code: string };
    class?: { id: string; name: string; level?: string; stream?: string };
  }>>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  // Modal state
  const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Contextual lesson tabs
  const { id: paramLessonId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ContextualTab>('schedule');
  const [activeLessonContext, setActiveLessonContext] = useState<SelectedPeriodContext | null>(null);

  // Auto-resolve contextual lesson if route param or query params are provided
  useEffect(() => {
    if (!schedule) return;
    if (paramLessonId) {
      for (const day of schedule.scheduleByDay || []) {
        for (const slot of day.slots || []) {
          if (slot.period && (slot.period.id === paramLessonId || (slot.period as any).timetablePeriodId === paramLessonId)) {
            setActiveLessonContext({
              timetablePeriodId: slot.period.id,
              classId: slot.period.classId,
              className: slot.period.className,
              subjectId: slot.period.subjectId,
              subjectName: slot.period.subjectName,
              subjectCode: slot.period.subjectCode,
              startTime: slot.period.startTime,
              endTime: slot.period.endTime,
              lessonDate: selectedDate,
            });
            const tabParam = searchParams.get('tab');
            if (tabParam === 'scheme-of-work' || tabParam === 'yearly-topics') {
              setActiveTab('yearly-topics');
            } else if (tabParam === 'lesson-plan' || tabParam === 'logbook') {
              setActiveTab(tabParam);
            } else {
              setActiveTab('logbook');
            }
            return;
          }
        }
      }
    }

    const sId = searchParams.get('subjectId');
    const cId = searchParams.get('classId');
    if (sId && cId && !activeLessonContext) {
      setActiveLessonContext({
        timetablePeriodId: paramLessonId,
        classId: cId,
        className: searchParams.get('className') || 'Class',
        subjectId: sId,
        subjectName: searchParams.get('subjectName') || 'Subject',
        subjectCode: searchParams.get('subjectCode') || undefined,
        startTime: searchParams.get('startTime') || '08:00',
        endTime: searchParams.get('endTime') || '08:40',
        lessonDate: selectedDate,
      });
      const tabParam = searchParams.get('tab');
      if (tabParam === 'scheme-of-work' || tabParam === 'yearly-topics') {
        setActiveTab('yearly-topics');
      } else if (tabParam === 'lesson-plan' || tabParam === 'logbook') {
        setActiveTab(tabParam);
      } else {
        setActiveTab('yearly-topics');
      }
    }
  }, [schedule, paramLessonId, searchParams, selectedDate]);

  // Fetch teacher's timetable & lesson logs via getTodayTeacherSchedule
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [scheduleRes, logsRes, todayResult] = await Promise.all([
        getMyWeeklySchedule(activeTermId || undefined).catch(() => null),
        AcademicsApi.getLessonLogs({
          teacherId: user?.id,
          startDate: selectedDate,
          endDate: selectedDate,
        }).catch(() => ({ data: [] })),
        getTodayTeacherSchedule(user?.id, selectedDate).catch(() => null),
      ]);

      setSchedule(scheduleRes || todayResult?.scheduleResponse || null);
      setLessonLogs(logsRes.data || []);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to retrieve today\'s instructional periods.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeTermId, user?.id, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user?.role !== 'TEACHER') {
      setTeacherAssignments([]);
      return;
    }
    let active = true;
    setProfileLoading(true);
    AcademicsApi.getTeacherAssignments()
      .then(({ data }) => { if (active) setTeacherAssignments(data || []); })
      .catch((error: any) => {
        if (active) {
          setTeacherAssignments([]);
          setErrorMessage(error?.response?.data?.error?.message || 'Could not load your teaching assignments.');
        }
      })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [user?.role]);

  const assignedSubjects = Array.from(new Map(
    teacherAssignments.flatMap((assignment) => assignment.subject ? [[assignment.subject.id, assignment.subject] as const] : [])
  ).values());
  const assignedClasses = Array.from(new Map(
    teacherAssignments.flatMap((assignment) => assignment.class ? [[assignment.class.id, assignment.class] as const] : [])
  ).values());

  // Extract periods for selectedDay
  const daySchedule = schedule?.scheduleByDay?.find(
    (d) => d.dayOfWeek?.toUpperCase() === selectedDay.toUpperCase()
  );

  const daySlots = (daySchedule?.slots || []).filter(
    (slot) => !slot.isBreak && slot.period
  );

  // Map each slot with its corresponding lesson log if already executed
  const periodsWithLog = daySlots.map((slot) => {
    const period = slot.period!;
    const existingLog = lessonLogs.find(
      (log) =>
        (log.timetablePeriodId && log.timetablePeriodId === period.id) ||
        (log.classId === period.classId && log.subjectId === period.subjectId)
    );
    return {
      slot,
      period,
      existingLog,
    };
  });

  const handleOpenLogModal = (period: any) => {
    setSelectedPeriod({
      timetablePeriodId: period.id,
      classId: period.classId,
      className: period.className,
      subjectId: period.subjectId,
      subjectName: period.subjectName,
      subjectCode: period.subjectCode,
      startTime: period.startTime,
      endTime: period.endTime,
      lessonDate: selectedDate,
    });
    setIsModalOpen(true);
  };

  const executedCount = periodsWithLog.filter(
    (p) => p.existingLog?.status === 'TAUGHT'
  ).length;

  // Tab definitions
  const contextualTabs: Array<{
    id: ContextualTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    {
      id: 'lesson-plan',
      label: 'Lesson Plan',
      icon: FileText,
      description: '5-stage competency-based plan',
    },
    {
      id: 'logbook',
      label: 'My Lesson History',
      icon: BookMarked,
      description: 'Period execution & sign-off',
    },
  ];

  return (
    <div id="lesson-execution-page" className="space-y-6">
      {/* Header with Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Lessons</h1>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {activeTerm?.name || 'Active Term'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Plan your Scheme of Work, prepare daily lessons, and keep your lesson history up to date.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Date:</label>
            <input
              type="date"
              id="lesson-execution-date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {user?.role === 'TEACHER' && (
        <section aria-labelledby="my-teaching-profile" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="my-teaching-profile" className="text-sm font-bold text-slate-900">My Teaching Profile</h2>
              <p className="mt-1 text-xs text-slate-600">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500">Department: {user.academicDepartment?.name || user.department?.name || 'Not assigned'}</p>
              <p className="text-xs text-slate-500">{activeAcademicYear?.name || 'Academic year not set'} · {activeTerm?.name || 'Term not set'}</p>
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-700">My Subjects</h3>
                {profileLoading ? <p className="mt-1 text-xs text-slate-500">Loading assignments…</p> : assignedSubjects.length ? (
                  <ul className="mt-1 flex flex-wrap gap-1.5">{assignedSubjects.map((subject) => <li key={subject.id} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800">{subject.name}</li>)}</ul>
                ) : <p className="mt-1 text-xs text-slate-500">No subjects have been assigned to your account. Contact your school administrator.</p>}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-700">My Classes</h3>
                {profileLoading ? <p className="mt-1 text-xs text-slate-500">Loading assignments…</p> : assignedClasses.length ? (
                  <ul className="mt-1 flex flex-wrap gap-1.5">{assignedClasses.map((classItem) => <li key={classItem.id} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">{classItem.name}</li>)}</ul>
                ) : <p className="mt-1 text-xs text-slate-500">No classes have been assigned to your account. Contact your school administrator.</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      <nav aria-label="Lesson tools" className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('schedule');
            setActiveLessonContext(null);
          }}
          aria-current={activeTab !== 'yearly-topics' ? 'page' : undefined}
          className={`rounded-lg px-4 py-2 text-xs font-semibold ${
            activeTab !== 'yearly-topics'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Daily Lessons
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('yearly-topics');
            setActiveLessonContext(null);
          }}
          aria-current={activeTab === 'yearly-topics' ? 'page' : undefined}
          className={`rounded-lg px-4 py-2 text-xs font-semibold ${
            activeTab === 'yearly-topics'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Scheme of Work
        </button>
      </nav>

      {/* Contextual Lesson Context Banner */}
      {activeLessonContext && (activeTab === 'lesson-plan' || activeTab === 'logbook') && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {activeLessonContext.className}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                    {activeLessonContext.subjectCode || ''} — {activeLessonContext.subjectName}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {activeLessonContext.startTime} – {activeLessonContext.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {activeLessonContext.lessonDate}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('schedule');
                setActiveLessonContext(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
            >
              <XCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Back to Schedule</span>
            </button>
          </div>

          {/* Contextual Tabs */}
          <div className="mt-4 flex gap-1 border-t border-indigo-100 pt-3">
            {contextualTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <>
          {/* Daily Execution Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">Scheduled Periods Today</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {periodsWithLog.length}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 shadow-2xs">
              <span className="text-[11px] font-medium text-emerald-700">Delivered &amp; Signed Off</span>
              <div className="mt-1 text-2xl font-bold text-emerald-800">
                {executedCount}
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 shadow-2xs">
              <span className="text-[11px] font-medium text-amber-700">Pending Execution</span>
              <div className="mt-1 text-2xl font-bold text-amber-800">
                {Math.max(0, periodsWithLog.length - executedCount)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500">Active Day</span>
              <div className="mt-1 text-base font-bold text-slate-800">
                {selectedDay}
              </div>
            </div>
          </div>

          {/* Today's Timetable Periods List/Grid */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3.5 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Today's Assigned Teaching Periods</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {periodsWithLog.length} Periods Scheduled
              </span>
            </div>

            {isLoading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                <p className="text-xs font-medium">Loading today's teaching roster...</p>
              </div>
            ) : periodsWithLog.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-2">
                <Calendar className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">No scheduled periods for {selectedDay}</p>
                <p className="text-[11px] text-slate-400">
                  You do not have any teaching periods scheduled on this day in your timetable.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {periodsWithLog.map(({ slot, period, existingLog }) => {
                  const isLogged = !!existingLog;
                  const isTaught = existingLog?.status === 'TAUGHT';

                  return (
                    <div
                      key={period.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Period Details */}
                      <div className="flex items-start gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-bold text-xs">
                          {slot.slotLabel.replace('Period ', 'P')}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {period.className}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              {period.subjectCode} — {period.subjectName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>{period.startTime} - {period.endTime}</span>
                            </span>
                            {period.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span>{period.room}</span>
                              </span>
                            )}
                          </div>

                          {/* Logged Topic & Status */}
                          {isLogged && (
                            <div className="pt-1.5 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  isTaught
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {isTaught ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-rose-600" />
                                )}
                                <span>{isTaught ? 'Executed' : 'Cancelled'}</span>
                              </span>

                              {existingLog.subTopic ? (
                                <span className="text-xs text-blue-800 font-medium truncate max-w-sm">
                                  🎯 <strong className="font-semibold">{existingLog.topic ? `${existingLog.topic} — ` : ''}</strong>{existingLog.subTopic}
                                </span>
                              ) : existingLog.topic ? (
                                <span className="text-xs text-slate-600 font-medium truncate max-w-sm">
                                  📖 {existingLog.topic}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          id={`btn-execute-lesson-${period.id}`}
                          onClick={() => handleOpenLogModal(period)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-all ${
                            isLogged
                              ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98'
                          }`}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{isLogged ? 'Update Log' : 'Execute / Log'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'yearly-topics' && <SubjectTopicsMapping />}

      {/* Contextual Lesson Plan Tab */}
      {activeTab === 'lesson-plan' && activeLessonContext && (
        <LessonPlansTab
          subjectId={activeLessonContext.subjectId}
          classId={activeLessonContext.classId}
          subjectName={activeLessonContext.subjectName}
          className={activeLessonContext.className}
          lessonDate={activeLessonContext.lessonDate}
        />
      )}

      {/* Contextual Logbook Tab */}
      {activeTab === 'logbook' && activeLessonContext && (
        <LessonLogbookTab
          subjectId={activeLessonContext.subjectId}
          classId={activeLessonContext.classId}
          subjectName={activeLessonContext.subjectName}
          className={activeLessonContext.className}
          lessonDate={activeLessonContext.lessonDate}
          teacherId={user?.id}
          teacherName={user ? `${user.firstName} ${user.lastName}` : undefined}
        />
      )}

      {/* Success Toast Notification */}
      {toastMessage && (
        <div
          id="lesson-execution-toast"
          data-testid="lesson-execution-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-lg animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Lesson Log Modal */}
      <LessonLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setToastMessage('Lesson execution logged successfully! Period marked as Executed.');
          setTimeout(() => setToastMessage(null), 4000);
        }}
        periodData={selectedPeriod}
      />

    </div>
  );
};
