"use client";

/**
 * ExerciseSelector — Card-based exercise mode picker
 *
 * Displays available exercise modes as interactive cards.
 * Highlights the currently selected exercise.
 */

import { getExerciseList } from "@/lib/exerciseTemplates";

export default function ExerciseSelector({ selectedExercise, onSelect }) {
  const exercises = getExerciseList();

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
        Exercise Mode
      </h3>
      <div className="space-y-2">
        {exercises.map((ex) => {
          const isActive = selectedExercise === ex.id;
          return (
            <button
              key={ex.id}
              onClick={() => onSelect(ex.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 border
                ${isActive
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-white/5 hover:border-[var(--card-border)]"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{ex.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  <p className="text-[10px] text-[var(--muted)] truncate">{ex.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
