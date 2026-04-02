# Delivery Plan: Spec-Coverage Full Enforcement

## Delivery Overview

Work is organized into six phases: one prerequisite phase (tool + CI enforcement), one parser
recheck phase, plus four implementation phases matching the effort tiers. Each project is
independently deliverable.

**Per-project delivery template**:

1. Run `npx nx run <project>:spec-coverage` to confirm the current gap count (or note that the
   target is currently absent).
2. Create granular tasks (one per feature area within the project, e.g., "auth steps",
   "expenses steps", "admin steps") using TaskCreate. Mark each `in_progress` when starting
   and `completed` when done.
3. Implement missing step definitions using the language-specific developer agent. **No
   shortcuts**: every step must contain earnest implementation logic — no stubs, no `pending()`,
   no empty bodies, no `assert(true)`. Each step must exercise the actual service function and
   assert the expected outcome matching the reference implementation.
4. Run `npx nx run <project>:test:quick` to verify tests pass and coverage meets the threshold.
5. Add the `spec-coverage` target to `apps/<project>/project.json` using the command pattern
   from [tech-docs.md](./tech-docs.md#nx-target-command-patterns).
6. Run `npx nx run <project>:spec-coverage` to confirm 0 gaps.
7. Commit using conventional commit format:
   `feat(<project>): implement missing BDD step definitions and restore spec-coverage`.

---

## Phase 0: Tool Correctness + CI Enforcement

### 0.1 Fix rhino-cli Background step parsing

- [x] Fix `ParseFeatureFile` to include Background steps as a synthetic "(Background)" scenario
- [x] Add parser tests for Background step handling
- [x] Verify coverage ≥90% for rhino-cli

### 0.2 Enforce spec-coverage in CI

All pushes, PRs, and `Test*` workflows must reject when spec-coverage fails:

- [x] Add `spec-coverage` to `pr-quality-gate.yml` — all 9 language quality gate jobs
- [x] Add `spec-coverage` job to `_reusable-test-and-deploy.yml` (ayokoding-web, oseplatform-web)
- [x] Add `spec-coverage` job to `test-organiclever.yml`
- [x] Add `spec-coverage` job to `test-a-demo-be-golang-gin.yml`
- [x] Add `spec-coverage` job to `test-a-demo-be-fsharp-giraffe.yml`
- [x] Add `spec-coverage` job to `test-a-demo-be-csharp-aspnetcore.yml`
- [x] Add `spec-coverage` job to `test-a-demo-fs-ts-nextjs.yml`
- [x] Add `spec-coverage` job to `test-a-demo-fe-ts-nextjs.yml`
- [x] Add `spec-coverage` job to `test-a-demo-fe-ts-tanstack-start.yml`
- [ ] Add `spec-coverage` job to remaining `Test*` workflows as each project's target is restored
- [x] Pre-push hook already enforces `spec-coverage` (done in prior commit)

### 0.3 Update plan gap counts (Background steps now included)

Corrected totals after parser fix:

| Project                   | Old | New | Delta |
| ------------------------- | --- | --- | ----- |
| a-demo-be-rust-axum       | 58  | 59  | +1    |
| a-demo-be-java-vertx      | 79  | 80  | +1    |
| a-demo-be-kotlin-ktor     | 96  | 97  | +1    |
| a-demo-fe-dart-flutterweb | 220 | 241 | +21   |

### 0.4 Recheck parser correctness across ALL projects

Before implementing any step definitions, rerun `rhino-cli spec-coverage validate` on **every**
project in `apps/` and `libs/` that has a `spec-coverage` Nx target — not just the 11 failing
ones. This confirms the parser (after the Background step fix) reports correct coverage for the
19 already-passing projects and catches any newly introduced gaps.

- [ ] Run `npx nx run-many -t spec-coverage` for all projects that currently have the target
      (the 19 passing projects). Record the output.
- [ ] Verify every currently-passing project still reports 0 gaps.
- [ ] If any previously-passing project now reports gaps (due to the Background step parser fix
      surfacing new steps), add those gaps to this plan as new work items.
- [ ] Run spec-coverage manually (via the `go run` command from tech-docs.md) for each of the
      11 failing projects to confirm the exact gap count matches the plan. Record the actual
      missing step lists.
- [ ] If any gap count differs from the plan, update the plan (README.md, requirements.md,
      delivery.md, tech-docs.md) with corrected counts before proceeding.

---

## Phase 1: Tier 1 — Quick Fixes

### 1.1 a-demo-be-ts-effect (3 missing steps)

**Agent**: `swe-typescript-developer`
**Feature areas**: Health endpoint matching, JWKS endpoint

- [ ] Audit existing step files in `apps/a-demo-be-ts-effect/tests/unit/bdd/steps/` to find
      how `/health` is currently referenced (look for `\/health` escaping).
- [ ] Fix the health step matching issue — either normalize the regex escaping in the existing
      step or update the step text to match the Gherkin exactly.
- [ ] Add a step definition for `When the client sends GET /.well-known/jwks.json` that calls
      the JWKS service function.
- [ ] Run `npx nx run a-demo-be-ts-effect:test:quick` and confirm exit 0 with coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-ts-effect/project.json` using the
      TypeScript BE pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-ts-effect:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-ts-effect): implement missing BDD step definitions and restore spec-coverage`.

### 1.2 a-demo-be-python-fastapi (8 missing steps)

**Agent**: `swe-python-developer`
**Feature areas**: Account status assertions, refresh token rotation, attachment upload

- [ ] Audit existing step files in `apps/a-demo-be-python-fastapi/tests/unit/steps/` to
      locate where auth, account, and attachment steps live.
- [ ] Add `@then` step for `alice's account status should be "{status}"` (×3 feature contexts —
      confirm whether one step definition covers all three or each needs a separate handler).
- [ ] Add `@when` step for `alice sends POST .../auth/refresh with her original refresh token`
      that calls the token refresh service with the stored original token.
- [ ] Add `@when` and `@then` steps for the 4 attachment upload scenarios.
- [ ] Run `npx nx run a-demo-be-python-fastapi:test:quick` and confirm exit 0 with coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-python-fastapi/project.json` using the
      Python pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-python-fastapi:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-python-fastapi): implement missing BDD step definitions and restore spec-coverage`.

---

## Phase 2: Tier 2 — Medium Effort

### 2.1 a-demo-fe-e2e (10 missing steps)

**Agent**: `swe-e2e-test-developer`
**Feature areas**: Viewport / responsive layout steps

- [ ] Identify the 10 missing viewport step texts by running the spec-coverage check against
      `specs/apps/a-demo/fe/gherkin/` on `apps/a-demo-fe-e2e`.
- [ ] Create a new step file `apps/a-demo-fe-e2e/tests/steps/layout/viewport.steps.ts` (or add to an
      existing file in `tests/steps/layout/`) with steps like `Given the viewport is set to "desktop" (1280x800)` that call
      `page.setViewportSize({ width: 1280, height: 800 })`.
- [ ] Cover all named viewport presets present in the feature files (desktop, tablet, mobile,
      etc.).
- [ ] Run `npx nx run a-demo-fe-e2e:typecheck` and `npx nx run a-demo-fe-e2e:lint` to confirm
      the new file compiles and lints cleanly.
- [ ] Add the `spec-coverage` target to `apps/a-demo-fe-e2e/project.json` using the TS FE E2E
      pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-fe-e2e:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-fe-e2e): implement missing viewport BDD step definitions and restore spec-coverage`.

### 2.2 organiclever-fe-e2e (15 missing steps)

**Agent**: `swe-e2e-test-developer`
**Feature areas**: Auth flows (Google sign-in, profile, redirects), accessibility (keyboard
navigation, form labels)

- [ ] Identify all 15 missing step texts against `specs/apps/organiclever/fe/gherkin/`.
- [ ] Add auth flow steps (Google sign-in mock/stub, profile page access, redirect assertions)
      to the appropriate step files under `apps/organiclever-fe-e2e/`.
- [ ] Add accessibility steps (keyboard navigation via `locator.press()`, form label assertions
      via `locator.getAttribute('aria-label')`).
- [ ] Run `npx nx run organiclever-fe-e2e:typecheck` and `npx nx run organiclever-fe-e2e:lint`.
- [ ] Add the `spec-coverage` target to `apps/organiclever-fe-e2e/project.json` using the
      organiclever FE E2E pattern from tech-docs.md.
- [ ] Run `npx nx run organiclever-fe-e2e:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(organiclever-fe-e2e): implement missing BDD step definitions and restore spec-coverage`.

### 2.3 a-demo-be-clojure-pedestal (22 missing steps)

**Agent**: `swe-clojure-developer`
**Feature areas**: Admin operations, expenses CRUD, attachments, currency, unit handling

- [ ] Identify all 22 missing step texts by running spec-coverage against
      `specs/apps/a-demo/be/gherkin/` on `apps/a-demo-be-clojure-pedestal`.
- [ ] Add admin step definitions (disable/enable/unlock/force-password-reset) to the existing
      `apps/a-demo-be-clojure-pedestal/test/step_definitions/steps.clj` file (all steps live
      in this single monolithic file; shared helpers are in `common.clj`).
- [ ] Add expenses step definitions (GET by ID, PUT, DELETE) to `steps.clj`.
- [ ] Add attachment step definitions (upload, list, delete + authorization checks) to
      `steps.clj`.
- [ ] Add currency display step definitions (USD and IDR formatting assertions) to `steps.clj`.
- [ ] Add any remaining unit-handling steps to `steps.clj`.
- [ ] Run `npx nx run a-demo-be-clojure-pedestal:test:quick` and confirm exit 0 with
      coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-clojure-pedestal/project.json` using
      the Clojure pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-clojure-pedestal:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-clojure-pedestal): implement missing BDD step definitions and restore spec-coverage`.

---

## Phase 3: Tier 3 — Large Effort

### 3.1 a-demo-be-java-springboot (49 missing steps)

**Agent**: `swe-java-developer`
**Feature areas**: Auth login/register validation, expenses entry CRUD, P&L reporting,
attachments, admin operations, user profile/password/display-name, currency/unit handling

- [ ] Run spec-coverage to enumerate all 49 missing step texts.
- [ ] Group missing steps by feature area (auth, expenses, reporting, attachments, admin,
      user-lifecycle, currency, units).
- [ ] Add auth step definitions (login/register validation: invalid credentials, duplicate
      email, etc.) to the auth step class.
- [ ] Add expenses step definitions (entry create, read, update, delete) to the expenses step
      class.
- [ ] Add P&L reporting step definitions (date range queries, aggregation assertions) to the
      reporting step class.
- [ ] Add attachment step definitions (upload, delete, list, authorization) to the attachments
      step class.
- [ ] Add admin step definitions (disable, enable, unlock, force-password-reset) to the admin
      step class.
- [ ] Add user lifecycle step definitions (profile update, password change, display name) to
      the user step class.
- [ ] Add currency display step definitions (USD and IDR formatting).
- [ ] Add unit handling step definitions (gallon/liter conversions).
- [ ] Run `npx nx run a-demo-be-java-springboot:test:quick` and confirm exit 0 with
      coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-java-springboot/project.json` using
      the Java pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-java-springboot:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-java-springboot): implement missing BDD step definitions and restore spec-coverage`.

### 3.2 a-demo-be-rust-axum (59 missing steps)

**Agent**: `swe-rust-developer`
**Feature areas**: Same as Java springboot but with more granular Given/And setup steps

- [ ] Run spec-coverage to enumerate all 59 missing step texts.
- [ ] Group by feature area as in 3.1.
- [ ] Add step functions using `#[given]`, `#[when]`, `#[then]` macros operating on the
      `World` struct in `apps/a-demo-be-rust-axum/tests/unit/`.
- [ ] Implement data-seeding `Given` and `And` steps for test state setup (e.g., seeding an
      expense record before calling the endpoint).
- [ ] Implement all `When` and `Then` steps across all feature areas (auth, expenses,
      reporting, attachments, admin, user-lifecycle, currency, units).
- [ ] Run `npx nx run a-demo-be-rust-axum:test:quick` and confirm exit 0 with
      coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-rust-axum/project.json` using the
      Rust pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-rust-axum:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-rust-axum): implement missing BDD step definitions and restore spec-coverage`.

### 3.3 a-demo-be-elixir-phoenix (76 missing steps)

**Agent**: `swe-elixir-developer`
**Feature areas**: Health, JWKS, token lifecycle, logout, admin, expenses, reporting,
attachments, user accounts, currency, units

- [ ] Run spec-coverage to enumerate all 76 missing step texts.
- [ ] Group by feature area as above.
- [ ] Add health and JWKS step modules in `apps/a-demo-be-elixir-phoenix/test/unit/`.
- [ ] Add token lifecycle steps (issue, refresh, revoke, expiry assertions).
- [ ] Add logout step definitions.
- [ ] Add admin step definitions (disable, enable, unlock, force-password-reset).
- [ ] Add expenses step definitions (CRUD, listing, pagination).
- [ ] Add reporting step definitions (P&L queries, date range, aggregations).
- [ ] Add attachment step definitions (upload, list, delete + authorization).
- [ ] Add user account step definitions (profile, password change, display name).
- [ ] Add currency display step definitions.
- [ ] Add unit handling step definitions.
- [ ] Run `npx nx run a-demo-be-elixir-phoenix:test:quick` and confirm exit 0 with
      coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-elixir-phoenix/project.json` using
      the Elixir pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-elixir-phoenix:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-elixir-phoenix): implement missing BDD step definitions and restore spec-coverage`.

### 3.4 a-demo-be-java-vertx (80 missing steps)

**Agent**: `swe-java-developer`
**Feature areas**: Same breadth as Elixir — all categories

- [ ] Run spec-coverage to enumerate all 80 missing step texts.
- [ ] Group by feature area (health, JWKS, auth, token, logout, admin, expenses, reporting,
      attachments, user-lifecycle, currency, units).
- [ ] Implement all step definition classes in `apps/a-demo-be-java-vertx/src/test/java/`
      following the existing step class organization.
- [ ] Vertx service calls are reactive; ensure each step blocks on Future completion using
      `vertx.executeBlocking()` or `Awaiter.await()` as appropriate to the existing test setup.
- [ ] Run `npx nx run a-demo-be-java-vertx:test:quick` and confirm exit 0 with
      coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-java-vertx/project.json` using the
      Java pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-java-vertx:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-java-vertx): implement missing BDD step definitions and restore spec-coverage`.

### 3.5 a-demo-be-kotlin-ktor (97 missing steps)

**Agent**: `swe-kotlin-developer`
**Feature areas**: Health, JWKS, token lifecycle, logout, admin, expenses, reporting,
attachments, user accounts, currency, units, list/pagination

- [ ] Run spec-coverage to enumerate all 97 missing step texts.
- [ ] Group by feature area.
- [ ] Add step functions in `apps/a-demo-be-kotlin-ktor/src/test/kotlin/` using Kotlin
      Cucumber JVM annotations (`@Given`, `@When`, `@Then`).
- [ ] Implement health and JWKS steps.
- [ ] Implement token lifecycle steps (issue, refresh, revoke, expiry).
- [ ] Implement logout steps.
- [ ] Implement admin steps (disable, enable, unlock, force-password-reset).
- [ ] Implement expenses steps (CRUD, listing, pagination).
- [ ] Implement reporting steps (P&L, date range, aggregations).
- [ ] Implement attachment steps (upload, list, delete, authorization).
- [ ] Implement user account steps (profile, password, display name).
- [ ] Implement currency display steps.
- [ ] Implement unit handling steps.
- [ ] Run `npx nx run a-demo-be-kotlin-ktor:test:quick` and confirm exit 0 with
      coverage ≥ 90%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-be-kotlin-ktor/project.json` using the
      Kotlin pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-be-kotlin-ktor:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-be-kotlin-ktor): implement missing BDD step definitions and restore spec-coverage`.

---

## Phase 4: Tier 4 — Largest Effort

### 4.1 a-demo-fe-dart-flutterweb (241 missing steps)

**Agent**: `swe-dart-developer`
**Feature areas**: Auth flows, admin panel, expense management, attachments, reporting,
responsive layout, accessibility

- [ ] Run spec-coverage against `specs/apps/a-demo/fe/gherkin/` on
      `apps/a-demo-fe-dart-flutterweb` to enumerate all 241 missing step texts.
- [ ] Audit the existing step files in `apps/a-demo-fe-dart-flutterweb/test/` to understand
      the current step file organization and BDD framework in use.
- [ ] Implement auth flow steps (login, logout, registration, token refresh, redirect
      assertions).
- [ ] Implement admin panel steps (user list, disable/enable/unlock, force-password-reset).
- [ ] Implement expense management steps (create, read, update, delete, listing, pagination).
- [ ] Implement attachment steps (upload widget interaction, list display, delete).
- [ ] Implement reporting steps (P&L display, date range filter interaction, chart/table
      assertions).
- [ ] Implement responsive layout steps (viewport size changes via
      `tester.binding.setSurfaceSize()`).
- [ ] Implement accessibility steps (keyboard navigation, ARIA label assertions, focus order).
- [ ] Implement currency display steps (USD and IDR formatting in widgets).
- [ ] Implement unit handling steps (gallon/liter display in widgets).
- [ ] Run `npx nx run a-demo-fe-dart-flutterweb:test:quick` and confirm exit 0 with
      coverage ≥ 70%.
- [ ] Add the `spec-coverage` target to `apps/a-demo-fe-dart-flutterweb/project.json` using
      the Dart pattern from tech-docs.md.
- [ ] Run `npx nx run a-demo-fe-dart-flutterweb:spec-coverage` and confirm 0 gaps.
- [ ] Commit: `feat(a-demo-fe-dart-flutterweb): implement missing BDD step definitions and restore spec-coverage`.

---

## Final Validation

- [ ] Run `npx nx run-many -t spec-coverage` across ALL projects (apps/ and libs/) and confirm
      every project with a spec-coverage target exits with code 0.
- [ ] Run `npx nx run-many -t test:quick` for all 11 previously failing projects and confirm
      all pass.
- [ ] Spot-check step definitions in at least 3 projects (one per tier) to confirm no shortcuts
      were taken — no stubs, no `pending()`, no empty bodies, no `assert(true)`.
- [ ] Verify the pre-push hook includes spec-coverage in its affected targets run by
      simulating a push or running `npx nx affected -t spec-coverage`.
- [ ] Update this plan's status in [README.md](./README.md) to "Completed".
- [ ] Move this plan folder from `plans/in-progress/` to `plans/done/` and update both index
      files.

## Validation Checklist

- [ ] All 30 projects report 0 spec-coverage gaps.
- [ ] All 11 previously failing projects have `spec-coverage` in their `project.json`.
- [ ] All 11 previously failing projects pass `test:quick` with coverage at or above threshold.
- [ ] No existing passing project has regressed (still passes `test:quick` and `spec-coverage`).
- [ ] All commits follow conventional commit format.
- [ ] No changes made to `.feature` files — only step definition code was added.
- [ ] No step definition contains stubs, `pending()`, empty bodies, or `assert(true)`.
- [ ] Phase 0.4 parser recheck was completed before implementation began.
