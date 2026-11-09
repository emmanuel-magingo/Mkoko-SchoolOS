export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'HEADMASTER'
  | 'SECOND_MASTER'
  | 'SENIOR_ACADEMIC_MASTER'
  | 'SCHOOL_MANAGER'
  | 'SECRETARY'
  | 'BURSAR'
  | 'TEACHER'
  | 'STAFF';

export type TenantStatus = 'PILOT' | 'ACTIVE' | 'SUSPENDED';
export type SchoolLevel = 'O_LEVEL' | 'O_AND_A_LEVEL';

export interface TenantBranding {
  primary: string;
  secondary: string;
  accent: string;
  sidebar: string;
  surface: string;
  background: string;
  text: string;
}

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string | null;
  mustChangePassword?: boolean;
  customPermissions?: string[];
  academicDepartment?: {
    id: string;
    name: string;
    code: string;
  } | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  teacherId?: string;
  staffProfileId?: string;
  isClassTeacher?: boolean;
  assignedClassesAsTeacher?: Array<{ id: string; name: string; level?: string; stream?: string }>;
  isTeacherOnDuty?: boolean;
}

export type EducationLevel = 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  slug: string;
  status: TenantStatus;
  schoolLevel?: SchoolLevel;
  educationLevels?: EducationLevel[];
  schoolType?: string;
  createdAt?: string;
  updatedAt?: string;
  logoUrl?: string | null;
  branding?: TenantBranding | null;
  _count?: {
    students: number;
    classes: number;
    users: number;
  };
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: string;
  stream: string;
  _count?: {
    students: number;
  };
}

export type ExamType = 'FTNA' | 'CSEE' | 'ACSEE';
export type CandidateType = 'SCHOOL' | 'PRIVATE';
export type ExamRegistrationStatus = 'DRAFT' | 'REGISTERED' | 'CONFIRMED' | 'CANCELLED';

export interface StudentExamRegistration {
  id: string;
  tenantId: string;
  studentId: string;
  examType: ExamType;
  examYear: number;
  candidateType: CandidateType;
  candidateNumber: string;
  status: ExamRegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BulkImportStudentRow {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string | Date | null;
  className?: string | null;
  classId?: string | null;
  phone?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
  premNumber?: string | null;
  admissionNumber?: string | null;
}

export interface ImportPreviewRow {
  rowNumber: number;
  status: 'VALID' | 'INVALID' | 'POSSIBLE_DUPLICATE';
  data: BulkImportStudentRow;
  resolvedClass?: { id: string; name: string };
  errors: string[];
  warnings: string[];
}

export interface ImportPreviewResult {
  importToken?: string;
  success: boolean;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  possibleDuplicatesCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
  warnings: Array<{ row: number; field: string; message: string }>;
  previewRows: ImportPreviewRow[];
}

export interface Student {
  id: string;
  tenantId: string;
  admissionNumber: string;
  premNumber?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string | null;
  studentStatus: StudentStatus;
  classId?: string | null;
  phone?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  medicalConditions?: string | null;
  specialNeeds?: string | null;
  createdAt: string;
  updatedAt: string;
  class?: SchoolClass | null;
  guardians?: Guardian[];
  examRegistrations?: StudentExamRegistration[];
}

export interface DashboardFinanceData {
  totalOutstandingFees: number;
  todaysPaymentsTotal: number;
  totalInvoiced: number;
  totalCollected: number;
  todaysReceiptsCount: number;
  dataAsOf: string;
}

export interface DashboardMetrics {
  school: {
    id: string;
    name: string;
    code: string;
    slug: string;
    status: TenantStatus;
  };
  totalStudents?: number;
  activeStudents?: number;
  activeClasses?: number;
  teachersCount?: number;
  metrics: {
    totalStudents: number;
    activeStudents: number;
    activeClasses: number;
    teachersCount?: number;
    finance: DashboardFinanceData | null;
  };
  statusBreakdown: Record<StudentStatus, number>;
  recentStudents: Array<{
    id: string;
    admissionNumber: string;
    name: string;
    className: string;
    status: StudentStatus;
    createdAt: string;
  }>;
}

export interface AuditLog {
  id: string;
  tenantId?: string | null;
  actorId?: string | null;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLE_CHANGE' | 'RESPONSIBILITY_ASSIGNED' | 'RESPONSIBILITY_UPDATED' | 'RESPONSIBILITY_REVOKED';
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  } | null;
  tenant?: {
    id: string;
    name: string;
    code: string;
  } | null;
}
