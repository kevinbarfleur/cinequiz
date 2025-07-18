import { ref, onMounted, onUnmounted } from 'vue'
import { useHapticFeedback } from './useHapticFeedback'

export interface TouchInteractionOptions {
  hapticFeedback?: boolean
  scaleOnPress?: boolean
  rippleEffect?: boolean
  pressDelay?: number
}

export function useTouchInteractions(options: TouchInteractionOptions = {}) {
  const {
    hapticFeedback = true,
    scaleOnPress = true,
    rippleEffect = false,
    pressDelay = 50
  } = options

  const isPressed = ref(false)
  const isTouchDevice = ref(false)
  const pressTimer = ref<number | null>(null)
  
  const haptic = useHapticFeedback({ enabled: hapticFeedback })

  // Detect if device supports touch
  const detectTouchDevice = () => {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  // Handle touch start with haptic feedback
  const handleTouchStart = (event?: TouchEvent) => {
    if (!isTouchDevice.value) return

    // Prevent double-tap zoom on iOS
    if (event && event.touches.length > 1) return

    isPressed.value = true

    // Add haptic feedback with slight delay for better feel
    if (hapticFeedback) {
      pressTimer.value = window.setTimeout(() => {
        haptic.lightTap()
      }, pressDelay)
    }
  }

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isTouchDevice.value) return

    isPressed.value = false

    // Clear any pending haptic feedback
    if (pressTimer.value) {
      clearTimeout(pressTimer.value)
      pressTimer.value = null
    }
  }

  // Handle touch cancel (when user drags away)
  const handleTouchCancel = () => {
    handleTouchEnd()
  }

  // Mouse events for desktop testing
  const handleMouseDown = () => {
    if (isTouchDevice.value) return
    isPressed.value = true
  }

  const handleMouseUp = () => {
    if (isTouchDevice.value) return
    isPressed.value = false
  }

  const handleMouseLeave = () => {
    if (isTouchDevice.value) return
    isPressed.value = false
  }

  // Create ripple effect at touch point
  const createRipple = (event: TouchEvent | MouseEvent, element: HTMLElement) => {
    if (!rippleEffect) return

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left - size / 2
    const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top - size / 2

    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      z-index: 1000;
    `

    element.style.position = element.style.position || 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple)
      }
    }, 600)
  }

  // Enhanced click handler with feedback
  const enhancedClick = (callback: (event: Event) => void, feedbackType: 'light' | 'medium' | 'heavy' = 'light') => {
    return (event: Event) => {
      // Provide appropriate haptic feedback
      if (hapticFeedback && isTouchDevice.value) {
        switch (feedbackType) {
          case 'light':
            haptic.lightTap()
            break
          case 'medium':
            haptic.mediumTap()
            break
          case 'heavy':
            haptic.heavyTap()
            break
        }
      }

      // Create ripple effect if enabled
      if (rippleEffect && event.target instanceof HTMLElement) {
        createRipple(event as TouchEvent | MouseEvent, event.target)
      }

      // Execute callback
      callback(event)
    }
  }

  // Success feedback with haptics and visual
  const successFeedback = () => {
    if (hapticFeedback) {
      haptic.success()
    }
  }

  // Error feedback with haptics and visual
  const errorFeedback = () => {
    if (hapticFeedback) {
      haptic.error()
    }
  }

  // Lifecycle
  onMounted(() => {
    detectTouchDevice()
    
    // Add CSS for ripple animation if not present
    if (rippleEffect && !document.querySelector('#ripple-keyframes')) {
      const style = document.createElement('style')
      style.id = 'ripple-keyframes'
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }
  })

  onUnmounted(() => {
    if (pressTimer.value) {
      clearTimeout(pressTimer.value)
    }
  })

  return {
    // State
    isPressed,
    isTouchDevice,
    
    // Event handlers
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    
    // Enhanced interactions
    enhancedClick,
    createRipple,
    successFeedback,
    errorFeedback,
    
    // Haptic controls
    haptic
  }
} 