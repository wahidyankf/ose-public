# Rhino-CLI Mermaid Validator Fixes

## Overview

The `rhino-cli docs validate-mermaid` command — used in the pre-push hook to keep
diagrams within mobile-friendly rendering limits — has three gaps that allow
non-renderable diagrams through:

1. **Scope gap**: `plans/` is not in the default scan path. Plan diagrams (which
   often start as detailed working drafts) are never validated, even if they are
   eventually copied into `docs/` or `governance/`.
2. **Parser bug**: Mermaid's `&` multi-target edge operator
   (`A --> B & C & D`) is not expanded. Only the first target after each arrow is
   captured, so rank assignment is incorrect and width violations can go undetected.
3. **Rendering blind spot**: `MaxWidth=4` is a max-nodes-per-rank proxy. It does not
   account for subgraph density — a subgraph with 6+ children renders with a wide
   bounding box on mobile even if no single rank has 5+ nodes.

These three issues combined to let the diagrams in
`plans/in-progress/2026-04-26__organiclever-ci-staging-split/tech-docs.md` reach
8-job-wide subgraphs without any pre-push warning.

## Scope

Single subrepo: `ose-public`. Files changed:

- `apps/rhino-cli/cmd/docs_validate_mermaid.go` — add `plans/` to default scan dirs
- `apps/rhino-cli/internal/mermaid/parser.go` — expand `&` multi-target operator;
  replace `subgraph`/`end` skip logic (lines 76–79) with stateful stack walk to
  capture subgraph membership
- `apps/rhino-cli/internal/mermaid/validator.go` — new `MaxSubgraphNodes` rule
  (default 6; warning, not violation)
- `apps/rhino-cli/internal/mermaid/types.go` — new `WarningKind` constant +
  `Warning` field for subgraph density
- `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature` — eight new scenarios
  across phases 1–3 (one per basic fix + regression coverage)
- `apps/rhino-cli/internal/mermaid/reporter.go` — add formatting branch for
  `WarningSubgraphDense`
- `apps/rhino-cli/internal/mermaid/parser_test.go` — unit tests for `&` expansion
- `apps/rhino-cli/internal/mermaid/reporter_test.go` — format test for
  `WarningSubgraphDense`
- `apps/rhino-cli/internal/mermaid/validator_test.go` — unit tests for subgraph rule
- `apps/rhino-cli/cmd/docs_validate_mermaid_test.go` — unit tests for plans scope

No new Nx projects, no agents, no governance conventions added.

## Navigation

| Document                       | Contents                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, risk analysis, success criteria            |
| [prd.md](./prd.md)             | User stories, Gherkin acceptance criteria, product constraints |
| [tech-docs.md](./tech-docs.md) | Code locations, before/after diffs, design decisions           |
| [delivery.md](./delivery.md)   | Step-by-step execution checklist                               |

## Manual Prerequisites

None. All work is local code changes + tests; no external configuration.

## Phases at a Glance

| Phase | Work                                                           | Status |
| ----- | -------------------------------------------------------------- | ------ |
| 1     | Add `plans/` to default scan dirs + spec scenario + unit test  | done   |
| 2     | Expand `&` multi-target operator in `extractEdgeLine` + tests  | done   |
| 3     | New `MaxSubgraphNodes` warning rule + spec scenario + tests    | done   |
| 4     | Run validator against existing plan diagrams; surface findings | done   |
| 5     | Local quality gates (Nx test, coverage ≥ 90%, lint)            | done   |
| 6     | Push + CI verification                                         | done   |
