import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { FrontendDemoPage } from './pages/FrontendDemoPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { AuditGuard } from './components/audit/AuditGuard';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { PermissionGuard } from './components/common/PermissionGuard';
import { Permissions } from './types/permissions';

import { FinanceGuard } from './components/finance/FinanceGuard';
import { FinanceDashboardPage } from './pages/finance/FinanceDashboardPage';
import { FeeCategoriesPage } from './pages/finance/FeeCategoriesPage';
import { FeeStructuresPage } from './pages/finance/FeeStructuresPage';
import { CreateFeeStructurePage } from './pages/finance/CreateFeeStructurePage';
import { FeeStructureDetailPage } from './pages/finance/FeeStructureDetailPage';
import { InvoicesPage } from './pages/finance/InvoicesPage';
import { InvoiceDetailPage } from './pages/finance/InvoiceDetailPage';
import { PaymentsPage } from './pages/finance/PaymentsPage';
import { DigitalReceiptPage } from './pages/finance/DigitalReceiptPage';
import { StudentFinancialSummaryPage } from './pages/finance/StudentFinancialSummaryPage';
import { FinancialReportsPage } from './pages/finance/FinancialReportsPage';

import { AcademicsGuard } from './components/academics/AcademicsGuard';
import { AcademicProvider } from './contexts/AcademicContext';
import { AcademicDashboard } from './pages/academics/AcademicDashboard';
import { ClassesAndStreams } from './pages/academics/ClassesAndStreams';
import { StudentEnrolments } from './pages/academics/StudentEnrolments';
import { SubjectRegistryPage } from './pages/academics/SubjectRegistryPage';
import { TeacherAllocationPage } from './pages/academics/TeacherAllocationPage';
import { TimetableManagement } from './pages/academics/TimetableManagement';
import { AcademicsDashboardPage } from './pages/academics/AcademicsDashboardPage';
import { MarkCenterPage } from './pages/academics/MarkCenterPage';
import { AssessmentsPage } from './pages/academics/AssessmentsPage';
import { MarkEntryPage } from './pages/academics/MarkEntryPage';
import { LessonExecutionPage } from './pages/academics/LessonExecutionPage';
import { AttendanceEnginePage } from './pages/academics/AttendanceEnginePage';
import { AssessmentModerationPage } from './pages/academics/AssessmentModerationPage';
import { GradingPoliciesPage } from './pages/academics/GradingPoliciesPage';
import { ReportCardsPage } from './pages/academics/ReportCardsPage';
import { AcademicAnalyticsPage } from './pages/academics/AcademicAnalyticsPage';
import { AcademicInterventionsPage } from './pages/academics/AcademicInterventionsPage';
import { DisciplineAndWelfarePage } from './pages/academics/DisciplineAndWelfarePage';
import { AcademicMeetingsPage } from './pages/academics/AcademicMeetingsPage';
import { AcademicAuditPage } from './pages/academics/AcademicAuditPage';
import { AcademicCalendarPage } from './pages/academics/AcademicCalendarPage';
import { AcademicDepartmentsPage } from './pages/academics/AcademicDepartmentsPage';
import { MyTasksPage } from './pages/academics/MyTasksPage';
import { SchemeOfWorkPage } from './pages/academics/SchemeOfWorkPage';
import { LessonPlansPage } from './pages/academics/LessonPlansPage';
import { LogbookPage } from './pages/academics/LogbookPage';

import { AttendanceDashboardPage } from './pages/attendance/AttendanceDashboardPage';
import { AttendanceSessionPage } from './pages/attendance/AttendanceSessionPage';
import { NewAttendanceSessionPage } from './pages/attendance/NewAttendanceSessionPage';
import { AttendanceHistoryPage } from './pages/attendance/AttendanceHistoryPage';

import { ReportsDashboardPage } from './pages/reports/ReportsDashboardPage';

import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { AdmissionsListPage } from './pages/admissions/AdmissionsListPage';
import { CreateApplicationPage } from './pages/admissions/CreateApplicationPage';
import { AnnouncementsPage } from './pages/notifications/AnnouncementsPage';
import { CreateAnnouncementPage } from './pages/notifications/CreateAnnouncementPage';
import { AnnouncementDetailPage } from './pages/notifications/AnnouncementDetailPage';

import { AdministrationDashboardPage } from './pages/administration/AdministrationDashboardPage';
import { SchoolSettingsPage } from './pages/administration/SchoolSettingsPage';
import { SchoolBrandingPage } from './pages/administration/SchoolBrandingPage';
import { SchoolUsersPage } from './pages/administration/SchoolUsersPage';
import { SchoolRolesPage } from './pages/administration/SchoolRolesPage';
import { PeopleManagementPage } from './pages/people/PeopleManagementPage';

import { TimetableGuard } from './components/timetable/TimetableGuard';
import { DutyRosterGuard } from './components/timetable/DutyRosterGuard';
import { DutyRosterPage } from './pages/timetable/DutyRosterPage';

import { DisciplineGuard } from './components/discipline/DisciplineGuard';
import { DisciplineDashboardPage } from './pages/discipline/DisciplineDashboardPage';
import { CreateIncidentPage } from './pages/discipline/CreateIncidentPage';
import { IncidentDetailPage } from './pages/discipline/IncidentDetailPage';

import { StaffListPage } from './pages/hr/StaffListPage';
import { StaffDetailPage } from './pages/hr/StaffDetailPage';
import { StaffCreatePage } from './pages/hr/StaffCreatePage';

import { PayrollDashboardPage } from './pages/payroll/PayrollDashboardPage';
import { PayrollPeriodsPage } from './pages/payroll/PayrollPeriodsPage';
import { PayrollPeriodDetailPage } from './pages/payroll/PayrollPeriodDetailPage';
import { CompensationListPage } from './pages/payroll/CompensationListPage';
import { api } from './api/client';

const moduleForPath = (path: string): string | undefined => {
  if (path.startsWith('/finance')) return 'finance';
  if (path.startsWith('/academics') || path.startsWith('/students') || path.startsWith('/classes')) return 'academics';
  if (path.startsWith('/attendance')) return 'attendance';
  if (path.startsWith('/reports')) return 'reports';
  if (path.startsWith('/notifications')) return 'communications';
  if (path.startsWith('/administration')) return 'administration';
  if (path.startsWith('/admissions')) return 'admissions';
  if (path.startsWith('/timetable')) return 'timetable';
  if (path.startsWith('/duty-roster')) return 'timetable';
  if (path.startsWith('/discipline')) return 'discipline';
  if (path.startsWith('/staff')) return 'hr';
  if (path.startsWith('/payroll')) return 'payroll';
  return undefined;
};

const FeatureAccessBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const requiredModule = moduleForPath(location.pathname);
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let current = true;
    if (!requiredModule) { setAllowed(true); return; }
    if (user?.role === 'PLATFORM_ADMIN' || !user?.tenantId) { setAllowed(false); return; }
    setAllowed(null);
    api.get<{ modules: Array<{ key: string; enabled: boolean }> }>('/entitlements')
      .then(({ data }) => { if (current) setAllowed(data.modules.some((module) => module.key === requiredModule && module.enabled)); })
      .catch(() => { if (current) setAllowed(false); });
    return () => { current = false; };
  }, [requiredModule, user?.role, user?.tenantId]);

  if (allowed === null) return <div role="status" className="p-8 text-center text-sm text-slate-600">Checking school feature access…</div>;
  if (!allowed) return <main className="m-6 rounded-xl border border-amber-200 bg-amber-50 p-6" role="alert"><h1 className="font-semibold text-amber-950">Feature unavailable</h1><p className="mt-1 text-sm text-amber-900">This school is not currently entitled to this module. Contact your school administrator.</p><Link className="mt-4 inline-block text-sm font-semibold underline" to="/">Return to dashboard</Link></main>;
  return <>{children}</>;
};

const SchoolProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating SchoolOS session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Platform administrators belong in the standalone platform application (platform-admin)
  if (user.role === 'PLATFORM_ADMIN') {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  if (!user.mustChangePassword && location.pathname === '/change-password') return <Navigate to="/" replace />;

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Dedicated Authentication Entry Points */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo" element={<FrontendDemoPage />} />
          <Route path="/change-password" element={<SchoolProtectedRoute><ChangePasswordPage /></SchoolProtectedRoute>} />

          {/* NORMAL SCHOOLOS APPLICATION INTERFACE */}
            <Route
              path="/"
              element={
                <SchoolProtectedRoute>
                  <FeatureAccessBoundary>
                    <AppLayout />
                  </FeatureAccessBoundary>
                </SchoolProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="students" element={<Navigate to="/academics/structure/enrolments" replace />} />
              <Route path="students/:id" element={<PermissionGuard permissions={Permissions.VIEW_STUDENTS}><StudentDetailPage /></PermissionGuard>} />
              <Route path="classes" element={<Navigate to="/academics/structure/classes" replace />} />
              <Route
                path="audit-logs"
                element={
                  <AuditGuard>
                    <AuditLogsPage />
                  </AuditGuard>
                }
              />

              {/* Admissions Module Routes */}
              <Route path="admissions" element={<PermissionGuard permissions={Permissions.VIEW_ADMISSIONS}><AdmissionsListPage /></PermissionGuard>} />
              <Route path="admissions/new" element={<PermissionGuard permissions={Permissions.MANAGE_ADMISSIONS}><CreateApplicationPage /></PermissionGuard>} />

              {/* Finance Module Routes */}
              <Route
                path="finance"
                element={
                  <FinanceGuard>
                    <FinanceDashboardPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/fee-categories"
                element={
                  <FinanceGuard>
                    <FeeCategoriesPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/fee-structures"
                element={
                  <FinanceGuard>
                    <FeeStructuresPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/fee-structures/new"
                element={
                  <FinanceGuard>
                    <CreateFeeStructurePage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/fee-structures/:id"
                element={
                  <FinanceGuard>
                    <FeeStructureDetailPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/invoices"
                element={
                  <FinanceGuard>
                    <InvoicesPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/invoices/:id"
                element={
                  <FinanceGuard>
                    <InvoiceDetailPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/payments"
                element={
                  <FinanceGuard>
                    <PaymentsPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/receipts/:id"
                element={
                  <FinanceGuard>
                    <DigitalReceiptPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/students/:studentId"
                element={
                  <FinanceGuard>
                    <StudentFinancialSummaryPage />
                  </FinanceGuard>
                }
              />
              <Route
                path="finance/reports"
                element={
                  <FinanceGuard>
                    <FinancialReportsPage />
                  </FinanceGuard>
                }
              />

              {/* Academics Module - Legacy fallback within AppLayout */}
              <Route path="academics/analytics" element={<AcademicsGuard><AcademicsDashboardPage /></AcademicsGuard>} />

              {/* Attendance Module */}
              <Route path="attendance" element={<PermissionGuard permissions={Permissions.VIEW_ATTENDANCE}><AttendanceDashboardPage /></PermissionGuard>} />
              <Route path="attendance/new" element={<PermissionGuard permissions={Permissions.VIEW_ATTENDANCE}><PermissionGuard permissions={[Permissions.RECORD_ATTENDANCE, Permissions.MANAGE_ATTENDANCE]}><NewAttendanceSessionPage /></PermissionGuard></PermissionGuard>} />
              <Route path="attendance/:id" element={<PermissionGuard permissions={Permissions.VIEW_ATTENDANCE}><AttendanceSessionPage /></PermissionGuard>} />
              <Route path="attendance/history/students/:studentId" element={<PermissionGuard permissions={Permissions.VIEW_ATTENDANCE}><AttendanceHistoryPage /></PermissionGuard>} />

              {/* Notifications & Announcements Module */}
              <Route path="notifications" element={<PermissionGuard permissions={Permissions.VIEW_NOTIFICATIONS}><NotificationsPage /></PermissionGuard>} />
              <Route path="notifications/announcements" element={<PermissionGuard permissions={Permissions.VIEW_NOTIFICATIONS}><AnnouncementsPage /></PermissionGuard>} />
              <Route path="notifications/announcements/create" element={<PermissionGuard permissions={Permissions.SEND_NOTIFICATIONS}><CreateAnnouncementPage /></PermissionGuard>} />
              <Route path="notifications/announcements/:id" element={<PermissionGuard permissions={Permissions.VIEW_NOTIFICATIONS}><AnnouncementDetailPage /></PermissionGuard>} />

              {/* Reports Module */}
              <Route path="reports" element={<PermissionGuard permissions={Permissions.VIEW_REPORTS}><ReportsDashboardPage /></PermissionGuard>} />

              {/* Administration Module */}
              <Route path="people" element={<PermissionGuard permissions={[Permissions.VIEW_STAFF, Permissions.MANAGE_STAFF, Permissions.VIEW_USERS, Permissions.VIEW_ROLES]}><PeopleManagementPage /></PermissionGuard>} />
              <Route path="administration" element={<PermissionGuard permissions={Permissions.VIEW_ADMINISTRATION}><AdministrationDashboardPage /></PermissionGuard>} />
              <Route path="administration/settings" element={<PermissionGuard permissions={Permissions.MANAGE_ADMINISTRATION}><SchoolSettingsPage /></PermissionGuard>} />
              <Route path="administration/branding" element={<PermissionGuard permissions={Permissions.MANAGE_ADMINISTRATION}><SchoolBrandingPage /></PermissionGuard>} />
              <Route path="administration/users" element={<PermissionGuard permissions={Permissions.VIEW_USERS}><SchoolUsersPage /></PermissionGuard>} />
              <Route path="administration/roles" element={<PermissionGuard permissions={Permissions.VIEW_ROLES}><SchoolRolesPage /></PermissionGuard>} />
              <Route path="administration/calendar" element={<Navigate to="/academics/structure/years-terms" replace />} />

              {/* Timetable Module */}
              <Route
                path="timetable"
                element={
                  <TimetableGuard>
                    <AcademicProvider>
                      <TimetableManagement />
                    </AcademicProvider>
                  </TimetableGuard>
                }
              />
              <Route
                path="timetable/manage"
                element={
                  <TimetableGuard>
                    <AcademicProvider>
                      <TimetableManagement />
                    </AcademicProvider>
                  </TimetableGuard>
                }
              />
              <Route
                path="timetable/duty-roster"
                element={
                  <DutyRosterGuard>
                    <DutyRosterPage />
                  </DutyRosterGuard>
                }
              />

              {/* Discipline & Student Welfare Module (Phase 14) */}
              <Route
                path="discipline"
                element={
                  <DisciplineGuard>
                    <DisciplineDashboardPage />
                  </DisciplineGuard>
                }
              />
              <Route
                path="discipline/incidents/new"
                element={
                  <DisciplineGuard>
                    <CreateIncidentPage />
                  </DisciplineGuard>
                }
              />
              <Route
                path="discipline/incidents/:id"
                element={
                  <DisciplineGuard>
                    <IncidentDetailPage />
                  </DisciplineGuard>
                }
              />

              {/* HR, Staff Operations (Phase 15) */}
              <Route path="staff" element={<PermissionGuard permissions={[Permissions.VIEW_STAFF, Permissions.MANAGE_STAFF]}><StaffListPage /></PermissionGuard>} />
              <Route path="staff/new" element={<PermissionGuard permissions={[Permissions.CREATE_STAFF, Permissions.MANAGE_STAFF]}><StaffCreatePage /></PermissionGuard>} />
              <Route path="staff/:id" element={<PermissionGuard permissions={[Permissions.VIEW_STAFF, Permissions.MANAGE_STAFF]}><StaffDetailPage /></PermissionGuard>} />

              {/* Payroll, Staff Compensation & Controls (Phase 16) */}
              <Route path="payroll" element={<PermissionGuard permissions={Permissions.VIEW_PAYROLL}><PayrollDashboardPage /></PermissionGuard>} />
              <Route path="payroll/periods" element={<PermissionGuard permissions={Permissions.VIEW_PAYROLL}><PayrollPeriodsPage /></PermissionGuard>} />
              <Route path="payroll/periods/:id" element={<PermissionGuard permissions={Permissions.VIEW_PAYROLL}><PayrollPeriodDetailPage /></PermissionGuard>} />
              <Route path="payroll/compensation" element={<PermissionGuard permissions={Permissions.MANAGE_COMPENSATION}><CompensationListPage /></PermissionGuard>} />

              {/* UNIFIED ACADEMIC DEPARTMENT ROUTES (Nested in Main AppLayout) */}
              <Route
                path="academics"
                element={
                  <AcademicsGuard>
                    <AcademicProvider>
                      <Outlet />
                    </AcademicProvider>
                  </AcademicsGuard>
                }
              >
                <Route index element={<AcademicDashboard />} />
                <Route path="tasks" element={<MyTasksPage />} />

                {/* Academic Structure */}
                <Route path="departments" element={<AcademicDepartmentsPage />} />
                <Route path="structure/years-terms" element={<AcademicCalendarPage />} />
                <Route path="structure/departments" element={<AcademicDepartmentsPage />} />
                <Route path="structure/classes" element={<ClassesAndStreams />} />
                <Route path="structure/subjects" element={<SubjectRegistryPage />} />
                <Route path="structure/enrolments" element={<StudentEnrolments />} />
                <Route path="structure/teacher-assignments" element={<TeacherAllocationPage />} />

                {/* Teaching Operations */}
                <Route path="scheme-of-work" element={<SchemeOfWorkPage />} />
                <Route path="lesson-plans" element={<LessonPlansPage />} />
                <Route path="logbook" element={<LogbookPage />} />
                <Route path="operations/scheme-of-work" element={<SchemeOfWorkPage />} />
                <Route path="operations/lesson-plans" element={<LessonPlansPage />} />
                <Route path="operations/logbook" element={<LogbookPage />} />
                <Route path="operations/timetable" element={<TimetableManagement />} />
                <Route
                  path="operations/duty-roster"
                  element={
                    <DutyRosterGuard>
                      <DutyRosterPage />
                    </DutyRosterGuard>
                  }
                />
                <Route path="lessons/:id" element={<LessonExecutionPage />} />
                <Route path="operations/lesson-logs" element={<LessonExecutionPage />} />
                <Route path="operations/lesson-logs/:id" element={<LessonExecutionPage />} />
                <Route path="operations/schemes-of-work" element={<SchemeOfWorkPage />} />
                <Route path="operations/syllabus-coverage" element={<SchemeOfWorkPage />} />
                <Route path="operations/attendance" element={<PermissionGuard permissions={Permissions.VIEW_ATTENDANCE}><AttendanceEnginePage /></PermissionGuard>} />

                {/* Assessment & Examinations */}
                <Route path="mark-center/*" element={<MarkCenterPage />} />
                <Route path="mark-center" element={<MarkCenterPage />} />
                <Route path="assessments/mark-center" element={<MarkCenterPage />} />
                <Route path="assessments/calendar" element={<AssessmentsPage />} />
                <Route path="assessments" element={<AssessmentsPage />} />
                <Route path="assessments/:id/marks" element={<MarkEntryPage />} />
                <Route path="assessments/marks-entry" element={<MarkEntryPage />} />
                <Route path="assessments/moderation" element={<AssessmentModerationPage />} />
                <Route path="assessments/report-cards" element={<ReportCardsPage />} />
                <Route path="assessments/grading-policies" element={<GradingPoliciesPage />} />

                {/* Student Support */}
                <Route path="support/interventions" element={<AcademicInterventionsPage />} />
                <Route path="support/progress" element={<AcademicsDashboardPage />} />
                <Route path="support/discipline" element={<DisciplineAndWelfarePage />} />

                {/* Governance & Reporting */}
                <Route path="governance/interventions" element={<AcademicInterventionsPage />} />
                <Route path="governance/discipline" element={<DisciplineAndWelfarePage />} />
                <Route path="governance/meetings" element={<AcademicMeetingsPage />} />
                <Route path="governance/analytics" element={<AcademicAnalyticsPage />} />
                <Route path="governance/reports" element={<AcademicDashboard />} />
                <Route path="governance/audit" element={<AcademicAuditPage />} />
              </Route>
            </Route>

            {/* Global Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
