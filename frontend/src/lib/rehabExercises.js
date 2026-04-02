/**
 * Extended Exercise Templates — Rehab exercise library (client-side)
 *
 * Contains 17 clinically common rehabilitation exercises organized
 * by body region, with movement phase definitions for the state machine.
 */

export const REHAB_EXERCISES = {
  // ── Upper Body ────────────────────────────────────────
  shoulder_abduction: {
    name: "Shoulder Abduction", category: "upper_body", icon: "🤾",
    description: "Raise arms out to the sides to improve shoulder mobility.",
    primaryAngle: "left_shoulder",
    phases: {
      start: { left_shoulder: [0, 30], right_shoulder: [0, 30] },
      movement: { left_shoulder: [30, 120], right_shoulder: [30, 120] },
      end: { left_shoulder: [120, 180], right_shoulder: [120, 180] },
    },
    idealForm: { spine_angle: [165, 180], left_elbow: [160, 180], right_elbow: [160, 180] },
    formFeedback: { spine_angle: "Keep your back straight — don't lean", left_elbow: "Keep your left arm straight", right_elbow: "Keep your right arm straight" },
    defaults: { reps: 12, sets: 3, rest: 30 },
  },
  shoulder_flexion: {
    name: "Shoulder Flexion", category: "upper_body", icon: "🙋",
    description: "Raise arms forward and overhead for shoulder range of motion.",
    primaryAngle: "left_shoulder",
    phases: { start: { left_shoulder: [0, 30] }, movement: { left_shoulder: [30, 130] }, end: { left_shoulder: [130, 180] } },
    idealForm: { spine_angle: [165, 180], left_elbow: [160, 180] },
    formFeedback: { spine_angle: "Keep your spine upright", left_elbow: "Straighten your elbow fully" },
    defaults: { reps: 10, sets: 3, rest: 30 },
  },
  wall_angels: {
    name: "Wall Angels", category: "upper_body", icon: "👼",
    description: "Slide arms up and down against a wall for upper back mobility.",
    primaryAngle: "left_shoulder",
    phases: { start: { left_shoulder: [60, 100] }, movement: { left_shoulder: [100, 150] }, end: { left_shoulder: [150, 180] } },
    idealForm: { spine_angle: [170, 180] },
    formFeedback: { spine_angle: "Press your back flat against the wall" },
    defaults: { reps: 10, sets: 3, rest: 30 },
  },
  arm_raises: {
    name: "Arm Raises", category: "upper_body", icon: "🙌",
    description: "Raise arms overhead alternately or together.",
    primaryAngle: "left_shoulder",
    phases: { start: { left_shoulder: [0, 30] }, movement: { left_shoulder: [30, 140] }, end: { left_shoulder: [140, 180] } },
    idealForm: { spine_angle: [165, 180] },
    formFeedback: { spine_angle: "Don't arch your back while raising arms" },
    defaults: { reps: 12, sets: 3, rest: 25 },
  },
  shoulder_rolls: {
    name: "Shoulder Rolls", category: "upper_body", icon: "🔄",
    description: "Roll shoulders in circles to relieve tension.",
    primaryAngle: "left_shoulder",
    phases: { start: { left_shoulder: [70, 110] }, movement: { left_shoulder: [50, 130] }, end: { left_shoulder: [70, 110] } },
    idealForm: { spine_angle: [165, 180], neck_angle: [160, 180] },
    formFeedback: { spine_angle: "Keep torso still — only move shoulders", neck_angle: "Relax your neck during the roll" },
    defaults: { reps: 10, sets: 2, rest: 20 },
  },

  // ── Lower Body ────────────────────────────────────────
  bodyweight_squat: {
    name: "Bodyweight Squat", category: "lower_body", icon: "🏋️",
    description: "Full bodyweight squat for lower body strength and mobility.",
    primaryAngle: "left_hip",
    phases: { start: { left_hip: [155, 180], left_knee: [155, 180] }, movement: { left_hip: [90, 155], left_knee: [90, 155] }, end: { left_hip: [60, 100], left_knee: [60, 100] } },
    idealForm: { spine_angle: [155, 180] },
    formFeedback: { spine_angle: "Keep your back straight — avoid rounding" },
    defaults: { reps: 12, sets: 3, rest: 45 },
  },
  lunge: {
    name: "Lunge", category: "lower_body", icon: "🚶",
    description: "Forward lunge for quad, glute, and hip flexor rehabilitation.",
    primaryAngle: "left_knee",
    phases: { start: { left_knee: [155, 180] }, movement: { left_knee: [100, 155] }, end: { left_knee: [75, 105] } },
    idealForm: { spine_angle: [165, 180] },
    formFeedback: { spine_angle: "Keep your torso upright during the lunge" },
    defaults: { reps: 10, sets: 3, rest: 40 },
  },
  calf_raise: {
    name: "Calf Raise", category: "lower_body", icon: "🦶",
    description: "Rise up on toes to strengthen calves and ankles.",
    primaryAngle: "left_knee",
    phases: { start: { left_knee: [165, 180] }, movement: { left_knee: [160, 180] }, end: { left_knee: [170, 180] } },
    idealForm: { spine_angle: [170, 180] },
    formFeedback: { spine_angle: "Keep your body straight — don't lean forward" },
    defaults: { reps: 15, sets: 3, rest: 30 },
  },
  glute_bridge: {
    name: "Glute Bridge", category: "lower_body", icon: "🌉",
    description: "Lift hips from supine position to strengthen glutes and hamstrings.",
    primaryAngle: "left_hip",
    phases: { start: { left_hip: [60, 100] }, movement: { left_hip: [100, 150] }, end: { left_hip: [150, 180] } },
    idealForm: { left_knee: [80, 110] },
    formFeedback: { left_knee: "Keep knees at 90° — don't let them splay out" },
    defaults: { reps: 12, sets: 3, rest: 30 },
  },

  // ── Back & Spine ──────────────────────────────────────
  cat_cow: {
    name: "Cat-Cow Stretch", category: "back_spine", icon: "🐱",
    description: "Alternate between arching and rounding the spine for flexibility.",
    primaryAngle: "spine_angle",
    phases: { start: { spine_angle: [160, 180] }, movement: { spine_angle: [130, 160] }, end: { spine_angle: [160, 180] } },
    idealForm: {},
    formFeedback: {},
    defaults: { reps: 10, sets: 2, rest: 20 },
  },
  superman: {
    name: "Superman Exercise", category: "back_spine", icon: "🦸",
    description: "Lie face-down and lift arms and legs to strengthen lower back.",
    primaryAngle: "left_shoulder",
    phases: { start: { left_shoulder: [0, 30] }, movement: { left_shoulder: [30, 100] }, end: { left_shoulder: [100, 160] } },
    idealForm: { neck_angle: [160, 180] },
    formFeedback: { neck_angle: "Keep your neck neutral — don't look up" },
    defaults: { reps: 10, sets: 3, rest: 30 },
  },
  pelvic_tilt: {
    name: "Pelvic Tilt", category: "back_spine", icon: "🔃",
    description: "Tilt pelvis to flatten lower back against the floor.",
    primaryAngle: "left_hip",
    phases: { start: { left_hip: [140, 180] }, movement: { left_hip: [120, 145] }, end: { left_hip: [140, 180] } },
    idealForm: {},
    formFeedback: {},
    defaults: { reps: 12, sets: 2, rest: 20 },
  },
  bird_dog: {
    name: "Bird Dog", category: "back_spine", icon: "🐕",
    description: "Extend opposite arm and leg from all-fours for core stability.",
    primaryAngle: "left_shoulder",
    phases: { start: { left_shoulder: [60, 110] }, movement: { left_shoulder: [110, 160] }, end: { left_shoulder: [150, 180] } },
    idealForm: { spine_angle: [165, 180] },
    formFeedback: { spine_angle: "Keep your back flat — don't let hips sag" },
    defaults: { reps: 10, sets: 3, rest: 25 },
  },

  // ── Neck ──────────────────────────────────────────────
  neck_tilt_exercise: {
    name: "Neck Tilt", category: "neck", icon: "↔️",
    description: "Tilt head side-to-side to improve lateral neck flexibility.",
    primaryAngle: "neck_tilt",
    phases: { start: { neck_tilt: [0, 8] }, movement: { neck_tilt: [8, 20] }, end: { neck_tilt: [15, 35] } },
    idealForm: { spine_angle: [170, 180] },
    formFeedback: { spine_angle: "Keep your shoulders still" },
    defaults: { reps: 8, sets: 2, rest: 15 },
  },
  neck_rotation: {
    name: "Neck Rotation", category: "neck", icon: "🔁",
    description: "Rotate head left and right to improve rotational neck mobility.",
    primaryAngle: "neck_angle",
    phases: { start: { neck_angle: [160, 180] }, movement: { neck_angle: [140, 165] }, end: { neck_angle: [160, 180] } },
    idealForm: { spine_angle: [170, 180] },
    formFeedback: { spine_angle: "Don't move your shoulders — only turn your head" },
    defaults: { reps: 8, sets: 2, rest: 15 },
  },
  chin_tuck: {
    name: "Chin Tuck", category: "neck", icon: "🫣",
    description: "Pull chin back to correct forward head posture.",
    primaryAngle: "neck_angle",
    phases: { start: { neck_angle: [150, 170] }, movement: { neck_angle: [165, 180] }, end: { neck_angle: [172, 180] } },
    idealForm: { spine_angle: [170, 180] },
    formFeedback: { spine_angle: "Keep your spine straight" },
    defaults: { reps: 10, sets: 3, rest: 20 },
  },
};

export const CATEGORIES = {
  upper_body: { name: "Upper Body", icon: "💪", order: 0 },
  lower_body: { name: "Lower Body", icon: "🦵", order: 1 },
  back_spine: { name: "Back & Spine", icon: "🧘", order: 2 },
  neck: { name: "Neck", icon: "🦒", order: 3 },
};

export function getCategorizedExercises() {
  const result = {};
  for (const [catId, catMeta] of Object.entries(CATEGORIES).sort((a, b) => a[1].order - b[1].order)) {
    const exercises = Object.entries(REHAB_EXERCISES)
      .filter(([, ex]) => ex.category === catId)
      .map(([id, ex]) => ({ id, name: ex.name, icon: ex.icon, description: ex.description, defaults: ex.defaults }));
    result[catId] = { ...catMeta, exercises };
  }
  return result;
}

export function getExercise(id) {
  return REHAB_EXERCISES[id] || REHAB_EXERCISES.bodyweight_squat;
}
