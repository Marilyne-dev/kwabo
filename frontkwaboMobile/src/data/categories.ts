export interface ServiceCategory {
  id: 'immobilier' | 'famille' | 'demarches' | 'logistique';
  name: string;
  short: string;
  icon: string;
  blurb: string;
  badgeColor?: string;
}

export const CATEGORIES: ServiceCategory[] = [
  {
    id: 'immobilier',
    name: 'Immobilier & Foncier',
    short: 'Immobilier',
    icon: 'home',
    blurb: 'Construire, investir et sécuriser vos terrains.',
  },
  {
    id: 'famille',
    name: 'Famille & Santé',
    short: 'Famille',
    icon: 'people',
    blurb: 'Être présent pour vos proches, même à distance.',
  },
  {
    id: 'demarches',
    name: 'Démarches & Administratif',
    short: 'Démarches',
    icon: 'document-text',
    blurb: 'Vos papiers et vos dossiers, sans vous déplacer.',
  },
  {
    id: 'logistique',
    name: 'Logistique & Transferts',
    short: 'Logistique',
    icon: 'car',
    blurb: "Envoyer de l'argent, des colis et des cadeaux.",
  },
];

export const CITIES = [
  'Cotonou',
  'Abomey-Calavi',
  'Porto-Novo',
  'Ouidah',
  'Parakou',
  'Abomey',
  'Bohicon',
  'Autre ville',
];

export const COUNTRIES = [
  'France',
  'Belgique',
  'Canada',
  'États-Unis',
  'Allemagne',
  'Italie',
  'Royaume-Uni',
  'Suisse',
  'Gabon',
  "Côte d'Ivoire",
  'Sénégal',
  'Bénin',
  'Autre',
];

export const WHATSAPP_CONTACT = '+229 01 66 73 02 74';

