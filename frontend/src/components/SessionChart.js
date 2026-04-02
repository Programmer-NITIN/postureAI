"use client";

/**
 * SessionChart — Analytics chart component
 *
 * Renders a posture score trend chart using pure SVG.
 * No chart library dependency — keeps the bundle lean.
 */

export default function SessionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 flex items-center justify-center h-64">
        <p className="text-[var(--muted)] text-sm">No session data yet. Complete a session to see trends.</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const width = 600;
  const height = 250;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxScore = 100;
  const minScore = 0;

  // Create points
  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.score - minScore) / (maxScore - minScore)) * chartHeight,
    score: d.score,
    date: d.date,
    exercise: d.exercise_type,
  }));

  // Create path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Create gradient area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
        Posture Score Trend
      </h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px]">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007bff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#007bff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#007bff" />
              <stop offset="100%" stopColor="#007bff" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map((val) => {
            const y = padding.top + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#6b7280" fontSize="10">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#007bff" stroke="#ffffff" strokeWidth="2" />
              {/* Hover target */}
              <title>{`Score: ${p.score} | ${p.exercise}`}</title>
            </g>
          ))}

          {/* X-axis label */}
          <text x={width / 2} y={height - 5} textAnchor="middle" fill="#6b7280" fontSize="10">
            Sessions →
          </text>
        </svg>
      </div>
    </div>
  );
}
