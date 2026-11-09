import { api } from './client';

export interface ReportsFilter {
  academicYearId?: string;
  termId?: string;
  classId?: string;
  stream?: string;
  subjectId?: string;
  studentId?: string;
  teacherId?: string;
  feeCategoryId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  format?: 'json' | 'csv';
}

export interface MetricEvidenceMetadata {
  metricKey: string;
  metricName: string;
  version: number;
  claimType: 'FACT' | 'MEASURED_VARIANCE' | 'ESTIMATE' | 'INFERENCE' | 'SHADOW_BASELINE' | string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED' | string;
  dataState: 'AVAILABLE' | 'NO_DATA';
  unit: string;
  sourceEntity: string;
  formula: string;
  formulaNote?: string;
}

export interface MetricDefinitionSummary {
  id: string;
  tenantId: string | null;
  metricKey: string;
  name: string;
  description: string;
  domain: string;
  sourceModule: string;
  sourceEntities: string[];
  formula: string;
  aggregationRule: string | null;
  dateSemantics: string;
  claimType: string;
  confidenceRule: string;
  version: number;
  status: string;
  permission: string;
  sensitivity: string;
}

export interface MetricEvidenceSummary {
  id: string;
  tenantId: string;
  metricKey: string;
  metricVersion: number;
  claimType: string;
  confidence: string;
  resultValue: number | null;
  resultUnit: string | null;
  sourceEntity: string | null;
  sourceValues: Record<string, any> | null;
  periodStart: string | null;
  periodEnd: string | null;
  generatedAt: string;
}

export interface ExecutiveDashboardKPIs {
  students: {
    totalStudents: number;
    totalActive: number;
    byClass: Array<{ classId: string; className: string; count: number }>;
    byStream: Array<{ stream: string; count: number }>;
  };
  academics: {
    averageScore: number;
    passRate: number;
    failRate: number;
    totalAssessments: number;
    finalizedAssessments: number;
  };
  attendance: {
    attendanceRate: number;
    totalEligibleSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
  };
  finance: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    evidence?: MetricEvidenceMetadata;
  } | null;
}

export interface OutstandingFeesReportData {
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    invoiceCount: number;
  };
  invoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    studentId: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    dueDate: string | null;
    status: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AcademicPerformanceReportData {
  summary: {
    averageScore: number;
    passRate: number;
    failRate: number;
    totalStudentsAssessed: number;
    assessmentCount: number;
  };
  gradeDistribution: Record<string, number>;
  classBreakdown: Array<{
    classId: string;
    className: string;
    studentCount: number;
    averageScore: number;
    passRate: number;
  }>;
  subjectBreakdown: Array<{
    subjectId: string;
    subjectName: string;
    teacherName: string | null;
    averageScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
  }>;
}

export interface AttendanceSummaryReportData {
  summary: {
    totalEligibleSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
    attendanceRate: number;
  };
  classBreakdown: Array<{
    classId: string;
    className: string;
    studentCount: number;
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  }>;
}

export interface AttendanceTrendsReportData {
  period: 'daily' | 'weekly' | 'monthly';
  data: Array<{
    date: string;
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  }>;
}

export const reportsApi = {
  getDashboardKPIs: async () => {
    const res = await api.get<{ data: ExecutiveDashboardKPIs }>('/api/reports/dashboard');
    return res.data.data;
  },

  getFinanceCollection: async (filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: any }>(`/api/reports/finance/collection?${params.toString()}`);
    return res.data.data;
  },

  getFinancePayments: async (filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: any }>(`/api/reports/finance/payments?${params.toString()}`);
    return res.data.data;
  },

  getFinanceOutstanding: async (filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: OutstandingFeesReportData }>(`/api/reports/finance/outstanding?${params.toString()}`);
    return res.data.data;
  },

  getAcademicPerformance: async (filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: AcademicPerformanceReportData }>(`/api/reports/academics/performance?${params.toString()}`);
    return res.data.data;
  },

  getStudentAcademicReport: async (studentId: string) => {
    const res = await api.get<{ data: any }>(`/api/reports/academics/student/${studentId}`);
    return res.data.data;
  },

  getClassAcademicReport: async (classId: string) => {
    const res = await api.get<{ data: any }>(`/api/reports/academics/class/${classId}`);
    return res.data.data;
  },

  getSubjectAcademicReport: async (subjectId: string, classId?: string) => {
    const params = classId ? `?classId=${classId}` : '';
    const res = await api.get<{ data: any }>(`/api/reports/academics/subject/${subjectId}${params}`);
    return res.data.data;
  },

  getAttendanceSummary: async (filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: AttendanceSummaryReportData }>(`/api/reports/attendance/summary?${params.toString()}`);
    return res.data.data;
  },

  getClassAttendance: async (classId: string, filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: any }>(`/api/reports/attendance/class/${classId}?${params.toString()}`);
    return res.data.data;
  },

  getStudentAttendance: async (studentId: string, filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: any }>(`/api/reports/attendance/student/${studentId}?${params.toString()}`);
    return res.data.data;
  },

  getAttendanceTrends: async (filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const res = await api.get<{ data: AttendanceTrendsReportData }>(`/api/reports/attendance/trends?${params.toString()}`);
    return res.data.data;
  },

  downloadCsvExport: (endpoint: string, filters?: ReportsFilter) => {
    const params = new URLSearchParams();
    params.append('format', 'csv');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return `/api/reports/${endpoint}?${params.toString()}`;
  },

  getMetricDefinitions: async () => {
    const res = await api.get<{ data: MetricDefinitionSummary[] }>('/api/reports/metrics');
    return res.data.data;
  },

  getMetricSnapshot: async (metricKey: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get<{ data: { metric: MetricDefinitionSummary; evidence: MetricEvidenceSummary[] } }>(
      `/api/reports/metrics/${metricKey}${qs}`
    );
    return res.data.data;
  },

  getHistoricalEvidence: async () => {
    const res = await api.get<{ data: MetricEvidenceSummary[] }>('/api/reports/baselines/evidence');
    return res.data.data;
  },
};
