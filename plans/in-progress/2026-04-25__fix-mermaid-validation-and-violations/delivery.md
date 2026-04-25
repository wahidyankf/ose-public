# Delivery — Fix Mermaid Validation and Violations

## Pre-Execution Checklist

- [ ] Read all five plan files (README.md, brd.md, prd.md, tech-docs.md, this file)
- [ ] Confirm working in `ose-public` repo root (not a parent worktree — subrepo
      worktrees have access to `docs/` and `apps/rhino-cli/`)
- [ ] Run baseline audit and record numbers:
      `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | tail -5`
- [ ] Confirm `nx run rhino-cli:test:quick` passes before any changes

---

## Phase 0 — Direction-Aware Validator

### 0.1 — Update `validator.go`

- [ ] Open `apps/rhino-cli/internal/mermaid/validator.go`
- [ ] Confirm `MermaidDiagram` struct has a `Direction` field (check `types.go`)
  - [ ] If missing: add `Direction string` to `MermaidDiagram` and parse it from
        the header line in `parser.go`
- [ ] Change `DefaultValidateOptions()`:
  - `MaxWidth: 3` → `MaxWidth: 4`
  - `MaxDepth: 5` → `MaxDepth: math.MaxInt`
  - Add `"math"` to imports if needed
- [ ] Replace direction-blind Rule 2 with direction-aware logic (see `tech-docs.md`
      §"Target State"): use `diagram.Direction` to select `horizontal`/`vertical`
- [ ] Apply same axis swap to the `complex_diagram` warning branch

### 0.2 — Update CLI flag defaults in `docs_validate_mermaid.go`

- [ ] Change `--max-width` flag default: `3` → `4`
- [ ] Change `--max-depth` flag default: `5` → `0`
- [ ] Add sentinel: map `--max-depth 0` → `math.MaxInt` in `RunE` before passing
      to `ValidateBlocks`

### 0.3 — Fix broken tests in `validator_test.go`

- [ ] Run `nx run rhino-cli:test:quick` — note which test cases fail under new thresholds
- [ ] For each failing test: either raise `span` values to ≥ 5 or pass explicit
      `ValidateOptions{MaxWidth: 3}` to preserve old threshold for backward-compat testing
- [ ] Add direction-aware test cases (see `tech-docs.md` §"Test Updates"):
  - [ ] `LR_wide_in_depth`: LR, span=2, depth=6 → violation
  - [ ] `LR_tall_in_span`: LR, span=5, depth=2 → no violation
  - [ ] `TD_wide_in_span`: TD, span=5, depth=2 → violation
  - [ ] `TD_deep_in_depth`: TD, span=2, depth=6 → no violation

### 0.4 — Verify Phase 0

- [ ] `nx run rhino-cli:test:quick` passes (all tests including new direction-aware cases)
- [ ] `go run ./apps/rhino-cli/main.go docs validate-mermaid 2>&1 | tail -5` — record
      new violation count (will differ from baseline; this is expected)
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
- [ ] Push to `origin/main` and monitor GitHub Actions — confirm CI green

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
- [ ] `nx affected -t lint test:quick` passes for affected projects
- [ ] Push and confirm CI green

---

## Archival

- [ ] Move `plans/in-progress/2026-04-25__fix-mermaid-validation-and-violations/` →
      `plans/done/2026-04-25__fix-mermaid-validation-and-violations/`
- [ ] Update `plans/in-progress/README.md` — remove entry for this plan
- [ ] Commit: `chore(plans): archive fix-mermaid-validation-and-violations plan`
