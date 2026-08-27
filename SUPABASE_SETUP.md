# PulseOps - Configuration Supabase

## Idee simple

Supabase fournit deux choses utiles pour PulseOps :

- PostgreSQL : la vraie base ou PulseOps stocke les projets, entreprises,
  utilisateurs et evenements ;
- Auth : la gestion des comptes et sessions pour proteger l'espace `/app`.

PostgreSQL est le coffre de donnees. Supabase est le service gratuit qui heberge
ce coffre. Drizzle est l'outil TypeScript qui nous permet de parler a ce coffre
avec des requetes propres et typees.

Auth est le badge d'entree. Quand Supabase est configure, PulseOps verifie ce
badge avant d'afficher `/app`. Sans Supabase, l'app reste ouverte en mode demo
pour que le portfolio soit toujours consultable.

Quand un utilisateur connecte ouvre `/app` pour la premiere fois, PulseOps lui
prepare automatiquement un workspace, un projet et le funnel d'activation de
base. Cela evite un ecran vide incomprehensible au premier lancement.

## Variables a creer

Copier `.env.example` vers `.env.local`, puis remplir :

```bash
cp .env.example .env.local
```

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."
CRON_SECRET=""
INGESTION_RATE_LIMIT_PER_MINUTE=120
NEXT_PUBLIC_INGESTION_TEST_KEY=""
SEED_DEMO_API_KEY=""
```

### Ce que chaque variable veut dire

- `DATABASE_URL` : l'adresse privee de la base PostgreSQL. Le serveur Next.js
  l'utilise pour lire et ecrire les donnees.
- `NEXT_PUBLIC_SUPABASE_URL` : l'adresse publique du projet Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : la cle publique utilisee par le
  client Supabase. Elle est visible cote navigateur, donc elle ne doit jamais
  donner de droits admin.
- `NEXT_PUBLIC_INGESTION_TEST_KEY` : cle de test locale pour le bouton
  "Send demo event". Elle sert uniquement au developpement. En production, on
  cree plutot une vraie cle depuis `/app/integration`.
- `SEED_DEMO_API_KEY` : optionnel. Si on veut forcer une cle de seed precise,
  on la met ici avant `npm run db:seed`.
- `CRON_SECRET` : mot de passe serveur utilise pour proteger le job
  d'aggregation.
- `INGESTION_RATE_LIMIT_PER_MINUTE` : nombre maximal de requetes acceptees par
  cle API chaque minute. La valeur par defaut est 120.

`SUPABASE_SERVICE_ROLE_KEY` existe dans `.env.example`, mais on ne l'utilise pas
encore. C'est une cle tres puissante, donc elle doit rester cote serveur et ne
jamais etre exposee dans le navigateur.

## Ordre de lancement

1. Creer un projet Supabase gratuit.
2. Copier l'URL du projet et la cle publique dans `.env.local`.
3. Copier la connection string PostgreSQL dans `DATABASE_URL`.

Important : si le mot de passe contient des caracteres speciaux, comme `@`,
`#`, `%`, `[` ou `]`, il doit etre encode dans l'URL. Sinon PostgreSQL ne sait
plus lire correctement la connection string. Image simple : l'URL utilise deja
certains caracteres comme panneaux de signalisation, donc si ton mot de passe
contient les memes signes, il faut les "emballer" pour eviter la confusion.

4. Verifier ce qui est pret :

```bash
npm run setup:check
```

Cette commande lit `.env.local` et affiche les pieces manquantes. La version
stricte renvoie une erreur si une piece obligatoire manque :

```bash
npm run setup:check:strict
```

5. Lancer les migrations Drizzle :

```bash
npm run db:migrate
```

6. Creer les donnees de depart :

```bash
npm run db:seed
```

Le seed cree 8 entreprises, 16 utilisateurs et 851 evenements realistes.

7. Lancer un premier calcul de metriques :

```bash
npm run jobs:aggregate
```

8. Verifier que la vraie base repond :

```bash
npm run setup:smoke
```

Cette commande ne modifie rien. Elle compte les workspaces, projets, entreprises,
utilisateurs, evenements et tables d'agregation pour confirmer que le mode reel
est pret.

9. Copier la cle affichee par le seed dans `NEXT_PUBLIC_INGESTION_TEST_KEY`.
10. Redemarrer le serveur local :

```bash
npm run dev
```

11. Ouvrir `/app/integration` et envoyer un evenement de test.
12. Ouvrir `/login`, creer un compte ou se connecter, puis revenir dans `/app`.

## Comportement attendu

## Etat local actuel

Le branchement reel a ete effectue sur ce poste :

- `.env.local` est rempli ;
- `setup:check:strict` affiche 100% de readiness ;
- les migrations Drizzle sont appliquees ;
- le seed demo a insere les donnees de depart ;
- l'agregation a calcule les metriques ;
- `setup:smoke` confirme les donnees en PostgreSQL ;
- `lint`, `test` et `build` passent.

Le point restant cote Supabase est la session Auth : avec Auth configure,
`/app` redirige normalement vers `/login` tant qu'aucun compte n'est connecte.
Il faut donc creer un compte test depuis `/login`, puis revenir dans `/app`.

Pour la demo portfolio, un compte connecte est rattache au workspace seedé
`PulseOps Demo / Northstar Analytics` quand celui-ci existe. Cela evite une
premiere experience vide avec 0 evenement.

Pourquoi : le seed cree un projet rempli, mais Auth cree aussi un workspace par
utilisateur. Sans alignement, l'utilisateur regarde un projet vide pendant que le
testeur d'ingestion envoie les events vers le projet demo. Les deux doivent
pointer vers la meme source de telemetry.

Sans `DATABASE_URL`, PulseOps reste en mode demo et l'endpoint d'ingestion
renvoie `validation_only`.

Avec `DATABASE_URL`, PulseOps lit Supabase PostgreSQL pour les dashboards et
stocke les evenements recus par `/api/ingest/track`.

Sans variables Supabase Auth, `/app` reste ouvert en mode demo.

Avec variables Supabase Auth, `/app` redirige vers `/login` quand aucun
utilisateur n'est connecte.

Au premier acces connecte, PulseOps cree aussi le workspace et le projet par
defaut de cet utilisateur si aucun n'existe encore.

Depuis `/app/projects`, on peut creer plusieurs projets et choisir le projet
courant. Ce choix est garde dans un cookie serveur et pilote les dashboards,
cles API, utilisateurs suivis et reglages.

Depuis `/app/integration`, un utilisateur peut creer une cle API pour son projet.
La cle complete est affichee une seule fois. Ensuite, PulseOps ne garde que son
hash, comme pour un mot de passe.

Chaque cle API a aussi une limite de requetes par minute. Si une integration
envoie trop vite, `/api/ingest/track` renvoie `429 rate_limit_exceeded` avec le
nombre de secondes a attendre avant de reessayer.

La page `/app/integration` documente aussi le contrat d'ingestion : champs
obligatoires, contexte optionnel, regles de validation et exemples de reponses
API.

Dans `/app/events`, le flux d'ingestion distingue :

- `accepted` : l'evenement est stocke et compte dans les metriques ;
- `ignored` : l'evenement est valide, mais son `event_id` existe deja ;
- `rejected` : le payload est invalide et doit etre corrige cote integration.

Dans `/app/users`, PulseOps affiche les utilisateurs suivis depuis le flux
d'evenements : entreprise rattachee, role, derniere activite et volume
d'evenements recents.

Dans `/app/companies` et `/app/inactive`, le score de sante est detaille en
quatre composantes :

- recency : est-ce que le compte a envoye de l'activite recemment ;
- frequency : combien d'evenements recents le compte produit ;
- funnel : jusqu'ou le compte avance dans le funnel d'activation ;
- key events : est-ce que des evenements importants arrivent encore.

Depuis `/app/settings`, on peut modifier le nom du projet, le seuil
d'inactivite et les etapes du funnel. Ces reglages influencent les prochains
calculs du job d'aggregation.

Depuis `/app/system`, on peut verifier rapidement si les pieces techniques sont
pretes : PostgreSQL, Supabase Auth, secret du cron, test d'ingestion et chemin de
deploiement. C'est la page a ouvrir avant de passer du mode demo aux vraies
donnees.

Avec `CRON_SECRET`, PulseOps peut aussi lancer `/api/jobs/aggregate` pour mettre
a jour les tables de synthese.
