"""
Session Management API Routes

Handles creating, updating, and retrieving posture monitoring sessions.
Also accepts posture frame data for classification and storage.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from backend.database.connection import get_db
from backend.database.models import Session, PostureFrame
from backend.ai_engine.pose_analysis import compute_joint_angles
from backend.ai_engine.posture_classifier import classify
from backend.ai_engine.injury_detector import run_all_detectors

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


# ── Request / Response Schemas ──────────────────────────────────

class CreateSessionRequest(BaseModel):
    exercise_type: str = "general"


class PostureFrameRequest(BaseModel):
    landmarks: List[dict]  # 33 MediaPipe landmarks


class EndSessionRequest(BaseModel):
    pass


class SessionResponse(BaseModel):
    id: int
    exercise_type: str
    started_at: Optional[str]
    ended_at: Optional[str]
    average_score: Optional[float]
    total_frames: int
    correct_frames: int
    incorrect_frames: int
    dangerous_frames: int
    risk_alerts: int
    status: str

    class Config:
        from_attributes = True


# ── Routes ──────────────────────────────────────────────────────

@router.post("", response_model=SessionResponse)
def create_session(body: CreateSessionRequest, db: DBSession = Depends(get_db)):
    """Start a new posture monitoring session."""
    session = Session(
        exercise_type=body.exercise_type,
        started_at=datetime.now(timezone.utc),
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session.to_dict()


@router.post("/{session_id}/frames")
def add_posture_frame(session_id: int, body: PostureFrameRequest, db: DBSession = Depends(get_db)):
    """
    Process a single posture frame:
    1. Compute joint angles from landmarks
    2. Classify posture against exercise template
    3. Run injury risk detectors
    4. Store the frame and update session counters
    """
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    # Step 1: Compute joint angles
    angles = compute_joint_angles(body.landmarks)

    # Step 2: Classify posture
    result = classify(angles, session.exercise_type)

    # Step 3: Check for injury risks
    injury_risks = run_all_detectors(body.landmarks)
    if injury_risks:
        result.risk_flags.extend(injury_risks)
        if result.classification != "dangerous":
            result.classification = "dangerous"

    # Step 4: Store frame
    frame = PostureFrame(
        session_id=session_id,
        joint_angles=angles,
        classification=result.classification,
        score=result.score,
        feedback="; ".join(result.feedback) if result.feedback else None,
        risk_flags=result.risk_flags if result.risk_flags else None,
    )
    db.add(frame)

    # Step 5: Update session counters
    session.total_frames += 1
    if result.classification == "correct":
        session.correct_frames += 1
    elif result.classification == "incorrect":
        session.incorrect_frames += 1
    elif result.classification == "dangerous":
        session.dangerous_frames += 1
    if injury_risks:
        session.risk_alerts += len(injury_risks)

    db.commit()

    return result.to_dict()


@router.put("/{session_id}/end", response_model=SessionResponse)
def end_session(session_id: int, db: DBSession = Depends(get_db)):
    """End an active session and compute the average posture score."""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at = datetime.now(timezone.utc)
    session.status = "completed"

    # Compute average score from all frames
    frames = db.query(PostureFrame).filter(PostureFrame.session_id == session_id).all()
    if frames:
        session.average_score = sum(f.score for f in frames) / len(frames)
    else:
        session.average_score = 0.0

    db.commit()
    db.refresh(session)
    return session.to_dict()


@router.get("", response_model=List[SessionResponse])
def list_sessions(limit: int = 20, db: DBSession = Depends(get_db)):
    """List recent sessions, newest first."""
    sessions = (
        db.query(Session)
        .order_by(Session.started_at.desc())
        .limit(limit)
        .all()
    )
    return [s.to_dict() for s in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    """Get details about a specific session."""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()
