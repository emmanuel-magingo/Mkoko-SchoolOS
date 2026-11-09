export type FeeStructureStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK' | 'CARD';

export type PaymentStatus = 'RECORDED' | 'VOIDED';

export interface FeeCategory {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructureItem {
  id?: string;
  feeCategoryId: string;
  amount: number | string;
  description?: string | null;
  feeCategory?: FeeCategory;
}

export interface FeeStructure {
  id: string;
  tenantId: string;
  name: string;
  academicYear: number;
  classLevel: string;
  term?: string | null;
  status: FeeStructureStatus;
  currency: string;
  totalAmount: number | string;
  items: (FeeStructureItem & { feeCategory: FeeCategory })[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  feeCategoryId?: string | null;
  categoryName: string;
  amount: number | string;
  description?: string | null;
}

export interface Invoice {
  id: string;
  tenantId: string;
  studentId: string;
  feeStructureId?: string | null;
  invoiceNumber: string;
  academicYear: number;
  term?: string | null;
  issueDate: string;
  dueDate?: string | null;
  status: InvoiceStatus;
  currency: string;
  totalAmount: number | string;
  paidAmount: number | string;
  balance: number | string;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    class?: { name: string } | null;
  };
  feeStructure?: FeeStructure | null;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  tenantId: string;
  paymentId: string;
  studentId: string;
  receiptNumber: string;
  currency: string;
  amount: number | string;
  issuedAt: string;
  issuedById: string;
  brandingSnapshot?: Record<string, unknown> | null;
  issuedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Payment {
  id: string;
  tenantId: string;
  studentId: string;
  invoiceId: string;
  amount: number | string;
  currency: string;
  paymentMethod: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  idempotencyKey?: string | null;
  receivedAt: string;
  receivedById: string;
  receivedBy?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  voidedAt?: string | null;
  voidedById?: string | null;
  voidedBy?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  voidReason?: string | null;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    class?: { name: string } | null;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number | string;
    paidAmount: number | string;
    balance: number | string;
    status: InvoiceStatus;
  };
  receipt?: Receipt | null;
  createdAt: string;
}

export interface StudentFinancialSummary {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    class?: { name: string } | null;
  };
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  currency: string;
  invoices: Invoice[];
  recentPayments: Payment[];
}

export interface FinanceDashboardSummary {
  currency: string;
  totalInvoiced: number;
  totalCollected: number;
  outstandingBalance: number;
  overdueAmount: number;
  collectionRate: number;
  invoicesCount: number;
  outstandingInvoicesCount: number;
  overdueInvoicesCount: number;
  invoiceStatusCounts: {
    paid: number;
    unpaid: number;
    partiallyPaid: number;
    overdue: number;
  };
  collectionsByMonth: Array<{ period: string; amount: number }>;
  invoicedByMonth: Array<{ period: string; amount: number }>;
  paymentsByMethod: Array<{ method: PaymentMethod; amount: number; count: number }>;
  recentPayments: Payment[];
  recentReceipts: (Receipt & { payment?: Payment })[];
  overdueInvoices: Invoice[];
  recentFinancialActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: any;
    createdAt: string;
    actor?: { firstName: string; lastName: string; email: string } | null;
  }>;
}

export interface BreakdownItem {
  key: string;
  label: string;
  totalInvoiced: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionRate: number;
  count?: number;
}

export interface FinancialCollectionReport {
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    outstandingBalance: number;
    collectionRate: number;
    currency: string;
    invoiceCount: number;
    paymentCount: number;
  };
  breakdownByAcademicYear: BreakdownItem[];
  breakdownByTerm: BreakdownItem[];
  breakdownByClass: BreakdownItem[];
  breakdownByFeeCategory: BreakdownItem[];
  breakdownByPaymentMethod: {
    method: string;
    totalAmount: number;
    paymentCount: number;
    percentage: number;
  }[];
}

export interface DailyCollectionReport {
  date: string;
  cashTotal: number;
  mobileMoneyTotal: number;
  bankTotal: number;
  cardTotal: number;
  totalCollected: number;
  currency: string;
  paymentCount: number;
  averagePayment: number;
  payments: Payment[];
}

export interface ReconciliationAnomaly {
  code: string;
  severity: 'WARNING' | 'ERROR';
  entityType: 'INVOICE' | 'PAYMENT' | 'RECEIPT';
  entityId: string;
  description: string;
  detectedAt: string;
  details?: Record<string, any>;
}

export interface FinancialReconciliationReport {
  status: 'CLEAN' | 'ANOMALIES_DETECTED';
  generatedAt: string;
  metrics: {
    totalInvoicesAudited: number;
    totalPaymentsAudited: number;
    totalReceiptsAudited: number;
    cleanInvoicesCount: number;
    anomalyCount: number;
    totalDiscrepancyAmount: number;
  };
  anomalies: ReconciliationAnomaly[];
}

export interface FinancialReportQueryParams {
  page?: number;
  limit?: number;
  academicYear?: number;
  term?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  status?: string;
  feeCategoryId?: string;
  studentId?: string;
  search?: string;
}

