import { handleDevPreviewRequest, isDevPreviewToken } from './devPreviewApi';

const RAW_BASE_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export const TOKEN_STORAGE_KEY = 'kwabo_token';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  data?: any;

  constructor(status: number, message: string, errors?: Record<string, string[]>, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  skipAuthRedirect?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function buildApiUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  const isFullUrl = /^https?:\/\//i.test(path);
  const normalizedPath = isFullUrl ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (!params) return normalizedPath;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  if (!query) return normalizedPath;
  return `${normalizedPath}${normalizedPath.includes('?') ? '&' : '?'}${query}`;
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers: customHeaders = {}, skipAuthRedirect = false } = options;

  const token = getToken();
  if (import.meta.env.DEV && isDevPreviewToken(token)) {
    return handleDevPreviewRequest(path, { method, body, params }, token) as Promise<T>;
  }
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = buildApiUrl(path, params);

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect) {
      setToken(null);
      unauthorizedHandler?.();
    }

    const defaultMsg =
      res.status === 401
        ? 'Session expirée. Veuillez vous reconnecter.'
        : res.status === 403
        ? 'Accès refusé.'
        : res.status === 404
        ? 'Ressource introuvable.'
        : res.status === 429
        ? 'Trop de tentatives. Veuillez patienter une minute avant de réessayer.'
        : `Erreur ${res.status}`;

    const message = data?.message && data.message !== 'Unauthenticated.' ? data.message : defaultMsg;
    throw new ApiError(res.status, message, data?.errors, data);
  }

  return data as T;
}

export async function fetchAuthenticatedBlob(pathOrUrl: string): Promise<{ blob: Blob; contentType: string; filename?: string }> {
  const token = getToken();
  const url = buildApiUrl(pathOrUrl);

  const headers: Record<string, string> = {
    Accept: 'application/json, */*',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (res.status === 401) {
    setToken(null);
    unauthorizedHandler?.();
    throw new ApiError(401, 'Session expirée. Veuillez vous reconnecter.');
  }
  if (!res.ok) {
    throw new ApiError(res.status, `Impossible de récupérer le fichier (Erreur ${res.status}).`);
  }

  const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  const filename = match ? decodeURIComponent(match[1]) : undefined;
  const blob = await res.blob();

  return { blob, contentType, filename };
}

export async function downloadAuthenticatedFile(pathOrUrl: string, fallbackFilename: string): Promise<void> {
  const { blob, filename } = await fetchAuthenticatedBlob(pathOrUrl);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename || fallbackFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}

export function getFirstValidationError(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (err instanceof ApiError && err.errors) {
    const firstKey = Object.keys(err.errors)[0];
    if (firstKey && err.errors[firstKey]?.length) {
      return err.errors[firstKey][0];
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export async function pingApi(): Promise<{ ok: boolean; message: string }> {
  const res = await api<{ message?: string }>('/ping', { skipAuthRedirect: true });
  return {
    ok: Boolean(res?.message),
    message: res?.message || 'API KWABO OK',
  };
}
