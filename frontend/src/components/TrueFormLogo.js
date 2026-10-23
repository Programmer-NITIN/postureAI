"use client";

/**
 * TrueFormLogo — Modular Minimalist Vector Brand Mark for TrueForm AI
 * 
 * Supports 5 curated minimal SVG variants matching the modern health-tech theme:
 * 1. "tf-monogram"    (Default) - Modern tech interlocking T + F with cyan accent
 * 2. "kinetic-pulse"  - Dual bio-kinetic spine curve with central alignment core
 * 3. "precision-level"- Calibrated posture balance level with target reticle
 * 4. "ai-mesh"        - Geometric computer vision triangulation hexagon
 * 5. "minimal-t"      - Bold, sleek geometric pill-cut "T" with accent node
 */
export default function TrueFormLogo({
  size = 36,
  variant = "tf-monogram",
  className = "",
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#0062ff] via-[#0070f3] to-[#00c6ff] shadow-md shadow-blue-500/25 transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-105 flex-shrink-0 ${className}`}
    >
      {/* ── 1. Modern TF Monogram (Default) ───────────────────── */}
      {variant === "tf-monogram" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[58%] h-[58%]"
        >
          {/* Top 'T' horizontal bar */}
          <path d="M 4 5.5 H 20" stroke="#ffffff" strokeWidth="2.8" />
          {/* Vertical posture spine stem */}
          <path d="M 12 5.5 V 19" stroke="#ffffff" strokeWidth="2.8" />
          {/* 'F' offset crossbar in cyan */}
          <path d="M 12 12 H 18.5" stroke="#67e8f9" strokeWidth="2.6" />
        </svg>
      )}

      {/* ── 2. Kinetic Pulse (Biomechanical Spine Curve) ──────── */}
      {variant === "kinetic-pulse" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[58%] h-[58%]"
        >
          {/* S-curve spine flow */}
          <path
            d="M 8.5 4.5 C 8.5 8.5, 15.5 8, 15.5 12 C 15.5 16, 8.5 15.5, 8.5 19.5"
            stroke="#ffffff"
            strokeWidth="2.6"
          />
          {/* Kinetic echo arc */}
          <path
            d="M 15.5 4.5 C 15.5 8.5, 8.5 8, 8.5 12 C 8.5 16, 15.5 15.5, 15.5 19.5"
            stroke="#67e8f9"
            strokeWidth="2"
            opacity="0.8"
          />
          {/* Central posture balance node */}
          <circle cx="12" cy="12" r="1.8" fill="#ffffff" />
        </svg>
      )}

      {/* ── 3. Precision Balance Level (Alignment Caliper) ────── */}
      {variant === "precision-level" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[58%] h-[58%]"
        >
          {/* Horizontal balance level bar */}
          <path d="M 4.5 6.5 H 19.5" stroke="#ffffff" strokeWidth="2.6" />
          {/* Vertical plumb alignment axis */}
          <path d="M 12 6.5 V 19.5" stroke="#ffffff" strokeWidth="2.6" />
          {/* AI calibration reticle */}
          <circle
            cx="12"
            cy="13"
            r="3.5"
            stroke="#67e8f9"
            strokeWidth="1.8"
            fill="rgba(103, 232, 249, 0.2)"
          />
          <circle cx="12" cy="13" r="1.2" fill="#ffffff" />
        </svg>
      )}

      {/* ── 4. AI Mesh (Computer Vision Triangulation) ────────── */}
      {variant === "ai-mesh" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[58%] h-[58%]"
        >
          {/* Geometric polygon boundary */}
          <polygon
            points="12,2.5 20.5,7.5 20.5,16.5 12,21.5 3.5,16.5 3.5,7.5"
            stroke="#ffffff"
            strokeWidth="2.2"
          />
          {/* Spinal core vertical */}
          <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="#67e8f9" strokeWidth="2.2" />
          {/* Joint connection horizontal */}
          <line x1="3.5" y1="12" x2="20.5" y2="12" stroke="#ffffff" strokeWidth="1.6" opacity="0.75" />
          <circle cx="12" cy="12" r="1.8" fill="#ffffff" />
        </svg>
      )}

      {/* ── 5. Minimal Solid 'T' (Clean Geometric Tech) ───────── */}
      {variant === "minimal-t" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[58%] h-[58%]"
        >
          {/* Top pill crossbar */}
          <rect x="4" y="5" width="16" height="3.4" rx="1.7" fill="#ffffff" />
          {/* Vertical pillar */}
          <rect x="10.3" y="8.4" width="3.4" height="11" rx="1.7" fill="#ffffff" />
          {/* Minimal posture verification dot */}
          <circle cx="17.5" cy="14" r="1.8" fill="#67e8f9" />
        </svg>
      )}
    </div>
  );
}
