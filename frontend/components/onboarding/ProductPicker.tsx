"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useOnboarding } from "@/store/onboarding";
import type { ProductOut } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "./BarcodeScanner";

interface CategoryDef {
  slug: string;
  label: string;
  emoji: string;
  required?: boolean;
}

const CATEGORIES: CategoryDef[] = [
  { slug: "shampoo", label: "Shampoo", emoji: "🧴", required: true },
  { slug: "conditioner", label: "Conditioner", emoji: "🧴" },
  { slug: "body_wash", label: "Body wash", emoji: "🫧" },
  { slug: "face_cleanser", label: "Face cleanser", emoji: "🌊", required: true },
  { slug: "moisturizer", label: "Moisturizer", emoji: "🧈", required: true },
  { slug: "sunscreen", label: "Sunscreen", emoji: "☀️", required: true },
  { slug: "deodorant", label: "Deodorant", emoji: "🌿" },
  { slug: "toothpaste", label: "Toothpaste", emoji: "🪥" },
  { slug: "serum", label: "Serum", emoji: "💧" },
];

export function ProductPicker() {
  const [active, setActive] = useState<CategoryDef | null>(null);
  const { products, removeProduct } = useOnboarding();

  return (
    <div>
      <div className="grid gap-3">
        {CATEGORIES.map((cat) => {
          const picked = products.filter((p) => p.category_slug === cat.slug);
          return (
            <div key={cat.slug} className="paper-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">{cat.emoji}</span>
                  <div>
                    <div className="text-[15px] font-medium text-[var(--ink)]">
                      {cat.label}
                      {cat.required && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--sage)]">
                          Suggested
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
                      {picked.length === 0 ? "not yet added" : `${picked.length} added`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(cat)}
                  className="btn-ghost"
                >
                  {picked.length === 0 ? "Add" : "Add another"}
                </button>
              </div>

              {picked.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-dashed border-[var(--hairline)] pt-4">
                  {picked.map((p) => {
                    const globalIdx = products.indexOf(p);
                    return (
                      <li
                        key={globalIdx}
                        className="flex items-center justify-between gap-4 text-[14px]"
                      >
                        <span className="truncate text-[var(--ink)]">
                          {p.display_name ?? p.custom_name ?? "(custom product)"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProduct(globalIdx)}
                          className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)] hover:text-[var(--terra)]"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {active ? (
        <PickerModal category={active} onClose={() => setActive(null)} />
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════

type PickMode = "common" | "search" | "barcode" | "photo" | "paste";

function PickerModal({
  category,
  onClose,
}: {
  category: CategoryDef;
  onClose: () => void;
}) {
  const { addProduct } = useOnboarding();
  const [mode, setMode] = useState<PickMode>("common");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductOut[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [common, setCommon] = useState<ProductOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [commonError, setCommonError] = useState<string | null>(null);

  // Load common products on open
  useEffect(() => {
    setLoading(true);
    setCommonError(null);
    api
      .commonProducts(category.slug)
      .then((r) => setCommon(r.results))
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Couldn't reach the backend — is it running on :8000?";
        console.error("commonProducts failed:", err);
        setCommonError(msg);
        setCommon([]);
      })
      .finally(() => setLoading(false));
  }, [category.slug]);

  // Debounced search — shows loading/error states so silent failures aren't
  // indistinguishable from "no matches".
  useEffect(() => {
    if (mode !== "search" || query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    const t = setTimeout(async () => {
      try {
        const r = await api.searchProducts(query.trim(), category.slug);
        if (!cancelled) setSearchResults(r.results);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Network error — is the backend running?";
        console.error("searchProducts failed:", err);
        setSearchError(msg);
        setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, mode, category.slug]);

  const attach = (p: ProductOut) => {
    addProduct({
      category_slug: category.slug,
      product_id: p.id,
      display_name: `${p.brand ? p.brand + " · " : ""}${p.name}`,
    });
    toast.success(`Added ${p.name}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(31,36,33,0.55)] backdrop-blur-sm md:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card relative m-0 flex w-full max-w-[680px] flex-col overflow-hidden rounded-t-lg md:m-8 md:max-h-[86vh] md:rounded-sm">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-7 py-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
              Add {category.label.toLowerCase()}
            </div>
            <h3 className="mt-1 text-[22px]">{category.emoji} {category.label}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[22px] text-[var(--muted)] hover:text-[var(--ink)]">
            ×
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex overflow-x-auto border-b border-[var(--hairline)] px-7">
          {(
            [
              { id: "common", label: "Popular" },
              { id: "search", label: "Search" },
              { id: "barcode", label: "Barcode" },
              { id: "photo", label: "Photo" },
              { id: "paste", label: "Paste" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={cn(
                "relative shrink-0 border-b-2 py-4 pr-6 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
                mode === t.id
                  ? "border-[var(--terra)] text-[var(--ink)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {mode === "common" && (
            <PopularList
              loading={loading}
              common={common}
              error={commonError}
              onPick={attach}
              onSearch={() => setMode("search")}
            />
          )}

          {mode === "search" && (
            <SearchPanel
              query={query}
              setQuery={setQuery}
              results={searchResults}
              searching={searching}
              error={searchError}
              onPick={attach}
            />
          )}

          {mode === "barcode" && (
            <BarcodePanel categorySlug={category.slug} onPick={attach} />
          )}

          {mode === "photo" && (
            <PhotoPanel categorySlug={category.slug} onPick={attach} />
          )}

          {mode === "paste" && (
            <PastePanel category={category} onPick={attach} />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-panels
// ═══════════════════════════════════════════════════════════════════════

function PopularList({
  loading,
  common,
  error,
  onPick,
  onSearch,
}: {
  loading: boolean;
  common: ProductOut[];
  error: string | null;
  onPick: (p: ProductOut) => void;
  onSearch: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-sm border border-[var(--terra)] bg-[#F4E5DD] p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--terra-deep)]">
          Couldn&rsquo;t load popular products
        </div>
        <p className="mt-2 text-[13px] text-[var(--ink)]">{error}</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
          Most common cause: the backend isn&rsquo;t running on port 8000.
          Run{" "}
          <code className="rounded bg-[var(--paper)] px-1.5 py-0.5 text-[var(--ink)]">
            cd api && uvicorn main:app --reload
          </code>
          .
        </p>
      </div>
    );
  }
  if (common.length === 0) {
    return (
      <p className="text-[15px] text-[var(--muted)]">
        No seeded products for this category. Try{" "}
        <button className="text-link" onClick={onSearch}>
          Search <span className="arrow">→</span>
        </button>
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {common.map((p) => (
        <ProductRow key={p.id} product={p} onPick={onPick} />
      ))}
    </ul>
  );
}

function SearchPanel({
  query,
  setQuery,
  results,
  searching,
  error,
  onPick,
}: {
  query: string;
  setQuery: (s: string) => void;
  results: ProductOut[];
  searching: boolean;
  error: string | null;
  onPick: (p: ProductOut) => void;
}) {
  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search brand + product name (e.g. Head & Shoulders, Nioxin, Colgate)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        className="w-full rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3 text-[15px] outline-none focus:border-[var(--ink)]"
      />

      {query.trim().length < 2 ? (
        <p className="text-[14px] text-[var(--muted)]">Keep typing…</p>
      ) : searching ? (
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Searching local cache → Open Beauty Facts…
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-sm border border-[var(--terra)] bg-[#F4E5DD] p-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--terra-deep)]">
            Search failed
          </div>
          <p className="mt-2 text-[13px] text-[var(--ink)]">{error}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
            If the backend isn&rsquo;t running, start it with{" "}
            <code className="rounded bg-[var(--paper)] px-1.5 py-0.5 text-[var(--ink)]">
              cd api && uvicorn main:app --reload
            </code>
            .
          </p>
        </div>
      ) : results.length === 0 ? (
        <p className="text-[14px] text-[var(--muted)]">
          No matches in local cache or Open Beauty Facts. Try the Barcode or
          Photo tab, or paste the ingredient list.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((p) => (
            <ProductRow key={p.id} product={p} onPick={onPick} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BarcodePanel({
  categorySlug,
  onPick,
}: {
  categorySlug: string;
  onPick: (p: ProductOut) => void;
}) {
  const [mode, setMode] = useState<"choose" | "camera" | "manual">("choose");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const lookup = async (code: string) => {
    setLoading(true);
    setHint(null);
    try {
      const res = await api.scanBarcode({
        barcode: code,
        category_hint: categorySlug,
      });
      if (res.matched) {
        onPick(res.product);
      } else {
        setHint(res.hint);
        setBarcode(code);
        setMode("manual");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lookup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onDetected = (code: string) => {
    toast.success(`Detected barcode: ${code}`);
    lookup(code);
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6,14}$/.test(barcode.trim())) {
      toast.error("Enter 6–14 digits (UPC / EAN).");
      return;
    }
    await lookup(barcode.trim());
  };

  return (
    <div className="space-y-5">
      <div className="rounded-sm bg-[var(--paper)] p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Scan the barcode
        </div>
        <p className="mt-1 font-serif italic text-[17px] text-[var(--teal)]">
          We look it up in Open Beauty Facts — the community ingredient
          database. Point your phone camera at the bar, and we&rsquo;ll do the
          rest.
        </p>
      </div>

      {mode === "choose" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("camera")}
            className="paper-card paper-card-interactive flex flex-col items-center gap-3 px-4 py-8 text-center"
          >
            <span className="text-[34px]">📷</span>
            <span className="text-[15px] font-medium text-[var(--ink)]">
              Use camera
            </span>
            <span className="max-w-[22ch] font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
              Live scan via ZXing. Works on phone + laptop.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="paper-card paper-card-interactive flex flex-col items-center gap-3 px-4 py-8 text-center"
          >
            <span className="text-[34px]">⌨️</span>
            <span className="text-[15px] font-medium text-[var(--ink)]">
              Type it in
            </span>
            <span className="max-w-[22ch] font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
              6–14 digits. Useful when the camera can&rsquo;t focus.
            </span>
          </button>
        </div>
      )}

      {mode === "camera" && (
        <BarcodeScanner
          onDetected={onDetected}
          onCancel={() => setMode("choose")}
        />
      )}

      {mode === "manual" && (
        <>
          <form onSubmit={submitManual} className="space-y-3">
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))}
              placeholder="3337875597210"
              autoFocus
              className="w-full rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-4 font-mono text-[18px] outline-none focus:border-[var(--ink)]"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="btn-ghost"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn flex-1 justify-center"
              >
                {loading ? "Looking up…" : (<>Find this product <span className="arrow">→</span></>)}
              </button>
            </div>
          </form>

          {hint && (
            <div className="rounded-sm border border-[var(--hairline)] bg-[var(--mist-soft)] p-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--teal)]">
                Not in Open Beauty Facts
              </div>
              <p className="mt-2 text-[14px] text-[var(--ink)]">{hint}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                Switch to the Photo or Paste tab instead.
              </p>
            </div>
          )}
        </>
      )}

      <p className="font-mono text-[11px] leading-[1.7] text-[var(--muted)]">
        OBF is crowd-maintained; coverage varies. Sample barcode that works:
        <span className="ml-1 font-mono text-[var(--ink)]">3337875597210</span>{" "}
        (CeraVe Moisturising Lotion).
      </p>
    </div>
  );
}

function PhotoPanel({
  categorySlug,
  onPick,
}: {
  categorySlug: string;
  onPick: (p: ProductOut) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "uploading" | "confirm" | "error">("idle");
  const [mode, setMode] = useState<"back" | "front">("back");
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [parsedName, setParsedName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result is "data:image/jpeg;base64,…"; strip the prefix.
        const base64 = result.split(",")[1] ?? result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Couldn't read image"));
      reader.readAsDataURL(file);
    });

  const upload = async (file: File) => {
    setPhase("uploading");
    setErr(null);
    try {
      // Show a preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const image_base64 = await readFile(file);
      const res = await api.scanLabel({
        image_base64,
        mode,
        category_hint: categorySlug,
      });

      if (mode === "back") {
        if (res.product) {
          // Auto-persisted backend-side — add straight in.
          onPick(res.product);
        } else {
          // Low confidence — show extracted text for confirmation
          setText(res.extracted_text ?? "");
          setParsedName("");
          setPhase("confirm");
        }
      } else {
        // front: show matches; pick first if strong
        const top = res.matches?.[0];
        if (top && top.match_score > 0.85 && top.id) {
          onPick({
            id: top.id,
            off_id: null,
            name: top.name,
            brand: top.brand,
            category_slug: top.category_slug,
            ingredients_raw: null,
            ingredients_parsed: [],
            image_url: top.image_url,
            source: "open_beauty_facts",
            popularity: 0,
          });
        } else {
          setErr(
            top
              ? `Best match: ${top.brand ?? ""} ${top.name} (confidence ${Math.round(
                  (top.match_score ?? 0) * 100,
                )}%). Try again with a clearer photo or use the Back mode.`
              : "Couldn't match this product. Try the Back mode and capture the ingredient list instead.",
          );
          setPhase("error");
        }
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Upload failed";
      setErr(msg);
      setPhase("error");
    }
  };

  const savePasted = async () => {
    if (text.trim().length < 5) {
      toast.error("Nothing to save — add some ingredients or retake the photo.");
      return;
    }
    try {
      const product = await api.pasteProduct({
        name: parsedName.trim() || "Scanned product",
        category_slug: categorySlug,
        ingredients_raw: text.trim(),
      });
      onPick(product);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-sm bg-[var(--paper)] p-4">
        <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Scan the label
        </div>
        <p className="mt-1 font-serif italic text-[17px] text-[var(--teal)]">
          Snap a photo of the back of the bottle — we read the ingredient list for you.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("back")}
          className={cn(
            "flex-1 rounded-sm border px-4 py-3 text-left transition-all",
            mode === "back"
              ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
              : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]",
          )}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.08em]">
            Recommended
          </div>
          <div className="mt-1 text-[15px] font-medium">Back of bottle</div>
          <div className={cn("mt-0.5 text-[12px]", mode === "back" ? "text-[var(--bg)]/70" : "text-[var(--muted)]")}>
            Extract ingredients directly
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("front")}
          className={cn(
            "flex-1 rounded-sm border px-4 py-3 text-left transition-all",
            mode === "front"
              ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
              : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]",
          )}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.08em]">
            Alt
          </div>
          <div className="mt-1 text-[15px] font-medium">Front of bottle</div>
          <div className={cn("mt-0.5 text-[12px]", mode === "front" ? "text-[var(--bg)]/70" : "text-[var(--muted)]")}>
            Extract brand + name
          </div>
        </button>
      </div>

      {phase === "idle" && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="block w-full rounded-sm border-2 border-dashed border-[var(--hairline)] bg-[var(--surface)] p-10 text-center transition-colors hover:border-[var(--ink)]"
          >
            <div className="text-[32px]">📸</div>
            <div className="mt-3 font-serif text-[20px] italic text-[var(--teal)]">
              Tap to take a photo (or upload one)
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
              JPEG, PNG or HEIC · up to ~10 MB
            </div>
          </button>
          <p className="font-mono text-[11px] leading-[1.7] text-[var(--muted)]">
            Vision OCR is done by our backend — images aren&rsquo;t stored unless you
            save the product.
          </p>
        </>
      )}

      {phase === "uploading" && (
        <div className="rounded-sm border border-[var(--hairline)] bg-[var(--surface)] p-8 text-center">
          {preview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt=""
              className="mx-auto mb-4 max-h-56 rounded-sm object-contain"
            />
          )}
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Reading the label
          </div>
          <p className="mt-2 font-serif italic text-[18px] text-[var(--teal)]">
            Vision model is working — usually 3-6 seconds.
          </p>
        </div>
      )}

      {phase === "confirm" && (
        <div className="space-y-4">
          <div className="rounded-sm border border-[var(--mist)] bg-[var(--mist-soft)] p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--teal)]">
              Low confidence — confirm before saving
            </div>
            <p className="mt-2 text-[14px] text-[var(--ink)]">
              We couldn&rsquo;t fully confirm the ingredient list. Check what we
              extracted and edit anything that looks wrong before saving.
            </p>
          </div>
          <input
            value={parsedName}
            onChange={(e) => setParsedName(e.target.value)}
            placeholder="Name this product (optional)"
            className="w-full rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3 text-[15px] outline-none focus:border-[var(--ink)]"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            className="w-full resize-none rounded-sm border border-[var(--hairline)] bg-[var(--bg)] p-4 font-mono text-[13px] outline-none focus:border-[var(--ink)]"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setPhase("idle");
                setText("");
                setParsedName("");
                setPreview(null);
              }}
              className="btn-ghost"
            >
              Retake
            </button>
            <button type="button" onClick={savePasted} className="btn flex-1 justify-center">
              Save product <span className="arrow">→</span>
            </button>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="space-y-4">
          <div className="rounded-sm border border-[var(--terra)] bg-[#F4E5DD] p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--terra-deep)]">
              OCR failed
            </div>
            <p className="mt-2 text-[14px] text-[var(--ink)]">
              {err ?? "The vision model couldn't read this image."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPhase("idle");
              setErr(null);
              setPreview(null);
            }}
            className="btn-ghost w-full justify-center"
          >
            Try another photo
          </button>
        </div>
      )}
    </div>
  );
}

function PastePanel({
  category,
  onPick,
}: {
  category: CategoryDef;
  onPick: (p: ProductOut) => void;
}) {
  const [name, setName] = useState("");
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (raw.trim().length < 5) {
      toast.error("Paste a few ingredients (comma-separated).");
      return;
    }
    setLoading(true);
    try {
      const product = await api.pasteProduct({
        name: name.trim() || `My ${category.label.toLowerCase()}`,
        category_slug: category.slug,
        ingredients_raw: raw.trim(),
      });
      onPick(product);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-sm bg-[var(--paper)] p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Type it in
        </div>
        <p className="mt-1 font-serif italic text-[17px] text-[var(--teal)]">
          Nothing on Open Beauty Facts? Flip the bottle and copy the ingredient list.
        </p>
      </div>
      <div>
        <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Product name (optional)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g. My ${category.label.toLowerCase()}`}
          className="mt-2 w-full rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3 text-[15px] outline-none focus:border-[var(--ink)]"
        />
      </div>
      <div>
        <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Ingredient list
        </label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={7}
          placeholder="Aqua, Sodium Lauryl Sulfate, Cocamidopropyl Betaine, Glycerin, Parfum…"
          className="mt-2 w-full resize-none rounded-sm border border-[var(--hairline)] bg-[var(--bg)] p-4 font-mono text-[13px] outline-none focus:border-[var(--ink)]"
        />
      </div>
      <button type="button" onClick={save} disabled={loading} className="btn w-full justify-center">
        {loading ? "Saving…" : (<>Save product <span className="arrow">→</span></>)}
      </button>
    </div>
  );
}

function ProductRow({ product, onPick }: { product: ProductOut; onPick: (p: ProductOut) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(product)}
        className="flex w-full items-center justify-between gap-4 rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3 text-left transition-colors hover:border-[var(--ink)]"
      >
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-[var(--ink)]">
            {product.name}
          </div>
          <div className="truncate font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
            {product.brand ?? "—"}
          </div>
        </div>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--sage)]">
          Add →
        </span>
      </button>
    </li>
  );
}
