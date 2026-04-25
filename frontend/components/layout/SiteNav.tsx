"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Public sticky nav — blurs when scrolled. Matches template CleanLabel.html.
 */
export function SiteNav({
  mode = "marketing",
}: {
  mode?: "marketing" | "auth";
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--hairline)] bg-[rgba(251,247,241,0.88)] backdrop-blur-md backdrop-saturate-150"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-8">
        <Link href="/" className="wordmark" aria-label="CleanLabel home">
          CleanLabel<span className="dot" />
        </Link>

        {mode === "marketing" ? (
          <>
            <nav className="hidden gap-9 md:flex" aria-label="Primary">
              <a className="nav-underline relative text-sm" href="#how">
                How it works
              </a>
              <a className="nav-underline relative text-sm" href="#reports">
                Example reports
              </a>
              <a className="nav-underline relative text-sm" href="#faq">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-5">
              <Link href="/login" className="text-sm">
                Sign in
              </Link>
              <Link href="/signup" className="btn">
                Start free <span className="arrow">→</span>
              </Link>
            </div>
          </>
        ) : (
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
            ← Back to home
          </Link>
        )}
      </div>
      <style jsx>{`
        .nav-underline::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          height: 1px;
          width: 100%;
          background: var(--ink);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 250ms var(--ease);
        }
        .nav-underline:hover::after {
          transform: scaleX(1);
        }
      `}</style>
    </header>
  );
}
