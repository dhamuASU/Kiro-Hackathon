import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--hairline)] px-8 py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="wordmark text-2xl">
              CleanLabel<span className="dot" />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">
              A chemistry friend, on call. Analogies over alarms — and receipts
              you can verify, never as the headline.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { href: "#how", label: "How it works" },
              { href: "#reports", label: "Example reports" },
              { href: "/onboarding/profile", label: "Start onboarding" },
            ]}
          />
          <FooterCol
            title="Science"
            links={[
              { href: "https://world.openbeautyfacts.org/", label: "Open Beauty Facts" },
              { href: "#faq", label: "Methodology FAQ" },
              { href: "#faq", label: "Citations" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: "/login", label: "Sign in" },
              { href: "/signup", label: "Start free" },
              { href: "#faq", label: "Privacy" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-[var(--hairline)] pt-6 text-sm text-[var(--muted)]">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]">
            Built by the CleanLabel team — {new Date().getFullYear()}
          </span>
          <span>
            Not medical advice. Independent of any brand listed.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h5 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        {title}
      </h5>
      <ul className="mt-4 grid gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-sm text-[var(--ink)] hover:text-[var(--sage)]">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
