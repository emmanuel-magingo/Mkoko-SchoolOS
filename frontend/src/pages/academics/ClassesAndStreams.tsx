import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building,
  UserCheck,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { AcademicClass } from '../../types/academic.types';
import { SubjectCombination } from '../../types/academics.types';
import { AcademicsApi } from '../../api/academics.api';
import { Modal } from '../../components/common/Modal';
import { getTenantEnabledLevels, isAdvancedLevel } from '../../utils/education-level.utils';

export const ClassesAndStreams: React.FC = () => {
  const { user, tenant } = useAuth();
  const { selectedSchool } = useAcademicContext();
  const { hasPermission } = usePermissions();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Class Modal Form State
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState('Form 1');
  const [formStream, setFormStream] = useState('A');
  const [formCapacity, setFormCapacity] = useState('45');
  const [formCombinationId, setFormCombinationId] = useState('');
  const [combinations, setCombinations] = useState<SubjectCombination[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Assign Class Teacher State
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string; email?: string }>>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<AcademicClass | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const canManageClasses =
    hasPermission(Permissions.MANAGE_CLASSES) ||
    hasPermission(Permissions.MANAGE_ACADEMICS) ||
    ['ACADEMIC_MASTER', 'SENIOR_ACADEMIC_MASTER', 'SCHOOL_ADMIN', 'ADMIN', 'HEADMASTER'].includes(
      user?.role || ''
    );

  const enabledLevels = useMemo(
    () => getTenantEnabledLevels(tenant, selectedSchool),
    [tenant, selectedSchool]
  );

  const hasPrimary = enabledLevels.includes('PRIMARY') || classes.some((c) => /std|standard/i.test(c.level));
  const hasOLevel = enabledLevels.includes('O_LEVEL') || classes.some((c) => /form\s*[1-4]/i.test(c.level));
  const hasALevel = enabledLevels.includes('A_LEVEL') || classes.some((c) => /\b(5|6|V|VI)\b/i.test(c.level) || /\b(5|6|V|VI)\b/i.test(c.name));

  const availableLevels = useMemo(() => {
    const list: string[] = [];
    if (hasPrimary) {
      list.push('Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7');
    }
    if (hasOLevel) {
      list.push('Form 1', 'Form 2', 'Form 3', 'Form 4');
    }
    if (hasALevel) {
      list.push('Form 5', 'Form 6');
    }
    return list.length > 0 ? list : ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
  }, [hasPrimary, hasOLevel, hasALevel]);

  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(formLevel)) {
      setFormLevel(availableLevels[0]);
    }
  }, [availableLevels, formLevel]);

  useEffect(() => {
    if (hasALevel) {
      AcademicsApi.getCombinations({ isActive: true })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setCombinations(list);
        })
        .catch(() => {});
    }
  }, [hasALevel]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<AcademicClass[]>('/classes');
      const data = Array.isArray(res.data) ? res.data : [];
      setClasses(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load classes and streams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get<any[]>('/academics/teachers').catch(() => api.get<any[]>('/staff'));
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setTeachers(data);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleOpenAssignTeacher = (cls: AcademicClass) => {
    setSelectedClassForAssign(cls);
    setSelectedTeacherId(cls.classTeacher?.id || cls.classTeacherId || '');
    setAssignError(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForAssign) return;

    setAssigningTeacher(true);
    setAssignError(null);

    try {
      await api.patch(`/academics/classes/${selectedClassForAssign.id}/assign-teacher`, {
        teacherId: selectedTeacherId || null,
      });

      setAssignSuccess(`Class teacher for ${selectedClassForAssign.name} updated successfully.`);
      setIsAssignModalOpen(false);
      fetchClasses();
      setTimeout(() => setAssignSuccess(null), 4000);
    } catch (err: any) {
      setAssignError(err?.message || 'Failed to assign class teacher.');
    } finally {
      setAssigningTeacher(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError(null);

    try {
      const isALevelClass = isAdvancedLevel(formLevel);
      const generatedName = formName.trim() || `${formLevel} - ${formStream}`;
      const payload: any = {
        name: generatedName,
        level: formLevel,
        stream: formStream,
        capacity: parseInt(formCapacity, 10) || 45,
      };
      if (isALevelClass && formCombinationId) {
        payload.combinationId = formCombinationId;
      }
      await api.post('/classes', payload);

      setIsCreateModalOpen(false);
      setFormName('');
      setFormCombinationId('');
      fetchClasses();
    } catch (err: any) {
      setCreateError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create class'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.stream.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'ALL' || cls.level.toLowerCase() === levelFilter.toLowerCase();
      return matchesSearch && matchesLevel;
    });
  }, [classes, searchQuery, levelFilter]);

  // Aggregate stats
  const totalClasses = classes.length;
  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 45), 0);
  const totalEnrolled = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 p-1.5 text-blue-600">
              <Building className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Classes &amp; Streams
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Active instructional forms, stream allocations, capacities, and class teacher oversight for{' '}
            <span className="font-semibold text-slate-900">{selectedSchool?.name || 'School'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchClasses}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {hasPermission(Permissions.MANAGE_CLASSES) && (
            <button
              type="button"
              id="btn-create-class"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Class</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Classes &amp; Streams</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <GraduationCap className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalClasses}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {hasPrimary && hasOLevel && hasALevel
              ? 'Primary, O-Level & A-Level'
              : hasOLevel && hasALevel
              ? 'O-Level & A-Level'
              : hasPrimary && hasOLevel
              ? 'Primary & O-Level'
              : hasPrimary
              ? 'Primary levels'
              : hasALevel
              ? 'A-Level forms'
              : 'O-Level forms'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Students</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalEnrolled}
          </div>
          <div className="mt-1 text-xs text-slate-500">Enrolled in streams</div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Capacity</span>
            <span className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Building className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalCapacity}
          </div>
          <div className="mt-1 text-xs text-slate-500">Configured desks</div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Occupancy Rate</span>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {occupancyRate}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {totalCapacity - totalEnrolled} open spaces
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="classes-search-input"
            type="text"
            placeholder="Search class or stream (e.g. Form 1A)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            id="classes-level-filter"
            aria-label="Filter by level"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            {availableLevels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Classes Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 p-4 text-xs font-medium text-rose-700 border-b border-rose-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {assignSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border-b border-emerald-100">
            <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{assignSuccess}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table id="classes-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Class &amp; Stream</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Class Teacher</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Current Enrolment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span>Loading classes and streams...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building className="h-8 w-8 text-slate-300" />
                      <span className="font-semibold text-slate-700">No classes found</span>
                      <p className="text-xs text-slate-400">
                        {searchQuery || levelFilter !== 'ALL'
                          ? 'Try adjusting your search query or filter criteria.'
                          : 'Get started by creating your first academic class stream.'}
                      </p>
                      {hasPermission(Permissions.MANAGE_CLASSES) && (
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create Class</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const enrolledCount = cls._count?.students || 0;
                  const capacity = cls.capacity || 45;
                  const percent = Math.min(100, Math.round((enrolledCount / capacity) * 100));

                  return (
                    <tr
                      key={cls.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                            {cls.stream || cls.name.charAt(cls.name.length - 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{cls.name}</span>
                              {cls.combination && (
                                <span
                                  className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200"
                                  title={`Combination: ${cls.combination.name}`}
                                >
                                  {cls.combination.code}
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-slate-500">
                              {'Stream ' + cls.stream}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {cls.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {cls.classTeacher ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 shadow-2xs">
                              <UserCheck className="h-3 w-3 text-blue-600" />
                              {cls.classTeacher.firstName} {cls.classTeacher.lastName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              Unassigned
                            </span>
                          )}

                          {canManageClasses && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignTeacher(cls)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors shadow-2xs"
                              title="Assign or change class teacher"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {capacity} Desks
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-slate-900">
                              {enrolledCount} enrolled
                            </span>
                            <span className="text-slate-500">{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                percent > 95
                                  ? 'bg-rose-500'
                                  : percent > 80
                                  ? 'bg-blue-600'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {canManageClasses && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignTeacher(cls)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 rounded px-2 py-1 hover:bg-slate-100 transition-colors"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Assign Teacher</span>
                            </button>
                          )}
                          <Link
                            to={`/academics/structure/enrolments?classId=${cls.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Enrolments</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create Class Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Academic Class & Stream"
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          {createError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {createError}
            </div>
          )}

          <div>
            <label htmlFor="create-class-name" className="block text-xs font-semibold text-slate-700">
              Class Display Name (Optional)
            </label>
            <input
              id="create-class-name"
              type="text"
              placeholder="e.g. Form 1 - Stream A"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-class-level" className="block text-xs font-semibold text-slate-700">
                Academic Level
              </label>
              <select
                id="create-class-level"
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
              >
                {availableLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-class-stream" className="block text-xs font-semibold text-slate-700">
                Stream Letter / Identifier
              </label>
              <input
                id="create-class-stream"
                type="text"
                placeholder={formLevel.includes('5') || formLevel.includes('6') ? 'e.g. PCM, PCB, HGL, Arts' : 'e.g. A, B, C, Science'}
                value={formStream}
                onChange={(e) => setFormStream(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="create-class-capacity" className="block text-xs font-semibold text-slate-700">
              Desk Capacity (Students)
            </label>
            <input
              id="create-class-capacity"
              type="number"
              min="1"
              max="200"
              value={formCapacity}
              onChange={(e) => setFormCapacity(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {(formLevel.includes('5') || formLevel.includes('6')) && (
            <div>
              <label htmlFor="create-class-combination" className="block text-xs font-semibold text-slate-700">
                A-Level Subject Combination (Optional)
              </label>
              <select
                id="create-class-combination"
                value={formCombinationId}
                onChange={(e) => setFormCombinationId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
              >
                <option value="">-- No Combination Selected --</option>
                {combinations.map((comb) => (
                  <option key={comb.id} value={comb.id}>
                    {comb.code} ({comb.name})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Associates this Form 5/6 stream with the corresponding subject combination.
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Class Teacher Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Class Teacher - ${selectedClassForAssign?.name || ''}`}
      >
        <form onSubmit={handleAssignTeacherSubmit} className="space-y-4">
          {assignError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {assignError}
            </div>
          )}

          <div>
            <label htmlFor="assign-teacher-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Select Class Teacher
            </label>
            <select
              id="assign-teacher-select"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">-- No Class Teacher (Unassigned) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} {t.email ? `(${t.email})` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              The assigned teacher acts as Form/Stream Teacher with roll call attendance authority and pastoral monitoring for this class.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigningTeacher}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-xs"
            >
              {assigningTeacher && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Assignment</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
