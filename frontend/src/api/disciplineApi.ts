import { api } from './client';

export type IncidentCategory =
  | 'ABSENCE'
  | 'LATE_ARRIVAL'
  | 'FIGHTING'
  | 'BULLYING'
  | 'INSUBORDINATION'
  | 'ACADEMIC_MISCONDUCT'
  | 'DAMAGE_TO_PROPERTY'
  | 'UNIFORM_VIOLATION'
  | 'PROHIBITED_ITEM'
  | 'DISRUPTIVE_BEHAVIOR'
  | 'LEAVING_SCHOOL_WITHOUT_PERMISSION'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';

export type DisciplineActionType =
  | 'WARNING'
  | 'COUNSELING'
  | 'PARENT_MEETING'
  | 'DETENTION'
  | 'COMMUNITY_SERVICE'
  | 'SUSPENSION_RECOMMENDATION'
  | 'SUSPENSION'
  | 'OTHER';

export interface DisciplineAction {
  id: string;
  incidentId: string;
  actionType: DisciplineActionType;
  description?: string;
  actionDate: string;
  dueDate?: string;
  completedAt?: string;
  status: string;
  createdAt: string;
  assignedBy?: { id: string; firstName: string; lastName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}

export interface DisciplineNote {
  id: string;
  incidentId: string;
  note: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; role: string };
}

export interface DisciplineIncident {
  id: string;
  studentId: string;
  reportedById: string;
  incidentDate: string;
  incidentTime?: string;
  location?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  status: IncidentStatus;
  resolution?: string;
  resolvedById?: string;
  resolvedAt?: string;
  parentNotified: boolean;
  parentNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class?: { id: string; name: string };
  };
  reportedBy: { id: string; firstName: string; lastName: string; role: string };
  resolvedBy?: { id: string; firstName: string; lastName: string };
  actions?: DisciplineAction[];
  notes?: DisciplineNote[];
  _count?: { actions: number; notes: number };
}

export interface CreateIncidentDto {
  studentId: string;
  incidentDate: string;
  incidentTime?: string;
  location?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  parentNotified?: boolean;
}

export interface ReviewIncidentDto {
  reviewNote?: string;
}

export interface EscalateIncidentDto {
  reason: string;
}

export interface ResolveIncidentDto {
  resolution: string;
}

export interface CloseIncidentDto {
  finalRemarks?: string;
}

export interface CreateActionDto {
  actionType: DisciplineActionType;
  description?: string;
  assignedToId?: string;
  actionDate: string;
  dueDate?: string;
}

export interface CreateNoteDto {
  note: string;
}

export interface IncidentFilterParams {
  studentId?: string;
  classId?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedIncidents {
  data: DisciplineIncident[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DisciplineStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}

export const getIncidents = async (filters: IncidentFilterParams = {}): Promise<PaginatedIncidents> => {
  const params = new URLSearchParams();
  if (filters.studentId) params.append('studentId', filters.studentId);
  if (filters.classId) params.append('classId', filters.classId);
  if (filters.status) params.append('status', filters.status);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.category) params.append('category', filters.category);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await api.get<PaginatedIncidents>(`/discipline/incidents?${params.toString()}`);
  return response.data;
};

export const getIncidentById = async (id: string): Promise<DisciplineIncident> => {
  const response = await api.get<DisciplineIncident>(`/discipline/incidents/${id}`);
  return response.data;
};

export const createIncident = async (data: CreateIncidentDto): Promise<DisciplineIncident> => {
  const response = await api.post<DisciplineIncident>('/discipline/incidents', data);
  return response.data;
};

export const reviewIncident = async (id: string, data: ReviewIncidentDto = {}): Promise<DisciplineIncident> => {
  const response = await api.patch<DisciplineIncident>(`/discipline/incidents/${id}/review`, data);
  return response.data;
};

export const investigateIncident = async (id: string, data: { officerId?: string; notes?: string } = {}): Promise<DisciplineIncident> => {
  const response = await api.post<DisciplineIncident>(`/discipline/incidents/${id}/investigate`, data);
  return response.data;
};

export const referToCommittee = async (id: string, data: { committeeNotes: string }): Promise<DisciplineIncident> => {
  const response = await api.post<DisciplineIncident>(`/discipline/incidents/${id}/refer-committee`, data);
  return response.data;
};

export const escalateIncident = async (id: string, data: EscalateIncidentDto): Promise<DisciplineIncident> => {
  const response = await api.post<DisciplineIncident>(`/discipline/incidents/${id}/escalate`, data);
  return response.data;
};

export const resolveIncident = async (id: string, data: ResolveIncidentDto): Promise<DisciplineIncident> => {
  const response = await api.post<DisciplineIncident>(`/discipline/incidents/${id}/resolve`, data);
  return response.data;
};

export const closeIncident = async (id: string, data: CloseIncidentDto = {}): Promise<DisciplineIncident> => {
  const response = await api.post<DisciplineIncident>(`/discipline/incidents/${id}/close`, data);
  return response.data;
};

export const createAction = async (id: string, data: CreateActionDto): Promise<DisciplineAction> => {
  const response = await api.post<DisciplineAction>(`/discipline/incidents/${id}/actions`, data);
  return response.data;
};

export const getIncidentActions = async (id: string): Promise<DisciplineAction[]> => {
  const response = await api.get<DisciplineAction[]>(`/discipline/incidents/${id}/actions`);
  return response.data;
};

export const createNote = async (id: string, data: CreateNoteDto): Promise<DisciplineNote> => {
  const response = await api.post<DisciplineNote>(`/discipline/incidents/${id}/notes`, data);
  return response.data;
};

export const getIncidentNotes = async (id: string): Promise<DisciplineNote[]> => {
  const response = await api.get<DisciplineNote[]>(`/discipline/incidents/${id}/notes`);
  return response.data;
};

export const getDisciplineStats = async (): Promise<DisciplineStats> => {
  const response = await api.get<DisciplineStats>('/discipline/stats');
  return response.data;
};
