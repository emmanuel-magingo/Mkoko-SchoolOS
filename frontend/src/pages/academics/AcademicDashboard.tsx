import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Users,
  Clock,
  FileCheck,
  BookOpen,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Calendar,
  Activity,
} from 'lucide-react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { getDailyAttendanceManifest, DailyAttendanceManifestResult } from '../../api/attendance.api';
import { UpcomingEventsTimeline } from '../../components/academics/UpcomingEventsTimeline';
import { DashboardMetrics } from '../../types';
import {
  MetricCardData,
  OperationalException,
  PriorityTask,
  TodayScheduleItem,
  ActivityFeedItem,
} from '../../types/academic.types';

// ============================================================================
// REUSABLE UI COMPONENT: EXCEPTION BADGE
// ============================================================================

export interface ExceptionBadgeProps {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  className?: string;
}

export const ExceptionBadge: React.FC<ExceptionBadgeProps> = ({ severity, className = '' }) => {
  const styles = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10',
    WARNING: 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-500/10',
    INFO: 'bg-sky-50 text-sky-700 border-sky-200/80 ring-1 ring-sky-500/10',
  }[severity];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${styles} ${className}`}
    >
      {severity}
    </span>
  );
};

// ============================================================================
// REUSABLE UI COMPONENT: METRIC CARD
// ============================================================================

export interface MetricCardProps {
  card: MetricCardData;
}

export const MetricCard: React.FC<MetricCardProps> = ({ card }) => {
  const Icon = card.icon;

  const colorStyles: Record<MetricCardData['accentColor'], string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
  };

  return (
    <div
      id={card.id}
      className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md min-h-[140px]"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500">{card.title}</span>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {card.value}
          </div>
        </div>
        <div className={`rounded-lg p-2.5 border ${colorStyles[card.accentColor]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs gap-2">
        {card.subtitle && (
          <span className="text-slate-500 font-medium truncate">{card.subtitle}</span>
        )}
        {card.change && (
          <span
            className={`font-semibold shrink-0 ${
              card.changeType === 'positive'
                ? 'text-emerald-700'
                : card.changeType === 'negative'
                ? 'text-rose-700'
                : 'text-slate-600'
            }`}
          >
            {card.change}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 1. TERM PROGRESS CARD
// ============================================================================

export const TermProgressCard: React.FC = () => {
  const { currentAcademicYear, currentTerm } = useAcademicContext();

  // Calculated / Mock term pacing metrics
  const currentWeek = 6;
  const totalWeeks = 14;
  const configuredDaysCompleted = 42;
  const totalConfiguredDays = 70;
  const progressPercent = Math.round((configuredDaysCompleted / totalConfiguredDays) * 100);
  const remainingDays = totalConfiguredDays - configuredDaysCompleted;

  return (
    <div
      id="term-progress-card"
      className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Active Instructional Term
            </span>
            <span className="text-xs text-slate-500">
              {currentAcademicYear?.name || 'Academic Year 2026'}
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {`${currentTerm?.name || 'Term II'} — Week ${currentWeek} of ${totalWeeks}`}
          </h2>

          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              {configuredDaysCompleted} of {totalConfiguredDays} configured instructional days completed
            </span>{' '}
            ({progressPercent}% elapsed). {remainingDays} instructional days remaining until final term moderation.
          </p>
        </div>

        {/* Progress Bar & Badges */}
        <div className="w-full lg:w-72 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Instructional Pacing</span>
            <span className="font-bold text-blue-600">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>W1: Commencement</span>
            <span>W7: Midterm</span>
            <span>W14: Exams</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. OPERATIONAL EXCEPTIONS LIST (HORIZONTAL SEQUENCE)
// ============================================================================

const MOCK_EXCEPTIONS: OperationalException[] = [
  {
    id: 'exc-1',
    title: 'Timetable Double Booking Detected',
    category: 'TIMETABLE_CONFLICT',
    severity: 'CRITICAL',
    entityName: 'Physics Lab A • Period 4',
    description: 'Form 3A and Form 4B are both scheduled for Physics Practicals on Thursday 10:20 AM.',
    timestamp: '15m ago',
    actionLabel: 'Resolve',
    actionUrl: '/academics/operations/timetable',
  },
  {
    id: 'exc-2',
    title: 'Syllabus Coverage Delay Warning',
    category: 'COVERAGE_DELAY',
    severity: 'WARNING',
    entityName: 'Form 4 Basic Mathematics',
    description: 'Topic "Calculus & Functions" is 12 instructional periods behind the approved scheme of work.',
    timestamp: '1h ago',
    actionLabel: 'Review',
    actionUrl: '/academics/operations/syllabus-coverage',
  },
  {
    id: 'exc-3',
    title: 'Frequent Absences Spiking',
    category: 'FREQUENT_ABSENCE',
    severity: 'WARNING',
    entityName: 'Form 2 Streams B & C',
    description: '14 students missed 3+ consecutive school days without verified parental notification.',
    timestamp: '2h ago',
    actionLabel: 'Inspect',
    actionUrl: '/academics/operations/attendance',
  },
  {
    id: 'exc-4',
    title: 'Pending Assessment Approval',
    category: 'PENDING_APPROVAL',
    severity: 'INFO',
    entityName: 'Form 1 History Midterm',
    description: 'Submitted by J. Mwamba 4 hours ago. Moderation review pending academic master approval.',
    timestamp: '4h ago',
    actionLabel: 'Approve',
    actionUrl: '/academics/assessments/moderation',
  },
];

export const OperationalExceptionsList: React.FC = () => {
  return (
    <div id="operational-exceptions-list" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Operational Exceptions &amp; Compliance Alerts
          </h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            {MOCK_EXCEPTIONS.length} require action
          </span>
        </div>
        <Link
          to="/academics/tasks"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all tasks <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_EXCEPTIONS.map((exc) => (
          <div
            key={exc.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <ExceptionBadge severity={exc.severity} />
                <span className="text-[11px] text-slate-400">{exc.timestamp}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                {exc.title}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 truncate">{exc.entityName}</p>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {exc.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              {exc.actionUrl && (
                <Link
                  to={exc.actionUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>{exc.actionLabel || 'Take Action'}</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 3. PRIORITY TASKS LIST
// ============================================================================

const MOCK_TASKS: PriorityTask[] = [
  {
    id: 'task-1',
    task: 'Moderate Form 4 Physics Midterm Results',
    responsibleArea: 'Assessment & Moderation',
    dueDate: 'Today, 2:00 PM',
    priority: 'HIGH',
    status: 'PENDING',
    actionUrl: '/academics/assessments/moderation',
  },
  {
    id: 'task-2',
    task: 'Resolve Form 3A Double Booking Conflict',
    responsibleArea: 'Timetable Operations',
    dueDate: 'Today, 4:30 PM',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    actionUrl: '/academics/operations/timetable',
  },
  {
    id: 'task-3',
    task: 'Review Basic Mathematics Syllabus Pacing Delay',
    responsibleArea: 'Curriculum & Syllabi',
    dueDate: 'Tomorrow, 10:00 AM',
    priority: 'MEDIUM',
    status: 'PENDING',
    actionUrl: '/academics/operations/syllabus-coverage',
  },
  {
    id: 'task-4',
    task: 'Compile Weekly Attendance Register Audit Report',
    responsibleArea: 'Attendance Compliance',
    dueDate: 'Friday, 3:00 PM',
    priority: 'LOW',
    status: 'PENDING',
    actionUrl: '/academics/operations/attendance',
  },
];

export const PriorityTasksCard: React.FC = () => {
  return (
    <div
      id="priority-tasks-card"
      className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs h-[380px] max-h-[380px]"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Priority Tasks</h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            {MOCK_TASKS.length} pending
          </span>
        </div>
        <Link
          to="/academics/tasks"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Manage tasks <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-3 divide-y divide-slate-100 flex-1 overflow-y-auto pr-1">
        {MOCK_TASKS.map((task) => {
          const priorityStyles = {
            HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
            MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
            LOW: 'bg-slate-100 text-slate-700 border-slate-200',
          }[task.priority];

          return (
            <div
              key={task.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-slate-50/60 rounded-lg px-2 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityStyles}`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{task.task}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{task.responsibleArea}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">Due: {task.dueDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {task.status.replace('_', ' ')}
                </span>
                {task.actionUrl && (
                  <Link
                    to={task.actionUrl}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900"
                  >
                    Action
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 4. TODAY'S ACADEMIC SCHEDULE & ACTIVITY FEED
// ============================================================================

const MOCK_SCHEDULE: TodayScheduleItem[] = [
  {
    id: 'sch-1',
    period: 'Period 2 (08:45 - 09:30)',
    time: '08:45 AM',
    subject: 'Form 4 Chemistry Practical',
    classRoom: 'Lab 2',
    teacherName: 'M. Sengerema',
    status: 'COMPLETED',
  },
  {
    id: 'sch-2',
    period: 'Period 4 (10:20 - 11:05)',
    time: '10:20 AM',
    subject: 'Form 3A Mathematics (Calculus)',
    classRoom: 'Room 14',
    teacherName: 'P. Tarimo',
    status: 'IN_PROGRESS',
  },
  {
    id: 'sch-3',
    period: 'Period 6 (12:00 - 12:45)',
    time: '12:00 PM',
    subject: 'Form 2B English Language Essay',
    classRoom: 'Room 08',
    teacherName: 'H. Bakari',
    status: 'UPCOMING',
  },
];

const MOCK_FEED: ActivityFeedItem[] = [
  {
    id: 'feed-1',
    actor: 'S. Kigoma',
    action: 'approved midterm results for',
    target: 'Form 4 Physics',
    timestamp: '22m ago',
    category: 'ASSESSMENT',
  },
  {
    id: 'feed-2',
    actor: 'M. Sengerema',
    action: 'submitted attendance register for',
    target: 'Form 3B',
    timestamp: '1h ago',
    category: 'ATTENDANCE',
  },
  {
    id: 'feed-3',
    actor: 'System Overseer',
    action: 'flagged timetable conflict in',
    target: 'Physics Lab A',
    timestamp: '2h ago',
    category: 'TIMETABLE',
  },
  {
    id: 'feed-4',
    actor: 'Academic Board',
    action: 'updated grading threshold for',
    target: 'Division I Cutoff',
    timestamp: '4h ago',
    category: 'GOVERNANCE',
  },
];

export const ScheduleAndActivityCard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Today's Schedule Card */}
      <div
        id="todays-schedule-card"
        className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Today's Academic Schedule</h3>
          </div>
          <Link
            to="/academics/operations/timetable"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Full Timetable <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {MOCK_SCHEDULE.map((item) => {
            const statusStyles = {
              COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
              UPCOMING: 'bg-slate-50 text-slate-600 border-slate-200',
            }[item.status];

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.subject}</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${statusStyles}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.period} • {item.classRoom} • {item.teacherName}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed Card */}
      <div
        id="activity-feed-card"
        className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Academic Activity Feed</h3>
          </div>
          <Link
            to="/academics/governance/audit"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Audit Log <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {MOCK_FEED.map((feed) => (
            <div key={feed.id} className="flex items-start justify-between py-2.5 text-xs">
              <div className="space-y-0.5">
                <p className="text-slate-800">
                  <span className="font-bold text-slate-900">{feed.actor}</span> {feed.action}{' '}
                  <span className="font-semibold text-blue-700">{feed.target}</span>
                </p>
                <span className="text-[10px] text-slate-400">{feed.timestamp}</span>
              </div>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {feed.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ACADEMIC DASHBOARD PAGE
// ============================================================================

export const AcademicDashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'TEACHER') {
    return <Navigate to="/academics/operations/timetable" replace />;
  }
  const { selectedSchool } = useAcademicContext();
  const [stats, setStats] = React.useState<DashboardMetrics | null>(null);
  const [manifest, setManifest] = React.useState<DailyAttendanceManifestResult | null>(null);

  React.useEffect(() => {
    let active = true;

    // Fetch school metrics
    api
      .get<DashboardMetrics>('/dashboard/stats')
      .then((res) => {
        if (active) setStats(res.data);
      })
      .catch(() => {
        api
          .get<DashboardMetrics>('/dashboard/metrics')
          .then((res) => {
            if (active) setStats(res.data);
          })
          .catch(() => {});
      });

    // Wire strictly to real daily attendance manifest
    getDailyAttendanceManifest()
      .then((res) => {
        if (active) setManifest(res);
      })
      .catch((err) => {
        console.error('Failed to load daily attendance manifest:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const totalStudents = stats?.metrics?.totalStudents ?? stats?.totalStudents ?? 0;
  const activeClasses = stats?.metrics?.activeClasses ?? stats?.activeClasses ?? 0;

  // Strict Real Data: Attendance Today
  const hasSubmittedRegisters = Boolean(manifest && manifest.submitted > 0);
  const attendanceTodayValue = hasSubmittedRegisters
    ? `${manifest!.complianceRate}%`
    : '0%';
  const attendanceSubtitle = hasSubmittedRegisters
    ? `${manifest!.submitted} of ${manifest!.totalExpected} registers submitted`
    : 'No registers submitted yet';
  const attendanceChange = hasSubmittedRegisters
    ? `${manifest!.pending} registers pending`
    : 'Check Registers';
  const attendanceChangeType: 'positive' | 'negative' | 'neutral' = hasSubmittedRegisters
    ? manifest!.pending > 0
      ? 'negative'
      : 'positive'
    : 'neutral';

  // Strict Real Data: Registers Pending
  const pendingClassesCount = manifest
    ? manifest.pending
    : activeClasses > 0
    ? activeClasses
    : 0;
  const registersPendingValue = `${pendingClassesCount} Classes`;
  const registersSubtitle = manifest
    ? manifest.totalExpected > 0
      ? `${manifest.submitted} of ${manifest.totalExpected} class registers submitted`
      : '0 classes configured'
    : activeClasses > 0
    ? `${activeClasses} classes configured`
    : '0 classes configured';
  const registersChange = pendingClassesCount > 0
    ? 'Overdue (Due 10:00 AM)'
    : 'All registers submitted';
  const registersChangeType: 'positive' | 'negative' | 'neutral' =
    pendingClassesCount > 0 ? 'negative' : 'positive';

  // Decluttered KPI cards adhering to Hick's Law (Marks Entry Card removed entirely)
  const metricCards: MetricCardData[] = [
    {
      id: 'metric-attendance-today',
      title: 'Attendance Today',
      value: attendanceTodayValue,
      subtitle: attendanceSubtitle,
      change: attendanceChange,
      changeType: attendanceChangeType,
      icon: Users,
      accentColor: 'emerald',
    },
    {
      id: 'metric-registers-pending',
      title: 'Registers Pending',
      value: registersPendingValue,
      subtitle: registersSubtitle,
      change: registersChange,
      changeType: registersChangeType,
      icon: Clock,
      accentColor: 'amber',
    },
    {
      id: 'metric-syllabus-on-track',
      title: 'Syllabus On Track',
      value: '0%',
      subtitle: totalStudents > 0 ? 'Curriculum pacing active' : '0 subjects paced',
      change: '0 behind schedule',
      changeType: 'neutral',
      icon: BookOpen,
      accentColor: 'violet',
    },
  ];

  const greetingName = user?.firstName ? `${user.firstName}` : 'Academic Master';

  return (
    <div className="space-y-6">
      {/* 1. Header: Greeting & Active Context Only (Dead weight action buttons removed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {`Good morning, ${greetingName}`}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Instructional oversight, attendance compliance, and assessment operations for{' '}
            <span className="font-semibold text-slate-900">
              {selectedSchool?.name || 'Mwilamvya Secondary School'}
            </span>
            .
          </p>
        </div>

        {/* Clean empty space on the right */}
        <div className="hidden sm:block" />
      </div>

      {/* 2. Full-Width 3 KPI Metric Cards Row (Clean 3-column grid, ample breathing room) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map((card) => (
          <MetricCard key={card.id} card={card} />
        ))}
      </div>

      {/* 3. Clean 2-Column Lower Section: Events & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Upcoming Academic Events */}
        <div>
          <UpcomingEventsTimeline maxHeightClass="h-[380px] max-h-[380px]" className="h-full" />
        </div>

        {/* Right Column: Priority Tasks Only */}
        <div>
          <PriorityTasksCard />
        </div>
      </div>
    </div>
  );
};

