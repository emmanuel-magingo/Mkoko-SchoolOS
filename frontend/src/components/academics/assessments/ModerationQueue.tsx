import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Search,
  X,
  Lock,
} from 'lucide-react';
import { AcademicsApi } from '../../../api/academics.api';
import { Assessment } from '../../../types/academics.types';
import { useAcademicContext } from '../../../contexts/AcademicContext';

export interface ModerationQueueProps {
  initialQueue?: Assessment[];
  mockApprove?: (id: string) => Promise<any>;
  mockReturnForCorrection?: (id: string, reason: string) => Promise<any>;
}

export const ModerationQueue: React.FC<ModerationQueueProps> = ({
  initialQueue,
  mockApprove,
  mockReturnForCorrection,
}) => {
  const { activeTermId } = useAcademicContext();

  const [queue, setQueue] = useState<Assessment[]>(initialQueue || []);
  const [loading, setLoading] = useState<boolean>(!initialQueue);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inspector modal state
  const [inspectingAssessment, setInspectingAssessment] = useState<Assessment | null>(null);
  const [marksData, setMarksData] = useState<{ assessment: any; students: any[]; marks: any[] } | null>(null);
  const [loadingMarks, setLoadingMarks] = useState<boolean>(false);

  // Correction return modal state
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch queue items
  const fetchQueue = useCallback(async () => {
    if (initialQueue) {
      setQueue(initialQueue);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await AcademicsApi.getAssessments({ termId: activeTermId || undefined });
      const all = res.data || [];
      // Moderation queue displays assessments in SUBMITTED or UNDER_REVIEW
      const pendingModeration = all.filter(
        (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
      );
      setQueue(pendingModeration);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, [activeTermId, initialQueue]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Inspect assessment marks
  const handleInspect = async (item: Assessment) => {
    setInspectingAssessment(item);
    setActionError(null);
    setCorrectionReason('');
    setShowReturnModal(false);

    try {
      setLoadingMarks(true);
      const res = await AcademicsApi.getMarks(item.id);
      setMarksData(res.data);
    } catch {
      // Set empty fallback
      setMarksData({ assessment: item, students: [], marks: [] });
    } finally {
      setLoadingMarks(false);
    }
  };

  // Close inspector
  const handleCloseInspector = () => {
    setInspectingAssessment(null);
    setMarksData(null);
    setShowReturnModal(false);
    setCorrectionReason('');
    setActionError(null);
  };

  // Approve action
  const handleApprove = async () => {
    if (!inspectingAssessment) return;

    try {
      setProcessingAction(true);
      setActionError(null);

      if (mockApprove) {
        await mockApprove(inspectingAssessment.id);
      } else {
        await AcademicsApi.approveAssessment(inspectingAssessment.id);
      }

      setSuccessMessage(`Assessment "${inspectingAssessment.name}" approved and locked successfully.`);
      // Remove from queue
      setQueue((prev) => prev.filter((a) => a.id !== inspectingAssessment.id));
      handleCloseInspector();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err?.message || 'Failed to approve assessment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Return for Correction action
  const handleConfirmReturn = async () => {
    if (!inspectingAssessment) return;
    if (!correctionReason.trim()) {
      setActionError('A mandatory reason or comment is required to return marks for correction.');
      return;
    }

    try {
      setProcessingAction(true);
      setActionError(null);

      if (mockReturnForCorrection) {
        await mockReturnForCorrection(inspectingAssessment.id, correctionReason.trim());
      } else {
        await AcademicsApi.rejectAssessment(inspectingAssessment.id, correctionReason.trim());
      }

      setSuccessMessage(`Assessment "${inspectingAssessment.name}" returned to teacher for correction.`);
      // Remove from queue
      setQueue((prev) => prev.filter((a) => a.id !== inspectingAssessment.id));
      handleCloseInspector();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || err?.message || 'Failed to return assessment for correction');
    } finally {
      setProcessingAction(false);
    }
  };

  // Filtered queue
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) return queue;
    const q = searchQuery.toLowerCase();
    return queue.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a as any).subject?.name?.toLowerCase().includes(q) ||
        (a as any).class?.name?.toLowerCase().includes(q)
    );
  }, [queue, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Departmental Moderation
            </span>
            <span className="text-xs text-slate-400 font-mono">HoDs & Academic Masters</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Assessment Moderation Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submitted marksheets, inspect student score distributions, and approve or return for correction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] font-bold text-amber-700 block uppercase">Pending Review</span>
            <span className="text-xl font-bold text-amber-900" data-testid="queue-count">
              {queue.length}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Queue Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter pending assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredQueue.length}</span> assessments
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-medium">Loading moderation queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto stroke-[1.5] text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Moderation Queue is Clear</p>
              <p className="text-xs text-slate-500 mt-1">
                All submitted marks have been approved and moderated for this term.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-5">Assessment</th>
                  <th className="py-3 px-4">Subject & Class</th>
                  <th className="py-3 px-4">Max Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredQueue.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                    data-testid={`queue-row-${item.id}`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.type || 'EXAM'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {(item as any).subject?.name || (item as any).subject?.code || 'Subject'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {(item as any).class?.name || 'Class'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {item.maxScore}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleInspect(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition inline-flex items-center gap-1.5"
                        data-testid={`btn-inspect-${item.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Moderate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inspector Modal */}
      {inspectingAssessment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                    {inspectingAssessment.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {`Max Score: ${inspectingAssessment.maxScore}`}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {`Inspect Marksheet: ${inspectingAssessment.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseInspector}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {actionError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingMarks ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-medium">Fetching submitted student marks...</p>
                </div>
              ) : (
                <>
                  {/* Marksheet Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-4 w-12 text-center">#</th>
                          <th className="py-2.5 px-4 w-32">Admission</th>
                          <th className="py-2.5 px-4">Student Name</th>
                          <th className="py-2.5 px-4 w-28">Score</th>
                          <th className="py-2.5 px-4 w-24">Grade</th>
                          <th className="py-2.5 px-4">Teacher Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {marksData?.students && marksData.students.length > 0 ? (
                          marksData.students.map((st: any, idx: number) => {
                            const mark = marksData.marks?.find((m: any) => m.studentId === st.id);
                            return (
                              <tr key={st.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-4 font-mono font-medium text-slate-700">{st.admissionNumber}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-900">{`${st.firstName} ${st.lastName}`}</td>
                                <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                                  {mark ? mark.score : <span className="text-slate-400 italic">Not Entered</span>}
                                </td>
                                <td className="py-2.5 px-4">
                                  {mark?.grade ? (
                                    <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 text-[11px]">
                                      {mark.grade}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-slate-600">{mark?.comments || '-'}</td>
                              </tr>
                            );
                          })
                        ) : marksData?.marks && marksData.marks.length > 0 ? (
                          marksData.marks.map((m: any, idx: number) => (
                            <tr key={m.id || idx} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-700">{m.student?.admissionNumber || m.studentId.slice(0, 8)}</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-900">
                                {m.student ? `${m.student.firstName} ${m.student.lastName}` : `Student ${idx + 1}`}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{m.score}</td>
                              <td className="py-2.5 px-4">
                                <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 text-[11px]">
                                  {m.grade || '-'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">{m.comments || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No marks records recorded for this assessment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Return for Correction Dialog */}
                  {showReturnModal && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        <span>Return Marks for Teacher Correction</span>
                      </div>
                      <p className="text-xs text-rose-700">
                        Specify the exact correction required (e.g. grading anomalies, missing students, or recalculation needed). This will transition the assessment back to OPEN/REJECTED.
                      </p>
                      <textarea
                        rows={3}
                        placeholder="Mandatory reason for returning mark sheet..."
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                        className="w-full p-2.5 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        data-testid="input-correction-reason"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReturnModal(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmReturn}
                          disabled={processingAction || !correctionReason.trim()}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition"
                          data-testid="btn-confirm-return"
                        >
                          {processingAction ? 'Returning...' : 'Confirm Return for Correction'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Decisions */}
            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Approving this assessment locks it against modifications and makes it available for report card generation.
              </span>
              <div className="flex items-center gap-2">
                {!showReturnModal && (
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(true)}
                    disabled={processingAction}
                    className="px-4 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                    data-testid="btn-return-for-correction"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Return for Correction</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={processingAction}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
                  data-testid="btn-approve-assessment"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{processingAction ? 'Approving...' : 'Approve & Lock Marks'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
