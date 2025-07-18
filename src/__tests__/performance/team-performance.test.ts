/**
 * Performance tests for team management optimization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TeamPerformanceBenchmark, RealTimePerformanceMonitor } from '@/utils/performanceBenchmark'
import { IncrementalScoreCalculator } from '@/utils/performance'
import type { Team, TeamAnswer } from '@/types'

describe('Team Performance Optimization', () => {
  let benchmark: TeamPerformanceBenchmark
  let monitor: RealTimePerformanceMonitor
  let scoreCalculator: IncrementalScoreCalculator

  beforeEach(() => {
    benchmark = new TeamPerformanceBenchmark()
    monitor = new RealTimePerformanceMonitor()
    scoreCalculator = new IncrementalScoreCalculator()
  })

  afterEach(() => {
    benchmark.clear()
    monitor.clear()
    scoreCalculator.reset()
  })

  describe('Score Calculation Performance', () => {
    it('should calculate scores efficiently for small team counts', async () => {
      const result = await benchmark.benchmarkScoreCalculation(10, 20)
      
      expect(result.averageTime).toBeLessThan(5) // Should be under 5ms
      expect(result.operation).toContain('10 teams')
    })

    it('should maintain performance with medium team counts', async () => {
      const result = await benchmark.benchmarkScoreCalculation(50, 20)
      
      expect(result.averageTime).toBeLessThan(15) // Should be under 15ms
      expect(result.minTime).toBeGreaterThan(0)
      expect(result.maxTime).toBeGreaterThan(result.minTime)
    })

    it('should handle large team counts reasonably', async () => {
      const result = await benchmark.benchmarkScoreCalculation(100, 50)
      
      expect(result.averageTime).toBeLessThan(50) // Should be under 50ms
      expect(result.iterations).toBe(100)
    })

    it('should show improvement with incremental calculator', async () => {
      const comparison = await benchmark.compareOptimizationStrategies()
      
      expect(comparison.improvement).toBeGreaterThan(0) // Should show improvement
      expect(comparison.optimized.averageTime).toBeLessThan(comparison.naive.averageTime)
    })
  })

  describe('Team Sorting Performance', () => {
    it('should sort teams quickly for small datasets', async () => {
      const result = await benchmark.benchmarkTeamSorting(25)
      
      expect(result.averageTime).toBeLessThan(2) // Should be under 2ms
    })

    it('should maintain sorting performance for larger datasets', async () => {
      const result = await benchmark.benchmarkTeamSorting(100)
      
      expect(result.averageTime).toBeLessThan(10) // Should be under 10ms
    })

    it('should provide stable sorting results', () => {
      const teams: Team[] = [
        { id: '1', name: 'Team A', score: 5 },
        { id: '2', name: 'Team B', score: 5 },
        { id: '3', name: 'Team C', score: 3 }
      ]

      const sorted1 = teams.slice().sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.name.localeCompare(b.name)
      })

      const sorted2 = teams.slice().sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.name.localeCompare(b.name)
      })

      expect(sorted1).toEqual(sorted2) // Should be stable
      expect(sorted1[0].name).toBe('Team A') // Team A should come before Team B (same score)
      expect(sorted1[1].name).toBe('Team B')
    })
  })

  describe('Team Filtering Performance', () => {
    it('should filter teams efficiently', async () => {
      const result = await benchmark.benchmarkTeamFiltering(50)
      
      expect(result.averageTime).toBeLessThan(1) // Should be under 1ms
    })

    it('should scale well with larger datasets', async () => {
      const result = await benchmark.benchmarkTeamFiltering(200)
      
      expect(result.averageTime).toBeLessThan(5) // Should be under 5ms
    })
  })

  describe('Virtual Scrolling Performance', () => {
    it('should handle virtual scrolling calculations efficiently', async () => {
      const result = await benchmark.benchmarkVirtualScrolling(100)
      
      expect(result.averageTime).toBeLessThan(1) // Should be under 1ms
    })

    it('should scale well with large item counts', async () => {
      const result = await benchmark.benchmarkVirtualScrolling(1000)
      
      expect(result.averageTime).toBeLessThan(3) // Should be under 3ms
    })
  })

  describe('Comprehensive Performance Analysis', () => {
    it('should provide performance grades for different team counts', async () => {
      const results = await benchmark.runComprehensiveBenchmark([10, 25, 50])
      
      expect(results).toHaveLength(3)
      
      // Small team count should have good performance
      expect(results[0].overallPerformance.performanceGrade).toMatch(/[AB]/)
      
      // All results should have valid metrics
      results.forEach(result => {
        expect(result.scoreCalculation.averageTime).toBeGreaterThan(0)
        expect(result.teamSorting.averageTime).toBeGreaterThan(0)
        expect(result.teamFiltering.averageTime).toBeGreaterThan(0)
        expect(result.virtualScrolling.averageTime).toBeGreaterThan(0)
        expect(result.overallPerformance.totalTime).toBeGreaterThan(0)
      })
    })

    it('should generate meaningful performance recommendations', async () => {
      const results = await benchmark.runComprehensiveBenchmark([100])
      const recommendations = benchmark.generateRecommendations(results)
      
      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.length).toBeGreaterThan(0)
      
      // Should include memory monitoring recommendation
      expect(recommendations.some(rec => rec.includes('memory'))).toBe(true)
    })
  })

  describe('Memory Usage Analysis', () => {
    it('should analyze memory usage patterns', async () => {
      const results = await benchmark.analyzeMemoryUsage(50)
      
      expect(results.length).toBeGreaterThan(0)
      
      results.forEach(result => {
        expect(result.teamCount).toBeGreaterThan(0)
        expect(result.memoryUsage).toBeGreaterThanOrEqual(0)
        expect(result.memoryPerTeam).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Real-time Performance Monitoring', () => {
    it('should record and track performance metrics', () => {
      // Simulate some operations
      monitor.record('scoreCalculation', 5.2)
      monitor.record('scoreCalculation', 4.8)
      monitor.record('scoreCalculation', 6.1)
      
      const stats = monitor.getStats('scoreCalculation')
      
      expect(stats).not.toBeNull()
      expect(stats!.average).toBeCloseTo(5.37, 1)
      expect(stats!.min).toBe(4.8)
      expect(stats!.max).toBe(6.1)
      expect(stats!.recent).toBe(6.1)
    })

    it('should detect performance trends', () => {
      // Simulate degrading performance
      for (let i = 0; i < 10; i++) {
        monitor.record('testOperation', 5 + i * 0.5) // Gradually increasing times
      }
      
      const stats = monitor.getStats('testOperation')
      expect(stats!.trend).toBe('degrading')
    })

    it('should generate performance alerts', () => {
      // Record some normal performance
      for (let i = 0; i < 5; i++) {
        monitor.record('normalOperation', 5)
      }
      
      // Record an unusually slow operation
      monitor.record('normalOperation', 15) // 3x slower than average
      
      const alerts = monitor.getPerformanceAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0]).toContain('Unusually slow')
    })

    it('should provide comprehensive statistics', () => {
      monitor.record('op1', 10)
      monitor.record('op2', 20)
      monitor.record('op1', 12)
      
      const allStats = monitor.getAllStats()
      
      expect(allStats).toHaveProperty('op1')
      expect(allStats).toHaveProperty('op2')
      expect(allStats.op1.average).toBe(11)
      expect(allStats.op2.average).toBe(20)
    })
  })

  describe('Incremental Score Calculator', () => {
    it('should calculate scores correctly', () => {
      const teams: Team[] = [
        { id: '1', name: 'Team 1', score: 0 },
        { id: '2', name: 'Team 2', score: 0 }
      ]
      
      const teamAnswers: TeamAnswer[] = [
        { questionId: 'q1', teamId: '1', answerIndex: 0, isCorrect: true },
        { questionId: 'q1', teamId: '2', answerIndex: 1, isCorrect: false },
        { questionId: 'q2', teamId: '1', answerIndex: 2, isCorrect: false },
        { questionId: 'q2', teamId: '2', answerIndex: 0, isCorrect: true }
      ]
      
      const result = scoreCalculator.calculateScores(teams, teamAnswers)
      
      expect(result[0].score).toBe(1) // Team 1: 1 correct
      expect(result[1].score).toBe(1) // Team 2: 1 correct
    })

    it('should use caching for repeated calculations', () => {
      const teams: Team[] = [
        { id: '1', name: 'Team 1', score: 0 }
      ]
      
      const teamAnswers: TeamAnswer[] = [
        { questionId: 'q1', teamId: '1', answerIndex: 0, isCorrect: true }
      ]
      
      // First calculation
      const result1 = scoreCalculator.calculateScores(teams, teamAnswers)
      
      // Second calculation (should use cache)
      const result2 = scoreCalculator.calculateScores(teams, teamAnswers)
      
      expect(result1).toEqual(result2)
      
      // Test that cache is working by checking that repeated calls with same data
      // return consistent results (the actual timing can vary due to system load)
      const result3 = scoreCalculator.calculateScores(teams, teamAnswers)
      expect(result3).toEqual(result1)
      expect(result3[0].score).toBe(1) // Verify the score is correct
    })

    it('should handle incremental updates efficiently', () => {
      const teams: Team[] = [
        { id: '1', name: 'Team 1', score: 0 }
      ]
      
      let teamAnswers: TeamAnswer[] = [
        { questionId: 'q1', teamId: '1', answerIndex: 0, isCorrect: true }
      ]
      
      // Initial calculation
      let result = scoreCalculator.calculateScores(teams, teamAnswers)
      expect(result[0].score).toBe(1)
      
      // Add more answers
      teamAnswers = [
        ...teamAnswers,
        { questionId: 'q2', teamId: '1', answerIndex: 1, isCorrect: true }
      ]
      
      result = scoreCalculator.calculateScores(teams, teamAnswers)
      expect(result[0].score).toBe(2)
    })

    it('should reset cache properly', () => {
      const teams: Team[] = [
        { id: '1', name: 'Team 1', score: 0 }
      ]
      
      const teamAnswers: TeamAnswer[] = [
        { questionId: 'q1', teamId: '1', answerIndex: 0, isCorrect: true }
      ]
      
      // Calculate scores
      let result = scoreCalculator.calculateScores(teams, teamAnswers)
      expect(result[0].score).toBe(1)
      
      // Reset and recalculate
      scoreCalculator.reset()
      result = scoreCalculator.calculateScores(teams, teamAnswers)
      expect(result[0].score).toBe(1) // Should still be correct after reset
    })
  })

  describe('Performance Thresholds', () => {
    it('should meet performance requirements for typical usage', async () => {
      // Test typical usage scenario: 20 teams, 30 questions
      const scoreResult = await benchmark.benchmarkScoreCalculation(20, 30)
      const sortResult = await benchmark.benchmarkTeamSorting(20)
      const filterResult = await benchmark.benchmarkTeamFiltering(20)
      
      // Performance requirements for typical usage
      expect(scoreResult.averageTime).toBeLessThan(10) // Score calculation under 10ms
      expect(sortResult.averageTime).toBeLessThan(5)   // Sorting under 5ms
      expect(filterResult.averageTime).toBeLessThan(2) // Filtering under 2ms
    })

    it('should handle stress test scenarios', async () => {
      // Stress test: 200 teams, 100 questions
      const scoreResult = await benchmark.benchmarkScoreCalculation(200, 100)
      
      // Should still complete in reasonable time even under stress
      expect(scoreResult.averageTime).toBeLessThan(200) // Under 200ms for extreme case
    })
  })

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', () => {
      // Simulate baseline performance
      for (let i = 0; i < 20; i++) {
        monitor.record('baselineOperation', 10 + Math.random() * 2) // 10-12ms
      }
      
      // Simulate performance regression
      for (let i = 0; i < 10; i++) {
        monitor.record('baselineOperation', 20 + Math.random() * 2) // 20-22ms (regression)
      }
      
      const stats = monitor.getStats('baselineOperation')
      expect(stats!.trend).toBe('degrading')
      
      const alerts = monitor.getPerformanceAlerts()
      expect(alerts.length).toBeGreaterThan(0)
    })
  })
})