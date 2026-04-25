"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, Search, Sparkles, ShieldCheck, Waves, Eye, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PRODUCTS, INGREDIENTS, searchProducts } from "@/data/cleanlabel";
import { cn } from "@/lib/utils";

const DEMO = PRODUCTS.find(p => p.id === "banana-boat-spf") ?? PRODUCTS[0];

// ── Animated Bottle ──────────────────────────────────────
function AnimatedBottle({ onClick, clicked }: { onClick: () => void; clicked: boolean }) {
  return (
    <button onClick={onClick} aria-label="Analyze this product"
      className={cn("relative focus:outline-none transition-all duration-500", clicked ? "scale-75 opacity-40" : "hover:scale-105")}>

      {/* Glow behind bottle */}
      <div className="absolute inset-0 rounded-full blur-3xl opacity-30 transition-opacity"
        style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", transform: "scale(1.4)" }} />

      {/* Bottle SVG — taller, more detailed */}
      <svg viewBox="0 0 100 220" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ width: 140, height: 308, filter: "drop-shadow(0 20px 40px rgba(28,43,74,0.25))", position: "relative", zIndex: 1 }}>

        {/* Cap */}
        <rect x="36" y="2" width="28" height="22" rx="6" fill="#1C2B4A" />
        <rect x="40" y="6" width="20" height="4" rx="2" fill="rgba(255,255,255,0.15)" />

        {/* Neck */}
        <path d="M40 24 Q38 30 34 38 L66 38 Q62 30 60 24 Z" fill="#2a3d5e" />

        {/* Body */}
        <rect x="12" y="36" width="76" height="168" rx="16" fill="url(#bodyGrad)" />

        {/* Body shine left */}
        <rect x="16" y="42" width="8" height="120" rx="4" fill="rgba(255,255,255,0.12)" />

        {/* Label background */}
        <rect x="18" y="60" width="64" height="100" rx="10" fill="white" fillOpacity="0.92" />

        {/* Brand name */}
        <text x="50" y="82" textAnchor="middle" fill="#1C2B4A" fontSize="7" fontWeight="800" fontFamily="monospace" letterSpacing="2">BANANA BOAT</text>

        {/* Divider */}
        <rect x="24" y="86" width="52" height="1" fill="#1C2B4A" fillOpacity="0.15" />

        {/* Product name */}
        <text x="50" y="100" textAnchor="middle" fill="#1C2B4A" fontSize="9" fontWeight="700" fontFamily="serif">Sport</text>
        <text x="50" y="112" textAnchor="middle" fill="#1C2B4A" fontSize="9" fontWeight="700" fontFamily="serif">Sunscreen</text>

        {/* SPF badge */}
        <rect x="28" y="120" width="44" height="24" rx="6" fill="#C9A84C" />
        <text x="50" y="130" textAnchor="middle" fill="white" fontSize="7" fontWeight="800" fontFamily="monospace">SPF</text>
        <text x="50" y="140" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" fontFamily="monospace">50</text>

        {/* Warning strip */}
        <rect x="18" y="150" width="64" height="6" rx="2" fill="#dc2626" fillOpacity="0.15" />
        <text x="50" y="155" textAnchor="middle" fill="#dc2626" fontSize="5" fontWeight="700" fontFamily="monospace" letterSpacing="1">3 INGREDIENTS BANNED IN EU</text>

        {/* Bottom texture */}
        <rect x="12" y="190" width="76" height="14" rx="0" fill="rgba(0,0,0,0.08)" />
        <rect x="12" y="190" width="76" height="14" rx="0" fill="url(#bottomGrad)" />

        <defs>
          <linearGradient id="bodyGrad" x1="12" y1="36" x2="88" y2="204" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb923c" />
            <stop offset="0.5" stopColor="#f97316" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="bottomGrad" x1="12" y1="190" x2="88" y2="204" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(0,0,0,0.15)" />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tap hint */}
      {!clicked && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs uppercase tracking-[0.2em]"
          style={{ color: "rgba(28,43,74,0.4)", fontFamily: "var(--font-mono)" }}>
          tap to analyze
        </div>
      )}

      {/* Ripple rings on click */}
      {clicked && (
        <>
          <span className="ripple-ring absolute inset-0 rounded-full border-2" style={{ borderColor: "var(--sage)" }} />
          <span className="ripple-ring absolute inset-0 rounded-full border-2" style={{ borderColor: "var(--sage)", animationDelay: "0.35s" }} />
        </>
      )}
    </button>
  );
}

// ── Ingredient Popup ─────────────────────────────────────
function IngredientPopup({ onClose, onAnalyze }: { onClose: () => void; onAnalyze: () => void }) {
  const ingredients = (DEMO.ingredients ?? []).map(id => INGREDIENTS[id]).filter(Boolean).slice(0, 5);
  return (
    <div className="pop-in w-full max-w-xs rounded-[22px] bg-white p-5"
      style={{ boxShadow: "var(--shadow-lift)", border: "1px solid rgba(28,43,74,0.08)" }}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(28,43,74,0.4)", fontFamily: "var(--font-mono)" }}>
            {DEMO.brand}
          </div>
          <div className="font-semibold leading-tight" style={{ color: "var(--navy)", fontFamily: "var(--font-display)", fontSize: "1rem" }}>
            {DEMO.name}
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 rounded-full p-1 hover:bg-gray-100">
          <X className="h-4 w-4" style={{ color: "rgba(28,43,74,0.4)" }} />
        </button>
      </div>

      {/* Scores */}
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl p-2.5" style={{ background: "rgba(28,43,74,0.04)" }}>
        {(["safety","environmental","transparency","honesty"] as const).map(k => {
          const v = DEMO.scores[k];
          const c = v >= 8 ? "var(--score-safe)" : v >= 5 ? "var(--score-moderate)" : v >= 3 ? "var(--score-concern)" : "var(--score-danger)";
          return (
            <div key={k} className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold leading-none" style={{ color: c, fontFamily: "var(--font-mono)" }}>{v}</span>
              <span className="text-[9px] uppercase" style={{ color: "rgba(28,43,74,0.4)", fontFamily: "var(--font-mono)" }}>{k.slice(0,4)}</span>
            </div>
          );
        })}
      </div>

      {/* Ingredients */}
      <div className="mb-4 space-y-2">
        {ingredients.map(ing => {
          const dotColor = ing.safety === "danger" ? "var(--score-danger)" : ing.safety === "avoid" ? "var(--score-concern)" : ing.safety === "caution" ? "var(--score-moderate)" : "var(--score-safe)";
          return (
            <div key={ing.id} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dotColor }} />
              <span className="flex-1 truncate text-xs" style={{ color: "var(--navy)", fontFamily: "var(--font-mono)" }}>{ing.name}</span>
              {ing.flags.includes("eu_banned") && <span className="banned-chip shrink-0">EU</span>}
            </div>
          );
        })}
      </div>

      {/* Greenwash */}
      {DEMO.greenwash && (
        <div className="mb-4 rounded-xl p-2.5 text-xs" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}>
          <span className="font-bold" style={{ color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: "9px" }}>⚠ GREENWASH DETECTED</span>
          <p className="mt-0.5" style={{ color: "rgba(28,43,74,0.65)" }}>Claims "{DEMO.greenwash.claim}" — contains oxybenzone, banned in Hawaii for bleaching coral reefs.</p>
        </div>
      )}

      <button onClick={onAnalyze}
        className="w-full rounded-[12px] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--navy)", fontFamily: "var(--font-body)" }}>
        See full analysis →
      </button>
    </div>
  );
}

// ── Landing Page ─────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [bottleClicked, setBottleClicked] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => searchProducts(q), [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrapperRef.current?.contains(e.target as Node)) setSearchOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleBottleClick = () => { setBottleClicked(true); setTimeout(() => setShowPopup(true), 350); };
  const resetBottle = () => { setShowPopup(false); setBottleClicked(false); };

  const go = (id: string) => router.push(`/product/${id}`);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (suggestions[0]) go(suggestions[0].id); };

  return (
    <AppShell>
      {/* ── HERO: split layout ── */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-6">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">

          {/* LEFT — headline + search */}
          <div>
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs"
              style={{ background: "rgba(28,43,74,0.06)", color: "rgba(28,43,74,0.6)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", border: "1px solid rgba(28,43,74,0.1)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--sage)" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--sage)" }} />
              </span>
              INDEPENDENT · 12,400+ PRODUCTS
            </div>

            <h1 className="animate-fade-up delay-100 text-balance leading-[1.06]"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 5vw, 4.2rem)", color: "var(--navy)", fontWeight: 700 }}>
              The beauty industry hides what's in your products.
              <span className="block mt-1" style={{ color: "var(--sage-dark)", textShadow: "0 2px 12px rgba(74,140,78,0.18)" }}>
                CleanLabel doesn't.
              </span>
            </h1>

            <p className="animate-fade-up delay-200 mt-5 max-w-md text-base"
              style={{ color: "rgba(28,43,74,0.6)", fontFamily: "var(--font-body)", lineHeight: 1.75 }}>
              Search a product, paste a label, or snap a photo. Get an honest, science-backed breakdown in seconds.
            </p>

            {/* Search */}
            <form onSubmit={submit} className="animate-fade-up delay-300 mt-8 max-w-lg">
              <div ref={wrapperRef} className="relative">
                <div className="flex items-center gap-2 rounded-[28px] bg-white p-2 pl-5"
                  style={{ boxShadow: "0 4px 28px rgba(28,43,74,0.10)" }}>
                  <Search className="h-5 w-5 shrink-0" style={{ color: "rgba(28,43,74,0.35)" }} />
                  <input value={q} onChange={e => { setQ(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Try 'Neutrogena Hydro Boost'…"
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base outline-none"
                    style={{ color: "var(--navy)", fontFamily: "var(--font-body)" }} autoComplete="off" />
                  <button type="submit" className="rounded-[22px] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: "var(--navy)" }}>Analyze</button>
                </div>
                {searchOpen && q && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[22px] bg-white"
                    style={{ boxShadow: "0 8px 32px rgba(28,43,74,0.12)" }}>
                    {suggestions.length === 0
                      ? <div className="px-5 py-4 text-sm" style={{ color: "rgba(28,43,74,0.45)" }}>No matches found.</div>
                      : <ul className="max-h-64 overflow-auto py-1">
                          {suggestions.map(p => (
                            <li key={p.id}>
                              <button type="button" onClick={() => go(p.id)}
                                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-[rgba(28,43,74,0.04)]">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold" style={{ color: "var(--navy)" }}>{p.name}</div>
                                  <div className="truncate text-xs" style={{ color: "rgba(28,43,74,0.45)", fontFamily: "var(--font-mono)" }}>{p.brand}</div>
                                </div>
                                <ScorePill value={p.scores.safety} />
                              </button>
                            </li>
                          ))}
                        </ul>
                    }
                  </div>
                )}
              </div>
            </form>

            {/* OR + paste/upload */}
            <div className="animate-fade-up delay-400 mt-5 flex items-center gap-3 max-w-lg">
              <div className="h-px flex-1" style={{ background: "rgba(28,43,74,0.1)" }} />
              <span className="text-xs" style={{ color: "rgba(28,43,74,0.3)", fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}>OR</span>
              <div className="h-px flex-1" style={{ background: "rgba(28,43,74,0.1)" }} />
            </div>

            <div className="animate-fade-up delay-400 mt-4 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="glass rounded-[20px]">
                <button type="button" onClick={() => setPasteOpen(o => !o)}
                  className="flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-sm font-semibold"
                  style={{ color: "var(--navy)", fontFamily: "var(--font-body)" }}>
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" style={{ color: "var(--sage-dark)" }} />Paste list</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", pasteOpen && "rotate-180")} style={{ color: "rgba(28,43,74,0.35)" }} />
                </button>
                {pasteOpen && (
                  <div className="px-3 pb-3">
                    <textarea value={pasted} onChange={e => setPasted(e.target.value)}
                      placeholder="Aqua, Glycerin, Fragrance…"
                      className="min-h-20 w-full resize-none rounded-[12px] p-2.5 text-xs outline-none"
                      style={{ border: "1px solid rgba(28,43,74,0.12)", background: "rgba(255,255,255,0.7)", color: "var(--navy)", fontFamily: "var(--font-mono)" }} />
                    <button type="button" disabled={pasted.trim().length < 10}
                      onClick={() => router.push("/product/neutrogena-hydroboost")}
                      className="mt-2 w-full rounded-[12px] py-2 text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: "var(--navy)" }}>Analyze</button>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => router.push("/product/banana-boat-spf")}
                className="glass group flex items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-all hover:-translate-y-0.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px]" style={{ background: "rgba(28,43,74,0.07)" }}>
                  <Camera className="h-4 w-4" style={{ color: "var(--navy)" }} />
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-body)" }}>Upload photo</div>
                  <div className="text-xs" style={{ color: "rgba(28,43,74,0.45)", fontFamily: "var(--font-mono)" }}>OCR ANALYSIS</div>
                </div>
              </button>
            </div>
          </div>

          {/* RIGHT — bottle + popup */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative flex flex-col items-center" style={{ minHeight: 380 }}>
              <div className={cn("bottle-drop", !bottleClicked && "bottle-float")}>
                <AnimatedBottle onClick={handleBottleClick} clicked={bottleClicked} />
              </div>
              {showPopup && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4 lg:left-auto lg:right-full lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:mr-6 z-20">
                  <IngredientPopup onClose={resetBottle} onAnalyze={() => router.push(`/product/${DEMO.id}`)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="animate-fade-up delay-500 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Peer-reviewed sources", body: "EWG, PubMed, EU CosIng — every flag is cited." },
            { icon: Waves,       title: "Reef & waterway impact", body: "Tracked per ingredient, per use." },
            { icon: Eye,         title: "Greenwash detector",    body: "Claims vs. reality, side by side." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass rounded-[20px] p-5">
              <Icon className="mb-3 h-5 w-5" style={{ color: "var(--sage-dark)" }} />
              <div className="text-sm font-semibold" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>{title}</div>
              <div className="mt-1 text-xs" style={{ color: "rgba(28,43,74,0.5)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>
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
