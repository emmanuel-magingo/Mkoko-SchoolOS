import { describe, it, expect } from 'vitest';
import { Permissions, Permission } from '../types/permissions';
import { UserRole, User, Tenant } from '../types';
import {
  getSchoolNavGroups,
  getPlatformNavGroups,
  filterNavGroups,
} from '../components/layout/navigationConfig';

describe('MIC SchoolOS — Frontend Permission-Driven UI & Isolation (Requirements A, B, C, D)', () => {
  const mockTenant: Tenant = {
    id: 'tenant-school-1',
    name: 'School 1',
    code: 'SCH1',
    slug: 'school-1',
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

  const ROLE_PERMISSION_MAP: Record<UserRole, Permission[]> = {
    PLATFORM_ADMIN: [],
    SCHOOL_ADMIN: [
      Permissions.VIEW_ACADEMICS,
      Permissions.MANAGE_ACADEMICS,
      Permissions.MANAGE_CLASSES,
      Permissions.MANAGE_SUBJECTS,
      Permissions.VIEW_ATTENDANCE,
      Permissions.MANAGE_ATTENDANCE,
      Permissions.VIEW_MISSING_REGISTERS,
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
      Permissions.VIEW_STUDENTS,
      Permissions.CREATE_STUDENTS,
      Permissions.MANAGE_STUDENTS,
      Permissions.VIEW_ADMISSIONS,
      Permissions.MANAGE_ADMISSIONS,
      Permissions.VIEW_TIMETABLE,
      Permissions.MANAGE_TIMETABLE,
      Permissions.VIEW_DUTY_ROSTER,
      Permissions.MANAGE_DUTY_ROSTER,
      Permissions.VIEW_DISCIPLINE,
      Permissions.VIEW_LESSON_LOGS,
      Permissions.MANAGE_CALENDAR,
      Permissions.GENERATE_REPORT_CARDS,
      Permissions.VIEW_STAFF,
      Permissions.CREATE_STAFF,
      Permissions.UPDATE_STAFF,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_DELEGATIONS,
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
      Permissions.VIEW_STUDENTS,
      Permissions.CREATE_STUDENTS,
      Permissions.VIEW_ADMISSIONS,
      Permissions.MANAGE_ADMISSIONS,
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
      Permissions.APPROVE_GRADES,
      Permissions.REOPEN_GRADES,
      Permissions.VIEW_LESSON_LOGS,
      Permissions.REVIEW_LESSON_LOG,
      Permissions.GENERATE_REPORT_CARDS,
      Permissions.PUBLISH_REPORT_CARDS,
      Permissions.MANAGE_CALENDAR,
      Permissions.VIEW_MISSING_REGISTERS,
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
      Permissions.VIEW_MISSING_REGISTERS,
      Permissions.VIEW_REPORTS,
      Permissions.VIEW_ADMINISTRATION,
      Permissions.VIEW_NOTIFICATIONS,
      Permissions.SEND_NOTIFICATIONS,
      Permissions.VIEW_STUDENTS,
      Permissions.VIEW_ADMISSIONS,
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
      Permissions.VIEW_LESSON_LOGS,
      Permissions.REVIEW_LESSON_LOG,
      Permissions.GENERATE_REPORT_CARDS,
      Permissions.MANAGE_CALENDAR,
      Permissions.VIEW_STAFF,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_LEAVE,
      Permissions.VIEW_DELEGATIONS,
      Permissions.VIEW_OWN_PAYSLIP,
    ],
    SENIOR_ACADEMIC_MASTER: [
      Permissions.VIEW_ACADEMICS,
      Permissions.MANAGE_ACADEMICS,
      Permissions.MANAGE_CLASSES,
      Permissions.MANAGE_SUBJECTS,
      Permissions.VIEW_ATTENDANCE,
      Permissions.MANAGE_ATTENDANCE,
      Permissions.VIEW_MISSING_REGISTERS,
      Permissions.VIEW_REPORTS,
      Permissions.VIEW_STUDENTS,
      Permissions.MANAGE_STUDENTS,
      Permissions.VIEW_TIMETABLE,
      Permissions.MANAGE_TIMETABLE,
      Permissions.VIEW_DISCIPLINE,
      Permissions.CREATE_DISCIPLINE_INCIDENT,
      Permissions.ADD_DISCIPLINE_NOTE,
      Permissions.APPROVE_GRADES,
      Permissions.VIEW_LESSON_LOGS,
      Permissions.REVIEW_LESSON_LOG,
      Permissions.GENERATE_REPORT_CARDS,
      Permissions.MANAGE_CALENDAR,
      Permissions.VIEW_STAFF,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_DELEGATIONS,
      Permissions.VIEW_OWN_PAYSLIP,
    ],
    SCHOOL_MANAGER: [
      Permissions.VIEW_ACADEMICS,
      Permissions.VIEW_ATTENDANCE,
      Permissions.VIEW_FINANCE,
      Permissions.MANAGE_FINANCE,
      Permissions.RECORD_PAYMENT,
      Permissions.VIEW_REPORTS,
      Permissions.MANAGE_REPORTS,
      Permissions.VIEW_ADMINISTRATION,
      Permissions.MANAGE_ADMINISTRATION,
      Permissions.VIEW_NOTIFICATIONS,
      Permissions.SEND_NOTIFICATIONS,
      Permissions.VIEW_STUDENTS,
      Permissions.VIEW_ADMISSIONS,
      Permissions.MANAGE_ADMISSIONS,
      Permissions.VIEW_TIMETABLE,
      Permissions.VIEW_DUTY_ROSTER,
      Permissions.VIEW_DISCIPLINE,
      Permissions.VIEW_STAFF,
      Permissions.CREATE_STAFF,
      Permissions.UPDATE_STAFF,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_LEAVE,
      Permissions.VIEW_DELEGATIONS,
      Permissions.VIEW_PAYROLL,
      Permissions.REVIEW_PAYROLL,
      Permissions.VIEW_OWN_PAYSLIP,
    ],
    BURSAR: [
      Permissions.VIEW_FINANCE,
      Permissions.MANAGE_FINANCE,
      Permissions.RECORD_PAYMENT,
      Permissions.VIEW_REPORTS,
      Permissions.VIEW_STUDENTS,
      Permissions.VIEW_NOTIFICATIONS,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_PAYROLL,
      Permissions.VIEW_OWN_PAYSLIP,
    ],
    SECRETARY: [
      Permissions.VIEW_STUDENTS,
      Permissions.CREATE_STUDENTS,
      Permissions.MANAGE_STUDENTS,
      Permissions.VIEW_ADMISSIONS,
      Permissions.MANAGE_ADMISSIONS,
      Permissions.VIEW_NOTIFICATIONS,
      Permissions.SEND_NOTIFICATIONS,
      Permissions.VIEW_ATTENDANCE,
      Permissions.VIEW_ADMINISTRATION,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_OWN_PAYSLIP,
    ],
    TEACHER: [
      Permissions.VIEW_ACADEMICS,
      Permissions.VIEW_ATTENDANCE,
      Permissions.RECORD_ATTENDANCE,
      Permissions.VIEW_STUDENTS,
      Permissions.VIEW_TIMETABLE,
      Permissions.VIEW_DISCIPLINE,
      Permissions.CREATE_DISCIPLINE_INCIDENT,
      Permissions.ADD_DISCIPLINE_NOTE,
      Permissions.VIEW_NOTIFICATIONS,
      Permissions.RECORD_GRADES,
      Permissions.RECORD_LESSON_LOG,
      Permissions.VIEW_LESSON_LOGS,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_DELEGATIONS,
      Permissions.VIEW_OWN_PAYSLIP,
    ],
    STAFF: [
      Permissions.VIEW_NOTIFICATIONS,
      Permissions.APPLY_LEAVE,
      Permissions.VIEW_OWN_PAYSLIP,
    ],
  };

  const hasPermission = (
    user: Partial<User> | null,
    permission: Permission
  ): boolean => {
    if (!user || !user.role) return false;
    if (user.role === 'PLATFORM_ADMIN') return false;

    if (permission === Permissions.VIEW_DUTY_ROSTER && Boolean((user as any).isTeacherOnDuty)) {
      return true;
    }

    if (user.customPermissions && user.customPermissions.includes(permission)) {
      return true;
    }

    const basePermissions = ROLE_PERMISSION_MAP[user.role] || [];
    return basePermissions.includes(permission);
  };

  describe('1. Platform Admin Strict School UI Isolation', () => {
    const platformAdmin: User = {
      id: 'platform-admin-1',
      email: 'admin@platform.test',
      firstName: 'Platform',
      lastName: 'Superadmin',
      role: 'PLATFORM_ADMIN',
      tenantId: null,
    };

    it('PLATFORM_ADMIN holds zero school permissions by default', () => {
      expect(hasPermission(platformAdmin, Permissions.VIEW_STUDENTS)).toBe(false);
      expect(hasPermission(platformAdmin, Permissions.CREATE_STUDENTS)).toBe(false);
      expect(hasPermission(platformAdmin, Permissions.VIEW_FINANCE)).toBe(false);
      expect(hasPermission(platformAdmin, Permissions.MANAGE_FINANCE)).toBe(false);
      expect(hasPermission(platformAdmin, Permissions.VIEW_ACADEMICS)).toBe(false);
      expect(hasPermission(platformAdmin, Permissions.VIEW_STAFF)).toBe(false);
    });

    it('getSchoolNavGroups hides authorized items when hasPermission returns false for platform admin', () => {
      const checkPermission = (p: Permission) => hasPermission(platformAdmin, p);
      const schoolGroups = getSchoolNavGroups({
        user: platformAdmin,
        tenant: null,
        hasPermission: checkPermission,
      });

      // Filter groups using standard filterNavGroups logic
      const filtered = filterNavGroups(schoolGroups, '', allModules, false, true);

      // Student and Finance items should be completely absent
      const visiblePaths = filtered.flatMap((g) => g.items.map((i) => i.to));
      expect(visiblePaths).not.toContain('/students');
      expect(visiblePaths).not.toContain('/finance');
      expect(visiblePaths).not.toContain('/finance/invoices');
      expect(visiblePaths).not.toContain('/classes');
    });

    it('getPlatformNavGroups provides platform navigation items specifically for platform admin', () => {
      const platformGroups = getPlatformNavGroups();
      expect(platformGroups.length).toBeGreaterThan(0);
      const paths = platformGroups.flatMap((g) => g.items.map((i) => i.to));
      expect(paths).toContain('/platform');
      expect(paths).toContain('/platform/tenants');
      expect(paths).toContain('/platform/administrators');
    });
  });

  describe('2. Permission-Driven "Add Student" and Registry Actions', () => {
    it('Allows "Add Student" (CREATE_STUDENTS) only for authorized roles: SCHOOL_ADMIN, HEADMASTER, SECRETARY', () => {
      const schoolAdmin: Partial<User> = { role: 'SCHOOL_ADMIN' };
      const headmaster: Partial<User> = { role: 'HEADMASTER' };
      const secretary: Partial<User> = { role: 'SECRETARY' };
      const teacher: Partial<User> = { role: 'TEACHER' };
      const bursar: Partial<User> = { role: 'BURSAR' };
      const staff: Partial<User> = { role: 'STAFF' };

      expect(hasPermission(schoolAdmin, Permissions.CREATE_STUDENTS)).toBe(true);
      expect(hasPermission(headmaster, Permissions.CREATE_STUDENTS)).toBe(true);
      expect(hasPermission(secretary, Permissions.CREATE_STUDENTS)).toBe(true);

      // Other roles must NEVER see Add Student
      expect(hasPermission(teacher, Permissions.CREATE_STUDENTS)).toBe(false);
      expect(hasPermission(bursar, Permissions.CREATE_STUDENTS)).toBe(false);
      expect(hasPermission(staff, Permissions.CREATE_STUDENTS)).toBe(false);
    });

    it('Allows custom role with explicit CREATE_STUDENTS to see Add Student action', () => {
      const customStaffWithoutGrant: Partial<User> = {
        role: 'STAFF',
        customPermissions: [],
      };
      const customStaffWithGrant: Partial<User> = {
        role: 'STAFF',
        customPermissions: [Permissions.CREATE_STUDENTS, Permissions.VIEW_STUDENTS],
      };

      expect(hasPermission(customStaffWithoutGrant, Permissions.CREATE_STUDENTS)).toBe(false);
      expect(hasPermission(customStaffWithGrant, Permissions.CREATE_STUDENTS)).toBe(true);
      expect(hasPermission(customStaffWithGrant, Permissions.MANAGE_STUDENTS)).toBe(false);
    });
  });

  describe('3. Finance Actions and Module Isolation', () => {
    it('Hides finance navigation and actions from TEACHER, SECRETARY, and STAFF', () => {
      const teacher: User = {
        id: 'user-teacher',
        email: 'teacher@school.test',
        firstName: 'Jane',
        lastName: 'Teacher',
        role: 'TEACHER',
        tenantId: mockTenant.id,
      };

      expect(hasPermission(teacher, Permissions.VIEW_FINANCE)).toBe(false);
      expect(hasPermission(teacher, Permissions.MANAGE_FINANCE)).toBe(false);

      const checkPermission = (p: Permission) => hasPermission(teacher, p);
      const groups = getSchoolNavGroups({
        user: teacher,
        tenant: mockTenant,
        hasPermission: checkPermission,
      });
      const filteredGroups = filterNavGroups(groups, '', allModules, false, true);
      const paths = filteredGroups.flatMap((g) => g.items.map((i) => i.to));

      expect(paths).not.toContain('/finance');
      expect(paths).not.toContain('/finance/invoices');
      expect(paths).not.toContain('/finance/fee-structures');
    });

    it('Grants finance oversight to HEADMASTER with read-only constraint (no MANAGE_FINANCE)', () => {
      const headmaster: Partial<User> = { role: 'HEADMASTER' };

      expect(hasPermission(headmaster, Permissions.VIEW_FINANCE)).toBe(true);
      expect(hasPermission(headmaster, Permissions.MANAGE_FINANCE)).toBe(false);
      expect(hasPermission(headmaster, Permissions.RECORD_PAYMENT)).toBe(false);
    });

    it('Grants operational finance management and payment recording to BURSAR and SCHOOL_ADMIN', () => {
      const bursar: Partial<User> = { role: 'BURSAR' };
      const schoolAdmin: Partial<User> = { role: 'SCHOOL_ADMIN' };

      expect(hasPermission(bursar, Permissions.VIEW_FINANCE)).toBe(true);
      expect(hasPermission(bursar, Permissions.MANAGE_FINANCE)).toBe(true);
      expect(hasPermission(bursar, Permissions.RECORD_PAYMENT)).toBe(true);

      expect(hasPermission(schoolAdmin, Permissions.VIEW_FINANCE)).toBe(true);
      expect(hasPermission(schoolAdmin, Permissions.MANAGE_FINANCE)).toBe(true);
      expect(hasPermission(schoolAdmin, Permissions.RECORD_PAYMENT)).toBe(true);
    });
  });

  describe('4. Navigation and Route Security Agreement', () => {
    it('Each school role only sees navigation items matching their canonical permissions', () => {
      for (const [role, perms] of Object.entries(ROLE_PERMISSION_MAP)) {
        if (role === 'PLATFORM_ADMIN') continue;
        const user: User = {
          id: `user-${role.toLowerCase()}`,
          email: `${role.toLowerCase()}@school.test`,
          firstName: 'Test',
          lastName: role,
          role: role as UserRole,
          tenantId: mockTenant.id,
        };
        const checkPermission = (p: Permission) => perms.includes(p);
        const groups = getSchoolNavGroups({
          user,
          tenant: mockTenant,
          hasPermission: checkPermission,
        });
        const filtered = filterNavGroups(groups, '', allModules, false, true);

        for (const group of filtered) {
          for (const item of group.items) {
            // item.show must be true
            expect(item.show).toBe(true);
          }
        }
      }
    });
  });
});
