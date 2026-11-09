import React from 'react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { ReportCard, ReportCardSubject } from '../../../types/academics.types';
import { BrandingImageFromPath } from '../../common/PrivateBrandingImage';
import {
  Printer,
  Download,
  Award,
  CheckCircle2,
  User,
  GraduationCap,
  Clock,
  X,
} from 'lucide-react';

interface StudentReportCardProps {
  reportCard: ReportCard;
  onClose?: () => void;
}

export const StudentReportCard: React.FC<StudentReportCardProps> = ({ reportCard, onClose }) => {
  const { selectedSchool, activeAcademicYear, activeTerm } = useAcademicContext();

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const studentName = reportCard.student
    ? `${reportCard.student.firstName} ${reportCard.student.lastName}`
    : 'Unknown Student';
  const admissionNumber = reportCard.student?.admissionNumber || 'N/A';
  const className = reportCard.class?.name || 'Class N/A';
  const stream = reportCard.class?.stream ? `(${reportCard.class.stream})` : '';
  const termName = reportCard.term?.name || activeTerm?.name || 'Term';
  const yearName = reportCard.academicYear?.name || activeAcademicYear?.name || 'Academic Year';
  const presentation = (reportCard.generationSnapshot?.schoolBranding ?? {}) as {
    school?: { name?: string; logoUrl?: string | null; address?: string | null; contactEmail?: string | null; contactPhone?: string | null; motto?: string | null };
    assets?: Array<{ id: string; kind: string; contentPath: string }>;
    signatories?: Array<{ designation: string; required: boolean; displayName?: string; signatureDesignation?: string; contentPath?: string; missing?: boolean }>;
    template?: { title?: string; configuration?: { headerText?: string; footerText?: string; includeLogo?: boolean; includeStamp?: boolean } } | null;
    colors?: { primary?: string; accent?: string } | null;
  };
  const schoolName = presentation.school?.name || selectedSchool?.name || 'School';
  const schoolLogo = presentation.template?.configuration?.includeLogo === false ? undefined : presentation.assets?.find((asset) => asset.kind === 'LOGO');
  const schoolLogoUrl = schoolLogo?.contentPath || (presentation.template?.configuration?.includeLogo === false ? undefined : presentation.school?.logoUrl);
  const schoolStamp = presentation.template?.configuration?.includeStamp === false ? undefined : presentation.assets?.find((asset) => asset.kind === 'STAMP');
  const documentTitle = presentation.template?.title || 'Student Academic Progress Report';
  const reportPrimaryColor = /^#[0-9a-fA-F]{6}$/.test(presentation.colors?.primary ?? '') ? presentation.colors!.primary! : '#312e81';

  // Attendance calculation
  const attendancePresent =
    reportCard.attendanceDaysPresent ?? reportCard.attendanceSummary?.daysPresent ?? 0;
  const attendanceAbsent =
    reportCard.attendanceDaysAbsent ?? reportCard.attendanceSummary?.daysAbsent ?? 0;
  const attendanceTotal =
    reportCard.attendanceSummary?.totalDays ?? (attendancePresent + attendanceAbsent);
  const attendanceRate =
    attendanceTotal > 0
      ? Math.round((attendancePresent / attendanceTotal) * 100)
      : (reportCard.attendanceSummary?.attendanceRate ?? 100);

  // Subjects fallback or mapping
  const subjects: ReportCardSubject[] = reportCard.subjects || [];

  const getDivisionBadgeColor = (division?: string | null) => {
    if (!division) return 'bg-slate-100 text-slate-700 border-slate-300';
    const divUpper = division.toUpperCase();
    if (divUpper.includes('I') && !divUpper.includes('II') && !divUpper.includes('IV')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
    if (divUpper.includes('II') && !divUpper.includes('III')) {
      return 'bg-blue-50 text-blue-800 border-blue-300';
    }
    if (divUpper.includes('III')) {
      return 'bg-amber-50 text-amber-800 border-amber-300';
    }
    if (divUpper.includes('IV')) {
      return 'bg-purple-50 text-purple-800 border-purple-300';
    }
    return 'bg-rose-50 text-rose-800 border-rose-300';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto print:shadow-none print:border-none print:max-w-none print:w-full print:m-0">
      {/* Action Toolbar (hidden on print) */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              reportCard.status === 'PUBLISHED'
                ? 'bg-emerald-100 text-emerald-800'
                : reportCard.status === 'APPROVED'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {reportCard.status === 'PUBLISHED' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
            {reportCard.status}
          </span>
          <span className="text-xs text-slate-500">Official Student Academic Transcript</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            id="print-report-card-btn"
            className="inline-flex items-center px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium shadow-xs transition"
          >
            <Printer className="w-4 h-4 mr-1.5 text-slate-600" />
            Print
          </button>
          <button
            onClick={handleExportPDF}
            id="export-pdf-report-card-btn"
            className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs transition"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export to PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Report Card Sheet (Printed Area) */}
      <div className="p-8 sm:p-10 space-y-6 print:p-4 text-slate-900">
        {/* Header / Crest */}
        <div className="border-b-2 pb-5 text-center relative" style={{ borderColor: reportPrimaryColor }}>
          <div className="flex justify-center items-center gap-3 mb-2">
            {schoolLogoUrl ? <BrandingImageFromPath src={schoolLogoUrl} alt={`${schoolName} logo`} className="h-12 w-12 rounded-xl object-contain" /> : <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-xl shadow-md"><GraduationCap className="w-7 h-7" /></div>}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900" style={{ color: reportPrimaryColor }}>
                {schoolName}
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                {presentation.template?.configuration?.headerText || documentTitle}
              </p>
            </div>
          </div>
          <div className="inline-block px-4 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-900 text-xs font-bold uppercase tracking-wider mt-1">
            {termName} • {yearName}
          </div>
          {(presentation.school?.address || presentation.school?.contactPhone || presentation.school?.contactEmail) && <p className="mt-2 text-xs text-slate-500">{[presentation.school.address, presentation.school.contactPhone, presentation.school.contactEmail].filter(Boolean).join(' · ')}</p>}
          {presentation.school?.motto && <p className="mt-1 text-xs italic text-slate-500">{presentation.school.motto}</p>}
        </div>

        {/* Student Metadata Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Student Name:</span>
            <span className="font-bold text-slate-900 text-sm">{studentName}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Admission Number:</span>
            <span className="font-mono font-bold text-indigo-700">{admissionNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Class &amp; Stream:</span>
            <span className="font-bold text-slate-900">
              {className} {stream}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Class Rank:</span>
            <span className="font-bold text-slate-900">
              {reportCard.rankInClass ? `Position ${reportCard.rankInClass}` : 'N/A'}{' '}
              {reportCard.totalStudents || reportCard.totalStudentsInClass
                ? `of ${reportCard.totalStudents || reportCard.totalStudentsInClass}`
                : ''}
            </span>
          </div>
        </div>

        {/* Subject Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-300">
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Code</th>
                <th className="py-2.5 px-3 text-right">CA (40%)</th>
                <th className="py-2.5 px-3 text-right">Exam (60%)</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Final (100%)</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3 text-center">Points</th>
                <th className="py-2.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    No subject assessments recorded for this term.
                  </td>
                </tr>
              ) : (
                subjects.map((s, idx) => {
                  const subjectTitle = s.subjectName || s.subject?.name || `Subject ${idx + 1}`;
                  const subjectCode = s.subjectCode || s.subject?.code || 'SUB';
                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{subjectTitle}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {subjectCode}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {s.caScore !== null && s.caScore !== undefined ? s.caScore : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {s.examScore !== null && s.examScore !== undefined ? s.examScore : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-900">
                        {s.finalScore}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 font-bold rounded-sm text-xs bg-slate-100 text-slate-800">
                          {s.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {s.gradePoint}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {s.remarks || (s.finalScore >= 50 ? 'Pass' : 'Needs Support')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Aggregate Performance & Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Academic Division & Points */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              National &amp; Institutional Performance
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Average Score
                </span>
                <span className="text-lg font-black text-slate-900">
                  {reportCard.averageScore !== null && reportCard.averageScore !== undefined
                    ? `${Number(reportCard.averageScore).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  NECTA Division
                </span>
                <span
                  className={`text-sm font-extrabold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${getDivisionBadgeColor(
                    reportCard.division
                  )}`}
                >
                  {reportCard.division || 'Unclassified'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Points / GPA
                </span>
                <span className="text-lg font-black text-indigo-700">
                  {reportCard.divisionPoints ?? reportCard.totalPoints ?? reportCard.gpa ?? 'N/A'}
                </span>
              </div>
            </div>
            {reportCard.totalMarks !== null && reportCard.totalMarks !== undefined && (
              <div className="text-[11px] text-slate-500 flex justify-between px-1">
                <span>Cumulative Marks Total:</span>
                <span className="font-bold text-slate-800">{reportCard.totalMarks}</span>
              </div>
            )}
          </div>

          {/* Attendance Summary */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Attendance Summary
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Days Present
                </span>
                <span className="text-lg font-black text-emerald-700">{attendancePresent}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Days Absent
                </span>
                <span className="text-lg font-black text-rose-700">{attendanceAbsent}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Attendance Rate
                </span>
                <span className="text-lg font-black text-indigo-700">{`${attendanceRate}%`}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between px-1">
              <span>Total School Sessions:</span>
              <span className="font-bold text-slate-800">{`${attendanceTotal} Days`}</span>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="space-y-4 pt-2">
          {/* Class Teacher Remarks */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Class Teacher Remarks
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Signature: __________________</span>
            </div>
            <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
              {reportCard.classTeacherRemarks ||
                'A dedicated student with commendable academic consistency and active participation in class activities.'}
            </p>
          </div>

          {/* Headmaster Remarks */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Head of School / Academic Master Remarks
              </span>
              {presentation.template?.configuration?.includeStamp !== false && <span className="text-[11px] text-slate-400 font-normal">
                Official Stamp &amp; Date: {schoolStamp ? <BrandingImageFromPath src={schoolStamp.contentPath} alt="Official school stamp" className="inline-block h-10 w-10 object-contain align-middle" /> : 'Official stamp enabled but unavailable'}
              </span>}
            </div>
            <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
              {reportCard.headmasterRemarks ||
                reportCard.headTeacherRemarks ||
                'Promising performance this term. Continual commitment to revision and academic discipline is encouraged.'}
            </p>
          </div>
        </div>

        {presentation.signatories && presentation.signatories.length > 0 && <div className="grid grid-cols-2 gap-6 pt-3">{presentation.signatories.map((signatory,index)=><div key={`${signatory.designation}-${index}`} className="min-h-20 border-b border-slate-400 text-center">{signatory.contentPath ? <><BrandingImageFromPath src={signatory.contentPath} alt={`${signatory.displayName} signature`} className="mx-auto h-10 max-w-36 object-contain"/><p className="text-xs font-semibold">{signatory.displayName}</p></> : <p className="mt-5 text-xs text-amber-700">{signatory.required?'Required ':''}{signatory.designation} signature unavailable</p>}<p className="text-[10px] text-slate-500">{signatory.designation}</p></div>)}</div>}

        {/* Footer / Watermark */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
          <span>{presentation.template?.configuration?.footerText || 'Generated via SchoolOS Unified Academic Engine'}</span>
          <span>Security Verification Hash: {reportCard.id.slice(0, 16)}</span>
        </div>
      </div>
    </div>
  );
};
