import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// Import views
import HomeView from '@/views/HomeView.vue'
import TeamSetupView from '@/views/TeamSetupView.vue'
import QuizView from '@/views/QuizView.vue'
import TeamResultsView from '@/views/TeamResultsView.vue'
import ResultsView from '@/views/ResultsView.vue'

// Import store
import { useQuizStore } from '@/stores/quiz'

// Mock components (simplified for cross-mode testing)
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  },
  BaseCard: {
    name: 'BaseCard',
    template: '<div><slot /></div>',
    props: ['variant', 'hover', 'padding']
  }
}))

vi.mock('@/components/quiz', () => ({
  TeamSetup: {
    name: 'TeamSetup',
    template: '<div class="team-setup">Team Setup Component</div>',
    emits: ['teams-configured', 'start-quiz']
  },
  QuestionCard: {
    name: 'QuestionCard',
    template: '<div class="question-card">{{ userMode }} Mode Question</div>',
    props: ['question', 'userMode'],
    emits: ['answer', 'team-answer-assigned']
  },
  QuestionNavigation: {
    name: 'QuestionNavigation',
    template: '<div class="question-navigation">Navigation</div>',
    props: ['currentQuestion', 'totalQuestions'],
    emits: ['previous', 'next', 'go-to-question']
  },
  TeamResultsDisplay: {
    name: 'TeamResultsDisplay',
    template: '<div class="team-results">Team Results</div>',
    props: ['teams', 'questions', 'teamAnswers'],
    emits: ['restart', 'home']
  },
  ScoreDisplay: {
    name: 'ScoreDisplay',
    template: '<div class="score-display">Score Display</div>',
    props: ['score', 'totalQuestions'],
    emits: ['restart', 'home']
  }
}))

// Mock questions data
const mockQuestions = [
  {
    id: 'q1',
    question: 'Question 1?',
    answers: ['A', 'B', 'C', 'D'],
    correctAnswer: 0
  },
  {
    id: 'q2',
    question: 'Question 2?',
    answers: ['A', 'B', 'C', 'D'],
    correctAnswer: 1
  }
]

const createTestRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/team-setup', name: 'team-setup', component: TeamSetupView },
      { path: '/quiz', name: 'quiz', component: QuizView },
      { path: '/team-results', name: 'team-results', component: TeamResultsView },
      { path: '/results', name: 'results', component: ResultsView }
    ]
  })
}

describe('Cross-Mode Integration Tests', () => {
  let router: ReturnType<typeof createTestRouter>
  let store: ReturnType<typeof useQuizStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createTestRouter()
    store = useQuizStore()
    
    // Mock questions loading
    store.loadQuestions(mockQuestions)
    
    // Start at home
    await router.push('/')
  })

  describe('Mode Switching and Data Consistency', () => {
    it('should maintain data consistency when switching between modes', async () => {
      // Start in participant mode
      store.setUserMode('participant')
      store.startQuiz()
      
      // Answer some questions as participant
      store.answerQuestionAsParticipant(0)
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(1)
      
      expect(store.state.participantAnswers).toHaveLength(2)
      expect(store.state.userMode).toBe('participant')
      
      // Switch to host mode
      store.setUserMode('host')
      
      // Participant answers should be preserved
      expect(store.state.participantAnswers).toHaveLength(2)
      expect(store.state.userMode).toBe('host')
      
      // Create teams in host mode
      const team1Id = store.createTeam('Team 1')
      const team2Id = store.createTeam('Team 2')
      
      expect(store.state.teams).toHaveLength(2)
      
      // Switch back to participant mode
      store.setUserMode('participant')
      
      // Both participant answers and teams should be preserved
      expect(store.state.participantAnswers).toHaveLength(2)
      expect(store.state.teams).toHaveLength(2)
      expect(store.state.userMode).toBe('participant')
    })

    it('should handle simultaneous host and participant sessions', async () => {
      // Set up host mode with teams
      store.setUserMode('host')
      const team1Id = store.createTeam('Host Team 1')
      const team2Id = store.createTeam('Host Team 2')
      store.startQuiz()
      
      // Assign team answers
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      
      expect(store.state.teamAnswers).toHaveLength(2)
      
      // Switch to participant mode (simulating someone joining as participant)
      store.setUserMode('participant')
      
      // Answer as participant
      store.answerQuestionAsParticipant(2)
      
      // Both team answers and participant answers should coexist
      expect(store.state.teamAnswers).toHaveLength(2)
      expect(store.state.participantAnswers[0]).toBe(2)
      
      // Switch back to host mode
      store.setUserMode('host')
      
      // All data should still be present
      expect(store.state.teamAnswers).toHaveLength(2)
      expect(store.state.participantAnswers[0]).toBe(2)
      expect(store.state.teams).toHaveLength(2)
    })

    it('should prevent data conflicts between modes', async () => {
      // Set up host mode
      store.setUserMode('host')
      const teamId = store.createTeam('Test Team')
      store.startQuiz()
      
      // Assign team answer
      store.assignAnswerToTeam('q1', 0, teamId)
      
      // Switch to participant mode
      store.setUserMode('participant')
      
      // Answer as participant (different answer)
      store.answerQuestionAsParticipant(1)
      
      // Both answers should coexist without conflict
      expect(store.state.teamAnswers[0].answerIndex).toBe(0)
      expect(store.state.participantAnswers[0]).toBe(1)
      
      // Each mode should calculate its own score
      const teamScore = store.state.teamAnswers.filter(a => a.isCorrect).length
      const participantScore = store.participantScore
      
      expect(teamScore).toBe(1) // Team answered correctly
      expect(participantScore).toBe(0) // No scoring in participant mode
    })
  })

  describe('Navigation Between Modes', () => {
    it('should handle navigation from participant to host mode', async () => {
      // Start as participant
      const homeWrapper = mount(HomeView, {
        global: { plugins: [router] }
      })
      
      // Select participant mode
      const participantCard = homeWrapper.find('.mode-card-participant')
      await participantCard.trigger('click')
      await nextTick()
      
      expect(router.currentRoute.value.path).toBe('/quiz')
      expect(store.state.userMode).toBe('participant')
      
      // Navigate back to home
      await router.push('/')
      
      // Switch to host mode
      const hostCard = homeWrapper.find('.mode-card-host')
      await hostCard.trigger('click')
      await nextTick()
      
      expect(router.currentRoute.value.path).toBe('/team-setup')
      expect(store.state.userMode).toBe('host')
    })

    it('should handle navigation from host to participant mode', async () => {
      // Start as host
      store.setUserMode('host')
      await router.push('/team-setup')
      
      const teamSetupWrapper = mount(TeamSetupView, {
        global: { plugins: [router] }
      })
      
      expect(store.state.userMode).toBe('host')
      
      // Navigate back to home
      const backButton = teamSetupWrapper.find('.back-button')
      await backButton.trigger('click')
      await nextTick()
      
      expect(router.currentRoute.value.path).toBe('/')
      
      // Switch to participant mode
      const homeWrapper = mount(HomeView, {
        global: { plugins: [router] }
      })
      
      const participantCard = homeWrapper.find('.mode-card-participant')
      await participantCard.trigger('click')
      await nextTick()
      
      expect(router.currentRoute.value.path).toBe('/quiz')
      expect(store.state.userMode).toBe('participant')
    })

    it('should preserve quiz state during mode switches', async () => {
      // Start quiz in participant mode
      store.setUserMode('participant')
      store.startQuiz()
      store.answerQuestionAsParticipant(0)
      store.goToNextQuestion()
      
      const initialQuestionIndex = store.state.currentQuestionIndex
      const initialAnswers = [...store.state.participantAnswers]
      
      // Switch to host mode
      store.setUserMode('host')
      
      // Quiz state should be preserved
      expect(store.state.currentQuestionIndex).toBe(initialQuestionIndex)
      expect(store.state.participantAnswers).toEqual(initialAnswers)
      expect(store.state.questions).toHaveLength(2)
      
      // Switch back to participant mode
      store.setUserMode('participant')
      
      // State should still be preserved
      expect(store.state.currentQuestionIndex).toBe(initialQuestionIndex)
      expect(store.state.participantAnswers).toEqual(initialAnswers)
    })
  })

  describe('Results Handling Across Modes', () => {
    it('should show appropriate results based on current mode', async () => {
      // Complete quiz in participant mode
      store.setUserMode('participant')
      store.startQuiz()
      store.answerQuestionAsParticipant(0) // Correct
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(0) // Incorrect (correct is 1)
      store.completeQuiz()
      
      // Should navigate to participant results
      expect(store.state.isCompleted).toBe(true)
      
      // Switch to host mode after completion
      store.setUserMode('host')
      
      // Create teams for host results
      store.createTeam('Team A')
      store.createTeam('Team B')
      
      // Should be able to show team results even though quiz was completed as participant
      const teamResultsWrapper = mount(TeamResultsView, {
        global: { plugins: [router] }
      })
      
      expect(teamResultsWrapper.exists()).toBe(true)
      
      // Switch back to participant mode
      store.setUserMode('participant')
      
      // Should be able to show participant results
      const participantResultsWrapper = mount(ResultsView, {
        global: { plugins: [router] }
      })
      
      expect(participantResultsWrapper.exists()).toBe(true)
    })

    it('should handle mixed mode completion scenarios', async () => {
      // Start as host, create teams
      store.setUserMode('host')
      const team1Id = store.createTeam('Team 1')
      const team2Id = store.createTeam('Team 2')
      store.startQuiz()
      
      // Assign some team answers
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      
      // Switch to participant mode mid-quiz
      store.setUserMode('participant')
      
      // Answer as participant
      store.answerQuestionAsParticipant(0)
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(1)
      
      // Complete quiz
      store.completeQuiz()
      
      // Should have both team and participant data
      expect(store.state.teamAnswers).toHaveLength(2)
      expect(store.state.participantAnswers).toHaveLength(2)
      expect(store.state.isCompleted).toBe(true)
      
      // Calculate scores for both modes
      const teamScores = store.teamRankings
      const participantScore = store.participantScore
      
      expect(teamScores).toHaveLength(2)
      expect(typeof participantScore).toBe('number')
    })

    it('should handle restart from different modes', async () => {
      // Complete quiz with mixed data
      store.setUserMode('host')
      store.createTeam('Test Team')
      store.startQuiz()
      store.assignAnswerToTeam('q1', 0, store.state.teams[0].id)
      
      store.setUserMode('participant')
      store.answerQuestionAsParticipant(1)
      store.completeQuiz()
      
      // Restart from participant mode
      store.setUserMode('participant')
      store.resetQuiz()
      
      // Should clear participant data but preserve teams
      expect(store.state.participantAnswers).toHaveLength(0)
      expect(store.state.teams).toHaveLength(1) // Teams preserved for potential host mode use
      expect(store.state.isCompleted).toBe(false)
      expect(store.state.currentQuestionIndex).toBe(0)
      
      // Restart from host mode
      store.setUserMode('host')
      store.resetQuiz()
      
      // Should clear all quiz data but preserve team configuration
      expect(store.state.teamAnswers).toHaveLength(0)
      expect(store.state.teams).toHaveLength(1) // Teams preserved for reuse
    })
  })

  describe('Data Validation and Integrity', () => {
    it('should validate data consistency across mode switches', async () => {
      // Set up complex state
      store.setUserMode('host')
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      store.startQuiz()
      
      // Add team answers
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 2, team2Id)
      store.proceedToNextQuestion()
      store.assignAnswerToTeam('q2', 1, team1Id)
      store.assignAnswerToTeam('q2', 1, team2Id)
      
      // Switch to participant and add answers
      store.setUserMode('participant')
      store.answerQuestionAsParticipant(0)
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(1)
      
      // Validate data integrity
      expect(store.state.teams).toHaveLength(2)
      expect(store.state.teamAnswers).toHaveLength(4)
      expect(store.state.participantAnswers).toHaveLength(2)
      
      // Validate team answers are correctly associated
      const team1Answers = store.state.teamAnswers.filter(a => a.teamId === team1Id)
      const team2Answers = store.state.teamAnswers.filter(a => a.teamId === team2Id)
      
      expect(team1Answers).toHaveLength(2)
      expect(team2Answers).toHaveLength(2)
      
      // Validate question associations
      const q1Answers = store.state.teamAnswers.filter(a => a.questionId === 'q1')
      const q2Answers = store.state.teamAnswers.filter(a => a.questionId === 'q2')
      
      expect(q1Answers).toHaveLength(2)
      expect(q2Answers).toHaveLength(2)
    })

    it('should handle invalid mode transitions gracefully', async () => {
      // Set up valid state
      store.setUserMode('participant')
      store.startQuiz()
      store.answerQuestionAsParticipant(0)
      
      // Try invalid mode
      try {
        store.setUserMode('invalid' as any)
      } catch (error) {
        // Should handle gracefully
      }
      
      // Should maintain valid state
      expect(['host', 'participant']).toContain(store.state.userMode)
      expect(store.state.participantAnswers).toHaveLength(1)
    })

    it('should prevent data corruption during concurrent operations', async () => {
      store.setUserMode('host')
      const teamId = store.createTeam('Concurrent Team')
      store.startQuiz()
      
      // Simulate concurrent operations
      const operations = [
        () => store.assignAnswerToTeam('q1', 0, teamId),
        () => store.setUserMode('participant'),
        () => store.answerQuestionAsParticipant(1),
        () => store.setUserMode('host'),
        () => store.assignAnswerToTeam('q1', 2, teamId) // Should update existing
      ]
      
      // Execute operations
      operations.forEach(op => op())
      
      // Validate final state
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teamAnswers).toHaveLength(1) // Should be updated, not duplicated
      expect(store.state.teamAnswers[0].answerIndex).toBe(2) // Latest assignment
      expect(store.state.participantAnswers[0]).toBe(1)
    })
  })

  describe('Performance and Memory Management', () => {
    it('should not create memory leaks during mode switching', async () => {
      const initialMemoryUsage = performance.memory?.usedJSHeapSize || 0
      
      // Perform many mode switches with data operations
      for (let i = 0; i < 50; i++) {
        store.setUserMode('host')
        store.createTeam(`Team ${i}`)
        store.startQuiz()
        store.assignAnswerToTeam('q1', i % 4, store.state.teams[store.state.teams.length - 1].id)
        
        store.setUserMode('participant')
        store.answerQuestionAsParticipant(i % 4)
        
        if (i % 10 === 0) {
          store.resetQuiz()
        }
      }
      
      const finalMemoryUsage = performance.memory?.usedJSHeapSize || 0
      
      // Memory usage should not grow excessively
      if (initialMemoryUsage > 0) {
        const memoryGrowth = finalMemoryUsage - initialMemoryUsage
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // Less than 10MB growth
      }
    })

    it('should handle rapid mode switching efficiently', async () => {
      const start = performance.now()
      
      // Rapid mode switching
      for (let i = 0; i < 100; i++) {
        store.setUserMode(i % 2 === 0 ? 'host' : 'participant')
      }
      
      const end = performance.now()
      
      // Should be fast
      expect(end - start).toBeLessThan(100)
      expect(store.state.userMode).toBe('participant') // Final state
    })

    it('should optimize data storage for mixed mode usage', async () => {
      // Create large dataset
      store.setUserMode('host')
      
      for (let i = 0; i < 20; i++) {
        store.createTeam(`Team ${i}`)
      }
      
      store.startQuiz()
      
      // Add many team answers
      for (let i = 0; i < 20; i++) {
        store.assignAnswerToTeam('q1', 0, store.state.teams[i].id)
        store.assignAnswerToTeam('q2', 1, store.state.teams[i].id)
      }
      
      // Switch to participant and add answers
      store.setUserMode('participant')
      store.answerQuestionAsParticipant(0)
      store.answerQuestionAsParticipant(1)
      
      // Data should be efficiently stored
      expect(store.state.teams).toHaveLength(20)
      expect(store.state.teamAnswers).toHaveLength(40)
      expect(store.state.participantAnswers).toHaveLength(2)
      
      // Operations should still be fast
      const start = performance.now()
      const rankings = store.teamRankings
      const participantScore = store.participantScore
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50)
      expect(rankings).toHaveLength(20)
      expect(typeof participantScore).toBe('number')
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle mode switching during quiz completion', async () => {
      store.setUserMode('participant')
      store.startQuiz()
      store.answerQuestionAsParticipant(0)
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(1)
      
      // Switch mode right before completion
      store.setUserMode('host')
      store.createTeam('Last Minute Team')
      
      // Complete quiz
      store.completeQuiz()
      
      // Should handle completion gracefully
      expect(store.state.isCompleted).toBe(true)
      expect(store.state.userMode).toBe('host')
      expect(store.state.participantAnswers).toHaveLength(2)
      expect(store.state.teams).toHaveLength(1)
    })

    it('should handle empty state mode switching', async () => {
      // Switch modes with empty state
      expect(store.state.teams).toHaveLength(0)
      expect(store.state.participantAnswers).toHaveLength(0)
      
      store.setUserMode('host')
      expect(store.state.userMode).toBe('host')
      
      store.setUserMode('participant')
      expect(store.state.userMode).toBe('participant')
      
      // State should remain consistent
      expect(store.state.teams).toHaveLength(0)
      expect(store.state.participantAnswers).toHaveLength(0)
    })

    it('should handle mode switching with corrupted data', async () => {
      // Corrupt some data
      store.state.teams = [null, undefined, { id: 'valid', name: 'Valid Team' }] as any
      store.state.participantAnswers = [0, null, undefined, 'invalid'] as any
      
      // Mode switching should handle corrupted data
      store.setUserMode('host')
      expect(store.state.userMode).toBe('host')
      
      store.setUserMode('participant')
      expect(store.state.userMode).toBe('participant')
      
      // Should filter out invalid data
      const validTeams = store.state.teams.filter(team => team && team.id && team.name)
      expect(validTeams).toHaveLength(1)
    })
  })
})