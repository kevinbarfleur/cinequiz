import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TeamAssignmentModal from '../TeamAssignmentModal.vue'
import type { Team } from '@/types'

// Mock the BaseButton component
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  }
}))

describe('TeamAssignmentModal', () => {
  let wrapper: any
  const mockTeams: Team[] = [
    { id: 'team1', name: 'Équipe Alpha', score: 0, color: '#ff6b6b' },
    { id: 'team2', name: 'Équipe Beta', score: 0, color: '#4ecdc4' },
    { id: 'team3', name: 'Équipe Gamma', score: 0, color: '#45b7d1' }
  ]

  const defaultProps = {
    isVisible: true,
    selectedAnswer: 'Réponse A',
    selectedAnswerIndex: 0,
    teams: mockTeams,
    currentQuestionId: 'q1',
    allAnswers: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D']
  }

  beforeEach(() => {
    wrapper = mount(TeamAssignmentModal, {
      props: defaultProps,
      global: {
        stubs: {
          Teleport: true
        }
      }
    })
  })

  it('renders correctly when visible', () => {
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('Attribuer la réponse')
    expect(wrapper.find('.answer-display').text()).toBe('Réponse A')
  })

  it('does not render when not visible', async () => {
    await wrapper.setProps({ isVisible: false })
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('displays the selected answer correctly', () => {
    expect(wrapper.find('.answer-display').text()).toBe('Réponse A')
  })

  it('displays all teams as options', () => {
    const teamOptions = wrapper.findAll('.team-option')
    expect(teamOptions).toHaveLength(3)
    
    expect(teamOptions[0].text()).toContain('Équipe Alpha')
    expect(teamOptions[1].text()).toContain('Équipe Beta')
    expect(teamOptions[2].text()).toContain('Équipe Gamma')
  })

  it('allows selecting a team', async () => {
    const firstTeamOption = wrapper.find('.team-option')
    await firstTeamOption.trigger('click')
    
    expect(wrapper.vm.selectedTeamId).toBe('team1')
    expect(firstTeamOption.classes()).toContain('selected')
    expect(wrapper.emitted('team-selected')).toBeTruthy()
    expect(wrapper.emitted('team-selected')[0]).toEqual(['team1', 0])
  })

  it('shows team colors correctly', () => {
    const teamOptions = wrapper.findAll('.team-option')
    const firstTeamColor = teamOptions[0].find('.team-color')
    
    expect(firstTeamColor.attributes('style')).toContain('background-color: rgb(255, 107, 107)')
  })

  it('disables already assigned teams', async () => {
    const existingAssignments = new Map()
    existingAssignments.set(1, ['team1']) // team1 assigned to answer index 1
    
    await wrapper.setProps({ existingAssignments })
    
    const firstTeamOption = wrapper.find('.team-option')
    expect(firstTeamOption.classes()).toContain('already-assigned')
    expect(firstTeamOption.attributes('disabled')).toBeDefined()
    expect(firstTeamOption.text()).toContain('Déjà attribuée')
  })

  it('shows validation message for already assigned teams', async () => {
    const existingAssignments = new Map()
    existingAssignments.set(1, ['team1'])
    
    await wrapper.setProps({ existingAssignments })
    await nextTick()
    
    // Manually call the method since disabled buttons don't trigger click events
    await wrapper.vm.handleTeamSelect('team1')
    
    expect(wrapper.vm.validationMessage).toContain('Cette équipe a déjà une réponse attribuée')
  })

  it('displays assignment summary when there are existing assignments', async () => {
    const existingAssignments = new Map()
    existingAssignments.set(1, ['team1'])
    existingAssignments.set(2, ['team2'])
    
    await wrapper.setProps({ existingAssignments })
    
    expect(wrapper.find('.assignment-summary').exists()).toBe(true)
    
    const summaryItems = wrapper.findAll('.summary-item')
    expect(summaryItems).toHaveLength(2)
    
    expect(summaryItems[0].text()).toContain('Équipe Alpha')
    expect(summaryItems[0].text()).toContain('Réponse B')
    expect(summaryItems[1].text()).toContain('Équipe Beta')
    expect(summaryItems[1].text()).toContain('Réponse C')
  })

  it('emits assignment-confirmed when confirm button is clicked', async () => {
    // Select a team first
    const firstTeamOption = wrapper.find('.team-option')
    await firstTeamOption.trigger('click')
    
    // Click confirm button
    const confirmButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Attribuer')
    )
    await confirmButton?.trigger('click')
    
    expect(wrapper.emitted('assignment-confirmed')).toBeTruthy()
    expect(wrapper.emitted('assignment-confirmed')[0]).toEqual(['team1', 0])
    expect(wrapper.emitted('modal-closed')).toBeTruthy()
  })

  it('shows validation message when trying to confirm without selection', async () => {
    // Manually call the method since the button is disabled
    await wrapper.vm.handleConfirm()
    
    expect(wrapper.vm.validationMessage).toBe('Veuillez sélectionner une équipe')
    expect(wrapper.emitted('assignment-confirmed')).toBeFalsy()
  })

  it('disables confirm button when no team is selected', () => {
    const confirmButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Attribuer')
    )
    expect(confirmButton?.attributes('disabled')).toBeDefined()
  })

  it('enables confirm button when a valid team is selected', async () => {
    const firstTeamOption = wrapper.find('.team-option')
    await firstTeamOption.trigger('click')
    
    await nextTick()
    
    const confirmButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Attribuer')
    )
    expect(confirmButton?.attributes('disabled')).toBeUndefined()
  })

  it('emits modal-closed when cancel button is clicked', async () => {
    const cancelButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Annuler')
    )
    await cancelButton?.trigger('click')
    
    expect(wrapper.emitted('modal-closed')).toBeTruthy()
  })

  it('emits modal-closed when close button is clicked', async () => {
    const closeButton = wrapper.find('.modal-close')
    await closeButton.trigger('click')
    
    expect(wrapper.emitted('modal-closed')).toBeTruthy()
  })

  it('emits modal-closed when overlay is clicked', async () => {
    const overlay = wrapper.find('.modal-overlay')
    await overlay.trigger('click')
    
    expect(wrapper.emitted('modal-closed')).toBeTruthy()
  })

  it('does not close when modal container is clicked', async () => {
    const container = wrapper.find('.modal-container')
    await container.trigger('click')
    
    expect(wrapper.emitted('modal-closed')).toBeFalsy()
  })

  it('resets state when modal opens', async () => {
    // Select a team and set validation message
    wrapper.vm.selectedTeamId = 'team1'
    wrapper.vm.validationMessage = 'Test message'
    
    // Close and reopen modal
    await wrapper.setProps({ isVisible: false })
    await wrapper.setProps({ isVisible: true })
    
    expect(wrapper.vm.selectedTeamId).toBe(null)
    expect(wrapper.vm.validationMessage).toBe('')
  })

  it('shows empty state when no teams are available', async () => {
    await wrapper.setProps({ teams: [] })
    
    expect(wrapper.find('.no-teams').exists()).toBe(true)
    expect(wrapper.find('.no-teams').text()).toContain('Aucune équipe disponible')
  })

  it('handles keyboard escape to close modal', async () => {
    // Simulate escape key press
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(escapeEvent)
    
    await nextTick()
    
    expect(wrapper.emitted('modal-closed')).toBeTruthy()
  })

  it('correctly identifies already assigned teams across all answers', async () => {
    const existingAssignments = new Map()
    existingAssignments.set(0, ['team1']) // team1 assigned to answer 0
    existingAssignments.set(2, ['team2']) // team2 assigned to answer 2
    
    await wrapper.setProps({ existingAssignments })
    
    expect(wrapper.vm.isTeamAlreadyAssigned('team1')).toBe(true)
    expect(wrapper.vm.isTeamAlreadyAssigned('team2')).toBe(true)
    expect(wrapper.vm.isTeamAlreadyAssigned('team3')).toBe(false)
  })

  it('displays team colors with fallback', async () => {
    const teamsWithoutColors = [
      { id: 'team1', name: 'Team 1', score: 0 }, // No color property
      { id: 'team2', name: 'Team 2', score: 0, color: undefined } // Undefined color
    ]
    
    await wrapper.setProps({ teams: teamsWithoutColors })
    
    const teamColors = wrapper.findAll('.team-color')
    teamColors.forEach(colorEl => {
      expect(colorEl.attributes('style')).toContain('background-color: rgb(99, 102, 241)') // Default primary color
    })
  })
})