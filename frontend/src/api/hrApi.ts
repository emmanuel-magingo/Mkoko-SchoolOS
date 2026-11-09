import { api } from './client';
import { UserRole } from '../types';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'VOLUNTEER';
export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'INACTIVE';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface StaffProfile {
  id: string;
  tenantId: string;
  userId?: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  nationalId?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  jobTitle: string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  academicDepartmentId?: string | null;
  academicDepartment?: {
    id: string;
    name: string;
    code: string;
  } | null;
  qualifications?: Array<{
    id: string;
    name: string;
    code: string;
    departmentId?: string | null;
  }>;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  terminationDate?: string | null;
  emergencyContact?: EmergencyContact | null;
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    academicDepartmentId?: string | null;
    academicDepartment?: {
      id: string;
      name: string;
      code: string;
    } | null;
    subjectQualifications?: Array<{
      subject: {
        id: string;
        name: string;
        code: string;
        departmentId?: string | null;
      };
    }>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PeopleDirectoryItem {
  id: string;
  staff: null | {
    id: string; employeeNumber: string; firstName: string; lastName: string; email?: string | null; phone?: string | null;
    jobTitle: string; departmentId?: string | null; department?: {id:string;name:string}|null;
    employmentType: EmploymentType; employmentStatus: EmploymentStatus;
  };
  user: null | {
    id: string; email: string; firstName: string; lastName: string; role: UserRole; isActive: boolean; lastActiveAt?: string | null;
    mustChangePassword: boolean; customRole?: {id:string;name:string;isActive:boolean}|null;
  };
}

export interface PeopleDirectoryResult {
  items: PeopleDirectoryItem[];
  facets: { departments: Array<{id:string;name:string}>; designations: string[]; roles: UserRole[] };
  page: number; limit: number; total: number; totalPages: number;
}

export type EmailDeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'DEFERRED';

export interface StaffActivityItem {
  id: string;
  timestamp: string;
  recipient: string;
  employeeNumber?: string | null;
  staffName?: string | null;
  eventType: string;
  status?: EmailDeliveryStatus;
  attemptCount: number;
  actor: string;
  actorRole: string | null;
  staffProfileId: string | null;
  userId: string | null;
  canResend: boolean;
  providerMessageId?: string | null;
  failureReason?: string | null;
}

export interface StaffManagementSummary {
  indicators?: {
    totalStaff: number;
    activeStaff: number;
    staffWithAccounts: number;
    pendingInvitations: number;
  };
  recentActivity?: StaffActivityItem[];
  staff: null | { total: number; active: number; inactive: number; onLeave:number; suspended:number; withAccounts: number; withoutAccounts: number; teachersWithoutAssignments: number | null };
  academic: null | { totalAssignments:number; teachersWithAssignments:number; workloads:Array<{staffProfileId:string;name:string;assignmentCount:number;subjectCount:number;classCount:number}> };
  accounts: null | { total: number; active: number; inactive: number; firstLoginPending: number; roleDistribution: Array<{role: UserRole;count:number}>; lastLogin: string | null; invitationStatusAvailable: boolean };
  activity: null | Array<{id:string;actor:string;role:string|null;action:string;entityType:string;createdAt:string}>;
}

export const peopleApi = {
  getSummary: () => api.get<StaffManagementSummary>('/staff/people/summary'),
  getPeople: (params: {search?:string;departmentId?:string;designation?:string;role?:string;employmentStatus?:string;accountStatus?:string;unlinkedUsersOnly?:boolean;page?:number;limit?:number}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key,value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
    return api.get<PeopleDirectoryResult>(`/staff/people?${query.toString()}`);
  },
};

export type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'EMERGENCY' | 'STUDY' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    department?: { name: string } | null;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: LeaveStatus;
  requestedAt: string;
  reviewedById?: string | null;
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  reviewedAt?: string | null;
  decisionNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DelegationStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface DelegatedAuthority {
  id: string;
  tenantId: string;
  delegatorId: string;
  delegator?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  delegateId: string;
  delegate?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  actingRole?: string | null;
  delegatedPermissions: string[];
  startDate: string;
  endDate: string;
  status: DelegationStatus;
  reason?: string | null;
  revokedAt?: string | null;
  revokedById?: string | null;
  revokedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export const staffApi = {
  getStaff: (params?: { page?: number; limit?: number; search?: string; departmentId?: string; status?: string; category?: 'ALL' | 'TEACHERS' | 'NON_TEACHING' }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.search) qs.append('search', params.search);
    if (params?.departmentId) qs.append('departmentId', params.departmentId);
    if (params?.status) qs.append('employmentStatus', params.status);
    if (params?.category) qs.append('category', params.category);
    const query = qs.toString();
    return api.get<{ items: StaffProfile[]; total: number; page: number; limit: number; totalPages: number }>(
      `/staff${query ? `?${query}` : ''}`
    );
  },

  getStaffById: (id: string) =>
    api.get<StaffProfile>(`/staff/${id}`),

  createStaff: (data: Partial<StaffProfile> & {
    category?: 'TEACHER' | 'STAFF';
    provisionAccount?: boolean;
    role?: UserRole;
    subjectIds?: string[];
    teachingAssignments?: Array<{ subjectId: string; classId: string; academicYearId?: string | null }>;
  }) =>
    api.post<StaffProfile & {
      temporaryPassword?: string;
      deliveryNotice?: string;
      accountProvisioned?: boolean;
      deliveryStatus?: EmailDeliveryStatus;
      providerMessageId?: string | null;
      failureReason?: string | null;
    }>('/staff', data),

  updateStaff: (id: string, data: Partial<StaffProfile>) =>
    api.patch<StaffProfile>(`/staff/${id}`, data),

  updateStaffStatus: (id: string, newStatus: EmploymentStatus, reason?: string) =>
    api.patch<StaffProfile>(`/staff/${id}/status`, { newStatus, reason }),

  resendInvitation: (id: string) =>
    api.post<{
      success: boolean;
      recipient: string;
      staffName?: string;
      employeeNumber?: string;
      temporaryPassword?: string;
      deliveryStatus?: EmailDeliveryStatus;
      attemptCount: number;
      message: string;
    }>(`/staff/${id}/resend-invitation`, {}),

  getStaffActivity: () =>
    api.get<StaffActivityItem[]>('/staff/people/activity'),

  getAcademicAssignments: (id: string) =>
    api.get<{
      staffProfileId: string;
      userId: string | null;
      hasAccount: boolean;
      academicDepartment: { id: string; name: string; code: string } | null;
      qualifications: Array<{ id: string; name: string; code: string; level: string }>;
      assignments: Array<{
        id: string;
        subject: { id: string; name: string; code: string; level: string };
        class: { id: string; name: string; level: string; stream: string };
        academicYear: { id: string; name: string; isActive: boolean };
      }>;
    }>(`/staff/${id}/academic-assignments`),

  assignAcademicWorkload: (id: string, data: { subjectId: string; classId: string; academicYearId?: string | null }) =>
    api.post(`/staff/${id}/academic-assignments`, data),

  removeAcademicWorkload: (id: string, assignmentId: string) =>
    api.delete(`/staff/${id}/academic-assignments/${assignmentId}`),
};

export const leaveApi = {
  getMyRequests: (params?: { status?: LeaveStatus; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    const query = qs.toString();
    return api.get<{ items: LeaveRequest[]; total: number; page: number; limit: number; totalPages: number }>(
      `/leave/my-requests${query ? `?${query}` : ''}`
    );
  },

  submitLeave: (data: { leaveType: LeaveType; startDate: string; endDate: string; reason?: string }) =>
    api.post<LeaveRequest>('/leave', data),

  getLeaveRequests: (params?: { status?: LeaveStatus; employeeId?: string; leaveType?: LeaveType; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.employeeId) qs.append('employeeId', params.employeeId);
    if (params?.leaveType) qs.append('leaveType', params.leaveType);
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    const query = qs.toString();
    return api.get<{ items: LeaveRequest[]; total: number; page: number; limit: number; totalPages: number }>(
      `/leave${query ? `?${query}` : ''}`
    );
  },

  approveLeave: (id: string, decisionNote?: string) =>
    api.post<LeaveRequest>(`/leave/${id}/approve`, { decisionNote }),

  rejectLeave: (id: string, decisionNote: string) =>
    api.post<LeaveRequest>(`/leave/${id}/reject`, { decisionNote }),

  cancelLeave: (id: string) =>
    api.post<LeaveRequest>(`/leave/${id}/cancel`),
};

export const delegationApi = {
  getDelegations: (params?: { status?: DelegationStatus; delegateId?: string; delegatorId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.delegateId) qs.append('delegateId', params.delegateId);
    if (params?.delegatorId) qs.append('delegatorId', params.delegatorId);
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    const query = qs.toString();
    return api.get<{ items: DelegatedAuthority[]; total: number; page: number; limit: number; totalPages: number }>(
      `/delegations${query ? `?${query}` : ''}`
    );
  },

  getMyActive: () =>
    api.get<DelegatedAuthority[]>('/delegations/my-active'),

  createDelegation: (data: {
    delegateId: string;
    actingRole?: string;
    delegatedPermissions: string[];
    startDate: string;
    endDate: string;
    reason?: string;
  }) => api.post<DelegatedAuthority>('/delegations', data),

  revokeDelegation: (id: string, reason?: string) =>
    api.post<DelegatedAuthority>(`/delegations/${id}/revoke`, { reason }),
};
