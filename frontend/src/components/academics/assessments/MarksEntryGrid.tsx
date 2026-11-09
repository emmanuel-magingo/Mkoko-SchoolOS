import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Search,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { AcademicsApi } from '../../../api/academics.api';
import { api } from '../../../api/client';
import { Assessment } from '../../../types/academics.types';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { Permissions } from '../../../types/permissions';

export type MarkSpecialStatus = 'NORMAL' | 'ABSENT' | 'EXEMPTED';

export interface StudentMarkEntry {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  score: number | null | ''; // null/empty string if not yet entered
  specialStatus: MarkSpecialStatus; // 'NORMAL' | 'ABSENT' | 'EXEMPTED'
  comments: string;
  validationError?: string | null;
}

export interface MarksEntryGridProps {
  assessment: Assessment & {
    subject?: { name: string; code?: string };
    class?: { name: string };
  };
  initialStudents?: any[];
  initialMarks?: any[];
  onBack?: () => void;
  onSuccess?: () => void;
  mockSaveDraft?: (payload: any[]) => Promise<any>;
  mockSubmitReview?: () => Promise<any>;
  mockReopen?: (reason: string) => Promise<any>;
}

export const validateMarkScore = (val: number | '' | null, maxScore: number): string | null => {
  if (val === '' || val === null) return null;
  if (isNaN(val)) return 'Invalid number';
  if (val < 0) return 'Score cannot be negative';
  if (val > maxScore) return `Score cannot exceed maximum of ${maxScore}`;
  return null;
};

export const MarksEntryGrid: React.FC<MarksEntryGridProps> = ({
  assessment,
  initialStudents,
  initialMarks,
  onBack,
  onSuccess,
  mockSaveDraft,
  mockSubmitReview,
  mockReopen,
}) => {
  const { activeTerm, activeAcademicYear } = useAcademicContext();
  const { hasPermission } = usePermissions();
  const canReopen = hasPermission(Permissions.REOPEN_GRADES) || hasPermission(Permissions.APPROVE_GRADES);

  const [currentStatus, setCurrentStatus] = useState<string>(assessment.status || 'DRAFT');
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopening, setReopening] = useState<boolean>(false);

  const maxScore = Number(assessment.maxScore) || 100;
  const isReadOnly =
    currentStatus === 'SUBMITTED' ||
    currentStatus === 'UNDER_REVIEW' ||
    currentStatus === 'APPROVED' ||
    currentStatus === 'LOCKED' ||
    (currentStatus as string) === 'FINALIZED';

  const [rows, setRows] = useState<StudentMarkEntry[]>(() => {
    if (initialStudents && initialStudents.length > 0) {
      const marksMap = new Map<string, any>();
      (initialMarks || []).forEach((m) => {
        marksMap.set(m.studentId, m);
      });

      return initialStudents.map((st) => {
        const mark = marksMap.get(st.id);
        let specialStatus: MarkSpecialStatus = 'NORMAL';
        if (mark?.comments?.includes('ABSENT') || mark?.status === 'ABSENT') specialStatus = 'ABSENT';
        if (mark?.comments?.includes('EXEMPTED') || mark?.status === 'EXEMPTED') specialStatus = 'EXEMPTED';

        const scoreVal =
          mark?.score !== undefined && mark?.score !== null && mark?.score !== ''
            ? Number(mark.score)
            : '';

        const validationError = specialStatus === 'NORMAL' && scoreVal !== ''
          ? validateMarkScore(Number(scoreVal), maxScore)
          : null;

        return {
          studentId: st.id,
          admissionNumber: st.admissionNumber || st.id.slice(0, 8),
          firstName: st.firstName || '',
          lastName: st.lastName || '',
          score: specialStatus !== 'NORMAL' ? null : scoreVal,
          specialStatus,
          comments: mark?.comments || '',
          validationError,
        };
      });
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(!initialStudents);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize or fetch students & existing marks
  const loadData = useCallback(async () => {
    if (initialStudents) {
      const marksMap = new Map<string, any>();
      (initialMarks || []).forEach((m) => {
        marksMap.set(m.studentId, m);
      });

      const initialRows: StudentMarkEntry[] = initialStudents.map((st) => {
        const mark = marksMap.get(st.id);
        let specialStatus: MarkSpecialStatus = 'NORMAL';
        if (mark?.comments?.includes('ABSENT') || mark?.status === 'ABSENT') specialStatus = 'ABSENT';
        if (mark?.comments?.includes('EXEMPTED') || mark?.status === 'EXEMPTED') specialStatus = 'EXEMPTED';

        const scoreVal = mark?.score !== undefined && mark?.score !== null && mark?.score !== ''
          ? Number(mark.score)
          : '';

        const validationError = specialStatus === 'NORMAL' && scoreVal !== ''
          ? validateMarkScore(Number(scoreVal), maxScore)
          : null;

        return {
          studentId: st.id,
          admissionNumber: st.admissionNumber || st.id.slice(0, 8),
          firstName: st.firstName || '',
          lastName: st.lastName || '',
          score: specialStatus !== 'NORMAL' ? null : scoreVal,
          specialStatus,
          comments: mark?.comments || '',
          validationError,
        };
      });
      setRows(initialRows);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Fetch marks and enrolled students for this assessment
      const res = await AcademicsApi.getMarks(assessment.id).catch(() => null);

      const enrolled = res?.data?.students || [];
      const loadedMarks = res?.data?.marks || [];

      // Fallback: If no students in assessment payload, fetch via /students?classId=
      let studentList = enrolled;
      if (studentList.length === 0 && assessment.classId) {
        const fallbackRes = await api.get<any>(`/students?classId=${assessment.classId}&limit=150`).catch(() => ({ data: [] }));
        studentList = Array.isArray(fallbackRes.data) ? fallbackRes.data : fallbackRes.data?.students || [];
      }

      const marksMap = new Map<string, any>();
      loadedMarks.forEach((m: any) => {
        marksMap.set(m.studentId, m);
      });

      const mapped: StudentMarkEntry[] = studentList.map((st: any) => {
        const mark = marksMap.get(st.id);
        let specialStatus: MarkSpecialStatus = 'NORMAL';
        if (mark?.comments?.includes('ABSENT') || mark?.status === 'ABSENT') specialStatus = 'ABSENT';
        if (mark?.comments?.includes('EXEMPTED') || mark?.status === 'EXEMPTED') specialStatus = 'EXEMPTED';

        const scoreVal = mark?.score !== undefined && mark?.score !== null && mark?.score !== ''
          ? Number(mark.score)
          : '';

        return {
          studentId: st.id,
          admissionNumber: st.admissionNumber || st.id.slice(0, 8),
          firstName: st.firstName || '',
          lastName: st.lastName || '',
          score: specialStatus !== 'NORMAL' ? null : scoreVal,
          specialStatus,
          comments: mark?.comments || '',
          validationError: null,
        };
      });

      setRows(mapped);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load assessment student marks.');
    } finally {
      setLoading(false);
    }
  }, [assessment.id, assessment.classId, initialStudents, initialMarks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validation function for an individual score
  const validateScore = (val: number | '' | null): string | null => {
    if (val === '' || val === null) return null;
    if (isNaN(val)) return 'Invalid number';
    if (val < 0) return 'Score cannot be negative';
    if (val > maxScore) return `Score cannot exceed maximum of ${maxScore}`;
    return null;
  };

  // Handle score change
  const handleScoreChange = (studentId: string, inputVal: string) => {
    if (isReadOnly) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;

        if (inputVal.trim() === '') {
          return {
            ...r,
            score: '',
            specialStatus: 'NORMAL',
            validationError: null,
          };
        }

        const num = Number(inputVal);
        const err = validateScore(num);

        return {
          ...r,
          score: isNaN(num) ? '' : num,
          specialStatus: 'NORMAL',
          validationError: err,
        };
      })
    );
  };

  // Handle special status toggle (ABSENT or EXEMPTED)
  const handleToggleSpecialStatus = (studentId: string, status: MarkSpecialStatus) => {
    if (isReadOnly) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;

        if (r.specialStatus === status) {
          // Revert to normal
          return {
            ...r,
            specialStatus: 'NORMAL',
            score: '',
            validationError: null,
          };
        }

        return {
          ...r,
          specialStatus: status,
          score: null, // explicit null for missing data (not treated as 0)
          comments: r.comments ? r.comments : (status === 'ABSENT' ? 'Student Absent' : 'Exempted from assessment'),
          validationError: null,
        };
      })
    );
  };

  // Handle comments change
  const handleCommentsChange = (studentId: string, comments: string) => {
    if (isReadOnly) return;
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, comments } : r))
    );
  };

  // Quick action: Mark all unentered as Absent
  const handleMarkUnenteredAbsent = () => {
    if (isReadOnly) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.score === '' && r.specialStatus === 'NORMAL') {
          return {
            ...r,
            specialStatus: 'ABSENT',
            score: null,
            comments: r.comments || 'Absent',
          };
        }
        return r;
      })
    );
  };

  // Compute validation state across grid
  const hasValidationErrors = useMemo(() => {
    return rows.some((r) => !!r.validationError);
  }, [rows]);

  // Compute metrics
  const stats = useMemo(() => {
    const total = rows.length;
    const scoredRows = rows.filter((r) => r.specialStatus === 'NORMAL' && r.score !== '' && r.score !== null);
    const entered = scoredRows.length;
    const absent = rows.filter((r) => r.specialStatus === 'ABSENT').length;
    const exempted = rows.filter((r) => r.specialStatus === 'EXEMPTED').length;
    const remaining = total - entered - absent - exempted;

    let average = 0;
    let highest = 0;
    if (scoredRows.length > 0) {
      const scores = scoredRows.map((r) => Number(r.score));
      const sum = scores.reduce((a, b) => a + b, 0);
      average = Math.round((sum / scores.length) * 10) / 10;
      highest = Math.max(...scores);
    }

    return { total, entered, absent, exempted, remaining, average, highest };
  }, [rows]);

  // Search filter
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.admissionNumber.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  // Save Draft
  const handleSaveDraft = async () => {
    if (hasValidationErrors) {
      setErrorMessage(`Please fix score validation errors before saving (max score: ${maxScore}).`);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Build payload: do not submit blank unentered scores as zero
      const marksPayload = rows
        .filter((r) => r.specialStatus !== 'NORMAL' || (r.score !== '' && r.score !== null))
        .map((r) => ({
          studentId: r.studentId,
          score: r.specialStatus === 'NORMAL' ? Number(r.score) : 0,
          comments: r.specialStatus !== 'NORMAL'
            ? `[${r.specialStatus}] ${r.comments}`.trim()
            : r.comments || undefined,
        }));

      if (mockSaveDraft) {
        await mockSaveDraft(marksPayload);
      } else {
        await AcademicsApi.enterMarks(assessment.id, marksPayload);
      }

      setSuccessMessage('Draft marks saved successfully.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error?.message || err?.message || 'Failed to save draft marks.');
    } finally {
      setSaving(false);
    }
  };

  // Submit for Review
  const handleSubmitReview = async () => {
    if (hasValidationErrors) {
      setErrorMessage(`Cannot submit: resolve validation errors exceeding max score (${maxScore}).`);
      return;
    }

    if (stats.entered === 0 && stats.absent === 0 && stats.exempted === 0) {
      setErrorMessage('Cannot submit an empty marksheet. Enter student scores before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // 1. Save all current marks first
      const marksPayload = rows
        .filter((r) => r.specialStatus !== 'NORMAL' || (r.score !== '' && r.score !== null))
        .map((r) => ({
          studentId: r.studentId,
          score: r.specialStatus === 'NORMAL' ? Number(r.score) : 0,
          comments: r.specialStatus !== 'NORMAL'
            ? `[${r.specialStatus}] ${r.comments}`.trim()
            : r.comments || undefined,
        }));

      if (mockSubmitReview) {
        if (mockSaveDraft) await mockSaveDraft(marksPayload);
        await mockSubmitReview();
      } else {
        await AcademicsApi.enterMarks(assessment.id, marksPayload);
        await AcademicsApi.submitAssessment(assessment.id);
      }

      setCurrentStatus('SUBMITTED');
      setSuccessMessage('Marks submitted for moderation and review. Marksheet is now locked.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error?.message || err?.message || 'Failed to submit marks for review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reopen Assessment for Editing (Authorized users: Headmaster / Academic Master)
  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      setErrorMessage('A mandatory reason is required to reopen an assessment for editing.');
      return;
    }

    try {
      setReopening(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (mockReopen) {
        await mockReopen(reopenReason.trim());
      } else {
        await AcademicsApi.reopenAssessment(assessment.id, reopenReason.trim());
      }

      setCurrentStatus('DRAFT');
      setShowReopenModal(false);
      setReopenReason('');
      setSuccessMessage('Assessment reopened successfully. Marks are now editable.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error?.message || err?.message || 'Failed to reopen assessment.');
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Back to assessments"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {assessment.type || 'EXAM'}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {`Max Score: ${maxScore}`}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border ${
                    currentStatus === 'APPROVED' || currentStatus === 'FINALIZED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : currentStatus === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  data-testid="assessment-status-badge"
                >
                  {currentStatus}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {`Marks Entry: ${assessment.name}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {`${assessment.subject?.name || 'Subject'} • ${assessment.class?.name || 'Class'}${
                  activeTerm?.name ? ` • ${activeTerm.name}` : ''
                }${activeAcademicYear?.name ? ` (${activeAcademicYear.name})` : ''}`}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex-wrap">
            <div className="text-center px-2.5 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Total</span>
              <span className="text-sm font-bold text-slate-800">{stats.total}</span>
            </div>
            <div className="text-center px-2.5 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-emerald-600 block uppercase">Entered</span>
              <span className="text-sm font-bold text-emerald-700">{stats.entered}</span>
            </div>
            <div className="text-center px-2.5 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-rose-600 block uppercase">Absent</span>
              <span className="text-sm font-bold text-rose-700">{stats.absent}</span>
            </div>
            <div className="text-center px-2.5 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-indigo-600 block uppercase">Class Avg</span>
              <span className="text-sm font-bold text-indigo-700">{stats.average}</span>
            </div>
            <div className="text-center px-2.5">
              <span className="text-[10px] font-semibold text-amber-600 block uppercase">Highest</span>
              <span className="text-sm font-bold text-amber-700">{stats.highest}</span>
            </div>
          </div>
        </div>

        {/* Read-Only Status Banner */}
        {isReadOnly && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                This assessment is in {currentStatus} status and is currently locked for review. Marks are read-only.
              </span>
            </div>
            {canReopen && (
              <button
                type="button"
                onClick={() => setShowReopenModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition inline-flex items-center gap-1.5 shrink-0"
                data-testid="btn-reopen-assessment"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Reopen for Editing</span>
              </button>
            )}
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name or admission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleMarkUnenteredAbsent}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                title="Mark all students with empty score as Absent"
              >
                Mark Unentered Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs" data-testid="marks-error-message">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs" data-testid="marks-success-message">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid Content */}
      <div className="flex-1 overflow-x-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-medium">Loading student marksheet...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No students found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'No students match your search criteria.' : 'No students found enrolled in this class.'}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-32">Admission No.</th>
                  <th className="py-3 px-4 min-w-[200px]">Student Name</th>
                  <th className="py-3 px-4 w-48">{`Score (0 - ${maxScore})`}</th>
                  <th className="py-3 px-4 w-44">Missing Data Option</th>
                  <th className="py-3 px-4 min-w-[200px]">Remarks / Moderation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.studentId}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      row.validationError ? 'bg-rose-50/40' : ''
                    }`}
                    data-testid={`marks-row-${row.studentId}`}
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {row.admissionNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {`${row.firstName} ${row.lastName}`}
                    </td>
                    <td className="py-3 px-4">
                      {row.specialStatus !== 'NORMAL' ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                            row.specialStatus === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {row.specialStatus}
                        </span>
                      ) : (
                        <div>
                          <input
                            type="number"
                            min="0"
                            max={maxScore}
                            step="0.5"
                            disabled={isReadOnly}
                            value={row.score === null || row.score === '' ? '' : row.score}
                            placeholder="Enter score..."
                            onChange={(e) => handleScoreChange(row.studentId, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'ArrowDown') {
                                e.preventDefault();
                                const nextInput = document.querySelector<HTMLInputElement>(
                                  `[data-testid="score-input-${filteredRows[idx + 1]?.studentId}"]`
                                );
                                nextInput?.focus();
                                nextInput?.select();
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prevInput = document.querySelector<HTMLInputElement>(
                                  `[data-testid="score-input-${filteredRows[idx - 1]?.studentId}"]`
                                );
                                prevInput?.focus();
                                prevInput?.select();
                              }
                            }}
                            className={`w-32 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                              row.validationError
                                ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            } disabled:bg-slate-100 disabled:text-slate-500`}
                            data-testid={`score-input-${row.studentId}`}
                          />
                          {row.validationError && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-1">
                              {row.validationError}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpecialStatus(row.studentId, 'ABSENT')}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                              row.specialStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                            data-testid={`btn-mark-absent-${row.studentId}`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpecialStatus(row.studentId, 'EXEMPTED')}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                              row.specialStatus === 'EXEMPTED'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                            data-testid={`btn-mark-exempted-${row.studentId}`}
                          >
                            Exempted
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={row.comments}
                        placeholder={row.specialStatus !== 'NORMAL' ? 'Reason for absence/exemption...' : 'Optional comment...'}
                        onChange={(e) => handleCommentsChange(row.studentId, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                        data-testid={`remarks-input-${row.studentId}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredRows.length}</span> students.
          {hasValidationErrors && (
            <span className="text-rose-600 font-semibold ml-2">
              {`Warning: Some scores exceed the maximum allowable score of ${maxScore}!`}
            </span>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || submitting || hasValidationErrors}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition flex items-center gap-1.5 shadow-2xs"
              data-testid="btn-save-draft"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-600" />
                  <span>Save Draft</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={saving || submitting || hasValidationErrors}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
              data-testid="btn-submit-review"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Reopen Assessment Modal Dialog (Authorized Users) */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Reopen Assessment for Editing</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                You are about to unlock this marksheet and reset its moderation status to <strong>DRAFT</strong>. A mandatory justification is required for the audit trail.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reopen Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify reason for reopening (e.g., student grade recalculation or correction)..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  data-testid="input-reopen-reason"
                />
              </div>
            </div>

            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopen}
                disabled={reopening || !reopenReason.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition"
                data-testid="btn-confirm-reopen"
              >
                {reopening ? 'Reopening...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
