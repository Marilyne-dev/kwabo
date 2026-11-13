import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://kwabo.alwaysdata.net/api').replace(/\/+$/, '');
const TOKEN_KEY = 'kwabo_token';
const TIMEOUT_MS = 20000;

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
  /** true : un 401 ne déconnecte pas (ex. /login, /email/verify) */
  skipAuthRedirect?: boolean;
}

/* ---------- Token (SecureStore sur mobile, localStorage sur web) ---------- */
let memoryToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getToken() {
  return memoryToken;
}

export async function loadToken(): Promise<string | null> {
  try {
    memoryToken =
      Platform.OS === 'web'
        ? localStorage.getItem(TOKEN_KEY)
        : await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export async function setToken(token: string | null) {
  memoryToken = token;
  try {
    if (Platform.OS === 'web') {
      token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
    } else if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {}
}

/* ---------- Requêtes ---------- */
export function buildApiUrl(path: string, params?: ApiOptions['params']) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v));
  });
  const q = search.toString();
  return q ? `${url}${url.includes('?') ? '&' : '?'}${q}` : url;
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers: custom = {}, skipAuthRedirect = false } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json', ...custom };

  if (memoryToken && !headers.Authorization) headers.Authorization = `Bearer ${memoryToken}`;
  if (body !== undefined && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(buildApiUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion.');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect) {
      await setToken(null);
      unauthorizedHandler?.();
    }
    const fallback =
      res.status === 401 ? 'Session expirée. Veuillez vous reconnecter.'
      : res.status === 403 ? 'Accès refusé.'
      : res.status === 404 ? 'Ressource introuvable.'
      : res.status === 429 ? 'Trop de tentatives. Patientez une minute.'
      : `Erreur ${res.status}`;
    const message = data?.message && data.message !== 'Unauthenticated.' ? data.message : fallback;
    throw new ApiError(res.status, message, data?.errors, data);
  }

  return data as T;
}

export function getFirstValidationError(err: unknown, fallback = 'Une erreur est survenue.') {
  if (err instanceof ApiError && err.errors) {
    const key = Object.keys(err.errors)[0];
    if (key && err.errors[key]?.length) return err.errors[key][0];
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function pingApi() {
  const res = await api<{ message?: string }>('/ping', { skipAuthRedirect: true });
  return res?.message || 'API KWABO OK';
}
