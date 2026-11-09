import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../common/Modal';
import { submitLessonLog } from '../../../api/attendance.api';
import { AcademicsApi } from '../../../api/academics.api';
import { SubjectTopic, LessonPlan } from '../../../types/academics.types';

export type LessonExecutionStatus = 'EXECUTED' | 'PARTIALLY_EXECUTED' | 'CANCELLED';

interface AttendanceFormState {
  totalStudents: number | '';
  presentStudents: number | '';
  absentStudents: number | '';
}

export interface LessonLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  periodData?: {
    timetablePeriodId?: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    subjectCode?: string;
    startTime: string;
    endTime: string;
    lessonDate?: string;
    lessonLog?: any;
  } | null;
  mockSubmit?: (payload: any) => Promise<any>;
}

export const LessonLogModal: React.FC<LessonLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  periodData,
  mockSubmit,
}) => {
  const [status, setStatus] = useState<LessonExecutionStatus>('EXECUTED');
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Saved Lesson Plans for prepopulation
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Attendance tracking (Class Journal attendance recording)
  const [attendance, setAttendance] = useState<AttendanceFormState>(() => {
    const existing = periodData?.lessonLog;
    const existingTotal = typeof existing?.studentsTotal === 'number' ? existing.studentsTotal : '';
    const existingPresent = typeof existing?.studentsPresent === 'number' ? existing.studentsPresent : '';
    const existingAbsent =
      typeof existing?.studentsAbsent === 'number'
        ? existing.studentsAbsent
        : typeof existingTotal === 'number' && typeof existingPresent === 'number'
          ? Math.max(0, existingTotal - existingPresent)
          : '';
    return {
      totalStudents: existingTotal,
      presentStudents: existingPresent,
      absentStudents: existingAbsent,
    };
  });

  // Topic Completion status control
  const [markTopicCompleted, setMarkTopicCompleted] = useState<boolean>(false);

  // Free-text fields
  const [subTopic, setSubTopic] = useState<string>('');
  const [activities, setActivities] = useState<string>('');
  const [objectives, setObjectives] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch teacher-defined topics and lesson plans for this subject & class
  useEffect(() => {
    let isMounted = true;
    if (isOpen && periodData?.subjectId) {
      setIsLoadingTopics(true);
      AcademicsApi.getSubjectTopics(periodData.subjectId)
        .then((res) => {
          if (isMounted) {
            const data = res?.data || [];
            setTopics(data);
            if (data.length > 0) {
              const existingTopicId = periodData.lessonLog?.topicId;
              const existingTopicTitle = periodData.lessonLog?.topic;
              const matching =
                data.find((t) => t.id === existingTopicId) ||
                data.find((t) => t.title === existingTopicTitle) ||
                data[0];
              setSelectedTopicId(matching.id);
              setSelectedTopicTitle(matching.title);
              setMarkTopicCompleted(matching.status === 'COMPLETED');
            } else {
              setSelectedTopicId('');
              setSelectedTopicTitle(periodData.lessonLog?.topic || '');
              setMarkTopicCompleted(false);
            }
          }
        })
        .catch((error: any) => {
          if (isMounted) {
            setTopics([]);
            setSelectedTopicId('');
            setSelectedTopicTitle(periodData.lessonLog?.topic || '');
            setMarkTopicCompleted(false);
            console.warn('Failed to load yearly topics for this subject:', error);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingTopics(false);
          }
        });

      if (periodData?.classId) {
        AcademicsApi.getClassEnrolmentCount(periodData.classId)
          .then((res) => {
            if (isMounted) {
              const totalStudents = res?.data?.totalStudents ?? 0;
              setAttendance((current) => {
                const absentStudents =
                  typeof current.presentStudents === 'number'
                    ? Math.max(0, totalStudents - current.presentStudents)
                    : '';
                return { ...current, totalStudents, absentStudents };
              });
            }
          })
          .catch((error: any) => {
            console.warn('Failed to load the class enrolment count:', error);
          });

        AcademicsApi.getLessonPlans({
          classId: periodData.classId,
          subjectId: periodData.subjectId,
        })
          .then((res) => {
            if (isMounted) setLessonPlans(res?.data || []);
          })
          .catch((error: any) => {
            if (isMounted) {
              setLessonPlans([]);
              console.warn('Failed to load lesson plans:', error);
            }
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, periodData?.subjectId, periodData?.classId, periodData?.lessonLog]);

  useEffect(() => {
    if (isOpen) {
      setStatus('EXECUTED');
      const existing = periodData?.lessonLog;
      setSelectedTopicId(existing?.topicId || '');
      setSelectedTopicTitle(existing?.topic || '');
      setSelectedPlanId(existing?.lessonPlanId || '');
      setSubTopic(existing?.subTopic || '');
      setActivities(existing?.activities || existing?.description || '');
      setObjectives(existing?.objectives || '');
      setRemarks(existing?.notes || existing?.reasonForMissed || '');
      const existingTotal = typeof existing?.studentsTotal === 'number' ? existing.studentsTotal : '';
      const existingPresent = typeof existing?.studentsPresent === 'number' ? existing.studentsPresent : '';
      const existingAbsent =
        typeof existing?.studentsAbsent === 'number'
          ? existing.studentsAbsent
          : typeof existingTotal === 'number' && typeof existingPresent === 'number'
            ? Math.max(0, existingTotal - existingPresent)
            : '';
      setAttendance({
        totalStudents: existingTotal,
        presentStudents: existingPresent,
        absentStudents: existingAbsent,
      });
      setMarkTopicCompleted(existing?.subjectTopic?.status === 'COMPLETED' || false);
      setErrorMessage(null);
    }
  }, [isOpen, periodData]);

  const handlePrepopulateFromPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = lessonPlans.find((p) => p.id === planId);
    if (!plan) return;

    if (plan.subjectTopicId) {
      setSelectedTopicId(plan.subjectTopicId);
    }
    if (plan.mainTopic) {
      setSelectedTopicTitle(plan.mainTopic);
    }
    if (plan.subTopic) {
      setSubTopic(plan.subTopic);
    }
    if (plan.specificObjectives && plan.specificObjectives.length > 0) {
      setObjectives(plan.specificObjectives.join('; '));
    }
    if (plan.stages && plan.stages.length > 0) {
      const summary = plan.stages
        .map(
          (s) =>
            `[${s.stageName}] Teacher: ${s.teachingActivities} | Students: ${s.learningActivities}`
        )
        .join('\n');
      setActivities(summary);
    }
    if (plan.remarks) {
      setRemarks(plan.remarks);
    }
  };

  if (!isOpen || !periodData) return null;
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory validation: remarks required if CANCELLED
    if (status === 'CANCELLED' && !remarks.trim()) {
      setErrorMessage('Remarks are strictly mandatory when a lesson is marked CANCELLED.');
      return;
    }

    if (status !== 'CANCELLED' && !selectedTopicId) {
      setErrorMessage('Select a yearly topic before signing off this lesson.');
      return;
    }

    // Sub-topic is required when executed
    if (status !== 'CANCELLED' && !subTopic.trim()) {
      setErrorMessage('Please specify the sub-topic taught during this lesson.');
      return;
    }

    // Map UI status to backend Prisma LessonLogStatus
    const backendStatus: 'TAUGHT' | 'MISSED' | 'CANCELLED' =
      status === 'CANCELLED' ? 'CANCELLED' : 'TAUGHT';

    const calculatedAbsent =
      typeof attendance.absentStudents === 'number'
        ? attendance.absentStudents
        : undefined;

    const payload = {
      timetablePeriodId: periodData.timetablePeriodId,
      classId: periodData.classId,
      subjectId: periodData.subjectId,
      topicId: selectedTopicId || undefined,
      topic: selectedTopicTitle || undefined,
      subTopic: subTopic.trim() || undefined,
      description: activities.trim() || undefined,
      activities: activities.trim() || undefined,
      lessonDate:
        periodData.lessonDate || new Date().toISOString().split('T')[0],
      startTime: periodData.startTime,
      endTime: periodData.endTime,
      status: backendStatus,
      objectives: objectives.trim() || undefined,
      notes:
        status === 'PARTIALLY_EXECUTED'
          ? `Partially Executed: ${remarks.trim()}`
          : remarks.trim() || undefined,
      reasonForMissed:
        status === 'CANCELLED'
          ? remarks.trim()
          : undefined,
      studentsPresent:
        typeof attendance.presentStudents === 'number'
          ? attendance.presentStudents
          : undefined,
      studentsTotal:
        typeof attendance.totalStudents === 'number'
          ? attendance.totalStudents
          : undefined,
      studentsAbsent: calculatedAbsent,
      markTopicCompleted: selectedTopic?.teacherId ? markTopicCompleted : undefined,
      lessonPlanId: selectedPlanId || undefined,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (mockSubmit) {
        await mockSubmit(payload);
      } else {
        await submitLessonLog(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          err?.response?.data?.error?.message ||
          'Failed to record lesson log execution.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Lesson Execution — Class Journal & Lesson Logbook (Daftari la Vipindi)"
      maxWidth="lg"
    >
      <form
        id="lesson-log-form"
        onSubmit={handleSubmit}
        className="space-y-4 text-slate-800"
      >
        {/* Lesson Context Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-blue-950">
                {periodData.className}
              </span>
              <span className="inline-flex items-center rounded-md bg-blue-200/80 px-2 py-0.5 text-[11px] font-bold text-blue-900">
                {periodData.subjectCode || periodData.subjectName}
              </span>
            </div>
            <p className="text-[11px] text-blue-800">
              {periodData.subjectName}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200">
            <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>
              {`${periodData.startTime} - ${periodData.endTime}`}
            </span>
          </div>
        </div>

        {/* Prepopulate from Lesson Plan Bar */}
        {lessonPlans.length > 0 && status !== 'CANCELLED' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>Prepopulate from Lesson Plan:</span>
            </div>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePrepopulateFromPlan(e.target.value)}
              className="flex-1 max-w-sm rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xs text-indigo-900 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="">-- Choose Prepared Lesson Plan --</option>
              {lessonPlans.map((lp) => (
                <option key={lp.id} value={lp.id}>
                  {lp.mainTopic}: {lp.subTopic} ({new Date(lp.lessonDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {errorMessage && (
          <div
            id="lesson-log-error-alert"
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Execution Status Radios */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Lesson Delivery Status <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* EXECUTED */}
            <label
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer font-semibold transition-all ${
                status === 'EXECUTED'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="lessonStatus"
                value="EXECUTED"
                checked={status === 'EXECUTED'}
                onChange={() => setStatus('EXECUTED')}
                className="sr-only"
              />
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Executed</span>
            </label>

            {/* PARTIALLY EXECUTED */}
            <label
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer font-semibold transition-all ${
                status === 'PARTIALLY_EXECUTED'
                  ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="lessonStatus"
                value="PARTIALLY_EXECUTED"
                checked={status === 'PARTIALLY_EXECUTED'}
                onChange={() => setStatus('PARTIALLY_EXECUTED')}
                className="sr-only"
              />
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Partially Executed</span>
            </label>

            {/* CANCELLED */}
            <label
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer font-semibold transition-all ${
                status === 'CANCELLED'
                  ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="lessonStatus"
                value="CANCELLED"
                checked={status === 'CANCELLED'}
                onChange={() => setStatus('CANCELLED')}
                className="sr-only"
              />
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Cancelled</span>
            </label>
          </div>
        </div>

        {/* FIELD 1: Yearly Topic */}
        {status !== 'CANCELLED' && (
          <div className="space-y-1.5">
            <label htmlFor="curriculum-topic-select" className="block text-xs font-bold text-slate-700">
              Topic <span className="text-rose-500">*</span>
            </label>
            <select
              id="curriculum-topic-select"
              name="topicId"
              value={selectedTopicId}
              onChange={(e) => {
                const found = topics.find((topic) => topic.id === e.target.value);
                if (found) {
                  setSelectedTopicId(found.id);
                  setSelectedTopicTitle(found.title);
                  setMarkTopicCompleted(found.status === 'COMPLETED');
                  setSubTopic('');
                }
              }}
              disabled={isLoadingTopics || topics.length === 0}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs transition-colors"
              required
            >
              <option value="" disabled>
                {isLoadingTopics ? 'Loading yearly topics…' : '-- Select a Yearly Topic --'}
              </option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title} {topic.status === 'COMPLETED' ? '✓ (Completed)' : ''} {topic.estimatedPeriods ? `[${topic.estimatedPeriods} periods]` : ''}
                </option>
              ))}
            </select>
            {!isLoadingTopics && topics.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No topics are recorded for this subject. Add them in Lessons → Yearly Topics first.
              </p>
            )}

            {/* Topic Status Control: Checkbox to mark topic completed */}
            {selectedTopic?.teacherId && (
              <div className="flex items-center justify-between pt-1 px-1">
                <label htmlFor="mark-topic-completed-checkbox" className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    id="mark-topic-completed-checkbox"
                    checked={markTopicCompleted}
                    onChange={(e) => setMarkTopicCompleted(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Mark this topic as Completed / Done</span>
                </label>

                {markTopicCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Status: COMPLETED
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    Status: IN_PROGRESS
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* FIELD: Class Journal Attendance Tracking */}
        {status !== 'CANCELLED' && (
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Attendance Tracking (Class Journal Record)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Mandatory period sign-off (Daftari la Mahudhurio)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="students-present-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Students Present <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="students-present-input"
                  min="0"
                  max={typeof attendance.totalStudents === 'number' ? attendance.totalStudents : undefined}
                  value={attendance.presentStudents}
                  onChange={(e) => {
                    const parsed = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    const present = typeof parsed === 'number' && !isNaN(parsed) ? parsed : '';
                    setAttendance((current) => ({
                      ...current,
                      presentStudents: present,
                      absentStudents:
                        typeof present === 'number' && typeof current.totalStudents === 'number'
                          ? Math.max(0, current.totalStudents - present)
                          : '',
                    }));
                  }}
                  placeholder="45"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs font-semibold"
                  required
                />
              </div>

              <div>
                <label htmlFor="students-total-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Total Students Enrolled <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="students-total-input"
                  min="0"
                  value={attendance.totalStudents}
                  readOnly
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100/90 px-3 py-1.5 text-xs font-bold text-slate-700 cursor-not-allowed shadow-2xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="students-absent-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Students Absent
                </label>
                <input
                  type="number"
                  id="students-absent-input"
                  min="0"
                  value={attendance.absentStudents}
                  readOnly
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100/90 px-3 py-1.5 text-xs font-bold text-slate-700 cursor-not-allowed shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}


        {/* FIELD 2: Sub-Topic */}
        {status !== 'CANCELLED' && (
          <div>
            <label htmlFor="lesson-subtopic-input" className="block text-xs font-bold text-slate-700 mb-1">
              Sub-Topic <span className="text-rose-500">*</span>
            </label>
            <select
              id="lesson-subtopic-input"
              name="subTopic"
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              disabled={!selectedTopicId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              required
            >
              <option value="" disabled>
                {selectedTopicId ? '-- Select a Sub-Topic --' : 'Select a topic first'}
              </option>
              {topics
                .find((topic) => topic.id === selectedTopicId)
                ?.subTopics?.map((item, index) => (
                  <option key={`${selectedTopicId}-${index}`} value={item}>
                    {item}
                  </option>
                ))}
              {subTopic &&
                !topics
                  .find((topic) => topic.id === selectedTopicId)
                  ?.subTopics?.includes(subTopic) && (
                  <option value={subTopic}>{subTopic} (previously recorded)</option>
                )}
            </select>
          </div>
        )}

        {/* FIELD 3: Description of Activities (Textarea) */}
        {status !== 'CANCELLED' && (
          <div>
            <label htmlFor="lesson-activities-textarea" className="block text-xs font-bold text-slate-700 mb-1">
              Description of Activities &amp; Methodology
            </label>
            <textarea
              id="lesson-activities-textarea"
              name="activities"
              rows={3}
              placeholder="Describe classroom tasks, group activities, demonstrations, or laboratory experiments executed..."
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>
        )}

        {/* Lesson Objectives */}
        {status !== 'CANCELLED' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Key Instructional Objectives
            </label>
            <textarea
              id="lesson-objectives-input"
              rows={2}
              placeholder="e.g. By the end of this lesson, students are able to solve quadratic equations by factoring."
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Remarks / Reason for Cancellation */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {status === 'CANCELLED' ? (
              <span className="text-rose-700">
                Reason for Cancellation <span className="text-rose-600 font-bold">* (Mandatory)</span>
              </span>
            ) : status === 'PARTIALLY_EXECUTED' ? (
              <span>Notes on Incomplete Sections &amp; Next Steps</span>
            ) : (
              <span>Teacher Reflection &amp; Remarks (Optional)</span>
            )}
          </label>
          <textarea
            id="lesson-remarks-textarea"
            rows={status === 'CANCELLED' ? 3 : 2}
            required={status === 'CANCELLED'}
            placeholder={
              status === 'CANCELLED'
                ? 'Specify why this scheduled lesson could not be delivered (e.g. National examination supervision, school emergency assembly).'
                : 'Add instructional notes, homework assigned, or pacing adjustments.'
            }
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-xs bg-white text-slate-800 focus:ring-1 ${
              status === 'CANCELLED' && !remarks.trim()
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
        </div>

        {/* Modal Buttons */}
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
            id="btn-submit-lesson-log"
            disabled={isSubmitting || (status === 'CANCELLED' && !remarks.trim())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Confirm Lesson Execution'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
