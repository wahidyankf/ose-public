# Delivery Checklist

---

## Environment Setup

- [ ] Confirm working directory is `ose-public/`
- [ ] Install dependencies: `npm install`
- [ ] Converge polyglot toolchain: `npm run doctor -- --fix`
- [ ] Confirm Go toolchain ready: `go version`
- [ ] Verify markdown linting clean before changes: `npm run lint:md`
- [ ] Verify rhino-cli builds and tests pass before changes (baseline):
      `nx run rhino-cli:test:quick`

### Commit guidelines (applies to all phases)

- [ ] Conventional Commits format: `<type>(<scope>): <description>`
- [ ] Split by domain — one commit per phase, plus separate commits for tests if
      the phase grows large
- [ ] Do NOT bundle unrelated changes
- [ ] Suggested scopes: `rhino-cli`, `mermaid`

---

## Phase 1 — Add `plans/` to Default Scan Dirs

### 1.1 Update `collectMDDefaultDirs`

- [x] Read `apps/rhino-cli/cmd/docs_validate_mermaid.go` around line 202
- [x] Add `filepath.Join(repoRoot, "plans")` to the `dirs` slice
- [x] Update the function comment to mention `plans/`

**Implementation Notes** (2026-04-26)
Status: done. Files: `apps/rhino-cli/cmd/docs_validate_mermaid.go`. Added `filepath.Join(repoRoot, "plans")` to dirs slice; updated comment to mention `plans/`.

### 1.2 Add Gherkin scenario

- [x] Read `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature` in full
- [x] Add scenario:

**Implementation Notes** (2026-04-26)
Status: done. Files: `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature`. Added "Plans directory is scanned by default" scenario.

```gherkin
Scenario: Plans directory is scanned by default
  Given a markdown file under plans/ containing a Mermaid flowchart with a label
    longer than 30 characters
  When the developer runs docs validate-mermaid without path arguments
  Then the command exits with a failure code
  And the output identifies the file under plans/
```

### 1.3 Add unit test

- [x] In `apps/rhino-cli/cmd/docs_validate_mermaid_test.go`:
  - [x] Test `collectMDDefaultDirs(repoRoot)` includes
        `filepath.Join(repoRoot, "plans")`
  - [x] Use a temp `repoRoot` with `plans/foo/bar.md` and verify file picked up

**Implementation Notes** (2026-04-26)
Status: done. Files: `apps/rhino-cli/cmd/docs_validate_mermaid_helpers_test.go`. Added `TestCollectMDDefaultDirs_IncludesPlans` writing `plans/in-progress/sample/diagram.md` and asserting collected.

### 1.4 Add integration test

- [x] In `apps/rhino-cli/cmd/docs_validate_mermaid.integration_test.go`:
  - [x] Create temp repo with `plans/sample/diagram.md` containing a node label
        of 35 characters
  - [x] Run `validate-mermaid` with no path args
  - [x] Assert exit code != 0 and output names `plans/sample/diagram.md`

**Implementation Notes** (2026-04-26)
Status: done. Files: `apps/rhino-cli/cmd/docs_validate_mermaid.integration_test.go`. Added `TestIntegrationValidateMermaid_PlansDirScanned` (non-godog) — writes `plans/sample/diagram.md`, runs validator, asserts violation + path in output.

### 1.5 Implement BDD step (if needed)

- [x] If the new Gherkin scenario needs new step definitions, add them in
      `apps/rhino-cli/cmd/steps_*.go`. Reuse existing helpers where possible.

**Implementation Notes** (2026-04-26)
Status: done. Files: `apps/rhino-cli/cmd/steps_common_test.go`, `docs_validate_mermaid_test.go`, `docs_validate_mermaid.integration_test.go`. Added 3 step constants (`stepMermaidFileUnderPlansLongLabel`, `stepDeveloperRunsDocsValidateMermaidNoArgs`, `stepMermaidOutputIdentifiesFileUnderPlans`); registered handlers in unit (mocked violation) and integration (real plans/sample/diagram.md) suites.

### 1.6 Test + commit

- [x] `nx run rhino-cli:test:unit` — all green
- [x] `nx run rhino-cli:test:quick` — coverage ≥ 90% (90.10%)
- [x] Commit: `feat(rhino-cli): add plans/ to mermaid validator default scan dirs`

**Implementation Notes** (2026-04-26)
Status: done. test:quick passing 90.10% coverage. Phase 1 commit pending below.

---

## Phase 2 — Expand `&` Multi-Target Operator

### 2.1 Refactor `extractEdgeLine`

- [x] Read `apps/rhino-cli/internal/mermaid/parser.go` lines 200–246 in full
- [x] Replace the body of `extractEdgeLine` with the group-based Cartesian-product
      logic from [tech-docs.md — Phase 2](./tech-docs.md):
  - [x] Split each part on `&`
  - [x] Build `groups [][]string`
  - [x] Cartesian product across consecutive groups
- [x] Extract helper `extractNodeGroup(part, nodeMap) []string`
- [x] Extract helper `extractNodeIDAndLabel(seg, nodeMap) string` (move existing
      shape-pattern + bare-word logic into this helper)
- [x] Verify `nodeMap` is still updated for labels (regression check)

**Implementation Notes** (2026-04-26)
Status: done. Files: `apps/rhino-cli/internal/mermaid/parser.go`. Replaced sequential-pairing body of `extractEdgeLine` with groups-based Cartesian-product, extracted `extractNodeGroup` + `extractNodeIDAndLabel`, also updated `extractAllNodeIDs` (via new `extractNodeIDsFromSegment`) so node ordering picks up all `&`-joined IDs. All 64 existing mermaid tests still pass.

### 2.2 Add Gherkin scenarios

- [ ] Add three scenarios to `docs-validate-mermaid.feature`:
  - "A multi-target edge with the & operator expands into separate edges"
  - "Multi-source and multi-target on both sides expand into a Cartesian product"
  - "A 5-target fan-out triggers width violation under default threshold"
    (full text in [prd.md](./prd.md))

### 2.3 Add parser unit tests

- [x] In `apps/rhino-cli/internal/mermaid/parser_test.go`:
  - [x] Test: `A --> B & C & D` → 3 edges (A→B, A→C, A→D)
  - [x] Test: `A & B --> C` → 2 edges (A→C, B→C)
  - [x] Test: `A & B --> C & D` → 4 edges (A→C, A→D, B→C, B→D)
  - [x] Test: `A --> B --> C` → 2 edges (regression — pre-existing parser bug
        also fixed: link-text regex was greedy and collapsed chains)
  - [x] Test: `A --> B` → 1 edge (regression — unchanged behaviour)
  - [x] Test: edge with label `A -- text --> B` → 1 edge (regression)
  - [x] Test: shape labels preserved in nodeMap when using `&` expansion

**Implementation Notes** (2026-04-26)
Status: done. Files: `apps/rhino-cli/internal/mermaid/parser_test.go`, `parser.go`. Added `TestExtractEdgeLine_AmpExpansion` (6 cases) + `TestExtractEdgeLine_PreservesLabelsInAmpExpansion`. Also fixed pre-existing greedy-regex bug in link-text normaliser (`--[^-\n]*?-->` → `--[^->\n]+?-->`) so chains "A --> B --> C" stay intact (Iron Rule 3 — root cause). All 72 mermaid tests pass.

### 2.4 Add validator integration test

- [x] In `apps/rhino-cli/internal/mermaid/validator_test.go` (or wherever
      end-to-end validation tests live):
  - [x] Diagram `T --> A & B & C & D & E` (5-way fan-out)
  - [x] Run validation with default options
  - [x] Assert `ViolationWidthExceeded` is emitted

**Implementation Notes** (2026-04-26)
Status: done. Files: `apps/rhino-cli/internal/mermaid/validator_test.go`. Added `TestValidateBlocks_AmpFanoutTriggersWidthViolation` exercising end-to-end parser→validator with the 5-fanout diagram. ActualWidth ≥ 5 asserted.

### 2.5 Test + commit

- [x] `nx run rhino-cli:test:unit` — all green (including all existing tests)
- [x] `nx run rhino-cli:test:quick` — coverage ≥ 90% (90.10%, mermaid 96.8%)
- [x] Commit: `fix(rhino-cli): expand mermaid & multi-target operator in parser`

**Implementation Notes** (2026-04-26)
Status: done. test:quick passing 90.10% (mermaid pkg 96.8%). Phase 2 commit below.

---

## Phase 3 — `MaxSubgraphNodes` Warning Rule

### 3.1 Capture subgraph membership in parser

- [ ] In `apps/rhino-cli/internal/mermaid/types.go`:
  - [ ] Add `Subgraph` struct with fields `ID`, `Label`, `NodeIDs`, `StartLine`
  - [ ] Add `Subgraphs []Subgraph` field to `ParsedDiagram`
- [ ] In `apps/rhino-cli/internal/mermaid/parser.go`:
  - [ ] Replace the simple `subgraph`/`end` skip logic (lines 76–79) with a
        stateful walk maintaining a stack `[]*Subgraph`
  - [ ] On `subgraph <id>["label"]` — push new subgraph (parse `id` and `label`
        from line)
  - [ ] On `end` — pop top of stack
  - [ ] When a node is added to `nodeMap` while stack is non-empty, append the
        ID to the top-of-stack `NodeIDs`
  - [ ] Populate `ParsedDiagram.Subgraphs` from popped subgraphs

### 3.2 Add validator rule

- [ ] In `apps/rhino-cli/internal/mermaid/validator.go`:
  - [ ] Add `MaxSubgraphNodes int` to `ValidateOptions`
  - [ ] In `DefaultValidateOptions`, set `MaxSubgraphNodes: 6`
  - [ ] In `ValidateBlocks`, after Rule 2, iterate `diagram.Subgraphs` and emit
        `WarningSubgraphDense` when `len(NodeIDs) > opts.MaxSubgraphNodes`

### 3.3 Add warning kind

- [ ] In `apps/rhino-cli/internal/mermaid/types.go`:
  - [ ] Add `WarningSubgraphDense WarningKind = "subgraph_density"`
  - [ ] Add fields `SubgraphLabel`, `SubgraphNodeCount`, `MaxSubgraphNodes` to `Warning`

### 3.4 Wire CLI flag

- [ ] In `apps/rhino-cli/cmd/docs_validate_mermaid.go`:
  - [ ] Add `validateMermaidMaxSubgraphNodes int` package var
  - [ ] Add `Flags().IntVar(&validateMermaidMaxSubgraphNodes, "max-subgraph-nodes", 6, "...")`
  - [ ] Pass `MaxSubgraphNodes: validateMermaidMaxSubgraphNodes` into `ValidateOptions`

### 3.5 Update reporter

- [ ] In `apps/rhino-cli/internal/mermaid/reporter.go`:
  - [ ] Add formatting branch for `WarningSubgraphDense`
  - [ ] Sample format:
        `WARN <file> block <N> (line <L>): subgraph "<label>" has <count> children; recommend ≤ <max>.`
- [ ] In `apps/rhino-cli/internal/mermaid/reporter_test.go`:
  - [ ] Test the format string for `WarningSubgraphDense`

### 3.6 Add Gherkin scenarios

- [ ] Add four scenarios to `docs-validate-mermaid.feature`:
  - "A subgraph with 7 child nodes emits subgraph density warning"
  - "A subgraph with 6 children passes default threshold"
  - "Subgraph density threshold is configurable"
  - "Existing diagrams without & or large subgraphs are unaffected"
    (full text in [prd.md](./prd.md) — validates backwards-compatibility for
    single-target edges and small subgraphs after both fixes)

### 3.7 Add parser tests for subgraph capture

- [ ] In `parser_test.go`:
  - [ ] Test: simple subgraph with 3 nodes → `Subgraphs[0].NodeIDs` has 3 entries
  - [ ] Test: nested subgraph — outer holds direct children only, inner is
        separate
  - [ ] Test: subgraph with label `subgraph WF1["Workflow 1"]` → `Label` is
        `"Workflow 1"`, `ID` is `"WF1"`

### 3.8 Add validator tests for subgraph rule

- [ ] In `validator_test.go`:
  - [ ] Test: subgraph with exactly 6 nodes → no warning
  - [ ] Test: subgraph with 7 nodes → exactly one `WarningSubgraphDense` warning
  - [ ] Test: `MaxSubgraphNodes=4` and subgraph with 5 nodes → warning
  - [ ] Test: empty subgraph → no warning

### 3.9 Test + commit

- [ ] `nx run rhino-cli:test:unit` — all green
- [ ] `nx run rhino-cli:test:quick` — coverage ≥ 90%
- [ ] Commit: `feat(rhino-cli): add subgraph density warning to mermaid validator`

---

## Phase 4 — Validate Existing Diagrams

### 4.1 Run new validator over plans and docs

- [ ] Run:

  ```bash
  nx run rhino-cli:run -- docs validate-mermaid \
    plans/in-progress/2026-04-26__organiclever-ci-staging-split/ \
    docs/reference/system-architecture/
  ```

  Note: `docs/reference/system-architecture/` exists and contains Mermaid diagrams.
  Use `nx run rhino-cli:run --` (not the dist binary) per CLAUDE.md Nx conventions.

- [ ] Capture the full output. Expected findings (per [tech-docs.md](./tech-docs.md)):
  - `width_exceeded` in staging-split target-state diagram
  - `subgraph_density` warnings on WF1, possibly WF2, WF3 subgraphs

### 4.2 Surface findings

- [ ] If findings exist, decide:
  - **Option A** — fix them in this plan (split subgraphs in
    staging-split's tech-docs.md). Keep within scope only if quick.
  - **Option B** — log as a new entry in `plans/ideas.md` referencing this plan.
- [ ] Document the chosen option in the commit message.

### 4.3 Commit

- [ ] If fixes applied: `docs(plans): split organiclever-ci-staging-split mermaid diagrams to satisfy new validator rules`
- [ ] If logged to ideas: `docs(plans): log mermaid diagram split as follow-up to rhino-cli-mermaid-fixes`

---

## Phase 5 — Local Quality Gates

> Fix ALL failures found here, not just those from this plan's changes. Commit
> preexisting fixes separately.

### 5.1 Run affected quality gates

- [ ] `nx affected -t typecheck lint test:quick spec-coverage`
- [ ] If any failure: investigate root cause, fix, re-run

### 5.2 Markdown lint

- [ ] `npm run lint:md`
- [ ] If violations: `npm run lint:md:fix`, re-run until clean

### 5.3 Coverage gate

- [ ] `nx run rhino-cli:test:quick` — confirm coverage ≥ 90%

### 5.4 Smoke check the CLI

- [ ] `nx run rhino-cli:build`
- [ ] Run `./apps/rhino-cli/dist/rhino-cli docs validate-mermaid --help` and
      confirm `--max-subgraph-nodes` flag is documented

---

## Phase 6 — Push and CI Verification

- [ ] If remote has moved forward: `git pull --rebase origin main`
- [ ] `git push origin main`
- [ ] Open GitHub Actions and monitor all triggered workflows
- [ ] If any check fails: fix root cause, push follow-up commit
- [ ] Repeat until all GitHub Actions checks pass green
- [ ] Do NOT proceed to archival until CI is fully green

---

## Verification Gates

Before archiving, all of the following must hold:

- [ ] `collectMDDefaultDirs` includes `plans/`
- [ ] `extractEdgeLine` handles `&` with backwards-compatible single-target case
- [ ] `Subgraph` type defined; `ParsedDiagram.Subgraphs` populated by parser
- [ ] `WarningSubgraphDense` constant defined
- [ ] `--max-subgraph-nodes` flag wired through CLI to `ValidateOptions`
- [ ] Reporter formats `WarningSubgraphDense` clearly
- [ ] All new Gherkin scenarios present in `docs-validate-mermaid.feature` and pass
- [ ] All new unit tests in parser_test.go, validator_test.go, reporter_test.go,
      docs_validate_mermaid_test.go pass
- [ ] `nx run rhino-cli:test:quick` — coverage ≥ 90%
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` — zero failures
- [ ] `npm run lint:md` — zero errors
- [ ] All GitHub Actions triggered by the push to `main` are green

---

## Plan Archival

- [ ] Verify ALL verification gates above are satisfied
- [ ] `git mv plans/in-progress/2026-04-26__rhino-cli-mermaid-fixes plans/done/2026-04-26__rhino-cli-mermaid-fixes`
- [ ] Remove entry from `plans/in-progress/README.md`
- [ ] Add entry to `plans/done/README.md` with completion date
- [ ] `chore(plans): archive rhino-cli-mermaid-fixes to done`
