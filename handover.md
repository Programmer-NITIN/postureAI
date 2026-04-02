# Agent Handover Context

## Project Overview
**Title:** AI Posture Correction & Physiotherapy Assistant
**Goal:** Build a production-quality hackathon prototype for a real-time AI posture correction system using computer vision.

## Architecture
- **Frontend:** Next.js (App Router), React, TailwindCSS v4.
- **Backend:** Python FastAPI.
- **Database:** SQLite via SQLAlchemy.
- **AI/CV Engine:** MediaPipe PoseLandmarker (Tasks Vision) running entirely client-side via WebAssembly for zero-latency pose detection.
- **Data Flow:** MediaPipe extracts 33 landmarks in browser -> Client-side JS computes joint angles and creates real-time feedback -> Summary data is sent to FastAPI backend to be saved in SQLite for analytics.

## What Has Been Implemented
✅ **Backend Fully Implemented:**
- `backend/main.py`: FastAPI server entry point.
- `backend/database/models.py`: SQLAlchemy models (`Session`, `PostureFrame`).
- `backend/ai_engine/`: Contains `geometry.py`, `pose_analysis.py`, `posture_classifier.py`, `injury_detector.py`, and `exercise_templates.py`.
- `backend/api/`: API routes for `sessions`, `analytics`, and `exercises`.
- Dependencies installed in the backend environment. (Note: using relaxed versions in `requirements.txt` to avoid source compilation issues on Windows).

✅ **Frontend Fully Implemented:**
- Scaffolding: Next.js + Tailwind v4 project initialized in `frontend/`.
- `src/lib/`: Client-side logic mirroring the backend (`poseAnalysis.js`, `postureClassifier.js`, `exerciseTemplates.js`, `apiClient.js`).
- `src/components/`: Core UI components including `CameraFeed`, `SkeletonCanvas`, `FeedbackPanel`, `PostureScore`, `SessionChart`, `ExerciseSelector`, and `Navbar`.
- `src/app/`: Views including `page.js` (Live Tracking), `dashboard/page.js`, and `history/page.js`.
- Dependencies: `@mediapipe/tasks-vision` is installed.

## Current State & Next Steps
The system is fully written but has not been functionally tested yet. I was attempting to start the backend and frontend servers to perform end-to-end verification.

**Immediate Next Steps for the New Agent:**
1. Start the FastAPI backend:
   ```powershell
   cd e:\ideathon_hack
   python -m uvicorn backend.main:app --port 8000
   ```
2. Start the Next.js frontend:
   ```powershell
   cd e:\ideathon_hack\frontend
   npm run dev
   ```
3. Open the browser at `http://localhost:3000`, grant camera permissions, and verify the live tracking, skeleton overlay, and feedback work correctly.
4. Verify the dashboard and history pages load and display correct data after completing a session.
5. Fix any runtime errors that occur during the end-to-end test.

## Environment Notes
- OS: Windows (PowerShell)
- Use standard `cd folder; command` instead of `&&` for chaining commands in PowerShell.
