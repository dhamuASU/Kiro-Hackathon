---
name: notion-workspace
description: Notion patterns — searching, fetching, and updating the CleanLabel Project Hub via the Notion MCP. Use when pulling spec context, updating status pages, or searching the workspace.
---

# Notion Workspace (CleanLabel Project Hub)

The CleanLabel spec, feature list, agent contracts, and changelog notes all live in the Notion workspace. Treat Notion as the **source of truth for product intent** — code is the source of truth for what's actually built.

## Hub pages worth knowing

- **CleanLabel Project Hub** — top-level index; links to feature list, agent contracts, regulatory references
- **Feature list** — every product capability with status (planned / built / shipped)
- **Agent contracts** — input/output schemas for the 5+1 agents (scanner, profile-reasoner, analogy-writer, alternative-finder, regulatory-xref, wellness)
- **Regulatory receipts** — EU CosIng, California Prop 65, Canada hotlist references

## Default workflow

Before designing or implementing a non-trivial feature, search Notion first. Don't reinvent something the team already specced.

```
mcp__plugin_Notion_notion__notion-search(query="CleanLabel feature list")
mcp__plugin_Notion_notion__notion-fetch(id="<page-id-from-search>")
```

For free-form questions ("what does the agent contract for the analogy writer say?") use `notion-search` with a natural-language query — it does fuzzy matching across the workspace.

## When to write to Notion

Only update Notion pages when:

1. The user explicitly asks ("update the feature list", "mark this shipped")
2. A feature actually shipped to production AND the user has authorized the update
3. You're correcting an outdated spec note that's actively misleading

Never auto-mutate spec pages just because code changed.

```
mcp__plugin_Notion_notion__notion-update-page(
  page_id="<id>",
  properties={ "Status": "Shipped" }
)
```

## Comments vs. page edits

- **Comments** are cheap, reversible, and great for "fyi the implementation diverged from the spec here" notes:
  ```
  mcp__plugin_Notion_notion__notion-create-comment(
    page_id="<id>",
    rich_text=[{"text": {"content": "Scanner now batches with or_() — N+1 fixed in commit X"}}]
  )
  ```
- **Page edits** rewrite truth. Reserve for explicit user requests.

## Common pitfalls

- **Database queries need a data source ID, not the database ID.** Use `notion-update-data-source` not `notion-update-database`.
- **Page IDs in URLs have dashes stripped.** `notion.so/abc123def456…` → fetch with `abc123-def4-…` formatted UUID. The MCP usually accepts either.
- **Don't dump raw JSON to the user.** Notion fetch returns rich block trees — summarize as a scannable list with titles + one-line descriptions and the page link.
- **Workspace search has rate limits.** Cache the results within a conversation; don't re-search the same query.

## Output format

When summarizing search results back to the user:

```
Found 3 pages matching "agent contracts":

• Agent contracts — overview (page) — top-level index of the 5 agents
• Scanner agent (page) — INCI list parsing + EU banned cross-ref
• Analogy writer (page) — analogy + fact-check pipeline
```

Hand the user the page titles + one-line hooks; let them click through in Notion themselves.

## Don't

- Don't fabricate page titles or IDs. If search returns nothing, say so.
- Don't store Notion content in `.kiro/` files long-term. Notion is the live source; mirroring it here just goes stale.
- Don't write Notion credentials anywhere in the repo. The MCP server holds the OAuth token.
