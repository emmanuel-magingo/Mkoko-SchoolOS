import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications';
import { Announcement } from '../../types/notifications.types';
import { Megaphone, ArrowLeft, Send, Archive, Users, Calendar, User } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';

export const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const canPublish = hasPermission(Permissions.SEND_NOTIFICATIONS);
  const canArchive = hasPermission(Permissions.MANAGE_NOTIFICATIONS);

  const fetchAnnouncement = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await notificationsApi.getAnnouncementById(id);
      setAnnouncement(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch announcement details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const handlePublish = async () => {
    if (!id) return;
    if (!window.confirm('Publish announcement now? This will issue notifications to all target recipients.')) return;

    try {
      await notificationsApi.publishAnnouncement(id);
      fetchAnnouncement();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to publish announcement');
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    if (!window.confirm('Archive announcement?')) return;

    try {
      await notificationsApi.archiveAnnouncement(id);
      fetchAnnouncement();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to archive announcement');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading announcement details...</div>;
  }

  if (error || !announcement) {
    return (
      <div className="p-12 text-center text-red-500 text-sm">
        {error || 'Announcement not found'}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
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
              Announcement Details
            </h1>
            <p className="text-xs text-slate-500">ID: {announcement.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canPublish && announcement.status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Publish Now
            </button>
          )}

          {canArchive && announcement.status !== 'ARCHIVED' && (
            <button
              onClick={handleArchive}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Archive className="w-4 h-4 text-slate-500" />
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Meta badges */}
        <div className="flex items-center gap-3 flex-wrap border-b border-slate-100 pb-4">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full ${
              announcement.status === 'PUBLISHED'
                ? 'bg-emerald-100 text-emerald-800'
                : announcement.status === 'DRAFT'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {announcement.status}
          </span>

          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              announcement.priority === 'URGENT'
                ? 'bg-red-100 text-red-700'
                : announcement.priority === 'HIGH'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {announcement.priority} Priority
          </span>

          <span className="text-xs text-slate-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Target: {announcement.targetType}
          </span>
        </div>

        {/* Title & Body */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-snug">{announcement.title}</h2>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {announcement.body}
          </div>
        </div>

        {/* Author & Timestamps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>
              Author:{' '}
              <strong className="text-slate-800">
                {announcement.author?.firstName} {announcement.author?.lastName}
              </strong>{' '}
              ({announcement.author?.role})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Created: {new Date(announcement.createdAt).toLocaleString()}</span>
          </div>

          {announcement.publishedAt && (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Published: {new Date(announcement.publishedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
