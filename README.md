# PulseOps

PulseOps est un SaaS fullstack d'analytics produit et de santé des comptes pour
les petites équipes B2B.

L'application reçoit des événements produit, les valide, les stocke dans
PostgreSQL, les agrège, puis transforme ce flux brut en signaux lisibles :
activation, activité, comptes sains, comptes à risque et comptes devenus
silencieux.

```text
événement -> validation -> stockage -> agrégation -> visualisation -> décision
```

## Ce que le projet démontre

- une application Next.js fullstack en TypeScript strict ;
- une authentification avec Supabase Auth ;
- une base PostgreSQL Supabase ;
- un schéma Drizzle avec migrations et accès typé aux données ;
- une API d'ingestion sécurisée par clés API projet ;
- des clés API hachées avant stockage ;
- une validation des payloads avec Zod ;
- une limitation de débit par clé API ;
- un stockage idempotent grâce à des `event_id` stables ;
- des jobs d'agrégation pour l'activité, l'activation et la santé des comptes ;
- un endpoint cron sécurisé avec `CRON_SECRET` ;
- une interface produit avec une direction artistique Signal Observatory ;
- une documentation d'intégration orientée développeur ;
- un testeur d'ingestion utilisable depuis l'interface ;
- un dataset de démonstration réaliste pour un SaaS B2B.

## Périmètre produit

PulseOps aide une petite équipe B2B à répondre à ces questions :

1. Le produit est-il actif ?
2. Où l'activation décroche-t-elle ?
3. Quels comptes sont sains, fragiles ou silencieux ?
4. Un événement produit est-il bien arrivé et stocké ?
5. Quel signal mérite une action en priorité ?

Le MVP inclut :

- projets ;
- création et révocation de clés API ;
- endpoint `POST /api/ingest/track` ;
- workspaces et utilisateurs connectés ;
- entreprises, utilisateurs suivis et événements ;
- flux d'événements avec entrées acceptées, ignorées et rejetées ;
- funnel d'activation ;
- activité dans le temps ;
- score de santé transparent ;
- file de comptes inactifs ;
- réglages projet ;
- page de vérification Supabase ;
- documentation d'intégration ;
- testeur d'événements en direct.

## Direction artistique

La direction visuelle du produit est :

```text
Signal Observatory / Product Telemetry Control Room
```

L'interface doit donner l'impression d'un outil SaaS professionnel qui écoute le
flux d'activité d'un produit vivant.

Le but n'est pas de faire une interface cyberpunk ou un dashboard générique. Les
graphiques, timelines d'événements, badges de santé et signaux visuels doivent
servir la compréhension de la donnée.

Les primitives visuelles réutilisables sont dans :

```text
src/components/app/pulse-primitives.tsx
```

La signature de marque commune est dans :

```text
src/components/pulse-brand.tsx
```

## Stack technique

- Next.js 16 fullstack ;
- React 19 ;
- TypeScript strict ;
- Supabase PostgreSQL ;
- Supabase Auth ;
- Drizzle ORM ;
- Recharts ;
- Zod ;
- Vercel ;
- cron HTTP externe pour les agrégations fréquentes ;
- scripts npm prêts pour la validation locale et CI.

## Déploiement

URL de production :

```text
https://pulseops-analytics.vercel.app
```

Le dépôt GitHub est privé pendant la finalisation du projet.

## Développement local

Installer les dépendances :

```bash
npm install
```

Démarrer le serveur local :

```bash
npm run dev
```

Ouvrir la landing page :

```text
http://localhost:3000
```

Ouvrir l'application :

```text
http://localhost:3000/app
```

Quand Supabase Auth est configuré, les utilisateurs non connectés sont redirigés
vers :

```text
http://localhost:3000/login
```

## Variables d'environnement

Copier le fichier d'exemple :

```bash
cp .env.example .env.local
```

Variables nécessaires pour utiliser les vraies données :

```text
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
CRON_SECRET
INGESTION_RATE_LIMIT_PER_MINUTE
```

Variables utiles pour les démonstrations locales :

```text
NEXT_PUBLIC_INGESTION_TEST_KEY
SEED_DEMO_API_KEY
```

Ne jamais commit `.env.local`. Ce fichier contient les URLs de base de données
et les clés privées.

Les notes complètes de configuration sont dans :

```text
SUPABASE_SETUP.md
```

## Base de données

Lancer les migrations :

```bash
npm run db:migrate
```

Insérer le dataset de démonstration :

```bash
npm run db:seed
```

Le seed déterministe crée :

- 1 workspace de démonstration ;
- 1 projet de démonstration ;
- 8 entreprises ;
- 16 utilisateurs suivis ;
- 851 événements produit ;
- 1 clé API d'ingestion locale.

Après des tests d'ingestion manuels, le nombre d'événements local peut être plus
élevé.

Lancer une première agrégation :

```bash
npm run jobs:aggregate
```

Vérifier la base réelle :

```bash
npm run setup:smoke
```

## API d'ingestion

Endpoint :

```text
POST /api/ingest/track
Authorization: Bearer <project_api_key>
```

Exemple de données envoyées :

```json
{
  "event_id": "evt_123",
  "event": "first_event_sent",
  "occurred_at": "2026-08-27T12:30:00.000Z",
  "user": {
    "external_id": "user_42",
    "email": "user@example.com",
    "name": "Aicha"
  },
  "company": {
    "external_id": "company_9",
    "name": "Northstar Labs"
  },
  "properties": {
    "source": "onboarding"
  }
}
```

Les événements acceptés sont stockés dans `events`.

Les doublons sont détectés avec `event_id` et ignorés pour éviter de compter
deux fois le même événement.

Les données invalides sont enregistrées dans le log d'ingestion lorsqu'une clé
API valide permet d'identifier le projet.

## Agrégations et cron

Le job d'agrégation recalcule :

- l'activité quotidienne ;
- la progression du funnel d'activation ;
- les snapshots de santé des comptes ;
- le statut des runs d'agrégation.

Commande locale :

```bash
npm run jobs:aggregate
```

Endpoint HTTP :

```text
GET /api/jobs/aggregate
POST /api/jobs/aggregate
Authorization: Bearer <CRON_SECRET>
```

L'endpoint accepte `GET` et `POST`. Il peut donc être appelé par Vercel Cron ou
par un service de cron HTTP externe.

`vercel.json` garde un fallback quotidien compatible avec le plan Hobby de
Vercel.

Pour le rythme produit prévu, l'agrégation est appelée toutes les 5 minutes avec
un cron HTTP externe comme cron-job.org :

```text
Authorization: Bearer <CRON_SECRET>
```

## Validation

Validation générale :

```bash
npm run validate
```

Validation avec Supabase configuré :

```bash
npm run validate:real
```

Checks individuels :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run setup:check:strict
npm run setup:smoke
```

## Parcours de démonstration

1. Ouvrir `/`.
2. Ouvrir `/login` et se connecter.
3. Ouvrir `/app` et présenter Northstar Analytics.
4. Ouvrir `/app/integration`.
5. Envoyer un événement de test.
6. Ouvrir `/app/events` et montrer l'événement accepté.
7. Lancer `npm run jobs:aggregate`.
8. Rafraîchir `/app` pour montrer les métriques recalculées.

Le script de présentation détaillé est dans :

```text
PULSEOPS_DEMO_SCRIPT.md
```

## Documentation

- `PRODUCT_BRIEF.md` : périmètre produit et décisions ;
- `ARCHITECTURE.md` : architecture technique ;
- `DESIGN_SYSTEM.md` : identité visuelle et design system ;
- `PLAN_PULSEOPS.md` : plan d'implémentation ;
- `AGGREGATIONS.md` : calcul des métriques ;
- `DATASET.md` : dataset réaliste ;
- `SUPABASE_SETUP.md` : configuration des vraies données ;
- `DEPLOYMENT_CHECKLIST.md` : checklist de mise en production ;
- `PULSEOPS_HANDOFF.md` : état actuel et notes de passation.
