import { api } from './client';

export interface TimetablePeriod {
  id: string;
  tenantId?: string;
  termId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  isDoublePeriod?: boolean;
  isPublished?: boolean;
  status?: string;
  class?: { id: string; name: string; level: string; stream: string };
  subject?: { id: string; name: string; code: string };
  teacher?: { id: string; firstName: string; lastName: string };
}

export interface CreateTimetablePeriodDto {
  termId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  isDoublePeriod?: boolean;
}

export interface TimetableConflict {
  type: 'TEACHER' | 'CLASS' | 'ROOM' | 'INVALID_TIME';
  message: string;
  conflictingPeriod?: {
    id: string;
    className?: string;
    subjectName?: string;
    teacherName?: string;
    room?: string | null;
    startTime: string;
    endTime: string;
  };
}

export interface MatrixSlot {
  index: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakType?: 'SHORT_BREAK' | 'LUNCH_BREAK';
}

export const STANDARD_TIMETABLE_SLOTS: MatrixSlot[] = [
  { index: 1, label: 'Period 1', startTime: '08:00', endTime: '08:40', isBreak: false },
  { index: 2, label: 'Period 2', startTime: '08:40', endTime: '09:20', isBreak: false },
  { index: 3, label: 'Short Break', startTime: '09:20', endTime: '09:40', isBreak: true, breakType: 'SHORT_BREAK' },
  { index: 4, label: 'Period 3', startTime: '09:40', endTime: '10:20', isBreak: false },
  { index: 5, label: 'Period 4', startTime: '10:20', endTime: '11:00', isBreak: false },
  { index: 6, label: 'Period 5', startTime: '11:00', endTime: '11:40', isBreak: false },
  { index: 7, label: 'Lunch Break', startTime: '11:40', endTime: '12:35', isBreak: true, breakType: 'LUNCH_BREAK' },
  { index: 8, label: 'Period 6', startTime: '12:35', endTime: '13:15', isBreak: false },
  { index: 9, label: 'Period 7', startTime: '13:15', endTime: '13:55', isBreak: false },
  { index: 10, label: 'Period 8', startTime: '13:55', endTime: '14:35', isBreak: false },
];

export interface MatrixCell {
  slotIndex: number;
  slotLabel: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakLabel?: string;
  isAssigned: boolean;
  isContinuation: boolean;
  isDoublePeriod?: boolean;
  period: {
    id: string;
    subjectId?: string;
    subjectCode: string;
    subjectName: string;
    classId?: string;
    className?: string;
    teacherName: string;
    teacherId: string;
    room?: string | null;
    dayOfWeek?: string;
    startTime: string;
    endTime: string;
    status: string;
    isDoublePeriod: boolean;
    termId?: string;
  } | null;
}

export interface MatrixRow {
  classId: string;
  className: string;
  classLevel: string;
  classStream: string;
  combination?: { id: string; name: string; code: string } | null;
  cells: MatrixCell[];
}

export interface TimetableMatrixResponse {
  termId: string;
  dayOfWeek: string;
  slots: MatrixSlot[];
  rows: MatrixRow[];
}

export interface TeacherScheduleSlot {
  slotIndex: number;
  slotLabel: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakLabel?: string;
  isFree: boolean;
  isDuty?: boolean;
  duty?: {
    id: string;
    title: string;
    dutyType: string;
    location: string;
    startTime: string;
    endTime: string;
    status: string;
  } | null;
  period: {
    id: string;
    classId: string;
    className: string;
    classLevel?: string;
    classStream?: string;
    combination?: { id: string; name: string; code: string } | null;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    room?: string | null;
    startTime: string;
    endTime: string;
    isDoublePeriod: boolean;
    status: string;
  } | null;
}

export interface TeacherWeeklyScheduleResponse {
  teacherId: string;
  teacherName?: string;
  termId?: string;
  scheduleByDay: Array<{
    dayOfWeek: string;
    slots: TeacherScheduleSlot[];
  }>;
  periods: TimetablePeriod[];
}

export const getTimetable = async (filters: {
  termId?: string;
  classId?: string;
  teacherId?: string;
  dayOfWeek?: string;
  status?: string;
}): Promise<TimetablePeriod[]> => {
  const params = new URLSearchParams();
  if (filters.termId) params.append('termId', filters.termId);
  if (filters.classId) params.append('classId', filters.classId);
  if (filters.teacherId) params.append('teacherId', filters.teacherId);
  if (filters.dayOfWeek) params.append('dayOfWeek', filters.dayOfWeek);
  if (filters.status) params.append('status', filters.status);

  const response = await api.get<TimetablePeriod[]>(`/timetable?${params.toString()}`);
  return response.data;
};

export const getTimetableMatrix = async (
  params: {
    termId: string;
    dayOfWeek?: string;
    status?: string;
  } | string,
  dayOfWeekParam?: string,
  statusParam?: string
): Promise<TimetableMatrixResponse> => {
  let termId: string;
  let dayOfWeek: string | undefined;
  let status: string | undefined;

  if (typeof params === 'string') {
    termId = params;
    dayOfWeek = dayOfWeekParam;
    status = statusParam;
  } else {
    termId = params.termId;
    dayOfWeek = params.dayOfWeek;
    status = params.status;
  }

  const q = new URLSearchParams();
  q.append('termId', termId);
  if (dayOfWeek) q.append('dayOfWeek', dayOfWeek);
  if (status) q.append('status', status);

  const response = await api.get<TimetableMatrixResponse>(`/timetable/matrix?${q.toString()}`);
  return response.data;
};

export const getMyWeeklySchedule = async (termId?: string): Promise<TeacherWeeklyScheduleResponse> => {
  const q = new URLSearchParams();
  if (termId) q.append('termId', termId);

  const response = await api.get<TeacherWeeklyScheduleResponse>(`/timetable/my-schedule?${q.toString()}`);
  return response.data;
};

export const getTeacherWeeklySchedule = async (teacherId: string, termId?: string): Promise<TeacherWeeklyScheduleResponse> => {
  const q = new URLSearchParams();
  if (termId) q.append('termId', termId);

  const response = await api.get<TeacherWeeklyScheduleResponse>(`/timetable/teacher/${teacherId}?${q.toString()}`);
  return response.data;
};

export const getTeacherSchedule = getTeacherWeeklySchedule;

export const getSubjects = async (filters?: { classId?: string }): Promise<any[]> => {
  const params = new URLSearchParams();
  if (filters?.classId) params.append('classId', filters.classId);
  const query = params.toString();
  const res = await api.get<any[]>(`/academics/subjects${query ? `?${query}` : ''}`);
  return res.data;
};

export const getTeachers = async (): Promise<any[]> => {
  const res = await api.get<any[]>('/academics/teachers');
  return res.data;
};

export const getEligibleTimetableTeachers = async (classId: string, subjectId: string) => {
  const params = new URLSearchParams({ classId, subjectId });
  const response = await api.get<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    academicDepartmentId: string;
    academicDepartment: { id: string; name: string; code: string };
    staffProfile?: { employmentStatus: string; jobTitle: string } | null;
  }>>(`/timetable/eligible-teachers?${params.toString()}`);
  return response.data;
};

export const getClasses = async (): Promise<any[]> => {
  const res = await api.get<any[]>('/classes');
  return res.data;
};

export const checkTimetableConflict = async (data: {
  termId: string;
  classId: string;
  subjectId?: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  isDoublePeriod?: boolean;
  excludeId?: string;
}): Promise<{ hasConflict: boolean; conflicts: TimetableConflict[] }> => {
  const response = await api.post<{ hasConflict: boolean; conflicts: TimetableConflict[] }>('/timetable/check-conflict', data);
  return response.data;
};

export const createTimetablePeriod = async (data: CreateTimetablePeriodDto): Promise<TimetablePeriod> => {
  const response = await api.post<TimetablePeriod>('/timetable', data);
  return response.data;
};

export const assignTimetablePeriod = async (data: CreateTimetablePeriodDto): Promise<TimetablePeriod> => {
  const response = await api.post<TimetablePeriod>('/timetable/assign', data);
  return response.data;
};

export const updateTimetablePeriod = async (id: string, data: Partial<CreateTimetablePeriodDto>): Promise<TimetablePeriod> => {
  const response = await api.put<TimetablePeriod>(`/timetable/${id}`, data);
  return response.data;
};

export const deleteTimetablePeriod = async (id: string): Promise<void> => {
  await api.delete(`/timetable/${id}`);
};

export const publishTimetable = async (data: { termId: string; classId?: string }): Promise<{ count: number }> => {
  const response = await api.post<{ count: number }>('/timetable/publish', data);
  return response.data;
};

// Schedule Configuration
export interface TimeSlotConfig {
  id: string;
  index: number;
  label: string;
  slotType: 'LESSON' | 'BREAK' | 'PREP' | 'ASSEMBLY' | 'REMEDIAL' | 'STUDY' | 'OTHER';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isBreak: boolean;
  breakType?: 'SHORT_BREAK' | 'LUNCH_BREAK' | 'TEA_BREAK' | 'OTHER';
  sessionCategory?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  applicableDays?: string[];
  allowsOvernight?: boolean;
}

export interface SchoolSessionConfig {
  id: string;
  name: string;
  category: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  startTime: string;
  endTime: string;
  allowsOvernight?: boolean;
}

export interface ActivityConfig {
  id: string;
  name: string;
  activityType: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultLocation?: string;
  requiresSupervision?: boolean;
  allowsOvernight?: boolean;
}

export interface DayScheduleOverride {
  dayOfWeek: string;
  isEnabled: boolean;
  openingTime: string;
  closingTime: string;
  slots: TimeSlotConfig[];
}

export interface SchoolScheduleConfig {
  timezone: string;
  openingTime: string;
  closingTime: string;
  teachingDays: string[];
  sessions: SchoolSessionConfig[];
  slots: TimeSlotConfig[];
  activities: ActivityConfig[];
  dayOverrides?: DayScheduleOverride[];
  allowsOvernightActivities?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const getScheduleConfig = async (): Promise<SchoolScheduleConfig> => {
  const response = await api.get<SchoolScheduleConfig>('/timetable/schedule-config');
  return response.data;
};

export const updateScheduleConfig = async (config: SchoolScheduleConfig): Promise<SchoolScheduleConfig> => {
  const response = await api.put<SchoolScheduleConfig>('/timetable/schedule-config', config);
  return response.data;
};

// Duty Roster
export interface DutyRosterAssignment {
  id: string;
  teacherId?: string;
  userId?: string;
  teacherName?: string;
  teacherEmail?: string;
  type?: string;
  dutyType: string;
  title: string;
  date: string;
  startDate?: string;
  endDate?: string | null;
  dayOfWeek?: string;
  startTime: string;
  endTime: string;
  location: string;
  isExclusiveLocation?: boolean;
  status: 'ASSIGNED' | 'COMPLETED' | 'MISSED' | 'SUBSTITUTED' | 'CANCELLED';
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  substituteHistory?: Array<{
    originalTeacherId: string;
    originalTeacherName?: string;
    substituteTeacherId: string;
    substituteTeacherName?: string;
    reason: string;
    authorizedById: string;
    authorizedByName?: string;
    substitutedAt: string;
  }>;
  signOff?: {
    signedOffById: string;
    signedOffByName?: string;
    status: 'COMPLETED' | 'MISSED';
    signedOffAt: string;
    notes?: string;
    reasonIfMissed?: string;
  };
}

export interface DutyDistributionSummary {
  dateRange: { startDate?: string; endDate?: string };
  totalTeachers: number;
  totalDutiesAssigned: number;
  averageDutiesPerTeacher: number;
  distribution: Array<{
    teacherId: string;
    teacherName: string;
    email?: string;
    totalDuties: number;
    completedDuties: number;
    missedDuties: number;
    totalHours: number;
    byType: Record<string, number>;
  }>;
  recommendedNextTeachers: Array<{
    teacherId: string;
    teacherName: string;
    email?: string;
    totalDuties: number;
    completedDuties: number;
    missedDuties: number;
    totalHours: number;
  }>;
}

export const getDutyRoster = async (filters: {
  startDate?: string;
  endDate?: string;
  teacherId?: string;
  dutyType?: string;
  status?: string;
  location?: string;
}): Promise<DutyRosterAssignment[]> => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.teacherId) params.append('teacherId', filters.teacherId);
  if (filters.dutyType) params.append('dutyType', filters.dutyType);
  if (filters.status) params.append('status', filters.status);
  if (filters.location) params.append('location', filters.location);

  const response = await api.get<DutyRosterAssignment[]>(`/duty-roster?${params.toString()}`);
  return response.data;
};

export const getMyDutySchedule = async (params?: { startDate?: string; endDate?: string }): Promise<DutyRosterAssignment[]> => {
  const q = new URLSearchParams();
  if (params?.startDate) q.append('startDate', params.startDate);
  if (params?.endDate) q.append('endDate', params.endDate);

  const response = await api.get<DutyRosterAssignment[]>(`/duty-roster/my-schedule?${q.toString()}`);
  return response.data;
};

export const assignDuty = async (data: {
  teacherId?: string;
  userId?: string;
  dutyType?: string;
  title?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isExclusiveLocation?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
}): Promise<DutyRosterAssignment> => {
  const response = await api.post<DutyRosterAssignment>('/duty-roster', data);
  return response.data;
};

export const signOffDuty = async (
  id: string,
  data: {
    status: 'COMPLETED' | 'MISSED';
    notes?: string;
    reasonIfMissed?: string;
    supervisorNotes?: string;
  }
): Promise<DutyRosterAssignment> => {
  const response = await api.post<DutyRosterAssignment>(`/duty-roster/${id}/sign-off`, data);
  return response.data;
};

export const substituteDuty = async (
  id: string,
  data: {
    substituteTeacherId: string;
    reason: string;
  }
): Promise<DutyRosterAssignment> => {
  const response = await api.post<DutyRosterAssignment>(`/duty-roster/${id}/substitute`, data);
  return response.data;
};

export const getDutyDistribution = async (params?: { startDate?: string; endDate?: string }): Promise<DutyDistributionSummary> => {
  const q = new URLSearchParams();
  if (params?.startDate) q.append('startDate', params.startDate);
  if (params?.endDate) q.append('endDate', params.endDate);

  const response = await api.get<DutyDistributionSummary>(`/duty-roster/distribution?${q.toString()}`);
  return response.data;
};

export const revokeDuty = async (id: string): Promise<void> => {
  await api.delete(`/duty-roster/${id}`);
};
