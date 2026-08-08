/**
 * api/client.ts
 * Central HTTP client for all backend API calls.
 * Automatically attaches JWT Bearer token to every request.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('accessToken');
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  // Build query string if params provided
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) searchParams.set(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const token = getToken();
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };
  if (token) {
    mergedHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
  });

  // Auto-logout on 401
  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    window.location.href = '#/login';
    throw new Error('Unauthorized — session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error?.message || `Request failed: ${response.status}`);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, params?: RequestOptions['params']) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
