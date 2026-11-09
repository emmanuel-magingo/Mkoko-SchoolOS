import React, { useState, useMemo } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Layers,
  Building2,
  GraduationCap,
  BookOpen,
  UserCheck,
  UserPlus,
  Clock,
  BookMarked,
  FileText,
  BarChart2,
  CalendarCheck,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Sliders,
  ShieldAlert,
  Users2,
  History,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { AcademicNavGroup } from '../../types/academic-shell.types';
import { useAcademicContext } from '../../contexts/AcademicContext';

interface AcademicSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

/**
 * @deprecated Deprecated in favor of the unified AppLayout and main Sidebar navigation.
 * Navigation items are now merged under the "ACADEMICS" group in navigationConfig.ts.
 * Retained for backward compatibility with existing unit tests.
 */
export const ACADEMIC_NAV_GROUPS: AcademicNavGroup[] = [
  {
    id: 'overview',
    title: 'ACADEMIC OVERVIEW',
    icon: LayoutDashboard,
    items: [
      { to: '/academics', label: 'Academic Dashboard', icon: LayoutDashboard },
      { to: '/academics/tasks', label: 'My Tasks', icon: CheckSquare, badge: '3' },
    ],
  },
  {
    id: 'structure',
    title: 'ACADEMIC STRUCTURE',
    icon: Layers,
    items: [
      { to: '/academics/structure/years-terms', label: 'Academic Years & Terms', icon: Calendar },
      { to: '/academics/structure/departments', label: 'Academic Departments', icon: Building2 },
      { to: '/academics/structure/classes', label: 'Classes & Streams', icon: GraduationCap },
      { to: '/academics/structure/subjects', label: 'Subjects & Curriculum', icon: BookOpen },
      { to: '/academics/structure/enrolments', label: 'Student Enrolments', icon: UserCheck },
      { to: '/academics/structure/teacher-assignments', label: 'Teacher Assignments', icon: UserPlus },
    ],
  },
  {
    id: 'operations',
    title: 'TEACHING OPERATIONS',
    icon: Clock,
    items: [
      { to: '/academics/operations/timetable', label: 'Timetable', icon: Clock },
      { to: '/academics/operations/lesson-logs', label: 'Lesson Execution', icon: BookMarked },
      { to: '/academics/operations/schemes-of-work', label: 'Schemes of Work', icon: FileText },
      { to: '/academics/operations/syllabus-coverage', label: 'Syllabus Coverage', icon: BarChart2 },
      { to: '/academics/operations/attendance', label: 'Attendance', icon: CalendarCheck },
    ],
  },
  {
    id: 'assessment',
    title: 'ASSESSMENT & EXAMINATIONS',
    icon: Award,
    items: [
      { to: '/academics/assessments/calendar', label: 'Assessment Calendar', icon: Calendar },
      { to: '/academics/assessments', label: 'Assessments', icon: Award },
      { to: '/academics/assessments/marks-entry', label: 'Marks Entry', icon: FileSpreadsheet },
      { to: '/academics/assessments/moderation', label: 'Moderation & Approvals', icon: CheckCircle2, badge: 'New' },
      { to: '/academics/assessments/report-cards', label: 'Results & Report Cards', icon: FileText },
      { to: '/academics/assessments/grading-policies', label: 'Grading Policies', icon: Sliders },
    ],
  },
  {
    id: 'support',
    title: 'STUDENT SUPPORT',
    icon: Sparkles,
    items: [
      { to: '/academics/support/interventions', label: 'Academic Interventions', icon: Sparkles },
      { to: '/academics/support/progress', label: 'Student Progress', icon: BarChart2 },
      { to: '/academics/support/discipline', label: 'Discipline & Welfare', icon: ShieldAlert },
    ],
  },
  {
    id: 'governance',
    title: 'GOVERNANCE & REPORTING',
    icon: Users2,
    items: [
      { to: '/academics/governance/meetings', label: 'Academic Meetings', icon: Users2 },
      { to: '/academics/governance/analytics', label: 'Academic Analytics', icon: BarChart2 },
      { to: '/academics/governance/reports', label: 'Reports & Exports', icon: FileText },
      { to: '/academics/governance/audit', label: 'Audit History', icon: History },
    ],
  },
];

export const AcademicSidebar: React.FC<AcademicSidebarProps> = ({ mobileOpen = false, onClose }) => {
  const location = useLocation();
  const { selectedSchool, currentAcademicYear, currentTerm } = useAcademicContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overview: true,
    structure: true,
    operations: true,
    assessment: true,
    support: true,
    governance: true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return ACADEMIC_NAV_GROUPS;
    const q = searchQuery.toLowerCase();
    return ACADEMIC_NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [searchQuery]);

  const isCurrentActive = (to: string) => {
    if (to === '/academics') {
      return location.pathname === '/academics' || location.pathname === '/academics/';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <aside
      id="academic-sidebar"
      aria-label="Academic Department Navigation"
      className={`
        fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <Link to="/academics" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900">Academic Dept</span>
            <span className="text-[11px] font-medium text-emerald-700">MIC SchoolOS</span>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scope Badge / Quick Switcher Preview */}
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={selectedSchool?.name || 'School'}>
            {selectedSchool?.name || 'School Context'}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
            {currentTerm?.name || currentAcademicYear?.name || 'Active'}
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="academic-sidebar-search"
            type="text"
            placeholder="Search academic menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups[group.id] ?? true;
          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-slate-600 uppercase hover:text-slate-900 focus:outline-none"
              >
                <span>{group.title}</span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isCurrentActive(item.to);
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        id={`nav-${item.to.replace(/\//g, '-').replace(/^-/, '')}`}
                        onClick={onClose}
                        className={`
                          group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors
                          ${
                            active
                              ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 transition-colors ${
                              active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`
                              rounded-full px-1.5 py-0.2 text-[10px] font-semibold
                              ${
                                active
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-200 text-slate-800 group-hover:bg-slate-300'
                              }
                            `}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Return to Main App Shell Footer */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        <Link
          to="/"
          id="btn-return-schoolos-main"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
          <span>Exit to Main App</span>
        </Link>
      </div>
    </aside>
  );
};
