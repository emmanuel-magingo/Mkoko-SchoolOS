import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/common/Modal';
import { FeeStructure } from '../../../types/finance.types';
import { Student } from '../../../types';
import { financeApi } from '../../../api/finance.api';
import { api } from '../../../api/client';
import { formatMoney } from '../../../utils/format';
import { AlertCircle } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStructureId?: string;
  preselectedStudentId?: string;
  onSuccess?: (invoiceId: string) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  preselectedStructureId,
  preselectedStudentId,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
  const [selectedStructureId, setSelectedStructureId] = useState(preselectedStructureId || '');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedStudentId(preselectedStudentId || '');
      setSelectedStructureId(preselectedStructureId || '');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setDueDate('');

      const loadPrerequisites = async () => {
        try {
          setFetchingData(true);
          const [studentsRes, structuresRes] = await Promise.all([
            api.get<Student[]>('/students?status=ACTIVE&limit=100'),
            financeApi.getFeeStructures({ status: 'PUBLISHED', limit: 100 }),
          ]);
          setStudents(studentsRes.data);
          setStructures(structuresRes.data);
        } catch (err) {
          setError('Failed to load students or published fee structures');
        } finally {
          setFetchingData(false);
        }
      };

      loadPrerequisites();
    }
  }, [isOpen, preselectedStudentId, preselectedStructureId]);

  const selectedStructure = structures.find((s) => s.id === selectedStructureId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select an active student');
      return;
    }
    if (!selectedStructureId) {
      setError('Please select a published fee structure');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await financeApi.createInvoice({
        studentId: selectedStudentId,
        feeStructureId: selectedStructureId,
        issueDate: issueDate || undefined,
        dueDate: dueDate || undefined,
      });

      const invoiceId = res.data.id;
      if (onSuccess) {
        onSuccess(invoiceId);
      }
      onClose();
      navigate(`/finance/invoices/${invoiceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Student Invoice"
      description="Select an active student and an approved, published fee structure to snapshot line items and generate an authoritative invoice."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {fetchingData ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Loading student and fee structure records...
          </div>
        ) : (
          <>
            {/* Student Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Student <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.admissionNumber} - {st.firstName} {st.lastName} {st.class ? `(${st.class.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Published Fee Structure Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Published Fee Structure <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedStructureId}
                onChange={(e) => setSelectedStructureId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Published Structure --</option>
                {structures.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name} ({fs.classLevel} - {fs.academicYear} {fs.term ? `- ${fs.term}` : ''}) — {formatMoney(fs.totalAmount, fs.currency)}
                  </option>
                ))}
              </select>
              {structures.length === 0 && (
                <p className="text-[11px] text-amber-600 font-medium pt-1">
                  Notice: No published fee structures found. Please publish a fee structure first.
                </p>
              )}
            </div>

            {/* Selected Fee Structure Preview Card */}
            {selectedStructure && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{selectedStructure.name}</span>
                  <span className="text-xs font-black text-emerald-700">
                    {formatMoney(selectedStructure.totalAmount, selectedStructure.currency)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>Items included ({selectedStructure.items?.length || 0}):</p>
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {selectedStructure.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>• {item.feeCategory?.name || 'Category'}</span>
                        <span className="font-mono">{formatMoney(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Issue Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  min={issueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || fetchingData || !selectedStructureId || !selectedStudentId}
            className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? 'Generating Invoice...' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
