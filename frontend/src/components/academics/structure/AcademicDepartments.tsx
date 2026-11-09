import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Briefcase,
  RefreshCw,
  UserPlus,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { AcademicsApi } from '../../../api/academics.api';
import { AcademicDepartment, Teacher, Subject, TeacherAssignment } from '../../../types/academics.types';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTenantEnabledLevels } from '../../../utils/education-level.utils';
import { TeacherDetailsModal } from './TeacherDetailsModal';

interface AcademicDepartmentsProps {
  initialDepartments?: AcademicDepartment[];
  initialTeachers?: Teacher[];
  initialSubjects?: Subject[];
  initialAssignments?: TeacherAssignment[];
  initialCreateModalOpen?: boolean;
  initialEditDept?: AcademicDepartment | null;
  initialAssignDept?: AcademicDepartment | null;
}

export const AcademicDepartments: React.FC<AcademicDepartmentsProps> = ({
  initialDepartments,
  initialTeachers,
  initialSubjects,
  initialAssignments,
  initialCreateModalOpen,
  initialEditDept,
  initialAssignDept,
}) => {
  const { selectedSchool } = useAcademicContext();
  const { user, tenant } = useAuth();

  const enabledLevels = useMemo(() => getTenantEnabledLevels(tenant, selectedSchool), [tenant, selectedSchool]);
  const activeLevels = useMemo(() => (enabledLevels && enabledLevels.length > 0 ? enabledLevels : ['PRIMARY', 'O_LEVEL', 'A_LEVEL']), [enabledLevels]);

  const userRole = (user?.role as string) || '';
  const isElevatedAcademic =
    userRole === 'ADMIN' ||
    userRole === 'SCHOOL_ADMIN' ||
    userRole === 'HEADMASTER' ||
    userRole === 'ACADEMIC_MASTER' ||
    userRole === 'SENIOR_ACADEMIC_MASTER' ||
    (user as any)?.academicRole === 'ACADEMIC_MASTER';

  const isHod =
    !isElevatedAcademic &&
    (userRole === 'HEAD_OF_DEPARTMENT' || (user as any)?.academicRole === 'HEAD_OF_DEPARTMENT');

  const [departments, setDepartments] = useState<AcademicDepartment[]>(initialDepartments || []);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers || []);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>(initialSubjects || []);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>(initialAssignments || []);
  const [loading, setLoading] = useState<boolean>(!initialDepartments || !initialTeachers);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL'>('ALL');

  // View mode & reconciliation state
  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'RECONCILIATION'>('DEPARTMENTS');
  const [reconciliationReport, setReconciliationReport] = useState<any>(null);
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);
  const [expandedSubjectDeptId, setExpandedSubjectDeptId] = useState<string | null>(null);
  const [reconFilter, setReconFilter] = useState<'ALL' | 'CONFLICT' | 'UNASSIGNED' | 'VALID'>('CONFLICT');
  const [reconSearch, setReconSearch] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(initialCreateModalOpen || false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(Boolean(initialEditDept));
  const [isAssignTeachersModalOpen, setIsAssignTeachersModalOpen] = useState<boolean>(Boolean(initialAssignDept));
  const [departmentToDelete, setDepartmentToDelete] = useState<AcademicDepartment | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [departmentName, setDepartmentName] = useState<string>(initialEditDept?.name || '');
  const [departmentCode, setDepartmentCode] = useState<string>(initialEditDept?.code || '');
  const [departmentHodId, setDepartmentHodId] = useState<string>(initialEditDept?.hodId || initialEditDept?.hod?.id || '');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>(
    initialAssignDept
      ? (initialAssignDept.teachers ? initialAssignDept.teachers.map((t) => t.id) : [])
      : []
  );
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    initialEditDept
      ? (initialEditDept.subjects ? initialEditDept.subjects.map((s) => s.id) : [])
      : []
  );
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(initialEditDept?.id || null);
  const [assigningDepartment, setAssigningDepartment] = useState<AcademicDepartment | null>(initialAssignDept || null);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [formLevelFilter, setFormLevelFilter] = useState<'ALL' | 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL'>('ALL');
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [showIneligible, setShowIneligible] = useState<boolean>(false);

  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    setSubjectsError(null);
    try {
      const res = await AcademicsApi.getSubjects();
      const subs = Array.isArray(res.data) ? res.data : [];
      setAvailableSubjects(subs);
      return subs;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load subjects from registry.';
      setSubjectsError(msg);
      return [];
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSubjectsError(null);
    try {
      const [deptRes, teachersRes, subjectsRes, assignmentsRes, reconRes] = await Promise.all([
        AcademicsApi.getDepartments().catch(() => ({ data: [] })),
        AcademicsApi.getTeachers().catch(() => ({ data: [] })),
        AcademicsApi.getSubjects().catch((err: any) => {
          setSubjectsError(err?.response?.data?.message || err?.message || 'Failed to load subjects from registry.');
          return { data: [] };
        }),
        AcademicsApi.getTeacherAssignments().catch(() => ({ data: [] })),
        AcademicsApi.getDepartmentReconciliationReport().catch(() => ({ data: null })),
      ]);

      const loadedDepts = Array.isArray(deptRes.data) ? deptRes.data : [];
      const loadedTeachers = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      const loadedSubjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
      const loadedAssignments = Array.isArray(assignmentsRes?.data) ? assignmentsRes.data : [];

      setDepartments(loadedDepts);
      setTeachers(loadedTeachers);
      setAvailableSubjects(loadedSubjects);
      setTeacherAssignments(loadedAssignments);
      if (reconRes?.data) {
        setReconciliationReport(reconRes.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load academic departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Teacher-Subject mapping for eligibility
  const teacherSubjectMap = useMemo(() => {
    interface SubjectSummary {
      id: string;
      name: string;
      code: string;
      departmentId?: string | null;
      category?: string | null;
      level?: string | null;
    }
    const map = new Map<string, SubjectSummary[]>();

    const resolveDeptId = (sId: string, directDeptId?: string | null) => {
      if (directDeptId) return directDeptId;
      if (assigningDepartment?.subjects?.some((s) => s.id === sId)) {
        return assigningDepartment.id;
      }
      const d = departments.find((dept) => dept.subjects?.some((s) => s.id === sId));
      return d ? d.id : null;
    };

    for (const a of teacherAssignments) {
      if (!a.teacherId || !a.subjectId) continue;
      const rawSub = availableSubjects.find((s) => s.id === a.subjectId) || a.subject;
      if (!rawSub) continue;
      const deptId = resolveDeptId(rawSub.id, (rawSub as any).departmentId);
      const sub: SubjectSummary = {
        id: rawSub.id,
        name: rawSub.name,
        code: rawSub.code,
        departmentId: deptId,
        category: rawSub.category ?? null,
        level: (rawSub as any).level ?? null,
      };
      const existing = map.get(a.teacherId) || [];
      if (!existing.some((s) => s.id === sub.id)) {
        map.set(a.teacherId, [...existing, sub]);
      }
    }

    for (const t of teachers) {
      const asgList = t.assignments || t.teacherAssignments || [];
      for (const a of asgList) {
        if (!a.subjectId) continue;
        const rawSub = availableSubjects.find((s) => s.id === a.subjectId) || a.subject;
        if (!rawSub) continue;
        const deptId = resolveDeptId(rawSub.id, (rawSub as any).departmentId);
        const sub: SubjectSummary = {
          id: rawSub.id,
          name: rawSub.name,
          code: rawSub.code,
          departmentId: deptId,
          category: rawSub.category ?? null,
          level: (rawSub as any).level ?? null,
        };
        const existing = map.get(t.id) || [];
        if (!existing.some((s) => s.id === sub.id)) {
          map.set(t.id, [...existing, sub]);
        }
      }
    }
    return map;
  }, [teacherAssignments, availableSubjects, teachers, departments, assigningDepartment]);

  // Department's configured subjects (unified from assigningDepartment and availableSubjects)
  const assigningDeptSubjects = useMemo(() => {
    if (!assigningDepartment) return [];
    const map = new Map<string, Subject>();
    if (assigningDepartment.subjects) {
      for (const s of assigningDepartment.subjects) {
        map.set(s.id, {
          ...s,
          departmentId: s.departmentId || assigningDepartment.id,
        });
      }
    }
    for (const s of availableSubjects) {
      if (s.departmentId === assigningDepartment.id) {
        map.set(s.id, {
          ...s,
          departmentId: assigningDepartment.id,
        });
      }
    }
    return Array.from(map.values());
  }, [assigningDepartment, availableSubjects]);

  const assigningDeptSubjectIdSet = useMemo(() => {
    return new Set(assigningDeptSubjects.map((s) => s.id));
  }, [assigningDeptSubjects]);

  // Eligible & Ineligible teachers for assigningDepartment
  const { eligibleTeachers, ineligibleTeachers } = useMemo(() => {
    if (!assigningDepartment || assigningDeptSubjectIdSet.size === 0) {
      return { eligibleTeachers: [] as Teacher[], ineligibleTeachers: [] as Array<{ teacher: Teacher; reason: string }> };
    }

    const eligible: Teacher[] = [];
    const ineligible: Array<{ teacher: Teacher; reason: string }> = [];

    for (const t of teachers) {
      const tSubjects = teacherSubjectMap.get(t.id) || [];
      const hasSubjectInDept = tSubjects.some((s) => assigningDeptSubjectIdSet.has(s.id));

      if (tSubjects.length === 0) {
        ineligible.push({
          teacher: t,
          reason: 'No active teaching subject assignments in this school',
        });
        continue;
      }

      if (!hasSubjectInDept) {
        const otherDeptNames = Array.from(
          new Set(
            tSubjects
              .map((s) => {
                if (s.departmentId) {
                  const d = departments.find((dept) => dept.id === s.departmentId);
                  return d?.name;
                }
                return null;
              })
              .filter(Boolean)
          )
        );
        const reason =
          otherDeptNames.length > 0
            ? `Assigned subjects belong to: ${otherDeptNames.join(', ')}`
            : `Taught subjects (${tSubjects.map((s) => s.name).join(', ')}) do not match this department`;
        ineligible.push({ teacher: t, reason });
        continue;
      }

      // Check conflicting assignments in other departments
      const conflicts = tSubjects.filter(
        (s) => s.departmentId && s.departmentId !== assigningDepartment.id
      );
      if (conflicts.length > 0) {
        const conflictDepts = Array.from(
          new Set(
            conflicts.map((s) => {
              const d = departments.find((dept) => dept.id === s.departmentId);
              return d?.name || 'another department';
            })
          )
        );
        ineligible.push({
          teacher: t,
          reason: `Already assigned to ${conflictDepts.join(', ')} (1 department per teacher rule)`,
        });
        continue;
      }

      eligible.push(t);
    }

    return { eligibleTeachers: eligible, ineligibleTeachers: ineligible };
  }, [assigningDepartment, assigningDeptSubjectIdSet, teachers, teacherSubjectMap, departments]);

  // Filter available subjects for Create/Edit Modal with search and level tabs
  const filteredAvailableSubjects = useMemo(() => {
    let result = availableSubjects;
    if (formLevelFilter !== 'ALL') {
      result = result.filter((s) => s.level === formLevelFilter);
    }
    if (subjectFilter.trim()) {
      const q = subjectFilter.toLowerCase().trim();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
      );
    }
    return result;
  }, [availableSubjects, formLevelFilter, subjectFilter]);

  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Scoped departments based on role:
  // For an HOD: Ensure their view scopes directly to managing their specific assigned department under Academic Master.
  const scopedDepartments = useMemo(() => {
    if (isHod) {
      const assignedDeptId = user?.academicDepartment?.id || user?.department?.id;
      const userProfileId = user?.staffProfileId || user?.id;
      return departments.filter(
        (d) =>
          (assignedDeptId && d.id === assignedDeptId) ||
          d.hodId === user?.id ||
          d.hodId === userProfileId ||
          d.hod?.id === userProfileId ||
          d.hod?.id === user?.id
      );
    }
    return departments;
  }, [departments, isHod, user]);

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedDepartments.filter((d) => {
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        Boolean(d.hod && `${d.hod.firstName} ${d.hod.lastName}`.toLowerCase().includes(q));

      const deptLevels: string[] =
        d.educationLevels && d.educationLevels.length > 0
          ? d.educationLevels
          : Array.from(new Set(d.subjects?.map((s) => s.level || 'O_LEVEL') || []));

      const matchesLevel =
        levelFilter === 'ALL' || deptLevels.includes(levelFilter);

      return matchesSearch && matchesLevel;
    });
  }, [scopedDepartments, searchQuery, levelFilter]);

  // Aggregate stats
  const totalDepartments = scopedDepartments.length;
  const totalAssignedTeachers = useMemo(() => {
    const assignedSet = new Set<string>();
    teachers.forEach((t) => {
      if (t.academicDepartmentId && scopedDepartments.some((d) => d.id === t.academicDepartmentId)) {
        assignedSet.add(t.id);
      }
    });
    scopedDepartments.forEach((d) => {
      d.teachers?.forEach((t) => assignedSet.add(t.id));
    });
    return assignedSet.size;
  }, [scopedDepartments, teachers]);

  const hodAssignedCount = useMemo(() => {
    return scopedDepartments.filter((d) => Boolean(d.hodId || d.hod)).length;
  }, [scopedDepartments]);

  const conflictCount = useMemo(() => {
    if (reconciliationReport?.summary?.conflictCount !== undefined) {
      return reconciliationReport.summary.conflictCount;
    }
    let count = 0;
    teachers.forEach((t) => {
      const subs = teacherSubjectMap.get(t.id) || [];
      const deptIds = new Set(subs.map((s) => s.departmentId).filter(Boolean));
      if (deptIds.size > 1) count++;
    });
    return count;
  }, [reconciliationReport, teachers, teacherSubjectMap]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setDepartmentName('');
    setDepartmentCode('');
    setDepartmentHodId('');
    setSelectedTeacherIds([]);
    setSelectedSubjectIds([]);
    setSubjectFilter('');
    setFormLevelFilter('ALL');
    setModalError(null);
    setIsCreateModalOpen(true);
    if (availableSubjects.length === 0 && !loadingSubjects) {
      fetchSubjects();
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept: AcademicDepartment) => {
    setEditingDepartmentId(dept.id);
    setDepartmentName(dept.name);
    setDepartmentCode(dept.code);
    setDepartmentHodId(dept.hodId || dept.hod?.id || '');
    setSelectedTeacherIds(dept.teachers ? dept.teachers.map((t) => t.id) : []);
    setSelectedSubjectIds(dept.subjects ? dept.subjects.map((s) => s.id) : []);
    setSubjectFilter('');
    setFormLevelFilter('ALL');
    setModalError(null);
    setIsEditModalOpen(true);
    if (availableSubjects.length === 0 && !loadingSubjects) {
      fetchSubjects();
    }
  };

  // Open Assign Teachers Modal
  const handleOpenAssignTeachersModal = (dept: AcademicDepartment) => {
    setAssigningDepartment(dept);
    setTeacherSearch('');
    setShowIneligible(false);
    const existingIds = dept.teachers
      ? dept.teachers.map((t) => t.id)
      : teachers.filter((t) => t.academicDepartmentId === dept.id).map((t) => t.id);
    setSelectedTeacherIds(existingIds);
    setModalError(null);
    setIsAssignTeachersModalOpen(true);
    if (availableSubjects.length === 0 && !loadingSubjects) {
      fetchSubjects();
    }
  };

  // Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      setModalError('Department name is required.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const code = departmentCode.trim().toUpperCase() || departmentName.trim().substring(0, 4).toUpperCase();
      const res = await AcademicsApi.createDepartment({
        name: departmentName.trim(),
        code,
        hodId: departmentHodId || null,
        teacherIds: selectedTeacherIds,
        subjectIds: selectedSubjectIds,
      });

      const newDept = res.data;
      setDepartments((prev) => [...prev, newDept].sort((a, b) => a.name.localeCompare(b.name)));
      showSuccess(`Department "${newDept.name}" created successfully.`);
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Department
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartmentId || !departmentName.trim()) {
      setModalError('Department name is required.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const code = departmentCode.trim().toUpperCase() || departmentName.trim().substring(0, 4).toUpperCase();
      const res = await AcademicsApi.updateDepartment(editingDepartmentId, {
        name: departmentName.trim(),
        code,
        hodId: departmentHodId || null,
        teacherIds: selectedTeacherIds,
        subjectIds: selectedSubjectIds,
      });

      const updatedDept = res.data;
      setDepartments((prev) =>
        prev.map((d) => (d.id === editingDepartmentId ? updatedDept : d))
      );
      showSuccess(`Department "${updatedDept.name}" updated successfully.`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Teacher Assignments
  const handleSaveTeacherAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningDepartment) return;

    setSubmitting(true);
    setModalError(null);
    try {
      await AcademicsApi.updateDepartment(assigningDepartment.id, {
        teacherIds: selectedTeacherIds,
      });

      showSuccess(`Teacher assignments updated for "${assigningDepartment.name}".`);
      setIsAssignTeachersModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to update teacher assignments.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    setSubmitting(true);
    try {
      await AcademicsApi.deleteDepartment(departmentToDelete.id);
      setDepartments((prev) => prev.filter((d) => d.id !== departmentToDelete.id));
      showSuccess(`Department "${departmentToDelete.name}" deleted successfully.`);
      setDepartmentToDelete(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete department.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    );
  };

  return (
    <div id="academic-departments-page" className="space-y-6">
      {/* Toast Alert */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs transition-all"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Academic Departments
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
              Tanzanian Secondary Structure
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Organize teaching staff, subject curricula, and instructional governance into academic departments (e.g., Science, Languages, Mathematics, Social Sciences).
          </p>
        </div>

        {!isHod && (
          <button
            id="btn-create-department"
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Department
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalDepartments}</div>
            <div className="text-xs text-slate-500 font-medium">Total Departments</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalAssignedTeachers}</div>
            <div className="text-xs text-slate-500 font-medium">Teachers Assigned</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {hodAssignedCount} / {totalDepartments}
            </div>
            <div className="text-xs text-slate-500 font-medium">Heads of Department (HoD)</div>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          id="btn-reconciliation-kpi"
          onClick={() => setActiveTab('RECONCILIATION')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setActiveTab('RECONCILIATION');
          }}
          className={`p-4 rounded-xl border shadow-2xs flex items-center gap-4 cursor-pointer transition ${
            conflictCount > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
              : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50'
          }`}
          title={conflictCount > 0 ? 'Click to resolve conflicting teacher assignments' : 'All teacher assignments aligned'}
        >
          <div
            className={`p-3 rounded-lg ${
              conflictCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {conflictCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div
              className={`text-2xl font-bold ${
                conflictCount > 0 ? 'text-amber-900' : 'text-emerald-900'
              }`}
            >
              {conflictCount > 0 ? `${conflictCount} Conflicts` : 'All Aligned'}
            </div>
            <div className="text-xs font-medium text-slate-600">
              {conflictCount > 0 ? 'Requires Reconciliation' : 'Single-Dept Enforced'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          id="tab-departments-directory"
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'DEPARTMENTS'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments Directory ({totalDepartments})</span>
        </button>

        <button
          type="button"
          id="tab-faculty-reconciliation"
          onClick={() => setActiveTab('RECONCILIATION')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'RECONCILIATION'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Faculty Allocation &amp; Reconciliation</span>
          {conflictCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {conflictCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'DEPARTMENTS' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="department-search-input"
                  type="text"
                  placeholder="Search departments or HoDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              {/* Level Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                {(['ALL', ...activeLevels] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl as any)}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      levelFilter === lvl
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl === 'ALL'
                      ? 'All Levels'
                      : lvl === 'PRIMARY'
                      ? 'Primary'
                      : lvl === 'O_LEVEL'
                      ? 'O-Level'
                      : 'A-Level'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Departments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                <span className="text-xs">Loading academic departments...</span>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900">No departments found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  {departments.length === 0
                    ? 'No academic departments created yet. Group teachers and subjects by clicking "Create Department".'
                    : 'No departments match your search criteria.'}
                </p>
                {departments.length === 0 && (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create Department
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table id="departments-table" className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Department Name</th>
                      <th className="py-3.5 px-4">Education Levels</th>
                      <th className="py-3.5 px-4">Head of Department (HoD)</th>
                      <th className="py-3.5 px-4">Associated Subjects</th>
                      <th className="py-3.5 px-4 text-center">Number of Teachers</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDepartments.map((dept) => {
                      const deptTeachers = teachers.filter((t) => t.academicDepartmentId === dept.id);
                      const teacherCount = deptTeachers.length > 0 ? deptTeachers.length : (dept.teacherCount ?? dept._count?.teachers ?? 0);
                      const hod = dept.hod;
                      const isExpanded = expandedDeptId === dept.id;

                      return (
                        <React.Fragment key={dept.id}>
                          <tr
                            id={`department-row-${dept.id}`}
                            className="hover:bg-slate-50/75 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                                {dept.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-brand-600 shrink-0" />
                                <span>{dept.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(dept.educationLevels && dept.educationLevels.length > 0
                                  ? dept.educationLevels
                                  : Array.from(new Set(dept.subjects?.map((s) => s.level || 'O_LEVEL') || []))
                                ).map((lvl) => (
                                  <span
                                    key={lvl}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      lvl === 'PRIMARY'
                                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                        : lvl === 'A_LEVEL'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {lvl === 'PRIMARY' ? 'Primary' : lvl === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {hod ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingTeacher(hod as Teacher)}
                                  className="flex items-center gap-2.5 text-left group hover:opacity-80 transition cursor-pointer"
                                  title="View HoD profile and teaching load"
                                >
                                  <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs group-hover:bg-brand-200 transition">
                                    {hod.firstName?.charAt(0) || 'H'}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-slate-900 text-xs group-hover:text-brand-600 transition hover:underline">
                                      {hod.firstName} {hod.lastName}
                                    </div>
                                    <div className="text-[11px] text-slate-500">{hod.email}</div>
                                  </div>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertCircle className="w-3 h-3" />
                                  No HoD Appointed
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              {dept.subjects && dept.subjects.length > 0 ? (
                                <div className="flex flex-row flex-wrap items-center gap-1">
                                  {dept.subjects
                                    .slice(0, expandedSubjectDeptId === dept.id ? dept.subjects.length : 3)
                                    .map((sub) => (
                                    <span
                                      key={sub.id}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs leading-4 font-medium bg-brand-50 text-brand-700 border border-brand-200"
                                      title={`${sub.code} ${sub.name}`}
                                    >
                                      <span className="font-mono font-bold">{sub.code}</span>
                                      <span>{sub.name}</span>
                                    </span>
                                  ))}
                                  {dept.subjects.length > 3 && (
                                    <button
                                      type="button"
                                      aria-expanded={expandedSubjectDeptId === dept.id}
                                      onClick={() => setExpandedSubjectDeptId(
                                        expandedSubjectDeptId === dept.id ? null : dept.id
                                      )}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs leading-4 font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                                      title={dept.subjects.slice(3).map((sub) => `${sub.code} ${sub.name}`).join(', ')}
                                    >
                                      {expandedSubjectDeptId === dept.id ? 'Show less' : `+${dept.subjects.length - 3} more`}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertCircle className="w-3 h-3 text-amber-500" />
                                  No subjects assigned
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
                                title="Click to view assigned faculty members"
                              >
                                <Users className="w-3 h-3 text-slate-500" />
                                <span>{teacherCount} {teacherCount === 1 ? 'Teacher' : 'Teachers'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignTeachersModal(dept)}
                                  className="px-2.5 py-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded hover:bg-brand-100 transition cursor-pointer"
                                  title="Assign or view teachers"
                                >
                                  Assign Teachers
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(dept)}
                                  className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Edit department"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDepartmentToDelete(dept)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Delete department"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Department Teachers Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={7} className="px-6 py-4">
                                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-brand-600" />
                                      <span className="font-bold text-xs text-slate-900">
                                        Assigned Faculty in {dept.name} ({deptTeachers.length})
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500">
                                      Automatically determined through teaching subjects (Rule A &amp; B)
                                    </span>
                                  </div>

                                  {deptTeachers.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">
                                      No teachers currently assigned to this department. Teachers are automatically placed into {dept.name} when allocated subjects that belong to this department.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                      {deptTeachers.map((t) => {
                                        const tSubs = teacherSubjectMap.get(t.id) || [];
                                        const desig = t.designation || t.staffProfile?.jobTitle || (t.role === 'TEACHER' ? 'Teacher' : t.role ? t.role.replace(/_/g, ' ') : 'Teacher');
                                        return (
                                          <div
                                            key={t.id}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition flex flex-col justify-between"
                                          >
                                            <div>
                                              <div className="flex items-center justify-between">
                                                <span className="font-semibold text-xs text-slate-900">
                                                  {t.firstName} {t.lastName}
                                                </span>
                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200/70 text-slate-700">
                                                  {desig}
                                                </span>
                                              </div>
                                              <div className="text-[11px] text-slate-400 truncate mt-0.5">{t.email}</div>
                                              {tSubs.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                  {tSubs.map((s) => (
                                                    <span
                                                      key={s.id}
                                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
                                                      title={s.name}
                                                    >
                                                      <span className="font-mono font-bold">{s.code}</span>
                                                      <span>{s.name}</span>
                                                    </span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => setViewingTeacher(t)}
                                              className="mt-3 text-right text-xs font-semibold text-brand-600 hover:text-brand-800 transition cursor-pointer"
                                            >
                                              View / Edit Subjects →
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* FACULTY ALLOCATION & RECONCILIATION TAB */
        <div id="faculty-reconciliation-panel" className="space-y-4">
          {/* Informational Guidance Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
              <Briefcase className="w-4 h-4 text-blue-700" />
              <span>Academic Department Allocation &amp; Reconciliation Center</span>
            </div>
            <p className="text-blue-800 leading-relaxed">
              In Mkoko SchoolOS, teachers are assigned to academic departments automatically through their teaching subjects (<strong>Rule A</strong>: 1 department per teacher, <strong>Rule B</strong>: Subject determines department). When an authorized Headmaster or Admin assigns subjects to a teacher, the system automatically assigns the corresponding academic department. Teachers with legacy subject assignments spanning multiple departments are flagged below for administrative reconciliation.
            </p>
          </div>

          {/* Sub-tabs and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                type="button"
                id="recon-filter-conflict"
                onClick={() => setReconFilter('CONFLICT')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer inline-flex items-center gap-1.5 ${
                  reconFilter === 'CONFLICT'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Requires Reconciliation ({reconciliationReport?.conflictingTeachers?.length ?? conflictCount})</span>
              </button>

              <button
                type="button"
                id="recon-filter-unassigned"
                onClick={() => setReconFilter('UNASSIGNED')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer inline-flex items-center gap-1.5 ${
                  reconFilter === 'UNASSIGNED'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Unassigned Faculty ({reconciliationReport?.unassignedTeachers?.length ?? 0})</span>
              </button>

              <button
                type="button"
                id="recon-filter-valid"
                onClick={() => setReconFilter('VALID')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer inline-flex items-center gap-1.5 ${
                  reconFilter === 'VALID'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Valid Memberships ({reconciliationReport?.validTeachers?.length ?? 0})</span>
              </button>

              <button
                type="button"
                id="recon-filter-all"
                onClick={() => setReconFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  reconFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Faculty ({teachers.length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="recon-search-input"
                type="text"
                placeholder="Search faculty by name or email..."
                value={reconSearch}
                onChange={(e) => setReconSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {(() => {
              const allItems: any[] = [];
              if (reconciliationReport) {
                if (reconciliationReport.conflictingTeachers) {
                  allItems.push(...reconciliationReport.conflictingTeachers.map((t: any) => ({ ...t, status: 'CONFLICT' })));
                }
                if (reconciliationReport.unassignedTeachers) {
                  allItems.push(...reconciliationReport.unassignedTeachers.map((t: any) => ({ ...t, status: 'UNASSIGNED' })));
                }
                if (reconciliationReport.validTeachers) {
                  allItems.push(...reconciliationReport.validTeachers.map((t: any) => ({ ...t, status: 'VALID' })));
                }
              } else {
                teachers.forEach((t) => {
                  const subs = teacherSubjectMap.get(t.id) || [];
                  const deptIds = Array.from(new Set(subs.map((s) => s.departmentId).filter(Boolean)));
                  const deptNames = Array.from(
                    new Set(
                      subs
                        .map((s) => {
                          if (s.departmentId) {
                            const d = departments.find((dept) => dept.id === s.departmentId);
                            return d?.name || 'Department';
                          }
                          return null;
                        })
                        .filter(Boolean)
                    )
                  );
                  let st: 'VALID' | 'CONFLICT' | 'UNASSIGNED' = 'VALID';
                  if (subs.length === 0) st = 'UNASSIGNED';
                  else if (deptIds.length > 1) st = 'CONFLICT';

                  allItems.push({
                    id: t.id,
                    name: `${t.firstName} ${t.lastName}`,
                    email: t.email,
                    role: t.role,
                    currentDepartment: t.academicDepartment?.name || null,
                    currentDepartmentId: t.academicDepartmentId,
                    status: st,
                    conflictingDepartments: deptNames,
                    conflictingSubjects: subs,
                    subjects: subs,
                  });
                });
              }

              let items = allItems;
              if (reconFilter !== 'ALL') {
                items = items.filter((i) => i.status === reconFilter);
              }
              if (reconSearch.trim()) {
                const q = reconSearch.toLowerCase().trim();
                items = items.filter(
                  (i) =>
                    i.name?.toLowerCase().includes(q) ||
                    i.email?.toLowerCase().includes(q) ||
                    i.role?.toLowerCase().includes(q) ||
                    i.conflictingDepartments?.some((d: string) => d.toLowerCase().includes(q))
                );
              }

              if (items.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-800">No records found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reconFilter === 'CONFLICT'
                        ? 'There are no conflicting teacher subject assignments! All teachers are properly aligned with single academic departments.'
                        : 'No faculty records match the selected filter.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table id="reconciliation-table" className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                        <th className="py-3 px-4">Faculty Member</th>
                        <th className="py-3 px-4">Role / Title</th>
                        <th className="py-3 px-4">Department Status</th>
                        <th className="py-3 px-4">Assigned / Conflicting Subjects</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const originalTeacher = teachers.find((t) => t.id === item.id) || item;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{item.name}</div>
                              <div className="text-[11px] text-slate-400">{item.email}</div>
                              {item.hodOf && item.hodOf.length > 0 && (
                                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                                  HoD: {item.hodOf.join(', ')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {item.role ? item.role.replace(/_/g, ' ') : 'Teacher'}
                            </td>
                            <td className="py-3 px-4">
                              {item.status === 'CONFLICT' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Conflict ({item.conflictingDepartments?.join(', ')})</span>
                                </span>
                              ) : item.status === 'UNASSIGNED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Unassigned
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{item.resolvedDepartment || item.currentDepartment || 'Assigned'}</span>
                                </span>
                              )}
                              {item.warnings?.map((warning: string) => (
                                <p key={warning} className="mt-1 max-w-xs text-[10px] text-amber-700" title={warning}>
                                  {warning}
                                </p>
                              ))}
                            </td>
                            <td className="py-3 px-4 max-w-sm">
                              {item.status === 'CONFLICT' && item.conflictingSubjects ? (
                                <div className="space-y-1">
                                  <div className="text-[11px] text-amber-900 font-medium">
                                    Subjects belong to: <strong>{item.conflictingDepartments?.join(', ')}</strong>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {item.conflictingSubjects.map((s: any) => (
                                      <span
                                        key={s.id || s.code}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white text-slate-800 border border-slate-200"
                                      >
                                        <span className="font-mono text-brand-600 font-bold">{s.code}</span>
                                        <span>{s.name}</span>
                                        {s.departmentName && (
                                          <span className="text-[9px] text-slate-400 font-normal">
                                            ({s.departmentName})
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : item.status === 'UNASSIGNED' ? (
                                <span className="text-slate-400 italic text-[11px]">
                                  No active teaching subjects assigned in this school
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {(item.subjects || []).map((s: any) => (
                                    <span
                                      key={s.id || s.code}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
                                    >
                                      <span className="font-mono font-bold">{s.code}</span>
                                      <span>{s.name}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setViewingTeacher(originalTeacher as Teacher)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer inline-flex items-center gap-1.5 ${
                                  item.status === 'CONFLICT'
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                    : item.status === 'UNASSIGNED'
                                    ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {item.status === 'CONFLICT' ? (
                                  <>
                                    <Edit2 className="w-3 h-3" />
                                    <span>Reconcile Subjects</span>
                                  </>
                                ) : item.status === 'UNASSIGNED' ? (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    <span>Allocate Subjects</span>
                                  </>
                                ) : (
                                  <>
                                    <Edit2 className="w-3 h-3" />
                                    <span>Manage</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/75 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Academic Department</h3>
                  <p className="text-xs text-slate-500">
                    Define department details and assign curriculum subjects
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateDepartment} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Department Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="department-name-input"
                    type="text"
                    required
                    placeholder="e.g. Science Department, Languages, Mathematics"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Code and HoD 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="department-code-input"
                      type="text"
                      placeholder="e.g. SCI, LANG"
                      value={departmentCode}
                      onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Head of Department (HoD)
                    </label>
                    <select
                      id="department-hod-select"
                      value={departmentHodId}
                      onChange={(e) => setDepartmentHodId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">-- No HoD Appointed --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Associated Curriculum Subjects with Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Associated Curriculum Subjects
                    </label>
                    <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      {selectedSubjectIds.length} selected
                    </span>
                  </div>

                  {/* Level Tabs */}
                  <div className="flex items-center gap-1 mb-2 border-b border-slate-100 pb-1.5 text-[11px]">
                    {(['ALL', 'PRIMARY', 'O_LEVEL', 'A_LEVEL'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormLevelFilter(lvl)}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                          formLevelFilter === lvl
                            ? 'bg-brand-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {lvl === 'ALL' ? 'All Levels' : lvl === 'PRIMARY' ? 'Primary' : lvl === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                      </button>
                    ))}
                  </div>

                  {/* Search Filter */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter subjects by code or name..."
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* Selected Chips */}
                  {selectedSubjectIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      {selectedSubjectIds.map((sId) => {
                        const sub = availableSubjects.find((s) => s.id === sId);
                        if (!sub) return null;
                        return (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
                          >
                            <span className="font-mono font-bold">{sub.code}</span>
                            <span>{sub.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleSubjectSelection(sub.id)}
                              className="text-brand-500 hover:text-brand-700 ml-0.5 cursor-pointer"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Loading / Error / Subject List */}
                  {loadingSubjects ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-1.5 border border-slate-200 rounded-lg bg-slate-50/50">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span className="text-[11px]">Loading subjects from registry...</span>
                    </div>
                  ) : subjectsError ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
                      <span>{subjectsError}</span>
                      <button
                        type="button"
                        onClick={fetchSubjects}
                        className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold text-[11px]"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50">
                      {filteredAvailableSubjects.length === 0 ? (
                        <div className="text-xs text-slate-400 text-center py-4">
                          {availableSubjects.length === 0 ? 'No subjects registered yet' : 'No subjects match your filter'}
                        </div>
                      ) : (
                        filteredAvailableSubjects.map((sub) => {
                          const isChecked = selectedSubjectIds.includes(sub.id);
                          return (
                            <label
                              key={sub.id}
                              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition text-xs ${
                                isChecked
                                  ? 'bg-brand-50/70 text-brand-900 border border-brand-200'
                                  : 'hover:bg-white text-slate-700 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSubjectSelection(sub.id)}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                              <span className="font-semibold text-slate-900 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200/60">
                                {sub.code}
                              </span>
                              <span className="font-medium text-slate-800 flex-1 truncate">
                                {sub.name}
                              </span>
                              {sub.level && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                                  sub.level === 'PRIMARY'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : sub.level === 'A_LEVEL'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                  {sub.level === 'PRIMARY' ? 'Primary' : sub.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                                </span>
                              )}
                              {sub.category && (
                                <span className="text-[10px] text-slate-400">{sub.category}</span>
                              )}
                              {sub.departmentId && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200" title="Assigned to another department">
                                  In: {departments.find(d => d.id === sub.departmentId)?.name || 'Other Dept'}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/75 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-department"
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Department</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/75 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Academic Department</h3>
                  <p className="text-xs text-slate-500">
                    Update department details and associated curriculum subjects
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateDepartment} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Department Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-department-name-input"
                    type="text"
                    required
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Code and HoD 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-department-code-input"
                      type="text"
                      required
                      value={departmentCode}
                      onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Head of Department (HoD)
                    </label>
                    <select
                      id="edit-department-hod-select"
                      value={departmentHodId}
                      onChange={(e) => setDepartmentHodId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">-- No HoD Appointed --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Associated Curriculum Subjects with Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Associated Curriculum Subjects
                    </label>
                    <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      {selectedSubjectIds.length} selected
                    </span>
                  </div>

                  {/* Level Tabs */}
                  <div className="flex items-center gap-1 mb-2 border-b border-slate-100 pb-1.5 text-[11px]">
                    {(['ALL', 'PRIMARY', 'O_LEVEL', 'A_LEVEL'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormLevelFilter(lvl)}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                          formLevelFilter === lvl
                            ? 'bg-brand-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {lvl === 'ALL' ? 'All Levels' : lvl === 'PRIMARY' ? 'Primary' : lvl === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                      </button>
                    ))}
                  </div>

                  {/* Search Filter */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter subjects by code or name..."
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* Selected Chips */}
                  {selectedSubjectIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      {selectedSubjectIds.map((sId) => {
                        const sub = availableSubjects.find((s) => s.id === sId);
                        if (!sub) return null;
                        return (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
                          >
                            <span className="font-mono font-bold">{sub.code}</span>
                            <span>{sub.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleSubjectSelection(sub.id)}
                              className="text-brand-500 hover:text-brand-700 ml-0.5 cursor-pointer"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Loading / Error / Subject List */}
                  {loadingSubjects ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-1.5 border border-slate-200 rounded-lg bg-slate-50/50">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span className="text-[11px]">Loading subjects from registry...</span>
                    </div>
                  ) : subjectsError ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
                      <span>{subjectsError}</span>
                      <button
                        type="button"
                        onClick={fetchSubjects}
                        className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold text-[11px]"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50">
                      {filteredAvailableSubjects.length === 0 ? (
                        <div className="text-xs text-slate-400 text-center py-4">
                          {availableSubjects.length === 0 ? 'No subjects registered yet' : 'No subjects match your filter'}
                        </div>
                      ) : (
                        filteredAvailableSubjects.map((sub) => {
                          const isChecked = selectedSubjectIds.includes(sub.id);
                          return (
                            <label
                              key={sub.id}
                              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition text-xs ${
                                isChecked
                                  ? 'bg-brand-50/70 text-brand-900 border border-brand-200'
                                  : 'hover:bg-white text-slate-700 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSubjectSelection(sub.id)}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                              <span className="font-semibold text-slate-900 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200/60">
                                {sub.code}
                              </span>
                              <span className="font-medium text-slate-800 flex-1 truncate">
                                {sub.name}
                              </span>
                              {sub.level && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                                  sub.level === 'PRIMARY'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : sub.level === 'A_LEVEL'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                  {sub.level === 'PRIMARY' ? 'Primary' : sub.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                                </span>
                              )}
                              {sub.category && (
                                <span className="text-[10px] text-slate-400">{sub.category}</span>
                              )}
                              {sub.departmentId && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200" title="Assigned to another department">
                                  In: {departments.find(d => d.id === sub.departmentId)?.name || 'Other Dept'}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/75 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-edit-department"
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TEACHERS MODAL */}
      {isAssignTeachersModalOpen && assigningDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/75 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Assign Teachers to {assigningDepartment.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Department Code: <span className="font-mono font-semibold">{assigningDepartment.code}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignTeachersModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTeacherAssignments} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">
                  Select eligible teachers to assign to this department. Teachers are eligible based on their actual teaching-subject assignments configured for this department.
                </p>

                {/* Department Subjects Preview */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                    <span>Curriculum Subjects in {assigningDepartment.name} ({assigningDeptSubjects.length})</span>
                  </div>
                  {assigningDeptSubjects.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px]">No subjects configured yet</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {assigningDeptSubjects.map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-800 border border-slate-200"
                        >
                          <span className="font-mono font-bold text-brand-600">{sub.code}</span>
                          <span>{sub.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* If Department has NO subjects configured: Requirement 2.7 */}
                {assigningDeptSubjectIdSet.size === 0 ? (
                  <div
                    id="dept-no-subjects-alert"
                    className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-0.5">
                        Add subjects to this department before assigning teachers
                      </h4>
                      <p className="text-amber-700 leading-relaxed">
                        Teachers are assigned to departments based on the subjects they teach. Since this department has no configured subjects, no teachers can be assigned yet.
                      </p>
                    </div>
                  </div>
                ) : eligibleTeachers.length === 0 ? (
                  /* Requirement 2.8: If no eligible teachers are found, show empty state */
                  <div
                    id="no-eligible-teachers-empty"
                    className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50"
                  >
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-900">No eligible teachers found</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Teachers need to be assigned to teach subjects belonging to this department (
                      {assigningDeptSubjects.map((s) => s.name).join(', ')}) before they can be added to this department.
                    </p>

                    {ineligibleTeachers.length > 0 && (
                      <div className="mt-3 text-left">
                        <button
                          type="button"
                          onClick={() => setShowIneligible(!showIneligible)}
                          className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-800 transition py-1 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            <span>{`View Ineligible Teachers (${ineligibleTeachers.length})`}</span>
                          </span>
                          <span className="text-[11px] text-brand-600 font-medium">
                            {showIneligible ? 'Hide details' : 'Show reasons'}
                          </span>
                        </button>
                        {showIneligible && (
                          <div id="ineligible-teachers-list" className="mt-2 max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-100/60 rounded-xl border border-slate-200 text-xs">
                            {ineligibleTeachers.map(({ teacher: t, reason }) => (
                              <div key={t.id} className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div>
                                  <span className="font-semibold text-slate-800">{t.firstName} {t.lastName}</span>
                                  <span className="text-[11px] text-slate-400 ml-1.5">({t.email})</span>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                  {reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Requirement 2.3 & 2.9: Display eligible teachers with name & relevant assigned subjects */
                  <div id="eligible-teachers-list" className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <span>Eligible Teachers ({eligibleTeachers.length})</span>
                      <span>{selectedTeacherIds.filter((id) => eligibleTeachers.some((t) => t.id === id)).length} selected</span>
                    </div>

                    {/* Teacher Search */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search eligible teachers by name or email..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-2 bg-slate-50/50">
                      {eligibleTeachers
                        .filter((t) => {
                          if (!teacherSearch.trim()) return true;
                          const q = teacherSearch.toLowerCase().trim();
                          return (
                            t.firstName.toLowerCase().includes(q) ||
                            t.lastName.toLowerCase().includes(q) ||
                            (t.email && t.email.toLowerCase().includes(q))
                          );
                        })
                        .map((t) => {
                        const isChecked = selectedTeacherIds.includes(t.id);
                        const assignedDeptSubjects = (teacherSubjectMap.get(t.id) || []).filter((s) =>
                          assigningDeptSubjectIdSet.has(s.id)
                        );
                        const desig = t.designation || t.staffProfile?.jobTitle || (t.role === 'TEACHER' ? 'Teacher' : t.role ? t.role.replace(/_/g, ' ') : 'Teacher');

                        return (
                          <label
                            key={t.id}
                            className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition border text-xs ${
                              isChecked
                                ? 'bg-brand-50/70 border-brand-300 shadow-2xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTeacherSelection(t.id)}
                              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-900">
                                    {t.firstName} {t.lastName}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                    {desig}
                                  </span>
                                  {t.teachingLevels && t.teachingLevels.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {t.teachingLevels.map((lvl) => (
                                        <span
                                          key={lvl}
                                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                                            lvl === 'PRIMARY'
                                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                                              : lvl === 'A_LEVEL'
                                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                                              : 'bg-blue-50 text-blue-800 border-blue-200'
                                          }`}
                                        >
                                          {lvl === 'PRIMARY' ? 'Pri' : lvl === 'A_LEVEL' ? 'A-Lvl' : 'O-Lvl'}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400">{t.email}</span>
                              </div>

                              {/* Requirement 2.9: Display each eligible teacher's relevant assigned subjects */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] text-slate-500 font-medium">Teaching:</span>
                                {assignedDeptSubjects.map((s) => (
                                  <span
                                    key={s.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100/70 text-brand-800 border border-brand-200"
                                    title={s.name}
                                  >
                                    <span className="font-mono">{s.code}</span>
                                    <span>{s.name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Ineligible Teachers Collapsible List */}
                    {ineligibleTeachers.length > 0 && (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowIneligible(!showIneligible)}
                          className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-800 transition py-1 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            <span>{`Ineligible Teachers (${ineligibleTeachers.length})`}</span>
                          </span>
                          <span className="text-[11px] text-brand-600 font-medium">
                            {showIneligible ? 'Hide details' : 'Show details & reasons'}
                          </span>
                        </button>

                        {showIneligible && (
                          <div id="ineligible-teachers-list" className="mt-2 max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-100/60 rounded-xl border border-slate-200 text-xs">
                            {ineligibleTeachers.map(({ teacher: t, reason }) => (
                              <div key={t.id} className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div>
                                  <span className="font-semibold text-slate-800">{t.firstName} {t.lastName}</span>
                                  <span className="text-[11px] text-slate-400 ml-1.5">({t.email})</span>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                  {reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fixed Modal Footer */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/75 shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedTeacherIds.filter((id) => eligibleTeachers.some((t) => t.id === id)).length} of {eligibleTeachers.length} eligible selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAssignTeachersModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || assigningDeptSubjectIdSet.size === 0}
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Department Members</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {departmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Department</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the{' '}
              <span className="font-semibold text-slate-900">{departmentToDelete.name}</span> ({departmentToDelete.code})?
              Teachers currently assigned to this department will be unassigned, but their user profiles and class allocations will remain intact.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDepartmentToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      <TeacherDetailsModal
        isOpen={Boolean(viewingTeacher)}
        onClose={() => setViewingTeacher(null)}
        teacherId={viewingTeacher?.id}
        initialTeacher={viewingTeacher}
      />
    </div>
  );
};
