import { describe, it, expect } from 'vitest';
import type { QuizData, Question } from '../index';
import quizQuestionsJson from '../../data/quiz-questions.json';

describe('JSON Data Validation Against TypeScript Interfaces', () => {
  it('should validate that quiz-questions.json matches QuizData interface', () => {
    // Type assertion to ensure JSON matches our interface
    const quizData: QuizData = quizQuestionsJson as QuizData;
    
    // Validate metadata structure
    expect(quizData.metadata).toBeDefined();
    expect(quizData.metadata.title).toBe('Quiz Cinéma Soirée Filles');
    expect(quizData.metadata.version).toBe('1.0');
    expect(quizData.metadata.totalQuestions).toBe(18);
    expect(Array.isArray(quizData.metadata.categories)).toBe(true);
    expect(quizData.metadata.categories).toContain('Romance');
    expect(quizData.metadata.categories).toContain('Comédie');
    expect(quizData.metadata.categories).toContain('Drame');
    expect(quizData.metadata.categories).toContain('Acteurs');
    expect(quizData.metadata.categories).toContain('Réalisateurs');
  });

  it('should validate that all questions match Question interface', () => {
    const quizData: QuizData = quizQuestionsJson as QuizData;
    
    expect(Array.isArray(quizData.questions)).toBe(true);
    expect(quizData.questions).toHaveLength(18);
    
    quizData.questions.forEach((question: Question, index: number) => {
      // Required fields
      expect(question.id).toBeDefined();
      expect(typeof question.id).toBe('string');
      expect(question.id).toMatch(/^q\d{3}$/); // Format: q001, q002, etc.
      
      expect(question.question).toBeDefined();
      expect(typeof question.question).toBe('string');
      expect(question.question.length).toBeGreaterThan(0);
      
      expect(Array.isArray(question.answers)).toBe(true);
      expect(question.answers.length).toBeGreaterThanOrEqual(2);
      question.answers.forEach(answer => {
        expect(typeof answer).toBe('string');
        expect(answer.length).toBeGreaterThan(0);
      });
      
      expect(typeof question.correctAnswer).toBe('number');
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(question.correctAnswer).toBeLessThan(question.answers.length);
      
      // Optional fields validation
      if (question.category) {
        expect(typeof question.category).toBe('string');
        expect(['Romance', 'Comédie', 'Drame', 'Acteurs', 'Réalisateurs']).toContain(question.category);
      }
      
      if (question.difficulty) {
        expect(['easy', 'medium', 'hard']).toContain(question.difficulty);
      }
      
      if (question.explanation) {
        expect(typeof question.explanation).toBe('string');
        expect(question.explanation.length).toBeGreaterThan(0);
      }
    });
  });

  it('should validate question categories distribution', () => {
    const quizData: QuizData = quizQuestionsJson as QuizData;
    
    const categoryCount = quizData.questions.reduce((acc, question) => {
      if (question.category) {
        acc[question.category] = (acc[question.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Ensure we have questions from multiple categories
    expect(Object.keys(categoryCount).length).toBeGreaterThanOrEqual(3);
    
    // Ensure each category has at least one question
    Object.values(categoryCount).forEach(count => {
      expect(count).toBeGreaterThan(0);
    });
  });

  it('should validate difficulty levels distribution', () => {
    const quizData: QuizData = quizQuestionsJson as QuizData;
    
    const difficultyCount = quizData.questions.reduce((acc, question) => {
      if (question.difficulty) {
        acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Ensure we have questions with different difficulty levels
    expect(Object.keys(difficultyCount).length).toBeGreaterThanOrEqual(2);
    
    // Ensure each difficulty has at least one question
    Object.values(difficultyCount).forEach(count => {
      expect(count).toBeGreaterThan(0);
    });
  });

  it('should validate that metadata totalQuestions matches actual questions count', () => {
    const quizData: QuizData = quizQuestionsJson as QuizData;
    
    expect(quizData.metadata.totalQuestions).toBe(quizData.questions.length);
  });

  it('should validate unique question IDs', () => {
    const quizData: QuizData = quizQuestionsJson as QuizData;
    
    const questionIds = quizData.questions.map(q => q.id);
    const uniqueIds = new Set(questionIds);
    
    expect(uniqueIds.size).toBe(questionIds.length);
  });

  it('should validate that all questions have explanations', () => {
    const quizData: QuizData = quizQuestionsJson as QuizData;
    
    quizData.questions.forEach(question => {
      expect(question.explanation).toBeDefined();
      expect(typeof question.explanation).toBe('string');
      expect(question.explanation!.length).toBeGreaterThan(10); // Meaningful explanation
    });
  });
});