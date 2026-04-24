"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, Layers, Leaf } from "lucide-react";

const NAV = [
  { href: "/", label: "Search", icon: FlaskConical },
  { href: "/routine", label: "Routine", icon: Layers },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="page-bg">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--glass-border)", background: "rgba(250,249,246,0.85)" }}>
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-white transition-transform group-hover:-rotate-6"
            style={{ background: "var(--navy)", boxShadow: "var(--shadow-soft)" }}>
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-semibold" style={{ color: "var(--navy)" }}>DermaDecode</span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full p-1"
          style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--shadow-soft)", border: "1px solid var(--glass-border)" }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: active ? "var(--navy)" : "transparent", color: active ? "white" : "rgba(40,57,108,0.6)" }}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="py-6 text-center text-xs"
        style={{ borderTop: "1px solid var(--glass-border)", color: "rgba(40,57,108,0.35)" }}>
        DermaDecode · Independent · Not affiliated with any brand listed.
      </footer>
    </div>
  );
}
