/**
 * Utilitaire de gestion des thèmes clair/sombre
 * Basé sur le système de variables CSS --vp-c-*
 */

import { ref, readonly, onMounted, onUnmounted } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

const THEME_STORAGE_KEY = 'quiz-cinema-theme'

/**
 * Détecte la préférence système pour le thème sombre
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Récupère le thème stocké ou retourne 'auto' par défaut
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'auto'
  return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'auto'
}

/**
 * Stocke le thème sélectionné
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

/**
 * Applique le thème au document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  const actualTheme = theme === 'auto' ? getSystemTheme() : theme

  // Supprime les classes de thème existantes
  html.classList.remove('light', 'dark')
  
  // Applique la nouvelle classe de thème
  html.classList.add(actualTheme)
  
  // Met à jour l'attribut color-scheme pour les navigateurs
  html.style.colorScheme = actualTheme
}

/**
 * Initialise le système de thème
 */
export function initTheme(): void {
  const storedTheme = getStoredTheme()
  applyTheme(storedTheme)

  // Écoute les changements de préférence système
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      const currentTheme = getStoredTheme()
      if (currentTheme === 'auto') {
        applyTheme('auto')
      }
    }

    // Utilise addEventListener si disponible, sinon addListener (compatibilité)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }
  }
}

/**
 * Bascule entre les thèmes
 */
export function toggleTheme(): Theme {
  const currentTheme = getStoredTheme()
  let newTheme: Theme

  switch (currentTheme) {
    case 'light':
      newTheme = 'dark'
      break
    case 'dark':
      newTheme = 'auto'
      break
    case 'auto':
    default:
      newTheme = 'light'
      break
  }

  setStoredTheme(newTheme)
  applyTheme(newTheme)
  return newTheme
}

/**
 * Définit un thème spécifique
 */
export function setTheme(theme: Theme): void {
  setStoredTheme(theme)
  applyTheme(theme)
}

/**
 * Récupère le thème actuellement appliqué (résolu)
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Vérifie si le mode sombre est actif
 */
export function isDarkMode(): boolean {
  return getCurrentTheme() === 'dark'
}

/**
 * Composable Vue pour la gestion des thèmes
 */
export function useTheme() {
  const currentTheme = ref<Theme>(getStoredTheme())
  const isDark = ref(isDarkMode())

  const toggle = () => {
    currentTheme.value = toggleTheme()
    isDark.value = isDarkMode()
  }

  const setThemeValue = (theme: Theme) => {
    currentTheme.value = theme
    setTheme(theme)
    isDark.value = isDarkMode()
  }

  // Mise à jour réactive lors des changements système
  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (currentTheme.value === 'auto') {
        isDark.value = isDarkMode()
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      
      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleChange)
      })
    }
  })

  return {
    currentTheme: readonly(currentTheme),
    isDark: readonly(isDark),
    toggle,
    setTheme: setThemeValue,
    getSystemTheme,
    getCurrentTheme
  }
}