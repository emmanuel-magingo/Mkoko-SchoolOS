import React, { useState, useRef } from 'react';
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
  X,
} from 'lucide-react';
import { api, ApiRequestError } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { ImportPreviewResult, ImportPreviewRow } from '../../types';

export interface StudentBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialStep?: 'UPLOAD' | 'PREVIEW' | 'SUCCESS';
  initialPreviewResult?: ImportPreviewResult | null;
  selectedClassId?: string;
}

export const REQUIRED_CSV_HEADERS = [
  'First Name',
  'Middle Name',
  'Last Name',
  'Gender',
  'Date of Birth',
  'Class/Form',
  'PREM Number',
  'Admission Number',
  'Examination Number',
] as const;

type FilterTab = 'ALL' | 'VALID' | 'INVALID';

export const StudentBulkImportModal: React.FC<StudentBulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStep,
  initialPreviewResult,
  selectedClassId,
}) => {
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'SUCCESS'>(initialStep || 'UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(initialPreviewResult || null);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setStep('UPLOAD');
    setSelectedFile(null);
    setIsUploading(false);
    setIsCommitting(false);
    setPreviewResult(null);
    setImportedCount(0);
    setErrorMessage(null);
    setActiveTab('ALL');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // 1. Download official Excel / CSV template
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await api.downloadFile(
        '/students/import-template',
        'SchoolOS_Student_Import_Template.xlsx'
      );
    } catch {
      // Fallback CSV template generator
      const headers = REQUIRED_CSV_HEADERS.join(',');
      const sampleRow =
        'Juma,Ally,Mwamba,MALE,2010-05-14,Form 1A,PREM-TZ-2026-001,MWL/2026/001,S0123/0001';
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${sampleRow}\n`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'student_enrolment_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // 2. Select file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  // 3. Upload & Validate File
  const handleUploadAndValidate = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose a .xlsx or .csv file to import.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedClassId) {
        formData.append('classId', selectedClassId);
      }

      const res = await api.postFormData<ImportPreviewResult>('/students/import-preview', formData);
      setPreviewResult(res.data);
      setStep('PREVIEW');
    } catch (err: any) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message || 'File validation failed.');
      } else {
        setErrorMessage(err?.message || 'Failed to process import file.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Confirm & Commit Bulk Import
  const handleConfirmImport = async () => {
    if (!previewResult) return;

    try {
      setIsCommitting(true);
      setErrorMessage(null);

      // Filter only VALID rows to commit
      const validStudents = previewResult.previewRows
        .filter((r) => r.status === 'VALID')
        .map((r) => r.data);

      if (validStudents.length === 0) {
        setErrorMessage('There are no valid student records to import.');
        return;
      }

      const res = await api.post<any>('/students/bulk-import', {
        importToken: previewResult.importToken,
        mode: 'STANDARD',
        students: validStudents,
      });

      const count = res.data?.importedCount || res.data?.createdCount || validStudents.length;
      setImportedCount(count);
      setStep('SUCCESS');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to commit student import.');
    } finally {
      setIsCommitting(false);
    }
  };

  // Filter preview rows by active tab
  const displayedRows: ImportPreviewRow[] = (previewResult?.previewRows || []).filter((row) => {
    if (activeTab === 'VALID') return row.status === 'VALID';
    if (activeTab === 'INVALID') return row.status === 'INVALID';
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Students into Enrolments"
      maxWidth="4xl"
    >
      <div id="student-bulk-import-modal" className="space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1: UPLOAD STEP                                               */}
        {/* ================================================================= */}
        {step === 'UPLOAD' && (
          <div className="space-y-5">
            {/* Template Download Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <FileSpreadsheet className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Official Student Enrolment Template
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Use our standardized Excel or CSV template for seamless validation and stream matching.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-download-import-template"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isDownloadingTemplate ? 'Downloading...' : 'Download Template'}</span>
              </button>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all
                ${
                  selectedFile
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                id="file-upload-input"
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-3">
                <UploadCloud className="h-6 w-6 text-blue-600" />
              </span>
              <p className="text-xs font-bold text-slate-900">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop your file'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Supports Excel (.xlsx) and CSV (.csv) up to 10MB
              </p>
              {selectedFile && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  <Check className="h-3.5 w-3.5" />
                  <span>Ready to validate ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* Required CSV Headers Mapping Guide */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <h5 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                <Info className="h-3.5 w-3.5 text-blue-600" />
                <span>Required Spreadsheet Columns &amp; Headers:</span>
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_CSV_HEADERS.map((header) => (
                  <span
                    key={header}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs"
                  >
                    {header}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-validate-upload"
                onClick={handleUploadAndValidate}
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Validating Records...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Validate &amp; Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: VALIDATION STATE & PREVIEW                                */}
        {/* ================================================================= */}
        {step === 'PREVIEW' && previewResult && (
          <div className="space-y-5">
            {/* Validation Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div
                id="stat-total-rows"
                className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-2xs"
              >
                <span className="text-[11px] font-medium text-slate-500">Total Rows</span>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {previewResult.totalRows}
                </div>
              </div>

              <div
                id="stat-valid-rows"
                className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-center shadow-2xs"
              >
                <span className="text-[11px] font-medium text-emerald-800">Valid Rows</span>
                <div className="mt-1 text-2xl font-bold text-emerald-700">
                  {previewResult.validRowsCount}
                </div>
              </div>

              <div
                id="stat-invalid-rows"
                className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-center shadow-2xs"
              >
                <span className="text-[11px] font-medium text-rose-800">Invalid Rows</span>
                <div className="mt-1 text-2xl font-bold text-rose-700">
                  {previewResult.invalidRowsCount}
                </div>
              </div>
            </div>

            {/* Row-Level Errors List if any */}
            {previewResult.errors && previewResult.errors.length > 0 && (
              <div
                id="validation-errors-panel"
                className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-2"
              >
                <h5 className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>{`Validation Errors Detected (${previewResult.errors.length}):`}</span>
                </h5>
                <ul className="max-h-32 overflow-y-auto space-y-1 text-xs text-rose-800 pr-2">
                  {previewResult.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-bold shrink-0">{`Row ${err.row}:`}</span>
                      <span>
                        <span className="font-semibold">{err.field}</span> — {err.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeTab === 'ALL'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                All Rows ({previewResult.totalRows})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('VALID')}
                className={`pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeTab === 'VALID'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Valid Only ({previewResult.validRowsCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('INVALID')}
                className={`pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeTab === 'INVALID'
                    ? 'border-rose-600 text-rose-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Errors Only ({previewResult.invalidRowsCount})
              </button>
            </div>

            {/* Preview Data Table */}
            <div className="max-h-60 overflow-y-auto overflow-x-auto rounded-lg border border-slate-200 text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Gender</th>
                    <th className="py-2.5 px-3">Class / Form</th>
                    <th className="py-2.5 px-3">PREM No.</th>
                    <th className="py-2.5 px-3">Validation Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No rows in this view.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => {
                      const isValid = row.status === 'VALID';
                      const fullName = [
                        row.data.firstName,
                        row.data.middleName,
                        row.data.lastName,
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <tr
                          key={row.rowNumber}
                          className={isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}
                        >
                          <td className="py-2 px-3 font-mono font-medium text-slate-500">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3">
                            {isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <XCircle className="h-3 w-3" />
                                Invalid
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{fullName}</td>
                          <td className="py-2 px-3 text-slate-600">{row.data.gender}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {row.resolvedClass?.name || row.data.className || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {row.data.premNumber || '—'}
                          </td>
                          <td className="py-2 px-3 text-xs">
                            {row.errors.length > 0 ? (
                              <span className="text-rose-600 font-medium">
                                {row.errors.join('; ')}
                              </span>
                            ) : (
                              <span className="text-emerald-600">Ready to enroll</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Commit Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Upload a different file</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-import"
                  onClick={handleConfirmImport}
                  disabled={previewResult.validRowsCount === 0 || isCommitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCommitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>{`Importing ${previewResult.validRowsCount} Students...`}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>{`Confirm & Import (${previewResult.validRowsCount} Students)`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: SUCCESS STATE                                             */}
        {/* ================================================================= */}
        {step === 'SUCCESS' && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Bulk Enrolment Completed Successfully
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                <span className="font-bold text-slate-900">{importedCount}</span> students have been
                registered into official school rolls and allocated to active academic class streams.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                id="btn-import-done"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                <span>Done &amp; View Enrolments</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
