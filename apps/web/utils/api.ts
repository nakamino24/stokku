// In production the API is served by the same Vercel deployment under /api,
// so we use a relative base. Locally, set NEXT_PUBLIC_API_URL to override.
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1`;

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    // Remove credentials left by earlier builds. Non-secret user display data may remain.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export function clearTokens() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(retryRotatedOnce = true): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (res.status === 409 && retryRotatedOnce) {
      // A different tab/request may have rotated the cookie milliseconds earlier.
      // Give the browser a moment to apply the winning Set-Cookie, then retry once.
      await new Promise((resolve) => setTimeout(resolve, 150));
      return performRefresh(false);
    }

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    if (!data.accessToken) {
      clearTokens();
      return false;
    }

    setAccessToken(data.accessToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function restoreSession(): Promise<boolean> {
  if (accessToken) return true;
  return refreshTokens();
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
    });
  } finally {
    clearTokens();
    if (typeof window !== 'undefined') localStorage.removeItem('user');
  }
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
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/validate-reset-token',
    '/auth/reset-password',
  ].includes(url);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && canAttemptRefresh(url)) {
    const refreshed = await refreshTokens();
    if (refreshed && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
      throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
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
