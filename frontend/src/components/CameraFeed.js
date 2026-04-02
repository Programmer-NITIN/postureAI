"use client";

/**
 * CameraFeed — Webcam capture + MediaPipe Pose detection
 *
 * This component:
 * 1. Captures live video from the user's webcam
 * 2. Runs MediaPipe PoseLandmarker on each frame via requestAnimationFrame
 * 3. Passes detected landmarks to the parent via onLandmarksUpdate callback
 *
 * Architecture Note:
 *   We use the @mediapipe/tasks-vision WASM module directly in the browser.
 *   This gives sub-30ms detection latency with no backend round-trip.
 *   The component manages the entire lifecycle: load model → start camera → detect loop.
 */

import { useEffect, useRef, useState, useCallback } from "react";

export default function CameraFeed({ onLandmarksUpdate, isTracking }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let cancelled = false;

    async function initPoseLandmarker() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { PoseLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        if (!cancelled) {
          poseLandmarkerRef.current = poseLandmarker;
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to init PoseLandmarker:", err);
        if (!cancelled) {
          setError("Failed to load pose detection model. Please refresh.");
          setLoading(false);
        }
      }
    }

    initPoseLandmarker();
    return () => { cancelled = true; };
  }, []);

  // Start/stop camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => setCameraReady(true);
        }
      } catch (err) {
        setError("Camera access denied. Please allow camera permissions.");
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Pose detection loop
  const detectPose = useCallback(() => {
    if (!poseLandmarkerRef.current || !videoRef.current || !cameraReady || !isTracking) {
      animFrameRef.current = requestAnimationFrame(detectPose);
      return;
    }

    const video = videoRef.current;
    if (video.readyState >= 2) {
      try {
        const result = poseLandmarkerRef.current.detectForVideo(video, performance.now());
        if (result.landmarks && result.landmarks.length > 0) {
          onLandmarksUpdate(result.landmarks[0]);
        }
      } catch (e) {
        // Detection can fail on some frames — ignore and continue
      }
    }

    animFrameRef.current = requestAnimationFrame(detectPose);
  }, [cameraReady, isTracking, onLandmarksUpdate]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(detectPose);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [detectPose]);

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-[var(--card-border)]">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card-bg)] z-10">
          <div className="w-12 h-12 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[var(--muted)] text-sm">Loading AI pose model...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)] z-10 p-6">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-2">⚠️</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Tracking indicator */}
      {cameraReady && !loading && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <div
            className={`w-2 h-2 rounded-full ${
              isTracking ? "bg-green-400 animate-pulse" : "bg-yellow-400"
            }`}
          />
          <span className="text-xs text-white/80">
            {isTracking ? "Tracking Active" : "Select an exercise"}
          </span>
        </div>
      )}
    </div>
  );
}
