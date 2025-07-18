import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '../index'

// Mock du store quiz
vi.mock('@/stores/quiz', () => ({
  useQuizStore: vi.fn(() => ({
    state: {
      userMode: 'participant',
      teams: [],
      questions: [],
      isCompleted: false,
      error: null
    },
    setUserMode: vi.fn(),
    loadQuestionsWithCache: vi.fn().mockResolvedValue(undefined),
    autoSaveSession: vi.fn(),
    clearError: vi.fn()
  }))
}))

describe('Router', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have correct main routes configured', () => {
    const routes = router.getRoutes()
    
    const routeNames = routes.map(route => route.name)
    expect(routeNames).toContain('home')
    expect(routeNames).toContain('host-mode')
    expect(routeNames).toContain('host-team-setup')
    expect(routeNames).toContain('host-quiz')
    expect(routeNames).toContain('host-results')
    expect(routeNames).toContain('participant-mode')
    expect(routeNames).toContain('participant-quiz')
    expect(routeNames).toContain('participant-results')
  })

  it('should have home route at root path', () => {
    const homeRoute = router.getRoutes().find(route => route.name === 'home')
    expect(homeRoute?.path).toBe('/')
    expect(homeRoute?.meta?.requiresMode).toBe(false)
  })

  it('should have host mode routes with correct paths', () => {
    const hostModeRoute = router.getRoutes().find(route => route.name === 'host-mode')
    expect(hostModeRoute?.path).toBe('/host')
    expect(hostModeRoute?.meta?.requiresMode).toBe('host')

    const hostTeamSetupRoute = router.getRoutes().find(route => route.name === 'host-team-setup')
    expect(hostTeamSetupRoute?.path).toBe('/host/team-setup')
    expect(hostTeamSetupRoute?.meta?.requiresMode).toBe('host')
    expect(hostTeamSetupRoute?.meta?.requiresTeams).toBe(false)

    const hostQuizRoute = router.getRoutes().find(route => route.name === 'host-quiz')
    expect(hostQuizRoute?.path).toBe('/host/quiz')
    expect(hostQuizRoute?.meta?.requiresMode).toBe('host')
    expect(hostQuizRoute?.meta?.requiresTeams).toBe(true)

    const hostResultsRoute = router.getRoutes().find(route => route.name === 'host-results')
    expect(hostResultsRoute?.path).toBe('/host/results')
    expect(hostResultsRoute?.meta?.requiresMode).toBe('host')
    expect(hostResultsRoute?.meta?.requiresTeams).toBe(true)
    expect(hostResultsRoute?.meta?.requiresCompleted).toBe(true)
  })

  it('should have participant mode routes with correct paths', () => {
    const participantModeRoute = router.getRoutes().find(route => route.name === 'participant-mode')
    expect(participantModeRoute?.path).toBe('/participant')
    expect(participantModeRoute?.meta?.requiresMode).toBe('participant')

    const participantQuizRoute = router.getRoutes().find(route => route.name === 'participant-quiz')
    expect(participantQuizRoute?.path).toBe('/participant/quiz')
    expect(participantQuizRoute?.meta?.requiresMode).toBe('participant')
    expect(participantQuizRoute?.meta?.requiresTeams).toBe(false)

    const participantResultsRoute = router.getRoutes().find(route => route.name === 'participant-results')
    expect(participantResultsRoute?.path).toBe('/participant/results')
    expect(participantResultsRoute?.meta?.requiresMode).toBe('participant')
    expect(participantResultsRoute?.meta?.requiresTeams).toBe(false)
    expect(participantResultsRoute?.meta?.requiresCompleted).toBe(true)
  })

  it('should have compatibility redirect routes', () => {
    const legacyRoutes = ['team-setup', 'quiz', 'results', 'team-results']
    const routes = router.getRoutes()
    
    legacyRoutes.forEach(routeName => {
      const route = routes.find(r => r.name === routeName)
      expect(route).toBeDefined()
      expect(route?.redirect).toBeDefined()
    })
  })

  it('should have 404 catch-all route', () => {
    const notFoundRoute = router.getRoutes().find(route => route.name === 'not-found')
    expect(notFoundRoute?.path).toBe('/:pathMatch(.*)*')
    expect(notFoundRoute?.redirect).toBe('/')
  })

  it('should have correct meta information for routes requiring teams', () => {
    const routesRequiringTeams = router.getRoutes().filter(route => route.meta?.requiresTeams === true)
    
    expect(routesRequiringTeams).toHaveLength(2) // host-quiz et host-results
    routesRequiringTeams.forEach(route => {
      expect(route.meta?.requiresMode).toBe('host')
    })
  })

  it('should have correct meta information for routes requiring completion', () => {
    const routesRequiringCompletion = router.getRoutes().filter(route => route.meta?.requiresCompleted === true)
    
    expect(routesRequiringCompletion).toHaveLength(2) // host-results et participant-results
    routesRequiringCompletion.forEach(route => {
      expect(route.meta?.title).toContain('Résultats')
    })
  })
})