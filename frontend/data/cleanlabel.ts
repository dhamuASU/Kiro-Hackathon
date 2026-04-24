export type SafetyLevel = "safe" | "caution" | "avoid" | "danger";

export type IngredientFlag = "endocrine" | "pollutant" | "eu_banned" | "fragrance_loophole" | "irritant" | "comedogenic";

export interface Ingredient {
  id: string;
  name: string;
  description: string;
  safety: SafetyLevel;
  flags: IngredientFlag[];
  details?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "cleanser" | "moisturizer" | "serum" | "sunscreen" | "baby" | "treatment";
  scores: {
    safety: number;        // 1–10
    environmental: number;
    transparency: number;
    honesty: number;
  };
  ingredients: string[]; // ingredient ids
  claims?: string[];     // marketing claims (for greenwash detection)
  pregnancyUnsafe?: boolean;
  hasFragrance?: boolean;
  greenwash?: { claim: string; reality: string };
  cleanerSwap?: { name: string; brand: string; score: number; price: string; vsPrice: string };
  waterImpactGrams?: number; // grams of chemicals to waterways per use
}

export const INGREDIENTS: Record<string, Ingredient> = {
  water: {
    id: "water",
    name: "Aqua (Water)",
    description: "The base solvent in nearly every skincare product.",
    safety: "safe",
    flags: [],
    details: "Purified water acts as a carrier for active ingredients. Generally considered the safest cosmetic ingredient.",
  },
  glycerin: {
    id: "glycerin",
    name: "Glycerin",
    description: "A humectant that pulls moisture into the skin.",
    safety: "safe",
    flags: [],
    details: "Plant-derived glycerin is one of the most studied and best-tolerated moisturizing agents.",
  },
  hyaluronic: {
    id: "hyaluronic",
    name: "Sodium Hyaluronate",
    description: "Smaller-molecule form of hyaluronic acid for deeper hydration.",
    safety: "safe",
    flags: [],
  },
  niacinamide: {
    id: "niacinamide",
    name: "Niacinamide",
    description: "Vitamin B3 derivative that calms redness and balances oil.",
    safety: "safe",
    flags: [],
  },
  parabens: {
    id: "parabens",
    name: "Propylparaben",
    description: "Preservative linked to hormone disruption.",
    safety: "avoid",
    flags: ["endocrine", "eu_banned"],
    details: "Banned for use in leave-on cosmetics in the EU since 2015 due to endocrine-disrupting concerns. Still legal in the US.",
  },
  oxybenzone: {
    id: "oxybenzone",
    name: "Oxybenzone",
    description: "Chemical UV filter that bleaches coral reefs.",
    safety: "danger",
    flags: ["endocrine", "pollutant", "eu_banned"],
    details: "Banned in Hawaii, Palau, and several EU coastal regions. Detected in 96% of Americans' urine. Linked to hormonal disruption.",
  },
  fragrance: {
    id: "fragrance",
    name: "Fragrance / Parfum",
    description: "An umbrella term hiding up to 3,000+ undisclosed chemicals.",
    safety: "caution",
    flags: ["fragrance_loophole", "irritant"],
    details: "US law lets brands list 'fragrance' without disclosing the underlying ingredients — many of which are allergens or endocrine disruptors.",
  },
  sls: {
    id: "sls",
    name: "Sodium Lauryl Sulfate",
    description: "Harsh foaming agent that strips the skin barrier.",
    safety: "caution",
    flags: ["irritant", "pollutant"],
  },
  retinol: {
    id: "retinol",
    name: "Retinol",
    description: "Vitamin A derivative — effective but unsafe in pregnancy.",
    safety: "caution",
    flags: [],
    details: "Not recommended during pregnancy or breastfeeding due to teratogenic risk in high doses.",
  },
  phenoxyethanol: {
    id: "phenoxyethanol",
    name: "Phenoxyethanol",
    description: "Common preservative; restricted to ≤1% in the EU.",
    safety: "caution",
    flags: ["irritant"],
    details: "EU restricts this to 1% maximum and warns against use in products for children under 3.",
  },
  petrolatum: {
    id: "petrolatum",
    name: "Petrolatum",
    description: "Petroleum-derived occlusive; often contaminated with PAHs.",
    safety: "caution",
    flags: ["pollutant"],
  },
  bha: {
    id: "bha",
    name: "BHA (Butylated Hydroxyanisole)",
    description: "Synthetic preservative classified as a possible carcinogen.",
    safety: "avoid",
    flags: ["endocrine", "eu_banned"],
  },
  talc: {
    id: "talc",
    name: "Talc",
    description: "Mineral powder; some sources contaminated with asbestos.",
    safety: "avoid",
    flags: ["irritant"],
    details: "Of particular concern in baby products. Cornstarch is a safer alternative.",
  },
  shea: {
    id: "shea",
    name: "Butyrospermum Parkii (Shea) Butter",
    description: "Plant butter rich in fatty acids and vitamin E.",
    safety: "safe",
    flags: [],
  },
  zincoxide: {
    id: "zincoxide",
    name: "Non-Nano Zinc Oxide",
    description: "Mineral UV filter, reef-safe and pregnancy-safe.",
    safety: "safe",
    flags: [],
  },
  squalane: {
    id: "squalane",
    name: "Squalane",
    description: "Plant-derived emollient that mimics natural skin lipids.",
    safety: "safe",
    flags: [],
  },
  ceramides: {
    id: "ceramides",
    name: "Ceramide NP",
    description: "Lipids that rebuild the skin barrier.",
    safety: "safe",
    flags: [],
  },
};

export const PRODUCTS: Product[] = [
  {
    id: "neutrogena-hydroboost",
    name: "Hydro Boost Water Gel",
    brand: "Neutrogena",
    category: "moisturizer",
    scores: { safety: 5, environmental: 4, transparency: 3, honesty: 4 },
    ingredients: ["water", "glycerin", "hyaluronic", "phenoxyethanol", "fragrance", "parabens"],
    claims: ["Dermatologist Recommended", "Hydrating"],
    hasFragrance: true,
    cleanerSwap: { name: "Water Cream", brand: "Krave Beauty", score: 9, price: "$28", vsPrice: "$22" },
    waterImpactGrams: 1.4,
  },
  {
    id: "cerave-cleanser",
    name: "Hydrating Facial Cleanser",
    brand: "CeraVe",
    category: "cleanser",
    scores: { safety: 8, environmental: 7, transparency: 8, honesty: 9 },
    ingredients: ["water", "glycerin", "ceramides", "hyaluronic", "phenoxyethanol"],
    cleanerSwap: { name: "Gentle Hydra-Gel Cleanser", brand: "Krave Beauty", score: 9, price: "$22", vsPrice: "$17" },
    waterImpactGrams: 0.4,
  },
  {
    id: "banana-boat-spf",
    name: "Sport Sunscreen SPF 50",
    brand: "Banana Boat",
    category: "sunscreen",
    scores: { safety: 2, environmental: 1, transparency: 4, honesty: 2 },
    ingredients: ["water", "oxybenzone", "fragrance", "parabens", "bha"],
    claims: ["Reef Friendly Formula"],
    hasFragrance: true,
    greenwash: { claim: "Reef Friendly Formula", reality: "Contains oxybenzone — banned in Hawaii for bleaching coral reefs." },
    cleanerSwap: { name: "Mineral SPF 50", brand: "Badger", score: 9, price: "$18", vsPrice: "$12" },
    waterImpactGrams: 3.8,
  },
  {
    id: "johnsons-baby-lotion",
    name: "Baby Bedtime Lotion",
    brand: "Johnson's",
    category: "baby",
    scores: { safety: 3, environmental: 5, transparency: 3, honesty: 3 },
    ingredients: ["water", "petrolatum", "fragrance", "phenoxyethanol", "talc", "parabens"],
    claims: ["Gentle for baby", "Clinically proven mildness"],
    hasFragrance: true,
    pregnancyUnsafe: true,
    greenwash: { claim: "Pure & Gentle for baby", reality: "Contains 4 ingredients flagged as unsafe for infants under 3." },
    cleanerSwap: { name: "Baby Balm", brand: "Weleda", score: 9, price: "$14", vsPrice: "$8" },
    waterImpactGrams: 2.1,
  },
  {
    id: "the-ordinary-niacinamide",
    name: "Niacinamide 10% + Zinc 1%",
    brand: "The Ordinary",
    category: "serum",
    scores: { safety: 9, environmental: 8, transparency: 10, honesty: 10 },
    ingredients: ["water", "niacinamide", "glycerin", "phenoxyethanol"],
    waterImpactGrams: 0.3,
  },
  {
    id: "weleda-baby-balm",
    name: "Calendula Baby Balm",
    brand: "Weleda",
    category: "baby",
    scores: { safety: 10, environmental: 9, transparency: 10, honesty: 10 },
    ingredients: ["shea", "squalane", "glycerin"],
    waterImpactGrams: 0.1,
  },
  {
    id: "drunk-elephant-protini",
    name: "Protini Polypeptide Cream",
    brand: "Drunk Elephant",
    category: "moisturizer",
    scores: { safety: 8, environmental: 7, transparency: 9, honesty: 8 },
    ingredients: ["water", "glycerin", "niacinamide", "shea", "ceramides"],
    waterImpactGrams: 0.5,
  },
  {
    id: "olay-regenerist",
    name: "Regenerist Micro-Sculpting Cream",
    brand: "Olay",
    category: "moisturizer",
    scores: { safety: 4, environmental: 4, transparency: 5, honesty: 6 },
    ingredients: ["water", "glycerin", "niacinamide", "fragrance", "phenoxyethanol", "parabens"],
    hasFragrance: true,
    waterImpactGrams: 1.1,
  },
];

export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

export const searchProducts = (q: string): Product[] => {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      `${p.brand} ${p.name}`.toLowerCase().includes(s),
  ).slice(0, 6);
};

export const scoreColor = (n: number): "green" | "yellow" | "orange" | "red" => {
  if (n >= 8) return "green";
  if (n >= 5) return "yellow";
  if (n >= 3) return "orange";
  return "red";
};

export const overallScore = (p: Product) =>
  Math.round(((p.scores.safety + p.scores.environmental + p.scores.transparency + p.scores.honesty) / 4) * 10) / 10;
