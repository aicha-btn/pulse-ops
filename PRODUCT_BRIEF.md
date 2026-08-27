# PulseOps - Product Brief

## Statut

Ce document reste la source de verite produit. Le projet Next.js couvre le MVP
principal avec un mode demo de secours et un branchement Supabase/PostgreSQL
valide localement.

## Pitch court

PulseOps est un SaaS d'analytics produit pour petites equipes B2B qui transforme
les evenements applicatifs en decisions lisibles : comprendre l'activation,
identifier les abandons et agir avant que les comptes deviennent silencieux.

## Positionnement

PulseOps n'est pas un clone simplifie de PostHog, Mixpanel ou Amplitude. Le
produit se concentre sur une lecture B2B simple : quels comptes s'activent,
lesquels ralentissent, ou les utilisateurs abandonnent et quelles actions une
petite equipe doit prioriser.

La proposition de valeur tient en une phrase :

> Voir l'activation, comprendre les abandons, agir avant que les comptes ne
> deviennent silencieux.

## Cible principale

La cible principale est la fondatrice d'un SaaS B2B d'environ 5 a 20 personnes.
Elle doit comprendre rapidement si le produit cree de la valeur et quels comptes
meritent une action.

Les Product Managers, Customer Success Managers et profils Growth sont des
utilisateurs directs importants, mais secondaires dans le message. Ils utilisent
PulseOps pour analyser les parcours, suivre les comptes et verifier que les
actions produit ameliorent l'activation.

### Pourquoi ce choix

La fondatrice est la cible la plus forte pour la landing car elle relie produit,
clients et business. Elle donne a PulseOps un angle decisionnel plus clair qu'un
outil adresse seulement a des analystes ou a des Product Managers.

## Probleme

Une petite equipe SaaS B2B possede des donnees d'usage, mais elles sont souvent
dispersees, peu lisibles ou trop techniques. L'equipe ne sait pas toujours :

- si les nouveaux utilisateurs atteignent vraiment l'activation ;
- ou ils abandonnent dans le parcours initial ;
- quels comptes utilisent encore le produit ;
- quels comptes deviennent inactifs ;
- quels signaux devraient declencher une action Customer Success ou produit.

## Resultat attendu

En moins de cinq minutes, PulseOps doit permettre de repondre a trois questions :

1. Qui s'active ?
2. Ou est-ce que ca bloque ?
3. Quels comptes risquent de partir ?

Le produit doit ensuite orienter vers une action claire : corriger une etape
d'onboarding, contacter un compte silencieux, verifier une integration ou
surveiller une fonctionnalite cle.

## MVP

Le MVP comprend les surfaces suivantes :

- creation et gestion de projets ;
- generation et revocation de cles API ;
- endpoint d'ingestion `track` ;
- stockage PostgreSQL des utilisateurs, entreprises et evenements ;
- vue Overview ;
- vue Users ;
- vue Companies ;
- vue Events ;
- funnel d'activation configurable ;
- vue Account Health ;
- filtres par statut, plan et recherche selon les vues ;
- detection des comptes inactifs ;
- documentation d'integration avec exemple `curl`, payloads et reponses API ;
- dataset de demonstration realiste.

## Decisions MVP

### Projets

Un workspace peut creer plusieurs projets. Pour le MVP, chaque projet represente
un produit SaaS en production. La separation `development`, `staging` et
`production` reste hors MVP.

### Funnel d'activation

Chaque projet possede un seul funnel principal configurable. L'utilisateur choisit
une suite ordonnee d'evenements et une fenetre d'activation.

Un funnel fixe serait trop artificiel. Plusieurs funnels sauvegardes seraient
utiles plus tard, mais alourdiraient le MVP.

### Score de sante

Le score de sante est une formule fixe, simple et documentee sur 100 points. Il
ne doit jamais etre presente comme de l'intelligence artificielle.

La formule retenue :

- activite recente : 40 points ;
- frequence d'usage : 25 points ;
- progression dans le funnel : 20 points ;
- utilisation d'evenements cles : 15 points.

Chaque score doit afficher ses raisons principales, par exemple :

```text
Score 62/100
- activite recente correcte
- frequence en baisse
- activation incomplete
- aucun evenement cle depuis 10 jours
```

### Compte inactif

Un compte est considere inactif lorsqu'il n'a emis aucun evenement depuis un
seuil defini. Le seuil par defaut est de 14 jours et pourra etre configurable
par projet.

### Evenements

Le MVP expose un endpoint `track` unique. Chaque evenement contient :

- un `event_id` obligatoire ;
- un nom d'evenement ;
- un horodatage `occurred_at` ;
- un identifiant utilisateur ;
- un identifiant d'entreprise optionnel ;
- des proprietes JSON optionnelles ;
- des traits utilisateur et entreprise optionnels.

Les endpoints separes `identify` et `group` restent hors MVP.

## Fonctionnalites hors MVP

Les fonctionnalites suivantes sont volontairement exclues du premier MVP :

- import et export CSV ;
- webhooks Stripe ;
- alertes email ;
- rapport hebdomadaire ;
- cohortes ;
- retention avancee ;
- comparaison de periodes avancee ;
- detection d'anomalies ;
- SDK npm publie ;
- environnements multiples par projet ;
- Sentry, sauf besoin confirme apres coup.

### Pourquoi les exclure

Ces fonctionnalites sont utiles, mais elles detournent l'effort du coeur du
projet : ingestion API, donnees fiables, agregations SQL, funnel d'activation et
sante des comptes. PulseOps doit etre plus petit mais beaucoup plus credible.

## Jeu de demonstration

Le dataset de demo raconte l'histoire d'un SaaS B2B fictif :

- l'activation baisse sur une etape precise ;
- plusieurs comptes importants perdent progressivement en activite ;
- certains comptes deviennent silencieux depuis 14 jours ou plus ;
- une fonctionnalite semble correlee aux comptes en bonne sante.

Volume seed MVP :

- 8 entreprises ;
- 16 utilisateurs ;
- 851 evenements ;
- generation deterministe pour obtenir les memes donnees a chaque seed.

Apres les tests d'ingestion manuels, le nombre d'evenements local peut etre plus
eleve. C'est attendu : cela prouve que l'API ajoute de vrais evenements au flux.

Les donnees ne doivent pas etre de simples valeurs statiques dans le frontend.
Les graphiques et scores doivent venir des evenements stockes puis calcules.
Le volume volontairement reduit garde le projet simple a lancer gratuitement
tout en montrant le parcours complet : ingestion, stockage, agregation, lecture.

## Differenciation portfolio

PulseOps doit demontrer autre chose que SignalDesk et LaunchPath :

- API d'ingestion ;
- securite de cles API ;
- modelisation B2B utilisateur/entreprise ;
- SQL et agregations ;
- traitement asynchrone ;
- visualisation de donnees honnete ;
- documentation developpeur ;
- backend TypeScript avec Next.js.

Le message envoye au recruteur :

> Je sais transformer des donnees brutes en informations produit utiles.

## Criteres de reussite produit

PulseOps est reussi si une demo peut montrer clairement :

1. un evenement envoye avec une vraie cle API ;
2. sa validation et son stockage ;
3. son apparition dans le flux d'evenements ;
4. son impact sur les agregations ;
5. son influence sur le funnel ou le score de sante ;
6. une decision lisible pour l'utilisateur.

La chaine a prouver :

```text
evenement envoye -> validation -> stockage -> agregation -> graphique -> decision
```

## Risques produit

PulseOps serait rate malgre un code propre si :

- les graphiques semblent generiques ;
- les metriques paraissent inventees ;
- le score de sante est opaque ;
- l'ingestion semble artificielle ;
- le produit ment sur du faux temps reel ;
- le MVP devient trop large pour etre fiable.

## Decision finale

PulseOps sera un SaaS data sobrement ambitieux : peu de fonctionnalites, mais
chaque metrique devra etre reelle, explicable, calculee et utile.
