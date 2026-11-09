import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronRight,
  History,
  Lock,
  Search,
} from 'lucide-react';
import { useAcademicContext } from '../../../contexts/AcademicContext';

export interface GradeBand {
  grade: string;
  minScore: number;
  maxScore: number;
  points?: number;
  remarks: string;
}

export interface GradingPolicy {
  id: string;
  name: string;
  code: string;
  category: 'NATIONAL_PRESET' | 'INTERNAL_POLICY';
  level: string; // e.g. "Ordinary Level (Form 1 - 4)", "Advanced Level (Form 5 - 6)", "Primary"
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  isDefault?: boolean;
  governingBody: string; // e.g. "NECTA", "TIE", "Internal Academic Board"
  description: string;
  scales: GradeBand[];
  versionHistory: Array<{
    version: string;
    effectiveDate: string;
    notes: string;
  }>;
}

export const NATIONAL_PRESETS: GradingPolicy[] = [
  {
    id: 'necta-o-level',
    name: 'NECTA National Secondary Scale (CSEE)',
    code: 'NECTA-O-LEVEL',
    category: 'NATIONAL_PRESET',
    level: 'Ordinary Level (Form 1 - 4)',
    version: 'v2024.1',
    effectiveDate: '2024-01-01',
    isDefault: true,
    governingBody: 'National Examinations Council of Tanzania (NECTA)',
    description: 'Statutory 5-tier grading system and division point calculation for Tanzanian secondary schools.',
    scales: [
      { grade: 'A', minScore: 75, maxScore: 100, points: 1, remarks: 'Distinction / Excellent' },
      { grade: 'B', minScore: 65, maxScore: 74, points: 2, remarks: 'Very Good' },
      { grade: 'C', minScore: 45, maxScore: 64, points: 3, remarks: 'Good' },
      { grade: 'D', minScore: 30, maxScore: 44, points: 4, remarks: 'Satisfactory / Pass' },
      { grade: 'F', minScore: 0, maxScore: 29, points: 5, remarks: 'Fail' },
    ],
    versionHistory: [
      { version: 'v2024.1', effectiveDate: '2024-01-01', notes: 'Updated statutory division point criteria and grade thresholds' },
      { version: 'v2016.2', effectiveDate: '2016-01-01', notes: 'Revised GPA scaling standards' },
    ],
  },
  {
    id: 'necta-a-level',
    name: 'NECTA Advanced Secondary Scale (ACSEE)',
    code: 'NECTA-A-LEVEL',
    category: 'NATIONAL_PRESET',
    level: 'Advanced Level (Form 5 - 6)',
    version: 'v2022.2',
    effectiveDate: '2022-01-01',
    governingBody: 'National Examinations Council of Tanzania (NECTA)',
    description: '7-tier advanced scale with Subsidiary Pass (S) designation and principal pass weights.',
    scales: [
      { grade: 'A', minScore: 80, maxScore: 100, points: 1, remarks: 'Excellent (Principal Pass)' },
      { grade: 'B', minScore: 70, maxScore: 79, points: 2, remarks: 'Very Good (Principal Pass)' },
      { grade: 'C', minScore: 60, maxScore: 69, points: 3, remarks: 'Good (Principal Pass)' },
      { grade: 'D', minScore: 50, maxScore: 59, points: 4, remarks: 'Average (Principal Pass)' },
      { grade: 'E', minScore: 40, maxScore: 49, points: 5, remarks: 'Pass (Principal Pass)' },
      { grade: 'S', minScore: 35, maxScore: 39, points: 6, remarks: 'Subsidiary Pass' },
      { grade: 'F', minScore: 0, maxScore: 34, points: 7, remarks: 'Fail' },
    ],
    versionHistory: [
      { version: 'v2022.2', effectiveDate: '2022-01-01', notes: 'Standard ACSEE grading scale and points weighting' },
    ],
  },
  {
    id: 'tie-primary',
    name: 'TIE National Primary Curriculum Scale (PSLE)',
    code: 'TIE-PRIMARY',
    category: 'NATIONAL_PRESET',
    level: 'Primary Standard (STD 1 - 7)',
    version: 'v2023.1',
    effectiveDate: '2023-01-01',
    governingBody: 'Tanzania Institute of Education (TIE)',
    description: 'Foundational 5-grade scale for primary school assessment and mastery benchmarks.',
    scales: [
      { grade: 'A', minScore: 81, maxScore: 100, points: 1, remarks: 'Bora Sana (Very Good)' },
      { grade: 'B', minScore: 61, maxScore: 80, points: 2, remarks: 'Nzuri (Good)' },
      { grade: 'C', minScore: 41, maxScore: 60, points: 3, remarks: 'Wastani (Average)' },
      { grade: 'D', minScore: 21, maxScore: 40, points: 4, remarks: 'Dhaifu (Weak)' },
      { grade: 'E', minScore: 0, maxScore: 20, points: 5, remarks: 'Dhaifu Sana (Fail)' },
    ],
    versionHistory: [
      { version: 'v2023.1', effectiveDate: '2023-01-01', notes: 'Tanzania Institute of Education competency rubric integration' },
    ],
  },
];

export const INTERNAL_POLICIES: GradingPolicy[] = [
  {
    id: 'school-midterm-ca',
    name: 'Internal Continuous Assessment & Mid-Term Policy',
    code: 'INT-CA-2026',
    category: 'INTERNAL_POLICY',
    level: 'School-Wide',
    version: 'v1.2',
    effectiveDate: '2026-01-01',
    governingBody: 'Mwilamvya Academic Board',
    description: 'Internal benchmark policy utilized for progressive mid-term performance checks.',
    scales: [
      { grade: 'A', minScore: 80, maxScore: 100, points: 1, remarks: 'Exemplary Mastery' },
      { grade: 'B', minScore: 70, maxScore: 79, points: 2, remarks: 'High Competence' },
      { grade: 'C', minScore: 55, maxScore: 69, points: 3, remarks: 'Satisfactory Progress' },
      { grade: 'D', minScore: 40, maxScore: 54, points: 4, remarks: 'Needs Intervention' },
      { grade: 'F', minScore: 0, maxScore: 39, points: 5, remarks: 'Critical Remediation Required' },
    ],
    versionHistory: [
      { version: 'v1.2', effectiveDate: '2026-01-01', notes: 'Adjusted intervention threshold to 40% for early warning' },
      { version: 'v1.0', effectiveDate: '2025-01-01', notes: 'Initial board approval' },
    ],
  },
];

export const GradingPolicyLibrary: React.FC = () => {
  const { activeAcademicYear, selectedSchool } = useAcademicContext();
  const [activeTab, setActiveTab] = useState<'ALL' | 'NATIONAL' | 'INTERNAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPolicy, setSelectedPolicy] = useState<GradingPolicy | null>(null);

  const allPolicies = useMemo(() => [...NATIONAL_PRESETS, ...INTERNAL_POLICIES], []);

  const filtered = useMemo(() => {
    return allPolicies.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.level.toLowerCase().includes(q) ||
        p.governingBody.toLowerCase().includes(q);

      const matchTab =
        activeTab === 'ALL' ||
        (activeTab === 'NATIONAL' && p.category === 'NATIONAL_PRESET') ||
        (activeTab === 'INTERNAL' && p.category === 'INTERNAL_POLICY');

      return matchSearch && matchTab;
    });
  }, [allPolicies, searchQuery, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Academic Governance
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {selectedSchool?.name || activeAcademicYear?.name
                ? `${selectedSchool?.name || ''} ${activeAcademicYear?.name ? `• ${activeAcademicYear.name}` : ''}`
                : 'Grading Scales & Presets'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Grading Policy Library</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View official Tanzanian national grading standards (NECTA/TIE) and manage institutional grading policies.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="tab-all-policies"
          >
            All ({allPolicies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('NATIONAL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'NATIONAL'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="tab-national-presets"
          >
            National Presets ({NATIONAL_PRESETS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INTERNAL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'INTERNAL'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="tab-internal-policies"
          >
            Internal Policies ({INTERNAL_POLICIES.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search grading policy or authority..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
        />
      </div>

      {/* Grid of Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((policy) => {
          const isNational = policy.category === 'NATIONAL_PRESET';

          return (
            <div
              key={policy.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              data-testid={`policy-card-${policy.id}`}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                      isNational
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isNational ? 'National Preset (Read-Only)' : 'Internal Policy'}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>{policy.version}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {policy.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {policy.governingBody} • <span className="font-semibold">{policy.level}</span>
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {policy.description}
                </p>

                {/* Effective Dates info */}
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Effective: <strong className="text-slate-700">{policy.effectiveDate}</strong></span>
                  </div>
                  {isNational && (
                    <div className="flex items-center gap-1 text-slate-400 ml-auto">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px]">Enforced Standard</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grade Scales Preview */}
              <div className="p-6 pt-4 bg-slate-50/50">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Grade Bands & Thresholds
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {policy.scales.map((band) => (
                    <div
                      key={band.grade}
                      className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-2xs"
                    >
                      <span className="text-sm font-extrabold text-slate-900 block">
                        {band.grade}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-500 block mt-0.5">
                        {`${band.minScore}-${band.maxScore}%`}
                      </span>
                      {band.points !== undefined && (
                        <span className="text-[9px] font-bold text-indigo-600 block mt-0.5">
                          {`${band.points} pt`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 px-6 border-t border-slate-100 bg-white flex items-center justify-between">
                <div className="text-xs text-slate-500 font-mono">
                  {policy.versionHistory.length} recorded versions
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPolicy(policy)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
                  data-testid={`btn-view-history-${policy.id}`}
                >
                  <span>View Details & History</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details & Version History Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedPolicy.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedPolicy.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Detailed Grade Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Complete Grade Scale & Remarks
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2.5 px-4">Grade</th>
                        <th className="py-2.5 px-4">Score Range</th>
                        <th className="py-2.5 px-4">Points</th>
                        <th className="py-2.5 px-4">Official Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedPolicy.scales.map((s) => (
                        <tr key={s.grade} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{s.grade}</td>
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-700">{`${s.minScore}% - ${s.maxScore}%`}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{s.points ?? '-'}</td>
                          <td className="py-2.5 px-4 text-slate-600">{s.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Version History */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Version History & Effective Dates</span>
                </h4>
                <div className="space-y-2">
                  {selectedPolicy.versionHistory.map((vh) => (
                    <div
                      key={vh.version}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{vh.version}</div>
                        <p className="text-slate-600 mt-0.5">{vh.notes}</p>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px] whitespace-nowrap bg-white px-2 py-1 rounded border border-slate-200">
                        {vh.effectiveDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
