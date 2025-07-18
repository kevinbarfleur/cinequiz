<template>
  <div class="min-h-screen bg-gradient-to-br from-bg to-bg-soft relative">
    <!-- Header Section -->
    <div class="rainbow-bg text-white py-8 relative overflow-hidden">
      <div class="absolute inset-0 opacity-30" style="background: url('data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;><defs><pattern id=&quot;grain&quot; width=&quot;100&quot; height=&quot;100&quot; patternUnits=&quot;userSpaceOnUse&quot;><circle cx=&quot;25&quot; cy=&quot;25&quot; r=&quot;1&quot; fill=&quot;white&quot; opacity=&quot;0.1&quot;/><circle cx=&quot;75&quot; cy=&quot;75&quot; r=&quot;1&quot; fill=&quot;white&quot; opacity=&quot;0.1&quot;/><circle cx=&quot;50&quot; cy=&quot;10&quot; r=&quot;0.5&quot; fill=&quot;white&quot; opacity=&quot;0.1&quot;/></pattern></defs><rect width=&quot;100&quot; height=&quot;100&quot; fill=&quot;url(%23grain)&quot;/></svg>')"></div>
      <div class="container-app flex-between relative z-10 mobile:flex-col mobile:text-center mobile:gap-6">
        <div class="flex-1">
          <h1 class="text-3xl mobile:text-2xl lg:text-5xl font-bold mb-2 text-shadow-sm flex items-center gap-3">
            <div class="i-carbon-trophy text-current"></div>
            Résultats du Quiz
          </h1>
          <p class="text-base mobile:text-base lg:text-xl opacity-90 m-0">
            Quiz terminé ! Découvrez les performances de chaque équipe
          </p>
        </div>
        
        <div class="flex gap-8 mobile:gap-6">
          <div class="text-center">
            <span class="block text-2xl font-bold leading-none">{{ quizStore.state.teams.length }}</span>
            <span class="block small-text opacity-80 mt-1">Équipes</span>
          </div>
          <div class="text-center">
            <span class="block text-2xl font-bold leading-none">{{ quizStore.state.questions.length }}</span>
            <span class="block small-text opacity-80 mt-1">Questions</span>
          </div>
          <div class="text-center">
            <span class="block text-2xl font-bold leading-none">{{ formatDuration(quizDuration) }}</span>
            <span class="block small-text opacity-80 mt-1">Durée</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Content -->
    <div class="py-12 mobile:py-8 opacity-0 translate-y-5 transition-all duration-600 ease-out" :class="{ 'opacity-100 translate-y-0': isLoaded }">
      <div class="container-app">
        <!-- Team Results Display Component -->
        <div class="mb-12">
          <TeamResultsDisplay
            :teams="quizStore.state.teams"
            :questions="quizStore.state.questions"
            :team-answers="quizStore.state.teamAnswers"
            @restart="handleRestart"
            @home="handleGoHome"
          />
        </div>

        <!-- Action Buttons -->
        <div class="text-center opacity-0 translate-y-8 transition-all duration-800 ease-out" :class="{ 'opacity-100 translate-y-0': isLoaded }">
          <div class="flex gap-4 justify-center mb-8 flex-wrap mobile:flex-col mobile:items-center">
            <BaseButton
              variant="outline"
              size="lg"
              @click="handleGoHome"
              class="btn-lg hover:-translate-y-0.5 mobile:w-full mobile:max-w-75"
            >
              <span class="flex items-center gap-2">
                <div class="i-carbon-home text-lg"></div>
                <span>Retour à l'accueil</span>
              </span>
            </BaseButton>

            <BaseButton
              variant="secondary"
              size="lg"
              @click="handleNewQuiz"
              class="btn-lg bg-brand-2 text-white shadow-lg shadow-brand-2/30 hover:bg-purple-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-2/40 mobile:w-full mobile:max-w-75"
            >
              <span class="flex items-center gap-2">
                <div class="i-carbon-restart text-lg"></div>
                <span>Nouveau Quiz</span>
              </span>
            </BaseButton>

            <BaseButton
              variant="primary"
              size="lg"
              @click="handleRestart"
              class="btn-lg rainbow-bg shadow-lg shadow-brand-1/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-1/40 mobile:w-full mobile:max-w-75"
            >
              <span class="flex items-center gap-2">
                <span class="text-lg">🚀</span>
                <span>Recommencer</span>
              </span>
            </BaseButton>
          </div>

          <!-- Export Options (Optional) -->
          <div class="mt-8 pt-8 border-t border-divider" v-if="canExport">
            <h3 class="heading-3 mb-4">Exporter les résultats</h3>
            <div class="flex gap-3 justify-center flex-wrap mobile:flex-col mobile:items-center">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="exportAsText"
                class="mobile:w-full mobile:max-w-50"
              >
                <span class="flex items-center gap-2">
                  <span class="text-base">📄</span>
                  <span>Texte</span>
                </span>
              </BaseButton>

              <BaseButton
                variant="ghost"
                size="sm"
                @click="exportAsJSON"
                class="mobile:w-full mobile:max-w-50"
              >
                <span class="flex items-center gap-2">
                  <span class="text-base">💾</span>
                  <span>JSON</span>
                </span>
              </BaseButton>

              <BaseButton
                variant="ghost"
                size="sm"
                @click="shareResults"
                class="mobile:w-full mobile:max-w-50"
                v-if="canShare"
              >
                <span class="flex items-center gap-2">
                  <div class="i-carbon-share text-base"></div>
                  <span>Partager</span>
                </span>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Celebration Animation -->
    <div v-if="showCelebration" class="fixed inset-0 bg-white/95 flex-center z-1000 animate-celebration-fade-in">
      <div class="text-center animate-celebration-bounce">
        <div class="text-6xl mb-4 animate-celebration-spin">
          <div class="i-carbon-trophy text-current"></div>
        </div>
        <h2 class="heading-2 text-brand-1 mb-2">Félicitations !</h2>
        <p class="text-lg text-muted">Quiz terminé avec succès</p>
      </div>
    </div>

    <!-- Restart Confirmation Dialog -->
    <div v-if="showRestartDialog" class="fixed inset-0 bg-black/50 flex-center p-4 z-1000 backdrop-blur-sm" @click="showRestartDialog = false">
      <div class="w-full max-w-md mx-auto animate-dialog-slide-in" @click.stop>
        <BaseCard variant="elevated" padding="lg">
          <div class="text-center mb-6">
            <h3 class="heading-3 mb-2">Recommencer le quiz ?</h3>
            <p class="text-muted leading-relaxed">
              Un nouveau quiz sera lancé avec les mêmes équipes. Les résultats actuels seront perdus.
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import TeamResultsDisplay from '@/components/quiz/TeamResultsDisplay.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

const router = useRouter()
const quizStore = useQuizStore()

// Component state
const isLoaded = ref(false)
const showCelebration = ref(false)
const showRestartDialog = ref(false)

// Computed properties
const quizDuration = computed(() => {
  if (!quizStore.state.startTime || !quizStore.state.endTime) return 0
  return Math.round((quizStore.state.endTime.getTime() - quizStore.state.startTime.getTime()) / 1000)
})

const canExport = computed(() => {
  return quizStore.state.teams.length > 0 && quizStore.state.questions.length > 0
})

const canShare = computed(() => {
  return 'share' in navigator && canExport.value
})

// Helper methods
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Event handlers
const handleRestart = () => {
  showRestartDialog.value = true
}

const confirmRestart = async () => {
  showRestartDialog.value = false
  
  try {
    // Reset quiz state but keep teams
    quizStore.resetQuiz()
    
    // Start new quiz
    quizStore.startQuiz()
    
    // Navigate back to quiz
    await router.push('/quiz')
  } catch (error) {
    console.error('Erreur lors du redémarrage:', error)
  }
}

const handleNewQuiz = async () => {
  try {
    // Navigate to team setup to configure new teams
    await router.push('/team-setup')
  } catch (error) {
    console.error('Erreur lors de la navigation:', error)
  }
}

const handleGoHome = async () => {
  try {
    // Clear quiz state and navigate home
    quizStore.resetQuiz()
    await router.push('/')
  } catch (error) {
    console.error('Erreur lors de la navigation:', error)
  }
}

// Export methods
const exportAsText = () => {
  try {
    const results = generateTextResults()
    downloadFile(results, 'quiz-results.txt', 'text/plain')
  } catch (error) {
    console.error('Erreur lors de l\'export texte:', error)
  }
}

const exportAsJSON = () => {
  try {
    const results = generateJSONResults()
    downloadFile(JSON.stringify(results, null, 2), 'quiz-results.json', 'application/json')
  } catch (error) {
    console.error('Erreur lors de l\'export JSON:', error)
  }
}

const shareResults = async () => {
  if (!canShare.value) return
  
  try {
    const results = generateTextResults()
    await navigator.share({
      title: 'Résultats du Quiz Cinéma',
      text: results
    })
  } catch (error) {
    console.error('Erreur lors du partage:', error)
  }
}

// Helper methods for export
const generateTextResults = (): string => {
  const rankings = quizStore.teamRankings
  let results = 'RÉSULTATS DU QUIZ CINÉMA\n'
  results += '========================\n\n'
  
  results += `Durée: ${formatDuration(quizDuration.value)}\n`
  results += `Questions: ${quizStore.state.questions.length}\n`
  results += `Équipes: ${quizStore.state.teams.length}\n\n`
  
  results += 'CLASSEMENT:\n'
  results += '-----------\n'
  
  rankings.forEach((team, index) => {
    const percentage = Math.round((team.score / quizStore.state.questions.length) * 100)
    results += `${index + 1}. ${team.name}: ${team.score}/${quizStore.state.questions.length} (${percentage}%)\n`
  })
  
  return results
}

const generateJSONResults = () => {
  return {
    quiz: {
      duration: quizDuration.value,
      totalQuestions: quizStore.state.questions.length,
      completedAt: quizStore.state.endTime?.toISOString(),
      startedAt: quizStore.state.startTime.toISOString()
    },
    teams: quizStore.teamRankings.map(team => ({
      name: team.name,
      score: team.score,
      rank: team.rank,
      percentage: Math.round((team.score / quizStore.state.questions.length) * 100)
    })),
    questions: quizStore.questionResults
  }
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
  // Check if we have valid results to display
  if (!quizStore.state.isCompleted || quizStore.state.teams.length === 0) {
    // Redirect to home if no valid results
    await router.push('/')
    return
  }
  
  // Show celebration animation
  showCelebration.value = true
  setTimeout(() => {
    showCelebration.value = false
  }, 3000)
  
  // Trigger entrance animations
  await nextTick()
  setTimeout(() => {
    isLoaded.value = true
  }, 500)
  
  // Save results to storage
  if (quizStore.isLocalStorageAvailable) {
    quizStore.saveCurrentSession()
  }
})
</script>

<style scoped>
/* Custom animations that can't be easily replaced with UnoCSS utilities */
@keyframes celebrationFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes celebrationBounce {
  0% { transform: scale(0.3) translateY(50px); opacity: 0; }
  50% { transform: scale(1.1) translateY(-10px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}

@keyframes celebrationSpin {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-10deg) scale(1.1); }
  75% { transform: rotate(10deg) scale(1.1); }
}

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

.animate-celebration-fade-in {
  animation: celebrationFadeIn 0.5s ease-out;
}

.animate-celebration-bounce {
  animation: celebrationBounce 0.8s ease-out;
}

.animate-celebration-spin {
  animation: celebrationSpin 2s ease-in-out infinite;
}

.animate-dialog-slide-in {
  animation: dialogSlideIn 0.3s ease-out;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .animate-celebration-fade-in,
  .animate-celebration-bounce,
  .animate-celebration-spin,
  .animate-dialog-slide-in {
    animation: none;
  }
}
</style>