import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import QuizView from '../QuizView.vue'
import { useQuizStore } from '@/stores/quiz'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import QuestionCard from '@/components/quiz/QuestionCard.vue'

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/quiz', component: QuizView },
    { path: '/results', component: { template: '<div>Results</div>' } }
  ]
})

// Mock question data
const mockQuestions = [
  {
    id: 'q1',
    question: 'Test question 1?',
    answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'],
    correctAnswer: 0,
    category: 'Test',
    difficulty: 'easy' as const
  },
  {
    id: 'q2',
    question: 'Test question 2?',
    answers: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
    correctAnswer: 1,
    category: 'Test',
    difficulty: 'medium' as const
  }
]

describe('QuizView', () => {
  let pinia: ReturnType<typeof createPinia>
  let quizStore: ReturnType<typeof useQuizStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    quizStore = useQuizStore()
    
    // Reset store state
    quizStore.state.questions = []
    quizStore.state.currentQuestionIndex = 0
    quizStore.state.score = 0
    quizStore.state.answers = []
    quizStore.state.isCompleted = false
    quizStore.state.isLoading = false
    quizStore.state.error = undefined
  })

  const createWrapper = (initialRoute = '/quiz') => {
    router.push(initialRoute)
    return mount(QuizView, {
      global: {
        plugins: [router, pinia],
        components: {
          BaseButton,
          BaseCard,
          QuestionCard
        },
        stubs: {
          QuestionCard: {
            template: '<div class="question-card-stub">Question Card</div>',
            props: ['question', 'questionNumber', 'totalQuestions'],
            emits: ['answer', 'next']
          }
        }
      }
    })
  }

  it('shows loading state when quiz is loading', () => {
    quizStore.state.isLoading = true
    
    const wrapper = createWrapper()
    
    expect(wrapper.find('.loading-container').exists()).toBe(true)
    expect(wrapper.find('.loading-title').text()).toBe('Chargement du quiz...')
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })

  it('shows error state when there is an error', () => {
    quizStore.state.error = 'Test error message'
    
    const wrapper = createWrapper()
    
    expect(wrapper.find('.error-container').exists()).toBe(true)
    expect(wrapper.find('.error-message').text()).toBe('Test error message')
    expect(wrapper.find('.error-actions').exists()).toBe(true)
  })

  it('shows quiz content when questions are loaded', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isLoading = false
    quizStore.state.error = undefined
    quizStore.state.isCompleted = false
    
    const wrapper = createWrapper()
    
    expect(wrapper.find('.quiz-content').exists()).toBe(true)
    expect(wrapper.find('.quiz-header').exists()).toBe(true)
    expect(wrapper.find('.question-container').exists()).toBe(true)
  })

  it('displays quiz header with title and controls', () => {
    quizStore.state.questions = mockQuestions
    
    const wrapper = createWrapper()
    
    const header = wrapper.find('.quiz-header')
    expect(header.exists()).toBe(true)
    expect(header.find('h1').text()).toBe('Quiz Cinéma')
    expect(header.find('.quiz-subtitle').text()).toBe('Testez vos connaissances !')
    expect(header.find('.quit-button').exists()).toBe(true)
  })

  it('shows quit confirmation dialog when quit button is clicked', async () => {
    quizStore.state.questions = mockQuestions
    
    const wrapper = createWrapper()
    
    const quitButton = wrapper.find('.quit-button')
    await quitButton.trigger('click')
    
    expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
    expect(wrapper.find('.dialog-title').text()).toBe('Quitter le quiz ?')
  })

  it('handles answer selection and navigation', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.loadQuestions(mockQuestions)
    quizStore.startQuiz()
    
    const wrapper = createWrapper()
    
    // Mock the answerQuestion method
    const answerQuestionSpy = vi.spyOn(quizStore, 'answerQuestion')
    
    // Simulate answer selection
    await wrapper.vm.handleAnswer(0, true)
    
    expect(answerQuestionSpy).toHaveBeenCalledWith(0)
  })

  it('shows completion redirect when quiz is completed', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    
    const wrapper = createWrapper()
    
    expect(wrapper.find('.completion-redirect').exists()).toBe(true)
    expect(wrapper.find('.completion-title').text()).toBe('Quiz terminé !')
  })

  it('handles retry when there is an error', async () => {
    quizStore.state.error = 'Test error'
    
    const wrapper = createWrapper()
    
    const clearErrorSpy = vi.spyOn(quizStore, 'clearError')
    const loadQuestionsSpy = vi.spyOn(quizStore, 'loadQuestionsWithCache')
    
    const retryButton = wrapper.find('.error-actions').findComponent(BaseButton)
    await retryButton.trigger('click')
    
    expect(clearErrorSpy).toHaveBeenCalled()
    expect(loadQuestionsSpy).toHaveBeenCalled()
  })

  it('navigates to home when home button is clicked in error state', async () => {
    quizStore.state.error = 'Test error'
    
    const wrapper = createWrapper()
    const pushSpy = vi.spyOn(router, 'push')
    
    const buttons = wrapper.find('.error-actions').findAllComponents(BaseButton)
    const homeButton = buttons[1] // Second button is "Retour à l'accueil"
    
    await homeButton.trigger('click')
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('confirms quit and navigates to home', async () => {
    quizStore.state.questions = mockQuestions
    
    const wrapper = createWrapper()
    const pushSpy = vi.spyOn(router, 'push')
    
    // Open quit dialog
    await wrapper.find('.quit-button').trigger('click')
    
    // Confirm quit
    const confirmButton = wrapper.find('.dialog-actions').findAllComponents(BaseButton)[1]
    await confirmButton.trigger('click')
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('handles keyboard shortcuts', async () => {
    quizStore.state.questions = mockQuestions
    
    const wrapper = createWrapper()
    
    // Test ESC key to show quit dialog
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(escEvent)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.showQuitDialog).toBe(true)
  })

  it('prevents page refresh when quiz is in progress', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.currentQuestionIndex = 1
    quizStore.state.answers = [0]
    
    const wrapper = createWrapper()
    
    const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent
    beforeUnloadEvent.preventDefault = vi.fn()
    
    window.dispatchEvent(beforeUnloadEvent)
    
    expect(beforeUnloadEvent.preventDefault).toHaveBeenCalled()
  })

  it('integrates with Pinia store correctly', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.currentQuestionIndex = 0
    
    const wrapper = createWrapper()
    
    // Check that the component accesses store data correctly
    expect(wrapper.vm.quizStore.state.questions).toEqual(mockQuestions)
    expect(wrapper.vm.quizStore.currentQuestion).toEqual(mockQuestions[0])
  })

  it('handles transitions between questions smoothly', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.loadQuestions(mockQuestions)
    quizStore.startQuiz()
    
    const wrapper = createWrapper()
    
    // Test that the transition state is managed correctly
    expect(wrapper.vm.isTransitioning).toBe(false)
    
    // Call handleNext and verify it manages the transition state
    const handleNextPromise = wrapper.vm.handleNext()
    expect(wrapper.vm.isTransitioning).toBe(true)
    
    await handleNextPromise
    
    // After a short delay, transition should be reset
    await new Promise(resolve => setTimeout(resolve, 600))
    expect(wrapper.vm.isTransitioning).toBe(false)
  })

  it('has proper mobile-first responsive design', () => {
    quizStore.state.questions = mockQuestions
    
    const wrapper = createWrapper()
    
    // Check that responsive classes are applied
    expect(wrapper.find('.quiz-header').exists()).toBe(true)
    expect(wrapper.find('.question-container').exists()).toBe(true)
    
    // Check mobile-specific styles exist in component
    const style = wrapper.find('style')
    expect(wrapper.html()).toContain('quiz-view')
  })
})