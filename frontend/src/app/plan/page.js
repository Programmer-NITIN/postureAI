"use client";

/**
 * Plan Page — AI Exercise Plan Generator
 *
 * A step-by-step questionnaire (10 questions) where the AI asks about
 * the user's goals, fitness level, pain areas, etc. After answering all
 * questions, the AI generates a personalized 4-week exercise/rehab plan.
 */

import { useState, useEffect, useCallback } from "react";
import { getPlanQuestions, generatePlan } from "@/lib/apiClient";
import Link from "next/link";

/* ── Markdown-like renderer (lightweight) ──────────────────── */
function renderPlanMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-slate-800 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-extrabold text-[var(--primary)] mt-8 mb-3 flex items-center gap-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black text-slate-900 mt-4 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="text-slate-500">$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 my-3 text-sm text-amber-700 rounded-r-lg">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="border-slate-200 my-6" />')
    .replace(/^(\d+)\.\s/gm, '<span class="text-[var(--primary)] font-bold">$1.</span> ')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-[var(--primary)] mt-1">•</span><span>$1</span></div>')
    .replace(/\n/g, "<br />");
}

export default function PlanPage() {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planSource, setPlanSource] = useState("");
  const [error, setError] = useState(null);

  // Load questions
  useEffect(() => {
    async function load() {
      try {
        const data = await getPlanQuestions();
        setQuestions(data.questions);
      } catch {
        setError("Could not load questions. Make sure the backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentQuestion = questions[currentStep] || null;
  const totalSteps = questions.length;
  const progress = totalSteps > 0 ? ((currentStep) / totalSteps) * 100 : 0;

  // Handle single choice
  const handleSingleChoice = useCallback(
    (option) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    },
    [currentQuestion]
  );

  // Handle multiple choice
  const handleMultipleChoice = useCallback(
    (option) => {
      setAnswers((prev) => {
        const current = prev[currentQuestion.id] || [];
        if (current.includes(option)) {
          return { ...prev, [currentQuestion.id]: current.filter((o) => o !== option) };
        }
        return { ...prev, [currentQuestion.id]: [...current, option] };
      });
    },
    [currentQuestion]
  );

  // Handle text input
  const handleTextInput = useCallback(
    (value) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion]
  );

  // Navigation
  const goNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  };
  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "text") return true; // text is optional
    if (currentQuestion.type === "multiple_choice") return Array.isArray(answer) && answer.length > 0;
    return !!answer;
  };

  // Generate plan
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const answerList = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || (q.type === "multiple_choice" ? [] : ""),
      }));
      const result = await generatePlan(answerList);
      setPlan(result.plan);
      setPlanSource(result.source);
    } catch {
      setError("Plan generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Reset
  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setPlan(null);
    setPlanSource("");
    setError(null);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && !plan && questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // ── Plan result view ──
  if (plan) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              <span className="material-symbols-outlined text-[var(--primary)] align-middle mr-2">exercise</span>
              Your Personalized Plan
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Generated by {planSource === "gemini" ? "✨ Gemini AI" : "🤖 PostureAI Engine"} based on your answers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Generate New Plan
            </button>
            <Link
              href="/tracking"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Start Workout
            </Link>
          </div>
        </div>

        {/* Plan Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div
            className="prose-sm text-slate-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderPlanMarkdown(plan) }}
          />
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-[10px] text-slate-400 mt-4">
          ⚠️ This plan is AI-generated and does not replace professional medical consultation.
        </p>
      </div>
    );
  }

  // ── Questionnaire view ──
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          <span className="material-symbols-outlined text-[var(--primary)] align-middle mr-2">fitness_center</span>
          AI Plan Generator
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Answer 10 quick questions and our AI will create a personalized exercise plan for you
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--primary)]">
            Question {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs text-[var(--muted)]">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-blue-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-3">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (i <= currentStep || answers[questions[i]?.id]) setCurrentStep(i); }}
              className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-200 ${
                i === currentStep
                  ? "bg-[var(--primary)] text-white scale-110 shadow-lg shadow-blue-500/30"
                  : i < currentStep || answers[questions[i]?.id]
                  ? "bg-blue-100 text-[var(--primary)]"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-lg font-bold shrink-0">
              {currentQuestion.id}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{currentQuestion.question}</h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                {currentQuestion.type === "multiple_choice"
                  ? "Select all that apply"
                  : currentQuestion.type === "text"
                  ? "Type your answer (optional)"
                  : "Select one option"}
              </p>
            </div>
          </div>

          {/* Options */}
          {currentQuestion.type === "single_choice" && (
            <div className="space-y-2.5">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSingleChoice(option)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                    answers[currentQuestion.id] === option
                      ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)] shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        answers[currentQuestion.id] === option
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-slate-300"
                      }`}
                    >
                      {answers[currentQuestion.id] === option && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    {option}
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multiple_choice" && (
            <div className="space-y-2.5">
              {currentQuestion.options.map((option) => {
                const selected = (answers[currentQuestion.id] || []).includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleMultipleChoice(option)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      selected
                        ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)] shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)]"
                            : "border-slate-300"
                        }`}
                      >
                        {selected && (
                          <span className="material-symbols-outlined text-white text-xs">check</span>
                        )}
                      </div>
                      {option}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === "text" && (
            <textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleTextInput(e.target.value)}
              placeholder="Type your answer here... (e.g., I want to focus on core strength, I have a desk job, etc.)"
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none resize-none transition-colors"
            />
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>

        {currentStep < totalSteps - 1 ? (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
          >
            Next
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating || !canProceed()}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[var(--primary)] to-blue-500 text-white hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Generate My Plan
              </>
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
