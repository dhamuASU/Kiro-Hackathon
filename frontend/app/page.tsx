"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, Search, Sparkles, ShieldCheck, Waves, Eye, X, FlaskConical, Ban, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PRODUCTS, INGREDIENTS, searchProducts, type Product } from "@/data/cleanlabel";
import { cn } from "@/lib/utils";

// ── Bottle Demo Component ────────────────────────────────
const DEMO_PRODUCT = PRODUCTS.find(p => p.id === "banana-boat-spf") ?? PRODUCTS[0];

function BottleDemo({ onAnalyze }: { onAnalyze: (id: string) => void }) {
  const [clicked, setClicked] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setShowInfo(true), 300);
  };

  const ingredients = (DEMO_PRODUCT.ingredients ?? [])
    .map(id => INGREDIENTS[id])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="animate-fade-up delay-200 mx-auto mt-10 mb-2 flex flex-col items-center">
      <p className="mb-4 text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(28,43,74,0.4)", fontFamily: "var(--font-mono)" }}>
        TAP THE BOTTLE TO ANALYZE
      </p>

      <div className="relative flex items-center justify-center" style={{ height: 220 }}>
        {/* Ripple rings on click */}
        {clicked && (
          <>
            <span className="ripple-ring absolute h-32 w-32 rounded-full border-2" style={{ borderColor: "var(--sage)" }} />
            <span className="ripple-ring absolute h-32 w-32 rounded-full border-2" style={{ borderColor: "var(--sage)", animationDelay: "0.3s" }} />
          </>
        )}

        {/* The bottle */}
        <button
          onClick={handleClick}
          className={cn(
            "relative z-10 flex flex-col items-center gap-1 transition-transform focus:outline-none",
            !clicked && "bottle-drop bottle-float",
            clicked && "scale-90 opacity-60 transition-all duration-300"
          )}
          aria-label="Analyze this product"
        >
          {/* Bottle SVG */}
          <div className="relative" style={{ width: 80, height: 160 }}>
            <svg viewBox="0 0 80 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 8px 24px rgba(28,43,74,0.18))" }}>
              {/* Cap */}
              <rect x="28" y="4" width="24" height="18" rx="4" fill="#1C2B4A" />
              {/* Neck */}
              <rect x="32" y="20" width="16" height="14" rx="2" fill="#2a3d5e" />
              {/* Body */}
              <rect x="14" y="32" width="52" height="110" rx="12" fill="url(#bottleGrad)" />
              {/* Label */}
              <rect x="20" y="52" width="40" height="60" rx="6" fill="white" fillOpacity="0.9" />
              {/* Label text lines */}
              <rect x="26" y="60" width="28" height="4" rx="2" fill="#1C2B4A" fillOpacity="0.7" />
              <rect x="26" y="68" width="20" height="3" rx="1.5" fill="#1C2B4A" fillOpacity="0.4" />
              <rect x="26" y="75" width="24" height="3" rx="1.5" fill="#1C2B4A" fillOpacity="0.4" />
              {/* SPF badge */}
              <rect x="26" y="84" width="28" height="16" rx="4" fill="#C9A84C" />
              <text x="40" y="95" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="monospace">SPF 50</text>
              {/* Shine */}
              <rect x="18" y="36" width="6" height="80" rx="3" fill="white" fillOpacity="0.15" />
              <defs>
                <linearGradient id="bottleGrad" x1="14" y1="32" x2="66" y2="142" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f97316" />
                  <stop offset="1" stopColor="#ea580c" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-body)" }}>
            {DEMO_PRODUCT.brand} · {DEMO_PRODUCT.name}
          </span>
        </button>

        {/* Info popup */}
        {showInfo && (
          <div className="pop-in absolute left-1/2 top-0 z-20 w-72 -translate-x-1/2 -translate-y-2 rounded-[20px] bg-white p-4"
            style={{ boxShadow: "var(--shadow-lift)", border: "1px solid rgba(28,43,74,0.08)" }}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(28,43,74,0.45)", fontFamily: "var(--font-mono)" }}>
                  {DEMO_PRODUCT.brand}
                </div>
                <div className="font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)", fontSize: "0.95rem" }}>
                  {DEMO_PRODUCT.name}
                </div>
              </div>
              <button onClick={() => { setShowInfo(false); setClicked(false); }}
                className="rounded-full p-1 transition-colors hover:bg-gray-100">
                <X className="h-4 w-4" style={{ color: "rgba(28,43,74,0.4)" }} />
              </button>
            </div>

            {/* Score row */}
            <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl p-2" style={{ background: "rgba(28,43,74,0.04)" }}>
              {(["safety","environmental","transparency","honesty"] as const).map(k => {
                const v = DEMO_PRODUCT.scores[k];
                const color = v >= 8 ? "var(--score-safe)" : v >= 5 ? "var(--score-moderate)" : v >= 3 ? "var(--score-concern)" : "var(--score-danger)";
                return (
                  <div key={k} className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{v}</span>
                    <span className="text-[9px] uppercase" style={{ color: "rgba(28,43,74,0.4)", fontFamily: "var(--font-mono)" }}>{k.slice(0,4)}</span>
                  </div>
                );
              })}
            </div>

            {/* Top flagged ingredients */}
            <div className="space-y-1.5 mb-3">
              {ingredients.map(ing => (
                <div key={ing.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{
                    background: ing.safety === "danger" ? "var(--score-danger)" : ing.safety === "avoid" ? "var(--score-concern)" : ing.safety === "caution" ? "var(--score-moderate)" : "var(--score-safe)"
                  }} />
                  <span className="text-xs truncate" style={{ color: "var(--navy)", fontFamily: "var(--font-mono)" }}>{ing.name}</span>
                  {ing.flags.includes("eu_banned") && <span className="banned-chip ml-auto shrink-0">EU</span>}
                </div>
              ))}
            </div>

            {DEMO_PRODUCT.greenwash && (
              <div className="mb-3 rounded-xl p-2.5 text-xs" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <span className="font-semibold" style={{ color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>⚠ GREENWASH: </span>
                <span style={{ color: "rgba(28,43,74,0.7)" }}>Claims "{DEMO_PRODUCT.greenwash.claim}"</span>
              </div>
            )}

            <button onClick={() => onAnalyze(DEMO_PRODUCT.id)}
              className="w-full rounded-[12px] py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--navy)", fontFamily: "var(--font-body)" }}>
              See full analysis →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Landing Page ────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => searchProducts(q), [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const go = (id: string) => router.push(`/product/${id}`);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (suggestions[0]) go(suggestions[0].id); };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-12 text-center">

        {/* Badge */}
        <div className="animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
          style={{ background: "rgba(28,43,74,0.06)", color: "rgba(28,43,74,0.6)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", border: "1px solid rgba(28,43,74,0.1)" }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--sage)" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--sage)" }} />
          </span>
          INDEPENDENT INGREDIENT ANALYSIS · 12,400+ PRODUCTS
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 text-balance leading-[1.08]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 6vw, 4rem)", color: "var(--navy)", fontWeight: 700 }}>
          The beauty industry hides
          <br />what's in your products.
          <span className="block" style={{ color: "var(--sage-dark)", textShadow: "0 2px 12px rgba(74,140,78,0.18)" }}>
            CleanLabel doesn't.
          </span>
        </h1>

        <p className="animate-fade-up delay-200 mx-auto mt-5 max-w-lg text-balance text-base"
          style={{ color: "rgba(28,43,74,0.6)", fontFamily: "var(--font-body)", lineHeight: 1.7 }}>
          Search a product, paste a label, or snap a photo. Get an honest, science-backed breakdown in seconds.
        </p>

        {/* Bottle demo */}
        <BottleDemo onAnalyze={(id) => router.push(`/product/${id}`)} />

        {/* Search bar */}
        <form onSubmit={submit} className="animate-fade-up delay-300 mx-auto mt-6 max-w-2xl">
          <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-2 rounded-[28px] bg-white p-2 pl-5"
              style={{ boxShadow: "0 4px 28px rgba(28,43,74,0.10), 0 1px 4px rgba(28,43,74,0.05)" }}>
              <Search className="h-5 w-5 shrink-0" style={{ color: "rgba(28,43,74,0.35)" }} />
              <input value={q}
                onChange={e => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Try 'Neutrogena Hydro Boost' or 'CeraVe'"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base outline-none"
                style={{ color: "var(--navy)", fontFamily: "var(--font-body)" }}
                autoComplete="off" />
              <button type="submit" className="rounded-[22px] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--navy)", fontFamily: "var(--font-body)" }}>
                Analyze
              </button>
            </div>
            {open && q && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[22px] bg-white"
                style={{ boxShadow: "0 8px 32px rgba(28,43,74,0.12)" }}>
                {suggestions.length === 0 ? (
                  <div className="px-5 py-4 text-sm" style={{ color: "rgba(28,43,74,0.45)" }}>No matches — try pasting the ingredient list below.</div>
                ) : (
                  <ul className="max-h-72 overflow-auto py-1">
                    {suggestions.map(p => (
                      <li key={p.id}>
                        <button type="button" onClick={() => go(p.id)}
                          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-[rgba(28,43,74,0.04)]">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold" style={{ color: "var(--navy)" }}>{p.name}</div>
                            <div className="truncate text-xs" style={{ color: "rgba(28,43,74,0.45)", fontFamily: "var(--font-mono)" }}>{p.brand} · {p.category}</div>
                          </div>
                          <ScorePill value={p.scores.safety} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </form>

        {/* OR divider */}
        <div className="animate-fade-up delay-400 mx-auto mt-8 flex max-w-2xl items-center gap-3"
          style={{ color: "rgba(28,43,74,0.25)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em" }}>
          <div className="h-px flex-1" style={{ background: "rgba(28,43,74,0.1)" }} />OR
          <div className="h-px flex-1" style={{ background: "rgba(28,43,74,0.1)" }} />
        </div>

        {/* Action cards */}
        <div className="animate-fade-up delay-400 mx-auto mt-5 grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="glass rounded-[24px]">
            <button type="button" onClick={() => setPasteOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-[24px] px-5 py-4 text-left text-sm font-semibold"
              style={{ color: "var(--navy)", fontFamily: "var(--font-body)" }}>
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "var(--sage-dark)" }} />
                Paste ingredient list
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", pasteOpen && "rotate-180")} style={{ color: "rgba(28,43,74,0.35)" }} />
            </button>
            {pasteOpen && (
              <div className="px-4 pb-4">
                <textarea value={pasted} onChange={e => setPasted(e.target.value)}
                  placeholder="Aqua, Glycerin, Phenoxyethanol, Fragrance…"
                  className="min-h-24 w-full resize-none rounded-[14px] p-3 text-sm outline-none"
                  style={{ border: "1px solid rgba(28,43,74,0.12)", background: "rgba(255,255,255,0.7)", color: "var(--navy)", fontFamily: "var(--font-mono)", fontSize: "12px" }} />
                <button type="button" onClick={() => router.push("/product/neutrogena-hydroboost")}
                  disabled={pasted.trim().length < 10}
                  className="mt-2 w-full rounded-[14px] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "var(--navy)", fontFamily: "var(--font-body)" }}>
                  Analyze ingredients
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => router.push("/product/banana-boat-spf")}
            className="glass group flex items-center justify-between rounded-[24px] px-5 py-4 text-left transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[14px]" style={{ background: "rgba(28,43,74,0.07)" }}>
                <Camera className="h-5 w-5" style={{ color: "var(--navy)" }} />
              </span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-body)" }}>Upload label photo</div>
                <div className="text-xs" style={{ color: "rgba(28,43,74,0.45)", fontFamily: "var(--font-mono)" }}>OCR · INSTANT ANALYSIS</div>
              </div>
            </div>
            <ChevronDown className="-rotate-90 transition-transform group-hover:translate-x-1" style={{ color: "rgba(28,43,74,0.3)" }} />
          </button>
        </div>

        {/* Feature cards */}
        <div className="animate-fade-up delay-500 mx-auto mt-14 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Peer-reviewed sources", body: "EWG, PubMed, EU CosIng — every flag is cited." },
            { icon: Waves,       title: "Reef & waterway impact", body: "Tracked per ingredient, per use." },
            { icon: Eye,         title: "Greenwash detector",    body: "Claims vs. reality, side by side." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass rounded-[20px] p-5 text-left">
              <Icon className="mb-3 h-5 w-5" style={{ color: "var(--sage-dark)" }} />
              <div className="text-sm font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>{title}</div>
              <div className="mt-1 text-xs" style={{ color: "rgba(28,43,74,0.5)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ScorePill({ value }: { value: number }) {
  const color = value >= 8 ? "var(--score-safe)" : value >= 5 ? "var(--score-moderate)" : value >= 3 ? "var(--score-concern)" : "var(--score-danger)";
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white"
      style={{ background: color, fontFamily: "var(--font-mono)" }}>
      {value}<span className="text-[10px] opacity-70">/10</span>
    </span>
  );
}
