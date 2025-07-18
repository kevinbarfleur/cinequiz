import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestionNavigation from '../QuestionNavigation.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseProgressBar from '@/components/ui/BaseProgressBar.vue'

// Mock des composants UI
vi.mock('@/components/ui/BaseButton.vue', () => ({
  default: {
    name: 'BaseButton',
    template: '<button><slot /></button>',
    props: ['variant', 'size', 'disabled']
  }
}))

vi.mock('@/components/ui/BaseProgressBar.vue', () => ({
  default: {
    name: 'BaseProgressBar',
    template: '<div class="progress-bar"></div>',
    props: ['value', 'show-label', 'color', 'size', 'animated']
  }
}))

describe('QuestionNavigation', () => {
  const defaultProps = {
    currentQuestion: 3,
    totalQuestions: 10,
    userMode: 'participant' as const,
    hasPrevious: true,
    hasNext: true,
    canProceed: true,
    hasAnswered: false,
    assignedTeamsCount: 0,
    totalTeams: 0
  }

  describe('Participant Mode', () => {
    it('should render participant navigation correctly', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'participant'
        }
      })

      expect(wrapper.find('.participant-nav').exists()).toBe(true)
      expect(wrapper.find('.host-nav').exists()).toBe(false)
      expect(wrapper.find('.default-nav').exists()).toBe(false)
    })

    it('should show correct question progress', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          currentQuestion: 3,
          totalQuestions: 10
        }
      })

      const currentQuestion = wrapper.find('.current-question')
      const totalQuestions = wrapper.find('.total-questions')
      
      expect(currentQuestion.text()).toBe('3')
      expect(totalQuestions.text()).toBe('10')
    })

    it('should disable previous button when hasPrevious is false', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          hasPrevious: false
        }
      })

      const prevButton = wrapper.findAllComponents(BaseButton)[0]
      expect(prevButton.props('disabled')).toBe(true)
    })

    it('should disable next button when hasNext is false', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          hasNext: false
        }
      })

      const nextButton = wrapper.findAllComponents(BaseButton)[1]
      expect(nextButton.props('disabled')).toBe(true)
    })

    it('should show "Terminer" text on last question', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          currentQuestion: 10,
          totalQuestions: 10
        }
      })

      expect(wrapper.text()).toContain('Terminer')
    })

    it('should show answered status when hasAnswered is true', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          hasAnswered: true
        }
      })

      expect(wrapper.find('.answered-status').exists()).toBe(true)
      expect(wrapper.find('.unanswered-status').exists()).toBe(false)
      expect(wrapper.text()).toContain('Réponse enregistrée')
    })

    it('should show unanswered status when hasAnswered is false', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          hasAnswered: false
        }
      })

      expect(wrapper.find('.answered-status').exists()).toBe(false)
      expect(wrapper.find('.unanswered-status').exists()).toBe(true)
      expect(wrapper.text()).toContain('Aucune réponse')
    })

    it('should emit previous event when previous button is clicked', async () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          hasPrevious: true
        }
      })

      const prevButton = wrapper.findAllComponents(BaseButton)[0]
      await prevButton.trigger('click')

      expect(wrapper.emitted('previous')).toBeTruthy()
      expect(wrapper.emitted('previous')).toHaveLength(1)
    })

    it('should emit next event when next button is clicked', async () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          hasNext: true
        }
      })

      const nextButton = wrapper.findAllComponents(BaseButton)[1]
      await nextButton.trigger('click')

      expect(wrapper.emitted('next')).toBeTruthy()
      expect(wrapper.emitted('next')).toHaveLength(1)
    })
  })

  describe('Host Mode', () => {
    it('should render host navigation correctly', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          totalTeams: 4,
          assignedTeamsCount: 2
        }
      })

      expect(wrapper.find('.host-nav').exists()).toBe(true)
      expect(wrapper.find('.participant-nav').exists()).toBe(false)
      expect(wrapper.find('.default-nav').exists()).toBe(false)
    })

    it('should show team assignment status', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          totalTeams: 4,
          assignedTeamsCount: 2
        }
      })

      expect(wrapper.text()).toContain('Attribution des équipes')
      expect(wrapper.text()).toContain('2/4')
    })

    it('should show validation message when not all teams are assigned', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          totalTeams: 4,
          assignedTeamsCount: 2,
          canProceed: false
        }
      })

      expect(wrapper.find('.validation-message').exists()).toBe(true)
      expect(wrapper.find('.validation-success').exists()).toBe(false)
      expect(wrapper.text()).toContain('Attribuez une réponse à chaque équipe')
    })

    it('should show validation success when all teams are assigned', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          totalTeams: 4,
          assignedTeamsCount: 4,
          canProceed: true
        }
      })

      expect(wrapper.find('.validation-message').exists()).toBe(false)
      expect(wrapper.find('.validation-success').exists()).toBe(true)
      expect(wrapper.text()).toContain('Toutes les équipes sont assignées')
    })

    it('should disable proceed button when canProceed is false', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          canProceed: false
        }
      })

      const proceedButton = wrapper.findComponent(BaseButton)
      expect(proceedButton.props('disabled')).toBe(true)
    })

    it('should emit next event when proceed button is clicked', async () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          canProceed: true
        }
      })

      const proceedButton = wrapper.findComponent(BaseButton)
      await proceedButton.trigger('click')

      expect(wrapper.emitted('next')).toBeTruthy()
      expect(wrapper.emitted('next')).toHaveLength(1)
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          currentQuestion: 3,
          totalQuestions: 10
        }
      })

      // Question 3 of 10 means we've completed 2 questions, so progress is 20%
      const progressBar = wrapper.findComponent(BaseProgressBar)
      expect(progressBar.props('value')).toBe(20)
    })

    it('should calculate assignment progress correctly', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          assignedTeamsCount: 3,
          totalTeams: 4
        }
      })

      // 3 out of 4 teams assigned = 75%
      const progressBars = wrapper.findAllComponents(BaseProgressBar)
      const assignmentProgressBar = progressBars.find(pb => pb.props('color') === 'secondary')
      expect(assignmentProgressBar?.props('value')).toBe(75)
    })

    it('should handle zero total questions gracefully', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          currentQuestion: 0,
          totalQuestions: 0
        }
      })

      const progressBar = wrapper.findComponent(BaseProgressBar)
      expect(progressBar.props('value')).toBe(0)
    })

    it('should handle zero total teams gracefully', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'host',
          assignedTeamsCount: 0,
          totalTeams: 0
        }
      })

      const progressBars = wrapper.findAllComponents(BaseProgressBar)
      const assignmentProgressBar = progressBars.find(pb => pb.props('color') === 'secondary')
      expect(assignmentProgressBar?.props('value')).toBe(0)
    })
  })

  describe('Default Mode', () => {
    it('should render default navigation when invalid mode is specified', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'invalid' as any
        }
      })

      expect(wrapper.find('.default-nav').exists()).toBe(true)
      expect(wrapper.find('.participant-nav').exists()).toBe(false)
      expect(wrapper.find('.host-nav').exists()).toBe(false)
    })

    it('should show question counter in default mode', () => {
      const wrapper = mount(QuestionNavigation, {
        props: {
          ...defaultProps,
          userMode: 'invalid' as any,
          currentQuestion: 5,
          totalQuestions: 8
        }
      })

      expect(wrapper.text()).toContain('Question 5 sur 8')
    })
  })
})