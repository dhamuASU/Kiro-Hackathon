"use client";
import Link from "next/link";

/** Consistent wrapper for every onboarding step — eyebrow, headline, sublede, slot for content, sticky footer nav. */
export function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
  backHref,
  nextLabel = "Continue",
  nextHref,
  onNext,
  nextDisabled,
  loading,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
  nextLabel?: string;
  nextHref?: string;
  onNext?: () => void | Promise<void>;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div>
      <div className="eyebrow-mono mb-5">{eyebrow}</div>
      <h1 className="mb-5 text-[clamp(36px,5vw,54px)]">{title}</h1>
      {subtitle ? (
        <p className="mb-12 max-w-[52ch] text-[17px] leading-[1.55] text-[var(--muted)]">
          {subtitle}
        </p>
      ) : null}

      <div className="mb-14">{children}</div>

      <div className="sticky bottom-6 flex flex-wrap items-center justify-between gap-4">
        {backHref ? (
          <Link href={backHref} className="btn-ghost">
            ← Back
          </Link>
        ) : (
          <span />
        )}
        {nextHref ? (
          <Link
            href={nextDisabled ? "#" : nextHref}
            aria-disabled={nextDisabled}
            className={"btn btn-lg " + (nextDisabled ? "pointer-events-none opacity-45" : "")}
          >
            {nextLabel} <span className="arrow">→</span>
          </Link>
        ) : (
          <button
            onClick={() => onNext?.()}
            disabled={nextDisabled || loading}
            className="btn btn-lg"
          >
            {loading ? "Saving…" : (<>{nextLabel} <span className="arrow">→</span></>)}
          </button>
        )}
      </div>
    </div>
  );
}
