"use client";

/**
 * History Page — Session History Table
 *
 * Shows a table of past posture monitoring sessions with:
 * - Date, exercise type, duration, score, and status
 * - Color-coded scores
 */

import { useState, useEffect } from "react";
import { listSessions } from "@/lib/apiClient";

function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start, end) {
  if (!start || !end) return "—";
  const ms = new Date(end) - new Date(start);
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function scoreColor(score) {
  if (score >= 85) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const data = await listSessions(50);
        setSessions(data);
      } catch {
        setError("Could not load sessions. Make sure the backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text mb-1">Session History</h1>
        <p className="text-sm text-[var(--muted)]">
          Review your past posture tracking sessions
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Sessions table */}
      {sessions.length > 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left text-xs text-[var(--muted)] uppercase tracking-wider px-5 py-3 font-semibold">
                    Date
                  </th>
                  <th className="text-left text-xs text-[var(--muted)] uppercase tracking-wider px-5 py-3 font-semibold">
                    Exercise
                  </th>
                  <th className="text-left text-xs text-[var(--muted)] uppercase tracking-wider px-5 py-3 font-semibold">
                    Duration
                  </th>
                  <th className="text-left text-xs text-[var(--muted)] uppercase tracking-wider px-5 py-3 font-semibold">
                    Frames
                  </th>
                  <th className="text-left text-xs text-[var(--muted)] uppercase tracking-wider px-5 py-3 font-semibold">
                    Score
                  </th>
                  <th className="text-left text-xs text-[var(--muted)] uppercase tracking-wider px-5 py-3 font-semibold">
                    Alerts
                  </th>
                  <th className="text-left text-xs text-[var(--muted)] uppercase tracking-wider px-5 py-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-[var(--card-border)]/50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm">{formatDate(session.started_at)}</td>
                    <td className="px-5 py-3 text-sm capitalize">
                      {session.exercise_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--muted)]">
                      {formatDuration(session.started_at, session.ended_at)}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-[var(--muted)]">
                      {session.total_frames}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-bold ${scoreColor(session.average_score || 0)}`}>
                        {session.average_score ? `${Math.round(session.average_score)}%` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {session.risk_alerts > 0 ? (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          {session.risk_alerts} alerts
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium
                          ${session.status === "completed"
                            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                            : "text-amber-600 bg-amber-50 border-amber-200"
                          }`}
                      >
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-[var(--foreground)] font-medium mb-1">No sessions recorded</p>
          <p className="text-sm text-[var(--muted)]">
            Complete a posture tracking session to see it here.
          </p>
        </div>
      )}
    </div>
  );
}
