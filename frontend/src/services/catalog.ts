import { api } from './api';
import { mapServiceItem } from './mappers';
import { Service } from '../types';

export async function fetchServiceBySlug(slug: string): Promise<Service | null> {
  if (!slug) return null;
  const res = await api<any>(`/services/${encodeURIComponent(slug)}`, { skipAuthRedirect: true });
  const raw = res?.data ?? res;
  if (!raw || typeof raw !== 'object') return null;
  return mapServiceItem(raw);
}

