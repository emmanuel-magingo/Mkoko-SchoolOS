import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  UserCheck,
  Plus,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  CalendarRange,
  Settings2,
} from 'lucide-react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { api } from '../../api/client';
import {
  getTimetableMatrix,
  getMyWeeklySchedule,
  getTeacherSchedule,
  getTimetable,
  getClasses,
  getSubjects,
  getTeachers,
  TimetableMatrixResponse,
  TeacherWeeklyScheduleResponse,
  TimetablePeriod,
} from '../../api/timetable.api';
import { MasterMatrixView } from '../../components/academics/timetable/MasterMatrixView';
import { TeacherWeeklyView } from '../../components/academics/timetable/TeacherWeeklyView';
import { ClassWeeklyView } from '../../components/academics/timetable/ClassWeeklyView';
import { TimetableAssignmentModal } from '../../components/academics/timetable/TimetableAssignmentModal';
import { ScheduleConfigModal } from '../../components/timetable/ScheduleConfigModal';

export const TimetableManagement: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { activeTermId, activeTerm } = useAcademicContext();

  const canManage = hasPermission(Permissions.MANAGE_TIMETABLE);
  const isTeacher = user?.role === 'TEACHER';
  const canAccessTod =
    hasPermission(Permissions.MANAGE_DUTY_ROSTER) ||
    Boolean((user as any)?.isTeacherOnDuty || hasPermission(Permissions.VIEW_DUTY_ROSTER)) ||
    ['SCHOOL_ADMIN', 'HEADMASTER', 'SECOND_MASTER', 'SENIOR_ACADEMIC_MASTER', 'ACADEMIC_MASTER', 'ADMIN'].includes(
      user?.role as string
    );
  const effectiveTeacherId = user?.id || '';

  // View mode switcher: Teachers forced strictly to 'TEACHER', Academic Masters default to 'MASTER'
  const [viewMode, setViewMode] = useState<'MASTER' | 'CLASS' | 'TEACHER'>(
    isTeacher ? 'TEACHER' : (canManage ? 'MASTER' : 'CLASS')
  );

  useEffect(() => {
    if (isTeacher) {
      setViewMode('TEACHER');
      if (effectiveTeacherId) {
        setSelectedTeacherId(effectiveTeacherId);
      }
    }
  }, [isTeacher, effectiveTeacherId]);

  // Selected Day for Master Matrix View
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');

  // Metadata dropdown state
  const [classes, setClasses] = useState<Array<{ id: string; name: string; level?: string; stream?: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string; email?: string }>>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string }>>([]);

  // Data states
  const [matrixData, setMatrixData] = useState<TimetableMatrixResponse | null>(null);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(effectiveTeacherId);
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherWeeklyScheduleResponse | null>(null);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);

  const [allPeriods, setAllPeriods] = useState<TimetablePeriod[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Period Configuration & Teacher Filter States
  const [isScheduleConfigModalOpen, setIsScheduleConfigModalOpen] = useState(false);
  const [teacherFilterClassId, setTeacherFilterClassId] = useState<string>('ALL');
  const [teacherFilterLevel, setTeacherFilterLevel] = useState<string>('ALL');

  // Assignment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<{
    periodId?: string;
    classId?: string;
    termId?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    isDoublePeriod?: boolean;
    subjectId?: string;
    teacherId?: string;
  }>({});

  // 1. Fetch Metadata (Classes, Subjects, Teachers, Terms)
  const fetchMetadata = useCallback(async () => {
    try {
      const [classesRes, subjectsRes, teachersRes, termsRes] = await Promise.all([
        getClasses(),
        getSubjects(),
        getTeachers(),
        api.get<any>('/academics/terms'),
      ]);

      const loadedClasses = classesRes;
      const loadedSubjects = subjectsRes;
      const loadedTeachers = teachersRes;
      const loadedTerms = Array.isArray(termsRes.data) ? termsRes.data : (termsRes.data as any)?.data;
      if (!Array.isArray(loadedTerms)) {
        throw new Error('The academic term response was not a list.');
      }

      setClasses(loadedClasses);
      if (loadedClasses.length > 0) {
        setSelectedClassId((prev) => prev || loadedClasses[0].id);
      }
      setSubjects(loadedSubjects);
      setTeachers(loadedTeachers);
      setTerms(
        loadedTerms.length > 0
          ? loadedTerms
          : activeTerm
          ? [{ id: activeTerm.id, name: activeTerm.name }]
          : []
      );
    } catch (cause: any) {
      setErrorMessage(cause?.response?.data?.error?.message || cause?.message || 'Failed to load timetable metadata.');
    }
  }, [activeTerm]);

  // Resolved active term UUID fallback helper
  const effectiveTermId = useMemo(() => {
    if (activeTermId && activeTermId !== 'term-default') return activeTermId;
    if (activeTerm?.id && activeTerm.id !== 'term-default') return activeTerm.id;
    const currentFromTerms = terms.find((t: any) => t.isCurrent || t.is_current);
    if (currentFromTerms?.id && currentFromTerms.id !== 'term-default') return currentFromTerms.id;
    return '';
  }, [activeTermId, activeTerm?.id, terms]);

  // 2. Fetch Master Timetable Matrix
  const fetchMatrix = useCallback(async () => {
    const termId = effectiveTermId;
    if (!termId) {
      setMatrixData(null);
      setErrorMessage('No active academic term is configured. Select or configure the current term before loading the timetable.');
      return;
    }

    try {
      setIsMatrixLoading(true);
      setErrorMessage(null);
      const res = await getTimetableMatrix({
        termId,
        dayOfWeek: selectedDay,
      });
      setMatrixData(res);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to load timetable matrix. Please check network connection.'
      );
    } finally {
      setIsMatrixLoading(false);
    }
  }, [effectiveTermId, selectedDay]);

  // 3. Fetch Teacher Weekly Schedule
  const fetchTeacherSchedule = useCallback(async () => {
    const termId = effectiveTermId;
    if (!termId) {
      setTeacherSchedule(null);
      setErrorMessage('No active academic term is configured. Select or configure the current term before loading the timetable.');
      return;
    }
    try {
      setIsTeacherLoading(true);
      setErrorMessage(null);

      // If user can manage and inspected teacher selected
      if (canManage && !isTeacher && selectedTeacherId) {
        const res = await getTeacherSchedule(selectedTeacherId, termId);
        setTeacherSchedule(res);
      } else {
        const res = await getMyWeeklySchedule(termId);
        setTeacherSchedule(res);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to load teacher weekly schedule.'
      );
    } finally {
      setIsTeacherLoading(false);
    }
  }, [canManage, effectiveTeacherId, effectiveTermId, isTeacher, selectedTeacherId]);

  // 4. Fetch all raw periods for conflict cache and class view
  const fetchAllPeriods = useCallback(async () => {
    const termId = effectiveTermId;
    if (!termId) {
      setAllPeriods([]);
      setErrorMessage('No active academic term is configured. Select or configure the current term before loading the timetable.');
      return;
    }
    try {
      const periods = await getTimetable({ termId });
      setAllPeriods(periods);
    } catch (cause: any) {
      setErrorMessage(cause?.response?.data?.error?.message || cause?.message || 'Failed to load timetable periods.');
    }
  }, [effectiveTermId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchAllPeriods();
    if (viewMode === 'MASTER') {
      fetchMatrix();
    } else if (viewMode === 'TEACHER') {
      fetchTeacherSchedule();
    }
  }, [viewMode, fetchMatrix, fetchTeacherSchedule, fetchAllPeriods]);

  // Handle cell click on master matrix to create new period
  const handleCellClick = (classId: string, startTime: string, endTime: string) => {
    setModalInitialData({
      classId,
      termId: effectiveTermId,
      dayOfWeek: selectedDay,
      startTime,
      endTime,
      isDoublePeriod: false,
    });
    setIsModalOpen(true);
  };

  // Handle cell click on class weekly view to create new period
  const handleClassCellClick = (classId: string, dayOfWeek: string, startTime: string, endTime: string) => {
    setModalInitialData({
      classId,
      termId: effectiveTermId,
      dayOfWeek,
      startTime,
      endTime,
      isDoublePeriod: false,
    });
    setIsModalOpen(true);
  };

  // Handle assigned cell click to edit / reassign existing period
  const handleEditPeriod = (period: any, classId?: string, dayOfWeek?: string) => {
    setModalInitialData({
      periodId: period.id,
      classId: period.classId || classId || period.class?.id,
      subjectId: period.subjectId || period.subject?.id,
      teacherId: period.teacherId || period.teacher?.id,
      termId: period.termId || effectiveTermId,
      dayOfWeek: period.dayOfWeek || dayOfWeek || selectedDay,
      startTime: period.startTime,
      endTime: period.endTime,
      room: period.room || '',
      isDoublePeriod: period.isDoublePeriod ?? false,
    });
    setIsModalOpen(true);
  };

  const handleAssignmentSuccess = (msg?: string) => {
    setSuccessMessage(msg || 'Period assigned successfully!');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
    fetchAllPeriods();
    fetchMatrix();
    if (selectedTeacherId) {
      fetchTeacherSchedule();
    }
  };

  return (
    <div id="timetable-management-page" className="space-y-6">
      {/* Toast Notification for Success */}
      {successMessage && (
        <div
          id="timetable-success-toast"
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs transition-all"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header with View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Timetable Engine &amp; Teaching Schedule
            </h1>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
              {activeTerm?.name || 'Active Term'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Master instructional schedules, class timetables, and teacher allocations across Primary, Secondary, and Advanced levels.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher - Hidden for standard teachers */}
          {!isTeacher && (
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                id="view-mode-master"
                onClick={() => setViewMode('MASTER')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'MASTER'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Master Matrix</span>
              </button>

              <button
                type="button"
                id="view-mode-class"
                onClick={() => setViewMode('CLASS')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'CLASS'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Class View</span>
              </button>

              <button
                type="button"
                id="view-mode-teacher"
                onClick={() => setViewMode('TEACHER')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'TEACHER'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span title="Teacher View">Teacher Weekly View</span>
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          {canManage && (
            <button
              type="button"
              id="btn-open-assignment-modal"
              onClick={() => {
                setModalInitialData({
                  termId: effectiveTermId,
                  dayOfWeek: selectedDay,
                  classId: viewMode === 'CLASS' ? (selectedClassId || classes[0]?.id) : undefined,
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Assign Period</span>
            </button>
          )}

          {/* Period Configuration Button */}
          {canManage && (
            <button
              type="button"
              id="btn-open-schedule-config"
              onClick={() => setIsScheduleConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Period Configuration</span>
            </button>
          )}

          {/* TOD Roster Navigation Link */}
          {canAccessTod && (
            <Link
              to="/academics/operations/duty-roster"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
              <span>TOD Roster</span>
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* View Mode 1: Master Matrix View (For Academic Masters) */}
      {!isTeacher && viewMode === 'MASTER' && (
        <MasterMatrixView
          matrix={matrixData}
          isLoading={isMatrixLoading}
          canManage={canManage}
          selectedDay={selectedDay}
          onDayChange={(day) => setSelectedDay(day)}
          onCellClick={handleCellClick}
          onEditCellClick={handleEditPeriod}
          classes={classes}
          error={errorMessage}
        />
      )}

      {/* View Mode 2: Class Weekly View (For Specific Class/Stream) */}
      {!isTeacher && viewMode === 'CLASS' && (
        <ClassWeeklyView
          periods={allPeriods}
          slots={matrixData?.slots}
          isLoading={isMatrixLoading}
          canManage={canManage}
          classes={classes}
          selectedClassId={selectedClassId || classes[0]?.id}
          onSelectClass={(id) => setSelectedClassId(id)}
          onCellClick={handleClassCellClick}
          onEditCellClick={handleEditPeriod}
          error={errorMessage}
        />
      )}

      {/* View Mode 3: Teacher Weekly View (For Subject Teachers) */}
      {(isTeacher || viewMode === 'TEACHER') && (
        <TeacherWeeklyView
          schedule={teacherSchedule}
          slots={matrixData?.slots || (teacherSchedule as any)?.slots}
          isLoading={isTeacherLoading}
          canManage={canManage && !isTeacher}
          teachers={teachers}
          selectedTeacherId={isTeacher ? effectiveTeacherId : selectedTeacherId}
          onSelectTeacher={isTeacher ? undefined : (id) => setSelectedTeacherId(id)}
          classes={classes}
          selectedClassId={teacherFilterClassId}
          onSelectClass={setTeacherFilterClassId}
          selectedLevel={teacherFilterLevel}
          onSelectLevel={setTeacherFilterLevel}
          currentUserId={effectiveTeacherId}
          error={errorMessage}
        />
      )}

      {/* Timetable Assignment & Conflict Prevention Modal */}
      <TimetableAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAssignmentSuccess}
        initialData={modalInitialData}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        canManageTeacherSubjects={hasPermission(Permissions.MANAGE_ACADEMICS)}
        terms={terms}
        existingPeriods={allPeriods}
      />

      {/* School Schedule & Period Configuration Modal */}
      <ScheduleConfigModal
        isOpen={isScheduleConfigModalOpen}
        onClose={() => setIsScheduleConfigModalOpen(false)}
        onSaved={() => {
          fetchMatrix();
          fetchAllPeriods();
          if (selectedTeacherId) {
            fetchTeacherSchedule();
          }
        }}
      />
    </div>
  );
};
