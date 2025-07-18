import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../quiz'
import type { Question, Team, TeamAnswer } from '@/types'
import { LocalStorageManager } from '@/utils/localStorage'

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
        answers: ['Réponse 1', 'Réponse 2', 'Réponse 3', 'Réponse 4'],
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
    getStorageSize: vi.fn(() => 1024),
    // Team-specific methods
    saveTeamData: vi.fn(() => true),
    getTeamData: vi.fn(() => ({
      teams: [],
      lastUsedTeams: [],
      teamColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
    })),
    loadTeamsFromStorage: vi.fn(() => false),
    saveTeamSession: vi.fn(() => true),
    getTeamSession: vi.fn(() => null),
    clearTeamSession: vi.fn(() => true),
    saveLastUsedTeams: vi.fn(() => true),
    getLastUsedTeams: vi.fn(() => []),
    hasInterruptedSession: vi.fn(() => false),
    restoreInterruptedSession: vi.fn(() => null),
    getTeamColors: vi.fn(() => ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'])
  }
}))

describe('Quiz Store - Team Management', () => {
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
    vi.clearAllMocks()
  })

  describe('Team Creation and Management', () => {
    beforeEach(() => {
      store.setUserMode('host')
    })

    it('should create teams with unique IDs', () => {
      const teamId1 = store.createTeam('Team Alpha')
      const teamId2 = store.createTeam('Team Beta')
      
      expect(teamId1).toBeTruthy()
      expect(teamId2).toBeTruthy()
      expect(teamId1).not.toBe(teamId2)
      expect(store.state.teams).toHaveLength(2)
    })

    it('should create teams with colors', () => {
      const teamId = store.createTeam('Colorful Team', '#ff6b6b')
      
      expect(teamId).toBeTruthy()
      expect(store.state.teams[0].color).toBe('#ff6b6b')
    })

    it('should validate team names during creation', () => {
      // Test empty name
      const emptyTeamId = store.createTeam('')
      expect(emptyTeamId).toBe('')
      expect(store.state.error).toBe('Le nom de l\'équipe ne peut pas être vide')

      // Test too long name
      const longName = 'A'.repeat(51)
      const longTeamId = store.createTeam(longName)
      expect(longTeamId).toBe('')
      expect(store.state.error).toBe('Le nom de l\'équipe ne peut pas dépasser 50 caractères')

      // Test duplicate name
      store.createTeam('Team Alpha')
      const duplicateTeamId = store.createTeam('Team Alpha')
      expect(duplicateTeamId).toBe('')
      expect(store.state.error).toBe('Une équipe avec ce nom existe déjà')
    })

    it('should handle case-insensitive duplicate names', () => {
      store.createTeam('Team Alpha')
      const duplicateTeamId = store.createTeam('team alpha')
      
      expect(duplicateTeamId).toBe('')
      expect(store.state.error).toBe('Une équipe avec ce nom existe déjà')
    })

    it('should trim whitespace from team names', () => {
      const teamId = store.createTeam('  Team Alpha  ')
      
      expect(teamId).toBeTruthy()
      expect(store.state.teams[0].name).toBe('Team Alpha')
    })

    it('should edit team names successfully', () => {
      const teamId = store.createTeam('Original Name')
      const success = store.editTeam(teamId, 'New Name', '#00ff00')
      
      expect(success).toBe(true)
      expect(store.state.teams[0].name).toBe('New Name')
      expect(store.state.teams[0].color).toBe('#00ff00')
      expect(store.state.error).toBeUndefined()
    })

    it('should validate team edits', () => {
      const teamId = store.createTeam('Team Alpha')
      
      // Test empty name
      const emptyResult = store.editTeam(teamId, '')
      expect(emptyResult).toBe(false)
      expect(store.state.error).toBe('Le nom de l\'équipe ne peut pas être vide')

      // Test duplicate name with another team
      store.createTeam('Team Beta')
      const duplicateResult = store.editTeam(teamId, 'Team Beta')
      expect(duplicateResult).toBe(false)
      expect(store.state.error).toBe('Une équipe avec ce nom existe déjà')
    })

    it('should allow editing team to same name', () => {
      const teamId = store.createTeam('Team Alpha')
      const success = store.editTeam(teamId, 'Team Alpha')
      
      expect(success).toBe(true)
      expect(store.state.error).toBeUndefined()
    })

    it('should handle editing non-existent team', () => {
      const success = store.editTeam('non-existent-id', 'New Name')
      
      expect(success).toBe(false)
      expect(store.state.error).toBe('Équipe non trouvée')
    })

    it('should delete teams successfully', () => {
      const teamId = store.createTeam('Team to Delete')
      expect(store.state.teams).toHaveLength(1)
      
      const success = store.deleteTeam(teamId)
      
      expect(success).toBe(true)
      expect(store.state.teams).toHaveLength(0)
      expect(store.state.error).toBeUndefined()
    })

    it('should handle deleting non-existent team', () => {
      const success = store.deleteTeam('non-existent-id')
      
      expect(success).toBe(false)
      expect(store.state.error).toBe('Équipe non trouvée')
    })

    it('should clean up team answers when deleting team', () => {
      store.loadQuestions(mockQuestions)
      const teamId = store.createTeam('Team Alpha')
      
      // Add team answer
      store.state.teamAnswers.push({
        questionId: 'q1',
        teamId: teamId,
        answerIndex: 0,
        isCorrect: true
      })
      
      // Add to current assignments
      store.state.currentQuestionTeamAssignments.set(0, [teamId])
      
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.currentQuestionTeamAssignments.size).toBe(1)
      
      store.deleteTeam(teamId)
      
      expect(store.state.teamAnswers).toHaveLength(0)
      expect(store.state.currentQuestionTeamAssignments.size).toBe(0)
    })
  })

  describe('Team Score Calculations', () => {
    beforeEach(() => {
      store.setUserMode('host')
      store.loadQuestions(mockQuestions)
    })

    it('should calculate team scores correctly', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      const team3Id = store.createTeam('Team Gamma')
      
      // Team Alpha: 2 correct answers
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q2', teamId: team1Id, answerIndex: 1, isCorrect: true }
      )
      
      // Team Beta: 1 correct answer
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team2Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q2', teamId: team2Id, answerIndex: 0, isCorrect: false }
      )
      
      // Team Gamma: 0 correct answers
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team3Id, answerIndex: 1, isCorrect: false }
      )
      
      const scores = store.teamScores
      
      expect(scores).toHaveLength(3)
      expect(scores.find(s => s.id === team1Id)?.score).toBe(2)
      expect(scores.find(s => s.id === team2Id)?.score).toBe(1)
      expect(scores.find(s => s.id === team3Id)?.score).toBe(0)
    })

    it('should calculate team rankings correctly', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      const team3Id = store.createTeam('Team Gamma')
      
      // Team Alpha: 1 point
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true }
      )
      
      // Team Beta: 3 points
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team2Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q2', teamId: team2Id, answerIndex: 1, isCorrect: true },
        { questionId: 'q3', teamId: team2Id, answerIndex: 0, isCorrect: true }
      )
      
      // Team Gamma: 2 points
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team3Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q2', teamId: team3Id, answerIndex: 1, isCorrect: true }
      )
      
      const rankings = store.teamRankings
      
      expect(rankings).toHaveLength(3)
      expect(rankings[0].rank).toBe(1)
      expect(rankings[0].score).toBe(3)
      expect(rankings[0].id).toBe(team2Id)
      
      expect(rankings[1].rank).toBe(2)
      expect(rankings[1].score).toBe(2)
      expect(rankings[1].id).toBe(team3Id)
      
      expect(rankings[2].rank).toBe(3)
      expect(rankings[2].score).toBe(1)
      expect(rankings[2].id).toBe(team1Id)
    })

    it('should handle teams with equal scores in rankings', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      // Both teams: 1 point
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: team2Id, answerIndex: 0, isCorrect: true }
      )
      
      const rankings = store.teamRankings
      
      expect(rankings).toHaveLength(2)
      expect(rankings[0].rank).toBe(1)
      expect(rankings[0].score).toBe(1)
      expect(rankings[1].rank).toBe(2)
      expect(rankings[1].score).toBe(1)
    })
  })

  describe('Team Answer Assignment', () => {
    beforeEach(() => {
      store.setUserMode('host')
      store.loadQuestions(mockQuestions)
    })

    it('should assign answers to teams successfully', () => {
      const teamId = store.createTeam('Team Alpha')
      
      const success = store.assignAnswerToTeam('q1', 0, teamId)
      
      expect(success).toBe(true)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0]).toEqual({
        questionId: 'q1',
        teamId: teamId,
        answerIndex: 0,
        isCorrect: true
      })
      expect(store.state.error).toBeUndefined()
    })

    it('should update existing team answer', () => {
      const teamId = store.createTeam('Team Alpha')
      
      // First assignment
      store.assignAnswerToTeam('q1', 0, teamId)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0].answerIndex).toBe(0)
      
      // Update assignment
      store.assignAnswerToTeam('q1', 1, teamId)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0].answerIndex).toBe(1)
      expect(store.state.teamAnswers[0].isCorrect).toBe(false)
    })

    it('should validate team answer assignments', () => {
      const teamId = store.createTeam('Team Alpha')
      
      // Invalid question
      const invalidQuestionResult = store.assignAnswerToTeam('invalid-q', 0, teamId)
      expect(invalidQuestionResult).toBe(false)
      expect(store.state.error).toBe('Question courante invalide')
      
      // Invalid answer index
      const invalidAnswerResult = store.assignAnswerToTeam('q1', 10, teamId)
      expect(invalidAnswerResult).toBe(false)
      expect(store.state.error).toBe('Index de réponse invalide')
      
      // Non-existent team
      const nonExistentTeamResult = store.assignAnswerToTeam('q1', 0, 'non-existent')
      expect(nonExistentTeamResult).toBe(false)
      expect(store.state.error).toBe('Équipe non trouvée')
    })

    it('should update current question assignments', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      
      const assignments = store.state.currentQuestionTeamAssignments
      expect(assignments.get(0)).toContain(team1Id)
      expect(assignments.get(1)).toContain(team2Id)
    })

    it('should move team from previous answer when reassigning', () => {
      const teamId = store.createTeam('Team Alpha')
      
      // Assign to answer 0
      store.assignAnswerToTeam('q1', 0, teamId)
      expect(store.state.currentQuestionTeamAssignments.get(0)).toContain(teamId)
      
      // Reassign to answer 1
      store.assignAnswerToTeam('q1', 1, teamId)
      expect(store.state.currentQuestionTeamAssignments.get(0)).toBeUndefined()
      expect(store.state.currentQuestionTeamAssignments.get(1)).toContain(teamId)
    })
  })

  describe('Quiz Progression with Teams', () => {
    beforeEach(() => {
      store.setUserMode('host')
      store.loadQuestions(mockQuestions)
    })

    it('should validate all teams assigned before proceeding', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      // Only one team assigned
      store.assignAnswerToTeam('q1', 0, team1Id)
      
      expect(store.canProceedToNextQuestion).toBe(false)
      
      const proceedResult = store.proceedToNextQuestion()
      expect(proceedResult).toBe(false)
      expect(store.state.error).toBe('Toutes les équipes doivent être assignées avant de passer à la question suivante')
    })

    it('should allow proceeding when all teams assigned', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      
      expect(store.canProceedToNextQuestion).toBe(true)
      
      const proceedResult = store.proceedToNextQuestion()
      expect(proceedResult).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(1)
    })

    it('should clear current assignments when proceeding to next question', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      
      expect(store.state.currentQuestionTeamAssignments.size).toBe(2)
      
      store.proceedToNextQuestion()
      
      expect(store.state.currentQuestionTeamAssignments.size).toBe(0)
    })

    it('should complete quiz when reaching last question', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      // Go to last question
      store.state.currentQuestionIndex = 2
      
      store.assignAnswerToTeam('q3', 0, team1Id)
      store.assignAnswerToTeam('q3', 1, team2Id)
      
      const proceedResult = store.proceedToNextQuestion()
      expect(proceedResult).toBe(false)
      expect(store.state.isCompleted).toBe(true)
    })
  })

  describe('User Mode Management', () => {
    it('should set user mode to host', () => {
      const success = store.setUserMode('host')
      
      expect(success).toBe(true)
      expect(store.state.userMode).toBe('host')
      expect(store.state.error).toBeUndefined()
    })

    it('should set user mode to participant', () => {
      const success = store.setUserMode('participant')
      
      expect(success).toBe(true)
      expect(store.state.userMode).toBe('participant')
      expect(store.state.error).toBeUndefined()
    })

    it('should clear team answers when switching to participant mode', () => {
      store.setUserMode('host')
      store.createTeam('Team Alpha')
      
      // Add some team answers
      store.state.teamAnswers.push({
        questionId: 'q1',
        teamId: 'team1',
        answerIndex: 0,
        isCorrect: true
      })
      
      expect(store.state.teamAnswers).toHaveLength(1)
      
      store.setUserMode('participant')
      
      expect(store.state.teamAnswers).toHaveLength(0)
    })

    it('should create default team when switching to host mode without teams', () => {
      store.setUserMode('participant')
      expect(store.state.teams).toHaveLength(0)
      
      const success = store.setUserMode('host')
      
      expect(success).toBe(true)
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teams[0].name).toBe('Équipe 1')
    })

    it('should validate invalid user modes', () => {
      // @ts-ignore - Testing invalid mode
      const success = store.setUserMode('invalid-mode')
      
      expect(success).toBe(false)
      expect(store.state.error).toBe('Le mode utilisateur spécifié est invalide')
    })
  })

  describe('Participant Mode Functionality', () => {
    beforeEach(() => {
      store.setUserMode('participant')
      store.loadQuestions(mockQuestions)
    })

    it('should answer questions as participant', () => {
      store.answerQuestionAsParticipant(0)
      
      expect(store.state.participantAnswers[0]).toBe(0)
      expect(store.state.score).toBe(0) // No scoring in participant mode
    })

    it('should handle any answers as participant', () => {
      store.answerQuestionAsParticipant(1)
      
      expect(store.state.participantAnswers[0]).toBe(1)
      expect(store.state.score).toBe(0) // No scoring in participant mode
    })

    it('should reject participant actions in host mode', () => {
      store.setUserMode('host')
      
      store.answerQuestionAsParticipant(0)
      
      expect(store.state.error).toBe('Cette action n\'est disponible qu\'en mode participant')
    })

    it('should validate participant answers', () => {
      // Invalid answer index
      store.answerQuestionAsParticipant(10)
      expect(store.state.error).toBe('Index de réponse invalide')
    })

    it('should allow free navigation in participant mode', () => {
      expect(store.canProceedToNextQuestion).toBe(true)
      
      const success = store.proceedToNextQuestion()
      expect(success).toBe(true)
      expect(store.state.currentQuestionIndex).toBe(1)
    })
  })

  describe('Team Configuration Validation', () => {
    it('should validate team configuration for host mode', () => {
      store.setUserMode('host')
      store.createTeam('Team Alpha')
      store.loadQuestions(mockQuestions)
      
      const isValid = store.validateTeamConfiguration()
      
      expect(isValid).toBe(true)
      expect(store.state.error).toBeUndefined()
    })

    it('should reject empty teams in host mode', () => {
      store.setUserMode('host')
      store.loadQuestions(mockQuestions)
      
      const isValid = store.validateTeamConfiguration()
      
      expect(isValid).toBe(false)
      expect(store.state.error).toBe('Au moins une équipe doit être créée pour démarrer le quiz en mode animateur')
    })

    it('should validate participant mode without teams', () => {
      store.setUserMode('participant')
      store.loadQuestions(mockQuestions)
      
      const isValid = store.validateTeamConfiguration()
      
      expect(isValid).toBe(true)
      expect(store.state.error).toBeUndefined()
    })
  })

  describe('Utility Functions', () => {
    beforeEach(() => {
      store.setUserMode('host')
    })

    it('should get team by ID', () => {
      const teamId = store.createTeam('Team Alpha')
      
      const team = store.getTeamById(teamId)
      
      expect(team).toBeDefined()
      expect(team?.name).toBe('Team Alpha')
      expect(team?.id).toBe(teamId)
    })

    it('should return undefined for non-existent team', () => {
      const team = store.getTeamById('non-existent')
      
      expect(team).toBeUndefined()
    })

    it('should get team answers for specific question', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: team2Id, answerIndex: 1, isCorrect: false },
        { questionId: 'q2', teamId: team1Id, answerIndex: 1, isCorrect: true }
      )
      
      const q1Answers = store.getTeamAnswersForQuestion('q1')
      const q2Answers = store.getTeamAnswersForQuestion('q2')
      const q3Answers = store.getTeamAnswersForQuestion('q3')
      
      expect(q1Answers).toHaveLength(2)
      expect(q2Answers).toHaveLength(1)
      expect(q3Answers).toHaveLength(0)
    })
  })

  describe('Question Results Generation', () => {
    beforeEach(() => {
      store.setUserMode('host')
      store.loadQuestions(mockQuestions)
    })

    it('should generate question results correctly', () => {
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: team2Id, answerIndex: 1, isCorrect: false },
        { questionId: 'q2', teamId: team1Id, answerIndex: 1, isCorrect: true }
      )
      
      const results = store.questionResults
      
      expect(results).toHaveLength(3)
      
      // Question 1 results
      expect(results[0].questionId).toBe('q1')
      expect(results[0].correctAnswer).toBe(0)
      expect(results[0].teamAnswers).toHaveLength(2)
      expect(results[0].teamAnswers[0].teamName).toBe('Team Alpha')
      expect(results[0].teamAnswers[0].isCorrect).toBe(true)
      expect(results[0].teamAnswers[1].teamName).toBe('Team Beta')
      expect(results[0].teamAnswers[1].isCorrect).toBe(false)
      
      // Question 2 results
      expect(results[1].questionId).toBe('q2')
      expect(results[1].teamAnswers).toHaveLength(1)
      
      // Question 3 results (no answers)
      expect(results[2].questionId).toBe('q3')
      expect(results[2].teamAnswers).toHaveLength(0)
    })

    it('should handle unknown teams in results', () => {
      store.state.teamAnswers.push({
        questionId: 'q1',
        teamId: 'unknown-team',
        answerIndex: 0,
        isCorrect: true
      })
      
      const results = store.questionResults
      
      expect(results[0].teamAnswers[0].teamName).toBe('Équipe inconnue')
    })
  })
})