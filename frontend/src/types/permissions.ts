export const Permissions = {
  // ACADEMICS
  VIEW_ACADEMICS: 'academics:view',
  MANAGE_ACADEMICS: 'academics:manage',
  MANAGE_CLASSES: 'academics:manage_classes',
  MANAGE_SUBJECTS: 'academics:manage_subjects',
  RECORD_GRADES: 'academics:record_grades',
  APPROVE_GRADES: 'academics:approve_grades',
  REOPEN_GRADES: 'academics:reopen_grades',
  VIEW_LESSON_LOGS: 'academics:view_lesson_logs',
  RECORD_LESSON_LOG: 'academics:record_lesson_log',
  REVIEW_LESSON_LOG: 'academics:review_lesson_log',
  GENERATE_REPORT_CARDS: 'academics:generate_report_cards',
  PUBLISH_REPORT_CARDS: 'academics:publish_report_cards',
  UNPUBLISH_REPORT_CARDS: 'academics:unpublish_report_cards',
  MANAGE_CALENDAR: 'academics:manage_calendar',
  MANAGE_ENROLMENTS: 'academics:manage_enrolments',
  MANAGE_ASSESSMENTS: 'academics:manage_assessments',
  MANAGE_REPORT_CARDS: 'academics:manage_report_cards',
  MANAGE_INTERVENTIONS: 'academics:manage_interventions',
  MANAGE_ACADEMIC_MEETINGS: 'academics:manage_academic_meetings',

  // ATTENDANCE
  VIEW_ATTENDANCE: 'attendance:view',
  RECORD_ATTENDANCE: 'attendance:record',
  MANAGE_ATTENDANCE: 'attendance:manage',
  VIEW_MISSING_REGISTERS: 'attendance:view_missing_registers',

  // FINANCE
  VIEW_FINANCE: 'finance:view',
  MANAGE_FINANCE: 'finance:manage',
  RECORD_PAYMENT: 'finance:record_payment',

  // REPORTS
  VIEW_REPORTS: 'reports:view',
  MANAGE_REPORTS: 'reports:manage',

  // ADMINISTRATION
  VIEW_ADMINISTRATION: 'admin:view',
  MANAGE_ADMINISTRATION: 'admin:manage',
  VIEW_USERS: 'admin:view_users',
  MANAGE_USERS: 'admin:manage_users',
  VIEW_ROLES: 'admin:view_roles',
  MANAGE_ROLES: 'admin:manage_roles',

  // STUDENTS & ADMISSIONS
  VIEW_STUDENTS: 'students:view',
  CREATE_STUDENTS: 'students:create',
  MANAGE_STUDENTS: 'students:manage',
  VIEW_ADMISSIONS: 'admissions:view',
  MANAGE_ADMISSIONS: 'admissions:manage',

  // COMMUNICATIONS
  VIEW_NOTIFICATIONS: 'notifications:view',
  SEND_NOTIFICATIONS: 'notifications:send',
  MANAGE_NOTIFICATIONS: 'notifications:manage',

  // TIMETABLE
  VIEW_TIMETABLE: 'timetable:view',
  MANAGE_TIMETABLE: 'timetable:manage',
  VIEW_DUTY_ROSTER: 'duty_roster:view',
  MANAGE_DUTY_ROSTER: 'duty_roster:manage',

  // DISCIPLINE & STUDENT WELFARE (Phase 14)
  VIEW_DISCIPLINE: 'discipline:view',
  CREATE_DISCIPLINE_INCIDENT: 'discipline:create',
  MANAGE_DISCIPLINE: 'discipline:manage',
  RESOLVE_DISCIPLINE: 'discipline:resolve',
  ESCALATE_DISCIPLINE: 'discipline:escalate',
  ADD_DISCIPLINE_NOTE: 'discipline:add_note',
  VIEW_STUDENT_WELFARE: 'discipline:view_welfare',

  // HR, STAFF OPERATIONS & DELEGATED AUTHORITY (Phase 15)
  VIEW_STAFF: 'staff:view',
  VIEW_STAFF_SENSITIVE: 'staff:view_sensitive',
  CREATE_STAFF: 'staff:create',
  UPDATE_STAFF: 'staff:update',
  MANAGE_STAFF: 'staff:manage',
  MANAGE_STAFF_ACCOUNTS: 'staff:manage_accounts',
  VIEW_STAFF_ACTIVITY: 'staff:view_activity',
  MANAGE_STAFF_STATUS: 'staff:manage_status',

  APPLY_LEAVE: 'leave:apply',
  VIEW_LEAVE: 'leave:view',
  MANAGE_LEAVE: 'leave:manage',

  CREATE_DELEGATION: 'delegation:create',
  REVOKE_DELEGATION: 'delegation:revoke',
  VIEW_DELEGATIONS: 'delegation:view',

  // PAYROLL, STAFF COMPENSATION & PAYROLL CONTROLS (Phase 16)
  VIEW_PAYROLL: 'payroll:view',
  VIEW_PAYROLL_SENSITIVE: 'payroll:view_sensitive',
  CREATE_PAYROLL: 'payroll:create',
  CALCULATE_PAYROLL: 'payroll:calculate',
  REVIEW_PAYROLL: 'payroll:review',
  APPROVE_PAYROLL: 'payroll:approve',
  FINALIZE_PAYROLL: 'payroll:finalize',
  POST_PAYROLL: 'payroll:post',
  MANAGE_COMPENSATION: 'payroll:manage_compensation',
  VIEW_OWN_PAYSLIP: 'payroll:view_own_payslip',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

export interface ResourceScope {
  tenantId: string;
  classId?: string;
  departmentId?: string;
  subjectId?: string;
  studentId?: string;
  incidentId?: string;
  staffId?: string;
  leaveRequestId?: string;
  delegationId?: string;
  payrollPeriodId?: string;
  payrollRecordId?: string;
  compensationProfileId?: string;
}
