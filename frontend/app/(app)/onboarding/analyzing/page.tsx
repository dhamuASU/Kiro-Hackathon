"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENTS = [
  { name: "scanner",          label: "Scanning your products for flagged ingredients…" },
  { name: "profile_reasoner", label: "Reading your skin profile and goals…" },
  { name: "analogy_writer",   label: "Writing analogies for flagged ingredients…" },
  { name: "alternative_finder",label: "Finding cleaner alternatives for your routine…" },
  { name: "regulatory_xref",  label: "Cross-checking EU and California ban lists…" },
];

export default function AnalyzingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => {
        if (prev >= AGENTS.length - 1) {
          clearInterval(interval);
          setDone(true);
          setTimeout(() => router.push("/dashboard"), 1200);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="mb-8 grid h-16 w-16 place-items-center rounded-2xl bg-[#28396C] text-white">
        <Leaf className={cn("h-8 w-8 transition-transform", !done && "animate-pulse")} />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-[#28396C]">
        {done ? "Analysis complete ✓" : "Analyzing your routine…"}
      </h2>
      <p className="mb-10 text-sm text-gray-500">Our AI agents are working in sequence</p>

      <div className="w-full max-w-sm space-y-3">
        {AGENTS.map((agent, i) => (
          <div key={agent.name} className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
            i < current ? "border-[#B5E18B] bg-[#F0FFC2]/60 text-[#28396C]" :
            i === current ? "border-[#28396C] bg-[#28396C]/5 text-[#28396C] font-medium" :
            "border-gray-100 text-gray-400"
          )}>
            <span className={cn("h-2 w-2 rounded-full shrink-0",
              i < current ? "bg-[#B5E18B]" :
              i === current ? "bg-[#28396C] animate-pulse" :
              "bg-gray-200")} />
            {agent.label}
          </div>
        ))}
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
