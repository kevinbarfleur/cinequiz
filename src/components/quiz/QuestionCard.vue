<template>
  <div class="w-full max-w-2xl mx-auto">
    <BaseCard variant="elevated" padding="lg" class="relative">
      <!-- Progress Section -->
      <div class="mb-6 animate-fade-in">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-text-2">
            Question {{ questionNumber }} sur {{ totalQuestions }}
          </span>
          <span class="text-sm font-medium text-brand-1">
            {{ Math.round(progress) }}%
          </span>
        </div>
        <!-- Progress bar with matching gradient -->
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            class="h-full transition-all duration-300 ease-out"
            :style="{ 
              width: `${Math.round(progress)}%`,
              background: 'linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-next))'
            }"
          ></div>
        </div>

      </div>



      <!-- Question Section -->
      <div class="mb-8 animate-fade-in-delay">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div v-if="question.category">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-bg-soft text-brand-1 border border-brand-1/30">{{ question.category }}</span>
          </div>
          <div v-if="question.difficulty">
            <span :class="difficultyClasses">{{ difficultyLabel }}</span>
          </div>
        </div>
        
        <h2 class="text-xl md:text-2xl font-semibold text-text-1 leading-relaxed">
          {{ question.question }}
        </h2>
      </div>

      <!-- Answers Section -->
      <div class="animate-fade-in-delay-2">
        <!-- Host Mode: Interactive Answer Buttons -->
        <div v-if="userMode === 'host'" class="space-y-3">
          <AnswerButton
            v-for="(answer, index) in question.answers"
            :key="`answer-${index}`"
            :answer="answer"
            :is-correct="index === question.correctAnswer"
            :is-selected="getAnswerSelectionState(index)"
            :show-result="shouldShowResult"
            :disabled="isAnswerDisabled(index)"
            :user-mode="userMode"
            :assigned-teams="getAssignedTeams(index)"
            @click="handleAnswerClick(index)"
            @team-assignment-requested="handleTeamAssignmentRequest(index)"
            class="transform transition-all duration-200 hover:scale-102 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </div>
        
        <!-- Participant Mode: Simple Numbered List -->
        <div v-else-if="userMode === 'participant'" class="space-y-4">
          <ol class="list-none space-y-3">
            <li 
              v-for="(answer, index) in question.answers"
              :key="`participant-answer-${index}`"
              class="flex items-start gap-3 p-4 bg-bg-soft/50 rounded-lg border border-divider/50"
            >
              <span class="flex-shrink-0 w-6 h-6 bg-brand-1 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {{ index + 1 }}
              </span>
              <span class="flex-1 text-base leading-6 mobile:text-lg text-text-1">
                {{ answer }}
              </span>
            </li>
          </ol>
        </div>
        
        <!-- Legacy Mode: Default Behavior -->
        <div v-else class="space-y-3">
          <AnswerButton
            v-for="(answer, index) in question.answers"
            :key="`legacy-answer-${index}`"
            :answer="answer"
            :is-correct="index === question.correctAnswer"
            :is-selected="getAnswerSelectionState(index)"
            :show-result="shouldShowResult"
            :disabled="isAnswerDisabled(index)"
            :user-mode="userMode"
            :assigned-teams="getAssignedTeams(index)"
            @click="handleAnswerClick(index)"
            @team-assignment-requested="handleTeamAssignmentRequest(index)"
            class="transform transition-all duration-200 hover:scale-102 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </div>
      </div>

      <!-- Team Assignment Status (Host Mode) -->
      <div v-if="userMode === 'host' && hasTeamAssignments" class="bg-bg rounded-lg p-4 border border-divider animate-fade-in-up mt-6">
        <div class="flex justify-between items-center mb-3">
          <span class="font-medium text-text-1">Attribution des équipes</span>
          <span class="text-sm font-medium text-brand-1 bg-bg-soft border border-brand-1/30 px-2 py-1 rounded">{{ assignedTeamsCount }}/{{ totalTeams }}</span>
        </div>
        <div class="space-y-2">
          <div v-for="[answerIndex, teams] in Array.from(teamAssignments || new Map())" :key="answerIndex" class="flex items-center justify-between p-2 bg-bg-soft rounded border border-divider">
            <span class="text-sm font-medium text-text-1 flex-1 mr-3">{{ question.answers[answerIndex] }}</span>
            <div class="flex flex-wrap gap-1">
              <span v-for="teamId in teams" :key="teamId" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-bg-soft text-brand-2 border border-brand-2/30">
                {{ getTeamName(teamId) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="animate-fade-in-up mt-6">
        <!-- Participant Mode Navigation -->
        <div v-if="userMode === 'participant'">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <!-- Previous button - only show if not first question -->
            <BaseButton
              v-if="hasPrevious"
              variant="outline"
              size="md"
              @click="$emit('previous')"
              class="min-w-100px"
            >
              <span class="mr-2">←</span>
              Précédent
            </BaseButton>
            
            <!-- Spacer when no previous button -->
            <div v-else class="min-w-100px"></div>
            
            <!-- Next button - only show if not last question -->
            <BaseButton
              v-if="hasNext"
              variant="primary"
              size="md"
              @click="$emit('next')"
              class="min-w-100px"
            >
              <span>Suivant</span>
              <span class="ml-2">→</span>
            </BaseButton>
            
            <!-- Spacer when no next button -->
            <div v-else class="min-w-100px"></div>
          </div>
        </div>

        <!-- Host Mode Navigation -->
        <div v-else-if="userMode === 'host'">
          <div v-if="shouldShowResult" class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="flex items-center">
              <span class="text-green-1 font-medium flex items-center gap-1">
                ✅ Bonne réponse : {{ question.answers[question.correctAnswer] }}
              </span>
            </div>
            
            <BaseButton
              variant="primary"
              size="md"
              @click="$emit('next')"
              :disabled="!canProceedToNext"
              class="flex items-center gap-2 min-w-140px justify-center"
            >
              <span v-if="isLastQuestion">Voir les résultats</span>
              <span v-else>Question suivante</span>
              <span class="ml-2">→</span>
            </BaseButton>
          </div>
          
          <div v-else class="text-center p-4 bg-bg rounded-lg border border-divider">
            <p class="text-text-2 mb-2">
              Attribuez une réponse à chaque équipe pour révéler la bonne réponse
            </p>
            <div class="flex justify-center">
              <span class="text-sm font-medium text-brand-1">{{ assignedTeamsCount }}/{{ totalTeams }} équipes assignées</span>
            </div>
          </div>
        </div>

        <!-- Default Navigation (fallback) -->
        <div v-else-if="showResult">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="flex items-center">
              <span v-if="isCorrectAnswer" class="text-green-1 font-medium flex items-center gap-1">
                ✅ Bonne réponse !
              </span>
              <span v-else class="text-red-1 font-medium flex items-center gap-1">
                ❌ Pas tout à fait...
              </span>
            </div>
            
            <BaseButton
              variant="primary"
              size="md"
              @click="$emit('next')"
              :disabled="!canProceed"
              class="flex items-center gap-2 min-w-140px justify-center mobile:w-full"
            >
              <span v-if="isLastQuestion">Voir les résultats</span>
              <span v-else>Question suivante</span>
              <span class="ml-2">→</span>
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Explanation Section (shown after answer) -->
      <div v-if="shouldShowExplanation && question.explanation" class="animate-fade-in-up mt-6">
        <div class="bg-bg rounded-lg p-4 border-l-4 border-brand-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">💡</span>
            <span class="font-medium text-text-1">Le saviez-vous ?</span>
          </div>
          <p class="text-text-2 leading-relaxed">{{ question.explanation }}</p>
        </div>
      </div>


    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseProgressBar from '@/components/ui/BaseProgressBar.vue'
import AnswerButton from './AnswerButton.vue'
import type { Question, Team, UserMode } from '@/types'

interface Props {
  question: Question
  questionNumber: number
  totalQuestions: number
  userMode?: UserMode
  teams?: Team[]
  teamAssignments?: Map<number, string[]>
  participantAnswer?: number | null
  hasPrevious?: boolean
  hasNext?: boolean
  canProceedToNext?: boolean
  autoReveal?: boolean
  revealDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  userMode: 'participant',
  teams: () => [],
  teamAssignments: () => new Map(),
  participantAnswer: null,
  hasPrevious: false,
  hasNext: true,
  canProceedToNext: false,
  autoReveal: true,
  revealDelay: 1500
})

const emit = defineEmits<{
  answer: [answerIndex: number, isCorrect: boolean]
  'participant-answer': [answerIndex: number]
  'team-assignment-requested': [answerIndex: number]
  next: []
  previous: []
}>()

// Component state
const selectedAnswer = ref<number | null>(null)
const showResult = ref(false)
const isAnswered = ref(false)
const canProceed = ref(false)

// Computed properties
const progress = computed(() => 
  (props.questionNumber / props.totalQuestions) * 100
)

const isLastQuestion = computed(() => 
  props.questionNumber === props.totalQuestions
)

const isCorrectAnswer = computed(() => 
  selectedAnswer.value === props.question.correctAnswer
)

const difficultyLabel = computed(() => {
  switch (props.question.difficulty) {
    case 'easy': return 'Facile'
    case 'medium': return 'Moyen'
    case 'hard': return 'Difficile'
    default: return ''
  }
})

const difficultyClasses = computed(() => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium'
  
  switch (props.question.difficulty) {
    case 'easy':
      return `${baseClasses} bg-green-soft text-green-1`
    case 'medium':
      return `${baseClasses} bg-yellow-soft text-yellow-1`
    case 'hard':
      return `${baseClasses} bg-red-soft text-red-1`
    default:
      return baseClasses
  }
})



// Mode-specific computed properties
const shouldShowResult = computed(() => {
  if (props.userMode === 'host') {
    // Host sees results only when all teams are assigned
    return hasAllTeamsAssigned.value
  } else if (props.userMode === 'participant') {
    // Participant never sees results during quiz
    return false
  } else {
    // Default behavior (legacy)
    return showResult.value
  }
})

const shouldShowExplanation = computed(() => {
  // Only show explanation when results are shown
  return shouldShowResult.value
})

const hasAllTeamsAssigned = computed(() => {
  if (props.userMode !== 'host' || !props.teams || props.teams.length === 0) {
    return false
  }
  
  // Get all assigned team IDs across all answers
  const allAssignedTeamIds = new Set<string>()
  Array.from(props.teamAssignments?.values() || [])
    .flat()
    .forEach(teamId => allAssignedTeamIds.add(teamId))
  
  // Check that every team has been assigned to at least one answer
  return props.teams.every(team => allAssignedTeamIds.has(team.id))
})

const assignedTeamsCount = computed(() => {
  const allAssignedTeamIds = new Set<string>()
  Array.from(props.teamAssignments?.values() || [])
    .flat()
    .forEach(teamId => allAssignedTeamIds.add(teamId))
  
  return allAssignedTeamIds.size
})

const totalTeams = computed(() => {
  return props.teams?.length || 0
})

const hasTeamAssignments = computed(() => {
  return props.teamAssignments && props.teamAssignments.size > 0
})

// Answer state methods
const getAnswerSelectionState = (answerIndex: number): boolean => {
  if (props.userMode === 'participant') {
    // Participant mode: no answer selection
    return false
  } else if (props.userMode === 'host') {
    // In host mode, show if any team is assigned to this answer
    return (props.teamAssignments?.get(answerIndex)?.length || 0) > 0
  } else {
    // Default behavior
    return selectedAnswer.value === answerIndex
  }
}

const isAnswerDisabled = (answerIndex: number): boolean => {
  if (props.userMode === 'host') {
    // Host can always click to assign teams
    return false
  } else if (props.userMode === 'participant') {
    // Participant mode: answers are disabled (handled by parent disabled prop)
    return true
  } else {
    // Default behavior
    return isAnswered.value
  }
}

const getAssignedTeams = (answerIndex: number): string[] => {
  const teamIds = props.teamAssignments?.get(answerIndex) || []
  return teamIds.map(teamId => getTeamName(teamId))
}

const getTeamName = (teamId: string): string => {
  const team = props.teams?.find(t => t.id === teamId)
  return team?.name || 'Équipe inconnue'
}

// Methods
const handleAnswerClick = (answerIndex: number) => {
  if (props.userMode === 'participant') {
    // Participant mode: no answer interaction allowed
    return
  } else if (props.userMode === 'host') {
    // Host mode: request team assignment
    emit('team-assignment-requested', answerIndex)
  } else {
    // Default behavior (legacy)
    if (isAnswered.value) return
    
    selectedAnswer.value = answerIndex
    isAnswered.value = true
    
    const isCorrect = answerIndex === props.question.correctAnswer
    
    // Emit answer event immediately
    emit('answer', answerIndex, isCorrect)
    
    // Show result after delay or immediately based on autoReveal
    if (props.autoReveal) {
      setTimeout(() => {
        showResult.value = true
        canProceed.value = true
      }, props.revealDelay)
    } else {
      showResult.value = true
      canProceed.value = true
    }
  }
}

const handleTeamAssignmentRequest = (answerIndex: number) => {
  emit('team-assignment-requested', answerIndex)
}

const resetQuestion = () => {
  selectedAnswer.value = null
  showResult.value = false
  isAnswered.value = false
  canProceed.value = false
}

// Watch for question changes to reset state
watch(() => props.question.id, () => {
  resetQuestion()
})

// Expose methods for parent component
defineExpose({
  resetQuestion,
  revealAnswer: () => {
    showResult.value = true
    canProceed.value = true
  }
})
</script>

<style scoped>
/* Custom animations for UnoCSS - moved to global CSS or use UnoCSS animation utilities */
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

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 0.5s ease-out 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fade-in 0.5s ease-out 0.4s both;
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-fade-in-delay,
  .animate-fade-in-delay-2,
  .animate-fade-in-up {
    animation: none;
  }
}
</style>