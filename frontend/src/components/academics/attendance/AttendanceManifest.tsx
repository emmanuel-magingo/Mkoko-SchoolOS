import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Search,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { AttendanceSession } from '../../../api/attendance';
import { getDailyAttendanceManifest } from '../../../api/attendance.api';
import { useAuth } from '../../../contexts/AuthContext';

export type ManifestRegisterStatus = 'PENDING' | 'SUBMITTED' | 'EXCUSED';

export interface ClassManifestItem {
  id: string;
  name: string;
  classTeacherId?: string;
  code?: string;
  level?: string;
  stream?: string;
  classTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  status: ManifestRegisterStatus;
  session?: AttendanceSession | null;
  excusedReason?: string;
}

export interface AttendanceManifestProps {
  initialDate?: string;
  onSelectClassForRegister?: (classItem: ClassManifestItem, date: string, existingSession?: AttendanceSession | null) => void;
  mockClasses?: any[];
  mockSessions?: AttendanceSession[];
}

export const AttendanceManifest: React.FC<AttendanceManifestProps> = ({
  initialDate,
  onSelectClassForRegister,
  mockClasses,
  mockSessions,
}) => {
  const { user } = useAuth();
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayIso);
  const [classes, setClasses] = useState<any[]>(mockClasses || []);
  const [sessions, setSessions] = useState<AttendanceSession[]>(mockSessions || []);
  const [liveItems, setLiveItems] = useState<ClassManifestItem[] | null>(null);

  const [loading, setLoading] = useState<boolean>(!mockClasses);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ManifestRegisterStatus>('ALL');

  // Fetch classes, sessions for selected date, and closures
  const fetchManifestData = useCallback(async () => {
    // If mock data provided, do not fetch from remote
    if (mockClasses && mockSessions) {
      setClasses(mockClasses);
      setSessions(mockSessions);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call live daily manifest API
      const manifestResult = await getDailyAttendanceManifest(selectedDate);
      if (manifestResult?.items) {
        setLiveItems(manifestResult.items);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch attendance manifest.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, mockClasses, mockSessions]);

  useEffect(() => {
    fetchManifestData();
  }, [fetchManifestData]);

  // Project Manifest by comparing active classes against submitted sessions
  const manifestItems = useMemo<ClassManifestItem[]>(() => {
    let rawItems: ClassManifestItem[] = [];
    if (liveItems && !mockClasses) {
      rawItems = liveItems;
    } else {
      const sessionMap = new Map<string, AttendanceSession>();
      sessions.forEach((s) => {
        sessionMap.set(s.classId, s);
      });

      rawItems = classes.map((c) => {
        const session = sessionMap.get(c.id) || null;

        let status: ManifestRegisterStatus = 'PENDING';
        if (session) {
          status = 'SUBMITTED';
        }

        return {
          id: c.id,
          name: c.name,
          code: c.code,
          level: c.level || c.grade,
          stream: c.stream,
          classTeacher: c.classTeacher,
          status,
          session,
        };
      });
    }

    if (user?.role === 'TEACHER' && !mockClasses) {
      const teacherStaffProfileId = user?.staffProfileId || user?.id;
      const assignedClassIds = new Set(
        (user?.assignedClassesAsTeacher || []).map((ac) => ac.id)
      );

      return rawItems.filter((item: any) => {
        if (assignedClassIds.has(item.id)) return true;
        if (item.classTeacherId && (item.classTeacherId === user?.staffProfileId || item.classTeacherId === teacherStaffProfileId)) {
          return true;
        }
        if (
          item.classTeacher &&
          (item.classTeacher.id === user?.staffProfileId ||
            item.classTeacher.id === teacherStaffProfileId ||
            item.classTeacher.id === user?.id)
        ) {
          return true;
        }
        return false;
      });
    }

    return rawItems;
  }, [classes, sessions, liveItems, mockClasses, user]);

  // Metric summaries
  const metrics = useMemo(() => {
    const totalExpected = manifestItems.length;
    const submitted = manifestItems.filter((i) => i.status === 'SUBMITTED').length;
    const pending = manifestItems.filter((i) => i.status === 'PENDING').length;
    const excused = manifestItems.filter((i) => i.status === 'EXCUSED').length;
    const complianceRate = totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0;
    return { totalExpected, submitted, pending, excused, complianceRate };
  }, [manifestItems]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return manifestItems.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.stream && item.stream.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.classTeacher &&
          `${item.classTeacher.firstName} ${item.classTeacher.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [manifestItems, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Attendance Manifest
            </span>
            <span className="text-xs text-slate-400 font-mono">Lazy Initialization Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Daily Attendance Manifest</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time class register submissions and compliance across all active streams.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-slate-600">Register Date:</span>
            <input
              type="date"
              aria-label="Manifest Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={fetchManifestData}
            title="Refresh manifest"
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expected Registers
            </span>
            <span className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900" data-testid="metric-expected">
              {metrics.totalExpected}
            </span>
            <span className="text-xs text-slate-400">active classes</span>
          </div>
        </div>

        {/* Submitted */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Submitted
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700" data-testid="metric-submitted">
              {metrics.submitted}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              ({`${metrics.complianceRate}%`} compliance)
            </span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending / Missing
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700" data-testid="metric-pending">
              {metrics.pending}
            </span>
            <span className="text-xs text-amber-600 font-medium">action required</span>
          </div>
        </div>

        {/* Excused */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Excused / Closed
            </span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-700" data-testid="metric-excused">
              {metrics.excused}
            </span>
            <span className="text-xs text-slate-400">classes</span>
          </div>
        </div>
      </div>

      {/* Manifest Table & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search classes or teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({manifestItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              Pending ({metrics.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Submitted ({metrics.submitted})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('EXCUSED')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'EXCUSED'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              Excused ({metrics.excused})
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-medium">Projecting daily manifest...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No classes match criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or search queries.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-5">Class & Stream</th>
                  <th className="py-3 px-4">Level / Code</th>
                  <th className="py-3 px-4">Class Teacher</th>
                  <th className="py-3 px-4">Register Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                    data-testid={`manifest-row-${item.id}`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.stream && (
                        <div className="text-[11px] text-slate-500">Stream: {item.stream}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.level || item.code || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.classTeacher
                        ? `${item.classTeacher.firstName} ${item.classTeacher.lastName}`
                        : <span className="text-slate-400 italic">Not Assigned</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'SUBMITTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          SUBMITTED
                        </span>
                      ) : item.status === 'EXCUSED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                          EXCUSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => onSelectClassForRegister?.(item, selectedDate, item.session)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition inline-flex items-center gap-1.5"
                          data-testid={`btn-fill-register-${item.id}`}
                        >
                          <span>Fill Register</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : item.status === 'SUBMITTED' ? (
                        <button
                          type="button"
                          onClick={() => onSelectClassForRegister?.(item, selectedDate, item.session)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition inline-flex items-center gap-1.5"
                          data-testid={`btn-edit-register-${item.id}`}
                        >
                          <span>Edit Register</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {item.excusedReason || 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
