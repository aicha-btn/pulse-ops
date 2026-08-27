# PulseOps - Script de demo portfolio

## Objectif de la demo

Montrer que PulseOps transforme des evenements produits bruts en signaux
actionnables :

```text
event -> validation -> stockage -> aggregation -> visualisation -> decision
```

La demo doit prouver trois competences :

- construire une API d'ingestion credible ;
- calculer des metriques depuis de vraies donnees ;
- presenter les resultats avec une interface data lisible et originale.

## Demo courte en 5 minutes

### 1. Landing page

Route :

```text
/
```

Ce qu'il faut dire :

> PulseOps est un outil B2B qui ecoute les evenements d'un produit et transforme
> ce flux en signaux de sante compte.

Point a montrer :

- identite radar/signal ;
- promesse product analytics ;
- lien vers l'app.

### 2. Connexion

Route :

```text
/login
```

Ce qu'il faut dire :

> L'espace produit est protege par Supabase Auth. Sans connexion, PulseOps
> garde un mode demo, mais ici on montre la version branchee a PostgreSQL.

Point a montrer :

- connexion avec un compte test ;
- redirection vers `/app` ;
- projet courant `Northstar Analytics`.

### 3. Overview

Route :

```text
/app
```

Ce qu'il faut dire :

> L'Overview n'est pas juste quatre KPI. C'est un briefing : activation, comptes
> silencieux, activite globale et principal drop-off.

Point a montrer :

- `Last calculation` ;
- `Activity over time` ;
- funnel d'activation ;
- comptes silencieux ;
- event stream recent.

Explication simple :

> Les gros chiffres ne sont pas recalcules a chaque page. Un job d'aggregation
> les prepare toutes les 5 minutes.

### 4. Integration et ingestion reelle

Route :

```text
/app/integration
```

Ce qu'il faut dire :

> Cette page est la preuve backend : on utilise une cle API de projet, on envoie
> un event, et l'API renvoie `persisted` quand PostgreSQL l'a stocke.

Point a montrer :

- API key masquee par defaut ;
- bouton `Send demo event` ;
- reponse `202` ;
- `mode: persisted` ;
- `api_key_preview` et non cle complete.

### 5. Event Stream

Route :

```text
/app/events
```

Ce qu'il faut dire :

> Ici on voit les evenements entrants comme une timeline de telemetry. Accepted
> veut dire stocke, ignored veut dire doublon ignore, rejected veut dire payload
> invalide.

Point a montrer :

- dernier event de test ;
- filtre par statut ;
- timeline ;
- lien vers l'entreprise ;
- distinction accepted / ignored / rejected.

### 6. Companies

Route :

```text
/app/companies
```

Ce qu'il faut dire :

> PulseOps est B2B : l'unite importante n'est pas seulement l'utilisateur, c'est
> le compte client.

Point a montrer :

- account signal registry ;
- score ;
- statut stable / watch / weakening / lost ;
- composants du score.

### 7. Company detail

Route exemple :

```text
/app/companies/rivetcloud
```

Ce qu'il faut dire :

> Le score est transparent. Il n'est pas presente comme de l'IA. On voit les
> points exacts : recence, frequence, funnel, key events.

Point a montrer :

- score 34 ;
- signal lost ;
- last signal ;
- score explanation ;
- recommended next action.

### 8. Inactive

Route :

```text
/app/inactive
```

Ce qu'il faut dire :

> Cette page sert a prioriser la recuperation des comptes silencieux. Plus le
> signal se degrade, plus l'action client devient prioritaire.

Point a montrer :

- signal decay ;
- lowest signal first ;
- comptes silencieux ;
- queue de recovery.

### 9. System

Route :

```text
/app/system
```

Ce qu'il faut dire :

> Cette page montre ce qui est pret pour passer du mode demo aux vraies donnees :
> PostgreSQL, Supabase Auth, Cron secret et ingestion.

Point a montrer :

- readiness percentage ;
- checks manquants ;
- chemin Supabase handoff.

## Demo longue en 10-12 minutes

Ajouter :

- `/app/projects` pour expliquer qu'un projet = un flux produit isole ;
- `/app/users` pour montrer les signaux individuels ;
- `/app/settings` pour montrer que le funnel et le seuil d'inactivite sont
  configurables.

## Questions probables et reponses simples

### Pourquoi des aggregations toutes les 5 minutes ?

Parce que les gros calculs peuvent etre couteux. On les prepare en avance pour
que l'interface reste rapide.

### Pourquoi Supabase ?

Pour avoir PostgreSQL et Auth gratuitement, sans multiplier les services.

### Pourquoi Drizzle ?

Drizzle garde le code proche du SQL tout en restant type en TypeScript.

### Pourquoi un mode demo ?

Pour que le portfolio reste visible meme sans secrets Supabase configures.

### Est-ce que les metriques sont fake ?

Non. En mode demo, elles viennent d'un dataset TypeScript deterministe. En mode
reel, elles viennent de PostgreSQL et des tables d'agregation.

### Est-ce que le score est de l'IA ?

Non. C'est une formule transparente sur 100 points. C'est volontaire : l'objectif
est de rester explicable.

## Phrase finale de demo

> PulseOps montre que je sais construire toute la chaine data d'un SaaS :
> ingestion API, securite des cles, stockage PostgreSQL, aggregations, puis
> visualisation lisible pour prendre une decision produit.
