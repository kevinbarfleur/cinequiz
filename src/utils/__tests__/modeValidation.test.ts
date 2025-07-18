import { describe, it, expect } from 'vitest'
import {
  validateUserMode,
  validateModeCompatibility,
  validateSessionData,
  createDefaultSessionData,
  repairSessionData,
  MODE_VALIDATION_MESSAGES
} from '../teamValidation'
import type { Team, TeamAnswer } from '@/types'

describe('modeValidation', () => {
  // Données de test
  const mockTeams: Team[] = [
    { id: 'team1', name: 'Équipe Alpha', score: 0, color: '#ff0000' },
    { id: 'team2', name: 'Équipe Beta', score: 0, color: '#00ff00' }
  ]

  const mockTeamAnswers: TeamAnswer[] = [
    { questionId: 'q1', teamId: 'team1', answerIndex: 0, isCorrect: true },
    { questionId: 'q1', teamId: 'team2', answerIndex: 1, isCorrect: false }
  ]

  describe('validateUserMode', () => {
    it('should validate correct host mode', () => {
      const result = validateUserMode('host')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate correct participant mode', () => {
      const result = validateUserMode('participant')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid mode string', () => {
      const result = validateUserMode('invalid')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.INVALID_MODE)
    })

    it('should reject null mode', () => {
      const result = validateUserMode(null)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.MODE_REQUIRED)
    })

    it('should reject undefined mode', () => {
      const result = validateUserMode(undefined)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.MODE_REQUIRED)
    })

    it('should reject non-string mode', () => {
      const result = validateUserMode(123)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.INVALID_MODE)
    })
  })

  describe('validateModeCompatibility', () => {
    it('should validate host mode with teams', () => {
      const result = validateModeCompatibility('host', mockTeams, mockTeamAnswers)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject host mode without teams', () => {
      const result = validateModeCompatibility('host', [], [])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.HOST_MODE_REQUIREMENTS)
    })

    it('should validate participant mode without teams', () => {
      const result = validateModeCompatibility('participant', [], [])
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate participant mode with teams', () => {
      const result = validateModeCompatibility('participant', mockTeams, [])
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn about team answers in participant mode', () => {
      const result = validateModeCompatibility('participant', [], mockTeamAnswers)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
    })
  })

  describe('validateSessionData', () => {
    const validSessionData = {
      userMode: 'host' as const,
      teams: mockTeams,
      teamAnswers: mockTeamAnswers,
      currentQuestionIndex: 0,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }

    it('should validate correct session data', () => {
      const result = validateSessionData(validSessionData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject null session data', () => {
      const result = validateSessionData(null)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.SESSION_CORRUPTED)
    })

    it('should reject undefined session data', () => {
      const result = validateSessionData(undefined)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.SESSION_CORRUPTED)
    })

    it('should reject non-object session data', () => {
      const result = validateSessionData('invalid')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.SESSION_CORRUPTED)
    })

    it('should reject session data with invalid mode', () => {
      const invalidData = { ...validSessionData, userMode: 'invalid' }
      const result = validateSessionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.INVALID_MODE)
    })

    it('should warn about invalid question index', () => {
      const invalidData = { ...validSessionData, currentQuestionIndex: -1 }
      const result = validateSessionData(invalidData)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.some(w => w.includes('index de question'))).toBe(true)
    })

    it('should warn about missing timestamp', () => {
      const invalidData = { ...validSessionData, timestamp: undefined }
      const result = validateSessionData(invalidData)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.some(w => w.includes('timestamp'))).toBe(true)
    })

    it('should warn about invalid teams in session', () => {
      const invalidTeams = [
        { id: '', name: '', score: 0 }, // Invalid team
        ...mockTeams
      ]
      const invalidData = { ...validSessionData, teams: invalidTeams }
      const result = validateSessionData(invalidData)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.some(w => w.includes('équipes'))).toBe(true)
    })
  })

  describe('createDefaultSessionData', () => {
    it('should create default host session data', () => {
      const sessionData = createDefaultSessionData('host')
      
      expect(sessionData.userMode).toBe('host')
      expect(sessionData.teams).toEqual([])
      expect(sessionData.teamAnswers).toEqual([])
      expect(sessionData.currentQuestionIndex).toBe(0)
      expect(sessionData.timestamp).toBeDefined()
      expect(sessionData.version).toBe('1.0')
    })

    it('should create default participant session data', () => {
      const sessionData = createDefaultSessionData('participant')
      
      expect(sessionData.userMode).toBe('participant')
      expect(sessionData.teams).toEqual([])
      expect(sessionData.teamAnswers).toEqual([])
      expect(sessionData.currentQuestionIndex).toBe(0)
      expect(sessionData.timestamp).toBeDefined()
      expect(sessionData.version).toBe('1.0')
    })

    it('should create session data with valid timestamp', () => {
      const sessionData = createDefaultSessionData('participant')
      const timestamp = new Date(sessionData.timestamp)
      
      expect(timestamp.getTime()).not.toBeNaN()
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('repairSessionData', () => {
    it('should repair session data with valid mode', () => {
      const corruptedData = {
        userMode: 'host',
        teams: mockTeams,
        currentQuestionIndex: 5,
        invalidField: 'should be ignored'
      }
      
      const repairedData = repairSessionData(corruptedData)
      
      expect(repairedData.userMode).toBe('host')
      expect(repairedData.teams).toEqual(mockTeams)
      expect(repairedData.currentQuestionIndex).toBe(5)
      expect(repairedData.teamAnswers).toEqual([])
      expect(repairedData.timestamp).toBeDefined()
      expect(repairedData.version).toBe('1.0')
    })

    it('should repair session data with invalid mode to participant', () => {
      const corruptedData = {
        userMode: 'invalid',
        teams: mockTeams
      }
      
      const repairedData = repairSessionData(corruptedData)
      
      expect(repairedData.userMode).toBe('participant')
      expect(repairedData.teams).toEqual(mockTeams)
    })

    it('should filter out invalid teams', () => {
      const invalidTeams = [
        { id: '', name: '', score: 0 }, // Invalid team
        mockTeams[0], // Valid team
        { id: 'valid', name: 'Valid Team', score: 0 } // Valid team
      ]
      
      const corruptedData = {
        userMode: 'host',
        teams: invalidTeams
      }
      
      const repairedData = repairSessionData(corruptedData)
      
      expect(repairedData.teams).toHaveLength(2)
      expect(repairedData.teams[0]).toEqual(mockTeams[0])
      expect(repairedData.teams[1].name).toBe('Valid Team')
    })

    it('should handle completely corrupted data', () => {
      const corruptedData = {
        randomField: 'random value',
        anotherField: 123
      }
      
      const repairedData = repairSessionData(corruptedData)
      
      expect(repairedData.userMode).toBe('participant')
      expect(repairedData.teams).toEqual([])
      expect(repairedData.teamAnswers).toEqual([])
      expect(repairedData.currentQuestionIndex).toBe(0)
      expect(repairedData.timestamp).toBeDefined()
      expect(repairedData.version).toBe('1.0')
    })

    it('should handle null/undefined corrupted data', () => {
      const repairedData1 = repairSessionData(null)
      const repairedData2 = repairSessionData(undefined)
      
      expect(repairedData1.userMode).toBe('participant')
      expect(repairedData2.userMode).toBe('participant')
      expect(repairedData1.teams).toEqual([])
      expect(repairedData2.teams).toEqual([])
    })

    it('should preserve valid question index', () => {
      const corruptedData = {
        currentQuestionIndex: 3
      }
      
      const repairedData = repairSessionData(corruptedData)
      
      expect(repairedData.currentQuestionIndex).toBe(3)
    })

    it('should reset invalid question index', () => {
      const corruptedData = {
        currentQuestionIndex: -5
      }
      
      const repairedData = repairSessionData(corruptedData)
      
      expect(repairedData.currentQuestionIndex).toBe(0)
    })
  })

  describe('edge cases and error scenarios', () => {
    it('should handle empty objects gracefully', () => {
      const result = validateSessionData({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.MODE_REQUIRED)
    })

    it('should handle arrays as session data', () => {
      const result = validateSessionData([])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(MODE_VALIDATION_MESSAGES.SESSION_CORRUPTED)
    })

    it('should handle circular references in repair', () => {
      const circularData: any = { userMode: 'host' }
      circularData.self = circularData
      
      expect(() => repairSessionData(circularData)).not.toThrow()
    })
  })

  describe('integration scenarios', () => {
    it('should validate complete workflow from corrupted to repaired', () => {
      const corruptedData = {
        userMode: 'host',
        teams: [
          { id: '', name: '', score: 0 }, // Invalid
          mockTeams[0] // Valid
        ],
        currentQuestionIndex: -1,
        timestamp: null
      }
      
      // Validate corrupted data
      const corruptedValidation = validateSessionData(corruptedData)
      expect(corruptedValidation.isValid).toBe(true) // Should pass but with warnings
      expect(corruptedValidation.warnings!.length).toBeGreaterThan(0)
      
      // Repair the data
      const repairedData = repairSessionData(corruptedData)
      
      // Validate repaired data
      const repairedValidation = validateSessionData(repairedData)
      expect(repairedValidation.isValid).toBe(true)
      expect(repairedValidation.errors).toHaveLength(0)
      
      // Check that repair worked correctly
      expect(repairedData.teams).toHaveLength(1)
      expect(repairedData.currentQuestionIndex).toBe(0)
      expect(repairedData.timestamp).toBeDefined()
    })
  })
})