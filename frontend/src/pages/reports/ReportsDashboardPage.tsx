import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  GraduationCap,
  CalendarCheck,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  Info,
  Database,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ReportFilterBar } from '../../components/reports/ReportFilterBar';
import {
  reportsApi,
  ExecutiveDashboardKPIs,
  OutstandingFeesReportData,
  AcademicPerformanceReportData,
  AttendanceSummaryReportData,
  AttendanceTrendsReportData,
  ReportsFilter,
  MetricDefinitionSummary,
  MetricEvidenceSummary,
} from '../../api/reports';

export const ReportsDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'academics' | 'attendance' | 'evidence'>('dashboard');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboardKpis, setDashboardKpis] = useState<ExecutiveDashboardKPIs | null>(null);
  const [outstandingReport, setOutstandingReport] = useState<OutstandingFeesReportData | null>(null);
  const [academicsReport, setAcademicsReport] = useState<AcademicPerformanceReportData | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceSummaryReportData | null>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrendsReportData | null>(null);
  const [metricDefinitions, setMetricDefinitions] = useState<MetricDefinitionSummary[]>([]);
  const [metricSearch, setMetricSearch] = useState('');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);
  const [metricSnapshot, setMetricSnapshot] = useState<{ metric: MetricDefinitionSummary; evidence: MetricEvidenceSummary[] } | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [showEvidenceDetails, setShowEvidenceDetails] = useState(false);

  const [filters, setFilters] = useState<ReportsFilter>({});

  // Role permissions
  const isBursar = user?.role === 'BURSAR';
  const isTeacher = user?.role === 'TEACHER';

  useEffect(() => {
    // If Bursar clicks academics or Teacher clicks finance, force to allowed tab
    if (isBursar && activeTab === 'academics') setActiveTab('dashboard');
    if (isTeacher && activeTab === 'finance') setActiveTab('dashboard');
  }, [isBursar, isTeacher, activeTab]);

  const loadData = async (filterParams?: ReportsFilter) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilter = filterParams || filters;

      if (activeTab === 'dashboard') {
        const data = await reportsApi.getDashboardKPIs();
        setDashboardKpis(data);
      } else if (activeTab === 'evidence') {
        const defs = await reportsApi.getMetricDefinitions();
        setMetricDefinitions(defs);
      } else if (activeTab === 'finance' && !isTeacher) {
        const data = await reportsApi.getFinanceOutstanding(activeFilter);
        setOutstandingReport(data);
      } else if (activeTab === 'academics' && !isBursar) {
        const data = await reportsApi.getAcademicPerformance(activeFilter);
        setAcademicsReport(data);
      } else if (activeTab === 'attendance') {
        const [sumData, trendData] = await Promise.all([
          reportsApi.getAttendanceSummary(activeFilter),
          reportsApi.getAttendanceTrends(activeFilter),
        ]);
        setAttendanceReport(sumData);
        setAttendanceTrends(trendData);
      }
    } catch (err: any) {
      console.error('Failed to load reports data:', err);
      setError(err?.response?.data?.error?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMetric = async (metricKey: string) => {
    setSelectedMetricKey(metricKey);
    setSnapshotLoading(true);
    try {
      const data = await reportsApi.getMetricSnapshot(metricKey);
      setMetricSnapshot(data);
    } catch (err: any) {
      console.error('Failed to load snapshot for metric:', err);
    } finally {
      setSnapshotLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleApplyFilters = (newFilters: ReportsFilter) => {
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handleExportCsv = () => {
    let endpoint = '';
    if (activeTab === 'finance') endpoint = 'finance/outstanding';
    else if (activeTab === 'academics') endpoint = 'academics/performance';
    else if (activeTab === 'attendance') endpoint = 'attendance/summary';

    if (endpoint) {
      const url = reportsApi.downloadCsvExport(endpoint, filters);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-600" />
            Reports & Executive Analytics
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Real-time authoritative operational KPIs across Finance, Academics, Attendance, and ROI Evidence
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview KPI
          </button>
          {!isTeacher && (
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'finance'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Finance Reports
            </button>
          )}
          {!isBursar && (
            <button
              onClick={() => setActiveTab('academics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'academics'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Reports
            </button>
          )}
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'attendance'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Reports
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'evidence'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Evidence & Methodology
          </button>
        </div>
      </div>

      {/* Filter Bar for non-dashboard and non-evidence tabs */}
      {activeTab !== 'dashboard' && activeTab !== 'evidence' && (
        <ReportFilterBar
          onApplyFilters={handleApplyFilters}
          onExportCsv={handleExportCsv}
          showDateRange={true}
          showClassSelect={true}
          showSubjectSelect={activeTab === 'academics'}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-slate-200/80 p-12">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Calculating authoritative reports from database...</span>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE DASHBOARD KPIS */}
          {activeTab === 'dashboard' && dashboardKpis && (
            <div className="space-y-6">
              {/* Executive Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Active Students"
                  value={dashboardKpis.students.totalActive}
                  subtitle={`Out of ${dashboardKpis.students.totalStudents} total registered`}
                  icon={Users}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Academic Average"
                  value={`${dashboardKpis.academics.averageScore}%`}
                  subtitle={`Pass Rate: ${dashboardKpis.academics.passRate}% (${dashboardKpis.academics.finalizedAssessments} finalized exams)`}
                  icon={GraduationCap}
                  iconColor="text-brand-600"
                  iconBg="bg-brand-50"
                />

                <StatCard
                  title="Attendance Rate"
                  value={`${dashboardKpis.attendance.attendanceRate}%`}
                  subtitle={`${dashboardKpis.attendance.totalPresent} Present, ${dashboardKpis.attendance.totalAbsent} Absent`}
                  icon={CalendarCheck}
                  iconColor="text-indigo-600"
                  iconBg="bg-indigo-50"
                />

                {dashboardKpis.finance ? (
                  <div className="flex flex-col gap-2">
                    <StatCard
                      title="Collection Rate"
                      value={`${dashboardKpis.finance.collectionRate}%`}
                      subtitle={`TZS ${dashboardKpis.finance.totalCollected.toLocaleString()} Collected`}
                      icon={Coins}
                      iconColor="text-emerald-600"
                      iconBg="bg-emerald-50"
                    />
                    {dashboardKpis.finance.evidence && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confidence: {dashboardKpis.finance.evidence.confidence}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          {dashboardKpis.finance.evidence.claimType}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <StatCard
                    title="Finance Access"
                    value="Restricted"
                    subtitle="Role scope limits financial analytics"
                    icon={Coins}
                    iconColor="text-slate-400"
                    iconBg="bg-slate-100"
                  />
                )}
              </div>

              {/* Evidence Trust & Methodology Panel */}
              {dashboardKpis.finance?.evidence && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          Evidence Trust & Provenance: {dashboardKpis.finance.evidence.metricName} (v{dashboardKpis.finance.evidence.version})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Canonical Cohort Calculation • Unit: {dashboardKpis.finance.evidence.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Confidence: {dashboardKpis.finance.evidence.confidence}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Claim Type: {dashboardKpis.finance.evidence.claimType}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          dashboardKpis.finance.evidence.dataState === 'AVAILABLE'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        Data State: {dashboardKpis.finance.evidence.dataState}
                      </span>
                      <button
                        onClick={() => setShowEvidenceDetails(!showEvidenceDetails)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors"
                      >
                        <span>{showEvidenceDetails ? 'Hide Methodology' : 'Inspect Methodology'}</span>
                        {showEvidenceDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {showEvidenceDetails && (
                    <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-slate-700">Authoritative Formula & Semantics:</p>
                        <p className="font-mono text-[11px] bg-slate-100 p-2 rounded-lg text-slate-800">
                          {dashboardKpis.finance.evidence.formula}
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          {dashboardKpis.finance.evidence.formulaNote}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="font-semibold text-slate-700">Source Provenance & Baseline Distinction:</p>
                        <p className="text-slate-600 text-[11px]">
                          <strong className="text-slate-800">Source Entity:</strong> {dashboardKpis.finance.evidence.sourceEntity}
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          <strong className="text-slate-800">Baseline Classification:</strong> Actual Operational Data (distinct from imported historical or shadow baselines).
                        </p>
                        <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-800 text-[11px]">
                          <strong>Cautionary Notice:</strong> Confidence level reflects database transactional integrity and ledger auditability. High confidence does NOT imply causal proof of savings or external market comparisons.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students by Class */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Student Distribution by Class
                  </h3>
                  <div className="space-y-3">
                    {dashboardKpis.students.byClass.map((c) => (
                      <div key={c.classId} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{c.className}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{
                                width: `${
                                  dashboardKpis.students.totalStudents > 0
                                    ? (c.count / dashboardKpis.students.totalStudents) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-slate-900 w-8 text-right">{c.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance Status Distribution */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-indigo-600" />
                    Attendance Status Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-800 uppercase">Present</p>
                        <p className="text-lg font-black text-emerald-900">{dashboardKpis.attendance.totalPresent}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-rose-600" />
                      <div>
                        <p className="text-[10px] font-bold text-rose-800 uppercase">Absent</p>
                        <p className="text-lg font-black text-rose-900">{dashboardKpis.attendance.totalAbsent}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                      <Clock className="w-6 h-6 text-amber-600" />
                      <div>
                        <p className="text-[10px] font-bold text-amber-800 uppercase">Late</p>
                        <p className="text-lg font-black text-amber-900">{dashboardKpis.attendance.totalLate}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-[10px] font-bold text-blue-800 uppercase">Excused</p>
                        <p className="text-lg font-black text-blue-900">{dashboardKpis.attendance.totalExcused}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCE REPORTS */}
          {activeTab === 'finance' && outstandingReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    TZS {outstandingReport.summary.totalInvoiced.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Collected</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    TZS {outstandingReport.summary.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Outstanding</p>
                  <p className="text-2xl font-black text-rose-700 mt-1">
                    TZS {outstandingReport.summary.totalOutstanding.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Outstanding Invoices Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Outstanding Invoices</h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {outstandingReport.summary.invoiceCount} invoices with balance
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Paid</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {outstandingReport.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                            No outstanding invoices found.
                          </td>
                        </tr>
                      ) : (
                        outstandingReport.invoices.map((inv) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-brand-600">{inv.invoiceNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {inv.studentName}
                              <span className="block text-[10px] font-normal text-slate-400">{inv.admissionNumber}</span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600">{inv.className}</td>
                            <td className="py-3 px-4 font-medium text-slate-700">TZS {inv.totalAmount.toLocaleString()}</td>
                            <td className="py-3 px-4 font-medium text-emerald-600">TZS {inv.paidAmount.toLocaleString()}</td>
                            <td className="py-3 px-4 font-bold text-rose-600">TZS {inv.balance.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <Badge variant={inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'} size="sm">
                                {inv.status}
                              </Badge>
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

          {/* TAB 3: ACADEMIC REPORTS */}
          {activeTab === 'academics' && academicsReport && (
            <div className="space-y-6">
              {/* Performance Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Average</p>
                  <p className="text-3xl font-black text-brand-600 mt-1">{academicsReport.summary.averageScore}%</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Pass Rate</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">{academicsReport.summary.passRate}%</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Fail Rate</p>
                  <p className="text-3xl font-black text-rose-600 mt-1">{academicsReport.summary.failRate}%</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Students Assessed</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{academicsReport.summary.totalStudentsAssessed}</p>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-600" />
                  Grade Distribution Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(academicsReport.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
                      <p className="text-xl font-black text-slate-900">{grade}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{count} students</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Subject Performance Summary</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Average Score</th>
                        <th className="py-3 px-4">Pass Rate</th>
                        <th className="py-3 px-4">Highest Score</th>
                        <th className="py-3 px-4">Lowest Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {academicsReport.subjectBreakdown.map((s) => (
                        <tr key={s.subjectId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{s.subjectName}</td>
                          <td className="py-3 px-4 font-semibold text-brand-600">{s.averageScore}%</td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">{s.passRate}%</td>
                          <td className="py-3 px-4 font-medium text-slate-700">{s.highestScore}</td>
                          <td className="py-3 px-4 font-medium text-slate-700">{s.lowestScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE REPORTS */}
          {activeTab === 'attendance' && attendanceReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Attendance Rate</p>
                  <p className="text-3xl font-black text-indigo-600 mt-1">{attendanceReport.summary.attendanceRate}%</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Present</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">{attendanceReport.summary.totalPresent}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Absent</p>
                  <p className="text-3xl font-black text-rose-600 mt-1">{attendanceReport.summary.totalAbsent}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Late / Excused</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {attendanceReport.summary.totalLate + attendanceReport.summary.totalExcused}
                  </p>
                </div>
              </div>

              {/* Class Attendance Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Class Attendance Rates</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Students</th>
                        <th className="py-3 px-4">Sessions</th>
                        <th className="py-3 px-4">Present</th>
                        <th className="py-3 px-4">Absent</th>
                        <th className="py-3 px-4">Late</th>
                        <th className="py-3 px-4">Excused</th>
                        <th className="py-3 px-4">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {attendanceReport.classBreakdown.map((c) => (
                        <tr key={c.classId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{c.className}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{c.studentCount}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{c.totalSessions}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">{c.present}</td>
                          <td className="py-3 px-4 font-semibold text-rose-600">{c.absent}</td>
                          <td className="py-3 px-4 font-medium text-amber-600">{c.late}</td>
                          <td className="py-3 px-4 font-medium text-blue-600">{c.excused}</td>
                          <td className="py-3 px-4 font-black text-indigo-700">{c.attendanceRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance Trends */}
              {attendanceTrends && attendanceTrends.data.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Daily Attendance Trends
                  </h3>
                  <div className="space-y-2">
                    {attendanceTrends.data.slice(-10).map((t) => (
                      <div key={t.date} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-600">{t.date}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${t.attendanceRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-indigo-700 w-12 text-right">{t.attendanceRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EVIDENCE & METHODOLOGY REGISTRY */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Registry Header and Search */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-600" />
                      ROI & Metric Evidence Registry
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Authoritative metric definitions, canonical formulas, sensitivity tiers, and verification provenance.
                    </p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search metrics or formulas..."
                      value={metricSearch}
                      onChange={(e) => setMetricSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
                  <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Commercial Readiness Trust Standard:</strong> Every metric definition distinguishes factual ledger operations from projections or shadow baselines. High confidence denotes cryptographic/transactional auditability and does not imply unmeasured causal savings.
                  </div>
                </div>
              </div>

              {/* Snapshot Detail Modal / Section */}
              {selectedMetricKey && (
                <div className="bg-white p-6 rounded-2xl border-2 border-purple-200 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Live Snapshot: {selectedMetricKey}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMetricKey(null);
                        setMetricSnapshot(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Close Snapshot
                    </button>
                  </div>

                  {snapshotLoading ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Loading authoritative evidence snapshot...
                    </div>
                  ) : metricSnapshot ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
                        <div>
                          <span className="text-slate-400 font-medium">Domain:</span>{' '}
                          <span className="font-bold text-slate-800 uppercase">{metricSnapshot.metric.domain}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Claim Type:</span>{' '}
                          <span className="font-bold text-blue-700">{metricSnapshot.metric.claimType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Permission:</span>{' '}
                          <span className="font-mono text-slate-800">{metricSnapshot.metric.permission}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 mb-2">Evidence Trail (Latest 20 records):</h4>
                        {metricSnapshot.evidence.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                            No historical snapshot records found for this metric yet. Compute metrics through reports to record evidence.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                                  <th className="py-2 px-3">Generated At</th>
                                  <th className="py-2 px-3">Value</th>
                                  <th className="py-2 px-3">Confidence</th>
                                  <th className="py-2 px-3">Claim Type</th>
                                  <th className="py-2 px-3">Source Entity</th>
                                  <th className="py-2 px-3">Period</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {metricSnapshot.evidence.map((ev) => (
                                  <tr key={ev.id} className="hover:bg-slate-50">
                                    <td className="py-2 px-3 text-slate-600">{new Date(ev.generatedAt).toLocaleString()}</td>
                                    <td className="py-2 px-3 font-bold text-slate-900">{ev.resultValue ?? '—'} {ev.resultUnit}</td>
                                    <td className="py-2 px-3">
                                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                                        {ev.confidence}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-blue-700 font-semibold">{ev.claimType}</td>
                                    <td className="py-2 px-3 text-slate-600">{ev.sourceEntity || '—'}</td>
                                    <td className="py-2 px-3 text-slate-500">
                                      {ev.periodStart ? `${ev.periodStart} to ${ev.periodEnd}` : 'Unbounded'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-600 p-3">Failed to load snapshot data.</div>
                  )}
                </div>
              )}

              {/* Metric Definitions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {metricDefinitions
                  .filter((m) =>
                    metricSearch === ''
                      ? true
                      : m.name.toLowerCase().includes(metricSearch.toLowerCase()) ||
                        m.metricKey.toLowerCase().includes(metricSearch.toLowerCase()) ||
                        m.domain.toLowerCase().includes(metricSearch.toLowerCase()) ||
                        m.formula.toLowerCase().includes(metricSearch.toLowerCase())
                  )
                  .map((m) => (
                    <div
                      key={m.metricKey}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">{m.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              v{m.version}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              {m.domain}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {m.claimType}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600">{m.description}</p>

                        <div className="space-y-1.5 pt-2">
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-500">Key:</span>{' '}
                            <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">{m.metricKey}</code>
                          </div>
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-500">Formula:</span>{' '}
                            <code className="font-mono text-slate-800 bg-slate-50 px-1 py-0.5 rounded block mt-0.5 break-all">
                              {m.formula}
                            </code>
                          </div>
                          {m.aggregationRule && (
                            <p className="text-[11px] text-slate-500">
                              <strong>Rule:</strong> {m.aggregationRule}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500">
                            <strong>Date Semantics:</strong> {m.dateSemantics}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Perm: {m.permission}
                        </span>
                        <button
                          onClick={() => handleSelectMetric(m.metricKey)}
                          className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold transition-colors flex items-center gap-1"
                        >
                          <span>Inspect Evidence</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
