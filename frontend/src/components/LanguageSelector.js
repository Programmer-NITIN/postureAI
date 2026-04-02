"use client";

/**
 * LanguageSelector — Voice language picker
 *
 * Dropdown for selecting voice feedback language.
 * Supports English, Hinglish, and Gujarati.
 */

import { getLanguages, getLanguage, setLanguage, isVoiceEnabled, setVoiceEnabled } from "@/lib/voiceFeedback";

export default function LanguageSelector({ onChange }) {
  const languages = getLanguages();
  const current = getLanguage();
  const voiceOn = isVoiceEnabled();

  function handleLangChange(e) {
    const lang = e.target.value;
    setLanguage(lang);
    if (onChange) onChange(lang);
  }

  function handleVoiceToggle() {
    setVoiceEnabled(!voiceOn);
    if (onChange) onChange(null);
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
        Voice Coach
      </h3>

      {/* Voice toggle */}
      <button
        onClick={handleVoiceToggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 border
          ${voiceOn
            ? "bg-blue-50 text-[var(--primary)] border-blue-200"
            : "bg-transparent text-[var(--muted)] border-[var(--card-border)]"
          }`}
      >
        <span className="flex items-center gap-2">
          <span>{voiceOn ? "🔊" : "🔇"}</span>
          Voice Feedback
        </span>
        <span className="text-xs">{voiceOn ? "ON" : "OFF"}</span>
      </button>

      {/* Language selector */}
      {voiceOn && (
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Language</label>
          <select
            value={current}
            onChange={handleLangChange}
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] outline-none appearance-none cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
