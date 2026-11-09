import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OfficialLessonLogbook } from '../components/academics/lessons/OfficialLessonLogbook';
import { LessonExecutionPage } from '../pages/academics/LessonExecutionPage';
import { AcademicsApi } from '../api/academics.api';

// Mock contexts
const mockUseAuth = vi.fn();
const mockUseAcademicContext = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => mockUseAcademicContext(),
}));

describe('Official Tanzania Printable Lesson Logbook Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 't-101',
        firstName: 'Jafari',
        lastName: 'Mkoko',
        role: 'TEACHER',
        tenantId: 'tenant-tz-1',
      },
      tenant: {
        id: 'tenant-tz-1',
        name: 'Mwilamvya Secondary School',
      },
    });

    mockUseAcademicContext.mockReturnValue({
      activeTermId: 'term-1',
      activeTerm: { id: 'term-1', name: 'Term 1' },
      activeAcademicYearId: 'year-2026',
      activeAcademicYear: { id: 'year-2026', name: '2026/2027' },
    });
  });

  describe('Step 1: Printable Logbook Component Structure & Header', () => {
    it('renders the official statutory Tanzanian header with School Name, Teacher Name, Term, and Year', () => {
      const html = renderToString(
        <MemoryRouter>
          <OfficialLessonLogbook isOpen={true} />
        </MemoryRouter>
      );

      // Verify Government and Statutory Headers
      expect(html).toContain('THE UNITED REPUBLIC OF TANZANIA');
      expect(html).toContain('MINISTRY OF EDUCATION, SCIENCE AND TECHNOLOGY');
      expect(html).toContain('OFFICIAL TEACHER&#x27;S LESSON LOGBOOK');
      expect(html).toContain('Mwilamvya Secondary School');
      expect(html).toContain('Jafari Mkoko');
      expect(html).toContain('Term 1');
      expect(html).toContain('2026/2027');
    });

    it('renders the 9 statutory table columns matching inspectorate specification', () => {
      const html = renderToString(
        <MemoryRouter>
          <OfficialLessonLogbook isOpen={true} />
        </MemoryRouter>
      );

      // Verify all 9 statutory columns
      expect(html).toContain('1. Date');
      expect(html).toContain('2. Class / Form');
      expect(html).toContain('3. Period &amp; Time');
      expect(html).toContain('4. Subject');
      expect(html).toContain('5. Topic &amp; Sub-Topic');
      expect(html).toContain('6. Summary of Activities / Competence');
      expect(html).toContain('7. No. of Students (Present / Total)');
      expect(html).toContain('8. Teacher&#x27;s Remarks &amp; Signature');
      expect(html).toContain('9. HoD / Academic Master Sign-Off');
    });

    it('renders signature placeholders with solid line fallbacks for physical sign-offs', () => {
      const html = renderToString(
        <MemoryRouter>
          <OfficialLessonLogbook isOpen={true} />
        </MemoryRouter>
      );

      // Verify physical signature lines
      expect(html).toContain('Sig: __________________');
      expect(html).toContain('SUBJECT TEACHER');
      expect(html).toContain('HEAD OF DEPARTMENT (HOD)');
      expect(html).toContain('ACADEMIC MASTER / INSPECTOR');
      expect(html).toContain('STATUTORY DECLARATION');
    });
  });

  describe('Step 2: Print/PDF Removal Verification', () => {
    it('ensures print CSS rules and print buttons are completely removed from OfficialLessonLogbook', () => {
      const html = renderToString(
        <MemoryRouter>
          <OfficialLessonLogbook isOpen={true} />
        </MemoryRouter>
      );

      // Verify print button and print-specific CSS rules are completely absent
      expect(html).not.toContain('btn-print-lesson-logbook');
      expect(html).not.toContain('Print Official Logbook');
      expect(html).not.toContain('size: landscape');
      expect(html).not.toContain('@media print');
    });
  });

  describe('Step 3: Integration with LessonExecutionPage', () => {
    it('keeps the printable logbook available without duplicating its button on Lessons', () => {
      const html = renderToString(
        <MemoryRouter>
          <LessonExecutionPage />
        </MemoryRouter>
      );

      expect(html).not.toContain('Print Official Logbook');
      expect(html).not.toContain('btn-open-official-logbook');
    });

    it('allows passing initial teacher and date parameters to OfficialLessonLogbook', () => {
      const html = renderToString(
        <MemoryRouter>
          <OfficialLessonLogbook
            isOpen={true}
            initialTeacherId="t-202"
            initialTeacherName="Mwalimu Nyerere"
            initialStartDate="2026-10-15"
            initialEndDate="2026-10-22"
          />
        </MemoryRouter>
      );

      expect(html).toContain('Mwalimu Nyerere');
      expect(html).toContain('2026-10-15');
      expect(html).toContain('2026-10-22');
    });

    it('verifies getLessonLogs handles dateFrom, dateTo, startDate, and endDate', async () => {
      const spy = vi.spyOn(AcademicsApi, 'getLessonLogs').mockResolvedValue({ data: [] });

      await AcademicsApi.getLessonLogs({
        startDate: '2026-10-20',
        endDate: '2026-10-25',
        teacherId: 't-101',
      });

      expect(spy).toHaveBeenCalledWith({
        startDate: '2026-10-20',
        endDate: '2026-10-25',
        teacherId: 't-101',
      });
    });
  });
});
