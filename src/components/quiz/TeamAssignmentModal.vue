<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="isVisible"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        @click="handleOverlayClick"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          class="bg-bg rounded-xl shadow-2xl max-w-2xl w-full max-h-90vh overflow-hidden outline-none mobile:mx-2 mobile:max-h-95vh"
          :style="modalStyles"
          @click.stop
          ref="modalContainer"
        >
          <div class="flex items-center justify-between p-6 mobile:p-4 border-b border-divider">
            <h3 id="modal-title" class="text-xl font-bold text-text-1">
              Attribuer la réponse
            </h3>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="handleClose"
              aria-label="Fermer"
              class="w-8 h-8 p-0"
            >
              <div class="i-carbon-close text-lg"></div>
            </BaseButton>
          </div>

          <div class="p-6 mobile:p-4 overflow-y-auto max-h-60vh">
            <div class="mb-6">
              <p class="text-sm font-medium text-text-2 mb-2">Réponse sélectionnée :</p>
              <div class="bg-bg-soft border border-brand-1/40 rounded-lg p-4 text-brand-1 font-medium">
                {{ selectedAnswer }}
              </div>
            </div>

            <div class="mb-6">
              <p class="text-sm font-medium text-text-2 mb-4">Choisir l'équipe :</p>
              
              <div v-if="teams.length === 0" class="text-center py-8">
                <p class="text-text-3">Aucune équipe disponible</p>
              </div>
              
              <div v-else class="grid gap-3 mobile:grid-cols-1" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                <button
                  v-for="team in teams"
                  :key="team.id"
                  :class="[
                    'flex items-center gap-3 p-4 mobile:p-5 border transition-all duration-200 cursor-pointer bg-bg text-base mobile:text-base',
                    selectedTeamId === team.id 
                      ? 'border-brand-1 bg-brand-1/5' 
                      : isTeamAlreadyAssigned(team.id)
                        ? 'opacity-50 cursor-not-allowed border-divider bg-bg-soft'
                        : 'border-divider hover:border-brand-1/50'
                  ]"
                  @click="handleTeamSelect(team.id)"
                  :disabled="isTeamAlreadyAssigned(team.id)"
                  :aria-label="`Attribuer à ${team.name}`"
                >
                  <div 
                    class="w-4 h-4 rounded-full flex-shrink-0" 
                    :style="{ backgroundColor: team.color || '#6366f1' }"
                  />
                  <div class="flex-1 text-left">
                    <span class="block font-medium text-text-1">{{ team.name }}</span>
                    <span 
                      v-if="isTeamAlreadyAssigned(team.id)" 
                      class="block text-xs text-text-2 mt-1"
                    >
                      Déjà attribuée
                    </span>
                  </div>
                  <div v-if="selectedTeamId === team.id" class="text-brand-1 font-bold text-lg">
                    ✓
                  </div>
                </button>
              </div>
            </div>

            <!-- Assignment Summary -->
            <div v-if="assignmentSummary.length > 0" class="border-t border-divider pt-4">
              <p class="text-sm font-medium text-text-2 mb-3">Attributions actuelles :</p>
              <div class="space-y-2">
                <div
                  v-for="assignment in assignmentSummary"
                  :key="assignment.teamId"
                  class="flex items-center gap-2 text-sm"
                >
                  <div 
                    class="w-3 h-3 rounded-full flex-shrink-0" 
                    :style="{ backgroundColor: assignment.teamColor }"
                  />
                  <span class="font-medium text-text-1">{{ assignment.teamName }}</span>
                  <span class="text-text-2">→</span>
                  <span class="text-text-2">{{ assignment.answer }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 mobile:p-4 border-t border-divider bg-bg-soft/50">
            <div class="flex gap-3 justify-end mobile:flex-col mobile:gap-2">
              <BaseButton
                variant="ghost"
                @click="handleClose"
              >
                Annuler
              </BaseButton>
              
              <BaseButton
                variant="primary"
                :disabled="!selectedTeamId || isTeamAlreadyAssigned(selectedTeamId)"
                @click="handleConfirm"
              >
                Attribuer
              </BaseButton>
            </div>
            
            <div v-if="validationMessage" class="mt-3 text-sm text-red-1 font-medium">
              {{ validationMessage }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { BaseButton } from '@/components/ui'
import { useMobileOptimization } from '@/utils/mobileOptimization'
import type { Team } from '@/types'

// Props
interface Props {
  isVisible: boolean
  selectedAnswer: string
  selectedAnswerIndex: number
  teams: Team[]
  currentQuestionId: string
  existingAssignments?: Map<number, string[]> // answerIndex -> teamIds
  allAnswers?: string[] // All possible answers for context
}

const props = withDefaults(defineProps<Props>(), {
  existingAssignments: () => new Map(),
  allAnswers: () => []
})

// Emits
const emit = defineEmits<{
  'team-selected': [teamId: string, answerIndex: number]
  'modal-closed': []
  'assignment-confirmed': [teamId: string, answerIndex: number]
}>()

// Mobile optimization
const { 
  touch, 
  viewport, 
  haptic, 
  accessibility,
  getOptimizedConfig 
} = useMobileOptimization()

// Reactive state
const selectedTeamId = ref<string | null>(null)
const modalContainer = ref<HTMLElement>()
const validationMessage = ref('')

// Mobile-optimized modal styles
const modalStyles = computed(() => {
  const config = getOptimizedConfig()
  const modalSize = config.ui.modalSize
  
  if (viewport.isMobile.value) {
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
      width: `${modalSize.width}px`,
      maxHeight: `${modalSize.maxHeight}px`,
      borderRadius: '16px',
      margin: 'auto'
    }
  }
})

// Computed properties
const assignmentSummary = computed(() => {
  if (!props.existingAssignments || !props.allAnswers.length) return []
  
  const summary: Array<{
    teamId: string
    teamName: string
    teamColor: string
    answer: string
  }> = []
  
  props.existingAssignments.forEach((teamIds, answerIndex) => {
    const answer = props.allAnswers[answerIndex] || `Réponse ${answerIndex + 1}`
    
    teamIds.forEach(teamId => {
      const team = props.teams.find(t => t.id === teamId)
      if (team) {
        summary.push({
          teamId,
          teamName: team.name,
          teamColor: team.color || '#6366f1',
          answer
        })
      }
    })
  })
  
  return summary
})

// Methods
const isTeamAlreadyAssigned = (teamId: string): boolean => {
  if (!props.existingAssignments) return false
  
  // Check if this team is already assigned to ANY answer for this question
  for (const [answerIndex, assignedTeamIds] of props.existingAssignments.entries()) {
    if (assignedTeamIds.includes(teamId)) {
      return true
    }
  }
  
  return false
}

const handleTeamSelect = (teamId: string) => {
  if (isTeamAlreadyAssigned(teamId)) {
    validationMessage.value = 'Cette équipe a déjà une réponse attribuée pour cette question'
    selectedTeamId.value = null
    haptic.errorFeedback()
    accessibility.announceToScreenReader('Cette équipe a déjà une réponse attribuée')
    return
  }
  
  selectedTeamId.value = teamId
  validationMessage.value = ''
  
  // Provide haptic feedback for selection
  haptic.lightTap()
  
  // Announce selection to screen readers
  const team = props.teams.find(t => t.id === teamId)
  if (team) {
    accessibility.announceToScreenReader(`Équipe ${team.name} sélectionnée`)
  }
  
  // Emit selection for immediate feedback
  emit('team-selected', teamId, props.selectedAnswerIndex)
}

const handleConfirm = () => {
  if (!selectedTeamId.value) {
    validationMessage.value = 'Veuillez sélectionner une équipe'
    haptic.errorFeedback()
    accessibility.announceToScreenReader('Veuillez sélectionner une équipe')
    return
  }
  
  if (isTeamAlreadyAssigned(selectedTeamId.value)) {
    validationMessage.value = 'Cette équipe a déjà une réponse attribuée'
    haptic.errorFeedback()
    accessibility.announceToScreenReader('Cette équipe a déjà une réponse attribuée')
    return
  }
  
  haptic.successFeedback()
  const team = props.teams.find(t => t.id === selectedTeamId.value)
  if (team) {
    accessibility.announceToScreenReader(`Réponse attribuée à l'équipe ${team.name}`)
  }
  
  emit('assignment-confirmed', selectedTeamId.value, props.selectedAnswerIndex)
  handleClose()
}

const handleClose = () => {
  selectedTeamId.value = null
  validationMessage.value = ''
  haptic.lightTap()
  
  // Restore body scroll on mobile
  if (viewport.isMobile.value) {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
  
  emit('modal-closed')
}

const handleOverlayClick = () => {
  handleClose()
}

// Touch handlers for mobile optimization
const handleTouchStart = (event: TouchEvent) => {
  touch.handleTouchStart(event)
}

const handleTouchEnd = (event: TouchEvent) => {
  touch.handleTouchEnd(event, () => {
    // Only close if touching the overlay, not the modal content
    if (event.target === event.currentTarget) {
      handleClose()
    }
  })
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isVisible) {
    handleClose()
  }
}

const focusModal = async () => {
  await nextTick()
  if (modalContainer.value) {
    modalContainer.value.focus()
  }
}

// Watchers
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    focusModal()
    // Reset state when modal opens
    selectedTeamId.value = null
    validationMessage.value = ''
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<style scoped>
/* Modal animations with UnoCSS-compatible approach */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
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
</style>