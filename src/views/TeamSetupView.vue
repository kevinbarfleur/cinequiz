<template>
  <div class="min-h-screen bg-gradient-to-br from-bg to-bg-soft relative">
    <!-- Header Section -->
    <div class="bg-bg border-b border-divider p-4 sticky top-0 z-100 shadow-sm">
      <div class="container-app flex-between gap-4">
        <button 
          @click="goBack" 
          class="btn-alt btn-md flex items-center gap-2"
          aria-label="Retour à l'accueil"
        >
          <span class="text-lg font-bold">←</span>
          <span>Retour</span>
        </button>
        
        <div class="flex-1">
          <h1 class="heading-2 mb-1">Configuration des Équipes</h1>
          <p class="small-text m-0">
            Créez vos équipes avant de commencer le quiz
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="py-8 mobile:py-6">
      <div class="container-app">
        <!-- Team Setup Component -->
        <div class="mb-8">
          <TeamSetup 
            @teams-configured="onTeamsConfigured"
            @start-quiz="onStartQuiz"
          />
        </div>

        <!-- Action Buttons -->
        <div class="mt-12 text-center" v-if="hasTeams"> 
          <p class="text-red-1 small-text font-medium mt-2" v-if="validationError">
            {{ validationError }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-white/90 flex items-center justify-center z-1000">
      <div class="text-center">
        <div class="w-12 h-12 border-3 border-divider border-t-brand-1 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-base text-text-2 font-medium">Préparation du quiz...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import TeamSetup from '@/components/quiz/TeamSetup.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

const router = useRouter()
const quizStore = useQuizStore()

const isLoading = ref(false)
const validationError = ref('')

// Computed properties
const hasTeams = computed(() => quizStore.state.teams.length > 0)

const canStartQuiz = computed(() => {
  return hasTeams.value && quizStore.validateTeamConfiguration()
})

// Event handlers
const onTeamsConfigured = () => {
  validationError.value = ''
  // Teams have been configured, enable start button
}

const onStartQuiz = () => {
  startQuiz()
}

const goBack = () => {
  // Clear any validation errors
  validationError.value = ''
  
  // Navigate back to home
  router.push('/')
}

const startQuiz = async () => {
  try {
    isLoading.value = true
    validationError.value = ''

    // Validate team configuration
    if (!quizStore.validateTeamConfiguration()) {
      validationError.value = quizStore.state.error || 'Configuration des équipes invalide'
      return
    }

    // Load questions if not already loaded
    if (quizStore.state.questions.length === 0) {
      await quizStore.loadQuestionsWithCache()
    }

    // Check if questions were loaded successfully
    if (quizStore.state.questions.length === 0) {
      validationError.value = 'Impossible de charger les questions du quiz'
      return
    }

    // Save teams to storage for persistence
    quizStore.saveTeamsToStorage()
    quizStore.saveLastUsedTeams()

    // Reset quiz state and start
    quizStore.resetQuiz()
    quizStore.startQuiz()

    // Navigate to quiz with smooth transition
    await router.push('/quiz')

  } catch (error) {
    console.error('Erreur lors du démarrage du quiz:', error)
    validationError.value = 'Une erreur est survenue lors du démarrage du quiz'
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Ensure we're in host mode
  if (quizStore.state.userMode !== 'host') {
    quizStore.setUserMode('host')
  }

  // Load last used teams if available
  const lastUsedTeams = quizStore.loadLastUsedTeams()
  if (lastUsedTeams.length > 0 && quizStore.state.teams.length === 0) {
    // Optionally restore last used teams
    // This could be enhanced with a user prompt
  }

  // Check for interrupted session
  if (quizStore.hasInterruptedSession()) {
    // Could show a dialog to restore the session
    // For now, we'll clear it to start fresh
    quizStore.clearInterruptedSession()
  }
})
</script>

<style scoped>
/* Minimal custom styles - most styling is now handled by UnoCSS utilities */
</style>