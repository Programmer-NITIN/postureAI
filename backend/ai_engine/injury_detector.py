"""
Injury Risk Detection Module

Detects specific dangerous movement patterns that could lead to injury.
Each detector is a pure function that takes landmark data and returns
a list of risk alerts.

Detected Risks:
  1. Knee Valgus (collapse) during squats
  2. Excessive Forward Head Posture (FHP)
  3. Unsafe Spinal Flexion

The risk detectors are independent of the exercise template system
and provide an additional safety layer.
"""

from typing import List, Dict


def detect_knee_valgus(landmarks: list) -> List[str]:
    """
    Detect knee valgus (inward collapse) by checking if knees
    are medial to the line between hip and ankle.

    In 2D (frontal view), knee valgus manifests as the knee's
    x-coordinate being significantly medial to the hip-ankle line.
    """
    alerts = []
    if not landmarks or len(landmarks) < 33:
        return alerts

    # Left side: hip(23), knee(25), ankle(27)
    left_hip_x = landmarks[23]["x"]
    left_knee_x = landmarks[25]["x"]
    left_ankle_x = landmarks[27]["x"]

    # Expected: knee.x between hip.x and ankle.x (roughly)
    # Valgus: knee goes too far inward
    hip_ankle_mid_x = (left_hip_x + left_ankle_x) / 2
    if abs(left_knee_x - hip_ankle_mid_x) > 0.05:
        deviation = left_knee_x - hip_ankle_mid_x
        if abs(deviation) > 0.08:
            alerts.append("⚠️ Left knee valgus detected — keep your knee aligned over your foot")

    # Right side: hip(24), knee(26), ankle(28)
    right_hip_x = landmarks[24]["x"]
    right_knee_x = landmarks[26]["x"]
    right_ankle_x = landmarks[28]["x"]

    hip_ankle_mid_x = (right_hip_x + right_ankle_x) / 2
    if abs(right_knee_x - hip_ankle_mid_x) > 0.05:
        deviation = right_knee_x - hip_ankle_mid_x
        if abs(deviation) > 0.08:
            alerts.append("⚠️ Right knee valgus detected — keep your knee aligned over your foot")

    return alerts


def detect_forward_head_posture(landmarks: list) -> List[str]:
    """
    Detect excessive forward head posture (FHP).

    FHP is detected when the nose is significantly forward
    of the shoulder midpoint. In the side/angled view, this
    manifests as a large x-offset between nose and shoulder center.
    """
    alerts = []
    if not landmarks or len(landmarks) < 33:
        return alerts

    nose = landmarks[0]
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    shoulder_mid_y = (left_shoulder["y"] + right_shoulder["y"]) / 2
    nose_y = nose["y"]

    # In MediaPipe's coordinate system, y increases downward
    # Forward head posture: nose is significantly above shoulder midpoint
    # but also forward (we use the y-difference as a proxy since
    # we're often viewing from the front/side)
    shoulder_mid_x = (left_shoulder["x"] + right_shoulder["x"]) / 2
    head_offset = abs(nose["x"] - shoulder_mid_x)

    # Also check vertical: nose should not be too far forward
    if head_offset > 0.12:
        alerts.append("⚠️ Forward head posture detected — pull your chin back and align your ears with your shoulders")

    return alerts


def detect_unsafe_spine_flexion(landmarks: list) -> List[str]:
    """
    Detect unsafe spinal flexion by measuring the forward lean
    of the torso (shoulder midpoint relative to hip midpoint).
    """
    alerts = []
    if not landmarks or len(landmarks) < 33:
        return alerts

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_hip = landmarks[23]
    right_hip = landmarks[24]

    shoulder_mid_x = (left_shoulder["x"] + right_shoulder["x"]) / 2
    hip_mid_x = (left_hip["x"] + right_hip["x"]) / 2

    shoulder_mid_y = (left_shoulder["y"] + right_shoulder["y"]) / 2
    hip_mid_y = (left_hip["y"] + right_hip["y"]) / 2

    # Forward lean: shoulders significantly offset from hips horizontally
    forward_lean = abs(shoulder_mid_x - hip_mid_x)

    if forward_lean > 0.15:
        alerts.append("⚠️ Unsafe spine flexion — your back is bending too far forward, risk of lower back injury")

    return alerts


def run_all_detectors(landmarks: list) -> List[str]:
    """
    Run all injury risk detectors on the current frame.

    Args:
        landmarks: List of 33 MediaPipe landmark dicts

    Returns:
        Combined list of all risk alerts
    """
    alerts = []
    alerts.extend(detect_knee_valgus(landmarks))
    alerts.extend(detect_forward_head_posture(landmarks))
    alerts.extend(detect_unsafe_spine_flexion(landmarks))
    return alerts
