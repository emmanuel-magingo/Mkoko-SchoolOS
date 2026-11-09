import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface PlatformGuardProps {
  children: React.ReactNode;
}

export const PlatformGuard: React.FC<PlatformGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying platform authorization...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isPlatformAdmin = user.role === 'PLATFORM_ADMIN';

  if (!isPlatformAdmin) {
    return (
      <main className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-slate-900">Platform Access Restricted</h1>
          <p className="text-xs text-slate-500">
            This administration view is restricted to Platform Administrators. Role {user.role.replace(/_/g, ' ')} is scoped to school tenant operations only.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to School Dashboard</span>
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};
