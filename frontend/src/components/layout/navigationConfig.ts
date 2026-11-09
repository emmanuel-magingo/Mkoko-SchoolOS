import React from 'react';
import {
  Activity,
  Banknote,
  Bell,
  BookMarked,
  BookOpen,
  Boxes,
  Building,
  Calendar,
  CalendarCheck,
  CalendarRange,
  Clock,
  Coins,
  CreditCard,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HardDrive,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Palette,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { Permissions, Permission } from '../../types/permissions';
import { User, Tenant } from '../../types';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
  end?: boolean;
  module?: string;
  badge?: string | number;
  keywords: string[];
}

export interface NavGroupConfig {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItemConfig[];
  isStandalone?: boolean;
  show?: boolean;
}

export interface NavigationContextParams {
  user: User | null;
  tenant: Tenant | null;
  hasPermission: (permission: Permission) => boolean;
}

export function isItemActive(to: string, end?: boolean, pathname: string = ''): boolean {
  if (end || to === '/' || to === '/platform') {
    return pathname === to;
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function isGroupActive(group: NavGroupConfig, pathname: string): boolean {
  if (group.id === 'academics') {
    return pathname.startsWith('/academics');
  }
  return group.items.some((item) => isItemActive(item.to, item.end, pathname));
}

/**
 * Builds the 7 Hick's Law-oriented school navigation groups
 * based on the user's verified permissions and role.
 */
export function getSchoolNavGroups({
  user,
  tenant,
  hasPermission,
}: NavigationContextParams): NavGroupConfig[] {
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const hasSchoolTenant = Boolean(tenant) && !isPlatformAdmin;
  const isTeacher = user?.role === 'TEACHER';

  const userRoleStr = (user?.role as string) || '';
  const isClassTeacher = Boolean(
    user?.isClassTeacher ||
    (user?.assignedClassesAsTeacher && user.assignedClassesAsTeacher.length > 0)
  );

  const isAcademicAdminRole =
    userRoleStr === 'ACADEMIC_MASTER' ||
    userRoleStr === 'SENIOR_ACADEMIC_MASTER' ||
    userRoleStr === 'HEADMASTER' ||
    userRoleStr === 'SCHOOL_ADMIN' ||
    userRoleStr === 'ADMIN' ||
    (user as any)?.academicRole === 'ACADEMIC_MASTER';

  const isAcademicMasterRole =
    isAcademicAdminRole ||
    userRoleStr === 'HEAD_OF_DEPARTMENT' ||
    (user as any)?.academicRole === 'HEAD_OF_DEPARTMENT';

  const isDeptAdminRole =
    isAcademicAdminRole ||
    userRoleStr === 'HEAD_OF_DEPARTMENT' ||
    (user as any)?.academicRole === 'HEAD_OF_DEPARTMENT';

  const canAccessFinance = hasSchoolTenant && hasPermission(Permissions.VIEW_FINANCE);
  const canAccessAcademics =
    hasSchoolTenant &&
    (hasPermission(Permissions.VIEW_ACADEMICS) ||
      hasPermission(Permissions.MANAGE_ACADEMICS) ||
      hasPermission(Permissions.MANAGE_CLASSES) ||
      hasPermission(Permissions.MANAGE_SUBJECTS) ||
      isAcademicMasterRole);
  const canAccessDepartments = hasSchoolTenant && isDeptAdminRole;
  const canAccessClasses =
    hasSchoolTenant &&
    (hasPermission(Permissions.MANAGE_CLASSES) || hasPermission(Permissions.VIEW_ACADEMICS) || isAcademicMasterRole);
  const canAccessSubjects =
    hasSchoolTenant &&
    (hasPermission(Permissions.MANAGE_SUBJECTS) || hasPermission(Permissions.VIEW_ACADEMICS) || isAcademicMasterRole);
  const canAccessEnrolments =
    hasSchoolTenant &&
    (hasPermission(Permissions.MANAGE_ENROLMENTS) ||
      hasPermission(Permissions.VIEW_STUDENTS) ||
      hasPermission(Permissions.VIEW_ACADEMICS));
  const canAccessTimetable =
    hasSchoolTenant &&
    (hasPermission(Permissions.MANAGE_TIMETABLE) ||
      hasPermission(Permissions.VIEW_TIMETABLE) ||
      hasPermission(Permissions.VIEW_ACADEMICS));
  const canAccessLessons =
    hasSchoolTenant &&
    (hasPermission(Permissions.VIEW_LESSON_LOGS) ||
      hasPermission(Permissions.RECORD_LESSON_LOG));
  const canAccessAttendance =
    hasSchoolTenant &&
    (isAcademicAdminRole ||
      (!isTeacher &&
        (hasPermission(Permissions.MANAGE_ATTENDANCE) ||
          hasPermission(Permissions.VIEW_ATTENDANCE) ||
          hasPermission(Permissions.VIEW_ACADEMICS))) ||
      (isTeacher && isClassTeacher));
  const canAccessMarksEntry =
    hasSchoolTenant &&
    (hasPermission(Permissions.MANAGE_ASSESSMENTS) ||
      hasPermission(Permissions.RECORD_GRADES) ||
      hasPermission(Permissions.APPROVE_GRADES) ||
      hasPermission(Permissions.VIEW_ACADEMICS));
  const canAccessMarkCenter =
    hasSchoolTenant &&
    (isAcademicAdminRole ||
      isDeptAdminRole ||
      hasPermission(Permissions.MANAGE_ASSESSMENTS) ||
      hasPermission(Permissions.APPROVE_GRADES));
  const canAccessReportCards =
    hasSchoolTenant &&
    (hasPermission(Permissions.MANAGE_REPORT_CARDS) ||
      hasPermission(Permissions.GENERATE_REPORT_CARDS) ||
      hasPermission(Permissions.PUBLISH_REPORT_CARDS) ||
      hasPermission(Permissions.VIEW_ACADEMICS));
  const canAccessAdministration = hasSchoolTenant && hasPermission(Permissions.VIEW_ADMINISTRATION);
  const canViewUsers = hasSchoolTenant && hasPermission(Permissions.VIEW_USERS);
  const canViewRoles = hasSchoolTenant && hasPermission(Permissions.VIEW_ROLES);
  const canAccessReports = hasSchoolTenant && hasPermission(Permissions.VIEW_REPORTS);
  const canAccessStaff =
    hasSchoolTenant &&
    (hasPermission(Permissions.VIEW_STAFF) || hasPermission(Permissions.MANAGE_STAFF));
  const canAccessPeople = hasSchoolTenant && (canAccessStaff || canViewUsers || canViewRoles);
  const canAccessPayroll =
    hasSchoolTenant &&
    (hasPermission(Permissions.VIEW_PAYROLL) || hasPermission(Permissions.MANAGE_COMPENSATION));
  const canAccessCalendar =
    hasSchoolTenant &&
    (hasPermission(Permissions.MANAGE_CALENDAR) || hasPermission(Permissions.VIEW_ADMINISTRATION));
  const canAccessNotifications =
    hasSchoolTenant && hasPermission(Permissions.VIEW_NOTIFICATIONS);
  const canAccessAudit =
    hasSchoolTenant &&
    hasPermission(Permissions.VIEW_ADMINISTRATION) &&
    ['SCHOOL_ADMIN', 'HEADMASTER'].includes(user?.role || '');

  const canAccessCommunications =
    hasSchoolTenant &&
    (hasPermission(Permissions.VIEW_NOTIFICATIONS) || hasPermission(Permissions.VIEW_REPORTS));

  return [
    // 1. Overview (High-frequency direct destination)
    {
      id: 'overview',
      title: 'Overview',
      icon: LayoutDashboard,
      isStandalone: true,
      show: user?.role !== 'SENIOR_ACADEMIC_MASTER' && !isTeacher,
      items: [
        {
          to: '/',
          label: 'Dashboard',
          icon: LayoutDashboard,
          show: user?.role !== 'SENIOR_ACADEMIC_MASTER' && !isTeacher,
          end: true,
          keywords: ['home', 'overview', 'main', 'summary', 'metrics', 'stats'],
        },
      ],
    },

    // 3. Academics (Collapsible Accordion Section)
    {
      id: 'academics',
      title: 'Academics',
      icon: GraduationCap,
      show: canAccessAcademics,
      items: [
        {
          to: '/academics',
          label: 'Academic Dashboard',
          icon: LayoutDashboard,
          show: canAccessAcademics && !isTeacher,
          end: true,
          module: 'academics',
          keywords: ['academics', 'overview', 'dashboard', 'summary'],
        },
        {
          to: '/academics/structure/years-terms',
          label: 'Academic Calendar',
          icon: Calendar,
          show: canAccessAcademics && !isTeacher,
          module: 'academics',
          keywords: ['academic calendar', 'years', 'terms', 'term dates', 'mid-term break', 'calendar'],
        },
        {
          to: '/academics/departments',
          label: 'Academic Departments',
          icon: Building,
          show: canAccessDepartments,
          module: 'academics',
          keywords: ['departments', 'academic departments', 'hod', 'faculty', 'faculties'],
        },
        {
          to: '/academics/structure/classes',
          label: 'Classes & Streams',
          icon: GraduationCap,
          show: canAccessClasses && !isTeacher,
          module: 'academics',
          keywords: ['classes', 'streams', 'forms', 'sections', 'classrooms'],
        },
        {
          to: '/academics/structure/subjects',
          label: 'Subjects & Curriculum',
          icon: BookOpen,
          show: canAccessSubjects && (!isTeacher || hasPermission(Permissions.MANAGE_SUBJECTS)),
          module: 'academics',
          keywords: ['subjects', 'curriculum', 'courses', 'syllabus'],
        },
        {
          to: '/academics/structure/enrolments',
          label: 'Student Enrolments',
          icon: UserCheck,
          show: canAccessEnrolments && (!isTeacher || hasPermission(Permissions.MANAGE_ENROLMENTS)),
          module: 'academics',
          keywords: ['students', 'enrolments', 'admissions', 'roll', 'class list'],
        },
        {
          to: '/academics/operations/timetable',
          label: 'Timetable',
          icon: Clock,
          show: canAccessTimetable,
          module: 'academics',
          keywords: ['timetable', 'schedule', 'periods', 'routine', 'my timetable'],
        },
        {
          to: '/academics/operations/duty-roster',
          label: 'Teacher on Duty (TOD)',
          icon: CalendarRange,
          show:
            hasSchoolTenant &&
            (hasPermission(Permissions.MANAGE_DUTY_ROSTER) ||
              isAcademicMasterRole ||
              (isTeacher
                ? Boolean((user as any)?.isTeacherOnDuty || hasPermission(Permissions.VIEW_DUTY_ROSTER))
                : hasPermission(Permissions.VIEW_DUTY_ROSTER))),
          module: 'academics',
          keywords: ['duty', 'tod', 'teacher on duty', 'prep', 'night prep', 'morning prep', 'roster'],
        },
        {
          to: '/academics/operations/lesson-logs',
          label: 'Lessons',
          icon: BookMarked,
          show: canAccessLessons,
          module: 'academics',
          keywords: ['lessons', 'lesson logs', 'teaching', 'instruction', 'curriculum log', 'classes'],
        },
        {
          to: '/academics/operations/attendance',
          label: 'Attendance',
          icon: CalendarCheck,
          show: canAccessAttendance,
          module: 'academics',
          keywords: ['attendance', 'roll call', 'presence', 'registers'],
        },
        {
          to: '/academics/mark-center',
          label: 'Mark Center',
          icon: FileSpreadsheet,
          show: canAccessMarkCenter,
          module: 'academics',
          keywords: ['mark center', 'examinations', 'grading', 'timetable', 'moderation', 'approval', 'results'],
        },
        {
          to: '/academics/assessments/marks-entry',
          label: 'Marks Entry',
          icon: FileSpreadsheet,
          show: canAccessMarksEntry,
          module: 'academics',
          keywords: ['marks', 'scores', 'grades', 'entry', 'results', 'grading'],
        },
        {
          to: '/academics/assessments/report-cards',
          label: 'Report Cards',
          icon: FileText,
          show: canAccessReportCards && !isTeacher,
          module: 'academics',
          keywords: ['report cards', 'transcripts', 'terminal reports', 'results', 'rankings'],
        },
      ],
    },

    // 3. Finance & Billing
    {
      id: 'finance',
      title: 'Finance & Billing',
      icon: Coins,
      show: canAccessFinance || canAccessPayroll,
      items: [
        {
          to: '/finance',
          label: 'Finance Overview',
          icon: Coins,
          show: canAccessFinance,
          end: true,
          module: 'finance',
          keywords: ['fees', 'billing', 'balances', 'revenue', 'overview'],
        },
        {
          to: '/finance/fee-categories',
          label: 'Fee Categories',
          icon: Banknote,
          show: canAccessFinance,
          module: 'finance',
          keywords: ['tuition', 'boarding', 'transport', 'categories'],
        },
        {
          to: '/finance/fee-structures',
          label: 'Fee Structures',
          icon: FileSpreadsheet,
          show: canAccessFinance,
          module: 'finance',
          keywords: ['fee schedules', 'breakdown', 'grades', 'terms'],
        },
        {
          to: '/finance/invoices',
          label: 'Invoices',
          icon: Receipt,
          show: canAccessFinance,
          module: 'finance',
          keywords: ['bills', 'due', 'statements', 'invoicing'],
        },
        {
          to: '/finance/payments',
          label: 'Payments',
          icon: CreditCard,
          show: canAccessFinance,
          module: 'finance',
          keywords: ['receipts', 'collections', 'bank', 'cash', 'reconciliation'],
        },
        {
          to: '/payroll',
          label: 'Payroll Overview',
          icon: Wallet,
          show: canAccessPayroll,
          end: true,
          module: 'payroll',
          keywords: ['salaries', 'wages', 'pay runs', 'disbursement'],
        },
        {
          to: '/payroll/periods',
          label: 'Payroll Periods',
          icon: CalendarRange,
          show: canAccessPayroll,
          module: 'payroll',
          keywords: ['pay cycles', 'months', 'payroll schedule'],
        },
        {
          to: '/payroll/compensation',
          label: 'Compensation',
          icon: Coins,
          show: canAccessPayroll,
          module: 'payroll',
          keywords: ['salary structures', 'allowances', 'deductions', 'pay scales'],
        },
        {
          to: '/finance/reports',
          label: 'Financial Reports',
          icon: Activity,
          show: canAccessFinance,
          module: 'finance',
          keywords: ['aging', 'defaulters', 'cash flow', 'collection report'],
        },
      ],
    },

    {
      id: 'people',
      title: 'Staff & Users',
      icon: Users,
      isStandalone: true,
      show: canAccessPeople,
      items: [
        {
          to: '/people',
          label: 'Staff & Users',
          icon: Users,
          show: canAccessPeople,
          keywords: ['teachers', 'employees', 'faculty', 'personnel', 'staff list', 'accounts', 'users', 'roles', 'admin'],
        },
      ],
    },

    // 5. Communications & Reports
    {
      id: 'communications',
      title: 'Communications & Reports',
      icon: Megaphone,
      show: canAccessCommunications && !isTeacher,
      items: [
        {
          to: '/reports',
          label: 'Reports & Analytics',
          icon: Activity,
          show: canAccessReports,
          module: 'reports',
          keywords: ['analytics', 'exports', 'school statistics', 'insights'],
        },
        {
          to: '/notifications',
          label: 'Notifications',
          icon: Bell,
          show: canAccessNotifications,
          end: true,
          module: 'communications',
          keywords: ['sms', 'alerts', 'messages', 'broadcasts'],
        },
        {
          to: '/notifications/announcements',
          label: 'Announcements',
          icon: Megaphone,
          show: canAccessNotifications,
          module: 'communications',
          keywords: ['bulletin', 'circular', 'news', 'notice board'],
        },
      ],
    },

    // 6. Administration & Security
    {
      id: 'administration',
      title: 'Administration & Security',
      icon: Settings,
      show: canAccessAdministration,
      items: [
        {
          to: '/administration/branding',
          label: 'School Branding',
          icon: Palette,
          show: hasPermission(Permissions.MANAGE_ADMINISTRATION),
          module: 'administration',
          keywords: ['school identity', 'logo', 'colors', 'stamp', 'signatures', 'documents'],
        },
        {
          to: '/administration',
          label: 'School Settings',
          icon: Settings,
          show: canAccessAdministration,
          end: true,
          module: 'administration',
          keywords: ['configuration', 'school profile', 'general settings', 'preferences'],
        },
        {
          to: '/administration/calendar',
          label: 'Academic Calendar',
          icon: CalendarRange,
          show: canAccessCalendar,
          module: 'administration',
          keywords: ['term dates', 'holidays', 'academic calendar', 'events', 'terms', 'breaks'],
        },
        {
          to: '/audit-logs',
          label: 'Audit Logs',
          icon: ShieldAlert,
          show: canAccessAudit,
          keywords: ['security', 'audit trail', 'tracking', 'system changes', 'compliance'],
        },
      ],
    },
  ];
}

/**
 * Builds the Platform Admin navigation groups.
 */
export function getPlatformNavGroups(): NavGroupConfig[] {
  return [
    {
      id: 'platform_overview',
      title: 'Platform Overview',
      icon: LayoutDashboard,
      items: [
        {
          to: '/platform',
          label: 'Platform Dashboard',
          icon: LayoutDashboard,
          show: true,
          end: true,
          keywords: ['home', 'overview', 'stats', 'metrics'],
        },
        {
          to: '/platform/analytics',
          label: 'Platform Analytics',
          icon: TrendingUp,
          show: true,
          keywords: ['growth', 'usage', 'trends', 'metrics'],
        },
      ],
    },
    {
      id: 'platform_tenants',
      title: 'Tenants & Plans',
      icon: Building,
      items: [
        {
          to: '/platform/tenants',
          label: 'Manage Tenants',
          icon: Building,
          show: true,
          keywords: ['schools', 'organizations', 'institutions', 'clients'],
        },
        {
          to: '/platform/subscriptions',
          label: 'Plans & Subscriptions',
          icon: CreditCard,
          show: true,
          keywords: ['billing', 'tiers', 'pricing', 'plans'],
        },
        {
          to: '/platform/modules',
          label: 'Modules & Entitlements',
          icon: Boxes,
          show: true,
          keywords: ['features', 'licensing', 'packages', 'entitlements'],
        },
      ],
    },
    {
      id: 'platform_security',
      title: 'Security & Governance',
      icon: KeyRound,
      items: [
        {
          to: '/platform/administrators',
          label: 'Platform Users',
          icon: Users,
          show: true,
          keywords: ['superadmins', 'platform admins', 'accounts'],
        },
        {
          to: '/platform/roles-permissions',
          label: 'Roles & Permissions',
          icon: KeyRound,
          show: true,
          keywords: ['platform roles', 'access control', 'privileges'],
        },
        {
          to: '/platform/security',
          label: 'Security Center',
          icon: ShieldCheck,
          show: true,
          keywords: ['hardening', 'rls', 'firewall', 'protection'],
        },
        {
          to: '/platform/audit-logs',
          label: 'Audit Logs',
          icon: ShieldAlert,
          show: true,
          keywords: ['audit trail', 'platform mutations', 'activity'],
        },
      ],
    },
    {
      id: 'platform_operations',
      title: 'System & Operations',
      icon: Settings,
      items: [
        {
          to: '/platform/system-health',
          label: 'System Health',
          icon: HeartPulse,
          show: true,
          keywords: ['uptime', 'latency', 'services', 'diagnostics'],
        },
        {
          to: '/platform/backup',
          label: 'Backup & Recovery',
          icon: HardDrive,
          show: true,
          keywords: ['database backup', 'restore', 'snapshots', 'disaster recovery'],
        },
        {
          to: '/platform/support',
          label: 'Tenant Support',
          icon: LifeBuoy,
          show: true,
          keywords: ['tickets', 'helpdesk', 'assistance'],
        },
        {
          to: '/platform/announcements',
          label: 'Announcements',
          icon: Megaphone,
          show: true,
          keywords: ['broadcasts', 'maintenance notices', 'bulletins'],
        },
        {
          to: '/platform/branding',
          label: 'Branding & Themes',
          icon: Palette,
          show: true,
          keywords: ['theme', 'logo', 'colors', 'customization'],
        },
        {
          to: '/platform/settings',
          label: 'Platform Settings',
          icon: Settings,
          show: true,
          keywords: ['system configuration', 'environment', 'preferences'],
        },
      ],
    },
  ];
}

/**
 * Filters navigation groups and their items based on authorization,
 * module entitlements, and optional search query.
 */
export function filterNavGroups(
  groups: NavGroupConfig[],
  searchQuery: string,
  enabledModules: Set<string>,
  isPlatformAdmin: boolean,
  entitlementsLoaded: boolean
): NavGroupConfig[] {
  const query = searchQuery.trim().toLowerCase();

  return groups
    .filter((group) => group.show !== false)
    .map((group) => {
      // Filter items by authorization & entitlements
      const visibleItems = group.items.filter((item) => {
        if (!item.show) return false;
        if (isPlatformAdmin) return true;
        if (!item.module) return true;
        return entitlementsLoaded && enabledModules.has(item.module);
      });

      // Filter items by search query if present
      const matchedItems = query
        ? visibleItems.filter((item) => {
            const matchLabel = item.label.toLowerCase().includes(query);
            const matchTo = item.to.toLowerCase().includes(query);
            const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(query));
            return matchLabel || matchTo || matchKeywords;
          })
        : visibleItems;

      return {
        ...group,
        items: matchedItems,
      };
    })
    .filter((group) => group.items.length > 0);
}
