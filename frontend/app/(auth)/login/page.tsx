"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { SiteNav } from "@/components/layout/SiteNav";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav mode="auth" />
      <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1100px] grid-cols-1 items-center gap-16 px-8 pb-16 pt-28 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="eyebrow-mono mb-6">Sign in</div>
          <h1
            className="mb-6"
            style={{ fontSize: "clamp(34px, 4.2vw, 52px)", lineHeight: 1.05 }}
          >
            Welcome back.{" "}
            <span className="block italic text-[var(--teal)]">
              Your chemistry coach is ready.
            </span>
          </h1>
          <p className="max-w-[46ch] text-[15px] text-[var(--muted)]">
            Sign in with the email and password you set up. We&rsquo;ll drop you
            straight into your dashboard.
          </p>
        </div>

        <div className="paper-card p-9">
          <h3 className="mb-5 text-[24px]">Sign in to CleanLabel</h3>
          <form onSubmit={submit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3.5 text-[16px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3.5 text-[16px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn btn-lg w-full justify-center"
          >
            {loading ? "Signing in…" : (<>Sign in <span className="arrow">→</span></>)}
          </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[var(--muted)]">
            New here?{" "}
            <Link href="/signup" className="text-link">
              Create an account <span className="arrow">→</span>
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
