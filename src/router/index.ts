import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: {
        title: 'Quiz Cinéma - Accueil'
      }
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: () => import('../views/QuizView.vue'),
      meta: {
        title: 'Quiz Cinéma'
      }
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('../views/ResultsView.vue'),
      meta: {
        title: 'Vos Résultats'
      }
    },
    // Catch-all redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Navigation guards
router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const quizStore = useQuizStore()
  
  // Set page title
  document.title = to.meta.title as string || 'Quiz Cinéma'
  
  // Load questions if not already loaded and navigating to quiz
  if (to.name === 'quiz' && quizStore.state.questions.length === 0) {
    try {
      await quizStore.loadQuestionsFromJSON()
    } catch (error) {
      console.error('Failed to load questions:', error)
      // Redirect to home if questions can't be loaded
      next('/')
      return
    }
  }
  
  // Check if quiz is completed when accessing results
  if (to.name === 'results' && !quizStore.state.isCompleted) {
    next('/quiz')
    return
  }
  
  next()
})

export default router