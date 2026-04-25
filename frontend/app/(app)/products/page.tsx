"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { ProductPicker } from "@/components/onboarding/ProductPicker";
import { useOnboarding } from "@/store/onboarding";
import type { UserProductOut } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  shampoo: "Shampoo",
  conditioner: "Conditioner",
  body_wash: "Body wash",
  face_cleanser: "Face cleanser",
  moisturizer: "Moisturizer",
  sunscreen: "Sunscreen",
  deodorant: "Deodorant",
  toothpaste: "Toothpaste",
  lip_balm: "Lip balm",
  makeup_foundation: "Foundation",
  serum: "Serum",
  eye_cream: "Eye cream",
};

export default function ProductsPage() {
  const { products: pending, clearProducts } = useOnboarding();
  const [items, setItems] = useState<UserProductOut[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const r = await api.listUserProducts();
      setItems(r ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load products");
      setItems([]);
    }
  };

  const persistPending = async () => {
    if (pending.length === 0) return;
    setSaving(true);
    try {
      await api.addUserProductsBatch(
        pending.map((p) => ({
          category_slug: p.category_slug,
          product_id: p.product_id ?? null,
          custom_name: p.custom_name,
          custom_ingredients: p.custom_ingredients,
        })),
      );
      clearProducts();
      toast.success(`Added ${pending.length} product${pending.length === 1 ? "" : "s"}`);
      await load();
      setPicking(false);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unknown";
      toast.error(`Couldn't save — ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteUserProduct(id);
      setItems((prev) => prev?.filter((p) => p.id !== id) ?? []);
      toast.success("Removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove");
    }
  };

  // Group by category
  const grouped: Record<string, UserProductOut[]> = {};
  (items ?? []).forEach((up) => {
    const k = up.category_slug ?? "other";
    grouped[k] ??= [];
    grouped[k].push(up);
  });

  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[var(--hairline)] pb-10">
        <div>
          <div className="eyebrow-mono mb-4">Your products</div>
          <h1 className="text-[clamp(36px,5vw,52px)]">
            Everything in{" "}
            <span className="italic text-[var(--teal)]">your bathroom.</span>
          </h1>
          <p className="mt-3 max-w-[52ch] text-[var(--muted)]">
            Add products as you buy them. Every time you re-run the agents, the
            report updates — and the swap suggestions respect your current goals.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn-ghost">
            Back to dashboard
          </Link>
          <button
            onClick={() => setPicking((v) => !v)}
            className="btn"
          >
            {picking ? "Done picking" : "Add products"} <span className="arrow">→</span>
          </button>
        </div>
      </header>

      {picking && (
        <div className="mb-12 rounded-sm border border-[var(--hairline)] bg-[var(--paper)] p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Add to your routine
              </div>
              <h2 className="mt-1 text-[24px]">
                Queue new products and save in one batch.
              </h2>
            </div>
            {pending.length > 0 && (
              <button
                onClick={persistPending}
                disabled={saving}
                className="btn"
              >
                {saving ? "Saving…" : `Save ${pending.length}`} <span className="arrow">→</span>
              </button>
            )}
          </div>
          <ProductPicker />
        </div>
      )}

      {items === null ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="paper-card p-10 text-center">
          <div className="eyebrow-mono mb-5 justify-center">Nothing here yet</div>
          <h3 className="mx-auto mb-3 max-w-[22ch]">
            Your routine is empty. Let&rsquo;s fix that.
          </h3>
          <p className="mx-auto mb-7 max-w-[42ch] text-[var(--muted)]">
            Add the products you actually use. The coach can&rsquo;t help with
            products it doesn&rsquo;t know about.
          </p>
          <button onClick={() => setPicking(true)} className="btn">
            Add your first product <span className="arrow">→</span>
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([slug, list]) => (
            <section key={slug}>
              <h2 className="mb-4 font-serif text-[28px]">
                {CATEGORY_LABELS[slug] ?? slug.replace(/_/g, " ")}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((up) => (
                  <UserProductCard key={up.id} item={up} onDelete={remove} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function UserProductCard({
  item,
  onDelete,
}: {
  item: UserProductOut;
  onDelete: (id: string) => void;
}) {
  const name =
    item.product?.name ??
    item.custom_name ??
    "Custom product";
  const brand = item.product?.brand ?? (item.custom_name ? "Pasted" : "—");
  const ingredientsCount = item.product?.ingredients_parsed?.length ?? 0;

  return (
    <article className="paper-card flex items-start justify-between gap-5 p-5">
      <div className="min-w-0">
        <div className="truncate text-[16px] font-medium text-[var(--ink)]">{name}</div>
        <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
          {brand}
          {ingredientsCount ? ` · ${ingredientsCount} ingredients` : ""}
        </div>
        {item.custom_ingredients && (
          <p className={cn("mt-2 truncate font-mono text-[11px] text-[var(--muted)]")}>
            {item.custom_ingredients}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)] hover:text-[var(--terra)]"
      >
        Remove
      </button>
    </article>
  );
}
