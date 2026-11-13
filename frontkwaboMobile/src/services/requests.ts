import { api } from './api';
import { mapRequest } from './mappers';
import type { RequestItem } from '@/data/mockData';

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

export interface NewRequestInput {
  service: string; // slug
  title: string;
  city: string;
  urgency: 'normal' | 'urgent';
  description: string;
  details: Record<string, string>;
  files?: Record<string, PickedFile>;
}

export async function fetchRequests(): Promise<RequestItem[]> {
  // Pagination par défaut du serveur (per_page peut être refusé en 422) : on lit toutes les pages.
  const out: RequestItem[] = [];
  let page = 1;
  let last = 1;
  do {
    const res = await api('/requests', { params: { page: page > 1 ? page : undefined } });
    out.push(...(res.data ?? []).map(mapRequest));
    last = Number(res.meta?.last_page ?? 1);
    page++;
  } while (page <= last && page <= 25);
  return out;
}

export async function fetchRequest(id: string): Promise<RequestItem> {
  const res = await api(`/requests/${id}`);
  return mapRequest(res.data);
}

export async function createRequest(input: NewRequestInput): Promise<RequestItem> {
  const { files, ...rest } = input;
  const hasFiles = files && Object.keys(files).length > 0;

  if (!hasFiles) {
    const res = await api('/requests', { method: 'POST', body: rest });
    return mapRequest(res.data);
  }

  // multipart : service, details[champ], files[champ]
  const fd = new FormData();
  fd.append('service', rest.service);
  fd.append('title', rest.title);
  fd.append('city', rest.city);
  fd.append('urgency', rest.urgency);
  fd.append('description', rest.description);
  Object.entries(rest.details).forEach(([k, v]) => fd.append(`details[${k}]`, v));
  Object.entries(files!).forEach(([k, f]) => fd.append(`files[${k}]`, f as any));
  const res = await api('/requests', { method: 'POST', body: fd });
  return mapRequest(res.data);
}

export async function cancelRequest(id: string) {
  return api(`/requests/${id}/cancel`, { method: 'POST' });
}

export async function fetchCounters(): Promise<{ unread_messages: number; unread_notifications: number; due_invoices?: number }> {
  return api('/counters');
}
