"""
Analytics API Routes

Provides aggregated posture statistics and improvement trends.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from backend.database.connection import get_db
from backend.database.models import Session, PostureFrame

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
def get_summary(db: DBSession = Depends(get_db)):
    """
    Overall posture analytics summary.
    Returns aggregate stats across all completed sessions.
    """
    completed = db.query(Session).filter(Session.status == "completed").all()

    if not completed:
        return {
            "total_sessions": 0,
            "total_frames": 0,
            "average_score": 0,
            "correct_percentage": 0,
            "total_risk_alerts": 0,
            "exercise_breakdown": {},
        }

    total_sessions = len(completed)
    total_frames = sum(s.total_frames for s in completed)
    total_correct = sum(s.correct_frames for s in completed)
    total_risk = sum(s.risk_alerts for s in completed)

    avg_score = (
        sum(s.average_score for s in completed if s.average_score is not None)
        / total_sessions
    )

    correct_pct = (total_correct / total_frames * 100) if total_frames > 0 else 0

    # Exercise type breakdown
    exercise_breakdown = {}
    for s in completed:
        ex = s.exercise_type
        if ex not in exercise_breakdown:
            exercise_breakdown[ex] = {"sessions": 0, "avg_score": 0, "total_score": 0}
        exercise_breakdown[ex]["sessions"] += 1
        exercise_breakdown[ex]["total_score"] += (s.average_score or 0)

    for ex_data in exercise_breakdown.values():
        if ex_data["sessions"] > 0:
            ex_data["avg_score"] = round(ex_data["total_score"] / ex_data["sessions"], 1)
        del ex_data["total_score"]

    return {
        "total_sessions": total_sessions,
        "total_frames": total_frames,
        "average_score": round(avg_score, 1),
        "correct_percentage": round(correct_pct, 1),
        "total_risk_alerts": total_risk,
        "exercise_breakdown": exercise_breakdown,
    }


@router.get("/trend")
def get_trend(limit: int = 30, db: DBSession = Depends(get_db)):
    """
    Posture score trend over recent sessions.
    Returns a list of {session_id, date, score, exercise_type}.
    """
    sessions = (
        db.query(Session)
        .filter(Session.status == "completed")
        .order_by(Session.started_at.desc())
        .limit(limit)
        .all()
    )

    # Reverse to chronological order for charting
    sessions.reverse()

    return [
        {
            "session_id": s.id,
            "date": s.started_at.isoformat() if s.started_at else None,
            "score": round(s.average_score, 1) if s.average_score else 0,
            "exercise_type": s.exercise_type,
            "total_frames": s.total_frames,
            "correct_frames": s.correct_frames,
            "risk_alerts": s.risk_alerts,
        }
        for s in sessions
    ]
