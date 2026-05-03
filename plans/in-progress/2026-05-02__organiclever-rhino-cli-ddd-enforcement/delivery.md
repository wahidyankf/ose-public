# Delivery — OrganicLever rhino-cli DDD Enforcement + Skill Extension

7 phases (0–6). Each phase ends with all gates green and a single commit (or small commit cluster). Worktree branch fast-forward-merges into `main` once per phase or once at end-of-plan, per the parent repo's Subrepo Worktree Workflow Convention and [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md). TDD discipline is mandatory: never ship subcommand behaviour without a Godog scenario first.

> **Fix all failures rule**: At every quality gate in this plan, fix ALL failures found — including preexisting issues not caused by this plan's changes. Root-cause orientation, not bypass. Never use `--no-verify` or silence findings.

## Pre-flight

- [x] **Hard dependency check**: confirm `plans/in-progress/2026-05-02__organiclever-adopt-ddd/` no longer exists and `plans/done/2026-05-02__organiclever-adopt-ddd/` does exist. If still in `in-progress/`, **stop**: this plan cannot start until DDD adoption is fully complete and archived.
  - Date: 2026-05-03 | Status: PASS | plans/done/2026-05-02\_\_organiclever-adopt-ddd/ confirmed present
- [x] Confirm the DDD plan's final SHA is on `origin/main`: `git log --oneline plans/done/2026-05-02__organiclever-adopt-ddd/ | head -5` shows the archive commit. (Run from inside the worktree; the `-C ose-public` qualifier is not needed there.)
  - Date: 2026-05-03 | Status: PASS | SHA 3a69cd432 and e9cfc957e on origin/main
- [x] Confirm `apps/organiclever-web/src/contexts/<bc>/<layer>/` structure exists for all 9 contexts (smoke check: `ls apps/organiclever-web/src/contexts/`).
  - Date: 2026-05-03 | Status: PASS | All 9 contexts present with correct layer subdirs
- [x] Confirm `specs/apps/organiclever/ubiquitous-language/<bc>.md` exists for all 9 contexts.
  - Date: 2026-05-03 | Status: PASS | All 9 .md files confirmed
- [x] Confirm `specs/apps/organiclever/fe/gherkin/<bc>/` exists for all 9 contexts.
  - Date: 2026-05-03 | Status: PASS | All 9 gherkin folders with .feature files confirmed
- [x] Confirm clean tree on `ose-public` `main`: `git status` shows no uncommitted changes. (Run from inside the worktree; no `-C ose-public` qualifier needed.)
  - Date: 2026-05-03 | Status: PASS | Only delivery.md modified (in-progress plan ticking)
- [x] Provision worktree: `cd ose-public && claude --worktree organiclever-rhino-cli-ddd-enforcement`. Worktree path: `ose-public/.claude/worktrees/organiclever-rhino-cli-ddd-enforcement/` on branch `worktree-organiclever-rhino-cli-ddd-enforcement`.
  - Date: 2026-05-03 | Status: PASS | Worktree created via `git worktree add` at SHA 1e6497d3a
- [x] Inside the worktree, run `npm install && npm run doctor -- --fix`.
  - Date: 2026-05-03 | Status: PASS | npm install clean; doctor 19/19 tools OK
- [x] Confirm baseline gates green: `npx nx affected -t typecheck lint test:quick spec-coverage` and `nx run rhino-cli:test:quick`.
  - Date: 2026-05-03 | Status: PASS | rhino-cli 90.15% ≥ 90%; organiclever-web 78.26% ≥ 70%
- [x] Snapshot baseline metrics: rhino-cli line coverage, organiclever-web `test:quick` wall-clock time. Record below.
  - Date: 2026-05-03 | Status: DONE

### Baseline metrics

- [x] Baseline `rhino-cli` line coverage: 90.15% (filled in pre-flight, target ≥90%).
- [x] Baseline `organiclever-web:test:quick` wall-clock time: 26.4s (filled in pre-flight; max delta +5s → ≤31.4s).

---

## Phase 0 — Lock decisions

**Goal**: Resolve open questions in `tech-docs.md` before any code is written.

- [x] **Author**: For each open question Q1–Q3 in `tech-docs.md`, either accept the default or override with a
      written rationale. Append answers to `tech-docs.md` under "Open questions" with `RESOLVED:` prefix.
  - Date: 2026-05-03 | Status: DONE | Q1/Q2/Q3 all accepted defaults with rationale in tech-docs.md
- [x] Cross-check the registry YAML schema in `tech-docs.md` against the BC list in
      `plans/done/2026-05-02__organiclever-adopt-ddd/tech-docs.md`. Any context name mismatch is a blocker — resolve
      before Phase 1.
  - Date: 2026-05-03 | Status: PASS | 9/9 names match exactly
- [x] **Verify**: `npm run lint:md` passes; markdown clean.
  - Date: 2026-05-03 | Status: PASS | 0 errors
- [x] **Polish**: None.
- [x] Commit: `docs(plans): resolve Phase 0 open questions for rhino-cli DDD enforcement`.
  - Date: 2026-05-03 | Status: DONE | Committed in worktree

**Phase exit gates**:

- [x] All open questions Q1–Q3 marked RESOLVED in `tech-docs.md`.
- [x] `npm run lint:md` passes.

---

## Phase 1 — Bounded-context registry YAML

**Goal**: Land `specs/apps/organiclever/bounded-contexts.yaml` as the single source of truth for the BC map. Verify by hand that every entry resolves before any subcommand exists.

- [x] **Author**: Author `specs/apps/organiclever/bounded-contexts.yaml` per the schema in `tech-docs.md`. Populate all 9 contexts with `name`, `summary`, `layers`, `code`, `glossary`, `gherkin`, `relationships`.
  - Date: 2026-05-03 | Status: DONE | All 9 contexts authored with confirmed layer values
- [x] **Author**: Manual sanity check — `for ctx in <each>; do test -d <code> && test -f <glossary> && test -d <gherkin>; done`. Every check must pass.
  - Date: 2026-05-03 | Status: PASS | All 9 contexts: code dir + glossary .md + gherkin dir OK
- [x] **Author**: Cross-check that every name in the registry corresponds to a path that ESLint considers a `domain`/`application`/`infrastructure`/`presentation` element per the DDD plan's `eslint.config.mjs`.
  - Date: 2026-05-03 | Status: PASS | ESLint uses glob-capture `src/contexts/*/domain`; all 9 names auto-included
- [x] **Verify**: `npm run lint:md` passes (no markdown changed, sanity check). YAML syntactically valid: `yq eval '.' specs/apps/organiclever/bounded-contexts.yaml` exits zero (requires `mikefarah/yq` v4; if `yq` is unavailable, YAML parse errors will surface naturally when any subcommand loads the registry in Phase 2).
  - Date: 2026-05-03 | Status: PASS | lint:md 0 errors; Python YAML parse valid; 9 contexts loaded
- [x] **Polish**: Add cross-link from `plans/done/2026-05-02__organiclever-adopt-ddd/tech-docs.md` to the registry in a follow-up commit (or note as a deferred edit if archived plan is read-only by convention).
  - Date: 2026-05-03 | Note: archived plan treated as read-only per convention; cross-link deferred
- [x] Update `specs/apps/organiclever/README.md` "Structure" tree to include `bounded-contexts.yaml` at the top level.
  - Date: 2026-05-03 | Status: DONE | Tree and Spec Artifacts section updated
- [ ] Commit: `feat(specs/organiclever): add bounded-contexts.yaml registry`.

**Phase exit gates**:

- [x] `specs/apps/organiclever/bounded-contexts.yaml` exists and validates against the schema.
- [x] All 9 contexts' `code`, `glossary`, `gherkin` paths resolve to existing filesystem entries.
- [x] `specs/apps/organiclever/README.md` updated to mention the registry.

---

## Phase 2 — `rhino-cli bc validate` subcommand

**Goal**: Build the structural-parity subcommand. TDD with godog at unit level (mocked filesystem), then integration level (real `/tmp` fixtures).

- [x] **Red**: Author `specs/apps/rhino/cli/gherkin/bc-validate.feature` with Gherkin scenarios mirroring `prd.md` FR-2 acceptance criteria (clean state, orphan code folder, missing glossary, missing layer, asymmetric relationship).
  - Date: 2026-05-03 | Status: DONE | 11 scenarios tagged @bc-validate
- [x] **Red**: Add unit-level godog suite at `apps/rhino-cli/cmd/bc_validate_test.go` (package cmd, mocked filesystem via package-level function variables). Confirm the suite **fails** because the subcommand doesn't exist yet.
  - Date: 2026-05-03 | Status: DONE | Suite confirmed failing before implementation
- [x] **Green**: Implement `apps/rhino-cli/internal/bcregistry/` (YAML loader, schema struct, helpers). Implement `apps/rhino-cli/cmd/bc.go` (Cobra parent command `bcCmd`, package cmd) and `apps/rhino-cli/cmd/bc_validate.go` (the `validate` subcommand, package cmd). Run unit tests until green.
  - Date: 2026-05-03 | Status: DONE | 12 unit scenarios pass + 31 bcregistry unit tests
- [x] **Green**: Add integration-level godog suite at `apps/rhino-cli/cmd/bc_validate.integration_test.go` with `//go:build integration` tag (package cmd). Real `/tmp` fixtures. Drives `cmd.RunE()` in-process. Run until green.
  - Date: 2026-05-03 | Status: DONE | 12 integration scenarios pass
- [x] **Refactor**: Extract any shared finding-output helper into `golang-commons` if it doesn't already exist there. Verify ≥90% coverage maintained.
  - Date: 2026-05-03 | Status: DONE | No shared helper needed; bcregistry_test.go added; coverage 90.35%
- [x] Smoke-run: `rhino-cli bc validate organiclever` against the real working tree. Should exit zero.
  - Date: 2026-05-03 | Status: PASS | Fixed journal relationships in registry; exits zero
- [ ] Commit: `feat(rhino-cli): add bc validate subcommand for DDD structural parity`.

**Phase exit gates**:

- [x] `nx run rhino-cli:test:quick` passes; coverage ≥90%.
- [x] `nx run rhino-cli:test:integration` passes.
- [x] `nx run rhino-cli:spec-coverage` passes (Gherkin↔step parity).
- [x] `rhino-cli bc validate organiclever` exits zero against the current registry.

---

## Phase 3 — `rhino-cli ul validate` subcommand

**Goal**: Build the glossary-parity subcommand. Same TDD pattern as Phase 2.

- [ ] **Red**: Author `specs/apps/rhino/cli/gherkin/ul-validate.feature` with Gherkin scenarios mirroring `prd.md` FR-3 acceptance criteria (clean state, missing frontmatter, malformed table header, stale code identifier, missing feature reference, cross-context term collision, forbidden-synonym misuse).
- [ ] **Red**: Add unit-level godog suite at `apps/rhino-cli/cmd/ul_validate_test.go` (package cmd, mocked filesystem and mocked ripgrep). Confirm the suite **fails**.
- [ ] **Green**: Implement `apps/rhino-cli/internal/glossary/` (frontmatter parser, terms-table parser, forbidden-synonyms parser per the parser-shape in `tech-docs.md`). Implement `apps/rhino-cli/cmd/ul.go` (Cobra parent command `ulCmd`, package cmd) and `apps/rhino-cli/cmd/ul_validate.go` (the `validate` subcommand, package cmd). Run unit tests until green.
- [ ] **Green**: Add integration-level godog suite at `apps/rhino-cli/cmd/ul_validate.integration_test.go` with `//go:build integration` (package cmd). Real `/tmp` fixtures including a "table reformatted by Prettier" case. Run until green.
- [ ] **Refactor**: Verify ≥90% coverage maintained. Move any cross-cutting parser helper into `golang-commons` if reused.
- [ ] Smoke-run: `rhino-cli ul validate organiclever` against the real working tree. Should exit zero.
- [ ] Commit: `feat(rhino-cli): add ul validate subcommand for DDD glossary parity`.

**Phase exit gates**:

- [ ] `nx run rhino-cli:test:quick` passes; coverage ≥90%.
- [ ] `nx run rhino-cli:test:integration` passes.
- [ ] `nx run rhino-cli:spec-coverage` passes.
- [ ] `rhino-cli ul validate organiclever` exits zero against the current registry and glossaries.

---

## Phase 4 — Wire into `test:quick`

**Goal**: Both subcommands run as part of `nx run organiclever-web:test:quick` at error severity. Profile wall-clock impact.

- [ ] **Red**: Edit `apps/organiclever-web/project.json` to extend the `test:quick` target with two new commands (`rhino-cli bc validate organiclever` and `rhino-cli ul validate organiclever`) per the project.json wiring sketch in `tech-docs.md`. Confirm a deliberate orphan triggers a non-zero exit.
- [ ] **Green**: Run `nx run organiclever-web:test:quick`. Should exit zero with both subcommands invoked. Wall-clock delta vs baseline ≤5s (NFR-4).
- [ ] **Green**: Set `ORGANICLEVER_RHINO_DDD_SEVERITY=warn` and re-run; confirm a deliberate orphan does **not** fail the target. Reset env var.
- [ ] **Refactor**: Document the env var in `apps/organiclever-web/README.md` "Development" section as the local escape hatch.
- [ ] Smoke-test pre-push: inside the worktree, run `git push origin worktree-organiclever-rhino-cli-ddd-enforcement` — Husky pre-push hook must trigger both subcommands and pass.
- [ ] Commit: `feat(organiclever-web): wire rhino-cli bc/ul validate into test:quick`.

**Phase exit gates**:

- [ ] `nx run organiclever-web:test:quick` exits zero and invokes both subcommands.
- [ ] Wall-clock delta vs baseline ≤5s (NFR-4 budget).
- [ ] Env-var override works (warn downgrade verified).
- [ ] Pre-push hook triggers both subcommands.

---

## Phase 5 — Skill DDD section

**Goal**: Extend the existing `apps-organiclever-web-developing-content` skill with the Domain-Driven Design section. Concise — points to canonical sources, no duplication.

- [ ] **Red**: Author the new "Domain-Driven Design" section in `.claude/skills/apps-organiclever-web-developing-content/SKILL.md` per the design sketch in `tech-docs.md` § "Skill DDD section design". Keep all existing sections intact.
- [ ] **Red**: Confirm the skill description (frontmatter `description` field) reflects the broader scope without changing the skill name.
- [ ] **Green**: Run `npm run lint:md` — passes.
- [ ] **Green**: Run `npm run sync:claude-to-opencode` — both `.claude/skills/` source and any `.opencode/` mirrors stay synced (or the no-mirror invariant is preserved per CLAUDE.md skill policy).
- [ ] **Refactor**: Add cross-links — `apps/rhino-cli/README.md` "DDD enforcement" subsection (FR-6) links the skill; the skill DDD section links the rhino-cli README and the BC registry.
- [ ] Commit: `docs(skills,rhino-cli): add DDD section to organiclever skill and document subcommands in rhino-cli README`.

**Phase exit gates**:

- [ ] Skill DDD section present and includes all FR-5 components (BC list pointer, layer rules, xstate placement, cross-context calls, glossary authoring, pre-commit checklist).
- [ ] `apps/rhino-cli/README.md` has a "DDD enforcement" subsection per FR-6.
- [ ] Existing "developing content" sections in the skill remain present.
- [ ] `npm run lint:md` passes.

---

## Phase 6 — Quality gate + archival

**Goal**: Final verification, full quality bar, archive plan.

- [ ] Run full quality bar:
  - [ ] `npx nx affected -t typecheck lint test:quick spec-coverage`
  - [ ] `nx run rhino-cli:test:quick` (≥90% coverage)
  - [ ] `nx run rhino-cli:test:integration`
  - [ ] `nx run organiclever-web:test:quick` (with both subcommands at error severity)
  - [ ] `nx run organiclever-web-e2e:test:e2e`
  - [ ] `npm run lint:md`
- [ ] Manual UI verification (Playwright MCP smoke check): `browser_navigate` to `http://localhost:3200/app/home` (organiclever-web dev server), `browser_snapshot`, `browser_console_messages`. Confirm no regressions from `test:quick` changes.
- [ ] Manual subcommand verification: introduce one synthetic finding per subcommand (orphan glossary, stale code identifier), confirm `test:quick` exits non-zero, revert the synthetic change.
- [ ] Invoke `plan-execution-checker` against this plan and address every finding.
- [ ] Fast-forward merge worktree branch `worktree-organiclever-rhino-cli-ddd-enforcement` into local `main`. Push `origin main`.
- [ ] Wait for `origin/main` to reflect the SHA. Monitor the following GitHub Actions workflows on `wahidyankf/ose-public`: `test-and-deploy-organiclever-web-development.yml` (triggers on push to `main` for `organiclever-web` changes) and `pr-quality-gate.yml` (for any open PRs if applicable). Verify all checks pass: `gh run list --repo wahidyankf/ose-public --limit 5` to identify the run, then `gh run view <run-id>` every 3–5 min until green.
- [ ] If any parent-side gitlink bump is needed, perform it from the parent repo.
- [ ] Move `plans/in-progress/2026-05-02__organiclever-rhino-cli-ddd-enforcement/` → `plans/done/2026-05-02__organiclever-rhino-cli-ddd-enforcement/`.
- [ ] Update `plans/in-progress/README.md` and `plans/done/README.md` (if any index) to reflect the move.
- [ ] Final commit: `chore(plans): archive 2026-05-02__organiclever-rhino-cli-ddd-enforcement to done/`.

**Plan exit gates**:

- [ ] All `prd.md` Gherkin acceptance scenarios pass.
- [ ] `plan-execution-checker` reports zero open findings.
- [ ] Both subcommands at error severity in `test:quick` and pre-push.
- [ ] Worktree removed (`git worktree remove ose-public/.claude/worktrees/organiclever-rhino-cli-ddd-enforcement`).

---

## Iron rules

1. **TDD always**. Never ship subcommand behaviour without a Godog scenario first.
2. **DDD plan completion is a hard precondition**. Pre-flight verifies it; do not start any phase if DDD plan is still in `in-progress/`.
3. **One concern per commit** during Phases 1–5. No mixed feature deliveries.
4. **No behavior change to `organiclever-web`** allowed in any phase. Only adding subcommand calls and skill content.
5. **Never bypass pre-push** (`--no-verify`). If the hook fails, fix the cause.
6. **Worktree discipline**. All edits inside the subrepo worktree.
7. **Direct-to-main publish path** per [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md). Draft PR is optional; not required for this plan.
8. **Default severity is `error`**. Warning severity is a local escape hatch only — never the production setting.
9. **Roll back the phase, not the file**, if anything leaves the gates red and is not fixable in one pass.
10. **Fix all failures rule** at every quality gate — including preexisting issues — per the root-cause-orientation principle.
11. **Thematic Conventional Commits**. Split commits by domain (registry, subcommand, skill, wiring); never bundle unrelated changes.
