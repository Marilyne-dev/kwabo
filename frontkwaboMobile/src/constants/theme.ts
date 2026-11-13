/**
 * Charte graphique KWABO - Mobile App
 * Reprise fidèle de la maquette v3.0
 */

export const COLORS = {
  // Verts de marque
  green: '#1A5C3A',
  greenDark: '#123F28',
  greenHero: '#1A4D30',
  greenMid: '#2D7A52',
  greenPale: '#E8F5EE',

  // Or & Jaune
  gold: '#D4A017',
  goldLight: '#F5C842',
  goldPale: '#FDF6E0',
  goldText: '#7A5A06',

  // Terracotta & Alertes
  terracotta: '#C9561E',
  terracottaText: '#A8420F',
  terracottaPale: '#FDF0EA',

  // Neutres & Fonds
  cream: '#F9F7F4',
  white: '#FFFFFF',
  text: '#1A1F1B',
  textMid: '#404844',
  muted: '#56635B',
  border: '#E0E8E4',
  neutralPale: '#EEF1EF',
  cardBg: '#FFFFFF',
  
  // Statuses
  statusPendingBg: '#FDF6E0',
  statusPendingText: '#7A5A06',
  statusActiveBg: '#E8F5EE',
  statusActiveText: '#1A5C3A',
  statusDoneBg: '#EEF1EF',
  statusDoneText: '#404844',
  statusUrgentBg: '#FDF0EA',
  statusUrgentText: '#A8420F',
};

export const FONTS = {
  // React Native utilise des noms de polices système par défaut
  displayBold: 'System',
  bodyRegular: 'System',
  bodyMedium: 'System',
  bodySemiBold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  card: 20,
  pill: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1A5C3A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A5C3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A5C3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
};

