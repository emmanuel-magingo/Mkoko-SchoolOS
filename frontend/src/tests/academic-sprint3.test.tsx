import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { MasterMatrixView } from '../components/academics/timetable/MasterMatrixView';
import { TeacherWeeklyView } from '../components/academics/timetable/TeacherWeeklyView';
import { TimetableAssignmentModal } from '../components/academics/timetable/TimetableAssignmentModal';
import { TimetableManagement } from '../pages/academics/TimetableManagement';
import {
  TimetableMatrixResponse,
  TeacherWeeklyScheduleResponse,
  TimetableConflict,
  STANDARD_TIMETABLE_SLOTS,
} from '../api/timetableApi';
import { Permissions } from '../types/permissions';
import { api } from '../api/client';

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

describe('Sprint 3: Timetable Engine & Conflict Detection Test Suite', () => {
  const mockClasses = [
    { id: 'cls-1', name: 'Form 1 - A', level: 'Form 1', stream: 'A' },
    { id: 'cls-2', name: 'Form 2 - B', level: 'Form 2', stream: 'B' },
  ];

  const mockSubjects = [
    { id: 'sub-1', name: 'Mathematics', code: 'MATH' },
    { id: 'sub-2', name: 'Physics', code: 'PHYS' },
  ];

  const mockTeachers = [
    { id: 't-1', firstName: 'John', lastName: 'Mwamba', email: 'mwamba@school.ac.tz' },
    { id: 't-2', firstName: 'Amina', lastName: 'Bakari', email: 'amina@school.ac.tz' },
  ];

  const mockTerms = [
    { id: 'term-1', name: 'Term 1 - 2026' },
  ];

  const mockMatrixData: TimetableMatrixResponse = {
    termId: 'term-1',
    dayOfWeek: 'MONDAY',
    slots: STANDARD_TIMETABLE_SLOTS,
    rows: [
      {
        classId: 'cls-1',
        className: 'Form 1 - A',
        classLevel: 'Form 1',
        classStream: 'A',
        cells: [
          {
            slotIndex: 1,
            slotLabel: 'Period 1',
            startTime: '08:00',
            endTime: '08:45',
            isBreak: false,
            isAssigned: true,
            isContinuation: false,
            isDoublePeriod: false,
            period: {
              id: 'prd-1',
              subjectCode: 'MATH',
              subjectName: 'Mathematics',
              teacherName: 'John Mwamba',
              teacherId: 't-1',
              room: 'Room 101',
              startTime: '08:00',
              endTime: '08:45',
              status: 'PUBLISHED',
              isDoublePeriod: false,
            },
          },
          {
            slotIndex: 2,
            slotLabel: 'Period 2',
            startTime: '08:45',
            endTime: '09:30',
            isBreak: false,
            isAssigned: false,
            isContinuation: false,
            period: null,
          },
          {
            slotIndex: 3,
            slotLabel: 'Short Break',
            startTime: '09:30',
            endTime: '09:50',
            isBreak: true,
            breakLabel: 'Short Break',
            isAssigned: false,
            isContinuation: false,
            period: null,
          },
        ],
      },
      {
        classId: 'cls-2',
        className: 'Form 2 - B',
        classLevel: 'Form 2',
        classStream: 'B',
        cells: [
          {
            slotIndex: 1,
            slotLabel: 'Period 1',
            startTime: '08:00',
            endTime: '08:45',
            isBreak: false,
            isAssigned: true,
            isContinuation: false,
            isDoublePeriod: false,
            period: {
              id: 'prd-2',
              subjectCode: 'PHYS',
              subjectName: 'Physics',
              teacherName: 'Amina Bakari',
              teacherId: 't-2',
              room: 'Lab 2',
              startTime: '08:00',
              endTime: '08:45',
              status: 'PUBLISHED',
              isDoublePeriod: false,
            },
          },
          {
            slotIndex: 2,
            slotLabel: 'Period 2',
            startTime: '08:45',
            endTime: '09:30',
            isBreak: false,
            isAssigned: false,
            isContinuation: false,
            period: null,
          },
          {
            slotIndex: 3,
            slotLabel: 'Short Break',
            startTime: '09:30',
            endTime: '09:50',
            isBreak: true,
            breakLabel: 'Short Break',
            isAssigned: false,
            isContinuation: false,
            period: null,
          },
        ],
      },
    ],
  };

  const mockTeacherSchedule: TeacherWeeklyScheduleResponse = {
    teacherId: 't-1',
    teacherName: 'John Mwamba',
    termId: 'term-1',
    periods: [],
    scheduleByDay: [
      {
        dayOfWeek: 'MONDAY',
        slots: [
          {
            slotIndex: 1,
            slotLabel: 'Period 1',
            startTime: '08:00',
            endTime: '08:45',
            isBreak: false,
            isFree: false,
            period: {
              id: 'prd-1',
              classId: 'cls-1',
              className: 'Form 1 - A',
              subjectId: 'sub-1',
              subjectCode: 'MATH',
              subjectName: 'Mathematics',
              room: 'Room 101',
              startTime: '08:00',
              endTime: '08:45',
              isDoublePeriod: false,
              status: 'PUBLISHED',
            },
          },
          {
            slotIndex: 2,
            slotLabel: 'Period 2',
            startTime: '08:45',
            endTime: '09:30',
            isBreak: false,
            isFree: true,
            period: null,
          },
          {
            slotIndex: 3,
            slotLabel: 'Short Break',
            startTime: '09:30',
            endTime: '09:50',
            isBreak: true,
            breakLabel: 'Short Break',
            isFree: false,
            period: null,
          },
        ],
      },
      {
        dayOfWeek: 'TUESDAY',
        slots: [],
      },
      {
        dayOfWeek: 'WEDNESDAY',
        slots: [],
      },
      {
        dayOfWeek: 'THURSDAY',
        slots: [],
      },
      {
        dayOfWeek: 'FRIDAY',
        slots: [],
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: 't-1',
        firstName: 'John',
        lastName: 'Mwamba',
        role: 'ACADEMIC_MASTER',
        tenantId: 'tenant-school-1',
      },
      tenant: {
        id: 'tenant-school-1',
        name: 'Mwilamvya Secondary School',
        code: 'MWL',
        status: 'ACTIVE',
      },
      token: 'valid-token',
      isLoading: false,
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((perm) =>
        [
          Permissions.VIEW_ACADEMICS,
          Permissions.VIEW_TIMETABLE,
          Permissions.MANAGE_TIMETABLE,
        ].includes(perm)
      ),
    });

    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path.includes('/classes')) return { data: mockClasses } as any;
      if (path.includes('/subjects')) return { data: mockSubjects } as any;
      if (path.includes('/hr/staff') || path.includes('/users')) return { data: mockTeachers } as any;
      if (path.includes('/terms')) return { data: mockTerms } as any;
      if (path.includes('/timetable/matrix')) return { data: mockMatrixData } as any;
      if (path.includes('/timetable/my-schedule') || path.includes('/timetable/teacher'))
        return { data: mockTeacherSchedule } as any;
      return { data: [] } as any;
    });
  });

  // ==========================================================================
  // 1. MASTER MATRIX VIEW (FOR ACADEMIC MASTERS)
  // ==========================================================================
  describe('MasterMatrixView Component', () => {
    it('renders day switcher tabs, period columns, and class/stream rows with subject code and teacher', () => {
      const html = renderToString(
        <MasterMatrixView
          matrix={mockMatrixData}
          isLoading={false}
          canManage={true}
          selectedDay="MONDAY"
          onDayChange={vi.fn()}
          onCellClick={vi.fn()}
          classes={mockClasses}
        />
      );

      // Verify Day Switcher Tabs
      expect(html).toContain('day-tab-monday');
      expect(html).toContain('day-tab-tuesday');
      expect(html).toContain('day-tab-wednesday');
      expect(html).toContain('day-tab-thursday');
      expect(html).toContain('day-tab-friday');

      // Verify Columns: Periods of the day
      expect(html).toContain('Period 1');
      expect(html).toContain('08:00 - 08:45');
      expect(html).toContain('Period 2');
      expect(html).toContain('Short Break');

      // Verify Rows: Classes and Streams
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('Stream A');
      expect(html).toContain('Form 2 - B');
      expect(html).toContain('Stream B');

      // Verify Cells: Display Subject Code and Teacher Name
      expect(html).toContain('MATH');
      expect(html).toContain('John Mwamba');
      expect(html).toContain('PHYS');
      expect(html).toContain('Amina Bakari');

      // Verify empty slot has clickable assign interaction button
      expect(html).toContain('Assign');
    });

    it('renders empty placeholder state when matrix has no rows', () => {
      const emptyMatrix: TimetableMatrixResponse = {
        termId: 'term-1',
        dayOfWeek: 'MONDAY',
        slots: STANDARD_TIMETABLE_SLOTS,
        rows: [],
      };

      const html = renderToString(
        <MasterMatrixView
          matrix={emptyMatrix}
          isLoading={false}
          selectedDay="MONDAY"
          onDayChange={vi.fn()}
          onCellClick={vi.fn()}
        />
      );

      expect(html).toContain('No classes found in the matrix');
    });
  });

  // ==========================================================================
  // 2. TEACHER WEEKLY VIEW (FOR SUBJECT TEACHERS)
  // ==========================================================================
  describe('TeacherWeeklyView Component', () => {
    it('renders days of the week as columns, periods as rows, and displays class name, subject, and room', () => {
      const html = renderToString(
        <TeacherWeeklyView
          schedule={mockTeacherSchedule}
          isLoading={false}
          canManage={true}
          teachers={mockTeachers}
          selectedTeacherId="t-1"
          onSelectTeacher={vi.fn()}
          currentUserId="t-1"
        />
      );

      // Verify Header and Teacher display
      expect(html).toContain('John Mwamba');
      expect(html).toContain('Weekly Schedule');
      expect(html).toContain('1 Lessons');

      // Verify Columns: Days of the Week
      expect(html).toContain('MONDAY');
      expect(html).toContain('TUESDAY');
      expect(html).toContain('WEDNESDAY');
      expect(html).toContain('THURSDAY');
      expect(html).toContain('FRIDAY');

      // Verify Rows: Periods of the Day
      expect(html).toContain('Period 1');
      expect(html).toContain('Period 2');
      expect(html).toContain('Short Break');

      // Verify Cell Contents: Class Name, Subject, and Room
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('MATH');
      expect(html).toContain('Mathematics');
      expect(html).toContain('Room 101');

      // Verify Free Period indicator
      expect(html).toContain('Free Period');

      // Verify Teacher Inspector dropdown for managers
      expect(html).toContain('select-teacher-schedule');
      expect(html).toContain('Inspect Teacher:');
    });
  });

  // ==========================================================================
  // 3. TIMETABLE ASSIGNMENT MODAL & CONFLICT PREVENTION
  // ==========================================================================
  describe('TimetableAssignmentModal & Conflict Prevention', () => {
    it('renders all form dropdowns: Subject, Teacher, Class, Day, and Time inputs', () => {
      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          classes={mockClasses}
          subjects={mockSubjects}
          teachers={mockTeachers}
          terms={mockTerms}
        />
      );

      expect(html).toContain('Assign Timetable Period');
      expect(html).toContain('assignment-class-select');
      expect(html).toContain('assignment-day-select');
      expect(html).toContain('assignment-start-time');
      expect(html).toContain('assignment-end-time');
      expect(html).toContain('assignment-subject-select');
      expect(html).toContain('assignment-teacher-select');
      expect(html).toContain('assignment-room-input');
      expect(html).toContain('btn-submit-assignment');
    });

    it('correctly renders a clear red warning and disables submit button when a conflict exists', () => {
      const mockConflictData: TimetableConflict[] = [
        {
          type: 'TEACHER',
          message: 'Conflict: Mwamba John is already teaching Form 2 - B at this time.',
          conflictingPeriod: {
            id: 'conf-1',
            className: 'Form 2 - B',
            teacherName: 'Mwamba John',
            startTime: '08:00',
            endTime: '08:45',
          },
        },
      ];

      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          classes={mockClasses}
          subjects={mockSubjects}
          teachers={mockTeachers}
          terms={mockTerms}
          mockConflicts={mockConflictData}
        />
      );

      // Verify conflict banner rendered
      expect(html).toContain('conflict-alert');
      expect(html).toContain('Scheduling Conflict Detected');
      expect(html).toContain(
        'Conflict: Mwamba John is already teaching Form 2 - B at this time.'
      );
      expect(html).toContain('Hard conflict prevents submission');

      // Verify Submit Button is rendered with disabled state
      expect(html).toContain('btn-submit-assignment');
      expect(html).toMatch(/id="btn-submit-assignment"[^>]*disabled/);
      expect(html).toContain('cursor-not-allowed');
    });

    it('enables submit button and shows conflict-free status when no conflict exists', () => {
      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          classes={mockClasses}
          subjects={mockSubjects}
          teachers={mockTeachers}
          terms={mockTerms}
          mockConflicts={[]}
        />
      );

      expect(html).not.toContain('conflict-alert');
      expect(html).toContain('Slot is conflict-free and ready for assignment');
      expect(html).toContain('btn-submit-assignment');
      expect(html).not.toMatch(/id="btn-submit-assignment"[^>]*disabled/);
      expect(html).toContain('bg-blue-600');
    });
  });

  // ==========================================================================
  // 4. TIMETABLE MANAGEMENT PAGE ROUTE & VIEW SWITCHER
  // ==========================================================================
  describe('TimetableManagement Page', () => {
    it('renders page header, view switcher buttons, and assign period action button', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/operations/timetable']}>
          <AcademicProvider>
            <TimetableManagement />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Timetable Engine &amp; Teaching Schedule');
      expect(html).toContain('view-mode-master');
      expect(html).toContain('Master Matrix');
      expect(html).toContain('view-mode-teacher');
      expect(html).toContain('Teacher Weekly View');
      expect(html).toContain('btn-open-assignment-modal');
      expect(html).toContain('Assign Period');
    });
  });
});
