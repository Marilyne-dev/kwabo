import {
  CATEGORIES,
  SERVICES,
  SEED_AUDIT,
  SEED_DOCUMENTS,
  SEED_INVOICES,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_REFERRALS,
  SEED_REQUESTS,
  SEED_REVIEWS,
  SEED_USERS,
} from '../data/kwaboData';
import type { DocumentItem, InvoiceItem, MessageItem, NotificationItem, RequestItem, ReviewItem, Service, User } from '../types';

export const DEV_PREVIEW_ADMIN_TOKEN = '__kwabo_dev_preview__admin';
export const DEV_PREVIEW_OPERATOR_TOKEN = '__kwabo_dev_preview__operator';

export function isDevPreviewToken(token: string | null): boolean {
  if (!import.meta.env.DEV) return false;
  return token === DEV_PREVIEW_ADMIN_TOKEN || token === DEV_PREVIEW_OPERATOR_TOKEN;
}

// Mutable in-memory copies so local UI previews feel interactive without touching the remote API.
const usersState: User[] = SEED_USERS.map((u) => ({ ...u }));
const requestsState: RequestItem[] = SEED_REQUESTS.map((r) => ({
  ...r,
  history: [...(r.history || [])],
  notes: [...(r.notes || [])],
  details: { ...(r.details || {}) },
  quote: r.quote ? { ...r.quote } : null,
}));
const documentsState: DocumentItem[] = SEED_DOCUMENTS.map((d) => ({ ...d }));
const messagesState: MessageItem[] = SEED_MESSAGES.map((m) => ({ ...m }));
const invoicesState: InvoiceItem[] = SEED_INVOICES.map((i) => ({ ...i }));
const reviewsState: ReviewItem[] = SEED_REVIEWS.map((rv) => ({ ...rv }));
const notificationsState: NotificationItem[] = SEED_NOTIFICATIONS.map((n) => ({ ...n }));
const servicesState: Service[] = SERVICES.map((s) => ({ ...s }));
const auditState = SEED_AUDIT.map((a) => ({ ...a }));

const toSnakeUser = (u: User) => ({
  id: u.id,
  role: u.role.toLowerCase(),
  first_name: u.firstName,
  last_name: u.lastName,
  full_name: u.fullName || `${u.firstName} ${u.lastName}`.trim(),
  email: u.email,
  country: u.country,
  phone: u.phone,
  email_verified: u.verified,
  two_factor_enabled: u.twoFactor,
  notification_prefs: u.prefs,
  referral_code: u.referralCode,
  created_at: u.createdAt,
  suspended: Boolean(u.suspended),
});

const enrichRequest = (r: RequestItem) => {
  const client = usersState.find((u) => u.id === r.userId) || null;
  const operator = r.operatorId ? usersState.find((u) => u.id === r.operatorId) || null : null;
  const service = servicesState.find((s) => s.id === r.serviceId || s.slug === r.serviceId) || null;
  const docs = documentsState.filter((d) => d.requestId === r.id);
  const invs = invoicesState.filter((i) => i.requestId === r.id);
  const due = invs.find((i) => i.status === 'due') || null;
  const review = reviewsState.find((rv) => rv.requestId === r.id) || null;
  const unreadMessages = messagesState.filter((m) => m.requestId === r.id && !m.read).length;

  return {
    id: r.id,
    tracking: r.tracking,
    user_id: r.userId,
    service_id: r.serviceId,
    service: service ? { ...service, slug: service.id, cat: service.cat } : null,
    service_name: service?.name || r.title,
    status: r.status,
    title: r.title,
    city: r.city,
    urgency: r.urgency,
    budget: r.budget,
    description: r.description,
    details: r.details,
    operator_id: r.operatorId,
    operator: operator ? toSnakeUser(operator) : null,
    client: client ? toSnakeUser(client) : null,
    quote: r.quote,
    rating: r.rating,
    created_at: r.createdAt,
    history: r.history,
    notes: r.notes || [],
    documents: docs.map((d) => ({
      id: d.id,
      request_id: d.requestId,
      type: d.type,
      name: d.name,
      created_at: d.createdAt,
      photoName: d.photoName,
    })),
    invoices: invs.map((i) => ({
      id: i.id,
      number: i.id,
      request_id: i.requestId,
      user_id: i.userId,
      label: i.label,
      amount: i.amount,
      status: i.status,
      method: i.method,
      created_at: i.createdAt,
      paid_at: i.paidAt,
    })),
    invoice_due: due
      ? {
          id: due.id,
          number: due.id,
          request_id: due.requestId,
          user_id: due.userId,
          label: due.label,
          amount: due.amount,
          status: due.status,
          method: due.method,
          created_at: due.createdAt,
          paid_at: due.paidAt,
        }
      : null,
    review: review
      ? {
          id: review.id,
          request_id: review.requestId,
          user_id: review.userId,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          created_at: review.at,
        }
      : null,
    unread_messages: unreadMessages,
  };
};

export function getDevPreviewUser(token: string | null) {
  if (token === DEV_PREVIEW_OPERATOR_TOKEN) {
    const op = usersState.find((u) => u.role === 'OPERATOR') || usersState[0];
    return toSnakeUser(op);
  }
  const adm = usersState.find((u) => u.role === 'ADMIN') || usersState[0];
  return toSnakeUser(adm);
}

export async function handleDevPreviewRequest(
  rawPath: string,
  options: { method?: string; body?: any; params?: Record<string, any> } = {},
  token: string | null = null
): Promise<any> {
  const path = rawPath.split('?')[0];
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body || {};
  const params = options.params || {};
  const activeUser = getDevPreviewUser(token);
  const isOperator = activeUser.role === 'operator';

  if (path === '/ping') {
    return { message: 'API KWABO OK' };
  }

  if (path === '/logout') {
    return { ok: true };
  }

  if (path === '/me') {
    return { data: activeUser };
  }

  const serviceSlugMatch = path.match(/^\/services\/([^/]+)$/);
  if (serviceSlugMatch) {
    const slug = decodeURIComponent(serviceSlugMatch[1]);
    const srv = servicesState.find((s) => s.slug === slug || s.id === slug);
    if (!srv) return { data: null };
    const cat = CATEGORIES.find((c) => c.id === srv.cat);
    return {
      data: {
        ...srv,
        slug: srv.id,
        price_label: srv.price,
        form_fields: srv.fields,
        category: cat ? { ...cat, slug: cat.id } : null,
      },
    };
  }

  if (path === '/catalog') {
    return {
      data: CATEGORIES.map((c) => ({
        ...c,
        slug: c.id,
        services: servicesState
          .filter((s) => s.cat === c.id)
          .map((s) => ({
            ...s,
            slug: s.id,
            price_label: s.price,
            form_fields: s.fields,
          })),
      })),
    };
  }

  if (path === '/counters') {
    return {
      unread_messages: messagesState.filter((m) => !m.read).length,
      unread_notifications: notificationsState.filter((n) => n.userId === activeUser.id && !n.read).length,
      due_invoices: invoicesState.filter((i) => i.status === 'due').length,
      pending_reviews: reviewsState.filter((r) => r.status === 'pending').length,
    };
  }

  if (path === '/notifications') {
    const list = notificationsState.filter((n) => n.userId === activeUser.id || n.userId === 'u10');
    return {
      data: list.map((n) => ({
        id: n.id,
        user_id: n.userId,
        text: n.text,
        link: n.href,
        created_at: n.at,
        read: n.read,
      })),
      meta: { unread_total: list.filter((n) => !n.read).length },
    };
  }

  if (path === '/notifications/read-all' && method === 'POST') {
    notificationsState.forEach((n) => {
      n.read = true;
    });
    return { ok: true };
  }

  const notifMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifMatch && method === 'POST') {
    const target = notificationsState.find((n) => n.id === notifMatch[1]);
    if (target) target.read = true;
    return { ok: true };
  }

  if (path === '/admin/dashboard') {
    if (isOperator) {
      const assignedReqs = requestsState.filter((r) => r.operatorId === activeUser.id);
      const work = assignedReqs
        .filter((r) => r.status === 'pending' || r.status === 'active')
        .map((r) => ({
          request: enrichRequest(r),
          reasons: [
            r.urgency === 'urgent'
              ? { code: 'unread_messages', label: 'Intervention prioritaire' }
              : { code: 'needs_report', label: 'Rapport hebdo à déposer' },
          ],
        }));
      return {
        stats: {
          assigned: assignedReqs.length,
          pending: assignedReqs.filter((r) => r.status === 'pending').length,
          active: assignedReqs.filter((r) => r.status === 'active').length,
          done: assignedReqs.filter((r) => r.status === 'done').length,
        },
        work,
        by_category: CATEGORIES.map((c) => ({
          slug: c.id,
          name: c.name,
          short: c.short,
          count: assignedReqs.filter((r) => {
            const svc = servicesState.find((s) => s.id === r.serviceId);
            return svc?.cat === c.id;
          }).length,
        })),
        recent_documents: documentsState.slice(0, 5).map((d) => ({
          id: d.id,
          request_id: d.requestId,
          type: d.type,
          name: d.name,
          created_at: d.createdAt,
        })),
      };
    }

    const work = requestsState
      .filter((r) => !r.quote || r.status === 'pending')
      .map((r) => ({
        request: enrichRequest(r),
        reasons: [
          !r.quote
            ? { code: 'needs_quote', label: 'Devis à préparer' }
            : { code: 'unread_messages', label: 'En attente de validation' },
        ],
      }));

    return {
      stats: {
        quotes_to_prepare: requestsState.filter((r) => !r.quote && r.status !== 'cancelled').length,
        active_missions: requestsState.filter((r) => r.status === 'active').length,
        revenue_month: invoicesState.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
        awaiting_payment: invoicesState.filter((i) => i.status === 'due').reduce((s, i) => s + i.amount, 0),
      },
      work,
      revenue: [
        { label: 'Août', full: 'Août 2026', amount: 310 },
        { label: 'Sept', full: 'Septembre 2026', amount: 480 },
        { label: 'Oct', full: 'Octobre 2026', amount: 640 },
        { label: 'Nov', full: 'Novembre 2026', amount: 465 },
      ],
      by_category: CATEGORIES.map((c) => ({
        slug: c.id,
        name: c.name,
        short: c.short,
        count: requestsState.filter((r) => {
          const svc = servicesState.find((s) => s.id === r.serviceId);
          return svc?.cat === c.id;
        }).length,
      })),
      operator_load: usersState
        .filter((u) => u.role === 'OPERATOR')
        .map((op) => ({
          operator: toSnakeUser(op),
          count: requestsState.filter((r) => r.operatorId === op.id && r.status !== 'done' && r.status !== 'cancelled').length,
        })),
      recent_activity: auditState,
    };
  }

  if (path === '/admin/requests') {
    let list = [...requestsState];
    if (isOperator) {
      list = list.filter((r) => r.operatorId === activeUser.id);
    }
    if (params.status) {
      list = list.filter((r) => r.status === params.status);
    }
    if (params.operator) {
      list = list.filter((r) => r.operatorId === params.operator);
    }
    if (params.urgency) {
      list = list.filter((r) => r.urgency === params.urgency);
    }
    if (params.category) {
      list = list.filter((r) => servicesState.find((s) => s.id === r.serviceId)?.cat === params.category);
    }
    if (params.q) {
      const q = String(params.q).toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.tracking.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)
      );
    }
    return {
      data: list.map(enrichRequest),
      meta: { last_page: 1, total: list.length },
    };
  }

  const reqDetailMatch = path.match(/^\/admin\/requests\/([^/]+)$/);
  if (reqDetailMatch) {
    const req = requestsState.find((r) => r.id === reqDetailMatch[1]);
    if (!req) return { data: null };
    if (method === 'PATCH') {
      if (body.status) req.status = body.status;
      if (body.operator_id !== undefined) req.operatorId = body.operator_id || null;
      return { data: enrichRequest(req) };
    }
    return { data: enrichRequest(req) };
  }

  const reqStatusMatch = path.match(/^\/admin\/requests\/([^/]+)\/status$/);
  if (reqStatusMatch && method === 'PATCH') {
    const req = requestsState.find((r) => r.id === reqStatusMatch[1]);
    if (req && body.status) {
      req.status = body.status;
      req.history.push({ at: new Date().toISOString(), text: `Statut mis à jour : ${body.status}` });
    }
    return { data: req ? enrichRequest(req) : null };
  }

  const reqAssignMatch = path.match(/^\/admin\/requests\/([^/]+)\/assign$/);
  if (reqAssignMatch && method === 'PATCH') {
    const req = requestsState.find((r) => r.id === reqAssignMatch[1]);
    if (req) {
      req.operatorId = body.operator_id || null;
      const op = usersState.find((u) => u.id === req.operatorId);
      req.history.push({
        at: new Date().toISOString(),
        text: op ? `Mission assignée à ${op.firstName} ${op.lastName}` : 'Assignation retirée',
      });
    }
    return { data: req ? enrichRequest(req) : null };
  }

  const reqQuoteMatch = path.match(/^\/admin\/requests\/([^/]+)\/quote$/);
  if (reqQuoteMatch && method === 'POST') {
    const req = requestsState.find((r) => r.id === reqQuoteMatch[1]);
    if (req) {
      const amount = Number(body.amount || 0);
      const label = String(body.label || req.title);
      req.quote = { amount, label };
      req.history.push({ at: new Date().toISOString(), text: `Devis envoyé : ${amount} €` });
      invoicesState.unshift({
        id: `F-2026-00${invoicesState.length + 60}`,
        requestId: req.id,
        userId: req.userId,
        label,
        amount,
        status: 'due',
        method: null,
        createdAt: new Date().toISOString(),
        paidAt: null,
      });
    }
    return { data: req ? enrichRequest(req) : null };
  }

  const reqNoteMatch = path.match(/^\/admin\/requests\/([^/]+)\/notes$/);
  if (reqNoteMatch && method === 'POST') {
    const req = requestsState.find((r) => r.id === reqNoteMatch[1]);
    if (req) {
      req.notes = req.notes || [];
      req.notes.push({
        id: `note-${Date.now()}`,
        author: activeUser.full_name,
        text: String(body.text || ''),
        at: new Date().toISOString(),
      });
    }
    return { data: req ? enrichRequest(req) : null };
  }

  if (path === '/admin/team') {
    if (method === 'POST') {
      const created: User = {
        id: `op-${Date.now()}`,
        role: 'OPERATOR',
        firstName: String(body.first_name || 'Agent'),
        lastName: String(body.last_name || 'Terrain'),
        email: String(body.email || `agent${Date.now()}@kwabo.bj`),
        phone: String(body.phone || '+229 01 00 00 00 00'),
        country: 'Bénin',
        verified: true,
        twoFactor: false,
        prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
        referralCode: '',
        createdAt: new Date().toISOString(),
      };
      usersState.push(created);
      return {
        data: toSnakeUser(created),
        temporary_password: 'KwaboTemp2026!',
      };
    }

    const team = usersState
      .filter((u) => u.role === 'ADMIN' || u.role === 'OPERATOR')
      .map((u) => ({
        ...toSnakeUser(u),
        active_count: requestsState.filter((r) => r.operatorId === u.id && r.status === 'active').length,
        total_count: requestsState.filter((r) => r.operatorId === u.id).length,
      }));
    return { data: team };
  }

  const teamMemberMatch = path.match(/^\/admin\/team\/([^/]+)$/);
  if (teamMemberMatch) {
    const idx = usersState.findIndex((u) => u.id === teamMemberMatch[1]);
    if (method === 'DELETE' && idx >= 0) {
      usersState.splice(idx, 1);
      return { ok: true };
    }
    if (method === 'PATCH' && idx >= 0) {
      usersState[idx].suspended = Boolean(body.suspended);
      return { data: toSnakeUser(usersState[idx]) };
    }
  }

  if (path === '/admin/clients') {
    const clients = usersState
      .filter((u) => u.role === 'USER')
      .map((u) => {
        const userReqs = requestsState.filter((r) => r.userId === u.id);
        const paidTotal = invoicesState
          .filter((i) => i.userId === u.id && i.status === 'paid')
          .reduce((s, i) => s + i.amount, 0);
        return {
          ...toSnakeUser(u),
          requests_count: userReqs.length,
          paid_total: paidTotal,
        };
      });
    return { data: clients, meta: { last_page: 1, total: clients.length } };
  }

  const clientDetailMatch = path.match(/^\/admin\/clients\/([^/]+)$/);
  if (clientDetailMatch) {
    const u = usersState.find((c) => c.id === clientDetailMatch[1]);
    if (!u) return { data: null };
    if (method === 'PATCH') {
      u.suspended = Boolean(body.suspended);
    }
    const userReqs = requestsState.filter((r) => r.userId === u.id);
    const userInvs = invoicesState.filter((i) => i.userId === u.id);
    return {
      data: {
        user: toSnakeUser(u),
        stats: {
          requests_count: userReqs.length,
          active_count: userReqs.filter((r) => r.status === 'active').length,
          total_paid: userInvs.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
          total_due: userInvs.filter((i) => i.status === 'due').reduce((s, i) => s + i.amount, 0),
        },
        requests: userReqs.map(enrichRequest),
        invoices: userInvs.map((inv) => ({
          id: inv.id,
          number: inv.id,
          request_id: inv.requestId,
          user_id: inv.userId,
          label: inv.label,
          amount: inv.amount,
          status: inv.status,
          method: inv.method,
          created_at: inv.createdAt,
          paid_at: inv.paidAt,
        })),
      },
    };
  }

  if (path === '/admin/invoices') {
    let list = [...invoicesState];
    if (params.status) {
      list = list.filter((i) => i.status === params.status);
    }
    if (params.q) {
      const q = String(params.q).toLowerCase();
      list = list.filter((i) => i.label.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    const enriched = list.map((inv) => {
      const cl = usersState.find((u) => u.id === inv.userId);
      const req = requestsState.find((r) => r.id === inv.requestId);
      return {
        id: inv.id,
        number: inv.id,
        request_id: inv.requestId,
        user_id: inv.userId,
        client: cl ? toSnakeUser(cl) : null,
        request: req ? { id: req.id, tracking: req.tracking, title: req.title } : null,
        label: inv.label,
        amount: inv.amount,
        status: inv.status,
        method: inv.method,
        created_at: inv.createdAt,
        paid_at: inv.paidAt,
      };
    });
    return {
      data: enriched,
      meta: {
        last_page: 1,
        totals: {
          month: invoicesState.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
          paid: invoicesState.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
          due: invoicesState.filter((i) => i.status === 'due').reduce((s, i) => s + i.amount, 0),
          refunded: invoicesState.filter((i) => i.status === 'refunded').reduce((s, i) => s + i.amount, 0),
        },
      },
    };
  }

  const invRefundMatch = path.match(/^\/admin\/invoices\/([^/]+)\/refund$/);
  if (invRefundMatch && method === 'POST') {
    const inv = invoicesState.find((i) => i.id === invRefundMatch[1]);
    if (inv) inv.status = 'refunded';
    return { ok: true };
  }

  const invDetailMatch = path.match(/^\/admin\/invoices\/([^/]+)$/);
  if (invDetailMatch) {
    const inv = invoicesState.find((i) => i.id === invDetailMatch[1]);
    if (!inv) return { data: null };
    const cl = usersState.find((u) => u.id === inv.userId);
    const req = requestsState.find((r) => r.id === inv.requestId);
    return {
      data: {
        id: inv.id,
        number: inv.id,
        request_id: inv.requestId,
        user_id: inv.userId,
        client: cl ? toSnakeUser(cl) : null,
        request: req ? { id: req.id, tracking: req.tracking, title: req.title } : null,
        label: inv.label,
        amount: inv.amount,
        status: inv.status,
        method: inv.method,
        created_at: inv.createdAt,
        paid_at: inv.paidAt,
      },
    };
  }

  if (path === '/admin/kpis') {
    const totalCollected = invoicesState.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const paidCount = invoicesState.filter((i) => i.status === 'paid').length;
    return {
      indicators: [
        { key: 'clients', label: 'Comptes diaspora créés', current: usersState.filter((u) => u.role === 'USER').length, target_m6: 150, target_m12: 500, progress_m6: 12 },
        { key: 'requests', label: 'Demandes de services', current: requestsState.length, target_m6: 50, target_m12: 200, progress_m6: 18 },
        { key: 'revenue', label: 'CA encaissé (€)', current: totalCollected, target_m6: 500, target_m12: 1500, progress_m6: Math.min(100, Math.round((totalCollected / 500) * 100)) },
      ],
      revenue: [
        { label: 'Août', full: 'Août 2026', amount: 310 },
        { label: 'Sept', full: 'Septembre 2026', amount: 480 },
        { label: 'Oct', full: 'Octobre 2026', amount: 640 },
        { label: 'Nov', full: 'Novembre 2026', amount: 465 },
      ],
      average_invoice: paidCount ? Math.round(totalCollected / paidCount) : 0,
      total_collected: totalCollected,
      by_category: CATEGORIES.map((c) => ({
        slug: c.id,
        name: c.name,
        short: c.short,
        count: requestsState.filter((r) => servicesState.find((s) => s.id === r.serviceId)?.cat === c.id).length,
      })),
    };
  }

  if (path === '/admin/reviews') {
    const st = params.status || 'pending';
    const filtered = reviewsState.filter((rv) => rv.status === st);
    return {
      data: filtered.map((rv) => {
        const cl = usersState.find((u) => u.id === rv.userId);
        const req = requestsState.find((r) => r.id === rv.requestId);
        return {
          id: rv.id,
          request_id: rv.requestId,
          user_id: rv.userId,
          client: cl ? toSnakeUser(cl) : null,
          request: req ? { id: req.id, tracking: req.tracking, title: req.title } : null,
          rating: rv.rating,
          comment: rv.comment,
          status: rv.status,
          created_at: rv.at,
        };
      }),
      meta: {
        counts: {
          pending: reviewsState.filter((r) => r.status === 'pending').length,
          published: reviewsState.filter((r) => r.status === 'published').length,
          hidden: reviewsState.filter((r) => r.status === 'hidden').length,
        },
      },
    };
  }

  const reviewModMatch = path.match(/^\/admin\/reviews\/([^/]+)$/);
  if (reviewModMatch && method === 'PATCH') {
    const rv = reviewsState.find((r) => r.id === reviewModMatch[1]);
    if (rv && body.status) rv.status = body.status;
    return { ok: true };
  }

  if (path === '/admin/referrals') {
    const sponsors = Object.entries(SEED_REFERRALS).map(([userId, refs]) => {
      const sp = usersState.find((u) => u.id === userId) || {
        id: userId,
        firstName: 'Client',
        lastName: 'KWABO',
        referralCode: 'KW-DEMO',
      };
      const converted = refs.filter((r) => r.status === 'Actif').length;
      return {
        sponsor: {
          id: sp.id,
          first_name: sp.firstName,
          last_name: sp.lastName,
          referral_code: sp.referralCode || 'KW-DEMO',
        },
        referrals: refs,
        converted_count: converted,
        reward: converted * 10,
      };
    });
    return { data: sponsors };
  }

  if (path === '/admin/services') {
    return {
      data: servicesState.map((s) => ({
        ...s,
        slug: s.id,
        price_label: s.price,
        requests_count: requestsState.filter((r) => r.serviceId === s.id).length,
      })),
    };
  }

  const srvPatchMatch = path.match(/^\/admin\/services\/([^/]+)$/);
  if (srvPatchMatch && method === 'PATCH') {
    const s = servicesState.find((x) => x.id === srvPatchMatch[1]);
    if (s) {
      if (body.available !== undefined) s.available = Boolean(body.available);
      if (body.price_label !== undefined) s.price = String(body.price_label);
    }
    return { data: s };
  }

  if (path === '/admin/audit') {
    let logs = [...auditState];
    if (params.q) {
      const q = String(params.q).toLowerCase();
      logs = logs.filter((l) => l.text.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q));
    }
    return { data: logs, meta: { last_page: 1, total: logs.length } };
  }

  if (path === '/messages') {
    const grouped = requestsState.map((req) => {
      const msgs = messagesState.filter((m) => m.requestId === req.id);
      const last = msgs[msgs.length - 1] || null;
      return {
        request_id: req.id,
        request: enrichRequest(req),
        last_message: last ? { text: last.text, created_at: last.at } : null,
        unread: msgs.filter((m) => !m.read).length,
      };
    });
    return { data: grouped };
  }

  const msgThreadMatch = path.match(/^\/requests\/([^/]+)\/messages$/);
  if (msgThreadMatch) {
    const reqId = msgThreadMatch[1];
    if (method === 'POST') {
      const created: MessageItem = {
        id: `m-${Date.now()}`,
        requestId: reqId,
        from: 'team',
        author: activeUser.full_name,
        text: body instanceof FormData ? String(body.get('text') || '') : String(body.text || ''),
        at: new Date().toISOString(),
        read: true,
      };
      messagesState.push(created);
      return { data: created };
    }
    return {
      data: messagesState.filter((m) => m.requestId === reqId),
    };
  }

  const msgReadMatch = path.match(/^\/requests\/([^/]+)\/messages\/read$/);
  if (msgReadMatch && method === 'POST') {
    messagesState.forEach((m) => {
      if (m.requestId === msgReadMatch[1]) m.read = true;
    });
    return { ok: true };
  }

  return { data: [] };
}

