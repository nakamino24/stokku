// In production the API is served by the same Vercel deployment under /api,
// so we use a relative base. Locally, set NEXT_PUBLIC_API_URL to override
// (e.g. http://localhost:3001) — see next.config.mjs rewrites.
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1`;

function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
}

export function storeAccessToken(accessToken: string) {
  localStorage.setItem('accessToken', accessToken);
  // Cleanup legacy refresh-token storage from the previous auth flow.
  localStorage.removeItem('refreshToken');
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      if (!data.accessToken) {
        clearTokens();
        return false;
      }

      storeAccessToken(data.accessToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function canAttemptRefresh(url: string): boolean {
  return ![
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ].includes(url);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let accessToken = getStoredAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && canAttemptRefresh(url)) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      accessToken = getStoredAccessToken();
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
      throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data.error || `Request failed (${res.status})`,
      res.status,
      data.code,
    );
  }

  return data;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
