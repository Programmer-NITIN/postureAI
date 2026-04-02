"use client";

/**
 * SkeletonCanvas — Draws the pose skeleton over the video feed
 *
 * Renders MediaPipe landmarks and connections on a transparent canvas
 * overlaid on the camera feed. Joints are color-coded:
 *   - Green: correct posture
 *   - Yellow: needs adjustment
 *   - Red: dangerous / injury risk
 *
 * NEW: Ghost Overlay — draws a semi-transparent "ideal" skeleton
 * for form comparison when ghostAngles are provided.
 */

import { useEffect, useRef } from "react";

// MediaPipe pose connection pairs (indices)
const CONNECTIONS = [
  // Head
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
  // Left hand
  [15, 17], [15, 19], [15, 21],
  // Right hand
  [16, 18], [16, 20], [16, 22],
  // Left foot
  [27, 29], [27, 31],
  // Right foot
  [28, 30], [28, 32],
];

// Map landmark indices to their respective angle names for coloring
const JOINT_ANGLE_MAP = {
  13: "left_elbow",
  14: "right_elbow",
  11: "left_shoulder",
  12: "right_shoulder",
  25: "left_knee",
  26: "right_knee",
  23: "left_hip",
  24: "right_hip",
};

function getJointColor(jointStatus, landmarkIdx) {
  const angleName = JOINT_ANGLE_MAP[landmarkIdx];
  if (!angleName || !jointStatus || !jointStatus[angleName]) return "#06b6d4"; // cyan default

  const status = jointStatus[angleName];
  if (status === "correct") return "#10b981";   // green
  if (status === "dangerous") return "#ef4444"; // red
  return "#f59e0b";                               // yellow for incorrect
}

/**
 * Create a ghost skeleton from the user's landmarks with ideal angle adjustments.
 * This creates a semi-transparent "perfect form" overlay for visual comparison.
 */
function createGhostLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 33) return null;

  // Clone landmarks and slightly offset them to create a "ghost" effect
  // The ghost forms a smooth, upright version of the user's pose
  const ghost = landmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility * 0.6, // Reduce visibility for ghost
  }));

  // Adjust spinal alignment (make spine more vertical)
  const midHipX = (landmarks[23].x + landmarks[24].x) / 2;
  const midHipY = (landmarks[23].y + landmarks[24].y) / 2;
  const midShoulderX = (landmarks[11].x + landmarks[12].x) / 2;
  const midShoulderY = (landmarks[11].y + landmarks[12].y) / 2;

  // Correct the shoulder position to be directly above hips
  const idealShoulderX = midHipX;
  const shoulderCorrection = idealShoulderX - midShoulderX;

  // Apply correction to upper body landmarks (shoulders, arms, head)
  const upperBodyIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  for (const idx of upperBodyIndices) {
    if (idx < ghost.length) {
      ghost[idx].x += shoulderCorrection * 0.5; // partial correction for natural look
    }
  }

  // Level the shoulders
  const shoulderAvgY = (ghost[11].y + ghost[12].y) / 2;
  ghost[11].y = shoulderAvgY;
  ghost[12].y = shoulderAvgY;

  // Level the hips
  const hipAvgY = (ghost[23].y + ghost[24].y) / 2;
  ghost[23].y = hipAvgY;
  ghost[24].y = hipAvgY;

  // Align head over shoulders
  const headMidX = (ghost[11].x + ghost[12].x) / 2;
  ghost[0].x = headMidX;

  return ghost;
}

function drawGhostSkeleton(ctx, ghost, width, height) {
  if (!ghost) return;

  ctx.save();
  ctx.globalAlpha = 0.25;

  // Ghost connections
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = "#a78bfa"; // purple ghost color

  for (const [i, j] of CONNECTIONS) {
    if (i >= ghost.length || j >= ghost.length) continue;
    const lm1 = ghost[i];
    const lm2 = ghost[j];
    if (lm1.visibility < 0.2 || lm2.visibility < 0.2) continue;

    ctx.beginPath();
    ctx.moveTo(lm1.x * width, lm1.y * height);
    ctx.lineTo(lm2.x * width, lm2.y * height);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Ghost joints
  for (let i = 0; i < ghost.length; i++) {
    const lm = ghost[i];
    if (lm.visibility < 0.2) continue;

    const x = lm.x * width;
    const y = lm.y * height;
    const isKeyJoint = JOINT_ANGLE_MAP[i] !== undefined;

    // Glow
    if (isKeyJoint) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(167, 139, 250, 0.3)";
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = "#a78bfa";
    ctx.arc(x, y, isKeyJoint ? 4 : 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}

export default function SkeletonCanvas({ landmarks, jointStatus, showGhost = true, width = 640, height = 480 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks || landmarks.length < 33) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    // 1) Draw ghost skeleton FIRST (below the real skeleton)
    if (showGhost) {
      const ghost = createGhostLandmarks(landmarks);
      drawGhostSkeleton(ctx, ghost, width, height);
    }

    // 2) Draw real connections
    ctx.lineWidth = 3;
    for (const [i, j] of CONNECTIONS) {
      if (i >= landmarks.length || j >= landmarks.length) continue;
      const lm1 = landmarks[i];
      const lm2 = landmarks[j];

      if (lm1.visibility < 0.3 || lm2.visibility < 0.3) continue;

      const color1 = getJointColor(jointStatus, i);
      const color2 = getJointColor(jointStatus, j);

      // Use gradient for connections
      const gradient = ctx.createLinearGradient(
        lm1.x * width, lm1.y * height,
        lm2.x * width, lm2.y * height
      );
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.moveTo(lm1.x * width, lm1.y * height);
      ctx.lineTo(lm2.x * width, lm2.y * height);
      ctx.stroke();
    }

    // 3) Draw real landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm.visibility < 0.3) continue;

      const x = lm.x * width;
      const y = lm.y * height;
      const color = getJointColor(jointStatus, i);
      const isKeyJoint = JOINT_ANGLE_MAP[i] !== undefined;

      // Glow effect for key joints
      if (isKeyJoint) {
        ctx.beginPath();
        ctx.fillStyle = color + "40"; // with transparency
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Joint dot
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, isKeyJoint ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();

      // White border
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.arc(x, y, isKeyJoint ? 6 : 4, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Ghost legend
    if (showGhost) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#a78bfa";
      ctx.font = "10px system-ui";
      ctx.fillText("◯ Ghost = Ideal Form", 8, height - 8);
      ctx.restore();
    }
  }, [landmarks, jointStatus, showGhost, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ transform: "scaleX(-1)" }}
    />
  );
}
