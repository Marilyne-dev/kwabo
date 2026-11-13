import { api, setToken } from './api';
import { mapUser } from './mappers';
import type { User } from '@/data/mockData';

export type LoginResult =
  | { status: 'ok'; user: User }
  | { status: 'needs_code' }
  | { status: 'needs_verification' };

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  sponsor_code?: string;
}

export async function login(email: string, password: string, code?: string): Promise<LoginResult> {
  try {
    const res = await api('/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password, code: code || undefined, device_name: 'mobile' },
      skipAuthRedirect: true,
    });
    if (res?.needs_code) return { status: 'needs_code' };
    await setToken(res.token);
    return { status: 'ok', user: mapUser(res.user) };
  } catch (e: any) {
    // 403 { needs_verification: true } : e-mail pas encore confirmé
    if (e?.status === 403 && e?.data?.needs_verification) return { status: 'needs_verification' };
    throw e;
  }
}

export async function register(payload: RegisterPayload) {
  return api('/register', {
    method: 'POST',
    body: { ...payload, email: payload.email.trim().toLowerCase() },
    skipAuthRedirect: true,
  });
}

export async function verifyEmail(email: string, code: string): Promise<User> {
  const res = await api('/email/verify', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), code },
    skipAuthRedirect: true,
  });
  await setToken(res.token);
  return mapUser(res.user);
}

export async function resendVerification(email: string) {
  return api('/email/resend', { method: 'POST', body: { email: email.trim().toLowerCase() }, skipAuthRedirect: true });
}

export async function fetchMe(): Promise<User> {
  const res = await api('/me');
  return mapUser(res.data);
}

export async function logoutRemote() {
  try { await api('/logout', { method: 'POST', skipAuthRedirect: true }); } catch {}
  await setToken(null);
}

export async function forgotPassword(email: string) {
  return api('/password/forgot', { method: 'POST', body: { email: email.trim().toLowerCase() }, skipAuthRedirect: true });
}
