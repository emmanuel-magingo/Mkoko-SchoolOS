import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';

export const DutyRosterGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  if (!user) return <Navigate to="/login" replace />;

  const isTeacher = user.role === 'TEACHER';
  const isAuthorizedManager =
    hasPermission(Permissions.MANAGE_DUTY_ROSTER) ||
    ['SCHOOL_ADMIN', 'HEADMASTER', 'SECOND_MASTER', 'SENIOR_ACADEMIC_MASTER', 'ACADEMIC_MASTER', 'ADMIN', 'SCHOOL_MANAGER'].includes(
      user.role as string
    );

  const isAssigned = Boolean((user as any)?.isTeacherOnDuty || hasPermission(Permissions.VIEW_DUTY_ROSTER));

  if (!isAuthorizedManager && (!isTeacher || !isAssigned)) {
    return <Navigate to="/academics" replace />;
  }

  return <>{children}</>;
};
