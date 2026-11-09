import React, { useState, useEffect } from 'react';
import { AcademicsApi } from '../../api/academics.api';
import { ReportCard } from '../../types/academics.types';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import {
  Award,
  BookOpen,
  CheckCircle,
  Send,
  Eye,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface Props {
  academicYears: Array<{ id: string; name: string }>;
  terms: Array<{ id: string; name: string; academicYearId: string }>;
  classes: Array<{ id: string; name: string }>;
}

export const ReportCardsManager: React.FC<Props> = ({ academicYears, terms, classes }) => {
  const { hasPermission } = usePermissions();
  const [selectedYearId, setSelectedYearId] = useState(academicYears[0]?.id || '');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal to inspect student report card
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);

  const canManage = hasPermission(Permissions.PUBLISH_REPORT_CARDS) || hasPermission(Permissions.MANAGE_ACADEMICS);

  // Filter available terms for selected academic year
  const availableTerms = terms.filter((t) => !selectedYearId || t.academicYearId === selectedYearId);

  useEffect(() => {
    if (availableTerms.length > 0 && !selectedTermId) {
      setSelectedTermId(availableTerms[0].id);
    }
  }, [selectedYearId, availableTerms]);

  useEffect(() => {
    if (selectedYearId && selectedTermId) {
      loadReportCards();
    }
  }, [selectedYearId, selectedTermId, selectedClassId]);

  const loadReportCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AcademicsApi.getReportCards({
        academicYearId: selectedYearId,
        termId: selectedTermId,
        classId: selectedClassId || undefined,
      });
      setReportCards(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load report cards');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedYearId || !selectedTermId) {
      setError('Please select an Academic Year and Term to generate report cards.');
      return;
    }
    if (!window.confirm('Generate canonical report cards and NECTA divisions from all approved marks?')) {
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
      setSuccessMsg(`Successfully generated ${res.count} canonical student report cards.`);
      await loadReportCards();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate report cards');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedYearId || !selectedTermId) {
      setError('Please select an Academic Year and Term to publish report cards.');
      return;
    }
    if (!window.confirm('Officially publish all generated report cards for students and parents?')) {
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
      setSuccessMsg(`Officially published ${res.count} report cards.`);
      await loadReportCards();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to publish report cards');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Canonical Grading &amp; Report Cards
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates NECTA divisions, class ranks, and term performance from approved assessment marks
            </p>
          </div>
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={actionLoading}
                className="inline-flex items-center px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={`mr-1.5 ${actionLoading ? 'animate-spin' : ''}`} />
                Generate Term Cards
              </button>
              <button
                onClick={handlePublish}
                disabled={actionLoading}
                className="inline-flex items-center px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Send size={14} className="mr-1.5" />
                Publish Results
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year</label>
            <select
              value={selectedYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value);
                setSelectedTermId('');
              }}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Select Year</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Term</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Select Term</option>
              {availableTerms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class (Optional)</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Table of Report Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Student Results &amp; Division Summary</h4>
          <span className="text-xs text-slate-500 font-medium">Total: {reportCards.length} Cards</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs font-medium text-slate-500">
            Loading student report cards...
          </div>
        ) : reportCards.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              No report cards generated yet for this term. Click &quot;Generate Term Cards&quot; to compute.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Average</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportCards.map((rc) => (
                  <tr key={rc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rc.rankInClass ? `#${rc.rankInClass}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {rc.student?.firstName} {rc.student?.lastName}
                      </span>
                      <span className="text-[11px] text-slate-500">{rc.student?.admissionNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{rc.class?.name}</td>
                    <td className="py-3 px-4 font-bold text-indigo-700">{rc.averageScore}%</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {rc.division || 'DIVISION 0'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{rc.divisionPoints ?? '-'} pts</td>
                    <td className="py-3 px-4 text-slate-600">
                      {rc.attendanceDaysPresent ?? 0} present / {rc.attendanceDaysAbsent ?? 0} absent
                    </td>
                    <td className="py-3 px-4">
                      {rc.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReportCard(rc)}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <Eye size={12} className="mr-1" /> View Card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View Full Student Report Card */}
      {selectedReportCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Official Student Report Card</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedReportCard.student?.firstName} {selectedReportCard.student?.lastName} (Adm:{' '}
                  {selectedReportCard.student?.admissionNumber}) • {selectedReportCard.class?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportCard(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Performance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Class Rank</span>
                <span className="text-base font-bold text-slate-900">
                  #{selectedReportCard.rankInClass || 1} of {selectedReportCard.totalStudents || '-'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Average Score</span>
                <span className="text-base font-bold text-indigo-600">
                  {selectedReportCard.averageScore}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Division</span>
                <span className="text-base font-bold text-emerald-600">
                  {selectedReportCard.division || 'DIVISION 0'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Total Points</span>
                <span className="text-base font-bold text-slate-900">
                  {selectedReportCard.divisionPoints || 0}
                </span>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">CA Score</th>
                    <th className="py-2.5 px-3">Exam Score</th>
                    <th className="py-2.5 px-3">Final Score</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Points</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReportCard.subjects && selectedReportCard.subjects.length > 0 ? (
                    selectedReportCard.subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {sub.subjectName} ({sub.subjectCode})
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{sub.caScore ?? '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{sub.examScore ?? '-'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{sub.finalScore}%</td>
                        <td className="py-2.5 px-3 font-bold text-indigo-700">{sub.grade}</td>
                        <td className="py-2.5 px-3 font-mono">{sub.gradePoint}</td>
                        <td className="py-2.5 px-3 text-slate-500">{sub.remarks || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        No subject breakdown available for this record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Remarks */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-slate-700 block">Headmaster / Academic Remarks:</span>
              <p className="text-slate-600 italic">
                {selectedReportCard.headTeacherRemarks || 'Satisfactory academic progress for the term.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReportCard(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Close Report Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
