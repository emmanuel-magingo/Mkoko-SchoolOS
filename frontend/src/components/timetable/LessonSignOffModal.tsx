import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, BookOpen, AlertTriangle } from 'lucide-react';
import { AcademicsApi } from '../../api/academics.api';

interface LessonSignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  period: {
    id: string;
    classId?: string;
    className: string;
    subjectId?: string;
    subjectName: string;
    startTime: string;
    endTime: string;
  } | null;
}

export const LessonSignOffModal: React.FC<LessonSignOffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  period,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [status, setStatus] = useState<'TAUGHT' | 'MISSED' | 'CANCELLED'>('TAUGHT');
  const [lessonDate, setLessonDate] = useState<string>(todayStr);
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [reasonForMissed, setReasonForMissed] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('TAUGHT');
      setLessonDate(new Date().toISOString().split('T')[0]);
      setTopic('');
      setObjectives('');
      setReasonForMissed('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !period) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((status === 'MISSED' || status === 'CANCELLED') && !reasonForMissed.trim()) {
      setError(`A specific reason is required when signing off a lesson as ${status}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await AcademicsApi.recordLessonLog({
        timetablePeriodId: period.id,
        classId: period.classId || '',
        subjectId: period.subjectId || '',
        lessonDate,
        status,
        topic: topic.trim() || undefined,
        objectives: objectives.trim() || undefined,
        reasonForMissed: reasonForMissed.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to record lesson log.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-lg">Sign Off Lesson</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lesson Info Pill */}
        <div className="bg-indigo-50/60 border-b border-indigo-100 px-6 py-3 text-xs text-indigo-900 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-indigo-950">{period.subjectName}</span>
            <span className="text-indigo-600 mx-1.5">•</span>
            <span>{period.className}</span>
          </div>
          <span className="font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px]">
            {period.startTime} - {period.endTime}
          </span>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Status Selection */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Lesson Execution Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
              >
                <option value="TAUGHT">TAUGHT (Successfully Delivered)</option>
                <option value="MISSED">MISSED (Unattended / Rescheduled)</option>
                <option value="CANCELLED">CANCELLED (School Event / Closure)</option>
              </select>
            </div>

            {/* Lesson Date */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Instructional Date *</label>
              <input
                type="date"
                required
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
            </div>
          </div>

          {/* If MISSED or CANCELLED, reason is required */}
          {(status === 'MISSED' || status === 'CANCELLED') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
              <label className="block text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                Reason for {status.toLowerCase()} lesson *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Sick leave, school sports tournament, official training"
                value={reasonForMissed}
                onChange={(e) => setReasonForMissed(e.target.value)}
                className="w-full p-2 border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              />
            </div>
          )}

          {/* Curriculum fields for TAUGHT lessons */}
          {status === 'TAUGHT' && (
            <>
              <div>
                <label className="block font-medium text-slate-700 text-sm mb-1">Lesson Topic</label>
                <input
                  type="text"
                  placeholder="e.g., Newton's Second Law of Motion"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 text-sm mb-1">Specific Objectives</label>
                <textarea
                  rows={2}
                  placeholder="e.g., By the end of this lesson, students will be able to calculate acceleration using F=ma..."
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            </>
          )}

          {/* General Notes */}
          <div>
            <label className="block font-medium text-slate-700 text-sm mb-1">Teacher Notes / Evaluation</label>
            <textarea
              rows={2}
              placeholder="e.g., Homework assigned exercises 4.1 to 4.5. Students demonstrated good comprehension."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle size={16} />
              {isSubmitting ? 'Recording...' : 'Record Sign-Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
