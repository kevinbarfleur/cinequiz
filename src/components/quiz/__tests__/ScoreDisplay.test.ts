import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ScoreDisplay from '../ScoreDisplay.vue'
import type { QuizStats } from '@/types'

// Mock des composants UI
vi.mock('@/components/ui/BaseCard.vue', () => ({
  default: {
    name: 'BaseCard',
    template: '<div class="base-card"><slot /></div>',
    props: ['variant', 'padding']
  }
}))

vi.mock('@/components/ui/BaseButton.vue', () => ({
  default: {
    name: 'BaseButton',
    template: '<button class="base-button" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'size'],
    emits: ['click']
  }
}))

describe('ScoreDisplay', () => {
  const mockStats: QuizStats = {
    totalQuestions: 10,
    correctAnswers: 7,
    incorrectAnswers: 3,
    scorePercentage: 70,
    timeSpent: 125, // 2m 5s
    averageTimePerQuestion: 12.5
  }

  const defaultProps = {
    score: 7,
    totalQuestions: 10,
    stats: mockStats
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendu de base', () => {
    it('devrait rendre le composant correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      expect(wrapper.find('.score-display').exists()).toBe(true)
      expect(wrapper.find('.score-animation-container').exists()).toBe(true)
      expect(wrapper.find('.encouragement-section').exists()).toBe(true)
      expect(wrapper.find('.stats-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-buttons').exists()).toBe(true)
    })

    it('devrait afficher le score en pourcentage', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      // Le score animé commence à 0 et s'anime vers 70%
      expect(wrapper.find('.score-percentage').exists()).toBe(true)
      expect(wrapper.find('.score-symbol').text()).toBe('%')
    })

    it('devrait afficher les statistiques correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      const statItems = wrapper.findAll('.stat-item')
      expect(statItems).toHaveLength(2)
      
      // Bonnes réponses
      expect(statItems[0].find('.stat-value').text()).toBe('7')
      expect(statItems[0].find('.stat-label').text()).toBe('Bonnes réponses')
      
      // Erreurs
      expect(statItems[1].find('.stat-value').text()).toBe('3')
      expect(statItems[1].find('.stat-label').text()).toBe('Erreurs')
    })

    it('devrait formater le temps correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      const timeElement = wrapper.find('.time-stat .stat-value')
      expect(timeElement.text()).toBe('2m 5s')
    })
  })

  describe('Messages d\'encouragement', () => {
    it('devrait afficher le message pour un score parfait (100%)', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 10,
          totalQuestions: 10,
          stats: { ...mockStats, correctAnswers: 10, incorrectAnswers: 0, scorePercentage: 100 }
        }
      })

      expect(wrapper.find('.encouragement-title').text()).toBe('Parfait ! 🌟')
      expect(wrapper.find('.encouragement-text').text()).toContain('Tu es une vraie experte du cinéma')
    })

    it('devrait afficher le message pour un excellent score (90-99%)', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 9,
          totalQuestions: 10,
          stats: { ...mockStats, correctAnswers: 9, incorrectAnswers: 1, scorePercentage: 90 }
        }
      })

      expect(wrapper.find('.encouragement-title').text()).toBe('Excellent ! 🎬')
      expect(wrapper.find('.encouragement-text').text()).toContain('Impressionnant')
    })

    it('devrait afficher le message pour un bon score (75-89%)', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 8,
          totalQuestions: 10,
          stats: { ...mockStats, correctAnswers: 8, incorrectAnswers: 2, scorePercentage: 80 }
        }
      })

      expect(wrapper.find('.encouragement-title').text()).toBe('Très bien ! 🎭')
      expect(wrapper.find('.encouragement-text').text()).toContain('Belle performance')
    })

    it('devrait afficher le message pour un score moyen (50-74%)', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      expect(wrapper.find('.encouragement-title').text()).toBe('Pas mal ! 🍿')
      expect(wrapper.find('.encouragement-text').text()).toContain('C\'est un bon début')
    })

    it('devrait afficher le message pour un score faible (25-49%)', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 3,
          totalQuestions: 10,
          stats: { ...mockStats, correctAnswers: 3, incorrectAnswers: 7, scorePercentage: 30 }
        }
      })

      expect(wrapper.find('.encouragement-title').text()).toBe('On progresse ! 🎪')
      expect(wrapper.find('.encouragement-text').text()).toContain('Il y a du potentiel')
    })

    it('devrait afficher le message pour un très faible score (0-24%)', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 1,
          totalQuestions: 10,
          stats: { ...mockStats, correctAnswers: 1, incorrectAnswers: 9, scorePercentage: 10 }
        }
      })

      expect(wrapper.find('.encouragement-title').text()).toBe('Courage ! 🎨')
      expect(wrapper.find('.encouragement-text').text()).toContain('Ce n\'est qu\'un début')
    })
  })

  describe('Classes CSS du cercle de score', () => {
    it('devrait appliquer la classe "score-excellent" pour un score >= 90%', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 9,
          totalQuestions: 10,
          stats: { ...mockStats, scorePercentage: 90 }
        }
      })

      expect(wrapper.find('.score-circle').classes()).toContain('score-excellent')
    })

    it('devrait appliquer la classe "score-good" pour un score >= 75%', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 8,
          totalQuestions: 10,
          stats: { ...mockStats, scorePercentage: 80 }
        }
      })

      expect(wrapper.find('.score-circle').classes()).toContain('score-good')
    })

    it('devrait appliquer la classe "score-average" pour un score >= 50%', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      expect(wrapper.find('.score-circle').classes()).toContain('score-average')
    })

    it('devrait appliquer la classe "score-needs-improvement" pour un score < 50%', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 3,
          totalQuestions: 10,
          stats: { ...mockStats, scorePercentage: 30 }
        }
      })

      expect(wrapper.find('.score-circle').classes()).toContain('score-needs-improvement')
    })
  })

  describe('Badge nouveau record', () => {
    it('devrait afficher le badge quand isNewBestScore est true', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          isNewBestScore: true
        }
      })

      expect(wrapper.find('.new-best-badge').exists()).toBe(true)
      expect(wrapper.find('.badge-content').text()).toContain('Nouveau record personnel')
    })

    it('ne devrait pas afficher le badge quand isNewBestScore est false', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          isNewBestScore: false
        }
      })

      expect(wrapper.find('.new-best-badge').exists()).toBe(false)
    })
  })

  describe('Boutons de navigation', () => {
    it('devrait émettre l\'événement "restart" quand le bouton rejouer est cliqué', async () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      const restartButton = wrapper.findAll('.base-button')[0]
      await restartButton.trigger('click')

      expect(wrapper.emitted('restart')).toHaveLength(1)
    })

    it('devrait émettre l\'événement "home" quand le bouton accueil est cliqué', async () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      const homeButton = wrapper.findAll('.base-button')[1]
      await homeButton.trigger('click')

      expect(wrapper.emitted('home')).toHaveLength(1)
    })

    it('devrait afficher les textes corrects sur les boutons', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      const buttons = wrapper.findAll('.base-button')
      expect(buttons[0].text()).toContain('Rejouer')
      expect(buttons[1].text()).toContain('Retour à l\'accueil')
    })
  })

  describe('Animation du score', () => {
    it('devrait commencer l\'animation avec un score de 0', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      // Au début, le score animé devrait être 0
      expect(wrapper.vm.animatedScore).toBe(0)
    })

    it('devrait animer le score vers la valeur finale', async () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      // Déclencher l'animation
      vi.advanceTimersByTime(300) // Délai initial
      await nextTick()

      // Avancer dans l'animation
      vi.advanceTimersByTime(1000) // Milieu de l'animation
      await nextTick()

      // Le score devrait être en cours d'animation (entre 0 et 70)
      expect(wrapper.vm.animatedScore).toBeGreaterThan(0)
      expect(wrapper.vm.animatedScore).toBeLessThanOrEqual(70)

      // Terminer l'animation
      vi.advanceTimersByTime(2000) // Fin de l'animation
      await nextTick()

      // Le score final devrait être atteint
      expect(wrapper.vm.animatedScore).toBe(70)
    })

    it('devrait redémarrer l\'animation quand le score change', async () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      // Attendre la première animation
      vi.advanceTimersByTime(2500)
      await nextTick()

      expect(wrapper.vm.animatedScore).toBe(70)

      // Changer le score
      await wrapper.setProps({
        ...defaultProps,
        score: 9,
        totalQuestions: 10,
        stats: { ...mockStats, scorePercentage: 90 }
      })

      // L'animation devrait redémarrer
      vi.advanceTimersByTime(2500)
      await nextTick()

      expect(wrapper.vm.animatedScore).toBe(90)
    })
  })

  describe('Formatage du temps', () => {
    it('devrait formater les secondes correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          stats: { ...mockStats, timeSpent: 45 }
        }
      })

      expect(wrapper.vm.formatTime(45)).toBe('45s')
    })

    it('devrait formater les minutes et secondes correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          stats: { ...mockStats, timeSpent: 125 }
        }
      })

      expect(wrapper.vm.formatTime(125)).toBe('2m 5s')
    })

    it('devrait formater les heures, minutes et secondes correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          stats: { ...mockStats, timeSpent: 3665 }
        }
      })

      expect(wrapper.vm.formatTime(3665)).toBe('1h 1m')
    })
  })

  describe('Calculs de score', () => {
    it('devrait calculer le pourcentage de score correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      expect(wrapper.vm.scorePercentage).toBe(70)
    })

    it('devrait gérer le cas où totalQuestions est 0', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          totalQuestions: 0,
          stats: { ...mockStats, totalQuestions: 0 }
        }
      })

      expect(wrapper.vm.scorePercentage).toBe(0)
    })

    it('devrait arrondir le pourcentage correctement', () => {
      const wrapper = mount(ScoreDisplay, {
        props: {
          ...defaultProps,
          score: 2,
          totalQuestions: 3, // 66.666...%
          stats: { ...mockStats, totalQuestions: 3, correctAnswers: 2 }
        }
      })

      expect(wrapper.vm.scorePercentage).toBe(67)
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir une structure sémantique correcte', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      expect(wrapper.find('h2').exists()).toBe(true)
      expect(wrapper.find('.score-label').text()).toBe('Score Final')
    })

    it('devrait utiliser des couleurs contrastées pour les différents scores', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      const scoreCircle = wrapper.find('.score-circle')
      expect(scoreCircle.classes()).toContain('score-average')
    })
  })

  describe('Responsive design', () => {
    it('devrait avoir des classes responsive appropriées', () => {
      const wrapper = mount(ScoreDisplay, {
        props: defaultProps
      })

      expect(wrapper.find('.max-w-md').exists()).toBe(true)
      expect(wrapper.find('.mx-auto').exists()).toBe(true)
      expect(wrapper.find('.grid-cols-2').exists()).toBe(true)
    })
  })
})