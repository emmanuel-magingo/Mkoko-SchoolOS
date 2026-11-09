import { api } from './client';

export type CompensationStatus = 'ACTIVE' | 'INACTIVE' | 'SUPERSEDED';

export type PayrollPeriodStatus =
  | 'DRAFT'
  | 'CALCULATING'
  | 'CALCULATED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'FINALIZED'
  | 'POSTED';

export type PayrollComponentType =
  | 'BASIC_SALARY'
  | 'HOUSING_ALLOWANCE'
  | 'TRANSPORT_ALLOWANCE'
  | 'RESPONSIBILITY_ALLOWANCE'
  | 'OVERTIME'
  | 'OTHER_ALLOWANCE'
  | 'TAX'
  | 'PENSION'
  | 'LOAN'
  | 'ADVANCE'
  | 'ABSENCE_DEDUCTION'
  | 'OTHER_DEDUCTION';

export type PayrollRecordStatus = 'CALCULATED' | 'FINALIZED' | 'PAID';

export interface CompensationComponent {
  id?: string;
  name: string;
  code: string;
  type: PayrollComponentType;
  amount: number | string | null;
  isTaxable?: boolean;
}

export interface CompensationProfile {
  id: string;
  tenantId: string;
  employeeId: string;
  baseSalary: number | string | null;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: CompensationStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    department?: { name: string } | null;
  };
  components?: CompensationComponent[];
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface PayrollPeriod {
  id: string;
  tenantId: string;
  periodNumber: string;
  name: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: PayrollPeriodStatus;
  currency: string;
  totalGross: number | string | null;
  totalDeductions: number | string | null;
  totalNet: number | string | null;
  employeeCount: number;
  createdById: string;
  calculatedById?: string | null;
  calculatedAt?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  finalizedById?: string | null;
  finalizedAt?: string | null;
  postedById?: string | null;
  postedAt?: string | null;
  financePostingReference?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  calculatedBy?: { id: string; firstName: string; lastName: string } | null;
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  finalizedBy?: { id: string; firstName: string; lastName: string } | null;
  postedBy?: { id: string; firstName: string; lastName: string } | null;
  financePosting?: PayrollFinancePosting | null;
}

export interface PayrollLineItem {
  id: string;
  type: PayrollComponentType;
  code: string;
  name: string;
  amount: number | string | null;
  calculationSource: string;
}

export interface PayrollRecord {
  id: string;
  tenantId: string;
  payrollPeriodId: string;
  employeeId: string;
  payslipNumber: string;
  baseSalarySnapshot: number | string | null;
  grossPay: number | string | null;
  totalDeductions: number | string | null;
  netPay: number | string | null;
  currency: string;
  status: PayrollRecordStatus;
  employmentStatusSnapshot: string;
  jobTitleSnapshot: string;
  employeeNumberSnapshot: string;
  employeeNameSnapshot: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    department?: { id: string; name: string } | null;
  };
  payrollPeriod?: PayrollPeriod;
  lineItems?: PayrollLineItem[];
}

export interface PayrollFinancePosting {
  id: string;
  tenantId: string;
  payrollPeriodId: string;
  postingReference: string;
  postedAt: string;
  postedById: string;
  totalAmount: number | string;
  currency: string;
  paymentMethod: string;
  status: string;
  ledgerAccount: string;
  notes?: string | null;
  postedBy?: { id: string; firstName: string; lastName: string };
}

export const payrollApi = {
  // Compensation Profiles
  getCompensationProfiles: (params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: CompensationStatus;
    search?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.employeeId) qs.append('employeeId', params.employeeId);
    if (params?.status) qs.append('status', params.status);
    if (params?.search) qs.append('search', params.search);
    const query = qs.toString();
    return api.get<{ items: CompensationProfile[]; total: number; page: number; limit: number; totalPages: number }>(
      `/payroll/compensation${query ? `?${query}` : ''}`
    );
  },

  getCompensationByEmployeeId: (employeeId: string) =>
    api.get<CompensationProfile>(`/payroll/compensation/${employeeId}`),

  createCompensationProfile: (data: {
    employeeId: string;
    baseSalary: number;
    currency?: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    components?: Array<{
      name: string;
      code: string;
      type: PayrollComponentType;
      amount: number;
      isTaxable?: boolean;
    }>;
  }) => api.post<CompensationProfile>('/payroll/compensation', data),

  updateCompensationProfile: (
    id: string,
    data: {
      baseSalary?: number;
      currency?: string;
      effectiveFrom?: string;
      effectiveTo?: string | null;
      status?: CompensationStatus;
      components?: Array<{
        name: string;
        code: string;
        type: PayrollComponentType;
        amount: number;
        isTaxable?: boolean;
      }>;
    }
  ) => api.patch<CompensationProfile>(`/payroll/compensation/${id}`, data),

  // Payroll Periods
  getPayrollPeriods: (params?: {
    page?: number;
    limit?: number;
    year?: number;
    status?: PayrollPeriodStatus;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.year) qs.append('year', params.year.toString());
    if (params?.status) qs.append('status', params.status);
    const query = qs.toString();
    return api.get<{ items: PayrollPeriod[]; total: number; page: number; limit: number; totalPages: number }>(
      `/payroll/periods${query ? `?${query}` : ''}`
    );
  },

  getPayrollPeriodById: (id: string) =>
    api.get<PayrollPeriod>(`/payroll/periods/${id}`),

  createPayrollPeriod: (data: {
    name: string;
    year: number;
    month: number;
    startDate: string;
    endDate: string;
    currency?: string;
  }) => api.post<PayrollPeriod>('/payroll/periods', data),

  calculatePayroll: (id: string) =>
    api.post<{ period: PayrollPeriod; recordCount: number }>(`/payroll/periods/${id}/calculate`),

  reviewPayrollPeriod: (id: string, data?: { notes?: string }) =>
    api.post<PayrollPeriod>(`/payroll/periods/${id}/review`, data || {}),

  approvePayrollPeriod: (id: string, data?: { notes?: string }) =>
    api.post<PayrollPeriod>(`/payroll/periods/${id}/approve`, data || {}),

  finalizePayrollPeriod: (id: string) =>
    api.post<PayrollPeriod>(`/payroll/periods/${id}/finalize`),

  postPayrollFinance: (id: string, data?: { paymentMethod?: string; notes?: string }) =>
    api.post<{ period: PayrollPeriod; financePosting: PayrollFinancePosting }>(
      `/payroll/periods/${id}/post`,
      data || {}
    ),

  // Payroll Records
  getPayrollRecordsByPeriod: (
    periodId: string,
    params?: { page?: number; limit?: number; search?: string }
  ) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.search) qs.append('search', params.search);
    const query = qs.toString();
    return api.get<{ data: PayrollRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/payroll/periods/${periodId}/records${query ? `?${query}` : ''}`
    );
  },

  getPayrollRecordById: (id: string) =>
    api.get<PayrollRecord>(`/payroll/records/${id}`),

  // Staff Self-Service
  getMyPayslips: (params?: { page?: number; limit?: number; year?: number; month?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.year) qs.append('year', params.year.toString());
    if (params?.month) qs.append('month', params.month.toString());
    const query = qs.toString();
    return api.get<{ data: PayrollRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/payroll/my-payslips${query ? `?${query}` : ''}`
    );
  },

  getMyPayslipById: (id: string) =>
    api.get<PayrollRecord>(`/payroll/my-payslips/${id}`),
};
