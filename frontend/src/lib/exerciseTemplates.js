/**
 * Exercise Templates — Client-side mirror of backend templates
 *
 * Contains ideal angle ranges, feedback messages, and risk thresholds
 * for each exercise mode. Used for instant client-side classification.
 */

export const EXERCISES = {
  squat: {
    name: "Squat Form",
    description: "Monitor squat depth, knee alignment, and back angle for safe and effective squats.",
    icon: "🏋️",
    idealAngles: {
      left_knee: [70, 110],
      right_knee: [70, 110],
      left_hip: [70, 120],
      right_hip: [70, 120],
      spine_angle: [160, 180],
    },
    feedbackMessages: {
      left_knee: "Bend your left knee more — aim for 90°",
      right_knee: "Bend your right knee more — aim for 90°",
      left_hip: "Lower your hips further into the squat",
      right_hip: "Lower your hips further into the squat",
      spine_angle: "Keep your back straight — avoid leaning forward",
    },
    riskThresholds: {
      left_knee: [0, 60],
      right_knee: [0, 60],
      spine_angle: [0, 140],
    },
  },

  shoulder_stretch: {
    name: "Shoulder Stretch",
    description: "Track shoulder mobility and arm extension for effective shoulder stretches.",
    icon: "🤸",
    idealAngles: {
      left_shoulder: [150, 180],
      right_shoulder: [150, 180],
      left_elbow: [160, 180],
      right_elbow: [160, 180],
    },
    feedbackMessages: {
      left_shoulder: "Raise your left arm higher",
      right_shoulder: "Raise your right arm higher",
      left_elbow: "Straighten your left elbow fully",
      right_elbow: "Straighten your right elbow fully",
    },
    riskThresholds: {},
  },

  back_posture: {
    name: "Back Posture Monitoring",
    description: "Monitor sitting or standing posture to prevent slouching and back pain.",
    icon: "🧘",
    idealAngles: {
      spine_angle: [165, 180],
      neck_angle: [160, 180],
    },
    feedbackMessages: {
      spine_angle: "Straighten your back — you're slouching",
      neck_angle: "Look straight ahead — your neck is tilting forward",
    },
    riskThresholds: {
      spine_angle: [0, 145],
      neck_angle: [0, 140],
    },
  },

  neck_posture: {
    name: "Neck Posture Correction",
    description: "Detect forward neck posture and guide proper head alignment.",
    icon: "🦒",
    idealAngles: {
      neck_angle: [165, 180],
      neck_tilt: [0, 15],
    },
    feedbackMessages: {
      neck_angle: "Pull your chin back — your head is too far forward",
      neck_tilt: "Level your head — you're tilting to one side",
    },
    riskThresholds: {
      neck_angle: [0, 140],
    },
  },

  general: {
    name: "General Posture",
    description: "Overall posture monitoring for balanced standing or sitting position.",
    icon: "🧍",
    idealAngles: {
      spine_angle: [165, 180],
      neck_angle: [160, 180],
      left_shoulder: [80, 100],
      right_shoulder: [80, 100],
    },
    feedbackMessages: {
      spine_angle: "Straighten your back",
      neck_angle: "Align your head with your spine",
      left_shoulder: "Relax your left shoulder — keep it level",
      right_shoulder: "Relax your right shoulder — keep it level",
    },
    riskThresholds: {
      spine_angle: [0, 145],
    },
  },
};

/**
 * Get a human-readable list of all exercises.
 */
export function getExerciseList() {
  return Object.entries(EXERCISES).map(([id, ex]) => ({
    id,
    name: ex.name,
    description: ex.description,
    icon: ex.icon,
  }));
}
