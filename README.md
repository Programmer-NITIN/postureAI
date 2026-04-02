<div align="center">
  <h1>🏋️‍♂️ PostureAI</h1>
  <h3>The Intelligent, Privacy-First Physiotherapy & Telehealth Ecosystem</h3>
  <p><i>Democratizing physical rehabilitation through real-time AI computer vision and WebRTC telehealth.</i></p>
</div>

<hr>

## 🚨 The Problem

In today's remote-first world, physical well-being is deteriorating rapidly. Long hours at desks lead to chronic muscular issues, but traditional physiotherapy is flawed:
1. **High Cost & Inaccessibility:** Professional physiotherapy is expensive and requires physical travel, alienating lower-income or mobility-impaired demographics.
2. **Zero Form Verification at Home:** Patients are sent home with generic exercise sheets. Over 60% perform exercises with incorrect form, negating benefits or causing further injury.
3. **Lack of Remote Telemetry for Doctors:** Doctors cannot accurately monitor a patient's biomechanics over a standard Zoom call.

## 💡 Our Solution: PostureAI

**PostureAI** is a comprehensive, end-to-end digital healthcare platform that transforms any standard webcam into a highly accurate biomechanical tracking engine. It acts as a **Digital Physiotherapist** for the patient while providing an advanced **Real-Time Telemetry Dashboard** for their doctor.

From automated rep counting and injury risk detection to peer-to-peer WebRTC consultations, PostureAI bridges the gap between clinical supervision and home rehabilitation.

---

## 🔥 Key Innovations & Unique Selling Propositions (USPs)

### 1. Zero-Latency, Privacy-First Computer Vision
Unlike traditional AI systems that upload video streams to the cloud, **PostureAI executes 100% of its pose detection locally in the browser**.
- Utilizes **MediaPipe Pose (WASM)** to map 33 3D skeletal landmarks.
- **Privacy Guaranteed:** Frames are processed locally. Only metadata (angles, scores) are sent to the backend/doctor.
- Performs complex biomechanical dot-product angle math at 30+ FPS directly in the browser.

### 2. Clinical WebRTC Telehealth Suite
- **Doctor & Patient Portals:** Dedicated experiences tailored to specific needs.
- **Embedded WebRTC:** Custom FastAPI signaling server establishes secure Peer-to-Peer (`RTCPeerConnection`) video.
- **Telemetry DataChannels:** Live biomechanical data (posture score, current rep, active exercise, injury alerts) streams across `RTCDataChannel` directly to the doctor’s dashboard alongside the video feed.

### 3. "PhysioBot" & AI Care Generation
- **Integrated AI Assistant:** A floating, context-aware LLM chatbot helps patients understand their recovery timelines and biomechanics.
- **Dynamic Plan Generation:** Patients can input their ailments, and the AI generates tailored multi-week workout structures (e.g., specific rest times, sets, target angles).

### 4. Accessibility & Gamified Tracking
- **Multilingual Support:** Audio prompts and form corrections spoken natively via Browser SpeechSynthesis in **English, Hinglish, and Gujarati**.
- **Automated Set/Rep Management:** Intelligent tracking of repetitions and rest periods.
- **Visual Color Mapping:** The skeleton overlay dynamically shifts (Green = Good, Yellow = Warning, Red = Danger Zone) as the patient moves.

---

## 🏗 Detailed System Architecture

```text
                                    ┌────────────────────────────────────┐
                                    │          DOCTOR WORKSTATION        │
                                    │                                    │
                                    │  1. Live Patient Video Matrix      │
                                    │  2. Real-Time Posture Gauge        │
                                    │  3. Current Angle Logs & Alerts    │
                                    └─────────────▲──────────────────────┘
                                                  │
                                          [WebRTC P2P Context]
                       ┌──────────────────────────┴─────┬────────────────┐
                       │    Video / Audio Stream (MediaStream API)       │
                       │    Telemetry Data Stream (RTCDataChannel)       │
                       └───────────▲────────────────────┴────────────────┘
                                   │
┌──────────────────────────────────┴───────────────────────────────────────┐
│                          PATIENT BROWSER (Next.js)                       │
│                                                                          │
│  [Hardware] Camera ───> [WASM Engine] MediaPipe PoseLandmarker (33 Pts)  │
│                                           │                              │
│  [Logic] Angle Math (Vectors/Dot Products) & Injury Risk Engine          │
│                                           │                              │
│  [UI Layer] Canvas Skeleton Overlay + Audio Voice Engine (Speech Synth)  │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ (WebSockets & REST)
┌──────────────────────────▼───────────────────────────────────────────────┐
│                          BACKEND (FastAPI - Python)                      │
│                                                                          │
│  [Signaling] WebSocket Matchmaker (Handles WebRTC Offers/Answers/ICE)    │
│  [Database] SQLite (SQLAlchemy) - Saves Sessions, Reps, Historical Data  │
│  [AI Core] LLM Hooks for PhysioBot and Workout Plan Generation           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow Breakdown

### A. The Patient's Journey (Solo Session)
1. Patient logs into the **Patient Dashboard**.
2. Selects an exercise (e.g., "Squat" or "Back Posture"), sets the language to "Gujarati", and begins tracking.
3. Patient steps backward. PostureAI detects the full body.
4. As they squat, the **PoseAnalysis JS Engine** calculates knee flexions and spinal alignment in real-time.
5. If the patient exhibits **"Knee Valgus"** (knees caving inward), the AI detects the risk, flashes the joints red, and issues a vocal warning to stabilize their knees.
6. Upon completion, the session is saved to the **SQLite DB**, and the patient views their historic performance trends on the dashboard.

### B. The Telehealth Journey (Doctor & Patient)
1. Doctor logs into the **Telehealth Portal** and shares a `Room ID`.
2. Patient joins the same room. The **FastAPI Signaling Server** handles the WebRTC handshake.
3. Secure P2P video stream begins.
4. Patient performs their routine. Their local browser computes the skeletal model.
5. Patient's browser pushes live, lightweight JSON packets (e.g., `{ score: 85, alert: null, rep: 3 }`) over the **DataChannel**.
6. The Doctor sees the video and the live updating metrics, gaining a clinical level of insight impossible over a standard Zoom call.

---

## 🌍 Social Impact & Business Value

- **Democratization of Healthcare:** Brings tier-1 biomechanical analysis to anyone with a smartphone/laptop, bridging the rural-urban healthcare divide.
- **Reduced Insurance Premiums & Medical Costs:** Preventative care and correct rehabilitation minimize re-injury rates, drastically lowering long-term medical expenditures.
- **SaaS Potential:** Gyms, physiotherapy clinics, and corporate wellness programs can license this platform as a white-label solution to monitor their users securely.

---

## 💻 Technical Implementation Stack

| Layer | Technologies Selected | Rationale |
|---|---|---|
| **Frontend Framework** | `Next.js` (App Router) + `React` | SEO optimized, fast page loads, clean component architecture. |
| **Styling** | `Tailwind CSS v4` | rapid, responsive utility-class styling for complex UI elements. |
| **Computer Vision Engine** | `MediaPipe SDK` (`tasks-vision`) | Lightweight WASM binaries ensure 30fps tracking purely client-side. |
| **Logic & Math** | Pure JavaScript / Web Math | Custom algorithms for 3D vector analysis and limb angles. |
| **Backend API** | `Python FastAPI` | Ultra-fast ASGI framework, perfect for handling WebSockets concurrently. |
| **Database** | `SQLite` + `SQLAlchemy` | Lightweight, efficient persistent storage for rapid prototyping. |
| **Telehealth Networking** | `WebRTC API` (Native) | Low-latency P2P video and high-speed synchronized DataChannels. |
| **Generative AI** | LLM API Integration | Drives the dynamic PhysioBot and multi-week plan generators. |

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- Node.js 18+
- Python 3.10+
- Webcam

### 1. Server Setup (Backend)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*(Backend APIs and WebSocket handlers run on port `8000`)*

### 2. Client Setup (Frontend)
```bash
cd frontend
npm install
npm run dev
```
*(Access the web app at `http://localhost:3000`)*

---

## 🏆 Hackathon Focus Areas
We focused heavily on:
- **Zero-Latency Processing:** Processing math locally rather than sending image frames to a massive cloud GPU. We saved bandwidth and privacy.
- **Complex Telemetry Integration:** Integrating WebRTC video with native DataChannels to prove that real-time clinical monitoring is viable over the web.
- **Inclusivity:** Integrating regional languages to ensure tech accessibility across varied demographics.

---

<div align="center">
  <b>Built for Impact. Built for the Future of Health.</b>
</div>
