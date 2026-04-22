# Delivery: Fix All Mermaid Diagram Violations

## Phase 0 — Worktree setup

- [ ] `cd ose-public && claude --worktree mermaid-violations-fix`
- [ ] Inside worktree: `npm install && npm run doctor -- --fix`
- [ ] Confirm baseline: `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid . 2>&1 | grep -E "Found [0-9]+ violation"` shows 1095 violations

## Phase 1 — rhino-cli code changes (suppression + plans/done skip)

### 1a — Add `done` to skipDirs

- [ ] Add `"done": true` entry to `skipDirs` map in
      `apps/rhino-cli/cmd/docs_validate_mermaid.go` (same mechanism as `.next`).
      Use the bare basename `"done"` — `walkMDFiles` matches via `d.Name()` which
      returns only the base name, not a relative path; `"plans/done"` would
      silently never match.
- [ ] Add test case to `TestWalkMDFiles_SkipsBuildArtifactDirs` (or a dedicated
      `TestWalkMDFiles_SkipsDoneDir` if the implementation approach differs) verifying
      that a `done/` directory is skipped during walking
- [ ] Update `apps/rhino-cli/README.md` excluded-dirs list to include `done`
      (applies to any directory named `done`, currently only `plans/done` in this
      repo)
- [ ] Confirm: `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid . 2>&1 | grep "plans/done"` — no output

### 1b — Suppression mechanism (`<!-- mermaid-skip -->`)

- [ ] Add `Skip bool` field to `MermaidBlock` in `internal/mermaid/types.go`
      (the struct is declared there, not in `extractor.go`)
- [ ] Update extractor state machine: track `prevLine`; set `block.Skip = true` when
      `prevLine == "<!-- mermaid-skip -->"` and block type is flowchart/graph
- [ ] Add `Skipped int` field to `ValidationResult` in `internal/mermaid/types.go`
- [ ] Update `ValidateBlocks` in `internal/mermaid/validator.go`: skip block and
      increment `result.Skipped` when `block.Skip == true`
- [ ] Update `FormatText`, `FormatJSON`, `FormatMarkdown` in
      `internal/mermaid/reporter.go` to include skipped count in summary line
- [ ] Add 4 new Gherkin scenarios to
      `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature` (see prd.md)
- [ ] Add unit tests (mock FS) for skip scenarios in `internal/mermaid/` test files
- [ ] Add integration tests in
      `apps/rhino-cli/cmd/docs_validate_mermaid.integration_test.go`
- [ ] Run `nx run rhino-cli:test:quick` — must pass ≥90%
- [ ] Run `nx run rhino-cli:lint` — must pass 0 issues
- [ ] Run `nx run rhino-cli:spec-coverage` — must pass

## Phase 2 — Fix `docs/how-to/` and `docs/reference/` (6 files)

- [ ] Run `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid docs/how-to/ docs/reference/ -o text`
- [ ] Fix each violation (structural chaining for width, label splits for labels)
- [ ] Rerun — must show 0 violations for these paths

## Phase 3 — Suppress `specs/apps/*/c4/` (9 files)

- [ ] Run `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid specs/ -o text`
- [ ] Add `<!-- mermaid-skip -->` before each violating C4 block
- [ ] Rerun — must show 0 violations for `specs/`

## Phase 4 — Fix/suppress `apps/oseplatform-web/content/` (6 files)

- [ ] Run `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid apps/oseplatform-web/content/ -o text`
- [ ] Fix label violations (add `<br/>` splits or abbreviate)
- [ ] Suppress wide phase-summary/week-timeline diagrams with `<!-- mermaid-skip -->`
- [ ] Rerun — must show 0 violations for this path

## Phase 5 — Fix/suppress `docs/explanation/` (96 files)

Delegate to `docs-fixer` agent with explicit instructions:

- Fix span 4–6 process-flow diagrams by chaining nodes
- Fix label_too_long by adding `<br/>` splits or abbreviating
- Suppress span 7+ ecosystem/overview diagrams with `<!-- mermaid-skip -->`
- Run `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid docs/explanation/ -o text` after each batch
- [ ] `docs/explanation/software-engineering/programming-languages/` — fix/suppress
- [ ] `docs/explanation/software-engineering/platform-web/` — fix/suppress
- [ ] `docs/explanation/software-engineering/architecture/` — fix/suppress
- [ ] `docs/explanation/software-engineering/development/` — fix/suppress
- [ ] Rerun — must show 0 violations for `docs/explanation/`

## Phase 6 — Fix/suppress `apps/ayokoding-web/content/` (244 files)

Largest area — delegate by subdirectory to content-aware agents. After each
batch, rerun the validator on that subdirectory to confirm 0 remaining.

- [ ] `content/en/learn/software-engineering/programming-languages/` — fix/suppress
      (span 4–5 process flows → fix; span 6+ parallel-feature grids → suppress)
- [ ] `content/en/learn/software-engineering/platform-web/` — fix/suppress
- [ ] `content/en/learn/software-engineering/architecture/` — fix/suppress
      (DDD aggregates, C4-style diagrams → suppress; process flows → fix)
- [ ] `content/en/learn/software-engineering/algorithm-and-data-structures/` — fix/suppress
- [ ] `content/en/learn/software-engineering/automation-testing/` — fix/suppress
- [ ] `content/en/learn/software-engineering/automation-tools/` — fix/suppress
- [ ] `content/en/learn/software-engineering/data/` — fix/suppress
- [ ] `content/en/learn/software-engineering/system-design/` — suppress
      (system design diagrams are inherently wide; suppression preferred)
- [ ] `content/en/learn/software-engineering/compilers-and-interpreters/` — fix/suppress
- [ ] `content/en/learn/artificial-intelligence/` — fix/suppress
- [ ] `content/en/learn/software-engineering/infrastructure/` — fix/suppress
- [ ] Rerun — must show 0 violations for `apps/ayokoding-web/content/`

## Phase 7 — Widen Nx target scope

- [ ] Update `validate:mermaid` in `apps/rhino-cli/project.json`:
  - Change `command` from `… docs validate-mermaid governance/ .claude/` to
    `… docs validate-mermaid .`
  - Update `inputs` to `["{projectRoot}/**/*.go", "{workspaceRoot}/**/*.md"]`
- [ ] Run `nx run rhino-cli:validate:mermaid` — must exit 0

## Phase 8 — Full quality gate

> **Important**: Fix ALL failures found during quality gates, not just those
> caused by your changes. This follows the root cause orientation principle —
> proactively fix preexisting errors encountered during work. Do not defer or
> mention-and-skip existing issues.

- [ ] `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid . 2>&1 | grep -E "Found [0-9]+ violation"`
      — must show 0 violations
- [ ] `nx run rhino-cli:test:quick` — ≥90% coverage
- [ ] `nx run rhino-cli:lint` — 0 issues
- [ ] `nx run rhino-cli:spec-coverage` — pass
- [ ] `nx run rhino-cli:test:integration` — pass
- [ ] `npm run lint:md` — 0 errors

## Phase 9 — Commit, push, PR, and archive

### Commit guidelines

Commit changes thematically — do NOT bundle all changes into one commit.
Follow Conventional Commits format: `<type>(<scope>): <description>`.

Suggested commit sequence (at minimum):

1. `feat(rhino-cli): add mermaid-skip suppression mechanism and done-dir skip`
   — rhino-cli Go code changes (types.go, extractor.go, validator.go,
   reporter.go, docs_validate_mermaid.go) and corresponding unit/integration
   tests
2. `test(rhino-cli): add Gherkin scenarios for mermaid-skip suppression`
   — new scenarios in `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature`
3. `chore(rhino-cli): widen validate:mermaid Nx target to full repo`
   — `apps/rhino-cli/project.json` change only
4. `fix(docs): fix and suppress mermaid violations in docs/ and specs/`
   — markdown changes in `docs/`, `specs/`
5. `fix(content): fix and suppress mermaid violations in oseplatform-web content`
   — markdown changes in `apps/oseplatform-web/content/`
6. `fix(content): fix and suppress mermaid violations in docs/explanation/`
   — markdown changes in `docs/explanation/`
7. `fix(content): fix and suppress mermaid violations in ayokoding-web content`
   — markdown changes in `apps/ayokoding-web/content/`

### Push and CI

- [ ] Commit all changes on `worktree-mermaid-violations-fix` branch using the
      thematic sequence above
- [ ] Push branch to `origin`
- [ ] Open draft PR against `main`
- [ ] Monitor GitHub Actions workflows for the push
- [ ] Verify all CI checks pass
- [ ] If any CI check fails, fix immediately and push a follow-up commit
- [ ] Do NOT proceed to plan archival until CI is green and PR is ready to
      merge

### Plan archival (after PR merges)

- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder:
      `git mv plans/in-progress/2026-04-23__mermaid-violations-fix plans/done/2026-04-23__mermaid-violations-fix`
- [ ] Update `plans/in-progress/README.md` — remove the entry for this plan
- [ ] Update `plans/done/README.md` — add the entry for this plan with
      completion date
- [ ] Commit: `chore(plans): move mermaid-violations-fix to done`
