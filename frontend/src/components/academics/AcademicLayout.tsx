import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AcademicProvider } from '../../contexts/AcademicContext';
import { AcademicSidebar } from './AcademicSidebar';
import { AcademicTopbar } from './AcademicTopbar';

/**
 * @deprecated Deprecated as part of unifying the Academic Department into the main AppLayout shell.
 * Use the standard AppLayout with AcademicProvider wrapping /academics routes.
 * Retained for backward compatibility with existing component test suites.
 */
export const AcademicLayoutInner: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen min-w-0 overflow-hidden bg-slate-50 font-sans">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Academic Sidebar */}
      <AcademicSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AcademicTopbar onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export const AcademicLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AcademicProvider>
      <AcademicLayoutInner>{children}</AcademicLayoutInner>
    </AcademicProvider>
  );
};
