import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { AcademicLayout } from '../components/academics/AcademicLayout';
import { ReportCardManager } from '../components/academics/assessments/ReportCardManager';
import { StudentReportCard } from '../components/academics/assessments/StudentReportCard';
import { AcademicAnalyticsDashboard } from '../components/academics/governance/AcademicAnalyticsDashboard';
import { ReportCardsPage } from '../pages/academics/ReportCardsPage';
import { AcademicAnalyticsPage } from '../pages/academics/AcademicAnalyticsPage';
import { ReportCard } from '../types/academics.types';
import { Permissions } from '../types/permissions';
import { api } from '../api/client';

// Mock Auth & Permissions hooks
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

describe('Sprint 6: Results, Report Cards & Analytics Test Suite', () => {
  const mockReportCards: ReportCard[] = [
    {
      id: 'rc-1',
      studentId: 'std-1',
      academicYearId: 'year-2026',
      termId: 'term-1',
      classId: 'cls-1',
      totalMarks: 615,
      averageScore: 87.8,
      totalPoints: 7,
      division: 'Division I',
      divisionPoints: 7,
      rankInClass: 1,
      totalStudents: 42,
      totalStudentsInClass: 42,
      attendanceDaysPresent: 68,
      attendanceDaysAbsent: 2,
      attendanceSummary: {
        daysPresent: 68,
        daysAbsent: 2,
        totalDays: 70,
        attendanceRate: 97,
      },
      classTeacherRemarks: 'Outstanding discipline and exceptional academic consistency across all disciplines.',
      headmasterRemarks: 'Exemplary scholar. Awarded top honors for Term I.',
      status: 'PUBLISHED',
      publishedAt: '2026-06-30T10:00:00Z',
      student: {
        id: 'std-1',
        admissionNumber: 'SCH/2026/001',
        firstName: 'Baraka',
        lastName: 'Nyerere',
      },
      class: {
        id: 'cls-1',
        name: 'Form 4',
        stream: 'Science A',
      },
      term: {
        id: 'term-1',
        name: 'Term I',
      },
      academicYear: {
        id: 'year-2026',
        name: '2026',
      },
      subjects: [
        {
          id: 'rcs-1',
          subjectName: 'Advanced Mathematics',
          subjectCode: 'BAM',
          caScore: 36,
          examScore: 54,
          finalScore: 90,
          grade: 'A',
          gradePoint: 1,
          remarks: 'Distinction',
        },
        {
          id: 'rcs-2',
          subjectName: 'Physics',
          subjectCode: 'PHY',
          caScore: 35,
          examScore: 51,
          finalScore: 86,
          grade: 'A',
          gradePoint: 1,
          remarks: 'Distinction',
        },
        {
          id: 'rcs-3',
          subjectName: 'Chemistry',
          subjectCode: 'CHE',
          caScore: 34,
          examScore: 52,
          finalScore: 86,
          grade: 'A',
          gradePoint: 1,
          remarks: 'Distinction',
        },
        {
          id: 'rcs-4',
          subjectName: 'English Language',
          subjectCode: 'ENG',
          caScore: 37,
          examScore: 51,
          finalScore: 88,
          grade: 'A',
          gradePoint: 1,
          remarks: 'Distinction',
        },
      ],
    },
    {
      id: 'rc-2',
      studentId: 'std-2',
      academicYearId: 'year-2026',
      termId: 'term-1',
      classId: 'cls-1',
      totalMarks: 450,
      averageScore: 64.3,
      totalPoints: 18,
      division: 'Division II',
      divisionPoints: 18,
      rankInClass: 8,
      totalStudents: 42,
      attendanceDaysPresent: 62,
      attendanceDaysAbsent: 8,
      attendanceSummary: {
        daysPresent: 62,
        daysAbsent: 8,
        totalDays: 70,
        attendanceRate: 88,
      },
      classTeacherRemarks: 'Good effort throughout the term with strong potential for further growth.',
      headmasterRemarks: 'Satisfactory performance. Continue working diligently.',
      status: 'APPROVED',
      student: {
        id: 'std-2',
        admissionNumber: 'SCH/2026/045',
        firstName: 'Zuwena',
        lastName: 'Mwinyi',
      },
      class: {
        id: 'cls-1',
        name: 'Form 4',
        stream: 'Science A',
      },
      subjects: [
        {
          id: 'rcs-5',
          subjectName: 'Advanced Mathematics',
          subjectCode: 'BAM',
          caScore: 28,
          examScore: 38,
          finalScore: 66,
          grade: 'C',
          gradePoint: 3,
          remarks: 'Credit',
        },
      ],
    },
    {
      id: 'rc-3',
      studentId: 'std-3',
      academicYearId: 'year-2026',
      termId: 'term-1',
      classId: 'cls-1',
      totalMarks: 320,
      averageScore: 45.7,
      totalPoints: 28,
      division: 'Division IV',
      divisionPoints: 28,
      rankInClass: 25,
      totalStudents: 42,
      attendanceDaysPresent: 55,
      attendanceDaysAbsent: 15,
      attendanceSummary: {
        daysPresent: 55,
        daysAbsent: 15,
        totalDays: 70,
        attendanceRate: 78,
      },
      classTeacherRemarks: 'Needs extra revision in science subjects.',
      headmasterRemarks: 'Academic intervention recommended.',
      status: 'DRAFT',
      student: {
        id: 'std-3',
        admissionNumber: 'SCH/2026/089',
        firstName: 'Juma',
        lastName: 'Khalfan',
      },
      class: {
        id: 'cls-1',
        name: 'Form 4',
        stream: 'Science A',
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-acad-master',
        firstName: 'Academic',
        lastName: 'Master',
        role: 'ACADEMIC_MASTER',
        tenantId: 'tenant-school-1',
      },
      tenant: {
        id: 'tenant-school-1',
        name: 'Mwilamvya Model Academy',
        code: 'MMA',
        status: 'ACTIVE',
      },
      token: 'valid-token',
      isLoading: false,
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((perm) =>
        [
          Permissions.VIEW_ACADEMICS,
          Permissions.MANAGE_ACADEMICS,
          Permissions.GENERATE_REPORT_CARDS,
          Permissions.PUBLISH_REPORT_CARDS,
          Permissions.UNPUBLISH_REPORT_CARDS,
        ].includes(perm)
      ),
    });

    // Mock API requests
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path.includes('/schools/my-schools')) {
        return {
          data: [{ id: 'tenant-school-1', name: 'Mwilamvya Model Academy', code: 'MMA' }],
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
                { id: 'term-1', name: 'Term I', isActive: true, academicYearId: 'year-2026', startDate: '2026-01-05', endDate: '2026-04-10' },
                { id: 'term-2', name: 'Term II', isActive: false, academicYearId: 'year-2026', startDate: '2026-05-01', endDate: '2026-08-20' },
              ],
            },
          ],
        } as any;
      }
      if (path.includes('/classes')) {
        return {
          data: [
            { id: 'cls-1', name: 'Form 4', stream: 'Science A' },
            { id: 'cls-2', name: 'Form 3', stream: 'Arts B' },
          ],
        } as any;
      }
      if (path.includes('/academics/report-cards')) {
        return {
          data: mockReportCards,
        } as any;
      }
      if (path.includes('/dashboard/academics')) {
        return {
          data: {
            summary: {
              totalStudents: 42,
              classCount: 2,
              completedAssessments: 16,
              averagePerformance: 76.5,
            },
            performanceTrend: [
              { label: 'Mid-Term Exam', period: 'Term I', average: 74.2 },
              { label: 'Terminal Exam', period: 'Term I', average: 78.8 },
            ],
            gradeDistribution: [
              { grade: 'A', count: 18 },
              { grade: 'B', count: 14 },
              { grade: 'C', count: 6 },
              { grade: 'D', count: 3 },
              { grade: 'F', count: 1 },
            ],
            classPerformance: [
              { id: 'cls-1', name: 'Form 4', average: 81.2 },
              { id: 'cls-2', name: 'Form 3', average: 71.8 },
            ],
            subjectPerformance: [
              { id: 'sub-1', name: 'Mathematics', average: 82.5 },
              { id: 'sub-2', name: 'Physics', average: 79.0 },
              { id: 'sub-3', name: 'Chemistry', average: 75.3 },
            ],
          },
        } as any;
      }
      return { data: [] } as any;
    });

    vi.spyOn(api, 'post').mockImplementation(async (path: string) => {
      if (path.includes('/academics/report-cards/generate')) {
        return { data: { count: 3 } } as any;
      }
      if (path.includes('/academics/report-cards/publish')) {
        return { data: { count: 3 } } as any;
      }
      if (path.includes('/academics/report-cards/unpublish')) {
        return { data: { count: 3 } } as any;
      }
      return { data: {} } as any;
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return renderToString(
      <MemoryRouter>
        <AcademicProvider>{ui}</AcademicProvider>
      </MemoryRouter>
    );
  };

  describe('Part 1: StudentReportCard Component', () => {
    it('1. Renders school header, student info, admission number, and class rank', () => {
      const html = renderWithProviders(<StudentReportCard reportCard={mockReportCards[0]} />);

      expect(html).toContain('Mwilamvya Model Academy');
      expect(html).toContain('Baraka Nyerere');
      expect(html).toContain('SCH/2026/001');
      expect(html).toContain('Form 4');
      expect(html).toContain('(Science A)');
      expect(html).toContain('Position 1');
      expect(html).toContain('of 42');
    });

    it('2. Renders subject-by-subject assessment breakdown with CA, Exam, Grade, Points and Remarks', () => {
      const html = renderWithProviders(<StudentReportCard reportCard={mockReportCards[0]} />);

      expect(html).toContain('Advanced Mathematics');
      expect(html).toContain('BAM');
      expect(html).toContain('36'); // CA 40%
      expect(html).toContain('54'); // Exam 60%
      expect(html).toContain('90'); // Final 100%
      expect(html).toContain('Distinction');
      expect(html).toContain('Physics');
      expect(html).toContain('Chemistry');
    });

    it('3. Renders attendance metrics (days present, days absent, attendance rate)', () => {
      const html = renderWithProviders(<StudentReportCard reportCard={mockReportCards[0]} />);

      expect(html).toContain('Days Present');
      expect(html).toContain('68');
      expect(html).toContain('Days Absent');
      expect(html).toContain('2');
      expect(html).toContain('97%');
      expect(html).toContain('70 Days');
    });

    it('4. Renders national division aggregate points and average score', () => {
      const html = renderWithProviders(<StudentReportCard reportCard={mockReportCards[0]} />);

      expect(html).toContain('Division I');
      expect(html).toContain('87.8%');
      expect(html).toContain('Points / GPA');
      expect(html).toContain('615'); // Cumulative total marks
    });

    it('5. Renders teacher remarks and headmaster remarks with print actions', () => {
      const html = renderWithProviders(<StudentReportCard reportCard={mockReportCards[0]} />);

      expect(html).toContain('Class Teacher Remarks');
      expect(html).toContain('Outstanding discipline and exceptional academic consistency');
      expect(html).toContain('Head of School / Academic Master Remarks');
      expect(html).toContain('Exemplary scholar. Awarded top honors for Term I.');
      expect(html).toContain('Print');
      expect(html).toContain('Export to PDF');
    });
  });

  describe('Part 2: ReportCardManager Component', () => {
    it('6. Renders master view title, filters, and action buttons', () => {
      const html = renderWithProviders(<ReportCardManager />);

      expect(html).toContain('Results &amp; Report Card Manager');
      expect(html).toContain('Academic Year');
      expect(html).toContain('Academic Term');
      expect(html).toContain('Class / Stream');
      expect(html).toContain('Status Filter');
      expect(html).toContain('Generate Reports');
      expect(html).toContain('Student Report Cards');
    });

    it('7. Displays batch status badge and division statistics cards', () => {
      const html = renderWithProviders(<ReportCardManager />);

      expect(html).toContain('data-testid="batch-status-badge"');
      expect(html).toContain('Batch Status');
      expect(html).toContain('Class Average');
      expect(html).toContain('Div I &amp; II Achievers');
      expect(html).toContain('Division Breakdown');
    });

    it('8. Renders report card table columns and student entries', () => {
      const html = renderWithProviders(<ReportCardManager initialReportCards={mockReportCards} />);

      expect(html).toContain('Rank');
      expect(html).toContain('Student');
      expect(html).toContain('Admission No');
      expect(html).toContain('Class');
      expect(html).toContain('Average');
      expect(html).toContain('Division');
      expect(html).toContain('Points');
      expect(html).toContain('Attendance');
      expect(html).toContain('Status');
      expect(html).toContain('Action');
    });

    it('9. Supports batch statuses DRAFT, APPROVED, and PUBLISHED', () => {
      const draftCard: ReportCard = { ...mockReportCards[2], status: 'DRAFT' };
      const approvedCard: ReportCard = { ...mockReportCards[1], status: 'APPROVED' };
      const publishedCard: ReportCard = { ...mockReportCards[0], status: 'PUBLISHED' };

      const htmlDraft = renderWithProviders(<StudentReportCard reportCard={draftCard} />);
      const htmlApproved = renderWithProviders(<StudentReportCard reportCard={approvedCard} />);
      const htmlPublished = renderWithProviders(<StudentReportCard reportCard={publishedCard} />);

      expect(htmlDraft).toContain('DRAFT');
      expect(htmlApproved).toContain('APPROVED');
      expect(htmlPublished).toContain('PUBLISHED');
    });
  });

  describe('Part 3: AcademicAnalyticsDashboard Component', () => {
    it('10. Renders Head of School analytics header, refresh button, and filters', () => {
      const html = renderWithProviders(<AcademicAnalyticsDashboard />);

      expect(html).toContain('Academic Analytics &amp; Performance');
      expect(html).toContain('Head of School &amp; Academic Master Governance Dashboard');
      expect(html).toContain('Refresh Analytics');
      expect(html).toContain('Academic Year');
      expect(html).toContain('Academic Term');
      expect(html).toContain('Class Filter');
    });

    it('11. Renders high-level KPI cards (Evaluated Students, Mean Score, Pass Rate, Attendance)', () => {
      const html = renderWithProviders(<AcademicAnalyticsDashboard />);

      expect(html).toContain('Students Evaluated');
      expect(html).toContain('Mean Academic Score');
      expect(html).toContain('Pass Rate (Div I - IV)');
      expect(html).toContain('School Attendance Rate');
    });

    it('12. Renders Subject Performance Comparison across streams with benchmarks', () => {
      const html = renderWithProviders(<AcademicAnalyticsDashboard />);

      expect(html).toContain('Subject Performance Comparison');
      expect(html).toContain('Benchmark: 50%');
      expect(html).toContain('Distinction (&gt;=75%)');
      expect(html).toContain('Credit/Pass (50-74%)');
      expect(html).toContain('At Risk (&lt;50%)');
    });

    it('13. Renders Pass/Fail & Division distribution rates (Division I, II, III, IV, Division 0)', () => {
      const html = renderWithProviders(<AcademicAnalyticsDashboard />);

      expect(html).toContain('Pass/Fail &amp; Division Distribution');
      expect(html).toContain('Division I');
      expect(html).toContain('Division II');
      expect(html).toContain('Division III');
      expect(html).toContain('Division IV');
      expect(html).toContain('Division 0');
      expect(html).toContain('Cohort Qualification Ratio');
    });

    it('14. Renders Overall Attendance Trends and Chronic Absenteeism metrics', () => {
      const html = renderWithProviders(<AcademicAnalyticsDashboard />);

      expect(html).toContain('Overall Attendance Trends &amp; Compliance');
      expect(html).toContain('Total Days Present');
      expect(html).toContain('Total Days Absent');
      expect(html).toContain('Chronic Absenteeism');
    });
  });

  describe('Part 4: Pages & AcademicLayout Integration', () => {
    it('15. ReportCardsPage is wrapped in AcademicLayout and consumes AcademicContext', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/assessments/report-cards']}>
          <AcademicProvider>
            <AcademicLayout>
              <ReportCardsPage />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Results &amp; Report Card Manager');
      expect(html).toContain('Academic Dept'); // from AcademicSidebar
      expect(html).toContain('MIC SchoolOS');
      expect(html).toContain('Generate Reports');
    });

    it('16. AcademicAnalyticsPage is wrapped in AcademicLayout and consumes AcademicContext', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/governance/analytics']}>
          <AcademicProvider>
            <AcademicLayout>
              <AcademicAnalyticsPage />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Academic Analytics &amp; Performance');
      expect(html).toContain('Academic Dept');
      expect(html).toContain('MIC SchoolOS');
      expect(html).toContain('Subject Performance Comparison');
    });
  });
});
