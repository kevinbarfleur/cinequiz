import { describe, it, expect } from 'vitest'
import {
  validateTeamName,
  validateTeam,
  validateTeamList,
  validateTeamAnswerAssignment,
  validateAllTeamsAssigned,
  validateTeamColor,
  validateQuizStartConfiguration,
  TEAM_VALIDATION_MESSAGES,
  DEFAULT_TEAM_VALIDATION_OPTIONS
} from '../teamValidation'
import type { Team, TeamAnswer } from '@/types'

describe('teamValidation', () => {
  // Données de test
  const mockTeams: Team[] = [
    { id: 'team1', name: 'Équipe Alpha', score: 0, color: '#ff0000' },
    { id: 'team2', name: 'Équipe Beta', score: 0, color: '#00ff00' },
    { id: 'team3', name: 'Équipe Gamma', score: 0, color: '#0000ff' }
  ]

  const mockTeamAnswers: TeamAnswer[] = [
    { questionId: 'q1', teamId: 'team1', answerIndex: 0, isCorrect: true },
    { questionId: 'q1', teamId: 'team2', answerIndex: 1, isCorrect: false }
  ]

  describe('validateTeamName', () => {
    it('should validate a correct team name', () => {
      const result = validateTeamName('Équipe Test', mockTeams)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty team name', () => {
      const result = validateTeamName('', mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.MISSING_NAME)
    })

    it('should reject whitespace-only team name', () => {
      const result = validateTeamName('   ', mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.EMPTY_NAME)
    })

    it('should reject team name that is too long', () => {
      const longName = 'A'.repeat(51)
      const result = validateTeamName(longName, mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.NAME_TOO_LONG(50))
    })

    it('should reject duplicate team name (case insensitive)', () => {
      const result = validateTeamName('équipe alpha', mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.DUPLICATE_NAME('équipe alpha'))
    })

    it('should allow duplicate name when excluding current team', () => {
      const result = validateTeamName('Équipe Alpha', mockTeams, 'team1')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject names with invalid characters', () => {
      const result = validateTeamName('Équipe<script>', mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.INVALID_NAME_FORMAT)
    })

    it('should warn about similar team names', () => {
      const result = validateTeamName('Équipe Alfa', mockTeams)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
    })

    it('should respect custom validation options', () => {
      const options = { minNameLength: 5, maxNameLength: 10 }
      
      const shortResult = validateTeamName('Test', mockTeams, undefined, options)
      expect(shortResult.isValid).toBe(false)
      expect(shortResult.errors).toContain(TEAM_VALIDATION_MESSAGES.NAME_TOO_SHORT(5))
      
      const longResult = validateTeamName('Test très long', mockTeams, undefined, options)
      expect(longResult.isValid).toBe(false)
      expect(longResult.errors).toContain(TEAM_VALIDATION_MESSAGES.NAME_TOO_LONG(10))
    })
  })

  describe('validateTeam', () => {
    it('should validate a complete team', () => {
      const team: Team = { id: 'team4', name: 'Nouvelle Équipe', score: 0, color: '#ff00ff' }
      const result = validateTeam(team, mockTeams)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject team without required fields', () => {
      const incompleteTeam = { name: 'Test' } as Partial<Team>
      const result = validateTeam(incompleteTeam, mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.MISSING_ID)
    })

    it('should reject team with invalid ID format', () => {
      const team = { id: '', name: 'Test', score: 0 } as Team
      const result = validateTeam(team, mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.INVALID_ID_FORMAT)
    })

    it('should warn about missing color', () => {
      const team: Team = { id: 'team4', name: 'Nouvelle Équipe', score: 0 }
      const result = validateTeam(team, mockTeams)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain(TEAM_VALIDATION_MESSAGES.NO_COLOR_ASSIGNED)
    })

    it('should validate team with invalid color', () => {
      const team: Team = { id: 'team4', name: 'Nouvelle Équipe', score: 0, color: 'invalid-color' }
      const result = validateTeam(team, mockTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.INVALID_COLOR_FORMAT)
    })
  })

  describe('validateTeamList', () => {
    it('should validate a correct team list', () => {
      const result = validateTeamList(mockTeams)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty team list', () => {
      const result = validateTeamList([])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.MIN_TEAMS(1))
    })

    it('should reject too many teams', () => {
      const manyTeams = Array.from({ length: 25 }, (_, i) => ({
        id: `team${i}`,
        name: `Équipe ${i}`,
        score: 0
      }))
      const result = validateTeamList(manyTeams)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.MAX_TEAMS(20))
    })

    it('should respect custom team count limits', () => {
      const options = { minTeams: 2, maxTeams: 5 }
      
      const tooFewResult = validateTeamList([mockTeams[0]], options)
      expect(tooFewResult.isValid).toBe(false)
      expect(tooFewResult.errors).toContain(TEAM_VALIDATION_MESSAGES.MIN_TEAMS(2))
      
      const tooManyTeams = Array.from({ length: 6 }, (_, i) => ({
        id: `team${i}`,
        name: `Équipe ${i}`,
        score: 0
      }))
      const tooManyResult = validateTeamList(tooManyTeams, options)
      expect(tooManyResult.isValid).toBe(false)
      expect(tooManyResult.errors).toContain(TEAM_VALIDATION_MESSAGES.MAX_TEAMS(5))
    })

    it('should validate individual teams in the list', () => {
      const teamsWithDuplicate = [
        ...mockTeams,
        { id: 'team4', name: 'Équipe Alpha', score: 0 } // Duplicate name
      ]
      const result = validateTeamList(teamsWithDuplicate)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('Équipe 4'))).toBe(true)
    })
  })

  describe('validateTeamAnswerAssignment', () => {
    it('should validate correct team answer assignment', () => {
      const result = validateTeamAnswerAssignment(
        'q2', 0, 'team1', mockTeams, mockTeamAnswers, 4
      )
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject assignment to non-existent team', () => {
      const result = validateTeamAnswerAssignment(
        'q1', 0, 'nonexistent', mockTeams, mockTeamAnswers, 4
      )
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.TEAM_NOT_FOUND('nonexistent'))
    })

    it('should reject invalid answer index', () => {
      const result = validateTeamAnswerAssignment(
        'q1', 5, 'team1', mockTeams, mockTeamAnswers, 4
      )
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.INVALID_ANSWER_INDEX(5, 4))
    })

    it('should reject duplicate team assignment for same question', () => {
      const result = validateTeamAnswerAssignment(
        'q1', 2, 'team1', mockTeams, mockTeamAnswers, 4
      )
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.DUPLICATE_TEAM_ASSIGNMENT('Équipe Alpha'))
    })
  })

  describe('validateAllTeamsAssigned', () => {
    it('should validate when all teams are assigned', () => {
      const completeAnswers: TeamAnswer[] = [
        { questionId: 'q1', teamId: 'team1', answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: 'team2', answerIndex: 1, isCorrect: false },
        { questionId: 'q1', teamId: 'team3', answerIndex: 2, isCorrect: false }
      ]
      const result = validateAllTeamsAssigned('q1', mockTeams, completeAnswers)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject when some teams are not assigned', () => {
      const result = validateAllTeamsAssigned('q1', mockTeams, mockTeamAnswers)
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Équipe Gamma')
    })

    it('should handle empty team answers', () => {
      const result = validateAllTeamsAssigned('q1', mockTeams, [])
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Équipe Alpha, Équipe Beta, Équipe Gamma')
    })
  })

  describe('validateTeamColor', () => {
    it('should validate correct hex colors', () => {
      const validColors = ['#ff0000', '#00FF00', '#0000ff', '#123', '#ABC']
      
      validColors.forEach(color => {
        const result = validateTeamColor(color)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid color formats', () => {
      const invalidColors = ['red', 'rgb(255,0,0)', '#gg0000', '#12345', 'invalid']
      
      invalidColors.forEach(color => {
        const result = validateTeamColor(color)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.INVALID_COLOR_FORMAT)
      })
    })

    it('should warn about missing color', () => {
      const result = validateTeamColor('')
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain(TEAM_VALIDATION_MESSAGES.NO_COLOR_ASSIGNED)
    })
  })

  describe('validateQuizStartConfiguration', () => {
    const mockQuestions = [
      { id: 'q1', question: 'Test?', answers: ['A', 'B'], correctAnswer: 0 }
    ]

    it('should validate correct host configuration', () => {
      const result = validateQuizStartConfiguration(mockTeams, 'host', mockQuestions)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate participant configuration without teams', () => {
      const result = validateQuizStartConfiguration([], 'participant', mockQuestions)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject host configuration without teams', () => {
      const result = validateQuizStartConfiguration([], 'host', mockQuestions)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(TEAM_VALIDATION_MESSAGES.MIN_TEAMS(1))
    })

    it('should reject configuration without questions', () => {
      const result = validateQuizStartConfiguration(mockTeams, 'host', [])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Aucune question n\'est disponible pour démarrer le quiz')
    })

    it('should accumulate multiple validation errors', () => {
      const invalidTeams = [
        { id: '', name: '', score: 0 }, // Invalid team
        { id: 'team2', name: 'Valid Team', score: 0 }
      ] as Team[]
      
      const result = validateQuizStartConfiguration(invalidTeams, 'host', [])
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => validateTeamName(null as any)).not.toThrow()
      expect(() => validateTeam(null as any)).not.toThrow()
      expect(() => validateTeamList(null as any)).not.toThrow()
    })

    it('should handle empty arrays', () => {
      const result = validateTeamList([])
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should handle teams with missing properties', () => {
      const incompleteTeam = { id: 'test' } as Team
      const result = validateTeam(incompleteTeam)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('performance with large datasets', () => {
    it('should handle large team lists efficiently', () => {
      const largeTeamList = Array.from({ length: 100 }, (_, i) => ({
        id: `team${i}`,
        name: `Équipe ${i}`,
        score: 0,
        color: '#ff0000'
      }))

      const start = performance.now()
      const result = validateTeamList(largeTeamList, { maxTeams: 100 })
      const end = performance.now()

      expect(end - start).toBeLessThan(500) // Should complete in less than 500ms
      expect(result.isValid).toBe(true)
    })
  })
})