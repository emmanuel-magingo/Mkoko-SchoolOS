import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Settings } from 'lucide-react';
import { createTimetablePeriod } from '../../api/timetableApi';
import { useNavigate } from 'react-router-dom';

export const ManageTimetablePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    termId: '',
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'MONDAY',
    startTime: '08:00',
    endTime: '08:40',
    room: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await createTimetablePeriod(formData);
      navigate('/timetable');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create period. Check for conflicts.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Manage Timetable"
        description="Schedule a new class period."
        icon={Settings}
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Term ID</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.termId}
                onChange={e => setFormData({ ...formData, termId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class ID</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.classId}
                onChange={e => setFormData({ ...formData, classId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject ID</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.subjectId}
                onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teacher ID</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.teacherId}
                onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
              <select
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.dayOfWeek}
                onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
              >
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.room}
                onChange={e => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time (HH:mm)</label>
              <input
                type="time"
                required
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time (HH:mm)</label>
              <input
                type="time"
                required
                className="w-full p-2 border border-slate-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDoublePeriod"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                checked={(formData as any).isDoublePeriod || false}
                onChange={e => setFormData({ ...formData, isDoublePeriod: e.target.checked } as any)}
              />
              <label htmlFor="isDoublePeriod" className="text-sm font-medium text-slate-700 cursor-pointer">
                Double Period Block (consecutive lesson without inter-period break)
              </label>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/timetable')}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 text-white rounded font-medium hover:bg-brand-600"
            >
              Save Period
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
