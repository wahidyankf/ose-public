# Plan: rhino-cli Mermaid Diagram Validation

## Overview

Add `rhino-cli docs validate-mermaid` command that enforces three structural rules on
Mermaid flowchart diagrams embedded in markdown files. Integrate the validator into the
pre-push hook so only changed `.md` files are checked during push (PR quality-gate).

## Status

🟡 In Progress

## Scope

Single subrepo: `ose-public`. Files changed:

- `apps/rhino-cli/` — new command + internal package
- `specs/apps/rhino/cli/gherkin/` — new feature file + README update
- `.husky/pre-push` — conditional mermaid validation block
- `apps/rhino-cli/README.md` — document new command
- `apps/rhino-cli/project.json` — add `validate:mermaid` Nx target
- `apps/rhino-cli/cmd/testable.go` — add `docsValidateMermaidFn` delegation
- `governance/conventions/formatting/diagrams.md` — reference new validator

## The Three Rules

| #   | Rule                                                                        | Default limit          | Flag(s)                      |
| --- | --------------------------------------------------------------------------- | ---------------------- | ---------------------------- |
| 1   | Node label text must not exceed max character count                         | 30 chars               | `--max-label-len`            |
| 2   | Flowchart perpendicular span (max nodes at same rank) must not exceed limit | 3 nodes (see Rule 2 ✱) | `--max-width`, `--max-depth` |
| 3   | Each mermaid code block must contain exactly one diagram                    | n/a                    | n/a                          |

✱ **Rule 2 — both-dimensions warning path**: When BOTH the perpendicular span exceeds
`--max-width` AND the diagram depth (number of ranks along the flow axis) exceeds
`--max-depth` (default 5), the validator emits a **warning** (exit 0 with message) rather
than a violation error (exit 1). Such diagrams are intentionally complex architectural
overviews with no single clear fix — authors are advised to consider simplifying but are
not blocked. When only the span is exceeded (depth ≤ `--max-depth`), the violation is a
hard error (exit 1) because the fix is clear: reduce parallel nodes at the overloaded rank.

**Rule 2 — perpendicular span by direction** (confirmed against Dagre/Mermaid docs):

| Direction          | Flow axis    | Each rank is a… | Perpendicular span =        | What the limit controls |
| ------------------ | ------------ | --------------- | --------------------------- | ----------------------- |
| `TB` / `TD` / `BT` | vertical ↕   | horizontal row  | nodes side-by-side in a row | diagram WIDTH           |
| `LR` / `RL`        | horizontal ↔ | vertical column | nodes stacked in a column   | diagram HEIGHT          |

**The depth (number of ranks along the flow axis) is NOT independently limited.** A 20-step
sequential chain has perpendicular span = 1 at every rank and always passes. Depth only becomes
relevant when the perpendicular span is ALSO exceeded — that combination triggers a warning instead
of a hard failure (see ✱ above).

**The rank-assignment algorithm is direction-independent** (Dagre computes ranks topologically;
`rankdir`/direction is a post-computation rendering transform). The same Kahn's BFS runs for
all five direction keywords — direction only changes which screen axis maps to depth vs. span.

**Rule 1 — label length basis**: Mermaid's `wrappingWidth` config defaults to 200 px. At the default 16 px
sans-serif font, approximately 28–30 characters fill 200 px. The default of 30 chars is grounded in this
official Mermaid configuration value. This repo's `governance/conventions/formatting/diagrams.md` sets a
stricter 20-char limit for Hugo/Hextra production diagrams; use `--max-label-len 20` to enforce that.

## Navigation

| Document                       | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale — why this rule set matters              |
| [prd.md](./prd.md)             | Product requirements + Gherkin acceptance criteria          |
| [tech-docs.md](./tech-docs.md) | Implementation design: parser, graph algorithm, command API |
| [delivery.md](./delivery.md)   | Granular step-by-step checklist                             |

## Key Decisions

- **No external library**: Both available Go Mermaid parsers (`sammcj/go-mermaid`, `tetrafolium/mermaid-check`) are pre-v0.1 with low adoption. Custom regex + recursive-descent parser used instead.
- **Both `flowchart` and `graph` keywords**: Mermaid treats them as full aliases; validator accepts both.
- **`--staged-only`** available for manual invocation or future pre-commit integration; **`--changed-only`** (checks `@{u}..HEAD`) is wired into the pre-push hook in this plan. Pre-commit hook wiring for `--staged-only` is out of scope for this iteration.
- **Flowchart-only scope — all other diagram types silently skipped**: Only `flowchart` and
  `graph` keyword blocks are validated. `sequenceDiagram`, `classDiagram`, `gantt`, `gitGraph`,
  `pie`, `mindmap`, `timeline`, `quadrantChart`, `xychart-beta`, and any future Mermaid diagram
  types are silently ignored. The extractor returns blocks, but the parser returns `count=0` for
  any block whose first non-blank line does not match the flowchart/graph header regex — the
  validator then skips the block entirely. This is a hard design constraint, not a TODO.
- **Subgraph headers not counted as nodes** in width calculation (only actual node declarations count).
- **Subgraph direction override**: Per Mermaid docs, a subgraph `direction LR` override is
  **voided** when any node inside links to a node outside the subgraph — the subgraph then
  inherits the parent direction. The validator treats all nodes as belonging to the parent
  diagram's rank structure (simpler, conservative, matches the most common case). Isolated
  subgraphs with no cross-boundary edges are edge cases that are out of scope for v1.
- **BT and RL are rank-equivalent to TB and LR**: Dagre assigns rank 0 to sources regardless
  of direction; `BT`/`RL` just flip which end of the screen rank 0 appears on. Same algorithm.
- **Read-only checker — no auto-fix**: The command reads files and reports conformance. It
  never modifies any file. Auto-fixing is explicitly out of scope for all versions of this tool.
- **Both-exceeded → warning, not error**: When span > `--max-width` AND depth > `--max-depth`
  simultaneously, the validator emits a `WarningComplexDiagram` (exit 0 with message) instead of
  `ViolationWidthExceeded` (exit 1). Depth alone exceeding `--max-depth` is not enforced. The
  `Warning` type is separate from `Violation`; exit 1 fires only when `len(Violations) > 0`.
  Default `--max-depth 5` means a 6+-rank diagram with 4+ wide nodes triggers the warning path.
