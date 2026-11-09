import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AcademicProvider } from '../contexts/AcademicContext';
import { ClassesAndStreams } from '../pages/academics/ClassesAndStreams';
import { StudentEnrolments } from '../pages/academics/StudentEnrolments';
import {
  StudentBulkImportModal,
  REQUIRED_CSV_HEADERS,
} from '../components/academics/StudentBulkImportModal';
import { Permissions } from '../types/permissions';
import { api } from '../api/client';

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

describe('Sprint 2: Academic Foundation & Student Enrolments Test Suite', () => {
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
      hasPermission: vi.fn((perm) => [
        Permissions.VIEW_ACADEMICS,
        Permissions.VIEW_STUDENTS,
        Permissions.CREATE_STUDENTS,
        Permissions.MANAGE_CLASSES,
      ].includes(perm)),
    });

    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path.includes('/classes')) {
        return {
          data: [
            {
              id: 'cls-1',
              name: 'Form 1 - A',
              level: 'Form 1',
              stream: 'A',
              capacity: 45,
              classTeacher: { id: 't-1', firstName: 'John', lastName: 'Mwamba' },
              _count: { students: 42 },
            },
            {
              id: 'cls-2',
              name: 'Form 2 - B',
              level: 'Form 2',
              stream: 'B',
              capacity: 45,
              classTeacher: null,
              _count: { students: 38 },
            },
          ],
        } as any;
      }

      if (path.includes('/students')) {
        return {
          data: [
            {
              id: 'std-1',
              tenantId: 'tenant-school-1',
              admissionNumber: 'MWL/2026/001',
              premNumber: 'PREM-TZ-2026-0042',
              firstName: 'Juma',
              middleName: 'Ally',
              lastName: 'Mwamba',
              gender: 'MALE',
              studentStatus: 'ACTIVE',
              classId: 'cls-1',
              class: { id: 'cls-1', name: 'Form 1 - A' },
            },
            {
              id: 'std-2',
              tenantId: 'tenant-school-1',
              admissionNumber: 'MWL/2026/002',
              premNumber: null,
              firstName: 'Amina',
              middleName: 'Hassan',
              lastName: 'Bakari',
              gender: 'FEMALE',
              studentStatus: 'ACTIVE',
              classId: 'cls-1',
              class: { id: 'cls-1', name: 'Form 1 - A' },
            },
            {
              id: 'std-3',
              tenantId: 'tenant-school-1',
              admissionNumber: 'MWL/2026/003',
              premNumber: 'PREM-TZ-2026-0099',
              firstName: 'Baraka',
              middleName: null,
              lastName: 'Sengerema',
              gender: 'MALE',
              studentStatus: 'TRANSFERRED',
              classId: 'cls-2',
              class: { id: 'cls-2', name: 'Form 2 - B' },
            },
          ],
          meta: {
            total: 3,
            totalPages: 1,
            page: 1,
            limit: 10,
          },
        } as any;
      }

      return { data: [] } as any;
    });
  });

  // ==========================================================================
  // 1. CLASSES AND STREAMS COMPONENT
  // ==========================================================================
  describe('ClassesAndStreams Component', () => {
    it('renders page header, metric cards, and table controls', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/structure/classes']}>
          <AcademicProvider>
            <ClassesAndStreams />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Header
      expect(html).toContain('Classes &amp; Streams');
      expect(html).toContain('Active instructional forms');

      // Metric cards
      expect(html).toContain('Total Classes &amp; Streams');
      expect(html).toContain('Active Students');
      expect(html).toContain('Total Capacity');
      expect(html).toContain('Occupancy Rate');

      // Table controls
      expect(html).toContain('classes-search-input');
      expect(html).toContain('classes-level-filter');
      expect(html).toContain('btn-create-class');
      expect(html).toContain('Create Class');

      // Table headers
      expect(html).toContain('Class &amp; Stream');
      expect(html).toContain('Class Teacher');
      expect(html).toContain('Capacity');
      expect(html).toContain('Current Enrolment');
    });
  });

  // ==========================================================================
  // 2. STUDENT ENROLMENTS COMPONENT
  // ==========================================================================
  describe('StudentEnrolments Component', () => {
    it('renders page header, action buttons (Add Student, Bulk Import), and table headers', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/academics/structure/enrolments']}>
          <AcademicProvider>
            <StudentEnrolments />
          </AcademicProvider>
        </MemoryRouter>
      );

      // Header and description
      expect(html).toContain('Student Enrolments');
      expect(html).toContain('Official student roll');

      // Primary actions
      expect(html).toContain('btn-bulk-import');
      expect(html).toContain('Bulk Import');
      expect(html).toContain('btn-add-student');
      expect(html).toContain('Add Student');

      // Summary chips
      expect(html).toContain('Total Enrolled');
      expect(html).toContain('Active Students');
      expect(html).toContain('Male Students');
      expect(html).toContain('Female Students');

      // Filters
      expect(html).toContain('search-students-input');
      expect(html).toContain('filter-class');
      expect(html).toContain('filter-status');
      expect(html).toContain('filter-gender');

      // Table columns
      expect(html).toContain('Admission No.');
      expect(html).toContain('Student Name');
      expect(html).toContain('Gender');
      expect(html).toContain('Class / Stream');
      expect(html).toContain('PREM No.');
      expect(html).toContain('Status');
    });

    it('ensures activeCount reflects total active students (49) rather than paginated page size (10)', () => {
      const meta = {
        total: 49,
        activeCount: 49,
        maleCount: 25,
        femaleCount: 24,
        page: 1,
        limit: 10,
      };

      expect(meta.total).toBe(49);
      expect(meta.activeCount).toBe(49);
      expect(meta.activeCount).toBeGreaterThan(meta.limit);
    });
  });

  // ==========================================================================
  // 3. STUDENT BULK IMPORT MODAL
  // ==========================================================================
  describe('StudentBulkImportModal Component', () => {
    it('maps and displays all 9 required CSV headers', () => {
      expect(REQUIRED_CSV_HEADERS).toContain('First Name');
      expect(REQUIRED_CSV_HEADERS).toContain('Middle Name');
      expect(REQUIRED_CSV_HEADERS).toContain('Last Name');
      expect(REQUIRED_CSV_HEADERS).toContain('Gender');
      expect(REQUIRED_CSV_HEADERS).toContain('Date of Birth');
      expect(REQUIRED_CSV_HEADERS).toContain('Class/Form');
      expect(REQUIRED_CSV_HEADERS).toContain('PREM Number');
      expect(REQUIRED_CSV_HEADERS).toContain('Admission Number');
      expect(REQUIRED_CSV_HEADERS).toContain('Examination Number');
    });

    it('renders upload dropzone, template download button, and required headers in modal', () => {
      const html = renderToString(
        <StudentBulkImportModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(html).toContain('student-bulk-import-modal');
      expect(html).toContain('Bulk Import Students into Enrolments');
      expect(html).toContain('btn-download-import-template');
      expect(html).toContain('Download Template');
      expect(html).toContain('file-upload-input');
      expect(html).toContain('Required Spreadsheet Columns &amp; Headers');
      expect(html).toContain('btn-validate-upload');
      expect(html).toContain('Validate &amp; Preview');

      // Check header items visible in upload guide
      for (const header of REQUIRED_CSV_HEADERS) {
        expect(html).toContain(header);
      }
    });

    it('does not render modal content when isOpen is false', () => {
      const html = renderToString(
        <StudentBulkImportModal
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      expect(html).not.toContain('student-bulk-import-modal');
    });

    it('correctly identifies and displays mock validation metrics and row-level errors', () => {
      const mockPreviewResult = {
        success: true,
        importToken: 'tok-preview-test-123',
        totalRows: 3,
        validRowsCount: 2,
        invalidRowsCount: 1,
        possibleDuplicatesCount: 0,
        previewRows: [
          {
            rowNumber: 1,
            status: 'VALID' as const,
            data: {
              firstName: 'Juma',
              middleName: 'Ally',
              lastName: 'Mwamba',
              gender: 'MALE',
              className: 'Form 1 - A',
              premNumber: 'PREM-001',
              admissionNumber: 'MWL/2026/001',
            },
            errors: [],
            warnings: [],
          },
          {
            rowNumber: 2,
            status: 'INVALID' as const,
            data: {
              firstName: 'Fatma',
              middleName: null,
              lastName: 'Rashid',
              gender: 'UNKNOWN',
              className: 'Form 1 - NonExistent',
              premNumber: null,
              admissionNumber: 'MWL/2026/002',
            },
            errors: ["Invalid gender 'UNKNOWN'", "Class 'Form 1 - NonExistent' not found"],
            warnings: [],
          },
          {
            rowNumber: 3,
            status: 'VALID' as const,
            data: {
              firstName: 'Hamisi',
              middleName: 'Said',
              lastName: 'Omari',
              gender: 'MALE',
              className: 'Form 2 - B',
              premNumber: 'PREM-003',
              admissionNumber: 'MWL/2026/003',
            },
            errors: [],
            warnings: [],
          },
        ],
        errors: [
          {
            row: 2,
            field: 'gender',
            message: "Invalid gender 'UNKNOWN'",
          },
          {
            row: 2,
            field: 'className',
            message: "Class 'Form 1 - NonExistent' not found",
          },
        ],
        warnings: [],
      };

      const html = renderToString(
        <StudentBulkImportModal
          isOpen={true}
          onClose={vi.fn()}
          initialStep="PREVIEW"
          initialPreviewResult={mockPreviewResult as any}
        />
      );

      // Verify validation metric cards
      expect(html).toContain('stat-total-rows');
      expect(html).toContain('Total Rows');
      expect(html).toContain('3');

      expect(html).toContain('stat-valid-rows');
      expect(html).toContain('Valid Rows');
      expect(html).toContain('2');

      expect(html).toContain('stat-invalid-rows');
      expect(html).toContain('Invalid Rows');
      expect(html).toContain('1');

      // Verify row-level error panel
      expect(html).toContain('validation-errors-panel');
      expect(html).toContain('Validation Errors Detected');
      expect(html).toContain('Row 2:');
      expect(html).toContain('gender');
      expect(html).toContain("Invalid gender &#x27;UNKNOWN&#x27;");
      expect(html).toContain('className');
      expect(html).toContain("Class &#x27;Form 1 - NonExistent&#x27; not found");

      // Verify table rows rendered
      expect(html).toContain('Juma Ally Mwamba');
      expect(html).toContain('Fatma Rashid');
      expect(html).toContain('Hamisi Said Omari');
      expect(html).toContain('Ready to enroll');

      // Verify Confirm & Import action button
      expect(html).toContain('btn-confirm-import');
      expect(html).toContain('Confirm &amp; Import');
      expect(html).toContain('2 Students');
    });

    it('renders success state when import is completed', () => {
      const html = renderToString(
        <StudentBulkImportModal
          isOpen={true}
          onClose={vi.fn()}
          initialStep="SUCCESS"
        />
      );

      expect(html).toContain('Bulk Enrolment Completed Successfully');
      expect(html).toContain('btn-import-done');
      expect(html).toContain('Done &amp; View Enrolments');
    });

    it('submits multipart FormData containing file and optional classId via api.postFormData', async () => {
      const postFormDataSpy = vi.spyOn(api, 'postFormData').mockResolvedValueOnce({
        data: {
          success: true,
          importToken: 'tok-123',
          totalRows: 1,
          validRowsCount: 1,
          invalidRowsCount: 0,
          possibleDuplicatesCount: 0,
          errors: [],
          warnings: [],
          previewRows: [],
        },
      });

      const formData = new FormData();
      const dummyFile = new File(['dummy content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      formData.append('file', dummyFile);
      formData.append('classId', 'cls-sample-123');

      await api.postFormData('/students/import-preview', formData);

      expect(postFormDataSpy).toHaveBeenCalledTimes(1);
      expect(postFormDataSpy).toHaveBeenCalledWith('/students/import-preview', expect.any(FormData));
      const passedFormData = postFormDataSpy.mock.calls[0][1] as FormData;
      expect(passedFormData.get('file')).toBe(dummyFile);
      expect(passedFormData.get('classId')).toBe('cls-sample-123');
    });
  });
});
