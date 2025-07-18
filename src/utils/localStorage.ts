import type { PersistedQuizData, QuestionCache, UserPreferences, Team, TeamAnswer, PersistedTeamData, UserMode } from '@/types'

// Clés pour localStorage
const STORAGE_KEYS = {
  QUIZ_DATA: 'quiz-cinema-data',
  QUESTION_CACHE: 'quiz-cinema-questions-cache',
  USER_PREFERENCES: 'quiz-cinema-preferences',
  TEAM_DATA: 'quiz-cinema-teams',
  TEAM_SESSION: 'quiz-cinema-team-session'
} as const

// Préférences par défaut
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  soundEnabled: true,
  animationsEnabled: true,
  language: 'fr'
}

// Données par défaut
const DEFAULT_QUIZ_DATA: PersistedQuizData = {
  bestScore: 0,
  totalGamesPlayed: 0,
  lastPlayedDate: '',
  averageScore: 0,
  bestTime: 0,
  preferences: DEFAULT_PREFERENCES
}

// Données d'équipes par défaut
const DEFAULT_TEAM_DATA: PersistedTeamData = {
  teams: [],
  lastUsedTeams: [],
  teamColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
}

// Interface pour les sessions d'équipes
interface TeamSession {
  teams: Team[]
  teamAnswers: TeamAnswer[]
  currentQuestionIndex: number
  userMode: UserMode
  sessionId: string
  timestamp: string
}

/**
 * Utilitaires pour la gestion du localStorage
 */
export class LocalStorageManager {
  /**
   * Sauvegarde des données de manière sécurisée
   */
  private static setItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde dans localStorage (${key}):`, error)
      return false
    }
  }

  /**
   * Récupération des données de manière sécurisée
   */
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      if (item === null) {
        return defaultValue
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Erreur lors de la lecture du localStorage (${key}):`, error)
      return defaultValue
    }
  }

  /**
   * Suppression sécurisée d'un élément
   */
  private static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Erreur lors de la suppression du localStorage (${key}):`, error)
      return false
    }
  }

  /**
   * Sauvegarde du score et des statistiques
   */
  static saveQuizResult(score: number, totalQuestions: number, timeSpent: number): boolean {
    const currentData = this.getQuizData()
    const scorePercentage = Math.round((score / totalQuestions) * 100)
    
    // Mise à jour des statistiques
    const newTotalGames = currentData.totalGamesPlayed + 1
    const newAverageScore = Math.round(
      ((currentData.averageScore * currentData.totalGamesPlayed) + scorePercentage) / newTotalGames
    )

    const updatedData: PersistedQuizData = {
      ...currentData,
      bestScore: Math.max(currentData.bestScore, scorePercentage),
      totalGamesPlayed: newTotalGames,
      lastPlayedDate: new Date().toISOString(),
      averageScore: newAverageScore,
      bestTime: currentData.bestTime === 0 ? timeSpent : Math.min(currentData.bestTime, timeSpent)
    }

    return this.setItem(STORAGE_KEYS.QUIZ_DATA, updatedData)
  }

  /**
   * Récupération des données du quiz
   */
  static getQuizData(): PersistedQuizData {
    return this.getItem(STORAGE_KEYS.QUIZ_DATA, DEFAULT_QUIZ_DATA)
  }

  /**
   * Sauvegarde des préférences utilisateur
   */
  static saveUserPreferences(preferences: UserPreferences): boolean {
    const currentData = this.getQuizData()
    const updatedData: PersistedQuizData = {
      ...currentData,
      preferences
    }
    
    // Sauvegarde aussi séparément pour un accès rapide
    this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences)
    return this.setItem(STORAGE_KEYS.QUIZ_DATA, updatedData)
  }

  /**
   * Récupération des préférences utilisateur
   */
  static getUserPreferences(): UserPreferences {
    return this.getItem(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES)
  }

  /**
   * Sauvegarde du cache des questions
   */
  static saveQuestionCache(questions: any[], version: string = '1.0'): boolean {
    const cache: QuestionCache = {
      questions,
      lastUpdated: new Date().toISOString(),
      version
    }
    
    return this.setItem(STORAGE_KEYS.QUESTION_CACHE, cache)
  }

  /**
   * Récupération du cache des questions
   */
  static getQuestionCache(): QuestionCache | null {
    const cache = this.getItem<QuestionCache | null>(STORAGE_KEYS.QUESTION_CACHE, null)
    
    if (!cache) {
      return null
    }

    // Vérifier si le cache n'est pas trop ancien (24h)
    const lastUpdated = new Date(cache.lastUpdated)
    const now = new Date()
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      this.clearQuestionCache()
      return null
    }

    return cache
  }

  /**
   * Suppression du cache des questions
   */
  static clearQuestionCache(): boolean {
    return this.removeItem(STORAGE_KEYS.QUESTION_CACHE)
  }

  /**
   * Sauvegarde des données d'équipes
   */
  static saveTeamData(teams: Team[]): boolean {
    const currentData = this.getTeamData()
    const updatedData: PersistedTeamData = {
      ...currentData,
      teams: [...teams],
      lastUsedTeams: teams.length > 0 ? [...teams] : currentData.lastUsedTeams
    }
    
    return this.setItem(STORAGE_KEYS.TEAM_DATA, updatedData)
  }

  /**
   * Récupération des données d'équipes
   */
  static getTeamData(): PersistedTeamData {
    return this.getItem(STORAGE_KEYS.TEAM_DATA, DEFAULT_TEAM_DATA)
  }

  /**
   * Sauvegarde d'une session d'équipes
   */
  static saveTeamSession(
    teams: Team[],
    teamAnswers: TeamAnswer[],
    currentQuestionIndex: number,
    userMode: UserMode
  ): boolean {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const session: TeamSession = {
      teams: [...teams],
      teamAnswers: [...teamAnswers],
      currentQuestionIndex,
      userMode,
      sessionId,
      timestamp: new Date().toISOString()
    }
    
    return this.setItem(STORAGE_KEYS.TEAM_SESSION, session)
  }

  /**
   * Récupération de la session d'équipes
   */
  static getTeamSession(): TeamSession | null {
    const session = this.getItem<TeamSession | null>(STORAGE_KEYS.TEAM_SESSION, null)
    
    if (!session) {
      return null
    }

    // Vérifier si la session n'est pas trop ancienne (24h)
    const timestamp = new Date(session.timestamp)
    const now = new Date()
    const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      this.clearTeamSession()
      return null
    }

    return session
  }

  /**
   * Suppression de la session d'équipes
   */
  static clearTeamSession(): boolean {
    return this.removeItem(STORAGE_KEYS.TEAM_SESSION)
  }

  /**
   * Sauvegarde des couleurs d'équipes personnalisées
   */
  static saveTeamColors(colors: string[]): boolean {
    const currentData = this.getTeamData()
    const updatedData: PersistedTeamData = {
      ...currentData,
      teamColors: [...colors]
    }
    
    return this.setItem(STORAGE_KEYS.TEAM_DATA, updatedData)
  }

  /**
   * Récupération des couleurs d'équipes disponibles
   */
  static getTeamColors(): string[] {
    const teamData = this.getTeamData()
    return teamData.teamColors
  }

  /**
   * Sauvegarde des équipes utilisées récemment
   */
  static saveLastUsedTeams(teams: Team[]): boolean {
    const currentData = this.getTeamData()
    const updatedData: PersistedTeamData = {
      ...currentData,
      lastUsedTeams: [...teams]
    }
    
    return this.setItem(STORAGE_KEYS.TEAM_DATA, updatedData)
  }

  /**
   * Récupération des équipes utilisées récemment
   */
  static getLastUsedTeams(): Team[] {
    const teamData = this.getTeamData()
    return teamData.lastUsedTeams
  }

  /**
   * Vérification de l'existence d'une session interrompue
   */
  static hasInterruptedSession(): boolean {
    const session = this.getTeamSession()
    return session !== null && session.teams.length > 0
  }

  /**
   * Restauration d'une session interrompue
   */
  static restoreInterruptedSession(): {
    teams: Team[]
    teamAnswers: TeamAnswer[]
    currentQuestionIndex: number
    userMode: UserMode
  } | null {
    const session = this.getTeamSession()
    
    if (!session) {
      return null
    }

    return {
      teams: session.teams,
      teamAnswers: session.teamAnswers,
      currentQuestionIndex: session.currentQuestionIndex,
      userMode: session.userMode
    }
  }

  /**
   * Réinitialisation complète des données
   */
  static resetAllData(): boolean {
    const success1 = this.removeItem(STORAGE_KEYS.QUIZ_DATA)
    const success2 = this.removeItem(STORAGE_KEYS.QUESTION_CACHE)
    const success3 = this.removeItem(STORAGE_KEYS.USER_PREFERENCES)
    const success4 = this.removeItem(STORAGE_KEYS.TEAM_DATA)
    const success5 = this.removeItem(STORAGE_KEYS.TEAM_SESSION)
    
    return success1 && success2 && success3 && success4 && success5
  }

  /**
   * Vérification de la disponibilité du localStorage
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, 'test')
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * Obtenir la taille utilisée du localStorage (approximative)
   */
  static getStorageSize(): number {
    let total = 0
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          if (value) {
            total += key.length + value.length
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la taille du localStorage:', error)
      return 0
    }
    return total
  }

  /**
   * Export des données pour sauvegarde externe
   */
  static exportData(): string {
    const data = {
      quizData: this.getQuizData(),
      questionCache: this.getQuestionCache(),
      preferences: this.getUserPreferences(),
      teamData: this.getTeamData(),
      teamSession: this.getTeamSession(),
      exportDate: new Date().toISOString()
    }
    
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import des données depuis une sauvegarde externe
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.quizData) {
        this.setItem(STORAGE_KEYS.QUIZ_DATA, data.quizData)
      }
      
      if (data.questionCache) {
        this.setItem(STORAGE_KEYS.QUESTION_CACHE, data.questionCache)
      }
      
      if (data.preferences) {
        this.setItem(STORAGE_KEYS.USER_PREFERENCES, data.preferences)
      }
      
      if (data.teamData) {
        this.setItem(STORAGE_KEYS.TEAM_DATA, data.teamData)
      }
      
      if (data.teamSession) {
        this.setItem(STORAGE_KEYS.TEAM_SESSION, data.teamSession)
      }
      
      return true
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error)
      return false
    }
  }
}