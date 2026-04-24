"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    // After magic link click, Supabase sets session in localStorage
    // Redirect to onboarding
    setTimeout(() => router.push("/onboarding"), 1000);
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">Signing you in…</p>
    </div>
  );
}
