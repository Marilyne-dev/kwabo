# Spécification API - Plateforme KWABO

Ce document décrit l'ensemble des routes API nécessaires au fonctionnement du front-end KWABO, les paramètres attendus, les formats JSON et les codes de réponse.

---

## 1. Configuration & Authentification

- **Base URL** : `http://localhost:5000/api` (ou selon configuration `.env`)
- **Headers requis pour les requêtes authentifiées** :
  ```http
  Authorization: Bearer <TOKEN_JWT>
  Content-Type: application/json
  ```

---

## 2. Authentification & Utilisateurs (`/api/auth` & `/api/users`)

### Inscription
- **Route** : `POST /api/auth/register`
- **Body** :
  ```json
  {
    "firstName": "Aïcha",
    "lastName": "Sossa",
    "email": "aicha@example.com",
    "country": "France",
    "dialCode": "+33",
    "phone": "612345678",
    "password": "Password123!",
    "referralCode": "KW-REF01" // facultatif
  }
  ```
- **Réponse 201** :
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "u01",
      "role": "USER",
      "firstName": "Aïcha",
      "lastName": "Sossa",
      "email": "aicha@example.com",
      "country": "France",
      "phone": "+33612345678",
      "twoFactor": false
    }
  }
  ```

### Connexion
- **Route** : `POST /api/auth/login`
- **Body** :
  ```json
  {
    "email": "aicha@example.com",
    "password": "Password123!"
  }
  ```
- **Réponse 200** :
  ```json
  {
    "token": "eyJhbGciOi...",
    "requireTwoFactor": false, // true si 2FA actif
    "user": { ... }
  }
  ```

### Profil utilisateur connecté
- **Route** : `GET /api/users/me`
- **Réponse 200** : Objet utilisateur complet.

### Mise à jour profil
- **Route** : `PUT /api/users/profile`
- **Body** :
  ```json
  {
    "firstName": "Aïcha",
    "lastName": "Sossa",
    "phone": "+33612345678",
    "country": "France"
  }
  ```

### Double authentification (2FA)
- **Activer** : `POST /api/auth/2fa/enable`
  - Body : `{ "code": "123456" }`
- **Désactiver** : `POST /api/auth/2fa/disable`

### Déconnexion de tous les appareils
- **Route** : `POST /api/auth/logout-all`

---

## 3. Demandes de service (`/api/requests`)

### Liste des demandes
- **Route** : `GET /api/requests`
  - *Client* : retourne les demandes du client connecté.
  - *Admin* : retourne toutes les demandes.
  - *Opérateur* : retourne les demandes attribuées.
  - Query params optionnels : `?status=pending|active|done|cancelled&search=...`

### Détail d'une demande
- **Route** : `GET /api/requests/:id`

### Création d'une nouvelle demande
- **Route** : `POST /api/requests`
- **Body** :
  ```json
  {
    "serviceId": "s-chantier",
    "title": "Suivi de chantier maison Calavi",
    "city": "Abomey-Calavi",
    "urgency": "normal", // ou "urgent"
    "budget": "250 €",
    "description": "Contrôle hebdomadaire de la maçonnerie...",
    "details": {
      "localisation": "Calavi Zoundja",
      "frequence": "Hebdomadaire"
    }
  }
  ```

### Mise à jour statut & Devis (Admin)
- **Changement de statut** : `PATCH /api/requests/:id/status` `{ "status": "active" }`
- **Attribution agent** : `PATCH /api/requests/:id/assign` `{ "operatorId": "op01" }`
- **Envoi de devis** : `POST /api/requests/:id/quote` `{ "amount": 180, "label": "Forfait 1 mois" }`

---

## 4. Messagerie (`/api/messages`)

### Messages d'une demande
- **Route** : `GET /api/requests/:id/messages`
- **Réponse 200** :
  ```json
  [
    {
      "id": "m01",
      "requestId": "r01",
      "from": "client", // ou "team"
      "author": "Aïcha Sossa",
      "text": "Bonjour, avez-vous pu passer sur le terrain ?",
      "at": "2026-11-10T08:30:00Z",
      "read": true
    }
  ]
  ```

### Envoyer un message
- **Route** : `POST /api/requests/:id/messages`
- **Body** :
  ```json
  {
    "text": "Voici les dernières photos du coulage des poteaux.",
    "attachment": "url_photo_ou_fichier" // optionnel
  }
  ```

---

## 5. Documents & Livrables (`/api/documents`)

### Liste des documents
- **Route** : `GET /api/documents`
- **Téléversement de livrable (Rapport / Vidéo 360° / Reçu)** :
  - **Route** : `POST /api/documents`
  - **Type** : `multipart/form-data`
  - **Champs** :
    - `requestId`: ID de la mission
    - `type`: `report` | `photo` | `video` | `receipt` | `contract`
    - `name`: Libellé affiché
    - `file`: Binaire du fichier

---

## 6. Factures & Paiements (`/api/invoices`)

### Liste des factures
- **Route** : `GET /api/invoices`
- **Initialiser un paiement** :
  - **Route** : `POST /api/invoices/:id/pay`
  - **Body** :
    ```json
    {
      "method": "card" // ou "momo", "wise"
    }
    ```
- **Remboursement (Admin)** :
  - **Route** : `POST /api/invoices/:id/refund`

