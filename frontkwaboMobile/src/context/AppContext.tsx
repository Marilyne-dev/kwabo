import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';
import {
  User,
  RequestItem,
  MessageItem,
  AppNotification,
  DocumentItem,
  INITIAL_USER,
  INITIAL_REQUESTS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_DOCUMENTS,
} from '@/data/mockData';

export interface PushBannerData {
  title: string;
  message: string;
  type?: 'success' | 'payment' | 'doc' | 'info';
}

interface AppContextType {
  user: User | null;
  requests: RequestItem[];
  notifications: AppNotification[];
  documents: DocumentItem[];
  messages: Record<string, MessageItem[]>;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  loginDemo: () => void;
  logout: () => void;
  createRequest: (data: Omit<RequestItem, 'id' | 'tracking' | 'createdAt' | 'history'>) => RequestItem;
  sendMessage: (requestId: string, text: string, fileUri?: string) => void;
  markNotificationAsRead: (id: string) => void;
  simulatePush: (type: 'quote' | 'started' | 'report' | 'done' | 'payment') => void;
  notify: (title: string, message: string, type?: 'success' | 'payment' | 'doc' | 'info') => void;
  activePushBanner: PushBannerData | null;
  dismissPushBanner: () => void;
  notificationPing: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>(INITIAL_MESSAGES);
  const [activePushBanner, setActivePushBanner] = useState<PushBannerData | null>(null);
  const [notificationPing, setNotificationPing] = useState(0);
  const bannerTimeoutRef = useRef<any>(null);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = 1; // Simulation d'un message non lu

  const loginDemo = () => {
    setUser(INITIAL_USER);
  };

  const logout = () => {
    setUser(null);
  };

  const createRequest = (data: Omit<RequestItem, 'id' | 'tracking' | 'createdAt' | 'history'>) => {
    const newId = `r000${requests.length + 1}`;
    const newTracking = `KW-2026-${String(requests.length + 1).padStart(4, '0')}`;
    const newReq: RequestItem = {
      ...data,
      id: newId,
      tracking: newTracking,
      createdAt: "À l'instant",
      history: [
        { at: "À l'instant", text: 'Demande enregistrée sur KWABO' },
      ],
    };
    setRequests((prev) => [newReq, ...prev]);

    // Déclencher le tintement de cloche
    setNotificationPing((p) => p + 1);

    // Ajouter une notification automatique
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: user?.id || 'u01',
      requestId: newId,
      title: 'Nouvelle demande transmise',
      message: `Votre demande « ${newReq.title} » est bien enregistrée. Notre équipe prépare votre devis sous 24h.`,
      date: "À l'instant",
      read: false,
      type: 'quote',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newReq;
  };

  const sendMessage = (requestId: string, text: string, fileUri?: string) => {
    if (!text.trim()) return;
    const newMsg: MessageItem = {
      id: `m-${Date.now()}`,
      requestId,
      sender: 'client',
      senderName: `${user?.firstName || 'Aïcha'} ${user?.lastName || 'Sossa'}`,
      text: text.trim(),
      time: "À l'instant",
      fileUri,
    };

    setMessages((prev) => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), newMsg],
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismissPushBanner = useCallback(() => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setActivePushBanner(null);
  }, []);

  const notify = useCallback(
    (
      title: string,
      message: string,
      type: 'success' | 'payment' | 'doc' | 'info' = 'success'
    ) => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }

      setActivePushBanner({ title, message, type });
      setNotificationPing((p) => p + 1);

      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: user?.id || 'u01',
        title,
        message,
        date: "À l'instant",
        read: false,
        type: type === 'payment' ? 'payment' : type === 'doc' ? 'report' : 'quote',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      bannerTimeoutRef.current = setTimeout(() => {
        setActivePushBanner(null);
      }, 4500);
    },
    [user]
  );

  const simulatePush = (type: 'quote' | 'started' | 'report' | 'done' | 'payment') => {
    const templates = {
      quote: {
        title: 'Nouveau devis disponible',
        message: 'Le devis pour votre demande de santé a été chiffré : 45 €.',
      },
      started: {
        title: 'Mission démarrée',
        message: 'Notre agent est sur le terrain à Abomey-Calavi.',
      },
      report: {
        title: 'Nouveau rapport avec vidéo',
        message: 'Le rapport S4 et la vidéo 360° sont consultables.',
      },
      done: {
        title: 'Mission terminée',
        message: 'L\'acte de naissance a été légalisé avec succès.',
      },
      payment: {
        title: 'Paiement confirmé',
        message: 'Votre règlement de 160 € a été validé.',
      },
    };

    const push = templates[type];
    notify(push.title, push.message, type === 'payment' ? 'payment' : type === 'report' ? 'doc' : 'success');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        requests,
        notifications,
        documents,
        messages,
        unreadNotificationsCount,
        unreadMessagesCount,
        loginDemo,
        logout,
        createRequest,
        sendMessage,
        markNotificationAsRead,
        simulatePush,
        notify,
        activePushBanner,
        dismissPushBanner,
        notificationPing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

