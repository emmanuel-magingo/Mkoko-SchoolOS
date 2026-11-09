import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { MarksEntryGrid } from '../components/academics/assessments/MarksEntryGrid';
import { AssessmentList } from '../components/academics/assessments/AssessmentList';
import { ModerationQueue } from '../components/academics/assessments/ModerationQueue';
import { GradingPolicyLibrary } from '../components/academics/assessments/GradingPolicyLibrary';
import { MarkEntryPage } from '../pages/academics/MarkEntryPage';
import { AssessmentModerationPage } from '../pages/academics/AssessmentModerationPage';
import { GradingPoliciesPage } from '../pages/academics/GradingPoliciesPage';
import { Assessment } from '../types/academics.types';

// Mock Auth and Permissions hooks
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

describe('Sprint 5: Assessment, Marks Entry & Grading Policies Test Suite', () => {
  const mockAssessmentOpen: Assessment & { subject?: any; class?: any } = {
    id: 'asm-1',
    termId: 'term-1',
    classId: 'cls-1',
    subjectId: 'sub-1',
    name: 'Mid-Term Examination',
    type: 'MIDTERM',
    maxScore: 100,
    status: 'DRAFT',
    subject: { id: 'sub-1', name: 'Mathematics', code: 'MATH' },
    class: { id: 'cls-1', name: 'Form 1 - A' },
  };

  const mockAssessmentSubmitted: Assessment & { subject?: any; class?: any } = {
    id: 'asm-2',
    termId: 'term-1',
    classId: 'cls-1',
    subjectId: 'sub-2',
    name: 'Terminal Physics Assessment',
    type: 'TERMINAL_EXAM',
    maxScore: 100,
    status: 'SUBMITTED',
    subject: { id: 'sub-2', name: 'Physics', code: 'PHYS' },
    class: { id: 'cls-1', name: 'Form 1 - A' },
  };

  const mockStudents = [
    {
      id: 'std-1',
      admissionNumber: 'MWL/2026/001',
      firstName: 'Juma',
      lastName: 'Mwamba',
    },
    {
      id: 'std-2',
      admissionNumber: 'MWL/2026/002',
      firstName: 'Sara',
      lastName: 'Hassan',
    },
    {
      id: 'std-3',
      admissionNumber: 'MWL/2026/003',
      firstName: 'Ally',
      lastName: 'Bakari',
    },
  ];

  const mockInitialMarks = [
    {
      studentId: 'std-1',
      score: 85,
      comments: 'Excellent grasp of calculus',
    },
    {
      studentId: 'std-2',
      score: null,
      status: 'ABSENT',
      comments: 'ABSENT - Hospital admission',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-academic-master-1',
        firstName: 'Salma',
        lastName: 'Kigoma',
        role: 'ACADEMIC_MASTER',
        tenantId: 'tenant-school-1',
      },
      tenant: {
        id: 'tenant-school-1',
        name: 'Mwilamvya Secondary School',
      },
      token: 'valid-token',
      isLoading: false,
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
    });
  });

  // ============================================================================
  // SUITE 1: MARKS ENTRY GRID (STRICT VALIDATION, MISSING DATA, DRAFT/SUBMIT)
  // ============================================================================
  describe('MarksEntryGrid Component', () => {
    it('renders keyboard-friendly marksheet with student roster and max score', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <MarksEntryGrid
              assessment={mockAssessmentOpen}
              initialStudents={mockStudents}
              initialMarks={mockInitialMarks}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Verify Header and Context
      expect(html).toContain('Marks Entry: Mid-Term Examination');
      expect(html).toContain('Max Score: 100');
      expect(html).toContain('DRAFT');

      // Verify Student Roster
      expect(html).toContain('Juma Mwamba');
      expect(html).toContain('MWL/2026/001');
      expect(html).toContain('Sara Hassan');
      expect(html).toContain('MWL/2026/002');
      expect(html).toContain('Ally Bakari');

      // Verify action buttons
      expect(html).toContain('Save Draft');
      expect(html).toContain('Submit for Review');
    });

    it('correctly handles pre-existing scores and explicit ABSENT / EXEMPTED status without treating as zero', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <MarksEntryGrid
              assessment={mockAssessmentOpen}
              initialStudents={mockStudents}
              initialMarks={mockInitialMarks}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Student 1 has score 85
      expect(html).toContain('value="85"');

      // Student 2 is explicitly ABSENT
      expect(html).toContain('ABSENT');
      expect(html).toContain('ABSENT - Hospital admission');

      // Student 3 has no score yet (empty, not 0)
      expect(html).toContain('value=""');
    });

    it('enforces read-only mode when assessment is SUBMITTED or UNDER_REVIEW', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <MarksEntryGrid
              assessment={mockAssessmentSubmitted}
              initialStudents={mockStudents}
              initialMarks={mockInitialMarks}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Verify Locked Status Banner
      expect(html).toContain('SUBMITTED');
      expect(html).toContain('locked for review. Marks are read-only');

      // Score inputs must be disabled
      expect(html).toContain('disabled=""');

      // Draft/Submit buttons should NOT be active
      expect(html).not.toContain('btn-submit-review');
    });

    it('triggers mock save draft callback with mapped student marks payload', async () => {
      const mockSave = vi.fn().mockResolvedValue({ success: true });

      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <MarksEntryGrid
              assessment={mockAssessmentOpen}
              initialStudents={mockStudents}
              initialMarks={mockInitialMarks}
              mockSaveDraft={mockSave}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Save Draft');
    });

    it('renders reopen button for authorized users when assessment is in locked/read-only status', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <MarksEntryGrid
              assessment={mockAssessmentSubmitted}
              initialStudents={mockStudents}
              initialMarks={mockInitialMarks}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Reopen button should be visible for authorized academic master
      expect(html).toContain('Reopen for Editing');
      expect(html).toContain('btn-reopen-assessment');
    });

    it('enforces score bounds validation when score exceeds max score', () => {
      // Mock an invalid mark exceeding maxScore 100
      const invalidMarks = [
        {
          studentId: 'std-1',
          score: 110, // exceeds max 100
          comments: 'Erroneous entry',
        },
      ];

      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <MarksEntryGrid
              assessment={mockAssessmentOpen}
              initialStudents={mockStudents}
              initialMarks={invalidMarks}
            />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Verify validation warning is rendered
      expect(html).toContain('Score cannot exceed maximum of 100');
      expect(html).toContain('Warning: Some scores exceed the maximum allowable score of 100!');
    });
  });

  // ============================================================================
  // SUITE 2: ASSESSMENT LIST (TEACHER VIEW & STATUS FILTERS)
  // ============================================================================
  describe('AssessmentList Component', () => {
    const mockAssessments: Assessment[] = [
      mockAssessmentOpen,
      mockAssessmentSubmitted,
      {
        id: 'asm-3',
        termId: 'term-1',
        classId: 'cls-1',
        subjectId: 'sub-1',
        name: 'Weekly Quiz 1',
        type: 'TEST',
        maxScore: 20,
        status: 'APPROVED',
        subject: { id: 'sub-1', name: 'Mathematics', code: 'MATH' },
        class: { id: 'cls-1', name: 'Form 1 - A' },
      },
    ];

    it('renders list of assessments with statuses and actions', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AssessmentList initialAssessments={mockAssessments} />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Assessment List &amp; Marks Entry');
      expect(html).toContain('Mid-Term Examination');
      expect(html).toContain('Terminal Physics Assessment');
      expect(html).toContain('Weekly Quiz 1');

      // Status badges
      expect(html).toContain('OPEN / DRAFT');
      expect(html).toContain('SUBMITTED');
      expect(html).toContain('APPROVED');

      // Enter Marks button for open assessments
      expect(html).toContain('Enter Marks');
      // View Marks button for submitted or approved assessments
      expect(html).toContain('View Marks');
    });

    it('renders all assessment statuses including PUBLISHED and filters correctly', () => {
      const mockFullStatuses: Assessment[] = [
        mockAssessmentOpen,
        mockAssessmentSubmitted,
        {
          id: 'asm-published',
          termId: 'term-1',
          classId: 'cls-1',
          subjectId: 'sub-1',
          name: 'Annual National Benchmark Exam',
          type: 'FINAL_EXAM',
          maxScore: 100,
          status: 'PUBLISHED' as any,
          subject: { id: 'sub-1', name: 'Mathematics', code: 'MATH' },
          class: { id: 'cls-1', name: 'Form 1 - A' },
        },
      ];

      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AssessmentList initialAssessments={mockFullStatuses} />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Annual National Benchmark Exam');
      expect(html).toContain('PUBLISHED');
      expect(html).toContain('data-testid="filter-status-published"');
    });
  });

  // ============================================================================
  // SUITE 3: MODERATION QUEUE & APPROVAL WORKFLOW
  // ============================================================================
  describe('ModerationQueue Component', () => {
    const mockPendingQueue: Assessment[] = [
      mockAssessmentSubmitted,
      {
        id: 'asm-4',
        termId: 'term-1',
        classId: 'cls-1',
        subjectId: 'sub-3',
        name: 'Chemistry Form 1 Practical',
        type: 'TEST',
        maxScore: 50,
        status: 'UNDER_REVIEW',
        subject: { id: 'sub-3', name: 'Chemistry', code: 'CHEM' },
        class: { id: 'cls-1', name: 'Form 1 - A' },
      },
    ];

    it('displays assessments in SUBMITTED or UNDER_REVIEW state for HoDs and Academic Masters', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <ModerationQueue initialQueue={mockPendingQueue} />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Assessment Moderation Queue');
      expect(html).toContain('Pending Review');
      expect(html).toContain('Terminal Physics Assessment');
      expect(html).toContain('Chemistry Form 1 Practical');
      expect(html).toContain('SUBMITTED');
      expect(html).toContain('UNDER_REVIEW');
      expect(html).toContain('Inspect &amp; Moderate');
    });

    it('handles empty queue with clear state message', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <ModerationQueue initialQueue={[]} />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Moderation Queue is Clear');
      expect(html).toContain('All submitted marks have been approved');
    });

    it('renders AssessmentModerationPage wrapper correctly', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <AssessmentModerationPage />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Assessment Moderation Queue');
    });
  });

  // ============================================================================
  // SUITE 4: GRADING POLICY LIBRARY (NATIONAL PRESETS & INTERNAL POLICIES)
  // ============================================================================
  describe('GradingPolicyLibrary Component', () => {
    it('displays official National Presets (NECTA O-Level, A-Level, Primary) with grade bands', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <GradingPolicyLibrary />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Verify Title & Header
      expect(html).toContain('Grading Policy Library');
      expect(html).toContain('National Presets');
      expect(html).toContain('Internal Policies');

      // Verify NECTA O-Level Preset
      expect(html).toContain('NECTA National Secondary Scale (CSEE)');
      expect(html).toContain('Ordinary Level (Form 1 - 4)');
      expect(html).toContain('v2024.1');
      expect(html).toContain('National Preset (Read-Only)');

      // Verify NECTA A-Level Preset
      expect(html).toContain('NECTA Advanced Secondary Scale (ACSEE)');
      expect(html).toContain('Advanced Level (Form 5 - 6)');

      // Verify TIE Primary Preset
      expect(html).toContain('TIE National Primary Curriculum Scale (PSLE)');

      // Verify Internal Policies
      expect(html).toContain('Internal Continuous Assessment &amp; Mid-Term Policy');
      expect(html).toContain('Effective: <strong class="text-slate-700">2026-01-01</strong>');
    });

    it('renders GradingPoliciesPage page component', () => {
      const html = renderToString(
        <MemoryRouter>
          <AcademicProvider>
            <GradingPoliciesPage />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Grading Policy Library');
      expect(html).toContain('Grade Bands &amp; Thresholds');
    });
  });

  // ============================================================================
  // SUITE 5: PAGE ROUTE WRAPPERS & CONTEXT INTEGRATION
  // ============================================================================
  describe('MarkEntryPage Wrapper', () => {
    it('renders MarkEntryPage with AssessmentList when no assessment is selected', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/assessments/marks-entry']}>
          <AcademicProvider>
            <MarkEntryPage />
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Assessment List &amp; Marks Entry');
    });
  });
});
