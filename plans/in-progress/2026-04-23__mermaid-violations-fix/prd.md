# PRD: Fix All Mermaid Diagram Violations

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
    Given a markdown file where <!-- mermaid-skip --> appears two lines before the block
    When I run docs validate-mermaid on that file
    Then the block is validated normally
    And violations are reported if rules are violated

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
