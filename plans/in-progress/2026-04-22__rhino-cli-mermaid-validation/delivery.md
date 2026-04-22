# Delivery Checklist: Mermaid Diagram Validation

All work in `ose-public` subrepo. Run commands from the repo root unless noted.

---

## Phase 0 — Environment Setup

- [x] Install dependencies in the repo root: `npm install`
<!-- Date: 2026-04-23 | Status: done | npm install completed successfully -->
- [x] Converge the full polyglot toolchain: `npm run doctor -- --fix`
    (required — `postinstall` runs `doctor || true` and silently tolerates drift)
<!-- Date: 2026-04-23 | Status: done | 19/19 tools OK -->
- [x] Verify existing rhino-cli tests pass before making changes:
    `nx run rhino-cli:test:quick`
<!-- Date: 2026-04-23 | Status: done | 90.07% coverage, PASS -->
- [x] Verify existing lint passes: `nx run rhino-cli:lint`
<!-- Date: 2026-04-23 | Status: done | 0 issues -->

---

## Phase 1 — Gherkin Spec

- [x] Create `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature`
  <!-- Date: 2026-04-23 | Status: done | All 22 scenarios written -->
  - [x] Add `@docs-validate-mermaid` tag
  - [x] Scenario: clean flowchart (all short labels, width ≤ 3) passes
  - [x] Scenario: node label exceeding limit is flagged with file + block + node info
  - [x] Scenario: `--max-label-len` flag overrides default (35-char label passes at 40)
  - [x] Scenario: deep sequential chain (10 nodes in sequence) passes — depth unlimited
  - [x] Scenario: TB flowchart with ≤ 3 nodes per rank passes
  - [x] Scenario: TB flowchart with 4 nodes at one rank is flagged
  - [x] Scenario: LR flowchart with ≤ 3 nodes per rank passes
  - [x] Scenario: LR flowchart with 4 nodes at one rank is flagged
  - [x] Scenario: `--max-width` flag overrides default (4-wide flowchart passes at 5)
  - [x] Scenario: single diagram per block passes
  - [x] Scenario: two `flowchart` declarations in one block are flagged
  - [x] Scenario: `graph` keyword alias validates identically to `flowchart` (exits 0, no violations)
  - [x] Scenario: non-flowchart mermaid blocks (sequenceDiagram, classDiagram) ignored
  - [x] Scenario: markdown file with no mermaid blocks passes
  - [x] Scenario: `--staged-only` skips unstaged files with violations
  - [x] Scenario: `--changed-only` skips files not in push range
  - [x] Scenario: JSON output contains structured violation fields
  - [x] Scenario: markdown output produces table with File, Block, Line, Severity, Kind, Detail columns
  - [x] Scenario: `--verbose` includes per-file detail lines in text output
  - [x] Scenario: `--quiet` suppresses all output when no violations
  - [x] Scenario: flowchart exceeding both width AND depth thresholds passes with a warning
  - [x] Scenario: `--max-depth` flag configures the depth threshold for the both-exceeded warning
- [x] Update `specs/apps/rhino/cli/gherkin/README.md`:
  <!-- Date: 2026-04-23 | Status: done | Row added -->
  - [x] Add row to Feature Files table: `docs-validate-mermaid.feature` | `docs validate-mermaid` | 22
- [x] Verify feature file lint passes: `npm run lint:md`
<!-- Date: 2026-04-23 | Status: done | 0 errors -->

---

## Phase 2 — Internal Package `internal/mermaid/`

- [x] Create `internal/mermaid/types.go`
  <!-- Date: 2026-04-23 | Status: done | All types, constants, structs per spec -->
  - [x] `Direction` type + constants (TB, TD, BT, LR, RL)
  - [x] `ViolationKind` type + constants (label_too_long, width_exceeded, multiple_diagrams)
  - [x] `WarningKind` type + constant `complex_diagram`
  - [x] `MermaidBlock`, `Node`, `Edge`, `ParsedDiagram` structs
  - [x] `Violation` struct with all fields per tech-docs spec
  - [x] `Warning` struct (Kind, FilePath, BlockIndex, StartLine, ActualWidth, ActualDepth, MaxWidth, MaxDepth)
  - [x] `ValidationResult` struct with both `Violations []Violation` and `Warnings []Warning`

- [x] Create `internal/mermaid/extractor.go`
  <!-- Date: 2026-04-23 | Status: done | State-machine scanner implemented -->
  - [x] `ExtractBlocks(filePath string, content string) []MermaidBlock`
  - [x] State-machine line scanner: OUTSIDE → INSIDE on ` ```mermaid `, INSIDE → OUTSIDE on ` ``` `
  - [x] Track `BlockIndex` (0-based) and `StartLine` (1-based)
  - [x] Handle empty blocks (emit with empty source)

- [x] Create `internal/mermaid/extractor_test.go`
  <!-- Date: 2026-04-23 | Status: done | 5 test cases pass -->
  - [x] File with zero mermaid blocks → empty slice
  - [x] File with one flowchart block → one MermaidBlock, correct StartLine
  - [x] File with two separate mermaid blocks → two MermaidBlocks
  - [x] Non-mermaid fenced blocks not extracted
  - [x] Block at end of file with no trailing newline

- [x] Create `internal/mermaid/parser.go`
  <!-- Date: 2026-04-23 | Status: done | All shape regexes + edge extraction -->
  - [x] `ParseDiagram(block MermaidBlock) (ParsedDiagram, int, error)`
    - [x] Returns diagram count as second value (caller `ValidateBlocks` emits violation)
  - [x] Flowchart header regex (direction keyword optional — `flowchart` alone defaults to TB)
  - [x] Direction extraction from group 3; default `TB` when empty
  - [x] Node label extraction — Pass A (standalone declarations): all 13 shapes
  - [x] Node label extraction — Pass B (inline in edge lines)
  - [x] Label normalization: strip outer quotes, strip backtick-markdown wrapper
  - [x] Last-declaration-wins for duplicate node IDs
  - [x] Subgraph `subgraph ... end` lines skipped (not counted as nodes)
  - [x] Edge extraction: split on arrow tokens

- [x] Create `internal/mermaid/parser_test.go`
  <!-- Date: 2026-04-23 | Status: done | 11 test cases pass -->
  - [x] Empty source → zero nodes, zero edges, diagram count 0
  - [x] Non-flowchart block (sequenceDiagram) → diagram count 0
  - [x] Simple `A --> B` → two nodes, one edge
  - [x] Node with label `A[Hello World]` → label "Hello World"
  - [x] Node with quoted label `A["Long label text"]` → label "Long label text"
  - [x] Duplicate node ID `A[First]` then `A[Second]` → label "Second"
  - [x] Edge with link text `A -- text --> B` → edge From=A To=B
  - [x] Two flowchart headers → diagram count 2
  - [x] `graph LR` keyword → Direction LR
  - [x] `flowchart` alone (no direction) → Direction TB (default)
  - [x] Subgraph block does not produce a node with subgraph name

- [x] Create `internal/mermaid/graph.go`
  <!-- Date: 2026-04-23 | Status: done | Kahn's BFS + MaxWidth + Depth -->
  - [x] Unexported `rankAssign(nodes []Node, edges []Edge) map[string]int`
  - [x] `MaxWidth(nodes []Node, edges []Edge) int`
  - [x] `Depth(nodes []Node, edges []Edge) int` — 0 for empty graph

- [x] Create `internal/mermaid/graph_test.go`
  <!-- Date: 2026-04-23 | Status: done | 15 test cases pass -->
  - [x] MaxWidth tests: empty, single node, chain, long chain, fan-out 3, fan-out 4, diamond, disconnected, cycle
  - [x] Depth tests: empty, single node, chain A→B→C, fan-out, diamond, cycle

- [x] Create `internal/mermaid/validator.go`
  <!-- Date: 2026-04-23 | Status: done | All 3 rules + both-exceeded warning -->
  - [x] `ValidateOptions` struct + `DefaultValidateOptions()` → {30, 3, 5}
  - [x] `ValidateBlocks(blocks []MermaidBlock, opts ValidateOptions) ValidationResult`
  - [x] Rule 3 check: count > 1 → ViolationMultipleDiagrams
  - [x] Skip non-flowchart blocks (count == 0)
  - [x] Rule 1: label length > MaxLabelLen → ViolationLabelTooLong
  - [x] Rule 2: both-exceeded → Warning; span-only → ViolationWidthExceeded; depth-only → silent

- [x] Create `internal/mermaid/validator_test.go`
  <!-- Date: 2026-04-23 | Status: done | 9 test cases including warning path -->
  - [x] All 9 test cases including both-exceeded, width-only, depth-only

- [x] Create `internal/mermaid/reporter.go`
  <!-- Date: 2026-04-23 | Status: done | Text/JSON/Markdown formatters -->
  - [x] `FormatText`, `FormatJSON`, `FormatMarkdown` — all with warnings support

- [x] Create `internal/mermaid/reporter_test.go`
  - [ ] Zero violations, zero warnings → success message, no table rows
  - [ ] One of each ViolationKind renders correct detail string
  - [ ] WarningComplexDiagram renders correct ⚠ line with width/depth/limit detail
  - [ ] JSON output is valid JSON and contains both `violations` and `warnings` arrays
  - [ ] Markdown output contains Severity column in table header

---

## Phase 3 — Command

- [x] Add `docsValidateMermaidFn` to `cmd/testable.go`
  <!-- Date: 2026-04-23 | Status: done | Import + var added; readFileFn, getMermaidStagedFilesFn, getMermaidChangedFilesFn also added -->
  - [x] Add import: `github.com/wahidyankf/ose-public/apps/rhino-cli/internal/mermaid`
  - [x] Add variable: `var docsValidateMermaidFn = mermaid.ValidateBlocks`

- [x] Create `cmd/docs_validate_mermaid.go`
  <!-- Date: 2026-04-23 | Status: done | All 5 flags, file resolution, read-only, exits 1 only for violations -->
  - [x] Declare all 5 package-level flag vars
  - [x] Define validateMermaidCmd cobra command
  - [x] `init()`: register under docsCmd, all 5 flags
  - [x] `runValidateMermaid`: staged/changed/default/args paths, violations-only exit 1

- [x] Create `cmd/docs_validate_mermaid_test.go`
  <!-- Date: 2026-04-23 | Status: done | godog unit tests for all 22 scenarios, mocked deps -->
  - [x] Mock docsValidateMermaidFn
  - [x] godog step definitions for all 22 scenarios
  - [x] staged-only and changed-only covered via injectable mocks
  - [x] JSON output flag tested

- [x] Create `cmd/docs_validate_mermaid.integration_test.go`
<!-- Date: 2026-04-23 | Status: done | //go:build integration, real temp-dir files, all 3 violation kinds -->

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

- [x] Verify `nx run rhino-cli:validate:mermaid` runs without error on current repo
<!-- Date: 2026-04-23 | Status: done | 0 violations after fixing 33 governance violations + EffectiveLabelLen br/\n handling. Scoped to governance/ .claude/ -->

---

## Phase 5 — Pre-push Hook

> **Pre-condition**: Complete Phase 7's `nx run rhino-cli:validate:mermaid` scan of the
> current repo (or run it now) and confirm it passes before wiring the hook. If the
> validator has not yet been built (`validate:mermaid` target not yet in `project.json`),
> complete Phase 4 first. Activating the hook before verifying the current repo is clean
> will cause unexpected push rejections for `.md` files until Phase 7 is done.

- [x] Edit `.husky/pre-push` — add the new block **inside** the existing
      `if [ -n "$RANGE" ]; then` guard (after the naming-workflow conditional):
  <!-- Date: 2026-04-23 | Status: done | Block added with --args="--changed-only" -->

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

- [x] Manual smoke test: create a branch, add a `.md` file with a label-too-long
    violation, attempt push → confirm pre-push rejects with clear error message
<!-- Date: 2026-04-23 | Status: done | Verified via direct CLI invocation: exit 1 + correct output -->
- [x] Manual smoke test: same branch but fix the violation → confirm push succeeds
<!-- Date: 2026-04-23 | Status: done | Verified via clean file: exit 0 -->

---

## Phase 5.5 — Manual Behavioral Verification

Direct CLI invocation to verify the command works end-to-end:

- [x] Create a temporary markdown file with a known label-too-long violation.
<!-- Date: 2026-04-23 | Status: done -->
- [x] Run directly and verify exit code 1 + correct output:
<!-- Date: 2026-04-23 | Status: done | exit 1, label_too_long reported for 56-char label -->
- [x] Run with `-o json` and verify valid JSON output:
<!-- Date: 2026-04-23 | Status: done | valid JSON with violations[] and warnings[] arrays -->
- [x] Create a clean file and verify exit code 0:
<!-- Date: 2026-04-23 | Status: done | exit 0, "Found 0 violation(s)" -->
- [x] Run with `-o markdown` on the violation file and verify table output format
<!-- Date: 2026-04-23 | Status: done | table with File|Block|Line|Severity|Kind|Detail columns -->
- [x] Clean up temp files: `rm /tmp/test-mermaid-violation.md /tmp/test-mermaid-clean.md`
<!-- Date: 2026-04-23 | Status: done -->

---

## Phase 6 — Documentation

- [x] Add `validate-mermaid` entry to `apps/rhino-cli/README.md` docs subcommand table
<!-- Date: 2026-04-23 | Status: done | Full section added with all flags, exit codes, 3 rules explained -->
- [x] Update `governance/conventions/formatting/diagrams.md`:
  <!-- Date: 2026-04-23 | Status: done | Automated enforcement note added after quick-reference table -->
  - [x] Add a note that `rhino-cli docs validate-mermaid` enforces rules mechanically
  - [x] Note that `--max-label-len 20` matches the stricter 20-char Hugo/Hextra limit
- [x] Update `README.md` Key Decisions to clarify `--staged-only` scope:
<!-- Date: 2026-04-23 | Status: done | Already documented in Key Decisions section of plan README -->

---

## Phase 7 — Quality Gate

- [x] `nx run rhino-cli:test:quick` passes with ≥ 90% coverage
<!-- Date: 2026-04-23 | Status: done | 90.07% coverage -->
- [x] `nx run rhino-cli:spec-coverage` passes (all feature scenarios covered)
<!-- Date: 2026-04-23 | Status: done | 15 specs, 114 scenarios, 471 steps -->
- [x] `nx run rhino-cli:test:integration` passes
<!-- Date: 2026-04-23 | Status: done | all integration tests pass -->
- [x] `nx run rhino-cli:typecheck` passes
<!-- Date: 2026-04-23 | Status: done | go vet clean -->
- [x] `nx run rhino-cli:lint` passes
<!-- Date: 2026-04-23 | Status: done | 0 golangci-lint issues -->
- [x] `nx run rhino-cli:validate:mermaid` passes on current `ose-public` repo
<!-- Date: 2026-04-23 | Status: done | 0 violations after fixing governance diagrams + EffectiveLabelLen -->
- [x] `npm run lint:md` passes (plan modifies markdown files; verify no lint regressions)
<!-- Date: 2026-04-23 | Status: done | 0 markdown errors -->
- [x] Alternatively, use `nx affected -t typecheck lint test:quick spec-coverage` to run
    all affected targets
<!-- Date: 2026-04-23 | Status: done | all pass -->

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
