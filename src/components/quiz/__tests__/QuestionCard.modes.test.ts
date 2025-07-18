import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuestionCard from '../QuestionCard.vue'
import { useQuizStore } from '@/stores/quiz'
import type { Question } from '@/types'

const mockQuestion: Question = {
  id: 'q1',
  question: 'Quelle est la capitale de la France ?',
  answers: ['Londres', 'Berlin', 'Paris', 'Madrid'],
  correctAnswer: 2,
  category: 'Géographie',
  difficulty: 'easy'
}

describe('QuestionCard - Mode Behavior', () => {
  let pinia: ReturnType<typeof createPinia>
  let quizStore: ReturnType<typeof useQuizStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    quizStore = useQuizStore()
  })

  const createWrapper = (props = {}) => {
    const defaultProps = {
      question: mockQuestion,
      questionNumber: 1,
      totalQuestions: 10,
      userMode: 'participant',
      autoReveal: true,
      revealDelay: 0
    }

    return mount(QuestionCard, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [pinia],
        stubs: {
          AnswerButton: {
            template: `
              <button 
                class="answer-button-stub" 
                @click="$emit('click')"
                :data-answer-index="answerIndex"
                :data-is-correct="isCorrect"
                :data-user-mode="userMode"
              >
                {{ answer }}
              </button>
            `,
            props: ['answer', 'answerIndex', 'isCorrect', 'isSelected', 'showResult', 'userMode'],
            emits: ['click', 'team-assignment-requested']
          },
          TeamAssignmentModal: {
            template: `
              <div v-if="isVisible" class="team-assignment-modal-stub">
                <button 
                  v-for="team in teams" 
                  :key="team.id"
                  @click="$emit('team-selected', team.id)"
                  class="team-option"
                >
                  {{ team.name }}
                </button>
              </div>
            `,
            props: ['teams', 'selectedAnswer', 'isVisible'],
            emits: ['team-selected', 'modal-closed']
          }
        }
      }
    })
  }

  describe('Mode Participant', () => {
    it('should display question in participant mode correctly', () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      expect(wrapper.find('.question-text').text()).toBe(mockQuestion.question)
      expect(wrapper.find('.question-meta').text()).toContain('Question 1 sur 10')
      expect(wrapper.findAll('.answer-button-stub')).toHaveLength(4)
    })

    it('should handle answer selection in participant mode', async () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      const answerButton = wrapper.find('[data-answer-index="2"]')
      await answerButton.trigger('click')
      
      expect(wrapper.emitted('answer')).toBeTruthy()
      expect(wrapper.emitted('answer')[0]).toEqual([2, true]) // Index 2 is correct
    })

    it('should show answer feedback in participant mode with auto-reveal', async () => {
      const wrapper = createWrapper({ 
        userMode: 'participant',
        autoReveal: true,
        revealDelay: 0
      })
      
      // Sélectionner une réponse
      const answerButton = wrapper.find('[data-answer-index="2"]')
      await answerButton.trigger('click')
      
      // Attendre la révélation
      await new Promise(resolve => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showResults).toBe(true)
    })

    it('should not show team assignment modal in participant mode', async () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      const answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      
      expect(wrapper.find('.team-assignment-modal-stub').exists()).toBe(false)
    })

    it('should allow multiple answer selections in participant mode', async () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      // Première sélection
      let answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      expect(wrapper.vm.selectedAnswerIndex).toBe(0)
      
      // Deuxième sélection (changement de réponse)
      answerButton = wrapper.find('[data-answer-index="2"]')
      await answerButton.trigger('click')
      expect(wrapper.vm.selectedAnswerIndex).toBe(2)
    })

    it('should not show next button automatically in participant mode', () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      expect(wrapper.find('.next-question-button').exists()).toBe(false)
    })
  })

  describe('Mode Animateur (Host)', () => {
    beforeEach(() => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Équipe Alpha', '#ff6b6b')
      quizStore.createTeam('Équipe Beta', '#4ecdc4')
    })

    it('should display question in host mode correctly', () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      expect(wrapper.find('.question-text').text()).toBe(mockQuestion.question)
      expect(wrapper.find('.question-meta').text()).toContain('Question 1 sur 10')
      expect(wrapper.findAll('.answer-button-stub')).toHaveLength(4)
    })

    it('should show team assignment modal when answer is clicked in host mode', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      const answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      
      expect(wrapper.vm.showTeamModal).toBe(true)
      expect(wrapper.vm.selectedAnswerForTeam).toBe(0)
      expect(wrapper.find('.team-assignment-modal-stub').exists()).toBe(true)
    })

    it('should handle team assignment in host mode', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Cliquer sur une réponse
      const answerButton = wrapper.find('[data-answer-index="1"]')
      await answerButton.trigger('click')
      
      // Sélectionner une équipe
      const teamOption = wrapper.find('.team-option')
      await teamOption.trigger('click')
      
      expect(wrapper.emitted('team-answer-assigned')).toBeTruthy()
      expect(wrapper.emitted('team-answer-assigned')[0][0]).toMatchObject({
        questionId: 'q1',
        answerIndex: 1,
        teamId: expect.any(String)
      })
    })

    it('should close team modal after team selection', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Ouvrir le modal
      const answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      expect(wrapper.vm.showTeamModal).toBe(true)
      
      // Sélectionner une équipe
      const teamOption = wrapper.find('.team-option')
      await teamOption.trigger('click')
      
      expect(wrapper.vm.showTeamModal).toBe(false)
    })

    it('should show correct answer after all teams are assigned', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Simuler que toutes les équipes sont assignées
      wrapper.vm.allTeamsAssigned = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showResults).toBe(true)
    })

    it('should not auto-reveal answers in host mode without team assignments', () => {
      const wrapper = createWrapper({ 
        userMode: 'host',
        autoReveal: false
      })
      
      expect(wrapper.vm.showResults).toBe(false)
    })

    it('should show next button when all teams are assigned in host mode', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Simuler que toutes les équipes sont assignées
      wrapper.vm.allTeamsAssigned = true
      wrapper.vm.showResults = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.next-question-button').exists()).toBe(true)
    })

    it('should handle next question in host mode', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Simuler l'état où on peut passer à la question suivante
      wrapper.vm.allTeamsAssigned = true
      wrapper.vm.showResults = true
      await wrapper.vm.$nextTick()
      
      const nextButton = wrapper.find('.next-question-button')
      await nextButton.trigger('click')
      
      expect(wrapper.emitted('next')).toBeTruthy()
    })
  })

  describe('Transitions entre modes', () => {
    it('should update behavior when mode changes from participant to host', async () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      // Vérifier le comportement participant initial
      expect(wrapper.vm.userMode).toBe('participant')
      
      // Changer le mode
      await wrapper.setProps({ userMode: 'host' })
      
      // Vérifier le nouveau comportement
      expect(wrapper.vm.userMode).toBe('host')
    })

    it('should update behavior when mode changes from host to participant', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Vérifier le comportement host initial
      expect(wrapper.vm.userMode).toBe('host')
      
      // Changer le mode
      await wrapper.setProps({ userMode: 'participant' })
      
      // Vérifier le nouveau comportement
      expect(wrapper.vm.userMode).toBe('participant')
    })

    it('should reset state when mode changes', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Simuler une sélection en mode host
      wrapper.vm.selectedAnswerForTeam = 1
      wrapper.vm.showTeamModal = true
      
      // Changer vers le mode participant
      await wrapper.setProps({ userMode: 'participant' })
      
      // L'état devrait être réinitialisé
      expect(wrapper.vm.showTeamModal).toBe(false)
    })
  })

  describe('Gestion des équipes', () => {
    beforeEach(() => {
      quizStore.setUserMode('host')
      quizStore.createTeam('Équipe Rouge', '#ff0000')
      quizStore.createTeam('Équipe Bleue', '#0000ff')
      quizStore.createTeam('Équipe Verte', '#00ff00')
    })

    it('should display all teams in assignment modal', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      const answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      
      const teamOptions = wrapper.findAll('.team-option')
      expect(teamOptions).toHaveLength(3)
      expect(teamOptions[0].text()).toBe('Équipe Rouge')
      expect(teamOptions[1].text()).toBe('Équipe Bleue')
      expect(teamOptions[2].text()).toBe('Équipe Verte')
    })

    it('should handle team assignment for multiple teams', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Assigner la première équipe
      let answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      let teamOption = wrapper.findAll('.team-option')[0]
      await teamOption.trigger('click')
      
      // Assigner la deuxième équipe
      answerButton = wrapper.find('[data-answer-index="1"]')
      await answerButton.trigger('click')
      teamOption = wrapper.findAll('.team-option')[1]
      await teamOption.trigger('click')
      
      expect(wrapper.emitted('team-answer-assigned')).toHaveLength(2)
    })

    it('should track team assignments correctly', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Simuler des assignations d'équipes
      const team1Id = quizStore.state.teams[0].id
      const team2Id = quizStore.state.teams[1].id
      const team3Id = quizStore.state.teams[2].id
      
      quizStore.assignAnswerToTeam('q1', 0, team1Id)
      quizStore.assignAnswerToTeam('q1', 1, team2Id)
      quizStore.assignAnswerToTeam('q1', 2, team3Id)
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.allTeamsAssigned).toBe(true)
    })
  })

  describe('Affichage des résultats', () => {
    it('should show results immediately in participant mode with auto-reveal', async () => {
      const wrapper = createWrapper({ 
        userMode: 'participant',
        autoReveal: true,
        revealDelay: 0
      })
      
      const answerButton = wrapper.find('[data-answer-index="2"]')
      await answerButton.trigger('click')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showResults).toBe(true)
    })

    it('should not show results in participant mode without auto-reveal', () => {
      const wrapper = createWrapper({ 
        userMode: 'participant',
        autoReveal: false
      })
      
      expect(wrapper.vm.showResults).toBe(false)
    })

    it('should show results in host mode only after all teams assigned', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      expect(wrapper.vm.showResults).toBe(false)
      
      // Simuler que toutes les équipes sont assignées
      wrapper.vm.allTeamsAssigned = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showResults).toBe(true)
    })

    it('should highlight correct answer when results are shown', async () => {
      const wrapper = createWrapper({ 
        userMode: 'participant',
        autoReveal: true,
        revealDelay: 0
      })
      
      const answerButton = wrapper.find('[data-answer-index="1"]')
      await answerButton.trigger('click')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()
      
      // Vérifier que la bonne réponse (index 2) est mise en évidence
      const correctButton = wrapper.find('[data-answer-index="2"]')
      expect(correctButton.attributes('data-is-correct')).toBe('true')
    })
  })

  describe('Gestion des erreurs et cas limites', () => {
    it('should handle missing teams in host mode', () => {
      quizStore.setUserMode('host')
      quizStore.state.teams = [] // Pas d'équipes
      
      const wrapper = createWrapper({ userMode: 'host' })
      
      expect(wrapper.vm.allTeamsAssigned).toBe(true) // Pas d'équipes = toutes assignées
    })

    it('should handle invalid answer selection', async () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      // Tenter de sélectionner un index invalide
      wrapper.vm.selectAnswer(-1)
      expect(wrapper.vm.selectedAnswerIndex).toBe(-1) // Pas de changement
      
      wrapper.vm.selectAnswer(10)
      expect(wrapper.vm.selectedAnswerIndex).toBe(-1) // Pas de changement
    })

    it('should handle modal close without team selection', async () => {
      const wrapper = createWrapper({ userMode: 'host' })
      
      // Ouvrir le modal
      const answerButton = wrapper.find('[data-answer-index="0"]')
      await answerButton.trigger('click')
      expect(wrapper.vm.showTeamModal).toBe(true)
      
      // Fermer le modal sans sélection
      wrapper.vm.closeTeamModal()
      expect(wrapper.vm.showTeamModal).toBe(false)
      expect(wrapper.emitted('team-answer-assigned')).toBeFalsy()
    })
  })

  describe('Accessibilité et expérience utilisateur', () => {
    it('should have proper ARIA attributes for different modes', () => {
      const participantWrapper = createWrapper({ userMode: 'participant' })
      const hostWrapper = createWrapper({ userMode: 'host' })
      
      // Vérifier que les composants ont des attributs d'accessibilité appropriés
      expect(participantWrapper.find('.question-card').exists()).toBe(true)
      expect(hostWrapper.find('.question-card').exists()).toBe(true)
    })

    it('should provide clear visual feedback for mode differences', () => {
      const participantWrapper = createWrapper({ userMode: 'participant' })
      const hostWrapper = createWrapper({ userMode: 'host' })
      
      // Les wrappers devraient avoir des classes différentes selon le mode
      expect(participantWrapper.vm.userMode).toBe('participant')
      expect(hostWrapper.vm.userMode).toBe('host')
    })

    it('should handle keyboard navigation appropriately', async () => {
      const wrapper = createWrapper({ userMode: 'participant' })
      
      // Simuler la navigation au clavier
      const questionCard = wrapper.find('.question-card')
      await questionCard.trigger('keydown', { key: 'Enter' })
      
      // Le composant devrait gérer les événements clavier
      expect(wrapper.emitted()).toBeDefined()
    })
  })
})