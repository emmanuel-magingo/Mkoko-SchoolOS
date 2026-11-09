import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import { AcademicContextType, SchoolSummary, AcademicYearWithTerms, AcademicTerm } from '../types/academic-shell.types';

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

const STORAGE_SCHOOL_KEY = 'schoolos_academic_school_id';
const STORAGE_YEAR_KEY = 'schoolos_academic_year_id';
const STORAGE_TERM_KEY = 'schoolos_academic_term_id';

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useAuth();

  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearWithTerms[]>([]);
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_SCHOOL_KEY) || tenant?.id || '';
    } catch {
      return tenant?.id || '';
    }
  });

  const [currentAcademicYearId, setCurrentAcademicYearIdState] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_YEAR_KEY) || '';
    } catch {
      return '';
    }
  });

  const [currentTermId, setCurrentTermIdState] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_TERM_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedSchoolId = useCallback((id: string) => {
    setSelectedSchoolIdState(id);
    try {
      sessionStorage.setItem(STORAGE_SCHOOL_KEY, id);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setCurrentAcademicYearId = useCallback((id: string) => {
    setCurrentAcademicYearIdState(id);
    try {
      sessionStorage.setItem(STORAGE_YEAR_KEY, id);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setCurrentTermId = useCallback((id: string) => {
    setCurrentTermIdState(id);
    try {
      sessionStorage.setItem(STORAGE_TERM_KEY, id);
    } catch {
      // ignore storage errors
    }
  }, []);

  const fetchAcademicData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch schools
      let fetchedSchools: SchoolSummary[] = [];
      try {
        const schoolsRes = await api.get<SchoolSummary[]>('/schools/my-schools');
        fetchedSchools = Array.isArray(schoolsRes.data) ? schoolsRes.data : [];
      } catch {
        // Fallback to active tenant from AuthContext
        if (tenant) {
          fetchedSchools = [{
            id: tenant.id,
            name: tenant.name,
            code: tenant.code,
            status: tenant.status,
          }];
        }
      }
      setSchools(fetchedSchools);

      // Default school ID if none selected
      if (!selectedSchoolId && (fetchedSchools.length > 0 || tenant?.id)) {
        const defaultSchoolId = fetchedSchools[0]?.id || tenant?.id || '';
        setSelectedSchoolId(defaultSchoolId);
      }

      // 2. Fetch academic years
      const yearsRes = await api.get<AcademicYearWithTerms[]>('/academics/years');
      const years = Array.isArray(yearsRes.data) ? yearsRes.data : [];
      setAcademicYears(years);

      // Auto-select active academic year if not yet selected or invalid
      let activeYear = years.find((y) => y.id === currentAcademicYearId);
      if (!activeYear && years.length > 0) {
        activeYear = years.find((y) => y.isActive) || years[0];
        setCurrentAcademicYearId(activeYear.id);
      }

      // Auto-select active term within that year
      if (activeYear && activeYear.terms && activeYear.terms.length > 0) {
        const termsList: AcademicTerm[] = activeYear.terms;
        let activeTerm = termsList.find((t: AcademicTerm) => t.id === currentTermId);
        if (!activeTerm) {
          activeTerm = termsList.find((t: any) => t.isCurrent || t.is_current || t.isActive) || termsList[0];
          if (activeTerm) {
            setCurrentTermId(activeTerm.id);
          }
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to initialize academic context.');
    } finally {
      setIsLoading(false);
    }
  }, [tenant, selectedSchoolId, currentAcademicYearId, currentTermId, setSelectedSchoolId, setCurrentAcademicYearId, setCurrentTermId]);

  useEffect(() => {
    fetchAcademicData();
  }, []);

  // Update terms when academic year changes
  const currentAcademicYear = useMemo(() => {
    return academicYears.find((y) => y.id === currentAcademicYearId) || null;
  }, [academicYears, currentAcademicYearId]);

  const terms: AcademicTerm[] = useMemo(() => {
    return currentAcademicYear?.terms || [];
  }, [currentAcademicYear]);

  const currentTerm = useMemo(() => {
    return terms.find((t: AcademicTerm) => t.id === currentTermId) || null;
  }, [terms, currentTermId]);

  const selectedSchool = useMemo(() => {
    return schools.find((s) => s.id === selectedSchoolId) || (tenant ? {
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
      status: tenant.status,
    } : null);
  }, [schools, selectedSchoolId, tenant]);

  // Keep term selection in sync with the current academic year's terms
  useEffect(() => {
    if (terms.length > 0 && !terms.some((t: AcademicTerm) => t.id === currentTermId)) {
      const activeTerm = terms.find((t: any) => t.isCurrent || t.is_current || t.isActive) || terms[0];
      if (activeTerm) {
        setCurrentTermId(activeTerm.id);
      }
    }
  }, [terms, currentTermId, setCurrentTermId]);

  const contextValue: AcademicContextType = {
    selectedSchoolId,
    currentAcademicYearId,
    currentTermId,
    activeSchoolId: selectedSchoolId,
    activeAcademicYearId: currentAcademicYearId,
    activeTermId: currentTermId,
    schools,
    academicYears,
    terms,
    currentAcademicYear,
    currentTerm,
    activeAcademicYear: currentAcademicYear,
    activeTerm: currentTerm,
    selectedSchool,
    activeSchool: selectedSchool,
    isLoading,
    error,
    setSelectedSchoolId,
    setCurrentAcademicYearId,
    setCurrentTermId,
    setActiveSchoolId: setSelectedSchoolId,
    setActiveAcademicYearId: setCurrentAcademicYearId,
    setActiveTermId: setCurrentTermId,
    refreshAcademicData: fetchAcademicData,
  };

  return (
    <AcademicContext.Provider value={contextValue}>
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademicContext = (): AcademicContextType => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademicContext must be used within an AcademicProvider');
  }
  return context;
};
