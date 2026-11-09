import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditLog, Tenant } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/common/Badge';
import { ShieldAlert, RefreshCw, AlertCircle } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (isPlatformAdmin && tenantId) query.set('tenantId', tenantId);
      if (action) query.set('action', action);
      if (actorId) query.set('actorId', actorId);
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      const qs = query.toString();
      const res = await api.get<AuditLog[]>(`/audit-logs${qs ? `?${qs}` : ''}`);
      setLogs(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tenantId, action, actorId, from, to, isPlatformAdmin]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    api.get<Tenant[]>('/tenants').then((response) => setTenants(response.data)).catch(() => setTenants([]));
  }, [isPlatformAdmin]);

  const getActionBadgeVariant = (action: AuditLog['action']) => {
    switch (action) {
      case 'LOGIN':
        return 'info';
      case 'LOGOUT':
        return 'neutral';
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'warning';
      case 'DELETE':
        return 'danger';
      case 'ROLE_CHANGE':
        return 'brand';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system activity log recording tenant mutations, authentication, and state changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section aria-label="Audit filters" className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        {isPlatformAdmin && <select aria-label="Tenant" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" value={tenantId} onChange={(event) => setTenantId(event.target.value)}><option value="">All tenants and platform events</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.code})</option>)}</select>}
        <select aria-label="Audit action" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" value={action} onChange={(event) => setAction(event.target.value)}><option value="">All actions</option>{['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE', 'RESPONSIBILITY_ASSIGNED', 'RESPONSIBILITY_UPDATED', 'RESPONSIBILITY_REVOKED', 'FEE_STRUCTURE_CREATED', 'FEE_STRUCTURE_PUBLISHED', 'FEE_STRUCTURE_ARCHIVED', 'INVOICE_CREATED', 'INVOICE_ISSUED', 'INVOICE_VOIDED', 'PAYMENT_RECORDED', 'PAYMENT_VOIDED', 'RECEIPT_ISSUED', 'ASSESSMENT_CREATED', 'ASSESSMENT_FINALIZED', 'MARKS_ENTERED', 'MARK_CORRECTED', 'RESULT_FINALIZED', 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_UPDATED', 'ANNOUNCEMENT_PUBLISHED', 'ANNOUNCEMENT_ARCHIVED', 'NOTIFICATION_CREATED', 'NOTIFICATION_READ', 'NOTIFICATIONS_MARKED_READ', 'DISCIPLINE_INCIDENT_CREATED', 'DISCIPLINE_INCIDENT_REVIEWED', 'DISCIPLINE_INCIDENT_ESCALATED', 'DISCIPLINE_INCIDENT_RESOLVED', 'DISCIPLINE_INCIDENT_CLOSED', 'DISCIPLINE_ACTION_CREATED', 'DISCIPLINE_NOTE_CREATED', 'STAFF_CREATED', 'STAFF_UPDATED', 'STAFF_STATUS_CHANGED', 'LEAVE_REQUEST_CREATED', 'LEAVE_REQUEST_APPROVED', 'LEAVE_REQUEST_REJECTED', 'LEAVE_REQUEST_CANCELLED', 'DELEGATION_CREATED', 'DELEGATION_REVOKED', 'COMPENSATION_CREATED', 'COMPENSATION_UPDATED', 'PAYROLL_PERIOD_CREATED', 'PAYROLL_CALCULATED', 'PAYROLL_REVIEWED', 'PAYROLL_APPROVED', 'PAYROLL_FINALIZED', 'PAYROLL_POSTED', 'PAYROLL_PAYSLIP_ACCESSED', 'IMPORT_CREATED', 'IMPORT_VALIDATED', 'IMPORT_ACCEPTED', 'IMPORT_REJECTED', 'EVIDENCE_SUPERSEDED', 'BASELINE_COMPARISON_GENERATED'].map((item) => <option key={item}>{item}</option>)}</select>
        <input aria-label="Filter by actor ID" placeholder="Actor ID" value={actorId} onChange={(event) => setActorId(event.target.value)} className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-xs" />
        <label className="flex items-center gap-2 text-xs text-slate-500">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-700" /></label>
        <label className="flex items-center gap-2 text-xs text-slate-500">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-700" /></label>
      </section>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Actor</th>
                {isPlatformAdmin && <th className="py-3 px-4">Tenant</th>}
                <th className="py-3 px-4">Details / Metadata</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isPlatformAdmin ? 6 : 5} className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    {isPlatformAdmin && <td className="py-3.5 px-4 text-slate-700">{log.tenant ? `${log.tenant.name} (${log.tenant.code})` : 'Platform'}</td>}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {log.entityType}
                      {log.entityId && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ID: {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.actor ? (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {log.actor.firstName} {log.actor.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{log.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System / Unauthenticated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[11px] text-slate-600">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isPlatformAdmin ? 6 : 5} className="py-12 text-center text-slate-400">
                    No audit records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
