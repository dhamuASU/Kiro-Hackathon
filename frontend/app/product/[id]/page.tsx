"use client";
import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ban, Plus, Sparkles, ShoppingBag } from "lucide-react";
import { SiteNav } from "@/components/cleanlabel/SiteNav";
import { ScoreGauge } from "@/components/cleanlabel/ScoreGauge";
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
    () => (product?.ingredients ?? []).map((i) => INGREDIENTS[i]).filter(Boolean),
    [product],
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <div className="container py-20 text-center">
          <h1 className="text-2xl text-navy">Product not found</h1>
          <Link href="/" className="mt-4 inline-flex text-sm text-navy/60 hover:text-navy">← Back to search</Link>
        </div>
      </div>
    );
  }

  const euBannedCount = ingredients.filter((i) => i.flags.includes("eu_banned")).length;
  const overall = overallScore(product);
  const inRoutine = ids.includes(product.id);
  const showSafetyModal = !!product.pregnancyUnsafe && alertOpen;

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <SafetyAlertModal open={showSafetyModal} productName={`${product.brand} ${product.name}`} onAcknowledge={() => setAlertOpen(false)} />
      <main className="container max-w-3xl pb-24 pt-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/60 hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <header className="mt-4 rounded-3xl bg-[#EAE6BC] p-6 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-navy/50">{product.brand}</div>
              <h1 className="mt-1 text-3xl font-semibold leading-tight text-navy md:text-4xl">{product.name}</h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-navy/70">
                <span className="capitalize">{product.category}</span>
                <span className="opacity-40">·</span>
                <span>Overall {overall} / 10</span>
              </div>
            </div>
            <button onClick={() => { add(product.id); }}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                inRoutine ? "bg-[#EAE6BC] text-navy" : "bg-navy text-white hover:bg-navy/90")}>
              <Plus className="mr-1 inline h-4 w-4" />{inRoutine ? "In Routine" : "Add to Routine"}
            </button>
          </div>
        </header>

        <div className="mt-4 rounded-3xl bg-[#EAE6BC] p-6 shadow-md">
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/50 p-4 sm:grid-cols-4">
            <ScoreGauge label="Safety" value={product.scores.safety} delay={50} />
            <ScoreGauge label="Environmental" value={product.scores.environmental} delay={150} />
            <ScoreGauge label="Transparency" value={product.scores.transparency} delay={250} />
            <ScoreGauge label="Honesty" value={product.scores.honesty} delay={350} />
          </div>
        </div>

        {euBannedCount > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <Ban className="h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm font-semibold text-red-800">
              ⚠️ {euBannedCount} ingredient{euBannedCount > 1 ? "s" : ""} in this product {euBannedCount > 1 ? "are" : "is"} BANNED in the EU but legal in the US.
            </p>
          </div>
        )}

        {product.hasFragrance && (
          <div className="mt-4">
            <AlertBanner tone="warning" title="Fragrance / Parfum detected"
              description="This product hides ingredients behind 'fragrance' — a legal loophole concealing up to 3,000 chemicals. We cannot give it a full safety score." />
          </div>
        )}

        {product.greenwash && (
          <div className="mt-4">
            <AlertBanner tone="greenwash" title="Greenwash detected"
              description="" claim={product.greenwash.claim} reality={product.greenwash.reality} />
          </div>
        )}

        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-navy">Ingredients ({ingredients.length})</h2>
          <div className="space-y-2">
            {ingredients.map((ing) => <IngredientCard key={ing.id} ingredient={ing} />)}
          </div>
        </section>

        {product.cleanerSwap && (
          <section className="mt-6 rounded-3xl bg-[#B5E18B]/30 p-6 shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-800">
              <Sparkles className="h-4 w-4" /> Cleaner Swap
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-navy">{product.cleanerSwap.name}</div>
                <div className="text-sm text-navy/60">{product.cleanerSwap.brand}</div>
                <div className="mt-1 text-xs text-navy/50">{product.cleanerSwap.vsPrice} vs {product.cleanerSwap.price}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700">{product.cleanerSwap.score}</div>
                <div className="text-xs text-navy/50">/10</div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
