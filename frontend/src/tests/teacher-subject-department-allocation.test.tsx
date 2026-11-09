import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicDepartments } from '../components/academics/structure/AcademicDepartments';
import { TeacherDetailsModal } from '../components/academics/structure/TeacherDetailsModal';
import { AcademicsApi } from '../api/academics.api';
import { AcademicDepartment, Teacher, Subject } from '../types/academics.types';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u-headmaster', role: 'HEADMASTER' },
    tenant: { id: 'e51731ef-6486-4a28-b9a0-bec720c41a99', name: 'Mwilamvya Secondary School' },
    logout: vi.fn(),
  }),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => ({
    selectedSchool: { id: 'e51731ef-6486-4a28-b9a0-bec720c41a99', name: 'Mwilamvya Secondary School' },
    academicYears: [{ id: 'ay-1', name: '2026', isCurrent: true }],
  }),
}));

describe('Frontend: Teacher Subject Allocation & Automatic Department Assignment Suite', () => {
  const mockDepartments: AcademicDepartment[] = [
    { id: 'dept-sci', name: 'Science', code: 'SCIE', hodId: null, teacherCount: 1, subjectCount: 2 },
    { id: 'dept-arts', name: 'Arts', code: 'ARTS', hodId: 'teacher-clara', teacherCount: 1, subjectCount: 3 },
    { id: 'dept-econ', name: 'Economics', code: 'ECON', hodId: null, teacherCount: 0, subjectCount: 3 },
    { id: 'dept-soc', name: 'Social science', code: 'SOCI', hodId: null, teacherCount: 1, subjectCount: 3 },
    { id: 'dept-pmc', name: 'Physics Mathematatics and Computer', code: 'PMC', hodId: null, teacherCount: 0, subjectCount: 5 },
  ];

  const mockSubjects: Subject[] = [
    { id: 'sub-bio', name: 'Biology', code: 'BIO', departmentId: 'dept-sci', level: 'O_LEVEL', category: 'Core', description: null },
    { id: 'sub-chem', name: 'Chemistry', code: 'CHEM', departmentId: 'dept-sci', level: 'O_LEVEL', category: 'Core', description: null },
    { id: 'sub-kisw', name: 'Kiswahili', code: 'KISW', departmentId: 'dept-arts', level: 'O_LEVEL', category: 'Core', description: null },
    { id: 'sub-engl', name: 'English', code: 'ENGL', departmentId: 'dept-arts', level: 'O_LEVEL', category: 'Core', description: null },
    { id: 'sub-civ', name: 'Civics', code: 'CIV', departmentId: 'dept-soc', level: 'O_LEVEL', category: 'Core', description: null },
  ];

  const mockTeachers: Teacher[] = [
    {
      id: 'teacher-jafari',
      firstName: 'Jafari',
      lastName: 'Ramadhani',
      email: 'jafarmkoko78@gmail.com',
      role: 'SENIOR_ACADEMIC_MASTER',
      academicDepartmentId: null,
      academicDepartment: null,
      qualifications: [],
      assignments: [],
    },
    {
      id: 'teacher-baraka',
      firstName: 'Baraka',
      lastName: 'Ngaluma',
      email: 'baraka@mwilamvya.ac.tz',
      role: 'TEACHER',
      academicDepartmentId: 'dept-sci',
      academicDepartment: { id: 'dept-sci', name: 'Science', code: 'SCIE' },
      qualifications: [mockSubjects[0], mockSubjects[1]], // BIO, CHEM
      assignments: [],
    },
    {
      id: 'teacher-legacy-conflict',
      firstName: 'David',
      lastName: 'Mrema',
      email: 'david@mwilamvya.ac.tz',
      role: 'TEACHER',
      academicDepartmentId: null,
      academicDepartment: null,
      qualifications: [mockSubjects[0], mockSubjects[2]], // BIO (Science) + KISW (Arts) -> CONFLICT
      assignments: [
        { id: 'asg-1', teacherId: 'teacher-legacy-conflict', subjectId: 'sub-bio', classId: 'c1', subject: mockSubjects[0] } as any,
        { id: 'asg-2', teacherId: 'teacher-legacy-conflict', subjectId: 'sub-kisw', classId: 'c2', subject: mockSubjects[2] } as any,
      ],
    },
  ];

  const mockReconciliationReport = {
    summary: {
      totalTeachers: 3,
      assignedTeachers: 1,
      unassignedTeachers: 1,
      conflictCount: 1,
      validCount: 1,
    },
    conflictingTeachers: [
      {
        id: 'teacher-legacy-conflict',
        name: 'David Mrema',
        email: 'david@mwilamvya.ac.tz',
        role: 'TEACHER',
        currentDepartment: null,
        status: 'CONFLICT',
        conflictingDepartments: ['Science', 'Arts'],
        subjects: [
          { code: 'BIO', name: 'Biology', department: 'Science' },
          { code: 'KISW', name: 'Kiswahili', department: 'Arts' },
        ],
      },
    ],
    unassignedTeachers: [
      {
        id: 'teacher-jafari',
        name: 'Jafari Ramadhani',
        email: 'jafarmkoko78@gmail.com',
        role: 'SENIOR_ACADEMIC_MASTER',
        status: 'UNASSIGNED',
        subjectsCount: 0,
      },
    ],
    validTeachers: [
      {
        id: 'teacher-baraka',
        name: 'Baraka Ngaluma',
        email: 'baraka@mwilamvya.ac.tz',
        role: 'TEACHER',
        department: 'Science',
        status: 'VALID',
        subjectsCount: 2,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AcademicsApi, 'getDepartments').mockResolvedValue({ data: mockDepartments });
    vi.spyOn(AcademicsApi, 'getSubjects').mockResolvedValue({ data: mockSubjects });
    vi.spyOn(AcademicsApi, 'getTeachers').mockResolvedValue({ data: mockTeachers });
    vi.spyOn(AcademicsApi, 'getDepartmentReconciliationReport').mockResolvedValue({ data: mockReconciliationReport });
  });

  describe('1. Academic Departments Layout & KPI Cards', () => {
    it('renders KPI summary cards with accurate counts and reconciliation alerts', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicDepartments
            initialDepartments={mockDepartments}
            initialTeachers={mockTeachers}
            initialSubjects={mockSubjects}
          />
        </MemoryRouter>
      );

      // KPI cards presence
      expect(html).toContain('Academic Departments');
      expect(html).toContain('Departments Directory');
      expect(html).toContain('Faculty Allocation &amp; Reconciliation');
      expect(html).toContain('Total Departments');
      expect(html).toContain('Teachers Assigned');
      expect(html).toContain('Heads of Department (HoD)');
      expect(html).toContain('Requires Reconciliation');
      expect(html).toContain('1 Conflicts');
    });

    it('renders navigation tabs allowing Headmaster and Admin to switch to Faculty Allocation & Reconciliation', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicDepartments
            initialDepartments={mockDepartments}
            initialTeachers={mockTeachers}
            initialSubjects={mockSubjects}
          />
        </MemoryRouter>
      );

      expect(html).toContain('Departments Directory');
      expect(html).toContain('Faculty Allocation &amp; Reconciliation');
      // Departments Directory rows
      expect(html).toContain('Science');
      expect(html).toContain('Arts');
      expect(html).toContain('Economics');
      expect(html).toContain('Social science');
      expect(html).toContain('Physics Mathematatics and Computer');
    });
  });

  describe('2. Teacher Details Modal — Automatic Department Assignment & Live Validation', () => {
    it('displays teacher profile and Unassigned Department badge when teacher has no department', () => {
      const html = renderToString(
        <TeacherDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          teacherId={mockTeachers[0].id}
          initialTeacher={mockTeachers[0]}
        />
      );

      expect(html).toContain('Jafari Ramadhani');
      expect(html).toContain('jafarmkoko78@gmail.com');
      expect(html).toContain('Unassigned Department');
      expect(html).toContain('Subject Specializations &amp; Qualifications');
    });

    it('displays teacher department badge when teacher belongs to a single department', () => {
      const html = renderToString(
        <TeacherDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          teacherId={mockTeachers[1].id}
          initialTeacher={mockTeachers[1]}
        />
      );

      expect(html).toContain('Baraka Ngaluma');
      expect(html).toContain('baraka@mwilamvya.ac.tz');
      expect(html).toContain('Science');
      expect(html).toContain('(SCIE)');
      expect(html).toContain('teacher-department-badge');
    });

    it('displays conflict indicator when teacher has qualifications spanning multiple departments', () => {
      const html = renderToString(
        <TeacherDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          teacherId={mockTeachers[2].id}
          initialTeacher={mockTeachers[2]}
        />
      );

      expect(html).toContain('David Mrema');
      expect(html).toContain('david@mwilamvya.ac.tz');
      expect(html).toContain('Unassigned Department');
      expect(html).toContain('Subject Specializations &amp; Qualifications');
    });
  });

  describe('3. Faculty Allocation & Reconciliation Panel UI', () => {
    it('renders the reconciliation tab and filter controls', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicDepartments
            initialDepartments={mockDepartments}
            initialTeachers={mockTeachers}
            initialSubjects={mockSubjects}
          />
        </MemoryRouter>
      );

      expect(html).toContain('tab-faculty-reconciliation');
      expect(html).toContain('Faculty Allocation &amp; Reconciliation');
      expect(html).toContain('1 Conflicts');
    });
  });

  describe('4. AcademicsApi Integration', () => {
    it('AcademicsApi.assignTeacherSubjects sends correct payload to POST /teachers/:id/subjects', async () => {
      const spy = vi.spyOn(AcademicsApi, 'assignTeacherSubjects').mockResolvedValue({
        data: {
          ...mockTeachers[0],
          academicDepartmentId: 'dept-sci',
          academicDepartment: { id: 'dept-sci', name: 'Science', code: 'SCIE' },
          qualifications: [mockSubjects[0], mockSubjects[1]],
        },
      });

      const res = await AcademicsApi.assignTeacherSubjects('teacher-jafari', ['sub-bio', 'sub-chem']);
      expect(spy).toHaveBeenCalledWith('teacher-jafari', ['sub-bio', 'sub-chem']);
      expect(res.data.academicDepartmentId).toBe('dept-sci');
      expect(res.data.academicDepartment?.name).toBe('Science');
    });

    it('AcademicsApi.removeTeacherSubject sends correct DELETE request', async () => {
      const spy = vi.spyOn(AcademicsApi, 'removeTeacherSubject').mockResolvedValue({
        data: {
          ...mockTeachers[1],
          qualifications: [mockSubjects[1]],
        },
      });

      const res = await AcademicsApi.removeTeacherSubject('teacher-baraka', 'sub-bio');
      expect(spy).toHaveBeenCalledWith('teacher-baraka', 'sub-bio');
      expect(res.data.qualifications).toHaveLength(1);
    });

    it('AcademicsApi.getDepartmentReconciliationReport fetches reconciliation status report', async () => {
      const spy = vi.spyOn(AcademicsApi, 'getDepartmentReconciliationReport').mockResolvedValue({
        data: mockReconciliationReport,
      });

      const res = await AcademicsApi.getDepartmentReconciliationReport();
      expect(spy).toHaveBeenCalled();
      expect(res.data.summary.conflictCount).toBe(1);
      expect(res.data.conflictingTeachers[0].name).toBe('David Mrema');
      expect(res.data.conflictingTeachers[0].conflictingDepartments).toEqual(['Science', 'Arts']);
    });
  });
});
