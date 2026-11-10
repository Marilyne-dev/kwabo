# KWABO - Plateforme Front-End (React + TypeScript + Vite)

Interface utilisateur de confiance pour la diaspora béninoise. Suivi de chantiers, santé de la famille, démarches administratives et logistique.

---

## 🚀 Démarrage rapide

### 1. Prérequis
- **Node.js** : version 18.0 ou supérieure
- **npm** ou **yarn**

### 2. Installation
```bash
# Installer les dépendances
npm install
```

### 3. Configuration de l'environnement
Copiez le fichier d'exemple et configurez l'URL de votre API :
```bash
cp .env.example .env
```
Contenu du `.env` :
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Lancement en développement
```bash
npm run dev
```
L'application démarre sur `http://localhost:5173` (ou port spécifié par Vite).

### 5. Build de production
```bash
npm run build
```
Les fichiers statiques prêts pour le déploiement sont générés dans le dossier `dist/`.

---

## 👥 Comptes de démonstration & Rôles

Une barre de test en haut de l'écran (`TesterBar`) permet de basculer instantanément entre les différents rôles pour tester tous les flux :

1. **Visiteur public** : Navigation vitrine, catalogue de services, calculateur de devis, politique de confidentialité, CGU.
2. **Client diaspora** (`client@kwabo.demo` / `demo`) :
   - Tableau de bord avec suivi de mission en direct
   - Création de demande avec formulaire dynamique par service
   - Visualisation des livrables (vidéos 360°, rapports d'avancement, reçus scannés)
   - Messagerie instantanée avec l'équipe KWABO
   - Historique des factures et paiement sécurisé (drawer avec impression PDF)
   - Gestion du profil et double authentification (2FA)
3. **Agent terrain** (`agent@kwabo.demo` / `demo`) :
   - Missions attribuées sur le terrain
   - Dépôt de rapports et médias
4. **Administrateur** (`admin@kwabo.demo` / `demo`) :
   - Supervision globale et KPIs
   - Gestion et validation des demandes
   - Attribution des agents terrain et émission de devis
   - Modération des avis et gestion du catalogue

---

## 🔌 Intégration de l'API Backend

Le dossier racine contient le document complet des spécifications :
👉 **Voir [`API_SPEC.md`](./API_SPEC.md)** pour le détail complet de chaque endpoint (URL, méthode, format JSON attendu et codes de retour).

Un client HTTP centralisé avec gestion automatique du Bearer Token est déjà configuré dans [`src/services/api.ts`](./src/services/api.ts).
