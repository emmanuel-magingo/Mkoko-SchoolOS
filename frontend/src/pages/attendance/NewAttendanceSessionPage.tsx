import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceApi } from '../../api/attendance';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { ArrowLeft, AlertCircle, CalendarPlus, Lock } from 'lucide-react';

export const NewAttendanceSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const [academicYearId, setAcademicYearId] = useState('');
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState('DAILY');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = (user?.role as string) || '';
  const isElevated =
    userRole === 'ADMIN' ||
    userRole === 'SCHOOL_ADMIN' ||
    userRole === 'HEADMASTER' ||
    userRole === 'ACADEMIC_MASTER' ||
    userRole === 'SENIOR_ACADEMIC_MASTER' ||
    hasPermission('attendance:manage' as any) ||
    hasPermission('academics:view' as any);

  const isClassTeacherOnly = user?.role === 'TEACHER' && !isElevated;

  useEffect(() => {
    attendanceApi.getAuthorizedClasses()
      .then((authorizedClasses) => {
        const availableClasses = Array.isArray(authorizedClasses) ? authorizedClasses : [];
        setClasses(availableClasses);
        if (availableClasses[0]) setClassId(availableClasses[0].id);
      })
      .catch((loadError: any) => {
        setClasses([]);
        setError(loadError?.response?.data?.error?.message || 'Unable to load your authorized classes.');
      });
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYearId || !termId || !classId || !date) {
      setError('Please fill in all fields (Academic Year ID, Term ID, Class, Date)');
      return;
    }

    try {
      setSaving(true);
      const res = await attendanceApi.createSession({
        academicYearId,
        termId,
        classId,
        date: new Date(date).toISOString(),
        sessionType,
      });
      navigate(`/attendance/${res.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create attendance session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5">
        <button
          onClick={() => navigate('/attendance')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarPlus className="w-6 h-6 text-indigo-600" />
            Start New Attendance Session
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Initialize a new roll-call session for an assigned class
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Academic Year ID
          </label>
          <input
            type="text"
            value={academicYearId}
            onChange={(e: any) => setAcademicYearId(e.target.value)}
            placeholder="e.g. UUID from current Academic Year"
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Term ID
          </label>
          <input
            type="text"
            value={termId}
            onChange={(e: any) => setTermId(e.target.value)}
            placeholder="e.g. UUID from current Term"
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Target Class</span>
            {isClassTeacherOnly && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3" /> Class Teacher Only
              </span>
            )}
          </label>
          <select
            id="class-select"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={isClassTeacherOnly && classes.length <= 1}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 disabled:opacity-85 disabled:cursor-not-allowed"
            required
          >
            {classes.length === 0 ? (
              <option value="">No classes available</option>
            ) : (
              classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
          {isClassTeacherOnly && (
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              Class locked to your assigned Form/Stream as Class Teacher.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Session Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e: any) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e: any) => setSessionType(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold"
            >
              <option value="DAILY">Daily Roll Call</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/attendance')}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            {saving ? 'Creating...' : 'Initialize Roll-Call'}
          </button>
        </div>
      </form>
    </div>
  );
};
