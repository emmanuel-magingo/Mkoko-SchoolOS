import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  Zap,
  Building2,
  Compass,
} from 'lucide-react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { AcademicsApi } from '../../api/academics.api';
import { Term, CalendarEvent, CalendarEventCategory, CalendarEventScope } from '../../types/academics.types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

type EducationLevelTab = 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL';

export const AcademicCalendarPage: React.FC = () => {
  const {
    academicYears,
    currentAcademicYear,
    currentAcademicYearId,
    setCurrentAcademicYearId,
    refreshAcademicData,
  } = useAcademicContext();

  const { hasPermission } = usePermissions();
  const canManage =
    hasPermission(Permissions.MANAGE_ACADEMICS) ||
    hasPermission(Permissions.MANAGE_CALENDAR);

  // Selected Academic Year
  const [selectedYearId, setSelectedYearId] = useState<string>(() => currentAcademicYearId || '');

  useEffect(() => {
    if (!selectedYearId && currentAcademicYearId) {
      setSelectedYearId(currentAcademicYearId);
    } else if (!selectedYearId && academicYears.length > 0) {
      const active = academicYears.find((y) => y.isActive) || academicYears[0];
      setSelectedYearId(active.id);
    }
  }, [currentAcademicYearId, academicYears, selectedYearId]);

  const selectedYear = useMemo(() => {
    return academicYears.find((y) => y.id === selectedYearId) || currentAcademicYear || null;
  }, [academicYears, selectedYearId, currentAcademicYear]);

  // Selected Education Level tab (PRIMARY, O_LEVEL, A_LEVEL)
  const [selectedLevel, setSelectedLevel] = useState<EducationLevelTab>('PRIMARY');

  // Terms and Events data
  const [terms, setTerms] = useState<Term[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Event category filter
  const [eventFilter, setEventFilter] = useState<'ALL' | CalendarEventCategory | 'SPECIAL_OPERATIONS'>('ALL');

  // Modals state
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [targetTermName, setTargetTermName] = useState<'Term 1' | 'Term 2'>('Term 1');
  const [termForm, setTermForm] = useState({
    startDate: '',
    endDate: '',
    midTermBreakStartDate: '',
    midTermBreakEndDate: '',
    isCurrent: false,
  });

  const [isCloseTermModalOpen, setIsCloseTermModalOpen] = useState(false);
  const [termToClose, setTermToClose] = useState<Term | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    category: CalendarEventCategory;
    scope: CalendarEventScope;
    educationLevel: 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL' | '';
    classId: string;
    classStream: string;
    isHoliday: boolean;
    isOperationalException: boolean;
  }>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    category: 'GOVERNMENT_DATE',
    scope: 'ALL',
    educationLevel: '',
    classId: '',
    classStream: '',
    isHoliday: false,
    isOperationalException: false,
  });

  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [yearForm, setYearForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });

  // Load terms & events
  const loadData = async (yearId?: string) => {
    const targetYearId = yearId || selectedYearId;
    if (!targetYearId) return;

    try {
      setIsLoading(true);
      setActionError(null);

      const [termsRes, eventsRes, classesRes] = await Promise.all([
        AcademicsApi.getTerms(targetYearId),
        AcademicsApi.getCalendarEvents({ academicYearId: targetYearId }),
        AcademicsApi.getClasses().catch(() => ({ data: [] })),
      ]);

      setTerms(Array.isArray(termsRes.data) ? termsRes.data : []);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to load calendar data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYearId) {
      loadData(selectedYearId);
    }
  }, [selectedYearId]);

  // Derived Term 1 & Term 2 for the currently selected level
  const levelTerms = useMemo(() => {
    const forLevel = terms.filter(
      (t) => t.educationLevel === selectedLevel || (!t.educationLevel && terms.length <= 2)
    );
    const term1 = forLevel.find((t) => t.name.toLowerCase().includes('1')) || null;
    const term2 = forLevel.find((t) => t.name.toLowerCase().includes('2')) || null;
    return { term1, term2 };
  }, [terms, selectedLevel]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (eventFilter === 'ALL') return true;
      if (eventFilter === 'SPECIAL_OPERATIONS') return ev.isOperationalException;
      return ev.category === eventFilter;
    });
  }, [events, eventFilter]);

  // Duration helpers
  const getDurationInWeeks = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 0;
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.round(diffDays / 7));
  };

  const getDurationInDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTermStatusBadge = (term: Term | null) => {
    if (!term) return null;
    if (term.isClosed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded-full">
          <Lock className="w-3 h-3 text-slate-500" />
          Closed
        </span>
      );
    }
    if (term.isCurrent) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full animate-pulse">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Active Term
        </span>
      );
    }
    const today = new Date().toISOString().split('T')[0];
    if (term.startDate > today) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-sky-50 text-sky-700 border border-sky-300 rounded-full">
          <Clock className="w-3 h-3 text-sky-600" />
          Upcoming
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 rounded-full">
        Current Cycle
      </span>
    );
  };

  // ==========================================================================
  // TERM ACTIONS
  // ==========================================================================
  const handleOpenConfigureTerm = (termNumber: 'Term 1' | 'Term 2', existing?: Term | null) => {
    if (!selectedYear) {
      setActionError('Please select or create an academic year first.');
      return;
    }
    setTargetTermName(termNumber);
    setEditingTerm(existing || null);

    if (existing) {
      setTermForm({
        startDate: existing.startDate ? existing.startDate.slice(0, 10) : '',
        endDate: existing.endDate ? existing.endDate.slice(0, 10) : '',
        midTermBreakStartDate: existing.midTermBreakStartDate ? existing.midTermBreakStartDate.slice(0, 10) : '',
        midTermBreakEndDate: existing.midTermBreakEndDate ? existing.midTermBreakEndDate.slice(0, 10) : '',
        isCurrent: Boolean(existing.isCurrent),
      });
    } else {
      const yearStart = selectedYear.startDate.slice(0, 10);
      const yearEnd = selectedYear.endDate.slice(0, 10);
      setTermForm({
        startDate: termNumber === 'Term 1' ? yearStart : '',
        endDate: termNumber === 'Term 2' ? yearEnd : '',
        midTermBreakStartDate: '',
        midTermBreakEndDate: '',
        isCurrent: false,
      });
    }

    setActionError(null);
    setIsTermModalOpen(true);
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termForm.startDate || !termForm.endDate) {
      setActionError('Please provide valid start and end dates for the term.');
      return;
    }
    if (new Date(termForm.startDate) >= new Date(termForm.endDate)) {
      setActionError('Term start date must be strictly before end date.');
      return;
    }

    // Mid-Term Break validation: exactly ONE mid-term break
    if (termForm.midTermBreakStartDate || termForm.midTermBreakEndDate) {
      if (!termForm.midTermBreakStartDate || !termForm.midTermBreakEndDate) {
        setActionError('Please provide both start and end dates for the mid-term break.');
        return;
      }
      if (new Date(termForm.midTermBreakStartDate) > new Date(termForm.midTermBreakEndDate)) {
        setActionError('Mid-term break start date must be before or equal to end date.');
        return;
      }
      if (
        termForm.midTermBreakStartDate < termForm.startDate ||
        termForm.midTermBreakEndDate > termForm.endDate
      ) {
        setActionError('Mid-term break dates must fall completely within the term dates.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const payload: Partial<Term> = {
        name: targetTermName,
        educationLevel: selectedLevel,
        startDate: termForm.startDate,
        endDate: termForm.endDate,
        midTermBreakStartDate: termForm.midTermBreakStartDate || null,
        midTermBreakEndDate: termForm.midTermBreakEndDate || null,
        isCurrent: termForm.isCurrent,
      };

      if (editingTerm) {
        await AcademicsApi.updateTerm(editingTerm.id, payload);
        setActionSuccess(`${targetTermName} for ${selectedLevel} updated successfully.`);
      } else {
        payload.academicYearId = selectedYear?.id;
        await AcademicsApi.createTerm(payload);
        setActionSuccess(`${targetTermName} for ${selectedLevel} configured successfully.`);
      }

      setIsTermModalOpen(false);
      setEditingTerm(null);
      await loadData();
      await refreshAcademicData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to save term.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateTerm = async (term: Term) => {
    try {
      setIsSubmitting(true);
      setActionError(null);
      await AcademicsApi.activateTerm(term.id);
      setActionSuccess(`${term.name} is now the active term for ${selectedLevel}.`);
      await loadData();
      await refreshAcademicData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to activate term.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromptCloseTerm = (term: Term) => {
    setTermToClose(term);
    setIsCloseTermModalOpen(true);
  };

  const handleConfirmCloseTerm = async () => {
    if (!termToClose) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await AcademicsApi.closeTerm(termToClose.id);
      setActionSuccess(
        `${termToClose.name} has been closed. Historical timetable and assessment records are now protected.`
      );
      setIsCloseTermModalOpen(false);
      setTermToClose(null);
      await loadData();
      await refreshAcademicData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to close term.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenTerm = async (term: Term) => {
    try {
      setIsSubmitting(true);
      setActionError(null);
      await AcademicsApi.reopenTerm(term.id);
      setActionSuccess(`${term.name} has been reopened.`);
      await loadData();
      await refreshAcademicData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to reopen term.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // EVENT ACTIONS
  // ==========================================================================
  const handleOpenAddEvent = (presetCategory?: CalendarEventCategory, isException = false) => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      startDate: selectedYear?.startDate.slice(0, 10) || '',
      endDate: selectedYear?.startDate.slice(0, 10) || '',
      category: presetCategory || 'GOVERNMENT_DATE',
      scope: 'ALL',
      educationLevel: '',
      classId: '',
      classStream: '',
      isHoliday: presetCategory === 'PUBLIC_HOLIDAY',
      isOperationalException: isException,
    });
    setActionError(null);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title,
      description: ev.description || '',
      startDate: ev.startDate.slice(0, 10),
      endDate: ev.endDate.slice(0, 10),
      category: ev.category,
      scope: ev.scope,
      educationLevel: (ev.educationLevel as any) || '',
      classId: ev.classId || '',
      classStream: ev.classStream || '',
      isHoliday: Boolean(ev.isHoliday),
      isOperationalException: Boolean(ev.isOperationalException),
    });
    setActionError(null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.startDate || !eventForm.endDate) {
      setActionError('Please provide event title and valid dates.');
      return;
    }
    if (new Date(eventForm.startDate) > new Date(eventForm.endDate)) {
      setActionError('Start date must be before or equal to end date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const payload: Partial<CalendarEvent> = {
        academicYearId: selectedYear?.id || null,
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || null,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        category: eventForm.category,
        scope: eventForm.scope,
        educationLevel: eventForm.educationLevel ? (eventForm.educationLevel as any) : null,
        classId: eventForm.classId || null,
        classStream: eventForm.classStream.trim() || null,
        isHoliday: eventForm.isHoliday || eventForm.category === 'PUBLIC_HOLIDAY',
        isOperationalException: eventForm.isOperationalException,
      };

      if (editingEvent) {
        await AcademicsApi.updateCalendarEvent(editingEvent.id, payload);
        setActionSuccess(`Event "${eventForm.title}" updated successfully.`);
      } else {
        await AcademicsApi.createCalendarEvent(payload);
        setActionSuccess(`Event "${eventForm.title}" added to academic calendar.`);
      }

      setIsEventModalOpen(false);
      setEditingEvent(null);
      await loadData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to save event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to remove this calendar entry?')) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await AcademicsApi.deleteCalendarEvent(id);
      setActionSuccess('Calendar entry removed.');
      await loadData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to delete event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // YEAR ACTIONS
  // ==========================================================================
  const handleOpenCreateYear = () => {
    const nextYear = new Date().getFullYear();
    setYearForm({
      name: `${nextYear}/${nextYear + 1}`,
      startDate: `${nextYear}-01-01`,
      endDate: `${nextYear}-12-31`,
      isActive: academicYears.length === 0,
    });
    setActionError(null);
    setIsYearModalOpen(true);
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name.trim() || !yearForm.startDate || !yearForm.endDate) {
      setActionError('Please fill out all academic year fields.');
      return;
    }
    if (new Date(yearForm.startDate) >= new Date(yearForm.endDate)) {
      setActionError('Start date must be earlier than end date.');
      return;
    }
    try {
      setIsSubmitting(true);
      setActionError(null);
      const res = await AcademicsApi.createYear({
        name: yearForm.name.trim(),
        startDate: yearForm.startDate,
        endDate: yearForm.endDate,
        isActive: yearForm.isActive,
      });
      setActionSuccess(`Academic Year "${res.data.name}" created.`);
      setIsYearModalOpen(false);
      setSelectedYearId(res.data.id);
      await refreshAcademicData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to save academic year.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateYear = async () => {
    if (!selectedYear) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await AcademicsApi.activateYear(selectedYear.id);
      setActionSuccess(`Academic Year "${selectedYear.name}" is now the active institutional cycle.`);
      await refreshAcademicData();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err.message || 'Failed to activate academic year.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventBadge = (category: CalendarEventCategory) => {
    switch (category) {
      case 'GOVERNMENT_DATE':
        return <Badge variant="info" size="sm">Government Date</Badge>;
      case 'PUBLIC_HOLIDAY':
        return <Badge variant="warning" size="sm">Public Holiday</Badge>;
      case 'EXAM':
        return <Badge variant="danger" size="sm">Examination</Badge>;
      case 'SPECIAL_PROGRAM':
        return <Badge variant="brand" size="sm">Special Program</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Event</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl border border-brand-100 shadow-xs">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Academic Calendar & Terms</h1>
            <p className="text-xs text-slate-500">
              Institutional academic year, independent term dates (Primary, O-Level, A-Level), mid-term breaks, and official events.
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddEvent()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Event / Program
            </button>
            <button
              onClick={handleOpenCreateYear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              New Academic Year
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-semibold text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-semibold text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Institutional Academic Year Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full">
                Institutional Academic Year
              </span>
              {selectedYear?.isActive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Year
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {selectedYear ? selectedYear.name : 'No Academic Year Configured'}
            </h2>
            {selectedYear && (
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(selectedYear.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' — '}
                  {new Date(selectedYear.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>•</span>
                <span>One Institutional Calendar Cycle</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
              <label htmlFor="academic-year-select" className="text-xs text-slate-300 pl-2 font-medium">Cycle:</label>
              <select
                id="academic-year-select"
                value={selectedYearId}
                onChange={(e) => {
                  setSelectedYearId(e.target.value);
                  setCurrentAcademicYearId(e.target.value);
                }}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isActive ? '★ (Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {canManage && selectedYear && !selectedYear.isActive && (
              <button
                onClick={handleActivateYear}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-brand-400 hover:bg-brand-300 rounded-xl transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Set Active
              </button>
            )}
          </div>
        </div>
      </div>

      {/* No Academic Year Configured Banner */}
      {!selectedYear && (
        <div className="p-6 bg-brand-50 border border-brand-200 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Initialize Institutional Academic Year</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              To configure Term 1 and Term 2 for Primary, O-Level, and A-Level, first define the active institutional academic cycle (e.g. 2026/2027).
            </p>
          </div>
          {canManage && (
            <button
              onClick={handleOpenCreateYear}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Academic Year
            </button>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 1: EDUCATION LEVEL TABS & TERM 1 / TERM 2 CARDS               */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {/* Education Level Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-600" />
              Education Level:
            </span>
            {(
              [
                { key: 'PRIMARY', label: 'Primary (Std 1–7)' },
                { key: 'O_LEVEL', label: 'Ordinary Secondary (Form 1–4)' },
                { key: 'A_LEVEL', label: 'Advanced Secondary (Form 5–6)' },
              ] as const
            ).map((tab) => {
              const count = terms.filter((t) => t.educationLevel === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedLevel(tab.key)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    selectedLevel === tab.key
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                      selectedLevel === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}/2 Terms
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-400 px-2">
            Independent term calendar per level
          </span>
        </div>

        {/* Two-Term Grid (Term 1 & Term 2 Only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TERM 1 CARD */}
          <div
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
              levelTerms.term1?.isCurrent
                ? 'border-brand-500 ring-2 ring-brand-500/10'
                : levelTerms.term1?.isClosed
                ? 'border-slate-300 bg-slate-50/50'
                : 'border-slate-200/90'
            }`}
          >
            {levelTerms.term1 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-brand-50 text-brand-700 border border-brand-200 rounded-lg">
                      TERM 1
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{selectedLevel}</span>
                  </div>
                  {getTermStatusBadge(levelTerms.term1)}
                </div>

                {/* Term Dates */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span className="text-slate-500">Term Duration:</span>
                    <span>{getDurationInWeeks(levelTerms.term1.startDate, levelTerms.term1.endDate)} Weeks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Opening Date:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(levelTerms.term1.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Closing Date:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(levelTerms.term1.endDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Dedicated Mid-Term Break (Exactly ONE) */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-amber-900">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-900">
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                      Mid-Term Break (Recess)
                    </span>
                    {levelTerms.term1.midTermBreakStartDate && levelTerms.term1.midTermBreakEndDate && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        {getDurationInDays(levelTerms.term1.midTermBreakStartDate, levelTerms.term1.midTermBreakEndDate)} Days
                      </span>
                    )}
                  </div>
                  {levelTerms.term1.midTermBreakStartDate && levelTerms.term1.midTermBreakEndDate ? (
                    <p className="text-[11px] text-amber-800 font-medium">
                      {new Date(levelTerms.term1.midTermBreakStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' — '}
                      {new Date(levelTerms.term1.midTermBreakEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600 italic">No mid-term break dates scheduled yet.</p>
                  )}
                </div>

                {levelTerms.term1.isClosed && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-100 p-2 rounded-lg">
                    🔒 Term closed: Timetable assignments and assessment records are archived and protected.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Term 1 Not Configured</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define Term 1 start/end dates and mid-term break for {selectedLevel}.
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleOpenConfigureTerm('Term 1', null)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Configure Term 1
                  </button>
                )}
              </div>
            )}

            {/* Actions for Term 1 */}
            {canManage && levelTerms.term1 && (
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!levelTerms.term1.isClosed && !levelTerms.term1.isCurrent && (
                    <button
                      onClick={() => handleActivateTerm(levelTerms.term1!)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                    >
                      Set Active
                    </button>
                  )}
                  {!levelTerms.term1.isClosed && (
                    <button
                      onClick={() => handleOpenConfigureTerm('Term 1', levelTerms.term1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Term & Break
                    </button>
                  )}
                </div>

                <div>
                  {levelTerms.term1.isClosed ? (
                    <button
                      onClick={() => handleReopenTerm(levelTerms.term1!)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromptCloseTerm(levelTerms.term1!)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Close Term
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TERM 2 CARD */}
          <div
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
              levelTerms.term2?.isCurrent
                ? 'border-brand-500 ring-2 ring-brand-500/10'
                : levelTerms.term2?.isClosed
                ? 'border-slate-300 bg-slate-50/50'
                : 'border-slate-200/90'
            }`}
          >
            {levelTerms.term2 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-brand-50 text-brand-700 border border-brand-200 rounded-lg">
                      TERM 2
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{selectedLevel}</span>
                  </div>
                  {getTermStatusBadge(levelTerms.term2)}
                </div>

                {/* Term Dates */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span className="text-slate-500">Term Duration:</span>
                    <span>{getDurationInWeeks(levelTerms.term2.startDate, levelTerms.term2.endDate)} Weeks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Opening Date:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(levelTerms.term2.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Closing Date:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(levelTerms.term2.endDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Dedicated Mid-Term Break (Exactly ONE) */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-amber-900">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-900">
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                      Mid-Term Break (Recess)
                    </span>
                    {levelTerms.term2.midTermBreakStartDate && levelTerms.term2.midTermBreakEndDate && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        {getDurationInDays(levelTerms.term2.midTermBreakStartDate, levelTerms.term2.midTermBreakEndDate)} Days
                      </span>
                    )}
                  </div>
                  {levelTerms.term2.midTermBreakStartDate && levelTerms.term2.midTermBreakEndDate ? (
                    <p className="text-[11px] text-amber-800 font-medium">
                      {new Date(levelTerms.term2.midTermBreakStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' — '}
                      {new Date(levelTerms.term2.midTermBreakEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600 italic">No mid-term break dates scheduled yet.</p>
                  )}
                </div>

                {levelTerms.term2.isClosed && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-100 p-2 rounded-lg">
                    🔒 Term closed: Timetable assignments and assessment records are archived and protected.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Term 2 Not Configured</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define Term 2 start/end dates and mid-term break for {selectedLevel}.
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleOpenConfigureTerm('Term 2', null)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Configure Term 2
                  </button>
                )}
              </div>
            )}

            {/* Actions for Term 2 */}
            {canManage && levelTerms.term2 && (
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!levelTerms.term2.isClosed && !levelTerms.term2.isCurrent && (
                    <button
                      onClick={() => handleActivateTerm(levelTerms.term2!)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                    >
                      Set Active
                    </button>
                  )}
                  {!levelTerms.term2.isClosed && (
                    <button
                      onClick={() => handleOpenConfigureTerm('Term 2', levelTerms.term2)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Term & Break
                    </button>
                  )}
                </div>

                <div>
                  {levelTerms.term2.isClosed ? (
                    <button
                      onClick={() => handleReopenTerm(levelTerms.term2!)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromptCloseTerm(levelTerms.term2!)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Close Term
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: GOVERNMENT DATES, EVENTS & SPECIAL OPERATIONS             */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Government Calendar, School Events & Special Operations
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official government opening/closing dates, national public holidays, examination milestones, and partial school operations.
            </p>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAddEvent('SPECIAL_PROGRAM', true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                + Record Special Program / Exception
              </button>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'ALL', label: 'All Entries' },
                { key: 'GOVERNMENT_DATE', label: 'Government Dates' },
                { key: 'PUBLIC_HOLIDAY', label: 'Public Holidays' },
                { key: 'EXAM', label: 'Examinations' },
                { key: 'SPECIAL_OPERATIONS', label: 'Special Operations' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setEventFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  eventFilter === f.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            {filteredEvents.length} calendar {filteredEvents.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Events Feed */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
            Loading calendar events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
            <CalendarRange className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No events or special programs in this category.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Add government dates, national holidays, or partial school operations for specific classes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  ev.isOperationalException
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getEventBadge(ev.category)}
                    <h3 className="text-sm font-bold text-slate-900">{ev.title}</h3>
                    {ev.isOperationalException && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-md">
                        <Zap className="w-3 h-3 text-amber-600" />
                        Partial Operation / Active while rest is closed
                      </span>
                    )}
                  </div>

                  {ev.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                  )}

                  {/* Scope & Dates */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {ev.startDate !== ev.endDate && ` – ${new Date(ev.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({getDurationInDays(ev.startDate, ev.endDate)} days)
                      </span>
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-1 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Target:{' '}
                      <strong className="text-slate-800 font-semibold">
                        {ev.scope === 'ALL'
                          ? 'Entire School'
                          : ev.scope === 'SPECIFIC_CLASSES' && ev.class
                          ? `Class: ${ev.class.name} (${ev.class.level})`
                          : ev.educationLevel
                          ? `${ev.educationLevel}`
                          : ev.scope}
                      </strong>
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => handleOpenEditEvent(ev)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: CONFIGURE TERM 1 / TERM 2 & MID-TERM BREAK                    */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isTermModalOpen}
        onClose={() => {
          setIsTermModalOpen(false);
          setEditingTerm(null);
        }}
        title={`Configure ${targetTermName} (${selectedLevel})`}
        description={`Set term start/end dates and the exactly one mid-term break for ${selectedLevel}.`}
      >
        <form onSubmit={handleSaveTerm} className="space-y-4 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Academic Year:</span>
              <strong className="text-slate-800">{selectedYear?.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Education Level:</span>
              <strong className="text-brand-700">{selectedLevel}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Term:</span>
              <strong className="text-slate-800">{targetTermName}</strong>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Term Operational Dates</h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term Start Date *</label>
                <input
                  type="date"
                  required
                  value={termForm.startDate}
                  onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term End Date *</label>
                <input
                  type="date"
                  required
                  value={termForm.endDate}
                  onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Exactly ONE Mid-Term Break */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>Mid-Term Break (Scheduled Academic Recess)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Every term has exactly one mid-term break. Dates must fall completely within the term dates.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">Break Start Date</label>
                <input
                  type="date"
                  value={termForm.midTermBreakStartDate}
                  onChange={(e) => setTermForm({ ...termForm, midTermBreakStartDate: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">Break End Date</label>
                <input
                  type="date"
                  value={termForm.midTermBreakEndDate}
                  onChange={(e) => setTermForm({ ...termForm, midTermBreakEndDate: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="set-term-current"
              checked={termForm.isCurrent}
              onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded-sm border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="set-term-current" className="text-xs text-slate-700 select-none font-medium">
              Set as active term for {selectedLevel} immediately
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTermModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'Saving...' : editingTerm ? 'Update Term & Break' : `Save ${targetTermName}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT CALENDAR EVENT OR SPECIAL PROGRAM                   */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        title={
          eventForm.isOperationalException
            ? 'Record Special Program / Partial Operation'
            : editingEvent
            ? 'Edit Calendar Entry'
            : 'Add Calendar Event / Government Date'
        }
        description="Official dates, holidays, exam periods, or special partial operations where selected classes remain in session."
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Milestone Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Official MoEST Reopening, Eid el-Fitr, CSEE Mock Exams, Form 4 Exam Camp"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={eventForm.category}
                onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as any })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden bg-white"
              >
                <option value="GOVERNMENT_DATE">Government Announcement / Date</option>
                <option value="PUBLIC_HOLIDAY">Public Holiday</option>
                <option value="EXAM">Examination Milestone</option>
                <option value="SPECIAL_PROGRAM">Special Academic Program</option>
                <option value="OTHER">Other School Event</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Scope</label>
              <select
                value={eventForm.scope}
                onChange={(e) => setEventForm({ ...eventForm, scope: e.target.value as any })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden bg-white"
              >
                <option value="ALL">Entire School (Institutional)</option>
                <option value="PRIMARY">Primary Level Only</option>
                <option value="O_LEVEL">Ordinary Secondary Only</option>
                <option value="A_LEVEL">Advanced Secondary Only</option>
                <option value="SPECIFIC_CLASSES">Specific Class / Stream</option>
              </select>
            </div>
          </div>

          {eventForm.scope === 'SPECIFIC_CLASSES' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Class</label>
              <select
                value={eventForm.classId}
                onChange={(e) => setEventForm({ ...eventForm, classId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden bg-white"
              >
                <option value="">-- Choose Target Class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level || c.stream})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={eventForm.endDate}
                onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Operational Exception Checkbox */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-operational-exception"
                checked={eventForm.isOperationalException}
                onChange={(e) => setEventForm({ ...eventForm, isOperationalException: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded-sm border-amber-300 focus:ring-amber-500"
              />
              <label htmlFor="is-operational-exception" className="text-xs font-bold text-amber-900 select-none">
                Special Program / Partial Operation Exception
              </label>
            </div>
            <p className="text-[11px] text-amber-800 pl-6 leading-tight">
              Check this if the targeted classes or level will continue operating while other classes or the rest of the school are on break.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Mandatory practical preparation for candidate streams."
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'Saving...' : editingEvent ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: CLOSE TERM CONFIRMATION                                        */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isCloseTermModalOpen}
        onClose={() => {
          setIsCloseTermModalOpen(false);
          setTermToClose(null);
        }}
        title="Confirm Term Closure"
        description="Term closure is a formal academic milestone action."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Data Protection Notice</span>
            </div>
            <p className="leading-relaxed">
              Closing <strong>{termToClose?.name} ({selectedLevel})</strong> will formally archive this cycle. Timetable lessons, attendance records, and assessment scores linked to this term will become <strong>read-only</strong> to preserve academic integrity.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCloseTermModalOpen(false);
                setTermToClose(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmCloseTerm}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'Closing...' : 'Confirm & Close Term'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: CREATE ACADEMIC YEAR                                          */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        title="Create Academic Year"
        description="Define an annual institutional calendar period."
      >
        <form onSubmit={handleSaveYear} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 2026/2027"
              value={yearForm.name}
              onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={yearForm.startDate}
                onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={yearForm.endDate}
                onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="year-active"
              checked={yearForm.isActive}
              onChange={(e) => setYearForm({ ...yearForm, isActive: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded-sm border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="year-active" className="text-xs text-slate-700 select-none">
              Set as active academic year immediately
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsYearModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Create Year'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AcademicCalendarPage;
