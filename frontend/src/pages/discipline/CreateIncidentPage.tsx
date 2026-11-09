import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { createIncident, IncidentCategory, IncidentSeverity } from '../../api/disciplineApi';
import { Student } from '../../types';

export const CreateIncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('DISRUPTIVE_BEHAVIOR');
  const [severity, setSeverity] = useState<IncidentSeverity>('LOW');
  const [description, setDescription] = useState('');
  const [parentNotified, setParentNotified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch students list for dropdown
    api.get<{ data?: Student[]; students?: Student[] } | Student[]>('/students?limit=100')
      .then((res: any) => {
        const list = res.data?.data || res.data?.students || (Array.isArray(res.data) ? res.data : []);
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }
    if (description.trim().length < 5) {
      setError('Description must be at least 5 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const incident = await createIncident({
        studentId: selectedStudentId,
        incidentDate,
        incidentTime: incidentTime || undefined,
        location: location || undefined,
        category,
        severity,
        description: description.trim(),
        parentNotified,
      });

      navigate(`/discipline/incidents/${incident.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to report discipline incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Record Disciplinary Incident</h1>
          <p className="text-sm text-slate-400">
            Document student behavioral infraction with authoritative audit and notification triggers.
          </p>
        </div>
        <button
          onClick={() => navigate('/discipline')}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-colors border border-slate-700"
        >
          ← Back to List
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm space-y-4">
        {/* Student Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Student *
          </label>
          {students.length > 0 ? (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} (#{s.admissionNumber})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Enter Student UUID"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Incident Date *
            </label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Incident Time (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 10:15 AM"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Location (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Science Laboratory, Main Playground, Hallway"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Category & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="DISRUPTIVE_BEHAVIOR">Disruptive Behavior</option>
              <option value="ABSENCE">Absence</option>
              <option value="LATE_ARRIVAL">Late Arrival</option>
              <option value="FIGHTING">Fighting</option>
              <option value="BULLYING">Bullying</option>
              <option value="INSUBORDINATION">Insubordination</option>
              <option value="ACADEMIC_MISCONDUCT">Academic Misconduct</option>
              <option value="DAMAGE_TO_PROPERTY">Damage to Property</option>
              <option value="UNIFORM_VIOLATION">Uniform Violation</option>
              <option value="PROHIBITED_ITEM">Prohibited Item</option>
              <option value="LEAVING_SCHOOL_WITHOUT_PERMISSION">Leaving Without Permission</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Severity Level *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="LOW">Low (Routine observation / warning)</option>
              <option value="MEDIUM">Medium (Requires Second Master review)</option>
              <option value="HIGH">High (Immediate executive escalation)</option>
              <option value="CRITICAL">Critical (Headmaster intervention)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Incident Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Provide factual details of the observed behavioral infraction, context, and immediate action taken..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Parent Notified Checkbox */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="parentNotified"
            checked={parentNotified}
            onChange={(e) => setParentNotified(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="parentNotified" className="text-xs text-slate-300 cursor-pointer select-none">
            Parent or guardian has already been notified of this incident
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/60">
          <button
            type="button"
            onClick={() => navigate('/discipline')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isSubmitting ? 'Recording Incident...' : 'Record Incident'}
          </button>
        </div>
      </form>
    </div>
  );
};
