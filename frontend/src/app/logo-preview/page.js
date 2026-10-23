"use client";

import { useState } from "react";
import TrueFormLogo from "@/components/TrueFormLogo";
import Link from "next/link";

const VARIANTS = [
  {
    id: "tf-monogram",
    name: "1. Modern TF Monogram (Recommended)",
    description: "Clean geometric interlocking T & F with cyan crossbar. Premium tech SaaS aesthetic.",
    badge: "Active Default",
  },
  {
    id: "kinetic-pulse",
    name: "2. Kinetic Spine Flow",
    description: "Dual biomechanical spine S-curve with central balance node. Dynamic physiotherapy feel.",
    badge: "Rehab & Movement",
  },
  {
    id: "precision-level",
    name: "3. Precision Balance Level",
    description: "Calibrated horizontal posture beam with vertical plumb line and glowing AI reticle.",
    badge: "Measurement & Angles",
  },
  {
    id: "ai-mesh",
    name: "4. Computer Vision Mesh",
    description: "Geometric polygon triangulation resembling MediaPipe 33-point pose landmark mesh.",
    badge: "AI & CV",
  },
  {
    id: "minimal-t",
    name: "5. Minimal Pill-Cut T",
    description: "Bold rounded geometric letterform with a cyan posture verification indicator dot.",
    badge: "Ultra Minimal",
  },
];

export default function LogoPreviewPage() {
  const [selected, setSelected] = useState("tf-monogram");

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            TrueForm AI Brand Marks
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Minimalist Logo Options
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl mx-auto">
            Choose your favorite minimal SVG emblem below to see how it looks in the navbar header.
          </p>
        </div>

        {/* Live Navbar Simulation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrueFormLogo size={38} variant={selected} />
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">TrueForm AI</span>
              <p className="text-xs text-slate-400">Live Navbar Preview ({selected})</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            ← Back to App
          </Link>
        </div>

        {/* Grid of Variants */}
        <div className="grid md:grid-cols-2 gap-4">
          {VARIANTS.map((v) => {
            const isSelected = selected === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isSelected
                    ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <TrueFormLogo size={48} variant={v.id} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">{v.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {v.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{v.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
