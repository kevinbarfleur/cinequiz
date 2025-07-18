import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '../HomeView.vue'
import { useQuizStore } from '@/stores/quiz'

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/quiz', component: { template: '<div>Quiz</div>' } },
    { path: '/team-setup', component: { template: '<div>Team Setup</div>' } }
  ]
})

describe('HomeView - Mode Selection', () => {
  let pinia: ReturnType<typeof createPinia>
  let quizStore: ReturnType<typeof useQuizStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    quizStore = useQuizStore()
  })

  const createWrapper = () => {
    return mount(HomeView, {
      global: {
        plugins: [router, pinia],
        stubs: {
          BaseButton: { 
            template: '<button class="base-button" @click="$emit(\'click\')"><slot /></button>',
            emits: ['click']
          },
          BaseCard: { 
            template: '<div class="base-card" @click="$emit(\'click\')"><slot /></div>',
            emits: ['click']
          }
        }
      }
    })
  }

  describe('Interface de sélection de mode', () => {
    it('should display both mode cards', () => {
      const wrapper = createWrapper()
      
      const modeCards = wrapper.findAll('.mode-card')
      expect(modeCards).toHaveLength(2)
      
      expect(wrapper.find('.mode-card-host').exists()).toBe(true)
      expect(wrapper.find('.mode-card-participant').exists()).toBe(true)
    })

    it('should display host mode card correctly', () => {
      const wrapper = createWrapper()
      
      const hostCard = wrapper.find('.mode-card-host')
      expect(hostCard.exists()).toBe(true)
      expect(hostCard.find('.mode-name').text()).toBe('Mode Animateur')
      expect(hostCard.find('.mode-icon').text()).toBe('🎯')
      expect(hostCard.find('.mode-description').text()).toContain('Gérez les équipes')
      
      const features = hostCard.findAll('.mode-features li')
      expect(features).toHaveLength(4)
      expect(features[0].text()).toContain('Création et gestion d\'équipes')
      expect(features[1].text()).toContain('Contrôle du déroulement')
      expect(features[2].text()).toContain('Résultats détaillés par équipe')
      expect(features[3].text()).toContain('Classement final')
    })

    it('should display participant mode card correctly', () => {
      const wrapper = createWrapper()
      
      const participantCard = wrapper.find('.mode-card-participant')
      expect(participantCard.exists()).toBe(true)
      expect(participantCard.find('.mode-name').text()).toBe('Mode Participant')
      expect(participantCard.find('.mode-icon').text()).toBe('🎪')
      expect(participantCard.find('.mode-description').text()).toContain('Répondez aux questions à votre rythme')
      
      const features = participantCard.findAll('.mode-features li')
      expect(features).toHaveLength(4)
      expect(features[0].text()).toContain('Navigation libre')
      expect(features[1].text()).toContain('Réponses à votre rythme')
      expect(features[2].text()).toContain('Focus sur le jeu')
      expect(features[3].text()).toContain('Interface simplifiée')
    })

    it('should display mode buttons with correct text', () => {
      const wrapper = createWrapper()
      
      const hostButton = wrapper.find('.mode-card-host .mode-button')
      expect(hostButton.text()).toContain('Animer le Quiz')
      expect(hostButton.text()).toContain('👑')
      
      const participantButton = wrapper.find('.mode-card-participant .mode-button')
      expect(participantButton.text()).toContain('Jouer au Quiz')
      expect(participantButton.text()).toContain('🎮')
    })
  })

  describe('Sélection du mode animateur', () => {
    it('should set host mode when host card is clicked', async () => {
      const wrapper = createWrapper()
      const setUserModeSpy = vi.spyOn(quizStore, 'setUserMode')
      
      const hostCard = wrapper.find('.mode-card-host')
      await hostCard.trigger('click')
      
      expect(setUserModeSpy).toHaveBeenCalledWith('host')
    })

    it('should navigate to team setup when host mode is selected', async () => {
      const wrapper = createWrapper()
      const pushSpy = vi.spyOn(router, 'push')
      
      await wrapper.vm.selectMode('host')
      
      expect(pushSpy).toHaveBeenCalledWith('/team-setup')
    })

    it('should set host mode and navigate when host button is clicked', async () => {
      const wrapper = createWrapper()
      const setUserModeSpy = vi.spyOn(quizStore, 'setUserMode')
      const pushSpy = vi.spyOn(router, 'push')
      
      const hostButton = wrapper.find('.mode-card-host .mode-button')
      await hostButton.trigger('click')
      
      expect(setUserModeSpy).toHaveBeenCalledWith('host')
      expect(pushSpy).toHaveBeenCalledWith('/team-setup')
    })

    it('should handle host mode selection workflow', async () => {
      const wrapper = createWrapper()
      
      // Simuler la sélection du mode host
      await wrapper.vm.selectMode('host')
      
      expect(quizStore.state.userMode).toBe('host')
    })
  })

  describe('Sélection du mode participant', () => {
    it('should set participant mode when participant card is clicked', async () => {
      const wrapper = createWrapper()
      const setUserModeSpy = vi.spyOn(quizStore, 'setUserMode')
      
      const participantCard = wrapper.find('.mode-card-participant')
      await participantCard.trigger('click')
      
      expect(setUserModeSpy).toHaveBeenCalledWith('participant')
    })

    it('should navigate to quiz when participant mode is selected', async () => {
      const wrapper = createWrapper()
      const pushSpy = vi.spyOn(router, 'push')
      
      await wrapper.vm.selectMode('participant')
      
      expect(pushSpy).toHaveBeenCalledWith('/quiz')
    })

    it('should set participant mode and navigate when participant button is clicked', async () => {
      const wrapper = createWrapper()
      const setUserModeSpy = vi.spyOn(quizStore, 'setUserMode')
      const pushSpy = vi.spyOn(router, 'push')
      
      const participantButton = wrapper.find('.mode-card-participant .mode-button')
      await participantButton.trigger('click')
      
      expect(setUserModeSpy).toHaveBeenCalledWith('participant')
      expect(pushSpy).toHaveBeenCalledWith('/quiz')
    })

    it('should handle participant mode selection workflow', async () => {
      const wrapper = createWrapper()
      
      // Simuler la sélection du mode participant
      await wrapper.vm.selectMode('participant')
      
      expect(quizStore.state.userMode).toBe('participant')
    })
  })

  describe('Méthode startQuiz (comportement par défaut)', () => {
    it('should default to participant mode when startQuiz is called', async () => {
      const wrapper = createWrapper()
      const selectModeSpy = vi.spyOn(wrapper.vm, 'selectMode')
      
      await wrapper.vm.startQuiz()
      
      expect(selectModeSpy).toHaveBeenCalledWith('participant')
    })
  })

  describe('Validation des modes', () => {
    it('should handle invalid mode gracefully', async () => {
      const wrapper = createWrapper()
      const setUserModeSpy = vi.spyOn(quizStore, 'setUserMode')
      
      // Tenter de définir un mode invalide
      const result = quizStore.setUserMode('invalid' as any)
      
      expect(result).toBe(false)
      expect(quizStore.state.error).toBeDefined()
    })

    it('should validate mode before navigation', async () => {
      const wrapper = createWrapper()
      
      // Mock setUserMode pour retourner false
      vi.spyOn(quizStore, 'setUserMode').mockReturnValue(false)
      const pushSpy = vi.spyOn(router, 'push')
      
      await wrapper.vm.selectMode('host')
      
      // La navigation ne devrait pas avoir lieu si setUserMode échoue
      expect(pushSpy).not.toHaveBeenCalled()
    })
  })

  describe('Interface utilisateur et animations', () => {
    it('should trigger animations on mount', async () => {
      const wrapper = createWrapper()
      
      expect(wrapper.vm.isLoaded).toBe(false)
      
      // Attendre que les animations se déclenchent
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(wrapper.vm.isLoaded).toBe(true)
    })

    it('should apply correct CSS classes for animations', async () => {
      const wrapper = createWrapper()
      
      // Déclencher les animations
      wrapper.vm.isLoaded = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.hero-section.animate-in').exists()).toBe(true)
      expect(wrapper.find('.app-icon.animate-bounce-in').exists()).toBe(true)
      expect(wrapper.find('.main-title.animate-slide-up').exists()).toBe(true)
    })

    it('should apply hover effects to mode cards', () => {
      const wrapper = createWrapper()
      
      const hostCard = wrapper.find('.mode-card-host')
      const participantCard = wrapper.find('.mode-card-participant')
      
      expect(hostCard.classes()).toContain('mode-card')
      expect(participantCard.classes()).toContain('mode-card')
    })
  })

  describe('Accessibilité et expérience utilisateur', () => {
    it('should have proper semantic structure', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('h1').exists()).toBe(true)
      expect(wrapper.find('h2').exists()).toBe(true)
      expect(wrapper.findAll('h3')).toHaveLength(5) // 2 mode cards + 3 feature cards
    })

    it('should have descriptive button text', () => {
      const wrapper = createWrapper()
      
      const buttons = wrapper.findAll('.mode-button')
      expect(buttons[0].text()).toContain('Animer le Quiz')
      expect(buttons[1].text()).toContain('Jouer au Quiz')
    })

    it('should provide clear mode descriptions', () => {
      const wrapper = createWrapper()
      
      const hostDescription = wrapper.find('.mode-card-host .mode-description')
      const participantDescription = wrapper.find('.mode-card-participant .mode-description')
      
      expect(hostDescription.text()).toContain('Gérez les équipes')
      expect(participantDescription.text()).toContain('navigation libre')
    })
  })

  describe('Intégration avec le store', () => {
    it('should interact correctly with quiz store', async () => {
      const wrapper = createWrapper()
      
      // Vérifier l'état initial
      expect(quizStore.state.userMode).toBe('participant') // Mode par défaut
      
      // Changer de mode
      await wrapper.vm.selectMode('host')
      expect(quizStore.state.userMode).toBe('host')
      
      await wrapper.vm.selectMode('participant')
      expect(quizStore.state.userMode).toBe('participant')
    })

    it('should handle store errors gracefully', async () => {
      const wrapper = createWrapper()
      
      // Simuler une erreur dans le store
      vi.spyOn(quizStore, 'setUserMode').mockImplementation(() => {
        quizStore.state.error = 'Erreur de test'
        return false
      })
      
      await wrapper.vm.selectMode('host')
      
      expect(quizStore.state.error).toBe('Erreur de test')
    })
  })

  describe('Navigation et routage', () => {
    it('should navigate to correct routes based on mode', async () => {
      const wrapper = createWrapper()
      const pushSpy = vi.spyOn(router, 'push')
      
      // Test navigation pour mode host
      await wrapper.vm.selectMode('host')
      expect(pushSpy).toHaveBeenCalledWith('/team-setup')
      
      // Test navigation pour mode participant
      await wrapper.vm.selectMode('participant')
      expect(pushSpy).toHaveBeenCalledWith('/quiz')
    })

    it('should handle navigation errors', async () => {
      const wrapper = createWrapper()
      
      // Mock router.push pour simuler une erreur
      vi.spyOn(router, 'push').mockRejectedValue(new Error('Navigation error'))
      
      // La sélection de mode ne devrait pas planter
      await expect(wrapper.vm.selectMode('host')).resolves.not.toThrow()
    })
  })

  describe('Responsive design et mobile', () => {
    it('should have mobile-friendly structure', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.home-container').exists()).toBe(true)
      expect(wrapper.find('.hero-section').exists()).toBe(true)
      expect(wrapper.find('.mode-cards').exists()).toBe(true)
    })

    it('should display feature cards for additional information', () => {
      const wrapper = createWrapper()
      
      const featureCards = wrapper.findAll('.feature-card')
      expect(featureCards).toHaveLength(3)
      
      expect(featureCards[0].find('.feature-title').text()).toBe('Questions Variées')
      expect(featureCards[1].find('.feature-title').text()).toBe('Mobile-First')
      expect(featureCards[2].find('.feature-title').text()).toBe('Score & Stats')
    })
  })

  describe('Cas d\'usage complexes', () => {
    it('should handle rapid mode switching', async () => {
      const wrapper = createWrapper()
      
      // Changer rapidement de mode plusieurs fois
      await wrapper.vm.selectMode('host')
      await wrapper.vm.selectMode('participant')
      await wrapper.vm.selectMode('host')
      
      expect(quizStore.state.userMode).toBe('host')
    })

    it('should maintain consistent state during mode selection', async () => {
      const wrapper = createWrapper()
      
      // Sélectionner le mode host
      await wrapper.vm.selectMode('host')
      
      // Vérifier que l'état est cohérent
      expect(quizStore.state.userMode).toBe('host')
      expect(quizStore.state.teams.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle mode selection with existing quiz data', async () => {
      const wrapper = createWrapper()
      
      // Ajouter des données de quiz existantes
      quizStore.loadQuestions([
        { id: 'q1', question: 'Test?', answers: ['A', 'B'], correctAnswer: 0 }
      ])
      
      // Sélectionner un mode
      await wrapper.vm.selectMode('host')
      
      // Les données existantes devraient être préservées
      expect(quizStore.state.questions).toHaveLength(1)
      expect(quizStore.state.userMode).toBe('host')
    })
  })
})