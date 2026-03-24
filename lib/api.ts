const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

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
    // Limpia tokens corruptos
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
    setTokens(data.token, data.refresh_token);
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

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
  },

  async delete<T>(path: string): Promise<T> {
    const res = await fetchWithAuth(`${API_BASE}${path}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
  },

  async getPublic<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data ?? json;
  },
};

export const authApi = {
  async register(name: string, email: string, password: string) {
    const res = await api.post<{ user: any; token: string; refresh_token: string }>('/auth/register', { name, email, password });
    setTokens(res.token, res.refresh_token);
    return res;
  },

  async login(email: string, password: string) {
    const res = await api.post<{ user: any; token: string; refresh_token: string; subscription: any }>('/auth/login', { email, password });
    setTokens(res.token, res.refresh_token);
    return res;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async me() {
    return api.get<{ user: any; subscription: any }>('/auth/me');
  },
};

export const plansApi = {
  async getPlans() {
    return api.get<{ plans: any[] }>('/plans');
  },
};

export const subscriptionApi = {
  async checkout(planId: string) {
    return api.post<{ url: string }>('/subscription/checkout', { plan_id: planId });
  },

  async getSubscription() {
    return api.get<{ subscription: any }>('/subscription');
  },

  async cancel() {
    return api.post<{ message: string }>('/subscription/cancel');
  },
};

export const linksApi = {
  async getLinks() {
    return api.get<{ links: any[]; usage: any }>('/links');
  },

  async createLink(name: string) {
    return api.post<{ id: string; name: string; token: string; url: string }>('/links', { name });
  },

  async getLink(id: string) {
    return api.get<any>(`/links/${id}`);
  },

  async updateLink(id: string, data: any) {
    return api.put<any>(`/links/${id}`, data);
  },

  async deleteLink(id: string) {
    return api.delete<{ message: string }>(`/links/${id}`);
  },

  async getViewer(token: string) {
    return api.getPublic<any>(`/viewer/${token}`);
  },
};
