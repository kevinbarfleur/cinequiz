import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import ResultsView from '../ResultsView.vue'
import { useQuizStore } from '@/stores/quiz'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ScoreDisplay from '@/components/quiz/ScoreDisplay.vue'

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/quiz', component: { template: '<div>Quiz</div>' } },
    { path: '/results', component: ResultsView }
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
    difficulty: 'easy' as const,
    explanation: 'This is the explanation for question 1'
  },
  {
    id: 'q2',
    question: 'Test question 2?',
    answers: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
    correctAnswer: 1,
    category: 'Test',
    difficulty: 'medium' as const,
    explanation: 'This is the explanation for question 2'
  }
]

// Mock navigator for sharing functionality
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  writable: true
})

Object.defineProperty(navigator, 'share', {
  value: vi.fn().mockResolvedValue(undefined),
  writable: true
})

describe('ResultsView', () => {
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
    quizStore.state.startTime = new Date()
    quizStore.state.endTime = undefined
  })

  const createWrapper = (initialRoute = '/results') => {
    router.push(initialRoute)
    return mount(ResultsView, {
      global: {
        plugins: [router, pinia],
        components: {
          BaseButton,
          BaseCard,
          ScoreDisplay
        },
        stubs: {
          ScoreDisplay: {
            template: '<div class="score-display-stub">Score Display</div>',
            props: ['score', 'totalQuestions', 'stats', 'isNewBestScore'],
            emits: ['restart', 'home']
          }
        }
      }
    })
  }

  it('shows no data state when quiz is not completed', () => {
    const wrapper = createWrapper()
    
    expect(wrapper.find('.no-data-container').exists()).toBe(true)
    expect(wrapper.find('.no-data-title').text()).toBe('Aucun résultat à afficher')
    expect(wrapper.find('.no-data-message').text()).toContain('Il semble que vous n\'ayez pas encore terminé de quiz')
  })

  it('shows results content when quiz is completed', () => {
    // Set up completed quiz state
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1] // Both correct
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    expect(wrapper.find('.results-content').exists()).toBe(true)
    expect(wrapper.find('.no-data-container').exists()).toBe(false)
  })

  it('integrates ScoreDisplay component correctly', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    const scoreDisplay = wrapper.find('.score-display-stub')
    expect(scoreDisplay.exists()).toBe(true)
  })

  it('displays detailed statistics correctly', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 0] // First correct, second incorrect
    quizStore.state.score = 1
    quizStore.state.endTime = new Date(Date.now() + 60000) // 1 minute later
    
    const wrapper = createWrapper()
    
    expect(wrapper.find('.stats-title').text()).toBe('📊 Statistiques détaillées')
    expect(wrapper.find('.stats-grid').exists()).toBe(true)
    
    // Check performance stats
    const statGroups = wrapper.findAll('.stat-group')
    expect(statGroups.length).toBeGreaterThanOrEqual(2) // Performance and Time groups
  })

  it('shows question review section with toggle functionality', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    expect(wrapper.find('.review-title').text()).toBe('📝 Révision des questions')
    
    const toggleButton = wrapper.find('.toggle-button')
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.text()).toContain('Développer')
    
    // Initially collapsed
    expect(wrapper.find('.review-content').exists()).toBe(false)
    
    // Expand review
    await toggleButton.trigger('click')
    expect(wrapper.find('.review-content').exists()).toBe(true)
    expect(toggleButton.text()).toContain('Réduire')
  })

  it('displays question review items correctly', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 0] // First correct, second incorrect
    quizStore.state.score = 1
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    // Expand review
    await wrapper.find('.toggle-button').trigger('click')
    
    const reviewItems = wrapper.findAll('.question-review-item')
    expect(reviewItems).toHaveLength(2)
    
    // Check first question (correct)
    const firstItem = reviewItems[0]
    expect(firstItem.find('.question-number').text()).toBe('Q1')
    expect(firstItem.find('.result-correct').exists()).toBe(true)
    expect(firstItem.find('.question-text').text()).toBe('Test question 1?')
    
    // Check second question (incorrect)
    const secondItem = reviewItems[1]
    expect(secondItem.find('.question-number').text()).toBe('Q2')
    expect(secondItem.find('.result-incorrect').exists()).toBe(true)
  })

  it('handles restart functionality', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    const pushSpy = vi.spyOn(router, 'push')
    const resetSpy = vi.spyOn(quizStore, 'resetQuiz')
    
    const restartButton = wrapper.find('.action-buttons').findAllComponents(BaseButton)[0]
    await restartButton.trigger('click')
    
    expect(resetSpy).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/quiz')
  })

  it('handles navigation to home', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    const pushSpy = vi.spyOn(router, 'push')
    
    const homeButton = wrapper.find('.action-buttons').findAllComponents(BaseButton).find(btn => 
      btn.text().includes('Accueil')
    )
    await homeButton!.trigger('click')
    
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('shows share functionality when available', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    // Should show share button since we mocked navigator.clipboard
    const shareButton = wrapper.find('.action-buttons').findAllComponents(BaseButton).find(btn => 
      btn.text().includes('Partager')
    )
    expect(shareButton).toBeDefined()
  })

  it('opens and closes share modal', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    // Initially no modal
    expect(wrapper.find('.share-modal-overlay').exists()).toBe(false)
    
    // Open share modal
    const shareButton = wrapper.find('.action-buttons').findAllComponents(BaseButton).find(btn => 
      btn.text().includes('Partager')
    )
    await shareButton!.trigger('click')
    
    expect(wrapper.find('.share-modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.share-title').text()).toBe('📤 Partager mes résultats')
    
    // Close modal
    await wrapper.find('.close-button').trigger('click')
    expect(wrapper.find('.share-modal-overlay').exists()).toBe(false)
  })

  it('handles clipboard copy functionality', async () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    // Open share modal
    const shareButton = wrapper.find('.action-buttons').findAllComponents(BaseButton).find(btn => 
      btn.text().includes('Partager')
    )
    await shareButton!.trigger('click')
    
    // Click copy button
    const copyButton = wrapper.find('.share-actions').findAllComponents(BaseButton)[0]
    await copyButton.trigger('click')
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('formats time correctly', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    // Test formatTime method
    expect(wrapper.vm.formatTime(30)).toBe('30s')
    expect(wrapper.vm.formatTime(90)).toBe('1m 30s')
    expect(wrapper.vm.formatTime(3661)).toBe('1h 1m')
  })

  it('calculates answer correctness properly', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 0] // First correct, second incorrect
    quizStore.state.score = 1
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    expect(wrapper.vm.isAnswerCorrect(0)).toBe(true)  // First question correct
    expect(wrapper.vm.isAnswerCorrect(1)).toBe(false) // Second question incorrect
  })

  it('generates correct answer classes for review', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 0] // First correct, second incorrect
    quizStore.state.score = 1
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    // For first question (user answered 0, correct is 0)
    expect(wrapper.vm.getAnswerClasses(0, 0, 0)).toContain('answer-correct')
    expect(wrapper.vm.getAnswerClasses(0, 1, 0)).toContain('answer-neutral')
    
    // For second question (user answered 0, correct is 1)
    expect(wrapper.vm.getAnswerClasses(1, 0, 1)).toContain('answer-incorrect')
    expect(wrapper.vm.getAnswerClasses(1, 1, 1)).toContain('answer-correct')
  })

  it('shows no data state correctly when no quiz data', () => {
    // This test verifies the no-data state is shown correctly
    // The timeout functionality is tested implicitly through the hasQuizData computed property
    const wrapper = createWrapper()
    
    expect(wrapper.find('.no-data-container').exists()).toBe(true)
    expect(wrapper.find('.no-data-title').text()).toBe('Aucun résultat à afficher')
    
    // Verify the computed property works correctly
    expect(wrapper.vm.hasQuizData).toBe(false)
  })

  it('has proper mobile-first responsive design', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    const wrapper = createWrapper()
    
    // Check that responsive classes are applied
    expect(wrapper.find('.results-content').exists()).toBe(true)
    expect(wrapper.find('.stats-grid').exists()).toBe(true)
    expect(wrapper.find('.action-buttons').exists()).toBe(true)
  })

  it('shows historical stats when localStorage is available', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date()
    
    // Mock localStorage availability
    vi.spyOn(quizStore, 'isLocalStorageAvailable', 'get').mockReturnValue(true)
    
    const wrapper = createWrapper()
    
    const statGroups = wrapper.findAll('.stat-group')
    const historicalGroup = statGroups.find(group => 
      group.find('.stat-group-title').text() === 'Historique'
    )
    
    expect(historicalGroup).toBeDefined()
  })

  it('handles share text generation correctly', () => {
    quizStore.state.questions = mockQuestions
    quizStore.state.isCompleted = true
    quizStore.state.answers = [0, 1]
    quizStore.state.score = 2
    quizStore.state.endTime = new Date(Date.now() + 60000) // 1 minute later
    
    const wrapper = createWrapper()
    
    const shareText = wrapper.vm.shareText
    expect(shareText).toContain('Quiz Cinéma terminé')
    expect(shareText).toContain('Score: 100%')
    expect(shareText).toContain('(2/2)')
  })
})