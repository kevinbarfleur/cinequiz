import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TeamAssignmentModal from '../TeamAssignmentModal.vue'
import { useQuizStore } from '@/stores/quiz'
import type { Team } from '@/types'

// Mock the BaseButton component
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :class="variant"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  }
}))

describe('TeamAssignmentModal - Integration Tests', () => {
  let wrapper: any
  let store: any

  const mockTeams: Team[] = [
    { id: 'team-1', name: 'Les Cinéphiles', score: 0, color: '#ff6b6b' },
    { id: 'team-2', name: 'Movie Masters', score: 0, color: '#4ecdc4' },
    { id: 'team-3', name: 'Film Fanatics', score: 0, color: '#45b7d1' }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuizStore()
    
    wrapper = mount(TeamAssignmentModal, {
      props: {
        teams: mockTeams,
        selectedAnswer: 'Réponse A',
        isVisible: true
      },
      global: {
        stubs: {
          Teleport: true
        }
      }
    })
  })

  describe('Modal Display and Interaction', () => {
    it('should display modal when visible', () => {
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('.modal-content').exists()).toBe(true)
    })

    it('should not display modal when not visible', async () => {
      await wrapper.setProps({ isVisible: false })
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('should display selected answer in modal', () => {
      expect(wrapper.text()).toContain('Réponse A')
    })

    it('should display all teams as options', () => {
      const teamButtons = wrapper.findAll('.team-option')
      expect(teamButtons).toHaveLength(3)
      
      expect(wrapper.text()).toContain('Les Cinéphiles')
      expect(wrapper.text()).toContain('Movie Masters')
      expect(wrapper.text()).toContain('Film Fanatics')
    })

    it('should show team colors', () => {
      const teamOptions = wrapper.findAll('.team-option')
      
      expect(teamOptions[0].find('.team-color').attributes('style')).toContain('#ff6b6b')
      expect(teamOptions[1].find('.team-color').attributes('style')).toContain('#4ecdc4')
      expect(teamOptions[2].find('.team-color').attributes('style')).toContain('#45b7d1')
    })
  })

  describe('Team Selection', () => {
    it('should select team when clicked', async () => {
      const firstTeamButton = wrapper.find('.team-option')
      await firstTeamButton.trigger('click')
      
      expect(wrapper.vm.selectedTeamId).toBe('team-1')
      expect(firstTeamButton.classes()).toContain('selected')
    })

    it('should change selection when different team clicked', async () => {
      const firstTeam = wrapper.findAll('.team-option')[0]
      const secondTeam = wrapper.findAll('.team-option')[1]
      
      await firstTeam.trigger('click')
      expect(wrapper.vm.selectedTeamId).toBe('team-1')
      
      await secondTeam.trigger('click')
      expect(wrapper.vm.selectedTeamId).toBe('team-2')
      
      expect(firstTeam.classes()).not.toContain('selected')
      expect(secondTeam.classes()).toContain('selected')
    })

    it('should enable confirm button when team selected', async () => {
      const confirmButton = wrapper.find('[data-testid="confirm-button"]')
      expect(confirmButton.attributes('disabled')).toBeDefined()
      
      await wrapper.find('.team-option').trigger('click')
      
      expect(confirmButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Modal Actions', () => {
    it('should emit team-selected when confirmed', async () => {
      await wrapper.find('.team-option').trigger('click')
      await wrapper.find('[data-testid="confirm-button"]').trigger('click')
      
      expect(wrapper.emitted('team-selected')).toBeTruthy()
      expect(wrapper.emitted('team-selected')[0]).toEqual([{
        teamId: 'team-1',
        teamName: 'Les Cinéphiles',
        answer: 'Réponse A'
      }])
    })

    it('should emit modal-closed when cancelled', async () => {
      await wrapper.find('[data-testid="cancel-button"]').trigger('click')
      
      expect(wrapper.emitted('modal-closed')).toBeTruthy()
    })

    it('should emit modal-closed when overlay clicked', async () => {
      await wrapper.find('.modal-overlay').trigger('click')
      
      expect(wrapper.emitted('modal-closed')).toBeTruthy()
    })

    it('should not close when modal content clicked', async () => {
      await wrapper.find('.modal-content').trigger('click')
      
      expect(wrapper.emitted('modal-closed')).toBeFalsy()
    })

    it('should close on escape key', async () => {
      await wrapper.trigger('keyup.escape')
      
      expect(wrapper.emitted('modal-closed')).toBeTruthy()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate teams with arrow keys', async () => {
      // Focus first team
      await wrapper.vm.focusTeam(0)
      expect(wrapper.vm.focusedTeamIndex).toBe(0)
      
      // Navigate down
      await wrapper.trigger('keydown.down')
      expect(wrapper.vm.focusedTeamIndex).toBe(1)
      
      // Navigate up
      await wrapper.trigger('keydown.up')
      expect(wrapper.vm.focusedTeamIndex).toBe(0)
    })

    it('should wrap around when navigating past bounds', async () => {
      await wrapper.vm.focusTeam(2) // Last team
      
      // Navigate down should wrap to first
      await wrapper.trigger('keydown.down')
      expect(wrapper.vm.focusedTeamIndex).toBe(0)
      
      // Navigate up should wrap to last
      await wrapper.trigger('keydown.up')
      expect(wrapper.vm.focusedTeamIndex).toBe(2)
    })

    it('should select team with enter key', async () => {
      await wrapper.vm.focusTeam(1)
      await wrapper.trigger('keydown.enter')
      
      expect(wrapper.vm.selectedTeamId).toBe('team-2')
    })

    it('should confirm selection with enter when team selected', async () => {
      await wrapper.find('.team-option').trigger('click')
      await wrapper.trigger('keydown.enter')
      
      expect(wrapper.emitted('team-selected')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      expect(wrapper.find('.modal-content').attributes('role')).toBe('dialog')
      expect(wrapper.find('.modal-content').attributes('aria-labelledby')).toBe('modal-title')
      expect(wrapper.find('.modal-content').attributes('aria-describedby')).toBe('modal-description')
    })

    it('should have proper focus management', async () => {
      // Modal should be focusable
      expect(wrapper.find('.modal-content').attributes('tabindex')).toBe('-1')
      
      // Team options should be focusable
      const teamOptions = wrapper.findAll('.team-option')
      teamOptions.forEach(option => {
        expect(option.attributes('tabindex')).toBe('0')
      })
    })

    it('should have proper ARIA labels for teams', () => {
      const teamOptions = wrapper.findAll('.team-option')
      
      expect(teamOptions[0].attributes('aria-label')).toBe('Assigner à Les Cinéphiles')
      expect(teamOptions[1].attributes('aria-label')).toBe('Assigner à Movie Masters')
      expect(teamOptions[2].attributes('aria-label')).toBe('Assigner à Film Fanatics')
    })

    it('should announce selection state', async () => {
      const firstTeam = wrapper.find('.team-option')
      
      expect(firstTeam.attributes('aria-selected')).toBe('false')
      
      await firstTeam.trigger('click')
      
      expect(firstTeam.attributes('aria-selected')).toBe('true')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty teams array', async () => {
      await wrapper.setProps({ teams: [] })
      
      expect(wrapper.findAll('.team-option')).toHaveLength(0)
      expect(wrapper.text()).toContain('Aucune équipe disponible')
    })

    it('should handle teams without colors', async () => {
      const teamsWithoutColors = [
        { id: 'team-1', name: 'Team A', score: 0 },
        { id: 'team-2', name: 'Team B', score: 0 }
      ]
      
      await wrapper.setProps({ teams: teamsWithoutColors })
      
      const teamOptions = wrapper.findAll('.team-option')
      expect(teamOptions[0].find('.team-color').attributes('style')).toContain('#6366f1') // Default color
    })

    it('should handle very long team names', async () => {
      const teamsWithLongNames = [
        { id: 'team-1', name: 'A'.repeat(100), score: 0, color: '#ff6b6b' }
      ]
      
      await wrapper.setProps({ teams: teamsWithLongNames })
      
      const teamOption = wrapper.find('.team-option')
      expect(teamOption.find('.team-name').classes()).toContain('truncate')
    })

    it('should handle special characters in team names', async () => {
      const teamsWithSpecialChars = [
        { id: 'team-1', name: 'Team "Quotes" & Symbols', score: 0, color: '#ff6b6b' }
      ]
      
      await wrapper.setProps({ teams: teamsWithSpecialChars })
      
      expect(wrapper.text()).toContain('Team "Quotes" & Symbols')
    })
  })

  describe('Performance', () => {
    it('should handle large number of teams efficiently', async () => {
      const manyTeams = Array.from({ length: 50 }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
        score: 0,
        color: '#ff6b6b'
      }))
      
      const start = performance.now()
      await wrapper.setProps({ teams: manyTeams })
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // Should render in less than 100ms
      expect(wrapper.findAll('.team-option')).toHaveLength(50)
    })

    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.spyOn(wrapper.vm, '$forceUpdate')
      
      // Change props that shouldn't trigger re-render
      await wrapper.setProps({ selectedAnswer: 'Same Answer' })
      await wrapper.setProps({ selectedAnswer: 'Same Answer' })
      
      expect(renderSpy).not.toHaveBeenCalled()
    })
  })

  describe('Integration with Quiz Store', () => {
    beforeEach(() => {
      store.setUserMode('host')
      store.loadQuestions([
        { id: 'q1', question: 'Test?', answers: ['A', 'B', 'C'], correctAnswer: 0 }
      ])
      
      // Create teams in store
      mockTeams.forEach(team => {
        store.state.teams.push(team)
      })
    })

    it('should integrate with store team assignment', async () => {
      // Select team and confirm
      await wrapper.find('.team-option').trigger('click')
      await wrapper.find('[data-testid="confirm-button"]').trigger('click')
      
      const emittedEvent = wrapper.emitted('team-selected')[0][0]
      
      // Simulate parent component handling the event
      const success = store.assignAnswerToTeam('q1', 0, emittedEvent.teamId)
      
      expect(success).toBe(true)
      expect(store.state.teamAnswers).toHaveLength(1)
      expect(store.state.teamAnswers[0].teamId).toBe('team-1')
    })

    it('should reflect store team updates', async () => {
      // Update team in store
      store.editTeam('team-1', 'Updated Team Name')
      
      // Update props to reflect store changes
      const updatedTeams = [...mockTeams]
      updatedTeams[0].name = 'Updated Team Name'
      await wrapper.setProps({ teams: updatedTeams })
      
      expect(wrapper.text()).toContain('Updated Team Name')
      expect(wrapper.text()).not.toContain('Les Cinéphiles')
    })

    it('should handle team deletion during modal display', async () => {
      // Remove a team from props
      const remainingTeams = mockTeams.slice(1)
      await wrapper.setProps({ teams: remainingTeams })
      
      expect(wrapper.findAll('.team-option')).toHaveLength(2)
      expect(wrapper.text()).not.toContain('Les Cinéphiles')
    })
  })

  describe('Animation and Transitions', () => {
    it('should have enter animation classes', () => {
      expect(wrapper.find('.modal-overlay').classes()).toContain('modal-enter-active')
    })

    it('should apply hover effects on team options', async () => {
      const teamOption = wrapper.find('.team-option')
      
      await teamOption.trigger('mouseenter')
      expect(teamOption.classes()).toContain('hover')
      
      await teamOption.trigger('mouseleave')
      expect(teamOption.classes()).not.toContain('hover')
    })

    it('should have selection animation', async () => {
      const teamOption = wrapper.find('.team-option')
      
      await teamOption.trigger('click')
      
      // Should have selection animation class
      expect(teamOption.classes()).toContain('selected')
      expect(teamOption.classes()).toContain('animate-selection')
    })
  })
})