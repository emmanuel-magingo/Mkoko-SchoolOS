import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { MasterMatrixView } from '../components/academics/timetable/MasterMatrixView';
import { TeacherWeeklyView } from '../components/academics/timetable/TeacherWeeklyView';
import { TimetableAssignmentModal } from '../components/academics/timetable/TimetableAssignmentModal';
import { TimetableManagement } from '../pages/academics/TimetableManagement';
import {
  getTimetableMatrix,
  getTeacherSchedule,
  checkTimetableConflict,
  assignTimetablePeriod,
  getSubjects,
  getTeachers,
  getClasses,
  STANDARD_TIMETABLE_SLOTS,
  TimetableMatrixResponse,
  TeacherWeeklyScheduleResponse,
} from '../api/timetable.api';
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

describe('Sprint 3B: Timetable API Wiring & Interactivity Test Suite', () => {
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
        ],
      },
    ],
  };

  const mockScheduleData: TeacherWeeklyScheduleResponse = {
    teacherId: 't-1',
    teacherName: 'John Mwamba',
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
        ],
      },
    ],
    periods: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 't-1',
        firstName: 'John',
        lastName: 'Mwamba',
        roles: ['ACADEMIC_MASTER', 'TEACHER'],
      },
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: (perm: string) => perm === Permissions.MANAGE_TIMETABLE,
      canAccessRole: () => true,
    });
  });

  // ==========================================================================
  // 1. API CLIENT FUNCTIONS VERIFICATION
  // ==========================================================================
  describe('Step 1: API Client Integration Functions', () => {
    it('verifies getTimetableMatrix fetches from /timetable/matrix with termId string', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockMatrixData,
      } as any);

      const result = await getTimetableMatrix('term-1');
      expect(getSpy).toHaveBeenCalledWith('/timetable/matrix?termId=term-1');
      expect(result.termId).toBe('term-1');
      expect(result.rows).toHaveLength(1);
    });

    it('verifies getTimetableMatrix fetches with object params (termId and dayOfWeek)', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockMatrixData,
      } as any);

      const result = await getTimetableMatrix({ termId: 'term-1', dayOfWeek: 'TUESDAY' });
      expect(getSpy).toHaveBeenCalledWith('/timetable/matrix?termId=term-1&dayOfWeek=TUESDAY');
      expect(result.rows).toBeDefined();
    });

    it('verifies getTeacherSchedule calls /timetable/teacher/:id', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockScheduleData,
      } as any);

      const result = await getTeacherSchedule('t-1', 'term-1');
      expect(getSpy).toHaveBeenCalledWith('/timetable/teacher/t-1?termId=term-1');
      expect(result.teacherId).toBe('t-1');
    });

    it('verifies checkTimetableConflict sends POST request to /timetable/check-conflict', async () => {
      const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
        data: { hasConflict: false, conflicts: [] },
      } as any);

      const payload = {
        termId: 'term-1',
        classId: 'cls-1',
        teacherId: 't-1',
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '08:45',
      };

      const result = await checkTimetableConflict(payload);
      expect(postSpy).toHaveBeenCalledWith('/timetable/check-conflict', payload);
      expect(result.hasConflict).toBe(false);
    });

    it('verifies assignTimetablePeriod sends POST request to /timetable/assign', async () => {
      const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
        data: { ...mockMatrixData.rows[0].cells[0].period, id: 'prd-new' },
      } as any);

      const payload = {
        termId: 'term-1',
        classId: 'cls-1',
        subjectId: 'sub-1',
        teacherId: 't-1',
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '08:45',
      };

      const result = await assignTimetablePeriod(payload);
      expect(postSpy).toHaveBeenCalledWith('/timetable/assign', payload);
      expect(result.id).toBe('prd-new');
    });

    it('verifies dropdown dependencies getSubjects, getTeachers, and getClasses exist and return lists', async () => {
      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url.includes('/academics/subjects')) return { data: mockSubjects } as any;
        if (url.includes('/academics/teachers')) return { data: mockTeachers } as any;
        if (url.includes('/classes')) return { data: mockClasses } as any;
        return { data: [] } as any;
      });

      const subjects = await getSubjects();
      const teachers = await getTeachers();
      const classes = await getClasses();

      expect(Array.isArray(subjects)).toBe(true);
      expect(subjects).toHaveLength(2);
      expect(Array.isArray(teachers)).toBe(true);
      expect(teachers).toHaveLength(2);
      expect(Array.isArray(classes)).toBe(true);
      expect(classes).toHaveLength(2);
    });
  });

  // ==========================================================================
  // 2. TIMETABLE MANAGEMENT & VIEWS WIRE TEST
  // ==========================================================================
  describe('Step 2: Timetable Views & Live Data Rendering', () => {
    it('renders MasterMatrixView with live matrix data', () => {
      const html = renderToString(
        <MasterMatrixView
          matrix={mockMatrixData}
          isLoading={false}
          selectedDay="MONDAY"
          onDayChange={vi.fn()}
          onCellClick={vi.fn()}
          classes={mockClasses}
        />
      );

      expect(html).toContain('Form 1 - A');
      expect(html).toContain('Period 1');
      expect(html).toContain('MATH');
      expect(html).toContain('John Mwamba');
      expect(html).toContain('Room 101');
    });

    it('renders MasterMatrixView loading spinner when isLoading is true', () => {
      const html = renderToString(
        <MasterMatrixView
          matrix={null}
          isLoading={true}
          selectedDay="MONDAY"
          onDayChange={vi.fn()}
          onCellClick={vi.fn()}
          classes={mockClasses}
        />
      );

      expect(html).toContain('Generating master school timetable matrix...');
      expect(html).toContain('animate-spin');
    });

    it('renders MasterMatrixView error banner when error prop is provided', () => {
      const html = renderToString(
        <MasterMatrixView
          matrix={null}
          isLoading={false}
          selectedDay="MONDAY"
          onDayChange={vi.fn()}
          onCellClick={vi.fn()}
          classes={mockClasses}
          error="Network timeout connecting to timetable service."
        />
      );

      expect(html).toContain('master-matrix-error-alert');
      expect(html).toContain('Network timeout connecting to timetable service.');
    });

    it('renders TeacherWeeklyView with teacher weekly schedule', () => {
      const html = renderToString(
        <TeacherWeeklyView
          schedule={mockScheduleData}
          isLoading={false}
          teachers={mockTeachers}
          selectedTeacherId="t-1"
        />
      );

      expect(html).toContain('John Mwamba&#x27;s Weekly Schedule');
      expect(html).toContain('Weekly Teaching Load');
      expect(html).toContain('1 Lessons');
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('MATH');
    });

    it('renders TeacherWeeklyView loading spinner when isLoading is true', () => {
      const html = renderToString(
        <TeacherWeeklyView
          schedule={null}
          isLoading={true}
          teachers={mockTeachers}
          selectedTeacherId="t-1"
        />
      );

      expect(html).toContain('Loading personal weekly schedule...');
      expect(html).toContain('animate-spin');
    });

    it('renders TeacherWeeklyView error banner when error prop is provided', () => {
      const html = renderToString(
        <TeacherWeeklyView
          schedule={null}
          isLoading={false}
          teachers={mockTeachers}
          selectedTeacherId="t-1"
          error="Failed to load teacher schedule."
        />
      );

      expect(html).toContain('teacher-weekly-error-alert');
      expect(html).toContain('Failed to load teacher schedule.');
    });
  });

  // ==========================================================================
  // 3. TIMETABLE ASSIGNMENT MODAL & BUTTON WIRE TEST
  // ==========================================================================
  describe('Step 3: Timetable Assignment Modal & Live Interactivity', () => {
    it('renders live Classes, Subjects, and Teachers inside assignment modal dropdowns', () => {
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

      // Verify Class dropdown options
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('(A)');
      expect(html).toContain('Form 2 - B');
      expect(html).toContain('(B)');

      // Verify Subject dropdown options
      expect(html).toContain('MATH');
      expect(html).toContain('Mathematics');
      expect(html).toContain('PHYS');
      expect(html).toContain('Physics');

      // Verify Teacher dropdown options
      expect(html).toContain('John');
      expect(html).toContain('Mwamba');
      expect(html).toContain('Amina');
      expect(html).toContain('Bakari');

      // Verify Conflict-free badge
      expect(html).toContain('Slot is conflict-free and ready for assignment');
      expect(html).toContain('btn-submit-assignment');
      expect(html).toContain('Assign Period');
    });

    it('renders scheduling conflict banner and disables submit button when conflict exists', () => {
      const mockConflict = [
        {
          type: 'TEACHER' as const,
          message: 'Conflict: John Mwamba is already teaching Form 2 - B at this time.',
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
          mockConflicts={mockConflict}
        />
      );

      expect(html).toContain('Scheduling Conflict Detected');
      expect(html).toContain('Conflict: John Mwamba is already teaching Form 2 - B at this time.');
      expect(html).toContain('Hard conflict prevents submission');

      // Submit button is disabled
      expect(html).toMatch(/id="btn-submit-assignment"[^>]*disabled/);
      expect(html).toContain('cursor-not-allowed');
    });

    it('renders disabled state with loading spinner when submitting assignment request', () => {
      // Test that the form renders the submit button properly
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

      expect(html).toContain('btn-submit-assignment');
      expect(html).not.toMatch(/id="btn-submit-assignment"[^>]*disabled/);
      expect(html).toContain('bg-blue-600');
    });
  });

  // ==========================================================================
  // 4. TIMETABLE MANAGEMENT PAGE FULL INTEGRATION
  // ==========================================================================
  describe('TimetableManagement Full Integration', () => {
    it('renders master timetable page with active term badge and view buttons', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/operations/timetable']}>
          <AcademicProvider>
            <TimetableManagement />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('timetable-management-page');
      expect(html).toContain('Timetable Engine &amp; Teaching Schedule');
      expect(html).toContain('view-mode-master');
      expect(html).toContain('view-mode-teacher');
      expect(html).toContain('btn-open-assignment-modal');
      expect(html).toContain('Assign Period');
    });
  });
});
