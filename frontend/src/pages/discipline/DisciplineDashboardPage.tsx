import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DisciplineIncident,
  DisciplineStats,
  IncidentFilterParams,
  getIncidents,
  getDisciplineStats,
} from '../../api/disciplineApi';
import { IncidentFilters } from '../../components/discipline/IncidentFilters';
import { RequirePermission } from '../../components/common/RequirePermission';
import { Permissions } from '../../types/permissions';

export const DisciplineDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<DisciplineIncident[]>([]);
  const [stats, setStats] = useState<DisciplineStats | null>(null);
  const [filters, setFilters] = useState<IncidentFilterParams>({ page: 1, limit: 15 });
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getIncidents(filters);
      setIncidents(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch discipline records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getDisciplineStats();
      setStats(res);
    } catch {
      // Non-critical if stats fail
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Discipline & Student Welfare</h1>
          <p className="text-sm text-slate-400">
            Monitor student conduct, manage behavioral incidents, and oversee corrective actions.
          </p>
        </div>
        <RequirePermission permission={Permissions.CREATE_DISCIPLINE_INCIDENT}>
          <button
            onClick={() => navigate('/discipline/incidents/new')}
            className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors shadow-sm self-start sm:self-auto"
          >
            + Report Incident
          </button>
        </RequirePermission>
      </div>

      {/* KPI Stats Widgets */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Total Incidents</span>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-blue-400 font-medium">Open Cases</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">{stats.byStatus['OPEN'] || 0}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-amber-400 font-medium">Escalated</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.byStatus['ESCALATED'] || 0}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-emerald-400 font-medium">Resolved</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.byStatus['RESOLVED'] || 0}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <IncidentFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({ page: 1, limit: 15 })}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Incident List Table */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Loading discipline records...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs italic">
                    No discipline incidents found matching the specified criteria.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/discipline/incidents/${inc.id}`)}
                    className="hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-300 font-mono">
                      {new Date(inc.incidentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-white">
                      {inc.student.firstName} {inc.student.lastName}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        #{inc.student.admissionNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-300">
                      {inc.student.class?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-slate-300">
                      {inc.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(inc.status)}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                      {inc.reportedBy.firstName} {inc.reportedBy.lastName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <span className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                        View Details →
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border-t border-slate-700 text-xs">
            <button
              disabled={filters.page! <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-400">
              Page {filters.page} of {totalPages}
            </span>
            <button
              disabled={filters.page! >= totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
