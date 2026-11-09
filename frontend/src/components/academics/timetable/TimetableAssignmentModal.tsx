import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '../../common/Modal';
import {
  checkTimetableConflict,
  assignTimetablePeriod,
  updateTimetablePeriod,
  deleteTimetablePeriod,
  getClasses,
  getSubjects,
  getEligibleTimetableTeachers,
  TimetableConflict,
  TimetablePeriod,
  CreateTimetablePeriodDto,
} from '../../../api/timetable.api';

export interface TimetableAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message?: string) => void;
  initialData?: {
    periodId?: string;
    termId?: string;
    classId?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    isDoublePeriod?: boolean;
    subjectId?: string;
    teacherId?: string;
  };
  classes?: Array<{ id: string; name: string; level?: string; stream?: string }>;
  subjects?: Array<{ id: string; name: string; code: string }>;
  teachers?: Array<{ id: string; firstName: string; lastName: string; email?: string }>;
  canManageTeacherSubjects?: boolean;
  terms?: Array<{ id: string; name: string }>;
  existingPeriods?: TimetablePeriod[];
  mockConflicts?: TimetableConflict[];
}

export const TimetableAssignmentModal: React.FC<TimetableAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  classes = [],
  canManageTeacherSubjects = false,
  terms = [],
  existingPeriods = [],
  mockConflicts,
}) => {
  const [classesList, setClassesList] = useState(classes);
  const [subjectsList, setSubjectsList] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [eligibleTeachers, setEligibleTeachers] = useState<Array<{ id: string; firstName: string; lastName: string; email?: string }>>([]);
  const [termsList, setTermsList] = useState(terms);
  const [subjectLoadError, setSubjectLoadError] = useState<string | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingEligibleTeachers, setIsLoadingEligibleTeachers] = useState(false);

  useEffect(() => {
    if (classes.length > 0) setClassesList(classes);
  }, [classes]);

  useEffect(() => {
    if (terms.length > 0) setTermsList(terms);
  }, [terms]);

  // Load live dropdown data if not provided via props
  useEffect(() => {
    if (isOpen) {
      const loadLiveDropdownData = async () => {
        try {
          if (classes.length === 0) {
            const res = await getClasses();
            const list = Array.isArray(res) ? res : (res as any)?.data || [];
            if (list.length > 0) {
              setClassesList(list);
              setFormData((prev) => (prev.classId ? prev : { ...prev, classId: list[0].id }));
            }
          }
        } catch (cause: any) {
          setSubmitError(cause?.response?.data?.error?.message || 'Unable to load classes for timetable allocation.');
        }
      };
      loadLiveDropdownData();
    }
  }, [isOpen, classes.length]);

  const activeClasses = classesList.length > 0 ? classesList : classes;
  const activeSubjects = subjectsList;
  const activeTeachers = eligibleTeachers;
  const activeTerms = termsList.length > 0 ? termsList : terms;

  const isEditing = Boolean(initialData?.periodId);

  // Helper to resolve valid termId (UUID)
  const resolvedTermId = useMemo(() => {
    if (initialData?.termId && initialData.termId !== 'term-default') {
      return initialData.termId;
    }
    const term = activeTerms.find((t) => t.id && t.id !== 'term-default');
    return term?.id || initialData?.termId || '';
  }, [initialData?.termId, activeTerms]);

  const [formData, setFormData] = useState<CreateTimetablePeriodDto>({
    termId: resolvedTermId,
    classId: initialData?.classId || (activeClasses[0]?.id ?? ''),
    subjectId: initialData?.subjectId || '',
    teacherId: initialData?.teacherId || '',
    dayOfWeek: initialData?.dayOfWeek || 'MONDAY',
    startTime: initialData?.startTime || '08:00',
    endTime: initialData?.endTime || '08:40',
    room: initialData?.room || '',
    isDoublePeriod: initialData?.isDoublePeriod ?? false,
  });

  const [conflicts, setConflicts] = useState<TimetableConflict[]>(mockConflicts || []);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictCheckError, setConflictCheckError] = useState<string | null>(null);
  // Load class-specific canonical curriculum subjects.
  useEffect(() => {
    if (!isOpen || !formData.classId) {
      setSubjectsList([]);
      return;
    }
    let active = true;
    setIsLoadingSubjects(true);
    setSubjectLoadError(null);
    getSubjects({ classId: formData.classId })
      .then((list) => {
        if (!active) return;
        const activeSubjects = list.filter((subject: any) => subject.status !== 'INACTIVE');
        setSubjectsList(activeSubjects);
        setFormData((current) => ({
          ...current,
          subjectId: activeSubjects.some((subject: any) => subject.id === current.subjectId) ? current.subjectId : '',
          teacherId: activeSubjects.some((subject: any) => subject.id === current.subjectId) ? current.teacherId : '',
        }));
      })
      .catch((cause: any) => {
        if (active) setSubjectLoadError(cause?.response?.data?.error?.message || 'Unable to load subjects for the selected class.');
      })
      .finally(() => {
        if (active) setIsLoadingSubjects(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, formData.classId]);

  // Only list teachers with an exact subject qualification and matching department.
  useEffect(() => {
    if (!isOpen || !formData.classId || !formData.subjectId) {
      setEligibleTeachers([]);
      setFormData((current) => ({ ...current, teacherId: '' }));
      return;
    }
    let active = true;
    setIsLoadingEligibleTeachers(true);
    setEligibilityError(null);
    getEligibleTimetableTeachers(formData.classId, formData.subjectId)
      .then((list) => {
        if (!active) return;
        setEligibleTeachers(list);
        setFormData((current) => ({
          ...current,
          teacherId: list.some((teacher) => teacher.id === current.teacherId) ? current.teacherId : '',
        }));
      })
      .catch((cause: any) => {
        if (active) {
          setEligibleTeachers([]);
          setEligibilityError(cause?.response?.data?.error?.message || 'Unable to load teachers qualified for this subject.');
        }
      })
      .finally(() => {
        if (active) setIsLoadingEligibleTeachers(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, formData.classId, formData.subjectId]);

  useEffect(() => {
    if (!isOpen) {
      setEligibleTeachers([]);
      setEligibilityError(null);
    }
  }, [isOpen]);

  // Sync state whenever modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      const termIdToUse = initialData?.termId && initialData.termId !== 'term-default'
        ? initialData.termId
        : (activeTerms.find((t) => t.id && t.id !== 'term-default')?.id || initialData?.termId || '');

      setFormData({
        termId: termIdToUse,
        classId: initialData?.classId || (activeClasses[0]?.id ?? ''),
        subjectId: initialData?.subjectId || '',
        teacherId: initialData?.teacherId || '',
        dayOfWeek: initialData?.dayOfWeek || 'MONDAY',
        startTime: initialData?.startTime || '08:00',
        endTime: initialData?.endTime || '08:40',
        room: initialData?.room || '',
        isDoublePeriod: initialData?.isDoublePeriod ?? false,
      });

      setShowDeleteConfirm(false);
      if (mockConflicts) {
        setConflicts(mockConflicts);
      } else {
        setConflicts([]);
      }
      setSubmitError(null);
      setSubjectLoadError(null);
      setEligibilityError(null);
    }
  }, [isOpen, initialData, activeTerms, activeClasses, mockConflicts]);

  // Selected teacher and class details for clear messaging
  const selectedTeacher = useMemo(() => {
    return activeTeachers.find((t) => t.id === formData.teacherId);
  }, [activeTeachers, formData.teacherId]);

  const selectedClass = useMemo(() => {
    return activeClasses.find((c) => c.id === formData.classId);
  }, [activeClasses, formData.classId]);

  // Conflict Detection: Local cache check + remote API verification
  const checkConflicts = useCallback(async () => {
    if (mockConflicts !== undefined) {
      setConflicts(mockConflicts);
      return;
    }

    if (!formData.teacherId || !formData.startTime || !formData.endTime || !formData.dayOfWeek) {
      setConflicts([]);
      setConflictCheckError(null);
      return;
    }

    const detectedConflicts: TimetableConflict[] = [];

    // 1. Local Cache Check
    const teacherName = selectedTeacher
      ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`.trim()
      : 'Teacher';

    const localConflict = existingPeriods.find((p) => {
      // If editing, exclude this period
      if (initialData?.periodId && p.id === initialData.periodId) return false;
      // Must match same day of week
      if (p.dayOfWeek?.toUpperCase() !== formData.dayOfWeek?.toUpperCase()) return false;
      // Must match same teacher
      if (p.teacherId !== formData.teacherId) return false;
      // Overlap condition: start < end && end > start
      const overlaps = p.startTime < formData.endTime && p.endTime > formData.startTime;
      if (!overlaps) return false;
      // Conflict if assigned to another class
      return p.classId !== formData.classId;
    });

    if (localConflict) {
      const conflictingClassName = localConflict.class?.name || (localConflict as any).className || 'another class';
      detectedConflicts.push({
        type: 'TEACHER',
        message: `Conflict: ${teacherName} is already teaching ${conflictingClassName} at this time.`,
        conflictingPeriod: {
          id: localConflict.id,
          className: conflictingClassName,
          teacherName,
          startTime: localConflict.startTime,
          endTime: localConflict.endTime,
        },
      });
    }

    // 2. Class double-booking check
    const classConflict = existingPeriods.find((p) => {
      if (initialData?.periodId && p.id === initialData.periodId) return false;
      if (p.dayOfWeek?.toUpperCase() !== formData.dayOfWeek?.toUpperCase()) return false;
      if (p.classId !== formData.classId) return false;
      return p.startTime < formData.endTime && p.endTime > formData.startTime;
    });

    if (classConflict) {
      const clsName = selectedClass?.name || 'This class';
      detectedConflicts.push({
        type: 'CLASS',
        message: `Conflict: ${clsName} already has an instructional period scheduled during this slot (${classConflict.startTime}-${classConflict.endTime}).`,
        conflictingPeriod: {
          id: classConflict.id,
          className: clsName,
          startTime: classConflict.startTime,
          endTime: classConflict.endTime,
        },
      });
    }

    // If local conflict found, immediately reflect it
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      return;
    }

    // 3. Fallback to API check
    try {
      setIsCheckingConflict(true);
      setConflictCheckError(null);
      if (formData.termId && formData.classId) {
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
          excludeId: initialData?.periodId,
        });

        if (res.hasConflict) {
          const normalized = res.conflicts.map((c) => {
            if (c.type === 'TEACHER') {
              const cClassName = c.conflictingPeriod?.className || 'another class';
              return {
                ...c,
                message: `Conflict: ${teacherName} is already teaching ${cClassName} at this time.`,
              };
            }
            return c;
          });
          setConflicts(normalized);
        } else {
          setConflicts([]);
        }
      }
    } catch (cause: any) {
      setConflicts(detectedConflicts);
      setConflictCheckError(
        cause?.response?.data?.error?.message ||
        cause?.message ||
        'Could not verify timetable conflicts. Try again before saving.'
      );
    } finally {
      setIsCheckingConflict(false);
    }
  }, [
    mockConflicts,
    formData.teacherId,
    formData.classId,
    formData.termId,
    formData.dayOfWeek,
    formData.startTime,
    formData.endTime,
    formData.room,
    formData.isDoublePeriod,
    formData.subjectId,
    selectedTeacher,
    selectedClass,
    existingPeriods,
    initialData?.periodId,
  ]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        checkConflicts();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, checkConflicts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeachers.some((teacher) => teacher.id === formData.teacherId)) {
      setSubmitError('Select a teacher qualified for the selected subject before saving.');
      return;
    }
    if (subjectLoadError || eligibilityError || conflictCheckError) {
      setSubmitError('Resolve the timetable loading or validation error before saving.');
      return;
    }
    if (conflicts.length > 0) {
      setSubmitError('Cannot assign or update period while scheduling conflicts exist.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      if (isEditing && initialData?.periodId) {
        await updateTimetablePeriod(initialData.periodId, formData);
        if (onSuccess) onSuccess('Teacher allocation updated successfully!');
      } else {
        await assignTimetablePeriod(formData);
        if (onSuccess) onSuccess('Period assigned successfully!');
      }
      onClose();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        (isEditing ? 'Failed to update timetable period.' : 'Failed to assign timetable period.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.periodId) return;
    try {
      setIsDeleting(true);
      setSubmitError(null);
      await deleteTimetablePeriod(initialData.periodId);
      if (onSuccess) onSuccess('Timetable period removed successfully!');
      onClose();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to remove timetable period.'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const hasBlockingConflict = conflicts.length > 0 || Boolean(conflictCheckError);
  const hasMissingPrerequisites =
    !formData.termId ||
    !formData.classId ||
    !formData.subjectId ||
    (!isLoadingEligibleTeachers && activeTeachers.length === 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Period & Teacher Allocation' : 'Assign Timetable Period'}
      maxWidth="lg"
    >
      <form
        id="timetable-assignment-form"
        onSubmit={handleSubmit}
        className="space-y-4 text-slate-800"
      >
        {/* Banner indicating mode */}
        {isEditing && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
            <div className="flex items-center gap-1.5 font-medium">
              <Edit2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Editing active allocation — reassign teacher, modify timing, or remove period.</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200/70 text-blue-900">
              Edit Mode
            </span>
          </div>
        )}

        {submitError && (
          <div
            id="timetable-submit-error"
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{submitError}</div>
          </div>
        )}

        {conflictCheckError && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            Conflict validation failed: {conflictCheckError}
          </div>
        )}

        {/* Missing Prerequisites Warning */}
        {hasMissingPrerequisites && (
          <div
            id="missing-prerequisites-warning"
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-1.5 shadow-xs text-amber-900"
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Select a class, applicable subject, and qualified teacher before scheduling.</span>
            </div>
            <p className="text-[11px] text-amber-700">
              The eligible teacher list is restricted to active staff with the selected subject qualification and matching department.
            </p>
          </div>
        )}

        {/* Live Conflict Warning Box */}
        {hasBlockingConflict && (
          <div
            id="conflict-alert"
            role="alert"
            className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 space-y-2 shadow-xs"
          >
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Scheduling Conflict Detected</span>
            </div>
            <ul className="space-y-1.5 text-xs text-rose-800">
              {conflicts.map((c, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-1.5 bg-white/70 rounded-md p-2 border border-rose-200"
                >
                  <span className="font-semibold">{c.message}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-rose-700 font-medium pt-0.5">
              Please choose another teacher, change the time slot, or resolve the overlapping assignment.
            </p>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Class / Stream */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Class / Stream <span className="text-rose-500">*</span>
            </label>
            <select
              id="assignment-class-select"
              required
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: '', teacherId: '' })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>Select Class</option>
              {activeClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.stream ? `(${cls.stream})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject comes before teacher and time allocation. */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <select
              id="assignment-subject-select"
              required
              disabled={!formData.classId || isLoadingSubjects || Boolean(subjectLoadError)}
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, teacherId: '' })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">Select Subject</option>
              {activeSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.code} — {sub.name}</option>
              ))}
            </select>
            {isLoadingSubjects && <p role="status" className="mt-1 text-[10px] text-slate-500">Loading subjects for this class…</p>}
            {subjectLoadError && <p role="alert" className="mt-1 text-[10px] text-rose-700">{subjectLoadError}</p>}
            {!isLoadingSubjects && !subjectLoadError && formData.classId && activeSubjects.length === 0 && (
              <p className="mt-1 text-[10px] text-amber-800">No applicable subjects are configured for this class.</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isEditing ? 'Reassign Teacher' : 'Eligible Teacher'} <span className="text-rose-500">*</span>
            </label>
            <select
              id="assignment-teacher-select"
              required
              disabled={!formData.subjectId || isLoadingEligibleTeachers || Boolean(eligibilityError)}
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-xs bg-white text-slate-800 focus:ring-1 disabled:bg-slate-100 ${
                hasBlockingConflict
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Select an eligible teacher</option>
              {activeTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</option>
              ))}
            </select>
            {isLoadingEligibleTeachers && <p role="status" className="mt-1 text-[10px] text-slate-500">Loading eligible teachers…</p>}
            {eligibilityError && <p role="alert" className="mt-1 text-[10px] text-rose-700">{eligibilityError}</p>}
            {formData.subjectId && !isLoadingEligibleTeachers && !eligibilityError && activeTeachers.length === 0 && (
              <div className="mt-1 text-[10px] text-amber-800">
                No active teacher is assigned to this exact subject and its department.
                {canManageTeacherSubjects && (
                  <> <Link to="/academics/structure/teacher-assignments" className="font-semibold underline">Manage teacher subject allocation</Link>.</>
                )}
              </div>
            )}
          </div>

          {/* Day of Week */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Day of the Week <span className="text-rose-500">*</span>
            </label>
            <select
              id="assignment-day-select"
              required
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="MONDAY">Monday</option>
              <option value="TUESDAY">Tuesday</option>
              <option value="WEDNESDAY">Wednesday</option>
              <option value="THURSDAY">Thursday</option>
              <option value="FRIDAY">Friday</option>
            </select>
          </div>

          {/* Time Slot: Start Time & End Time */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Start Time (HH:mm) <span className="text-rose-500">*</span>
            </label>
            <input
              id="assignment-start-time"
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              End Time (HH:mm) <span className="text-rose-500">*</span>
            </label>
            <input
              id="assignment-end-time"
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Room (Optional) */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Room / Laboratory (Optional)
            </label>
            <input
              id="assignment-room-input"
              type="text"
              placeholder="e.g. Science Lab 2, Room 104"
              value={formData.room || ''}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Double Period Toggle */}
          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
            <input
              id="assignment-double-period-checkbox"
              type="checkbox"
              checked={formData.isDoublePeriod || false}
              onChange={(e) => setFormData({ ...formData, isDoublePeriod: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="assignment-double-period-checkbox"
              className="text-xs text-slate-700 font-medium cursor-pointer"
            >
              Block Double Period (consecutive instructional block)
            </label>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
          {hasMissingPrerequisites ? (
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Prerequisites missing: Subjects and Teachers required</span>
            </span>
          ) : isCheckingConflict ? (
            <span className="flex items-center gap-1.5 text-blue-600">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              <span>Verifying schedule conflict state...</span>
            </span>
          ) : hasBlockingConflict ? (
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{conflictCheckError ? 'Conflict validation unavailable' : 'Hard conflict prevents submission'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Slot is conflict-free and ready for assignment</span>
            </span>
          )}
        </div>

        {/* Delete confirmation bar if triggered */}
        {showDeleteConfirm && (
          <div
            id="delete-confirmation-alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-semibold">Are you sure you want to remove this timetable period?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium"
              >
                No, Keep
              </button>
              <button
                type="button"
                id="btn-confirm-delete-period"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div>
            {isEditing && !showDeleteConfirm && (
              <button
                type="button"
                id="btn-delete-period"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Period</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-assignment"
              disabled={isSubmitting || isDeleting || hasBlockingConflict || hasMissingPrerequisites}
              className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all ${
                hasBlockingConflict || isSubmitting || isDeleting || hasMissingPrerequisites
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isEditing ? (
                <UserCheck className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Allocation'
                  : 'Assign Period'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
