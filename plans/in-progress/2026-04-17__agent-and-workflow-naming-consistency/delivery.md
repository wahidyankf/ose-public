# Delivery Checklist

## Phase 1: Rename `docs-link-general-checker` → `docs-link-checker`

- [ ] `git mv .claude/agents/docs-link-general-checker.md .claude/agents/docs-link-checker.md`
- [ ] `git mv .opencode/agent/docs-link-general-checker.md .opencode/agent/docs-link-checker.md`
- [ ] Update `name:` frontmatter in `.claude/agents/docs-link-checker.md`
- [ ] Update `name:` frontmatter in `.opencode/agent/docs-link-checker.md`
- [ ] Grep sweep live refs across: agent catalogs, all `.claude/agents/*.md`, all `.opencode/agent/*.md`, all `.claude/skills/**` and `.opencode/skill/**`, `CLAUDE.md`, `AGENTS.md`, all of `governance/**`, all of `docs/**`, `apps/**/README.md`, `plans/in-progress/**`, `plans/backlog/**`, `plans/ideas.md` (exhaustive list in [tech-docs.md](./tech-docs.md))
- [ ] Replace `docs-link-general-checker` → `docs-link-checker` in each live hit
- [ ] `npm run sync:claude-to-opencode` — confirm no drift
- [ ] Verify zero live refs remain: `Grep "docs-link-general-checker"` excluding `plans/done`, `generated-reports`, `.git`, `node_modules`
- [ ] `npm run lint:md` passes
- [ ] Commit: `refactor(agents): rename docs-link-general-checker to docs-link-checker`

## Phase 2: Rename `swe-e2e-test-dev` → `swe-e2e-dev`

- [ ] `git mv .claude/agents/swe-e2e-test-dev.md .claude/agents/swe-e2e-dev.md`
- [ ] `git mv .opencode/agent/swe-e2e-test-dev.md .opencode/agent/swe-e2e-dev.md`
- [ ] Update `name:` frontmatter in `.claude/agents/swe-e2e-dev.md`
- [ ] Update `name:` frontmatter in `.opencode/agent/swe-e2e-dev.md`
- [ ] Grep sweep live refs (same path list as Phase 1)
- [ ] Replace `swe-e2e-test-dev` → `swe-e2e-dev` in each live hit
- [ ] `npm run sync:claude-to-opencode` — confirm no drift
- [ ] Verify zero live refs remain
- [ ] `npm run lint:md` passes
- [ ] Commit: `refactor(agents): rename swe-e2e-test-dev to swe-e2e-dev`

## Phase 3: Rename `web-researcher` → `web-research-maker`

- [ ] `git mv .claude/agents/web-researcher.md .claude/agents/web-research-maker.md`
- [ ] `git mv .opencode/agent/web-researcher.md .opencode/agent/web-research-maker.md`
- [ ] Update `name:` frontmatter in `.claude/agents/web-research-maker.md`
- [ ] Update `name:` frontmatter in `.opencode/agent/web-research-maker.md`
- [ ] Grep sweep live refs (same path list as Phase 1)
- [ ] Replace `web-researcher` → `web-research-maker` in each live hit
- [ ] `npm run sync:claude-to-opencode` — confirm no drift
- [ ] Verify zero live refs remain
- [ ] `npm run lint:md` passes
- [ ] Commit: `refactor(agents): rename web-researcher to web-research-maker`

## Phase 4: Rename `repo-governance-*` triad → `repo-rules-*` (atomic)

- [ ] `git mv .claude/agents/repo-governance-maker.md .claude/agents/repo-rules-maker.md`
- [ ] `git mv .claude/agents/repo-governance-checker.md .claude/agents/repo-rules-checker.md`
- [ ] `git mv .claude/agents/repo-governance-fixer.md .claude/agents/repo-rules-fixer.md`
- [ ] `git mv .opencode/agent/repo-governance-maker.md .opencode/agent/repo-rules-maker.md`
- [ ] `git mv .opencode/agent/repo-governance-checker.md .opencode/agent/repo-rules-checker.md`
- [ ] `git mv .opencode/agent/repo-governance-fixer.md .opencode/agent/repo-rules-fixer.md`
- [ ] Update `name:` frontmatter in each of the six renamed files
- [ ] Update cross-references **inside** the triad's own bodies (checker mentions fixer, fixer mentions checker, maker mentions both)
- [ ] Grep sweep live refs (same path list as Phase 1) for all of:
  - `repo-governance-maker`
  - `repo-governance-checker`
  - `repo-governance-fixer`
- [ ] Replace with `repo-rules-maker`, `repo-rules-checker`, `repo-rules-fixer` respectively
- [ ] **Special attention**: `governance/conventions/structure/agent-naming.md` (created earlier by the previous repo-governance-maker run) already mentions the old names; update those hits here, not later
- [ ] `npm run sync:claude-to-opencode` — confirm no drift
- [ ] Verify zero live refs remain: `Grep "repo-governance-(maker|checker|fixer)"` excluding `plans/done`, `generated-reports`, `.git`, `node_modules`
- [ ] `npm run lint:md` passes
- [ ] Commit: `refactor(agents): rename repo-governance triad to repo-rules`

## Phase 5: Publish Naming Rule + Role Vocabulary

- [ ] Add "Naming Rule" + "Role Vocabulary" sections to `.claude/agents/README.md` per [tech-docs.md](./tech-docs.md)
- [ ] `npm run sync:claude-to-opencode` — propagate to `.opencode/agent/README.md`
- [ ] Verify both READMEs contain the rule statement and all seven roles (maker, checker, fixer, dev, deployer, executor, manager) with semantics and examples
- [ ] Run rule compliance audit from [tech-docs.md](./tech-docs.md) — expect empty output
- [ ] `npm run lint:md` passes
- [ ] Commit: `docs(agents): publish naming rule and role vocabulary`

## Phase 6: Propagate to governance (via `repo-rules-maker`)

- [ ] Invoke `repo-rules-maker` (the renamed agent, post-Phase-4) with the spec in [tech-docs.md](./tech-docs.md) §"Governance propagation" — task: create `governance/conventions/structure/agent-naming.md` capturing the unified rule, scope vocabulary, role vocabulary, enforcement command, and examples
- [ ] Verify the file exists with required frontmatter (title, description, category, subcategory, tags, created, updated) and all required sections
- [ ] Confirm `repo-rules-maker` added the convention to `governance/conventions/structure/README.md` index
- [ ] Confirm `repo-rules-maker` added the convention to `governance/conventions/README.md` master index
- [ ] Confirm `CLAUDE.md` AI Agents section references the new convention
- [ ] Confirm `.claude/agents/README.md` and `.opencode/agent/README.md` Naming Rule sections link to the convention as normative source
- [ ] Run rule compliance audit from [tech-docs.md](./tech-docs.md) — still empty output
- [ ] `npm run lint:md` passes
- [ ] Run `repo-rules-checker` — no new violations raised by agent-naming rule
- [ ] Commit: `docs(governance): add agent-naming convention`

## Phase 7: Rename `docs/quality-gate.md` → `docs/docs-quality-gate.md`

- [ ] `git mv governance/workflows/docs/quality-gate.md governance/workflows/docs/docs-quality-gate.md`
- [ ] Confirm frontmatter `name:` is already `docs-quality-gate` (no change needed — filename was the outlier)
- [ ] Grep sweep live refs for the old path `governance/workflows/docs/quality-gate.md` across: `CLAUDE.md`, `AGENTS.md`, all of `governance/**`, all of `docs/**`, `.claude/agents/**`, `.opencode/agent/**`, `.claude/skills/**`, `.opencode/skill/**`, `plans/in-progress/**`, `plans/backlog/**`
- [ ] Replace old path → new path in each live hit
- [ ] Verify zero live refs remain (excluding `plans/done`, `generated-reports`, `.git`, `node_modules`)
- [ ] `npm run lint:md` passes
- [ ] Commit: `refactor(workflows): rename docs/quality-gate to docs/docs-quality-gate`

## Phase 8: Move `workflows/repository/` → `workflows/repo/` and rename to `repo-rules-quality-gate`

- [ ] `git mv governance/workflows/repository/repository-rules-validation.md governance/workflows/repo/repo-rules-quality-gate.md` (git will create the `repo/` directory as part of the move; verify with `ls governance/workflows/`)
- [ ] Confirm old `governance/workflows/repository/` directory no longer exists (git mv of the sole file removes the empty parent)
- [ ] Update `name:` frontmatter in the renamed file to `repo-rules-quality-gate`
- [ ] Grep sweep live refs (same path list as Phase 6) for all of:
  - string `repository-rules-validation`
  - path `governance/workflows/repository/`
  - string `repository-rules-quality-gate` (in case any earlier draft or cross-ref uses the interim name)
- [ ] Replace each with `repo-rules-quality-gate` / `governance/workflows/repo/` as appropriate in live hits
- [ ] Verify zero live refs to `repository-rules-*` or `workflows/repository/` remain
- [ ] `npm run lint:md` passes
- [ ] Commit: `refactor(workflows): move repository/ to repo/ and rename to repo-rules-quality-gate`

## Phase 9: Rename `specs-validation` → `specs-quality-gate`

- [ ] `git mv governance/workflows/specs/specs-validation.md governance/workflows/specs/specs-quality-gate.md`
- [ ] Update `name:` frontmatter in the renamed file to `specs-quality-gate`
- [ ] Grep sweep live refs (same path list as Phase 6)
- [ ] Replace `specs-validation` → `specs-quality-gate` in each live hit
- [ ] Verify zero live refs remain
- [ ] `npm run lint:md` passes
- [ ] Commit: `refactor(workflows): rename specs-validation to specs-quality-gate`

## Phase 10: Publish Workflow Naming Rule + Type Vocabulary

- [ ] Add "Naming Rule" + "Type Vocabulary" + "Meta reference exception" sections to `governance/workflows/README.md` per [tech-docs.md](./tech-docs.md)
- [ ] Verify README contains the rule statement and all three types (quality-gate, execution, setup) with semantics and examples
- [ ] Run workflow rule compliance audit from [tech-docs.md](./tech-docs.md) — expect empty output
- [ ] `npm run lint:md` passes
- [ ] Commit: `docs(workflows): publish naming rule and type vocabulary`

## Phase 11: Propagate workflow rule to governance (via `repo-rules-maker`)

- [ ] Invoke `repo-rules-maker` with the spec in [tech-docs.md](./tech-docs.md) §"Governance propagation — workflow-naming" — task: create `governance/conventions/structure/workflow-naming.md`
- [ ] Verify the file exists with required frontmatter and all required sections
- [ ] Confirm `repo-rules-maker` added the convention to `governance/conventions/structure/README.md` index
- [ ] Confirm `repo-rules-maker` added the convention to `governance/conventions/README.md` master index
- [ ] Confirm `CLAUDE.md` references the new convention
- [ ] Confirm `governance/workflows/README.md` Naming Rule section links to the convention as normative source
- [ ] Run workflow rule compliance audit — still empty output
- [ ] `npm run lint:md` passes
- [ ] Run `repo-rules-checker` — no new violations raised by workflow-naming rule
- [ ] Commit: `docs(governance): add workflow-naming convention`

## Phase 12: Implement rhino-cli naming validators

- [ ] Add Gherkin specs (mirrors AC13 scenarios):
  - [ ] Create `specs/apps/rhino/cli/gherkin/agents-validate-naming.feature`
  - [ ] Create `specs/apps/rhino/cli/gherkin/workflows-validate-naming.feature`
  - [ ] Update `specs/apps/rhino/cli/gherkin/README.md` to list both new features
  - [ ] Update `specs/apps/rhino/README.md` if it enumerates commands
- [ ] Implement shared validator core in `apps/rhino-cli/internal/naming/` (pure functions, ≥90% unit coverage)
- [ ] Implement `agents_validate_naming.go` Cobra subcommand under existing `agents.go` parent (mirrors `agents_validate_claude.go` pattern: handler file + test file + integration test file)
- [ ] Create `workflows.go` Cobra parent and `workflows_validate_naming.go` subcommand (same three-file pattern)
- [ ] Add godog unit tests (consume Gherkin specs; mocked filesystem via tmpdir fixtures)
- [ ] Add godog integration tests (`//go:build integration`; exercise real repo tree via `cmd.RunE()`)
- [ ] Add Nx targets to `apps/rhino-cli/project.json`:
  - [ ] `validate:naming:agents` with inputs covering `.claude/agents/**` and `.opencode/agent/**`
  - [ ] `validate:naming:workflows` with inputs covering `governance/workflows/**`
  - [ ] Both cacheable, `outputs: []`
- [ ] `nx run rhino-cli:test:quick` passes with coverage ≥ 90%
- [ ] `nx run rhino-cli:test:integration` passes
- [ ] `nx run rhino-cli:validate:naming:agents` passes on the current tree (expect zero violations after Phases 1-11)
- [ ] `nx run rhino-cli:validate:naming:workflows` passes on the current tree
- [ ] `npm run lint:md` passes (Gherkin specs are plain text, but README updates must lint)
- [ ] Commit: `feat(rhino-cli): add agents validate-naming and workflows validate-naming`

## Phase 13: Enforce validators in pre-push and CI

- [ ] Extend `.husky/pre-push` with a gated block:
  - [ ] If `git diff --cached` (or the push range) touches `.claude/agents/**` or `.opencode/agent/**`, run `nx run rhino-cli:validate:naming:agents`
  - [ ] If the push range touches `governance/workflows/**`, run `nx run rhino-cli:validate:naming:workflows`
  - [ ] Non-zero exit aborts the push with a readable error message
- [ ] Extend the ose-public CI quality-gate workflow (`.github/workflows/`) with two unconditional steps running both Nx validator targets
- [ ] Update [governance/development/quality/code.md](../../../governance/development/quality/code.md) to document the new pre-push step
- [ ] Dry-run: make a no-op branch touching an agent file, push, confirm the hook triggers the validator
- [ ] Dry-run: push a branch touching only `docs/` and confirm the validator does not run (scope gate)
- [ ] Dry-run: synthesise a naming violation locally, confirm pre-push blocks the push
- [ ] Open a dummy PR with the synthesised violation, confirm CI blocks the merge
- [ ] Revert the dry-run artifacts
- [ ] `npm run lint:md` passes
- [ ] Commit: `feat(ci): enforce naming validators in pre-push and PR quality gate`

## Phase 14: Final validation

- [ ] `nx affected -t lint` passes
- [ ] Pre-commit hooks pass for all staged changes (already gated above)
- [ ] Cross-check all 15 acceptance criteria in [requirements.md](./requirements.md) — each scenario satisfied
- [ ] `nx run rhino-cli:validate:naming:agents` returns zero violations
- [ ] `nx run rhino-cli:validate:naming:workflows` returns zero violations
- [ ] `repo-rules-checker` final pass clean
- [ ] Pre-push hook fires on a test touch of `.claude/agents/` and completes successfully
- [ ] CI quality gate passes on a clean PR
- [ ] Move plan to `plans/done/2026-04-17__agent-and-workflow-naming-consistency/` after merge
