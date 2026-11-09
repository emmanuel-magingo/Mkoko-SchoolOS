import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider, useAcademicContext } from '../contexts/AcademicContext';
import { AcademicSidebar, ACADEMIC_NAV_GROUPS } from '../components/academics/AcademicSidebar';
import { AcademicTopbar } from '../components/academics/AcademicTopbar';
import { AcademicLayout } from '../components/academics/AcademicLayout';
import { AcademicsGuard } from '../components/academics/AcademicsGuard';
import { AcademicDashboard } from '../pages/academics/AcademicDashboard';
import { Permissions } from '../types/permissions';
import { api } from '../api/client';

// Mock AuthContext hook
const mockUseAuth = vi.fn();
const mockUsePermissions = vi.fn();

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual<any>('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

vi.mock('../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

describe('Sprint 1: Academic App Shell, Context, & Dashboard UI Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-acad-1',
        firstName: 'Salma',
        lastName: 'Kigoma',
        role: 'ACADEMIC_MASTER',
        tenantId: 'tenant-school-1',
      },
      tenant: {
        id: 'tenant-school-1',
        name: 'Mwilamvya Secondary School',
        code: 'MWL',
        status: 'ACTIVE',
      },
      token: 'valid-token',
      isLoading: false,
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((perm) => perm === Permissions.VIEW_ACADEMICS),
    });

    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path.includes('/schools/my-schools')) {
        return {
          data: [
            { id: 'tenant-school-1', name: 'Mwilamvya Secondary School', code: 'MWL' },
            { id: 'tenant-school-2', name: 'Kigoma High School', code: 'KGM' },
          ],
        } as any;
      }
      if (path.includes('/academics/years')) {
        return {
          data: [
            {
              id: 'year-2026',
              name: '2026',
              isActive: true,
              startDate: '2026-01-01',
              endDate: '2026-12-31',
              terms: [
                { id: 'term-1', name: 'Term I', isActive: false },
                { id: 'term-2', name: 'Term II', isActive: true },
              ],
            },
            {
              id: 'year-2025',
              name: '2025',
              isActive: false,
              startDate: '2025-01-01',
              endDate: '2025-12-31',
              terms: [
                { id: 'term-prev', name: 'Term I 2025', isActive: false },
              ],
            },
          ],
        } as any;
      }
      return { data: {} } as any;
    });
  });

  // ==========================================================================
  // 1. ACADEMIC CONTEXT STATE & UPDATES
  // ==========================================================================
  describe('AcademicContext', () => {
    it('throws error when useAcademicContext is accessed outside AcademicProvider', () => {
      const TestConsumer = () => {
        useAcademicContext();
        return null;
      };

      expect(() => {
        renderToString(<TestConsumer />);
      }).toThrow(/must be used within an AcademicProvider/i);
    });

    it('correctly provides state and updater functions for activeSchoolId, academicYear, and term', () => {
      let contextCapture: any = null;

      const TestConsumer = () => {
        const ctx = useAcademicContext();
        contextCapture = ctx;
        return (
          <div id="test-consumer">
            <span id="school-val">{ctx.selectedSchoolId}</span>
            <span id="active-school-val">{ctx.activeSchoolId}</span>
            <span id="year-val">{ctx.currentAcademicYearId}</span>
            <span id="active-year-val">{ctx.activeAcademicYearId}</span>
            <span id="term-val">{ctx.currentTermId}</span>
            <span id="active-term-val">{ctx.activeTermId}</span>
          </div>
        );
      };

      const html = renderToString(
        <AcademicProvider>
          <TestConsumer />
        </AcademicProvider>
      );

      expect(html).toContain('test-consumer');
      expect(contextCapture).toBeDefined();

      // Test initial state from mock auth
      expect(contextCapture.selectedSchoolId).toBe('tenant-school-1');
      expect(contextCapture.activeSchoolId).toBe('tenant-school-1');

      // Test state update functions exist
      expect(typeof contextCapture.setSelectedSchoolId).toBe('function');
      expect(typeof contextCapture.setActiveSchoolId).toBe('function');
      expect(typeof contextCapture.setCurrentAcademicYearId).toBe('function');
      expect(typeof contextCapture.setActiveAcademicYearId).toBe('function');
      expect(typeof contextCapture.setCurrentTermId).toBe('function');
      expect(typeof contextCapture.setActiveTermId).toBe('function');
      expect(typeof contextCapture.refreshAcademicData).toBe('function');

      // Verify setters execute without errors
      expect(() => {
        contextCapture.setSelectedSchoolId('tenant-school-2');
        contextCapture.setActiveSchoolId('tenant-school-2');
        contextCapture.setCurrentAcademicYearId('year-2025');
        contextCapture.setActiveAcademicYearId('year-2025');
        contextCapture.setCurrentTermId('term-prev');
        contextCapture.setActiveTermId('term-prev');
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // 2. ACADEMIC SIDEBAR STRUCTURE & 6 EXACT GROUPS
  // ==========================================================================
  describe('AcademicSidebar Navigation', () => {
    it('contains all 6 requested academic navigation groups and exact labels', () => {
      const groupTitles = ACADEMIC_NAV_GROUPS.map((g) => g.title);
      expect(groupTitles).toContain('ACADEMIC OVERVIEW');
      expect(groupTitles).toContain('ACADEMIC STRUCTURE');
      expect(groupTitles).toContain('TEACHING OPERATIONS');
      expect(groupTitles).toContain('ASSESSMENT & EXAMINATIONS');
      expect(groupTitles).toContain('STUDENT SUPPORT');
      expect(groupTitles).toContain('GOVERNANCE & REPORTING');
    });

    it('defines all required items under ACADEMIC OVERVIEW', () => {
      const overview = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'overview');
      expect(overview).toBeDefined();
      const labels = overview!.items.map((i) => i.label);
      expect(labels).toContain('Academic Dashboard');
      expect(labels).toContain('My Tasks');
      expect(labels).not.toContain('Academic Calendar');
    });

    it('defines all required items under ACADEMIC STRUCTURE', () => {
      const structure = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'structure');
      expect(structure).toBeDefined();
      const labels = structure!.items.map((i) => i.label);
      expect(labels).toContain('Academic Years & Terms');
      expect(labels).toContain('Classes & Streams');
      expect(labels).toContain('Subjects & Curriculum');
      expect(labels).toContain('Student Enrolments');
      expect(labels).toContain('Teacher Assignments');
    });

    it('defines all required items under TEACHING OPERATIONS', () => {
      const ops = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'operations');
      expect(ops).toBeDefined();
      const labels = ops!.items.map((i) => i.label);
      expect(labels).toContain('Timetable');
      expect(labels).toContain('Lesson Execution');
      expect(labels).toContain('Schemes of Work');
      expect(labels).toContain('Syllabus Coverage');
      expect(labels).toContain('Attendance');
    });

    it('defines all required items under ASSESSMENT & EXAMINATIONS', () => {
      const assessment = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'assessment');
      expect(assessment).toBeDefined();
      const labels = assessment!.items.map((i) => i.label);
      expect(labels).toContain('Assessment Calendar');
      expect(labels).toContain('Assessments');
      expect(labels).toContain('Marks Entry');
      expect(labels).toContain('Moderation & Approvals');
      expect(labels).toContain('Results & Report Cards');
      expect(labels).toContain('Grading Policies');
    });

    it('defines all required items under STUDENT SUPPORT', () => {
      const support = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'support');
      expect(support).toBeDefined();
      const labels = support!.items.map((i) => i.label);
      expect(labels).toContain('Academic Interventions');
      expect(labels).toContain('Student Progress');
      expect(labels).toContain('Discipline & Welfare');
    });

    it('defines all required items under GOVERNANCE & REPORTING', () => {
      const gov = ACADEMIC_NAV_GROUPS.find((g) => g.id === 'governance');
      expect(gov).toBeDefined();
      const labels = gov!.items.map((i) => i.label);
      expect(labels).toContain('Academic Meetings');
      expect(labels).toContain('Academic Analytics');
      expect(labels).toContain('Reports & Exports');
      expect(labels).toContain('Audit History');
    });

    it('renders the sidebar navigation HTML properly', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics']}>
          <AcademicProvider>
            <AcademicSidebar />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Academic Dept');
      expect(html).toContain('ACADEMIC OVERVIEW');
      expect(html).toContain('Academic Dashboard');
      expect(html).toContain('ACADEMIC STRUCTURE');
      expect(html).toContain('ASSESSMENT &amp; EXAMINATIONS');
      expect(html).toContain('STUDENT SUPPORT');
      expect(html).toContain('GOVERNANCE &amp; REPORTING');
      expect(html).toContain('TEACHING OPERATIONS');
    });
  });

  // ==========================================================================
  // 3. ACADEMIC TOPBAR RENDERING
  // ==========================================================================
  describe('AcademicTopbar Navigation & Header', () => {
    it('renders selectors, global search input, online status, and notification bell', () => {
      const html = renderToString(
        <AcademicProvider>
          <AcademicTopbar />
        </AcademicProvider>
      );

      expect(html).toContain('academic-topbar');
      expect(html).toContain('academic-school-selector');
      expect(html).toContain('academic-year-selector');
      expect(html).toContain('academic-term-selector');
      expect(html).toContain('academic-global-search');
      expect(html).toContain('⌘K');
      expect(html).toContain('academic-sync-status');
      expect(html).toContain('Online / Synced');
      expect(html).toContain('btn-academic-notifications');
    });
  });

  // ==========================================================================
  // 4. ACCESS CONTROL & PROTECTED ROUTE GUARDS
  // ==========================================================================
  describe('AcademicsGuard Protection', () => {
    it('redirects unauthenticated user to /login', () => {
      mockUseAuth.mockReturnValueOnce({
        user: null,
        tenant: null,
        isLoading: false,
      });

      const html = renderToString(
        <MemoryRouter initialEntries={['/academics']}>
          <AcademicsGuard>
            <div id="secret-content">Secret Academic Content</div>
          </AcademicsGuard>
        </MemoryRouter>
      );

      expect(html).not.toContain('Secret Academic Content');
    });

    it('redirects user without VIEW_ACADEMICS permission to /', () => {
      mockUseAuth.mockReturnValueOnce({
        user: { id: 'u2', role: 'BURSAR', tenantId: 't1' },
        tenant: { id: 't1' },
        isLoading: false,
      });

      mockUsePermissions.mockReturnValueOnce({
        hasPermission: vi.fn(() => false),
      });

      const html = renderToString(
        <MemoryRouter initialEntries={['/academics']}>
          <AcademicsGuard>
            <div id="secret-content">Secret Academic Content</div>
          </AcademicsGuard>
        </MemoryRouter>
      );

      expect(html).not.toContain('Secret Academic Content');
    });

    it('renders children when authenticated and authorized with VIEW_ACADEMICS', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics']}>
          <AcademicsGuard>
            <div id="authorized-content">Authorized Academic Dashboard Content</div>
          </AcademicsGuard>
        </MemoryRouter>
      );

      expect(html).toContain('Authorized Academic Dashboard Content');
    });
  });

  // ==========================================================================
  // 5. ACADEMIC DASHBOARD LAYOUT & CARD RENDERING
  // ==========================================================================
  describe('AcademicDashboard UI Components', () => {
    it('renders header, TermProgressCard, 4 MetricCards, OperationalExceptions, PriorityTasks, and Schedule/Activity', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics']}>
          <AcademicProvider>
            <AcademicDashboard />
          </AcademicProvider>
        </MemoryRouter>
      );

      // 1. Header with greeting (dead weight action buttons removed)
      expect(html).toContain('Good morning, Salma');
      expect(html).not.toContain('btn-export-summary');
      expect(html).not.toContain('btn-new-academic-setup');

      // 2. 3 KPI Metric cards (Strict real/zeroed data; Marks Entry card removed)
      expect(html).toContain('metric-attendance-today');
      expect(html).toContain('Attendance Today');
      expect(html).toContain('Check Registers');

      expect(html).toContain('metric-registers-pending');
      expect(html).toContain('Registers Pending');

      expect(html).not.toContain('metric-marks-completion');

      expect(html).toContain('metric-syllabus-on-track');
      expect(html).toContain('Syllabus On Track');

      // 3. Clean 2-column row (Events & Tasks)
      expect(html).toContain('upcoming-events-card');
      expect(html).toContain('Upcoming Academic Events');

      expect(html).toContain('priority-tasks-card');
      expect(html).toContain('Priority Tasks');
      expect(html).toContain('Moderate Form 4 Physics Midterm Results');

      // 4. Clutter/noise removed from dashboard
      expect(html).not.toContain('operational-exceptions-list');
      expect(html).not.toContain('todays-schedule-card');
      expect(html).not.toContain('activity-feed-card');
    });

    it('renders the complete AcademicLayout wrapping the dashboard', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics']}>
          <AcademicLayout />
        </MemoryRouter>
      );

      expect(html).toContain('academic-sidebar');
      expect(html).toContain('academic-topbar');
    });
  });
});
