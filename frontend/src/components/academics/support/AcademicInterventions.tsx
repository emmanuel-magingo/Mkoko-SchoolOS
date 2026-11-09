import React, { useState, useEffect, useMemo } from 'react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { AcademicsApi } from '../../../api/academics.api';
import { InterventionPlan, InterventionStatus } from '../../../types/academics.types';
import {
  Sparkles,
  Plus,
  Search,
  User,
  Calendar,
  Check,
  X,
} from 'lucide-react';

export interface AcademicInterventionsProps {
  initialPlans?: InterventionPlan[];
}

export const AcademicInterventions: React.FC<AcademicInterventionsProps> = ({ initialPlans }) => {
  useAcademicContext();

  const [plans, setPlans] = useState<InterventionPlan[]>(initialPlans || [
    {
      id: 'int-1',
      studentId: 'std-101',
      studentName: 'Amani Athumani',
      admissionNumber: 'SCH/2026/101',
      classId: 'cls-1',
      className: 'Form 4 Science',
      subjectId: 'sub-math',
      subjectName: 'Basic Mathematics',
      concern: 'Chronically failing Algebra and Calculus CA assessments',
      supportingEvidence: 'Scored 28/100 on Mid-Term Exam; missed 4 remedial homework submissions',
      assignedTeacherId: 'tch-1',
      assignedTeacherName: 'Mr. David Mrema',
      actionPlan: 'Enrolled in 2x weekly after-school remedial sessions; paired with peer mentor',
      reviewDate: '2026-11-15',
      status: 'ACTIVE',
      notes: 'Parent notified via Academic Consultation on 12th Oct.',
      createdAt: '2026-10-10T08:00:00Z',
    },
    {
      id: 'int-2',
      studentId: 'std-102',
      studentName: 'Gladness Mushi',
      admissionNumber: 'SCH/2026/102',
      classId: 'cls-1',
      className: 'Form 4 Science',
      subjectId: 'sub-phy',
      subjectName: 'Physics',
      concern: 'Difficulty grasping practical kinematics and laboratory write-ups',
      supportingEvidence: 'Practical assessment score 14/40; struggle with apparatus setup',
      assignedTeacherId: 'tch-2',
      assignedTeacherName: 'Ms. Clara Lyimo',
      actionPlan: 'Special Saturday lab session with dedicated lab technician guidance',
      reviewDate: '2026-11-01',
      status: 'ACTIVE',
      createdAt: '2026-10-12T09:30:00Z',
    },
    {
      id: 'int-3',
      studentId: 'std-103',
      studentName: 'Godfrey Mkumbo',
      admissionNumber: 'SCH/2026/103',
      classId: 'cls-2',
      className: 'Form 3 Arts',
      subjectId: 'sub-eng',
      subjectName: 'English Language',
      concern: 'Weak essay composition skills and grammar vocabulary',
      supportingEvidence: 'Essay assessment score 42%; repetitive spelling inconsistencies',
      assignedTeacherId: 'tch-3',
      assignedTeacherName: 'Mrs. Fatma Said',
      actionPlan: 'Completed 6 intensive structured writing modules and book critique assignments',
      reviewDate: '2026-10-01',
      status: 'RESOLVED',
      notes: 'Final Terminal score improved to 68%. Plan marked as resolved successfully.',
      createdAt: '2026-08-15T11:00:00Z',
    },
  ]);

  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<InterventionPlan | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    admissionNumber: '',
    className: 'Form 4 Science',
    subjectName: 'Basic Mathematics',
    concern: '',
    supportingEvidence: '',
    assignedTeacherName: '',
    actionPlan: '',
    reviewDate: '',
    notes: '',
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, tchRes] = await Promise.allSettled([
          AcademicsApi.getClasses(),
          AcademicsApi.getTeachers(),
        ]);
        if (clsRes.status === 'fulfilled' && clsRes.value.data) {
          setClasses(clsRes.value.data);
        }
        if (tchRes.status === 'fulfilled' && tchRes.value.data) {
          setTeachers(tchRes.value.data);
          if (tchRes.value.data.length > 0 && !formData.assignedTeacherName) {
            setFormData((prev) => ({
              ...prev,
              assignedTeacherName: `${tchRes.value.data[0].firstName} ${tchRes.value.data[0].lastName}`,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load classes/teachers for interventions', e);
      }
    };
    fetchMetadata();
  }, []);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.concern || !formData.actionPlan) return;

    const newPlan: InterventionPlan = {
      id: `int-${Date.now()}`,
      studentId: `std-${Date.now()}`,
      studentName: formData.studentName,
      admissionNumber: formData.admissionNumber || `SCH/2026/${Math.floor(100 + Math.random() * 900)}`,
      classId: 'cls-1',
      className: formData.className,
      subjectName: formData.subjectName,
      concern: formData.concern,
      supportingEvidence: formData.supportingEvidence,
      assignedTeacherId: 'tch-1',
      assignedTeacherName: formData.assignedTeacherName || 'Class Master',
      actionPlan: formData.actionPlan,
      reviewDate: formData.reviewDate || '2026-11-30',
      status: 'ACTIVE',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    setPlans((prev) => [newPlan, ...prev]);
    setIsModalOpen(false);
    setFormData({
      studentName: '',
      admissionNumber: '',
      className: 'Form 4 Science',
      subjectName: 'Basic Mathematics',
      concern: '',
      supportingEvidence: '',
      assignedTeacherName: '',
      actionPlan: '',
      reviewDate: '',
      notes: '',
    });
  };

  const togglePlanStatus = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus: InterventionStatus = p.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE';
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (classFilter !== 'ALL' && p.className !== classFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.studentName.toLowerCase().includes(q);
        const matchesAdm = p.admissionNumber.toLowerCase().includes(q);
        const matchesSubject = (p.subjectName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesAdm && !matchesSubject) return false;
      }
      return true;
    });
  }, [plans, statusFilter, classFilter, searchQuery]);

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === 'ACTIVE').length;
    const resolved = plans.filter((p) => p.status === 'RESOLVED').length;
    return {
      total: plans.length,
      active,
      resolved,
      resolutionRate: plans.length > 0 ? Math.round((resolved / plans.length) * 100) : 0,
    };
  }, [plans]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Student Support &amp; Academic Interventions</h1>
              <p className="text-xs text-slate-500">
                Track academic recovery plans, assign mentorship, and monitor student turnaround milestones.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            id="create-intervention-btn"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Improvement Plan
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Recovery Plans</option>
              <option value="RESOLVED">Resolved / Completed</option>
            </select>
          </div>

          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Classes</option>
              <option value="Form 4 Science">Form 4 Science</option>
              <option value="Form 3 Arts">Form 3 Arts</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Enrolled in Support</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-400">Identified via diagnostic analysis</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600 block">Active Improvement Plans</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.active}</span>
          <span className="text-[11px] text-slate-400">Currently receiving targeted remedial tutoring</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 block">Successfully Resolved</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.resolved}</span>
          <span className="text-[11px] text-slate-400">Reached passing academic threshold</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-indigo-600 block">Plan Resolution Rate</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">{stats.resolutionRate}%</span>
          <span className="text-[11px] text-slate-400">Turnaround effectiveness</span>
        </div>
      </div>

      {/* Plans List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Academic Improvement Plans</h2>
          <span className="text-xs text-slate-500">Showing {filteredPlans.length} plans</span>
        </div>

        {filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No improvement plans found.</p>
            <p className="mt-1">Create an improvement plan to initiate academic support for at-risk students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Student &amp; Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Identified Concern &amp; Evidence</th>
                  <th className="py-3 px-4">Assigned Mentor / Teacher</th>
                  <th className="py-3 px-4">Review Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{plan.studentName}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {plan.admissionNumber} • {plan.className}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">
                      {plan.subjectName || 'General'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-medium text-slate-800 block line-clamp-1">{plan.concern}</span>
                      <span className="text-[11px] text-slate-500 block line-clamp-1 italic">
                        {plan.supportingEvidence}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {plan.assignedTeacherName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {plan.reviewDate}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          plan.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {plan.status === 'RESOLVED' && <Check className="w-3 h-3 mr-1" />}
                        {plan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => togglePlanStatus(plan.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          plan.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {plan.status === 'ACTIVE' ? 'Resolve' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Academic Improvement Plan Details</h2>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Student</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedPlan.studentName} ({selectedPlan.admissionNumber})
                </span>
                <span className="text-slate-500 block">{selectedPlan.className}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Concern</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedPlan.concern}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Supporting Evidence</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                  {selectedPlan.supportingEvidence}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Remedial Action Plan</span>
                <p className="text-indigo-900 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100 font-medium">
                  {selectedPlan.actionPlan}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block">Assigned Mentor</span>
                  <span className="font-bold text-slate-900">{selectedPlan.assignedTeacherName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block">Review Date</span>
                  <span className="font-bold text-slate-900">{selectedPlan.reviewDate}</span>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">New Academic Improvement Plan</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kelvin Kimaro"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admission Number</label>
                  <input
                    type="text"
                    placeholder="SCH/2026/..."
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Area</label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Concern *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe academic lag, failed topics, or pattern of missed tests..."
                  value={formData.concern}
                  onChange={(e) => setFormData({ ...formData, concern: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supporting Evidence</label>
                <input
                  type="text"
                  placeholder="e.g. Scored 32% on Midterm Exam, missed 5 remedial sessions"
                  value={formData.supportingEvidence}
                  onChange={(e) => setFormData({ ...formData, supportingEvidence: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Plan &amp; Remediation *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed recovery actions, required frequency, and tutoring schedule..."
                  value={formData.actionPlan}
                  onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Teacher / Mentor</label>
                  <input
                    type="text"
                    list="teachers-datalist"
                    value={formData.assignedTeacherName}
                    onChange={(e) => setFormData({ ...formData, assignedTeacherName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="teachers-datalist">
                    {teachers.map((t) => (
                      <option key={t.id} value={`${t.firstName} ${t.lastName}`} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Review Date</label>
                  <input
                    type="date"
                    value={formData.reviewDate}
                    onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-plan-btn"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
