import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { SubjectRegistry } from '../components/academics/structure/SubjectRegistry';
import { SubjectCombinations } from '../components/academics/structure/SubjectCombinations';
import { SubjectRegistryPage } from '../pages/academics/SubjectRegistryPage';
import { AcademicDepartments } from '../components/academics/structure/AcademicDepartments';
import { ClassesAndStreams } from '../pages/academics/ClassesAndStreams';
import { Subject, AcademicDepartment, SubjectCombination } from '../types/academics.types';

// Mock contexts
const mockUseAuth = vi.fn();
const mockUseAcademicContext = vi.fn();
const mockUsePermissions = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => mockUseAcademicContext(),
}));

vi.mock('../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

describe('Multi-Level School Architecture, Curriculum & UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUsePermissions.mockReturnValue({
      hasPermission: () => true,
    });
  });

  const mockSubjects: Subject[] = [
    {
      id: 'sub-std-sci',
      name: 'Science & Technology',
      code: 'SCI-STD',
      level: 'PRIMARY',
      category: 'Core',
      applicableClasses: ['Standard 5', 'Standard 6', 'Standard 7'],
      departmentId: 'dept-sci',
      department: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      status: 'ACTIVE',
      description: 'Primary science',
    },
    {
      id: 'sub-o-bio',
      name: 'Biology',
      code: 'BIO',
      level: 'O_LEVEL',
      category: 'Core',
      applicableClasses: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
      departmentId: 'dept-sci',
      department: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      status: 'ACTIVE',
      description: 'O-Level biology',
    },
    {
      id: 'sub-a-phy',
      name: 'Physics',
      code: 'PHY-A',
      level: 'A_LEVEL',
      category: 'Core',
      applicableClasses: ['Form 5', 'Form 6'],
      departmentId: 'dept-sci',
      department: { id: 'dept-sci', name: 'Science Department', code: 'SCI' },
      status: 'ACTIVE',
      description: 'A-Level physics',
    },
    {
      id: 'sub-o-kisw',
      name: 'Kiswahili',
      code: 'KISW',
      level: 'O_LEVEL',
      category: 'Core',
      applicableClasses: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
      departmentId: 'dept-lang',
      department: { id: 'dept-lang', name: 'Languages Department', code: 'LANG' },
      status: 'ACTIVE',
      description: 'Kiswahili language',
    },
  ];

  const mockDepartments: AcademicDepartment[] = [
    {
      id: 'dept-sci',
      name: 'Science & Mathematics',
      code: 'SCI',
      educationLevels: ['PRIMARY', 'O_LEVEL', 'A_LEVEL'],
      subjectCount: 3,
      teacherCount: 2,
      hodId: null,
      hod: null,
    },
    {
      id: 'dept-lang',
      name: 'Languages & Literature',
      code: 'LANG',
      educationLevels: ['O_LEVEL'],
      subjectCount: 1,
      teacherCount: 1,
      hodId: null,
      hod: null,
    },
  ];

  const mockCombinations: SubjectCombination[] = [
    {
      id: 'comb-pcm',
      code: 'PCM',
      name: 'Physics, Chemistry, Advanced Mathematics',
      description: 'Physical Sciences and Engineering stream',
      isActive: true,
      subjects: [
        { id: 'sub-a-phy', name: 'Physics', code: 'PHY-A', category: 'Core', description: null },
        { id: 'sub-a-chem', name: 'Chemistry', code: 'CHEM-A', category: 'Core', description: null },
      ],
      classCount: 2,
    },
    {
      id: 'comb-hgl',
      code: 'HGL',
      name: 'History, Geography, Language',
      description: 'Arts and Social Sciences stream',
      isActive: true,
      subjects: [],
      classCount: 1,
    },
  ];

  // 1. SubjectRegistry renders level filter tabs and level badges
  it('1. SubjectRegistry renders level filter tabs and education level badges', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN' },
      tenant: { schoolLevel: 'O_AND_A_LEVEL' },
    });
    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { name: 'Mkoko Comprehensive High' },
    });

    const html = renderToString(
      <MemoryRouter>
        <SubjectRegistry initialSubjects={mockSubjects} />
      </MemoryRouter>
    );

    // Filter tabs
    expect(html).toContain('All Levels');
    expect(html).toContain('Primary');
    expect(html).toContain('O-Level');
    expect(html).toContain('A-Level');

    // Subjects and level badges in table
    expect(html).toContain('Science &amp; Technology');
    expect(html).toContain('SCI-STD');
    expect(html).toContain('Biology');
    expect(html).toContain('Physics');
    expect(html).toContain('Kiswahili');

    // Tanzania catalogue button
    expect(html).toContain('Tanzania Catalogue');
  });

  // 2. AcademicDepartments renders education levels represented in the department
  it('2. AcademicDepartments renders education levels represented in the department', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN' },
      tenant: { schoolLevel: 'O_AND_A_LEVEL' },
    });
    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { name: 'Mkoko Comprehensive High' },
    });

    const html = renderToString(
      <MemoryRouter>
        <AcademicDepartments initialDepartments={mockDepartments} initialTeachers={[]} />
      </MemoryRouter>
    );

    expect(html).toContain('Science &amp; Mathematics');
    expect(html).toContain('Languages &amp; Literature');
    expect(html).toContain('Primary');
    expect(html).toContain('O-Level');
    expect(html).toContain('A-Level');
  });

  // 3. SubjectCombinations renders combinations table and action buttons
  it('3. SubjectCombinations renders combinations table and action buttons', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN' },
      tenant: { schoolLevel: 'O_AND_A_LEVEL' },
    });
    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { name: 'Mkoko Comprehensive High' },
    });

    const html = renderToString(
      <MemoryRouter>
        <SubjectCombinations initialCombinations={mockCombinations} />
      </MemoryRouter>
    );

    expect(html).toContain('PCM');
    expect(html).toContain('Physics, Chemistry, Advanced Mathematics');
    expect(html).toContain('HGL');
    expect(html).toContain('History, Geography, Language');
    expect(html).toContain('Add Combination');
    expect(html).toContain('Active');
  });

  // 4. SubjectRegistryPage provides sub-navigation tabs between Subjects and Combinations
  it('4. SubjectRegistryPage provides sub-navigation tabs between Subjects and Combinations', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN' },
      tenant: { schoolLevel: 'O_AND_A_LEVEL' },
    });
    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { name: 'Mkoko Comprehensive High' },
    });

    const html = renderToString(
      <MemoryRouter>
        <SubjectRegistryPage initialSubjects={mockSubjects} />
      </MemoryRouter>
    );

    expect(html).toContain('Subjects Registry');
    expect(html).toContain('A-Level Combinations');
    expect(html).toContain('Science &amp; Technology');
  });

  // 5. ClassesAndStreams dynamically adapts available levels based on tenant educationLevels
  it('5. ClassesAndStreams adapts available levels based on tenant educationLevels', () => {
    // Primary only tenant
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN' },
      tenant: {
        schoolLevel: 'O_LEVEL',
        educationLevels: [{ level: 'PRIMARY' }],
      },
    });
    mockUseAcademicContext.mockReturnValue({
      selectedSchool: { name: 'Mbuyuni Primary School' },
    });

    const primaryHtml = renderToString(
      <MemoryRouter>
        <ClassesAndStreams />
      </MemoryRouter>
    );

    expect(primaryHtml).toContain('Standard 1');
    expect(primaryHtml).toContain('Standard 7');
    expect(primaryHtml).toContain('Primary levels');

    // Comprehensive tenant (Primary + O-Level + A-Level)
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN' },
      tenant: {
        schoolLevel: 'O_AND_A_LEVEL',
        educationLevels: [{ level: 'PRIMARY' }, { level: 'O_LEVEL' }, { level: 'A_LEVEL' }],
      },
    });

    const compHtml = renderToString(
      <MemoryRouter>
        <ClassesAndStreams />
      </MemoryRouter>
    );

    expect(compHtml).toContain('Standard 1');
    expect(compHtml).toContain('Form 1');
    expect(compHtml).toContain('Form 5');
    expect(compHtml).toContain('Form 6');
    expect(compHtml).toContain('Primary, O-Level &amp; A-Level');
  });
});
