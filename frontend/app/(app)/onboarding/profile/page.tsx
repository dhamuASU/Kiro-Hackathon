"use client";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/store/onboarding";
import { StepShell } from "@/components/onboarding/StepShell";
import { ChipGroup } from "@/components/onboarding/ChipGroup";
import type { AgeRange, Gender, SkinType } from "@/lib/types";

const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: "under_18", label: "Under 18" },
  { value: "18_24", label: "18–24" },
  { value: "25_34", label: "25–34" },
  { value: "35_44", label: "35–44" },
  { value: "45_54", label: "45–54" },
  { value: "55_plus", label: "55+" },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const SKIN_TYPES: { value: SkinType; label: string; desc: string }[] = [
  { value: "sensitive", label: "Sensitive", desc: "reacts easily" },
  { value: "dry", label: "Dry", desc: "tight, flaky" },
  { value: "oily", label: "Oily", desc: "shiny, breakouts" },
  { value: "combination", label: "Combination", desc: "mixed zones" },
  { value: "normal", label: "Normal", desc: "balanced" },
];

export default function ProfileStep() {
  const router = useRouter();
  const { ageRange, gender, skinType, setProfile } = useOnboarding();

  const ready = ageRange && gender && skinType;

  return (
    <StepShell
      eyebrow="About you — Step 1 of 5"
      title={
        <>
          Tell us a little about
          <br />
          <span className="italic text-[var(--teal)]">your skin.</span>
        </>
      }
      subtitle="Three quick questions. Every analogy we write later is calibrated to this profile — so the more honest you are, the better the coaching gets."
      nextDisabled={!ready}
      onNext={() => {
        if (!ready) return;
        router.push("/onboarding/goals");
      }}
    >
      <div className="space-y-10">
        <ChipGroup
          label="Age range"
          options={AGE_RANGES}
          value={ageRange}
          onChange={(v) => setProfile({ ageRange: v })}
        />
        <ChipGroup
          label="Gender"
          options={GENDERS}
          value={gender}
          onChange={(v) => setProfile({ gender: v })}
        />
        <ChipGroup
          label="Skin type"
          options={SKIN_TYPES}
          value={skinType}
          onChange={(v) => setProfile({ skinType: v })}
        />
      </div>

      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
        Your answers never leave your account. We don&rsquo;t sell this data.
      </p>
    </StepShell>
  );
}
