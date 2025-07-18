import { describe, it, expect } from 'vitest';
import type { 
  Question, 
  QuizMetadata, 
  QuizData, 
  QuizState, 
  AppTheme, 
  QuizStats,
  UserPreferences,
  AnswerState,
  DifficultyLevel,
  QuestionCategory,
  Team,
  TeamAnswer,
  QuestionResults,
  UserMode,
  PersistedTeamData
} from '../index';

describe('TypeScript Interfaces Validation', () => {
  describe('Question Interface', () => {
    it('should validate a complete question object', () => {
      const question: Question = {
        id: 'q001',
        question: 'Test question?',
        answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'],
        correctAnswer: 0,
        category: 'Romance',
        difficulty: 'medium',
        explanation: 'Test explanation'
      };

      expect(question.id).toBe('q001');
      expect(question.answers).toHaveLength(4);
      expect(question.correctAnswer).toBe(0);
      expect(['easy', 'medium', 'hard']).toContain(question.difficulty);
    });

    it('should validate a minimal question object', () => {
      const question: Question = {
        id: 'q002',
        question: 'Minimal question?',
        answers: ['Yes', 'No'],
        correctAnswer: 1
      };

      expect(question.id).toBe('q002');
      expect(question.category).toBeUndefined();
      expect(question.difficulty).toBeUndefined();
      expect(question.explanation).toBeUndefined();
    });
  });

  describe('QuizMetadata Interface', () => {
    it('should validate quiz metadata', () => {
      const metadata: QuizMetadata = {
        title: 'Test Quiz',
        version: '1.0',
        totalQuestions: 10,
        categories: ['Category1', 'Category2'],
        description: 'Test description'
      };

      expect(metadata.title).toBe('Test Quiz');
      expect(metadata.categories).toHaveLength(2);
      expect(metadata.totalQuestions).toBe(10);
    });
  });

  describe('QuizData Interface', () => {
    it('should validate complete quiz data structure', () => {
      const quizData: QuizData = {
        metadata: {
          title: 'Cinema Quiz',
          version: '1.0',
          totalQuestions: 2,
          categories: ['Romance', 'Comedy']
        },
        questions: [
          {
            id: 'q001',
            question: 'Question 1?',
            answers: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            category: 'Romance',
            difficulty: 'easy'
          },
          {
            id: 'q002',
            question: 'Question 2?',
            answers: ['A', 'B'],
            correctAnswer: 1,
            category: 'Comedy',
            difficulty: 'hard'
          }
        ]
      };

      expect(quizData.metadata.totalQuestions).toBe(2);
      expect(quizData.questions).toHaveLength(2);
      expect(quizData.questions[0].category).toBe('Romance');
    });
  });

  describe('Team Interface', () => {
    it('should validate team structure', () => {
      const team: Team = {
        id: 'team-001',
        name: 'Les Cinéphiles',
        score: 5,
        color: '#ff6b6b'
      };

      expect(team.id).toBe('team-001');
      expect(team.name).toBe('Les Cinéphiles');
      expect(team.score).toBe(5);
      expect(team.color).toBe('#ff6b6b');
    });

    it('should validate team without optional color', () => {
      const team: Team = {
        id: 'team-002',
        name: 'Team Alpha',
        score: 0
      };

      expect(team.id).toBe('team-002');
      expect(team.name).toBe('Team Alpha');
      expect(team.score).toBe(0);
      expect(team.color).toBeUndefined();
    });
  });

  describe('TeamAnswer Interface', () => {
    it('should validate team answer structure', () => {
      const teamAnswer: TeamAnswer = {
        questionId: 'q001',
        teamId: 'team-001',
        answerIndex: 2,
        isCorrect: true
      };

      expect(teamAnswer.questionId).toBe('q001');
      expect(teamAnswer.teamId).toBe('team-001');
      expect(teamAnswer.answerIndex).toBe(2);
      expect(teamAnswer.isCorrect).toBe(true);
    });

    it('should validate incorrect team answer', () => {
      const teamAnswer: TeamAnswer = {
        questionId: 'q002',
        teamId: 'team-002',
        answerIndex: 1,
        isCorrect: false
      };

      expect(teamAnswer.isCorrect).toBe(false);
      expect(teamAnswer.answerIndex).toBe(1);
    });
  });

  describe('QuestionResults Interface', () => {
    it('should validate question results structure', () => {
      const questionResults: QuestionResults = {
        questionId: 'q001',
        correctAnswer: 0,
        teamAnswers: [
          {
            teamId: 'team-001',
            teamName: 'Les Cinéphiles',
            answerIndex: 0,
            isCorrect: true
          },
          {
            teamId: 'team-002',
            teamName: 'Team Alpha',
            answerIndex: 1,
            isCorrect: false
          }
        ]
      };

      expect(questionResults.questionId).toBe('q001');
      expect(questionResults.correctAnswer).toBe(0);
      expect(questionResults.teamAnswers).toHaveLength(2);
      expect(questionResults.teamAnswers[0].isCorrect).toBe(true);
      expect(questionResults.teamAnswers[1].isCorrect).toBe(false);
    });

    it('should validate empty question results', () => {
      const questionResults: QuestionResults = {
        questionId: 'q003',
        correctAnswer: 2,
        teamAnswers: []
      };

      expect(questionResults.teamAnswers).toHaveLength(0);
      expect(questionResults.correctAnswer).toBe(2);
    });
  });

  describe('QuizState Interface', () => {
    it('should validate participant mode quiz state', () => {
      const startTime = new Date();
      const quizState: QuizState = {
        questions: [],
        teams: [],
        currentQuestionIndex: 0,
        userMode: 'participant',
        teamAnswers: [],
        isCompleted: false,
        startTime: startTime,
        endTime: undefined,
        isLoading: false,
        error: undefined,
        participantAnswers: [0, 1, 2],
        currentQuestionTeamAssignments: new Map(),
        // Backward compatibility
        score: 3,
        answers: [0, 1, 2]
      };

      expect(quizState.userMode).toBe('participant');
      expect(quizState.participantAnswers).toHaveLength(3);
      expect(quizState.teams).toHaveLength(0);
      expect(quizState.teamAnswers).toHaveLength(0);
      expect(quizState.currentQuestionTeamAssignments).toBeInstanceOf(Map);
    });

    it('should validate host mode quiz state with teams', () => {
      const startTime = new Date();
      const teams: Team[] = [
        { id: 'team-001', name: 'Team A', score: 2 },
        { id: 'team-002', name: 'Team B', score: 1 }
      ];
      const teamAnswers: TeamAnswer[] = [
        { questionId: 'q001', teamId: 'team-001', answerIndex: 0, isCorrect: true },
        { questionId: 'q001', teamId: 'team-002', answerIndex: 1, isCorrect: false }
      ];

      const quizState: QuizState = {
        questions: [],
        teams: teams,
        currentQuestionIndex: 1,
        userMode: 'host',
        teamAnswers: teamAnswers,
        isCompleted: false,
        startTime: startTime,
        endTime: undefined,
        isLoading: false,
        error: undefined,
        participantAnswers: [],
        currentQuestionTeamAssignments: new Map([[0, ['team-001']], [1, ['team-002']]]),
        // Backward compatibility
        score: 0,
        answers: []
      };

      expect(quizState.userMode).toBe('host');
      expect(quizState.teams).toHaveLength(2);
      expect(quizState.teamAnswers).toHaveLength(2);
      expect(quizState.currentQuestionTeamAssignments.get(0)).toEqual(['team-001']);
      expect(quizState.currentQuestionTeamAssignments.get(1)).toEqual(['team-002']);
    });

    it('should validate completed team quiz state', () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 300000); // 5 minutes later
      
      const completedState: QuizState = {
        questions: [],
        teams: [
          { id: 'team-001', name: 'Winners', score: 8 },
          { id: 'team-002', name: 'Runners-up', score: 6 }
        ],
        currentQuestionIndex: 10,
        userMode: 'host',
        teamAnswers: [],
        isCompleted: true,
        startTime: startTime,
        endTime: endTime,
        isLoading: false,
        participantAnswers: [],
        currentQuestionTeamAssignments: new Map(),
        // Backward compatibility
        score: 0,
        answers: []
      };

      expect(completedState.isCompleted).toBe(true);
      expect(completedState.teams[0].score).toBe(8);
      expect(completedState.teams[1].score).toBe(6);
      expect(completedState.endTime).toBeDefined();
    });
  });

  describe('AppTheme Interface', () => {
    it('should validate app theme structure', () => {
      const theme: AppTheme = {
        primary: '#6366f1',
        primaryLight: '#818cf8',
        primaryDark: '#4f46e5',
        secondary: '#ec4899',
        accent: '#f59e0b',
        background: '#fafafa',
        surface: '#ffffff',
        textPrimary: '#1f2937',
        textSecondary: '#6b7280',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
      };

      expect(theme.primary).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.background).toBe('#fafafa');
      expect(theme.surface).toBe('#ffffff');
    });
  });

  describe('QuizStats Interface', () => {
    it('should validate quiz statistics', () => {
      const stats: QuizStats = {
        totalQuestions: 10,
        correctAnswers: 7,
        incorrectAnswers: 3,
        scorePercentage: 70,
        timeSpent: 300, // 5 minutes
        averageTimePerQuestion: 30 // 30 seconds per question
      };

      expect(stats.correctAnswers + stats.incorrectAnswers).toBe(stats.totalQuestions);
      expect(stats.scorePercentage).toBe(70);
      expect(stats.averageTimePerQuestion).toBe(stats.timeSpent / stats.totalQuestions);
    });
  });

  describe('UserPreferences Interface', () => {
    it('should validate user preferences', () => {
      const preferences: UserPreferences = {
        theme: 'light',
        soundEnabled: true,
        animationsEnabled: true,
        language: 'fr'
      };

      expect(['light', 'dark', 'auto']).toContain(preferences.theme);
      expect(['fr', 'en']).toContain(preferences.language);
      expect(typeof preferences.soundEnabled).toBe('boolean');
      expect(typeof preferences.animationsEnabled).toBe('boolean');
    });
  });

  describe('PersistedTeamData Interface', () => {
    it('should validate persisted team data structure', () => {
      const persistedTeamData: PersistedTeamData = {
        teams: [
          { id: 'team-001', name: 'Team A', score: 5, color: '#ff6b6b' },
          { id: 'team-002', name: 'Team B', score: 3 }
        ],
        lastUsedTeams: [
          { id: 'team-001', name: 'Team A', score: 0, color: '#ff6b6b' }
        ],
        teamColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
      };

      expect(persistedTeamData.teams).toHaveLength(2);
      expect(persistedTeamData.lastUsedTeams).toHaveLength(1);
      expect(persistedTeamData.teamColors).toHaveLength(5);
      expect(persistedTeamData.teams[0].color).toBe('#ff6b6b');
      expect(persistedTeamData.teams[1].color).toBeUndefined();
    });

    it('should validate empty persisted team data', () => {
      const emptyData: PersistedTeamData = {
        teams: [],
        lastUsedTeams: [],
        teamColors: []
      };

      expect(emptyData.teams).toHaveLength(0);
      expect(emptyData.lastUsedTeams).toHaveLength(0);
      expect(emptyData.teamColors).toHaveLength(0);
    });
  });

  describe('Type Unions', () => {
    it('should validate AnswerState type', () => {
      const states: AnswerState[] = ['normal', 'selected', 'correct', 'incorrect'];
      
      states.forEach(state => {
        expect(['normal', 'selected', 'correct', 'incorrect']).toContain(state);
      });
    });

    it('should validate DifficultyLevel type', () => {
      const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];
      
      difficulties.forEach(difficulty => {
        expect(['easy', 'medium', 'hard']).toContain(difficulty);
      });
    });

    it('should validate QuestionCategory type', () => {
      const categories: QuestionCategory[] = ['Romance', 'Comédie', 'Drame', 'Acteurs', 'Réalisateurs'];
      
      categories.forEach(category => {
        expect(['Romance', 'Comédie', 'Drame', 'Acteurs', 'Réalisateurs']).toContain(category);
      });
    });

    it('should validate UserMode type', () => {
      const modes: UserMode[] = ['host', 'participant'];
      
      modes.forEach(mode => {
        expect(['host', 'participant']).toContain(mode);
      });
    });
  });

  describe('JSON Data Validation', () => {
    it('should validate that JSON structure matches TypeScript interfaces', () => {
      // Simulate loading JSON data
      const mockJsonData = {
        metadata: {
          title: 'Quiz Cinéma Soirée Filles',
          version: '1.0',
          totalQuestions: 2,
          categories: ['Romance', 'Comédie']
        },
        questions: [
          {
            id: 'q001',
            question: 'Test question?',
            answers: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            category: 'Romance',
            difficulty: 'medium',
            explanation: 'Test explanation'
          }
        ]
      };

      // Type assertion to validate structure
      const typedData: QuizData = mockJsonData as QuizData;
      
      expect(typedData.metadata.title).toBe('Quiz Cinéma Soirée Filles');
      expect(typedData.questions[0].id).toBe('q001');
      expect(typedData.questions[0].answers).toHaveLength(4);
      expect(typedData.questions[0].correctAnswer).toBe(0);
    });
  });
});