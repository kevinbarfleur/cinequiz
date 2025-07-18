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

          <!-- Category Selector -->
          <div class="text-center">
            <p class="body-sm text-text-2 mb-6">Choisissez votre catégorie :</p>

            <div class="max-w-xs mx-auto">
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="category in quizCategories"
                  :key="category.id"
                  class="category-btn p-3 border-2 border-divider bg-bg-soft rounded-lg transition-all duration-200 text-center hover:border-brand-1 hover:bg-brand-1/10 hover:shadow-md hover:-translate-y-1 min-h-20"
                  :class="{ 'animate-card-in': isLoaded }"
                  :style="{ animationDelay: '0.4s' }"
                  @click="startQuiz(category.id)"
                >
                  <div class="text-lg mb-1">{{ category.icon }}</div>
                  <div class="body-md font-bold text-white">
                    {{ category.title }}
                  </div>
                </button>
              </div>
            </div>
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
      mobile-size="large"
    >
      <template #default>
        <div class="space-responsive">
          <div class="custom-block-info">
            <strong>Quiz Personnalisé :</strong> Importez vos propres questions
            au format JSON depuis le presse-papiers.
          </div>

          <!-- ChatGPT Generation Button -->
          <div class="text-center my-4">
            <BaseButton
              variant="secondary"
              size="md"
              class="btn-modal"
              @click="openChatGPT"
            >
              <span class="flex items-center gap-2">
                <div class="i-carbon-chat text-lg"></div>
                <span>Générer des questions avec ChatGPT</span>
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
                class="btn-modal mt-4"
              >
                Commencer
              </BaseButton>
            </div>
          </div>
        </div>
      </template>
    </BaseModal>

    <!-- Manual JSON Import Modal -->
    <BaseModal
      v-model:isVisible="showManualImport"
      title="Importer des questions JSON"
      size="lg"
      :close-on-overlay="true"
      :close-on-escape="true"
      backdrop="blur"
      animation="scale"
      mobile-size="large"
    >
      <template #default>
        <div class="space-responsive">
          <div class="custom-block-info">
            <strong>Import manuel :</strong> Collez votre fichier JSON de
            questions dans la zone ci-dessous.
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-text-1 mb-2">
              Contenu JSON
            </label>
            <textarea
              v-model="manualJsonInput"
              class="w-full h-64 p-3 border border-divider rounded-lg bg-bg text-text-1 resize-none focus:ring-2 focus:ring-brand-1 focus:border-brand-1 transition-colors"
              placeholder="Collez votre JSON ici..."
              :disabled="isImporting"
            ></textarea>
          </div>

          <!-- Success/Error Messages -->
          <div
            v-if="importMessage"
            class="text-sm mt-4 p-3 rounded-lg"
            :class="{
              'text-green-1 bg-green-soft': importSuccess,
              'text-red-1 bg-red-soft': !importSuccess,
            }"
          >
            {{ importMessage }}
          </div>

          <div class="btn-group-end mt-6">
            <BaseButton
              variant="outline"
              size="md"
              class="btn-modal"
              @click="showManualImport = false"
              :disabled="isImporting"
            >
              Annuler
            </BaseButton>
            <BaseButton
              variant="primary"
              size="md"
              class="btn-modal"
              @click="importFromTextArea"
              :disabled="isImporting || !manualJsonInput.trim()"
            >
              <span v-if="!isImporting" class="flex items-center gap-2">
                <div class="i-carbon-document-import text-lg"></div>
                Importer
              </span>
              <span v-else class="flex items-center gap-2">
                <div class="i-carbon-circle-dash animate-spin text-lg"></div>
                Importation...
              </span>
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  useQuizStore,
  QUIZ_CATEGORIES,
  type QuizCategory,
} from "@/stores/quiz";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseCard from "@/components/ui/BaseCard.vue";
import BaseModal from "@/components/ui/BaseModal.vue";

const router = useRouter();
const quizStore = useQuizStore();
const isLoaded = ref(false);
const showInstructions = ref(false);
const showManualImport = ref(false);
const isImporting = ref(false);
const importMessage = ref("");
const importSuccess = ref(false);
const manualJsonInput = ref("");

// Quiz categories
const quizCategories = QUIZ_CATEGORIES;

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

const startQuiz = async (category: QuizCategory) => {
  try {
    await quizStore.loadQuestionsFromJSON(category);
    router.push("/quiz");
  } catch (error) {
    importMessage.value = "Erreur lors du chargement du quiz";
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
    // Fallback to manual import when clipboard is not supported
    showManualImport.value = true;
    return;
  }

  isImporting.value = true;
  importMessage.value = "";

  try {
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText.trim()) {
      // Fallback to manual import when clipboard is empty
      isImporting.value = false;
      showManualImport.value = true;
      return;
    }

    // Parse and validate JSON
    let jsonData;
    try {
      jsonData = JSON.parse(clipboardText);
    } catch (error) {
      // Fallback to manual import when JSON is invalid
      isImporting.value = false;
      manualJsonInput.value = clipboardText; // Pre-fill the textarea with clipboard content
      showManualImport.value = true;
      return;
    }

    // Validate structure
    if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
      isImporting.value = false;
      manualJsonInput.value = clipboardText;
      showManualImport.value = true;
      return;
    }

    if (jsonData.questions.length === 0) {
      isImporting.value = false;
      manualJsonInput.value = clipboardText;
      showManualImport.value = true;
      return;
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
        isImporting.value = false;
        manualJsonInput.value = clipboardText;
        showManualImport.value = true;
        return;
      }

      if (!Array.isArray(q.answers) || q.answers.length === 0) {
        isImporting.value = false;
        manualJsonInput.value = clipboardText;
        showManualImport.value = true;
        return;
      }

      if (q.correctAnswer < 0 || q.correctAnswer >= q.answers.length) {
        isImporting.value = false;
        manualJsonInput.value = clipboardText;
        showManualImport.value = true;
        return;
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
    // Fallback to manual import on any other error (permissions, etc.)
    isImporting.value = false;
    showManualImport.value = true;
  } finally {
    if (importSuccess.value) {
      isImporting.value = false;
    }
    // Don't reset isImporting here if we're opening manual import modal
  }
};

const importFromTextArea = async () => {
  if (!manualJsonInput.value.trim()) {
    importMessage.value = "Veuillez coller un JSON valide.";
    importSuccess.value = false;
    setTimeout(() => {
      importMessage.value = "";
    }, 3000);
    return;
  }

  isImporting.value = true;
  importMessage.value = "";

  try {
    const jsonData = JSON.parse(manualJsonInput.value);

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

const resetManualImportModal = () => {
  manualJsonInput.value = "";
  importMessage.value = "";
  importSuccess.value = false;
  isImporting.value = false;
};

// Watch for manual import modal close to reset state
watch(showManualImport, (newValue) => {
  if (!newValue) {
    resetManualImportModal();
  }
});

const loadQuizFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedQuiz = urlParams.get("quiz");

  if (encodedQuiz) {
    try {
      // Decode the quiz data
      const decodedData = JSON.parse(decodeURIComponent(atob(encodedQuiz)));

      // Validate quiz data structure
      if (
        decodedData.questions &&
        Array.isArray(decodedData.questions) &&
        decodedData.questions.length > 0
      ) {
        // Validate each question has required fields
        const isValid = decodedData.questions.every(
          (q: any) =>
            q.id &&
            q.question &&
            q.answers &&
            Array.isArray(q.answers) &&
            q.answers.length > 0 &&
            typeof q.correctAnswer === "number" &&
            q.correctAnswer >= 0 &&
            q.correctAnswer < q.answers.length
        );

        if (isValid) {
          // Load the shared quiz
          quizStore.loadQuestions(decodedData.questions);

          // Clear the URL parameter to clean up the URL
          const url = new URL(window.location.href);
          url.searchParams.delete("quiz");
          window.history.replaceState({}, document.title, url.toString());

          // Redirect to quiz
          router.push("/quiz");

          return true; // Quiz loaded from URL
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du quiz partagé:", error);

      // Clear invalid parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("quiz");
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  return false; // No quiz in URL
};

onMounted(() => {
  // Check for shared quiz in URL first
  const quizLoadedFromUrl = loadQuizFromUrl();

  // If no shared quiz, trigger normal animations
  if (!quizLoadedFromUrl) {
    setTimeout(() => {
      isLoaded.value = true;
    }, 100);
  }
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
