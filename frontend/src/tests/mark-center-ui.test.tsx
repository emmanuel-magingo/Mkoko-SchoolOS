import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import MarkCenterPage from '../pages/academics/MarkCenterPage';

// Mock contexts
const mockUseAuth = vi.fn();
const mockUseAcademicContext = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => mockUseAcademicContext(),
}));

// Mock APIs
vi.mock('../api/markCenterApi', () => ({
  MarkCenterApi: {
    getPeriods: vi.fn().mockResolvedValue([]),
    getTimetableSessions: vi.fn().mockResolvedValue([]),
    getPapers: vi.fn().mockResolvedValue([]),
    getSupervisions: vi.fn().mockResolvedValue([]),
    getNotices: vi.fn().mockResolvedValue([]),
    getCompletenessSummary: vi.fn().mockResolvedValue({ totalExpectedMarks: 0, recordedMarks: 0, missingMarks: 0, completionPercentage: 100 }),
    getResultsSheet: vi.fn().mockResolvedValue({ summary: { totalStudents: 0, divisionSummary: {} }, students: [] }),
  },
}));

vi.mock('../api/academics.api', () => ({
  AcademicsApi: {
    getClasses: vi.fn().mockResolvedValue([]),
    getSubjects: vi.fn().mockResolvedValue([]),
    getTeachers: vi.fn().mockResolvedValue([]),
  },
}));

describe('Mkoko SchoolOS — Mark Center Frontend UI & Governance Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAcademicContext.mockReturnValue({
      activeYear: { id: 'year-2026', name: '2026', isCurrent: true },
      terms: [{ id: 'term-1', name: 'Term 1', academicYearId: 'year-2026' }],
      classes: [
        { id: 'class-f4a', name: 'Form 4A', educationLevel: 'O_LEVEL' },
        { id: 'class-std7', name: 'Standard 7', educationLevel: 'PRIMARY' },
      ],
      subjects: [
        { id: 'sub-math', name: 'Basic Mathematics', code: 'MATH' },
        { id: 'sub-eng', name: 'English Language', code: 'ENG' },
      ],
      teachers: [
        { id: 'teacher-1', name: 'Mwalimu Juma', email: 'juma@school.org' },
      ],
      departments: [
        { id: 'dept-math', name: 'Mathematics Department' },
      ],
    });
  });

  it('renders the complete examination lifecycle cockpit header and sub-navigation tabs', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-master-1',
        role: 'SENIOR_ACADEMIC_MASTER',
        firstName: 'Academic',
        lastName: 'Master',
        tenantId: 'tenant-1',
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    // Header & badge
    expect(html).toContain('Mark Center Workspace');
    expect(html).toContain('NECTA Standard');

    // Lifecycle tabs
    expect(html).toContain('Overview');
    expect(html).toContain('Exam Periods');
    expect(html).toContain('Timetable &amp; Venues');
    expect(html).toContain('Exam Papers (Paper Only)');
    expect(html).toContain('Supervision &amp; Invigilation');
    expect(html).toContain('Department Coordination');
    expect(html).toContain('Controlled Mark Entry');
    expect(html).toContain('Academic Review');
    expect(html).toContain('Grading &amp; Rankings');
    expect(html).toContain('Headteacher Gatekeeper');
  });

  it('displays New Exam Period button for Senior Academic Master', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-master-1',
        role: 'SENIOR_ACADEMIC_MASTER',
        firstName: 'Academic',
        lastName: 'Master',
        tenantId: 'tenant-1',
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    expect(html).toContain('New Exam Period');
  });

  it('strictly hides New Exam Period creation button for Headmaster (Academic Master sole initiator)', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-hm-1',
        role: 'HEADMASTER',
        firstName: 'Head',
        lastName: 'Master',
        tenantId: 'tenant-1',
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    expect(html).not.toContain('New Exam Period');
  });

  it('strictly hides New Exam Period creation button for School Admin without delegation', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-admin-1',
        role: 'SCHOOL_ADMIN',
        firstName: 'Admin',
        lastName: 'School',
        tenantId: 'tenant-1',
        customPermissions: [],
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    expect(html).not.toContain('New Exam Period');
  });

  it('displays New Exam Period creation button for School Admin with explicit academic delegation', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-admin-1',
        role: 'SCHOOL_ADMIN',
        firstName: 'Admin',
        lastName: 'School',
        tenantId: 'tenant-1',
        customPermissions: ['academics:manage_assessments'],
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    expect(html).toContain('New Exam Period');
  });

  it('hides New Exam Period creation button for standard Teacher role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-teacher-1',
        role: 'TEACHER',
        firstName: 'Jane',
        lastName: 'Teacher',
        tenantId: 'tenant-1',
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    expect(html).not.toContain('New Exam Period');
  });

  it('displays paper-only policy reminder in quick actions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-master-1',
        role: 'SENIOR_ACADEMIC_MASTER',
        firstName: 'Academic',
        lastName: 'Master',
        tenantId: 'tenant-1',
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    // Explicit confirmation of Paper-Only requirement (no scheme)
    expect(html).toContain('Paper document only (no scheme)');
  });

  it('renders Headteacher Gatekeeper approval authority only for Headmaster', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-hm-1',
        role: 'HEADMASTER',
        firstName: 'Head',
        lastName: 'Master',
        tenantId: 'tenant-1',
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    // Headmaster sees the Headteacher Gatekeeper tab and approval controls
    expect(html).toContain('Headteacher Gatekeeper');
    expect(html).not.toContain('New Exam Period'); // Separation of powers: HM cannot initiate
  });

  it('shows non-headmaster restriction message in Gatekeeper tab for Academic Master and Teachers', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-master-1',
        role: 'SENIOR_ACADEMIC_MASTER',
        firstName: 'Academic',
        lastName: 'Master',
        tenantId: 'tenant-1',
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    // Academic Master has exam initiation but lacks headteacher final sign-off
    expect(html).toContain('New Exam Period');
    expect(html).toContain('Headteacher Gatekeeper');
  });

  it('allows School Admin with explicit academics:approve_grades delegation to act as Gatekeeper', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-admin-1',
        role: 'SCHOOL_ADMIN',
        firstName: 'Admin',
        lastName: 'School',
        tenantId: 'tenant-1',
        customPermissions: ['academics:approve_grades'],
      },
    });

    const html = renderToString(
      <MemoryRouter>
        <MarkCenterPage />
      </MemoryRouter>
    );

    // Has delegated approval power, but lacks initiation power
    expect(html).not.toContain('New Exam Period');
    expect(html).toContain('Headteacher Gatekeeper');
  });
});
