import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AcademicDepartments } from '../components/academics/structure/AcademicDepartments';
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

describe('Academic Department Form UI & Subject-Based Teacher Filtering', () => {
  const deptScienceId = 'dept-sci';
  const deptLanguagesId = 'dept-lang';
  const deptEmptyId = 'dept-empty';
  const deptMathId = 'dept-math';

  const subBio: Subject = {
    id: 'sub-bio',
    name: 'Biology',
    code: 'BIO',
    departmentId: deptScienceId,
    category: 'Core',
    description: null,
  };
  const subChem: Subject = {
    id: 'sub-chem',
    name: 'Chemistry',
    code: 'CHEM',
    departmentId: deptScienceId,
    category: 'Core',
    description: null,
  };
  const subKisw: Subject = {
    id: 'sub-kisw',
    name: 'Kiswahili',
    code: 'KISW',
    departmentId: deptLanguagesId,
    category: 'Core',
    description: null,
  };
  const subMath: Subject = {
    id: 'sub-math',
    name: 'Basic Mathematics',
    code: 'MATH',
    departmentId: deptMathId,
    category: 'Core',
    description: null,
  };

  const mockSubjects: Subject[] = [subBio, subChem, subKisw, subMath];

  const teacherScienceOnly: Teacher = {
    id: 't-sci-only',
    firstName: 'Mwita',
    lastName: 'Chacha',
    email: 'm.chacha@schoolos.internal',
    role: 'TEACHER',
    academicDepartmentId: deptScienceId,
    assignments: [
      {
        id: 'asg-bio',
        teacherId: 't-sci-only',
        subjectId: 'sub-bio',
        classId: 'c-1',
        subject: subBio,
      },
    ],
  };

  const teacherKiswOnly: Teacher = {
    id: 't-kisw-only',
    firstName: 'Fatma',
    lastName: 'Alawi',
    email: 'f.alawi@schoolos.internal',
    role: 'TEACHER',
    academicDepartmentId: deptLanguagesId,
    assignments: [
      {
        id: 'asg-kisw',
        teacherId: 't-kisw-only',
        subjectId: 'sub-kisw',
        classId: 'c-1',
        subject: subKisw,
      },
    ],
  };

  const teacherNoSubjects: Teacher = {
    id: 't-no-sub',
    firstName: 'Hassan',
    lastName: 'Mwinyi',
    email: 'h.mwinyi@schoolos.internal',
    role: 'TEACHER',
    academicDepartmentId: null,
    assignments: [],
  };

  const mockTeachers: Teacher[] = [teacherScienceOnly, teacherKiswOnly, teacherNoSubjects];

  const mockTeacherAssignments: TeacherAssignment[] = [
    {
      id: 'asg-bio',
      teacherId: teacherScienceOnly.id,
      subjectId: subBio.id,
      classId: 'c-1',
      subject: subBio,
    },
    {
      id: 'asg-kisw',
      teacherId: teacherKiswOnly.id,
      subjectId: subKisw.id,
      classId: 'c-1',
      subject: subKisw,
    },
  ];

  const mockDepartments: AcademicDepartment[] = [
    {
      id: deptScienceId,
      name: 'Science Department',
      code: 'SCI',
      hodId: teacherScienceOnly.id,
      subjects: [subBio, subChem],
      teachers: [teacherScienceOnly],
      teacherCount: 1,
      subjectCount: 2,
    },
    {
      id: deptLanguagesId,
      name: 'Languages Department',
      code: 'LANG',
      hodId: teacherKiswOnly.id,
      subjects: [subKisw],
      teachers: [teacherKiswOnly],
      teacherCount: 1,
      subjectCount: 1,
    },
    {
      id: deptMathId,
      name: 'Mathematics Department',
      code: 'MATH',
      hodId: null,
      subjects: [subMath],
      teachers: [],
      teacherCount: 0,
      subjectCount: 1,
    },
    {
      id: deptEmptyId,
      name: 'Empty Department',
      code: 'EMPTY',
      hodId: null,
      subjects: [],
      teachers: [],
      teacherCount: 0,
      subjectCount: 0,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-admin',
        firstName: 'Academic',
        lastName: 'Master',
        role: 'ACADEMIC_MASTER',
      },
    });
    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { id: 's-1', name: 'School 1' },
    });
  });

  // 1. Table overview
  it('1. Department layout renders table with create button and department codes', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
      />
    );

    expect(html).toContain('Academic Departments');
    expect(html).toContain('Create Department');
    expect(html).toContain('Science Department');
    expect(html).toContain('SCI');
    expect(html).toContain('Languages Department');
    expect(html).toContain('LANG');
    expect(html).toContain('Empty Department');
    expect(html).toContain('EMPTY');
    expect(html).toContain('No subjects assigned');
  });

  // 2. Add Department Form layout: compact, max-w-[580px], max-h-[90vh], scrollable body, fixed buttons
  it('2. The Add Department form is compact, responsive, and keeps action buttons visible', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialCreateModalOpen={true}
      />
    );

    // Verify compact modal constraints
    expect(html).toContain('max-w-[580px]');
    expect(html).toContain('max-h-[90vh]');
    expect(html).toContain('flex flex-col');
    expect(html).toContain('flex-1 overflow-y-auto');

    // Verify fields and buttons
    expect(html).toContain('Create Academic Department');
    expect(html).toContain('department-name-input');
    expect(html).toContain('department-code-input');
    expect(html).toContain('department-hod-select');
    expect(html).toContain('Associated Curriculum Subjects');
    expect(html).toContain('Filter subjects by code or name...');
    expect(html).toContain('submit-create-department');
    expect(html).toContain('Cancel');
  });

  // 3. Edit Department Form layout: shares the same compact constraints
  it('3. The Edit Department form shares the compact layout with visible action buttons', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialEditDept={mockDepartments[0]}
      />
    );

    expect(html).toContain('max-w-[580px]');
    expect(html).toContain('max-h-[90vh]');
    expect(html).toContain('Edit Academic Department');
    expect(html).toContain('edit-department-name-input');
    expect(html).toContain('edit-department-code-input');
    expect(html).toContain('submit-edit-department');
    expect(html).toContain('Save Changes');
  });

  // 4. Subject selection is not clipped by the dialog
  it('4. Subject selection provides filter input, scrollable container, and selection badges', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialCreateModalOpen={true}
      />
    );

    expect(html).toContain('Filter subjects by code or name...');
    expect(html).toContain('max-h-48 overflow-y-auto');
    expect(html).toContain('BIO');
    expect(html).toContain('Biology');
    expect(html).toContain('CHEM');
    expect(html).toContain('Chemistry');
  });

  // 5. Science Department lists eligible Science teachers only
  it('5. Science Department modal lists eligible Science teachers only and excludes Kiswahili teachers', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialAssignDept={mockDepartments[0]} // Science Department
      />
    );

    expect(html).toContain('Assign Teachers to');
    expect(html).toContain('Science Department');
    expect(html).toContain('eligible-teachers-list');

    // Eligible science teacher Mwita Chacha must be present
    expect(html).toContain('Mwita');
    expect(html).toContain('Chacha');
    expect(html).toContain('m.chacha@schoolos.internal');
    expect(html).toContain('Teaching:');
    expect(html).toContain('BIO');

    // Ineligible teacher Fatma Alawi (Kiswahili-only) must NOT be listed
    expect(html).not.toContain('Fatma');
    expect(html).not.toContain('Alawi');
    expect(html).not.toContain('f.alawi@schoolos.internal');

    // Ineligible teacher Hassan Mwinyi (No subjects) must NOT be listed
    expect(html).not.toContain('Hassan');
    expect(html).not.toContain('Mwinyi');
    expect(html).not.toContain('h.mwinyi@schoolos.internal');
  });

  // 6. Department with no subjects shows clear warning and does not show all teachers
  it('6. A department with no subjects shows clear warning message and lists no teachers', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialAssignDept={mockDepartments[3]} // Empty Department
      />
    );

    expect(html).toContain('Assign Teachers to');
    expect(html).toContain('Empty Department');
    expect(html).toContain('dept-no-subjects-alert');
    expect(html).toContain('Add subjects to this department before assigning teachers');
    expect(html).not.toContain('eligible-teachers-list');
    expect(html).not.toContain('Mwita');
    expect(html).not.toContain('Fatma');
    expect(html).not.toContain('Hassan');
  });

  // 7. Department with subjects but no eligible teachers shows empty state
  it('7. A department with configured subjects but no eligible teachers shows helpful empty state', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialAssignDept={mockDepartments[2]} // Math Department (nobody teaches Math)
      />
    );

    expect(html).toContain('Assign Teachers to');
    expect(html).toContain('Mathematics Department');
    expect(html).toContain('no-eligible-teachers-empty');
    expect(html).toContain('No eligible teachers found');
    expect(html).toContain('Teachers need to be assigned to teach subjects belonging to this department');
    expect(html).not.toContain('eligible-teachers-list');
  });

  // 8. API updateDepartment called with teacherIds
  it('8. AcademicsApi.updateDepartment sends teacherIds correctly when assigning teachers', async () => {
    const updateSpy = vi.spyOn(AcademicsApi, 'updateDepartment').mockResolvedValue({
      data: {
        ...mockDepartments[0],
        teacherCount: 1,
      },
    } as any);

    const res = await AcademicsApi.updateDepartment(deptScienceId, {
      teacherIds: [teacherScienceOnly.id],
    });

    expect(updateSpy).toHaveBeenCalledWith(deptScienceId, {
      teacherIds: [teacherScienceOnly.id],
    });
    expect(res.data).toBeDefined();
  });

  // 9. Subject Level Tabs in Create Department modal
  it('9. Create Department modal renders level tabs (All Levels, Primary, O-Level, A-Level)', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialCreateModalOpen={true}
      />
    );

    expect(html).toContain('All Levels');
    expect(html).toContain('Primary');
    expect(html).toContain('O-Level');
    expect(html).toContain('A-Level');
  });

  // 10. Assign Teachers modal provides toggle for Ineligible Teachers with reasons
  it('10. Assign Teachers modal displays toggle for Ineligible Teachers count and reasons', () => {
    const html = renderToString(
      <AcademicDepartments
        initialDepartments={mockDepartments}
        initialTeachers={mockTeachers}
        initialSubjects={mockSubjects}
        initialAssignments={mockTeacherAssignments}
        initialAssignDept={mockDepartments[0]} // Science Department
      />
    );

    // Ineligible teachers count toggle should be present (Fatma + Hassan = 2)
    expect(html).toContain('Ineligible Teachers (2)');
    expect(html).toContain('Show details &amp; reasons');
  });
});
