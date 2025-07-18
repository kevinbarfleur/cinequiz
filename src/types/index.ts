/**
 * Interface pour une question de quiz
 */
export interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

/**
 * Interface pour les métadonnées du quiz
 */
export interface QuizMetadata {
  title: string;
  version: string;
  totalQuestions: number;
  categories: string[];
  description?: string;
}

/**
 * Interface pour la structure complète du fichier JSON
 */
export interface QuizData {
  metadata: QuizMetadata;
  questions: Question[];
}

/**
 * Interface pour une équipe
 */
export interface Team {
  id: string;
  name: string;
  score: number;
  color?: string;
}

/**
 * Interface pour lier une équipe à une réponse
 */
export interface TeamAnswer {
  questionId: string;
  teamId: string;
  answerIndex: number;
  isCorrect: boolean;
}

/**
 * Interface pour les résultats détaillés d'une question
 */
export interface QuestionResults {
  questionId: string;
  correctAnswer: number;
  teamAnswers: {
    teamId: string;
    teamName: string;
    answerIndex: number;
    isCorrect: boolean;
  }[];
}

/**
 * Interface pour l'état du quiz dans l'application
 */
export interface QuizState {
  questions: Question[];
  teams: Team[];
  currentQuestionIndex: number;
  userMode: 'host' | 'participant';
  teamAnswers: TeamAnswer[];
  isCompleted: boolean;
  startTime: Date;
  endTime?: Date;
  isLoading: boolean;
  error?: string;
  // Pour le mode participant
  participantAnswers: number[];
  // Pour le mode animateur
  currentQuestionTeamAssignments: Map<number, string[]>; // answerIndex -> teamIds
  // Anciens champs pour compatibilité
  score: number;
  answers: number[];
}

/**
 * Interface pour le thème de l'application
 */
export interface AppTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  error: string;
  warning: string;
}

/**
 * Interface pour les statistiques de performance
 */
export interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercentage: number;
  timeSpent: number; // en secondes
  averageTimePerQuestion: number;
}

/**
 * Interface pour les préférences utilisateur
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  language: 'fr' | 'en';
}

/**
 * Type pour les états de réponse
 */
export type AnswerState = 'normal' | 'selected' | 'correct' | 'incorrect';

/**
 * Type pour les niveaux de difficulté
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Type pour les catégories de questions
 */
export type QuestionCategory = 'Romance' | 'Comédie' | 'Drame' | 'Acteurs' | 'Réalisateurs';

/**
 * Type pour les modes utilisateur
 */
export type UserMode = 'host' | 'participant';

/**
 * Interface pour les données d'équipe persistées
 */
export interface PersistedTeamData {
  teams: Team[];
  lastUsedTeams: Team[];
  teamColors: string[];
}

/**
 * Interface pour les données persistées dans localStorage
 */
export interface PersistedQuizData {
  bestScore: number;
  totalGamesPlayed: number;
  lastPlayedDate: string;
  averageScore: number;
  bestTime: number; // en secondes
  preferences: UserPreferences;
  // Données d'équipes
  teamData?: PersistedTeamData;
  // Sessions d'équipes
  lastTeamSession?: {
    teams: Team[];
    teamAnswers: TeamAnswer[];
    currentQuestionIndex: number;
    userMode: UserMode;
    sessionId: string;
    timestamp: string;
  };
}

/**
 * Interface pour le cache des questions
 */
export interface QuestionCache {
  questions: Question[];
  lastUpdated: string;
  version: string;
}