"use client";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/store/onboarding";
import { StepShell } from "@/components/onboarding/StepShell";
import type { SkinGoal } from "@/lib/types";
import { cn } from "@/lib/utils";

const GOALS: { slug: SkinGoal; title: string; analogy: string }[] = [
  { slug: "reduce_acne", title: "Reduce acne / breakouts", analogy: "Less inflammation. Fewer flares." },
  { slug: "anti_aging", title: "Anti-aging / wrinkles", analogy: "Barrier first, actives second." },
  { slug: "even_tone", title: "Even skin tone / dark spots", analogy: "Consistency over intensity." },
  { slug: "hydration", title: "More hydration / less dryness", analogy: "Stop stripping the barrier." },
  { slug: "less_sensitivity", title: "Less sensitivity / redness", analogy: "Fewer triggers, more calm." },
  { slug: "less_oil", title: "Less oil / shine control", analogy: "Clean without stripping." },
  { slug: "general_maintenance", title: "General maintenance", analogy: "Stay on the happy path." },
];

export default function GoalsStep() {
  const router = useRouter();
  const { skinGoals, toggleGoal } = useOnboarding();

  const ready = skinGoals.length > 0;

  return (
    <StepShell
      eyebrow="Goals — Step 2 of 5"
      title={
        <>
          What are you actually
          <br />
          <span className="italic text-[var(--teal)]">trying to fix?</span>
        </>
      }
      subtitle="Pick up to three. Every flagged ingredient will be scored against these — not against generic chemistry fear."
      backHref="/onboarding/profile"
      nextDisabled={!ready}
      onNext={() => {
        if (!ready) return;
        router.push("/onboarding/allergies");
      }}
    >
      <div className="grid gap-2.5">
        {GOALS.map((g) => {
          const active = skinGoals.includes(g.slug);
          const disabled = !active && skinGoals.length >= 3;
          return (
            <button
              key={g.slug}
              type="button"
              disabled={disabled}
              onClick={() => toggleGoal(g.slug)}
              className={cn(
                "group flex items-center justify-between gap-5 rounded-sm border px-5 py-5 text-left transition-all",
                active
                  ? "border-[var(--sage)] bg-[var(--sage-soft)]"
                  : "border-[var(--hairline)] bg-[var(--surface)]",
                !disabled && "hover:border-[var(--ink)] hover:-translate-y-0.5",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <div>
                <div className="text-[16px] font-medium text-[var(--ink)]">
                  {g.title}
                </div>
                <div
                  className={cn(
                    "mt-1 font-serif italic text-[15px]",
                    active ? "text-[var(--teal)]" : "text-[var(--muted)]",
                  )}
                >
                  {g.analogy}
                </div>
              </div>
              <span
                className={cn(
                  "ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  active
                    ? "border-[var(--sage)] bg-[var(--sage)] text-[var(--bg)]"
                    : "border-[var(--hairline)] bg-[var(--surface)]",
                )}
              >
                {active ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
        {skinGoals.length} of 3 selected
      </p>
    </StepShell>
  );
}
