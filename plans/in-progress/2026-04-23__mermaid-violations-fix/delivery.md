# Delivery: Fix All Mermaid Diagram Violations

## Phase 0 — Worktree setup

- [ ] `cd ose-public && claude --worktree mermaid-violations-fix`
- [ ] Inside worktree: `npm install && npm run doctor -- --fix`
- [ ] Confirm baseline: `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid . 2>&1 | tail -3` shows 1095 violations

## Phase 1 — Suppression mechanism (rhino-cli code)

- [ ] Add `Skip bool` field to `MermaidBlock` in `internal/mermaid/extractor.go`
- [ ] Update extractor state machine: track `prevLine`; set `block.Skip = true` when
      `prevLine == "<!-- mermaid-skip -->"` and block type is flowchart/graph
- [ ] Add `Skipped int` field to `ValidationResult` in `internal/mermaid/types.go`
- [ ] Update `ValidateBlocks` in `internal/mermaid/validator.go`: skip block and
      increment `result.Skipped` when `block.Skip == true`
- [ ] Update `FormatText`, `FormatJSON`, `FormatMarkdown` in
      `internal/mermaid/reporter.go` to include skipped count in summary line
- [ ] Add 4 new Gherkin scenarios to
      `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature` (see prd.md)
- [ ] Add unit tests (mock FS) for skip scenarios in
      `internal/mermaid/` test files
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

## Phase 4 — Suppress `plans/done/` (13 files)

- [ ] Run `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid plans/done/ -o text`
- [ ] Add `<!-- mermaid-skip -->` before each violating block (historical diagrams)
- [ ] Rerun — must show 0 violations for `plans/done/`

## Phase 5 — Fix/suppress `apps/oseplatform-web/content/` (6 files)

- [ ] Run `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid apps/oseplatform-web/content/ -o text`
- [ ] Fix label violations (add `<br/>` splits or abbreviate)
- [ ] Suppress wide phase-summary/week-timeline diagrams with `<!-- mermaid-skip -->`
- [ ] Rerun — must show 0 violations for this path

## Phase 6 — Fix/suppress `docs/explanation/` (96 files)

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

## Phase 7 — Fix/suppress `apps/ayokoding-web/content/` (244 files)

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

## Phase 8 — Widen Nx target scope

- [ ] Update `validate:mermaid` in `apps/rhino-cli/project.json`:
  - Change `command` from `… docs validate-mermaid governance/ .claude/` to
    `… docs validate-mermaid .`
  - Update `inputs` to `["{projectRoot}/**/*.go", "{workspaceRoot}/**/*.md"]`
- [ ] Run `nx run rhino-cli:validate:mermaid` — must exit 0

## Phase 9 — Full quality gate

- [ ] `CGO_ENABLED=0 go run -C apps/rhino-cli main.go docs validate-mermaid . 2>&1 | tail -3`
      — must show 0 violations
- [ ] `nx run rhino-cli:test:quick` — ≥90% coverage
- [ ] `nx run rhino-cli:lint` — 0 issues
- [ ] `nx run rhino-cli:spec-coverage` — pass
- [ ] `nx run rhino-cli:test:integration` — pass
- [ ] `npm run lint:md` — 0 errors

## Phase 10 — PR and archive

- [ ] Commit all changes on `worktree-mermaid-violations-fix` branch
- [ ] Push branch to `origin`
- [ ] Open draft PR against `main`
- [ ] After PR merges: move this plan folder to `plans/done/`
