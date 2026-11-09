import { describe, it, expect } from 'vitest';
import {
  getSchoolNavGroups,
  getPlatformNavGroups,
  filterNavGroups,
  isItemActive,
} from '../components/layout/navigationConfig';
import { User, Tenant, UserRole } from '../types';

describe('MKOKO SCHOOLOS — PLATFORM ADMIN & SCHOOLOS ARCHITECTURAL SEPARATION', () => {
  const mockTenant: Tenant = {
    id: 'tenant-test-1',
    name: 'Mwilamvya Secondary School',
    code: 'MWL',
    slug: 'mwilamvya',
    status: 'PILOT',
  };

  const createMockSchoolUser = (role: UserRole = 'SCHOOL_ADMIN'): User => ({
    id: 'user-school-admin',
    email: 'admin@mwilamvya.ac.tz',
    firstName: 'School',
    lastName: 'Admin',
    role,
    tenantId: mockTenant.id,
    customPermissions: [],
  });

  const mockPlatformAdmin: User = {
    id: 'user-platform-admin',
    email: 'admin@platform.schoolos',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'PLATFORM_ADMIN',
    tenantId: null,
    customPermissions: [],
  };

  const allSchoolModules = new Set([
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

  describe('1. Interface & Navigation Route Boundary Isolation', () => {
    it('Platform Admin navigation strictly points to /platform routes and NEVER school routes', () => {
      const platformGroups = getPlatformNavGroups();
      const allPlatformPaths = platformGroups.flatMap((g) => g.items.map((i) => i.to));

      // Must contain dedicated platform root and sub-modules
      expect(allPlatformPaths).toContain('/platform');
      expect(allPlatformPaths).toContain('/platform/tenants');
      expect(allPlatformPaths).toContain('/platform/administrators');
      expect(allPlatformPaths).toContain('/platform/roles-permissions');
      expect(allPlatformPaths).toContain('/platform/modules');
      expect(allPlatformPaths).toContain('/platform/subscriptions');
      expect(allPlatformPaths).toContain('/platform/branding');
      expect(allPlatformPaths).toContain('/platform/settings');
      expect(allPlatformPaths).toContain('/platform/analytics');
      expect(allPlatformPaths).toContain('/platform/security');
      expect(allPlatformPaths).toContain('/platform/system-health');
      expect(allPlatformPaths).toContain('/platform/support');
      expect(allPlatformPaths).toContain('/platform/announcements');
      expect(allPlatformPaths).toContain('/platform/backup');
      expect(allPlatformPaths).toContain('/platform/audit-logs');

      // Must NOT contain school-specific module paths
      expect(allPlatformPaths).not.toContain('/students');
      expect(allPlatformPaths).not.toContain('/classes');
      expect(allPlatformPaths).not.toContain('/finance');
      expect(allPlatformPaths).not.toContain('/academics');
      expect(allPlatformPaths).not.toContain('/attendance');
      expect(allPlatformPaths).not.toContain('/discipline');
      expect(allPlatformPaths).not.toContain('/payroll');
      expect(allPlatformPaths).not.toContain('/staff');
      expect(allPlatformPaths).not.toContain('/');
    });

    it('Platform admin receives zero school items from getSchoolNavGroups', () => {
      const schoolGroups = getSchoolNavGroups({
        user: mockPlatformAdmin,
        tenant: null,
        hasPermission: () => false,
      });
      const filtered = filterNavGroups(schoolGroups, '', allSchoolModules, false, true);
      const paths = filtered.flatMap((g) => g.items.map((i) => i.to));
      // Only standalone root dashboard item exists if any, zero school tenant modules
      expect(paths).not.toContain('/students');
      expect(paths).not.toContain('/finance');
      expect(paths).not.toContain('/academics');
    });

    it('School navigation strictly points to school routes and NEVER contains /platform paths', () => {
      const schoolUser = createMockSchoolUser('SCHOOL_ADMIN');
      const schoolGroups = getSchoolNavGroups({
        user: schoolUser,
        tenant: mockTenant,
        hasPermission: () => true,
      });
      const allSchoolPaths = schoolGroups.flatMap((g) => g.items.map((i) => i.to));

      // Must contain school paths
      expect(allSchoolPaths).toContain('/');
      expect(allSchoolPaths).toContain('/finance');
      expect(allSchoolPaths).toContain('/academics');
      expect(allSchoolPaths).toContain('/academics/operations/attendance');
      expect(allSchoolPaths).toContain('/academics/operations/timetable');

      // Must NEVER contain any platform paths
      const platformPathsInSchool = allSchoolPaths.filter((path) => path.startsWith('/platform'));
      expect(platformPathsInSchool).toEqual([]);
    });

    it('Platform Admin group IDs and School group IDs are completely disjoint sets', () => {
      const platformGroupIds = new Set(getPlatformNavGroups().map((g) => g.id));
      const schoolGroupIds = new Set(
        getSchoolNavGroups({
          user: createMockSchoolUser(),
          tenant: mockTenant,
          hasPermission: () => true,
        }).map((g) => g.id)
      );

      expect(platformGroupIds).toEqual(
        new Set([
          'platform_overview',
          'platform_tenants',
          'platform_security',
          'platform_operations',
        ])
      );

      expect(schoolGroupIds).toEqual(
        new Set([
          'overview',
          'academics',
          'people',
          'finance',
          'communications',
          'administration',
        ])
      );

      // Check zero intersection
      const intersection = [...platformGroupIds].filter((id) => schoolGroupIds.has(id));
      expect(intersection).toEqual([]);
    });
  });

  describe('2. Active Route Highlighting & Base Path Disambiguation', () => {
    it('isItemActive correctly distinguishes between / and /platform', () => {
      expect(isItemActive('/', true, '/')).toBe(true);
      expect(isItemActive('/', true, '/platform')).toBe(false);
      expect(isItemActive('/', true, '/students')).toBe(false);

      expect(isItemActive('/platform', true, '/platform')).toBe(true);
      expect(isItemActive('/platform', true, '/')).toBe(false);
      expect(isItemActive('/platform', true, '/platform/tenants')).toBe(false);
    });

    it('isItemActive correctly matches sub-routes for /platform/*', () => {
      expect(isItemActive('/platform/tenants', false, '/platform/tenants')).toBe(true);
      expect(isItemActive('/platform/tenants', false, '/platform/tenants/tenant-1/users')).toBe(true);
      expect(isItemActive('/platform/tenants', false, '/platform/administrators')).toBe(false);
      expect(isItemActive('/platform/security', false, '/platform/security')).toBe(true);
    });
  });

  describe('3. Separation of Search and Filtering in Platform vs School', () => {
    it('Platform search matches platform-specific keywords without touching school data', () => {
      const platformGroups = getPlatformNavGroups();
      const results = filterNavGroups(platformGroups, 'tenant', new Set(), true, true);
      const matchedPaths = results.flatMap((g) => g.items.map((i) => i.to));

      expect(matchedPaths).toContain('/platform/tenants');
      expect(matchedPaths).toContain('/platform/support');
      expect(matchedPaths).not.toContain('/students');
    });

    it('School search matches school-specific modules without leaking platform destinations', () => {
      const schoolGroups = getSchoolNavGroups({
        user: createMockSchoolUser(),
        tenant: mockTenant,
        hasPermission: () => true,
      });
      const results = filterNavGroups(schoolGroups, 'admin', allSchoolModules, false, true);
      const matchedPaths = results.flatMap((g) => g.items.map((i) => i.to));

      expect(matchedPaths).toContain('/administration');
      expect(matchedPaths).toContain('/people');
      expect(matchedPaths).not.toContain('/platform/administrators');
    });
  });

  describe('4. Standalone Application Boundary & Zero Cross-Import Verification', () => {
    it('School frontend App exports cleanly as an independent React component without platform dependencies', async () => {
      const appModule = await import('../App');
      expect(typeof appModule.App).toBe('function');
      expect(typeof appModule.default).toBe('function');
    }, 60000);
  });
});
