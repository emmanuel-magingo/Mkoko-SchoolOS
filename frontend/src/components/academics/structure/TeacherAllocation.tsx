import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  UserCheck,
  UserPlus,
  RefreshCw,
  X,
  Layers,
  Building2,
  Briefcase,
} from 'lucide-react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { AcademicsApi } from '../../../api/academics.api';
import { Subject, Teacher, TeacherAssignment, AcademicDepartment } from '../../../types/academics.types';
import { isSubjectApplicableToClass } from '../../../utils/education-level.utils';
import { TeacherDetailsModal } from './TeacherDetailsModal';

interface AcademicClass {
  id: string;
  name: string;
  level: string;
  stream: string;
}

interface TeacherAllocationProps {
  initialClasses?: AcademicClass[];
  initialSubjects?: Subject[];
  initialTeachers?: Teacher[];
  initialAssignments?: TeacherAssignment[];
}

export const TeacherAllocation: React.FC<TeacherAllocationProps> = ({
  initialClasses,
  initialSubjects,
  initialTeachers,
  initialAssignments,
}) => {
  const { selectedSchool } = useAcademicContext();
  const [searchParams] = useSearchParams();
  const requestedTeacherId = searchParams.get('teacherId');

  const [classes, setClasses] = useState<AcademicClass[]>(initialClasses || []);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects || []);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers || []);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(initialAssignments || []);

  const [loading, setLoading] = useState<boolean>(
    !initialClasses && !initialSubjects && !initialTeachers && !initialAssignments
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tab View
  const [activeTab, setActiveTab] = useState<'BY_CLASS' | 'BY_TEACHER'>('BY_CLASS');

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClasses && initialClasses[0] ? initialClasses[0].id : ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    initialTeachers && initialTeachers[0] ? initialTeachers[0].id : ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Assignment Modal Form Fields
  const [modalClassId, setModalClassId] = useState<string>('');
  const [modalSubjectId, setModalSubjectId] = useState<string>('');
  const [modalTeacherId, setModalTeacherId] = useState<string>('');

  // Add Teacher Modal Form Fields
  const [teacherFirstName, setTeacherFirstName] = useState<string>('');
  const [teacherLastName, setTeacherLastName] = useState<string>('');
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<string[]>([]);

  // Department state & modal
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [isChangeDeptModalOpen, setIsChangeDeptModalOpen] = useState<boolean>(false);
  const [changingTeacher, setChangingTeacher] = useState<Teacher | null>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('');
  const [editTeacherSubjectIds, setEditTeacherSubjectIds] = useState<string[]>([]);

  // Teacher details modal
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    if (!requestedTeacherId) return;
    const requestedTeacher = teachers.find((teacher) => teacher.id === requestedTeacherId);
    if (requestedTeacher) {
      setSelectedTeacherId(requestedTeacher.id);
      setViewingTeacher(requestedTeacher);
    }
  }, [requestedTeacherId, teachers]);

  // Auto-determine Department for Add Teacher Modal
  const addTeacherDeptAnalysis = useMemo(() => {
    if (teacherSubjectIds.length === 0) {
      return {
        status: 'PENDING' as const,
        department: null,
        message: 'Department Pending (No teaching subjects selected)',
        conflicts: [],
      };
    }

    const selectedSubs = subjects.filter((s) => teacherSubjectIds.includes(s.id));
    const deptIds = Array.from(new Set(selectedSubs.map((s) => s.departmentId).filter(Boolean))) as string[];

    if (deptIds.length === 0) {
      return {
        status: 'PENDING' as const,
        department: null,
        message: 'Department Pending (Selected subjects have no department configured)',
        conflicts: [],
      };
    }

    if (deptIds.length === 1) {
      const dept = departments.find((d) => d.id === deptIds[0]) || null;
      return {
        status: 'RESOLVED' as const,
        department: dept,
        message: dept ? `Assigned Department: ${dept.name} (${dept.code})` : 'Department Assigned',
        conflicts: [],
      };
    }

    const conflictDepts = deptIds.map(
      (id) => departments.find((d) => d.id === id)?.name || id
    );

    return {
      status: 'CONFLICT' as const,
      department: null,
      message: `Cross-Department Conflict: Selected subjects span multiple departments (${conflictDepts.join(', ')}). A teacher can belong to at most ONE academic department.`,
      conflicts: conflictDepts,
    };
  }, [teacherSubjectIds, subjects, departments]);

  // Auto-determine Department for Edit Teacher Modal
  const editTeacherDeptAnalysis = useMemo(() => {
    if (editTeacherSubjectIds.length === 0) {
      return {
        status: 'PENDING' as const,
        department: null,
        message: 'Department Pending (No teaching subjects selected)',
        conflicts: [],
      };
    }

    const selectedSubs = subjects.filter((s) => editTeacherSubjectIds.includes(s.id));
    const deptIds = Array.from(new Set(selectedSubs.map((s) => s.departmentId).filter(Boolean))) as string[];

    if (deptIds.length === 0) {
      return {
        status: 'PENDING' as const,
        department: null,
        message: 'Department Pending (Selected subjects have no department configured)',
        conflicts: [],
      };
    }

    if (deptIds.length === 1) {
      const dept = departments.find((d) => d.id === deptIds[0]) || null;
      return {
        status: 'RESOLVED' as const,
        department: dept,
        message: dept ? `Assigned Department: ${dept.name} (${dept.code})` : 'Department Assigned',
        conflicts: [],
      };
    }

    const conflictDepts = deptIds.map(
      (id) => departments.find((d) => d.id === id)?.name || id
    );

    return {
      status: 'CONFLICT' as const,
      department: null,
      message: `Cross-Department Conflict: Selected subjects span multiple departments (${conflictDepts.join(', ')}). A teacher can belong to at most ONE academic department.`,
      conflicts: conflictDepts,
    };
  }, [editTeacherSubjectIds, subjects, departments]);

  // Modal Context-Aware Subject & Teacher Compatibility Filtering
  const selectedModalClass = useMemo(() => {
    return classes.find((c) => c.id === modalClassId) || null;
  }, [classes, modalClassId]);

  const modalEligibleSubjects = useMemo(() => {
    if (!selectedModalClass) return subjects;
    return subjects.filter((s) => isSubjectApplicableToClass(s, selectedModalClass));
  }, [selectedModalClass, subjects]);

  const selectedModalTeacher = useMemo(() => {
    return teachers.find((t) => t.id === modalTeacherId) || null;
  }, [teachers, modalTeacherId]);

  const availableSubjectsForModal = useMemo(() => {
    if (!selectedModalTeacher) return modalEligibleSubjects;
    const qIds = (selectedModalTeacher.qualifications || []).map((q) => q.id);
    const sIds = selectedModalTeacher.subjectIds || [];
    const allIds = new Set([...qIds, ...sIds]);
    if (allIds.size === 0) return [];
    return modalEligibleSubjects.filter((s) => allIds.has(s.id));
  }, [modalEligibleSubjects, selectedModalTeacher]);

  const selectedModalSubject = useMemo(() => {
    return subjects.find((s) => s.id === modalSubjectId) || null;
  }, [subjects, modalSubjectId]);

  const eligibleTeachersForModal = useMemo(() => {
    if (!modalSubjectId) return teachers;
    return teachers.filter((t) => {
      const qIds = (t.qualifications || []).map((q) => q.id);
      const sIds = t.subjectIds || [];
      const allIds = new Set([...qIds, ...sIds]);
      return allIds.has(modalSubjectId);
    });
  }, [modalSubjectId, teachers]);

  const ineligibleTeachersForModal = useMemo(() => {
    if (!modalSubjectId) return [];
    return teachers.filter((t) => {
      const qIds = (t.qualifications || []).map((q) => q.id);
      const sIds = t.subjectIds || [];
      const allIds = new Set([...qIds, ...sIds]);
      return !allIds.has(modalSubjectId);
    });
  }, [modalSubjectId, teachers]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, subjectsRes, teachersRes, assignmentsRes, deptsRes] = await Promise.all([
        AcademicsApi.getClasses().catch(() => ({ data: [] })),
        AcademicsApi.getSubjects().catch(() => ({ data: [] })),
        AcademicsApi.getTeachers().catch(() => ({ data: [] })),
        AcademicsApi.getTeacherAssignments().catch(() => ({ data: [] })),
        AcademicsApi.getDepartments().catch(() => ({ data: [] })),
      ]);

      const loadedClasses: AcademicClass[] = Array.isArray(classesRes.data) ? classesRes.data : [];
      const loadedSubjects: Subject[] = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
      const loadedTeachers: Teacher[] = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      const loadedAssignments: TeacherAssignment[] = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
      const loadedDepts: AcademicDepartment[] = Array.isArray(deptsRes.data) ? deptsRes.data : [];

      setClasses(loadedClasses);
      setSubjects(loadedSubjects);
      setTeachers(loadedTeachers);
      setAssignments(loadedAssignments);
      setDepartments(loadedDepts);

      // Default selection if not already chosen
      if (loadedClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(loadedClasses[0].id);
      }
      if (loadedTeachers.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(loadedTeachers[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize teacher allocation data.');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedTeacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Assign Modal with optional preset context
  const handleOpenAssignModal = (presetClassId?: string, presetSubjectId?: string, presetTeacherId?: string) => {
    const targetClassId = presetClassId || selectedClassId || (classes[0]?.id || '');
    setModalClassId(targetClassId);
    setModalSubjectId(presetSubjectId || '');
    setModalTeacherId(presetTeacherId || '');
    setModalError(null);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setModalError(null);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalClassId) {
      setModalError('Please select a target class.');
      return;
    }
    if (!modalSubjectId) {
      setModalError('Please select a valid subject.');
      return;
    }
    if (!modalTeacherId) {
      setModalError('Please select a teacher to allocate.');
      return;
    }

    // Check if assignment already exists
    const existing = assignments.find(
      (a) => a.classId === modalClassId && a.subjectId === modalSubjectId && a.teacherId === modalTeacherId
    );
    if (existing) {
      setModalError('This teacher is already assigned to this subject and class.');
      return;
    }

    // Check teacher and subject department compatibility
    const selectedT = teachers.find((t) => t.id === modalTeacherId);
    const selectedS = subjects.find((s) => s.id === modalSubjectId);
    if (
      selectedT?.academicDepartmentId &&
      selectedS?.departmentId &&
      selectedT.academicDepartmentId !== selectedS.departmentId
    ) {
      const tDept = departments.find((d) => d.id === selectedT.academicDepartmentId);
      const sDept = departments.find((d) => d.id === selectedS.departmentId);
      setModalError(
        `Teacher ${selectedT.firstName} ${selectedT.lastName} belongs to the ${tDept?.name || 'different'} department, but "${selectedS.name}" is in the ${sDept?.name || 'different'} department. Each teacher can belong to at most ONE academic department.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await AcademicsApi.assignTeacher({
        classId: modalClassId,
        subjectId: modalSubjectId,
        teacherId: modalTeacherId,
      });

      const assignedClass = classes.find((c) => c.id === modalClassId);
      const assignedSubject = subjects.find((s) => s.id === modalSubjectId);
      const assignedTeacher = teachers.find((t) => t.id === modalTeacherId);

      const enriched: TeacherAssignment = {
        ...res.data,
        class: assignedClass ? { id: assignedClass.id, name: assignedClass.name, level: assignedClass.level, stream: assignedClass.stream } : undefined,
        subject: assignedSubject ? { id: assignedSubject.id, name: assignedSubject.name, code: assignedSubject.code } : undefined,
        teacher: assignedTeacher ? { id: assignedTeacher.id, firstName: assignedTeacher.firstName, lastName: assignedTeacher.lastName, email: assignedTeacher.email } : undefined,
      };

      // Optimistically replace if same class & subject had someone else, or add new
      setAssignments((prev) => {
        const filtered = prev.filter((a) => !(a.classId === modalClassId && a.subjectId === modalSubjectId));
        return [enriched, ...filtered];
      });

      // Refetch assignments from backend API so state is 100% synchronized and immediately reflects assigned teacher
      try {
        const refetchRes = await AcademicsApi.getTeacherAssignments();
        if (Array.isArray(refetchRes?.data)) {
          setAssignments(refetchRes.data);
        }
      } catch {
        // retain optimistic state if offline or test environment
      }

      setSuccessMessage(`Assigned ${assignedTeacher?.firstName || 'Teacher'} to ${assignedSubject?.name || 'Subject'} for ${assignedClass?.name || 'Class'}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      handleCloseAssignModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to save teacher assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await AcademicsApi.deleteTeacherAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));

      try {
        const refetchRes = await AcademicsApi.getTeacherAssignments();
        if (Array.isArray(refetchRes?.data)) {
          setAssignments(refetchRes.data);
        }
      } catch {
        // retain optimistic state
      }

      setSuccessMessage('Teacher assignment removed successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete assignment.');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const fName = teacherFirstName.trim();
    const lName = teacherLastName.trim();
    const mail = teacherEmail.trim().toLowerCase();

    if (!fName || !lName || !mail) {
      setModalError('All fields (First name, Last name, and Email) are required.');
      return;
    }

    if (addTeacherDeptAnalysis.status === 'CONFLICT') {
      setModalError(addTeacherDeptAnalysis.message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await AcademicsApi.createTeacher({
        firstName: fName,
        lastName: lName,
        email: mail,
        subjectIds: teacherSubjectIds,
      });
      const createdTeacher = res.data;

      setTeachers((prev) => [...prev, createdTeacher].sort((a, b) => a.firstName.localeCompare(b.firstName)));
      setSelectedTeacherId(createdTeacher.id);
      setSuccessMessage(`Teacher ${fName} ${lName} registered successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);

      setTeacherFirstName('');
      setTeacherLastName('');
      setTeacherEmail('');
      setTeacherSubjectIds([]);
      setIsAddTeacherModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to register teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChangeDeptModal = (teacher: Teacher) => {
    setChangingTeacher(teacher);
    const teacherAssignments = assignments.filter((a) => a.teacherId === teacher.id);
    const assignedSubjectIds = Array.from(new Set(teacherAssignments.map((a) => a.subjectId)));
    setEditTeacherSubjectIds(assignedSubjectIds);
    setTargetDepartmentId(teacher.academicDepartmentId || '');
    setModalError(null);
    setIsChangeDeptModalOpen(true);
  };

  const handleSaveDepartmentChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingTeacher) return;

    if (editTeacherDeptAnalysis.status === 'CONFLICT') {
      setModalError(editTeacherDeptAnalysis.message);
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const resolvedDeptId =
        editTeacherDeptAnalysis.status === 'RESOLVED' && editTeacherDeptAnalysis.department
          ? editTeacherDeptAnalysis.department.id
          : (targetDepartmentId || null);

      const res = await AcademicsApi.updateTeacher(changingTeacher.id, {
        subjectIds: editTeacherSubjectIds,
        departmentId: resolvedDeptId,
      });

      const updated = res.data;
      setTeachers((prev) =>
        prev.map((t) => (t.id === changingTeacher.id ? { ...t, ...updated } : t))
      );

      setSuccessMessage(`Faculty details and department updated for ${changingTeacher.firstName} ${changingTeacher.lastName}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsChangeDeptModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to update teacher department.');
    } finally {
      setSubmitting(false);
    }
  };

  // Selected Class details
  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Selected Teacher details
  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  // Filtered Class Subject rows for "By Class" tab
  const classSubjectAllocations = useMemo(() => {
    if (!selectedClass) return [];
    
    // Strict curriculum filtering: only subjects applicable to the selected class
    const applicableSubjects = subjects.filter((s) => isSubjectApplicableToClass(s, selectedClass));

    return applicableSubjects.map((subject) => {
      const assignment = assignments.find(
        (a) => a.classId === selectedClass.id && a.subjectId === subject.id
      );

      const teacherObj = assignment
        ? teachers.find((t) => t.id === assignment.teacherId) || assignment.teacher
        : null;

      return {
        subject,
        assignment,
        teacher: teacherObj,
      };
    }).filter(({ subject }) => {
      if (!searchQuery) return true;
      return (
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [selectedClass, subjects, assignments, teachers, searchQuery]);

  // Filtered Assignments for "By Teacher" tab
  const teacherAllocations = useMemo(() => {
    if (!selectedTeacherId) return [];

    return assignments.filter((a) => a.teacherId === selectedTeacherId).map((a) => {
      const classObj = classes.find((c) => c.id === a.classId) || a.class;
      const subjectObj = subjects.find((s) => s.id === a.subjectId) || a.subject;
      return {
        assignment: a,
        class: classObj,
        subject: subjectObj,
      };
    }).filter(({ class: c, subject: s }) => {
      if (!searchQuery) return true;
      const matchClass = c ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const matchSubject = s ? (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase())) : false;
      return matchClass || matchSubject;
    });
  }, [selectedTeacherId, assignments, classes, subjects, searchQuery]);

  // Global KPIs
  const kpis = useMemo(() => {
    const totalAssignments = assignments.length;
    const activeTeachersWithAssignments = new Set(assignments.map((a) => a.teacherId)).size;
    const classesCovered = new Set(assignments.map((a) => a.classId)).size;
    return {
      totalAssignments,
      activeTeachersWithAssignments,
      totalTeachers: teachers.length,
      classesCovered,
      totalClasses: classes.length,
    };
  }, [assignments, teachers, classes]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <UserCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Teacher Allocation & Subject Matrix
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Allocate qualified teaching staff to specific subjects and class streams.
            {selectedSchool ? ` School: ${selectedSchool.name}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsAddTeacherModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <UserPlus className="w-4 h-4" />
            Add Teacher
          </button>
          <button
            type="button"
            onClick={() => handleOpenAssignModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Assign Teacher
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Compact KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 bg-brand-50 text-brand-600 rounded-md">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">{kpis.totalAssignments}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Allocations</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {kpis.activeTeachersWithAssignments} / {kpis.totalTeachers}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Active Teachers</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {kpis.classesCovered} / {kpis.totalClasses}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Classes Staffed</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">{subjects.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Available Subjects</div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('BY_CLASS')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'BY_CLASS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>By Class Allocation</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('BY_TEACHER')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'BY_TEACHER'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>By Teacher Workload</span>
        </button>
      </div>

      {/* Search and Secondary Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'BY_CLASS' ? 'Filter subjects...' : 'Filter assigned classes...'}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Tab-Specific Entity Selectors */}
        {activeTab === 'BY_CLASS' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Select Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {classes.length === 0 ? (
                <option value="">No classes registered</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level} - {cls.stream})
                  </option>
                ))
              )}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Select Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {teachers.length === 0 ? (
                <option value="">No teachers available</option>
              ) : (
                teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Areas */}
      {activeTab === 'BY_CLASS' ? (
        /* ======================== TAB: BY CLASS ======================== */
        <div className="space-y-4">
          {selectedClass && (
            <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-600 text-white rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedClass.name}</h3>
                  <p className="text-xs text-slate-500">
                    Grade/Level: <span className="font-semibold text-slate-700">{selectedClass.level}</span> | Stream:{' '}
                    <span className="font-semibold text-slate-700">{selectedClass.stream}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(selectedClass.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign New Subject
                </button>
              </div>
            </div>
          )}

          {/* Subjects and Teacher Allocation Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                <span>Loading subject allocations...</span>
              </div>
            ) : classSubjectAllocations.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900">No subjects available</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  {classes.length === 0
                    ? 'No classes found in the system. Create a class first.'
                    : 'No subjects match your query. Register subjects in the Subject Registry.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-3.5 px-4">Subject Code</th>
                      <th className="py-3.5 px-4">Subject Name</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Allocated Teacher</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classSubjectAllocations.map(({ subject, assignment, teacher }) => (
                      <tr key={subject.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                            {subject.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {subject.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {subject.category || 'Core'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {teacher ? (
                            <button
                              type="button"
                              onClick={() => setViewingTeacher(teacher)}
                              className="flex items-center gap-2 text-left group hover:opacity-80 transition cursor-pointer"
                              title="Click to view teacher profile & teaching load"
                            >
                              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs group-hover:bg-brand-200 transition">
                                {teacher.firstName?.charAt(0) || 'T'}
                              </span>
                              <div>
                                <div className="font-semibold text-slate-900 text-xs group-hover:text-brand-600 transition hover:underline">
                                  {teacher.firstName} {teacher.lastName}
                                </div>
                                <div className="text-[11px] text-slate-500">{teacher.email}</div>
                              </div>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {assignment ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(selectedClassId, subject.id, assignment.teacherId)}
                                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50"
                                >
                                  Reassign
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                  title="Remove assignment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(selectedClassId, subject.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 rounded hover:bg-brand-100 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Assign Teacher
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================== TAB: BY TEACHER ======================== */
        <div className="space-y-4">
          {selectedTeacher && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedTeacher.firstName} {selectedTeacher.lastName}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedTeacher.designation || selectedTeacher.staffProfile?.jobTitle || (selectedTeacher.role === 'TEACHER' ? 'Teacher' : selectedTeacher.role ? selectedTeacher.role.replace(/_/g, ' ') : 'Teacher')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-slate-500">
                    <span>
                      Email: <span className="font-semibold text-slate-700">{selectedTeacher.email}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Assigned Classes: <span className="font-semibold text-slate-700">{teacherAllocations.length}</span>
                    </span>
                    {(selectedTeacher.teachingLevels && selectedTeacher.teachingLevels.length > 0) && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-500">Levels:</span>
                          {selectedTeacher.teachingLevels.map((lvl) => (
                            <span
                              key={lvl}
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                                lvl === 'PRIMARY'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : lvl === 'A_LEVEL'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              {lvl === 'PRIMARY' ? 'Primary' : lvl === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                            </span>
                          ))}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span>Department:</span>
                      {selectedTeacher.academicDepartment ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                          <Briefcase className="w-3 h-3" />
                          {selectedTeacher.academicDepartment.name} ({selectedTeacher.academicDepartment.code})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          Unassigned
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingTeacher(selectedTeacher)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition"
                  title="View teacher profile and teaching load"
                >
                  <Users className="w-3.5 h-3.5" />
                  View Profile &amp; Load
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChangeDeptModal(selectedTeacher)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Assign Department
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(undefined, undefined, selectedTeacher.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign To Class
                </button>
              </div>
            </div>
          )}

          {/* Teacher's Current Workload Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                <span>Loading teacher workload...</span>
              </div>
            ) : teacherAllocations.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900">No classes assigned</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  This teacher currently has no active subject allocations. Click "Assign To Class" to configure their teaching schedule.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(undefined, undefined, selectedTeacher?.id)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  <Plus className="w-4 h-4" />
                  Assign To Class
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Grade & Stream</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teacherAllocations.map(({ assignment, class: cls, subject }) => (
                      <tr key={assignment.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {cls?.name || 'Class ID: ' + assignment.classId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {cls?.level ? `${cls.level} (${cls.stream || 'A'})` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {subject?.name || 'Subject ID: ' + assignment.subjectId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {subject?.code ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {subject.code}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Unassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================== ASSIGN TEACHER MODAL ======================== */}
      {isAssignModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Allocate Teacher to Class</h2>
              </div>
              <button
                type="button"
                onClick={handleCloseAssignModal}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Class <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={modalClassId}
                  onChange={(e) => setModalClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="" disabled>Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level} - {cls.stream})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={modalSubjectId}
                  onChange={(e) => {
                    const newSubId = e.target.value;
                    setModalSubjectId(newSubId);
                    // If current modal teacher is not qualified for newly selected subject, reset modalTeacherId
                    if (modalTeacherId) {
                      const tObj = teachers.find((t) => t.id === modalTeacherId);
                      const qIds = new Set([
                        ...(tObj?.qualifications || []).map((q) => q.id),
                        ...(tObj?.subjectIds || []),
                      ]);
                      if (!qIds.has(newSubId)) {
                        setModalTeacherId('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="" disabled>
                    {availableSubjectsForModal.length === 0
                      ? 'No applicable subjects available for this class'
                      : 'Select a subject'}
                  </option>
                  {availableSubjectsForModal.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.level === 'PRIMARY' ? 'Primary' : s.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                    </option>
                  ))}
                </select>
                {selectedModalClass && availableSubjectsForModal.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    No subjects in Subject Registry match the education level of class "{selectedModalClass.name}".
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Teaching Staff Member <span className="text-rose-500">*</span>
                </label>

                {modalSubjectId && eligibleTeachersForModal.length === 0 && (
                  <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No Teachers Qualified for {selectedModalSubject?.name || 'this subject'}</span>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      No teachers have "{selectedModalSubject?.name}" in their subject specializations. Configure teacher qualifications first before allocating to this class.
                    </p>
                  </div>
                )}

                <select
                  required
                  value={modalTeacherId}
                  onChange={(e) => setModalTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="" disabled>
                    {modalSubjectId
                      ? eligibleTeachersForModal.length === 0
                        ? 'No qualified teachers available'
                        : 'Select a qualified teacher'
                      : 'Select a teacher'}
                  </option>
                  {eligibleTeachersForModal.map((t) => {
                    const dept = t.academicDepartment?.name || 'No Dept';
                    return (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({dept})
                      </option>
                    );
                  })}
                </select>

                {modalSubjectId && ineligibleTeachersForModal.length > 0 && (
                  <details className="mt-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                      {`View Ineligible Faculty (${ineligibleTeachersForModal.length})`}
                    </summary>
                    <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto divide-y divide-slate-100">
                      {ineligibleTeachersForModal.map((t) => {
                        const qualNames = (t.qualifications || []).map((q) => q.name).join(', ');
                        const reason = qualNames
                          ? `Specialized in: ${qualNames}`
                          : 'No subject qualifications recorded';
                        return (
                          <li key={t.id} className="pt-1 flex items-start justify-between gap-2">
                            <span className="font-medium text-slate-800">{t.firstName} {t.lastName}</span>
                            <span className="text-[10px] text-slate-500 text-right">{reason}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAssignModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== ADD TEACHER MODAL ======================== */}
      {isAddTeacherModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Add Teaching Staff Member</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherFirstName}
                    onChange={(e) => setTeacherFirstName(e.target.value)}
                    placeholder="e.g. Samuel"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherLastName}
                    onChange={(e) => setTeacherLastName(e.target.value)}
                    placeholder="e.g. Okon"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="s.okon@schoolos.internal"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Teaching Subjects <span className="text-slate-400 font-normal lowercase">({teacherSubjectIds.length} selected)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Auto-determines department</span>
                </div>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50/50">
                  {subjects.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-3">No subjects available</div>
                  ) : (
                    subjects.map((sub) => {
                      const dept = sub.departmentId ? departments.find((d) => d.id === sub.departmentId) : null;
                      const isChecked = teacherSubjectIds.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-brand-50/70 border-brand-300 text-brand-950 font-medium'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setTeacherSubjectIds((prev) =>
                                  prev.includes(sub.id) ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
                                );
                              }}
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {sub.code}
                            </span>
                            <span>{sub.name}</span>
                          </div>
                          {dept ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {dept.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Dept</span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Department Auto-Determination Preview */}
              <div className="rounded-xl p-3 border border-slate-200 bg-slate-50/50 text-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Academic Department Status
                </div>
                {addTeacherDeptAnalysis.status === 'PENDING' && (
                  <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{addTeacherDeptAnalysis.message}</span>
                  </div>
                )}
                {addTeacherDeptAnalysis.status === 'RESOLVED' && (
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Auto-Assigned Department: <strong className="font-bold">{addTeacherDeptAnalysis.department?.name} ({addTeacherDeptAnalysis.department?.code})</strong></span>
                  </div>
                )}
                {addTeacherDeptAnalysis.status === 'CONFLICT' && (
                  <div className="flex items-start gap-2 text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <div className="font-bold">Conflicting Departments Detected</div>
                      <div className="mt-0.5">{addTeacherDeptAnalysis.message}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || addTeacherDeptAnalysis.status === 'CONFLICT'}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Register Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== CHANGE DEPARTMENT MODAL ======================== */}
      {isChangeDeptModalOpen && changingTeacher && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Configure Teaching Subjects &amp; Department</h2>
                  <p className="text-xs text-slate-500">
                    {changingTeacher.firstName} {changingTeacher.lastName} ({changingTeacher.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDepartmentChange} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Teaching Subjects <span className="text-slate-400 font-normal lowercase">({editTeacherSubjectIds.length} selected)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Auto-determines department</span>
                </div>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50/50">
                  {subjects.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-3">No subjects available</div>
                  ) : (
                    subjects.map((sub) => {
                      const dept = sub.departmentId ? departments.find((d) => d.id === sub.departmentId) : null;
                      const isChecked = editTeacherSubjectIds.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-brand-50/70 border-brand-300 text-brand-950 font-medium'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setEditTeacherSubjectIds((prev) =>
                                  prev.includes(sub.id) ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
                                );
                              }}
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {sub.code}
                            </span>
                            <span>{sub.name}</span>
                          </div>
                          {dept ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {dept.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Dept</span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Department Auto-Determination Preview */}
              <div className="rounded-xl p-3 border border-slate-200 bg-slate-50/50 text-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Academic Department Status
                </div>
                {editTeacherDeptAnalysis.status === 'PENDING' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{editTeacherDeptAnalysis.message}</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Manual Department Assignment (Optional when no subjects selected)
                      </label>
                      <select
                        value={targetDepartmentId}
                        onChange={(e) => setTargetDepartmentId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                      >
                        <option value="">-- No Department (Unassigned) --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {editTeacherDeptAnalysis.status === 'RESOLVED' && (
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Auto-Assigned Department: <strong className="font-bold">{editTeacherDeptAnalysis.department?.name} ({editTeacherDeptAnalysis.department?.code})</strong></span>
                  </div>
                )}
                {editTeacherDeptAnalysis.status === 'CONFLICT' && (
                  <div className="flex items-start gap-2 text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <div className="font-bold">Conflicting Departments Detected</div>
                      <div className="mt-0.5">{editTeacherDeptAnalysis.message}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangeDeptModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || editTeacherDeptAnalysis.status === 'CONFLICT'}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Save Faculty Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      <TeacherDetailsModal
        isOpen={Boolean(viewingTeacher)}
        onClose={() => setViewingTeacher(null)}
        teacherId={viewingTeacher?.id}
        initialTeacher={viewingTeacher}
        onAssignToClass={(tId) => {
          setViewingTeacher(null);
          handleOpenAssignModal(undefined, undefined, tId);
        }}
        onChangeDepartment={(t) => {
          setViewingTeacher(null);
          handleOpenChangeDeptModal(t);
        }}
      />
    </div>
  );
};
