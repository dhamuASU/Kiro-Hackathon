"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Leaf, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";



// Demo data — replace with real API call to GET /api/analyze/{id}
const DEMO_PROFILE = { skinType: "sensitive", skinGoals: ["reduce_acne", "reduce_sensitivity"] };
const DEMO_PRODUCTS = [
  {
    id: "1", name: "Head & Shoulders Classic Clean", brand: "Head & Shoulders", category: "Shampoo",
    flaggedCount: 2,
    flaggedIngredients: [
      {
        name: "Sodium Lauryl Sulfate",
        relevance: "high",
        analogy: "Sulfates are like sugar.",
        explanation: "In moderation, sulfates clean effectively. But you're using a sulfate shampoo daily — like eating sugar at every meal. Your scalp's natural oils get stripped, the barrier weakens, and the dryness and sensitivity you flagged in your goals get worse, not better.",
        bannedIn: [{ region: "EU", status: "restricted", ref: "Reg. EC 1223/2009 Annex III" }],
      },
      {
        name: "Methylchloroisothiazolinone",
        relevance: "high",
        analogy: "MCI is like a smoke alarm in a paint factory.",
        explanation: "It does its job (preserves the bottle from bacteria) but it's so reactive it can trigger your skin's alarm system. The EU caps it at 0.0015% for a reason. If you have sensitive skin, even a trace can read as 'attack' to your immune system.",
        bannedIn: [{ region: "EU", status: "restricted", ref: "Annex V/57" }],
      },
    ],
    swap: { name: "Vanicream Free & Clear Shampoo", brand: "Vanicream", price: "$9.99", reason: "Sulfate-free and fragrance-free; matches your sensitive-skin profile." },
  },
  {
    id: "2", name: "Neutrogena Hydro Boost", brand: "Neutrogena", category: "Moisturizer",
    flaggedCount: 1,
    flaggedIngredients: [
      {
        name: "Fragrance / Parfum",
        relevance: "medium",
        analogy: "Fragrance is a black box.",
        explanation: "US law lets brands list 'fragrance' without disclosing the underlying ingredients — many of which are allergens or endocrine disruptors. For sensitive skin, this single word can hide the thing that's causing your flare-ups.",
        bannedIn: [],
      },
    ],
    swap: { name: "CeraVe Moisturizing Cream", brand: "CeraVe", price: "$16.99", reason: "Fragrance-free, ceramide-rich, dermatologist-developed for sensitive skin." },
  },
];

export default function DashboardPage() {
  
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#28396C] text-white">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-semibold text-[#28396C]">DermaDecode</span>
        </div>
        <button onClick={() => window.location.href="/login"}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Profile header */}
        <div className="mb-6 rounded-2xl bg-[#EAE6BC] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#28396C]/60">Your profile</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#28396C] px-3 py-1 text-xs font-medium text-white capitalize">{DEMO_PROFILE.skinType} skin</span>
            {DEMO_PROFILE.skinGoals.map(g => (
              <span key={g} className="rounded-full bg-[#B5E18B] px-3 py-1 text-xs font-medium text-[#28396C]">
                {g.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Products scanned", value: DEMO_PRODUCTS.length },
            { label: "Flagged ingredients", value: DEMO_PRODUCTS.reduce((s, p) => s + p.flaggedCount, 0) },
            { label: "EU bans found", value: DEMO_PRODUCTS.flatMap(p => p.flaggedIngredients).filter(i => i.bannedIn.length > 0).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-[#28396C]">{value}</div>
              <div className="mt-1 text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Product cards */}
        <div className="space-y-4">
          {DEMO_PRODUCTS.map(product => (
            <div key={product.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              {/* Product header */}
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{product.brand} · {product.category}</p>
                  <h3 className="mt-0.5 font-semibold text-[#28396C]">{product.name}</h3>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {product.flaggedCount} flagged
                </span>
              </div>

              {/* Ingredient rows */}
              <div className="border-t border-gray-50">
                {product.flaggedIngredients.map(ing => (
                  <div key={ing.name} className="border-b border-gray-50 last:border-0">
                    <button onClick={() => setExpanded(expanded === `${product.id}-${ing.name}` ? null : `${product.id}-${ing.name}`)}
                      className="flex w-full items-start gap-3 px-5 py-4 text-left">
                      <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full",
                        ing.relevance === "high" ? "bg-red-400" : "bg-yellow-400")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#28396C]">{ing.name}</p>
                        {/* Analogy — the hero line */}
                        <p className="mt-1 text-sm italic text-gray-600">"{ing.analogy}"</p>
                        {ing.bannedIn.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ing.bannedIn.map(b => (
                              <span key={b.region} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                Banned in {b.region}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform",
                        expanded === `${product.id}-${ing.name}` && "rotate-180")} />
                    </button>
                    {expanded === `${product.id}-${ing.name}` && (
                      <div className="border-t border-gray-50 bg-gray-50/50 px-5 pb-4 pt-3">
                        <p className="text-sm leading-relaxed text-gray-700">{ing.explanation}</p>
                        {ing.bannedIn.map(b => (
                          <p key={b.region} className="mt-2 text-xs text-gray-400">{b.ref}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Swap card */}
              <div className="rounded-b-2xl bg-[#F0FFC2]/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700">✦ Cleaner swap</p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#28396C]">{product.swap.name}</p>
                    <p className="text-xs text-gray-500">{product.swap.brand} · {product.swap.price}</p>
                    <p className="mt-1 text-xs text-gray-600">{product.swap.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
