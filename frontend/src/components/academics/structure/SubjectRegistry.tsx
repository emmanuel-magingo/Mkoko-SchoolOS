import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  Sparkles,
  BookMarked,
  Tag,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  Briefcase,
} from 'lucide-react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getTenantEnabledLevels } from '../../../utils/education-level.utils';
import { AcademicsApi } from '../../../api/academics.api';
import { Subject, AcademicDepartment, EducationLevel } from '../../../types/academics.types';

interface SubjectRegistryProps {
  initialSubjects?: Subject[];
}

export const normalizeCategory = (cat?: string): 'Core' | 'Elective' | 'Optional' => {
  if (!cat) return 'Core';
  const upper = cat.toUpperCase();
  if (upper === 'ELECTIVE') return 'Elective';
  if (upper === 'OPTIONAL') return 'Optional';
  return 'Core';
};

export const SubjectRegistry: React.FC<SubjectRegistryProps> = ({ initialSubjects }) => {
  const { selectedSchool } = useAcademicContext();
  const { tenant } = useAuth();
  const enabledLevels = useMemo(() => getTenantEnabledLevels(tenant, selectedSchool), [tenant, selectedSchool]);
  const activeLevels = useMemo(() => (enabledLevels && enabledLevels.length > 0 ? enabledLevels : ['PRIMARY', 'O_LEVEL', 'A_LEVEL']), [enabledLevels]);

  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects || []);
  const [loading, setLoading] = useState<boolean>(!initialSubjects);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Catalogue Browser Modal State
  const [isCatalogueOpen, setIsCatalogueOpen] = useState<boolean>(false);
  const [catalogueLevel, setCatalogueLevel] = useState<'ALL' | 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL'>('ALL');
  const [catalogueLoading, setCatalogueLoading] = useState<boolean>(false);
  const [catalogueSubjects, setCatalogueSubjects] = useState<any[]>([]);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formLevel, setFormLevel] = useState<EducationLevel>('O_LEVEL');
  const [formApplicableClasses, setFormApplicableClasses] = useState<string>('Form 1, Form 2, Form 3, Form 4');
  const [formCategory, setFormCategory] = useState<'Core' | 'Elective' | 'Optional'>('Core');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDepartmentId, setFormDepartmentId] = useState<string>('');
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await AcademicsApi.getAcademicDepartments();
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setDepartments(list);
    } catch {
      // department loading optional
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AcademicsApi.getSubjects();
      const rawData = Array.isArray(res.data) ? res.data : [];

      // Parse category and status
      const parsedSubjects: Subject[] = rawData.map((sub) => {
        let category: 'Core' | 'Elective' | 'Optional' = normalizeCategory(sub.category);
        let status: 'ACTIVE' | 'INACTIVE' = (sub.status as any) || 'ACTIVE';
        let desc = sub.description || '';

        if (desc.startsWith('[')) {
          const match = desc.match(/^\[(Core|Elective|Optional)\](?:\s*\[(ACTIVE|INACTIVE)\])?\s*(.*)$/i);
          if (match) {
            if (!sub.category || sub.category === 'CORE') {
              category = normalizeCategory(match[1]);
            }
            if (match[2]) status = match[2].toUpperCase() as any;
            desc = match[3] || '';
          }
        }

        return {
          ...sub,
          category,
          status,
          description: desc || null,
        };
      });

      setSubjects(parsedSubjects);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenAddModal = () => {
    setModalMode('CREATE');
    setEditingSubject(null);
    setFormName('');
    setFormCode('');
    const initialLevel = (enabledLevels && enabledLevels.length > 0) ? enabledLevels[0] : 'O_LEVEL';
    setFormLevel(initialLevel);
    if (initialLevel === 'PRIMARY') {
      setFormApplicableClasses('STD 1, STD 2, STD 3, STD 4, STD 5, STD 6, STD 7');
    } else if (initialLevel === 'A_LEVEL') {
      setFormApplicableClasses('Form 5, Form 6');
    } else {
      setFormApplicableClasses('Form 1, Form 2, Form 3, Form 4');
    }
    setFormCategory('Core');
    setFormStatus('ACTIVE');
    setFormDescription('');
    setFormDepartmentId('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setModalMode('EDIT');
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code);
    setFormLevel((subject.level as EducationLevel) || 'O_LEVEL');
    setFormApplicableClasses(subject.applicableClasses?.join(', ') || '');
    setFormCategory(normalizeCategory(subject.category));
    setFormStatus(subject.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setFormDescription(subject.description || '');
    setFormDepartmentId(subject.departmentId || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenCatalogue = async () => {
    setIsCatalogueOpen(true);
    await fetchCatalogue(catalogueLevel);
  };

  const fetchCatalogue = async (level?: string) => {
    setCatalogueLoading(true);
    try {
      const res = await AcademicsApi.getCurriculumCatalogue(level && level !== 'ALL' ? level : undefined);
      setCatalogueSubjects(res.data?.subjects || []);
    } catch {
      setCatalogueSubjects([]);
    } finally {
      setCatalogueLoading(false);
    }
  };

  const handleSelectCatalogueSubject = (template: any) => {
    setFormName(template.name);
    setFormCode(template.code);
    setFormLevel(template.level);
    setFormCategory(normalizeCategory(template.category));
    setFormApplicableClasses(template.applicableClasses?.join(', ') || '');
    setFormDescription(template.description || '');
    setIsCatalogueOpen(false);
    setModalMode('CREATE');
    setEditingSubject(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalError(null);
    setEditingSubject(null);
  };

  const handleOpenDeleteModal = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSubjectToDelete(null);
    setDeleteError(null);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedCode = formCode.trim().toUpperCase();
    const trimmedName = formName.trim();

    if (!trimmedCode) {
      setModalError('Subject code is required.');
      return;
    }
    if (!trimmedName) {
      setModalError('Subject name is required.');
      return;
    }

    // Check duplicate code locally
    const duplicate = subjects.some(
      (s) => s.code.toUpperCase() === trimmedCode && (modalMode === 'CREATE' || s.id !== editingSubject?.id)
    );
    if (duplicate) {
      setModalError(`Subject with code "${trimmedCode}" already exists.`);
      return;
    }

    const applicableClassesArray = formApplicableClasses
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const payload: Partial<Subject> = {
        name: trimmedName,
        code: trimmedCode,
        level: formLevel,
        applicableClasses: applicableClassesArray,
        status: formStatus,
        category: formCategory.toUpperCase() as 'CORE' | 'ELECTIVE' | 'OPTIONAL',
        description: formDescription.trim() || null,
        departmentId: formDepartmentId || null,
      };

      if (modalMode === 'CREATE') {
        const res = await AcademicsApi.createSubject(payload);
        const newSubject: Subject = {
          ...res.data,
          level: formLevel,
          applicableClasses: applicableClassesArray,
          category: formCategory,
          status: formStatus,
          description: formDescription.trim() || null,
          departmentId: formDepartmentId || null,
        };
        setSubjects((prev) => [...prev, newSubject].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccessMessage(`Subject "${trimmedName}" (${trimmedCode}) registered successfully.`);
      } else if (editingSubject) {
        await AcademicsApi.updateSubject(editingSubject.id, payload);
        await fetchSubjects();
        setSuccessMessage(`Subject "${trimmedName}" (${trimmedCode}) updated successfully.`);
      }

      setTimeout(() => setSuccessMessage(null), 4000);
      handleCloseModal();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save subject.';
      const details = err?.response?.data?.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        const detailStr = details.map((d: any) => `${d.field ? `${d.field}: ` : ''}${d.message}`).join(', ');
        setModalError(`${errMsg} (${detailStr})`);
      } else {
        setModalError(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await AcademicsApi.deleteSubject(subjectToDelete.id);
      setSuccessMessage(`Subject "${subjectToDelete.name}" (${subjectToDelete.code}) was deleted successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      handleCloseDeleteModal();
      await fetchSubjects();
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete subject. It may have active teacher assignments.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch =
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'ALL' ||
        normalizeCategory(subject.category).toUpperCase() === categoryFilter.toUpperCase();

      const matchesStatus =
        statusFilter === 'ALL' || subject.status === statusFilter;

      const matchesLevel =
        levelFilter === 'ALL' || (subject.level || 'O_LEVEL') === levelFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesLevel;
    });
  }, [subjects, searchTerm, categoryFilter, statusFilter, levelFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = subjects.length;
    const core = subjects.filter((s) => normalizeCategory(s.category) === 'Core').length;
    const elective = subjects.filter((s) => normalizeCategory(s.category) === 'Elective').length;
    const optional = subjects.filter((s) => normalizeCategory(s.category) === 'Optional').length;
    const active = subjects.filter((s) => s.status !== 'INACTIVE').length;
    return { total, core, elective, optional, active };
  }, [subjects]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Subject Registry &amp; Curriculum
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Define and manage all academic disciplines, curriculum categories, and national curriculum course codes.
            {selectedSchool ? ` Active School: ${selectedSchool.name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCatalogue}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition shadow-xs"
            title="Browse Tanzania Curriculum Catalogue"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            Tanzania Catalogue
          </button>
          <button
            type="button"
            onClick={fetchSubjects}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            title="Refresh subjects"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            id="btn-add-subject"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Subjects</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <span className="text-xs text-slate-400">All subject disciplines</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-600 text-xs font-medium">
            <span>Core Disciplines</span>
            <BookMarked className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-900">{stats.core}</div>
          <span className="text-xs text-indigo-500/80">Compulsory subjects</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-teal-600 text-xs font-medium">
            <span>Elective Subjects</span>
            <Tag className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-900">{stats.elective}</div>
          <span className="text-xs text-teal-500/80">Specialized streams</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600 text-xs font-medium">
            <span>Optional Subjects</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.optional}</div>
          <span className="text-xs text-amber-500/80">Extracurricular / Club</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-medium">
            <span>Active Curriculum</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{stats.active}</div>
          <span className="text-xs text-emerald-500/80">Currently scheduled</span>
        </div>
      </div>

      {/* Control Bar: Search & Category Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, subject name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Level Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              {(['ALL', ...activeLevels] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl as any)}
                  className={`px-3 py-1.5 rounded-md transition ${
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

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              {(['ALL', 'CORE', 'ELECTIVE', 'OPTIONAL'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    categoryFilter === cat
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'All Categories'
                    : cat === 'CORE'
                    ? 'Core'
                    : cat === 'ELECTIVE'
                    ? 'Elective'
                    : 'Optional'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Subjects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-600" />
            <p className="text-sm">Loading registered subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-400 stroke-1" />
            <p className="text-base font-semibold text-slate-800">No subjects found</p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || levelFilter !== 'ALL'
                ? 'No subjects match your active search or filter criteria. Try resetting the filters.'
                : 'No subjects have been registered in the curriculum yet. Click "Add Subject" to begin.'}
            </p>
            {!searchTerm && categoryFilter === 'ALL' && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                <Plus className="w-4 h-4" />
                Register First Subject
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Subject Code</th>
                  <th className="py-3.5 px-4">Subject Name</th>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Applicable Classes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((sub) => {
                  const normalizedCat = normalizeCategory(sub.category);
                  const isCore = normalizedCat === 'Core';
                  const isElective = normalizedCat === 'Elective';
                  const isActive = sub.status !== 'INACTIVE';

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                          {sub.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {sub.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            sub.level === 'PRIMARY'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : sub.level === 'A_LEVEL'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {sub.level === 'PRIMARY' ? 'Primary' : sub.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isCore
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : isElective
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {normalizedCat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.department ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                            <Briefcase className="w-3 h-3 text-brand-600" />
                            {sub.department.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {sub.applicableClasses && sub.applicableClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {sub.applicableClasses.map((cls) => (
                              <span key={cls} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                                {cls}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">All {sub.level || 'O_LEVEL'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {sub.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Subject"
                            onClick={() => handleOpenEditModal(sub)}
                            id={`btn-edit-subject-${sub.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete Subject"
                            onClick={() => handleOpenDeleteModal(sub)}
                            id={`btn-delete-subject-${sub.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modalMode === 'EDIT' ? `Edit Subject: ${editingSubject?.name}` : 'Register New Subject'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
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

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MATH, PHYS"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Unique 2–8 letter code</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="subject-category-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Education Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="subject-level-select"
                    value={formLevel}
                    onChange={(e) => {
                      const nextLevel = e.target.value as EducationLevel;
                      setFormLevel(nextLevel);
                      if (modalMode === 'CREATE') {
                        if (nextLevel === 'PRIMARY') setFormApplicableClasses('STD 1, STD 2, STD 3, STD 4, STD 5, STD 6, STD 7');
                        else if (nextLevel === 'A_LEVEL') setFormApplicableClasses('Form 5, Form 6');
                        else setFormApplicableClasses('Form 1, Form 2, Form 3, Form 4');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {activeLevels.includes('PRIMARY') && (
                      <option value="PRIMARY">Primary (Standard 1–7)</option>
                    )}
                    {activeLevels.includes('O_LEVEL') && (
                      <option value="O_LEVEL">Ordinary Level (Form 1–4)</option>
                    )}
                    {activeLevels.includes('A_LEVEL') && (
                      <option value="A_LEVEL">Advanced Level (Form 5–6)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Applicable Classes / Forms
                  </label>
                  <input
                    type="text"
                    value={formApplicableClasses}
                    onChange={(e) => setFormApplicableClasses(e.target.value)}
                    placeholder="e.g. Form 1, Form 2, Form 3, Form 4"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Pure Mathematics"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Department (Optional)
                </label>
                <select
                  id="subject-department-select"
                  value={formDepartmentId}
                  onChange={(e) => setFormDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- No Department Assigned --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ACTIVE">Active (In Current Curriculum)</option>
                  <option value="INACTIVE">Inactive (Archived / Deprecated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Curriculum Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief summary of syllabus or grade level scope..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-subject-form"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {modalMode === 'EDIT' ? 'Save Changes' : 'Register Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && subjectToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Subject</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 font-semibold">{subjectToDelete.name}</strong> ({subjectToDelete.code}) from the curriculum registry?
            </p>

            {deleteError && (
              <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-subject"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tanzania Curriculum Catalogue Browser Modal */}
      {isCatalogueOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Tanzania Curriculum Catalogue
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select a standard subject template to pre-fill curriculum registration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogueOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Level filter tabs in catalogue */}
            <div className="flex items-center gap-2">
              {(['ALL', ...activeLevels] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setCatalogueLevel(lvl as any);
                    fetchCatalogue(lvl);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    catalogueLevel === lvl
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl === 'ALL'
                    ? 'All Levels'
                    : lvl === 'PRIMARY'
                    ? 'Primary (Std 1–7)'
                    : lvl === 'O_LEVEL'
                    ? 'O-Level (Form 1–4)'
                    : 'A-Level (Form 5–6)'}
                </button>
              ))}
            </div>

            {/* Catalogue list */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {catalogueLoading ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                  Loading curriculum templates...
                </div>
              ) : catalogueSubjects.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No subjects found in catalogue.
                </div>
              ) : (
                catalogueSubjects.map((tpl) => (
                  <div
                    key={tpl.code}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {tpl.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{tpl.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tpl.level === 'PRIMARY'
                              ? 'bg-sky-50 text-sky-700'
                              : tpl.level === 'A_LEVEL'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {tpl.level === 'PRIMARY' ? 'Primary' : tpl.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{tpl.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Applicable: {tpl.applicableClasses.join(', ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectCatalogueSubject(tpl)}
                      className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition shrink-0"
                    >
                      Use Template
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCatalogueOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
