"use client";

/**
 * WorkoutPanel — Exercise selection + workout configuration
 *
 * Categorized exercise browser with reps/sets/rest configuration.
 */

import { useState } from "react";
import { getCategorizedExercises, getExercise } from "@/lib/rehabExercises";

export default function WorkoutPanel({ onStartWorkout, disabled }) {
  const categories = getCategorizedExercises();
  const [selectedId, setSelectedId] = useState("bodyweight_squat");
  const [reps, setReps] = useState(12);
  const [sets, setSets] = useState(3);
  const [rest, setRest] = useState(30);
  const [expandedCat, setExpandedCat] = useState("lower_body");

  const selected = getExercise(selectedId);

  function handleSelect(id) {
    setSelectedId(id);
    const ex = getExercise(id);
    setReps(ex.defaults.reps);
    setSets(ex.defaults.sets);
    setRest(ex.defaults.rest);
  }

  function handleStart() {
    onStartWorkout({ exerciseId: selectedId, exercise: selected, reps, sets, rest });
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
        Exercise Program
      </h3>

      {/* Category accordion */}
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {Object.entries(categories).map(([catId, cat]) => (
          <div key={catId}>
            <button
              onClick={() => setExpandedCat(expandedCat === catId ? null : catId)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[var(--foreground)] hover:bg-slate-50 transition-colors"
            >
              <span>{cat.icon} {cat.name}</span>
              <span className="text-[var(--muted)]">{expandedCat === catId ? "▾" : "▸"}</span>
            </button>
            {expandedCat === catId && (
              <div className="pl-2 space-y-0.5">
                {cat.exercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSelect(ex.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all border
                      ${selectedId === ex.id
                        ? "bg-blue-50 border-blue-200 text-[var(--primary)] font-semibold"
                        : "border-transparent text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span className="mr-2">{ex.icon}</span>
                    {ex.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected exercise info */}
      <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
        <p className="text-sm font-medium">{selected.icon} {selected.name}</p>
        <p className="text-[10px] text-[var(--muted)] mt-0.5">{selected.description}</p>
      </div>

      {/* Workout config */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase">Reps</label>
          <input type="number" value={reps} onChange={(e) => setReps(parseInt(e.target.value) || 1)} min={1} max={50}
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center text-[var(--foreground)] focus:border-[var(--primary)] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase">Sets</label>
          <input type="number" value={sets} onChange={(e) => setSets(parseInt(e.target.value) || 1)} min={1} max={10}
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center text-[var(--foreground)] focus:border-[var(--primary)] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase">Rest (s)</label>
          <input type="number" value={rest} onChange={(e) => setRest(parseInt(e.target.value) || 10)} min={5} max={120} step={5}
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center text-[var(--foreground)] focus:border-[var(--primary)] outline-none"
          />
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={disabled}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
      >
        🏋️ Start Workout
      </button>
    </div>
  );
}
