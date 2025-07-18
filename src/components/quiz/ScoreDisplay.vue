<template>
  <div class="score-display">
    <BaseCard variant="elevated" padding="lg" class="text-center max-w-md mx-auto">
      <!-- Score Animation Container -->
      <div class="score-animation-container mb-6">
        <div class="score-circle" :class="scoreCircleClasses">
          <div class="score-percentage">
            <span class="score-number">{{ animatedScore }}</span>
            <span class="score-symbol">%</span>
          </div>
          <div class="score-label">Score Final</div>
        </div>
      </div>

      <!-- Encouragement Message -->
      <div class="encouragement-section mb-6">
        <h2 class="encouragement-title text-2xl font-bold text-text-primary mb-2">
          {{ encouragementMessage.title }}
        </h2>
        <p class="encouragement-text text-lg text-text-secondary">
          {{ encouragementMessage.message }}
        </p>
      </div>

      <!-- Statistics -->
      <div class="stats-section mb-6">
        <div class="stats-grid grid grid-cols-2 gap-4">
          <div class="stat-item">
            <div class="stat-value text-xl font-semibold text-primary">
              {{ stats.correctAnswers }}
            </div>
            <div class="stat-label text-sm text-text-secondary">
              Bonnes réponses
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-value text-xl font-semibold text-secondary">
              {{ stats.incorrectAnswers }}
            </div>
            <div class="stat-label text-sm text-text-secondary">
              Erreurs
            </div>
          </div>
        </div>
        
        <div class="time-stat mt-4 p-3 bg-background rounded-lg">
          <div class="stat-value text-lg font-medium text-text-primary">
            {{ formatTime(stats.timeSpent) }}
          </div>
          <div class="stat-label text-sm text-text-secondary">
            Temps total
          </div>
        </div>
      </div>

      <!-- New Best Score Badge -->
      <div v-if="isNewBestScore" class="new-best-badge mb-4">
        <div class="badge-content bg-success text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
          <div class="i-carbon-trophy text-sm"></div>
          Nouveau record personnel !
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="navigation-buttons space-y-3">
        <BaseButton
          variant="primary"
          size="lg"
          class="w-full"
          @click="$emit('restart')"
        >
          <div class="i-carbon-restart text-sm mr-2"></div>
          Rejouer
        </BaseButton>
        
        <BaseButton
          variant="outline"
          size="lg"
          class="w-full"
          @click="$emit('home')"
        >
          <div class="i-carbon-home text-sm mr-2"></div>
          Retour à l'accueil
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { QuizStats } from '@/types'

interface Props {
  score: number
  totalQuestions: number
  stats: QuizStats
  isNewBestScore?: boolean
}

interface EncouragementMessage {
  title: string
  message: string
}

const props = withDefaults(defineProps<Props>(), {
  isNewBestScore: false
})

defineEmits<{
  restart: []
  home: []
}>()

// Animation state
const animatedScore = ref(0)
const isAnimating = ref(false)

// Computed properties
const scorePercentage = computed(() => 
  props.totalQuestions > 0 
    ? Math.round((props.score / props.totalQuestions) * 100)
    : 0
)

const scoreCircleClasses = computed(() => {
  const baseClasses = 'score-circle-base'
  
  // Color based on score performance
  if (scorePercentage.value >= 90) return `${baseClasses} score-excellent`
  if (scorePercentage.value >= 75) return `${baseClasses} score-good`
  if (scorePercentage.value >= 50) return `${baseClasses} score-average`
  return `${baseClasses} score-needs-improvement`
})

const encouragementMessage = computed((): EncouragementMessage => {
  const score = scorePercentage.value
  
  if (score === 100) {
    return {
      title: "Parfait !",
      message: "Tu es une vraie experte du cinéma ! Toutes les réponses sont correctes !"
    }
  } else if (score >= 90) {
    return {
      title: "Excellent !",
      message: "Impressionnant ! Tu connais vraiment bien le cinéma !"
    }
  } else if (score >= 75) {
    return {
      title: "Très bien !",
      message: "Belle performance ! Tu as de solides connaissances cinéma !"
    }
  } else if (score >= 50) {
    return {
      title: "Pas mal !",
      message: "C'est un bon début ! Continue à regarder des films !"
    }
  } else if (score >= 25) {
    return {
      title: "On progresse !",
      message: "Il y a du potentiel ! Une petite séance rattrapage s'impose !"
    }
  } else {
    return {
      title: "Courage !",
      message: "Ce n'est qu'un début ! Le cinéma n'aura bientôt plus de secrets pour toi !"
    }
  }
})

// Animation functions
const animateScore = () => {
  isAnimating.value = true
  const duration = 2000 // 2 seconds
  const startTime = Date.now()
  const startValue = 0
  const endValue = scorePercentage.value

  const animate = () => {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function for smooth animation
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const easedProgress = easeOutCubic(progress)
    
    animatedScore.value = Math.round(startValue + (endValue - startValue) * easedProgress)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      isAnimating.value = false
    }
  }
  
  requestAnimationFrame(animate)
}

// Utility functions
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

// Lifecycle
onMounted(() => {
  // Start animation after a short delay for better UX
  setTimeout(() => {
    animateScore()
  }, 300)
})

// Watch for score changes (in case component is reused)
watch(() => props.score, () => {
  animateScore()
})
</script>

<style scoped>
.score-display {
  @apply min-h-screen flex items-center justify-center p-4;
}

.score-animation-container {
  @apply relative;
}

.score-circle {
  @apply relative w-32 h-32 mx-auto mb-4 rounded-full flex flex-col items-center justify-center;
  background: conic-gradient(from 0deg, var(--circle-color, theme('colors.primary.DEFAULT')) 0%, var(--circle-color, theme('colors.primary.DEFAULT')) var(--progress, 0%), theme('colors.gray.200') var(--progress, 0%), theme('colors.gray.200') 100%);
}

.score-circle-base {
  @apply transition-all duration-slow;
  --progress: 0%;
}

.score-circle.score-excellent {
  --circle-color: theme('colors.success');
  --progress: v-bind('scorePercentage + "%"');
}

.score-circle.score-good {
  --circle-color: theme('colors.primary.DEFAULT');
  --progress: v-bind('scorePercentage + "%"');
}

.score-circle.score-average {
  --circle-color: theme('colors.warning');
  --progress: v-bind('scorePercentage + "%"');
}

.score-circle.score-needs-improvement {
  --circle-color: theme('colors.secondary');
  --progress: v-bind('scorePercentage + "%"');
}

.score-circle::before {
  content: '';
  @apply absolute inset-2 bg-surface rounded-full;
}

.score-percentage {
  @apply relative z-10 flex items-baseline;
}

.score-number {
  @apply text-3xl font-bold text-text-primary;
}

.score-symbol {
  @apply text-lg font-medium text-text-secondary ml-1;
}

.score-label {
  @apply relative z-10 text-xs font-medium text-text-secondary mt-1;
}

.encouragement-section {
  @apply animate-fade-in-up;
  animation-delay: 0.5s;
  animation-fill-mode: both;
}

.stats-section {
  @apply animate-fade-in-up;
  animation-delay: 0.8s;
  animation-fill-mode: both;
}

.navigation-buttons {
  @apply animate-fade-in-up;
  animation-delay: 1.1s;
  animation-fill-mode: both;
}

.new-best-badge {
  @apply animate-bounce;
  animation-delay: 1.5s;
  animation-fill-mode: both;
}

.badge-content {
  @apply animate-pulse;
}

/* Custom animations */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out;
}

/* Responsive adjustments */
@media (max-width: 425px) {
  .score-circle {
    @apply w-28 h-28;
  }
  
  .score-number {
    @apply text-2xl;
  }
  
  .encouragement-title {
    @apply text-xl;
  }
  
  .encouragement-text {
    @apply text-base;
  }
}
</style>