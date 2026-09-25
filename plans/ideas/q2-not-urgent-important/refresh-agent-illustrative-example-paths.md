# Refresh Agent Illustrative Example Paths

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: several generic, reusable agent definitions still illustrate their usage with
example paths naming apps this repo deleted during the BeaverNest repo reset.

> Idea, added 2026-07-31.
> Relocated from beaver-nest/plans/ideas/refresh-agent-illustrative-example-paths.md on 2026-08-06 by plan-ideas-grooming.

## Problem / context

The `baseerah-repo-reset` plan (Phase 3 Gate, task #163) deleted ~20 apps
(`ayokoding-www`, `organiclever-*`, `ose-www`, `ose-app-web`, `wahidyankf-www`, etc.) and swept the
repo for stale references, fixing genuine leftover bugs (broken links, stale CI badges, a mis-scoped
backlog plan). One category it deliberately did **not** touch: `.claude/agents/{specs-checker,
specs-maker,specs-fixer,swe-golang-dev}.md` and their synced mirrors (~183 hits at the time of
writing, across `.claude/` and the mirrors then in existence) use `organiclever`/`ose`/`wahidyankf` as illustrative example
target paths in their instructions (e.g. `folders: [specs/apps/organiclever/app-web]`). No
links are broken — these are prose examples, not references to files that must exist — but since
those apps no longer exist in _this_ repo, a reader could reasonably think such a path is real here.

**Data point:** ~183 hits across `.claude/agents/` plus its auto-synced mirrors, concentrated in 4
source files. The hit count is stale: `update-harness-support` deleted `.cursor/` and added `.codex/`
and `.agents/`, so recount before acting rather than trusting this figure.

## Why now

Not urgent — nothing is broken. Worth doing before the examples drift further out of sync with the
repo's actual (much smaller) app roster, and before a future reader wastes time looking for a path
that was only ever illustrative.

## Prior art / precedents

- **baseerah-repo-reset plan, Phase 3 Gate** — the sweep that found this and deliberately deferred it
  rather than hand-editing ~180 lines across three synced harnesses mid-Gate (risk of drifting out of
  sync with the `.claude/` → `.opencode/`/`.cursor` generation pipeline).
- **AGENTS.md's "Web Sites" table** — a similar stale-example concern already has a dedicated,
  tracked fix task in `baseerah-repo-reset/delivery.md` (Phase 4); this idea is the equivalent for the
  agent-definition surface, which has no such task yet.

## Proposed direction (sketch)

- Replace the illustrative example paths in the canonical `.agents/agents/*.md` sources with either
  (a) the repo's own surviving app (`rhino-cli`) where the example's shape allows it, or (b) a clearly
  fictional placeholder (e.g. `example-app`) that can't be mistaken for a real path.
- Regenerate routes (`./rhino harness adapters generate`) rather than hand-editing a generated route.

## Rough scope & non-goals

In scope: `.agents/agents/specs-checker.md`, `specs-maker.md`, and `specs-fixer.md` (canonical sources
only — routes regenerate).

Out of scope: `docs/explanation/software-engineering/**` (explicitly excluded per
`baseerah-repo-reset/tech-docs.md` Decision 12); retired product test fixtures and their upstream
specification corpus; real identity mentions
(`wahidyankf`); the AGENTS.md Web Sites table (already tracked separately).

## Risks & open questions

- Are any of these examples load-bearing for a reader who expects the generic agent file to
  demonstrate a multi-app monorepo shape? If so, a fictional placeholder may be clearer than
  pointing at this repo's own single surviving app. (open)

## What success looks like + promotion signal

Success: the 4 source agent files (and their regenerated mirrors) illustrate usage without naming an
app that doesn't exist in this repo. Promote to a plan once someone picks a concrete replacement
convention (real surviving app vs. fictional placeholder) for the open question above.
