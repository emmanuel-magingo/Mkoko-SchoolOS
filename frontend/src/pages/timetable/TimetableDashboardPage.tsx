import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  UserCheck,
  List,
  Plus,
  Settings2,
} from 'lucide-react';
import {
  getTimetable,
  publishTimetable,
  getTimetableMatrix,
  getMyWeeklySchedule,
  getTeacherWeeklySchedule,
  TimetablePeriod,
  TimetableMatrixResponse,
  TeacherWeeklyScheduleResponse,
} from '../../api/timetableApi';
import { AcademicsApi } from '../../api/academics.api';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { Permissions } from '../../types/permissions';
import { MasterTimetableMatrix } from '../../components/timetable/MasterTimetableMatrix';
import { TeacherWeeklyView } from '../../components/timetable/TeacherWeeklyView';
import { AssignPeriodModal } from '../../components/timetable/AssignPeriodModal';
import { ScheduleConfigModal } from '../../components/timetable/ScheduleConfigModal';

export const TimetableDashboardPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const canManage = hasPermission(Permissions.MANAGE_TIMETABLE);

  // Tabs: 'matrix' (managers only), 'teacher' (all), 'list' (all)
  const [activeTab, setActiveTab] = useState<'matrix' | 'teacher' | 'list'>(
    canManage ? 'matrix' : 'teacher'
  );

  // Common metadata dropdowns
  const [terms, setTerms] = useState<Array<{ id: string; name: string; academicYearId: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; level: string; stream: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);

  // Filters for Matrix
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [matrixStatus, setMatrixStatus] = useState<string>('ALL');

  // Matrix state
  const [matrix, setMatrix] = useState<TimetableMatrixResponse | null>(null);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);

  // Teacher weekly view state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(user?.id || '');
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherWeeklyScheduleResponse | null>(null);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);

  // List view state
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);

  // Publishing & modal states
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Assign Period Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isScheduleConfigModalOpen, setIsScheduleConfigModalOpen] = useState(false);
  const [assignModalInitialData, setAssignModalInitialData] = useState<{
    classId?: string;
    termId?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    isDoublePeriod?: boolean;
  }>({});

  // 1. Initial metadata loading
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [termsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
          AcademicsApi.getTerms().catch(() => ({ data: [] })),
          AcademicsApi.getClasses().catch(() => ({ data: [] })),
          AcademicsApi.getSubjects().catch(() => ({ data: [] })),
          AcademicsApi.getTeachers().catch(() => ({ data: [] })),
        ]);

        const loadedTerms = (termsRes.data as any) || [];
        setTerms(loadedTerms);
        if (loadedTerms.length > 0 && !selectedTermId) {
          setSelectedTermId(loadedTerms[0].id);
        }

        setClasses((classesRes.data as any) || []);
        setSubjects((subjectsRes.data as any) || []);
        setTeachers((teachersRes.data as any) || []);
      } catch (err: any) {
        console.warn('Failed to load timetable metadata:', err);
      }
    };

    loadMetadata();
  }, []);

  // 2. Fetch Matrix
  const fetchMatrix = useCallback(async () => {
    if (!canManage || !selectedTermId) return;
    try {
      setIsMatrixLoading(true);
      setError(null);
      const res = await getTimetableMatrix({
        termId: selectedTermId,
        dayOfWeek: selectedDay,
        status: matrixStatus,
      });
      setMatrix(res);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Error loading timetable matrix.');
    } finally {
      setIsMatrixLoading(false);
    }
  }, [canManage, selectedTermId, selectedDay, matrixStatus]);

  // 3. Fetch Teacher Weekly Schedule
  const fetchTeacherSchedule = useCallback(async () => {
    try {
      setIsTeacherLoading(true);
      setError(null);
      let res: TeacherWeeklyScheduleResponse;
      if (canManage && selectedTeacherId && selectedTeacherId !== user?.id) {
        res = await getTeacherWeeklySchedule(selectedTeacherId, selectedTermId || undefined);
      } else {
        res = await getMyWeeklySchedule(selectedTermId || undefined);
      }
      setTeacherSchedule(res);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Error loading teacher weekly schedule.');
    } finally {
      setIsTeacherLoading(false);
    }
  }, [canManage, selectedTeacherId, user?.id, selectedTermId]);

  // 4. Fetch List Table
  const fetchPeriodsList = useCallback(async () => {
    try {
      setIsListLoading(true);
      setError(null);
      const data = await getTimetable({
        termId: selectedTermId || undefined,
        status: matrixStatus !== 'ALL' ? matrixStatus : undefined,
      });
      setPeriods(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Error fetching timetable list.');
    } finally {
      setIsListLoading(false);
    }
  }, [selectedTermId, matrixStatus]);

  // Trigger data fetching based on active tab
  useEffect(() => {
    if (activeTab === 'matrix') {
      fetchMatrix();
    } else if (activeTab === 'teacher') {
      fetchTeacherSchedule();
    } else if (activeTab === 'list') {
      fetchPeriodsList();
    }
  }, [activeTab, fetchMatrix, fetchTeacherSchedule, fetchPeriodsList]);

  // Cell click handler in Master Matrix to open assignment modal
  const handleMatrixCellClick = (classId: string, startTime: string, endTime: string) => {
    setAssignModalInitialData({
      classId,
      termId: selectedTermId,
      dayOfWeek: selectedDay,
      startTime,
      endTime,
      isDoublePeriod: false,
    });
    setIsAssignModalOpen(true);
  };

  const handlePublish = async () => {
    if (!selectedTermId && periods.length === 0) {
      setError('Please select an academic term to publish.');
      return;
    }
    const termId = selectedTermId || periods[0]?.termId;
    if (!termId) {
      setError('Term ID could not be determined.');
      return;
    }
    if (!window.confirm('Publish timetable for all students and teachers?')) {
      return;
    }

    try {
      setPublishing(true);
      setError(null);
      const res = await publishTimetable({ termId });
      setPublishMsg(`Successfully published ${res.count} timetable periods.`);
      if (activeTab === 'matrix') fetchMatrix();
      if (activeTab === 'teacher') fetchTeacherSchedule();
      if (activeTab === 'list') fetchPeriodsList();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to publish timetable');
    } finally {
      setPublishing(false);
    }
  };

  const handleModalSuccess = () => {
    setPublishMsg('Period assigned successfully without conflicts.');
    if (activeTab === 'matrix') fetchMatrix();
    if (activeTab === 'teacher') fetchTeacherSchedule();
    if (activeTab === 'list') fetchPeriodsList();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Timetable"
        description="Master school matrix, weekly teacher schedules, live conflict prevention, and lesson log sign-offs."
        icon={Calendar}
        action={
          canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScheduleConfigModalOpen(true)}
                className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Configure school operating hours, slots, and prep times"
              >
                <Settings2 size={16} />
                <span>Schedule Config</span>
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle size={16} />
                {publishing ? 'Publishing...' : 'Publish Timetable'}
              </button>
              <button
                onClick={() => {
                  setAssignModalInitialData({
                    termId: selectedTermId,
                    dayOfWeek: selectedDay,
                  });
                  setIsAssignModalOpen(true);
                }}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} />
                Assign Period
              </button>
            </div>
          )
        }
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {publishMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{publishMsg}</span>
          </div>
          <button
            onClick={() => setPublishMsg(null)}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {canManage && (
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={16} />
            Master Matrix View
          </button>
        )}

        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'teacher'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserCheck size={16} />
          {canManage ? 'Teacher Weekly View' : 'My Weekly Timetable'}
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'list'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <List size={16} />
          Schedule List
        </button>
      </div>

      {/* Tab 1: Master Timetable Matrix */}
      {activeTab === 'matrix' && canManage && (
        <MasterTimetableMatrix
          matrix={matrix}
          isLoading={isMatrixLoading}
          canManage={canManage}
          onCellClick={handleMatrixCellClick}
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
          statusFilter={matrixStatus}
          onStatusChange={setMatrixStatus}
          termFilter={selectedTermId}
          onTermChange={setSelectedTermId}
          terms={terms}
        />
      )}

      {/* Tab 2: Teacher Weekly View */}
      {activeTab === 'teacher' && (
        <TeacherWeeklyView
          schedule={teacherSchedule}
          isLoading={isTeacherLoading}
          canManage={canManage}
          teachers={teachers}
          selectedTeacherId={selectedTeacherId}
          onSelectTeacher={setSelectedTeacherId}
          onRefresh={fetchTeacherSchedule}
        />
      )}

      {/* Tab 3: Schedule List Table */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              All Scheduled Periods
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {periods.length} record{periods.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isListLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Loading timetable periods...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No periods scheduled.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Teacher</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {periods.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-700">{p.dayOfWeek}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {p.startTime} - {p.endTime}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">{p.class?.name}</td>
                      <td className="px-4 py-3 text-slate-700">{p.subject?.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.teacher?.firstName} {p.teacher?.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.room || '-'}</td>
                      <td className="px-4 py-3">
                        {p.isDoublePeriod ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                            Double Block
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">Single</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(p as any).status === 'PUBLISHED' || p.isPublished ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                            Draft
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      <AssignPeriodModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialData={assignModalInitialData}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        terms={terms}
      />

      {/* Schedule Configuration Modal */}
      <ScheduleConfigModal
        isOpen={isScheduleConfigModalOpen}
        onClose={() => setIsScheduleConfigModalOpen(false)}
        onSaved={() => {
          if (activeTab === 'matrix') fetchMatrix();
          if (activeTab === 'teacher') fetchTeacherSchedule();
          if (activeTab === 'list') fetchPeriodsList();
        }}
      />
    </div>
  );
};
