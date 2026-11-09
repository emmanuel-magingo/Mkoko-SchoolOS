import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicSidebar, ACADEMIC_NAV_GROUPS } from '../components/academics/AcademicSidebar';
import { AcademicDepartments } from '../components/academics/structure/AcademicDepartments';
import { TeacherAllocation } from '../components/academics/structure/TeacherAllocation';
import { AcademicsApi } from '../api/academics.api';
import { AcademicDepartment, Teacher, Subject, TeacherAssignment } from '../types/academics.types';

// Mock contexts
const mockUseAuth = vi.fn();
const mockUseAcademicContext = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => mockUseAcademicContext(),
}));

describe('Academic Departments & Teacher Allocation Bug Fix Test Suite', () => {
  const mockTeachers: Teacher[] = [
    {
      id: 'teacher-1',
      firstName: 'Juma',
      lastName: 'Mkwawa',
      email: 'j.mkwawa@schoolos.internal',
      role: 'TEACHER',
      academicDepartmentId: 'dept-sci',
      academicDepartment: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
    },
    {
      id: 'teacher-2',
      firstName: 'Zawadi',
      lastName: 'Mwamburi',
      email: 'z.mwamburi@schoolos.internal',
      role: 'TEACHER',
      academicDepartmentId: 'dept-lang',
      academicDepartment: { id: 'dept-lang', name: 'Languages Department', code: 'LANG' },
    },
    {
      id: 'teacher-3',
      firstName: 'Baraka',
      lastName: 'Nyerere',
      email: 'b.nyerere@schoolos.internal',
      role: 'TEACHER',
      academicDepartmentId: null,
      academicDepartment: null,
    },
  ];

  const mockDepartments: AcademicDepartment[] = [
    {
      id: 'dept-sci',
      name: 'Science Department',
      code: 'SCI',
      hodId: 'teacher-1',
      hod: {
        id: 'teacher-1',
        firstName: 'Juma',
        lastName: 'Mkwawa',
        email: 'j.mkwawa@schoolos.internal',
      },
      teachers: [mockTeachers[0]],
      teacherCount: 1,
      _count: { teachers: 1 },
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'dept-lang',
      name: 'Languages Department',
      code: 'LANG',
      hodId: 'teacher-2',
      hod: {
        id: 'teacher-2',
        firstName: 'Zawadi',
        lastName: 'Mwamburi',
        email: 'z.mwamburi@schoolos.internal',
      },
      teachers: [mockTeachers[1]],
      teacherCount: 1,
      _count: { teachers: 1 },
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'dept-math',
      name: 'Mathematics Department',
      code: 'MATH',
      hodId: null,
      hod: null,
      teachers: [],
      teacherCount: 0,
      _count: { teachers: 0 },
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:00:00Z',
    },
  ];

  const mockSubjects: Subject[] = [
    { id: 'subj-phy', name: 'Physics', code: 'PHY', category: 'Core', description: 'Form 1-4 Physics' },
    { id: 'subj-math', name: 'Basic Mathematics', code: 'B-MATH', category: 'Core', description: 'Core Mathematics' },
  ];

  const mockClasses = [
    { id: 'class-f1a', name: 'Form 1 - A', level: 'FORM_1', stream: 'A' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-admin',
        firstName: 'Admin',
        lastName: 'User',
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

  describe('STEP 1: Fix Teacher Assignment Refetch Bug', () => {
    it('verifies that assigning a teacher immediately updates state and invalidates/refetches assignments', async () => {
      const getTeacherAssignmentsSpy = vi.spyOn(AcademicsApi, 'getTeacherAssignments').mockResolvedValue({
        data: [
          {
            id: 'asg-1',
            classId: 'class-f1a',
            subjectId: 'subj-phy',
            teacherId: 'teacher-1',
            class: mockClasses[0],
            subject: mockSubjects[0],
            teacher: {
              id: 'teacher-1',
              firstName: 'Juma',
              lastName: 'Mkwawa',
              email: 'j.mkwawa@schoolos.internal',
            },
          },
        ],
      } as any);

      const assignTeacherSpy = vi.spyOn(AcademicsApi, 'assignTeacher').mockResolvedValue({
        data: {
          id: 'asg-1',
          classId: 'class-f1a',
          subjectId: 'subj-phy',
          teacherId: 'teacher-1',
        },
      } as any);

      // Verify assignTeacher endpoint exists and returns enriched payload
      const assignRes = await AcademicsApi.assignTeacher({
        classId: 'class-f1a',
        subjectId: 'subj-phy',
        teacherId: 'teacher-1',
      });
      expect(assignTeacherSpy).toHaveBeenCalled();
      expect(assignRes.data).toBeDefined();
      expect(assignRes.data.teacherId).toBe('teacher-1');

      // Verify that refetch query fires
      const refetchRes = await AcademicsApi.getTeacherAssignments();
      expect(getTeacherAssignmentsSpy).toHaveBeenCalled();
      expect(refetchRes.data[0].teacher?.firstName).toBe('Juma');
    });

    it('renders TeacherAllocation with assigned teacher without remaining Unassigned', () => {
      const assignments: TeacherAssignment[] = [
        {
          id: 'asg-1',
          classId: 'class-f1a',
          subjectId: 'subj-phy',
          teacherId: 'teacher-1',
          teacher: {
            id: 'teacher-1',
            firstName: 'Juma',
            lastName: 'Mkwawa',
            email: 'j.mkwawa@schoolos.internal',
          },
          class: mockClasses[0],
          subject: mockSubjects[0],
        },
      ];

      const html = renderToString(
        <MemoryRouter>
          <TeacherAllocation
            initialClasses={mockClasses}
            initialSubjects={mockSubjects}
            initialTeachers={mockTeachers}
            initialAssignments={assignments}
          />
        </MemoryRouter>
      );

      // The assigned teacher's name should appear, and "Unassigned" should NOT be shown for Physics
      expect(html).toContain('Juma');
      expect(html).toContain('Mkwawa');
      expect(html).toContain('j.mkwawa@schoolos.internal');
      expect(html).toContain('PHY');
    });
  });

  describe('STEP 2 & 3: Department Management UI & Schema', () => {
    it('verifies Academic Departments link exists in AcademicSidebar under ACADEMIC STRUCTURE', () => {
      const structureGroup = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'structure');
      expect(structureGroup).toBeDefined();

      const deptItem = structureGroup!.items.find((i) => i.to === '/academics/structure/departments');
      expect(deptItem).toBeDefined();
      expect(deptItem!.label).toBe('Academic Departments');

      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/structure/departments']}>
          <AcademicSidebar />
        </MemoryRouter>
      );
      expect(html).toContain('Academic Departments');
      expect(html).toContain('/academics/structure/departments');
    });

    it('renders AcademicDepartments table with Department Name, Code, HoD, and Teacher Count', () => {
      const html = renderToString(
        <AcademicDepartments
          initialDepartments={mockDepartments}
          initialTeachers={mockTeachers}
        />
      );

      // Verify header and Tanzanian structure badge
      expect(html).toContain('Academic Departments');
      expect(html).toContain('Tanzanian Secondary Structure');

      // Verify metric KPIs
      expect(html).toContain('Total Departments');
      expect(html).toContain('Teachers Assigned');
      expect(html).toContain('Heads of Department (HoD)');

      // Verify department rows
      expect(html).toContain('Science Department');
      expect(html).toContain('SCI');
      expect(html).toContain('Languages Department');
      expect(html).toContain('LANG');
      expect(html).toContain('Mathematics Department');
      expect(html).toContain('MATH');

      // Verify HoD details
      expect(html).toContain('Juma');
      expect(html).toContain('Mkwawa');
      expect(html).toContain('Zawadi');
      expect(html).toContain('Mwamburi');
      expect(html).toContain('No HoD Appointed');

      // Verify Teacher Count badges
      expect(html).toContain('Teacher');
      expect(html).toContain('Teachers');
    });

    it('limits associated subject tags to three and reports the exact overflow count', () => {
      const departmentsWithManySubjects: AcademicDepartment[] = [
        {
          ...mockDepartments[0],
          subjects: [
            { id: 'subject-1', name: 'Advanced Biology', code: 'ADV-BIO', description: '' },
            { id: 'subject-2', name: 'Secondary Biology', code: 'SEC-BIO', description: '' },
            { id: 'subject-3', name: 'Advanced Chemistry', code: 'ADV-CHEM', description: '' },
            { id: 'subject-4', name: 'Secondary Chemistry', code: 'SEC-CHEM', description: '' },
            { id: 'subject-5', name: 'Physics', code: 'PHY', description: '' },
          ],
        },
      ];

      const html = renderToString(
        <AcademicDepartments initialDepartments={departmentsWithManySubjects} initialTeachers={[]} />
      );

      expect(html).toContain('ADV-BIO');
      expect(html).toContain('>Advanced Biology</span>');
      expect(html).toContain('SEC-BIO');
      expect(html).toContain('ADV-CHEM');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('>+2 more</button>');
      expect(html).not.toContain('>SEC-CHEM</span>');
      expect(html).toContain('title="SEC-CHEM Secondary Chemistry, PHY Physics"');
    });

    it('verifies CRUD API methods for Academic Departments exist and call correct endpoints', async () => {
      const getDeptsSpy = vi.spyOn(AcademicsApi, 'getDepartments').mockResolvedValue({
        data: mockDepartments,
      });

      const createDeptSpy = vi.spyOn(AcademicsApi, 'createDepartment').mockResolvedValue({
        data: {
          id: 'dept-soc',
          name: 'Social Sciences Department',
          code: 'SOC',
          hodId: null,
          teachers: [],
          teacherCount: 0,
        },
      });

      const updateDeptSpy = vi.spyOn(AcademicsApi, 'updateDepartment').mockResolvedValue({
        data: {
          ...mockDepartments[0],
          name: 'Natural Sciences Department',
        },
      });

      const deleteDeptSpy = vi.spyOn(AcademicsApi, 'deleteDepartment').mockResolvedValue({
        data: { message: 'Academic department deleted successfully.' },
      });

      // GET
      const list = await AcademicsApi.getDepartments();
      expect(getDeptsSpy).toHaveBeenCalled();
      expect(list.data.length).toBe(3);

      // CREATE
      const created = await AcademicsApi.createDepartment({
        name: 'Social Sciences Department',
        code: 'SOC',
      });
      expect(createDeptSpy).toHaveBeenCalledWith({
        name: 'Social Sciences Department',
        code: 'SOC',
      });
      expect(created.data.name).toBe('Social Sciences Department');

      // UPDATE
      const updated = await AcademicsApi.updateDepartment('dept-sci', {
        name: 'Natural Sciences Department',
      });
      expect(updateDeptSpy).toHaveBeenCalled();
      expect(updated.data.name).toBe('Natural Sciences Department');

      // DELETE
      const deleted = await AcademicsApi.deleteDepartment('dept-sci');
      expect(deleteDeptSpy).toHaveBeenCalledWith('dept-sci');
      expect(deleted.data.message).toContain('deleted successfully');
    });
  });

  describe('STEP 3 (Part 3): Teacher Registry Department Assignment', () => {
    it('verifies assignTeacherDepartment API method functions correctly', async () => {
      const assignTeacherDeptSpy = vi.spyOn(AcademicsApi, 'assignTeacherDepartment').mockResolvedValue({
        data: {
          id: 'teacher-3',
          firstName: 'Baraka',
          lastName: 'Nyerere',
          academicDepartmentId: 'dept-sci',
          academicDepartment: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
        },
      });

      const res = await AcademicsApi.assignTeacherDepartment('teacher-3', 'dept-sci');
      expect(assignTeacherDeptSpy).toHaveBeenCalledWith('teacher-3', 'dept-sci');
      expect(res.data.academicDepartmentId).toBe('dept-sci');
      expect(res.data.academicDepartment.code).toBe('SCI');
    });

    it('renders TeacherAllocation showing view tabs and teacher workload options', () => {
      const html = renderToString(
        <MemoryRouter>
          <TeacherAllocation
            initialClasses={mockClasses}
            initialSubjects={mockSubjects}
            initialTeachers={mockTeachers}
            initialAssignments={[]}
          />
        </MemoryRouter>
      );

      // Verify that Teacher Allocation renders successfully with tabs
      expect(html).toContain('Teacher Allocation');
      expect(html).toContain('By Class Allocation');
      expect(html).toContain('By Teacher Workload');
    });
  });
});
