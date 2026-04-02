"use client";

/**
 * Dashboard Page — Analytics Overview + PDF Clinical Report
 *
 * Shows:
 * - Overall posture statistics summary cards
 * - Posture score trend chart over sessions
 * - Exercise breakdown
 * - PDF export button for clinical reports
 * - Tele-ASHA healthcare worker mode
 */

import { useState, useEffect, useRef } from "react";
import SessionChart from "@/components/SessionChart";
import { getAnalyticsSummary, getAnalyticsTrend } from "@/lib/apiClient";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [ashaMode, setAshaMode] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const reportRef = useRef(null);

  // Compute reportDate on client only to prevent SSR hydration mismatch
  useEffect(() => {
    setReportDate(new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }));
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryData, trendData] = await Promise.all([
          getAnalyticsSummary(),
          getAnalyticsTrend(),
        ]);
        setSummary(summaryData);
        setTrend(trendData);
      } catch (err) {
        setError("Could not load analytics. Make sure the backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // PDF Export using jsPDF directly (reliable in Next.js App Router)
  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      // Helper: add text with auto line break
      const addText = (text, x, fontSize = 10, color = [230, 230, 230]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(lines, x, y);
        y += lines.length * (fontSize * 0.45) + 2;
        return lines.length;
      };

      // Background
      doc.setFillColor(10, 14, 26);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");

      // Header
      doc.setFillColor(20, 30, 55);
      doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 30, 3, 3, "F");
      addText("PostureAI Clinical Analysis Report", margin + 5, 16, [0, 200, 255]);
      addText(`Date: ${reportDate}  •  AI Posture Correction & Physiotherapy`, margin + 5, 9, [150, 150, 170]);
      const scoreText = `Patient Score: ${summary?.average_score || 0}%`;
      doc.setFontSize(14);
      doc.setTextColor(
        (summary?.average_score || 0) >= 85 ? 52 : (summary?.average_score || 0) >= 50 ? 245 : 248,
        (summary?.average_score || 0) >= 85 ? 211 : (summary?.average_score || 0) >= 50 ? 158 : 113,
        (summary?.average_score || 0) >= 85 ? 153 : (summary?.average_score || 0) >= 50 ? 11 : 113,
      );
      doc.text(scoreText, pageWidth - margin - 5, y - 8, { align: "right" });
      y += 12;

      // Viksit Bharat Badge
      doc.setFillColor(15, 25, 40);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, "F");
      addText("🇮🇳 Viksit Bharat 2047 — Digital Health Initiative | AI-Powered Posture Screening", margin + 5, 8, [100, 180, 120]);
      y += 6;

      // Stats Section
      doc.setFillColor(18, 24, 40);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, "F");
      y += 5;
      addText("SUMMARY STATISTICS", margin + 5, 11, [0, 200, 255]);
      y += 2;

      const statsData = [
        ["Total Sessions", `${summary?.total_sessions || 0}`],
        ["Average Score", `${summary?.average_score || 0}%`],
        ["Correct Posture", `${summary?.correct_percentage || 0}%`],
        ["Risk Alerts", `${summary?.total_risk_alerts || 0}`],
      ];

      const colWidth = (pageWidth - 2 * margin - 10) / 4;
      statsData.forEach(([label, value], i) => {
        const x = margin + 5 + i * colWidth;
        doc.setFontSize(14);
        doc.setTextColor(0, 200, 255);
        doc.text(value, x + colWidth / 2, y + 2, { align: "center" });
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 140);
        doc.text(label.toUpperCase(), x + colWidth / 2, y + 8, { align: "center" });
      });
      y += 22;

      // Exercise Breakdown
      if (summary?.exercise_breakdown && Object.keys(summary.exercise_breakdown).length > 0) {
        doc.setFillColor(18, 24, 40);
        const exercises = Object.entries(summary.exercise_breakdown);
        const blockHeight = 12 + exercises.length * 8;
        doc.roundedRect(margin, y, pageWidth - 2 * margin, blockHeight, 3, 3, "F");
        y += 5;
        addText("EXERCISE BREAKDOWN", margin + 5, 11, [0, 200, 255]);
        y += 2;
        exercises.forEach(([exercise, data]) => {
          const name = exercise.replace(/_/g, " ");
          addText(
            `${name.charAt(0).toUpperCase() + name.slice(1)} — ${data.sessions} sessions — ${data.avg_score}% avg score`,
            margin + 8, 9, [200, 200, 210]
          );
        });
        y += 4;
      }

      // Clinical Assessment
      doc.setFillColor(18, 24, 40);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 3, 3, "F");
      y += 5;
      addText("AI CLINICAL ASSESSMENT", margin + 5, 11, [0, 200, 255]);
      y += 2;

      const avgScore = summary?.average_score || 0;
      const riskAlerts = summary?.total_risk_alerts || 0;
      if (avgScore < 60) {
        addText("⚠️ REQUIRES ATTENTION", margin + 8, 10, [248, 113, 113]);
        addText(
          `Patient posture score is ${avgScore}% (below 60%). Recommend physical examination for musculoskeletal issues. Consider referral to PHC for further assessment.`,
          margin + 8, 9, [200, 160, 160]
        );
      } else if (riskAlerts > 5) {
        addText("⚡ INJURY RISK PATTERN DETECTED", margin + 8, 10, [245, 158, 11]);
        addText(
          `${riskAlerts} risk alerts detected across sessions. Common issues include knee valgus and forward head posture. Recommend preventive exercise regimen.`,
          margin + 8, 9, [200, 180, 140]
        );
      } else {
        addText("✅ GOOD CONDITION", margin + 8, 10, [52, 211, 153]);
        addText(
          `Patient shows adequate posture scores (${avgScore}%) with ${riskAlerts} risk alerts. Continue monitoring and recommend daily exercises for maintenance.`,
          margin + 8, 9, [160, 200, 170]
        );
      }
      y += 6;

      // Footer
      y = doc.internal.pageSize.getHeight() - 15;
      addText(
        "Generated by PostureAI v1.0 | AI Posture Correction & Physiotherapy | Viksit Bharat 2047",
        pageWidth / 2 - 55, 7, [80, 80, 100]
      );
      addText("This report is AI-generated and does not replace professional medical consultation.", pageWidth / 2 - 55, 7, [80, 80, 100]);

      // Save
      doc.save(`PostureAI_Clinical_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Sessions",
      value: summary?.total_sessions || 0,
      icon: "📹",
      color: "text-[var(--primary)]",
    },
    {
      label: "Average Score",
      value: `${summary?.average_score || 0}%`,
      icon: "🎯",
      color: "text-emerald-500",
    },
    {
      label: "Correct Posture",
      value: `${summary?.correct_percentage || 0}%`,
      icon: "✅",
      color: "text-emerald-500",
    },
    {
      label: "Risk Alerts",
      value: summary?.total_risk_alerts || 0,
      icon: "⚠️",
      color: "text-amber-500",
    },
  ];

  // reportDate is now managed as state (set in useEffect above) to prevent hydration mismatch

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" suppressHydrationWarning>
      {/* Header with Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-1">
            {ashaMode ? "🏥 Tele-ASHA Patient Dashboard" : "Analytics Dashboard"}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {ashaMode
              ? "Healthcare worker view — patient posture screening report"
              : "Track your posture improvement over time"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* ASHA Mode Toggle */}
          <button
            onClick={() => setAshaMode(!ashaMode)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
              ashaMode
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-slate-50 text-[var(--muted)] border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>{ashaMode ? "🏥" : "👤"}</span>
            {ashaMode ? "ASHA Mode" : "Personal"}
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {exporting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>📄 Download Clinical Report</>
            )}
          </button>
        </div>
      </div>

      {/* Reportable Content */}
      <div ref={reportRef}>
        {/* Clinical Header (visible in PDF) */}
        {ashaMode && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                  🇮🇳 Viksit Bharat 2047 — Digital Health Initiative
                </h2>
                <p className="text-xs text-emerald-400/70 mt-1">
                  AI-Powered Posture Screening for Rural Healthcare Workers (ASHA/ANM)
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                <p>Report Date: {reportDate}</p>
                <p>Generated by PostureAI v1.0</p>
              </div>
            </div>
          </div>
        )}

        {/* PDF Header (always present for export) */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white text-lg font-bold shadow-sm">
              P
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">PostureAI Clinical Analysis Report</p>
              <p className="text-[10px] text-[var(--muted)]">{reportDate} • AI Posture Correction & Physiotherapy</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted)]">Patient Score</p>
            <p className={`text-xl font-bold ${
              (summary?.average_score || 0) >= 85 ? "text-emerald-500" :
              (summary?.average_score || 0) >= 50 ? "text-amber-500" : "text-red-500"
            }`}>
              {summary?.average_score || 0}%
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 card-hover"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs text-[var(--muted)] uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Trend Chart */}
        <div className="mb-6">
          <SessionChart data={trend} />
        </div>

        {/* Exercise Breakdown */}
        {summary?.exercise_breakdown && Object.keys(summary.exercise_breakdown).length > 0 && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
              Exercise Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(summary.exercise_breakdown).map(([exercise, data]) => (
                <div
                  key={exercise}
                  className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                >
                  <p className="text-sm font-medium capitalize text-[var(--foreground)]">
                    {exercise.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[var(--muted)]">{data.sessions} sessions</span>
                    <span className="text-xs font-semibold text-[var(--primary)]">
                      {data.avg_score}% avg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Recommendations (ASHA mode) */}
        {ashaMode && summary && summary.total_sessions > 0 && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
              🩺 AI Clinical Recommendations
            </h3>
            <div className="space-y-3">
              {(summary.average_score || 0) < 60 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600 font-medium">⚠️ Requires Attention</p>
                  <p className="text-xs text-red-500/70 mt-1">
                    Patient posture score is below 60%. Recommend physical examination for
                    musculoskeletal issues. Consider referral to PHC for further assessment.
                  </p>
                </div>
              )}
              {(summary.total_risk_alerts || 0) > 5 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-600 font-medium">⚡ Injury Risk Pattern</p>
                  <p className="text-xs text-amber-500/70 mt-1">
                    Multiple injury risk alerts detected ({summary.total_risk_alerts} total).
                    Common issues include knee valgus and forward head posture.
                    Recommend preventive exercise regimen.
                  </p>
                </div>
              )}
              {(summary.average_score || 0) >= 60 && (summary.total_risk_alerts || 0) <= 5 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm text-emerald-600 font-medium">✅ Good Condition</p>
                  <p className="text-xs text-emerald-500/70 mt-1">
                    Patient shows adequate posture scores with minimal risk alerts.
                    Continue monitoring and recommend daily exercises for maintenance.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {(!summary || summary.total_sessions === 0) && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-10 text-center mt-6">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-[var(--foreground)] font-medium mb-1">No sessions yet</p>
          <p className="text-sm text-[var(--muted)]">
            Start a posture tracking session on the Live Tracking page to see your analytics here.
          </p>
        </div>
      )}
    </div>
  );
}
