export type UserRole = 'USER' | 'ADMIN' | 'OPERATOR';
export type AppRole = 'VISITOR' | UserRole;

export interface NotificationPrefs {
  received?: boolean;
  quote?: boolean;
  started?: boolean;
  report?: boolean;
  done?: boolean;
  payment?: boolean;
  [key: string]: boolean | undefined;
}

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone: string;
  password?: string;
  verified: boolean;
  twoFactor: boolean;
  prefs: NotificationPrefs;
  referralCode: string;
  createdAt: string;
  suspended?: boolean;
}

export interface Category {
  id: string;
  name: string;
  short: string;
  icon: string;
  blurb: string;
  photo: string;
}

export interface ServiceField {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'select' | 'date' | 'number' | 'file' | 'tel' | 'textarea';
  options?: string[];
  accept?: string;
}

export interface Service {
  id: string;
  cat: string;
  name: string;
  icon: string;
  popular?: boolean;
  price: string;
  short: string;
  desc?: string;
  included: string[];
  fields: ServiceField[];
  photo: string;
  available?: boolean;
}

export type RequestStatus = 'pending' | 'active' | 'done' | 'cancelled';
export type UrgencyLevel = 'normal' | 'urgent';

export interface RequestHistory {
  at: string;
  text: string;
}

export interface RequestQuote {
  amount: number;
  label: string;
}

export interface RequestItem {
  id: string;
  tracking: string;
  userId: string;
  serviceId: string;
  status: RequestStatus;
  title: string;
  city: string;
  urgency: UrgencyLevel;
  budget: string;
  description: string;
  details: Record<string, any>;
  operatorId: string | null;
  quote: RequestQuote | null;
  rating: number | null;
  createdAt: string;
  history: RequestHistory[];
  notes?: Array<{ id: string; author: string; text: string; at: string }>;
}

export type Request = RequestItem;

export type DocumentType = 'report' | 'photo' | 'video' | 'receipt' | 'contract';

export interface DocumentItem {
  id: string;
  requestId: string;
  type: DocumentType;
  name: string;
  createdAt: string;
  photoName?: string;
  url?: string;
}

export interface MessageItem {
  id: string;
  requestId: string;
  from: 'client' | 'team';
  author: string;
  text: string;
  at: string;
  read: boolean;
  attachment?: string;
}

export interface InvoiceItem {
  id: string;
  requestId: string;
  userId: string;
  label: string;
  amount: number;
  status: 'paid' | 'due' | 'refunded';
  method: 'card' | 'momo' | 'wise' | string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface ReviewItem {
  id: string;
  requestId: string;
  userId: string;
  rating: number;
  comment: string;
  status: 'published' | 'pending' | 'hidden';
  at: string;
}

export interface AuditItem {
  id: string;
  at: string;
  actor: string;
  text: string;
}

export interface ReferralRecord {
  name: string;
  status: 'Actif' | 'Inscrit' | 'Inscrite';
  at: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  text: string;
  href: string;
  at: string;
  read: boolean;
}
