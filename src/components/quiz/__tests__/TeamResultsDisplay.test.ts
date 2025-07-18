import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TeamResultsDisplay from '../TeamResultsDisplay.vue'
import type { Team, Question, QuestionResults } from '@/types'

// Mock the BaseButton component
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  }
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

describe('TeamResultsDisplay', () => {
  let wrapper: any
  
  const mockTeams: Team[] = [
    { id: 'team1', name: 'Équipe Alpha', score: 0, color: '#ff6b6b' },
    { id: 'team2', name: 'Équipe Beta', score: 0, color: '#4ecdc4' },
    { id: 'team3', name: 'Équipe Gamma', score: 0, color: '#45b7d1' }
  ]

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      question: 'Qui a réalisé Titanic ?',
      answers: ['James Cameron', 'Steven Spielberg', 'Christopher Nolan', 'Ridley Scott'],
      correctAnswer: 0
    },
    {
      id: 'q2',
      question: 'En quelle année est sorti Avatar ?',
      answers: ['2007', '2008', '2009', '2010'],
      correctAnswer: 2
    }
  ]

  const mockQuestionResults: QuestionResults[] = [
    {
      questionId: 'q1',
      correctAnswer: 0,
      teamAnswers: [
        { teamId: 'team1', teamName: 'Équipe Alpha', answerIndex: 0, isCorrect: true },
        { teamId: 'team2', teamName: 'Équipe Beta', answerIndex: 1, isCorrect: false },
        { teamId: 'team3', teamName: 'Équipe Gamma', answerIndex: 0, isCorrect: true }
      ]
    },
    {
      questionId: 'q2',
      correctAnswer: 2,
      teamAnswers: [
        { teamId: 'team1', teamName: 'Équipe Alpha', answerIndex: 2, isCorrect: true },
        { teamId: 'team2', teamName: 'Équipe Beta', answerIndex: 2, isCorrect: true },
        { teamId: 'team3', teamName: 'Équipe Gamma', answerIndex: 1, isCorrect: false }
      ]
    }
  ]

  const defaultProps = {
    teams: mockTeams,
    questions: mockQuestions,
    questionResults: mockQuestionResults,
    totalQuestions: 2
  }

  beforeEach(() => {
    wrapper = mount(TeamResultsDisplay, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true
        }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.find('.team-results').exists()).toBe(true)
    expect(wrapper.find('.results-title').text()).toContain('Résultats du Quiz')
  })

  it('displays the correct team rankings', () => {
    const rankedTeams = wrapper.vm.rankedTeams
    
    // Based on our mock data:
    // Q1: Alpha=correct, Beta=incorrect, Gamma=correct
    // Q2: Alpha=correct, Beta=correct, Gamma=incorrect
    // So: Alpha=2, Beta=1, Gamma=1
    expect(rankedTeams[0].score).toBe(2) // Alpha (first)
    expect(rankedTeams[1].score).toBe(1) // Beta or Gamma (tied for second)
    expect(rankedTeams[2].score).toBe(1) // Beta or Gamma (tied for second)
    
    // Alpha should be first
    expect(rankedTeams[0].name).toBe('Équipe Alpha')
  })

  it('shows podium for top 3 teams', () => {
    const podiumPositions = wrapper.findAll('.podium-position')
    expect(podiumPositions).toHaveLength(3)
    
    // Check that medals are displayed
    const medals = wrapper.findAll('.podium-medal')
    expect(medals[0].text()).toMatch(/🥇|🥈|🥉/)
  })

  it('displays team colors correctly', () => {
    const teamColorIndicators = wrapper.findAll('.team-color-indicator')
    expect(teamColorIndicators.length).toBeGreaterThan(0)
    
    // Check that colors are applied
    const firstIndicator = teamColorIndicators[0]
    expect(firstIndicator.attributes('style')).toContain('background-color')
  })

  it('shows percentage calculations correctly', () => {
    const percentageTexts = wrapper.findAll('.percentage-text')
    expect(percentageTexts.length).toBeGreaterThan(0)
    
    // Check that percentages are calculated (should be 50% or 100% based on our mock data)
    percentageTexts.forEach(percentageEl => {
      const text = percentageEl.text()
      expect(text).toMatch(/\d+%/)
    })
  })

  it('allows expanding and collapsing question details', async () => {
    const questionHeaders = wrapper.findAll('.question-header')
    expect(questionHeaders.length).toBe(2)
    
    // Initially no questions should be expanded
    expect(wrapper.vm.expandedQuestions.size).toBe(0)
    
    // Click first question to expand
    await questionHeaders[0].trigger('click')
    expect(wrapper.vm.expandedQuestions.has(0)).toBe(true)
    
    // Click again to collapse
    await questionHeaders[0].trigger('click')
    expect(wrapper.vm.expandedQuestions.has(0)).toBe(false)
  })

  it('displays question details when expanded', async () => {
    // Expand first question
    wrapper.vm.toggleQuestion(0)
    await nextTick()
    
    const questionDetails = wrapper.find('.question-details')
    expect(questionDetails.exists()).toBe(true)
    
    // Should show correct answer
    expect(questionDetails.text()).toContain('Bonne réponse')
    expect(questionDetails.text()).toContain('James Cameron')
    
    // Should show team answers
    const teamAnswers = questionDetails.findAll('.team-answer')
    expect(teamAnswers.length).toBe(3) // One for each team
  })

  it('shows correct/incorrect indicators for team answers', async () => {
    wrapper.vm.toggleQuestion(0)
    await nextTick()
    
    const teamAnswers = wrapper.findAll('.team-answer')
    const resultIndicators = wrapper.findAll('.team-answer-result')
    
    expect(resultIndicators.length).toBe(3)
    
    // Check that we have both correct (✓) and incorrect (✗) indicators
    const indicatorTexts = resultIndicators.map(el => el.text())
    expect(indicatorTexts).toContain('✓')
    expect(indicatorTexts).toContain('✗')
  })

  it('displays performance chart with bars', () => {
    const chartBars = wrapper.findAll('.chart-bar')
    expect(chartBars.length).toBe(3) // One for each team
    
    const barFills = wrapper.findAll('.bar-fill')
    expect(barFills.length).toBe(3)
    
    // Check that bar widths are set based on scores
    barFills.forEach(barFill => {
      const style = barFill.attributes('style')
      expect(style).toContain('width:')
    })
  })

  it('emits restart event when restart button is clicked', async () => {
    const restartButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Nouveau Quiz')
    )
    
    await restartButton?.trigger('click')
    expect(wrapper.emitted('restart')).toBeTruthy()
  })

  it('emits home event when home button is clicked', async () => {
    const homeButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Accueil')
    )
    
    await homeButton?.trigger('click')
    expect(wrapper.emitted('home')).toBeTruthy()
  })

  it('shows export button when clipboard is available', () => {
    expect(wrapper.vm.canExport).toBe(true)
    
    const exportButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Exporter')
    )
    expect(exportButton?.exists()).toBe(true)
  })

  it('opens export modal when export button is clicked', async () => {
    const exportButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Exporter')
    )
    
    await exportButton?.trigger('click')
    expect(wrapper.vm.showExportModal).toBe(true)
  })

  it('generates correct text export', () => {
    const textExport = wrapper.vm.generateTextExport()
    
    expect(textExport).toContain('RÉSULTATS DU QUIZ CINÉMA')
    expect(textExport).toContain('CLASSEMENT FINAL')
    expect(textExport).toContain('Équipe Alpha')
    expect(textExport).toContain('Équipe Beta')
    expect(textExport).toContain('Équipe Gamma')
    expect(textExport).toContain('Qui a réalisé Titanic')
    expect(textExport).toContain('James Cameron')
  })

  it('generates correct JSON export', () => {
    const jsonExport = wrapper.vm.generateJSONExport()
    const parsedData = JSON.parse(jsonExport)
    
    expect(parsedData).toHaveProperty('timestamp')
    expect(parsedData).toHaveProperty('quiz')
    expect(parsedData.quiz).toHaveProperty('totalQuestions', 2)
    expect(parsedData.quiz).toHaveProperty('teams')
    expect(parsedData.quiz).toHaveProperty('questionResults')
    expect(parsedData.quiz.teams).toHaveLength(3)
    expect(parsedData.quiz.questionResults).toHaveLength(2)
  })

  it('copies text to clipboard when exporting as text', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')
    
    await wrapper.vm.exportAsText()
    
    expect(clipboardSpy).toHaveBeenCalled()
    expect(clipboardSpy).toHaveBeenCalledWith(expect.stringContaining('RÉSULTATS DU QUIZ CINÉMA'))
  })

  it('copies JSON to clipboard when exporting as JSON', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')
    
    await wrapper.vm.exportAsJSON()
    
    expect(clipboardSpy).toHaveBeenCalled()
    const callArg = clipboardSpy.mock.calls[0][0]
    expect(() => JSON.parse(callArg)).not.toThrow()
  })

  it('handles teams with missing colors gracefully', async () => {
    const teamsWithoutColors = [
      { id: 'team1', name: 'Team 1', score: 0 },
      { id: 'team2', name: 'Team 2', score: 0, color: undefined }
    ]
    
    await wrapper.setProps({ teams: teamsWithoutColors })
    
    // Should use fallback color
    expect(wrapper.vm.getTeamColor('team1')).toBe('#6366f1')
    expect(wrapper.vm.getTeamColor('team2')).toBe('#6366f1')
  })

  it('handles missing questions gracefully', () => {
    const questionText = wrapper.vm.getQuestionText('nonexistent-id')
    expect(questionText).toBe('Question non trouvée')
    
    const answerText = wrapper.vm.getAnswerText('nonexistent-id', 0)
    expect(answerText).toBe('Réponse non trouvée')
  })

  it('calculates correct answers count correctly', () => {
    const firstQuestionResult = mockQuestionResults[0]
    const correctCount = wrapper.vm.getCorrectAnswersCount(firstQuestionResult)
    expect(correctCount).toBe(2) // Alpha and Gamma got it right
    
    const secondQuestionResult = mockQuestionResults[1]
    const correctCount2 = wrapper.vm.getCorrectAnswersCount(secondQuestionResult)
    expect(correctCount2).toBe(2) // Alpha and Beta got it right
  })

  it('sorts teams correctly by score and name', () => {
    const rankedTeams = wrapper.vm.rankedTeams
    
    // Teams should be sorted by score descending, then by name ascending
    expect(rankedTeams[0].score).toBeGreaterThanOrEqual(rankedTeams[1].score)
    expect(rankedTeams[1].score).toBeGreaterThanOrEqual(rankedTeams[2].score)
    
    // If scores are equal, should be sorted by name
    if (rankedTeams[0].score === rankedTeams[1].score) {
      expect(rankedTeams[0].name.localeCompare(rankedTeams[1].name)).toBeLessThanOrEqual(0)
    }
  })

  it('displays medal emojis correctly', () => {
    expect(wrapper.vm.getMedalEmoji(1)).toBe('🥇')
    expect(wrapper.vm.getMedalEmoji(2)).toBe('🥈')
    expect(wrapper.vm.getMedalEmoji(3)).toBe('🥉')
    expect(wrapper.vm.getMedalEmoji(4)).toBe('🏅')
  })

  it('closes export modal when overlay is clicked', async () => {
    wrapper.vm.showExportModal = true
    await nextTick()
    
    const overlay = wrapper.find('.modal-overlay')
    await overlay.trigger('click')
    
    expect(wrapper.vm.showExportModal).toBe(false)
  })
})