import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Plus, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/cleanlabel/SiteNav";
import { ScoreGauge } from "@/components/cleanlabel/ScoreGauge";
import { IngredientCard } from "@/components/cleanlabel/IngredientCard";
import { AlertBanner } from "@/components/cleanlabel/AlertBanner";
import { SafetyAlertModal } from "@/components/cleanlabel/SafetyAlertModal";
import { findProduct, INGREDIENTS, overallScore } from "@/data/cleanlabel";
import { useRoutine } from "@/hooks/use-routine";
import { toast } from "sonner";

const ProductPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const product = findProduct(id);
  const { add, ids } = useRoutine();

  const [alertOpen, setAlertOpen] = useState(true);

  const ingredients = useMemo(
    () => (product?.ingredients ?? []).map((i) => INGREDIENTS[i]).filter(Boolean),
    [product],
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-hero">
        <SiteNav />
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl text-navy">Product not found</h1>
          <Link to="/" className="mt-4 inline-flex text-sm text-navy/60 hover:text-navy">← Back to search</Link>
        </div>
      </div>
    );
  }

  const euBannedCount = ingredients.filter((i) => i.flags.includes("eu_banned")).length;
  const overall = overallScore(product);
  const inRoutine = ids.includes(product.id);

  const showSafetyModal = !!product.pregnancyUnsafe && alertOpen;

  return (
    <div className="min-h-screen bg-hero">
      <SiteNav />

      <SafetyAlertModal
        open={showSafetyModal}
        productName={`${product.brand} ${product.name}`}
        onAcknowledge={() => setAlertOpen(false)}
      />

      <main className="container max-w-3xl pb-24 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/60 hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* HEADER */}
        <header className="mt-4 rounded-3xl bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-navy/50">{product.brand}</div>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-navy md:text-4xl">
                {product.name}
              </h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-mint/70 px-3 py-1 text-xs font-medium text-navy/70">
                <span className="capitalize">{product.category}</span>
                <span className="opacity-40">·</span>
                <span>Overall {overall} / 10</span>
              </div>
            </div>
            <Button
              variant={inRoutine ? "secondary" : "default"}
              onClick={() => {
                if (inRoutine) {
                  navigate("/routine");
                } else {
                  add(product.id);
                  toast.success("Added to your routine", { description: `${product.brand} ${product.name}` });
                }
              }}
              className={inRoutine ? "rounded-full" : "rounded-full bg-navy hover:bg-navy-deep"}
            >
              {inRoutine ? <>In routine →</> : <><Plus className="mr-1 h-4 w-4" /> Add to routine</>}
            </Button>
          </div>

          {/* GAUGES */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-mint/50 p-4 sm:grid-cols-4">
            <ScoreGauge label="Safety"        value={product.scores.safety}        delay={50} />
            <ScoreGauge label="Environmental" value={product.scores.environmental} delay={150} />
            <ScoreGauge label="Transparency"  value={product.scores.transparency}  delay={250} />
            <ScoreGauge label="Honesty"       value={product.scores.honesty}       delay={350} />
          </div>
        </header>

        {/* ALERT STACK */}
        <div className="mt-5 space-y-3">
          {euBannedCount > 0 && (
            <div className="flex animate-fade-in items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 shadow-soft">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive text-destructive-foreground">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-navy">
                  {euBannedCount} ingredient{euBannedCount === 1 ? "" : "s"} in this product {euBannedCount === 1 ? "is" : "are"} BANNED in the EU
                </div>
                <p className="mt-0.5 text-sm text-navy/70">
                  These ingredients are restricted by EU regulators but remain legal in the United States.
                </p>
              </div>
            </div>
          )}

          {product.hasFragrance && (
            <AlertBanner
              tone="warning"
              title="This product hides ingredients behind ‘Fragrance’"
              description="A US legal loophole lets brands omit up to 3,000+ chemicals under this single word. We can't give it a full safety score."
            />
          )}

          {product.greenwash && (
            <AlertBanner
              tone="greenwash"
              title="Greenwash detected"
              description=""
              claim={product.greenwash.claim}
              reality={product.greenwash.reality}
            />
          )}
        </div>

        {/* INGREDIENTS */}
        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-navy">
              Ingredients <span className="text-navy/40">({ingredients.length})</span>
            </h2>
            <span className="text-xs text-navy/50">Tap a card to expand</span>
          </div>
          <div className="space-y-2.5">
            {ingredients.map((ing) => (
              <IngredientCard key={ing.id} ingredient={ing} />
            ))}
          </div>
        </section>

        {/* CLEANER SWAP */}
        {product.cleanerSwap && (
          <section className="mt-10">
            <div className="overflow-hidden rounded-3xl bg-sage-gradient p-1 shadow-lift">
              <div className="rounded-[calc(theme(borderRadius.3xl)-4px)] bg-gradient-to-br from-sage/90 to-sage/60 p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-navy/70">
                  <Sparkles className="h-4 w-4" /> Cleaner Swap
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-navy/60">{product.cleanerSwap.brand}</div>
                    <div className="mt-1 font-display text-2xl font-semibold text-navy">{product.cleanerSwap.name}</div>
                    <div className="mt-2 flex items-center gap-3 text-sm text-navy/75">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 font-bold text-success">
                        {product.cleanerSwap.score} / 10
                      </span>
                      <span>
                        <span className="line-through opacity-60">{product.cleanerSwap.vsPrice}</span>{" "}
                        <span className="font-semibold text-navy">{product.cleanerSwap.price}</span>
                      </span>
                    </div>
                  </div>
                  <Button size="lg" className="rounded-full bg-navy hover:bg-navy-deep">
                    <ShoppingBag className="mr-1.5 h-4 w-4" />
                    See swap
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductPage;
