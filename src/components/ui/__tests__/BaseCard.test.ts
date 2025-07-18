import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCard from '../BaseCard.vue'

describe('BaseCard', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseCard, {
      slots: {
        default: 'Card content'
      }
    })
    
    expect(wrapper.text()).toBe('Card content')
    expect(wrapper.classes()).toContain('bg-surface')
    expect(wrapper.classes()).toContain('rounded-lg')
    expect(wrapper.classes()).toContain('shadow-md')
    expect(wrapper.classes()).toContain('p-4')
  })

  it('applies variant classes correctly', () => {
    const wrapper = mount(BaseCard, {
      props: { variant: 'elevated' },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).toContain('shadow-lg')
  })

  it('applies outlined variant correctly', () => {
    const wrapper = mount(BaseCard, {
      props: { variant: 'outlined' },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).toContain('border')
    expect(wrapper.classes()).toContain('border-gray-200')
    expect(wrapper.classes()).toContain('shadow-sm')
  })

  it('applies padding classes correctly', () => {
    const wrapper = mount(BaseCard, {
      props: { padding: 'lg' },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).toContain('p-6')
  })

  it('applies no padding when padding is none', () => {
    const wrapper = mount(BaseCard, {
      props: { padding: 'none' },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).not.toContain('p-4')
    expect(wrapper.classes()).not.toContain('p-3')
    expect(wrapper.classes()).not.toContain('p-6')
  })

  it('applies hover classes when hover is true', () => {
    const wrapper = mount(BaseCard, {
      props: { hover: true },
      slots: { default: 'Content' }
    })
    
    expect(wrapper.classes()).toContain('hover:shadow-lg')
    expect(wrapper.classes()).toContain('transition-shadow')
    expect(wrapper.classes()).toContain('cursor-pointer')
  })

  it('renders header slot', () => {
    const wrapper = mount(BaseCard, {
      slots: {
        header: 'Card Header',
        default: 'Card Content'
      }
    })
    
    expect(wrapper.text()).toContain('Card Header')
    expect(wrapper.text()).toContain('Card Content')
    expect(wrapper.find('.card-header').exists()).toBe(true)
  })

  it('renders footer slot', () => {
    const wrapper = mount(BaseCard, {
      slots: {
        default: 'Card Content',
        footer: 'Card Footer'
      }
    })
    
    expect(wrapper.text()).toContain('Card Content')
    expect(wrapper.text()).toContain('Card Footer')
    expect(wrapper.find('.card-footer').exists()).toBe(true)
  })

  it('does not render header/footer when slots are empty', () => {
    const wrapper = mount(BaseCard, {
      slots: {
        default: 'Card Content'
      }
    })
    
    expect(wrapper.find('.card-header').exists()).toBe(false)
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})