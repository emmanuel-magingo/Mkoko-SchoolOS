import React, { useState } from 'react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../contexts/AuthContext';
import { Permissions } from '../../../types/permissions';
import { DisciplineIncidentSummary, DisciplineSeverity } from '../../../types/academics.types';
import {
  ShieldAlert,
  Lock,
  HeartHandshake,
  X,
} from 'lucide-react';

export interface DisciplineAndWelfareProps {
  forcePermissionDenied?: boolean;
  initialIncidents?: DisciplineIncidentSummary[];
}

export const DisciplineAndWelfare: React.FC<DisciplineAndWelfareProps> = ({
  forcePermissionDenied = false,
  initialIncidents,
}) => {
  useAcademicContext();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

  // Permission boundary: VIEW_DISCIPLINE or elevated role
  const isAuthorized =
    !forcePermissionDenied &&
    (hasPermission(Permissions.VIEW_DISCIPLINE) ||
      ['DISCIPLINE_MASTER', 'HEADMASTER', 'SCHOOL_ADMIN', 'ACADEMIC_MASTER'].includes(
        user?.role || ''
      ));

  const [incidents, setIncidents] = useState<DisciplineIncidentSummary[]>(
    initialIncidents || [
      {
        id: 'inc-1',
        studentId: 'std-201',
        studentName: 'Hamisi Bakari',
        admissionNumber: 'SCH/2026/201',
        className: 'Form 4 Science',
        incidentType: 'Class Disruption & Unexcused Absence',
        severity: 'MODERATE',
        description: 'Repeatedly absent from afternoon physics practical sessions without medical cause.',
        actionTaken: 'Parental meeting scheduled; 2 weeks community service on campus grounds.',
        reportedBy: 'Mr. David Mrema',
        date: '2026-10-14',
        status: 'UNDER_INVESTIGATION',
        isConfidential: true,
      },
      {
        id: 'inc-2',
        studentId: 'std-202',
        studentName: 'Mariam Juma',
        admissionNumber: 'SCH/2026/202',
        className: 'Form 3 Arts',
        incidentType: 'Welfare Concern: Emotional Distress',
        severity: 'MAJOR',
        description: 'Student experiencing prolonged grief after family bereavement; academic marks declining.',
        actionTaken: 'Referred to school resident counselor and welfare officer for counseling support.',
        reportedBy: 'Mrs. Fatma Said',
        date: '2026-10-08',
        status: 'REPORTED',
        isConfidential: true,
      },
      {
        id: 'inc-3',
        studentId: 'std-203',
        studentName: 'Rashid Selemani',
        admissionNumber: 'SCH/2026/203',
        className: 'Form 2 A',
        incidentType: 'Uniform Code Non-compliance',
        severity: 'MINOR',
        description: 'Persistent improper uniform footwear and missed morning roll call.',
        actionTaken: 'Verbal warning issued; guidance counselor had discussion with guardian.',
        reportedBy: 'Mr. Joseph Temba',
        date: '2026-09-28',
        status: 'RESOLVED',
        isConfidential: false,
      },
    ]
  );

  const [isWelfareModalOpen, setIsWelfareModalOpen] = useState(false);
  const [welfareForm, setWelfareForm] = useState({
    studentName: '',
    admissionNumber: '',
    className: 'Form 4 Science',
    incidentType: 'Welfare Referral: Mental Health & Support',
    severity: 'MODERATE' as DisciplineSeverity,
    description: '',
  });

  const handleAddReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!welfareForm.studentName || !welfareForm.description) return;

    const newIncident: DisciplineIncidentSummary = {
      id: `inc-${Date.now()}`,
      studentId: `std-${Date.now()}`,
      studentName: welfareForm.studentName,
      admissionNumber: welfareForm.admissionNumber || 'SCH/2026/999',
      className: welfareForm.className,
      incidentType: welfareForm.incidentType,
      severity: welfareForm.severity,
      description: welfareForm.description,
      reportedBy: `${user?.firstName || 'Staff'} ${user?.lastName || 'Member'}`,
      date: new Date().toISOString().split('T')[0],
      status: 'REPORTED',
      isConfidential: true,
    };

    setIncidents([newIncident, ...incidents]);
    setIsWelfareModalOpen(false);
    setWelfareForm({
      studentName: '',
      admissionNumber: '',
      className: 'Form 4 Science',
      incidentType: 'Welfare Referral: Mental Health & Support',
      severity: 'MODERATE',
      description: '',
    });
  };

  const getSeverityBadge = (severity: DisciplineSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MAJOR':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MODERATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MINOR':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // RESTRICTED ACCESS BOUNDARY VIEW
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 max-w-2xl mx-auto text-center space-y-4 my-8">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Confidential • Restricted Access
          </span>
          <h2 className="text-xl font-bold text-slate-900">Discipline &amp; Welfare Clearance Required</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Student disciplinary records and psychosocial welfare referrals contain sensitive student data.
            Access is strictly limited to the Discipline Master, School Counselor, and Executive Headmaster.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Policy Compliance Notice:</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            If you need to log an urgent pastoral care or safeguarding referral, please submit through your departmental supervisor or contact the Head of School directly.
          </p>
        </div>
      </div>
    );
  }

  // AUTHORIZED ACCESS VIEW
  return (
    <div className="space-y-6">
      {/* Confidential Classification Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Discipline &amp; Student Welfare</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Confidential
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Secure student behavioral logging, pastoral welfare referrals, and restorative counseling.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWelfareModalOpen(true)}
            id="log-welfare-referral-btn"
            className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <HeartHandshake className="w-4 h-4 mr-1.5" />
            Log Welfare Referral
          </button>
        </div>
      </div>

      {/* Incidents and Referrals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Incident &amp; Welfare Cases</h2>
          <span className="text-xs text-slate-500">Restricted to authorized pastoral committee</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Student &amp; Class</th>
                <th className="py-3 px-4">Incident / Referral Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Case Summary &amp; Action Taken</th>
                <th className="py-3 px-4">Date &amp; Reporter</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{inc.studentName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {inc.admissionNumber} • {inc.className}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      {inc.isConfidential && <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{inc.incidentType}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(
                        inc.severity
                      )}`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-slate-700 line-clamp-1">{inc.description}</p>
                    {inc.actionTaken && (
                      <p className="text-[11px] text-indigo-700 font-medium line-clamp-1 mt-0.5">
                        Action: {inc.actionTaken}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="block font-medium">{inc.date}</span>
                    <span className="text-[11px] text-slate-400">By: {inc.reportedBy}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.status === 'UNDER_INVESTIGATION'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Welfare Referral Modal */}
      {isWelfareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-600" />
                Log Confidential Welfare Referral
              </h2>
              <button
                onClick={() => setIsWelfareModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReferral} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baraka Nyerere"
                  value={welfareForm.studentName}
                  onChange={(e) => setWelfareForm({ ...welfareForm, studentName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={welfareForm.severity}
                    onChange={(e) =>
                      setWelfareForm({ ...welfareForm, severity: e.target.value as DisciplineSeverity })
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="MINOR">Minor</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <input
                    type="text"
                    value={welfareForm.className}
                    onChange={(e) => setWelfareForm({ ...welfareForm, className: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confidential Notes &amp; Concern *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe observations, behavioral changes, or personal support needs..."
                  value={welfareForm.description}
                  onChange={(e) => setWelfareForm({ ...welfareForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWelfareModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-referral-btn"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Submit Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
