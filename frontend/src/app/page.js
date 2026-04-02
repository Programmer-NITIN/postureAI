"use client";

/**
 * Landing Page — PostureAI Home
 *
 * Professional landing page inspired by VisionPhysio design:
 * - Hero section with bold headline, CTA, and phone mockup
 * - "How it Works" 3-step feature section
 * - Benefits section with image + testimonial
 * - CTA banner
 * - Footer with links and Viksit Bharat 2047 badge
 */

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Left — Text */}
            <div className="lg:col-span-7 xl:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                </span>
                Viksit Bharat 2047 — AI Healthcare
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6">
                Correct Your Posture in{" "}
                <span className="text-[var(--primary)]">Real-Time</span> with AI
              </h1>

              <p className="text-lg lg:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed">
                Experience the future of physiotherapy. PostureAI uses advanced
                computer vision to provide instant feedback, helping you move
                better and prevent injuries from the comfort of home.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tracking"
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  Start Free Session
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="border-2 border-slate-200 hover:bg-slate-50 px-8 py-4 rounded-xl text-lg font-bold transition-all text-center"
                >
                  View Dashboard
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">P</div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">A</div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold">R</div>
                </div>
                <p className="text-sm text-slate-400">
                  Supporting <span className="font-bold text-slate-700">1.4B+</span> Indians in accessible healthcare
                </p>
              </div>
            </div>

            {/* Right — Hero Visual (landscape image with AI overlay) */}
            <div className="mt-16 lg:mt-0 lg:col-span-5 xl:col-span-6 relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <div className="aspect-[4/3] lg:aspect-square bg-slate-100 relative overflow-hidden">
                  {/* Hero Image */}
                  <img
                    alt="Person practicing guided physical therapy at home with AI assistance"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa2GgtDn72gxH9kMCKT9qjxXG7gcsXRt3z5zsQMGdoQxrJbmZeeUrF4161m8c5NQ6x7PSF79jrfOto-Y19XYTWYSBwU8VTWP4T4vUJZs5IaTSIKxIUriPVRaMN4CvUNrmwJ8oiX-pb537UE5NLYLV9t5n8htZkqX3OrtgjTKWS8KGeigFf3RKprQ7G6A722c1ckXXeb7svuuzu57xviSqGceQfMcFhdOsFAwxSQfLjPvx0TIjRG1oKGBorJ7cSO_8Hq7XEslZgwzQ"
                  />

                  {/* AI Skeleton Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                      <g opacity="0.8">
                        {/* Head */}
                        <circle cx="200" cy="80" r="3" fill="white" className="animate-pulse" />
                        {/* Shoulders */}
                        <circle cx="150" cy="120" r="3" fill="white" />
                        <circle cx="250" cy="120" r="3" fill="white" />
                        <line x1="150" y1="120" x2="250" y2="120" stroke="white" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
                        {/* Spine */}
                        <line x1="200" y1="80" x2="200" y2="220" stroke="#007bff" strokeWidth="1.5" opacity="0.4" />
                        {/* Arms */}
                        <circle cx="120" cy="180" r="3" fill="white" />
                        <circle cx="280" cy="180" r="3" fill="white" />
                        <line x1="150" y1="120" x2="120" y2="180" stroke="white" strokeWidth="1" opacity="0.3" />
                        <line x1="250" y1="120" x2="280" y2="180" stroke="white" strokeWidth="1" opacity="0.3" />
                        {/* Hips */}
                        <circle cx="170" cy="250" r="3" fill="white" />
                        <circle cx="230" cy="250" r="3" fill="white" />
                        <line x1="170" y1="250" x2="230" y2="250" stroke="#007bff" strokeWidth="2" opacity="0.6" />
                        {/* Animated alignment rings */}
                        <circle cx="150" cy="120" r="8" fill="none" stroke="#007bff" strokeWidth="1" className="animate-ping" style={{ animationDuration: "4s" }} />
                        <circle cx="250" cy="120" r="8" fill="none" stroke="#007bff" strokeWidth="1" className="animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
                      </g>
                    </svg>
                  </div>

                  {/* Bottom gradient fade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Glassmorphic Assessment Panel */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-white text-[10px] font-bold uppercase tracking-widest">Alignment Optimized</span>
                        </div>
                        <div className="text-white font-mono text-xs opacity-80">98.4% Accuracy</div>
                      </div>
                      <div className="text-white font-semibold text-sm leading-snug">
                        &quot;Excellent form. Maintain this torso angle for 5 more reps.&quot;
                      </div>
                      <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--primary)] w-3/4 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background decorations */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-[var(--primary)] font-bold tracking-wider uppercase text-sm mb-3">Simple & Effective</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">Advanced Computer Vision in your pocket</h3>
            <p className="text-slate-500 text-lg">Our AI analyzes your movements through your device camera to ensure perfect form and safety every time.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">screenshot_region</span>
              </div>
              <h4 className="text-xl font-bold mb-3">Position your device</h4>
              <p className="text-slate-500 leading-relaxed">Place your device on a stable surface roughly 6 feet away for a full-body view. No extra hardware required.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">accessibility_new</span>
              </div>
              <h4 className="text-xl font-bold mb-3">Follow the guide</h4>
              <p className="text-slate-500 leading-relaxed">Perform custom exercises with real-time skeletal tracking that highlights your joints and alignment.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">record_voice_over</span>
              </div>
              <h4 className="text-xl font-bold mb-3">Get instant correction</h4>
              <p className="text-slate-500 leading-relaxed">Receive real-time voice feedback in 22+ Indian languages the moment your form slips, preventing injury.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24" id="benefits">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 rounded-[2.5rem] p-8 lg:p-16 overflow-hidden relative">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div className="mb-12 lg:mb-0">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 mb-8">The Benefits of PostureAI</h3>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[var(--primary)]">verified_user</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg">Prevent Injuries</h5>
                      <p className="text-slate-500">Stop micro-tears before they become chronic issues by maintaining perfect posture during exercises.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[var(--primary)]">home_health</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg">Clinic Quality at Home</h5>
                      <p className="text-slate-500">Get the same level of guidance you'd expect from a private clinic without the travel.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[var(--primary)]">insights</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg">Track Progress</h5>
                      <p className="text-slate-500">Detailed metrics on your range of motion, consistency, and strength improvements over time.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[var(--primary)]">translate</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg">22+ Indian Languages</h5>
                      <p className="text-slate-500">Voice coaching in Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and more.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-xl bg-white p-8">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-[var(--primary)]">92%</p>
                      <p className="text-xs text-slate-500 mt-1">Avg Form Score</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-emerald-500">↑34%</p>
                      <p className="text-xs text-slate-500 mt-1">Improvement</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-purple-500">22+</p>
                      <p className="text-xs text-slate-500 mt-1">Languages</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-black text-amber-500">24/7</p>
                      <p className="text-xs text-slate-500 mt-1">AI Available</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className="material-symbols-outlined text-amber-400 text-lg" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                      ))}
                    </div>
                    <p className="text-sm font-medium italic text-slate-600">
                      "It's like having a physical therapist in my pocket 24/7. The voice coaching in Hindi is amazing!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Doctor Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[var(--primary)] font-bold tracking-wider uppercase text-sm mb-3">AI Physiotherapist</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">Meet Dr. AI — Your Personal Coach</h3>
            <p className="text-slate-500 text-lg">Chat with our AI physiotherapist who has access to all your posture data and session history for personalized, data-driven advice.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[var(--primary)] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">chat</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Personalized Advice</h4>
              <p className="text-slate-500 text-sm">Get specific recommendations based on your actual posture scores, risk patterns, and exercise history.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Clinical Reports</h4>
              <p className="text-slate-500 text-sm">Download detailed PDF reports to share with your doctor or physiotherapist for professional follow-up.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 card-hover">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">health_and_safety</span>
              </div>
              <h4 className="text-lg font-bold mb-2">Responsible AI</h4>
              <p className="text-slate-500 text-sm">Clear medical boundaries with recommendations to consult healthcare professionals for serious concerns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--primary)] rounded-[2.5rem] px-8 py-16 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px"}}></div>
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black mb-6">Ready to improve your movement?</h2>
              <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                Join the mission to make accessible healthcare available to every Indian. Start your AI-powered posture correction today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/tracking"
                  className="bg-white text-[var(--primary)] hover:bg-slate-50 px-10 py-4 rounded-xl text-lg font-bold transition-all"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/chat"
                  className="bg-transparent border-2 border-white/30 hover:bg-white/10 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all"
                >
                  Talk to Dr. AI
                </Link>
              </div>
              <p className="mt-8 text-sm text-blue-200">No login required. Just open your camera and start.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold">P</div>
                <span className="text-xl font-bold tracking-tight text-slate-900">PostureAI</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                AI-powered posture correction and physiotherapy for accessible healthcare. Built for Viksit Bharat 2047.
              </p>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-50 via-white to-green-50 border border-orange-200 rounded-full px-3 py-1">
                <span className="text-xs">🇮🇳</span>
                <span className="text-[10px] font-semibold bg-gradient-to-r from-orange-500 via-slate-700 to-green-600 bg-clip-text text-transparent">
                  Viksit Bharat 2047
                </span>
              </div>
            </div>

            <div>
              <h6 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest">Features</h6>
              <ul className="space-y-3 text-sm">
                <li><Link className="text-slate-400 hover:text-[var(--primary)] transition-colors" href="/tracking">Live Tracking</Link></li>
                <li><Link className="text-slate-400 hover:text-[var(--primary)] transition-colors" href="/dashboard">Dashboard</Link></li>
                <li><Link className="text-slate-400 hover:text-[var(--primary)] transition-colors" href="/chat">AI Chat</Link></li>
                <li><Link className="text-slate-400 hover:text-[var(--primary)] transition-colors" href="/history">History</Link></li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest">Technology</h6>
              <ul className="space-y-3 text-sm">
                <li><span className="text-slate-400">MediaPipe Pose</span></li>
                <li><span className="text-slate-400">Computer Vision</span></li>
                <li><span className="text-slate-400">Google Gemini AI</span></li>
                <li><span className="text-slate-400">22+ Indian Languages</span></li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest">Mission</h6>
              <ul className="space-y-3 text-sm">
                <li><span className="text-slate-400">Accessible Healthcare</span></li>
                <li><span className="text-slate-400">Rural Health Workers</span></li>
                <li><span className="text-slate-400">Tele-ASHA Support</span></li>
                <li><span className="text-slate-400">Digital India</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">© 2025 PostureAI — AI Posture Correction & Physiotherapy</p>
            <p className="text-sm text-slate-400">Built for Viksit Bharat 2047 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
