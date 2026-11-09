export * from './academics.types';

export interface Term {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  terms?: Term[];
}

export interface SchoolSummary {
  id: string;
  name: string;
  code: string;
  status?: string;
  schoolLevel?: string;
  logoUrl?: string | null;
}

export interface DashboardMetrics {
  attendanceToday: {
    percentage: number;
    presentCount: number;
    totalCount: number;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
  };
  registersPending: {
    pendingClassesCount: number;
    classes: string[];
    dueTime: string;
    isOverdue: boolean;
  };
  marksCompletion: {
    percentage: number;
    recordedColumns: number;
    totalColumns: number;
    pendingSubmissionCount: number;
  };
  syllabusOnTrack: {
    percentage: number;
    onTrackSubjectsCount: number;
    totalSubjectsCount: number;
    behindScheduleCount: number;
  };
}

export interface OperationalException {
  id: string;
  title: string;
  category: 'TIMETABLE_CONFLICT' | 'COVERAGE_DELAY' | 'FREQUENT_ABSENCE' | 'PENDING_APPROVAL';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  entityName: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface PriorityTask {
  id: string;
  task: string;
  responsibleArea: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  actionUrl?: string;
}

export interface TodayScheduleItem {
  id: string;
  period: string;
  time: string;
  subject: string;
  classRoom: string;
  teacherName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
}

export interface ActivityFeedItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  category: 'ASSESSMENT' | 'TIMETABLE' | 'ATTENDANCE' | 'GOVERNANCE';
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  accentColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
}

export interface AcademicClass {
  id: string;
  name: string;
  level: string;
  stream: string;
  capacity?: number;
  classTeacherId?: string | null;
  classTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  combinationId?: string | null;
  combination?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count?: {
    students: number;
  };
}

export interface EnrolledStudent {
  id: string;
  tenantId: string;
  admissionNumber: string;
  premNumber?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string | null;
  studentStatus: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'WITHDRAWN';
  classId?: string | null;
  class?: {
    id: string;
    name: string;
  } | null;
  examRegistrations?: Array<{
    id: string;
    candidateNumber?: string;
    examType: string;
    examYear: number;
  }>;
}
