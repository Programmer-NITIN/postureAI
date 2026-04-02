"use client";

/**
 * Doctor Dashboard — Telehealth Doctor View
 * Auto-detects network URL for cross-device access.
 */

import { useState, useEffect, useRef, useCallback } from "react";

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

export default function DoctorDashboardPage() {
  const [clientId] = useState(() => generateId());
  const [doctorName, setDoctorName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState("idle");
  const [connectedPatient, setConnectedPatient] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);
  const incomingCallRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  const handleRegister = useCallback(() => {
    if (!doctorName.trim()) return;
    const WS_URL = getWsUrl();
    console.log("[Doctor] Connecting to:", `${WS_URL}/ws/signaling/${clientId}/doctor`);
    setStatusMsg("Connecting...");

    const socket = new WebSocket(`${WS_URL}/ws/signaling/${clientId}/doctor`);

    socket.onopen = () => {
      console.log("[Doctor] WebSocket connected!");
      socket.send(JSON.stringify({ type: "register", name: doctorName.trim() }));
      setIsRegistered(true);
      setStatusMsg("Online — waiting for patients");
    };

    socket.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log("[Doctor] Received:", msg.type, msg);

      switch (msg.type) {
        case "connected":
          console.log("[Doctor] Server confirmed connection");
          break;
        case "incoming_call":
          console.log("[Doctor] INCOMING CALL from:", msg.caller_name, msg.caller_id);
          setIncomingCall({ callerId: msg.caller_id, callerName: msg.caller_name });
          setStatusMsg(`Incoming call from ${msg.caller_name}!`);
          break;
        case "offer":
          console.log("[Doctor] Received OFFER from:", msg.from_id);
          if (pcRef.current && msg.sdp) {
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);
              socket.send(JSON.stringify({ type: "answer", target_id: msg.from_id, sdp: answer }));
              console.log("[Doctor] Sent ANSWER to:", msg.from_id);
            } catch (e) {
              console.error("[Doctor] Error handling offer:", e);
            }
          } else {
            console.warn("[Doctor] No PC when offer arrived! pcRef:", !!pcRef.current);
          }
          break;
        case "ice-candidate":
          if (pcRef.current && msg.candidate) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
          }
          break;
        case "hang_up":
        case "peer_disconnected":
          console.log("[Doctor] Call ended by peer");
          endCall();
          break;
      }
    };

    socket.onerror = (e) => {
      console.error("[Doctor] WebSocket error:", e);
      setStatusMsg("Connection error!");
    };
    socket.onclose = () => {
      console.log("[Doctor] WebSocket closed");
      setIsRegistered(false);
      setStatusMsg("Disconnected");
    };
    wsRef.current = socket;
  }, [doctorName, clientId]);

  const acceptCall = useCallback(async () => {
    const call = incomingCallRef.current;
    console.log("[Doctor] acceptCall called, incomingCall:", call);
    if (!call || !wsRef.current) {
      console.warn("[Doctor] Cannot accept: no incoming call or no websocket");
      return;
    }

    setStatusMsg("Accepting call — requesting camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("[Doctor] Got camera stream");
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "ice-candidate", target_id: call.callerId, candidate: e.candidate,
          }));
        }
      };

      pc.ontrack = (e) => {
        console.log("[Doctor] Got remote track!", e.streams);
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[Doctor] PC state:", pc.connectionState);
      };

      console.log("[Doctor] Sending accept_call for:", call.callerId);
      wsRef.current.send(JSON.stringify({ type: "accept_call", caller_id: call.callerId }));
      setConnectedPatient(call.callerName);
      setCallState("in_call");
      setIncomingCall(null);
      setStatusMsg(`In call with ${call.callerName}`);
    } catch (err) {
      console.error("[Doctor] acceptCall ERROR:", err);
      setStatusMsg(`Error: ${err.message}`);
    }
  }, []);

  const rejectCall = useCallback(() => {
    const call = incomingCallRef.current;
    if (!call || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "reject_call", caller_id: call.callerId }));
    setIncomingCall(null);
    setStatusMsg("Call rejected");
  }, []);

  const endCall = useCallback(() => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setCallState("idle");
    setConnectedPatient(null);
    setIncomingCall(null);
    setStatusMsg("Call ended — waiting for patients");
  }, []);

  const hangUp = useCallback(() => {
    const call = incomingCallRef.current;
    if (wsRef.current && connectedPatient) {
      wsRef.current.send(JSON.stringify({ type: "hang_up", target_id: call?.callerId }));
    }
    endCall();
  }, [connectedPatient, endCall]);

  // ── Registration ──
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl mb-4 shadow-lg">🩺</div>
            <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
            <p className="text-sm text-[var(--muted)] mt-1">Enter your name to go online</p>
          </div>
          <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            placeholder="Dr. Smith" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none mb-4" />
          <button onClick={handleRegister} disabled={!doctorName.trim()}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-xl disabled:opacity-40 transition-all text-sm">
            Go Online & Receive Patients
          </button>
          {statusMsg && <p className="text-center text-xs text-[var(--muted)] mt-3">{statusMsg}</p>}
        </div>
      </div>
    );
  }

  // ── In-Call ──
  if (callState === "in_call") {
    return (
      <div className="h-screen bg-slate-950 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-sm font-semibold">In session with {connectedPatient}</span>
          </div>
          <button onClick={hangUp} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600">End Session</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-3 relative">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 h-full" style={{ aspectRatio: "3/4", maxHeight: "calc(100vh - 70px)" }}>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">🧑 {connectedPatient}</div>
          </div>
          <div className="absolute bottom-6 right-6 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">🩺 You</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg">🩺</div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{doctorName}</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-600 font-semibold">{statusMsg || "Online"}</span>
                </div>
              </div>
            </div>
            <button onClick={() => { wsRef.current?.close(); setIsRegistered(false); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all">
              Go Offline
            </button>
          </div>
        </div>

        {incomingCall && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl animate-bounce">📞</div>
                <div>
                  <h3 className="font-bold text-emerald-800 text-lg">Incoming Call!</h3>
                  <p className="text-sm text-emerald-600">{incomingCall.callerName} wants a consultation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={rejectCall} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600">Decline</button>
                <button onClick={acceptCall} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                  ✅ Accept Call
                </button>
              </div>
            </div>
          </div>
        )}

        {!incomingCall && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-6" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Waiting for Patients...</h3>
            <p className="text-sm text-[var(--muted)]">Your profile is visible to patients on the Telehealth page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
