import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Permissions } from '../types/permissions';
import { User, Tenant } from '../types';
import { getSchoolNavGroups, filterNavGroups } from '../components/layout/navigationConfig';
import { PermissionGuard } from '../components/common/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Staff RBAC Navigation, Sidebar Filtering & Route Guard Suite', () => {
  const mockTenant: Tenant = {
    id: 'tenant-school-1',
    name: 'Mwalimu Secondary School',
    code: 'MWL01',
    slug: 'mwalimu-sec',
    status: 'ACTIVE',
  };

  const allModules = new Set([
    'academics',
    'admissions',
    'attendance',
    'timetable',
    'discipline',
    'finance',
    'hr',
    'payroll',
    'communications',
    'reports',
    'administration',
  ]);

  const mockTeacher: User = {
    id: 'user-teacher-1',
    email: 'teacher@school.test',
    firstName: 'Jane',
    lastName: 'Teacher',
    role: 'TEACHER',
    tenantId: mockTenant.id,
  };

  const mockStaff: User = {
    id: 'user-staff-1',
    email: 'staff@school.test',
    firstName: 'John',
    lastName: 'Staff',
    role: 'STAFF',
    tenantId: mockTenant.id,
  };

  const mockBursar: User = {
    id: 'user-bursar-1',
    email: 'bursar@school.test',
    firstName: 'Grace',
    lastName: 'Bursar',
    role: 'BURSAR',
    tenantId: mockTenant.id,
  };

  const mockHeadmaster: User = {
    id: 'user-hm-1',
    email: 'headmaster@school.test',
    firstName: 'Head',
    lastName: 'Master',
    role: 'HEADMASTER',
    tenantId: mockTenant.id,
  };

  const mockSchoolAdmin: User = {
    id: 'user-admin-1',
    email: 'admin@school.test',
    firstName: 'School',
    lastName: 'Admin',
    role: 'SCHOOL_ADMIN',
    tenantId: mockTenant.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Part 1: usePermissions Hook Role Mappings', () => {
    it('verifies TEACHER has no default staff permissions but retains teaching and leave rights', () => {
      mockUseAuth.mockReturnValue({ user: mockTeacher, isLoading: false });
      const { hasPermission } = usePermissions();

      expect(hasPermission(Permissions.VIEW_STAFF)).toBe(false);
      expect(hasPermission(Permissions.MANAGE_STAFF)).toBe(false);
      expect(hasPermission(Permissions.MANAGE_STAFF_ACCOUNTS)).toBe(false);
      expect(hasPermission(Permissions.VIEW_STAFF_ACTIVITY)).toBe(false);
      expect(hasPermission(Permissions.CREATE_STAFF)).toBe(false);

      // Preserved non-staff rights
      expect(hasPermission(Permissions.APPLY_LEAVE)).toBe(true);
      expect(hasPermission(Permissions.VIEW_OWN_PAYSLIP)).toBe(true);
      expect(hasPermission(Permissions.VIEW_ACADEMICS)).toBe(true);
      expect(hasPermission(Permissions.RECORD_GRADES)).toBe(true);
    });

    it('verifies ordinary STAFF has no default staff permissions but retains leave and payslip', () => {
      mockUseAuth.mockReturnValue({ user: mockStaff, isLoading: false });
      const { hasPermission } = usePermissions();

      expect(hasPermission(Permissions.VIEW_STAFF)).toBe(false);
      expect(hasPermission(Permissions.MANAGE_STAFF)).toBe(false);
      expect(hasPermission(Permissions.APPLY_LEAVE)).toBe(true);
      expect(hasPermission(Permissions.VIEW_OWN_PAYSLIP)).toBe(true);
    });

    it('verifies BURSAR has no default staff permissions but retains finance permissions', () => {
      mockUseAuth.mockReturnValue({ user: mockBursar, isLoading: false });
      const { hasPermission } = usePermissions();

      expect(hasPermission(Permissions.VIEW_STAFF)).toBe(false);
      expect(hasPermission(Permissions.MANAGE_STAFF)).toBe(false);
      expect(hasPermission(Permissions.VIEW_FINANCE)).toBe(true);
      expect(hasPermission(Permissions.RECORD_PAYMENT)).toBe(true);
    });

    it('verifies HEADMASTER has no staff management by default unless explicitly granted', () => {
      mockUseAuth.mockReturnValue({ user: mockHeadmaster, isLoading: false });
      const { hasPermission } = usePermissions();

      expect(hasPermission(Permissions.VIEW_STAFF)).toBe(false);
      expect(hasPermission(Permissions.MANAGE_STAFF)).toBe(false);
      expect(hasPermission(Permissions.CREATE_STAFF)).toBe(false);

      // Retains academic leadership & leave approvals
      expect(hasPermission(Permissions.VIEW_ACADEMICS)).toBe(true);
      expect(hasPermission(Permissions.MANAGE_LEAVE)).toBe(true);
    });

    it('verifies SCHOOL_ADMIN has full staff management permissions', () => {
      mockUseAuth.mockReturnValue({ user: mockSchoolAdmin, isLoading: false });
      const { hasPermission } = usePermissions();

      expect(hasPermission(Permissions.VIEW_STAFF)).toBe(true);
      expect(hasPermission(Permissions.MANAGE_STAFF)).toBe(true);
      expect(hasPermission(Permissions.MANAGE_STAFF_ACCOUNTS)).toBe(true);
      expect(hasPermission(Permissions.VIEW_STAFF_ACTIVITY)).toBe(true);
      expect(hasPermission(Permissions.CREATE_STAFF)).toBe(true);
      expect(hasPermission(Permissions.UPDATE_STAFF)).toBe(true);
      expect(hasPermission(Permissions.MANAGE_STAFF_STATUS)).toBe(true);
      expect(hasPermission(Permissions.VIEW_STAFF_SENSITIVE)).toBe(true);
    });

    it('honors explicit custom permissions granted to a user', () => {
      const headmasterWithGrant: User = {
        ...mockHeadmaster,
        customPermissions: [Permissions.VIEW_STAFF, Permissions.MANAGE_STAFF],
      };
      mockUseAuth.mockReturnValue({ user: headmasterWithGrant, isLoading: false });
      const { hasPermission } = usePermissions();

      expect(hasPermission(Permissions.VIEW_STAFF)).toBe(true);
      expect(hasPermission(Permissions.MANAGE_STAFF)).toBe(true);
    });
  });

  describe('Part 2: Sidebar Navigation Filtering (getSchoolNavGroups)', () => {
    it('strictly hides Staff Management & Staff & Users from TEACHER navigation', () => {
      mockUseAuth.mockReturnValue({ user: mockTeacher, isLoading: false });
      const { hasPermission } = usePermissions();

      const groups = getSchoolNavGroups({
        user: mockTeacher,
        tenant: mockTenant,
        hasPermission,
      });

      const filtered = filterNavGroups(groups, '', allModules, false, true);
      const allPaths = filtered.flatMap((g) => g.items.map((i) => i.to));
      const allTitles = filtered.map((g) => g.title);

      expect(allTitles).not.toContain('Staff & Users');
      expect(allTitles).not.toContain('Staff Management');
      expect(allPaths).not.toContain('/people');
      expect(allPaths).not.toContain('/staff');
    });

    it('strictly hides Staff Management & Staff & Users from ordinary STAFF navigation', () => {
      mockUseAuth.mockReturnValue({ user: mockStaff, isLoading: false });
      const { hasPermission } = usePermissions();

      const groups = getSchoolNavGroups({
        user: mockStaff,
        tenant: mockTenant,
        hasPermission,
      });

      const filtered = filterNavGroups(groups, '', allModules, false, true);
      const allPaths = filtered.flatMap((g) => g.items.map((i) => i.to));
      const allTitles = filtered.map((g) => g.title);

      expect(allTitles).not.toContain('Staff & Users');
      expect(allPaths).not.toContain('/people');
    });

    it('strictly hides Staff Management & Staff & Users from BURSAR navigation', () => {
      mockUseAuth.mockReturnValue({ user: mockBursar, isLoading: false });
      const { hasPermission } = usePermissions();

      const groups = getSchoolNavGroups({
        user: mockBursar,
        tenant: mockTenant,
        hasPermission,
      });

      const filtered = filterNavGroups(groups, '', allModules, false, true);
      const allPaths = filtered.flatMap((g) => g.items.map((i) => i.to));
      const allTitles = filtered.map((g) => g.title);

      expect(allTitles).not.toContain('Staff & Users');
      expect(allPaths).not.toContain('/people');
    });

    it('hides Staff Management & Staff & Users from default HEADMASTER navigation', () => {
      mockUseAuth.mockReturnValue({ user: mockHeadmaster, isLoading: false });
      const { hasPermission } = usePermissions();

      const groups = getSchoolNavGroups({
        user: mockHeadmaster,
        tenant: mockTenant,
        hasPermission,
      });

      const filtered = filterNavGroups(groups, '', allModules, false, true);
      const allPaths = filtered.flatMap((g) => g.items.map((i) => i.to));
      const allTitles = filtered.map((g) => g.title);

      expect(allTitles).not.toContain('Staff & Users');
      expect(allPaths).not.toContain('/people');
    });

    it('displays Staff & Users for SCHOOL_ADMIN', () => {
      mockUseAuth.mockReturnValue({ user: mockSchoolAdmin, isLoading: false });
      const { hasPermission } = usePermissions();

      const groups = getSchoolNavGroups({
        user: mockSchoolAdmin,
        tenant: mockTenant,
        hasPermission,
      });

      const filtered = filterNavGroups(groups, '', allModules, false, true);
      const allPaths = filtered.flatMap((g) => g.items.map((i) => i.to));
      const allTitles = filtered.map((g) => g.title);

      expect(allTitles).toContain('Staff & Users');
      expect(allPaths).toContain('/people');
    });

    it('displays Staff & Users for HEADMASTER when explicit permission is granted', () => {
      const headmasterWithGrant: User = {
        ...mockHeadmaster,
        customPermissions: [Permissions.VIEW_STAFF],
      };
      mockUseAuth.mockReturnValue({ user: headmasterWithGrant, isLoading: false });
      const { hasPermission } = usePermissions();

      const groups = getSchoolNavGroups({
        user: headmasterWithGrant,
        tenant: mockTenant,
        hasPermission,
      });

      const filtered = filterNavGroups(groups, '', allModules, false, true);
      const allPaths = filtered.flatMap((g) => g.items.map((i) => i.to));

      expect(allPaths).toContain('/people');
    });
  });

  describe('Part 3: Direct URL Route Protection (PermissionGuard)', () => {
    it('blocks TEACHER from accessing staff directory page and renders fallback or redirects', () => {
      mockUseAuth.mockReturnValue({ user: mockTeacher, isLoading: false });

      const html = renderToString(
        <MemoryRouter>
          <PermissionGuard
            permissions={[Permissions.VIEW_STAFF, Permissions.MANAGE_STAFF]}
            fallback={<div data-testid="access-denied">Access Restricted</div>}
          >
            <div data-testid="protected-content">Staff Management Directory Content</div>
          </PermissionGuard>
        </MemoryRouter>
      );

      expect(html).not.toContain('Staff Management Directory Content');
      expect(html).toContain('Access Restricted');
    });

    it('blocks TEACHER from accessing staff registration route', () => {
      mockUseAuth.mockReturnValue({ user: mockTeacher, isLoading: false });

      const html = renderToString(
        <MemoryRouter>
          <PermissionGuard permissions={[Permissions.CREATE_STAFF, Permissions.MANAGE_STAFF]}>
            <div>New Staff Registration Form</div>
          </PermissionGuard>
        </MemoryRouter>
      );

      expect(html).not.toContain('New Staff Registration Form');
    });

    it('blocks ordinary STAFF and BURSAR from accessing people management page', () => {
      mockUseAuth.mockReturnValue({ user: mockStaff, isLoading: false });

      const staffHtml = renderToString(
        <MemoryRouter>
          <PermissionGuard permissions={[Permissions.VIEW_STAFF, Permissions.VIEW_USERS, Permissions.VIEW_ROLES]}>
            <div>People Management Page</div>
          </PermissionGuard>
        </MemoryRouter>
      );
      expect(staffHtml).not.toContain('People Management Page');

      mockUseAuth.mockReturnValue({ user: mockBursar, isLoading: false });

      const bursarHtml = renderToString(
        <MemoryRouter>
          <PermissionGuard permissions={[Permissions.VIEW_STAFF, Permissions.VIEW_USERS, Permissions.VIEW_ROLES]}>
            <div>People Management Page</div>
          </PermissionGuard>
        </MemoryRouter>
      );
      expect(bursarHtml).not.toContain('People Management Page');
    });

    it('allows SCHOOL_ADMIN to access all staff management and people routes', () => {
      mockUseAuth.mockReturnValue({ user: mockSchoolAdmin, isLoading: false });

      const directoryHtml = renderToString(
        <MemoryRouter>
          <PermissionGuard permissions={[Permissions.VIEW_STAFF, Permissions.MANAGE_STAFF]}>
            <div>Staff Directory Page</div>
          </PermissionGuard>
        </MemoryRouter>
      );
      expect(directoryHtml).toContain('Staff Directory Page');

      const createHtml = renderToString(
        <MemoryRouter>
          <PermissionGuard permissions={[Permissions.CREATE_STAFF, Permissions.MANAGE_STAFF]}>
            <div>New Staff Registration Form</div>
          </PermissionGuard>
        </MemoryRouter>
      );
      expect(createHtml).toContain('New Staff Registration Form');
    });

    it('allows HEADMASTER direct route access when explicit permission is granted', () => {
      const headmasterWithGrant: User = {
        ...mockHeadmaster,
        customPermissions: [Permissions.VIEW_STAFF],
      };
      mockUseAuth.mockReturnValue({ user: headmasterWithGrant, isLoading: false });

      const html = renderToString(
        <MemoryRouter>
          <PermissionGuard permissions={[Permissions.VIEW_STAFF, Permissions.MANAGE_STAFF]}>
            <div>Staff Directory Page</div>
          </PermissionGuard>
        </MemoryRouter>
      );
      expect(html).toContain('Staff Directory Page');
    });
  });
});
