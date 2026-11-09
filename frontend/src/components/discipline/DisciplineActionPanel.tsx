import React, { useState } from 'react';
import { DisciplineAction, DisciplineActionType, createAction } from '../../api/disciplineApi';
import { RequirePermission } from '../common/RequirePermission';
import { Permissions } from '../../types/permissions';

interface DisciplineActionPanelProps {
  incidentId: string;
  actions: DisciplineAction[];
  onActionAdded: () => void;
}

export const DisciplineActionPanel: React.FC<DisciplineActionPanelProps> = ({
  incidentId,
  actions,
  onActionAdded,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<DisciplineActionType>('WARNING');
  const [description, setDescription] = useState('');
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createAction(incidentId, {
        actionType,
        description: description || undefined,
        actionDate,
        dueDate: dueDate || undefined,
      });
      setDescription('');
      setDueDate('');
      setIsOpen(false);
      onActionAdded();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record disciplinary action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">Disciplinary Actions ({actions.length})</h3>
        <RequirePermission permission={Permissions.MANAGE_DISCIPLINE}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {isOpen ? 'Cancel' : '+ Assign Action'}
          </button>
        </RequirePermission>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            New Disciplinary Action
          </h4>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2 rounded mb-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as DisciplineActionType)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              >
                <option value="WARNING">Formal Warning</option>
                <option value="COUNSELING">Counseling</option>
                <option value="PARENT_MEETING">Parent Meeting</option>
                <option value="DETENTION">Detention</option>
                <option value="COMMUNITY_SERVICE">Community Service</option>
                <option value="SUSPENSION_RECOMMENDATION">Suspension Recommendation</option>
                <option value="SUSPENSION">Suspension</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Action Date</label>
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Details & Instructions</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe required actions, expectations, or terms..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium py-1.5 rounded text-xs transition-colors"
          >
            {isSubmitting ? 'Recording Action...' : 'Save Action'}
          </button>
        </form>
      )}

      {actions.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">No disciplinary actions assigned yet.</p>
      ) : (
        <div className="space-y-3">
          {actions.map((act) => (
            <div key={act.id} className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-purple-400">{act.actionType}</span>
                <span className="text-slate-400">{new Date(act.actionDate).toLocaleDateString()}</span>
              </div>
              {act.description && <p className="text-slate-300 mb-2">{act.description}</p>}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2 mt-2">
                <span>
                  By: {act.assignedBy ? `${act.assignedBy.firstName} ${act.assignedBy.lastName}` : 'N/A'}
                </span>
                <span>Status: <strong className="text-slate-300">{act.status}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
