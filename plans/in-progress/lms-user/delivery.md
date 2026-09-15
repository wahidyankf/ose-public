# Delivery — LMS Authentication

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.

## Worktree

Worktree path: `worktrees/lms-user/`

This worktree existed before plan authoring. Its provisioning command and creator are not asserted
because neither is recoverable from repository evidence. Phase 0 reconciles provenance and appends
the result before implementation. The plan reuses this one worktree for the single delivery unit and
removes it immediately after merge and terminal audit.

### Provisioned Worktree Identity

- Declared repository-relative route: `worktrees/lms-user/`
- Observed branch: `lms-user` [Repo-grounded: `git branch --show-current`]
- Observed authoring HEAD: `26d466cf1c5e572890d73c896bfad37be814f39d`
  [Repo-grounded: `git rev-parse HEAD`]
- Observed branch-created time: `2026-09-14T12:55:25Z`
  [Repo-grounded: `git reflog show --date=iso-strict lms-user`]
- Provisioning command and creator: pending Phase 0 reconciliation; do not recreate or rename the
  worktree merely to match a template.

### Delivery Branch Inventory

| Branch     | Mode          | Lifecycle state | Proof                                             |
| ---------- | ------------- | --------------- | ------------------------------------------------- |
| `lms-user` | `provisioned` | `active`        | `git worktree list --porcelain` at plan authoring |

Append every plan-created branch before use. Before cleanup, classify every row as delivered,
unused, or retained/escalated; active or unrecorded branches block removal.

## Delivery Mode: worktree-to-pr

`ose-public` requires a short-lived worktree branch, a PR to `main`, exact-current-head/base
`pr-quality-gate.yml`, one clean current-head `pr-leak-review`, and applicable API gates. Broad
semantic PR review is absent because the user did not request it. `[AI]` merges once all hardened
preconditions pass.

## Delivery Boundaries

| Unit                     | Phases | Deployable outcome                                                                                                                                                                                                                                                                                     | Delivery boundary                                                                                                                                                  |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DU1 — LMS authentication | 0–8    | Contract/specs, schema, registration, login/JWT, protected access, refresh/logout, throttling, Integration/E2E, docs, manual/API proof, terminal candidate-head audit, and archived plan/index state form one internally complete deployable change. No partial phase is pushed as a feature delivery. | Phase 8 is the sole delivery boundary: one green `lms-user` PR to `main`. Phase 9 only verifies the merge and removes already-delivered worktree/branch resources. |

## Phase 0: Environment and Green Baseline

**Input:** registered `worktrees/lms-user/`, branch `lms-user`, and HEAD
`26d466cf1c5e572890d73c896bfad37be814f39d` at authoring time.
**Outcome:** a current, clean, reproducible worktree with recorded green contract/backend/E2E baselines.

**Proof:** command transcripts under `plans/in-progress/lms-user/evidence/`.

- [ ] [AI] From the repository root, run `rtk git worktree list --porcelain`, enter the registered
      `worktrees/lms-user/`, and run `rtk git branch --show-current`; acceptance: the route maps to
      branch `lms-user`. Inspect the branch reflog and available session evidence, record the actual
      provisioning provenance or `not recoverable` in the identity section, and stop before editing
      until route/branch/HEAD/provenance are reconciled. Never recreate or rename the worktree solely
      to fill missing provenance.
- [ ] [AI] Fetch and reconcile the worktree with `origin/main` using the non-destructive Step 0 path
      from `repo-governance/workflows/plan/plan-execution.md`; acceptance:
      `rtk git merge-base --is-ancestor origin/main HEAD` exits 0 and no unrelated user changes were
      overwritten.
- [ ] [AI] Install dependencies and converge tools with
      `rtk ./hippo run --class ephemeral --disk-path . -- npm install` and
      `rtk npm run doctor -- --fix`; acceptance: both exit 0. Diagnose any failure at its root cause.
- [ ] [AI] Inspect `apps/ose-lms-be/.env.example` and existing ignored local environment state without
      adding auth values yet. Acceptance: the baseline needs no database or auth secret, and no real
      value or local environment file appears in `rtk git status --short`. Phase 6 adds and validates
      the new placeholders before any auth-enabled process is started.
- [ ] [AI] Capture
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:quick -p ose-lms-contracts,ose-lms-be,ose-lms-be-e2e --parallel=1`
      to `evidence/phase-0-quick.txt`; acceptance: exit 0.
- [ ] [AI] Capture
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:e2e`
      to `evidence/phase-0-e2e.txt`; acceptance: all existing scenarios pass without retries.
- [ ] [AI] Run `rtk git status --short`; acceptance: only this plan's already-authorized plan files
      are changed before feature implementation begins.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [ ] [AI] Worktree identity is reconciled, `origin/main` is an ancestor, tooling is green, and both
      baseline transcripts exit 0 with no preexisting failure.
- [ ] [AI] The execution ledger records any post-authoring commits and the full reconciled diff
      before implementation starts.

> **Pause Safety**: no feature behavior has changed and the baseline is reproducible. Safe to stop.
> To resume: rerun
> `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:quick -p ose-lms-contracts,ose-lms-be,ose-lms-be-e2e --parallel=1`.

---

## Phase 1: Canonical Gherkin and OpenAPI (RED)

**Input:** AC-REG-01 through AC-CONFIG-01 in `prd.md` and the existing contract-first corpus.

**Outcome:** specifications fully describe auth while production code is still absent; static
coverage supplies the expected RED proof.
**Proof:** contract lint success plus intentional undefined-binding transcripts.

- [ ] [AI] Add registration, login, access, refresh, logout, and throttling `.feature` files under
      `specs/apps/ose/lms-be/behaviours/authentication/` and update the corpus READMEs. Use exact
      behavior from `prd.md`, one journey per scenario, and no device identifier/cap/eviction scenario.
      Run `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:behaviour`;
      acceptance: RED reports only the new undefined bindings. Save it as `evidence/phase-1-red-coverage.txt`.
  - _Suggested executor: `specs-maker`_
- [ ] [AI] Update existing config/health/hello scenarios: protect hello, explicitly prove anonymous
      health, add startup configuration behavior, and add scenario-level Integration exemptions only
      where the local-resource boundary fundamentally cannot express the scenario. Each exemption must
      name its alternative proof using the required comment syntax.
  - _Suggested executor: `specs-maker`_
- [ ] [AI] Extend `specs/apps/ose/lms-be/contracts/` with the four auth operations, protected hello,
      HTTP Bearer scheme, `AuthCredentials`, `RefreshTokenRequest`, `PublicUser`, `TokenPair`, RFC 9457
      Problem Details, cache-control headers, and all status/header contracts from `prd.md`. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-contracts:test:quick`;
      acceptance: the OpenAPI 3.1 bundle, Spectral lint, and specs structure validation exit 0.
  - _Suggested executor: `specs-maker`_
- [ ] [AI] Update `specs/apps/ose/lms-be/{README.md,architecture.md}` with the target actors,
      PostgreSQL/security components, API/BFF boundary, and applicable Unit/Integration/E2E layers.
      Render every changed Mermaid diagram and store failures in `evidence/phase-1-diagrams.txt`.
  - _Suggested executor: `specs-maker`_

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [ ] [AI] `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-contracts:test:quick`
      exits 0; new Gherkin is structurally valid; the saved
      behavior-coverage RED is limited to bindings that later phases deliberately add.
- [ ] [AI] `rtk rg -n 'deviceId|maxDevices|maxConcurrentSessions|evictOldestSession' specs/apps/ose/lms-be`
      returns no device-cap request field, setting, or implementation-oriented behaviour.

> **Pause Safety**: the product contract is internally valid and intentionally RED only because
> production/test bindings do not exist. Safe to stop. To resume: rerun
> `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-contracts:test:quick`
> and
> `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:behaviour`.

---

## Phase 2: PostgreSQL, Flyway, and the Integration Boundary

**Input:** persistence design in `tech-docs.md` §4/§6 and migration-related acceptance criteria.

**Outcome:** the service can migrate and access the auth schema; Unit/Integration target topology
is real and statically enforced, without exposing auth endpoints yet.
**Proof:** migration/repository RED→GREEN→REFACTOR output and rules-propagation manifest.

### AC-DATA-01 — Apply and use the authentication schema

- [ ] [AI] **RED:** create Integration tests under
      `apps/ose-lms-be/tests/integration/java/com/oseplatform/lms/auth/` for Flyway-on-empty-PostgreSQL,
      all four tables/audit columns/constraints, active-row filtering, persistence across Spring
      contexts, and concurrent unique usernames. Add the Gradle source set and Nx `test:integration` /
      `test:coverage:integration` wiring needed to compile the RED tests. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`;
      acceptance: tests fail because migrations/adapters are absent. Save `evidence/phase-2-red-integration.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** add the Spring Data JDBC, PostgreSQL, Apache-licensed Flyway, Testcontainers,
      and `@ServiceConnection` dependencies plus `V1__create_authentication.sql`, configuration records,
      domain records, repository ports, and JDBC adapters defined by `tech-docs.md`. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`;
      acceptance: every schema, persistence, filtering, and race test passes.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **REFACTOR:** remove duplicated SQL/test setup, keep transactions at use-case boundaries,
      and narrowly exclude only wholly database-bound adapter code from the Unit denominator when the
      Integration proof names it. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit`,
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`,
      and `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage`;
      acceptance: all applicable runtime/static checks pass except later
      auth behavior bindings that remain intentionally RED.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] Execute the migration **expand** proof on a clean Testcontainers PostgreSQL instance and
      capture `flyway_schema_history`, `information_schema` columns/nullability/defaults, constraints,
      FK `ON DELETE RESTRICT`, indexes, and all six ordered audit columns to
      `evidence/phase-2-schema-expand.txt`; acceptance: the observed schema exactly matches
      `tech-docs.md` §4.
- [ ] [AI] Execute the **verify/no-loss** proof: insert deterministic synthetic rows in all four
      tables, capture ordered row counts plus SHA-256 digests of stable non-secret columns, stop the
      new application, start the Phase 0 JAR against the same database, stop it without migration or
      row change, then restart the new JAR and recapture the counts/digests. Save sanitized output at
      `evidence/phase-2-migration-no-loss.txt`; acceptance: before/rollback/forward counts and digests
      are identical and the new repositories read the same rows.
- [ ] [AI] Record the **contract** disposition as `retain`: no table, column, constraint, index, or
      synthetic proof row is removed by this delivery. Acceptance: rollback is application-only,
      `V1__create_authentication.sql` is unchanged after any successful application, and any repair is
      a new forward Flyway migration.

### Repository Rules Propagation — Integration Loopback

- [ ] [AI] Normalize the proposed rule as: “`ose-lms-be:test:integration` may bind only the
      Testcontainers PostgreSQL loopback socket that it starts, controls, and shuts down; external or
      unowned network access remains forbidden.” Save the intake in
      `local-tmp/rules-propagation/lms-user-intake.md`.
- [ ] [AI] Inventory every existing occurrence of `integration-loopback`, `ose-lms-be`, Testcontainers,
      and Integration network guidance across `AGENTS.md`, `repo-governance/`, `repo-config.yml`,
      enforcement, and harness bindings with
      `rtk rg -n 'integration-loopback|test-boundary|Testcontainers|ose-lms-be' AGENTS.md CLAUDE.md .claude .opencode repo-config.yml repo-governance docs apps/rhino-cli`;
      record canonical/duplicate/conflict verdicts in the generated placement manifest.
- [ ] [AI] Classify the rule as an app-specific enforcement allowlist entry under existing
      repository-wide Integration policy; acceptance: no higher-layer conflict, new normative prose,
      instruction-cache admission, or eviction is needed.
- [ ] [AI] Edit only `repo-config.yml` `integration-loopback` with project `ose-lms-be` and the
      concrete owned-PostgreSQL reason; record all other candidate surfaces as “keep unchanged” with
      rationale. If the inventory disproves this placement, halt and run the formal conflict path.
  - _Suggested executor: `rules-maker`_
- [ ] [AI] Record enforcement disposition as “already enforced by `test-boundary`”; do not add a
      duplicate validator. Run `rtk npm run sync:dry-run`; acceptance: it exits 0 with no binding diff,
      then record “binding generation not applicable—`repo-config.yml` allowlist is not a harness
      canonical input.” If it reports a binding diff, run `rtk npm run generate:bindings` and keep all
      generated mirrors in this delivery.
- [ ] [AI] Run propagation Step 8 deterministic verification exactly:
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh repo-config validate`,
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate validate`,
      and
      `rtk ./hippo run --class transactional --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh repo-governance test-boundary validate`;
      acceptance: all exit 0 and the allowlisted Testcontainers use is the only owned loopback finding.
- [ ] [AI] Invoke `rules-quality-gate` in `EFFECTIVE` mode for the normalized rule and current diff;
      acceptance: its `rules-checker` audit at
      `local-tmp/repo-rules/rules-quality-gate__lms-user__ledger.md` returns `PASS` with no unresolved
      contradiction, duplicate, placement, enforcement, or sibling finding. Copy the sanitized ledger
      to `evidence/phase-2-rules-quality-gate.md`.
- [ ] [AI] Record the pre-delivery manifest as `final-status: partial`, with
      `sibling-obligation: none—ose-lms-be exists only in this repository` and `delivery: pending`;
      do not invent a PR identity before Phase 8 opens it. Copy the sanitized manifest to
      `evidence/phase-2-rules-propagation.md`. Phase 9 changes only the runtime manifest status to
      `landed` after the single feature PR merges; it does not create another tracked delivery.

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [ ] [AI] Empty-database migration, repository, restart, uniqueness-race, audit-column, and
      soft-delete tests pass against Testcontainers PostgreSQL.
- [ ] [AI] `repo-config.yml` has exactly one justified `ose-lms-be` loopback entry; rules quality,
      test-boundary enforcement, and the propagation manifest are green.

> **Pause Safety**: the new schema and internal adapters are deployable but no public auth operation
> is exposed. Safe to stop. To resume: rerun
> `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`.

---

## Phase 3: Registration

**Input:** AC-REG-01..03 and the Phase 2 repository boundary.

**Outcome:** registration creates exactly one canonical account with an Argon2id password hash and
never creates a session.
**Proof:** focused Unit, Integration, contract, and static coverage outputs.

- [ ] [AI] **RED:** add Cucumber Unit bindings and focused JUnit cases under
      `apps/ose-lms-be/src/test/java/com/oseplatform/lms/` for normalization, username pattern/bounds,
      15/128-code-point password boundaries, Unicode/spaces, no password normalization, duplicate and
      concurrent registration, and secret-free response/logging. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit`;
      acceptance:
      tests fail because registration is absent. Save `evidence/phase-3-red-registration.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** implement registration use case, Argon2id adapter with `{argon2}` prefix and
      documented baseline parameters, transaction/unique-conflict mapping, controller, and Problem
      Details mapping. Regenerate models with
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:codegen`,
      then rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the previously RED registration Unit and Integration cases pass and
      `POST /api/v1/auth/register` matches OpenAPI.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **REFACTOR:** centralize canonicalization/validation and redact credential-bearing values
      at log/error boundaries. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit`,
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`,
      and `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage`;
      acceptance: registration behavior remains green at 99% authored-line
      coverage with exactly one binding per applicable scenario.
  - _Suggested executor: `swe-java-dev`_

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [ ] [AI] AC-REG-01..03 pass at Unit and Integration layers; contract lint/codegen/typecheck pass;
      the response and captured logs contain no credential, hash, or token.

> **Pause Safety**: registration is complete and deployable but does not log the user in. Safe to
> stop. To resume: rerun
> `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit` and
> `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`.

---

## Phase 4: Login, JWT Access, and Protected Hello

**Input:** AC-LOGIN-01..02 and AC-ACCESS-01..02.

**Outcome:** valid credentials create an unlimited independent session family and JWT/refresh
pair; hello requires a valid active Bearer token while health stays public.
**Proof:** login/security RED→GREEN→REFACTOR evidence and protected-route tests.

- [ ] [AI] **RED:** add Unit/Integration cases for valid login, `{argon2}` verification, the fixed
      dummy-hash path, identical unknown/wrong/deleted failures, repeated independent logins, token
      response/cache headers, persisted session family, and secret-free logs. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit` and
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`;
      acceptance: they fail because login/token issuance is absent. Save `evidence/phase-4-red-login.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** implement login, secure random refresh token/digest storage, HS256 JWT issuance,
      and generic credential errors. Do not accept `deviceId` or inspect session counts. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the previously RED login tests pass and every valid login creates another
      unaffected family.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **RED:** add MockMvc/security and Integration cases for valid hello access, anonymous and
      malformed/expired/bad-signature/bad-algorithm/bad-issuer/bad-audience/revoked-session tokens,
      `WWW-Authenticate`, and anonymous health. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit`;
      acceptance: protected-route
      tests fail while existing health remains green. Save `evidence/phase-4-red-access.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** add the Spring Security filter chain, exact HS256/issuer/audience/claim
      validation, persisted `sid` check, Problem response writer, protected hello, and public auth/health
      matchers. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the previously RED AC-ACCESS-01..02 cases pass and direct browser CORS remains
      disabled.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **REFACTOR:** keep authentication parsing, claim validation, and session validation in
      separate components; remove duplicated problem construction. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t codegen,typecheck,lint,test:unit,test:integration,test:coverage -p ose-lms-be --parallel=1`;
      acceptance: all Phase 4 behavior is green at 99% coverage.
  - _Suggested executor: `swe-java-dev`_

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [ ] [AI] AC-LOGIN-01..02 and AC-ACCESS-01..02 pass; invalid credential/token variants expose no
      distinguishing detail; multiple logins remain active; public health is unchanged.

> **Pause Safety**: registration/login and protected access form a deployable slice; refresh/logout
> endpoints remain absent rather than half-enabled. Safe to stop. To resume: rerun
> `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`.

---

## Phase 5: Refresh Rotation and Current-Session Logout

**Input:** AC-REFRESH-01..02 and AC-LOGOUT-01.

**Outcome:** refresh is single-use and replay-contained; logout immediately revokes only the
caller's family.
**Proof:** deterministic clock and concurrency tests across Unit/Integration.

- [ ] [AI] **RED:** add fixed-clock Unit and PostgreSQL Integration tests for successful rotation,
      unchanged absolute expiry, malformed/unknown/expired/revoked generic failures, consumed-token
      replay, and concurrent refresh where only one successor can be issued. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: RED is caused only by missing refresh behavior. Save `evidence/phase-5-red-refresh.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** implement refresh lookup/locking, atomic consume-and-replace, remaining lifetime,
      generic failures, and family-wide replay revocation. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the previously RED refresh cases pass, including winner/loser concurrency and
      latest-token revocation, without sleeps or retries.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **RED:** add Unit/Integration tests where one of two families logs out and only its access
      and refresh tokens fail immediately. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: RED is caused by missing
      current-family logout. Save `evidence/phase-5-red-logout.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** implement idempotent current-family revocation behind authenticated
      `POST /api/v1/auth/logout`. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the previously RED logout cases pass, response is 204, that family is unusable,
      and the other family still passes protected hello and refresh.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **REFACTOR:** consolidate revocation reasons and transactional family operations without
      merging refresh/logout public semantics. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration,test:coverage -p ose-lms-be --parallel=1`;
      acceptance: AC-REFRESH-01..02 and AC-LOGOUT-01 remain green at 99% Unit coverage.
  - _Suggested executor: `swe-java-dev`_

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [ ] [AI] Rotation, replay, concurrent refresh, absolute expiry, and two-session logout isolation
      pass without retries or timing sleeps.

> **Pause Safety**: the complete session lifecycle is deployable with default security values. Safe
> to stop. To resume: rerun
> `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`.

---

## Phase 6: Throttling and Validated Configuration

**Input:** AC-THROTTLE-01 and AC-CONFIG-01.

**Outcome:** all chosen limits are shared, configurable, fail-closed, and BFF-aware without
trusting arbitrary forwarded addresses.
**Proof:** fixed-clock Unit and PostgreSQL atomic-count tests plus startup-failure assertions.

- [ ] [AI] **RED:** add Unit/Integration tests for fifth-versus-sixth username failure, twentieth-
      versus-twenty-first source auth attempt, tenth-versus-eleventh source registration, Retry-After,
      successful-login username reset, independent source bucket, concurrent boundary attempts, and
      fixed-window rollover. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the suites fail because throttling is absent. Save
      `evidence/phase-6-red-throttling.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** implement HMAC-keyed PostgreSQL window counters, atomic increments, defaults,
      and Problem responses. Apply username failure only to failed logins; source auth to login/refresh;
      source registration to register. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the previously RED throttle cases pass at every exact boundary.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **RED:** add configuration/source-resolution cases for weak secrets, invalid lifetimes,
      non-positive limits/windows, invalid CIDRs, direct peer default, ignored spoofed forwarded header,
      and trusted-proxy forwarding. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit`;
      acceptance: invalid configurations do not
      yet fail as contracted. Save `evidence/phase-6-red-config.txt`.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **GREEN:** implement validated immutable properties and trusted-proxy source resolution;
      update `application.yaml` and `.env.example` with placeholders/defaults. Acceptance: invalid values
      fail startup naming only the setting. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration -p ose-lms-be --parallel=1`;
      acceptance: the previously RED configuration and proxy-resolution cases pass without logging
      raw secrets.
  - _Suggested executor: `swe-java-dev`_
- [ ] [AI] **REFACTOR:** keep window policy and source resolution framework-free, remove duplicate
      time arithmetic, and index the active window lookup. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:unit,test:integration,lint,test:coverage -p ose-lms-be --parallel=1`;
      acceptance: Phase 6 remains deterministic and 99% covered.
  - _Suggested executor: `swe-java-dev`_

### Phase 6 Gate

> All checks below must pass before starting Phase 7.

- [ ] [AI] AC-THROTTLE-01 and AC-CONFIG-01 pass at exact limits with fixed time, config overrides,
      trusted-proxy cases, multi-thread races, and no raw source identity persisted.

> **Pause Safety**: auth is feature-complete and operable with safe defaults. Safe to stop. To
> resume: rerun the full backend Unit and Integration suites.

---

## Phase 7: Real-Process E2E, Documentation, and Manual Verification

**Input:** all PRD acceptance criteria and the feature-complete backend.

**Outcome:** a built JAR and isolated PostgreSQL prove public behavior; docs describe the as-built
system; exploratory defects are fixed.
**Proof:** unfiltered Playwright-BDD, manual curl, API exploratory, diagrams, and quick gates.

- [ ] [AI] **RED:** add `apps/ose-lms-be-e2e/docker-compose.yml` service `postgres` on host port
      **5437**, health check `pg_isready -U ose_lms -d ose_lms_e2e`, disposable named volume, the `pg`
      dev dependency, `scripts/run-e2e.ts`, FK-safe per-scenario truncate fixture, auth HTTP/token/context
      steps, concurrency helpers, and bindings for every non-exempt scenario. Keep
      `apps/ose-lms-be-e2e/behaviour-coverage.json` mapped only to the owner's Unit and E2E adapters;
      Integration belongs to `apps/ose-lms-be/behaviour-coverage.json`. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:coverage:e2e`;
      acceptance: it initially reports only missing new E2E bindings.
      Save `evidence/phase-7-red-e2e-coverage.txt`.
  - _Suggested executor: `swe-e2e-dev`_
- [ ] [AI] **GREEN:** implement `scripts/run-e2e.ts` so `try/finally` runs Compose project
      `ose-lms-be-e2e-auth` up with `-d --wait`, delegates to the existing built-JAR Playwright lifecycle
      on port 8403, preserves the test exit code, then always runs `down -v --remove-orphans`. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:e2e`;
      acceptance: all auth/health journeys pass against `127.0.0.1:5437` with no retry/sleep and
      `docker compose -p ose-lms-be-e2e-auth -f apps/ose-lms-be-e2e/docker-compose.yml ps -a` is empty.
      Save sanitized lifecycle transcripts as `evidence/phase-7-e2e-{up,test,down}.txt`.
  - _Suggested executor: `swe-e2e-dev`_
- [ ] [AI] **REFACTOR:** remove scenario-specific cleanup duplication and ensure teardown always
      stops owned processes/containers. Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:e2e`
      twice from clean state; acceptance: both runs pass and
      leave no owned process, container, port, or synthetic row behind.
  - _Suggested executor: `swe-e2e-dev`_
- [ ] [AI] Update `apps/ose-lms-be/README.md`, `apps/ose-lms-be-e2e/README.md`, and
      `docs/reference/web-sites.md` with actual endpoints, env variables, test commands, BFF boundary,
      Integration applicability, and E2E PostgreSQL port. Acceptance: no statement still claims auth,
      persistence, Integration, or E2E is absent.
  - _Suggested executor: `docs-maker`_

### Manual API Verification (curl)

- [ ] [AI] Start isolated PostgreSQL with
      `rtk ./hippo run --class service --disk-path . -- docker compose -p ose-lms-be-e2e-auth -f apps/ose-lms-be-e2e/docker-compose.yml up -d --wait postgres`;
      acceptance: Compose reports healthy on `127.0.0.1:5437`. Start the backend separately with the
      synthetic E2E env via
      `rtk ./hippo run --class service --disk-path . -- npm exec nx -- run ose-lms-be:dev`;
      acceptance: `/actuator/health` becomes 200 and no real secret is printed.
- [ ] [AI] Create a token-only temporary directory with
      `AUTH_TMP="$(rtk mktemp -d)"; AUTH_BASE='http://127.0.0.1:8303'`; acceptance:
      `rtk test -d "$AUTH_TMP"` exits 0 and the path is outside the repository.
- [ ] [AI] Register exactly with
      `rtk curl -sS -D "$AUTH_TMP/register.headers" -o "$AUTH_TMP/register.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"username":" Plan_User ","password":"correct horse battery staple"}' "$AUTH_BASE/api/v1/auth/register"`;
      acceptance: status `201`, username `plan_user`, and no password/hash/token. Copy the public body
      and status to `evidence/phase-7-curl-register.txt`.
- [ ] [AI] Repeat that exact register command with output paths `duplicate.headers` and
      `duplicate.json`; acceptance: status `409`, content type `application/problem+json`, and code
      `username_unavailable`. Copy the secret-free result to
      `evidence/phase-7-curl-register-duplicate.txt`.
- [ ] [AI] Log in twice using these literal commands:
      `rtk curl -sS -D "$AUTH_TMP/login-one.headers" -o "$AUTH_TMP/login-one.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"username":"plan_user","password":"correct horse battery staple"}' "$AUTH_BASE/api/v1/auth/login"`
      and
      `rtk curl -sS -D "$AUTH_TMP/login-two.headers" -o "$AUTH_TMP/login-two.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"username":"plan_user","password":"correct horse battery staple"}' "$AUTH_BASE/api/v1/auth/login"`;
      acceptance: both statuses are `200`, each pair differs, and both headers contain exactly
      `Cache-Control: no-store` and `Pragma: no-cache`. Run
      `rtk jq 'del(.accessToken,.refreshToken)' "$AUTH_TMP/login-one.json"` and copy only that redacted
      output plus sanitized headers to `evidence/phase-7-curl-login.txt`.
- [ ] [AI] Load tokens into shell variables without printing them:
      `ACCESS_ONE="$(rtk jq -r '.accessToken' "$AUTH_TMP/login-one.json")"; REFRESH_ONE="$(rtk jq -r '.refreshToken' "$AUTH_TMP/login-one.json")"; ACCESS_TWO="$(rtk jq -r '.accessToken' "$AUTH_TMP/login-two.json")"; REFRESH_TWO="$(rtk jq -r '.refreshToken' "$AUTH_TMP/login-two.json")"`;
      acceptance: `rtk test -n "$ACCESS_ONE"`, `rtk test -n "$REFRESH_ONE"`,
      `rtk test -n "$ACCESS_TWO"`, and `rtk test -n "$REFRESH_TWO"` all exit 0.
- [ ] [AI] Call protected hello exactly with
      `rtk curl -sS -D "$AUTH_TMP/hello.headers" -o "$AUTH_TMP/hello.json" -w '%{http_code}\n' -H "Authorization: Bearer $ACCESS_ONE" "$AUTH_BASE/api/v1/hello"`;
      acceptance: status `200` and message `Hello, world!`. Copy the secret-free response to
      `evidence/phase-7-curl-hello.txt`.
- [ ] [AI] Refresh family one exactly with
      `rtk curl -sS -D "$AUTH_TMP/refresh.headers" -o "$AUTH_TMP/refresh.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$REFRESH_ONE\"}" "$AUTH_BASE/api/v1/auth/refresh"`;
      acceptance: status `200`, replacement access/refresh values differ, and cache headers are
      `no-store`/`no-cache`. Load `ACCESS_ONE_NEW`/`REFRESH_ONE_NEW` with `rtk jq -r`, then copy only
      `rtk jq 'del(.accessToken,.refreshToken)' "$AUTH_TMP/refresh.json"` and sanitized headers to
      `evidence/phase-7-curl-refresh.txt`.
- [ ] [AI] Replay the consumed token exactly with
      `rtk curl -sS -D "$AUTH_TMP/replay.headers" -o "$AUTH_TMP/replay.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$REFRESH_ONE\"}" "$AUTH_BASE/api/v1/auth/refresh"`;
      acceptance: status `401`, content type `application/problem+json`, code `invalid_token`; a
      subsequent hello call using `ACCESS_ONE_NEW` returns the same `401 invalid_token`. Save both
      secret-free problems at `evidence/phase-7-curl-replay.txt`.
- [ ] [AI] Prove family-two isolation, then logout, with
      `rtk curl -sS -o "$AUTH_TMP/family-two-before.json" -w '%{http_code}\n' -H "Authorization: Bearer $ACCESS_TWO" "$AUTH_BASE/api/v1/hello"`,
      `rtk curl -sS -o "$AUTH_TMP/logout.json" -w '%{http_code}\n' -X POST -H "Authorization: Bearer $ACCESS_TWO" "$AUTH_BASE/api/v1/auth/logout"`,
      and
      `rtk curl -sS -o "$AUTH_TMP/family-two-after.json" -w '%{http_code}\n' -H "Authorization: Bearer $ACCESS_TWO" "$AUTH_BASE/api/v1/hello"`;
      acceptance: statuses are `200`, `204`, then `401` with code `invalid_token`. Save sanitized
      status/problem output at `evidence/phase-7-curl-logout.txt`.
- [ ] [AI] Run literal negative probes:
      `rtk curl -sS -o "$AUTH_TMP/health.json" -w '%{http_code}\n' "$AUTH_BASE/api/v1/health"`,
      `rtk curl -sS -o "$AUTH_TMP/missing-token.json" -w '%{http_code}\n' "$AUTH_BASE/api/v1/hello"`,
      `rtk curl -sS -o "$AUTH_TMP/bad-token.json" -w '%{http_code}\n' -H 'Authorization: Bearer not-a-jwt' "$AUTH_BASE/api/v1/hello"`,
      `rtk curl -sS -o "$AUTH_TMP/malformed-login.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"username":' "$AUTH_BASE/api/v1/auth/login"`,
      and
      `rtk curl -sS -o "$AUTH_TMP/wrong-password.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"username":"plan_user","password":"this password is wrong"}' "$AUTH_BASE/api/v1/auth/login"`;
      acceptance: statuses/codes are `200`, `401 invalid_token`, `401 invalid_token`,
      `400 validation_failed`, and `401 invalid_credentials`. Save secret-free bodies at
      `evidence/phase-7-curl-negative.txt`.
- [ ] [AI] Run the CORS probe exactly with
      `rtk curl -sS -D "$AUTH_TMP/cors.headers" -o "$AUTH_TMP/cors.json" -w '%{http_code}\n' -X OPTIONS -H 'Origin: https://untrusted.example' -H 'Access-Control-Request-Method: POST' "$AUTH_BASE/api/v1/auth/login"`;
      acceptance: status `403`, no `Access-Control-Allow-Origin`, and no `Set-Cookie`. Save sanitized
      headers/status at `evidence/phase-7-curl-cors.txt`.
- [ ] [AI] Use a fresh synthetic username and issue six wrong-password logins with
      `for attempt in 1 2 3 4 5 6; do rtk curl -sS -D "$AUTH_TMP/rate-$attempt.headers" -o "$AUTH_TMP/rate-$attempt.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"username":"rate_user","password":"this password is wrong"}' "$AUTH_BASE/api/v1/auth/login"; done`;
      acceptance: attempts 1–5 return `401 invalid_credentials`; attempt 6 returns `429 rate_limited`
      with integer `Retry-After`. Save only statuses, problem codes, and sanitized headers at
      `evidence/phase-7-curl-rate-limit.txt`.
- [ ] [AI] Validate `AUTH_TMP` is nonempty and outside the repository, then remove it with
      `rtk rm -r "$AUTH_TMP"`; stop the backend and run
      `rtk ./hippo run --class transactional --disk-path . -- docker compose -p ose-lms-be-e2e-auth -f apps/ose-lms-be-e2e/docker-compose.yml down -v --remove-orphans`;
      acceptance: raw tokens are gone, all eight redacted evidence files remain, and
      `rtk docker compose -p ose-lms-be-e2e-auth -f apps/ose-lms-be-e2e/docker-compose.yml ps -a`
      lists no container. If any probe fails, preserve only sanitized diagnostics, run the same cleanup,
      fix the earliest responsible phase, and repeat the complete manual sequence with a fresh username.
- [ ] [AI] Run `api-exploratory-tester` with `output-mode: delivery`, this plan path, base URL
      `http://localhost:8303`, the OpenAPI contract, and the Gherkin corpus. Append every defect as an
      unchecked `AET-###` item below; fix and retest every defect. Spec-gap `SG-###` proposals may be
      triaged explicitly. Save the report at `evidence/phase-7-api-exploratory.md`.

### Phase 7 Gate

> All checks below must pass before starting Phase 8.

- [ ] [AI] Unfiltered E2E and static adapter coverage pass; sanitized curl evidence covers every
      operation and negative security journey; every AET defect is fixed and retested.
- [ ] [AI] Specs, OpenAPI, generated models, READMEs, architecture diagrams, ports, and observed
      behavior agree, including the explicit absence of a session/device cap.

> **Pause Safety**: the complete feature is locally hardened and documented with no open tester
> defect. Safe to stop. To resume: rerun
> `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:e2e`
> and inspect `evidence/phase-7-api-exploratory.md`.

---

## Phase 8: Knowledge Capture and Delivery

**Input:** locally hardened feature evidence, execution learnings, and the complete authorized diff.

**Outcome:** learnings reach terminal homes, all gates pass, the PR is delivered, and the plan is
audited and archived without stale worktree state.

**Proof:** learning dispositions, local/CI/API reports, exact-head PR evidence, terminal audit, and
cleanup records.

### Knowledge Capture

- [ ] [AI] Apply the durable-learning, secret/sensitivity, and public-repository relevance gates to
      every `learnings.md` entry; sanitize or discard anything that cannot be safely retained.
- [ ] [AI] Route each survivor to exactly one durable home. Land small non-code governance/docs
      learning inline; route code-homed learning only to a separately authorized idea or report it
      without creating an unauthorized plan.
- [ ] [AI] Record each entry's terminal state (routed, authorized/filed, reported, or discarded) in
      `learnings.md`; if none arose, replace the placeholder with “No generalizable learnings” and a reason.

### Local Quality Gates (Before Push)

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes.
> This follows the root cause orientation principle — proactively fix preexisting errors encountered
> during work.

- [ ] [AI] Run `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t build,typecheck,lint,test:quick,deps:audit -p ose-lms-contracts,ose-lms-be,ose-lms-be-e2e --parallel=1`;
      acceptance: every applicable target exits 0.
- [ ] [AI] Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:test:integration`
      and `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:e2e`;
      acceptance: both exit 0 from clean isolated state.
- [ ] [AI] Run the changed-owner Gherkin implementation review and repository rules quality/test-
      boundary gates; acceptance: no undefined/duplicate/unused binding, invalid exemption, rule drift,
      or unallowlisted network boundary remains.
- [ ] [AI] Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t build,test:quick,lint --parallel=1`;
      acceptance: the transactional affected gate exits 0.
- [ ] [AI] Run the canonical pre-push surface exactly:
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`;
      acceptance: every registry-selected pre-push gate exits 0. Save the sanitized output at
      `evidence/phase-8-pre-push-gates.txt`.
- [ ] [AI] Search the complete diff for secrets, raw tokens, local paths, device-cap behavior, test
      skips/retries/sleeps, broad coverage exclusions, and license drift; acceptance: none remains.

### Completion Audit and Plan Archival (Before Push)

- [ ] [AI] Run `plan-execution-checker` against the complete candidate worktree diff before moving
      this plan. Require a PASS that traces every approved scope item and canonical PRD criterion
      through the as-built files, RED/GREEN/REFACTOR evidence, automated/manual proof, migration
      expand/verify/retain and no-loss evidence, API exploratory dispositions, rollback/recovery, and
      Knowledge Capture. Checked boxes are not proof; reopen the earliest affected phase for any
      missing or contradictory item.
- [ ] [AI] Verify every delivery checkbox through this audit is complete, every AET defect is fixed,
      every plan reference is valid after a folder move, and
      `rtk rg -n 'deviceId|maxDevices|maxConcurrentSessions|evictOldestSession' apps/ose-lms-be apps/ose-lms-be-e2e specs/apps/ose/lms-be`
      returns no device-cap request, configuration, persistence, or behavior.
- [ ] [AI] Run `rtk date +%F` only after the preliminary audit passes and store its output as
      `<completion-date>`. Move the plan and its evidence in the same ready-to-deliver diff with
      `rtk git mv plans/in-progress/lms-user plans/done/<completion-date>__lms-user`; remove the active
      row from `plans/in-progress/README.md`, add the dated row to `plans/done/README.md`, and update
      references to the moved evidence path. Acceptance: `plan validate`, Markdown links, formatting,
      Mermaid, and heading checks pass against the done path before commit.

### Commit and Push Guidelines

- [ ] [AI] Do not stage or commit until the user explicitly authorizes the named change set.
- [ ] [AI] Once authorized, use the fewest build-valid, independently reviewable and revertible
      Conventional Commits, keeping tests/specs/docs/migrations and the archived plan with the one
      complete DU1 behavior they deliver. Do not create a separate feature or archival delivery.
- [ ] [AI] Never extend a commit beyond the authorized LMS authentication scope.
- [ ] [AI] Push the authorized `lms-user` branch and open/update its single PR to `main`; record the
      PR URL and 40-character candidate head SHA in runtime delivery evidence without editing the
      already-archived plan or creating a self-referential/post-push plan-only commit.

### Exact-Head Post-Push Verification

- [ ] [AI] Verify the PR's `Quality gate` from `.github/workflows/pr-quality-gate.yml` runs against
      the exact current head/base and passes; rerun local root-cause diagnostics for any failure and push
      the fix rather than bypassing or retrying it.
- [ ] [AI] Run one authenticated clean current-head `pr-leak-review` and all applicable API surface
      gates; acceptance: the report names the same head SHA and has no unresolved leak.

### Phase 8 Gate

> This is the plan done-boundary. All checks below must pass before merge.

- [ ] [AI] Every learning has a terminal disposition; local/full/affected/API gates pass; exact-head
      PR CI and leak review are green; the ready PR contains the complete deployable feature plus the
      correctly dated archived plan/index state; the diff matches every PRD criterion.

> **Pause Safety**: the single feature PR is green and ready to merge; no second feature or archival
> delivery is needed. Safe to stop. To resume: verify the PR still points at the recorded exact head/base.

---

## Phase 9: Post-Merge Verification and Cleanup

This phase is non-change-producing and is not a second delivery unit. It verifies the delivered DU1
head and removes only already-delivered plan resources.

**Input:** the merged DU1 PR URL, its exact reviewed 40-character head SHA, the archived plan path,
and the registered `worktrees/lms-user/` route.

**Outcome:** `origin/main` contains the reviewed delivery, runtime rule evidence is final, and no
plan-owned worktree or local/remote branch remains.

**Proof:** sanitized command output at `local-tmp/plan/lms-user-phase-9-cleanup.txt`; this runtime
file is not committed after the plan has already been archived.

- [ ] [AI] Resolve `<reviewed-head-sha>` from Phase 8's exact-head evidence, then merge the
      already-green PR with the repository's squash strategy using
      `rtk gh pr merge lms-user --repo wahidyankf/ose-public --squash --match-head-commit <reviewed-head-sha>`.
      Verify with
      `rtk gh pr view lms-user --repo wahidyankf/ose-public --json state,headRefOid,mergeCommit`;
      acceptance: state is `MERGED`, `headRefOid` equals the reviewed SHA, and `mergeCommit` is
      populated. Save the sanitized result in the Phase 9 proof file. If merge exits nonzero or the
      head differs, do not use `--admin`, retry, or bypass a gate; return to Phase 8, reconcile the
      current head and preconditions, and rerun exact-head verification. Do not edit or push a
      second plan-only commit.
- [ ] [AI] Verify the merged PR links the exact reviewed candidate to a commit on `origin/main`, then
      rerun the terminal execution check against that delivered state. Resolve `<reviewed-head-sha>`
      from Phase 8 and `<merge-commit-sha>` from the preceding `mergeCommit.oid`; acceptance: the PR
      `headRefOid` equals `<reviewed-head-sha>`, `rtk git fetch origin main` exits 0, and
      `rtk git merge-base --is-ancestor <merge-commit-sha> origin/main` exits 0. The execution-check
      result must remain PASS against the same feature evidence. A missing value or mismatch halts
      cleanup instead of creating another tracked plan-only change. Do not test the reviewed branch
      head itself as an ancestor after a squash merge because the squash creates a different commit.
- [ ] [AI] Update the untracked rules-propagation runtime manifest with `final-status: landed`, the
      merged PR URL/head, and the already-resolved `sibling-obligation: none`; acceptance: the
      manifest describes the actual delivery and no repository-tracked file changes.
- [ ] [AI] Classify every Delivery Branch Inventory row as delivered, unused, or retained/escalated,
      in runtime cleanup evidence, with proof; ambiguous rows block cleanup and are not deleted.
- [ ] [AI] From the repository root, run the mandatory pre-removal checks and then
      `rtk git worktree remove worktrees/lms-user` without force; acceptance: the clean delivered
      worktree is removed safely.
- [ ] [AI] Follow the
      [branch-cleanup runbook](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md).
      From the repository root run `rtk git branch -d lms-user`; if the PR used squash merge and
      Git declines, use only the runbook's patch-equivalence proof before its documented fallback.
      If `rtk git ls-remote --exit-code --heads origin lms-user` finds the plan-pushed remote branch,
      run `rtk git push origin --delete lms-user`; otherwise record that remote deletion is
      inapplicable. Finally run `rtk git worktree prune`.
- [ ] [AI] Capture `rtk git worktree list --porcelain`, `rtk git branch --list lms-user`, and
      `rtk git ls-remote --heads origin lms-user` in the Phase 9 proof file; acceptance: the worktree
      route is absent and both branch commands return no branch entry.

### Phase 9 Gate

- [ ] [AI] The merged PR identifies the exact reviewed head and its squash merge commit is present on
      `origin/main`; the terminal execution check remains PASS, the rules manifest records the real
      landed PR, and the clean worktree/branch cleanup is complete without a second delivery.

> **Pause Safety**: DU1 is merged and all plan-owned runtime resources are reconciled. The plan has
> reached its terminal state.
