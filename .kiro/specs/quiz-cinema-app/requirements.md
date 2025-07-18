# Document des Exigences

## Introduction

Cette application est un quiz cinéma mobile-first développé en Vue3, conçu pour animer des soirées avec un système d'équipes. L'application permet de jouer à des quiz sur le thème du cinéma avec des questions stockées dans un format JSON facilement modifiable. Le système distingue deux types d'utilisateurs : l'animateur qui gère les équipes et contrôle le déroulement, et les participants qui voient les questions et sélectionnent leurs réponses. Le design suit les standards modernes et flat de 2024 pour une expérience utilisateur optimale sur mobile.

## Exigences

### Exigence 1

**User Story:** En tant qu'animateur, je veux pouvoir créer et gérer des équipes avant de lancer le quiz, afin d'organiser la compétition entre les participants.

#### Critères d'Acceptation

1. QUAND l'animateur ouvre l'application ALORS le système DOIT afficher un écran d'accueil avec une option "Mode Animateur"
2. QUAND l'animateur accède au mode animateur ALORS le système DOIT permettre de créer autant d'équipes que souhaité
3. QUAND l'animateur crée une équipe ALORS le système DOIT permettre de saisir un nom d'équipe
4. QUAND l'animateur veut modifier une équipe ALORS le système DOIT permettre d'éditer le nom de l'équipe
5. QUAND l'animateur veut supprimer une équipe ALORS le système DOIT permettre de supprimer l'équipe avec confirmation
6. QUAND l'animateur a terminé la configuration des équipes ALORS le système DOIT permettre de lancer le quiz

### Exigence 2

**User Story:** En tant que participant, je veux pouvoir naviguer librement dans les questions et sélectionner mes réponses, afin de participer au quiz à mon rythme.

#### Critères d'Acceptation

1. QUAND un participant accède au quiz ALORS le système DOIT afficher la vue participant avec les questions et réponses possibles
2. QUAND un participant sélectionne une réponse ALORS le système DOIT marquer visuellement la réponse comme sélectionnée SANS indiquer si elle est correcte
3. QUAND un participant veut changer de question ALORS le système DOIT permettre de naviguer librement vers la question précédente ou suivante
4. QUAND un participant a sélectionné une réponse ALORS le système DOIT permettre de passer à la question suivante
5. QUAND un participant navigue entre les questions ALORS le système DOIT conserver ses réponses sélectionnées

### Exigence 3

**User Story:** En tant qu'animateur, je veux contrôler le déroulement du quiz et attribuer les réponses aux équipes, afin de gérer la compétition de manière équitable.

#### Critères d'Acceptation

1. QUAND l'animateur est dans le quiz ALORS le système DOIT afficher la vue animateur avec les questions et réponses
2. QUAND l'animateur sélectionne une réponse ALORS le système DOIT demander à quelle équipe attribuer cette réponse
3. QUAND l'animateur attribue une réponse à une équipe ALORS le système DOIT enregistrer cette attribution
4. QUAND toutes les équipes ont été liées à au moins une réponse ALORS le système DOIT révéler la bonne réponse à l'animateur
5. QUAND l'animateur voit la bonne réponse ALORS le système DOIT permettre de passer à la question suivante
6. QUAND l'animateur n'a pas encore attribué toutes les équipes ALORS le système NE DOIT PAS révéler la bonne réponse

### Exigence 4

**User Story:** En tant qu'animateur, je veux voir un récapitulatif complet des résultats à la fin du quiz, afin d'annoncer les scores et désigner les gagnants.

#### Critères d'Acceptation

1. QUAND le quiz se termine ALORS le système DOIT afficher uniquement à l'animateur l'écran récapitulatif
2. QUAND l'écran récapitulatif s'affiche ALORS le système DOIT présenter les réponses de chaque équipe par question
3. QUAND l'écran récapitulatif s'affiche ALORS le système DOIT calculer et afficher les points de chaque équipe par question
4. QUAND l'écran récapitulatif s'affiche ALORS le système DOIT présenter le score total de chaque équipe
5. QUAND l'écran récapitulatif s'affiche ALORS le système DOIT classer les équipes par ordre de score décroissant

### Exigence 5

**User Story:** En tant qu'organisateur, je veux pouvoir facilement ajouter ou modifier des questions, afin de personnaliser le quiz selon mes préférences.

#### Critères d'Acceptation

1. QUAND je veux ajouter des questions ALORS le système DOIT utiliser un fichier JSON structuré et facilement éditable
2. QUAND je modifie le fichier JSON ALORS le système DOIT automatiquement prendre en compte les nouvelles questions au prochain lancement
3. QUAND je structure une question ALORS le système DOIT supporter un format avec question, choix multiples, et bonne réponse

### Exigence 6

**User Story:** En tant qu'utilisateur mobile, je veux une interface moderne inspirée du design UnoCSS avec support des thèmes clair/sombre, afin d'avoir une expérience visuelle exceptionnelle et personnalisable.

#### Critères d'Acceptation

1. QUAND l'application s'affiche ALORS le système DOIT utiliser la palette de couleurs UnoCSS avec variables CSS (`--vp-c-*`) pour une gestion flexible des thèmes
2. QUAND l'utilisateur active le mode sombre ALORS le système DOIT basculer vers des arrière-plans sombres (`#1b1b1f`, `#161618`) et texte clair (`#dfdfd6`)
3. QUAND l'utilisateur utilise le mode clair ALORS le système DOIT afficher des arrière-plans lumineux (`#ffffff`, `#f6f6f7`) et texte sombre (`#3c3c43`)
4. QUAND l'application charge ALORS le système DOIT utiliser la police Inter pour le texte général et ui-monospace pour le code
5. QUAND l'utilisateur interagit avec l'interface ALORS le système DOIT fournir des animations rainbow sur les couleurs de marque avec désactivation pour `prefers-reduced-motion`
6. QUAND l'application est utilisée sur différents appareils ALORS le système DOIT s'adapter avec une approche mobile-first utilisant les breakpoints UnoCSS

### Exigence 7

**User Story:** En tant qu'utilisateur, je veux suivre la progression dans le quiz, afin de savoir où nous en sommes dans la session.

#### Critères d'Acceptation

1. QUAND je suis dans le quiz ALORS le système DOIT afficher un indicateur de progression (ex: "Question 3/10")
2. QUAND une question est en cours ALORS le système DOIT indiquer clairement le numéro de la question courante
3. QUAND je navigue entre les questions ALORS le système DOIT mettre à jour l'indicateur de progression

### Exigence 8

**User Story:** En tant qu'animateur, je veux pouvoir contrôler le déroulement du quiz, afin d'avoir la maîtrise complète de la session.

#### Critères d'Acceptation

1. QUAND je suis animateur ALORS le système DOIT me donner accès à des contrôles que les participants n'ont pas
2. QUAND je veux arrêter le quiz ALORS le système DOIT permettre de quitter avec confirmation
3. QUAND je veux recommencer ALORS le système DOIT permettre de relancer une nouvelle session
4. QUAND je termine une session ALORS le système DOIT proposer de créer une nouvelle session ou retourner à l'accueil