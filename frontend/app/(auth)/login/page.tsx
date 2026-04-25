"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav mode="auth" />
      <main className="mx-auto flex min-h-[calc(100vh-68px)] max-w-md flex-col justify-center px-8 pt-32 pb-16">
        <div className="eyebrow-mono mb-6">Sign in</div>
        <h1 className="mb-6 text-[clamp(40px,5vw,56px)]">
          Welcome back. <span className="block italic text-[var(--teal)]">Your chemistry coach is ready.</span>
        </h1>
        <p className="mb-10 text-[17px] text-[var(--muted)]">
          We&rsquo;ll email you a one-tap magic link — no passwords to remember, no phishing surface.
        </p>

        {sent ? (
          <div className="paper-card p-7">
            <div className="eyebrow-mono mb-4" style={{ color: "var(--sage)" }}>
              Check your email
            </div>
            <p className="font-serif text-[22px] italic leading-[1.35] text-[var(--teal)]">
              We sent a magic link to <strong className="not-italic text-[var(--ink)]">{email}</strong>.
            </p>
            <p className="mt-4 text-[14px] text-[var(--muted)]">
              Click the link on this device. It&rsquo;s good for 1 hour. No email? Check spam, then try a different address.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
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
            <button type="submit" disabled={loading || !email} className="btn btn-lg w-full justify-center">
              {loading ? "Sending…" : (<>Send magic link <span className="arrow">→</span></>)}
            </button>
          </form>
        )}

        <p className="mt-10 text-[14px] text-[var(--muted)]">
          New here?{" "}
          <Link href="/signup" className="text-link">
            Start free <span className="arrow">→</span>
          </Link>
        </p>
      </main>
    </div>
  );
}
