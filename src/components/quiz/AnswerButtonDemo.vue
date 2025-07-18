<template>
  <div class="answer-button-demo p-6 space-y-6">
    <h2 class="text-2xl font-bold text-text-primary mb-6">AnswerButton Component Demo</h2>
    
    <div class="demo-section">
      <h3 class="text-lg font-semibold text-text-primary mb-3">Normal State</h3>
      <div class="space-y-3">
        <AnswerButton 
          answer="This is a normal answer button"
          @click="handleClick"
        />
        <AnswerButton 
          answer="Another normal answer option"
          @click="handleClick"
        />
      </div>
    </div>

    <div class="demo-section">
      <h3 class="text-lg font-semibold text-text-primary mb-3">Selected State</h3>
      <div class="space-y-3">
        <AnswerButton 
          answer="This answer is selected"
          :is-selected="true"
          @click="handleClick"
        />
        <AnswerButton 
          answer="This one is not selected"
          @click="handleClick"
        />
      </div>
    </div>

    <div class="demo-section">
      <h3 class="text-lg font-semibold text-text-primary mb-3">Result States</h3>
      <div class="space-y-3">
        <AnswerButton 
          answer="Correct answer (selected)"
          :is-selected="true"
          :is-correct="true"
          :show-result="true"
          @click="handleClick"
        />
        <AnswerButton 
          answer="Incorrect answer (selected)"
          :is-selected="true"
          :is-correct="false"
          :show-result="true"
          @click="handleClick"
        />
        <AnswerButton 
          answer="Neutral answer (not selected)"
          :is-selected="false"
          :show-result="true"
          @click="handleClick"
        />
      </div>
    </div>

    <div class="demo-section">
      <h3 class="text-lg font-semibold text-text-primary mb-3">Disabled State</h3>
      <div class="space-y-3">
        <AnswerButton 
          answer="This button is disabled"
          :disabled="true"
          @click="handleClick"
        />
        <AnswerButton 
          answer="Selected but disabled"
          :is-selected="true"
          :disabled="true"
          @click="handleClick"
        />
      </div>
    </div>

    <div class="demo-section">
      <h3 class="text-lg font-semibold text-text-primary mb-3">Interactive Demo</h3>
      <p class="text-text-secondary mb-3">Click on answers to see the interaction:</p>
      <div class="space-y-3">
        <AnswerButton 
          v-for="(answer, index) in demoAnswers"
          :key="index"
          :answer="answer.text"
          :is-selected="selectedAnswer === index"
          :is-correct="answer.isCorrect"
          :show-result="showResults"
          @click="selectAnswer(index)"
        />
      </div>
      <div class="mt-4 space-x-3">
        <button 
          @click="showResults = !showResults"
          class="btn-primary"
        >
          {{ showResults ? 'Hide Results' : 'Show Results' }}
        </button>
        <button 
          @click="resetDemo"
          class="btn-outline"
        >
          Reset
        </button>
      </div>
    </div>

    <div v-if="lastClickedAnswer" class="demo-feedback">
      <p class="text-text-secondary">
        Last clicked: <strong>{{ lastClickedAnswer }}</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AnswerButton from './AnswerButton.vue'

const selectedAnswer = ref<number | null>(null)
const showResults = ref(false)
const lastClickedAnswer = ref<string>('')

const demoAnswers = ref([
  { text: "Paris is the capital of France", isCorrect: true },
  { text: "London is the capital of Germany", isCorrect: false },
  { text: "Madrid is the capital of Italy", isCorrect: false },
  { text: "Rome is the capital of Spain", isCorrect: false }
])

const handleClick = (answer: string) => {
  lastClickedAnswer.value = answer
  console.log('Answer clicked:', answer)
}

const selectAnswer = (index: number) => {
  selectedAnswer.value = index
  lastClickedAnswer.value = demoAnswers.value[index].text
}

const resetDemo = () => {
  selectedAnswer.value = null
  showResults.value = false
  lastClickedAnswer.value = ''
}
</script>

<style scoped>
.answer-button-demo {
  max-width: 600px;
  margin: 0 auto;
}

.demo-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #ffffff;
}

.demo-feedback {
  background-color: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
}
</style>