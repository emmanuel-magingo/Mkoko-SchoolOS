import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Menu, LogOut, ShieldAlert, Cpu } from 'lucide-react';

interface PlatformHeaderProps {
  onOpenMenu: () => void;
  menuExpanded: boolean;
}

export const PlatformHeader: React.FC<PlatformHeaderProps> = ({ onOpenMenu, menuExpanded }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 sm:px-6 lg:px-8 text-white select-none">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          aria-expanded={menuExpanded}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
                Platform Control Plane
              </h1>
              <span className="hidden rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20 sm:inline-block">
                HOST OPERATOR
              </span>
            </div>
            <p className="hidden text-[10px] font-medium text-slate-400 sm:block">
              Multi-Tenant Governance, Licensing & System Health
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        {/* Cluster Operational Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide">Fleet Healthy</span>
        </div>

        {/* Security Isolation Indicator */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
          <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
          <span>Restricted Scope</span>
        </div>

        <div className="hidden h-5 w-px bg-slate-800 sm:block" />

        {/* Admin Profile & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-white leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Platform Administrator'}
            </p>
            <p className="truncate text-[10px] font-mono text-indigo-400">
              {user?.email || 'admin@platform.schoolos'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/60 active:scale-95 transition-all shadow-sm"
            title="Sign out of Platform Control Plane"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
