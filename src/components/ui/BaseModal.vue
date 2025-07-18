<template>
  <Teleport to="body">
    <Transition
      name="modal"
      appear
      @before-enter="onBeforeEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="isVisible"
        ref="overlayRef"
        :class="overlayClasses"
        :style="overlayStyles"
        @click="handleOverlayClick"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @keydown="handleKeyDown"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        tabindex="-1"
      >
        <div
          ref="modalRef"
          :class="modalClasses"
          :style="modalStyles"
          @click.stop
        >
          <!-- Header -->
          <div v-if="$slots.header || title" :class="headerClasses">
            <slot name="header">
              <h2 v-if="title" :id="titleId" class="heading-3">
                {{ title }}
              </h2>
            </slot>
            
            <!-- Close Button -->
            <button
              v-if="closable"
              ref="closeButtonRef"
              :class="closeButtonClasses"
              @click="handleClose"
              :aria-label="closeLabel"
              type="button"
            >
              <div class="i-carbon-close text-lg"></div>
            </button>
          </div>

          <!-- Content -->
          <div :class="contentClasses">
            <div v-if="description" :id="descriptionId" class="body-sm text-text-2 mb-4">
              {{ description }}
            </div>
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" :class="footerClasses">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useMobileOptimization } from '@/utils/mobileOptimization'

interface Props {
  isVisible: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position?: 'center' | 'top' | 'bottom'
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
  maxHeight?: string
  zIndex?: number
  backdrop?: 'blur' | 'dark' | 'light'
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down'
  fullscreenOnMobile?: boolean
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  position: 'center',
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  persistent: false,
  zIndex: 1000,
  backdrop: 'blur',
  animation: 'scale',
  fullscreenOnMobile: true,
  closeLabel: 'Fermer'
})

const emit = defineEmits<{
  'update:isVisible': [value: boolean]
  open: []
  close: []
  'before-open': []
  'after-open': []
  'before-close': []
  'after-close': []
}>()

// Mobile optimization
const { viewport, touch, haptic, accessibility } = useMobileOptimization()

// Refs
const overlayRef = ref<HTMLElement>()
const modalRef = ref<HTMLElement>()
const closeButtonRef = ref<HTMLElement>()

// State
const isAnimating = ref(false)
const previouslyFocusedElement = ref<Element | null>(null)
const focusableElements = ref<NodeListOf<Element>>()

// IDs for accessibility
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)
const descriptionId = computed(() => `modal-desc-${Math.random().toString(36).substr(2, 9)}`)

// Size configurations
const sizeConfigs = {
  sm: { maxWidth: 'max-w-md', padding: 'p-4 mobile:p-6' },
  md: { maxWidth: 'max-w-lg', padding: 'p-6 mobile:p-8' },
  lg: { maxWidth: 'max-w-2xl', padding: 'p-6 mobile:p-8' },
  xl: { maxWidth: 'max-w-4xl', padding: 'p-8 mobile:p-10' },
  full: { maxWidth: 'max-w-none', padding: 'p-6 mobile:p-8' }
}

// Computed Classes
const overlayClasses = computed(() => {
  const classes = [
    // Position and layout
    'fixed inset-0 flex items-center justify-center',
    
    // Z-index using UnoCSS
    `z-${props.zIndex}`,
    
    // Padding for mobile
    'p-4 mobile:p-6',
    
    // Backdrop styles
    props.backdrop === 'blur' ? 'bg-black/60 backdrop-blur-sm' :
    props.backdrop === 'dark' ? 'bg-black/80' :
    'bg-black/40',
    
    // Position variants
    props.position === 'top' ? 'items-start pt-8 mobile:pt-12' :
    props.position === 'bottom' ? 'items-end pb-8 mobile:pb-12' :
    'items-center',
    
    // Touch and interaction
    'touch-manipulation'
  ]
  
  return classes.filter(Boolean).join(' ')
})

const modalClasses = computed(() => {
  const config = sizeConfigs[props.size]
  const isMobile = viewport.isMobile.value
  
  const classes = [
    // Base styles
    'bg-bg rounded-xl shadow-2xl border border-divider',
    'outline-none relative overflow-hidden',
    
    // Size and responsiveness
    isMobile && props.fullscreenOnMobile ? 
      'w-full h-full max-h-none rounded-none m-0' :
      `w-full ${config.maxWidth}`,
    
    // Max height - use default classes only, dynamic height will be in style
    !props.maxHeight ? 'max-h-90vh mobile:max-h-95vh' : '',
    
    // Animation transform origin
    'transform-gpu',
    
    // Mobile optimizations
    isMobile ? 'mx-2' : 'mx-4',
    
    // Accessibility
    'focus:outline-none focus:ring-2 focus:ring-brand-1 focus:ring-offset-2'
  ]
  
  return classes.filter(Boolean).join(' ')
})

const headerClasses = computed(() => [
  'flex-between border-b border-divider',
  sizeConfigs[props.size].padding.replace('p-', 'p-').replace('mobile:', '') + ' pb-4',
  'sticky top-0 bg-bg z-10'
].join(' '))

const contentClasses = computed(() => [
  'overflow-y-auto flex-1',
  sizeConfigs[props.size].padding,
  'scrollbar-thin scrollbar-thumb-divider scrollbar-track-transparent'
].join(' '))

const footerClasses = computed(() => [
  'border-t border-divider bg-bg-soft/50',
  sizeConfigs[props.size].padding.replace('p-', 'p-').replace('mobile:', '') + ' pt-4',
  'sticky bottom-0'
].join(' '))

const closeButtonClasses = computed(() => [
  'w-8 h-8 rounded-full flex-center',
  'hover:bg-bg-soft active:bg-divider',
  'text-text-2 hover:text-text-1',
  'transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-brand-1 focus:ring-offset-2',
  'min-w-44px min-h-44px' // Touch-friendly
].join(' '))

// Computed Styles
const overlayStyles = computed(() => {
  return {
    zIndex: props.zIndex
  }
})

const modalStyles = computed(() => {
  const isMobile = viewport.isMobile.value
  const styles: Record<string, string> = {}
  
  if (isMobile && props.fullscreenOnMobile) {
    styles.width = '100vw'
    styles.height = '100vh'
    styles.maxHeight = 'none'
    styles.borderRadius = '0'
  } else if (props.maxHeight) {
    // Apply custom max-height via inline styles
    styles.maxHeight = props.maxHeight
  }
  
  return styles
})

// Methods
const handleOverlayClick = () => {
  if (props.closeOnOverlay && !props.persistent) {
    handleClose()
  }
}

const handleClose = () => {
  if (props.persistent || isAnimating.value) return
  
  haptic.lightTap()
  emit('update:isVisible', false)
  emit('close')
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && !props.persistent) {
    handleClose()
    return
  }
  
  // Focus management
  if (event.key === 'Tab') {
    handleTabKey(event)
  }
}

const handleTabKey = (event: KeyboardEvent) => {
  if (!focusableElements.value) return
  
  const elements = Array.from(focusableElements.value)
  const firstElement = elements[0] as HTMLElement
  const lastElement = elements[elements.length - 1] as HTMLElement
  
  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

const handleTouchStart = (event: TouchEvent) => {
  touch.handleTouchStart(event)
}

const handleTouchEnd = (event: TouchEvent) => {
  touch.handleTouchEnd(event, () => {
    if (event.target === overlayRef.value && props.closeOnOverlay && !props.persistent) {
      handleClose()
    }
  })
}

const setupFocusTrap = async () => {
  await nextTick()
  
  if (!modalRef.value) return
  
  // Store previously focused element
  previouslyFocusedElement.value = document.activeElement
  
  // Get focusable elements
  focusableElements.value = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  // Focus first element or close button
  if (focusableElements.value.length > 0) {
    (focusableElements.value[0] as HTMLElement).focus()
  } else if (closeButtonRef.value) {
    closeButtonRef.value.focus()
  } else if (modalRef.value) {
    modalRef.value.focus()
  }
}

const restoreFocus = () => {
  if (previouslyFocusedElement.value && 'focus' in previouslyFocusedElement.value) {
    (previouslyFocusedElement.value as HTMLElement).focus()
  }
}

const lockBodyScroll = () => {
  if (viewport.isMobile.value) {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  }
}

const unlockBodyScroll = () => {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

// Animation handlers
const onBeforeEnter = () => {
  isAnimating.value = true
  emit('before-open')
  lockBodyScroll()
}

const onAfterEnter = () => {
  isAnimating.value = false
  emit('after-open')
  setupFocusTrap()
  
  // Announce to screen readers
  accessibility.announceToScreenReader(
    props.title ? `Modal ouvert: ${props.title}` : 'Modal ouvert'
  )
}

const onBeforeLeave = () => {
  isAnimating.value = true
  emit('before-close')
}

const onAfterLeave = () => {
  isAnimating.value = false
  emit('after-close')
  unlockBodyScroll()
  restoreFocus()
}

// Watchers
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    emit('open')
  }
})

// Lifecycle
onMounted(() => {
  // Prevent background scroll on mobile when modal is open
  if (props.isVisible) {
    lockBodyScroll()
    setupFocusTrap()
  }
})

onUnmounted(() => {
  unlockBodyScroll()
  restoreFocus()
})
</script>

<style scoped>
/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-10px);
}

/* Animation variants */
.modal-slide-up-enter-from .modal-container,
.modal-slide-up-leave-to .modal-container {
  transform: translateY(100%);
}

.modal-slide-down-enter-from .modal-container,
.modal-slide-down-leave-to .modal-container {
  transform: translateY(-100%);
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: none;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: none;
  }
}

/* Custom scrollbar for webkit browsers */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-border);
}
</style> 