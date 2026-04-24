"use client";
import { useEffect, useState } from "react";

interface MetricCardProps {
  label: string;
  value: number; // 1-10
  size?: number;
  delay?: number;
}

function scoreColor(n: number) {
  if (n >= 8) return "var(--score-safe)";
  if (n >= 5) return "var(--score-moderate)";
  if (n >= 3) return "var(--score-concern)";
  return "var(--score-danger)";
}

export function MetricCard({ label, value, size = 88, delay = 0 }: MetricCardProps) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(Math.max(0, Math.min(1, value / 10))), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  const color = scoreColor(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="rgba(40,57,108,0.08)" strokeWidth={8} fill="none" />
          <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={8} strokeLinecap="round" fill="none"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - animated)}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none" style={{ color: "var(--navy)" }}>{value}</span>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(40,57,108,0.45)" }}>/10</span>
        </div>
      </div>
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(40,57,108,0.7)" }}>{label}</span>
    </div>
  );
}

// Skeleton version
export function MetricCardSkeleton({ size = 88 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="skeleton rounded-full" style={{ width: size, height: size }} />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  );
}
