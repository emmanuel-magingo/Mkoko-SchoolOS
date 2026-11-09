import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { AcademicLayout } from '../components/academics/AcademicLayout';
import { AcademicInterventions } from '../components/academics/support/AcademicInterventions';
import { DisciplineAndWelfare } from '../components/academics/support/DisciplineAndWelfare';
import { AcademicMeetings } from '../components/academics/governance/AcademicMeetings';
import { MeetingDetails } from '../components/academics/governance/MeetingDetails';
import { AuditHistoryLog } from '../components/academics/governance/AuditHistoryLog';
import { AcademicInterventionsPage } from '../pages/academics/AcademicInterventionsPage';
import { DisciplineAndWelfarePage } from '../pages/academics/DisciplineAndWelfarePage';
import { AcademicMeetingsPage } from '../pages/academics/AcademicMeetingsPage';
import { AcademicAuditPage } from '../pages/academics/AcademicAuditPage';
import {
  InterventionPlan,
  DisciplineIncidentSummary,
  AcademicMeeting,
  AcademicAuditLogEntry,
} from '../types/academics.types';
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

describe('Sprint 7: Student Support, Interventions & Governance Test Suite', () => {
  const mockInterventions: InterventionPlan[] = [
    {
      id: 'int-1',
      studentId: 'std-101',
      studentName: 'Amani Athumani',
      admissionNumber: 'SCH/2026/101',
      classId: 'cls-1',
      className: 'Form 4 Science',
      subjectName: 'Basic Mathematics',
      concern: 'Chronically failing Algebra and Calculus CA assessments',
      supportingEvidence: 'Scored 28/100 on Mid-Term Exam; missed 4 remedial homework submissions',
      assignedTeacherId: 'tch-1',
      assignedTeacherName: 'Mr. David Mrema',
      actionPlan: 'Enrolled in 2x weekly after-school remedial sessions; paired with peer mentor',
      reviewDate: '2026-11-15',
      status: 'ACTIVE',
      createdAt: '2026-10-10T08:00:00Z',
    },
    {
      id: 'int-2',
      studentId: 'std-103',
      studentName: 'Godfrey Mkumbo',
      admissionNumber: 'SCH/2026/103',
      classId: 'cls-2',
      className: 'Form 3 Arts',
      subjectName: 'English Language',
      concern: 'Weak essay composition skills and grammar vocabulary',
      supportingEvidence: 'Essay assessment score 42%; repetitive spelling inconsistencies',
      assignedTeacherId: 'tch-3',
      assignedTeacherName: 'Mrs. Fatma Said',
      actionPlan: 'Completed 6 intensive structured writing modules and book critique assignments',
      reviewDate: '2026-10-01',
      status: 'RESOLVED',
      createdAt: '2026-08-15T11:00:00Z',
    },
  ];

  const mockIncidents: DisciplineIncidentSummary[] = [
    {
      id: 'inc-1',
      studentId: 'std-201',
      studentName: 'Hamisi Bakari',
      admissionNumber: 'SCH/2026/201',
      className: 'Form 4 Science',
      incidentType: 'Class Disruption & Unexcused Absence',
      severity: 'MODERATE',
      description: 'Repeatedly absent from afternoon physics practical sessions without medical cause.',
      actionTaken: 'Parental meeting scheduled; 2 weeks community service on campus grounds.',
      reportedBy: 'Mr. David Mrema',
      date: '2026-10-14',
      status: 'UNDER_INVESTIGATION',
      isConfidential: true,
    },
    {
      id: 'inc-2',
      studentId: 'std-202',
      studentName: 'Mariam Juma',
      admissionNumber: 'SCH/2026/202',
      className: 'Form 3 Arts',
      incidentType: 'Welfare Concern: Emotional Distress',
      severity: 'MAJOR',
      description: 'Student experiencing prolonged grief after family bereavement; academic marks declining.',
      actionTaken: 'Referred to school resident counselor and welfare officer for counseling support.',
      reportedBy: 'Mrs. Fatma Said',
      date: '2026-10-08',
      status: 'REPORTED',
      isConfidential: true,
    },
  ];

  const mockMeetings: AcademicMeeting[] = [
    {
      id: 'mtg-1',
      title: 'Term 1 Examination Board & Results Moderation',
      meetingType: 'EXAMINATION_BOARD',
      date: '2026-10-22',
      time: '09:00 AM',
      venue: 'Main Academic Conference Hall',
      chairName: 'Dr. Joseph Malecela (Head of School)',
      agenda: 'Review locked marks for Form 4 mock exams; approve canonical grading scale and division distributions.',
      minutes: 'Heads of department confirmed complete reconciliation of CA and exam marks.',
      decisions: ['Approved NECTA canonical grading policy for all secondary streams.'],
      attendees: ['Dr. Malecela', 'Mr. Mrema', 'Ms. Lyimo', 'Mrs. Said', 'Academic Master'],
      status: 'COMPLETED',
      actionItems: [
        {
          id: 'act-1',
          meetingId: 'mtg-1',
          task: 'Compile list of students requiring mathematics remedial tutoring',
          assignedToId: 'tch-1',
          assignedToName: 'Mr. David Mrema',
          dueDate: '2026-10-25',
          status: 'COMPLETED',
        },
        {
          id: 'act-2',
          meetingId: 'mtg-1',
          task: 'Prepare laboratory experiment requisitions for chemistry titration exams',
          assignedToId: 'tch-2',
          assignedToName: 'Ms. Clara Lyimo',
          dueDate: '2026-11-05',
          status: 'PENDING',
        },
      ],
    },
  ];

  const mockAuditLogs: AcademicAuditLogEntry[] = [
    {
      id: 'aud-1',
      actorId: 'usr-1',
      actorName: 'Mrs. Salma Kigoma',
      actorRole: 'Academic Master',
      timestamp: '2026-10-18T14:32:00Z',
      contextSchool: 'Mwilamvya Model Academy',
      contextTerm: 'Term I',
      action: 'REPORT_CARDS_PUBLISHED',
      targetRecord: 'Batch-Form4-Science-Term1',
      reason: 'Term 1 final mock exams approved by Academic Committee',
    },
    {
      id: 'aud-2',
      actorId: 'usr-2',
      actorName: 'Mr. David Mrema',
      actorRole: 'Senior Subject Teacher',
      timestamp: '2026-10-16T11:15:00Z',
      contextSchool: 'Mwilamvya Model Academy',
      contextTerm: 'Term I',
      action: 'MARKS_SUBMITTED',
      targetRecord: 'Assessment-BAM-Form4-Midterm',
      reason: 'Completed double-entry verification of raw candidate marks',
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
          Permissions.VIEW_DISCIPLINE,
          Permissions.MANAGE_DISCIPLINE,
          Permissions.CREATE_DISCIPLINE_INCIDENT,
        ].includes(perm)
      ),
    });

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
              terms: [{ id: 'term-1', name: 'Term I', isActive: true, academicYearId: 'year-2026' }],
            },
          ],
        } as any;
      }
      if (path.includes('/classes')) {
        return {
          data: [
            { id: 'cls-1', name: 'Form 4 Science', stream: 'A' },
            { id: 'cls-2', name: 'Form 3 Arts', stream: 'B' },
          ],
        } as any;
      }
      if (path.includes('/staff')) {
        return {
          data: [
            { id: 'tch-1', firstName: 'David', lastName: 'Mrema', email: 'mrema@school.org' },
            { id: 'tch-2', firstName: 'Clara', lastName: 'Lyimo', email: 'lyimo@school.org' },
          ],
        } as any;
      }
      return { data: [] } as any;
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return renderToString(
      <MemoryRouter>
        <AcademicProvider>{ui}</AcademicProvider>
      </MemoryRouter>
    );
  };

  describe('Part 1: AcademicInterventions Component', () => {
    it('1. Renders student support header, metrics cards, and filters', () => {
      const html = renderWithProviders(<AcademicInterventions initialPlans={mockInterventions} />);

      expect(html).toContain('Student Support &amp; Academic Interventions');
      expect(html).toContain('Create Improvement Plan');
      expect(html).toContain('Total Enrolled in Support');
      expect(html).toContain('Active Improvement Plans');
      expect(html).toContain('Successfully Resolved');
      expect(html).toContain('Plan Resolution Rate');
    });

    it('2. Renders list of student improvement plans with concerns, evidence, mentor and review date', () => {
      const html = renderWithProviders(<AcademicInterventions initialPlans={mockInterventions} />);

      expect(html).toContain('Amani Athumani');
      expect(html).toContain('SCH/2026/101');
      expect(html).toContain('Form 4 Science');
      expect(html).toContain('Basic Mathematics');
      expect(html).toContain('Chronically failing Algebra and Calculus CA assessments');
      expect(html).toContain('Mr. David Mrema');
      expect(html).toContain('2026-11-15');
      expect(html).toContain('ACTIVE');
    });

    it('3. Renders resolved plans with resolution badge and reactivate action', () => {
      const html = renderWithProviders(<AcademicInterventions initialPlans={mockInterventions} />);

      expect(html).toContain('Godfrey Mkumbo');
      expect(html).toContain('RESOLVED');
      expect(html).toContain('Reactivate');
    });
  });

  describe('Part 2: DisciplineAndWelfare Component & Permission Boundary', () => {
    it('4. Renders confidential discipline & welfare view for authorized users', () => {
      const html = renderWithProviders(<DisciplineAndWelfare initialIncidents={mockIncidents} />);

      expect(html).toContain('Discipline &amp; Student Welfare');
      expect(html).toContain('Confidential');
      expect(html).toContain('Log Welfare Referral');
      expect(html).toContain('Hamisi Bakari');
      expect(html).toContain('Class Disruption &amp; Unexcused Absence');
      expect(html).toContain('MODERATE');
      expect(html).toContain('Mariam Juma');
      expect(html).toContain('Welfare Concern: Emotional Distress');
      expect(html).toContain('MAJOR');
    });

    it('5. Renders secure restricted access state when user lacks discipline permissions', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
      });
      mockUseAuth.mockReturnValue({
        user: { role: 'TEACHER', firstName: 'Standard', lastName: 'Teacher' },
        tenant: { id: 'tenant-school-1', name: 'Mwilamvya Model Academy' },
      });

      const html = renderWithProviders(
        <DisciplineAndWelfare forcePermissionDenied={true} initialIncidents={mockIncidents} />
      );

      expect(html).toContain('Discipline &amp; Welfare Clearance Required');
      expect(html).toContain('Confidential • Restricted Access');
      expect(html).toContain('Access is strictly limited to the Discipline Master');
      expect(html).not.toContain('Hamisi Bakari');
    });
  });

  describe('Part 3: AcademicMeetings & MeetingDetails Components', () => {
    it('6. Renders academic meetings list with type badges and schedule meeting action', () => {
      const html = renderWithProviders(<AcademicMeetings initialMeetings={mockMeetings} />);

      expect(html).toContain('Academic Governance &amp; Meetings');
      expect(html).toContain('Schedule Meeting');
      expect(html).toContain('Term 1 Examination Board &amp; Results Moderation');
      expect(html).toContain('EXAMINATION_BOARD');
      expect(html).toContain('Dr. Joseph Malecela');
      expect(html).toContain('Main Academic Conference Hall');
      expect(html).toContain('View Details &amp; Minutes');
    });

    it('7. MeetingDetails renders meeting metadata, official minutes, decisions, and action items', () => {
      const html = renderWithProviders(
        <MeetingDetails meeting={mockMeetings[0]} onBack={vi.fn()} />
      );

      expect(html).toContain('Back to Meetings');
      expect(html).toContain('Term 1 Examination Board &amp; Results Moderation');
      expect(html).toContain('Official Minutes');
      expect(html).toContain('Key Decisions Adopted');
      expect(html).toContain('Approved NECTA canonical grading policy for all secondary streams.');
      expect(html).toContain('Action Items Tracker');
      expect(html).toContain('Compile list of students requiring mathematics remedial tutoring');
      expect(html).toContain('Mr. David Mrema');
      expect(html).toContain('Prepare laboratory experiment requisitions for chemistry titration exams');
      expect(html).toContain('Ms. Clara Lyimo');
      expect(html).toContain('Add Action Item');
      expect(html).toContain('Save Minutes &amp; Actions');
    });
  });

  describe('Part 4: AuditHistoryLog Component', () => {
    it('8. Renders read-only audit history log with immutable ledger badge and filters', () => {
      const html = renderWithProviders(<AuditHistoryLog initialLogs={mockAuditLogs} />);

      expect(html).toContain('Academic Audit Ledger &amp; History');
      expect(html).toContain('Immutable Ledger');
      expect(html).toContain('Actor (User)');
      expect(html).toContain('Action / Event');
      expect(html).toContain('Target Record');
      expect(html).toContain('Mrs. Salma Kigoma');
      expect(html).toContain('Academic Master');
      expect(html).toContain('REPORT_CARDS_PUBLISHED');
      expect(html).toContain('Batch-Form4-Science-Term1');
      expect(html).toContain('Mr. David Mrema');
      expect(html).toContain('MARKS_SUBMITTED');
      expect(html).toContain('Assessment-BAM-Form4-Midterm');
    });
  });

  describe('Part 5: Page Integration & AcademicLayout', () => {
    it('9. AcademicInterventionsPage renders inside AcademicLayout', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/support/interventions']}>
          <AcademicProvider>
            <AcademicLayout>
              <AcademicInterventionsPage />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Student Support &amp; Academic Interventions');
      expect(html).toContain('Academic Dept');
      expect(html).toContain('Create Improvement Plan');
    });

    it('10. DisciplineAndWelfarePage renders inside AcademicLayout', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/support/discipline']}>
          <AcademicProvider>
            <AcademicLayout>
              <DisciplineAndWelfarePage />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Discipline &amp; Student Welfare');
      expect(html).toContain('Academic Dept');
    });

    it('11. AcademicMeetingsPage renders inside AcademicLayout', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/governance/meetings']}>
          <AcademicProvider>
            <AcademicLayout>
              <AcademicMeetingsPage />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Academic Governance &amp; Meetings');
      expect(html).toContain('Academic Dept');
      expect(html).toContain('Schedule Meeting');
    });

    it('12. AcademicAuditPage renders inside AcademicLayout', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/governance/audit']}>
          <AcademicProvider>
            <AcademicLayout>
              <AcademicAuditPage />
            </AcademicLayout>
          </AcademicProvider>
        </MemoryRouter>
      );

      expect(html).toContain('Academic Audit Ledger &amp; History');
      expect(html).toContain('Academic Dept');
      expect(html).toContain('Immutable Ledger');
    });
  });
});
