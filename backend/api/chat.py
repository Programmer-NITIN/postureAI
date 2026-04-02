"""
AI Physiotherapist Chatbot API

RAG-style LLM chatbot that queries the user's posture session database
to give personalized physiotherapy advice. Uses Google Gemini API.

Includes:
- Full chat endpoint with deep user context
- Dynamic voice feedback endpoint for real-time multilingual coaching
- Falls back to a rule-based response engine if no API key is configured.
"""

import os
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from backend.database.connection import get_db
from backend.database.models import Session, PostureFrame

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])

# ── Gemini Setup ────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_model = None

def _get_gemini_model():
    global gemini_model
    if gemini_model is not None:
        return gemini_model
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        return gemini_model
    except Exception:
        return None

# ── Request / Response ──────────────────────────────────────────

class ChatHistoryItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    history: Optional[List[ChatHistoryItem]] = None

class ChatResponse(BaseModel):
    reply: str
    source: str  # "gemini" | "rule_based"
    suggestions: list = []  # 3 contextual follow-up suggestions

class VoiceFeedbackRequest(BaseModel):
    category: str    # "correction" | "motivation" | "danger"
    key: str         # e.g. "back_straight", "halfway"
    language: str    # e.g. "hi", "bn", "te"
    language_name: str  # e.g. "हिन्दी"
    context: Optional[Dict[str, Any]] = None

class VoiceFeedbackResponse(BaseModel):
    feedback: str
    language: str

# ── Context Builder ─────────────────────────────────────────────

def _build_user_context(db: DBSession, session_id: Optional[int] = None) -> str:
    """Build a comprehensive context string from the user's posture data."""
    # Get recent completed sessions
    recent_sessions = (
        db.query(Session)
        .filter(Session.status == "completed")
        .order_by(Session.started_at.desc())
        .limit(10)
        .all()
    )

    if not recent_sessions:
        return "No session data available yet. The user has not completed any posture tracking sessions."

    # Overall stats
    total = len(recent_sessions)
    avg_score = sum(s.average_score or 0 for s in recent_sessions) / total
    total_risk = sum(s.risk_alerts for s in recent_sessions)
    exercises_done = list(set(s.exercise_type for s in recent_sessions))
    total_correct = sum(s.correct_frames or 0 for s in recent_sessions)
    total_incorrect = sum(s.incorrect_frames or 0 for s in recent_sessions)
    total_dangerous = sum(s.dangerous_frames or 0 for s in recent_sessions)
    total_frames = sum(s.total_frames or 0 for s in recent_sessions)

    # Time tracking
    total_time_minutes = 0
    for s in recent_sessions:
        if s.started_at and s.ended_at:
            delta = (s.ended_at - s.started_at).total_seconds() / 60
            total_time_minutes += delta

    # Score trend (improving or declining?)
    if len(recent_sessions) >= 3:
        recent_avg = sum(s.average_score or 0 for s in recent_sessions[:3]) / 3
        older_avg = sum(s.average_score or 0 for s in recent_sessions[-3:]) / 3
        trend = "improving" if recent_avg > older_avg else "declining" if recent_avg < older_avg else "stable"
    else:
        trend = "insufficient data for trend"

    context_lines = [
        f"USER POSTURE DATA (last {total} completed sessions):",
        f"- Average posture score: {avg_score:.1f}%",
        f"- Score trend: {trend}",
        f"- Total exercise time: {total_time_minutes:.0f} minutes",
        f"- Total risk alerts: {total_risk}",
        f"- Total frames analyzed: {total_frames}",
        f"- Correct posture frames: {total_correct} ({(total_correct/max(total_frames,1)*100):.0f}%)",
        f"- Incorrect posture frames: {total_incorrect} ({(total_incorrect/max(total_frames,1)*100):.0f}%)",
        f"- Dangerous posture frames: {total_dangerous} ({(total_dangerous/max(total_frames,1)*100):.0f}%)",
        f"- Exercises performed: {', '.join(exercises_done)}",
    ]

    # Breakdown per session (last 5)
    context_lines.append("\nPER-SESSION BREAKDOWN (most recent first):")
    for s in recent_sessions[:5]:
        duration = ""
        if s.started_at and s.ended_at:
            mins = (s.ended_at - s.started_at).total_seconds() / 60
            duration = f" duration={mins:.1f}min,"
        context_lines.append(
            f"- Session #{s.id} ({s.exercise_type}):{duration} score={s.average_score:.1f}%, "
            f"correct={s.correct_frames}/{s.total_frames}, "
            f"risk_alerts={s.risk_alerts}"
        )

    # If specific session requested, get frame-level detail
    if session_id:
        frames = (
            db.query(PostureFrame)
            .filter(PostureFrame.session_id == session_id)
            .order_by(PostureFrame.timestamp.desc())
            .limit(10)
            .all()
        )
        if frames:
            risk_flags_all = []
            feedback_all = []
            angles_summary = {}
            for f in frames:
                if f.risk_flags:
                    risk_flags_all.extend(f.risk_flags)
                if f.feedback:
                    feedback_all.append(f.feedback)
                if f.joint_angles:
                    for joint, angle in f.joint_angles.items():
                        if joint not in angles_summary:
                            angles_summary[joint] = []
                        angles_summary[joint].append(angle)

            if risk_flags_all:
                # Count occurrences
                from collections import Counter
                risk_counts = Counter(risk_flags_all)
                context_lines.append(f"\nRISK FLAGS IN SESSION #{session_id}:")
                for flag, count in risk_counts.most_common(5):
                    context_lines.append(f"  - {flag} ({count}x)")

            if feedback_all:
                unique_fb = list(set(feedback_all))[:5]
                context_lines.append(f"\nFEEDBACK GIVEN IN SESSION #{session_id}:")
                for fb in unique_fb:
                    context_lines.append(f"  - {fb}")

            if angles_summary:
                context_lines.append(f"\nJOINT ANGLES (averages from session #{session_id}):")
                for joint, values in list(angles_summary.items())[:8]:
                    avg_angle = sum(values) / len(values)
                    context_lines.append(f"  - {joint}: {avg_angle:.1f}°")

    # Get common risk patterns across all sessions
    all_frames_risks = (
        db.query(PostureFrame.risk_flags)
        .join(Session)
        .filter(Session.status == "completed", PostureFrame.risk_flags.isnot(None))
        .order_by(PostureFrame.timestamp.desc())
        .limit(50)
        .all()
    )
    if all_frames_risks:
        from collections import Counter
        all_risks = []
        for (flags,) in all_frames_risks:
            if flags:
                all_risks.extend(flags)
        if all_risks:
            risk_counter = Counter(all_risks)
            context_lines.append("\nMOST COMMON RISK PATTERNS (across all sessions):")
            for flag, count in risk_counter.most_common(5):
                context_lines.append(f"  - {flag} ({count}x)")

    return "\n".join(context_lines)


SYSTEM_PROMPT = """You are Dr. AI, a friendly, knowledgeable, and warm AI health & wellness assistant built into the PostureAI app. Your purpose is to serve the mission of 'Viksit Bharat 2047' — making accessible healthcare available to all Indians.

YOUR ROLE:
1. You are open to answering ALL kinds of questions — health, fitness, nutrition, wellness, lifestyle, mental health, sleep, ergonomics, general knowledge, and even casual conversation.
2. When the user's posture tracking data is available, reference their ACTUAL scores, trends, risk patterns, and session history.
3. Recommend exercises and stretches based on their specific weak areas and risk flags when relevant.
4. Explain things in simple, easy-to-understand language.
5. Be encouraging, motivational, empathetic, and conversational.
6. If you spot injury risk patterns, warn the user firmly but kindly.
7. Keep responses concise (2-4 paragraphs max).
8. Use emojis occasionally for a friendly tone (💪, ✅, ⚠️, 🧠, 🍎).

CRITICAL RULES:
- NEVER diagnose medical conditions — always recommend seeing a qualified doctor or physiotherapist for persistent pain, numbness, or acute injury.
- NEVER prescribe medication.
- When posture data is available, ground your advice in the user's actual data.
- If no data is available, give practical general tips and encourage the user to start tracking.
- Be culturally sensitive and inclusive.
- When discussing injury risks, prioritize user safety above motivation.
- ALWAYS remind users that AI advice does NOT replace professional medical consultation for serious concerns.

RESPONSE FORMAT (CRITICAL — you MUST follow this):
You MUST respond in valid JSON with exactly two keys:
1. "reply" — your full response text (use markdown formatting, newlines as \n)
2. "suggestions" — an array of exactly 3 short follow-up questions/prompts the user might want to ask next.
   -> SUPER CRITICAL: These suggestions MUST ALWAYS be related to physiotherapy, exercises, pain relief, or posture improvement! Even if the user asked a general question, gently guide them back to physical wellness using these suggestions. Each suggestion should be 3-8 words.

Example:
{"reply": "Getting 8 hours of sleep is great for your mind! ...", "suggestions": ["Show me morning stretches", "Exercises for lower back", "How to fix neck pain"]}
"""


# ── Rule-Based Fallback ─────────────────────────────────────────

def _rule_based_reply(message: str, context: str) -> str:
    """Smart rule-based response when no LLM API key is available."""
    msg = message.lower()

    # Parse context for data
    has_data = "Average posture score" in context
    score = 0
    trend = "unknown"
    if has_data:
        try:
            score_line = [l for l in context.split("\n") if "Average posture score" in l][0]
            score = float(score_line.split(":")[1].strip().replace("%", ""))
        except Exception:
            score = 0
        try:
            trend_line = [l for l in context.split("\n") if "Score trend" in l][0]
            trend = trend_line.split(":")[1].strip()
        except Exception:
            trend = "unknown"

    if any(w in msg for w in ["hello", "hi", "hey", "namaste"]):
        base = (
            "Namaste! 🙏 I'm Dr. AI, your personal health & wellness assistant. "
            "I can help with posture, exercises, nutrition, sleep, mental wellness, and much more! "
        )
        if has_data:
            base += f"\n\n📊 Quick status: Your average score is **{score:.0f}%** and your progress is **{trend}**.\n\n"
        base += (
            "Try asking me anything — from exercise routines to nutrition tips!"
        )
        return base, ["How is my posture?", "Suggest a meal plan", "Tips for better sleep"]

    if any(w in msg for w in ["posture", "score", "how am i", "progress", "doing", "status"]):
        if not has_data:
            return "You haven't completed any sessions yet! Start a workout on the Live Tracking page, and I'll analyze your form. 💪", ["Start a workout", "What exercises to try?", "How does tracking work?"]
        if score >= 85:
            return (
                f"Excellent! 🎉 Your average posture score is **{score:.0f}%** and your trend is **{trend}**. "
                f"You're maintaining great form. Keep up the consistent practice! "
                f"Focus on maintaining this level and try more challenging exercises to keep improving."
            ), ["Try advanced exercises", "Download my report", "Show exercise breakdown"]
        elif score >= 60:
            return (
                f"Your average score is **{score:.0f}%** and trending **{trend}** — solid progress! 💪 "
                f"Focus on keeping your spine straight and knees aligned during exercises. "
                f"Regular daily practice will push you past 85%. "
                f"Pay attention to the risk alerts during your sessions — those highlight your specific weak points."
            ), ["How to improve faster?", "Show my risk patterns", "Best stretching routine"]
        else:
            return (
                f"Your posture score is **{score:.0f}%** with a **{trend}** trend — there's room for improvement. ⚠️ "
                f"Common issues include: forward head posture, rounded shoulders, and knee collapse during squats. "
                f"I recommend starting with:\n"
                f"1. **Back posture exercises** — Cat-Cow stretches, 3 sets × 10 reps\n"
                f"2. **Neck stretches** — Chin tucks, 10 reps × 5 second holds\n"
                f"3. **Wall squats** — 3 sets × 10 reps to build strength safely\n\n"
                f"⚠️ If you experience persistent pain, please consult a doctor."
            ), ["Show me back exercises", "Neck pain remedies", "Create a weekly plan"]

    if any(w in msg for w in ["exercise", "recommend", "suggest", "routine", "workout"]):
        reply = "Here's a balanced physiotherapy routine I recommend: 🏋️\n\n"
        if has_data and score < 70 and "risk" in context.lower():
            reply += "**Based on your risk patterns, prioritize these:**\n\n"
        reply += (
            "**Morning (10 min):**\n"
            "1. Neck stretches — 3 sets × 10 reps\n"
            "2. Shoulder rolls — 3 sets × 15 reps\n"
            "3. Cat-Cow back stretches — 3 sets × 10 reps\n\n"
            "**Evening (15 min):**\n"
            "1. Bodyweight Squats — 3 sets × 12 reps\n"
            "2. Lunges — 3 sets × 10 reps each leg\n"
            "3. Glute Bridges — 3 sets × 15 reps\n\n"
            "Start each exercise on the Live Tracking page for real-time AI form correction!\n\n"
            "⚠️ Always warm up before exercising and stop if you feel sharp pain."
        )
        return reply, ["Generate a full plan", "Stretches for flexibility", "How's my posture score?"]

    if any(w in msg for w in ["back", "spine", "slouch", "pain", "hurt"]):
        reply = "Back pain is often linked to poor posture habits. "
        if has_data and score < 70:
            reply += f"Based on your data (score: {score:.0f}%), your spine alignment needs attention. "
        reply += (
            "Here are my recommendations:\n\n"
            "1. **Cat-Cow Stretch** — Relieves tension in the entire spine\n"
            "2. **Child's Pose** — Gentle lower back stretch\n"
            "3. **Superman Hold** — Strengthens the posterior chain\n"
            "4. **Back Posture Monitoring** — Use our Live Tracking with 'Back Posture' mode\n\n"
            "⚠️ **Important:** If pain persists for more than a week, radiates down your legs, "
            "or is accompanied by numbness, please consult a doctor immediately. "
            "AI advice does not replace professional medical consultation."
        )
        return reply, ["Desk ergonomics tips", "Neck pain exercises", "Should I see a doctor?"]

    if any(w in msg for w in ["knee", "leg", "squat"]):
        return (
            "For knee health and leg strength: 🦵\n\n"
            "1. **Wall Squats** — Build strength without joint stress\n"
            "2. **Calf Raises** — 3 sets × 20 reps\n"
            "3. **Glute Bridges** — Activates supporting muscles\n"
            "4. **Step-ups** — Functional movement pattern\n\n"
            "⚠️ Watch for knee valgus (inward collapse) during squats — our AI detects this in real-time!\n\n"
            "**Note:** If you have sharp knee pain, swelling, or locking, please see a doctor before continuing exercises."
        ), ["What is knee valgus?", "Hip strengthening tips", "Best squat form advice"]

    if any(w in msg for w in ["neck", "head", "forward"]):
        return (
            "Forward head posture is very common, especially with extended screen time. 📱\n\n"
            "**Quick Fix Routine:**\n"
            "1. **Chin tucks** — Pull chin straight back, hold 5 sec, repeat 10×\n"
            "2. **Neck side stretches** — 30 sec each side\n"
            "3. **Thoracic spine extension** — Use a foam roller\n"
            "4. Use our 'Neck Posture' tracking mode for real-time monitoring\n\n"
            "**Goal:** Keep your neck angle above 165° for a neutral spine position.\n\n"
            "⚠️ If you experience dizziness, arm numbness, or severe neck pain, please consult a healthcare professional."
        ), ["Desk setup for neck health", "Shoulder tension relief", "Eye strain prevention"]

    if any(w in msg for w in ["stretch", "flexibility", "mobility"]):
        return (
            "Here's a full-body stretching routine for flexibility: 🤸\n\n"
            "1. **Shoulder Stretch** — Arms overhead, hold 30s each\n"
            "2. **Hamstring Stretch** — Touch toes, hold 30s\n"
            "3. **Hip Flexor Stretch** — Lunge position, hold 30s each\n"
            "4. **Spinal Twist** — Seated twist, hold 30s each side\n"
            "5. **Quad Stretch** — Standing, hold 30s each side\n\n"
            "Do this routine daily for best results. Our Live Tracking can monitor your form in real-time!"
        ), ["Yoga poses for beginners", "Morning vs evening stretch", "How to do splits safely"]

    if any(w in msg for w in ["download", "report", "pdf", "share"]):
        return (
            "You can download your clinical posture report from the **Dashboard** page! 📄\n\n"
            "Just go to Dashboard → Click '**Download Clinical Report**' button.\n"
            "The report includes:\n"
            "• Your posture scores and trends\n"
            "• Exercise breakdown\n"
            "• Risk alert history\n"
            "• AI clinical recommendations\n\n"
            "You can share this report with your doctor or physiotherapist."
        ), ["Show my posture score", "How to read my report", "Share with my doctor"]

    # Default — open to all topics
    return (
        "I'm Dr. AI, your health & wellness companion! 🌟 I can help with a wide range of topics:\n\n"
        "💪 **Fitness & Posture** — exercises, form correction, posture scores\n"
        "🍎 **Nutrition** — meal ideas, hydration, diet tips\n"
        "😴 **Sleep & Recovery** — sleep hygiene, rest strategies\n"
        "🧠 **Mental Wellness** — stress management, mindfulness\n"
        "🏥 **Health Questions** — general health info, when to see a doctor\n\n"
        "Ask me anything! I'm here to help. 😊\n\n"
        "⚠️ Remember: I am an AI assistant. For serious medical concerns, please consult a qualified healthcare professional."
    ), ["How's my posture?", "Tips for better sleep", "Quick healthy snack ideas"]


# ── Voice Feedback Endpoint ────────────────────────────────────

VOICE_PROMPT_TEMPLATE = """You are a real-time exercise coach. Generate ONE short, encouraging feedback sentence in {language_name} ({language_code}).

Category: {category}
Specific issue: {key}

Rules:
- Keep it under 15 words
- Be encouraging but firm for corrections
- Use the target language naturally (not transliteration)
- Make it contextual and specific to the movement issue
- For danger: be urgent and clear
- For motivation: be warm and energizing
- For correction: be instructive and precise

Respond with ONLY the feedback sentence, nothing else."""


@router.post("/voice-feedback", response_model=VoiceFeedbackResponse)
async def voice_feedback(body: VoiceFeedbackRequest):
    """Generate dynamic, contextual voice feedback in any Indian language."""
    model = _get_gemini_model()

    if model:
        try:
            prompt = VOICE_PROMPT_TEMPLATE.format(
                language_name=body.language_name,
                language_code=body.language,
                category=body.category,
                key=body.key.replace("_", " "),
            )
            response = model.generate_content(prompt)
            return VoiceFeedbackResponse(
                feedback=response.text.strip(),
                language=body.language,
            )
        except Exception:
            pass

    # Fallback: return a generic English message
    fallback_messages = {
        "correction": {
            "back_straight": "Straighten your back.",
            "knees_collapsing": "Keep your knees aligned.",
            "raise_arm": "Raise your arm higher.",
            "neck_straight": "Keep your neck straight.",
            "slow_down": "Slow down for better control.",
            "full_rom": "Try for fuller range of motion.",
            "alignment": "Maintain proper alignment.",
            "squat_deeper": "Go deeper in the squat.",
            "hold_position": "Hold this position.",
        },
        "motivation": {
            "halfway": "Halfway there! Keep going!",
            "two_left": "Two more reps!",
            "last_rep": "Last one, best one!",
            "set_done": "Great set! Rest now.",
            "workout_done": "Workout complete!",
            "good_form": "Great form!",
            "improving": "You're improving!",
            "rep_done": "Good rep!",
            "streak": "Great streak!",
        },
        "danger": {
            "knee_valgus": "Warning! Knees collapsing inward.",
            "forward_head": "Warning! Head too far forward.",
            "spine_flex": "Warning! Straighten your back now.",
            "general": "Warning! Correct your form.",
        },
    }
    fb = fallback_messages.get(body.category, {}).get(body.key, "Keep going!")
    return VoiceFeedbackResponse(feedback=fb, language="en")


# ── Chat Endpoint ───────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, db: DBSession = Depends(get_db)):
    """Process a chat message with the AI physiotherapist."""
    context = _build_user_context(db, body.session_id)
    model = _get_gemini_model()

    if model:
        try:
            # Build conversation history string
            hist_str = ""
            if body.history:
                hist_str = "\n".join([f"{item.role.capitalize()}: {item.content}" for item in body.history])
                hist_str = f"--- PREVIOUS CONVERSATION ---\n{hist_str}\n---------------------------\n\n"

            prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\n{hist_str}User: {body.message}\nDr. AI (respond in JSON):"
            response = model.generate_content(prompt)
            # Try to parse structured JSON response
            raw = response.text.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                raw = raw.strip()
            try:
                parsed = json.loads(raw)
                return ChatResponse(
                    reply=parsed.get("reply", response.text),
                    source="gemini",
                    suggestions=parsed.get("suggestions", [])
                )
            except (json.JSONDecodeError, TypeError):
                # Gemini didn't return valid JSON, use raw text with default suggestions
                return ChatResponse(
                    reply=response.text,
                    source="gemini",
                    suggestions=["Tell me more", "Suggest exercises", "How's my posture?"]
                )
        except Exception as e:
            # Fall back to rule-based if LLM fails
            result = _rule_based_reply(body.message, context)
            reply, suggestions = result if isinstance(result, tuple) else (result, ["How's my posture?", "Suggest exercises", "Back pain help"])
            return ChatResponse(reply=reply, source="rule_based", suggestions=suggestions)
    else:
        result = _rule_based_reply(body.message, context)
        reply, suggestions = result if isinstance(result, tuple) else (result, ["How's my posture?", "Suggest exercises", "Back pain help"])
        return ChatResponse(reply=reply, source="rule_based", suggestions=suggestions)
