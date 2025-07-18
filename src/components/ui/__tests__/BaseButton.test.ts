import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../BaseButton.vue'

describe('BaseButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('btn-brand')
    expect(wrapper.classes()).toContain('btn-md')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('applies variant classes correctly', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Button' }
    })
    
    expect(wrapper.classes()).toContain('btn-alt')
  })

  it('applies size classes correctly', () => {
    const wrapper = mount(BaseButton, {
      props: { size: 'lg' },
      slots: { default: 'Button' }
    })
    
    expect(wrapper.classes()).toContain('btn-lg')
  })

  it('handles disabled state', () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: 'Button' }
    })
    
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('opacity-50')
    expect(wrapper.classes()).toContain('cursor-not-allowed')
  })

  it('emits click event', async () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Button' }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: 'Button' }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('sets correct button type', () => {
    const wrapper = mount(BaseButton, {
      props: { type: 'submit' },
      slots: { default: 'Submit' }
    })
    
    expect(wrapper.attributes('type')).toBe('submit')
  })
})