"""
Physiotherapy Exercise Library

Contains clinically common rehabilitation exercises organized by body region.
Each exercise defines:
  - Movement phases (start, movement, end) with joint angle thresholds
  - Ideal angle ranges for form validation
  - Default workout parameters (reps, sets, rest time)
  - Feedback messages for common form errors

Architecture:
  The phase definitions drive the ExerciseStateMachine for rep detection.
  Each phase has entry conditions (angle thresholds) that must be met
  to transition to the next state.
"""

REHAB_EXERCISES = {
    # ── Upper Body Rehabilitation ───────────────────────────────

    "shoulder_abduction": {
        "name": "Shoulder Abduction",
        "category": "upper_body",
        "description": "Raise arms out to the sides to improve shoulder mobility.",
        "icon": "🤾",
        "target_joints": ["left_shoulder", "right_shoulder"],
        "primary_angle": "left_shoulder",
        "phases": {
            "start": {"left_shoulder": [0, 30], "right_shoulder": [0, 30]},
            "movement": {"left_shoulder": [30, 120], "right_shoulder": [30, 120]},
            "end": {"left_shoulder": [120, 180], "right_shoulder": [120, 180]},
        },
        "ideal_form": {
            "spine_angle": [165, 180],
            "left_elbow": [160, 180],
            "right_elbow": [160, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your back straight — don't lean",
            "left_elbow": "Keep your left arm straight",
            "right_elbow": "Keep your right arm straight",
        },
        "defaults": {"reps": 12, "sets": 3, "rest_seconds": 30},
    },

    "shoulder_flexion": {
        "name": "Shoulder Flexion",
        "category": "upper_body",
        "description": "Raise arms forward and overhead for shoulder range of motion.",
        "icon": "🙋",
        "target_joints": ["left_shoulder", "right_shoulder"],
        "primary_angle": "left_shoulder",
        "phases": {
            "start": {"left_shoulder": [0, 30]},
            "movement": {"left_shoulder": [30, 130]},
            "end": {"left_shoulder": [130, 180]},
        },
        "ideal_form": {
            "spine_angle": [165, 180],
            "left_elbow": [160, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your spine upright",
            "left_elbow": "Straighten your elbow fully",
        },
        "defaults": {"reps": 10, "sets": 3, "rest_seconds": 30},
    },

    "wall_angels": {
        "name": "Wall Angels",
        "category": "upper_body",
        "description": "Slide arms up and down against a wall for upper back mobility.",
        "icon": "👼",
        "target_joints": ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow"],
        "primary_angle": "left_shoulder",
        "phases": {
            "start": {"left_shoulder": [60, 100], "left_elbow": [70, 100]},
            "movement": {"left_shoulder": [100, 150]},
            "end": {"left_shoulder": [150, 180], "left_elbow": [160, 180]},
        },
        "ideal_form": {
            "spine_angle": [170, 180],
        },
        "form_feedback": {
            "spine_angle": "Press your back flat against the wall",
        },
        "defaults": {"reps": 10, "sets": 3, "rest_seconds": 30},
    },

    "arm_raises": {
        "name": "Arm Raises",
        "category": "upper_body",
        "description": "Raise arms overhead alternately or together.",
        "icon": "🙌",
        "target_joints": ["left_shoulder", "right_shoulder"],
        "primary_angle": "left_shoulder",
        "phases": {
            "start": {"left_shoulder": [0, 30]},
            "movement": {"left_shoulder": [30, 140]},
            "end": {"left_shoulder": [140, 180]},
        },
        "ideal_form": {
            "spine_angle": [165, 180],
        },
        "form_feedback": {
            "spine_angle": "Don't arch your back while raising arms",
        },
        "defaults": {"reps": 12, "sets": 3, "rest_seconds": 25},
    },

    "shoulder_rolls": {
        "name": "Shoulder Rolls",
        "category": "upper_body",
        "description": "Roll shoulders in circles to relieve tension.",
        "icon": "🔄",
        "target_joints": ["left_shoulder", "right_shoulder"],
        "primary_angle": "left_shoulder",
        "phases": {
            "start": {"left_shoulder": [70, 110]},
            "movement": {"left_shoulder": [50, 130]},
            "end": {"left_shoulder": [70, 110]},
        },
        "ideal_form": {
            "spine_angle": [165, 180],
            "neck_angle": [160, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep torso still — only move shoulders",
            "neck_angle": "Relax your neck during the roll",
        },
        "defaults": {"reps": 10, "sets": 2, "rest_seconds": 20},
    },

    # ── Lower Body Rehabilitation ───────────────────────────────

    "bodyweight_squat": {
        "name": "Bodyweight Squat",
        "category": "lower_body",
        "description": "Full bodyweight squat for lower body strength and mobility.",
        "icon": "🏋️",
        "target_joints": ["left_knee", "right_knee", "left_hip", "right_hip"],
        "primary_angle": "left_hip",
        "phases": {
            "start": {"left_hip": [155, 180], "left_knee": [155, 180]},
            "movement": {"left_hip": [90, 155], "left_knee": [90, 155]},
            "end": {"left_hip": [60, 100], "left_knee": [60, 100]},
        },
        "ideal_form": {
            "spine_angle": [155, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your back straight — avoid rounding",
        },
        "defaults": {"reps": 12, "sets": 3, "rest_seconds": 45},
    },

    "lunge": {
        "name": "Lunge",
        "category": "lower_body",
        "description": "Forward lunge for quad, glute, and hip flexor rehabilitation.",
        "icon": "🚶",
        "target_joints": ["left_knee", "right_knee"],
        "primary_angle": "left_knee",
        "phases": {
            "start": {"left_knee": [155, 180]},
            "movement": {"left_knee": [100, 155]},
            "end": {"left_knee": [75, 105]},
        },
        "ideal_form": {
            "spine_angle": [165, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your torso upright during the lunge",
        },
        "defaults": {"reps": 10, "sets": 3, "rest_seconds": 40},
    },

    "calf_raise": {
        "name": "Calf Raise",
        "category": "lower_body",
        "description": "Rise up on toes to strengthen calves and ankles.",
        "icon": "🦶",
        "target_joints": ["left_knee", "right_knee"],
        "primary_angle": "left_knee",
        "phases": {
            "start": {"left_knee": [165, 180]},
            "movement": {"left_knee": [160, 180]},
            "end": {"left_knee": [170, 180]},
        },
        "ideal_form": {
            "spine_angle": [170, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your body straight — don't lean forward",
        },
        "defaults": {"reps": 15, "sets": 3, "rest_seconds": 30},
    },

    "glute_bridge": {
        "name": "Glute Bridge",
        "category": "lower_body",
        "description": "Lift hips from supine position to strengthen glutes and hamstrings.",
        "icon": "🌉",
        "target_joints": ["left_hip", "right_hip", "left_knee", "right_knee"],
        "primary_angle": "left_hip",
        "phases": {
            "start": {"left_hip": [60, 100], "left_knee": [60, 100]},
            "movement": {"left_hip": [100, 150]},
            "end": {"left_hip": [150, 180]},
        },
        "ideal_form": {
            "left_knee": [80, 110],
        },
        "form_feedback": {
            "left_knee": "Keep knees at 90° — don't let them splay out",
        },
        "defaults": {"reps": 12, "sets": 3, "rest_seconds": 30},
    },

    # ── Back and Spine Rehabilitation ───────────────────────────

    "cat_cow": {
        "name": "Cat-Cow Stretch",
        "category": "back_spine",
        "description": "Alternate between arching and rounding the spine for flexibility.",
        "icon": "🐱",
        "target_joints": ["spine_angle"],
        "primary_angle": "spine_angle",
        "phases": {
            "start": {"spine_angle": [160, 180]},
            "movement": {"spine_angle": [130, 160]},
            "end": {"spine_angle": [160, 180]},
        },
        "ideal_form": {},
        "form_feedback": {},
        "defaults": {"reps": 10, "sets": 2, "rest_seconds": 20},
    },

    "superman": {
        "name": "Superman Exercise",
        "category": "back_spine",
        "description": "Lie face-down and lift arms and legs to strengthen lower back.",
        "icon": "🦸",
        "target_joints": ["left_shoulder", "left_hip"],
        "primary_angle": "left_shoulder",
        "phases": {
            "start": {"left_shoulder": [0, 30]},
            "movement": {"left_shoulder": [30, 100]},
            "end": {"left_shoulder": [100, 160]},
        },
        "ideal_form": {
            "neck_angle": [160, 180],
        },
        "form_feedback": {
            "neck_angle": "Keep your neck neutral — don't look up",
        },
        "defaults": {"reps": 10, "sets": 3, "rest_seconds": 30},
    },

    "pelvic_tilt": {
        "name": "Pelvic Tilt",
        "category": "back_spine",
        "description": "Tilt pelvis to flatten lower back against the floor.",
        "icon": "🔃",
        "target_joints": ["left_hip", "spine_angle"],
        "primary_angle": "left_hip",
        "phases": {
            "start": {"left_hip": [140, 180]},
            "movement": {"left_hip": [120, 145]},
            "end": {"left_hip": [140, 180]},
        },
        "ideal_form": {},
        "form_feedback": {},
        "defaults": {"reps": 12, "sets": 2, "rest_seconds": 20},
    },

    "bird_dog": {
        "name": "Bird Dog",
        "category": "back_spine",
        "description": "Extend opposite arm and leg from all-fours for core stability.",
        "icon": "🐕",
        "target_joints": ["left_shoulder", "right_hip"],
        "primary_angle": "left_shoulder",
        "phases": {
            "start": {"left_shoulder": [60, 110]},
            "movement": {"left_shoulder": [110, 160]},
            "end": {"left_shoulder": [150, 180]},
        },
        "ideal_form": {
            "spine_angle": [165, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your back flat — don't let hips sag",
        },
        "defaults": {"reps": 10, "sets": 3, "rest_seconds": 25},
    },

    # ── Neck Rehabilitation ─────────────────────────────────────

    "neck_tilt_exercise": {
        "name": "Neck Tilt",
        "category": "neck",
        "description": "Tilt head side-to-side to improve lateral neck flexibility.",
        "icon": "↔️",
        "target_joints": ["neck_tilt"],
        "primary_angle": "neck_tilt",
        "phases": {
            "start": {"neck_tilt": [0, 8]},
            "movement": {"neck_tilt": [8, 20]},
            "end": {"neck_tilt": [15, 35]},
        },
        "ideal_form": {
            "spine_angle": [170, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your shoulders still",
        },
        "defaults": {"reps": 8, "sets": 2, "rest_seconds": 15},
    },

    "neck_rotation": {
        "name": "Neck Rotation",
        "category": "neck",
        "description": "Rotate head left and right to improve rotational neck mobility.",
        "icon": "🔁",
        "target_joints": ["neck_angle"],
        "primary_angle": "neck_angle",
        "phases": {
            "start": {"neck_angle": [160, 180]},
            "movement": {"neck_angle": [140, 165]},
            "end": {"neck_angle": [160, 180]},
        },
        "ideal_form": {
            "spine_angle": [170, 180],
        },
        "form_feedback": {
            "spine_angle": "Don't move your shoulders — only turn your head",
        },
        "defaults": {"reps": 8, "sets": 2, "rest_seconds": 15},
    },

    "chin_tuck": {
        "name": "Chin Tuck",
        "category": "neck",
        "description": "Pull chin back to correct forward head posture.",
        "icon": "🫣",
        "target_joints": ["neck_angle"],
        "primary_angle": "neck_angle",
        "phases": {
            "start": {"neck_angle": [150, 170]},
            "movement": {"neck_angle": [165, 180]},
            "end": {"neck_angle": [172, 180]},
        },
        "ideal_form": {
            "spine_angle": [170, 180],
        },
        "form_feedback": {
            "spine_angle": "Keep your spine straight",
        },
        "defaults": {"reps": 10, "sets": 3, "rest_seconds": 20},
    },
}

# Category metadata for UI grouping
CATEGORIES = {
    "upper_body": {"name": "Upper Body Rehabilitation", "icon": "💪", "order": 0},
    "lower_body": {"name": "Lower Body Rehabilitation", "icon": "🦵", "order": 1},
    "back_spine": {"name": "Back & Spine Rehabilitation", "icon": "🧘", "order": 2},
    "neck": {"name": "Neck Rehabilitation", "icon": "🦒", "order": 3},
}


def get_categorized_exercises():
    """Return exercises grouped by category with metadata."""
    result = {}
    for cat_id, cat_meta in sorted(CATEGORIES.items(), key=lambda x: x[1]["order"]):
        exercises = [
            {"id": ex_id, "name": ex["name"], "icon": ex["icon"], "description": ex["description"]}
            for ex_id, ex in REHAB_EXERCISES.items()
            if ex["category"] == cat_id
        ]
        result[cat_id] = {**cat_meta, "exercises": exercises}
    return result


def get_exercise(exercise_id: str) -> dict:
    """Retrieve a specific exercise. Falls back to bodyweight_squat."""
    return REHAB_EXERCISES.get(exercise_id, REHAB_EXERCISES["bodyweight_squat"])
