export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TargetType = 'ALL' | 'ROLES' | 'CLASSES' | 'USERS';
export type NotificationType = 'ANNOUNCEMENT' | 'ACADEMIC' | 'ATTENDANCE' | 'FINANCE' | 'SYSTEM';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface AnnouncementTarget {
  id: string;
  announcementId: string;
  targetRole?: string | null;
  targetClassId?: string | null;
  targetUserId?: string | null;
  targetClass?: { id: string; name: string } | null;
  targetUser?: { id: string; firstName: string; lastName: string } | null;
}

export interface Announcement {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetType: TargetType;
  authorId: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  targets?: AnnouncementTarget[];
  publishedAt?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  recipientId: string;
  announcementId?: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  announcement?: {
    id: string;
    title: string;
    priority: AnnouncementPriority;
    status: AnnouncementStatus;
  } | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  priority?: AnnouncementPriority;
  targetType?: TargetType;
  expiresAt?: string | null;
  targetRoles?: string[];
  targetClassIds?: string[];
  targetUserIds?: string[];
}

export interface UpdateAnnouncementPayload {
  title?: string;
  body?: string;
  priority?: AnnouncementPriority;
  targetType?: TargetType;
  expiresAt?: string | null;
  targetRoles?: string[];
  targetClassIds?: string[];
  targetUserIds?: string[];
}
