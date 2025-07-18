import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStorageManager } from '../localStorage'
import type { UserPreferences, PersistedQuizData, QuestionCache, Team, TeamAnswer } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('LocalStorageManager', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(LocalStorageManager.isAvailable()).toBe(true)
    })

    it('should return false when localStorage throws an error', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available')
      })
      
      expect(LocalStorageManager.isAvailable()).toBe(false)
    })
  })

  describe('saveQuizResult', () => {
    it('should save quiz result correctly for first game', () => {
      const success = LocalStorageManager.saveQuizResult(8, 10, 120)
      
      expect(success).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
      
      const savedData = LocalStorageManager.getQuizData()
      expect(savedData.bestScore).toBe(80)
      expect(savedData.totalGamesPlayed).toBe(1)
      expect(savedData.averageScore).toBe(80)
      expect(savedData.bestTime).toBe(120)
      expect(savedData.lastPlayedDate).toBeTruthy()
    })

    it('should update best score when new score is higher', () => {
      // Premier jeu
      LocalStorageManager.saveQuizResult(6, 10, 150)
      
      // Deuxième jeu avec meilleur score
      LocalStorageManager.saveQuizResult(9, 10, 100)
      
      const savedData = LocalStorageManager.getQuizData()
      expect(savedData.bestScore).toBe(90)
      expect(savedData.totalGamesPlayed).toBe(2)
      expect(savedData.averageScore).toBe(75) // (60 + 90) / 2
      expect(savedData.bestTime).toBe(100)
    })

    it('should not update best score when new score is lower', () => {
      // Premier jeu
      LocalStorageManager.saveQuizResult(9, 10, 120)
      
      // Deuxième jeu avec score plus faible
      LocalStorageManager.saveQuizResult(6, 10, 80)
      
      const savedData = LocalStorageManager.getQuizData()
      expect(savedData.bestScore).toBe(90)
      expect(savedData.bestTime).toBe(80) // Meilleur temps mis à jour
    })
  })

  describe('getUserPreferences', () => {
    it('should return default preferences when none are saved', () => {
      const preferences = LocalStorageManager.getUserPreferences()
      
      expect(preferences).toEqual({
        theme: 'auto',
        soundEnabled: true,
        animationsEnabled: true,
        language: 'fr'
      })
    })

    it('should return saved preferences', () => {
      const customPreferences: UserPreferences = {
        theme: 'dark',
        soundEnabled: false,
        animationsEnabled: true,
        language: 'en'
      }
      
      LocalStorageManager.saveUserPreferences(customPreferences)
      const retrieved = LocalStorageManager.getUserPreferences()
      
      expect(retrieved).toEqual(customPreferences)
    })
  })

  describe('saveUserPreferences', () => {
    it('should save user preferences correctly', () => {
      const preferences: UserPreferences = {
        theme: 'light',
        soundEnabled: false,
        animationsEnabled: false,
        language: 'en'
      }
      
      const success = LocalStorageManager.saveUserPreferences(preferences)
      
      expect(success).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2) // Une fois pour les préférences, une fois pour les données quiz
    })
  })

  describe('Question Cache', () => {
    const mockQuestions = [
      {
        id: 'q1',
        question: 'Test question?',
        answers: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        category: 'Test'
      }
    ]

    it('should save and retrieve question cache', () => {
      const success = LocalStorageManager.saveQuestionCache(mockQuestions, '1.0')
      
      expect(success).toBe(true)
      
      const cache = LocalStorageManager.getQuestionCache()
      expect(cache).toBeTruthy()
      expect(cache!.questions).toEqual(mockQuestions)
      expect(cache!.version).toBe('1.0')
      expect(cache!.lastUpdated).toBeTruthy()
    })

    it('should return null when no cache exists', () => {
      const cache = LocalStorageManager.getQuestionCache()
      expect(cache).toBeNull()
    })

    it('should clear expired cache (older than 24h)', () => {
      // Sauvegarder un cache
      LocalStorageManager.saveQuestionCache(mockQuestions, '1.0')
      
      // Modifier la date de dernière mise à jour pour simuler un cache expiré
      const expiredCache: QuestionCache = {
        questions: mockQuestions,
        lastUpdated: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25h ago
        version: '1.0'
      }
      
      localStorageMock.setItem('quiz-cinema-questions-cache', JSON.stringify(expiredCache))
      
      const cache = LocalStorageManager.getQuestionCache()
      expect(cache).toBeNull()
    })

    it('should clear question cache', () => {
      LocalStorageManager.saveQuestionCache(mockQuestions, '1.0')
      
      const success = LocalStorageManager.clearQuestionCache()
      expect(success).toBe(true)
      
      const cache = LocalStorageManager.getQuestionCache()
      expect(cache).toBeNull()
    })
  })

  describe('Team Data Management', () => {
    const mockTeams: Team[] = [
      { id: 'team-1', name: 'Les Cinéphiles', score: 5, color: '#ff6b6b' },
      { id: 'team-2', name: 'Team Alpha', score: 3 },
      { id: 'team-3', name: 'Movie Masters', score: 7, color: '#4ecdc4' }
    ]

    it('should save and retrieve team data', () => {
      const success = LocalStorageManager.saveTeamData(mockTeams)
      
      expect(success).toBe(true)
      
      const teamData = LocalStorageManager.getTeamData()
      expect(teamData.teams).toEqual(mockTeams)
      expect(teamData.lastUsedTeams).toEqual(mockTeams)
      expect(teamData.teamColors).toHaveLength(8) // Default colors
    })

    it('should return default team data when none exists', () => {
      const teamData = LocalStorageManager.getTeamData()
      
      expect(teamData.teams).toEqual([])
      expect(teamData.lastUsedTeams).toEqual([])
      expect(teamData.teamColors).toHaveLength(8)
    })

    it('should save and retrieve last used teams', () => {
      const success = LocalStorageManager.saveLastUsedTeams(mockTeams)
      
      expect(success).toBe(true)
      
      const lastUsedTeams = LocalStorageManager.getLastUsedTeams()
      expect(lastUsedTeams).toEqual(mockTeams)
    })

    it('should save and retrieve team colors', () => {
      const customColors = ['#ff0000', '#00ff00', '#0000ff']
      const success = LocalStorageManager.saveTeamColors(customColors)
      
      expect(success).toBe(true)
      
      const colors = LocalStorageManager.getTeamColors()
      expect(colors).toEqual(customColors)
    })
  })

  describe('Team Session Management', () => {
    const mockTeams: Team[] = [
      { id: 'team-1', name: 'Team A', score: 2 },
      { id: 'team-2', name: 'Team B', score: 1 }
    ]

    const mockTeamAnswers: TeamAnswer[] = [
      { questionId: 'q1', teamId: 'team-1', answerIndex: 0, isCorrect: true },
      { questionId: 'q1', teamId: 'team-2', answerIndex: 1, isCorrect: false }
    ]

    it('should save and retrieve team session', () => {
      const success = LocalStorageManager.saveTeamSession(
        mockTeams,
        mockTeamAnswers,
        2,
        'host'
      )
      
      expect(success).toBe(true)
      
      const session = LocalStorageManager.getTeamSession()
      expect(session).toBeTruthy()
      expect(session!.teams).toEqual(mockTeams)
      expect(session!.teamAnswers).toEqual(mockTeamAnswers)
      expect(session!.currentQuestionIndex).toBe(2)
      expect(session!.userMode).toBe('host')
      expect(session!.sessionId).toBeTruthy()
      expect(session!.timestamp).toBeTruthy()
    })

    it('should return null when no session exists', () => {
      const session = LocalStorageManager.getTeamSession()
      expect(session).toBeNull()
    })

    it('should clear expired session (older than 24h)', () => {
      // Sauvegarder une session
      LocalStorageManager.saveTeamSession(mockTeams, mockTeamAnswers, 0, 'host')
      
      // Modifier le timestamp pour simuler une session expirée
      const expiredSession = {
        teams: mockTeams,
        teamAnswers: mockTeamAnswers,
        currentQuestionIndex: 0,
        userMode: 'host' as const,
        sessionId: 'test-session',
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25h ago
      }
      
      localStorageMock.setItem('quiz-cinema-team-session', JSON.stringify(expiredSession))
      
      const session = LocalStorageManager.getTeamSession()
      expect(session).toBeNull()
    })

    it('should clear team session', () => {
      LocalStorageManager.saveTeamSession(mockTeams, mockTeamAnswers, 0, 'host')
      
      const success = LocalStorageManager.clearTeamSession()
      expect(success).toBe(true)
      
      const session = LocalStorageManager.getTeamSession()
      expect(session).toBeNull()
    })

    it('should detect interrupted session', () => {
      expect(LocalStorageManager.hasInterruptedSession()).toBe(false)
      
      LocalStorageManager.saveTeamSession(mockTeams, mockTeamAnswers, 1, 'host')
      
      expect(LocalStorageManager.hasInterruptedSession()).toBe(true)
    })

    it('should restore interrupted session', () => {
      LocalStorageManager.saveTeamSession(mockTeams, mockTeamAnswers, 3, 'host')
      
      const restored = LocalStorageManager.restoreInterruptedSession()
      
      expect(restored).toBeTruthy()
      expect(restored!.teams).toEqual(mockTeams)
      expect(restored!.teamAnswers).toEqual(mockTeamAnswers)
      expect(restored!.currentQuestionIndex).toBe(3)
      expect(restored!.userMode).toBe('host')
    })

    it('should return null when no session to restore', () => {
      const restored = LocalStorageManager.restoreInterruptedSession()
      expect(restored).toBeNull()
    })
  })

  describe('resetAllData', () => {
    it('should reset all stored data including team data', () => {
      // Sauvegarder des données
      LocalStorageManager.saveQuizResult(8, 10, 120)
      LocalStorageManager.saveUserPreferences({
        theme: 'dark',
        soundEnabled: false,
        animationsEnabled: true,
        language: 'en'
      })
      LocalStorageManager.saveQuestionCache([{
        id: 'q1',
        question: 'Test?',
        answers: ['A', 'B'],
        correctAnswer: 0
      }], '1.0')
      LocalStorageManager.saveTeamData([
        { id: 'team-1', name: 'Test Team', score: 0 }
      ])
      LocalStorageManager.saveTeamSession(
        [{ id: 'team-1', name: 'Test Team', score: 0 }],
        [],
        0,
        'host'
      )
      
      const success = LocalStorageManager.resetAllData()
      expect(success).toBe(true)
      
      // Vérifier que toutes les données ont été supprimées (5 au lieu de 3)
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(5)
    })
  })

  describe('exportData and importData', () => {
    it('should export and import data correctly', () => {
      // Préparer des données
      LocalStorageManager.saveQuizResult(7, 10, 90)
      LocalStorageManager.saveUserPreferences({
        theme: 'light',
        soundEnabled: true,
        animationsEnabled: false,
        language: 'fr'
      })
      
      // Exporter
      const exportedData = LocalStorageManager.exportData()
      expect(exportedData).toBeTruthy()
      
      // Réinitialiser
      LocalStorageManager.resetAllData()
      
      // Importer
      const success = LocalStorageManager.importData(exportedData)
      expect(success).toBe(true)
      
      // Vérifier que les données ont été restaurées
      const quizData = LocalStorageManager.getQuizData()
      expect(quizData.bestScore).toBe(70)
      
      const preferences = LocalStorageManager.getUserPreferences()
      expect(preferences.theme).toBe('light')
    })

    it('should handle invalid import data', () => {
      const success = LocalStorageManager.importData('invalid json')
      expect(success).toBe(false)
    })
  })

  describe('getStorageSize', () => {
    it('should calculate storage size', () => {
      LocalStorageManager.saveQuizResult(5, 10, 60)
      
      const size = LocalStorageManager.getStorageSize()
      expect(size).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const success = LocalStorageManager.saveQuizResult(8, 10, 120)
      expect(success).toBe(false)
    })

    it('should handle localStorage read errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage read error')
      })
      
      const data = LocalStorageManager.getQuizData()
      expect(data).toEqual({
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
      })
    })
  })
})