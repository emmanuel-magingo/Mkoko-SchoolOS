import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api/notifications';
import { AnnouncementPriority, TargetType } from '../../types/notifications.types';
import { Megaphone, ArrowLeft, Send, Save, AlertCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export const CreateAnnouncementPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [targetType, setTargetType] = useState<TargetType>('ALL');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available classes for class-based targeting
    const fetchClasses = async () => {
      try {
        const res = await api.get<{ id: string; name: string }[]>('/api/classes');
        setClassesList(res.data || []);
      } catch (err) {
        console.error('Failed to load classes for targeting:', err);
      }
    };
    fetchClasses();
  }, []);

  const handleRoleToggle = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleClassToggle = (classId: string) => {
    setTargetClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmit = async (publishImmediately: boolean) => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message body are required.');
      return;
    }

    setLoading(true);
    setPublishing(publishImmediately);
    setError(null);

    try {
      const payload: any = {
        title,
        body,
        priority,
        targetType,
      };

      if (targetType === 'ROLES') {
        payload.targetRoles = targetRoles;
      } else if (targetType === 'CLASSES') {
        payload.targetClassIds = targetClassIds;
      }

      // Create draft announcement
      const announcement = await notificationsApi.createAnnouncement(payload);

      if (publishImmediately) {
        await notificationsApi.publishAnnouncement(announcement.id);
      }

      navigate('/notifications/announcements');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/notifications/announcements')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-600" />
              Compose Announcement
            </h1>
            <p className="text-xs text-slate-500">Draft or publish a school-wide or targeted message.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-2 space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End of Term Staff Meeting & Exam Preparation"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <div className="flex items-center gap-2">
              {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    priority === p
                      ? p === 'URGENT'
                        ? 'bg-red-600 text-white border-red-600'
                        : p === 'HIGH'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full announcement details here..."
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Right Target Selection */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Target Audience
            </h3>

            <div className="space-y-2">
              {[
                { id: 'ALL', label: 'School-Wide (Entire Tenant)' },
                { id: 'ROLES', label: 'Specific Roles' },
                { id: 'CLASSES', label: 'Specific Classes' },
              ].map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer text-xs transition-colors ${
                    targetType === t.id
                      ? 'bg-brand-50 border-brand-300 font-semibold text-brand-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === t.id}
                    onChange={() => setTargetType(t.id as TargetType)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>

            {/* Roles Selection */}
            {targetType === 'ROLES' && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-semibold text-slate-500">Select Target Roles:</p>
                {['SCHOOL_ADMIN', 'HEADMASTER', 'TEACHER', 'BURSAR', 'STAFF'].map((role) => (
                  <label key={role} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Classes Selection */}
            {targetType === 'CLASSES' && (
              <div className="pt-2 border-t border-slate-100 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-[11px] font-semibold text-slate-500">Select Target Classes:</p>
                {classesList.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes found.</p>
                ) : (
                  classesList.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetClassIds.includes(cls.id)}
                        onChange={() => handleClassToggle(cls.id)}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span>{cls.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <button
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="w-full py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish Immediately'}
            </button>

            <button
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
