import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: {
        title: 'Quiz Cinéma - Accueil',
        requiresMode: false
      }
    },
    {
      path: '/host',
      name: 'host-mode',
      redirect: '/host/team-setup',
      meta: {
        title: 'Mode Animateur',
        requiresMode: 'host'
      }
    },
    {
      path: '/host/team-setup',
      name: 'host-team-setup',
      component: () => import('../views/TeamSetupView.vue'),
      meta: {
        title: 'Configuration des Équipes',
        requiresMode: 'host',
        requiresTeams: false
      }
    },
    {
      path: '/host/quiz',
      name: 'host-quiz',
      component: () => import('../views/QuizView.vue'),
      meta: {
        title: 'Quiz - Mode Animateur',
        requiresMode: 'host',
        requiresTeams: true
      }
    },
    {
      path: '/host/results',
      name: 'host-results',
      component: () => import('../views/TeamResultsView.vue'),
      meta: {
        title: 'Résultats par Équipe',
        requiresMode: 'host',
        requiresTeams: true,
        requiresCompleted: true
      }
    },
    {
      path: '/participant',
      name: 'participant-mode',
      redirect: '/participant/quiz',
      meta: {
        title: 'Mode Participant',
        requiresMode: 'participant'
      }
    },
    {
      path: '/participant/quiz',
      name: 'participant-quiz',
      component: () => import('../views/QuizView.vue'),
      meta: {
        title: 'Quiz - Mode Participant',
        requiresMode: 'participant',
        requiresTeams: false
      }
    },
    {
      path: '/participant/results',
      name: 'participant-results',
      component: () => import('../views/ResultsView.vue'),
      meta: {
        title: 'Vos Résultats',
        requiresMode: 'participant',
        requiresTeams: false,
        requiresCompleted: true
      }
    },
    // Routes de compatibilité (anciennes routes)
    {
      path: '/team-setup',
      name: 'team-setup',
      redirect: (to) => {
        return { name: 'host-team-setup', query: to.query }
      }
    },
    {
      path: '/quiz',
      name: 'quiz',
      redirect: (to) => {
        // Rediriger vers le mode approprié selon le store
        const quizStore = useQuizStore()
        const mode = to.query.mode || quizStore.state.userMode
        
        if (mode === 'host') {
          return { name: 'host-quiz', query: to.query }
        } else {
          return { name: 'participant-quiz', query: to.query }
        }
      }
    },
    {
      path: '/results',
      name: 'results',
      redirect: (to) => {
        const quizStore = useQuizStore()
        const mode = to.query.mode || quizStore.state.userMode
        
        if (mode === 'host') {
          return { name: 'host-results', query: to.query }
        } else {
          return { name: 'participant-results', query: to.query }
        }
      }
    },
    {
      path: '/team-results',
      name: 'team-results',
      redirect: (to) => {
        return { name: 'host-results', query: to.query }
      }
    },
    // Route 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/'
    }
  ]
})

// Navigation guards
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const quizStore = useQuizStore()
  
  // Définir le titre de la page
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  
  // Vérifier si une route nécessite un mode spécifique
  if (to.meta.requiresMode && to.meta.requiresMode !== false) {
    const requiredMode = to.meta.requiresMode as 'host' | 'participant'
    
    // Si le mode n'est pas défini ou incorrect, définir le bon mode
    if (quizStore.state.userMode !== requiredMode) {
      quizStore.setUserMode(requiredMode)
    }
  }
  
  // Vérifier si des équipes sont requises (mode animateur uniquement)
  if (to.meta.requiresTeams === true) {
    if (quizStore.state.userMode === 'host' && quizStore.state.teams.length === 0) {
      // Rediriger vers la configuration des équipes
      next({ name: 'host-team-setup', query: { redirect: to.fullPath } })
      return
    }
  }
  
  // Vérifier si le quiz doit être terminé
  if (to.meta.requiresCompleted === true) {
    if (!quizStore.state.isCompleted) {
      // Rediriger vers le quiz approprié selon le mode
      const mode = quizStore.state.userMode
      if (mode === 'host') {
        next({ name: 'host-quiz', query: { redirect: to.fullPath } })
      } else {
        next({ name: 'participant-quiz', query: { redirect: to.fullPath } })
      }
      return
    }
  }
  
  // Vérifier si des questions sont chargées pour les routes de quiz
  if ((to.name === 'host-quiz' || to.name === 'participant-quiz') && quizStore.state.questions.length === 0) {
    // Essayer de charger les questions
    quizStore.loadQuestionsWithCache().then(() => {
      if (quizStore.state.questions.length === 0) {
        // Si toujours pas de questions, rediriger vers l'accueil avec erreur
        next({ name: 'home', query: { error: 'no-questions' } })
      } else {
        next()
      }
    }).catch(() => {
      next({ name: 'home', query: { error: 'load-failed' } })
    })
    return
  }
  
  next()
})

// Navigation guard après chaque route
router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const quizStore = useQuizStore()
  
  // Auto-sauvegarder la session si on quitte une route de quiz
  if (from.name === 'host-quiz' || from.name === 'host-team-setup') {
    quizStore.autoSaveSession()
  }
  
  // Nettoyer les erreurs du store lors de la navigation
  if (quizStore.state.error) {
    quizStore.clearError()
  }
})

export default router