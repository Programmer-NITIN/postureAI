"use client";

/**
 * SetTracker — Set progress display with rest timer
 *
 * Shows:
 * - Progress bar for current set
 * - Countdown rest timer between sets
 * - Set history with scores
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { speakRest } from "@/lib/voiceFeedback";

export default function SetTracker({ sets, currentSet, state, restSeconds, onRestComplete }) {
  const [restRemaining, setRestRemaining] = useState(restSeconds);
  const timerRef = useRef(null);

  // Start rest timer when set completes
  useEffect(() => {
    if (state === "set_complete") {
      setRestRemaining(restSeconds);
      speakRest("start_rest", { seconds: restSeconds });

      timerRef.current = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            speakRest("rest_done");
            if (onRestComplete) onRestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, restSeconds, onRestComplete]);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
        Set Progress
      </h3>

      {/* Rest timer */}
      {state === "set_complete" && restRemaining > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-500 uppercase tracking-wider mb-1">Rest</p>
          <p className="text-4xl font-bold text-amber-600 tabular-nums">{restRemaining}s</p>
          <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${(restRemaining / restSeconds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Set history */}
      <div className="space-y-2">
        {sets.map((set, i) => {
          const isCurrentSet = i === currentSet - 1;
          const isCompleted = i < currentSet - 1 || (isCurrentSet && state === "set_complete");

          return (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all
                ${isCurrentSet
                  ? "bg-blue-50 border-blue-200"
                  : isCompleted
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-transparent border-slate-100"
                }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isCompleted ? "bg-emerald-500" : isCurrentSet ? "bg-[var(--primary)] animate-pulse" : "bg-slate-200"}`} />
                <span className="text-xs font-medium">Set {i + 1}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--muted)]">{set.reps.length} reps</span>
                {set.avgScore > 0 && (
                  <span className={`text-xs font-semibold ${set.avgScore >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                    {Math.round(set.avgScore)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
