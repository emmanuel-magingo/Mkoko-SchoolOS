import { describe, it, expect } from 'vitest';
import {
  getSchoolNavGroups,
  getPlatformNavGroups,
  filterNavGroups,
  isItemActive,
  isGroupActive,
  NavGroupConfig,
} from '../components/layout/navigationConfig';
import { Permissions, Permission } from '../types/permissions';
import { User, Tenant, UserRole } from '../types';

describe('MKOKO SCHOOLOS — SIDEBAR NAVIGATION AUDIT & HICK’S LAW OPTIMIZATION', () => {
  const mockTenant: Tenant = {
    id: 'tenant-test-1',
    name: 'Mwilamvya Secondary School',
    code: 'MWL',
    slug: 'mwilamvya',
    status: 'PILOT',
  };

  const createMockUser = (role: UserRole, customPermissions: string[] = []): User => ({
    id: `user-${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@school.org`,
    firstName: 'Test',
    lastName: role,
    role,
    tenantId: mockTenant.id,
    customPermissions,
  });

  const getRolePermissions = (role: UserRole, customPermissions: string[] = []): Set<Permission> => {
    const rolePermissions: Record<UserRole, Permission[]> = {
      PLATFORM_ADMIN: Object.values(Permissions),
      SCHOOL_ADMIN: [
        Permissions.VIEW_ACADEMICS,
        Permissions.MANAGE_ACADEMICS,
        Permissions.MANAGE_CLASSES,
        Permissions.MANAGE_SUBJECTS,
        Permissions.VIEW_ATTENDANCE,
        Permissions.MANAGE_ATTENDANCE,
        Permissions.VIEW_FINANCE,
        Permissions.MANAGE_FINANCE,
        Permissions.RECORD_PAYMENT,
        Permissions.VIEW_REPORTS,
        Permissions.MANAGE_REPORTS,
        Permissions.VIEW_ADMINISTRATION,
        Permissions.MANAGE_ADMINISTRATION,
        Permissions.VIEW_USERS,
        Permissions.MANAGE_USERS,
        Permissions.VIEW_ROLES,
        Permissions.MANAGE_ROLES,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.SEND_NOTIFICATIONS,
        Permissions.MANAGE_NOTIFICATIONS,
        Permissions.VIEW_TIMETABLE,
        Permissions.MANAGE_TIMETABLE,
        Permissions.VIEW_DUTY_ROSTER,
        Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE,
        Permissions.VIEW_STAFF,
        Permissions.CREATE_STAFF,
        Permissions.UPDATE_STAFF,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      HEADMASTER: [
        Permissions.VIEW_ACADEMICS,
        Permissions.VIEW_ATTENDANCE,
        Permissions.VIEW_FINANCE,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_ADMINISTRATION,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.SEND_NOTIFICATIONS,
        Permissions.MANAGE_NOTIFICATIONS,
        Permissions.VIEW_TIMETABLE,
        Permissions.MANAGE_TIMETABLE,
        Permissions.VIEW_DUTY_ROSTER,
        Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE,
        Permissions.CREATE_DISCIPLINE_INCIDENT,
        Permissions.MANAGE_DISCIPLINE,
        Permissions.RESOLVE_DISCIPLINE,
        Permissions.ESCALATE_DISCIPLINE,
        Permissions.ADD_DISCIPLINE_NOTE,
        Permissions.VIEW_STUDENT_WELFARE,
        Permissions.VIEW_STAFF,
        Permissions.VIEW_STAFF_SENSITIVE,
        Permissions.CREATE_STAFF,
        Permissions.UPDATE_STAFF,
        Permissions.MANAGE_STAFF_STATUS,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.MANAGE_LEAVE,
        Permissions.CREATE_DELEGATION,
        Permissions.REVOKE_DELEGATION,
        Permissions.VIEW_DELEGATIONS,
        Permissions.VIEW_PAYROLL,
        Permissions.VIEW_PAYROLL_SENSITIVE,
        Permissions.REVIEW_PAYROLL,
        Permissions.APPROVE_PAYROLL,
        Permissions.FINALIZE_PAYROLL,
        Permissions.POST_PAYROLL,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      SECOND_MASTER: [
        Permissions.VIEW_ACADEMICS,
        Permissions.VIEW_ATTENDANCE,
        Permissions.MANAGE_ATTENDANCE,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_ADMINISTRATION,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.SEND_NOTIFICATIONS,
        Permissions.VIEW_TIMETABLE,
        Permissions.MANAGE_TIMETABLE,
        Permissions.VIEW_DUTY_ROSTER,
        Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE,
        Permissions.CREATE_DISCIPLINE_INCIDENT,
        Permissions.MANAGE_DISCIPLINE,
        Permissions.RESOLVE_DISCIPLINE,
        Permissions.ESCALATE_DISCIPLINE,
        Permissions.ADD_DISCIPLINE_NOTE,
        Permissions.VIEW_STAFF,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.MANAGE_LEAVE,
        Permissions.VIEW_DELEGATIONS,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      SENIOR_ACADEMIC_MASTER: [
        Permissions.VIEW_ACADEMICS,
        Permissions.MANAGE_ACADEMICS,
        Permissions.MANAGE_CLASSES,
        Permissions.MANAGE_SUBJECTS,
        Permissions.MANAGE_ENROLMENTS,
        Permissions.MANAGE_ASSESSMENTS,
        Permissions.MANAGE_REPORT_CARDS,
        Permissions.MANAGE_INTERVENTIONS,
        Permissions.MANAGE_ACADEMIC_MEETINGS,
        Permissions.RECORD_GRADES,
        Permissions.APPROVE_GRADES,
        Permissions.GENERATE_REPORT_CARDS,
        Permissions.PUBLISH_REPORT_CARDS,
        Permissions.VIEW_ATTENDANCE,
        Permissions.RECORD_ATTENDANCE,
        Permissions.MANAGE_ATTENDANCE,
        Permissions.VIEW_STUDENTS,
        Permissions.MANAGE_STUDENTS,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.SEND_NOTIFICATIONS,
        Permissions.VIEW_TIMETABLE,
        Permissions.MANAGE_TIMETABLE,
        Permissions.VIEW_DUTY_ROSTER,
        Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE,
        Permissions.VIEW_STAFF,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      SCHOOL_MANAGER: [
        Permissions.VIEW_FINANCE,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_ADMINISTRATION,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_DUTY_ROSTER,
        Permissions.VIEW_STAFF,
        Permissions.VIEW_STAFF_SENSITIVE,
        Permissions.CREATE_STAFF,
        Permissions.UPDATE_STAFF,
        Permissions.MANAGE_STAFF_STATUS,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.MANAGE_LEAVE,
        Permissions.VIEW_DELEGATIONS,
        Permissions.VIEW_PAYROLL,
        Permissions.VIEW_PAYROLL_SENSITIVE,
        Permissions.MANAGE_COMPENSATION,
        Permissions.CREATE_PAYROLL,
        Permissions.CALCULATE_PAYROLL,
        Permissions.REVIEW_PAYROLL,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      BURSAR: [
        Permissions.VIEW_FINANCE,
        Permissions.MANAGE_FINANCE,
        Permissions.RECORD_PAYMENT,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_DUTY_ROSTER,
        Permissions.VIEW_STAFF,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.VIEW_PAYROLL,
        Permissions.CALCULATE_PAYROLL,
        Permissions.REVIEW_PAYROLL,
        Permissions.POST_PAYROLL,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      SECRETARY: [
        Permissions.VIEW_ADMINISTRATION,
        Permissions.VIEW_ATTENDANCE,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.SEND_NOTIFICATIONS,
        Permissions.RECORD_PAYMENT,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_DISCIPLINE,
        Permissions.VIEW_STAFF,
        Permissions.CREATE_STAFF,
        Permissions.UPDATE_STAFF,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      TEACHER: [
        Permissions.VIEW_ACADEMICS,
        Permissions.VIEW_ATTENDANCE,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.RECORD_GRADES,
        Permissions.RECORD_ATTENDANCE,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_DISCIPLINE,
        Permissions.CREATE_DISCIPLINE_INCIDENT,
        Permissions.ADD_DISCIPLINE_NOTE,
        Permissions.VIEW_LESSON_LOGS,
        Permissions.RECORD_LESSON_LOG,
        Permissions.VIEW_STAFF,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      STAFF: [
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_STAFF,
        Permissions.APPLY_LEAVE,
        Permissions.VIEW_LEAVE,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
    };

    const granted = new Set(rolePermissions[role] || []);
    customPermissions.forEach((p) => granted.add(p as Permission));
    return granted;
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

  // ==========================================================================
  // SECTION 1: HICK'S LAW STRUCTURE VERIFICATION
  // ==========================================================================
  describe('Hick’s Law 5-7 Expandable Top-Level Groups', () => {
    it('generates 6 navigation destinations for school tenants, including Staff & Users', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const groups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });

      expect(groups.length).toBe(6);
      const groupIds = groups.map((g) => g.id);
      expect(groupIds).toEqual([
        'overview',
        'academics',
        'finance',
        'people',
        'communications',
        'administration',
      ]);
    });

    it('satisfies Hick’s & Miller’s Law constraints: every group contains between 1 and 12 items', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const groups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });

      groups.forEach((group) => {
        expect(group.items.length).toBeGreaterThanOrEqual(1);
        expect(group.items.length).toBeLessThanOrEqual(13);
      });
    });

    it('preserves all core destinations with unified academics and restores orphaned /administration/calendar', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const groups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const allItemPaths = groups.flatMap((g) => g.items.map((i) => i.to));

      // Core destinations
      expect(allItemPaths).toContain('/');
      expect(allItemPaths).toContain('/academics');
      expect(allItemPaths).not.toContain('/students');
      expect(allItemPaths).not.toContain('/classes');
      expect(allItemPaths).not.toContain('/admissions');
      expect(allItemPaths).toContain('/academics/operations/attendance');
      expect(allItemPaths).toContain('/academics/operations/timetable');
      expect(allItemPaths).toContain('/finance');
      expect(allItemPaths).toContain('/finance/fee-categories');
      expect(allItemPaths).toContain('/finance/fee-structures');
      expect(allItemPaths).toContain('/finance/invoices');
      expect(allItemPaths).toContain('/finance/payments');
      expect(allItemPaths).toContain('/finance/reports');
      expect(allItemPaths).toContain('/people');
      expect(allItemPaths).not.toContain('/staff');
      expect(allItemPaths).not.toContain('/leave');
      expect(allItemPaths).not.toContain('/delegations');
      expect(allItemPaths).toContain('/payroll');
      expect(allItemPaths).toContain('/payroll/periods');
      expect(allItemPaths).toContain('/payroll/compensation');
      expect(allItemPaths).not.toContain('/payroll/my-payslips');
      expect(allItemPaths).toContain('/reports');
      expect(allItemPaths).toContain('/notifications');
      expect(allItemPaths).toContain('/notifications/announcements');
      expect(allItemPaths).toContain('/administration');
      expect(allItemPaths).not.toContain('/administration/users');
      expect(allItemPaths).not.toContain('/administration/roles');
      expect(allItemPaths).toContain('/audit-logs');

      // Restored orphaned calendar
      expect(allItemPaths).toContain('/administration/calendar');
    });

    it('structures Platform Admin navigation into 4 clean operational groups', () => {
      const groups = getPlatformNavGroups();
      expect(groups.length).toBe(4);
      expect(groups.map((g) => g.id)).toEqual([
        'platform_overview',
        'platform_tenants',
        'platform_security',
        'platform_operations',
      ]);
    });
  });

  // ==========================================================================
  // SECTION 2: ROLE-BASED VISIBILITY & PROGRESSIVE DISCLOSURE
  // ==========================================================================
  describe('Role-Based Visibility Matrix & Progressive Disclosure', () => {
    it('SENIOR_ACADEMIC_MASTER: can view Academics, People and Communications, while Finance, HR, Operations, and Admin groups stay hidden', () => {
      const user = createMockUser('SENIOR_ACADEMIC_MASTER');
      const permissions = getRolePermissions('SENIOR_ACADEMIC_MASTER');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visibleGroupIds = visibleGroups.map((g) => g.id);

      // Visible groups
      expect(visibleGroupIds).not.toContain('overview');
      expect(visibleGroupIds).toContain('academics');
      expect(visibleGroupIds).toContain('people');
      expect(visibleGroupIds).toContain('communications');

      // Hidden groups
      expect(visibleGroupIds).not.toContain('finance');
      expect(visibleGroupIds).not.toContain('hr');
      expect(visibleGroupIds).not.toContain('operations');
      expect(visibleGroupIds).not.toContain('administration');

      // Specific authorized items
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));
      expect(visiblePaths).toContain('/academics');
      expect(visiblePaths).toContain('/academics/structure/classes');
      expect(visiblePaths).toContain('/academics/structure/subjects');
      expect(visiblePaths).toContain('/academics/structure/enrolments');
      expect(visiblePaths).toContain('/academics/operations/timetable');
      expect(visiblePaths).toContain('/academics/operations/attendance');
      expect(visiblePaths).toContain('/academics/assessments/marks-entry');
      expect(visiblePaths).toContain('/academics/assessments/report-cards');
      expect(visiblePaths).toContain('/reports');
      expect(visiblePaths).toContain('/notifications');

      // Prohibited items
      expect(visiblePaths).not.toContain('/');
      expect(visiblePaths).not.toContain('/finance');
      expect(visiblePaths).not.toContain('/staff');
      expect(visiblePaths).not.toContain('/leave');
      expect(visiblePaths).not.toContain('/administration');
    });

    it('TEACHER: can access the authorized People view and limited academic scope', () => {
      const user = createMockUser('TEACHER');
      const permissions = getRolePermissions('TEACHER');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visibleGroupIds = visibleGroups.map((g) => g.id);

      // Academics group is visible
      expect(visibleGroupIds).toEqual(['academics', 'people']);

      // Hidden groups: Overview, Communications, Finance, HR, Administration
      expect(visibleGroupIds).not.toContain('overview');
      expect(visibleGroupIds).not.toContain('communications');
      expect(visibleGroupIds).not.toContain('finance');
      expect(visibleGroupIds).not.toContain('hr');
      expect(visibleGroupIds).not.toContain('administration');

      // Specific authorized items strictly isolated (attendance hidden unless designated as class teacher)
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));
      const visibleLabels = visibleGroups.flatMap((g) => g.items.map((i) => i.label));
      expect(visiblePaths).toEqual([
        '/academics/operations/timetable',
        '/academics/operations/lesson-logs',
        '/academics/assessments/marks-entry',
        '/people',
      ]);
      expect(visiblePaths).not.toContain('/academics/operations/duty-roster');
      expect(visibleLabels).toContain('Lessons');
      expect(visibleLabels).not.toContain('Scheme of Work');
      expect(visibleLabels).not.toContain('Lesson Plans');
    });

    it('TEACHER: when assigned as Teacher on Duty for the week (isTeacherOnDuty: true), TOD appears in navigation', () => {
      const user = { ...createMockUser('TEACHER'), isTeacherOnDuty: true };
      const permissions = getRolePermissions('TEACHER');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));

      expect(visiblePaths).toContain('/academics/operations/duty-roster');

      // Administrative/curriculum items strictly hidden
      expect(visiblePaths).not.toContain('/academics');
      expect(visiblePaths).not.toContain('/academics/operations/attendance');
      expect(visiblePaths).not.toContain('/academics/structure/classes');
      expect(visiblePaths).not.toContain('/academics/structure/subjects');
      expect(visiblePaths).not.toContain('/academics/structure/enrolments');
      expect(visiblePaths).not.toContain('/academics/assessments/report-cards');
      expect(visiblePaths).not.toContain('/finance/invoices');
      expect(visiblePaths).not.toContain('/payroll/periods');
      expect(visiblePaths).not.toContain('/administration/roles');
      expect(visiblePaths).not.toContain('/audit-logs');
    });

    it('BURSAR: can view Finance & Billing, Payroll, but NOT Curriculum or Admin', () => {
      const user = createMockUser('BURSAR');
      const permissions = getRolePermissions('BURSAR');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));

      expect(visiblePaths).toContain('/finance');
      expect(visiblePaths).toContain('/finance/invoices');
      expect(visiblePaths).toContain('/finance/payments');
      expect(visiblePaths).toContain('/payroll');
      expect(visiblePaths).toContain('/payroll/periods');

      // Forbidden
      expect(visiblePaths).not.toContain('/academics');
      expect(visiblePaths).not.toContain('/delegations');
      expect(visiblePaths).not.toContain('/administration/roles');
    });

    it('STAFF: minimal personal view (Dashboard, Notifications)', () => {
      const user = createMockUser('STAFF');
      const permissions = getRolePermissions('STAFF');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));

      expect(visiblePaths).toEqual([
        '/',
        '/people',
        '/notifications',
        '/notifications/announcements',
      ]);
    });

    it('Custom permissions dynamically reveal new navigation groups and items', () => {
      // Teacher normally cannot see Finance
      const teacherWithoutCustom = createMockUser('TEACHER');
      const perms1 = getRolePermissions('TEACHER');
      const raw1 = getSchoolNavGroups({
        user: teacherWithoutCustom,
        tenant: mockTenant,
        hasPermission: (p) => perms1.has(p),
      });
      const visible1 = filterNavGroups(raw1, '', allModules, false, true);
      expect(visible1.some((g) => g.id === 'finance')).toBe(false);

      // Teacher granted custom permission 'finance:view'
      const teacherWithCustom = createMockUser('TEACHER', ['finance:view']);
      const perms2 = getRolePermissions('TEACHER', ['finance:view']);
      const raw2 = getSchoolNavGroups({
        user: teacherWithCustom,
        tenant: mockTenant,
        hasPermission: (p) => perms2.has(p),
      });
      const visible2 = filterNavGroups(raw2, '', allModules, false, true);

      expect(visible2.some((g) => g.id === 'finance')).toBe(true);
      const financeGroup = visible2.find((g) => g.id === 'finance');
      expect(financeGroup?.items.map((i) => i.to)).toContain('/finance');
    });

    it('Disabling a module in tenant entitlements hides its navigation items', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });

      // Entitlements without 'finance'
      const entitlementsNoFinance = new Set(
        [...allModules].filter((m) => m !== 'finance')
      );

      const visibleGroups = filterNavGroups(rawGroups, '', entitlementsNoFinance, false, true);
      expect(visibleGroups.some((g) => g.id === 'finance')).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 3: SEARCH & QUICK FIND FILTERING
  // ==========================================================================
  describe('Lightweight Navigation Search & Keyword Matching', () => {
    it('matches navigation items by label (e.g. "Invoices")', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const matched = filterNavGroups(rawGroups, 'Invoices', allModules, false, true);

      expect(matched.length).toBe(1);
      expect(matched[0].id).toBe('finance');
      expect(matched[0].items.length).toBe(1);
      expect(matched[0].items[0].to).toBe('/finance/invoices');
    });

    it('matches navigation items by colloquial keywords (e.g. "curriculum" -> Subjects, "transcripts" -> Report Cards)', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });

      const currMatches = filterNavGroups(rawGroups, 'curriculum', allModules, false, true);
      const currPaths = currMatches.flatMap((g) => g.items.map((i) => i.to));
      expect(currPaths).toContain('/academics/structure/subjects');

      const reportMatches = filterNavGroups(rawGroups, 'transcripts', allModules, false, true);
      const reportPaths = reportMatches.flatMap((g) => g.items.map((i) => i.to));
      expect(reportPaths).toContain('/academics/assessments/report-cards');
    });

    it('returns empty array when search query matches no destinations', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const matched = filterNavGroups(rawGroups, 'xyznotfound999', allModules, false, true);

      expect(matched.length).toBe(0);
    });

    it('clearing search query restores all authorized groups', () => {
      const user = createMockUser('SCHOOL_ADMIN');
      const permissions = getRolePermissions('SCHOOL_ADMIN');
      const hasPermission = (p: Permission) => permissions.has(p);

      const rawGroups = getSchoolNavGroups({ user, tenant: mockTenant, hasPermission });
      const filtered = filterNavGroups(rawGroups, '', allModules, false, true);

      expect(filtered.length).toBe(6); // overview, academics, people, finance, communications, administration
    });
  });

  // ==========================================================================
  // SECTION 4: ACTIVE ROUTE & ACCORDION RESOLUTION
  // ==========================================================================
  describe('Active Route & Group Resolution', () => {
    it('identifies root "/" as active only for end: true exact match', () => {
      expect(isItemActive('/', true, '/')).toBe(true);
      expect(isItemActive('/', true, '/students')).toBe(false);
      expect(isItemActive('/', true, '/finance')).toBe(false);
    });

    it('identifies nested routes and sub-pages accurately', () => {
      expect(isItemActive('/finance/invoices', false, '/finance/invoices')).toBe(true);
      expect(isItemActive('/finance/invoices', false, '/finance/invoices/inv-123')).toBe(true);
      expect(isItemActive('/finance', true, '/finance/invoices')).toBe(false); // end: true prevents false active
    });

    it('isGroupActive correctly detects active group for deep child routes', () => {
      const group: NavGroupConfig = {
        id: 'finance',
        title: 'Finance & Billing',
        icon: () => null,
        items: [
          { to: '/finance', label: 'Finance', icon: () => null, show: true, end: true, keywords: [] },
          { to: '/finance/invoices', label: 'Invoices', icon: () => null, show: true, keywords: [] },
        ],
      };

      expect(isGroupActive(group, '/finance/invoices')).toBe(true);
      expect(isGroupActive(group, '/finance/invoices/inv-999')).toBe(true);
      expect(isGroupActive(group, '/academics')).toBe(false);
    });
  });
});
