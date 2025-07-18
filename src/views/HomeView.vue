<template>
  <div
    class="min-h-screen relative overflow-hidden bg-gradient-to-br from-bg to-bg-soft"
  >
    <!-- Hero Section -->
    <div
      class="container-app min-h-screen flex-center flex-col text-center relative z-10"
    >
      <div class="container-xl">
        <!-- Main Title -->
        <h1
          class="heading-1 rainbow-text mb-4 main-title"
          :class="{ 'animate-slide-up': isLoaded }"
        >
          CinéQUIZ
        </h1>

        <!-- Subtitle -->
        <p
          class="body-text text-text-2 mb-8 mobile:mb-12 leading-relaxed subtitle"
          :class="{ 'animate-slide-up-delay': isLoaded }"
        >
          Testez vos connaissances cinéma !
        </p>

        <!-- Quiz Actions Section -->
        <div
          class="mb-8 mobile:mb-12 quiz-actions"
          :class="{ 'animate-fade-in': isLoaded }"
        >
          <!-- Import Questions Card -->
          <BaseCard
            variant="elevated"
            hover
            padding="none"
            :class="{
              'animate-card-in': isLoaded,
              'opacity-50 cursor-wait': isImporting,
            }"
            :style="{ animationDelay: '0.3s' }"
            class="import-card border-2 border-dashed border-brand-1/20 relative overflow-hidden hover:border-brand-1/40 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 max-w-md mx-auto mb-6 cursor-pointer"
            @click="importFromClipboard"
          >
            <div
              class="p-responsive text-center h-full flex flex-col justify-between"
            >
              <div class="text-4xl mobile:text-5xl mb-4 text-brand-1">
                <div v-if="!isImporting" class="i-carbon-document-import"></div>
                <div v-else class="i-carbon-circle-dash animate-spin"></div>
              </div>
              <h3 class="heading-3 mb-4">Importer des Questions</h3>
              <p class="body-sm mb-6">
                <span v-if="!isImporting">
                  Cliquez pour coller un fichier JSON de questions depuis votre
                  presse-papiers
                </span>
                <span v-else> Importation en cours... </span>
              </p>

              <!-- Success/Error Messages -->
              <div
                v-if="importMessage"
                class="text-sm mt-4"
                :class="{
                  'text-green-1': importSuccess,
                  'text-red-1': !importSuccess,
                }"
              >
                {{ importMessage }}
              </div>
            </div>
          </BaseCard>

          <!-- Default Quiz Button -->
          <div class="text-center">
            <p class="body-sm text-text-2 mb-4">
              Ou utilisez le quiz par défaut :
            </p>
            <BaseButton
              variant="primary"
              size="lg"
              class="min-w-48"
              :class="{ 'animate-card-in': isLoaded }"
              :style="{ animationDelay: '0.4s' }"
              @click="startDefaultQuiz"
            >
              <span class="flex items-center justify-center gap-2">
                <span>Commencer le Quiz</span>
                <div class="i-carbon-play text-lg"></div>
              </span>
            </BaseButton>
          </div>
        </div>

        <!-- Instructions Button -->
        <div
          class="text-center"
          :class="{ 'animate-fade-in': isLoaded }"
          :style="{ animationDelay: '0.6s' }"
        >
          <BaseButton
            variant="ghost"
            size="md"
            @click="showInstructions = true"
          >
            <span class="flex items-center gap-2">
              <div class="i-carbon-help text-lg"></div>
              Comment jouer ?
            </span>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Background Glow Effects -->
    <div class="absolute inset-0 pointer-events-none z-1 overflow-hidden">
      <!-- Primary Glow - Top Left -->
      <div
        class="glow-decoration absolute top-10% -left-10%"
        style="animation-delay: 0s"
      >
        <div
          class="glow-sphere w-80 h-80 mobile:w-96 mobile:h-96 tablet:w-120 tablet:h-120"
        ></div>
      </div>

      <!-- Secondary Glow - Top Right -->
      <div
        class="glow-decoration absolute top-60% -right-10%"
        style="animation-delay: 2s"
      >
        <div
          class="glow-sphere w-64 h-64 mobile:w-80 mobile:h-80 tablet:w-96 tablet:h-96"
        ></div>
      </div>

      <!-- Tertiary Glow - Bottom Left -->
      <div
        class="glow-decoration absolute bottom-20% left-5%"
        style="animation-delay: 4s"
      >
        <div
          class="glow-sphere w-48 h-48 mobile:w-64 mobile:h-64 tablet:w-80 tablet:h-80"
        ></div>
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
            <strong>Quiz Personnalisé :</strong> Importez vos propres questions
            au format JSON depuis le presse-papiers.
          </div>

          <!-- ChatGPT Generation Button -->
          <div class="text-center my-4">
            <BaseButton variant="secondary" size="md" @click="openChatGPT">
              <span class="flex items-center gap-2">
                <div class="i-carbon-chat text-lg"></div>
                Générer des questions avec ChatGPT
              </span>
            </BaseButton>
          </div>

          <div class="custom-block-tip">
            <strong>Quiz par Défaut :</strong> Utilisez notre collection de
            questions sur le cinéma.
          </div>

          <div class="grid-responsive grid-cols-1 mobile-lg:grid-cols-2">
            <div>
              <h4 class="heading-4 mb-3">Fonctionnalités</h4>
              <ul class="space-y-2 body-sm">
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Navigation libre entre questions
                </li>
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Résultats détaillés
                </li>
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Interface responsive
                </li>
                <li class="flex items-center gap-2">
                  <div class="i-carbon-checkmark text-green-1"></div>
                  Sauvegarde automatique
                </li>
              </ul>
              <BaseButton
                variant="primary"
                size="md"
                @click="showInstructions = false"
                class="w-full mt-4"
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuizStore } from "@/stores/quiz";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseCard from "@/components/ui/BaseCard.vue";
import BaseModal from "@/components/ui/BaseModal.vue";

const router = useRouter();
const quizStore = useQuizStore();
const isLoaded = ref(false);
const showInstructions = ref(false);
const isImporting = ref(false);
const importMessage = ref("");
const importSuccess = ref(false);

// ChatGPT URL with pre-filled prompt
const chatGptUrl = computed(() => {
  const prompt = `Je veux que tu me genere un JSON pour mon quiz cinéma. Format obligatoire avec title "Soirée CinéQuiz" et au moins 10 questions:

{
  "metadata": {
    "title": "Soirée CinéQuiz", 
    "version": "1.0",
    "totalQuestions": 10,
    "categories": ["Romance", "Comédie", "Drame", "Acteurs"],
    "description": "Quiz cinéma"
  },
  "questions": [
    {
      "id": "q001",
      "question": "Question example?",
      "answers": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "category": "Romance",
      "difficulty": "medium",
      "explanation": "Explication"
    }
  ]
}`;

  return `https://chat.openai.com/?model=gpt-4o&q=${encodeURIComponent(
    prompt
  )}`;
});

const startDefaultQuiz = async () => {
  try {
    await quizStore.loadQuestionsFromJSON();
    router.push("/quiz");
  } catch (error) {
    importMessage.value = "Erreur lors du chargement du quiz par défaut";
    importSuccess.value = false;
    setTimeout(() => {
      importMessage.value = "";
    }, 3000);
  }
};

const openChatGPT = () => {
  window.open(chatGptUrl.value, "_blank", "noopener,noreferrer");
};

const importFromClipboard = async () => {
  if (!navigator.clipboard) {
    importMessage.value =
      "Le presse-papiers n'est pas supporté par votre navigateur";
    importSuccess.value = false;
    setTimeout(() => {
      importMessage.value = "";
    }, 3000);
    return;
  }

  isImporting.value = true;
  importMessage.value = "";

  try {
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText.trim()) {
      throw new Error("Le presse-papiers est vide");
    }

    // Parse and validate JSON
    let jsonData;
    try {
      jsonData = JSON.parse(clipboardText);
    } catch (error) {
      throw new Error("Format JSON invalide");
    }

    // Validate structure
    if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
      throw new Error('Le JSON doit contenir un tableau "questions"');
    }

    if (jsonData.questions.length === 0) {
      throw new Error("Aucune question trouvée");
    }

    // Validate each question
    for (let i = 0; i < jsonData.questions.length; i++) {
      const q = jsonData.questions[i];
      if (
        !q.id ||
        !q.question ||
        !q.answers ||
        typeof q.correctAnswer !== "number"
      ) {
        throw new Error(`Question ${i + 1} invalide: champs requis manquants`);
      }

      if (!Array.isArray(q.answers) || q.answers.length === 0) {
        throw new Error(`Question ${i + 1} invalide: réponses manquantes`);
      }

      if (q.correctAnswer < 0 || q.correctAnswer >= q.answers.length) {
        throw new Error(
          `Question ${i + 1} invalide: index de réponse correcte invalide`
        );
      }
    }

    // Load questions into store
    quizStore.loadQuestions(jsonData.questions);

    importMessage.value = `${jsonData.questions.length} question(s) importée(s) avec succès !`;
    importSuccess.value = true;

    // Auto-redirect to quiz after successful import
    setTimeout(() => {
      router.push("/quiz");
    }, 1500);
  } catch (error) {
    importMessage.value =
      error instanceof Error ? error.message : "Erreur lors de l'importation";
    importSuccess.value = false;
  } finally {
    isImporting.value = false;

    if (!importSuccess.value) {
      setTimeout(() => {
        importMessage.value = "";
      }, 5000);
    }
  }
};

onMounted(() => {
  // Trigger animations after component mount
  setTimeout(() => {
    isLoaded.value = true;
  }, 100);
});
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

.quiz-actions {
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.quiz-actions.animate-fade-in {
  opacity: 1;
}

.import-card {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.import-card.animate-card-in {
  opacity: 1;
  transform: translateY(0);
}

@keyframes float-glow {
  0%,
  100% {
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
  .quiz-actions,
  .import-card {
    transition: none;
    animation: none;
  }

  .glow-decoration {
    animation: none;
  }
}
</style>
