"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { SiteNav } from "@/components/layout/SiteNav";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sb = getSupabaseBrowser();
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error;

      // If "Confirm email" is OFF in Supabase, signUp returns an active session
      // — no SMTP involved. We then drop the user straight into onboarding.
      if (data.session) {
        router.replace("/onboarding/profile");
        return;
      }

      // If "Confirm email" is ON, signUp returns a user but no session.
      // Try to sign in immediately — works once the user confirms via email.
      const { error: signInError } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        toast.message(
          "Account created. If your project requires email confirmation, check your inbox.",
        );
        return;
      }
      router.replace("/onboarding/profile");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav mode="auth" />
      <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1100px] grid-cols-1 items-center gap-16 px-8 pb-16 pt-32 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="eyebrow-mono mb-6">Start free</div>
          <h1 className="mb-6">
            Three minutes in.{" "}
            <span className="block italic text-[var(--teal)]">
              A chemistry friend for life.
            </span>
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
            <div>
              <label
                htmlFor="password"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]"
              >
                Password{" "}
                <span className="ml-1 normal-case tracking-normal text-[var(--muted)]">
                  (6+ characters)
                </span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-sm border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3.5 text-[16px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || password.length < 6}
              className="btn btn-lg w-full justify-center"
            >
              {loading ? "Creating account…" : (<>Create account <span className="arrow">→</span></>)}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-link">
              Sign in <span className="arrow">→</span>
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
