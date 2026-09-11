// Browser uses same-origin /api/v1 proxied by Vercel to Render (API_ORIGIN server-only).
// NEXT_PUBLIC_API_URL is retained only as an optional dev/test override.
const API_BASE =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : '/api/v1';
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
const REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  init.signal?.addEventListener('abort', abort, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abort);
  }
}

async function parseResponse(res: Response): Promise<{ body: unknown; text: string }> {
  const text = await res.text();
  if (!text) return { body: undefined, text: '' };

  if ((res.headers.get('content-type') || '').includes('application/json')) {
    try {
      return { body: JSON.parse(text), text };
    } catch {
      return { body: undefined, text };
    }
  }
  return { body: text, text };
}

function responseMessage(status: number, body: unknown, text: string): string {
  if (status === 502 || status === 503 || status === 504) {
    return 'The service is temporarily unavailable. Please try again.';
  }
  if (status >= 500) return 'The server could not complete this request.';
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  if (typeof body === 'string' && !/<(?:html|body|head)\b/i.test(body)) return body;
  if (text && !/<(?:html|body|head)\b/i.test(text)) return text;
  return `Request failed (${status})`;
}

function responseCode(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'code' in body && typeof body.code === 'string') {
    return body.code;
  }
  return undefined;
}

async function performRefresh(retryRotatedOnce = true): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
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

    const { body } = await parseResponse(res);
    const data = body && typeof body === 'object' && 'accessToken' in body ? body : null;
    if (!data || typeof data.accessToken !== 'string' || !data.accessToken) {
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
    await fetchWithTimeout(`${API_BASE}/auth/logout`, {
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
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    throw new ApiError(
      timedOut ? 'The request timed out. Please try again.' : 'Unable to connect to the API. Please try again.',
      0,
      timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
    );
  }

  if (res.status === 401 && canAttemptRefresh(url)) {
    const refreshed = await refreshTokens();
    if (refreshed && accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
      try {
        res = await fetchWithTimeout(`${API_BASE}${url}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      } catch (error) {
        const timedOut = error instanceof DOMException && error.name === 'AbortError';
        throw new ApiError(
          timedOut ? 'The request timed out. Please try again.' : 'Unable to connect to the API. Please try again.',
          0,
          timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
        );
      }
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

  const { body, text } = await parseResponse(res);
  if (!res.ok) {
    throw new ApiError(responseMessage(res.status, body, text), res.status, responseCode(body));
  }

  return body as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown, headers?: HeadersInit) => request<T>(url, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body), headers }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
