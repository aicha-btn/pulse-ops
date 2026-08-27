# PulseOps - Design System

## Statut

Ce document cadre l'identite visuelle, le langage d'interface et les principes
d'interaction. Il doit rester aligne avec l'implementation Next.js en cours.

Statut actuel : la direction "Signal Observatory / Product Telemetry Control
Room" est appliquee sur l'app principale : Overview, Projects, Companies,
Company detail, Users, Events, Inactive, Integration, Settings et System.

## Intention generale

PulseOps doit etre un produit data a identite forte : sophistique, original,
lisible et honnete. Il ne doit pas ressembler a un dashboard generique, ni copier
SignalDesk ou LaunchPath.

La sensation dominante est la lucidite operationnelle.

PulseOps doit donner l'impression suivante :

> Je vois enfin ce qui se passe dans mon produit, et je sais ou agir.

## Personnalite de marque

Mots a rechercher :

- lucide ;
- precis ;
- atypique ;
- analytique ;
- humain ;
- sophistique ;
- operationnel ;
- nerveux mais controle.

Mots a eviter :

- generique ;
- crypto ;
- cyberpunk ;
- medical ;
- bancaire ;
- enfantin ;
- froid ;
- gadget ;
- faux futuriste.

## Metaphore centrale

La metaphore retenue est l'observatoire de signaux produit.

PulseOps doit donner l'impression d'un espace de decision qui capte les
changements de rythme des comptes B2B. La direction doit rester sophistiquee,
calme et precise : micro-grilles discretes, surfaces de donnees nettes, accents
acides controles et panneaux sombres texturés.

On evite explicitement les formes gaming, les coins coupes agressifs, les
boutons en fleche, les effets marque-page, les cercles decoratifs, les fonds
creme trop sages et les compositions de dashboard classiques.

Un signal faible est un petit indice qui annonce un probleme avant qu'il soit
evident, par exemple une baisse progressive d'activite sur un compte important.

## Niveau d'expression

- Landing page : 8/10 en extravagance.
- Application : 6/10 en extravagance.

La landing doit marquer les esprits en quelques secondes. L'application doit
rester confortable, dense et fiable pour une utilisation quotidienne.

## Direction visuelle

La landing peut etre sombre, expressive et immersive, mais sans langage pointu
ou gaming.

L'application doit etre principalement claire, avec des contrastes forts, une
palette distinctive et des zones de donnees tres lisibles. Le shell produit peut
etre plus marque : sidebar sombre, navigation nette, panneaux sombres en
micro-grille.

Pourquoi :

- les donnees, tableaux et graphiques sont plus lisibles dans une interface claire ;
- le contraste entre landing et produit cree une marque plus memorable ;
- l'identite peut etre forte sans sacrifier la comprehension.

## Primitives implementees

Les composants reutilisables principaux vivent dans :

```text
src/components/app/pulse-primitives.tsx
```

Ils donnent le vocabulaire commun de l'application :

- `TelemetryPanel` : panneau clair ou sombre pour les surfaces de donnees ;
- `SystemLabel` : label technique avec icone optionnelle ;
- `SignalIndicator` : petit point de statut, jamais seul sans texte ;
- `PulseBadge` : badge court pour statut, source ou mode ;
- `MiniTrace` : micro-courbe qui suggere stable, rising, degrading ou silent ;
- `SignalMetric` : metrique avec valeur, delta, trace et lecture ;
- `EventNode` : ligne de timeline pour le flux d'evenements ;
- `OpenMetricRail` : rail de metriques sans effet "quatre cards generiques".

Pourquoi : ces primitives evitent de redesigner chaque page a la main et
gardent une identite PulseOps reconnaissable.

## Palette

La palette doit etre expressive mais fonctionnelle.

Cela signifie que les couleurs participent a l'identite, mais gardent un role
clair dans les donnees.

Roles recommandes :

- sain : vert acide controle ;
- attention : ambre dense ;
- risque : corail-framboise ;
- activite : cyan electrique ;
- neutre : fonds froids gris-bleu tres pales ;
- structure : encre aubergine tres sombre ;
- accent marque : violet ou bleu franc, utilise avec parcimonie.

Les couleurs ne doivent jamais rendre une metrique plus positive ou plus grave
qu'elle ne l'est. La visualisation doit rester honnete.

## Typographie

Direction retenue : interface precise avec presence monospace.

Une police monospace est une police ou chaque caractere occupe la meme largeur.
Elle donne une impression de precision et fonctionne bien pour :

- cles API ;
- timestamps ;
- noms d'evenements ;
- valeurs techniques ;
- petits labels de donnees.

Elle ne doit pas dominer toute l'interface pour eviter un rendu froid ou trop
developpeur.

Structure recommandee :

- une grotesque nette pour l'interface ;
- une monospace expressive pour les donnees techniques ;
- des chiffres bien dessines pour les metriques.

## Mise en page

La mise en page de l'application doit utiliser une grille stable avec quelques
ruptures controlees.

La grille donne de la confiance : les tableaux, filtres, cartes et graphiques
doivent etre alignes et faciles a scanner.

Les ruptures visuelles doivent etre reservees :

- a la landing ;
- aux moments de decision ;
- aux annotations importantes ;
- aux surfaces signature comme le detail entreprise.

## Ecran principal

L'Overview ne doit pas etre un mur de KPI.

Un KPI est un indicateur cle, par exemple taux d'activation ou comptes actifs.
PulseOps doit eviter d'empiler des cartes de chiffres sans contexte.

L'Overview doit fonctionner comme un briefing de decision :

- ce qui s'ameliore ;
- ce qui bloque ;
- quels comptes sont a risque ;
- quels evenements recents comptent ;
- quand les metriques ont ete calculees.

## Visualisations

Les graphiques doivent etre editoriaux et annotes.

Un graphique annote ajoute des explications directement dans ou autour de la
visualisation. Exemple :

```text
Baisse visible apres l'etape "first_event_sent"
```

Objectif :

- aider a comprendre vite ;
- montrer les causes possibles ;
- eviter les courbes decoratives ;
- garder les donnees lisibles et honnetes.

## Types de visualisations attendus

### Activite temporelle

Courbe ou barres montrant l'activite sur la periode choisie. Elle doit pouvoir
montrer les variations sans dramatiser artificiellement les petits ecarts.

### Funnel d'activation

Visualisation des etapes d'activation avec pertes entre chaque etape. Elle doit
rendre visible ou les utilisateurs abandonnent.

### Sante des comptes

Liste ou tableau enrichi des entreprises avec score, tendance, derniere activite
et raison du risque.

### Detail entreprise

Vue narrative d'un compte : score, activite, utilisateurs, evenements recents,
signaux faibles et explication de la note.

### Flux d'evenements

Vue technique mais claire, utile pour verifier l'integration. Les noms
d'evenements, timestamps et proprietes doivent etre faciles a lire.

## Interaction signature

L'interaction la plus memorable doit etre l'inspection d'un compte.

Quand l'utilisateur ouvre une entreprise, il doit comprendre :

- son score actuel ;
- pourquoi ce score existe ;
- quand l'activite a change ;
- quels utilisateurs sont actifs ;
- quels evenements manquent ;
- quelle action semble prioritaire.

Cette vue incarne la difference B2B de PulseOps.

## Deuxieme interaction forte

La construction du funnel doit etre claire et tangible.

L'utilisateur choisit des evenements dans l'ordre pour definir l'activation :

```text
signed_up -> project_created -> api_key_created -> first_event_sent
```

Cela montre que PulseOps n'est pas un dashboard statique. Les metriques dependent
de la configuration et des vrais evenements.

## Mouvement

Le MVP utilise surtout des micro-transitions CSS. GSAP reste possible plus tard
sur la landing si une animation signature devient necessaire.

Le mouvement doit servir :

- l'attention ;
- la comprehension d'un changement ;
- la sensation de donnees vivantes.

Il ne doit pas donner une fausse impression de temps reel.

## Temps reel

PulseOps ne doit pas mentir.

Les evenements recents peuvent apparaitre immediatement dans le flux. Les grosses
metriques sont recalculees par le job d'agregation, avec un rythme produit vise
de 5 minutes quand le scheduler de deploiement le permet.

L'interface doit afficher :

```text
Dernier calcul : 14:35
```

Cela donne une experience professionnelle : vivante, mais honnete.

## Densite

La densite retenue est progressive.

L'utilisateur commence avec une lecture simple, puis peut ouvrir le detail :

- Overview claire ;
- listes scannables ;
- filtres visibles ;
- details disponibles au clic ;
- explications du score accessibles sans etre cachees.

Pourquoi : une fondatrice doit comprendre vite, mais un PM ou CS doit pouvoir
creuser.

## Langage produit

Ton retenu : analytique mais humain.

PulseOps doit eviter le jargon inutile. Les textes doivent etre directs :

- "Ce compte ralentit."
- "Activation bloquee a l'etape first_event_sent."
- "Aucun evenement cle depuis 10 jours."
- "Les comptes qui invitent un coequipier restent plus actifs."

## Vocabulaire identitaire

Termes possibles :

- Health score ;
- Silent accounts ;
- Activation path ;
- Signal notes ;
- Account pulse.

Ces termes doivent rester comprehensibles. L'identite ne doit pas rendre l'outil
obscur.

## Position anti vanity metrics

Les vanity metrics sont des chiffres flatteurs mais peu utiles.

Exemple : "100 000 evenements ce mois-ci" ne suffit pas si l'equipe ne sait pas
quels comptes s'activent ou abandonnent.

PulseOps doit preferer les metriques actionnables :

- activation ;
- abandon ;
- silence ;
- changement d'activite ;
- sante du compte ;
- evenement cle manquant.

## Principes UI

- Les graphiques doivent venir de vraies donnees.
- Les couleurs doivent aider la comprehension.
- Les scores doivent etre expliques.
- Les tableaux doivent etre scannables.
- Les etats vides doivent aider a integrer l'API.
- Les erreurs doivent etre claires.
- Le produit ne doit jamais paraitre medical ou financier.
- L'app doit etre lisible avant d'etre spectaculaire.

## Differenciation visuelle

PulseOps doit eviter :

- cartes generiques identiques ;
- gradients violets dominants ;
- fonds creme/beige trop proches d'un SaaS classique ;
- dashboard sombre uniforme ;
- cercles et halos decoratifs comme motif principal ;
- courbes decoratives sans contexte ;
- animations gratuites ;
- vocabulaire trop startup vague ;
- apparence "template SaaS".

Il doit rechercher :

- donnees annotees ;
- micro-details typographiques ;
- contrastes nets ;
- trames fines et surfaces de donnees nettes ;
- accents acides mais controles ;
- tableaux vivants mais propres ;
- surfaces de decision ;
- moments de lecture tres clairs.

## Decision finale

PulseOps doit ressembler a un instrument de decision produit : atypique,
distinctif et sophistique, mais toujours au service de la comprehension des
donnees.
