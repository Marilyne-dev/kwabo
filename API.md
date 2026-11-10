# API KWABO — guide pour le développeur front-end

**URL de base (local)** : `http://127.0.0.1:8010/api`
Toutes les réponses sont en JSON. Envoyer `Accept: application/json` (recommandé) et, pour les données, `Content-Type: application/json`.
Les envois de fichiers se font en `multipart/form-data`.

## Règles générales

| Sujet | Règle |
|---|---|
| Authentification | `Authorization: Bearer <token>` sur toutes les routes « connecté ». Le token vient de `/login`, `/admin/login` ou `/email/verify`. |
| Pas connecté / token invalide | `401 { "message": "Unauthenticated." }` → renvoyer vers la page de connexion |
| Accès interdit | `403 { "message": "..." }` |
| Introuvable | `404` |
| Erreur de validation | `422 { "message": "...", "errors": { "champ": ["texte en français"] } }` → afficher chaque message sous son champ |
| Trop de requêtes | `429` (connexion, inscription, mot de passe : 10 par minute) |
| Pagination | `?page=2&per_page=20` (20 par défaut, 200 maximum). Réponse : `data` + `meta` (`current_page`, `last_page`, `total`) |
| Dates | ISO 8601 UTC (`2026-11-09T16:34:19.000000Z`) |
| Montants | en euros, nombres décimaux |
| Rôles | `user` (client), `operator` (agent terrain), `admin` |
| Connexions | clients : `POST /login` (site et mobile). Équipe : `POST /admin/login`. Un compte du mauvais type est refusé (422). |

Statuts d'une demande : `pending` (En attente), `active` (En cours), `done` (Terminée), `cancelled` (Annulée).
Statuts d'une facture : `due`, `paid`, `refunded`, `cancelled`. Moyens de paiement : `card`, `momo`, `wise`.
Types de document : `report`, `photo`, `video`, `receipt`, `contract`.

---

## 1. Public

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/ping` | test : `{ "message": "API KWABO OK" }` |
| GET | `/catalog` | `data` : 4 univers `{ slug, name, short, blurb, icon, services[] }`. Chaque service : `id, slug, name, price_label, short, included[], form_fields[], icon, popular, available` |
| GET | `/services/{slug}` | fiche d'un service (avec `category`) |

`form_fields` décrit le formulaire de demande : `{ name, label, type?, required?, placeholder?, options? }` avec `type` = `select`, `number`, `date`, `tel` ou `file` (texte par défaut).

## 2. Compte

**POST `/register`** `{ first_name, last_name, email, phone, country, password, sponsor_code?, dial? }`
Mot de passe : 8 caractères minimum, 1 majuscule, 1 chiffre. `dial` (ex. `+33`) est facultatif ; sinon mettre l'indicatif dans `phone`.
→ `201 { user, needs_verification: true }` (pas de token : l'e-mail doit être confirmé).

**POST `/email/verify`** `{ email, code }` (code à 6 chiffres reçu par e-mail) → `200 { user, token }`
**POST `/email/resend`** `{ email }`

**POST `/login`** `{ email, password, code?, device_name? }`
- OK : `200 { user, token }`
- E-mail non confirmé : `403 { needs_verification: true }`
- Double authentification activée et `code` absent : `200 { needs_code: true }` → redemander avec `code` (6 chiffres de l'application d'authentification)
- Mauvais identifiants : `422 { errors: { email: [...] } }`

**POST `/admin/login`** : même chose, pour admin et agents.
**GET `/me`** → `{ data: user }`. **POST `/logout`**, **POST `/logout-all`** (tous les appareils).

`user` : `id, first_name, last_name, full_name, email, phone, country, role, email_verified, two_factor_enabled, referral_code, notification_prefs, created_at`.

**POST `/password/forgot`** `{ email }` → toujours 200.
**POST `/password/reset`** `{ email, token, password }` → 200. Le lien reçu par e-mail pointe vers `/reinitialiser-mot-de-passe?email=…&token=…` du site.

**PATCH `/profile`** `{ first_name, last_name, phone, country }` → `{ data: user }` (l'e-mail ne se change pas ici)
**PUT `/profile/password`** `{ current_password, password }` → déconnecte les autres appareils
**PUT `/profile/notifications`** `{ prefs: { received, quote, started, report, done, payment } }` (booléens) → `{ data: user }`
**POST `/two-factor/setup`** → `{ secret, qr_svg }` (afficher le QR code)
**POST `/two-factor/enable`** `{ code }` · **POST `/two-factor/disable`** `{ password }`
**DELETE `/account`** `{ password }` → efface le compte et toutes les données (définitif)

## 3. Espace client (rôle `user`)

**GET `/dashboard`** → `data`: `recent_requests[]`, `active_mission` (`{ request, media[] }` ou null), `due_invoices[]`, `notifications[]` (non lues), `recent_documents[]`, `popular_services[]`
**GET `/counters`** (tous les rôles) → `unread_messages`, `unread_notifications`, `due_invoices` (client), `pending_reviews` (admin) : pastilles de la barre latérale

### Demandes
- **GET `/requests`** `?status=&search=&page=` → liste paginée
- **POST `/requests`** : JSON `{ service: "slug", title?, city?, urgency?: "normal|urgent", budget?, description?, details: { <name du champ>: valeur } }`.
  Si le service a un champ fichier (ex. ordonnance) : envoyer en `multipart` avec `service`, `details[champ]=…` et `files[<name du champ>]=@fichier` (PDF, JPG, PNG, 10 Mo max). → `201 { data: demande }`
- **GET `/requests/{id}`** → `data`: `id, tracking, status, title, city, urgency, budget, description, details, quote {amount,label}|null, rating, created_at, service, operator, history[{at,text}], documents[], invoices[], invoice_due, review, unread_messages`
- **POST `/requests/{id}/cancel`** → 200 (422 si déjà terminée ou annulée)
- **PUT `/requests/{id}/review`** `{ rating: 1..5, comment? }` : seulement si la mission est terminée. L'avis passe « en attente de modération ».

### Messagerie (client et équipe)
- **GET `/messages`** → `data[]` (un fil par demande : `request_id`, `last_message`, `unread`, plus les infos de la demande) + `meta.unread_total`
- **GET `/requests/{id}/messages`** → `data[]` : `id, from ("client"|"team"), author, text, attachment {name,url}|null, read, at`
- **POST `/requests/{id}/messages`** : `{ text }` ou `multipart` (`text`, `attachment` PDF/JPG/PNG…). 422 si la demande est annulée.
- **POST `/requests/{id}/messages/read`** → `{ updated: n }`
- **GET `/messages/{id}/attachment`** : télécharge la pièce jointe (envoyer le jeton : utiliser `fetch` puis un blob)

### Documents
- **GET `/documents`** → `data[]` groupé par demande : `{ request, documents[{id,type,name,created_at,url}] }`
- **GET `/documents/{id}/download`** : télécharge le fichier (avec le jeton)

### Paiements
- **GET `/invoices`** → `data[]` : `id, number, label, amount, status, method, created_at, paid_at, request{id,tracking,title}` + `meta` : `due_total, paid_total, count`
- **POST `/invoices/{id}/pay`** `{ method: "card|momo|wise" }` → `200 { data: facture payée }`. La demande passe « En cours ». *Paiement simulé pour l'instant* ; `simulate: "fail"` renvoie `402` pour tester l'échec.
- **GET `/payment-methods`** · **DELETE `/payment-methods/{id}`**

### Notifications et parrainage
- **GET `/notifications`** → `data[{id,text,link,read,at}]` + `meta.unread_total` · **POST `/notifications/{id}/read`** · **POST `/notifications/read-all`**
- **GET `/referrals`** → `data`: `code, share_text, reward_per_referral, stats{referrals,active,rewards}, referrals[{name,status:"Inscrit"|"Actif",joined_at}]`

## 4. Back-office (préfixe `/admin`, rôles `admin` et `operator`)

L'agent ne voit que ses demandes. Les routes marquées **A** sont réservées à l'admin (403 pour un agent).

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/dashboard` | admin : `stats{quotes_to_prepare,active_missions,revenue_month,awaiting_payment}`, `work[{request,reasons[{code,label}]}]`, `revenue[6 mois]`, `by_category`, `operator_load`, `recent_activity`. Agent : `stats{assigned,pending,active,done}`, `work`, `recent_documents` |
| GET | `/admin/search?q=` | demandes (5) et clients (4, admin) |
| GET | `/admin/requests` | filtres `q, status, operator (id ou "none" — A), category (slug), urgency, page, per_page` (tableau et Kanban : `per_page=200`) |
| GET | `/admin/requests/{id}` | détail complet : client, historique, documents, factures, notes internes, avis |
| PATCH | `/admin/requests/{id}/status` | `{ status }` : admin ou agent attribué. Le client est prévenu. |
| POST | `/admin/requests/{id}/documents` | multipart : `type`, `file`, `name?` (rapport → le client est prévenu) |
| POST | `/admin/requests/{id}/notes` | `{ text }` : note interne, invisible du client |
| PATCH | `/admin/requests/{id}/assign` | **A** `{ operator_id: id \| null }` |
| POST | `/admin/requests/{id}/quote` | **A** `{ amount, label? }` : crée la facture à payer, remplace l'ancienne |
| GET | `/admin/kpis` | **A** `indicators[{key,label,current,target_m6,target_m12,progress_m6}]`, `revenue`, `average_invoice`, `total_collected`, `by_category` |
| GET | `/admin/invoices` | **A** `?q=&status=` + `meta` (totaux encaissé, à payer, remboursé, mois) |
| GET | `/admin/invoices/{id}` · POST `/admin/invoices/{id}/refund` | **A** |
| GET | `/admin/clients` | **A** `?q=&state=active\|unverified\|suspended` |
| GET | `/admin/clients/{id}` | **A** fiche : stats, demandes, factures, parrain |
| POST | `/admin/clients/{id}/suspend` | **A** `{ suspended: true\|false }` |
| POST | `/admin/clients/{id}/reset-link` | **A** envoie un lien de mot de passe (1 h) |
| DELETE | `/admin/clients/{id}` | **A** droit à l'effacement (définitif) |
| GET | `/admin/referrals` | **A** parrains, filleuls, convertis |
| GET | `/admin/reviews?status=pending\|published\|hidden` | **A** + `meta.counts` |
| PATCH | `/admin/reviews/{id}` | **A** `{ status: "published"\|"hidden" }` |
| GET | `/admin/services` | **A** tout le catalogue, y compris indisponible |
| PATCH | `/admin/services/{id}` | **A** `{ price_label?, available? }` |
| GET | `/admin/team` | **A** admin et agents avec leur charge |
| POST | `/admin/operators` | **A** `{ first_name, last_name, email, phone }` |
| GET | `/admin/audit?q=` | **A** journal d'audit |

La messagerie du back-office utilise les mêmes routes que le client (`/messages`, `/requests/{id}/messages`…).

## 5. À savoir

- **Comptes de démonstration** (mot de passe `Demo1234`) : `client@kwabo.demo`, `admin@kwabo.demo` (via `/admin/login`), `agent@kwabo.demo` (via `/admin/login`).
- **Notifications** : `link` est un chemin du site (`/requests/12`, `/payments`, `/admin/requests/12`) à relier aux pages du front.
- **CORS** : ouvert en développement. Il sera limité à l'adresse du site avant la mise en ligne.
- **Exports CSV** : à fabriquer côté front avec `per_page=200`.
