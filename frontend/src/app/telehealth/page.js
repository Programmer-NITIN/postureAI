"use client";

/**
 * Telehealth Page — Patient Side
 * After call is accepted: shows exercise tracking with skeleton overlay,
 * streams the overlaid canvas to the doctor via WebRTC.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import CameraFeed from "@/components/CameraFeed";
import SkeletonCanvas from "@/components/SkeletonCanvas";
import WorkoutPanel from "@/components/WorkoutPanel";
import { computeJointAngles } from "@/lib/poseAnalysis";
import { classifyPosture } from "@/lib/postureClassifier";

function getWsUrl() {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}`;
  }
  return "ws://localhost:8000";
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export default function TelehealthPage() {
  const [clientId] = useState(() => generateId());
  const [ws, setWs] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [callState, setCallState] = useState("idle");
  const [connectedDoctor, setConnectedDoctor] = useState(null);
  const [connectedDoctorId, setConnectedDoctorId] = useState(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [error, setError] = useState(null);

  // Tracking state
  const [landmarks, setLandmarks] = useState(null);
  const [classification, setClassification] = useState("correct");
  const [score, setScore] = useState(0);
  const [jointStatus, setJointStatus] = useState({});
  const [isTracking, setIsTracking] = useState(true); // Always track in telehealth
  const [exerciseName, setExerciseName] = useState("");

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const compositeCanvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Process landmarks from CameraFeed
  const handleLandmarks = useCallback((lm) => {
    setLandmarks(lm);
    if (lm) {
      const angles = computeJointAngles(lm);
      const result = classifyPosture(angles);
      setClassification(result.classification);
      setScore(result.score);
      setJointStatus(result.jointStatus || {});
    }
  }, []);

  // Handle exercise selection from WorkoutPanel
  const handleExerciseSelect = useCallback((exercise) => {
    setExerciseName(exercise.name || exercise);
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const WS_URL = getWsUrl();
    console.log("[Patient] Connecting:", `${WS_URL}/ws/signaling/${clientId}/patient`);
    const socket = new WebSocket(`${WS_URL}/ws/signaling/${clientId}/patient`);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("[Patient] WS connected");
      socket.send(JSON.stringify({ type: "register", name: `Patient-${clientId.slice(0, 4)}` }));
      setError(null);
    };

    socket.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log("[Patient] Recv:", msg.type);
      switch (msg.type) {
        case "doctors_update":
          setDoctors(msg.doctors || []);
          break;
        case "call_accepted":
          console.log("[Patient] Call accepted by:", msg.doctor_name);
          setCallState("in_call");
          setConnectedDoctor(msg.doctor_name);
          setConnectedDoctorId(msg.doctor_id);
          // Start WebRTC — we'll capture the composite canvas later
          startWebRTC(msg.doctor_id, socket);
          break;
        case "call_rejected":
          setCallState("idle");
          setError("Doctor declined.");
          break;
        case "answer":
          if (pcRef.current && msg.sdp) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          }
          break;
        case "ice-candidate":
          if (pcRef.current && msg.candidate) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
          }
          break;
        case "hang_up":
        case "peer_disconnected":
          endCall();
          break;
      }
    };

    socket.onerror = () => setError("Could not connect to signaling server.");
    socket.onclose = () => setWs(null);
    setWs(socket);
    return () => { socket.close(); };
  }, [clientId]);

  // Start WebRTC: capture the composite canvas and send to doctor
  const startWebRTC = async (doctorId, socket) => {
    try {
      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Patient] Got audio");

      // The composite canvas will be set up once the component renders
      // We delay slightly to ensure the canvas is in the DOM
      setTimeout(() => {
        const canvas = compositeCanvasRef.current;
        if (!canvas) {
          console.warn("[Patient] No composite canvas yet");
          return;
        }

        const canvasStream = canvas.captureStream(20);
        const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
        pcRef.current = pc;

        // Add canvas video
        canvasStream.getVideoTracks().forEach((t) => pc.addTrack(t, canvasStream));
        // Add audio
        audioStream.getAudioTracks().forEach((t) => pc.addTrack(t, audioStream));

        pc.onicecandidate = (e) => {
          if (e.candidate && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ice-candidate", target_id: doctorId, candidate: e.candidate }));
          }
        };

        pc.onconnectionstatechange = () => console.log("[Patient] PC:", pc.connectionState);

        // Create and send offer
        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer);
          socket.send(JSON.stringify({ type: "offer", target_id: doctorId, sdp: offer }));
          console.log("[Patient] Sent offer");
        });
      }, 500);
    } catch (err) {
      console.error("[Patient] WebRTC error:", err);
      setError("Microphone access denied.");
    }
  };

  // Draw composite canvas: video + skeleton overlay for streaming to doctor
  useEffect(() => {
    if (callState !== "in_call") return;

    const draw = () => {
      const canvas = compositeCanvasRef.current;
      if (!canvas) { animFrameRef.current = requestAnimationFrame(draw); return; }

      const ctx = canvas.getContext("2d");
      canvas.width = 640;
      canvas.height = 480;

      // Draw the camera video
      const videoEl = document.querySelector("video[autoplay]");
      if (videoEl && videoEl.readyState >= 2) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Mirror
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw skeleton overlay
      if (landmarks && landmarks.length >= 33) {
        const CONNECTIONS = [
          [11, 12], [11, 23], [12, 24], [23, 24],
          [11, 13], [13, 15], [12, 14], [14, 16],
          [23, 25], [25, 27], [24, 26], [26, 28],
        ];

        ctx.lineWidth = 3;
        for (const [i, j] of CONNECTIONS) {
          const a = landmarks[i], b = landmarks[j];
          if (a.visibility < 0.3 || b.visibility < 0.3) continue;
          ctx.beginPath();
          ctx.strokeStyle = "#00ff88";
          ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
          ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
          ctx.stroke();
        }

        // Draw joints
        for (let i = 0; i < landmarks.length; i++) {
          const lm = landmarks[i];
          if (lm.visibility < 0.3) continue;
          ctx.beginPath();
          ctx.fillStyle = "#00ff88";
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Overlay info badge
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(8, 8, 220, 32);
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 13px Inter, system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`🤖 PostureAI — Score: ${score}%`, 16, 29);

      if (exerciseName) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(8, 44, 220, 24);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Inter, system-ui";
        ctx.fillText(`🏋️ ${exerciseName}`, 16, 61);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [callState, landmarks, score, exerciseName]);

  const callDoctor = (docId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setCallState("calling");
    setError(null);
    wsRef.current.send(JSON.stringify({ type: "call_doctor", doctor_id: docId }));
  };

  const endCall = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setCallState("idle");
    setConnectedDoctor(null);
    setConnectedDoctorId(null);
  };

  const hangUp = () => {
    if (wsRef.current && connectedDoctorId) {
      wsRef.current.send(JSON.stringify({ type: "hang_up", target_id: connectedDoctorId }));
    }
    endCall();
  };

  // ── IN-CALL VIEW: Tracking + Exercise + Skeleton ──
  if (callState === "in_call") {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-sm font-semibold">Connected to {connectedDoctor}</span>
            <span className="text-slate-400 text-xs">Score: {score}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPrivacyMode((p) => !p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                privacyMode ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-700 text-slate-300 border border-slate-600"
              }`}>
              {privacyMode ? "🔒 Privacy" : "🎥 Camera"}
            </button>
            <button onClick={hangUp} className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600">
              End Call
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3">
          {/* Main — Camera + Skeleton (what doctor sees) */}
          <div className="lg:col-span-2 relative">
            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-700">
              {/* Camera feed with MediaPipe tracking */}
              <CameraFeed onLandmarksUpdate={handleLandmarks} isTracking={isTracking} />
              {/* Skeleton overlay on patient's screen */}
              <SkeletonCanvas landmarks={landmarks} jointStatus={jointStatus} showGhost={true} />
            </div>

            {/* Hidden canvas: composites video + skeleton for WebRTC streaming */}
            <canvas ref={compositeCanvasRef} className="hidden" width={640} height={480} />

            {/* Score badge */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
              <div className="text-xs text-slate-400">Posture Score</div>
              <div className={`text-2xl font-bold ${score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                {score}%
              </div>
            </div>

            {exerciseName && (
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
                <span className="text-white text-xs font-semibold">🏋️ {exerciseName}</span>
              </div>
            )}
          </div>

          {/* Side panel — Exercise selection */}
          <div className="space-y-3">
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold text-sm mb-3">
                <span className="material-symbols-outlined text-sm align-middle mr-1 text-cyan-400">fitness_center</span>
                Select Exercise
              </h3>
              <WorkoutPanel onStartWorkout={(config) => setExerciseName(config.exercise?.name || "")} />
            </div>

            {/* Live stats */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-bold text-sm mb-2">Live Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Classification</span>
                  <span className={`font-semibold ${classification === "correct" ? "text-green-400" : "text-yellow-400"}`}>
                    {classification}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Posture Score</span>
                  <span className="text-white font-semibold">{score}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Streaming to</span>
                  <span className="text-cyan-400 font-semibold">{connectedDoctor}</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-300 text-xs">
                Your doctor sees your live video with the AI skeleton overlay. Select an exercise and follow along!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MARKETPLACE VIEW ──
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          <span className="material-symbols-outlined text-[var(--primary)] align-middle mr-2">video_call</span>
          Telehealth — Connect with a Doctor
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Start a live video consultation with AI posture analysis
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${ws ? "bg-green-400" : "bg-red-400"}`} />
        <span className="text-xs text-[var(--muted)]">{ws ? "Connected to server" : "Disconnected"}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">⚠️ {error}</div>
      )}

      {doctors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">person_search</span>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Doctors Online</h3>
          <p className="text-sm text-[var(--muted)] mb-4">
            Ask the doctor to open the{" "}
            <Link href="/doctor" className="text-[var(--primary)] font-semibold underline">Doctor Dashboard</Link>
          </p>
          <div className="w-8 h-8 mx-auto border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {doc.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{doc.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${doc.status === "available" ? "bg-green-400" : "bg-amber-400"}`} />
                    <span className="text-xs text-[var(--muted)] capitalize">{doc.status.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => callDoctor(doc.id)}
                disabled={doc.status !== "available" || callState === "calling"}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                {callState === "calling" ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Calling...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">video_call</span> Start Consultation</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-bold text-[var(--primary)] mb-2">🔒 Privacy & AI Features</h3>
        <p className="text-sm text-slate-600">
          During the call, your doctor sees your live video with <strong>AI skeleton overlay</strong> for posture assessment.
          You can select exercises and the doctor monitors your form in real-time.
        </p>
      </div>
    </div>
  );
}
