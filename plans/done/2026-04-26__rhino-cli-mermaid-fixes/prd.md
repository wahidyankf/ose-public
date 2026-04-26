# Product Requirements Document

## Product Overview

This plan delivers three targeted fixes to the `rhino-cli docs validate-mermaid`
command. First, the default scan directories are expanded to include `plans/` so
plan diagrams receive the same mobile-readability checks as `docs/` and `governance/`
content. Second, the `&` multi-target edge operator is correctly parsed into a
Cartesian product of edges, fixing silently incorrect rank-width calculations for
any diagram using Mermaid's fan-out shortcut. Third, a new `MaxSubgraphNodes`
subgraph density warning (default threshold: 6 nodes) flags subgraphs that render
as excessively wide bounding boxes on mobile even when individual rank-widths pass
the existing `MaxWidth` rule.

## Personas

**Maintainer as developer** — pushes a branch with new Mermaid diagrams (in `docs/`,
`governance/`, or `plans/`). The pre-push hook runs
`rhino-cli docs validate-mermaid --changed-only` and must catch diagrams that will
render poorly on mobile **before** the push reaches `main`.

**Maintainer as plan author** — writes 5-document plans in `plans/in-progress/` that
include detailed Mermaid architecture diagrams. Currently those diagrams are never
validated; after this plan, they go through the same checks as `docs/`.

**Maintainer as CLI maintainer** — owns `apps/rhino-cli`. Wants narrowly scoped fixes
with high test coverage, no surprise behaviour changes for diagrams that did not use
the `&` operator or had small subgraphs.

## User Stories

**US-1 — Plans are validated**
As a developer pushing a plan with Mermaid diagrams I want
`rhino-cli docs validate-mermaid` to scan my plan files by default, so that the
pre-push hook catches over-wide diagrams in `plans/` the same way it catches them
in `docs/`.

**US-2 — `&` multi-target edges produce correct rank-width**
As a CLI maintainer I want `extractEdgeLine` to expand Mermaid's `&` shortcut
(`A --> B & C & D` becomes three edges) so that rank-width reflects the true
fan-out and the existing `MaxWidth=4` rule fires when it should.

**US-3 — Wide subgraphs flagged**
As a developer I want a warning when a subgraph contains more than 6 child nodes
so that I can identify subgraphs that will render poorly on mobile before pushing.

**US-4 — Existing diagrams checked against new rules**
As the maintainer I want a one-shot run of the new validator against
`plans/in-progress/2026-04-26__organiclever-ci-staging-split/` and
`docs/reference/system-architecture/` so any pre-existing violations are surfaced
and tracked.

## Acceptance Criteria

```gherkin
Feature: Rhino-CLI Mermaid Validator Fixes

  Scenario: Plans directory is scanned by default
    Given a markdown file under plans/ containing a Mermaid flowchart with a label longer than 30 characters
    When the developer runs docs validate-mermaid without path arguments
    Then the command exits with a failure code
    And the output identifies the file under plans/

  Scenario: A multi-target edge with the & operator expands into separate edges
    Given a markdown file with a flowchart line "A --> B & C & D"
    When the parser processes the file
    Then three edges are produced: A→B, A→C, A→D
    And nodes B, C, D each have an in-edge from A

  Scenario: Multi-source and multi-target on both sides expand into a Cartesian product
    Given a markdown file with a flowchart line "A & B --> C & D"
    When the parser processes the file
    Then four edges are produced: A→C, A→D, B→C, B→D

  Scenario: A 5-target fan-out triggers width violation under default threshold
    Given a markdown file with a flowchart "T --> A & B & C & D & E"
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the rank with 5 parallel nodes

  Scenario: A subgraph with 7 child nodes emits subgraph density warning
    Given a markdown file containing a flowchart with a subgraph that holds 7 child nodes
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output contains a warning about subgraph density

  Scenario: A subgraph with 6 children passes default threshold
    Given a markdown file containing a flowchart with a subgraph that holds exactly 6 child nodes
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output contains no subgraph density warning

  Scenario: Subgraph density threshold is configurable
    Given a markdown file containing a flowchart with a subgraph that holds 5 child nodes
    When the developer runs docs validate-mermaid with --max-subgraph-nodes 4
    Then the command exits successfully
    And the output contains a warning about subgraph density

  Scenario: Existing diagrams without & or large subgraphs are unaffected
    Given a markdown file with a flowchart using only single-target edges and small subgraphs
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no new violations or warnings introduced by these fixes
```

## Product Constraints

**Backwards-compatible parsing.** Existing diagrams that do not use `&` must produce
the same edge set as before. Tests must explicitly cover this.

**Subgraph density is a warning, not a violation.** First-ship behaviour is to warn
but not block. If the warning proves accurate and useful, a follow-up plan can promote
it to a violation.

**Default thresholds**:

- `MaxSubgraphNodes` defaults to **6** (one above current OrganicLever workflow shape;
  conservative, mobile-friendly).
- `MaxWidth` and `MaxLabelLen` defaults are **unchanged** (4 and 30 respectively).

**Flag naming**: `--max-subgraph-nodes` (kebab-case, consistent with existing
`--max-label-len`, `--max-width`, `--max-depth`).

**Scope expansion**: `collectMDDefaultDirs` adds `plans/` only. `apps/`, `libs/`,
`apps-labs/`, `archived/` are intentionally excluded — those READMEs and other
markdown files do not use Mermaid for architectural intent.

**Rendering simulation**: not in scope. `MaxSubgraphNodes` is a node-count proxy. A
true SVG-width estimator is out of scope for this plan.

**Coverage**: `apps/rhino-cli` enforces ≥ 90% coverage via
`rhino-cli test-coverage validate`. Each fix lands with sufficient unit test
coverage to maintain the threshold.

## Product Risks

| Risk                                                                      | Notes                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope expansion breakage — `plans/` scan surfaces pre-existing violations | Diagrams in `plans/in-progress/` that were previously unchecked may now fail the pre-push hook. Phase 4 treats these as discovery; they are addressed in follow-up commits, not here.                                              |
| `&` expansion regression in existing diagrams                             | Any diagram that happens to use `&` as part of a node label (not the Mermaid shortcut) could be mis-parsed after the change. Backwards-compatibility tests in Phase 2 must cover this.                                             |
| `MaxSubgraphNodes` default of 6 too tight for existing corpus             | If many existing diagrams have subgraphs with 7+ nodes, the warning volume could be high and prompt a threshold re-negotiation mid-plan. The warning-only (non-blocking) policy and the `--max-subgraph-nodes` flag mitigate this. |

## Out of Scope

- Splitting existing plan diagrams that fail the new rules — surface them in
  Phase 4, address as separate commits or a follow-up plan.
- Render-width simulation or actual SVG measurement.
- Changes to non-default thresholds (`MaxLabelLen`, `MaxWidth`, `MaxDepth`).
- Pre-push hook script changes (the hook already calls the right Nx target).
- New reporter formats or CLI output changes.
- `ose-infra`, `ose-primer` changes.
