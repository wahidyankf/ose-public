# Delivery — OSE ID Init 02 Local Email Account

> **Legend:** `[AI]` executes repository work. `[HUMAN]` is only for unavoidable privileged or
> out-of-band work. `[AI+HUMAN]` prepares evidence for a human action. This local plan has no planned
> human-only dependency.

## Lifecycle and Dependency Prerequisites

Do not implement from backlog. Plan 01 must first be delivered, terminal-audited, archived, and visible
on `origin/main`. Then land a separate pure move of this folder to
`plans/in-progress/ose-id-init-02-local-email-account/` with only plan-index edits. Confirm both facts on
`origin/main` before Phase 0. If Plan 01's delivered contracts differ from this plan, amend and revalidate
this plan before implementation.

## Worktree

Worktree path: `worktrees/ose-id-init-02-local-email-account/`

Provisioning status: pending. This plan is authored in the user-required `worktrees/ose-id/` split-plan
worktree; Phase 0 must provision/enter the matching execution worktree from current `origin/main`.
Implementation in the authoring worktree is forbidden. Record execution identity only after provisioning.

At Phase 0, run this canonical provisioning command from the primary repository root:

```bash
rtk git worktree add -b ose-id-init-02-local-email-account-base worktrees/ose-id-init-02-local-email-account origin/main
```

If the branch already exists, run
`rtk git worktree add worktrees/ose-id-init-02-local-email-account ose-id-init-02-local-email-account-base`.
If the command exits non-zero, run `rtk git worktree prune` once, retry once, then inspect
`rtk git worktree list --porcelain` and `rtk git branch --list
'ose-id-init-02-local-email-account*'`. Enter and reconcile the declared route when it already exists;
retain any partial path or branch and run the worktree recovery classifier. If no artifact exists,
preserve the sanitized failure and stop. Never force-delete, implement in `worktrees/ose-id/`, or create
a second plan worktree.

## Delivery Mode: worktree-to-pr

One implementation PR targets `main`. Exact-head/base `pr-quality-gate.yml`, clean current-head
`pr-leak-review`, the repository-required semantic review for identity/security code, and applicable
API/E2E gates are mandatory. `[AI]` merges only after the hardened checks pass.

## Parallelization Model

Use **N=3 workers plus one orchestrator**. Phase 0–1 and account-schema migration ownership are serial.
After contracts land: one C# worker owns Person/email/password use cases, one C# worker owns session/
rate-limit/application security without editing migrations, and one E2E worker owns Mailpit/lifecycle
tests. The orchestrator alone reconciles migrations, shared dependency injection, generated contracts,
registry files, and gates. All agents share one worktree, preserve others' edits, and stop at gates.

### Delivery Boundaries

| Phase(s) | Natural cohesive seam               | Worktree                                        | Branch                                    | Delivery opportunity | Exact resulting `main` / rollback / feature-flag evidence                                                                                                                                                                           |
| -------- | ----------------------------------- | ----------------------------------------------- | ----------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | Setup and predecessor baseline      | `worktrees/ose-id-init-02-local-email-account/` | `ose-id-init-02-local-email-account-base` | none                 | No `main` change; dependency, version, port, and baseline evidence prove setup only.                                                                                                                                                |
| 1–7      | Complete local credential lifecycle | `worktrees/ose-id-init-02-local-email-account/` | `ose-id-init-02-local-email-account-base` | PR at Phase 7        | Verified email/password registration, recovery, shared sessions, Mailpit lifecycle, and inherited non-local startup rejection land together; revert retains additive rows/migrations but removes routes. No temporary flag applies. |
| 8        | Post-merge audit and cleanup        | —                                               | —                                         | none                 | `origin/main` remains the verified merge; terminal audit evidence and worktree removal change no product state.                                                                                                                     |

This credential lifecycle is one natural seam. Splitting verification from recovery and session
invalidation would leave unsafe account states; UI, OIDC, and company tenancy remain later seams.

### Phase-Local Execution Defaults

Every checkbox and phase gate below inherits its phase row unless it supplies a stricter field. Each
completion therefore has an owner, bounded path, copyable command, observable result, evidence
destination, and failure route.

| Phase | Default owner                                                       | Bounded implementation paths                                                                | Copyable HIPPO/Nx verification                                                                                                                                                                                                                                                                                                                                                       | Required observation and evidence                                                                                                                        | Failure route                                                                                                                |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 0     | Orchestrator                                                        | repository root, execution worktree, `local-tmp/ose-id-init-02-*`                           | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`                                                                                                                                                                                                          | Exit 0 and predecessor SHA/API/schema/ports/dependency/license baselines under `plans/in-progress/ose-id-init-02-local-email-account/evidence/phase-0/`. | Preserve sanitized output and stop in Phase 0; amend for predecessor or toolchain drift.                                     |
| 1     | Orchestrator; `specs-maker` for structure                           | `specs/apps/ose/id-be/**`, `apps/ose-id-be{,-e2e}/**/behaviour-coverage.json`               | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate` followed by `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e`                                                                 | Contract/threat/schema validation passes and only named new account bindings remain RED under `evidence/phase-1/`.                                       | Reopen the first spec/contract checkbox; no unrelated undefined binding may pass the gate.                                   |
| 2     | `swe-csharp-dev`; orchestrator owns migrations/generated contracts  | `apps/ose-id-be/**`, `apps/ose-id-be-e2e/**`, `specs/apps/ose/id-be/**`                     | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:build` then `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-id-be,ose-id-be-e2e`; run applicable Integration on `ose-id-be` and E2E on `ose-id-be-e2e` separately | Ordered registration/verification/abuse RED, GREEN, and REFACTOR outputs under `evidence/phase-2/{red,green,refactor}/`.                                 | Return to the failing TDD checkbox; preserve sanitized output and never relax enumeration/rate/security assertions.          |
| 3     | `swe-csharp-dev`; E2E worker owns Mailpit lifecycle                 | notification adapter and runner/tests under `apps/ose-id-be/**` and `apps/ose-id-be-e2e/**` | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e`                                                                                                                                                                                                                                                          | Mailpit capture, generic failure, restart, duplicate suppression, and cleanup pass twice under `evidence/phase-3/`.                                      | Reopen notification or runner ownership at the first failed observation; retain no raw message/capability evidence.          |
| 4     | `swe-csharp-dev`; E2E worker owns instance-handoff proof            | account/session/recovery code and tests under `apps/ose-id-be/**`, `apps/ose-id-be-e2e/**`  | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:quick,test:integration,test:e2e --projects=ose-id-be,ose-id-be-e2e`                                                                                                                                                                                                 | Sign-in/recovery/session rotation/revocation/two-instance/redaction cycles pass twice under `evidence/phase-4/`.                                         | Reopen the first failed RED/GREEN/REFACTOR checkbox; session/capability leakage blocks progression.                          |
| 5     | Orchestrator and `.claude/agents/general/api-exploratory-tester.md` | delivered backend/spec/doc/rule paths only                                                  | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`                                                                                                                                                                                                                                    | Manual HTTP matrix, rules manifest, API gate PASS, cleanup, and no-UI proof under `evidence/phase-5/`.                                                   | Route API defects to the API subsection and rule drift to its first rule checkbox; reopen the earliest implementation phase. |
| 6     | Orchestrator                                                        | plan evidence, learnings, indexes, archive move                                             | `rtk apps/rhino-cli/scripts/rhino-bin.sh plan validate` followed by `rtk apps/rhino-cli/scripts/rhino-bin.sh md links validate plans`                                                                                                                                                                                                                                                | Preliminary audit and archive/index proof under `evidence/phase-6/`; commit only after user authorization.                                               | Reopen the first unsupported claim; no archival with partial API/evidence status.                                            |
| 7     | Orchestrator                                                        | complete `origin/main...HEAD` delivery diff                                                 | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick,test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`                                                                                                                                                        | Exact-head local/CI/leak/semantic-review evidence under `evidence/phase-7/`.                                                                             | Any repair changes HEAD and restarts Phase 7 from the first gate.                                                            |
| 8     | Orchestrator                                                        | merged archive state, delivery branch, declared worktree                                    | `rtk git merge-base --is-ancestor <merge-sha> origin/main` followed by `rtk git worktree list --porcelain`                                                                                                                                                                                                                                                                           | Terminal PASS, containment, branch classification, and non-force cleanup in the external final report.                                                   | Retain worktree/branch and reopen the failing phase; never force cleanup.                                                    |

### PostgreSQL Persistence Contract

Every account, email, capability, audit, abuse-control, recovery, and session row written by this
plan uses Npgsql connections/transactions through SqlKata's PostgreSQL compiler and
`SqlKata.Execution`. Repositories require explicit projections, bound parameters, cancellation
tokens, bounded command timeouts, and explicit transactions for multi-write invariants; production
runtime paths forbid EF change tracking, LINQ-to-database, and `SELECT *`. EF Core stays migration
tooling only. ASP.NET Core Identity is limited to supported hashing and credential-validation
primitives—never Identity EF stores or `UserManager` persistence. The Phase 2 and Phase 4 gates run
`ose-id-be:test:unit`, `ose-id-be:test:integration`, and `ose-id-be-e2e:test:e2e` through HIPPO and
store compiled-SQL snapshots/contracts, redacted parameter-shape proof, catalog/index rows,
synthetic-fixture `EXPLAIN` plans, query counts, and bounded returned-row counts under each phase's
`evidence/*-persistence/`; `EXPLAIN ANALYZE` is permitted only for isolated safe synthetic fixtures.
Any interpolation, missing timeout/cancellation/transaction, table-wide projection, unbounded/N+1
plan, Identity persistence, or EF runtime query reopens its owning TDD packet.

### Mandatory Nx Quality Matrix

The full green matrix below is mandatory as the completion gate of the first implementation phase
(Phase 2) and for every later implementation, final local-quality, exact-head delivery/PR, and
post-merge gate. It is not a Phase 0 or Phase 1 success criterion. Before creating any Plan 02
scenario, binding, or test, Phase 0 and Phase 1 each run this exact predecessor-green baseline:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:build
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-id-be,ose-id-be-e2e
```

Then run the static predecessor behavior baseline:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e
```

Phase 0 inspects `apps/ose-id-be/project.json`, `apps/ose-id-be-e2e/project.json`, the resolved
`.csproj`/`Directory.Build.props`, and the E2E TypeScript configuration before trusting the matrix.
The backend requires `<Nullable>enable</Nullable>`; its Nx `typecheck` runs the .NET compiler with
`/p:TreatWarningsAsErrors=true`, while Nx `lint` runs Roslyn analyzer verification plus
`dotnet format --verify-no-changes`.
The TypeScript E2E project's typecheck runs `tsc --noEmit` and its lint target is a real repository-
standard linter; it intentionally has no `build` target because it produces no deployable artifact.
Echo, no-op, success-sentinel, and duplicate aliases fail the gate. Each Phase 2-and-later matrix gate
writes exit codes and target-definition proof to its phase evidence destination as `nx-quality.txt`;
any failure reopens that gate and blocks progression. Phase 1 records the green predecessor baseline
first, then runs only its explicitly named static-coverage and RED commands. A nonzero result is
nonblocking only when its recorded RED ledger names the missing Plan 02 behavior; any baseline,
target/configuration, or unrelated failure blocks Phase 2.

## Phase 0: Environment, Dependency, and Baseline

**Input:** Plan 01 completion on `origin/main` and promoted in-progress Plan 02.
**Outcome:** matching worktree, verified inherited contracts, versions/licenses, and green baseline.
**Proof:** `evidence/phase-0/` dependency and command records.

- [ ] [AI] Fetch, inspect `origin/main`, Plan 01 done folder/evidence, project READMEs, schema, runner,
      health, ports, and runtime guard. Provision/enter `worktrees/ose-id-init-02-local-email-account/`
      from current `origin/main`; record exact worktree/branch identity. Stop if Plan 01 is incomplete or
      another Plan 02 worktree exists.
- [ ] [AI] Run `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` and
      `rtk npm run doctor -- --fix` (the wrapper admits Doctor transactionally through HIPPO); inspect
      `rtk git status --short`; acceptance: tools converge without
      secrets or unexplained changes.
- [ ] [AI] Inspect current Identity, migration, API/spec, session/cookie, rate-limit, SMTP, and E2E
      conventions using `rtk rg` under `apps/`, `specs/`, `docs/`, and `repo-governance/`. Resolve exact
      paths/targets before editing; record any contradiction that requires plan amendment.
- [ ] [AI] Resolve exact ASP.NET Core Identity and Mailpit versions and official licenses/config flags.
      Acceptance: OSE source/docs remain under root MIT; each dependency retains its license/notice;
      Mailpit supports loopback SMTP/inbox/API with relay disabled. Verify inherited 3500/8501/5438 and
      `OSE_ID_MAILPIT_SMTP_PORT=1026`/`OSE_ID_MAILPIT_UI_PORT=8026` are unclaimed in the registry and live
      host. Stop and amend on collision or incompatible terms; do not silently renumber.
- [ ] [AI] Run Plan 01's documented four-project and full-stack baselines twice through HIPPO. Acceptance:
      all pass, production modes fail closed, and no resources survive. Fix baseline failures at root cause.

### Phase 0 Gate

- [ ] [AI] Re-run the Plan 01 smoke/E2E target and repository affected baseline; acceptance: exit 0,
      clean resource inventory, and dependency/license record complete.

> **Pause Safety:** no account migration/code exists and the delivered foundation is verified. Safe to
> stop. To resume, rerun the Plan 01 smoke target.

---

## Phase 1: Specs, API Contract, and Threat Model (RED)

**Input:** AC-ACC-01..10 and delivered API/spec patterns.
**Outcome:** canonical behavior and abuse cases exist before account adapters.
**Proof:** valid specs/OpenAPI and a static RED binding ledger containing only new behavior.

- [ ] [AI] **Owner: `specs-maker`; account feature structure.** Extend the owner-based
      `specs/apps/ose/id-be/` corpus, using an `account/` behavior subfolder
      where useful, with `.feature` files for AC-ACC-01..10, including concurrency, unknown/known
      equivalence, disabled UI/protocol/company routes, and cleanup. Do not create an `id-account/`
      deployed-surface owner. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate`;
      acceptance: exit 0, owner structure is valid, scenario titles are unique and app-scoped, and no
      positive layer or plan tag enters Gherkin. Save the command, exit, and feature inventory at
      `evidence/phase-1/specs.txt`; any parser/ownership/title finding returns to this checkbox.
- [ ] [AI] **Owner: backend contract lane; account OpenAPI.** Apply every ADD/UPDATE/DELETE/RETAIN
      operation, exact schema, body limit, cookie/CSRF rule,
      generic response, no-store header, stable safe error, idempotency/concurrency/rate limit, and
      forbidden field in `tech-docs/007-api-contract-delta.md` to the versioned account OpenAPI beside
      the specs at `specs/apps/ose/id-be/contracts/account.openapi.yaml`, composed by
      `specs/apps/ose/id-be/contracts/openapi.yaml`. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec redocly -- lint specs/apps/ose/id-be/contracts/openapi.yaml specs/apps/ose/id-be/contracts/account.openapi.yaml`;
      acceptance: exit 0, every indexed method/path has its exact schema/status/header/security contract,
      operation IDs are app/domain-scoped, and neither file contains a plan ID. Save the transcript and
      semantic operation diff at `evidence/phase-1/openapi.txt`; any missing/extra operation or schema
      drift returns to this checkbox.
- [ ] [AI] **Owner: security architecture lane; account threat matrix.** Add/update the threat-model
      sections in `tech-docs/002-email-capabilities-and-password-security.md` and
      `tech-docs/003-sessions-statelessness-and-local-verification.md` for enumeration, credential stuffing, hashing, capability
      theft/replay/race, session fixation/theft, CSRF, log leakage, SMTP exfiltration, instance divergence,
      and overprivileged database access. Map each threat to a PRD criterion and exact Unit,
      Integration, E2E, or manual proof. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec prettier -- --check plans/in-progress/ose-id-init-02-local-email-account/tech-docs/002-email-capabilities-and-password-security.md plans/in-progress/ose-id-init-02-local-email-account/tech-docs/003-sessions-statelessness-and-local-verification.md`;
      acceptance: exit 0 and every named threat has one mitigation, owner, detection proof, and failure
      response. Save the reviewed matrix at `evidence/phase-1/threat-model.md`; any unmapped threat returns
      to this checkbox before adapter work.
- [ ] [AI] **Owner: test integrator; initial RED binding ledger.** Run
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e`
      and save only newly undefined adapter lines at `evidence/phase-1/red-bindings.txt`. Acceptance:
      duplicates, ambiguous/unused bindings, invalid exemptions, and unrelated undefined steps are zero;
      any such finding returns to the owning specs checkbox, while only named account bindings continue RED.
- [ ] [AI] **Owner: test integrator; account adapter maps.** Apply
      `tech-docs/006-bdd-spec-delta-and-adapter-map.md` to
      `apps/ose-id-be/behaviour-coverage.json` and `apps/ose-id-be-e2e/behaviour-coverage.json` while
      retaining every foundation mapping. Bind all ten account scenarios at Unit, Integration, and E2E;
      encode no blanket exemption. Rerun
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e`;
      acceptance: exit 0 and the recursive corpus plus exactly-one adapters close with no orphan,
      duplicate, ambiguous, unused, or invalid-exemption row. Save the transcript and adapter inventory at
      `evidence/phase-1/adapter-map.txt`; any failure returns to its exact feature or coverage-map row.

### Phase 1 Gate

- [ ] [AI] Verify `evidence/phase-1/` contains the immediately preceding green predecessor baseline and
      its command/target records before the first Plan 02 scenario, binding, or test. Inspect the isolated
      RED ledger: only named absent Plan 02 behavior may be nonzero; a baseline, target/configuration, or
      unrelated failure blocks Phase 2. Do not require the full green matrix until Phase 2 completes.
- [ ] [AI] **Owner: Phase 1 integrator; contract gate.** Rerun the exact specs, Redocly, threat-doc
      Prettier, and two-project behavior-coverage commands above, then run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh md mermaid validate plans/in-progress/ose-id-init-02-local-email-account specs/apps/ose/id-be`.
      Acceptance: every command exits 0, the API inventory equals `tech-docs/007-api-contract-delta.md`,
      and `evidence/phase-1/specs.txt`, `evidence/phase-1/openapi.txt`,
      `evidence/phase-1/threat-model.md`, `evidence/phase-1/adapter-map.txt`, plus the resolved RED ledger
      are current. Save the combined result at `evidence/phase-1/gate.txt`; any mismatch reopens its first
      owning checkbox and blocks Phase 2.

> **Pause Safety:** security behavior is reviewable and production code is unchanged. Safe to stop. To
> resume, rerun static coverage against the ledger.

---

## Phase 2: Person, Email, Password, and Verification

**Input:** AC-ACC-01..04/10, account contract, and migration role.
**Outcome:** companyless pending Person registration and atomic email verification work locally.
**Proof:** Unit/Integration/backend-E2E RED→GREEN→REFACTOR evidence.

### AC-ACC-01 and AC-ACC-02 — Registration and verification

- [ ] [AI] **RED:** add domain/application tests under the Phase 0-confirmed `apps/ose-id-be/` test paths
      for immutable Person ID, zero-company account, normalized active-email uniqueness, pending state,
      typed verification notification, expiry, purpose binding, single use, concurrent consumption,
      compiled-SQL snapshots, explicit projection/parameter/timeout/cancellation shapes, and bounded
      query counts/rows.
      Run backend `test:quick`; acceptance: only missing account behavior fails. Save RED output.
- [ ] [AI] **GREEN:** add additive Person/email/password/capability/audit migrations and SqlKata/Npgsql
      application repositories/use cases. Use only ASP.NET Core Identity hashing and validation
      primitives behind infrastructure—never its EF stores or `UserManager` persistence. The migration pair under
      `apps/ose-id-be/src/OseId.Infrastructure/Persistence/Migrations/` must implement every physical
      column/type/null/default/PK/FK/check/index/owner/grant in `tech-docs/005-physical-schema-and-migration-contract.md`.
      Every new and inherited table must have all six audit columns, actor/time constraints, a named
      hard-delete guard, only `ON DELETE RESTRICT`, and no runtime `DELETE` grant. Rerun Unit/Integration;
      acceptance: states/invariants pass and the app role cannot perform DDL or physical deletion.
- [ ] [AI] **GREEN:** implement validated account registration/resend/verification endpoints and mapping
      in `apps/ose-id-be/`. Rerun API tests; acceptance: generic responses, no-store headers, body limits,
      CSRF/capability semantics, and absent company creation match the contract.
- [ ] [AI] **REFACTOR:** centralize normalization/result mapping without exposing Identity, Npgsql, or
      SqlKata types; prove no EF runtime query/change-tracking path exists. Run backend
      build/typecheck/lint/Unit/Integration; acceptance: green with no custom password hashing/token crypto.
- [ ] [AI] Produce `evidence/phase-2-schema/` old/new catalog manifests and per-table stable counts/digests;
      record no-backfill/no-contract, Plan-01-code/new-schema compatibility, new-code/old-schema
      fail-closed readiness, retained-schema rollback, and forward-fix proof. Acceptance: no source row is
      lost/transformed and every physical contract row matches PostgreSQL catalogs. The manifest must
      enumerate all tables and prove each audit column/default/nullability, guard trigger, FK action,
      active-row query/index disposition, and runtime grant; omissions fail the phase.

### AC-ACC-04 — Enumeration and abuse controls

- [ ] [AI] **RED:** add known/unknown/pending/verified/suspended response/log/rate-limit comparisons and
      concurrent duplicate-registration cases. Run focused tests; acceptance: fail on missing shared controls.
- [ ] [AI] **GREEN:** implement PostgreSQL-backed rate/attempt policy and generic result mapping; rerun
      focused tests through two instances. Acceptance: public schemas/statuses do not disclose state.
- [ ] [AI] **REFACTOR:** remove raw email from metric labels/audit where opaque identifiers suffice; scan
      focused logs and rerun regression. Acceptance: behavior remains green and redaction scan passes.

### Phase 2 Gate

- [ ] [AI] Run backend build/typecheck/lint/Unit/Integration plus fresh-migration E2E; acceptance: AC-ACC-01/02/04
      pass, application role stays least-privileged, compiled SQL/catalog/synthetic-plan/row-bound
      evidence in `evidence/phase-2-persistence/` satisfies the PostgreSQL Persistence Contract, and
      foundation behavior is unchanged.

> **Pause Safety:** pending/verified account data exists locally but sign-in/recovery routes are absent;
> non-local startup remains blocked. Safe to stop. To resume, rerun fresh-migration account E2E.

---

## Phase 3: Notification Adapter and Mailpit Lifecycle

**Input:** typed notification port and Plan 01 runner.
**Outcome:** verification/recovery notifications are deterministically captured Local/Test only.
**Proof:** adapter Unit tests, real SMTP/Mailpit E2E, non-local rejection, and cleanup evidence.

### AC-ACC-08 — Local email capture

- [ ] [AI] **RED:** add tests for typed template mapping, SMTP failure, loopback validation, relay absence,
      unique-recipient message selection, message cleanup, and Staging/Production adapter rejection. Run
      focused Unit/E2E; acceptance: fail because Mailpit adapter/lifecycle is absent.
- [ ] [AI] **GREEN:** implement `INotificationSender` SMTP adapter in `apps/ose-id-be/` and extend the
      owning E2E runner with pinned Mailpit SMTP 1026 and inbox/API 8026, readiness, no relay, synthetic `.test`
      recipients, and reverse cleanup. Rerun focused tests; acceptance: one expected message is observable.
- [ ] [AI] **REFACTOR:** isolate transport/template/config from account use cases and run backend plus
      lifecycle regression twice. Acceptance: no real network destination, stale message, or resource remains.

### Phase 3 Gate

- [ ] [AI] Run register→Mailpit→verify twice from fresh stacks and scan inventory; acceptance: deterministic
      message content contract, non-local rejection, and empty cleanup all pass.

> **Pause Safety:** local verification email works; no production adapter or UI exists. Safe to stop. To
> resume, rerun the focused Mailpit E2E target.

---

## Phase 4: Sign-In, Recovery, and Stateless Sessions

**Input:** verified account, AC-ACC-03/05/06/07/09/10.
**Outcome:** secure password authentication, recovery, and opaque server sessions work across instances.
**Proof:** focused RED/GREEN/REFACTOR plus two-instance and secret-scan E2E.

### AC-ACC-03 and AC-ACC-06 — Sign-in/session lifecycle

- [ ] [AI] **RED:** add tests for pending/active/suspended states, wrong/correct password, lockout, opaque
      cookie attributes, fixation rotation, current-account, list/revoke/sign-out, expiry, CSRF, and
      idempotent revocation, plus compiled-SQL/query-count/row-bound contracts. Run backend tests;
      acceptance: missing session behavior and unsafe query shapes fail.
- [ ] [AI] **GREEN:** implement password verification through ASP.NET Core Identity hashing/validation
      primitives plus SqlKata/Npgsql-backed session/security-version records and endpoints; do not use
      Identity EF stores or `UserManager` persistence. Rerun tests; acceptance: only verified active accounts
      create sessions and revoked/expired cookies fail on either instance.
- [ ] [AI] **REFACTOR:** separate cookie transport, session policy, and application commands; run backend
      build/typecheck/lint/Unit/Integration/E2E. Acceptance: no JWT/OIDC/client token exists.

### AC-ACC-05 — Recovery and security consequences

- [ ] [AI] **RED:** add recovery known/unknown equivalence, purpose/expiry/single-use/concurrency, password
      policy, prior-password failure, and all-prior-session revocation tests. Run focused targets and save RED.
- [ ] [AI] **GREEN:** implement recovery request/reset using notification/capability ports and atomic
      security-version/session changes. Rerun focused tests; acceptance: one reset succeeds and old
      password/sessions fail consistently.
- [ ] [AI] **REFACTOR:** consolidate capability consumption without merging purposes and rerun verification
      plus recovery suites. Acceptance: separate purpose/audit semantics remain explicit.

### AC-ACC-10 — Auditable account cleanup

- [ ] [AI] **RED:** add Unit query-snapshot tests for explicit tombstone predicates and actor stamping;
      Integration tests for all account-table audit columns/constraints/triggers/grants plus a real failed
      `DELETE`; and backend E2E for retiring an expired terminal capability. Acceptance: each layer fails
      only because the audit/soft-delete behavior is absent; no exemption is permitted.
- [ ] [AI] **GREEN:** implement bounded cleanup as an `UPDATE` that stamps `deleted_at`, `deleted_by`,
      `updated_at`, and `updated_by` atomically, advances concurrency, and makes the capability digest
      unusable. The runtime role remains unable to delete. Rerun all three layers; acceptance: active
      lookup excludes the tombstone and an authorized audit probe retains safe attribution.
- [ ] [AI] **REFACTOR:** centralize the audited-mutation/query fragments without a generic repository,
      inspect compiled SQL for forbidden `DELETE`/missing tombstone predicates, and rerun fresh/current
      migration plus two-instance cleanup. Acceptance: no security identifier is reused and no row is lost.

### AC-ACC-07 and AC-ACC-09 — Instance handoff and redaction

- [ ] [AI] **RED:** extend E2E to start on A and complete on B for registration, verification, sign-in,
      recovery, and revocation; add response/log/evidence forbidden-pattern scan. Run and observe missing proof.
- [ ] [AI] **GREEN:** move any discovered correctness state to PostgreSQL/shared key provider and correct
      redaction. Rerun with one instance stopped at each boundary; acceptance: outcomes remain consistent.
- [ ] [AI] **REFACTOR:** remove affinity/test bypasses and run the complete suite twice; acceptance: no
      plaintext password/hash/capability/cookie/SMTP body/connection secret is retained.

### Phase 4 Gate

- [ ] [AI] Run all account journeys through alternating instances twice; acceptance: AC-ACC-03/05/06/07/09/10
      pass, `evidence/phase-4-persistence/` proves bounded parameterized session/recovery queries with no
      N+1 or EF/Identity persistence path, no retry/sleep exists, and resource/evidence secret scans are clean.

> **Pause Safety:** backend-only local account lifecycle is complete and production remains blocked. Safe
> to stop. To resume, rerun the full account E2E target.

---

## Phase 5: Rules, Documentation, and Manual API Verification

**Input:** complete account behavior and actual target/port/contract impact.
**Outcome:** repository declarations and operator docs match the delivered local behavior.
**Proof:** rules manifest, valid docs/contracts, sanitized manual evidence.

- [ ] [AI] Inventory actual rule impacts for Mailpit ports, E2E network ownership, new specs/API, targets,
      secrets/env, and project docs across all canonical/enforcement/binding surfaces. Save intake under
      `local-tmp/rules-propagation/ose-id-init-02-intake.md`; classify duplicates/conflicts before editing.
- [ ] [AI] Apply the narrow canonical changes, enforcement dispositions, and generated binding sync only
      where inventory proves necessary. Run rules-quality, repo-config, port/env, dependency/test-boundary,
      specs/contract, and binding-sync gates; save `final-status: partial` manifest pending delivery.
- [ ] [AI] Update affected project/spec/reference READMEs with API purposes, local-only warning, Mailpit
      commands, session semantics, forbidden evidence, migration/rollback, and no-company invariant. Run
      Markdown lint/heading/link/Mermaid gates; acceptance: all pass.
- [ ] [AI] Execute `tech-docs/003-sessions-statelessness-and-local-verification.md` manually using an
      ignored cookie jar. Save sanitized status/header/audit/resource proof under `evidence/manual/`, then
      delete raw capabilities/cookies/messages/logs. Acceptance: all ten PRD criteria are observed.
- [ ] [AI] **Owner: security evidence lane; plan-only repository and evidence scan.** From the execution
      worktree, run
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`
      and `rtk git diff --check origin/main...HEAD`, then review the gate's changed-file and leak predicates
      against `apps/ose-id-be/`, `apps/ose-id-be-e2e/`, `specs/apps/ose/id-be/`, and this plan's sanitized
      `evidence/`. Record only file names, predicate IDs, and pass/fail dispositions at
      `evidence/phase-5/repository-and-evidence-scan.md`; do not copy matched credential or message values.
      Acceptance: both commands exit 0, no tracked source/config/contract/schema/generated artifact or
      sanitized evidence contains a real secret, raw synthetic credential, cookie, capability, SMTP body,
      or connection value, and the record states that this repository-shape proof is plan-only rather than
      product Gherkin. Any hit blocks Phase 5, deletes unsafe ignored evidence, and reopens the artifact's
      earliest producing checkbox.

### Copyable HTTP Verification

The E2E worker owns fixture creation and cleanup; the orchestrator owns this manual run. Before Phase 5,
`apps/ose-id-be-e2e/project.json` must expose `serve`, `fixture:seed`, and `fixture:destroy`. Start
`serve -- --fixture-profile=account-manual`, then seed disposable synthetic accounts. The seed target
writes mode-0600 `fixture.env` and `manifest.json` only under the requested ignored directory; it must
not print their values. `fixture.env` defines `OSE_ACC_NEW_EMAIL`, `OSE_ACC_UNVERIFIED_EMAIL`,
`OSE_ACC_VERIFIED_EMAIL`, `OSE_ACC_PASSWORD`, `OSE_ACC_VERIFICATION_CAPABILITY`, `OSE_ACC_RECOVERY_CAPABILITY`,
`OSE_ACC_READ_COOKIE_JAR`, `OSE_ACC_CURRENT_COOKIE_JAR`, `OSE_ACC_CURRENT_CSRF`,
`OSE_ACC_OTHER_COOKIE_JAR`, `OSE_ACC_OTHER_CSRF`, and `OSE_ACC_OTHER_SESSION_ID`. All values are
synthetic, local-only, and destroyed after the run.

Terminal A:

```bash
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=account-manual
```

Terminal B setup and assertion helpers:

```bash
set -eu
OSE_ACC_VERIFY_DIR="local-tmp/ose-id-init-02-http"
OSE_ACC_EVIDENCE="plans/in-progress/ose-id-init-02-local-email-account/evidence/phase-5/manual-http-matrix.txt"
rtk mkdir -p "$OSE_ACC_VERIFY_DIR" "$(dirname "$OSE_ACC_EVIDENCE")"
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:fixture:seed -- --fixture-profile=account-manual --output="$OSE_ACC_VERIFY_DIR"
set -a
. "$OSE_ACC_VERIFY_DIR/fixture.env"
set +a
: > "$OSE_ACC_EVIDENCE"

account_probe() {
  OSE_ACC_LABEL="$1"
  OSE_ACC_METHOD="$2"
  OSE_ACC_PATH="$3"
  OSE_ACC_EXPECTED_STATUS="$4"
  OSE_ACC_EXPECTED_MEDIA="$5"
  OSE_ACC_EXPECTED_FIELD="$6"
  OSE_ACC_EXPECTED_VALUE="$7"
  shift 7
  OSE_ACC_HEADERS="$OSE_ACC_VERIFY_DIR/$OSE_ACC_LABEL.headers"
  OSE_ACC_BODY="$OSE_ACC_VERIFY_DIR/$OSE_ACC_LABEL.body"
  OSE_ACC_STATUS="$(rtk curl --silent --show-error --request "$OSE_ACC_METHOD" --dump-header "$OSE_ACC_HEADERS" --output "$OSE_ACC_BODY" --write-out '%{http_code}' "$@" "http://127.0.0.1:8501$OSE_ACC_PATH")"
  test "$OSE_ACC_STATUS" = "$OSE_ACC_EXPECTED_STATUS"
  rtk rg -q '^Cache-Control: no-store' "$OSE_ACC_HEADERS"
  rtk rg -q '^X-Correlation-ID:' "$OSE_ACC_HEADERS"
  if test "$OSE_ACC_EXPECTED_MEDIA" = "none"; then
    test ! -s "$OSE_ACC_BODY"
  else
    rtk rg -q "^Content-Type: $OSE_ACC_EXPECTED_MEDIA" "$OSE_ACC_HEADERS"
    rtk node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const value=x[process.argv[2]];const expected=process.argv[3];if(expected==="[array]"?!Array.isArray(value):String(value)!==expected)process.exit(1)' "$OSE_ACC_BODY" "$OSE_ACC_EXPECTED_FIELD" "$OSE_ACC_EXPECTED_VALUE"
  fi
  rtk awk -v label="$OSE_ACC_LABEL" -v method="$OSE_ACC_METHOD" -v path="$OSE_ACC_PATH" -v status="$OSE_ACC_STATUS" 'BEGIN { print label " " method " " path " status=" status " headers=validated body=validated" }' >> "$OSE_ACC_EVIDENCE"
}
```

Run the public registration, verification, sign-in, and current-account probes:

```bash
account_probe registration-success POST /api/v1/accounts/registrations 202 application/json status accepted --header 'Content-Type: application/json' --data "{\"email\":\"$OSE_ACC_NEW_EMAIL\",\"password\":\"$OSE_ACC_PASSWORD\"}"
account_probe registration-error POST /api/v1/accounts/registrations 400 application/problem+json code invalid_request --header 'Content-Type: application/json' --data '{"email":"not-an-email","password":"short"}'
account_probe verification-request-success POST /api/v1/accounts/email-verification-requests 202 application/json accepted true --header 'Content-Type: application/json' --data "{\"email\":\"$OSE_ACC_UNVERIFIED_EMAIL\"}"
account_probe verification-request-error POST /api/v1/accounts/email-verification-requests 400 application/problem+json code invalid_request --header 'Content-Type: application/json' --data '{"email":"not-an-email"}'
account_probe verification-success POST /api/v1/accounts/email-verifications 204 none unused unused --header 'Content-Type: application/json' --data "{\"capability\":\"$OSE_ACC_VERIFICATION_CAPABILITY\"}"
account_probe verification-error POST /api/v1/accounts/email-verifications 400 application/problem+json code capability_unavailable --header 'Content-Type: application/json' --data '{"capability":"synthetic-invalid-capability"}'
account_probe sign-in-success POST /api/v1/account-sessions 201 application/json status authenticated --cookie-jar "$OSE_ACC_VERIFY_DIR/sign-in.cookies" --header 'Content-Type: application/json' --data "{\"email\":\"$OSE_ACC_VERIFIED_EMAIL\",\"password\":\"$OSE_ACC_PASSWORD\"}"
rtk rg -q '^Set-Cookie: ose_id_session=' "$OSE_ACC_VERIFY_DIR/sign-in-success.headers"
rtk rg -q '^Set-Cookie: ose_id_csrf=' "$OSE_ACC_VERIFY_DIR/sign-in-success.headers"
account_probe sign-in-error POST /api/v1/account-sessions 401 application/problem+json code invalid_credentials --header 'Content-Type: application/json' --data "{\"email\":\"$OSE_ACC_VERIFIED_EMAIL\",\"password\":\"synthetic-wrong-password\"}"
account_probe account-success GET /api/v1/account 200 application/json status active --cookie "$OSE_ACC_READ_COOKIE_JAR"
account_probe account-error GET /api/v1/account 401 application/problem+json code authentication_required
```

Run the session and recovery probes; the separate seeded cookie jars keep destructive cases isolated:

```bash
account_probe session-list-success GET /api/v1/account-sessions 200 application/json sessions '[array]' --cookie "$OSE_ACC_READ_COOKIE_JAR"
rtk node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if(!Array.isArray(x.sessions))process.exit(1)' "$OSE_ACC_VERIFY_DIR/session-list-success.body"
account_probe session-list-error GET /api/v1/account-sessions 401 application/problem+json code authentication_required
account_probe revoke-current-success DELETE /api/v1/account-sessions/current 204 none unused unused --cookie "$OSE_ACC_CURRENT_COOKIE_JAR" --header "X-CSRF-Token: $OSE_ACC_CURRENT_CSRF"
rtk rg -q '^Set-Cookie: ose_id_session=.*Max-Age=0' "$OSE_ACC_VERIFY_DIR/revoke-current-success.headers"
account_probe revoke-current-error DELETE /api/v1/account-sessions/current 403 application/problem+json code csrf_required --cookie "$OSE_ACC_READ_COOKIE_JAR"
account_probe revoke-other-success DELETE "/api/v1/account-sessions/$OSE_ACC_OTHER_SESSION_ID" 204 none unused unused --cookie "$OSE_ACC_OTHER_COOKIE_JAR" --header "X-CSRF-Token: $OSE_ACC_OTHER_CSRF"
account_probe revoke-other-error DELETE /api/v1/account-sessions/not-a-uuid 400 application/problem+json code invalid_request --cookie "$OSE_ACC_OTHER_COOKIE_JAR" --header "X-CSRF-Token: $OSE_ACC_OTHER_CSRF"
account_probe recovery-request-success POST /api/v1/accounts/password-recovery-requests 202 application/json accepted true --header 'Content-Type: application/json' --data "{\"email\":\"$OSE_ACC_VERIFIED_EMAIL\"}"
account_probe recovery-request-error POST /api/v1/accounts/password-recovery-requests 400 application/problem+json code invalid_request --header 'Content-Type: application/json' --data '{"email":"not-an-email"}'
account_probe reset-success POST /api/v1/accounts/password-resets 204 none unused unused --header 'Content-Type: application/json' --data "{\"capability\":\"$OSE_ACC_RECOVERY_CAPABILITY\",\"newPassword\":\"Synthetic-New-Password-2!\"}"
account_probe reset-error POST /api/v1/accounts/password-resets 400 application/problem+json code capability_unavailable --header 'Content-Type: application/json' --data '{"capability":"synthetic-invalid-capability","newPassword":"Synthetic-New-Password-3!"}'
account_probe readiness-success GET /health/ready 200 application/json status ready
```

For the updated readiness error, stop the ready profile, run `serve` in Terminal A with
`--fixture-profile=account-schema-incompatible`, then continue in Terminal B:

```bash
account_probe readiness-schema-error GET /health/ready 503 application/problem+json code schema_incompatible
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:fixture:destroy -- --manifest="$OSE_ACC_VERIFY_DIR/manifest.json"
```

- [ ] [AI] Execute the setup and every probe exactly. Acceptance: all ten ADD operations and the one
      readiness UPDATE have one successful and one representative stable-error assertion, required
      no-store/correlation/media/cookie headers match, empty responses are empty, fixture cleanup reports
      no owned resource, and `manual-http-matrix.txt` contains metadata only. Any mismatch reopens the
      operation's earliest GREEN/REFACTOR checkbox; a schema-readiness mismatch reopens Phase 2. Raw
      cookie/capability/message/body files never enter evidence or git.

### Mandatory API Quality Gate and Exploratory Retest

- [ ] [AI] Before the Phase 5 gate, execute the complete
      [API Quality Gate](../../../repo-governance/workflows/api/api-quality-gate.md) in `strict` mode.
      Its immutable scope is the running `http://127.0.0.1:8501` backend; every account method/path,
      request/response/error/cookie/rate-limit contract in `tech-docs/007-api-contract-delta.md`;
      retained health/disabled capabilities; and account Gherkin. Its machine-readable contract inputs
      are exactly the OpenAPI 3.1.0 files `specs/apps/ose/id-be/contracts/openapi.yaml` and
      `specs/apps/ose/id-be/contracts/account.openapi.yaml`; prose and Gherkin cannot substitute for
      them. Start fresh PostgreSQL/Mailpit/backend resources, seed only synthetic cases, and confirm
      base-URL reachability plus an empty inbox before delegation.
- [ ] [AI] Invoke `.claude/agents/general/api-exploratory-tester.md` for full discovery with
      `output-mode: delivery`,
      `plan-path: plans/in-progress/ose-id-init-02-local-email-account`, the exact scope above, and
      `max-concurrency: 3`. It must exercise happy/error/concurrent/replay/known-versus-unknown,
      cookie/CSRF, rate-limit, redaction, Mailpit, multi-instance, and retained-regression cases. Append
      every `AET-###` as an unchecked delivery task and save sanitized reports/matrices/run/resource IDs
      under `plans/in-progress/ose-id-init-02-local-email-account/evidence/phase-5/api-quality-gate/`.
- [ ] [AI] Triage findings at `strict`. If any in-threshold defect exists, delegate the workflow's one
      bounded fix pass to `swe-csharp-dev`, run affected Unit/Integration/E2E, OpenAPI, migration, and
      secret gates, rebuild/restart the stack once, then invoke
      `.claude/agents/general/api-exploratory-tester.md` in scoped
      verification mode over every original finding and affected-API regression. Tick only findings
      backed by a passing live retest. `partial`, `fail`, pending lifecycle evidence, regression, or an
      unchecked `AET-###` blocks Phase 5 and reopens the earliest responsible phase; never waive or loop.
- [ ] [AI] Record the UI Quality Gate and live tester agents
      `.claude/agents/web/web-exploratory-tester.md`,
      `.claude/agents/web/web-usability-tester.md`, and
      `.claude/agents/web/web-design-tester.md` as **not applicable** with proof that this
      slice changes no UI/component/browser route and retains the inert web shell byte-for-byte. If the
      diff contradicts that proof, stop: add the required UI gates through a plan amendment before review.

### Phase 5 Gate

- [ ] [AI] Re-run rules/docs/spec/API gates and full manual cleanup; acceptance: implementation, contracts,
      and docs agree with no secret or absolute host path in evidence.
- [ ] [AI] Confirm the API Quality Gate reports `final-status: pass` and
      `lifecycle-status: verified`, its live exploratory matrix covers every added/retained contract,
      no unchecked `AET-###` remains, and the no-UI applicability proof matches the candidate diff.
      Archival cannot start without this current-candidate evidence.

> **Pause Safety:** DU1 is fully documented and manually reproducible. Safe to stop. To resume, rerun the
> documented full account smoke target.

---

## Phase 6: Knowledge Capture, Preliminary Audit, and Archival Commit

**Input:** complete implementation, manual evidence, reconciled rules, and `learnings.md`.
**Outcome:** reusable knowledge is triaged; the preliminary audit passes; the plan move and every index/reference update are committed on the delivery branch before final review.
**Proof:** learning dispositions, preliminary audit matrix, resolved completion date, full archive diff, and delivery-branch commit SHA.

### Knowledge Capture

- [ ] [AI] Review every entry in `plans/in-progress/ose-id-init-02-local-email-account/learnings.md`. Promote general knowledge to its narrow durable owner, link duplicates, and justify plan-specific dispositions. If no entry exists, append an explicit reviewed/none disposition. Run affected Markdown, link, and rules gates; acceptance: every entry has exactly one disposition.
- [ ] [AI] Reconcile any durable documentation/rule edit with the file-impact ledger before continuing. Acceptance: no newly discovered path or rule change remains unplanned.

### Preliminary Delivery Audit

- [ ] [AI] Trace AC-ACC-01..10, approved scope, every file-impact row, physical schema/migration proof, old-code/new-schema compatibility, no-loss manifests, runtime guard, rollback/forward-fix, automated/manual evidence, rules propagation, license record, and Knowledge Capture into `plans/in-progress/ose-id-init-02-local-email-account/evidence/preliminary-delivery-audit.md`. Reopen the earliest failed phase for any unsupported row; checked boxes alone are not evidence.
- [ ] [AI] Run full account, Mailpit, recovery, and multi-instance E2E from a fresh owned stack and the changed-surface documentation/spec/plan gates. Acceptance: all pass without retry/sleep, resources clean up, and no UI, OIDC, provider, company, product-token, or deployment behavior is present.
- [ ] [AI] Verify all applicable rule-15 EWT/UWT/DWT and rule-16 AET defects are fixed. A defect deferral requires explicit user permission; SG proposals/suggestions receive an explicit disposition.

### Plan Archival in the Delivering PR

- [ ] [AI] Only after the preliminary audit passes, run `rtk date +%F` and record its output as `<completion-date>` in the preliminary audit. Never predict or reuse the authoring date.
- [ ] [AI] Run `rtk git mv plans/in-progress/ose-id-init-02-local-email-account/ plans/done/<completion-date>__ose-id-init-02-local-email-account/`. Update `plans/in-progress/README.md` by removing the active entry, update `plans/done/README.md` with the resolved date, and update every repository reference found by `rtk rg -n "plans/in-progress/ose-id-init-02-local-email-account|ose-id-init-02-local-email-account" . --glob '*.md'` so no active-plan link remains.
- [ ] [AI] Run Markdown, link, plan, and `rtk git diff --check` validation against the moved `plans/done/<completion-date>__ose-id-init-02-local-email-account/` path and changed indexes. Acceptance: the archive folder contains `evidence/`, all links resolve, and no duplicate backlog/in-progress folder remains.
- [ ] [AI] Inspect the complete merge-base diff and `rtk git status --short`. Acceptance: implementation, tests, specs, documentation, evidence, plan archive move, and index/reference edits are all present; no post-merge documentation commit is planned.
- [ ] [AI] Do not stage or commit until the user explicitly authorizes the named change set. Once authorized, create the fewest coherent build-valid Conventional Commits, including the archive move/index/reference changes in this delivering PR; use `feat(ose-id): add local email account` for the feature commit and `chore(plans): archive ose-id-init-02-local-email-account` only when a separate archival commit is needed for reviewability.

### Phase 6 Gate

- [ ] [AI] Verify the branch HEAD already contains Knowledge Capture, the passing preliminary audit, and the complete in-progress-to-done move/index/reference changes. The working tree is clean and no final review has started against an earlier head.

> **Pause Safety:** the complete delivery and archived plan state are committed locally but not yet merged. Safe to stop. To resume, verify the archive commit is HEAD and rerun the preliminary audit's changed-surface gates.

---

## Phase 7: Final Exact-Head Quality, Review, and Merge

**Input:** delivery-branch HEAD containing implementation and archived plan.
**Outcome:** that exact immutable head passes local/CI/leak/semantic review and merges to `main`.
**Proof:** registry output, check-run IDs, review dispositions, PR URL, reviewed head/base SHAs, and merge SHA.

### Local Quality Gates Before Push

- [ ] [AI] Run the canonical registry-owned pre-push surface through HIPPO:
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`;
      acceptance: every live registry gate exits 0. Save sanitized output and the inventory from
      `rtk apps/rhino-cli/scripts/rhino-bin.sh gate list --surface=pre-push --format=text`.
- [ ] [AI] Run the Mandatory Nx Quality Matrix, then
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`;
      acceptance: backend build, backend/backend-E2E typecheck/lint/quick, and every applicable
      higher-layer/static target pass. Save commands and exits in `evidence/phase-7/nx-quality.txt`;
      any failure reopens its owning phase.
- [ ] [AI] Run the repository specs/OpenAPI, Markdown, plan, schema/migration, dependency/rules/binding, secret, and changed-surface gates required by the final diff. Acceptance: every gate exits 0 against the archive-containing HEAD.
- [ ] [AI] Run `ose-id-be:test:unit` with native coverage; acceptance: it enforces and reports
      **at least 99% Unit line coverage for authored production code**, with canonical exclusions only. Run all applicable backend/backend-E2E static
      `test:coverage:unit`, `:integration`, `:e2e`, and `:behaviour` targets; acceptance: retained
      foundation plus new account scenario maps close with no invalid exemption.
- [ ] [AI] Inspect `rtk git diff --check`, `rtk git status --short`, and the full `origin/main...HEAD` diff. Acceptance: the tree is clean, generated files trace to exact sources, all plan lifecycle changes are present, and UI, OIDC, provider, company, product-token, or deployment remains absent.
- [ ] [AI] Fix every failure, including preexisting failures encountered by these gates, at root cause. Any repair changes HEAD and invalidates all current-head review evidence; recommit only with user authorization, then rerun this phase from its first check. Never retry, sleep, widen, loosen, skip, or quarantine.

### Push and Exact-Head Review

- [ ] [AI] After explicit authorization, push the delivery branch and open or update its draft PR to `main`. Record exact 40-character head/base SHAs; the head must already include the archived plan.
- [ ] [AI] Poll GitHub Actions every two minutes without `gh run watch`. Fix root causes, push authorized repairs, and restart all exact-head gates whenever HEAD changes.
- [ ] [AI] Require the PR's exact current head/base Quality gate, applicable finite API/E2E/schema gates, one authenticated clean current-head `pr-leak-review`, and the repository-required semantic review for identity/security code. Resolve every blocking finding and rerun invalidated proof.
- [ ] [AI] Merge under default `[AI]` authority only when all hardened checks refer to the same current head/base and the archive move is visible in the PR diff. Record the PR URL, reviewed head, base, merge SHA, and merge timestamp in the workflow final report; make no post-merge plan edit.

### Phase 7 Gate

- [ ] [AI] Verify `origin/main` contains the merge SHA and `plans/done/<completion-date>__ose-id-init-02-local-email-account/`, while backlog/in-progress paths are absent. Do not clean the worktree before the terminal audit.

> **Pause Safety:** the delivery is merged and its archived plan is already on `origin/main`; only containment confirmation, terminal audit, and cleanup remain. Safe to stop. To resume, fetch `origin/main` and verify the recorded merge SHA before auditing.

---

## Phase 8: Post-Merge Terminal Audit and Cleanup

**Input:** confirmed merge containment and the archived plan already delivered on `origin/main`.
**Outcome:** workflow terminal audit passes and only then are the worktree and delivery branch cleaned.
**Proof:** terminal audit verdict/final report, containment proof, branch classification, removal and prune output.

- [ ] [AI] Run `rtk git fetch origin`; verify the recorded merge SHA is an ancestor of `origin/main`, the reviewed head matches the merged PR, and the archived plan/index state is present. A mismatch reopens Phase 7 and blocks cleanup.
- [ ] [AI] Run the workflow-owned terminal plan-execution audit against the delivered merge head. It must trace AC-ACC-01..10, scope, schema/no-loss/compatibility evidence, reviews, and archive state. Record the verdict in the plan-execution final report, not by editing the merged plan. Failure reopens the earliest affected phase.
- [ ] [AI] Update the rules-propagation manifest's external final report/disposition to delivered only after the terminal audit passes; make no repository mutation that would require an unreviewed post-merge commit.
- [ ] [AI] Classify every Phase 0-created Delivery Branch Inventory entry as delivered, unused, or retained/escalated using merged PR and 40-character reviewed-head proof. Ambiguous/active rows retain the worktree and escalate.
- [ ] [AI] Run the mandatory pre-removal checks, reconcile the declared route with `rtk git worktree list --porcelain`, and remove non-force with `rtk git worktree remove worktrees/ose-id-init-02-local-email-account`. Then complete canonical branch cleanup and run `rtk git worktree prune`. Never remove on a partial/failing terminal audit.
- [ ] [AI] Publish the final execution report with merge containment, terminal verdict, cleanup proof, and the statement: Plan 03 remains blocked until this terminal audit passes.

### Phase 8 Gate

- [ ] [AI] Confirm terminal audit PASS, no retained unexplained branch, declared worktree absent, branch cleanup complete, and `origin/main` still contains the reviewed archive state.

> **Pause Safety:** delivery, audit, archival, and cleanup are complete. No repository mutation remains for this plan.
