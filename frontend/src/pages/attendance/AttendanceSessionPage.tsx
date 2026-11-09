import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceApi, AttendanceSession, AttendanceRecord } from '../../api/attendance';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AttendanceSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSession(id);
    }
  }, [id]);

  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const res = await attendanceApi.getSession(sessionId);
      setSession(res);
      if (res.records) {
        setRecords(res.records);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, notes } : r))
    );
  };

  const handleSave = async () => {
    if (!session) return;
    try {
      setSaving(true);
      await attendanceApi.saveRecords(session.id, records);
      await loadSession(session.id);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save records');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!session) return;
    if (!window.confirm('Are you sure you want to finalize this session? This action cannot be undone.')) return;

    try {
      setSaving(true);
      await attendanceApi.finalizeSession(session.id);
      await loadSession(session.id);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to finalize session');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-semibold text-slate-500">Loading session details...</div>;
  }

  if (!session) {
    return <div className="p-8 text-center text-xs font-semibold text-slate-500">Session not found</div>;
  }

  const isEditable = session.status === 'DRAFT' || session.status === 'RECORDED';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attendance')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to Attendance"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Attendance Roll-Call Session
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Class: <span className="font-bold text-slate-800">{session.class?.name}</span> | Date:{' '}
              <span className="font-bold text-slate-800">{new Date(session.date).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={
              session.status === 'FINALIZED' ? 'success' : session.status === 'LOCKED' ? 'danger' : 'info'
            }
          >
            {session.status}
          </Badge>
          {isEditable && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleFinalize}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <CheckCircle className="w-4 h-4" />
                Finalize Session
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {records.map((record) => (
                <tr key={record.studentId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {record.student?.firstName} {record.student?.lastName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{record.student?.admissionNumber}</td>
                  <td className="py-3 px-4">
                    {isEditable ? (
                      <select
                        value={record.status || 'PRESENT'}
                        onChange={(e: any) => handleStatusChange(record.studentId, e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                      </select>
                    ) : (
                      <Badge
                        variant={
                          record.status === 'PRESENT'
                            ? 'success'
                            : record.status === 'ABSENT'
                            ? 'danger'
                            : record.status === 'LATE'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {record.status}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {isEditable ? (
                      <input
                        type="text"
                        value={record.notes || ''}
                        onChange={(e: any) => handleNotesChange(record.studentId, e.target.value)}
                        placeholder="Optional notes"
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                      />
                    ) : (
                      <span className="text-slate-500">{record.notes || '-'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
