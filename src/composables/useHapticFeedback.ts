import { ref, onMounted } from 'vue'

export interface HapticOptions {
  enabled?: boolean
  intensity?: 'light' | 'medium' | 'heavy'
}

export function useHapticFeedback(options: HapticOptions = {}) {
  const isSupported = ref(false)
  const isEnabled = ref(options.enabled ?? true)

  // Check if device supports haptic feedback
  const checkSupport = () => {
    // Check for Vibration API (most mobile browsers)
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      isSupported.value = true
      return true
    }

    // Check for iOS haptic feedback
    if ('ontouchstart' in window && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      isSupported.value = true
      return true
    }

    return false
  }

  // Light tap feedback for buttons and interactive elements
  const lightTap = () => {
    if (!isSupported.value || !isEnabled.value) return

    try {
      // Use different feedback based on platform
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(10) // Very short vibration for light tap
      }
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Medium feedback for confirmations and selections
  const mediumTap = () => {
    if (!isSupported.value || !isEnabled.value) return

    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(25) // Short vibration for medium feedback
      }
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Heavy feedback for important actions and errors
  const heavyTap = () => {
    if (!isSupported.value || !isEnabled.value) return

    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([30, 10, 30]) // Pattern for heavy feedback
      }
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Success feedback pattern
  const success = () => {
    if (!isSupported.value || !isEnabled.value) return

    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([15, 5, 15, 5, 30]) // Success pattern
      }
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Error feedback pattern
  const error = () => {
    if (!isSupported.value || !isEnabled.value) return

    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([50, 25, 50, 25, 50]) // Error pattern
      }
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Toggle haptic feedback on/off
  const toggle = () => {
    isEnabled.value = !isEnabled.value
    // Store preference in localStorage
    localStorage.setItem('haptic-feedback-enabled', String(isEnabled.value))
  }

  // Set haptic feedback preference
  const setEnabled = (enabled: boolean) => {
    isEnabled.value = enabled
    localStorage.setItem('haptic-feedback-enabled', String(enabled))
  }

  onMounted(() => {
    checkSupport()
    
    // Load user preference from localStorage
    const storedPreference = localStorage.getItem('haptic-feedback-enabled')
    if (storedPreference !== null) {
      isEnabled.value = storedPreference === 'true'
    }
  })

  return {
    isSupported,
    isEnabled,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
    toggle,
    setEnabled
  }
} 