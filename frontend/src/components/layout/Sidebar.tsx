import React, { useEffect, useState, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Badge } from '../common/Badge';
import { api } from '../../api/client';
import {
  getSchoolNavGroups,
  filterNavGroups,
  isItemActive,
  isGroupActive,
  NavGroupConfig,
} from './navigationConfig';

interface SidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
  onClose: () => void;
}

const STORAGE_EXPANDED_KEY = 'schoolos_sidebar_expanded_groups';
const STORAGE_COLLAPSED_KEY = 'schoolos_sidebar_collapsed';

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onNavigate, onClose }) => {
  const { user, tenant, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [entitlementsLoaded, setEntitlementsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Load tenant module entitlements
  useEffect(() => {
    let current = true;
    setEntitlementsLoaded(false);
    if (!tenant?.id) {
      setEnabledModules(new Set());
      setEntitlementsLoaded(true);
      return;
    }
    api
      .get<{ modules: Array<{ key: string; enabled: boolean }> }>('/entitlements')
      .then(({ data }) => {
        if (current) {
          setEnabledModules(
            new Set(data.modules.filter((m) => m.enabled).map((m) => m.key))
          );
        }
      })
      .catch(() => {
        if (current) setEnabledModules(new Set());
      })
      .finally(() => {
        if (current) setEntitlementsLoaded(true);
      });
    return () => {
      current = false;
    };
  }, [tenant?.id]);

  // Build the navigation groups for current school user context
  const rawGroups = useMemo<NavGroupConfig[]>(() => {
    return getSchoolNavGroups({ user, tenant, hasPermission });
  }, [user, tenant, hasPermission]);

  // Filter groups according to permissions, entitlements, and search query
  const filteredGroups = useMemo<NavGroupConfig[]>(() => {
    return filterNavGroups(
      rawGroups,
      searchQuery,
      enabledModules,
      false,
      entitlementsLoaded
    );
  }, [rawGroups, searchQuery, enabledModules, entitlementsLoaded]);

  // Expanded groups state initialized with active group or persisted state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_EXPANDED_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return user?.role === 'TEACHER' ? { academics: true } : {};
  });

  // Auto-expand group that contains current route on navigation
  useEffect(() => {
    const activeGroup = rawGroups.find((g) => isGroupActive(g, location.pathname));
    if (activeGroup && !activeGroup.isStandalone) {
      setExpandedGroups((prev) => {
        if (prev[activeGroup.id]) return prev;
        const next = { ...prev, [activeGroup.id]: true };
        try {
          sessionStorage.setItem(STORAGE_EXPANDED_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, [location.pathname, rawGroups]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        sessionStorage.setItem(STORAGE_EXPANDED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Toggle desktop rail collapsed mode
  const toggleDesktopCollapse = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Quick keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        if (desktopCollapsed) setDesktopCollapsed(false);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [desktopCollapsed]);

  // Total matching items count when searching
  const totalMatchesCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    return filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [filteredGroups, searchQuery]);

  return (
    <aside
      id="main-sidebar"
      aria-label="Main navigation"
      style={{ backgroundColor: 'rgb(var(--theme-sidebar-rgb))' }}
      className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col select-none border-r border-slate-200 bg-white transition-all duration-200 lg:static lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full'
      } ${desktopCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white shadow-sm">
            M
          </div>
          {!desktopCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-extrabold tracking-tight text-slate-900">
                  Mkoko
                </span>
                <span className="text-base font-bold text-brand-600">SchoolOS</span>
              </div>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
                By Mkoko Innovation
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tenant / Context Indicator */}
      {!desktopCollapsed && (
        <>
          {tenant ? (
            <div className="mx-4 mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-slate-800" title={tenant.name}>
                  {tenant.name}
                </span>
                <Badge variant={tenant.status === 'PILOT' ? 'warning' : 'success'} size="sm">
                  {tenant.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Code: {tenant.code}</p>
            </div>
          ) : null}
        </>
      )}

      {/* Quick Find / Search Box (Hick's Law Filtering) */}
      {!desktopCollapsed && (
        <div className="mx-4 mt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick find (press '/')..."
              aria-label="Filter navigation destinations"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-7 text-xs text-slate-700 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear navigation search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-1 px-1 text-[10px] font-medium text-slate-400">
              {totalMatchesCount} {totalMatchesCount === 1 ? 'match' : 'matches'} found
            </p>
          )}
        </div>
      )}

      {/* Main Navigation Scroll Area */}
      <nav
        className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-3"
        aria-label="Main"
      >
        {!entitlementsLoaded && (
          <div role="status" className="px-3 py-2 text-xs text-slate-500">
            Loading school access…
          </div>
        )}

        {/* Empty state when searching */}
        {searchQuery.trim() !== '' && filteredGroups.length === 0 && (
          <div className="px-3 py-8 text-center" role="status">
            <SearchX className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-700">No destinations found</p>
            <p className="mt-1 text-[11px] text-slate-400">
              No menu items match "{searchQuery}"
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Render Navigation Groups */}
        {filteredGroups.map((group) => {
          if (group.show === false || !group.items || group.items.length === 0) return null;
          const isSearching = searchQuery.trim() !== '';
          const isGroupCurrentlyActive = isGroupActive(group, location.pathname);
          // Groups are open if searching, or manually expanded, or active
          const isExpanded = isSearching || Boolean(expandedGroups[group.id]) || (isGroupCurrentlyActive && !desktopCollapsed);

          // 1. Standalone Top-Level Item (e.g. Overview / Dashboard)
          if (group.isStandalone && group.items[0]) {
            const item = group.items[0];
            if (!item.show) return null;
            const Icon = item.icon;
            const active = isItemActive(item.to, item.end, location.pathname);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={desktopCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 font-semibold text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${desktopCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!desktopCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          }

          // 2. Expandable Domain Group
          const GroupIcon = group.icon;

          if (desktopCollapsed) {
            // Collapsed Rail Mode: Show Icon button with flyout/tooltip
            return (
              <div key={group.id} className="relative flex justify-center py-1">
                <button
                  type="button"
                  onClick={() => toggleDesktopCollapse()}
                  title={group.title}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    isGroupCurrentlyActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-label={group.title}
                >
                  <GroupIcon className="h-4 w-4" />
                </button>
              </div>
            );
          }

          // Standard Hick's Law Accordion Group
          return (
            <div key={group.id} className="pt-1">
              {/* Group Accordion Header */}
              <button
                type="button"
                id={`header-${group.id}`}
                aria-expanded={isExpanded}
                aria-controls={`group-${group.id}`}
                onClick={() => toggleGroup(group.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                  isGroupCurrentlyActive
                    ? 'text-brand-700 bg-brand-50/50'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <GroupIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  <span className="truncate uppercase text-[11px]">{group.title}</span>
                  {isGroupCurrentlyActive && !isExpanded && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                      title="Current active page is in this category"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isSearching && (
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.2 text-[10px] font-bold text-brand-700">
                      {group.items.length}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                  )}
                </div>
              </button>

              {/* Submenu Item Links */}
              {isExpanded && (
                <ul
                  id={`group-${group.id}`}
                  role="region"
                  aria-labelledby={`header-${group.id}`}
                  className="mt-0.5 space-y-0.5 pl-2"
                >
                  {group.items
                    .filter((item) => item.show !== false)
                    .map(({ to, label, icon: ItemIcon, end }) => {
                    const active = isItemActive(to, end, location.pathname);
                    return (
                      <li key={to}>
                        <NavLink
                          to={to}
                          end={end}
                          onClick={onNavigate}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                            active
                              ? 'bg-brand-50 font-semibold text-brand-700 shadow-xs'
                              : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <ItemIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Desktop Collapse Rail Toggle */}
      <div className="hidden border-t border-slate-100 px-4 py-2 lg:block">
        <button
          type="button"
          onClick={toggleDesktopCollapse}
          className="flex w-full items-center justify-between rounded-lg p-1.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!desktopCollapsed && <span className="font-medium text-[11px]">Collapse sidebar</span>}
          {desktopCollapsed ? (
            <ChevronsRight className="mx-auto h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {user?.firstName?.[0] || 'U'}
            </div>
            {!desktopCollapsed && (
              <div className="truncate">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-[10px] font-medium text-slate-500">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
                {(user?.academicDepartment || user?.department) && (
                  <p className="truncate text-[10px] font-bold text-brand-600" id="sidebar-teacher-department">
                    Department: {(user.academicDepartment || user.department)?.name}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            title="Log Out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
