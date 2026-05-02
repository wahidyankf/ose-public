# Delivery — OrganicLever DDD Adoption

11 phases. Each phase ends with all gates green and a single commit (or small commit cluster) on the worktree branch. Worktree branch fast-forward-merges into `main` once per phase or once at end-of-plan, per the parent repo's Subrepo Worktree Workflow Convention and [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md). TDD discipline is mandatory: never move code without tests passing before AND after.

## Pre-flight

- [ ] Confirm clean tree on `ose-public` `main`. `git -C ose-public status` shows no uncommitted changes.
- [ ] Provision worktree: `cd ose-public && claude --worktree organiclever-adopt-ddd`. Worktree path: `ose-public/.claude/worktrees/organiclever-adopt-ddd/` on branch `worktree-organiclever-adopt-ddd`.
- [ ] Inside the worktree, run `npm install && npm run doctor -- --fix`.
- [ ] Confirm baseline gates green: `npx nx affected -t typecheck lint test:quick spec-coverage` and `nx run organiclever-web-e2e:test:e2e`.
- [ ] Snapshot baseline coverage number for `organiclever-web` and record in this file under "Baseline metrics" below.

### Baseline metrics

- [ ] Baseline `organiclever-web` line coverage: \_\_% (filled in pre-flight).
- [ ] Baseline `organiclever-web` test count: **unit,** integration, \_\_ E2E (filled in pre-flight).

---

## Phase 0 — Lock the bounded-context map

**Goal**: Decisions before code moves. No source-code edits in this phase.

- [ ] **Red**: Draft `apps/organiclever-web/docs/explanation/bounded-context-map.md` listing every context, its responsibility, persistence model, and relationships. Include accessible Mermaid diagram.
- [ ] Cross-check the map against `src/lib/*` clusters (`journal-*`, `routine-*`, `workout-*`, `settings-*`, `stats.ts`, `app-machine.ts`, etc.) to confirm every existing module lands in exactly one context.
- [ ] Resolve open questions Q1–Q3 from `tech-docs.md`. Record answers in the ADR.
- [ ] Decide final mapping for spec reorganization (`home/`, `history/`, `progress/`, `system/`, `loggers/` redirections). Append to ADR.
- [ ] **Green**: Mermaid passes `rhino-cli mermaid validate` if applicable; markdown lint passes; no broken links.
- [ ] **Refactor**: Add the ADR link to `apps/organiclever-web/README.md` "Architecture" section.
- [ ] Commit: `docs(organiclever-web): add bounded-context map ADR`.

**Phase exit gates**:

- [ ] `npm run lint:md` passes.
- [ ] `nx run organiclever-web:typecheck` passes (no source change yet, sanity check).

---

## Phase 1 — ESLint boundaries dry-run

**Goal**: Prove the ESLint boundary tooling works against this codebase before moving any code. Tooling lands as warnings, not errors.

- [ ] Audit `eslint.config.mjs` (or equivalent) at workspace and app level. Identify whether `eslint-plugin-boundaries` is already installed; if not, add it as a dev dependency.
- [ ] **Red**: Add a smoke test config — declare a single dummy element type and a deliberately-failing import to confirm the plugin engages. Verify `nx run organiclever-web:lint` reports the violation as a **warning** (not error).
- [ ] **Green**: Replace the smoke test with the real config from `tech-docs.md` "ESLint boundaries", set severity to `warn` (not `error`).
- [ ] Run `nx run organiclever-web:lint` and capture the current violation count. Record it as the baseline below.
- [ ] **Refactor**: Document the dry-run config in `apps/organiclever-web/docs/explanation/bounded-context-map.md` under "Enforcement".
- [ ] Commit: `chore(organiclever-web): add ESLint boundaries dry-run config`.

**Phase 1 baseline**:

- [ ] Boundary warnings count at end of Phase 1: \_\_

**Phase exit gates**:

- [ ] `nx run organiclever-web:typecheck` passes.
- [ ] `nx run organiclever-web:lint` passes (warnings allowed, no errors).
- [ ] `nx run organiclever-web:test:quick` passes; coverage ≥ baseline.

---

## Phase 2 — Ubiquitous-language scaffolding in specs

**Goal**: Land the top-level glossary folder under `specs/apps/organiclever/` and wire it into the surrounding spec READMEs. No code reorg yet.

- [ ] Create `specs/apps/organiclever/ubiquitous-language/` as a sibling of `be/`, `fe/`, `c4/`, `contracts/`.
- [ ] **Red**: Author `specs/apps/organiclever/ubiquitous-language/README.md` index with:
  - [ ] Statement that the folder is the platform-agnostic glossary shared by FE today and BE in a future plan.
  - [ ] Authoring rules: one file per bounded context; glossary updates ride with code/feature changes in the same commit; Gherkin steps use only glossary terms; code identifiers match the `Code identifier(s)` column verbatim.
  - [ ] Index list linking every per-context glossary file.
  - [ ] Cross-links to `c4/`, `fe/gherkin/`, and the bounded-context-map ADR.
- [ ] **Red**: Create one glossary file per bounded context using the template from `tech-docs.md` § "Ubiquitous-language file shape". Populate term tables by scanning current Gherkin features and `src/lib/*` identifiers; populate "Forbidden synonyms" by scanning for the same word used differently in another context.
- [ ] Update `specs/apps/organiclever/README.md`:
  - [ ] Add `ubiquitous-language/` to the "Structure" tree at the top level.
  - [ ] Add a "Ubiquitous Language" entry to the "Spec Artifacts" list linking the folder.
- [ ] Update `specs/apps/organiclever/fe/README.md` to link the glossary folder under "Domains" or a new "Ubiquitous Language" section.
- [ ] **Green**: `npm run lint:md` passes; `apps/rhino-cli/dist/rhino-cli docs validate-links --staged-only` passes; every bounded context from the Phase 0 ADR has a glossary file.
- [ ] **Refactor**: Add glossary parity check stub — a small test (or `rhino-cli` invocation) that scans Gherkin features for terms not present in any glossary file, output as warning. Wire into `nx run organiclever-web:spec-coverage` only if non-disruptive; otherwise defer wiring to Phase 9.
- [ ] Commit: `docs(specs/organiclever): add ubiquitous-language glossary`.

**Phase exit gates**:

- [ ] `npm run lint:md` passes.
- [ ] All file names follow [File Naming Convention](../../../governance/conventions/structure/file-naming.md) (lowercase kebab-case).
- [ ] Every bounded context in the Phase 0 ADR has a glossary file.
- [ ] `specs/apps/organiclever/README.md` Structure tree and Spec Artifacts list mention `ubiquitous-language/`.
- [ ] `specs/apps/organiclever/fe/README.md` links the glossary folder.

---

## Phase 3 — Skeleton `src/contexts/` + `src/shared/`

**Goal**: Create empty folder skeleton + path aliases. No source migration yet.

- [ ] **Red**: Add `src/shared/utils/` and `src/contexts/<bc>/` folders for every bounded context (one `.gitkeep` placeholder; layer subfolders created lazily as files arrive).
- [ ] Update `tsconfig.json` paths if cross-context imports will use `@oc/<bc>` aliases — decide at this phase, lock it in. Default: relative paths, no new aliases (simpler for ESLint boundaries).
- [ ] **Green**: `nx run organiclever-web:typecheck` passes.
- [ ] **Refactor**: None.
- [ ] Commit: `chore(organiclever-web): scaffold contexts and shared folders`.

**Phase exit gates**:

- [ ] `nx run organiclever-web:typecheck` passes.
- [ ] `nx run organiclever-web:lint` passes (warnings only).

---

## Phase 4 — Migrate `health` + `landing` + `routing`

**Goal**: Easiest contexts first. They have minimal cross-context coupling. Build muscle memory and validate the pattern.

For each of `health`, `landing`, `routing`:

- [ ] Identify all current source files that belong to this context (e.g. `src/services/backend-client*.ts` + `src/app/system/**` for `health`).
- [ ] **Red**: Confirm relevant unit tests pass at current location.
- [ ] **Green**: `git mv` source + test files into `src/contexts/<bc>/{layer}/`. Update imports. Re-run unit tests until green.
- [ ] **Refactor**: Add `src/contexts/<bc>/<layer>/index.ts` published API. Update `src/app/**` imports to go through the published API.
- [ ] **Red→Green→Refactor** for any test that should additionally exist (e.g. test that `health/application/index.ts` re-exports the consumer-facing API).
- [ ] Commit per context: `refactor(organiclever-web): migrate <bc> context`.

**Phase exit gates**:

- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes.
- [ ] `nx run organiclever-web-e2e:test:e2e` passes (smoke level acceptable; full at Phase 10).
- [ ] Coverage ≥ baseline.

---

## Phase 5 — Migrate `settings`

**Goal**: Self-contained PGlite-backed context with one aggregate. Moderate complexity.

- [ ] Inventory: `src/lib/settings-store.ts`, `src/lib/use-settings.ts`, `src/app/app/settings/**`, settings-related schemas in `src/lib/schema.ts`.
- [ ] **Red**: Pre-move tests green at current location.
- [ ] **Green**:
  - [ ] Move pure types and invariants → `src/contexts/settings/domain/`.
  - [ ] Move use-cases (read/write preferences) → `src/contexts/settings/application/`. Define ports for storage.
  - [ ] Move PGlite store + Effect Layer → `src/contexts/settings/infrastructure/`.
  - [ ] Move React hooks + components → `src/contexts/settings/presentation/`.
  - [ ] Update `src/app/app/settings/**` to consume `src/contexts/settings/presentation/index.ts`.
- [ ] **Refactor**: Publish `application/index.ts` and `presentation/index.ts`. Hide private files behind `eslint-plugin-boundaries` no-private rule (still warning level).
- [ ] Commit: `refactor(organiclever-web): migrate settings context`.

**Phase exit gates**: same as Phase 4.

---

## Phase 6 — Migrate `journal`

**Goal**: Largest context; system-of-record for events. Migrate in sub-steps to keep each commit small.

- [ ] Inventory: `src/lib/journal-store.ts`, `src/lib/journal-machine.ts`, `src/lib/typed-payloads.ts`, `src/lib/use-journal.ts`, `src/lib/run-migrations.ts`, `src/lib/runtime.ts`, `src/lib/seed.ts`, migrations under `src/layers/migrations/`, `src/lib/schema.ts` journal portions, `src/app/app/home/**` journal-touching parts.
- [ ] Sub-step 6a — domain: move `JournalEvent` types, `typed-payloads`, invariants → `src/contexts/journal/domain/`. **Red**: tests pre-move green. **Green**: tests post-move green.
- [ ] Sub-step 6b — application: extract use-cases (`appendEvent`, `bumpEvent`, `listEvents`) into `src/contexts/journal/application/`. Define ports.
- [ ] Sub-step 6c — infrastructure: move PGlite store, runtime, migrations into `src/contexts/journal/infrastructure/`. Update Effect `Layer` composition.
- [ ] Sub-step 6d — presentation: move `use-journal.ts` and journal-specific React components into `src/contexts/journal/presentation/`.
- [ ] Sub-step 6e — wire-up: update `src/app/app/home/**`, `src/app/app/history/**`, and any other consumer to import only from `journal/presentation/index.ts` and `journal/application/index.ts`.
- [ ] Commit each sub-step independently: `refactor(organiclever-web): migrate journal <layer>`.

**Phase exit gates**: same as Phase 4.

---

## Phase 7 — Migrate `routine` + `workout-session` + `stats`

**Goal**: Three closely related contexts. Migrate in this order: `routine` → `workout-session` → `stats` (so each downstream context's dependency is already in place).

- [ ] Routine: move `routine-store.ts`, `use-routines.ts`, `src/app/app/routines/**` and `src/app/app/workout/**` routine-template-reading parts.
- [ ] Workout-session: move `workout-machine.ts` and tests → `src/contexts/workout-session/{domain,application}/`. Update so workout-session **only** writes to journal via `journal/application/index.ts`. Move workout pages to `src/app/app/workout/**` consuming `workout-session/presentation/index.ts`.
- [ ] Stats: move `stats.ts`, history-page projections, progress-page projections → `src/contexts/stats/{domain,application,presentation}/`. Stats reads only from `journal/application/index.ts`.
- [ ] Commit per context: `refactor(organiclever-web): migrate <bc> context`.

**Phase exit gates**: same as Phase 4.

---

## Phase 8 — Migrate `app-shell` + flip ESLint to error

**Goal**: Last context migration + boundary enforcement turned on.

- [ ] Move `src/lib/translations.ts`, `use-t.ts`, `app-machine.ts`, layout chrome, error boundary, loggers, theme primitives into `src/contexts/app-shell/presentation/` (and `domain/` if any pure types remain).
- [ ] Decide fate of `src/components/` per Phase 0 Q3. Default: move purely-presentational primitives into `src/contexts/app-shell/presentation/components/`.
- [ ] Confirm there are no remaining files outside `src/contexts/`, `src/app/`, `src/shared/`, `src/test/`. Any remainder is a finding — either retag context or move to `src/shared/`.
- [ ] **Red**: With ESLint severity still `warn`, run `nx run organiclever-web:lint` and confirm zero warnings.
- [ ] **Green**: Flip ESLint boundaries to `error`. Run `nx run organiclever-web:lint`; expect exit zero.
- [ ] **Refactor**: Remove the dry-run note from `bounded-context-map.md`; replace with "Enforcement: ESLint boundaries (error severity)".
- [ ] Commit: `refactor(organiclever-web): migrate app-shell context and enforce ESLint boundaries`.

**Phase exit gates**:

- [ ] `nx run organiclever-web:lint` exits zero with severity `error`.
- [ ] All Phase 4 gates plus full FE E2E suite.
- [ ] Coverage ≥ baseline.

---

## Phase 9 — Spec reorganization

**Goal**: Align Gherkin folders with bounded contexts.

- [ ] For every Gherkin folder in `specs/apps/organiclever/fe/gherkin/` not matching a bounded context, `git mv` files into the correct context folder per Phase 0 ADR.
- [ ] Update `specs/apps/organiclever/fe/gherkin/README.md` to describe the new layout and link the glossary.
- [ ] Run `nx run organiclever-web:spec-coverage`; fix any newly-uncovered scenarios (typically import-path updates in step files).
- [ ] Run glossary parity check (the stub from Phase 2). Fix any Gherkin term missing from a glossary by adding it to the right context's glossary; if a term is missing because it's stale, update the Gherkin too. Both directions allowed; never silence the warning.
- [ ] Commit: `refactor(specs/organiclever): reorganize fe/gherkin by bounded context`.

**Phase exit gates**:

- [ ] `nx run organiclever-web:spec-coverage` passes.
- [ ] Glossary parity check returns zero warnings.
- [ ] `nx run organiclever-web-e2e:test:e2e` passes.
- [ ] `npm run lint:md` passes.

---

## Phase 10 — Documentation + README updates

**Goal**: Make the new shape discoverable.

- [ ] Update `apps/organiclever-web/README.md`:
  - [ ] "Architecture" section pointing to `docs/explanation/bounded-context-map.md`.
  - [ ] "Project layout" section showing `src/contexts/<bc>/{domain,application,infrastructure,presentation}/`.
  - [ ] Link to `specs/apps/organiclever/ubiquitous-language/`.
- [ ] Update `apps/organiclever-web/CLAUDE.md` (if it exists) with the same layout note.
- [ ] Update `.claude/skills/apps-organiclever-web-developing-content/SKILL.md` to mention bounded-context-aware development workflow.
- [ ] Update `specs/apps/organiclever/README.md` with the new ubiquitous-language folder under "Spec Artifacts".
- [ ] **Green**: `npm run lint:md` passes; all internal links resolve (`docs-link-checker` if invoked).
- [ ] Commit: `docs(organiclever-web): document DDD layout and ubiquitous-language folder`.

**Phase exit gates**:

- [ ] `npm run lint:md` passes.
- [ ] No broken internal links.

---

## Phase 11 — Quality gate + archival

**Goal**: Final verification and archive.

- [ ] Run full quality bar:
  - [ ] `npx nx affected -t typecheck lint test:quick spec-coverage`
  - [ ] `nx run organiclever-web-e2e:test:e2e`
  - [ ] `npm run lint:md`
  - [ ] Coverage check: `organiclever-web` ≥ 70% line coverage and ≥ baseline.
- [ ] Invoke `plan-execution-checker` against this plan and address every finding.
- [ ] Fast-forward merge worktree branch `worktree-organiclever-adopt-ddd` into local `main`. Push `origin main`.
- [ ] Wait for `origin/main` to reflect the SHA (CI green).
- [ ] If any parent-side gitlink bump is needed, perform it from the parent repo.
- [ ] Move `plans/in-progress/2026-05-02__organiclever-adopt-ddd/` → `plans/done/2026-05-02__organiclever-adopt-ddd/`.
- [ ] Update `plans/in-progress/README.md` and `plans/done/README.md` (if any index) to reflect the move.
- [ ] Final commit: `chore(plans): archive 2026-05-02__organiclever-adopt-ddd to done/`.

**Plan exit gates**:

- [ ] All `prd.md` Gherkin acceptance scenarios pass.
- [ ] `plan-execution-checker` reports zero open findings.
- [ ] Worktree removed (`git worktree remove ose-public/.claude/worktrees/organiclever-adopt-ddd`).

---

## Iron rules

1. **TDD always**. Never move code without a green test before AND after.
2. **One context per commit (or one sub-step per commit)** during Phases 4–8. No mixed migrations.
3. **No behavior change** allowed in any phase. Refactors only.
4. **Never bypass pre-push** (`--no-verify`). If the hook fails, fix the cause.
5. **Worktree discipline**. All edits inside the subrepo worktree.
6. **Direct-to-main publish path** per [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md). Draft PR is optional; not required for this plan.
7. **Glossary updates ride with code/feature changes** in the same commit, not a separate one.
8. **Roll back the phase, not the file**, if anything leaves the gates red and is not fixable in one pass.
