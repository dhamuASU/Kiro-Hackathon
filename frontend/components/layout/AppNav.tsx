"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

/** Authenticated nav — shown across /dashboard, /products, /settings. */
export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/products", label: "Products" },
    { href: "/settings", label: "Settings" },
  ];

  const signOut = async () => {
    const sb = getSupabaseBrowser();
    await sb.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[rgba(251,247,241,0.88)] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-8">
        <Link href="/dashboard" className="wordmark" aria-label="CleanLabel home">
          CleanLabel<span className="dot" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm transition-colors",
                  active ? "text-[var(--teal)] font-medium" : "text-[var(--ink)] hover:text-[var(--teal)]",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-5">
          <button
            onClick={signOut}
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
