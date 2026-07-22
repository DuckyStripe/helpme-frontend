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
  async create(quantity?: number, sellerId?: string) {
    return api.post<any>('/tags', { quantity: quantity || 1, sellerId });
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

  async getScans(id: string) {
    return api.get<{ scans: any[] }>(`/tags/${id}/scans`);
  },

  async unlockPin(id: string) {
    return api.post<any>(`/tags/${id}/unlock-pin`);
  },
};

export const pinApi = {
  async setPin(uuid: string, pin: string) {
    return api.post<any>(`/tags/${uuid}/config/pin`, { pin });
  },

  async pinLogin(uuid: string, pin: string) {
    return api.post<{ token: string; status: string }>(`/tags/${uuid}/config/login`, { pin });
  },

  async updateMedicalData(token: string, medicalData: any, contacts: any[]) {
    const res = await fetch(`${API_BASE}/tags/config/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ medicalData, contacts }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
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
      sellersWithMetrics: any[];
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
};
