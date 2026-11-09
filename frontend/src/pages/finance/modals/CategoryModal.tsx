import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { FeeCategory } from '../../../types/finance.types';
import { financeApi } from '../../../api/finance.api';
import { AlertCircle } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: FeeCategory | null;
  onSuccess: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSuccess,
}) => {
  const isEditing = !!category;
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setCode(category.code);
      setName(category.name);
      setDescription(category.description || '');
      setIsActive(category.isActive);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    if (!isEditing && !code.trim()) {
      setError('Category code is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && category) {
        await financeApi.updateFeeCategory(category.id, {
          name: name.trim(),
          description: description.trim() || null,
          isActive,
        });
      } else {
        await financeApi.createFeeCategory({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fee category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Fee Category' : 'Create Fee Category'}
      description={
        isEditing
          ? 'Update the fee category configuration or activate/deactivate it.'
          : 'Fee categories classify line items on fee structures and invoices.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Category Code {!isEditing && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            required
            disabled={isEditing}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. TUITION, BOARDING, EXAM"
            maxLength={30}
            className={`w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono ${
              isEditing ? 'opacity-60 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-brand-500'
            }`}
          />
          {isEditing && (
            <p className="text-[11px] text-slate-400">Category code cannot be changed once established.</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Category Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Academic Tuition Fee"
            maxLength={100}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Description (Optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of charges under this category..."
            maxLength={255}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {isEditing && (
          <div className="pt-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-xs font-semibold text-slate-800">Category Status</p>
              <p className="text-[11px] text-slate-500">
                Deactivated categories cannot be selected in new fee structures.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>
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
            disabled={loading}
            className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
