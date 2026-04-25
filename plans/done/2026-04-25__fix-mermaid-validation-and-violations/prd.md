# PRD — Fix Mermaid Violations

## Product Overview

This plan delivers **three things**:

1. **Direction-aware validator** (Phase 0): a code change to
   `apps/rhino-cli/internal/mermaid/validator.go` that uses `diagram.Direction` when
   selecting the dimension to check for `width_exceeded`. For `graph LR`/`RL`, the
   horizontal dimension is `depth`; for `graph TD`/`TB`/`BT`, it is `span` (current
   behaviour). The `complex_diagram` warning follows the same axis swap.

2. **Zero-violation docs** (Phase 1): edited markdown files in `docs/` where every
   mermaid block passes the updated validator. Errors targeted: `width_exceeded` and
   `label_too_long`.

3. **Governance propagation** (Phase 2): updates to
   `governance/conventions/formatting/diagrams.md` (via `repo-rules-maker`) documenting
   the direction-aware width rules and fix strategy guide so future contributors have a
   canonical reference.

## Personas

| Persona            | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| As a contributor   | A developer pushing commits to `ose-public` who wants clean validator output       |
| As a docs reader   | A learner reading `docs/` in GitHub preview or VS Code who needs readable diagrams |
| As a plan executor | The agent or human running the delivery checklist batch-by-batch                   |

## User Stories

**As a contributor**, I want the mermaid validator to check the correct axis per graph
direction so that LR diagrams are not falsely flagged for vertical height and deeply
chained LR diagrams that overflow horizontally are not silently passed.

**As a contributor**, I want zero validator errors on `docs/` files so that any future
expansion of the hook scope does not surface a backlog of pre-existing violations.

**As a docs reader**, I want diagrams that fit within their containers without horizontal
scrollbars so that I can read them without zooming or scrolling horizontally.

**As a plan executor**, I want each batch to be independently verifiable before committing
so that I can confirm my fixes are correct without running the full repo validator every
time.

## Requirements

### R1 — Direction-aware `width_exceeded` check with MaxWidth=4 (rhino-cli)

The validator must:

1. Select the horizontal dimension based on graph direction:
   - `graph LR` / `graph RL` → horizontal = **depth** (rank columns)
   - `graph TD` / `graph TB` / `graph BT` → horizontal = **span** (nodes per rank)
2. Apply `MaxWidth = 4` (raised from 3) to the horizontal dimension only.
3. Apply `MaxDepth = math.MaxInt` — no vertical limit. The `complex_diagram` warning
   branch is inactive by default; it only fires when a user explicitly passes
   `--max-depth N` via CLI.

### R2 — Zero `width_exceeded` errors in docs

After Phase 0, all mermaid diagrams in `docs/` must pass the updated check:
horizontal dimension (span for TD, depth for LR) ≤ 4.

### R3 — Zero `label_too_long` errors

All mermaid node labels must be ≤ 30 raw characters per line (measured after
splitting on `<br/>`, before HTML-entity decoding). The constraint applies to each
individual line of a multi-line label separately.

### R4 — Semantic preservation

Every fixed diagram must convey the same information as the original. Content
removed from a label must appear in surrounding prose. Relationships between
nodes must not change.

### R5 — No regressions

Files not listed in the audit must continue to pass. Each batch commit must leave
the validator result for that batch's files at zero errors before moving to the
next batch.

### R6 — Governance convention documents width constraints and fix strategies

`governance/conventions/formatting/diagrams.md` must be updated (via `repo-rules-maker`)
to include:

1. A "Flowchart Width Constraints" section documenting:
   - MaxWidth = 4 (horizontal nodes, direction-aware)
   - Span vs. depth explained with the direction-aware rule (LR→depth horizontal,
     TD→span horizontal)
   - Label length: 30 raw chars per line (validator enforcement) vs. ~20 chars
     (rendering clip)
   - Reference to `rhino-cli docs validate-mermaid` for automated enforcement
2. A "Width Violation Fix Strategy Guide" section summarizing all fix strategies
   (direction flip, sequential chaining, diagram splitting, label shortening) with
   a selection decision tree
3. An update to the "Diagram Orientation" section: soften the "MUST use TD" rule to
   allow LR when it reduces horizontal width below MaxWidth=4
4. Removal of duplicate Error 7 (identical to Error 5)
5. Clarification of the label length discrepancy: validator enforces 30 raw chars;
   rendering clips at ~20 chars for displayed text

The `repo-rules-quality-gate` must pass in strict mode after these changes.

## Product Scope

**In scope**:

- Direction-aware `width_exceeded` logic in `validator.go` (Phase 0)
- Direction-aware test cases in `validator_test.go` (Phase 0)
- Fixing `width_exceeded` and `label_too_long` violations in affected `docs/` files
  after Phase 0 re-audit (Phase 1)
- Preserving diagram semantics (node relationships, information content)
- Updating `governance/conventions/formatting/diagrams.md` with width constraints
  and fix strategy guide (Phase 2, via `repo-rules-maker`)

**Out of scope**:

- `complex_diagram` warnings as a separate concern — they disappear after MaxDepth=math.MaxInt
- Adding new threshold parameter types beyond MaxWidth/MaxDepth/MaxLabelLen
- Changes to `.claude/` files — audited clean; governance changes are limited to
  `governance/conventions/formatting/diagrams.md` (Phase 2 only)
- Extending the pre-push hook to scan `docs/`
- Adding new diagrams or expanding documentation content

## Product Risks

| Risk                                                                 | Impact | Note                                                                                                   |
| -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Diagram restructuring loses semantic meaning                         | High   | Re-read surrounding prose alongside each fix; preserve all node relationships                          |
| Batch validation grep misses a fixed file (silent false pass)        | Medium | Grep patterns must cover all subdirectory variants — verify with raw validator output                  |
| Executor applies wrong fix strategy (visual change, not topological) | Medium | Strategy selection guide in tech-docs.md must be followed; changing direction alone does not fix width |

## Acceptance Criteria

```gherkin
Feature: Direction-aware mermaid validation in rhino-cli

  Background:
    Given I am at the root of the ose-public repository

  Scenario: LR diagram wide in depth triggers width_exceeded
    Given a graph LR diagram with depth 6 and span 2
    When I run the mermaid validator
    Then a width_exceeded violation is reported for that diagram

  Scenario: LR diagram tall in span does not trigger width_exceeded
    Given a graph LR diagram with span 4 and depth 2
    When I run the mermaid validator
    Then no width_exceeded violation is reported for that diagram

  Scenario: TD diagram wide in span triggers width_exceeded
    Given a graph TD diagram with span 5 and depth 2
    When I run the mermaid validator
    Then a width_exceeded violation is reported for that diagram

  Scenario: TD diagram deep in depth does not trigger width_exceeded
    Given a graph TD diagram with depth 4 and span 2
    When I run the mermaid validator
    Then no width_exceeded violation is reported for that diagram

Feature: Mermaid diagram compliance in docs/

  Background:
    Given I am at the root of the ose-public repository
    And the direction-aware validator is installed (Phase 0 complete)

  Scenario: No error files remain after all Phase 1 batches
    When I run `go run ./apps/rhino-cli/main.go docs validate-mermaid`
    Then no output line starts with "✗"

  Scenario: No width_exceeded errors remain
    When I run `go run ./apps/rhino-cli/main.go docs validate-mermaid`
    Then no output line contains "[width_exceeded]"

  Scenario: No label_too_long errors remain
    When I run `go run ./apps/rhino-cli/main.go docs validate-mermaid`
    Then no output line contains "[label_too_long]"

  Scenario: Diagram relationships are preserved
    Given a diagram that was refactored to fix a width_exceeded error
    When I read the surrounding prose and the fixed diagram together
    Then all node relationships present in the original diagram are still represented

Feature: Mermaid width constraints documented in governance convention

  Background:
    Given I am at the root of the ose-public repository
    And Phase 2 (governance propagation) is complete

  Scenario: diagrams.md documents direction-aware width constraints
    When I read governance/conventions/formatting/diagrams.md
    Then it contains a section documenting MaxWidth=4 as the horizontal limit
    And it explains that horizontal dimension is direction-aware
    And it states LR/RL diagrams use depth as horizontal
    And it states TD/TB/BT diagrams use span as horizontal

  Scenario: diagrams.md contains the fix strategy guide
    When I read governance/conventions/formatting/diagrams.md
    Then it contains a fix strategy section with direction flip as the first strategy
    And it describes sequential chaining as a structural fix option
    And it describes diagram splitting as an alternative fix
    And it includes a selection decision tree

  Scenario: repo-rules-quality-gate passes after Phase 2
    When I run the repo-rules quality gate in strict mode
    Then it reports zero CRITICAL, HIGH, and MEDIUM findings
```
