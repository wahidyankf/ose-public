# Delivery Checklist: Mermaid Diagram Validation

All work in `ose-public` subrepo. Run commands from the repo root unless noted.

---

## Phase 0 — Environment Setup

- [ ] Install dependencies in the repo root: `npm install`
- [ ] Converge the full polyglot toolchain: `npm run doctor -- --fix`
      (required — `postinstall` runs `doctor || true` and silently tolerates drift)
- [ ] Verify existing rhino-cli tests pass before making changes:
      `nx run rhino-cli:test:quick`
- [ ] Verify existing lint passes: `nx run rhino-cli:lint`

---

## Phase 1 — Gherkin Spec

- [ ] Create `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature`
  - [ ] Add `@docs-validate-mermaid` tag
  - [ ] Scenario: clean flowchart (all short labels, width ≤ 3) passes
  - [ ] Scenario: node label exceeding limit is flagged with file + block + node info
  - [ ] Scenario: `--max-label-len` flag overrides default (35-char label passes at 40)
  - [ ] Scenario: deep sequential chain (10 nodes in sequence) passes — depth unlimited
  - [ ] Scenario: TB flowchart with ≤ 3 nodes per rank passes
  - [ ] Scenario: TB flowchart with 4 nodes at one rank is flagged
  - [ ] Scenario: LR flowchart with ≤ 3 nodes per rank passes
  - [ ] Scenario: LR flowchart with 4 nodes at one rank is flagged
  - [ ] Scenario: `--max-width` flag overrides default (4-wide flowchart passes at 5)
  - [ ] Scenario: single diagram per block passes
  - [ ] Scenario: two `flowchart` declarations in one block are flagged
  - [ ] Scenario: `graph` keyword alias validates identically to `flowchart` (exits 0, no violations)
  - [ ] Scenario: non-flowchart mermaid blocks (sequenceDiagram, classDiagram) ignored
  - [ ] Scenario: markdown file with no mermaid blocks passes
  - [ ] Scenario: `--staged-only` skips unstaged files with violations
  - [ ] Scenario: `--changed-only` skips files not in push range
  - [ ] Scenario: JSON output contains structured violation fields
  - [ ] Scenario: markdown output produces table with File, Block, Line, Severity, Kind, Detail columns
  - [ ] Scenario: `--verbose` includes per-file detail lines in text output
  - [ ] Scenario: `--quiet` suppresses all output when no violations
  - [ ] Scenario: flowchart exceeding both width AND depth thresholds passes with a warning
  - [ ] Scenario: `--max-depth` flag configures the depth threshold for the both-exceeded warning
- [ ] Update `specs/apps/rhino/cli/gherkin/README.md`:
  - [ ] Add row to Feature Files table: `docs-validate-mermaid.feature` | `docs validate-mermaid` | 22
- [ ] Verify feature file lint passes: `npm run lint:md`

---

## Phase 2 — Internal Package `internal/mermaid/`

- [ ] Create `internal/mermaid/types.go`
  - [ ] `Direction` type + constants (TB, TD, BT, LR, RL)
  - [ ] `ViolationKind` type + constants (label_too_long, width_exceeded,
        multiple_diagrams)
  - [ ] `WarningKind` type + constant `complex_diagram`
  - [ ] `MermaidBlock`, `Node`, `Edge`, `ParsedDiagram` structs
  - [ ] `Violation` struct with all fields per tech-docs spec
  - [ ] `Warning` struct (Kind, FilePath, BlockIndex, StartLine, ActualWidth,
        ActualDepth, MaxWidth, MaxDepth)
  - [ ] `ValidationResult` struct with both `Violations []Violation` and
        `Warnings []Warning`

- [ ] Create `internal/mermaid/extractor.go`
  - [ ] `ExtractBlocks(filePath string, content string) []MermaidBlock`
  - [ ] State-machine line scanner: OUTSIDE → INSIDE on ` ```mermaid `, INSIDE → OUTSIDE
        on ` ``` `
  - [ ] Track `BlockIndex` (0-based) and `StartLine` (1-based)
  - [ ] Handle empty blocks (emit with empty source)

- [ ] Create `internal/mermaid/extractor_test.go`
  - [ ] File with zero mermaid blocks → empty slice
  - [ ] File with one flowchart block → one MermaidBlock, correct StartLine
  - [ ] File with two separate mermaid blocks → two MermaidBlocks
  - [ ] Non-mermaid fenced blocks not extracted
  - [ ] Block at end of file with no trailing newline

- [ ] Create `internal/mermaid/parser.go`
  - [ ] `ParseDiagram(block MermaidBlock) (ParsedDiagram, int, error)`
    - [ ] Returns diagram count as second value (caller `ValidateBlocks` emits violation)
  - [ ] Flowchart header regex: `(?m)^\s*(flowchart|graph)(\s+(TB|TD|BT|LR|RL))?\s*$`
        (direction keyword optional — `flowchart` alone defaults to TB)
  - [ ] Direction extraction from group 3; default `TB` when empty
  - [ ] Node label extraction — Pass A (standalone declarations):
    - [ ] Rectangle `[...]`
    - [ ] Round edges `(...)`
    - [ ] Stadium `([...])`
    - [ ] Subroutine `[[...]]`
    - [ ] Cylinder `[(...)]`
    - [ ] Circle `((...))` and double-circle `(((...)))`
    - [ ] Diamond `{...}` and hexagon `{{...}}`
    - [ ] Asymmetric `>...]`
    - [ ] Parallelogram down `[/.../]` and up `[\...\]`
    - [ ] Trapezoid down `[/text\]` (`\w+\[/([^/\\]*)\\]`) and
          trapezoid up `[\text/]` (`\w+\[\\([^/\\]*)/\]`)
    - [ ] Modern API `@{ ... label: "..." ... }`
  - [ ] Node label extraction — Pass B (inline in edge lines)
  - [ ] Label normalization: strip outer quotes, strip backtick-markdown wrapper
  - [ ] Last-declaration-wins for duplicate node IDs
  - [ ] Subgraph `subgraph ... end` lines skipped (not counted as nodes)
  - [ ] Edge extraction: split on arrow tokens (`-->`, `---`, `-.->`, `==>`,
        `--o`, `--x`, `<-->`, `-- text -->`, etc.)

- [ ] Create `internal/mermaid/parser_test.go`
  - [ ] Empty source → zero nodes, zero edges, diagram count 0
  - [ ] Non-flowchart block (sequenceDiagram) → diagram count 0
  - [ ] Simple `A --> B` → two nodes, one edge
  - [ ] Node with label `A[Hello World]` → label "Hello World"
  - [ ] Node with quoted label `A["Long label text"]` → label "Long label text"
  - [ ] Duplicate node ID `A[First]` then `A[Second]` → label "Second"
  - [ ] Edge with link text `A -- text --> B` → edge From=A To=B
  - [ ] Two flowchart headers → diagram count 2
  - [ ] `graph LR` keyword → Direction LR
  - [ ] `flowchart` alone (no direction) → Direction TB (default)
  - [ ] Subgraph block does not produce a node with subgraph name

- [ ] Create `internal/mermaid/graph.go`
  - [ ] Unexported `rankAssign(nodes []Node, edges []Edge) map[string]int` — shared
        core: builds adjacency list, computes in-degrees, runs Kahn's BFS, applies
        cycle fallback (unvisited nodes assigned rank 0)
  - [ ] `MaxWidth(nodes []Node, edges []Edge) int` — calls rankAssign; groups nodes
        by rank; returns max group size
  - [ ] `Depth(nodes []Node, edges []Edge) int` — calls rankAssign; returns count of
        distinct rank values (= longest path length + 1; 0 for empty graph)

- [ ] Create `internal/mermaid/graph_test.go`
  - [ ] MaxWidth tests:
    - [ ] Empty graph → maxWidth 0
    - [ ] Single disconnected node with no edges → maxWidth 1 (node stays at rank 0)
    - [ ] Linear chain A→B→C → maxWidth 1 (depth=2, width=1)
    - [ ] Long sequential chain (10 nodes) → maxWidth 1
    - [ ] Fan-out A→B, A→C, A→D → maxWidth 3
    - [ ] Fan-out A→B, A→C, A→D, A→E → maxWidth 4
    - [ ] Diamond A→B, A→C, B→D, C→D → maxWidth 2
    - [ ] Two disconnected chains → maxWidth = max of the two widths
    - [ ] Cycle A→B→A → no panic, returns fallback maxWidth
  - [ ] Depth tests:
    - [ ] Empty graph → depth 0
    - [ ] Single disconnected node → depth 1
    - [ ] Linear chain A→B→C → depth 3
    - [ ] Fan-out A→B, A→C, A→D → depth 2
    - [ ] Diamond A→B, A→C, B→D, C→D → depth 3
    - [ ] Cycle A→B→A → depth 1 (both rank 0 after fallback)

- [ ] Create `internal/mermaid/validator.go`
  - [ ] `ValidateOptions` struct (MaxLabelLen int, MaxWidth int, MaxDepth int)
  - [ ] `DefaultValidateOptions() ValidateOptions` → {30, 3, 5}
  - [ ] `ValidateBlocks(blocks []MermaidBlock, opts ValidateOptions) ValidationResult`
  - [ ] Call `ParseDiagram` → receive `(ParsedDiagram, count, error)`
  - [ ] Rule 3 check: if count > 1 → emit `ViolationMultipleDiagrams`
        (validator emits this, not the parser)
  - [ ] Skip non-flowchart blocks (diagram count == 0)
  - [ ] Rule 1 check: label length > MaxLabelLen → ViolationLabelTooLong
  - [ ] Rule 2 check:
    - [ ] Compute `span = graph.MaxWidth(nodes, edges)`
    - [ ] Compute `depth = graph.Depth(nodes, edges)`
    - [ ] If `span > MaxWidth && depth > MaxDepth` → emit `Warning{WarningComplexDiagram, ...}`
    - [ ] Else if `span > MaxWidth` → emit `ViolationWidthExceeded`
    - [ ] Depth alone exceeding MaxDepth → no output
  - [ ] Populate all Violation and Warning fields correctly

- [ ] Create `internal/mermaid/validator_test.go`
  - [ ] Clean block → zero violations, zero warnings
  - [ ] Label exactly at limit → no violation; label at limit+1 → violation
  - [ ] Width exactly at limit → no violation; width at limit+1 → violation
  - [ ] Non-flowchart block → zero violations, zero warnings
  - [ ] Multiple diagrams block → ViolationMultipleDiagrams regardless of other rules
  - [ ] Custom opts respected (MaxLabelLen=40, MaxWidth=5, MaxDepth=10)
  - [ ] Both-exceeded warning: span=4, depth=6, max-width=3, max-depth=5 →
        Warning{WarningComplexDiagram}, zero violations
  - [ ] Width-only: span=4, depth=4, max-width=3, max-depth=5 →
        ViolationWidthExceeded, zero warnings
  - [ ] Depth-only: span=2, depth=6, max-width=3, max-depth=5 →
        zero violations, zero warnings

- [ ] Create `internal/mermaid/reporter.go`
  - [ ] `FormatText(result ValidationResult, verbose, quiet bool) string`
  - [ ] `FormatJSON(result ValidationResult) (string, error)`
  - [ ] `FormatMarkdown(result ValidationResult) string`
  - [ ] Text: per-file summary lines (✓/✗/⚠) + violation/warning detail lines + summary footer
  - [ ] JSON: matches schema in tech-docs — includes both `violations` and `warnings` arrays
  - [ ] Markdown: table with File | Block | Line | Severity | Kind | Detail columns

- [ ] Create `internal/mermaid/reporter_test.go`
  - [ ] Zero violations, zero warnings → success message, no table rows
  - [ ] One of each ViolationKind renders correct detail string
  - [ ] WarningComplexDiagram renders correct ⚠ line with width/depth/limit detail
  - [ ] JSON output is valid JSON and contains both `violations` and `warnings` arrays
  - [ ] Markdown output contains Severity column in table header

---

## Phase 3 — Command

- [ ] Add `docsValidateMermaidFn` to `cmd/testable.go`
      (alongside `docsValidateAllLinksFn` — this is where internal-package delegation
      function variables are declared, consistent with existing pattern):
  - [ ] Add import: `github.com/wahidyankf/ose-public/apps/rhino-cli/internal/mermaid`
  - [ ] Add variable: `var docsValidateMermaidFn = mermaid.ValidateBlocks`

- [ ] Create `cmd/docs_validate_mermaid.go`
  - [ ] Declare `validateMermaidStagedOnly`, `validateMermaidChangedOnly`,
        `validateMermaidMaxLabelLen`, `validateMermaidMaxWidth`,
        `validateMermaidMaxDepth` package-level vars
  - [ ] Reference `docsValidateMermaidFn` from `cmd/testable.go` (do not re-declare)
  - [ ] Define `validateMermaidCmd` cobra command with Use, Short, Long, Example,
        SilenceErrors, RunE
  - [ ] `init()`: register under `docsCmd`, register all five flags (including `--max-depth`)
  - [ ] `runValidateMermaid`: resolve file list (staged / changed / default / args),
        call `docsValidateMermaidFn`, format output, return error if violations found
        (exit 1 only for violations — warnings alone do not cause exit 1)
  - [ ] `--staged-only`: call `git diff --cached --name-only --diff-filter=ACMR`,
        filter to `*.md`
  - [ ] `--changed-only`: call `git diff --name-only @{u}..HEAD`, filter to `*.md`;
        fallback to default dirs if `@{u}` unavailable

- [ ] Create `cmd/docs_validate_mermaid_test.go`
  - [ ] Mock `docsValidateMermaidFn`
  - [ ] godog step definitions for all scenarios in feature file (unit level, no build
        tag, mock filesystem)
  - [ ] Test that `--staged-only=true` causes the mock file-list resolver to be called
        with `stagedOnly: true`
  - [ ] Test that `--changed-only=true` causes the mock file-list resolver to be called
        with `changedOnly: true`
  - [ ] Test JSON output flag

- [ ] Create `cmd/docs_validate_mermaid.integration_test.go`
  - [ ] `//go:build integration`
  - [ ] godog integration scenarios with real temp-dir markdown files
  - [ ] Scenarios covering all three violation kinds with real file I/O
  - [ ] `--staged-only` scenario: stage clean file, leave dirty file unstaged → passes
  - [ ] `--changed-only` scenario: requires git init in temp dir with upstream branch

---

## Phase 4 — Nx Target

- [ ] Add `validate:mermaid` target to `apps/rhino-cli/project.json`:

  ```json
  "validate:mermaid": {
    "command": "CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid",
    "cache": true,
    "inputs": [
      "{projectRoot}/**/*.go",
      "{workspaceRoot}/docs/**/*.md",
      "{workspaceRoot}/governance/**/*.md",
      "{workspaceRoot}/.claude/**/*.md",
      "{workspaceRoot}/*.md"
    ],
    "outputs": []
  }
  ```

  The `"{workspaceRoot}/*.md"` entry ensures root-level markdown changes invalidate
  the cache (the default scan includes repo root `*.md`).

- [ ] Verify `nx run rhino-cli:validate:mermaid` runs without error on current repo

---

## Phase 5 — Pre-push Hook

> **Pre-condition**: Complete Phase 7's `nx run rhino-cli:validate:mermaid` scan of the
> current repo (or run it now) and confirm it passes before wiring the hook. If the
> validator has not yet been built (`validate:mermaid` target not yet in `project.json`),
> complete Phase 4 first. Activating the hook before verifying the current repo is clean
> will cause unexpected push rejections for `.md` files until Phase 7 is done.

- [ ] Edit `.husky/pre-push` — add the new block **inside** the existing
      `if [ -n "$RANGE" ]; then` guard (after the naming-workflow conditional):

  ```bash
  if [ -n "$RANGE" ]; then
    CHANGED=$(git diff --name-only "$RANGE" 2>/dev/null || echo "")
    if echo "$CHANGED" | grep -qE '^(\.claude/agents/|\.opencode/agent/)'; then
      npx nx run rhino-cli:validate:naming-agents
    fi
    if echo "$CHANGED" | grep -qE '^governance/workflows/'; then
      npx nx run rhino-cli:validate:naming-workflows
    fi
    # ADD THIS BLOCK:
    if echo "$CHANGED" | grep -qE '\.md$'; then
      npx nx run rhino-cli:validate:mermaid --args="--changed-only"
    fi
  fi
  ```

  **Important**: The block must be inside the `if [ -n "$RANGE" ]` guard because
  `$CHANGED` is only set inside that block. Placing it outside would leave `$CHANGED`
  empty and the condition would never trigger. Use `--args="--changed-only"` (not
  `-- --changed-only`) — the `--args=` form is the confirmed Nx syntax for passing
  flags to `command`-type targets.

- [ ] Manual smoke test: create a branch, add a `.md` file with a label-too-long
      violation, attempt push → confirm pre-push rejects with clear error message
- [ ] Manual smoke test: same branch but fix the violation → confirm push succeeds

---

## Phase 5.5 — Manual Behavioral Verification

Direct CLI invocation to verify the command works end-to-end:

- [ ] Create a temporary markdown file with a known label-too-long violation.
      Run this command — note the inner backtick fence is part of the heredoc content:

  ````bash
  printf '# Test\n\n```mermaid\nflowchart TD\n  A[This label is way too long and exceeds thirty characters]\n```\n' \
    > /tmp/test-mermaid-violation.md
  ````

- [ ] Run directly and verify exit code 1 + correct output:

  ```bash
  go run apps/rhino-cli/main.go docs validate-mermaid /tmp/test-mermaid-violation.md
  echo "Exit code: $?"
  ```

- [ ] Run with `-o json` and verify valid JSON output:

  ```bash
  go run apps/rhino-cli/main.go docs validate-mermaid -o json /tmp/test-mermaid-violation.md | jq .
  ```

- [ ] Create a clean file and verify exit code 0:

  ````bash
  printf '# Test\n\n```mermaid\nflowchart TD\n  A[Short label] --> B[Another short]\n```\n' \
    > /tmp/test-mermaid-clean.md
  go run apps/rhino-cli/main.go docs validate-mermaid /tmp/test-mermaid-clean.md
  echo "Exit code: $?"
  ````

- [ ] Run with `-o markdown` on the violation file and verify table output format
- [ ] Clean up temp files: `rm /tmp/test-mermaid-violation.md /tmp/test-mermaid-clean.md`

---

## Phase 6 — Documentation

- [ ] Add `validate-mermaid` entry to `apps/rhino-cli/README.md` docs subcommand table
      with all flags documented (including `--max-label-len` default 30, `--max-width` default 3,
      `--max-depth` default 5, `--staged-only`, `--changed-only`); note the command is
      read-only and only validates `flowchart`/`graph` blocks — all other Mermaid diagram
      types (sequenceDiagram, classDiagram, gantt, etc.) are silently skipped
- [ ] Update `governance/conventions/formatting/diagrams.md`:
  - [ ] Add a note in the relevant section that `rhino-cli docs validate-mermaid` enforces
        the label-length and width rules mechanically — authors should run it instead of
        checking manually
  - [ ] Note that `--max-label-len 20` matches the stricter 20-char Hugo/Hextra production limit
- [ ] Update `README.md` Key Decisions to clarify `--staged-only` scope:
      note that `--staged-only` is available for manual invocation or future pre-commit
      integration but is not wired into any hook in this plan iteration

---

## Phase 7 — Quality Gate

- [ ] `nx run rhino-cli:test:quick` passes with ≥ 90% coverage
- [ ] `nx run rhino-cli:spec-coverage` passes (all feature scenarios covered)
- [ ] `nx run rhino-cli:test:integration` passes
- [ ] `nx run rhino-cli:typecheck` passes
- [ ] `nx run rhino-cli:lint` passes
- [ ] `nx run rhino-cli:validate:mermaid` passes on current `ose-public` repo
      (no pre-existing violations, or document and fix any found)
- [ ] `npm run lint:md` passes (plan modifies markdown files; verify no lint regressions)
- [ ] Alternatively, use `nx affected -t typecheck lint test:quick spec-coverage` to run
      all affected targets (should resolve to rhino-cli only for this change — blast
      radius limited to rhino-cli and its dependencies, not the full monorepo)

> **Important**: Fix ALL failures found during quality gates, not just those caused by
> your changes. This follows the root cause orientation principle — proactively fix
> preexisting errors encountered during work. Do not defer or mention-and-skip existing
> issues.

---

## Phase 8 — Post-Push Verification

- [ ] Push changes to `main`
- [ ] Monitor GitHub Actions workflows for the push (relevant workflows: Nx affected
      build/test CI, markdown lint)
- [ ] Verify all CI checks pass
- [ ] If any CI check fails, fix immediately and push a follow-up commit
- [ ] Do NOT proceed to plan archival until CI is green

---

## Commit Guidelines

Commit changes thematically — group related changes into logically cohesive commits.
Follow Conventional Commits format: `<type>(<scope>): <description>`.
Split different domains/concerns into separate commits.
Do NOT bundle unrelated fixes into a single commit.

Suggested four-commit split:

1. `feat(rhino-cli): add internal/mermaid package (extractor, parser, graph, validator, reporter)`
2. `feat(rhino-cli): add docs validate-mermaid command with staged-only and changed-only flags`
3. `chore(rhino-cli): wire validate-mermaid into pre-push hook and Nx target`
4. `docs(rhino-cli): update specs README, rhino-cli README, and diagrams convention to reference validator`

If the pre-push hook catches issues mid-commit sequence (e.g., commit 3 triggers the
new validator on changed `.md` files), fix the violation before amending or adding a
fixup commit.

---

## Phase 9 — Plan Archival

- [ ] Verify ALL delivery checklist items above are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder: `git mv plans/in-progress/2026-04-22__rhino-cli-mermaid-validation plans/done/2026-04-22__rhino-cli-mermaid-validation`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
- [ ] Commit: `chore(plans): move rhino-cli-mermaid-validation to done`
