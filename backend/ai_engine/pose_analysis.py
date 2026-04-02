"""
Pose Analysis Module — Joint Angle Extraction

Takes a dictionary of body landmarks (as returned by MediaPipe)
and computes all biomechanically relevant joint angles.

MediaPipe Pose Landmark Indices:
  0: nose, 11: left_shoulder, 12: right_shoulder,
  13: left_elbow, 14: right_elbow, 15: left_wrist, 16: right_wrist,
  23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee,
  27: left_ankle, 28: right_ankle
"""

from backend.utils.geometry import calculate_angle, vertical_angle, midpoint

# MediaPipe landmark index mapping
LANDMARK_NAMES = {
    0: "nose",
    11: "left_shoulder", 12: "right_shoulder",
    13: "left_elbow", 14: "right_elbow",
    15: "left_wrist", 16: "right_wrist",
    23: "left_hip", 24: "right_hip",
    25: "left_knee", 26: "right_knee",
    27: "left_ankle", 28: "right_ankle",
}


def extract_point(landmarks: list, index: int) -> tuple:
    """
    Extract (x, y) coordinates from a landmark list.
    Each landmark is expected to be a dict with 'x' and 'y' keys (normalized 0-1).
    """
    lm = landmarks[index]
    return (lm["x"], lm["y"])


def compute_joint_angles(landmarks: list) -> dict:
    """
    Compute all key biomechanical joint angles from MediaPipe landmarks.

    Args:
        landmarks: List of 33 landmark dicts, each with 'x', 'y', 'z', 'visibility'

    Returns:
        Dictionary of angle_name → angle_in_degrees
    """
    if not landmarks or len(landmarks) < 33:
        return {}

    angles = {}

    # -- Arm angles (shoulder-elbow-wrist) --
    angles["left_elbow"] = calculate_angle(
        extract_point(landmarks, 11),  # left_shoulder
        extract_point(landmarks, 13),  # left_elbow
        extract_point(landmarks, 15),  # left_wrist
    )
    angles["right_elbow"] = calculate_angle(
        extract_point(landmarks, 12),  # right_shoulder
        extract_point(landmarks, 14),  # right_elbow
        extract_point(landmarks, 16),  # right_wrist
    )

    # -- Shoulder angles (hip-shoulder-elbow) --
    angles["left_shoulder"] = calculate_angle(
        extract_point(landmarks, 23),  # left_hip
        extract_point(landmarks, 11),  # left_shoulder
        extract_point(landmarks, 13),  # left_elbow
    )
    angles["right_shoulder"] = calculate_angle(
        extract_point(landmarks, 24),  # right_hip
        extract_point(landmarks, 12),  # right_shoulder
        extract_point(landmarks, 14),  # right_elbow
    )

    # -- Knee angles (hip-knee-ankle) --
    angles["left_knee"] = calculate_angle(
        extract_point(landmarks, 23),  # left_hip
        extract_point(landmarks, 25),  # left_knee
        extract_point(landmarks, 27),  # left_ankle
    )
    angles["right_knee"] = calculate_angle(
        extract_point(landmarks, 24),  # right_hip
        extract_point(landmarks, 26),  # right_knee
        extract_point(landmarks, 28),  # right_ankle
    )

    # -- Hip angles (shoulder-hip-knee) --
    angles["left_hip"] = calculate_angle(
        extract_point(landmarks, 11),  # left_shoulder
        extract_point(landmarks, 23),  # left_hip
        extract_point(landmarks, 25),  # left_knee
    )
    angles["right_hip"] = calculate_angle(
        extract_point(landmarks, 12),  # right_shoulder
        extract_point(landmarks, 24),  # right_hip
        extract_point(landmarks, 26),  # right_knee
    )

    # -- Spine angle (vertical alignment of shoulder midpoint to hip midpoint) --
    shoulder_mid = midpoint(
        extract_point(landmarks, 11),
        extract_point(landmarks, 12),
    )
    hip_mid = midpoint(
        extract_point(landmarks, 23),
        extract_point(landmarks, 24),
    )
    # The spine angle is how vertical the torso is (0° = perfectly vertical)
    spine_tilt = vertical_angle(shoulder_mid, hip_mid)
    angles["spine_angle"] = 180 - spine_tilt  # Convert to "straightness" (180° = perfectly straight)

    # -- Neck angle (nose relative to shoulder midpoint, compared to spine) --
    nose = extract_point(landmarks, 0)
    neck_tilt = vertical_angle(nose, shoulder_mid)
    angles["neck_angle"] = 180 - neck_tilt

    # -- Lateral neck tilt --
    left_shoulder = extract_point(landmarks, 11)
    right_shoulder = extract_point(landmarks, 12)
    shoulder_dy = abs(left_shoulder[1] - right_shoulder[1])
    shoulder_dx = abs(left_shoulder[0] - right_shoulder[0])
    if shoulder_dx > 1e-6:
        import math
        angles["neck_tilt"] = math.degrees(math.atan(shoulder_dy / shoulder_dx))
    else:
        angles["neck_tilt"] = 0.0

    return angles
