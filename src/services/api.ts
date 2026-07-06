/**
 * KB & Co API service — all communication with the FastAPI backend.
 * Base URL comes from VITE_API_URL env var (defaults to localhost:8000).
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Token management ──────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('kbco_access_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('kbco_access_token', access);
  localStorage.setItem('kbco_refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('kbco_access_token');
  localStorage.removeItem('kbco_refresh_token');
}

// ── Base fetch ────────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = opts;

  const finalHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Try to refresh on 401
  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      finalHeaders['Authorization'] = `Bearer ${getAccessToken()}`;
      const retry = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: finalHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (retry.ok) return retry.json() as Promise<T>;
    }
    clearTokens();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem('kbco_refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  name: string;
  plan: string;
  kyc_status: string;
}

export const authApi = {
  register: (email: string, password: string, name: string, phone?: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: { email, password, name, phone }, auth: false }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  googleUrl: () =>
    request<{ url: string }>('/auth/google/url', { auth: false }),

  googleCallback: (code: string) =>
    request<AuthResponse>('/auth/google', { method: 'POST', body: { code }, auth: false }),

  me: () =>
    request<AuthResponse>('/auth/me'),
};

// ── Stocks ────────────────────────────────────────────────────────────────────

export interface LiveStock {
  symbol: string;
  name: string;
  sector: string | null;
  price: number;
  prev_close: number | null;
  change: number;
  change_pct: number;
  volume: number;
  market_cap: number | null;
  pe_ratio: number | null;
  eps: number | null;
  dividend_yield: number | null;
  dividend_per_share: number | null;
  high_52w: number | null;
  low_52w: number | null;
  updated_at: string | null;
}

export const stocksApi = {
  list: (sector?: string) =>
    request<LiveStock[]>(`/stocks${sector ? `?sector=${encodeURIComponent(sector)}` : ''}`, { auth: false }),

  get: (symbol: string) =>
    request<LiveStock>(`/stocks/${symbol}`, { auth: false }),

  liveRefresh: () =>
    request<{ refreshed: number; stocks: LiveStock[] }>('/stocks/live'),

  gainers: (limit = 10) =>
    request<LiveStock[]>(`/stocks/gainers?limit=${limit}`, { auth: false }),

  losers: (limit = 10) =>
    request<LiveStock[]>(`/stocks/losers?limit=${limit}`, { auth: false }),

  summary: () =>
    request<{ asi_value: number | null; asi_change: number | null; asi_change_pct: number | null; advances: number; declines: number; unchanged: number; total_volume: number }>('/stocks/summary', { auth: false }),

  screener: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<LiveStock[]>(`/stocks/screener?${qs}`, { auth: false });
  },
};

// ── Portfolios ────────────────────────────────────────────────────────────────

export interface ApiHolding {
  id: string;
  symbol: string;
  shares: number;
  buy_price: number;
  buy_date: string;
  notes: string | null;
  created_at: string;
}

export interface ApiPortfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  holdings: ApiHolding[];
  created_at: string;
  updated_at: string | null;
}

export const portfolioApi = {
  list: () => request<ApiPortfolio[]>('/portfolios'),
  create: (name: string, description?: string) => request<ApiPortfolio>('/portfolios', { method: 'POST', body: { name, description } }),
  update: (id: string, name?: string, description?: string) => request<ApiPortfolio>(`/portfolios/${id}`, { method: 'PUT', body: { name, description } }),
  delete: (id: string) => request<void>(`/portfolios/${id}`, { method: 'DELETE' }),
  addHolding: (portfolioId: string, holding: { symbol: string; shares: number; buy_price: number; buy_date: string; notes?: string }) =>
    request<ApiHolding>(`/portfolios/${portfolioId}/holdings`, { method: 'POST', body: holding }),
  removeHolding: (portfolioId: string, holdingId: string) =>
    request<void>(`/portfolios/${portfolioId}/holdings/${holdingId}`, { method: 'DELETE' }),
};

// ── Watchlist ─────────────────────────────────────────────────────────────────

export const watchlistApi = {
  list: () => request<{ id: string; symbol: string; price_alert: number | null; added_at: string }[]>('/watchlist'),
  add: (symbol: string, price_alert?: number) => request<unknown>('/watchlist', { method: 'POST', body: { symbol, price_alert } }),
  remove: (symbol: string) => request<void>(`/watchlist/${symbol}`, { method: 'DELETE' }),
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentsApi = {
  plans: () => request<Record<string, unknown>>('/payments/plans', { auth: false }),
  initiate: (plan: string, billing_cycle: string) =>
    request<{ payment_link: string; tx_ref: string; amount: number; currency: string }>('/payments/initiate', { method: 'POST', body: { plan, billing_cycle } }),
  verify: (tx_ref: string, transaction_id: string) =>
    request<{ success: boolean; message: string; plan?: string }>('/payments/verify', { method: 'POST', body: { tx_ref, transaction_id } }),
  history: () => request<unknown[]>('/payments/history'),
  subscription: () => request<unknown>('/payments/subscription'),
};

// ── Alerts ────────────────────────────────────────────────────────────────────

export const alertsApi = {
  list: () => request<unknown[]>('/alerts'),
  create: (symbol: string, target_price: number, direction: 'above' | 'below', notify_email = true, notify_sms = false) =>
    request<unknown>('/alerts', { method: 'POST', body: { symbol, target_price, direction, notify_email, notify_sms } }),
  delete: (id: string) => request<void>(`/alerts/${id}`, { method: 'DELETE' }),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (unread_only = false) => request<unknown[]>(`/notifications?unread_only=${unread_only}`),
  markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request<void>('/notifications/read-all', { method: 'PUT' }),
  unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const exportsApi = {
  portfolioPdf: (portfolioId: string) => `${BASE_URL}/exports/portfolio/${portfolioId}/pdf`,
  portfolioExcel: (portfolioId: string) => `${BASE_URL}/exports/portfolio/${portfolioId}/excel`,
  stocksExcel: () => `${BASE_URL}/exports/stocks/excel`,

  downloadWithAuth: async (url: string, filename: string) => {
    const token = getAccessToken();
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  profile: () => request<unknown>('/users/profile'),
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
    request<unknown>('/users/profile', { method: 'PUT', body: data }),
  submitKYC: (data: {
    bvn?: string; nin?: string; address: string; city: string; state: string;
    bank_name: string; account_number: string; account_name: string; id_type: string; id_number: string;
  }) => request<unknown>('/users/kyc', { method: 'POST', body: data }),
  kycStatus: () => request<unknown>('/users/kyc'),
};

// ── Bonds / Fixed Income ──────────────────────────────────────────────────────

export const bondsApi = {
  offerings: () => request<unknown[]>('/bonds/offerings', { auth: false }),
  chart: () => request<unknown[]>('/bonds/chart', { auth: false }),
  history: (params: { tenor?: number; from_year?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.tenor) q.set('tenor', String(params.tenor));
    if (params.from_year) q.set('from_year', String(params.from_year));
    if (params.limit) q.set('limit', String(params.limit));
    return request<unknown[]>(`/bonds/history?${q}`, { auth: false });
  },
  trend: (tenor: number, from_year = 2015) =>
    request<unknown[]>(`/bonds/trend/${tenor}?from_year=${from_year}`, { auth: false }),
  calculate: (face_value: number, tenor: number, stop_rate: number) =>
    request<{ face_value: number; discount_amount: number; purchase_price: number; expected_return: number; interest_earned: number; effective_yield: number; annualised_rate: number }>(
      '/bonds/calculate', { method: 'POST', body: { face_value, tenor, stop_rate }, auth: false }
    ),
  purchase: (body: { instrument_id: string; tenor: number; stop_rate: number; maturity_date: string; auction_date: string; face_value: number }) =>
    request<unknown>('/bonds/purchase', { method: 'POST', body }),
  myPortfolio: (status?: string) =>
    request<unknown[]>(`/bonds/my-portfolio${status ? `?status=${status}` : ''}`),
};

// ── AI Chat ───────────────────────────────────────────────────────────────────

export const aiApi = {
  chat: (messages: { role: string; content: string }[]) =>
    request<{ content: string }>('/ai/chat', { method: 'POST', body: { messages }, auth: false }),
};

// ── SSE live price stream ─────────────────────────────────────────────────────

export function subscribeToPriceStream(onUpdate: (prices: { symbol: string; price: number; change: number; change_pct: number }[]) => void): () => void {
  const es = new EventSource(`${BASE_URL}/stocks/stream`);
  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
    } catch { /* ignore parse errors */ }
  };
  es.onerror = () => {
    es.close();
  };
  return () => es.close();
}
