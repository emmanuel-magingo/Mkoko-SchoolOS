import React, { useState } from 'react';
import { DisciplineNote, createNote } from '../../api/disciplineApi';
import { RequirePermission } from '../common/RequirePermission';
import { Permissions } from '../../types/permissions';

interface DisciplineNotesProps {
  incidentId: string;
  notes: DisciplineNote[];
  onNoteAdded: () => void;
}

export const DisciplineNotes: React.FC<DisciplineNotesProps> = ({
  incidentId,
  notes,
  onNoteAdded,
}) => {
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createNote(incidentId, { note: noteText.trim() });
      setNoteText('');
      onNoteAdded();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add disciplinary note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
      <h3 className="text-base font-semibold text-white mb-4">
        Review History & Notes ({notes.length})
      </h3>

      {/* Note input form */}
      <RequirePermission permission={Permissions.ADD_DISCIPLINE_NOTE}>
        <form onSubmit={handleSubmit} className="mb-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2 rounded mb-2">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an immutable observation, review, or welfare note..."
              rows={2}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !noteText.trim()}
              className="self-end bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post Note'}
            </button>
          </div>
        </form>
      </RequirePermission>

      {/* Notes list (append-only) */}
      {notes.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">No notes added to this incident yet.</p>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {notes.map((n) => (
            <div key={n.id} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200">
                  {n.author.firstName} {n.author.lastName}
                  <span className="text-[11px] text-slate-400 font-normal ml-1.5">({n.author.role})</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{n.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
