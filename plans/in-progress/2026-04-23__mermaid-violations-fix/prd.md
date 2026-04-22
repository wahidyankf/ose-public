# PRD: Fix All Mermaid Diagram Violations

## Product overview

The `rhino-cli docs validate-mermaid` command validates Mermaid flowchart
diagrams in markdown files. It currently reports 1,095 violations across the
full repository, causing the pre-push hook to block any author who touches a
file with a pre-existing violation — even when that author did not introduce
it.

This plan delivers two product changes: (1) a suppression mechanism so
intentionally complex diagrams can be explicitly exempted, and (2) a full
remediation pass that brings the full-repo violation count to zero. After this
plan, `docs validate-mermaid .` exits 0, the pre-push hook no longer produces
false blocks, and every suppressed diagram is annotated with an auditable
`<!-- mermaid-skip -->` comment.

## Personas

**Documentation author** — writes and edits markdown files in `docs/`,
`apps/ayokoding-web/content/`, `apps/oseplatform-web/content/`. Affected by
the pre-push hook block when their commit happens to touch a file with a
pre-existing violation.

**Pre-push hook executor** — the automated hook that runs
`docs validate-mermaid --changed-only` before every push. When the full-repo
baseline has 1,095 violations, any commit touching a violating file trips the
hook regardless of whether the author caused the violation.

**Diagram reviewer** — reads or reviews architecture and flow diagrams in the
repo. Benefits from structural fixes (shorter labels, chained layouts) that
improve readability, and from auditable suppressions that make intentional
exemptions visible.

**rhino-cli maintainer** — maintains the `docs validate-mermaid` command.
Needs the suppression mechanism to be correctly integrated with the existing
extractor/validator/reporter pipeline.

## User stories

**As a documentation author**, I want to annotate intentionally complex diagrams
with `<!-- mermaid-skip -->` so that the validator does not block my push for a
diagram whose wide layout is semantically meaningful.

**As a pre-push hook executor**, I want `docs validate-mermaid --changed-only`
to exit 0 on any file that does not introduce a new violation, so that authors
are only blocked by violations they actually introduced.

**As a diagram reviewer**, I want suppressed blocks to be visibly annotated in
the source so that I can audit which diagrams have been exempted and why.

**As the rhino-cli maintainer**, I want the suppression mechanism to integrate
cleanly with the existing extractor → validator → reporter pipeline so that
skipped blocks are counted in the summary line alongside violations and
warnings.

## Product scope

### In scope

- Adding `<!-- mermaid-skip -->` suppression support to `docs validate-mermaid`
- Remediating all 1,095 violations across the full repository (fix or suppress)
- Adding `done/` to `skipDirs` so archived plans are never scanned
- Widening the `validate:mermaid` Nx target from `governance/ .claude/` to `.`
- Adding Gherkin scenarios and tests for the suppression mechanism

### Out of scope

- Changing the 30-character label length threshold
- Changing the 3-node parallel width threshold
- Fixing violations in other repositories (`ose-infra`, `ose-primer`)
- Adding suppression support for non-flowchart block types (sequenceDiagram,
  classDiagram, etc.) — those are already ignored by the validator
- A UI or CLI flag to list all suppressed blocks across the repo

## Product risks

**Suppression overuse**: Once `<!-- mermaid-skip -->` is available, authors may
suppress diagrams that could be structurally fixed, eroding the enforcement
signal over time. Mitigation: the decision matrix in tech-docs.md sets clear
guidance on when suppression is appropriate versus structural fix; periodic
audits of suppressed block counts are recommended.

**False exclusions via `done/` skip**: Using `"done"` as the bare basename skip
key means any future directory named `done` anywhere in the repo will be
silently excluded from validation scans. Mitigation: documented in tech-docs.md
with a note to upgrade to full relative-path matching if a second `done/`
directory is added.

## Requirements

### R1 — Suppression mechanism

The `docs validate-mermaid` command must honour a `<!-- mermaid-skip -->` HTML
comment placed on the line immediately before a fenced mermaid block. A skipped
block is:

- Counted in `BlocksScanned`.
- Excluded from violation and warning output.
- Shown in the summary line as "N skipped".

The suppression comment must survive Prettier formatting (HTML comments in
markdown are not modified by Prettier).

### R2 — Zero violations on full-repo scan

After all fixes and suppressions are applied:

```
rhino-cli docs validate-mermaid .
```

exits 0 with 0 violations. Warnings (`complex_diagram`) are acceptable.

### R3 — Structural fixes preferred over suppression

For diagrams where the wide layout is incidental (span 4–6, restructuring
preserves meaning), the diagram must be restructured rather than suppressed.
Suppression is reserved for diagrams where the wide layout is the content (C4
context/component, parallel-targets architecture overviews, intentional
comparison grids).

### R4 — No regression

- `rhino-cli test:quick` passes (≥90% coverage).
- `rhino-cli lint` passes (0 issues).
- `rhino-cli spec-coverage` passes.
- `rhino-cli validate:mermaid` (governance/.claude/ scope) still passes.

### R5 — Gherkin scenarios updated

New scenarios for the suppression mechanism added to
`specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature` and covered by
unit + integration tests.

## Acceptance criteria (Gherkin)

````gherkin
Feature: mermaid-skip suppression

  @docs-validate-mermaid
  Scenario: suppressed block produces no violation
    Given a markdown file containing:
      """
      <!-- mermaid-skip -->
      ```mermaid
      flowchart LR
        A --> B --> C --> D --> E
      ```
      """
    When I run docs validate-mermaid on that file
    Then exit code is 0
    And violations count is 0
    And warnings count is 0
    And blocks scanned is 1
    And skipped count is 1

  @docs-validate-mermaid
  Scenario: non-adjacent skip comment does not suppress
    Given a markdown file where <!-- mermaid-skip --> appears two lines before a flowchart block with 4 parallel nodes
    When I run docs validate-mermaid on that file
    Then exit code is 1
    And violations count is 1

  @docs-validate-mermaid
  Scenario: skip comment on a non-flowchart block has no effect
    Given a markdown file with <!-- mermaid-skip --> before a sequenceDiagram block
    When I run docs validate-mermaid on that file
    Then exit code is 0
    And skipped count is 0

  @docs-validate-mermaid
  Scenario: full repo scan exits zero after all fixes applied
    Given the ose-public repository with all fixes from this plan applied
    When I run docs validate-mermaid with path "."
    Then exit code is 0
    And violations count is 0
````
