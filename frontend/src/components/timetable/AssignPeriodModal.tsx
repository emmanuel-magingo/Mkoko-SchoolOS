import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import {
  assignTimetablePeriod,
  checkTimetableConflict,
  TimetableConflict,
  CreateTimetablePeriodDto,
} from '../../api/timetableApi';

interface AssignPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    classId?: string;
    termId?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    isDoublePeriod?: boolean;
  };
  classes: Array<{ id: string; name: string; stream: string }>;
  subjects: Array<{ id: string; name: string; code: string }>;
  teachers: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  terms: Array<{ id: string; name: string; academicYearId: string }>;
}

export const AssignPeriodModal: React.FC<AssignPeriodModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  classes,
  subjects,
  teachers,
  terms,
}) => {
  const [formData, setFormData] = useState<CreateTimetablePeriodDto>({
    termId: initialData?.termId || (terms[0]?.id ?? ''),
    classId: initialData?.classId || (classes[0]?.id ?? ''),
    subjectId: subjects[0]?.id ?? '',
    teacherId: teachers[0]?.id ?? '',
    dayOfWeek: initialData?.dayOfWeek || 'MONDAY',
    startTime: initialData?.startTime || '08:00',
    endTime: initialData?.endTime || '08:40',
    room: initialData?.room || '',
    isDoublePeriod: initialData?.isDoublePeriod ?? false,
  });

  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        termId: initialData?.termId || prev.termId || (terms[0]?.id ?? ''),
        classId: initialData?.classId || prev.classId || (classes[0]?.id ?? ''),
        dayOfWeek: initialData?.dayOfWeek || prev.dayOfWeek || 'MONDAY',
        startTime: initialData?.startTime || prev.startTime || '08:00',
        endTime: initialData?.endTime || prev.endTime || '08:40',
        room: initialData?.room !== undefined ? initialData.room : prev.room,
        isDoublePeriod: initialData?.isDoublePeriod ?? prev.isDoublePeriod,
      }));
      setConflicts([]);
      setSubmitError(null);
    }
  }, [isOpen, initialData, terms, classes]);

  // Live Conflict Checking
  const performConflictCheck = useCallback(async () => {
    if (
      !formData.termId ||
      !formData.classId ||
      !formData.teacherId ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setConflicts([]);
      return;
    }

    try {
      setIsCheckingConflict(true);
      const res = await checkTimetableConflict({
        termId: formData.termId,
        classId: formData.classId,
        subjectId: formData.subjectId || undefined,
        teacherId: formData.teacherId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room ? formData.room.trim() : null,
        isDoublePeriod: formData.isDoublePeriod,
      });

      if (res.hasConflict) {
        setConflicts(res.conflicts);
      } else {
        setConflicts([]);
      }
    } catch (err: any) {
      console.warn('Conflict check check failed:', err);
    } finally {
      setIsCheckingConflict(false);
    }
  }, [formData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performConflictCheck();
    }, 350);

    return () => clearTimeout(timer);
  }, [performConflictCheck]);

  if (!isOpen) return null;

  const handleDoublePeriodToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => {
      let updatedEnd = prev.endTime;
      // Auto-adjust standard double period (40m -> 80m: 08:00->09:20, or legacy 45m -> 90m: 08:00->09:30)
      if (checked && prev.startTime === '08:00' && (prev.endTime === '08:40' || prev.endTime === '08:45')) {
        updatedEnd = prev.endTime === '08:40' ? '09:20' : '09:30';
      } else if (!checked && prev.startTime === '08:00' && (prev.endTime === '09:20' || prev.endTime === '09:30')) {
        updatedEnd = prev.endTime === '09:20' ? '08:40' : '08:45';
      }
      return {
        ...prev,
        isDoublePeriod: checked,
        endTime: updatedEnd,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicts.length > 0) {
      setSubmitError('Please resolve all scheduling conflicts before assigning.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await assignTimetablePeriod(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to assign timetable period.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBlockingConflict = conflicts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-slate-800 text-lg">Assign Timetable Period</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Live Conflict Warning Box */}
          {conflicts.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
                <AlertCircle size={18} className="text-red-600 shrink-0" />
                <span>Scheduling Conflict Detected</span>
              </div>
              <ul className="text-xs text-red-700 space-y-1.5 pl-6 list-disc">
                {conflicts.map((c, i) => (
                  <li key={i} className="leading-relaxed">
                    <span className="font-medium uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-red-200 text-red-900 mr-1.5">
                      {c.type}
                    </span>
                    {c.message}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-red-600 font-medium pt-1">
                Submissions are blocked while conflicts exist. Please select an alternate teacher, room, or time.
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Term */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Academic Term *</label>
              <select
                required
                value={formData.termId}
                onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Class / Stream *</label>
              <select
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.stream ? `(${c.stream})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Subject *</label>
              <select
                required
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Teacher *</label>
              <select
                required
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Day of Week *</label>
              <select
                required
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Room / Lab */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Room / Laboratory</label>
              <input
                type="text"
                placeholder="e.g., Lab 2, Room 4"
                value={formData.room || ''}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Time (HH:mm) *</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
              </input>
            </div>

            {/* End Time */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">End Time (HH:mm) *</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
              </input>
            </div>
          </div>

          {/* Double Period Checkbox */}
          <div className="flex items-center gap-3 pt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="modalIsDoublePeriod"
              checked={formData.isDoublePeriod || false}
              onChange={handleDoublePeriodToggle}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <label htmlFor="modalIsDoublePeriod" className="text-xs text-slate-700 font-medium cursor-pointer">
              Consecutive Double Period (reserves 2 consecutive blocks without inter-period break)
            </label>
          </div>

          {/* Conflict Indicator Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            {isCheckingConflict ? (
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Verifying schedule availability...
              </span>
            ) : conflicts.length === 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle size={14} />
                No schedule conflicts detected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-600 font-medium">
                <AlertTriangle size={14} />
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found
              </span>
            )}
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
              disabled={isSubmitting || hasBlockingConflict}
              className={`px-5 py-2 text-white rounded-lg text-sm font-medium transition-all shadow-sm ${
                hasBlockingConflict
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-brand-600 hover:bg-brand-700 active:scale-95'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Assign Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
