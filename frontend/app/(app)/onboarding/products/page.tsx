"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useOnboarding } from "@/store/onboarding";
import { StepShell } from "@/components/onboarding/StepShell";
import { ProductPicker } from "@/components/onboarding/ProductPicker";

export default function ProductsStep() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { ageRange, gender, skinType, skinGoals, allergies, products, reset } = useOnboarding();

  const save = async () => {
    if (!ageRange || !gender || !skinType || skinGoals.length === 0) {
      toast.error("Finish the earlier steps first.");
      router.push("/onboarding/profile");
      return;
    }
    setSaving(true);
    try {
      // 1. Persist profile
      await api.createOnboardingProfile({
        age_range: ageRange,
        gender,
        skin_type: skinType,
        skin_goals: skinGoals,
        allergies: allergies.split(",").map((a) => a.trim()).filter(Boolean),
        life_stage: "none",
      });

      // 2. Persist product list (if any)
      if (products.length > 0) {
        await api.addUserProductsBatch(
          products.map((p) => ({
            category_slug: p.category_slug,
            product_id: p.product_id ?? null,
            custom_name: p.custom_name,
            custom_ingredients: p.custom_ingredients,
          })),
        );
      }

      // 3. Kick off analysis
      const { analysis_id } = await api.completeOnboarding();

      // Don't reset the store yet — analyzing page may want display_name fallbacks.
      router.push(`/onboarding/analyzing?id=${analysis_id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Unknown error";
      toast.error(`Couldn't save — ${msg}`);
    } finally {
      setSaving(false);
    }
    // keep reset() unused warning away (used only on manual clear)
    void reset;
  };

  const total = products.length;

  return (
    <StepShell
      eyebrow="Products — Step 4 of 5"
      title={
        <>
          What&rsquo;s actually in{" "}
          <span className="italic text-[var(--teal)]">your bathroom?</span>
        </>
      }
      subtitle="Pick from popular products, search by name, or paste a label. You can skip categories you don't use — and you can always come back and add more later."
      backHref="/onboarding/allergies"
      nextLabel={total === 0 ? "Skip — analyze anyway" : "Analyze my routine"}
      loading={saving}
      onNext={save}
    >
      <ProductPicker />

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
        {total === 0
          ? "Nothing added yet — you'll see how the coach works regardless"
          : `${total} product${total === 1 ? "" : "s"} ready for analysis`}
      </p>
    </StepShell>
  );
}
