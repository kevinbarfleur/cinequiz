/**
 * Performance benchmarking utilities for team management optimization
 */

import type { Team, TeamAnswer } from '@/types'
import { IncrementalScoreCalculator } from '@/utils/performance'

export interface BenchmarkResult {
  operation: string
  duration: number
  iterations: number
  averageTime: number
  minTime: number
  maxTime: number
  memoryUsage?: number
}

export interface TeamPerformanceMetrics {
  scoreCalculation: BenchmarkResult
  teamSorting: BenchmarkResult
  teamFiltering: BenchmarkResult
  virtualScrolling: BenchmarkResult
  overallPerformance: {
    totalTime: number
    averageTime: number
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  }
}

/**
 * Performance benchmark runner
 */
export class PerformanceBenchmark {
  private results: Map<string, BenchmarkResult> = new Map()
  
  /**
   * Run a benchmark for a given operation
   */
  async benchmark(
    name: string,
    operation: () => void | Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = []
    const memoryBefore = this.getMemoryUsage()
    
    // Warm up
    for (let i = 0; i < Math.min(10, iterations); i++) {
      await operation()
    }
    
    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await operation()
      const end = performance.now()
      times.push(end - start)
    }
    
    const memoryAfter = this.getMemoryUsage()
    const memoryUsage = memoryAfter - memoryBefore
    
    const result: BenchmarkResult = {
      operation: name,
      duration: times.reduce((sum, time) => sum + time, 0),
      iterations,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      memoryUsage: memoryUsage > 0 ? memoryUsage : undefined
    }
    
    this.results.set(name, result)
    return result
  }
  
  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }
  
  /**
   * Get all benchmark results
   */
  getResults(): Map<string, BenchmarkResult> {
    return new Map(this.results)
  }
  
  /**
   * Clear all results
   */
  clear(): void {
    this.results.clear()
  }
  
  /**
   * Generate a performance report
   */
  generateReport(): string {
    let report = 'Performance Benchmark Report\n'
    report += '================================\n\n'
    
    for (const [name, result] of this.results) {
      report += `${name}:\n`
      report += `  Average Time: ${result.averageTime.toFixed(2)}ms\n`
      report += `  Min Time: ${result.minTime.toFixed(2)}ms\n`
      report += `  Max Time: ${result.maxTime.toFixed(2)}ms\n`
      report += `  Total Time: ${result.duration.toFixed(2)}ms\n`
      report += `  Iterations: ${result.iterations}\n`
      if (result.memoryUsage) {
        report += `  Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`
      }
      report += '\n'
    }
    
    return report
  }
}

/**
 * Team-specific performance benchmarks
 */
export class TeamPerformanceBenchmark {
  private benchmark = new PerformanceBenchmark()
  private scoreCalculator = new IncrementalScoreCalculator()
  
  /**
   * Generate test data for benchmarking
   */
  private generateTestData(teamCount: number, questionCount: number) {
    const teams: Team[] = []
    const teamAnswers: TeamAnswer[] = []
    
    // Generate teams
    for (let i = 0; i < teamCount; i++) {
      teams.push({
        id: `team-${i}`,
        name: `Team ${i + 1}`,
        score: 0,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
      })
    }
    
    // Generate team answers
    for (let questionIndex = 0; questionIndex < questionCount; questionIndex++) {
      for (let teamIndex = 0; teamIndex < teamCount; teamIndex++) {
        teamAnswers.push({
          questionId: `question-${questionIndex}`,
          teamId: `team-${teamIndex}`,
          answerIndex: Math.floor(Math.random() * 4),
          isCorrect: Math.random() > 0.5
        })
      }
    }
    
    return { teams, teamAnswers }
  }
  
  /**
   * Benchmark score calculation performance
   */
  async benchmarkScoreCalculation(
    teamCount: number = 50,
    questionCount: number = 20
  ): Promise<BenchmarkResult> {
    const { teams, teamAnswers } = this.generateTestData(teamCount, questionCount)
    
    return await this.benchmark.benchmark(
      `Score Calculation (${teamCount} teams, ${questionCount} questions)`,
      () => {
        this.scoreCalculator.calculateScores(teams, teamAnswers)
      },
      100
    )
  }
  
  /**
   * Benchmark team sorting performance
   */
  async benchmarkTeamSorting(teamCount: number = 50): Promise<BenchmarkResult> {
    const { teams } = this.generateTestData(teamCount, 20)
    
    // Add random scores
    teams.forEach(team => {
      team.score = Math.floor(Math.random() * 20)
    })
    
    return await this.benchmark.benchmark(
      `Team Sorting (${teamCount} teams)`,
      () => {
        teams.slice().sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score
          }
          return a.name.localeCompare(b.name)
        })
      },
      1000
    )
  }
  
  /**
   * Benchmark team filtering performance
   */
  async benchmarkTeamFiltering(teamCount: number = 50): Promise<BenchmarkResult> {
    const { teams } = this.generateTestData(teamCount, 20)
    const searchTerm = 'Team 1'
    
    return await this.benchmark.benchmark(
      `Team Filtering (${teamCount} teams)`,
      () => {
        teams.filter(team => 
          team.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      },
      1000
    )
  }
  
  /**
   * Benchmark virtual scrolling performance
   */
  async benchmarkVirtualScrolling(itemCount: number = 1000): Promise<BenchmarkResult> {
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }))
    
    const containerHeight = 400
    const itemHeight = 80
    const scrollTop = 1000
    
    return await this.benchmark.benchmark(
      `Virtual Scrolling (${itemCount} items)`,
      () => {
        const start = Math.floor(scrollTop / itemHeight)
        const visibleCount = Math.ceil(containerHeight / itemHeight)
        const end = Math.min(start + visibleCount + 2, items.length)
        
        items.slice(start, end).map((item, index) => ({
          ...item,
          index: start + index,
          top: (start + index) * itemHeight
        }))
      },
      1000
    )
  }
  
  /**
   * Run comprehensive team performance benchmarks
   */
  async runComprehensiveBenchmark(
    teamCounts: number[] = [10, 25, 50, 100],
    questionCount: number = 20
  ): Promise<TeamPerformanceMetrics[]> {
    const results: TeamPerformanceMetrics[] = []
    
    for (const teamCount of teamCounts) {
      console.log(`Running benchmarks for ${teamCount} teams...`)
      
      const scoreCalculation = await this.benchmarkScoreCalculation(teamCount, questionCount)
      const teamSorting = await this.benchmarkTeamSorting(teamCount)
      const teamFiltering = await this.benchmarkTeamFiltering(teamCount)
      const virtualScrolling = await this.benchmarkVirtualScrolling(teamCount * 10)
      
      const totalTime = scoreCalculation.averageTime + teamSorting.averageTime + 
                       teamFiltering.averageTime + virtualScrolling.averageTime
      
      const performanceGrade = this.calculatePerformanceGrade(totalTime)
      
      results.push({
        scoreCalculation,
        teamSorting,
        teamFiltering,
        virtualScrolling,
        overallPerformance: {
          totalTime,
          averageTime: totalTime / 4,
          performanceGrade
        }
      })
    }
    
    return results
  }
  
  /**
   * Calculate performance grade based on total time
   */
  private calculatePerformanceGrade(totalTime: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (totalTime < 5) return 'A'
    if (totalTime < 10) return 'B'
    if (totalTime < 20) return 'C'
    if (totalTime < 50) return 'D'
    return 'F'
  }
  
  /**
   * Test different optimization strategies
   */
  async compareOptimizationStrategies(): Promise<{
    naive: BenchmarkResult
    optimized: BenchmarkResult
    improvement: number
  }> {
    const { teams, teamAnswers } = this.generateTestData(100, 50)
    
    // Naive approach - recalculate everything each time
    const naive = await this.benchmark.benchmark(
      'Naive Score Calculation',
      () => {
        const scoreMap = new Map<string, number>()
        teams.forEach(team => scoreMap.set(team.id, 0))
        
        teamAnswers.forEach(answer => {
          if (answer.isCorrect) {
            const currentScore = scoreMap.get(answer.teamId) || 0
            scoreMap.set(answer.teamId, currentScore + 1)
          }
        })
        
        return teams.map(team => ({
          ...team,
          score: scoreMap.get(team.id) || 0
        }))
      },
      100
    )
    
    // Optimized approach - use incremental calculator
    this.scoreCalculator.reset()
    const optimized = await this.benchmark.benchmark(
      'Optimized Score Calculation',
      () => {
        return this.scoreCalculator.calculateScores(teams, teamAnswers)
      },
      100
    )
    
    const improvement = ((naive.averageTime - optimized.averageTime) / naive.averageTime) * 100
    
    return { naive, optimized, improvement }
  }
  
  /**
   * Memory usage analysis
   */
  async analyzeMemoryUsage(maxTeams: number = 200): Promise<{
    teamCount: number
    memoryUsage: number
    memoryPerTeam: number
  }[]> {
    const results: { teamCount: number; memoryUsage: number; memoryPerTeam: number }[] = []
    
    for (let teamCount = 10; teamCount <= maxTeams; teamCount += 10) {
      const memoryBefore = this.getMemoryUsage()
      
      const { teams, teamAnswers } = this.generateTestData(teamCount, 20)
      this.scoreCalculator.calculateScores(teams, teamAnswers)
      
      const memoryAfter = this.getMemoryUsage()
      const memoryUsage = memoryAfter - memoryBefore
      
      results.push({
        teamCount,
        memoryUsage,
        memoryPerTeam: memoryUsage / teamCount
      })
      
      // Clean up
      this.scoreCalculator.reset()
    }
    
    return results
  }
  
  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }
  
  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics: TeamPerformanceMetrics[]): string[] {
    const recommendations: string[] = []
    
    // Analyze score calculation performance
    const scoreCalcTimes = metrics.map(m => m.scoreCalculation.averageTime)
    const maxScoreCalcTime = Math.max(...scoreCalcTimes)
    
    if (maxScoreCalcTime > 10) {
      recommendations.push(
        'Score calculation is slow with large team counts. Consider implementing incremental updates.'
      )
    }
    
    // Analyze sorting performance
    const sortingTimes = metrics.map(m => m.teamSorting.averageTime)
    const maxSortingTime = Math.max(...sortingTimes)
    
    if (maxSortingTime > 5) {
      recommendations.push(
        'Team sorting performance degrades with large datasets. Consider implementing stable sort with memoization.'
      )
    }
    
    // Analyze virtual scrolling
    const virtualScrollTimes = metrics.map(m => m.virtualScrolling.averageTime)
    const maxVirtualScrollTime = Math.max(...virtualScrollTimes)
    
    if (maxVirtualScrollTime > 2) {
      recommendations.push(
        'Virtual scrolling calculations are expensive. Consider reducing calculation frequency or using web workers.'
      )
    }
    
    // Overall performance analysis
    const overallGrades = metrics.map(m => m.overallPerformance.performanceGrade)
    const hasLowGrades = overallGrades.some(grade => ['D', 'F'].includes(grade))
    
    if (hasLowGrades) {
      recommendations.push(
        'Overall performance is poor with large datasets. Consider implementing lazy loading and data pagination.'
      )
    }
    
    // Memory usage recommendations
    recommendations.push(
      'Monitor memory usage in production and implement cleanup routines for long-running sessions.'
    )
    
    return recommendations
  }
  
  /**
   * Get benchmark results
   */
  getResults(): Map<string, BenchmarkResult> {
    return this.benchmark.getResults()
  }
  
  /**
   * Clear all results
   */
  clear(): void {
    this.benchmark.clear()
    this.scoreCalculator.reset()
  }
}

/**
 * Real-time performance monitor for production use
 */
export class RealTimePerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private maxSamples = 100
  
  /**
   * Record a performance metric
   */
  record(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    
    const samples = this.metrics.get(operation)!
    samples.push(duration)
    
    // Keep only the last N samples
    if (samples.length > this.maxSamples) {
      samples.shift()
    }
  }
  
  /**
   * Get performance statistics for an operation
   */
  getStats(operation: string): {
    average: number
    min: number
    max: number
    recent: number
    trend: 'improving' | 'degrading' | 'stable'
  } | null {
    const samples = this.metrics.get(operation)
    if (!samples || samples.length === 0) {
      return null
    }
    
    const average = samples.reduce((sum, val) => sum + val, 0) / samples.length
    const min = Math.min(...samples)
    const max = Math.max(...samples)
    const recent = samples[samples.length - 1]
    
    // Calculate trend
    let trend: 'improving' | 'degrading' | 'stable' = 'stable'
    if (samples.length >= 10) {
      const firstHalf = samples.slice(0, Math.floor(samples.length / 2))
      const secondHalf = samples.slice(Math.floor(samples.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
      
      const difference = secondAvg - firstAvg
      const threshold = firstAvg * 0.1 // 10% threshold
      
      if (difference > threshold) {
        trend = 'degrading'
      } else if (difference < -threshold) {
        trend = 'improving'
      }
    }
    
    return { average, min, max, recent, trend }
  }
  
  /**
   * Get all performance statistics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation)
    }
    return stats
  }
  
  /**
   * Check if any operation is performing poorly
   */
  getPerformanceAlerts(): string[] {
    const alerts: string[] = []
    
    for (const operation of this.metrics.keys()) {
      const stats = this.getStats(operation)
      if (stats) {
        if (stats.trend === 'degrading') {
          alerts.push(`Performance degrading for ${operation}: ${stats.recent.toFixed(2)}ms (avg: ${stats.average.toFixed(2)}ms)`)
        }
        
        if (stats.recent > stats.average * 2) {
          alerts.push(`Unusually slow performance for ${operation}: ${stats.recent.toFixed(2)}ms`)
        }
      }
    }
    
    return alerts
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const realTimeMonitor = new RealTimePerformanceMonitor()

/**
 * Performance measurement decorator
 */
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      const start = performance.now()
      const result = method.apply(this, args)
      const end = performance.now()
      
      realTimeMonitor.record(operation, end - start)
      
      return result
    }
  }
}

/**
 * Async performance measurement decorator
 */
export function measureAsyncPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const start = performance.now()
      const result = await method.apply(this, args)
      const end = performance.now()
      
      realTimeMonitor.record(operation, end - start)
      
      return result
    }
  }
}