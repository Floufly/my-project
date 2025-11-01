# Site de consultations de numérologie

Ce projet Next.js fournit un site vitrine complet pour proposer des consultations de numérologie en ligne avec réservation automatisée, gestion des créneaux et intégrations de paiement flexibles.

## Fonctionnalités principales

- Présentation professionnelle des services et du praticien.
- Réservation en ligne avec sélection de créneau basé sur une grille de disponibilités dynamique.
- Stockage des réservations dans SQLite (`data/appointments.sqlite`).
- Synchronisation optionnelle avec Google Calendar (service account).
- Génération d’un fichier ICS téléchargeable pour un ajout manuel au calendrier.
- Démarrage de paiement via Stripe (carte bancaire), Coinbase Commerce (crypto) ou lien Telegram.
- Interface responsive pensée pour une prise en main simple.

## Prérequis

- Node.js 18+.
- npm (ou yarn/pnpm si vous adaptez les scripts).
- Facultatif : clés API Stripe, Coinbase Commerce, Google Calendar et lien Telegram pour activer les automatisations correspondantes.

## Installation

```bash
npm install
```

## Démarrage du serveur de développement

```bash
npm run dev
```

Le site est accessible sur `http://localhost:3000`.

## Construction et exécution en production

```bash
npm run build
npm start
```

## Variables d’environnement

Créez un fichier `.env.local` à la racine pour activer les intégrations. Toutes les variables sont optionnelles, le site fonctionne sans mais les paiements/agendas seront alors gérés manuellement.

```bash
# Stripe (paiement carte bancaire)
STRIPE_SECRET_KEY=sk_live_...

# Coinbase Commerce (paiement crypto)
COINBASE_COMMERCE_API_KEY=...

# Telegram (lien de paiement ou contact)
TELEGRAM_PAYMENT_URL=https://t.me/votrebot?start=123
# ou simple nom d’utilisateur
TELEGRAM_USERNAME=danielnumerologie

# Google Calendar (service account JSON)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=votre-agenda@group.calendar.google.com

# Adresse utilisée comme organisateur des invitations ICS
ORGANIZER_EMAIL=contact@numerologie-daniel.fr
```

### Personnalisation de la disponibilité

Les créneaux et la zone horaire se configurent dans `config/availability.ts` :

- `DEFAULT_TIMEZONE` — fuseau horaire IANA (ex: `Europe/Paris`).
- `WEEKLY_AVAILABILITY` — plages horaires par jour de la semaine (`1` = lundi).
- `BLOCKED_DATES` — liste de dates (format `YYYY-MM-DD`) à exclure.
- `SLOT_INTERVAL_MINUTES` — intervalle pour générer les propositions de créneaux.

### Services proposés

Adaptez les prestations dans `config/services.ts` (titre, description, durée, tarif et axes de travail).

## Base de données

La base SQLite est créée automatiquement dans `data/appointments.sqlite`. Pour repartir de zéro, supprimez ce fichier (ou utilisez un autre chemin en modifiant `lib/db.ts`).

## Structure des API

- `GET /api/availability` : retourne les créneaux disponibles pour un service donné.
- `POST /api/book` : enregistre une réservation, déclenche les intégrations (paiement, agenda) et renvoie les informations nécessaires au front.

## Tests

Aucun test automatisé n’est fourni pour le moment. Vous pouvez néanmoins lancer `npm run lint` pour vérifier les bonnes pratiques Next.js.

## Déploiement

- Prévoir les variables d’environnement dans votre plateforme (Vercel, Render, etc.).
- Assurez-vous que le dossier `data/` est persistant (utilisez un volume si nécessaire) ou remplacez SQLite par une base distante.

## Licence

Projet livré sans licence explicite — adaptez selon vos besoins avant mise en production.
