import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LessonExecutionPage } from '../pages/academics/LessonExecutionPage';
import { OfficialLessonLogbook } from '../components/academics/lessons/OfficialLessonLogbook';
import { DutyRosterGuard } from '../components/timetable/DutyRosterGuard';
import { getSchoolNavGroups, filterNavGroups } from '../components/layout/navigationConfig';
import { Permissions } from '../types/permissions';
import { User, Tenant } from '../types';

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

const mockTenant: Tenant = {
  id: 'tenant-101',
  name: 'Mwilamvya Secondary School',
  code: 'MSS-001',
  slug: 'mwilamvya-secondary',
  status: 'ACTIVE',
};

describe('Teacher on Duty Restrictions & Lessons PDF/Prepare Removal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAcademicContext.mockReturnValue({
      activeTermId: 'term-1',
      activeTerm: { id: 'term-1', name: 'Term 1' },
      activeAcademicYearId: 'year-2026',
      activeAcademicYear: { id: 'year-2026', name: '2026/2027' },
      refreshKey: 0,
    });
  });

  describe('Part A: Lessons Module — Prepare Button & PDF Removal', () => {
    it('ensures the Prepare button is absent from LessonExecutionPage', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'teacher-1',
          role: 'TEACHER',
          firstName: 'John',
          lastName: 'Mrema',
          tenantId: 'tenant-101',
        },
        tenant: mockTenant,
      });
      mockUsePermissions.mockReturnValue({
        hasPermission: () => true,
      });

      const html = renderToString(
        <MemoryRouter>
          <LessonExecutionPage />
        </MemoryRouter>
      );

      // Verify "Prepare" button and action IDs are absent
      expect(html).not.toContain('btn-open-lesson-context');
      expect(html).not.toContain('>Prepare<');
      expect(html).not.toContain('<span>Prepare</span>');
    });

    it('ensures print controls and @media print CSS are absent from OfficialLessonLogbook', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'teacher-1',
          role: 'TEACHER',
          firstName: 'John',
          lastName: 'Mrema',
          tenantId: 'tenant-101',
        },
        tenant: mockTenant,
      });

      const html = renderToString(
        <MemoryRouter>
          <OfficialLessonLogbook isOpen={true} />
        </MemoryRouter>
      );

      expect(html).not.toContain('btn-print-lesson-logbook');
      expect(html).not.toContain('Print Official Logbook');
      expect(html).not.toContain('@media print');
      expect(html).not.toContain('size: landscape');
    });
  });

  describe('Part B: Teacher on Duty (TOD) Weekly Assignment Navigation & Guard', () => {
    const allModules = new Set(['academics', 'timetable', 'attendance', 'finance', 'hr', 'communications', 'administration', 'overview']);

    it('hides TOD navigation entry for an unassigned teacher', () => {
      const unassignedTeacher: User = {
        id: 'teacher-unassigned',
        email: 'unassigned@school.test',
        firstName: 'Unassigned',
        lastName: 'Teacher',
        role: 'TEACHER',
        tenantId: 'tenant-101',
        isTeacherOnDuty: false,
      };

      const hasPermission = (p: string) => {
        // Unassigned teacher does not have VIEW_DUTY_ROSTER or MANAGE_DUTY_ROSTER
        return [
          Permissions.VIEW_ACADEMICS,
          Permissions.VIEW_TIMETABLE,
          Permissions.RECORD_LESSON_LOG,
          Permissions.VIEW_LESSON_LOGS,
        ].includes(p as any);
      };

      const rawGroups = getSchoolNavGroups({ user: unassignedTeacher, tenant: mockTenant, hasPermission: hasPermission as any });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));

      expect(visiblePaths).not.toContain('/academics/operations/duty-roster');
    });

    it('shows TOD navigation entry for a teacher assigned as Teacher on Duty for the current week', () => {
      const assignedTeacher: User = {
        id: 'teacher-assigned',
        email: 'assigned@school.test',
        firstName: 'Assigned',
        lastName: 'Teacher',
        role: 'TEACHER',
        tenantId: 'tenant-101',
        isTeacherOnDuty: true,
      };

      const hasPermission = (p: string) => {
        return [
          Permissions.VIEW_ACADEMICS,
          Permissions.VIEW_TIMETABLE,
          Permissions.VIEW_DUTY_ROSTER,
          Permissions.RECORD_LESSON_LOG,
          Permissions.VIEW_LESSON_LOGS,
        ].includes(p as any);
      };

      const rawGroups = getSchoolNavGroups({ user: assignedTeacher, tenant: mockTenant, hasPermission: hasPermission as any });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));

      expect(visiblePaths).toContain('/academics/operations/duty-roster');
    });

    it('shows TOD navigation entry for academic leadership roles regardless of assignment', () => {
      const academicMaster: User = {
        id: 'acad-master-1',
        email: 'acad@school.test',
        firstName: 'Senior',
        lastName: 'Academic',
        role: 'SENIOR_ACADEMIC_MASTER',
        tenantId: 'tenant-101',
      };

      const hasPermission = (p: string) => {
        return [
          Permissions.VIEW_ACADEMICS,
          Permissions.MANAGE_ACADEMICS,
          Permissions.VIEW_TIMETABLE,
          Permissions.MANAGE_TIMETABLE,
          Permissions.VIEW_DUTY_ROSTER,
          Permissions.MANAGE_DUTY_ROSTER,
        ].includes(p as any);
      };

      const rawGroups = getSchoolNavGroups({ user: academicMaster, tenant: mockTenant, hasPermission: hasPermission as any });
      const visibleGroups = filterNavGroups(rawGroups, '', allModules, false, true);
      const visiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.to));

      expect(visiblePaths).toContain('/academics/operations/duty-roster');
    });

    it('DutyRosterGuard redirects unassigned teacher to /academics', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'teacher-unassigned',
          role: 'TEACHER',
          isTeacherOnDuty: false,
          tenantId: 'tenant-101',
        },
      });
      mockUsePermissions.mockReturnValue({
        hasPermission: () => false,
      });

      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/operations/duty-roster']}>
          <Routes>
            <Route
              path="/academics/operations/duty-roster"
              element={
                <DutyRosterGuard>
                  <div data-testid="duty-roster-content">TOD Page Content</div>
                </DutyRosterGuard>
              }
            />
            <Route path="/academics" element={<div data-testid="academics-home">Academics Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Should not render the guarded TOD page content
      expect(html).not.toContain('TOD Page Content');
    });

    it('DutyRosterGuard allows access to assigned teacher (isTeacherOnDuty: true)', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'teacher-assigned',
          role: 'TEACHER',
          isTeacherOnDuty: true,
          tenantId: 'tenant-101',
        },
      });
      mockUsePermissions.mockReturnValue({
        hasPermission: (p: string) => p === Permissions.VIEW_DUTY_ROSTER,
      });

      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/operations/duty-roster']}>
          <Routes>
            <Route
              path="/academics/operations/duty-roster"
              element={
                <DutyRosterGuard>
                  <div data-testid="duty-roster-content">TOD Page Content</div>
                </DutyRosterGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Renders the guarded content
      expect(html).toContain('TOD Page Content');
    });
  });
});

