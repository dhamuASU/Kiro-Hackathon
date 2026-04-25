import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type {
  Alternative,
  AnalysisCreateResponse,
  AnalysisOut,
  ProductOut,
  ProductResolveResponse,
  ProductSearchResult,
  ProfileCreateInput,
  ProfileOut,
  UserProductOut,
} from "@/lib/types";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  const sb = getSupabaseBrowser();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const authHdrs = auth ? await authHeader() : {};
  // Only send Content-Type when we actually have a body. Sending it on GET
  // trips a CORS preflight with no benefit.
  const hasBody = Boolean(rest.body);
  const base: Record<string, string> = {};
  if (hasBody) base["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...base,
      ...authHdrs,
      ...headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const err = body as { error?: { code?: string; message?: string; details?: unknown } } | undefined;
    throw new ApiError(
      res.status,
      err?.error?.code ?? "INTERNAL_ERROR",
      err?.error?.message ?? `HTTP ${res.status}`,
      err?.error?.details,
    );
  }

  return body as T;
}

// ═══ Profile ═══════════════════════════════════════════════════════════

export const api = {
  health: () => request<{ status: string }>("/health", { auth: false }),

  getProfile: () => request<ProfileOut>("/profile"),

  createOnboardingProfile: (body: ProfileCreateInput) =>
    request<ProfileOut>("/onboarding/profile", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patchProfile: (body: Partial<ProfileCreateInput>) =>
    request<ProfileOut>("/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // ═══ Products ═══════════════════════════════════════════════════════

  searchProducts: (q: string, categorySlug?: string) => {
    const params = new URLSearchParams({ q });
    if (categorySlug) params.set("category_slug", categorySlug);
    return request<ProductSearchResult>(`/products/search?${params.toString()}`, { auth: false });
  },

  commonProducts: (categorySlug: string) =>
    request<ProductSearchResult>(
      `/products/common?category_slug=${encodeURIComponent(categorySlug)}`,
      { auth: false },
    ),

  resolveProduct: (body: { brand: string; name: string; category_slug: string }) =>
    request<ProductResolveResponse>("/products/resolve", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  pasteProduct: (body: {
    name: string;
    category_slug: string;
    brand?: string;
    ingredients_raw: string;
    ingredients_parsed?: string[];
  }) =>
    request<ProductOut>("/products/paste", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  scanBarcode: (body: { barcode: string; category_hint?: string }) =>
    request<
      | { matched: true; product: ProductOut }
      | { matched: false; barcode: string; hint: string }
    >("/scan/barcode", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  scanLabel: (body: {
    image_base64: string;
    mode: "front" | "back";
    category_hint?: string;
  }) =>
    request<{
      mode: "front" | "back";
      extracted?: { brand: string; product_name: string };
      extracted_text?: string;
      ingredients_parsed?: string[];
      confidence: number;
      matches?: {
        id: string;
        name: string;
        brand: string | null;
        category_slug: string | null;
        image_url: string | null;
        match_score: number;
      }[];
      product?: ProductOut | null;
    }>("/scan/label", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ═══ User products ═══════════════════════════════════════════════════

  listUserProducts: () =>
    request<{ user_products: UserProductOut[] }>("/user-products"),

  addUserProduct: (body: {
    category_slug: string;
    product_id?: string | null;
    custom_name?: string;
    custom_ingredients?: string;
  }) =>
    request<UserProductOut>("/user-products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  addUserProductsBatch: (
    products: {
      category_slug: string;
      product_id?: string | null;
      custom_name?: string;
      custom_ingredients?: string;
    }[],
  ) =>
    request<{ user_products: UserProductOut[] }>("/onboarding/products", {
      method: "POST",
      body: JSON.stringify({ products }),
    }),

  deleteUserProduct: (id: string) =>
    request<void>(`/user-products/${id}`, { method: "DELETE" }),

  // ═══ Analyze ═══════════════════════════════════════════════════════════

  completeOnboarding: () =>
    request<AnalysisCreateResponse>("/onboarding/complete", { method: "POST" }),

  triggerAnalysis: () =>
    request<AnalysisCreateResponse>("/analyze", { method: "POST" }),

  getAnalysis: (id: string) => request<AnalysisOut>(`/analyze/${id}`),

  analysisStreamUrl: (id: string) => `${BASE}/analyze/${id}/stream`,

  // ═══ Alternatives ═══════════════════════════════════════════════════════

  getAlternatives: (params: { category_slug: string; avoid_tags?: string[]; skin_type?: string }) => {
    const search = new URLSearchParams();
    search.set("category_slug", params.category_slug);
    params.avoid_tags?.forEach((t) => search.append("avoid_tags", t));
    if (params.skin_type) search.set("skin_type", params.skin_type);
    return request<Alternative[]>(`/alternatives?${search.toString()}`);
  },
};

export { ApiError };

/** EventSource helper that opens a Bearer-authed SSE connection for /analyze/{id}/stream. */
export async function openAnalysisStream(
  analysisId: string,
  handlers: {
    onEvent?: (event: string, data: unknown) => void;
    onError?: (err: unknown) => void;
    onDone?: () => void;
  },
): Promise<() => void> {
  const sb = getSupabaseBrowser();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;

  // EventSource in browsers doesn't support custom headers, so we use fetch+ReadableStream.
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(api.analysisStreamUrl(analysisId), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`stream failed: HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE frames: each frame is separated by \n\n
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = frame.split("\n");
          let event = "message";
          const dataLines: string[] = [];
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          const raw = dataLines.join("\n");
          let data: unknown = raw;
          try {
            data = JSON.parse(raw);
          } catch {
            // Keep raw string if not JSON
          }
          handlers.onEvent?.(event, data);
          if (event === "analysis.completed" || event === "done") {
            handlers.onDone?.();
            controller.abort();
            return;
          }
        }
      }
      handlers.onDone?.();
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        handlers.onError?.(err);
      }
    }
  })();

  return () => controller.abort();
}
