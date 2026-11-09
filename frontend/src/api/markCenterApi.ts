import { api } from './client';

export interface ExaminationPeriod {
  id: string;
  name: string;
  category: 'MID_TERM' | 'TERMINAL' | 'ANNUAL' | 'MOCK' | 'NATIONAL_PREP';
  educationLevel?: 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL' | null;
  startDate: string;
  endDate: string;
  markEntryStartDate?: string | null;
  markEntryDeadline?: string | null;
  status:
    | 'DRAFT'
    | 'PREPARATION'
    | 'PUBLISHED'
    | 'EXAMINATION_IN_PROGRESS'
    | 'MARK_ENTRY'
    | 'ACADEMIC_REVIEW'
    | 'HEADTEACHER_APPROVAL'
    | 'APPROVED'
    | 'PUBLISHED_RESULTS'
    | 'CLOSED';
  gradingTemplate: 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL';
  gradingSystemId?: string | null;
  instructions?: string | null;
  academicReviewNotes?: string | null;
  headteacherApprovedAt?: string | null;
  headteacherApprovedBy?: { id: string; firstName: string; lastName: string } | null;
  headteacherRejectionReason?: string | null;
  publishedAt?: string | null;
  publishedBy?: { id: string; firstName: string; lastName: string } | null;
  resultsSnapshot?: any;
  academicYear?: { id: string; name: string };
  term?: { id: string; name: string };
  sessions?: any[];
  departmentNotices?: any[];
  papers?: any[];
  _count?: { sessions: number; papers: number; departmentNotices: number };
}

export const markCenterApi = {
  getPeriods: async (params?: { academicYearId?: string; termId?: string; status?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.academicYearId) query.append('academicYearId', params.academicYearId);
    if (params?.termId) query.append('termId', params.termId);
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);

    const qs = query.toString();
    const endpoint = `/mark-center/periods${qs ? `?${qs}` : ''}`;
    const res = await api.get<ExaminationPeriod[]>(endpoint);
    return res.data;
  },

  getPeriodById: async (id: string) => {
    const res = await api.get<ExaminationPeriod>(`/mark-center/periods/${id}`);
    return res.data;
  },

  createPeriod: async (data: any) => {
    const res = await api.post<ExaminationPeriod>('/mark-center/periods', data);
    return res.data;
  },

  updatePeriod: async (id: string, data: any) => {
    const res = await api.put<ExaminationPeriod>(`/mark-center/periods/${id}`, data);
    return res.data;
  },

  transitionPeriodStatus: async (id: string, status: string, reason?: string) => {
    const res = await api.post<ExaminationPeriod>(`/mark-center/periods/${id}/transition`, { status, reason });
    return res.data;
  },

  createTimetableSession: async (periodId: string, data: any) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/timetable-sessions`, data);
    return res.data;
  },

  deleteTimetableSession: async (sessionId: string) => {
    const res = await api.delete<any>(`/mark-center/timetable-sessions/${sessionId}`);
    return res.data;
  },

  assignSupervision: async (sessionId: string, data: any) => {
    const res = await api.post<any>(`/mark-center/sessions/${sessionId}/supervisions`, data);
    return res.data;
  },

  removeSupervision: async (supervisionId: string) => {
    const res = await api.delete<any>(`/mark-center/supervisions/${supervisionId}`);
    return res.data;
  },

  createDepartmentNotice: async (periodId: string, data: any) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/notices`, data);
    return res.data;
  },

  acknowledgeNotice: async (noticeId: string) => {
    const res = await api.post<any>(`/mark-center/notices/${noticeId}/acknowledge`);
    return res.data;
  },

  submitExaminationPaper: async (periodId: string, data: any) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/papers`, data);
    return res.data;
  },

  reviewExaminationPaper: async (paperId: string, data: any) => {
    const res = await api.post<any>(`/mark-center/papers/${paperId}/review`, data);
    return res.data;
  },

  recordMarks: async (periodId: string, data: any) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/marks`, data);
    return res.data;
  },

  getCompleteness: async (periodId: string, classId?: string) => {
    const qs = classId ? `?classId=${classId}` : '';
    const res = await api.get<any>(`/mark-center/periods/${periodId}/completeness${qs}`);
    return res.data;
  },

  returnMarksForCorrection: async (periodId: string, data: any) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/return-marks`, data);
    return res.data;
  },

  calculateResults: async (periodId: string, data?: any) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/calculate-results`, data || {});
    return res.data;
  },

  headteacherApproval: async (periodId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/headteacher-approval`, { action, reason });
    return res.data;
  },

  publishResults: async (periodId: string) => {
    const res = await api.post<any>(`/mark-center/periods/${periodId}/publish-results`);
    return res.data;
  },

  getParentResults: async (periodId: string, studentId: string) => {
    const res = await api.get<any>(`/mark-center/periods/${periodId}/parent-results/${studentId}`);
    return res.data;
  },
};
