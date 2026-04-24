import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SafetyAlertModalProps {
  open: boolean;
  productName: string;
  onAcknowledge: () => void;
}

export function SafetyAlertModal({ open, productName, onAcknowledge }: SafetyAlertModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/85 p-6 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md animate-scale-in rounded-3xl bg-white p-7 text-center shadow-lift">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100">
          <ShieldAlert className="h-9 w-9 text-destructive animate-pulse-soft" />
        </div>
        <div className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-destructive">⛔ Safety Alert</div>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-navy">
          {productName} contains ingredients flagged unsafe for infants & pregnant women.
        </h2>
        <p className="mt-3 text-sm text-navy/70">
          We strongly recommend reviewing each flagged ingredient before use. Tap below to acknowledge and continue to the full breakdown.
        </p>
        <Button onClick={onAcknowledge} variant="destructive" size="lg" className="mt-6 w-full rounded-full text-base font-semibold">
          I understand — show me the details
        </Button>
      </div>
    </div>
  );
}
