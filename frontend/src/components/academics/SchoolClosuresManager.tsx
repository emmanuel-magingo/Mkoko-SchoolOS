import React, { useState, useEffect } from 'react';
import { AcademicsApi } from '../../api/academics.api';
import { SchoolClosure } from '../../types/academics.types';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import {
  CalendarOff,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface Props {
  classes: Array<{ id: string; name: string }>;
}

export const SchoolClosuresManager: React.FC<Props> = ({ classes }) => {
  const { hasPermission } = usePermissions();
  const [closures, setClosures] = useState<SchoolClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    classId: '',
  });

  const canManage = hasPermission(Permissions.MANAGE_CALENDAR) || hasPermission(Permissions.MANAGE_ACADEMICS);

  useEffect(() => {
    loadClosures();
  }, []);

  const loadClosures = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AcademicsApi.getSchoolClosures();
      setClosures(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load school closures');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.reason.trim()) {
      setError('Title and reason are required for school closures.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await AcademicsApi.createSchoolClosure({
        title: formData.title.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
        classId: formData.classId || undefined,
      });
      setSuccessMsg('Official school closure recorded. Attendance recording will be safely barred for these dates.');
      setShowModal(false);
      setFormData({
        title: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        classId: '',
      });
      await loadClosures();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record school closure');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete closure "${title}"? Attendance sessions will be allowed again.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await AcademicsApi.deleteSchoolClosure(id);
      setSuccessMsg('School closure deleted.');
      await loadClosures();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete closure');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-rose-600" />
            Exceptional School Closures &amp; Holiday Blocks
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Defines official non-school days to prevent invalid roll-call registers and lesson scheduling
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            <Plus size={14} className="mr-1.5" />
            Add School Closure
          </button>
        )}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Configured School Closures</h4>
          <span className="text-xs text-slate-500 font-medium">{closures.length} Records</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs font-medium text-slate-500">Loading closures...</div>
        ) : closures.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarOff className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No exceptional school closures configured.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Affected Scope</th>
                  <th className="py-3 px-4">Reason</th>
                  {canManage && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closures.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.title}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {new Date(c.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {new Date(c.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {c.class?.name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800 font-medium">
                          {c.class.name} only
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-800 font-semibold">
                          Entire School
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.reason}</td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(c.id, c.title)}
                          disabled={actionLoading}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded"
                          title="Delete closure"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Add Exceptional School Closure</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regional Sports Competition / Emergency Flood"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Class (Optional)</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Entire School (All Classes)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Official notice or directive explanation..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
