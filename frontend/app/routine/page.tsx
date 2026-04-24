"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Droplets, AlertTriangle, Search, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { findProduct, overallScore, PRODUCTS, searchProducts, type Product } from "@/data/cleanlabel";
import { useRoutine } from "@/hooks/use-routine";
import { cn } from "@/lib/utils";

const SLOTS = [
  { slug: "cleanser",    label: "Cleanser",    category: "cleanser" },
  { slug: "toner",       label: "Toner",       category: "treatment" },
  { slug: "serum",       label: "Serum",       category: "serum" },
  { slug: "moisturizer", label: "Moisturizer", category: "moisturizer" },
  { slug: "spf",         label: "SPF / Sunscreen", category: "sunscreen" },
  { slug: "shampoo",     label: "Shampoo",     category: "cleanser" },
  { slug: "conditioner", label: "Conditioner", category: "treatment" },
];

function scoreColor(n: number) {
  if (n >= 8) return { bg: "rgba(74,158,74,0.12)", text: "var(--sage-dark)" };
  if (n >= 5) return { bg: "rgba(217,119,6,0.10)", text: "#d97706" };
  if (n >= 3) return { bg: "rgba(234,88,12,0.10)", text: "#ea580c" };
  return { bg: "rgba(220,38,38,0.10)", text: "#dc2626" };
}

export default function RoutinePage() {
  const { ids, add, remove } = useRoutine();
  // Map slot → product id
  const [slotMap, setSlotMap] = useState<Record<string, string>>({});
  const [searchSlot, setSearchSlot] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const suggestions = useMemo(() => searchProducts(q), [q]);

  const assignProduct = (slot: string, productId: string) => {
    setSlotMap(prev => ({ ...prev, [slot]: productId }));
    add(productId);
    setSearchSlot(null);
    setQ("");
  };

  const removeSlot = (slot: string) => {
    const pid = slotMap[slot];
    if (pid) remove(pid);
    setSlotMap(prev => { const n = { ...prev }; delete n[slot]; return n; });
  };

  const filledProducts = Object.values(slotMap).map(findProduct).filter(Boolean) as Product[];

  const combined = useMemo(() => {
    if (!filledProducts.length) return null;
    const avg = (k: keyof Product["scores"]) =>
      Math.round((filledProducts.reduce((s, p) => s + p.scores[k], 0) / filledProducts.length) * 10) / 10;
    return { safety: avg("safety"), environmental: avg("environmental"), transparency: avg("transparency"), honesty: avg("honesty") };
  }, [filledProducts]);

  const totalWater = filledProducts.reduce((s, p) => s + (p.waterImpactGrams ?? 0), 0);
  const interactions = useMemo(() => {
    const w: { title: string; body: string }[] = [];
    if (filledProducts.filter(p => p.hasFragrance).length >= 2)
      w.push({ title: "Multiple fragranced products", body: `${filledProducts.filter(p => p.hasFragrance).length} products contain undisclosed fragrance — irritation risk compounds.` });
    if (filledProducts.some(p => p.pregnancyUnsafe))
      w.push({ title: "Pregnancy / infant caution", body: "One or more products contain ingredients flagged unsafe during pregnancy or for infants." });
    return w;
  }, [filledProducts]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">

        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(40,57,108,0.45)" }}>Your routine</div>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl" style={{ color: "var(--navy)", fontFamily: "Georgia, serif" }}>
            Routine Builder
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(40,57,108,0.55)" }}>Your personalized AM/PM regimen</p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">

          {/* Left: Slots */}
          <div className="space-y-3">
            {SLOTS.map(slot => {
              const pid = slotMap[slot.slug];
              const product = pid ? findProduct(pid) : null;
              const isSearching = searchSlot === slot.slug;

              return (
                <div key={slot.slug}>
                  {product ? (
                    // Filled slot
                    <div className="card flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(40,57,108,0.4)" }}>{slot.label}</div>
                        <Link href={`/product/${product.id}`} className="font-semibold hover:underline" style={{ color: "var(--navy)" }}>
                          {product.name}
                        </Link>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(40,57,108,0.5)" }}>{product.brand}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{ background: scoreColor(product.scores.safety).bg, color: scoreColor(product.scores.safety).text }}>
                          {product.scores.safety}/10
                        </span>
                        <button onClick={() => removeSlot(slot.slug)} className="transition-colors hover:text-red-500" style={{ color: "rgba(40,57,108,0.3)" }}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : isSearching ? (
                    // Search state
                    <div className="rounded-[var(--radius-md)] border-2 p-3" style={{ borderColor: "var(--navy)", background: "white" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 shrink-0" style={{ color: "rgba(40,57,108,0.4)" }} />
                        <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                          placeholder={`Search ${slot.label}…`}
                          className="flex-1 text-sm outline-none bg-transparent" style={{ color: "var(--navy)" }} />
                        <button onClick={() => { setSearchSlot(null); setQ(""); }} style={{ color: "rgba(40,57,108,0.4)" }}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {q && (
                        <ul className="space-y-1 max-h-48 overflow-auto">
                          {suggestions.length === 0 ? (
                            <li className="px-2 py-2 text-xs" style={{ color: "rgba(40,57,108,0.45)" }}>No matches found</li>
                          ) : suggestions.map(p => (
                            <li key={p.id}>
                              <button onClick={() => assignProduct(slot.slug, p.id)}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-[#F0FFC2]/60">
                                <div>
                                  <div className="font-medium" style={{ color: "var(--navy)" }}>{p.name}</div>
                                  <div className="text-xs" style={{ color: "rgba(40,57,108,0.5)" }}>{p.brand}</div>
                                </div>
                                <span className="rounded-full px-2 py-0.5 text-xs font-bold"
                                  style={{ background: scoreColor(p.scores.safety).bg, color: scoreColor(p.scores.safety).text }}>
                                  {p.scores.safety}/10
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    // Empty slot
                    <button onClick={() => { setSearchSlot(slot.slug); setQ(""); }}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed px-4 py-3.5 text-left transition-colors hover:border-[var(--navy)] hover:bg-white/40"
                      style={{ borderColor: "rgba(40,57,108,0.2)", color: "rgba(40,57,108,0.5)" }}>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: "rgba(40,57,108,0.06)" }}>
                        <Plus className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">Add {slot.label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Summary sidebar */}
          <div className="space-y-4">
            <div className="card p-5 sticky top-24">
              <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(40,57,108,0.45)" }}>
                Routine Summary
              </div>

              {!combined ? (
                <div className="text-center py-6">
                  <p className="text-sm" style={{ color: "rgba(40,57,108,0.4)" }}>Add products to see your routine score</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl p-3 mb-4" style={{ background: "rgba(240,255,194,0.5)" }}>
                    <MetricCard label="Safety"  value={Math.round(combined.safety)}        size={72} delay={50} />
                    <MetricCard label="Environ" value={Math.round(combined.environmental)} size={72} delay={150} />
                    <MetricCard label="Transp."  value={Math.round(combined.transparency)}  size={72} delay={250} />
                    <MetricCard label="Honesty" value={Math.round(combined.honesty)}       size={72} delay={350} />
                  </div>

                  <div className="text-xs font-medium mb-1" style={{ color: "rgba(40,57,108,0.6)" }}>
                    {filledProducts.length} of {SLOTS.length} slots filled
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(40,57,108,0.1)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(filledProducts.length / SLOTS.length) * 100}%`, background: "var(--sage-dark)" }} />
                  </div>

                  {totalWater > 0 && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(59,130,246,0.08)" }}>
                      <Droplets className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                      <p className="text-xs text-blue-700">
                        <strong>{totalWater.toFixed(1)}g</strong> of chemicals into waterways daily
                      </p>
                    </div>
                  )}

                  {interactions.map(w => (
                    <div key={w.title} className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(234,88,12,0.08)" }}>
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                      <div>
                        <div className="text-xs font-semibold text-orange-800">{w.title}</div>
                        <p className="text-xs text-orange-700 mt-0.5">{w.body}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
