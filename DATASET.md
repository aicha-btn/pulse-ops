# PulseOps - Dataset demo

## Objectif

Le dataset demo sert a montrer PulseOps avec de vraies donnees stockees en
PostgreSQL, pas seulement avec des cartes statiques.

Il cree :

- 8 entreprises ;
- 16 utilisateurs ;
- 851 evenements ;
- plusieurs profils de sante : healthy, steady, cooling, watch, at_risk,
  silent.

## Pourquoi ce format

Un bon dataset produit ne doit pas etre parfaitement regulier. Sinon les
graphiques sont propres mais peu credibles.

Le seed simule donc :

- des comptes tres actifs ;
- des comptes qui ralentissent ;
- des comptes bloques avant `first_event_sent` ;
- des comptes devenus silencieux ;
- des equipes avec plusieurs utilisateurs ;
- des plans `starter`, `growth` et `scale`.

## Evenements generes

Le funnel d'activation utilise :

```text
signed_up
project_created
api_key_created
first_event_sent
```

Les evenements d'usage incluent :

```text
dashboard_viewed
account_filtered
health_score_opened
report_shared
teammate_invited
alert_rule_created
export_downloaded
integration_checked
```

Les comptes pas encore actives peuvent aussi envoyer :

```text
docs_viewed
api_key_copied
integration_error_seen
```

## Lancer le dataset

Quand Supabase est configure :

```bash
npm run db:seed
npm run jobs:aggregate
```

`db:seed` cree les evenements bruts.

`jobs:aggregate` transforme ces evenements en metriques pre-calculees pour le
dashboard.

## Detail utile

Le seed passe par `storeTrackEvent`, la meme fonction que l'endpoint
`/api/ingest/track`.

Pourquoi c'est important : le dataset teste aussi l'insertion reelle, les
upserts d'entreprises/utilisateurs et l'idempotence des `event_id`.
