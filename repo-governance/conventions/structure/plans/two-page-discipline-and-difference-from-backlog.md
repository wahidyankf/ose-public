---
description: States the length- and rigor-discipline rules that keep a two-pager short, plus how a two-pager differs from a full backlog/ plan folder.
when_to_use: Use when a two-pager is growing too detailed or when deciding whether an idea is ready to become a full plan.
---

# Two-Page Discipline and Difference from backlog/

## Two-Page Discipline

- **One paragraph per section, full sentences** — not bullet sprawl; length is enforced by _omission_,
  never by font size or margins.
- **The solution stays "immediately understandable", never wireframe- or file-level** — naming
  specific files, functions, or exact layouts means you've drifted into full-plan territory.
- **No BRD/PRD/tech-docs/delivery split, no Gherkin, no delivery checklist, no phase gates** — those
  belong to the mature-core backlog plan.
- **Prior art stays lightweight at capture** — the _Prior art_ section is author-supplied links and a
  clause each, never a research report; a thin idea keeps it short but never omits it. The deep
  `web-researcher` prior-art study runs at promotion, where the full plan can afford it — capturing an
  idea must stay cheap.
- **Ground the problem in data points** — cite the concrete count, size, or measurement that
  evidences it. If no baseline exists, say so plainly (_"no baseline measured"_) rather than inventing
  one — an honestly-unquantified problem is fine; a fabricated number is not.
- **No fabricated metrics** — state success as an observable fact, a cited number with source + access
  date, or an explicitly worded expectation (_"we expect X; no baseline measured"_).
  This inherits the [BRD success-metric rule](./content-placement-rules.md#content-placement-rules-brdmd-vs-prdmd).
- **The summary compresses the whole document**, it does not restate the problem paragraph.
- **No secrets** — the folder is committed and world-readable; the [No Secrets in Git](../../security/no-secrets-in-committed-files.md) hard rule applies in full.

## Difference from backlog/

- **`ideas/` two-pager**: a promotable idea brief — problem, sketch, scope, open questions — with no
  BRD/PRD/tech-docs/delivery split and no delivery checklist.
- **`backlog/`**: a full plan folder with structured requirements, tech-docs, and delivery files,
  ready to execute.
