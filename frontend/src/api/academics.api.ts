import { api } from './client';
import {
  AcademicYear,
  Term,
  CalendarEvent,
  Subject,
  Teacher,
  TeacherAssignment,
  AcademicDepartment,
  SubjectCombination,
  CurriculumCatalogueResponse,
  Assessment,
  LessonLog,
  SchoolClosure,
  ReportCard,
  InterventionPlan,
  DisciplineIncidentSummary,
  AcademicMeeting,
  MeetingActionItem,
  AcademicAuditLogEntry,
  SyllabusMainCompetence,
  SubjectTopic,
  SchemeOfWorkOverview,
  LessonPlan,
  CreateLessonPlanPayload,
  LessonPlanPrepopulation,
} from '../types/academics.types';

export const AcademicsApi = {
  createYear: async (data: Partial<AcademicYear>): Promise<{ data: AcademicYear }> => {
    return api.post<AcademicYear>('/academics/years', data);
  },
  updateYear: async (id: string, data: Partial<AcademicYear>): Promise<{ data: AcademicYear }> => {
    return api.put<AcademicYear>(`/academics/years/${id}`, data);
  },
  activateYear: async (id: string): Promise<{ data: AcademicYear }> => {
    return api.patch<AcademicYear>(`/academics/years/${id}/activate`, {});
  },
  createTerm: async (data: Partial<Term>): Promise<{ data: Term }> => {
    return api.post<Term>('/academics/terms', data);
  },
  updateTerm: async (id: string, data: Partial<Term>): Promise<{ data: Term }> => {
    return api.put<Term>(`/academics/terms/${id}`, data);
  },
  activateTerm: async (id: string): Promise<{ data: Term }> => {
    return api.patch<Term>(`/academics/terms/${id}/activate`, {});
  },
  closeTerm: async (id: string): Promise<{ data: Term }> => {
    return api.patch<Term>(`/academics/terms/${id}/close`, {});
  },
  reopenTerm: async (id: string): Promise<{ data: Term }> => {
    return api.patch<Term>(`/academics/terms/${id}/reopen`, {});
  },
  getSubjects: async (params?: { level?: string; departmentId?: string; classId?: string; status?: string }): Promise<{ data: Subject[] }> => {
    const query = new URLSearchParams();
    if (params?.level) query.append('level', params.level);
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.classId) query.append('classId', params.classId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<Subject[]>(`/academics/subjects${qs}`);
  },
  createSubject: async (data: Partial<Subject>): Promise<{ data: Subject }> => {
    return api.post<Subject>('/academics/subjects', data);
  },
  updateSubject: async (id: string, data: Partial<Subject>): Promise<{ data: Subject }> => {
    return api.put<Subject>(`/academics/subjects/${id}`, data);
  },
  deleteSubject: async (id: string): Promise<{ data: { message: string } }> => {
    return api.delete<{ message: string }>(`/academics/subjects/${id}`);
  },
  getTeacherAssignments: async (params?: { classId?: string; teacherId?: string; subjectId?: string }): Promise<{ data: TeacherAssignment[] }> => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.teacherId) query.append('teacherId', params.teacherId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<TeacherAssignment[]>(`/academics/assignments${qs}`);
  },
  assignTeacher: async (data: Partial<TeacherAssignment>): Promise<{ data: TeacherAssignment }> => {
    return api.post<TeacherAssignment>('/academics/assignments', data);
  },
  deleteTeacherAssignment: async (id: string): Promise<{ data?: any }> => {
    return api.delete(`/academics/assignments/${id}`);
  },
  getTeachers: async (): Promise<{ data: Teacher[] }> => {
    return api.get<Teacher[]>('/academics/teachers');
  },
  getTeacher: async (id: string): Promise<{ data: Teacher }> => {
    return api.get<Teacher>(`/academics/teachers/${id}`);
  },
  getDepartments: async (params?: { level?: string }): Promise<{ data: AcademicDepartment[] }> => {
    const qs = params?.level ? `?level=${params.level}` : '';
    return api.get<AcademicDepartment[]>(`/academics/departments${qs}`);
  },
  getAcademicDepartments: async (params?: { level?: string }): Promise<{ data: AcademicDepartment[] }> => {
    const qs = params?.level ? `?level=${params.level}` : '';
    return api.get<AcademicDepartment[]>(`/academics/departments${qs}`);
  },
  getDepartment: async (id: string): Promise<{ data: AcademicDepartment }> => {
    return api.get<AcademicDepartment>(`/academics/departments/${id}`);
  },
  createDepartment: async (data: { name: string; code?: string; hodId?: string | null; teacherIds?: string[]; subjectIds?: string[] }): Promise<{ data: AcademicDepartment }> => {
    return api.post<AcademicDepartment>('/academics/departments', data);
  },
  updateDepartment: async (id: string, data: { name?: string; code?: string; hodId?: string | null; teacherIds?: string[]; subjectIds?: string[] }): Promise<{ data: AcademicDepartment }> => {
    return api.put<AcademicDepartment>(`/academics/departments/${id}`, data);
  },
  deleteDepartment: async (id: string): Promise<{ data?: any }> => {
    return api.delete(`/academics/departments/${id}`);
  },
  assignTeacherDepartment: async (teacherId: string, departmentId: string | null): Promise<{ data: any }> => {
    return api.put(`/academics/teachers/${teacherId}/department`, { departmentId });
  },
  getCombinations: async (params?: { isActive?: boolean }): Promise<{ data: SubjectCombination[] }> => {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<SubjectCombination[]>(`/academics/combinations${qs}`);
  },
  getCombination: async (id: string): Promise<{ data: SubjectCombination }> => {
    return api.get<SubjectCombination>(`/academics/combinations/${id}`);
  },
  createCombination: async (data: { name: string; code: string; description?: string | null; subjectIds: string[] }): Promise<{ data: SubjectCombination }> => {
    return api.post<SubjectCombination>('/academics/combinations', data);
  },
  updateCombination: async (id: string, data: { name?: string; code?: string; description?: string | null; isActive?: boolean; subjectIds?: string[] }): Promise<{ data: SubjectCombination }> => {
    return api.put<SubjectCombination>(`/academics/combinations/${id}`, data);
  },
  deleteCombination: async (id: string): Promise<{ data: { message: string } }> => {
    return api.delete<{ message: string }>(`/academics/combinations/${id}`);
  },
  getCurriculumCatalogue: async (level?: string): Promise<{ data: CurriculumCatalogueResponse }> => {
    const qs = level ? `?level=${level}` : '';
    return api.get<CurriculumCatalogueResponse>(`/academics/curriculum/catalogue${qs}`);
  },
  getClasses: async (): Promise<{ data: any[] }> => {
    return api.get<any[]>('/classes');
  },
  createTeacher: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    subjectIds?: string[];
    departmentId?: string | null;
  }): Promise<{ data: Teacher }> => {
    return api.post<Teacher>('/academics/teachers', data);
  },
  updateTeacher: async (
    teacherId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      subjectIds?: string[];
      departmentId?: string | null;
    }
  ): Promise<{ data: Teacher }> => {
    return api.put<Teacher>(`/academics/teachers/${teacherId}`, data);
  },
  updateTeacherQualifications: async (
    teacherId: string,
    subjectIds: string[]
  ): Promise<{ data: Teacher }> => {
    return api.put<Teacher>(`/academics/teachers/${teacherId}/qualifications`, { subjectIds });
  },
  assignTeacherSubjects: async (
    teacherId: string,
    subjectIds: string[]
  ): Promise<{ data: Teacher }> => {
    return api.post<Teacher>(`/academics/teachers/${teacherId}/subjects`, { subjectIds });
  },
  removeTeacherSubject: async (
    teacherId: string,
    subjectId: string
  ): Promise<{ data: Teacher }> => {
    return api.delete<Teacher>(`/academics/teachers/${teacherId}/subjects/${subjectId}`);
  },
  getDepartmentReconciliationReport: async (): Promise<{ data: any }> => {
    return api.get<any>('/academics/departments/reconciliation-report');
  },
  createAssessment: async (data: Partial<Assessment>): Promise<{ data: Assessment }> => {
    return api.post<Assessment>('/academics/assessments', data);
  },
  enterMarks: async (assessmentId: string, marks: any[]): Promise<{ data: any }> => {
    return api.post<any>(`/academics/assessments/${assessmentId}/marks`, { marks });
  },
  getAssessments: async (params?: { classId?: string; subjectId?: string; termId?: string }): Promise<{ data: Assessment[] }> => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.termId) query.append('termId', params.termId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<Assessment[]>(`/academics/assessments${qs}`);
  },
  getMarks: async (assessmentId: string): Promise<{ data: any }> => {
    return api.get<any>(`/academics/assessments/${assessmentId}/marks`);
  },

  // Academic v2 Marks Workflow
  submitAssessment: async (assessmentId: string): Promise<{ data: Assessment }> => {
    return api.post<Assessment>(`/academics/assessments/${assessmentId}/submit`);
  },
  reviewAssessment: async (assessmentId: string): Promise<{ data: Assessment }> => {
    return api.post<Assessment>(`/academics/assessments/${assessmentId}/review`);
  },
  approveAssessment: async (assessmentId: string): Promise<{ data: Assessment }> => {
    return api.post<Assessment>(`/academics/assessments/${assessmentId}/approve`);
  },
  rejectAssessment: async (assessmentId: string, reason: string): Promise<{ data: Assessment }> => {
    return api.post<Assessment>(`/academics/assessments/${assessmentId}/reject`, { reason });
  },
  lockAssessment: async (assessmentId: string): Promise<{ data: Assessment }> => {
    return api.post<Assessment>(`/academics/assessments/${assessmentId}/lock`);
  },
  finalizeAssessment: async (assessmentId: string): Promise<{ data: Assessment }> => {
    return api.post<Assessment>(`/academics/assessments/${assessmentId}/finalize`);
  },
  reopenAssessment: async (assessmentId: string, reason: string): Promise<{ data: Assessment }> => {
    return api.post<Assessment>(`/academics/assessments/${assessmentId}/reopen`, { reason });
  },

  // Module A: Calendar & Closures
  getSchoolClosures: async (): Promise<{ data: SchoolClosure[] }> => {
    return api.get<SchoolClosure[]>('/academics/closures');
  },
  createSchoolClosure: async (data: { title: string; startDate: string; endDate: string; reason: string; classId?: string }): Promise<{ data: SchoolClosure }> => {
    return api.post<SchoolClosure>('/academics/closures', data);
  },
  deleteSchoolClosure: async (id: string): Promise<void> => {
    await api.delete(`/academics/closures/${id}`);
  },

  // Module F: Teacher Lesson Logs
  getLessonLogs: async (params?: { classId?: string; subjectId?: string; teacherId?: string; startDate?: string; endDate?: string; dateFrom?: string; dateTo?: string }): Promise<{ data: LessonLog[] }> => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.teacherId) query.append('teacherId', params.teacherId);
    const start = params?.startDate || params?.dateFrom;
    const end = params?.endDate || params?.dateTo;
    if (start) {
      query.append('startDate', start);
      query.append('dateFrom', start);
    }
    if (end) {
      query.append('endDate', end);
      query.append('dateTo', end);
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<LessonLog[]>(`/academics/lesson-logs${qs}`);
  },
  recordLessonLog: async (data: {
    timetablePeriodId?: string;
    classId: string;
    subjectId: string;
    topicId?: string | null;
    mainCompetenceId?: string | null;
    specificCompetenceId?: string | null;
    lessonDate: string;
    status: 'TAUGHT' | 'MISSED' | 'CANCELLED';
    reasonForMissed?: string;
    topic?: string;
    subTopic?: string;
    description?: string;
    activities?: string;
    objectives?: string;
    notes?: string;
    studentsPresent?: number | null;
    studentsTotal?: number | null;
    studentsAbsent?: number | null;
    markTopicCompleted?: boolean | null;
  }): Promise<{ data: LessonLog }> => {
    return api.post<LessonLog>('/academics/lesson-logs', data);
  },
  reviewLessonLog: async (id: string, notes?: string): Promise<{ data: LessonLog }> => {
    return api.post<LessonLog>(`/academics/lesson-logs/${id}/review`, { notes });
  },

  // 3-Tier Digital Approval Workflow
  submitLessonLogs: async (logIds: string[]): Promise<{ data: any }> => {
    return api.post('/academics/lesson-logs/submit', { logIds });
  },
  verifyDepartmentLessonLogs: async (logIds: string[], remarks?: string): Promise<{ data: any }> => {
    return api.post('/academics/lesson-logs/hod-verify', { logIds, remarks });
  },
  approveAcademicLessonLogs: async (logIds: string[], remarks?: string): Promise<{ data: any }> => {
    return api.post('/academics/lesson-logs/academic-approve', { logIds, remarks });
  },
  rejectLessonLogs: async (logIds: string[], remarks: string): Promise<{ data: any }> => {
    return api.post('/academics/lesson-logs/reject', { logIds, remarks });
  },

  // Teacher-Defined Scheme of Work / Subject Topics
  getClassEnrolmentCount: async (classId: string): Promise<{ data: { totalStudents: number } }> => {
    return api.get<{ totalStudents: number }>(`/academics/classes/${classId}/enrolment-count`);
  },
  getSchemeOfWorkOverview: async (params?: {
    termId?: string;
    academicYearId?: string;
    teacherId?: string;
  }): Promise<{ data: SchemeOfWorkOverview }> => {
    const q = new URLSearchParams();
    if (params?.termId) q.append('termId', params.termId);
    if (params?.academicYearId) q.append('academicYearId', params.academicYearId);
    if (params?.teacherId) q.append('teacherId', params.teacherId);
    const qs = q.toString();
    return api.get<SchemeOfWorkOverview>(`/academics/scheme-of-work/overview${qs ? `?${qs}` : ''}`);
  },
  getSubjectTopics: async (
    subjectId: string,
    options?: { classId?: string; termId?: string }
  ): Promise<{ data: SubjectTopic[] }> => {
    const q = new URLSearchParams();
    if (options?.classId) q.append('classId', options.classId);
    if (options?.termId) q.append('termId', options.termId);
    const qs = q.toString();
    return api.get<SubjectTopic[]>(`/academics/subjects/${subjectId}/topics${qs ? `?${qs}` : ''}`);
  },
  createSubjectTopic: async (
    subjectId: string,
    data: {
      title: string;
      classId?: string;
      orderIndex?: number;
      estimatedPeriods?: number;
      status?: string;
      termId?: string;
      academicYearId?: string;
      subTopics?: string[];
      learningObjectives?: string;
      learningActivities?: string;
      learningResources?: string;
      assessmentMethods?: string;
      plannedStartDate?: string;
      plannedEndDate?: string;
      remarks?: string;
    }
  ): Promise<{ data: SubjectTopic }> => {
    return api.post<SubjectTopic>(`/academics/subjects/${subjectId}/topics`, data);
  },
  updateSubjectTopic: async (
    topicId: string,
    data: {
      title?: string;
      orderIndex?: number;
      estimatedPeriods?: number;
      status?: string;
      completedAt?: string | null;
      termId?: string | null;
      classId?: string | null;
      subTopics?: string[];
      learningObjectives?: string | null;
      learningActivities?: string | null;
      learningResources?: string | null;
      assessmentMethods?: string | null;
      plannedStartDate?: string | null;
      plannedEndDate?: string | null;
      actualStartDate?: string | null;
      actualEndDate?: string | null;
      remarks?: string | null;
    }
  ): Promise<{ data: SubjectTopic }> => {
    return api.put<SubjectTopic>(`/academics/topics/${topicId}`, data);
  },
  reorderSubjectTopics: async (
    items: Array<{ id: string; orderIndex: number }>
  ): Promise<{ data: { success: boolean; count: number } }> => {
    return api.post('/academics/topics/reorder', { items });
  },
  completeSubjectTopic: async (
    topicId: string,
    completed: boolean = true
  ): Promise<{ data: SubjectTopic }> => {
    return api.patch<SubjectTopic>(`/academics/topics/${topicId}/complete`, { completed });
  },
  deleteSubjectTopic: async (topicId: string): Promise<{ data?: any }> => {
    return api.delete(`/academics/topics/${topicId}`);
  },

  // National Syllabus Competences
  getSyllabusCompetences: async (params?: {
    subjectId?: string;
    subjectCode?: string;
    classId?: string;
    level?: string;
  }): Promise<{ data: SyllabusMainCompetence[] }> => {
    const query = new URLSearchParams();
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.subjectCode) query.append('subjectCode', params.subjectCode);
    if (params?.classId) query.append('classId', params.classId);
    if (params?.level) query.append('level', params.level);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<SyllabusMainCompetence[]>(`/academics/syllabus/competences${qs}`);
  },

  // Tanzanian Standard Lesson Plans
  getLessonPlans: async (params?: {
    teacherId?: string;
    classId?: string;
    subjectId?: string;
    subjectTopicId?: string;
    lessonDate?: string;
  }): Promise<{ data: LessonPlan[] }> => {
    const query = new URLSearchParams();
    if (params?.teacherId) query.append('teacherId', params.teacherId);
    if (params?.classId) query.append('classId', params.classId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.subjectTopicId) query.append('subjectTopicId', params.subjectTopicId);
    if (params?.lessonDate) query.append('lessonDate', params.lessonDate);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<LessonPlan[]>(`/academics/lesson-plans${qs}`);
  },

  getLessonPlan: async (id: string): Promise<{ data: LessonPlan }> => {
    return api.get<LessonPlan>(`/academics/lesson-plans/${id}`);
  },

  createLessonPlan: async (data: CreateLessonPlanPayload): Promise<{ data: LessonPlan }> => {
    return api.post<LessonPlan>('/academics/lesson-plans', data);
  },

  updateLessonPlan: async (id: string, data: Partial<CreateLessonPlanPayload>): Promise<{ data: LessonPlan }> => {
    return api.put<LessonPlan>(`/academics/lesson-plans/${id}`, data);
  },

  deleteLessonPlan: async (id: string): Promise<{ data: { success: boolean; message: string } }> => {
    return api.delete<{ success: boolean; message: string }>(`/academics/lesson-plans/${id}`);
  },

  getLessonPlanPrepopulation: async (id: string): Promise<{ data: LessonPlanPrepopulation }> => {
    return api.get<LessonPlanPrepopulation>(`/academics/lesson-plans/${id}/prepopulate`);
  },

  // Module I: Report Cards
  getReportCards: async (params: { academicYearId: string; termId: string; classId?: string; studentId?: string }): Promise<{ data: ReportCard[] }> => {
    const query = new URLSearchParams();
    query.append('academicYearId', params.academicYearId);
    query.append('termId', params.termId);
    if (params.classId) query.append('classId', params.classId);
    if (params.studentId) query.append('studentId', params.studentId);
    return api.get<ReportCard[]>(`/academics/report-cards?${query.toString()}`);
  },
  generateReportCards: async (data: { academicYearId: string; termId: string; classId?: string }): Promise<{ count: number }> => {
    const res = await api.post<{ count: number }>('/academics/report-cards/generate', data);
    return res.data;
  },
  publishReportCards: async (data: { academicYearId: string; termId: string; classId?: string }): Promise<{ count: number }> => {
    const res = await api.post<{ count: number }>('/academics/report-cards/publish', data);
    return res.data;
  },
  unpublishReportCards: async (data: { academicYearId: string; termId: string; classId?: string }): Promise<{ count: number }> => {
    const res = await api.post<{ count: number }>('/academics/report-cards/unpublish', data);
    return res.data;
  },
  getStudentReportCard: async (studentId: string, termId?: string): Promise<{ data: ReportCard }> => {
    const qs = termId ? `?termId=${termId}` : '';
    return api.get<ReportCard>(`/academics/report-cards/students/${studentId}${qs}`);
  },
  getClassReportCards: async (classId: string, termId?: string): Promise<{ data: ReportCard[] }> => {
    const qs = termId ? `?termId=${termId}` : '';
    return api.get<ReportCard[]>(`/academics/report-cards/classes/${classId}${qs}`);
  },
  getAcademicsAnalytics: async (params?: { academicYearId?: string; termId?: string; classId?: string; subjectId?: string }): Promise<{ data: any }> => {
    const query = new URLSearchParams();
    if (params?.academicYearId) query.append('academicYearId', params.academicYearId);
    if (params?.termId) query.append('termId', params.termId);
    if (params?.classId) query.append('classId', params.classId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<any>(`/dashboard/academics${qs}`);
  },

  getAcademicYears: async (): Promise<{ data: AcademicYear[] }> => {
    return api.get<AcademicYear[]>('/academics/years');
  },
  getTerms: async (academicYearId?: string, educationLevel?: string): Promise<{ data: Term[] }> => {
    const query = new URLSearchParams();
    if (academicYearId) query.append('academicYearId', academicYearId);
    if (educationLevel) query.append('educationLevel', educationLevel);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<Term[]>(`/academics/terms${qs}`);
  },

  getCalendarEvents: async (params?: {
    academicYearId?: string;
    category?: string;
    scope?: string;
    educationLevel?: string;
    classId?: string;
    startDate?: string;
    endDate?: string;
    isOperationalException?: boolean;
  }): Promise<{ data: CalendarEvent[] }> => {
    const query = new URLSearchParams();
    if (params?.academicYearId) query.append('academicYearId', params.academicYearId);
    if (params?.category) query.append('category', params.category);
    if (params?.scope) query.append('scope', params.scope);
    if (params?.educationLevel) query.append('educationLevel', params.educationLevel);
    if (params?.classId) query.append('classId', params.classId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.isOperationalException !== undefined) {
      query.append('isOperationalException', String(params.isOperationalException));
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<CalendarEvent[]>(`/academics/events${qs}`);
  },

  createCalendarEvent: async (data: Partial<CalendarEvent>): Promise<{ data: CalendarEvent }> => {
    return api.post<CalendarEvent>('/academics/events', data);
  },

  updateCalendarEvent: async (id: string, data: Partial<CalendarEvent>): Promise<{ data: CalendarEvent }> => {
    return api.put<CalendarEvent>(`/academics/events/${id}`, data);
  },

  deleteCalendarEvent: async (id: string): Promise<{ data: { message: string } }> => {
    return api.delete<{ message: string }>(`/academics/events/${id}`);
  },

  // Module J: Student Support & Interventions
  getInterventions: async (params?: { classId?: string; studentId?: string; status?: string }): Promise<{ data: InterventionPlan[] }> => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.studentId) query.append('studentId', params.studentId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<InterventionPlan[]>(`/academics/interventions${qs}`);
  },
  createIntervention: async (data: Partial<InterventionPlan>): Promise<{ data: InterventionPlan }> => {
    return api.post<InterventionPlan>('/academics/interventions', data);
  },
  updateIntervention: async (id: string, data: Partial<InterventionPlan>): Promise<{ data: InterventionPlan }> => {
    return api.patch<InterventionPlan>(`/academics/interventions/${id}`, data);
  },

  // Discipline & Welfare
  getDisciplineIncidents: async (params?: { classId?: string; studentId?: string; severity?: string }): Promise<{ data: DisciplineIncidentSummary[] }> => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.studentId) query.append('studentId', params.studentId);
    if (params?.severity) query.append('severity', params.severity);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<DisciplineIncidentSummary[]>(`/discipline/incidents${qs}`);
  },
  createDisciplineIncident: async (data: any): Promise<{ data: DisciplineIncidentSummary }> => {
    return api.post<DisciplineIncidentSummary>('/discipline/incidents', data);
  },

  // Module K: Governance & Meetings
  getMeetings: async (params?: { meetingType?: string; status?: string }): Promise<{ data: AcademicMeeting[] }> => {
    const query = new URLSearchParams();
    if (params?.meetingType) query.append('meetingType', params.meetingType);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<AcademicMeeting[]>(`/academics/meetings${qs}`);
  },
  createMeeting: async (data: Partial<AcademicMeeting>): Promise<{ data: AcademicMeeting }> => {
    return api.post<AcademicMeeting>('/academics/meetings', data);
  },
  updateMeeting: async (id: string, data: Partial<AcademicMeeting>): Promise<{ data: AcademicMeeting }> => {
    return api.patch<AcademicMeeting>(`/academics/meetings/${id}`, data);
  },
  addMeetingActionItem: async (meetingId: string, data: Partial<MeetingActionItem>): Promise<{ data: MeetingActionItem }> => {
    return api.post<MeetingActionItem>(`/academics/meetings/${meetingId}/action-items`, data);
  },
  updateMeetingActionItem: async (
    meetingId: string,
    actionItemId: string,
    data: Partial<MeetingActionItem>
  ): Promise<{ data: MeetingActionItem }> => {
    return api.patch<MeetingActionItem>(`/academics/meetings/${meetingId}/action-items/${actionItemId}`, data);
  },

  // Module L: Governance & Audit History
  getAcademicAuditLogs: async (params?: { action?: string; from?: string; to?: string }): Promise<{ data: AcademicAuditLogEntry[] }> => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<AcademicAuditLogEntry[]>(`/audit-logs${qs}`);
  },
};
