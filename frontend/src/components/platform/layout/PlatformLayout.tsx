import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PlatformSidebar } from './PlatformSidebar';
import { PlatformHeader } from './PlatformHeader';

export const PlatformLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen min-w-0 overflow-hidden bg-slate-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Dedicated Platform Sidebar */}
      <PlatformSidebar
        mobileOpen={mobileMenuOpen}
        onNavigate={() => setMobileMenuOpen(false)}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Dedicated Platform Header */}
        <PlatformHeader
          onOpenMenu={() => setMobileMenuOpen(true)}
          menuExpanded={mobileMenuOpen}
        />

        {/* Platform Content Canvas */}
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
