"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type {
  AnalysisOut,
  ProductAnalysis,
  ProfileOut,
  UserProductOut,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LoadState = "loading" | "ready" | "needs-onboarding" | "error";

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const analysisIdParam = params.get("analysis");

  const [state, setState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<ProfileOut | null>(null);
  const [userProducts, setUserProducts] = useState<UserProductOut[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisOut | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.getProfile().catch((e) => {
          if (e instanceof ApiError && e.status === 404) return null;
          throw e;
        });
        if (!p) {
          setState("needs-onboarding");
          return;
        }
        setProfile(p);

        const [up, analysisRes] = await Promise.all([
          api.listUserProducts().catch(() => ({ user_products: [] })),
          analysisIdParam
            ? api.getAnalysis(analysisIdParam).catch(() => null)
            : Promise.resolve(null),
        ]);
        setUserProducts(up.user_products);
        setAnalysis(analysisRes);
        setState("ready");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
        setState("error");
      }
    })();
  }, [analysisIdParam]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { analysis_id } = await api.triggerAnalysis();
      router.push(`/onboarding/analyzing?id=${analysis_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  if (state === "loading") return <DashboardSkeleton />;
  if (state === "needs-onboarding") {
    if (typeof window !== "undefined") router.replace("/onboarding/profile");
    return <DashboardSkeleton />;
  }
  if (state === "error") {
    return (
      <main className="mx-auto max-w-[1100px] px-8 py-16">
        <div className="rounded-sm border border-[var(--terra)] bg-[#F4E5DD] p-8">
          <h2 className="mb-2 text-[28px]">Something went wrong</h2>
          <p className="text-[var(--ink)]">{err}</p>
        </div>
      </main>
    );
  }

  const output = analysis?.output ?? [];
  const totalFlagged = output.reduce((s, p) => s + p.flagged.length, 0);
  const totalBans = output
    .flatMap((p) => p.flagged)
    .filter((f) => f.bans.length > 0).length;

  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-12">
      {/* Profile header */}
      <header className="mb-10 border-b border-[var(--hairline)] pb-10">
        <div className="eyebrow-mono mb-4">Your profile</div>
        <h1 className="text-[clamp(36px,5vw,56px)]">
          {profile?.display_name ? `Hi, ${profile.display_name}.` : "Your dashboard."}
          <span className="block italic text-[var(--teal)]">
            {output.length > 0
              ? "Here's what your bathroom actually says."
              : "Your coach is ready when you are."}
          </span>
        </h1>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Chip tone="clear">
            {profile?.skin_type} skin
          </Chip>
          {profile?.skin_goals.map((g) => (
            <Chip key={g} tone="note">
              {g.replace(/_/g, " ")}
            </Chip>
          ))}
          <Link href="/settings" className="ml-2 text-link text-[13px]">
            Edit <span className="arrow">→</span>
          </Link>
        </div>
      </header>

      {/* Stat strip */}
      {output.length > 0 && (
        <div className="mb-12 grid grid-cols-2 gap-0 border-y border-[var(--hairline)] md:grid-cols-4">
          {[
            { k: "Products analyzed", v: output.length },
            { k: "Flagged ingredients", v: totalFlagged },
            { k: "Regulatory citations", v: totalBans },
            { k: "Cleaner swaps found", v: output.filter((p) => p.alternatives.length > 0).length },
          ].map((s, i) => (
            <div
              key={s.k}
              className={cn(
                "flex flex-col gap-1 py-6",
                i > 0 && "md:border-l md:border-[var(--hairline)]",
                i > 0 && i % 2 === 1 && "border-l border-[var(--hairline)] md:border-l",
                i > 0 && "pl-6",
              )}
            >
              <span className="font-serif text-[40px] text-[var(--ink)]">
                {s.v}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
                {s.k}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Call-to-action bar */}
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-[var(--paper)] p-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {userProducts.length} product{userProducts.length === 1 ? "" : "s"} in your routine
          </div>
          <div className="mt-1 font-serif text-[20px] italic text-[var(--teal)]">
            {output.length === 0
              ? "Run the agents any time to get a fresh report."
              : "Re-run when you switch products or update goals."}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="btn-ghost">
            Manage products
          </Link>
          <button onClick={runAnalysis} disabled={analyzing} className="btn">
            {analyzing ? "Starting…" : (<>Re-analyze <span className="arrow">→</span></>)}
          </button>
        </div>
      </div>

      {/* Analysis body */}
      {output.length > 0 ? (
        <div className="space-y-5">
          {output.map((p, i) => (
            <ProductReportCard key={p.product.id + i} analysis={p} />
          ))}
        </div>
      ) : (
        <EmptyAnalysis userProductsLen={userProducts.length} />
      )}
    </main>
  );
}

function EmptyAnalysis({ userProductsLen }: { userProductsLen: number }) {
  return (
    <div className="paper-card p-10 text-center">
      <div className="eyebrow-mono mb-5 justify-center">Nothing analyzed yet</div>
      <h3 className="mx-auto mb-4 max-w-[20ch]">
        {userProductsLen === 0
          ? "Add a product to get started."
          : "Your routine is loaded. Run the agents whenever you're ready."}
      </h3>
      <p className="mx-auto mb-7 max-w-[48ch] text-[var(--muted)]">
        {userProductsLen === 0
          ? "Pick from popular products, search by name, or paste a label. Three minutes and you've got a report."
          : "The agents pass each product through five narrow specialists, then compose a single report with analogies, alternatives, and regulatory citations."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn">
          {userProductsLen === 0 ? "Add your first product" : "Manage products"} <span className="arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

function ProductReportCard({ analysis }: { analysis: ProductAnalysis }) {
  const { product, flagged, alternatives } = analysis;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <article className="paper-card overflow-hidden">
      {/* product head */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] px-7 py-5">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
            {product.brand ?? "—"} · {product.category_slug?.replace(/_/g, " ") ?? "product"}
          </div>
          <h3 className="mt-1 truncate text-[22px]">{product.name}</h3>
        </div>
        <span className={`chip ${flagged.length === 0 ? "chip-clear" : ""}`}>
          {flagged.length === 0 ? "No flags" : `${flagged.length} flagged`}
        </span>
      </div>

      {/* ingredient rows */}
      {flagged.length === 0 ? (
        <div className="border-b border-[var(--hairline)] bg-[var(--sage-soft)] p-7">
          <p className="font-serif italic text-[20px] text-[var(--sage)]">
            Nothing in this product is working against your stated goals. Keep it.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--hairline)]">
          {flagged.map((f) => {
            const key = `${product.id}-${f.ingredient_id}`;
            const isOpen = open === key;
            return (
              <li key={key} className="px-7 py-5">
                <button
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="flex w-full items-start gap-4 text-left"
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      f.relevance === "high"
                        ? "bg-[var(--terra)]"
                        : f.relevance === "medium"
                          ? "bg-[var(--mist)]"
                          : "bg-[var(--muted)]",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[15px] font-medium text-[var(--ink)]">
                        {f.inci_name}
                      </span>
                      {f.bans.slice(0, 2).map((b) => (
                        <span key={b.id} className="chip">
                          Restricted in {b.region}
                        </span>
                      ))}
                    </div>
                    {f.analogy_one_liner ? (
                      <p className="mt-2 font-serif italic text-[19px] leading-[1.35] text-[var(--teal)]">
                        &ldquo;{f.analogy_one_liner}&rdquo;
                      </p>
                    ) : (
                      <p className="mt-1 text-[14px] text-[var(--muted)]">
                        {f.reason}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "ml-3 mt-1 text-[12px] text-[var(--muted)] transition-transform",
                      isOpen && "rotate-180",
                    )}
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-3 border-l-2 border-[var(--hairline)] pl-5">
                    {f.full_explanation && (
                      <p className="text-[15px] leading-[1.55] text-[var(--ink)]">
                        {f.full_explanation}
                      </p>
                    )}
                    {f.bans.length > 0 && (
                      <ul className="space-y-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--muted)]">
                        {f.bans.map((b) => (
                          <li key={b.id}>
                            {b.region} · {b.status} · {b.regulation_ref ?? "—"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* swap */}
      {alternatives.length > 0 && (
        <div className="bg-[var(--sage-soft)] px-7 py-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sage)]">
            Cleaner swap
          </div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[17px] font-medium text-[var(--ink)]">
                {alternatives[0].product_name}
              </div>
              <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
                {alternatives[0].brand}
                {alternatives[0].avg_price_usd
                  ? ` · $${alternatives[0].avg_price_usd}`
                  : ""}
              </div>
              <p className="mt-3 max-w-[60ch] text-[14px] text-[var(--ink)]">
                {alternatives[0].reason}
              </p>
            </div>
            {alternatives[0].url && (
              <a
                href={alternatives[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Find it →
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function Chip({ tone, children }: { tone: "clear" | "note"; children: React.ReactNode }) {
  return (
    <span className={`chip ${tone === "clear" ? "chip-clear" : "chip-note"} capitalize`}>
      {children}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-[1100px] px-8 pt-12 pb-24">
      <div className="mb-10 space-y-4">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-14 w-[60%]" />
        <div className="skeleton h-6 w-[45%]" />
      </div>
      <div className="skeleton mb-8 h-20 w-full" />
      <div className="skeleton h-60 w-full" />
    </main>
  );
}
