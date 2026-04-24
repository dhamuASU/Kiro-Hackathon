"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, Droplets, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/cleanlabel/SiteNav";
import { ScoreGauge } from "@/components/cleanlabel/ScoreGauge";
import { findProduct, overallScore, PRODUCTS, INGREDIENTS } from "@/data/cleanlabel";
import { useRoutine } from "@/hooks/use-routine";
import { cn } from "@/lib/utils";

export default function RoutinePage() {
  const { ids, add, remove, clear } = useRoutine();
  const products = useMemo(() => ids.map(findProduct).filter(Boolean) as NonNullable<ReturnType<typeof findProduct>>[], [ids]);

  const combined = useMemo(() => {
    if (products.length === 0) return null;
    const avg = (key: keyof typeof products[0]["scores"]) =>
      Math.round((products.reduce((s, p) => s + p.scores[key], 0) / products.length) * 10) / 10;
    return { safety: avg("safety"), environmental: avg("environmental"), transparency: avg("transparency"), honesty: avg("honesty") };
  }, [products]);

  const totalWater = products.reduce((s, p) => s + (p.waterImpactGrams ?? 0), 0);

  const interactions = useMemo(() => {
    const warnings: { title: string; body: string }[] = [];
    const fragranceProducts = products.filter((p) => p.hasFragrance);
    if (fragranceProducts.length >= 2) {
      warnings.push({ title: "Multiple fragranced products", body: `${fragranceProducts.length} products contain undisclosed fragrance — irritation risk compounds.` });
    }
    if (products.some((p) => p.pregnancyUnsafe)) {
      warnings.push({ title: "Pregnancy / infant caution", body: "One or more products contain ingredients flagged unsafe during pregnancy or for infants." });
    }
    return warnings;
  }, [products]);

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main className="container max-w-3xl pb-24 pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-navy/50">Your routine</div>
            <h1 className="mt-1 text-3xl font-semibold text-navy md:text-4xl">Routine builder</h1>
          </div>
          {products.length > 0 && (
            <button onClick={clear} className="text-sm text-navy/60 hover:text-red-600">Clear all</button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-[#EAE6BC] p-10 text-center shadow-md">
            <p className="text-navy/60">No products yet. Search for a product and tap "Add to Routine".</p>
            <Link href="/" className="mt-4 inline-block rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white">
              Search products
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-6 rounded-3xl bg-[#EAE6BC] p-6 shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wider text-navy/60">Combined routine score</div>
              <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-white/50 p-4 sm:grid-cols-4">
                <ScoreGauge label="Safety" value={Math.round(combined!.safety)} delay={50} />
                <ScoreGauge label="Environmental" value={Math.round(combined!.environmental)} delay={150} />
                <ScoreGauge label="Transparency" value={Math.round(combined!.transparency)} delay={250} />
                <ScoreGauge label="Honesty" value={Math.round(combined!.honesty)} delay={350} />
              </div>
            </section>

            {totalWater > 0 && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-blue-50 border border-blue-200 p-4">
                <Droplets className="h-5 w-5 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Your morning routine sends <strong>{totalWater.toFixed(1)}g</strong> of non-biodegradable chemicals into waterways daily — <strong>{(totalWater * 365).toFixed(0)}g/year</strong>.
                </p>
              </div>
            )}

            {interactions.map((w) => (
              <div key={w.title} className="mt-4 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <div>
                  <div className="font-semibold text-orange-900">{w.title}</div>
                  <p className="text-sm text-orange-800">{w.body}</p>
                </div>
              </div>
            ))}

            <section className="mt-6 space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#EAE6BC] p-4 shadow-md">
                  <Link href={`/product/${p.id}`} className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-navy">{p.name}</div>
                    <div className="truncate text-xs text-navy/60">{p.brand}</div>
                  </Link>
                  <div className="text-sm font-bold text-navy">{overallScore(p)}/10</div>
                  <button onClick={() => remove(p.id)} className="text-navy/40 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
