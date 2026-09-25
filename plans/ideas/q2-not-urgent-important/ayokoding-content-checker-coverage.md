# AyoKoding content-checker coverage

One-line summary: enforce the canonical topic-tree shape in the AyoKoding content checkers, and add a
dedicated by-concept checker once that track is mature.

> Surfaced 2026-05-22 during ayokoding-web-learn-reorg execution.

## Problem / context

The learn reorg established a canonical topic shape —
`<domain>/<area>/<topic>/{overview.md, by-example/, by-concept/, in-the-field/}` — but nothing
validates it: a topic can drift from the shape and no checker notices. **Data point:** the canonical
tree has 4 required parts and 0 checkers currently enforce the shape; of the 3 content tracks, 2
(by-example, in-the-field) have structural checkers while by-concept has 0.

## Why now

The canonical shape now exists as a convention, so the gap between "documented shape" and "enforced
shape" is live — every new topic is an opportunity to drift.

## Prior art / precedents

- **Existing AyoKoding structural checkers** — the `by-example` and `in-the-field` checkers already
  validate per-track content shape; this extends that idea to the canonical topic tree.
  [by-example-checker](../../../.agents/agents/apps-ayokoding-www-by-example-checker.md)
- **Maker-Checker-Fixer pattern** — the repo's standard three-stage quality workflow a
  shape-enforcement checker plugs into.
  [pattern](../../../repo-governance/development/pattern/maker-checker-fixer.md)
- **Diátaxis framework convention** — establishes a documented content shape as the thing checkers
  enforce, exactly the "documented vs enforced" gap this idea closes.
  [diataxis](../../../repo-governance/conventions/structure/diataxis-framework.md)
- **markdownlint** — prior art for mechanically validating documentation structure against declared
  rules. [markdownlint](https://github.com/DavidAnson/markdownlint)

## Proposed direction (sketch)

- Add canonical-shape enforcement rules to `apps-ayokoding-www-by-example-checker` and
  `apps-ayokoding-www-in-the-field-checker`: validate each checked topic follows the tree shape.
- Create `apps-ayokoding-www-by-concept-checker` once the by-concept track has enough coverage to
  warrant dedicated structural validation.

## Rough scope & non-goals

In scope: shape-enforcement rules in the existing checkers; a possible new by-concept checker agent.

Out of scope (for now): authoring the content itself; the `id/` (Indonesian) tree, which uses a
different `belajar/` structure and needs no parallel shape.

## Risks & open questions

- Does the by-concept track have enough coverage yet to justify its own checker, or is that premature?
  (open)
- Is the canonical shape stable, or still shifting as the reorg settles? (open — enforcing an unstable
  shape creates churn)

## What success looks like + promotion signal

Success: a misplaced or misshapen topic fails a checker automatically. Ready to promote the
shape-enforcement rules now-ish; hold the by-concept checker until that track's coverage is sufficient.
