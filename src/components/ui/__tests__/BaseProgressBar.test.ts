import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseProgressBar from '../BaseProgressBar.vue'

describe('BaseProgressBar', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { value: 50 }
    })
    
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('aria-valuenow')).toBe('50')
    expect(progressBar.attributes('aria-valuemin')).toBe('0')
    expect(progressBar.attributes('aria-valuemax')).toBe('100')
  })

  it('displays correct percentage', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { value: 75 }
    })
    
    expect(wrapper.text()).toContain('75%')
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.attributes('style')).toContain('width: 75%')
  })

  it('displays label when provided', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 30,
        label: 'Loading progress'
      }
    })
    
    expect(wrapper.text()).toContain('Loading progress')
  })

  it('hides label when showLabel is false', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 30,
        label: 'Loading progress',
        showLabel: false
      }
    })
    
    expect(wrapper.text()).not.toContain('Loading progress')
    expect(wrapper.text()).not.toContain('30%')
  })

  it('applies color classes correctly', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 50,
        color: 'success'
      }
    })
    
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.classes()).toContain('bg-success')
  })

  it('applies size classes correctly', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 50,
        size: 'lg'
      }
    })
    
    const container = wrapper.find('.w-full')
    expect(container.classes()).toContain('h-4')
  })

  it('clamps value between 0 and 100', () => {
    const wrapperNegative = mount(BaseProgressBar, {
      props: { value: -10 }
    })
    
    const wrapperOver = mount(BaseProgressBar, {
      props: { value: 150 }
    })
    
    const negativeBar = wrapperNegative.find('[role="progressbar"]')
    const overBar = wrapperOver.find('[role="progressbar"]')
    
    expect(negativeBar.attributes('style')).toContain('width: 0%')
    expect(overBar.attributes('style')).toContain('width: 100%')
  })

  it('shows shine animation when animated is true', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 50,
        animated: true
      }
    })
    
    expect(wrapper.find('.progress-shine').exists()).toBe(true)
  })

  it('hides shine animation when animated is false', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 50,
        animated: false
      }
    })
    
    expect(wrapper.find('.progress-shine').exists()).toBe(false)
  })

  it('uses ariaLabel when provided', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 50,
        label: 'Progress',
        ariaLabel: 'Custom aria label'
      }
    })
    
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.attributes('aria-label')).toBe('Custom aria label')
  })

  it('falls back to label for aria-label when ariaLabel not provided', () => {
    const wrapper = mount(BaseProgressBar, {
      props: { 
        value: 50,
        label: 'Progress label'
      }
    })
    
    const progressBar = wrapper.find('[role="progressbar"]')
    expect(progressBar.attributes('aria-label')).toBe('Progress label')
  })
})