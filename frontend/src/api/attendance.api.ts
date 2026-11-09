import { api } from './client';
import { AcademicsApi } from './academics.api';
import { getTeacherWeeklySchedule, getMyWeeklySchedule } from './timetableApi';
import { LessonLog } from '../types/academics.types';
import {
  attendanceApi,
  AttendanceSession,
  AttendanceRecord,
  AttendanceSummary,
} from './attendance';

export { attendanceApi };
export type { AttendanceSession, AttendanceRecord, AttendanceSummary };

export type ManifestRegisterStatus = 'PENDING' | 'SUBMITTED' | 'EXCUSED';

export interface ClassManifestItem {
  id: string;
  name: string;
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

export interface DailyAttendanceManifestResult {
  date: string;
  items: ClassManifestItem[];
  totalExpected: number;
  submitted: number;
  pending: number;
  excused: number;
  complianceRate: number;
}

export interface EnrolledStudent {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender?: string;
  studentStatus?: string;
}

export interface TodaySchedulePeriod {
  id: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  room?: string;
  isExecuted: boolean;
  lessonLog?: LessonLog | null;
}

export interface TodayTeacherScheduleResult {
  date: string;
  dayOfWeek: string;
  teacherId?: string;
  periods: TodaySchedulePeriod[];
  totalScheduled: number;
  executedCount: number;
  pendingCount: number;
  scheduleResponse: any;
}

export interface SubmitLessonLogPayload {
  timetablePeriodId?: string;
  classId: string;
  subjectId: string;
  topicId?: string | null;
  lessonPlanId?: string | null;
  mainCompetenceId?: string | null;
  specificCompetenceId?: string | null;
  lessonDate: string;
  status: 'TAUGHT' | 'MISSED' | 'CANCELLED';
  topic?: string;
  subTopic?: string;
  description?: string;
  activities?: string;
  objectives?: string;
  notes?: string;
  reasonForMissed?: string;
  startTime?: string;
  endTime?: string;
  studentsPresent?: number;
  studentsTotal?: number;
  studentsAbsent?: number;
  markTopicCompleted?: boolean;
}

export interface AttendanceRecordInput {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
}

// Tanzanian secondary curriculum syllabus fallback nodes
export const STANDARD_SYLLABUS_NODES: Record<string, string[]> = {
  default: [
    'Introduction & Fundamental Principles',
    'Core Concepts & Applications',
    'Practical Demonstration & Laboratory Exercises',
    'Revision & Problem-Solving Session',
    'Formative Assessment & Class Review',
  ],
  MATH: [
    'Topic 1: Numbers, Fractions & Decimals',
    'Topic 2: Algebra & Linear Equations',
    'Topic 3: Geometry & Coordinate Plane',
    'Topic 4: Trigonometry & Angle Calculations',
    'Topic 5: Quadratic Functions & Graphs',
    'Topic 6: Statistics, Mean & Probability',
  ],
  PHYS: [
    'Topic 1: Measurement & Scientific Estimation',
    'Topic 2: Forces, Motion & Acceleration',
    'Topic 3: Work, Energy & Simple Machines',
    'Topic 4: Thermal Physics & Heat Transfer',
    'Topic 5: Electricity, Circuits & Resistance',
    'Topic 6: Optics, Reflection & Refraction',
  ],
  CHEM: [
    'Topic 1: Matter, Elements & Compounds',
    'Topic 2: Atomic Structure & The Periodic Table',
    'Topic 3: Chemical Bonding & Formulae',
    'Topic 4: Acids, Bases, Indicators & Salts',
    'Topic 5: Mole Concept, Molar Mass & Stoichiometry',
    'Topic 6: Organic Chemistry & Hydrocarbons',
  ],
  BIO: [
    'Topic 1: Cell Biology & Microscopy',
    'Topic 2: Nutrition, Digestion & Diet',
    'Topic 3: Transport in Animals & Plants',
    'Topic 4: Respiration & Gas Exchange',
    'Topic 5: Reproduction & Growth',
    'Topic 6: Genetics, Heredity & Variation',
  ],
  ENG: [
    'Topic 1: Listening & Speaking Skills',
    'Topic 2: Reading Comprehension & Vocabulary',
    'Topic 3: Grammar, Tenses & Passive Voice',
    'Topic 4: Essay & Continuous Writing',
    'Topic 5: Letter Writing (Official & Friendly)',
    'Topic 6: Poetry & Literary Analysis',
  ],
};

/**
 * STEP 1.1: getTodayTeacherSchedule(teacherId, date)
 * Uses the timetable engine to find what the teacher is teaching today and whether the period has been logged.
 */
export const getTodayTeacherSchedule = async (
  teacherId?: string,
  date?: string
): Promise<TodayTeacherScheduleResult> => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = dayNames[new Date(targetDate).getDay()] || 'MONDAY';

  const [weeklySchedule, logsRes] = await Promise.all([
    teacherId && teacherId !== 'me'
      ? getTeacherWeeklySchedule(teacherId).catch(() => null)
      : getMyWeeklySchedule().catch(() => null),
    AcademicsApi.getLessonLogs({
      teacherId: teacherId !== 'me' ? teacherId : undefined,
      startDate: targetDate,
      endDate: targetDate,
    }).catch(() => ({ data: [] })),
  ]);

  const logs: LessonLog[] = logsRes?.data || [];

  const daySchedule = weeklySchedule?.scheduleByDay?.find(
    (d: any) => d.dayOfWeek?.toUpperCase() === dayOfWeek.toUpperCase()
  );

  const nonBreakSlots = (daySchedule?.slots || []).filter(
    (slot: any) => !slot.isBreak && slot.period
  );

  const periods: TodaySchedulePeriod[] = nonBreakSlots.map((slot: any) => {
    const period = slot.period;
    const existingLog = logs.find(
      (log) =>
        (log.timetablePeriodId && log.timetablePeriodId === period.id) ||
        (log.classId === period.classId && log.subjectId === period.subjectId)
    );

    const isExecuted = existingLog?.status === 'TAUGHT';

    return {
      id: period.id,
      slotLabel: slot.slotLabel || `Period ${slot.periodNumber}`,
      startTime: period.startTime,
      endTime: period.endTime,
      classId: period.classId,
      className: period.className || 'Class',
      subjectId: period.subjectId,
      subjectName: period.subjectName || 'Subject',
      subjectCode: period.subjectCode || 'SUB',
      room: period.room,
      isExecuted,
      lessonLog: existingLog || null,
    };
  });

  const executedCount = periods.filter((p) => p.isExecuted).length;

  return {
    date: targetDate,
    dayOfWeek,
    teacherId,
    periods,
    totalScheduled: periods.length,
    executedCount,
    pendingCount: Math.max(0, periods.length - executedCount),
    scheduleResponse: weeklySchedule,
  };
};

/**
 * STEP 1.2: submitLessonLog(payload)
 * Signs off a period as Taught/Cancelled/Missed in the database.
 */
export const submitLessonLog = async (
  payload: SubmitLessonLogPayload
): Promise<LessonLog> => {
  const res = await AcademicsApi.recordLessonLog(payload);
  const log = (res as any)?.data || res;
  return log;
};

/**
 * STEP 1.3: getDailyAttendanceManifest(date)
 * Gets the PENDING / SUBMITTED / EXCUSED status of all classes for a specific date.
 */
export const getDailyAttendanceManifest = async (
  date?: string
): Promise<DailyAttendanceManifestResult> => {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const [classesRes, sessionsRes, closuresRes] = await Promise.all([
    attendanceApi.getAuthorizedClasses(),
    attendanceApi.getSessions({ dateFrom: targetDate, dateTo: targetDate }).catch(() => []),
    AcademicsApi.getSchoolClosures().then((r) => r.data).catch(() => []),
  ]);

  const rawClasses = Array.isArray(classesRes)
    ? classesRes
    : (classesRes as any)?.data || [];
  const classList: any[] = Array.isArray(rawClasses) ? rawClasses : [];
  const sessions: AttendanceSession[] = Array.isArray(sessionsRes) ? sessionsRes : [];
  const closures: any[] = Array.isArray(closuresRes) ? closuresRes : [];

  const sessionMap = new Map<string, AttendanceSession>();
  sessions.forEach((s) => {
    sessionMap.set(s.classId, s);
  });

  const isDateExcused = (classId: string): string | null => {
    const match = closures.find((c) => {
      const start = c.startDate ? c.startDate.split('T')[0] : '';
      const end = c.endDate ? c.endDate.split('T')[0] : '';
      const coversDate = targetDate >= start && targetDate <= end;
      const appliesToClass = !c.classId || c.classId === classId;
      return coversDate && appliesToClass;
    });
    return match ? (match.title || match.reason || 'School Closure') : null;
  };

  const items: ClassManifestItem[] = classList.map((c) => {
    const session = sessionMap.get(c.id) || null;
    const closureReason = isDateExcused(c.id);

    let status: ManifestRegisterStatus = 'PENDING';
    if (session) {
      status = 'SUBMITTED';
    } else if (closureReason) {
      status = 'EXCUSED';
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
      excusedReason: closureReason || undefined,
    };
  });

  const totalExpected = items.length;
  const submitted = items.filter((i) => i.status === 'SUBMITTED').length;
  const pending = items.filter((i) => i.status === 'PENDING').length;
  const excused = items.filter((i) => i.status === 'EXCUSED').length;
  const complianceRate = totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0;

  return {
    date: targetDate,
    items,
    totalExpected,
    submitted,
    pending,
    excused,
    complianceRate,
  };
};

/**
 * STEP 1.4: getClassStudents(classId)
 * Fetches the actual enrolled students for the class to populate the register.
 */
export const getClassStudents = async (
  classId: string
): Promise<EnrolledStudent[]> => {
  const raw = await attendanceApi.getClassStudents(classId);
  const list: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.students)
    ? raw.students
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return list
    .filter((st) => !st.studentStatus || st.studentStatus === 'ACTIVE')
    .map((st) => ({
      id: st.id,
      admissionNumber: st.admissionNumber || st.id.slice(0, 8),
      firstName: st.firstName || '',
      middleName: st.middleName,
      lastName: st.lastName || '',
      fullName: `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student',
      gender: st.gender,
      studentStatus: st.studentStatus || 'ACTIVE',
    }));
};

/**
 * STEP 1.5: submitClassAttendance(classId, date, records, options)
 * Idempotent mutation to save attendance records for a class and date.
 */
export const submitClassAttendance = async (
  classId: string,
  date: string,
  records: AttendanceRecordInput[],
  options?: { academicYearId?: string; termId?: string; sessionType?: string }
): Promise<AttendanceSession> => {
  // 1. Check if a session already exists for this class and date
  let sessionId: string | null = null;
  let existingSession: AttendanceSession | null = null;

  try {
    const sessions = await attendanceApi.getSessions({
      classId,
      dateFrom: date,
      dateTo: date,
    });
    if (sessions && sessions.length > 0) {
      existingSession = sessions[0];
      sessionId = sessions[0].id;
    }
  } catch {
    // Session doesn't exist yet
  }

  // 2. If no session exists, create one
  if (!sessionId) {
    try {
      const created = await attendanceApi.createSession({
        academicYearId: options?.academicYearId || '',
        termId: options?.termId || '',
        classId,
        date,
        sessionType: options?.sessionType || 'DAILY',
      });
      sessionId = (created as any)?.data?.id ?? (created as any)?.id;
    } catch (createErr: any) {
      // If concurrent creation or conflict, query existing sessions
      const existing = await attendanceApi.getSessions({
        classId,
        dateFrom: date,
        dateTo: date,
      });
      if (existing && existing.length > 0) {
        sessionId = (existing[0] as any)?.data?.id ?? (existing[0] as any)?.id;
      } else {
        throw createErr;
      }
    }
  }

  // 3. Save records idempotently
  const recordsPayload: AttendanceRecord[] = records.map((r) => ({
    studentId: r.studentId,
    status: r.status,
    notes: r.notes?.trim() || undefined,
  }));

  if (!sessionId) {
    throw new Error('Unable to create or locate an attendance session for this class and date.');
  }

  const savedSession = await attendanceApi.saveRecords(sessionId, recordsPayload);
  return savedSession || existingSession;
};

/**
 * Helper to fetch curriculum syllabus nodes for a subject, with fallback to standard topics.
 */
export const getSubjectSyllabusNodes = async (
  subjectId: string,
  subjectCode?: string
): Promise<string[]> => {
  try {
    const res = await api
      .get<any>(`/academics/subjects/${subjectId}/topics`)
      .catch(() => api.get<any>(`/academics/syllabus/${subjectId}`).catch(() => null));

    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((t: any) => (typeof t === 'string' ? t : t.title || t.name));
    }
  } catch {
    // Fall back to standard curriculum
  }

  const key = subjectCode?.toUpperCase() || 'default';
  return STANDARD_SYLLABUS_NODES[key] || STANDARD_SYLLABUS_NODES.default;
};

export default {
  getTodayTeacherSchedule,
  submitLessonLog,
  getDailyAttendanceManifest,
  getClassStudents,
  submitClassAttendance,
  getSubjectSyllabusNodes,
  attendanceApi,
};
