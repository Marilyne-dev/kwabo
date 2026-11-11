import { CATEGORIES, SERVICES } from '../data/kwaboData';
import {
  AuditItem,
  Category,
  Counters,
  DocumentItem,
  InvoiceItem,
  MessageItem,
  NotificationItem,
  RequestItem,
  ReviewItem,
  Service,
  User,
  UserRole,
} from '../types';

export function mapRole(rawRole?: string): UserRole {
  const r = String(rawRole || 'user').toLowerCase();
  if (r === 'admin') return 'ADMIN';
  if (r === 'operator') return 'OPERATOR';
  return 'USER';
}

export function mapUser(raw: any): User {
  const firstName = raw?.first_name ?? raw?.firstName ?? '';
  const lastName = raw?.last_name ?? raw?.lastName ?? '';
  const fullName = raw?.full_name ?? raw?.fullName ?? `${firstName} ${lastName}`.trim();

  return {
    id: String(raw?.id ?? ''),
    role: mapRole(raw?.role),
    firstName,
    lastName,
    fullName,
    email: raw?.email ?? '',
    country: raw?.country ?? '',
    phone: raw?.phone ?? '',
    verified: Boolean(raw?.email_verified ?? raw?.verified ?? (raw?.state ? raw.state !== 'unverified' : true)),
    twoFactor: Boolean(raw?.two_factor_enabled ?? raw?.twoFactor ?? false),
    prefs: raw?.notification_prefs ?? raw?.prefs ?? {
      received: true,
      quote: true,
      started: true,
      report: true,
      done: true,
      payment: true,
    },
    referralCode: raw?.referral_code ?? raw?.referralCode ?? '',
    createdAt: raw?.created_at ?? raw?.createdAt ?? new Date().toISOString(),
    suspended: Boolean(raw?.suspended ?? raw?.state === 'suspended'),
    requestsCount: raw?.requests_count ?? raw?.requestsCount,
    paidTotal: raw?.paid_total !== undefined ? Number(raw.paid_total) : raw?.paidTotal,
    activeMissionsCount: raw?.active_missions_count ?? raw?.activeMissionsCount,
    totalMissionsCount: raw?.total_missions_count ?? raw?.totalMissionsCount,
  };
}

export function mapCatalog(rawCategories: any[]): { categories: Category[]; services: Service[] } {
  const categories: Category[] = [];
  const services: Service[] = [];

  for (const cat of rawCategories || []) {
    const slug = cat.slug ?? cat.id;
    const oldCat = CATEGORIES.find(c => c.id === slug);
    categories.push({
      id: slug,
      slug,
      name: cat.name ?? oldCat?.name ?? slug,
      short: cat.short ?? oldCat?.short ?? cat.name ?? slug,
      icon: cat.icon ?? oldCat?.icon ?? 'squares-2x2',
      blurb: cat.blurb ?? oldCat?.blurb ?? '',
      photo: cat.photo ?? oldCat?.photo ?? '/assets/photos/chantier-tour-500.jpg',
    });

    for (const s of cat.services || []) {
      const sSlug = s.slug ?? String(s.id);
      const oldSrv = SERVICES.find(x => x.id === sSlug);
      services.push({
        id: sSlug,
        numericId: s.id,
        slug: sSlug,
        cat: slug,
        name: s.name ?? oldSrv?.name ?? sSlug,
        icon: s.icon ?? oldSrv?.icon ?? 'sparkles',
        popular: Boolean(s.popular),
        available: s.available !== undefined ? Boolean(s.available) : true,
        price: s.price_label ?? s.price ?? oldSrv?.price ?? '',
        short: s.short ?? oldSrv?.short ?? '',
        desc: s.desc ?? s.short ?? oldSrv?.desc,
        included: Array.isArray(s.included) ? s.included : oldSrv?.included ?? [],
        fields: Array.isArray(s.form_fields) ? s.form_fields : Array.isArray(s.fields) ? s.fields : oldSrv?.fields ?? [],
        photo: s.photo || oldSrv?.photo || '/assets/photos/chantier-500.jpg',
        requestsCount: s.requests_count ?? s.requestsCount,
      });
    }
  }

  return { categories, services };
}

export function mapServiceItem(s: any, fallbackCat?: string): Service {
  const sSlug = s.slug ?? String(s.id);
  const oldSrv = SERVICES.find(x => x.id === sSlug);
  const catSlug = s.category?.slug ?? s.category_slug ?? s.cat ?? fallbackCat ?? oldSrv?.cat ?? 'immobilier';

  return {
    id: sSlug,
    numericId: s.id,
    slug: sSlug,
    cat: catSlug,
    name: s.name ?? oldSrv?.name ?? sSlug,
    icon: s.icon ?? oldSrv?.icon ?? 'sparkles',
    popular: Boolean(s.popular),
    available: s.available !== undefined ? Boolean(s.available) : true,
    price: s.price_label ?? s.price ?? oldSrv?.price ?? '',
    short: s.short ?? oldSrv?.short ?? '',
    desc: s.desc ?? s.short ?? oldSrv?.desc,
    included: Array.isArray(s.included) ? s.included : oldSrv?.included ?? [],
    fields: Array.isArray(s.form_fields) ? s.form_fields : Array.isArray(s.fields) ? s.fields : oldSrv?.fields ?? [],
    photo: s.photo || oldSrv?.photo || '/assets/photos/chantier-500.jpg',
    requestsCount: s.requests_count ?? s.requestsCount,
  };
}

export function mapDocument(raw: any, fallbackRequestId?: string): DocumentItem {
  const id = String(raw?.id ?? '');
  return {
    id,
    requestId: String(raw?.request_id ?? raw?.requestId ?? fallbackRequestId ?? ''),
    type: raw?.type ?? 'report',
    name: raw?.name ?? 'Document',
    createdAt: raw?.created_at ?? raw?.createdAt ?? new Date().toISOString(),
    photoName: raw?.photoName,
    url: raw?.url || (id ? `/documents/${id}/download` : undefined),
  };
}

export function mapInvoice(raw: any, fallbackRequestId?: string): InvoiceItem {
  const id = String(raw?.id ?? '');
  const reqObj = raw?.request && typeof raw.request === 'object' ? raw.request : null;
  const userObj = raw?.user && typeof raw.user === 'object' ? raw.user : raw?.client;

  return {
    id,
    number: raw?.number ?? id,
    requestId: String(raw?.request_id ?? raw?.requestId ?? reqObj?.id ?? fallbackRequestId ?? ''),
    userId: String(raw?.user_id ?? raw?.userId ?? userObj?.id ?? ''),
    clientName:
      raw?.client_name ??
      (userObj ? `${userObj.first_name ?? userObj.firstName ?? ''} ${userObj.last_name ?? userObj.lastName ?? ''}`.trim() : undefined),
    client: userObj && typeof userObj === 'object' ? mapUser(userObj) : null,
    label: raw?.label ?? '',
    amount: Number(raw?.amount ?? 0),
    status: raw?.status ?? 'due',
    method: raw?.method ?? null,
    createdAt: raw?.created_at ?? raw?.createdAt ?? new Date().toISOString(),
    paidAt: raw?.paid_at ?? raw?.paidAt ?? null,
    request: reqObj
      ? {
          id: String(reqObj.id),
          tracking: reqObj.tracking ?? '',
          title: reqObj.title ?? '',
        }
      : null,
  };
}

export function mapMessage(raw: any, fallbackRequestId?: string): MessageItem {
  const id = String(raw?.id ?? '');
  let attachment: MessageItem['attachment'] = null;
  if (raw?.attachment) {
    if (typeof raw.attachment === 'string') {
      attachment = {
        name: raw.attachment,
        url: `/messages/${id}/attachment`,
      };
    } else if (typeof raw.attachment === 'object') {
      attachment = {
        name: raw.attachment.name ?? 'Pièce jointe',
        url: raw.attachment.url || `/messages/${id}/attachment`,
      };
    }
  }

  return {
    id,
    requestId: String(raw?.request_id ?? raw?.requestId ?? fallbackRequestId ?? ''),
    from: raw?.from === 'team' ? 'team' : 'client',
    author: raw?.author ?? (raw?.from === 'team' ? 'Équipe KWABO' : 'Client'),
    text: raw?.text ?? '',
    at: raw?.at ?? raw?.created_at ?? new Date().toISOString(),
    read: Boolean(raw?.read),
    attachment,
  };
}

export function mapReview(raw: any): ReviewItem {
  const clientObj = raw?.client ?? raw?.user;
  const reqObj = raw?.request;
  return {
    id: String(raw?.id ?? ''),
    requestId: String(raw?.request_id ?? raw?.requestId ?? reqObj?.id ?? ''),
    requestTitle: raw?.request_title ?? reqObj?.title,
    request: reqObj && typeof reqObj === 'object'
      ? {
          id: String(reqObj.id),
          tracking: reqObj.tracking ?? '',
          title: reqObj.title ?? '',
        }
      : null,
    userId: String(raw?.user_id ?? raw?.userId ?? clientObj?.id ?? ''),
    clientName:
      raw?.client_name ??
      (clientObj ? `${clientObj.first_name ?? clientObj.firstName ?? ''} ${clientObj.last_name ?? clientObj.lastName ?? ''}`.trim() : undefined),
    client: clientObj && typeof clientObj === 'object' ? mapUser(clientObj) : null,
    rating: Number(raw?.rating ?? 5),
    comment: raw?.comment ?? '',
    status: raw?.status ?? 'pending',
    at: raw?.at ?? raw?.created_at ?? new Date().toISOString(),
  };
}

export function mapRequest(raw: any): RequestItem {
  const id = String(raw?.id ?? '');
  const clientRaw = raw?.client ?? raw?.user;
  const operatorRaw = raw?.operator;
  const serviceSlug =
    typeof raw?.service === 'string'
      ? raw.service
      : raw?.service?.slug ?? raw?.service_slug ?? raw?.serviceId ?? String(raw?.service_id ?? '');

  return {
    id,
    tracking: raw?.tracking ?? '',
    userId: String(raw?.user_id ?? raw?.userId ?? clientRaw?.id ?? ''),
    serviceId: serviceSlug,
    serviceSlug,
    serviceName: raw?.service?.name ?? raw?.service_name,
    service: raw?.service && typeof raw.service === 'object' ? mapServiceItem(raw.service) : null,
    status: raw?.status ?? 'pending',
    title: raw?.title ?? '',
    city: raw?.city ?? '',
    urgency: raw?.urgency === 'urgent' ? 'urgent' : 'normal',
    budget: raw?.budget ?? '',
    description: raw?.description ?? '',
    details: raw?.details && typeof raw.details === 'object' ? raw.details : {},
    operatorId: raw?.operator_id ? String(raw.operator_id) : operatorRaw?.id ? String(operatorRaw.id) : null,
    operator: operatorRaw && typeof operatorRaw === 'object' ? mapUser(operatorRaw) : null,
    client: clientRaw && typeof clientRaw === 'object' ? mapUser(clientRaw) : null,
    quote: raw?.quote ? { amount: Number(raw.quote.amount), label: raw.quote.label ?? '' } : null,
    rating: raw?.rating !== undefined && raw?.rating !== null ? Number(raw.rating) : null,
    createdAt: raw?.created_at ?? raw?.createdAt ?? new Date().toISOString(),
    history: Array.isArray(raw?.history) ? raw.history : [],
    notes: Array.isArray(raw?.notes)
      ? raw.notes.map((n: any, idx: number) => ({
          id: String(n?.id ?? idx),
          author: n?.author ?? 'Équipe',
          text: n?.text ?? '',
          at: n?.at ?? n?.created_at ?? new Date().toISOString(),
        }))
      : undefined,
    documents: Array.isArray(raw?.documents) ? raw.documents.map((d: any) => mapDocument(d, id)) : undefined,
    invoices: Array.isArray(raw?.invoices) ? raw.invoices.map((i: any) => mapInvoice(i, id)) : undefined,
    invoiceDue: raw?.invoice_due ? mapInvoice(raw.invoice_due, id) : null,
    review: raw?.review ? mapReview(raw.review) : null,
    unreadMessages: raw?.unread_messages !== undefined ? Number(raw.unread_messages) : undefined,
  };
}

export function mapNotification(raw: any): NotificationItem {
  return {
    id: String(raw?.id ?? ''),
    userId: String(raw?.user_id ?? raw?.userId ?? ''),
    text: raw?.text ?? '',
    href: raw?.link ?? raw?.href ?? '',
    at: raw?.at ?? raw?.created_at ?? new Date().toISOString(),
    read: Boolean(raw?.read),
  };
}

export function mapAudit(raw: any): AuditItem {
  return {
    id: String(raw?.id ?? ''),
    at: raw?.at ?? raw?.created_at ?? new Date().toISOString(),
    actor: raw?.actor ?? 'Système',
    text: raw?.text ?? '',
  };
}

export function mapCounters(raw: any): Counters {
  const c = raw?.data ?? raw ?? {};
  return {
    unreadMessages: Number(c.unread_messages ?? 0),
    unreadNotifications: Number(c.unread_notifications ?? 0),
    dueInvoices: Number(c.due_invoices ?? 0),
    pendingReviews: Number(c.pending_reviews ?? 0),
  };
}
