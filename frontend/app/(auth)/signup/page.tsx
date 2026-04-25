"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { SiteNav } from "@/components/layout/SiteNav";

export const dynamic = "force-dynamic";

export default function SignupPage() {
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
          // New users are created automatically on first magic-link click.
          // Route them to /onboarding on return.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/profile`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav mode="auth" />
      <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1100px] grid-cols-1 items-center gap-16 px-8 pt-32 pb-16 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="eyebrow-mono mb-6">Start free</div>
          <h1 className="mb-6">
            Three minutes in.{" "}
            <span className="block italic text-[var(--teal)]">A chemistry friend for life.</span>
          </h1>
          <p className="mb-8 max-w-[46ch] text-[17px] text-[var(--muted)]">
            Give us an email, tell us about your skin, point at what&rsquo;s in your bathroom.
            We&rsquo;ll do the rest — and we won&rsquo;t sell anything to get there.
          </p>

          <ul className="space-y-3 text-[15px] text-[var(--ink)]">
            {[
              "Personalized analogies, not scare tactics",
              "EU / California / Canada regulatory receipts",
              "Safer product swaps matched to your skin goals",
              "No credit card. No data sold. Delete anytime.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--sage)" }}
                />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="paper-card p-9">
          {sent ? (
            <>
              <div className="eyebrow-mono mb-5" style={{ color: "var(--sage)" }}>
                Check your email
              </div>
              <p className="mb-4 font-serif text-[24px] italic leading-[1.35] text-[var(--teal)]">
                A magic link is on the way to{" "}
                <strong className="not-italic text-[var(--ink)]">{email}</strong>.
              </p>
              <p className="text-[14px] text-[var(--muted)]">
                Click it on this device. It lands you right in onboarding — takes about three
                minutes.
              </p>
            </>
          ) : (
            <>
              <h3 className="mb-5 text-[24px]">Create your account</h3>
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
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn btn-lg w-full justify-center"
                >
                  {loading ? "Sending…" : (<>Send magic link <span className="arrow">→</span></>)}
                </button>
              </form>

              <p className="mt-6 text-center text-[13px] text-[var(--muted)]">
                Already have an account?{" "}
                <Link href="/login" className="text-link">
                  Sign in <span className="arrow">→</span>
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
