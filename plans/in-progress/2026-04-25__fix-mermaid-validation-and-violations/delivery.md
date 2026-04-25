# Delivery — Fix Mermaid Validation and Violations

## Pre-Execution Checklist

- [x] Read all five plan files (README.md, brd.md, prd.md, tech-docs.md, this file)
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: All five plan files read at session start and verified in current session context. -->
- [x] Confirm working in `ose-public` repo root (not a parent worktree — subrepo
    worktrees have access to `docs/` and `apps/rhino-cli/`)
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: pwd=/Users/wkf/ose-projects/ose-public/.claude/worktrees/swirling-crunching-pebble; apps/rhino-cli/ accessible. -->
- [x] Install dependencies in the root worktree: `npm install`
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: npm install completed cleanly. -->
- [x] Converge the full polyglot toolchain: `npm run doctor -- --fix` (required — the
    `postinstall` hook runs `doctor || true` and silently tolerates drift)
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: 19/19 tools OK, 0 warning, 0 missing. All polyglot toolchains converged. -->
- [x] Run baseline audit and record numbers:
    `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | tail -5`
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: Baseline (direction-blind, MaxWidth=3): 102 files failing, 236 total violations. -->
- [x] Confirm `nx run rhino-cli:test:quick` passes before any changes
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: All packages pass. mermaid=97.0%, overall 90.08%≥90% threshold. -->

> **Important**: Fix ALL failures found during quality gates, not just those caused by
> your changes. This follows the root cause orientation principle — proactively fix
> preexisting errors encountered during work.

### Commit Guidelines

- Commit thematically: group related changes into logically cohesive commits
- Follow Conventional Commits format: `<type>(<scope>): <description>`
- Split different domains/concerns into separate commits
- Do NOT bundle unrelated fixes into a single commit

---

## Phase 0 — Direction-Aware Validator

### 0.1 — Update `validator.go`

- [x] Open `apps/rhino-cli/internal/mermaid/validator.go`
<!-- Date: 2026-04-25 | Status: done | Files Changed: validator.go | Notes: Direction field confirmed on ParsedDiagram in types.go; parser.go already parses it. No parser changes needed. -->
- [x] Confirm `MermaidDiagram` struct has a `Direction` field (check `types.go`)
  <!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: ParsedDiagram.Direction of type Direction exists with DirectionLR/RL/TD/TB/BT constants. -->
  - [x] If missing: add `Direction string` to `MermaidDiagram` and parse it from
      the header line in `parser.go`
  <!-- Date: 2026-04-25 | Status: N/A | Files Changed: none | Notes: Field already existed. No parser changes needed. -->
- [x] Change `DefaultValidateOptions()`:
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/internal/mermaid/validator.go | Notes: MaxWidth: 3→4, MaxDepth: 5→math.MaxInt. Added "math" import. -->
  - `MaxWidth: 3` → `MaxWidth: 4`
  - `MaxDepth: 5` → `MaxDepth: math.MaxInt`
  - Add `"math"` to imports if needed
- [x] Replace direction-blind Rule 2 with direction-aware logic (see `tech-docs.md`
    §"Target State"): use `diagram.Direction` to select `horizontal`/`vertical`
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/internal/mermaid/validator.go | Notes: switch diagram.Direction { case DirectionLR, DirectionRL: horizontal,vertical=depth,span; default: horizontal,vertical=span,depth }. ActualWidth updated to horizontal. -->
- [x] Apply same axis swap to the `complex_diagram` warning branch
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/internal/mermaid/validator.go | Notes: Both violation and warning branches use ActualWidth: horizontal, ActualDepth: vertical. -->

### 0.2 — Update CLI flag defaults in `docs_validate_mermaid.go`

- [x] Change `--max-width` flag default: `3` → `4`
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/cmd/docs_validate_mermaid.go | Notes: IntVar default 3→4. -->
- [x] Change `--max-depth` flag default: `5` → `0`
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/cmd/docs_validate_mermaid.go | Notes: IntVar default 5→0 (0=sentinel for unlimited). -->
- [x] Add sentinel: map `--max-depth 0` → `math.MaxInt` in `RunE` before passing
    to `ValidateBlocks`
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/cmd/docs_validate_mermaid.go | Notes: if validateMermaidMaxDepth == 0 { validateMermaidMaxDepth = math.MaxInt } added in RunE. Added math import. -->

### 0.3 — Fix broken tests in `validator_test.go`

- [x] Run `nx run rhino-cli:test:quick` — note which test cases fail under new thresholds
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: 3 tests failed: "width at limit+1 violation", "both exceeded warning only", "width only exceeded violation". -->
- [x] For each failing test: either raise `span` values to ≥ 5 or pass explicit
    `ValidateOptions{MaxWidth: 3}` to preserve old threshold for backward-compat testing
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/internal/mermaid/validator_test.go | Notes: All 3 fixed with explicit ValidateOptions{MaxLabelLen:30, MaxWidth:3, MaxDepth:5}. -->
- [x] Add direction-aware test cases (see `tech-docs.md` §"Test Updates"):
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/rhino-cli/internal/mermaid/validator_test.go | Notes: All 4 cases added with new source constants. -->
  - [x] `LR_wide_in_depth`: LR, span=2, depth=6 → violation
  - [x] `LR_tall_in_span`: LR, span=5, depth=2 → no violation
  - [x] `TD_wide_in_span`: TD, span=5, depth=2 → violation
  - [x] `TD_deep_in_depth`: TD, span=2, depth=6 → no violation

### 0.4 — Verify Phase 0

- [x] `nx run rhino-cli:test:quick` passes (all tests including new direction-aware cases)
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: 15/15 TestValidateBlocks subtests pass. mermaid=97.0%, overall 90.09%≥90%. -->
- [x] `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | tail -5` — record
    new violation count (will differ from baseline; this is expected)
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: Post-Phase-0: 101 files failing, 218 violations (baseline was 102/236 — direction fix reclassified some LR diagrams). -->
- [ ] Commit Phase 0: `fix(rhino-cli): make mermaid width check direction-aware`

### 0.5 — Re-audit and prepare Phase 1 batch lists

- [ ] Run full audit: `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 > /tmp/mermaid-post-phase0.txt`
- [ ] Count remaining violations: `grep "^✗" /tmp/mermaid-post-phase0.txt | wc -l`
- [ ] Extract failing files grouped by directory to plan batches (see `tech-docs.md`
      §"Batch Delivery Structure" for suggested groupings)
- [ ] Update README.md baseline section with post-Phase-0 counts

---

## Phase 1 — Fix Violations in docs/

**Rule**: each batch must reach zero errors for its files before committing. Pre-existing
errors discovered during batch work must be fixed in the same batch, not deferred.

**Pre-push gate**: the pre-push hook runs `rhino-cli validate:mermaid --changed-only`,
which validates every changed `.md` file in the push using the CLI defaults set in Phase 0
(MaxWidth=4, MaxDepth=unlimited). This acts as a second verification gate — each batch
push must pass it before reaching `origin/main`. The manual verify step below and the
pre-push gate use identical thresholds.

### Batch 1 — TypeScript documentation

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "typescript"`
- [ ] Fix each file using strategies from `tech-docs.md`
- [ ] Verify: `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | grep "^✗" | grep "typescript"` → zero lines
- [ ] Commit: `fix(docs): fix mermaid violations in typescript docs`

### Batch 2 — Python documentation

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "python"`
- [ ] Fix each file
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in python docs`

### Batch 3 — Go documentation

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "golang\|go/"`
- [ ] Fix each file
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in golang docs`

### Batch 4 — Framework documentation

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "framework"`
- [ ] Fix each file (high semantic-review risk — read surrounding prose)
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in framework docs`

### Batch 5 — Software engineering (root and misc)

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "software-engineering"` (exclude prior batches)
- [ ] Fix each file (primarily label shortening)
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in software-engineering docs`

### Batch 6 — Tutorials

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "tutorials"`
- [ ] Fix each file
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in tutorials`

### Batch 7 — How-to guides

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "how-to"`
- [ ] Fix each file
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in how-to docs`

### Batch 8 — Reference documentation

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep "reference"`
- [ ] Fix each file
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in reference docs`

### Batch 9 — Architecture / C4 diagrams

- [ ] Identify files: `grep "^✗" /tmp/mermaid-post-phase0.txt | grep -i "architecture\|c4"`
- [ ] Fix each file (complex diagrams — use splitting strategy; preserve all relationships)
- [ ] Verify zero errors for batch files
- [ ] Commit: `fix(docs): fix mermaid violations in architecture docs`

### Batch 10 — Remaining files (catch-all)

- [ ] Identify remaining files: `grep "^✗" /tmp/mermaid-post-phase0.txt` (any not yet fixed)
- [ ] Fix each file
- [ ] Verify: `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | grep "^✗"` → zero lines (full repo)
- [ ] Commit: `fix(docs): fix remaining mermaid violations`

### Phase 1 Final Verification

- [ ] `go run ./apps/rhino-cli/main.go docs validate-mermaid` exits 0
- [ ] `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | grep "\[width_exceeded\]"` → zero lines
- [ ] `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | grep "\[label_too_long\]"` → zero lines
- [ ] `nx run rhino-cli:test:quick` still passes
- [ ] Push to `origin/main` and monitor the `ose-public` GitHub Actions CI workflow —
      confirm all jobs pass; if any job fails, fix the root cause and push a follow-up
      commit before proceeding to Phase 2

---

## Phase 2 — Governance Propagation

### 2.1 — Update `governance/conventions/formatting/diagrams.md`

- [ ] Invoke `repo-rules-maker` agent to update `governance/conventions/formatting/diagrams.md`
      with the following changes (see `tech-docs.md` §"Phase 2" for details):
  - [ ] Add "Flowchart Width Constraints" section (MaxWidth=4, direction-aware rules,
        label limits, `rhino-cli docs validate-mermaid` reference)
  - [ ] Add "Width Violation Fix Strategy Guide" with decision tree
  - [ ] Update "Diagram Orientation" section: soften "MUST use TD"
  - [ ] Remove duplicate Error 7
  - [ ] Clarify label length discrepancy (30 raw chars vs. ~20 chars rendered)

### 2.2 — Quality gate

- [ ] Run `repo-rules-quality-gate` in strict mode
- [ ] Confirm zero CRITICAL, HIGH, and MEDIUM findings
- [ ] Fix any findings before proceeding

### 2.3 — Commit Phase 2

```
docs(governance): document direction-aware mermaid width constraints and fix strategies
```

### 2.4 — Final validation

- [ ] `nx run rhino-cli:test:quick` passes
- [ ] `go run ./apps/rhino-cli/main.go docs validate-mermaid` exits 0
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes for affected projects
- [ ] Push to `origin/main` and monitor the `ose-public` GitHub Actions CI workflow —
      confirm all jobs pass; if any job fails, fix the root cause and push a follow-up
      commit before considering Phase 2 complete

---

## Archival

- [ ] Verify ALL delivery checklist items above are ticked
- [ ] Verify ALL quality gates pass (local `nx affected -t typecheck lint test:quick
spec-coverage` + CI green)
- [ ] Move `plans/in-progress/2026-04-25__fix-mermaid-validation-and-violations/` →
      `plans/done/2026-04-25__fix-mermaid-validation-and-violations/` via `git mv`
- [ ] Update `plans/in-progress/README.md` — remove entry for this plan
- [ ] Update `plans/done/README.md` — add entry with completion date
- [ ] Commit: `chore(plans): archive fix-mermaid-validation-and-violations plan`
