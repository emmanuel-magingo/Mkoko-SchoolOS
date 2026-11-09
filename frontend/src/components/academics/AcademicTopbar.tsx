import React, { useState } from 'react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Menu,
  School,
  Calendar,
  Sparkles,
  Search,
  Bell,
  RefreshCw,
  User,
} from 'lucide-react';

interface AcademicTopbarProps {
  onOpenMobileMenu?: () => void;
}

export const AcademicTopbar: React.FC<AcademicTopbarProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const {
    schools,
    selectedSchoolId,
    setSelectedSchoolId,
    academicYears,
    currentAcademicYearId,
    setCurrentAcademicYearId,
    terms,
    currentTermId,
    setCurrentTermId,
    isLoading,
    refreshAcademicData,
  } = useAcademicContext();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshAcademicData();
    setRefreshing(false);
  };

  return (
    <header
      id="academic-topbar"
      className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs"
    >
      {/* Left: Mobile Toggle & Scope Selectors */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            id="btn-academic-mobile-menu"
            onClick={onOpenMobileMenu}
            aria-label="Open Academic Navigation"
            className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* School Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs transition-colors hover:border-slate-300">
          <School className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <select
            id="academic-school-selector"
            aria-label="Select School"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            disabled={isLoading || schools.length === 0}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
          >
            {schools.length > 0 ? (
              schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))
            ) : (
              <option value={selectedSchoolId}>Default School</option>
            )}
          </select>
        </div>

        {/* Academic Year Selector */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs transition-colors hover:border-slate-300">
          <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <select
            id="academic-year-selector"
            aria-label="Select Academic Year"
            value={currentAcademicYearId}
            onChange={(e) => setCurrentAcademicYearId(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            {academicYears.length > 0 ? (
              academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isActive ? '(Active)' : ''}
                </option>
              ))
            ) : (
              <option value="">2026 Academic Year</option>
            )}
          </select>
        </div>

        {/* Term Selector */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs transition-colors hover:border-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <select
            id="academic-term-selector"
            aria-label="Select Term"
            value={currentTermId}
            onChange={(e) => setCurrentTermId(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            {terms.length > 0 ? (
              terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isActive ? '(Current)' : ''}
                </option>
              ))
            ) : (
              <option value="">Term II</option>
            )}
          </select>
        </div>
      </div>

      {/* Right: Global Search (Cmd+K), Online/Sync Status & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search with ⌘K Badge */}
        <div className="relative hidden md:flex items-center">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            id="academic-global-search"
            type="text"
            placeholder="Search academics... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-52 lg:w-64 rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2 inline-flex items-center rounded border border-slate-200 bg-white px-1.5 font-sans text-[10px] text-slate-400 shadow-xs">
            ⌘K
          </kbd>
        </div>

        {/* Online / Sync Status Indicator */}
        <div
          id="academic-sync-status"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/80"
          title="Connected to MIC SchoolOS Cloud"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Online / Synced</span>
        </div>

        {/* Refresh Context Button */}
        <button
          type="button"
          id="btn-refresh-academic-context"
          onClick={handleManualRefresh}
          disabled={refreshing}
          aria-label="Refresh Academic State"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
          title="Reload Academic Data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          id="btn-academic-notifications"
          aria-label="Academic Notifications"
          className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* Department Badge */}
        {(user?.academicDepartment || user?.department) && (
          <div
            id="academic-teacher-department-badge"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200"
          >
            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Department:</span>
            <span>{(user.academicDepartment || user.department)?.name}</span>
          </div>
        )}

        {/* User Capsule */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-xs">
            {user?.firstName?.charAt(0) || user?.email?.charAt(0) || <User className="h-4 w-4" />}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Academic Officer'}
            </span>
            <span className="text-[10px] text-slate-600">
              {user?.role || 'ACADEMIC_MASTER'}
            </span>
            {(user?.academicDepartment || user?.department) && (
              <span className="text-[10px] font-semibold text-blue-600">
                Department: {(user.academicDepartment || user.department)?.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
