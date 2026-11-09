import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User, tenant: Tenant | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('schoolos_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const isPlatform = user?.role === 'PLATFORM_ADMIN' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/platform'));
    const branding = isPlatform ? null : tenant?.branding;
    const defaultColors = {
      primary: '#15803d',
      secondary: '#0f172a',
      accent: '#0284c7',
      sidebar: '#ffffff',
      surface: '#ffffff',
      background: '#f8fafc',
      text: '#1e293b',
    };
    const colors = branding ?? defaultColors;
    const toRgb = (hex: string) => {
      const value = hex.replace('#', '');
      return `${parseInt(value.slice(0, 2), 16)} ${parseInt(value.slice(2, 4), 16)} ${parseInt(value.slice(4, 6), 16)}`;
    };
    for (const [key, value] of Object.entries(colors)) {
      document.documentElement.style.setProperty(`--theme-${key}-rgb`, toRgb(value));
    }
  }, [tenant, user?.role]);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('schoolos_token');
    if (!storedToken) {
      setUser(null);
      setTenant(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: User['role'];
        tenantId: string | null;
        mustChangePassword: boolean;
        customPermissions: string[];
        academicDepartment?: { id: string; name: string; code: string } | null;
        department?: { id: string; name: string; code: string } | null;
        staffProfileId?: string | null;
        assignedClassesAsTeacher?: Array<{ id: string; name: string; level?: string; stream?: string }>;
        isClassTeacher?: boolean;
        tenant: Tenant | null;
      }>('/auth/me');

      const dept = res.data.academicDepartment || res.data.department || null;

      const userData: User = {
        id: res.data.id,
        email: res.data.email,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        role: res.data.role,
        tenantId: res.data.tenantId,
        mustChangePassword: res.data.mustChangePassword,
        customPermissions: res.data.customPermissions,
        academicDepartment: dept,
        department: dept,
        staffProfileId: res.data.staffProfileId || undefined,
        assignedClassesAsTeacher: res.data.assignedClassesAsTeacher || [],
        isClassTeacher: res.data.isClassTeacher || false,
      };

      setUser(userData);
      setTenant(res.data.tenant);
      setToken(storedToken);
    } catch {
      api.clearToken();
      setUser(null);
      setTenant(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: User, newTenant: Tenant | null) => {
    api.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setTenant(newTenant);
  };

  const logout = async () => {
    const isPlatform = (typeof window !== 'undefined' && window.location.pathname.startsWith('/platform')) || user?.role === 'PLATFORM_ADMIN';
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      api.clearToken();
      setUser(null);
      setTenant(null);
      setToken(null);
      for (const key of ['primary', 'secondary', 'accent', 'sidebar', 'surface', 'background', 'text']) {
        document.documentElement.style.removeProperty(`--theme-${key}-rgb`);
      }
      window.location.href = isPlatform ? '/platform/login' : '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
