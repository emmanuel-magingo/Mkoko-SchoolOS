import React, { useState, useMemo } from 'react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { AcademicAuditLogEntry } from '../../../types/academics.types';
import {
  History,
  Search,
  ShieldCheck,
} from 'lucide-react';

export interface AuditHistoryLogProps {
  initialLogs?: AcademicAuditLogEntry[];
}

export const AuditHistoryLog: React.FC<AuditHistoryLogProps> = ({ initialLogs }) => {
  const { selectedSchool, activeTerm } = useAcademicContext();

  const [logs] = useState<AcademicAuditLogEntry[]>(
    initialLogs || [
      {
        id: 'aud-1',
        actorId: 'usr-1',
        actorName: 'Mrs. Salma Kigoma',
        actorRole: 'Academic Master',
        timestamp: '2026-10-18T14:32:00Z',
        contextSchool: selectedSchool?.name || 'Mwilamvya Model Academy',
        contextTerm: activeTerm?.name || 'Term I',
        action: 'REPORT_CARDS_PUBLISHED',
        targetRecord: 'Batch-Form4-Science-Term1',
        reason: 'Term 1 final mock exams approved by Academic Committee; generated transcripts for distribution',
        details: { count: 42, divisionBreakdown: { div1: 18, div2: 14 } },
      },
      {
        id: 'aud-2',
        actorId: 'usr-2',
        actorName: 'Mr. David Mrema',
        actorRole: 'Senior Subject Teacher',
        timestamp: '2026-10-16T11:15:00Z',
        contextSchool: selectedSchool?.name || 'Mwilamvya Model Academy',
        contextTerm: activeTerm?.name || 'Term I',
        action: 'MARKS_SUBMITTED',
        targetRecord: 'Assessment-BAM-Form4-Midterm',
        reason: 'Completed double-entry verification of raw candidate marks',
        details: { marksCount: 42, maxScore: 100 },
      },
      {
        id: 'aud-3',
        actorId: 'usr-3',
        actorName: 'Dr. Joseph Malecela',
        actorRole: 'Head of School',
        timestamp: '2026-10-15T09:45:00Z',
        contextSchool: selectedSchool?.name || 'Mwilamvya Model Academy',
        contextTerm: activeTerm?.name || 'Term I',
        action: 'POLICY_UPDATED',
        targetRecord: 'GradingSystem-NECTA-OLevel',
        reason: 'Aligned continuous assessment threshold to 40% CA + 60% Exam statutory guideline',
        details: { caWeight: 40, examWeight: 60 },
      },
      {
        id: 'aud-4',
        actorId: 'usr-1',
        actorName: 'Mrs. Salma Kigoma',
        actorRole: 'Academic Master',
        timestamp: '2026-10-12T16:20:00Z',
        contextSchool: selectedSchool?.name || 'Mwilamvya Model Academy',
        contextTerm: activeTerm?.name || 'Term I',
        action: 'ASSESSMENT_APPROVED',
        targetRecord: 'Assessment-PHY-Form4-Terminal',
        reason: 'Moderated examination schema and confirmed question rubrics',
        details: { verifiedBy: 'Academic Office' },
      },
      {
        id: 'aud-5',
        actorId: 'usr-3',
        actorName: 'Dr. Joseph Malecela',
        actorRole: 'Head of School',
        timestamp: '2026-10-05T08:10:00Z',
        contextSchool: selectedSchool?.name || 'Mwilamvya Model Academy',
        contextTerm: activeTerm?.name || 'Term I',
        action: 'REPORT_CARD_UNLOCKED',
        targetRecord: 'StudentCard-SCH-2026-089',
        reason: 'Authorized mark recount on Biology Section B following formal candidate petition',
        details: { requestedBy: 'Head of Department' },
      },
    ]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesActor = log.actorName.toLowerCase().includes(q);
        const matchesTarget = log.targetRecord.toLowerCase().includes(q);
        const matchesReason = (log.reason || '').toLowerCase().includes(q);
        if (!matchesActor && !matchesTarget && !matchesReason) return false;
      }
      if (fromDate && log.timestamp.slice(0, 10) < fromDate) return false;
      if (toDate && log.timestamp.slice(0, 10) > toDate) return false;
      return true;
    });
  }, [logs, actionFilter, searchQuery, fromDate, toDate]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'MARKS_SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REPORT_CARDS_PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'POLICY_UPDATED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ASSESSMENT_APPROVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'REPORT_CARD_UNLOCKED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Ledger Badge */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Academic Audit Ledger &amp; History</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Immutable Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tamper-evident chronological tracking of marks entry, report card publishing, and policy modifications.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search actor or target record..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Event Types</option>
              <option value="MARKS_SUBMITTED">Marks Submitted</option>
              <option value="REPORT_CARDS_PUBLISHED">Report Cards Published</option>
              <option value="POLICY_UPDATED">Policy Updated</option>
              <option value="ASSESSMENT_APPROVED">Assessment Approved</option>
              <option value="REPORT_CARD_UNLOCKED">Report Card Unlocked</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
            />
          </div>

          <div>
            <input
              type="date"
              placeholder="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Academic Action Ledger</h2>
          <span className="text-xs text-slate-500">Showing {filteredLogs.length} audit entries</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No audit events match your filters.</p>
            <p className="mt-1">All sensitive operations will automatically be stamped here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Actor (User)</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Context (School / Term)</th>
                  <th className="py-3 px-4">Action / Event</th>
                  <th className="py-3 px-4">Target Record</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {log.actorName.charAt(0)}
                        </div>
                        <span>{log.actorName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{log.actorRole}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="block font-medium text-slate-800">{log.contextSchool}</span>
                      {log.contextTerm && (
                        <span className="text-[11px] text-slate-400 font-normal">{log.contextTerm}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-700 text-[11px]">
                      {log.targetRecord}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <p className="line-clamp-2 italic">{log.reason || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
