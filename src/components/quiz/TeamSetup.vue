<template>
  <div class="team-setup">
    <!-- Team Creation Form -->
    <div class="team-form card mb-6">
      <div class="flex flex-col gap-4">
        <div>
          <input
            v-model="newTeamName"
            type="text"
            placeholder="Nom de l'équipe"
            class="team-input w-full px-4 py-3 text-base border border-border rounded-lg bg-bg text-text-1 focus:ring-2 focus:ring-brand-1 focus:border-brand-1 transition-all"
            maxlength="50"
            @keyup.enter="handleAddTeam"
            @input="clearError"
          />
        </div>
        <div class="color-picker flex gap-3 justify-center">
          <button
            v-for="color in availableColors"
            :key="color"
            :class="['color-option', { active: selectedColor === color }]"
            :style="{ backgroundColor: color }"
            @click="selectedColor = color"
            :aria-label="`Couleur ${color}`"
          />
        </div>
        <div class="flex justify-center">
          <BaseButton
            variant="primary"
            :disabled="!canAddTeam"
            @click="handleAddTeam"
            data-testid="add-team-button"
          >
            Ajouter
          </BaseButton>
        </div>
      </div>
      
      <!-- Error Message -->
      <div v-if="errorMessage" class="text-red-1 text-sm mt-3 font-medium">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Teams List -->
    <div class="teams-list">
      <div v-if="teams.length === 0" class="empty-state text-center py-12">
        <div class="i-carbon-group text-6xl text-text-3 mb-4"></div>
        <p class="text-muted mb-2">Aucune équipe créée</p>
        <p class="text-sm text-subtle">Ajoutez votre première équipe pour commencer</p>
      </div>

      <!-- Use virtual scrolling for large team lists (>20 teams) -->
      <div
        v-else-if="teams.length > 20"
        ref="containerRef"
        class="virtual-teams-container h-96 overflow-y-auto border border-divider rounded-lg bg-bg"
        @scroll="handleScroll"
      >
        <div class="virtual-spacer relative" :style="{ height: `${totalHeight}px` }">
          <div
            v-for="team in visibleTeams"
            :key="team.id"
            class="team-card virtual-team-card absolute left-0 right-0 mx-4"
            :style="{ transform: `translateY(${team.top}px)` }"
          >
            <div class="team-color h-1" :style="{ backgroundColor: team.color || '#3451b2' }" />
            
            <div class="team-content p-4">
              <div class="team-display flex items-center justify-between">
                <h3 class="team-name text-heading font-medium text-lg">{{ team.name }}</h3>
                <div class="team-actions ml-auto">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    @click="handleDeleteTeam(team.id)"
                    :aria-label="`Supprimer ${team.name}`"
                    class="text-red-1"
                  >
                    <div class="i-carbon-trash-can text-sm"></div>
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Regular grid for smaller team lists -->
      <TransitionGroup
        v-else
        name="team-list"
        tag="div"
        class="teams-grid"
      >
        <div
          v-for="team in teams"
          :key="team.id"
          class="team-card card-hover"
        >
          <div class="team-color h-1" :style="{ backgroundColor: team.color || '#3451b2' }" />
          
          <div class="team-content p-4">
            <div class="team-display flex items-center justify-between">
              <h3 class="team-name text-heading font-medium text-lg">{{ team.name }}</h3>
              <BaseButton
                  variant="secondary"
                  size="sm"
                  @click="handleDeleteTeam(team.id)"
                  :aria-label="`Supprimer ${team.name}`"
                  class="text-red-1 p-0"
                >
                  <div class="i-carbon-trash-can text-sm"></div>
              </BaseButton>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Team Statistics & Quick Actions -->
    <div v-if="teams.length > 0" class="quick-actions mt-6 p-4 card">
      <div class="flex items-center justify-between">
        <div class="team-stats">
          <span class="text-heading font-medium">{{ teams.length }} équipe{{ teams.length > 1 ? 's' : '' }} créée{{ teams.length > 1 ? 's' : '' }}</span>
        </div>
        
        <div class="action-buttons flex gap-3">
          <BaseButton
            variant="secondary"
            size="sm"
            @click="loadLastUsedTeams"
            v-if="hasLastUsedTeams"
          >
            Charger dernières équipes
          </BaseButton>
          
          <BaseButton
            variant="secondary"
            size="sm"
            @click="clearAllTeams"
            class="text-red-1"
          >
            Tout effacer
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-section mt-8 pt-6 border-t border-divider">
      <div class="flex items-center justify-between">
        <BaseButton
          variant="secondary"
          @click="$emit('back')"
          class="flex items-center gap-2"
        >
          <div class="i-carbon-arrow-left text-sm"></div>
          Retour
        </BaseButton>
        
        <BaseButton
          variant="primary"
          size="lg"
          :disabled="!canStartQuiz"
          @click="handleStartQuiz"
          class="flex items-center gap-2"
        >
          Démarrer le Quiz
          <div class="i-carbon-play text-sm"></div>
          <span v-if="teams.length > 0" class="bg-white/20 rounded px-2 py-1 text-sm ml-2 font-medium">
            {{ teams.length }}
          </span>
        </BaseButton>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click="cancelDelete"
      >
        <div class="modal-content card p-6 mx-4 shadow-lg max-w-md" @click.stop>
          <h3 class="modal-title text-heading font-bold text-xl mb-4">Supprimer l'équipe</h3>
          <p class="modal-text text-muted mb-6">
            Êtes-vous sûr de vouloir supprimer l'équipe "{{ teamToDelete?.name }}" ?
          </p>
          <div class="modal-actions flex gap-3 justify-end">
            <BaseButton variant="secondary" @click="cancelDelete">
              Annuler
            </BaseButton>
            <BaseButton variant="primary" @click="confirmDelete">
              Supprimer
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'
import { BaseButton } from '@/components/ui'
import { useMobileOptimization } from '@/utils/mobileOptimization'
import type { Team } from '@/types'
import { useOptimizedAnimations, useVirtualScrolling, performanceMonitor } from '@/utils/performance'

// Props & Emits
const emit = defineEmits<{
  back: []
  'teams-configured': [teams: Team[]]
  'start-quiz': []
}>()

// Store
const quizStore = useQuizStore()

// Mobile optimization
const { 
  touch, 
  viewport, 
  haptic, 
  accessibility,
  getOptimizedConfig 
} = useMobileOptimization()

// Reactive state
const newTeamName = ref('')
const selectedColor = ref('#3451b2')
const showDeleteConfirm = ref(false)
const teamToDelete = ref<Team | null>(null)

// Performance optimizations
const { shouldAnimate, animationDuration } = useOptimizedAnimations()

// Computed properties
const teams = computed(() => quizStore.state.teams)
const errorMessage = computed(() => quizStore.state.error)

const { visibleItems: visibleTeams, totalHeight, handleScroll, containerRef } = useVirtualScrolling(
  teams,
  400, // container height
  100  // estimated team card height
)

// Available colors for teams
const availableColors = [
  '#3451b2', // Primary blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Green
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]

const canAddTeam = computed(() => {
  return newTeamName.value.trim().length > 0 && 
         newTeamName.value.trim().length <= 50 &&
         !teams.value.some(team => 
           team.name.toLowerCase() === newTeamName.value.trim().toLowerCase()
         )
})

const canStartQuiz = computed(() => {
  return teams.value.length > 0 && quizStore.validateTeamConfiguration()
})

const hasLastUsedTeams = computed(() => {
  return quizStore.loadLastUsedTeams().length > 0
})

// Methods
const handleAddTeam = () => {
  if (!canAddTeam.value) {
    haptic.errorFeedback()
    return
  }
  
  const teamId = quizStore.createTeam(newTeamName.value.trim(), selectedColor.value)
  
  if (teamId) {
    haptic.successFeedback()
    accessibility.announceToScreenReader(`Équipe ${newTeamName.value.trim()} ajoutée`)
    
    newTeamName.value = ''
    // Cycle to next color
    const currentIndex = availableColors.indexOf(selectedColor.value)
    selectedColor.value = availableColors[(currentIndex + 1) % availableColors.length]
  } else {
    haptic.errorFeedback()
  }
}

const handleDeleteTeam = (teamId: string) => {
  const team = teams.value.find(t => t.id === teamId)
  if (team) {
    teamToDelete.value = team
    showDeleteConfirm.value = true
  }
}

const confirmDelete = () => {
  if (teamToDelete.value) {
    quizStore.deleteTeam(teamToDelete.value.id)
  }
  cancelDelete()
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  teamToDelete.value = null
}

const clearAllTeams = () => {
  // Create a copy of team IDs to avoid mutation during iteration
  const teamIds = [...teams.value.map(t => t.id)]
  teamIds.forEach(id => quizStore.deleteTeam(id))
}

const loadLastUsedTeams = () => {
  const lastTeams = quizStore.loadLastUsedTeams()
  
  // Clear current teams first
  clearAllTeams()
  
  // Add last used teams
  lastTeams.forEach(team => {
    quizStore.createTeam(team.name, team.color)
  })
}

const handleStartQuiz = () => {
  if (!canStartQuiz.value) return
  
  // Save teams for future use
  quizStore.saveLastUsedTeams()
  
  // Emit events
  emit('teams-configured', teams.value)
  emit('start-quiz')
}

const clearError = () => {
  quizStore.clearError()
}

// Lifecycle
onMounted(() => {
  // Try to load teams from storage
  quizStore.loadTeamsFromStorage()
  
  // Set user mode to host
  quizStore.setUserMode('host')
})
</script>

<style scoped>
.team-setup {
  max-width: 1024px;
  margin: 0 auto;
  padding: 2rem;
}

.team-input {
  min-height: 50px;
  font-size: 16px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}

.color-option.active {
  border-color: var(--vp-c-brand-1);
  transform: scale(1.1);
  box-shadow: 0 0 0 3px rgba(52, 81, 178, 0.2);
}

.color-option:hover {
  transform: scale(1.05);
}

.teams-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.virtual-team-card {
  height: 100px;
}

/* Animations */
.team-list-enter-active,
.team-list-leave-active {
  transition: all 0.3s ease;
}

.team-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.team-list-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.team-list-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .team-setup {
    padding: 1rem;
  }
  
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .color-picker {
    justify-content: center;
    gap: 1rem;
  }
  
  .color-option {
    width: 48px;
    height: 48px;
  }
  
  .action-section .flex {
    flex-direction: column;
    gap: 1rem;
  }
  
  .virtual-teams-container {
    height: 320px;
  }
  
  .team-card {
    min-height: 80px;
  }
  
  .team-content {
    padding: 1rem;
  }
  
  .modal-content {
    margin: 1rem;
    max-width: calc(100vw - 32px);
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .team-list-enter-active,
  .team-list-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .team-list-enter-from,
  .team-list-leave-to {
    transform: none;
  }
  
  .color-option {
    transition: none;
  }
  
  .team-card {
    transition: none;
  }
}

/* Focus management for accessibility */
.color-option:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
</style>