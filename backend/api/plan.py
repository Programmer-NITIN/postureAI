"""
AI Exercise Plan Generator API

Provides:
  1. GET /api/plan/questions — Returns 10 objective questions
  2. POST /api/plan/generate — Accepts answers, generates a personalized plan via Gemini (or fallback)
"""

import os
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session as DBSession

from backend.database.connection import get_db
from backend.database.models import Session

router = APIRouter(prefix="/api/plan", tags=["Plan Generator"])

# ── Gemini Setup (re-use the same pattern as chat.py) ──────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
_gemini_model = None


def _get_gemini():
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        return _gemini_model
    except Exception:
        return None


# ── Static Questions ──────────────────────────────────────────

QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "question": "What is your primary goal?",
        "type": "single_choice",
        "options": [
            "Recover from an injury (Rehabilitation)",
            "Improve posture & reduce back/neck pain",
            "Build general fitness & strength",
            "Increase flexibility & mobility",
            "Weight loss & toning",
        ],
    },
    {
        "id": 2,
        "question": "What is your age range?",
        "type": "single_choice",
        "options": ["Under 18", "18–25", "26–35", "36–45", "46–55", "56+"],
    },
    {
        "id": 3,
        "question": "Do you currently have any pain or injury?",
        "type": "single_choice",
        "options": [
            "No pain or injury",
            "Lower back pain",
            "Upper back / neck pain",
            "Shoulder pain",
            "Knee pain",
            "Hip pain",
            "Multiple areas",
        ],
    },
    {
        "id": 4,
        "question": "How would you describe your current fitness level?",
        "type": "single_choice",
        "options": [
            "Beginner — rarely exercise",
            "Intermediate — exercise 1–3×/week",
            "Advanced — exercise 4+×/week",
        ],
    },
    {
        "id": 5,
        "question": "What equipment do you have access to?",
        "type": "multiple_choice",
        "options": [
            "No equipment (bodyweight only)",
            "Yoga mat",
            "Resistance bands",
            "Dumbbells",
            "Pull-up bar",
            "Full gym access",
        ],
    },
    {
        "id": 6,
        "question": "How much time can you commit per session?",
        "type": "single_choice",
        "options": ["10–15 minutes", "20–30 minutes", "30–45 minutes", "45–60 minutes", "60+ minutes"],
    },
    {
        "id": 7,
        "question": "How many days per week can you exercise?",
        "type": "single_choice",
        "options": ["2 days", "3 days", "4 days", "5 days", "6–7 days"],
    },
    {
        "id": 8,
        "question": "Do you have any medical conditions we should know about?",
        "type": "single_choice",
        "options": [
            "None",
            "Heart condition",
            "Diabetes",
            "Arthritis",
            "Osteoporosis",
            "Asthma / breathing issues",
            "Other (will mention in notes)",
        ],
    },
    {
        "id": 9,
        "question": "What types of exercise do you enjoy most?",
        "type": "multiple_choice",
        "options": [
            "Stretching & Yoga",
            "Bodyweight strength",
            "Walking / Light cardio",
            "Weight training",
            "Balance & stability",
            "HIIT / Intense workouts",
        ],
    },
    {
        "id": 10,
        "question": "Any additional notes for the AI? (e.g. specific goals, restrictions, preferences)",
        "type": "text",
        "options": [],
    },
]


# ── Request / Response Models ────────────────────────────────

class PlanAnswer(BaseModel):
    question_id: int
    answer: Any  # str or list[str]


class PlanRequest(BaseModel):
    answers: List[PlanAnswer]


class PlanResponse(BaseModel):
    plan: str
    source: str  # "gemini" | "rule_based"


# ── Endpoints ────────────────────────────────────────────────

@router.get("/questions")
def get_questions():
    """Return the 10 objective questions for plan generation."""
    return {"questions": QUESTIONS}


@router.post("/generate", response_model=PlanResponse)
async def generate_plan(body: PlanRequest, db: DBSession = Depends(get_db)):
    """Generate a personalized exercise/rehab plan from user answers."""

    # Build a readable answer summary
    answer_lines = []
    for ans in body.answers:
        q = next((q for q in QUESTIONS if q["id"] == ans.question_id), None)
        if q:
            answer_lines.append(f"Q{ans.question_id}: {q['question']}\nAnswer: {ans.answer}")

    answer_text = "\n\n".join(answer_lines)

    # Optionally pull recent session context
    session_context = ""
    recent = (
        db.query(Session)
        .filter(Session.status == "completed")
        .order_by(Session.started_at.desc())
        .limit(5)
        .all()
    )
    if recent:
        avg_score = sum(s.average_score or 0 for s in recent) / len(recent)
        total_risk = sum(s.risk_alerts for s in recent)
        exercises = list(set(s.exercise_type for s in recent))
        session_context = (
            f"\n\nUSER'S RECENT POSTURE DATA (from PostureAI tracking):\n"
            f"- Average posture score: {avg_score:.1f}%\n"
            f"- Total risk alerts: {total_risk}\n"
            f"- Exercises done: {', '.join(exercises)}\n"
        )

    prompt = f"""You are Dr. AI, a world-class AI physiotherapist and fitness coach built into the PostureAI app (Viksit Bharat 2047 initiative).

A user has answered the following 10 questions about their health, goals, and preferences. Generate a detailed, personalized 4-WEEK exercise plan.

{answer_text}
{session_context}

PLAN FORMAT RULES:
1. Start with a brief 2–3 sentence personalized summary acknowledging their goal, fitness level, and any pain/conditions.
2. Structure the plan as 4 weeks, with each week having specific daily exercises.
3. For each exercise include: name, sets × reps (or duration), and a one-line form tip.
4. Include warm-up and cool-down for each day.
5. Progressively increase difficulty across the 4 weeks.
6. If they have pain/injuries, prioritize rehab exercises first and include precautions.
7. Use emojis for visual appeal (💪, 🔥, 🧘, ⚠️).
8. End with 2–3 important safety reminders.
9. Keep the plan realistic for their time and equipment constraints.
10. Use markdown formatting: bold for exercise names, headers for weeks.

CRITICAL: If they have medical conditions, always add a disclaimer to consult their doctor before starting."""

    model = _get_gemini()

    if model:
        try:
            response = model.generate_content(prompt)
            return PlanResponse(plan=response.text, source="gemini")
        except Exception:
            pass

    # ── Rule-based fallback ──────────────────────────────────
    return PlanResponse(plan=_rule_based_plan(body.answers), source="rule_based")


def _rule_based_plan(answers: List[PlanAnswer]) -> str:
    """Generate a simple rule-based plan when no LLM is available."""

    # Parse key answers
    goal = ""
    fitness = ""
    time_per_session = ""
    days = ""
    pain = ""
    for a in answers:
        if a.question_id == 1:
            goal = str(a.answer)
        elif a.question_id == 3:
            pain = str(a.answer)
        elif a.question_id == 4:
            fitness = str(a.answer)
        elif a.question_id == 6:
            time_per_session = str(a.answer)
        elif a.question_id == 7:
            days = str(a.answer)

    plan = f"""# 🏋️ Your Personalized 4-Week Exercise Plan

**Goal:** {goal or "General Fitness"}
**Level:** {fitness or "Beginner"}
**Schedule:** {days or "3 days"}/week, {time_per_session or "20-30 minutes"}/session
"""

    if "pain" in pain.lower() or "injury" in pain.lower():
        plan += f"\n> ⚠️ **Note:** You mentioned **{pain}**. The plan below includes gentle rehab exercises. Please consult a doctor before starting.\n"

    plan += """
---

## 📅 Week 1–2: Foundation & Mobility

### Each Session:

**Warm-Up (5 min):**
- Neck rolls — 10 each direction
- Arm circles — 15 forward, 15 backward
- March in place — 1 minute

**Main Workout (15–20 min):**
1. **Cat-Cow Stretch** — 3 sets × 10 reps _(Sync movement with breath)_
2. **Bodyweight Squats** — 3 sets × 10 reps _(Keep knees behind toes)_
3. **Glute Bridges** — 3 sets × 12 reps _(Squeeze glutes at the top)_
4. **Wall Push-Ups** — 3 sets × 10 reps _(Keep core tight)_
5. **Dead Bug** — 3 sets × 8 each side _(Press lower back into floor)_

**Cool-Down (5 min):**
- Child's Pose — 30 seconds
- Seated Hamstring Stretch — 30s each side
- Deep breathing — 1 minute

---

## 📅 Week 3–4: Progression & Strength

### Each Session:

**Warm-Up (5 min):**
- Jumping jacks — 30 seconds
- Hip circles — 10 each direction
- Inchworms — 5 reps

**Main Workout (20–25 min):**
1. **Squats** — 3 sets × 15 reps _(Add a 2-second hold at the bottom)_
2. **Lunges** — 3 sets × 10 each leg _(Step far enough to keep knee at 90°)_
3. **Push-Ups** (knees or full) — 3 sets × 10 reps _(Chest to floor)_
4. **Plank Hold** — 3 sets × 30 seconds _(Don't let hips sag)_
5. **Superman Hold** — 3 sets × 10 reps _(Lift arms and legs simultaneously)_
6. **Side Plank** — 2 sets × 20s each side _(Stack shoulders over wrist)_

**Cool-Down (5 min):**
- Pigeon Pose — 30s each side
- Spinal Twist — 30s each side
- Standing Quad Stretch — 30s each side

---

## 💡 Important Reminders

1. ⚠️ **Stop if you feel sharp pain** — discomfort is normal, pain is not.
2. 💧 **Stay hydrated** — drink water before, during, and after workouts.
3. 🩺 **This is AI-generated advice** — it does not replace professional medical consultation. If you have persistent issues, please see a doctor.

---

_Use PostureAI's **Live Tracking** page to get real-time form feedback on these exercises! 🎯_
"""
    return plan
