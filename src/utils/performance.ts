/**
 * Performance optimization utilities for team management
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import type { Team, TeamAnswer } from '@/types'

// Memoization cache for expensive calculations with size limit
const memoCache = new Map<string, any>()
const MAX_CACHE_SIZE = 100

// Cache management
function manageCacheSize() {
  if (memoCache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(memoCache.keys()).slice(0, memoCache.size - MAX_CACHE_SIZE)
    keysToDelete.forEach(key => memoCache.delete(key))
  }
}

/**
 * Memoized computation with cache invalidation
 */
export function useMemoizedComputation<T>(
  key: string,
  computeFn: () => T,
  dependencies: Ref<any>[]
): ComputedRef<T> {
  const cacheKey = ref(key)
  
  // Watch dependencies and invalidate cache when they change
  watch(dependencies, () => {
    memoCache.delete(cacheKey.value)
  }, { deep: true })
  
  return computed(() => {
    if (memoCache.has(cacheKey.value)) {
      return memoCache.get(cacheKey.value)
    }
    
    const result = computeFn()
    memoCache.set(cacheKey.value, result)
    return result
  })
}

/**
 * Optimized team score calculation with memoization
 */
export function useOptimizedTeamScores(
  teams: Ref<Team[]>,
  teamAnswers: Ref<TeamAnswer[]>
) {
  return useMemoizedComputation(
    'team-scores',
    () => {
      const scoreMap = new Map<string, number>()
      
      // Initialize all teams with 0 score
      teams.value.forEach(team => {
        scoreMap.set(team.id, 0)
      })
      
      // Calculate scores efficiently
      teamAnswers.value.forEach(answer => {
        if (answer.isCorrect) {
          const currentScore = scoreMap.get(answer.teamId) || 0
          scoreMap.set(answer.teamId, currentScore + 1)
        }
      })
      
      // Return teams with calculated scores
      return teams.value.map(team => ({
        ...team,
        score: scoreMap.get(team.id) || 0
      }))
    },
    [teams, teamAnswers]
  )
}

/**
 * Optimized team rankings with stable sorting
 */
export function useOptimizedTeamRankings(
  teams: Ref<Team[]>,
  teamAnswers: Ref<TeamAnswer[]>
) {
  const teamScores = useOptimizedTeamScores(teams, teamAnswers)
  
  return useMemoizedComputation(
    'team-rankings',
    () => {
      return teamScores.value
        .slice() // Create a copy to avoid mutating original
        .sort((a, b) => {
          // Primary sort: score descending
          if (b.score !== a.score) {
            return b.score - a.score
          }
          // Secondary sort: name ascending (stable sort)
          return a.name.localeCompare(b.name)
        })
        .map((team, index) => ({
          ...team,
          rank: index + 1
        }))
    },
    [teamScores]
  )
}

/**
 * Optimized question results calculation
 */
export function useOptimizedQuestionResults(
  questions: Ref<any[]>,
  teamAnswers: Ref<TeamAnswer[]>,
  teams: Ref<Team[]>
) {
  return useMemoizedComputation(
    'question-results',
    () => {
      // Group team answers by question for efficient lookup
      const answersByQuestion = new Map<string, TeamAnswer[]>()
      teamAnswers.value.forEach(answer => {
        if (!answersByQuestion.has(answer.questionId)) {
          answersByQuestion.set(answer.questionId, [])
        }
        answersByQuestion.get(answer.questionId)!.push(answer)
      })
      
      // Create team lookup map for efficient name resolution
      const teamMap = new Map(teams.value.map(team => [team.id, team]))
      
      return questions.value.map(question => ({
        questionId: question.id,
        correctAnswer: question.correctAnswer,
        teamAnswers: (answersByQuestion.get(question.id) || []).map(answer => {
          const team = teamMap.get(answer.teamId)
          return {
            teamId: answer.teamId,
            teamName: team?.name || 'Équipe inconnue',
            answerIndex: answer.answerIndex,
            isCorrect: answer.isCorrect
          }
        })
      }))
    },
    [questions, teamAnswers, teams]
  )
}

/**
 * Virtual scrolling utility for large team lists
 */
export function useVirtualScrolling(
  items: Ref<any[]>,
  containerHeight: number = 400,
  itemHeight: number = 80
) {
  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement>()
  
  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(start + visibleCount + 2, items.value.length) // +2 for buffer
    
    return { start, end }
  })
  
  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end).map((item, index) => ({
      ...item,
      index: start + index,
      top: (start + index) * itemHeight
    }))
  })
  
  const totalHeight = computed(() => items.value.length * itemHeight)
  
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }
  
  return {
    containerRef,
    visibleItems,
    totalHeight,
    handleScroll,
    scrollTop
  }
}

/**
 * Debounced computation for expensive operations
 */
export function useDebouncedComputation<T>(
  computeFn: () => T,
  delay: number = 300
): ComputedRef<T | null> {
  const result = ref<T | null>(null)
  let timeoutId: number | null = null
  
  const debouncedCompute = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = window.setTimeout(() => {
      result.value = computeFn()
      timeoutId = null
    }, delay)
  }
  
  return computed(() => {
    debouncedCompute()
    return result.value
  })
}

/**
 * Batch operations for better performance
 */
export class BatchProcessor<T> {
  private queue: T[] = []
  private processing = false
  private batchSize: number
  private processFn: (items: T[]) => Promise<void>
  
  constructor(processFn: (items: T[]) => Promise<void>, batchSize: number = 10) {
    this.processFn = processFn
    this.batchSize = batchSize
  }
  
  add(item: T) {
    this.queue.push(item)
    this.processQueue()
  }
  
  addBatch(items: T[]) {
    this.queue.push(...items)
    this.processQueue()
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize)
      await this.processFn(batch)
      
      // Allow other tasks to run
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    this.processing = false
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number[]>()
  
  start(label: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, [])
      }
      
      this.measurements.get(label)!.push(duration)
      
      // Keep only last 100 measurements
      const measurements = this.measurements.get(label)!
      if (measurements.length > 100) {
        measurements.shift()
      }
    }
  }
  
  getStats(label: string) {
    const measurements = this.measurements.get(label) || []
    if (measurements.length === 0) {
      return null
    }
    
    const sorted = [...measurements].sort((a, b) => a - b)
    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    
    return { avg, median, min, max, count: measurements.length }
  }
  
  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [label] of this.measurements) {
      stats[label] = this.getStats(label)
    }
    return stats
  }
  
  clear(label?: string) {
    if (label) {
      this.measurements.delete(label)
    } else {
      this.measurements.clear()
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Animation optimization utilities
 */
export function useOptimizedAnimations() {
  const prefersReducedMotion = ref(
    typeof window !== 'undefined' && 
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  
  const animationDuration = computed(() => 
    prefersReducedMotion.value ? 0 : 300
  )
  
  const shouldAnimate = computed(() => !prefersReducedMotion.value)
  
  return {
    prefersReducedMotion,
    animationDuration,
    shouldAnimate
  }
}

/**
 * Memory usage optimization
 */
export function useMemoryOptimization() {
  const clearMemoCache = () => {
    memoCache.clear()
  }
  
  const getCacheSize = () => {
    return memoCache.size
  }
  
  const getCacheKeys = () => {
    return Array.from(memoCache.keys())
  }
  
  return {
    clearMemoCache,
    getCacheSize,
    getCacheKeys
  }
}

/**
 * Advanced team score calculation with incremental updates
 */
export class IncrementalScoreCalculator {
  private scoreCache = new Map<string, number>()
  private lastAnswerCount = 0
  
  calculateScores(teams: Team[], teamAnswers: TeamAnswer[]): Team[] {
    // If answers haven't changed, return cached results
    if (teamAnswers.length === this.lastAnswerCount && this.scoreCache.size > 0) {
      return teams.map(team => ({
        ...team,
        score: this.scoreCache.get(team.id) || 0
      }))
    }
    
    // Reset cache if team structure changed
    if (this.scoreCache.size !== teams.length) {
      this.scoreCache.clear()
      teams.forEach(team => this.scoreCache.set(team.id, 0))
    }
    
    // Process only new answers if we have a partial cache
    const startIndex = this.lastAnswerCount
    const newAnswers = teamAnswers.slice(startIndex)
    
    // Update scores incrementally
    newAnswers.forEach(answer => {
      if (answer.isCorrect) {
        const currentScore = this.scoreCache.get(answer.teamId) || 0
        this.scoreCache.set(answer.teamId, currentScore + 1)
      }
    })
    
    this.lastAnswerCount = teamAnswers.length
    
    return teams.map(team => ({
      ...team,
      score: this.scoreCache.get(team.id) || 0
    }))
  }
  
  reset() {
    this.scoreCache.clear()
    this.lastAnswerCount = 0
  }
}

/**
 * Optimized sorting with stable algorithm for large datasets
 */
export function useOptimizedSorting<T>(
  items: Ref<T[]>,
  compareFn: (a: T, b: T) => number,
  stableKey?: (item: T) => string
) {
  return computed(() => {
    const itemsToSort = items.value.slice()
    
    // Use stable sort for consistent results
    if (stableKey) {
      return itemsToSort
        .map((item, originalIndex) => ({ item, originalIndex, key: stableKey(item) }))
        .sort((a, b) => {
          const compareResult = compareFn(a.item, b.item)
          if (compareResult !== 0) return compareResult
          // Fallback to original index for stability
          return a.originalIndex - b.originalIndex
        })
        .map(({ item }) => item)
    }
    
    return itemsToSort.sort(compareFn)
  })
}

/**
 * Efficient team filtering and searching
 */
export function useTeamFiltering(
  teams: Ref<Team[]>,
  searchTerm: Ref<string>,
  filters: Ref<{ minScore?: number; maxScore?: number; colors?: string[] }>
) {
  return computed(() => {
    let filteredTeams = teams.value
    
    // Text search optimization with early exit
    if (searchTerm.value.trim()) {
      const term = searchTerm.value.toLowerCase().trim()
      filteredTeams = filteredTeams.filter(team => 
        team.name.toLowerCase().includes(term)
      )
    }
    
    // Score range filtering
    if (filters.value.minScore !== undefined) {
      filteredTeams = filteredTeams.filter(team => team.score >= filters.value.minScore!)
    }
    
    if (filters.value.maxScore !== undefined) {
      filteredTeams = filteredTeams.filter(team => team.score <= filters.value.maxScore!)
    }
    
    // Color filtering
    if (filters.value.colors && filters.value.colors.length > 0) {
      filteredTeams = filteredTeams.filter(team => 
        team.color && filters.value.colors!.includes(team.color)
      )
    }
    
    return filteredTeams
  })
}

/**
 * Lazy loading utility for large datasets
 */
export function useLazyLoading<T>(
  items: Ref<T[]>,
  pageSize: number = 20
) {
  const currentPage = ref(0)
  const isLoading = ref(false)
  
  const loadedItems = computed(() => {
    const endIndex = (currentPage.value + 1) * pageSize
    return items.value.slice(0, endIndex)
  })
  
  const hasMore = computed(() => {
    return loadedItems.value.length < items.value.length
  })
  
  const loadMore = async () => {
    if (isLoading.value || !hasMore.value) return
    
    isLoading.value = true
    
    // Simulate async loading delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    currentPage.value++
    isLoading.value = false
  }
  
  const reset = () => {
    currentPage.value = 0
    isLoading.value = false
  }
  
  return {
    loadedItems,
    hasMore,
    isLoading,
    loadMore,
    reset
  }
}

/**
 * Performance-optimized animation frame scheduler
 */
export class AnimationScheduler {
  private tasks: (() => void)[] = []
  private isRunning = false
  
  schedule(task: () => void) {
    this.tasks.push(task)
    if (!this.isRunning) {
      this.run()
    }
  }
  
  private run() {
    this.isRunning = true
    
    const processBatch = () => {
      const startTime = performance.now()
      const maxBatchTime = 16 // ~60fps budget
      
      while (this.tasks.length > 0 && (performance.now() - startTime) < maxBatchTime) {
        const task = this.tasks.shift()
        if (task) task()
      }
      
      if (this.tasks.length > 0) {
        requestAnimationFrame(processBatch)
      } else {
        this.isRunning = false
      }
    }
    
    requestAnimationFrame(processBatch)
  }
  
  clear() {
    this.tasks = []
    this.isRunning = false
  }
}

// Global animation scheduler
export const animationScheduler = new AnimationScheduler()

/**
 * Optimized event handling with throttling
 */
export function useThrottledEvent<T extends Event>(
  handler: (event: T) => void,
  delay: number = 16 // ~60fps
) {
  let lastCall = 0
  let timeoutId: number | null = null
  
  return (event: T) => {
    const now = performance.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      handler(event)
    } else if (!timeoutId) {
      timeoutId = window.setTimeout(() => {
        lastCall = performance.now()
        handler(event)
        timeoutId = null
      }, delay - (now - lastCall))
    }
  }
}

/**
 * Web Worker utility for heavy computations
 */
export class ComputationWorker {
  private worker: Worker | null = null
  
  constructor(workerScript: string) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(workerScript)
    }
  }
  
  async compute<T, R>(data: T): Promise<R> {
    if (!this.worker) {
      throw new Error('Web Workers not supported')
    }
    
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        this.worker!.removeEventListener('message', handleMessage)
        this.worker!.removeEventListener('error', handleError)
        resolve(event.data)
      }
      
      const handleError = (error: ErrorEvent) => {
        this.worker!.removeEventListener('message', handleMessage)
        this.worker!.removeEventListener('error', handleError)
        reject(error)
      }
      
      this.worker.addEventListener('message', handleMessage)
      this.worker.addEventListener('error', handleError)
      this.worker.postMessage(data)
    })
  }
  
  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}