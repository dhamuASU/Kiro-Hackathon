"use client";
import { useState } from "react";
import { Leaf } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Dynamically import supabase to avoid SSR issues
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#28396C] text-white">
            <Leaf className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold text-[#28396C]">DermaDecode</h1>
          <p className="text-center text-sm text-gray-500">Your personal skincare coach</p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-[#F0FFC2] p-6 text-center">
            <p className="font-semibold text-[#28396C]">Check your email ✉️</p>
            <p className="mt-2 text-sm text-gray-600">We sent a magic link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#28396C]">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-[#EAE6BC]/40 px-4 py-3 text-sm outline-none focus:border-[#28396C] focus:ring-2 focus:ring-[#28396C]/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#28396C] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
