import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { financeApi } from '../../api/finance.api';
import {
  FinancialCollectionReport,
  DailyCollectionReport,
  FinancialReconciliationReport,
  Payment,
  PaymentMethod,
} from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { formatMoney, formatDate } from '../../utils/format';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  Banknote,
  Receipt,
  FileText,
  Layers,
  GraduationCap,
} from 'lucide-react';

type TabType = 'collection' | 'payments' | 'daily' | 'reconciliation';

export const FinancialReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('collection');

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Collection Report State
  const [collectionReport, setCollectionReport] = useState<FinancialCollectionReport | null>(null);
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('2026');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [categoryBreakdownTab, setCategoryBreakdownTab] = useState<'year' | 'term' | 'class' | 'category' | 'method'>('class');

  // Tab 2: Payments Ledger State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentTotal, setPaymentTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Tab 3: Daily Collection State
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<DailyCollectionReport | null>(null);

  // Tab 4: Reconciliation State
  const [reconciliationReport, setReconciliationReport] = useState<FinancialReconciliationReport | null>(null);

  // 1. Fetch Collection Report
  const fetchCollectionReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (academicYearFilter && academicYearFilter !== 'all') {
        params.academicYear = Number(academicYearFilter);
      }
      if (termFilter && termFilter !== 'all') {
        params.term = termFilter;
      }
      const res = await financeApi.getCollectionReport(params);
      setCollectionReport(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load collection report');
    } finally {
      setLoading(false);
    }
  }, [academicYearFilter, termFilter]);

  // 2. Fetch Payment Ledger
  const fetchPaymentLedger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit };
      if (paymentSearch.trim()) params.search = paymentSearch.trim();
      if (paymentMethodFilter !== 'all') params.paymentMethod = paymentMethodFilter as PaymentMethod;
      if (paymentStatusFilter !== 'all') params.status = paymentStatusFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

      const res = await financeApi.getPaymentCollectionReport(params);
      setPayments(res.data);
      if (res.meta?.total !== undefined) {
        setPaymentTotal(Number(res.meta.total));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load payments report');
    } finally {
      setLoading(false);
    }
  }, [page, limit, paymentSearch, paymentMethodFilter, paymentStatusFilter, startDateFilter, endDateFilter]);

  // 3. Fetch Daily Collection
  const fetchDailyReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getDailyCollectionReport(dailyDate);
      setDailyReport(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load daily collections');
    } finally {
      setLoading(false);
    }
  }, [dailyDate]);

  // 4. Fetch Reconciliation Report
  const fetchReconciliationReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getReconciliationReport();
      setReconciliationReport(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to run financial reconciliation');
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'collection') {
      fetchCollectionReport();
    } else if (activeTab === 'payments') {
      fetchPaymentLedger();
    } else if (activeTab === 'daily') {
      fetchDailyReport();
    } else if (activeTab === 'reconciliation') {
      fetchReconciliationReport();
    }
  }, [activeTab, fetchCollectionReport, fetchPaymentLedger, fetchDailyReport, fetchReconciliationReport]);

  // CSV Export handler
  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      const params: any = {};
      if (paymentSearch.trim()) params.search = paymentSearch.trim();
      if (paymentMethodFilter !== 'all') params.paymentMethod = paymentMethodFilter as PaymentMethod;
      if (paymentStatusFilter !== 'all') params.status = paymentStatusFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

      const blob = await financeApi.exportPaymentCollectionCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-ledger-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to export CSV: ' + (err.message || 'Network error'));
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Reports & Controls</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time collection monitoring, payment ledger auditing, daily reconciliation, and financial integrity checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'HEADMASTER' && (
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Headmaster (Oversight View)</span>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-xl font-bold text-slate-900">Mkoko SchoolOS — Financial Collection & Reconciliation Report</h1>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
          <span>Generated On: {new Date().toLocaleString()}</span>
          <span>Tenant Context: School Financial Authority</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 print:hidden">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('collection')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'collection'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Collection Monitoring</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Payment Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'daily'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Collection</span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'reconciliation'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Reconciliation & Health</span>
          </button>
        </nav>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'collection') fetchCollectionReport();
              if (activeTab === 'payments') fetchPaymentLedger();
              if (activeTab === 'daily') fetchDailyReport();
              if (activeTab === 'reconciliation') fetchReconciliationReport();
            }}
            className="text-xs font-semibold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: COLLECTION MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-medium">Filter By:</span>
              </div>

              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Academic Years</option>
                <option value="2026">Academic Year 2026</option>
                <option value="2025">Academic Year 2025</option>
              </select>

              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            <button
              onClick={fetchCollectionReport}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Collection KPIs */}
          {collectionReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {formatMoney(collectionReport.summary.totalInvoiced)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Across {collectionReport.summary.invoiceCount} issued invoices
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Collected</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-emerald-700 mt-2">
                  {formatMoney(collectionReport.summary.totalCollected)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {collectionReport.summary.paymentCount} valid recorded payments
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Outstanding Balance</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-amber-700 mt-2">
                  {formatMoney(collectionReport.summary.outstandingBalance)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pending school fee revenue
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Collection Rate</span>
                  <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl font-bold text-brand-700">{collectionReport.summary.collectionRate}%</span>
                  <span className="text-xs text-slate-400">of total invoiced</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-brand-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(collectionReport.summary.collectionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Breakdown Section with Sub-navigation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Collection Breakdown</h3>
                <p className="text-[11px] text-slate-500">
                  Detailed view by academic dimension with verified invoiced, collected, and outstanding sums.
                </p>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto print:hidden">
                <button
                  onClick={() => setCategoryBreakdownTab('class')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    categoryBreakdownTab === 'class' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  By Class
                </button>
                <button
                  onClick={() => setCategoryBreakdownTab('category')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    categoryBreakdownTab === 'category' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  By Fee Category
                </button>
                <button
                  onClick={() => setCategoryBreakdownTab('term')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    categoryBreakdownTab === 'term' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  By Term
                </button>
                <button
                  onClick={() => setCategoryBreakdownTab('method')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    categoryBreakdownTab === 'method' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  By Payment Method
                </button>
              </div>
            </div>

            {/* Breakdown Content */}
            <div className="overflow-x-auto">
              {categoryBreakdownTab === 'method' ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-right">Transactions</th>
                      <th className="py-3 px-4 text-right">Total Amount (TZS)</th>
                      <th className="py-3 px-4 text-right">% of Total Collections</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collectionReport?.breakdownByPaymentMethod.map((m) => (
                      <tr key={m.method} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          {m.method === 'CASH' && <Banknote className="w-4 h-4 text-emerald-600" />}
                          {m.method === 'MOBILE_MONEY' && <Smartphone className="w-4 h-4 text-amber-600" />}
                          {m.method === 'BANK' && <Building2 className="w-4 h-4 text-blue-600" />}
                          {m.method === 'CARD' && <CreditCard className="w-4 h-4 text-purple-600" />}
                          <span>{m.method.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{m.paymentCount}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatMoney(m.totalAmount)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-slate-700">{m.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Dimension</th>
                      <th className="py-3 px-4 text-right">Total Invoiced</th>
                      <th className="py-3 px-4 text-right">Total Collected</th>
                      <th className="py-3 px-4 text-right">Outstanding</th>
                      <th className="py-3 px-4 text-right">Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryBreakdownTab === 'class' &&
                      collectionReport?.breakdownByClass.map((item) => (
                        <tr key={item.key} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                            <span>{item.label}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-700">{formatMoney(item.totalInvoiced)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(item.totalCollected)}</td>
                          <td className="py-3 px-4 text-right font-medium text-amber-600">{formatMoney(item.outstandingBalance)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">{item.collectionRate}%</td>
                        </tr>
                      ))}

                    {categoryBreakdownTab === 'category' &&
                      collectionReport?.breakdownByFeeCategory.map((item) => (
                        <tr key={item.key} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400" />
                            <span>{item.label}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-700">{formatMoney(item.totalInvoiced)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(item.totalCollected)}</td>
                          <td className="py-3 px-4 text-right font-medium text-amber-600">{formatMoney(item.outstandingBalance)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">{item.collectionRate}%</td>
                        </tr>
                      ))}

                    {categoryBreakdownTab === 'term' &&
                      collectionReport?.breakdownByTerm.map((item) => (
                        <tr key={item.key} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{item.label}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-700">{formatMoney(item.totalInvoiced)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(item.totalCollected)}</td>
                          <td className="py-3 px-4 text-right font-medium text-amber-600">{formatMoney(item.outstandingBalance)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">{item.collectionRate}%</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENT LEDGER REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Controls & Export Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search receipt, student, reference..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK">Bank</option>
                <option value="CARD">Card</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="RECORDED">Recorded (Valid)</option>
                <option value="VOIDED">Voided (Cancelled)</option>
              </select>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>From:</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>To:</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleExportCsv}
                disabled={isExportingCsv}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4 text-right">Amount (TZS)</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No payments found matching the current criteria.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-50/50 ${p.status === 'VOIDED' ? 'bg-rose-50/20' : ''}`}>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {formatDate(p.receivedAt)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {p.receipt?.receiptNumber || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{p.student.firstName} {p.student.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.student.admissionNumber}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.student.class?.name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {p.invoice.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatMoney(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral" size="sm">
                            {p.paymentMethod.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {p.reference}
                        </td>
                        <td className="py-3 px-4">
                          {p.status === 'RECORDED' ? (
                            <Badge variant="success" size="sm">
                              RECORDED
                            </Badge>
                          ) : (
                            <div className="flex flex-col">
                              <Badge variant="danger" size="sm">
                                VOIDED
                              </Badge>
                              {p.voidReason && (
                                <span className="text-[10px] text-rose-600 italic mt-0.5 max-w-[120px] truncate" title={p.voidReason}>
                                  {p.voidReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 print:hidden">
              <span>Showing {payments.length} of {paymentTotal} total records</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Previous
                </button>
                <span>Page {page} of {Math.ceil(paymentTotal / limit) || 1}</span>
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page >= Math.ceil(paymentTotal / limit)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DAILY COLLECTION VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Selector Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <label htmlFor="daily-date-picker" className="text-xs font-semibold text-slate-700">Collection Date:</label>
              <input
                id="daily-date-picker"
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              onClick={fetchDailyReport}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Day Summary</span>
            </button>
          </div>

          {/* Daily KPIs */}
          {dailyReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-xs col-span-1 sm:col-span-2 lg:col-span-2">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Total Day Collection ({dailyReport.date})
                </span>
                <p className="text-2xl font-bold text-emerald-900 mt-2">
                  {formatMoney(dailyReport.totalCollected)}
                </p>
                <div className="flex items-center gap-4 text-xs text-emerald-700 mt-2">
                  <span>{dailyReport.paymentCount} payments received</span>
                  <span>•</span>
                  <span>Avg: {formatMoney(dailyReport.averagePayment)}</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-semibold uppercase">Cash</span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-1.5">{formatMoney(dailyReport.cashTotal)}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] font-semibold uppercase">Mobile Money</span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-1.5">{formatMoney(dailyReport.mobileMoneyTotal)}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-semibold uppercase">Bank Transfer</span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-1.5">{formatMoney(dailyReport.bankTotal)}</p>
              </div>
            </div>
          )}

          {/* Today's Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-900">Recorded Transactions for {dailyDate}</h3>
              <p className="text-[11px] text-slate-500">
                Authoritative transaction ledger for the selected day. Strictly excludes voided payments.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-right">Amount (TZS)</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyReport?.payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No recorded collections on this date.
                      </td>
                    </tr>
                  ) : (
                    dailyReport?.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {p.receipt?.receiptNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {p.student.firstName} {p.student.lastName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.student.class?.name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatMoney(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral" size="sm">
                            {p.paymentMethod.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {p.reference}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.receivedBy ? `${p.receivedBy.firstName} ${p.receivedBy.lastName}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FINANCIAL RECONCILIATION */}
      {/* ========================================================================= */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Diagnostic Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Automated Financial Integrity & Reconciliation Engine</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Audits all invoices, payments, and receipts for balance mismatches, orphan records, and calculation discrepancies.
              </p>
            </div>

            <button
              onClick={fetchReconciliationReport}
              disabled={loading}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Run Diagnostic Audit</span>
            </button>
          </div>

          {/* Reconciliation Status Card */}
          {reconciliationReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Status</span>
                  <div className="mt-2">
                    {reconciliationReport.status === 'CLEAN' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        RECONCILED CLEAN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-xl">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        ANOMALIES DETECTED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Audited at: {new Date(reconciliationReport.generatedAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audited Records</span>
                  <p className="text-lg font-bold text-slate-900 mt-2">
                    {reconciliationReport.metrics.totalInvoicesAudited} Invoices
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {reconciliationReport.metrics.totalPaymentsAudited} Payments • {reconciliationReport.metrics.totalReceiptsAudited} Receipts
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clean Invoices</span>
                  <p className="text-lg font-bold text-emerald-600 mt-2">
                    {reconciliationReport.metrics.cleanInvoicesCount} / {reconciliationReport.metrics.totalInvoicesAudited}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    With 100% balance integrity
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discrepancy Sum</span>
                  <p className="text-lg font-bold text-rose-600 mt-2">
                    {formatMoney(reconciliationReport.metrics.totalDiscrepancyAmount)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Across {reconciliationReport.metrics.anomalyCount} flagged anomalies
                  </p>
                </div>
              </div>

              {/* Anomalies List */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80">
                  <h3 className="text-sm font-bold text-slate-900">Integrity Anomalies Diagnostic Log</h3>
                  <p className="text-[11px] text-slate-500">
                    Strict diagnostic check. SchoolOS does NOT silently or automatically mutate historical accounting records.
                  </p>
                </div>

                {reconciliationReport.anomalies.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-900">Zero Financial Anomalies</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      All payments have valid receipts, invoice balances strictly equal total invoiced minus paid amounts, and no negative balances exist.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reconciliationReport.anomalies.map((a, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-3 hover:bg-slate-50/50">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              {a.code}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 uppercase">
                              {a.entityType} ID: {a.entityId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 mt-1 font-medium">{a.description}</p>
                          {a.details && (
                            <pre className="text-[10px] bg-slate-50 p-2 rounded-lg mt-2 text-slate-600 font-mono overflow-x-auto">
                              {JSON.stringify(a.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
