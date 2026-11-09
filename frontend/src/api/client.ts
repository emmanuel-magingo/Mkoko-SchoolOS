const API_BASE = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiValidationIssue {
  field: string;
  message: string;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly validationIssues: ApiValidationIssue[] = [],
    public readonly correlationId?: string,
    public readonly details?: unknown,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

class ApiClient {
  private readonly activityStorageKey = 'schoolos_last_user_activity';
  private readonly activityWindowMs = 60_000;
  private readonly activityReportStorageKey = 'schoolos_last_activity_report';
  private readonly activityReportIntervalMs = 60_000;

  constructor() {
    if (typeof window !== 'undefined') {
      for (const eventName of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
        window.addEventListener(eventName, () => {
          this.recordUserActivity();
          this.reportUserActivity();
        }, { passive: true });
      }
    }
  }

  private recordUserActivity(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.activityStorageKey, Date.now().toString());
    }
  }

  private hasRecentUserActivity(): boolean {
    if (typeof window === 'undefined') return false;
    const lastActivity = Number(localStorage.getItem(this.activityStorageKey));
    return Number.isFinite(lastActivity) && Date.now() - lastActivity <= this.activityWindowMs;
  }

  private reportUserActivity(): void {
    if (!this.getToken() || !this.hasRecentUserActivity()) return;
    const now = Date.now();
    const lastReport = Number(localStorage.getItem(this.activityReportStorageKey));
    if (Number.isFinite(lastReport) && now - lastReport < this.activityReportIntervalMs) return;

    localStorage.setItem(this.activityReportStorageKey, now.toString());
    void this.request('/auth/me').catch(() => {
      if (localStorage.getItem(this.activityReportStorageKey) === now.toString()) {
        localStorage.removeItem(this.activityReportStorageKey);
      }
      console.warn('Session activity could not be confirmed by the server.');
    });
  }

  private getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('schoolos_token');
  }

  public setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('schoolos_token', token);
    }
    this.recordUserActivity();
  }

  public clearToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('schoolos_token');
      localStorage.removeItem(this.activityStorageKey);
      localStorage.removeItem(this.activityReportStorageKey);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; meta?: Record<string, unknown> }> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (token && this.hasRecentUserActivity()) {
      headers['X-User-Activity'] = 'true';
      localStorage.setItem(this.activityReportStorageKey, Date.now().toString());
    }

    const cleanEndpoint = endpoint.startsWith('/api/')
      ? endpoint.slice(4)
      : endpoint === '/api'
      ? ''
      : endpoint;
    const url = `${API_BASE}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Unable to communicate with SchoolOS server' },
    }));

    if (!response.ok || !json.success) {
      if (response.status === 401) {
        this.clearToken();
        // Trigger auth event or redirect if on protected page
        if (!window.location.pathname.includes('/login')) {
          const isPlatform = window.location.pathname.startsWith('/platform');
          window.location.href = isPlatform ? '/platform/login?expired=true' : '/login?expired=true';
        }
      }

      const correlationId = response.headers.get('x-correlation-id') || (json as any)?.error?.correlationId;
      let message = json.error?.message;

      if (response.status >= 500) {
        // Generic server error ONLY for 5xx, with correlationId
        message = correlationId
          ? `Server error (Correlation ID: ${correlationId}). Check server logs.`
          : 'Server error. Check server logs.';
      } else {
        // 4xx: ALWAYS show the API's message
        if (!message || message === 'Internal server error' || message === 'Something went wrong') {
          switch (response.status) {
            case 401:
              message = 'Your session has expired. Please sign in again.';
              break;
            case 403:
              message = 'You do not have permission to perform this action.';
              break;
            case 404:
              message = 'Requested record was not found.';
              break;
            case 409:
              message = 'Record has changed or conflicts with another operation.';
              break;
            case 422:
              message = 'Validation error.';
              break;
            default:
              message = 'An unexpected error occurred.';
          }
        }
      }

      const validationIssues = json.error?.code === 'VALIDATION_ERROR' && Array.isArray(json.error.details)
        ? json.error.details.filter((issue): issue is ApiValidationIssue =>
          typeof issue === 'object' && issue !== null &&
          typeof (issue as ApiValidationIssue).field === 'string' &&
          typeof (issue as ApiValidationIssue).message === 'string')
        : [];

      throw new ApiRequestError(
        message,
        json.error?.code ?? 'REQUEST_FAILED',
        validationIssues,
        correlationId,
        json.error?.details,
        response.status
      );
    }

    return { data: json.data as T, meta: json.meta };
  }

  public async get<T>(endpoint: string): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /** Fetch a private binary resource with the same bearer token as API calls. */
  public async getBlob(endpoint: string): Promise<Blob> {
    const token = this.getToken();
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint === '/api' ? '' : endpoint;
    const url = `${API_BASE}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;
    const response = await fetch(url, { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        if (!window.location.pathname.includes('/login')) window.location.href = '/login?expired=true';
      }
      throw new ApiRequestError(response.status === 403 ? 'You do not have permission to view this file.' : 'Unable to load this private file.', 'PRIVATE_FILE_REQUEST_FAILED', [], response.headers.get('x-correlation-id') ?? undefined, undefined, response.status);
    }
    return response.blob();
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async upload<T>(endpoint: string, body: FormData): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  public async put<T>(endpoint: string, body?: unknown): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(endpoint: string, body?: unknown): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string, body?: unknown): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async postFormData<T>(endpoint: string, formData: FormData): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  public async downloadFile(endpoint: string, fallbackFilename = 'download.xlsx'): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const cleanEndpoint = endpoint.startsWith('/api/')
      ? endpoint.slice(4)
      : endpoint === '/api'
      ? ''
      : endpoint;
    const url = `${API_BASE}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new ApiRequestError(
        json.error?.message || 'Failed to download file',
        json.error?.code || 'DOWNLOAD_FAILED'
      );
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    let filename = fallbackFilename;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const api = new ApiClient();
