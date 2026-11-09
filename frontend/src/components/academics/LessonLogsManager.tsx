import React, { useState, useEffect } from 'react';
import { AcademicsApi } from '../../api/academics.api';
import { LessonLog, LessonLogStatus } from '../../types/academics.types';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import {
  BookCheck,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileText,
  Check,
} from 'lucide-react';

interface Props {
  classes: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
}

export const LessonLogsManager: React.FC<Props> = ({ classes, subjects }) => {
  const { hasPermission } = usePermissions();
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal: Record Lesson
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    lessonDate: new Date().toISOString().split('T')[0],
    status: 'TAUGHT' as LessonLogStatus,
    reasonForMissed: '',
    topic: '',
    objectives: '',
    notes: '',
  });

  // Modal: Review Lesson Log
  const [reviewingLog, setReviewingLog] = useState<LessonLog | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const isSupervisor = hasPermission(Permissions.REVIEW_LESSON_LOG) || hasPermission(Permissions.MANAGE_ACADEMICS);

  useEffect(() => {
    loadLogs();
  }, [selectedClassId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AcademicsApi.getLessonLogs({
        classId: selectedClassId || undefined,
      });
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load teacher lesson logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((formData.status === 'MISSED' || formData.status === 'CANCELLED') && !formData.reasonForMissed.trim()) {
      setError('A reason is strictly mandatory when recording a missed or cancelled lesson.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await AcademicsApi.recordLessonLog({
        classId: formData.classId,
        subjectId: formData.subjectId,
        lessonDate: formData.lessonDate,
        status: formData.status,
        reasonForMissed: formData.reasonForMissed || undefined,
        topic: formData.topic || undefined,
        objectives: formData.objectives || undefined,
        notes: formData.notes || undefined,
      });
      setSuccessMsg('Lesson sign-off recorded successfully.');
      setShowModal(false);
      setFormData({
        classId: '',
        subjectId: '',
        lessonDate: new Date().toISOString().split('T')[0],
        status: 'TAUGHT',
        reasonForMissed: '',
        topic: '',
        objectives: '',
        notes: '',
      });
      await loadLogs();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record lesson log');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewingLog) return;
    try {
      setActionLoading(true);
      setError(null);
      await AcademicsApi.reviewLessonLog(reviewingLog.id, reviewNotes || undefined);
      setSuccessMsg('Lesson log reviewed and verified.');
      setReviewingLog(null);
      setReviewNotes('');
      await loadLogs();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review lesson log');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookCheck className="w-5 h-5 text-indigo-600" />
            Teacher Lesson Sign-off &amp; Curriculum Logs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit taught, missed, and cancelled lessons with curriculum syllabus tracking
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} className="mr-1.5" />
            Record Lesson Sign-off
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Signed-off Lesson History</h4>
          <span className="text-xs text-slate-500 font-medium">{logs.length} Records</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs font-medium text-slate-500">Loading lesson logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No lesson logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Topic / Objectives</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Review</th>
                  {isSupervisor && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {new Date(log.lessonDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.teacher?.firstName} {log.teacher?.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.class?.name}</td>
                    <td className="py-3 px-4 text-slate-700">{log.subject?.name}</td>
                    <td className="py-3 px-4 max-w-xs">
                      {log.status === 'MISSED' || log.status === 'CANCELLED' ? (
                        <span className="text-rose-700 font-medium block">
                          Reason: {log.reasonForMissed || 'Not specified'}
                        </span>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-900 block">{log.topic || '-'}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{log.objectives}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'TAUGHT' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          Taught
                        </span>
                      )}
                      {log.status === 'MISSED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                          Missed
                        </span>
                      )}
                      {log.status === 'CANCELLED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.reviewedAt ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check size={12} /> Verified
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending Review</span>
                      )}
                    </td>
                    {isSupervisor && (
                      <td className="py-3 px-4 text-right">
                        {!log.reviewedAt && (
                          <button
                            onClick={() => setReviewingLog(log)}
                            className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                          >
                            Verify Log
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Teacher Lesson Sign-off</h3>
            <form onSubmit={handleRecordSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lesson Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.lessonDate}
                    onChange={(e) => setFormData({ ...formData, lessonDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as LessonLogStatus })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="TAUGHT">TAUGHT (Delivered as scheduled)</option>
                    <option value="MISSED">MISSED (Teacher absent or missed slot)</option>
                    <option value="CANCELLED">CANCELLED (School activity / emergency)</option>
                  </select>
                </div>
              </div>

              {formData.status !== 'TAUGHT' && (
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">
                    Reason for Missed / Cancelled Lesson *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teacher attended official inter-school examination seminar..."
                    value={formData.reasonForMissed}
                    onChange={(e) => setFormData({ ...formData, reasonForMissed: e.target.value })}
                    className="w-full p-2 border border-rose-300 rounded-lg focus:border-rose-500"
                  />
                </div>
              )}

              {formData.status === 'TAUGHT' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Curriculum Topic *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Photosynthesis and Light Dependent Reactions"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Learning Objectives</label>
                    <input
                      type="text"
                      placeholder="e.g. Students able to explain ATP generation in chloroplasts"
                      value={formData.objectives}
                      onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supporting Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Observations, homework assigned, or follow-up notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Sign-off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Verify Lesson Sign-off</h3>
            <p className="text-slate-600">
              Verifying lesson recorded by {reviewingLog.teacher?.firstName} {reviewingLog.teacher?.lastName} for{' '}
              {reviewingLog.class?.name} on {new Date(reviewingLog.lessonDate).toLocaleDateString()}.
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Review Notes (Optional)</label>
              <textarea
                rows={3}
                placeholder="Supervisor feedback or verification comment..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewingLog(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReviewSubmit}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Verifying...' : 'Verify Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
