import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../common/Modal';
import { AcademicsApi } from '../../../api/academics.api';
import {
  LessonPlan,
  LessonPlanStage,
  SubjectTopic,
  CreateLessonPlanPayload,
} from '../../../types/academics.types';

export interface LessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (plan: LessonPlan) => void;
  initialData?: LessonPlan | null;
  defaultClassId?: string;
  defaultSubjectId?: string;
  className?: string;
  subjectName?: string;
  classes?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string; code?: string }>;
}

export const LessonPlanModal: React.FC<LessonPlanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultClassId = '',
  defaultSubjectId = '',
  className = '',
  subjectName = '',
  classes = [],
  subjects = [],
}) => {
  const [classId, setClassId] = useState<string>(defaultClassId);
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId);
  const [lessonDate, setLessonDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [periodNumber, setPeriodNumber] = useState<string>('1 & 2');
  const [durationMinutes, setDurationMinutes] = useState<number>(80);

  // Scheme of work topics
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [subjectTopicId, setSubjectTopicId] = useState<string>('');

  // Header Details
  const [competence, setCompetence] = useState<string>('');
  const [mainTopic, setMainTopic] = useState<string>('');
  const [subTopic, setSubTopic] = useState<string>('');
  const [generalObjective, setGeneralObjective] = useState<string>('');
  const [specificObjectives, setSpecificObjectives] = useState<string[]>([
    'Define the fundamental concepts and principles accurately.',
    'Demonstrate practical mastery through guided classroom exercises.',
  ]);
  const [newObjective, setNewObjective] = useState<string>('');
  const [teachingAids, setTeachingAids] = useState<string>('Textbooks, whiteboard, charts, realia/models');
  const [teachingTechniques, setTeachingTechniques] = useState<string>('Question & Answer, Guided Discovery, Small Group Discussion');
  const [references, setReferences] = useState<string>('TIE National Curriculum Syllabus, Approved Subject Textbook');

  // Stages
  const [stages, setStages] = useState<Array<Omit<LessonPlanStage, 'id' | 'lessonPlanId'>>>([
    {
      stageName: 'INTRODUCTION',
      durationMinutes: 10,
      teachingActivities: 'Review prerequisite knowledge, state lesson objectives and brainstorm concepts.',
      learningActivities: 'Respond to teacher questions, recall previous knowledge, and share observations.',
      assessmentActivities: 'Oral questions checking background readiness.',
      orderIndex: 1,
    },
    {
      stageName: 'NEW_KNOWLEDGE',
      durationMinutes: 30,
      teachingActivities: 'Introduce new concepts, demonstrate rules and formulas using visual charts.',
      learningActivities: 'Listen actively, observe demonstrations, record notes and formulate questions.',
      assessmentActivities: 'Immediate check-for-understanding probing questions.',
      orderIndex: 2,
    },
    {
      stageName: 'REINFORCEMENT',
      durationMinutes: 20,
      teachingActivities: 'Facilitate pair/group problem-solving exercises and guide student inquiries.',
      learningActivities: 'Collaborate in small groups to solve assigned tasks and apply competence.',
      assessmentActivities: 'Circulate to assess active engagement and accuracy.',
      orderIndex: 3,
    },
    {
      stageName: 'REFLECTION',
      durationMinutes: 10,
      teachingActivities: 'Invite student representatives to present findings and summarize insights.',
      learningActivities: 'Present answers on chalkboard and critique peer solutions.',
      assessmentActivities: 'Formative check / short exit exercise.',
      orderIndex: 4,
    },
    {
      stageName: 'CONCLUSION',
      durationMinutes: 10,
      teachingActivities: 'Synthesize the main competence acquired and assign follow-up homework.',
      learningActivities: 'Note summary points and record home practice tasks.',
      assessmentActivities: 'Reviewing homework questions.',
      orderIndex: 5,
    },
  ]);

  // Post-lesson evaluations
  const [studentsEvaluation, setStudentsEvaluation] = useState<string>('');
  const [teacherEvaluation, setTeacherEvaluation] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setClassId(initialData.classId);
        setSubjectId(initialData.subjectId);
        setLessonDate(
          initialData.lessonDate ? initialData.lessonDate.split('T')[0] : new Date().toISOString().split('T')[0]
        );
        setPeriodNumber(initialData.periodNumber || '1 & 2');
        setDurationMinutes(initialData.durationMinutes || 80);
        setSubjectTopicId(initialData.subjectTopicId || '');
        setCompetence(initialData.competence || '');
        setMainTopic(initialData.mainTopic || '');
        setSubTopic(initialData.subTopic || '');
        setGeneralObjective(initialData.generalObjective || '');
        setSpecificObjectives(initialData.specificObjectives || []);
        setTeachingAids(initialData.teachingAids || '');
        setTeachingTechniques(initialData.teachingTechniques || '');
        setReferences(initialData.references || '');
        setStudentsEvaluation(initialData.studentsEvaluation || '');
        setTeacherEvaluation(initialData.teacherEvaluation || '');
        setRemarks(initialData.remarks || '');
        if (initialData.stages && initialData.stages.length > 0) {
          setStages(initialData.stages);
        }
      } else {
        setClassId(defaultClassId);
        setSubjectId(defaultSubjectId);
        setLessonDate(new Date().toISOString().split('T')[0]);
        setPeriodNumber('1 & 2');
        setDurationMinutes(80);
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialData, defaultClassId, defaultSubjectId]);

  // Fetch topics when subjectId changes
  useEffect(() => {
    if (isOpen && subjectId) {
      AcademicsApi.getSubjectTopics(subjectId)
        .then((res) => {
          setTopics(res?.data || []);
        })
        .catch(() => setTopics([]));
    }
  }, [isOpen, subjectId]);

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    setSpecificObjectives((prev) => [...prev, newObjective.trim()]);
    setNewObjective('');
  };

  const handleRemoveObjective = (index: number) => {
    setSpecificObjectives((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStageChange = (
    index: number,
    field: keyof Omit<LessonPlanStage, 'id' | 'lessonPlanId'>,
    value: any
  ) => {
    setStages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classId) {
      setErrorMessage('Please select the Target Class.');
      return;
    }
    if (!subjectId) {
      setErrorMessage('Please select the Subject.');
      return;
    }
    if (!mainTopic.trim()) {
      setErrorMessage('Main Topic is required.');
      return;
    }
    if (!subTopic.trim()) {
      setErrorMessage('Sub-Topic is required.');
      return;
    }
    if (!generalObjective.trim()) {
      setErrorMessage('General Objective is required.');
      return;
    }
    if (specificObjectives.length === 0) {
      setErrorMessage('Please add at least one Specific Objective.');
      return;
    }

    const payload: CreateLessonPlanPayload = {
      classId,
      subjectId,
      subjectTopicId: subjectTopicId || undefined,
      lessonDate,
      periodNumber,
      durationMinutes,
      competence,
      mainTopic,
      subTopic,
      generalObjective,
      specificObjectives,
      teachingAids,
      teachingTechniques,
      references,
      stages,
      studentsEvaluation: studentsEvaluation.trim() || undefined,
      teacherEvaluation: teacherEvaluation.trim() || undefined,
      remarks: remarks.trim() || undefined,
    };

    try {
      setIsLoading(true);
      setErrorMessage(null);

      let saved: LessonPlan;
      if (initialData?.id) {
        const res = await AcademicsApi.updateLessonPlan(initialData.id, payload);
        saved = res.data;
      } else {
        const res = await AcademicsApi.createLessonPlan(payload);
        saved = res.data;
      }

      if (onSuccess) onSuccess(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          err?.response?.data?.error?.message ||
          'Failed to save lesson plan.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tanzanian Competency-Based Lesson Plan (Azimio & Mpango wa Somo)"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 text-xs">
        {/* Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">
                Official TIE Standard Pedagogical Preparation
              </p>
              <p className="text-[11px] text-blue-800">
                Pre-lesson preparation linked to Scheme of Work topics. Feeds directly into Class Journal.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-900 shrink-0">
            <Sparkles className="h-3 w-3 text-blue-600" />
            Competency-Based
          </span>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION 1: HEADER & PERIOD DETAILS */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>1. Lesson Administration & Schedule</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Class / Form <span className="text-rose-500">*</span>
              </label>
              {classes.length > 0 ? (
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={className || 'Target Class'}
                  disabled
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-slate-50 text-slate-700"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              {subjects.length > 0 ? (
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || s.name})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subjectName || 'Subject'}
                  disabled
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-slate-50 text-slate-700"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Lesson Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Period & Duration <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. 1 & 2"
                  value={periodNumber}
                  onChange={(e) => setPeriodNumber(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
                  required
                />
                <input
                  type="number"
                  placeholder="80 min"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 40)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CURRICULUM, COMPETENCE & OBJECTIVES */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
            <span>2. Competence & Scheme of Work Topic Linkage</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Link to Scheme of Work Topic
              </label>
              <select
                value={subjectTopicId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubjectTopicId(val);
                  const matched = topics.find((t) => t.id === val);
                  if (matched) {
                    setMainTopic(matched.title);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
              >
                <option value="">-- Choose from Scheme Topics --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.status === 'COMPLETED' ? '✓ (Completed)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Main Topic (Mada Kuu) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={mainTopic}
                onChange={(e) => setMainTopic(e.target.value)}
                placeholder="e.g. Regional Focal Studies / Coordinate Geometry"
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sub-Topic (Mada Ndogo) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subTopic}
                onChange={(e) => setSubTopic(e.target.value)}
                placeholder="e.g. Agriculture in East Africa / Gradient of a straight line"
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Main Competence (Umahiri) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={competence}
                onChange={(e) => setCompetence(e.target.value)}
                placeholder="e.g. Apply mathematical reasoning to solve geometric problems"
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              General Objective (Kusudi Kuu la Somo) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={generalObjective}
              onChange={(e) => setGeneralObjective(e.target.value)}
              placeholder="e.g. The student develops an understanding of linear equations and is able to plot coordinates on a Cartesian plane."
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Specific Objectives (Madhumuni Mahususi) <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5 mb-2">
              {specificObjectives.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="flex-1 font-medium text-slate-800">
                    {i + 1}. {obj}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(i)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                    title="Remove objective"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddObjective();
                  }
                }}
                placeholder="Add a measurable specific objective (e.g. Student calculates slope using y2 - y1 / x2 - x1)..."
                className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddObjective}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: TEACHING AIDS, TECHNIQUES & REFERENCES */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>3. Pedagogical Resources & Methodology</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teaching &amp; Learning Aids (Zana)
              </label>
              <textarea
                rows={2}
                value={teachingAids}
                onChange={(e) => setTeachingAids(e.target.value)}
                placeholder="Wall maps, charts, mathematical set, realia..."
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teaching Techniques (Mbinu)
              </label>
              <textarea
                rows={2}
                value={teachingTechniques}
                onChange={(e) => setTeachingTechniques(e.target.value)}
                placeholder="Demonstration, group inquiry, questions..."
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                References (Marejeleo ya Vitabu)
              </label>
              <textarea
                rows={2}
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                placeholder="TIE Form 2 Book, Page 45-52..."
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: THE FIVE PEDAGOGICAL STEPS */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              <span>4. Lesson Development Stages (Hatua 5 za Ufundishaji)</span>
            </h3>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Standard Tanzanian Format
            </span>
          </div>

          <div className="space-y-3">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {stage.stageName === 'INTRODUCTION'
                        ? '1. Introduction (Utangulizi)'
                        : stage.stageName === 'NEW_KNOWLEDGE'
                        ? '2. Development of New Knowledge (Kukuza Maarifa Mapya)'
                        : stage.stageName === 'REINFORCEMENT'
                        ? '3. Reinforcement & Application (Kutilia Mkazo / Matendo)'
                        : stage.stageName === 'REFLECTION'
                        ? '4. Reflection & Assessment (Tathmini ya Mwanafunzi)'
                        : '5. Conclusion & Homework (Hitimisho)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={stage.durationMinutes}
                      onChange={(e) =>
                        handleStageChange(
                          idx,
                          'durationMinutes',
                          parseInt(e.target.value, 10) || 10
                        )
                      }
                      className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-[11px] bg-white text-right font-semibold"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">min</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Teacher Activities (Matendo ya Mwalimu)
                    </label>
                    <textarea
                      rows={2}
                      value={stage.teachingActivities}
                      onChange={(e) =>
                        handleStageChange(idx, 'teachingActivities', e.target.value)
                      }
                      className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Student Activities (Matendo ya Mwanafunzi)
                    </label>
                    <textarea
                      rows={2}
                      value={stage.learningActivities}
                      onChange={(e) =>
                        handleStageChange(idx, 'learningActivities', e.target.value)
                      }
                      className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Assessment Criteria (Upimaji)
                    </label>
                    <textarea
                      rows={2}
                      value={stage.assessmentActivities}
                      onChange={(e) =>
                        handleStageChange(idx, 'assessmentActivities', e.target.value)
                      }
                      className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: POST-LESSON EVALUATION */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>5. Post-Lesson Evaluation &amp; Remarks (Tathmini ya Somo)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Students Evaluation (Tathmini ya Wanafunzi)
              </label>
              <textarea
                rows={2}
                value={studentsEvaluation}
                onChange={(e) => setStudentsEvaluation(e.target.value)}
                placeholder="e.g. 42 out of 45 students successfully mastered the calculation of linear gradient."
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teacher Self-Evaluation (Tathmini ya Mwalimu)
              </label>
              <textarea
                rows={2}
                value={teacherEvaluation}
                onChange={(e) => setTeacherEvaluation(e.target.value)}
                placeholder="e.g. Time management during reinforcement was effective; need more practice examples next period."
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isLoading ? 'Saving...' : 'Save Lesson Plan'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
