# Plan d'Implémentation

- [x] 1. Configuration initiale du projet Vue3
  - Créer un nouveau projet Vue3 avec Vite et TypeScript
  - Configurer Pinia pour la gestion d'état
  - Installer et configurer Vue Router pour la navigation
  - Configurer Vitest pour les tests unitaires
  - _Exigences: 1.1, 5.1_

- [x] 2. Mise à jour de la structure de données pour le système d'équipes




  - [x] 2.1 Étendre les interfaces TypeScript pour les équipes


    - Ajouter l'interface Team avec id, nom, score et couleur
    - Créer l'interface TeamAnswer pour lier équipes et réponses
    - Mettre à jour QuizState pour inclure les équipes et modes utilisateur
    - Ajouter l'interface QuestionResults pour les résultats détaillés
    - _Exigences: 1.2, 3.1, 4.1_

  - [x] 2.2 Mettre à jour le store Pinia pour la gestion des équipes


    - Ajouter la gestion des équipes dans l'état réactif
    - Implémenter les actions de création, édition et suppression d'équipes
    - Créer les getters pour les scores par équipe et le classement
    - Ajouter la logique de validation pour le passage à la question suivante
    - _Exigences: 1.3, 1.4, 1.5, 3.2, 3.3_

  - [x] 2.3 Implémenter la persistance des équipes et sessions


    - Sauvegarder les équipes configurées dans localStorage
    - Persister les réponses par équipe pendant la session
    - Gérer la restauration des sessions interrompues
    - Tester la persistance des données d'équipes
    - _Exigences: 1.6, 8.3_

- [x] 3. Développement du système de gestion des équipes




  - [x] 3.1 Créer le composant TeamSetup


    - Implémenter l'interface de création d'équipes
    - Ajouter les fonctionnalités d'édition et suppression d'équipes
    - Créer la validation des noms d'équipes (unicité, longueur)
    - Intégrer les animations pour l'ajout/suppression d'équipes
    - _Exigences: 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Développer le composant TeamAssignmentModal


    - Créer le modal d'attribution des réponses aux équipes
    - Implémenter la sélection d'équipe avec interface tactile
    - Ajouter la validation pour éviter les attributions multiples
    - Intégrer les animations d'ouverture/fermeture du modal
    - _Exigences: 3.2, 3.3_

  - [x] 3.3 Créer le composant TeamResultsDisplay


    - Implémenter l'affichage des résultats par équipe et par question
    - Créer le tableau de scores avec classement automatique
    - Ajouter les graphiques de performance par équipe
    - Intégrer les animations de révélation des résultats
    - _Exigences: 4.2, 4.3, 4.4, 4.5_

- [x] 4. Adaptation des composants existants pour les deux modes




  - [x] 4.1 Mettre à jour le composant QuestionCard pour les modes


    - Adapter l'affichage selon le mode utilisateur (animateur/participant)
    - Implémenter la navigation libre pour le mode participant
    - Ajouter les contrôles d'attribution d'équipe pour le mode animateur
    - Gérer l'affichage conditionnel de la bonne réponse
    - _Exigences: 2.1, 2.2, 2.3, 3.1, 3.4_

  - [x] 4.2 Adapter le composant AnswerButton pour les modes


    - Modifier le comportement selon le mode (sélection simple vs attribution)
    - Implémenter l'ouverture du modal d'attribution en mode animateur
    - Supprimer l'indication de bonne/mauvaise réponse en mode participant
    - Ajouter les états visuels pour les équipes assignées
    - _Exigences: 2.2, 3.2, 3.3_

  - [x] 4.3 Créer le composant de navigation entre questions


    - Implémenter les boutons précédent/suivant pour le mode participant
    - Ajouter la logique de validation pour le mode animateur
    - Créer les indicateurs visuels de progression par mode
    - Tester la navigation fluide entre toutes les questions
    - _Exigences: 2.3, 2.4, 3.5, 7.1, 7.2_

- [x] 5. Mise à jour des vues principales pour les nouveaux modes





  - [x] 5.1 Refactoriser la page d'accueil (HomeView)


    - Ajouter la sélection du mode utilisateur (animateur/participant)
    - Créer les boutons d'accès distincts pour chaque mode
    - Intégrer les explications des différents modes
    - Adapter le design pour les nouvelles fonctionnalités
    - _Exigences: 1.1, 2.1, 6.1_

  - [x] 5.2 Créer la vue de configuration des équipes (TeamSetupView)


    - Intégrer le composant TeamSetup dans une vue dédiée
    - Ajouter les contrôles de navigation (retour, démarrer quiz)
    - Implémenter la validation avant démarrage du quiz
    - Créer les transitions fluides vers la vue quiz
    - _Exigences: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 5.3 Adapter la vue quiz (QuizView) pour les modes


    - Intégrer la logique de mode dans la vue principale
    - Adapter l'interface selon le mode utilisateur
    - Implémenter la gestion des équipes pendant le quiz
    - Ajouter les contrôles spécifiques à chaque mode
    - _Exigences: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.4 Créer la vue des résultats par équipe (TeamResultsView)


    - Intégrer le composant TeamResultsDisplay
    - Ajouter les options de navigation post-quiz
    - Implémenter l'export des résultats (optionnel)
    - Créer les animations de présentation des résultats
    - _Exigences: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Mise à jour du routeur et de la navigation





  - [x] 6.1 Adapter Vue Router pour les nouveaux modes


    - Ajouter les routes pour la configuration d'équipes
    - Créer les routes conditionnelles selon le mode
    - Implémenter les guards de navigation pour valider les modes
    - Ajouter la gestion des paramètres de mode dans les routes
    - _Exigences: 1.1, 8.1, 8.2_

  - [x] 6.2 Implémenter la logique de navigation conditionnelle


    - Créer les redirections automatiques selon le mode
    - Ajouter la validation des prérequis (équipes configurées)
    - Implémenter la sauvegarde de l'état lors des changements de route
    - Tester tous les parcours de navigation possibles
    - _Exigences: 8.3, 8.4_

- [x] 7. Gestion des erreurs et validation pour le système d'équipes




  - [x] 7.1 Implémenter la validation des équipes


    - Créer la validation des noms d'équipes (unicité, format)
    - Ajouter la validation du nombre minimum d'équipes
    - Implémenter la validation des attributions de réponses
    - Créer les messages d'erreur spécifiques aux équipes
    - _Exigences: 1.4, 1.5, 3.3_

  - [x] 7.2 Ajouter la gestion des erreurs de mode


    - Créer la validation du mode utilisateur
    - Implémenter les fallbacks en cas d'erreur de mode
    - Ajouter la gestion des sessions corrompues
    - Tester tous les scénarios d'erreur liés aux modes
    - _Exigences: 8.1, 8.2_

- [x] 8. Tests unitaires et d'intégration pour les nouvelles fonctionnalités








  - [x] 8.1 Créer les tests pour la gestion des équipes



    - Tester la création, édition et suppression d'équipes
    - Valider les calculs de scores par équipe
    - Tester l'attribution des réponses aux équipes
    - Vérifier la persistance des données d'équipes
    - _Exigences: 1.2, 1.3, 1.4, 1.5, 3.2, 4.3_

  - [x] 8.2 Tester les différents modes utilisateur



    - Créer des tests pour le mode animateur complet
    - Tester le mode participant avec navigation libre
    - Valider les transitions entre modes
    - Vérifier les restrictions d'accès par mode
    - _Exigences: 2.1, 2.2, 2.3, 3.1, 3.4, 3.5_

  - [x] 8.3 Tests d'intégration pour les flux complets






    - Tester le flux complet animateur (équipes → quiz → résultats)
    - Valider le flux participant (accès → quiz → navigation)
    - Tester les interactions entre modes dans une même session
    - Vérifier la cohérence des données entre tous les composants
    - _Exigences: Toutes les exigences_

- [x] 9. Optimisation et finalisation






  - [x] 9.1 Optimiser les performances pour les équipes multiples








    - Optimiser les calculs de scores en temps réel
    - Améliorer les performances des animations avec plusieurs équipes
    - Implémenter la virtualisation pour de nombreuses équipes
    - Tester les performances avec différents nombres d'équipes
    - _Exigences: 6.2, 6.3_

  - [x] 9.2 Finaliser l'expérience utilisateur mobile













    - Optimiser l'interface tactile pour la gestion d'équipes
    - Adapter les modals et composants pour les petits écrans
    - Tester l'expérience complète sur différents appareils mobiles
    - Valider l'accessibilité de toutes les nouvelles fonctionnalités
    - _Exigences: 6.1, 6.3, 6.4_

- [x] 10. Implémentation du Design System UnoCSS











  - [x] 10.1 Configuration du système de couleurs et thématisation




    - Remplacer la configuration UnoCSS actuelle par les variables CSS (--vp-c-*) pour les modes clair et sombre
    - Créer le fichier CSS avec les variables de couleurs pour les thèmes clair/sombre
    - Étendre la configuration UnoCSS avec les couleurs de marque et sémantiques basées sur les variables
    - Implémenter le système de basculement automatique entre thèmes clair/sombre
    - Tester la cohérence des couleurs sur tous les composants
    - _Exigences: 6.1, 6.2, 6.3_

  - [x] 10.2 Intégration de l'animation Rainbow des couleurs de marque




    - Créer les keyframes CSS pour l'animation rainbow (80+ étapes de couleurs)
    - Intégrer l'animation dans la configuration UnoCSS via les règles personnalisées
    - Appliquer l'animation aux éléments de marque (titres, fonds, dégradés)
    - Implémenter la désactivation pour prefers-reduced-motion
    - _Exigences: 6.4, 6.5_

  - [x] 10.3 Configuration typographique avec Inter et polices monospace




    - Mettre à jour la configuration UnoCSS pour utiliser Inter et ui-monospace
    - Définir l'échelle typographique responsive avec line-heights optimisés
    - Créer les classes de liens avec underline-offset et transitions
    - Styliser les éléments de code inline et blocs avec syntaxe highlighting
    - _Exigences: 6.1, 6.4_

  - [x] 10.4 Configuration des icônes et presets UnoCSS




    - Configurer le preset icons avec les collections Carbon, Phosphor et Logos
    - Installer les packages d'icônes nécessaires (@iconify-json/carbon, @iconify-json/ph, @iconify-json/logos)
    - Créer les shortcuts pour les boutons (btn-brand, btn-alt, btn-sponsor)
    - Implémenter les blocs personnalisés (custom-block-info, tip, warning, danger)
    - Développer les cartes de fonctionnalités avec transitions hover
    - Configurer les tailles de boutons responsive (btn-sm, btn-md, btn-lg)
    - _Exigences: 6.1, 6.2, 6.4_

- [-] 11. Refactorisation des composants existants avec UnoCSS










  - [x] 11.1 Migration du composant BaseButton vers UnoCSS






    - Remplacer les styles CSS par les classes utilitaires UnoCSS
    - Utiliser les shortcuts btn-* pour les variantes de boutons
    - Intégrer les couleurs de marque animées (brand-1, brand-2)
    - Optimiser les transitions et micro-interactions avec les classes UnoCSS
    - _Exigences: 6.1, 6.4_

  - [x] 11.2 Migration des composants de quiz vers UnoCSS






    - Refactoriser QuestionCard avec les classes de layout UnoCSS (flex, grid, gap)
    - Migrer AnswerButton vers les couleurs sémantiques UnoCSS
    - Adapter TeamAssignmentModal avec les classes de positionnement UnoCSS
    - Optimiser TeamResultsDisplay avec les classes responsive UnoCSS
    - _Exigences: 6.1, 6.2, 6.3_

  - [x] 11.3 Migration des vues principales vers UnoCSS









    - Refactoriser HomeView avec le layout mobile-first UnoCSS
    - Migrer TeamSetupView vers les classes de grille et espacement UnoCSS
    - Adapter QuizView avec les breakpoints et containers UnoCSS
    - Optimiser TeamResultsView avec les classes de typographie UnoCSS
    - _Exigences: 6.1, 6.2, 6.3_

  - [x] 11.4 Intégration de l'iconographie UnoCSS










    - Configurer le preset icons avec les collections Carbon, Phosphor et Logos
    - Remplacer les icônes existantes par les classes UnoCSS (i-carbon-*, i-ph-*)
    - Intégrer les logos de frameworks avec les classes i-logos-*
    - Optimiser les icônes pour les thèmes clair/sombre avec currentColor
    - _Exigences: 6.1, 6.4_

- [x] 12. Optimisation responsive et mise en page UnoCSS


  - [x] 12.1 Implémentation du layout mobile-first


    - Configurer les breakpoints personnalisés dans UnoCSS
    - Créer les containers avec max-width responsive (max-w-1152px, max-w-1440px)
    - Implémenter les grilles et flexbox avec gap et alignement UnoCSS
    - Optimiser l'espacement cohérent avec l'échelle de spacing UnoCSS
    - _Exigences: 6.2, 6.3_

  - [x] 12.2 Positionnement précis des modales et overlays


    - Utiliser position-fixed et z-index élevés pour les modales
    - Implémenter le centrage parfait avec flexbox UnoCSS
    - Créer les fonds opaques avec backdrop-blur et transparence
    - Optimiser l'accessibilité avec focus-trap et navigation clavier
    - _Exigences: 6.2, 6.3_

  - [x] 12.3 Navigation sticky et sidebar responsive


    - Implémenter la navigation sticky avec backdrop-blur sur grand écran
    - Créer la sidebar responsive avec transitions fluides
    - Optimiser les z-index selon les variables --vp-z-index-*
    - Tester le comportement sur tous les breakpoints
    - _Exigences: 6.2, 6.3_

- [x] 13. Transitions et micro-interactions UnoCSS




  - [x] 13.1 Implémentation des transitions globales


    - Configurer les classes de transition UnoCSS (duration-250, ease-in-out)
    - Appliquer les transitions sur tous les éléments interactifs
    - Créer les hover states avec changements de couleur et élévation
    - Implémenter les focus states avec ring et offset
    - _Exigences: 6.4_

  - [x] 13.2 Micro-interactions et feedback utilisateur


    - Créer les animations de scale et transform au hover
    - Implémenter les transitions de couleur sur les liens et boutons
    - Ajouter les animations de révélation pour les résultats
    - Optimiser les transitions pour les appareils tactiles
    - _Exigences: 6.4_

- [x] 14. Tests et optimisation de production




  - [ ] 14.1 Tests visuels et cross-browser

    - Tester l'animation rainbow et sa désactivation
    - _Exigences: 6.1, 6.2, 6.3, 6.4_

  - [x] 14.2 Optimisation et nettoyage du code


    - Configurer la purge CSS UnoCSS pour la production
    - Supprimer les composants et styles CSS legacy inutilisés
    - Optimiser les performances de chargement avec les web fonts
    - _Exigences: 6.1, 6.2, 6.3_