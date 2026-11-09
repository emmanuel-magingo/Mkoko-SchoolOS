import React, { useState, useEffect } from 'react';
import { X, BookOpen, Target, Clock, AlertCircle } from 'lucide-react';
import { SubtopicsListEditor } from './SubtopicsListEditor';
import { SubjectTopic } from '../../../types/academics.types';

export interface SchemeOfWorkTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    subTopics: string[];
    estimatedPeriods: number;
    status: string;
    learningObjectives?: string;
    learningActivities?: string;
    learningResources?: string;
    assessmentMethods?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    remarks?: string;
  }) => Promise<void>;
  initialData?: SubjectTopic | null;
  subjectName?: string;
  className?: string;
}

export const SchemeOfWorkTopicModal: React.FC<SchemeOfWorkTopicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  subjectName,
  className,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtopics, setSubtopics] = useState<string[]>(
    initialData?.subTopics && initialData.subTopics.length > 0
      ? [...initialData.subTopics]
      : ['']
  );
  const [estimatedPeriods, setEstimatedPeriods] = useState<number>(
    initialData?.estimatedPeriods || 4
  );
  const [status, setStatus] = useState<string>(initialData?.status || 'IN_PROGRESS');
  const [learningObjectives, setLearningObjectives] = useState(
    initialData?.learningObjectives || ''
  );
  const [learningActivities, setLearningActivities] = useState(
    initialData?.learningActivities || ''
  );
  const [learningResources, setLearningResources] = useState(
    initialData?.learningResources || ''
  );
  const [assessmentMethods, setAssessmentMethods] = useState(
    initialData?.assessmentMethods || ''
  );
  const [plannedStartDate, setPlannedStartDate] = useState(
    initialData?.plannedStartDate
      ? new Date(initialData.plannedStartDate).toISOString().split('T')[0]
      : ''
  );
  const [plannedEndDate, setPlannedEndDate] = useState(
    initialData?.plannedEndDate
      ? new Date(initialData.plannedEndDate).toISOString().split('T')[0]
      : ''
  );
  const [remarks, setRemarks] = useState(initialData?.remarks || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSubtopics(
        initialData.subTopics && initialData.subTopics.length > 0
          ? [...initialData.subTopics]
          : ['']
      );
      setEstimatedPeriods(initialData.estimatedPeriods || 4);
      setStatus(initialData.status || 'IN_PROGRESS');
      setLearningObjectives(initialData.learningObjectives || '');
      setLearningActivities(initialData.learningActivities || '');
      setLearningResources(initialData.learningResources || '');
      setAssessmentMethods(initialData.assessmentMethods || '');
      setPlannedStartDate(
        initialData.plannedStartDate
          ? new Date(initialData.plannedStartDate).toISOString().split('T')[0]
          : ''
      );
      setPlannedEndDate(
        initialData.plannedEndDate
          ? new Date(initialData.plannedEndDate).toISOString().split('T')[0]
          : ''
      );
      setRemarks(initialData.remarks || '');
    } else {
      setTitle('');
      setSubtopics(['']);
      setEstimatedPeriods(4);
      setStatus('IN_PROGRESS');
      setLearningObjectives('');
      setLearningActivities('');
      setLearningResources('');
      setAssessmentMethods('');
      setPlannedStartDate('');
      setPlannedEndDate('');
      setRemarks('');
    }
    setValidationError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Main Topic title is required.');
      return;
    }

    const cleanedSubtopics = subtopics.map((s) => s.trim()).filter(Boolean);
    if (cleanedSubtopics.length === 0) {
      setValidationError('At least one subtopic must be provided.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: trimmedTitle,
        subTopics: cleanedSubtopics,
        estimatedPeriods: Number(estimatedPeriods) || 4,
        status,
        learningObjectives: learningObjectives.trim() || undefined,
        learningActivities: learningActivities.trim() || undefined,
        learningResources: learningResources.trim() || undefined,
        assessmentMethods: assessmentMethods.trim() || undefined,
        plannedStartDate: plannedStartDate || undefined,
        plannedEndDate: plannedEndDate || undefined,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save Scheme of Work topic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Scheme of Work Topic' : 'Add Scheme of Work Topic'}
              </h2>
              {(subjectName || className) && (
                <p className="text-xs text-slate-500 font-medium">
                  {subjectName ? `${subjectName}` : ''} {className ? `• ${className}` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-topic-modal-btn"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {validationError && (
            <div
              data-testid="topic-form-error"
              className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Main Topic Input */}
          <div>
            <label
              htmlFor="main-topic-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Main Topic <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="main-topic-input"
              data-testid="main-topic-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reading Skills, Coordinate Geometry, Cell Biology"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              required
            />
          </div>

          {/* Subtopics Repeatable List Editor */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <SubtopicsListEditor
              subtopics={subtopics}
              onChange={setSubtopics}
              disabled={isSubmitting}
            />
          </div>

          {/* Core Pacing & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="topic-periods-input"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Estimated Periods</span>
              </label>
              <input
                type="number"
                id="topic-periods-input"
                data-testid="topic-periods-input"
                value={estimatedPeriods}
                onChange={(e) => setEstimatedPeriods(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={60}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="topic-status-select"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id="topic-status-select"
                data-testid="topic-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Pedagogical Academic Planning Fields */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Pedagogical Planning Information</span>
            </h4>

            <div>
              <label
                htmlFor="learning-objectives-input"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                Specific Objectives & Competencies
              </label>
              <textarea
                id="learning-objectives-input"
                data-testid="learning-objectives-input"
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="By the end of this topic, the student should be able to..."
                rows={2}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="learning-activities-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1"
                >
                  Teaching &amp; Learning Activities
                </label>
                <textarea
                  id="learning-activities-input"
                  data-testid="learning-activities-input"
                  value={learningActivities}
                  onChange={(e) => setLearningActivities(e.target.value)}
                  placeholder="Group discussion, hands-on experiment, reading comprehension..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="learning-resources-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1"
                >
                  Teaching &amp; Learning Resources
                </label>
                <textarea
                  id="learning-resources-input"
                  data-testid="learning-resources-input"
                  value={learningResources}
                  onChange={(e) => setLearningResources(e.target.value)}
                  placeholder="Textbook Pg 45-60, Wall charts, Models, Science kit..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="assessment-methods-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1"
                >
                  Assessment Methods
                </label>
                <textarea
                  id="assessment-methods-input"
                  data-testid="assessment-methods-input"
                  value={assessmentMethods}
                  onChange={(e) => setAssessmentMethods(e.target.value)}
                  placeholder="Oral questions, written quiz, class presentation..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="topic-remarks-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1"
                >
                  Remarks
                </label>
                <textarea
                  id="topic-remarks-input"
                  data-testid="topic-remarks-input"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Notes on pacing, difficulties encountered..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label
                  htmlFor="planned-start-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1"
                >
                  Planned Start Date
                </label>
                <input
                  type="date"
                  id="planned-start-input"
                  data-testid="planned-start-input"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="planned-end-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1"
                >
                  Planned End Date
                </label>
                <input
                  type="date"
                  id="planned-end-input"
                  data-testid="planned-end-input"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-topic-btn"
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-topic-btn"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Topic' : 'Save Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
