"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Trash2, Droplets, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { findProduct, overallScore, INGREDIENTS } from "@/data/cleanlabel";
import { useRoutine } from "@/hooks/use-routine";

export default function RoutinePage() {
  const { ids, add, remove, clear } = useRoutine();
  const products = useMemo(() => ids.map(findProduct).filter(Boolean) as NonNullable<ReturnType<typeof findProduct>>[], [ids]);

  const combined = useMemo(() => {
    if (!products.length) return null;
    const avg = (k: keyof typeof products[0]["scores"]) =>
      Math.round((products.reduce((s, p) => s + p.scores[k], 0) / products.length) * 10) / 10;
    return { safety: avg("safety"), environmental: avg("environmental"), transparency: avg("transparency"), honesty: avg("honesty") };
  }, [products]);

  const totalWater = products.reduce((s, p) => s + (p.waterImpactGrams ?? 0), 0);

  const interactions = useMemo(() => {
    const w: { title: string; body: string }[] = [];
    if (products.filter(p => p.hasFragrance).length >= 2)
      w.push({ title: "Multiple fragranced products", body: `${products.filter(p => p.hasFragrance).length} products contain undisclosed fragrance — irritation risk compounds.` });
    if (products.some(p => p.pregnancyUnsafe))
      w.push({ title: "Pregnancy / infant caution", body: "One or more products contain ingredients flagged unsafe during pregnancy or for infants." });
    return w;
  }, [products]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(40,57,108,0.45)" }}>Your routine</div>
            <h1 className="mt-1 text-3xl font-semibold md:text-4xl" style={{ color: "var(--navy)", fontFamily: "Georgia, serif" }}>Routine builder</h1>
          </div>
          {products.length > 0 && (
            <button onClick={clear} className="text-sm font-medium transition-colors hover:text-red-600" style={{ color: "rgba(40,57,108,0.45)" }}>Clear all</button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm" style={{ color: "rgba(40,57,108,0.5)" }}>No products yet. Search for a product and tap "Add to Routine".</p>
            <Link href="/" className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: "var(--navy)" }}>
              Search products
            </Link>
          </div>
        ) : (
          <>
            <div className="card p-6 mb-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(40,57,108,0.5)" }}>Combined routine score</div>
              <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl p-4 sm:grid-cols-4" style={{ background: "rgba(240,255,194,0.4)" }}>
                <MetricCard label="Safety"        value={Math.round(combined!.safety)}        delay={50} />
                <MetricCard label="Environmental" value={Math.round(combined!.environmental)} delay={150} />
                <MetricCard label="Transparency"  value={Math.round(combined!.transparency)}  delay={250} />
                <MetricCard label="Honesty"       value={Math.round(combined!.honesty)}       delay={350} />
              </div>
            </div>

            {totalWater > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-blue-200 bg-blue-50 p-4">
                <Droplets className="h-5 w-5 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Your routine sends <strong>{totalWater.toFixed(1)}g</strong> of non-biodegradable chemicals into waterways daily — <strong>{(totalWater * 365).toFixed(0)}g/year</strong>.
                </p>
              </div>
            )}

            {interactions.map(w => (
              <div key={w.title} className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-orange-200 bg-orange-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <div>
                  <div className="font-semibold text-orange-900">{w.title}</div>
                  <p className="text-sm text-orange-800">{w.body}</p>
                </div>
              </div>
            ))}

            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="card flex items-center justify-between gap-3 p-4">
                  <Link href={`/product/${p.id}`} className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" style={{ color: "var(--navy)" }}>{p.name}</div>
                    <div className="truncate text-xs" style={{ color: "rgba(40,57,108,0.5)" }}>{p.brand}</div>
                  </Link>
                  <div className="text-sm font-bold" style={{ color: "var(--navy)" }}>{overallScore(p)}/10</div>
                  <button onClick={() => remove(p.id)} className="transition-colors hover:text-red-600" style={{ color: "rgba(40,57,108,0.35)" }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
