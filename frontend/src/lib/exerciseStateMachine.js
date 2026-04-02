/**
 * Exercise State Machine — Client-side rep detection
 *
 * Mirrors the backend ExerciseStateMachine for zero-latency
 * real-time rep counting in the browser. Driven by joint angle
 * thresholds from the exercise library.
 *
 * States: waiting → ready → moving → rep_complete → returning → ready
 * A rep counts only on a full cycle.
 */

export const STATES = {
  WAITING: "waiting",
  READY: "ready",
  MOVING: "moving",
  REP_COMPLETE: "rep_complete",
  RETURNING: "returning",
  RESTING: "resting",
  SET_COMPLETE: "set_complete",
  WORKOUT_COMPLETE: "workout_complete",
};

export function createStateMachine(exerciseConfig, targetReps = 12, targetSets = 3, restSeconds = 30) {
  const primary = exerciseConfig.primary_angle || exerciseConfig.primaryAngle || "left_knee";
  const phases = exerciseConfig.phases || {};

  const sm = {
    state: STATES.WAITING,
    currentRep: 0,
    currentSet: 1,
    targetReps,
    targetSets,
    restSeconds,
    totalRepsDone: 0,
    primaryAngle: primary,

    // Per-rep tracking
    _holdCount: 0,
    _requiredHold: 3,
    _repStartTime: 0,
    _minAngle: 180,
    _maxAngle: 0,
    _formErrors: [],

    // History
    reps: [],
    sets: [{ setNumber: 1, reps: [], avgScore: 0 }],
  };

  function inRange(angle, range) {
    return angle >= range[0] && angle <= range[1];
  }

  function checkPhase(angles, phaseName) {
    const phase = phases[phaseName];
    if (!phase) return false;
    for (const [joint, range] of Object.entries(phase)) {
      if (joint in angles) {
        if (!inRange(angles[joint], range)) return false;
      }
    }
    return true;
  }

  function checkForm(angles) {
    const ideal = exerciseConfig.ideal_form || exerciseConfig.idealForm || {};
    const feedback = exerciseConfig.form_feedback || exerciseConfig.formFeedback || {};
    const errors = [];
    for (const [joint, range] of Object.entries(ideal)) {
      if (joint in angles) {
        if (!inRange(angles[joint], range)) {
          if (feedback[joint]) errors.push(feedback[joint]);
        }
      }
    }
    return errors;
  }

  sm.update = function (angles, timestampMs = Date.now()) {
    const primaryVal = angles[primary] ?? null;
    const events = [];
    const formErrors = checkForm(angles);

    if (primaryVal !== null) {
      sm._minAngle = Math.min(sm._minAngle, primaryVal);
      sm._maxAngle = Math.max(sm._maxAngle, primaryVal);
    }

    switch (sm.state) {
      case STATES.WAITING:
        if (checkPhase(angles, "start")) {
          sm._holdCount++;
          if (sm._holdCount >= sm._requiredHold) {
            sm.state = STATES.READY;
            sm._holdCount = 0;
            events.push("ready");
          }
        } else {
          sm._holdCount = 0;
        }
        break;

      case STATES.READY:
        if (checkPhase(angles, "movement")) {
          sm.state = STATES.MOVING;
          sm._repStartTime = timestampMs;
          sm._minAngle = primaryVal ?? 180;
          sm._maxAngle = primaryVal ?? 0;
          sm._formErrors = [];
          events.push("movement_start");
        }
        break;

      case STATES.MOVING:
        sm._formErrors.push(...formErrors);
        if (checkPhase(angles, "end")) {
          sm._holdCount++;
          if (sm._holdCount >= 2) {
            sm.state = STATES.REP_COMPLETE;
            sm._holdCount = 0;
            events.push("rep_bottom");
          }
        } else {
          sm._holdCount = 0;
        }
        break;

      case STATES.REP_COMPLETE:
        if (checkPhase(angles, "movement") || checkPhase(angles, "start")) {
          sm.state = STATES.RETURNING;
          events.push("returning");
        }
        break;

      case STATES.RETURNING:
        if (checkPhase(angles, "start")) {
          sm._holdCount++;
          if (sm._holdCount >= sm._requiredHold) {
            sm.currentRep++;
            sm.totalRepsDone++;
            sm._holdCount = 0;

            const rom = Math.abs(sm._maxAngle - sm._minAngle);
            const uniqueErrors = [...new Set(sm._formErrors)];
            const errorPenalty = uniqueErrors.length * 10;
            const repScore = Math.max(0, 100 - errorPenalty);
            const duration = timestampMs - sm._repStartTime;

            const repData = {
              rep: sm.currentRep,
              score: repScore,
              rom: Math.round(rom * 10) / 10,
              minAngle: Math.round(sm._minAngle * 10) / 10,
              maxAngle: Math.round(sm._maxAngle * 10) / 10,
              errors: uniqueErrors,
              durationMs: duration,
            };
            sm.reps.push(repData);
            sm.sets[sm.sets.length - 1].reps.push(repData);
            events.push("rep_complete");

            if (sm.currentRep >= sm.targetReps) {
              if (sm.currentSet >= sm.targetSets) {
                sm.state = STATES.WORKOUT_COMPLETE;
                events.push("workout_complete");
              } else {
                sm.state = STATES.SET_COMPLETE;
                const setReps = sm.sets[sm.sets.length - 1].reps;
                sm.sets[sm.sets.length - 1].avgScore =
                  setReps.reduce((a, r) => a + r.score, 0) / setReps.length;
                events.push("set_complete");
              }
            } else {
              sm.state = STATES.READY;
            }
          }
        } else {
          sm._holdCount = 0;
        }
        break;
    }

    return {
      state: sm.state,
      currentRep: sm.currentRep,
      targetReps: sm.targetReps,
      currentSet: sm.currentSet,
      targetSets: sm.targetSets,
      totalRepsDone: sm.totalRepsDone,
      events,
      formErrors,
      primaryAngle: primaryVal,
    };
  };

  sm.startNextSet = function () {
    sm.currentSet++;
    sm.currentRep = 0;
    sm.sets.push({ setNumber: sm.currentSet, reps: [], avgScore: 0 });
    sm.state = STATES.WAITING;
  };

  sm.getSummary = function () {
    const allScores = sm.reps.map((r) => r.score);
    const allRoms = sm.reps.map((r) => r.rom);
    const errorCounts = {};
    sm.reps.forEach((r) => r.errors.forEach((e) => (errorCounts[e] = (errorCounts[e] || 0) + 1)));

    return {
      totalReps: sm.totalRepsDone,
      totalSets: sm.sets.length,
      averageScore: allScores.length ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0,
      averageRom: allRoms.length ? Math.round((allRoms.reduce((a, b) => a + b, 0) / allRoms.length) * 10) / 10 : 0,
      bestRepScore: allScores.length ? Math.max(...allScores) : 0,
      worstRepScore: allScores.length ? Math.min(...allScores) : 0,
      commonErrors: Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
      repsDetail: sm.reps,
    };
  };

  return sm;
}
