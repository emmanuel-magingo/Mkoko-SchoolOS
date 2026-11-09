import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
export const AcademicsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const { hasPermission } = usePermissions();

  if (!user) return <Navigate to="/login" replace />;
  if (!hasPermission(Permissions.VIEW_ACADEMICS)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};
