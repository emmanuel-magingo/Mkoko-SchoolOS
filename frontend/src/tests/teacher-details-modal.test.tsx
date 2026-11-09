import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { TeacherDetailsModal } from '../components/academics/structure/TeacherDetailsModal';
import { TeacherAllocation } from '../components/academics/structure/TeacherAllocation';
import { AcademicsApi } from '../api/academics.api';
import { Teacher } from '../types/academics.types';
import { getSchoolNavGroups, filterNavGroups } from '../components/layout/navigationConfig';
import { Permissions } from '../types/permissions';
import { User, Tenant } from '../types';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', role: 'SENIOR_ACADEMIC_MASTER' },
    tenant: { id: 't1' },
    logout: vi.fn(),
  }),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => ({
    selectedSchool: { id: 't1', name: 'Mwilamvya Secondary School' },
  }),
}));

describe('Teacher Details Modal, Auto-Department Allocation & Navigation Cleanup Suite', () => {
  const mockTeacherWithDepartment: Teacher = {
    id: 'teacher-101',
    firstName: 'Peter',
    lastName: 'Msigwa',
    email: 'p.msigwa@schoolos.internal',
    role: 'TEACHER',
    academicDepartmentId: 'dept-sci',
    academicDepartment: {
      id: 'dept-sci',
      name: 'Science Department',
      code: 'SCI',
    },
    assignments: [
      {
        id: 'assign-1',
        teacherId: 'teacher-101',
        classId: 'class-1',
        subjectId: 'sub-1',
        isPrimary: true,
        teacher: {
          id: 'teacher-101',
          firstName: 'Peter',
          lastName: 'Msigwa',
          email: 'p.msigwa@schoolos.internal',
        },
        subject: {
          id: 'sub-1',
          name: 'Physics',
          code: 'PHY-01',
          description: 'Basic Physics',
          category: 'Core',
        },
        class: {
          id: 'class-1',
          name: 'Form 1A',
          level: 'Form 1',
          stream: 'A',
        },
      },
      {
        id: 'assign-2',
        teacherId: 'teacher-101',
        classId: 'class-2',
        subjectId: 'sub-2',
        isPrimary: true,
        subject: {
          id: 'sub-2',
          name: 'Chemistry',
          code: 'CHE-01',
          description: 'General Chemistry',
          category: 'Core',
        },
        class: {
          id: 'class-2',
          name: 'Form 2B',
          level: 'Form 2',
          stream: 'B',
        },
      },
    ],
  };

  const mockTeacherUnassigned: Teacher = {
    id: 'teacher-102',
    firstName: 'Amina',
    lastName: 'Bakari',
    email: 'a.bakari@schoolos.internal',
    role: 'TEACHER',
    academicDepartmentId: null,
    academicDepartment: null,
    assignments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('STEP 1: Navigation Cleanup Verification', () => {
    it('ensures SENIOR_ACADEMIC_MASTER only sees Academic Dashboard and generic Dashboard is removed', () => {
      const mockTenant: Tenant = {
        id: 'tenant-test-1',
        name: 'Mwilamvya Secondary School',
        code: 'MWL',
        slug: 'mwilamvya',
        status: 'PILOT',
      };

      const academicMasterUser: User = {
        id: 'user-sam',
        email: 'sam@school.org',
        firstName: 'Academic',
        lastName: 'Master',
        role: 'SENIOR_ACADEMIC_MASTER',
        tenantId: mockTenant.id,
      };

      const groups = getSchoolNavGroups({
        user: academicMasterUser,
        tenant: mockTenant,
        hasPermission: (p) => [Permissions.VIEW_ACADEMICS, Permissions.MANAGE_ACADEMICS].includes(p as any),
      });

      const visibleGroups = filterNavGroups(groups, '', new Set(['academics']), false, true);
      const visibleGroupIds = visibleGroups.map((g) => g.id);

      // Overview should be hidden for SENIOR_ACADEMIC_MASTER
      expect(visibleGroupIds).not.toContain('overview');
      // Academics should be visible with Academic Dashboard
      expect(visibleGroupIds).toContain('academics');

      const academicGroup = visibleGroups.find((g) => g.id === 'academics');
      expect(academicGroup).toBeDefined();
      const dashboardItem = academicGroup?.items.find((i) => i.to === '/academics');
      expect(dashboardItem?.label).toBe('Academic Dashboard');

      // Absolute and only dashboard entry point
      const allDashboardItems = visibleGroups
        .flatMap((g) => g.items)
        .filter((item) => item.label.toLowerCase().includes('dashboard'));
      expect(allDashboardItems).toHaveLength(1);
      expect(allDashboardItems[0].to).toBe('/academics');
      expect(allDashboardItems[0].label).toBe('Academic Dashboard');
    });
  });

  describe('STEP 2: TeacherDetailsModal UI Enhancements', () => {
    it('renders the teacher name, department badge, and assigned subjects table for an allocated teacher', () => {
      const html = renderToString(
        <TeacherDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          teacherId={mockTeacherWithDepartment.id}
          initialTeacher={mockTeacherWithDepartment}
        />
      );

      // Teacher Name & Info
      expect(html).toContain('Peter Msigwa');
      expect(html).toContain('p.msigwa@schoolos.internal');

      // Department Badge
      expect(html).toContain('Science Department');
      expect(html).toContain('(SCI)');
      expect(html).toContain('teacher-department-badge');

      // Teaching Load section & table
      expect(html).toContain('Teaching Load &amp; Assigned Subjects');
      expect(html).toContain('teacher-assignments-table');
      expect(html).toContain('Physics');
      expect(html).toContain('PHY-01');
      expect(html).toContain('Form 1A');
      expect(html).toContain('Chemistry');
      expect(html).toContain('CHE-01');
      expect(html).toContain('Form 2B');
      expect(html).toContain('Lead Teacher');
    });

    it('renders unassigned department badge and empty state when teacher has no department or subjects', () => {
      const html = renderToString(
        <TeacherDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          teacherId={mockTeacherUnassigned.id}
          initialTeacher={mockTeacherUnassigned}
        />
      );

      // Teacher Name
      expect(html).toContain('Amina Bakari');

      // Unassigned Department Badge
      expect(html).toContain('Unassigned Department');

      // Empty State for Teaching Load
      expect(html).toContain('No Teaching Load Assigned');
      expect(html).toContain('This teacher has not yet been assigned to any subjects or classes.');
    });

    it('does not render anything when isOpen is false', () => {
      const html = renderToString(
        <TeacherDetailsModal
          isOpen={false}
          onClose={vi.fn()}
          teacherId={mockTeacherWithDepartment.id}
          initialTeacher={mockTeacherWithDepartment}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('STEP 3: Integration in TeacherAllocation & AcademicDepartments', () => {
    it('renders clickable teacher entries in TeacherAllocation and View Profile button', () => {
      vi.spyOn(AcademicsApi, 'getTeachers').mockResolvedValue({
        data: [mockTeacherWithDepartment],
      });
      vi.spyOn(AcademicsApi, 'getClasses').mockResolvedValue({
        data: [{ id: 'class-1', name: 'Form 1A', level: 'Form 1', stream: 'A' }],
      });
      vi.spyOn(AcademicsApi, 'getSubjects').mockResolvedValue({
        data: [{ id: 'sub-1', name: 'Physics', code: 'PHY-01', description: null }],
      });
      vi.spyOn(AcademicsApi, 'getTeacherAssignments').mockResolvedValue({
        data: [mockTeacherWithDepartment.assignments![0]],
      });
      vi.spyOn(AcademicsApi, 'getDepartments').mockResolvedValue({
        data: [mockTeacherWithDepartment.academicDepartment as any],
      });

      const html = renderToString(
        <MemoryRouter>
          <TeacherAllocation
            initialTeachers={[mockTeacherWithDepartment]}
            initialClasses={[{ id: 'class-1', name: 'Form 1A', level: 'Form 1', stream: 'A' }]}
            initialSubjects={[{ id: 'sub-1', name: 'Physics', code: 'PHY-01', description: null }]}
            initialAssignments={[mockTeacherWithDepartment.assignments![0]]}
          />
        </MemoryRouter>
      );
      // In BY_CLASS table
      expect(html).toContain('Peter');
      expect(html).toContain('Msigwa');
      expect(html).toContain('Click to view teacher profile &amp; teaching load');
    });

    it('AcademicsApi exposes getTeacher endpoint', async () => {
      const spy = vi.spyOn(AcademicsApi, 'getTeacher').mockResolvedValue({
        data: mockTeacherWithDepartment,
      });

      const res = await AcademicsApi.getTeacher('teacher-101');
      expect(spy).toHaveBeenCalledWith('teacher-101');
      expect(res.data.id).toBe('teacher-101');
      expect(res.data.academicDepartment?.name).toBe('Science Department');
      expect(res.data.assignments).toHaveLength(2);
    });
  });
});
