import React, { useState, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Search,
  SearchX,
  X,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getPlatformNavGroups,
  filterNavGroups,
  isItemActive,
  NavGroupConfig,
} from '../../layout/navigationConfig';

interface PlatformSidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
  onClose: () => void;
}

const STORAGE_COLLAPSED_KEY = 'platform_sidebar_collapsed';

export const PlatformSidebar: React.FC<PlatformSidebarProps> = ({
  mobileOpen,
  onNavigate,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const rawGroups = useMemo<NavGroupConfig[]>(() => {
    return getPlatformNavGroups();
  }, []);

  const filteredGroups = useMemo<NavGroupConfig[]>(() => {
    return filterNavGroups(rawGroups, searchQuery, new Set(), true, true);
  }, [rawGroups, searchQuery]);

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

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <>
      <aside
        id="platform-sidebar"
        aria-label="Platform Control Plane Navigation"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-all duration-300 ease-in-out select-none
          ${mobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full'}
          lg:static lg:translate-x-0
          ${desktopCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-lg shadow-lg shadow-indigo-600/30">
              <Layers className="h-5 w-5" />
            </div>

            {(!desktopCollapsed || mobileOpen) && (
              <div className="min-w-0">
                <span className="block truncate font-black tracking-tight text-white text-base">
                  Mkoko <span className="text-indigo-400">Control Plane</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Global Multi-Tenant OS
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleDesktopCollapse}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors lg:flex items-center justify-center"
            title={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar to rail'}
            aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {desktopCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {(!desktopCollapsed || mobileOpen) && (
          <div className="border-b border-slate-800/80 p-3">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find platform tools..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-8 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <SearchX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No platform items found for &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id} className="space-y-1">
                  {(!desktopCollapsed || mobileOpen) ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <GroupIcon className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{group.title}</span>
                    </div>
                  ) : (
                    <div className="h-px bg-slate-800 my-2" />
                  )}

                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isItemActive(item.to, item.end, location.pathname);

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={onNavigate}
                          title={desktopCollapsed && !mobileOpen ? item.label : undefined}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                            active
                              ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                          } ${desktopCollapsed && !mobileOpen ? 'justify-center px-2' : ''}`}
                        >
                          <ItemIcon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                          {(!desktopCollapsed || mobileOpen) && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 border-t border-slate-800/80 p-3 bg-slate-950">
          {(!desktopCollapsed || mobileOpen) ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-semibold text-white">
                    {user ? `${user.firstName} ${user.lastName}` : 'Platform Admin'}
                  </p>
                  <p className="truncate text-[10px] text-indigo-400 font-mono">
                    SUPERADMIN
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors"
                  title="Sign out of Platform Control Plane"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Control Plane v1.0</span>
                </div>
                <span>Port 3000/API</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-xl p-2.5 text-slate-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors"
                title="Sign out of Platform Control Plane"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
