import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { scoreColor } from "@/data/cleanlabel";

interface ScoreGaugeProps {
  label: string;
  value: number; // 1-10
  size?: number;
  delay?: number;
}

const colorMap = {
  green: "hsl(var(--score-green))",
  yellow: "hsl(var(--score-yellow))",
  orange: "hsl(var(--score-orange))",
  red: "hsl(var(--score-red))",
} as const;

export function ScoreGauge({ label, value, size = 88, delay = 0 }: ScoreGaugeProps) {
  const c = scoreColor(value);
  const stroke = colorMap[c];
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / 10));

  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  const offset = circ * (1 - animated);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--navy) / 0.08)"
            strokeWidth={8}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={stroke}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold leading-none text-navy">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 10</span>
        </div>
      </div>
      <span className={cn("text-xs font-medium uppercase tracking-wider text-navy/80")}>{label}</span>
    </div>
  );
}
