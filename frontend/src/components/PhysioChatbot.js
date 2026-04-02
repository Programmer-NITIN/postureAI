"use client";

/**
 * PhysioChatbot — AI Physiotherapist floating chat widget
 *
 * A sleek, expandable chat bubble fixed to the bottom-right.
 * Communicates with the RAG-style LLM backend at /api/chat.
 * Features:
 * - Expandable/collapsible chat window
 * - Typing indicator animation
 * - Markdown-lite rendering (bold, lists)
 * - Auto-scroll to latest message
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage } from "@/lib/apiClient";

const QUICK_ACTIONS = [
  { label: "How's my posture?", icon: "📊" },
  { label: "Suggest exercises", icon: "🏋️" },
  { label: "Back pain help", icon: "🩺" },
  { label: "Stretching routine", icon: "🤸" },
];

function formatMessage(text) {
  // Simple markdown-lite: bold, bullet lists
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
    .replace(/^(\d+)\.\s/gm, '<span class="text-cyan-400 font-bold">$1.</span> ')
    .replace(/^[•●]\s/gm, '<span class="text-purple-400">•</span> ')
    .replace(/\n/g, "<br />");
}

export default function PhysioChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I'm **Dr. AI**, your personal physiotherapy assistant. Ask me about your posture, exercises, or pain management!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [pulseAnim, setPulseAnim] = useState(true);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Stop pulse after first open
  useEffect(() => {
    if (isOpen) setPulseAnim(false);
  }, [isOpen]);

  const handleSend = useCallback(async (text) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;

    const userMessage = { role: "user", content: msg.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(msg.trim());
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply, source: response.source },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that. Make sure the backend is running on port 8000. 🔧",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-[60] w-[380px] max-h-[520px] bg-[#0d1117] border border-[var(--card-border)] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          style={{ animation: "chatSlideIn 0.3s ease-out" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                🩺
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Dr. AI</p>
                <p className="text-[10px] text-emerald-400">Online • AI Physiotherapist</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-lg"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-600/20 text-cyan-100 rounded-br-md border border-cyan-500/20"
                      : "bg-white/[0.04] text-[var(--foreground)] rounded-bl-md border border-white/5"
                  }`}
                >
                  <span
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                  {msg.source === "gemini" && (
                    <span className="block text-[9px] text-purple-400/60 mt-1">✨ Powered by Gemini</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.label)}
                  className="text-[11px] bg-white/5 border border-white/10 text-[var(--foreground)] px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[var(--card-border)] p-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Dr. AI anything..."
                disabled={isLoading}
                className="flex-1 bg-white/5 border border-[var(--card-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-cyan-500/50 focus:outline-none disabled:opacity-50 transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 ${
          pulseAnim ? "animate-bounce" : ""
        }`}
        aria-label="Open AI Physiotherapist chat"
      >
        {isOpen ? "✕" : "🩺"}
      </button>

      {/* Animations */}
      <style jsx global>{`
        @keyframes chatSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
