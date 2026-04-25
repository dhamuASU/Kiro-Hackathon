"use client";
import { usePathname } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";

/**
 * Layout for the authenticated app group.
 * - /onboarding/* has its own layout (with progress bar instead of the nav).
 * - Everything else renders the standard AppNav.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inOnboarding = pathname.startsWith("/onboarding");

  if (inOnboarding) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <AppNav />
      <div>{children}</div>
    </div>
  );
}
