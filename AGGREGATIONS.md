# PulseOps - Aggregations et score de sante

## Idee simple

L'endpoint d'ingestion stocke les evenements bruts.

Le job d'aggregation transforme ces evenements en petites tables de synthese :

- `daily_project_metrics` : activite par jour ;
- `funnel_step_metrics` : progression dans le funnel d'activation ;
- `company_health_snapshots` : score de sante des comptes.

Un evenement brut est comme un ticket de caisse. Une aggregation est le resume
du mois sur ton compte bancaire : plus rapide a lire, plus utile pour decider.

## Job principal

Le job vit ici :

```text
POST /api/jobs/aggregate
GET /api/jobs/aggregate
```

Il demande :

```text
Authorization: Bearer <CRON_SECRET>
```

Sans `CRON_SECRET`, le job refuse de tourner. C'est volontaire : ce endpoint peut
faire beaucoup de calculs, donc il ne doit pas etre public.

## Score de sante MVP

Le score est sur 100 points :

- 40 points : recence de l'activite ;
- 25 points : frequence des evenements sur 14 jours ;
- 20 points : progression dans le funnel d'activation ;
- 15 points : presence d'evenements cles recents.

### Recence

- 0-1 jour sans activite : 40 points ;
- 2-3 jours : 34 points ;
- 4-7 jours : 26 points ;
- 8-14 jours : 14 points ;
- au-dessus du seuil d'inactivite : 0 point.

### Frequence

- 20 evenements ou plus sur 14 jours : 25 points ;
- 8 a 19 evenements : 18 points ;
- 3 a 7 evenements : 10 points ;
- 1 a 2 evenements : 5 points ;
- 0 evenement : 0 point.

### Funnel

Le compte gagne jusqu'a 20 points selon le nombre d'etapes d'activation
atteintes. Exemple avec 4 etapes :

```text
2 etapes atteintes / 4 etapes = 10 points
```

### Evenements cles

Les evenements cles MVP sont :

- `first_event_sent` ;
- `dashboard_viewed` ;
- `report_shared` ;
- `teammate_invited`.

Deux evenements cles ou plus donnent 15 points. Un seul donne 10 points.

## Statuts

- `healthy` : 75 points ou plus ;
- `watch` : 55 a 74 points ;
- `at_risk` : 35 a 54 points ;
- `silent` : moins de 35 points, ou inactivite au-dessus du seuil projet.

## Lancer en local

Quand Supabase est configure :

```bash
npm run jobs:aggregate
```

## Lancer automatiquement

Le fichier `vercel.json` declare un Cron Job Vercel compatible avec le plan
Hobby :

```json
{
  "crons": [
    {
      "path": "/api/jobs/aggregate",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Ce planning signifie : lancer le job une fois par jour. Ce n'est pas le rythme
produit ideal, mais c'est le choix le plus deployable sur un plan Vercel gratuit.

Variable Vercel a creer :

```text
CRON_SECRET
```

Vercel envoie automatiquement ce secret dans le header d'autorisation quand le
Cron Job appelle l'endpoint :

```text
Authorization: Bearer <CRON_SECRET>
```

Pour obtenir le rythme produit retenu de 5 minutes sans passer Vercel en Pro,
utiliser un cron HTTP gratuit comme cron-job.org :

```text
GET https://<deployment-url>/api/jobs/aggregate
Authorization: Bearer <CRON_SECRET>
Schedule: */5 * * * *
```

Pourquoi ce choix : PulseOps garde un seul endpoint d'aggregation. Le service qui
le reveille peut changer sans toucher au code.
