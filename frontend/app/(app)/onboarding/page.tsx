"use client";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/store/onboarding";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const AGE_RANGES = ["under_18","18_24","25_34","35_44","45_54","55_plus"] as const;
const GENDERS = ["female","male","non_binary","prefer_not_to_say"] as const;
const SKIN_TYPES = ["sensitive","dry","oily","combination","normal"] as const;
const GOALS = [
  { slug: "reduce_acne",       label: "Reduce acne / breakouts" },
  { slug: "anti_aging",        label: "Anti-aging / wrinkles" },
  { slug: "even_tone",         label: "Even skin tone / dark spots" },
  { slug: "hydration",         label: "More hydration / less dryness" },
  { slug: "reduce_sensitivity",label: "Less sensitivity / redness" },
  { slug: "less_oil",          label: "Less oil / shine control" },
  { slug: "maintenance",       label: "General maintenance" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { step, ageRange, gender, skinType, skinGoals, allergies,
          setStep, setProfile, setGoals, setAllergies } = useOnboarding();

  const chip = (active: boolean) =>
    cn("cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors",
      active ? "border-[#28396C] bg-[#28396C] text-white" : "border-gray-200 bg-white text-[#28396C] hover:border-[#28396C]");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-6 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#28396C] text-white">
          <Leaf className="h-4 w-4" />
        </span>
        <span className="font-semibold text-[#28396C]">DermaDecode</span>
        <div className="ml-auto flex gap-1">
          {[1,2,3,4].map(i => (
            <div key={i} className={cn("h-1.5 w-8 rounded-full transition-colors",
              i <= step ? "bg-[#28396C]" : "bg-gray-200")} />
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">

        {/* Step 1 — Profile */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#28396C]">About you</h2>
              <p className="mt-1 text-sm text-gray-500">This personalizes every analysis to your skin.</p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-[#28396C]">Age range</label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map(a => (
                  <button key={a} onClick={() => setProfile({ ageRange: a })} className={chip(ageRange === a)}>
                    {a.replace("_", "–")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-[#28396C]">Gender</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map(g => (
                  <button key={g} onClick={() => setProfile({ gender: g })} className={chip(gender === g)}>
                    {g.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-[#28396C]">Skin type</label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map(s => (
                  <button key={s} onClick={() => setProfile({ skinType: s })} className={chip(skinType === s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!ageRange || !gender || !skinType}
              className="w-full rounded-xl bg-[#28396C] py-3 text-sm font-semibold text-white disabled:opacity-40">
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Goals */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#28396C]">Your skin goals</h2>
              <p className="mt-1 text-sm text-gray-500">Pick 1–3. Your analogies will be calibrated to these.</p>
            </div>
            <div className="space-y-2">
              {GOALS.map(g => {
                const active = skinGoals.includes(g.slug as any);
                return (
                  <button key={g.slug} onClick={() => {
                    const next = active
                      ? skinGoals.filter(x => x !== g.slug)
                      : skinGoals.length < 3 ? [...skinGoals, g.slug as any] : skinGoals;
                    setGoals(next);
                  }}
                    className={cn("flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      active ? "border-[#28396C] bg-[#28396C]/5 text-[#28396C]" : "border-gray-200 text-gray-700 hover:border-[#28396C]")}>
                    {g.label}
                    {active && <span className="text-[#28396C]">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">← Back</button>
              <button onClick={() => setStep(3)} disabled={skinGoals.length === 0}
                className="flex-1 rounded-xl bg-[#28396C] py-3 text-sm font-semibold text-white disabled:opacity-40">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Allergies */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#28396C]">Any allergies?</h2>
              <p className="mt-1 text-sm text-gray-500">Optional. We'll flag these in every product scan.</p>
            </div>
            <textarea value={allergies} onChange={e => setAllergies(e.target.value)}
              placeholder="e.g. fragrance, nickel, latex…"
              className="w-full rounded-xl border border-gray-200 bg-[#EAE6BC]/30 px-4 py-3 text-sm outline-none focus:border-[#28396C] focus:ring-2 focus:ring-[#28396C]/20 min-h-28 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 rounded-xl bg-[#28396C] py-3 text-sm font-semibold text-white">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 4 — Products */}
        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#28396C]">Your products</h2>
              <p className="mt-1 text-sm text-gray-500">Tell us what's in your bathroom. Search by name or paste ingredients.</p>
            </div>
            <div className="rounded-2xl border border-[#B5E18B] bg-[#F0FFC2]/50 p-5 text-center">
              <p className="text-sm text-[#28396C]/70">Product picker coming soon — for now, continue to see the AI analysis demo.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">← Back</button>
              <button onClick={() => router.push("/onboarding/analyzing")}
                className="flex-1 rounded-xl bg-[#28396C] py-3 text-sm font-semibold text-white">Analyze my routine →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
