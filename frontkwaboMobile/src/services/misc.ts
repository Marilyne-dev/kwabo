import { api } from './api';
import { mapDocuments, mapInvoice, mapNotification } from './mappers';
import type { AppNotification, DocumentItem, InvoiceItem } from '@/data/mockData';

export async function fetchNotifications(): Promise<{ items: AppNotification[]; unreadTotal: number }> {
  const res = await api('/notifications');
  const items = (res.data ?? []).map(mapNotification);
  return { items, unreadTotal: Number(res.meta?.unread_total ?? items.filter((n: AppNotification) => !n.read).length) };
}
export const markNotificationRead = (id: string) => api(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => api('/notifications/read-all', { method: 'POST' });

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await api('/documents');
  return mapDocuments(res.data ?? []);
}

export interface InvoicesMeta { dueTotal: number; paidTotal: number; count: number }
export async function fetchInvoices(): Promise<{ items: InvoiceItem[]; meta: InvoicesMeta }> {
  const res = await api('/invoices');
  return {
    items: (res.data ?? []).map(mapInvoice),
    meta: { dueTotal: Number(res.meta?.due_total ?? 0), paidTotal: Number(res.meta?.paid_total ?? 0), count: Number(res.meta?.count ?? 0) },
  };
}
export const payInvoice = (id: string, method: 'card' | 'momo' | 'wise') =>
  api(`/invoices/${id}/pay`, { method: 'POST', body: { method } });

export interface ReferralData {
  code: string;
  share_text?: string;
  reward_per_referral?: number;
  stats: { referrals: number; active: number; rewards: number };
  referrals: Array<{ name: string; status: string; joined_at: string }>;
}
export async function fetchReferrals(): Promise<ReferralData> {
  const res = await api('/referrals');
  return res.data;
}
