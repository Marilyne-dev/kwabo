export interface User {
  id: string;
  role: 'USER' | 'ADMIN' | 'OPERATOR';
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone: string;
  referralCode: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface RequestItem {
  id: string;
  tracking: string;
  userId: string;
  serviceId: string;
  status: 'pending' | 'active' | 'done' | 'cancelled';
  title: string;
  city: string;
  urgency: 'normal' | 'urgent';
  budget: string;
  description: string;
  details: Record<string, string>;
  quote?: { amount: number; label: string } | null;
  createdAt: string;
  history: Array<{ at: string; text: string }>;
}

export interface MessageItem {
  id: string;
  requestId: string;
  sender: 'client' | 'kwabo';
  senderName: string;
  text: string;
  time: string;
  attachments?: Array<{ type: string; name: string }>;
  fileUri?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  requestId?: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'quote' | 'started' | 'report' | 'done' | 'payment';
}

export interface DocumentItem {
  id: string;
  requestId: string;
  type: 'contract' | 'report' | 'video' | 'photo';
  name: string;
  date: string;
  size?: string;
}

export const INITIAL_USER: User = {
  id: 'u01',
  role: 'USER',
  firstName: 'Aïcha',
  lastName: 'Sossa',
  email: 'client@kwabo.demo',
  country: 'France',
  phone: '+33 6 12 34 56 78',
  referralCode: 'KW-AICH01',
};

export const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: 'r0001',
    tracking: 'KW-2026-0001',
    userId: 'u01',
    serviceId: 'suivi-chantier',
    status: 'active',
    title: 'Suivi de ma villa à Abomey-Calavi',
    city: 'Abomey-Calavi',
    urgency: 'normal',
    budget: '160 €/mois',
    description: 'Construction d\'une villa en cours. Je veux une visite chaque semaine et un contrôle des matériaux livrés.',
    details: {
      adresse: 'Quartier Tankpè, von face école',
      macon: 'M. Zannou, +229 01 00 00 00 10',
      stade: 'Élévation des murs',
      visite: 'Le vendredi matin',
    },
    quote: { amount: 160, label: 'Suivi de chantier, 1 mois' },
    createdAt: 'Il y a 30 jours',
    history: [
      { at: '15 janv. 2026', text: 'Demande reçue' },
      { at: '16 janv. 2026', text: 'Devis envoyé : 160 €' },
      { at: '17 janv. 2026', text: 'Mission démarrée après paiement' },
      { at: 'Hier', text: 'Rapport hebdomadaire disponible (Semaine 4)' },
    ],
  },
  {
    id: 'r0002',
    tracking: 'KW-2026-0002',
    userId: 'u01',
    serviceId: 'sante',
    status: 'pending',
    title: 'Médicaments de ma mère',
    city: 'Cotonou',
    urgency: 'urgent',
    budget: '50 €/mois',
    description: 'Ma mère a besoin de son traitement chaque mois, livré à domicile.',
    details: {
      patient: 'Mme Sossa',
      etablissement: 'CNHU de Cotonou',
    },
    quote: { amount: 45, label: 'Santé de vos proches, 1 mois' },
    createdAt: 'Hier',
    history: [
      { at: 'Hier 14:00', text: 'Demande reçue' },
      { at: 'Hier 18:30', text: 'Devis disponible : 45 €' },
    ],
  },
  {
    id: 'r0003',
    tracking: 'KW-2026-0003',
    userId: 'u01',
    serviceId: 'administratif',
    status: 'done',
    title: 'Acte de naissance de mon fils',
    city: 'Porto-Novo',
    urgency: 'normal',
    budget: '60 €',
    description: 'Obtenir une copie intégrale de l\'acte de naissance et légalisation.',
    details: {
      document: 'Acte de naissance',
      pourQui: 'Mon fils',
    },
    quote: { amount: 55, label: 'Assistance administrative' },
    createdAt: 'Il y a 2 mois',
    history: [
      { at: '10 déc. 2025', text: 'Demande reçue' },
      { at: '11 déc. 2025', text: 'Devis validé & payé : 55 €' },
      { at: '18 déc. 2025', text: 'Document retiré à la mairie' },
      { at: '20 déc. 2025', text: 'Mission terminée & expédiée' },
    ],
  },
];

export const INITIAL_MESSAGES: Record<string, MessageItem[]> = {
  r0001: [
    {
      id: 'm1',
      requestId: 'r0001',
      sender: 'kwabo',
      senderName: 'Maxime (KWABO)',
      text: 'Bonjour Madame Sossa. Notre agent a effectué la visite de vendredi sur votre chantier de Tankpè.',
      time: 'Hier 10:15',
    },
    {
      id: 'm2',
      requestId: 'r0001',
      sender: 'kwabo',
      senderName: 'Maxime (KWABO)',
      text: 'Le coulage des poutres avance bien. Nous avons déposé le rapport avec les photos et la vidéo dans votre onglet Documents.',
      time: 'Hier 10:16',
    },
    {
      id: 'm3',
      requestId: 'r0001',
      sender: 'client',
      senderName: 'Aïcha Sossa',
      text: 'Merci beaucoup Maxime ! Est-ce que le ciment livré correspond bien aux sacs commandés ?',
      time: 'Hier 11:40',
    },
    {
      id: 'm4',
      requestId: 'r0001',
      sender: 'kwabo',
      senderName: 'Maxime (KWABO)',
      text: 'Oui tout à fait, nous avons compté 50 sacs de ciment CIMBENIN conforme au bordereau.',
      time: 'Hier 12:05',
    },
  ],
  r0002: [
    {
      id: 'm10',
      requestId: 'r0002',
      sender: 'kwabo',
      senderName: 'Équipe Médicale KWABO',
      text: 'Bonjour Aïcha, nous avons préparé l\'ordonnance auprès de la pharmacie de garde à Cotonou.',
      time: 'Aujourd\'hui 09:00',
    },
  ],
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'u01',
    requestId: 'r0001',
    title: 'Rapport hebdomadaire disponible',
    message: 'La visite de votre villa à Abomey-Calavi a été effectuée. Rapport et vidéo en ligne.',
    date: 'Hier à 10:16',
    read: false,
    type: 'report',
  },
  {
    id: 'notif-2',
    userId: 'u01',
    requestId: 'r0002',
    title: 'Devis disponible',
    message: 'Votre devis de 45 € pour la livraison des médicaments est prêt pour validation.',
    date: 'Hier à 18:30',
    read: false,
    type: 'quote',
  },
  {
    id: 'notif-3',
    userId: 'u01',
    requestId: 'r0001',
    title: 'Mission démarrée',
    message: 'Votre demande de suivi de chantier est passée en statut actif.',
    date: 'Il y a 3 semaines',
    read: true,
    type: 'started',
  },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    requestId: 'r0001',
    type: 'video',
    name: 'Vidéo 360° du chantier - Semaine 4.mp4',
    date: 'Hier',
    size: '18.4 Mo',
  },
  {
    id: 'doc-2',
    requestId: 'r0001',
    type: 'report',
    name: 'Rapport d\'inspection S4 - Maçonnerie.pdf',
    date: 'Hier',
    size: '1.2 Mo',
  },
  {
    id: 'doc-3',
    requestId: 'r0001',
    type: 'photo',
    name: 'Bordereau livraison 50 sacs ciment.jpg',
    date: '10 févr. 2026',
    size: '850 Ko',
  },
  {
    id: 'doc-4',
    requestId: 'r0001',
    type: 'contract',
    name: 'Contrat de mission KWABO signé.pdf',
    date: '17 janv. 2026',
    size: '420 Ko',
  },
  {
    id: 'doc-5',
    requestId: 'r0003',
    type: 'report',
    name: 'Copie intégrale acte de naissance légalisé.pdf',
    date: '18 déc. 2025',
    size: '680 Ko',
  },
];

