import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../quiz'
import type { Question } from '@/types'

// Mock du fichier JSON
vi.mock('@/data/quiz-questions.json', () => ({
  default: {
    metadata: {
      title: 'Test Quiz',
      version: '1.0',
      totalQuestions: 3,
      categories: ['Test']
    },
    questions: [
      {
        id: 'test1',
        question: 'Question test 1?',
        answers: ['Réponse A', 'Réponse B', 'Réponse C'],
        correctAnswer: 0,
        category: 'Test',
        difficulty: 'easy'
      },
      {
        id: 'test2',
        question: 'Question test 2?',
        answers: ['Réponse X', 'Réponse Y'],
        correctAnswer: 1,
        category: 'Test',
        difficulty: 'medium'
      },
      {
        id: 'test3',
        question: 'Question test 3?',
        answers: ['Réponse 1', 'Réponse 2', 'Réponse 3'],
        correctAnswer: 2,
        category: 'Test',
        difficulty: 'hard'
      }
    ]
  }
}))

// Mock LocalStorageManager
vi.mock('@/utils/localStorage', () => ({
  LocalStorageManager: {
    isAvailable: vi.fn(() => true),
    getQuizData: vi.fn(() => ({
      bestScore: 0,
      totalGamesPlayed: 0,
      lastPlayedDate: '',
      averageScore: 0,
      bestTime: 0
    })),
    getUserPreferences: vi.fn(() => ({
      theme: 'auto',
      soundEnabled: true,
      animationsEnabled: true,
      language: 'fr'
    })),
    saveTeamData: vi.fn(() => true),
    getTeamData: vi.fn(() => ({ teams: [] })),
    saveTeamSession: vi.fn(() => true),
    getLastUsedTeams: vi.fn(() => []),
    saveLastUsedTeams: vi.fn(() => true),
    getTeamColors: vi.fn(() => ['#ff6b6b', '#4ecdc4', '#45b7d1']),
    hasInterruptedSession: vi.fn(() => false),
    restoreInterruptedSession: vi.fn(() => null),
    clearTeamSession: vi.fn(() => true)
  }
}))

describe('Quiz Store - User Modes', () => {
  let store: ReturnType<typeof useQuizStore>
  
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      question: 'Question 1?',
      answers: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
      correctAnswer: 0
    },
    {
      id: 'q2',
      question: 'Question 2?',
      answers: ['Answer X', 'Answer Y', 'Answer Z'],
      correctAnswer: 1
    },
    {
      id: 'q3',
      question: 'Question 3?',
      answers: ['Answer 1', 'Answer 2', 'Answer 3'],
      correctAnswer: 2
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuizStore()
    store.loadQuestions(mockQuestions)
  })

  describe('Mode Host - Fonctionnalité complète', () => {
    beforeEach(() => {
      const success = store.setUserMode('host')
      if (success) {
        store.createTeam('Équipe Alpha', '#ff6b6b')
        store.createTeam('Équipe Beta', '#4ecdc4')
        store.createTeam('Équipe Gamma', '#45b7d1')
      }
    })

    it('should initialize host mode correctly', () => {
      expect(store.state.userMode).toBe('host')
      expect(store.state.teams).toHaveLength(3)
      expect(store.state.teamAnswers).toHaveLength(0)
      expect(store.canProceedToNextQuestion).toBe(false)
    })

    it('should manage team creation in host mode', () => {
      const initialTeamCount = store.state.teams.length
      const newTeamId = store.createTeam('Équipe Delta', '#96ceb4')
      
      expect(newTeamId).toBeTruthy()
      expect(store.state.teams).toHaveLength(initialTeamCount + 1)
      expect(store.state.teams[initialTeamCount].name).toBe('Équipe Delta')
      expect(store.state.teams[initialTeamCount].color).toBe('#96ceb4')
    })

    it('should assign answers to teams correctly', () => {
      const team1Id = store.state.teams[0].id
      const team2Id = store.state.teams[1].id
      const team3Id = store.state.teams[2].id
      
      // Assigner des réponses pour la première question
      expect(store.assignAnswerToTeam('q1', 0, team1Id)).toBe(true)
      expect(store.assignAnswerToTeam('q1', 1, team2Id)).toBe(true)
      expect(store.assignAnswerToTeam('q1', 2, team3Id)).toBe(true)
      
      expect(store.state.teamAnswers).toHaveLength(3)
      expect(store.canProceedToNextQuestion).toBe(true)
    })

    it('should prevent proceeding without all teams assigned', () => {
      const team1Id = store.state.teams[0].id
      
      // Assigner seulement une équipe
      store.assignAnswerToTeam('q1', 0, team1Id)
      
      expect(store.canProceedToNextQuestion).toBe(false)
      expect(store.proceedToNextQuestion()).toBe(false)
      expect(store.state.error).toBe('Toutes les équipes doivent être assignées avant de passer à la question suivante')
    })

    it('should allow proceeding when all teams are assigned', () => {
      const team1Id = store.state.teams[0].id
      const team2Id = store.state.teams[1].id
      const team3Id = store.state.teams[2].id
      
      // Assigner toutes les équipes
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      store.assignAnswerToTeam('q1', 2, team3Id)
      
      expect(store.canProceedToNextQuestion).toBe(true)
      expect(store.proceedToNextQuestion()).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(1)
    })

    it('should calculate team scores correctly', () => {
      const team1Id = store.state.teams[0].id
      const team2Id = store.state.teams[1].id
      const team3Id = store.state.teams[2].id
      
      // Question 1: Team1 correct, Team2 incorrect, Team3 incorrect
      store.assignAnswerToTeam('q1', 0, team1Id) // Correct
      store.assignAnswerToTeam('q1', 1, team2Id) // Incorrect
      store.assignAnswerToTeam('q1', 2, team3Id) // Incorrect
      store.proceedToNextQuestion()
      
      // Question 2: Team1 incorrect, Team2 correct, Team3 incorrect
      store.assignAnswerToTeam('q2', 0, team1Id) // Incorrect
      store.assignAnswerToTeam('q2', 1, team2Id) // Correct
      store.assignAnswerToTeam('q2', 2, team3Id) // Incorrect
      store.proceedToNextQuestion()
      
      const scores = store.teamScores
      expect(scores[0].score).toBe(1) // Team1: 1 correct
      expect(scores[1].score).toBe(1) // Team2: 1 correct
      expect(scores[2].score).toBe(0) // Team3: 0 correct
    })

    it('should generate team rankings correctly', () => {
      const team1Id = store.state.teams[0].id
      const team2Id = store.state.teams[1].id
      const team3Id = store.state.teams[2].id
      
      // Simuler des scores différents
      store.state.teamAnswers = [
        { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q2', teamId: team1Id, answerIndex: 1, isCorrect: true },
        { questionId: 'q3', teamId: team1Id, answerIndex: 2, isCorrect: true }, // Team1: 3 points
        
        { questionId: 'q1', teamId: team2Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q2', teamId: team2Id, answerIndex: 0, isCorrect: false }, // Team2: 1 point
        
        { questionId: 'q1', teamId: team3Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q2', teamId: team3Id, answerIndex: 1, isCorrect: true } // Team3: 2 points
      ]
      
      const rankings = store.teamRankings
      expect(rankings[0].rank).toBe(1) // Team1 (3 points)
      expect(rankings[0].score).toBe(3)
      expect(rankings[1].rank).toBe(2) // Team3 (2 points)
      expect(rankings[1].score).toBe(2)
      expect(rankings[2].rank).toBe(3) // Team2 (1 point)
      expect(rankings[2].score).toBe(1)
    })

    it('should update team answer when reassigning', () => {
      const team1Id = store.state.teams[0].id
      
      // Première assignation
      store.assignAnswerToTeam('q1', 0, team1Id)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0].answerIndex).toBe(0)
      
      // Réassignation
      store.assignAnswerToTeam('q1', 2, team1Id)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0].answerIndex).toBe(2)
    })

    it('should handle team deletion with cleanup', () => {
      const team1Id = store.state.teams[0].id
      const team2Id = store.state.teams[1].id
      
      // Assigner des réponses
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      
      expect(store.state.teamAnswers).toHaveLength(2)
      
      // Supprimer une équipe
      store.deleteTeam(team1Id)
      
      expect(store.state.teams).toHaveLength(2)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0].teamId).toBe(team2Id)
    })

    it('should validate quiz start configuration', () => {
      expect(store.validateTeamConfiguration()).toBe(true)
      
      // Vider les équipes
      store.state.teams = []
      expect(store.validateTeamConfiguration()).toBe(false)
      expect(store.state.error).toBe('Au moins une équipe doit être créée pour démarrer le quiz en mode animateur')
    })

    it('should generate question results correctly', () => {
      const team1Id = store.state.teams[0].id
      const team2Id = store.state.teams[1].id
      
      store.assignAnswerToTeam('q1', 0, team1Id) // Correct
      store.assignAnswerToTeam('q1', 1, team2Id) // Incorrect
      
      const results = store.questionResults
      expect(results).toHaveLength(3) // 3 questions
      expect(results[0].questionId).toBe('q1')
      expect(results[0].correctAnswer).toBe(0)
      expect(results[0].teamAnswers).toHaveLength(2)
      expect(results[0].teamAnswers[0].isCorrect).toBe(true)
      expect(results[0].teamAnswers[1].isCorrect).toBe(false)
    })
  })

  describe('Mode Participant - Navigation libre', () => {
    beforeEach(() => {
      store.setUserMode('participant')
    })

    it('should initialize participant mode correctly', () => {
      expect(store.state.userMode).toBe('participant')
      expect(store.state.teams).toHaveLength(0)
      expect(store.state.participantAnswers).toHaveLength(0) // No answer tracking
      expect(store.canProceedToNextQuestion).toBe(true) // Always true for participants
    })

    it('should allow free navigation between questions', () => {
      expect(store.state.currentQuestionIndex).toBe(0)
      
      // Naviguer vers la question suivante
      expect(store.goToNextQuestion()).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(1)
      
      // Naviguer vers la question précédente
      expect(store.goToPreviousQuestion()).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(0)
      
      // Naviguer directement vers une question
      expect(store.goToQuestion(2)).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(2)
    })

    it('should handle participant mode correctly', () => {
      // Participant mode has no answer interaction
      store.answerQuestionAsParticipant(0)
      expect(store.state.participantAnswers).toHaveLength(0) // No answer tracking
      expect(store.state.score).toBe(0) // No scoring in participant mode
      
      // Naviguer vers la deuxième question
      store.goToNextQuestion()
      
      // Still no answer interaction
      store.answerQuestionAsParticipant(0)
      expect(store.state.participantAnswers).toHaveLength(0) // Still no answer tracking
      expect(store.state.score).toBe(0) // Still no scoring in participant mode
    })

    it('should allow free navigation without tracking', () => {
      // Navigation in participant mode doesn't track anything
      store.answerQuestionAsParticipant(0) // Does nothing
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(1) // Does nothing
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(2) // Does nothing
      
      // Navigate back - no answers to check
      store.goToPreviousQuestion() // Q2
      expect(store.state.currentQuestionIndex).toBe(1)
      
      store.goToPreviousQuestion() // Q1
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.state.participantAnswers).toHaveLength(0) // No tracking
    })

    it('should do nothing when trying to answer', () => {
      // Participant mode ignores all answer attempts
      store.answerQuestionAsParticipant(0)
      expect(store.state.participantAnswers).toHaveLength(0) // No tracking
      expect(store.state.score).toBe(0) // No scoring in participant mode
      
      // Try again - still nothing
      store.answerQuestionAsParticipant(1)
      expect(store.state.participantAnswers).toHaveLength(0) // Still no tracking
      expect(store.state.score).toBe(0) // Still no scoring in participant mode
    })

    it('should handle navigation boundaries correctly', () => {
      // Au début du quiz
      expect(store.hasPreviousQuestion).toBe(false)
      expect(store.goToPreviousQuestion()).toBe(false)
      
      // Naviguer vers la fin
      store.goToQuestion(2) // Dernière question
      expect(store.hasNextQuestion).toBe(false)
      expect(store.goToNextQuestion()).toBe(false)
    })

    it('should reject invalid navigation', () => {
      expect(store.goToQuestion(-1)).toBe(false)
      expect(store.goToQuestion(10)).toBe(false)
      expect(store.state.currentQuestionIndex).toBe(0) // Unchanged
    })

    it('should not require team assignments', () => {
      expect(store.canProceedToNextQuestion).toBe(true)
      expect(store.proceedToNextQuestion()).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(1)
    })
  })

  describe('Transitions entre modes', () => {
    it('should switch from participant to host mode', () => {
      store.setUserMode('participant')
      expect(store.state.userMode).toBe('participant')
      
      const success = store.setUserMode('host')
      expect(success).toBe(true)
      expect(store.state.userMode).toBe('host')
      expect(store.state.teams).toHaveLength(1) // Default team created
    })

    it('should switch from host to participant mode', () => {
      store.setUserMode('host')
      store.createTeam('Test Team')
      store.assignAnswerToTeam('q1', 0, store.state.teams[0].id)
      
      expect(store.state.teamAnswers).toHaveLength(1)
      
      const success = store.setUserMode('participant')
      expect(success).toBe(true)
      expect(store.state.userMode).toBe('participant')
      expect(store.state.teamAnswers).toHaveLength(0) // Cleared
    })

    it('should clear current question assignments on mode switch', () => {
      store.setUserMode('host')
      store.createTeam('Team A')
      
      // Simuler des assignations courantes
      store.state.currentQuestionTeamAssignments.set(0, ['team1'])
      store.state.currentQuestionTeamAssignments.set(1, ['team2'])
      
      store.setUserMode('participant')
      
      expect(store.state.currentQuestionTeamAssignments.size).toBe(0)
    })

    it('should handle mode validation during switch', () => {
      const success1 = store.setUserMode('invalid' as any)
      expect(success1).toBe(false)
      expect(store.state.error).toBe('Mode utilisateur invalide')
      
      const success2 = store.setUserMode(null as any)
      expect(success2).toBe(false)
      expect(store.state.error).toBe('Mode utilisateur requis')
    })

    it('should preserve questions when switching modes', () => {
      const originalQuestions = [...store.state.questions]
      
      store.setUserMode('host')
      expect(store.state.questions).toEqual(originalQuestions)
      
      store.setUserMode('participant')
      expect(store.state.questions).toEqual(originalQuestions)
    })
  })

  describe('Restrictions d\'accès par mode', () => {
    it('should restrict team management to host mode', () => {
      store.setUserMode('participant')
      
      const teamId = store.createTeam('Test Team')
      expect(teamId).toBe('') // Should fail
      expect(store.state.error).toBeDefined()
    })

    it('should restrict team answer assignment to host mode', () => {
      store.setUserMode('participant')
      
      const success = store.assignAnswerToTeam('q1', 0, 'fake-team-id')
      expect(success).toBe(false)
      expect(store.state.error).toBeDefined()
    })

          it('should restrict participant answers to participant mode', () => {
      store.setUserMode('host')
      store.createTeam('Test Team')
      
      store.answerQuestionAsParticipant(0)
      expect(store.state.error).toBe('Cette action n\'est disponible qu\'en mode participant')
    })

    it('should allow common actions in both modes', () => {
      // Test navigation in both modes
      store.setUserMode('participant')
      expect(store.goToNextQuestion()).toBe(true)
      
      store.setUserMode('host')
      store.createTeam('Test Team')
      expect(store.goToNextQuestion()).toBe(true)
    })

    it('should validate mode compatibility with data', () => {
      store.setUserMode('host')
      store.createTeam('Team A')
      
      // Should be valid
      const validation1 = store.validateCurrentState()
      expect(validation1.isValid).toBe(true)
      
      // Remove teams and validate
      store.state.teams = []
      const validation2 = store.validateCurrentState()
      expect(validation2.isValid).toBe(false)
    })
  })

  describe('Gestion des erreurs de mode', () => {
    it('should handle mode errors gracefully', () => {
      store.setUserMode('host')
      
      // Simuler une erreur de mode
      store.handleModeError(new Error('Test error'))
      
      expect(store.state.userMode).toBe('participant') // Fallback mode
      expect(store.state.teamAnswers).toHaveLength(0)
      expect(store.state.currentQuestionTeamAssignments.size).toBe(0)
    })

    it('should recover from corrupted state', () => {
      // Corrompre l'état
      store.state.userMode = 'invalid' as any
      store.state.teams = [{ id: '', name: '', score: -1 }] as any
      
      const success = store.recoverFromCorruptedState()
      expect(success).toBe(true)
      expect(store.state.userMode).toBe('participant')
      expect(store.state.teams).toHaveLength(0)
    })

    it('should test all mode scenarios', () => {
      const results = store.testAllModeScenarios()
      
      expect(results.participant.isValid).toBe(true)
      expect(results.hostWithoutTeams.isValid).toBe(false)
      expect(results.currentState).toBeDefined()
    })
  })

  describe('Intégration et cohérence', () => {
    it('should maintain data consistency across mode switches', () => {
      // Démarrer en mode participant
      store.setUserMode('participant')
      store.answerQuestionAsParticipant(0)
      const participantScore = store.state.score
      
      // Passer en mode host
      store.setUserMode('host')
      expect(store.state.score).toBe(participantScore) // Score préservé
      
      // Retourner en mode participant
      store.setUserMode('participant')
      expect(store.state.score).toBe(participantScore) // Score toujours préservé
    })

    it('should handle complex workflow scenarios', () => {
      // Workflow complet mode host
      store.setUserMode('host')
      const team1Id = store.createTeam('Team 1')
      const team2Id = store.createTeam('Team 2')
      
      // Première question
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      store.proceedToNextQuestion()
      
      // Deuxième question
      store.assignAnswerToTeam('q2', 1, team1Id)
      store.assignAnswerToTeam('q2', 0, team2Id)
      store.proceedToNextQuestion()
      
      // Vérifier la cohérence des données
      expect(store.state.currentQuestionIndex).toBe(2)
      expect(store.state.teamAnswers).toHaveLength(4)
      expect(store.teamScores[0].score).toBe(1) // Team 1: 1 correct
      expect(store.teamScores[1].score).toBe(0) // Team 2: 0 correct
    })

    it('should preserve question progress across modes', () => {
      // Avancer en mode participant
      store.setUserMode('participant')
      store.goToQuestion(2)
      expect(store.state.currentQuestionIndex).toBe(2)
      
      // Passer en mode host
      store.setUserMode('host')
      expect(store.state.currentQuestionIndex).toBe(2) // Position préservée
    })
  })
})