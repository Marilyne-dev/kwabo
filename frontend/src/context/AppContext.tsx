import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  api,
  ApiError,
  getToken,
  setToken,
  setUnauthorizedHandler,
  downloadAuthenticatedFile,
  pingApi,
} from '../services/api';
import {
  DEV_PREVIEW_ADMIN_TOKEN,
  DEV_PREVIEW_OPERATOR_TOKEN,
  getDevPreviewUser,
} from '../services/devPreviewApi';
import {
  mapCatalog,
  mapCounters,
  mapNotification,
  mapUser,
} from '../services/mappers';
import {
  User,
  NotificationItem,
  AppRole,
  Service,
  Category,
  Counters,
} from '../types';
import { CATEGORIES, SERVICES } from '../data/kwaboData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

export interface LoginResult {
  success: boolean;
  needsCode?: boolean;
  needsVerification?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  sponsor_code?: string;
  dial?: string;
}

export interface ResetPasswordParams {
  email: string;
  token: string;
}

export interface PhotoModalState {
  url: string;
  title: string;
  downloadUrl?: string;
  requiresAuth?: boolean;
}

interface AppContextType {
  role: AppRole;
  currentUser: User | null;
  authLoading: boolean;
  categories: Category[];
  services: Service[];
  notifications: NotificationItem[];
  counters: Counters;

  // Navigation / Views
  currentView: string;
  activeRequestId: string | null;
  activeClientId: string | null;
  pendingServiceSlug: string | null;
  resetPasswordParams: ResetPasswordParams | null;
  activeServiceModal: Service | null;
  activePhotoModal: PhotoModalState | null;
  toasts: Toast[];
  confirmState: ConfirmState | null;

  // Navigation actions
  navigate: (view: string, reqId?: string | null, syncHash?: boolean) => void;
  navigateFromLink: (link: string) => void;
  setActiveClientId: (clientId: string | null) => void;
  setPendingServiceSlug: (slug: string | null) => void;
  openServiceModal: (service: Service) => void;
  closeServiceModal: () => void;
  openPhotoModal: (url: string, title: string, downloadUrl?: string, requiresAuth?: boolean) => void;
  closePhotoModal: () => void;
  downloadDocument: (urlOrPath: string, filename: string) => Promise<void>;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  resolveConfirm: (confirmed: boolean) => void;

  // Auth & Profile
  login: (
    email: string,
    password: string,
    options?: { isTeam?: boolean; expectedRole?: 'USER' | 'ADMIN' | 'OPERATOR'; code?: string }
  ) => Promise<LoginResult>;
  enterDevPreview?: (targetRole: 'ADMIN' | 'OPERATOR') => Promise<void>;
  registerAccount: (payload: RegisterPayload) => Promise<{ success: boolean; user?: User; needsVerification?: boolean; message?: string; errors?: Record<string, string[]> }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshMe: () => Promise<User | null>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshCatalog: () => Promise<void>;
  apiStatus: { checked: boolean; ok: boolean; message: string };
  checkApiHealth: () => Promise<boolean>;
  refreshCounters: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Route helpers for hash synchronization
export function getHashForView(view: string, reqId: string | null = null): string {
  switch (view) {
    case 'public-home': return '#/';
    case 'public-services': return '#/services';
    case 'login': return '#/connexion';
    case 'admin-login': return '#/admin/connexion';
    case 'operator-login': return '#/agent/connexion';
    case 'register': return '#/inscription';
    case 'forgot-password': return '#/mot-de-passe-oublie';
    case 'reset-password': return '#/reinitialiser-mot-de-passe';
    case 'privacy': return '#/confidentialite';
    case 'cgu': return '#/cgu';
    // Client
    case 'client-dashboard': return '#/espace';
    case 'client-requests': return '#/espace/demandes';
    case 'client-request-detail': return reqId ? `#/espace/demandes/${reqId}` : '#/espace/demandes';
    case 'client-new-request': return '#/espace/nouvelle-demande';
    case 'client-documents': return '#/espace/documents';
    case 'client-messages': return reqId ? `#/espace/messages/${reqId}` : '#/espace/messages';
    case 'client-invoices': return '#/espace/paiements';
    case 'client-referral': return '#/espace/parrainage';
    case 'client-profile': return '#/espace/profil';
    // Back-office (Admin / Operator)
    case 'admin-dashboard':
    case 'operator-dashboard': return '#/';
    case 'admin-kpis': return '#/indicateurs';
    case 'admin-requests':
    case 'operator-missions': return '#/demandes';
    case 'admin-request-detail':
    case 'operator-mission-detail': return reqId ? `#/demandes/${reqId}` : '#/demandes';
    case 'admin-messages': return reqId ? `#/messages/${reqId}` : '#/messages';
    case 'admin-invoices': return '#/paiements';
    case 'admin-clients': return '#/clients';
    case 'admin-reviews': return '#/avis';
    case 'admin-referrals': return '#/parrainage';
    case 'admin-catalog': return '#/catalogue';
    case 'admin-team': return '#/equipe';
    case 'admin-audit': return '#/journal';
    default: return '#/';
  }
}

export function getViewFromHash(hash: string, userRole: AppRole): { view: string; reqId: string | null } {
  const clean = (hash || window.location.hash).replace(/^#\/?/, '');
  const [path] = clean.split('?');
  const parts = path ? path.split('/').filter(Boolean) : [];

  if (parts.length === 0) {
    if (userRole === 'ADMIN') return { view: 'admin-dashboard', reqId: null };
    if (userRole === 'OPERATOR') return { view: 'operator-dashboard', reqId: null };
    if (userRole === 'USER') return { view: 'client-dashboard', reqId: null };
    return { view: 'public-home', reqId: null };
  }

  // Public & auth
  if (parts[0] === 'connexion') {
    if (userRole === 'USER') return { view: 'client-dashboard', reqId: null };
    return { view: 'login', reqId: null };
  }
  if (parts[0] === 'admin' && (!parts[1] || parts[1] === 'connexion' || parts[1] === 'login')) {
    if (userRole === 'ADMIN') return { view: 'admin-dashboard', reqId: null };
    return { view: 'admin-login', reqId: null };
  }
  if (
    (parts[0] === 'agent' && (!parts[1] || parts[1] === 'connexion' || parts[1] === 'login')) ||
    ((parts[0] === 'operateur' || parts[0] === 'equipe') && (parts[1] === 'connexion' || parts[1] === 'login'))
  ) {
    if (userRole === 'OPERATOR') return { view: 'operator-dashboard', reqId: null };
    return { view: 'operator-login', reqId: null };
  }
  if (parts[0] === 'inscription') return { view: 'register', reqId: null };
  if (parts[0] === 'mot-de-passe-oublie') return { view: 'forgot-password', reqId: null };
  if (parts[0] === 'reinitialiser-mot-de-passe') return { view: 'reset-password', reqId: null };
  if (parts[0] === 'confidentialite') return { view: 'privacy', reqId: null };
  if (parts[0] === 'cgu') return { view: 'cgu', reqId: null };
  if (parts[0] === 'services' && userRole === 'VISITOR') return { view: 'public-services', reqId: null };

  // Client space (#/espace/...)
  if (parts[0] === 'espace') {
    if (userRole === 'VISITOR') return { view: 'login', reqId: null };
    const section = parts[1];
    const id = parts[2] || null;
    switch (section) {
      case 'demandes': return id ? { view: 'client-request-detail', reqId: id } : { view: 'client-requests', reqId: null };
      case 'nouvelle-demande': return { view: 'client-new-request', reqId: null };
      case 'documents': return { view: 'client-documents', reqId: null };
      case 'messages': return { view: 'client-messages', reqId: id };
      case 'paiements': return { view: 'client-invoices', reqId: null };
      case 'parrainage': return { view: 'client-referral', reqId: null };
      case 'profil': return { view: 'client-profile', reqId: null };
      default: return { view: 'client-dashboard', reqId: null };
    }
  }

  // Admin & Operator
  if (userRole === 'ADMIN' || userRole === 'OPERATOR') {
    const section = parts[0];
    const id = parts[1] || null;
    switch (section) {
      case 'indicateurs': return { view: 'admin-kpis', reqId: null };
      case 'demandes':
        if (id) return { view: 'admin-request-detail', reqId: id };
        return { view: userRole === 'OPERATOR' ? 'operator-missions' : 'admin-requests', reqId: null };
      case 'messages': return { view: 'admin-messages', reqId: id };
      case 'paiements': return { view: 'admin-invoices', reqId: null };
      case 'clients': return { view: 'admin-clients', reqId: null };
      case 'avis': return { view: 'admin-reviews', reqId: null };
      case 'parrainage': return { view: 'admin-referrals', reqId: null };
      case 'catalogue': return { view: 'admin-catalog', reqId: null };
      case 'equipe': return { view: 'admin-team', reqId: null };
      case 'journal': return { view: 'admin-audit', reqId: null };
      default: return { view: userRole === 'OPERATOR' ? 'operator-dashboard' : 'admin-dashboard', reqId: null };
    }
  }

  if (userRole === 'USER') {
    if (parts[0] === 'demandes') return parts[1] ? { view: 'client-request-detail', reqId: parts[1] } : { view: 'client-requests', reqId: null };
    if (parts[0] === 'messages') return { view: 'client-messages', reqId: parts[1] || null };
    return { view: 'client-dashboard', reqId: null };
  }

  return { view: 'public-home', reqId: null };
}

function detectResetParamsFromUrl(): ResetPasswordParams | null {
  try {
    const pathname = window.location.pathname || '';
    const hash = window.location.hash || '';
    const isResetPath = pathname.includes('reinitialiser-mot-de-passe');
    const isResetHash = hash.includes('reinitialiser-mot-de-passe');

    if (!isResetPath && !isResetHash) return null;

    const searchParams = new URLSearchParams(window.location.search);
    if (hash.includes('?')) {
      const hashQuery = hash.split('?')[1];
      const hashParams = new URLSearchParams(hashQuery);
      hashParams.forEach((v, k) => {
        if (!searchParams.has(k)) searchParams.set(k, v);
      });
    }

    const email = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';
    if (email || token) {
      return { email, token };
    }
    return { email: '', token: '' };
  } catch {
    return null;
  }
}

function detectInitialAuthViewFromPath(): string | null {
  try {
    const pathname = (window.location.pathname || '').replace(/\/+$/, '');
    if (
      pathname.endsWith('/agent/connexion') ||
      pathname.endsWith('/agent/login') ||
      pathname.endsWith('/agent') ||
      pathname.endsWith('/operateur/connexion') ||
      pathname.endsWith('/equipe/connexion')
    ) {
      return 'operator-login';
    }
    if (
      pathname.endsWith('/admin/connexion') ||
      pathname.endsWith('/admin/login') ||
      pathname.endsWith('/admin')
    ) {
      return 'admin-login';
    }
    if (pathname.endsWith('/connexion') || pathname.endsWith('/login')) {
      return 'login';
    }
    return null;
  } catch {
    return null;
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(() => Boolean(getToken()));
  const role: AppRole = currentUser ? currentUser.role : 'VISITOR';

  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [apiStatus, setApiStatus] = useState<{ checked: boolean; ok: boolean; message: string }>({
    checked: false,
    ok: false,
    message: '',
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counters, setCounters] = useState<Counters>({
    unreadMessages: 0,
    unreadNotifications: 0,
    dueInvoices: 0,
    pendingReviews: 0,
  });

  const [resetPasswordParams] = useState<ResetPasswordParams | null>(() => detectResetParamsFromUrl());
  const [currentView, setCurrentView] = useState<string>(() => {
    if (detectResetParamsFromUrl()) return 'reset-password';
    return detectInitialAuthViewFromPath() || 'public-home';
  });
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [pendingServiceSlug, setPendingServiceSlug] = useState<string | null>(null);
  const [activeServiceModal, setActiveServiceModal] = useState<Service | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<PhotoModalState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState(prev => {
        if (prev) prev.resolve(false);
        return { ...options, resolve };
      });
    });
  }, []);

  const resolveConfirm = useCallback((confirmed: boolean) => {
    setConfirmState(prev => {
      if (prev) prev.resolve(confirmed);
      return null;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const durationMs = type === 'error' ? 6000 : type === 'warning' ? 5500 : 4500;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), durationMs);
  }, [removeToast]);

  const navigate = useCallback((view: string, reqId: string | null = null, syncHash: boolean = true) => {
    setCurrentView(view);
    if (reqId !== undefined) {
      setActiveRequestId(reqId);
    }
    if (syncHash) {
      const newHash = getHashForView(view, reqId);
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateFromLink = useCallback((link: string) => {
    if (!link) return;
    const clean = link.replace(/^#/, '').split('?')[0];
    const parts = clean.split('/').filter(Boolean);

    if (parts[0] === 'admin' && parts[1] === 'requests') {
      navigate(parts[2] ? 'admin-request-detail' : 'admin-requests', parts[2] || null);
      return;
    }
    if (parts[0] === 'requests') {
      const targetDetail = role === 'ADMIN' || role === 'OPERATOR' ? 'admin-request-detail' : 'client-request-detail';
      const targetList = role === 'ADMIN' ? 'admin-requests' : role === 'OPERATOR' ? 'operator-missions' : 'client-requests';
      navigate(parts[1] ? targetDetail : targetList, parts[1] || null);
      return;
    }
    if (parts[0] === 'requests-detail' && parts[1]) {
      navigate(role === 'ADMIN' || role === 'OPERATOR' ? 'admin-request-detail' : 'client-request-detail', parts[1]);
      return;
    }
    if (parts[0] === 'payments' || parts[0] === 'invoices') {
      navigate(role === 'ADMIN' ? 'admin-invoices' : 'client-invoices');
      return;
    }
    if (parts[0] === 'messages') {
      navigate(role === 'ADMIN' || role === 'OPERATOR' ? 'admin-messages' : 'client-messages', parts[1] || null);
      return;
    }
    if (parts[0] === 'documents') {
      navigate('client-documents');
      return;
    }
    if (parts[0] === 'referrals') {
      navigate(role === 'ADMIN' ? 'admin-referrals' : 'client-referral');
      return;
    }
    if (parts[0] === 'reviews') {
      navigate('admin-reviews');
      return;
    }
    if (parts[0] === 'clients') {
      navigate('admin-clients');
      return;
    }
    if (parts[0] === 'profile') {
      navigate('client-profile');
    }
  }, [navigate, role]);

  const refreshCatalog = useCallback(async () => {
    try {
      const res = await api<{ data: any[] }>('/catalog', { skipAuthRedirect: true });
      if (Array.isArray(res?.data) && res.data.length > 0) {
        const mapped = mapCatalog(res.data);
        setCategories(mapped.categories);
        setServices(mapped.services);
      }
    } catch (err) {
      console.error('Catalogue indisponible, données locales gardées', err);
    }
  }, []);

  const checkApiHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await pingApi();
      setApiStatus({ checked: true, ok: res.ok, message: res.message });
      return res.ok;
    } catch {
      setApiStatus({ checked: true, ok: false, message: 'API indisponible' });
      return false;
    }
  }, []);

  const refreshCounters = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api('/counters');
      setCounters(mapCounters(res));
    } catch {
      // Ignore transient counter failures
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api<{ data: any[]; meta?: { unread_total?: number } }>('/notifications');
      const list = Array.isArray(res?.data) ? res.data.map(mapNotification) : [];
      setNotifications(list);
      if (res?.meta?.unread_total !== undefined) {
        setCounters(prev => ({ ...prev, unreadNotifications: Number(res.meta!.unread_total) }));
      }
    } catch {
      // Ignore transient notification errors
    }
  }, []);

  const refreshMe = useCallback(async (): Promise<User | null> => {
    if (!getToken()) {
      setCurrentUser(null);
      return null;
    }
    try {
      const res = await api<{ data?: any }>('/me', { skipAuthRedirect: true });
      const user = mapUser(res?.data ?? res);
      setCurrentUser(user);
      return user;
    } catch {
      setToken(null);
      setCurrentUser(null);
      return null;
    }
  }, []);

  // Register global 401 handler
  useEffect(() => {
    setUnauthorizedHandler(() => {
      const targetView =
        role === 'ADMIN' ? 'admin-login' : role === 'OPERATOR' ? 'operator-login' : 'login';
      setCurrentUser(null);
      setNotifications([]);
      setCounters({ unreadMessages: 0, unreadNotifications: 0, dueInvoices: 0, pendingReviews: 0 });
      addToast('Session expirée. Veuillez vous reconnecter.', 'warning');
      navigate(targetView);
    });
    return () => setUnauthorizedHandler(null);
  }, [addToast, navigate, role]);

  // Initial load: API health check + catalog + restore session if token exists
  useEffect(() => {
    checkApiHealth();
    refreshCatalog();

    if (resetPasswordParams) {
      setAuthLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setAuthLoading(false);
      if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#') {
        const { view, reqId } = getViewFromHash(window.location.hash, 'VISITOR');
        setCurrentView(view);
        setActiveRequestId(reqId);
      }
      return;
    }

    (async () => {
      const user = await refreshMe();
      if (user) {
        await Promise.all([refreshCounters(), refreshNotifications()]);
        if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#') {
          const { view, reqId } = getViewFromHash(window.location.hash, user.role);
          setCurrentView(view);
          setActiveRequestId(reqId);
          if (view === 'client-dashboard' || view === 'admin-dashboard' || view === 'operator-dashboard') {
            const targetHash = getHashForView(view, reqId);
            if (window.location.hash !== targetHash) {
              window.history.replaceState(null, '', targetHash);
            }
          }
        } else {
          if (user.role === 'ADMIN') setCurrentView('admin-dashboard');
          else if (user.role === 'OPERATOR') setCurrentView('operator-dashboard');
          else setCurrentView('client-dashboard');
        }
      } else {
        setCurrentView('public-home');
      }
      setAuthLoading(false);
    })();
  }, [checkApiHealth, refreshCatalog, refreshCounters, refreshMe, refreshNotifications, resetPasswordParams]);

  // Sync hash routing on hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const { view, reqId } = getViewFromHash(window.location.hash, role);
      setCurrentView(view);
      setActiveRequestId(reqId);
      if (view === 'client-dashboard' || view === 'admin-dashboard' || view === 'operator-dashboard') {
        const targetHash = getHashForView(view, reqId);
        if (window.location.hash !== targetHash) {
          window.history.replaceState(null, '', targetHash);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [role]);

  const openServiceModal = (service: Service) => setActiveServiceModal(service);
  const closeServiceModal = () => setActiveServiceModal(null);

  const openPhotoModal = (url: string, title: string, downloadUrl?: string, requiresAuth?: boolean) => {
    setActivePhotoModal({ url, title, downloadUrl, requiresAuth });
  };
  const closePhotoModal = () => setActivePhotoModal(null);

  const downloadDocument = useCallback(async (urlOrPath: string, filename: string) => {
    try {
      await downloadAuthenticatedFile(urlOrPath, filename);
      addToast(`Téléchargement de « ${filename} » terminé.`);
    } catch (err: any) {
      addToast(err?.message || 'Erreur lors du téléchargement.', 'error');
    }
  }, [addToast]);

  const postAuthSuccess = useCallback(async (rawUser: any, token: string) => {
    setToken(token);
    const user = mapUser(rawUser);
    setCurrentUser(user);
    await Promise.all([refreshCounters(), refreshNotifications()]);
    addToast(`Bienvenue ${user.firstName} ! Connexion réussie.`);

    if (pendingServiceSlug && user.role === 'USER') {
      navigate('client-new-request');
    } else if (user.role === 'ADMIN') {
      navigate('admin-dashboard');
    } else if (user.role === 'OPERATOR') {
      navigate('operator-dashboard');
    } else {
      navigate('client-dashboard');
    }
    return user;
  }, [addToast, navigate, pendingServiceSlug, refreshCounters, refreshNotifications]);

  const login = async (
    email: string,
    password: string,
    options?: { isTeam?: boolean; expectedRole?: 'USER' | 'ADMIN' | 'OPERATOR'; code?: string }
  ): Promise<LoginResult> => {
    const expectedRole = options?.expectedRole;
    const useTeamEndpoint =
      options?.isTeam ?? (expectedRole === 'ADMIN' || expectedRole === 'OPERATOR');
    const endpoint = useTeamEndpoint ? '/admin/login' : '/login';
    try {
      const payload: Record<string, any> = {
        email: email.trim(),
        password,
        device_name: 'KWABO Web',
      };
      if (options?.code) {
        payload.code = options.code.trim();
      }

      const res = await api<any>(endpoint, {
        method: 'POST',
        body: payload,
        skipAuthRedirect: true,
      });

      if (res?.needs_code) {
        return { success: false, needsCode: true, message: 'Code d\'authentification à 6 chiffres requis.' };
      }

      if (res?.token && res?.user) {
        const mappedUser = mapUser(res.user);
        if (expectedRole && mappedUser.role !== expectedRole) {
          await api('/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${res.token}` },
            skipAuthRedirect: true,
          }).catch(() => {});

          const mismatchMessage =
            expectedRole === 'ADMIN'
              ? 'Cet accès est réservé aux administrateurs. Connectez-vous depuis le portail agent terrain (#/agent/connexion).'
              : expectedRole === 'OPERATOR'
                ? 'Cet accès est réservé aux agents terrain. Connectez-vous depuis le portail administrateur (#/admin/connexion).'
                : 'Veuillez utiliser votre espace dédié pour vous connecter.';

          return { success: false, message: mismatchMessage };
        }

        await postAuthSuccess(res.user, res.token);
        return { success: true };
      }

      return { success: false, message: 'Réponse inattendue du serveur.' };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.data?.needs_verification) {
          return {
            success: false,
            needsVerification: true,
            message: 'Votre adresse e-mail n\'est pas encore vérifiée. Saisissez le code reçu par e-mail.',
          };
        }
        return {
          success: false,
          message: err.message,
          errors: err.errors,
        };
      }
      return { success: false, message: 'Erreur réseau. Veuillez réessayer.' };
    }
  };

  const enterDevPreview = import.meta.env.DEV
    ? async (targetRole: 'ADMIN' | 'OPERATOR') => {
        const previewToken =
          targetRole === 'ADMIN' ? DEV_PREVIEW_ADMIN_TOKEN : DEV_PREVIEW_OPERATOR_TOKEN;
        const previewUser = getDevPreviewUser(previewToken);
        await postAuthSuccess(previewUser, previewToken);
      }
    : undefined;

  const registerAccount = async (payload: RegisterPayload) => {
    try {
      const res = await api<any>('/register', {
        method: 'POST',
        body: payload,
        skipAuthRedirect: true,
      });
      return {
        success: true,
        user: res?.user ? mapUser(res.user) : undefined,
        needsVerification: Boolean(res?.needs_verification ?? true),
      };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, message: err.message, errors: err.errors };
      }
      return { success: false, message: 'Erreur réseau lors de l\'inscription.' };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const res = await api<any>('/email/verify', {
        method: 'POST',
        body: { email: email.trim(), code: code.trim() },
        skipAuthRedirect: true,
      });
      if (res?.token && res?.user) {
        await postAuthSuccess(res.user, res.token);
        return { success: true };
      }
      return { success: false, message: 'Code invalide ou expiré.' };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, message: err.message, errors: err.errors };
      }
      return { success: false, message: 'Erreur lors de la vérification.' };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      await api('/email/resend', {
        method: 'POST',
        body: { email: email.trim() },
        skipAuthRedirect: true,
      });
      return { success: true, message: 'Un nouveau code vient d\'être envoyé par e-mail.' };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, message: err.message };
      }
      return { success: false, message: 'Impossible de renvoyer le code.' };
    }
  };

  const logout = async (allDevices = false) => {
    const prevRole = currentUser?.role;
    const redirectView =
      prevRole === 'ADMIN' ? 'admin-login' : prevRole === 'OPERATOR' ? 'operator-login' : 'public-home';
    try {
      if (getToken()) {
        await api(allDevices ? '/logout-all' : '/logout', { method: 'POST', skipAuthRedirect: true });
      }
    } catch {
      // Clear local session regardless
    } finally {
      setToken(null);
      setCurrentUser(null);
      setNotifications([]);
      setCounters({ unreadMessages: 0, unreadNotifications: 0, dueInvoices: 0, pendingReviews: 0 });
      addToast(allDevices ? 'Toutes vos sessions ont été déconnectées.' : 'Vous êtes à présent déconnecté.', 'info');
      navigate(redirectView);
    }
  };

  const markNotificationRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, read: true } : n)));
    try {
      await api(`/notifications/${notifId}/read`, { method: 'POST' });
      refreshCounters();
    } catch {
      // Ignore
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setCounters(prev => ({ ...prev, unreadNotifications: 0 }));
    try {
      await api('/notifications/read-all', { method: 'POST' });
    } catch {
      // Ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        currentUser,
        authLoading,
        categories,
        services,
        notifications,
        counters,
        currentView,
        activeRequestId,
        activeClientId,
        pendingServiceSlug,
        resetPasswordParams,
        activeServiceModal,
        activePhotoModal,
        toasts,
        confirmState,
        navigate,
        navigateFromLink,
        setActiveClientId,
        setPendingServiceSlug,
        openServiceModal,
        closeServiceModal,
        openPhotoModal,
        closePhotoModal,
        downloadDocument,
        addToast,
        removeToast,
        confirm,
        resolveConfirm,
        login,
        enterDevPreview,
        registerAccount,
        verifyEmail,
        resendVerificationEmail,
        logout,
        refreshMe,
        setCurrentUser,
        refreshCatalog,
        apiStatus,
        checkApiHealth,
        refreshCounters,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
