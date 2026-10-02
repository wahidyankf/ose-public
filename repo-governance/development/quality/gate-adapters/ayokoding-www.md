---
description: >-
  Product rules the content and four tutorial quality gates apply to AyoKoding pages under apps/ayokoding-www/content/,
  overriding generic rules only where this adapter names them.
when_to_use: >-
  Use when running, or repairing for, the content or a tutorial quality gate on AyoKoding pages, or when deciding which
  AyoKoding rule a finding cites.
---

# AyoKoding WWW Gate Adapter

**Covers:** every page under `apps/ayokoding-www/content/`. **Configures:**
[Content Quality Gate](../../../workflows/quality/content-quality-gate.md) and the four tutorial gates, whose thresholds
are in [Tutorial Kinds](./ayokoding-www/tutorial-kinds.md). A checker cites a rule here by its heading; a rule this
adapter does not state is never applied, per the content gate's
[Inputs](../../../workflows/quality/content-quality-gate.md#inputs).

## Deterministic Boundary Here

`markdownlint` (MD004 dash lists, MD007 two-space indents, MD042 empty links, and its other enabled rules),
`format-staged`, `md-naming`, `md-mermaid`, and `md-mermaid-repository` (rendering, label length, and the accessible
palette) reach these pages, so those properties are never findings. Front matter, heading hierarchy, internal links and
anchors, external links, and `_index.md` correctness reach no declared gate here: the content trees sit outside the
front-matter and heading surfaces and in the internal-link `exclude-sources`, and the `ayokoding-www:validate-indexes`
target is wired into no gate. They are judgeable.

## Content Rules

- **No body H1.** The page H1 comes from metadata, so a page starts with introductory text or an H2. This overrides the
  generic "exactly one H1".
- **Language policy.** English is the default. A page may exist in `en` only, `id` only, or both, and nothing is
  mirrored automatically; judge completeness against that policy, never against parity.
- **Versions agree.** Where `en` and `id` versions of a page both exist, they agree on facts; a factual repair lands in
  both.
- **Tree shape.** New learning content follows `content/en/learn/<domain>/<area>/<topic>/`, holding `_index.md`,
  `overview.md`, and track folders. Only three track names exist: `by-concept`, `by-example`, and `in-the-field`.
  `tools/` is legal as an area name, never as a track.
- **Overviews.** Every new topic directory has an `overview.md` of about 150 to 400 words. A track folder that holds only
  subdirectories also needs an `overview.md`, so its parent page renders.
- **Generated indexes.** `_index.md` files come from `generate-indexes.ts`, never from hand edits.
- **Renames redirect.** Every URL rename adds an entry to `apps/ayokoding-www/src/redirects/learn-reorg.ts`; the
  propagation may edit that file for a rename row.
- **Front matter.** Present and conforming to the site's metadata standards in the `apps-ayokoding-www-developing-content`
  skill; missing front matter is a HIGH-confidence repair. The `author` field appears only on rants (`celoteh`).
- **Internal links.** Absolute paths with a language prefix (`/en/`, `/id/`), or relative `.md` paths, which
  `src/features/content/core/content-link-rewrite.ts` resolves; either form must reach an existing page.
- **Site compliance.** Bilingual content, structure, metadata, and linking follow the
  `apps-ayokoding-www-developing-content` skill; each tutorial gate applies this rule to its own pages too.

## Shared Tutorial Rules

These apply to every tutorial kind in [Tutorial Kinds](./ayokoding-www/tutorial-kinds.md):

- **Annotation density band.** 1.0 to 2.25 comment lines per code line, measured per example or code block; outside the
  band is a HIGH-confidence repair. Where an old fixer used another bound, this gate value wins and every fixer cites
  this adapter.
- **"Why It Matters" part.** Each example or worked example adds a "Why It Matters" part of 50 to 100 words after its
  key takeaway, per [Why It Matters Content](../../../conventions/writing/why-it-matters-content.md).
- **Annotation notation.** Values, intermediate states, and output are annotated inline with `// =>` (or the language's
  comment marker followed by `=>`).

## Related Documentation

- [Gate Adapters](README.md) — every adapter in this repository.
- [Tutorial Kinds](./ayokoding-www/tutorial-kinds.md) — the per-kind thresholds.
- [Quality Gate Adapter](../../workflow/quality-gate-adapter.md) — how this repository adopted the gates.
