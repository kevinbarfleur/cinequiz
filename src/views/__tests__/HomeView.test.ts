import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../HomeView.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/quiz', component: { template: '<div>Quiz</div>' } }
  ]
})

describe('HomeView', () => {
  it('renders main title and subtitle correctly', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        components: {
          BaseButton,
          BaseCard
        }
      }
    })

    expect(wrapper.find('.main-title').text()).toBe('Quiz Cinéma')
    expect(wrapper.find('.subtitle').text()).toContain('Testez vos connaissances cinéma')
  })

  it('displays all feature cards', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        components: {
          BaseButton,
          BaseCard
        }
      }
    })

    const featureCards = wrapper.findAll('.feature-card')
    expect(featureCards).toHaveLength(3)
    
    // Check feature titles
    const featureTitles = wrapper.findAll('.feature-title')
    expect(featureTitles[0].text()).toBe('Questions Variées')
    expect(featureTitles[1].text()).toBe('Mobile-First')
    expect(featureTitles[2].text()).toBe('Score & Stats')
  })

  it('has a start quiz button that navigates to quiz page', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        components: {
          BaseButton,
          BaseCard
        }
      }
    })

    const startButton = wrapper.findComponent(BaseButton)
    expect(startButton.exists()).toBe(true)
    expect(startButton.text()).toContain('Commencer le Quiz')

    // Test button click navigation
    const pushSpy = vi.spyOn(router, 'push')
    await startButton.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/quiz')
  })

  it('applies animation classes when loaded', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        components: {
          BaseButton,
          BaseCard
        }
      }
    })

    // Wait for animations to trigger
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.app-icon').classes()).toContain('animate-bounce-in')
    expect(wrapper.find('.main-title').classes()).toContain('animate-slide-up')
    expect(wrapper.find('.subtitle').classes()).toContain('animate-slide-up-delay')
  })

  it('has proper mobile-first responsive structure', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        components: {
          BaseButton,
          BaseCard
        }
      }
    })

    // Check main container structure
    expect(wrapper.find('.home-container').exists()).toBe(true)
    expect(wrapper.find('.hero-section').exists()).toBe(true)
    expect(wrapper.find('.features-grid').exists()).toBe(true)
    
    // Check that features grid uses CSS Grid
    const featuresGrid = wrapper.find('.features-grid')
    expect(featuresGrid.exists()).toBe(true)
  })

  it('includes accessibility features', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        components: {
          BaseButton,
          BaseCard
        }
      }
    })

    // Check that button has proper structure for screen readers
    const startButton = wrapper.findComponent(BaseButton)
    expect(startButton.exists()).toBe(true)
    
    // Check semantic HTML structure
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.findAll('h3')).toHaveLength(3) // Feature titles
  })

  it('has background decorations for visual appeal', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        components: {
          BaseButton,
          BaseCard
        }
      }
    })

    expect(wrapper.find('.bg-decorations').exists()).toBe(true)
    expect(wrapper.findAll('.decoration')).toHaveLength(3)
  })
})