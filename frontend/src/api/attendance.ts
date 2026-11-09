import { api } from './client';

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  sessionType: string;
  status: 'DRAFT' | 'RECORDED' | 'FINALIZED' | 'LOCKED';
  class?: { name: string };
  teacher?: { firstName: string; lastName: string };
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
  student?: { admissionNumber: string; firstName: string; lastName: string };
}

export interface AttendanceSummary {
  enrolledStudents: number;
  attendanceCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  presentPercentage: number;
}

export const attendanceApi = {
  getAuthorizedClasses: async () => {
    const response = await api.get<any>('/api/attendance/classes');
    return (response?.data as any)?.data ?? response?.data ?? [];
  },

  getClassStudents: async (classId: string) => {
    const response = await api.get<any>(`/api/attendance/classes/${classId}/students`);
    return (response?.data as any)?.data ?? response?.data ?? [];
  },

  getSessions: async (filters?: { classId?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const response = await api.get<any>(`/api/attendance/sessions?${params.toString()}`);
    return (response?.data as any)?.data ?? response?.data ?? [];
  },

  getSession: async (id: string) => {
    const response = await api.get<any>(`/api/attendance/sessions/${id}`);
    return (response?.data as any)?.data ?? response?.data;
  },

  createSession: async (data: { academicYearId: string; termId: string; classId: string; date: string; sessionType: string }) => {
    const response = await api.post<any>('/api/attendance/sessions', data);
    return (response?.data as any)?.data ?? response?.data;
  },

  saveRecords: async (sessionId: string, records: AttendanceRecord[]) => {
    const response = await api.put<any>(`/api/attendance/sessions/${sessionId}/records`, { records });
    return (response?.data as any)?.data ?? response?.data;
  },

  finalizeSession: async (sessionId: string) => {
    const response = await api.post<any>(`/api/attendance/sessions/${sessionId}/finalize`);
    return (response?.data as any)?.data ?? response?.data;
  },

  getClassSummary: async (classId: string, filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    
    const response = await api.get<any>(`/api/attendance/summary/classes/${classId}?${params.toString()}`);
    return (response?.data as any)?.data ?? response?.data;
  },

  getStudentHistory: async (studentId: string) => {
    const response = await api.get<any>(`/api/attendance/history/students/${studentId}`);
    return (response?.data as any)?.data ?? response?.data;
  },

  getMissingRegisters: async (filters: { startDate: string; endDate: string; classId?: string }) => {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.classId) params.append('classId', filters.classId);

    const response = await api.get<{
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
    }>(`/attendance/missing-registers?${params.toString()}`);
    return response.data;
  }
};

export {
  getTodayTeacherSchedule,
  submitLessonLog,
  getDailyAttendanceManifest,
  getClassStudents,
  submitClassAttendance,
  getSubjectSyllabusNodes,
  STANDARD_SYLLABUS_NODES,
} from './attendance.api';

export type {
  ManifestRegisterStatus,
  ClassManifestItem,
  DailyAttendanceManifestResult,
  EnrolledStudent,
  TodaySchedulePeriod,
  TodayTeacherScheduleResult,
  SubmitLessonLogPayload,
  AttendanceRecordInput,
} from './attendance.api';
