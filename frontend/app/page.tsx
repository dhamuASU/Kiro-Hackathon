"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, ChevronDown, FlaskConical, Layers, Leaf, Search, Sparkles, ShieldCheck, Waves, Eye } from "lucide-react";
import { PRODUCTS, searchProducts, type Product } from "@/data/cleanlabel";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo<Product[]>(() => searchProducts(q), [q]);

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
    <div style={{ background: "linear-gradient(160deg, #FAF9F6 0%, #F0FFC2 60%, #FAF9F6 100%)", minHeight: "100vh" }}>

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#28396C] text-white shadow-md">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-semibold text-[#28396C]">DermaDecode</span>
        </div>
        <nav className="flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-sm backdrop-blur" style={{ boxShadow: "0 2px 12px rgba(0,30,60,0.07)" }}>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-[#28396C] px-4 py-1.5 text-xs font-semibold text-white">
            <FlaskConical className="h-3.5 w-3.5" /> Search
          </Link>
          <Link href="/routine" className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-[#28396C]/70 hover:text-[#28396C]">
            <Layers className="h-3.5 w-3.5" /> Routine
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-10 text-center">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#28396C]/10 bg-white/70 px-4 py-1.5 text-xs font-medium text-[#28396C]/70 backdrop-blur" style={{ boxShadow: "0 2px 8px rgba(0,30,60,0.05)" }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B5E18B] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B5E18B]" />
          </span>
          Independent ingredient analysis · 12,400+ products
        </div>

        {/* Headline */}
        <h1 className="text-balance text-4xl font-semibold leading-tight text-[#28396C] md:text-6xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          The beauty industry hides
          <br />what's in your products.
          <span className="block" style={{ color: "#4a9e4a", textShadow: "0 2px 8px rgba(74,158,74,0.2)" }}>
            DermaDecode doesn't.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-[#28396C]/65 md:text-lg">
          Search a product, paste a label, or snap a photo. Get an honest, science-backed breakdown in seconds.
        </p>

        {/* Search bar */}
        <form onSubmit={submit} className="mx-auto mt-10 max-w-2xl">
          <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-2 rounded-[32px] bg-white p-2 pl-5" style={{ boxShadow: "0 4px 24px rgba(0,30,60,0.08), 0 1px 4px rgba(0,30,60,0.04)" }}>
              <Search className="h-5 w-5 shrink-0 text-[#28396C]/40" />
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Try 'Neutrogena Hydro Boost' or 'CeraVe'"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base text-[#28396C] outline-none placeholder:text-[#28396C]/35"
                autoComplete="off"
              />
              <button type="submit" className="rounded-[24px] bg-[#28396C] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                Analyze
              </button>
            </div>

            {/* Autocomplete */}
            {open && q && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[24px] bg-white" style={{ boxShadow: "0 8px 32px rgba(0,30,60,0.10)" }}>
                {suggestions.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-[#28396C]/50">No matches — try pasting the ingredient list below.</div>
                ) : (
                  <ul className="max-h-72 overflow-auto py-1">
                    {suggestions.map(p => (
                      <li key={p.id}>
                        <button type="button" onClick={() => go(p.id)}
                          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-[#F0FFC2]/60">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[#28396C]">{p.name}</div>
                            <div className="truncate text-xs text-[#28396C]/50">{p.brand} · {p.category}</div>
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
        <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#28396C]/30">
          <div className="h-px flex-1 bg-[#28396C]/10" />
          or
          <div className="h-px flex-1 bg-[#28396C]/10" />
        </div>

        {/* Action cards */}
        <div className="mx-auto mt-5 grid max-w-2xl gap-4 sm:grid-cols-2">
          {/* Paste card */}
          <div className="rounded-[24px] bg-white/60 backdrop-blur" style={{ boxShadow: "0 2px 16px rgba(0,30,60,0.06)", border: "1px solid rgba(40,57,108,0.08)" }}>
            <button type="button" onClick={() => setPasteOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-[24px] px-5 py-4 text-left text-sm font-semibold text-[#28396C]">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#4a9e4a]" />
                Paste ingredient list
              </span>
              <ChevronDown className={cn("h-4 w-4 text-[#28396C]/40 transition-transform", pasteOpen && "rotate-180")} />
            </button>
            {pasteOpen && (
              <div className="px-4 pb-4">
                <textarea value={pasted} onChange={e => setPasted(e.target.value)}
                  placeholder="Aqua, Glycerin, Phenoxyethanol, Fragrance…"
                  className="min-h-24 w-full resize-none rounded-[16px] border border-[#28396C]/10 bg-white/80 p-3 text-sm text-[#28396C] outline-none focus:border-[#28396C]/30" />
                <button type="button" onClick={() => router.push("/product/neutrogena-hydroboost")}
                  disabled={pasted.trim().length < 10}
                  className="mt-2 w-full rounded-[16px] bg-[#28396C] py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                  Analyze ingredients
                </button>
              </div>
            )}
          </div>

          {/* Upload card */}
          <button type="button" onClick={() => router.push("/product/banana-boat-spf")}
            className="group flex items-center justify-between rounded-[24px] bg-white/60 px-5 py-4 text-left backdrop-blur transition-all hover:-translate-y-1"
            style={{ boxShadow: "0 2px 16px rgba(0,30,60,0.06)", border: "1px solid rgba(40,57,108,0.08)" }}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#F0FFC2]">
                <Camera className="h-5 w-5 text-[#28396C]" />
              </span>
              <div>
                <div className="text-sm font-semibold text-[#28396C]">Upload label photo</div>
                <div className="text-xs text-[#28396C]/50">We'll OCR and analyze it</div>
              </div>
            </div>
            <ChevronDown className="-rotate-90 text-[#28396C]/30 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Feature cards (peeking) */}
        <div className="mx-auto mt-14 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Peer-reviewed sources", body: "EWG, PubMed, EU CosIng — every flag is cited." },
            { icon: Waves,       title: "Reef & waterway impact", body: "Tracked per ingredient, per use." },
            { icon: Eye,         title: "Greenwash detector",    body: "Claims vs. reality, side by side." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[24px] bg-white/50 p-5 text-left backdrop-blur" style={{ boxShadow: "0 2px 12px rgba(0,30,60,0.05)", border: "1px solid rgba(40,57,108,0.07)" }}>
              <Icon className="mb-3 h-5 w-5 text-[#4a9e4a]" />
              <div className="text-sm font-semibold text-[#28396C]">{title}</div>
              <div className="mt-1 text-xs text-[#28396C]/55">{body}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#28396C]/8 py-6 text-center text-xs text-[#28396C]/40">
        DermaDecode · Independent · Not affiliated with any brand listed.
      </footer>
    </div>
  );
}

function ScorePill({ value }: { value: number }) {
  const tone = value >= 8 ? "bg-green-50 text-green-700" : value >= 5 ? "bg-yellow-50 text-yellow-700" : value >= 3 ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tone)}>
      {value}<span className="text-[10px] opacity-60">/10</span>
    </span>
  );
}
