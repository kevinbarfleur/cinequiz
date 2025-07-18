import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Question, QuizData, QuizStats, PersistedQuizData, UserPreferences } from '@/types'
import { LocalStorageManager } from '@/utils/localStorage'

// Import des différents quiz par catégorie
import quizGeneral from '@/data/quiz-general.json'
import quizRomance from '@/data/quiz-romance.json'
import quizHistorique from '@/data/quiz-historique.json'
import quizAction from '@/data/quiz-action.json'

// Types pour les catégories de quiz
export type QuizCategory = 'general' | 'romance' | 'historique' | 'action'

export interface QuizCategoryInfo {
  id: QuizCategory
  title: string
  icon: string
}

// Configuration des catégories disponibles
export const QUIZ_CATEGORIES: QuizCategoryInfo[] = [
  {
    id: 'general',
    title: 'Général',
    icon: '🎬'
  },
  {
    id: 'romance',
    title: 'Romance',
    icon: '💕'
  },
  {
    id: 'historique',
    title: 'Historique',
    icon: '🏛️'
  },
  {
    id: 'action',
    title: 'Action',
    icon: '💥'
  }
]

export interface QuizState {
  questions: Question[]
  currentQuestionIndex: number
  participantAnswers: number[]
  isCompleted: boolean
  startTime: Date
  endTime: Date | undefined
  isLoading: boolean
  error: string | undefined
}

export const useQuizStore = defineStore('quiz', () => {
  // État réactif principal
  const state = reactive<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    participantAnswers: [],
    isCompleted: false,
    startTime: new Date(),
    endTime: undefined,
    isLoading: false,
    error: undefined
  })

  // État réactif pour les données persistées
  const persistedData = ref<PersistedQuizData>(LocalStorageManager.getQuizData())
  const userPreferences = ref<UserPreferences>(LocalStorageManager.getUserPreferences())

  // Getters calculés
  const currentQuestion = computed(() => 
    state.questions[state.currentQuestionIndex] || null
  )

  const progress = computed(() => 
    state.questions.length > 0 
      ? Math.round((state.currentQuestionIndex / state.questions.length) * 100)
      : 0
  )

  const progressText = computed(() => 
    `${state.currentQuestionIndex + 1}/${state.questions.length}`
  )

  const score = computed(() => {
    if (state.questions.length === 0 || state.participantAnswers.length === 0) return 0
    
    let correctAnswers = 0
    for (let i = 0; i < state.participantAnswers.length; i++) {
      const question = state.questions[i]
      if (question && state.participantAnswers[i] === question.correctAnswer) {
        correctAnswers++
      }
    }
    return correctAnswers
  })

  const finalScore = computed(() => 
    state.questions.length > 0 
      ? Math.round((score.value / state.questions.length) * 100)
      : 0
  )

  const quizStats = computed((): QuizStats => {
    const timeSpent = state.endTime && state.startTime 
      ? Math.round((state.endTime.getTime() - state.startTime.getTime()) / 1000)
      : 0
    
    return {
      totalQuestions: state.questions.length,
      correctAnswers: score.value,
      incorrectAnswers: state.questions.length - score.value,
      scorePercentage: finalScore.value,
      timeSpent,
      averageTimePerQuestion: state.questions.length > 0 ? timeSpent / state.questions.length : 0
    }
  })

  const hasNextQuestion = computed(() => 
    state.currentQuestionIndex < state.questions.length - 1
  )

  const hasPreviousQuestion = computed(() => 
    state.currentQuestionIndex > 0
  )

  const isQuizStarted = computed(() => 
    state.questions.length > 0 && (state.currentQuestionIndex > 0 || state.participantAnswers.length > 0)
  )

  // Getters calculés pour les données persistées
  const bestScore = computed(() => persistedData.value.bestScore)
  const totalGamesPlayed = computed(() => persistedData.value.totalGamesPlayed)
  const averageScore = computed(() => persistedData.value.averageScore)
  const lastPlayedDate = computed(() => 
    persistedData.value.lastPlayedDate ? new Date(persistedData.value.lastPlayedDate) : null
  )
  const bestTime = computed(() => persistedData.value.bestTime)
  const isNewBestScore = computed(() => 
    state.isCompleted && finalScore.value > persistedData.value.bestScore
  )
  const isLocalStorageAvailable = computed(() => LocalStorageManager.isAvailable())

  // Fonction utilitaire pour obtenir les données d'une catégorie
  function getQuizDataByCategory(category: QuizCategory): QuizData {
    const quizDataMap = {
      general: quizGeneral,
      romance: quizRomance,
      historique: quizHistorique,
      action: quizAction
    }
    
    return quizDataMap[category] as QuizData
  }

  // Actions
  async function loadQuestionsFromJSON(category: QuizCategory = 'general'): Promise<void> {
    try {
      state.isLoading = true
      state.error = undefined
      
      // Simulation d'un délai de chargement pour une meilleure UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const data = getQuizDataByCategory(category)
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Format de données invalide: questions manquantes')
      }

      if (data.questions.length === 0) {
        throw new Error('Aucune question trouvée dans le fichier JSON')
      }

      // Validation des questions
      data.questions.forEach((question, index) => {
        if (!question.id || !question.question || !question.answers || typeof question.correctAnswer !== 'number') {
          throw new Error(`Question ${index + 1} invalide: champs requis manquants`)
        }
        
        if (question.correctAnswer < 0 || question.correctAnswer >= question.answers.length) {
          throw new Error(`Question ${index + 1} invalide: index de réponse correcte hors limites`)
        }
      })

      state.questions = [...data.questions]
      resetQuiz()
      
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Erreur lors du chargement des questions'
      console.error('Erreur lors du chargement des questions:', error)
    } finally {
      state.isLoading = false
    }
  }

  function loadQuestions(newQuestions: Question[]): void {
    if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
      state.error = 'Liste de questions invalide ou vide'
      return
    }

    state.questions = [...newQuestions]
    resetQuiz()
  }

  function resetQuiz(): void {
    state.currentQuestionIndex = 0
    state.isCompleted = false
    state.startTime = new Date()
    state.endTime = undefined
    state.error = undefined
    state.participantAnswers = []
  }

  function startQuiz(): void {
    if (state.questions.length === 0) {
      state.error = 'Aucune question chargée'
      return
    }
    
    state.startTime = new Date()
    state.currentQuestionIndex = 0
    state.participantAnswers = []
    state.isCompleted = false
    state.error = undefined
  }

  function answerQuestion(answerIndex: number): boolean {
    if (!currentQuestion.value) {
      state.error = 'Aucune question courante disponible'
      return false
    }

    if (answerIndex < 0 || answerIndex >= currentQuestion.value.answers.length) {
      state.error = 'Index de réponse invalide'
      return false
    }

    // Enregistrer ou modifier la réponse pour la question courante
    state.participantAnswers[state.currentQuestionIndex] = answerIndex
    
    return true
  }

  function goToNextQuestion(): boolean {
    if (!hasNextQuestion.value) {
      completeQuiz()
      return false
    }
    
    state.currentQuestionIndex++
    state.error = undefined
    return true
  }

  function goToPreviousQuestion(): boolean {
    if (!hasPreviousQuestion.value) {
      state.error = 'Impossible de revenir en arrière'
      return false
    }
    
    state.currentQuestionIndex--
    state.error = undefined
    return true
  }

  function goToQuestion(index: number): boolean {
    if (index < 0 || index >= state.questions.length) {
      state.error = 'Index de question invalide'
      return false
    }
    
    state.currentQuestionIndex = index
    state.error = undefined
    return true
  }

  function completeQuiz(): void {
    state.isCompleted = true
    state.endTime = new Date()
    
    // Sauvegarder les résultats
    saveQuizResult()
  }

  function clearError(): void {
    state.error = undefined
  }

  // Actions de persistance
  function saveQuizResult(): void {
    if (!state.isCompleted) return

    const currentStats = quizStats.value
    LocalStorageManager.saveQuizResult(score.value, state.questions.length, currentStats.timeSpent)
    
    // Refresh persisted data after saving
    persistedData.value = LocalStorageManager.getQuizData()
  }

  function saveUserPreferences(): void {
    LocalStorageManager.saveUserPreferences(userPreferences.value)
  }

  function resetAllData(): void {
    LocalStorageManager.resetAllData()
    
    // Refresh persisted data after reset
    persistedData.value = LocalStorageManager.getQuizData()
    userPreferences.value = LocalStorageManager.getUserPreferences()
  }

  function getStorageInfo() {
    return {
      size: LocalStorageManager.getStorageSize(),
      available: LocalStorageManager.isAvailable()
    }
  }

  // Fonctions utilitaires
  function getQuestionById(id: string): Question | undefined {
    return state.questions.find(q => q.id === id)
  }

  return {
    // État
    state,
    persistedData,
    userPreferences,
    
    // Getters calculés
    currentQuestion,
    progress,
    progressText,
    score,
    finalScore,
    quizStats,
    hasNextQuestion,
    hasPreviousQuestion,
    isQuizStarted,
    
    // Getters calculés pour les données persistées
    bestScore,
    totalGamesPlayed,
    averageScore,
    lastPlayedDate,
    bestTime,
    isNewBestScore,
    isLocalStorageAvailable,
    
    // Actions
    loadQuestionsFromJSON,
    loadQuestions,
    resetQuiz,
    startQuiz,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    completeQuiz,
    clearError,
    
    // Actions de persistance
    saveQuizResult,
    saveUserPreferences,
    resetAllData,
    getStorageInfo,
    
    // Fonctions utilitaires
    getQuestionById
  }
})