import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceApi } from '../../api/attendance';
import { ArrowLeft, AlertCircle, Calendar } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AttendanceHistoryPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      loadHistory(studentId);
    }
  }, [studentId]);

  const loadHistory = async (id: string) => {
    try {
      setLoading(true);
      const res = await attendanceApi.getStudentHistory(id);
      setHistory(res);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <Badge variant="success" size="sm">Present</Badge>;
      case 'ABSENT': return <Badge variant="danger" size="sm">Absent</Badge>;
      case 'LATE': return <Badge variant="warning" size="sm">Late</Badge>;
      case 'EXCUSED': return <Badge variant="info" size="sm">Excused</Badge>;
      default: return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Student Attendance History
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Complete historical roll-call records for student
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-400">No attendance history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Session Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {history.map((record, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {new Date(record.session.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{record.session.class?.name || 'Class'}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{record.session.sessionType}</td>
                    <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                    <td className="py-3 px-4 text-slate-500">{record.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
