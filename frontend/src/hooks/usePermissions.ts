import { useAuth } from '../contexts/AuthContext';
import { Permission, Permissions } from '../types/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    const rolePermissions: Record<string, Permission[]> = {
      PLATFORM_ADMIN: [],
      ADMIN: [
        Permissions.VIEW_ACADEMICS, Permissions.MANAGE_ACADEMICS, Permissions.MANAGE_CLASSES, Permissions.MANAGE_SUBJECTS,
        Permissions.MANAGE_ENROLMENTS, Permissions.MANAGE_ASSESSMENTS, Permissions.MANAGE_REPORT_CARDS,
        Permissions.MANAGE_INTERVENTIONS, Permissions.MANAGE_ACADEMIC_MEETINGS,
        Permissions.VIEW_ATTENDANCE, Permissions.RECORD_ATTENDANCE, Permissions.MANAGE_ATTENDANCE, Permissions.VIEW_MISSING_REGISTERS,
        Permissions.VIEW_FINANCE, Permissions.MANAGE_FINANCE, Permissions.RECORD_PAYMENT,
        Permissions.VIEW_REPORTS, Permissions.MANAGE_REPORTS,
        Permissions.VIEW_ADMINISTRATION, Permissions.MANAGE_ADMINISTRATION, Permissions.VIEW_USERS,
        Permissions.MANAGE_USERS, Permissions.VIEW_ROLES, Permissions.MANAGE_ROLES,
        Permissions.VIEW_NOTIFICATIONS, Permissions.SEND_NOTIFICATIONS, Permissions.MANAGE_NOTIFICATIONS,
        Permissions.VIEW_STUDENTS, Permissions.CREATE_STUDENTS, Permissions.MANAGE_STUDENTS, Permissions.VIEW_ADMISSIONS, Permissions.MANAGE_ADMISSIONS,
        Permissions.VIEW_TIMETABLE, Permissions.MANAGE_TIMETABLE, Permissions.VIEW_DUTY_ROSTER, Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE,
        Permissions.VIEW_LESSON_LOGS, Permissions.RECORD_LESSON_LOG, Permissions.REVIEW_LESSON_LOG,
        Permissions.MANAGE_CALENDAR, Permissions.GENERATE_REPORT_CARDS, Permissions.PUBLISH_REPORT_CARDS,
        Permissions.VIEW_STAFF, Permissions.VIEW_STAFF_SENSITIVE, Permissions.CREATE_STAFF, Permissions.UPDATE_STAFF,
        Permissions.MANAGE_STAFF, Permissions.MANAGE_STAFF_ACCOUNTS, Permissions.VIEW_STAFF_ACTIVITY, Permissions.MANAGE_STAFF_STATUS,
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE, Permissions.VIEW_DELEGATIONS,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      SCHOOL_ADMIN: [
        Permissions.VIEW_ACADEMICS, Permissions.MANAGE_ACADEMICS, Permissions.MANAGE_CLASSES, Permissions.MANAGE_SUBJECTS,
        Permissions.MANAGE_ENROLMENTS, Permissions.MANAGE_ASSESSMENTS, Permissions.MANAGE_REPORT_CARDS,
        Permissions.MANAGE_INTERVENTIONS, Permissions.MANAGE_ACADEMIC_MEETINGS,
        Permissions.VIEW_ATTENDANCE, Permissions.RECORD_ATTENDANCE, Permissions.MANAGE_ATTENDANCE, Permissions.VIEW_MISSING_REGISTERS,
        Permissions.VIEW_FINANCE, Permissions.MANAGE_FINANCE, Permissions.RECORD_PAYMENT,
        Permissions.VIEW_REPORTS, Permissions.MANAGE_REPORTS,
        Permissions.VIEW_ADMINISTRATION, Permissions.MANAGE_ADMINISTRATION, Permissions.VIEW_USERS,
        Permissions.MANAGE_USERS, Permissions.VIEW_ROLES, Permissions.MANAGE_ROLES,
        Permissions.VIEW_NOTIFICATIONS, Permissions.SEND_NOTIFICATIONS, Permissions.MANAGE_NOTIFICATIONS,
        Permissions.VIEW_STUDENTS, Permissions.CREATE_STUDENTS, Permissions.MANAGE_STUDENTS, Permissions.VIEW_ADMISSIONS, Permissions.MANAGE_ADMISSIONS,
        Permissions.VIEW_TIMETABLE, Permissions.MANAGE_TIMETABLE, Permissions.VIEW_DUTY_ROSTER, Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE,
        // Academic v2
        Permissions.VIEW_LESSON_LOGS, Permissions.RECORD_LESSON_LOG, Permissions.REVIEW_LESSON_LOG,
        Permissions.MANAGE_CALENDAR, Permissions.GENERATE_REPORT_CARDS, Permissions.PUBLISH_REPORT_CARDS,
        // Phase 15: Full staff administration
        Permissions.VIEW_STAFF, Permissions.VIEW_STAFF_SENSITIVE, Permissions.CREATE_STAFF, Permissions.UPDATE_STAFF,
        Permissions.MANAGE_STAFF, Permissions.MANAGE_STAFF_ACCOUNTS, Permissions.VIEW_STAFF_ACTIVITY, Permissions.MANAGE_STAFF_STATUS,
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE, Permissions.VIEW_DELEGATIONS,
        // Phase 16
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      HEADMASTER: [
        Permissions.VIEW_ACADEMICS, Permissions.MANAGE_ACADEMICS, Permissions.MANAGE_CLASSES, Permissions.MANAGE_SUBJECTS,
        Permissions.MANAGE_ENROLMENTS, Permissions.MANAGE_ASSESSMENTS, Permissions.MANAGE_REPORT_CARDS,
        Permissions.MANAGE_INTERVENTIONS, Permissions.MANAGE_ACADEMIC_MEETINGS,
        Permissions.VIEW_ATTENDANCE, Permissions.RECORD_ATTENDANCE, Permissions.MANAGE_ATTENDANCE,
        Permissions.VIEW_FINANCE,
        Permissions.VIEW_REPORTS, Permissions.MANAGE_REPORTS, Permissions.VIEW_ADMINISTRATION,
        Permissions.VIEW_NOTIFICATIONS, Permissions.SEND_NOTIFICATIONS, Permissions.MANAGE_NOTIFICATIONS,
        Permissions.VIEW_STUDENTS, Permissions.CREATE_STUDENTS, Permissions.MANAGE_STUDENTS, Permissions.VIEW_ADMISSIONS, Permissions.MANAGE_ADMISSIONS,
        Permissions.VIEW_TIMETABLE, Permissions.MANAGE_TIMETABLE, Permissions.VIEW_DUTY_ROSTER, Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE, Permissions.CREATE_DISCIPLINE_INCIDENT, Permissions.MANAGE_DISCIPLINE,
        Permissions.RESOLVE_DISCIPLINE, Permissions.ESCALATE_DISCIPLINE, Permissions.ADD_DISCIPLINE_NOTE, Permissions.VIEW_STUDENT_WELFARE,
        // Academic v2
        Permissions.APPROVE_GRADES, Permissions.REOPEN_GRADES, Permissions.VIEW_LESSON_LOGS, Permissions.RECORD_LESSON_LOG, Permissions.REVIEW_LESSON_LOG,
        Permissions.GENERATE_REPORT_CARDS, Permissions.PUBLISH_REPORT_CARDS, Permissions.UNPUBLISH_REPORT_CARDS, Permissions.MANAGE_CALENDAR, Permissions.VIEW_MISSING_REGISTERS,
        // Phase 15: Leave management, delegations (staff management granted only when explicitly assigned)
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE, Permissions.MANAGE_LEAVE,
        Permissions.CREATE_DELEGATION, Permissions.REVOKE_DELEGATION, Permissions.VIEW_DELEGATIONS,
        // Phase 16
        Permissions.VIEW_PAYROLL, Permissions.VIEW_PAYROLL_SENSITIVE, Permissions.REVIEW_PAYROLL, Permissions.APPROVE_PAYROLL, Permissions.FINALIZE_PAYROLL, Permissions.POST_PAYROLL, Permissions.VIEW_OWN_PAYSLIP,
      ],
      SECOND_MASTER: [
        Permissions.VIEW_ACADEMICS, Permissions.VIEW_ATTENDANCE, Permissions.MANAGE_ATTENDANCE, Permissions.VIEW_MISSING_REGISTERS,
        Permissions.VIEW_REPORTS, Permissions.VIEW_ADMINISTRATION,
        Permissions.VIEW_NOTIFICATIONS, Permissions.SEND_NOTIFICATIONS,
        Permissions.VIEW_STUDENTS, Permissions.VIEW_ADMISSIONS,
        Permissions.VIEW_TIMETABLE, Permissions.MANAGE_TIMETABLE, Permissions.VIEW_DUTY_ROSTER, Permissions.MANAGE_DUTY_ROSTER,
        Permissions.VIEW_DISCIPLINE, Permissions.CREATE_DISCIPLINE_INCIDENT, Permissions.MANAGE_DISCIPLINE,
        Permissions.RESOLVE_DISCIPLINE, Permissions.ESCALATE_DISCIPLINE, Permissions.ADD_DISCIPLINE_NOTE,
        // Academic v2
        Permissions.VIEW_LESSON_LOGS,
        // Phase 15: Own leave, routine leave management, view delegations (staff directory granted only when explicitly assigned)
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE, Permissions.MANAGE_LEAVE,
        Permissions.VIEW_DELEGATIONS,
        // Phase 16
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      ACADEMIC_MASTER: [
        // Exhaustive Academic Permissions
        Permissions.VIEW_ACADEMICS, Permissions.MANAGE_ACADEMICS, Permissions.MANAGE_CLASSES, Permissions.MANAGE_SUBJECTS,
        Permissions.MANAGE_ENROLMENTS, Permissions.MANAGE_ASSESSMENTS, Permissions.MANAGE_REPORT_CARDS,
        Permissions.MANAGE_INTERVENTIONS, Permissions.MANAGE_ACADEMIC_MEETINGS,
        Permissions.RECORD_GRADES, Permissions.APPROVE_GRADES, Permissions.REOPEN_GRADES,
        Permissions.VIEW_LESSON_LOGS, Permissions.RECORD_LESSON_LOG, Permissions.REVIEW_LESSON_LOG,
        Permissions.GENERATE_REPORT_CARDS, Permissions.PUBLISH_REPORT_CARDS, Permissions.UNPUBLISH_REPORT_CARDS,
        Permissions.MANAGE_CALENDAR,
        // Attendance
        Permissions.VIEW_ATTENDANCE, Permissions.RECORD_ATTENDANCE, Permissions.MANAGE_ATTENDANCE, Permissions.VIEW_MISSING_REGISTERS,
        // Timetable & Duty Roster
        Permissions.VIEW_TIMETABLE, Permissions.MANAGE_TIMETABLE, Permissions.VIEW_DUTY_ROSTER, Permissions.MANAGE_DUTY_ROSTER,
        // Students & Admissions
        Permissions.VIEW_STUDENTS, Permissions.MANAGE_STUDENTS, Permissions.VIEW_ADMISSIONS,
        // Discipline & Student Welfare
        Permissions.VIEW_DISCIPLINE, Permissions.CREATE_DISCIPLINE_INCIDENT, Permissions.ADD_DISCIPLINE_NOTE, Permissions.VIEW_STUDENT_WELFARE,
        // Reports & Notifications
        Permissions.VIEW_REPORTS, Permissions.MANAGE_REPORTS,
        Permissions.VIEW_NOTIFICATIONS, Permissions.SEND_NOTIFICATIONS,
        // Phase 15: Own leave, view delegations
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE, Permissions.VIEW_DELEGATIONS,
        // Phase 16
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      SENIOR_ACADEMIC_MASTER: [
        // Exhaustive Academic Permissions
        Permissions.VIEW_ACADEMICS, Permissions.MANAGE_ACADEMICS, Permissions.MANAGE_CLASSES, Permissions.MANAGE_SUBJECTS,
        Permissions.MANAGE_ENROLMENTS, Permissions.MANAGE_ASSESSMENTS, Permissions.MANAGE_REPORT_CARDS,
        Permissions.MANAGE_INTERVENTIONS, Permissions.MANAGE_ACADEMIC_MEETINGS,
        Permissions.RECORD_GRADES, Permissions.APPROVE_GRADES, Permissions.REOPEN_GRADES,
        Permissions.VIEW_LESSON_LOGS, Permissions.RECORD_LESSON_LOG, Permissions.REVIEW_LESSON_LOG,
        Permissions.GENERATE_REPORT_CARDS, Permissions.PUBLISH_REPORT_CARDS, Permissions.UNPUBLISH_REPORT_CARDS,
        Permissions.MANAGE_CALENDAR,
        // Attendance
        Permissions.VIEW_ATTENDANCE, Permissions.RECORD_ATTENDANCE, Permissions.MANAGE_ATTENDANCE, Permissions.VIEW_MISSING_REGISTERS,
        // Timetable & Duty Roster
        Permissions.VIEW_TIMETABLE, Permissions.MANAGE_TIMETABLE, Permissions.VIEW_DUTY_ROSTER, Permissions.MANAGE_DUTY_ROSTER,
        // Students & Admissions
        Permissions.VIEW_STUDENTS, Permissions.MANAGE_STUDENTS, Permissions.VIEW_ADMISSIONS,
        // Discipline & Student Welfare
        Permissions.VIEW_DISCIPLINE, Permissions.CREATE_DISCIPLINE_INCIDENT, Permissions.ADD_DISCIPLINE_NOTE, Permissions.VIEW_STUDENT_WELFARE,
        // Reports & Notifications
        Permissions.VIEW_REPORTS, Permissions.MANAGE_REPORTS,
        Permissions.VIEW_NOTIFICATIONS, Permissions.SEND_NOTIFICATIONS,
        // Phase 15: Own leave, view delegations
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE, Permissions.VIEW_DELEGATIONS,
        // Phase 16
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      HEAD_OF_DEPARTMENT: [
        Permissions.VIEW_ACADEMICS, Permissions.MANAGE_ACADEMICS, Permissions.MANAGE_CLASSES, Permissions.MANAGE_SUBJECTS,
        Permissions.RECORD_GRADES, Permissions.APPROVE_GRADES,
        Permissions.VIEW_LESSON_LOGS, Permissions.RECORD_LESSON_LOG, Permissions.REVIEW_LESSON_LOG,
        Permissions.VIEW_ATTENDANCE, Permissions.RECORD_ATTENDANCE,
        Permissions.VIEW_TIMETABLE, Permissions.VIEW_DUTY_ROSTER,
        Permissions.VIEW_STUDENTS,
        Permissions.VIEW_DISCIPLINE, Permissions.CREATE_DISCIPLINE_INCIDENT, Permissions.ADD_DISCIPLINE_NOTE,
        Permissions.VIEW_NOTIFICATIONS,
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE,
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      SCHOOL_MANAGER: [
        Permissions.VIEW_FINANCE, Permissions.VIEW_REPORTS, Permissions.VIEW_ADMINISTRATION, Permissions.VIEW_NOTIFICATIONS,
        Permissions.VIEW_STUDENTS, Permissions.VIEW_ADMISSIONS,
        Permissions.VIEW_TIMETABLE, Permissions.VIEW_DUTY_ROSTER,
        // Phase 15: Leave management, view delegations (staff directory granted only when explicitly assigned)
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE, Permissions.MANAGE_LEAVE,
        Permissions.VIEW_DELEGATIONS,
        // Phase 16
        Permissions.VIEW_PAYROLL, Permissions.VIEW_PAYROLL_SENSITIVE, Permissions.MANAGE_COMPENSATION, Permissions.CREATE_PAYROLL, Permissions.CALCULATE_PAYROLL, Permissions.REVIEW_PAYROLL, Permissions.VIEW_OWN_PAYSLIP,
      ],
      BURSAR: [
        Permissions.VIEW_FINANCE, Permissions.MANAGE_FINANCE, Permissions.RECORD_PAYMENT, Permissions.VIEW_REPORTS, Permissions.VIEW_NOTIFICATIONS,
        Permissions.VIEW_STUDENTS,
        Permissions.VIEW_TIMETABLE,
        // Phase 15: Own leave only (no staff directory access unless explicitly authorized)
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE,
        // Phase 16
        Permissions.VIEW_PAYROLL, Permissions.CALCULATE_PAYROLL, Permissions.REVIEW_PAYROLL, Permissions.POST_PAYROLL, Permissions.VIEW_OWN_PAYSLIP,
      ],
      SECRETARY: [
        Permissions.VIEW_ADMINISTRATION, Permissions.VIEW_ATTENDANCE, Permissions.VIEW_NOTIFICATIONS, Permissions.SEND_NOTIFICATIONS, Permissions.RECORD_PAYMENT,
        Permissions.VIEW_STUDENTS, Permissions.CREATE_STUDENTS, Permissions.VIEW_ADMISSIONS, Permissions.MANAGE_ADMISSIONS, Permissions.MANAGE_STUDENTS,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_DISCIPLINE,
        // Academic v2
        Permissions.VIEW_MISSING_REGISTERS, Permissions.GENERATE_REPORT_CARDS,
        // Phase 15: Own leave only
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE,
        // Phase 16
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      TEACHER: [
        Permissions.VIEW_ACADEMICS, Permissions.VIEW_ATTENDANCE, Permissions.VIEW_NOTIFICATIONS,
        Permissions.RECORD_GRADES, Permissions.RECORD_ATTENDANCE,
        Permissions.VIEW_STUDENTS,
        Permissions.VIEW_TIMETABLE,
        Permissions.VIEW_DISCIPLINE, Permissions.CREATE_DISCIPLINE_INCIDENT, Permissions.ADD_DISCIPLINE_NOTE,
        // Academic v2
        Permissions.RECORD_LESSON_LOG, Permissions.VIEW_LESSON_LOGS,
        // Phase 15: Own leave only (no staff directory or staff management access by default)
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE,
        // Phase 16
        Permissions.VIEW_OWN_PAYSLIP,
      ],
      STAFF: [
        Permissions.VIEW_NOTIFICATIONS, Permissions.VIEW_TIMETABLE,
        // Phase 15: Own leave only (no staff directory access by default)
        Permissions.APPLY_LEAVE, Permissions.VIEW_LEAVE,
        // Phase 16
        Permissions.VIEW_OWN_PAYSLIP,
      ],
    };

    return (
      rolePermissions[user.role]?.includes(permission) ||
      user.customPermissions?.includes(permission) ||
      (permission === Permissions.VIEW_DUTY_ROSTER && Boolean((user as any)?.isTeacherOnDuty)) ||
      false
    );
  };

  return { hasPermission };
};
