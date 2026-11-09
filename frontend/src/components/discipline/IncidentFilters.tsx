import React from 'react';
import { IncidentCategory, IncidentSeverity, IncidentStatus, IncidentFilterParams } from '../../api/disciplineApi';

interface IncidentFiltersProps {
  filters: IncidentFilterParams;
  onChange: (newFilters: IncidentFilterParams) => void;
  onReset: () => void;
}

export const IncidentFilters: React.FC<IncidentFiltersProps> = ({ filters, onChange, onReset }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onChange({ ...filters, status: (e.target.value as IncidentStatus) || undefined, page: 1 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Severity</label>
          <select
            value={filters.severity || ''}
            onChange={(e) => onChange({ ...filters, severity: (e.target.value as IncidentSeverity) || undefined, page: 1 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onChange({ ...filters, category: (e.target.value as IncidentCategory) || undefined, page: 1 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Categories</option>
            <option value="ABSENCE">Absence</option>
            <option value="LATE_ARRIVAL">Late Arrival</option>
            <option value="FIGHTING">Fighting</option>
            <option value="BULLYING">Bullying</option>
            <option value="INSUBORDINATION">Insubordination</option>
            <option value="ACADEMIC_MISCONDUCT">Academic Misconduct</option>
            <option value="DAMAGE_TO_PROPERTY">Damage to Property</option>
            <option value="UNIFORM_VIOLATION">Uniform Violation</option>
            <option value="PROHIBITED_ITEM">Prohibited Item</option>
            <option value="DISRUPTIVE_BEHAVIOR">Disruptive Behavior</option>
            <option value="LEAVING_SCHOOL_WITHOUT_PERMISSION">Leaving Without Permission</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};
