import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  tone: "warning" | "greenwash";
  title: string;
  description: string;
  claim?: string;
  reality?: string;
}

export function AlertBanner({ tone, title, description, claim, reality }: AlertBannerProps) {
  if (tone === "greenwash") {
    return (
      <div className="animate-fade-in overflow-hidden rounded-2xl border border-orange-300/60 bg-gradient-to-br from-orange-50 to-amber-50 shadow-soft">
        <div className="flex items-center gap-2 border-b border-orange-200/60 px-4 py-2.5">
          <Sparkles className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-800">Greenwash detected</span>
        </div>
        <div className="grid gap-px bg-orange-200/60 sm:grid-cols-2">
          <div className="bg-white/70 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-700/80">Claims</div>
            <p className="mt-1 font-display text-lg text-navy">"{claim}"</p>
          </div>
          <div className="bg-white/70 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-700/80">Reality</div>
            <p className="mt-1 text-sm font-medium text-navy/80">{reality}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex animate-fade-in items-start gap-3 rounded-2xl border p-4 shadow-soft",
        "border-yellow-300/70 bg-gradient-to-br from-yellow-50 to-amber-50",
      )}
      role="alert"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yellow-200/80">
        <AlertTriangle className="h-5 w-5 text-yellow-800" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-navy">{title}</div>
        <p className="mt-0.5 text-sm text-navy/75">{description}</p>
      </div>
    </div>
  );
}
