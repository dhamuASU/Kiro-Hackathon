import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Droplets, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/cleanlabel/SiteNav";
import { ScoreGauge } from "@/components/cleanlabel/ScoreGauge";
import { findProduct, overallScore, PRODUCTS, INGREDIENTS } from "@/data/cleanlabel";
import { useRoutine } from "@/hooks/use-routine";
import { cn } from "@/lib/utils";

const RoutinePage = () => {
  const { ids, add, remove, clear } = useRoutine();
  const products = useMemo(() => ids.map(findProduct).filter(Boolean) as NonNullable<ReturnType<typeof findProduct>>[], [ids]);

  const combined = useMemo(() => {
    if (products.length === 0) return null;
    const avg = (key: keyof typeof products[0]["scores"]) =>
      Math.round((products.reduce((s, p) => s + p.scores[key], 0) / products.length) * 10) / 10;
    return {
      safety: avg("safety"),
      environmental: avg("environmental"),
      transparency: avg("transparency"),
      honesty: avg("honesty"),
    };
  }, [products]);

  const totalWater = products.reduce((s, p) => s + (p.waterImpactGrams ?? 0), 0);

  // Simple interaction warnings (frontend-only heuristics)
  const interactions = useMemo(() => {
    const warnings: { title: string; body: string }[] = [];
    const ingSet = new Set(products.flatMap((p) => p.ingredients));
    if (ingSet.has("retinol") && products.some((p) => p.category === "sunscreen" && (p.scores.safety < 5))) {
      warnings.push({
        title: "Retinol + low-SPF sunscreen",
        body: "Retinol increases UV sensitivity. Pair with a high-protection mineral SPF.",
      });
    }
    const fragranceProducts = products.filter((p) => p.hasFragrance);
    if (fragranceProducts.length >= 2) {
      warnings.push({
        title: "Multiple fragranced products",
        body: `${fragranceProducts.length} products in your routine contain undisclosed fragrance — irritation risk compounds.`,
      });
    }
    if (products.some((p) => p.pregnancyUnsafe)) {
      warnings.push({
        title: "Pregnancy / infant caution",
        body: "One or more products contain ingredients flagged unsafe during pregnancy or for infants.",
      });
    }
    return warnings;
  }, [products]);

  return (
    <div className="min-h-screen bg-hero">
      <SiteNav />

      <main className="container max-w-3xl pb-24 pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-navy/50">Your routine</div>
            <h1 className="mt-1 font-display text-3xl font-semibold text-navy md:text-4xl">Routine builder</h1>
          </div>
          {products.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear} className="text-navy/60 hover:text-destructive">
              Clear all
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <EmptyState onAdd={(id) => add(id)} />
        ) : (
          <>
            {/* COMBINED SCORE */}
            <section className="mt-6 rounded-3xl bg-card p-6 shadow-soft">
              <div className="text-xs font-semibold uppercase tracking-wider text-navy/60">Combined routine score</div>
              <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-mint/50 p-4 sm:grid-cols-4">
                <ScoreGauge label="Safety"        value={Math.round(combined!.safety)}        delay={50} />
                <ScoreGauge label="Environmental" value={Math.round(combined!.environmental)} delay={150} />
                <ScoreGauge label="Transparency"  value={Math.round(combined!.transparency)}  delay={250} />
                <ScoreGauge label="Honesty"       value={Math.round(combined!.honesty)}       delay={350} />
              </div>

              {/* WATER IMPACT */}
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200/60">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-100">
                  <Droplets className="h-5 w-5 text-sky-700" />
                </div>
                <div>
                  <div className="font-semibold text-navy">
                    Your routine sends <span className="text-sky-700">{totalWater.toFixed(1)}g</span> of chemicals into waterways daily
                  </div>
                  <p className="mt-0.5 text-sm text-navy/70">
                    That's roughly {(totalWater * 365).toFixed(0)}g per year — equivalent to {Math.max(1, Math.round(totalWater * 365 / 30))} bars of soap dissolved into the ocean.
                  </p>
                </div>
              </div>

              {/* INTERACTIONS */}
              {interactions.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {interactions.map((w) => (
                    <div key={w.title} className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-3.5">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                      <div>
                        <div className="text-sm font-semibold text-navy">{w.title}</div>
                        <p className="text-xs text-navy/70">{w.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* PRODUCTS LIST */}
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-navy">Products in routine</h2>
                <span className="text-xs text-navy/50">{products.length} item{products.length === 1 ? "" : "s"}</span>
              </div>
              <ul className="space-y-2.5">
                {products.map((p) => {
                  const o = overallScore(p);
                  const tone =
                    o >= 8 ? "bg-score-green text-success-foreground" :
                    o >= 5 ? "bg-score-yellow text-amber-900" :
                    o >= 3 ? "bg-score-orange text-white" :
                             "bg-score-red text-white";
                  return (
                    <li key={p.id} className="group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold", tone)}>
                        {o}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold uppercase tracking-wider text-navy/55">{p.brand}</div>
                        <Link to={`/product/${p.id}`} className="truncate font-display text-base font-semibold text-navy hover:underline">
                          {p.name}
                        </Link>
                        <div className="text-xs text-navy/55">
                          {p.ingredients.length} ingredients · {(p.waterImpactGrams ?? 0).toFixed(1)}g water impact
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(p.id)}
                        className="text-navy/40 hover:text-destructive"
                        aria-label={`Remove ${p.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ADD MORE */}
            <AddMore present={ids} onAdd={add} />
          </>
        )}
      </main>
    </div>
  );
};

function EmptyState({ onAdd }: { onAdd: (id: string) => void }) {
  return (
    <div className="mt-8 rounded-3xl bg-card p-8 text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage-gradient">
        <Layers className="h-7 w-7 text-navy" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold text-navy">Build your daily routine</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-navy/65">
        Add your cleansers, serums, and creams to see your combined score, environmental impact, and any risky overlaps.
      </p>
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {PRODUCTS.slice(0, 4).map((p) => (
          <button
            key={p.id}
            onClick={() => onAdd(p.id)}
            className="flex items-center justify-between gap-2 rounded-2xl bg-mint/60 p-3 text-left transition-colors hover:bg-mint"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-navy">{p.name}</div>
              <div className="truncate text-xs text-navy/55">{p.brand}</div>
            </div>
            <Plus className="h-4 w-4 text-navy/60" />
          </button>
        ))}
      </div>
      <Link to="/" className="mt-5 inline-block text-xs font-medium text-navy/60 hover:text-navy">
        Or search the full catalog →
      </Link>
    </div>
  );
}

function AddMore({ present, onAdd }: { present: string[]; onAdd: (id: string) => void }) {
  const remaining = PRODUCTS.filter((p) => !present.includes(p.id)).slice(0, 4);
  if (remaining.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-xl font-semibold text-navy">Add more</h2>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {remaining.map((p) => (
          <button
            key={p.id}
            onClick={() => onAdd(p.id)}
            className="flex items-center justify-between gap-2 rounded-2xl bg-card p-3 text-left shadow-soft transition-all hover:shadow-lift"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-navy">{p.name}</div>
              <div className="truncate text-xs text-navy/55">{p.brand} · {p.ingredients.length} ingredients</div>
            </div>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage text-navy">
              <Plus className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default RoutinePage;
