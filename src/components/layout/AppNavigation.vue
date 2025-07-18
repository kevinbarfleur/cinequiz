<template>
  <nav class="app-navigation">
    <!-- Desktop Navigation - Sticky with backdrop blur -->
    <div class="nav-desktop hidden lg:block">
      <div 
        class="fixed top-0 left-0 right-0 z-nav bg-bg/80 backdrop-blur-md border-b border-divider transition-all duration-300"
        :class="{ 'shadow-md': isScrolled }"
      >
        <div class="container-app">
          <div class="flex-between h-16">
            <!-- Logo/Brand -->
            <div class="nav-brand">
              <router-link to="/" class="flex items-center gap-3 link-hover">
                <div class="i-carbon-trophy text-2xl text-brand-1"></div>
                <span class="text-xl font-bold text-gradient-rainbow">Quiz Cinéma</span>
              </router-link>
            </div>

            <!-- Navigation Links -->
            <div class="nav-links flex items-center gap-6">
              <router-link 
                v-for="item in navItems" 
                :key="item.name"
                :to="item.path"
                class="nav-link"
                :class="{ 'nav-link-active': isActiveRoute(item.path) }"
              >
                <div :class="item.icon" class="nav-link-icon"></div>
                <span>{{ item.label }}</span>
              </router-link>
            </div>

            <!-- Action Buttons -->
            <div class="nav-actions flex items-center gap-3">
              <!-- Theme Toggle -->
              <button 
                @click="toggleTheme"
                class="btn-alt btn-sm"
                :title="isDark ? 'Mode clair' : 'Mode sombre'"
              >
                <div :class="isDark ? 'i-carbon-sun' : 'i-carbon-moon'" class="text-lg"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Spacer to prevent content overlap -->
      <div class="h-16"></div>
    </div>

    <!-- Mobile Navigation -->
    <div class="nav-mobile lg:hidden">
      <!-- Mobile Header -->
      <div 
        class="fixed top-0 left-0 right-0 z-nav bg-bg/90 backdrop-blur-md border-b border-divider"
        :class="{ 'shadow-md': isScrolled }"
      >
        <div class="flex-between px-4 h-14">
          <!-- Mobile Logo -->
          <router-link to="/" class="flex items-center gap-2">
            <div class="i-carbon-trophy text-xl text-brand-1"></div>
            <span class="text-lg font-bold text-gradient-rainbow">Quiz Cinéma</span>
          </router-link>

          <!-- Mobile Menu Toggle -->
          <button 
            @click="toggleMobileMenu"
            class="btn-alt btn-sm"
            :aria-label="isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
          >
            <div 
              :class="isMobileMenuOpen ? 'i-carbon-close' : 'i-carbon-menu'" 
              class="text-lg"
            ></div>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Overlay -->
      <transition name="mobile-menu">
        <div 
          v-if="isMobileMenuOpen" 
          class="fixed inset-0 z-sidebar bg-bg-alt/95 backdrop-blur-lg"
          @click="closeMobileMenu"
        >
          <div class="flex flex-col pt-14">
            <!-- Mobile Navigation Links -->
            <div class="p-4 space-y-2">
              <router-link 
                v-for="item in navItems" 
                :key="item.name"
                :to="item.path"
                @click="closeMobileMenu"
                class="mobile-nav-link"
                :class="{ 'mobile-nav-link-active': isActiveRoute(item.path) }"
              >
                <div :class="item.icon" class="mobile-nav-icon"></div>
                <span>{{ item.label }}</span>
              </router-link>
            </div>

            <!-- Mobile Actions -->
            <div class="p-4 border-t border-divider mt-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-text-2">Thème</span>
                <button 
                  @click="toggleTheme"
                  class="btn-alt btn-sm"
                >
                  <div :class="isDark ? 'i-carbon-sun' : 'i-carbon-moon'" class="text-lg"></div>
                  <span class="ml-2">{{ isDark ? 'Clair' : 'Sombre' }}</span>
                </button>
              </div>
              

            </div>
          </div>
        </div>
      </transition>

      <!-- Mobile Spacer -->
      <div class="h-14"></div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

// Reactive state
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const isDark = ref(false)

// Store
const quizStore = useQuizStore()
const route = useRoute()

// Computed properties
const currentMode = computed(() => quizStore.state.userMode)

const navItems = computed(() => {
  const items = [
    {
      name: 'home',
      label: 'Accueil',
      path: '/',
      icon: 'i-carbon-home'
    }
  ]

  // Add mode-specific navigation items
  if (currentMode.value === 'host') {
    items.push(
      {
        name: 'team-setup',
        label: 'Équipes',
        path: '/host/team-setup',
        icon: 'i-carbon-user-multiple'
      },
      {
        name: 'host-quiz',
        label: 'Quiz',
        path: '/host/quiz',
        icon: 'i-carbon-play'
      },
      {
        name: 'host-results',
        label: 'Résultats',
        path: '/host/results',
        icon: 'i-carbon-trophy'
      }
    )
  } else if (currentMode.value === 'participant') {
    items.push(
      {
        name: 'participant-quiz',
        label: 'Quiz',
        path: '/participant/quiz',
        icon: 'i-carbon-play'
      },
      {
        name: 'participant-results',
        label: 'Résultats',
        path: '/participant/results',
        icon: 'i-carbon-user'
      }
    )
  }

  return items
})

// Methods
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const isActiveRoute = (path: string) => {
  return route.path === path || (path !== '/' && route.path.startsWith(path))
}

// Lifecycle
onMounted(() => {
  // Initialize theme
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark.value)

  // Add scroll listener
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // Initial check

  // Close mobile menu on route change
  const unsubscribe = quizStore.$subscribe(() => {
    closeMobileMenu()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    unsubscribe()
  })
})
</script>

<style scoped>
/* Navigation Styles using UnoCSS variables and custom properties */
.app-navigation {
  /* Z-index variables from theme.css */
  --z-nav: var(--vp-z-index-nav, 20);
  --z-sidebar: var(--vp-z-index-sidebar, 50);
}

/* Desktop Navigation */
.nav-brand .text-gradient-rainbow {
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-next));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-link {
  @apply flex items-center gap-2 px-3 py-2 rounded-md text-text-2 hover:text-text-1 hover:bg-bg-soft transition-all duration-200;
}

.nav-link-active {
  @apply text-brand-1 bg-bg-soft;
}

.nav-link-icon {
  @apply text-base;
}

.mode-indicator {
  @apply px-2 py-1 rounded-sm bg-bg-soft border border-brand-1/40;
}

/* Mobile Navigation */
.mobile-nav-link {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg text-text-1 hover:bg-bg-soft transition-all duration-200;
}

.mobile-nav-link-active {
  @apply text-brand-1 bg-bg-soft;
}

.mobile-nav-icon {
  @apply text-xl;
}

/* Mobile Menu Transitions */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

/* Enhanced accessibility for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .mobile-nav-link,
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition: none;
  }
}

/* Focus states for keyboard navigation */
.nav-link:focus,
.mobile-nav-link:focus {
  @apply outline-none ring-2 ring-brand-1 ring-offset-2;
}

/* High contrast support */
@media (prefers-contrast: high) {
  .nav-link,
  .mobile-nav-link {
    @apply border border-transparent;
  }
  
  .nav-link-active,
  .mobile-nav-link-active {
    @apply border-brand-1;
  }
}
</style> 