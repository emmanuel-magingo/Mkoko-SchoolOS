import { api } from './client';
import {
  FeeCategory,
  FeeStructure,
  Invoice,
  Payment,
  StudentFinancialSummary,
  FinanceDashboardSummary,
  FinancialCollectionReport,
  DailyCollectionReport,
  FinancialReconciliationReport,
  FinancialReportQueryParams,
} from '../types/finance.types';

export const financeApi = {
  // Fee Categories
  async getFeeCategories(params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: FeeCategory[]; meta?: Record<string, unknown> }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    return api.get<FeeCategory[]>(`/finance/fee-categories${qs ? `?${qs}` : ''}`);
  },

  async createFeeCategory(data: {
    code: string;
    name: string;
    description?: string | null;
  }): Promise<{ data: FeeCategory }> {
    return api.post<FeeCategory>('/finance/fee-categories', data);
  },

  async updateFeeCategory(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    }
  ): Promise<{ data: FeeCategory }> {
    return api.patch<FeeCategory>(`/finance/fee-categories/${id}`, data);
  },

  // Fee Structures
  async getFeeStructures(params?: {
    academicYear?: number;
    classLevel?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: FeeStructure[]; meta?: Record<string, unknown> }> {
    const searchParams = new URLSearchParams();
    if (params?.academicYear) searchParams.append('academicYear', String(params.academicYear));
    if (params?.classLevel) searchParams.append('classLevel', params.classLevel);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    return api.get<FeeStructure[]>(`/finance/fee-structures${qs ? `?${qs}` : ''}`);
  },

  async getFeeStructure(id: string): Promise<{ data: FeeStructure }> {
    return api.get<FeeStructure>(`/finance/fee-structures/${id}`);
  },

  async createFeeStructure(data: {
    name: string;
    academicYear: number;
    classLevel: string;
    term?: string | null;
    currency?: string;
    items: {
      feeCategoryId: string;
      amount: number;
      description?: string | null;
    }[];
  }): Promise<{ data: FeeStructure }> {
    return api.post<FeeStructure>('/finance/fee-structures', data);
  },

  async updateFeeStructure(
    id: string,
    data: {
      name?: string;
      academicYear?: number;
      classLevel?: string;
      term?: string | null;
      currency?: string;
      items?: {
        feeCategoryId: string;
        amount: number;
        description?: string | null;
      }[];
    }
  ): Promise<{ data: FeeStructure }> {
    return api.patch<FeeStructure>(`/finance/fee-structures/${id}`, data);
  },

  async publishFeeStructure(id: string): Promise<{ data: FeeStructure }> {
    return api.post<FeeStructure>(`/finance/fee-structures/${id}/publish`);
  },

  async archiveFeeStructure(id: string): Promise<{ data: FeeStructure }> {
    return api.post<FeeStructure>(`/finance/fee-structures/${id}/archive`);
  },

  // Invoices
  async getInvoices(params?: {
    studentId?: string;
    academicYear?: number;
    term?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Invoice[]; meta?: Record<string, unknown> }> {
    const searchParams = new URLSearchParams();
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.academicYear) searchParams.append('academicYear', String(params.academicYear));
    if (params?.term) searchParams.append('term', params.term);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    return api.get<Invoice[]>(`/finance/invoices${qs ? `?${qs}` : ''}`);
  },

  async getInvoice(id: string): Promise<{ data: Invoice }> {
    return api.get<Invoice>(`/finance/invoices/${id}`);
  },

  async createInvoice(data: {
    studentId: string;
    feeStructureId: string;
    dueDate?: string | null;
    issueDate?: string | null;
  }): Promise<{ data: Invoice }> {
    return api.post<Invoice>('/finance/invoices', data);
  },

  async issueInvoice(id: string): Promise<{ data: Invoice }> {
    return api.post<Invoice>(`/finance/invoices/${id}/issue`);
  },

  async voidInvoice(id: string): Promise<{ data: Invoice }> {
    return api.post<Invoice>(`/finance/invoices/${id}/void`);
  },

  // Payments
  async getPayments(params?: {
    studentId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Payment[]; meta?: Record<string, unknown> }> {
    const searchParams = new URLSearchParams();
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    return api.get<Payment[]>(`/finance/payments${qs ? `?${qs}` : ''}`);
  },

  async getPayment(id: string): Promise<{ data: Payment }> {
    return api.get<Payment>(`/finance/payments/${id}`);
  },

  async recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK' | 'CARD';
    reference: string;
    idempotencyKey?: string | null;
    receivedAt?: string | null;
  }): Promise<{ data: Payment }> {
    return api.post<Payment>('/finance/payments', data);
  },

  async voidPayment(
    id: string,
    data: { reason: string }
  ): Promise<{ data: Payment }> {
    return api.post<Payment>(`/finance/payments/${id}/void`, data);
  },

  // Student Financial Summary
  async getStudentFinancialSummary(
    studentId: string
  ): Promise<{ data: StudentFinancialSummary }> {
    return api.get<StudentFinancialSummary>(
      `/finance/students/${studentId}/summary`
    );
  },

  // Dashboard Summary
  async getDashboardSummary(): Promise<{ data: FinanceDashboardSummary }> {
    return api.get<FinanceDashboardSummary>('/finance/dashboard/summary');
  },

  // Operational Reports (Phase 5)
  async getCollectionReport(
    params?: FinancialReportQueryParams
  ): Promise<{ data: FinancialCollectionReport }> {
    const searchParams = new URLSearchParams();
    if (params?.academicYear) searchParams.append('academicYear', String(params.academicYear));
    if (params?.term) searchParams.append('term', params.term);
    if (params?.classId) searchParams.append('classId', params.classId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params?.feeCategoryId) searchParams.append('feeCategoryId', params.feeCategoryId);
    if (params?.studentId) searchParams.append('studentId', params.studentId);

    const qs = searchParams.toString();
    return api.get<FinancialCollectionReport>(
      `/finance/reports/collection${qs ? `?${qs}` : ''}`
    );
  },

  async getPaymentCollectionReport(
    params?: FinancialReportQueryParams
  ): Promise<{ data: Payment[]; meta?: Record<string, unknown> }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.classId) searchParams.append('classId', params.classId);
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    return api.get<Payment[]>(
      `/finance/reports/payments${qs ? `?${qs}` : ''}`
    );
  },

  async exportPaymentCollectionCsv(params?: FinancialReportQueryParams): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.classId) searchParams.append('classId', params.classId);
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/finance/reports/payments/export${qs ? `?${qs}` : ''}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export CSV report');
    }
    return response.blob();
  },

  async getDailyCollectionReport(
    date?: string
  ): Promise<{ data: DailyCollectionReport }> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return api.get<DailyCollectionReport>(`/finance/reports/daily${qs}`);
  },

  async getReconciliationReport(): Promise<{ data: FinancialReconciliationReport }> {
    return api.get<FinancialReconciliationReport>('/finance/reports/reconciliation');
  },
};

