"use client";
import { cn } from "@/lib/utils";

interface ChipOption<T extends string> {
  value: T;
  label: string;
  desc?: string;
}

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  multi,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T | T[] | null;
  onChange: (v: T) => void;
  multi?: boolean;
}) {
  const isActive = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);

  return (
    <div>
      <div className="mb-4 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = isActive(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-full border px-4 py-2.5 text-[14px] font-medium transition-all",
                active
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
                  : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]",
              )}
            >
              {opt.label}
              {opt.desc ? (
                <span className={cn(
                  "ml-2 text-[12px]",
                  active ? "text-[var(--bg)]/70" : "text-[var(--muted)]",
                )}>
                  {opt.desc}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {multi ? (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
          Multi-select
        </p>
      ) : null}
    </div>
  );
}
