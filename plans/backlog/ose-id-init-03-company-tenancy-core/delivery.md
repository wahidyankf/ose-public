# Delivery — OSE ID Init 03 Company Tenancy Core

> **Legend:** `[AI]` executes repository work. `[HUMAN]` is only for unavoidable privileged or
> out-of-band work. `[AI+HUMAN]` prepares evidence for a human action. This local-only delivery plans no
> human-only step.

## Lifecycle and Dependency Prerequisites

Do not implement from backlog. Plans 01 and 02 must be delivered, terminal-audited, archived, and
visible on `origin/main`. Then land a separate pure move of this plan to
`plans/in-progress/ose-id-init-03-company-tenancy-core/` with only plan-index changes. If delivered
account/session/notification contracts differ, amend and revalidate this plan before code work.

## Worktree

Worktree path: `worktrees/ose-id-init-03-company-tenancy-core/`

Provisioning status: pending. Authoring occurs in the user-required existing `worktrees/ose-id/` while
the original OSE ID draft is split. Phase 0 provisions/enters this plan's matching worktree from current
`origin/main`; implementation in the authoring worktree is forbidden. Omit execution identity until it exists.

At Phase 0, run this canonical provisioning command from the primary repository root:

```bash
rtk git worktree add -b ose-id-init-03-company-tenancy-core-base worktrees/ose-id-init-03-company-tenancy-core origin/main
```

If the branch already exists, run
`rtk git worktree add worktrees/ose-id-init-03-company-tenancy-core ose-id-init-03-company-tenancy-core-base`.
If the command exits non-zero, run `rtk git worktree prune` once, retry once, then inspect
`rtk git worktree list --porcelain` and `rtk git branch --list
'ose-id-init-03-company-tenancy-core*'`. Reconcile and enter the declared route if it already exists;
retain any partial path or branch and run the worktree recovery classifier. If no artifact exists,
preserve the sanitized failure and stop. Never force-delete, implement in the authoring worktree, or
create a second plan worktree.

## Delivery Mode: worktree-to-pr

One implementation PR targets `main`. Merge requires exact current-head/base Quality gate, one clean
current-head `pr-leak-review`, the repository-required semantic review for identity/security code, and
applicable API/RLS/E2E gates. `[AI]` merges only after hardened preconditions pass.

## Parallelization Model

Use **N=3 workers plus one orchestrator**. Phases 0–1, schema/RLS policy ownership, and phase gates are
serial. After contract/schema design: one C# worker owns membership/invitation use cases, one C# worker
owns entitlement/context evaluation without editing migrations, and one E2E worker owns RLS/pool/
multi-instance fixtures. The orchestrator owns migrations, shared DI/API mapping, generated contracts,
rules, and integration. Workers preserve others' edits and never continue through a red gate.

### Delivery Boundaries

| Phase(s) | Natural cohesive seam             | Worktree                                         | Branch                                     | Delivery opportunity | Exact resulting `main` / rollback / feature-flag evidence                                                                                                                                                                               |
| -------- | --------------------------------- | ------------------------------------------------ | ------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | Setup and predecessor baseline    | `worktrees/ose-id-init-03-company-tenancy-core/` | `ose-id-init-03-company-tenancy-core-base` | none                 | No `main` change; predecessor, RLS capability, dependency, and baseline evidence prove setup only.                                                                                                                                      |
| 1–7      | Complete tenant-isolation backend | `worktrees/ose-id-init-03-company-tenancy-core/` | `ose-id-init-03-company-tenancy-core-base` | PR at Phase 7        | Company, membership, invitation, entitlement, context, RLS, and resolver behavior land together behind inherited non-local pre-listener rejection; revert retains additive schema/RLS while removing routes. No temporary flag applies. |
| 8        | Post-merge audit and cleanup      | —                                                | —                                          | none                 | `origin/main` stays at the verified merge; terminal audit evidence and worktree removal change no product state.                                                                                                                        |

Membership, RLS, and context evaluation form one natural seam because exposing tenant mutation before
database isolation—or isolation without usable context evaluation—is unsafe. UI, OIDC, provider, and
deployment work remain later seams.

### Phase-Local Execution Defaults

Every checkbox and phase gate below inherits its phase row unless it supplies a stricter field. Each
completion therefore has an owner, bounded path, copyable command, observable result, evidence
destination, and failure route.

| Phase | Default owner                                                                                | Bounded implementation paths                                                                                               | Copyable HIPPO/Nx verification                                                                                                                                                                                                                                                                                                                                                       | Required observation and evidence                                                                                                                      | Failure route                                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Orchestrator                                                                                 | repository root, execution worktree, `local-tmp/ose-id-init-03-*`                                                          | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`                                                                                                                                                                                                          | Exit 0 and predecessor SHA/API/schema/fixture/ports/license baselines under `plans/in-progress/ose-id-init-03-company-tenancy-core/evidence/phase-0/`. | Preserve sanitized output and stop; amend for predecessor or toolchain drift.                                                    |
| 1     | Orchestrator; `specs-maker` for structure                                                    | `specs/apps/ose/id-be/**`, `apps/ose-id-be{,-e2e}/**/behaviour-coverage.json`                                              | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=<affected-projects>` followed by `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e`                                  | API/schema/threat/adapter validation passes and only named tenancy bindings remain RED under `evidence/phase-1/`.                                      | Reopen the first spec/contract checkbox; unrelated undefined bindings block Phase 2.                                             |
| 2     | `swe-code-maker` with `programming-csharp`; orchestrator owns migrations/generated contracts | company/membership/invitation code and tests under `apps/ose-id-be/**`, `apps/ose-id-be-e2e/**`, `specs/apps/ose/id-be/**` | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:build` then `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-id-be,ose-id-be-e2e`; run applicable Integration on `ose-id-be` and E2E on `ose-id-be-e2e` separately | Ordered domain/invitation RED, GREEN, and REFACTOR outputs under `evidence/phase-2/{red,green,refactor}/`.                                             | Return to the failing TDD checkbox; never weaken last-admin, replay, or enumeration assertions.                                  |
| 3     | `swe-code-maker` with `programming-csharp`; orchestrator owns migration/RLS manifests        | persistence/RLS code and tests under `apps/ose-id-be/**`, `apps/ose-id-be-e2e/**`                                          | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e`                                                                                                                                                                                                                                                          | Fresh/current schema, role, policy, operation, A→B→personal pool reuse, and compatibility matrices pass twice under `evidence/phase-3/`.               | Reopen the first migration/RLS checkbox; any cross-tenant row/count or privileged runtime role blocks progression.               |
| 4     | `swe-code-maker` with `programming-csharp`; E2E worker owns cross-instance proof             | entitlement/context code and tests under `apps/ose-id-be/**`, `apps/ose-id-be-e2e/**`                                      | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:quick,test:integration,test:e2e --projects=ose-id-be,ose-id-be-e2e`                                                                                                                                                                                                 | Personal/company entitlement, fresh context, revocation, and instance-handoff cycles pass twice under `evidence/phase-4/`.                             | Reopen the first failed RED/GREEN/REFACTOR checkbox; stale context, cached authority, or token/OIDC output blocks progression.   |
| 5     | Orchestrator and `.agents/agents/api-exploratory-tester.md`                                  | delivered backend/spec/doc/rule paths only                                                                                 | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino gate run --surface=pre-push`                                                                                                                                                                                                                                                                | Manual HTTP/RLS matrix, API gate PASS, cleanup, rules manifest, and no-UI proof under `evidence/phase-5/`.                                             | Route API/RLS defects to the API subsection and rule drift to the first rule checkbox; reopen the earliest implementation phase. |
| 6     | Orchestrator                                                                                 | plan evidence, learnings, indexes, archive move                                                                            | a [`plan-checker`](../../../.agents/agents/plan-checker.md) structural review against the [Plans Convention](../../../repo-governance/conventions/structure/plans.md) followed by `rtk ./rhino md internal-link validate`                                                                                                                                                            | Preliminary audit and archive/index proof under `evidence/phase-6/`; commit only after user authorization.                                             | Reopen the first unsupported claim; no archive with incomplete tenant/no-loss evidence.                                          |
| 7     | Orchestrator                                                                                 | complete `origin/main...HEAD` delivery diff                                                                                | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick,test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`                                                                                                                                                        | Exact-head local/CI/leak/semantic-review evidence under `evidence/phase-7/`.                                                                           | Any repair changes HEAD and restarts Phase 7 from the first gate.                                                                |
| 8     | Orchestrator                                                                                 | merged archive state, delivery branch, declared worktree                                                                   | `rtk git merge-base --is-ancestor <merge-sha> origin/main` followed by `rtk git worktree list --porcelain`                                                                                                                                                                                                                                                                           | Terminal PASS, containment, branch classification, and non-force cleanup in the external final report.                                                 | Retain worktree/branch and reopen the failing phase; never force cleanup.                                                        |

### PostgreSQL Persistence Contract

Every company, membership, invitation, entitlement, audit, and tenant-context row written by this
plan uses Npgsql connections/transactions through SqlKata's PostgreSQL compiler and
`SqlKata.Execution`. Repositories require explicit projections, bound parameters, cancellation
tokens, bounded command timeouts, and explicit transactions around RLS context plus every multi-write
invariant; production runtime paths forbid EF change tracking, LINQ-to-database, and `SELECT *`. EF
Core stays migration tooling only, and ASP.NET Core Identity remains hashing/validation primitives
only—not Identity EF stores or `UserManager` persistence. Phase 2–4 gates run
`ose-id-be:test:unit`, `ose-id-be:test:integration`, and `ose-id-be-e2e:test:e2e` through HIPPO and
store compiled-SQL snapshots/contracts, redacted parameter shapes, catalog/policy/index rows,
synthetic-fixture `EXPLAIN` plans, query counts, and tenant-scoped row bounds under each phase's
`evidence/*-persistence/`; `EXPLAIN ANALYZE` is allowed only on isolated safe synthetic data. Any
interpolation, missing timeout/cancellation/transaction, table-wide projection, unbounded/N+1 plan,
cross-tenant plan, Identity persistence, or EF runtime query reopens its owning TDD packet.

### Mandatory Nx Quality Matrix

The full green matrix below is mandatory as the completion gate of the first implementation phase
(Phase 2) and for every later implementation, final local-quality, exact-head delivery/PR, and
post-merge gate. It is not a Phase 0 or Phase 1 success criterion. Before creating any Plan 03
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
nonblocking only when its recorded RED ledger names the missing Plan 03 behavior; any baseline,
target/configuration, or unrelated failure blocks Phase 2.

## Phase 0: Environment, Dependency, and Baseline

**Input:** delivered Plans 01/02 on `origin/main` and promoted Plan 03.
**Outcome:** matching worktree, verified inherited contracts, current PostgreSQL EF-migration and
SqlKata/Npgsql runtime behavior, green baseline.
**Proof:** sanitized `evidence/phase-0/` records.

- [ ] [AI] Fetch and verify the done-plan folders, terminal audit records, merge containment, account
      migrations, runtime roles, runner, session, Mailpit, and notification contracts on `origin/main`.
      Provision/enter `worktrees/ose-id-init-03-company-tenancy-core/`; record exact branch/worktree
      identity only now. Stop on incomplete predecessor proof or a second worktree.
- [ ] [AI] Run `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` and
      `rtk npm run doctor` (read-only; only if it reports drift, run
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply`
      and repeat Doctor); inspect status;
      acceptance: clean tooling without secrets/unexplained generation.
- [ ] [AI] Inspect current PostgreSQL, EF migration tooling, Npgsql/SqlKata runtime persistence,
      audit-column, RLS, connection-pool, API/spec, and tenant
      precedents with targeted `rtk rg` over `apps/`, `specs/`, `docs/`, `repo-governance/`, and
      `repo-config.yml`. Record exact paths/commands and stop on rule conflict.
- [ ] [AI] Re-verify official RLS/`SET LOCAL`/pool APIs and exact package licenses for resolved versions.
      Acceptance: OSE source/docs inherit root MIT; third-party terms/notices remain their own. Verify
      inherited ports 3500/8501/5438/1026/8026 remain registered and unclaimed; stop and amend on collision.
- [ ] [AI] Run predecessor backend/full-stack baselines twice through HIPPO, including production guard,
      account journeys, Mailpit cleanup, migration privilege, and two-instance tests. Fix failures at root cause.

### Phase 0 Gate

- [ ] [AI] Re-run predecessor full E2E and affected baseline; acceptance: exit 0, empty resource inventory,
      current dependencies, and no unverified schema/policy assumption.

> **Pause Safety:** delivered account capability is confirmed and no tenant schema exists. Safe to stop.
> To resume, rerun the Plan 02 full account E2E target.

---

## Phase 1: Specs, API, Threat Model, and Data Design (RED)

**Input:** AC-TEN-01..12 and technical docs.
**Outcome:** canonical behavior, schema/policy map, and threats exist before tenant code.
**Proof:** valid specs/OpenAPI/Mermaid and static RED binding ledger.

- [ ] [AI] **Owner: `specs-maker`; tenancy feature structure.** Extend the owner-based
      `specs/apps/ose/id-be/` corpus, using a `tenancy/` behavior subfolder
      where useful, with Gherkin for all PRD criteria, explicit personal/no-company, multi-company,
      invite, admin denial, last-admin, entitlement, RLS operation matrix, pool reuse, revocation, and
      two-instance cases. Do not create an `id-tenancy/` deployed-surface owner. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=<affected-projects>`;
      acceptance: exit 0, owner structure is valid, titles are unique and app-scoped, and no positive
      layer or plan tag enters Gherkin. Save the command, exit, and feature inventory at
      `evidence/phase-1/specs.txt`; any parser/ownership/title finding returns to this checkbox.
- [ ] [AI] **Owner: backend contract lane; tenancy OpenAPI.** Apply every ADD/UPDATE/DELETE/RETAIN
      operation, exact schema/error, authentication/tenant
      context, request-body limit, pagination/count non-disclosure, CSRF/recent-session rule,
      idempotency/concurrency/rate limit, fixture-only bootstrap exclusion, and forbidden
      product-role/token field in `tech-docs/008-api-contract-delta.md` to
      `specs/apps/ose/id-be/contracts/tenancy.openapi.yaml`, composed by
      `specs/apps/ose/id-be/contracts/openapi.yaml` with the retained
      `specs/apps/ose/id-be/contracts/account.openapi.yaml`. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec redocly -- lint specs/apps/ose/id-be/contracts/openapi.yaml specs/apps/ose/id-be/contracts/account.openapi.yaml specs/apps/ose/id-be/contracts/tenancy.openapi.yaml`;
      acceptance: exit 0, every indexed method/path has its exact schema/status/header/security contract,
      operation IDs are app/domain-scoped, and no plan ID or undocumented API appears. Save the transcript
      and semantic operation diff at `evidence/phase-1/openapi.txt`; any missing/extra operation or schema
      drift returns to this checkbox.
- [ ] [AI] **Owner: security architecture lane; tenancy threat matrix.** Extend the threat-model sections
      in `tech-docs/003-postgresql-rls-and-tenant-store-seam.md` and
      `tech-docs/004-local-apis-statelessness-and-verification.md` for tenant confusion, IDOR,
      pooled-context leakage, RLS bypass/owner,
      policy omission, invitation theft/replay, last-admin race, entitlement escalation, stale authorization,
      audit leakage, and speculative tenant routing. Map each threat to an exact Unit, Integration, E2E,
      or manual proof. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec prettier -- --check plans/in-progress/ose-id-init-03-company-tenancy-core/tech-docs/003-postgresql-rls-and-tenant-store-seam.md plans/in-progress/ose-id-init-03-company-tenancy-core/tech-docs/004-local-apis-statelessness-and-verification.md`;
      acceptance: exit 0 and every named threat has one mitigation, owner, detection proof, and failure
      response. Save the reviewed matrix at `evidence/phase-1/threat-model.md`; any unmapped threat returns
      to this checkbox before adapters.
- [ ] [AI] **Owner: test integrator; initial RED binding ledger.** Run
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e`
      and save only new undefined bindings at `evidence/phase-1/red-bindings.txt`. Acceptance: duplicate,
      ambiguous/unused, invalid-exemption, and unrelated undefined findings are zero; any such finding
      returns to the owning specs checkbox, while only named tenancy bindings continue RED.
- [ ] [AI] **Owner: test integrator; tenancy adapter maps.** Apply
      `tech-docs/007-bdd-spec-delta-and-adapter-map.md` to the backend/backend-E2E
      `behaviour-coverage.json` files while retaining all foundation/account mappings. Bind every
      AC-TEN scenario once at Unit, Integration, and E2E; encode no blanket exemption. Run all applicable
      static coverage through
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e`;
      acceptance: exit 0 and recursive corpus/adapters close exactly with no orphan, duplicate,
      ambiguous, unused, or invalid-exemption row. Save the transcript and adapter inventory at
      `evidence/phase-1/adapter-map.txt`; any failure returns to its exact feature or coverage-map row.

### Phase 1 Gate

- [ ] [AI] Verify `evidence/phase-1/` contains the immediately preceding green predecessor baseline and
      its command/target records before the first Plan 03 scenario, binding, or test. Inspect the isolated
      RED ledger: only named absent Plan 03 behavior may be nonzero; a baseline, target/configuration, or
      unrelated failure blocks Phase 2. Do not require the full green matrix until Phase 2 completes.
- [ ] [AI] **Owner: Phase 1 integrator; contract gate.** Rerun the exact specs, Redocly, threat-doc
      Prettier, and two-project behavior-coverage commands above, then run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- find plans/in-progress/ose-id-init-03-company-tenancy-core specs/apps/ose/id-be -type f -name '*.md' -exec ./scripts/validate-mermaid-files {} +`.
      Acceptance: every command exits 0, the API inventory equals `tech-docs/008-api-contract-delta.md`,
      and `evidence/phase-1/specs.txt`, `evidence/phase-1/openapi.txt`,
      `evidence/phase-1/threat-model.md`, `evidence/phase-1/adapter-map.txt`, plus the resolved RED ledger
      are current. Save the combined result at `evidence/phase-1/gate.txt`; any mismatch reopens its first
      owning checkbox and blocks Phase 2.

> **Pause Safety:** tenant contracts are reviewable with no runtime mutation. Safe to stop. To resume,
> rerun static coverage and compare the ledger.

---

## Phase 2: Company, Membership, and Invitation Domain

**Input:** AC-TEN-03..07/12, Plan 02 Person/session/notification ports.
**Outcome:** backend domain/use cases support company membership administration and safe invitation.
**Proof:** Unit/Integration/API concurrency RED→GREEN→REFACTOR.

### AC-TEN-03, AC-TEN-05, and AC-TEN-06 — Membership and authority

- [ ] [AI] **RED:** add domain/application tests at confirmed backend test paths for opaque IDs, one
      Person/many companies, membership states, duplicate/concurrent membership, Member versus
      MembershipAdmin, the authorized member `verifiedEmailAddress` allowlist, provider/login/credential/session
      field exclusion, bounded normalized-email-prefix filter, deterministic `(normalized_email,
membership_id)` keyset order, company/query/order-bound cursor rejection, Company A/B denial,
      suspend/reactivate/leave, concurrent last-admin safety, compiled-SQL snapshots, explicit
      projection/parameter/timeout/cancellation shapes, and bounded query counts/rows.
      Run backend `test:quick`; acceptance: only missing tenancy behavior fails and RED is saved.
- [ ] [AI] **GREEN:** add additive Company/Membership/audit migrations and domain/application ports/use
      cases in `apps/ose-id-be/`; implement transactional uniqueness/last-admin invariants and the exact
      migration-owned verified-email prefix index in `tech-docs/006-physical-schema-and-migration-contract.md`.
      Rerun focused tests plus an `EXPLAIN`/catalog assertion; acceptance: valid transitions pass, the
      bounded prefix query uses the intended index at representative fixture cardinality, and unsafe
      zero-admin/cross-company results fail safely.
- [ ] [AI] **GREEN:** implement authenticated local membership/admin endpoints with Plan 02 session,
      CSRF, recent-auth where specified, strict DTOs, scope-before-filter/pagination, and the same-company
      verified-contact projection plus query/cursor contract defined in
      `tech-docs/008-api-contract-delta.md`. Rerun API tests;
      acceptance: Company A admin can distinguish its members without observing Company B or private
      identity fields, and contact emails never enter observability/audit sinks.
- [ ] [AI] **REFACTOR:** centralize authority policy inside application use cases rather than route
      middleware alone; run backend build/typecheck/lint/Unit/Integration. Acceptance: no product role or platform
      operator power appears.

### AC-TEN-04 — Invitation lifecycle

- [ ] [AI] **RED:** add invitation create/resend/revoke/expiry, new/existing account, verified-email match,
      admin-visible recipient-email allowlist, capability/provider/login-field exclusion, wrong Person/
      company, purpose, replay/concurrency, and Mailpit cases. Run focused tests; save RED.
- [ ] [AI] **GREEN:** add Invitation migration/use cases and typed notification using existing
      `INotificationSender`; implement atomic authenticated acceptance. Rerun Unit/Integration/Mailpit E2E;
      acceptance: one membership is created and no email becomes immutable identity.
- [ ] [AI] **REFACTOR:** share capability infrastructure without merging verification/reset/invitation
      purposes; rerun all account and invitation regressions. Acceptance: Plan 02 semantics stay green.

### AC-TEN-12 — Auditable invitation cleanup

- [ ] [AI] **RED:** add Unit query/actor tests, PostgreSQL Integration catalog and real-delete probes for
      every new tenancy table, and built E2E for an expired invitation cleanup. Acceptance: failures name
      missing tombstone/audit behavior, columns, constraints, guards, grants, or active filters; no layer
      exemption is permitted.
- [ ] [AI] **GREEN:** implement bounded actor-attributed soft-delete cleanup, null or invalidate usable
      capability material, and apply the inherited six-column/guard/`ON DELETE RESTRICT` contract to every
      tenancy table. Acceptance: ordinary reads exclude the tombstone, the audit row remains, and a real
      serving-role `DELETE` fails.
- [ ] [AI] **REFACTOR:** inspect compiled SQL for explicit tombstone predicates and forbidden physical
      delete syntax, then rerun fresh/current migrations, RLS, concurrent cleanup, and account regressions.
      Acceptance: global security identifiers remain non-reusable and no source row is lost.

### Phase 2 Gate

- [ ] [AI] Run backend Unit/Integration/fresh-migration/Mailpit E2E; acceptance: AC-TEN-03..07 domain/
      invitation/admin/audit behavior passes before tenant endpoints are generally enabled, and
      `evidence/phase-2-persistence/` proves bounded parameterized SqlKata/Npgsql queries with no EF or
      Identity persistence path.

> **Pause Safety:** company domain exists behind inherited local guard; RLS/context endpoints remain
> disabled until Phase 3–4. Safe to stop. To resume, rerun fresh-migration membership E2E.

---

## Phase 3: PostgreSQL RLS and Tenant-Store Resolver

**Input:** tenant schema map, runtime/migration roles, AC-TEN-05/08/09.
**Outcome:** database denies wrong/missing company context and pooled connections reset safely.
**Proof:** operation/table/role matrix E2E under real unprivileged runtime role.

### AC-TEN-08 and AC-TEN-09 — RLS and pooled context

- [ ] [AI] **RED:** add PostgreSQL E2E for each tenant-owned table across SELECT/INSERT/UPDATE/DELETE or
      soft-delete/join/aggregate/pagination with Company A, Company B, missing, malformed, and stale
      contexts; add compiled-SQL snapshots, catalog/index plus safe synthetic `EXPLAIN`, bounded query
      count/row assertions, runtime-role owner/superuser/BYPASSRLS/DDL negative probes, and A→B→personal pool reuse.
      Run focused E2E; acceptance: tests demonstrate missing policies/context cleanup.
- [ ] [AI] **GREEN:** create forward RLS policy/grant migrations, non-bypass non-owner runtime grants,
      transaction-local subject/company context adapter, and explicit tenant repository context. The
      migration pair under `apps/ose-id-be/src/OseId.Infrastructure/Persistence/Migrations/` implements
      every table/column/type/null/default/PK/FK/check/index/owner/grant/policy in
      `tech-docs/006-physical-schema-and-migration-contract.md`. Rerun the matrix; acceptance: every
      wrong/missing operation denies without foreign rows/counts.
- [ ] [AI] **GREEN:** implement one shared-store `ITenantStoreResolver` mapping stable store keys to the
      delivered PostgreSQL target. Test unknown/inactive route rejection; add no dynamic sharding/cache.
- [ ] [AI] **REFACTOR:** centralize transaction setup/reset and repository composition without exposing
      Npgsql/SqlKata connection/query types to domain; prove no EF runtime query/change-tracking path.
      Rerun matrix concurrently and twice; acceptance: no pooled leakage/flakiness.
- [ ] [AI] Produce `evidence/phase-3-schema/` old/new catalog manifests with per-table active/deleted
      counts and stable digests; record explicit no-backfill/no-contract, Plan-02-code/new-schema PASS,
      new-code/old-schema fail-closed, retained-schema rollback, and forward-fix results. Acceptance:
      old account rows/counts/digests are unchanged and every physical RLS/ownership fact matches.

### Phase 3 Gate

- [ ] [AI] Recreate database and run complete schema/policy/role/operation/pool manifest twice;
      acceptance: AC-TEN-05/08/09 pass, compiled SQL/catalog/policy/index/safe synthetic-plan and
      tenant-row-bound evidence is complete in `evidence/phase-3-persistence/`, and Plan 02 code works
      against retained newer schema.

> **Pause Safety:** database isolation is active and tenant APIs remain local/guarded. Safe to stop. To
> resume, rerun the RLS operation matrix with a fresh database.

---

## Phase 4: Entitlements and Authorization Context Evaluation

**Input:** active account/membership/RLS, AC-TEN-01/02/03/07/10/11.
**Outcome:** fresh backend evaluation returns explicit personal or one-company contexts without tokens.
**Proof:** Unit/Integration/API/two-instance RED→GREEN→REFACTOR.

### AC-TEN-01, AC-TEN-02, and AC-TEN-07 — Personal/company entitlement

- [ ] [AI] **RED:** add tests for personal/company/both resource policies, companyless Person, personal
      entitlement, company entitlement plus active membership, no synthetic company, and absence of
      product roles. Run focused tests and save missing-behavior RED.
- [ ] [AI] **GREEN:** add ProductResource fixture, PersonalEntitlement, CompanyEntitlement migrations and
      application policies. Rerun focused tests; acceptance: personal has no company ID and company access
      requires every current state under RLS.
- [ ] [AI] **REFACTOR:** separate entry entitlement from company authority and any future claims mapping;
      run backend regression. Acceptance: no LMS-domain role/token field is stored or returned.

### AC-TEN-03, AC-TEN-10, and AC-TEN-11 — List/select/revoke fresh context

- [ ] [AI] **RED:** add eligible-context and selection tests for zero/one/many choices, exactly 100
      contexts, 101-context `context_limit_exceeded` with no partial list, requested guessed/stale
      company, concurrent selection, membership/company/entitlement revocation, authorization-version
      signal, instance A list/B validate, compiled-SQL shapes, and bounded query counts/rows. Run and save RED.
- [ ] [AI] **GREEN:** implement context list/evaluate application use cases and local authenticated APIs;
      fetch at most 101 eligible rows, fail above 100 without returning a partial list, re-evaluate
      selection in a fresh transaction, and persist/audit only the invalidation/version signal—not a
      global active company. Rerun focused tests; acceptance: one explicit current context or the stable
      overflow result is returned.
- [ ] [AI] **REFACTOR:** remove process caches/affinity and isolate a future protocol-facing application
      result without JWT/OpenIddict types. Run complete backend/E2E twice with instances stopped mid-flow.

### Phase 4 Gate

- [ ] [AI] Run all context/entitlement/revocation/multi-instance tests; acceptance: AC-TEN-01/02/03/07/
      10/11 pass, `evidence/phase-4-persistence/` proves bounded query counts and explicit transactional
      context changes without N+1 or cross-tenant rows, every token/OIDC route remains absent, and no
      resource survives.

> **Pause Safety:** backend tenancy/context core is complete locally but no product authorization token
> exists. Safe to stop. To resume, rerun the full tenancy E2E target.

---

## Phase 5: Rules, Documentation, and Manual Verification

**Input:** complete tenant behavior and actual registry/spec impact.
**Outcome:** repository rules/docs match the isolated backend and manual proof covers all contexts.
**Proof:** rules manifest, valid docs/contracts, sanitized API/RLS evidence.

- [ ] [AI] Inventory every actual rule impact across canonical/enforcement/binding surfaces for tenant
      specs/API, RLS test ownership, fixture isolation, ports/env, migrations, and project dependencies.
      Save intake at `local-tmp/rules-propagation/ose-id-init-03-intake.md`; classify conflicts first.
- [ ] [AI] Apply narrow canonical/enforcement changes and generate bindings only if their source changed.
      Run rules-quality, repo-config, dependency/test-boundary, specs/contract, migration/RLS, port/env,
      and binding-sync gates; save a partial-pending-delivery manifest.
- [ ] [AI] Update affected backend/E2E/spec/reference READMEs with personal/company semantics, API,
      RLS/role/transaction requirements, fixture isolation, rollback, failure diagnosis, and explicit
      no-UI/no-token/no-deployment. Run Markdown lint/heading/link/Mermaid gates.
- [ ] [AI] Execute all 11 steps in `tech-docs/004-local-apis-statelessness-and-verification.md`; save
      sanitized status/count/policy/role evidence under `evidence/manual/`, delete raw cookies/capabilities/
      messages/logs, and prove empty resources. Acceptance: all PRD criteria are observed.

### Copyable HTTP Verification

The E2E worker owns fixture creation/cleanup and the orchestrator owns this manual run. Before Phase 5,
`apps/ose-id-be-e2e/project.json` must expose `serve`, `fixture:seed`, and `fixture:destroy`. The
`tenancy-manual` profile seeds separate synthetic personal, 101-context overflow, Company A
admin/member/leaver/invitee, Company B, member-mutation, resend, revoke, acceptance, and entitlement
cases. Its mode-0600 `fixture.env` defines only local ephemeral cookie-jar paths (including
`OSE_TEN_OVERFLOW_COOKIE_JAR`), CSRF/capability variables,
Company A/B, membership, invitation, and product identifiers; current row versions; and a cleanup
manifest. The seed command must not print any value, and evidence must never include them.

Terminal A:

```bash
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=tenancy-manual
```

Terminal B setup and assertion helper:

```bash
set -eu
OSE_TEN_VERIFY_DIR="local-tmp/ose-id-init-03-http"
OSE_TEN_EVIDENCE="plans/in-progress/ose-id-init-03-company-tenancy-core/evidence/phase-5/manual-http-matrix.txt"
rtk mkdir -p "$OSE_TEN_VERIFY_DIR" "$(dirname "$OSE_TEN_EVIDENCE")"
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:fixture:seed -- --fixture-profile=tenancy-manual --output="$OSE_TEN_VERIFY_DIR"
set -a
. "$OSE_TEN_VERIFY_DIR/fixture.env"
set +a
: > "$OSE_TEN_EVIDENCE"

tenant_probe() {
  OSE_TEN_LABEL="$1"
  OSE_TEN_METHOD="$2"
  OSE_TEN_PATH="$3"
  OSE_TEN_EXPECTED_STATUS="$4"
  OSE_TEN_EXPECTED_MEDIA="$5"
  OSE_TEN_EXPECTED_FIELD="$6"
  OSE_TEN_EXPECTED_VALUE="$7"
  shift 7
  OSE_TEN_HEADERS="$OSE_TEN_VERIFY_DIR/$OSE_TEN_LABEL.headers"
  OSE_TEN_BODY="$OSE_TEN_VERIFY_DIR/$OSE_TEN_LABEL.body"
  OSE_TEN_STATUS="$(rtk curl --silent --show-error --request "$OSE_TEN_METHOD" --dump-header "$OSE_TEN_HEADERS" --output "$OSE_TEN_BODY" --write-out '%{http_code}' "$@" "http://127.0.0.1:8501$OSE_TEN_PATH")"
  test "$OSE_TEN_STATUS" = "$OSE_TEN_EXPECTED_STATUS"
  rtk rg -q '^Cache-Control: no-store' "$OSE_TEN_HEADERS"
  rtk rg -q '^X-Correlation-ID:' "$OSE_TEN_HEADERS"
  if test "$OSE_TEN_EXPECTED_MEDIA" = "none"; then
    test ! -s "$OSE_TEN_BODY"
  else
    rtk rg -q "^Content-Type: $OSE_TEN_EXPECTED_MEDIA" "$OSE_TEN_HEADERS"
    rtk node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const value=x[process.argv[2]];const expected=process.argv[3];if(expected==="[array]"?!Array.isArray(value):String(value)!==expected)process.exit(1)' "$OSE_TEN_BODY" "$OSE_TEN_EXPECTED_FIELD" "$OSE_TEN_EXPECTED_VALUE"
  fi
  rtk awk -v label="$OSE_TEN_LABEL" -v method="$OSE_TEN_METHOD" -v path="$OSE_TEN_PATH" -v status="$OSE_TEN_STATUS" 'BEGIN { print label " " method " " path " status=" status " headers=validated body=validated" }' >> "$OSE_TEN_EVIDENCE"
}
```

Verify context and membership operations. Every success uses a dedicated seeded row so later destructive
probes cannot invalidate another precondition.

```bash
tenant_probe contexts-success GET '/api/v1/account/contexts?productKey=ose-lms' 200 application/json contexts '[array]' --cookie "$OSE_TEN_PERSONAL_COOKIE_JAR"
tenant_probe contexts-error GET '/api/v1/account/contexts?productKey=INVALID%20KEY' 400 application/problem+json code invalid_request --cookie "$OSE_TEN_PERSONAL_COOKIE_JAR"
tenant_probe contexts-overflow GET '/api/v1/account/contexts?productKey=ose-lms' 409 application/problem+json code context_limit_exceeded --cookie "$OSE_TEN_OVERFLOW_COOKIE_JAR"
rtk node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if("contexts" in x||"nextCursor" in x)process.exit(1)' "$OSE_TEN_VERIFY_DIR/contexts-overflow.body"
tenant_probe select-context-success POST /api/v1/account/context-selections 200 application/json type company --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF" --header 'Content-Type: application/json' --data "{\"productKey\":\"ose-lms\",\"type\":\"company\",\"companyId\":\"$OSE_TEN_COMPANY_A_ID\"}"
tenant_probe select-context-error POST /api/v1/account/context-selections 403 application/problem+json code csrf_required --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header 'Content-Type: application/json' --data "{\"productKey\":\"ose-lms\",\"type\":\"company\",\"companyId\":\"$OSE_TEN_COMPANY_A_ID\"}"
tenant_probe members-success GET "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/members?limit=25" 200 application/json items '[array]' --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR"
tenant_probe members-error GET "/api/v1/companies/$OSE_TEN_COMPANY_B_ID/members?limit=25" 404 application/problem+json code tenant_resource_not_found --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR"
tenant_probe change-member-success PATCH "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/members/$OSE_TEN_MUTABLE_MEMBERSHIP_ID" 200 application/json status suspended --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF" --header 'Content-Type: application/json' --data "{\"status\":\"suspended\",\"authority\":null,\"rowVersion\":$OSE_TEN_MUTABLE_MEMBERSHIP_VERSION}"
tenant_probe change-member-error PATCH "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/members/$OSE_TEN_STALE_MEMBERSHIP_ID" 409 application/problem+json code concurrency_conflict --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF" --header 'Content-Type: application/json' --data "{\"status\":\"suspended\",\"authority\":null,\"rowVersion\":$OSE_TEN_STALE_MEMBERSHIP_VERSION}"
tenant_probe leave-success POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/members/$OSE_TEN_LEAVER_MEMBERSHIP_ID/leave" 204 none unused unused --cookie "$OSE_TEN_LEAVER_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_LEAVER_CSRF" --header 'Content-Type: application/json' --data "{\"rowVersion\":$OSE_TEN_LEAVER_MEMBERSHIP_VERSION}"
tenant_probe leave-error POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/members/$OSE_TEN_MUTABLE_MEMBERSHIP_ID/leave" 403 application/problem+json code membership_not_owned --cookie "$OSE_TEN_LEAVER_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_LEAVER_CSRF" --header 'Content-Type: application/json' --data "{\"rowVersion\":$OSE_TEN_MUTABLE_MEMBERSHIP_VERSION}"
```

Verify invitation operations. The success cases use separate seeded invitations; capability and cookie
variables stay only in the ignored shell environment.

```bash
tenant_probe invitations-success GET "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations?limit=25" 200 application/json items '[array]' --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR"
tenant_probe invitations-error GET "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations?limit=25" 403 application/problem+json code insufficient_company_authority --cookie "$OSE_TEN_MEMBER_A_COOKIE_JAR"
tenant_probe create-invitation-success POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations" 201 application/json status pending --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF" --header 'Idempotency-Key: manual-create-0001' --header 'Content-Type: application/json' --data '{"email":"manual.invitee@example.test","intendedAuthority":"member"}'
rtk rg -q "^Location: /api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations/" "$OSE_TEN_VERIFY_DIR/create-invitation-success.headers"
tenant_probe create-invitation-error POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations" 409 application/problem+json code invitation_exists --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF" --header 'Idempotency-Key: manual-create-0002' --header 'Content-Type: application/json' --data '{"email":"manual.invitee@example.test","intendedAuthority":"member"}'
tenant_probe resend-success POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations/$OSE_TEN_RESEND_INVITATION_ID/resends" 202 application/json status Pending --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF" --header 'Idempotency-Key: manual-resend-0001'
tenant_probe resend-error POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations/$OSE_TEN_FOREIGN_INVITATION_ID/resends" 404 application/problem+json code tenant_resource_not_found --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF" --header 'Idempotency-Key: manual-resend-0002'
tenant_probe revoke-invitation-success DELETE "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations/$OSE_TEN_REVOKE_INVITATION_ID" 204 none unused unused --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF"
tenant_probe revoke-invitation-error DELETE "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitations/$OSE_TEN_FOREIGN_INVITATION_ID" 404 application/problem+json code tenant_resource_not_found --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF"
tenant_probe accept-invitation-success POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitation-acceptances" 204 none unused unused --cookie "$OSE_TEN_INVITEE_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_INVITEE_CSRF" --header 'Content-Type: application/json' --data "{\"capability\":\"$OSE_TEN_ACCEPT_CAPABILITY\"}"
tenant_probe accept-invitation-error POST "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/invitation-acceptances" 400 application/problem+json code capability_unavailable --cookie "$OSE_TEN_INVITEE_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_INVITEE_CSRF" --header 'Content-Type: application/json' --data '{"capability":"synthetic-invalid-capability"}'
```

Verify entitlement operations and the readiness UPDATE:

```bash
tenant_probe entitlements-success GET "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/entitlements?limit=25" 200 application/json items '[array]' --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR"
tenant_probe entitlements-error GET "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/entitlements?limit=25" 403 application/problem+json code insufficient_company_authority --cookie "$OSE_TEN_MEMBER_A_COOKIE_JAR"
tenant_probe grant-success PUT "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/entitlements/$OSE_TEN_PRODUCT_KEY" 204 none unused unused --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF"
tenant_probe grant-error PUT "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/entitlements/unknown-product" 404 application/problem+json code tenant_resource_not_found --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF"
tenant_probe revoke-entitlement-success DELETE "/api/v1/companies/$OSE_TEN_COMPANY_A_ID/entitlements/$OSE_TEN_PRODUCT_KEY" 204 none unused unused --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF"
tenant_probe revoke-entitlement-error DELETE "/api/v1/companies/$OSE_TEN_COMPANY_B_ID/entitlements/$OSE_TEN_PRODUCT_KEY" 404 application/problem+json code tenant_resource_not_found --cookie "$OSE_TEN_ADMIN_A_COOKIE_JAR" --header "X-CSRF-Token: $OSE_TEN_ADMIN_A_CSRF"
tenant_probe readiness-success GET /health/ready 200 application/json status ready
```

Stop the ready profile, run `serve -- --fixture-profile=tenancy-schema-incompatible` in Terminal A, and
finish in Terminal B:

```bash
tenant_probe readiness-schema-error GET /health/ready 503 application/problem+json code schema_incompatible
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:fixture:destroy -- --manifest="$OSE_TEN_VERIFY_DIR/manifest.json"
```

- [ ] [AI] Run the setup and every probe exactly. Acceptance: all 13 ADD operations and the readiness
      UPDATE have a successful and representative stable-error assertion; required no-store,
      correlation, media, and `Location` headers match; empty responses are empty; Company A credentials
      never reveal Company B rows/counts; fixture cleanup reports no owned resource; and the sanitized
      matrix contains metadata only. Any mismatch reopens the operation's earliest GREEN/REFACTOR step;
      cross-tenant disclosure reopens Phase 3 and blocks all further work. Raw cookie, CSRF, capability,
      contact, response-body, Mailpit, and database values never enter evidence or git.

### Mandatory API Quality Gate and Exploratory Retest

- [ ] [AI] Before the Phase 5 gate, execute the complete
      [API Quality Gate](../../../repo-governance/workflows/api/api-quality-gate.md) in `strict` mode.
      Its immutable scope is `http://127.0.0.1:8501`; all context, membership, invitation, acceptance,
      and entitlement method/path contracts in `tech-docs/008-api-contract-delta.md`; retained account/
      health/disabled operations; tenancy Gherkin; and the real PostgreSQL RLS/runtime-role boundary.
      Its machine-readable contract inputs are exactly the OpenAPI 3.1.0 files
      `specs/apps/ose/id-be/contracts/openapi.yaml`,
      `specs/apps/ose/id-be/contracts/account.openapi.yaml`, and
      `specs/apps/ose/id-be/contracts/tenancy.openapi.yaml`; prose and Gherkin cannot substitute for
      them. Start a clean owned stack with synthetic personal, Company A, Company B,
      wrong/stale/unset-context, and Mailpit fixtures; confirm base-URL reachability before delegation.
- [ ] [AI] Invoke `.agents/agents/api-exploratory-tester.md` for full discovery with
      `output-mode: delivery`,
      `plan-path: plans/in-progress/ose-id-init-03-company-tenancy-core`, the exact scope above, and
      `max-concurrency: 3`. It must cover every operation's success/errors, cross-tenant guessed IDs,
      pagination/count non-disclosure, CSRF, idempotency-key conflict, capability replay, last-admin and
      acceptance concurrency, rate limits, RLS/pool reuse, revocation, and multi-instance handoff. Append
      every `AET-###` as an unchecked delivery task; save sanitized reports, matrices, catalog/policy
      proof, run IDs, and cleanup inventory under
      `plans/in-progress/ose-id-init-03-company-tenancy-core/evidence/phase-5/api-quality-gate/`.
- [ ] [AI] Triage findings at `strict`. For any in-threshold defect, delegate the workflow's single
      bounded fix pass to `swe-code-maker` with `programming-csharp`; rerun affected Unit/Integration/E2E, OpenAPI, migration/RLS,
      secret, and tenant-isolation gates; rebuild/restart once; then invoke
      `.agents/agents/api-exploratory-tester.md` in scoped verification mode over every original
      finding and affected-API regression. Tick only with
      passing live retest proof. `partial`, `fail`, pending lifecycle evidence, an isolation uncertainty,
      regression, or unchecked `AET-###` blocks Phase 5 and reopens the earliest responsible phase.
- [ ] [AI] Record the UI Quality Gate and live tester agents
      `.agents/agents/web-exploratory-tester.md`,
      `.agents/agents/web-usability-tester.md`, and
      `.agents/agents/web-design-tester.md` as **not applicable** with proof that this
      backend-only slice changes no UI/component/browser route and retains the inert web shell unchanged.
      If the diff contains a UI delta, stop and amend the plan to add all mandatory UI gates.

### Phase 5 Gate

- [ ] [AI] Re-run rule/docs/spec/API/RLS/manual-cleanup gates; acceptance: implementation and contracts
      agree, no foreign tenant/secret/absolute path appears, and no unresolved rules finding remains.
- [ ] [AI] Confirm the API Quality Gate reports `final-status: pass` and
      `lifecycle-status: verified`, the live exploratory matrix covers every added/updated/retained API
      plus RLS boundary, no unchecked `AET-###` remains, and the no-UI applicability proof matches the
      candidate diff. Archival cannot start without this current-candidate evidence.

> **Pause Safety:** DU1 is documented and manually reproducible. Safe to stop. To resume, rerun the full
> tenant smoke and RLS matrix targets.

---

## Phase 6: Knowledge Capture, Preliminary Audit, and Archival Commit

**Input:** complete implementation, manual evidence, reconciled rules, and `learnings.md`.
**Outcome:** reusable knowledge is triaged; the preliminary audit passes; the plan move and every index/reference update are committed on the delivery branch before final review.
**Proof:** learning dispositions, preliminary audit matrix, resolved completion date, full archive diff, and delivery-branch commit SHA.

### Knowledge Capture

- [ ] [AI] Review every entry in `plans/in-progress/ose-id-init-03-company-tenancy-core/learnings.md`. Promote general knowledge to its narrow durable owner, link duplicates, and justify plan-specific dispositions. If no entry exists, append an explicit reviewed/none disposition. Run affected Markdown, link, and rules gates; acceptance: every entry has exactly one disposition.
- [ ] [AI] Reconcile any durable documentation/rule edit with the file-impact ledger before continuing. Acceptance: no newly discovered path or rule change remains unplanned.

### Preliminary Delivery Audit

- [ ] [AI] Trace AC-TEN-01..12, approved scope, every file-impact row, physical schema/migration proof, old-code/new-schema compatibility, no-loss manifests, runtime guard, rollback/forward-fix, automated/manual evidence, rules propagation, license record, and Knowledge Capture into `plans/in-progress/ose-id-init-03-company-tenancy-core/evidence/preliminary-delivery-audit.md`. Reopen the earliest failed phase for any unsupported row; checked boxes alone are not evidence.
- [ ] [AI] Run tenant smoke, invitation, context, and complete RLS matrix from a fresh owned stack and the changed-surface documentation/spec/plan gates. Acceptance: all pass without retry/sleep, resources clean up, and no UI, OIDC, provider, product-domain role, or deployment behavior is present.
- [ ] [AI] Verify all applicable rule-15 EWT/UWT/DWT and rule-16 AET defects are fixed. A defect deferral requires explicit user permission; SG proposals/suggestions receive an explicit disposition.

### Plan Archival in the Delivering PR

- [ ] [AI] Only after the preliminary audit passes, run `rtk date +%F` and record its output as `<completion-date>` in the preliminary audit. Never predict or reuse the authoring date.
- [ ] [AI] Run `rtk git mv plans/in-progress/ose-id-init-03-company-tenancy-core/ plans/done/<completion-date>__ose-id-init-03-company-tenancy-core/`. Update `plans/in-progress/README.md` by removing the active entry, update `plans/done/README.md` with the resolved date, and update every repository reference found by `rtk rg -n "plans/in-progress/ose-id-init-03-company-tenancy-core|ose-id-init-03-company-tenancy-core" . --glob '*.md'` so no active-plan link remains.
- [ ] [AI] Run Markdown, link, plan, and `rtk git diff --check` validation against the moved `plans/done/<completion-date>__ose-id-init-03-company-tenancy-core/` path and changed indexes. Acceptance: the archive folder contains `evidence/`, all links resolve, and no duplicate backlog/in-progress folder remains.
- [ ] [AI] Inspect the complete merge-base diff and `rtk git status --short`. Acceptance: implementation, tests, specs, documentation, evidence, plan archive move, and index/reference edits are all present; no post-merge documentation commit is planned.
- [ ] [AI] Do not stage or commit until the user explicitly authorizes the named change set. Once authorized, create the fewest coherent build-valid Conventional Commits, including the archive move/index/reference changes in this delivering PR; use `feat(ose-id): add company tenancy core` for the feature commit and `chore(plans): archive ose-id-init-03-company-tenancy-core` only when a separate archival commit is needed for reviewability.

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
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino gate run --surface=pre-push`;
      acceptance: every live registry gate exits 0. Save sanitized output and the inventory from
      `rtk ./rhino gate list --output text`.
- [ ] [AI] Run the Mandatory Nx Quality Matrix, then
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`;
      acceptance: backend build, backend/backend-E2E typecheck/lint/quick, and every applicable
      higher-layer/static target pass. Save commands and exits in `evidence/phase-7/nx-quality.txt`;
      any failure reopens its owning phase.
- [ ] [AI] Run the repository specs/OpenAPI, Markdown, plan, schema/migration, dependency/rules/binding, secret, and changed-surface gates required by the final diff. Acceptance: every gate exits 0 against the archive-containing HEAD.
- [ ] [AI] Run `ose-id-be:test:unit` with native coverage; acceptance: it enforces and reports
      **at least 99% Unit line coverage for authored production code**, with canonical exclusions only. Run all applicable backend/backend-E2E static
      `test:coverage:unit`, `:integration`, `:e2e`, and `:behaviour` targets; acceptance: retained
      foundation/account plus new tenancy maps close with no invalid exemption.
- [ ] [AI] Inspect `rtk git diff --check`, `rtk git status --short`, and the full `origin/main...HEAD` diff. Acceptance: the tree is clean, generated files trace to exact sources, all plan lifecycle changes are present, and UI, OIDC, provider, product-domain role, or deployment remains absent.
- [ ] [AI] Fix every failure, including preexisting failures encountered by these gates, at root cause. Any repair changes HEAD and invalidates all current-head review evidence; recommit only with user authorization, then rerun this phase from its first check. Never retry, sleep, widen, loosen, skip, or quarantine.

### Push and Exact-Head Review

- [ ] [AI] After explicit authorization, push the delivery branch and open or update its draft PR to `main`. Record exact 40-character head/base SHAs; the head must already include the archived plan.
- [ ] [AI] Poll GitHub Actions every two minutes without `gh run watch`. Fix root causes, push authorized repairs, and restart all exact-head gates whenever HEAD changes.
- [ ] [AI] Require the PR's exact current head/base Quality gate, applicable finite API/E2E/schema gates, one authenticated clean current-head `pr-leak-review`, and the repository-required semantic review for identity/security code. Resolve every blocking finding and rerun invalidated proof.
- [ ] [AI] Merge under default `[AI]` authority only when all hardened checks refer to the same current head/base and the archive move is visible in the PR diff. Record the PR URL, reviewed head, base, merge SHA, and merge timestamp in the workflow final report; make no post-merge plan edit.

### Phase 7 Gate

- [ ] [AI] Verify `origin/main` contains the merge SHA and `plans/done/<completion-date>__ose-id-init-03-company-tenancy-core/`, while backlog/in-progress paths are absent. Do not clean the worktree before the terminal audit.

> **Pause Safety:** the delivery is merged and its archived plan is already on `origin/main`; only containment confirmation, terminal audit, and cleanup remain. Safe to stop. To resume, fetch `origin/main` and verify the recorded merge SHA before auditing.

---

## Phase 8: Post-Merge Terminal Audit and Cleanup

**Input:** confirmed merge containment and the archived plan already delivered on `origin/main`.
**Outcome:** workflow terminal audit passes and only then are the worktree and delivery branch cleaned.
**Proof:** terminal audit verdict/final report, containment proof, branch classification, removal and prune output.

- [ ] [AI] Run `rtk git fetch origin`; verify the recorded merge SHA is an ancestor of `origin/main`, the reviewed head matches the merged PR, and the archived plan/index state is present. A mismatch reopens Phase 7 and blocks cleanup.
- [ ] [AI] Run the workflow-owned terminal plan-execution audit against the delivered merge head. It must trace AC-TEN-01..12, scope, schema/no-loss/compatibility evidence, reviews, and archive state. Record the verdict in the plan-execution final report, not by editing the merged plan. Failure reopens the earliest affected phase.
- [ ] [AI] Update the rules-propagation manifest's external final report/disposition to delivered only after the terminal audit passes; make no repository mutation that would require an unreviewed post-merge commit.
- [ ] [AI] Classify every Phase 0-created Delivery Branch Inventory entry as delivered, unused, or retained/escalated using merged PR and 40-character reviewed-head proof. Ambiguous/active rows retain the worktree and escalate.
- [ ] [AI] Run the mandatory pre-removal checks, reconcile the declared route with `rtk git worktree list --porcelain`, and remove non-force with `rtk git worktree remove worktrees/ose-id-init-03-company-tenancy-core`. Then complete canonical branch cleanup and run `rtk git worktree prune`. Never remove on a partial/failing terminal audit.
- [ ] [AI] Publish the final execution report with merge containment, terminal verdict, cleanup proof, and the statement: later OIDC/UI plans remain blocked until this terminal audit passes.

### Phase 8 Gate

- [ ] [AI] Confirm terminal audit PASS, no retained unexplained branch, declared worktree absent, branch cleanup complete, and `origin/main` still contains the reviewed archive state.

> **Pause Safety:** delivery, audit, archival, and cleanup are complete. No repository mutation remains for this plan.
