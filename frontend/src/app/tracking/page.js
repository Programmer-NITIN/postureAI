"use client";

/**
 * Tracking Page — Live AI Posture Analysis & Exercise Tracking
 *
 * Features:
 * - Webcam camera feed with MediaPipe PoseLandmarker
 * - Real-time skeletal overlay
 * - Exercise selection with workout configuration
 * - Rep counting, set tracking, and form feedback
 * - Posture scoring
 * - Multilingual voice coaching in 22+ Indian languages
 * - End Workout, Pause/Resume controls
 * - Elapsed workout timer
 * - Session summary after workout
 */

import { useState, useCallback, useRef, useEffect } from "react";
import CameraFeed from "@/components/CameraFeed";
import SkeletonCanvas from "@/components/SkeletonCanvas";
import FeedbackPanel from "@/components/FeedbackPanel";
import RepCounter from "@/components/RepCounter";
import PostureScore from "@/components/PostureScore";
import SetTracker from "@/components/SetTracker";
import WorkoutPanel from "@/components/WorkoutPanel";
import LanguageSelector from "@/components/LanguageSelector";
import SessionSummary from "@/components/SessionSummary";
import { computeJointAngles } from "@/lib/poseAnalysis";
import { classifyPosture } from "@/lib/postureClassifier";
import { createStateMachine } from "@/lib/exerciseStateMachine";
import { createSession, addPostureFrame, endSession } from "@/lib/apiClient";
import { processEvents } from "@/lib/motivationEngine";
import { speakRiskFlag, speakRest, speakMotivation, speak } from "@/lib/voiceFeedback";

export default function TrackingPage() {
  // Landmarks & analysis state
  const [landmarks, setLandmarks] = useState(null);
  const [classification, setClassification] = useState("correct");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [riskFlags, setRiskFlags] = useState([]);

  // Workout state
  const [isTracking, setIsTracking] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [stateMachineState, setStateMachineState] = useState("waiting");
  const [currentRep, setCurrentRep] = useState(0);
  const [targetReps, setTargetReps] = useState(12);
  const [currentSet, setCurrentSet] = useState(1);
  const [targetSets, setTargetSets] = useState(3);
  const [sets, setSets] = useState([{ setNumber: 1, reps: [], avgScore: 0 }]);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Refs
  const stateMachineRef = useRef(null);
  const sessionIdRef = useRef(null);
  const frameCountRef = useRef(0);
  const timerRef = useRef(null);

  // Elapsed timer
  useEffect(() => {
    if (workoutActive && !workoutPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [workoutActive, workoutPaused]);

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // Handle landmarks from camera feed
  const handleLandmarks = useCallback(
    (newLandmarks) => {
      setLandmarks(newLandmarks);
      if (workoutPaused) return; // Skip processing when paused

      const angles = computeJointAngles(newLandmarks);
      const result = classifyPosture(angles, exerciseId || "general");

      setClassification(result.classification);
      setScore(result.score);
      setFeedback(result.feedback);
      setRiskFlags(result.riskFlags);

      // Speak risk flags for danger alerts
      if (result.riskFlags.length > 0 && workoutActive) {
        speakRiskFlag(result.riskFlags[0]);
      }

      // Update exercise state machine + voice feedback
      if (stateMachineRef.current && workoutActive) {
        const smResult = stateMachineRef.current.update(angles);
        setStateMachineState(smResult.state);
        setCurrentRep(smResult.currentRep);
        setCurrentSet(smResult.currentSet);

        // Trigger voice motivation events
        if (smResult.events.length > 0) {
          processEvents(smResult.events, smResult, smResult.formErrors);
        }

        if (smResult.events.includes("set_complete")) {
          setSets([...stateMachineRef.current.sets]);
          speakRest("start_rest", { seconds: stateMachineRef.current.restSeconds });
        }

        if (smResult.events.includes("workout_complete")) {
          handleWorkoutComplete();
        }
      }

      // Send frame to backend (every 5th frame)
      frameCountRef.current++;
      if (sessionIdRef.current && frameCountRef.current % 5 === 0) {
        const landmarkData = newLandmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z || 0,
          visibility: lm.visibility || 1,
        }));
        addPostureFrame(sessionIdRef.current, landmarkData).catch(() => {});
      }
    },
    [exerciseId, workoutActive, workoutPaused]
  );

  // Start workout
  const handleStartWorkout = useCallback(async (config) => {
    const { exerciseId: exId, exercise, reps, sets: numSets, rest } = config;

    setExerciseId(exId);
    setExerciseName(exercise.name);
    setTargetReps(reps);
    setTargetSets(numSets);
    setCurrentRep(0);
    setCurrentSet(1);
    setSets([{ setNumber: 1, reps: [], avgScore: 0 }]);
    setWorkoutActive(true);
    setWorkoutPaused(false);
    setIsTracking(true);
    setShowSummary(false);
    setSummaryData(null);
    setElapsedSeconds(0);
    setShowEndConfirm(false);

    // Create state machine
    stateMachineRef.current = createStateMachine(exercise, reps, numSets, rest);

    // Announce workout start
    speak(`Starting ${exercise.name}. ${reps} reps, ${numSets} sets. Get into position.`, true);

    // Start backend session
    try {
      const session = await createSession(exId);
      sessionIdRef.current = session.session_id;
      frameCountRef.current = 0;
    } catch {
      sessionIdRef.current = null;
    }
  }, []);

  // Pause / Resume
  const handlePauseResume = useCallback(() => {
    setWorkoutPaused((prev) => {
      const newState = !prev;
      if (newState) {
        speak("Workout paused. Take a breath.", true);
      } else {
        speak("Resuming workout. Let's go!", true);
      }
      return newState;
    });
  }, []);

  // Handle rest complete
  const handleRestComplete = useCallback(() => {
    if (stateMachineRef.current) {
      stateMachineRef.current.startNextSet();
      setSets([...stateMachineRef.current.sets]);
      speakRest("rest_done");
    }
  }, []);

  // End workout early
  const handleEndWorkout = useCallback(async () => {
    setShowEndConfirm(false);
    setWorkoutActive(false);
    setIsTracking(false);
    setWorkoutPaused(false);
    clearInterval(timerRef.current);

    if (stateMachineRef.current) {
      const summary = stateMachineRef.current.getSummary();
      setSummaryData(summary);
      setShowSummary(true);
    }

    speakMotivation("workout_done");

    if (sessionIdRef.current) {
      try {
        await endSession(sessionIdRef.current);
      } catch {}
      sessionIdRef.current = null;
    }
  }, []);

  // Natural workout complete
  const handleWorkoutComplete = useCallback(async () => {
    setWorkoutActive(false);
    setIsTracking(false);
    setWorkoutPaused(false);
    clearInterval(timerRef.current);

    if (stateMachineRef.current) {
      const summary = stateMachineRef.current.getSummary();
      setSummaryData(summary);
      setShowSummary(true);
    }

    if (sessionIdRef.current) {
      try {
        await endSession(sessionIdRef.current);
      } catch {}
      sessionIdRef.current = null;
    }
  }, []);

  // Language change
  const [, setLangTrigger] = useState(0);
  const handleLanguageChange = useCallback(() => {
    setLangTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            <span className="material-symbols-outlined text-[var(--primary)] align-middle mr-2">my_location</span>
            Live Posture Tracking
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Select an exercise, start your workout, and get real-time AI feedback
          </p>
        </div>
      </div>

      {/* Active Workout Info Bar */}
      {workoutActive && (
        <div className="mb-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${workoutPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
              <span className="text-sm font-semibold text-slate-900 capitalize">
                {exerciseName.replace(/_/g, " ")}
              </span>
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
              <span className="material-symbols-outlined text-base">timer</span>
              <span className="font-mono font-semibold text-slate-700">{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <span className="text-sm text-[var(--muted)]">
              Set {currentSet}/{targetSets} • Rep {currentRep}/{targetReps}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Pause / Resume */}
            <button
              onClick={handlePauseResume}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                workoutPaused
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {workoutPaused ? "play_arrow" : "pause"}
              </span>
              {workoutPaused ? "Resume" : "Pause"}
            </button>
            {/* End Workout */}
            {!showEndConfirm ? (
              <button
                onClick={() => setShowEndConfirm(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">stop_circle</span>
                End Workout
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                <span className="text-xs text-red-600 font-medium">End workout?</span>
                <button
                  onClick={handleEndWorkout}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-all"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Camera + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Camera Feed (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <CameraFeed onLandmarksUpdate={handleLandmarks} isTracking={isTracking} />
            {landmarks && <SkeletonCanvas landmarks={landmarks} />}

            {/* Paused overlay */}
            {workoutPaused && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-amber-500 mb-2">pause_circle</span>
                  <p className="text-lg font-bold text-slate-900">Workout Paused</p>
                  <p className="text-sm text-slate-500 mt-1">Click Resume to continue</p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Panel below camera */}
          <FeedbackPanel
            classification={classification}
            feedback={feedback}
            riskFlags={riskFlags}
          />
        </div>

        {/* Right: Sidebar Controls (1/3 width) */}
        <div className="space-y-4">
          {/* Posture Score */}
          <PostureScore score={score} classification={classification} />

          {/* Exercise Panel / Rep Counter */}
          {workoutActive ? (
            <>
              <RepCounter
                currentRep={currentRep}
                targetReps={targetReps}
                currentSet={currentSet}
                targetSets={targetSets}
                state={stateMachineState}
              />
              <SetTracker
                sets={sets}
                currentSet={currentSet}
                state={stateMachineState}
                restSeconds={stateMachineRef.current?.restSeconds || 30}
                onRestComplete={handleRestComplete}
              />
            </>
          ) : (
            <WorkoutPanel
              onStartWorkout={handleStartWorkout}
              disabled={false}
            />
          )}

          {/* Language Selector */}
          <LanguageSelector onChange={handleLanguageChange} />
        </div>
      </div>

      {/* Session Summary Modal */}
      {showSummary && summaryData && (
        <SessionSummary
          summary={summaryData}
          exerciseName={exerciseName}
          onClose={() => {
            setShowSummary(false);
            setStateMachineState("waiting");
          }}
        />
      )}
    </div>
  );
}
