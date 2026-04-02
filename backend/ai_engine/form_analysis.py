"""
Form Analysis Module

Evaluates the quality of each repetition by analyzing:
  - Range of motion (ROM) achieved vs. expected
  - Joint alignment during movement
  - Movement stability (angle variance)
  - Posture correctness throughout the rep

Returns a detailed per-rep quality report.
"""

from typing import Dict, List, Tuple


def score_range_of_motion(achieved_rom: float, expected_rom: float) -> float:
    """
    Score ROM as a percentage of the expected range.
    100% = full ROM achieved, <100% = partial ROM.
    Cap at 100 even if exceeding expected.
    """
    if expected_rom <= 0:
        return 100.0
    ratio = achieved_rom / expected_rom
    return min(100.0, ratio * 100.0)


def score_alignment(angles: Dict[str, float], ideal_form: Dict[str, Tuple[float, float]]) -> Tuple[float, List[str]]:
    """
    Score joint alignment against ideal form.
    Returns (score 0-100, list of error messages).
    """
    if not ideal_form:
        return 100.0, []

    scores = []
    errors = []

    for joint, (ideal_min, ideal_max) in ideal_form.items():
        if joint not in angles:
            continue
        angle = angles[joint]
        if ideal_min <= angle <= ideal_max:
            scores.append(100.0)
        else:
            deviation = min(abs(angle - ideal_min), abs(angle - ideal_max))
            joint_score = max(0, 100 - deviation * 2.5)
            scores.append(joint_score)
            if joint_score < 70:
                errors.append(f"{joint.replace('_', ' ')} misaligned ({angle:.0f}°)")

    avg = sum(scores) / len(scores) if scores else 100.0
    return avg, errors


def analyze_rep(
    rep_angles_history: List[Dict[str, float]],
    exercise_config: dict,
) -> dict:
    """
    Analyze a completed repetition.

    Args:
        rep_angles_history: List of angle snapshots during the rep
        exercise_config: Exercise configuration from exercise_library

    Returns:
        Analysis dict with scores and feedback
    """
    if not rep_angles_history:
        return {"score": 0, "feedback": ["No data captured for this rep"]}

    primary = exercise_config.get("primary_angle", "left_knee")
    ideal_form = exercise_config.get("ideal_form", {})

    # ROM analysis
    primary_angles = [a.get(primary, 0) for a in rep_angles_history if primary in a]
    if primary_angles:
        rom = max(primary_angles) - min(primary_angles)
    else:
        rom = 0

    # Expected ROM from phases
    phases = exercise_config.get("phases", {})
    start_range = phases.get("start", {}).get(primary, [0, 0])
    end_range = phases.get("end", {}).get(primary, [180, 180])
    expected_rom = abs(
        ((end_range[0] + end_range[1]) / 2) - ((start_range[0] + start_range[1]) / 2)
    )

    rom_score = score_range_of_motion(rom, expected_rom)

    # Form analysis across all frames
    all_alignment_scores = []
    all_errors = []
    for angles in rep_angles_history:
        alignment_score, errors = score_alignment(angles, ideal_form)
        all_alignment_scores.append(alignment_score)
        all_errors.extend(errors)

    avg_alignment = sum(all_alignment_scores) / len(all_alignment_scores) if all_alignment_scores else 100

    # Unique errors
    unique_errors = list(set(all_errors))

    # Overall score (weighted: 40% ROM + 60% form)
    overall_score = rom_score * 0.4 + avg_alignment * 0.6

    feedback = []
    if rom_score < 80:
        feedback.append("Try to achieve fuller range of motion")
    if avg_alignment < 80:
        feedback.append("Focus on maintaining proper alignment")
    feedback.extend(unique_errors[:3])

    return {
        "overall_score": round(overall_score, 1),
        "rom_score": round(rom_score, 1),
        "alignment_score": round(avg_alignment, 1),
        "rom_achieved": round(rom, 1),
        "rom_expected": round(expected_rom, 1),
        "form_errors": unique_errors,
        "feedback": feedback,
    }
