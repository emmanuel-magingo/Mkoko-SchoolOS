import React from 'react';
import { DisciplineIncident } from '../../api/disciplineApi';

interface TimelineEvent {
  id: string;
  type: 'CREATED' | 'REVIEWED' | 'NOTE' | 'ESCALATED' | 'ACTION' | 'RESOLVED' | 'CLOSED';
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
}

export const IncidentTimeline: React.FC<{ incident: DisciplineIncident }> = ({ incident }) => {
  const events: TimelineEvent[] = [];

  // 1. Incident Created
  events.push({
    id: `created-${incident.id}`,
    type: 'CREATED',
    title: 'Incident Reported',
    description: `Reported by ${incident.reportedBy.firstName} ${incident.reportedBy.lastName} (${incident.reportedBy.role}). Category: ${incident.category}, Severity: ${incident.severity}.`,
    timestamp: incident.createdAt,
    actor: `${incident.reportedBy.firstName} ${incident.reportedBy.lastName}`,
  });

  // 2. Incident Notes
  if (incident.notes && incident.notes.length > 0) {
    incident.notes.forEach((note) => {
      let type: TimelineEvent['type'] = 'NOTE';
      let title = 'Note Added';
      if (note.note.startsWith('[Review Note]')) {
        type = 'REVIEWED';
        title = 'Incident Reviewed';
      } else if (note.note.startsWith('[Escalated]')) {
        type = 'ESCALATED';
        title = 'Case Escalated';
      } else if (note.note.startsWith('[Case Closed]')) {
        type = 'CLOSED';
        title = 'Case Closed';
      }

      events.push({
        id: `note-${note.id}`,
        type,
        title,
        description: note.note,
        timestamp: note.createdAt,
        actor: `${note.author.firstName} ${note.author.lastName}`,
      });
    });
  }

  // 3. Disciplinary Actions
  if (incident.actions && incident.actions.length > 0) {
    incident.actions.forEach((act) => {
      events.push({
        id: `act-${act.id}`,
        type: 'ACTION',
        title: `Action Assigned: ${act.actionType}`,
        description: act.description
          ? `${act.description} (Due: ${act.dueDate ? new Date(act.dueDate).toLocaleDateString() : 'N/A'})`
          : undefined,
        timestamp: act.createdAt,
        actor: act.assignedBy ? `${act.assignedBy.firstName} ${act.assignedBy.lastName}` : undefined,
      });
    });
  }

  // 4. Resolved
  if (incident.resolvedAt && incident.resolution) {
    events.push({
      id: `resolved-${incident.id}`,
      type: 'RESOLVED',
      title: 'Incident Resolved',
      description: incident.resolution,
      timestamp: incident.resolvedAt,
      actor: incident.resolvedBy
        ? `${incident.resolvedBy.firstName} ${incident.resolvedBy.lastName}`
        : undefined,
    });
  }

  // Sort events chronologically
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getBadgeColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'CREATED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'REVIEWED':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'NOTE':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'ESCALATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'ACTION':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-600/30 text-slate-300 border-slate-600/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
      <h3 className="text-base font-semibold text-white mb-4">Incident Audit & Activity Timeline</h3>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
        {events.map((evt) => (
          <div key={evt.id} className="relative">
            {/* Timeline node dot */}
            <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-800 bg-brand-500" />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getBadgeColor(evt.type)}`}>
                  {evt.title}
                </span>
                {evt.actor && (
                  <span className="text-xs text-slate-400 font-medium">by {evt.actor}</span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {new Date(evt.timestamp).toLocaleString()}
              </span>
            </div>

            {evt.description && (
              <p className="text-sm text-slate-300 mt-1 pl-1 bg-slate-900/40 p-2 rounded border border-slate-700/50">
                {evt.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
