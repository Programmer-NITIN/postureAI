"use client";

/**
 * Navbar — Top navigation bar (Light Theme)
 *
 * Clean professional navigation with blue primary accents.
 * Links: Home, Tracking, Dashboard, History, Chat
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/tracking", label: "Tracking", icon: "my_location" },
  { href: "/plan", label: "Plan", icon: "fitness_center" },
  { href: "/telehealth", label: "Telehealth", icon: "video_call" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/chat", label: "Chat", icon: "chat" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                P
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">PostureAI</span>
            </Link>
            {/* Viksit Bharat Badge */}
            <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-orange-50 via-white to-green-50 border border-orange-200/60 rounded-full px-3 py-1">
              <span className="text-xs">🇮🇳</span>
              <span className="text-[10px] font-semibold bg-gradient-to-r from-orange-500 via-slate-700 to-green-600 bg-clip-text text-transparent">
                Viksit Bharat 2047
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${isActive
                      ? "bg-[var(--primary-light)] text-[var(--primary)] border border-blue-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
