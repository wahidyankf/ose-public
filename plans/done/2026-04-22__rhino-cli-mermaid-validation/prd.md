# PRD: Mermaid Diagram Validation

## Product Overview

This product addition extends `rhino-cli` with a `docs validate-mermaid` sub-command that
enforces three structural rules on Mermaid flowchart diagrams embedded in markdown files.
The command is integrated into the pre-push hook so only changed `.md` files are checked
during each push, keeping the gate fast. It also supports `--staged-only` for manual
pre-commit invocation and direct path arguments for targeted validation.

## Personas

| Persona                    | Description                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation Author       | Writes markdown with embedded Mermaid diagrams; pushes to `main`; wants immediate feedback on diagrams before they render badly in GitHub or Hugo/Hextra |
| rhino-cli Consumer         | Invokes `rhino-cli docs validate-mermaid` directly from the command line for targeted validation of specific files or directories                        |
| Pre-push / Pre-commit Hook | Automated invocation via `.husky/pre-push` (with `--changed-only`) or manually via pre-commit (with `--staged-only`) — needs fast, reliable exit codes   |
| Plan Executor Agent        | Runs the delivery checklist steps; invokes the CLI commands and quality gates as specified in this plan                                                  |

## User Stories

**Story 1 — Documentation Author**

As a documentation author,
I want to receive immediate feedback when a Mermaid flowchart diagram in my markdown
file has a label that is too long, a rank that is too wide, or contains two diagrams in
one block,
so that I can fix the issue before it renders badly on GitHub or the production website.

**Story 2 — rhino-cli Consumer**

As a rhino-cli consumer,
I want to run `docs validate-mermaid` on specific files or directories,
so that I can validate diagrams in targeted files without triggering a full repository scan.

**Story 3 — CI / Pre-push Hook Consumer**

As the pre-push hook,
I want to validate only the markdown files changed in the current push range using the
`--changed-only` flag,
so that the gate is fast and only relevant files are checked without slowing down every push.

## Product Scope

### In Scope

- CLI sub-command `rhino-cli docs validate-mermaid` with three enforced rules:
  Rule 1 (label length), Rule 2 (max parallel rank width), Rule 3 (single diagram per block)
- Configurable thresholds via `--max-label-len` and `--max-width` flags
- Three output formats: text (default), JSON (`-o json`), markdown (`-o markdown`)
- Selective file scanning: `--staged-only`, `--changed-only`, positional path arguments
- Integration into `.husky/pre-push` via `--changed-only`
- Nx target `validate:mermaid` for direct invocation
- Both `flowchart` and `graph` keyword aliases supported

### Out of Scope

- Auto-fixing diagram violations (validator reports only)
- Validating non-flowchart Mermaid types (sequenceDiagram, classDiagram, gantt, etc.)
- Validating Mermaid syntax correctness beyond the three structural rules
- Edge-weight labels or link text length validation
- Automatic pre-commit hook wiring (flag available for manual/future use)
- Independent depth-only enforcement: `depth > --max-depth` without simultaneous width
  violation (`span > --max-width`) produces no warning or error

## Product Risks

| Risk                                 | Description                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| False negatives for new shapes       | Custom regex parser may not detect labels in new Mermaid node shapes added in future versions, causing silent false negatives   |
| Unexpected `--changed-only` fallback | When no upstream is set (`@{u}` fails), `--changed-only` silently falls back to full scan; callers may not expect this behavior |
| JSON schema forward-compatibility    | The JSON output schema adds a surface area that consumers may depend on; future schema changes risk breaking downstream tools   |

## Command API

```
rhino-cli docs validate-mermaid [flags] [paths...]
```

When no `[paths...]` given, scans default directories: `docs/`, `governance/`, `.claude/`,
and repo root `*.md`.

### Flags

| Flag                | Default | Description                                                                                                             |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--staged-only`     | false   | Only validate files staged in git (pre-commit use)                                                                      |
| `--changed-only`    | false   | Only validate files changed in `@{u}..HEAD` (pre-push use)                                                              |
| `--max-label-len N` | 30      | Max chars in a node label before violation                                                                              |
| `--max-width N`     | 3       | Max nodes at the same rank before violation                                                                             |
| `--max-depth N`     | 5       | Depth threshold for the both-exceeded warning path: when span > max-width AND depth > max-depth, emit warning not error |
| `-o, --output`      | text    | Output format: `text`, `json`, `markdown`                                                                               |
| `-v, --verbose`     | false   | Include per-file detail in text output                                                                                  |
| `-q, --quiet`       | false   | Suppress non-error output                                                                                               |

### Exit codes

| Code | Meaning                                                              |
| ---- | -------------------------------------------------------------------- |
| 0    | No violations (may include warnings — warnings do not cause failure) |
| 1    | One or more violations found                                         |
| 2    | Command invocation error                                             |

---

## Acceptance Criteria (Gherkin)

```gherkin
@docs-validate-mermaid
Feature: Mermaid Flowchart Structural Validation

  As a documentation author
  I want to detect structural issues in Mermaid flowchart diagrams
  So that diagrams render correctly and are readable in all viewers

  # ── Rule 1: Label length ────────────────────────────────────────────────

  Scenario: A flowchart with all short node labels passes validation
    Given a markdown file containing a flowchart where every node label is within the limit
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A node label exceeding the character limit is flagged
    Given a markdown file containing a flowchart with a node label longer than the limit
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file, block, and node with the oversized label

  Scenario: The max label length is configurable via flag
    Given a markdown file containing a flowchart with a node label of 35 characters
    When the developer runs docs validate-mermaid with --max-label-len 40
    Then the command exits successfully

  # ── Rule 2: Flowchart width (perpendicular span; depth only matters in combination) ──

  Scenario: A deep sequential flowchart (long chain) passes validation regardless of depth
    Given a markdown file containing a TB flowchart with 10 nodes chained sequentially
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A TB flowchart with at most 3 nodes per rank passes validation
    Given a markdown file containing a TB flowchart where no rank has more than 3 nodes
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A TB flowchart with 4 nodes at one rank is flagged
    Given a markdown file containing a TB flowchart where one rank has 4 parallel nodes
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file and block with the excessive width

  Scenario: A LR flowchart with at most 3 nodes per rank passes validation
    Given a markdown file containing an LR flowchart where no rank has more than 3 nodes
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A LR flowchart with 4 nodes at one rank is flagged
    Given a markdown file containing an LR flowchart where one rank has 4 nodes at the same depth
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file and block with the excessive width

  Scenario: The max width is configurable via flag
    Given a markdown file containing a flowchart with 4 nodes at one rank
    When the developer runs docs validate-mermaid with --max-width 5
    Then the command exits successfully

  Scenario: A flowchart exceeding both width and depth thresholds passes with a warning
    Given a markdown file containing a flowchart with 4 nodes at one rank and more than 5 ranks deep
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output contains a warning about diagram complexity

  Scenario: The max depth threshold for the both-exceeded warning is configurable via flag
    Given a markdown file containing a flowchart with 4 nodes at one rank and exactly 4 ranks deep
    When the developer runs docs validate-mermaid with --max-depth 3
    Then the command exits successfully
    And the output contains a warning about diagram complexity

  # ── Rule 3: Single diagram per code block ────────────────────────────────

  Scenario: A mermaid block with a single flowchart passes validation
    Given a markdown file containing a mermaid code block with exactly one flowchart diagram
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A mermaid block with two flowchart declarations is flagged
    Given a markdown file containing a mermaid code block with two flowchart declarations
    When the developer runs docs validate-mermaid
    Then the command exits with a failure code
    And the output identifies the file and block with multiple diagrams

  Scenario: A mermaid block using the graph keyword alias is validated identically
    Given a markdown file containing a mermaid block using the graph keyword instead of flowchart with no violations
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  # ── Non-flowchart blocks ─────────────────────────────────────────────────

  Scenario: Non-flowchart mermaid blocks are ignored
    Given a markdown file containing only sequenceDiagram and classDiagram mermaid blocks
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  Scenario: A markdown file with no mermaid blocks passes validation
    Given a markdown file containing no mermaid code blocks
    When the developer runs docs validate-mermaid
    Then the command exits successfully
    And the output reports no violations

  # ── Staged / changed-only filtering ─────────────────────────────────────

  Scenario: With --staged-only only staged markdown files are checked
    Given a markdown file with a mermaid violation that has not been staged in git
    When the developer runs docs validate-mermaid with the --staged-only flag
    Then the command exits successfully

  Scenario: With --changed-only only files changed since upstream are checked
    Given a markdown file with a mermaid violation that is not in the push range
    When the developer runs docs validate-mermaid with the --changed-only flag
    Then the command exits successfully

  # ── Output formats ────────────────────────────────────────────────────────

  Scenario: JSON output contains structured violation data
    Given a markdown file containing a flowchart with a label length violation
    When the developer runs docs validate-mermaid with -o json
    Then the output is valid JSON
    And the JSON contains the violation kind, file path, block index, and node id

  Scenario: Markdown output produces a formatted table
    Given a markdown file containing a flowchart with a label length violation
    When the developer runs docs validate-mermaid with -o markdown
    Then the output contains a table with File, Block, Line, Severity, Kind, and Detail columns

  Scenario: Verbose flag includes per-file detail in text output
    Given a markdown file containing a flowchart with no violations
    When the developer runs docs validate-mermaid with --verbose
    Then the command exits successfully
    And the output includes per-file scan detail lines

  Scenario: Quiet flag suppresses non-error output when there are no violations
    Given a markdown file containing a flowchart with no violations
    When the developer runs docs validate-mermaid with --quiet
    Then the command exits successfully
    And the output contains no text
```

---

## Definition of Done

- All 22 Gherkin scenarios above have passing unit tests (godog, no build tag) and
  integration tests (`//go:build integration`).
- `nx run rhino-cli:test:quick` passes with ≥ 90% coverage.
- `nx run rhino-cli:spec-coverage` passes (all scenarios covered by step definitions).
- Pre-push hook updated; a branch with a bad `.md` diagram is rejected at push time.
- `specs/apps/rhino/cli/gherkin/README.md` feature-file table updated with new entry.
- `apps/rhino-cli/README.md` docs subcommand section updated with `validate-mermaid`
  including `--max-depth` flag documentation.
- `governance/conventions/formatting/diagrams.md` updated to reference the new CLI
  validator (so authors know to run it, not just read the convention manually).
- Command is verified to be read-only: it never modifies any file under any code path.
- Both-exceeded warning path verified: diagram with span > max-width AND depth > max-depth
  exits 0 with warning; diagram with span > max-width only exits 1.
