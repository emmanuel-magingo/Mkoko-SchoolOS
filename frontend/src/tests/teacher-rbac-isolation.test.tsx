import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  getSchoolNavGroups,
  filterNavGroups,
} from '../components/layout/navigationConfig';
import { Permissions, Permission } from '../types/permissions';
import { User, Tenant } from '../types';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { AcademicTopbar } from '../components/academics/AcademicTopbar';
import { DashboardPage } from '../pages/DashboardPage';
import { AcademicDashboard } from '../pages/academics/AcademicDashboard';
import { TimetableManagement } from '../pages/academics/TimetableManagement';
import { PermissionGuard } from '../components/common/PermissionGuard';

// Mock contexts
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual<any>('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

const mockUseAcademicContext = vi.fn();
vi.mock('../contexts/AcademicContext', async () => {
  const actual = await vi.importActual<any>('../contexts/AcademicContext');
  return {
    ...actual,
    useAcademicContext: () => mockUseAcademicContext(),
  };
});

describe('Strict RBAC for TEACHER Role & Timetable View Isolation Suite', () => {
  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Mwilamvya Secondary School',
    code: 'MWL',
    slug: 'mwilamvya',
    status: 'ACTIVE',
  };

  const mockTeacher: User = {
    id: 'teacher-456',
    email: 'mwalimu@mwilamvya.ac.tz',
    firstName: 'Hassan',
    lastName: 'Kivuyo',
    role: 'TEACHER',
    tenantId: 'tenant-123',
    academicDepartment: {
      id: 'dept-lang-789',
      name: 'Languages & Literature',
      code: 'LANG',
    },
    department: {
      id: 'dept-lang-789',
      name: 'Languages & Literature',
      code: 'LANG',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockTeacher,
      tenant: mockTenant,
      token: 'jwt-teacher-token',
      isLoading: false,
      logout: vi.fn(),
    });
    mockUseAcademicContext.mockReturnValue({
      activeTermId: 'term-1',
      activeTerm: { id: 'term-1', name: 'Term 1 2026' },
      schools: [{ id: 'school-1', name: 'Main Campus' }],
      selectedSchoolId: 'school-1',
      academicYears: [{ id: 'ay-2026', name: '2026', isActive: true }],
      currentAcademicYearId: 'ay-2026',
      terms: [{ id: 'term-1', name: 'Term 1' }],
      currentTermId: 'term-1',
      isLoading: false,
      refreshAcademicData: vi.fn(),
    });
  });

  describe('STEP 1: Sidebar & Route Filtering (RBAC)', () => {
    it('denies direct attendance routes to subject teachers and allows assigned class teachers', () => {
      const renderAttendance = () => renderToString(
        <MemoryRouter>
          <PermissionGuard permissions={Permissions.VIEW_ATTENDANCE}>
            <div>Attendance content</div>
          </PermissionGuard>
        </MemoryRouter>
      );

      mockUseAuth.mockReturnValue({ user: mockTeacher, isLoading: false });
      expect(renderAttendance()).not.toContain('Attendance content');

      mockUseAuth.mockReturnValue({
        user: { ...mockTeacher, isClassTeacher: true, assignedClassesAsTeacher: [{ id: 'class-a', name: 'Form 1A' }] },
        isLoading: false,
      });
      expect(renderAttendance()).toContain('Attendance content');
    });

    it('strictly hides administration, subjects, curriculum, and enrolments from TEACHER', () => {
      const teacherPermissions = new Set<Permission>([
        Permissions.VIEW_ACADEMICS,
        Permissions.VIEW_ATTENDANCE,
        Permissions.RECORD_ATTENDANCE,
        Permissions.RECORD_GRADES,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_LESSON_LOGS,
        Permissions.RECORD_LESSON_LOG,
      ]);
      const hasPermission = (p: Permission) => teacherPermissions.has(p);

      const rawGroups = getSchoolNavGroups({
        user: mockTeacher,
        tenant: mockTenant,
        hasPermission,
      });

      const visibleGroups = filterNavGroups(rawGroups, '', new Set(['academics']), false, true);
      const visibleGroupIds = visibleGroups.map((g) => g.id);

      // Academics group is accessible
      expect(visibleGroupIds).toEqual(['academics']);

      const paths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));

      // Exposed minimal academics (attendance hidden unless class teacher)
      expect(paths).toEqual([
        '/academics/operations/timetable',
        '/academics/operations/lesson-logs',
        '/academics/assessments/marks-entry',
      ]);

      // Strictly prohibited admin views for TEACHER
      expect(paths).not.toContain('/academics'); // Academic Dashboard
      expect(paths).not.toContain('/academics/operations/attendance');
      expect(paths).not.toContain('/academics/structure/classes');
      expect(paths).not.toContain('/academics/structure/subjects');
      expect(paths).not.toContain('/academics/structure/enrolments');
      expect(paths).not.toContain('/academics/assessments/report-cards');
    });

    it('allows Attendance menu when teacher is designated as Class Teacher', () => {
      const classTeacherUser = {
        ...mockTeacher,
        isClassTeacher: true,
        assignedClassesAsTeacher: [{ id: 'cls-1', name: 'Form 1A' }],
      };
      const perms = new Set<Permission>([
        Permissions.VIEW_ACADEMICS,
        Permissions.VIEW_ATTENDANCE,
      ]);
      const rawGroups = getSchoolNavGroups({
        user: classTeacherUser,
        tenant: mockTenant,
        hasPermission: (p) => perms.has(p),
      });
      const visible = filterNavGroups(rawGroups, '', new Set(['academics']), false, true);
      const paths = visible.flatMap((g) => g.items.map((i) => i.to));
      expect(paths).toContain('/academics/operations/attendance');
    });

    it('allows Subjects & Curriculum when teacher has MANAGE_SUBJECTS', () => {
      const perms = new Set<Permission>([
        Permissions.VIEW_ACADEMICS,
        Permissions.MANAGE_SUBJECTS,
      ]);
      const rawGroups = getSchoolNavGroups({
        user: mockTeacher,
        tenant: mockTenant,
        hasPermission: (p) => perms.has(p),
      });
      const visible = filterNavGroups(rawGroups, '', new Set(['academics']), false, true);
      const paths = visible.flatMap((g) => g.items.map((i) => i.to));
      expect(paths).toContain('/academics/structure/subjects');
    });

    it('allows Student Enrolments when teacher has MANAGE_ENROLMENTS', () => {
      const perms = new Set<Permission>([
        Permissions.VIEW_ACADEMICS,
        Permissions.MANAGE_ENROLMENTS,
      ]);
      const rawGroups = getSchoolNavGroups({
        user: mockTeacher,
        tenant: mockTenant,
        hasPermission: (p) => perms.has(p),
      });
      const visible = filterNavGroups(rawGroups, '', new Set(['academics']), false, true);
      const paths = visible.flatMap((g) => g.items.map((i) => i.to));
      expect(paths).toContain('/academics/structure/enrolments');
    });

    it('DashboardPage redirects standard TEACHER directly to /academics/operations/timetable', () => {
      const html = renderToString(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      // When Navigate is rendered in SSR / renderToString, it renders empty or null
      // And does NOT render the school dashboard widgets
      expect(html).not.toContain('Dashboard Overview');
      expect(html).not.toContain('Active Students');
    });

    it('AcademicDashboard redirects standard TEACHER directly to /academics/operations/timetable', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicDashboard />
        </MemoryRouter>
      );
      // Does not render the Academic Dashboard header or KPI cards
      expect(html).not.toContain('Academic Setup & Governance');
      expect(html).not.toContain('Attendance Today');
    });
  });

  describe('STEP 2: Isolate Timetable View for Teachers', () => {
    it('forces teacher personal view and hides mode switcher buttons (Master Matrix, Class View)', () => {
      const html = renderToString(
        <MemoryRouter>
          <TimetableManagement />
        </MemoryRouter>
      );

      // Tab switcher buttons should NOT be rendered for standard teacher
      expect(html).not.toContain('id="view-mode-master"');
      expect(html).not.toContain('id="view-mode-class"');
      expect(html).not.toContain('id="view-mode-teacher"');
      expect(html).not.toContain('Master Matrix');
      expect(html).not.toContain('Class View');

      // Teacher Weekly View is rendered
      expect(html).toContain('id="teacher-weekly-view"');
      // No inspect teacher dropdown for standard teacher
      expect(html).not.toContain('id="select-teacher-schedule"');
    });
  });

  describe('STEP 3: Display Teacher Department', () => {
    it('displays teacher academic department in Header', () => {
      const html = renderToString(
        <MemoryRouter>
          <Header onOpenMenu={vi.fn()} menuExpanded={false} />
        </MemoryRouter>
      );

      expect(html).toContain('id="header-teacher-department"');
      expect(html).toContain('Languages &amp; Literature');
    });

    it('displays teacher academic department in Sidebar profile footer', () => {
      const html = renderToString(
        <MemoryRouter>
          <Sidebar onNavigate={vi.fn()} mobileOpen={false} onClose={vi.fn()} />
        </MemoryRouter>
      );

      expect(html).toContain('id="sidebar-teacher-department"');
      expect(html).toContain('Languages &amp; Literature');
    });

    it('displays teacher academic department in AcademicTopbar', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicTopbar />
        </MemoryRouter>
      );

      expect(html).toContain('id="academic-teacher-department-badge"');
      expect(html).toContain('Languages &amp; Literature');
    });
  });
});
