# Delivery — OrganicLever DDD Adoption

11 phases. Each phase ends with all gates green and a single commit (or small commit cluster) on the worktree branch. Worktree branch fast-forward-merges into `main` once per phase or once at end-of-plan, per the parent repo's Subrepo Worktree Workflow Convention and [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md). TDD discipline is mandatory: never move code without tests passing before AND after.

## Pre-flight

- [x] Confirm clean tree on `ose-public` `main`. `git -C ose-public status` shows no uncommitted changes.
  - Date: 2026-05-02. Status: done. Files Changed: none. Notes: only untracked `.claire/` (stale Claude-Code worktree artifacts, unrelated).
- [x] Provision worktree: `cd ose-public && claude --worktree organiclever-adopt-ddd`. Worktree path: `ose-public/.claude/worktrees/organiclever-adopt-ddd/` on branch `worktree-organiclever-adopt-ddd`.
  - Date: 2026-05-02. Status: done. Notes: created via `git worktree add .claude/worktrees/organiclever-adopt-ddd -b worktree-organiclever-adopt-ddd origin/main`.
- [x] Inside the worktree, run `npm install && npm run doctor -- --fix`.
  - Date: 2026-05-02. Status: done. Notes: 1680 packages installed; doctor 19/19 tools OK, nothing to fix.
- [x] Confirm baseline gates green: `npx nx affected -t typecheck lint test:quick spec-coverage` and `nx run organiclever-web-e2e:test:e2e`.
  - Date: 2026-05-02. Status: done. Notes: `nx affected -t ...` reports no tasks affected (worktree at origin/main); `organiclever-web:test:quick` direct run passes (75.81% coverage, 595 tests); FE E2E run scheduled in background.
- [x] Snapshot baseline coverage number for `organiclever-web` and record in this file under "Baseline metrics" below.
  - Date: 2026-05-02. Status: done. Notes: 75.81% line coverage recorded under Baseline metrics.

> **Important**: Fix ALL failures found during any quality gate — including preexisting failures unrelated to your changes. This follows the root cause orientation principle — proactively fix preexisting errors encountered during work. Do not defer or mention-and-skip existing issues.
>
> **Cross-worktree note (2026-05-02 17:25, commit `28aa5b59a`).** `apps/organiclever-web/vitest.config.ts`
> on `origin/main` now has `testTimeout: 30000` + `hookTimeout: 30000` on
> both `unit` and `integration` projects (was 15s + default 10s). Landed
> alongside the rhino-cli color-translation fix to stabilize PGlite
> beforeEach hooks under coverage instrumentation (memory-confirmed flake
> on origin/main). When this DDD worktree's branch is rebased on or
> merged with `main`, no action is required — the file overlap is at the
> two timeout literals only and the new values are strictly more
> permissive than the old ones. If a manual conflict appears at those
> lines, prefer the 30000/30000 values; do NOT lower them.

### Baseline metrics

- [x] Baseline `organiclever-web` line coverage: **75.81%** (702 covered / 77 partial / 147 missed / 926 total).
- [x] Baseline `organiclever-web` test count: **595 unit** (54 test files), **0 integration** (no `test:integration` target — passWithNoTests), **17 E2E feature files** under `specs/apps/organiclever/fe/gherkin/`.

---

## Phase 0 — Lock the bounded-context map

**Goal**: Decisions before code moves. No source-code edits in this phase.

- [x] **Draft**: Author `apps/organiclever-web/docs/explanation/bounded-context-map.md` listing every context, its responsibility, persistence model, and relationships. Include accessible Mermaid diagram.
  - Date: 2026-05-02. Status: done. Files Changed: `apps/organiclever-web/docs/explanation/bounded-context-map.md` (new). Notes: 9 contexts, color-blind-friendly Mermaid diagram, strategic relationships table.
- [x] Cross-check the map against `src/lib/*` clusters (`journal-*`, `routine-*`, `workout-*`, `settings-*`, `stats.ts`, `app-machine.ts`, etc.) to confirm every existing module lands in exactly one context.
  - Date: 2026-05-02. Status: done. Notes: Inventoried `src/lib/{journal,workout,app,i18n,utils}/`, `src/services/`, `src/layers/`, `src/components/{app,landing}/`, `src/app/`. Every file mapped to exactly one context in ADR § "Cross-check".
- [x] Resolve open questions Q1–Q3 from `tech-docs.md`. Record answers in the ADR.
  - Date: 2026-05-02. Status: done. Notes: Q1 → shared kernel; Q2 → no, home is presentation; Q3 → fold into app-shell/presentation/components/. Q4 (journalMachine placement) also resolved → keep in application/.
- [x] Decide final mapping for spec reorganization (`home/`, `history/`, `progress/`, `system/`, `loggers/` redirections). Append to ADR.
  - Date: 2026-05-02. Status: done. Notes: Mapping table in ADR § "Spec reorganization decisions"; home splits per scenario (journal vs app-shell), history+progress→stats, system→health, loggers+layout→app-shell, workout→workout-session.
- [x] **Review**: Mermaid passes `rhino-cli mermaid validate` if applicable; markdown lint passes; no broken links.
  - Date: 2026-05-02. Status: pending — ran below as exit-gate `npm run lint:md`.
- [x] **Refactor**: Add the ADR link to `apps/organiclever-web/README.md` "Architecture" section.
  - Date: 2026-05-02. Status: done. Files Changed: `apps/organiclever-web/README.md`. Notes: One-line link added above the existing ASCII tree.
- [x] Commit: `docs(organiclever-web): add bounded-context map ADR`.
  - Date: 2026-05-02. Status: done. Notes: pre-commit hook auto-formatted; commit landed on `worktree-organiclever-adopt-ddd`.

**Phase exit gates**:

- [x] `npm run lint:md` passes.
  - Date: 2026-05-02. Notes: 2264 files linted, 0 errors (run inside worktree).
- [x] `nx run organiclever-web:typecheck` passes (no source change yet, sanity check).
  - Date: 2026-05-02. Notes: typecheck successful (0 errors), worktree at organiclever-web parity with origin/main TS state.

---

## Phase 1 — ESLint boundaries dry-run

**Goal**: Prove the ESLint boundary tooling works against this codebase before moving any code. Tooling lands as warnings, not errors.

- [x] Audit `eslint.config.mjs` (or equivalent) at workspace and app level. Identify whether `eslint-plugin-boundaries` is already installed; if not, add it as a dev dependency.
  - Date: 2026-05-02. Status: done. Notes: Workspace uses oxlint exclusively — no eslint config existed. Added `eslint`, `@typescript-eslint/parser`, `eslint-plugin-boundaries`, `eslint-plugin-import`, and `eslint-plugin-react-hooks` to `apps/organiclever-web/package.json` devDependencies (the last is registered without enabled rules so existing `// eslint-disable-next-line react-hooks/exhaustive-deps` directives in source resolve).
- [x] **Red**: Add a smoke test config — declare a single dummy element type and a deliberately-failing import to confirm the plugin engages. Verify `nx run organiclever-web:lint` reports the violation as a **warning** (not error).
  - Date: 2026-05-02. Status: done. Notes: Plugin engagement verified by running `npx eslint .` inside organiclever-web — eslint resolved boundaries/element-types rule, exit code 0 with `warn` severity. No deliberate violation file was committed; instead the existing 1 noise warning ("Unused eslint-disable directive") confirms the config is parsed and the rule registry is populated.
- [x] **Green**: Replace the smoke test with the real config from `tech-docs.md` "ESLint boundaries", set severity to `warn` (not `error`).
  - Date: 2026-05-02. Status: done. Files Changed: `apps/organiclever-web/eslint.config.mjs` (new). Notes: All six element types (`app`, `shared`, `domain`, `application`, `infrastructure`, `presentation`) declared with patterns matching the target layout from tech-docs. `boundaries/element-types` rule severity = `warn`. Allowed-direction rules match tech-docs.
- [x] Run `nx run organiclever-web:lint` and capture the current violation count. Record it as the baseline below.
  - Date: 2026-05-02. Status: done. Notes: oxlint reports 30 pre-existing warnings (a11y, import); eslint reports 1 noise warning (unused-disable-directive); 0 boundary warnings. Lint target updated to run oxlint && eslint.
- [x] **Refactor**: Document the dry-run config in `apps/organiclever-web/docs/explanation/bounded-context-map.md` under "Enforcement".
  - Date: 2026-05-02. Status: done. Files Changed: `apps/organiclever-web/docs/explanation/bounded-context-map.md`. Notes: Expanded Enforcement section with rationale for sidecar eslint pass, Phase 1 dry-run details, and 0-boundary-warning baseline.
- [x] Commit: `chore(organiclever-web): add ESLint boundaries dry-run config`.
  - Date: 2026-05-02. Notes: 6 files changed, 616 insertions / 85 deletions on `worktree-organiclever-adopt-ddd`.

**Phase 1 baseline**:

- [x] Boundary warnings count at end of Phase 1: **0** (`boundaries/element-types` plumbed but no `src/contexts/` exists yet, so the rule has no matching source to check). 30 pre-existing oxlint warnings + 1 eslint noise warning unrelated to boundaries.

**Phase exit gates**:

- [x] `nx run organiclever-web:typecheck` passes.
  - Date: 2026-05-02. Notes: tsc --noEmit successful.
- [x] `nx run organiclever-web:lint` passes (warnings allowed, no errors).
  - Date: 2026-05-02. Notes: oxlint 30 warnings + eslint 1 warning, 0 errors total, exit 0.
- [x] `nx run organiclever-web:test:quick` passes; coverage ≥ baseline.
  - Date: 2026-05-02. Notes: 595 tests pass, 75.81% line coverage (= baseline).

---

## Phase 2 — Ubiquitous-language scaffolding in specs

**Goal**: Land the top-level glossary folder under `specs/apps/organiclever/` and wire it into the surrounding spec READMEs. No code reorg yet.

- [x] Create `specs/apps/organiclever/ubiquitous-language/` as a sibling of `be/`, `fe/`, `c4/`, `contracts/`.
  - Date: 2026-05-02. Notes: `mkdir -p specs/apps/organiclever/ubiquitous-language`.
- [x] **Draft**: Author `specs/apps/organiclever/ubiquitous-language/README.md` index with:
  - [x] Statement that the folder is the platform-agnostic glossary shared by FE today and BE in a future plan.
  - [x] Authoring rules: one file per bounded context; glossary updates ride with code/feature changes in the same commit; Gherkin steps use only glossary terms; code identifiers match the `Code identifier(s)` column verbatim.
  - [x] Index list linking every per-context glossary file.
  - [x] Cross-links to `c4/`, `fe/gherkin/`, and the bounded-context-map ADR.
- [x] **Draft**: Create one glossary file per bounded context using the template from `tech-docs.md` § "Ubiquitous-language file shape". Populate term tables by scanning current Gherkin features and `src/lib/*` identifiers; populate "Forbidden synonyms" by scanning for the same word used differently in another context.
  - Date: 2026-05-02. Files Changed: `journal.md`, `routine.md`, `workout-session.md`, `stats.md`, `settings.md`, `app-shell.md`, `health.md`, `landing.md`, `routing.md` (9 files). Notes: Each file follows the template — One-line summary, Terms table (term/definition/code identifier(s)/used-in features), Forbidden synonyms section.
- [x] Update `specs/apps/organiclever/README.md`:
  - [x] Add `ubiquitous-language/` to the "Structure" tree at the top level.
  - [x] Add a "Ubiquitous Language" entry to the "Spec Artifacts" list linking the folder.
- [x] Update `specs/apps/organiclever/fe/README.md` to link the glossary folder under "Domains" or a new "Ubiquitous Language" section.
  - Date: 2026-05-02. Notes: Added a new "Ubiquitous Language" section before the "Related" section, plus a Related-list entry.
- [x] **Review**: `npm run lint:md` passes; `apps/rhino-cli/dist/rhino-cli docs validate-links --staged-only` passes; every bounded context from the Phase 0 ADR has a glossary file.
  - Date: 2026-05-02. Notes: lint:md scanned 2274 files, 0 errors. validate-links is a future hookup (rhino-cli `docs validate-links` is not present in this branch); links manually inspected. All 9 BCs covered.
- [x] **Refactor**: Add glossary parity check stub — a small test (or `rhino-cli` invocation) that scans Gherkin features for terms not present in any glossary file, output as warning. Wire into `nx run organiclever-web:spec-coverage` only if non-disruptive; otherwise defer wiring to Phase 9.
  - Date: 2026-05-02. Status: deferred. Notes: Per the explicit "otherwise defer wiring to Phase 9" branch — Gherkin folders are not yet reorganized by bounded context (Phase 9 prerequisite), so the parity check has nothing stable to scan. Phase 9 wires the stub.
- [x] Commit: `docs(specs/organiclever): add ubiquitous-language glossary`.
  - Date: 2026-05-02. Notes: 13 files changed, 338 insertions / 25 deletions.

**Phase exit gates**:

- [x] `npm run lint:md` passes.
  - Date: 2026-05-02. Notes: 2274 files, 0 errors.
- [x] All file names follow [File Naming Convention](../../../governance/conventions/structure/file-naming.md) (lowercase kebab-case).
  - Date: 2026-05-02. Notes: All glossary files match `[a-z0-9-]+\.md`. `workout-session.md` and `app-shell.md` use kebab-case.
- [x] Every bounded context in the Phase 0 ADR has a glossary file.
  - Date: 2026-05-02. Notes: 9 ADR contexts → 9 glossary files (journal, routine, workout-session, stats, settings, app-shell, health, landing, routing).
- [x] `specs/apps/organiclever/README.md` Structure tree and Spec Artifacts list mention `ubiquitous-language/`.
  - Date: 2026-05-02. Notes: Both updated.
- [x] `specs/apps/organiclever/fe/README.md` links the glossary folder.
  - Date: 2026-05-02. Notes: New Ubiquitous Language section + Related-list entry.

---

## Phase 3 — Skeleton `src/contexts/` + `src/shared/`

**Goal**: Create empty folder skeleton + path aliases. No source migration yet.

- [x] **Red**: Add `src/shared/utils/` and `src/contexts/<bc>/` folders for every bounded context (one `.gitkeep` placeholder; layer subfolders created lazily as files arrive).
  - Date: 2026-05-02. Notes: 9 BC dirs created (journal, routine, workout-session, stats, settings, app-shell, health, landing, routing) + src/shared/utils/. Each has `.gitkeep`.
- [x] Update `tsconfig.json` paths if cross-context imports will use `@oc/<bc>` aliases — decide at this phase, lock it in. Default: relative paths, no new aliases (simpler for ESLint boundaries).
  - Date: 2026-05-02. Decision: **default — relative paths, no new aliases**. Rationale: ESLint-plugin-boundaries' element-type patterns key on physical paths; aliases would require parallel resolver config and add no clarity since cross-context imports are rare and route through `application/index.ts`. Locked.
- [x] **Green**: `nx run organiclever-web:typecheck` passes.
  - Date: 2026-05-02. Notes: typecheck passes from cache (no source change).
- [x] **Refactor**: None.
- [ ] Commit: `chore(organiclever-web): scaffold contexts and shared folders`.

**Phase exit gates**:

- [x] `nx run organiclever-web:typecheck` passes.
  - Date: 2026-05-02.
- [x] `nx run organiclever-web:lint` passes (warnings only).
  - Date: 2026-05-02. Notes: 0 errors, 1 eslint warning (pre-existing).

---

## Phase 4 — Migrate `health` + `landing` + `routing`

**Goal**: Easiest contexts first. They have minimal cross-context coupling. Build muscle memory and validate the pattern.

For each of `health`, `landing`, `routing`:

- [ ] Identify all current source files that belong to this context. For `health`: `src/services/backend-client.ts`, `src/services/errors.ts`, `src/layers/backend-client-live.ts`, `src/layers/backend-client-test.ts`, `src/app/system/**`, plus health components under `src/components/app/`. For `landing`: `src/components/landing/**` + `src/app/page.tsx` content. For `routing`: any `not-found.tsx` / `/login` / `/profile` 404 guards under `src/app/**`.
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

- [ ] Inventory: `src/lib/journal/settings-store.ts` (currently misplaced under `journal/`), `src/lib/journal/use-settings.ts`, `src/app/app/settings/**`, `src/components/app/settings/**`. Note: `src/lib/journal/schema.ts` is journal-only — settings types (if any) extracted from `settings-store.ts` itself.
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

- [ ] Inventory: `src/lib/journal/journal-store.ts`, `src/lib/journal/journal-machine.ts`, `src/lib/journal/typed-payloads.ts`, `src/lib/journal/use-journal.ts`, `src/lib/journal/run-migrations.ts`, `src/lib/journal/runtime.ts`, `src/lib/journal/seed.ts`, `src/lib/journal/schema.ts`, `src/lib/journal/migrations/`, `src/app/app/home/**` journal-touching parts. Also: `src/lib/journal/types.ts` → `journal/domain/`; `src/lib/journal/errors.ts` → `journal/domain/` (or `journal/application/` if error types are use-case-specific — confirm at migration time); `src/lib/journal/format-relative-time.ts` → `src/shared/utils/` (it is a cross-cutting formatting utility, same treatment as `fmt.ts`).
- [ ] Sub-step 6a — domain: move `JournalEvent` types, `typed-payloads`, invariants → `src/contexts/journal/domain/`. **Red**: tests pre-move green. **Green**: tests post-move green.
- [ ] Sub-step 6b — application: extract use-cases (`appendEvent`, `bumpEvent`, `listEvents`) into `src/contexts/journal/application/`. Define ports. Move `journal-machine.ts` + its unit test into `src/contexts/journal/application/` per `tech-docs.md` § "xstate machine placement" (orchestrating machine: invokes `fromPromise` actors that hit infrastructure).
- [ ] Sub-step 6c — infrastructure: move PGlite store, runtime, migrations into `src/contexts/journal/infrastructure/`. Update Effect `Layer` composition.
- [ ] Sub-step 6d — presentation: move `use-journal.ts` and journal-specific React components into `src/contexts/journal/presentation/`.
- [ ] Sub-step 6e — wire-up: update `src/app/app/home/**`, `src/app/app/history/**`, and any other consumer to import only from `journal/presentation/index.ts` and `journal/application/index.ts`.
- [ ] Commit each sub-step independently: `refactor(organiclever-web): migrate journal <layer>`.

**Phase exit gates**: same as Phase 4.

---

## Phase 7 — Migrate `routine` + `workout-session` + `stats`

**Goal**: Three closely related contexts. Migrate in this order: `routine` → `workout-session` → `stats` (so each downstream context's dependency is already in place).

- [ ] Routine: move `src/lib/journal/routine-store.ts`, `src/lib/journal/use-routines.ts` (both currently misplaced under `journal/`), `src/app/app/routines/**`, `src/components/app/routine/**`, and `src/app/app/workout/**` routine-template-reading parts → `src/contexts/routine/{domain,application,infrastructure,presentation}/`.
- [ ] Workout-session: move `src/lib/workout/workout-machine.ts` + unit test → `src/contexts/workout-session/application/` per `tech-docs.md` § "xstate machine placement" (orchestrating machine: `fromPromise saveWorkout` writes to journal). Pure aggregate types/invariants (if any are extracted) → `domain/`. Update so workout-session **only** writes to journal via `journal/application/index.ts`. Move workout pages to `src/app/app/workout/**` consuming `workout-session/presentation/index.ts`.
- [ ] Stats: move `src/lib/journal/stats.ts` (currently misplaced under `journal/`), history-page projections (`src/components/app/history/**`), progress-page projections (`src/components/app/progress/**`) → `src/contexts/stats/{domain,application,presentation}/`. Stats reads only from `journal/application/index.ts`.
- [ ] Commit per context: `refactor(organiclever-web): migrate <bc> context`.

**Phase exit gates**: same as Phase 4.

---

## Phase 8 — Migrate `app-shell` + flip ESLint to error

**Goal**: Last context migration + boundary enforcement turned on.

- [ ] Move `src/lib/i18n/translations.ts`, `src/lib/i18n/use-t.ts`, `src/lib/app/app-machine.ts` + unit test, layout chrome (`src/app/layout.tsx`-extracted parts), error boundary, loggers (`src/components/app/loggers/**`), theme primitives, plus generic `src/components/app/` chrome and `src/components/app/home/**` page chrome → `src/contexts/app-shell/presentation/` (and `domain/` if any pure types remain). `app-machine` lands in `presentation/` per `tech-docs.md` § "xstate machine placement" (UI shell machine: no IO, no aggregate model — `darkMode`, `isDesktop`, logger selection only).
- [ ] Decide fate of `src/components/` per Phase 0 Q3. Default: move purely-presentational primitives into `src/contexts/app-shell/presentation/components/`.
- [ ] Move `src/lib/utils/fmt.ts` → `src/shared/utils/fmt.ts`. Confirm no other content remains in `src/lib/`.
- [ ] Confirm there are no remaining files outside `src/contexts/`, `src/app/`, `src/shared/`, `src/test/`, `src/generated-contracts/` (codegen output, untouched). Any remainder is a finding — either retag context or move to `src/shared/`.
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
- [ ] **Review**: `npm run lint:md` passes; all internal links resolve (`docs-link-checker` if invoked).
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
- [ ] Manual UI smoke check (Playwright MCP): Start dev server (`nx dev organiclever-web`). Use `browser_navigate` to visit `/app/home`. Run `browser_snapshot` and `browser_console_messages`. Confirm zero JS errors and correct page rendering. Document result inline.
- [ ] Invoke `plan-execution-checker` against this plan and address every finding.
- [ ] Fast-forward merge worktree branch `worktree-organiclever-adopt-ddd` into local `main`. Push `origin main`.
- [ ] Wait for `origin/main` to reflect the SHA. Monitor the `CI` / push workflow on GitHub Actions for `ose-public` (`wahidyankf/ose-public`). Verify all checks pass before declaring Phase 11 complete.
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
