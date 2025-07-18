<template>
  <div class="progress-container">
    <div v-if="showLabel" class="flex justify-between items-center mb-2">
      <span class="text-sm font-medium text-text-primary">{{ label }}</span>
      <span class="text-sm text-text-secondary">{{ Math.round(value) }}%</span>
    </div>
    
    <div :class="containerClasses">
      <div 
        :class="barClasses"
        :style="{ width: `${Math.min(Math.max(value, 0), 100)}%` }"
        role="progressbar"
        :aria-valuenow="value"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="ariaLabel || label"
      >
        <div v-if="animated" class="progress-shine"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number // 0-100
  label?: string
  ariaLabel?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 'md',
  animated: true,
  showLabel: true
})

const containerClasses = computed(() => {
  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden'
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  
  return [baseClasses, sizeClasses[props.size]].join(' ')
})

const barClasses = computed(() => {
  const baseClasses = 'h-full transition-all duration-slow ease-out relative'
  
  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error'
  }
  
  return [baseClasses, colorClasses[props.color]].join(' ')
})
</script>

<style scoped>
.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>