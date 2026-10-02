---
description: >-
  The per-kind thresholds, layouts, and product rules the four tutorial quality gates apply to AyoKoding tutorials:
  by-example, in-the-field, primer, and annotated-concept.
when_to_use: >-
  Use when a tutorial quality gate or its propagation needs an AyoKoding count band, part length, layout, or overview
  rule.
---

# AyoKoding Tutorial Kinds

Part of the [AyoKoding WWW Gate Adapter](../ayokoding-www.md), whose shared tutorial rules (density band, "Why It
Matters", annotation notation) and site compliance apply to every kind below. A count below its floor is a
HIGH-confidence finding but needs authored content, so the propagation records it `needs-decision` rather than writing
examples.

## By Example

For the [Tutorial By Example Quality Gate](../../../../workflows/quality/tutorial-by-example-quality-gate.md):

- **Parts.** Five parts per example: brief explanation (2 to 3 sentences), a Mermaid diagram when appropriate, heavily
  annotated code, key takeaway (1 to 2 sentences), and "Why It Matters".
- **Example count.** 75 to 85 per tutorial, for about 95% coverage; fewer than 75 is a finding.
- **Diagram count.** 30 to 50 per tutorial, about 35% to 60% of examples; outside the band is a finding.
- **Layout.** `overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`, and `production.md` when present; each
  example heading is `### Example N: Title`.
- **Examples by Level.** `overview.md` holds a `## Examples by Level` heading with that exact text and level; its absence
  is CRITICAL. Every `### Example N: Title` on every level page appears as a bullet in the matching per-level block,
  with the verbatim heading as link text and an href of `<level-page-url>#<slug>`, the slug from `github-slugger` on the
  verbatim heading (as `rehype-slug` makes it). No bullet points to a missing anchor. A changed heading regenerates its
  bullet's text and slug; missing or stale bullets regenerate the whole section.
- **Range labels.** `(Examples N–M)` with an en-dash, never a hyphen.
- **Front matter and weights.** Complete front matter and correct page weights.

## In the Field

For the [Tutorial In the Field Quality Gate](../../../../workflows/quality/tutorial-in-the-field-quality-gate.md):

- **Guide count.** 20 to 40 guides; outside the band is a finding.
- **Diagram count.** 10 to 20, progression diagrams first.
- **Layout.** `overview.md` plus one `<topic>.md` per guide under `<language>/in-the-field/`.
- **Front matter.** Complete and correct.

## Primer

For the [Tutorial Primer Quality Gate](../../../../workflows/quality/tutorial-primer-quality-gate.md):

- **Example count.** 75 to 85, authored at By Example pace; 75 is a floor, never a cap.
- **Parts.** The By Example parts and lengths above.
- **Layout.** `just-enough-<x>/learning/` with `overview.md`, the example pages, `capstone/`, and `code/`.
- **Front matter.** Complete and correct.

## Annotated Concept

For the [Tutorial Annotated Concept Quality Gate](../../../../workflows/quality/tutorial-annotated-concept-quality-gate.md):

- **Mode.** A topic's format designation declares its mode. Leadership and governance topics use the no-code sub-mode,
  which has no `code/` directory; standard mode keeps colocated runnable files in `code/`.
- **Worked-example floor.** 45 (band 45 to 60) in standard mode; 20 scenarios (band 20 to 30) in no-code mode. Floors,
  never caps.
- **Density.** The shared band applies only to code-bearing worked examples.
- **Layout.** `<topic>/learning/` with `overview.md`, the worked-example pages, and `capstone/`.
- **Front matter.** Complete and correct.
