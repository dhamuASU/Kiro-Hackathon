"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { slug: "profile", label: "Profile" },
  { slug: "goals", label: "Goals" },
  { slug: "allergies", label: "Allergies" },
  { slug: "products", label: "Products" },
  { slug: "analyzing", label: "Analyze" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentSlug = pathname.split("/").pop() ?? "profile";
  const currentIdx = Math.max(0, STEPS.findIndex((s) => s.slug === currentSlug));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[rgba(251,247,241,0.92)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-8">
          <Link href="/" className="wordmark" aria-label="CleanLabel home">
            CleanLabel<span className="dot" />
          </Link>
          <div className="hidden md:flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
            <span>
              Step {currentIdx + 1} of {STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-[var(--muted)] md:inline">
              {STEPS[currentIdx]?.label}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative h-[3px] w-full bg-[var(--hairline)]">
          <div
            className="absolute left-0 top-0 h-full bg-[var(--terra)] transition-[width] duration-500"
            style={{
              width: `${((currentIdx + 1) / STEPS.length) * 100}%`,
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-8 pb-24 pt-16">
        {children}
      </main>
    </div>
  );
}
