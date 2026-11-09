import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, School } from 'lucide-react';
import { Badge } from '../common/Badge';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const Header: React.FC<{ onOpenMenu: () => void; menuExpanded: boolean }> = ({ onOpenMenu, menuExpanded }) => {
  const { user, tenant } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          aria-expanded={menuExpanded}
          aria-controls="main-sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <School className="hidden h-5 w-5 shrink-0 text-brand-600 sm:block" />
        <h1 className="truncate text-sm font-bold text-slate-800 sm:text-base">
          {tenant ? tenant.name : 'School Management'}
        </h1>
        {tenant && (
          <Badge variant="brand" size="sm">
            {tenant.code}
          </Badge>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {(user?.academicDepartment || user?.department) && (
          <div
            id="header-teacher-department"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 border border-brand-200"
          >
            <span className="text-[10px] uppercase font-bold text-brand-500 tracking-wider">Department:</span>
            <span>{(user.academicDepartment || user.department)?.name}</span>
          </div>
        )}

        <NotificationCenter />

        <div className="hidden h-4 w-px bg-slate-200 sm:block" />

        <div className="hidden max-w-36 text-right sm:block">
          <p className="text-xs font-semibold text-slate-900 leading-tight">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-[10px] font-medium text-slate-500">
            {user?.email}
          </p>
        </div>
      </div>
    </header>
  );
};
