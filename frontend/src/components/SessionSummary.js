"use client";

/**
 * SessionSummary — End-of-session report modal
 *
 * Displays workout results including total reps, average score,
 * ROM achieved, per-rep breakdown, and common errors.
 */

export default function SessionSummary({ summary, exerciseName, onClose }) {
  if (!summary) return null;

  const scoreColor = summary.averageScore >= 80 ? "text-emerald-400" : summary.averageScore >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-[var(--card-border)]">
          <h2 className="text-lg font-bold gradient-text">Workout Complete! 🎉</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">{exerciseName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 p-5">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
            <p className="text-2xl font-bold text-[var(--primary)]">{summary.totalReps}</p>
            <p className="text-[10px] text-[var(--muted)] uppercase">Total Reps</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <p className={`text-2xl font-bold ${scoreColor}`}>{summary.averageScore}%</p>
            <p className="text-[10px] text-[var(--muted)] uppercase">Avg Score</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 text-center">
            <p className="text-2xl font-bold text-purple-500">{summary.averageRom}°</p>
            <p className="text-[10px] text-[var(--muted)] uppercase">Avg ROM</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
            <p className="text-2xl font-bold text-emerald-500">{summary.totalSets}</p>
            <p className="text-[10px] text-[var(--muted)] uppercase">Sets Done</p>
          </div>
        </div>

        {/* Per-rep breakdown */}
        {summary.repsDetail && summary.repsDetail.length > 0 && (
          <div className="px-5 pb-3">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
              Rep Breakdown
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {summary.repsDetail.map((rep) => (
                <div key={rep.rep} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50">
                  <span className="text-xs text-[var(--foreground)]">Rep {rep.rep}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted)]">{rep.rom}° ROM</span>
                    <span className={`text-xs font-semibold ${rep.score >= 80 ? "text-emerald-400" : rep.score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      {rep.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common errors */}
        {summary.commonErrors && summary.commonErrors.length > 0 && (
          <div className="px-5 pb-3">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
              Areas to Improve
            </h3>
            <div className="space-y-1">
              {summary.commonErrors.map(([error, count], i) => (
                <div key={i} className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  💡 {error} <span className="text-[var(--muted)]">({count}x)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="p-5 pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-[var(--primary)] border border-blue-200 hover:bg-blue-100 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
