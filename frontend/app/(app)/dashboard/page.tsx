"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type {
  AnalysisOut,
  ProductAnalysis,
  ProfileOut,
  RoutineStep,
  UserProductOut,
  Wellness,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LoadState = "loading" | "ready" | "needs-onboarding" | "error";
type Filter = "all" | "high" | "medium" | "clean";

const RELEVANCE_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

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
  const [filter, setFilter] = useState<Filter>("all");
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
          api.listUserProducts().catch(() => [] as UserProductOut[]),
          analysisIdParam
            ? api.getAnalysis(analysisIdParam).catch(() => null)
            : api.getLatestAnalysis().catch(() => null),
        ]);
        setUserProducts(up ?? []);
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

  const output = analysis?.output ?? [];

  // Sort: most severe products first (high → medium → low → clean), then by flag count desc.
  const sortedOutput = useMemo(() => {
    return [...output].sort((a, b) => {
      const aSev = Math.min(...a.flagged.map((f) => RELEVANCE_RANK[f.relevance] ?? 9), 9);
      const bSev = Math.min(...b.flagged.map((f) => RELEVANCE_RANK[f.relevance] ?? 9), 9);
      if (aSev !== bSev) return aSev - bSev;
      return b.flagged.length - a.flagged.length;
    });
  }, [output]);

  const counts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let citations = 0;
    let cleaner = 0;
    let cleanProducts = 0;
    for (const p of output) {
      if (p.flagged.length === 0) cleanProducts++;
      if (p.alternatives.length > 0) cleaner++;
      for (const f of p.flagged) {
        if (f.relevance === "high") high++;
        else if (f.relevance === "medium") medium++;
        citations += f.bans.length;
      }
    }
    return { high, medium, citations, cleaner, cleanProducts };
  }, [output]);

  const filteredOutput = useMemo(() => {
    if (filter === "all") return sortedOutput;
    if (filter === "clean") return sortedOutput.filter((p) => p.flagged.length === 0);
    return sortedOutput.filter((p) =>
      p.flagged.some((f) => f.relevance === filter),
    );
  }, [sortedOutput, filter]);

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

  const hasAnalysis = output.length > 0;
  const headline = buildHeadline(counts, output.length, profile?.display_name);

  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-10">
      {/* ── Hero — compact, intent-led ─────────────────────────────────── */}
      <header className="border-b border-[var(--hairline)] pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="eyebrow-mono">
            {hasAnalysis ? "Your report" : "Your dashboard"}
          </div>
          {analysis?.completed_at && (
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
              Last analyzed {formatRelativeDate(analysis.completed_at)}
              {analysis.duration_ms && ` · ${(analysis.duration_ms / 1000).toFixed(1)}s`}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 items-end gap-10 lg:grid-cols-[1.4fr_auto]">
          <div>
            <h1
              className="max-w-[22ch]"
              style={{ fontSize: "clamp(30px, 3.8vw, 46px)", lineHeight: 1.05 }}
            >
              {headline.lead}{" "}
              <span className="italic text-[var(--teal)]">{headline.tail}</span>
            </h1>

            {/* Profile chips + edit */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {profile?.skin_type && (
                <Chip tone="clear">{profile.skin_type} skin</Chip>
              )}
              {profile?.skin_goals.slice(0, 4).map((g) => (
                <Chip key={g} tone="note">
                  {g.replace(/_/g, " ")}
                </Chip>
              ))}
              <Link href="/settings" className="text-link ml-1 text-[12px]">
                Edit profile <span className="arrow">→</span>
              </Link>
            </div>
          </div>

          {hasAnalysis && (
            <RoutineDonut
              clean={counts.cleanProducts}
              high={output.filter((p) => p.flagged.some((f) => f.relevance === "high")).length}
              medium={output.filter((p) =>
                !p.flagged.some((f) => f.relevance === "high") &&
                p.flagged.some((f) => f.relevance === "medium")
              ).length}
              low={output.filter((p) =>
                p.flagged.length > 0 &&
                !p.flagged.some((f) => f.relevance === "high" || f.relevance === "medium")
              ).length}
            />
          )}
        </div>
      </header>

      {/* ── Stat strip — 4 KPIs in a single bordered band ───────────────── */}
      {hasAnalysis && (
        <div className="mt-10 grid grid-cols-2 overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--surface)] sm:grid-cols-4">
          <Stat
            label="Products"
            value={output.length}
            sub={`${counts.cleanProducts} clean`}
            tone={counts.cleanProducts === output.length ? "sage" : undefined}
          />
          <Stat
            label="High concern"
            value={counts.high}
            sub={counts.medium > 0 ? `+ ${counts.medium} medium` : "none"}
            tone={counts.high > 0 ? "terra" : "sage"}
            divided
          />
          <Stat
            label="Regulatory citations"
            value={counts.citations}
            sub={counts.citations > 0 ? "EU / CA / FR" : "none"}
            divided
          />
          <Stat
            label="Cleaner swaps"
            value={counts.cleaner}
            sub={counts.cleaner > 0 ? "ready to try" : "none yet"}
            tone={counts.cleaner > 0 ? "sage" : undefined}
            divided
          />
        </div>
      )}

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-[var(--paper)] px-6 py-5">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {userProducts.length} product{userProducts.length === 1 ? "" : "s"} in your routine
          </div>
          <div className="mt-1 font-serif text-[19px] italic text-[var(--teal)]">
            {hasAnalysis
              ? "Re-run after you switch products or update goals."
              : "Run the agents any time to get a fresh report."}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="btn-ghost">
            Manage products
          </Link>
          <button onClick={runAnalysis} disabled={analyzing} className="btn">
            {analyzing ? "Starting…" : (
              <>
                {hasAnalysis ? "Re-analyze" : "Run analysis"} <span className="arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Wellness panels (skin age + routine builder) ────────────────── */}
      {hasAnalysis && analysis?.wellness && (
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <SkinAgeCard wellness={analysis.wellness} />
          <RoutineCard wellness={analysis.wellness} />
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {!hasAnalysis ? (
        <div className="mt-10">
          <EmptyAnalysis userProductsLen={userProducts.length} />
        </div>
      ) : (
        <>
          {/* Filter bar */}
          {output.length > 1 && (
            <div className="sticky top-0 z-10 -mx-2 mt-10 flex flex-wrap items-center gap-2 bg-[var(--bg)]/90 px-2 py-3 backdrop-blur">
              <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Show
              </span>
              <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
                All <Counter>{output.length}</Counter>
              </FilterPill>
              {counts.high > 0 && (
                <FilterPill
                  active={filter === "high"}
                  onClick={() => setFilter("high")}
                  tone="terra"
                >
                  High concern <Counter>{output.filter((p) => p.flagged.some((f) => f.relevance === "high")).length}</Counter>
                </FilterPill>
              )}
              {counts.medium > 0 && (
                <FilterPill
                  active={filter === "medium"}
                  onClick={() => setFilter("medium")}
                >
                  Medium <Counter>{output.filter((p) => p.flagged.some((f) => f.relevance === "medium")).length}</Counter>
                </FilterPill>
              )}
              {counts.cleanProducts > 0 && (
                <FilterPill
                  active={filter === "clean"}
                  onClick={() => setFilter("clean")}
                  tone="sage"
                >
                  Clean <Counter>{counts.cleanProducts}</Counter>
                </FilterPill>
              )}
            </div>
          )}

          {/* Product reports */}
          <div className="mt-6 space-y-4">
            {filteredOutput.length === 0 ? (
              <div className="paper-card p-10 text-center text-[var(--muted)]">
                No products match this filter.
              </div>
            ) : (
              filteredOutput.map((p, i) => (
                <ProductReportCard
                  key={p.product.id + i}
                  analysis={p}
                  index={i + 1}
                />
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────

function Stat({
  label,
  value,
  sub,
  tone,
  divided,
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "sage" | "terra";
  divided?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-6 py-5",
        divided && "border-l border-[var(--hairline)]",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-serif text-[40px] leading-none",
            tone === "terra" && "text-[var(--terra-deep)]",
            tone === "sage" && "text-[var(--sage)]",
          )}
        >
          {value}
        </span>
        {sub && (
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {sub}
          </span>
        )}
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: "terra" | "sage";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-all",
        active
          ? tone === "terra"
            ? "border-[var(--terra)] bg-[var(--terra)] text-white"
            : tone === "sage"
              ? "border-[var(--sage)] bg-[var(--sage)] text-[var(--bg)]"
              : "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
          : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]",
      )}
    >
      {children}
    </button>
  );
}

function Counter({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
      {children}
    </span>
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
          : "Five narrow specialists pass each product through a single report — analogies, alternatives, and regulatory citations."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn">
          {userProductsLen === 0 ? "Add your first product" : "Manage products"}{" "}
          <span className="arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

function ProductReportCard({
  analysis,
  index,
}: {
  analysis: ProductAnalysis;
  index: number;
}) {
  const { product, flagged, alternatives } = analysis;
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(index <= 2); // first two products auto-expanded

  const severity = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    for (const f of flagged) counts[f.relevance]++;
    return counts;
  }, [flagged]);

  const totalCount = flagged.length;
  const headTone =
    severity.high > 0 ? "terra" : severity.medium > 0 ? "neutral" : "sage";

  return (
    <article className="paper-card overflow-hidden">
      {/* Head */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 border-b border-[var(--hairline)] px-7 py-5 text-left transition-colors hover:bg-[var(--paper)]"
      >
        <div className="flex min-w-0 items-center gap-5">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px]",
              headTone === "terra"
                ? "bg-[var(--terra)] text-white"
                : headTone === "sage"
                  ? "bg-[var(--sage)] text-[var(--bg)]"
                  : "bg-[var(--paper)] text-[var(--muted)]",
            )}
          >
            {String(index).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
              {product.brand ?? "—"} ·{" "}
              {product.category_slug?.replace(/_/g, " ") ?? "product"}
            </div>
            <h3 className="mt-0.5 truncate text-[22px]">{product.name}</h3>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {totalCount === 0 ? (
            <span className="chip chip-clear">No flags</span>
          ) : (
            <SeverityBar severity={severity} total={totalCount} />
          )}
          <Chevron open={expanded} />
        </div>
      </button>

      {expanded && (
        <>
          {flagged.length === 0 ? (
            <div className="bg-[var(--sage-soft)] px-7 py-7">
              <p className="font-serif text-[20px] italic text-[var(--teal)]">
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
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[15px] font-medium text-[var(--ink)]">
                            {f.inci_name}
                          </span>
                          <RelevanceTag relevance={f.relevance} />
                          {f.bans.slice(0, 2).map((b) => (
                            <span key={b.id} className="chip">
                              Restricted in {b.region}
                            </span>
                          ))}
                        </div>
                        {f.analogy_one_liner ? (
                          <p className="mt-2 font-serif text-[19px] italic leading-[1.35] text-[var(--teal)]">
                            &ldquo;{f.analogy_one_liner}&rdquo;
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[14px] text-[var(--muted)]">
                            {f.reason}
                          </p>
                        )}
                      </div>
                      <span className="ml-3 mt-1 shrink-0">
                        <Chevron open={isOpen} size="sm" />
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

          {alternatives.length > 0 && (
            <div className="bg-[var(--sage-soft)] px-7 py-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sage)]">
                Cleaner swap
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
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
        </>
      )}
    </article>
  );
}

function SeverityBar({
  severity,
  total,
}: {
  severity: { high: number; medium: number; low: number };
  total: number;
}) {
  const pct = (n: number) => (n / total) * 100;
  return (
    <div className="hidden items-center gap-3 sm:flex">
      <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-[var(--hairline)]">
        {severity.high > 0 && (
          <div
            className="h-full bg-[var(--terra)]"
            style={{ width: `${pct(severity.high)}%` }}
          />
        )}
        {severity.medium > 0 && (
          <div
            className="h-full bg-[var(--mist)]"
            style={{ width: `${pct(severity.medium)}%` }}
          />
        )}
        {severity.low > 0 && (
          <div
            className="h-full bg-[var(--muted)]"
            style={{ width: `${pct(severity.low)}%` }}
          />
        )}
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
        {total} flagged
      </span>
    </div>
  );
}

function RelevanceTag({ relevance }: { relevance: string }) {
  if (relevance === "high")
    return (
      <span className="rounded-sm bg-[var(--terra)]/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--terra-deep)]">
        High
      </span>
    );
  if (relevance === "medium")
    return (
      <span className="rounded-sm bg-[var(--mist)]/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--ink)]">
        Medium
      </span>
    );
  return null;
}

function Chevron({ open, size = "md" }: { open: boolean; size?: "sm" | "md" }) {
  const px = size === "sm" ? 14 : 18;
  return (
    <svg
      aria-hidden
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "shrink-0 text-[var(--muted)] transition-transform duration-200",
        open && "rotate-180 text-[var(--ink)]",
      )}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Chip({ tone, children }: { tone: "clear" | "note"; children: React.ReactNode }) {
  return (
    <span
      className={`chip ${tone === "clear" ? "chip-clear" : "chip-note"} capitalize`}
    >
      {children}
    </span>
  );
}

function buildHeadline(
  counts: { high: number; medium: number; cleanProducts: number },
  totalProducts: number,
  name?: string | null,
): { lead: string; tail: string } {
  const greet = name ? `Hi, ${name}.` : "Your report.";
  if (totalProducts === 0)
    return { lead: greet, tail: "Your coach is ready when you are." };
  if (counts.high > 0)
    return {
      lead: greet,
      tail: `${counts.high} ingredient${counts.high === 1 ? "" : "s"} need${counts.high === 1 ? "s" : ""} your attention.`,
    };
  if (counts.medium > 0)
    return {
      lead: greet,
      tail: `${counts.medium} medium-concern ingredient${counts.medium === 1 ? "" : "s"} to keep an eye on.`,
    };
  return { lead: greet, tail: "Your routine is clean. Keep it." };
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "moments ago";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RoutineDonut({
  clean,
  high,
  medium,
  low,
}: {
  clean: number;
  high: number;
  medium: number;
  low: number;
}) {
  const total = clean + high + medium + low;
  if (total === 0) return null;

  // Donut math — circumference of a circle with r=42 ≈ 263.89.
  const r = 42;
  const c = 2 * Math.PI * r;
  const segs = [
    { value: high, color: "var(--terra)", label: "High" },
    { value: medium, color: "var(--mist)", label: "Medium" },
    { value: low, color: "var(--muted)", label: "Low" },
    { value: clean, color: "var(--sage)", label: "Clean" },
  ].filter((s) => s.value > 0);

  let offset = 0;
  const cleanPct = Math.round((clean / total) * 100);

  return (
    <figure className="flex items-center gap-5">
      <svg
        viewBox="0 0 100 100"
        width="120"
        height="120"
        className="shrink-0"
        aria-label={`${cleanPct}% clean products`}
      >
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--hairline)" strokeWidth="10" />
        {segs.map((s, i) => {
          const len = (s.value / total) * c;
          const dasharray = `${len} ${c - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="10"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 50 50)"
              strokeLinecap="butt"
            />
          );
        })}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="fill-[var(--ink)] font-serif"
          style={{ fontSize: "20px" }}
        >
          {cleanPct}%
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          className="fill-[var(--muted)]"
          style={{ fontSize: "7px", letterSpacing: "0.1em" }}
        >
          CLEAN
        </text>
      </svg>
      <figcaption className="space-y-1.5">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--muted)]">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-[var(--ink)]">{s.value}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

function SkinAgeCard({ wellness }: { wellness: Wellness }) {
  const { current, potential, rationale, sustainability_note } = wellness.skin_age;
  const delta = current - potential;
  const better = delta > 0;

  return (
    <article className="paper-card overflow-hidden">
      <div className="border-b border-[var(--hairline)] bg-[var(--paper)] px-7 py-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Skin age estimate
        </div>
      </div>
      <div className="px-7 py-7">
        <div className="flex items-baseline gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
              Today
            </div>
            <div className="mt-1 font-serif text-[64px] leading-none text-[var(--ink)]">
              {current}
            </div>
          </div>

          <span
            className="text-[28px] text-[var(--muted)]"
            aria-hidden
          >
            →
          </span>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--sage)]">
              In 6 months
            </div>
            <div
              className={cn(
                "mt-1 font-serif text-[64px] leading-none",
                better ? "text-[var(--sage)]" : "text-[var(--ink)]",
              )}
            >
              {potential}
            </div>
          </div>

          {better && (
            <span className="ml-auto rounded-sm bg-[var(--sage-soft)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sage)]">
              − {delta} yr
            </span>
          )}
        </div>

        <p className="mt-6 max-w-[60ch] text-[15px] leading-[1.55] text-[var(--ink)]">
          {rationale}
        </p>

        <div className="mt-5 rounded-sm border-l-2 border-[var(--sage)] bg-[var(--sage-soft)]/40 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--sage)]">
            Sustainable angle
          </div>
          <p className="mt-1.5 font-serif text-[16px] italic leading-[1.5] text-[var(--teal)]">
            {sustainability_note}
          </p>
        </div>
      </div>
    </article>
  );
}

function RoutineCard({ wellness }: { wellness: Wellness }) {
  const [tab, setTab] = useState<"morning" | "evening">("morning");
  const steps = wellness.routine[tab] ?? [];

  return (
    <article className="paper-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--paper)] px-7 py-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Routine builder
        </div>
        <div className="flex gap-1 rounded-full border border-[var(--hairline)] bg-[var(--surface)] p-1">
          {(["morning", "evening"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-all",
                tab === t
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
              )}
            >
              {t === "morning" ? "AM" : "PM"}
            </button>
          ))}
        </div>
      </div>
      <ol className="divide-y divide-[var(--hairline)]">
        {steps.map((s) => (
          <RoutineStepRow key={`${tab}-${s.step}`} step={s} />
        ))}
      </ol>
    </article>
  );
}

function RoutineStepRow({ step }: { step: RoutineStep }) {
  return (
    <li className="flex items-start gap-5 px-7 py-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] font-mono text-[12px] text-[var(--ink)]">
        {String(step.step).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium capitalize text-[var(--ink)]">
          {step.category}
        </div>
        <p className="mt-1 text-[14px] leading-[1.5] text-[var(--muted)]">
          {step.why}
        </p>
        {step.key_ingredient && (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-sm border border-[var(--sage)] bg-[var(--sage-soft)] px-3 py-1.5 text-[12px] leading-snug text-[var(--ink)]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sage)]" />
            <span className="break-words normal-case">{step.key_ingredient}</span>
          </div>
        )}
      </div>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-10">
      <div className="space-y-4 border-b border-[var(--hairline)] pb-8">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-12 w-[60%]" />
        <div className="skeleton h-12 w-[45%]" />
      </div>
      <div className="skeleton mt-10 h-24 w-full rounded-sm" />
      <div className="skeleton mt-8 h-20 w-full rounded-sm" />
      <div className="skeleton mt-10 h-60 w-full rounded-sm" />
    </main>
  );
}
