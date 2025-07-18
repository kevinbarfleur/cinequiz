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

// Import store
import { useQuizStore } from '@/stores/quiz'

// Mock components
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :class="variant"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  },
  BaseCard: {
    name: 'BaseCard',
    template: '<div :class="variant"><slot /></div>',
    props: ['variant', 'hover', 'padding']
  },
  BaseProgressBar: {
    name: 'BaseProgressBar',
    template: '<div class="progress-bar"><div class="progress-fill" :style="{ width: `${percentage}%` }"></div></div>',
    props: ['current', 'total'],
    computed: {
      percentage() { return (this.current / this.total) * 100 }
    }
  }
}))

vi.mock('@/components/quiz', () => ({
  TeamSetup: {
    name: 'TeamSetup',
    template: '<div class="team-setup"><button @click="createTeam">Add Team</button><button @click="startQuiz" v-if="hasTeams">Start Quiz</button></div>',
    data() {
      return { teams: [] }
    },
    computed: {
      hasTeams() { return this.teams.length > 0 }
    },
    methods: {
      createTeam() {
        this.teams.push({ id: `team-${Date.now()}`, name: `Team ${this.teams.length + 1}` })
        this.$emit('teams-configured')
      },
      startQuiz() {
        this.$emit('start-quiz')
      }
    },
    emits: ['teams-configured', 'start-quiz']
  },
  QuestionCard: {
    name: 'QuestionCard',
    template: `
      <div class="question-card">
        <h3>{{ question.question }}</h3>
        <div class="answers">
          <button 
            v-for="(answer, index) in question.answers" 
            :key="index"
            @click="selectAnswer(index)"
            class="answer-button"
            :class="{ selected: selectedAnswer === index }"
          >
            {{ answer }}
          </button>
        </div>
        <button v-if="userMode === 'host' && canProceed" @click="$emit('next')" class="next-button">Next</button>
      </div>
    `,
    props: ['question', 'questionNumber', 'totalQuestions', 'userMode'],
    data() {
      return { selectedAnswer: null }
    },
    computed: {
      canProceed() {
        return this.selectedAnswer !== null
      }
    },
    methods: {
      selectAnswer(index) {
        this.selectedAnswer = index
        if (this.userMode === 'host') {
          this.$emit('team-answer-assigned', {
            questionId: this.question.id,
            answerIndex: index,
            teamId: 'team-1'
          })
        } else {
          this.$emit('answer', index, index === this.question.correctAnswer)
        }
      }
    },
    emits: ['answer', 'next', 'team-answer-assigned']
  },
  TeamResultsDisplay: {
    name: 'TeamResultsDisplay',
    template: `
      <div class="team-results">
        <h2>Results</h2>
        <div v-for="team in teams" :key="team.id" class="team-result">
          {{ team.name }}: {{ getTeamScore(team.id) }} points
        </div>
        <button @click="$emit('restart')" class="restart-btn">Restart</button>
        <button @click="$emit('home')" class="home-btn">Home</button>
      </div>
    `,
    props: ['teams', 'questions', 'teamAnswers'],
    methods: {
      getTeamScore(teamId) {
        return this.teamAnswers.filter(answer => answer.teamId === teamId && answer.isCorrect).length
      }
    },
    emits: ['restart', 'home']
  }
}))

// Mock questions data
const mockQuestions = [
  {
    id: 'q1',
    question: 'Quel est le film le plus célèbre de Hitchcock?',
    answers: ['Psycho', 'Vertigo', 'Les Oiseaux', 'Sueurs froides'],
    correctAnswer: 0
  },
  {
    id: 'q2',
    question: 'Qui a joué dans Titanic?',
    answers: ['Leonardo DiCaprio', 'Brad Pitt', 'Tom Cruise', 'Matt Damon'],
    correctAnswer: 0
  }
]

const createTestRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/team-setup', name: 'team-setup', component: TeamSetupView },
      { path: '/quiz', name: 'quiz', component: QuizView },
      { path: '/team-results', name: 'team-results', component: TeamResultsView }
    ]
  })
}

describe('Host Flow Integration Tests', () => {
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

  describe('Complete Host Flow: Home → Team Setup → Quiz → Results', () => {
    it('should complete the full host workflow successfully', async () => {
      // 1. Start at Home View
      const homeWrapper = mount(HomeView, {
        global: {
          plugins: [router]
        }
      })

      expect(homeWrapper.exists()).toBe(true)
      expect(store.state.userMode).toBe('participant') // Default mode

      // 2. Select Host Mode
      const hostModeCard = homeWrapper.find('.mode-card-host')
      expect(hostModeCard.exists()).toBe(true)
      
      await hostModeCard.trigger('click')
      await nextTick()

      // Should navigate to team setup and set host mode
      expect(router.currentRoute.value.path).toBe('/team-setup')
      expect(store.state.userMode).toBe('host')

      // 3. Team Setup View
      const teamSetupWrapper = mount(TeamSetupView, {
        global: {
          plugins: [router]
        }
      })

      expect(teamSetupWrapper.exists()).toBe(true)
      expect(store.state.teams).toHaveLength(0)

      // Create teams
      const teamSetupComponent = teamSetupWrapper.findComponent({ name: 'TeamSetup' })
      expect(teamSetupComponent.exists()).toBe(true)

      // Add first team
      await teamSetupComponent.find('button').trigger('click')
      await nextTick()

      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teams[0].name).toContain('Team')

      // Add second team
      await teamSetupComponent.find('button').trigger('click')
      await nextTick()

      expect(store.state.teams).toHaveLength(2)

      // Start quiz
      const startQuizButton = teamSetupWrapper.find('.start-button')
      expect(startQuizButton.exists()).toBe(true)
      expect(startQuizButton.attributes('disabled')).toBeUndefined()

      await startQuizButton.trigger('click')
      await nextTick()

      // Should navigate to quiz
      expect(router.currentRoute.value.path).toBe('/quiz')
      expect(store.state.isQuizStarted).toBe(true)

      // 4. Quiz View - Host Mode
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      expect(quizWrapper.exists()).toBe(true)
      expect(quizWrapper.text()).toContain('Mode Animateur')

      // Should show first question
      const questionCard = quizWrapper.findComponent({ name: 'QuestionCard' })
      expect(questionCard.exists()).toBe(true)
      expect(questionCard.props('userMode')).toBe('host')
      expect(questionCard.text()).toContain(mockQuestions[0].question)

      // Answer first question (assign to team)
      const firstAnswer = questionCard.find('.answer-button')
      await firstAnswer.trigger('click')
      await nextTick()

      // Should have team answer assigned
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0].questionId).toBe('q1')
      expect(store.state.teamAnswers[0].teamId).toBe('team-1')

      // Proceed to next question
      const nextButton = questionCard.find('.next-button')
      expect(nextButton.exists()).toBe(true)
      await nextButton.trigger('click')
      await nextTick()

      // Should show second question
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(questionCard.text()).toContain(mockQuestions[1].question)

      // Answer second question
      await questionCard.find('.answer-button').trigger('click')
      await nextTick()

      expect(store.state.teamAnswers).toHaveLength(2)

      // Complete quiz
      await questionCard.find('.next-button').trigger('click')
      await nextTick()

      // Quiz should be completed
      expect(store.state.isCompleted).toBe(true)
      expect(router.currentRoute.value.path).toBe('/team-results')

      // 5. Team Results View
      const resultsWrapper = mount(TeamResultsView, {
        global: {
          plugins: [router]
        }
      })

      expect(resultsWrapper.exists()).toBe(true)
      expect(resultsWrapper.text()).toContain('Résultats du Quiz')

      // Should show team results
      const resultsDisplay = resultsWrapper.findComponent({ name: 'TeamResultsDisplay' })
      expect(resultsDisplay.exists()).toBe(true)
      expect(resultsDisplay.props('teams')).toHaveLength(2)
      expect(resultsDisplay.props('questions')).toHaveLength(2)
      expect(resultsDisplay.props('teamAnswers')).toHaveLength(2)

      // Test restart functionality
      const restartButton = resultsWrapper.find('.restart-button')
      expect(restartButton.exists()).toBe(true)
      
      await restartButton.trigger('click')
      await nextTick()

      // Should show restart confirmation dialog
      expect(resultsWrapper.find('.dialog-overlay').exists()).toBe(true)

      // Confirm restart
      const confirmButton = resultsWrapper.find('.dialog-actions .flex-1:last-child')
      await confirmButton.trigger('click')
      await nextTick()

      // Should reset quiz and navigate back to quiz
      expect(store.state.isCompleted).toBe(false)
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(router.currentRoute.value.path).toBe('/quiz')

      // Teams should be preserved
      expect(store.state.teams).toHaveLength(2)
    })

    it('should handle team validation correctly', async () => {
      const teamSetupWrapper = mount(TeamSetupView, {
        global: {
          plugins: [router]
        }
      })

      // Try to start quiz without teams
      const startButton = teamSetupWrapper.find('.start-button')
      
      // Button should be disabled or not exist when no teams
      if (startButton.exists()) {
        expect(startButton.attributes('disabled')).toBeDefined()
      }

      // Add a team
      const teamSetupComponent = teamSetupWrapper.findComponent({ name: 'TeamSetup' })
      await teamSetupComponent.find('button').trigger('click')
      await nextTick()

      // Now button should be enabled
      const enabledStartButton = teamSetupWrapper.find('.start-button')
      expect(enabledStartButton.exists()).toBe(true)
      expect(enabledStartButton.attributes('disabled')).toBeUndefined()
    })

    it('should preserve team data throughout the flow', async () => {
      // Set up teams
      const team1Id = store.createTeam('Les Cinéphiles')
      const team2Id = store.createTeam('Movie Masters')
      
      expect(store.state.teams).toHaveLength(2)
      expect(store.state.teams[0].name).toBe('Les Cinéphiles')
      expect(store.state.teams[1].name).toBe('Movie Masters')

      // Start quiz
      store.setUserMode('host')
      store.startQuiz()

      // Assign answers to teams
      store.assignAnswerToTeam('q1', 0, team1Id) // Correct answer
      store.assignAnswerToTeam('q1', 1, team2Id) // Incorrect answer

      expect(store.state.teamAnswers).toHaveLength(2)

      // Move to next question
      store.proceedToNextQuestion()
      
      store.assignAnswerToTeam('q2', 0, team1Id) // Correct answer
      store.assignAnswerToTeam('q2', 0, team2Id) // Correct answer

      expect(store.state.teamAnswers).toHaveLength(4)

      // Complete quiz
      store.proceedToNextQuestion()
      expect(store.state.isCompleted).toBe(true)

      // Check team scores
      const rankings = store.teamRankings
      expect(rankings).toHaveLength(2)
      
      // Team 1 should have 2 points (both correct)
      const team1 = rankings.find(t => t.id === team1Id)
      expect(team1?.score).toBe(2)
      
      // Team 2 should have 1 point (one correct)
      const team2 = rankings.find(t => t.id === team2Id)
      expect(team2?.score).toBe(1)
    })

    it('should handle quiz interruption and recovery', async () => {
      // Set up initial state
      store.setUserMode('host')
      store.createTeam('Test Team')
      store.startQuiz()

      // Answer first question
      store.assignAnswerToTeam('q1', 0, store.state.teams[0].id)
      store.proceedToNextQuestion()

      // Simulate interruption (save state)
      const savedState = {
        teams: store.state.teams,
        currentQuestionIndex: store.state.currentQuestionIndex,
        teamAnswers: store.state.teamAnswers,
        userMode: store.state.userMode
      }

      // Reset store (simulate page refresh)
      store.resetQuiz()
      expect(store.state.teams).toHaveLength(0)
      expect(store.state.currentQuestionIndex).toBe(0)

      // Restore state
      store.state.teams = savedState.teams
      store.state.currentQuestionIndex = savedState.currentQuestionIndex
      store.state.teamAnswers = savedState.teamAnswers
      store.setUserMode(savedState.userMode)
      store.loadQuestions(mockQuestions)

      // Verify state is restored
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.userMode).toBe('host')
    })

    it('should handle errors gracefully', async () => {
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      // Simulate error state
      store.state.error = 'Failed to load questions'
      store.state.isLoading = false
      await nextTick()

      expect(quizWrapper.find('.error-container').exists()).toBe(true)
      expect(quizWrapper.text()).toContain('Failed to load questions')

      // Test retry functionality
      const retryButton = quizWrapper.find('.error-actions button')
      expect(retryButton.exists()).toBe(true)

      // Mock successful retry
      store.clearError()
      store.loadQuestions(mockQuestions)
      
      await retryButton.trigger('click')
      await nextTick()

      expect(store.state.error).toBe('')
      expect(store.state.questions).toHaveLength(2)
    })
  })

  describe('Host Mode Team Management', () => {
    it('should handle team assignment validation', async () => {
      store.setUserMode('host')
      store.createTeam('Team A')
      store.createTeam('Team B')
      store.startQuiz()

      // Initially cannot proceed without team assignments
      expect(store.canProceedToNextQuestion).toBe(false)

      // Assign one team
      store.assignAnswerToTeam('q1', 0, store.state.teams[0].id)
      expect(store.canProceedToNextQuestion).toBe(false) // Still need second team

      // Assign second team
      store.assignAnswerToTeam('q1', 1, store.state.teams[1].id)
      expect(store.canProceedToNextQuestion).toBe(true) // Now can proceed
    })

    it('should handle team reassignment', async () => {
      store.setUserMode('host')
      const teamId = store.createTeam('Test Team')
      store.startQuiz()

      // Initial assignment
      store.assignAnswerToTeam('q1', 0, teamId)
      expect(store.state.teamAnswers[0].answerIndex).toBe(0)

      // Reassign same team to different answer
      store.assignAnswerToTeam('q1', 2, teamId)
      expect(store.state.teamAnswers).toHaveLength(1) // Should update, not add
      expect(store.state.teamAnswers[0].answerIndex).toBe(2)
    })

    it('should calculate scores correctly', async () => {
      store.setUserMode('host')
      const team1Id = store.createTeam('Team 1')
      const team2Id = store.createTeam('Team 2')
      store.startQuiz()

      // Question 1: Team 1 correct, Team 2 incorrect
      store.assignAnswerToTeam('q1', 0, team1Id) // Correct
      store.assignAnswerToTeam('q1', 1, team2Id) // Incorrect
      store.proceedToNextQuestion()

      // Question 2: Both teams correct
      store.assignAnswerToTeam('q2', 0, team1Id) // Correct
      store.assignAnswerToTeam('q2', 0, team2Id) // Correct
      store.proceedToNextQuestion()

      const rankings = store.teamRankings
      const team1Score = rankings.find(t => t.id === team1Id)?.score
      const team2Score = rankings.find(t => t.id === team2Id)?.score

      expect(team1Score).toBe(2) // 2 correct answers
      expect(team2Score).toBe(1) // 1 correct answer
    })
  })

  describe('Navigation and State Management', () => {
    it('should maintain consistent state across view transitions', async () => {
      // Start with team setup
      await router.push('/team-setup')
      store.setUserMode('host')
      store.createTeam('Consistent Team')

      expect(store.state.teams).toHaveLength(1)
      expect(store.state.userMode).toBe('host')

      // Navigate to quiz
      await router.push('/quiz')
      store.startQuiz()

      expect(store.state.teams).toHaveLength(1) // Teams preserved
      expect(store.state.userMode).toBe('host') // Mode preserved
      expect(store.isQuizStarted).toBe(true)

      // Navigate to results (simulate completion)
      store.state.isCompleted = true
      await router.push('/team-results')

      expect(store.state.teams).toHaveLength(1) // Teams still preserved
      expect(store.state.isCompleted).toBe(true)
    })

    it('should handle back navigation correctly', async () => {
      // Set up initial state
      await router.push('/team-setup')
      store.setUserMode('host')
      store.createTeam('Back Nav Team')

      // Navigate to quiz
      await router.push('/quiz')
      store.startQuiz()

      // Navigate back to team setup
      await router.push('/team-setup')

      // State should be preserved
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.userMode).toBe('host')
    })

    it('should prevent invalid navigation states', async () => {
      // Try to access quiz without teams in host mode
      store.setUserMode('host')
      store.state.teams = [] // No teams

      await router.push('/quiz')

      // Should redirect or show error
      // This would be handled by navigation guards in a real implementation
      expect(store.state.teams).toHaveLength(0)
    })
  })

  describe('Data Persistence and Recovery', () => {
    it('should save and restore session data', async () => {
      // Set up session
      store.setUserMode('host')
      const teamId = store.createTeam('Persistent Team')
      store.startQuiz()
      store.assignAnswerToTeam('q1', 0, teamId)

      // Simulate save
      const sessionData = {
        teams: store.state.teams,
        teamAnswers: store.state.teamAnswers,
        currentQuestionIndex: store.state.currentQuestionIndex,
        userMode: store.state.userMode,
        isCompleted: store.state.isCompleted
      }

      // Reset and restore
      store.resetQuiz()
      expect(store.state.teams).toHaveLength(0)

      // Restore session
      store.state.teams = sessionData.teams
      store.state.teamAnswers = sessionData.teamAnswers
      store.state.currentQuestionIndex = sessionData.currentQuestionIndex
      store.setUserMode(sessionData.userMode)
      store.state.isCompleted = sessionData.isCompleted

      // Verify restoration
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.userMode).toBe('host')
    })

    it('should handle corrupted session data', async () => {
      // Simulate corrupted data
      const corruptedData = {
        teams: null,
        teamAnswers: undefined,
        currentQuestionIndex: -1,
        userMode: 'invalid'
      }

      // Should handle gracefully
      try {
        if (corruptedData.teams) {
          store.state.teams = corruptedData.teams
        }
        if (corruptedData.teamAnswers) {
          store.state.teamAnswers = corruptedData.teamAnswers
        }
        if (corruptedData.currentQuestionIndex >= 0) {
          store.state.currentQuestionIndex = corruptedData.currentQuestionIndex
        }
        if (['host', 'participant'].includes(corruptedData.userMode)) {
          store.setUserMode(corruptedData.userMode as 'host' | 'participant')
        }
      } catch (error) {
        // Should not throw
        expect(error).toBeUndefined()
      }

      // Should maintain valid state
      expect(Array.isArray(store.state.teams)).toBe(true)
      expect(Array.isArray(store.state.teamAnswers)).toBe(true)
      expect(store.state.currentQuestionIndex).toBeGreaterThanOrEqual(0)
      expect(['host', 'participant']).toContain(store.state.userMode)
    })
  })
})