import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle2,
  Clock,
  Plus,
  ArrowLeft,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  ListOrdered,
} from 'lucide-react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { AcademicsApi } from '../../../api/academics.api';
import {
  SubjectTopic,
  SchemeOfWorkOverview,
  SchemeOfWorkSubjectGroup,
  SchemeOfWorkClassProgress,
} from '../../../types/academics.types';
import { SchemeOfWorkTopicModal } from './SchemeOfWorkTopicModal';

export interface SchemeOfWorkDashboardProps {
  initialSubjectId?: string;
  initialClassId?: string;
}

export const SchemeOfWorkDashboard: React.FC<SchemeOfWorkDashboardProps> = ({
  initialSubjectId,
  initialClassId,
}) => {
  const { activeAcademicYear, activeTerm, activeTermId, terms } = useAcademicContext();

  // Overview state
  const [overview, setOverview] = useState<SchemeOfWorkOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Active Subject-Class selection state
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string; code: string } | null>(null);
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string; level: string; stream: string } | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string>(activeTermId || '');

  // Topics for active selection state
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopicIds, setExpandedTopicIds] = useState<Record<string, boolean>>({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<SubjectTopic | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync selected term with active term context if changed
  useEffect(() => {
    if (activeTermId && !selectedTermId) {
      setSelectedTermId(activeTermId);
    }
  }, [activeTermId, selectedTermId]);

  // 1. Fetch Teacher's Scheme of Work Overview
  const fetchOverview = useCallback(async () => {
    try {
      setIsLoadingOverview(true);
      setOverviewError(null);
      const res = await AcademicsApi.getSchemeOfWorkOverview({
        termId: selectedTermId || undefined,
        academicYearId: activeAcademicYear?.id,
      });
      setOverview(res.data);
    } catch (err: any) {
      setOverviewError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to load teaching assignments and scheme overview.'
      );
    } finally {
      setIsLoadingOverview(false);
    }
  }, [selectedTermId, activeAcademicYear?.id]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Auto-select initial subject and class if passed as props or from overview
  useEffect(() => {
    if (!overview || !overview.subjects || overview.subjects.length === 0) return;

    if (initialSubjectId && initialClassId && !selectedSubject && !selectedClass) {
      const matchSubject = overview.subjects.find((s) => s.subjectId === initialSubjectId);
      if (matchSubject) {
        const matchClass = matchSubject.classes.find((c) => c.classId === initialClassId);
        if (matchClass) {
          setSelectedSubject({
            id: matchSubject.subjectId,
            name: matchSubject.subjectName,
            code: matchSubject.subjectCode,
          });
          setSelectedClass({
            id: matchClass.classId,
            name: matchClass.className,
            level: matchClass.level,
            stream: matchClass.stream,
          });
        }
      }
    }
  }, [overview, initialSubjectId, initialClassId, selectedSubject, selectedClass]);

  // 2. Fetch Topics for Active Subject + Class Selection
  const fetchTopics = useCallback(async () => {
    if (!selectedSubject?.id || !selectedClass?.id) {
      setTopics([]);
      return;
    }

    try {
      setIsLoadingTopics(true);
      setTopicsError(null);
      const res = await AcademicsApi.getSubjectTopics(selectedSubject.id, {
        classId: selectedClass.id,
        termId: selectedTermId || undefined,
      });
      const data = res.data || [];
      data.sort((a, b) => a.orderIndex - b.orderIndex);
      setTopics(data);
    } catch (err: any) {
      setTopicsError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to load topics for this class and subject.'
      );
    } finally {
      setIsLoadingTopics(false);
    }
  }, [selectedSubject?.id, selectedClass?.id, selectedTermId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Select a subject + class combination to manage
  const handleSelectCombination = (
    subject: SchemeOfWorkSubjectGroup,
    cls: SchemeOfWorkClassProgress
  ) => {
    setSelectedSubject({
      id: subject.subjectId,
      name: subject.subjectName,
      code: subject.subjectCode,
    });
    setSelectedClass({
      id: cls.classId,
      name: cls.className,
      level: cls.level,
      stream: cls.stream,
    });
    setSearchQuery('');
  };

  const handleBackToOverview = () => {
    setSelectedSubject(null);
    setSelectedClass(null);
    fetchOverview();
  };

  // Toggle topic pedagogical details accordion
  const toggleTopicDetails = (id: string) => {
    setExpandedTopicIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle completion status
  const handleToggleComplete = async (topic: SubjectTopic) => {
    const isCompleted = topic.status === 'COMPLETED';
    try {
      await AcademicsApi.completeSubjectTopic(topic.id, !isCompleted);
      showToast(
        `Topic "${topic.title}" marked as ${!isCompleted ? 'Completed' : 'In Progress'}.`
      );
      await fetchTopics();
      fetchOverview();
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || err?.message || 'Failed to update topic status.');
    }
  };

  // Delete topic
  const handleDeleteTopic = async (topic: SubjectTopic) => {
    if (!window.confirm(`Are you sure you want to delete topic "${topic.title}"?`)) {
      return;
    }
    try {
      await AcademicsApi.deleteSubjectTopic(topic.id);
      showToast(`Topic "${topic.title}" deleted successfully.`);
      await fetchTopics();
      fetchOverview();
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || err?.message || 'Failed to delete topic.');
    }
  };

  // Reorder topics in list
  const handleReorderTopic = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const reordered = [...topics];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Build payload with new order indexes
    const items = reordered.map((t, idx) => ({
      id: t.id,
      orderIndex: idx + 1,
    }));

    // Optimistic UI update
    setTopics(reordered.map((t, idx) => ({ ...t, orderIndex: idx + 1 })));

    try {
      await AcademicsApi.reorderSubjectTopics(items);
      showToast('Topics reordered successfully.');
    } catch {
      await fetchTopics();
    }
  };

  // Submit handler from modal (create or update)
  const handleModalSubmit = async (payload: {
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
  }) => {
    if (!selectedSubject?.id || !selectedClass?.id) {
      throw new Error('Please select an assigned subject and class first.');
    }

    if (editingTopic) {
      // Update
      await AcademicsApi.updateSubjectTopic(editingTopic.id, {
        ...payload,
        classId: selectedClass.id,
        termId: selectedTermId || undefined,
      });
      showToast(`Topic "${payload.title}" updated successfully.`);
    } else {
      // Create
      await AcademicsApi.createSubjectTopic(selectedSubject.id, {
        ...payload,
        classId: selectedClass.id,
        termId: selectedTermId || undefined,
        academicYearId: activeAcademicYear?.id,
        orderIndex: topics.length + 1,
      });
      showToast(`Topic "${payload.title}" created successfully with ${payload.subTopics.length} subtopics.`);
    }

    await fetchTopics();
    fetchOverview();
  };

  // Filtered topics in active workspace
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase();
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.subTopics && t.subTopics.some((st) => st.toLowerCase().includes(q))) ||
        (t.learningObjectives && t.learningObjectives.toLowerCase().includes(q))
    );
  }, [topics, searchQuery]);

  return (
    <div className="space-y-6" data-testid="scheme-of-work-dashboard">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          data-testid="scheme-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 animate-in fade-in"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/20 backdrop-blur rounded-lg text-blue-300">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Scheme of Work</h1>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm">
            Tanzanian standard curriculum sequence, syllabus topics &amp; multi-subtopic pedagogical planning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs bg-white/10 backdrop-blur px-3 py-2 rounded-xl border border-white/10">
            <div className="font-semibold text-white">{activeAcademicYear?.name || 'Academic Year'}</div>
            <div className="text-slate-300">{activeTerm?.name || 'Active Term'}</div>
          </div>
          {selectedSubject && selectedClass && (
            <button
              type="button"
              data-testid="add-main-topic-btn"
              onClick={() => {
                setEditingTopic(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Main Topic</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Teacher Summary Dashboard (when no specific subject-class is selected) */}
      {!selectedSubject || !selectedClass ? (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Teaching Subjects</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900" data-testid="kpi-total-subjects">
                {isLoadingOverview ? '...' : overview?.summary.totalSubjects ?? 0}
              </div>
              <span className="text-[11px] text-slate-400">Assigned officially to you</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Teaching Classes</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900" data-testid="kpi-total-classes">
                {isLoadingOverview ? '...' : overview?.summary.totalClasses ?? 0}
              </div>
              <span className="text-[11px] text-slate-400">Unique classes / streams</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Subject-Class Pairs</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900" data-testid="kpi-total-combinations">
                {isLoadingOverview ? '...' : overview?.summary.totalCombinations ?? 0}
              </div>
              <span className="text-[11px] text-slate-400">Active allocations</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Scheme Completion</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900" data-testid="kpi-overall-completion">
                {isLoadingOverview ? '...' : `${overview?.summary.overallCompletion ?? 0}%`}
              </div>
              <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${overview?.summary.overallCompletion ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Overview Error Message */}
          {overviewError && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{overviewError}</span>
            </div>
          )}

          {/* Assigned Subjects & Classes Table / Cards Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-blue-600" />
                  <span>My Assigned Teaching Subjects &amp; Classes</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any subject-class combination to build or manage its independent Scheme of Work.
                </p>
              </div>

              {/* Term Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  data-testid="term-selector"
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Academic Terms</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={fetchOverview}
                  title="Refresh Overview"
                  className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isLoadingOverview ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading assigned subjects and classes...
              </div>
            ) : !overview || overview.subjects.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Teaching Assignments Found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You are not currently assigned to teach any subjects or classes. Contact the Academic Master or Administrator to allocate teaching assignments.
                </p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="assigned-subjects-table">
                {overview.subjects.map((subGroup) => (
                  <div
                    key={subGroup.subjectId}
                    data-testid={`subject-group-${subGroup.subjectCode}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-mono text-xs font-bold">
                          {subGroup.subjectCode}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{subGroup.subjectName}</h4>
                          <span className="text-[11px] text-slate-500">
                            {subGroup.classes.length} assigned class(es)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Classes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subGroup.classes.map((cls) => (
                        <div
                          key={cls.classId}
                          data-testid={`class-card-${subGroup.subjectCode}-${cls.className}`}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{cls.className}</span>
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                {cls.level}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                              <span>
                                <strong>{cls.topicsPlanned}</strong> planned topic(s)
                              </span>
                              <span className="text-emerald-700 font-semibold">
                                {cls.topicsCompleted} completed
                              </span>
                            </div>
                            <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${cls.progressPercentage}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            data-testid={`select-combination-${subGroup.subjectCode}-${cls.className}`}
                            onClick={() => handleSelectCombination(subGroup, cls)}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <span>Manage Scheme</span>
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW 2: Subject-and-Class-Specific Workspace */
        <div className="space-y-6" data-testid="subject-class-workspace">
          {/* Active Navigation Breadcrumb / Workspace Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-testid="back-to-overview-btn"
                onClick={handleBackToOverview}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All My Classes</span>
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-blue-700">{selectedSubject.name}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-indigo-800">{selectedClass.name}</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {topics.length} topic(s) defined for this class
                </span>
              </div>
            </div>

            {/* Term Switcher & Add Topic Shortcut */}
            <div className="flex items-center gap-2">
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Terms</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                data-testid="workspace-add-topic-btn"
                onClick={() => {
                  setEditingTopic(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Main Topic</span>
              </button>
            </div>
          </div>

          {/* Search & Topics Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                data-testid="search-topics-input"
                placeholder="Search topics, subtopics, or competencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Topics Error Alert */}
          {topicsError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{topicsError}</span>
            </div>
          )}

          {/* Topics List */}
          {isLoadingTopics ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading Scheme of Work topics for {selectedClass.name}...
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Topics Planned Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No scheme of work topics have been defined for {selectedSubject.name} in {selectedClass.name}. Start by adding the first Main Topic and its Subtopics.
              </p>
              <button
                type="button"
                data-testid="empty-state-add-topic-btn"
                onClick={() => {
                  setEditingTopic(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Main Topic</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4" data-testid="topics-list">
              {filteredTopics.map((topic, index) => {
                const isExpanded = Boolean(expandedTopicIds[topic.id]);
                const isCompleted = topic.status === 'COMPLETED';

                return (
                  <div
                    key={topic.id}
                    data-testid={`topic-card-${topic.id}`}
                    className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-2xs ${
                      isCompleted ? 'border-emerald-200/80' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Topic Main Card Header */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800 text-xs font-extrabold border border-blue-200">
                          {topic.orderIndex || index + 1}
                        </span>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className="text-sm font-bold text-slate-900"
                              data-testid={`topic-title-${topic.id}`}
                            >
                              {topic.title}
                            </h4>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isCompleted ? 'Completed' : 'In Progress'}
                            </span>
                            {topic.estimatedPeriods && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{topic.estimatedPeriods} Periods</span>
                              </span>
                            )}
                          </div>

                          {/* Subtopics Preview Badge List */}
                          {topic.subTopics && topic.subTopics.length > 0 && (
                            <div
                              className="mt-2 space-y-1.5"
                              data-testid={`subtopics-list-${topic.id}`}
                            >
                              <span className="text-[11px] font-bold text-slate-600 block">
                                Subtopics ({topic.subTopics.length}):
                              </span>
                              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 pl-1">
                                {topic.subTopics.map((st, sIdx) => (
                                  <li key={sIdx} className="font-medium text-slate-800">
                                    {st}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Topic Action Controls */}
                      <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                        {/* Toggle Complete */}
                        <button
                          type="button"
                          data-testid={`toggle-complete-${topic.id}`}
                          onClick={() => handleToggleComplete(topic)}
                          title={isCompleted ? 'Mark as In Progress' : 'Mark as Completed'}
                          className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                            isCompleted
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        {/* Edit Topic */}
                        <button
                          type="button"
                          data-testid={`edit-topic-${topic.id}`}
                          onClick={() => {
                            setEditingTopic(topic);
                            setIsModalOpen(true);
                          }}
                          title="Edit Topic & Subtopics"
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Reorder Up */}
                        <button
                          type="button"
                          data-testid={`reorder-topic-up-${topic.id}`}
                          disabled={index === 0}
                          onClick={() => handleReorderTopic(index, 'up')}
                          title="Move Topic Up"
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        {/* Reorder Down */}
                        <button
                          type="button"
                          data-testid={`reorder-topic-down-${topic.id}`}
                          disabled={index === filteredTopics.length - 1}
                          onClick={() => handleReorderTopic(index, 'down')}
                          title="Move Topic Down"
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        {/* Delete Topic */}
                        <button
                          type="button"
                          data-testid={`delete-topic-${topic.id}`}
                          onClick={() => handleDeleteTopic(topic)}
                          title="Delete Topic"
                          className="p-2 rounded-xl border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Expand Details Toggle */}
                        <button
                          type="button"
                          data-testid={`expand-topic-details-${topic.id}`}
                          onClick={() => toggleTopicDetails(topic.id)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Pedagogical Planning Information */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-3 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {topic.learningObjectives && (
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">
                                Specific Objectives:
                              </span>
                              <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                {topic.learningObjectives}
                              </p>
                            </div>
                          )}

                          {topic.learningActivities && (
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">
                                Teaching &amp; Learning Activities:
                              </span>
                              <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                {topic.learningActivities}
                              </p>
                            </div>
                          )}

                          {topic.learningResources && (
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">
                                Teaching &amp; Learning Resources:
                              </span>
                              <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                {topic.learningResources}
                              </p>
                            </div>
                          )}

                          {topic.assessmentMethods && (
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">
                                Assessment Methods:
                              </span>
                              <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                {topic.assessmentMethods}
                              </p>
                            </div>
                          )}
                        </div>

                        {(topic.plannedStartDate || topic.plannedEndDate || topic.remarks) && (
                          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <div>
                              {topic.plannedStartDate && (
                                <span>
                                  Planned: {new Date(topic.plannedStartDate).toLocaleDateString()}
                                  {topic.plannedEndDate
                                    ? ` to ${new Date(topic.plannedEndDate).toLocaleDateString()}`
                                    : ''}
                                </span>
                              )}
                            </div>
                            {topic.remarks && (
                              <div className="italic">Remarks: {topic.remarks}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Topic & Subtopics Create/Edit Modal */}
      <SchemeOfWorkTopicModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingTopic}
        subjectName={selectedSubject?.name}
        className={selectedClass?.name}
      />
    </div>
  );
};
