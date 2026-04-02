"""
Exercise templates defining ideal biomechanical angles for each exercise mode.

Each template contains:
  - name: Exercise identifier
  - description: What the exercise targets
  - ideal_angles: Dict of joint angle name → (min, max) acceptable range in degrees
  - feedback_messages: Dict of joint angle name → corrective instruction
  - risk_thresholds: Dict of joint angle name → dangerous threshold

Architecture Note:
  This module acts as the "knowledge base" for the rule-based posture classifier.
  When a future ML model is integrated, it can either learn these thresholds
  or bypass them entirely, while the template structure remains useful for
  generating human-readable feedback.
"""

EXERCISE_TEMPLATES = {
    "squat": {
        "name": "Squat Form",
        "description": "Monitor squat depth, knee alignment, and back angle for safe and effective squats.",
        "icon": "🏋️",
        "ideal_angles": {
            "left_knee": (70, 110),
            "right_knee": (70, 110),
            "left_hip": (70, 120),
            "right_hip": (70, 120),
            "spine_angle": (160, 180),  # Upright spine
        },
        "feedback_messages": {
            "left_knee": "Bend your left knee more — aim for 90°",
            "right_knee": "Bend your right knee more — aim for 90°",
            "left_hip": "Lower your hips further into the squat",
            "right_hip": "Lower your hips further into the squat",
            "spine_angle": "Keep your back straight — avoid leaning forward",
        },
        "risk_thresholds": {
            "left_knee": (0, 60),   # Too deep — knee strain risk
            "right_knee": (0, 60),
            "spine_angle": (0, 140),  # Excessive forward lean
        },
    },

    "shoulder_stretch": {
        "name": "Shoulder Stretch",
        "description": "Track shoulder mobility and arm extension for effective shoulder stretches.",
        "icon": "🤸",
        "ideal_angles": {
            "left_shoulder": (150, 180),
            "right_shoulder": (150, 180),
            "left_elbow": (160, 180),  # Fully extended
            "right_elbow": (160, 180),
        },
        "feedback_messages": {
            "left_shoulder": "Raise your left arm higher",
            "right_shoulder": "Raise your right arm higher",
            "left_elbow": "Straighten your left elbow fully",
            "right_elbow": "Straighten your right elbow fully",
        },
        "risk_thresholds": {},
    },

    "back_posture": {
        "name": "Back Posture Monitoring",
        "description": "Monitor sitting or standing posture to prevent slouching and back pain.",
        "icon": "🧘",
        "ideal_angles": {
            "spine_angle": (165, 180),
            "neck_angle": (160, 180),
        },
        "feedback_messages": {
            "spine_angle": "Straighten your back — you're slouching",
            "neck_angle": "Look straight ahead — your neck is tilting forward",
        },
        "risk_thresholds": {
            "spine_angle": (0, 145),  # Severe slouch
            "neck_angle": (0, 140),   # Severe forward head posture
        },
    },

    "neck_posture": {
        "name": "Neck Posture Correction",
        "description": "Detect forward neck posture and guide proper head alignment.",
        "icon": "🦒",
        "ideal_angles": {
            "neck_angle": (165, 180),
            "neck_tilt": (0, 15),  # Lateral tilt in degrees
        },
        "feedback_messages": {
            "neck_angle": "Pull your chin back — your head is too far forward",
            "neck_tilt": "Level your head — you're tilting to one side",
        },
        "risk_thresholds": {
            "neck_angle": (0, 140),
        },
    },

    "general": {
        "name": "General Posture",
        "description": "Overall posture monitoring for balanced standing or sitting position.",
        "icon": "🧍",
        "ideal_angles": {
            "spine_angle": (165, 180),
            "neck_angle": (160, 180),
            "left_shoulder": (80, 100),
            "right_shoulder": (80, 100),
        },
        "feedback_messages": {
            "spine_angle": "Straighten your back",
            "neck_angle": "Align your head with your spine",
            "left_shoulder": "Relax your left shoulder — keep it level",
            "right_shoulder": "Relax your right shoulder — keep it level",
        },
        "risk_thresholds": {
            "spine_angle": (0, 145),
        },
    },
}


def get_exercise_list():
    """Return a summary list of available exercises."""
    return [
        {
            "id": key,
            "name": template["name"],
            "description": template["description"],
            "icon": template["icon"],
        }
        for key, template in EXERCISE_TEMPLATES.items()
    ]


def get_template(exercise_type: str) -> dict:
    """
    Retrieve a specific exercise template.
    Falls back to 'general' if the exercise type is not found.
    """
    return EXERCISE_TEMPLATES.get(exercise_type, EXERCISE_TEMPLATES["general"])
