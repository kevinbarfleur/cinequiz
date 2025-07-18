import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TeamSetup from '../TeamSetup.vue'
import { useQuizStore } from '@/stores/quiz'

// Mock the BaseButton component
vi.mock('@/components/ui', () => ({
  BaseButton: {
    name: 'BaseButton',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  }
}))

describe('TeamSetup', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuizStore()
    
    wrapper = mount(TeamSetup, {
      global: {
        stubs: {
          Teleport: true
        }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.find('.team-setup').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Configuration des Équipes')
  })

  it('shows empty state when no teams exist', () => {
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-state').text()).toContain('Aucune équipe créée')
  })

  it('allows adding a new team', async () => {
    const input = wrapper.find('.team-input')
    const addButton = wrapper.find('[data-testid="add-team-button"]')
    
    await input.setValue('Équipe Test')
    await addButton.trigger('click')
    
    expect(store.state.teams).toHaveLength(1)
    expect(store.state.teams[0].name).toBe('Équipe Test')
  })

  it('validates team name uniqueness', async () => {
    // Add first team
    store.createTeam('Équipe 1')
    
    const input = wrapper.find('.team-input')
    await input.setValue('Équipe 1')
    
    // Should not be able to add duplicate
    expect(wrapper.vm.canAddTeam).toBe(false)
  })

  it('validates team name length', async () => {
    const input = wrapper.find('.team-input')
    
    // Empty name
    await input.setValue('')
    expect(wrapper.vm.canAddTeam).toBe(false)
    
    // Too long name (over 50 characters)
    await input.setValue('A'.repeat(51))
    expect(wrapper.vm.canAddTeam).toBe(false)
    
    // Valid name
    await input.setValue('Valid Team Name')
    expect(wrapper.vm.canAddTeam).toBe(true)
  })

  it('allows editing team names', async () => {
    // Add a team first
    store.createTeam('Original Name')
    await wrapper.vm.$nextTick()
    
    const editButton = wrapper.find('.btn-edit')
    await editButton.trigger('click')
    
    expect(wrapper.vm.editingTeamId).toBe(store.state.teams[0].id)
    
    const editInput = wrapper.find('.team-edit-input')
    await editInput.setValue('New Name')
    
    const saveButton = wrapper.find('.btn-save')
    await saveButton.trigger('click')
    
    expect(store.state.teams[0].name).toBe('New Name')
    expect(wrapper.vm.editingTeamId).toBe(null)
  })

  it('allows deleting teams with confirmation', async () => {
    // Add a team first
    store.createTeam('Team to Delete')
    await wrapper.vm.$nextTick()
    
    const deleteButton = wrapper.find('.btn-delete')
    await deleteButton.trigger('click')
    
    expect(wrapper.vm.showDeleteConfirm).toBe(true)
    expect(wrapper.vm.teamToDelete?.name).toBe('Team to Delete')
    
    // Confirm deletion
    await wrapper.vm.confirmDelete()
    
    expect(store.state.teams).toHaveLength(0)
    expect(wrapper.vm.showDeleteConfirm).toBe(false)
  })

  it('can cancel team deletion', async () => {
    // Add a team first
    store.createTeam('Team to Keep')
    await wrapper.vm.$nextTick()
    
    const deleteButton = wrapper.find('.btn-delete')
    await deleteButton.trigger('click')
    
    expect(wrapper.vm.showDeleteConfirm).toBe(true)
    
    // Cancel deletion
    await wrapper.vm.cancelDelete()
    
    expect(store.state.teams).toHaveLength(1)
    expect(wrapper.vm.showDeleteConfirm).toBe(false)
  })

  it('enables start quiz button only when teams exist', async () => {
    // Initially no teams, button should be disabled
    expect(wrapper.vm.canStartQuiz).toBe(false)
    
    // Add a team
    store.createTeam('Test Team')
    await wrapper.vm.$nextTick()
    
    // Now button should be enabled
    expect(wrapper.vm.canStartQuiz).toBe(true)
  })

  it('emits events when starting quiz', async () => {
    store.createTeam('Test Team')
    await wrapper.vm.$nextTick()
    
    await wrapper.vm.handleStartQuiz()
    
    expect(wrapper.emitted('teams-configured')).toBeTruthy()
    expect(wrapper.emitted('start-quiz')).toBeTruthy()
    expect(wrapper.emitted('teams-configured')[0][0]).toEqual(store.state.teams)
  })

  it('clears all teams when requested', async () => {
    // Add multiple teams
    store.createTeam('Team 1')
    store.createTeam('Team 2')
    store.createTeam('Team 3')
    
    expect(store.state.teams).toHaveLength(3)
    
    await wrapper.vm.clearAllTeams()
    
    expect(store.state.teams).toHaveLength(0)
  })

  it('cycles through colors when adding teams', async () => {
    const input = wrapper.find('.team-input')
    
    // Add first team
    await input.setValue('Team 1')
    const initialColor = wrapper.vm.selectedColor
    await wrapper.vm.handleAddTeam()
    
    // Color should have changed to next in cycle
    expect(wrapper.vm.selectedColor).not.toBe(initialColor)
  })

  it('sets user mode to host on mount', () => {
    expect(store.state.userMode).toBe('host')
  })

  it('shows error messages from store', async () => {
    store.state.error = 'Test error message'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.find('.error-message').text()).toBe('Test error message')
  })

  it('clears error when typing in input', async () => {
    store.state.error = 'Test error'
    const input = wrapper.find('.team-input')
    
    await input.trigger('input')
    
    expect(store.state.error).toBe(undefined)
  })
})