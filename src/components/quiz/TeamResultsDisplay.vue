<template>
  <div class="max-w-6xl mx-auto p-6 mobile:p-4 space-y-8 mobile:space-y-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-3xl mobile:text-2xl font-bold text-text-1 mb-2 flex items-center justify-center gap-3">
        <div class="i-carbon-trophy text-current"></div>
        Résultats du Quiz
      </h2>
      <p class="text-lg text-text-2">Félicitations à tous les participants !</p>
    </div>

    <!-- Podium/Rankings -->
    <div>
      <h3 class="text-xl font-semibold text-text-1 mb-4">Classement Final</h3>
      
      <div class="flex justify-center gap-4 mb-8 mobile:flex-col mobile:items-center mobile:gap-3">
        <div
          v-for="(team, index) in rankedTeams.slice(0, 3)"
          :key="team.id"
          :class="[
            'bg-bg rounded-lg p-4 shadow-md text-center min-w-150px mobile:min-w-full mobile:max-w-sm',
            index === 0 ? 'order-2 mobile:order-1 transform scale-110 mobile:scale-100 bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-300' :
            index === 1 ? 'order-1 bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-gray-300' :
            'order-3 bg-gradient-to-b from-orange-50 to-orange-100 border-2 border-orange-300'
          ]"
        >
          <div class="text-3xl mb-2">
            {{ getMedalEmoji(index + 1) }}
          </div>
          <div 
            class="w-4 h-4 rounded-full mx-auto mb-2" 
            :style="{ backgroundColor: team.color || '#6366f1' }"
          />
          <div>
            <h4 class="font-semibold text-text-1 mb-2">{{ team.name }}</h4>
            <div class="text-lg font-bold text-brand-1">
              <span class="text-2xl">{{ team.score }}</span>
              <span class="text-base text-text-2">/ {{ totalQuestions }}</span>
            </div>
            <div class="text-sm text-text-2 mt-1">
              {{ Math.round((team.score / totalQuestions) * 100) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Full Rankings Table -->
      <div class="bg-bg rounded-lg shadow-md overflow-hidden">
        <div class="grid grid-cols-4 mobile:grid-cols-2 gap-4 p-4 bg-bg-soft font-semibold text-text-2 text-sm mobile:gap-2">
          <div>Rang</div>
          <div>Équipe</div>
          <div class="mobile:hidden">Score</div>
          <div class="mobile:hidden">%</div>
        </div>
        
        <div
          v-for="(team, index) in rankedTeams"
          :key="team.id"
          :class="[
            'grid grid-cols-4 mobile:grid-cols-2 gap-4 mobile:gap-2 p-4 border-t border-divider hover:bg-bg-soft transition-colors duration-200 text-sm mobile:text-sm',
            index < 3 ? 'bg-gradient-to-r from-brand-1/5 to-transparent' : ''
          ]"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ index + 1 }}</span>
            <span v-if="index < 3" class="text-lg">{{ getMedalEmoji(index + 1) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <div 
              class="w-3 h-3 rounded-full flex-shrink-0" 
              :style="{ backgroundColor: team.color || '#6366f1' }"
            />
            <span class="font-medium">{{ team.name }}</span>
          </div>
          <div class="flex items-center mobile:hidden">
            <span>{{ team.score }} / {{ totalQuestions }}</span>
          </div>
          <div class="flex items-center gap-3 mobile:hidden">
            <div class="flex-1 h-2 bg-divider rounded-full overflow-hidden">
              <div 
                class="h-full transition-all duration-500 ease-out" 
                :style="{ 
                  width: `${(team.score / totalQuestions) * 100}%`,
                  backgroundColor: team.color || '#6366f1'
                }"
              />
            </div>
            <span class="text-sm font-medium min-w-12 text-right">{{ Math.round((team.score / totalQuestions) * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Results by Question -->
    <div>
      <h3 class="text-xl font-semibold text-text-1 mb-4">Résultats Détaillés</h3>
      
      <div class="space-y-3">
        <div
          v-for="(questionResult, index) in questionResults"
          :key="questionResult.questionId"
          class="bg-bg rounded-lg shadow-md overflow-hidden"
        >
          <button
            :class="[
              'w-full p-4 text-left hover:bg-bg-soft transition-colors duration-200 cursor-pointer',
              expandedQuestions.has(index) ? 'bg-bg-soft' : ''
            ]"
            @click="toggleQuestion(index)"
          >
            <div class="flex flex-col gap-1 mb-2">
              <span class="text-sm font-semibold text-brand-1">Question {{ index + 1 }}</span>
              <span class="text-text-1 mobile:text-sm">{{ getQuestionText(questionResult.questionId) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm text-text-2">
              <span>
                {{ getCorrectAnswersCount(questionResult) }} / {{ questionResult.teamAnswers.length }} correct
              </span>
              <span class="font-mono">
                {{ expandedQuestions.has(index) ? '▼' : '▶' }}
              </span>
            </div>
          </button>
          
          <Transition name="accordion">
            <div v-if="expandedQuestions.has(index)" class="p-4 border-t border-divider bg-bg-soft/50">
              <div class="mb-4 p-3 bg-green-soft border border-green-1/20 rounded-lg text-green-1">
                <strong>Bonne réponse :</strong> 
                {{ getAnswerText(questionResult.questionId, questionResult.correctAnswer) }}
              </div>
              
              <div class="space-y-2">
                <div
                  v-for="teamAnswer in questionResult.teamAnswers"
                  :key="teamAnswer.teamId"
                  :class="[
                    'flex items-center gap-3 p-3 rounded-lg bg-bg mobile:flex-col mobile:items-start mobile:gap-2',
                    teamAnswer.isCorrect ? 'bg-green-soft border border-green-1/20' : ''
                  ]"
                >
                  <div 
                    class="w-3 h-3 rounded-full flex-shrink-0" 
                    :style="{ backgroundColor: getTeamColor(teamAnswer.teamId) }"
                  />
                  <span class="font-medium min-w-30 mobile:min-w-full">{{ teamAnswer.teamName }}</span>
                  <span class="flex-1 text-text-2">
                    {{ getAnswerText(questionResult.questionId, teamAnswer.answerIndex) }}
                  </span>
                  <span :class="[
                    'font-bold text-lg',
                    teamAnswer.isCorrect ? 'text-green-1' : 'text-red-1'
                  ]">
                    {{ teamAnswer.isCorrect ? '✓' : '✗' }}
                  </span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Performance Chart (Simple Bar Chart) -->
    <div>
      <h3 class="text-xl font-semibold text-text-1 mb-4">Performance par Équipe</h3>
      
      <div class="space-y-4">
        <div
          v-for="team in rankedTeams"
          :key="team.id"
          class="flex items-center gap-4 mobile:flex-col mobile:gap-2"
        >
          <div class="min-w-150px text-right mobile:min-w-full mobile:text-left">
            <span class="block font-medium">{{ team.name }}</span>
            <span class="block text-sm text-text-2">{{ team.score }}/{{ totalQuestions }}</span>
          </div>
          <div class="flex-1 h-6 bg-divider rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-1000 ease-out" 
              :style="{ 
                width: `${(team.score / totalQuestions) * 100}%`,
                backgroundColor: team.color || '#6366f1'
              }"
            />
          </div>
          <span class="min-w-12 text-right font-medium">{{ Math.round((team.score / totalQuestions) * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="pt-8 border-t border-divider">
      <div class="flex gap-4 justify-center flex-wrap mobile:flex-col">
        <BaseButton
          variant="outline"
          @click="$emit('restart')"
        >
          <div class="i-carbon-restart text-sm mr-2"></div>
          Nouveau Quiz
        </BaseButton>
        
        <BaseButton
          variant="secondary"
          @click="exportResults"
          v-if="canExport"
        >
          <div class="i-carbon-document-export text-sm mr-2"></div>
          Exporter
        </BaseButton>
        
        <BaseButton
          variant="ghost"
          @click="$emit('home')"
        >
          <div class="i-carbon-home text-sm mr-2"></div>
          Accueil
        </BaseButton>
      </div>
    </div>

    <!-- Export Modal -->
    <Teleport to="body">
      <div
        v-if="showExportModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click="closeExportModal"
      >
        <div class="bg-bg rounded-lg p-6 max-w-md mx-4 shadow-xl" @click.stop>
          <h3 class="text-xl font-bold text-text-1 mb-4">Exporter les Résultats</h3>
          <div class="flex gap-3 mb-4">
            <BaseButton
              variant="outline"
              @click="exportAsText"
            >
              📄 Texte
            </BaseButton>
            <BaseButton
              variant="outline"
              @click="exportAsJSON"
            >
              <div class="i-carbon-document-export text-sm mr-2"></div>
              JSON
            </BaseButton>
          </div>
          <BaseButton
            variant="ghost"
            @click="closeExportModal"
          >
            Annuler
          </BaseButton>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BaseButton } from '@/components/ui'
import VirtualizedTeamList from './VirtualizedTeamList.vue'
import type { Team, Question, QuestionResults } from '@/types'
import { useOptimizedAnimations, useVirtualScrolling, performanceMonitor } from '@/utils/performance'

// Performance thresholds
const VIRTUALIZATION_THRESHOLD = 50 // Use virtualization for 50+ teams
const QUESTION_PAGE_SIZE = 10 // Show 10 questions per page

// Props
interface Props {
  teams: Team[]
  questions: Question[]
  questionResults: QuestionResults[]
  totalQuestions: number
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  restart: []
  home: []
  'export-completed': [data: string, format: 'text' | 'json']
}>()

// Reactive state
const expandedQuestions = ref(new Set<number>())
const showExportModal = ref(false)

// Performance optimizations
const { shouldAnimate, animationDuration } = useOptimizedAnimations()
const { visibleItems: visibleQuestions, totalHeight, handleScroll, containerRef } = useVirtualScrolling(
  computed(() => props.questionResults),
  400, // container height
  120  // estimated item height
)

// Computed properties with performance optimization
const rankedTeams = computed(() => {
  const endMeasure = performanceMonitor.start('rankedTeams-calculation')
  
  // Create a score map for O(1) lookups
  const scoreMap = new Map<string, number>()
  
  // Initialize all teams with 0 score
  props.teams.forEach(team => {
    scoreMap.set(team.id, 0)
  })
  
  // Calculate scores efficiently
  props.questionResults.forEach(questionResult => {
    questionResult.teamAnswers.forEach(teamAnswer => {
      if (teamAnswer.isCorrect) {
        const currentScore = scoreMap.get(teamAnswer.teamId) || 0
        scoreMap.set(teamAnswer.teamId, currentScore + 1)
      }
    })
  })
  
  // Create ranked teams with calculated scores
  const result = [...props.teams]
    .map(team => ({
      ...team,
      score: scoreMap.get(team.id) || 0
    }))
    .sort((a, b) => {
      // Primary sort: score descending
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Secondary sort: name ascending (stable sort)
      return a.name.localeCompare(b.name)
    })
  
  endMeasure()
  return result
})

const canExport = computed(() => {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator
})

// Methods
const getMedalEmoji = (position: number): string => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[position - 1] || '🏅'
}

const toggleQuestion = (index: number) => {
  if (expandedQuestions.value.has(index)) {
    expandedQuestions.value.delete(index)
  } else {
    expandedQuestions.value.add(index)
  }
}

const getQuestionText = (questionId: string): string => {
  const question = props.questions.find(q => q.id === questionId)
  return question?.question || 'Question non trouvée'
}

const getAnswerText = (questionId: string, answerIndex: number): string => {
  const question = props.questions.find(q => q.id === questionId)
  return question?.answers[answerIndex] || 'Réponse non trouvée'
}

const getTeamColor = (teamId: string): string => {
  const team = props.teams.find(t => t.id === teamId)
  return team?.color || '#6366f1'
}

const getCorrectAnswersCount = (questionResult: QuestionResults): number => {
  return questionResult.teamAnswers.filter(answer => answer.isCorrect).length
}

const exportResults = () => {
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const exportAsText = async () => {
  const textData = generateTextExport()
  
  try {
    await navigator.clipboard.writeText(textData)
    alert('Résultats copiés dans le presse-papiers !')
  } catch (error) {
    console.error('Erreur lors de la copie:', error)
    // Fallback: create a downloadable file
    downloadAsFile(textData, 'resultats-quiz.txt', 'text/plain')
  }
  
  closeExportModal()
}

const exportAsJSON = async () => {
  const jsonData = generateJSONExport()
  
  try {
    await navigator.clipboard.writeText(jsonData)
    alert('Données JSON copiées dans le presse-papiers !')
  } catch (error) {
    console.error('Erreur lors de la copie:', error)
    // Fallback: create a downloadable file
    downloadAsFile(jsonData, 'resultats-quiz.json', 'application/json')
  }
  
  closeExportModal()
}

const generateTextExport = (): string => {
  let text = 'RÉSULTATS DU QUIZ CINÉMA\n'
  text += '=' .repeat(40) + '\n\n'
  
  text += 'CLASSEMENT FINAL:\n'
  text += '-'.repeat(20) + '\n'
  
  rankedTeams.value.forEach((team, index) => {
    const medal = index < 3 ? getMedalEmoji(index + 1) : `${index + 1}.`
    const percentage = Math.round((team.score / props.totalQuestions) * 100)
    text += `${medal} ${team.name}: ${team.score}/${props.totalQuestions} (${percentage}%)\n`
  })
  
  text += '\n' + '='.repeat(40) + '\n'
  text += 'RÉSULTATS DÉTAILLÉS PAR QUESTION:\n'
  text += '='.repeat(40) + '\n\n'
  
  props.questionResults.forEach((questionResult, index) => {
    text += `Question ${index + 1}: ${getQuestionText(questionResult.questionId)}\n`
    text += `Bonne réponse: ${getAnswerText(questionResult.questionId, questionResult.correctAnswer)}\n`
    text += 'Réponses des équipes:\n'
    
    questionResult.teamAnswers.forEach(teamAnswer => {
      const result = teamAnswer.isCorrect ? '✓' : '✗'
      const answer = getAnswerText(questionResult.questionId, teamAnswer.answerIndex)
      text += `  ${result} ${teamAnswer.teamName}: ${answer}\n`
    })
    
    text += '\n'
  })
  
  return text
}

const generateJSONExport = (): string => {
  const exportData = {
    timestamp: new Date().toISOString(),
    quiz: {
      totalQuestions: props.totalQuestions,
      teams: rankedTeams.value,
      questionResults: props.questionResults.map(questionResult => ({
        ...questionResult,
        questionText: getQuestionText(questionResult.questionId),
        correctAnswerText: getAnswerText(questionResult.questionId, questionResult.correctAnswer),
        teamAnswers: questionResult.teamAnswers.map(teamAnswer => ({
          ...teamAnswer,
          answerText: getAnswerText(questionResult.questionId, teamAnswer.answerIndex)
        }))
      }))
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

const downloadAsFile = (content: string, filename: string, mimeType: string) => {
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
onMounted(() => {
  // Add some celebration animations or effects here if needed
  console.log('Quiz terminé! Résultats affichés.')
})
</script>

<style scoped>
/* Accordion animations for question details */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .accordion-enter-active,
  .accordion-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .accordion-enter-from,
  .accordion-leave-to {
    max-height: auto;
  }
}
</style>