import Link from "next/link";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata = {
  title: "Research · CleanLabel",
  description:
    "The regulations, peer-reviewed studies, and open data CleanLabel cites when flagging an ingredient.",
};

type Citation = {
  label: string;
  title: string;
  body: string;
  href: string;
  hrefLabel: string;
};

const REGULATIONS: Citation[] = [
  {
    label: "European Union",
    title: "Regulation (EC) No 1223/2009",
    body:
      "The EU Cosmetics Regulation. Annex II prohibits roughly 1,600 substances from cosmetic products; Annex III restricts hundreds more by concentration, product type, or required warning. This is the regulatory backbone for nearly every flag we surface.",
    href: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02009R1223-20240221",
    hrefLabel: "eur-lex.europa.eu",
  },
  {
    label: "European Union",
    title: "SCCS — Scientific Committee on Consumer Safety",
    body:
      "The independent committee that issues the safety opinions the EU Commission turns into law. When you see an ingredient restricted to a specific concentration, an SCCS opinion is usually the underlying evidence.",
    href: "https://health.ec.europa.eu/scientific-committees/scientific-committee-consumer-safety-sccs_en",
    hrefLabel: "health.ec.europa.eu",
  },
  {
    label: "California",
    title: "AB 2762 — Toxic-Free Cosmetics Act (2020)",
    body:
      "Bans 24 ingredients from cosmetics sold in California, effective Jan 1, 2025 — including long-chain PFAS, mercury, formaldehyde, and several phthalates and parabens.",
    href: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB2762",
    hrefLabel: "leginfo.legislature.ca.gov",
  },
  {
    label: "California",
    title: "AB 496 — Cosmetic Safety Reform (2023)",
    body:
      "Extends AB 2762 with 26 additional banned ingredients (effective Jan 1, 2027), including additional PFAS, cyclic siloxanes (D4/D5/D6), and several styrene-related compounds.",
    href: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB496",
    hrefLabel: "leginfo.legislature.ca.gov",
  },
  {
    label: "California",
    title: "Proposition 65",
    body:
      "The Safe Drinking Water and Toxic Enforcement Act of 1986. Requires warnings for products that expose consumers to chemicals known to the state to cause cancer or reproductive harm — the source of many of the warning labels you see on personal-care packaging.",
    href: "https://oehha.ca.gov/proposition-65",
    hrefLabel: "oehha.ca.gov",
  },
  {
    label: "Canada",
    title: "Cosmetic Ingredient Hotlist",
    body:
      "Health Canada's list of substances prohibited or restricted in cosmetics under the Food and Drugs Act. Last major update 2023.",
    href: "https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/cosmetic-ingredient-hotlist-prohibited-restricted-ingredients.html",
    hrefLabel: "canada.ca",
  },
];

const SCIENCE: Citation[] = [
  {
    label: "Johns Hopkins",
    title: "Bloomberg School of Public Health — Endocrine-Disrupting Chemicals",
    body:
      "Researchers at the Department of Environmental Health & Engineering have published extensively on personal-care exposures to phthalates, parabens, and other endocrine disruptors, and on the disproportionate exposure burden carried by women and children.",
    href: "https://publichealth.jhu.edu/departments/environmental-health-and-engineering",
    hrefLabel: "publichealth.jhu.edu",
  },
  {
    label: "Endocrine Society",
    title: "EDC-2: Second Scientific Statement on Endocrine-Disrupting Chemicals (2015)",
    body:
      "The peer-reviewed consensus statement summarizing the human-health evidence on EDCs, including the chemistry classes most commonly found in cosmetics. Published in Endocrine Reviews.",
    href: "https://academic.oup.com/edrv/article/36/6/E1/2354691",
    hrefLabel: "academic.oup.com",
  },
  {
    label: "NIH / NIEHS",
    title: "National Institute of Environmental Health Sciences — Endocrine Disruptors",
    body:
      "The U.S. federal research arm tracking how environmental chemicals — including those used in personal-care products — interact with the human endocrine system.",
    href: "https://www.niehs.nih.gov/health/topics/agents/endocrine",
    hrefLabel: "niehs.nih.gov",
  },
  {
    label: "U.S. FDA",
    title: "FDA — Cosmetics: Ingredients & Labeling",
    body:
      "The FDA's guidance on cosmetic ingredient safety, labeling rules, and the Modernization of Cosmetics Regulation Act of 2022 (MoCRA), which expanded federal oversight for the first time in 80+ years.",
    href: "https://www.fda.gov/cosmetics/cosmetics-laws-regulations/modernization-cosmetics-regulation-act-2022-mocra",
    hrefLabel: "fda.gov",
  },
];

const DATA: Citation[] = [
  {
    label: "Open Data",
    title: "Open Beauty Facts",
    body:
      "A community-maintained, openly licensed database of cosmetic products and their ingredient lists. We use it as one of several sources when matching a barcode to its INCI list.",
    href: "https://world.openbeautyfacts.org/",
    hrefLabel: "world.openbeautyfacts.org",
  },
  {
    label: "Open Data",
    title: "INCI — International Nomenclature of Cosmetic Ingredients",
    body:
      "The standardized naming system every cosmetic label is required to use. CleanLabel resolves ingredient synonyms back to their INCI canonical form before evaluating them.",
    href: "https://ec.europa.eu/growth/tools-databases/cosing/",
    hrefLabel: "ec.europa.eu (CosIng)",
  },
  {
    label: "Open Data",
    title: "EWG Skin Deep Database",
    body:
      "A widely cited consumer-facing ingredient database. We treat it as one input — never the verdict — because its hazard scoring conflates dose, frequency, and exposure route in ways the underlying science doesn't always support.",
    href: "https://www.ewg.org/skindeep/",
    hrefLabel: "ewg.org",
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="pt-[140px] pb-16">
        <div className="mx-auto max-w-[920px] px-8">
          <div className="eyebrow-mono mb-6">The receipts</div>
          <h1 className="mb-7 text-[clamp(40px,5.4vw,64px)] leading-[1.05]">
            We don&rsquo;t invent flags.{" "}
            <span className="italic text-[var(--teal)]">
              We cite them.
            </span>
          </h1>
          <p className="max-w-[58ch] text-[clamp(17px,1.4vw,20px)] leading-[1.5] text-[var(--muted)]">
            Every concern we surface in your report points back to one of the
            sources below — a regulator, a peer-reviewed study, or an openly
            licensed dataset. If a claim can&rsquo;t be sourced, we don&rsquo;t
            make it.
          </p>
        </div>
      </section>

      <CiteBlock
        eyebrow="Regulators"
        heading="What governments have already decided."
        lede="Cosmetics aren't unregulated — they're regulated unevenly. The EU bans more, California is catching up, and Health Canada keeps a running list. We cite the actual statute, not a paraphrase."
        items={REGULATIONS}
      />

      <CiteBlock
        eyebrow="Peer-reviewed science"
        heading="What the research literature says."
        lede="Public-health researchers — including teams at Johns Hopkins — have spent decades quantifying how personal-care exposures interact with the human endocrine system. We anchor analogies in that work, not in vibes."
        items={SCIENCE}
        tinted
      />

      <CiteBlock
        eyebrow="Open data"
        heading="Where we get the ingredient lists."
        lede="The product → ingredient mapping is its own problem. We pull from open, community-maintained databases first, then fall back to AI-resolved INCI lists with an explicit confidence flag when coverage is missing."
        items={DATA}
      />

      <section className="py-20">
        <div className="mx-auto max-w-[920px] px-8">
          <div className="paper-card p-9">
            <div className="eyebrow-mono mb-5">A note on what we won&rsquo;t do</div>
            <h3 className="mb-4">No fearmongering. No fake hazard scores.</h3>
            <p className="mb-3 text-[16px] text-[var(--muted)]">
              We will not slap a 1&ndash;10 score on an ingredient and pretend
              that score is science. Hazard depends on dose, frequency, route of
              exposure, and your individual profile &mdash; the same molecule
              can be fine in a rinse-off and restricted in a leave-on.
            </p>
            <p className="text-[16px] text-[var(--muted)]">
              When the evidence is thin, we say so. When a study is preliminary,
              we say so. When the EU restricts something California allows
              &mdash; or vice versa &mdash; we surface both and let you decide.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--sage)] py-[96px] text-center">
        <div className="mx-auto max-w-[1240px] px-8">
          <h2 className="mx-auto mb-6 max-w-[18ch] text-[#FBF8F1]">
            Receipts in your pocket,{" "}
            <em className="italic">not in a footnote.</em>
          </h2>
          <p className="mx-auto mb-9 max-w-[52ch] text-[17px] text-[rgba(251,248,241,0.8)]">
            Every flagged ingredient in your CleanLabel report links back to
            the regulation or study that backs it up.
          </p>
          <Link href="/signup" className="btn btn-lg">
            Start your report <span className="arrow">→</span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function CiteBlock({
  eyebrow,
  heading,
  lede,
  items,
  tinted,
}: {
  eyebrow: string;
  heading: string;
  lede: string;
  items: Citation[];
  tinted?: boolean;
}) {
  return (
    <section
      className={
        "py-20 " + (tinted ? "bg-[var(--paper)]/50 border-y border-[var(--hairline)]" : "")
      }
    >
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="mb-12 grid items-end gap-10 md:grid-cols-[1fr_1fr] md:gap-14">
          <div>
            <div className="eyebrow-mono mb-4">{eyebrow}</div>
            <h2 className="max-w-[16ch]">{heading}</h2>
          </div>
          <p className="max-w-[52ch] text-[17px] text-[var(--muted)]">{lede}</p>
        </div>

        <ol className="grid gap-5 md:grid-cols-2">
          {items.map((c) => (
            <li
              key={c.title}
              className="paper-card flex flex-col p-7 transition-colors hover:bg-[var(--surface)]"
            >
              <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--sage)]">
                {c.label}
              </div>
              <h4 className="mb-3 text-[22px] leading-[1.2]">{c.title}</h4>
              <p className="mb-5 flex-1 text-[15px] leading-[1.55] text-[var(--muted)]">
                {c.body}
              </p>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link text-[13px]"
              >
                {c.hrefLabel} <span className="arrow">↗</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
