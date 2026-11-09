import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MasterMatrixView } from '../components/academics/timetable/MasterMatrixView';
import { ClassWeeklyView } from '../components/academics/timetable/ClassWeeklyView';
import { TimetableAssignmentModal } from '../components/academics/timetable/TimetableAssignmentModal';
import { TimetableMatrixResponse, TimetablePeriod } from '../api/timetable.api';

describe('Timetable Management: Matrix UX Redesign, Teacher Reassignment & Cell Actions', () => {
  const mockClasses = [
    { id: 'class-1', name: 'Form 1A', level: 'Form 1', stream: 'A' },
    { id: 'class-2', name: 'Form 1B', level: 'Form 1', stream: 'B' },
  ];

  const mockSubjects = [
    { id: 'sub-kisw', name: 'Kiswahili', code: 'KISW' },
    { id: 'sub-math', name: 'Basic Mathematics', code: 'MATH' },
    { id: 'sub-chem', name: 'Chemistry', code: 'CHEM' },
  ];

  const mockTeachers = [
    { id: 'teach-1', firstName: 'Baraka', lastName: 'Juma', email: 'baraka@school.org' },
    { id: 'teach-2', firstName: 'Neema', lastName: 'Mwangi', email: 'neema@school.org' },
  ];

  const mockTerms = [
    { id: 'term-uuid-1', name: 'Term 1' },
    { id: 'term-uuid-2', name: 'Term 2' },
  ];

  const mockMatrix: TimetableMatrixResponse = {
    termId: 'term-uuid-1',
    dayOfWeek: 'MONDAY',
    slots: [
      { index: 1, label: 'Period 1', startTime: '08:00', endTime: '08:40', isBreak: false },
      { index: 2, label: 'Period 2', startTime: '08:40', endTime: '09:20', isBreak: false },
      { index: 3, label: 'Short Break', startTime: '09:20', endTime: '09:40', isBreak: true, breakType: 'SHORT_BREAK' },
      { index: 4, label: 'Period 3', startTime: '09:40', endTime: '10:20', isBreak: false },
    ],
    rows: [
      {
        classId: 'class-1',
        className: 'Form 1A',
        classLevel: 'Form 1',
        classStream: 'A',
        cells: [
          {
            slotIndex: 1,
            slotLabel: 'Period 1',
            startTime: '08:00',
            endTime: '08:40',
            isBreak: false,
            isAssigned: true,
            isContinuation: false,
            isDoublePeriod: false,
            period: {
              id: 'period-1',
              subjectId: 'sub-kisw',
              subjectCode: 'KISW',
              subjectName: 'Kiswahili',
              classId: 'class-1',
              className: 'Form 1A',
              teacherId: 'teach-1',
              teacherName: 'Baraka Juma',
              room: 'Room 101',
              dayOfWeek: 'MONDAY',
              startTime: '08:00',
              endTime: '08:40',
              status: 'PUBLISHED',
              isDoublePeriod: false,
              termId: 'term-uuid-1',
            },
          },
          {
            slotIndex: 2,
            slotLabel: 'Period 2',
            startTime: '08:40',
            endTime: '09:20',
            isBreak: false,
            isAssigned: false,
            isContinuation: false,
            period: null,
          },
          {
            slotIndex: 3,
            slotLabel: 'Short Break',
            startTime: '09:20',
            endTime: '09:40',
            isBreak: true,
            breakLabel: 'Short Break',
            isAssigned: false,
            isContinuation: false,
            period: null,
          },
          {
            slotIndex: 4,
            slotLabel: 'Period 3',
            startTime: '09:40',
            endTime: '10:20',
            isBreak: false,
            isAssigned: true,
            isContinuation: false,
            isDoublePeriod: true,
            period: {
              id: 'period-2',
              subjectId: 'sub-chem',
              subjectCode: 'CHEM',
              subjectName: 'Chemistry',
              classId: 'class-1',
              className: 'Form 1A',
              teacherId: 'teach-2',
              teacherName: 'Neema Mwangi',
              room: 'Science Lab 1',
              dayOfWeek: 'MONDAY',
              startTime: '09:40',
              endTime: '10:20',
              status: 'PUBLISHED',
              isDoublePeriod: true,
              termId: 'term-uuid-1',
            },
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. MasterMatrixView UX & Visual Hierarchy', () => {
    it('renders toolbar with Day Switcher, Search input, Level Filter and KPI statistics', () => {
      const html = renderToString(
        <MasterMatrixView
          matrix={mockMatrix}
          selectedDay="MONDAY"
          onDayChange={vi.fn()}
          onCellClick={vi.fn()}
          onEditCellClick={vi.fn()}
          classes={mockClasses}
        />
      );

      // Day switcher buttons
      expect(html).toContain('id="day-tab-monday"');
      expect(html).toContain('id="day-tab-tuesday"');
      expect(html).toContain('id="day-tab-wednesday"');
      expect(html).toContain('id="day-tab-thursday"');
      expect(html).toContain('id="day-tab-friday"');

      // Filters
      expect(html).toContain('id="matrix-search-input"');
      expect(html).toContain('id="matrix-level-filter"');

      // KPI chips
      expect(html).toContain('Active Form Classes');
      expect(html).toContain('Scheduled Periods Today');
      expect(html).toContain('Daily Instructional Slots');
      expect(html).toContain('Selected Day');
    });

    it('renders clean table structure with period badges, time intervals and styled break slots', () => {
      const html = renderToString(
        <MasterMatrixView
          matrix={mockMatrix}
          selectedDay="MONDAY"
          onDayChange={vi.fn()}
          onCellClick={vi.fn()}
          onEditCellClick={vi.fn()}
          classes={mockClasses}
        />
      );

      // Period header
      expect(html).toContain('Class / Stream');
      expect(html).toContain('Period 1');
      expect(html).toContain('08:00 - 08:40');
      expect(html).toContain('Short Break');

      // Sticky class column
      expect(html).toContain('Form 1A');
      expect(html).toContain('Stream');

      // Assigned lesson cards
      expect(html).toContain('matrix-assigned-cell-class-1-1');
      expect(html).toContain('KISW');
      expect(html).toContain('Baraka Juma');
      expect(html).toContain('Room 101');

      // Double period block
      expect(html).toContain('CHEM');
      expect(html).toContain('2x');
      expect(html).toContain('Neema Mwangi');
      expect(html).toContain('Science Lab 1');

      // Empty slot with assign affordance
      expect(html).toContain('Assign');
      expect(html).toContain('title="Assign lesson for Form 1A at 08:40"');

      // Legend
      expect(html).toContain('Legend:');
      expect(html).toContain('Assigned Lesson (Click to edit / reassign)');
      expect(html).toContain('Double Period (2x)');
      expect(html).toContain('Break Time');
    });
  });

  describe('2. ClassWeeklyView Schedule & Interaction', () => {
    it('renders weekly class view with days Monday to Friday and assigned periods', () => {
      const mockPeriods: TimetablePeriod[] = [
        {
          id: 'p-weekly-1',
          tenantId: 'tenant-1',
          termId: 'term-uuid-1',
          classId: 'class-1',
          subjectId: 'sub-kisw',
          teacherId: 'teach-1',
          dayOfWeek: 'MONDAY',
          startTime: '08:00',
          endTime: '08:40',
          room: 'Room 101',
          isDoublePeriod: false,
          status: 'PUBLISHED',
          class: { id: 'class-1', name: 'Form 1A', level: 'Form 1', stream: 'A' },
          subject: { id: 'sub-kisw', name: 'Kiswahili', code: 'KISW' },
          teacher: { id: 'teach-1', firstName: 'Baraka', lastName: 'Juma' },
        },
      ];

      const html = renderToString(
        <ClassWeeklyView
          periods={mockPeriods}
          classes={mockClasses}
          selectedClassId="class-1"
          onSelectClass={vi.fn()}
          onCellClick={vi.fn()}
          onEditCellClick={vi.fn()}
          canManage={true}
        />
      );

      expect(html).toContain('Form 1A');
      expect(html).toContain('Weekly Timetable');
      expect(html).toContain('Scheduled Lessons');
      expect(html).toContain('MONDAY');
      expect(html).toContain('TUESDAY');
      expect(html).toContain('KISW');
      expect(html).toContain('Kiswahili');
      expect(html).toContain('Baraka Juma');
      expect(html).toContain('Room 101');
    });
  });

  describe('3. TimetableAssignmentModal: Create, Edit & Conflict Handling', () => {
    it('renders CREATE mode with pre-filled slot details and submit button', () => {
      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            termId: 'term-uuid-1',
            classId: 'class-1',
            dayOfWeek: 'MONDAY',
            startTime: '08:40',
            endTime: '09:20',
          }}
          classes={mockClasses}
          subjects={mockSubjects}
          teachers={mockTeachers}
          terms={mockTerms}
        />
      );

      // Title
      expect(html).toContain('Assign Timetable Period');
      // Form elements
      expect(html).toContain('assignment-class-select');
      expect(html).toContain('assignment-day-select');
      expect(html).toContain('assignment-start-time');
      expect(html).toContain('assignment-end-time');
      expect(html).toContain('assignment-subject-select');
      expect(html).toContain('assignment-teacher-select');
      // Submit action
      expect(html).toContain('Assign Period');
    });

    it('renders EDIT mode with Edit Mode banner, Reassign Teacher label, and Remove Period button', () => {
      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            periodId: 'existing-period-1',
            termId: 'term-uuid-1',
            classId: 'class-1',
            subjectId: 'sub-kisw',
            teacherId: 'teach-1',
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '08:40',
            room: 'Room 101',
            isDoublePeriod: false,
          }}
          classes={mockClasses}
          subjects={mockSubjects}
          teachers={mockTeachers}
          terms={mockTerms}
        />
      );

      // Edit Mode banner and Title
      expect(html).toContain('Edit Period &amp; Teacher Allocation');
      expect(html).toContain('Edit Mode');
      expect(html).toContain('Editing active allocation');

      // Reassign Teacher label
      expect(html).toContain('Reassign Teacher');

      // Actions
      expect(html).toContain('btn-delete-period');
      expect(html).toContain('Remove Period');
      expect(html).toContain('Update Allocation');
    });

    it('renders conflict warning and disables submit when scheduling conflict is detected', () => {
      const mockConflict = [
        {
          type: 'TEACHER' as const,
          message: 'Conflict: Baraka Juma is already teaching Form 1B at this time.',
          conflictingPeriod: {
            id: 'conflicting-1',
            className: 'Form 1B',
            teacherName: 'Baraka Juma',
            startTime: '08:00',
            endTime: '08:40',
          },
        },
      ];

      const html = renderToString(
        <TimetableAssignmentModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={{
            classId: 'class-1',
            subjectId: 'sub-kisw',
            teacherId: 'teach-1',
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '08:40',
          }}
          classes={mockClasses}
          subjects={mockSubjects}
          teachers={mockTeachers}
          terms={mockTerms}
          mockConflicts={mockConflict}
        />
      );

      expect(html).toContain('conflict-alert');
      expect(html).toContain('Scheduling Conflict Detected');
      expect(html).toContain('Baraka Juma is already teaching Form 1B at this time.');
      expect(html).toContain('Hard conflict prevents submission');
      expect(html).toContain('disabled=""');
    });
  });
});
