<template>
  <div class="min-h-screen bg-bg">
    <!-- Loading State -->
    <div v-if="quizStore.state.isLoading" class="min-h-screen flex-center p-4">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-brand-1/20 border-t-brand-1 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 class="heading-3 mb-2">Chargement du quiz...</h2>
        <p class="text-muted">Préparation des questions cinéma</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="quizStore.state.error" class="min-h-screen flex-center p-4">
      <BaseCard variant="elevated" padding="lg" class="text-center max-w-md mx-auto">
        <div class="text-4xl mb-4">⚠️</div>
        <h2 class="heading-3 mb-2">Oups ! Une erreur s'est produite</h2>
        <p class="text-muted mb-6">{{ quizStore.state.error }}</p>
        <div class="space-y-3">
          <BaseButton variant="primary" @click="retryLoadQuestions">
            Réessayer
          </BaseButton>
          <BaseButton variant="outline" @click="goHome">
            Retour à l'accueil
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- Quiz Content -->
    <div v-else-if="!quizStore.state.isCompleted" class="min-h-screen">
      <!-- Quiz Header -->
      <div class="bg-bg shadow-sm border-b border-divider sticky top-0 z-20">
        <div class="container-app flex-between">
          <div>
            <h1 class="heading-3">Quiz Cinéma</h1>
            <p class="small-text">
              {{ isHostMode ? 'Mode Animateur' : 'Mode Participant' }}
              {{ isHostMode && hasTeams ? `• ${quizStore.state.teams.length} équipe(s)` : '' }}
            </p>
          </div>
          
          <!-- Quiz Controls -->
          <div class="flex items-center gap-3">            
            <BaseButton
              variant="ghost"
              size="sm"
              @click="showQuitDialog = true"
              class="text-muted hover:text-red-1 transition-colors"
            >
              <div class="i-carbon-close text-sm mr-2"></div>
              Quitter
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Host Mode - Team Status Bar -->
      <div v-if="isHostMode && hasTeams" class="bg-bg border-b border-divider py-3">
        <div class="container-app flex-between flex-wrap gap-3">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="small-text font-medium text-muted">Équipes assignées:</span>
            <div class="flex items-center gap-2 flex-wrap">
              <span 
                v-for="team in quizStore.state.teams" 
                :key="team.id"
                class="px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200"
                :class="isTeamAssignedToCurrentQuestion(team.id) ? 'bg-green-soft text-green-1 border-green-1/30' : 'bg-bg-soft text-subtle border-divider'"
              >
                {{ team.name }}
              </span>
            </div>
          </div>
          
          <div v-if="!quizStore.canProceedToNextQuestion" class="flex items-center gap-2 small-text">
            <span class="text-yellow-1">⏳</span>
            <span class="text-muted font-medium">Assignez toutes les équipes pour continuer</span>
          </div>
        </div>
      </div>

      <!-- Question Card -->
      <div class="container-app px-4 py-8">
        <QuestionCard
          v-if="quizStore.currentQuestion"
          :key="quizStore.currentQuestion.id"
          :question="quizStore.currentQuestion"
          :question-number="quizStore.state.currentQuestionIndex + 1"
          :total-questions="quizStore.state.questions.length"
          :user-mode="quizStore.state.userMode"
          :teams="quizStore.state.teams"
          :team-assignments="currentQuestionAssignments"
          :auto-reveal="!isHostMode"
          :reveal-delay="isHostMode ? 0 : 1200"
          :has-previous="quizStore.hasPreviousQuestion"
          :has-next="quizStore.hasNextQuestion"
          @answer="handleAnswer"
          @next="handleNextParticipant"
          @previous="handlePrevious"
          @team-answer-assigned="handleTeamAnswerAssigned"
          @team-assignment-requested="handleTeamAssignmentRequested"
          ref="questionCardRef"
        />
      </div>


    </div>

    <!-- Quiz Completed - Redirect to Results -->
    <div v-else class="min-h-screen flex-center p-4">
      <div class="text-center">
        <div class="text-4xl mb-4">
          <div class="i-carbon-trophy text-current"></div>
        </div>
        <h2 class="heading-3 mb-2">Quiz terminé !</h2>
        <p class="text-muted mb-4">Redirection vers les résultats...</p>
        <div class="w-6 h-6 border-2 border-brand-1/20 border-t-brand-1 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>

    <!-- Quit Confirmation Dialog -->
    <div v-if="showQuitDialog" class="fixed inset-0 bg-black/50 flex-center p-4 z-50 backdrop-blur-sm" @click="showQuitDialog = false">
      <div class="w-full max-w-lg mx-auto animate-dialog-slide-in" @click.stop>
        <BaseCard variant="elevated" padding="lg">
          <div class="text-center mb-6">
            <h3 class="heading-3 mb-2">Quitter le quiz ?</h3>
            <p class="text-muted">
              Vous allez revenir à l'accueil. Continuer ?
            </p>
          </div>
          
          <div class="flex gap-3 flex-col sm:flex-row">
            <BaseButton
              variant="outline"
              size="sm"
              @click="showQuitDialog = false"
              class="w-full sm:flex-1 sm:min-w-0"
            >
              Annuler
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              @click="confirmQuit"
              class="w-full sm:flex-1 sm:min-w-0"
            >
              Quitter
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Restart Confirmation Dialog -->
    <div v-if="showRestartDialog" class="fixed inset-0 bg-black/50 flex-center p-4 z-50 backdrop-blur-sm" @click="showRestartDialog = false">
      <div class="w-full max-w-md mx-auto animate-dialog-slide-in" @click.stop>
        <BaseCard variant="elevated" padding="lg">
          <div class="text-center mb-6">
            <h3 class="heading-3 mb-2">Recommencer le quiz ?</h3>
            <p class="text-muted">
              Votre progression actuelle sera perdue. Voulez-vous vraiment recommencer ?
            </p>
          </div>
          
          <div class="flex gap-3 mobile:flex-col">
            <BaseButton
              variant="outline"
              @click="showRestartDialog = false"
              class="flex-1"
            >
              Annuler
            </BaseButton>
            <BaseButton
              variant="primary"
              @click="confirmRestart"
              class="flex-1"
            >
              Oui, recommencer
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Team Assignment Modal -->
    <TeamAssignmentModal
      v-if="showTeamAssignmentModal"
      :is-visible="showTeamAssignmentModal"
      :teams="quizStore.state.teams"
      :existing-assignments="currentQuestionAssignments"
      :selected-answer-index="selectedAnswerIndex"
      :selected-answer="selectedAnswer"
      :current-question-id="quizStore.currentQuestion?.id || ''"
      :all-answers="quizStore.currentQuestion?.answers || []"
      @team-selected="handleTeamSelected"
      @modal-closed="handleTeamAssignmentModalClosed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import QuestionCard from '@/components/quiz/QuestionCard.vue'
import QuestionNavigation from '@/components/quiz/QuestionNavigation.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TeamAssignmentModal from '@/components/quiz/TeamAssignmentModal.vue'

const router = useRouter()
const quizStore = useQuizStore()

// Component state
const showQuitDialog = ref(false)
const showRestartDialog = ref(false)
const questionCardRef = ref<InstanceType<typeof QuestionCard> | null>(null)
const isTransitioning = ref(false)

// Team assignment modal state
const showTeamAssignmentModal = ref(false)
const selectedAnswerIndex = ref<number>(-1)
const selectedAnswer = ref<string>('')

// Computed properties for mode handling
const isHostMode = computed(() => quizStore.state.userMode === 'host')
const hasTeams = computed(() => quizStore.state.teams.length > 0)

// Helper method to check if team is assigned to current question
const isTeamAssignedToCurrentQuestion = (teamId: string) => {
  if (!quizStore.currentQuestion) return false
  
  return quizStore.state.teamAnswers.some(
    answer => answer.questionId === quizStore.currentQuestion!.id && answer.teamId === teamId
  )
}

// Methods
const handleAnswer = (answerIndex: number, isCorrect: boolean) => {
  if (isHostMode.value) {
    // In host mode, answers are handled through team assignment
    return
  }
  // Note: Participant mode doesn't use this since answer buttons are disabled
}

const handleTeamAnswerAssigned = (data: { questionId: string, answerIndex: number, teamId: string }) => {
  if (isHostMode.value) {
    quizStore.assignAnswerToTeam(data.questionId, data.answerIndex, data.teamId)
    
    // Auto-save session for host mode
    quizStore.autoSaveSession()
  }
}

// Team assignment modal handlers
const handleTeamAssignmentRequested = (answerIndex: number) => {
  if (!isHostMode.value || !quizStore.currentQuestion) return
  
  selectedAnswerIndex.value = answerIndex
  selectedAnswer.value = quizStore.currentQuestion.answers[answerIndex]
  showTeamAssignmentModal.value = true
}

const handleTeamSelected = (teamId: string, answerIndex: number) => {
  if (!quizStore.currentQuestion) return
  
  // Assign the team to the selected answer
  const success = quizStore.assignAnswerToTeam(
    quizStore.currentQuestion.id, 
    answerIndex, 
    teamId
  )
  
  if (success) {
    // Auto-save session for host mode
    quizStore.autoSaveSession()
    
    // Close the modal
    showTeamAssignmentModal.value = false
    selectedAnswerIndex.value = -1
    selectedAnswer.value = ''
  }
}

const handleTeamAssignmentModalClosed = () => {
  showTeamAssignmentModal.value = false
  selectedAnswerIndex.value = -1
  selectedAnswer.value = ''
}

// Computed property for available teams (not yet assigned to current question)
const availableTeams = computed(() => {
  // Return all teams - the modal will handle filtering available vs assigned teams
  return quizStore.state.teams
})

// Computed property for existing assignments map
const currentQuestionAssignments = computed(() => {
  if (!quizStore.currentQuestion) return new Map()
  
  const assignments = new Map<number, string[]>()
  
  quizStore.state.teamAnswers
    .filter(answer => answer.questionId === quizStore.currentQuestion!.id)
    .forEach(answer => {
      const teamIds = assignments.get(answer.answerIndex) || []
      teamIds.push(answer.teamId)
      assignments.set(answer.answerIndex, teamIds)
    })
  
  return assignments
})

const handleNext = async () => {
  if (isTransitioning.value) return
  
  isTransitioning.value = true
  
  try {
    if (isHostMode.value) {
      // In host mode, use proceedToNextQuestion which validates team assignments
      const canProceed = quizStore.proceedToNextQuestion()
      
      if (!canProceed && !quizStore.state.isCompleted) {
        // Show validation error
        return
      }
    }
    
    // Check if quiz is completed
    if (quizStore.state.isCompleted) {
      // Redirect to results with a smooth transition
      await nextTick()
      setTimeout(() => {
        if (isHostMode.value) {
          router.push('/team-results')
        } else {
          router.push('/results')
        }
      }, 1000)
    } else {
      // Continue to next question
      await nextTick()
    }
  } finally {
    setTimeout(() => {
      isTransitioning.value = false
    }, 500)
  }
}

// Participant mode navigation methods
const handlePrevious = () => {
  if (!isHostMode.value && quizStore.hasPreviousQuestion) {
    quizStore.goToPreviousQuestion()
  }
}

const handleNextParticipant = () => {
  if (!isHostMode.value && quizStore.hasNextQuestion) {
    quizStore.goToNextQuestion()
  }
}

const handleGoToQuestion = (questionIndex: number) => {
  if (!isHostMode.value) {
    quizStore.goToQuestion(questionIndex)
  }
}

const retryLoadQuestions = async () => {
  quizStore.clearError()
  await quizStore.loadQuestionsWithCache()
  
  if (!quizStore.state.error && quizStore.state.questions.length > 0) {
    quizStore.startQuiz()
  }
}

const goHome = () => {
  router.push('/')
}

const confirmQuit = () => {
  showQuitDialog.value = false
  router.push('/')
  // Reset to first question instead of going home
  quizStore.state.currentQuestionIndex = 0
}

const showRestartConfirmation = () => {
  showRestartDialog.value = true
}

const confirmRestart = () => {
  showRestartDialog.value = false
  quizStore.resetQuiz()
  quizStore.startQuiz()
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // ESC to show quit dialog
  if (event.key === 'Escape' && !showQuitDialog.value && !showRestartDialog.value) {
    showQuitDialog.value = true
  }
  
  // R to restart (Ctrl+R or Cmd+R)
  if ((event.ctrlKey || event.metaKey) && event.key === 'r' && !event.shiftKey) {
    event.preventDefault()
    showRestartConfirmation()
  }
}

// Lifecycle
onMounted(async () => {
  // Add keyboard event listeners
  window.addEventListener('keydown', handleKeydown)
  
  // Load questions if not already loaded
  if (quizStore.state.questions.length === 0) {
    await quizStore.loadQuestionsWithCache()
  }
  
  // Start quiz if questions are loaded and quiz hasn't started
  if (quizStore.state.questions.length > 0 && !quizStore.isQuizStarted) {
    quizStore.startQuiz()
  }
  
  // If quiz is already completed, redirect to results
  if (quizStore.state.isCompleted) {
    router.push('/results')
  }
})

onUnmounted(() => {
  // Remove keyboard event listeners
  window.removeEventListener('keydown', handleKeydown)
})

// Prevent accidental page refresh
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (quizStore.isQuizStarted && !quizStore.state.isCompleted) {
    event.preventDefault()
    event.returnValue = 'Votre progression sera perdue si vous quittez maintenant.'
    return event.returnValue
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
/* Custom animations that can't be easily replaced with UnoCSS utilities */
@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-dialog-slide-in {
  animation: dialogSlideIn 0.3s ease-out;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .animate-dialog-slide-in {
    animation: none;
  }
}
</style>