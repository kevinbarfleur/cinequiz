import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../quiz'
import type { Team, TeamAnswer } from '@/types'
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

// Mock LocalStorageManager with more detailed team functionality
const mockTeamData = {
  teams: [] as Team[],
  lastUsedTeams: [] as Team[],
  teamColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
}

const mockTeamSession = {
  teams: [] as Team[],
  teamAnswers: [] as TeamAnswer[],
  currentQuestionIndex: 0,
  userMode: 'participant' as const,
  sessionId: 'test-session',
  timestamp: new Date().toISOString()
}

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
    saveTeamData: vi.fn((teams: Team[]) => {
      mockTeamData.teams = [...teams]
      mockTeamData.lastUsedTeams = teams.length > 0 ? [...teams] : mockTeamData.lastUsedTeams
      return true
    }),
    getTeamData: vi.fn(() => ({ ...mockTeamData })),
    loadTeamsFromStorage: vi.fn(() => mockTeamData.teams.length > 0),
    saveTeamSession: vi.fn((teams: Team[], teamAnswers: TeamAnswer[], currentQuestionIndex: number, userMode: 'host' | 'participant') => {
      mockTeamSession.teams = [...teams]
      mockTeamSession.teamAnswers = [...teamAnswers]
      mockTeamSession.currentQuestionIndex = currentQuestionIndex
      mockTeamSession.userMode = userMode
      mockTeamSession.timestamp = new Date().toISOString()
      return true
    }),
    getTeamSession: vi.fn(() => mockTeamSession.teams.length > 0 ? { ...mockTeamSession } : null),
    clearTeamSession: vi.fn(() => {
      mockTeamSession.teams = []
      mockTeamSession.teamAnswers = []
      mockTeamSession.currentQuestionIndex = 0
      mockTeamSession.userMode = 'participant'
      return true
    }),
    saveLastUsedTeams: vi.fn((teams: Team[]) => {
      mockTeamData.lastUsedTeams = [...teams]
      return true
    }),
    getLastUsedTeams: vi.fn(() => [...mockTeamData.lastUsedTeams]),
    hasInterruptedSession: vi.fn(() => mockTeamSession.teams.length > 0),
    restoreInterruptedSession: vi.fn(() => 
      mockTeamSession.teams.length > 0 ? {
        teams: [...mockTeamSession.teams],
        teamAnswers: [...mockTeamSession.teamAnswers],
        currentQuestionIndex: mockTeamSession.currentQuestionIndex,
        userMode: mockTeamSession.userMode
      } : null
    ),
    getTeamColors: vi.fn(() => [...mockTeamData.teamColors])
  }
}))

describe('Quiz Store - Team Persistence', () => {
  let store: ReturnType<typeof useQuizStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuizStore()
    
    // Reset mock data
    mockTeamData.teams = []
    mockTeamData.lastUsedTeams = []
    mockTeamSession.teams = []
    mockTeamSession.teamAnswers = []
    mockTeamSession.currentQuestionIndex = 0
    mockTeamSession.userMode = 'participant'
    
    vi.clearAllMocks()
  })

  describe('Team Data Persistence', () => {
    beforeEach(() => {
      store.setUserMode('host')
    })

    it('should save teams to storage', () => {
      store.createTeam('Team Alpha', '#ff6b6b')
      store.createTeam('Team Beta', '#4ecdc4')
      
      const success = store.saveTeamsToStorage()
      
      expect(success).toBe(true)
      expect(LocalStorageManager.saveTeamData).toHaveBeenCalledWith(store.state.teams)
    })

    it('should load teams from storage', () => {
      // Prepare mock data
      const mockTeams: Team[] = [
        { id: 'team-1', name: 'Saved Team Alpha', score: 0, color: '#ff6b6b' },
        { id: 'team-2', name: 'Saved Team Beta', score: 0, color: '#4ecdc4' }
      ]
      mockTeamData.teams = mockTeams
      
      const success = store.loadTeamsFromStorage()
      
      expect(success).toBe(true)
      expect(store.state.teams).toEqual(mockTeams)
    })

    it('should return false when no teams to load', () => {
      mockTeamData.teams = []
      
      const success = store.loadTeamsFromStorage()
      
      expect(success).toBe(false)
    })

    it('should save and load last used teams', () => {
      store.createTeam('Recent Team A')
      store.createTeam('Recent Team B')
      
      const saveSuccess = store.saveLastUsedTeams()
      expect(saveSuccess).toBe(true)
      
      const lastUsedTeams = store.loadLastUsedTeams()
      expect(lastUsedTeams).toEqual(store.state.teams)
    })

    it('should return empty array when no last used teams', () => {
      mockTeamData.lastUsedTeams = []
      
      const lastUsedTeams = store.loadLastUsedTeams()
      
      expect(lastUsedTeams).toEqual([])
    })

    it('should get available team colors', () => {
      const colors = store.getAvailableTeamColors()
      
      expect(colors).toEqual(mockTeamData.teamColors)
      expect(colors).toHaveLength(8)
    })

    it('should handle localStorage unavailable', () => {
      vi.mocked(LocalStorageManager.isAvailable).mockReturnValue(false)
      
      const saveSuccess = store.saveTeamsToStorage()
      const loadSuccess = store.loadTeamsFromStorage()
      const lastUsedTeams = store.loadLastUsedTeams()
      const colors = store.getAvailableTeamColors()
      
      expect(saveSuccess).toBe(false)
      expect(loadSuccess).toBe(false)
      expect(lastUsedTeams).toEqual([])
      expect(colors).toEqual(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'])
    })
  })

  describe('Team Session Persistence', () => {
    beforeEach(() => {
      store.setUserMode('host')
      store.loadQuestions([
        { id: 'q1', question: 'Test?', answers: ['A', 'B'], correctAnswer: 0 }
      ])
    })

    it('should save current session', () => {
      store.createTeam('Session Team A')
      store.createTeam('Session Team B')
      
      // Add some team answers
      const team1Id = store.state.teams[0].id
      const team2Id = store.state.teams[1].id
      
      store.state.teamAnswers.push(
        { questionId: 'q1', teamId: team1Id, answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: team2Id, answerIndex: 1, isCorrect: false }
      )
      
      store.state.currentQuestionIndex = 1
      
      const success = store.saveCurrentSession()
      
      expect(success).toBe(true)
      expect(LocalStorageManager.saveTeamSession).toHaveBeenCalledWith(
        store.state.teams,
        store.state.teamAnswers,
        1,
        'host'
      )
    })

    it('should not save session when localStorage unavailable', () => {
      vi.mocked(LocalStorageManager.isAvailable).mockReturnValue(false)
      
      const success = store.saveCurrentSession()
      
      expect(success).toBe(false)
    })

    it('should detect interrupted session', () => {
      // No interrupted session initially
      expect(store.hasInterruptedSession()).toBe(false)
      
      // Create mock interrupted session
      mockTeamSession.teams = [
        { id: 'team-1', name: 'Interrupted Team', score: 0 }
      ]
      
      expect(store.hasInterruptedSession()).toBe(true)
    })

    it('should restore interrupted session', () => {
      // Prepare interrupted session
      const interruptedTeams: Team[] = [
        { id: 'team-1', name: 'Interrupted Team A', score: 2 },
        { id: 'team-2', name: 'Interrupted Team B', score: 1 }
      ]
      const interruptedAnswers: TeamAnswer[] = [
        { questionId: 'q1', teamId: 'team-1', answerIndex: 0, isCorrect: true }
      ]
      
      mockTeamSession.teams = interruptedTeams
      mockTeamSession.teamAnswers = interruptedAnswers
      mockTeamSession.currentQuestionIndex = 2
      mockTeamSession.userMode = 'host'
      
      const success = store.restoreInterruptedSession()
      
      expect(success).toBe(true)
      expect(store.state.teams).toEqual(interruptedTeams)
      expect(store.state.teamAnswers).toEqual(interruptedAnswers)
      expect(store.state.currentQuestionIndex).toBe(2)
      expect(store.state.userMode).toBe('host')
    })

    it('should handle corrupted session data', () => {
      // Mock corrupted session that fails validation
      vi.mocked(LocalStorageManager.restoreInterruptedSession).mockReturnValue({
        teams: [{ id: '', name: '', score: 0 }] as Team[], // Invalid team
        teamAnswers: [],
        currentQuestionIndex: -1, // Invalid index
        userMode: 'host'
      })
      
      const success = store.restoreInterruptedSession()
      
      expect(success).toBe(false)
      expect(store.state.error).toBe('La session actuelle est corrompue et doit être réinitialisée')
    })

    it('should repair corrupted session data', () => {
      // Mock session with some valid and some invalid data
      vi.mocked(LocalStorageManager.restoreInterruptedSession).mockReturnValue({
        teams: [
          { id: '', name: '', score: 0 }, // Invalid team
          { id: 'team-2', name: 'Valid Team', score: 1 } // Valid team
        ] as Team[],
        teamAnswers: [],
        currentQuestionIndex: -1, // Invalid index
        userMode: 'host'
      })
      
      const success = store.restoreInterruptedSession()
      
      expect(success).toBe(true)
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teams[0].name).toBe('Valid Team')
      expect(store.state.currentQuestionIndex).toBe(0) // Repaired to valid index
    })

    it('should clear interrupted session', () => {
      mockTeamSession.teams = [{ id: 'team-1', name: 'Test', score: 0 }]
      
      const success = store.clearInterruptedSession()
      
      expect(success).toBe(true)
      expect(LocalStorageManager.clearTeamSession).toHaveBeenCalled()
    })

    it('should auto-save session in host mode', () => {
      store.createTeam('Auto Save Team')
      
      store.autoSaveSession()
      
      expect(LocalStorageManager.saveTeamSession).toHaveBeenCalled()
    })

    it('should not auto-save session in participant mode', () => {
      store.setUserMode('participant')
      
      store.autoSaveSession()
      
      expect(LocalStorageManager.saveTeamSession).not.toHaveBeenCalled()
    })

    it('should not auto-save session without teams', () => {
      // Host mode but no teams
      store.autoSaveSession()
      
      expect(LocalStorageManager.saveTeamSession).not.toHaveBeenCalled()
    })
  })

  describe('Error Recovery and State Validation', () => {
    beforeEach(() => {
      store.setUserMode('host')
    })

    it('should validate current state', () => {
      store.createTeam('Valid Team')
      
      const validation = store.validateCurrentState()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect invalid state', () => {
      // Invalid state: host mode without teams
      store.state.teams = []
      
      const validation = store.validateCurrentState()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should recover from corrupted state', () => {
      // Corrupt the state
      store.state.userMode = 'invalid' as any
      store.state.teams = [{ id: '', name: '', score: 0 }] as Team[]
      
      const success = store.recoverFromCorruptedState()
      
      expect(success).toBe(true)
      expect(store.state.userMode).toBe('participant') // Safe fallback
      expect(store.state.teams).toEqual([]) // Corrupted teams removed
    })

    it('should handle mode errors gracefully', () => {
      const mockError = new Error('Mode error')
      
      store.handleModeError(mockError)
      
      expect(store.state.userMode).toBe('participant') // Fallback mode
      expect(store.state.teamAnswers).toHaveLength(0)
      expect(store.state.currentQuestionTeamAssignments.size).toBe(0)
      expect(store.state.error).toBe('Erreur lors du changement de mode utilisateur')
    })

    it('should test all mode scenarios', () => {
      store.createTeam('Test Team')
      
      const results = store.testAllModeScenarios()
      
      expect(results.participant).toBeDefined()
      expect(results.hostWithTeams).toBeDefined()
      expect(results.hostWithoutTeams).toBeDefined()
      expect(results.currentState).toBeDefined()
      
      expect(results.participant.isValid).toBe(true)
      expect(results.hostWithTeams.isValid).toBe(true)
      expect(results.hostWithoutTeams.isValid).toBe(false)
      expect(results.currentState.isValid).toBe(true)
    })
  })

  describe('Integration with LocalStorage', () => {
    it('should handle localStorage errors during team operations', () => {
      vi.mocked(LocalStorageManager.saveTeamData).mockReturnValue(false)
      
      store.createTeam('Test Team')
      const success = store.saveTeamsToStorage()
      
      expect(success).toBe(false)
    })

    it('should handle localStorage errors during session operations', () => {
      vi.mocked(LocalStorageManager.saveTeamSession).mockReturnValue(false)
      
      store.createTeam('Test Team')
      const success = store.saveCurrentSession()
      
      expect(success).toBe(false)
    })

    it('should handle localStorage read errors gracefully', () => {
      vi.mocked(LocalStorageManager.getTeamData).mockImplementation(() => {
        throw new Error('Storage read error')
      })
      
      // Should not throw and should return false
      const success = store.loadTeamsFromStorage()
      expect(success).toBe(false)
    })

    it('should handle localStorage unavailable scenarios', () => {
      vi.mocked(LocalStorageManager.isAvailable).mockReturnValue(false)
      
      expect(store.saveTeamsToStorage()).toBe(false)
      expect(store.loadTeamsFromStorage()).toBe(false)
      expect(store.saveCurrentSession()).toBe(false)
      expect(store.hasInterruptedSession()).toBe(false)
      expect(store.restoreInterruptedSession()).toBe(false)
      expect(store.clearInterruptedSession()).toBe(false)
      expect(store.saveLastUsedTeams()).toBe(false)
    })
  })

  describe('Team Data Consistency', () => {
    beforeEach(() => {
      store.setUserMode('host')
    })

    it('should maintain team data consistency across operations', () => {
      // Create teams
      const team1Id = store.createTeam('Team Alpha', '#ff6b6b')
      const team2Id = store.createTeam('Team Beta', '#4ecdc4')
      
      // Save to storage
      store.saveTeamsToStorage()
      
      // Verify data was saved correctly
      expect(mockTeamData.teams).toHaveLength(2)
      expect(mockTeamData.teams[0].name).toBe('Team Alpha')
      expect(mockTeamData.teams[1].name).toBe('Team Beta')
      
      // Clear current teams
      store.state.teams = []
      
      // Load from storage
      store.loadTeamsFromStorage()
      
      // Verify data was restored correctly
      expect(store.state.teams).toHaveLength(2)
      expect(store.state.teams[0].name).toBe('Team Alpha')
      expect(store.state.teams[1].name).toBe('Team Beta')
    })

    it('should maintain session data consistency', () => {
      store.loadQuestions([
        { id: 'q1', question: 'Test?', answers: ['A', 'B'], correctAnswer: 0 }
      ])
      
      // Create teams and answers
      const team1Id = store.createTeam('Session Team A')
      const team2Id = store.createTeam('Session Team B')
      
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      
      store.state.currentQuestionIndex = 1
      
      // Save session
      store.saveCurrentSession()
      
      // Clear current state
      store.state.teams = []
      store.state.teamAnswers = []
      store.state.currentQuestionIndex = 0
      
      // Restore session
      const success = store.restoreInterruptedSession()
      
      expect(success).toBe(true)
      expect(store.state.teams).toHaveLength(2)
      expect(store.state.teamAnswers).toHaveLength(2)
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(store.state.userMode).toBe('host')
    })
  })
})