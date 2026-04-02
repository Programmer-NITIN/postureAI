"use client";

/**
 * Chat Page — Full-page AI Physiotherapist Chat (Light Theme)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage } from "@/lib/apiClient";

const QUICK_ACTIONS = [
  { label: "How's my posture?", icon: "📊" },
  { label: "Suggest exercises", icon: "🏋️" },
  { label: "Back pain help", icon: "🩺" },
  { label: "Tips for better sleep", icon: "😴" },
  { label: "Healthy meal ideas", icon: "🍎" },
  { label: "Stress relief tips", icon: "🧠" },
  { label: "Stretching routine", icon: "🤸" },
  { label: "Download my report", icon: "📄" },
];

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#007bff]">$1</strong>')
    .replace(/^(\d+)\.\s/gm, '<span class="text-[#007bff] font-bold">$1.</span> ')
    .replace(/^[•●]\s/gm, '<span class="text-blue-400">•</span> ')
    .replace(/\n/g, "<br />");
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I'm **Dr. AI**, your personal health & wellness assistant powered by PostureAI.\n\nI can help you with a wide range of topics — fitness, posture, nutrition, sleep, mental wellness, and much more! I also have access to your posture tracking data for personalized advice.\n\nAsk me anything! ⚡",
      suggestions: ["How's my posture?", "Suggest a meal plan", "Tips for better sleep"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const msg = text || input;
      if (!msg.trim() || isLoading) return;

      setMessages((prev) => [...prev, { role: "user", content: msg.trim() }]);
      setInput("");
      setIsLoading(true);

      try {
        // Send the last 6 messages as context (excluding the new user message we just added locally)
        const historyToSend = messages
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));
        
        const response = await sendChatMessage(msg.trim(), null, historyToSend);
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.reply,
            source: response.source,
            suggestions: response.suggestions || [],
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't process that. Make sure the backend is running on port 8000. 🔧" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col" style={{ minHeight: "calc(100vh - 5rem)" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
            🩺
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dr. AI — Physiotherapy Chat</h1>
            <p className="text-xs text-emerald-500 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Online • Powered by your PostureAI data
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Ask me anything about your posture, exercises, pain management, or health progress.
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="flex items-start gap-2.5 max-w-[85%]">
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                    🩺
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white rounded-br-md"
                      : "bg-slate-50 text-slate-700 rounded-bl-md border border-slate-100"
                  }`}
                >
                  <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  {msg.source && (
                    <span className="block text-[9px] mt-2 opacity-50">
                      {msg.source === "gemini" ? "✨ Powered by Gemini AI" : "🤖 Rule-based response"}
                    </span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm shrink-0 mt-0.5">
                    👤
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {/* Dynamic follow-up suggestions (show after latest assistant message) */}
          {!isLoading && messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.suggestions?.length > 0 && (
            <div className="flex justify-start pl-10">
              <div className="flex flex-wrap gap-2">
                {messages[messages.length - 1].suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs bg-blue-50 border border-blue-200 text-[var(--primary)] px-3 py-2 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 font-medium"
                  >
                    {suggestion} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  🩺
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions — only show on initial state (before any user messages) */}
        {messages.length <= 1 && (
          <div className="px-4 sm:px-6 pb-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">Popular Topics</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.label)}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-[var(--primary)] transition-all duration-200"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Dr. AI about your posture, exercises, or pain..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none disabled:opacity-50 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white text-lg hover:bg-[var(--primary-hover)] hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            ⚠️ AI advice does not replace professional medical consultation.
          </p>
        </div>
      </div>
    </div>
  );
}
