import { api } from './client';
import {
  Announcement,
  Notification,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
  AnnouncementStatus,
  AnnouncementPriority,
  TargetType,
  NotificationType,
  NotificationPriority,
} from '../types/notifications.types';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AnnouncementFilters {
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  targetType?: TargetType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
}

export const buildQuery = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
};

export const notificationsApi = {
  // Announcements
  getAnnouncements: async (filters: AnnouncementFilters = {}): Promise<PaginatedResponse<Announcement>> => {
    const res = await api.get<Announcement[]>(`/api/notifications/announcements${buildQuery(filters)}`);
    return {
      data: res.data,
      meta: (res.meta as any) || { total: res.data.length, page: 1, limit: 20, totalPages: 1 },
    };
  },

  getAnnouncementById: async (id: string): Promise<Announcement> => {
    const res = await api.get<Announcement>(`/api/notifications/announcements/${id}`);
    return res.data;
  },

  createAnnouncement: async (payload: CreateAnnouncementPayload): Promise<Announcement> => {
    const res = await api.post<Announcement>('/api/notifications/announcements', payload);
    return res.data;
  },

  updateAnnouncement: async (id: string, payload: UpdateAnnouncementPayload): Promise<Announcement> => {
    const res = await api.patch<Announcement>(`/api/notifications/announcements/${id}`, payload);
    return res.data;
  },

  publishAnnouncement: async (id: string): Promise<Announcement> => {
    const res = await api.post<Announcement>(`/api/notifications/announcements/${id}/publish`);
    return res.data;
  },

  archiveAnnouncement: async (id: string): Promise<Announcement> => {
    const res = await api.post<Announcement>(`/api/notifications/announcements/${id}/archive`);
    return res.data;
  },

  // User Notifications
  getUserNotifications: async (filters: NotificationFilters = {}): Promise<PaginatedResponse<Notification>> => {
    const res = await api.get<Notification[]>(`/api/notifications${buildQuery(filters)}`);
    return {
      data: res.data,
      meta: (res.meta as any) || { total: res.data.length, page: 1, limit: 20, totalPages: 1 },
    };
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const res = await api.get<{ unreadCount: number }>('/api/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const res = await api.patch<Notification>(`/api/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ updatedCount: number }> => {
    const res = await api.patch<{ updatedCount: number }>('/api/notifications/read-all');
    return res.data;
  },
};
