"""
Posture Classification Engine

Compares detected joint angles against ideal biomechanical templates
and classifies posture into: CORRECT, INCORRECT, or DANGEROUS.

Architecture:
  This module uses a rule-based approach with a clean interface.
  The `classify()` function can be swapped out for an ML model
  by implementing the same interface:
    classify(angles: dict, exercise_type: str) -> ClassificationResult

Design:
  1. For each relevant angle, check if it falls within the ideal range
  2. If all angles are within range → CORRECT
  3. If any angle is in the risk zone → DANGEROUS
  4. Otherwise → INCORRECT
  5. Compute a score (0-100) based on how close angles are to ideal
"""

from dataclasses import dataclass, field
from typing import List
from backend.ai_engine.exercise_templates import get_template


@dataclass
class ClassificationResult:
    """Result of posture classification for a single frame."""
    classification: str           # "correct" | "incorrect" | "dangerous"
    score: float                   # 0-100 posture accuracy score
    feedback: List[str] = field(default_factory=list)
    risk_flags: List[str] = field(default_factory=list)

    def to_dict(self):
        return {
            "classification": self.classification,
            "score": round(self.score, 1),
            "feedback": self.feedback,
            "risk_flags": self.risk_flags,
        }


def _angle_score(angle: float, ideal_min: float, ideal_max: float) -> float:
    """
    Compute a score for a single angle relative to its ideal range.

    Returns:
        100 if perfectly within range, decreasing linearly as the angle
        deviates from the ideal range. Minimum 0.
    """
    if ideal_min <= angle <= ideal_max:
        return 100.0

    # How far outside the ideal range
    if angle < ideal_min:
        deviation = ideal_min - angle
    else:
        deviation = angle - ideal_max

    # Score decreases 2 points per degree of deviation
    score = max(0.0, 100.0 - deviation * 2.0)
    return score


def classify(angles: dict, exercise_type: str = "general") -> ClassificationResult:
    """
    Classify posture based on detected joint angles and exercise template.

    Args:
        angles: Dict of angle_name → angle_value (degrees)
        exercise_type: Key into EXERCISE_TEMPLATES

    Returns:
        ClassificationResult with classification, score, feedback, and risks
    """
    template = get_template(exercise_type)
    ideal_angles = template["ideal_angles"]
    feedback_messages = template["feedback_messages"]
    risk_thresholds = template.get("risk_thresholds", {})

    feedback = []
    risk_flags = []
    angle_scores = []

    for angle_name, (ideal_min, ideal_max) in ideal_angles.items():
        if angle_name not in angles:
            continue

        current_angle = angles[angle_name]
        score = _angle_score(current_angle, ideal_min, ideal_max)
        angle_scores.append(score)

        # Check if outside ideal range → generate feedback
        if score < 100.0 and angle_name in feedback_messages:
            feedback.append(feedback_messages[angle_name])

        # Check risk thresholds
        if angle_name in risk_thresholds:
            risk_min, risk_max = risk_thresholds[angle_name]
            if risk_min <= current_angle <= risk_max:
                risk_flags.append(f"⚠️ Dangerous {angle_name.replace('_', ' ')}: {current_angle:.0f}°")

    # Compute overall score
    if angle_scores:
        overall_score = sum(angle_scores) / len(angle_scores)
    else:
        overall_score = 50.0  # Unknown — not enough data

    # Determine classification
    if risk_flags:
        classification = "dangerous"
    elif overall_score >= 85.0:
        classification = "correct"
    else:
        classification = "incorrect"

    return ClassificationResult(
        classification=classification,
        score=overall_score,
        feedback=feedback,
        risk_flags=risk_flags,
    )
