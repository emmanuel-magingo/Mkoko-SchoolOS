import React, { useEffect, useState } from 'react';
import { attendanceApi, AttendanceSession } from '../../api/attendance';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import {
  CalendarCheck,
  Plus,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  Filter,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

interface MissingRegistersData {
  startDate: string;
  endDate: string;
  totalExpected: number;
  totalSubmitted: number;
  totalMissing: number;
  completionRate: string;
  missingSessions: Array<{
    date: string;
    sessionType: string;
    classId: string;
    className: string;
    classLevel: string;
    classStream: string;
    teacherName: string;
  }>;
}

export const AttendanceDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'missing'>('sessions');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [missingData, setMissingData] = useState<MissingRegistersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Missing Registers
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(oneWeekAgo);
  const [endDate, setEndDate] = useState(today);

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    } else {
      loadMissingRegisters();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getSessions();
      setSessions(res);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadMissingRegisters = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getMissingRegisters({ startDate, endDate });
      setMissingData(res);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to calculate missing registers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral" size="sm">Draft</Badge>;
      case 'RECORDED':
        return <Badge variant="info" size="sm">Recorded</Badge>;
      case 'FINALIZED':
        return <Badge variant="success" size="sm">Finalized</Badge>;
      case 'LOCKED':
        return <Badge variant="danger" size="sm">Locked</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-indigo-600" />
            Attendance Management
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Track daily class roll-calls, monitor missing registers on school days, and review audit history
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(hasPermission(Permissions.RECORD_ATTENDANCE) || hasPermission(Permissions.MANAGE_ATTENDANCE)) && (
            <button
              id="new-attendance-session-btn"
              onClick={() => navigate('/attendance/new')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Recorded Sessions
        </button>
        {(hasPermission(Permissions.VIEW_MISSING_REGISTERS) || hasPermission(Permissions.MANAGE_ATTENDANCE)) && (
          <button
            onClick={() => setActiveTab('missing')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'missing'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            Missing Registers Monitor
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Recorded Sessions */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Attendance Sessions</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-400">No attendance sessions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {new Date(session.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{session.class?.name || 'Unknown Class'}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{session.sessionType}</td>
                      <td className="py-3 px-4">{getStatusBadge(session.status)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/attendance/${session.id}`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                        >
                          {session.status === 'DRAFT' || session.status === 'RECORDED' ? 'Edit Roll-call' : 'View Session'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Missing Registers */}
      {activeTab === 'missing' && (
        <div className="space-y-6">
          {/* Date Range Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <button
              onClick={loadMissingRegisters}
              className="px-4 py-1.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors ml-auto"
            >
              Update Report
            </button>
          </div>

          {/* KPI Summary Cards */}
          {missingData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Expected Registers</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{missingData.totalExpected}</p>
                <span className="text-[11px] text-slate-400">Valid school days & classes</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Submitted Registers</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{missingData.totalSubmitted}</p>
                <span className="text-[11px] text-emerald-500">Completed roll-calls</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Missing Registers</span>
                <p className="text-2xl font-bold text-rose-600 mt-1">{missingData.totalMissing}</p>
                <span className="text-[11px] text-rose-500">Overdue roll-calls</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Completion Rate</span>
                <p className="text-2xl font-bold text-brand-600 mt-1">{missingData.completionRate}</p>
                <span className="text-[11px] text-slate-400">Submission compliance</span>
              </div>
            </div>
          )}

          {/* Missing Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Missing Roll-calls by Class & Date
              </h3>
              <span className="text-xs text-slate-500">
                Calculated strictly against official school calendar & closures
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-500">
                Analyzing academic calendar and attendance submissions...
              </div>
            ) : missingData?.missingSessions.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">100% Attendance Compliance</h4>
                <p className="text-xs text-slate-500 mt-1">
                  All expected attendance sessions for official school days in this period have been submitted.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Level / Stream</th>
                      <th className="py-3 px-4">Session Type</th>
                      <th className="py-3 px-4">Assigned Teacher</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {missingData?.missingSessions.map((session, idx) => (
                      <tr key={`${session.classId}-${session.date}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {new Date(session.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{session.className}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {session.classLevel} - {session.classStream}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{session.sessionType}</td>
                        <td className="py-3 px-4 text-slate-600">{session.teacherName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <AlertTriangle size={12} /> Missing
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
