import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api/notifications';
import { Notification, NotificationType } from '../../types/notifications.types';
import { Bell, CheckCheck, Megaphone, BookOpen, Calendar, DollarSign, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | NotificationType>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const filters: any = { page, limit: 15 };
      if (activeTab === 'UNREAD') {
        filters.isRead = false;
      } else if (activeTab !== 'ALL') {
        filters.type = activeTab;
      }

      const res = await notificationsApi.getUserNotifications(filters);
      setNotifications(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (err) {
      console.error('Failed to fetch notifications page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, page]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-5 h-5 text-purple-600" />;
      case 'ACADEMIC':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'ATTENDANCE':
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case 'FINANCE':
        return <DollarSign className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            Notification Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with school announcements, academic alerts, attendance records, and fee reminders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {(['ALL', 'UNREAD', 'ANNOUNCEMENT', 'ACADEMIC', 'ATTENDANCE', 'FINANCE', 'SYSTEM'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab === 'ALL' ? 'All Notifications' : tab === 'UNREAD' ? 'Unread' : tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading notification inbox...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No notifications matching filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) handleMarkAsRead(item.id);
                  if (item.actionUrl) navigate(item.actionUrl);
                }}
                className={`p-4 cursor-pointer hover:bg-slate-50/80 transition-colors flex items-start gap-4 ${
                  !item.isRead ? 'bg-brand-50/20' : ''
                }`}
              >
                <div className="p-2.5 bg-slate-100 rounded-xl shrink-0">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm ${!item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {item.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">
                      {item.type}
                    </span>
                    {item.priority === 'URGENT' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700">
                        URGENT
                      </span>
                    )}
                    {item.priority === 'HIGH' && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-700">
                        HIGH
                      </span>
                    )}
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(item.id);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-semibold px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
