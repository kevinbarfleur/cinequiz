import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Question, QuizData, QuizStats, QuizState, PersistedQuizData, UserPreferences, Team, TeamAnswer } from '@/types'
import { LocalStorageManager } from '@/utils/localStorage'
import { 
  validateTeamName, 
  validateTeam, 
  validateTeamList, 
  validateTeamAnswerAssignment,
  validateAllTeamsAssigned,
  validateQuizStartConfiguration,
  validateUserMode,
  validateModeCompatibility,
  validateSessionData,
  createDefaultSessionData,
  repairSessionData,
  TEAM_VALIDATION_MESSAGES,
  MODE_VALIDATION_MESSAGES,
  type ValidationResult
} from '@/utils/teamValidation'
import { IncrementalScoreCalculator } from '@/utils/performance'

// Import du fichier JSON des questions
import quizData from '@/data/quiz-questions.json'

export const useQuizStore = defineStore('quiz', () => {
  // État réactif principal
  const state = reactive<QuizState>({
    questions: [],
    teams: [],
    currentQuestionIndex: 0,
    userMode: 'participant',
    teamAnswers: [],
    isCompleted: false,
    startTime: new Date(),
    endTime: undefined,
    isLoading: false,
    error: undefined,
    // Pour le mode participant
    participantAnswers: [],
    // Pour le mode animateur
    currentQuestionTeamAssignments: new Map(),
    // Anciens champs pour compatibilité
    score: 0,
    answers: []
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

  const finalScore = computed(() => 
    state.questions.length > 0 
      ? Math.round((state.score / state.questions.length) * 100)
      : 0
  )

  const quizStats = computed((): QuizStats => {
    const timeSpent = state.endTime && state.startTime 
      ? Math.round((state.endTime.getTime() - state.startTime.getTime()) / 1000)
      : 0
    
    return {
      totalQuestions: state.questions.length,
      correctAnswers: state.score,
      incorrectAnswers: state.questions.length - state.score,
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
    state.questions.length > 0 && (state.currentQuestionIndex > 0 || state.answers.length > 0)
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

  // Optimized score calculator instance
  const scoreCalculator = new IncrementalScoreCalculator()

  // Getters calculés pour les équipes avec optimisation avancée
  const teamScores = computed(() => {
    return scoreCalculator.calculateScores(state.teams, state.teamAnswers)
  })

  // Getter pour le score du participant
  // Note: In participant mode, there is no scoring - this always returns 0
  const participantScore = computed(() => {
    // Participant mode has no scoring functionality
    return 0
  })

  const teamRankings = computed(() => 
    teamScores.value
      .slice() // Create a copy to avoid mutating original
      .sort((a, b) => {
        // Primary sort: score descending
        if (b.score !== a.score) {
          return b.score - a.score
        }
        // Secondary sort: name ascending (stable sort)
        return a.name.localeCompare(b.name)
      })
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }))
  )

  const canProceedToNextQuestion = computed(() => {
    if (state.userMode === 'participant') return true
    
    // En mode animateur, toutes les équipes doivent être assignées à au moins une réponse
    const currentAssignments = state.currentQuestionTeamAssignments
    const totalAssignedTeams = Array.from(currentAssignments.values())
      .flat().length
    
    return totalAssignedTeams >= state.teams.length && state.teams.length > 0
  })

  const questionResults = computed(() => {
    // Group team answers by question for efficient lookup
    const answersByQuestion = new Map<string, TeamAnswer[]>()
    state.teamAnswers.forEach(answer => {
      if (!answersByQuestion.has(answer.questionId)) {
        answersByQuestion.set(answer.questionId, [])
      }
      answersByQuestion.get(answer.questionId)!.push(answer)
    })
    
    // Create team lookup map for efficient name resolution
    const teamMap = new Map(state.teams.map(team => [team.id, team]))
    
    return state.questions.map(question => ({
      questionId: question.id,
      correctAnswer: question.correctAnswer,
      teamAnswers: (answersByQuestion.get(question.id) || []).map(answer => {
        const team = teamMap.get(answer.teamId)
        return {
          teamId: answer.teamId,
          teamName: team?.name || 'Équipe inconnue',
          answerIndex: answer.answerIndex,
          isCorrect: answer.isCorrect
        }
      })
    }))
  })

  // Actions
  async function loadQuestionsFromJSON(): Promise<void> {
    try {
      state.isLoading = true
      state.error = undefined
      
      // Simulation d'un délai de chargement pour une meilleure UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const data = quizData as QuizData
      
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
    state.currentQuestionTeamAssignments = new Map()
    
    // Participant mode doesn't track answers
    state.participantAnswers = []
    
    // Only reset team answers if not preserving them
    if (state.userMode !== 'host' || state.teams.length === 0) {
      state.teamAnswers = []
    }
    
    // Anciens champs pour compatibilité
    state.score = 0
    state.answers = []
  }

  function startQuiz(): void {
    if (state.questions.length === 0) {
      state.error = 'Aucune question chargée'
      return
    }
    
    state.startTime = new Date()
    state.currentQuestionIndex = 0
    state.score = 0
    state.answers = []
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

    // Enregistrer la réponse
    state.answers.push(answerIndex)
    
    // Vérifier si la réponse est correcte
    const isCorrect = answerIndex === currentQuestion.value.correctAnswer
    if (isCorrect) {
      state.score++
    }
    
    // Passer à la question suivante ou terminer le quiz
    if (hasNextQuestion.value) {
      state.currentQuestionIndex++
    } else {
      completeQuiz()
    }

    return isCorrect
  }

  function goToNextQuestion(): boolean {
    if (hasNextQuestion.value) {
      state.currentQuestionIndex++
      return true
    }
    return false
  }

  function goToPreviousQuestion(): boolean {
    if (hasPreviousQuestion.value) {
      state.currentQuestionIndex--
      return true
    }
    return false
  }

  function goToQuestion(questionIndex: number): boolean {
    if (questionIndex >= 0 && questionIndex < state.questions.length) {
      state.currentQuestionIndex = questionIndex
      return true
    }
    return false
  }

  function completeQuiz(): void {
    state.isCompleted = true
    state.endTime = new Date()
    
    // Sauvegarder automatiquement le résultat si localStorage est disponible
    if (isLocalStorageAvailable.value) {
      saveQuizResult()
    }
  }

  function clearError(): void {
    state.error = undefined
  }

  // Actions de gestion des équipes
  function createTeam(name: string, color?: string): string {
    // Utiliser le système de validation centralisé
    const nameValidation = validateTeamName(name, state.teams)
    
    if (!nameValidation.isValid) {
      state.error = nameValidation.errors[0]
      return ''
    }

    const teamId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTeam: Team = {
      id: teamId,
      name: name.trim(),
      score: 0,
      color: color
    }

    // Valider l'équipe complète avant de l'ajouter
    const teamValidation = validateTeam(newTeam, state.teams)
    
    if (!teamValidation.isValid) {
      state.error = teamValidation.errors[0]
      return ''
    }

    state.teams.push(newTeam)
    
    // Reset score calculator when team structure changes
    scoreCalculator.reset()
    
    state.error = undefined
    return teamId
  }

  function editTeam(teamId: string, name: string, color?: string): boolean {
    const teamIndex = state.teams.findIndex(team => team.id === teamId)
    
    if (teamIndex === -1) {
      state.error = TEAM_VALIDATION_MESSAGES.TEAM_NOT_FOUND(teamId)
      return false
    }

    // Utiliser le système de validation centralisé
    const nameValidation = validateTeamName(name, state.teams, teamId)
    
    if (!nameValidation.isValid) {
      state.error = nameValidation.errors[0]
      return false
    }

    const updatedTeam: Team = {
      ...state.teams[teamIndex],
      name: name.trim(),
      color: color
    }

    // Valider l'équipe complète après modification
    const teamValidation = validateTeam(updatedTeam, state.teams)
    
    if (!teamValidation.isValid) {
      state.error = teamValidation.errors[0]
      return false
    }

    state.teams[teamIndex] = updatedTeam
    state.error = undefined
    return true
  }

  function deleteTeam(teamId: string): boolean {
    const teamIndex = state.teams.findIndex(team => team.id === teamId)
    
    if (teamIndex === -1) {
      state.error = 'Équipe non trouvée'
      return false
    }

    // Supprimer l'équipe
    state.teams.splice(teamIndex, 1)

    // Supprimer toutes les réponses associées à cette équipe
    state.teamAnswers = state.teamAnswers.filter(answer => answer.teamId !== teamId)

    // Nettoyer les assignations courantes
    state.currentQuestionTeamAssignments.forEach((teamIds, answerIndex) => {
      const filteredTeamIds = teamIds.filter(id => id !== teamId)
      if (filteredTeamIds.length === 0) {
        state.currentQuestionTeamAssignments.delete(answerIndex)
      } else {
        state.currentQuestionTeamAssignments.set(answerIndex, filteredTeamIds)
      }
    })

    // Reset score calculator when team structure changes
    scoreCalculator.reset()

    state.error = undefined
    return true
  }

  function setUserMode(mode: 'host' | 'participant'): boolean {
    // Valider le mode utilisateur
    const modeValidation = validateUserMode(mode)
    
    if (!modeValidation.isValid) {
      state.error = modeValidation.errors[0]
      return false
    }

    // Valider la compatibilité avec les données actuelles
    const compatibilityValidation = validateModeCompatibility(mode, state.teams, state.teamAnswers)
    
    if (!compatibilityValidation.isValid) {
      state.error = compatibilityValidation.errors[0]
      return false
    }

    try {
      const previousMode = state.userMode
      state.userMode = mode
      
      // Réinitialiser les assignations courantes lors du changement de mode
      state.currentQuestionTeamAssignments.clear()
      
      // En mode participant, vider les réponses d'équipes et réinitialiser le scoring
      if (mode === 'participant') {
        state.teamAnswers = []
        state.score = 0 // Clear any legacy scoring
        state.answers = [] // Clear legacy answer tracking
      }

      // En mode animateur, s'assurer qu'il y a au moins une équipe
      if (mode === 'host' && state.teams.length === 0) {
        // Créer une équipe par défaut si nécessaire
        const defaultTeamId = createTeam('Équipe 1', '#6366f1')
        if (!defaultTeamId) {
          // Rollback si la création échoue
          state.userMode = previousMode
          state.error = MODE_VALIDATION_MESSAGES.HOST_MODE_REQUIREMENTS
          return false
        }
      }

      state.error = undefined
      return true
      
    } catch (error) {
      state.error = MODE_VALIDATION_MESSAGES.MODE_SWITCH_ERROR
      console.error('Erreur lors du changement de mode:', error)
      return false
    }
  }

  function assignAnswerToTeam(questionId: string, answerIndex: number, teamId: string): boolean {
    if (!currentQuestion.value || currentQuestion.value.id !== questionId) {
      state.error = 'Question courante invalide'
      return false
    }

    // Créer une liste des réponses d'équipes sans la réponse existante de cette équipe pour cette question
    const filteredTeamAnswers = state.teamAnswers.filter(
      answer => !(answer.questionId === questionId && answer.teamId === teamId)
    )

    // Utiliser le système de validation centralisé pour l'attribution
    const assignmentValidation = validateTeamAnswerAssignment(
      questionId,
      answerIndex,
      teamId,
      state.teams,
      filteredTeamAnswers, // Utiliser la liste filtrée pour permettre les mises à jour
      currentQuestion.value.answers.length
    )

    if (!assignmentValidation.isValid) {
      state.error = assignmentValidation.errors[0]
      return false
    }

    // Supprimer toute réponse existante de cette équipe pour cette question
    state.teamAnswers = filteredTeamAnswers

    // Ajouter la nouvelle réponse
    const teamAnswer: TeamAnswer = {
      questionId,
      teamId,
      answerIndex,
      isCorrect: answerIndex === currentQuestion.value.correctAnswer
    }

    state.teamAnswers.push(teamAnswer)

    // Mettre à jour les assignations courantes
    const currentAssignments = state.currentQuestionTeamAssignments.get(answerIndex) || []
    if (!currentAssignments.includes(teamId)) {
      currentAssignments.push(teamId)
      state.currentQuestionTeamAssignments.set(answerIndex, currentAssignments)
    }

    // Supprimer cette équipe des autres réponses pour cette question
    state.currentQuestionTeamAssignments.forEach((teamIds, otherAnswerIndex) => {
      if (otherAnswerIndex !== answerIndex) {
        const filteredTeamIds = teamIds.filter(id => id !== teamId)
        if (filteredTeamIds.length === 0) {
          state.currentQuestionTeamAssignments.delete(otherAnswerIndex)
        } else {
          state.currentQuestionTeamAssignments.set(otherAnswerIndex, filteredTeamIds)
        }
      }
    })

    state.error = undefined
    return true
  }

  function answerQuestionAsParticipant(answerIndex: number): void {
    // Participant mode has no answer interaction - this function does nothing
    return
  }

  function proceedToNextQuestion(): boolean {
    if (state.userMode === 'host') {
      // Utiliser le système de validation centralisé pour vérifier les assignations
      const assignmentValidation = validateAllTeamsAssigned(
        currentQuestion.value?.id || '',
        state.teams,
        state.teamAnswers
      )

      if (!assignmentValidation.isValid) {
        state.error = assignmentValidation.errors[0]
        return false
      }
    }

    if (hasNextQuestion.value) {
      state.currentQuestionIndex++
      // Réinitialiser les assignations pour la nouvelle question
      state.currentQuestionTeamAssignments.clear()
      return true
    } else {
      // Quiz terminé
      completeQuiz()
      return false
    }
  }

  function getTeamById(teamId: string): Team | undefined {
    return state.teams.find(team => team.id === teamId)
  }

  function getTeamAnswersForQuestion(questionId: string): TeamAnswer[] {
    return state.teamAnswers.filter(answer => answer.questionId === questionId)
  }

  function validateTeamConfiguration(): boolean {
    // Utiliser le système de validation centralisé
    const configValidation = validateQuizStartConfiguration(
      state.teams,
      state.userMode,
      state.questions
    )

    if (!configValidation.isValid) {
      state.error = configValidation.errors[0]
      return false
    }

    state.error = undefined
    return true
  }

  // Actions de persistance des équipes
  function saveTeamsToStorage(): boolean {
    if (!isLocalStorageAvailable.value) {
      return false
    }
    
    return LocalStorageManager.saveTeamData(state.teams)
  }

  function loadTeamsFromStorage(): boolean {
    if (!isLocalStorageAvailable.value) {
      return false
    }
    
    const teamData = LocalStorageManager.getTeamData()
    if (teamData.teams.length > 0) {
      state.teams = [...teamData.teams]
      return true
    }
    
    return false
  }

  function saveCurrentSession(): boolean {
    if (!isLocalStorageAvailable.value) {
      return false
    }
    
    return LocalStorageManager.saveTeamSession(
      state.teams,
      state.teamAnswers,
      state.currentQuestionIndex,
      state.userMode
    )
  }

  function loadLastUsedTeams(): Team[] {
    if (!isLocalStorageAvailable.value) {
      return []
    }
    
    return LocalStorageManager.getLastUsedTeams()
  }

  function saveLastUsedTeams(): boolean {
    if (!isLocalStorageAvailable.value || state.teams.length === 0) {
      return false
    }
    
    return LocalStorageManager.saveLastUsedTeams(state.teams)
  }

  function getAvailableTeamColors(): string[] {
    if (!isLocalStorageAvailable.value) {
      return ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
    }
    
    return LocalStorageManager.getTeamColors()
  }

  function hasInterruptedSession(): boolean {
    if (!isLocalStorageAvailable.value) {
      return false
    }
    
    return LocalStorageManager.hasInterruptedSession()
  }

  function restoreInterruptedSession(): boolean {
    if (!isLocalStorageAvailable.value) {
      return false
    }
    
    try {
      const sessionData = LocalStorageManager.restoreInterruptedSession()
      if (!sessionData) {
        return false
      }

      // Valider les données de session avant de les restaurer
      const sessionValidation = validateSessionData(sessionData)
      
      if (!sessionValidation.isValid) {
        console.warn('Session corrompue détectée, tentative de réparation:', sessionValidation.errors)
        
        // Essayer de réparer les données de session
        const repairedData = repairSessionData(sessionData)
        const repairedValidation = validateSessionData(repairedData)
        
        if (!repairedValidation.isValid) {
          state.error = MODE_VALIDATION_MESSAGES.SESSION_CORRUPTED
          return false
        }
        
        // Utiliser les données réparées
        state.teams = [...repairedData.teams]
        state.teamAnswers = [...repairedData.teamAnswers]
        state.currentQuestionIndex = repairedData.currentQuestionIndex
        state.userMode = repairedData.userMode
        
        console.info('Session réparée avec succès')
        return true
      }
      
      // Restaurer les données valides
      state.teams = [...sessionData.teams]
      state.teamAnswers = [...sessionData.teamAnswers]
      state.currentQuestionIndex = sessionData.currentQuestionIndex
      state.userMode = sessionData.userMode
      
      return true
      
    } catch (error) {
      console.error('Erreur lors de la restauration de session:', error)
      state.error = MODE_VALIDATION_MESSAGES.SESSION_CORRUPTED
      return false
    }
  }

  function clearInterruptedSession(): boolean {
    if (!isLocalStorageAvailable.value) {
      return false
    }
    
    return LocalStorageManager.clearTeamSession()
  }

  function autoSaveSession(): void {
    if (state.userMode === 'host' && state.teams.length > 0) {
      saveCurrentSession()
    }
  }

  // Fonctions de gestion des erreurs de mode
  function handleModeError(error: any): void {
    console.error('Erreur de mode détectée:', error)
    
    // Essayer de basculer vers un mode sûr
    const fallbackMode = 'participant'
    const modeValidation = validateUserMode(fallbackMode)
    
    if (modeValidation.isValid) {
      console.info(`Basculement vers le mode ${fallbackMode} pour récupération`)
      state.userMode = fallbackMode
      state.teamAnswers = []
      state.currentQuestionTeamAssignments.clear()
    }
    
    state.error = MODE_VALIDATION_MESSAGES.MODE_SWITCH_ERROR
  }

  function validateCurrentState(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Valider le mode utilisateur actuel
    const modeValidation = validateUserMode(state.userMode)
    if (!modeValidation.isValid) {
      errors.push(...modeValidation.errors)
    }

    // Valider la compatibilité mode/données
    const compatibilityValidation = validateModeCompatibility(
      state.userMode, 
      state.teams, 
      state.teamAnswers
    )
    if (!compatibilityValidation.isValid) {
      errors.push(...compatibilityValidation.errors)
    }
    warnings.push(...(compatibilityValidation.warnings || []))

    // Valider la configuration des équipes si en mode animateur
    if (state.userMode === 'host') {
      const teamValidation = validateTeamList(state.teams)
      if (!teamValidation.isValid) {
        errors.push(...teamValidation.errors)
      }
      warnings.push(...(teamValidation.warnings || []))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  function recoverFromCorruptedState(): boolean {
    try {
      console.warn('Tentative de récupération d\'un état corrompu')
      
      // Créer un état par défaut
      const defaultSessionData = createDefaultSessionData('participant')
      
      // Essayer de préserver les questions si elles sont valides
      if (state.questions && state.questions.length > 0) {
        defaultSessionData.currentQuestionIndex = Math.min(
          state.currentQuestionIndex, 
          state.questions.length - 1
        )
      }

      // Essayer de préserver les équipes valides
      if (state.teams && state.teams.length > 0) {
        const validTeams = state.teams.filter(team => {
          const validation = validateTeam(team)
          return validation.isValid
        })
        
        if (validTeams.length > 0) {
          defaultSessionData.teams = validTeams
          defaultSessionData.userMode = 'host'
        }
      }

      // Appliquer l'état réparé
      state.userMode = defaultSessionData.userMode
      state.teams = [...defaultSessionData.teams]
      state.teamAnswers = [...defaultSessionData.teamAnswers]
      state.currentQuestionIndex = defaultSessionData.currentQuestionIndex
      state.currentQuestionTeamAssignments.clear()
      
      console.info('État récupéré avec succès')
      return true
      
    } catch (error) {
      console.error('Échec de la récupération d\'état:', error)
      return false
    }
  }

  function testAllModeScenarios(): { [key: string]: ValidationResult } {
    const results: { [key: string]: ValidationResult } = {}

    // Tester le mode participant
    results.participant = validateModeCompatibility('participant', [], [])

    // Tester le mode animateur avec équipes
    results.hostWithTeams = validateModeCompatibility('host', state.teams, state.teamAnswers)

    // Tester le mode animateur sans équipes
    results.hostWithoutTeams = validateModeCompatibility('host', [], [])

    // Tester la configuration actuelle
    results.currentState = validateCurrentState()

    return results
  }

  // Fonction utilitaire pour obtenir une question par ID
  function getQuestionById(id: string): Question | undefined {
    return state.questions.find(q => q.id === id)
  }

  // Fonction pour obtenir les questions par catégorie
  function getQuestionsByCategory(category: string): Question[] {
    return state.questions.filter(q => q.category === category)
  }

  // Fonction pour obtenir les questions par difficulté
  function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Question[] {
    return state.questions.filter(q => q.difficulty === difficulty)
  }

  // Actions de persistance
  function saveQuizResult(): boolean {
    if (!state.isCompleted || !state.endTime) {
      console.warn('Tentative de sauvegarde d\'un quiz non terminé')
      return false
    }

    const timeSpent = Math.round((state.endTime.getTime() - state.startTime.getTime()) / 1000)
    const success = LocalStorageManager.saveQuizResult(state.score, state.questions.length, timeSpent)
    
    if (success) {
      // Mettre à jour les données persistées locales
      persistedData.value = LocalStorageManager.getQuizData()
    }
    
    return success
  }

  function saveUserPreferences(preferences: UserPreferences): boolean {
    const success = LocalStorageManager.saveUserPreferences(preferences)
    
    if (success) {
      userPreferences.value = preferences
    }
    
    return success
  }

  function loadQuestionsFromCache(): boolean {
    const cache = LocalStorageManager.getQuestionCache()
    
    if (cache && cache.questions.length > 0) {
      state.questions = [...cache.questions]
      resetQuiz()
      return true
    }
    
    return false
  }

  async function loadQuestionsWithCache(): Promise<void> {
    try {
      state.isLoading = true
      state.error = undefined
      
      // Essayer de charger depuis le cache d'abord
      if (loadQuestionsFromCache()) {
        state.isLoading = false
        return
      }
      
      // Si pas de cache, charger depuis JSON et mettre en cache
      await loadQuestionsFromJSON()
      
      if (state.questions.length > 0 && isLocalStorageAvailable.value) {
        LocalStorageManager.saveQuestionCache(state.questions, '1.0')
      }
      
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Erreur lors du chargement des questions'
      console.error('Erreur lors du chargement des questions avec cache:', error)
    } finally {
      state.isLoading = false
    }
  }

  function refreshPersistedData(): void {
    persistedData.value = LocalStorageManager.getQuizData()
    userPreferences.value = LocalStorageManager.getUserPreferences()
  }

  function resetAllData(): boolean {
    const success = LocalStorageManager.resetAllData()
    
    if (success) {
      refreshPersistedData()
    }
    
    return success
  }

  function exportData(): string {
    return LocalStorageManager.exportData()
  }

  function importData(jsonData: string): boolean {
    const success = LocalStorageManager.importData(jsonData)
    
    if (success) {
      refreshPersistedData()
    }
    
    return success
  }

  function getStorageInfo(): { size: number; available: boolean } {
    return {
      size: LocalStorageManager.getStorageSize(),
      available: LocalStorageManager.isAvailable()
    }
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
    
    // Getters calculés pour les équipes
    teamScores,
    teamRankings,
    participantScore,
    handleModeError,
    validateCurrentState,
    recoverFromCorruptedState,
    testAllModeScenarios,
    canProceedToNextQuestion,
    questionResults,
    
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
    
    // Actions de gestion des équipes
    createTeam,
    editTeam,
    deleteTeam,
    setUserMode,
    assignAnswerToTeam,
    answerQuestionAsParticipant,
    proceedToNextQuestion,
    getTeamById,
    getTeamAnswersForQuestion,
    validateTeamConfiguration,
    
    // Actions de persistance
    saveQuizResult,
    saveUserPreferences,
    loadQuestionsFromCache,
    loadQuestionsWithCache,
    refreshPersistedData,
    resetAllData,
    exportData,
    importData,
    getStorageInfo,
    
    // Actions de persistance des équipes
    saveTeamsToStorage,
    loadTeamsFromStorage,
    saveCurrentSession,
    loadLastUsedTeams,
    saveLastUsedTeams,
    getAvailableTeamColors,
    hasInterruptedSession,
    restoreInterruptedSession,
    clearInterruptedSession,
    autoSaveSession,
    
    // Fonctions utilitaires
    getQuestionById,
    getQuestionsByCategory,
    getQuestionsByDifficulty
  }
})