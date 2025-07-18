<template>
  <div class="question-navigation">
    <!-- Participant Mode Navigation -->
    <div v-if="userMode === 'participant'" class="participant-nav">
      <div class="nav-controls">
        <BaseButton
          variant="outline"
          size="md"
          @click="$emit('previous')"
          :disabled="!hasPrevious"
          class="nav-button prev-button"
        >
          <div class="i-carbon-chevron-left nav-icon"></div>
          <span>Précédent</span>
        </BaseButton>
        
        <div class="progress-info">
          <div class="question-indicator">
            <span class="current-question">{{ currentQuestion }}</span>
            <span class="separator">/</span>
            <span class="total-questions">{{ totalQuestions }}</span>
          </div>
          <div class="progress-bar-container">
            <BaseProgressBar 
              :value="progressPercentage" 
              :show-label="false"
              color="primary"
              size="sm"
              :animated="true"
            />
          </div>
        </div>
        
        <BaseButton
          variant="primary"
          size="md"
          @click="$emit('next')"
          :disabled="!hasNext"
          class="nav-button next-button"
        >
          <span>{{ isLastQuestion ? 'Terminer' : 'Suivant' }}</span>
          <div class="i-carbon-chevron-right nav-icon"></div>
        </BaseButton>
      </div>
      
      <!-- Answer Status Indicator -->
      <div class="answer-status">
        <div class="status-indicator">
          <div v-if="hasAnswered" class="answered-status">
            <div class="i-carbon-checkmark status-icon"></div>
            <span>Réponse enregistrée</span>
          </div>
          <div v-else class="unanswered-status">
            <div class="i-carbon-information status-icon"></div>
            <span>Aucune réponse</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Host Mode Navigation -->
    <div v-else-if="userMode === 'host'" class="host-nav">
      <div class="host-controls">
        <!-- Assignment Status -->
        <div class="assignment-status">
          <div class="status-header">
            <span class="status-title">Attribution des équipes</span>
            <span class="status-count">{{ assignedTeamsCount }}/{{ totalTeams }}</span>
          </div>
          <div class="status-progress">
            <BaseProgressBar 
              :value="assignmentProgress" 
              :show-label="false"
              color="secondary"
              size="sm"
              :animated="true"
            />
          </div>
        </div>
        
        <!-- Validation Controls -->
        <div class="validation-controls">
          <div v-if="!canProceed" class="validation-message">
            <div class="i-carbon-warning message-icon"></div>
            <span>Attribuez une réponse à chaque équipe pour continuer</span>
          </div>
          
          <div v-else class="validation-success">
            <div class="i-carbon-checkmark message-icon"></div>
            <span>Toutes les équipes sont assignées</span>
          </div>
        </div>
        
        <!-- Navigation Button -->
        <div class="host-nav-button">
          <BaseButton
            variant="primary"
            size="lg"
            @click="$emit('next')"
            :disabled="!canProceed"
            class="proceed-button"
          >
            <span v-if="isLastQuestion">Voir les résultats</span>
            <span v-else>Question suivante</span>
            <div class="i-carbon-chevron-right nav-icon"></div>
          </BaseButton>
        </div>
      </div>
      
      <!-- Question Progress -->
      <div class="question-progress">
        <div class="progress-header">
          <span class="progress-label">Question {{ currentQuestion }} sur {{ totalQuestions }}</span>
          <span class="progress-percentage">{{ Math.round(progressPercentage) }}%</span>
        </div>
        <BaseProgressBar 
          :value="progressPercentage" 
          :show-label="false"
          color="primary"
          size="md"
          :animated="true"
        />
      </div>
    </div>

    <!-- Default Navigation (fallback) -->
    <div v-else-if="!userMode || (userMode !== 'host' && userMode !== 'participant')" class="default-nav">
      <div class="default-controls">
        <div class="progress-display">
          <span class="question-counter">Question {{ currentQuestion }} sur {{ totalQuestions }}</span>
          <BaseProgressBar 
            :value="progressPercentage" 
            :show-label="true"
            color="primary"
            size="md"
            :animated="true"
          />
        </div>
        
        <BaseButton
          variant="primary"
          size="md"
          @click="$emit('next')"
          :disabled="!canProceed"
          class="next-button"
        >
          <span v-if="isLastQuestion">Terminer</span>
          <span v-else>Suivant</span>
          <div class="i-carbon-chevron-right nav-icon"></div>
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseProgressBar from '@/components/ui/BaseProgressBar.vue'
import type { UserMode } from '@/types'

interface Props {
  currentQuestion: number
  totalQuestions: number
  userMode?: UserMode
  hasPrevious?: boolean
  hasNext?: boolean
  canProceed?: boolean
  hasAnswered?: boolean
  assignedTeamsCount?: number
  totalTeams?: number
}

const props = withDefaults(defineProps<Props>(), {
  userMode: 'participant',
  hasPrevious: false,
  hasNext: true,
  canProceed: true,
  hasAnswered: false,
  assignedTeamsCount: 0,
  totalTeams: 0
})

const emit = defineEmits<{
  next: []
  previous: []
}>()

// Computed properties
const progressPercentage = computed(() => 
  props.totalQuestions > 0 
    ? Math.round(((props.currentQuestion - 1) / props.totalQuestions) * 100)
    : 0
)

const isLastQuestion = computed(() => 
  props.currentQuestion === props.totalQuestions
)

const assignmentProgress = computed(() => 
  props.totalTeams > 0 
    ? Math.round((props.assignedTeamsCount / props.totalTeams) * 100)
    : 0
)
</script>

<style scoped>
.question-navigation {
  @apply w-full;
}

/* Participant Navigation Styles */
.participant-nav {
  @apply space-y-4;
}

.nav-controls {
  @apply flex items-center justify-between gap-3 min-h-12;
}

.nav-button {
  @apply flex items-center gap-2 min-w-24 flex-shrink-0;
  min-width: 100px; /* Override to be more compact */
}

.prev-button {
  @apply justify-start;
}

.next-button {
  @apply justify-end;
}

.nav-icon {
  @apply w-4 h-4 no-shrink;
}

.progress-info {
  @apply flex-1 mx-3 min-w-0;
  max-width: 280px; /* More reasonable max-width */
}

.question-indicator {
  @apply flex items-center justify-center gap-1 mb-2 text-sm font-medium;
  color: var(--vp-c-text-2);
}

.current-question {
  @apply font-semibold;
  color: var(--vp-c-brand-1);
}

.separator {
  color: var(--vp-c-text-2);
}

.total-questions {
  color: var(--vp-c-text-2);
}

.progress-bar-container {
  @apply w-full;
}

.answer-status {
  @apply flex justify-center;
}

.status-indicator {
  @apply flex items-center justify-center;
}

.answered-status {
  @apply flex items-center gap-2 font-medium text-sm;
  color: var(--vp-c-green-1);
}

.unanswered-status {
  @apply flex items-center gap-2 font-medium text-sm;
  color: var(--vp-c-text-2);
}

.status-icon {
  @apply w-4 h-4;
}

/* Host Navigation Styles */
.host-nav {
  @apply space-y-6;
}

.host-controls {
  @apply space-y-4;
}

.assignment-status {
  @apply rounded-lg p-4 border;
  background-color: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
}

.status-header {
  @apply flex justify-between items-center mb-2;
}

.status-title {
  @apply font-medium;
  color: var(--vp-c-text-1);
}

.status-count {
  @apply text-sm font-semibold px-2 py-1 rounded;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-alt);
}

.status-progress {
  @apply w-full;
}

.validation-controls {
  @apply flex justify-center;
}

.validation-message {
  @apply flex items-center gap-2 font-medium text-sm px-4 py-2 rounded-lg;
  color: var(--vp-c-red-1);
  background-color: var(--vp-c-red-soft);
}

.validation-success {
  @apply flex items-center gap-2 font-medium text-sm px-4 py-2 rounded-lg;
  color: var(--vp-c-green-1);
  background-color: var(--vp-c-green-soft);
}

.message-icon {
  @apply w-4 h-4;
}

.host-nav-button {
  @apply flex justify-center;
}

.proceed-button {
  @apply flex items-center gap-2 min-w-44 justify-center;
}

.question-progress {
  @apply rounded-lg p-4 border;
  background-color: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
}

.progress-header {
  @apply flex justify-between items-center mb-2;
}

.progress-label {
  @apply text-sm font-medium;
  color: var(--vp-c-text-2);
}

.progress-percentage {
  @apply text-sm font-semibold;
  color: var(--vp-c-brand-1);
}

/* Default Navigation Styles */
.default-nav {
  @apply space-y-4;
}

.default-controls {
  @apply space-y-4;
}

.progress-display {
  @apply space-y-2;
}

.question-counter {
  @apply block text-center text-sm font-medium content-secondary;
}

.next-button {
  @apply flex items-center gap-2 mx-auto min-w-35 justify-center;
}

/* Improved Mobile optimizations - only apply on very small screens */
@media (max-width: 480px) {
  .nav-controls {
    @apply flex-col gap-3;
  }
  
  .progress-info {
    @apply w-full mx-0 order-first;
    max-width: none;
  }
  
  .nav-button {
    @apply w-full;
    min-width: auto;
  }
  
  .host-controls {
    @apply space-y-3;
  }
  
  .assignment-status {
    @apply p-3;
  }
  
  .proceed-button {
    @apply w-full;
    min-width: auto;
  }
}

/* Medium screens - optimize layout but keep horizontal */
@media (max-width: 640px) and (min-width: 481px) {
  .progress-info {
    max-width: 200px;
  }
  
  .nav-button {
    min-width: 80px;
  }
  
  .nav-button span {
    @apply text-sm;
  }
}

/* Animation classes */
.participant-nav,
.host-nav,
.default-nav {
  @apply animate-fade-in;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .assignment-status,
  .question-progress {
    @apply border-2;
  }
}
</style>