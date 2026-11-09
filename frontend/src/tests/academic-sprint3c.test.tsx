import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { ClassWeeklyView } from '../components/academics/timetable/ClassWeeklyView';
import { TimetableAssignmentModal } from '../components/academics/timetable/TimetableAssignmentModal';
import { TimetableManagement } from '../pages/academics/TimetableManagement';
import { TimetablePeriod } from '../api/timetable.api';
import { Permissions } from '../types/permissions';

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

describe('Sprint 3C: Class-Specific Timetable View & Validation Suite', () => {
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

  const mockClassPeriods: TimetablePeriod[] = [
    {
      id: 'prd-101',
      termId: 'term-1',
      classId: 'cls-1',
      subjectId: 'sub-1',
      teacherId: 't-1',
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '08:45',
      room: 'Room 101',
      isDoublePeriod: false,
      class: { id: 'cls-1', name: 'Form 1 - A', level: 'Form 1', stream: 'A' },
      subject: { id: 'sub-1', name: 'Mathematics', code: 'MATH' },
      teacher: { id: 't-1', firstName: 'John', lastName: 'Mwamba' },
    },
    {
      id: 'prd-102',
      termId: 'term-1',
      classId: 'cls-1',
      subjectId: 'sub-2',
      teacherId: 't-2',
      dayOfWeek: 'WEDNESDAY',
      startTime: '09:50',
      endTime: '10:35',
      room: 'Physics Lab',
      isDoublePeriod: true,
      class: { id: 'cls-1', name: 'Form 1 - A', level: 'Form 1', stream: 'A' },
      subject: { id: 'sub-2', name: 'Physics', code: 'PHYS' },
      teacher: { id: 't-2', firstName: 'Amina', lastName: 'Bakari' },
    },
    {
      id: 'prd-201',
      termId: 'term-1',
      classId: 'cls-2',
      subjectId: 'sub-1',
      teacherId: 't-1',
      dayOfWeek: 'MONDAY',
      startTime: '08:45',
      endTime: '09:30',
      room: 'Room 202',
      isDoublePeriod: false,
      class: { id: 'cls-2', name: 'Form 2 - B', level: 'Form 2', stream: 'B' },
      subject: { id: 'sub-1', name: 'Mathematics', code: 'MATH' },
      teacher: { id: 't-1', firstName: 'John', lastName: 'Mwamba' },
    },
  ];

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
  // 1. CLASS WEEKLY VIEW STRUCTURE & RENDERING
  // ==========================================================================
  describe('Step 1: ClassWeeklyView Component', () => {
    it('renders class dropdown, weekly grid headers, and periods for selected class', () => {
      const html = renderToString(
        <ClassWeeklyView
          periods={mockClassPeriods}
          isLoading={false}
          canManage={true}
          classes={mockClasses}
          selectedClassId="cls-1"
          onSelectClass={vi.fn()}
          onCellClick={vi.fn()}
        />
      );

      // Verify class dropdown and selection
      expect(html).toContain('select-class-timetable');
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('(A)');
      expect(html).toContain('Form 2 - B');
      expect(html).toContain('(B)');

      // Verify weekly grid days
      expect(html).toContain('MONDAY');
      expect(html).toContain('TUESDAY');
      expect(html).toContain('WEDNESDAY');
      expect(html).toContain('THURSDAY');
      expect(html).toContain('FRIDAY');

      // Verify Period rows
      expect(html).toContain('Period 1');
      expect(html).toContain('08:00 - 08:45');
      expect(html).toContain('Period 2');
      expect(html).toContain('08:45 - 09:30');
      expect(html).toContain('Short Break');
      expect(html).toContain('Lunch Break');

      // Verify mapped periods for Form 1 - A
      expect(html).toContain('MATH');
      expect(html).toContain('Mathematics');
      expect(html).toContain('John Mwamba');
      expect(html).toContain('Room 101');

      // Period on Wednesday: Physics in Physics Lab
      expect(html).toContain('PHYS');
      expect(html).toContain('Physics');
      expect(html).toContain('Amina Bakari');
      expect(html).toContain('Physics Lab');

      // Verify Double period badge
      expect(html).toContain('2x');

      // Verify periods from Form 2 - B are not rendered under Form 1 - A
      expect(html).not.toContain('Room 202');
    });

    it('renders clickable cell buttons for managers to assign empty periods', () => {
      const html = renderToString(
        <ClassWeeklyView
          periods={mockClassPeriods}
          isLoading={false}
          canManage={true}
          classes={mockClasses}
          selectedClassId="cls-1"
          onSelectClass={vi.fn()}
          onCellClick={vi.fn()}
        />
      );

      // Verify clickable assign period buttons
      expect(html).toContain('btn-assign-class-tuesday-1');
      expect(html).toContain('Assign');
    });

    it('renders loading spinner when isLoading is true', () => {
      const html = renderToString(
        <ClassWeeklyView
          periods={[]}
          isLoading={true}
          canManage={true}
          classes={mockClasses}
          selectedClassId="cls-1"
        />
      );

      expect(html).toContain('Loading class weekly timetable...');
      expect(html).toContain('animate-spin');
    });

    it('renders error banner when error prop is provided', () => {
      const html = renderToString(
        <ClassWeeklyView
          periods={[]}
          isLoading={false}
          canManage={true}
          classes={mockClasses}
          selectedClassId="cls-1"
          error="Failed to connect to class schedule repository."
        />
      );

      expect(html).toContain('class-weekly-error-alert');
      expect(html).toContain('Failed to connect to class schedule repository.');
    });

    it('renders empty placeholder when no classes exist', () => {
      const html = renderToString(
        <ClassWeeklyView
          periods={[]}
          isLoading={false}
          canManage={true}
          classes={[]}
        />
      );

      expect(html).toContain('No classes available');
      expect(html).toContain('Please register academic classes and streams first');
    });
  });

  // ==========================================================================
  // 2. TIMETABLE MANAGEMENT PAGE THREE VIEW TABS
  // ==========================================================================
  describe('Step 2: Timetable Management Three View Tabs', () => {
    it('renders all three view tabs: Master Matrix, Class View, and Teacher View', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/operations/timetable']}>
          <AcademicProvider>
            <TimetableManagement />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Verify 3 distinct view switcher tabs
      expect(html).toContain('view-mode-master');
      expect(html).toContain('Master Matrix');

      expect(html).toContain('view-mode-class');
      expect(html).toContain('Class View');

      expect(html).toContain('view-mode-teacher');
      expect(html).toContain('Teacher View');
    });
  });

  // ==========================================================================
  // 3. ASSIGNMENT MODAL STRICT PREREQUISITES VALIDATION
  // ==========================================================================
  describe('Step 3: Assignment Modal Validation for Missing Subjects/Teachers', () => {
    it('displays strict warning and disables submit button when database returns 0 Subjects', () => {
      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          classes={mockClasses}
          subjects={[]}
          teachers={mockTeachers}
          terms={mockTerms}
        />
      );

      // Strict warning message
      expect(html).toContain('missing-prerequisites-warning');
      expect(html).toContain(
        'Warning: You must register Subjects and Teachers before scheduling periods.'
      );

      // Submit button is disabled
      expect(html).toContain('btn-submit-assignment');
      expect(html).toMatch(/id="btn-submit-assignment"[^>]*disabled/);
      expect(html).toContain('cursor-not-allowed');
    });

    it('displays strict warning and disables submit button when database returns 0 Teachers', () => {
      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          classes={mockClasses}
          subjects={mockSubjects}
          teachers={[]}
          terms={mockTerms}
        />
      );

      // Strict warning message
      expect(html).toContain('missing-prerequisites-warning');
      expect(html).toContain(
        'Warning: You must register Subjects and Teachers before scheduling periods.'
      );

      // Submit button is disabled
      expect(html).toContain('btn-submit-assignment');
      expect(html).toMatch(/id="btn-submit-assignment"[^>]*disabled/);
      expect(html).toContain('cursor-not-allowed');
    });

    it('does not display warning and enables submit button when both Subjects and Teachers exist', () => {
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

      expect(html).not.toContain('missing-prerequisites-warning');
      expect(html).not.toContain(
        'Warning: You must register Subjects and Teachers before scheduling periods.'
      );
      expect(html).toContain('Slot is conflict-free and ready for assignment');

      // Submit button is enabled
      expect(html).toContain('btn-submit-assignment');
      expect(html).not.toMatch(/id="btn-submit-assignment"[^>]*disabled/);
      expect(html).toContain('bg-blue-600');
    });
  });
});
