"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { ChipGroup } from "@/components/onboarding/ChipGroup";
import type {
  AgeRange,
  Gender,
  ProfileOut,
  SkinGoal,
  SkinType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

const SKIN_TYPES: { value: SkinType; label: string }[] = [
  { value: "sensitive", label: "Sensitive" },
  { value: "dry", label: "Dry" },
  { value: "oily", label: "Oily" },
  { value: "combination", label: "Combination" },
  { value: "normal", label: "Normal" },
];

const GOALS: { slug: SkinGoal; label: string }[] = [
  { slug: "reduce_acne", label: "Reduce acne" },
  { slug: "anti_aging", label: "Anti-aging" },
  { slug: "even_tone", label: "Even tone" },
  { slug: "hydration", label: "Hydration" },
  { slug: "less_sensitivity", label: "Less sensitivity" },
  { slug: "less_oil", label: "Less oil" },
  { slug: "general_maintenance", label: "Maintenance" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileOut | null>(null);
  const [allergiesText, setAllergiesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.getProfile();
        setProfile(p);
        setAllergiesText((p.allergies ?? []).join(", "));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't load profile");
      }
    })();
  }, []);

  const update = (patch: Partial<ProfileOut>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await api.patchProfile({
        age_range: profile.age_range,
        gender: profile.gender,
        skin_type: profile.skin_type,
        skin_goals: profile.skin_goals,
        allergies: allergiesText.split(",").map((a) => a.trim()).filter(Boolean),
        life_stage: profile.life_stage,
      });
      setProfile(updated);
      setDirty(false);
      toast.success("Saved");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unknown";
      toast.error(`Couldn't save — ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <main className="mx-auto max-w-[760px] px-8 pt-12 pb-24">
        <div className="skeleton mb-4 h-6 w-32" />
        <div className="skeleton mb-10 h-12 w-[70%]" />
        <div className="skeleton h-60 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[760px] px-8 pb-24 pt-12">
      <header className="mb-12 border-b border-[var(--hairline)] pb-10">
        <div className="eyebrow-mono mb-4">Profile settings</div>
        <h1 className="text-[clamp(36px,5vw,52px)]">
          Update what{" "}
          <span className="italic text-[var(--teal)]">matters to your skin.</span>
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Every change recalibrates the coaching. Re-run the agents after saving
          to get a fresh report.
        </p>
      </header>

      <div className="space-y-10">
        <ChipGroup<AgeRange>
          label="Age range"
          options={AGE_RANGES}
          value={profile.age_range}
          onChange={(v) => update({ age_range: v })}
        />

        <ChipGroup<Gender>
          label="Gender"
          options={GENDERS}
          value={profile.gender}
          onChange={(v) => update({ gender: v })}
        />

        <ChipGroup<SkinType>
          label="Skin type"
          options={SKIN_TYPES}
          value={profile.skin_type}
          onChange={(v) => update({ skin_type: v })}
        />

        <div>
          <div className="mb-4 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Skin goals (up to 3)
          </div>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => {
              const active = profile.skin_goals.includes(g.slug);
              const disabled = !active && profile.skin_goals.length >= 3;
              return (
                <button
                  key={g.slug}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const next = active
                      ? profile.skin_goals.filter((x) => x !== g.slug)
                      : [...profile.skin_goals, g.slug];
                    update({ skin_goals: next });
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2.5 text-[14px] font-medium transition-all",
                    active
                      ? "border-[var(--sage)] bg-[var(--sage)] text-[var(--bg)]"
                      : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]",
                    disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="allergies"
            className="mb-3 block font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]"
          >
            Allergies / triggers
          </label>
          <textarea
            id="allergies"
            value={allergiesText}
            onChange={(e) => {
              setAllergiesText(e.target.value);
              setDirty(true);
            }}
            rows={3}
            placeholder="fragrance, nickel, latex…"
            className="w-full resize-none rounded-sm border border-[var(--hairline)] bg-[var(--surface)] p-4 text-[15px] outline-none focus:border-[var(--ink)]"
          />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
            Comma-separated. We flag these in every product scan.
          </p>
        </div>
      </div>

      <div className="sticky bottom-6 mt-16 flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-5 py-4 shadow-lg">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn-ghost">
            Back to dashboard
          </Link>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="btn"
          >
            {saving ? "Saving…" : (<>Save changes <span className="arrow">→</span></>)}
          </button>
        </div>
      </div>
    </main>
  );
}
