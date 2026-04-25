"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

// ═══════════════════════════════════════════════════════════════════════
// Landing page — direct port of cleanlabel_template/CleanLabel.html
// ═══════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  useReveal();

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <section className="pt-[116px] pb-[88px] md:pt-[104px]">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="grid items-center gap-[72px] lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="eyebrow-mono reveal mb-7">Personal chemistry coach</div>
              <h1 className="mb-0">
                <span className="block reveal" data-delay="1">
                  Most ingredients aren&rsquo;t bad.
                </span>
                <span
                  className="block italic text-[var(--teal)] reveal"
                  data-delay="2"
                >
                  Some just aren&rsquo;t bad <em>for&nbsp;you</em>.
                </span>
              </h1>
              <p
                className="reveal mt-7 max-w-[520px] text-[clamp(17px,1.4vw,20px)] leading-[1.5] text-[var(--muted)]"
                data-delay="3"
              >
                Tell us your skin and your goals. We&rsquo;ll decode every product in
                your bathroom &mdash; and explain the chemistry like a friend, not a
                label.
              </p>
              <div
                className="reveal mt-9 flex flex-wrap items-center gap-7"
                data-delay="4"
              >
                <Link href="/signup" className="btn btn-lg">
                  Decode my bathroom <span className="arrow">→</span>
                </Link>
                <a href="#reports" className="text-link">
                  See an example report <span className="arrow">→</span>
                </a>
              </div>
              <div
                className="reveal mt-7 flex flex-wrap gap-[18px] font-mono text-[12px] uppercase tracking-[0.04em] text-[var(--muted)]"
                data-delay="4"
              >
                <span>3-minute onboarding</span>
                <span className="opacity-40">·</span>
                <span>No selling your data</span>
                <span className="opacity-40">·</span>
                <span>Backed by peer-reviewed research</span>
              </div>
            </div>

            <BottleStage />
          </div>
        </div>
      </section>

      {/* ═══ TRY-IT DEMO ══════════════════════════════════════════════════ */}
      <DemoSection />

      {/* ═══ COMPARISON ═══════════════════════════════════════════════════ */}
      <section id="science" className="pb-24 pt-12">
        <div className="mx-auto max-w-[1240px] px-8">
          <SectionHead
            eyebrow="A different temperament"
            title="Other apps shout. We translate."
            lede="The first wave of ingredient apps treated chemistry like a horror movie. Every label became a list of villains. We think that's a bad way to learn anything — and a worse way to take care of your skin."
          />

          <div className="reveal grid gap-6 border-t border-[var(--hairline)] md:grid-cols-2">
            <CompareCol
              variant="lose"
              heading="Other ingredient apps"
              rows={[
                { text: "Slap a 1–10 score on every ingredient." },
                { text: "Treat a 22-year-old with oily skin the same as a pregnant user." },
                { text: "“Contains parabens, an endocrine disruptor.”", tone: "bad-quote" },
                { text: "One AI prompt behind a paywall." },
                { text: "Red flags. Skull icons. “AVOID.”" },
              ]}
            />
            <CompareCol
              variant="win"
              heading="CleanLabel"
              rows={[
                { text: "Calibrated to dose, frequency, and your skin." },
                { text: "Personalized to your profile and the goals you actually told us." },
                {
                  text: "“Parabens are like a houseguest who never leaves — fine for a weekend, problematic for a year.”",
                  tone: "analogy",
                },
                { text: "Five specialized agents, one coherent answer." },
                { text: "Analogies. Doses. Receipts you can verify." },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════════════ */}
      <section
        id="how"
        className="py-24"
        style={{ background: "linear-gradient(180deg, var(--bg) 0%, #F4EEE2 100%)" }}
      >
        <div className="mx-auto max-w-[1240px] px-8">
          <SectionHead
            eyebrow="How it works"
            title={
              <>
                Three minutes in.
                <br />A coach for as long as you want.
              </>
            }
            lede="No quiz that pretends to be a personality test. No email-gated PDF. You give us a profile and a bathroom shelf; we give you a report you can actually use."
          />

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01 — Onboarding",
                h: "Tell us about you.",
                p: "Three minutes. Age, skin type, the goals you actually care about — less acne, less oil, anti-aging, hydration, less sensitivity — and the products in your bathroom.",
                extra: "~ 3 min · 8 questions",
              },
              {
                n: "02 — Analysis",
                h: "Our agents do the chemistry.",
                p: "Five specialized AI agents read every ingredient, weigh it against your profile, and write the analogy. You watch them work in real time.",
                extra: "~ 45 sec · 5 agents",
              },
              {
                n: "03 — Report",
                h: "Get a coach, not a verdict.",
                p: "A personalized report. Analogies, not alarms. Safer alternatives where they matter. EU and California regulatory citations as the receipt — never the headline.",
                extra: "Yours, forever · Updates as you shop",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                className="paper-card paper-card-interactive reveal p-9 pb-10"
                data-delay={i + 1}
              >
                <div className="mb-7 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--sage)]">
                  {s.n}
                </div>
                <h3 className="mb-4">{s.h}</h3>
                <p className="text-[16px] text-[var(--muted)]">{s.p}</p>
                <div className="mt-7 border-t border-[var(--hairline)] pt-5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
                  {s.extra}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ORCHESTRATOR ═══════════════════════════════════════════════ */}
      <section className="bg-[var(--teal)] py-[104px] text-[#F2EBDD]">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="mb-14 grid items-end gap-14 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.04em] text-[var(--mist)]">
                <span className="h-px w-6 bg-[var(--mist)]" /> The architecture
              </div>
              <h2 className="text-[#F2EBDD]">
                Most AI apps are one prompt.
                <br />
                <em className="italic text-[#B8D4D7]">
                  We&rsquo;re five agents in a&nbsp;room.
                </em>
              </h2>
            </div>
            <p className="max-w-[50ch] text-[17px] leading-relaxed text-[rgba(242,235,221,0.7)]">
              A single prompt can&rsquo;t hold &ldquo;sulfate&rdquo; and &ldquo;your
              scalp is dry&rdquo; and &ldquo;the EU restricts this leave-on&rdquo; in
              its head at the same time without losing one of them. So we don&rsquo;t
              ask it to.
            </p>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <OrchestratorDiagram />

            <div>
              <p className="mb-4 text-[17px] leading-[1.6] text-[rgba(242,235,221,0.78)]">
                The Orchestrator runs five small specialists in parallel and stitches
                the answer together. Each agent has one job, one prompt, and one
                source of truth.
              </p>
              <p className="mb-7 text-[17px] leading-[1.6] text-[rgba(242,235,221,0.78)]">
                That&rsquo;s why the output stops contradicting itself and starts
                sounding like a single voice.
              </p>

              <ul className="grid gap-0">
                {[
                  ["Scanner", "Reads each product's ingredient list and resolves common synonyms."],
                  ["Profile Reasoner", "Filters chemicals by what matters for this user's skin and goals."],
                  ["Analogy Writer", "Translates chemistry into everyday metaphors. Houseguests, sugar, marathons."],
                  ["Alternative Finder", "Recommends safer swaps that match skin type, goals, and price band."],
                  ["Regulatory Cross-Ref", "Surfaces EU, California, and Health Canada citations as a receipt."],
                ].map(([name, desc], i, arr) => (
                  <li
                    key={name}
                    className={
                      "grid grid-cols-[160px_1fr] items-baseline gap-4 border-t border-[rgba(242,235,221,0.12)] py-3 " +
                      (i === arr.length - 1 ? "border-b" : "")
                    }
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--mist)]">
                      {name}
                    </span>
                    <span className="text-[15px] text-[rgba(242,235,221,0.85)]">
                      {desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EXAMPLE REPORTS ═══════════════════════════════════════════════ */}
      <section id="reports" className="py-24">
        <div className="mx-auto max-w-[1240px] px-8">
          <SectionHead
            eyebrow="Example reports"
            title="What an analysis looks like."
            lede="Three real cards from real reports. The third one matters most: when a product is fine, we say it's fine. We are not in the business of inventing villains."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <ReportCard
              ingr="Sodium Lauryl Sulfate"
              source="in your shampoo"
              chipTone="concern"
              chipText="EU restricted"
              body={
                <>
                  Sulfates are like sugar. Once a week is fine. Twice a day for years
                  strips your scalp&rsquo;s natural oils &mdash; which is the exact
                  mechanism behind the sensitivity you flagged.
                </>
              }
              swapK="Swap"
              swapV="Vanicream Free & Clear · ~$10"
            />
            <ReportCard
              ingr="Retinol"
              source="across 3 products"
              chipTone="note"
              chipText="Dose concern"
              body={
                <>
                  Three retinol products is a marathon every day. Retinol works &mdash;
                  you don&rsquo;t need three. Pick the night cream, use it 3&times;/week,
                  and give your barrier 24h to recover.
                </>
              }
              swapK="Action"
              swapV="Consolidate to 1 product"
            />
            <ReportCard
              ingr="Niacinamide"
              source="in your moisturizer"
              chipTone="clean"
              chipText="No concerns"
              bodyClean
              body={
                <>
                  Niacinamide at 4% is well-tolerated across skin types and directly
                  supports your stated goal. No reason to flag this. Keep using it.
                </>
              }
              swapK="Verdict"
              swapV="Match. Stay the course."
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 text-[14px] text-[var(--muted)]">
            <span className="inline-block h-px w-9 bg-[var(--hairline)]" />
            <span>3 of 27 ingredients flagged for this user</span>
            <span className="opacity-40">·</span>
            <span>1 swap suggested</span>
            <span className="opacity-40">·</span>
            <span>2 regulatory citations</span>
          </div>
        </div>
      </section>

      {/* ═══ RECEIPTS ═══════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-[1240px] px-8">
          <SectionHead
            eyebrow="Receipts, never headlines"
            title="We cite. We don't catastrophize."
            lede="When an ingredient is restricted somewhere, we surface the regulation as a small chip — the receipt that backs up the analogy — not as the pitch."
          />

          <div className="grid grid-cols-1 border-y border-[var(--hairline)] md:grid-cols-3">
            {[
              {
                label: "EU",
                title: "Regulation (EC) No 1223/2009",
                body: "The EU Cosmetics Regulation Annex II + V references we cite in every flag. 1,600 substances banned or restricted.",
              },
              {
                label: "California",
                title: "AB 2762 + AB 496",
                body: "The Toxic-Free Cosmetics Act and its extension. A dozen ingredients banned from sale in CA by 2025-2027.",
              },
              {
                label: "Canada",
                title: "Cosmetic Ingredient Hotlist",
                body: "Health Canada's list of prohibited + restricted ingredients. Updated 2023.",
              },
            ].map((r, i, arr) => (
              <div
                key={r.label}
                className={
                  "px-8 py-10 " +
                  (i < arr.length - 1 ? "md:border-r md:border-[var(--hairline)]" : "")
                }
              >
                <div className="mb-4 font-mono text-[12px] uppercase tracking-[0.04em] text-[var(--sage)]">
                  {r.label}
                </div>
                <h4 className="mb-3 text-[28px] leading-[1.1]">{r.title}</h4>
                <p className="text-[15px] text-[var(--muted)]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-[1240px] px-8">
          <SectionHead
            eyebrow="Frequently asked"
            title="The honest answers."
          />

          <Faq
            items={[
              {
                q: "Is this a medical app?",
                a: "No. We're not a diagnostic tool. We're a chemistry coach: we translate ingredient lists and surface regulatory context. For medical concerns, talk to a dermatologist — and feel free to bring your CleanLabel report.",
              },
              {
                q: "Do you sell my data?",
                a: "No. Your profile and product list are stored in your Supabase account. We don't sell, rent, or share it with brands. Delete your account and everything goes.",
              },
              {
                q: "How accurate is the AI analysis?",
                a: "Every flagged ingredient is cross-referenced against the ingredients table in our Postgres database. Analogies are curated-first (we hand-wrote the top 50) and LLM-fallback for the long tail with a fact-check pass. Regulatory citations are pure SQL — we never paraphrase a law.",
              },
              {
                q: "Why five agents instead of one?",
                a: "Because one prompt can't hold your skin type, your goals, every ingredient's chemistry, and every regulation without losing something. Five small specialists stay focused. The Orchestrator composes their answers into a single coherent voice.",
              },
              {
                q: "Where do you get product ingredient lists?",
                a: "Open Beauty Facts (community-maintained, ~60% US coverage) plus our seeded catalog of common products. When both miss, an LLM-resolver fills in with an explicit confidence flag.",
              },
            ]}
          />
        </div>
      </section>

      {/* ═══ FINAL CTA ═══════════════════════════════════════════════════ */}
      <section className="bg-[var(--sage)] py-[112px] text-center">
        <div className="mx-auto max-w-[1240px] px-8">
          <h2 className="mx-auto mb-6 max-w-[16ch] text-[#FBF8F1]">
            A chemistry friend,
            <br />
            <em className="italic">on call.</em>
          </h2>
          <p className="mx-auto mb-10 max-w-[44ch] text-[18px] text-[rgba(251,248,241,0.8)]">
            Three minutes to onboard. A lifetime of labels that finally make sense.
          </p>
          <Link href="/signup" className="btn btn-lg">
            Decode my bathroom <span className="arrow">→</span>
          </Link>
          <p className="mt-6 text-[12px] text-[rgba(251,248,241,0.65)]">
            Free to start. No credit card. No data sold.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Local sub-components
// ═══════════════════════════════════════════════════════════════════════

function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
}) {
  return (
    <div className="mb-14 grid items-end gap-10 md:grid-cols-2 md:gap-14">
      <div>
        <div className="eyebrow-mono reveal mb-4">{eyebrow}</div>
        <h2 className="reveal max-w-[14ch]" data-delay="1">
          {title}
        </h2>
      </div>
      {lede ? (
        <p
          className="reveal max-w-[46ch] text-[18px] text-[var(--muted)]"
          data-delay="2"
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

function CompareCol({
  heading,
  rows,
  variant,
}: {
  heading: string;
  variant: "win" | "lose";
  rows: { text: string; tone?: "analogy" | "bad-quote" }[];
}) {
  const isWin = variant === "win";
  return (
    <div
      className={
        "py-10 " +
        (isWin
          ? "-mx-8 rounded-sm bg-[var(--sage-soft)] px-8"
          : "text-[#8b8a82]")
      }
    >
      <h4
        className={
          "mb-7 font-mono text-[12px] font-medium uppercase tracking-[0.08em] " +
          (isWin ? "text-[var(--sage)]" : "text-[var(--muted)]")
        }
      >
        {heading}
      </h4>
      {rows.map((r, i) => (
        <div
          key={i}
          className={
            "border-t py-5 text-[17px] leading-[1.45] " +
            (isWin ? "border-[#D6E1D2]" : "border-[#ECE6D8]") +
            (i === 0 ? " !border-t-0" : "") +
            (r.tone === "analogy" ? " italic text-[var(--teal)] text-[22px] leading-[1.3]" : "") +
            (r.tone === "bad-quote" ? " text-[#8b8a82]" : "") +
            " " +
            (r.tone === "analogy" ? "font-serif" : "")
          }
        >
          {r.text}
        </div>
      ))}
    </div>
  );
}

function ReportCard({
  ingr,
  source,
  chipTone,
  chipText,
  body,
  bodyClean,
  swapK,
  swapV,
}: {
  ingr: string;
  source: string;
  chipTone: "concern" | "note" | "clean";
  chipText: string;
  body: React.ReactNode;
  bodyClean?: boolean;
  swapK: string;
  swapV: string;
}) {
  const chipClass =
    chipTone === "clean" ? "chip-clear" : chipTone === "note" ? "chip-note" : "";
  return (
    <div className="paper-card paper-card-interactive reveal flex min-h-[380px] flex-col p-7 pb-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em]">
          {ingr}
        </div>
        <span className={`chip ${chipClass}`}>{chipText}</span>
      </div>
      <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--muted)]">
        {source}
      </div>
      <div
        className={
          "mb-6 flex-1 font-serif italic text-[24px] leading-[1.25] " +
          (bodyClean ? "text-[var(--sage)]" : "text-[var(--teal)]")
        }
      >
        {body}
      </div>
      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-dashed border-[var(--hairline)] pt-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
          {swapK}
        </span>
        <span className="max-w-[60%] text-right text-[14px] text-[var(--ink)]">
          {swapV}
        </span>
      </div>
    </div>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="reveal border-t border-[var(--hairline)]">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-b border-[var(--hairline)]">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-7 text-left"
            >
              <span className="font-serif text-[clamp(22px,2.4vw,28px)] text-[var(--ink)]">
                {it.q}
              </span>
              <span
                className={
                  "text-[22px] leading-none text-[var(--muted)] transition-transform duration-300 " +
                  (isOpen ? "rotate-45 text-[var(--sage)]" : "")
                }
                style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-400"
              style={{
                maxHeight: isOpen ? "280px" : "0px",
                paddingBottom: isOpen ? "28px" : "0px",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <p className="text-[17px] leading-relaxed text-[var(--muted)]">
                {it.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BottleStage() {
  return (
    <div
      className="reveal relative ml-auto w-full max-w-[460px] overflow-hidden rounded-sm border border-[var(--hairline)]"
      data-delay="2"
      style={{
        aspectRatio: "4 / 5",
        background: "linear-gradient(180deg, #F1ECE0 0%, #EDE6D6 100%)",
      }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.5), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.06), transparent 60%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "56%", aspectRatio: "1 / 1.55" }}
      >
        {/* cap */}
        <div
          className="absolute left-[18%] right-[18%] top-0 rounded-sm"
          style={{
            height: "13%",
            background: "linear-gradient(180deg, #2A4F4D 0%, #1F3D3B 100%)",
            boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.2)",
          }}
        />
        {/* body */}
        <div
          className="absolute inset-[12%_0_0_0]"
          style={{
            background: "linear-gradient(180deg, #FFFDF8 0%, #F6F1E6 100%)",
            borderRadius: "6px 6px 14px 14px",
            boxShadow:
              "inset 0 0 0 1px rgba(31,36,33,0.08), 0 30px 60px -20px rgba(31,36,33,0.18), 0 8px 24px -10px rgba(31,36,33,0.12)",
          }}
        >
          {/* label */}
          <div
            className="absolute bg-white p-4"
            style={{
              left: "8%",
              right: "8%",
              top: "22%",
              bottom: "12%",
              border: "1px solid #EFE9DB",
            }}
          >
            <div className="font-serif italic text-[18px] text-[var(--teal)]">
              field &amp; co.
            </div>
            <div className="mb-1.5 mt-1 pb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)] border-b border-[var(--hairline)]">
              Daily Clarifying Shampoo · 250ml
            </div>
            <div className="mb-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--ink)]">
              Ingredients
            </div>
            <div className="font-mono text-[9.5px] leading-[1.55] text-[var(--ink)]">
              Aqua,{" "}
              <span className="rounded-sm bg-[#F4E5DD] px-[2px] py-[1px] text-[var(--terra-deep)]">
                Sodium Lauryl Sulfate
              </span>
              , Cocamidopropyl Betaine, Glycerin,{" "}
              <span className="rounded-sm bg-[#F4E5DD] px-[2px] py-[1px] text-[var(--terra-deep)]">
                Parfum
              </span>
              , Sodium Chloride, Citric Acid, Panthenol,{" "}
              <span className="rounded-sm bg-[#F4E5DD] px-[2px] py-[1px] text-[var(--terra-deep)]">
                Methylparaben
              </span>
              , Polyquaternium-10.
            </div>
          </div>
        </div>
      </div>

      {/* Scan line */}
      <div
        className="pointer-events-none absolute -left-[2%] -right-[2%] h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(107,142,111,0), rgba(107,142,111,0.9), rgba(107,142,111,0), transparent)",
          boxShadow: "0 0 18px 4px rgba(107,142,111,0.35)",
          animation: "scan 6s linear infinite",
        }}
      />

      <Pill
        className="pill-1"
        text={
          <>
            <strong>Sulfates</strong>{" "}
            <span className="font-serif italic text-[var(--teal)]">
              — like sugar. Fine sometimes, brutal daily.
            </span>
          </>
        }
      />
      <Pill
        className="pill-2"
        swatch="var(--mist)"
        text={
          <>
            <strong>Parfum</strong>{" "}
            <span className="font-serif italic text-[var(--teal)]">
              — a mystery guest list.
            </span>
          </>
        }
      />
      <Pill
        className="pill-3"
        swatch="var(--sage)"
        text={
          <>
            <strong>Parabens</strong>{" "}
            <span className="font-serif italic text-[var(--teal)]">
              — the houseguest who never leaves.
            </span>
          </>
        }
      />

      <style jsx>{`
        @keyframes scan {
          0% { top: 22%; opacity: 0; }
          8%  { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
        .pill-1 { right: -6%; top: 28%; }
        .pill-2 { right: -2%; top: 52%; }
        .pill-3 { left: -8%; top: 70%; }
      `}</style>
    </div>
  );
}

function Pill({
  text,
  swatch = "var(--terra)",
  className = "",
}: {
  text: React.ReactNode;
  swatch?: string;
  className?: string;
}) {
  return (
    <div
      className={
        "absolute whitespace-nowrap rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-[12.5px] text-[var(--ink)] shadow-[0_14px_30px_-10px_rgba(31,36,33,0.18),0_4px_10px_-2px_rgba(31,36,33,0.06)] " +
        className
      }
      style={{ animation: "pillIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
    >
      <span className="inline-flex items-center gap-2.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: swatch }}
        />
        {text}
      </span>
      <style jsx>{`
        @keyframes pillIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function OrchestratorDiagram() {
  return (
    <div className="reveal mx-auto aspect-square w-full max-w-[520px]">
      <svg viewBox="0 0 520 520" className="block h-full w-full">
        <defs>
          <radialGradient id="hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C97B5C" />
            <stop offset="100%" stopColor="#A65E40" />
          </radialGradient>
        </defs>

        {/* connection lines */}
        <g stroke="#B8D4D7" strokeOpacity="0.25" strokeWidth="1" fill="none">
          <line x1="260" y1="260" x2="260" y2="80" />
          <line x1="260" y1="260" x2="430" y2="160" />
          <line x1="260" y1="260" x2="430" y2="360" />
          <line x1="260" y1="260" x2="90" y2="360" />
          <line x1="260" y1="260" x2="90" y2="160" />
        </g>

        {/* five agent nodes */}
        {[
          { x: 260, y: 80, label: ["SCANNER"], delay: 0 },
          { x: 430, y: 160, label: ["PROFILE", "REASONER"], delay: 0.4 },
          { x: 430, y: 360, label: ["ANALOGY", "WRITER"], delay: 0.8 },
          { x: 90, y: 360, label: ["ALT.", "FINDER"], delay: 1.2 },
          { x: 90, y: 160, label: ["REG.", "CROSS-REF"], delay: 1.6 },
        ].map((n, i) => (
          <g key={i} transform={`translate(${n.x}, ${n.y})`}>
            <circle r="44" fill="#1F3D3B" stroke="#B8D4D7" strokeOpacity="0.4" />
            <circle r="44" fill="none" stroke="#B8D4D7" strokeOpacity="0.6">
              <animate
                attributeName="r"
                values="44;52;44"
                dur="3.2s"
                begin={`${n.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values="0.6;0;0.6"
                dur="3.2s"
                begin={`${n.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            {n.label.map((ln, li) => (
              <text
                key={li}
                textAnchor="middle"
                y={n.label.length === 1 ? 4 : li === 0 ? -2 : 12}
                fill="#B8D4D7"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                letterSpacing="1"
              >
                {ln}
              </text>
            ))}
          </g>
        ))}

        {/* center orchestrator */}
        <g transform="translate(260, 260)">
          <circle r="64" fill="url(#hub)" />
          <circle r="64" fill="none" stroke="#C97B5C" strokeOpacity="0.4">
            <animate
              attributeName="r"
              values="64;78;64"
              dur="2.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.5;0;0.5"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            textAnchor="middle"
            y="-2"
            fill="#FFFFFF"
            fontFamily="Newsreader, serif"
            fontStyle="italic"
            fontSize="20"
          >
            Orchestrator
          </text>
          <text
            textAnchor="middle"
            y="16"
            fill="#FFFFFF"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            letterSpacing="2"
            opacity="0.8"
          >
            COMPOSING
          </text>
        </g>
      </svg>
    </div>
  );
}

/** Reveals `.reveal` elements as they scroll into view. Mirrors the template. */
function useReveal() {
  const observed = useRef(false);
  useEffect(() => {
    if (observed.current) return;
    observed.current = true;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ═══════════════════════════════════════════════════════════════════════
// Interactive demo — barcode scan → sample report
// ═══════════════════════════════════════════════════════════════════════

function DemoSection() {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");

  const start = () => {
    if (phase !== "idle") return;
    setPhase("scanning");
    setTimeout(() => setPhase("done"), 2400);
  };

  const reset = () => setPhase("idle");

  return (
    <section id="demo" className="scroll-mt-24 border-y border-[var(--hairline)] bg-[var(--paper)]/40 py-24">
      <div className="mx-auto max-w-[1240px] px-8">
        <div className="mb-12 text-center">
          <div className="eyebrow-mono mx-auto mb-5 inline-flex items-center gap-2.5 text-[var(--sage)]">
            <span className="h-px w-6 bg-[var(--sage)]" />
            Try it without an account
            <span className="h-px w-6 bg-[var(--sage)]" />
          </div>
          <h2 className="mx-auto max-w-[20ch] text-[clamp(34px,4vw,52px)]">
            Scan a sample bottle.{" "}
            <span className="italic text-[var(--teal)]">See what happens.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[17px] text-[var(--muted)]">
            One click runs the same five-agent pipeline you&rsquo;ll get in your
            bathroom — minus the bathroom.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.05fr]">
          <DemoScanner phase={phase} onClick={start} onReset={reset} />
          <DemoReport phase={phase} />
        </div>
      </div>
    </section>
  );
}

function DemoScanner({
  phase,
  onClick,
  onReset,
}: {
  phase: "idle" | "scanning" | "done";
  onClick: () => void;
  onReset: () => void;
}) {
  return (
    <div className="paper-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-7 py-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              phase === "scanning"
                ? "animate-pulse bg-[var(--terra)]"
                : phase === "done"
                  ? "bg-[var(--sage)]"
                  : "bg-[var(--muted)]",
            )}
          />
          {phase === "scanning"
            ? "Scanning…"
            : phase === "done"
              ? "Capture complete"
              : "Camera idle"}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          UPC · 037000871422
        </span>
      </div>

      <button
        onClick={phase === "idle" ? onClick : undefined}
        disabled={phase !== "idle"}
        className="group relative block aspect-[4/5] w-full overflow-hidden bg-[#1A2322] disabled:cursor-default"
        aria-label="Run scan demo"
      >
        {/* faux camera depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,250,238,0.16), transparent 55%), radial-gradient(ellipse at 25% 80%, rgba(207,221,220,0.14), transparent 55%), linear-gradient(180deg, #1F2A28 0%, #121A19 100%)",
          }}
        />

        {/* viewfinder corners */}
        <div className="pointer-events-none absolute inset-[14%]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute h-7 w-7 border-2 border-[#FBF9F4]/85"
              style={{
                top: i < 2 ? 0 : "auto",
                bottom: i >= 2 ? 0 : "auto",
                left: i % 2 === 0 ? 0 : "auto",
                right: i % 2 === 1 ? 0 : "auto",
                borderRight: i % 2 === 0 ? "none" : undefined,
                borderLeft: i % 2 === 1 ? "none" : undefined,
                borderTop: i < 2 ? undefined : "none",
                borderBottom: i < 2 ? "none" : undefined,
              }}
            />
          ))}
        </div>

        {/* sweeping scan line (only while scanning) */}
        {phase === "scanning" && (
          <span className="demo-scanline pointer-events-none absolute left-[14%] right-[14%] h-[2px]" />
        )}

        {/* barcode */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-[62%] rounded-[6px] bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition-all duration-500",
            phase === "done"
              ? "bottom-[42%] scale-[0.78]"
              : "bottom-[18%] scale-100",
          )}
        >
          <div className="flex h-[46px] items-end gap-[2px]">
            {[3, 1, 3, 2, 1, 2, 3, 1, 1, 3, 2, 1, 3, 1, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3].map(
              (h, i) => (
                <span
                  key={i}
                  className={cn(
                    "block bg-[#1A2322]",
                    h === 1 ? "w-[2px]" : h === 2 ? "w-[3px]" : "w-[2px]",
                  )}
                  style={{ height: h === 3 ? "100%" : h === 2 ? "88%" : "74%" }}
                />
              ),
            )}
          </div>
          <div className="mt-1.5 text-center font-mono text-[11px] tracking-[0.18em] text-[#1A2322]">
            037000871422
          </div>
        </div>

        {/* idle CTA overlay */}
        {phase === "idle" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-8">
            <span className="rounded-full bg-[var(--terra)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-white shadow-lg transition-transform group-hover:scale-105">
              ▶ Tap to scan
            </span>
          </div>
        )}

        {/* done badge */}
        {phase === "done" && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
            <span className="rounded-sm border border-[var(--sage)] bg-[var(--sage-soft)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sage)] shadow-sm">
              ✓ Match found · Head & Shoulders
            </span>
          </div>
        )}
      </button>

      <div className="flex items-center justify-between border-t border-[var(--hairline)] px-7 py-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          {phase === "done" ? "Sample report ready →" : "Live demo · no account needed"}
        </span>
        {phase === "done" ? (
          <button onClick={onReset} className="text-link text-[12px]">
            Reset
          </button>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]/60">
            5-agent pipeline
          </span>
        )}
      </div>
    </div>
  );
}

function DemoReport({ phase }: { phase: "idle" | "scanning" | "done" }) {
  if (phase === "idle") {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-sm border border-dashed border-[var(--hairline)] p-10 text-center">
        <div className="font-serif text-[22px] italic leading-[1.35] text-[var(--muted)]">
          Your sample report appears here once the scanner finishes.
        </div>
        <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          ↑ Tap the bottle
        </div>
      </div>
    );
  }

  if (phase === "scanning") {
    return (
      <div className="space-y-3 rounded-sm border border-[var(--hairline)] bg-[var(--surface)] p-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Agents working…
        </div>
        {[
          "Scanner — reading 24 ingredients",
          "Profile reasoner — ranking by your goals",
          "Analogy writer — composing plain-English",
          "Alternative finder — sourcing cleaner swap",
          "Regulatory cross-ref — checking EU / CA",
        ].map((line, i) => (
          <div
            key={line}
            className="flex items-center gap-3 font-mono text-[12px] text-[var(--ink)]"
            style={{
              opacity: 0,
              animation: `demoFade 0.4s ease forwards`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--terra)]" />
            {line}
          </div>
        ))}
      </div>
    );
  }

  // phase === "done"
  return (
    <article
      className="paper-card overflow-hidden"
      style={{ animation: "demoFade 0.5s ease forwards" }}
    >
      <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--paper)] px-7 py-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
            Head & Shoulders · Shampoo
          </div>
          <div className="mt-0.5 font-serif text-[20px]">Classic Clean</div>
        </div>
        <span className="rounded-sm bg-[var(--terra)]/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--terra-deep)]">
          3 flagged
        </span>
      </div>

      <ul className="divide-y divide-[var(--hairline)]">
        {[
          {
            name: "Sodium Laureth Sulfate",
            relevance: "high",
            quote:
              "SLES is like an industrial degreaser for a kitchen that only needs a light wipe — it removes too much oil, which can rebound into more breakouts.",
          },
          {
            name: "Methylisothiazolinone",
            relevance: "high",
            quote:
              "MI is a preservative powerful enough to be banned in EU leave-on products. For sensitive skin, it&rsquo;s the smoke detector that won&rsquo;t stop beeping.",
            ban: "Restricted in EU",
          },
          {
            name: "Parfum",
            relevance: "medium",
            quote:
              "Fragrance on acne-prone skin is a sprinkler that also sprays gasoline — a common silent trigger of irritation.",
          },
        ].map((row) => (
          <li key={row.name} className="px-7 py-5">
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  row.relevance === "high"
                    ? "bg-[var(--terra)]"
                    : "bg-[var(--mist)]",
                )}
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[15px] font-medium text-[var(--ink)]">
                    {row.name}
                  </span>
                  {row.ban && <span className="chip">{row.ban}</span>}
                </div>
                <p
                  className="mt-2 font-serif text-[18px] italic leading-[1.4] text-[var(--teal)]"
                  dangerouslySetInnerHTML={{ __html: `&ldquo;${row.quote}&rdquo;` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-[var(--sage-soft)] px-7 py-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sage)]">
          Cleaner swap
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <span className="text-[16px] font-medium text-[var(--ink)]">
            Hello Bello Sulfate-Free Shampoo
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
            $9 · widely available
          </span>
        </div>
        <p className="mt-2 max-w-[60ch] text-[14px] text-[var(--ink)]">
          Same lather feel, no SLES, fragrance-free. Good fit for sensitive
          scalp.
        </p>
      </div>

      <div className="border-t border-[var(--hairline)] px-7 py-4 text-center">
        <Link href="/signup" className="text-link text-[13px]">
          Run this on your own bathroom <span className="arrow">→</span>
        </Link>
      </div>
    </article>
  );
}

// Tiny utility (avoids importing cn from app dir)
function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
