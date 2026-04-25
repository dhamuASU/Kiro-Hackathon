import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgeRange, Gender, SkinGoal, SkinType } from "@/lib/types";

export interface PendingProduct {
  category_slug: string;
  product_id?: string | null;
  custom_name?: string;
  custom_ingredients?: string;
  display_name?: string; // for UI only
}

interface OnboardingState {
  // Step 1 — profile
  ageRange: AgeRange | null;
  gender: Gender | null;
  skinType: SkinType | null;
  // Step 2 — goals
  skinGoals: SkinGoal[];
  // Step 3 — allergies (comma-separated free text)
  allergies: string;
  // Step 4 — products
  products: PendingProduct[];

  // actions
  setProfile: (p: Partial<Pick<OnboardingState, "ageRange" | "gender" | "skinType">>) => void;
  setGoals: (g: SkinGoal[]) => void;
  toggleGoal: (g: SkinGoal, max?: number) => void;
  setAllergies: (a: string) => void;
  addProduct: (p: PendingProduct) => void;
  removeProduct: (idx: number) => void;
  clearProducts: () => void;
  reset: () => void;
}

const initial: Pick<
  OnboardingState,
  "ageRange" | "gender" | "skinType" | "skinGoals" | "allergies" | "products"
> = {
  ageRange: null,
  gender: null,
  skinType: null,
  skinGoals: [],
  allergies: "",
  products: [],
};

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initial,
      setProfile: (p) => set(p),
      setGoals: (skinGoals) => set({ skinGoals }),
      toggleGoal: (g, max = 3) => {
        const { skinGoals } = get();
        if (skinGoals.includes(g)) {
          set({ skinGoals: skinGoals.filter((x) => x !== g) });
        } else if (skinGoals.length < max) {
          set({ skinGoals: [...skinGoals, g] });
        }
      },
      setAllergies: (allergies) => set({ allergies }),
      addProduct: (p) => set({ products: [...get().products, p] }),
      removeProduct: (idx) =>
        set({ products: get().products.filter((_, i) => i !== idx) }),
      clearProducts: () => set({ products: [] }),
      reset: () => set({ ...initial }),
    }),
    { name: "cleanlabel-onboarding" },
  ),
);
