export interface FormField {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'select' | 'tel' | 'date' | 'file' | 'number';
  options?: string[];
  accept?: string;
}

export interface ServiceItem {
  id: string;
  cat: 'immobilier' | 'famille' | 'demarches' | 'logistique';
  name: string;
  icon: string;
  popular?: boolean;
  price: string;
  short: string;
  included: string[];
  fields: FormField[];
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'suivi-chantier',
    cat: 'immobilier',
    name: 'Suivi de chantier',
    icon: 'business',
    popular: true,
    price: '120-200 €/mois',
    short: 'Visite hebdo, vidéo 360°, contrôle matériaux, rapport écrit.',
    included: [
      'Visite hebdomadaire du chantier',
      'Vidéo 360° de l\'avancement',
      'Contrôle des matériaux',
      'Rapport écrit détaillé',
    ],
    fields: [
      { name: 'adresse', label: 'Adresse exacte du chantier', required: true, placeholder: 'Ex: Fidjrossè Calvaire, Cotonou' },
      { name: 'gps', label: 'Coordonnées GPS (si disponibles)', placeholder: '6.3703, 2.3912' },
      { name: 'macon', label: 'Nom et contact du maçon / chef chantier', placeholder: 'Nom, +229…' },
      {
        name: 'stade',
        label: "Stade d'avancement actuel",
        type: 'select',
        options: ['Terrain nu', 'Fondations', 'Élévation des murs', 'Toiture', 'Finitions'],
      },
      { name: 'visite', label: 'Préférence de visite (jour/heure)', placeholder: 'Ex: Le vendredi matin' },
    ],
  },
  {
    id: 'investissement',
    cat: 'immobilier',
    name: 'Investissement immobilier',
    icon: 'home',
    popular: true,
    price: 'Dès 300 €/dossier',
    short: 'Recherche de biens, visite et expertise, gestion locative.',
    included: ['Recherche de biens vérifiés', 'Visite et rapport d\'expertise', 'Gestion locative sécurisée'],
    fields: [
      {
        name: 'bien',
        label: 'Type de bien recherché',
        type: 'select',
        options: ['Terrain', 'Maison', 'Appartement', 'Immeuble de rapport'],
      },
      { name: 'zone', label: 'Zone souhaitée', placeholder: 'Abomey-Calavi, Fidjrossè…' },
      {
        name: 'objectif',
        label: 'Objectif du projet',
        type: 'select',
        options: ['Y habiter', 'Mettre en location', 'Revendre'],
      },
    ],
  },
  {
    id: 'foncier',
    cat: 'immobilier',
    name: 'Accompagnement foncier',
    icon: 'location',
    price: 'Dès 500 €',
    short: 'Vérification de titre ANDF, notaire, état des lieux GPS.',
    included: [
      'Vérification du titre auprès de l\'ANDF',
      'Accompagnement chez le notaire',
      'État des lieux GPS et bornage',
    ],
    fields: [
      { name: 'parcelle', label: 'Localisation de la parcelle', required: true, placeholder: 'Commune, arrondissement, quartier' },
      { name: 'titre', label: 'Numéro de titre (si disponible)' },
      {
        name: 'besoin',
        label: 'Votre besoin',
        type: 'select',
        options: ['Vérifier un titre', 'Acheter un terrain', 'Régulariser un terrain'],
      },
    ],
  },
  {
    id: 'soutien-famille',
    cat: 'famille',
    name: 'Soutien famille quotidien',
    icon: 'hand-left',
    price: '15-45 €/mois',
    short: 'Factures SBEE/SONEB, recharge, courses, visite aux parents.',
    included: [
      'Paiement direct des factures SBEE et SONEB',
      'Recharges téléphoniques & internet',
      'Courses et livraisons vivrières',
      'Visite de courtoisie aux parents',
    ],
    fields: [
      { name: 'beneficiaire', label: 'Nom du proche concerné', required: true, placeholder: 'Nom complet' },
      { name: 'telephone', label: 'Téléphone du proche', type: 'tel', placeholder: '+229 01...' },
      {
        name: 'frequence',
        label: 'Fréquence souhaitée',
        type: 'select',
        options: ['Chaque semaine', 'Chaque mois', 'Ponctuelle'],
      },
    ],
  },
  {
    id: 'sante',
    cat: 'famille',
    name: 'Santé de vos proches',
    icon: 'heart',
    popular: true,
    price: 'Dès 25 €/mois',
    short: "Paiement de l'hôpital, livraison de médicaments, mutuelle.",
    included: [
      'Paiement direct aux hôpitaux et cliniques',
      'Achat et livraison certifiée de médicaments',
      'Souscription et suivi de mutuelle santé',
    ],
    fields: [
      { name: 'patient', label: 'Nom du patient', required: true, placeholder: 'Nom complet du parent' },
      { name: 'pathologie', label: 'Pathologie ou besoins déclarés', placeholder: 'Ex: Traitement mensuel hypertension' },
      { name: 'etablissement', label: 'Établissement de santé habituel', placeholder: 'Ex: CNHU Hubert Maga' },
      { name: 'budgetMensuel', label: 'Budget mensuel alloué (€)', type: 'number', placeholder: '50' },
    ],
  },
  {
    id: 'evenements',
    cat: 'famille',
    name: 'Événements à distance',
    icon: 'calendar',
    price: 'Dès 300 €',
    short: 'Mariage, baptême, funérailles, dot, avec diffusion en direct.',
    included: [
      'Coordination logistique (mariage, baptême, funérailles, dot)',
      'Présence d\'un représentant KWABO',
      'Diffusion vidéo privée en direct',
    ],
    fields: [
      {
        name: 'evenement',
        label: "Type d'événement",
        type: 'select',
        options: ['Mariage', 'Baptême', 'Funérailles', 'Dot', 'Autre'],
      },
      { name: 'dateEvenement', label: 'Date prévue', type: 'date' },
      { name: 'lieu', label: 'Lieu de la cérémonie', placeholder: 'Ville, quartier' },
    ],
  },
  {
    id: 'faire-venir',
    cat: 'demarches',
    name: 'Faire venir un proche',
    icon: 'airplane',
    popular: true,
    price: 'Dès 200 €/dossier',
    short: 'Dossier visa complet, invitation, inscription école ou fac.',
    included: ['Constitution du dossier de visa complet', 'Lettre d\'invitation et garanties', 'Inscription école ou université'],
    fields: [
      { name: 'parente', label: 'Lien de parenté', required: true, placeholder: 'Fils, mère, nièce...' },
      {
        name: 'visa',
        label: 'Type de visa visé',
        type: 'select',
        options: ['Visite familiale', 'Études', 'Regroupement familial', 'Tourisme', 'Autre'],
      },
      { name: 'destination', label: 'Pays de destination', required: true, placeholder: 'France, Canada, Belgique...' },
    ],
  },
  {
    id: 'administratif',
    cat: 'demarches',
    name: 'Assistance administrative',
    icon: 'document',
    popular: true,
    price: 'Dès 50 €/dossier',
    short: 'Actes de naissance, passeport, casier judiciaire, légalisations.',
    included: ['Retrait et légalisation d\'actes civils', 'Suivi de dossier passeport biométrique', 'Casier judiciaire béninois'],
    fields: [
      { name: 'document', label: 'Document recherché', required: true, placeholder: 'Acte de naissance, certificat...' },
      { name: 'pourQui', label: 'Pour qui', placeholder: 'Moi-même, mon enfant...' },
      { name: 'mairie', label: 'Mairie ou préfecture d\'origine', placeholder: 'Porto-Novo, Cotonou...' },
    ],
  },
  {
    id: 'fret',
    cat: 'logistique',
    name: 'Fret et expédition de colis',
    icon: 'cube',
    price: 'Sur devis',
    short: 'Envoi sécurisé Europe/Amériques vers Bénin et retour.',
    included: ['Réception en entrepôt', 'Dédouanement et suivi en temps réel', 'Livraison à domicile au Bénin'],
    fields: [
      { name: 'villeEnvoi', label: 'Ville de départ', required: true, placeholder: 'Paris, Bruxelles, Montréal...' },
      { name: 'poids', label: 'Poids estimé (en kg)', type: 'number', placeholder: '25' },
      {
        name: 'mode',
        label: "Mode d'expédition préféré",
        type: 'select',
        options: ['Aérien (rapide)', 'Maritime (économique)'],
      },
    ],
  },
];

