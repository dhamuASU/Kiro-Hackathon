/** Client-side types mirroring api/schemas/*.py. Regenerate from openapi.json if they drift. */

export type AgeRange = "under_18" | "18_24" | "25_34" | "35_44" | "45_54" | "55_plus";
export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type SkinType = "sensitive" | "dry" | "oily" | "combination" | "normal";
export type LifeStage = "none" | "pregnant" | "nursing" | "ttc" | "parent_of_infant";
export type SkinGoal =
  | "reduce_acne"
  | "anti_aging"
  | "even_tone"
  | "hydration"
  | "less_sensitivity"
  | "less_oil"
  | "general_maintenance";

export type ProductSource = "open_beauty_facts" | "llm_resolved" | "user_paste";
export type AnalysisStatus = "pending" | "running" | "completed" | "failed";
export type Relevance = "high" | "medium" | "low";

export interface ProfileCreateInput {
  display_name?: string | null;
  age_range: AgeRange;
  gender: Gender;
  skin_type: SkinType;
  skin_goals: SkinGoal[];
  allergies?: string[];
  life_stage?: LifeStage;
}

export interface ProfileOut extends ProfileCreateInput {
  id: string;
  onboarding_complete: boolean;
}

export interface ProductOut {
  id: string;
  off_id?: string | null;
  name: string;
  brand?: string | null;
  category_slug?: string | null;
  ingredients_raw?: string | null;
  ingredients_parsed: string[];
  image_url?: string | null;
  source: ProductSource;
  popularity: number;
}

export interface ProductSearchResult {
  results: ProductOut[];
}

export interface ProductResolveResponse {
  product: ProductOut;
  confidence: number;
  warning?: string | null;
}

export interface UserProductOut {
  id: string;
  user_id?: string;
  product_id?: string | null;
  category_slug?: string | null;
  custom_name?: string | null;
  custom_ingredients?: string | null;
  product?: ProductOut | null;
  added_at?: string;
}

export interface BanOut {
  id: string;
  ingredient_id: string;
  region: string;
  status: "banned" | "restricted" | "requires_warning";
  regulation_ref?: string | null;
  source_url?: string | null;
  reason?: string | null;
  effective_date?: string | null;
}

export interface FlaggedIngredient {
  ingredient_id: string;
  inci_name: string;
  product_id: string;
  position: number;
  hazard_tags: string[];
  relevance: Relevance;
  reason: string;
  analogy_one_liner?: string | null;
  full_explanation?: string | null;
  bans: BanOut[];
}

export interface Alternative {
  id: string;
  category_slug: string;
  product_name: string;
  brand: string;
  free_of_tags: string[];
  good_for_skin_types: string[];
  good_for_goals: string[];
  avg_price_usd?: string | number | null;
  url?: string | null;
  image_url?: string | null;
  reason?: string | null;
}

export interface ProductAnalysis {
  product: ProductOut;
  flagged: FlaggedIngredient[];
  alternatives: Alternative[];
}

export interface AnalysisOut {
  id: string;
  user_id: string;
  status: AnalysisStatus;
  profile_snapshot: Record<string, unknown>;
  user_product_ids: string[];
  output?: ProductAnalysis[] | null;
  llm_model?: string | null;
  total_tokens?: number | null;
  duration_ms?: number | null;
  error?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
}

export interface AnalysisCreateResponse {
  analysis_id: string;
  status: AnalysisStatus;
}
