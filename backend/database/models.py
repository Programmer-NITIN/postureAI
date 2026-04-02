"""
Database models for the Posture Correction system.

Tables:
  - Session: A workout/monitoring session
  - PostureFrame: Individual posture snapshots within a session
  - ExerciseLog: Completed exercise records with scores
"""

from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from backend.database.connection import Base


class Session(Base):
    """
    Represents a single posture monitoring or exercise session.
    A session starts when the user begins tracking and ends when they stop.
    """
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    exercise_type = Column(String(50), nullable=False, default="general")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    average_score = Column(Float, nullable=True)
    total_frames = Column(Integer, default=0)
    correct_frames = Column(Integer, default=0)
    incorrect_frames = Column(Integer, default=0)
    dangerous_frames = Column(Integer, default=0)
    risk_alerts = Column(Integer, default=0)
    status = Column(String(20), default="active")  # active | completed

    # Relationships
    frames = relationship("PostureFrame", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "exercise_type": self.exercise_type,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "average_score": self.average_score,
            "total_frames": self.total_frames,
            "correct_frames": self.correct_frames,
            "incorrect_frames": self.incorrect_frames,
            "dangerous_frames": self.dangerous_frames,
            "risk_alerts": self.risk_alerts,
            "status": self.status,
        }


class PostureFrame(Base):
    """
    A single posture evaluation snapshot.
    Stores joint angles, classification, and score for one frame.
    """
    __tablename__ = "posture_frames"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    joint_angles = Column(JSON, nullable=True)          # Dict of angle name → value
    classification = Column(String(20), nullable=False)  # correct | incorrect | dangerous
    score = Column(Float, nullable=False, default=0.0)
    feedback = Column(Text, nullable=True)                # Comma-separated feedback messages
    risk_flags = Column(JSON, nullable=True)              # List of detected risks

    # Relationships
    session = relationship("Session", back_populates="frames")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "joint_angles": self.joint_angles,
            "classification": self.classification,
            "score": self.score,
            "feedback": self.feedback,
            "risk_flags": self.risk_flags,
        }
