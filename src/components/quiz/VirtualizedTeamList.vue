<template>
  <div 
    ref="containerRef"
    class="virtualized-container"
    :style="containerStyles"
    @scroll="handleOptimizedScroll"
  >
    <div 
      class="virtual-spacer" 
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="virtual-item"
        :style="getItemStyles(item)"
      >
        <slot :item="item" :index="item.index" />
      </div>
    </div>
    
    <!-- Loading indicator for large datasets -->
    <div v-if="isLoading" class="loading-indicator">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useVirtualScrolling, useThrottledEvent } from '@/utils/performance'
import { useMobileOptimization } from '@/utils/mobileOptimization'
import { realTimeMonitor } from '@/utils/performanceBenchmark'

interface Props {
  items: any[]
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  enablePerformanceMonitoring?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 80,
  containerHeight: 400,
  overscan: 5,
  enablePerformanceMonitoring: false
})

// Mobile optimization
const { viewport, performance: mobilePerf } = useMobileOptimization()

// Reactive items reference
const itemsRef = ref(props.items)
const isLoading = ref(false)

// Optimized container height based on device
const optimizedContainerHeight = computed(() => {
  if (viewport.isMobile.value) {
    return Math.min(props.containerHeight, viewport.viewport.value.height - 200)
  }
  return props.containerHeight
})

// Optimized item height based on device
const optimizedItemHeight = computed(() => {
  if (viewport.isMobile.value) {
    return Math.max(props.itemHeight - 8, 64) // Slightly smaller on mobile, min 64px
  }
  return props.itemHeight
})

// Use the performance utility for virtual scrolling
const { 
  containerRef, 
  visibleItems, 
  totalHeight, 
  handleScroll 
} = useVirtualScrolling(
  itemsRef, 
  optimizedContainerHeight.value, 
  optimizedItemHeight.value
)

// Container styles with mobile optimization
const containerStyles = computed(() => ({
  height: `${optimizedContainerHeight.value}px`,
  '--scroll-behavior': mobilePerf.shouldUseReducedAnimations() ? 'auto' : 'smooth'
}))

// Optimized item styles with GPU acceleration
const getItemStyles = (item: any) => ({
  transform: `translate3d(0, ${item.top}px, 0)`, // Use translate3d for GPU acceleration
  height: `${optimizedItemHeight.value}px`,
  willChange: 'transform'
})

// Throttled scroll handler for better performance
const handleOptimizedScroll = useThrottledEvent((event: Event) => {
  if (props.enablePerformanceMonitoring) {
    const start = performance.now()
    handleScroll(event)
    const end = performance.now()
    realTimeMonitor.record('virtualScrolling', end - start)
  } else {
    handleScroll(event)
  }
}, mobilePerf.isLowEndDevice.value ? 32 : 16) // Slower throttling on low-end devices

// Optimized items update with loading state
const updateItems = async () => {
  if (props.items.length > mobilePerf.getOptimalVirtualizationThreshold()) {
    isLoading.value = true
    await nextTick()
  }
  
  itemsRef.value = props.items
  
  if (isLoading.value) {
    // Small delay to show loading state
    setTimeout(() => {
      isLoading.value = false
    }, 100)
  }
}

// Watch for prop changes with debouncing for large datasets
let updateTimeout: number | null = null
watch(() => props.items, () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  const delay = props.items.length > 100 ? 150 : 0
  updateTimeout = window.setTimeout(updateItems, delay)
}, { deep: false }) // Shallow watch for better performance

// Watch for container height changes
watch([optimizedContainerHeight, optimizedItemHeight], () => {
  updateItems()
})

// Intersection Observer for better performance monitoring
let intersectionObserver: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (typeof IntersectionObserver !== 'undefined' && containerRef.value) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && props.enablePerformanceMonitoring) {
            // Monitor when virtualized list is visible
            realTimeMonitor.record('virtualListVisibility', entry.intersectionRatio)
          }
        })
      },
      { threshold: [0, 0.5, 1] }
    )
    
    intersectionObserver.observe(containerRef.value)
  }
}

// Cleanup function
const cleanup = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
    updateTimeout = null
  }
  
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
}

onMounted(async () => {
  await updateItems()
  setupIntersectionObserver()
})

onUnmounted(() => {
  cleanup()
})

// Expose methods for parent components
defineExpose({
  scrollToItem: (index: number) => {
    if (containerRef.value) {
      const targetTop = index * optimizedItemHeight.value
      containerRef.value.scrollTo({
        top: targetTop,
        behavior: mobilePerf.shouldUseReducedAnimations() ? 'auto' : 'smooth'
      })
    }
  },
  scrollToTop: () => {
    if (containerRef.value) {
      containerRef.value.scrollTo({
        top: 0,
        behavior: mobilePerf.shouldUseReducedAnimations() ? 'auto' : 'smooth'
      })
    }
  },
  getVisibleRange: () => {
    return {
      start: Math.floor((containerRef.value?.scrollTop || 0) / optimizedItemHeight.value),
      end: Math.min(
        Math.ceil(((containerRef.value?.scrollTop || 0) + optimizedContainerHeight.value) / optimizedItemHeight.value),
        props.items.length
      )
    }
  }
})
</script>

<style scoped>
.virtualized-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-spacer {
  position: relative;
  width: 100%;
}

.virtual-item {
  position: absolute;
  left: 0;
  right: 0;
  will-change: transform;
}

/* Smooth scrolling */
.virtualized-container {
  scroll-behavior: smooth;
}

/* Loading indicator */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Custom scrollbar */
.virtualized-container::-webkit-scrollbar {
  width: 8px;
}

.virtualized-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtualized-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtualized-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .virtualized-container::-webkit-scrollbar {
    width: 4px;
  }
  
  .virtual-item {
    padding: 8px 12px;
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .virtualized-container {
    scroll-behavior: auto;
  }
  
  .loading-spinner {
    animation: none;
  }
  
  .virtual-item {
    transition: none;
  }
}
</style>