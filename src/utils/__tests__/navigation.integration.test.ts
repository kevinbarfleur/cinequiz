import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { NavigationManager } from '../navigation'
import { useQuizStore } from '@/stores/quiz'

// Mock des composants Vue pour les routes
const mockComponent = { template: '<div>Mock Component</div>' }

const createTestRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: mockComponent },
      { path: '/host', name: 'host-mode', redirect: '/host/team-setup' },
      { path: '/host/team-setup', name: 'host-team-setup', component: mockComponent },
      { path: '/host/quiz', name: 'host-quiz', component: mockComponent },
      { path: '/host/results', name: 'host-results', component: mockComponent },
      { path: '/participant', name: 'participant-mode', redirect: '/participant/quiz' },
      { path: '/participant/quiz', name: 'participant-quiz', component: mockComponent },
      { path: '/participant/results', name: 'participant-results', component: mockComponent }
    ]
  })
}

describe('Navigation Integration Tests', () => {
  let router: ReturnType<typeof createTestRouter>
  let navigationManager: NavigationManager
  let quizStore: ReturnType<typeof useQuizStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createTestRouter()
    navigationManager = new NavigationManager(router)
    quizStore = useQuizStore()
    
    // Initialiser avec des questions de test
    quizStore.loadQuestions([
      { id: '1', question: 'Test 1', answers: ['A', 'B'], correctAnswer: 0 },
      { id: '2', question: 'Test 2', answers: ['C', 'D'], correctAnswer: 1 }
    ])
    
    // Naviguer vers la page d'accueil pour commencer
    await router.push('/')
  })

  describe('Participant Mode Navigation Flow', () => {
    it('should navigate through complete participant flow', async () => {
      // 1. Démarrer en mode participant
      const quizResult = await navigationManager.navigateToQuiz('participant')
      expect(quizResult).toBe(true)
      expect(router.currentRoute.value.name).toBe('participant-quiz')
      expect(quizStore.state.userMode).toBe('participant')

      // 2. Essayer d'aller aux résultats sans terminer le quiz (devrait échouer)
      const resultsResult = await navigationManager.navigateToResults('participant')
      expect(resultsResult).toBe(false)
      expect(router.currentRoute.value.name).toBe('participant-quiz') // Redirigé vers quiz

      // 3. Terminer le quiz
      quizStore.completeQuiz()
      expect(quizStore.state.isCompleted).toBe(true)

      // 4. Maintenant aller aux résultats devrait fonctionner
      const finalResultsResult = await navigationManager.navigateToResults('participant')
      expect(finalResultsResult).toBe(true)
      expect(router.currentRoute.value.name).toBe('participant-results')

      // 5. Retourner à l'accueil
      const homeResult = await navigationManager.navigateToHome()
      expect(homeResult).toBe(true)
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('should handle navigation without questions', async () => {
      // Vider les questions
      quizStore.state.questions = []

      // Essayer de naviguer vers le quiz devrait rediriger vers l'accueil
      const result = await navigationManager.navigateToQuiz('participant')
      expect(result).toBe(false)
      expect(router.currentRoute.value.name).toBe('home')
    })
  })

  describe('Host Mode Navigation Flow', () => {
    it('should navigate through complete host flow', async () => {
      // 1. Essayer d'aller au quiz en mode animateur sans équipes (devrait échouer)
      const quizWithoutTeamsResult = await navigationManager.navigateToQuiz('host')
      expect(quizWithoutTeamsResult).toBe(false)
      expect(router.currentRoute.value.name).toBe('host-team-setup')
      expect(quizStore.state.userMode).toBe('host')

      // 2. Naviguer vers la configuration des équipes
      const teamSetupResult = await navigationManager.navigateToTeamSetup()
      expect(teamSetupResult).toBe(true)
      expect(router.currentRoute.value.name).toBe('host-team-setup')

      // 3. Créer des équipes
      const team1Id = quizStore.createTeam('Équipe 1')
      const team2Id = quizStore.createTeam('Équipe 2')
      expect(team1Id).toBeTruthy()
      expect(team2Id).toBeTruthy()
      expect(quizStore.state.teams).toHaveLength(2)

      // 4. Maintenant naviguer vers le quiz devrait fonctionner
      const quizWithTeamsResult = await navigationManager.navigateToQuiz('host')
      expect(quizWithTeamsResult).toBe(true)
      expect(router.currentRoute.value.name).toBe('host-quiz')

      // 5. Essayer d'aller aux résultats sans terminer le quiz (devrait échouer)
      const resultsWithoutCompletionResult = await navigationManager.navigateToResults('host')
      expect(resultsWithoutCompletionResult).toBe(false)
      expect(router.currentRoute.value.name).toBe('host-quiz') // Redirigé vers quiz

      // 6. Terminer le quiz
      quizStore.completeQuiz()
      expect(quizStore.state.isCompleted).toBe(true)

      // 7. Maintenant aller aux résultats devrait fonctionner
      const finalResultsResult = await navigationManager.navigateToResults('host')
      expect(finalResultsResult).toBe(true)
      expect(router.currentRoute.value.name).toBe('host-results')

      // 8. Retourner à l'accueil avec reset
      const homeResult = await navigationManager.navigateToHome(true)
      expect(homeResult).toBe(true)
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('should handle team validation correctly', async () => {
      // Créer une équipe
      quizStore.createTeam('Équipe Test')
      expect(quizStore.state.teams).toHaveLength(1)

      // Naviguer vers le quiz devrait fonctionner
      const result = await navigationManager.navigateToQuiz('host')
      expect(result).toBe(true)
      expect(router.currentRoute.value.name).toBe('host-quiz')

      // Supprimer l'équipe
      const teamId = quizStore.state.teams[0].id
      quizStore.deleteTeam(teamId)
      expect(quizStore.state.teams).toHaveLength(0)

      // Essayer de naviguer vers le quiz maintenant devrait échouer
      const resultWithoutTeams = await navigationManager.navigateToQuiz('host')
      expect(resultWithoutTeams).toBe(false)
      expect(router.currentRoute.value.name).toBe('host-team-setup')
    })
  })

  describe('Mode Switching', () => {
    it('should handle switching between modes correctly', async () => {
      // Commencer en mode participant
      await navigationManager.navigateToQuiz('participant')
      expect(quizStore.state.userMode).toBe('participant')
      expect(router.currentRoute.value.name).toBe('participant-quiz')

      // Passer en mode animateur (devrait rediriger vers team-setup car pas d'équipes)
      await navigationManager.navigateToQuiz('host')
      expect(quizStore.state.userMode).toBe('host')
      expect(router.currentRoute.value.name).toBe('host-team-setup')

      // Créer une équipe
      quizStore.createTeam('Équipe Switch')

      // Maintenant naviguer vers le quiz animateur devrait fonctionner
      await navigationManager.navigateToQuiz('host')
      expect(router.currentRoute.value.name).toBe('host-quiz')

      // Revenir en mode participant
      await navigationManager.navigateToQuiz('participant')
      expect(quizStore.state.userMode).toBe('participant')
      expect(router.currentRoute.value.name).toBe('participant-quiz')
    })
  })

  describe('Route Accessibility', () => {
    it('should correctly identify accessible routes', () => {
      // Mode participant sans quiz terminé
      quizStore.setUserMode('participant')
      
      expect(navigationManager.isRouteAccessible('home')).toBe(true)
      expect(navigationManager.isRouteAccessible('participant-quiz')).toBe(true)
      expect(navigationManager.isRouteAccessible('participant-results')).toBe(false)
      expect(navigationManager.isRouteAccessible('host-quiz')).toBe(false)

      // Mode animateur avec équipes
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')

      expect(navigationManager.isRouteAccessible('home')).toBe(true)
      expect(navigationManager.isRouteAccessible('host-team-setup')).toBe(true)
      expect(navigationManager.isRouteAccessible('host-quiz')).toBe(true)
      expect(navigationManager.isRouteAccessible('host-results')).toBe(false)

      // Quiz terminé
      quizStore.completeQuiz()
      expect(navigationManager.isRouteAccessible('host-results')).toBe(true)
    })

    it('should provide correct available routes list', () => {
      // Mode participant
      const participantRoutes = navigationManager.getAvailableRoutes('participant')
      expect(participantRoutes).toHaveLength(3)
      expect(participantRoutes.find(r => r.name === 'home')?.available).toBe(true)
      expect(participantRoutes.find(r => r.name === 'participant-quiz')?.available).toBe(true)
      expect(participantRoutes.find(r => r.name === 'participant-results')?.available).toBe(false)

      // Mode animateur avec équipes
      quizStore.createTeam('Available Routes Team')
      const hostRoutes = navigationManager.getAvailableRoutes('host')
      expect(hostRoutes).toHaveLength(4)
      expect(hostRoutes.find(r => r.name === 'host-quiz')?.available).toBe(true)
      expect(hostRoutes.find(r => r.name === 'host-results')?.available).toBe(false)
    })
  })

  describe('Next Logical Route', () => {
    it('should suggest correct next route based on state', () => {
      // Pas de questions -> accueil
      quizStore.state.questions = []
      expect(navigationManager.getNextLogicalRoute()).toBe('home')

      // Avec questions, mode participant -> quiz participant
      quizStore.loadQuestions([{ id: '1', question: 'Test', answers: ['A'], correctAnswer: 0 }])
      quizStore.setUserMode('participant')
      expect(navigationManager.getNextLogicalRoute()).toBe('participant-quiz')

      // Mode animateur sans équipes -> team setup
      quizStore.setUserMode('host')
      expect(navigationManager.getNextLogicalRoute()).toBe('host-team-setup')

      // Mode animateur avec équipes -> quiz animateur
      quizStore.createTeam('Next Route Team')
      expect(navigationManager.getNextLogicalRoute()).toBe('host-quiz')

      // Quiz terminé -> résultats
      quizStore.completeQuiz()
      expect(navigationManager.getNextLogicalRoute()).toBe('host-results')
    })
  })

  describe('State Persistence', () => {
    it('should save state before navigation in host mode', () => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Persistence Team')
      
      const saveResult = navigationManager.saveStateBeforeNavigation()
      expect(saveResult).toBe(true)
    })

    it('should not save state in participant mode', () => {
      quizStore.setUserMode('participant')
      
      const saveResult = navigationManager.saveStateBeforeNavigation()
      expect(saveResult).toBe(true) // Returns true but doesn't actually save
    })
  })

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      // Mock router push to throw error
      const originalPush = router.push
      router.push = vi.fn().mockRejectedValue(new Error('Navigation error'))

      const result = await navigationManager.navigateToHome()
      expect(result).toBe(false)

      // Restore original push
      router.push = originalPush
    })

    it('should handle invalid route names', () => {
      expect(navigationManager.isRouteAccessible('invalid-route')).toBe(false)
      expect(navigationManager.getRouteForMode('invalid-route')).toBe('invalid-route')
    })
  })
})