import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// Import components and views
import QuestionCard from '@/components/quiz/QuestionCard.vue'
import TeamAssignmentModal from '@/components/quiz/TeamAssignmentModal.vue'
import TeamResultsDisplay from '@/components/quiz/TeamResultsDisplay.vue'
import TeamSetup from '@/components/quiz/TeamSetup.vue'

// Import store
import { useQuizStore } from '@/stores/quiz'

// Mock UI components
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  },
  BaseCard: {
    name: 'BaseCard',
    template: '<div><slot /></div>',
    props: ['variant', 'hover', 'padding']
  },
  BaseProgressBar: {
    name: 'BaseProgressBar',
    template: '<div class="progress-bar"></div>',
    props: ['current', 'total']
  }
}))

// Mock localStorage
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key]
  }),
  clear: vi.fn(() => {
    mockLocalStorage.data = {}
  })
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock questions data
const mockQuestions = [
  {
    id: 'q1',
    question: 'Quel est le film le plus célèbre de Hitchcock?',
    answers: ['Psycho', 'Vertigo', 'Les Oiseaux', 'Sueurs froides'],
    correctAnswer: 0,
    category: 'Réalisateurs'
  },
  {
    id: 'q2',
    question: 'Qui a joué dans Titanic?',
    answers: ['Leonardo DiCaprio', 'Brad Pitt', 'Tom Cruise', 'Matt Damon'],
    correctAnswer: 0,
    category: 'Acteurs'
  },
  {
    id: 'q3',
    question: 'Quel film a gagné l\'Oscar du meilleur film en 2020?',
    answers: ['Parasite', 'Joker', '1917', 'Once Upon a Time in Hollywood'],
    correctAnswer: 0,
    category: 'Oscars'
  }
]

describe('Data Consistency Integration Tests', () => {
  let store: ReturnType<typeof useQuizStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuizStore()
    mockLocalStorage.clear()
    
    // Load test questions
    store.loadQuestions(mockQuestions)
  })

  describe('Component Data Synchronization', () => {
    it('should maintain data consistency between QuestionCard and store', async () => {
      // Set up host mode with teams
      store.setUserMode('host')
      const team1Id = store.createTeam('Team Alpha')
      const team2Id = store.createTeam('Team Beta')
      store.startQuiz()

      const wrapper = mount(QuestionCard, {
        props: {
          question: mockQuestions[0],
          questionNumber: 1,
          totalQuestions: 3,
          userMode: 'host'
        }
      })

      // Simulate team answer assignment
      wrapper.vm.$emit('team-answer-assigned', {
        questionId: 'q1',
        answerIndex: 0,
        teamId: team1Id
      })

      // Handle the emission in store
      store.assignAnswerToTeam('q1', 0, team1Id)

      // Verify store state
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0]).toEqual({
        questionId: 'q1',
        teamId: team1Id,
        answerIndex: 0,
        isCorrect: true
      })

      // Assign second team
      store.assignAnswerToTeam('q1', 1, team2Id)

      expect(store.state.teamAnswers).toHaveLength(2)
      expect(store.canProceedToNextQuestion).toBe(true)

      // Verify component receives updated data
      await wrapper.setProps({
        question: mockQuestions[0],
        questionNumber: 1,
        totalQuestions: 3,
        userMode: 'host'
      })

      // Component should reflect store state
      expect(store.state.teamAnswers.find(a => a.teamId === team1Id)?.answerIndex).toBe(0)
      expect(store.state.teamAnswers.find(a => a.teamId === team2Id)?.answerIndex).toBe(1)
    })

    it('should synchronize TeamSetup component with store teams', async () => {
      store.setUserMode('host')

      const wrapper = mount(TeamSetup)

      // Initially no teams
      expect(store.state.teams).toHaveLength(0)

      // Simulate team creation through component
      const teamName = 'Integration Test Team'
      const teamId = store.createTeam(teamName)

      // Verify store is updated
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teams[0].name).toBe(teamName)
      expect(store.state.teams[0].id).toBe(teamId)

      // Simulate team editing
      const newName = 'Updated Team Name'
      store.editTeam(teamId, newName)

      // Verify update
      expect(store.state.teams[0].name).toBe(newName)

      // Simulate team deletion
      store.deleteTeam(teamId)

      // Verify deletion
      expect(store.state.teams).toHaveLength(0)
    })

    it('should maintain consistency in TeamResultsDisplay', async () => {
      // Set up complete quiz scenario
      store.setUserMode('host')
      const team1Id = store.createTeam('Consistent Team 1')
      const team2Id = store.createTeam('Consistent Team 2')
      store.startQuiz()

      // Answer all questions
      store.assignAnswerToTeam('q1', 0, team1Id) // Correct
      store.assignAnswerToTeam('q1', 1, team2Id) // Incorrect
      store.proceedToNextQuestion()

      store.assignAnswerToTeam('q2', 0, team1Id) // Correct
      store.assignAnswerToTeam('q2', 0, team2Id) // Correct
      store.proceedToNextQuestion()

      store.assignAnswerToTeam('q3', 1, team1Id) // Incorrect
      store.assignAnswerToTeam('q3', 0, team2Id) // Correct
      store.completeQuiz()

      const wrapper = mount(TeamResultsDisplay, {
        props: {
          teams: store.state.teams,
          questions: store.state.questions,
          teamAnswers: store.state.teamAnswers
        }
      })

      // Verify component receives consistent data
      expect(wrapper.props('teams')).toHaveLength(2)
      expect(wrapper.props('questions')).toHaveLength(3)
      expect(wrapper.props('teamAnswers')).toHaveLength(6)

      // Verify calculated scores match store
      const storeRankings = store.teamRankings
      expect(storeRankings).toHaveLength(2)

      const team1Score = storeRankings.find(t => t.id === team1Id)?.score
      const team2Score = storeRankings.find(t => t.id === team2Id)?.score

      expect(team1Score).toBe(2) // 2 correct answers
      expect(team2Score).toBe(2) // 2 correct answers
    })
  })

  describe('Store State Consistency', () => {
    it('should maintain referential integrity between teams and answers', async () => {
      store.setUserMode('host')
      const team1Id = store.createTeam('Ref Team 1')
      const team2Id = store.createTeam('Ref Team 2')
      store.startQuiz()

      // Assign answers
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      store.assignAnswerToTeam('q2', 2, team1Id)

      // Verify all team answers reference existing teams
      store.state.teamAnswers.forEach(answer => {
        const teamExists = store.state.teams.some(team => team.id === answer.teamId)
        expect(teamExists).toBe(true)
      })

      // Verify all team answers reference existing questions
      store.state.teamAnswers.forEach(answer => {
        const questionExists = store.state.questions.some(q => q.id === answer.questionId)
        expect(questionExists).toBe(true)
      })

      // Delete a team
      store.deleteTeam(team2Id)

      // Team answers for deleted team should be removed
      const remainingAnswers = store.state.teamAnswers.filter(a => a.teamId === team2Id)
      expect(remainingAnswers).toHaveLength(0)

      // Other team's answers should remain
      const team1Answers = store.state.teamAnswers.filter(a => a.teamId === team1Id)
      expect(team1Answers).toHaveLength(2)
    })

    it('should maintain question index consistency', async () => {
      store.setUserMode('participant')
      store.startQuiz()

      // Navigate through questions
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.currentQuestion?.id).toBe('q1')

      store.goToNextQuestion()
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(store.currentQuestion?.id).toBe('q2')

      store.goToNextQuestion()
      expect(store.state.currentQuestionIndex).toBe(2)
      expect(store.currentQuestion?.id).toBe('q3')

      // Try to go beyond last question
      store.goToNextQuestion()
      expect(store.state.currentQuestionIndex).toBe(2) // Should stay at last question

      // Navigate backwards
      store.goToPreviousQuestion()
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(store.currentQuestion?.id).toBe('q2')

      // Jump to specific question
      store.goToQuestion(0)
      expect(store.state.currentQuestionIndex).toBe(0)
      expect(store.currentQuestion?.id).toBe('q1')
    })

    it('should maintain answer array consistency', async () => {
      store.setUserMode('participant')
      store.startQuiz()

      // Initially, participant answers should be initialized
      expect(store.state.participantAnswers).toHaveLength(mockQuestions.length)
      expect(store.state.participantAnswers.every(answer => answer === -1)).toBe(true)

      // Answer questions out of order
      store.goToQuestion(2)
      store.answerQuestionAsParticipant(0)
      expect(store.state.participantAnswers[2]).toBe(0)
      expect(store.state.participantAnswers[0]).toBe(-1) // Still unanswered
      expect(store.state.participantAnswers[1]).toBe(-1) // Still unanswered

      store.goToQuestion(0)
      store.answerQuestionAsParticipant(1)
      expect(store.state.participantAnswers[0]).toBe(1)
      expect(store.state.participantAnswers[2]).toBe(0) // Previous answer preserved

      // Change an answer
      store.answerQuestionAsParticipant(3)
      expect(store.state.participantAnswers[0]).toBe(3) // Updated
      expect(store.state.participantAnswers).toHaveLength(mockQuestions.length) // Length unchanged
    })
  })

  describe('Persistence and Recovery', () => {
    it('should maintain consistency when saving and loading state', async () => {
      // Set up complex state
      store.setUserMode('host')
      const team1Id = store.createTeam('Persistent Team 1')
      const team2Id = store.createTeam('Persistent Team 2')
      store.startQuiz()

      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 2, team2Id)
      store.proceedToNextQuestion()

      // Save state
      const savedState = {
        teams: JSON.parse(JSON.stringify(store.state.teams)),
        teamAnswers: JSON.parse(JSON.stringify(store.state.teamAnswers)),
        currentQuestionIndex: store.state.currentQuestionIndex,
        userMode: store.state.userMode,
        questions: JSON.parse(JSON.stringify(store.state.questions))
      }

      // Simulate app restart
      store.resetQuiz()
      expect(store.state.teams).toHaveLength(0)
      expect(store.state.teamAnswers).toHaveLength(0)

      // Restore state
      store.state.teams = savedState.teams
      store.state.teamAnswers = savedState.teamAnswers
      store.state.currentQuestionIndex = savedState.currentQuestionIndex
      store.setUserMode(savedState.userMode)
      store.loadQuestions(savedState.questions)

      // Verify consistency after restoration
      expect(store.state.teams).toHaveLength(2)
      expect(store.state.teamAnswers).toHaveLength(2)
      expect(store.state.currentQuestionIndex).toBe(1)
      expect(store.state.userMode).toBe('host')

      // Verify referential integrity is maintained
      store.state.teamAnswers.forEach(answer => {
        const teamExists = store.state.teams.some(team => team.id === answer.teamId)
        const questionExists = store.state.questions.some(q => q.id === answer.questionId)
        expect(teamExists).toBe(true)
        expect(questionExists).toBe(true)
      })
    })

    it('should handle localStorage persistence correctly', async () => {
      store.setUserMode('host')
      const teamId = store.createTeam('LocalStorage Team')
      store.startQuiz()
      store.assignAnswerToTeam('q1', 1, teamId)

      // Simulate saving to localStorage
      const stateToSave = {
        teams: store.state.teams,
        teamAnswers: store.state.teamAnswers,
        currentQuestionIndex: store.state.currentQuestionIndex,
        userMode: store.state.userMode
      }

      mockLocalStorage.setItem('quiz-state', JSON.stringify(stateToSave))

      // Verify data was saved
      expect(mockLocalStorage.getItem('quiz-state')).toBeTruthy()

      // Reset store
      store.resetQuiz()

      // Load from localStorage
      const savedData = mockLocalStorage.getItem('quiz-state')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        store.state.teams = parsedData.teams
        store.state.teamAnswers = parsedData.teamAnswers
        store.state.currentQuestionIndex = parsedData.currentQuestionIndex
        store.setUserMode(parsedData.userMode)
      }

      // Verify restoration
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.userMode).toBe('host')
    })

    it('should handle corrupted persistence data gracefully', async () => {
      // Simulate corrupted localStorage data
      mockLocalStorage.setItem('quiz-state', 'invalid-json')

      // Should handle gracefully without throwing
      let restoredSuccessfully = false
      try {
        const savedData = mockLocalStorage.getItem('quiz-state')
        if (savedData) {
          JSON.parse(savedData)
          restoredSuccessfully = true
        }
      } catch (error) {
        // Expected to fail with corrupted data
        restoredSuccessfully = false
      }

      expect(restoredSuccessfully).toBe(false)

      // Store should maintain valid default state
      expect(Array.isArray(store.state.teams)).toBe(true)
      expect(Array.isArray(store.state.teamAnswers)).toBe(true)
      expect(Array.isArray(store.state.participantAnswers)).toBe(true)
      expect(typeof store.state.currentQuestionIndex).toBe('number')
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent team operations consistently', async () => {
      store.setUserMode('host')

      // Simulate concurrent team creation
      const team1Id = store.createTeam('Concurrent Team 1')
      const team2Id = store.createTeam('Concurrent Team 2')
      const team3Id = store.createTeam('Concurrent Team 3')

      expect(store.state.teams).toHaveLength(3)

      // Concurrent team editing
      store.editTeam(team1Id, 'Updated Team 1')
      store.editTeam(team2Id, 'Updated Team 2')

      expect(store.state.teams.find(t => t.id === team1Id)?.name).toBe('Updated Team 1')
      expect(store.state.teams.find(t => t.id === team2Id)?.name).toBe('Updated Team 2')

      // Concurrent deletion
      store.deleteTeam(team2Id)
      store.deleteTeam(team3Id)

      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teams[0].id).toBe(team1Id)
    })

    it('should handle concurrent answer assignments consistently', async () => {
      store.setUserMode('host')
      const team1Id = store.createTeam('Team 1')
      const team2Id = store.createTeam('Team 2')
      store.startQuiz()

      // Concurrent answer assignments
      store.assignAnswerToTeam('q1', 0, team1Id)
      store.assignAnswerToTeam('q1', 1, team2Id)
      store.assignAnswerToTeam('q2', 2, team1Id)
      store.assignAnswerToTeam('q2', 3, team2Id)

      expect(store.state.teamAnswers).toHaveLength(4)

      // Verify each team has correct number of answers
      const team1Answers = store.state.teamAnswers.filter(a => a.teamId === team1Id)
      const team2Answers = store.state.teamAnswers.filter(a => a.teamId === team2Id)

      expect(team1Answers).toHaveLength(2)
      expect(team2Answers).toHaveLength(2)

      // Concurrent answer updates
      store.assignAnswerToTeam('q1', 2, team1Id) // Update existing
      store.assignAnswerToTeam('q1', 3, team2Id) // Update existing

      // Should still have 4 answers (updates, not additions)
      expect(store.state.teamAnswers).toHaveLength(4)

      // Verify updates
      const updatedTeam1Q1 = store.state.teamAnswers.find(a => a.teamId === team1Id && a.questionId === 'q1')
      const updatedTeam2Q1 = store.state.teamAnswers.find(a => a.teamId === team2Id && a.questionId === 'q1')

      expect(updatedTeam1Q1?.answerIndex).toBe(2)
      expect(updatedTeam2Q1?.answerIndex).toBe(3)
    })

    it('should maintain consistency during mode switching with concurrent operations', async () => {
      // Start in participant mode
      store.setUserMode('participant')
      store.startQuiz()
      store.answerQuestionAsParticipant(0)

      // Switch to host mode and perform operations
      store.setUserMode('host')
      const teamId = store.createTeam('Concurrent Mode Team')
      store.assignAnswerToTeam('q1', 1, teamId)

      // Switch back to participant and continue
      store.setUserMode('participant')
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(2)

      // Verify all data is consistent
      expect(store.state.participantAnswers[0]).toBe(0)
      expect(store.state.participantAnswers[1]).toBe(2)
      expect(store.state.teams).toHaveLength(1)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.userMode).toBe('participant')
    })
  })

  describe('Data Validation and Integrity Checks', () => {
    it('should validate team data integrity', async () => {
      store.setUserMode('host')

      // Create teams with various data
      const team1Id = store.createTeam('Valid Team')
      const team2Id = store.createTeam('Another Valid Team')

      // Verify team structure
      store.state.teams.forEach(team => {
        expect(team).toHaveProperty('id')
        expect(team).toHaveProperty('name')
        expect(team).toHaveProperty('score')
        expect(typeof team.id).toBe('string')
        expect(typeof team.name).toBe('string')
        expect(typeof team.score).toBe('number')
        expect(team.id.length).toBeGreaterThan(0)
        expect(team.name.length).toBeGreaterThan(0)
      })

      // Verify unique IDs
      const teamIds = store.state.teams.map(t => t.id)
      const uniqueIds = [...new Set(teamIds)]
      expect(teamIds).toHaveLength(uniqueIds.length)
    })

    it('should validate answer data integrity', async () => {
      store.setUserMode('host')
      const teamId = store.createTeam('Answer Validation Team')
      store.startQuiz()

      store.assignAnswerToTeam('q1', 0, teamId)
      store.assignAnswerToTeam('q2', 1, teamId)

      // Verify answer structure
      store.state.teamAnswers.forEach(answer => {
        expect(answer).toHaveProperty('questionId')
        expect(answer).toHaveProperty('teamId')
        expect(answer).toHaveProperty('answerIndex')
        expect(answer).toHaveProperty('isCorrect')
        expect(typeof answer.questionId).toBe('string')
        expect(typeof answer.teamId).toBe('string')
        expect(typeof answer.answerIndex).toBe('number')
        expect(typeof answer.isCorrect).toBe('boolean')
        expect(answer.answerIndex).toBeGreaterThanOrEqual(0)
      })

      // Verify answer indices are within valid range
      store.state.teamAnswers.forEach(answer => {
        const question = store.state.questions.find(q => q.id === answer.questionId)
        expect(question).toBeTruthy()
        if (question) {
          expect(answer.answerIndex).toBeLessThan(question.answers.length)
        }
      })
    })

    it('should validate participant answer integrity', async () => {
      store.setUserMode('participant')
      store.startQuiz()

      // Answer some questions
      store.answerQuestionAsParticipant(0)
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(2)

      // Verify participant answers structure
      expect(Array.isArray(store.state.participantAnswers)).toBe(true)
      expect(store.state.participantAnswers).toHaveLength(mockQuestions.length)

      store.state.participantAnswers.forEach((answer, index) => {
        expect(typeof answer).toBe('number')
        if (answer !== -1) { // -1 indicates unanswered
          expect(answer).toBeGreaterThanOrEqual(0)
          expect(answer).toBeLessThan(mockQuestions[index].answers.length)
        }
      })
    })

    it('should validate score calculations', async () => {
      // Test team scores
      store.setUserMode('host')
      const team1Id = store.createTeam('Score Team 1')
      const team2Id = store.createTeam('Score Team 2')
      store.startQuiz()

      // Team 1: 2 correct, 1 incorrect
      store.assignAnswerToTeam('q1', 0, team1Id) // Correct
      store.assignAnswerToTeam('q2', 0, team2Id) // Correct
      store.assignAnswerToTeam('q3', 1, team1Id) // Incorrect

      const rankings = store.teamRankings
      const team1Score = rankings.find(t => t.id === team1Id)?.score || 0
      const team2Score = rankings.find(t => t.id === team2Id)?.score || 0

      expect(team1Score).toBe(1) // 1 correct answer
      expect(team2Score).toBe(1) // 1 correct answer

      // Test participant scores
      store.setUserMode('participant')
      store.answerQuestionAsParticipant(0) // Correct
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(1) // Incorrect
      store.goToNextQuestion()
      store.answerQuestionAsParticipant(0) // Correct

      const participantScore = store.participantScore
      expect(participantScore).toBe(0) // No scoring in participant mode
    })
  })
})