import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { SubjectRegistry } from '../components/academics/structure/SubjectRegistry';
import { AcademicDepartments } from '../components/academics/structure/AcademicDepartments';
import { TeacherDetailsModal } from '../components/academics/structure/TeacherDetailsModal';
import { AcademicsApi } from '../api/academics.api';
import { AcademicDepartment, Teacher, Subject } from '../types/academics.types';

// Mock contexts
const mockUseAuth = vi.fn();
const mockUseAcademicContext = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => mockUseAcademicContext(),
}));

describe('Academic Departments, Subject Ownership & Teacher UI Workflows', () => {
  const mockDepartments: AcademicDepartment[] = [
    {
      id: 'dept-econ',
      name: 'Economics & Commerce',
      code: 'ECON',
      hodId: 'teacher-1',
      teacherCount: 1,
      subjectCount: 1,
      subjects: [
        { id: 'subj-econ', name: 'Economics', code: 'ECON-1', departmentId: 'dept-econ', category: 'Elective', description: null },
      ],
      teachers: [
        { id: 'teacher-1', firstName: 'Baraka', lastName: 'Mwangi', email: 'b.mwangi@schoolos.internal', role: 'TEACHER', academicDepartmentId: 'dept-econ' },
      ],
    },
    {
      id: 'dept-sci',
      name: 'Science Department',
      code: 'SCI',
      hodId: 'teacher-2',
      teacherCount: 1,
      subjectCount: 3,
      subjects: [
        { id: 'subj-bio', name: 'Biology', code: 'BIO-1', departmentId: 'dept-sci', category: 'Core', description: null },
        { id: 'subj-chem', name: 'Chemistry', code: 'CHEM-1', departmentId: 'dept-sci', category: 'Core', description: null },
        { id: 'subj-phys', name: 'Physics', code: 'PHYS-1', departmentId: 'dept-sci', category: 'Core', description: null },
      ],
      teachers: [
        { id: 'teacher-2', firstName: 'Neema', lastName: 'Mrema', email: 'n.mrema@schoolos.internal', role: 'TEACHER', academicDepartmentId: 'dept-sci' },
      ],
    },
    {
      id: 'dept-empty',
      name: 'Music & Arts',
      code: 'ARTS',
      hodId: null,
      teacherCount: 0,
      subjectCount: 0,
      subjects: [],
      teachers: [],
    },
  ];

  const mockSubjects: Subject[] = [
    {
      id: 'subj-econ',
      name: 'Economics',
      code: 'ECON-1',
      departmentId: 'dept-econ',
      department: { id: 'dept-econ', name: 'Economics & Commerce', code: 'ECON' },
      category: 'Elective',
      description: null,
    },
    {
      id: 'subj-bio',
      name: 'Biology',
      code: 'BIO-1',
      departmentId: 'dept-sci',
      department: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      category: 'Core',
      description: null,
    },
    {
      id: 'subj-chem',
      name: 'Chemistry',
      code: 'CHEM-1',
      departmentId: 'dept-sci',
      department: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      category: 'Core',
      description: null,
    },
    {
      id: 'subj-phys',
      name: 'Physics',
      code: 'PHYS-1',
      departmentId: 'dept-sci',
      department: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      category: 'Core',
      description: null,
    },
    {
      id: 'subj-unassigned',
      name: 'General Studies',
      code: 'GS-101',
      departmentId: null,
      department: null,
      category: 'Core',
      description: null,
    },
  ];

  const mockTeachers: Teacher[] = [
    {
      id: 'teacher-1',
      firstName: 'Baraka',
      lastName: 'Mwangi',
      email: 'b.mwangi@schoolos.internal',
      role: 'TEACHER',
      academicDepartmentId: 'dept-econ',
      academicDepartment: { id: 'dept-econ', name: 'Economics & Commerce', code: 'ECON' },
      assignments: [],
    },
    {
      id: 'teacher-2',
      firstName: 'Neema',
      lastName: 'Mrema',
      email: 'n.mrema@schoolos.internal',
      role: 'TEACHER',
      academicDepartmentId: 'dept-sci',
      academicDepartment: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      assignments: [],
    },
    {
      id: 'teacher-3',
      firstName: 'Zuberi',
      lastName: 'Hassan',
      email: 'z.hassan@schoolos.internal',
      role: 'TEACHER',
      academicDepartmentId: null,
      academicDepartment: null,
      assignments: [],
    },
  ];

  const mockClasses = [
    { id: 'class-1', name: 'Form 1A', level: 'FORM_1', stream: 'A' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-admin',
        firstName: 'Academic',
        lastName: 'Master',
        role: 'ACADEMIC_MASTER',
        tenantId: 'tenant-1',
      },
      tenant: { id: 'tenant-1', name: 'Mkoko High School' },
    });

    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { id: 'school-1', name: 'Mkoko High School' },
      activeTermId: 'term-1',
      activeAcademicYearId: 'year-2026',
    });

    vi.spyOn(AcademicsApi, 'getDepartments').mockResolvedValue({ data: mockDepartments } as any);
    vi.spyOn(AcademicsApi, 'getSubjects').mockResolvedValue({ data: mockSubjects } as any);
    vi.spyOn(AcademicsApi, 'getTeachers').mockResolvedValue({ data: mockTeachers } as any);
    vi.spyOn(AcademicsApi, 'getClasses').mockResolvedValue({ data: mockClasses } as any);
    vi.spyOn(AcademicsApi, 'getTeacherAssignments').mockResolvedValue({ data: [] } as any);
  });

  // ---------------------------------------------------------------------------
  // 1. SubjectRegistry displays each subject's department or Unassigned
  // ---------------------------------------------------------------------------
  it('1. SubjectRegistry displays Department column with associated department badges', () => {
    const html = renderToString(
      <MemoryRouter>
        <SubjectRegistry initialSubjects={mockSubjects} />
      </MemoryRouter>
    );

    expect(html).toContain('Department');
    expect(html).toContain('Economics &amp; Commerce');
    expect(html).toContain('Science Department');
    expect(html).toContain('Unassigned');
  });

  // ---------------------------------------------------------------------------
  // 2. AcademicDepartments displays associated subjects and empty status
  // ---------------------------------------------------------------------------
  it('2. AcademicDepartments displays associated subjects and clearly shows empty department', () => {
    const html = renderToString(
      <MemoryRouter>
        <AcademicDepartments initialDepartments={mockDepartments} initialTeachers={mockTeachers} />
      </MemoryRouter>
    );

    expect(html).toContain('Associated Subjects');
    expect(html).toContain('ECON-1');
    expect(html).toContain('BIO-1');
    expect(html).toContain('CHEM-1');
    expect(html).toContain('PHYS-1');
    expect(html).toContain('No subjects assigned');
  });

  // ---------------------------------------------------------------------------
  // 3. TeacherDetailsModal displays faculty department badges and unassigned status
  // ---------------------------------------------------------------------------
  it('3. TeacherDetailsModal displays faculty with their academic departments', () => {
    const htmlAssigned = renderToString(
      <MemoryRouter>
        <TeacherDetailsModal
          isOpen={true}
          onClose={() => {}}
          teacherId={mockTeachers[0].id}
          initialTeacher={mockTeachers[0]}
        />
      </MemoryRouter>
    );

    expect(htmlAssigned).toContain('Baraka Mwangi');
    expect(htmlAssigned).toContain('Economics &amp; Commerce');
    expect(htmlAssigned).toContain('(ECON)');

    const htmlUnassigned = renderToString(
      <MemoryRouter>
        <TeacherDetailsModal
          isOpen={true}
          onClose={() => {}}
          teacherId={mockTeachers[2].id}
          initialTeacher={mockTeachers[2]}
        />
      </MemoryRouter>
    );

    expect(htmlUnassigned).toContain('Zuberi Hassan');
    expect(htmlUnassigned).toContain('Unassigned Department');
  });

  // ---------------------------------------------------------------------------
  // 4. API contract: createTeacher sends subjectIds to /academics/teachers
  // ---------------------------------------------------------------------------
  it('4. AcademicsApi.createTeacher sends subjectIds to /academics/teachers', async () => {
    const createSpy = vi.spyOn(AcademicsApi, 'createTeacher').mockResolvedValue({
      data: {
        id: 'new-teacher-id',
        firstName: 'Samwel',
        lastName: 'Mrema',
        email: 's.mrema@schoolos.internal',
        academicDepartmentId: 'dept-sci',
        academicDepartment: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      },
    } as any);

    const res = await AcademicsApi.createTeacher({
      firstName: 'Samwel',
      lastName: 'Mrema',
      email: 's.mrema@schoolos.internal',
      subjectIds: ['subj-bio', 'subj-chem', 'subj-phys'],
    });

    expect(createSpy).toHaveBeenCalledWith({
      firstName: 'Samwel',
      lastName: 'Mrema',
      email: 's.mrema@schoolos.internal',
      subjectIds: ['subj-bio', 'subj-chem', 'subj-phys'],
    });
    expect(res.data.academicDepartmentId).toBe('dept-sci');
  });

  // ---------------------------------------------------------------------------
  // 5. API contract: updateTeacher updates subjectIds and department
  // ---------------------------------------------------------------------------
  it('5. AcademicsApi.updateTeacher updates teacher subjects and department', async () => {
    const updateSpy = vi.spyOn(AcademicsApi, 'updateTeacher').mockResolvedValue({
      data: {
        id: 'teacher-1',
        firstName: 'Baraka',
        lastName: 'Mwangi',
        academicDepartmentId: 'dept-econ',
      },
    } as any);

    const res = await AcademicsApi.updateTeacher('teacher-1', {
      subjectIds: ['subj-econ'],
    });

    expect(updateSpy).toHaveBeenCalledWith('teacher-1', {
      subjectIds: ['subj-econ'],
    });
    expect(res.data.id).toBe('teacher-1');
  });
});
