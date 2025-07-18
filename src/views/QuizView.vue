<template>
  <div class="min-h-screen bg-bg">
    <!-- Loading State -->
    <div v-if="quizStore.state.isLoading" class="min-h-screen flex-center p-4">
      <div class="text-center">
        <div
          class="w-12 h-12 border-4 border-brand-1/20 border-t-brand-1 rounded-full animate-spin mx-auto mb-4"
        ></div>
        <h2 class="heading-3 mb-2">Chargement du quiz...</h2>
        <p class="text-muted">Préparation des questions cinéma</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="quizStore.state.error" class="min-h-screen flex-center p-4">
      <BaseCard
        variant="elevated"
        padding="lg"
        class="text-center max-w-md mx-auto"
      >
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
              Question {{ quizStore.state.currentQuestionIndex + 1 }} sur
              {{ quizStore.state.questions.length }}
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

      <!-- Question Card -->
      <div class="container-app px-4 py-8 pb-20">
        <QuestionCard
          v-if="quizStore.currentQuestion"
          :key="quizStore.currentQuestion.id"
          :question="quizStore.currentQuestion"
          :question-number="quizStore.state.currentQuestionIndex + 1"
          :total-questions="quizStore.state.questions.length"
          :user-answer="
            quizStore.state.participantAnswers[
              quizStore.state.currentQuestionIndex
            ]
          "
          :has-previous="quizStore.hasPreviousQuestion"
          :has-next="quizStore.hasNextQuestion"
          @answer="handleAnswer"
          @next="handleNext"
          @previous="handlePrevious"
        />
      </div>

      <!-- Footer with answers button -->
      <div
        class="fixed bottom-0 left-0 right-0 bg-bg border-t border-divider p-4 z-10"
      >
        <div class="container-app">
          <div class="flex justify-center">
            <BaseButton
              variant="ghost"
              size="sm"
              @click="showAnswersDialog = true"
              class="text-muted hover:text-brand-1 transition-colors"
            >
              <div class="i-carbon-view text-sm mr-2"></div>
              Voir les réponses
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Quit Confirmation Dialog -->
    <BaseModal
      v-model:isVisible="showQuitDialog"
      title="Quitter le quiz"
      @confirm="confirmQuit"
    >
      <p class="text-muted mb-4">Êtes-vous sûr de vouloir quitter le quiz ?</p>
      <div class="btn-group-end">
        <BaseButton
          variant="outline"
          class="btn-modal"
          @click="showQuitDialog = false"
        >
          Annuler
        </BaseButton>
        <BaseButton variant="secondary" class="btn-modal" @click="confirmQuit">
          Quitter
        </BaseButton>
      </div>
    </BaseModal>

    <!-- Restart Confirmation Dialog -->
    <BaseModal
      v-model:isVisible="showRestartDialog"
      title="Recommencer le quiz"
      @confirm="confirmRestart"
    >
      <p class="text-muted mb-4">
        Êtes-vous sûr de vouloir recommencer le quiz ? Toutes vos réponses
        actuelles seront perdues.
      </p>
      <div class="btn-group-end">
        <BaseButton
          variant="outline"
          class="btn-modal"
          @click="showRestartDialog = false"
        >
          Annuler
        </BaseButton>
        <BaseButton variant="primary" class="btn-modal" @click="confirmRestart">
          Recommencer
        </BaseButton>
      </div>
    </BaseModal>

    <!-- Password Dialog for Answers -->
    <BaseModal
      v-model:isVisible="showAnswersDialog"
      title="Accès aux réponses"
      @confirm="verifyPassword"
    >
      <div v-if="!isAnswersUnlocked">
        <p class="text-muted mb-4">
          Entrez le mot de passe pour voir les réponses :
        </p>
        <input
          ref="passwordInput"
          v-model="passwordValue"
          type="password"
          placeholder="Mot de passe"
          class="w-full px-3 py-2 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent"
          @keyup.enter="verifyPassword"
        />
        <p v-if="passwordError" class="text-red-1 text-sm mt-2">
          {{ passwordError }}
        </p>
      </div>
      <div v-else class="max-h-96 overflow-y-auto">
        <div class="space-y-4">
          <div
            v-for="(question, index) in quizStore.state.questions"
            :key="question.id"
            class="border border-divider rounded-lg p-3"
          >
            <div class="flex items-start gap-3">
              <div class="text-brand-1 font-medium text-sm">
                {{ index + 1 }}.
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium mb-2">{{ question.question }}</p>
                <div class="space-y-1">
                  <div
                    v-for="(answer, answerIndex) in question.answers"
                    :key="answerIndex"
                    class="flex items-center gap-2 text-xs"
                    :class="{
                      'text-green-1 font-medium':
                        answerIndex === question.correctAnswer,
                      'text-muted': answerIndex !== question.correctAnswer,
                    }"
                  >
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="{
                        'bg-green-1': answerIndex === question.correctAnswer,
                        'bg-divider': answerIndex !== question.correctAnswer,
                      }"
                    ></div>
                    {{ answer }}
                  </div>
                </div>
                <div
                  v-if="question.explanation"
                  class="mt-2 text-xs text-muted italic"
                >
                  {{ question.explanation }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="btn-group-end mt-4">
        <BaseButton
          v-if="!isAnswersUnlocked"
          variant="outline"
          class="btn-modal"
          @click="closeAnswersDialog"
        >
          Annuler
        </BaseButton>
        <BaseButton
          v-if="!isAnswersUnlocked"
          variant="primary"
          class="btn-modal"
          @click="verifyPassword"
        >
          Confirmer
        </BaseButton>
        <BaseButton
          v-else
          variant="outline"
          class="btn-modal"
          @click="closeAnswersDialog"
        >
          Fermer
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useQuizStore } from "@/stores/quiz";
import QuestionCard from "@/components/quiz/QuestionCard.vue";
import BaseCard from "@/components/ui/BaseCard.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseModal from "@/components/ui/BaseModal.vue";

const router = useRouter();
const quizStore = useQuizStore();

// Component state
const showQuitDialog = ref(false);
const showRestartDialog = ref(false);
const showAnswersDialog = ref(false);
const isSharing = ref(false);
const shareSuccess = ref(false);
const passwordValue = ref("");
const passwordError = ref("");
const isAnswersUnlocked = ref(false);
const passwordInput = ref<HTMLInputElement | null>(null);

// Constants
const ANSWERS_PASSWORD = "1861";

// Methods
const handleAnswer = (answerIndex: number) => {
  quizStore.answerQuestion(answerIndex);
};

const handleNext = () => {
  const hasNext = quizStore.goToNextQuestion();
  if (!hasNext) {
    // Quiz completed, redirect to results
    router.push("/results");
  }
};

const handlePrevious = () => {
  quizStore.goToPreviousQuestion();
};

const retryLoadQuestions = async () => {
  try {
    await quizStore.loadQuestionsFromJSON();
  } catch (error) {
    console.error("Failed to reload questions:", error);
  }
};

const goHome = () => {
  router.push("/");
};

const confirmQuit = () => {
  router.push("/");
};

const confirmRestart = () => {
  quizStore.resetQuiz();
  showRestartDialog.value = false;
};

const verifyPassword = () => {
  if (passwordValue.value === ANSWERS_PASSWORD) {
    isAnswersUnlocked.value = true;
    passwordError.value = "";
  } else {
    passwordError.value = "Mot de passe incorrect";
    passwordValue.value = "";
  }
};

const closeAnswersDialog = () => {
  showAnswersDialog.value = false;
  passwordValue.value = "";
  passwordError.value = "";
  isAnswersUnlocked.value = false;
};

// Watch for answers dialog opening to focus password input
watch(showAnswersDialog, async (newValue) => {
  if (newValue && !isAnswersUnlocked.value) {
    await nextTick();
    passwordInput.value?.focus();
  }
});

const shareQuiz = async () => {
  if (isSharing.value) return;

  isSharing.value = true;
  shareSuccess.value = false;

  try {
    // Get current quiz data
    const quizData = {
      questions: quizStore.state.questions,
      metadata: {
        title: "Quiz Cinéma Partagé",
        description: "Quiz généré et partagé via CinéQuiz",
        totalQuestions: quizStore.state.questions.length,
        createdAt: new Date().toISOString(),
      },
    };

    // Encode quiz data as base64 URL parameter
    const encodedQuiz = btoa(encodeURIComponent(JSON.stringify(quizData)));
    const shareUrl = `https://cinequizapp.netlify.app/?quiz=${encodedQuiz}`;

    // Try to use Web Share API if available, otherwise copy to clipboard
    if (navigator.share) {
      await navigator.share({
        title: "Quiz Cinéma - CinéQuiz",
        text: `Découvrez ce quiz cinéma de ${quizData.questions.length} questions !`,
        url: shareUrl,
      });
      shareSuccess.value = true;
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      shareSuccess.value = true;

      // Show success feedback
      setTimeout(() => {
        shareSuccess.value = false;
      }, 2000);
    } else {
      // Fallback: show the URL in a prompt
      const userCopied = prompt(
        "Copiez ce lien pour partager le quiz:",
        shareUrl
      );
      if (userCopied !== null) {
        shareSuccess.value = true;
        setTimeout(() => {
          shareSuccess.value = false;
        }, 2000);
      }
    }
  } catch (error) {
    console.error("Erreur lors du partage:", error);
    // Don't show alert, just log the error
  } finally {
    isSharing.value = false;
  }
};

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

// Watch for quiz completion and redirect
watch(
  () => quizStore.state.isCompleted,
  (completed) => {
    if (completed) {
      router.push("/results");
    }
  }
);

// Load questions if not already loaded
onMounted(async () => {
  // First, try to load quiz from URL parameter (shared quiz)
  const quizLoadedFromUrl = loadQuizFromUrl();

  // If no quiz was loaded from URL and no questions in store, load default quiz
  if (!quizLoadedFromUrl && quizStore.state.questions.length === 0) {
    await quizStore.loadQuestionsFromJSON();
  }
});
</script>

<style scoped>
/* Quiz-specific styles */
.quiz-progress {
  background: linear-gradient(
    to right,
    var(--color-brand-1) 0%,
    var(--color-brand-1) var(--progress),
    var(--color-bg-soft) var(--progress),
    var(--color-bg-soft) 100%
  );
}
</style>
