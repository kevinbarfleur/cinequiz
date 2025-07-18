<template>
  <div class="score-display-demo p-6">
    <div class="demo-header mb-8 text-center">
      <h1 class="text-3xl font-bold text-text-primary mb-4">
        Démo ScoreDisplay
      </h1>
      <p class="text-text-secondary">
        Testez différents scores pour voir les animations et messages d'encouragement
      </p>
    </div>

    <!-- Controls -->
    <div class="demo-controls mb-8 max-w-md mx-auto">
      <BaseCard padding="md">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Score: {{ score }}/{{ totalQuestions }} ({{ Math.round((score / totalQuestions) * 100) }}%)
            </label>
            <input
              v-model.number="score"
              type="range"
              :min="0"
              :max="totalQuestions"
              class="w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Nombre de questions: {{ totalQuestions }}
            </label>
            <input
              v-model.number="totalQuestions"
              type="range"
              :min="5"
              :max="20"
              class="w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Temps (secondes): {{ timeSpent }}
            </label>
            <input
              v-model.number="timeSpent"
              type="range"
              :min="30"
              :max="600"
              class="w-full"
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <input
              v-model="isNewBestScore"
              type="checkbox"
              id="newBestScore"
              class="rounded"
            />
            <label for="newBestScore" class="text-sm text-text-primary">
              Nouveau record personnel
            </label>
          </div>
          
          <BaseButton
            variant="primary"
            size="sm"
            class="w-full"
            @click="refreshDemo"
          >
            <div class="i-carbon-restart text-sm mr-2"></div>
            Relancer l'animation
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- ScoreDisplay Demo -->
    <div class="demo-display">
      <ScoreDisplay
        :key="demoKey"
        :score="score"
        :total-questions="totalQuestions"
        :stats="demoStats"
        :is-new-best-score="isNewBestScore"
        @restart="onRestart"
        @home="onHome"
      />
    </div>

    <!-- Event Log -->
    <div class="demo-events mt-8 max-w-md mx-auto">
      <BaseCard padding="md">
        <h3 class="text-lg font-semibold text-text-primary mb-3">
          Événements
        </h3>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          <div
            v-for="(event, index) in events"
            :key="index"
            class="text-sm p-2 bg-background rounded text-text-secondary"
          >
            {{ event }}
          </div>
          <div v-if="events.length === 0" class="text-sm text-text-secondary italic">
            Aucun événement pour le moment
          </div>
        </div>
        <BaseButton
          v-if="events.length > 0"
          variant="ghost"
          size="sm"
          class="mt-2 w-full"
          @click="clearEvents"
        >
          Effacer
        </BaseButton>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ScoreDisplay from './ScoreDisplay.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { QuizStats } from '@/types'

// Demo state
const score = ref(7)
const totalQuestions = ref(10)
const timeSpent = ref(125)
const isNewBestScore = ref(false)
const demoKey = ref(0)
const events = ref<string[]>([])

// Computed stats
const demoStats = computed((): QuizStats => ({
  totalQuestions: totalQuestions.value,
  correctAnswers: score.value,
  incorrectAnswers: totalQuestions.value - score.value,
  scorePercentage: Math.round((score.value / totalQuestions.value) * 100),
  timeSpent: timeSpent.value,
  averageTimePerQuestion: timeSpent.value / totalQuestions.value
}))

// Event handlers
const onRestart = () => {
  events.value.unshift(`Événement "restart" émis à ${new Date().toLocaleTimeString()}`)
}

const onHome = () => {
  events.value.unshift(`Événement "home" émis à ${new Date().toLocaleTimeString()}`)
}

const refreshDemo = () => {
  demoKey.value++
  events.value.unshift(`✨ Animation relancée à ${new Date().toLocaleTimeString()}`)
}

const clearEvents = () => {
  events.value = []
}
</script>

<style scoped>
.score-display-demo {
  @apply min-h-screen bg-background;
}

input[type="range"] {
  @apply appearance-none h-2 bg-gray-200 rounded-lg outline-none;
}

input[type="range"]::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-primary rounded-full cursor-pointer;
}

input[type="range"]::-moz-range-thumb {
  @apply w-4 h-4 bg-primary rounded-full cursor-pointer border-none;
}
</style>