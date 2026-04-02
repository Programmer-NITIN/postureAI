"use client";

/**
 * PostureScore — Animated radial gauge showing real-time posture score
 *
 * SVG-based circular gauge with:
 * - Color transitions based on score (green → yellow → red)
 * - Smooth animation via CSS transitions
 * - Numeric score display in the center
 */

export default function PostureScore({ score = 0, classification = "correct" }) {
  // SVG circle parameters
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  // Color based on score
  let strokeColor = "#10b981"; // green
  let bgGlow = "rgba(16, 185, 129, 0.15)";
  if (score < 70) {
    strokeColor = "#f59e0b"; // yellow
    bgGlow = "rgba(245, 158, 11, 0.15)";
  }
  if (score < 50) {
    strokeColor = "#ef4444"; // red
    bgGlow = "rgba(239, 68, 68, 0.15)";
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
        Posture Score
      </h3>

      <div className="relative" style={{ width: 120, height: 120 }}>
        <svg width="120" height="120" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease",
              filter: `drop-shadow(0 0 8px ${strokeColor}80)`,
            }}
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: strokeColor, transition: "color 0.6s ease" }}
          >
            {Math.round(score)}
          </span>
          <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Status label */}
      <div
        className="mt-3 px-3 py-1 rounded-full text-xs font-medium border"
        style={{
          color: strokeColor,
          borderColor: strokeColor + "40",
          backgroundColor: bgGlow,
        }}
      >
        {classification === "correct" && "Excellent"}
        {classification === "incorrect" && "Needs Work"}
        {classification === "dangerous" && "Danger Zone"}
      </div>
    </div>
  );
}
