/**
 * Posture Classifier — Client-side rule engine
 *
 * Evaluates joint angles against exercise templates and produces
 * real-time classification (correct/incorrect/dangerous) plus feedback
 * messages without requiring a backend round-trip.
 */

import { EXERCISES } from "./exerciseTemplates";

/**
 * Score a single angle relative to its ideal range.
 * Returns 100 if within range, decreasing linearly with deviation.
 */
function angleScore(angle, idealMin, idealMax) {
  if (angle >= idealMin && angle <= idealMax) return 100;
  const deviation = angle < idealMin ? idealMin - angle : angle - idealMax;
  return Math.max(0, 100 - deviation * 2);
}

/**
 * Classify posture based on current angles and exercise type.
 *
 * @param {Object} angles - Dict of angle_name → value
 * @param {string} exerciseType - Exercise key
 * @returns {{ classification: string, score: number, feedback: string[], riskFlags: string[], jointStatus: Object }}
 */
export function classifyPosture(angles, exerciseType = "general") {
  const template = EXERCISES[exerciseType] || EXERCISES.general;
  const { idealAngles, feedbackMessages, riskThresholds } = template;

  const feedback = [];
  const riskFlags = [];
  const scores = [];
  const jointStatus = {}; // angle_name → "correct" | "incorrect" | "dangerous"

  for (const [angleName, [idealMin, idealMax]] of Object.entries(idealAngles)) {
    if (!(angleName in angles)) continue;

    const current = angles[angleName];
    const score = angleScore(current, idealMin, idealMax);
    scores.push(score);

    // Determine per-joint status
    if (score >= 85) {
      jointStatus[angleName] = "correct";
    } else {
      jointStatus[angleName] = "incorrect";
      if (feedbackMessages[angleName]) {
        feedback.push(feedbackMessages[angleName]);
      }
    }

    // Check risk
    if (riskThresholds[angleName]) {
      const [rMin, rMax] = riskThresholds[angleName];
      if (current >= rMin && current <= rMax) {
        jointStatus[angleName] = "dangerous";
        riskFlags.push(`⚠️ Dangerous ${angleName.replace(/_/g, " ")}: ${current.toFixed(0)}°`);
      }
    }
  }

  const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;

  let classification;
  if (riskFlags.length > 0) {
    classification = "dangerous";
  } else if (overallScore >= 85) {
    classification = "correct";
  } else {
    classification = "incorrect";
  }

  return { classification, score: Math.round(overallScore * 10) / 10, feedback, riskFlags, jointStatus };
}
