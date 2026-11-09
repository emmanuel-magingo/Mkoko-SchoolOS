import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api/notifications';
import { Announcement, AnnouncementStatus } from '../../types/notifications.types';
import { Megaphone, Plus, Send, Archive, Eye, Users, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [platformBroadcasts, setPlatformBroadcasts] = useState<Array<{
    id: string;
    title: string;
    body: string;
    priority: string;
    publishedAt?: string;
    authorName?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'ALL'>('ALL');
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const canCreate = hasPermission(Permissions.SEND_NOTIFICATIONS);
  const canManage = hasPermission(Permissions.MANAGE_NOTIFICATIONS);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: 50 };
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }

      const [res, broadcastRes] = await Promise.all([
        notificationsApi.getAnnouncements(filters),
        import('../../api/client').then(({ api }) => api.get<any[]>('/notifications/platform-broadcasts').catch(() => ({ data: [] }))),
      ]);
      setAnnouncements(res.data);
      if (Array.isArray(broadcastRes.data)) {
        setPlatformBroadcasts(broadcastRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [statusFilter]);

  const handlePublish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to publish this announcement? This will send notifications to the target audience.')) {
      return;
    }

    try {
      await notificationsApi.publishAnnouncement(id);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to publish announcement');
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Archive this announcement?')) return;

    try {
      await notificationsApi.archiveAnnouncement(id);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to archive announcement');
    }
  };

  const getStatusBadge = (status: AnnouncementStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Published</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Draft</span>;
      case 'ARCHIVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">Archived</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600">{priority}</span>;
    }
  };

  const publishedCount = announcements.filter((a) => a.status === 'PUBLISHED').length;
  const draftCount = announcements.filter((a) => a.status === 'DRAFT').length;
  const archivedCount = announcements.filter((a) => a.status === 'ARCHIVED').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand-600" />
            School Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast official announcements to staff, teachers, classes, and administrative roles.
          </p>
        </div>

        {canCreate && (
          <button
            id="compose-announcement-btn"
            onClick={() => navigate('/notifications/announcements/create')}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Compose Announcement
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Published</p>
            <p className="text-lg font-bold text-slate-900">{publishedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Drafts</p>
            <p className="text-lg font-bold text-slate-900">{draftCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Archived</p>
            <p className="text-lg font-bold text-slate-900">{archivedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-2">
        {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Platform Broadcasts */}
      {platformBroadcasts.length > 0 && (
        <section aria-label="Platform Bulletins" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-sky-600" />
            Official Platform Bulletins
          </h2>
          <div className="space-y-2">
            {platformBroadcasts.map((b) => (
              <div key={b.id} className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Platform Broadcast</span>
                    <span className="text-xs font-semibold text-slate-700">{b.priority}</span>
                  </div>
                  {b.publishedAt && <span className="text-[11px] text-slate-500">{new Date(b.publishedAt).toLocaleDateString()}</span>}
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{b.title}</h3>
                <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap">{b.body}</p>
                <div className="mt-2 text-[11px] text-slate-500">Issued by: {b.authorName || 'Platform Administration'}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Announcements List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No announcements found for status "{statusFilter}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/notifications/announcements/${item.id}`)}
                className="p-5 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(item.status)}
                    {getPriorityBadge(item.priority)}
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                      <Users className="w-3 h-3 text-slate-500" />
                      Target: {item.targetType}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">{item.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.body}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Author: {item.author?.firstName} {item.author?.lastName} ({item.author?.role})</span>
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.publishedAt && (
                      <span className="text-emerald-600 font-medium">
                        Published: {new Date(item.publishedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/notifications/announcements/${item.id}`);
                    }}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>

                  {canCreate && item.status === 'DRAFT' && (
                    <button
                      onClick={(e) => handlePublish(item.id, e)}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  )}

                  {canManage && item.status !== 'ARCHIVED' && (
                    <button
                      onClick={(e) => handleArchive(item.id, e)}
                      className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-600 transition-colors"
                      title="Archive Announcement"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
