import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, RequestItem, DocumentItem, MessageItem, InvoiceItem, 
  ReviewItem, AuditItem, NotificationItem, AppRole, Service, RequestStatus, ReferralRecord
} from '../types';
import { 
  SEED_USERS, SEED_REQUESTS, SEED_DOCUMENTS, SEED_MESSAGES, 
  SEED_INVOICES, SEED_REVIEWS, SEED_AUDIT, SEED_NOTIFICATIONS, SEED_REFERRALS, SERVICES 
} from '../data/kwaboData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  role: AppRole;
  currentUser: User | null;
  users: User[];
  requests: RequestItem[];
  documents: DocumentItem[];
  messages: MessageItem[];
  invoices: InvoiceItem[];
  reviews: ReviewItem[];
  auditLogs: AuditItem[];
  notifications: NotificationItem[];
  referrals: Record<string, ReferralRecord[]>;
  services: Service[];
  
  // Navigation / Views
  currentView: string;
  activeRequestId: string | null;
  activeServiceModal: Service | null;
  activePhotoModal: { url: string; title: string } | null;
  toasts: Toast[];
  
  // Navigation actions
  navigate: (view: string, requestId?: string | null) => void;
  openServiceModal: (service: Service) => void;
  closeServiceModal: () => void;
  openPhotoModal: (url: string, title: string) => void;
  closePhotoModal: () => void;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  markThreadRead: (requestId: string, side: 'client' | 'team') => void;
  
  // Auth & Roles
  login: (email: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  resetPassword: (email: string, password?: string) => { success: boolean; message?: string };
  switchPersona: (targetRole: AppRole, userId?: string) => void;
  resetDemoData: () => void;
  
  // Domain Operations
  createRequest: (data: Omit<RequestItem, 'id' | 'tracking' | 'createdAt' | 'history' | 'status' | 'operatorId' | 'quote' | 'rating'>) => RequestItem;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  assignOperator: (requestId: string, operatorId: string) => void;
  setQuote: (requestId: string, amount: number, label: string) => void;
  addDocument: (doc: Omit<DocumentItem, 'id' | 'createdAt'>) => void;
  sendMessage: (requestId: string, text: string, attachment?: string) => void;
  payInvoice: (invoiceId: string, method: 'card' | 'momo' | 'wise' | string) => void;
  refundInvoice: (invoiceId: string) => void;
  createInvoice: (invoice: Omit<InvoiceItem, 'id' | 'createdAt' | 'paidAt'>) => void;
  addReview: (review: Omit<ReviewItem, 'id' | 'at' | 'status'>) => void;
  updateReviewStatus: (reviewId: string, status: 'published' | 'pending') => void;
  moderateReview: (reviewId: string, status: 'published' | 'hidden') => void;
  toggleSuspendUser: (userId: string) => void;
  eraseUser: (userId: string) => void;
  updateUserProfile: (data: Partial<User>) => void;
  addNote: (requestId: string, text: string) => void;
  addOperator: (operator: Omit<User, 'id' | 'createdAt' | 'referralCode' | 'role' | 'verified' | 'twoFactor' | 'prefs'>) => void;
  markNotificationRead: (notifId: string) => void;
  toggleServiceAvailability: (serviceId: string) => void;
  updateServicePrice: (serviceId: string, newPrice: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'kwabo_users_v3',
  REQUESTS: 'kwabo_requests_v3',
  DOCUMENTS: 'kwabo_docs_v3',
  MESSAGES: 'kwabo_msgs_v3',
  INVOICES: 'kwabo_invoices_v3',
  REVIEWS: 'kwabo_reviews_v3',
  AUDIT: 'kwabo_audit_v3',
  NOTIFS: 'kwabo_notifs_v3',
  CURRENT_ROLE: 'kwabo_role_v3',
  CURRENT_USER_ID: 'kwabo_userid_v3',
  SERVICES: 'kwabo_services_v3',
  REFERRALS: 'kwabo_referrals_v3',
};

// Route helpers for hash synchronization
export function getHashForView(view: string, reqId: string | null = null, userRole?: AppRole): string {
  switch (view) {
    case 'public-home': return '#/';
    case 'public-services': return '#/services';
    case 'login': return '#/connexion';
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
  if (parts[0] === 'connexion') return { view: 'login', reqId: null };
  if (parts[0] === 'inscription') return { view: 'register', reqId: null };
  if (parts[0] === 'mot-de-passe-oublie') return { view: 'forgot-password', reqId: null };
  if (parts[0] === 'reinitialiser-mot-de-passe') return { view: 'reset-password', reqId: null };
  if (parts[0] === 'confidentialite') return { view: 'privacy', reqId: null };
  if (parts[0] === 'cgu') return { view: 'cgu', reqId: null };
  if (parts[0] === 'services' && userRole === 'VISITOR') return { view: 'public-services', reqId: null };

  // Client space (#/espace/...)
  if (parts[0] === 'espace') {
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

  // If user is logged in as USER but visits root #/demandes or #/messages
  if (userRole === 'USER') {
    if (parts[0] === 'demandes') return parts[1] ? { view: 'client-request-detail', reqId: parts[1] } : { view: 'client-requests', reqId: null };
    if (parts[0] === 'messages') return { view: 'client-messages', reqId: parts[1] || null };
    return { view: 'client-dashboard', reqId: null };
  }

  return { view: 'public-home', reqId: null };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or use seeds
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [requests, setRequests] = useState<RequestItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : SEED_REQUESTS;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return saved ? JSON.parse(saved) : SEED_DOCUMENTS;
  });

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : SEED_MESSAGES;
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : SEED_INVOICES;
  });

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return saved ? JSON.parse(saved) : SEED_REVIEWS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : SEED_AUDIT;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : SERVICES;
  });

  const [referrals, setReferrals] = useState<Record<string, ReferralRecord[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    return saved ? JSON.parse(saved) : SEED_REFERRALS;
  });

  // Role and active user
  const [role, setRole] = useState<AppRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
    return (saved as AppRole) || 'VISITOR';
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || null;
  });

  const currentUser = users.find(u => u.id === currentUserId) || null;

  // View state
  const [currentView, setCurrentView] = useState<string>('public-home');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [activeServiceModal, setActiveServiceModal] = useState<Service | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<{ url: string; title: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents)); }, [documents]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(referrals)); }, [referrals]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role); }, [role]);
  useEffect(() => {
    if (currentUserId) localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }, [currentUserId]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const navigate = (view: string, reqId: string | null = null, syncHash: boolean = true) => {
    setCurrentView(view);
    if (reqId !== undefined) {
      setActiveRequestId(reqId);
    }
    if (syncHash) {
      const newHash = getHashForView(view, reqId, role);
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync hash routing on mount and on hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const { view, reqId } = getViewFromHash(window.location.hash, role);
      setCurrentView(view);
      setActiveRequestId(reqId);
    };

    if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#') {
      const { view, reqId } = getViewFromHash(window.location.hash, role);
      setCurrentView(view);
      setActiveRequestId(reqId);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [role]);

  const markThreadRead = (requestId: string, side: 'client' | 'team') => {
    setMessages(prev => prev.map(m => {
      if (m.requestId === requestId && m.from !== side && !m.read) {
        return { ...m, read: true };
      }
      return m;
    }));
  };

  const openServiceModal = (service: Service) => setActiveServiceModal(service);
  const closeServiceModal = () => setActiveServiceModal(null);
  const openPhotoModal = (url: string, title: string) => setActivePhotoModal({ url, title });
  const closePhotoModal = () => setActivePhotoModal(null);

  // Authentication
  const login = (email: string, _password?: string) => {
    const normalized = email.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === normalized);
    if (!found) {
      return { success: false, message: 'Adresse email non reconnue dans l\'annuaire KWABO.' };
    }
    if (found.suspended) {
      return { success: false, message: 'Ce compte utilisateur a été temporairement suspendu.' };
    }

    setCurrentUserId(found.id);
    setRole(found.role);
    addToast(`Bienvenue ${found.firstName} ! Connexion réussie.`);

    // Route to appropriate view
    if (found.role === 'ADMIN') {
      navigate('admin-dashboard');
    } else if (found.role === 'OPERATOR') {
      navigate('operator-dashboard');
    } else {
      navigate('client-dashboard');
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    setRole('VISITOR');
    addToast('Vous êtes à présent déconnecté.', 'info');
    navigate('public-home');
  };

  const resetPassword = (email: string, _newPassword?: string) => {
    const normalized = email.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === normalized);
    if (!found) {
      return { success: false, message: 'Cette adresse e-mail n\'existe pas dans notre annuaire.' };
    }
    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  };

  // Switcher de recette front-end (permet de basculer instantanément de rôle sans polluer la page de login)
  const switchPersona = (targetRole: AppRole, userId?: string) => {
    if (targetRole === 'VISITOR') {
      setCurrentUserId(null);
      setRole('VISITOR');
      addToast('Basculé en mode Visiteur public', 'info');
      navigate('public-home');
      return;
    }

    let targetUser: User | undefined;
    if (userId) {
      targetUser = users.find(u => u.id === userId);
    } else if (targetRole === 'ADMIN') {
      targetUser = users.find(u => u.role === 'ADMIN');
    } else if (targetRole === 'OPERATOR') {
      targetUser = users.find(u => u.role === 'OPERATOR');
    } else {
      targetUser = users.find(u => u.role === 'USER');
    }

    if (targetUser) {
      setCurrentUserId(targetUser.id);
      setRole(targetUser.role);
      addToast(`Mode test : connecté en tant que ${targetUser.firstName} (${targetUser.role})`, 'success');
      
      if (targetUser.role === 'ADMIN') navigate('admin-dashboard');
      else if (targetUser.role === 'OPERATOR') navigate('operator-dashboard');
      else navigate('client-dashboard');
    }
  };

  const resetDemoData = () => {
    setUsers(SEED_USERS);
    setRequests(SEED_REQUESTS);
    setDocuments(SEED_DOCUMENTS);
    setMessages(SEED_MESSAGES);
    setInvoices(SEED_INVOICES);
    setReviews(SEED_REVIEWS);
    setAuditLogs(SEED_AUDIT);
    setNotifications(SEED_NOTIFICATIONS);
    setServices(SERVICES);
    setReferrals(SEED_REFERRALS);
    addToast('Données de démonstration réinitialisées avec succès.', 'info');
  };

  // Requests
  const createRequest = (data: Omit<RequestItem, 'id' | 'tracking' | 'createdAt' | 'history' | 'status' | 'operatorId' | 'quote' | 'rating'>) => {
    const nextNum = requests.length + 1;
    const padded = String(nextNum).padStart(4, '0');
    const newReq: RequestItem = {
      ...data,
      id: `r${padded}`,
      tracking: `KW-2026-${padded}`,
      status: 'pending',
      operatorId: null,
      quote: null,
      rating: null,
      createdAt: new Date().toISOString(),
      history: [
        { at: new Date().toISOString(), text: 'Demande enregistrée sur la plateforme' }
      ]
    };

    setRequests(prev => [newReq, ...prev]);

    // Add audit entry
    const actorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Nouveau client';
    setAuditLogs(prev => [
      { id: `j-${Date.now()}`, at: new Date().toISOString(), actor: actorName, text: `Nouvelle demande créée : ${newReq.title} (${newReq.tracking})` },
      ...prev
    ]);

    // Admin notification
    setNotifications(prev => [
      { id: `n-${Date.now()}`, userId: 'u10', text: `Nouvelle demande : ${newReq.title}`, href: `admin-requests/${newReq.id}`, at: new Date().toISOString(), read: false },
      ...prev
    ]);

    addToast('Votre demande a été transmise avec succès à l\'équipe KWABO !');
    return newReq;
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const statusLabels: Record<RequestStatus, string> = {
        pending: 'Mise en attente',
        active: 'Mission démarrée et active',
        done: 'Mission finalisée avec succès',
        cancelled: 'Mission annulée'
      };
      return {
        ...r,
        status,
        history: [
          ...r.history,
          { at: new Date().toISOString(), text: `Statut mis à jour : ${statusLabels[status]}` }
        ]
      };
    }));

    setAuditLogs(prev => [
      { id: `j-${Date.now()}`, at: new Date().toISOString(), actor: currentUser ? currentUser.firstName : 'Admin', text: `Demande #${requestId} passée à l'état ${status}` },
      ...prev
    ]);

    addToast(`Le statut de la demande a été mis à jour : ${status}`);
  };

  const assignOperator = (requestId: string, operatorId: string) => {
    const op = users.find(u => u.id === operatorId);
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        operatorId,
        history: [
          ...r.history,
          { at: new Date().toISOString(), text: `Mission confiée à l'agent terrain ${op ? op.firstName + ' ' + op.lastName : operatorId}` }
        ]
      };
    }));

    setAuditLogs(prev => [
      { id: `j-${Date.now()}`, at: new Date().toISOString(), actor: 'Équipe KWABO', text: `Attribution mission #${requestId} à ${op ? op.firstName : operatorId}` },
      ...prev
    ]);

    addToast(`Mission assignée à ${op ? op.firstName + ' ' + op.lastName : 'l\'agent'}`);
  };

  const setQuote = (requestId: string, amount: number, label: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        quote: { amount, label },
        history: [
          ...r.history,
          { at: new Date().toISOString(), text: `Devis émis : ${amount} € (${label})` }
        ]
      };
    }));

    // Create an invoice in due state
    const targetReq = requests.find(r => r.id === requestId);
    if (targetReq) {
      createInvoice({
        requestId,
        userId: targetReq.userId,
        label,
        amount,
        status: 'due',
        method: null
      });

      // Notify client
      setNotifications(prev => [
        { id: `n-${Date.now()}`, userId: targetReq.userId, text: `Votre devis pour « ${targetReq.title} » est prêt (${amount} €)`, href: `requests-detail/${requestId}`, at: new Date().toISOString(), read: false },
        ...prev
      ]);
    }

    addToast(`Devis de ${amount} € enregistré pour la demande #${requestId}`);
  };

  const addDocument = (doc: Omit<DocumentItem, 'id' | 'createdAt'>) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setDocuments(prev => [newDoc, ...prev]);

    // Update request history
    setRequests(prev => prev.map(r => {
      if (r.id !== doc.requestId) return r;
      return {
        ...r,
        history: [
          ...r.history,
          { at: new Date().toISOString(), text: `Nouveau document déposé : ${doc.name}` }
        ]
      };
    }));

    addToast(`Document « ${doc.name} » déposé avec succès.`);
  };

  const sendMessage = (requestId: string, text: string, attachment?: string) => {
    if (!text.trim() && !attachment) return;
    const isTeam = role === 'ADMIN' || role === 'OPERATOR';
    const authorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Client';
    
    const newMsg: MessageItem = {
      id: `m-${Date.now()}`,
      requestId,
      from: isTeam ? 'team' : 'client',
      author: authorName,
      text: text.trim(),
      attachment,
      at: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, newMsg]);
  };

  const payInvoice = (invoiceId: string, method: 'card' | 'momo' | 'wise' | string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      return {
        ...inv,
        status: 'paid',
        method: method as any,
        paidAt: new Date().toISOString()
      };
    }));

    // Update associated request status to active if pending
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setRequests(prev => prev.map(r => {
        if (r.id !== inv.requestId) return r;
        return {
          ...r,
          status: 'active',
          history: [
            ...r.history,
            { at: new Date().toISOString(), text: `Paiement reçu (${inv.amount} € via ${String(method).toUpperCase()}) - Mission activée` }
          ]
        };
      }));

      setAuditLogs(prev => [
        { id: `j-${Date.now()}`, at: new Date().toISOString(), actor: 'Paiement', text: `Encaissement ${inv.amount} € (${String(method).toUpperCase()}) pour facture #${invoiceId}` },
        ...prev
      ]);
    }

    addToast('Paiement validé avec succès ! Votre mission démarre immédiatement.');
  };

  const refundInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'refunded' } : inv));
    addToast(`Facture #${invoiceId} marquée comme remboursée.`);
  };

  const createInvoice = (invoice: Omit<InvoiceItem, 'id' | 'createdAt' | 'paidAt'>) => {
    const invNum = invoices.length + 1;
    const newInv: InvoiceItem = {
      ...invoice,
      id: `F-2026-${String(invNum).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      paidAt: null
    };
    setInvoices(prev => [newInv, ...prev]);
  };

  const addReview = (review: Omit<ReviewItem, 'id' | 'at' | 'status'>) => {
    const newReview: ReviewItem = {
      ...review,
      id: `a-${Date.now()}`,
      status: 'pending',
      at: new Date().toISOString()
    };
    setReviews(prev => [newReview, ...prev]);
    addToast('Merci pour votre avis ! Il sera visible après validation par notre équipe.');
  };

  const updateReviewStatus = (reviewId: string, status: 'published' | 'pending') => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
    addToast(`Avis ${status === 'published' ? 'publié' : 'mis en modération'}.`);
  };

  const moderateReview = (reviewId: string, status: 'published' | 'hidden') => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
    addToast(`Avis ${status === 'published' ? 'publié' : 'masqué'}.`);
  };

  const toggleSuspendUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: !u.suspended } : u));
    const target = users.find(u => u.id === userId);
    addToast(`Compte de ${target?.firstName} ${target?.suspended ? 'réactivé' : 'suspendu'}.`);
  };

  const eraseUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    addToast('Données du compte effacées conformément au RGPD.');
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (currentUser) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
    }
  };

  const addNote = (requestId: string, text: string) => {
    const author = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin';
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const notes = r.notes || [];
      return {
        ...r,
        notes: [...notes, { id: `note-${Date.now()}`, author, text, at: new Date().toISOString() }]
      };
    }));
    addToast('Note interne ajoutée.');
  };

  const addOperator = (operatorData: Omit<User, 'id' | 'createdAt' | 'referralCode' | 'role' | 'verified' | 'twoFactor' | 'prefs'>) => {
    const newOp: User = {
      ...operatorData,
      id: `u${users.length + 1}`,
      role: 'OPERATOR',
      verified: true,
      twoFactor: false,
      prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
      referralCode: `KW-${operatorData.firstName.toUpperCase().slice(0, 4)}${users.length + 1}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newOp]);
    addToast(`Agent terrain ${newOp.firstName} ${newOp.lastName} ajouté.`);
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const toggleServiceAvailability = (serviceId: string) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, available: !s.available } : s));
    addToast('Disponibilité du service modifiée.');
  };

  const updateServicePrice = (serviceId: string, newPrice: string) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, price: newPrice } : s));
    addToast('Tarif du service mis à jour.');
  };

  return (
    <AppContext.Provider value={{
      role,
      currentUser,
      users,
      requests,
      documents,
      messages,
      invoices,
      reviews,
      auditLogs,
      notifications,
      referrals,
      services,
      currentView,
      activeRequestId,
      activeServiceModal,
      activePhotoModal,
      toasts,
      navigate,
      openServiceModal,
      closeServiceModal,
      openPhotoModal,
      closePhotoModal,
      addToast,
      removeToast,
      markThreadRead,
      login,
      logout,
      switchPersona,
      resetDemoData,
      createRequest,
      updateRequestStatus,
      assignOperator,
      setQuote,
      addDocument,
      sendMessage,
      payInvoice,
      refundInvoice,
      createInvoice,
      addReview,
      updateReviewStatus,
      moderateReview,
      toggleSuspendUser,
      eraseUser,
      updateUserProfile,
      addNote,
      addOperator,
      markNotificationRead,
      toggleServiceAvailability,
      updateServicePrice,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
