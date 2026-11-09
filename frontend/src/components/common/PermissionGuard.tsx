import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permissions';

export interface PermissionGuardProps {
  permissions?: Permission | Permission[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  requireAll = false,
  children,
  fallback,
}) => {
  const { user, isLoading } = useAuth();
  const { hasPermission } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying authorization...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Platform admin cannot access school routes directly
  if (user.role === 'PLATFORM_ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (
    user.role === 'TEACHER' &&
    permissions &&
    (Array.isArray(permissions) ? permissions : [permissions]).includes('attendance:view' as Permission) &&
    !(user.isClassTeacher || (user.assignedClassesAsTeacher && user.assignedClassesAsTeacher.length > 0))
  ) {
    return <Navigate to="/" replace />;
  }

  if (permissions) {
    const permList = Array.isArray(permissions) ? permissions : [permissions];
    const isAllowed = requireAll
      ? permList.every((p) => hasPermission(p))
      : permList.some((p) => hasPermission(p));

    if (!isAllowed) {
      if (fallback !== undefined) {
        return <>{fallback}</>;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
