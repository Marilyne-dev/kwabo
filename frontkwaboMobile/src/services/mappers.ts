import type { User } from '@/data/mockData';

/** Réponse Laravel (snake_case) -> objet du front mobile. */
export function mapUser(u: any): User {
  return {
    id: String(u.id),
    role: String(u.role || 'user').toUpperCase() as User['role'],
    firstName: u.first_name ?? '',
    lastName: u.last_name ?? '',
    email: u.email ?? '',
    country: u.country ?? '',
    phone: u.phone ?? '',
    referralCode: u.referral_code ?? '',
    emailVerified: !!u.email_verified,
    twoFactorEnabled: !!u.two_factor_enabled,
    notificationPrefs: u.notification_prefs ?? undefined,
  };
}

/* ---------- Catalogue ---------- */
import type { ServiceItem, FormField } from '@/data/services';
import { SERVICES as LOCAL_SERVICES } from '@/data/services';
import { CATEGORIES } from '@/data/categories';
import type { RequestItem } from '@/data/mockData';

const normOption = (o: any): string => (typeof o === 'string' ? o : String(o?.label ?? o?.value ?? ''));

export function mapService(s: any, categorySlug?: string): ServiceItem {
  const local = LOCAL_SERVICES.find((l) => l.id === s.slug);
  const catOk = CATEGORIES.some((c) => c.id === categorySlug);
  return {
    id: s.slug,
    cat: (catOk ? categorySlug : local?.cat) as ServiceItem['cat'],
    name: s.name,
    // les icônes de l'API ne sont pas forcément des noms Ionicons : on garde l'icône locale si elle existe
    icon: local?.icon ?? 'help-circle',
    popular: !!s.popular,
    available: s.available !== false,
    price: s.price_label ?? local?.price ?? '',
    short: s.short ?? '',
    included: Array.isArray(s.included) ? s.included : [],
    fields: (s.form_fields ?? []).map((f: any): FormField => ({
      name: f.name,
      label: f.label,
      placeholder: f.placeholder,
      required: !!f.required,
      type: f.type,
      options: Array.isArray(f.options) ? f.options.map(normOption) : undefined,
    })),
  };
}

/* ---------- Demandes ---------- */
export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function mapRequest(r: any): RequestItem {
  const details: Record<string, string> = {};
  Object.entries(r.details ?? {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') details[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
  });
  return {
    id: String(r.id),
    tracking: r.tracking ?? '',
    userId: '',
    serviceId: r.service?.slug ?? '',
    status: r.status,
    title: r.title ?? r.service?.name ?? 'Demande',
    city: r.city ?? '',
    urgency: r.urgency === 'urgent' ? 'urgent' : 'normal',
    budget: r.budget != null && r.budget !== '' ? `${r.budget} €` : r.service?.price_label ?? '',
    description: r.description ?? '',
    details,
    quote: r.quote ? { amount: Number(r.quote.amount), label: r.quote.label ?? '' } : null,
    createdAt: formatDate(r.created_at),
    history: (r.history ?? []).map((h: any) => ({ at: formatDate(h.at), text: h.text })),
    operatorName: r.operator?.full_name ?? r.operator?.name ?? undefined,
    review: r.review ? { rating: Number(r.review.rating), comment: r.review.comment ?? undefined, status: r.review.status } : r.rating ? { rating: Number(r.rating) } : null,
  };
}

/* ---------- Messages, notifications, documents, factures ---------- */
import type { MessageItem, AppNotification, DocumentItem, InvoiceItem, ThreadInfo } from '@/data/mockData';

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

export function mapMessage(m: any, requestId: string): MessageItem {
  const att = m.attachment;
  return {
    id: String(m.id),
    requestId,
    sender: m.from === 'team' ? 'kwabo' : 'client',
    senderName: m.author ?? (m.from === 'team' ? 'Équipe KWABO' : 'Moi'),
    text: att ? `[Document joint] : ${att.name}` : m.text ?? '',
    time: formatDateTime(m.at),
    attachmentPath: att ? `/messages/${m.id}/attachment` : undefined,
  };
}

export function mapThread(t: any): ThreadInfo {
  const last = t.last_message;
  const isObj = last && typeof last === 'object';
  return {
    requestId: String(t.request_id),
    lastText: isObj ? last.text ?? (last.attachment ? 'Pièce jointe' : '') : last ?? '',
    lastAuthor: isObj ? last.author ?? '' : '',
    lastAt: isObj ? formatDateTime(last.at) : '',
    unread: Number(t.unread ?? 0),
  };
}

function notifType(text: string): AppNotification['type'] {
  const t = text.toLowerCase();
  if (t.includes('paiement') || t.includes('payé') || t.includes('facture')) return 'payment';
  if (t.includes('rapport') || t.includes('document')) return 'report';
  if (t.includes('devis')) return 'quote';
  if (t.includes('terminé')) return 'done';
  if (t.includes('démarr') || t.includes('en cours')) return 'started';
  return 'info';
}

export function mapNotification(n: any): AppNotification {
  const text: string = n.text ?? '';
  const m = String(n.link ?? '').match(/requests\/(\d+)/);
  return {
    id: String(n.id),
    userId: '',
    requestId: m ? m[1] : undefined,
    title: text,
    message: '',
    date: formatDateTime(n.at),
    read: !!n.read,
    type: notifType(text),
  };
}

export function mapDocuments(groups: any[]): DocumentItem[] {
  const out: DocumentItem[] = [];
  (groups ?? []).forEach((g) => {
    const requestId = String(g.request?.id ?? '');
    (g.documents ?? []).forEach((d: any) =>
      out.push({
        id: String(d.id),
        requestId,
        type: d.type,
        name: d.name,
        date: formatDate(d.created_at),
        downloadPath: `/documents/${d.id}/download`,
      })
    );
  });
  return out;
}

export function mapInvoice(i: any): InvoiceItem {
  return {
    id: String(i.id),
    number: i.number ?? '',
    label: i.label ?? '',
    amount: Number(i.amount),
    status: i.status,
    method: i.method ?? undefined,
    createdAt: formatDate(i.created_at),
    paidAt: i.paid_at ? formatDate(i.paid_at) : undefined,
    requestId: String(i.request?.id ?? ''),
    tracking: i.request?.tracking ?? '',
    title: i.request?.title ?? i.label ?? '',
  };
}
