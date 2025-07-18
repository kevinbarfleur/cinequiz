import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../quiz'
import type { Question, UserPreferences } from '@/types'
import { LocalStorageManager } from '@/utils/localStorage'

// Mock du fichier JSON
vi.mock('@/data/quiz-questions.json', () => ({
  default: {
    metadata: {
      title: 'Test Quiz',
      version: '1.0',
      totalQuestions: 2,
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
      bestTime: 0,
      preferences: {
        theme: 'auto',
        soundEnabled: true,
        animationsEnabled: true,
        language: 'fr'
      }
    })),
    getUserPreferences: vi.fn(() => ({
      theme: 'auto',
      soundEnabled: true,
      animationsEnabled: true,
      language: 'fr'
    })),
    saveQuizResult: vi.fn(() => true),
    saveUserPreferences: vi.fn(() => true),
    getQuestionCache: vi.fn(() => null),
    saveQuestionCache: vi.fn(() => true),
    clearQuestionCache: vi.fn(() => true),
    resetAllData: vi.fn(() => true),
    exportData: vi.fn(() => '{"test": "data"}'),
    importData: vi.fn(() => true),
    getStorageSize: vi.fn(() => 1024)
  }
}))

describe('Quiz Store', () => {
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
      answers: ['Answer X', 'Answer Y'],
      correctAnswer: 1
    },
    {
      id: 'q3',
      question: 'Question 3?',
      answers: ['Answer 1', 'Answer 2', 'Answer 3'],
      correctAnswer: 0
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuizStore()
  })

  describe('Initialisation', () => {
    it('should initialize with default values', () => {
      const store = useQuizStore()
      
      expect(store.state.questions).toEqual([])
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.state.score).toBe(0)
      expect(store.state.answers).toEqual([])
      expect(store.state.isCompleted).toBe(false)
      expect(store.state.isLoading).toBe(false)
      expect(store.state.error).toBeUndefined()
      expect(store.progress).toBe(0)
      expect(store.finalScore).toBe(0)
    })
  })

  describe('Chargement des questions', () => {
    it('should load questions from JSON successfully', async () => {
      const store = useQuizStore()
      
      await store.loadQuestionsFromJSON()
      
      expect(store.state.questions).toHaveLength(2)
      expect(store.state.questions[0].id).toBe('test1')
      expect(store.state.questions[1].id).toBe('test2')
      expect(store.state.isLoading).toBe(false)
      expect(store.state.error).toBeUndefined()
    })

    it('should load questions manually', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        {
          id: 'manual1',
          question: 'Question manuelle?',
          answers: ['A', 'B', 'C', 'D'],
          correctAnswer: 2
        }
      ]

      store.loadQuestions(mockQuestions)
      
      expect(store.state.questions).toEqual(mockQuestions)
      expect(store.currentQuestion).toEqual(mockQuestions[0])
    })

    it('should handle invalid questions array', () => {
      const store = useQuizStore()
      
      store.loadQuestions([])
      expect(store.state.error).toBe('Liste de questions invalide ou vide')
      
      // @ts-ignore - Test avec des données invalides
      store.loadQuestions(null)
      expect(store.state.error).toBe('Liste de questions invalide ou vide')
    })
  })

  describe('Navigation et progression', () => {
    it('should calculate progress correctly', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 },
        { id: 'q2', question: 'Q2?', answers: ['A', 'B'], correctAnswer: 1 },
        { id: 'q3', question: 'Q3?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      expect(store.progress).toBe(0)
      expect(store.progressText).toBe('1/3')

      store.answerQuestion(0)
      expect(store.progress).toBe(33)
      expect(store.progressText).toBe('2/3')

      store.answerQuestion(1)
      expect(store.progress).toBe(67)
      expect(store.progressText).toBe('3/3')
    })

    it('should navigate between questions', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 },
        { id: 'q2', question: 'Q2?', answers: ['A', 'B'], correctAnswer: 1 },
        { id: 'q3', question: 'Q3?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      
      expect(store.hasNextQuestion).toBe(true)
      expect(store.hasPreviousQuestion).toBe(false)
      
      expect(store.goToNextQuestion()).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(store.hasPreviousQuestion).toBe(true)
      
      expect(store.goToPreviousQuestion()).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(0)
      
      expect(store.goToQuestion(2)).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(2)
      expect(store.hasNextQuestion).toBe(false)
    })
  })

  describe('Réponses et score', () => {
    it('should handle correct answers', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      const isCorrect = store.answerQuestion(0)

      expect(isCorrect).toBe(true)
      expect(store.state.score).toBe(1)
      expect(store.finalScore).toBe(100)
      expect(store.state.answers).toEqual([0])
    })

    it('should handle incorrect answers', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      const isCorrect = store.answerQuestion(1)

      expect(isCorrect).toBe(false)
      expect(store.state.score).toBe(0)
      expect(store.finalScore).toBe(0)
      expect(store.state.answers).toEqual([1])
    })

    it('should handle invalid answer index', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      const isCorrect = store.answerQuestion(5)

      expect(isCorrect).toBe(false)
      expect(store.state.error).toBe('Index de réponse invalide')
    })
  })

  describe('Gestion du quiz', () => {
    it('should start quiz correctly', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      const startTime = new Date()
      store.startQuiz()

      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.state.score).toBe(0)
      expect(store.state.answers).toEqual([])
      expect(store.state.isCompleted).toBe(false)
      expect(store.state.startTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime())
    })

    it('should complete quiz when all questions answered', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      expect(store.state.isCompleted).toBe(false)

      store.answerQuestion(0)
      expect(store.state.isCompleted).toBe(true)
      expect(store.state.endTime).toBeDefined()
    })

    it('should reset quiz correctly', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      store.answerQuestion(0)
      
      store.resetQuiz()
      
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.state.score).toBe(0)
      expect(store.state.answers).toEqual([])
      expect(store.state.isCompleted).toBe(false)
      expect(store.state.error).toBeUndefined()
    })

    it('should track quiz started state', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      expect(store.isQuizStarted).toBe(false)

      store.answerQuestion(0)
      expect(store.isQuizStarted).toBe(true)
    })
  })

  describe('Statistiques', () => {
    it('should calculate quiz stats correctly', async () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 },
        { id: 'q2', question: 'Q2?', answers: ['A', 'B'], correctAnswer: 1 }
      ]

      store.loadQuestions(mockQuestions)
      
      // Manually set start time to ensure we have a baseline
      const startTime = new Date()
      store.state.startTime = startTime
      
      // Add a delay to ensure time passes
      await new Promise(resolve => setTimeout(resolve, 100))
      
      store.answerQuestion(0) // Correct - moves to next question
      store.answerQuestion(0) // Incorrect - completes quiz since it's the last question

      // Verify quiz is completed
      expect(store.state.isCompleted).toBe(true)
      expect(store.state.endTime).toBeDefined()

      const stats = store.quizStats
      expect(stats.totalQuestions).toBe(2)
      expect(stats.correctAnswers).toBe(1)
      expect(stats.incorrectAnswers).toBe(1)
      expect(stats.scorePercentage).toBe(50)
      expect(stats.timeSpent).toBeGreaterThanOrEqual(0)
      expect(stats.averageTimePerQuestion).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Fonctions utilitaires', () => {
    it('should find question by ID', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'unique1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 },
        { id: 'unique2', question: 'Q2?', answers: ['A', 'B'], correctAnswer: 1 }
      ]

      store.loadQuestions(mockQuestions)
      
      const found = store.getQuestionById('unique2')
      expect(found).toEqual(mockQuestions[1])
      
      const notFound = store.getQuestionById('nonexistent')
      expect(notFound).toBeUndefined()
    })

    it('should filter questions by category', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0, category: 'Romance' },
        { id: 'q2', question: 'Q2?', answers: ['A', 'B'], correctAnswer: 1, category: 'Comédie' },
        { id: 'q3', question: 'Q3?', answers: ['A', 'B'], correctAnswer: 0, category: 'Romance' }
      ]

      store.loadQuestions(mockQuestions)
      
      const romanceQuestions = store.getQuestionsByCategory('Romance')
      expect(romanceQuestions).toHaveLength(2)
      expect(romanceQuestions[0].id).toBe('q1')
      expect(romanceQuestions[1].id).toBe('q3')
    })

    it('should filter questions by difficulty', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0, difficulty: 'easy' },
        { id: 'q2', question: 'Q2?', answers: ['A', 'B'], correctAnswer: 1, difficulty: 'hard' },
        { id: 'q3', question: 'Q3?', answers: ['A', 'B'], correctAnswer: 0, difficulty: 'easy' }
      ]

      store.loadQuestions(mockQuestions)
      
      const easyQuestions = store.getQuestionsByDifficulty('easy')
      expect(easyQuestions).toHaveLength(2)
      expect(easyQuestions[0].id).toBe('q1')
      expect(easyQuestions[1].id).toBe('q3')
    })
  })

  describe('Gestion des erreurs', () => {
    it('should clear errors', () => {
      const store = useQuizStore()
      
      store.loadQuestions([])
      expect(store.state.error).toBeDefined()
      
      store.clearError()
      expect(store.state.error).toBeUndefined()
    })

    it('should handle start quiz without questions', () => {
      const store = useQuizStore()
      
      store.startQuiz()
      expect(store.state.error).toBe('Aucune question chargée')
    })

    it('should handle answer question without current question', () => {
      const store = useQuizStore()
      
      const result = store.answerQuestion(0)
      expect(result).toBe(false)
      expect(store.state.error).toBe('Aucune question courante disponible')
    })
  })

  describe('Gestion des équipes', () => {
    beforeEach(() => {
      store.resetQuiz()
      store.setUserMode('host')
    })

    describe('Création d\'équipes', () => {
      it('should create a team successfully', () => {
        const teamId = store.createTeam('Les Cinéphiles', '#ff6b6b')
        
        expect(teamId).toBeTruthy()
        expect(store.state.teams).toHaveLength(1)
        expect(store.state.teams[0].name).toBe('Les Cinéphiles')
        expect(store.state.teams[0].color).toBe('#ff6b6b')
        expect(store.state.teams[0].score).toBe(0)
        expect(store.state.error).toBeUndefined()
      })

      it('should create a team without color', () => {
        const teamId = store.createTeam('Team Alpha')
        
        expect(teamId).toBeTruthy()
        expect(store.state.teams[0].color).toBeUndefined()
      })

      it('should reject empty team name', () => {
        const teamId = store.createTeam('')
        
        expect(teamId).toBe('')
        expect(store.state.teams).toHaveLength(0)
        expect(store.state.error).toBe('Le nom de l\'équipe ne peut pas être vide')
      })

      it('should reject team name that is too long', () => {
        const longName = 'A'.repeat(51)
        const teamId = store.createTeam(longName)
        
        expect(teamId).toBe('')
        expect(store.state.teams).toHaveLength(0)
        expect(store.state.error).toBe('Le nom de l\'équipe ne peut pas dépasser 50 caractères')
      })

      it('should reject duplicate team names', () => {
        store.createTeam('Team A')
        const secondTeamId = store.createTeam('Team A')
        
        expect(secondTeamId).toBe('')
        expect(store.state.teams).toHaveLength(1)
        expect(store.state.error).toBe('Une équipe avec ce nom existe déjà')
      })

      it('should reject duplicate team names case insensitive', () => {
        store.createTeam('Team A')
        const secondTeamId = store.createTeam('team a')
        
        expect(secondTeamId).toBe('')
        expect(store.state.teams).toHaveLength(1)
        expect(store.state.error).toBe('Une équipe avec ce nom existe déjà')
      })
    })

    describe('Édition d\'équipes', () => {
      it('should edit team successfully', () => {
        const teamId = store.createTeam('Original Name')
        const success = store.editTeam(teamId, 'New Name', '#00ff00')
        
        expect(success).toBe(true)
        expect(store.state.teams[0].name).toBe('New Name')
        expect(store.state.teams[0].color).toBe('#00ff00')
        expect(store.state.error).toBeUndefined()
      })

      it('should reject editing non-existent team', () => {
        const success = store.editTeam('non-existent', 'New Name')
        
        expect(success).toBe(false)
        expect(store.state.error).toBe('Équipe non trouvée')
      })

      it('should reject empty name when editing', () => {
        const teamId = store.createTeam('Original Name')
        const success = store.editTeam(teamId, '')
        
        expect(success).toBe(false)
        expect(store.state.teams[0].name).toBe('Original Name')
        expect(store.state.error).toBe('Le nom de l\'équipe ne peut pas être vide')
      })

      it('should reject duplicate name when editing', () => {
        const teamId1 = store.createTeam('Team A')
        const teamId2 = store.createTeam('Team B')
        const success = store.editTeam(teamId2, 'Team A')
        
        expect(success).toBe(false)
        expect(store.state.teams[1].name).toBe('Team B')
        expect(store.state.error).toBe('Une équipe avec ce nom existe déjà')
      })
    })

    describe('Suppression d\'équipes', () => {
      it('should delete team successfully', () => {
        const teamId = store.createTeam('Team to Delete')
        const success = store.deleteTeam(teamId)
        
        expect(success).toBe(true)
        expect(store.state.teams).toHaveLength(0)
        expect(store.state.error).toBeUndefined()
      })

      it('should reject deleting non-existent team', () => {
        const success = store.deleteTeam('non-existent')
        
        expect(success).toBe(false)
        expect(store.state.error).toBe('Équipe non trouvée')
      })

      it('should clean up team answers when deleting team', () => {
        store.loadQuestions(mockQuestions)
        const teamId = store.createTeam('Team A')
        
        // Simuler une réponse d'équipe
        store.state.teamAnswers.push({
          questionId: 'q1',
          teamId: teamId,
          answerIndex: 0,
          isCorrect: true
        })
        
        store.deleteTeam(teamId)
        
        expect(store.state.teamAnswers).toHaveLength(0)
      })
    })

    describe('Gestion des modes utilisateur', () => {
      it('should set user mode to host', () => {
        store.setUserMode('host')
        
        expect(store.state.userMode).toBe('host')
      })

      it('should set user mode to participant', () => {
        store.setUserMode('participant')
        
        expect(store.state.userMode).toBe('participant')
      })

      it('should clear team answers when switching to participant mode', () => {
        store.state.teamAnswers.push({
          questionId: 'q1',
          teamId: 'team1',
          answerIndex: 0,
          isCorrect: true
        })
        
        store.setUserMode('participant')
        
        expect(store.state.teamAnswers).toHaveLength(0)
      })
    })

    describe('Attribution des réponses aux équipes', () => {
      beforeEach(() => {
        store.loadQuestions(mockQuestions)
        store.createTeam('Team A')
        store.createTeam('Team B')
      })

      it('should assign answer to team successfully', () => {
        const teamId = store.state.teams[0].id
        const success = store.assignAnswerToTeam('q1', 0, teamId)
        
        expect(success).toBe(true)
        expect(store.state.teamAnswers).toHaveLength(1)
        expect(store.state.teamAnswers[0].teamId).toBe(teamId)
        expect(store.state.teamAnswers[0].answerIndex).toBe(0)
        expect(store.state.teamAnswers[0].isCorrect).toBe(true)
      })

      it('should update existing team answer', () => {
        const teamId = store.state.teams[0].id
        
        store.assignAnswerToTeam('q1', 0, teamId)
        store.assignAnswerToTeam('q1', 1, teamId)
        
        expect(store.state.teamAnswers).toHaveLength(1)
        expect(store.state.teamAnswers[0].answerIndex).toBe(1)
        expect(store.state.teamAnswers[0].isCorrect).toBe(false)
      })

      it('should reject invalid question', () => {
        const teamId = store.state.teams[0].id
        const success = store.assignAnswerToTeam('invalid', 0, teamId)
        
        expect(success).toBe(false)
        expect(store.state.error).toBe('Question courante invalide')
      })

      it('should reject invalid answer index', () => {
        const teamId = store.state.teams[0].id
        const success = store.assignAnswerToTeam('q1', 10, teamId)
        
        expect(success).toBe(false)
        expect(store.state.error).toBe('Index de réponse invalide')
      })

      it('should reject non-existent team', () => {
        const success = store.assignAnswerToTeam('q1', 0, 'non-existent')
        
        expect(success).toBe(false)
        expect(store.state.error).toBe('Équipe non trouvée')
      })
    })

    describe('Réponses en mode participant', () => {
      beforeEach(() => {
        store.loadQuestions(mockQuestions)
        store.setUserMode('participant')
      })

      it('should answer question as participant', () => {
        store.answerQuestionAsParticipant(0)
        
        expect(store.state.participantAnswers[0]).toBe(0)
        expect(store.state.score).toBe(0) // No scoring in participant mode
      })

      it('should handle any answer as participant', () => {
        store.answerQuestionAsParticipant(1)
        
        expect(store.state.participantAnswers[0]).toBe(1)
        expect(store.state.score).toBe(0) // No scoring in participant mode
      })

      it('should reject participant answer in host mode', () => {
        store.setUserMode('host')
        store.answerQuestionAsParticipant(0)
        
        expect(store.state.error).toBe('Cette action n\'est disponible qu\'en mode participant')
      })
    })

    describe('Validation et progression', () => {
      beforeEach(() => {
        store.loadQuestions(mockQuestions)
        store.createTeam('Team A')
        store.createTeam('Team B')
      })

      it('should validate team configuration successfully', () => {
        const isValid = store.validateTeamConfiguration()
        
        expect(isValid).toBe(true)
        expect(store.state.error).toBeUndefined()
      })

      it('should reject empty teams in host mode', () => {
        store.state.teams = []
        const isValid = store.validateTeamConfiguration()
        
        expect(isValid).toBe(false)
        expect(store.state.error).toBe('Au moins une équipe doit être créée pour démarrer le quiz en mode animateur')
      })

      it('should allow proceeding to next question when all teams assigned', () => {
        const team1Id = store.state.teams[0].id
        const team2Id = store.state.teams[1].id
        
        store.assignAnswerToTeam('q1', 0, team1Id)
        store.assignAnswerToTeam('q1', 1, team2Id)
        
        expect(store.canProceedToNextQuestion).toBe(true)
        
        const success = store.proceedToNextQuestion()
        expect(success).toBe(true)
        expect(store.state.currentQuestionIndex).toBe(1)
      })

      it('should prevent proceeding when not all teams assigned', () => {
        const team1Id = store.state.teams[0].id
        store.assignAnswerToTeam('q1', 0, team1Id)
        
        expect(store.canProceedToNextQuestion).toBe(false)
        
        const success = store.proceedToNextQuestion()
        expect(success).toBe(false)
        expect(store.state.error).toBe('Toutes les équipes doivent être assignées avant de passer à la question suivante')
      })
    })

    describe('Calculs de scores et classements', () => {
      beforeEach(() => {
        store.loadQuestions(mockQuestions)
        store.createTeam('Team A')
        store.createTeam('Team B')
        store.createTeam('Team C')
      })

      it('should calculate team scores correctly', () => {
        const team1Id = store.state.teams[0].id
        const team2Id = store.state.teams[1].id
        const team3Id = store.state.teams[2].id
        
        // Team A: 2 bonnes réponses
        store.state.teamAnswers.push(
          { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
          { questionId: 'q2', teamId: team1Id, answerIndex: 1, isCorrect: true }
        )
        
        // Team B: 1 bonne réponse
        store.state.teamAnswers.push(
          { questionId: 'q1', teamId: team2Id, answerIndex: 0, isCorrect: true },
          { questionId: 'q2', teamId: team2Id, answerIndex: 0, isCorrect: false }
        )
        
        // Team C: 0 bonne réponse
        store.state.teamAnswers.push(
          { questionId: 'q1', teamId: team3Id, answerIndex: 1, isCorrect: false }
        )
        
        const scores = store.teamScores
        expect(scores[0].score).toBe(2) // Team A
        expect(scores[1].score).toBe(1) // Team B
        expect(scores[2].score).toBe(0) // Team C
      })

      it('should calculate team rankings correctly', () => {
        const team1Id = store.state.teams[0].id
        const team2Id = store.state.teams[1].id
        const team3Id = store.state.teams[2].id
        
        // Team A: 1 point, Team B: 3 points, Team C: 2 points
        store.state.teamAnswers.push(
          { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
          { questionId: 'q1', teamId: team2Id, answerIndex: 0, isCorrect: true },
          { questionId: 'q2', teamId: team2Id, answerIndex: 1, isCorrect: true },
          { questionId: 'q3', teamId: team2Id, answerIndex: 0, isCorrect: true },
          { questionId: 'q1', teamId: team3Id, answerIndex: 0, isCorrect: true },
          { questionId: 'q2', teamId: team3Id, answerIndex: 1, isCorrect: true }
        )
        
        const rankings = store.teamRankings
        expect(rankings[0].rank).toBe(1) // Team B (3 points)
        expect(rankings[0].score).toBe(3)
        expect(rankings[1].rank).toBe(2) // Team C (2 points)
        expect(rankings[1].score).toBe(2)
        expect(rankings[2].rank).toBe(3) // Team A (1 point)
        expect(rankings[2].score).toBe(1)
      })
    })

    describe('Fonctions utilitaires d\'équipes', () => {
      beforeEach(() => {
        store.loadQuestions(mockQuestions)
        store.createTeam('Team A')
      })

      it('should get team by ID', () => {
        const teamId = store.state.teams[0].id
        const team = store.getTeamById(teamId)
        
        expect(team).toBeDefined()
        expect(team?.name).toBe('Team A')
      })

      it('should return undefined for non-existent team', () => {
        const team = store.getTeamById('non-existent')
        
        expect(team).toBeUndefined()
      })

      it('should get team answers for question', () => {
        const teamId = store.state.teams[0].id
        store.state.teamAnswers.push(
          { questionId: 'q1', teamId: teamId, answerIndex: 0, isCorrect: true },
          { questionId: 'q2', teamId: teamId, answerIndex: 1, isCorrect: false }
        )
        
        const q1Answers = store.getTeamAnswersForQuestion('q1')
        const q2Answers = store.getTeamAnswersForQuestion('q2')
        
        expect(q1Answers).toHaveLength(1)
        expect(q1Answers[0].answerIndex).toBe(0)
        expect(q2Answers).toHaveLength(1)
        expect(q2Answers[0].answerIndex).toBe(1)
      })
    })
  })

  describe('Persistance des équipes', () => {
    beforeEach(() => {
      store.resetQuiz()
      store.setUserMode('host')
    })

    describe('Sauvegarde et chargement des équipes', () => {
      it('should save teams to storage', () => {
        store.createTeam('Team A', '#ff6b6b')
        store.createTeam('Team B', '#4ecdc4')
        
        const success = store.saveTeamsToStorage()
        expect(success).toBe(true)
      })

      it('should load teams from storage', () => {
        // Sauvegarder d'abord des équipes
        store.createTeam('Team A', '#ff6b6b')
        store.createTeam('Team B', '#4ecdc4')
        store.saveTeamsToStorage()
        
        // Réinitialiser l'état
        store.state.teams = []
        
        // Charger depuis le stockage
        const success = store.loadTeamsFromStorage()
        expect(success).toBe(true)
        expect(store.state.teams).toHaveLength(2)
        expect(store.state.teams[0].name).toBe('Team A')
        expect(store.state.teams[1].name).toBe('Team B')
      })

      it('should return false when no teams to load', () => {
        const success = store.loadTeamsFromStorage()
        expect(success).toBe(false)
      })

      it('should save and load last used teams', () => {
        store.createTeam('Recent Team A')
        store.createTeam('Recent Team B')
        
        const success = store.saveLastUsedTeams()
        expect(success).toBe(true)
        
        const lastUsedTeams = store.loadLastUsedTeams()
        expect(lastUsedTeams).toHaveLength(2)
        expect(lastUsedTeams[0].name).toBe('Recent Team A')
        expect(lastUsedTeams[1].name).toBe('Recent Team B')
      })

      it('should get available team colors', () => {
        const colors = store.getAvailableTeamColors()
        expect(colors).toHaveLength(8)
        expect(colors).toContain('#ff6b6b')
        expect(colors).toContain('#4ecdc4')
      })
    })

    describe('Gestion des sessions', () => {
      beforeEach(() => {
        store.loadQuestions(mockQuestions)
        store.createTeam('Team A')
        store.createTeam('Team B')
      })

      it('should save current session', () => {
        const team1Id = store.state.teams[0].id
        const team2Id = store.state.teams[1].id
        
        // Simuler quelques réponses
        store.assignAnswerToTeam('q1', 0, team1Id)
        store.assignAnswerToTeam('q1', 1, team2Id)
        store.proceedToNextQuestion()
        
        const success = store.saveCurrentSession()
        expect(success).toBe(true)
      })

      it('should detect interrupted session', () => {
        // Pas de session au début
        expect(store.hasInterruptedSession()).toBe(false)
        
        // Sauvegarder une session
        store.saveCurrentSession()
        
        // Maintenant il devrait y avoir une session
        expect(store.hasInterruptedSession()).toBe(true)
      })

      it('should restore interrupted session', () => {
        const team1Id = store.state.teams[0].id
        const team2Id = store.state.teams[1].id
        
        // Configurer une session
        store.assignAnswerToTeam('q1', 0, team1Id)
        store.assignAnswerToTeam('q1', 1, team2Id)
        store.proceedToNextQuestion()
        store.saveCurrentSession()
        
        // Réinitialiser l'état
        store.resetQuiz()
        store.state.teams = []
        
        // Restaurer la session
        const success = store.restoreInterruptedSession()
        expect(success).toBe(true)
        expect(store.state.teams).toHaveLength(2)
        expect(store.state.teamAnswers).toHaveLength(2)
        expect(store.state.currentQuestionIndex).toBe(1)
        expect(store.state.userMode).toBe('host')
      })

      it('should clear interrupted session', () => {
        store.saveCurrentSession()
        expect(store.hasInterruptedSession()).toBe(true)
        
        const success = store.clearInterruptedSession()
        expect(success).toBe(true)
        expect(store.hasInterruptedSession()).toBe(false)
      })

      it('should auto-save session in host mode', () => {
        store.setUserMode('host')
        store.createTeam('Auto Save Team')
        
        // Cette fonction devrait sauvegarder automatiquement
        store.autoSaveSession()
        
        expect(store.hasInterruptedSession()).toBe(true)
      })

      it('should not auto-save session in participant mode', () => {
        store.setUserMode('participant')
        
        store.autoSaveSession()
        
        expect(store.hasInterruptedSession()).toBe(false)
      })

      it('should not auto-save session without teams', () => {
        store.setUserMode('host')
        store.state.teams = []
        
        store.autoSaveSession()
        
        expect(store.hasInterruptedSession()).toBe(false)
      })
    })

    describe('Intégration avec les actions d\'équipes', () => {
      it('should auto-save teams when creating team', () => {
        const teamId = store.createTeam('Auto Save Team')
        
        expect(teamId).toBeTruthy()
        
        // Vérifier que les équipes ont été sauvegardées
        const success = store.loadTeamsFromStorage()
        expect(success).toBe(true)
      })

      it('should handle localStorage unavailable gracefully', () => {
        // Simuler localStorage indisponible
        vi.spyOn(store, 'isLocalStorageAvailable', 'get').mockReturnValue(false)
        
        expect(store.saveTeamsToStorage()).toBe(false)
        expect(store.loadTeamsFromStorage()).toBe(false)
        expect(store.saveCurrentSession()).toBe(false)
        expect(store.hasInterruptedSession()).toBe(false)
        expect(store.restoreInterruptedSession()).toBe(false)
        expect(store.clearInterruptedSession()).toBe(false)
        
        const colors = store.getAvailableTeamColors()
        expect(colors).toHaveLength(8) // Couleurs par défaut
      })
    })
  })

  describe('Persistance localStorage', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should initialize with persisted data', () => {
      const store = useQuizStore()
      
      expect(store.persistedData).toBeDefined()
      expect(store.userPreferences).toBeDefined()
      expect(store.bestScore).toBe(0)
      expect(store.totalGamesPlayed).toBe(0)
      expect(store.averageScore).toBe(0)
      expect(store.isLocalStorageAvailable).toBe(true)
    })

    it('should save quiz result automatically when quiz completes', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      store.answerQuestion(0) // This should complete the quiz

      expect(store.state.isCompleted).toBe(true)
      expect(LocalStorageManager.saveQuizResult).toHaveBeenCalled()
    })

    it('should save quiz result manually', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      store.answerQuestion(0)
      
      const success = store.saveQuizResult()
      expect(success).toBe(true)
      expect(LocalStorageManager.saveQuizResult).toHaveBeenCalledWith(1, 1, expect.any(Number))
    })

    it('should not save incomplete quiz result', () => {
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      
      const success = store.saveQuizResult()
      expect(success).toBe(false)
      expect(LocalStorageManager.saveQuizResult).not.toHaveBeenCalled()
    })

    it('should save and retrieve user preferences', () => {
      const store = useQuizStore()
      const newPreferences: UserPreferences = {
        theme: 'dark',
        soundEnabled: false,
        animationsEnabled: true,
        language: 'en'
      }

      const success = store.saveUserPreferences(newPreferences)
      expect(success).toBe(true)
      expect(LocalStorageManager.saveUserPreferences).toHaveBeenCalledWith(newPreferences)
    })

    it('should load questions from cache', () => {
      const mockCachedQuestions = [
        { id: 'cached1', question: 'Cached Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      vi.mocked(LocalStorageManager.getQuestionCache).mockReturnValueOnce({
        questions: mockCachedQuestions,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      })

      const store = useQuizStore()
      const success = store.loadQuestionsFromCache()

      expect(success).toBe(true)
      expect(store.state.questions).toEqual(mockCachedQuestions)
    })

    it('should return false when no cache available', () => {
      const store = useQuizStore()
      const success = store.loadQuestionsFromCache()

      expect(success).toBe(false)
      expect(store.state.questions).toEqual([])
    })

    it('should load questions with cache fallback', async () => {
      const store = useQuizStore()

      // First try cache (should fail), then load from JSON
      await store.loadQuestionsWithCache()

      expect(LocalStorageManager.getQuestionCache).toHaveBeenCalled()
      expect(store.state.questions).toHaveLength(2) // From mocked JSON
      expect(LocalStorageManager.saveQuestionCache).toHaveBeenCalledWith(store.state.questions, '1.0')
    })

    it('should refresh persisted data', () => {
      const store = useQuizStore()
      
      store.refreshPersistedData()
      
      expect(LocalStorageManager.getQuizData).toHaveBeenCalled()
      expect(LocalStorageManager.getUserPreferences).toHaveBeenCalled()
    })

    it('should reset all data', () => {
      const store = useQuizStore()
      
      const success = store.resetAllData()
      
      expect(success).toBe(true)
      expect(LocalStorageManager.resetAllData).toHaveBeenCalled()
    })

    it('should export data', () => {
      const store = useQuizStore()
      
      const exportedData = store.exportData()
      
      expect(exportedData).toBe('{"test": "data"}')
      expect(LocalStorageManager.exportData).toHaveBeenCalled()
    })

    it('should import data', () => {
      const store = useQuizStore()
      const testData = '{"test": "imported data"}'
      
      const success = store.importData(testData)
      
      expect(success).toBe(true)
      expect(LocalStorageManager.importData).toHaveBeenCalledWith(testData)
    })

    it('should get storage info', () => {
      const store = useQuizStore()
      
      const info = store.getStorageInfo()
      
      expect(info).toEqual({
        size: 1024,
        available: true
      })
    })

    it('should calculate isNewBestScore correctly', () => {
      const store = useQuizStore()
      
      // Mock a higher best score
      vi.mocked(LocalStorageManager.getQuizData).mockReturnValueOnce({
        bestScore: 50,
        totalGamesPlayed: 1,
        lastPlayedDate: '',
        averageScore: 50,
        bestTime: 120,
        preferences: {
          theme: 'auto',
          soundEnabled: true,
          animationsEnabled: true,
          language: 'fr'
        }
      })

      const storeWithBestScore = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      storeWithBestScore.loadQuestions(mockQuestions)
      storeWithBestScore.answerQuestion(0) // 100% score

      expect(storeWithBestScore.isNewBestScore).toBe(true)
    })

    it('should handle localStorage unavailable', () => {
      vi.mocked(LocalStorageManager.isAvailable).mockReturnValueOnce(false)
      
      const store = useQuizStore()
      const mockQuestions: Question[] = [
        { id: 'q1', question: 'Q1?', answers: ['A', 'B'], correctAnswer: 0 }
      ]

      store.loadQuestions(mockQuestions)
      store.answerQuestion(0) // Complete quiz

      // Should not attempt to save when localStorage is unavailable
      expect(store.isLocalStorageAvailable).toBe(false)
    })

    it('should handle lastPlayedDate correctly', () => {
      const testDate = '2024-01-15T10:30:00.000Z'
      
      vi.mocked(LocalStorageManager.getQuizData).mockReturnValueOnce({
        bestScore: 80,
        totalGamesPlayed: 3,
        lastPlayedDate: testDate,
        averageScore: 75,
        bestTime: 90,
        preferences: {
          theme: 'auto',
          soundEnabled: true,
          animationsEnabled: true,
          language: 'fr'
        }
      })

      const store = useQuizStore()
      
      expect(store.lastPlayedDate).toEqual(new Date(testDate))
    })

    it('should handle empty lastPlayedDate', () => {
      const store = useQuizStore()
      
      expect(store.lastPlayedDate).toBeNull()
    })
  })
})