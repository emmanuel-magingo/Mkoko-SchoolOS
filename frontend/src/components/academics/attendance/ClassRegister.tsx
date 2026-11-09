import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Search,
  Save,
  CheckCheck,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { attendanceApi, AttendanceSession, AttendanceRecord } from '../../../api/attendance';
import { getClassStudents, submitClassAttendance } from '../../../api/attendance.api';
import { useAcademicContext } from '../../../contexts/AcademicContext';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface StudentAttendanceRow {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  status: AttendanceStatus;
  notes: string;
}

export interface ClassRegisterProps {
  classItem: {
    id: string;
    name: string;
    code?: string;
    stream?: string;
    level?: string;
  };
  date: string; // YYYY-MM-DD
  existingSession?: AttendanceSession | null;
  onClose?: () => void;
  onSuccess?: () => void;
  mockSubmit?: (payload: { sessionId: string; records: any[] }) => Promise<any>;
}

export const ClassRegister: React.FC<ClassRegisterProps> = ({
  classItem,
  date,
  existingSession: propSession,
  onClose,
  onSuccess,
  mockSubmit,
}) => {
  const { activeAcademicYearId, activeTermId } = useAcademicContext();

  const [students, setStudents] = useState<StudentAttendanceRow[]>(() => {
    if (propSession?.records && propSession.records.length > 0) {
      return propSession.records.map((rec) => ({
        studentId: rec.studentId,
        admissionNumber: rec.student?.admissionNumber || rec.studentId.slice(0, 8),
        firstName: rec.student?.firstName || 'Student',
        lastName: rec.student?.lastName || rec.studentId.slice(0, 4),
        status: rec.status as AttendanceStatus,
        notes: rec.notes || '',
      }));
    }
    return [];
  });
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(propSession || null);
  const [loading, setLoading] = useState<boolean>(() => !propSession?.records || propSession.records.length === 0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load students and previous session records
  const loadRegisterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch existing session if not provided via props
      let sessionData = propSession;
      if (!sessionData) {
        try {
          const sessions = await attendanceApi.getSessions({
            classId: classItem.id,
            dateFrom: date,
            dateTo: date,
          });
          if (sessions && sessions.length > 0) {
            sessionData = sessions[0];
            // If session doesn't include full records, fetch individual session
            if (sessionData && !sessionData.records) {
              const fullSession = await attendanceApi.getSession(sessionData.id);
              sessionData = fullSession;
            }
          }
        } catch {
          // Session doesn't exist yet (lazy initialization)
        }
      } else if (!sessionData.records) {
        try {
          const fullSession = await attendanceApi.getSession(sessionData.id);
          sessionData = fullSession;
        } catch {
          // Use propSession as is
        }
      }
      setCurrentSession(sessionData || null);

      // 2. Fetch enrolled students for this class
      let enrolledList: any[] = [];
      try {
        enrolledList = await getClassStudents(classItem.id);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load students for this class.');
        setStudents([]);
        return;
      }

      // 3. Map students to attendance rows, defaulting to PRESENT or using existing records
      const existingRecordsMap = new Map<string, AttendanceRecord>();
      if (sessionData?.records) {
        sessionData.records.forEach((rec) => {
          existingRecordsMap.set(rec.studentId, rec);
        });
      }

      if (enrolledList.length > 0) {
        const rows: StudentAttendanceRow[] = enrolledList.map((st) => {
          const rec = existingRecordsMap.get(st.id);
          return {
            studentId: st.id,
            admissionNumber: st.admissionNumber || st.id.slice(0, 8),
            firstName: st.firstName || '',
            lastName: st.lastName || '',
            status: rec ? (rec.status as AttendanceStatus) : 'PRESENT',
            notes: rec?.notes || '',
          };
        });
        setStudents(rows);
      } else if (sessionData?.records && sessionData.records.length > 0) {
        // Fallback: build list directly from existing session records if /students returned empty
        const rows: StudentAttendanceRow[] = sessionData.records.map((rec) => ({
          studentId: rec.studentId,
          admissionNumber: rec.student?.admissionNumber || rec.studentId.slice(0, 8),
          firstName: rec.student?.firstName || 'Student',
          lastName: rec.student?.lastName || rec.studentId.slice(0, 4),
          status: rec.status as AttendanceStatus,
          notes: rec.notes || '',
        }));
        setStudents(rows);
      } else {
        setStudents([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load class register data.');
    } finally {
      setLoading(false);
    }
  }, [classItem.id, date, propSession]);

  useEffect(() => {
    loadRegisterData();
  }, [loadRegisterData]);

  // Update status for a single student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  // Update remarks for a single student
  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s))
    );
  };

  // Bulk actions
  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === 'PRESENT').length;
    const absent = students.filter((s) => s.status === 'ABSENT').length;
    const late = students.filter((s) => s.status === 'LATE').length;
    const excused = students.filter((s) => s.status === 'EXCUSED').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [students]);

  // Idempotent Submission:
  // 1. Obtain or create AttendanceSession for (classId, date)
  // 2. Put records via /api/attendance/sessions/:id/records
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const recordsPayload: AttendanceRecord[] = students.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        notes: s.notes.trim() || undefined,
      }));

      // Testing/mock hook
      if (mockSubmit) {
        await mockSubmit({
          sessionId: currentSession?.id || 'mock-session-id',
          records: recordsPayload,
        });
        setSuccessMessage('Attendance register saved successfully!');
        if (onSuccess) onSuccess();
        return;
      }

      const savedResponse: any = await submitClassAttendance(
        classItem.id,
        date,
        recordsPayload,
        {
          academicYearId: activeAcademicYearId || undefined,
          termId: activeTermId || undefined,
          sessionType: 'DAILY',
        }
      );
      const savedSession = savedResponse?.data ?? savedResponse;
      if (savedSession?.id) {
        setCurrentSession(savedSession);
      }

      setSuccessMessage('Attendance register saved and synced successfully!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit attendance register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Back to Manifest"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Daily Attendance
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {date}
                </span>
                {currentSession?.status && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                    {currentSession.status}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {`Class Register: ${classItem.name}`}
              </h2>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex-wrap">
            <div className="text-center px-2 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Total</span>
              <span className="text-sm font-bold text-slate-800">{stats.total}</span>
            </div>
            <div className="text-center px-2 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-emerald-600 block uppercase">Present</span>
              <span className="text-sm font-bold text-emerald-700">{stats.present}</span>
            </div>
            <div className="text-center px-2 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-rose-600 block uppercase">Absent</span>
              <span className="text-sm font-bold text-rose-700">{stats.absent}</span>
            </div>
            <div className="text-center px-2 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-amber-600 block uppercase">Late</span>
              <span className="text-sm font-bold text-amber-700">{stats.late}</span>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-indigo-600 block uppercase">Rate</span>
              <span className="text-sm font-bold text-indigo-700">{`${stats.rate}%`}</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Bulk Actions */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name or admission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium">Bulk:</span>
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid Content */}
      <div className="flex-1 overflow-x-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-medium">Loading enrolled students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No students found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'No students match your search criteria.' : 'No students are currently enrolled in this class.'}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-32">Admission No.</th>
                  <th className="py-3 px-4 min-w-[180px]">Student Name</th>
                  <th className="py-3 px-4 min-w-[320px]">Attendance Status</th>
                  <th className="py-3 px-4 min-w-[200px]">Remarks / Absence Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {student.admissionNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {`${student.firstName} ${student.lastName}`}
                    </td>
                    <td className="py-3 px-4">
                      {/* Keyboard-Friendly Status Toggle Group */}
                      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                            student.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'LATE')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                            student.status === 'LATE'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'EXCUSED')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                            student.status === 'EXCUSED'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Excused
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder={student.status !== 'PRESENT' ? 'Reason for absence/delay...' : 'Optional notes...'}
                        value={student.notes}
                        onChange={(e) => handleNotesChange(student.studentId, e.target.value)}
                        className={`w-full px-2.5 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                          student.status === 'ABSENT' && !student.notes
                            ? 'border-amber-300 bg-amber-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Submit Action */}
      <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredStudents.length}</span> students.
          {currentSession ? ' Updates existing attendance session.' : ' Will initialize attendance session on submit.'}
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Register...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Submit & Sync Register</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
