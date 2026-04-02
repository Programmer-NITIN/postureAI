/**
 * API Client — Fetch wrapper for backend communication
 *
 * Handles all REST API calls to the FastAPI backend.
 * The backend is expected at http://localhost:8000.
 */

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // API calls are proxied through Next.js rewrites — use same origin
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}
const BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API request failed");
  }
  return res.json();
}

// ── Session API ─────────────────────────────────────────────

export async function createSession(exerciseType = "general") {
  return request("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ exercise_type: exerciseType }),
  });
}

export async function addPostureFrame(sessionId, landmarks) {
  return request(`/api/sessions/${sessionId}/frames`, {
    method: "POST",
    body: JSON.stringify({ landmarks }),
  });
}

export async function endSession(sessionId) {
  return request(`/api/sessions/${sessionId}/end`, { method: "PUT" });
}

export async function listSessions(limit = 20) {
  return request(`/api/sessions?limit=${limit}`);
}

// ── Analytics API ───────────────────────────────────────────

export async function getAnalyticsSummary() {
  return request("/api/analytics/summary");
}

export async function getAnalyticsTrend(limit = 30) {
  return request(`/api/analytics/trend?limit=${limit}`);
}

// ── Exercises API ───────────────────────────────────────────

export async function listExercises() {
  return request("/api/exercises");
}

// ── Chat API ────────────────────────────────────────────────────

export async function sendChatMessage(message, sessionId = null, history = []) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId, history }),
  });
}

// ── Plan API ────────────────────────────────────────────────────

export async function getPlanQuestions() {
  return request("/api/plan/questions");
}

export async function generatePlan(answers) {
  return request("/api/plan/generate", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
