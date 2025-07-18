import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TeamResultsDisplay from '../TeamResultsDisplay.vue'
import { useQuizStore } from '@/stores/quiz'
import type { Team, TeamAnswer, Question } from '@/types'

// Mock the BaseButton component
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :class="variant"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  }
}))

describe('TeamResultsDisplay - Integration Tests', () => {
  let wrapper: any
  let store: any

  const mockQuestions: Question[] = [
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

  const mockTeams: Team[] = [
    { id: 'team-1', name: 'Les Cinéphiles', score: 0, color: '#ff6b6b' },
    { id: 'team-2', name: 'Movie Masters', score: 0, color: '#4ecdc4' },
    { id: 'team-3', name: 'Film Fanatics', score: 0, color: '#45b7d1' }
  ]

  const mockTeamAnswers: TeamAnswer[] = [
    // Question 1: Team 1 and 2 correct, Team 3 incorrect
    { questionId: 'q1', teamId: 'team-1', answerIndex: 0, isCorrect: true },
    { questionId: 'q1', teamId: 'team-2', answerIndex: 0, isCorrect: true },
    { questionId: 'q1', teamId: 'team-3', answerIndex: 1, isCorrect: false },
    
    // Question 2: Only Team 1 correct
    { questionId: 'q2', teamId: 'team-1', answerIndex: 0, isCorrect: true },
    { questionId: 'q2', teamId: 'team-2', answerIndex: 1, isCorrect: false },
    { questionId: 'q2', teamId: 'team-3', answerIndex: 2, isCorrect: false },
    
    // Question 3: Team 2 and 3 correct, Team 1 incorrect
    { questionId: 'q3', teamId: 'team-1', answerIndex: 1, isCorrect: false },
    { questionId: 'q3', teamId: 'team-2', answerIndex: 0, isCorrect: true },
    { questionId: 'q3', teamId: 'team-3', answerIndex: 0, isCorrect: true }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuizStore()
    
    wrapper = mount(TeamResultsDisplay, {
      props: {
        teams: mockTeams,
        questions: mockQuestions,
        teamAnswers: mockTeamAnswers
      }
    })
  })

  describe('Results Display', () => {
    it('should display team rankings correctly', () => {
      const rankings = wrapper.findAll('.team-ranking-item')
      
      expect(rankings).toHaveLength(3)
      
      // Team 1 should be first (2 points)
      expect(rankings[0].text()).toContain('Les Cinéphiles')
      expect(rankings[0].text()).toContain('2 points')
      expect(rankings[0].find('.rank-number').text()).toBe('1')
      
      // Team 2 should be second (2 points, but alphabetically after Team 1)
      expect(rankings[1].text()).toContain('Movie Masters')
      expect(rankings[1].text()).toContain('2 points')
      expect(rankings[1].find('.rank-number').text()).toBe('2')
      
      // Team 3 should be third (1 point)
      expect(rankings[2].text()).toContain('Film Fanatics')
      expect(rankings[2].text()).toContain('1 point')
      expect(rankings[2].find('.rank-number').text()).toBe('3')
    })

    it('should display team colors in rankings', () => {
      const rankings = wrapper.findAll('.team-ranking-item')
      
      expect(rankings[0].find('.team-color').attributes('style')).toContain('#ff6b6b')
      expect(rankings[1].find('.team-color').attributes('style')).toContain('#4ecdc4')
      expect(rankings[2].find('.team-color').attributes('style')).toContain('#45b7d1')
    })

    it('should display percentage scores', () => {
      const rankings = wrapper.findAll('.team-ranking-item')
      
      // Team 1: 2/3 = 67%
      expect(rankings[0].text()).toContain('67%')
      
      // Team 2: 2/3 = 67%
      expect(rankings[1].text()).toContain('67%')
      
      // Team 3: 1/3 = 33%
      expect(rankings[2].text()).toContain('33%')
    })

    it('should show winner badge for first place', () => {
      const firstPlace = wrapper.find('.team-ranking-item')
      
      expect(firstPlace.find('.winner-badge').exists()).toBe(true)
      expect(firstPlace.find('.winner-badge').text()).toContain('🏆')
    })

    it('should not show winner badge for other places', () => {
      const rankings = wrapper.findAll('.team-ranking-item')
      
      expect(rankings[1].find('.winner-badge').exists()).toBe(false)
      expect(rankings[2].find('.winner-badge').exists()).toBe(false)
    })
  })

  describe('Question-by-Question Results', () => {
    it('should display all questions', () => {
      const questionResults = wrapper.findAll('.question-result')
      
      expect(questionResults).toHaveLength(3)
      
      expect(questionResults[0].text()).toContain('Quel est le film le plus célèbre de Hitchcock?')
      expect(questionResults[1].text()).toContain('Qui a joué dans Titanic?')
      expect(questionResults[2].text()).toContain('Quel film a gagné l\'Oscar du meilleur film en 2020?')
    })

    it('should show correct answers for each question', () => {
      const questionResults = wrapper.findAll('.question-result')
      
      expect(questionResults[0].find('.correct-answer').text()).toContain('Psycho')
      expect(questionResults[1].find('.correct-answer').text()).toContain('Leonardo DiCaprio')
      expect(questionResults[2].find('.correct-answer').text()).toContain('Parasite')
    })

    it('should display team answers for each question', () => {
      const questionResults = wrapper.findAll('.question-result')
      
      // Question 1 team answers
      const q1TeamAnswers = questionResults[0].findAll('.team-answer')
      expect(q1TeamAnswers).toHaveLength(3)
      
      // Check correct answers are marked
      expect(q1TeamAnswers[0].classes()).toContain('correct')
      expect(q1TeamAnswers[1].classes()).toContain('correct')
      expect(q1TeamAnswers[2].classes()).toContain('incorrect')
    })

    it('should show team names and their selected answers', () => {
      const questionResults = wrapper.findAll('.question-result')
      const q1TeamAnswers = questionResults[0].findAll('.team-answer')
      
      expect(q1TeamAnswers[0].text()).toContain('Les Cinéphiles')
      expect(q1TeamAnswers[0].text()).toContain('Psycho')
      
      expect(q1TeamAnswers[1].text()).toContain('Movie Masters')
      expect(q1TeamAnswers[1].text()).toContain('Psycho')
      
      expect(q1TeamAnswers[2].text()).toContain('Film Fanatics')
      expect(q1TeamAnswers[2].text()).toContain('Vertigo')
    })
  })

  describe('Statistics and Summary', () => {
    it('should display overall statistics', () => {
      expect(wrapper.find('.stats-summary').exists()).toBe(true)
      expect(wrapper.text()).toContain('3 questions')
      expect(wrapper.text()).toContain('3 équipes')
    })

    it('should calculate and display average score', () => {
      // Average: (2 + 2 + 1) / 3 = 1.67 points per team
      // Percentage: 1.67 / 3 * 100 = 56%
      expect(wrapper.text()).toContain('56%') // Average percentage
    })

    it('should show best performing question', () => {
      // Question 1 and 3 both have 2 correct answers
      // Should show one of them as best performing
      const bestQuestion = wrapper.find('.best-question')
      expect(bestQuestion.exists()).toBe(true)
      expect(bestQuestion.text()).toMatch(/(Question 1|Question 3)/)
    })

    it('should show most challenging question', () => {
      // Question 2 has only 1 correct answer
      const challengingQuestion = wrapper.find('.challenging-question')
      expect(challengingQuestion.exists()).toBe(true)
      expect(challengingQuestion.text()).toContain('Question 2')
    })
  })

  describe('Interactive Features', () => {
    it('should toggle between summary and detailed view', async () => {
      expect(wrapper.find('.detailed-view').exists()).toBe(true)
      
      const toggleButton = wrapper.find('[data-testid="toggle-view"]')
      await toggleButton.trigger('click')
      
      expect(wrapper.find('.summary-view').exists()).toBe(true)
      expect(wrapper.find('.detailed-view').exists()).toBe(false)
    })

    it('should expand/collapse question details', async () => {
      const questionResult = wrapper.find('.question-result')
      const expandButton = questionResult.find('.expand-button')
      
      expect(questionResult.find('.team-answers').classes()).toContain('collapsed')
      
      await expandButton.trigger('click')
      
      expect(questionResult.find('.team-answers').classes()).not.toContain('collapsed')
    })

    it('should filter results by team', async () => {
      const teamFilter = wrapper.find('[data-testid="team-filter"]')
      await teamFilter.setValue('team-1')
      
      const visibleAnswers = wrapper.findAll('.team-answer:not(.hidden)')
      
      // Should only show answers from team-1
      visibleAnswers.forEach(answer => {
        expect(answer.text()).toContain('Les Cinéphiles')
      })
    })
  })

  describe('Export and Actions', () => {
    it('should emit restart event when restart button clicked', async () => {
      const restartButton = wrapper.find('[data-testid="restart-button"]')
      await restartButton.trigger('click')
      
      expect(wrapper.emitted('restart')).toBeTruthy()
    })

    it('should emit home event when home button clicked', async () => {
      const homeButton = wrapper.find('[data-testid="home-button"]')
      await homeButton.trigger('click')
      
      expect(wrapper.emitted('home')).toBeTruthy()
    })

    it('should generate and download results as CSV', async () => {
      const exportButton = wrapper.find('[data-testid="export-csv"]')
      
      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
      const mockClick = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      
      global.URL.createObjectURL = mockCreateObjectURL
      global.document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick
      }))
      global.document.body.appendChild = mockAppendChild
      global.document.body.removeChild = mockRemoveChild
      
      await exportButton.trigger('click')
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
    })

    it('should generate results summary text', () => {
      const summary = wrapper.vm.generateResultsSummary()
      
      expect(summary).toContain('Résultats du Quiz Cinéma')
      expect(summary).toContain('Les Cinéphiles')
      expect(summary).toContain('Movie Masters')
      expect(summary).toContain('Film Fanatics')
      expect(summary).toContain('2 points')
      expect(summary).toContain('1 point')
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.results-container').classes()).toContain('mobile-layout')
    })

    it('should stack team rankings vertically on small screens', async () => {
      // Simulate small screen
      wrapper.vm.isMobile = true
      await wrapper.vm.$nextTick()
      
      const rankings = wrapper.find('.team-rankings')
      expect(rankings.classes()).toContain('vertical-layout')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      expect(wrapper.find('.team-rankings').attributes('aria-label')).toBe('Classement des équipes')
      expect(wrapper.find('.question-results').attributes('aria-label')).toBe('Résultats par question')
    })

    it('should have proper heading hierarchy', () => {
      expect(wrapper.find('h1').text()).toContain('Résultats du Quiz')
      expect(wrapper.find('h2').text()).toContain('Classement')
      expect(wrapper.findAll('h3')).toHaveLength(mockQuestions.length)
    })

    it('should have keyboard navigation support', async () => {
      const firstRanking = wrapper.find('.team-ranking-item')
      
      await firstRanking.trigger('keydown.enter')
      expect(firstRanking.classes()).toContain('expanded')
      
      await firstRanking.trigger('keydown.escape')
      expect(firstRanking.classes()).not.toContain('expanded')
    })

    it('should announce score changes to screen readers', () => {
      const rankings = wrapper.findAll('.team-ranking-item')
      
      rankings.forEach(ranking => {
        expect(ranking.attributes('aria-live')).toBe('polite')
      })
    })
  })

  describe('Performance Optimizations', () => {
    it('should handle large datasets efficiently', async () => {
      const manyTeams = Array.from({ length: 20 }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
        score: Math.floor(Math.random() * 10),
        color: '#ff6b6b'
      }))
      
      const manyAnswers = manyTeams.flatMap(team =>
        mockQuestions.map((q, qIndex) => ({
          questionId: q.id,
          teamId: team.id,
          answerIndex: Math.floor(Math.random() * q.answers.length),
          isCorrect: Math.random() > 0.5
        }))
      )
      
      const start = performance.now()
      await wrapper.setProps({
        teams: manyTeams,
        teamAnswers: manyAnswers
      })
      const end = performance.now()
      
      expect(end - start).toBeLessThan(200) // Should render in less than 200ms
    })

    it('should use virtual scrolling for large question lists', async () => {
      const manyQuestions = Array.from({ length: 100 }, (_, i) => ({
        id: `q${i}`,
        question: `Question ${i}?`,
        answers: ['A', 'B', 'C', 'D'],
        correctAnswer: 0
      }))
      
      await wrapper.setProps({ questions: manyQuestions })
      
      // Should only render visible questions
      const renderedQuestions = wrapper.findAll('.question-result')
      expect(renderedQuestions.length).toBeLessThan(manyQuestions.length)
    })
  })

  describe('Edge Cases', () => {
    it('should handle teams with no answers', async () => {
      const teamsWithNoAnswers = [
        { id: 'team-1', name: 'Team A', score: 0 },
        { id: 'team-2', name: 'Team B', score: 0 }
      ]
      
      await wrapper.setProps({
        teams: teamsWithNoAnswers,
        teamAnswers: []
      })
      
      const rankings = wrapper.findAll('.team-ranking-item')
      expect(rankings).toHaveLength(2)
      
      rankings.forEach(ranking => {
        expect(ranking.text()).toContain('0 point')
        expect(ranking.text()).toContain('0%')
      })
    })

    it('should handle questions with no team answers', async () => {
      const questionsWithNoAnswers = [
        { id: 'q1', question: 'Unanswered question?', answers: ['A', 'B'], correctAnswer: 0 }
      ]
      
      await wrapper.setProps({
        questions: questionsWithNoAnswers,
        teamAnswers: []
      })
      
      const questionResult = wrapper.find('.question-result')
      expect(questionResult.text()).toContain('Aucune réponse')
    })

    it('should handle tied scores correctly', async () => {
      const tiedAnswers: TeamAnswer[] = [
        { questionId: 'q1', teamId: 'team-1', answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: 'team-2', answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: 'team-3', answerIndex: 0, isCorrect: true }
      ]
      
      await wrapper.setProps({ teamAnswers: tiedAnswers })
      
      const rankings = wrapper.findAll('.team-ranking-item')
      
      // All teams should have same score but different ranks
      rankings.forEach(ranking => {
        expect(ranking.text()).toContain('1 point')
        expect(ranking.text()).toContain('33%')
      })
      
      // Check that ranks are assigned (1, 2, 3 even with tied scores)
      expect(rankings[0].find('.rank-number').text()).toBe('1')
      expect(rankings[1].find('.rank-number').text()).toBe('2')
      expect(rankings[2].find('.rank-number').text()).toBe('3')
    })

    it('should handle missing team data gracefully', async () => {
      const answersWithMissingTeam: TeamAnswer[] = [
        { questionId: 'q1', teamId: 'missing-team', answerIndex: 0, isCorrect: true }
      ]
      
      await wrapper.setProps({ teamAnswers: answersWithMissingTeam })
      
      const questionResult = wrapper.find('.question-result')
      expect(questionResult.text()).toContain('Équipe inconnue')
    })
  })

  describe('Integration with Quiz Store', () => {
    beforeEach(() => {
      store.setUserMode('host')
      store.loadQuestions(mockQuestions)
      
      // Set up store with test data
      mockTeams.forEach(team => store.state.teams.push(team))
      mockTeamAnswers.forEach(answer => store.state.teamAnswers.push(answer))
    })

    it('should reflect store data correctly', () => {
      const storeRankings = store.teamRankings
      const componentRankings = wrapper.findAll('.team-ranking-item')
      
      expect(componentRankings).toHaveLength(storeRankings.length)
      
      storeRankings.forEach((storeTeam, index) => {
        const componentRanking = componentRankings[index]
        expect(componentRanking.text()).toContain(storeTeam.name)
        expect(componentRanking.text()).toContain(`${storeTeam.score} point`)
      })
    })

    it('should use store question results', () => {
      const storeResults = store.questionResults
      const componentResults = wrapper.findAll('.question-result')
      
      expect(componentResults).toHaveLength(storeResults.length)
      
      storeResults.forEach((storeResult, index) => {
        const componentResult = componentResults[index]
        expect(componentResult.text()).toContain(mockQuestions[index].question)
      })
    })
  })
})