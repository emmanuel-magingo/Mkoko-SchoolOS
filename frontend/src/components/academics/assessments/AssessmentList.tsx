import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Eye,
} from 'lucide-react';
import { AcademicsApi } from '../../../api/academics.api';
import { Assessment } from '../../../types/academics.types';
import { useAcademicContext } from '../../../contexts/AcademicContext';

export interface AssessmentListProps {
  onSelectAssessment?: (assessment: Assessment) => void;
  initialAssessments?: Assessment[];
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  onSelectAssessment,
  initialAssessments,
}) => {
  const { activeTermId } = useAcademicContext();

  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments || []);
  const [loading, setLoading] = useState<boolean>(!initialAssessments);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchAssessments = useCallback(async () => {
    if (initialAssessments) {
      setAssessments(initialAssessments);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await AcademicsApi.getAssessments({ termId: activeTermId || undefined });
      setAssessments(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [activeTermId, initialAssessments]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Filter assessments
  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const nameMatch = a.name.toLowerCase().includes(q);
      const subMatch = (a as any).subject?.name?.toLowerCase().includes(q) || false;
      const classMatch = (a as any).class?.name?.toLowerCase().includes(q) || false;

      const matchesSearch = !q || nameMatch || subMatch || classMatch;

      const currentStatus = a.status || 'DRAFT';
      const isOpen = currentStatus === 'DRAFT' || currentStatus === 'REJECTED' || (currentStatus as string) === 'OPEN';

      let matchesStatus = true;
      if (statusFilter === 'OPEN') {
        matchesStatus = isOpen;
      } else if (statusFilter === 'SUBMITTED') {
        matchesStatus = currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW';
      } else if (statusFilter === 'APPROVED') {
        matchesStatus = (currentStatus as string) === 'APPROVED' || (currentStatus as string) === 'FINALIZED' || (currentStatus as string) === 'LOCKED';
      } else if (statusFilter === 'PUBLISHED') {
        matchesStatus = (currentStatus as string) === 'PUBLISHED';
      } else if (statusFilter !== 'ALL') {
        matchesStatus = currentStatus === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [assessments, searchQuery, statusFilter]);

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            PUBLISHED
          </span>
        );
      case 'APPROVED':
      case 'FINALIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            APPROVED
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {status}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            RETURNED
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            LOCKED
          </span>
        );
      case 'OPEN':
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            OPEN / DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Assessment Operations
            </span>
            <span className="text-xs text-slate-400 font-mono">Sprint 5 Marks Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Assessment List & Marks Entry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an assessment to enter, update, or submit marks for departmental moderation.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'OPEN', 'SUBMITTED', 'APPROVED', 'PUBLISHED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              data-testid={`filter-status-${st.toLowerCase()}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by assessment, subject, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Found <span className="font-semibold text-slate-800">{filtered.length}</span> assessments
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-medium">Loading assessments...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No assessments found</p>
              <p className="text-xs text-slate-500 mt-1">Try selecting a different filter or search query.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-5">Assessment Name</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Max Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((item) => {
                  const status = item.status || 'DRAFT';
                  const isEditable = status === 'DRAFT' || status === 'REJECTED' || (status as string) === 'OPEN';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                      data-testid={`assessment-row-${item.id}`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.type || 'TEST'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {(item as any).subject?.name || (item as any).subject?.code || 'Subject'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {(item as any).class?.name || 'Class'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {item.maxScore}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isEditable ? (
                          <button
                            type="button"
                            onClick={() => onSelectAssessment?.(item)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition inline-flex items-center gap-1.5"
                            data-testid={`btn-enter-marks-${item.id}`}
                          >
                            <span>Enter Marks</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectAssessment?.(item)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition inline-flex items-center gap-1.5"
                            data-testid={`btn-view-marks-${item.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Marks</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
