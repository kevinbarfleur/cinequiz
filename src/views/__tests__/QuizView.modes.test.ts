import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import QuizView from '../QuizView.vue'
import { useQuizStore } from '@/stores/quiz'

// Mock components
const QuestionCardMock = {
  template: `
    <div class="question-card-mock">
      <div class="question">{{ question.question }}</div>
      <div class="answers">
        <button 
          v-for="(answer, index) in question.answers" 
          :key="index"
          @click="handleAnswerClick(index)"
          class="answer-button"
          :data-answer-index="index"
        >
          {{ answer }}
        </button>
      </div>
      <button v-if="userMode === 'host'" @click="$emit('next')" class="next-button">Suivant</button>
    </div>
  `,
  props: ['question', 'questionNumber', 'totalQuestions', 'userMode'],
  emits: ['answer', 'next', 'team-answer-assigned'],
  methods: {
    handleAnswerClick(index: number) {
      if (this.userMode === 'participant') {
        this.$emit('answer', index, index === this.question.correctAnswer)
      } else {
        // En mode host, simuler l'assignation d'équipe
        this.$emit('team-answer-assigned', {
          questionId: this.question.id,
          answerIndex: index,
          teamId: 'mock-team-id'
        })
      }
    }
  }
}

const QuestionNavigationMock = {
  template: `
    <div class="navigation-mock">
      <button @click="$emit('previous')" :disabled="!hasPrevious" class="prev-button">Précédent</button>
      <span class="progress">{{ currentQuestion + 1 }}/{{ totalQuestions }}</span>
      <button @click="$emit('next')" :disabled="!hasNext" class="next-button">Suivant</button>
    </div>
  `,
  props: ['currentQuestion', 'totalQuestions', 'hasPrevious', 'hasNext'],
  emits: ['previous', 'next', 'go-to-question']
}

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/quiz', component: QuizView },
    { path: '/results', component: { template: '<div>Results</div>' } },
    { path: '/team-results', component: { template: '<div>Team Results</div>' } }
  ]
})

// Mock question data
const mockQuestions = [
  {
    id: 'q1',
    question: 'Question test 1?',
    answers: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
    correctAnswer: 0,
    category: 'Test',
    difficulty: 'easy' as const
  },
  {
    id: 'q2',
    question: 'Question test 2?',
    answers: ['Réponse X', 'Réponse Y', 'Réponse Z'],
    correctAnswer: 1,
    category: 'Test',
    difficulty: 'medium' as const
  },
  {
    id: 'q3',
    question: 'Question test 3?',
    answers: ['Réponse 1', 'Réponse 2', 'Réponse 3'],
    correctAnswer: 2,
    category: 'Test',
    difficulty: 'hard' as const
  }
]

describe('QuizView - User Modes', () => {
  let pinia: ReturnType<typeof createPinia>
  let quizStore: ReturnType<typeof useQuizStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    quizStore = useQuizStore()
    
    // Setup mock questions
    quizStore.loadQuestions(mockQuestions)
    quizStore.state.isLoading = false
    quizStore.state.error = undefined
    quizStore.state.isCompleted = false
  })

  const createWrapper = (initialRoute = '/quiz') => {
    router.push(initialRoute)
    return mount(QuizView, {
      global: {
        plugins: [router, pinia],
        stubs: {
          QuestionCard: QuestionCardMock,
          QuestionNavigation: QuestionNavigationMock,
          BaseCard: { template: '<div class="base-card"><slot /></div>' },
          BaseButton: { 
            template: '<button class="base-button" @click="$emit(\'click\')"><slot /></button>',
            emits: ['click']
          }
        }
      }
    })
  }

  describe('Mode Animateur (Host)', () => {
    beforeEach(() => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Équipe Alpha', '#ff6b6b')
      quizStore.createTeam('Équipe Beta', '#4ecdc4')
    })

    it('should display host mode interface correctly', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.quiz-subtitle').text()).toContain('Mode Animateur')
      expect(wrapper.find('.mode-indicator.host-mode').exists()).toBe(true)
      expect(wrapper.find('.mode-text').text()).toBe('Animateur')
      expect(wrapper.find('.mode-icon').text()).toBe('👑')
    })

    it('should show team status bar in host mode', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.team-status-bar').exists()).toBe(true)
      expect(wrapper.find('.progress-label').text()).toBe('Équipes assignées:')
      expect(wrapper.findAll('.team-badge')).toHaveLength(2)
      expect(wrapper.find('.validation-status').exists()).toBe(true)
    })

    it('should display team information in header', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.quiz-subtitle').text()).toContain('2 équipe(s)')
    })

    it('should handle team answer assignment', async () => {
      const wrapper = createWrapper()
      
      const assignSpy = vi.spyOn(quizStore, 'assignAnswerToTeam')
      
      // Simuler un clic sur une réponse
      const answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      
      expect(assignSpy).toHaveBeenCalledWith('q1', 0, 'mock-team-id')
    })

    it('should show validation message when not all teams assigned', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.validation-status').exists()).toBe(true)
      expect(wrapper.find('.validation-text').text()).toBe('Assignez toutes les équipes pour continuer')
      expect(wrapper.find('.validation-icon').text()).toBe('⏳')
    })

    it('should update team badges when teams are assigned', async () => {
      const wrapper = createWrapper()
      
      // Assigner une équipe
      const team1Id = quizStore.state.teams[0].id
      quizStore.assignAnswerToTeam('q1', 0, team1Id)
      
      await wrapper.vm.$nextTick()
      
      const teamBadges = wrapper.findAll('.team-badge')
      expect(teamBadges[0].classes()).toContain('assigned')
    })

    it('should not show participant navigation in host mode', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.participant-navigation').exists()).toBe(false)
    })

    it('should handle next question in host mode', async () => {
      const wrapper = createWrapper()
      
      // Assigner toutes les équipes
      const team1Id = quizStore.state.teams[0].id
      const team2Id = quizStore.state.teams[1].id
      quizStore.assignAnswerToTeam('q1', 0, team1Id)
      quizStore.assignAnswerToTeam('q1', 1, team2Id)
      
      const proceedSpy = vi.spyOn(quizStore, 'proceedToNextQuestion')
      
      // Cliquer sur suivant
      const nextButton = wrapper.find('.next-button')
      await nextButton.trigger('click')
      
      expect(proceedSpy).toHaveBeenCalled()
    })

    it('should redirect to team results when quiz completed', async () => {
      const wrapper = createWrapper()
      const pushSpy = vi.spyOn(router, 'push')
      
      // Simuler la fin du quiz
      quizStore.state.isCompleted = true
      
      await wrapper.vm.handleNext()
      
      // Attendre la redirection
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      expect(pushSpy).toHaveBeenCalledWith('/team-results')
    })

    it('should auto-save session in host mode', async () => {
      const wrapper = createWrapper()
      const autoSaveSpy = vi.spyOn(quizStore, 'autoSaveSession')
      
      // Simuler une assignation d'équipe
      await wrapper.vm.handleTeamAnswerAssigned({
        questionId: 'q1',
        answerIndex: 0,
        teamId: 'team-id'
      })
      
      expect(autoSaveSpy).toHaveBeenCalled()
    })
  })

  describe('Mode Participant', () => {
    beforeEach(() => {
      quizStore.setUserMode('participant')
    })

    it('should display participant mode interface correctly', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.quiz-subtitle').text()).toContain('Mode Participant')
      expect(wrapper.find('.mode-indicator.participant-mode').exists()).toBe(true)
      expect(wrapper.find('.mode-text').text()).toBe('Participant')
      expect(wrapper.find('.mode-icon').text()).toBe('🎮')
    })

    it('should not show team status bar in participant mode', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.team-status-bar').exists()).toBe(false)
    })

    it('should not show team information in header', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.quiz-subtitle').text()).not.toContain('équipe(s)')
    })

    it('should show participant navigation controls', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.participant-navigation').exists()).toBe(true)
      expect(wrapper.find('.navigation-content').exists()).toBe(true)
    })

    it('should handle participant answers directly', async () => {
      const wrapper = createWrapper()
      
      const answerSpy = vi.spyOn(quizStore, 'answerQuestionAsParticipant')
      
      // Simuler un clic sur une réponse
      const answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      
      expect(answerSpy).toHaveBeenCalledWith(0)
    })

    it('should handle navigation controls', async () => {
      const wrapper = createWrapper()
      
      const nextSpy = vi.spyOn(quizStore, 'goToNextQuestion')
      const prevSpy = vi.spyOn(quizStore, 'goToPreviousQuestion')
      
      // Naviguer vers la question suivante
      await wrapper.vm.handleNextParticipant()
      expect(nextSpy).toHaveBeenCalled()
      
      // Naviguer vers la question précédente
      await wrapper.vm.handlePrevious()
      expect(prevSpy).toHaveBeenCalled()
    })

    it('should handle direct question navigation', async () => {
      const wrapper = createWrapper()
      
      const goToSpy = vi.spyOn(quizStore, 'goToQuestion')
      
      await wrapper.vm.handleGoToQuestion(2)
      
      expect(goToSpy).toHaveBeenCalledWith(2)
    })

    it('should redirect to regular results when quiz completed', async () => {
      const wrapper = createWrapper()
      const pushSpy = vi.spyOn(router, 'push')
      
      // Simuler la fin du quiz
      quizStore.state.isCompleted = true
      
      await wrapper.vm.handleNext()
      
      // Attendre la redirection
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      expect(pushSpy).toHaveBeenCalledWith('/results')
    })

    it('should not auto-save session in participant mode', async () => {
      const wrapper = createWrapper()
      const autoSaveSpy = vi.spyOn(quizStore, 'autoSaveSession')
      
      // Simuler une réponse de participant
      await wrapper.vm.handleAnswer(0, true)
      
      expect(autoSaveSpy).not.toHaveBeenCalled()
    })
  })

  describe('Transitions entre modes', () => {
    it('should update interface when switching from participant to host', async () => {
      quizStore.setUserMode('participant')
      const wrapper = createWrapper()
      
      // Vérifier l'interface participant
      expect(wrapper.find('.mode-indicator.participant-mode').exists()).toBe(true)
      expect(wrapper.find('.participant-navigation').exists()).toBe(true)
      
      // Changer de mode
      quizStore.setUserMode('host')
      await wrapper.vm.$nextTick()
      
      // Vérifier l'interface host
      expect(wrapper.find('.mode-indicator.host-mode').exists()).toBe(true)
      expect(wrapper.find('.team-status-bar').exists()).toBe(true)
    })

    it('should update interface when switching from host to participant', async () => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')
      const wrapper = createWrapper()
      
      // Vérifier l'interface host
      expect(wrapper.find('.mode-indicator.host-mode').exists()).toBe(true)
      expect(wrapper.find('.team-status-bar').exists()).toBe(true)
      
      // Changer de mode
      quizStore.setUserMode('participant')
      await wrapper.vm.$nextTick()
      
      // Vérifier l'interface participant
      expect(wrapper.find('.mode-indicator.participant-mode').exists()).toBe(true)
      expect(wrapper.find('.participant-navigation').exists()).toBe(true)
    })

    it('should preserve question state during mode transitions', async () => {
      quizStore.setUserMode('participant')
      const wrapper = createWrapper()
      
      // Avancer à la question 2
      quizStore.goToNextQuestion()
      expect(quizStore.state.currentQuestionIndex).toBe(1)
      
      // Changer de mode
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')
      await wrapper.vm.$nextTick()
      
      // Vérifier que la position est préservée
      expect(quizStore.state.currentQuestionIndex).toBe(1)
    })
  })

  describe('Restrictions d\'accès par mode', () => {
    it('should prevent team assignment actions in participant mode', async () => {
      quizStore.setUserMode('participant')
      const wrapper = createWrapper()
      
      const assignSpy = vi.spyOn(quizStore, 'assignAnswerToTeam')
      
      // Tenter d'assigner une équipe (ne devrait pas fonctionner)
      await wrapper.vm.handleTeamAnswerAssigned({
        questionId: 'q1',
        answerIndex: 0,
        teamId: 'team-id'
      })
      
      expect(assignSpy).toHaveBeenCalledWith('q1', 0, 'team-id')
      expect(quizStore.state.error).toBeDefined() // Erreur attendue
    })

    it('should prevent participant answers in host mode', async () => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Test Team')
      const wrapper = createWrapper()
      
      const answerSpy = vi.spyOn(quizStore, 'answerQuestionAsParticipant')
      
      // Tenter de répondre comme participant (ne devrait pas fonctionner)
      await wrapper.vm.handleAnswer(0, true)
      
      expect(answerSpy).not.toHaveBeenCalled()
    })

    it('should show appropriate error messages for invalid actions', async () => {
      quizStore.setUserMode('participant')
      const wrapper = createWrapper()
      
      // Tenter une action réservée au mode host
      quizStore.assignAnswerToTeam('q1', 0, 'fake-team')
      
      expect(quizStore.state.error).toBeDefined()
    })
  })

  describe('Gestion des erreurs spécifiques aux modes', () => {
    it('should handle mode validation errors gracefully', async () => {
      const wrapper = createWrapper()
      
      // Simuler une erreur de mode
      quizStore.state.error = 'Erreur de mode utilisateur'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.error-container').exists()).toBe(true)
      expect(wrapper.find('.error-message').text()).toBe('Erreur de mode utilisateur')
    })

    it('should handle team configuration errors in host mode', async () => {
      quizStore.setUserMode('host')
      const wrapper = createWrapper()
      
      // Vider les équipes pour provoquer une erreur
      quizStore.state.teams = []
      
      const isValid = quizStore.validateTeamConfiguration()
      expect(isValid).toBe(false)
      expect(quizStore.state.error).toBeDefined()
    })

    it('should recover from mode errors', async () => {
      const wrapper = createWrapper()
      
      // Simuler une erreur de mode et récupération
      quizStore.handleModeError(new Error('Test error'))
      
      expect(quizStore.state.userMode).toBe('participant') // Mode de récupération
      expect(quizStore.state.error).toBeDefined()
    })
  })

  describe('Intégration et cohérence des modes', () => {
    it('should maintain consistent state across mode operations', async () => {
      const wrapper = createWrapper()
      
      // Démarrer en mode participant
      quizStore.setUserMode('participant')
      quizStore.answerQuestionAsParticipant(0)
      const initialScore = quizStore.state.score
      
      // Passer en mode host
      quizStore.setUserMode('host')
      expect(quizStore.state.score).toBe(initialScore)
      
      // Retourner en mode participant
      quizStore.setUserMode('participant')
      expect(quizStore.state.score).toBe(initialScore)
    })

    it('should handle complex mode workflows', async () => {
      const wrapper = createWrapper()
      
      // Workflow complet: participant -> host -> participant
      quizStore.setUserMode('participant')
      quizStore.answerQuestionAsParticipant(0)
      quizStore.goToNextQuestion()
      
      quizStore.setUserMode('host')
      const teamId = quizStore.createTeam('Test Team')
      quizStore.assignAnswerToTeam('q2', 1, teamId)
      
      quizStore.setUserMode('participant')
      quizStore.answerQuestionAsParticipant(2)
      
      // Vérifier la cohérence
      expect(quizStore.state.currentQuestionIndex).toBe(1)
      expect(quizStore.state.participantAnswers[0]).toBe(0)
      expect(quizStore.state.participantAnswers[1]).toBe(2)
    })

    it('should preserve quiz progress across all mode operations', async () => {
      const wrapper = createWrapper()
      
      // Avancer dans le quiz en mode participant
      quizStore.setUserMode('participant')
      quizStore.goToQuestion(2)
      quizStore.answerQuestionAsParticipant(2)
      
      // Passer en mode host
      quizStore.setUserMode('host')
      expect(quizStore.state.currentQuestionIndex).toBe(2)
      
      // Créer des équipes et continuer
      const teamId = quizStore.createTeam('Final Team')
      quizStore.assignAnswerToTeam('q3', 2, teamId)
      
      // Vérifier que tout est cohérent
      expect(quizStore.state.questions).toHaveLength(3)
      expect(quizStore.state.currentQuestionIndex).toBe(2)
      expect(quizStore.state.teams).toHaveLength(1)
    })
  })
})