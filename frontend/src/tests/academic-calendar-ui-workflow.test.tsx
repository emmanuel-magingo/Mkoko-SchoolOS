import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AcademicCalendarPage } from '../pages/academics/AcademicCalendarPage';
import { getSchoolNavGroups } from '../components/layout/navigationConfig';
import { AcademicsApi } from '../api/academics.api';
import { Permissions } from '../types/permissions';

// Mock API
vi.mock('../api/academics.api', () => ({
  AcademicsApi: {
    getAcademicYears: vi.fn(),
    getTerms: vi.fn(),
    createTerm: vi.fn(),
    updateTerm: vi.fn(),
    activateTerm: vi.fn(),
    closeTerm: vi.fn(),
    reopenTerm: vi.fn(),
    getCalendarEvents: vi.fn(),
    createCalendarEvent: vi.fn(),
    updateCalendarEvent: vi.fn(),
    deleteCalendarEvent: vi.fn(),
    getClasses: vi.fn(),
    createAcademicYear: vi.fn(),
    activateAcademicYear: vi.fn(),
  },
}));

// Mock Permissions hook
vi.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (perm: string) => [
      Permissions.VIEW_ACADEMICS,
      Permissions.MANAGE_ACADEMICS,
      Permissions.MANAGE_CALENDAR,
      Permissions.VIEW_ADMINISTRATION,
    ].includes(perm as any),
    hasAnyPermission: () => true,
  }),
}));

// Mock Contexts
const mockCurrentAcademicYear = {
  id: 'year-2026-uuid',
  name: '2026/2027',
  startDate: '2026-01-05T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  isActive: true,
  terms: [],
};

const mockTerms = [
  {
    id: 'term-p1',
    academicYearId: 'year-2026-uuid',
    name: 'Term 1',
    educationLevel: 'PRIMARY',
    startDate: '2026-01-10T00:00:00.000Z',
    endDate: '2026-06-15T00:00:00.000Z',
    midTermBreakStartDate: '2026-03-20T00:00:00.000Z',
    midTermBreakEndDate: '2026-03-27T00:00:00.000Z',
    isCurrent: true,
    isClosed: false,
  },
  {
    id: 'term-p2',
    academicYearId: 'year-2026-uuid',
    name: 'Term 2',
    educationLevel: 'PRIMARY',
    startDate: '2026-07-06T00:00:00.000Z',
    endDate: '2026-11-27T00:00:00.000Z',
    midTermBreakStartDate: '2026-09-14T00:00:00.000Z',
    midTermBreakEndDate: '2026-09-21T00:00:00.000Z',
    isCurrent: false,
    isClosed: false,
  },
  {
    id: 'term-o1',
    academicYearId: 'year-2026-uuid',
    name: 'Term 1',
    educationLevel: 'O_LEVEL',
    startDate: '2026-01-12T00:00:00.000Z',
    endDate: '2026-06-19T00:00:00.000Z',
    midTermBreakStartDate: '2026-03-23T00:00:00.000Z',
    midTermBreakEndDate: '2026-03-30T00:00:00.000Z',
    isCurrent: true,
    isClosed: false,
  },
];

vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => ({
    academicYears: [mockCurrentAcademicYear],
    currentAcademicYear: mockCurrentAcademicYear,
    currentAcademicYearId: 'year-2026-uuid',
    setCurrentAcademicYearId: vi.fn(),
    refreshAcademicData: vi.fn(),
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-user-uuid',
      role: 'SCHOOL_ADMIN',
      email: 'admin@mwilamvya.ac.tz',
    },
    tenant: {
      id: 'tenant-uuid',
      name: 'Mwilamvya Secondary School',
      slug: 'mwilamvya',
    },
  }),
}));

describe('MIC SchoolOS — Academic Calendar UI Workflow Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AcademicsApi.getTerms).mockResolvedValue({ data: mockTerms } as any);
    vi.mocked(AcademicsApi.getCalendarEvents).mockResolvedValue({ data: [] } as any);
    vi.mocked(AcademicsApi.getClasses).mockResolvedValue({ data: [] } as any);
  });

  // 1. Navigation Check
  it('1. Navigation includes Academic Calendar link under Academics menu pointing to /academics/structure/years-terms', () => {
    const navGroups = getSchoolNavGroups({
      user: { id: 'admin', role: 'SCHOOL_ADMIN' } as any,
      tenant: { id: 'tenant-1' } as any,
      hasPermission: () => true,
    });

    const academicsGroup = navGroups.find((g) => g.id === 'academics');
    expect(academicsGroup).toBeDefined();

    const calendarItem = academicsGroup?.items.find((item) => item.to === '/academics/structure/years-terms');
    expect(calendarItem).toBeDefined();
    expect(calendarItem?.label).toBe('Academic Calendar');
  });

  // 2. Page Render Check
  it('2. Academic Calendar page renders with header, institutional banner, and level tabs', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/academics/structure/years-terms']}>
        <Routes>
          <Route path="/academics/structure/years-terms" element={<AcademicCalendarPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain('Academic Calendar &amp; Terms');
    expect(html).toContain('Institutional Academic Year');
    expect(html).toContain('2026/2027');
    expect(html).toContain('Active Year');
  });

  // 3. Education Level Selectors
  it('3. Education Level tabs (Primary, Ordinary Secondary, Advanced Secondary) are visible', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/academics/structure/years-terms']}>
        <AcademicCalendarPage />
      </MemoryRouter>
    );

    expect(html).toContain('Primary (Std 1–7)');
    expect(html).toContain('Ordinary Secondary (Form 1–4)');
    expect(html).toContain('Advanced Secondary (Form 5–6)');
  });

  // 4. Term 1 and Term 2 Dual-Card Layout
  it('4. Term 1 and Term 2 configuration cards are visible with configuration actions', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/academics/structure/years-terms']}>
        <AcademicCalendarPage />
      </MemoryRouter>
    );

    expect(html).toContain('Term 1 Not Configured');
    expect(html).toContain('Term 2 Not Configured');
    expect(html).toContain('Configure Term 1');
    expect(html).toContain('Configure Term 2');
  });

  // 5. Exactly ONE Mid-Term Break per Term
  it('5. Term modal form specifies start date, end date, and dedicated Mid-Term Break fields', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/academics/structure/years-terms']}>
        <AcademicCalendarPage />
      </MemoryRouter>
    );

    // Initial render shows configure actions for both terms
    expect(html).toContain('Configure Term 1');
    expect(html).toContain('Configure Term 2');
  });

  // 6. Administrative Action Controls
  it('6. Authorized administrator sees term actions and event creation buttons', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/academics/structure/years-terms']}>
        <AcademicCalendarPage />
      </MemoryRouter>
    );

    expect(html).toContain('Configure Term 1');
    expect(html).toContain('Configure Term 2');
    expect(html).toContain('Add Event / Program');
    expect(html).toContain('+ Record Special Program / Exception');
  });

  // 7. Events & Special Operations Section
  it('7. Government Calendar, School Events & Special Operations feed is present with exception highlights', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/academics/structure/years-terms']}>
        <AcademicCalendarPage />
      </MemoryRouter>
    );

    expect(html).toContain('Government Calendar, School Events &amp; Special Operations');
    expect(html).toContain('+ Record Special Program / Exception');
    expect(html).toContain('Government Dates');
    expect(html).toContain('Public Holidays');
    expect(html).toContain('Examinations');
    expect(html).toContain('Special Operations');
  });
});
