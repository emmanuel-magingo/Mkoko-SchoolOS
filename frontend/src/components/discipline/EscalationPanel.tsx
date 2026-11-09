import React, { useState } from 'react';
import {
  DisciplineIncident,
  reviewIncident,
  escalateIncident,
  resolveIncident,
  closeIncident,
  investigateIncident,
  referToCommittee,
} from '../../api/disciplineApi';
import { RequirePermission } from '../common/RequirePermission';
import { Permissions } from '../../types/permissions';

interface EscalationPanelProps {
  incident: DisciplineIncident;
  onStatusUpdated: () => void;
}

export const EscalationPanel: React.FC<EscalationPanelProps> = ({ incident, onStatusUpdated }) => {
  const [activeModal, setActiveModal] = useState<
    'REVIEW' | 'INVESTIGATE' | 'COMMITTEE' | 'ESCALATE' | 'RESOLVE' | 'CLOSE' | null
  >(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (activeModal === 'REVIEW') {
        await reviewIncident(incident.id, { reviewNote: inputText || undefined });
      } else if (activeModal === 'INVESTIGATE') {
        await investigateIncident(incident.id, { notes: inputText || undefined });
      } else if (activeModal === 'COMMITTEE') {
        if (!inputText.trim()) throw new Error('Committee referral details are required');
        await referToCommittee(incident.id, { committeeNotes: inputText.trim() });
      } else if (activeModal === 'ESCALATE') {
        if (!inputText.trim()) throw new Error('Escalation reason is required');
        await escalateIncident(incident.id, { reason: inputText.trim() });
      } else if (activeModal === 'RESOLVE') {
        if (!inputText.trim()) throw new Error('Resolution details are required');
        await resolveIncident(incident.id, { resolution: inputText.trim() });
      } else if (activeModal === 'CLOSE') {
        await closeIncident(incident.id, { finalRemarks: inputText || undefined });
      }

      setInputText('');
      setActiveModal(null);
      onStatusUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-medium block">Current Case Status</span>
          <span className="text-lg font-bold text-white tracking-wide uppercase">{incident.status}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Review Button (only if OPEN) */}
          {incident.status === 'OPEN' && (
            <RequirePermission permission={Permissions.MANAGE_DISCIPLINE}>
              <button
                onClick={() => {
                  setError(null);
                  setInputText('');
                  setActiveModal('REVIEW');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Mark Under Review
              </button>
            </RequirePermission>
          )}

          {/* Investigate Button (if OPEN or UNDER_REVIEW) */}
          {(incident.status === 'OPEN' || incident.status === 'UNDER_REVIEW') && (
            <RequirePermission permission={Permissions.MANAGE_DISCIPLINE}>
              <button
                onClick={() => {
                  setError(null);
                  setInputText('');
                  setActiveModal('INVESTIGATE');
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Start Investigation
              </button>
            </RequirePermission>
          )}

          {/* Committee Referral */}
          {(incident.status === 'UNDER_REVIEW' || (incident.status as any) === 'INVESTIGATION') && (
            <RequirePermission permission={Permissions.ESCALATE_DISCIPLINE}>
              <button
                onClick={() => {
                  setError(null);
                  setInputText('');
                  setActiveModal('COMMITTEE');
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Refer to Committee
              </button>
            </RequirePermission>
          )}

          {/* Escalate Button (if OPEN or UNDER_REVIEW or INVESTIGATION) */}
          {(incident.status === 'OPEN' || incident.status === 'UNDER_REVIEW' || (incident.status as any) === 'INVESTIGATION') && (
            <RequirePermission permission={Permissions.ESCALATE_DISCIPLINE}>
              <button
                onClick={() => {
                  setError(null);
                  setInputText('');
                  setActiveModal('ESCALATE');
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Escalate Case
              </button>
            </RequirePermission>
          )}

          {/* Resolve Button (if not RESOLVED or CLOSED) */}
          {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
            <RequirePermission permission={Permissions.RESOLVE_DISCIPLINE}>
              <button
                onClick={() => {
                  setError(null);
                  setInputText('');
                  setActiveModal('RESOLVE');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Resolve Incident
              </button>
            </RequirePermission>
          )}

          {/* Close Button (if RESOLVED or ESCALATED) */}
          {(incident.status === 'RESOLVED' || incident.status === 'ESCALATED') && (
            <RequirePermission permission={Permissions.MANAGE_DISCIPLINE}>
              <button
                onClick={() => {
                  setError(null);
                  setInputText('');
                  setActiveModal('CLOSE');
                }}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Close Case
              </button>
            </RequirePermission>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">
              {activeModal === 'REVIEW' && 'Mark Incident Under Review'}
              {activeModal === 'INVESTIGATE' && 'Initiate Formal Investigation'}
              {activeModal === 'COMMITTEE' && 'Refer Case to Discipline Committee'}
              {activeModal === 'ESCALATE' && 'Escalate to Headmaster'}
              {activeModal === 'RESOLVE' && 'Record Formal Resolution'}
              {activeModal === 'CLOSE' && 'Close Disciplinary Case'}
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              {activeModal === 'REVIEW' && 'Acknowledge that this incident is currently being reviewed.'}
              {activeModal === 'INVESTIGATE' && 'Begin formal witness gathering and statements collection.'}
              {activeModal === 'COMMITTEE' && 'Refer serious or complex behavioral incidents to the disciplinary committee for formal hearing.'}
              {activeModal === 'ESCALATE' && 'Escalate high-severity or recurring behavioral concerns to school executive leadership.'}
              {activeModal === 'RESOLVE' && 'Document the agreed outcome, corrective action, or restorative measures taken.'}
              {activeModal === 'CLOSE' && 'Finalize and archive this disciplinary record. Further modifications will be restricted.'}
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAction}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {activeModal === 'REVIEW' && 'Review Notes (Optional)'}
                  {activeModal === 'INVESTIGATE' && 'Investigation Scope / Assigned Notes (Optional)'}
                  {activeModal === 'COMMITTEE' && 'Committee Referral Notes *'}
                  {activeModal === 'ESCALATE' && 'Reason for Escalation *'}
                  {activeModal === 'RESOLVE' && 'Formal Resolution Summary *'}
                  {activeModal === 'CLOSE' && 'Final Closing Remarks (Optional)'}
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  required={activeModal === 'ESCALATE' || activeModal === 'RESOLVE' || activeModal === 'COMMITTEE'}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  placeholder="Enter details..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
