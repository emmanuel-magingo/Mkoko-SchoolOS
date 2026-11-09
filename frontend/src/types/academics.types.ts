export type EducationLevel = 'PRIMARY' | 'O_LEVEL' | 'A_LEVEL';

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Term {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isActive?: boolean;
  isClosed?: boolean;
  educationLevel?: EducationLevel | null;
  midTermBreakStartDate?: string | null;
  midTermBreakEndDate?: string | null;
  academicYear?: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export type CalendarEventCategory =
  | 'GOVERNMENT_DATE'
  | 'PUBLIC_HOLIDAY'
  | 'EXAM'
  | 'SPECIAL_PROGRAM'
  | 'OTHER';

export type CalendarEventScope =
  | 'ALL'
  | 'PRIMARY'
  | 'O_LEVEL'
  | 'A_LEVEL'
  | 'SPECIFIC_CLASSES';

export interface CalendarEvent {
  id: string;
  tenantId: string;
  academicYearId?: string | null;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  type?: string;
  category: CalendarEventCategory;
  scope: CalendarEventScope;
  educationLevel?: EducationLevel | null;
  classId?: string | null;
  classStream?: string | null;
  isHoliday: boolean;
  isOperationalException: boolean;
  class?: {
    id: string;
    name: string;
    level: string;
    stream: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  level?: EducationLevel;
  applicableClasses?: string[];
  category?: 'Core' | 'Elective' | 'Optional' | 'CORE' | 'ELECTIVE' | 'OPTIONAL' | string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt?: string;
}

export interface SubjectCombination {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  subjects?: Subject[];
  combinationSubjects?: Array<{
    id?: string;
    subjectId: string;
    subject: Subject;
  }>;
  classes?: Array<{ id: string; name: string }>;
  classCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumCatalogueResponse {
  subjects: Array<{
    code: string;
    name: string;
    level: EducationLevel;
    category: string;
    applicableClasses: string[];
    description: string;
  }>;
  combinations: Array<{
    code: string;
    name: string;
    subjectCodes: string[];
    description: string;
  }>;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  academicDepartmentId?: string | null;
  academicDepartment?: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignments?: TeacherAssignment[];
  teacherAssignments?: TeacherAssignment[];
  qualifications?: Subject[];
  subjectIds?: string[];
  teachingLevels?: EducationLevel[];
  designation?: string | null;
  staffProfile?: {
    id: string;
    jobTitle?: string | null;
    employeeNumber?: string | null;
  } | null;
}

export interface AcademicDepartment {
  id: string;
  name: string;
  code: string;
  hodId?: string | null;
  educationLevels?: EducationLevel[];
  createdAt?: string;
  updatedAt?: string;
  hod?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  teachers?: Teacher[];
  subjects?: Subject[];
  teacherCount?: number;
  subjectCount?: number;
  _count?: {
    teachers: number;
    subjects?: number;
  };
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  academicYearId?: string | null;
  isPrimary?: boolean;
  createdAt?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  class?: {
    id: string;
    name: string;
    level?: string;
    stream?: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    category?: string | null;
    level?: EducationLevel | null;
    departmentId?: string | null;
    applicableClasses?: string[];
  };
}

export interface Assessment {
  id: string;
  termId: string;
  classId: string;
  subjectId: string;
  name: string;
  maxScore: string | number;
  type?: string;
  weight?: number;
  status?: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  isFinalized?: boolean;
  submittedById?: string | null;
  submittedAt?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  reopenReason?: string | null;
  class?: { id: string; name: string };
  subject?: { id: string; name: string; code: string };
}

export interface Mark {
  id: string;
  assessmentId: string;
  studentId: string;
  score: string | number;
  comments: string | null;
  student?: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
}

export type LessonLogStatus = 'TAUGHT' | 'MISSED' | 'CANCELLED';

export interface SyllabusSpecificCompetence {
  id: string;
  mainCompetenceId: string;
  index: string;
  description: string;
}

export interface SyllabusMainCompetence {
  id: string;
  subjectId: string;
  index: number;
  description: string;
  specificCompetences: SyllabusSpecificCompetence[];
}

export interface SubjectTopic {
  id: string;
  subjectId: string;
  tenantId: string;
  teacherId?: string | null;
  termId?: string | null;
  term?: { id: string; name: string } | null;
  classId?: string | null;
  class?: { id: string; name: string; level: string; stream: string } | null;
  academicYearId?: string | null;
  title: string;
  subTopics?: string[];
  orderIndex: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | string;
  estimatedPeriods?: number | null;
  completedAt?: string | null;
  learningObjectives?: string | null;
  learningActivities?: string | null;
  learningResources?: string | null;
  assessmentMethods?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchemeOfWorkClassProgress {
  classId: string;
  className: string;
  level: string;
  stream: string;
  topicsPlanned: number;
  topicsCompleted: number;
  totalPeriods: number;
  progressPercentage: number;
}

export interface SchemeOfWorkSubjectGroup {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classes: SchemeOfWorkClassProgress[];
}

export interface SchemeOfWorkOverviewSummary {
  totalSubjects: number;
  totalClasses: number;
  totalCombinations: number;
  totalTopicsPlanned: number;
  totalTopicsCompleted: number;
  overallCompletion: number;
}

export interface SchemeOfWorkOverview {
  summary: SchemeOfWorkOverviewSummary;
  subjects: SchemeOfWorkSubjectGroup[];
}

export interface LessonLog {
  id: string;
  timetablePeriodId?: string | null;
  teacherId: string;
  classId: string;
  subjectId: string;
  topicId?: string | null;
  lessonPlanId?: string | null;
  mainCompetenceId?: string | null;
  specificCompetenceId?: string | null;
  lessonDate: string;
  startTime?: string | null;
  endTime?: string | null;
  status: LessonLogStatus;
  reasonForMissed?: string | null;
  topic?: string | null;
  subTopic?: string | null;
  description?: string | null;
  activities?: string | null;
  objectives?: string | null;
  notes?: string | null;
  studentsPresent?: number | null;
  studentsTotal?: number | null;
  studentsAbsent?: number | null;
  // 3-Tier Approval Workflow
  approvalStatus?: 'PENDING_SUBMISSION' | 'SUBMITTED_TO_HOD' | 'VERIFIED_BY_HOD' | 'APPROVED_BY_ACADEMIC' | 'REJECTED' | string;
  submittedAt?: string | null;
  hodId?: string | null;
  hodSignedAt?: string | null;
  hodRemarks?: string | null;
  academicMasterId?: string | null;
  academicSignedAt?: string | null;
  academicRemarks?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  teacher?: { id: string; firstName: string; lastName: string };
  hod?: { id: string; firstName: string; lastName: string } | null;
  academicMaster?: { id: string; firstName: string; lastName: string } | null;
  class?: { id: string; name: string };
  subject?: { id: string; name: string; code: string; departmentId?: string | null };
  subjectTopic?: {
    id: string;
    title: string;
    orderIndex: number;
    status?: string;
    estimatedPeriods?: number | null;
    completedAt?: string | null;
  } | null;
  mainCompetence?: {
    id: string;
    index: number;
    description: string;
  };
  specificCompetence?: {
    id: string;
    index: string;
    description: string;
    mainCompetence?: {
      id: string;
      index: number;
      description: string;
    };
  };
}

export interface SchoolClosure {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  reason: string;
  classId?: string | null;
  class?: { id: string; name: string };
  createdAt: string;
}

export type ReportCardStatus = 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface ReportCardSubject {
  id: string;
  reportCardId?: string;
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
  caScore?: number | null;
  examScore?: number | null;
  finalScore: number;
  grade: string;
  gradePoint: number;
  remarks?: string | null;
  subject?: {
    id?: string;
    name: string;
    code: string;
  };
}

export interface ReportCard {
  id: string;
  tenantId?: string;
  studentId: string;
  academicYearId: string;
  termId: string;
  classId: string;
  totalMarks?: number | null;
  averageScore?: number | null;
  totalPoints?: number | null;
  gpa?: number | null;
  division?: string | null;
  divisionPoints?: number | null;
  rankInClass?: number | null;
  totalStudents?: number | null;
  totalStudentsInClass?: number | null;
  attendanceSummary?: {
    daysPresent?: number;
    daysAbsent?: number;
    totalDays?: number;
    attendanceRate?: number;
  } | null;
  attendanceDaysPresent?: number | null;
  attendanceDaysAbsent?: number | null;
  headmasterRemarks?: string | null;
  headTeacherRemarks?: string | null;
  classTeacherRemarks?: string | null;
  status: ReportCardStatus;
  publishedAt?: string | null;
  publishedById?: string | null;
  generationSnapshot?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  class?: {
    id: string;
    name: string;
    stream?: string;
  };
  term?: {
    id: string;
    name: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  subjects?: ReportCardSubject[];
}

// ============================================================================
// Sprint 7: Student Support, Interventions & Governance
// ============================================================================

export type InterventionStatus = 'ACTIVE' | 'RESOLVED';

export interface InterventionPlan {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  concern: string;
  supportingEvidence: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  actionPlan: string;
  reviewDate: string;
  status: InterventionStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type DisciplineSeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
export type DisciplineStatus = 'REPORTED' | 'UNDER_INVESTIGATION' | 'RESOLVED';

export interface DisciplineIncidentSummary {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  incidentType: string;
  severity: DisciplineSeverity;
  description: string;
  actionTaken?: string;
  reportedBy: string;
  date: string;
  status: DisciplineStatus;
  isConfidential: boolean;
}

export type MeetingType =
  | 'DEPARTMENTAL'
  | 'EXAMINATION_BOARD'
  | 'CURRICULUM_REVIEW'
  | 'STAFF_BRIEFING'
  | 'PARENT_CONSULTATION';

export type ActionItemStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  task: string;
  assignedToId: string;
  assignedToName: string;
  dueDate: string;
  status: ActionItemStatus;
  completedAt?: string;
}

export interface AcademicMeeting {
  id: string;
  title: string;
  meetingType: MeetingType;
  date: string;
  time?: string;
  venue: string;
  chairId?: string;
  chairName: string;
  agenda: string;
  minutes?: string;
  decisions?: string[];
  attendees?: string[];
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  actionItems?: MeetingActionItem[];
  createdAt?: string;
}

export interface AcademicAuditLogEntry {
  id: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  contextSchool: string;
  contextTerm?: string;
  action: string;
  targetRecord: string;
  reason?: string;
  details?: Record<string, any>;
}

// ==============================================================================
// TANZANIAN STANDARD (TIE) LESSON PLAN ARCHITECTURE
// ==============================================================================

export type LessonPlanStageName =
  | 'INTRODUCTION'
  | 'NEW_KNOWLEDGE'
  | 'REINFORCEMENT'
  | 'REFLECTION'
  | 'CONCLUSION'
  | string;

export interface LessonPlanStage {
  id: string;
  lessonPlanId: string;
  stageName: LessonPlanStageName;
  durationMinutes: number;
  teachingActivities: string;
  learningActivities: string;
  assessmentActivities: string;
  orderIndex: number;
}

export interface LessonPlan {
  id: string;
  tenantId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  subjectTopicId?: string | null;
  lessonDate: string;
  periodNumber: string;
  durationMinutes: number;
  competence: string;
  mainTopic: string;
  subTopic: string;
  generalObjective: string;
  specificObjectives: string[];
  teachingAids: string;
  teachingTechniques: string;
  references: string;
  stages: LessonPlanStage[];
  studentsEvaluation?: string | null;
  teacherEvaluation?: string | null;
  remarks?: string | null;
  subjectTopic?: {
    id: string;
    title: string;
    status: string;
    estimatedPeriods?: number | null;
  } | null;
  subject?: { id: string; name: string; code?: string } | null;
  class?: { id: string; name: string } | null;
  teacher?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonPlanPayload {
  teacherId?: string;
  classId: string;
  subjectId: string;
  subjectTopicId?: string | null;
  lessonDate: string;
  periodNumber?: string;
  durationMinutes?: number;
  competence: string;
  mainTopic: string;
  subTopic: string;
  generalObjective: string;
  specificObjectives: string[];
  teachingAids?: string;
  teachingTechniques?: string;
  references?: string;
  stages?: Omit<LessonPlanStage, 'id' | 'lessonPlanId'>[];
  studentsEvaluation?: string;
  teacherEvaluation?: string;
  remarks?: string;
}

export interface LessonPlanPrepopulation {
  lessonPlanId: string;
  topicId?: string | null;
  topic: string;
  subTopic: string;
  objectives: string;
  activities: string;
  remarks?: string;
}
