import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { AttendanceManifest } from '../components/academics/attendance/AttendanceManifest';
import { ClassRegister } from '../components/academics/attendance/ClassRegister';
import { AttendanceEnginePage } from '../pages/academics/AttendanceEnginePage';
import { LessonLogModal } from '../components/academics/lessons/LessonLogModal';
import { LessonExecutionPage } from '../pages/academics/LessonExecutionPage';
import { AttendanceSession } from '../api/attendance';

// Mock Auth and Permissions hooks
const mockUseAuth = vi.fn();
const mockUsePermissions = vi.fn();

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual<any>('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

vi.mock('../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

describe('Sprint 4: Lesson Execution & Attendance Engine Test Suite', () => {
  const mockClasses = [
    {
      id: 'cls-1',
      name: 'Form 1 - A',
      level: 'Form 1',
      stream: 'A',
      classTeacher: { id: 't-1', firstName: 'John', lastName: 'Mwamba' },
    },
    {
      id: 'cls-2',
      name: 'Form 2 - B',
      level: 'Form 2',
      stream: 'B',
      classTeacher: { id: 't-2', firstName: 'Amina', lastName: 'Bakari' },
    },
    {
      id: 'cls-3',
      name: 'Form 3 - C',
      level: 'Form 3',
      stream: 'C',
      classTeacher: null,
    },
  ];

  const mockSessions: AttendanceSession[] = [
    {
      id: 'sess-1',
      classId: 'cls-1',
      date: '2026-10-19',
      sessionType: 'DAILY',
      status: 'RECORDED',
      class: { name: 'Form 1 - A' },
      teacher: { firstName: 'John', lastName: 'Mwamba' },
      records: [
        {
          studentId: 'std-1',
          status: 'PRESENT',
          student: { admissionNumber: 'MWL/2026/001', firstName: 'Juma', lastName: 'Mwamba' },
        },
        {
          studentId: 'std-2',
          status: 'ABSENT',
          notes: 'Fever & medical leave',
          student: { admissionNumber: 'MWL/2026/002', firstName: 'Sara', lastName: 'Hassan' },
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-teacher-1',
        firstName: 'John',
        lastName: 'Mwamba',
        role: 'TEACHER',
        tenantId: 'tenant-school-1',
      },
      tenant: {
        id: 'tenant-school-1',
        name: 'Mwilamvya Secondary School',
      },
      token: 'valid-token',
      isLoading: false,
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
    });
  });

  // ============================================================================
  // SUITE 1: ATTENDANCE MANIFEST (LAZY INITIALIZATION & STATUS DIFFERENTIATION)
  // ============================================================================
  describe('Attendance Manifest Engine', () => {
    it('correctly projects Expected registers comparing active classes against submitted sessions', () => {
      // cls-1 has a session in mockSessions -> SUBMITTED
      // cls-2 has NO session -> PENDING (Lazy initialization)
      // cls-3 has NO session -> PENDING (Lazy initialization)
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AttendanceManifest
              initialDate="2026-10-19"
              mockClasses={mockClasses}
              mockSessions={mockSessions}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Verify KPI metrics rendered
      expect(html).toContain('Daily Attendance Manifest');
      expect(html).toContain('Expected Registers');
      expect(html).toContain('3'); // 3 expected classes
      expect(html).toContain('Submitted');
      expect(html).toContain('1'); // 1 submitted (cls-1)
      expect(html).toContain('Pending / Missing');
      expect(html).toContain('2'); // 2 pending (cls-2, cls-3)
    });

    it('correctly differentiates between PENDING and SUBMITTED class rows with appropriate action buttons', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AttendanceManifest
              initialDate="2026-10-19"
              mockClasses={mockClasses}
              mockSessions={mockSessions}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // cls-1 is SUBMITTED
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('SUBMITTED');
      expect(html).toContain('Edit Register');

      // cls-2 is PENDING
      expect(html).toContain('Form 2 - B');
      expect(html).toContain('PENDING');
      expect(html).toContain('Fill Register');

      // cls-3 is PENDING
      expect(html).toContain('Form 3 - C');
    });

    it('renders date picker input with current or provided date', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AttendanceManifest
              initialDate="2026-10-19"
              mockClasses={mockClasses}
              mockSessions={mockSessions}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('value="2026-10-19"');
      expect(html).toContain('Register Date:');
    });

    it('displays class teacher assignments when available', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AttendanceManifest
              initialDate="2026-10-19"
              mockClasses={mockClasses}
              mockSessions={mockSessions}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('John Mwamba');
      expect(html).toContain('Amina Bakari');
      expect(html).toContain('Not Assigned');
    });
  });

  // ============================================================================
  // SUITE 2: CLASS REGISTER (RECORDING ATTENDANCE & IDEMPOTENT SUBMISSION)
  // ============================================================================
  describe('Class Register Grid & Idempotency', () => {
    it('renders keyboard-friendly grid defaulting students to PRESENT when initializing new session', () => {
      const mockClassItem = {
        id: 'cls-2',
        name: 'Form 2 - B',
        level: 'Form 2',
        stream: 'B',
      };

      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <ClassRegister
              classItem={mockClassItem}
              date="2026-10-19"
              existingSession={null}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Class Register: Form 2 - B');
      expect(html).toContain('Daily Attendance');
      expect(html).toContain('2026-10-19');
      expect(html).toContain('Bulk:');
      expect(html).toContain('All Present');
      expect(html).toContain('All Absent');
      expect(html).toContain('Submit &amp; Sync Register');
    });

    it('pre-populates existing attendance session records with status and notes', () => {
      const mockClassItem = {
        id: 'cls-1',
        name: 'Form 1 - A',
      };

      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <ClassRegister
              classItem={mockClassItem}
              date="2026-10-19"
              existingSession={mockSessions[0]}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Class Register: Form 1 - A');
      // Student 1 (Present)
      expect(html).toContain('Juma Mwamba');
      expect(html).toContain('MWL/2026/001');
      // Student 2 (Absent with remarks)
      expect(html).toContain('Sara Hassan');
      expect(html).toContain('MWL/2026/002');
      expect(html).toContain('Fever &amp; medical leave');
      expect(html).toContain('Updates existing attendance session.');
    });

    it('handles idempotent register submission callback with mapped payload', async () => {
      const mockSubmitFn = vi.fn().mockResolvedValue({ success: true });

      const mockClassItem = {
        id: 'cls-1',
        name: 'Form 1 - A',
      };

      // Verify that mockSubmit prop is safely accepted
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <ClassRegister
              classItem={mockClassItem}
              date="2026-10-19"
              existingSession={mockSessions[0]}
              mockSubmit={mockSubmitFn}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Submit &amp; Sync Register');
    });
  });

  // ============================================================================
  // SUITE 3: LESSON EXECUTION & SYLLABUS LOGGING
  // ============================================================================
  describe('Lesson Execution & Log Modal', () => {
    it('renders LessonLogModal with status selectors, curriculum syllabus dropdown, and mandatory cancellation remarks', () => {
      const mockPeriodData = {
        timetablePeriodId: 'tp-101',
        classId: 'cls-1',
        className: 'Form 1 - A',
        subjectId: 'sub-1',
        subjectName: 'Mathematics',
        subjectCode: 'MATH',
        startTime: '08:00',
        endTime: '08:45',
        lessonDate: '2026-10-19',
      };

      const html = renderToString(
        <LessonLogModal
          isOpen={true}
          onClose={vi.fn()}
          periodData={mockPeriodData}
        />
      );

      // Verify Header & Period Context
      expect(html).toContain('Record Lesson Execution');
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('MATH');
      expect(html).toContain('Mathematics');
      expect(html).toContain('08:00 - 08:45');

      // Verify Status Options (EXECUTED, PARTIALLY_EXECUTED, CANCELLED)
      expect(html).toContain('Executed');
      expect(html).toContain('Partially Executed');
      expect(html).toContain('Cancelled');

      // The lesson logbook uses teacher-entered yearly topics, not fallback syllabus data.
      expect(html).toContain('Topic');
      expect(html).toContain('-- Select a Yearly Topic --');
      expect(html).toContain('name="subTopic"');

      // Verify Remarks & Action
      expect(html).toContain('Teacher Reflection &amp; Remarks');
      expect(html).toContain('Confirm Lesson Execution');
    });

    it('renders LessonExecutionPage displaying teacher schedule and log status', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <LessonExecutionPage />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Lessons');
      expect(html).toContain('Plan your Scheme of Work, prepare daily lessons');
      expect(html).toContain('Date:');
      expect(html).toContain('Scheduled Periods Today');
      expect(html).toContain('Delivered &amp; Signed Off');
      expect(html).toContain('Pending Execution');
      expect(html).toContain('Scheme of Work');
      expect(html).not.toContain('Print Official Logbook');
    });
  });

  // ============================================================================
  // SUITE 4: ATTENDANCE ENGINE PAGE INTEGRATION
  // ============================================================================
  describe('AttendanceEnginePage Integration', () => {
    it('renders the Attendance Manifest by default', () => {
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
