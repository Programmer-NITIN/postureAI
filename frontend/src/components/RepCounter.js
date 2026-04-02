"use client";

/**
 * RepCounter — Large animated rep/set counter display
 *
 * Shows the current rep count with a circular progress ring,
 * set progress below, and motivational text.
 */

import { getMotivationText } from "@/lib/motivationEngine";

export default function RepCounter({ currentRep, targetReps, currentSet, targetSets, state }) {
  const progress = targetReps > 0 ? currentRep / targetReps : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  const isActive = state === "moving" || state === "ready" || state === "rep_complete" || state === "returning";
  const ringColor = state === "workout_complete" ? "#10b981" : isActive ? "#007bff" : "#cbd5e1";

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
        Repetitions
      </h3>

      {/* Circular rep counter */}
      <div className="relative" style={{ width: 130, height: 130 }}>
        <svg width="130" height="130" className="-rotate-90">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="65" cy="65" r={radius}
            fill="none" stroke={ringColor} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease", filter: `drop-shadow(0 0 6px ${ringColor}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums" style={{ color: ringColor }}>{currentRep}</span>
          <span className="text-xs text-[var(--muted)]">/ {targetReps}</span>
        </div>
      </div>

      {/* Set indicator */}
      <div className="flex items-center gap-2 mt-3">
        {Array.from({ length: targetSets }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentSet - 1
                ? "bg-emerald-500"
                : i === currentSet - 1
                  ? "bg-[var(--primary)] ring-2 ring-blue-200"
                  : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--muted)] mt-1">
        Set {currentSet} / {targetSets}
      </p>

      {/* Motivation text */}
      {isActive && currentRep > 0 && (
        <p className="text-xs text-[var(--primary)] mt-3 text-center animate-pulse-glow">
          {getMotivationText(currentRep, targetReps, currentSet, targetSets)}
        </p>
      )}

      {/* State indicator */}
      <div className="mt-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium border"
        style={{
          color: isActive ? "#007bff" : state === "workout_complete" ? "#10b981" : "#94a3b8",
          borderColor: isActive ? "rgba(0,123,255,0.3)" : "#e2e8f0",
          backgroundColor: isActive ? "rgba(0,123,255,0.06)" : "transparent",
        }}
      >
        {state.replace(/_/g, " ")}
      </div>
    </div>
  );
}
