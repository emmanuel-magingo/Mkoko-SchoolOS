import React, { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { financeApi } from '../../api/finance.api';
import { FeeCategory } from '../../types/finance.types';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../utils/format';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  PowerOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { CategoryModal } from './modals/CategoryModal';

export const FeeCategoriesPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageFinance = hasPermission(Permissions.MANAGE_FINANCE);
  const isReadOnly = !canManageFinance;

  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; isActive?: boolean } = {};
      if (search.trim()) params.search = search.trim();
      if (filterActive === 'active') params.isActive = true;
      if (filterActive === 'inactive') params.isActive = false;

      const res = await financeApi.getFeeCategories(params);
      setCategories(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fee categories');
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: FeeCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleToggleDeactivate = async (category: FeeCategory) => {
    const nextState = !category.isActive;
    const actionText = nextState ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} fee category "${category.name}"?`)) {
      return;
    }

    try {
      await financeApi.updateFeeCategory(category.id, { isActive: nextState });
      setActionSuccess(`Category "${category.name}" ${nextState ? 'activated' : 'deactivated'} successfully`);
      fetchCategories();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${actionText} category`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fee Categories</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard chart of accounts for classifying student fee structure items and invoice charges.
          </p>
        </div>

        {!isReadOnly ? (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Category</span>
          </button>
        ) : (
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Read-Only Mode</span>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search category code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="w-full md:w-44 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                {!isReadOnly && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="py-12 text-center text-slate-400">
                    Loading fee categories...
                  </td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">{cat.code}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{cat.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {cat.description || <span className="text-slate-300 italic">No description</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={cat.isActive ? 'success' : 'neutral'} size="sm" dot>
                        {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(cat.createdAt)}</td>
                    {!isReadOnly && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleDeactivate(cat)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              cat.isActive
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={cat.isActive ? 'Deactivate Category' : 'Activate Category'}
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="py-12 text-center text-slate-400">
                    No fee categories found. {!isReadOnly && 'Click "Create Fee Category" to add one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal (Create/Edit) */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        onSuccess={() => {
          fetchCategories();
          setActionSuccess(
            editingCategory ? 'Fee category updated successfully' : 'Fee category created successfully'
          );
          setTimeout(() => setActionSuccess(null), 4000);
        }}
      />
    </div>
  );
};
