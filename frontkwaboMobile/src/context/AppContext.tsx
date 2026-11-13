import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { loadToken, setUnauthorizedHandler } from '@/services/api';
import * as authApi from '@/services/auth';
import type { LoginResult, RegisterPayload } from '@/services/auth';
import * as requestsApi from '@/services/requests';
import type { NewRequestInput, PickedFile } from '@/services/requests';
import * as messagesApi from '@/services/messages';
import * as misc from '@/services/misc';
import type { InvoicesMeta } from '@/services/misc';
import { fetchCatalog } from '@/services/catalog';
import { SERVICES as LOCAL_SERVICES } from '@/data/services';
import type { ServiceItem } from '@/data/services';
import type {
  User,
  RequestItem,
  MessageItem,
  AppNotification,
  DocumentItem,
  InvoiceItem,
  ThreadInfo,
} from '@/data/mockData';

export interface PushBannerData {
  title: string;
  message: string;
  type?: 'success' | 'payment' | 'doc' | 'info';
}

interface AppContextType {
  // auth
  user: User | null;
  authReady: boolean;
  login: (email: string, password: string, code?: string) => Promise<LoginResult>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (u: User) => void;
  // catalogue
  services: ServiceItem[];
  // demandes
  requests: RequestItem[];
  requestsLoading: boolean;
  refreshRequests: () => Promise<void>;
  createRequest: (data: NewRequestInput) => Promise<RequestItem>;
  cancelRequest: (id: string) => Promise<void>;
  // messages
  messages: Record<string, MessageItem[]>;
  threads: Record<string, ThreadInfo>;
  unreadMessagesCount: number;
  loadMessages: (requestId: string) => Promise<void>;
  refreshThreads: () => Promise<void>;
  sendMessage: (requestId: string, text: string, file?: PickedFile) => Promise<void>;
  // documents
  documents: DocumentItem[];
  refreshDocuments: () => Promise<void>;
  // paiements
  invoices: InvoiceItem[];
  invoicesMeta: InvoicesMeta;
  refreshInvoices: () => Promise<void>;
  payInvoice: (id: string, method: 'card' | 'momo' | 'wise') => Promise<void>;
  // notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  // bannière
  notify: (title: string, message: string, type?: 'success' | 'payment' | 'doc' | 'info') => void;
  activePushBanner: PushBannerData | null;
  dismissPushBanner: () => void;
  notificationPing: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const POLL_MS = 30000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>(LOCAL_SERVICES);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>({});
  const [threads, setThreads] = useState<Record<string, ThreadInfo>>({});
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoicesMeta, setInvoicesMeta] = useState<InvoicesMeta>({ dueTotal: 0, paidTotal: 0, count: 0 });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activePushBanner, setActivePushBanner] = useState<PushBannerData | null>(null);
  const [notificationPing, setNotificationPing] = useState(0);
  const bannerTimeoutRef = useRef<any>(null);
  const lastUnreadNotifs = useRef(0);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  /* ---------- Session ---------- */
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      try {
        const token = await loadToken();
        if (token) setUser(await authApi.fetchMe());
      } catch {
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (email: string, password: string, code?: string) => {
    const res = await authApi.login(email, password, code);
    if (res.status === 'ok') setUser(res.user);
    return res;
  };
  const register = async (payload: RegisterPayload) => {
    await authApi.register(payload);
  };
  const verifyEmail = async (email: string, code: string) => {
    setUser(await authApi.verifyEmail(email, code));
  };
  const resendVerification = async (email: string) => {
    await authApi.resendVerification(email);
  };
  const logout = async () => {
    await authApi.logoutRemote();
    setUser(null);
  };

  /* ---------- Catalogue (public, repli local si échec) ---------- */
  useEffect(() => {
    fetchCatalog()
      .then((list) => { if (list.length) setServices(list.filter((x) => x.available !== false)); })
      .catch(() => {});
  }, []);

  /* ---------- Demandes ---------- */
  const refreshRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      setRequests(await requestsApi.fetchRequests());
    } catch {} finally {
      setRequestsLoading(false);
    }
  }, []);

  const createRequest = async (data: NewRequestInput) => {
    const created = await requestsApi.createRequest(data);
    setRequests((prev) => [created, ...prev]);
    setNotificationPing((p) => p + 1);
    return created;
  };

  const cancelRequest = async (id: string) => {
    await requestsApi.cancelRequest(id);
    await refreshRequests();
  };

  /* ---------- Messages ---------- */
  const refreshThreads = useCallback(async () => {
    try {
      const { threads: list, unreadTotal } = await messagesApi.fetchThreads();
      const map: Record<string, ThreadInfo> = {};
      list.forEach((t) => { map[t.requestId] = t; });
      setThreads(map);
      setUnreadMessagesCount(unreadTotal);
    } catch {}
  }, []);

  const loadMessages = useCallback(async (requestId: string) => {
    try {
      const list = await messagesApi.fetchMessages(requestId);
      setMessages((prev) => ({ ...prev, [requestId]: list }));
      if (list.some((m) => m.sender === 'kwabo')) {
        messagesApi.markRead(requestId).then(refreshThreads).catch(() => {});
      }
    } catch {}
  }, [refreshThreads]);

  const sendMessage = async (requestId: string, text: string, file?: PickedFile) => {
    if (!text.trim() && !file) return;
    const msg = await messagesApi.sendMessage(requestId, text.trim(), file);
    setMessages((prev) => ({ ...prev, [requestId]: [...(prev[requestId] || []), msg] }));
  };

  /* ---------- Documents & paiements ---------- */
  const refreshDocuments = useCallback(async () => {
    try { setDocuments(await misc.fetchDocuments()); } catch {}
  }, []);

  const refreshInvoices = useCallback(async () => {
    try {
      const { items, meta } = await misc.fetchInvoices();
      setInvoices(items);
      setInvoicesMeta(meta);
    } catch {}
  }, []);

  const payInvoice = async (id: string, method: 'card' | 'momo' | 'wise') => {
    await misc.payInvoice(id, method);
    await Promise.all([refreshInvoices(), refreshRequests()]);
  };

  /* ---------- Notifications ---------- */
  const refreshNotifications = useCallback(async () => {
    try {
      const { items } = await misc.fetchNotifications();
      const unread = items.filter((n) => !n.read).length;
      if (unread > lastUnreadNotifs.current) setNotificationPing((p) => p + 1);
      lastUnreadNotifs.current = unread;
      setNotifications(items);
    } catch {}
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    misc.markNotificationRead(id).catch(() => {});
  };

  /* ---------- Chargement à la connexion + rafraîchissement régulier ---------- */
  useEffect(() => {
    if (!user) {
      setRequests([]); setMessages({}); setThreads({}); setDocuments([]);
      setInvoices([]); setNotifications([]); setUnreadMessagesCount(0);
      lastUnreadNotifs.current = 0;
      return;
    }
    refreshRequests();
    refreshThreads();
    refreshNotifications();
    refreshDocuments();
    refreshInvoices();
    const timer = setInterval(() => {
      refreshThreads();
      refreshNotifications();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [user?.id]);

  /* ---------- Bannière locale (retour visuel uniquement) ---------- */
  const dismissPushBanner = useCallback(() => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setActivePushBanner(null);
  }, []);

  const notify = useCallback(
    (title: string, message: string, type: 'success' | 'payment' | 'doc' | 'info' = 'success') => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
      setActivePushBanner({ title, message, type });
      setNotificationPing((p) => p + 1);
      bannerTimeoutRef.current = setTimeout(() => setActivePushBanner(null), 4500);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        user, authReady, login, register, verifyEmail, resendVerification, logout,
        updateUser: setUser,
        services,
        requests, requestsLoading, refreshRequests, createRequest, cancelRequest,
        messages, threads, unreadMessagesCount, loadMessages, refreshThreads, sendMessage,
        documents, refreshDocuments,
        invoices, invoicesMeta, refreshInvoices, payInvoice,
        notifications, unreadNotificationsCount, refreshNotifications, markNotificationAsRead,
        notify, activePushBanner, dismissPushBanner, notificationPing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
