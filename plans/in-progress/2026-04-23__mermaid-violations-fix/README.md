# Plan: Fix All Mermaid Diagram Violations

## Overview

The `rhino-cli docs validate-mermaid` tool — added in
`plans/done/2026-04-22__rhino-cli-mermaid-validation/` — currently reports
**1,095 violations and 30 warnings** across 605 files when run against the full
repository. Governance and `.claude/` are already clean (enforced by Nx target);
everything else is pre-existing technical debt.

This plan brings the full-repo violation count to zero through two complementary
approaches:

1. **Structural fixes** — shorten labels, restructure wide diagrams where doing so
   preserves or improves clarity.
2. **Suppression mechanism** — add `<!-- mermaid-skip -->` support to rhino-cli so
   intentionally complex diagrams (C4 context/component diagrams, broad architecture
   overviews) can be explicitly exempted with a one-line annotation rather than
   silently failing.

## Violation snapshot (2026-04-23)

| Type                         | Count     |
| ---------------------------- | --------- |
| `width_exceeded`             | 779       |
| `label_too_long`             | 316       |
| **Total violations**         | **1,095** |
| Warnings (`complex_diagram`) | 30        |

| Span distribution (width_exceeded) | Count |
| ---------------------------------- | ----- |
| 4 (just over threshold)            | 312   |
| 5                                  | 159   |
| 6                                  | 98    |
| 7–9                                | 121   |
| 10+                                | 89    |

| Area                            | Files with violations | Action            |
| ------------------------------- | --------------------- | ----------------- |
| `apps/ayokoding-web/content/`   | 244                   | Fix / suppress    |
| `docs/explanation/`             | 96                    | Fix / suppress    |
| `plans/done/`                   | 13                    | Add to `skipDirs` |
| `specs/apps/`                   | 9                     | Suppress (C4)     |
| `apps/oseplatform-web/content/` | 6                     | Fix / suppress    |
| `docs/reference/`               | 5                     | Fix               |
| `docs/how-to/`                  | 1                     | Fix               |

## Scope

**Subrepo**: `ose-public` — Scope A (subrepo worktree required per
[Subrepo Worktree Workflow Convention](../../../../governance/conventions/structure/subrepo-worktrees.md)).

## Documents

- [brd.md](./brd.md) — Why this work matters
- [prd.md](./prd.md) — Requirements and Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — Suppression mechanism design and fix strategy
- [delivery.md](./delivery.md) — Step-by-step execution checklist

## Guiding principle

> **Default to fix. Suppress only when structural equivalence cannot be preserved.**
>
> A diagram showing "4 parallel deployment targets" is communicating parallelism as
> content — restructuring it to a chain destroys the message. A diagram showing
> "step A → 4 intermediate steps → step B" can usually be chained without loss.
> Use judgment: if the wide layout is the point, suppress; if it is incidental, fix.
