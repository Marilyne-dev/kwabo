/**
 * Mapping des photos haute définition du Bénin issues de la maquette KWABO.
 * Fichiers originaux haute résolution pour une netteté maximale sur mobile.
 */

export const PHOTOS: Record<string, any> = {
  // Onboarding & Lieux emblématiques (Haute Définition non compressée)
  'chantier-tour': require('../../assets/photos/chantier-tour.jpg'),
  'ganvie-pirogue': require('../../assets/photos/ganvie-pirogue.jpg'),
  'port': require('../../assets/photos/port.jpg'),
  'abomey': require('../../assets/photos/abomey.jpg'),
  'cotonou': require('../../assets/photos/cotonou.jpg'),
  'ganvie': require('../../assets/photos/ganvie.jpg'),
  'dantokpa': require('../../assets/photos/dantokpa.jpg'),
  'plage': require('../../assets/photos/plage.jpg'),
  'ouidah-porte': require('../../assets/photos/ouidah-porte.jpg'),

  // Services (Haute Définition non compressée)
  'chantier': require('../../assets/photos/chantier.jpg'),
  'chantier-terrain': require('../../assets/photos/chantier-terrain.jpg'),
  'quartier': require('../../assets/photos/quartier.jpg'),
  'terrain': require('../../assets/photos/terrain.jpg'),
  'marche-ganvie': require('../../assets/photos/marche-ganvie.jpg'),
  'pharmacie': require('../../assets/photos/pharmacie.jpg'),
  'mariage': require('../../assets/photos/mariage.jpg'),
  'aeroport': require('../../assets/photos/aeroport.jpg'),
  'rue-cotonou': require('../../assets/photos/rue-cotonou.jpg'),
  'mairie': require('../../assets/photos/mairie.jpg'),
  'zemidjan': require('../../assets/photos/zemidjan.jpg'),
  'port-cargo': require('../../assets/photos/port-cargo.jpg'),
  'wax': require('../../assets/photos/wax.jpg'),
  'artisanat': require('../../assets/photos/artisanat.jpg'),
};

export const SERVICE_PHOTOS: Record<string, string> = {
  'suivi-chantier': 'chantier',
  'investissement': 'quartier',
  'foncier': 'terrain',
  'soutien-famille': 'marche-ganvie',
  'sante': 'pharmacie',
  'evenements': 'mariage',
  'faire-venir': 'aeroport',
  'comptabilite': 'rue-cotonou',
  'administratif': 'mairie',
  'transfert': 'zemidjan',
  'fret': 'port-cargo',
  'cadeaux': 'wax',
};

export const CATEGORY_PHOTOS: Record<string, string> = {
  'immobilier': 'chantier-tour',
  'famille': 'ganvie-pirogue',
  'demarches': 'aeroport',
  'logistique': 'port',
};

export const DOCUMENT_PHOTOS: Record<string, string | null> = {
  'd1': null,
  'd2': null,
  'd3': null,
  'd4': 'chantier-tour',
  'd5': 'chantier-terrain',
  'doc-1': 'chantier-tour',
  'doc-2': 'chantier-terrain',
  'doc-3': 'chantier',
};

export function getPhoto(name?: string | null) {
  if (!name || !PHOTOS[name]) {
    return PHOTOS['chantier'];
  }
  return PHOTOS[name];
}
