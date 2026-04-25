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
      <main className="mx-auto flex min-h-[calc(100vh-68px)] max-w-md flex-col justify-center px-8 pb-16 pt-32">
        <div className="eyebrow-mono mb-6">Sign in</div>
        <h1 className="mb-6 text-[clamp(40px,5vw,56px)]">
          Welcome back.{" "}
          <span className="block italic text-[var(--teal)]">
            Your chemistry coach is ready.
          </span>
        </h1>
        <p className="mb-10 text-[17px] text-[var(--muted)]">
          Sign in with the email and password you set up. We&rsquo;ll drop you straight into your dashboard.
        </p>

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

        <p className="mt-10 text-[14px] text-[var(--muted)]">
          New here?{" "}
          <Link href="/signup" className="text-link">
            Create an account <span className="arrow">→</span>
          </Link>
        </p>
      </main>
    </div>
  );
}
