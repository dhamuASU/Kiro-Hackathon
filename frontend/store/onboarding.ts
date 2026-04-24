import { create } from "zustand";

export type SkinType = "sensitive" | "dry" | "oily" | "combination" | "normal";
export type AgeRange = "under_18" | "18_24" | "25_34" | "35_44" | "45_54" | "55_plus";
export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type SkinGoal = "reduce_acne" | "anti_aging" | "even_tone" | "hydration" | "reduce_sensitivity" | "less_oil" | "maintenance";

interface OnboardingState {
  step: number;
  ageRange: AgeRange | null;
  gender: Gender | null;
  skinType: SkinType | null;
  skinGoals: SkinGoal[];
  allergies: string;
  setStep: (s: number) => void;
  setProfile: (p: Partial<Pick<OnboardingState, "ageRange" | "gender" | "skinType">>) => void;
  setGoals: (g: SkinGoal[]) => void;
  setAllergies: (a: string) => void;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  step: 1,
  ageRange: null,
  gender: null,
  skinType: null,
  skinGoals: [],
  allergies: "",
  setStep: (step) => set({ step }),
  setProfile: (p) => set(p),
  setGoals: (skinGoals) => set({ skinGoals }),
  setAllergies: (allergies) => set({ allergies }),
}));
