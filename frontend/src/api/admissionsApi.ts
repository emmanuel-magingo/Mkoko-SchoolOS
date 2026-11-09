import { api } from './client';

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  previousSchool?: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  guardianEmail?: string | null;
  appliedClassId?: string | null;
  appliedClass?: { name: string };
  academicYearId: string;
  academicYear?: { name: string };
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  submissionDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdmissionApplicationInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  previousSchool?: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  guardianEmail?: string | null;
  appliedClassId?: string | null;
  academicYearId: string;
}

export interface AcceptApplicationInput {
  admissionNumber: string;
}

export const getApplications = async (params?: Record<string, any>) => {
  const query = params ? new URLSearchParams(params as any).toString() : '';
  const endpoint = query ? `/api/admissions/applications?${query}` : '/api/admissions/applications';
  const response = await api.get<{ applications: AdmissionApplication[], total: number, page: number, limit: number }>(endpoint);
  return response.data; // This returns { applications, total, page, limit }
};

export const getApplicationById = async (id: string) => {
  const response = await api.get<AdmissionApplication>(`/api/admissions/applications/${id}`);
  return response.data;
};

export const createApplication = async (data: CreateAdmissionApplicationInput) => {
  const response = await api.post<AdmissionApplication>('/api/admissions/applications', data);
  return response.data;
};

export const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
  const response = await api.patch<AdmissionApplication>(`/api/admissions/applications/${id}/status`, { status, notes });
  return response.data;
};

export const acceptApplication = async (id: string, data: AcceptApplicationInput) => {
  const response = await api.post<any>(`/api/admissions/applications/${id}/accept`, data);
  return response.data;
};
