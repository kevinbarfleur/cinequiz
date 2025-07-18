/**
 * Mobile optimization utilities for team management and quiz interface
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Touch gesture detection and optimization
 */
export function useTouchOptimization() {
  const isTouchDevice = ref(false)
  const touchStartTime = ref(0)
  const touchStartPosition = ref({ x: 0, y: 0 })
  
  const detectTouchDevice = () => {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
  
  const optimizeTouchTarget = (element: HTMLElement) => {
    if (isTouchDevice.value) {
      // Ensure minimum touch target size (44px recommended by Apple/Google)
      const computedStyle = window.getComputedStyle(element)
      const minSize = 44
      
      if (parseInt(computedStyle.height) < minSize) {
        element.style.minHeight = `${minSize}px`
      }
      
      if (parseInt(computedStyle.width) < minSize) {
        element.style.minWidth = `${minSize}px`
      }
      
      // Add touch-friendly padding if needed
      if (parseInt(computedStyle.padding) < 8) {
        element.style.padding = '8px'
      }
    }
  }
  
  const handleTouchStart = (event: TouchEvent) => {
    touchStartTime.value = Date.now()
    const touch = event.touches[0]
    touchStartPosition.value = { x: touch.clientX, y: touch.clientY }
  }
  
  const handleTouchEnd = (event: TouchEvent, callback?: () => void) => {
    const touchEndTime = Date.now()
    const touchDuration = touchEndTime - touchStartTime.value
    
    // Prevent accidental taps (too quick or too long)
    if (touchDuration > 50 && touchDuration < 500) {
      const touch = event.changedTouches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPosition.value.x)
      const deltaY = Math.abs(touch.clientY - touchStartPosition.value.y)
      
      // Only trigger if touch didn't move too much (not a swipe)
      if (deltaX < 10 && deltaY < 10) {
        callback?.()
      }
    }
  }
  
  onMounted(() => {
    detectTouchDevice()
  })
  
  return {
    isTouchDevice,
    optimizeTouchTarget,
    handleTouchStart,
    handleTouchEnd
  }
}

/**
 * Viewport and screen size optimization
 */
export function useViewportOptimization() {
  const viewport = ref({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation: typeof screen !== 'undefined' ? screen.orientation?.angle || 0 : 0
  })
  
  const isMobile = computed(() => viewport.value.width < 768)
  const isTablet = computed(() => viewport.value.width >= 768 && viewport.value.width < 1024)
  const isDesktop = computed(() => viewport.value.width >= 1024)
  const isLandscape = computed(() => viewport.value.width > viewport.value.height)
  const isPortrait = computed(() => viewport.value.height > viewport.value.width)
  
  const updateViewport = () => {
    viewport.value = {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: screen.orientation?.angle || 0
    }
  }
  
  const getOptimalModalSize = () => {
    if (isMobile.value) {
      return {
        width: Math.min(viewport.value.width - 32, 400),
        height: Math.min(viewport.value.height - 100, 600),
        maxHeight: viewport.value.height * 0.8
      }
    } else if (isTablet.value) {
      return {
        width: Math.min(viewport.value.width - 64, 500),
        height: Math.min(viewport.value.height - 120, 700),
        maxHeight: viewport.value.height * 0.85
      }
    } else {
      return {
        width: 600,
        height: 800,
        maxHeight: viewport.value.height * 0.9
      }
    }
  }
  
  const getOptimalTeamListHeight = () => {
    const baseHeight = viewport.value.height - 200 // Account for header, footer, etc.
    
    if (isMobile.value) {
      return Math.min(baseHeight, 400)
    } else if (isTablet.value) {
      return Math.min(baseHeight, 500)
    } else {
      return Math.min(baseHeight, 600)
    }
  }
  
  onMounted(() => {
    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateViewport)
    window.removeEventListener('orientationchange', updateViewport)
  })
  
  return {
    viewport,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    getOptimalModalSize,
    getOptimalTeamListHeight
  }
}

/**
 * Performance optimization for mobile devices
 */
export function useMobilePerformance() {
  const isLowEndDevice = ref(false)
  const connectionSpeed = ref<'slow' | 'fast' | 'unknown'>('unknown')
  
  const detectDeviceCapabilities = () => {
    // Detect low-end devices based on hardware concurrency and memory
    const cores = navigator.hardwareConcurrency || 1
    const memory = (navigator as any).deviceMemory || 1
    
    isLowEndDevice.value = cores <= 2 || memory <= 2
    
    // Detect connection speed
    const connection = (navigator as any).connection
    if (connection) {
      const effectiveType = connection.effectiveType
      connectionSpeed.value = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast'
    }
  }
  
  const getOptimizedAnimationDuration = () => {
    if (isLowEndDevice.value) {
      return 150 // Shorter animations for low-end devices
    }
    return 300 // Normal animation duration
  }
  
  const shouldUseReducedAnimations = () => {
    return isLowEndDevice.value || 
           (typeof window !== 'undefined' && 
            window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }
  
  const getOptimalBatchSize = () => {
    return isLowEndDevice.value ? 5 : 10
  }
  
  const getOptimalVirtualizationThreshold = () => {
    return isLowEndDevice.value ? 20 : 50
  }
  
  onMounted(() => {
    detectDeviceCapabilities()
  })
  
  return {
    isLowEndDevice,
    connectionSpeed,
    getOptimizedAnimationDuration,
    shouldUseReducedAnimations,
    getOptimalBatchSize,
    getOptimalVirtualizationThreshold
  }
}

/**
 * Haptic feedback for mobile devices
 */
export function useHapticFeedback() {
  const isHapticSupported = ref(false)
  
  const checkHapticSupport = () => {
    isHapticSupported.value = 'vibrate' in navigator
  }
  
  const lightTap = () => {
    if (isHapticSupported.value) {
      navigator.vibrate(10)
    }
  }
  
  const mediumTap = () => {
    if (isHapticSupported.value) {
      navigator.vibrate(20)
    }
  }
  
  const heavyTap = () => {
    if (isHapticSupported.value) {
      navigator.vibrate([30, 10, 30])
    }
  }
  
  const successFeedback = () => {
    if (isHapticSupported.value) {
      navigator.vibrate([50, 50, 100])
    }
  }
  
  const errorFeedback = () => {
    if (isHapticSupported.value) {
      navigator.vibrate([100, 50, 100, 50, 100])
    }
  }
  
  onMounted(() => {
    checkHapticSupport()
  })
  
  return {
    isHapticSupported,
    lightTap,
    mediumTap,
    heavyTap,
    successFeedback,
    errorFeedback
  }
}

/**
 * Optimized modal management for mobile
 */
export function useMobileModal() {
  const { viewport, isMobile, getOptimalModalSize } = useViewportOptimization()
  const { lightTap } = useHapticFeedback()
  
  const isModalOpen = ref(false)
  const modalElement = ref<HTMLElement>()
  
  const openModal = () => {
    isModalOpen.value = true
    lightTap()
    
    // Prevent body scroll on mobile
    if (isMobile.value) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    }
  }
  
  const closeModal = () => {
    isModalOpen.value = false
    lightTap()
    
    // Restore body scroll
    if (isMobile.value) {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }
  
  const modalStyles = computed(() => {
    const size = getOptimalModalSize()
    
    if (isMobile.value) {
      return {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        height: '100%',
        maxHeight: 'none',
        borderRadius: '0',
        margin: '0'
      }
    } else {
      return {
        width: `${size.width}px`,
        maxHeight: `${size.maxHeight}px`,
        borderRadius: '16px',
        margin: 'auto'
      }
    }
  })
  
  return {
    isModalOpen,
    modalElement,
    openModal,
    closeModal,
    modalStyles
  }
}

/**
 * Optimized team list rendering for mobile
 */
export function useMobileTeamList<T>(items: Ref<T[]>) {
  const { isMobile, getOptimalTeamListHeight } = useViewportOptimization()
  const { getOptimalVirtualizationThreshold } = useMobilePerformance()
  
  const shouldVirtualize = computed(() => {
    return items.value.length > getOptimalVirtualizationThreshold()
  })
  
  const containerHeight = computed(() => {
    return getOptimalTeamListHeight()
  })
  
  const itemHeight = computed(() => {
    return isMobile.value ? 72 : 80 // Slightly smaller on mobile
  })
  
  const gridColumns = computed(() => {
    if (isMobile.value) {
      return 1 // Single column on mobile
    } else {
      return Math.floor((window.innerWidth - 64) / 300) // Dynamic columns based on width
    }
  })
  
  return {
    shouldVirtualize,
    containerHeight,
    itemHeight,
    gridColumns
  }
}

/**
 * Accessibility optimization for mobile
 */
export function useMobileAccessibility() {
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    
    document.body.appendChild(announcement)
    announcement.textContent = message
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
  
  const optimizeForScreenReader = (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label)
    element.setAttribute('role', 'button')
    element.setAttribute('tabindex', '0')
    
    // Add keyboard navigation
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        element.click()
      }
    })
  }
  
  const setFocusManagement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
    }
  }
  
  return {
    announceToScreenReader,
    optimizeForScreenReader,
    setFocusManagement
  }
}

/**
 * Battery and performance monitoring
 */
export function useBatteryOptimization() {
  const batteryLevel = ref(1)
  const isCharging = ref(true)
  const shouldOptimizeForBattery = ref(false)
  
  const updateBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        batteryLevel.value = battery.level
        isCharging.value = battery.charging
        shouldOptimizeForBattery.value = !battery.charging && battery.level < 0.2
        
        battery.addEventListener('levelchange', () => {
          batteryLevel.value = battery.level
          shouldOptimizeForBattery.value = !battery.charging && battery.level < 0.2
        })
        
        battery.addEventListener('chargingchange', () => {
          isCharging.value = battery.charging
          shouldOptimizeForBattery.value = !battery.charging && battery.level < 0.2
        })
      } catch (error) {
        console.warn('Battery API not supported or failed:', error)
      }
    }
  }
  
  const getOptimizedSettings = () => {
    if (shouldOptimizeForBattery.value) {
      return {
        animationDuration: 100,
        updateInterval: 1000,
        enableAnimations: false,
        reduceCalculations: true
      }
    }
    
    return {
      animationDuration: 300,
      updateInterval: 500,
      enableAnimations: true,
      reduceCalculations: false
    }
  }
  
  onMounted(() => {
    updateBatteryInfo()
  })
  
  return {
    batteryLevel,
    isCharging,
    shouldOptimizeForBattery,
    getOptimizedSettings
  }
}

/**
 * Network-aware optimization
 */
export function useNetworkOptimization() {
  const connectionType = ref<string>('unknown')
  const isSlowConnection = ref(false)
  const isOffline = ref(!navigator.onLine)
  
  const updateConnectionInfo = () => {
    const connection = (navigator as any).connection
    if (connection) {
      connectionType.value = connection.effectiveType || 'unknown'
      isSlowConnection.value = ['slow-2g', '2g'].includes(connection.effectiveType)
    }
    
    isOffline.value = !navigator.onLine
  }
  
  const getOptimizedLoadingStrategy = () => {
    if (isOffline.value) {
      return 'cache-only'
    } else if (isSlowConnection.value) {
      return 'minimal'
    } else {
      return 'full'
    }
  }
  
  onMounted(() => {
    updateConnectionInfo()
    window.addEventListener('online', updateConnectionInfo)
    window.addEventListener('offline', updateConnectionInfo)
    
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo)
    }
  })
  
  onUnmounted(() => {
    window.removeEventListener('online', updateConnectionInfo)
    window.removeEventListener('offline', updateConnectionInfo)
    
    const connection = (navigator as any).connection
    if (connection) {
      connection.removeEventListener('change', updateConnectionInfo)
    }
  })
  
  return {
    connectionType,
    isSlowConnection,
    isOffline,
    getOptimizedLoadingStrategy
  }
}

/**
 * Comprehensive mobile optimization hook
 */
export function useMobileOptimization() {
  const touch = useTouchOptimization()
  const viewport = useViewportOptimization()
  const performance = useMobilePerformance()
  const haptic = useHapticFeedback()
  const accessibility = useMobileAccessibility()
  const battery = useBatteryOptimization()
  const network = useNetworkOptimization()
  
  const getOptimizedConfig = () => {
    const batterySettings = battery.getOptimizedSettings()
    const loadingStrategy = network.getOptimizedLoadingStrategy()
    
    return {
      animations: {
        duration: Math.min(
          performance.getOptimizedAnimationDuration(),
          batterySettings.animationDuration
        ),
        enabled: batterySettings.enableAnimations && !performance.shouldUseReducedAnimations()
      },
      virtualization: {
        threshold: performance.getOptimalVirtualizationThreshold(),
        enabled: true
      },
      batching: {
        size: performance.getOptimalBatchSize()
      },
      loading: {
        strategy: loadingStrategy
      },
      ui: {
        modalSize: viewport.getOptimalModalSize(),
        teamListHeight: viewport.getOptimalTeamListHeight(),
        touchOptimized: touch.isTouchDevice.value
      }
    }
  }
  
  return {
    touch,
    viewport,
    performance,
    haptic,
    accessibility,
    battery,
    network,
    getOptimizedConfig
  }
}