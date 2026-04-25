"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, ApiError, openAnalysisStream } from "@/lib/api";
import { useOnboarding } from "@/store/onboarding";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-60 w-full" />}>
      <AnalyzingStep />
    </Suspense>
  );
}

interface AgentStep {
  slug: string;
  name: string;
  desc: string;
  status: "pending" | "running" | "done" | "failed";
}

const INITIAL_AGENTS: AgentStep[] = [
  { slug: "scanner",           name: "Scanner",            desc: "Reading each product's ingredient list", status: "pending" },
  { slug: "profile_reasoner",  name: "Profile Reasoner",   desc: "Ranking by what matters for your skin", status: "pending" },
  { slug: "analogy_writer",    name: "Analogy Writer",     desc: "Writing plain-English metaphors", status: "pending" },
  { slug: "alternative_finder",name: "Alternative Finder", desc: "Picking cleaner swaps that match your profile", status: "pending" },
  { slug: "regulatory_xref",   name: "Regulatory Cross-Ref", desc: "Surfacing EU / California / Canada citations", status: "pending" },
];

function AnalyzingStep() {
  const router = useRouter();
  const params = useSearchParams();
  const analysisId = params.get("id");
  const { reset } = useOnboarding();

  const [agents, setAgents] = useState<AgentStep[]>(INITIAL_AGENTS);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"streaming" | "completed" | "failed">("streaming");
  const initialized = useRef(false);

  useEffect(() => {
    if (!analysisId) {
      router.replace("/onboarding/profile");
      return;
    }
    if (initialized.current) return;
    initialized.current = true;

    let close: (() => void) | undefined;

    (async () => {
      // Instant visual feedback — backend events arrive quickly but not instantly.
      setAgents((prev) => prev.map((a, i) => (i === 0 ? { ...a, status: "running" } : a)));

      close = await openAnalysisStream(analysisId, {
        onEvent: (event, data) => {
          if (event === "error") {
            const detail = (data as { detail?: string })?.detail;
            setError(detail ?? "Analysis failed");
            setPhase("failed");
            return;
          }
          const [agentSlug, phase] = String(event).split(".");
          if (phase === "start") {
            setAgents((prev) =>
              prev.map((a) =>
                a.slug === agentSlug && a.status === "pending"
                  ? { ...a, status: "running" }
                  : a,
              ),
            );
          } else if (phase === "done") {
            setAgents((prev) => {
              const next = prev.map((a) =>
                a.slug === agentSlug ? { ...a, status: "done" as const } : a,
              );
              const idx = next.findIndex((a) => a.slug === agentSlug);
              if (idx >= 0 && idx + 1 < next.length && next[idx + 1].status === "pending") {
                next[idx + 1] = { ...next[idx + 1], status: "running" };
              }
              return next;
            });
          }
        },
        onDone: async () => {
          try {
            const analysis = await api.getAnalysis(analysisId);
            if (analysis.status === "failed") {
              setError(analysis.error ?? "Analysis failed");
              setPhase("failed");
              return;
            }
            setAgents((prev) => prev.map((a) => ({ ...a, status: "done" })));
            setPhase("completed");
            setTimeout(() => {
              reset();
              router.push(`/dashboard?analysis=${analysisId}`);
            }, 900);
          } catch (err) {
            const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Unknown";
            setError(msg);
            setPhase("failed");
          }
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Stream failed");
          setPhase("failed");
        },
      });
    })();

    return () => close?.();
  }, [analysisId, router, reset]);

  const retry = async () => {
    try {
      const { analysis_id } = await api.triggerAnalysis();
      setPhase("streaming");
      setError(null);
      setAgents(INITIAL_AGENTS);
      initialized.current = false;
      router.replace(`/onboarding/analyzing?id=${analysis_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't retry");
    }
  };

  return (
    <div>
      <div className="eyebrow-mono mb-5">Analyzing — Step 5 of 5</div>
      <h1 className="mb-4 text-[clamp(36px,5vw,54px)]">
        Our five agents are{" "}
        <span className="italic text-[var(--teal)]">reading your bathroom.</span>
      </h1>
      <p className="mb-10 max-w-[52ch] text-[17px] text-[var(--muted)]">
        Give it about a minute. Each agent has one narrow job — when they&rsquo;re
        all done, the Orchestrator composes a single report from their output.
      </p>

      <ol className="space-y-3">
        {agents.map((a, i) => (
          <AgentRow key={a.slug} agent={a} index={i + 1} />
        ))}
      </ol>

      {phase === "completed" && (
        <div className="mt-10 paper-card p-7">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sage)]">
            Analysis complete
          </div>
          <p className="mt-2 font-serif text-[22px] italic text-[var(--teal)]">
            Opening your dashboard…
          </p>
        </div>
      )}

      {phase === "failed" && (
        <div className="mt-10 rounded-sm border border-[var(--terra)] bg-[#F4E5DD] p-7">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--terra-deep)]">
            Analysis failed
          </div>
          <p className="mt-2 text-[15px] text-[var(--ink)]">
            {error ?? "Something went wrong on the server."}
          </p>
          <p className="mt-2 text-[13px] text-[var(--muted)]">
            This often means the agents backend isn&rsquo;t implemented yet.
            Infrastructure is healthy (routers + DB work) — the LLM pipeline is
            the agents teammate&rsquo;s lane.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={retry} className="btn">
              Retry analysis <span className="arrow">→</span>
            </button>
            <button onClick={() => router.push("/dashboard")} className="btn-ghost">
              Go to dashboard anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentRow({ agent, index }: { agent: AgentStep; index: number }) {
  return (
    <li
      className={cn(
        "relative flex items-start gap-5 rounded-sm border p-5 transition-all",
        agent.status === "done"
          ? "border-[var(--sage)] bg-[var(--sage-soft)]"
          : agent.status === "running"
            ? "border-[var(--terra)] bg-[var(--surface)]"
            : agent.status === "failed"
              ? "border-[var(--terra-deep)] bg-[#F4E5DD]"
              : "border-[var(--hairline)] bg-[var(--surface)]",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[12px]",
          agent.status === "done"
            ? "bg-[var(--sage)] text-[var(--bg)]"
            : agent.status === "running"
              ? "bg-[var(--terra)] text-white"
              : "bg-[var(--paper)] text-[var(--muted)]",
        )}
      >
        {agent.status === "done" ? "✓" : index.toString().padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {agent.status === "running"
              ? "Running…"
              : agent.status === "done"
                ? "Done"
                : agent.status === "failed"
                  ? "Failed"
                  : "Queued"}
          </span>
          <span className="text-[15px] font-medium text-[var(--ink)]">
            {agent.name}
          </span>
        </div>
        <p className="mt-0.5 text-[14px] text-[var(--muted)]">{agent.desc}</p>
      </div>
      {agent.status === "running" && (
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--terra)]" aria-hidden />
      )}
    </li>
  );
}
