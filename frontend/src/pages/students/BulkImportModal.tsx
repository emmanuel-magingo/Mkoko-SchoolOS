import React, { useState, useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { api, ApiRequestError } from '../../api/client';
import { ImportPreviewResult, ImportPreviewRow } from '../../types';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  RefreshCw,
  Info,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportSuccessResult {
  importedCount?: number;
  createdCount?: number;
  students: Array<{
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    className?: string;
    class?: { name: string } | null;
    premNumber?: string | null;
  }>;
}

type TabFilter = 'ALL' | 'ERRORS' | 'WARNINGS';

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'SUCCESS'>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null);
  const [successData, setSuccessData] = useState<ImportSuccessResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('UPLOAD');
    setSelectedFile(null);
    setPreviewData(null);
    setSuccessData(null);
    setGeneralError(null);
    setActiveTab('ALL');
    setIsDownloadingErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const formatErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (err instanceof ApiRequestError) {
      if (err.validationIssues && err.validationIssues.length > 0) {
        const issuesSummary = err.validationIssues
          .map((i) => `${i.field}: ${i.message}`)
          .join('; ');
        return `${err.message} (${issuesSummary})`;
      }

      // If details object contains missingColumns / foundColumns or row errors
      if (err.details && typeof err.details === 'object') {
        const detailsObj = err.details as Record<string, any>;
        if (Array.isArray(detailsObj.missingColumns) || Array.isArray(detailsObj.foundColumns)) {
          const parts: string[] = [];
          if (detailsObj.missingColumns?.length) {
            parts.push(`Missing: ${detailsObj.missingColumns.join(', ')}`);
          }
          if (detailsObj.foundColumns?.length) {
            parts.push(`Found: ${detailsObj.foundColumns.join(', ')}`);
          }
          if (parts.length > 0 && !err.message.includes('Found columns:')) {
            return `${err.message} [${parts.join(' | ')}]`;
          }
        }
        if (Array.isArray(detailsObj.errors) && detailsObj.errors.length > 0) {
          const rowErrSummary = detailsObj.errors
            .slice(0, 5)
            .map((e: any) => `Row ${e.row || '?'}: ${e.message}`)
            .join('; ');
          return `${err.message} (${rowErrSummary})`;
        }
      }

      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return defaultMessage;
  };

  const handleDownloadErrorReport = async () => {
    const errorRows: Array<{ row: number; studentName?: string; field?: string; message: string }> = [];

    if (previewData && previewData.previewRows) {
      previewData.previewRows
        .filter((r) => r.errors.length > 0)
        .forEach((r) => {
          const name = [r.data.firstName, r.data.lastName].filter(Boolean).join(' ');
          r.errors.forEach((msg) => {
            errorRows.push({
              row: r.rowNumber,
              studentName: name,
              field: 'Validation',
              message: msg,
            });
          });
        });
    }

    if (errorRows.length === 0) return;

    try {
      setIsDownloadingErrors(true);
      const token = localStorage.getItem('schoolos_token');
      const response = await fetch('/api/students/import-errors-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ errors: errorRows, title: 'Student Import Errors' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate error report.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'SchoolOS_Student_Import_Errors.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setGeneralError(formatErrorMessage(err, 'Failed to download error report.'));
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setGeneralError(null);
      await api.downloadFile('/students/import-template', 'schoolos_student_import_template.xlsx');
    } catch (err) {
      setGeneralError(formatErrorMessage(err, 'Failed to download template'));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.xls')) {
        setGeneralError('Legacy Excel (.xls) files are not supported. Please open the file in Excel or Google Sheets and save as .xlsx before uploading.');
        setSelectedFile(null);
        return;
      }
      if (!file.name.match(/\.xlsx$/i)) {
        setGeneralError('Only Excel files with .xlsx extension are supported.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setGeneralError(null);
    }
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    try {
      setIsPreviewLoading(true);
      setGeneralError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.postFormData<ImportPreviewResult>('/students/import-preview', formData);
      setPreviewData(res.data);
      setStep('PREVIEW');
      if (res.data.invalidRowsCount > 0) {
        setActiveTab('ERRORS');
      } else {
        setActiveTab('ALL');
      }
    } catch (err) {
      setGeneralError(formatErrorMessage(err, 'Failed to parse and validate Excel file'));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.invalidRowsCount > 0) return;

    const validStudents = previewData.previewRows
      .filter((r) => r.status !== 'INVALID' && (r.resolvedClass?.id || r.data.classId))
      .map((r) => ({
        firstName: r.data.firstName,
        middleName: r.data.middleName || undefined,
        lastName: r.data.lastName,
        gender: r.data.gender,
        dateOfBirth: r.data.dateOfBirth
          ? (r.data.dateOfBirth instanceof Date
              ? r.data.dateOfBirth.toISOString().split('T')[0]
              : String(r.data.dateOfBirth).split('T')[0])
          : undefined,
        classId: (r.resolvedClass?.id || r.data.classId)!,
        phone: r.data.phone || undefined,
        address: r.data.address || undefined,
        guardianName: r.data.guardianName || undefined,
        guardianPhone: r.data.guardianPhone || undefined,
        guardianRelationship: r.data.guardianRelationship || undefined,
        premNumber: r.data.premNumber || undefined,
        admissionNumber: r.data.admissionNumber || undefined,
      }));

    if (validStudents.length === 0) {
      setGeneralError('No valid student rows to import.');
      return;
    }

    try {
      setIsCommitting(true);
      setGeneralError(null);

      const res = await api.post<ImportSuccessResult>('/students/bulk-import', {
        importToken: previewData.importToken,
        students: validStudents,
      });

      setSuccessData(res.data);
      setStep('SUCCESS');
    } catch (err) {
      setGeneralError(formatErrorMessage(err, 'Import failed. All changes have been safely rolled back.'));
    } finally {
      setIsCommitting(false);
    }
  };

  const filteredRows: ImportPreviewRow[] = (previewData?.previewRows || []).filter((r: ImportPreviewRow) => {
    if (activeTab === 'ERRORS') return r.errors.length > 0;
    if (activeTab === 'WARNINGS') return r.warnings.length > 0 || r.status === 'POSSIBLE_DUPLICATE';
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Student Import"
      description="Upload multiple students from an Excel (.xlsx) file (up to 1,000 students per batch), validate entries, and assign classes."
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {generalError && (
          <div data-testid="error-banner" className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="error-message whitespace-pre-wrap">{generalError}</p>
            </div>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 'UPLOAD' && (
          <div className="space-y-5">
            {/* Template Download Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100/80 text-emerald-700 rounded-xl shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Download Excel Template</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pre-populated with your school's active classes, field validation dropdowns, and formatting rules.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="download-template-btn"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                {isDownloadingTemplate ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-brand-600" />
                )}
                <span>Download Template (.xlsx)</span>
              </button>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-brand-500 bg-brand-50/20'
                  : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />

              <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to choose a different file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to select an Excel spreadsheet or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts Microsoft Excel files (.xlsx) up to 5 MB (maximum 1,000 student records per file)
                  </p>
                </div>
              )}
            </div>

            {/* Key Field Guidance */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-slate-800">File requirements & safe importing:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li><strong>Required columns:</strong> First Name, Last Name, Gender (MALE/FEMALE), Date of Birth (YYYY-MM-DD), Class Name.</li>
                  <li><strong>Optional columns:</strong> Middle Name, PREM Number (national student identifier).</li>
                  <li><strong>School Numbers:</strong> Automatically generated sequentially on commit — do not include them in the sheet.</li>
                  <li><strong>Integrity:</strong> All rows are validated first. Zero database records are created during preview.</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="analyze-file-btn"
                onClick={handleAnalyzeFile}
                disabled={!selectedFile || isPreviewLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                {isPreviewLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Analyze & Preview File</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'PREVIEW' && previewData && (
          <div className="space-y-4">
            {/* Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Rows</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{previewData.totalRows}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Valid Rows</span>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{previewData.validRowsCount}</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-rose-700">Invalid Rows</span>
                <p className="text-xl font-bold text-rose-700 mt-0.5">{previewData.invalidRowsCount}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-amber-700">Possible Duplicates</span>
                <p className="text-xl font-bold text-amber-700 mt-0.5">{previewData.possibleDuplicatesCount}</p>
              </div>
            </div>

            {/* Validation Banner */}
            {previewData.invalidRowsCount > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-700">
                <div className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Errors found in {previewData.invalidRowsCount} row(s).</span>
                    <p className="text-[11px] mt-0.5 text-rose-600">
                      To protect database integrity, the entire batch must be valid before importing.
                      Please review row-level errors below, correct them in your spreadsheet, and upload again.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="download-error-report-btn"
                  onClick={handleDownloadErrorReport}
                  disabled={isDownloadingErrors}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5 text-rose-700" />
                  <span>{isDownloadingErrors ? 'Downloading...' : 'Download Error Report (.xlsx)'}</span>
                </button>
              </div>
            ) : previewData.possibleDuplicatesCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold">All rows are valid, with {previewData.possibleDuplicatesCount} potential duplicate warning(s).</span>
                  <p className="text-[11px] mt-0.5 text-amber-700">
                    Please inspect flagged students to ensure they are not already registered under a similar name or date of birth.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <div>
                  <span className="font-bold">All {previewData.validRowsCount} student records are valid and ready to import.</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'ALL'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                All Rows ({previewData.totalRows})
              </button>
              {previewData.invalidRowsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ERRORS')}
                  className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                    activeTab === 'ERRORS'
                      ? 'border-rose-600 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-rose-600'
                  }`}
                >
                  Errors ({previewData.invalidRowsCount})
                </button>
              )}
              {previewData.possibleDuplicatesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('WARNINGS')}
                  className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                    activeTab === 'WARNINGS'
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-amber-600'
                  }`}
                >
                  Warnings / Duplicates ({previewData.possibleDuplicatesCount})
                </button>
              )}
            </div>

            {/* Table */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-14">Row</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 w-20">Gender</th>
                    <th className="py-2.5 px-3 w-28">DOB</th>
                    <th className="py-2.5 px-3">Assigned Class</th>
                    <th className="py-2.5 px-3">PREM No</th>
                    <th className="py-2.5 px-3">School No</th>
                    <th className="py-2.5 px-3 w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        No rows matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r: ImportPreviewRow) => {
                      const hasErrors = r.errors.length > 0;
                      const hasWarnings = r.warnings.length > 0 || r.status === 'POSSIBLE_DUPLICATE';

                      return (
                        <tr
                          key={r.rowNumber}
                          className={hasErrors ? 'bg-rose-50/30' : hasWarnings ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'}
                        >
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            #{r.rowNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800">
                              {[r.data.firstName, r.data.middleName, r.data.lastName].filter(Boolean).join(' ') || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {r.data.gender || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {r.data.dateOfBirth
                              ? typeof r.data.dateOfBirth === 'string'
                                ? r.data.dateOfBirth
                                : r.data.dateOfBirth.toISOString().split('T')[0]
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {r.resolvedClass ? (
                              <span className="font-medium text-slate-800">{r.resolvedClass.name}</span>
                            ) : (
                              <span className="text-rose-600">{r.data.className || '—'}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {r.data.premNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {r.data.admissionNumber ? (
                              <span className="font-semibold text-brand-700">{r.data.admissionNumber}</span>
                            ) : (
                              <span className="text-slate-400 italic">Auto</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {hasErrors ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                  <XCircle className="w-3 h-3" /> Error
                                </span>
                                <div className="mt-1 space-y-0.5">
                                  {r.errors.map((err: string, i: number) => (
                                    <p key={i} className="text-[10px] text-rose-600 font-medium">
                                      • {err}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : hasWarnings ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                  <AlertTriangle className="w-3 h-3" /> Warning
                                </span>
                                <div className="mt-1 space-y-0.5">
                                  {r.warnings.map((warn: string, i: number) => (
                                    <p key={i} className="text-[10px] text-amber-700">
                                      • {warn}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                <Check className="w-3 h-3" /> Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                disabled={isCommitting}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Upload Different File</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCommitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-import-btn"
                  onClick={handleConfirmImport}
                  disabled={previewData.invalidRowsCount > 0 || previewData.validRowsCount === 0 || isCommitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isCommitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Allocating Numbers & Saving...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Confirm & Import {previewData.validRowsCount} Student{previewData.validRowsCount === 1 ? '' : 's'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS SUMMARY */}
        {step === 'SUCCESS' && successData && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Bulk Registration Completed Successfully!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Imported <strong>{successData.importedCount ?? successData.createdCount ?? successData.students.length}</strong> student{(successData.importedCount ?? successData.createdCount ?? successData.students.length) === 1 ? '' : 's'}. Each student has been enrolled into their assigned class and issued a sequential School Number.
                </p>
              </div>
            </div>

            {/* Created Students Table */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">School Number</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Assigned Class</th>
                    <th className="py-2.5 px-3">PREM Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {successData.students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-600">
                        {s.admissionNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.class?.name || s.className || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {s.premNumber || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                id="import-done-btn"
                onClick={() => {
                  handleClose();
                  onSuccess();
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
