# PulseOps - Plan d'implementation

## Statut

Ce plan sert maintenant de suivi d'implementation. Le cadrage est valide, le
projet Next.js est cree, et le MVP principal fonctionne en mode demo avec un
chemin Supabase/PostgreSQL pret.

Etat actuel estime :

- cadrage produit, architecture, DA et plan : termine ;
- initialisation Next.js, TypeScript, lint, tests : termine ;
- ingestion, cles API, rate limit, migrations Drizzle : termine ;
- jobs d'agregation : termine cote code ;
- endpoint cron compatible rythme 5 minutes via cron HTTP externe gratuit ;
- `vercel.json` garde un fallback quotidien compatible Vercel Hobby ;
- surfaces produit principales : termine en mode demo ;
- branchement Supabase reel : pret cote code, a finaliser avec les variables
  d'environnement et le projet Supabase ;
- polish final responsive/accessibilite : a verifier apres branchement reel.

## Objectif general

Construire PulseOps comme le troisieme projet fort du portfolio :

- SignalDesk prouve le SaaS B2B complet ;
- LaunchPath prouve le workflow metier et l'automatisation ;
- PulseOps prouve l'ingestion, le traitement et la visualisation de donnees.

## Principe directeur

PulseOps doit etre construit depuis la verite des donnees.

Ordre logique :

```text
base de donnees -> ingestion -> dataset -> agregations -> dashboard -> design polish
```

Pourquoi : il faut eviter de designer de beaux ecrans sur des chiffres fictifs.
Les visualisations doivent venir de vrais evenements stockes et calcules.

## Phase 0 - Validation du cadrage

Objectif : valider les quatre documents avant toute creation de projet.

Statut : termine.

Livrables :

- PRODUCT_BRIEF.md ;
- ARCHITECTURE.md ;
- DESIGN_SYSTEM.md ;
- PLAN_PULSEOPS.md.

Criteres de fin :

- le MVP est clair ;
- les choix techniques sont acceptes ;
- la direction artistique est assez precise ;
- les exclusions MVP sont assumees ;
- aucun arbitrage critique ne reste ouvert.

## Phase 1 - Initialisation projet

Objectif : creer la base Next.js proprement apres validation.

Statut : termine.

Actions :

- creer le projet Next.js ;
- activer TypeScript strict ;
- installer Tailwind si retenu au moment de l'implementation ;
- configurer lint et format ;
- ajouter structure de dossiers ;
- preparer variables d'environnement ;
- configurer Git ;
- documenter le lancement local.

Criteres de fin :

- l'app demarre localement ;
- le typecheck passe ;
- le lint passe ;
- la structure reste simple ;
- aucun secret n'est commite.

## Phase 2 - Base de donnees et auth

Objectif : poser les fondations produit.

Statut : implemente cote code, validation reelle a faire avec Supabase connecte.

Actions :

- configurer Supabase ;
- configurer Supabase Auth ;
- installer et configurer Drizzle ;
- modeliser workspaces ;
- modeliser membres et roles ;
- modeliser projets ;
- creer les premieres migrations ;
- verifier l'isolation par workspace.

Criteres de fin :

- un utilisateur peut se connecter ;
- un workspace existe ;
- un projet peut etre cree ;
- les permissions de base sont respectees ;
- les migrations sont reproductibles.

## Phase 3 - Cles API

Objectif : permettre a un projet de recevoir des evenements de maniere credible.

Statut : termine pour creation, affichage unique, hash, derniere utilisation et
revocation. Regeneration volontairement hors MVP actuel.

Actions :

- generer des cles avec prefixe `po_live_` ;
- afficher la cle complete une seule fois ;
- stocker uniquement un hash ;
- afficher ensuite prefixe et derniers caracteres ;
- permettre revocation ;
- permettre regeneration ;
- enregistrer derniere utilisation ;
- tester les cas d'erreur.

Criteres de fin :

- une cle active authentifie l'ingestion ;
- une cle revoquee est refusee ;
- la cle complete n'est pas stockee en clair ;
- les permissions protegent la gestion des cles.

## Phase 4 - API d'ingestion

Objectif : construire le coeur backend de PulseOps.

Statut : termine avec validation, idempotence, logs d'ingestion et rate limit.

Actions :

- creer l'endpoint `POST /api/ingest/track` ;
- verifier la cle API ;
- valider le payload ;
- gerer `event_id` ;
- gerer l'idempotence ;
- stocker `occurred_at` et `received_at` ;
- creer ou mettre a jour utilisateur et entreprise ;
- stocker les proprietes JSON ;
- journaliser les erreurs d'ingestion ;
- appliquer un rate limiting simple.

Criteres de fin :

- un evenement valide est stocke ;
- un doublon n'est pas compte deux fois ;
- un payload invalide renvoie une erreur claire ;
- un evenement en retard garde sa vraie date ;
- les donnees restent isolees par projet.

## Phase 5 - Dataset deterministe

Objectif : produire des donnees de demo realistes.

Statut : termine avec un dataset MVP plus leger : 8 entreprises, 16 utilisateurs
et 851 evenements.

Actions :

- definir un SaaS fictif coherent ;
- creer 40 entreprises ;
- creer environ 300 utilisateurs ;
- generer 90 jours d'evenements ;
- simuler 50 000 a 100 000 evenements ;
- creer plusieurs profils de comptes ;
- introduire une baisse d'activation sur une etape precise ;
- introduire des comptes silencieux ;
- introduire une fonctionnalite correlee aux bons comptes ;
- rendre la generation deterministe.

Criteres de fin :

- le dataset raconte une histoire claire ;
- les volumes restent compatibles avec l'offre gratuite ;
- les graphiques peuvent etre recalcules depuis les evenements ;
- relancer le seed produit les memes donnees.

## Phase 6 - Aggregations

Objectif : calculer les grosses metriques toutes les 5 minutes.

Statut : termine cote code, avec route protegee. Le endpoint accepte `GET` et
`POST`, ce qui permet :

- un fallback Vercel Cron quotidien compatible Hobby ;
- un vrai rythme 5 minutes via cron HTTP externe gratuit ;
- un rythme 5 minutes via Vercel Cron si le projet passe sur un plan adapte.

Actions :

- definir les tables ou vues d'agregation ;
- calculer l'activite temporelle ;
- calculer les etapes du funnel ;
- calculer les comptes inactifs ;
- calculer le score de sante ;
- stocker les raisons du score ;
- enregistrer les runs d'agregation ;
- afficher l'heure du dernier calcul ;
- configurer le cron de deploiement choisi.

Criteres de fin :

- les metriques ne sont pas des constantes frontend ;
- les gros calculs ne sont pas relances inutilement a chaque page ;
- l'interface peut afficher "Dernier calcul" ;
- les resultats sont testables.

## Phase 7 - Surfaces produit

Objectif : construire l'application utilisable.

Statut : termine pour Overview, Projects, Companies, Company detail, Users,
Events, Inactive, Integration, Settings et System.

Vues a construire :

- Overview ;
- Users ;
- Companies ;
- Company detail ;
- Events ;
- Activation funnel ;
- Account health ;
- Integration docs ;
- Project settings ;
- API keys.

Criteres de fin :

- l'Overview donne une decision en moins de cinq minutes ;
- Companies permet de reperer les comptes a risque ;
- Company detail explique le score ;
- Events permet de verifier l'integration ;
- Integration docs permet d'envoyer un premier evenement.

## Phase 8 - Design system et polish

Objectif : donner a PulseOps son identite forte sans perdre la lisibilite.

Statut : direction "Signal Observatory / Product Telemetry Control Room"
appliquee sur les surfaces produit principales.

Actions :

- appliquer la direction "lucidite precise" ;
- creer la landing sombre expressive ;
- construire l'app claire et contrastee ;
- travailler les graphiques annotes ;
- soigner la typographie des chiffres ;
- definir les etats vides ;
- definir les erreurs ;
- rendre les tableaux scannables ;
- verifier le responsive ;
- eviter tout rendu dashboard generique.

Criteres de fin :

- l'identite ne ressemble pas a SignalDesk ;
- la landing marque vite ;
- le dashboard reste lisible ;
- les visualisations aident vraiment a comprendre ;
- les textes ne se chevauchent pas sur mobile.

## Phase 9 - Tests et qualite

Objectif : prouver la fiabilite.

Statut : lint, typecheck, tests automatises et build production passent.

Actions :

- tester la formule de score ;
- tester les agregations ;
- tester l'ingestion ;
- tester les cles API ;
- tester l'isolation multi-tenant ;
- tester le funnel ;
- ecrire un parcours Playwright ;
- documenter un petit test de charge ;
- verifier les requetes SQL critiques ;
- garder les controles lancables avec des scripts npm simples.

Criteres de fin :

- typecheck vert ;
- lint vert ;
- tests principaux verts ;
- CI verte ;
- parcours critique teste ;
- aucun secret dans le repo.

## Phase 10 - Deploiement et demo

Objectif : rendre le projet montrable.

Actions :

- deployer sur Vercel ;
- connecter Supabase ;
- verifier les variables d'environnement ;
- executer les migrations ;
- charger le dataset demo ;
- verifier le cron ;
- tester l'ingestion depuis la documentation ;
- preparer le README ;
- preparer captures et scenario de demo.

Criteres de fin :

- URL publique fonctionnelle ;
- auth fonctionnelle ;
- ingestion fonctionnelle ;
- dashboard alimente par vraies donnees ;
- demo faisable en moins de trois minutes ;
- README clair ;
- GitHub propre.

## Scenario de demo recommande

1. Ouvrir la landing et expliquer la promesse.
2. Se connecter au dashboard.
3. Montrer l'Overview : activation, comptes a risque, dernier calcul.
4. Ouvrir le funnel et montrer l'etape ou l'activation baisse.
5. Ouvrir Companies et filtrer les comptes silencieux.
6. Ouvrir le detail d'une entreprise a risque.
7. Montrer l'explication du score.
8. Aller dans Integration docs.
9. Envoyer un evenement de test avec `curl`.
10. Le retrouver dans Events.

Message final de demo :

```text
PulseOps transforme un evenement envoye par API en signal produit exploitable.
```

## Priorites absolues

Les trois elements qui doivent etre impeccables :

1. ingestion API securisee et documentee ;
2. funnel d'activation calcule depuis les vrais evenements ;
3. sante des entreprises lisible et explicable.

## Bonus apres MVP

Bonus possibles uniquement apres MVP stable :

- ingestion batch ;
- plusieurs funnels sauvegardes ;
- poids configurables du score ;
- environnements par projet ;
- export CSV ;
- cohortes ;
- retention ;
- comparaison de periodes ;
- alertes ;
- Stripe webhooks ;
- SDK npm ;
- visualisation D3 signature ;
- Sentry.

## Definition de termine

PulseOps est considerable comme montrable quand :

- l'application est deployee ;
- l'auth fonctionne ;
- les projets fonctionnent ;
- les cles API fonctionnent ;
- l'ingestion stocke de vrais evenements ;
- les doublons sont geres ;
- les agregations tournent ;
- les graphiques viennent de la base ;
- le funnel est configurable ;
- les comptes inactifs sont visibles ;
- les scores sont expliques ;
- les docs d'integration permettent un test reel ;
- le responsive est propre ;
- les tests critiques existent ;
- la CI est verte ;
- le README explique le projet ;
- la demo raconte une histoire claire.

## Risques a eviter

- commencer par le design avant les donnees ;
- creer trop de vues avant l'ingestion ;
- afficher des chiffres statiques ;
- ajouter trop de services externes ;
- faire un faux temps reel ;
- rendre le score opaque ;
- construire un dashboard generique ;
- elargir le MVP avant que les trois priorites soient solides.

## Decision finale

Le plan privilegie un produit data petit mais credible. PulseOps doit montrer une
chaine complete : evenement recu, donnees stockees, metriques calculees,
visualisations lisibles et decision produit claire.
