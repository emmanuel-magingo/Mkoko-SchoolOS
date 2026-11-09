import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Users,
  Briefcase,
  AlertCircle,
  GraduationCap,
  BookOpen,
  RefreshCw,
  Plus,
  Mail,
  CheckCircle2,
  Award,
  Edit2,
  Check,
} from 'lucide-react';
import { AcademicsApi } from '../../../api/academics.api';
import { Teacher, TeacherAssignment, Subject } from '../../../types/academics.types';
import { getEducationLevelFromClass } from '../../../utils/education-level.utils';

export interface TeacherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string | null;
  initialTeacher?: Teacher | null;
  onAssignToClass?: (teacherId: string) => void;
  onChangeDepartment?: (teacher: Teacher) => void;
  onTeacherUpdated?: (updatedTeacher: Teacher) => void;
}

export const TeacherDetailsModal: React.FC<TeacherDetailsModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  initialTeacher,
  onAssignToClass,
  onChangeDepartment,
  onTeacherUpdated,
}) => {
  const [teacher, setTeacher] = useState<Teacher | null>(initialTeacher || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Qualifications editing state
  const [isEditingQualifications, setIsEditingQualifications] = useState<boolean>(false);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [savingQualifications, setSavingQualifications] = useState<boolean>(false);
  const [qualificationSuccess, setQualificationSuccess] = useState<string | null>(null);

  const activeId = teacherId || initialTeacher?.id;

  useEffect(() => {
    if (!isOpen || !activeId) {
      if (!isOpen) {
        setTeacher(null);
        setError(null);
        setIsEditingQualifications(false);
        setQualificationSuccess(null);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsEditingQualifications(false);
    setQualificationSuccess(null);

    if (initialTeacher && initialTeacher.id === activeId) {
      setTeacher(initialTeacher);
      const initialQIds = (initialTeacher.qualifications || []).map((q) => q.id);
      setSelectedSubjectIds(initialQIds.length > 0 ? initialQIds : initialTeacher.subjectIds || []);
    }

    AcademicsApi.getTeacher(activeId)
      .then((res) => {
        if (isMounted && res.data) {
          setTeacher(res.data);
          const qIds = (res.data.qualifications || []).map((q: any) => q.id);
          setSelectedSubjectIds(qIds.length > 0 ? qIds : res.data.subjectIds || []);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          if (!initialTeacher) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load teacher details.');
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeId, initialTeacher]);

  // Load school subjects when entering qualification editing mode
  useEffect(() => {
    if (isEditingQualifications && availableSubjects.length === 0) {
      setLoadingSubjects(true);
      AcademicsApi.getSubjects()
        .then((res) => {
          setAvailableSubjects(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to load subjects for qualifications:', err);
        })
        .finally(() => setLoadingSubjects(false));
    }
  }, [isEditingQualifications, availableSubjects.length]);

  const assignments: TeacherAssignment[] =
    teacher?.assignments || teacher?.teacherAssignments || [];

  const qualifications: Subject[] = teacher?.qualifications || [];

  const departmentName = teacher?.academicDepartment?.name;
  const departmentCode = teacher?.academicDepartment?.code;

  // Decoupled education levels: derived from qualifications first, plus existing assignments
  const teachingLevels: string[] = useMemo(() => {
    const levels = new Set<string>();
    // From qualifications
    for (const q of qualifications) {
      if (q.level) levels.add(q.level);
    }
    // From assignments
    for (const asg of assignments) {
      if (asg.subject?.level) {
        levels.add(asg.subject.level);
      } else if (asg.class?.level) {
        levels.add(getEducationLevelFromClass(asg.class.level));
      }
    }
    if (levels.size === 0 && teacher?.teachingLevels) {
      teacher.teachingLevels.forEach((l) => levels.add(l));
    }
    return Array.from(levels);
  }, [qualifications, assignments, teacher?.teachingLevels]);

  const designation =
    teacher?.designation ||
    teacher?.staffProfile?.jobTitle ||
    (teacher?.role === 'TEACHER' ? 'Teacher' : teacher?.role ? teacher.role.replace(/_/g, ' ') : 'Teacher');

  // Real-time automatic department assignment analysis
  const selectedSubjectsAnalysis = useMemo(() => {
    if (selectedSubjectIds.length === 0) {
      return {
        status: 'NONE' as const,
        departmentName: null,
        message: 'No subjects selected. Saving will clear the teacher’s academic department.',
        conflicts: [],
      };
    }
    const selected = availableSubjects.filter((s) => selectedSubjectIds.includes(s.id));
    const deptMap = new Map<string, string>();
    for (const s of selected) {
      if (s.departmentId) {
        deptMap.set(s.departmentId, (s as any).department?.name || 'Department');
      }
    }
    const deptIds = Array.from(deptMap.keys());
    if (deptIds.length > 1) {
      const names = Array.from(deptMap.values());
      return {
        status: 'CONFLICT' as const,
        departmentName: null,
        message: `Cross-Department Conflict: Selected subjects span multiple departments (${names.join(', ')}). A teacher can belong to at most ONE academic department.`,
        conflicts: names,
      };
    }
    if (deptIds.length === 1) {
      const name = deptMap.get(deptIds[0])!;
      return {
        status: 'RESOLVED' as const,
        departmentName: name,
        message: `Automatically Assigned Department: ${name}`,
        conflicts: [],
      };
    }
    return {
      status: 'NO_DEPT' as const,
      departmentName: null,
      message: 'Selected subjects do not belong to an academic department.',
      conflicts: [],
    };
  }, [selectedSubjectIds, availableSubjects]);

  if (!isOpen) return null;

  const handleCancelQualifications = () => {
    const qualificationIds = (teacher?.qualifications || []).map((qualification) => qualification.id);
    setSelectedSubjectIds(qualificationIds.length > 0 ? qualificationIds : teacher?.subjectIds || []);
    setIsEditingQualifications(false);
    setError(null);
  };

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSaveQualifications = async () => {
    if (!teacher) return;
    if (selectedSubjectsAnalysis.status === 'CONFLICT') {
      setError(selectedSubjectsAnalysis.message);
      return;
    }
    setSavingQualifications(true);
    setError(null);
    try {
      const res = await AcademicsApi.updateTeacherQualifications(teacher.id, selectedSubjectIds);
      if (res.data) {
        setTeacher(res.data);
        if (onTeacherUpdated) {
          onTeacherUpdated(res.data);
        }
      }
      setIsEditingQualifications(false);
      setQualificationSuccess('Teacher subject qualifications updated successfully.');
      setTimeout(() => setQualificationSuccess(null), 4000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to update teacher subject qualifications.'
      );
    } finally {
      setSavingQualifications(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="bg-slate-900 px-5 py-4 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-brand-600 border border-brand-400/40 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
              {teacher?.firstName ? teacher.firstName.charAt(0) : <Users className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="teacher-details-title"
                  className="text-base sm:text-lg font-bold text-white truncate"
                >
                  {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher Details'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Faculty
                </span>
                <span
                  id="teacher-designation-badge"
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/20"
                >
                  {designation}
                </span>
              </div>

              {/* Badges bar: Department & Teaching Levels */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {teacher?.academicDepartment ? (
                  <span
                    id="teacher-department-badge"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/40"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-brand-300" />
                    <span>{departmentName}</span>
                    {departmentCode && <span className="opacity-75">{`(${departmentCode})`}</span>}
                  </span>
                ) : (
                  <span
                    id="teacher-department-badge"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Unassigned Department</span>
                  </span>
                )}

                {onChangeDepartment && teacher && (
                  <button
                    type="button"
                    onClick={() => onChangeDepartment(teacher)}
                    className="text-xs text-brand-300 hover:text-white underline underline-offset-2 transition"
                  >
                    Change
                  </button>
                )}

                {teachingLevels.length > 0 && (
                  <div id="teacher-teaching-levels" className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Levels:</span>
                    {teachingLevels.map((lvl) => {
                      const label =
                        lvl === 'PRIMARY' ? 'Primary' : lvl === 'A_LEVEL' ? 'A-Level' : 'O-Level';
                      const colorClass =
                        lvl === 'PRIMARY'
                          ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                          : lvl === 'A_LEVEL'
                          ? 'bg-purple-400/20 text-purple-200 border-purple-400/40'
                          : 'bg-blue-400/20 text-blue-200 border-blue-400/40';
                      return (
                        <span
                          key={lvl}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {teacher?.email && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5 opacity-70" />
                  <span>{teacher.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {qualificationSuccess && (
            <div
              role="status"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{qualificationSuccess}</span>
            </div>
          )}

          {loading && !teacher ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
              <span className="text-xs font-medium">Loading live teacher details...</span>
            </div>
          ) : (
            <>
              {/* SECTION 1: QUALIFIED SUBJECT SPECIALIZATIONS */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Subject Specializations &amp; Qualifications
                    </h3>
                  </div>
                  {!isEditingQualifications ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingQualifications(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-white border border-brand-200 rounded hover:bg-brand-50 transition"
                    >
                      <Edit2 className="w-3 h-3" />
                      Configure Qualifications
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelQualifications}
                        disabled={savingQualifications}
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 rounded transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveQualifications}
                        disabled={savingQualifications || selectedSubjectsAnalysis.status === 'CONFLICT'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-brand-600 rounded hover:bg-brand-700 transition disabled:opacity-50"
                      >
                        {savingQualifications ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {isEditingQualifications ? (
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    <p className="text-[11px] text-slate-600">
                      Select all curriculum subjects this teacher is officially qualified and authorized to teach. Academic department is automatically assigned based on the selected subjects.
                    </p>

                    {/* Real-time Department Allocation Feedback */}
                    {selectedSubjectsAnalysis.status === 'CONFLICT' ? (
                      <div id="qualification-conflict-alert" className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Department Conflict:</span>
                          <p className="mt-0.5">{selectedSubjectsAnalysis.message}</p>
                        </div>
                      </div>
                    ) : selectedSubjectsAnalysis.status === 'RESOLVED' ? (
                      <div id="qualification-dept-resolved" className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Automatic Department Assignment:</strong> {selectedSubjectsAnalysis.departmentName} (saving will auto-assign teacher to this department)
                        </span>
                      </div>
                    ) : selectedSubjectsAnalysis.status === 'NONE' ? (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{selectedSubjectsAnalysis.message}</span>
                      </div>
                    ) : null}
                    {loadingSubjects ? (
                      <div className="py-4 text-center text-slate-500">
                        <RefreshCw className="w-4 h-4 animate-spin inline-block mr-1 text-brand-600" />
                        Loading subjects...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white border border-slate-200 rounded">
                        {availableSubjects.map((sub) => {
                          const isSelected = selectedSubjectIds.includes(sub.id);
                          return (
                            <label
                              key={sub.id}
                              className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition text-xs border ${
                                isSelected
                                  ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold'
                                  : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSubject(sub.id)}
                                className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500"
                              />
                              <span className="truncate">{sub.name}</span>
                              <span className="font-mono text-[10px] text-slate-500 ml-auto">({sub.code})</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {qualifications.length === 0 ? (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-amber-800 text-[11px] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">No Subject Qualifications Recorded</p>
                          <p className="mt-0.5">
                            This teacher cannot be allocated to teach any classes until their qualified subjects are configured.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {qualifications.map((q) => (
                          <span
                            key={q.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs"
                          >
                            <BookOpen className="w-3 h-3 text-brand-600" />
                            <span className="font-semibold">{q.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">({q.code})</span>
                            {q.level && (
                              <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {q.level === 'PRIMARY' ? 'PRI' : q.level === 'A_LEVEL' ? 'A-LVL' : 'O-LVL'}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 2: ACTUAL CLASS ALLOCATIONS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand-600" />
                    Teaching Load &amp; Assigned Subjects ({assignments.length})
                  </h3>
                  {onAssignToClass && teacher && (
                    <button
                      type="button"
                      onClick={() => onAssignToClass(teacher.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded hover:bg-brand-100 transition"
                    >
                      <Plus className="w-3 h-3" />
                      Allocate to Class
                    </button>
                  )}
                </div>

                {assignments.length === 0 ? (
                  <div className="py-6 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700 text-xs">No Teaching Load Assigned</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      This teacher has not yet been assigned to any subjects or classes.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table
                      id="teacher-assignments-table"
                      className="w-full text-left border-collapse text-xs"
                    >
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3">Class</th>
                          <th className="py-2 px-3 text-right">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {assignments.map((assignment) => {
                          const subjectName = assignment.subject?.name || 'Assigned Subject';
                          const subjectCode = assignment.subject?.code || '—';
                          const className =
                            assignment.class?.name ||
                            `${assignment.class?.level || ''} ${assignment.class?.stream || ''}`.trim() ||
                            'Class';

                          return (
                            <tr
                              key={assignment.id}
                              className="hover:bg-slate-50/75 transition-colors"
                            >
                              <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                <span>{subjectName}</span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                {subjectCode}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-900">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                                  {className}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {assignment.isPrimary ? 'Lead Teacher' : 'Co-Teacher'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            {teacher?.id && <span>Faculty ID: {teacher.id.slice(0, 8)}</span>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default TeacherDetailsModal;
