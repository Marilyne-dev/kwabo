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
  /** chemin API de la pièce jointe (ex. /messages/12/attachment), téléchargée avec le jeton */
  attachmentPath?: string;
}

export interface ThreadInfo {
  requestId: string;
  lastText: string;
  lastAuthor: string;
  lastAt: string;
  unread: number;
}

export interface InvoiceItem {
  id: string;
  number: string;
  label: string;
  amount: number;
  status: 'due' | 'paid' | 'refunded' | 'cancelled';
  method?: string;
  createdAt: string;
  paidAt?: string;
  requestId: string;
  tracking: string;
  title: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  requestId?: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'quote' | 'started' | 'report' | 'done' | 'payment' | 'info';
}

export interface DocumentItem {
  id: string;
  requestId: string;
  type: 'contract' | 'report' | 'video' | 'photo' | 'receipt';
  name: string;
  date: string;
  size?: string;
  /** chemin API de téléchargement (ex. /documents/5/download) */
  downloadPath?: string;
}
