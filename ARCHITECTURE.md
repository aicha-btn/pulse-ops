# PulseOps - Architecture

## Statut

Ce document decrit l'architecture technique retenue et implementee pour le MVP
PulseOps. Le projet Next.js existe, les routes principales sont en place,
Supabase/PostgreSQL est valide localement, et le mode demo permet encore de
presenter l'app sans secrets configures.

## Objectif technique

PulseOps doit prouver qu'une application Next.js fullstack peut recevoir des
evenements applicatifs, les valider, les stocker, les agreger et les afficher
dans des visualisations fiables.

Le projet doit diversifier le portfolio : contrairement a SignalDesk, PulseOps
ne reutilise pas Rails. Il met en avant un backend TypeScript, de la modelisation
de donnees, des agregations SQL et une API d'ingestion credible.

## Stack retenue

- Next.js fullstack ;
- TypeScript strict ;
- Supabase PostgreSQL ;
- Supabase Auth ;
- Drizzle ORM ;
- Recharts ;
- Vercel ;
- Vercel Cron ;
- scripts npm de verification locale ;
- controles navigateur pour les parcours critiques ;
- Sentry seulement si sa valeur est confirmee apres MVP.

## Pourquoi cette stack

### Next.js fullstack

Next.js permet de gerer a la fois l'interface et les routes backend dans un seul
projet. Cela suffit pour l'API d'ingestion, les APIs produit, l'authentification
et les dashboards.

### TypeScript strict

TypeScript strict force une meilleure discipline sur les types de donnees. Pour
PulseOps, c'est important car le produit manipule des payloads externes, des
evenements, des proprietes JSON et des calculs de metriques.

### Supabase PostgreSQL

PostgreSQL est adapte au modele relationnel de PulseOps : workspaces, projets,
utilisateurs, entreprises, evenements, cles API et agregations. Supabase fournit
aussi une offre simple pour demarrer gratuitement.

### Supabase Auth

Supabase Auth evite de reconstruire toute la gestion des comptes, sessions et
connexions. Le MVP peut se concentrer sur la valeur data.

### Drizzle ORM

Un ORM est un outil qui aide a manipuler la base depuis le code. Drizzle est
retenu parce qu'il reste proche du SQL. C'est important pour montrer les
competences data au lieu de masquer les requetes critiques.

### Recharts

Recharts est choisi pour le MVP car il permet de construire vite des graphiques
lisibles, accessibles et personnalisables. D3 reste possible plus tard pour une
visualisation signature, mais il n'est pas necessaire au coeur du produit.

### Cron

Un cron est une tache automatique lancee a intervalle regulier. Vercel Cron
sert de fallback quotidien compatible Hobby. Pour le rythme produit de 5
minutes sur une configuration gratuite, PulseOps expose un endpoint HTTP securise
qui peut etre appele par un scheduler externe simple.

## Services volontairement evites

Le MVP n'utilise pas :

- Redis ;
- Kafka ;
- service de queue externe ;
- data warehouse ;
- microservices ;
- Docker obligatoire ;
- service payant ;
- service email ;
- Stripe ;
- Sentry par defaut.

Ces outils peuvent etre utiles dans un systeme plus grand, mais ils ajouteraient
de la complexite avant que le coeur produit soit prouve.

## Concepts techniques expliques

### Ingestion

L'ingestion est le fait de recevoir des donnees envoyees par une application
cliente. Dans PulseOps, l'application cliente envoie des evenements comme
`signed_up`, `project_created` ou `first_event_sent`.

### Idempotence

L'idempotence signifie qu'un meme evenement envoye deux fois ne doit etre compte
qu'une seule fois. PulseOps utilisera un `event_id` unique pour reconnaitre les
doublons.

### Aggregation

Une agregation est un calcul prepare a partir de donnees brutes. Par exemple,
le taux d'activation sur 30 jours est calcule depuis des evenements individuels.

### Multi-tenant

Multi-tenant signifie que plusieurs clients utilisent la meme application, mais
que leurs donnees restent strictement separees.

### Rate limiting

Le rate limiting limite le nombre de requetes acceptees sur une periode donnee.
Il protege l'API contre les abus, les erreurs de boucle et les pics involontaires.

## Modele domaine

Les entites principales :

- workspace ;
- workspace member ;
- project ;
- api key ;
- user ;
- company ;
- event ;
- activation funnel ;
- funnel step ;
- agregation run ;
- account health snapshot ;
- ingestion error.

## Relations principales

Un workspace contient plusieurs projets.

Un projet contient :

- des cles API ;
- des utilisateurs ;
- des entreprises ;
- des evenements ;
- un funnel d'activation principal ;
- des agregations ;
- des erreurs d'ingestion.

Un utilisateur appartient a une entreprise dans le contexte d'un projet.

Un evenement appartient a un projet, peut etre relie a un utilisateur et peut
etre relie a une entreprise.

## Roles

Les roles retenus :

- `owner` : gere le workspace, les membres et les projets ;
- `admin` : gere les projets, les cles API et la configuration ;
- `viewer` : consulte les dashboards sans gerer l'integration.

Le role `viewer` est important pour un outil data : certaines personnes doivent
lire les metriques sans pouvoir modifier les cles API.

## API d'ingestion

Le MVP expose un endpoint principal :

```text
POST /api/ingest/track
```

Le payload contient :

```json
{
  "event_id": "evt_123",
  "event": "project_created",
  "occurred_at": "2026-08-20T12:30:00.000Z",
  "user": {
    "external_id": "user_42",
    "email": "founder@example.com",
    "name": "Aicha"
  },
  "company": {
    "external_id": "company_9",
    "name": "Northstar Labs"
  },
  "properties": {
    "plan": "pro",
    "source": "onboarding"
  }
}
```

## Validation du payload

Le MVP valide :

- presence de `event_id` ;
- presence du nom d'evenement ;
- presence de `occurred_at` ;
- format de date valide ;
- presence d'un utilisateur ;
- taille maximale du payload ;
- profondeur maximale du JSON ;
- types acceptes dans `properties` ;
- noms reserves interdits ;
- cle API valide et active.

Les proprietes d'evenement restent libres en JSON, mais encadrees pour eviter
des donnees trop volumineuses ou difficiles a exploiter.

## Dates des evenements

PulseOps stocke deux dates :

- `occurred_at` : moment ou l'evenement s'est vraiment produit ;
- `received_at` : moment ou PulseOps a recu l'evenement.

Cette distinction est importante car certains evenements peuvent arriver en
retard. Les graphiques doivent analyser l'activite au moment reel de l'action.

## Cles API

Les cles API doivent :

- utiliser un prefixe reconnaissable, par exemple `po_live_` ;
- etre generees avec une forte entropie ;
- etre affichees en entier une seule fois ;
- etre stockees sous forme de hash ;
- afficher ensuite uniquement leur prefixe et leurs derniers caracteres ;
- pouvoir etre revoquees ;
- enregistrer leur derniere utilisation.

Un hash est une empreinte non reversible. La base garde une preuve de la cle,
mais pas la cle lisible. Si la base fuit, les vraies cles ne sont donc pas
directement exposees.

## Securite et isolation

Le MVP doit montrer :

- isolation stricte par workspace et projet ;
- verification des permissions sur chaque route produit ;
- validation stricte des payloads d'ingestion ;
- rate limiting par cle API ;
- journal minimal des erreurs d'ingestion ;
- stockage hashe des cles API ;
- interdiction d'acceder aux donnees d'un autre projet.

## Strategie de calcul des metriques

PulseOps utilise une approche mixte.

Les evenements bruts sont enregistres immediatement. Les vues recentes, comme le
flux d'evenements, peuvent lire directement ces donnees.

Les grosses metriques sont pre-calculees par un job d'agregation. Le rythme
produit vise est toutes les 5 minutes.

Metriques concernees :

- taux d'activation ;
- progression du funnel ;
- activite par jour ou semaine ;
- score de sante des entreprises ;
- comptes inactifs ;
- evolution d'usage par entreprise ;
- statistiques principales de l'Overview.

L'interface affiche clairement l'heure du dernier calcul :

```text
Dernier calcul : 14:35
```

### Pourquoi 5 minutes

Un recalcul toutes les 5 minutes est assez frais pour la demo, tout en restant
honnete. Cela evite de donner une fausse impression de temps reel.

Point de deploiement : le plan gratuit Vercel peut limiter les crons a une
frequence quotidienne. PulseOps garde donc un endpoint d'agregation independant
du scheduler. Le reveil peut venir de Vercel Cron, d'un cron HTTP externe ou
d'une commande manuelle en local.

## Aggregations recommandees

Tables ou vues possibles :

- daily_project_metrics ;
- daily_event_counts ;
- funnel_step_metrics ;
- company_activity_snapshots ;
- company_health_snapshots ;
- aggregation_runs.

Le detail exact sera tranche pendant l'implementation, mais le principe est de
ne pas recalculer tous les graphiques lourds a chaque chargement de page.

## Score de sante

Le score de sante est calcule sur 100 points :

- activite recente : 35 ;
- frequence d'usage : 25 ;
- progression dans le funnel : 25 ;
- utilisation d'evenements cles : 15.

Chaque score doit aussi stocker ou produire des explications. Exemple :

```text
Score 44/100
- aucun evenement depuis 12 jours
- frequence en baisse
- activation bloquee a l'etape "first_event_sent"
```

## Ingestion batch

L'ingestion batch reste hors MVP.

Batch signifie envoyer plusieurs evenements en une seule requete. C'est utile a
grande echelle, mais le MVP priorise une ingestion unitaire robuste, idempotente
et bien documentee.

## Documentation developpeur

La documentation d'integration doit expliquer :

- creation d'une cle API ;
- exemple `curl` ;
- exemple JavaScript ;
- exemple TypeScript ;
- format du payload ;
- reponses de succes ;
- erreurs possibles ;
- verification dans le flux d'evenements ;
- regles sur `event_id`, `occurred_at` et `properties`.

Le MVP ne publie pas de SDK npm. Les snippets suffisent.

## Tests

Tests prioritaires :

- tests unitaires du score de sante ;
- tests unitaires des fonctions d'agregation ;
- tests d'integration de l'ingestion ;
- tests d'integration des cles API ;
- tests d'isolation multi-tenant ;
- test Playwright du parcours principal ;
- petit test de charge documente sur l'endpoint d'ingestion ;
- verification des plans de requetes critiques.

Les controles principaux doivent rester lancables localement avec des scripts npm
simples : lint, typecheck, tests et eventuellement Playwright selon le cout
d'execution. On evite GitHub Actions dans le MVP pour garder moins de services a
brancher.

## Ordre technique recommande

1. Schema de base de donnees.
2. Auth et workspaces.
3. Projets et cles API.
4. Endpoint d'ingestion.
5. Dataset deterministe.
6. Jobs d'agregation.
7. APIs dashboard.
8. Vues produit.
9. Tests et CI.
10. Polish design et responsive.

## Risques techniques

Risques a surveiller :

- requetes trop lentes sur les evenements bruts ;
- score de sante trop opaque ;
- mauvaise isolation entre projets ;
- validation d'ingestion insuffisante ;
- rate limiting trop complexe pour le MVP ;
- faux temps reel ;
- dataset trop aleatoire pour raconter une histoire.

## Decision finale

L'architecture de PulseOps doit rester simple mais solide : une base relationnelle
claire, une ingestion fiable, des agregations periodiques et des visualisations
qui viennent de vraies donnees.
