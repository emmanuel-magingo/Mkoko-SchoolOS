import { AcademicYear, Term } from './academics.types';

export interface AcademicTerm extends Term {
  isActive?: boolean;
}

export interface AcademicYearWithTerms extends AcademicYear {
  terms?: AcademicTerm[];
}

export interface SchoolSummary {
  id: string;
  name: string;
  code: string;
  status?: string;
  schoolLevel?: string;
  logoUrl?: string | null;
}

export interface AcademicContextType {
  selectedSchoolId: string;
  currentAcademicYearId: string;
  currentTermId: string;
  activeSchoolId: string;
  activeAcademicYearId: string;
  activeTermId: string;
  schools: SchoolSummary[];
  academicYears: AcademicYearWithTerms[];
  terms: AcademicTerm[];
  currentAcademicYear: AcademicYearWithTerms | null;
  currentTerm: AcademicTerm | null;
  activeAcademicYear: AcademicYearWithTerms | null;
  activeTerm: AcademicTerm | null;
  selectedSchool: SchoolSummary | null;
  activeSchool: SchoolSummary | null;
  isLoading: boolean;
  error: string | null;
  setSelectedSchoolId: (schoolId: string) => void;
  setCurrentAcademicYearId: (yearId: string) => void;
  setCurrentTermId: (termId: string) => void;
  setActiveSchoolId: (schoolId: string) => void;
  setActiveAcademicYearId: (yearId: string) => void;
  setActiveTermId: (termId: string) => void;
  refreshAcademicData: () => Promise<void>;
}

export interface AcademicNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral';
  description?: string;
}

export interface AcademicNavGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: AcademicNavItem[];
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  accentColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
}

export interface OperationalException {
  id: string;
  title: string;
  category: 'TIMETABLE_CONFLICT' | 'COVERAGE_DELAY' | 'PENDING_APPROVAL' | 'UNSUBMITTED_MARKS';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  entityName: string;
  timestamp: string;
  actionLabel?: string;
  actionUrl?: string;
}
