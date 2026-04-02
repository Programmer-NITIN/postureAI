"use client";

/**
 * FeedbackPanel — Real-time corrective feedback display (Light Theme)
 */

import { useEffect, useRef, useState } from "react";
import { speakFormError, speakRiskFlag, isVoiceEnabled } from "@/lib/voiceFeedback";

const STATUS_CONFIG = {
  correct: {
    label: "Correct Posture",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: "check_circle",
  },
  incorrect: {
    label: "Needs Adjustment",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: "warning",
  },
  dangerous: {
    label: "Injury Risk!",
    color: "bg-red-50 text-red-600 border-red-200",
    icon: "error",
  },
};

export default function FeedbackPanel({ classification, feedback, riskFlags }) {
  const lastSpokenRef = useRef("");
  const lastRiskSpokenRef = useRef("");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!isVoiceEnabled()) return;
    if (riskFlags && riskFlags.length > 0) {
      const flag = riskFlags[0].replace("⚠️ ", "");
      if (flag !== lastRiskSpokenRef.current) {
        speakRiskFlag(flag);
        lastRiskSpokenRef.current = flag;
      }
    }
  }, [riskFlags]);

  useEffect(() => {
    if (!isVoiceEnabled()) return;
    if (feedback && feedback.length > 0 && classification !== "correct") {
      const msg = feedback[0];
      if (msg !== lastSpokenRef.current) {
        speakFormError(msg);
        lastSpokenRef.current = msg;
      }
    }
  }, [feedback, classification]);

  const status = STATUS_CONFIG[classification] || STATUS_CONFIG.correct;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Feedback</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${status.color}`}>
        <span className="material-symbols-outlined text-lg">{status.icon}</span>
        <span className="text-sm font-semibold">{status.label}</span>
      </div>

      {expanded && (
        <>
          {riskFlags && riskFlags.length > 0 && (
            <div className="space-y-2">
              {riskFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                  <span>{flag.replace("⚠️ ", "")}</span>
                </div>
              ))}
            </div>
          )}

          {feedback && feedback.length > 0 && (
            <div className="space-y-1.5">
              {feedback.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-amber-700 text-xs px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">lightbulb</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {classification === "correct" && (!feedback || feedback.length === 0) && (
            <p className="text-emerald-500 text-xs text-center py-2">
              Great form! Keep it up 💪
            </p>
          )}
        </>
      )}
    </div>
  );
}
