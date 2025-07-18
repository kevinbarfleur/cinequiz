<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <span class="flex-1 text-base leading-6 mobile:text-lg">{{ answer }}</span>

    <!-- Team Assignment Indicator (Host Mode) -->
    <div
      v-if="userMode === 'host' && assignedTeams.length > 0"
      class="ml-3 flex-shrink-0 flex items-center gap-2 animate-fade-in-scale"
    >
      <div
        class="bg-bg-soft text-brand-1 text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center border border-brand-1/30"
      >
        {{ assignedTeams.length }}
      </div>
      <div class="flex flex-col gap-1 max-w-32">
        <span
          v-for="teamName in assignedTeamNames"
          :key="teamName"
          class="text-xs font-medium text-brand-1 bg-bg-soft px-2 py-1 rounded border border-brand-1/30 whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {{ teamName }}
        </span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { UserMode } from "@/types";

interface Props {
  answer: string;
  isCorrect?: boolean;
  isSelected?: boolean;
  showResult?: boolean;
  disabled?: boolean;
  userMode?: UserMode;
  assignedTeams?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  isCorrect: false,
  isSelected: false,
  showResult: false,
  disabled: false,
  userMode: "participant",
  assignedTeams: () => [],
});

const emit = defineEmits<{
  click: [answer: string];
  "team-assignment-requested": [];
}>();

const isPressed = ref(false);

// Computed properties for mode-specific behavior
const shouldShowResultIndicator = computed(() => {
  // Only show result indicator when results should be shown AND not in participant mode
  return props.showResult && props.userMode !== "participant";
});

const assignedTeamNames = computed(() => {
  // For now, return the team IDs as names (parent should provide actual names)
  return props.assignedTeams || [];
});

const buttonClasses = computed(() => {
  const classes = [];

  // Base classes using UnoCSS
  classes.push(
    "w-full min-h-12 mobile:min-h-14 p-2 mobile:p-3",
    "rounded-xl font-medium text-left cursor-pointer",
    "flex items-center justify-between border-2 border-transparent",
    "outline-none relative overflow-hidden group",
    "transition-all duration-200 ease-out",
    "focus:ring-2 focus:ring-brand-1 focus:ring-offset-2",
    "select-none touch-manipulation"
  );

  // Mode-specific styling with UnoCSS semantic colors
  if (props.userMode === "host") {
    if (props.assignedTeams && props.assignedTeams.length > 0) {
      // Host mode - assigned state
      classes.push(
        "bg-brand-1/10 text-text-1 border border-brand-1/30",
        "shadow-sm",
        "hover:bg-brand-1/15 hover:border-brand-1/40 hover:shadow-md"
      );
    } else {
      // Host mode - normal state
      classes.push(
        "bg-bg text-text-1 border-border shadow-sm",
        "hover:border-brand-1/50 hover:bg-brand-1/5 hover:shadow-md"
      );
    }
  } else if (props.userMode === "participant") {
    if (props.isSelected) {
      // Participant mode - selected state
      classes.push(
        "bg-bg-soft text-brand-1 border border-brand-1",
        "shadow-md -translate-y-0.5",
        "hover:bg-brand-1/15 hover:-translate-y-1 hover:shadow-lg"
      );
    } else {
      // Participant mode - normal state
      classes.push(
        "bg-bg text-text-1 border-border shadow-sm",
        "hover:border-brand-1 hover:bg-brand-1/5 hover:-translate-y-0.5 hover:shadow-md"
      );
    }
  } else {
    // Default/legacy mode styling
    if (props.showResult) {
      if (props.isCorrect) {
        // Correct answer state
        classes.push(
          "bg-green-soft text-green-1 border-green-1",
          "shadow-md animate-pulse"
        );
      } else if (props.isSelected) {
        // Incorrect answer state
        classes.push(
          "bg-red-soft text-red-1 border-red-1",
          "shadow-md animate-shake"
        );
      } else {
        // Neutral state
        classes.push("bg-bg-soft text-text-3 border-divider opacity-60");
      }
    } else if (props.isSelected) {
      // Selected state
      classes.push(
        "bg-bg-soft text-brand-1 border border-brand-1",
        "shadow-md -translate-y-0.5"
      );
    } else {
      // Normal state
      classes.push(
        "bg-bg text-text-1 border-border shadow-sm",
        "hover:border-brand-1 hover:bg-brand-1/5 hover:-translate-y-0.5 hover:shadow-md"
      );
    }
  }

  // Pressed state for touch feedback
  if (isPressed.value) {
    classes.push("scale-95 shadow-sm transition-transform duration-100");
  }

  // Disabled state
  if (props.disabled) {
    classes.push("opacity-50 cursor-not-allowed pointer-events-none");
  }

  // Accessibility and motion preferences
  classes.push(
    "motion-reduce:transition-none motion-reduce:transform-none",
    "contrast-more:border-3"
  );

  return classes.join(" ");
});

const handleClick = () => {
  if (!props.disabled) {
    // Enhanced haptic feedback for mobile devices
    triggerHapticFeedback("selection");

    if (props.userMode === "host") {
      // In host mode, clicking triggers team assignment
      emit("team-assignment-requested");
    } else {
      // In participant mode or default, emit normal click
      emit("click", props.answer);
    }
  }
};

const triggerHapticFeedback = (type: "selection" | "success" | "error") => {
  if ("vibrate" in navigator) {
    switch (type) {
      case "selection":
        // Light tap for selection
        navigator.vibrate(50);
        break;
      case "success":
        // Double pulse for correct answer
        navigator.vibrate([100, 50, 100]);
        break;
      case "error":
        // Sharp buzz for incorrect answer
        navigator.vibrate([200, 100, 200]);
        break;
    }
  }
};

const handleTouchStart = () => {
  if (!props.disabled) {
    isPressed.value = true;
  }
};

const handleTouchEnd = () => {
  isPressed.value = false;
};

// Watch for result state changes to trigger haptic feedback (only in non-participant modes)
watch(
  () => props.showResult,
  (newShowResult) => {
    if (newShowResult && props.isSelected && props.userMode !== "participant") {
      // Trigger haptic feedback when results are revealed
      if (props.isCorrect) {
        triggerHapticFeedback("success");
      } else {
        triggerHapticFeedback("error");
      }
    }
  }
);
</script>

<style scoped>
/* Custom animations for UnoCSS components */
@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in-scale {
  animation: fade-in-scale 0.3s ease-out;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-scale {
    animation: none;
  }
}
</style>
