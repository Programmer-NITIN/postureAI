/**
 * Pose Analysis Library — Client-side joint angle calculations
 *
 * Mirrors the backend geometry logic for real-time, zero-latency
 * feedback without a server round-trip. Uses the same mathematical
 * approach (dot product for angle computation).
 */

/**
 * Calculate the angle at point B formed by vectors BA and BC.
 * @param {number[]} a - First endpoint [x, y]
 * @param {number[]} b - Vertex point [x, y]
 * @param {number[]} c - Second endpoint [x, y]
 * @returns {number} Angle in degrees [0, 180]
 */
export function calculateAngle(a, b, c) {
  const ba = [a[0] - b[0], a[1] - b[1]];
  const bc = [c[0] - b[0], c[1] - b[1]];

  const dot = ba[0] * bc[0] + ba[1] * bc[1];
  const magBA = Math.sqrt(ba[0] ** 2 + ba[1] ** 2);
  const magBC = Math.sqrt(bc[0] ** 2 + bc[1] ** 2);

  if (magBA < 1e-8 || magBC < 1e-8) return 0;

  const cosine = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

/**
 * Calculate the angle of vector AB relative to the vertical axis.
 * @param {number[]} a - Top point [x, y]
 * @param {number[]} b - Bottom point [x, y]
 * @returns {number} Angle in degrees
 */
export function verticalAngle(a, b) {
  const dx = Math.abs(b[0] - a[0]);
  const dy = Math.abs(b[1] - a[1]);
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/**
 * Extract [x, y] from a MediaPipe landmark.
 */
function lm(landmarks, idx) {
  const l = landmarks[idx];
  return [l.x, l.y];
}

/**
 * Compute all biomechanical joint angles from MediaPipe landmarks.
 * @param {Array} landmarks - Array of 33 MediaPipe landmarks
 * @returns {Object} Dictionary of angle_name → angle_in_degrees
 */
export function computeJointAngles(landmarks) {
  if (!landmarks || landmarks.length < 33) return {};

  const angles = {};

  // Arm angles (shoulder-elbow-wrist)
  angles.left_elbow = calculateAngle(lm(landmarks, 11), lm(landmarks, 13), lm(landmarks, 15));
  angles.right_elbow = calculateAngle(lm(landmarks, 12), lm(landmarks, 14), lm(landmarks, 16));

  // Shoulder angles (hip-shoulder-elbow)
  angles.left_shoulder = calculateAngle(lm(landmarks, 23), lm(landmarks, 11), lm(landmarks, 13));
  angles.right_shoulder = calculateAngle(lm(landmarks, 24), lm(landmarks, 12), lm(landmarks, 14));

  // Knee angles (hip-knee-ankle)
  angles.left_knee = calculateAngle(lm(landmarks, 23), lm(landmarks, 25), lm(landmarks, 27));
  angles.right_knee = calculateAngle(lm(landmarks, 24), lm(landmarks, 26), lm(landmarks, 28));

  // Hip angles (shoulder-hip-knee)
  angles.left_hip = calculateAngle(lm(landmarks, 11), lm(landmarks, 23), lm(landmarks, 25));
  angles.right_hip = calculateAngle(lm(landmarks, 12), lm(landmarks, 24), lm(landmarks, 26));

  // Spine angle (shoulder midpoint vs hip midpoint vertical alignment)
  const shoulderMid = [
    (landmarks[11].x + landmarks[12].x) / 2,
    (landmarks[11].y + landmarks[12].y) / 2,
  ];
  const hipMid = [
    (landmarks[23].x + landmarks[24].x) / 2,
    (landmarks[23].y + landmarks[24].y) / 2,
  ];
  const spineTilt = verticalAngle(shoulderMid, hipMid);
  angles.spine_angle = 180 - spineTilt;

  // Neck angle (nose relative to shoulder midpoint)
  const nose = [landmarks[0].x, landmarks[0].y];
  const neckTilt = verticalAngle(nose, shoulderMid);
  angles.neck_angle = 180 - neckTilt;

  // Lateral neck tilt
  const shoulderDy = Math.abs(landmarks[11].y - landmarks[12].y);
  const shoulderDx = Math.abs(landmarks[11].x - landmarks[12].x);
  angles.neck_tilt = (Math.atan2(shoulderDy, shoulderDx) * 180) / Math.PI;

  return angles;
}
