import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { AcademicsApi } from '../../../api/academics.api';
import { SubjectCombination, Subject, CurriculumCatalogueResponse } from '../../../types/academics.types';
import { Modal } from '../../common/Modal';

interface SubjectCombinationsProps {
  initialCombinations?: SubjectCombination[];
}

export const SubjectCombinations: React.FC<SubjectCombinationsProps> = ({ initialCombinations }) => {
  const [combinations, setCombinations] = useState<SubjectCombination[]>(initialCombinations || []);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [catalogue, setCatalogue] = useState<CurriculumCatalogueResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(!initialCombinations);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [combinationToDelete, setCombinationToDelete] = useState<SubjectCombination | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSubjectIds, setFormSubjectIds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Fetch Combinations
  const fetchCombinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AcademicsApi.getCombinations();
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setCombinations(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load subject combinations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Subjects (filter to A-Level if possible, or all subjects)
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await AcademicsApi.getSubjects();
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setSubjects(list);
    } catch {
      // fallback
    }
  }, []);

  // Fetch Catalogue
  const fetchCatalogue = useCallback(async () => {
    try {
      const res = await AcademicsApi.getCurriculumCatalogue('A_LEVEL');
      const data = res?.data || res;
      setCatalogue(data as CurriculumCatalogueResponse);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    if (!initialCombinations) {
      fetchCombinations();
    }
    fetchSubjects();
    fetchCatalogue();
  }, [fetchCombinations, fetchSubjects, fetchCatalogue, initialCombinations]);

  // A-Level subjects preference for combination selection
  const aLevelSubjects = useMemo(() => {
    const direct = subjects.filter((s) => s.level === 'A_LEVEL');
    if (direct.length > 0) return direct;
    return subjects;
  }, [subjects]);

  const handleOpenAddModal = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormSubjectIds([]);
    setFormIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comb: SubjectCombination) => {
    setModalMode('EDIT');
    setEditingId(comb.id);
    setFormName(comb.name);
    setFormCode(comb.code);
    setFormDescription(comb.description || '');
    const ids = (
      comb.subjects?.map((s) => s.id) ||
      comb.combinationSubjects?.map((cs: any) => cs.subjectId || cs.subject?.id) ||
      []
    ).filter(Boolean) as string[];
    setFormSubjectIds(ids);
    setFormIsActive(comb.isActive ?? true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (presetCode: string) => {
    if (!catalogue?.combinations) return;
    const found = catalogue.combinations.find((c) => c.code.toUpperCase() === presetCode.toUpperCase());
    if (!found) return;

    setFormCode(found.code);
    setFormName(found.name);
    setFormDescription(found.description || `Standard Tanzania A-Level combination: ${found.name}`);

    // Auto-match constituent subjects using subjectCodes
    const matchingIds: string[] = [];
    found.subjectCodes.forEach((targetCode: string) => {
      const matched = subjects.find(
        (s) =>
          s.code.toUpperCase() === targetCode.toUpperCase() ||
          s.name.toLowerCase().includes(targetCode.toLowerCase())
      );
      if (matched && !matchingIds.includes(matched.id)) {
        matchingIds.push(matched.id);
      }
    });

    if (matchingIds.length > 0) {
      setFormSubjectIds(matchingIds);
    }
  };

  const handleToggleSubject = (subId: string) => {
    setFormSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    const code = formCode.trim().toUpperCase();
    const name = formName.trim();

    if (!code || !name) {
      setModalError('Combination Code and Name are required.');
      setSubmitting(false);
      return;
    }

    if (formSubjectIds.length < 2) {
      setModalError('Please select at least 2 constituent subjects for this combination.');
      setSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'CREATE') {
        await AcademicsApi.createCombination({
          code,
          name,
          description: formDescription.trim() || undefined,
          subjectIds: formSubjectIds,
        });
        setSuccessMessage(`Combination ${code} created successfully.`);
      } else if (editingId) {
        await AcademicsApi.updateCombination(editingId, {
          code,
          name,
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          subjectIds: formSubjectIds,
        });
        setSuccessMessage(`Combination ${code} updated successfully.`);
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchCombinations();
    } catch (err: any) {
      setModalError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save combination'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (comb: SubjectCombination) => {
    setCombinationToDelete(comb);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!combinationToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await AcademicsApi.deleteCombination(combinationToDelete.id);
      setSuccessMessage(`Combination ${combinationToDelete.code} deleted successfully.`);
      setIsDeleteModalOpen(false);
      setCombinationToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchCombinations();
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete combination.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Filtered combinations
  const filteredCombinations = useMemo(() => {
    return combinations.filter((comb) => {
      const matchesSearch =
        comb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comb.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comb.description && comb.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && comb.isActive) ||
        (statusFilter === 'INACTIVE' && !comb.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [combinations, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layers className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              A-Level Subject Combinations
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Configure specialized Form 5 &amp; Form 6 subject streams (e.g. PCM, PCB, HGL) in alignment with the Tanzanian Advanced Secondary curriculum.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCombinations}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            id="btn-add-combination"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Combination
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
        <div className="flex items-center gap-3 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search combinations (e.g. PCM, Physics, Science)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      {/* Combinations Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Combination Name</th>
                <th className="px-6 py-3.5">Constituent Subjects</th>
                <th className="px-6 py-3.5">Assigned Classes</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Loading combinations...</span>
                  </td>
                </tr>
              ) : filteredCombinations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No subject combinations found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? 'Try adjusting your search criteria.'
                        : 'Configure your first A-Level combination (e.g. PCM, PCB, HGL).'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Combination
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCombinations.map((comb) => {
                  const subjectList: Subject[] =
                    comb.subjects ||
                    comb.combinationSubjects?.map((cs: any) => cs.subject).filter(Boolean) ||
                    [];
                  const classCount = comb.classCount ?? comb.classes?.length ?? 0;

                  return (
                    <tr key={comb.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          {comb.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {comb.name}
                        {comb.description && (
                          <p className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-1">
                            {comb.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {subjectList.length > 0 ? (
                            subjectList.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No subjects linked</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {classCount} {classCount === 1 ? 'Class' : 'Classes'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            comb.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              comb.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {comb.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(comb)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Edit Combination"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(comb)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Combination"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'CREATE' ? 'Add A-Level Subject Combination' : `Edit Combination - ${formCode}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {modalError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Quick Preset Selector */}
          {modalMode === 'CREATE' && catalogue?.combinations && catalogue.combinations.length > 0 && (
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Quick Preset: Tanzania Standard Combinations</span>
              </div>
              <select
                onChange={(e) => handleApplyPreset(e.target.value)}
                defaultValue=""
                className="w-full text-xs bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
              >
                <option value="" disabled>
                  -- Select a standard combination (PCM, PCB, HGL...) --
                </option>
                {catalogue.combinations.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.subjectCodes.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                placeholder="e.g. PCM"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 text-xs uppercase font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Combination Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Physics, Chemistry, Mathematics"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Science stream combination preparing for Engineering and Physical Sciences"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Constituent Subjects * (Selected: {formSubjectIds.length})
              </label>
              <span className="text-[11px] text-slate-400">At least 2 required</span>
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50">
              {aLevelSubjects.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No subjects found. Register subjects first in the Subject Registry.
                </p>
              ) : (
                aLevelSubjects.map((sub) => {
                  const isChecked = formSubjectIds.includes(sub.id);
                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition text-xs ${
                        isChecked
                          ? 'bg-purple-50/80 border border-purple-200 text-purple-900 font-medium'
                          : 'bg-white hover:bg-slate-100 border border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSubject(sub.id)}
                          className="h-3.5 w-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                        />
                        <span>{sub.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({sub.code})</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {sub.level || 'O_LEVEL'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {modalMode === 'EDIT' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit-combination-active"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
              />
              <label htmlFor="edit-combination-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Combination is Active for student enrolments
              </label>
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : modalMode === 'CREATE' ? 'Create Combination' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-3">
          {deleteError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
          <p className="text-xs text-slate-600">
            Are you sure you want to delete combination{' '}
            <strong className="text-slate-900">{combinationToDelete?.code} ({combinationToDelete?.name})</strong>?
          </p>
          <p className="text-[11px] text-slate-500">
            Combinations assigned to active classes cannot be deleted.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Combination'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
