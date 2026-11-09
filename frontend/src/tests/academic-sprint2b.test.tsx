import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { AcademicLayout } from '../components/academics/AcademicLayout';
import { SubjectRegistry } from '../components/academics/structure/SubjectRegistry';
import { TeacherAllocation } from '../components/academics/structure/TeacherAllocation';
import { SubjectRegistryPage } from '../pages/academics/SubjectRegistryPage';
import { TeacherAllocationPage } from '../pages/academics/TeacherAllocationPage';
import { Subject, Teacher, TeacherAssignment } from '../types/academics.types';
import { Permissions } from '../types/permissions';
import { api } from '../api/client';

// Mock Auth & Permissions hooks
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

describe('Sprint 2B: Subjects & Teacher Assignments Test Suite', () => {
  const mockSubjects: Subject[] = [
    {
      id: 'sub-1',
      name: 'Pure Mathematics',
      code: 'MATH',
      category: 'Core',
      status: 'ACTIVE',
      description: 'Secondary school advanced mathematics syllabus',
    },
    {
      id: 'sub-2',
      name: 'Physics',
      code: 'PHYS',
      category: 'Core',
      status: 'ACTIVE',
      description: 'Physical sciences and laboratory curriculum',
    },
    {
      id: 'sub-3',
      name: 'English Literature',
      code: 'LIT',
      category: 'Elective',
      status: 'ACTIVE',
      description: 'Literary analysis, poetry and prose',
    },
    {
      id: 'sub-4',
      name: 'Computer Science',
      code: 'CS',
      category: 'Optional',
      status: 'INACTIVE',
      description: 'Introductory programming and algorithms',
    },
  ];

  const mockClasses = [
    {
      id: 'cls-1',
      name: 'Form 1 - A',
      level: 'Form 1',
      stream: 'A',
      capacity: 45,
    },
    {
      id: 'cls-2',
      name: 'Form 2 - B',
      level: 'Form 2',
      stream: 'B',
      capacity: 40,
    },
  ];

  const mockTeachers: Teacher[] = [
    {
      id: 'tch-1',
      firstName: 'David',
      lastName: 'Mrema',
      email: 'd.mrema@schoolos.internal',
      role: 'TEACHER',
      isActive: true,
    },
    {
      id: 'tch-2',
      firstName: 'Grace',
      lastName: 'Kavuma',
      email: 'g.kavuma@schoolos.internal',
      role: 'TEACHER',
      isActive: true,
    },
  ];

  const mockAssignments: TeacherAssignment[] = [
    {
      id: 'asg-1',
      classId: 'cls-1',
      subjectId: 'sub-1',
      teacherId: 'tch-1',
      teacher: {
        id: 'tch-1',
        firstName: 'David',
        lastName: 'Mrema',
        email: 'd.mrema@schoolos.internal',
      },
      class: {
        id: 'cls-1',
        name: 'Form 1 - A',
        level: 'Form 1',
        stream: 'A',
      },
      subject: {
        id: 'sub-1',
        name: 'Pure Mathematics',
        code: 'MATH',
        description: 'Advanced mathematics',
      },
    },
    {
      id: 'asg-2',
      classId: 'cls-1',
      subjectId: 'sub-2',
      teacherId: 'tch-2',
      teacher: {
        id: 'tch-2',
        firstName: 'Grace',
        lastName: 'Kavuma',
        email: 'g.kavuma@schoolos.internal',
      },
      class: {
        id: 'cls-1',
        name: 'Form 1 - A',
        level: 'Form 1',
        stream: 'A',
      },
      subject: {
        id: 'sub-2',
        name: 'Physics',
        code: 'PHYS',
        description: 'Physical sciences',
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-acad-1',
        firstName: 'Salma',
        lastName: 'Kigoma',
        role: 'HEADMASTER',
        tenantId: 'tenant-school-1',
      },
      tenant: {
        id: 'tenant-school-1',
        name: 'Mwilamvya Secondary School',
        code: 'MWL',
        status: 'ACTIVE',
      },
      token: 'valid-auth-token',
      isLoading: false,
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((perm) =>
        [
          Permissions.VIEW_ACADEMICS,
          Permissions.MANAGE_ACADEMICS,
          Permissions.MANAGE_SUBJECTS,
          Permissions.MANAGE_CLASSES,
        ].includes(perm)
      ),
    });

    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path.includes('/academics/subjects')) {
        return { data: mockSubjects };
      }
      if (path.includes('/classes')) {
        return { data: mockClasses };
      }
      if (path.includes('/academics/teachers')) {
        return { data: mockTeachers };
      }
      if (path.includes('/academics/assignments')) {
        return { data: mockAssignments };
      }
      if (path.includes('/academics/years')) {
        return {
          data: [
            {
              id: 'yr-2026',
              name: 'Academic Year 2026',
              startDate: '2026-01-10',
              endDate: '2026-12-15',
              isActive: true,
              terms: [
                {
                  id: 't-1',
                  name: 'Term 1',
                  startDate: '2026-01-10',
                  endDate: '2026-04-15',
                  isActive: true,
                },
              ],
            },
          ],
        };
      }
      if (path.includes('/schools/my-schools')) {
        return {
          data: [
            {
              id: 'tenant-school-1',
              name: 'Mwilamvya Secondary School',
              code: 'MWL',
              status: 'ACTIVE',
            },
          ],
        };
      }
      return { data: [] };
    });
  });

  // ============================================================================
  // SECTION 1: SubjectRegistry Component Tests
  // ============================================================================
  describe('1. SubjectRegistry Component Tests', () => {
    it('renders the Subject Registry interface with title, metrics and data table', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <SubjectRegistry initialSubjects={mockSubjects} />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Verify title & subtitle
      expect(html).toContain('Subject Registry &amp; Curriculum');
      expect(html).toContain('Define and manage all academic disciplines');

      // Verify KPI Metric Cards
      expect(html).toContain('Total Subjects');
      expect(html).toContain('Core Disciplines');
      expect(html).toContain('Elective Subjects');
      expect(html).toContain('Optional Subjects');

      // Verify Table Columns
      expect(html).toContain('Subject Code');
      expect(html).toContain('Subject Name');
      expect(html).toContain('Category');
      expect(html).toContain('Status');

      // Verify Action button
      expect(html).toContain('Add Subject');
    });

    it('renders registered subjects with their codes, names, categories, and status', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <SubjectRegistry initialSubjects={mockSubjects} />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Registered subjects content
      expect(html).toContain('MATH');
      expect(html).toContain('Pure Mathematics');
      expect(html).toContain('Core');
      expect(html).toContain('PHYS');
      expect(html).toContain('Physics');
      expect(html).toContain('LIT');
      expect(html).toContain('English Literature');
      expect(html).toContain('Elective');
      expect(html).toContain('CS');
      expect(html).toContain('Computer Science');
      expect(html).toContain('Optional');
      expect(html).toContain('Inactive');

      expect(html).toContain('Search by code, subject name...');
      expect(html).toContain('All Categories');
      expect(html).toContain('All Statuses');
    });
  });

  // ============================================================================
  // SECTION 2: TeacherAllocation Component Tests
  // ============================================================================
  describe('2. TeacherAllocation Component Tests', () => {
    it('renders the Teacher Allocation interface with title, tabs and action buttons', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <TeacherAllocation
              initialClasses={mockClasses}
              initialSubjects={mockSubjects}
              initialTeachers={mockTeachers}
              initialAssignments={mockAssignments}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Title & description
      expect(html).toContain('Teacher Allocation &amp; Subject Matrix');
      expect(html).toContain('Allocate qualified teaching staff to specific subjects and class streams');

      // Action buttons
      expect(html).toContain('Assign Teacher');
      expect(html).toContain('Add Teacher');

      // Tabs
      expect(html).toContain('By Class Allocation');
      expect(html).toContain('By Teacher Workload');

      // Metrics
      expect(html).toContain('Total Allocations');
      expect(html).toContain('Active Teachers');
      expect(html).toContain('Classes Staffed');
      expect(html).toContain('Available Subjects');
    });

    it('enforces logical views and provides selectors for class-based matrix', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <TeacherAllocation
              initialClasses={mockClasses}
              initialSubjects={mockSubjects}
              initialTeachers={mockTeachers}
              initialAssignments={mockAssignments}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Select Class:');
      expect(html).toContain('Filter subjects...');
      expect(html).toContain('Form 1 - A');
      expect(html).toContain('David');
      expect(html).toContain('Mrema');
      expect(html).toContain('d.mrema@schoolos.internal');
      expect(html).toContain('Pure Mathematics');
    });
  });

  // ============================================================================
  // SECTION 3: Academic Layout & Page Routing Integration
  // ============================================================================
  describe('3. Academic Layout & Routing Integration', () => {
    it('SubjectRegistryPage renders properly inside AcademicLayout and AcademicProvider', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/structure/subjects']}>
          <AcademicProvider>
            <AcademicLayout>
              <SubjectRegistryPage initialSubjects={mockSubjects} />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      // Layout elements
      expect(html).toContain('Academic Dept');
      expect(html).toContain('ACADEMIC STRUCTURE');
      expect(html).toContain('Subjects &amp; Curriculum');

      // Page content
      expect(html).toContain('Subject Registry &amp; Curriculum');
      expect(html).toContain('Add Subject');
    });

    it('TeacherAllocationPage renders properly inside AcademicLayout and AcademicProvider', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/structure/teacher-assignments']}>
          <AcademicProvider>
            <AcademicLayout>
              <TeacherAllocationPage
                initialClasses={mockClasses}
                initialSubjects={mockSubjects}
                initialTeachers={mockTeachers}
                initialAssignments={mockAssignments}
              />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      // Layout elements
      expect(html).toContain('Academic Dept');
      expect(html).toContain('Teacher Assignments');

      // Page content
      expect(html).toContain('Teacher Allocation &amp; Subject Matrix');
      expect(html).toContain('By Class Allocation');
      expect(html).toContain('By Teacher Workload');
    });
  });
});
