"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, ChevronDown, Search, Sparkles, ShieldCheck, Leaf, Eye } from "lucide-react";
import { SiteNav } from "@/components/cleanlabel/SiteNav";
import { PRODUCTS, searchProducts, type Product } from "@/data/cleanlabel";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Product[]>(() => searchProducts(q), [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpenSuggest(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goToProduct = (id: string) => router.push(`/product/${id}`);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (suggestions[0]) goToProduct(suggestions[0].id); };

  return (
    <div className="min-h-screen" >
      <SiteNav />
      <main>
        <section className="container pb-12 pt-10 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white/60 px-3 py-1 text-xs font-medium text-navy/70 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              Independent ingredient analysis · 12,400+ products
            </div>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight text-navy md:text-6xl">
              The beauty industry hides what's in your products.
              <span className="block text-green-600"> CleanLabel doesn't.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base text-navy/70 md:text-lg">
              Search a product, paste a label, or snap a photo. Get an honest, science-backed breakdown in seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl">
            <div ref={wrapperRef} className="relative">
              <div className={cn("flex items-center gap-2 rounded-full bg-white/90 p-2 pl-5 shadow-lg ring-1 ring-navy/10 transition-all",
                openSuggest && q && "ring-2 ring-green-400")}>
                <Search className="h-5 w-5 text-navy/50" />
                <input ref={inputRef} value={q}
                  onChange={(e) => { setQ(e.target.value); setOpenSuggest(true); }}
                  onFocus={() => setOpenSuggest(true)}
                  placeholder="Try 'Neutrogena Hydro Boost' or 'CeraVe'"
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base text-navy outline-none placeholder:text-navy/40"
                  aria-label="Search products" autoComplete="off" />
                <button type="submit" className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90">
                  Analyze
                </button>
              </div>
              {openSuggest && q && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-navy/10">
                  {suggestions.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-navy/60">No matches. Try pasting the ingredient list instead.</div>
                  ) : (
                    <ul className="max-h-80 overflow-auto py-1">
                      {suggestions.map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => goToProduct(p.id)}
                            className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-mint/60">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-navy">{p.name}</div>
                              <div className="truncate text-xs text-navy/60">{p.brand} · {p.category}</div>
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

          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 text-xs uppercase tracking-[0.25em] text-navy/40">
            <div className="h-px flex-1 bg-navy/15" /> or <div className="h-px flex-1 bg-navy/15" />
          </div>

          <div className="mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#EAE6BC] p-1 shadow-md">
              <button type="button" onClick={() => setPasteOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-navy"
                aria-expanded={pasteOpen}>
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-green-600" /> Paste ingredient list</span>
                <ChevronDown className={cn("h-4 w-4 text-navy/50 transition-transform", pasteOpen && "rotate-180")} />
              </button>
              {pasteOpen && (
                <div className="px-3 pb-3">
                  <textarea value={pasted} onChange={(e) => setPasted(e.target.value)}
                    placeholder="Aqua, Glycerin, Phenoxyethanol, Fragrance, Propylparaben…"
                    className="min-h-28 w-full resize-none rounded-xl border border-navy/15 bg-white/80 p-3 text-sm text-navy outline-none" />
                  <button type="button" onClick={() => router.push("/product/neutrogena-hydroboost")}
                    disabled={pasted.trim().length < 10}
                    className="mt-2 w-full rounded-full bg-navy py-2 text-sm font-semibold text-white disabled:opacity-50">
                    Analyze ingredients
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => router.push("/product/banana-boat-spf")}
              className="group flex items-center justify-between rounded-2xl bg-[#EAE6BC] p-4 text-left shadow-md transition-all hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-100">
                  <Camera className="h-5 w-5 text-navy" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-navy">Upload label photo</div>
                  <div className="text-xs text-navy/60">We'll OCR and analyze it</div>
                </div>
              </div>
              <ChevronDown className="-rotate-90 text-navy/40 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Peer-reviewed sources", body: "EWG, PubMed, EU CosIng." },
              { icon: Leaf, title: "Reef & waterway impact", body: "Tracked per ingredient." },
              { icon: Eye, title: "Greenwash detector", body: "Claims vs. reality." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl bg-white/55 p-4 backdrop-blur ring-1 ring-navy/5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <div className="text-sm font-semibold text-navy">{title}</div>
                  <div className="text-xs text-navy/60">{body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xl font-semibold text-navy">Try a sample</h2>
              <Link href="/routine" className="text-xs font-medium text-navy/60 hover:text-navy">Build a routine →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.slice(0, 6).map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-[#EAE6BC] p-4 shadow-md transition-all hover:shadow-lg">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-navy">{p.name}</div>
                    <div className="truncate text-xs text-navy/55">{p.brand}</div>
                  </div>
                  <ScorePill value={p.scores.safety} />
                </Link>
              ))}
            </div>
          </div>
        </section>
        <footer className="border-t border-navy/10 bg-mint/40 py-6 text-center text-xs text-navy/50">
          CleanLabel · Independent · Not affiliated with any brand listed.
        </footer>
      </main>
    </div>
  );
}

function ScorePill({ value }: { value: number }) {
  const tone = value >= 8 ? "bg-green-100 text-green-800" : value >= 5 ? "bg-yellow-100 text-yellow-800" : value >= 3 ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tone)}>
      {value}<span className="text-[10px] font-medium opacity-70">/10</span>
    </span>
  );
}
