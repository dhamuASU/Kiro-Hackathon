"use client";
import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Ban, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard, MetricCardSkeleton } from "@/components/ui/MetricCard";
import { IngredientCard } from "@/components/cleanlabel/IngredientCard";
import { AlertBanner } from "@/components/cleanlabel/AlertBanner";
import { SafetyAlertModal } from "@/components/cleanlabel/SafetyAlertModal";
import { findProduct, INGREDIENTS, overallScore } from "@/data/cleanlabel";
import { useRoutine } from "@/hooks/use-routine";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const { id = "" } = useParams<{ id: string }>();
  const router = useRouter();
  const product = findProduct(id);
  const { add, ids } = useRoutine();
  const [alertOpen, setAlertOpen] = useState(true);

  const ingredients = useMemo(
    () => (product?.ingredients ?? []).map(i => INGREDIENTS[i]).filter(Boolean),
    [product]
  );

  // Skeleton while loading (product not found yet)
  if (!product) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="skeleton mb-6 h-6 w-24 rounded" />
          <div className="card p-6 mb-4">
            <div className="skeleton mb-3 h-4 w-20 rounded" />
            <div className="skeleton mb-2 h-8 w-64 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="card p-6 mb-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[0,1,2,3].map(i => <MetricCardSkeleton key={i} />)}
            </div>
          </div>
          <div className="space-y-2">
            {[0,1,2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  const euBannedCount = ingredients.filter(i => i.flags.includes("eu_banned")).length;
  const overall = overallScore(product);
  const inRoutine = ids.includes(product.id);

  return (
    <AppShell>
      <SafetyAlertModal
        open={!!product.pregnancyUnsafe && alertOpen}
        productName={`${product.brand} ${product.name}`}
        onAcknowledge={() => setAlertOpen(false)}
      />

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <button onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "rgba(40,57,108,0.55)" }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header card */}
        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(40,57,108,0.45)" }}>{product.brand}</div>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl" style={{ color: "var(--navy)", fontFamily: "Georgia, serif" }}>
                {product.name}
              </h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: "var(--mint)", color: "rgba(40,57,108,0.65)" }}>
                <span className="capitalize">{product.category}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>Overall {overall} / 10</span>
              </div>
            </div>
            <button onClick={() => add(product.id)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{ background: inRoutine ? "var(--cream)" : "var(--navy)", color: inRoutine ? "var(--navy)" : "white" }}>
              <Plus className="h-4 w-4" />
              {inRoutine ? "In Routine" : "Add to Routine"}
            </button>
          </div>
        </div>

        {/* Score gauges */}
        <div className="card p-6 mb-4">
          <div className="grid grid-cols-2 gap-4 rounded-2xl p-4 sm:grid-cols-4" style={{ background: "rgba(240,255,194,0.4)" }}>
            <MetricCard label="Safety"        value={product.scores.safety}        delay={50} />
            <MetricCard label="Environmental" value={product.scores.environmental} delay={150} />
            <MetricCard label="Transparency"  value={product.scores.transparency}  delay={250} />
            <MetricCard label="Honesty"       value={product.scores.honesty}       delay={350} />
          </div>
        </div>

        {/* Alerts */}
        {euBannedCount > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4">
            <Ban className="h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm font-semibold text-red-800">
              ⚠️ {euBannedCount} ingredient{euBannedCount > 1 ? "s" : ""} in this product {euBannedCount > 1 ? "are" : "is"} BANNED in the EU but legal in the US.
            </p>
          </div>
        )}
        {product.hasFragrance && (
          <div className="mb-4">
            <AlertBanner tone="warning" title="Fragrance / Parfum detected"
              description="This product hides ingredients behind 'fragrance' — a legal loophole concealing up to 3,000 chemicals. We cannot give it a full safety score." />
          </div>
        )}
        {product.greenwash && (
          <div className="mb-4">
            <AlertBanner tone="greenwash" title="" description=""
              claim={product.greenwash.claim} reality={product.greenwash.reality} />
          </div>
        )}

        {/* Ingredients */}
        <section className="mb-4">
          <h2 className="mb-3 font-semibold" style={{ color: "var(--navy)" }}>Ingredients ({ingredients.length})</h2>
          <div className="space-y-2">
            {ingredients.map(ing => <IngredientCard key={ing.id} ingredient={ing} />)}
          </div>
        </section>

        {/* Swap */}
        {product.cleanerSwap && (
          <div className="rounded-[var(--radius-md)] p-6" style={{ background: "rgba(181,225,139,0.2)", border: "1px solid rgba(74,158,74,0.2)" }}>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sage-dark)" }}>
              <Sparkles className="h-4 w-4" /> Cleaner Swap
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold" style={{ color: "var(--navy)" }}>{product.cleanerSwap.name}</div>
                <div className="text-sm" style={{ color: "rgba(40,57,108,0.55)" }}>{product.cleanerSwap.brand} · {product.cleanerSwap.vsPrice} vs {product.cleanerSwap.price}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: "var(--sage-dark)" }}>{product.cleanerSwap.score}</div>
                <div className="text-xs" style={{ color: "rgba(40,57,108,0.45)" }}>/10</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
