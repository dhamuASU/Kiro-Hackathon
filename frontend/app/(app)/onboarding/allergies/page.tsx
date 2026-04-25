"use client";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/store/onboarding";
import { StepShell } from "@/components/onboarding/StepShell";

const COMMON = ["Fragrance", "Nickel", "Latex", "Lanolin", "Balsam of Peru", "Methylisothiazolinone", "Formaldehyde releasers"];

export default function AllergiesStep() {
  const router = useRouter();
  const { allergies, setAllergies } = useOnboarding();

  const toggle = (tag: string) => {
    const parts = allergies.split(",").map((x) => x.trim()).filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === tag.toLowerCase());
    if (idx >= 0) parts.splice(idx, 1);
    else parts.push(tag);
    setAllergies(parts.join(", "));
  };

  return (
    <StepShell
      eyebrow="Allergies — Step 3 of 5"
      title={
        <>
          Anything your skin{" "}
          <span className="italic text-[var(--teal)]">already hates?</span>
        </>
      }
      subtitle="Optional. We'll highlight any ingredient in your products that matches — and adjust the analogies so you get a heads-up every time."
      backHref="/onboarding/goals"
      onNext={() => router.push("/onboarding/products")}
    >
      <div className="paper-card p-7">
        <label
          htmlFor="allergies"
          className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]"
        >
          Known allergens or triggers
        </label>
        <textarea
          id="allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="e.g. fragrance, nickel, shea butter…"
          rows={4}
          className="w-full resize-none rounded-sm border border-[var(--hairline)] bg-[var(--bg)] p-4 text-[15px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
        />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
          Comma-separated. Edit anytime from settings.
        </p>

        <div className="mt-7">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Common ones — tap to add
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMON.map((tag) => {
              const active = allergies.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={
                    "rounded-full border px-3 py-1.5 text-[13px] transition-colors " +
                    (active
                      ? "border-[var(--terra)] bg-[var(--terra)] text-[#fff]"
                      : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]")
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-6 font-serif italic text-[15px] text-[var(--teal)]">
        Nothing? Leave it blank. We&rsquo;re not going to invent allergies for you.
      </p>
    </StepShell>
  );
}
