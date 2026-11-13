import { api } from './api';
import { mapUser } from './mappers';
import type { User } from '@/data/mockData';

export async function updateProfile(p: { first_name: string; last_name: string; phone: string; country: string }): Promise<User> {
  const res = await api('/profile', { method: 'PATCH', body: p });
  return mapUser(res.data);
}

export const changePassword = (current_password: string, password: string) =>
  api('/profile/password', { method: 'PUT', body: { current_password, password } });

export async function updateNotificationPrefs(prefs: Record<string, boolean>): Promise<User> {
  const res = await api('/profile/notifications', { method: 'PUT', body: { prefs } });
  return mapUser(res.data);
}

export const twoFactorSetup = (): Promise<{ secret: string; qr_svg?: string }> =>
  api('/two-factor/setup', { method: 'POST' });
export const twoFactorEnable = (code: string) => api('/two-factor/enable', { method: 'POST', body: { code } });
export const twoFactorDisable = (password: string) => api('/two-factor/disable', { method: 'POST', body: { password } });

export const deleteAccount = (password: string) => api('/account', { method: 'DELETE', body: { password } });

export const reviewRequest = (id: string, rating: number, comment?: string) =>
  api(`/requests/${id}/review`, { method: 'PUT', body: { rating, comment: comment || undefined } });
