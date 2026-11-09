import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DisciplineIncident, getIncidentById } from '../../api/disciplineApi';
import { IncidentTimeline } from '../../components/discipline/IncidentTimeline';
import { DisciplineActionPanel } from '../../components/discipline/DisciplineActionPanel';
import { DisciplineNotes } from '../../components/discipline/DisciplineNotes';
import { EscalationPanel } from '../../components/discipline/EscalationPanel';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<DisciplineIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncident = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getIncidentById(id);
      setIncident(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load incident record');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">
        Loading incident record...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
          {error || 'Incident record not found'}
        </div>
        <button
          onClick={() => navigate('/discipline')}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-700"
        >
          ← Return to Incidents
        </button>
      </div>
    );
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'UNDER_REVIEW':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'ESCALATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/discipline')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              ← Back to Discipline
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400 font-mono">Case #{incident.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {incident.student.firstName} {incident.student.lastName}
            <span className="text-sm font-normal text-slate-400 ml-2">
              (Adm: #{incident.student.admissionNumber} | Class: {incident.student.class?.name || 'N/A'})
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getSeverityBadge(incident.severity)}`}>
            {incident.severity} SEVERITY
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getStatusBadge(incident.status)}`}>
            {incident.status}
          </span>
        </div>
      </div>

      {/* Lifecycle & Status Escalation Bar */}
      <EscalationPanel incident={incident} onStatusUpdated={fetchIncident} />

      {/* Main Grid: Details + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incident Description & Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-white">Incident Information</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Category</span>
                <span className="font-semibold text-white">{incident.category.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Incident Date</span>
                <span className="font-semibold text-white">{new Date(incident.incidentDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Incident Time</span>
                <span className="font-semibold text-white">{incident.incidentTime || 'Not recorded'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Location</span>
                <span className="font-semibold text-white">{incident.location || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Reported By</span>
                <span className="font-semibold text-white">
                  {incident.reportedBy.firstName} {incident.reportedBy.lastName} ({incident.reportedBy.role})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Parent Notified</span>
                <span className={`font-semibold ${incident.parentNotified ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {incident.parentNotified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">Description</span>
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {incident.description}
              </div>
            </div>

            {incident.resolution && (
              <div>
                <span className="text-xs text-emerald-400 font-semibold block mb-1">Formal Resolution</span>
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                  {incident.resolution}
                  <div className="text-[11px] text-emerald-400/80 mt-2">
                    Resolved by {incident.resolvedBy?.firstName} {incident.resolvedBy?.lastName} on{' '}
                    {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity / Audit Timeline */}
          <IncidentTimeline incident={incident} />
        </div>

        {/* Right Column: Actions & Notes */}
        <div className="space-y-6">
          <DisciplineActionPanel
            incidentId={incident.id}
            actions={incident.actions || []}
            onActionAdded={fetchIncident}
          />

          <DisciplineNotes
            incidentId={incident.id}
            notes={incident.notes || []}
            onNoteAdded={fetchIncident}
          />
        </div>
      </div>
    </div>
  );
};
