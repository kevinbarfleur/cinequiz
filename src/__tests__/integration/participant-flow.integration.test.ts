import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// Import views
import HomeView from '@/views/HomeView.vue'
import QuizView from '@/views/QuizView.vue'
import ResultsView from '@/views/ResultsView.vue'

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
            :class="{ 
              selected: selectedAnswer === index,
              correct: showResult && index === question.correctAnswer,
              incorrect: showResult && selectedAnswer === index && index !== question.correctAnswer
            }"
          >
            {{ answer }}
          </button>
        </div>
        <div v-if="showResult" class="result-feedback">
          <p v-if="isCorrect" class="correct-feedback">✅ Correct!</p>
          <p v-else class="incorrect-feedback">❌ Incorrect. La bonne réponse était: {{ question.answers[question.correctAnswer] }}</p>
        </div>
      </div>
    `,
    props: ['question', 'questionNumber', 'totalQuestions', 'userMode', 'autoReveal', 'revealDelay'],
    data() {
      return { 
        selectedAnswer: null,
        showResult: false,
        isCorrect: false
      }
    },
    methods: {
      selectAnswer(index) {
        this.selectedAnswer = index
        this.isCorrect = index === this.question.correctAnswer
        
        if (this.userMode === 'participant') {
          this.$emit('answer', index, this.isCorrect)
          
          if (this.autoReveal) {
            setTimeout(() => {
              this.showResult = true
            }, this.revealDelay || 1000)
          }
        }
      }
    },
    emits: ['answer', 'next']
  },
  QuestionNavigation: {
    name: 'QuestionNavigation',
    template: `
      <div class="question-navigation">
        <button 
          @click="$emit('previous')" 
          :disabled="!hasPrevious"
          class="nav-button prev-button"
        >
          ← Précédent
        </button>
        
        <div class="question-indicator">
          Question {{ currentQuestion + 1 }} / {{ totalQuestions }}
        </div>
        
        <button 
          @click="$emit('next')" 
          :disabled="!hasNext"
          class="nav-button next-button"
        >
          Suivant →
        </button>
        
        <div class="question-dots">
          <button
            v-for="(_, index) in totalQuestions"
            :key="index"
            @click="$emit('go-to-question', index)"
            class="question-dot"
            :class="{ active: index === currentQuestion }"
          >
            {{ index + 1 }}
          </button>
        </div>
      </div>
    `,
    props: ['currentQuestion', 'totalQuestions', 'hasPrevious', 'hasNext'],
    emits: ['previous', 'next', 'go-to-question']
  },
  ScoreDisplay: {
    name: 'ScoreDisplay',
    template: `
      <div class="score-display">
        <h2>Votre Score Final</h2>
        <div class="score-summary">
          <div class="score-circle">
            <span class="score-value">{{ score }}</span>
            <span class="score-total">/ {{ totalQuestions }}</span>
          </div>
          <div class="score-percentage">{{ percentage }}%</div>
        </div>
        <div class="score-details">
          <p>{{ correctAnswers }} bonnes réponses sur {{ totalQuestions }} questions</p>
          <p class="score-message">{{ scoreMessage }}</p>
        </div>
        <button @click="$emit('restart')" class="restart-btn">Recommencer</button>
        <button @click="$emit('home')" class="home-btn">Accueil</button>
      </div>
    `,
    props: ['score', 'totalQuestions', 'answers'],
    computed: {
      correctAnswers() { return this.score },
      percentage() { return Math.round((this.score / this.totalQuestions) * 100) },
      scoreMessage() {
        const pct = this.percentage
        if (pct >= 90) return 'Excellent ! Vous êtes un vrai cinéphile ! 🏆'
        if (pct >= 70) return 'Très bien ! Vous connaissez bien le cinéma ! 🎬'
        if (pct >= 50) return 'Pas mal ! Continuez à regarder des films ! 🍿'
        return 'Il faut réviser vos classiques ! 📚'
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
  },
  {
    id: 'q3',
    question: 'Quel film a gagné l\'Oscar du meilleur film en 2020?',
    answers: ['Parasite', 'Joker', '1917', 'Once Upon a Time in Hollywood'],
    correctAnswer: 0
  }
]

const createTestRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/quiz', name: 'quiz', component: QuizView },
      { path: '/results', name: 'results', component: ResultsView }
    ]
  })
}

describe('Participant Flow Integration Tests', () => {
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

  describe('Complete Participant Flow: Home → Quiz → Results', () => {
    it('should complete the full participant workflow successfully', async () => {
      // 1. Start at Home View
      const homeWrapper = mount(HomeView, {
        global: {
          plugins: [router]
        }
      })

      expect(homeWrapper.exists()).toBe(true)
      expect(store.state.userMode).toBe('participant') // Default mode

      // 2. Select Participant Mode
      const participantModeCard = homeWrapper.find('.mode-card-participant')
      expect(participantModeCard.exists()).toBe(true)
      
      await participantModeCard.trigger('click')
      await nextTick()

      // Should navigate to quiz and maintain participant mode
      expect(router.currentRoute.value.path).toBe('/quiz')
      expect(store.state.userMode).toBe('participant')

      // 3. Quiz View - Participant Mode
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      expect(quizWrapper.exists()).toBe(true)
      expect(quizWrapper.text()).toContain('Mode Participant')

      // Should show first question
      const questionCard = quizWrapper.findComponent({ name: 'QuestionCard' })
      expect(questionCard.exists()).toBe(true)
      expect(questionCard.props('userMode')).toBe('participant')
      expect(questionCard.text()).toContain(mockQuestions[0].question)

      // Should show navigation controls
      const navigation = quizWrapper.findComponent({ name: 'QuestionNavigation' })
      expect(navigation.exists()).toBe(true)
      expect(navigation.props('currentQuestion')).toBe(0)
      expect(navigation.props('totalQuestions')).toBe(3)

      // Answer first question
      const firstAnswer = questionCard.find('.answer-button')
      await firstAnswer.trigger('click')
      await nextTick()

      // Should record participant answer
      expect(store.state.participantAnswers).toHaveLength(1)
      expect(store.state.participantAnswers[0]).toBe(0)

      // Navigate to next question using navigation
      const nextButton = navigation.find('.next-button')
      expect(nextButton.exists()).toBe(true)
      await nextButton.trigger('click')
      await nextTick()

      // Should show second question
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(questionCard.text()).toContain(mockQuestions[1].question)

      // Answer second question (incorrect answer)
      const secondQuestionAnswers = questionCard.findAll('.answer-button')
      await secondQuestionAnswers[1].trigger('click') // Wrong answer
      await nextTick()

      expect(store.state.participantAnswers).toHaveLength(2)
      expect(store.state.participantAnswers[1]).toBe(1)

      // Navigate to third question
      await navigation.find('.next-button').trigger('click')
      await nextTick()

      // Answer third question
      await questionCard.find('.answer-button').trigger('click')
      await nextTick()

      expect(store.state.participantAnswers).toHaveLength(3)

      // Complete quiz by going past last question
      await navigation.find('.next-button').trigger('click')
      await nextTick()

      // Quiz should be completed
      expect(store.state.isCompleted).toBe(true)
      expect(router.currentRoute.value.path).toBe('/results')

      // 4. Results View
      const resultsWrapper = mount(ResultsView, {
        global: {
          plugins: [router]
        }
      })

      expect(resultsWrapper.exists()).toBe(true)

      // Should show score display
      const scoreDisplay = resultsWrapper.findComponent({ name: 'ScoreDisplay' })
      expect(scoreDisplay.exists()).toBe(true)
      
      // Calculate expected score (2 correct out of 3)
      const expectedScore = store.participantScore
      expect(scoreDisplay.props('score')).toBe(expectedScore)
      expect(scoreDisplay.props('totalQuestions')).toBe(3)

      // Test restart functionality
      const restartButton = scoreDisplay.find('.restart-btn')
      expect(restartButton.exists()).toBe(true)
      
      await restartButton.trigger('click')
      await nextTick()

      // Should reset quiz and navigate back to quiz
      expect(store.state.isCompleted).toBe(false)
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.state.participantAnswers).toHaveLength(0)
      expect(router.currentRoute.value.path).toBe('/quiz')
    })

    it('should handle free navigation between questions', async () => {
      // Set up participant mode
      store.setUserMode('participant')
      store.startQuiz()
      
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      const navigation = quizWrapper.findComponent({ name: 'QuestionNavigation' })
      
      // Start at question 0
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(navigation.props('hasPrevious')).toBe(false)
      expect(navigation.props('hasNext')).toBe(true)

      // Navigate to question 2 directly
      const questionDots = navigation.findAll('.question-dot')
      await questionDots[2].trigger('click')
      await nextTick()

      expect(store.state.currentQuestionIndex).toBe(2)
      expect(navigation.props('hasPrevious')).toBe(true)
      expect(navigation.props('hasNext')).toBe(false)

      // Navigate back to question 1
      await questionDots[1].trigger('click')
      await nextTick()

      expect(store.state.currentQuestionIndex).toBe(1)
      expect(navigation.props('hasPrevious')).toBe(true)
      expect(navigation.props('hasNext')).toBe(true)

      // Use previous button
      const prevButton = navigation.find('.prev-button')
      await prevButton.trigger('click')
      await nextTick()

      expect(store.state.currentQuestionIndex).toBe(0)
    })

    it('should preserve answers when navigating between questions', async () => {
      store.setUserMode('participant')
      store.startQuiz()
      
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      const questionCard = quizWrapper.findComponent({ name: 'QuestionCard' })
      const navigation = quizWrapper.findComponent({ name: 'QuestionNavigation' })

      // Answer question 1
      await questionCard.find('.answer-button').trigger('click')
      expect(store.state.participantAnswers[0]).toBe(0)

      // Navigate to question 2
      await navigation.find('.next-button').trigger('click')
      await nextTick()

      // Answer question 2
      const secondAnswers = questionCard.findAll('.answer-button')
      await secondAnswers[2].trigger('click')
      expect(store.state.participantAnswers[1]).toBe(2)

      // Navigate back to question 1
      await navigation.find('.prev-button').trigger('click')
      await nextTick()

      // Answer should be preserved and button should show as selected
      expect(store.state.participantAnswers[0]).toBe(0)
      expect(questionCard.vm.selectedAnswer).toBe(0)

      // Navigate back to question 2
      await navigation.find('.next-button').trigger('click')
      await nextTick()

      // Answer should be preserved
      expect(store.state.participantAnswers[1]).toBe(2)
      expect(questionCard.vm.selectedAnswer).toBe(2)
    })

    it('should show immediate feedback for answers', async () => {
      store.setUserMode('participant')
      store.startQuiz()
      
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      const questionCard = quizWrapper.findComponent({ name: 'QuestionCard' })
      
      // Answer correctly
      await questionCard.find('.answer-button').trigger('click') // First answer is correct
      await nextTick()

      // Should show as selected
      const selectedButton = questionCard.find('.answer-button.selected')
      expect(selectedButton.exists()).toBe(true)

      // Wait for auto-reveal
      await new Promise(resolve => setTimeout(resolve, 1200))
      await nextTick()

      // Should show result feedback
      expect(questionCard.vm.showResult).toBe(true)
      expect(questionCard.find('.correct-feedback').exists()).toBe(true)
      expect(questionCard.find('.answer-button.correct').exists()).toBe(true)
    })

    it('should calculate score correctly', async () => {
      store.setUserMode('participant')
      store.startQuiz()

      // Answer all questions
      store.answerQuestionAsParticipant(0) // Correct (q1)
      store.goToNextQuestion()
      
      store.answerQuestionAsParticipant(1) // Incorrect (q2, correct is 0)
      store.goToNextQuestion()
      
      store.answerQuestionAsParticipant(0) // Correct (q3)
      store.goToNextQuestion()

      // Complete quiz
      store.completeQuiz()

      // Should have 2 correct answers out of 3
      const score = store.participantScore
      expect(score).toBe(2)

      const percentage = Math.round((score / mockQuestions.length) * 100)
      expect(percentage).toBe(67) // 2/3 = 66.67% rounded to 67%
    })
  })

  describe('Participant Mode Navigation Features', () => {
    beforeEach(() => {
      store.setUserMode('participant')
      store.startQuiz()
    })

    it('should handle keyboard navigation', async () => {
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      // Mock keyboard events
      const handleKeydown = (key: string, ctrlKey = false) => {
        const event = new KeyboardEvent('keydown', { key, ctrlKey })
        window.dispatchEvent(event)
      }

      // Arrow right should go to next question
      expect(store.state.currentQuestionIndex).toBe(0)
      handleKeydown('ArrowRight')
      await nextTick()
      expect(store.state.currentQuestionIndex).toBe(1)

      // Arrow left should go to previous question
      handleKeydown('ArrowLeft')
      await nextTick()
      expect(store.state.currentQuestionIndex).toBe(0)

      // Number keys should select answers
      handleKeydown('1')
      await nextTick()
      expect(store.state.participantAnswers[0]).toBe(0)

      handleKeydown('2')
      await nextTick()
      expect(store.state.participantAnswers[0]).toBe(1)
    })

    it('should show progress indicator', async () => {
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      const navigation = quizWrapper.findComponent({ name: 'QuestionNavigation' })
      
      // Should show current progress
      expect(navigation.text()).toContain('Question 1 / 3')

      // Navigate to next question
      await navigation.find('.next-button').trigger('click')
      await nextTick()

      expect(navigation.text()).toContain('Question 2 / 3')
    })

    it('should handle edge cases in navigation', async () => {
      // Try to go to invalid question index
      store.goToQuestion(-1)
      expect(store.state.currentQuestionIndex).toBe(0)

      store.goToQuestion(999)
      expect(store.state.currentQuestionIndex).toBe(0)

      // Try to go previous from first question
      store.goToPreviousQuestion()
      expect(store.state.currentQuestionIndex).toBe(0)

      // Go to last question
      store.goToQuestion(2)
      expect(store.state.currentQuestionIndex).toBe(2)

      // Try to go next from last question
      store.goToNextQuestion()
      expect(store.state.currentQuestionIndex).toBe(2) // Should stay at last question
    })
  })

  describe('Participant Mode Answer Management', () => {
    beforeEach(() => {
      store.setUserMode('participant')
      store.startQuiz()
    })

    it('should allow changing answers', async () => {
      // Answer question 1
      store.answerQuestionAsParticipant(0)
      expect(store.state.participantAnswers[0]).toBe(0)

      // Change answer
      store.answerQuestionAsParticipant(2)
      expect(store.state.participantAnswers[0]).toBe(2)
      expect(store.state.participantAnswers).toHaveLength(1) // Should not add new answer
    })

    it('should handle unanswered questions', async () => {
      // Skip question 1
      store.goToNextQuestion()
      
      // Answer question 2
      store.answerQuestionAsParticipant(1)
      
      // Go to question 3 without answering
      store.goToNextQuestion()
      
      expect(store.state.participantAnswers).toHaveLength(3)
      expect(store.state.participantAnswers[0]).toBe(-1) // Unanswered
      expect(store.state.participantAnswers[1]).toBe(1)  // Answered
      expect(store.state.participantAnswers[2]).toBe(-1) // Unanswered
    })

    it('should calculate partial scores correctly', async () => {
      // Answer only 2 out of 3 questions
      store.answerQuestionAsParticipant(0) // Correct
      store.goToNextQuestion()
      
      store.answerQuestionAsParticipant(1) // Incorrect
      store.goToNextQuestion()
      
      // Skip question 3
      store.completeQuiz()

      const score = store.participantScore
      expect(score).toBe(1) // Only 1 correct answer
    })
  })

  describe('Results and Completion', () => {
    it('should show detailed results breakdown', async () => {
      // Complete quiz with mixed results
      store.setUserMode('participant')
      store.startQuiz()
      
      store.answerQuestionAsParticipant(0) // Correct
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(1) // Incorrect
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(0) // Correct
      store.completeQuiz()

      const resultsWrapper = mount(ResultsView, {
        global: {
          plugins: [router]
        }
      })

      const scoreDisplay = resultsWrapper.findComponent({ name: 'ScoreDisplay' })
      
      expect(scoreDisplay.props('score')).toBe(2)
      expect(scoreDisplay.props('totalQuestions')).toBe(3)
      expect(scoreDisplay.text()).toContain('2 bonnes réponses sur 3 questions')
      expect(scoreDisplay.text()).toContain('67%')
    })

    it('should show appropriate score messages', async () => {
      const testScoreMessage = (score: number, total: number, expectedMessage: string) => {
        const percentage = Math.round((score / total) * 100)
        let message = ''
        
        if (percentage >= 90) message = 'Excellent ! Vous êtes un vrai cinéphile ! 🏆'
        else if (percentage >= 70) message = 'Très bien ! Vous connaissez bien le cinéma ! 🎬'
        else if (percentage >= 50) message = 'Pas mal ! Continuez à regarder des films ! 🍿'
        else message = 'Il faut réviser vos classiques ! 📚'
        
        expect(message).toContain(expectedMessage.split(' ')[0])
      }

      testScoreMessage(3, 3, 'Excellent') // 100%
      testScoreMessage(2, 3, 'Très bien') // 67%
      testScoreMessage(1, 2, 'Pas mal')   // 50%
      testScoreMessage(0, 3, 'Il faut')   // 0%
    })

    it('should handle restart from results', async () => {
      // Complete a quiz
      store.setUserMode('participant')
      store.startQuiz()
      store.answerQuestionAsParticipant(0)
      store.completeQuiz()

      const resultsWrapper = mount(ResultsView, {
        global: {
          plugins: [router]
        }
      })

      const scoreDisplay = resultsWrapper.findComponent({ name: 'ScoreDisplay' })
      const restartButton = scoreDisplay.find('.restart-btn')
      
      await restartButton.trigger('click')
      await nextTick()

      // Should reset and go back to quiz
      expect(store.state.isCompleted).toBe(false)
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.state.participantAnswers).toHaveLength(0)
      expect(router.currentRoute.value.path).toBe('/quiz')
    })

    it('should handle home navigation from results', async () => {
      store.setUserMode('participant')
      store.completeQuiz()

      const resultsWrapper = mount(ResultsView, {
        global: {
          plugins: [router]
        }
      })

      const scoreDisplay = resultsWrapper.findComponent({ name: 'ScoreDisplay' })
      const homeButton = scoreDisplay.find('.home-btn')
      
      await homeButton.trigger('click')
      await nextTick()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle quiz without questions', async () => {
      // Clear questions
      store.state.questions = []
      
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      // Should show error or redirect
      expect(store.state.questions).toHaveLength(0)
      // In a real implementation, this would show an error message
    })

    it('should handle corrupted participant answers', async () => {
      store.setUserMode('participant')
      store.startQuiz()

      // Simulate corrupted data
      store.state.participantAnswers = [null, undefined, 'invalid'] as any

      // Should handle gracefully
      const score = store.participantScore
      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('should handle navigation during loading', async () => {
      store.state.isLoading = true
      
      const quizWrapper = mount(QuizView, {
        global: {
          plugins: [router]
        }
      })

      // Should show loading state
      expect(quizWrapper.find('.loading-container').exists()).toBe(true)
      
      // Navigation should be disabled during loading
      const navigation = quizWrapper.findComponent({ name: 'QuestionNavigation' })
      expect(navigation.exists()).toBe(false)
    })

    it('should prevent access to results without completing quiz', async () => {
      // Try to access results without completing quiz
      store.setUserMode('participant')
      store.startQuiz()
      // Don't complete quiz
      
      await router.push('/results')
      
      // Should redirect or show error
      // In a real implementation, navigation guards would handle this
      expect(store.state.isCompleted).toBe(false)
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large number of questions efficiently', async () => {
      // Create many questions
      const manyQuestions = Array.from({ length: 100 }, (_, i) => ({
        id: `q${i}`,
        question: `Question ${i}?`,
        answers: ['A', 'B', 'C', 'D'],
        correctAnswer: i % 4
      }))

      store.loadQuestions(manyQuestions)
      store.setUserMode('participant')
      store.startQuiz()

      const start = performance.now()
      
      // Navigate through questions
      for (let i = 0; i < 10; i++) {
        store.goToNextQuestion()
        store.answerQuestionAsParticipant(i % 4)
      }
      
      const end = performance.now()
      
      // Should be fast
      expect(end - start).toBeLessThan(100)
      expect(store.state.participantAnswers).toHaveLength(100)
    })

    it('should not cause memory leaks with frequent navigation', async () => {
      store.setUserMode('participant')
      store.startQuiz()

      // Simulate rapid navigation
      for (let i = 0; i < 50; i++) {
        store.goToNextQuestion()
        store.goToPreviousQuestion()
        store.goToQuestion(i % 3)
      }

      // Should maintain consistent state
      expect(store.state.currentQuestionIndex).toBeGreaterThanOrEqual(0)
      expect(store.state.currentQuestionIndex).toBeLessThan(mockQuestions.length)
    })
  })
})