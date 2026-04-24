"""
Orchestrator Agent — OWNED BY AGENTS TEAMMATE.

The top-level coordinator. Takes a user's profile + product list, drives
the five sub-agents in order, emits SSE events so the frontend can render
the live agent-theater, then composes the final analysis output.

Required behavior (from the spec, §5.1 of the Tech Doc):
  1. Scan every product in parallel (asyncio.gather over ScannerAgent).
     emit("scanner.done", {"product_count": N})
  2. Rank all flagged items via ProfileReasonerAgent.
     emit("profile_reasoner.done", {"flagged_count": N})
  3. For each ranked item, call AnalogyWriterAgent (one per ingredient
     per relevant user goal — the spec calls this "one per flagged
     ingredient + goal"; at minimum do the user's primary goal).
     emit("analogy_writer.done", {"count": N})
  4. For each flagged product, call AlternativeFinderAgent.
     emit("alternative_finder.done", {"count": N})
  5. Call RegulatoryXrefAgent once with all unique ingredient_ids (pure SQL).
     emit("regulatory_xref.done", {"banned_count": N})
  6. Compose the final output — a list of ProductAnalysis objects — that
     the analyze router writes to `analyses.output` as JSONB.

Entry points:
  - `run_from_rows(analysis_id, profile_row, product_rows)` is called by
    routers.analyze._run() with raw Supabase rows. It should convert them
    to ProfileOut/ProductOut and kick off the pipeline above.
  - `run(input)` takes a pre-shaped OrchestratorInput; provide it as the
    canonical entry point if you prefer and have `run_from_rows` delegate.

Output shape for `analyses.output` (see schemas.analysis.ProductAnalysis):
  [
    {
      "product": {...ProductOut},
      "flagged": [{
        "ingredient_id", "inci_name", "product_id", "position",
        "hazard_tags", "relevance", "reason",
        "analogy_one_liner", "full_explanation",
        "bans": [...BanOut]
      }],
      "alternatives": [...AlternativeOut]
    },
    ...
  ]
"""
from typing import Any

from services.agents.alternative_finder import AlternativeFinderAgent
from services.agents.analogy_writer import AnalogyWriterAgent
from services.agents.base import AbstractAgent
from services.agents.profile_reasoner import ProfileReasonerAgent
from services.agents.regulatory_xref import RegulatoryXrefAgent
from services.agents.scanner import ScannerAgent
from services.events import EventBus


class OrchestratorAgent(AbstractAgent):
    def __init__(self, bus: EventBus, db: Any) -> None:
        super().__init__(bus, db)
        self.scanner = ScannerAgent(bus, db)
        self.profile_reasoner = ProfileReasonerAgent(bus, db)
        self.analogy_writer = AnalogyWriterAgent(bus, db)
        self.alternative_finder = AlternativeFinderAgent(bus, db)
        self.regulatory_xref = RegulatoryXrefAgent(bus, db)

    async def run(self, input: Any) -> Any:
        raise NotImplementedError("OrchestratorAgent.run — owned by agents teammate")

    async def run_from_rows(
        self,
        analysis_id: str,
        profile_row: dict,
        product_rows: list[dict],
    ) -> list[dict]:
        """
        Called by routers.analyze._run() with raw Supabase rows.
        Return the composed `analyses.output` JSONB payload (see module docstring).
        """
        raise NotImplementedError("OrchestratorAgent.run_from_rows — owned by agents teammate")
