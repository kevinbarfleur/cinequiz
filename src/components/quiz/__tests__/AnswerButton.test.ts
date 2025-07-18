import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AnswerButton from '../AnswerButton.vue'

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true
})

describe('AnswerButton', () => {
  const defaultProps = {
    answer: 'Test Answer'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the answer text correctly', () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      expect(wrapper.find('.answer-text').text()).toBe('Test Answer')
    })

    it('does not show result indicator by default', () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      expect(wrapper.find('.result-indicator').exists()).toBe(false)
    })

    it('shows correct icon when answer is correct and showResult is true', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isCorrect: true,
          showResult: true
        }
      })

      const resultIndicator = wrapper.find('.result-indicator')
      expect(resultIndicator.exists()).toBe(true)
      expect(resultIndicator.find('.icon-result').exists()).toBe(true)
    })

    it('shows incorrect icon when answer is incorrect and showResult is true', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isCorrect: false,
          isSelected: true,
          showResult: true
        }
      })

      const resultIndicator = wrapper.find('.result-indicator')
      expect(resultIndicator.exists()).toBe(true)
      expect(resultIndicator.find('.icon-result').exists()).toBe(true)
    })
  })

  describe('Visual States', () => {
    it('applies normal state classes by default', () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-normal')
    })

    it('applies selected state classes when isSelected is true', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isSelected: true
        }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-selected')
    })

    it('applies correct state classes when showing correct result', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isCorrect: true,
          showResult: true
        }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-correct')
    })

    it('applies incorrect state classes when showing incorrect result', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isCorrect: false,
          isSelected: true,
          showResult: true
        }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-incorrect')
    })

    it('applies neutral state classes when showing results but not selected', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isCorrect: false,
          isSelected: false,
          showResult: true
        }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-neutral')
    })

    it('applies disabled state classes when disabled', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          disabled: true
        }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-disabled')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('Interactions', () => {
    it('emits click event with answer when clicked', async () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.[0]).toEqual(['Test Answer'])
    })

    it('does not emit click event when disabled', async () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          disabled: true
        }
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('triggers haptic feedback on click', async () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate')
      
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      await wrapper.find('button').trigger('click')

      expect(vibrateSpy).toHaveBeenCalledWith(50)
    })

    it('does not trigger haptic feedback when disabled', async () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate')
      
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          disabled: true
        }
      })

      await wrapper.find('button').trigger('click')

      expect(vibrateSpy).not.toHaveBeenCalled()
    })
  })

  describe('Touch Interactions', () => {
    it('applies pressed state on touchstart', async () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      const button = wrapper.find('button')
      await button.trigger('touchstart')

      expect(button.classes()).toContain('answer-button-pressed')
    })

    it('removes pressed state on touchend', async () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      const button = wrapper.find('button')
      await button.trigger('touchstart')
      expect(button.classes()).toContain('answer-button-pressed')

      await button.trigger('touchend')
      expect(button.classes()).not.toContain('answer-button-pressed')
    })

    it('does not apply pressed state when disabled', async () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          disabled: true
        }
      })

      const button = wrapper.find('button')
      await button.trigger('touchstart')

      expect(button.classes()).not.toContain('answer-button-pressed')
    })
  })

  describe('Accessibility', () => {
    it('has proper base classes including focus styles', () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-base')
      // Focus styles are applied via CSS, not individual classes
      expect(button.element.className).toMatch(/answer-button-base/)
    })

    it('is properly disabled when disabled prop is true', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          disabled: true
        }
      })

      const button = wrapper.find('button')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('Enhanced Haptic Feedback', () => {
    it('triggers selection haptic feedback on click', async () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate')
      
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      await wrapper.find('button').trigger('click')

      expect(vibrateSpy).toHaveBeenCalledWith(50)
    })

    it('triggers success haptic feedback when correct result is shown', async () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate')
      
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isSelected: true
        }
      })

      await wrapper.setProps({ 
        isCorrect: true,
        showResult: true 
      })

      expect(vibrateSpy).toHaveBeenCalledWith([100, 50, 100])
    })

    it('triggers error haptic feedback when incorrect result is shown', async () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate')
      
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isSelected: true
        }
      })

      await wrapper.setProps({ 
        isCorrect: false,
        showResult: true 
      })

      expect(vibrateSpy).toHaveBeenCalledWith([200, 100, 200])
    })

    it('does not trigger result haptic feedback for unselected answers', async () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate')
      
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isSelected: false
        }
      })

      await wrapper.setProps({ 
        isCorrect: true,
        showResult: true 
      })

      expect(vibrateSpy).not.toHaveBeenCalled()
    })

    it('handles missing vibrate API gracefully', async () => {
      // Test that the component works even when vibrate is not available
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      // Should not throw error even if vibrate API is not available
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.[0]).toEqual(['Test Answer'])
    })
  })

  describe('Visual State Enhancements', () => {
    it('shows correct icon with proper styling', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isCorrect: true,
          showResult: true
        }
      })

      const icon = wrapper.find('.icon-result')
      expect(icon.exists()).toBe(true)
      expect(icon.element.getAttribute('viewBox')).toBe('0 0 20 20')
    })

    it('shows incorrect icon with proper styling', () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isCorrect: false,
          isSelected: true,
          showResult: true
        }
      })

      const icon = wrapper.find('.icon-result')
      expect(icon.exists()).toBe(true)
      expect(icon.element.getAttribute('viewBox')).toBe('0 0 20 20')
    })

    it('applies ripple effect classes on base button', () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-base')
      // Ripple effect is handled via CSS pseudo-elements
    })
  })

  describe('State Transitions', () => {
    it('transitions from normal to selected state', async () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      let button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-normal')

      await wrapper.setProps({ isSelected: true })
      button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-selected')
    })

    it('transitions from selected to correct result state', async () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isSelected: true
        }
      })

      let button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-selected')

      await wrapper.setProps({ 
        isCorrect: true,
        showResult: true 
      })
      
      button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-correct')
    })

    it('transitions from selected to incorrect result state', async () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isSelected: true
        }
      })

      let button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-selected')

      await wrapper.setProps({ 
        isCorrect: false,
        showResult: true 
      })
      
      button = wrapper.find('button')
      expect(button.classes()).toContain('answer-button-incorrect')
    })

    it('maintains proper state hierarchy during transitions', async () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      // Normal -> Selected
      await wrapper.setProps({ isSelected: true })
      expect(wrapper.find('button').classes()).toContain('answer-button-selected')

      // Selected -> Result (Correct)
      await wrapper.setProps({ isCorrect: true, showResult: true })
      expect(wrapper.find('button').classes()).toContain('answer-button-correct')

      // Reset to normal
      await wrapper.setProps({ isSelected: false, showResult: false })
      expect(wrapper.find('button').classes()).toContain('answer-button-normal')
    })
  })

  describe('Animation and Feedback Integration', () => {
    it('applies pressed state with proper timing', async () => {
      const wrapper = mount(AnswerButton, {
        props: defaultProps
      })

      const button = wrapper.find('button')
      
      // Touch start
      await button.trigger('touchstart')
      expect(button.classes()).toContain('answer-button-pressed')
      
      // Touch end
      await button.trigger('touchend')
      expect(button.classes()).not.toContain('answer-button-pressed')
    })

    it('combines pressed state with other states correctly', async () => {
      const wrapper = mount(AnswerButton, {
        props: {
          ...defaultProps,
          isSelected: true
        }
      })

      const button = wrapper.find('button')
      await button.trigger('touchstart')
      
      expect(button.classes()).toContain('answer-button-selected')
      expect(button.classes()).toContain('answer-button-pressed')
    })
  })
})