import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { financeApi } from '../../api/finance.api';
import { FeeCategory } from '../../types/finance.types';
import { formatMoney } from '../../utils/format';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Calculator,
} from 'lucide-react';

interface FeeItemInput {
  feeCategoryId: string;
  amount: string;
  description: string;
}

export const CreateFeeStructurePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role === 'HEADMASTER') {
    return <Navigate to="/finance/fee-structures" replace />;
  }

  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [classLevel, setClassLevel] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [currency] = useState('TZS');
  const [items, setItems] = useState<FeeItemInput[]>([
    { feeCategoryId: '', amount: '', description: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setFetchingCategories(true);
        const res = await financeApi.getFeeCategories({ isActive: true });
        setCategories(res.data);
        if (res.data.length > 0) {
          setItems([{ feeCategoryId: res.data[0].id, amount: '', description: '' }]);
        }
      } catch (err) {
        setError('Failed to load active fee categories. Please create fee categories first.');
      } finally {
        setFetchingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { feeCategoryId: categories[0]?.id || '', amount: '', description: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('A fee structure must contain at least one fee item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleItemChange = (index: number, field: keyof FeeItemInput, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Live total calculation for preview
  const liveTotal = items.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Fee structure name is required');
      return;
    }
    if (!classLevel.trim()) {
      setError('Class level is required (e.g. Form 1, Form 2)');
      return;
    }
    if (items.length === 0) {
      setError('At least one fee item is required');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.feeCategoryId) {
        setError(`Please select a fee category for item #${i + 1}`);
        return;
      }
      const amt = parseFloat(item.amount);
      if (isNaN(amt) || amt <= 0) {
        setError(`Item #${i + 1} must have an amount greater than 0`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const res = await financeApi.createFeeStructure({
        name: name.trim(),
        academicYear,
        classLevel: classLevel.trim(),
        term: term.trim() || null,
        currency,
        items: items.map((it) => ({
          feeCategoryId: it.feeCategoryId,
          amount: parseFloat(it.amount),
          description: it.description.trim() || null,
        })),
      });

      navigate(`/finance/fee-structures/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fee structure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/finance/fee-structures"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fee Structures</span>
        </Link>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-brand-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Fee Structure</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Establish an authorized fee schedule draft for an academic year and class level.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Metadata Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Structure Specification
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Structure Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Form 1 Term 1 Standard Academic Fees"
              maxLength={150}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={2000}
                max={2100}
                value={academicYear}
                onChange={(e) => setAcademicYear(parseInt(e.target.value) || 2026)}
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Class Level <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="e.g. Form 1, Form 2, Grade 1"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Term (Optional)</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Full Year">Full Year / Annual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fee Items & Charges</h3>
              <p className="text-[11px] text-slate-400">Add fee items that comprise this billing blueprint.</p>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee Item</span>
            </button>
          </div>

          {fetchingCategories ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading categories...</div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col md:flex-row items-center gap-3"
                >
                  <div className="w-full md:w-1/3 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Category</label>
                    <select
                      required
                      value={item.feeCategoryId}
                      onChange={(e) => handleItemChange(idx, 'feeCategoryId', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full md:w-1/3 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Amount (TZS)</label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={item.amount}
                      onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                      placeholder="e.g. 150000"
                      className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="w-full md:flex-1 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Note / Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Optional notes..."
                      maxLength={255}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-end md:self-center mt-2 md:mt-5"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Live Total Display */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Total Calculated Fees:
                </span>
                <p className="text-[11px] text-emerald-700">Display estimate (Backend remains authoritative)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-black text-emerald-900">
                {formatMoney(liveTotal, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/finance/fee-structures"
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || liveTotal <= 0}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? 'Creating Fee Structure...' : 'Create Structure (Draft)'}
          </button>
        </div>
      </form>
    </div>
  );
};
