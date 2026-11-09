import React, { useState, useEffect, useMemo } from 'react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { AcademicsApi } from '../../../api/academics.api';
import { ReportCard, ReportCardStatus } from '../../../types/academics.types';
import { StudentReportCard } from './StudentReportCard';
import {
  Award,
  RefreshCw,
  Send,
  Eye,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';

export interface ReportCardManagerProps {
  initialReportCards?: ReportCard[];
}

export const ReportCardManager: React.FC<ReportCardManagerProps> = ({ initialReportCards }) => {
  const {
    academicYears,
    terms,
    currentAcademicYearId,
    currentTermId,
    activeAcademicYearId,
    activeTermId,
  } = useAcademicContext();

  const [selectedYearId, setSelectedYearId] = useState<string>(
    activeAcademicYearId || currentAcademicYearId || (academicYears[0]?.id ?? '')
  );
  const [selectedTermId, setSelectedTermId] = useState<string>(
    activeTermId || currentTermId || (terms[0]?.id ?? '')
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [classes, setClasses] = useState<Array<{ id: string; name: string; stream?: string }>>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>(initialReportCards || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal inspection
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);

  // Sync year and terms
  useEffect(() => {
    if (!selectedYearId && academicYears.length > 0) {
      setSelectedYearId(academicYears[0].id);
    }
  }, [academicYears, selectedYearId]);

  const availableTerms = useMemo(() => {
    return terms.filter((t) => !selectedYearId || t.academicYearId === selectedYearId);
  }, [terms, selectedYearId]);

  useEffect(() => {
    if (availableTerms.length > 0 && !availableTerms.some((t) => t.id === selectedTermId)) {
      setSelectedTermId(availableTerms[0].id);
    }
  }, [availableTerms, selectedTermId]);

  // Load Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await AcademicsApi.getClasses();
        if (res.data) {
          setClasses(res.data);
          if (res.data.length > 0 && !selectedClassId) {
            setSelectedClassId(res.data[0].id);
          }
        }
      } catch (e: any) {
        console.error('Failed to load classes', e);
      }
    };
    fetchClasses();
  }, []);

  // Fetch Report Cards
  const loadReportCards = async () => {
    if (!selectedYearId || !selectedTermId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await AcademicsApi.getReportCards({
        academicYearId: selectedYearId,
        termId: selectedTermId,
        classId: selectedClassId || undefined,
      });
      setReportCards(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load report cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYearId && selectedTermId) {
      loadReportCards();
    }
  }, [selectedYearId, selectedTermId, selectedClassId]);

  // Batch Status computation
  const batchStatus: ReportCardStatus = useMemo(() => {
    if (reportCards.length === 0) return 'DRAFT';
    const allPublished = reportCards.every((r) => r.status === 'PUBLISHED');
    if (allPublished) return 'PUBLISHED';
    const anyApproved = reportCards.some((r) => r.status === 'APPROVED');
    if (anyApproved) return 'APPROVED';
    return 'DRAFT';
  }, [reportCards]);

  // Handlers
  const handleGenerateReports = async () => {
    if (!selectedYearId || !selectedTermId) {
      setError('Please select an Academic Year and Term to generate reports.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      const res = await AcademicsApi.generateReportCards({
        academicYearId: selectedYearId,
        termId: selectedTermId,
        classId: selectedClassId || undefined,
      });
      setSuccessMsg(
        `Successfully generated ${res.count || 0} student report cards with locked marks and attendance.`
      );
      await loadReportCards();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to generate report cards from locked marks'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishBatch = async () => {
    if (!selectedYearId || !selectedTermId) {
      setError('Please select an Academic Year and Term.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      const res = await AcademicsApi.publishReportCards({
        academicYearId: selectedYearId,
        termId: selectedTermId,
        classId: selectedClassId || undefined,
      });
      setSuccessMsg(`Officially published ${res.count || 0} student report cards.`);
      await loadReportCards();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to publish report cards');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublishBatch = async () => {
    if (!selectedYearId || !selectedTermId) {
      setError('Please select an Academic Year and Term.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      const res = await AcademicsApi.unpublishReportCards({
        academicYearId: selectedYearId,
        termId: selectedTermId,
        classId: selectedClassId || undefined,
      });
      setSuccessMsg(`Reverted ${res.count || 0} report cards to DRAFT status.`);
      await loadReportCards();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to unpublish report cards'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Filter report cards
  const filteredReportCards = useMemo(() => {
    return reportCards.filter((rc) => {
      if (statusFilter !== 'ALL' && rc.status !== statusFilter) return false;
      return true;
    });
  }, [reportCards, statusFilter]);

  // Aggregate stats
  const classAverage = useMemo(() => {
    if (reportCards.length === 0) return 0;
    const total = reportCards.reduce((acc, curr) => acc + (Number(curr.averageScore) || 0), 0);
    return Math.round((total / reportCards.length) * 10) / 10;
  }, [reportCards]);

  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Div I': 0, 'Div II': 0, 'Div III': 0, 'Div IV': 0, 'Div 0': 0 };
    reportCards.forEach((rc) => {
      const div = (rc.division || '').toUpperCase();
      if (div.includes('I') && !div.includes('II') && !div.includes('IV')) counts['Div I']++;
      else if (div.includes('II') && !div.includes('III')) counts['Div II']++;
      else if (div.includes('III')) counts['Div III']++;
      else if (div.includes('IV')) counts['Div IV']++;
      else counts['Div 0']++;
    });
    return counts;
  }, [reportCards]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Results &amp; Report Card Manager
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Consolidate locked assessments, calculate NECTA division points, and issue official term transcripts.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateReports}
              disabled={actionLoading}
              id="generate-reports-btn"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${actionLoading ? 'animate-spin' : ''}`} />
              Generate Reports
            </button>

            {batchStatus !== 'PUBLISHED' ? (
              <button
                onClick={handlePublishBatch}
                disabled={actionLoading || reportCards.length === 0}
                id="publish-batch-btn"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Publish Batch
              </button>
            ) : (
              <button
                onClick={handleUnpublishBatch}
                disabled={actionLoading}
                id="unpublish-batch-btn"
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Unpublish to Draft
              </button>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Academic Year
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {academicYears.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  {yr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Academic Term
            </label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {availableTerms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class / Stream</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.stream ? `(${c.stream})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Batch Status</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              data-testid="batch-status-badge"
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                batchStatus === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : batchStatus === 'APPROVED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {batchStatus}
            </span>
            <span className="text-xs text-slate-400">({reportCards.length} Cards)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Class Average</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xl font-bold text-slate-900">{classAverage}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Div I &amp; II Achievers</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-bold text-indigo-700">
            {divisionCounts['Div I'] + divisionCounts['Div II']}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({reportCards.length > 0 ? Math.round(((divisionCounts['Div I'] + divisionCounts['Div II']) / reportCards.length) * 100) : 0}%)
            </span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Division Breakdown</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className="text-emerald-700">I: {divisionCounts['Div I']}</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700">II: {divisionCounts['Div II']}</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700">III: {divisionCounts['Div III']}</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-700">IV/0: {divisionCounts['Div IV'] + divisionCounts['Div 0']}</span>
          </div>
        </div>
      </div>

      {/* Report Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Student Report Cards</h2>
          <span className="text-xs text-slate-500">
            Showing {filteredReportCards.length} of {reportCards.length} generated cards
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading student report cards...</span>
          </div>
        ) : filteredReportCards.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No report cards found for this selection.</p>
            <p className="mt-1">
              Click &quot;Generate Reports&quot; to aggregate locked assessment marks and compile report cards.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-right">Average</th>
                  <th className="py-3 px-4 text-center">Division</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReportCards.map((rc) => {
                  const studentName = rc.student
                    ? `${rc.student.firstName} ${rc.student.lastName}`
                    : 'Unknown Student';
                  const admissionNo = rc.student?.admissionNumber || 'N/A';
                  const className = rc.class?.name || 'Class';
                  const streamName = rc.class?.stream ? `(${rc.class.stream})` : '';

                  const present = rc.attendanceDaysPresent ?? rc.attendanceSummary?.daysPresent ?? 0;
                  const absent = rc.attendanceDaysAbsent ?? rc.attendanceSummary?.daysAbsent ?? 0;

                  return (
                    <tr key={rc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {rc.rankInClass ? `#${rc.rankInClass}` : '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{studentName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{admissionNo}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {className} {streamName}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {rc.averageScore !== null && rc.averageScore !== undefined
                          ? `${Number(rc.averageScore).toFixed(1)}%`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
                          {rc.division || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-indigo-700">
                        {rc.divisionPoints ?? rc.totalPoints ?? '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        <span className="text-emerald-700 font-semibold">{present}P</span> /{' '}
                        <span className="text-rose-600 font-semibold">{absent}A</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rc.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rc.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReportCard(rc)}
                          id={`view-card-${rc.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-medium transition"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View / Print Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal View for StudentReportCard */}
      {selectedReportCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto my-auto">
            <StudentReportCard
              reportCard={selectedReportCard}
              onClose={() => setSelectedReportCard(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
