import type { Router, RouteLocationRaw } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

export interface NavigationOptions {
  mode?: 'host' | 'participant'
  requiresTeams?: boolean
  requiresCompleted?: boolean
  fallbackRoute?: string
}

export class NavigationManager {
  private router: Router
  private quizStore: ReturnType<typeof useQuizStore>

  constructor(router: Router) {
    this.router = router
    this.quizStore = useQuizStore()
  }

  /**
   * Navigue vers une route en tenant compte du mode utilisateur et des prérequis
   */
  async navigateWithMode(
    routeName: string, 
    options: NavigationOptions = {}
  ): Promise<boolean> {
    const { 
      mode, 
      requiresTeams = false, 
      requiresCompleted = false, 
      fallbackRoute = 'home' 
    } = options

    try {
      // Vérifier et définir le mode si nécessaire
      if (mode && this.quizStore.state.userMode !== mode) {
        this.quizStore.setUserMode(mode)
      }

      // Vérifier les prérequis
      const validationResult = this.validatePrerequisites({
        requiresTeams,
        requiresCompleted
      })

      if (!validationResult.isValid) {
        // Rediriger vers la route appropriée selon le problème
        await this.router.push({ name: validationResult.redirectTo })
        return false
      }

      // Navigation vers la route demandée
      await this.router.push({ name: routeName })
      return true

    } catch (error) {
      console.error('Erreur lors de la navigation:', error)
      await this.router.push({ name: fallbackRoute })
      return false
    }
  }

  /**
   * Obtient la route appropriée selon le mode utilisateur
   */
  getRouteForMode(baseRoute: string, mode?: 'host' | 'participant'): string {
    const currentMode = mode || this.quizStore.state.userMode

    switch (baseRoute) {
      case 'quiz':
        return currentMode === 'host' ? 'host-quiz' : 'participant-quiz'
      case 'results':
        return currentMode === 'host' ? 'host-results' : 'participant-results'
      case 'team-setup':
        return 'host-team-setup' // Toujours en mode animateur
      default:
        return baseRoute
    }
  }

  /**
   * Navigue vers le quiz approprié selon le mode
   */
  async navigateToQuiz(mode?: 'host' | 'participant'): Promise<boolean> {
    const targetMode = mode || this.quizStore.state.userMode
    const routeName = this.getRouteForMode('quiz', targetMode)

    return this.navigateWithMode(routeName, {
      mode: targetMode,
      requiresTeams: targetMode === 'host',
      requiresCompleted: false
    })
  }

  /**
   * Navigue vers les résultats appropriés selon le mode
   */
  async navigateToResults(mode?: 'host' | 'participant'): Promise<boolean> {
    const targetMode = mode || this.quizStore.state.userMode
    const routeName = this.getRouteForMode('results', targetMode)

    return this.navigateWithMode(routeName, {
      mode: targetMode,
      requiresTeams: targetMode === 'host',
      requiresCompleted: true
    })
  }

  /**
   * Navigue vers la configuration des équipes (mode animateur uniquement)
   */
  async navigateToTeamSetup(): Promise<boolean> {
    return this.navigateWithMode('host-team-setup', {
      mode: 'host',
      requiresTeams: false,
      requiresCompleted: false
    })
  }

  /**
   * Navigue vers l'accueil avec nettoyage de l'état
   */
  async navigateToHome(resetState: boolean = false): Promise<boolean> {
    if (resetState) {
      this.quizStore.resetQuiz()
    }

    try {
      await this.router.push({ name: 'home' })
      return true
    } catch (error) {
      console.error('Erreur lors de la navigation vers l\'accueil:', error)
      return false
    }
  }

  /**
   * Valide les prérequis pour une navigation
   */
  private validatePrerequisites(options: {
    requiresTeams: boolean
    requiresCompleted: boolean
  }): { isValid: boolean; redirectTo: string } {
    const { requiresTeams, requiresCompleted } = options

    // Vérifier si les questions sont chargées
    if (this.quizStore.state.questions.length === 0) {
      return { isValid: false, redirectTo: 'home' }
    }

    // Vérifier si des équipes sont requises
    if (requiresTeams && this.quizStore.state.userMode === 'host') {
      if (this.quizStore.state.teams.length === 0) {
        return { isValid: false, redirectTo: 'host-team-setup' }
      }
    }

    // Vérifier si le quiz doit être terminé
    if (requiresCompleted && !this.quizStore.state.isCompleted) {
      const mode = this.quizStore.state.userMode
      const redirectTo = mode === 'host' ? 'host-quiz' : 'participant-quiz'
      return { isValid: false, redirectTo }
    }

    return { isValid: true, redirectTo: '' }
  }

  /**
   * Sauvegarde l'état avant navigation (pour les sessions interrompues)
   */
  saveStateBeforeNavigation(): boolean {
    try {
      // Sauvegarder automatiquement si on est en mode animateur avec des équipes
      if (this.quizStore.state.userMode === 'host' && this.quizStore.state.teams.length > 0) {
        this.quizStore.autoSaveSession()
      }
      return true
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état:', error)
      return false
    }
  }

  /**
   * Restaure une session interrompue si disponible
   */
  async restoreInterruptedSession(): Promise<boolean> {
    try {
      if (this.quizStore.hasInterruptedSession()) {
        const restored = this.quizStore.restoreInterruptedSession()
        
        if (restored) {
          // Rediriger vers la route appropriée selon l'état restauré
          const mode = this.quizStore.state.userMode
          const routeName = mode === 'host' ? 'host-quiz' : 'participant-quiz'
          
          await this.router.push({ name: routeName })
          return true
        }
        return false
      }
      return false
    } catch (error) {
      console.error('Erreur lors de la restauration de session:', error)
      return false
    }
  }

  /**
   * Obtient les routes disponibles selon le mode utilisateur
   */
  getAvailableRoutes(mode?: 'host' | 'participant'): Array<{
    name: string
    path: string
    title: string
    available: boolean
    reason?: string
  }> {
    const currentMode = mode || this.quizStore.state.userMode
    const hasTeams = this.quizStore.state.teams.length > 0
    const hasQuestions = this.quizStore.state.questions.length > 0
    const isCompleted = this.quizStore.state.isCompleted

    const routes = [
      {
        name: 'home',
        path: '/',
        title: 'Accueil',
        available: true
      }
    ]

    if (currentMode === 'host') {
      routes.push(
        {
          name: 'host-team-setup',
          path: '/host/team-setup',
          title: 'Configuration des Équipes',
          available: true
        },
        {
          name: 'host-quiz',
          path: '/host/quiz',
          title: 'Quiz - Mode Animateur',
          available: hasTeams && hasQuestions,
          reason: !hasTeams ? 'Équipes non configurées' : !hasQuestions ? 'Questions non chargées' : undefined
        },
        {
          name: 'host-results',
          path: '/host/results',
          title: 'Résultats par Équipe',
          available: hasTeams && hasQuestions && isCompleted,
          reason: !isCompleted ? 'Quiz non terminé' : !hasTeams ? 'Équipes non configurées' : undefined
        }
      )
    } else {
      routes.push(
        {
          name: 'participant-quiz',
          path: '/participant/quiz',
          title: 'Quiz - Mode Participant',
          available: hasQuestions,
          reason: !hasQuestions ? 'Questions non chargées' : undefined
        },
        {
          name: 'participant-results',
          path: '/participant/results',
          title: 'Vos Résultats',
          available: hasQuestions && isCompleted,
          reason: !isCompleted ? 'Quiz non terminé' : !hasQuestions ? 'Questions non chargées' : undefined
        }
      )
    }

    return routes
  }

  /**
   * Vérifie si une route est accessible
   */
  isRouteAccessible(routeName: string): boolean {
    const availableRoutes = this.getAvailableRoutes()
    const route = availableRoutes.find(r => r.name === routeName)
    return route ? route.available : false
  }

  /**
   * Obtient la prochaine route logique selon l'état actuel
   */
  getNextLogicalRoute(): string {
    const mode = this.quizStore.state.userMode
    const hasTeams = this.quizStore.state.teams.length > 0
    const hasQuestions = this.quizStore.state.questions.length > 0
    const isCompleted = this.quizStore.state.isCompleted

    // Si pas de questions, retourner à l'accueil
    if (!hasQuestions) {
      return 'home'
    }

    // Si quiz terminé, aller aux résultats
    if (isCompleted) {
      return mode === 'host' ? 'host-results' : 'participant-results'
    }

    // Si mode animateur sans équipes, aller à la configuration
    if (mode === 'host' && !hasTeams) {
      return 'host-team-setup'
    }

    // Sinon, aller au quiz
    return mode === 'host' ? 'host-quiz' : 'participant-quiz'
  }
}

// Instance singleton pour utilisation globale
let navigationManager: NavigationManager | null = null

export function useNavigationManager(router?: Router): NavigationManager {
  if (!navigationManager && router) {
    navigationManager = new NavigationManager(router)
  }
  
  if (!navigationManager) {
    throw new Error('NavigationManager doit être initialisé avec un router')
  }
  
  return navigationManager
}

// Fonctions utilitaires pour une utilisation simple
export function createNavigationManager(router: Router): NavigationManager {
  return new NavigationManager(router)
}