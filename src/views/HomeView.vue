<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-bg to-bg-soft">
    <!-- Hero Section -->
    <div class="container-app min-h-screen flex-center flex-col text-center relative z-10">
      <div class="container-xl">
        <!-- Main Title -->
        <h1 class="heading-1 rainbow-text mb-4 main-title" :class="{ 'animate-slide-up': isLoaded }">
          CinéQUIZ
        </h1>
        
        <!-- Subtitle -->
        <p class="body-text text-text-2 mb-8 mobile:mb-12 leading-relaxed subtitle" :class="{ 'animate-slide-up-delay': isLoaded }">
          Testez vos connaissances cinéma !
        </p>
        
        <!-- Mode Selection Section -->
        <div class="mb-8 mobile:mb-12 mode-selection" :class="{ 'animate-fade-in': isLoaded }">
        
          <div class="grid-responsive grid-cols-1 tablet:grid-cols-2 mb-8">
            <!-- Mode Animateur -->
            <BaseCard 
              variant="elevated" 
              hover
              padding="none"
              :class="{ 'animate-card-in': isLoaded }"
              :style="{ animationDelay: '0.3s' }"
              class="mode-card border-2 border-transparent relative overflow-hidden hover:border-brand-1/30 hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
            >
              <div class="p-responsive text-center h-full flex flex-col justify-between">
                <div class="text-4xl mobile:text-5xl mb-4 text-brand-1">
                  <div class="i-carbon-user-admin"></div>
                </div>
                <h3 class="heading-3 mb-4">Mode Animateur</h3>
                <p class="body-sm mb-6">
                  Gérez les équipes, contrôlez le déroulement du quiz et accédez aux résultats détaillés
                </p>
                <BaseButton 
                  variant="primary" 
                  size="lg"
                  class="w-full"
                  @click="selectMode('host')"
                >
                  <span class="flex items-center justify-center gap-2">
                    <span>Animer le Quiz</span>
                    <div class="i-carbon-user text-lg"></div>
                  </span>
                </BaseButton>
              </div>
            </BaseCard>

            <!-- Mode Participant -->
            <BaseCard 
              variant="elevated" 
              hover
              padding="none"
              :class="{ 'animate-card-in': isLoaded }"
              :style="{ animationDelay: '0.4s' }"
              class="mode-card border-2 border-transparent relative overflow-hidden hover:border-brand-1/30 hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
            >
              <div class="p-responsive text-center h-full flex flex-col justify-between">
                <div class="text-4xl mobile:text-5xl mb-4 text-brand-1">
                  <div class="i-carbon-user"></div>
                </div>
                <h3 class="heading-3 mb-4">Mode Participant</h3>
                <p class="body-sm mb-6">
                  Répondez aux questions à votre rythme avec une navigation libre entre les questions
                </p>
                <BaseButton 
                  variant="primary" 
                  size="lg"
                  class="w-full"
                  @click="selectMode('participant')"
                >
                  <span class="flex items-center justify-center gap-2">
                    <span>Jouer au Quiz</span>
                    <div class="i-carbon-game-console text-lg"></div>
                  </span>
                </BaseButton>
              </div>
            </BaseCard>
          </div>
        </div>


      </div>
    </div>
    


    <!-- Background Glow Effects -->
    <div class="absolute inset-0 pointer-events-none z-1 overflow-hidden">
      <!-- Primary Glow - Top Left -->
      <div class="glow-decoration absolute top-10% -left-10%" style="animation-delay: 0s">
        <div class="glow-sphere w-80 h-80 mobile:w-96 mobile:h-96 tablet:w-120 tablet:h-120"></div>
      </div>
      
      <!-- Secondary Glow - Top Right -->
      <div class="glow-decoration absolute top-60% -right-10%" style="animation-delay: 2s">
        <div class="glow-sphere w-64 h-64 mobile:w-80 mobile:h-80 tablet:w-96 tablet:h-96"></div>
      </div>
      
      <!-- Tertiary Glow - Bottom Left -->
      <div class="glow-decoration absolute bottom-20% left-5%" style="animation-delay: 4s">
        <div class="glow-sphere w-48 h-48 mobile:w-64 mobile:h-64 tablet:w-80 tablet:h-80"></div>
      </div>
    </div>

    <!-- Instructions Modal -->
    <BaseModal
      v-model:isVisible="showInstructions"
      title="Comment jouer à CinéQuiz"
      size="lg"
      :close-on-overlay="true"
      :close-on-escape="true"
      backdrop="blur"
      animation="scale"
    >
      <template #default>
        <div class="space-responsive">
          <div class="custom-block-info">
            <strong>Mode Animateur :</strong> Parfait pour animer une soirée. Vous gérez les équipes et contrôlez le rythme du jeu.
          </div>
          
          <div class="custom-block-tip">
            <strong>Mode Participant :</strong> Idéal pour jouer seul ou en petit groupe. Navigation libre et interface simplifiée.
          </div>
          
          <div class="grid-responsive grid-cols-1 mobile-lg:grid-cols-2">
            <div>
              <h4 class="heading-4 mb-3">Fonctionnalités</h4>
              <ul class="space-y-2 body-sm">
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Questions sur le cinéma
                </li>
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Gestion d'équipes
                </li>
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Résultats détaillés
                </li>
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Interface responsive
                </li>
              </ul>
            </div>
            
            <div>
              <h4 class="heading-4 mb-3">Prêt ?</h4>
              <p class="body-sm mb-4">
                Choisissez votre mode de jeu et commencez à tester vos connaissances cinéma !
              </p>
              <BaseButton 
                variant="primary" 
                size="md"
                @click="showInstructions = false"
                class="w-full"
              >
                Commencer
              </BaseButton>
            </div>
          </div>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import type { UserMode } from '@/types'

const router = useRouter()
const quizStore = useQuizStore()
const isLoaded = ref(false)
const showInstructions = ref(false)

const selectMode = (mode: 'host' | 'participant') => {
  // Set the user mode in the store
  quizStore.setUserMode(mode)
  
  // Navigate based on the selected mode
  if (mode === 'host') {
    // For host mode, go to team setup first
    router.push('/team-setup')
  } else {
    // For participant mode, go directly to quiz
    router.push('/quiz')
  }
}

const startQuiz = () => {
  // Default behavior - go to participant mode
  selectMode('participant')
}

onMounted(() => {
  // Trigger animations after component mount
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<style scoped>
/* Custom animations and complex gradients that can't be easily replaced with UnoCSS utilities */
.app-icon {
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.app-icon.animate-bounce-in {
  opacity: 1;
  transform: scale(1);
}

.main-title {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease-out;
  font-weight: 900;
}

.main-title.animate-slide-up {
  opacity: 1;
  transform: translateY(0);
  animation-delay: 0.2s;
}

.subtitle {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease-out;
}

.subtitle.animate-slide-up-delay {
  opacity: 1;
  transform: translateY(0);
  animation-delay: 0.4s;
}

.mode-selection {
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.mode-selection.animate-fade-in {
  opacity: 1;
}

.mode-card {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mode-card.animate-card-in {
  opacity: 1;
  transform: translateY(0);
}

.features-grid {
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.features-grid.animate-fade-in {
  opacity: 1;
}

.feature-card {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.feature-card.animate-card-in {
  opacity: 1;
  transform: translateY(0);
}

@keyframes float-glow {
  0%, 100% {
    transform: translateY(0px) translateX(0px);
  }
  33% {
    transform: translateY(-15px) translateX(10px);
  }
  66% {
    transform: translateY(15px) translateX(-10px);
  }
}

.glow-decoration {
  animation: float-glow 8s ease-in-out infinite;
}

.glow-sphere {
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #3451b2, #6366f1);
  opacity: 0.15;
  filter: blur(80px);
  /* Animation is applied via CSS class in theme.css */
}

/* Enhanced glow for dark mode */
.dark .glow-sphere {
  opacity: 0.25;
  filter: blur(100px);
}

/* Reduce intensity for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .glow-sphere {
    opacity: 0.08;
    filter: blur(60px);
    animation: float-glow 8s ease-in-out infinite !important; /* Only floating, no color animation */
  }
  
  .dark .glow-sphere {
    opacity: 0.12;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .app-icon,
  .main-title,
  .subtitle,
  .features-grid,
  .feature-card {
    transition: none;
    animation: none;
  }
  
  .glow-decoration {
    animation: none;
  }
}
</style>