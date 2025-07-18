<template>
  <div class="results-view">
    <!-- No Quiz Data State -->
    <div v-if="!hasQuizData" class="no-data-container">
      <BaseCard variant="elevated" padding="lg" class="no-data-content">
        <div class="no-data-icon text-text-2">
          <div class="i-carbon-help text-4xl"></div>
        </div>
        <h2 class="no-data-title">Aucun résultat à afficher</h2>
        <p class="no-data-message">
          Il semble que vous n'ayez pas encore terminé de quiz. 
          Commencez un quiz pour voir vos résultats ici !
        </p>
        <div class="no-data-actions">
          <BaseButton variant="primary" size="lg" @click="startNewQuiz">
            <span class="flex items-center gap-2">
              <div class="i-carbon-video"></div>
              <span>Commencer un Quiz</span>
            </span>
          </BaseButton>
          <BaseButton variant="outline" size="lg" @click="goHome">
            <span class="flex items-center gap-2">
              <div class="i-carbon-home"></div>
              <span>Retour à l'accueil</span>
            </span>
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- Results Content -->
    <div v-else class="results-content">
      <!-- Main Score Display -->
      <div class="score-section">
        <ScoreDisplay
          :score="quizStore.state.score"
          :total-questions="quizStore.state.questions.length"
          :stats="quizStore.quizStats"
          :is-new-best-score="quizStore.isNewBestScore"
          @restart="handleRestart"
          @home="goHome"
        />
      </div>

      <!-- Detailed Statistics Section -->
      <div class="detailed-stats-section">
        <BaseCard variant="elevated" padding="lg" class="stats-card">
          <h3 class="stats-title flex items-center justify-center gap-2">
            <div class="i-carbon-analytics text-xl text-brand-1"></div>
            <span>Statistiques détaillées</span>
          </h3>
          
          <div class="stats-grid">
            <!-- Performance Stats -->
            <div class="stat-group">
              <h4 class="stat-group-title">Performance</h4>
              <div class="stat-items">
                <div class="stat-item">
                  <div class="stat-icon text-brand-1">
                    <div class="i-carbon-target text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ quizStore.quizStats.scorePercentage }}%</div>
                    <div class="stat-label">Score final</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon text-green-1">
                    <div class="i-carbon-checkmark text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ quizStore.quizStats.correctAnswers }}</div>
                    <div class="stat-label">Bonnes réponses</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon text-red-1">
                    <div class="i-carbon-close text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ quizStore.quizStats.incorrectAnswers }}</div>
                    <div class="stat-label">Erreurs</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Time Stats -->
            <div class="stat-group">
              <h4 class="stat-group-title">Temps</h4>
              <div class="stat-items">
                <div class="stat-item">
                  <div class="stat-icon text-yellow-1">
                    <div class="i-carbon-time text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ formatTime(quizStore.quizStats.timeSpent) }}</div>
                    <div class="stat-label">Temps total</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon text-purple-1">
                    <div class="i-carbon-flash text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ formatTime(Math.round(quizStore.quizStats.averageTimePerQuestion)) }}</div>
                    <div class="stat-label">Temps moyen/question</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Historical Stats (if available) -->
            <div v-if="quizStore.isLocalStorageAvailable" class="stat-group">
              <h4 class="stat-group-title">Historique</h4>
              <div class="stat-items">
                <div class="stat-item">
                  <div class="stat-icon text-brand-1">
                    <div class="i-carbon-trophy text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ quizStore.bestScore }}%</div>
                    <div class="stat-label">Meilleur score</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon text-brand-2">
                    <div class="i-carbon-game-console text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ quizStore.totalGamesPlayed }}</div>
                    <div class="stat-label">Quiz joués</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-icon text-green-1">
                    <div class="i-carbon-chart-line text-2xl"></div>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ Math.round(quizStore.averageScore) }}%</div>
                    <div class="stat-label">Score moyen</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Question Review Section -->
      <div class="question-review-section">
        <BaseCard variant="elevated" padding="lg" class="review-card">
          <div class="review-header">
            <h3 class="review-title flex items-center gap-2">
              <div class="i-carbon-document text-xl text-brand-1"></div>
              <span>Révision des questions</span>
            </h3>
            <BaseButton
              variant="ghost"
              size="sm"
              @click="toggleReviewExpanded"
              class="toggle-button"
            >
              {{ isReviewExpanded ? '▼ Réduire' : '▶ Développer' }}
            </BaseButton>
          </div>
          
          <div v-if="isReviewExpanded" class="review-content">
            <div
              v-for="(question, index) in quizStore.state.questions"
              :key="question.id"
              class="question-review-item"
            >
              <div class="question-header">
                <div class="question-number">Q{{ index + 1 }}</div>
                <div class="question-result">
                  <span v-if="isAnswerCorrect(index)" class="result-correct">
                    <div class="i-carbon-checkmark text-green-1"></div>
                  </span>
                  <span v-else class="result-incorrect">
                    <div class="i-carbon-close text-red-1"></div>
                  </span>
                </div>
              </div>
              
              <div class="question-content">
                <h4 class="question-text">{{ question.question }}</h4>
                
                <div class="answers-review">
                  <div
                    v-for="(answer, answerIndex) in question.answers"
                    :key="answerIndex"
                    :class="getAnswerClasses(index, answerIndex, question.correctAnswer)"
                  >
                    {{ answer }}
                  </div>
                </div>
                
                <div v-if="question.explanation" class="question-explanation">
                  <strong class="flex items-center gap-1">
                    <div class="i-carbon-idea text-yellow-1"></div>
                    <span>Explication :</span>
                  </strong> 
                  {{ question.explanation }}
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons-section">
        <div class="action-buttons">
          <BaseButton
            variant="primary"
            size="lg"
            @click="handleRestart"
            class="action-button"
          >
            <span class="flex items-center gap-2">
              <div class="i-carbon-restart"></div>
              <span>Rejouer</span>
            </span>
          </BaseButton>
          
          <BaseButton
            variant="secondary"
            size="lg"
            @click="shareResults"
            class="action-button"
            v-if="canShare"
          >
            <div class="i-carbon-share text-sm mr-2"></div>
            Partager
          </BaseButton>
          
          <BaseButton
            variant="outline"
            size="lg"
            @click="goHome"
            class="action-button"
          >
            <div class="i-carbon-home text-sm mr-2"></div>
            Accueil
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <div v-if="showShareModal" class="share-modal-overlay" @click="showShareModal = false">
      <div class="share-modal-content" @click.stop>
        <BaseCard variant="elevated" padding="lg">
          <div class="share-header">
            <h3 class="share-title flex items-center gap-2">
              <div class="i-carbon-share text-lg"></div>
              Partager mes résultats
            </h3>
            <button @click="showShareModal = false" class="close-button">
              <div class="i-carbon-close text-lg"></div>
            </button>
          </div>
          
          <div class="share-content">
            <div class="share-preview">
              <p class="share-text">{{ shareText }}</p>
            </div>
            
            <div class="share-actions">
              <BaseButton
                variant="primary"
                @click="copyToClipboard"
                class="share-action-button"
              >
                <div class="i-carbon-copy text-sm mr-2"></div>
                Copier le texte
              </BaseButton>
              
              <BaseButton
                v-if="canNativeShare"
                variant="secondary"
                @click="nativeShare"
                class="share-action-button"
              >
                <div class="i-carbon-share text-sm mr-2"></div>
                Partager
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import ScoreDisplay from '@/components/quiz/ScoreDisplay.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const quizStore = useQuizStore()

// Component state
const isReviewExpanded = ref(false)
const showShareModal = ref(false)

// Computed properties
const hasQuizData = computed(() => 
  quizStore.state.questions.length > 0 && 
  quizStore.state.isCompleted &&
  quizStore.state.answers.length > 0
)

const canShare = computed(() => 
  typeof navigator !== 'undefined' && 
  (navigator.share || navigator.clipboard)
)

const canNativeShare = computed(() => 
  typeof navigator !== 'undefined' && 
  navigator.share
)

const shareText = computed(() => {
  const score = quizStore.quizStats.scorePercentage
  const correct = quizStore.quizStats.correctAnswers
  const total = quizStore.quizStats.totalQuestions
  
  return `Quiz Cinéma terminé ! 
Score: ${score}% (${correct}/${total})
Temps: ${formatTime(quizStore.quizStats.timeSpent)}

Envie de tester vos connaissances cinéma ?`
})

// Methods
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

const isAnswerCorrect = (questionIndex: number): boolean => {
  const userAnswer = quizStore.state.answers[questionIndex]
  const correctAnswer = quizStore.state.questions[questionIndex]?.correctAnswer
  return userAnswer === correctAnswer
}

const getAnswerClasses = (questionIndex: number, answerIndex: number, correctAnswer: number): string => {
  const userAnswer = quizStore.state.answers[questionIndex]
  const baseClasses = 'answer-review-item'
  
  if (answerIndex === correctAnswer) {
    return `${baseClasses} answer-correct`
  } else if (answerIndex === userAnswer && answerIndex !== correctAnswer) {
    return `${baseClasses} answer-incorrect`
  } else {
    return `${baseClasses} answer-neutral`
  }
}

const toggleReviewExpanded = () => {
  isReviewExpanded.value = !isReviewExpanded.value
}

const handleRestart = () => {
  quizStore.resetQuiz()
  router.push('/quiz')
}

const startNewQuiz = () => {
  router.push('/quiz')
}

const goHome = () => {
  router.push('/')
}

const shareResults = () => {
  showShareModal.value = true
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(shareText.value)
    // You could add a toast notification here
    showShareModal.value = false
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const nativeShare = async () => {
  try {
    await navigator.share({
      title: 'Quiz Cinéma - Mes résultats',
      text: shareText.value,
      url: window.location.origin
    })
    showShareModal.value = false
  } catch (error) {
    console.error('Failed to share:', error)
  }
}

// Lifecycle
onMounted(() => {
  // If no quiz data is available, redirect to home after a delay
  if (!hasQuizData.value) {
    setTimeout(() => {
      if (!hasQuizData.value) {
        router.push('/')
      }
    }, 3000)
  }
})
</script>

<style scoped>
.results-view {
  @apply min-h-screen bg-background;
}

/* No Data State */
.no-data-container {
  @apply min-h-screen flex items-center justify-center p-4;
}

.no-data-content {
  @apply text-center max-w-md mx-auto;
}

.no-data-icon {
  @apply text-4xl mb-4;
}

.no-data-title {
  @apply text-xl font-semibold text-text-primary mb-2;
}

.no-data-message {
  @apply text-text-secondary mb-6 leading-relaxed;
}

.no-data-actions {
  @apply space-y-3;
}

/* Results Content */
.results-content {
  @apply container mx-auto px-4 py-8 space-y-8;
}

.score-section {
  @apply animate-fade-in;
}

/* Detailed Statistics */
.detailed-stats-section {
  @apply animate-fade-in-delay;
}

.stats-card {
  @apply max-w-4xl mx-auto;
}

.stats-title {
  @apply text-xl font-semibold text-text-primary mb-6 text-center;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.stat-group {
  @apply space-y-4;
}

.stat-group-title {
  @apply text-lg font-medium text-text-primary border-b border-gray-200 pb-2;
}

.stat-items {
  @apply space-y-3;
}

.stat-item {
  @apply flex items-center gap-3 p-3 bg-background rounded-lg;
}

.stat-icon {
  @apply text-2xl flex-shrink-0;
}

.stat-content {
  @apply flex-1;
}

.stat-value {
  @apply text-lg font-semibold text-text-primary;
}

.stat-label {
  @apply text-sm text-text-secondary;
}

/* Question Review */
.question-review-section {
  @apply animate-fade-in-delay-2;
}

.review-card {
  @apply max-w-4xl mx-auto;
}

.review-header {
  @apply flex items-center justify-between mb-4;
}

.review-title {
  @apply text-xl font-semibold text-text-primary;
}

.toggle-button {
  @apply text-primary hover:text-primary-dark;
}

.review-content {
  @apply space-y-6;
}

.question-review-item {
  @apply border border-gray-200 rounded-lg p-4;
}

.question-header {
  @apply flex items-center justify-between mb-3;
}

.question-number {
  @apply bg-primary text-white px-3 py-1 rounded-full text-sm font-medium;
}

.result-correct {
  @apply text-success text-lg;
}

.result-incorrect {
  @apply text-error text-lg;
}

.question-content {
  @apply space-y-3;
}

.question-text {
  @apply font-medium text-text-primary;
}

.answers-review {
  @apply space-y-2;
}

.answer-review-item {
  @apply px-3 py-2 rounded text-sm;
}

.answer-correct {
  @apply bg-success/10 text-success border border-success/20;
}

.answer-incorrect {
  @apply bg-error/10 text-error border border-error/20;
}

.answer-neutral {
  @apply bg-gray-50 text-text-secondary;
}

.question-explanation {
  @apply bg-primary/5 border-l-4 border-primary p-3 text-sm text-text-secondary;
}

/* Action Buttons */
.action-buttons-section {
  @apply animate-fade-in-delay-3;
}

.action-buttons {
  @apply flex flex-wrap justify-center gap-4 max-w-2xl mx-auto;
}

.action-button {
  @apply flex-1 min-w-[140px];
}

/* Share Modal */
.share-modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50;
  backdrop-filter: blur(4px);
}

.share-modal-content {
  @apply w-full max-w-md mx-auto;
  animation: modalSlideIn 0.3s ease-out;
}

.share-header {
  @apply flex items-center justify-between mb-4;
}

.share-title {
  @apply text-lg font-semibold text-text-primary;
}

.close-button {
  @apply text-text-secondary hover:text-text-primary transition-colors p-1;
}

.share-content {
  @apply space-y-4;
}

.share-preview {
  @apply bg-background rounded-lg p-4 border;
}

.share-text {
  @apply text-sm text-text-secondary whitespace-pre-line;
}

.share-actions {
  @apply flex gap-3;
}

.share-action-button {
  @apply flex-1;
}

/* Animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 0.6s ease-out 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fade-in 0.6s ease-out 0.4s both;
}

.animate-fade-in-delay-3 {
  animation: fade-in 0.6s ease-out 0.6s both;
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .results-content {
    @apply px-3 py-6 space-y-6;
  }
  
  .stats-grid {
    @apply grid-cols-1 gap-4;
  }
  
  .action-buttons {
    @apply flex-col;
  }
  
  .action-button {
    @apply w-full;
  }
  
  .share-actions {
    @apply flex-col;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-fade-in-delay,
  .animate-fade-in-delay-2,
  .animate-fade-in-delay-3 {
    animation: none;
  }
  
  .share-modal-content {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .stat-item,
  .question-review-item {
    @apply border-2 border-text-primary;
  }
  
  .answer-correct,
  .answer-incorrect,
  .answer-neutral {
    @apply border-2;
  }
}
</style>