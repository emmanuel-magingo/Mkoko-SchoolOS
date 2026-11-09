import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SchoolClass } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Building2, Plus, Users, AlertCircle } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { useAuth } from '../../contexts/AuthContext';

export const ClassListPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { tenant } = useAuth();
  const isAlevel = tenant?.schoolLevel === 'O_AND_A_LEVEL';
  const availableLevels = isAlevel
    ? ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6']
    : ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Form 1');
  const [stream, setStream] = useState('A');
  const [submitting, setSubmitting] = useState(false);

  // Reset level to Form 1 if current level is not permitted
  useEffect(() => {
    if (!availableLevels.includes(level)) {
      setLevel(availableLevels[0] || 'Form 1');
    }
  }, [isAlevel, availableLevels, level]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get<SchoolClass[]>('/classes');
      setClasses(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const generatedName = name.trim() || `${level} - ${stream}`;
      await api.post<SchoolClass>('/classes', {
        name: generatedName,
        level,
        stream,
      });
      fetchClasses();
      setIsAddModalOpen(false);
      setName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Classes & Streams</h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {isAlevel ? 'O-Level & A-Level (Forms 1–6)' : 'Ordinary Level (Forms 1–4)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic forms and class streams for student allocation.
          </p>
        </div>

        {hasPermission(Permissions.MANAGE_CLASSES) && (
          <button
            id="add-class-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Loading school classes...
          </div>
        ) : classes.length > 0 ? (
          classes.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">Level: {c.level} • Stream: {c.stream}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                  {c.stream}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enrolled:</span>
                </div>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  {c._count?.students ?? 0} students
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400">
            No classes defined for this school yet. Click &quot;Add Class&quot; to begin.
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Class / Stream"
        description="Create a new class for this school tenant."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class Level *
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {availableLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Stream Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. A, B, Blue, East"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Display Name (optional)
            </label>
            <input
              type="text"
              placeholder={`e.g. ${level} - ${stream}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl shadow-sm hover:brightness-105"
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
