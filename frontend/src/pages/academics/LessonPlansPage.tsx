import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AcademicsApi } from '../../api/academics.api';
import { LessonPlan } from '../../types/academics.types';
import { LessonPlanModal } from '../../components/academics/lessons/LessonPlanModal';

export const LessonPlansPage: React.FC = () => {
  const { user } = useAuth();

  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<Array<{ classId: string; subjectId: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<LessonPlan | null>(null);

  // Initial load
  useEffect(() => {
    let active = true;
    const loadReferenceData = async () => {
      try {
        if (user?.role === 'TEACHER') {
          const { data: assignments } = await AcademicsApi.getTeacherAssignments();
          const classMap = new Map<string, { id: string; name: string }>();
          const subjectMap = new Map<string, { id: string; name: string; code: string }>();
          const pairs: Array<{ classId: string; subjectId: string }> = [];
          (assignments || []).forEach((assignment: any) => {
            if (assignment.class && assignment.subject) {
              classMap.set(assignment.class.id, assignment.class);
              subjectMap.set(assignment.subject.id, assignment.subject);
              pairs.push({ classId: assignment.class.id, subjectId: assignment.subject.id });
            }
          });
          if (active) {
            setClasses(Array.from(classMap.values()));
            setSubjects(Array.from(subjectMap.values()));
            setTeacherAssignments(pairs);
            if (pairs.length) {
              setSelectedClassId(pairs[0].classId);
              setSelectedSubjectId(pairs[0].subjectId);
            }
          }
          return;
        }
        const [classesRes, subjectsRes] = await Promise.all([AcademicsApi.getClasses(), AcademicsApi.getSubjects()]);
        if (active) {
          setClasses(classesRes.data || []);
          setSubjects(subjectsRes.data || []);
        }
      } catch (loadError: any) {
        if (active) setError(loadError?.response?.data?.error?.message || 'Could not load your authorized classes and subjects.');
      }
    };
    void loadReferenceData();
    return () => { active = false; };
  }, [user?.role]);

  // Fetch lesson plans
  const fetchLessonPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {};
      if (selectedClassId && selectedClassId !== 'ALL') params.classId = selectedClassId;
      if (selectedSubjectId && selectedSubjectId !== 'ALL') params.subjectId = selectedSubjectId;

      const res = await AcademicsApi.getLessonPlans(params);
      setLessonPlans(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch lesson plans.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedSubjectId]);

  const validPairs = user?.role === 'TEACHER'
    ? teacherAssignments
    : classes.flatMap((classItem) => subjects.map((subject) => ({ classId: classItem.id, subjectId: subject.id })));
  const visibleClasses = selectedSubjectId === 'ALL'
    ? classes
    : classes.filter((classItem) => validPairs.some((pair) => pair.classId === classItem.id && pair.subjectId === selectedSubjectId));
  const visibleSubjects = selectedClassId === 'ALL'
    ? subjects
    : subjects.filter((subject) => validPairs.some((pair) => pair.classId === selectedClassId && pair.subjectId === subject.id));

  const classNamesById = new Map(classes.map((classItem) => [classItem.id, classItem.name]));
  const subjectNamesById = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const getPlanClassName = (plan: LessonPlan) => plan.class?.name || classNamesById.get(plan.classId) || 'Assigned Form';
  const getPlanSubjectName = (plan: LessonPlan) => plan.subject?.name || subjectNamesById.get(plan.subjectId) || 'Subject';

  useEffect(() => {
    fetchLessonPlans();
  }, [fetchLessonPlans]);

  const filteredPlans = lessonPlans.filter((plan) => {
    const q = searchQuery.toLowerCase();
    const topicMatch = (plan.mainTopic || (plan as any).topic || '').toLowerCase().includes(q);
    const subTopicMatch = (plan.subTopic || '').toLowerCase().includes(q);
    const subjectMatch = getPlanSubjectName(plan).toLowerCase().includes(q);
    const classMatch = getPlanClassName(plan).toLowerCase().includes(q);
    return topicMatch || subTopicMatch || subjectMatch || classMatch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 backdrop-blur rounded-lg text-emerald-300">
              <FileText className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Lesson Plans &amp; Pedagogical Preparation</h1>
          </div>
          <p className="text-emerald-200/80 text-sm">
            Official Tanzanian 5-Stage Competency-Based Lesson Planning (TIE Standard).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={user?.role === 'TEACHER' && teacherAssignments.length === 0}
            onClick={() => {
              setSelectedPlanForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Prepare Lesson Plan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {user?.role === 'TEACHER' && teacherAssignments.length === 0 && !error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No subjects have been assigned to your account. Contact your school administrator.
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-44">
            <select
              value={selectedClassId}
              onChange={(e) => {
                const nextClassId = e.target.value;
                setSelectedClassId(nextClassId);
                if (user?.role === 'TEACHER' && nextClassId !== 'ALL' && !validPairs.some((pair) => pair.classId === nextClassId && pair.subjectId === selectedSubjectId)) {
                  setSelectedSubjectId(validPairs.find((pair) => pair.classId === nextClassId)?.subjectId || 'ALL');
                }
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Classes / Forms</option>
              {visibleClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-44">
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                const nextSubjectId = e.target.value;
                setSelectedSubjectId(nextSubjectId);
                if (user?.role === 'TEACHER' && nextSubjectId !== 'ALL' && !validPairs.some((pair) => pair.subjectId === nextSubjectId && pair.classId === selectedClassId)) {
                  setSelectedClassId(validPairs.find((pair) => pair.subjectId === nextSubjectId)?.classId || 'ALL');
                }
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Subjects</option>
              {visibleSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search lesson plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        <button
          onClick={fetchLessonPlans}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Lesson Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 shadow-sm">
          <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-base">
            No Lesson Plans Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Prepare your 5-stage competency-based lesson plan aligned with the national curriculum.
          </p>
          <button
            onClick={() => {
              setSelectedPlanForEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-xs shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Lesson Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            return (
              <div
                key={plan.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                      {getPlanSubjectName(plan)}
                    </span>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {plan.lessonDate ? plan.lessonDate.split('T')[0] : 'Scheduled'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
                    {plan.mainTopic || (plan as any).topic || 'Untitled Lesson Plan'}
                  </h3>

                  {plan.subTopic && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      Sub-topic: <span className="text-slate-700 dark:text-slate-300 font-medium">{plan.subTopic}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{getPlanClassName(plan)}</span>
                    <span>&bull;</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{plan.durationMinutes || 40} mins</span>
                  </div>
                </div>

                {/* 5-Stage Indicator */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>5-Stage Competence Flow</span>
                    <span className="text-emerald-600 font-semibold">TIE Standard</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-mono">
                    <span className="bg-slate-100 dark:bg-slate-800 p-1 rounded text-slate-700 dark:text-slate-300" title="1. Introduction">
                      1. Intro
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 p-1 rounded text-slate-700 dark:text-slate-300" title="2. Development">
                      2. Dev
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 p-1 rounded text-slate-700 dark:text-slate-300" title="3. Reinforce">
                      3. Apply
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 p-1 rounded text-slate-700 dark:text-slate-300" title="4. Reflection">
                      4. Refl
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 p-1 rounded text-slate-700 dark:text-slate-300" title="5. Conclusion">
                      5. Concl
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Teacher: {plan.teacher ? `${plan.teacher.firstName} ${plan.teacher.lastName}` : 'Assigned'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPlanForEdit(plan);
                      setIsModalOpen(true);
                    }}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                  >
                    <span>View / Edit Plan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation / Edit Modal */}
      <LessonPlanModal
        isOpen={isModalOpen}
        initialData={selectedPlanForEdit}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlanForEdit(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedPlanForEdit(null);
          fetchLessonPlans();
        }}
        classes={classes}
        subjects={subjects}
        defaultClassId={selectedClassId !== 'ALL' ? selectedClassId : classes[0]?.id}
        defaultSubjectId={selectedSubjectId !== 'ALL' ? selectedSubjectId : subjects[0]?.id}
      />
    </div>
  );
};
