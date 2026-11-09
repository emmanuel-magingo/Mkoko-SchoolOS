import React from 'react';

export interface ChartPoint {
  label: string;
  value: number;
  detail?: string;
  period?: string;
}

export const AnalyticsPanel: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </section>
);

export const TrendLine: React.FC<{
  points: ChartPoint[];
  color?: string;
  suffix?: string;
  maxValue?: number;
  formatValue?: (value: number) => string;
}> = ({ points, color = '#15803d', suffix = '%', maxValue, formatValue }) => {
  if (points.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-500">No results are available for this period.</div>;
  }

  const chartPoints = points.slice(-12);
  const chartMax = maxValue ?? Math.max(100, ...chartPoints.map((point) => point.value));
  const coordinates = chartPoints.map((point, index) => ({
    x: chartPoints.length === 1 ? 300 : (index / (chartPoints.length - 1)) * 560 + 20,
    y: 178 - (point.value / chartMax) * 150,
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="min-w-0">
      <svg
        className="h-48 w-full overflow-visible"
        viewBox="0 0 600 200"
        role="img"
        aria-label="Average score trend chart"
        preserveAspectRatio="none"
      >
        {[0, 0.5, 1].map((fraction) => {
          const value = chartMax * fraction;
          const y = 178 - fraction * 150;
          return (
            <g key={fraction}>
              <line x1="20" x2="580" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 4" />
              <text x="0" y={y + 4} fontSize="10" fill="#64748b">
                {formatValue ? formatValue(value) : `${Math.round(value)}${suffix}`}
              </text>
            </g>
          );
        })}
        <polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        {coordinates.map((point, index) => (
          <circle key={`${chartPoints[index].label}-${index}`} cx={point.x} cy={point.y} r="4" fill={color}>
            <title>{`${chartPoints[index].label}: ${formatValue ? formatValue(chartPoints[index].value) : `${chartPoints[index].value.toFixed(1)}${suffix}`}`}</title>
          </circle>
        ))}
      </svg>
      <div
        className="mt-2 grid gap-1 text-center text-[10px] text-slate-500"
        style={{ gridTemplateColumns: `repeat(${chartPoints.length}, minmax(0, 1fr))` }}
      >
        {chartPoints.map((point, index) => (
          <span key={`${point.label}-${index}`} className="truncate" title={`${point.period || ''} ${point.label}`}>
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const HorizontalBars: React.FC<{
  points: ChartPoint[];
  color?: string;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
}> = ({ points, color = '#15803d', valueSuffix = '', formatValue }) => {
  if (points.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-500">No data available.</div>;
  }

  const maxValue = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className="space-y-4">
      {points.map((point) => (
        <div key={point.label} className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-slate-700" title={point.label}>{point.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              {formatValue ? formatValue(point.value) : `${point.value.toLocaleString()}${valueSuffix}`}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${Math.max(0, (point.value / maxValue) * 100)}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
};
