"""
Repetition Detection System — Exercise State Machine

Implements a finite state machine (FSM) to track exercise movement phases
and count repetitions reliably. The state transitions are driven by
joint angle thresholds defined in the exercise library.

States:
  WAITING        → User not in start position
  READY          → User in start position, waiting for movement
  MOVING_DOWN    → User transitioning through the movement phase
  REP_COMPLETE   → User reached the end position (rep bottom/peak)
  RETURNING      → User returning to start position

A rep is counted only when a full cycle is completed:
  READY → MOVING_DOWN → REP_COMPLETE → RETURNING → READY

This prevents false counts from partial movements or jitter.
"""

from enum import Enum
from typing import Optional, Dict, List
from dataclasses import dataclass, field


class ExerciseState(str, Enum):
    WAITING = "waiting"
    READY = "ready"
    MOVING = "moving"
    REP_COMPLETE = "rep_complete"
    RETURNING = "returning"
    RESTING = "resting"
    SET_COMPLETE = "set_complete"
    WORKOUT_COMPLETE = "workout_complete"


@dataclass
class RepData:
    """Data captured for a single repetition."""
    rep_number: int
    max_rom: float = 0.0           # Max range of motion achieved
    min_angle: float = 180.0       # Minimum angle reached
    max_angle: float = 0.0         # Maximum angle reached
    form_score: float = 100.0      # Form quality (0-100)
    form_errors: List[str] = field(default_factory=list)
    duration_ms: float = 0.0


@dataclass
class SetData:
    """Data captured for a full set."""
    set_number: int
    reps: List[RepData] = field(default_factory=list)
    avg_score: float = 0.0


class ExerciseStateMachine:
    """
    Finite state machine for exercise rep detection.

    Usage:
        sm = ExerciseStateMachine(exercise_config, target_reps=12, target_sets=3)
        # On each frame:
        result = sm.update(current_angles)
        # result contains state, rep_count, set_count, etc.
    """

    def __init__(self, exercise_config: dict, target_reps: int = 12, target_sets: int = 3, rest_seconds: int = 30):
        self.exercise = exercise_config
        self.target_reps = target_reps
        self.target_sets = target_sets
        self.rest_seconds = rest_seconds

        self.state = ExerciseState.WAITING
        self.current_rep = 0
        self.current_set = 1
        self.total_reps_done = 0

        self.primary_angle = exercise_config.get("primary_angle", "left_knee")
        self.phases = exercise_config.get("phases", {})

        # Per-rep tracking
        self._rep_start_time: Optional[float] = None
        self._current_min_angle = 180.0
        self._current_max_angle = 0.0
        self._current_form_errors: List[str] = []

        # History
        self.sets: List[SetData] = [SetData(set_number=1)]
        self.all_reps: List[RepData] = []

        # Smoothing: require N consecutive frames in a phase to transition
        self._phase_hold_count = 0
        self._required_hold = 3  # frames

    def _angle_in_range(self, angle: float, range_tuple: list) -> bool:
        """Check if an angle falls within a range [min, max]."""
        return range_tuple[0] <= angle <= range_tuple[1]

    def _check_phase(self, angles: dict, phase_name: str) -> bool:
        """Check if current angles match a phase's requirements."""
        phase = self.phases.get(phase_name, {})
        if not phase:
            return False
        for joint, angle_range in phase.items():
            if joint in angles:
                if not self._angle_in_range(angles[joint], angle_range):
                    return False
        return True

    def _check_form(self, angles: dict) -> List[str]:
        """Validate form against ideal angles, return list of error messages."""
        errors = []
        ideal = self.exercise.get("ideal_form", {})
        feedback = self.exercise.get("form_feedback", {})
        for joint, (min_a, max_a) in ideal.items():
            if joint in angles:
                if not (min_a <= angles[joint] <= max_a):
                    if joint in feedback:
                        errors.append(feedback[joint])
        return errors

    def update(self, angles: dict, timestamp_ms: float = 0) -> dict:
        """
        Process a new frame of angle data and update the state machine.

        Args:
            angles: Dict of joint_name → angle_value
            timestamp_ms: Current timestamp in milliseconds

        Returns:
            Dict with state, rep_count, set_count, events, form_errors, etc.
        """
        primary = angles.get(self.primary_angle, None)
        events = []
        form_errors = self._check_form(angles)

        if primary is not None:
            self._current_min_angle = min(self._current_min_angle, primary)
            self._current_max_angle = max(self._current_max_angle, primary)

        # ── State transitions ────────────────────────────────

        if self.state == ExerciseState.WAITING:
            if self._check_phase(angles, "start"):
                self._phase_hold_count += 1
                if self._phase_hold_count >= self._required_hold:
                    self.state = ExerciseState.READY
                    self._phase_hold_count = 0
                    events.append("ready")
            else:
                self._phase_hold_count = 0

        elif self.state == ExerciseState.READY:
            if self._check_phase(angles, "movement"):
                self.state = ExerciseState.MOVING
                self._rep_start_time = timestamp_ms
                self._current_min_angle = primary if primary else 180.0
                self._current_max_angle = primary if primary else 0.0
                self._current_form_errors = []
                events.append("movement_start")

        elif self.state == ExerciseState.MOVING:
            # Accumulate form errors during movement
            self._current_form_errors.extend(form_errors)

            if self._check_phase(angles, "end"):
                self._phase_hold_count += 1
                if self._phase_hold_count >= 2:  # Fewer frames needed at bottom
                    self.state = ExerciseState.REP_COMPLETE
                    self._phase_hold_count = 0
                    events.append("rep_bottom")
            else:
                self._phase_hold_count = 0

        elif self.state == ExerciseState.REP_COMPLETE:
            # Wait for user to return toward start position
            if self._check_phase(angles, "movement") or self._check_phase(angles, "start"):
                self.state = ExerciseState.RETURNING
                events.append("returning")

        elif self.state == ExerciseState.RETURNING:
            if self._check_phase(angles, "start"):
                self._phase_hold_count += 1
                if self._phase_hold_count >= self._required_hold:
                    # Rep completed!
                    self.current_rep += 1
                    self.total_reps_done += 1
                    self._phase_hold_count = 0

                    # Calculate rep quality
                    rom = abs(self._current_max_angle - self._current_min_angle)
                    unique_errors = list(set(self._current_form_errors))
                    error_penalty = len(unique_errors) * 10
                    rep_score = max(0, 100 - error_penalty)

                    duration = (timestamp_ms - self._rep_start_time) if self._rep_start_time else 0

                    rep_data = RepData(
                        rep_number=self.current_rep,
                        max_rom=rom,
                        min_angle=self._current_min_angle,
                        max_angle=self._current_max_angle,
                        form_score=rep_score,
                        form_errors=unique_errors,
                        duration_ms=duration,
                    )
                    self.all_reps.append(rep_data)
                    self.sets[-1].reps.append(rep_data)
                    events.append("rep_complete")

                    # Check if set is complete
                    if self.current_rep >= self.target_reps:
                        if self.current_set >= self.target_sets:
                            self.state = ExerciseState.WORKOUT_COMPLETE
                            events.append("workout_complete")
                        else:
                            self.state = ExerciseState.SET_COMPLETE
                            # Compute set avg
                            set_scores = [r.form_score for r in self.sets[-1].reps]
                            self.sets[-1].avg_score = sum(set_scores) / len(set_scores) if set_scores else 0
                            events.append("set_complete")
                    else:
                        self.state = ExerciseState.READY
            else:
                self._phase_hold_count = 0

        elif self.state == ExerciseState.SET_COMPLETE:
            # External rest timer handles the transition
            pass

        elif self.state == ExerciseState.RESTING:
            pass

        elif self.state == ExerciseState.WORKOUT_COMPLETE:
            pass

        return {
            "state": self.state.value,
            "current_rep": self.current_rep,
            "target_reps": self.target_reps,
            "current_set": self.current_set,
            "target_sets": self.target_sets,
            "total_reps_done": self.total_reps_done,
            "events": events,
            "form_errors": form_errors,
            "primary_angle": primary,
        }

    def start_next_set(self):
        """Transition from resting to ready for the next set."""
        self.current_set += 1
        self.current_rep = 0
        self.sets.append(SetData(set_number=self.current_set))
        self.state = ExerciseState.WAITING

    def get_summary(self) -> dict:
        """Generate a workout summary."""
        all_scores = [r.form_score for r in self.all_reps]
        all_roms = [r.max_rom for r in self.all_reps]

        # Count common errors
        error_counts = {}
        for r in self.all_reps:
            for e in r.form_errors:
                error_counts[e] = error_counts.get(e, 0) + 1

        return {
            "total_reps": self.total_reps_done,
            "total_sets": len(self.sets),
            "average_score": round(sum(all_scores) / len(all_scores), 1) if all_scores else 0,
            "average_rom": round(sum(all_roms) / len(all_roms), 1) if all_roms else 0,
            "best_rep_score": max(all_scores) if all_scores else 0,
            "worst_rep_score": min(all_scores) if all_scores else 0,
            "common_errors": sorted(error_counts.items(), key=lambda x: -x[1])[:5],
            "reps_detail": [
                {
                    "rep": r.rep_number,
                    "score": r.form_score,
                    "rom": round(r.max_rom, 1),
                    "errors": r.form_errors,
                }
                for r in self.all_reps
            ],
        }
