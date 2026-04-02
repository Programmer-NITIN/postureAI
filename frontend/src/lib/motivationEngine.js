/**
 * Motivation Engine — Context-aware coaching messages
 *
 * Triggers motivational feedback based on workout progress.
 * Designed to feel like a human fitness trainer.
 */

import { speakMotivation, speakFormError } from "./voiceFeedback";

/**
 * Process state machine events and trigger appropriate motivation.
 *
 * @param {string[]} events - Events from the state machine update
 * @param {object} smState - Current state machine state
 * @param {string[]} formErrors - Current frame's form errors
 */
export function processEvents(events, smState, formErrors) {
  for (const event of events) {
    switch (event) {
      case "rep_complete": {
        const remaining = smState.targetReps - smState.currentRep;

        if (remaining === 0) {
          // Set complete handled by set_complete event
        } else if (remaining === 1) {
          speakMotivation("last_rep");
        } else if (remaining === 2) {
          speakMotivation("two_left");
        } else if (smState.currentRep === Math.floor(smState.targetReps / 2)) {
          speakMotivation("halfway");
        } else if (formErrors.length === 0 && Math.random() > 0.6) {
          speakMotivation("good_form");
        } else {
          speakMotivation("rep_done");
        }
        break;
      }

      case "set_complete":
        speakMotivation("set_done");
        break;

      case "workout_complete":
        speakMotivation("workout_done");
        break;

      case "movement_start":
        // Optionally encourage at start
        break;
    }
  }

  // Speak first form error if any (with cooldown managed by voiceFeedback)
  if (formErrors.length > 0 && smState.state === "moving") {
    speakFormError(formErrors[0]);
  }
}

/**
 * Get a text-based motivational message for the current progress.
 */
export function getMotivationText(currentRep, targetReps, currentSet, targetSets) {
  const remaining = targetReps - currentRep;
  const progress = currentRep / targetReps;

  if (remaining === 1) return "Last rep — give it your all! 🔥";
  if (remaining === 2) return "Almost there — just 2 more! 💪";
  if (progress >= 0.5 && progress < 0.6) return "Halfway done — great pace! 🎯";
  if (progress >= 0.75) return "Final stretch — keep pushing! ⚡";
  if (currentRep <= 2) return "Good start — find your rhythm 🏋️";
  return `Rep ${currentRep} / ${targetReps} — keep going! 💪`;
}
