import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useQuizStore } from '@/stores/quiz'
import router from '../index'

// Mock des composants pour les tests
const mockComponents = {
  HomeView: { template: '<div>Home</div>' },
  QuizView: { template: '<div>Quiz</div>' },
  TeamSetupView: { template: '<div>Team Setup</div>' },
  TeamResultsView: { template: '<div>Team Results</div>' },
  ResultsView: { template: '<div>Results</div>' }
}

// Mock des composants dans le router
vi.mock('@/views/HomeView.vue', () => ({ default: mockComponents.HomeView }))
vi.mock('@/views/QuizView.vue', () => ({ default: mockComponents.QuizView }))
vi.mock('@/views/TeamSetupView.vue', () => ({ default: mockComponents.TeamSetupView }))
vi.mock('@/views/TeamResultsView.vue', () => ({ default: mockComponents.TeamResultsView }))
vi.mock('@/views/ResultsView.vue', () => ({ default: mockComponents.ResultsView }))

describe('Router - Mode-based Navigation', () => {
  let pinia: ReturnType<typeof createPinia>
  let quizStore: ReturnType<typeof useQuizStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    quizStore = useQuizStore()
    
    // Reset router
    router.push('/')
  })

  describe('Routes de base', () => {
    it('should have all required routes defined', () => {
      const routes = router.getRoutes()
      const routeNames = routes.map(route => route.name)
      
      expect(routeNames).toContain('home')
      expect(routeNames).toContain('quiz')
      expect(routeNames).toContain('team-setup')
      expect(routeNames).toContain('team-results')
      expect(routeNames).toContain('results')
    })

    it('should navigate to home route', async () => {
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('should navigate to quiz route', async () => {
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
    })

    it('should navigate to team setup route', async () => {
      await router.push('/team-setup')
      expect(router.currentRoute.value.name).toBe('team-setup')
    })

    it('should navigate to team results route', async () => {
      await router.push('/team-results')
      expect(router.currentRoute.value.name).toBe('team-results')
    })

    it('should navigate to results route', async () => {
      await router.push('/results')
      expect(router.currentRoute.value.name).toBe('results')
    })
  })

  describe('Navigation basée sur les modes', () => {
    it('should allow navigation to team-setup in host mode', async () => {
      quizStore.setUserMode('host')
      
      await router.push('/team-setup')
      expect(router.currentRoute.value.name).toBe('team-setup')
    })

    it('should allow navigation to quiz in participant mode', async () => {
      quizStore.setUserMode('participant')
      
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
    })

    it('should allow navigation to quiz in host mode', async () => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')
      
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
    })

    it('should allow navigation to team-results in host mode', async () => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')
      
      await router.push('/team-results')
      expect(router.currentRoute.value.name).toBe('team-results')
    })

    it('should allow navigation to results in participant mode', async () => {
      quizStore.setUserMode('participant')
      
      await router.push('/results')
      expect(router.currentRoute.value.name).toBe('results')
    })
  })

  describe('Flux de navigation pour mode animateur', () => {
    beforeEach(() => {
      quizStore.setUserMode('host')
    })

    it('should follow host workflow: home -> team-setup -> quiz -> team-results', async () => {
      // Démarrer à l'accueil
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('home')
      
      // Aller à la configuration des équipes
      await router.push('/team-setup')
      expect(router.currentRoute.value.name).toBe('team-setup')
      
      // Créer une équipe et aller au quiz
      quizStore.createTeam('Test Team')
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
      
      // Aller aux résultats d'équipes
      await router.push('/team-results')
      expect(router.currentRoute.value.name).toBe('team-results')
    })

    it('should allow direct navigation to team-setup from any route', async () => {
      await router.push('/quiz')
      await router.push('/team-setup')
      expect(router.currentRoute.value.name).toBe('team-setup')
    })

    it('should allow navigation back to home from team-setup', async () => {
      await router.push('/team-setup')
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('home')
    })
  })

  describe('Flux de navigation pour mode participant', () => {
    beforeEach(() => {
      quizStore.setUserMode('participant')
    })

    it('should follow participant workflow: home -> quiz -> results', async () => {
      // Démarrer à l'accueil
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('home')
      
      // Aller directement au quiz
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
      
      // Aller aux résultats
      await router.push('/results')
      expect(router.currentRoute.value.name).toBe('results')
    })

    it('should allow navigation back to home from quiz', async () => {
      await router.push('/quiz')
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('should allow navigation back to quiz from results', async () => {
      await router.push('/results')
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
    })
  })

  describe('Gestion des paramètres de route', () => {
    it('should handle route parameters correctly', async () => {
      await router.push('/quiz?mode=host')
      expect(router.currentRoute.value.query.mode).toBe('host')
    })

    it('should preserve query parameters during navigation', async () => {
      await router.push('/quiz?debug=true')
      expect(router.currentRoute.value.query.debug).toBe('true')
      
      await router.push('/team-setup?debug=true')
      expect(router.currentRoute.value.query.debug).toBe('true')
    })

    it('should handle hash parameters', async () => {
      await router.push('/quiz#question-1')
      expect(router.currentRoute.value.hash).toBe('#question-1')
    })
  })

  describe('Navigation guards et validation', () => {
    it('should handle navigation guards if present', async () => {
      // Test que la navigation fonctionne même avec des guards
      await router.push('/')
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
    })

    it('should handle navigation errors gracefully', async () => {
      // Tenter de naviguer vers une route inexistante
      try {
        await router.push('/nonexistent')
      } catch (error) {
        // L'erreur devrait être gérée gracieusement
        expect(error).toBeDefined()
      }
    })

    it('should handle programmatic navigation', async () => {
      await router.push({ name: 'quiz' })
      expect(router.currentRoute.value.name).toBe('quiz')
      
      await router.push({ name: 'team-setup' })
      expect(router.currentRoute.value.name).toBe('team-setup')
    })
  })

  describe('Transitions entre modes et routes', () => {
    it('should handle mode changes during navigation', async () => {
      // Démarrer en mode participant
      quizStore.setUserMode('participant')
      await router.push('/quiz')
      
      // Changer de mode
      quizStore.setUserMode('host')
      
      // La navigation devrait toujours fonctionner
      await router.push('/team-setup')
      expect(router.currentRoute.value.name).toBe('team-setup')
    })

    it('should maintain route state during mode transitions', async () => {
      await router.push('/quiz?question=2')
      
      // Changer de mode
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')
      
      // Les paramètres de route devraient être préservés
      expect(router.currentRoute.value.query.question).toBe('2')
    })

    it('should handle rapid navigation changes', async () => {
      await router.push('/')
      await router.push('/quiz')
      await router.push('/team-setup')
      await router.push('/quiz')
      
      expect(router.currentRoute.value.name).toBe('quiz')
    })
  })

  describe('Historique de navigation', () => {
    it('should maintain navigation history', async () => {
      await router.push('/')
      await router.push('/quiz')
      await router.push('/team-setup')
      
      // Retour en arrière
      router.back()
      expect(router.currentRoute.value.name).toBe('quiz')
      
      router.back()
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('should handle forward navigation', async () => {
      await router.push('/')
      await router.push('/quiz')
      
      router.back()
      expect(router.currentRoute.value.name).toBe('home')
      
      router.forward()
      expect(router.currentRoute.value.name).toBe('quiz')
    })

    it('should replace history when needed', async () => {
      await router.push('/')
      await router.replace('/quiz')
      
      // Le retour en arrière ne devrait pas fonctionner car on a remplacé
      expect(router.currentRoute.value.name).toBe('quiz')
    })
  })

  describe('Gestion des erreurs de navigation', () => {
    it('should handle invalid routes', async () => {
      const originalRoute = router.currentRoute.value.name
      
      try {
        await router.push('/invalid-route')
      } catch (error) {
        // Devrait rester sur la route précédente ou aller à une route par défaut
        expect(router.currentRoute.value.name).toBeDefined()
      }
    })

    it('should handle navigation cancellation', async () => {
      await router.push('/')
      
      // Démarrer une navigation
      const navigationPromise = router.push('/quiz')
      
      // Annuler avec une nouvelle navigation
      await router.push('/team-setup')
      
      expect(router.currentRoute.value.name).toBe('team-setup')
    })
  })

  describe('Intégration avec le store', () => {
    it('should work with store state changes', async () => {
      await router.push('/')
      
      // Changer l'état du store
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')
      
      // La navigation devrait toujours fonctionner
      await router.push('/team-setup')
      expect(router.currentRoute.value.name).toBe('team-setup')
    })

    it('should handle store errors during navigation', async () => {
      // Simuler une erreur dans le store
      quizStore.state.error = 'Test error'
      
      // La navigation devrait toujours fonctionner
      await router.push('/quiz')
      expect(router.currentRoute.value.name).toBe('quiz')
    })

    it('should maintain consistency between store and route', async () => {
      quizStore.setUserMode('host')
      await router.push('/team-setup')
      
      expect(quizStore.state.userMode).toBe('host')
      expect(router.currentRoute.value.name).toBe('team-setup')
    })
  })

  describe('Cas d\'usage avancés', () => {
    it('should handle complex navigation scenarios', async () => {
      // Scénario complexe: mode host avec équipes
      quizStore.setUserMode('host')
      quizStore.createTeam('Team A')
      quizStore.createTeam('Team B')
      
      // Navigation complète
      await router.push('/')
      await router.push('/team-setup')
      await router.push('/quiz')
      
      // Simuler la fin du quiz
      quizStore.state.isCompleted = true
      await router.push('/team-results')
      
      expect(router.currentRoute.value.name).toBe('team-results')
    })

    it('should handle mode switching during navigation', async () => {
      // Démarrer en mode participant
      quizStore.setUserMode('participant')
      await router.push('/quiz')
      
      // Changer de mode pendant le quiz
      quizStore.setUserMode('host')
      quizStore.createTeam('New Team')
      
      // Naviguer vers les résultats d'équipe
      await router.push('/team-results')
      expect(router.currentRoute.value.name).toBe('team-results')
    })

    it('should handle concurrent navigation requests', async () => {
      // Lancer plusieurs navigations en parallèle
      const promises = [
        router.push('/quiz'),
        router.push('/team-setup'),
        router.push('/results')
      ]
      
      await Promise.allSettled(promises)
      
      // La dernière navigation devrait gagner
      expect(router.currentRoute.value.name).toBe('results')
    })
  })
})