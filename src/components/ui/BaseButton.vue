<template>
  <button
    ref="buttonRef"
    :class="buttonClasses"
    :disabled="disabled"
    :type="type"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useMobileOptimization } from '@/utils/mobileOptimization'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sponsor'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  hapticFeedback?: boolean
  rainbow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
  hapticFeedback: true,
  rainbow: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonRef = ref<HTMLElement>()
const isPressed = ref(false)

// Mobile optimization utilities
const { touch, haptic, accessibility } = useMobileOptimization()

const buttonClasses = computed(() => {
  const classes = []
  
  // Variant classes using harmonized button system
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline', 
    ghost: 'btn-ghost',
    sponsor: 'btn-secondary' // Map to secondary for clean grey design
  }
  
  // Size classes using UnoCSS shortcuts
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md', 
    lg: 'btn-lg'
  }
  
  // Base variant and size
  classes.push(variantClasses[props.variant])
  classes.push(sizeClasses[props.size])
  
  // Mobile touch optimization with UnoCSS
  classes.push(
    'min-h-44px min-w-44px mobile:min-h-48px mobile:min-w-48px',
    'select-none touch-manipulation'
  )
  
  // Enhanced transitions and micro-interactions with UnoCSS
  if (touch.isTouchDevice.value) {
    classes.push(
      'transition-transform duration-150 ease-out',
      'motion-reduce:transition-none motion-reduce:transform-none'
    )
    if (isPressed.value) {
      classes.push('scale-98 motion-reduce:scale-100')
    }
  } else {
    classes.push('transition-all duration-250 ease-in-out')
  }
  
  // Rainbow animation for brand colors (when enabled)
  if (props.rainbow && (props.variant === 'primary' || props.variant === 'outline')) {
    classes.push('rainbow-bg')
  }
  
  // Enhanced accessibility with UnoCSS
  classes.push(
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'contrast-more:font-bold contrast-more:border-3'
  )
  
  // Disabled state with UnoCSS
  if (props.disabled) {
    classes.push('opacity-50 cursor-not-allowed pointer-events-none')
  }
  
  return classes.filter(Boolean).join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return
  
  // Trigger haptic feedback on supported devices
  if (props.hapticFeedback && touch.isTouchDevice.value) {
    haptic.lightTap()
  }
  
  emit('click', event)
}

const handleTouchStart = (event: TouchEvent) => {
  if (props.disabled) return
  isPressed.value = true
  touch.handleTouchStart(event)
}

const handleTouchEnd = (event: TouchEvent) => {
  isPressed.value = false
  touch.handleTouchEnd(event)
}

// Add touch optimization when component mounts
onMounted(() => {
  if (buttonRef.value && touch.isTouchDevice.value) {
    touch.optimizeTouchTarget(buttonRef.value)
    accessibility.optimizeForScreenReader(buttonRef.value, `${props.variant} button`)
  }
})
</script>

