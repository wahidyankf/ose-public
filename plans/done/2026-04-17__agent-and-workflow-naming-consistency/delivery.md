# Delivery Checklist

## Phase 0: Environment Setup

- [x] `npm install` — install/update dependencies
- [x] `npm run doctor -- --fix` — converge the full polyglot toolchain (required for Go build tooling;
      `postinstall` runs `doctor || true` and silently tolerates drift)
- [x] `nx run rhino-cli:test:quick` passes — verify baseline before changes

### Commit Guidelines

- Follow Conventional Commits format: `<type>(<scope>): <description>`
- Each phase maps to one commit (per the commit strategy in tech-docs.md)
- Do NOT bundle changes from separate phases into a single commit
- Fix unrelated preexisting issues in a separate commit before starting this plan's phases

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

## Phase 1: Rename `docs-link-general-checker` → `docs-link-checker`

- [x] `git mv .claude/agents/docs-link-general-checker.md .claude/agents/docs-link-checker.md`
- [x] `git mv .opencode/agent/docs-link-general-checker.md .opencode/agent/docs-link-checker.md`
- [x] Update `name:` frontmatter in `.claude/agents/docs-link-checker.md`
- [x] Update `name:` frontmatter in `.opencode/agent/docs-link-checker.md` (opencode format derives name from filename — no field to update)
- [x] Grep sweep live refs across repo (excluded plan folder + plans/done)
- [x] Replace `docs-link-general-checker` → `docs-link-checker` in each live hit (37 files changed)
- [x] `npm run sync:claude-to-opencode` — no drift
- [x] Verify zero live refs remain outside plan folder
- [x] `npm run lint:md` passes
- [x] Commit: `refactor(agents): rename docs-link-general-checker to docs-link-checker`

## Phase 2: Rename `swe-e2e-test-dev` → `swe-e2e-dev`

- [x] `git mv .claude/agents/swe-e2e-test-dev.md .claude/agents/swe-e2e-dev.md`
- [x] `git mv .opencode/agent/swe-e2e-test-dev.md .opencode/agent/swe-e2e-dev.md`
- [x] Update `name:` frontmatter in `.claude/agents/swe-e2e-dev.md`
- [x] Update `name:` frontmatter in `.opencode/agent/swe-e2e-dev.md`
- [x] Grep sweep live refs (same path list as Phase 1)
- [x] Replace `swe-e2e-test-dev` → `swe-e2e-dev` in each live hit
- [x] `npm run sync:claude-to-opencode` — confirm no drift
- [x] Verify zero live refs remain: `Grep "swe-e2e-test-dev"` excluding `plans/done`, `generated-reports`,
      `plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/`, `.git`, `node_modules`
- [x] `npm run lint:md` passes
- [x] Commit: `refactor(agents): rename swe-e2e-test-dev to swe-e2e-dev`

## Phase 3: Rename `web-researcher` → `web-research-maker`

- [x] `git mv .claude/agents/web-researcher.md .claude/agents/web-research-maker.md`
- [x] `git mv .opencode/agent/web-researcher.md .opencode/agent/web-research-maker.md`
- [x] Update `name:` frontmatter in `.claude/agents/web-research-maker.md`
- [x] Update `name:` frontmatter in `.opencode/agent/web-research-maker.md`
- [x] Grep sweep live refs (same path list as Phase 1)
- [x] Replace `web-researcher` → `web-research-maker` in each live hit
- [x] `npm run sync:claude-to-opencode` — confirm no drift
- [x] Verify zero live refs remain: `Grep "web-researcher"` excluding `plans/done`, `generated-reports`,
      `plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/`, `.git`, `node_modules`
- [x] `npm run lint:md` passes
- [x] Commit: `refactor(agents): rename web-researcher to web-research-maker`

## Phase 4: Rename `repo-governance-*` triad → `repo-rules-*` (atomic)

- [x] `git mv .claude/agents/repo-governance-maker.md .claude/agents/repo-rules-maker.md`
- [x] `git mv .claude/agents/repo-governance-checker.md .claude/agents/repo-rules-checker.md`
- [x] `git mv .claude/agents/repo-governance-fixer.md .claude/agents/repo-rules-fixer.md`
- [x] `git mv .opencode/agent/repo-governance-maker.md .opencode/agent/repo-rules-maker.md`
- [x] `git mv .opencode/agent/repo-governance-checker.md .opencode/agent/repo-rules-checker.md`
- [x] `git mv .opencode/agent/repo-governance-fixer.md .opencode/agent/repo-rules-fixer.md`
- [x] Update `name:` frontmatter in each of the six renamed files
- [x] Update cross-references **inside** the triad's own bodies (checker mentions fixer, fixer mentions checker, maker mentions both)
- [x] Grep sweep live refs (same path list as Phase 1) for all of:
  - `repo-governance-maker`
  - `repo-governance-checker`
  - `repo-governance-fixer`
- [x] Replace with `repo-rules-maker`, `repo-rules-checker`, `repo-rules-fixer` respectively
- [x] **Special attention**: `governance/conventions/structure/agent-naming.md` (created earlier by the previous repo-governance-maker run) already mentions the old names; update those hits here, not later
- [x] `npm run sync:claude-to-opencode` — confirm no drift
- [x] Verify zero live refs remain: `Grep "repo-governance-(maker|checker|fixer)"` excluding `plans/done`,
      `generated-reports`, `plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/`,
      `.git`, `node_modules`
- [x] `npm run lint:md` passes
- [x] Commit: `refactor(agents): rename repo-governance triad to repo-rules`

## Phase 5: Publish Naming Rule + Role Vocabulary

- [x] Add "Naming Rule" + "Role Vocabulary" sections to `.claude/agents/README.md` per [tech-docs.md](./tech-docs.md)
- [x] `npm run sync:claude-to-opencode` — propagate to `.opencode/agent/README.md`
- [x] Verify both READMEs contain the rule statement and all seven roles (maker, checker, fixer, dev, deployer, executor, manager) with semantics and examples
- [x] Run rule compliance audit from [tech-docs.md](./tech-docs.md) — expect empty output
- [x] `npm run lint:md` passes
- [x] Commit: `docs(agents): publish naming rule and role vocabulary`

## Phase 6: Propagate to governance (via `repo-rules-maker`)

- [x] Invoke `repo-rules-maker` (the renamed agent, post-Phase-4) with the spec in [tech-docs.md](./tech-docs.md) §"Governance propagation" — task: create `governance/conventions/structure/agent-naming.md` capturing the unified rule, scope vocabulary, role vocabulary, enforcement command, and examples
- [x] Verify the file exists with required frontmatter (title, description, category, subcategory, tags, created, updated) and all required sections
- [x] Confirm `repo-rules-maker` added the convention to `governance/conventions/structure/README.md` index
- [x] Confirm `repo-rules-maker` added the convention to `governance/conventions/README.md` master index
- [x] Confirm `CLAUDE.md` AI Agents section references the new convention
- [x] Confirm `.claude/agents/README.md` and `.opencode/agent/README.md` Naming Rule sections link to the convention as normative source
- [x] Run rule compliance audit from [tech-docs.md](./tech-docs.md) — still empty output
- [x] `npm run lint:md` passes
- [x] Run `repo-rules-checker` — no new violations raised by agent-naming rule
- [x] Commit: `docs(governance): add agent-naming convention`

## Phase 7: Rename `docs/quality-gate.md` → `docs/docs-quality-gate.md`

- [x] `git mv governance/workflows/docs/quality-gate.md governance/workflows/docs/docs-quality-gate.md`
- [x] Confirm frontmatter `name:` is already `docs-quality-gate` (no change needed — filename was the outlier)
- [x] Grep sweep live refs for the old path `governance/workflows/docs/quality-gate.md` across: `CLAUDE.md`, `AGENTS.md`, all of `governance/**`, all of `docs/**`, `.claude/agents/**`, `.opencode/agent/**`, `.claude/skills/**`, `.opencode/skill/**`, `plans/in-progress/**`, `plans/backlog/**`
- [x] Replace old path → new path in each live hit
- [x] Verify zero live refs remain (excluding `plans/done`, `generated-reports`,
      `plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/`, `.git`, `node_modules`)
- [x] `npm run lint:md` passes
- [x] Commit: `refactor(workflows): rename docs/quality-gate to docs/docs-quality-gate`

## Phase 8: Move `workflows/repository/` → `workflows/repo/` and rename to `repo-rules-quality-gate`

- [x] `mkdir -p governance/workflows/repo/`
- [x] `git mv governance/workflows/repository/repository-rules-validation.md governance/workflows/repo/repo-rules-quality-gate.md`
- [x] `git mv governance/workflows/repository/README.md governance/workflows/repo/README.md`
- [x] Update content of `governance/workflows/repo/README.md`:
  - [ ] Replace `repo-governance-checker` → `repo-rules-checker`
  - [ ] Replace `repo-governance-fixer` → `repo-rules-fixer`
  - [ ] Update the internal file link to `./repo-rules-quality-gate.md`
- [x] Verify `governance/workflows/repository/` is now empty and removed by git: `ls governance/workflows/` must not show `repository`
- [x] Update `name:` frontmatter in the renamed workflow file to `repo-rules-quality-gate`
- [x] Grep sweep live refs (same path list as Phase 6) for all of:
  - string `repository-rules-validation`
  - path `governance/workflows/repository/`
  - string `repository-rules-quality-gate` (in case any earlier draft or cross-ref uses the interim name)
- [x] Replace each with `repo-rules-quality-gate` / `governance/workflows/repo/` as appropriate in live hits
- [x] Verify zero live refs to `repository-rules-*` or `workflows/repository/` remain
      (excluding `plans/done`, `generated-reports`,
      `plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/`, `.git`, `node_modules`)
- [x] `npm run lint:md` passes
- [x] Commit: `refactor(workflows): move repository/ to repo/ and rename to repo-rules-quality-gate`

## Phase 9: Rename `specs-validation` → `specs-quality-gate`

- [x] `git mv governance/workflows/specs/specs-validation.md governance/workflows/specs/specs-quality-gate.md`
- [x] Update `name:` frontmatter in the renamed file to `specs-quality-gate`
- [x] Grep sweep live refs (same path list as Phase 6)
- [x] Replace `specs-validation` → `specs-quality-gate` in each live hit
- [x] Verify zero live refs remain: `Grep "specs-validation"` excluding `plans/done`, `generated-reports`,
      `plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/`, `.git`, `node_modules`
- [x] `npm run lint:md` passes
- [x] Commit: `refactor(workflows): rename specs-validation to specs-quality-gate`

## Phase 10: Publish Workflow Naming Rule + Type Vocabulary

- [x] Add "Naming Rule" + "Type Vocabulary" + "Meta reference exception" sections to `governance/workflows/README.md` per [tech-docs.md](./tech-docs.md)
- [x] Verify README contains the rule statement and all three types (quality-gate, execution, setup) with semantics and examples
- [x] Run workflow rule compliance audit from [tech-docs.md](./tech-docs.md) — expect empty output
- [x] `npm run lint:md` passes
- [x] Commit: `docs(workflows): publish naming rule and type vocabulary`

## Phase 11: Propagate workflow rule to governance (via `repo-rules-maker`)

- [x] Invoke `repo-rules-maker` with the spec in [tech-docs.md](./tech-docs.md) §"Governance propagation — workflow-naming" — task: create `governance/conventions/structure/workflow-naming.md`
- [x] Verify the file exists with required frontmatter and all required sections
- [x] Confirm `repo-rules-maker` added the convention to `governance/conventions/structure/README.md` index
- [x] Confirm `repo-rules-maker` added the convention to `governance/conventions/README.md` master index
- [x] Confirm `CLAUDE.md` references the new convention
- [x] Confirm `governance/workflows/README.md` Naming Rule section links to the convention as normative source
- [x] Run workflow rule compliance audit — still empty output
- [x] `npm run lint:md` passes
- [x] Run `repo-rules-checker` — no new violations raised by workflow-naming rule
- [x] Commit: `docs(governance): add workflow-naming convention`

## Phase 12: Implement rhino-cli naming validators

- [x] Add Gherkin specs (mirrors AC13 scenarios):
  - [ ] Create `specs/apps/rhino/cli/gherkin/agents-validate-naming.feature`
  - [ ] Create `specs/apps/rhino/cli/gherkin/workflows-validate-naming.feature`
  - [ ] Update `specs/apps/rhino/cli/gherkin/README.md` to list both new features
  - [ ] Update `specs/apps/rhino/README.md` if it enumerates commands
- [x] Implement shared validator core in `apps/rhino-cli/internal/naming/` (pure functions, ≥90% unit coverage)
- [x] Implement `agents_validate_naming.go` Cobra subcommand under existing `agents.go` parent (mirrors `agents_validate_claude.go` pattern: handler file + test file + integration test file)
- [x] Create `workflows.go` Cobra parent and `workflows_validate_naming.go` subcommand (same three-file pattern)
- [x] Add godog unit tests (consume Gherkin specs; mocked filesystem via tmpdir fixtures)
- [x] Add godog integration tests (`//go:build integration`; exercise real repo tree via `cmd.RunE()`)
- [x] Add Nx targets to `apps/rhino-cli/project.json`:
  - [ ] `validate:naming-agents` with inputs covering `.claude/agents/**` and `.opencode/agent/**`
  - [ ] `validate:naming-workflows` with inputs covering `governance/workflows/**`
  - [ ] Both cacheable, `outputs: []`
- [x] `nx run rhino-cli:test:quick` passes with coverage ≥ 90%
- [x] `nx run rhino-cli:test:integration` passes
- [x] `nx run rhino-cli:spec-coverage` passes (new feature files fully covered by step definitions)
- [x] `nx run rhino-cli:validate:naming-agents` passes on the current tree (expect zero violations after Phases 1-11)
- [x] `nx run rhino-cli:validate:naming-workflows` passes on the current tree
- [x] `npm run lint:md` passes (Gherkin specs are plain text, but README updates must lint)
- [x] Commit: `feat(rhino-cli): add agents validate-naming and workflows validate-naming`

## Phase 13: Enforce validators in pre-push and CI

- [x] Extend `.husky/pre-push` with a gated block:
  - [ ] If `git diff --name-only @{u}..HEAD 2>/dev/null` touches `.claude/agents/**` or `.opencode/agent/**`, run `nx run rhino-cli:validate:naming-agents`
  - [ ] If the push range touches `governance/workflows/**`, run `nx run rhino-cli:validate:naming-workflows`
  - [ ] Non-zero exit aborts the push with a readable error message
- [x] Extend the ose-public CI quality-gate workflow (`.github/workflows/`) with two unconditional steps running both Nx validator targets
- [x] Update [governance/development/quality/code.md](../../../governance/development/quality/code.md) to document the new pre-push step
- [x] Dry-run: make a no-op branch touching an agent file, push, confirm the hook triggers the validator
- [x] Dry-run: push a branch touching only `docs/` and confirm the validator does not run (scope gate)
- [x] Dry-run: synthesise a naming violation locally, confirm pre-push blocks the push
- [x] Open a dummy PR with the synthesised violation, confirm CI blocks the merge
- [x] Revert the dry-run artifacts:
  - [ ] Delete dry-run branches: `git branch -D <dry-run-branch>`, `git push origin --delete <dry-run-branch>`
  - [ ] Close the dummy PR if not auto-closed
  - [ ] Verify no dry-run artifacts remain in git log
- [x] `npm run lint:md` passes
- [x] Commit: `feat(ci): enforce naming validators in pre-push and PR quality gate`

### Post-Push CI Verification

- [x] Push all commits to `main`
- [x] Navigate to GitHub Actions for ose-public and monitor the triggered workflow run
- [x] Verify the quality-gate workflow passes (lint, typecheck, test:quick, and the new validate-naming steps)
- [x] If any check fails, fix immediately before moving to Phase 14

## Phase 14: Final validation

### Local Quality Gates (Before Final Sign-Off)

- [x] `nx affected -t typecheck` passes
- [x] `nx affected -t lint` passes
- [x] `nx affected -t test:quick` passes
- [x] `nx affected -t spec-coverage` passes

> **Important**: Fix ALL failures found above, not just those caused by your changes. This
> follows the root cause orientation principle — proactively fix preexisting errors encountered
> during work.

### Acceptance Criteria Verification

- [x] Pre-commit hooks pass for all staged changes (already gated above)
- [x] Cross-check all 15 acceptance criteria in [requirements.md](./requirements.md) — each scenario satisfied
- [x] `nx run rhino-cli:validate:naming-agents` returns zero violations
- [x] `nx run rhino-cli:validate:naming-workflows` returns zero violations
- [x] `repo-rules-checker` final pass clean
- [x] Pre-push hook fires on a test touch of `.claude/agents/` and completes successfully
- [x] CI quality gate passes on a clean PR

### Plan Archival

- [x] Verify ALL delivery checklist items are ticked
- [x] Verify ALL quality gates pass (local + CI)
- [x] `git mv plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency plans/done/2026-04-17__agent-and-workflow-naming-consistency`
- [x] Update `plans/in-progress/README.md` — remove this plan's entry
- [x] Update `plans/done/README.md` — add this plan's entry with completion date
- [x] `npm run lint:md` passes
- [x] Commit: `chore(plans): archive agent-and-workflow-naming-consistency plan`
