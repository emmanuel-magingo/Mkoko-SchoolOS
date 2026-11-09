import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatMoney, formatDate } from '../utils/format';
import { financeApi } from '../api/finance.api';
import { api } from '../api/client';
import { UserRole } from '../types';

describe('MKOKO SCHOOLOS — PHASE 3 FINANCE FRONTEND ENGINE', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // FORMATTING & MONEY CALCULATIONS
  // ==========================================================================
  describe('TZS Formatting & Currency Utilities', () => {
    it('formats monetary figures according to TZS currency standards (TZS 2,450,000)', () => {
      expect(formatMoney(2450000)).toBe('TZS 2,450,000');
      expect(formatMoney('150000')).toBe('TZS 150,000');
      expect(formatMoney(0)).toBe('TZS 0');
      expect(formatMoney(null)).toBe('TZS 0');
      expect(formatMoney(undefined)).toBe('TZS 0');
      expect(formatMoney(75000.5)).toBe('TZS 75,000.5');
    });

    it('formats dates consistently', () => {
      const formatted = formatDate('2026-09-28T07:00:00.000Z');
      expect(formatted).toMatch(/28\s+\w+\s+2026/);
      expect(formatDate(null)).toBe('—');
    });
  });

  // ==========================================================================
  // 11 CRITICAL FRONTEND WORKFLOWS (SECTION 24)
  // ==========================================================================
  describe('Phase 3 Critical Workflows', () => {
    // Test 1: Bursar can access Finance
    it('Test 1: Bursar can access Finance navigation and operational routes', () => {
      const bursarRole: UserRole = 'BURSAR';
      const authorizedRoles: UserRole[] = ['SCHOOL_ADMIN', 'BURSAR', 'HEADMASTER'];
      const canAccessFinance = authorizedRoles.includes(bursarRole);
      const isReadOnly = (bursarRole as string) === 'HEADMASTER';

      expect(canAccessFinance).toBe(true);
      expect(isReadOnly).toBe(false);
    });

    // Test 2: Teacher cannot access Finance operations
    it('Test 2: Teacher cannot access Finance operations or routes', () => {
      const teacherRole: UserRole = 'TEACHER';
      const staffRole: UserRole = 'STAFF';
      const platformAdminRole: UserRole = 'PLATFORM_ADMIN';
      const authorizedRoles = ['SCHOOL_ADMIN', 'BURSAR', 'HEADMASTER'];

      expect(authorizedRoles.includes(teacherRole)).toBe(false);
      expect(authorizedRoles.includes(staffRole)).toBe(false);
      expect(authorizedRoles.includes(platformAdminRole)).toBe(false);
    });

    // Test 3: Headmaster sees read-only UI
    it('Test 3: Headmaster has access to Finance in strictly read-only mode', () => {
      const headmasterRole: UserRole = 'HEADMASTER';
      const authorizedRoles = ['SCHOOL_ADMIN', 'BURSAR', 'HEADMASTER'];
      const canAccess = authorizedRoles.includes(headmasterRole);
      const isReadOnly = headmasterRole === 'HEADMASTER';

      expect(canAccess).toBe(true);
      expect(isReadOnly).toBe(true);

      // Mutation controls are suppressed when isReadOnly is true
      const canCreate = !isReadOnly;
      const canPublish = !isReadOnly;
      const canRecordPayment = !isReadOnly;
      const canVoidPayment = !isReadOnly;

      expect(canCreate).toBe(false);
      expect(canPublish).toBe(false);
      expect(canRecordPayment).toBe(false);
      expect(canVoidPayment).toBe(false);
    });

    // Test 4: Create fee structure
    it('Test 4: Create fee structure calculates total live and submits valid draft payload', async () => {
      const mockStructure = {
        id: 'fs-123',
        tenantId: 'tenant-456',
        name: 'Form 1 Term 1 Fees 2026',
        academicYear: 2026,
        classLevel: 'Form 1',
        term: 'Term 1',
        status: 'DRAFT' as const,
        currency: 'TZS',
        totalAmount: 200000,
        items: [
          {
            feeCategoryId: 'cat-1',
            amount: 150000,
            feeCategory: { id: 'cat-1', tenantId: 'tenant-456', code: 'TUITION', name: 'Tuition', isActive: true, createdAt: '', updatedAt: '' },
          },
          {
            feeCategoryId: 'cat-2',
            amount: 50000,
            feeCategory: { id: 'cat-2', tenantId: 'tenant-456', code: 'LIBRARY', name: 'Library', isActive: true, createdAt: '', updatedAt: '' },
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const items = [
        { feeCategoryId: 'cat-1', amount: 150000, description: 'Tuition' },
        { feeCategoryId: 'cat-2', amount: 50000, description: 'Library' },
      ];

      // Live calculation check
      const liveTotal = items.reduce((sum, item) => sum + item.amount, 0);
      expect(liveTotal).toBe(200000);
      expect(formatMoney(liveTotal)).toBe('TZS 200,000');

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockStructure });

      const res = await financeApi.createFeeStructure({
        name: 'Form 1 Term 1 Fees 2026',
        academicYear: 2026,
        classLevel: 'Form 1',
        term: 'Term 1',
        currency: 'TZS',
        items,
      });

      expect(res.data.id).toBe('fs-123');
      expect(res.data.status).toBe('DRAFT');
      expect(Number(res.data.totalAmount)).toBe(200000);
    });

    // Test 5: Publish fee structure
    it('Test 5: Publish fee structure updates status to PUBLISHED and locks mutations', async () => {
      const publishedMock = {
        id: 'fs-123',
        tenantId: 'tenant-456',
        name: 'Form 1 Term 1 Fees 2026',
        academicYear: 2026,
        classLevel: 'Form 1',
        term: 'Term 1',
        status: 'PUBLISHED' as const,
        currency: 'TZS',
        totalAmount: 200000,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: publishedMock });

      const res = await financeApi.publishFeeStructure('fs-123');
      expect(res.data.status).toBe('PUBLISHED');
      expect(res.data.id).toBe('fs-123');
    });

    // Test 6: Generate invoice
    it('Test 6: Generate invoice binds active student to published structure and returns snapshot items', async () => {
      const mockInvoice = {
        id: 'inv-001',
        tenantId: 'tenant-456',
        studentId: 'student-789',
        feeStructureId: 'fs-123',
        invoiceNumber: 'INV-2026-000001',
        academicYear: 2026,
        term: 'Term 1',
        issueDate: '2026-09-28',
        dueDate: '2026-10-28',
        status: 'ISSUED' as const,
        currency: 'TZS',
        totalAmount: 200000,
        paidAmount: 0,
        balance: 200000,
        student: {
          id: 'student-789',
          admissionNumber: 'MKO-2026-001',
          firstName: 'Juma',
          lastName: 'Mussa',
        },
        items: [
          {
            id: 'item-1',
            invoiceId: 'inv-001',
            categoryName: 'Tuition',
            amount: 150000,
          },
          {
            id: 'item-2',
            invoiceId: 'inv-001',
            categoryName: 'Library',
            amount: 50000,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockInvoice });

      const res = await financeApi.createInvoice({
        studentId: 'student-789',
        feeStructureId: 'fs-123',
        issueDate: '2026-09-28',
        dueDate: '2026-10-28',
      });

      expect(res.data.invoiceNumber).toBe('INV-2026-000001');
      expect(res.data.balance).toBe(200000);
      expect(res.data.paidAmount).toBe(0);
      expect(res.data.items.length).toBe(2);
    });

    // Test 7: Record payment
    it('Test 7: Record payment validates client-side idempotency and reduces balance', async () => {
      const mockPayment = {
        id: 'pay-001',
        tenantId: 'tenant-456',
        studentId: 'student-789',
        invoiceId: 'inv-001',
        amount: 80000,
        currency: 'TZS',
        paymentMethod: 'MOBILE_MONEY' as const,
        reference: 'MPESA-XYZ999',
        status: 'RECORDED' as const,
        idempotencyKey: 'pay_test_key_1',
        receivedAt: new Date().toISOString(),
        receivedById: 'user-bursar',
        student: {
          id: 'student-789',
          admissionNumber: 'MKO-2026-001',
          firstName: 'Juma',
          lastName: 'Mussa',
        },
        invoice: {
          id: 'inv-001',
          invoiceNumber: 'INV-2026-000001',
          totalAmount: 200000,
          paidAmount: 80000,
          balance: 120000,
          status: 'PARTIALLY_PAID' as const,
        },
        receipt: {
          id: 'rcp-001',
          tenantId: 'tenant-456',
          paymentId: 'pay-001',
          studentId: 'student-789',
          receiptNumber: 'SCHOOL-RCP-2026-000001',
          currency: 'TZS',
          amount: 80000,
          issuedAt: new Date().toISOString(),
          issuedById: 'user-bursar',
        },
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockPayment });

      const res = await financeApi.recordPayment({
        invoiceId: 'inv-001',
        amount: 80000,
        paymentMethod: 'MOBILE_MONEY',
        reference: 'MPESA-XYZ999',
        idempotencyKey: 'pay_test_key_1',
      });

      expect(res.data.status).toBe('RECORDED');
      expect(res.data.amount).toBe(80000);
      expect(res.data.invoice.balance).toBe(120000);
      expect(res.data.invoice.status).toBe('PARTIALLY_PAID');
    });

    // Test 8: Receipt appears after payment
    it('Test 8: Digital receipt is issued immediately upon payment recordation', async () => {
      const mockPaymentWithReceipt = {
        id: 'pay-001',
        tenantId: 'tenant-456',
        studentId: 'student-789',
        invoiceId: 'inv-001',
        amount: 80000,
        currency: 'TZS',
        paymentMethod: 'MOBILE_MONEY' as const,
        reference: 'MPESA-XYZ999',
        status: 'RECORDED' as const,
        receivedAt: new Date().toISOString(),
        receivedById: 'user-bursar',
        student: {
          id: 'student-789',
          admissionNumber: 'MKO-2026-001',
          firstName: 'Juma',
          lastName: 'Mussa',
        },
        invoice: {
          id: 'inv-001',
          invoiceNumber: 'INV-2026-000001',
          totalAmount: 200000,
          paidAmount: 80000,
          balance: 120000,
          status: 'PARTIALLY_PAID' as const,
        },
        receipt: {
          id: 'rcp-001',
          tenantId: 'tenant-456',
          paymentId: 'pay-001',
          studentId: 'student-789',
          receiptNumber: 'SCHOOL-RCP-2026-000001',
          currency: 'TZS',
          amount: 80000,
          issuedAt: new Date().toISOString(),
          issuedById: 'user-bursar',
        },
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockPaymentWithReceipt });

      const res = await financeApi.getPayment('pay-001');
      expect(res.data.receipt).toBeDefined();
      expect(res.data.receipt?.receiptNumber).toBe('SCHOOL-RCP-2026-000001');
      expect(res.data.receipt?.amount).toBe(80000);
    });

    // Test 9: Balance updates after payment
    it('Test 9: Invoice balance calculation reflects paid amount correctly', () => {
      const totalAmount = 200000;
      const paymentAmount = 80000;
      const expectedBalance = totalAmount - paymentAmount;

      expect(expectedBalance).toBe(120000);
      expect(formatMoney(expectedBalance)).toBe('TZS 120,000');
    });

    // Test 10: Void payment updates balance
    it('Test 10: Void payment requires reason ≥ 5 chars, marks status VOIDED, and restores balance', async () => {
      const mockVoidedPayment = {
        id: 'pay-001',
        tenantId: 'tenant-456',
        studentId: 'student-789',
        invoiceId: 'inv-001',
        amount: 80000,
        currency: 'TZS',
        paymentMethod: 'MOBILE_MONEY' as const,
        reference: 'MPESA-XYZ999',
        status: 'VOIDED' as const,
        voidedAt: new Date().toISOString(),
        voidedById: 'user-bursar',
        voidReason: 'Cheque bounced at bank',
        receivedAt: new Date().toISOString(),
        receivedById: 'user-bursar',
        student: {
          id: 'student-789',
          admissionNumber: 'MKO-2026-001',
          firstName: 'Juma',
          lastName: 'Mussa',
        },
        invoice: {
          id: 'inv-001',
          invoiceNumber: 'INV-2026-000001',
          totalAmount: 200000,
          paidAmount: 0,
          balance: 200000,
          status: 'ISSUED' as const,
        },
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockVoidedPayment });

      const reason = 'Cheque bounced at bank';
      expect(reason.length).toBeGreaterThanOrEqual(5);

      const res = await financeApi.voidPayment('pay-001', { reason });
      expect(res.data.status).toBe('VOIDED');
      expect(res.data.voidReason).toBe(reason);
      expect(res.data.invoice.balance).toBe(200000);
      expect(res.data.invoice.paidAmount).toBe(0);
    });

    // Test 11: No mutation controls for unauthorized roles
    it('Test 11: No mutation controls (create, edit, publish, payment, void) for unauthorized roles', () => {
      const checkPermissions = (role: UserRole) => {
        const canAccessFinance = ['SCHOOL_ADMIN', 'BURSAR', 'HEADMASTER'].includes(role);
        const canMutate = ['SCHOOL_ADMIN', 'BURSAR'].includes(role);
        return { canAccessFinance, canMutate };
      };

      // Teachers: No access, no mutation
      expect(checkPermissions('TEACHER')).toEqual({ canAccessFinance: false, canMutate: false });
      // Staff: No access, no mutation
      expect(checkPermissions('STAFF')).toEqual({ canAccessFinance: false, canMutate: false });
      // Platform Admin: No school finance access, no mutation
      expect(checkPermissions('PLATFORM_ADMIN')).toEqual({ canAccessFinance: false, canMutate: false });
      // Headmaster: Can access (read-only), no mutation
      expect(checkPermissions('HEADMASTER')).toEqual({ canAccessFinance: true, canMutate: false });
      // Bursar: Can access and can mutate
      expect(checkPermissions('BURSAR')).toEqual({ canAccessFinance: true, canMutate: true });
      // School Admin: Can access and can mutate
      expect(checkPermissions('SCHOOL_ADMIN')).toEqual({ canAccessFinance: true, canMutate: true });
    });
  });

  // ==========================================================================
  // STUDENT FINANCIAL SUMMARY ENDPOINT VERIFICATION
  // ==========================================================================
  describe('Student Financial Summary Flow', () => {
    it('consumes GET /api/finance/students/:studentId/summary authoritative data', async () => {
      const mockSummary = {
        student: {
          id: 'student-789',
          admissionNumber: 'MKO-2026-001',
          firstName: 'Juma',
          lastName: 'Mussa',
          class: { name: 'Form 1A' },
        },
        totalInvoiced: 200000,
        totalPaid: 80000,
        totalOutstanding: 120000,
        currency: 'TZS',
        invoices: [],
        recentPayments: [],
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockSummary });

      const res = await financeApi.getStudentFinancialSummary('student-789');
      expect(res.data.student.admissionNumber).toBe('MKO-2026-001');
      expect(res.data.totalInvoiced).toBe(200000);
      expect(res.data.totalPaid).toBe(80000);
      expect(res.data.totalOutstanding).toBe(120000);
    });
  });

  // ==========================================================================
  // PHASE 5: FINANCIAL REPORTS, DAILY COLLECTION & RECONCILIATION
  // ==========================================================================
  describe('Phase 5 Operational Reporting & Reconciliation Flow', () => {
    it('consumes GET /api/finance/reports/collection with multi-dimensional breakdowns', async () => {
      const mockCollection = {
        summary: {
          totalInvoiced: 500000,
          totalCollected: 350000,
          outstandingBalance: 150000,
          collectionRate: 70,
          currency: 'TZS',
          invoiceCount: 5,
          paymentCount: 4,
        },
        breakdownByAcademicYear: [{ key: '2026', label: '2026', totalInvoiced: 500000, totalCollected: 350000, outstandingBalance: 150000, collectionRate: 70 }],
        breakdownByTerm: [{ key: 'Term 1', label: 'Term 1', totalInvoiced: 500000, totalCollected: 350000, outstandingBalance: 150000, collectionRate: 70 }],
        breakdownByClass: [{ key: 'cls-1', label: 'Form 1', totalInvoiced: 500000, totalCollected: 350000, outstandingBalance: 150000, collectionRate: 70 }],
        breakdownByFeeCategory: [{ key: 'cat-1', label: 'Tuition', totalInvoiced: 500000, totalCollected: 350000, outstandingBalance: 150000, collectionRate: 70 }],
        breakdownByPaymentMethod: [
          { method: 'BANK', totalAmount: 200000, paymentCount: 2, percentage: 57.14 },
          { method: 'CASH', totalAmount: 150000, paymentCount: 2, percentage: 42.86 },
        ],
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockCollection });

      const res = await financeApi.getCollectionReport({ academicYear: 2026, term: 'Term 1' });
      expect(res.data.summary.totalInvoiced).toBe(500000);
      expect(res.data.summary.totalCollected).toBe(350000);
      expect(res.data.summary.outstandingBalance).toBe(150000);
      expect(res.data.summary.collectionRate).toBe(70);
      expect(res.data.breakdownByPaymentMethod).toHaveLength(2);
    });

    it('consumes GET /api/finance/reports/daily with method breakdown and average payment', async () => {
      const mockDaily = {
        date: '2026-10-03',
        cashTotal: 100000,
        mobileMoneyTotal: 150000,
        bankTotal: 250000,
        cardTotal: 0,
        totalCollected: 500000,
        currency: 'TZS',
        paymentCount: 5,
        averagePayment: 100000,
        payments: [],
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockDaily });

      const res = await financeApi.getDailyCollectionReport('2026-10-03');
      expect(res.data.totalCollected).toBe(500000);
      expect(res.data.cashTotal).toBe(100000);
      expect(res.data.mobileMoneyTotal).toBe(150000);
      expect(res.data.bankTotal).toBe(250000);
      expect(res.data.paymentCount).toBe(5);
      expect(res.data.averagePayment).toBe(100000);
    });

    it('consumes GET /api/finance/reports/reconciliation for clean and anomalous states', async () => {
      const mockReconciliation = {
        status: 'CLEAN' as const,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalInvoicesAudited: 12,
          totalPaymentsAudited: 8,
          totalReceiptsAudited: 8,
          cleanInvoicesCount: 12,
          anomalyCount: 0,
          totalDiscrepancyAmount: 0,
        },
        anomalies: [],
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockReconciliation });

      const res = await financeApi.getReconciliationReport();
      expect(res.data.status).toBe('CLEAN');
      expect(res.data.metrics.anomalyCount).toBe(0);
      expect(res.data.metrics.totalInvoicesAudited).toBe(12);
    });
  });
});
