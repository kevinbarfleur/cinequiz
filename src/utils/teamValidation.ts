import type { Team, TeamAnswer } from '@/types'

/**
 * Interface pour les résultats de validation
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Interface pour les options de validation des équipes
 */
export interface TeamValidationOptions {
  minTeams?: number
  maxTeams?: number
  minNameLength?: number
  maxNameLength?: number
  allowDuplicateNames?: boolean
  requiredFields?: (keyof Team)[]
}

/**
 * Configuration par défaut pour la validation des équipes
 */
export const DEFAULT_TEAM_VALIDATION_OPTIONS: Required<TeamValidationOptions> = {
  minTeams: 1,
  maxTeams: 20,
  minNameLength: 1,
  maxNameLength: 50,
  allowDuplicateNames: false,
  requiredFields: ['id', 'name']
}

/**
 * Messages d'erreur spécifiques aux équipes
 */
export const TEAM_VALIDATION_MESSAGES = {
  // Erreurs de nombre d'équipes
  MIN_TEAMS: (min: number) => `Au moins ${min} équipe${min > 1 ? 's' : ''} ${min > 1 ? 'sont' : 'est'} requise${min > 1 ? 's' : ''} pour démarrer le quiz`,
  MAX_TEAMS: (max: number) => `Le nombre maximum d'équipes est de ${max}`,
  
  // Erreurs de nom d'équipe
  EMPTY_NAME: 'Le nom de l\'équipe ne peut pas être vide',
  NAME_TOO_SHORT: (min: number) => `Le nom de l'équipe doit contenir au moins ${min} caractère${min > 1 ? 's' : ''}`,
  NAME_TOO_LONG: (max: number) => `Le nom de l'équipe ne peut pas dépasser ${max} caractères`,
  DUPLICATE_NAME: (name: string) => `Une équipe avec le nom "${name}" existe déjà`,
  INVALID_NAME_FORMAT: 'Le nom de l\'équipe contient des caractères non autorisés',
  
  // Erreurs de champs requis
  MISSING_ID: 'L\'identifiant de l\'équipe est requis',
  MISSING_NAME: 'Le nom de l\'équipe est requis',
  INVALID_ID_FORMAT: 'L\'identifiant de l\'équipe doit être une chaîne non vide',
  
  // Erreurs d'attribution de réponses
  TEAM_NOT_FOUND: (teamId: string) => `L'équipe avec l'ID "${teamId}" n'existe pas`,
  INVALID_ANSWER_INDEX: (index: number, max: number) => `L'index de réponse ${index} est invalide (doit être entre 0 et ${max - 1})`,
  MISSING_TEAM_ASSIGNMENTS: 'Toutes les équipes doivent être assignées à une réponse avant de continuer',
  DUPLICATE_TEAM_ASSIGNMENT: (teamName: string) => `L'équipe "${teamName}" a déjà été assignée à une réponse pour cette question`,
  
  // Erreurs de couleur
  INVALID_COLOR_FORMAT: 'Le format de couleur est invalide (utilisez le format hexadécimal #RRGGBB)',
  
  // Avertissements
  NO_COLOR_ASSIGNED: 'Aucune couleur n\'a été assignée à cette équipe',
  SIMILAR_TEAM_NAMES: (names: string[]) => `Les noms d'équipes suivants sont très similaires : ${names.join(', ')}`
} as const

/**
 * Valide le nom d'une équipe
 */
export function validateTeamName(
  name: string, 
  existingTeams: Team[] = [], 
  excludeTeamId?: string,
  options: Partial<TeamValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_TEAM_VALIDATION_OPTIONS, ...options }
  const errors: string[] = []
  const warnings: string[] = []

  // Vérifier si le nom est vide
  if (!name || typeof name !== 'string') {
    errors.push(TEAM_VALIDATION_MESSAGES.MISSING_NAME)
    return { isValid: false, errors, warnings }
  }

  const trimmedName = name.trim()

  // Vérifier la longueur minimale
  if (trimmedName.length < opts.minNameLength) {
    if (trimmedName.length === 0) {
      errors.push(TEAM_VALIDATION_MESSAGES.EMPTY_NAME)
    } else {
      errors.push(TEAM_VALIDATION_MESSAGES.NAME_TOO_SHORT(opts.minNameLength))
    }
  }

  // Vérifier la longueur maximale
  if (trimmedName.length > opts.maxNameLength) {
    errors.push(TEAM_VALIDATION_MESSAGES.NAME_TOO_LONG(opts.maxNameLength))
  }

  // Vérifier le format du nom (pas de caractères spéciaux dangereux)
  const invalidCharsRegex = /[<>\"'&]/
  if (invalidCharsRegex.test(trimmedName)) {
    errors.push(TEAM_VALIDATION_MESSAGES.INVALID_NAME_FORMAT)
  }

  // Vérifier l'unicité du nom
  if (!opts.allowDuplicateNames) {
    const duplicateTeam = existingTeams.find(team => 
      team.id !== excludeTeamId && 
      team.name.toLowerCase().trim() === trimmedName.toLowerCase()
    )
    
    if (duplicateTeam) {
      errors.push(TEAM_VALIDATION_MESSAGES.DUPLICATE_NAME(trimmedName))
    }
  }

  // Vérifier les noms similaires (avertissement)
  const similarTeams = existingTeams.filter(team => {
    if (team.id === excludeTeamId) return false
    const similarity = calculateStringSimilarity(trimmedName.toLowerCase(), team.name.toLowerCase())
    return similarity > 0.8 && similarity < 1.0
  })

  if (similarTeams.length > 0) {
    warnings.push(TEAM_VALIDATION_MESSAGES.SIMILAR_TEAM_NAMES([
      trimmedName, 
      ...similarTeams.map(t => t.name)
    ]))
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valide une équipe complète
 */
export function validateTeam(
  team: Partial<Team>, 
  existingTeams: Team[] = [],
  options: Partial<TeamValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_TEAM_VALIDATION_OPTIONS, ...options }
  const errors: string[] = []
  const warnings: string[] = []

  // Handle null/undefined team
  if (!team || typeof team !== 'object') {
    errors.push('L\'équipe fournie est invalide')
    return { isValid: false, errors, warnings }
  }

  // Vérifier les champs requis
  for (const field of opts.requiredFields) {
    if (!team[field]) {
      switch (field) {
        case 'id':
          errors.push(TEAM_VALIDATION_MESSAGES.MISSING_ID)
          break
        case 'name':
          errors.push(TEAM_VALIDATION_MESSAGES.MISSING_NAME)
          break
        default:
          errors.push(`Le champ "${field}" est requis`)
      }
    }
  }

  // Valider l'ID si présent
  if (team.id !== undefined) {
    if (typeof team.id !== 'string' || team.id.trim().length === 0) {
      errors.push(TEAM_VALIDATION_MESSAGES.INVALID_ID_FORMAT)
    }
  }

  // Valider le nom si présent
  if (team.name !== undefined) {
    const nameValidation = validateTeamName(
      team.name, 
      existingTeams, 
      team.id, 
      options
    )
    errors.push(...nameValidation.errors)
    warnings.push(...(nameValidation.warnings || []))
  }

  // Valider la couleur si présente
  if (team.color !== undefined) {
    const colorValidation = validateTeamColor(team.color)
    errors.push(...colorValidation.errors)
    warnings.push(...(colorValidation.warnings || []))
  } else {
    warnings.push(TEAM_VALIDATION_MESSAGES.NO_COLOR_ASSIGNED)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valide une liste d'équipes
 */
export function validateTeamList(
  teams: Team[], 
  options: Partial<TeamValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_TEAM_VALIDATION_OPTIONS, ...options }
  const errors: string[] = []
  const warnings: string[] = []

  // Handle null/undefined teams array
  if (!teams || !Array.isArray(teams)) {
    errors.push('La liste d\'équipes fournie est invalide')
    return { isValid: false, errors, warnings }
  }

  // Vérifier le nombre minimum d'équipes
  if (teams.length < opts.minTeams) {
    errors.push(TEAM_VALIDATION_MESSAGES.MIN_TEAMS(opts.minTeams))
  }

  // Vérifier le nombre maximum d'équipes
  if (teams.length > opts.maxTeams) {
    errors.push(TEAM_VALIDATION_MESSAGES.MAX_TEAMS(opts.maxTeams))
  }

  // Valider chaque équipe individuellement
  teams.forEach((team, index) => {
    const teamValidation = validateTeam(team, teams, options)
    
    // Préfixer les erreurs avec l'index de l'équipe pour plus de clarté
    teamValidation.errors.forEach(error => {
      errors.push(`Équipe ${index + 1}: ${error}`)
    })
    
    teamValidation.warnings?.forEach(warning => {
      warnings.push(`Équipe ${index + 1}: ${warning}`)
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valide l'attribution d'une réponse à une équipe
 */
export function validateTeamAnswerAssignment(
  questionId: string,
  answerIndex: number,
  teamId: string,
  teams: Team[],
  existingAnswers: TeamAnswer[],
  totalAnswerOptions: number
): ValidationResult {
  const errors: string[] = []

  // Vérifier que l'équipe existe
  const team = teams.find(t => t.id === teamId)
  if (!team) {
    errors.push(TEAM_VALIDATION_MESSAGES.TEAM_NOT_FOUND(teamId))
  }

  // Vérifier que l'index de réponse est valide
  if (answerIndex < 0 || answerIndex >= totalAnswerOptions) {
    errors.push(TEAM_VALIDATION_MESSAGES.INVALID_ANSWER_INDEX(answerIndex, totalAnswerOptions))
  }

  // Vérifier si l'équipe a déjà une réponse pour cette question
  const existingAnswer = existingAnswers.find(
    answer => answer.questionId === questionId && answer.teamId === teamId
  )

  if (existingAnswer) {
    errors.push(TEAM_VALIDATION_MESSAGES.DUPLICATE_TEAM_ASSIGNMENT(team?.name || teamId))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valide que toutes les équipes ont été assignées pour une question
 */
export function validateAllTeamsAssigned(
  questionId: string,
  teams: Team[],
  teamAnswers: TeamAnswer[]
): ValidationResult {
  const errors: string[] = []

  // Obtenir les équipes qui ont répondu à cette question
  const assignedTeamIds = new Set(
    teamAnswers
      .filter(answer => answer.questionId === questionId)
      .map(answer => answer.teamId)
  )

  // Vérifier que toutes les équipes ont été assignées
  const unassignedTeams = teams.filter(team => !assignedTeamIds.has(team.id))

  if (unassignedTeams.length > 0) {
    const teamNames = unassignedTeams.map(team => team.name).join(', ')
    errors.push(`Les équipes suivantes n'ont pas encore été assignées : ${teamNames}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valide la couleur d'une équipe
 */
export function validateTeamColor(color: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!color || typeof color !== 'string') {
    warnings.push(TEAM_VALIDATION_MESSAGES.NO_COLOR_ASSIGNED)
    return { isValid: true, errors, warnings }
  }

  // Vérifier le format hexadécimal
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!hexColorRegex.test(color)) {
    errors.push(TEAM_VALIDATION_MESSAGES.INVALID_COLOR_FORMAT)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calcule la similarité entre deux chaînes (algorithme de Jaro-Winkler simplifié)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0

  const maxDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1
  const matches1 = new Array(str1.length).fill(false)
  const matches2 = new Array(str2.length).fill(false)

  let matches = 0
  let transpositions = 0

  // Identifier les correspondances
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - maxDistance)
    const end = Math.min(i + maxDistance + 1, str2.length)

    for (let j = start; j < end; j++) {
      if (matches2[j] || str1[i] !== str2[j]) continue
      matches1[i] = matches2[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0.0

  // Compter les transpositions
  let k = 0
  for (let i = 0; i < str1.length; i++) {
    if (!matches1[i]) continue
    while (!matches2[k]) k++
    if (str1[i] !== str2[k]) transpositions++
    k++
  }

  // Calculer la similarité de Jaro
  const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3

  return jaro
}

/**
 * Utilitaire pour créer des messages d'erreur personnalisés
 */
export function createCustomValidationMessage(
  template: string,
  replacements: Record<string, string | number>
): string {
  return Object.entries(replacements).reduce(
    (message, [key, value]) => message.replace(new RegExp(`{${key}}`, 'g'), String(value)),
    template
  )
}

/**
 * Messages d'erreur spécifiques aux modes utilisateur
 */
export const MODE_VALIDATION_MESSAGES = {
  INVALID_MODE: 'Le mode utilisateur spécifié est invalide',
  MODE_REQUIRED: 'Le mode utilisateur est requis',
  HOST_MODE_REQUIREMENTS: 'Le mode animateur nécessite au moins une équipe configurée',
  PARTICIPANT_MODE_RESTRICTIONS: 'Certaines fonctionnalités ne sont pas disponibles en mode participant',
  SESSION_CORRUPTED: 'La session actuelle est corrompue et doit être réinitialisée',
  MODE_SWITCH_ERROR: 'Erreur lors du changement de mode utilisateur',
  INCOMPATIBLE_DATA: 'Les données actuelles ne sont pas compatibles avec le mode sélectionné'
} as const

/**
 * Interface pour les données de session
 */
export interface SessionData {
  userMode: 'host' | 'participant'
  teams: Team[]
  teamAnswers: TeamAnswer[]
  currentQuestionIndex: number
  timestamp: string
  version?: string
}

/**
 * Valide le mode utilisateur
 */
export function validateUserMode(mode: any): ValidationResult {
  const errors: string[] = []

  if (mode === undefined || mode === null) {
    errors.push(MODE_VALIDATION_MESSAGES.MODE_REQUIRED)
    return { isValid: false, errors }
  }

  if (typeof mode !== 'string') {
    errors.push(MODE_VALIDATION_MESSAGES.INVALID_MODE)
    return { isValid: false, errors }
  }

  if (mode !== 'host' && mode !== 'participant') {
    errors.push(MODE_VALIDATION_MESSAGES.INVALID_MODE)
    return { isValid: false, errors }
  }

  return { isValid: true, errors: [] }
}

/**
 * Valide la compatibilité entre le mode et les données
 */
export function validateModeCompatibility(
  mode: 'host' | 'participant',
  teams: Team[],
  teamAnswers: TeamAnswer[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validation pour le mode animateur
  if (mode === 'host') {
    if (teams.length === 0) {
      errors.push(MODE_VALIDATION_MESSAGES.HOST_MODE_REQUIREMENTS)
    }
  }

  // Validation pour le mode participant
  if (mode === 'participant') {
    if (teamAnswers.length > 0) {
      warnings.push('Les réponses d\'équipes existantes seront ignorées en mode participant')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valide les données de session
 */
export function validateSessionData(sessionData: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!sessionData || typeof sessionData !== 'object' || Array.isArray(sessionData)) {
    errors.push(MODE_VALIDATION_MESSAGES.SESSION_CORRUPTED)
    return { isValid: false, errors, warnings }
  }

  // Valider le mode utilisateur
  const modeValidation = validateUserMode(sessionData.userMode)
  if (!modeValidation.isValid) {
    errors.push(...modeValidation.errors)
  }

  // Valider les équipes si présentes
  if (sessionData.teams && Array.isArray(sessionData.teams)) {
    const teamValidation = validateTeamList(sessionData.teams)
    if (!teamValidation.isValid) {
      warnings.push('Certaines équipes dans la session sont invalides')
    }
  }

  // Valider l'index de question
  if (typeof sessionData.currentQuestionIndex !== 'number' || 
      sessionData.currentQuestionIndex < 0) {
    warnings.push('L\'index de question dans la session est invalide')
  }

  // Valider le timestamp
  if (!sessionData.timestamp || typeof sessionData.timestamp !== 'string') {
    warnings.push('Le timestamp de la session est manquant ou invalide')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Crée des données de session par défaut pour un mode donné
 */
export function createDefaultSessionData(mode: 'host' | 'participant'): SessionData {
  return {
    userMode: mode,
    teams: mode === 'host' ? [] : [],
    teamAnswers: [],
    currentQuestionIndex: 0,
    timestamp: new Date().toISOString(),
    version: '1.0'
  }
}

/**
 * Répare les données de session corrompues
 */
export function repairSessionData(corruptedData: any): SessionData {
  const defaultData = createDefaultSessionData('participant')

  // Essayer de récupérer le mode utilisateur
  if (corruptedData?.userMode === 'host' || corruptedData?.userMode === 'participant') {
    defaultData.userMode = corruptedData.userMode
  }

  // Essayer de récupérer les équipes valides
  if (corruptedData?.teams && Array.isArray(corruptedData.teams)) {
    const validTeams = corruptedData.teams.filter((team: any) => {
      const validation = validateTeam(team)
      return validation.isValid
    })
    defaultData.teams = validTeams
  }

  // Essayer de récupérer l'index de question
  if (typeof corruptedData?.currentQuestionIndex === 'number' && 
      corruptedData.currentQuestionIndex >= 0) {
    defaultData.currentQuestionIndex = corruptedData.currentQuestionIndex
  }

  return defaultData
}

/**
 * Valide la configuration complète avant le démarrage du quiz
 */
export function validateQuizStartConfiguration(
  teams: Team[],
  userMode: 'host' | 'participant',
  questions: any[] = []
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Valider le mode utilisateur
  const modeValidation = validateUserMode(userMode)
  if (!modeValidation.isValid) {
    errors.push(...modeValidation.errors)
    return { isValid: false, errors, warnings }
  }

  // Valider la compatibilité mode/données
  const compatibilityValidation = validateModeCompatibility(userMode, teams, [])
  if (!compatibilityValidation.isValid) {
    errors.push(...compatibilityValidation.errors)
  }
  warnings.push(...(compatibilityValidation.warnings || []))

  // Valider les équipes en mode animateur
  if (userMode === 'host') {
    const teamValidation = validateTeamList(teams)
    errors.push(...teamValidation.errors)
    warnings.push(...(teamValidation.warnings || []))
  }

  // Valider la présence de questions
  if (questions.length === 0) {
    errors.push('Aucune question n\'est disponible pour démarrer le quiz')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}