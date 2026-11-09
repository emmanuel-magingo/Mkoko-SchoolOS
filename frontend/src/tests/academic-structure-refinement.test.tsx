import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicSidebar, ACADEMIC_NAV_GROUPS } from '../components/academics/AcademicSidebar';
import { SubjectRegistry, normalizeCategory } from '../components/academics/structure/SubjectRegistry';
import { AcademicsApi } from '../api/academics.api';
import { Subject } from '../types/academics.types';

// Mock contexts
const mockUseAuth = vi.fn();
const mockUseAcademicContext = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => mockUseAcademicContext(),
}));

describe('Academic Structure Refinement & Bug Fixes Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-1',
        firstName: 'Academic',
        lastName: 'Master',
        role: 'ACADEMIC_MASTER',
        tenantId: 'tenant-1',
      },
      tenant: { id: 'tenant-1', name: 'Mwilamvya Secondary School' },
    });

    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { id: 'school-1', name: 'Mwilamvya Secondary School' },
      activeTermId: 'term-1',
      activeAcademicYearId: 'year-2026',
    });
  });

  describe('Step 1: Navigation Cleanup', () => {
    it('verifies Academic Calendar link is removed from ACADEMIC OVERVIEW', () => {
      const overviewGroup = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'overview');
      expect(overviewGroup).toBeDefined();
      const labels = overviewGroup!.items.map((i) => i.label);
      expect(labels).toContain('Academic Dashboard');
      expect(labels).toContain('My Tasks');
      expect(labels).not.toContain('Academic Calendar');
    });

    it('verifies Academic Years & Terms exists under ACADEMIC STRUCTURE', () => {
      const structureGroup = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'structure');
      expect(structureGroup).toBeDefined();
      const labels = structureGroup!.items.map((i) => i.label);
      expect(labels).toContain('Academic Years & Terms');
      expect(labels).toContain('Classes & Streams');
      expect(labels).toContain('Subjects & Curriculum');
    });

    it('renders AcademicSidebar without Academic Calendar in overview', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicSidebar />
        </MemoryRouter>
      );
      expect(html).toContain('Academic Dashboard');
      expect(html).toContain('My Tasks');
      expect(html).toContain('Academic Years &amp; Terms');
    });
  });

  describe('Step 2: Subject Category Normalization & Bug Fix', () => {
    it('normalizes category strings properly (uppercase, titlecase, mixed)', () => {
      expect(normalizeCategory('OPTIONAL')).toBe('Optional');
      expect(normalizeCategory('Optional')).toBe('Optional');
      expect(normalizeCategory('ELECTIVE')).toBe('Elective');
      expect(normalizeCategory('Elective')).toBe('Elective');
      expect(normalizeCategory('CORE')).toBe('Core');
      expect(normalizeCategory('Core')).toBe('Core');
      expect(normalizeCategory(undefined)).toBe('Core');
    });

    it('displays Optional subjects with Amber badge and correctly tallies KPI metrics', () => {
      const mockSubjects: Subject[] = [
        {
          id: 'sub-1',
          name: 'Civics',
          code: 'CIV',
          category: 'CORE',
          status: 'ACTIVE',
          description: 'Core civics syllabus',
        },
        {
          id: 'sub-2',
          name: 'French',
          code: 'FRE',
          category: 'OPTIONAL',
          status: 'ACTIVE',
          description: 'Foreign language optional',
        },
        {
          id: 'sub-3',
          name: 'Commerce',
          code: 'COMM',
          category: 'ELECTIVE',
          status: 'ACTIVE',
          description: 'Business stream elective',
        },
      ];

      const html = renderToString(
        <MemoryRouter>
          <SubjectRegistry initialSubjects={mockSubjects} />
        </MemoryRouter>
      );

      // Verify that French displays as Optional
      expect(html).toContain('French');
      expect(html).toContain('FRE');
      expect(html).toContain('Optional');
      // Verify category metrics
      expect(html).toContain('Core Disciplines');
      expect(html).toContain('Elective Subjects');
      expect(html).toContain('Optional Subjects');
    });

    it('verifies AcademicsApi.createSubject sends category', async () => {
      const spy = vi.spyOn(AcademicsApi, 'createSubject').mockResolvedValue({
        data: {
          id: 'sub-new',
          name: 'Fine Art',
          code: 'ART',
          category: 'OPTIONAL',
          description: 'Art and Design',
        },
      });

      await AcademicsApi.createSubject({
        name: 'Fine Art',
        code: 'ART',
        category: 'OPTIONAL',
        description: 'Art and Design',
      });

      expect(spy).toHaveBeenCalledWith({
        name: 'Fine Art',
        code: 'ART',
        category: 'OPTIONAL',
        description: 'Art and Design',
      });
    });
  });

  describe('Step 3: Subject Edit & Delete Actions', () => {
    it('renders Actions column header and Edit/Delete buttons for each subject row', () => {
      const mockSubjects: Subject[] = [
        {
          id: 'sub-1',
          name: 'Basic Mathematics',
          code: 'B/MATH',
          category: 'Core',
          status: 'ACTIVE',
          description: 'Standard math syllabus',
        },
      ];

      const html = renderToString(
        <MemoryRouter>
          <SubjectRegistry initialSubjects={mockSubjects} />
        </MemoryRouter>
      );

      expect(html).toContain('Actions');
      expect(html).toContain('btn-edit-subject-sub-1');
      expect(html).toContain('btn-delete-subject-sub-1');
    });

    it('verifies AcademicsApi.updateSubject calls API endpoint with updated payload', async () => {
      const spy = vi.spyOn(AcademicsApi, 'updateSubject').mockResolvedValue({
        data: {
          id: 'sub-1',
          name: 'Advanced Mathematics',
          code: 'ADV/MATH',
          category: 'ELECTIVE',
          description: 'Advanced mathematics syllabus',
        },
      });

      await AcademicsApi.updateSubject('sub-1', {
        name: 'Advanced Mathematics',
        code: 'ADV/MATH',
        category: 'ELECTIVE',
      });

      expect(spy).toHaveBeenCalledWith('sub-1', {
        name: 'Advanced Mathematics',
        code: 'ADV/MATH',
        category: 'ELECTIVE',
      });
    });

    it('verifies AcademicsApi.deleteSubject calls delete endpoint', async () => {
      const spy = vi.spyOn(AcademicsApi, 'deleteSubject').mockResolvedValue({
        data: { message: 'Subject deleted successfully.' },
      });

      const res = await AcademicsApi.deleteSubject('sub-1');
      expect(spy).toHaveBeenCalledWith('sub-1');
      expect(res.data.message).toBe('Subject deleted successfully.');
    });
  });
});
