<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="card-header border-b border-gray-200 pb-4 mb-4">
      <slot name="header" />
    </div>
    
    <div class="card-content">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer border-t border-gray-200 pt-4 mt-4">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hover: false
})

const cardClasses = computed(() => {
  const baseClasses = 'bg-bg-soft/60 backdrop-blur-lg rounded-lg border border-divider/20'
  
  const variantClasses = {
    default: 'shadow-md',
    elevated: 'shadow-lg',
    outlined: 'shadow-sm'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const hoverClasses = props.hover 
    ? 'hover:shadow-lg transition-shadow duration-normal cursor-pointer' 
    : ''
  
  return [
    baseClasses,
    variantClasses[props.variant],
    paddingClasses[props.padding],
    hoverClasses
  ].filter(Boolean).join(' ')
})
</script>