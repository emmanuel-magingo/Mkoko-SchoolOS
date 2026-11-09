import { api } from './client';

export interface SchoolSettings {
  id: string;
  tenantId: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  website: string | null;
  motto: string | null;
  principalName: string | null;
  registrationNum: string | null;
  establishedYear: number | null;
  createdAt: string;
  updatedAt: string;
  name: string;
  logoUrl: string | null;
}

export type SchoolColors = { primary: string; secondary: string; accent: string; sidebar: string; surface: string; background: string; text: string };
export interface BrandingRecords {
  assets: Array<{id:string;kind:string;fileName:string;mimeType:string;byteSize:number;active:boolean;createdAt:string;updatedAt:string}>;
  signatures: Array<{id:string;staffProfileId:string;displayName:string;designation:string;active:boolean;validFrom:string|null;validUntil:string|null;asset:{id:string;active:boolean};staffProfile:{id:string;firstName:string;lastName:string;jobTitle:string}}>;
  templates: Array<{id:string;documentType:string;title:string;configuration:Record<string,unknown>;signatorySlots:Array<{designation:string;required:boolean;enabled?:boolean;staffProfileId?:string|null}>}>;
}

export type EventType = 'HOLIDAY' | 'EXAM' | 'MEETING' | 'SPORTS' | 'OTHER';

export interface CalendarEvent {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  type: EventType;
  isHoliday: boolean;
  createdAt: string;
  updatedAt: string;
}

export const administrationApi = {
  getBranding: () => api.get<{ branding: SchoolColors | null }>('/administration/branding').then((res) => res.data.branding),
  updateBranding: (data: SchoolColors | { reset: true }) => api.patch<{ branding: SchoolColors | null }>('/administration/branding', data).then((res) => res.data.branding),
  getBrandingRecords: () => api.get<BrandingRecords>('/administration/branding/records').then((res) => res.data),
  getBrandingDocumentTypes: () => api.get<Array<{ documentType: string; title: string }>>('/administration/branding/document-types').then((res) => res.data),
  uploadBrandingAsset: (file: File, kind: 'LOGO' | 'STAMP' | 'SIGNATURE') => { const body = new FormData(); body.append('kind', kind); body.append('file', file); return api.upload('/administration/branding/assets', body).then((res) => res.data); },
  setBrandingAssetActive: (id: string, active: boolean) => api.patch(`/administration/branding/assets/${id}`, { active }),
  saveBrandingSignature: (data: {staffProfileId:string;assetId:string;displayName:string;designation:string;active:boolean;validFrom?:string|null;validUntil?:string|null}) => api.put('/administration/branding/signatures', data),
  setBrandingSignatureActive: (id:string,active:boolean) => api.patch(`/administration/branding/signatures/${id}`,{active}),
  saveDocumentTemplate: (data: {documentType:string;title:string;configuration:Record<string,unknown>;signatorySlots:Array<{designation:string;required:boolean;enabled?:boolean;staffProfileId?:string|null}>}) => api.put('/administration/branding/templates', data),
  listUsers: () => api.get<{users:Array<{id:string;firstName:string;lastName:string;staffProfile?:{id:string;jobTitle:string}|null}>}>('/administration/users?page=1&limit=200').then((res) => res.data.users),
  listBrandingStaff: () => api.get<Array<{id:string;firstName:string;lastName:string;jobTitle:string}>>('/administration/branding/staff').then((res) => res.data),
  // Settings
  getSchoolSettings: () =>
    api.get<SchoolSettings>('/administration/settings').then((res) => res.data),

  updateSchoolSettings: (data: Partial<SchoolSettings>) =>
    api.put<SchoolSettings>('/administration/settings', data).then((res) => res.data),

  // Calendar
  listCalendarEvents: (params?: { startDate?: string; endDate?: string }) => {
    let url = '/administration/calendar-events';
    if (params) {
      const qs = new URLSearchParams();
      if (params.startDate) qs.append('startDate', params.startDate);
      if (params.endDate) qs.append('endDate', params.endDate);
      const qString = qs.toString();
      if (qString) url += `?${qString}`;
    }
    return api.get<CalendarEvent[]>(url).then((res) => res.data);
  },

  createCalendarEvent: (data: Partial<CalendarEvent>) =>
    api.post<CalendarEvent>('/administration/calendar-events', data).then((res) => res.data),

  updateCalendarEvent: (id: string, data: Partial<CalendarEvent>) =>
    api.put<CalendarEvent>(`/administration/calendar-events/${id}`, data).then((res) => res.data),

  deleteCalendarEvent: (id: string) =>
    api.delete(`/administration/calendar-events/${id}`),
};
