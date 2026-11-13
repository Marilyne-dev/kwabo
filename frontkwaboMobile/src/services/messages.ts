import { api } from './api';
import { mapMessage, mapThread } from './mappers';
import type { MessageItem, ThreadInfo } from '@/data/mockData';
import type { PickedFile } from './requests';

export async function fetchThreads(): Promise<{ threads: ThreadInfo[]; unreadTotal: number }> {
  const res = await api('/messages');
  return { threads: (res.data ?? []).map(mapThread), unreadTotal: Number(res.meta?.unread_total ?? 0) };
}

export async function fetchMessages(requestId: string): Promise<MessageItem[]> {
  const res = await api(`/requests/${requestId}/messages`);
  return (res.data ?? []).map((m: any) => mapMessage(m, requestId));
}

export async function sendMessage(requestId: string, text: string, file?: PickedFile): Promise<MessageItem> {
  let res;
  if (file) {
    const fd = new FormData();
    fd.append('text', text || file.name);
    fd.append('attachment', file as any);
    res = await api(`/requests/${requestId}/messages`, { method: 'POST', body: fd });
  } else {
    res = await api(`/requests/${requestId}/messages`, { method: 'POST', body: { text } });
  }
  return mapMessage(res.data ?? res, requestId);
}

export async function markRead(requestId: string) {
  return api(`/requests/${requestId}/messages/read`, { method: 'POST' });
}
