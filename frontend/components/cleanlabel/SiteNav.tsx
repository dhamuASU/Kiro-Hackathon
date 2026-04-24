"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, FlaskConical, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Search", icon: FlaskConical },
  { to: "/routine", label: "Routine", icon: Layers },
];

export function SiteNav() {
  const pathname = usePathname();
  const transparent = pathname === "/";

  return (
    <header className={cn("sticky top-0 z-30 w-full border-b transition-colors",
      transparent ? "border-transparent bg-mint/60 backdrop-blur" : "border-navy/10 bg-mint/85 backdrop-blur")}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white shadow-soft transition-transform group-hover:-rotate-6">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-navy">CleanLabel</span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-cream/70 p-1 shadow-soft">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} href={to}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                pathname === to ? "bg-navy text-white shadow-soft" : "text-navy/70 hover:text-navy")}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
