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
import { useAuth } from '../../../contexts/AuthContext';
import { AcademicsApi } from '../../../api/academics.api';
import { LessonPlan } from '../../../types/academics.types';
import { LessonPlanModal } from '../../../components/academics/lessons/LessonPlanModal';

export interface LessonPlansTabProps {
  subjectId: string;
  classId: string;
  subjectName: string;
  className: string;
  lessonDate?: string;
}

export const LessonPlansTab: React.FC<LessonPlansTabProps> = ({
  subjectId,
  classId,
  subjectName,
  className,
  lessonDate: _lessonDate,
}) => {
  const { user } = useAuth();

  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<LessonPlan | null>(null);

  // Load reference data for the modal
  useEffect(() => {
    let active = true;
    const loadReferenceData = async () => {
      try {
        if (user?.role === 'TEACHER') {
          const { data: assignments } = await AcademicsApi.getTeacherAssignments();
          const classMap = new Map<string, { id: string; name: string }>();
          const subjectMap = new Map<string, { id: string; name: string; code: string }>();
          (assignments || []).forEach((assignment: any) => {
            if (assignment.class) classMap.set(assignment.class.id, assignment.class);
            if (assignment.subject) subjectMap.set(assignment.subject.id, assignment.subject);
          });
          if (active) {
            setClasses(Array.from(classMap.values()));
            setSubjects(Array.from(subjectMap.values()));
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

  // Fetch lesson plans scoped to context
  const fetchLessonPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {
        teacherId: undefined,
        classId,
        subjectId,
      };
      const res = await AcademicsApi.getLessonPlans(params);
      setLessonPlans(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch lesson plans.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.role, classId, subjectId]);

  useEffect(() => {
    fetchLessonPlans();
  }, [fetchLessonPlans]);

  const filteredPlans = lessonPlans.filter((plan) => {
    const q = searchQuery.toLowerCase();
    const topicMatch = (plan.mainTopic || (plan as any).topic || '').toLowerCase().includes(q);
    const subTopicMatch = (plan.subTopic || '').toLowerCase().includes(q);
    return topicMatch || subTopicMatch;
  });

  return (
    <div className="space-y-5">
      {/* Context-Aware Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 backdrop-blur rounded-lg text-emerald-300">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold tracking-tight">Lesson Plans</h2>
          </div>
          <p className="text-emerald-200/80 text-xs">
            5-Stage Competency-Based Lesson Plans for <strong className="text-white">{subjectName}</strong> — <strong className="text-white">{className}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedPlanForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-2 rounded-xl shadow-lg transition-all text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Prepare Lesson Plan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search lesson plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>

        <button
          onClick={fetchLessonPlans}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Lesson Plans Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading lesson plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 shadow-2xs">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 className="font-semibold text-slate-700 text-sm">
            No Lesson Plans Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-3">
            No lesson plans exist for {subjectName} — {className} yet.
          </p>
          <button
            onClick={() => {
              setSelectedPlanForEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-xs shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Lesson Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {plan.subject?.name || subjectName}
                  </span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {plan.lessonDate ? plan.lessonDate.split('T')[0] : 'Scheduled'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {plan.mainTopic || (plan as any).topic || 'Untitled Lesson Plan'}
                </h3>

                {plan.subTopic && (
                  <p className="text-xs text-slate-500 line-clamp-1">
                    Sub-topic: <span className="text-slate-700 font-medium">{plan.subTopic}</span>
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                  <GraduationCap className="w-3 h-3 text-slate-400" />
                  <span>{plan.class?.name || className}</span>
                  <span>&bull;</span>
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{plan.durationMinutes || 40} mins</span>
                </div>
              </div>

              {/* 5-Stage Indicator */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>5-Stage Competence Flow</span>
                  <span className="text-emerald-600 font-semibold">TIE Standard</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-mono">
                  <span className="bg-slate-100 p-1 rounded text-slate-700" title="1. Introduction">1. Intro</span>
                  <span className="bg-slate-100 p-1 rounded text-slate-700" title="2. Development">2. Dev</span>
                  <span className="bg-slate-100 p-1 rounded text-slate-700" title="3. Reinforce">3. Apply</span>
                  <span className="bg-slate-100 p-1 rounded text-slate-700" title="4. Reflection">4. Refl</span>
                  <span className="bg-slate-100 p-1 rounded text-slate-700" title="5. Conclusion">5. Concl</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Teacher: {plan.teacher ? `${plan.teacher.firstName} ${plan.teacher.lastName}` : 'Assigned'}
                </span>
                <button
                  onClick={() => {
                    setSelectedPlanForEdit(plan);
                    setIsModalOpen(true);
                  }}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>View / Edit</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
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
        defaultClassId={classId}
        defaultSubjectId={subjectId}
      />
    </div>
  );
};
