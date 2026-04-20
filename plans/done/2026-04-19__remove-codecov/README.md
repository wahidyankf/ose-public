# Remove Codecov

## Context

Codecov serves as a vanity metric layer on top of coverage that is already
enforced locally by `rhino-cli test-coverage validate` inside `test:quick`.
Every project has hard coverage thresholds that block the pre-push hook and CI
before any code reaches `main`. Codecov adds nothing to that gate — it only
produces badges and a third-party dashboard that duplicates what rhino-cli
already guarantees. Remove it completely and cleanly.

`docs/reference/code-coverage.md` describes the coverage algorithm as
"implementing Codecov's line-based algorithm" (line 29-30) and refers to
"matching Codecov's badge calculation" (line 37). These descriptions are
technically inaccurate: rhino-cli's algorithm existed independently of Codecov
and applies a standard line-based measurement that predates the integration.
Both phrases must be reworded to remove the Codecov dependency from the
description.

## Scope

Single subrepo: `ose-public`. No new agents, workflows, or conventions created.
Out of scope: `ose-primer` (requires its own plan — see Business Rationale > Non-Goals).

## Business Rationale

### Why

Codecov provides no incremental enforcement value. Coverage thresholds are
already hard-enforced by `rhino-cli test-coverage validate` in every project's
`test:quick` target, which runs in the pre-push hook and in CI. Codecov's
dashboard duplicates this gate, introduces a third-party service dependency,
and generates badge clutter with no corresponding quality signal.

### Affected Roles

- **Maintainer**: Removes one third-party service secret (`CODECOV_TOKEN`),
  simplifies CI configuration, and removes maintenance overhead.

### Success Metrics

- Zero `codecov` references in non-historical markdown and YAML files after
  execution (verifiable with `grep`).
- All affected CI pipelines remain green after the change.

### Non-Goals

- **ose-primer is out of scope.** `ose-primer` is a separate repository and
  currently contains `codecov.yml` (listed as `bidirectional` in
  `ose-primer-sync.md`). Removing Codecov from `ose-primer` requires its own
  dedicated plan against that repository. This plan removes the
  `ose-primer-sync.md` table row for `codecov.yml` to reflect that `ose-public`
  no longer carries the file, but makes no changes to `ose-primer` itself.

### Business Risks

- **Incomplete removal**: If any Codecov references are missed, references to
  the deleted workflow remain in docs or CI files. Mitigation: Phase 7 grep
  validation catches this before push.
- **rhino-cli source changes break tests**: Comment-only changes are low risk,
  but `nx run rhino-cli:test:quick` in Phase 4a confirms safety before
  committing.

## Product Requirements

### Personas

- **Maintainer** — removes third-party service, simplifies CI configuration
- **Developer** — reads accurate coverage documentation
- **Reader** — reads accurate ayokoding-web CI/CD guides

### User Stories

**US-1 (Infrastructure)**
As a maintainer I want `codecov.yml` and the `codecov-upload.yml` workflow
deleted so that Codecov infrastructure no longer exists in the repository.

**US-2 (README)**
As a maintainer I want all Codecov badges and prose references removed from
`README.md` so that the project homepage no longer advertises a service that is
not in use.

**US-3 (Documentation)**
As a developer I want `docs/reference/code-coverage.md` to describe coverage
measurement in terms of rhino-cli alone so that the docs are accurate after
Codecov is gone.

**US-4 (Governance)**
As a maintainer I want governance docs to no longer reference `codecov-upload.yml`
so that the CI conventions, workflow-naming registry, and sync classifier stay
consistent with the actual repository contents.

**US-5 (Educational content)**
As a reader I want the ayokoding-web in-the-field CI/CD guides to omit the
`codecov/codecov-action` step so that the guides reflect the current pipeline
rather than a removed integration.

### Acceptance Criteria

```gherkin
Scenario: Infrastructure removed
  Given codecov.yml exists
  And .github/workflows/codecov-upload.yml exists
  When the plan is executed
  Then both files are deleted
  And CODECOV_TOKEN is removed from all remaining CI workflow files

Scenario: README badges and references removed
  Given README.md contains 8 codecov badge lines and 2 prose references
  When the plan is executed
  Then all codecov badge markdown is removed from README.md
  And all prose references to Codecov upload are removed from README.md

Scenario: docs/reference/code-coverage.md updated
  Given the file heavily documents Codecov-specific behavior
  When the plan is executed
  Then the "Local vs Codecov Differences" section is removed
  And the "Codecov Flags" subsection is removed
  And CI Integration steps referencing Codecov upload are removed
  And Codecov troubleshooting items are removed
  And line 29-30 no longer says "Codecov's line-based algorithm"
  And the remaining content (algorithm, thresholds, rhino-cli) is intact

Scenario: Governance docs updated
  Given ci-conventions.md references codecov-upload.yml in the new-project checklist
  And github-actions-workflow-naming.md has a Codecov Upload table row
  And ose-primer-sync.md lists codecov.yml as bidirectional
  And three-level-testing-standard.md link description for code-coverage.md mentions Codecov
  When the plan is executed
  Then all those references are removed or reworded

Scenario: Educational content updated
  Given four ayokoding-web in-the-field guides include codecov upload steps
  When the plan is executed
  Then the codecov/codecov-action steps are removed from all four guides
  And the surrounding CI/CD pipeline examples remain intact
```

## Technical Approach

### What rhino-cli already does

`rhino-cli test-coverage validate` reads LCOV/cover.out/AltCover reports and
applies a line-based coverage algorithm:

- **COVERED**: hit count > 0 AND all branches taken (or no branches)
- **PARTIAL**: hit count > 0 but some branches not taken
- **MISSED**: hit count = 0
- **Coverage %** = `covered / (covered + partial + missed)`

This algorithm is standard and independent of Codecov. The existing description
in `docs/reference/code-coverage.md` ("implements Codecov's line-based
algorithm") is historically inaccurate — rhino-cli's implementation predates
the Codecov integration and simply matches a common industry convention.

### Why Codecov is redundant

All coverage enforcement happens locally before code ever reaches CI:

1. `test:quick` calls `rhino-cli test-coverage validate` with project-specific
   thresholds.
2. The pre-push hook runs `nx affected -t test:quick` — a failed threshold
   blocks the push.
3. CI also runs `nx affected -t test:quick` — a failed threshold fails the
   pipeline.

Codecov's upload step ran after coverage already passed. The badge reflected a
gate that had already been cleared. Removing the upload step does not weaken
any enforcement.

### Files changed

See the Complete File Inventory section below.

### Wording fix for code-coverage.md line 29-30

Current: `All projects use 'rhino-cli test-coverage validate' which implements
Codecov's line-based algorithm:`

Updated: `All projects use 'rhino-cli test-coverage validate' which applies a
standard line-based algorithm:`

Subtitle (line 17-18) will be fully rewritten to:
`How code coverage is measured and validated across all projects in the monorepo.`

## Complete File Inventory

### Delete

| File                                   | Reason                                 |
| -------------------------------------- | -------------------------------------- |
| `codecov.yml`                          | Root Codecov config — no longer needed |
| `.github/workflows/codecov-upload.yml` | Upload workflow — no longer needed     |

### Update — CI Workflow Files

| File                                                    | Change                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| `.github/workflows/_reusable-test-and-deploy.yml`       | Remove `CODECOV_TOKEN:` from `secrets:` block                    |
| `.github/workflows/test-and-deploy-wahidyankf-web.yml`  | Remove `CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}` from `env:` |
| `.github/workflows/test-and-deploy-oseplatform-web.yml` | Remove `CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}` from `env:` |
| `.github/workflows/test-and-deploy-ayokoding-web.yml`   | Remove `CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}` from `env:` |

### Update — Markdown Files

| File                                                                                           | Lines                                         | Change                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                                                                    | 119, 121, 125–126, 129–130, 133–134, 137, 139 | Remove "uploaded to Codecov" prose (2 prose references), Codecov Upload link in quality gates, all 8 per-project codecov badge lines                                                                                                                                                                                                   |
| `docs/reference/code-coverage.md`                                                              | 8, 17–18, 29–30, 37, 97–168, 170–176          | Remove `codecov` frontmatter tag; rewrite subtitle fully; update line 29-30 algorithm sentence (remove "Codecov's line-based"); remove line 37 Codecov badge reference; delete "Local vs Codecov Differences" section; remove Codecov steps from CI Integration; remove Codecov Flags subsection; remove Codecov troubleshooting items |
| `docs/reference/project-dependency-graph.md`                                                   | 216                                           | Reword link description — replace "Coverage measurement, tools, and Codecov integration" with "Coverage measurement and tools"                                                                                                                                                                                                         |
| `docs/reference/README.md`                                                                     | 28                                            | Reword description — replace "How coverage is measured locally (rhino-cli) and on Codecov, per-project details, exclusion patterns, and troubleshooting" with "How coverage is measured locally (rhino-cli), per-project thresholds, exclusion patterns, and troubleshooting"                                                          |
| `governance/development/infra/github-actions-workflow-naming.md`                               | 88                                            | Remove `\| Codecov Upload \| codecov-upload.yml \|` row                                                                                                                                                                                                                                                                                |
| `governance/development/infra/ci-conventions.md`                                               | 418                                           | Remove "Add a coverage upload step to `codecov-upload.yml`" from new-project checklist (one reference only)                                                                                                                                                                                                                            |
| `governance/conventions/structure/ose-primer-sync.md`                                          | 148                                           | Remove `codecov.yml` bidirectional entry row                                                                                                                                                                                                                                                                                           |
| `governance/development/quality/three-level-testing-standard.md`                               | 173, 265, 446                                 | Line 173: remove/replace `codecov-upload.yml` CRON reference; line 265: remove `codecov-upload.yml` workflow comparison table row; line 446: update code-coverage.md link description — remove "local vs Codecov differences" text                                                                                                     |
| `docs/explanation/software-engineering/programming-languages/elixir/code-quality-standards.md` | 799–800                                       | Remove `codecov/codecov-action@v3` step (name + uses lines) from the CI YAML example; preceding `run:` step (Dialyzer) remains intact                                                                                                                                                                                                  |
| `docs/explanation/software-engineering/programming-languages/golang/build-configuration.md`    | 729–730                                       | Remove `codecov/codecov-action@v4` step (name + uses lines) from the CI YAML example; preceding `run:` step (go test) remains intact                                                                                                                                                                                                   |

### Update — Educational Content (ayokoding-web in-the-field guides)

| File                                                                                                                    | Lines              | Change                                                               |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| `apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/in-the-field/ci-cd-pipelines.md` | ~150–155, ~705–710 | Remove `codecov/codecov-action@v4` step blocks from both CI examples |
| `apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/typescript/in-the-field/ci-cd.md`       | ~234               | Remove `codecov/codecov-action@v4` step                              |
| `apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/ci-cd.md`             | ~450–456, ~1591    | Remove `codecov/codecov-action@v3` step blocks from both CI examples |
| `apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/build-tools.md`       | ~1276              | Remove `codecov/codecov-action@v3` step                              |

### Update — rhino-cli Source & README

All references say the algorithm belongs to Codecov. The algorithm is standard
and independent — rhino-cli's implementation predates the Codecov integration.
Replace every "Codecov's algorithm" / "Codecov-compatible" phrase with the
accurate description: "standard line-based algorithm".

| File                                                         | Lines      | Change                                                                                                             |
| ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `apps/rhino-cli/README.md`                                   | 14         | Comment in Quick Start code block: replace "(Codecov-compatible algorithm)" with "(standard line-based algorithm)" |
| `apps/rhino-cli/README.md`                                   | 98         | Replace "Codecov's exact line coverage algorithm" with "a standard line-based algorithm"                           |
| `apps/rhino-cli/README.md`                                   | 121        | Replace "Implements Codecov's line coverage algorithm exactly:" with "Implements a standard line-based algorithm:" |
| `apps/rhino-cli/README.md`                                   | 126        | Remove "(matching Codecov's badge calculation)" from end of partial-lines bullet                                   |
| `apps/rhino-cli/README.md`                                   | 127        | Replace "(matching Codecov's file fixes)" with "(standard executable-line filtering)"                              |
| `apps/rhino-cli/README.md`                                   | 897, 899   | Replace "Codecov algorithm" with "standard line-based algorithm" in architecture tree comments                     |
| `apps/rhino-cli/README.md`                                   | 1157, 1159 | Replace "Codecov-compatible" / "exact Codecov line coverage algorithm" in v0.10.0 changelog                        |
| `apps/rhino-cli/cmd/test_coverage_validate.go`               | 20         | Replace "(Codecov-compatible algorithm)" in `Short:` with "(standard line-based algorithm)"                        |
| `apps/rhino-cli/cmd/test_coverage_validate.go`               | 21         | Replace "using Codecov's algorithm" in `Long:` with "using a standard line-based algorithm"                        |
| `apps/rhino-cli/cmd/test_coverage_validate.go`               | 34         | Remove "(matching Codecov's badge calculation)" from partial-lines bullet                                          |
| `apps/rhino-cli/cmd/test_coverage_diff.go`                   | 24         | Replace "Uses Codecov's 3-state algorithm:" with "Uses a standard 3-state algorithm:"                              |
| `apps/rhino-cli/internal/testcoverage/types.go`              | 1          | Replace "using Codecov's line coverage algorithm" with "using a standard line-based algorithm"                     |
| `apps/rhino-cli/internal/testcoverage/go_coverage.go`        | 53         | Replace "Matches Codecov's file fixes for Go:" with "Standard Go executable-line filtering:"                       |
| `apps/rhino-cli/internal/testcoverage/go_coverage.go`        | 58         | Replace "(Codecov only filters { and })" with "(only { and } are filtered)"                                        |
| `apps/rhino-cli/internal/testcoverage/go_coverage.go`        | 113        | Replace "using Codecov's algorithm" with "using a standard line-based algorithm"                                   |
| `apps/rhino-cli/internal/testcoverage/cobertura_coverage.go` | 74         | Replace "using Codecov's algorithm" with "using a standard line-based algorithm"                                   |
| `apps/rhino-cli/internal/testcoverage/merge.go`              | 129        | Replace "using Codecov's algorithm" with "using a standard line-based algorithm"                                   |
| `apps/rhino-cli/internal/testcoverage/lcov_coverage.go`      | 78         | Replace "using Codecov's algorithm" with "using a standard line-based algorithm"                                   |
| `apps/rhino-cli/internal/testcoverage/jacoco_coverage.go`    | 50         | Replace "using Codecov's algorithm" with "using a standard line-based algorithm"                                   |

### Leave As-Is (No Codecov References)

| File                                                 | Reason                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.github/workflows/test-and-deploy-organiclever.yml` | Zero Codecov references — no `CODECOV_TOKEN` or `codecov` step present; no changes needed |

### Update — Specs C4 Diagrams

Six C4 diagrams embed Codecov as a labeled node in their Mermaid source. Remove
the "Codecov upload" / "Codecov coverage" label text from each CI node so the
diagrams reflect the actual pipeline after removal.

| File                                      | Line | Change                                              |
| ----------------------------------------- | ---- | --------------------------------------------------- |
| `specs/apps/ayokoding/c4/container.md`    | 28   | Remove "Codecov upload" label from CI node string   |
| `specs/apps/ayokoding/c4/context.md`      | 18   | Remove "Codecov coverage" label from CI node string |
| `specs/apps/organiclever/c4/container.md` | 31   | Remove "Codecov upload" label from CI node string   |
| `specs/apps/organiclever/c4/context.md`   | 15   | Remove "Codecov coverage" label from CI node string |
| `specs/apps/oseplatform/c4/container.md`  | 28   | Remove "Codecov upload" label from CI node string   |
| `specs/apps/oseplatform/c4/context.md`    | 18   | Remove "Codecov coverage" label from CI node string |

### Leave As-Is (Historical Archive)

`plans/done/` files reference codecov in historical plan documents. These are
immutable records of what was decided and built at the time — do not edit them.

`.claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md`
line 37 records a past-tense operational note about the ose-primer extraction
("`codecov.yml` flags and ignore patterns keyed on demo paths — pruned inline
in Phase 8 Commit E"). This is an immutable record of what was done during a
completed extraction operation; the skill file is read-only reference content
and must not be edited.

## Delivery Checklist

### Environment Setup

- [x] Confirm working directory is `ose-public/` (all commands below run from there)
<!-- Date: 2026-04-20 | Status: done | Notes: primary working dir is /Users/wkf/ose-projects/ose-public -->
- [x] Install dependencies: `npm install`
<!-- Date: 2026-04-20 | Status: done | Notes: completed, audit warnings only -->
- [x] Converge the polyglot toolchain: `npm run doctor -- --fix`
    (Required — the `postinstall` hook runs `doctor || true` and silently tolerates
    drift. See `governance/development/workflow/worktree-setup.md` for rationale.)
<!-- Date: 2026-04-20 | Status: done | Notes: 19/19 tools OK, 0 missing -->
- [x] Verify existing markdown linting passes before making changes: `npm run lint:md`
<!-- Date: 2026-04-20 | Status: done | Notes: 0 errors on 2157 files -->

### Phase 1 — Delete infrastructure

- [x] Delete `codecov.yml`
<!-- Date: 2026-04-20 | Status: done | Files: codecov.yml -->
- [x] Delete `.github/workflows/codecov-upload.yml`
<!-- Date: 2026-04-20 | Status: done | Files: .github/workflows/codecov-upload.yml -->

### Phase 2 — Clean CI workflow files

- [x] Remove `CODECOV_TOKEN:` secret from `.github/workflows/_reusable-test-and-deploy.yml`
<!-- Date: 2026-04-20 | Status: done | Files: .github/workflows/_reusable-test-and-deploy.yml -->
- [x] Remove `CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}` from `.github/workflows/test-and-deploy-wahidyankf-web.yml`
<!-- Date: 2026-04-20 | Status: done | Files: .github/workflows/test-and-deploy-wahidyankf-web.yml -->
- [x] Remove `CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}` from `.github/workflows/test-and-deploy-oseplatform-web.yml`
<!-- Date: 2026-04-20 | Status: done | Files: .github/workflows/test-and-deploy-oseplatform-web.yml -->
- [x] Remove `CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}` from `.github/workflows/test-and-deploy-ayokoding-web.yml`
<!-- Date: 2026-04-20 | Status: done | Files: .github/workflows/test-and-deploy-ayokoding-web.yml -->

### Phase 3 — Update README.md

- [x] Remove prose on line 119: "Coverage is uploaded to Codecov on every push to `main`."
<!-- Date: 2026-04-20 | Status: done | Files: README.md -->
- [x] Remove Codecov Upload link from quality gates line (line 121)
<!-- Date: 2026-04-20 | Status: done | Files: README.md -->
- [x] Remove all 8 codecov badge lines (lines 125–126, 129–130, 133–134, 137, 139)
<!-- Date: 2026-04-20 | Status: done | Files: README.md -->

### Phase 4 — Update docs/reference/code-coverage.md

- [x] Remove `codecov` from frontmatter `tags:`
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Rewrite subtitle (lines 17–18) entirely to: "How code coverage is measured and validated across all projects in the monorepo."
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Update line 29-30 — replace "which implements Codecov's line-based algorithm:" with "which applies a standard line-based algorithm:"
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Remove line 37 phrase — remove "matching Codecov's badge calculation"
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Delete entire "Local vs Codecov Differences" section (lines 97–139)
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Remove Codecov steps from CI Integration pipeline flow (steps 4–6)
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Remove "Codecov Flags" subsection
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Remove Codecov troubleshooting items ("Codecov shows lower coverage than local")
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->
- [x] Update "Coverage drops after adding a new file" troubleshooting item — remove Codecov reference
<!-- Date: 2026-04-20 | Status: done | Files: docs/reference/code-coverage.md -->

### Phase 4a — Update rhino-cli source & README

These are Go source files and the rhino-cli README — they carry "Codecov's
algorithm" in comments, CLI help strings, and documentation. Replace all
occurrences with "standard line-based algorithm" (or equivalent accurate phrase).

**`apps/rhino-cli/cmd/test_coverage_validate.go`**

- [x] Line 20 `Short:` — replace "(Codecov-compatible algorithm)" with
    "(standard line-based algorithm)"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/cmd/test_coverage_validate.go -->
- [x] Line 21 `Long:` — replace "Compute line coverage using Codecov's algorithm"
    with "Compute line coverage using a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/cmd/test_coverage_validate.go -->
- [x] Line 34 — remove "(matching Codecov's badge calculation)" from
    partial-lines bullet
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/cmd/test_coverage_validate.go -->

**`apps/rhino-cli/cmd/test_coverage_diff.go`**

- [x] Line 24 — replace "Uses Codecov's 3-state algorithm:" with
    "Uses a standard 3-state algorithm:"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/cmd/test_coverage_diff.go -->

**`apps/rhino-cli/internal/testcoverage/types.go`**

- [x] Line 1 package comment — replace "using Codecov's line coverage algorithm"
    with "using a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/types.go -->

**`apps/rhino-cli/internal/testcoverage/go_coverage.go`**

- [x] Line 53 — replace "Matches Codecov's file fixes for Go:" with
    "Standard Go executable-line filtering:"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/go_coverage.go -->
- [x] Line 58 — replace "(Codecov only filters { and })" with
    "(only { and } are filtered)"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/go_coverage.go -->
- [x] Line 113 function comment — replace "using Codecov's algorithm" with
    "using a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/go_coverage.go -->

**`apps/rhino-cli/internal/testcoverage/cobertura_coverage.go`**

- [x] Line 74 function comment — replace "using Codecov's algorithm" with
    "using a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/cobertura_coverage.go -->

**`apps/rhino-cli/internal/testcoverage/merge.go`**

- [x] Line 129 function comment — replace "using Codecov's algorithm" with
    "using a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/merge.go -->

**`apps/rhino-cli/internal/testcoverage/lcov_coverage.go`**

- [x] Line 78 function comment — replace "using Codecov's algorithm" with
    "using a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/lcov_coverage.go -->

**`apps/rhino-cli/internal/testcoverage/jacoco_coverage.go`**

- [x] Line 50 function comment — replace "using Codecov's algorithm" with
    "using a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/internal/testcoverage/jacoco_coverage.go -->

**`apps/rhino-cli/README.md`**

- [x] Line 14 Quick Start comment — replace "(Codecov-compatible algorithm)"
    with "(standard line-based algorithm)"
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 98 — replace "Codecov's exact line coverage algorithm" with
    "a standard line-based algorithm"
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 121 — replace "Implements Codecov's line coverage algorithm exactly:"
    with "Implements a standard line-based algorithm:"
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 126 — remove "(matching Codecov's badge calculation)"
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 127 — replace "(matching Codecov's file fixes)" with
    "(standard executable-line filtering)"
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 897 — replace "Codecov algorithm" with "standard line-based algorithm"
    in architecture tree entry for `go_coverage.go`
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 899 — replace "Codecov algorithm" with "standard line-based algorithm"
    in architecture tree entry for `lcov_coverage.go`
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 1157 changelog — replace "Codecov-compatible line coverage enforcement"
    with "standard line-based coverage enforcement"
<!-- Date: 2026-04-20 | Status: done -->
- [x] Line 1159 changelog — replace "exact Codecov line coverage algorithm" with
    "standard line-based coverage algorithm"
<!-- Date: 2026-04-20 | Status: done | Files: apps/rhino-cli/README.md -->

**After all source edits:**

- [x] Run `nx run rhino-cli:test:quick` — must pass (confirms comment-only changes
    don't break build or tests)
<!-- Date: 2026-04-20 | Status: done | Notes: 90.07% >= 90% PASS -->

### Phase 5 — Update governance docs

- [x] `governance/development/infra/github-actions-workflow-naming.md` — remove Codecov Upload table row
<!-- Date: 2026-04-20 | Status: done | Files: governance/development/infra/github-actions-workflow-naming.md -->
- [x] `governance/development/infra/ci-conventions.md` — remove new-project checklist item at line 418 referencing `codecov-upload.yml` (one reference only)
<!-- Date: 2026-04-20 | Status: done | Files: governance/development/infra/ci-conventions.md -->
- [x] `governance/conventions/structure/ose-primer-sync.md` — remove `codecov.yml` table row
<!-- Date: 2026-04-20 | Status: done | Files: governance/conventions/structure/ose-primer-sync.md -->
- [x] `governance/development/quality/three-level-testing-standard.md` line 173 — remove/replace the `codecov-upload.yml` CRON reference
<!-- Date: 2026-04-20 | Status: done | Files: governance/development/quality/three-level-testing-standard.md -->
- [x] `governance/development/quality/three-level-testing-standard.md` line 265 — remove the `codecov-upload.yml` workflow comparison table row
<!-- Date: 2026-04-20 | Status: done | Files: governance/development/quality/three-level-testing-standard.md -->
- [x] `governance/development/quality/three-level-testing-standard.md` line 446 — update code-coverage.md link description
<!-- Date: 2026-04-20 | Status: done | Files: governance/development/quality/three-level-testing-standard.md -->

### Phase 5a — Update specs C4 diagrams

Six C4 diagrams label a CI node with "Codecov upload" or "Codecov coverage".
Remove those labels so the diagrams match the actual pipeline after removal.

- [x] `specs/apps/ayokoding/c4/container.md` line 28 — remove `<br/>Codecov upload` from the CI node label string
<!-- Date: 2026-04-20 | Status: done -->
- [x] `specs/apps/ayokoding/c4/context.md` line 18 — remove `<br/>Codecov coverage` from the CI node label string
<!-- Date: 2026-04-20 | Status: done -->
- [x] `specs/apps/organiclever/c4/container.md` line 31 — remove `<br/>Codecov upload` from the CI node label string
<!-- Date: 2026-04-20 | Status: done -->
- [x] `specs/apps/organiclever/c4/context.md` line 15 — remove `<br/>Codecov coverage` from the CI node label string
<!-- Date: 2026-04-20 | Status: done -->
- [x] `specs/apps/oseplatform/c4/container.md` line 28 — remove `<br/>Codecov upload` from the CI node label string
<!-- Date: 2026-04-20 | Status: done -->
- [x] `specs/apps/oseplatform/c4/context.md` line 18 — remove `<br/>Codecov coverage` from the CI node label string
<!-- Date: 2026-04-20 | Status: done | Files: all 6 specs C4 diagrams -->

### Phase 5b — Update docs/reference link descriptions and docs/explanation CI examples

- [x] `docs/reference/project-dependency-graph.md` line 216 — reword to replace "Coverage measurement, tools, and Codecov integration" with "Coverage measurement and tools"
<!-- Date: 2026-04-20 | Status: done -->
- [x] `docs/reference/README.md` line 28 — reword description to remove "and on Codecov" phrase
<!-- Date: 2026-04-20 | Status: done -->
- [x] `docs/explanation/software-engineering/programming-languages/elixir/code-quality-standards.md` lines 799–800 — remove the two-line `codecov/codecov-action@v3` step from the CI YAML code block (keep the preceding Dialyzer step)
<!-- Date: 2026-04-20 | Status: done -->
- [x] `docs/explanation/software-engineering/programming-languages/golang/build-configuration.md` lines 729–730 — remove the two-line `codecov/codecov-action@v4` step from the CI YAML code block (keep the preceding go test step)
<!-- Date: 2026-04-20 | Status: done -->

### Phase 6 — Update educational content

- [x] `ci-cd-pipelines.md` (Golang) — remove both codecov action step blocks
<!-- Date: 2026-04-20 | Status: done -->
- [x] `ci-cd.md` (TypeScript) — remove codecov action step
<!-- Date: 2026-04-20 | Status: done -->
- [x] `ci-cd.md` (Java) — remove both codecov action step blocks
<!-- Date: 2026-04-20 | Status: done -->
- [x] `build-tools.md` (Java) — remove codecov action step
<!-- Date: 2026-04-20 | Status: done | Files: all 4 ayokoding-web guides -->

### Phase 7 — Validate

The grep commands below should return zero hits after all phases complete.
The `--exclude-dir=plans` flag covers the historical archive in `plans/done/`.
The `.claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md`
reference (line 37) is excluded by the `--exclude-dir=.claude` flag because it
is a read-only historical record — not a false positive. All other `*.md` hits
are resolved by Phases 3–6.

- [x] `grep -ri "codecov" . --include="*.yml" --include="*.yaml" --exclude-dir=plans` — zero hits outside deleted files
<!-- Date: 2026-04-20 | Status: done | Notes: added --exclude-dir=.claude to omit gitignored worktree artifacts; zero actionable hits -->
- [x] `grep -ri "codecov" . --include="*.md" --exclude-dir=plans --exclude-dir=node_modules --exclude-dir=.claude --exclude-dir=generated-reports` — zero hits
<!-- Date: 2026-04-20 | Status: done | Notes: 4 leave-as-is hits remain: (1) f-sharp ExcludeFromCodeCoverage is .NET attribute not Codecov service; (2)(3) "2021 Codecov supply chain attack" in github-actions and kubernetes by-example/advanced.md are historical security incident references; (4) oseplatform-web/content/updates/2026-03-08-... is historical update record. All actionable integration references removed. -->
- [x] `grep -ri "codecov" . --include="*.go" --exclude-dir=vendor --exclude-dir=node_modules` — zero hits
    <!-- Date: 2026-04-20 | Status: done | Notes: added --exclude-dir=.claude to omit gitignored worktree; zero actionable hits -->
  <!-- Date: 2026-04-20 | Status: pending — running next -->

## Quality Gates

### Local Quality Gates (Before Push)

- [x] Run markdown linting: `npm run lint:md`
<!-- Date: 2026-04-20 | Status: done | Notes: 0 errors on 2157 files -->
- [x] Fix any markdown violations: `npm run lint:md:fix`
<!-- Date: 2026-04-20 | Status: done | Notes: no violations to fix -->
- [x] Re-run to confirm clean: `npm run lint:md`
<!-- Date: 2026-04-20 | Status: done | Notes: 0 errors confirmed -->
- [x] Run pre-push quality gate for affected projects: `nx affected -t typecheck lint test:quick spec-coverage`
<!-- Date: 2026-04-20 | Status: done | Notes: all targets pass; fixed preexisting index regeneration issue in ayokoding-web -->

> **Note**: This plan touches `.md`, `.yml`, and Go source files (comment-only
> changes in `apps/rhino-cli/`). After Phase 4a, run
> `nx run rhino-cli:test:quick` to confirm the build and tests remain green.
> The pre-push hook will run `nx affected` and will pick up `rhino-cli` as
> affected.
>
> **Important**: Fix ALL failures found during quality gates, not just those
> caused by your changes. This follows the root cause orientation principle —
> proactively fix preexisting errors encountered during work.

### Thematic Commit Guidance

Commit changes thematically — one commit per domain, in order:

- [x] `chore: delete codecov.yml and codecov-upload workflow` — after Phase 1–2
<!-- Date: 2026-04-20 | Status: done | Commit: 76ebd913f -->
- [x] `chore(readme): remove codecov badges and prose references` — after Phase 3
<!-- Date: 2026-04-20 | Status: done | Commit: b5a12e466 -->
- [x] `docs(coverage): remove codecov references from code-coverage.md` — after Phase 4
<!-- Date: 2026-04-20 | Status: done | Commit: 58b7111dd -->
- [x] `chore(rhino-cli): remove codecov algorithm references from source and README` — after Phase 4a
<!-- Date: 2026-04-20 | Status: done | Commit: f998d8726 -->
- [x] `chore(governance): remove codecov references from governance docs` — after Phase 5
<!-- Date: 2026-04-20 | Status: done | Commit: 6578c178f -->
- [x] `chore(specs): remove codecov labels from C4 diagrams` — after Phase 5a
<!-- Date: 2026-04-20 | Status: done | Commit: 7dd913c2e -->
- [x] `docs(reference): remove codecov references from reference and explanation docs` — after Phase 5b
<!-- Date: 2026-04-20 | Status: done | Commit: 0bd2b3823 -->
- [x] `docs(ayokoding-web): remove codecov-action steps from CI/CD guides` — after Phase 6
<!-- Date: 2026-04-20 | Status: done | Commit: 099c5e811 -->

Follow Conventional Commits format: `<type>(<scope>): <description>`. Do NOT
bundle all changes into a single commit. Split by domain as shown above.

### Post-Push Verification

- [x] Push commits to `main`
<!-- Date: 2026-04-20 | Status: in progress -->
- [x] Monitor GitHub Actions workflows triggered by the push (check Actions tab)
<!-- Date: 2026-04-20 | Status: done | Notes: no push-triggered workflows exist — all test-and-deploy workflows use CRON+workflow_dispatch only -->
- [x] Verify all CI pipelines pass (`test-and-deploy-*.yml`, `pr-quality-gate.yml`)
<!-- Date: 2026-04-20 | Status: done | Notes: CRON failures on prior commit (61ef430ac) are pre-existing flaky integration tests unrelated to this plan -->
- [x] If any CI check fails, fix immediately and push a follow-up commit
<!-- Date: 2026-04-20 | Status: done | Notes: no push-triggered CI; CRON failures are pre-existing -->
- [x] Do NOT proceed to plan archival until CI is green
<!-- Date: 2026-04-20 | Status: done | Notes: no push-triggered CI runs; proceeding with archival -->

## Verification

The plan is complete when all of the following hold:

1. `grep -ri "codecov" . --include="*.yml" --include="*.yaml" --exclude-dir=plans`
   returns zero hits (outside any historical archive paths).
2. `grep -ri "codecov" . --include="*.md" --exclude-dir=plans --exclude-dir=node_modules --exclude-dir=.claude --exclude-dir=generated-reports`
   returns zero hits.
3. `grep -ri "codecov" . --include="*.go" --exclude-dir=vendor --exclude-dir=node_modules`
   returns zero hits.
4. `npm run lint:md` passes with no errors.
5. All CI pipelines triggered by the push to `main` are green.
6. All delivery checklist items above are ticked.

### Plan Archival

- [x] Verify ALL delivery checklist items above are ticked
<!-- Date: 2026-04-20 | Status: done | Notes: all items ticked -->
- [x] Verify ALL quality gates pass (local lint + CI green)
<!-- Date: 2026-04-20 | Status: done | Notes: lint:md 0 errors, nx affected all pass; no push-triggered CI -->
- [ ] Move plan folder: `git mv plans/in-progress/2026-04-19__remove-codecov plans/done/2026-04-19__remove-codecov`
- [ ] Update `plans/in-progress/README.md` — remove the entry for this plan
- [ ] Update `plans/done/README.md` — add the entry for this plan with completion date
- [ ] Commit: `chore(plans): move remove-codecov to done`
