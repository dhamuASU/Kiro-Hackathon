import { useState } from "react";
import { ChevronDown, FlaskConical, Waves, Ban, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ingredient, IngredientFlag, SafetyLevel } from "@/data/cleanlabel";

const safetyStyles: Record<SafetyLevel, { dot: string; chip: string; label: string }> = {
  safe:    { dot: "bg-score-green",  chip: "bg-score-green/15  text-success",     label: "Safe" },
  caution: { dot: "bg-score-yellow", chip: "bg-score-yellow/20 text-amber-700",   label: "Caution" },
  avoid:   { dot: "bg-score-orange", chip: "bg-score-orange/20 text-orange-700",  label: "Avoid" },
  danger:  { dot: "bg-score-red",    chip: "bg-score-red/15    text-destructive", label: "Danger" },
};

const flagMeta: Record<IngredientFlag, { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  endocrine:          { icon: FlaskConical,  label: "Endocrine disruptor", tone: "bg-orange-100 text-orange-800" },
  pollutant:          { icon: Waves,         label: "Waterway pollutant",  tone: "bg-sky-100 text-sky-800" },
  eu_banned:          { icon: Ban,           label: "Banned in EU",        tone: "bg-red-100 text-red-800" },
  fragrance_loophole: { icon: AlertTriangle, label: "Fragrance loophole",  tone: "bg-yellow-100 text-yellow-900" },
  irritant:           { icon: AlertTriangle, label: "Skin irritant",       tone: "bg-amber-100 text-amber-900" },
  comedogenic:        { icon: AlertTriangle, label: "Pore-clogging",       tone: "bg-stone-100 text-stone-800" },
};

export function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const [open, setOpen] = useState(false);
  const s = safetyStyles[ingredient.safety];

  return (
    <div className="rounded-2xl bg-card shadow-soft transition-all hover:shadow-lift">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <span className={cn("mt-1.5 h-3 w-3 shrink-0 rounded-full", s.dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-navy">{ingredient.name}</h3>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", s.chip)}>
              {s.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{ingredient.description}</p>

          {ingredient.flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ingredient.flags.map((f) => {
                const m = flagMeta[f];
                const Icon = m.icon;
                return (
                  <span key={f} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium", m.tone)}>
                    <Icon className="h-3 w-3" />
                    {m.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-navy/50 transition-transform", open && "rotate-180")} />
      </button>

      {open && ingredient.details && (
        <div className="animate-fade-in border-t border-navy/10 px-4 pb-4 pt-3">
          <p className="text-sm leading-relaxed text-navy/80">{ingredient.details}</p>
        </div>
      )}
    </div>
  );
}
