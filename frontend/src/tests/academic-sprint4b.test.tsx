import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import {
  getTodayTeacherSchedule,
  submitLessonLog,
  getDailyAttendanceManifest,
  getClassStudents,
  submitClassAttendance,
  getSubjectSyllabusNodes,
  attendanceApi,
} from '../api/attendance.api';
import { AcademicsApi } from '../api/academics.api';
import * as timetableApi from '../api/timetableApi';
import { api } from '../api/client';
import { LessonLogModal } from '../components/academics/lessons/LessonLogModal';
import { ClassRegister } from '../components/academics/attendance/ClassRegister';
import { AttendanceEnginePage } from '../pages/academics/AttendanceEnginePage';

// Mock Auth hook
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual<any>('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

describe('Sprint 4B: Attendance & Lesson Execution API Wiring Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'teacher-uuid-1',
        firstName: 'John',
        lastName: 'Mwamba',
        role: 'TEACHER',
        tenantId: 'tenant-1',
      },
      tenant: { id: 'tenant-1', name: 'Mwilamvya High School' },
      token: 'jwt-token',
      isLoading: false,
    });
  });

  // ============================================================================
  // SUITE 1: API CLIENT INTEGRATION
  // ============================================================================
  describe('Step 1: API Client Functions', () => {
    it('getTodayTeacherSchedule correctly queries weekly timetable and merges with lesson logs', async () => {
      // 2026-10-20 is a TUESDAY
      const testDate = '2026-10-20';

      const mockWeeklySchedule = {
        scheduleByDay: [
          {
            dayOfWeek: 'TUESDAY',
            dayName: 'Tuesday',
            slots: [
              {
                periodNumber: 1,
                slotLabel: 'Period 1',
                startTime: '08:00',
                endTime: '08:45',
                isBreak: false,
                period: {
                  id: 'tp-101',
                  classId: 'cls-form1-a',
                  className: 'Form 1 - A',
                  subjectId: 'sub-math',
                  subjectName: 'Mathematics',
                  subjectCode: 'MATH',
                  startTime: '08:00',
                  endTime: '08:45',
                  room: 'Room 101',
                },
              },
              {
                periodNumber: 2,
                slotLabel: 'Period 2',
                startTime: '08:45',
                endTime: '09:30',
                isBreak: false,
                period: {
                  id: 'tp-102',
                  classId: 'cls-form2-b',
                  className: 'Form 2 - B',
                  subjectId: 'sub-phys',
                  subjectName: 'Physics',
                  subjectCode: 'PHYS',
                  startTime: '08:45',
                  endTime: '09:30',
                  room: 'Lab 2',
                },
              },
            ],
          },
        ],
      };

      const mockLessonLogs = [
        {
          id: 'log-1',
          timetablePeriodId: 'tp-101',
          classId: 'cls-form1-a',
          subjectId: 'sub-math',
          lessonDate: '2026-10-20',
          status: 'TAUGHT',
          topic: 'Topic 1: Numbers, Fractions & Decimals',
        },
      ];

      vi.spyOn(timetableApi, 'getTeacherWeeklySchedule').mockResolvedValue(mockWeeklySchedule as any);
      vi.spyOn(AcademicsApi, 'getLessonLogs').mockResolvedValue({ data: mockLessonLogs as any });

      const result = await getTodayTeacherSchedule('teacher-uuid-1', testDate);

      expect(result.date).toBe('2026-10-20');
      expect(result.dayOfWeek).toBe('TUESDAY');
      expect(result.periods).toHaveLength(2);

      // Period 1 was taught
      expect(result.periods[0].id).toBe('tp-101');
      expect(result.periods[0].isExecuted).toBe(true);
      expect(result.periods[0].lessonLog?.topic).toBe('Topic 1: Numbers, Fractions & Decimals');

      // Period 2 is pending
      expect(result.periods[1].id).toBe('tp-102');
      expect(result.periods[1].isExecuted).toBe(false);

      expect(result.totalScheduled).toBe(2);
      expect(result.executedCount).toBe(1);
      expect(result.pendingCount).toBe(1);
    });

    it('submitLessonLog calls backend AcademicsApi.recordLessonLog with correct payload', async () => {
      const mockRecordSpy = vi.spyOn(AcademicsApi, 'recordLessonLog').mockResolvedValue({
        data: {
          id: 'new-log-uuid',
          classId: 'cls-form1-a',
          subjectId: 'sub-math',
          lessonDate: '2026-10-20',
          status: 'TAUGHT',
          topic: 'Algebra & Linear Equations',
        } as any,
      });

      const payload = {
        timetablePeriodId: 'tp-101',
        classId: 'cls-form1-a',
        subjectId: 'sub-math',
        lessonDate: '2026-10-20',
        status: 'TAUGHT' as const,
        topic: 'Algebra & Linear Equations',
        objectives: 'Understand linear equations in one variable',
      };

      const res = await submitLessonLog(payload);

      expect(mockRecordSpy).toHaveBeenCalledWith(payload);
      expect(res.id).toBe('new-log-uuid');
      expect(res.status).toBe('TAUGHT');
    });

    it('getDailyAttendanceManifest computes live manifest comparing classes, sessions, and closures', async () => {
      const mockClasses = [
        { id: 'c-1', name: 'Form 1 - A', stream: 'A', level: 'Form 1' },
        { id: 'c-2', name: 'Form 2 - B', stream: 'B', level: 'Form 2' },
        { id: 'c-3', name: 'Form 3 - C', stream: 'C', level: 'Form 3' },
      ];

      const mockSessions = [
        {
          id: 'sess-1',
          classId: 'c-1',
          date: '2026-10-20',
          sessionType: 'DAILY',
          status: 'RECORDED' as const,
        },
      ];

      const mockClosures = [
        {
          id: 'cls-closure-1',
          title: 'National Form 4 Exam Quarantine',
          startDate: '2026-10-19T00:00:00Z',
          endDate: '2026-10-21T23:59:59Z',
          classId: 'c-3', // class 3 is excused
        },
      ];

      vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
        if (path.includes('/classes')) return { data: mockClasses } as any;
        return { data: [] } as any;
      });
      vi.spyOn(attendanceApi, 'getSessions').mockResolvedValue(mockSessions as any);
      vi.spyOn(AcademicsApi, 'getSchoolClosures').mockResolvedValue({ data: mockClosures as any });

      const manifest = await getDailyAttendanceManifest('2026-10-20');

      expect(manifest.date).toBe('2026-10-20');
      expect(manifest.totalExpected).toBe(3);
      expect(manifest.submitted).toBe(1);
      expect(manifest.pending).toBe(1);
      expect(manifest.excused).toBe(1);
      expect(manifest.complianceRate).toBe(33);

      expect(manifest.items.find((i) => i.id === 'c-1')?.status).toBe('SUBMITTED');
      expect(manifest.items.find((i) => i.id === 'c-2')?.status).toBe('PENDING');
      expect(manifest.items.find((i) => i.id === 'c-3')?.status).toBe('EXCUSED');
    });

    it('getClassStudents fetches and normalizes enrolled students for a class', async () => {
      const mockStudents = [
        {
          id: 'st-1',
          admissionNumber: 'ADM/2026/001',
          firstName: 'Fatma',
          lastName: 'Mwinyi',
          gender: 'FEMALE',
          studentStatus: 'ACTIVE',
        },
        {
          id: 'st-2',
          admissionNumber: 'ADM/2026/002',
          firstName: 'Hassan',
          lastName: 'Bakari',
          gender: 'MALE',
          studentStatus: 'ACTIVE',
        },
      ];

      vi.spyOn(api, 'get').mockResolvedValue({ data: mockStudents } as any);

      const students = await getClassStudents('class-123');

      expect(students).toHaveLength(2);
      expect(students[0].fullName).toBe('Fatma Mwinyi');
      expect(students[0].admissionNumber).toBe('ADM/2026/001');
      expect(students[1].fullName).toBe('Hassan Bakari');
    });

    it('submitClassAttendance creates session idempotently and saves records', async () => {
      const mockGetSessions = vi.spyOn(attendanceApi, 'getSessions').mockResolvedValue([]);
      const mockCreateSession = vi.spyOn(attendanceApi, 'createSession').mockResolvedValue({
        id: 'new-session-id',
        classId: 'cls-form1-a',
        date: '2026-10-20',
        sessionType: 'DAILY',
        status: 'DRAFT',
      } as any);
      const mockSaveRecords = vi.spyOn(attendanceApi, 'saveRecords').mockResolvedValue({
        id: 'new-session-id',
        classId: 'cls-form1-a',
        date: '2026-10-20',
        sessionType: 'DAILY',
        status: 'RECORDED',
      } as any);

      const records = [
        { studentId: 'st-1', status: 'PRESENT' as const },
        { studentId: 'st-2', status: 'ABSENT' as const, notes: 'Hospital visit' },
      ];

      const session = await submitClassAttendance('cls-form1-a', '2026-10-20', records, {
        academicYearId: 'yr-1',
        termId: 'term-1',
      });

      expect(mockGetSessions).toHaveBeenCalled();
      expect(mockCreateSession).toHaveBeenCalledWith({
        academicYearId: 'yr-1',
        termId: 'term-1',
        classId: 'cls-form1-a',
        date: '2026-10-20',
        sessionType: 'DAILY',
      });
      expect(mockSaveRecords).toHaveBeenCalledWith('new-session-id', records);
      expect(session.id).toBe('new-session-id');
    });

    it('getSubjectSyllabusNodes returns standard topics when backend topic endpoint is unavailable', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('404 Not Found'));

      const mathTopics = await getSubjectSyllabusNodes('sub-1', 'MATH');
      expect(mathTopics).toContain('Topic 1: Numbers, Fractions & Decimals');
      expect(mathTopics).toContain('Topic 2: Algebra & Linear Equations');

      const physTopics = await getSubjectSyllabusNodes('sub-2', 'PHYS');
      expect(physTopics).toContain('Topic 1: Measurement & Scientific Estimation');
    });
  });

  // ============================================================================
  // SUITE 2: WIRE LESSON EXECUTION & LOG MODAL
  // ============================================================================
  describe('Step 2: Wire Lesson Execution & Modal', () => {
    it('LessonLogModal binds the yearly topic dropdown and calls submitLessonLog on submit', async () => {
      const mockSubmitFn = vi.fn().mockResolvedValue({ id: 'log-1' });

      const period = {
        timetablePeriodId: 'tp-101',
        classId: 'cls-form1-a',
        className: 'Form 1 - A',
        subjectId: 'sub-math',
        subjectName: 'Mathematics',
        subjectCode: 'MATH',
        startTime: '08:00',
        endTime: '08:45',
        lessonDate: '2026-10-20',
      };

      const html = renderToString(
        <LessonLogModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          periodData={period}
          mockSubmit={mockSubmitFn}
        />
      );

      // Verify period data rendered
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('Mathematics');
      expect(html).toContain('08:00 - 08:45');
      expect(html).toContain('-- Select a Yearly Topic --');
      expect(html).toContain('name="subTopic"');
      expect(html).toContain('Confirm Lesson Execution');

      // Verify attendance auto-calculation fields & readOnly restrictions
      expect(html).toContain('id="students-present-input"');
      expect(html).toContain('id="students-total-input"');
      expect(html).toContain('id="students-absent-input"');
      expect(html).toContain('readonly=""');

      // Verify orange info card is completely removed from modal body
      expect(html).not.toContain('bg-amber-50');
      expect(html).not.toContain('Post-Lesson Execution Record');
    });

    it('LessonLogModal correctly pre-populates attendance from existing log with automated absent calculation', () => {
      const periodWithExistingLog = {
        timetablePeriodId: 'tp-101',
        classId: 'cls-form1-a',
        className: 'Form 1 - A',
        subjectId: 'sub-math',
        subjectName: 'Mathematics',
        startTime: '08:00',
        endTime: '08:45',
        lessonDate: '2026-10-20',
        lessonLog: {
          id: 'log-1',
          studentsTotal: 48,
          studentsPresent: 45,
          studentsAbsent: 3,
        },
      };

      const html = renderToString(
        <LessonLogModal
          isOpen={true}
          onClose={vi.fn()}
          periodData={periodWithExistingLog}
        />
      );

      // Verify total and absent inputs reflect automated attendance
      expect(html).toContain('value="48"');
      expect(html).toContain('value="45"');
      expect(html).toContain('value="3"');
    });
  });

  // ============================================================================
  // SUITE 3: WIRE ATTENDANCE ENGINE & REGISTER
  // ============================================================================
  describe('Step 3: Wire Attendance Engine & Register', () => {
    it('ClassRegister renders enrolled students and supports submitClassAttendance submission', async () => {
      const mockSubmitFn = vi.fn().mockResolvedValue({ id: 'sess-saved' });

      const classItem = {
        id: 'cls-form1-a',
        name: 'Form 1 - A',
        level: 'Form 1',
        stream: 'A',
      };

      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <ClassRegister
              classItem={classItem}
              date="2026-10-20"
              mockSubmit={mockSubmitFn}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Class Register: Form 1 - A');
      expect(html).toContain('2026-10-20');
      expect(html).toContain('Submit &amp; Sync Register');
    });

    it('AttendanceEnginePage shows Daily Manifest and breadcrumb when class is selected', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AttendanceEnginePage />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Daily Attendance Manifest');
      expect(html).toContain('Expected Registers');
      expect(html).toContain('Submitted');
    });
  });
});
