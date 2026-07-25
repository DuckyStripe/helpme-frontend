const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://apihelpme.codelabs.com.mx/';

type TokenPair = {
  token: string;
  refreshToken: string;
};

let tokens: TokenPair | null = null;

export const setTokens = (token: string, refreshToken: string) => {
  tokens = { token, refreshToken };
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  }
};

const isValidToken = (t: string | null): t is string =>
  !!t && t !== 'undefined' && t !== 'null' && t.length > 10;

export const getTokens = (): TokenPair | null => {
  if (tokens) return tokens;
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (isValidToken(token) && isValidToken(refreshToken)) {
      tokens = { token, refreshToken };
      return tokens;
    }
    if (token || refreshToken) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }
  return null;
};

export const clearTokens = () => {
  tokens = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
};

export const isAuthenticated = () => !!getTokens();

async function refreshAccessToken(): Promise<boolean> {
  const currentTokens = getTokens();
  if (!currentTokens?.refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: currentTokens.refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh failed');

    const data = await res.json();
    setTokens(data.data.token, data.data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const currentTokens = getTokens();
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
  };

  if (currentTokens?.token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${currentTokens.token}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && currentTokens?.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newTokens = getTokens();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newTokens?.token}`;
      res = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return res;
}

function extractData<T>(res: Response, json: any): T {
  if (!res.ok) throw new Error(json.error?.message || 'Request failed');
  return json.data ?? json;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`);
    const json = await res.json();
    return extractData<T>(res, json);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return extractData<T>(res, json);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return extractData<T>(res, json);
  },

  async delete<T>(path: string): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return extractData<T>(res, json);
  },

  async getPublic<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    const json = await res.json();
    return extractData<T>(res, json);
  },
};

export const authApi = {
  async register(name: string, email: string, password: string) {
    return api.post<{ user: any; token: string; refresh_token: string }>('/auth/register', { name, email, password });
  },

  async login(email: string, password: string) {
    return api.post<{ user: any; token: string; refresh_token: string }>('/auth/login', { email, password });
  },

  async logout() {
    try {
      const currentTokens = getTokens();
      if (currentTokens?.refreshToken) {
        await api.post('/auth/logout', { refresh_token: currentTokens.refreshToken });
      }
    } catch {
      // Ignorar errores del servidor
    } finally {
      clearTokens();
    }
  },

  async me() {
    return api.get<{ user: any }>('/auth/me');
  },
};

export const tagsApi = {
  async create(quantity?: number, sellerId?: string, plan?: string, ownerPhone?: string) {
    return api.post<any>('/tags', { quantity: quantity || 1, sellerId, plan, ownerPhone });
  },

  async sendInstructions(tagId: string, phone: string) {
    return api.post<any>(`/tags/${tagId}/send-instructions`, { phone });
  },

  async assign(tagId: string, sellerId: string) {
    return api.post<any>(`/tags/${tagId}/assign`, { sellerId });
  },

  async bulkAssign(tagIds: string[], sellerId: string) {
    return api.post<any>('/tags/bulk/assign', { tagIds, sellerId });
  },

  async bulkSuspend(tagIds: string[]) {
    return api.post<any>('/tags/bulk/suspend', { tagIds });
  },

  async list(params?: {
    status?: string;
    sellerId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.sellerId) qs.set('sellerId', params.sellerId);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return api.get<{ tags: any[]; counts: Record<string, number>; total: number; page: number; limit: number; totalPages: number }>(`/tags${query ? `?${query}` : ''}`);
  },

  async get(id: string) {
    return api.get<any>(`/tags/${id}`);
  },

  async suspend(id: string) {
    return api.delete<any>(`/tags/${id}`);
  },

  async resume(id: string) {
    return api.post<any>(`/tags/${id}/resume`);
  },

  async bulkResume(tagIds: string[]) {
    return api.post<any>('/tags/bulk/resume', { tagIds });
  },

  async getViewer(uuid: string) {
    return api.getPublic<any>(`/tags/${uuid}/view`);
  },

  async getQrViewer(uuid: string) {
    return api.getPublic<any>(`/tags/${uuid}/qr-view`);
  },

  async sendQrAlert(uuid: string, location: { lat: number; lng: number; address?: string }, rescuerPhone?: string, rescuerComment?: string) {
    return api.post<{
      success: boolean;
      results: { contactName: string; success: boolean; locationSent: boolean; error?: string }[];
    }>(`/tags/${uuid}/qr-alert`, { location, rescuerPhone, rescuerComment });
  },

  async sendAlert(uuid: string, contactId: string, location: { lat: number; lng: number; address?: string }, rescuerPhone?: string, rescuerComment?: string) {
    return api.post<{ success: boolean; contactName: string; locationSent: boolean; locationWarning?: string }>(
      `/tags/${uuid}/alert`,
      { contactId, location, rescuerPhone, rescuerComment }
    );
  },

  async sendAlertToAll(uuid: string, location: { lat: number; lng: number; address?: string }, rescuerPhone?: string, rescuerComment?: string) {
    return api.post<{
      success: boolean;
      results: { contactName: string; success: boolean; locationSent: boolean; error?: string }[];
    }>(`/tags/${uuid}/alert-all`, { location, rescuerPhone, rescuerComment });
  },

  async getScans(id: string) {
    return api.get<{ scans: any[] }>(`/tags/${id}/scans`);
  },

  async getAlerts(id: string) {
    return api.get<{ alerts: any[] }>(`/tags/${id}/alerts`);
  },

  async unlockPin(id: string) {
    return api.post<any>(`/tags/${id}/unlock-pin`);
  },

  async validateUnlockCode(uuid: string, code: string) {
    return api.post<any>(`/tags/${uuid}/unlock`, { code });
  },

  async renewPlan(tagId: string, plan: string) {
    return api.post<any>(`/tags/${tagId}/renew`, { plan });
  },
};

export const pinApi = {
  async setPin(uuid: string, pin: string) {
    return api.post<any>(`/tags/${uuid}/config/pin`, { pin });
  },

  async pinLogin(uuid: string, pin: string) {
    return api.post<{ token: string; status: string }>(`/tags/${uuid}/config/login`, { pin });
  },

  async getConfigData(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/config/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
  },

  async verifyContact(token: string, phone: string, ownerName?: string) {
    const res = await fetch(`${API_BASE}/tags/config/contacts/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone, ownerName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { success: boolean; error?: string };
  },

  async resendContactVerification(token: string, contactId: string, phone: string, ownerName?: string) {
    const res = await fetch(`${API_BASE}/tags/config/contacts/${contactId}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone, ownerName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { success: boolean; error?: string };
  },

  async updateMedicalData(
    token: string,
    medicalData: any,
    contacts: any[],
    consent: { isMinor: boolean; consentAccepted: boolean },
    vehicles?: any[]
  ) {
    const res = await fetch(`${API_BASE}/tags/config/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ medicalData, contacts, vehicles, ...consent }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
  },

  async downloadCardImage(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/config/card-image`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error?.message || 'No se pudo generar la imagen');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ficha-medica-helpme.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  async toggleUserDisabled(uuid: string, token: string, disabled: boolean) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/config/disable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ disabled }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { userDisabled: boolean };
  },

  async validateUnlockCode(uuid: string, code: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { success: boolean };
  },

  async changePin(uuid: string, token: string, currentPin: string, newPin: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/config/pin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPin, newPin }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { success: boolean };
  },

  async getOwnerScans(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/owner/scans`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { scans: any[] };
  },

  async getOwnerAlerts(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/owner/alerts`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { alerts: any[] };
  },

  async startRoute(uuid: string, token: string, origin: string, destination: string, estimatedMinutes: number, bufferMinutes?: number) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/route/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ origin, destination, estimatedMinutes, bufferMinutes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data;
  },

  async confirmRoute(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/route/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { success: boolean };
  },

  async cancelRoute(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/route/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { success: boolean };
  },

  async getActiveRoute(uuid: string, token: string) {
    const res = await fetch(`${API_BASE}/tags/${uuid}/route/active`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data as { activeRoute: any | null };
  },
};

export const settingsApi = {
  async getOpenwa() {
    return api.get<{ baseUrl: string; sessionId: string; hasApiKey: boolean; updatedAt: string | null }>('/settings/openwa');
  },

  async updateOpenwa(data: { baseUrl?: string; sessionId?: string; apiKey?: string }) {
    return api.put<{ baseUrl: string; sessionId: string; hasApiKey: boolean; updatedAt: string | null }>('/settings/openwa', data);
  },

  async testOpenwa() {
    return api.post<{ ok: boolean; message: string; status?: string }>('/settings/openwa/test', {});
  },
};

export const usersApi = {
  async create(name: string, email: string, password: string) {
    return api.post<any>('/users', { name, email, password });
  },

  async list() {
    return api.get<{ sellers: any[] }>('/users');
  },

  async get(id: string) {
    return api.get<any>(`/users/${id}`);
  },

  async update(id: string, data: { name?: string; email?: string }) {
    return api.put<any>(`/users/${id}`, data);
  },

  async resetPassword(id: string, password: string) {
    return api.post<any>(`/users/${id}/reset-password`, { password });
  },

  async remove(id: string) {
    return api.delete<any>(`/users/${id}`);
  },
};

export const adminsApi = {
  async list() {
    return api.get<{ admins: any[] }>('/users/admins');
  },

  async create(name: string, email: string, password: string) {
    return api.post<any>('/users/admins', { name, email, password });
  },

  async update(id: string, data: { name?: string; email?: string }) {
    return api.put<any>(`/users/admins/${id}`, data);
  },

  async remove(id: string) {
    return api.delete<any>(`/users/admins/${id}`);
  },
};

export const metricsApi = {
  async get(period: '7d' | '30d' | '90d' = '7d') {
    return api.get<{
      totalTags: number;
      statusCounts: Record<string, number>;
      totalSellers: number;
      totalScans: number;
      recentScans: any[];
      recentActivations: any[];
      activationSeries: Array<{ date: string; count: number }>;
      scanSeries: Array<{ date: string; count: number }>;
      sellersWithMetrics: any[];
      funnel: {
        virginToIncompleteRate: number;
        incompleteToActiveRate: number;
        overallActivationRate: number;
        avgActivationDays: number | null;
      };
      sellerRanking: any[];
      inactiveSellers: Array<{ id: string; name: string; lastTagCreatedAt: string | null }>;
      newSellersInPeriod: number;
      scansByLocation: Array<{ city: string | null; country: string | null; count: number }>;
      topScannedTags: Array<{ tagUuid: string; sellerName: string; scanCount: number }>;
      security: { lockedTags: number; disabledTags: number; unverifiedContacts: number };
    }>(`/metrics?period=${period}`);
  },
};

export const scanApi = {
  async registerScan(uuid: string, data: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    userAgent?: string;
  }) {
    try {
      await fetch(`${API_BASE}/tags/${uuid}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Silencioso
    }
  },

  async registerQrScan(uuid: string, data: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    userAgent?: string;
  }) {
    try {
      await fetch(`${API_BASE}/tags/${uuid}/qr-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Silencioso
    }
  },
};

export const insurersApi = {
  async listActive() {
    return api.getPublic<any[]>('/insurers');
  },
  async listAll() {
    return api.get<{ insurers: any[] }>('/insurers/all');
  },
  async create(data: { name: string; phone: string; sortOrder?: number }) {
    return api.post<any>('/insurers', data);
  },
  async update(id: string, data: { name?: string; phone?: string; active?: boolean; sortOrder?: number }) {
    return api.put<any>(`/insurers/${id}`, data);
  },
  async toggleActive(id: string) {
    return api.post<any>(`/insurers/${id}/toggle`);
  },
  async remove(id: string) {
    return api.delete<any>(`/insurers/${id}`);
  },
};
