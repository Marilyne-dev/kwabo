import { Category, Service, User, RequestItem, DocumentItem, MessageItem, InvoiceItem, ReviewItem, AuditItem, NotificationItem } from '../types';

export const WHATSAPP_NUMBER = '2290166730274';
export const WHATSAPP_DISPLAY = '+229 01 66 73 02 74';
export const getWhatsAppLink = (text: string = 'Bonjour KWABO, je souhaite un renseignement') =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%20KWABO%2C%20je%20souhaite%20un%20renseignement`;

export const CITIES = ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Ouidah', 'Parakou', 'Abomey', 'Bohicon', 'Autre ville'];
export const COUNTRIES = ['France', 'Belgique', 'Canada', 'États-Unis', 'Allemagne', 'Italie', 'Royaume-Uni', 'Suisse', 'Gabon', 'Côte d\'Ivoire', 'Sénégal', 'Bénin', 'Autre'];
export const DIAL_CODES = ['+33', '+32', '+1', '+49', '+39', '+44', '+41', '+241', '+225', '+221', '+229'];

export const CATEGORIES: Category[] = [
  { 
    id: 'immobilier', 
    name: 'Immobilier & Foncier', 
    short: 'Immobilier', 
    icon: 'Building2', 
    blurb: 'Construire, investir et sécuriser vos terrains avec des experts locaux.',
    photo: '/assets/photos/chantier-tour-500.jpg'
  },
  { 
    id: 'famille', 
    name: 'Famille & Santé', 
    short: 'Famille', 
    icon: 'Users', 
    blurb: 'Être présent pour vos proches, même à 6 000 km de distance.',
    photo: '/assets/photos/ganvie-pirogue-500.jpg'
  },
  { 
    id: 'demarches', 
    name: 'Démarches & Administratif', 
    short: 'Démarches', 
    icon: 'FileText', 
    blurb: 'Vos papiers, dossiers visa et formalités sans vous déplacer.',
    photo: '/assets/photos/aeroport-500.jpg'
  },
  { 
    id: 'logistique', 
    name: 'Logistique & Transferts', 
    short: 'Logistique', 
    icon: 'Truck', 
    blurb: 'Envoyer des colis, des fonds au meilleur taux et recevoir des produits locaux.',
    photo: '/assets/photos/port-500.jpg'
  },
];

export const SERVICES: Service[] = [
  {
    id: 'suivi-chantier',
    cat: 'immobilier',
    name: 'Suivi de chantier',
    icon: 'Building',
    popular: true,
    price: '120-200 €/mois',
    short: 'Visite hebdo, vidéo 360°, contrôle des matériaux, rapport écrit sous 24h.',
    photo: '/assets/photos/chantier-500.jpg',
    available: true,
    included: [
      'Visite hebdomadaire programmée ou inopinée',
      'Vidéo 360° et photos détaillées datées',
      'Contrôle qualité des matériaux livrés',
      'Rapport technique écrit avec avis ingénieur'
    ],
    fields: [
      { name: 'adresse', label: 'Adresse exacte du chantier', required: true, placeholder: 'Ex: Calavi, quartier Arconville...' },
      { name: 'gps', label: 'Coordonnées GPS (si disponibles)', placeholder: '6.3703, 2.3912' },
      { name: 'macon', label: 'Nom et contact du chef maçon', placeholder: 'M. Zannou, +229...' },
      { name: 'stade', label: 'Stade d\'avancement actuel', type: 'select', options: ['Terrain nu', 'Fondations', 'Élévation des murs', 'Toiture', 'Finitions'] },
      { name: 'visite', label: 'Jour de passage préféré', placeholder: 'Ex: Vendredi matin' },
    ],
  },
  {
    id: 'investissement',
    cat: 'immobilier',
    name: 'Investissement immobilier',
    icon: 'Home',
    popular: true,
    price: 'Dès 300 €/dossier',
    short: 'Recherche de biens vérifiés, visite technique contradictoire et gestion locative.',
    photo: '/assets/photos/quartier-500.jpg',
    available: true,
    included: [
      'Prospection et sélection de biens titrés',
      'Visite contradictoire et audit technique',
      'Mise en gestion locative et encaissement'
    ],
    fields: [
      { name: 'bien', label: 'Type de bien recherché', type: 'select', options: ['Terrain', 'Maison', 'Appartement', 'Immeuble de rapport'] },
      { name: 'zone', label: 'Zone géographique souhaitée', placeholder: 'Ex: Fidjrossè, Calavi, Togbin...' },
      { name: 'objectif', label: 'Objectif du projet', type: 'select', options: ['Y habiter à terme', 'Mettre en location', 'Plus-value à la revente'] },
    ],
  },
  {
    id: 'foncier',
    cat: 'immobilier',
    name: 'Accompagnement foncier',
    icon: 'MapPin',
    price: 'Dès 500 €',
    short: 'Vérification de titre ANDF, accompagnement notaire, bornage et état des lieux GPS.',
    photo: '/assets/photos/terrain-500.jpg',
    available: true,
    included: [
      'Vérification légale auprès de l\'ANDF',
      'Accompagnement physique chez le notaire',
      'Contrôle de bornage et relevé contradictoire GPS'
    ],
    fields: [
      { name: 'parcelle', label: 'Localisation de la parcelle', required: true, placeholder: 'Commune, arrondissement, lotissement...' },
      { name: 'titre', label: 'Numéro de titre foncier ou convention' },
      { name: 'besoin', label: 'Votre besoin immédiat', type: 'select', options: ['Vérifier un titre avant achat', 'Sécuriser et borner', 'Régulariser un titre foncier'] },
    ],
  },
  {
    id: 'soutien-famille',
    cat: 'famille',
    name: 'Soutien famille quotidien',
    icon: 'HeartHandshake',
    price: '15-45 €/mois',
    short: 'Règlement factures SBEE/SONEB, courses au marché, visite de courtoisie aux parents.',
    photo: '/assets/photos/marche-ganvie-500.jpg',
    available: true,
    included: [
      'Paiement des factures SBEE (électricité) et SONEB (eau)',
      'Livraison des courses au domicile des parents',
      'Visite de courtoisie avec rapport et photo souriante'
    ],
    fields: [
      { name: 'beneficiaire', label: 'Nom complet du parent ou proche', required: true },
      { name: 'telephone', label: 'Numéro de téléphone du proche', type: 'tel' },
      { name: 'frequence', label: 'Fréquence de passage', type: 'select', options: ['Chaque semaine', 'Chaque quinzaine', 'Une fois par mois', 'Intervention ponctuelle'] },
    ],
  },
  {
    id: 'sante',
    cat: 'famille',
    name: 'Santé de vos proches',
    icon: 'Activity',
    popular: true,
    price: 'Dès 25 €/mois',
    short: 'Paiement direct à la clinique, livraison d\'ordonnances, suivi mutuelle et bilan.',
    photo: '/assets/photos/pharmacie-500.jpg',
    available: true,
    included: [
      'Paiement direct et sécurisé à l\'hôpital ou pharmacie',
      'Livraison à domicile des médicaments prescrits',
      'Transmission systématique de la feuille de soins et du reçu officiel'
    ],
    fields: [
      { name: 'patient', label: 'Nom et prénom du patient', required: true },
      { name: 'pathologie', label: 'Nature du traitement ou pathologie' },
      { name: 'etablissement', label: 'Établissement ou pharmacie habituelle', placeholder: 'CNHU, Clinique Mahouna...' },
      { name: 'budgetMensuel', label: 'Budget mensuel alloué', placeholder: 'Ex: 50 €/mois' },
    ],
  },
  {
    id: 'evenements',
    cat: 'famille',
    name: 'Événements à distance',
    icon: 'Calendar',
    price: 'Dès 300 €',
    short: 'Mariage, baptême, funérailles, dot, organisation sur place et streaming privé.',
    photo: '/assets/photos/mariage-500.jpg',
    available: true,
    included: [
      'Coordination avec les prestataires sur place',
      'Gestion et distribution sécurisée des enveloppes et vivres',
      'Diffusion vidéo privée en direct haute définition'
    ],
    fields: [
      { name: 'evenement', label: 'Type d\'événement', type: 'select', options: ['Mariage traditionnel / Dot', 'Mariage civil / religieux', 'Funérailles', 'Baptême', 'Autre célébration'] },
      { name: 'dateEvenement', label: 'Date prévue', type: 'date' },
      { name: 'lieu', label: 'Lieu de la cérémonie', placeholder: 'Ville, quartier, paroisse...' },
    ],
  },
  {
    id: 'faire-venir',
    cat: 'demarches',
    name: 'Faire venir un proche',
    icon: 'Plane',
    popular: true,
    price: 'Dès 200 €/dossier',
    short: 'Montage du dossier visa complet, lettre d\'accueil, inscription école ou université.',
    photo: '/assets/photos/aeroport-500.jpg',
    available: true,
    included: [
      'Vérification méthodique de toutes les pièces consulaires',
      'Assistance lettre d\'invitation et prise en charge',
      'Orientation démarches Campus France / inscriptions'
    ],
    fields: [
      { name: 'parente', label: 'Lien de parenté avec le voyageur', required: true, placeholder: 'Enfant, nièce, conjoint, parent...' },
      { name: 'visa', label: 'Type de visa visé', type: 'select', options: ['Études / Université', 'Visite familiale', 'Regroupement familial', 'Tourisme / Affaires'] },
      { name: 'destination', label: 'Pays de destination', required: true, placeholder: 'France, Belgique, Canada...' },
      { name: 'depart', label: 'Date approximative de départ', type: 'date' },
    ],
  },
  {
    id: 'comptabilite',
    cat: 'demarches',
    name: 'Comptabilité & Entreprise',
    icon: 'Briefcase',
    popular: true,
    price: 'Dès 80 €/mois',
    short: 'Création d\'entreprise APIEx (RCCM, IFU), tenue comptable et déclarations fiscales DGI.',
    photo: '/assets/photos/rue-cotonou-500.jpg',
    available: true,
    included: [
      'Création en 72h via le guichet unique APIEx',
      'Tenue comptable SYSCOHADA révisé',
      'Télédéclarations fiscales mensuelles et annuelles'
    ],
    fields: [
      { name: 'besoinCompta', label: 'Votre projet', type: 'select', options: ['Créer une SARL / SAS', 'Créer une Entreprise Individuelle', 'Tenue de comptabilité mensuelle', 'Régularisation fiscale'] },
      { name: 'activite', label: 'Secteur d\'activité envisagé', placeholder: 'Agroalimentaire, tech, import-export...' },
    ],
  },
  {
    id: 'administratif',
    cat: 'demarches',
    name: 'Assistance administrative',
    icon: 'FileCheck',
    price: 'Dès 50 €/démarche',
    short: 'Passeport biométrique, CIP, acte de naissance légalisé, casier judiciaire en ligne.',
    photo: '/assets/photos/mairie-500.jpg',
    available: true,
    included: [
      'Dépôt et retrait auprès des mairies et ministères',
      'Légalisation auprès des tribunaux et affaires étrangères',
      'Envoi sécurisé par courrier express international (DHL)'
    ],
    fields: [
      { name: 'document', label: 'Document recherché', type: 'select', options: ['Passeport biométrique', 'Certificat d\'Identification Personnelle (CIP)', 'Acte de naissance sécurisé', 'Casier judiciaire', 'Certificat de nationalité', 'Autre'] },
      { name: 'pourQui', label: 'Pour qui ?', placeholder: 'Pour moi-même, pour mon parent...' },
    ],
  },
  {
    id: 'transfert',
    cat: 'logistique',
    name: 'Transfert d\'argent optimisé',
    icon: 'Banknote',
    price: '2 % max',
    short: 'Taux direct EUR → FCFA garanti, virement Mobile Money (MTN/Moov) ou banque sous 2h.',
    photo: '/assets/photos/zemidjan-500.jpg',
    available: true,
    included: [
      'Taux officiel sans commission cachée',
      'Envoi instantané sur compte MTN Mobile Money ou Moov Money',
      'Reçu de transaction numéroté immédiat'
    ],
    fields: [
      { name: 'montant', label: 'Montant à envoyer (€)', type: 'number', required: true, placeholder: '200' },
      { name: 'reception', label: 'Mode de réception au Bénin', type: 'select', options: ['MTN Mobile Money', 'Moov Money', 'Virement bancaire (BOA, Ecobank, UBA, etc.)'] },
      { name: 'beneficiaireTransfert', label: 'Nom complet du destinataire', required: true },
    ],
  },
  {
    id: 'fret',
    cat: 'logistique',
    name: 'Frais Europe → Bénin',
    icon: 'Package',
    popular: true,
    price: 'Dès 3 €/kg',
    short: 'Groupage maritime mensuel ou aérien hebdomadaire avec dédouanement complet au port de Cotonou.',
    photo: '/assets/photos/port-cargo-500.jpg',
    available: true,
    included: [
      'Enlèvement en Île-de-France, Bruxelles ou dépôt relais',
      'Prise en charge douanière intégrale à Cotonou',
      'Livraison à domicile possible ou retrait entrepôt'
    ],
    fields: [
      { name: 'villeEnvoi', label: 'Ville de départ en Europe', required: true, placeholder: 'Paris, Lyon, Bruxelles, Montréal...' },
      { name: 'nature', label: 'Nature des colis', placeholder: 'Effets personnels, pièces auto, électroménager...' },
      { name: 'poids', label: 'Poids estimé (kg)', type: 'number', placeholder: '50' },
      { name: 'mode', label: 'Mode de transport', type: 'select', options: ['Maritime (3 à 4 semaines, économique)', 'Aérien (5 à 7 jours, rapide)'] },
      { name: 'destinataire', label: 'Nom et contact du destinataire à Cotonou' },
    ],
  },
  {
    id: 'cadeaux',
    cat: 'logistique',
    name: 'Cadeaux & produits du Bénin',
    icon: 'Gift',
    price: '+30 €/envoi',
    short: 'Sodabi artisanal, tissus Wax originaux, beurre de karité pur, bijoux et expédition DHL.',
    photo: '/assets/photos/wax-500.jpg',
    available: true,
    included: [
      'Sélection rigoureuse chez les artisans locaux réputés',
      'Conditionnement soigné aux normes aériennes',
      'Expédition express avec numéro de suivi international'
    ],
    fields: [
      { name: 'produits', label: 'Produits souhaités', required: true, placeholder: 'Ex: 2 bouteilles de sodabi traditionnel, pagnes wax Vlisco, karité de Natitingou...' },
      { name: 'paysEnvoi', label: 'Pays et adresse de livraison en Europe/Amérique' },
    ],
  },
];

export const TRUST_POINTS = [
  { icon: 'Video', title: 'Vidéos 360° et photos datées', text: 'Chaque visite est géolocalisée et filmée pour voir l\'avancement réel sans tricher.' },
  { icon: 'Receipt', title: 'Reçus scannés à l\'euro près', text: 'Toutes les dépenses engagées (matériaux, ordonnances, taxes) ont leur facture jointe.' },
  { icon: 'FileSignature', title: 'Contrat de mission signé', text: 'Engagements clairs, calendrier de passage et livrables garantis avant le démarrage.' },
  { icon: 'ShieldCheck', title: 'Devis ferme et transparent', text: 'Aucun frais caché ni mauvaise surprise : vous validez avant de payer.' },
];

export const FAQ_LIST = [
  { 
    q: 'Comment être sûr que le travail est réellement effectué sur place ?', 
    a: 'Pour chaque mission, un agent terrain KWABO dédié se rend physiquement sur place. Vous recevez dans votre espace client des vidéos 360°, des photographies horodatées et géolocalisées, ainsi que les factures et reçus scannés de chaque dépense effectuée.' 
  },
  { 
    q: 'La création de compte et la demande de devis sont-elles gratuites ?', 
    a: 'Oui, à 100 %. L\'inscription et l\'émission de votre devis détaillé sont gratuites et sans aucun engagement. Vous ne réglez qu\'après avoir validé le devis qui vous convient.' 
  },
  { 
    q: 'Quels sont les moyens de paiement acceptés pour la diaspora ?', 
    a: 'Nous acceptons les cartes bancaires internationales (Visa, Mastercard sécurisées par Stripe), les virements SEPA et Wise, ainsi que les transferts Mobile Money (MTN Bénin, Moov Money, Orange Money).' 
  },
  { 
    q: 'En combien de temps ai-je une réponse à ma demande ?', 
    a: 'Notre équipe locale à Cotonou étudie votre demande et vous transmet un devis clair et précis sous 12 à 24 heures maximum.' 
  },
  { 
    q: 'Puis-je échanger directement avec mon agent sur le terrain ?', 
    a: 'Oui ! Chaque mission dispose d\'un fil de messagerie dédié dans votre espace client. De plus, notre support client est joignable directement par WhatsApp 7j/7.' 
  },
  { 
    q: 'Où se situe l\'équipe physique de KWABO au Bénin ?', 
    a: 'Notre siège opérationnel est situé à Cotonou (Haie Vive), avec des agents mobiles intervenant à Cotonou, Abomey-Calavi, Porto-Novo, Ouidah, Parakou et Bohicon.' 
  },
];

export const SEED_USERS: User[] = [
  {
    id: 'u01',
    role: 'USER',
    firstName: 'Aïcha',
    lastName: 'Sossa',
    email: 'client@kwabo.demo',
    country: 'France',
    phone: '+33 6 12 34 56 78',
    password: 'demo',
    verified: true,
    twoFactor: false,
    prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
    referralCode: 'KW-AICH01',
    createdAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'u02',
    role: 'USER',
    firstName: 'Romuald',
    lastName: 'Agbo',
    email: 'romuald@exemple.com',
    country: 'Belgique',
    phone: '+32 470 12 34 56',
    password: 'demo',
    verified: true,
    twoFactor: false,
    prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
    referralCode: 'KW-ROMU02',
    createdAt: '2026-09-30T10:00:00Z',
  },
  {
    id: 'u03',
    role: 'USER',
    firstName: 'Clarisse',
    lastName: 'Houngbo',
    email: 'clarisse@exemple.com',
    country: 'Canada',
    phone: '+1 514 555 0147',
    password: 'demo',
    verified: true,
    twoFactor: false,
    prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
    referralCode: 'KW-CLAR03',
    createdAt: '2026-10-28T10:00:00Z',
  },
  {
    id: 'u10',
    role: 'ADMIN',
    firstName: 'Équipe',
    lastName: 'KWABO',
    email: 'admin@kwabo.demo',
    country: 'Bénin',
    phone: '+229 01 00 00 00 00',
    password: 'demo',
    verified: true,
    twoFactor: true,
    prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
    referralCode: 'KW-ADMI10',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'u11',
    role: 'OPERATOR',
    firstName: 'Maxime',
    lastName: 'Dossou',
    email: 'agent@kwabo.demo',
    country: 'Bénin',
    phone: '+229 01 00 00 00 01',
    password: 'demo',
    verified: true,
    twoFactor: false,
    prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
    referralCode: 'KW-MAXI11',
    createdAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'u12',
    role: 'OPERATOR',
    firstName: 'Sènan',
    lastName: 'Kpadé',
    email: 'senan@kwabo.demo',
    country: 'Bénin',
    phone: '+229 01 00 00 00 02',
    password: 'demo',
    verified: true,
    twoFactor: false,
    prefs: { received: true, quote: true, started: true, report: true, done: true, payment: true },
    referralCode: 'KW-SENA12',
    createdAt: '2026-03-01T09:00:00Z',
  },
];

export const SEED_REQUESTS: RequestItem[] = [
  {
    id: 'r0001',
    tracking: 'KW-2026-0001',
    userId: 'u01',
    serviceId: 'suivi-chantier',
    status: 'active',
    title: 'Suivi de ma villa R+1 à Abomey-Calavi',
    city: 'Abomey-Calavi',
    urgency: 'normal',
    budget: '160 €/mois',
    description: 'Construction d\'une villa en cours. Je souhaite une visite chaque semaine, le contrôle scrupuleux des matériaux livrés et un rapport détaillé avec vidéo 360°.',
    details: {
      adresse: 'Quartier Tankpè, von face école les Pépites',
      macon: 'M. Zannou, +229 01 00 00 00 10',
      stade: 'Élévation des murs',
      visite: 'Le vendredi matin',
      gps: '6.4475, 2.3556'
    },
    operatorId: 'u11',
    quote: { amount: 160, label: 'Suivi de chantier mensuel avec vidéo 360°' },
    rating: null,
    createdAt: '2026-10-10T14:20:00Z',
    history: [
      { at: '2026-10-10T14:20:00Z', text: 'Demande reçue et enregistrée' },
      { at: '2026-10-11T09:15:00Z', text: 'Devis envoyé : 160 €' },
      { at: '2026-10-12T11:00:00Z', text: 'Paiement confirmé par Wise - Mission activée' },
      { at: '2026-10-12T14:00:00Z', text: 'Mission assignée à Maxime Dossou (Agent terrain)' },
      { at: '2026-10-19T16:30:00Z', text: 'Rapport de passage semaine 1 déposé' },
      { at: '2026-10-26T17:00:00Z', text: 'Rapport semaine 2 déposé avec vidéo 360°' },
      { at: '2026-11-06T15:20:00Z', text: 'Rapport semaine 4 et photos des briques déposés' },
    ],
  },
  {
    id: 'r0002',
    tracking: 'KW-2026-0002',
    userId: 'u01',
    serviceId: 'sante',
    status: 'pending',
    title: 'Traitement médical mensuel de ma mère',
    city: 'Cotonou',
    urgency: 'urgent',
    budget: '50 €/mois',
    description: 'Ma mère a besoin de son traitement pour la tension chaque mois, livré directement à son domicile de Fidjrossè avec le reçu officiel de la pharmacie.',
    details: {
      patient: 'Mme Sossa Philomène',
      etablissement: 'CNHU de Cotonou & Pharmacie Camp Guézo',
      pathologie: 'Traitement cardio-vasculaire régulier'
    },
    operatorId: 'u11',
    quote: { amount: 45, label: 'Santé & livraison de médicaments (1 mois)' },
    rating: null,
    createdAt: '2026-11-08T18:45:00Z',
    history: [
      { at: '2026-11-08T18:45:00Z', text: 'Demande urgente reçue' },
      { at: '2026-11-09T08:00:00Z', text: 'Devis établi : 45 €' },
    ],
  },
  {
    id: 'r0003',
    tracking: 'KW-2026-0003',
    userId: 'u01',
    serviceId: 'administratif',
    status: 'done',
    title: 'Copie intégrale d\'acte de naissance de mon fils',
    city: 'Porto-Novo',
    urgency: 'normal',
    budget: '60 €',
    description: 'Obtenir une copie intégrale légalisée de l\'acte de naissance à la mairie centrale de Porto-Novo puis scan haute résolution et envoi DHL.',
    details: {
      document: 'Acte de naissance',
      pourQui: 'Mon fils Samuel'
    },
    operatorId: 'u12',
    quote: { amount: 55, label: 'Démarche d\'état-civil & légalisation' },
    rating: 5,
    createdAt: '2026-08-25T11:00:00Z',
    history: [
      { at: '2026-08-25T11:00:00Z', text: 'Demande reçue' },
      { at: '2026-08-26T10:00:00Z', text: 'Devis envoyé : 55 €' },
      { at: '2026-08-27T09:30:00Z', text: 'Paiement reçu par Carte bancaire' },
      { at: '2026-09-02T16:00:00Z', text: 'Acte retiré, légalisé et scanné dans vos documents' },
      { at: '2026-09-05T12:00:00Z', text: 'Mission terminée avec succès' },
    ],
  },
  {
    id: 'r0004',
    tracking: 'KW-2026-0004',
    userId: 'u02',
    serviceId: 'fret',
    status: 'pending',
    title: 'Envoi cartons de Bruxelles vers Cotonou',
    city: 'Cotonou',
    urgency: 'normal',
    budget: '180 €',
    description: 'Deux cartons de vêtements d\'enfants et petit électroménager à acheminer pour ma famille à Akpakpa.',
    details: {
      villeEnvoi: 'Bruxelles',
      poids: '45',
      mode: 'Maritime'
    },
    operatorId: null,
    quote: null,
    rating: null,
    createdAt: '2026-11-09T04:10:00Z',
    history: [
      { at: '2026-11-09T04:10:00Z', text: 'Demande en cours d\'analyse par l\'équipe fret' },
    ],
  },
  {
    id: 'r0005',
    tracking: 'KW-2026-0005',
    userId: 'u03',
    serviceId: 'faire-venir',
    status: 'active',
    title: 'Dossier visa études pour ma nièce vers le Canada',
    city: 'Parakou',
    urgency: 'normal',
    budget: '300 €',
    description: 'Vérification et montage complet du dossier consulaire pour l\'Université de Montréal.',
    details: {
      parente: 'Nièce (Honorine Houngbo)',
      visa: 'Études',
      destination: 'Canada'
    },
    operatorId: 'u12',
    quote: { amount: 250, label: 'Accompagnement visa études complet' },
    rating: null,
    createdAt: '2026-10-27T08:00:00Z',
    history: [
      { at: '2026-10-27T08:00:00Z', text: 'Demande enregistrée' },
      { at: '2026-10-28T09:00:00Z', text: 'Devis validé : 250 €' },
      { at: '2026-10-29T10:00:00Z', text: 'Paiement reçu par Mobile Money' },
      { at: '2026-11-02T14:00:00Z', text: 'Pièces consulaires rassemblées et certifiées' },
    ],
  },
];

export const SEED_DOCUMENTS: DocumentItem[] = [
  { id: 'd1', requestId: 'r0001', type: 'contract', name: 'Contrat de mission signé - Villa Calavi.pdf', createdAt: '2026-10-12T11:30:00Z' },
  { id: 'd2', requestId: 'r0001', type: 'report', name: 'Rapport de visite semaine 3.pdf', createdAt: '2026-10-26T17:00:00Z' },
  { id: 'd3', requestId: 'r0001', type: 'report', name: 'Rapport de visite semaine 4 - Contrôle maçonnerie.pdf', createdAt: '2026-11-06T15:00:00Z' },
  { id: 'd4', requestId: 'r0001', type: 'video', name: 'Vidéo 360° du chantier - Élévation des murs.mp4', createdAt: '2026-11-06T15:10:00Z', photoName: 'chantier-tour' },
  { id: 'd5', requestId: 'r0001', type: 'photo', name: 'Contrôle livraison 200 sacs de ciment.jpg', createdAt: '2026-11-05T10:15:00Z', photoName: 'chantier-terrain' },
  { id: 'd6', requestId: 'r0001', type: 'receipt', name: 'Reçu officiel achat fer à béton et ciment.pdf', createdAt: '2026-11-05T10:30:00Z', photoName: 'chantier' },
  { id: 'd7', requestId: 'r0003', type: 'contract', name: 'Contrat de prestation administrative.pdf', createdAt: '2026-08-27T09:40:00Z' },
  { id: 'd8', requestId: 'r0003', type: 'receipt', name: 'Quittance droits mairie de Porto-Novo.pdf', createdAt: '2026-09-02T16:15:00Z', photoName: 'mairie' },
  { id: 'd9', requestId: 'r0005', type: 'contract', name: 'Convention d\'accompagnement consulaire.pdf', createdAt: '2026-10-29T10:15:00Z' },
];

export const SEED_MESSAGES: MessageItem[] = [
  { id: 'm1', requestId: 'r0001', from: 'team', author: 'Équipe KWABO', text: 'Bonjour Aïcha, votre rapport de la semaine 4 est déposé dans vos documents avec la vidéo 360°.', at: '2026-11-06T15:30:00Z', read: true },
  { id: 'm2', requestId: 'r0001', from: 'client', author: 'Aïcha Sossa', text: 'Merci beaucoup ! La qualité des parpaings a bien été vérifiée par M. Dossou ?', at: '2026-11-07T09:12:00Z', read: true },
  { id: 'm3', requestId: 'r0001', from: 'team', author: 'Maxime Dossou (Agent)', text: 'Oui Aïcha, nous avons vérifié le dosage et le séchage des briques sur place. Le reçu du fournisseur et les photos de contrôle sont dans vos documents.', at: '2026-11-07T10:05:00Z', read: false },
  { id: 'm4', requestId: 'r0002', from: 'team', author: 'Équipe KWABO', text: 'Votre devis de 45 € est prêt. Dès votre paiement validé, notre agent prend en charge la livraison de l\'ordonnance.', at: '2026-11-09T08:15:00Z', read: false },
  { id: 'm5', requestId: 'r0004', from: 'client', author: 'Romuald Agbo', text: 'Bonjour, pouvez-vous me confirmer la date de départ du prochain bateau pour Cotonou ?', at: '2026-11-09T07:20:00Z', read: false },
];

export const SEED_INVOICES: InvoiceItem[] = [
  { id: 'F-2026-0041', requestId: 'r0003', userId: 'u01', label: 'Assistance administrative (Acte de naissance)', amount: 55, status: 'paid', method: 'card', createdAt: '2026-08-26T10:00:00Z', paidAt: '2026-08-27T09:30:00Z' },
  { id: 'F-2026-0042', requestId: 'r0001', userId: 'u01', label: 'Suivi de chantier - Forfait mensuel Octobre', amount: 160, status: 'paid', method: 'wise', createdAt: '2026-10-11T09:15:00Z', paidAt: '2026-10-12T11:00:00Z' },
  { id: 'F-2026-0051', requestId: 'r0005', userId: 'u03', label: 'Faire venir un proche - Dossier visa', amount: 250, status: 'paid', method: 'momo', createdAt: '2026-10-28T09:00:00Z', paidAt: '2026-10-29T10:00:00Z' },
  { id: 'F-2026-0058', requestId: 'r0002', userId: 'u01', label: 'Santé de vos proches - Traitement 1 mois', amount: 45, status: 'due', method: null, createdAt: '2026-11-09T08:00:00Z', paidAt: null },
];

export const SEED_REVIEWS: ReviewItem[] = [
  { id: 'a1', requestId: 'r0006', userId: 'u04', rating: 5, comment: 'Titre vérifié auprès de l\'ANDF en moins de 10 jours. Le notaire m\'a félicité pour la propreté du dossier. Service impeccable !', status: 'published', at: '2026-07-15T14:00:00Z' },
  { id: 'a2', requestId: 'r0007', userId: 'u05', rating: 5, comment: 'Transfert d\'argent reçu sur le Mobile Money de mes parents en moins d\'une heure sans mauvaise surprise sur le taux de change.', status: 'published', at: '2026-08-10T12:00:00Z' },
  { id: 'a3', requestId: 'r0001', userId: 'u01', rating: 5, comment: 'La vidéo 360° m\'a bluffée ! Vivant à Paris, je vois l\'avancement de ma maison comme si j\'étais sur place à Calavi. Maxime est très rigoureux.', status: 'published', at: '2026-11-08T18:00:00Z' },
  { id: 'a4', requestId: 'r0003', userId: 'u01', rating: 4, comment: 'Acte de naissance légalisé et scanné proprement. Très bonne communication via WhatsApp.', status: 'published', at: '2026-09-06T10:00:00Z' },
];

export const SEED_AUDIT: AuditItem[] = [
  { id: 'j1', at: '2026-11-09T08:00:00Z', actor: 'Équipe KWABO', text: 'Devis généré pour la demande #KW-2026-0002 (45 €)' },
  { id: 'j2', at: '2026-11-09T04:10:00Z', actor: 'Système', text: 'Nouvelle demande reçue : Frais Europe → Bénin (Romuald Agbo)' },
  { id: 'j3', at: '2026-11-06T15:20:00Z', actor: 'Maxime Dossou', text: 'Dépôt du rapport semaine 4 et vidéo 360° pour la villa Calavi' },
  { id: 'j4', at: '2026-10-29T10:00:00Z', actor: 'Système', text: 'Encaissement 250 € (Mobile Money MTN) pour le dossier visa #KW-2026-0005' },
  { id: 'j5', at: '2026-10-12T14:00:00Z', actor: 'Équipe KWABO', text: 'Attribution de la mission villa Calavi à Maxime Dossou' },
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', userId: 'u01', text: 'Devis reçu pour « Médicaments de ma mère » : 45 €', href: 'requests-detail/r0002', at: '2026-11-09T08:00:00Z', read: false },
  { id: 'n2', userId: 'u01', text: 'Nouveau message de Maxime Dossou concernant votre chantier', href: 'requests-detail/r0001', at: '2026-11-07T10:05:00Z', read: false },
  { id: 'n3', userId: 'u01', text: 'Rapport de visite semaine 4 disponible pour votre villa Calavi', href: 'requests-detail/r0001', at: '2026-11-06T15:00:00Z', read: true },
  { id: 'n4', userId: 'u10', text: 'Nouvelle demande en attente : Envoi cartons Bruxelles (Romuald Agbo)', href: 'admin-requests/r0004', at: '2026-11-09T04:10:00Z', read: false },
  { id: 'n5', userId: 'u11', text: 'Demande urgente nécessitant attention : Médicaments de Mme Sossa', href: 'operator-mission/r0002', at: '2026-11-08T18:45:00Z', read: false },
];

export const STATUS_MAP: Record<string, { label: string; badgeClass: string; icon: string; color: string }> = {
  pending: { label: 'En attente', badgeClass: 'badge-gold', icon: 'clock', color: 'gold' },
  active: { label: 'En cours', badgeClass: 'badge-green', icon: 'bolt', color: 'green' },
  done: { label: 'Terminée', badgeClass: 'badge-neutral', icon: 'check-circle', color: 'neutral' },
  cancelled: { label: 'Annulée', badgeClass: 'badge-red', icon: 'x-circle', color: 'red' },
};

export const DOC_TYPE_META: Record<string, { label: string; icon: string }> = {
  report: { label: 'Rapport', icon: 'document-text' },
  photo: { label: 'Photo datée', icon: 'photo' },
  video: { label: 'Vidéo 360°', icon: 'video-camera' },
  receipt: { label: 'Reçu / Facture', icon: 'receipt-percent' },
  contract: { label: 'Contrat / Acte', icon: 'document-check' },
};

export const PAYMENT_METHODS: Record<string, { label: string; via: string; icon: string }> = {
  card: { label: 'Carte bancaire', via: 'Stripe', icon: 'credit-card' },
  momo: { label: 'Mobile Money', via: 'MTN MoMo, Moov', icon: 'device-phone-mobile' },
  wise: { label: 'Virement bancaire', via: 'Wise / SEPA', icon: 'building-library' },
};

export const PHOTOS: Array<{ name: string; desc: string }> = [
  { name: 'chantier-fondations', desc: 'Chantier - Coulage des fondations' },
  { name: 'chantier-gros-oeuvre', desc: 'Chantier - Gros œuvre & maçonnerie' },
  { name: 'chantier-tour', desc: 'Chantier - Vue d\'ensemble 360°' },
  { name: 'chantier-terrain', desc: 'Terrain - Bornage géomètre' },
  { name: 'chantier', desc: 'Matériaux - Contrôle ciment & fer' },
  { name: 'ganvie-pirogue', desc: 'Ganvié - Cité lacustre' },
  { name: 'aeroport', desc: 'Aéroport - Cotonou Cadjehoun' },
  { name: 'port', desc: 'Port autonome de Cotonou' },
  { name: 'mairie', desc: 'Administration - Mairie & Préfecture' },
];

export const SEED_REFERRALS: Record<string, Array<{ name: string; status: 'Actif' | 'Inscrit' | 'Inscrite'; at: string }>> = {
  u01: [
    { name: 'Romuald A.', status: 'Actif', at: '2026-09-30T10:00:00Z' },
    { name: 'Clarisse H.', status: 'Inscrite', at: '2026-10-28T10:00:00Z' },
  ],
  u04: [
    { name: 'Gisèle A.', status: 'Actif', at: '2026-07-12T10:00:00Z' },
    { name: 'Hervé G.', status: 'Actif', at: '2026-08-25T10:00:00Z' },
  ],
};

