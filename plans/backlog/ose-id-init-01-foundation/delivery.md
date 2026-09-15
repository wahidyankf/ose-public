# Delivery — OSE ID Init 01 Local Foundation

> **Legend:** `[AI]` means an agent executes the step. `[HUMAN]` is reserved for an unavoidable
> privileged or out-of-band action. `[AI+HUMAN]` means the agent prepares evidence and a human performs
> the external action. No step in this local-only plan currently requires a human-only action.

## Lifecycle Prerequisite

Do not implement from backlog. First land this plan in `plans/backlog/`, then land a separate pure move
to `plans/in-progress/ose-id-init-01-foundation/` with only the backlog/in-progress index edits. Confirm
that move exists on `origin/main` before Phase 0. Staging, committing, pushing, PR creation, and merge
still require the user's explicit delivery instruction.

Plan 02 cannot move into execution until this plan's implementation PR and archival lifecycle are
complete on `origin/main`.

## Worktree

Worktree path: `worktrees/ose-id-init-01-foundation/`

Provisioning status: pending. This plan is being authored inside the user-required existing
`worktrees/ose-id/` authoring worktree because it splits the original unlanded OSE ID draft. Phase 0 provisions or
enters the matching execution worktree from current `origin/main`; no implementation may begin in the
authoring worktree. Record identity and branch inventory only after provisioning—do not invent them now.

At Phase 0, run this canonical provisioning command from the primary repository root:

```bash
rtk git worktree add -b ose-id-init-01-foundation-base worktrees/ose-id-init-01-foundation origin/main
```

If the branch already exists, run
`rtk git worktree add worktrees/ose-id-init-01-foundation ose-id-init-01-foundation-base`. If the
command exits non-zero, run `rtk git worktree prune` once, retry once, then inspect
`rtk git worktree list --porcelain` and `rtk git branch --list
'ose-id-init-01-foundation*'`. If the declared route already exists, reconcile and enter that one
worktree; retain any partial path or branch and run the worktree recovery classifier. If neither exists,
preserve the sanitized failure and stop for diagnosis. Never force-delete, implement in the authoring
worktree, or provision a second worktree to bypass the failure.

## Delivery Mode: worktree-to-pr

One implementation branch opens one draft PR against `main`. Merge requires the exact current head/base
Quality gate from `.github/workflows/pr-quality-gate.yml`, one authenticated clean current-head
`pr-leak-review`, the repository-required semantic review for identity/security code, and the finite
API/E2E surfaces required below. `[AI]` merges only after all hardened preconditions pass.

## Parallelization Model

Use the repository N+1 limit with **N=3 worker agents plus one orchestrator**. Phase 0 and contract/spec
work are serial. After Phase 1, one C# worker may own backend/migration files, one TypeScript worker may
own the web shell, and one E2E worker may own runner/tests. The orchestrator owns shared registry,
generated files, migrations, and final integration. Workers share no file ownership, inspect current
changes before editing, never revert another worker, and stop at phase gates. Lifecycle, rules
propagation, quality, PR delivery, audit, archival, and cleanup remain serial.

### Delivery Boundaries

| Phase(s) | Natural cohesive seam        | Worktree                               | Branch                           | Delivery opportunity | Exact resulting `main` / rollback / feature-flag evidence                                                                                                                                                   |
| -------- | ---------------------------- | -------------------------------------- | -------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | Setup and baseline           | `worktrees/ose-id-init-01-foundation/` | `ose-id-init-01-foundation-base` | none                 | No `main` change; sanitized baseline and worktree identity prove setup only.                                                                                                                                |
| 1–7      | Complete local foundation    | `worktrees/ose-id-init-01-foundation/` | `ose-id-init-01-foundation-base` | PR at Phase 7        | Four build-valid projects, PostgreSQL migration/roles, truthful health, deterministic runner, and non-local pre-listener rejection land together; revert keeps additive migration history. No flag applies. |
| 8        | Post-merge audit and cleanup | —                                      | —                                | none                 | `origin/main` stays at the verified merge; terminal audit evidence and worktree removal change no product state.                                                                                            |

Numeric phase count does not define this boundary. A project shell without its local lifecycle and
non-local startup guard is not independently safe, while credential behavior is the next natural seam.

### Phase-Local Execution Defaults

Every checkbox and phase gate below inherits its phase row unless the checkbox supplies a stricter
owner, path, command, observation, evidence path, or failure route. An executor must not mark a checkbox
complete from prose review alone.

| Phase | Default owner                                                                                       | Bounded implementation paths                                                                                   | Copyable HIPPO/Nx verification                                                                                                                                                                                                                                                                            | Required observation and evidence                                                                                                                | Failure route                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Orchestrator                                                                                        | repository root, execution worktree, `local-tmp/ose-id-init-01-*`                                              | `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`                                                                                                                                                        | Exit 0 plus branch, HEAD, ports, dependency, license, and baseline records under `plans/in-progress/ose-id-init-01-foundation/evidence/phase-0/` | Preserve sanitized output and stop in Phase 0; amend the plan for unsupported tooling or port/contract drift.                                                         |
| 1     | Orchestrator; `specs-maker` for structure                                                           | `specs/apps/ose/id-be/**`, `specs/apps/ose/id-web/**`, four project `behaviour-coverage.json` files            | `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate` followed by `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e`              | Specs pass; only intentionally absent bindings are RED; commands and adapter ledger live under `evidence/phase-1/`.                              | Reopen the first contract/spec checkbox; unrelated or unexplained undefined bindings block Phase 2.                                                                   |
| 2     | `swe-csharp-dev` for backend; `swe-typescript-dev` for web; orchestrator for generated/shared files | `apps/ose-id-be/**`, `apps/ose-id-be-e2e/**`, `apps/ose-id-web/**`, `apps/ose-id-web-e2e/**`                   | `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t build --projects=ose-id-be,ose-id-web` then `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e` | RED identifies only the named absent behavior; GREEN and REFACTOR exit 0; save each cycle under `evidence/phase-2/{red,green,refactor}/`.        | Return to the failing RED/GREEN/REFACTOR checkbox; do not weaken or skip a target.                                                                                    |
| 3     | `swe-csharp-dev`; orchestrator owns migrations                                                      | `apps/ose-id-be/src/OseId.Infrastructure/Persistence/**`, `apps/ose-id-be-e2e/**`                              | `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e`                                                                                                                                                                                                        | Fresh/current migration, catalog, role, and forbidden-DDL results pass under `evidence/phase-3/`.                                                | Preserve sanitized database/container logs and reopen the first migration/privilege checkbox.                                                                         |
| 4     | `swe-csharp-dev` for health; E2E worker for lifecycle                                               | health code under `apps/ose-id-be/**`, runner/tests under `apps/ose-id-be-e2e/**` and `apps/ose-id-web-e2e/**` | `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:integration,test:e2e --projects=ose-id-be,ose-id-be-e2e,ose-id-web-e2e`                                                                                                                                           | Health/outage/recovery/two-instance/cleanup pass twice; save run IDs and sanitized matrices under `evidence/phase-4/`.                           | Reopen health for status/body drift or lifecycle for readiness/cleanup/affinity drift.                                                                                |
| 5     | Orchestrator; named API/UI/live testers own reports                                                 | delivered app/spec/doc/rule paths only                                                                         | `rtk ./hippo run --class transactional --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`                                                                                                                                                                                  | Manual HTTP/browser matrices and API/UI/rules reports are current-candidate PASS under `evidence/phase-5/`.                                      | Route API defects to the API subsection, UI defects to the UI subsection, and rule drift to Automatic Rule-Impact Coverage; reopen the earliest implementation phase. |
| 6     | Orchestrator                                                                                        | plan evidence, learnings, indexes, archive move                                                                | `rtk apps/rhino-cli/scripts/rhino-bin.sh plan validate` followed by `rtk apps/rhino-cli/scripts/rhino-bin.sh md links validate plans`                                                                                                                                                                     | Preliminary audit and archive/index/link proof under `evidence/phase-6/`; commit only after user authorization.                                  | Reopen the first unsupported delivery claim; do not archive with missing evidence.                                                                                    |
| 7     | Orchestrator                                                                                        | complete `origin/main...HEAD` delivery diff                                                                    | `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick,test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`                                                                                                      | Exact-head local/CI/leak/semantic-review evidence under `evidence/phase-7/`.                                                                     | Any repair changes HEAD and restarts Phase 7 from its first gate.                                                                                                     |
| 8     | Orchestrator                                                                                        | merged archive state, delivery branch, declared worktree                                                       | `rtk git merge-base --is-ancestor <merge-sha> origin/main` followed by `rtk git worktree list --porcelain`                                                                                                                                                                                                | Terminal PASS, containment, classification, and non-force cleanup proof in the external final report.                                            | Retain worktree/branch and reopen Phase 7 or the earliest audit failure; never force cleanup.                                                                         |

### PostgreSQL Persistence Contract

Phase 3 establishes the repository default for OSE-owned PostgreSQL data. EF Core remains migration
tooling only. Runtime reads/writes use Npgsql connections and transactions through SqlKata's
PostgreSQL compiler plus `SqlKata.Execution`; repositories use explicit projections, bound
parameters, cancellation tokens, bounded command timeouts, and explicit transactions for multi-write
invariants. Runtime production paths forbid EF change tracking, LINQ-to-database queries, and
`SELECT *`. Later Identity work may use ASP.NET Core Identity hashing/validation primitives only,
never its EF store or `UserManager` persistence. Phase 3 adds compiled-SQL snapshot/contract tests,
PostgreSQL catalog/index assertions, bounded-row/query-count checks, and synthetic-fixture `EXPLAIN`;
`EXPLAIN ANALYZE` is allowed only against isolated safe synthetic data. Run
`ose-id-be:test:unit`, `ose-id-be:test:integration`, and `ose-id-be-e2e:test:e2e` through HIPPO and
store SQL snapshots, parameters-with-values-redacted, catalog rows, plans, row bounds, and exits at
`evidence/phase-3-persistence/`. A string-interpolated value, missing timeout/cancellation, sequential
write outside an explicit transaction, table-wide projection, unbounded/N+1 plan, or EF runtime query
reopens Phase 3 and blocks every later plan.

### Mandatory Nx Quality Matrix

The full green matrix is mandatory as the completion gate of the first implementation phase (Phase 2)
and for every later implementation, final local-quality, exact-head delivery/PR, and post-merge gate.
It is not a Phase 0 or Phase 1 success criterion. Before creating any Plan 01 scenario, binding, or
test, Phase 0 and Phase 1 each run this exact predecessor-green baseline while the four new projects do
not yet exist:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD
```

After Phase 2's first completed implementation packet, run production `build` only for the
compiled/bundled owner applications and run the three real applicable gates for all four projects:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t build --projects=ose-id-be,ose-id-web
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e
```

The Phase 0 sibling inventory and Phase 2 scaffold must prove these are real targets, never echo,
no-op, success-sentinel, or duplicate aliases. `ose-id-be` requires
`<Nullable>enable</Nullable>`; its Nx `typecheck` runs the .NET compiler with
`/p:TreatWarningsAsErrors=true`, while Nx `lint` runs Roslyn analyzer verification and
`dotnet format --verify-no-changes`. `ose-id-web` uses strict TypeScript, a no-emit `tsc --noEmit`
typecheck, and ESLint. The TypeScript E2E projects also use no-emit typechecks and their repository-
standard real lint targets, but intentionally omit `build` because they produce no deployable bundle.
Each Phase 2-and-later gate stores the two exit-code transcripts at its phase evidence destination as
`nx-quality.txt`; any missing target, nonzero exit, nullable/warning/analyzer drift, emitted
typecheck artifact, or ESLint failure reopens that gate and blocks progression. Phase 1 first records
the green predecessor baseline, then runs only its explicitly named static-coverage and RED test
commands. A nonzero result is nonblocking only when it is the declared missing Plan 01 behavior in the
recorded RED ledger; a baseline failure, target/configuration failure, or any other failure blocks Phase 2.

## Phase 0: Environment Setup and Baseline

**Input:** in-progress plan on `origin/main`, repository access, and no implementation started.
**Outcome:** matching worktree, current dependencies, verified generators/ports/licenses, and green baselines.
**Proof:** sanitized command outputs in `plans/in-progress/ose-id-init-01-foundation/evidence/phase-0/`.

- [ ] [AI] From the primary repository root, run `rtk git fetch origin` and
      `rtk git worktree list --porcelain`; provision/enter `worktrees/ose-id-init-01-foundation/` from
      current `origin/main` using the repository worktree setup procedure. Record branch name, 40-character
      HEAD, creator/session, UTC timestamp, and command in the branch inventory. Stop if another worktree
      is already registered for this plan.
- [ ] [AI] Inside the resolved worktree, run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm install` and
      `rtk npm run doctor -- --fix` (the wrapper admits Doctor transactionally through HIPPO);
      acceptance: both exit 0 and `rtk git status --short` contains no
      secret or unexplained generated change.
- [ ] [AI] Inspect generators and nearest projects with
      `rtk npm exec nx -- show projects`, `rtk rg -n "net10.0|CSharp|Next.js" apps project.json`, and
      `rtk rg -n "test:e2e|test:integration|test:quick" repo-governance apps`; record selected sibling
      patterns and exact commands. If .NET 10/C# 14 is unsupported by repository tooling, stop and amend
      this plan instead of silently downgrading.
- [ ] [AI] Inspect `docs/reference/web-sites.md`, `repo-config.yml`, and the Nx graph using
      `rtk rg -n "ose-id|port|environment" docs/reference/web-sites.md repo-config.yml` and
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- graph --file=local-tmp/ose-id-init-01-graph.json`;
      verify `OSE_ID_WEB_PORT=3500`, `OSE_ID_BE_PORT=8501`, and `OSE_ID_POSTGRES_PORT=5438` remain
      unclaimed and store the ignored graph outside evidence. A collision stops execution and amends the
      plan; do not choose a replacement silently.
- [ ] [AI] Resolve exact backend/frontend/PostgreSQL dependencies, then verify their licenses from
      installed package metadata and official upstream license files. Save a sanitized table naming
      package, version, license, source, and disposition; acceptance: OSE-authored code remains MIT and
      no mandatory identity-vendor fee or incompatible license is introduced.
- [ ] [AI] Run the current repository baselines through HIPPO:
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`
      plus the nearest C# and Next.js project quick targets discovered above. Diagnose every failure at
      root cause; do not retry, widen, skip, quarantine, or continue with red baseline.

### Phase 0 Gate

- [ ] [AI] Re-run the recorded install/doctor/baseline commands; acceptance: all exit 0, the worktree is
      current with `origin/main`, fixed ports 3500/8501/5438 are unclaimed, and license evidence is complete.

> **Pause Safety:** no implementation exists in this worktree and the baseline is reproducible. Safe to
> stop. To resume, rerun the recorded Phase 0 baseline command.

---

## Phase 1: Canonical Specs and Architecture Contract

**Input:** AC-FND-01..08, Phase 0 paths, and current specs convention.
**Outcome:** static Gherkin and architecture define behavior before adapters exist.
**Proof:** specs validation passes; static behavior coverage is RED only for intentionally absent bindings.

- [ ] [AI] **Owner: `specs-maker`; canonical feature structure.** Create the owner-based
      `specs/apps/ose/id-be/` and `specs/apps/ose/id-web/` corpora and add
      indexed `.feature` files for AC-FND-01..08. Use behavior subfolders such as `health/` inside those
      owners when useful; never create a phase-named owner such as `id-foundation/`. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate`;
      acceptance: structure passes and each durable scenario title maps one-to-one through the plan-only
      requirement table to `prd.md`; no plan ID or positive layer tag enters a feature file. Save the
      command, exit code, and scenario/path inventory at `evidence/phase-1/specs.txt`; any parser,
      ownership, duplicate-title, or plan-language finding returns to this checkbox before contract work.
- [ ] [AI] **Owner: backend contract lane; foundation OpenAPI and web contract.** Implement every
      ADD/UPDATE/DELETE/RETAIN method/path row, schema, error, and security rule in
      `tech-docs/006-api-contract-delta.md` as `specs/apps/ose/id-be/contracts/openapi.yaml`, plus the
      documented web HTML contract in `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`.
      Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec redocly -- lint specs/apps/ose/id-be/contracts/openapi.yaml`;
      acceptance: exit 0, all operation IDs are app/domain-scoped, disabled-capability rows match Gherkin,
      and no unlisted API appears. Save the lint transcript and semantic path/method inventory at
      `evidence/phase-1/openapi.txt`; any missing/extra operation or schema error returns to this checkbox.
- [ ] [AI] **Owner: architecture lane; C4, hexagonal dependency, and route/config/health views.** Add
      accessible architecture diagrams plus route/config/health schema documents under
      `specs/apps/ose/id-be/architecture/` and
      `specs/apps/ose/id-web/architecture/`, following the nearest app architecture precedent. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh md mermaid validate specs/apps/ose`;
      acceptance: exit 0; the backend view maps Domain, Application, inbound adapters, outbound adapters,
      and Host/composition with inward dependencies; Plan 01 REST health is current, Plan 04 OIDC is
      planned next, and GraphQL/Model Context Protocol are future non-delivered seams; every new diagram passes title,
      description, contrast, and width checks.
      Save the transcript and exact architecture-file inventory at `evidence/phase-1/architecture.txt`;
      any accessibility or scope finding returns to the owning diagram before adapter work.
- [ ] [AI] **Owner: test integrator; initial RED binding ledger.** Run
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e`
      and save the undefined-binding list as `evidence/phase-1/red-bindings.txt`. Acceptance: only the
      eight new foundation scenario groups are RED; duplicate, unused, ambiguous, and unrelated undefined
      bindings are zero. Any unrelated or structurally invalid finding returns to the owning specs checkbox;
      missing new bindings continue only to the adapter-map checkbox.
- [ ] [AI] **Owner: test integrator; adapter maps.** Implement the exact scenario/action/adapter map in
      `tech-docs/005-bdd-spec-delta-and-adapter-map.md`: create the four project-local
      `behaviour-coverage.json` files, bind every scenario once at Unit and every boundary-applicable
      Integration/E2E layer, and encode any future exemption only on its exact scenario with a valid
      boundary reason and alternative proof. Rerun
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e`;
      acceptance: exit 0 and recursive corpus, adapters, bindings, and exemptions close with no orphan,
      duplicate, ambiguous, or unused step. Save the transcript and exact adapter inventory at
      `evidence/phase-1/adapter-map.txt`; any failure returns to the exact feature or adapter map row.

### Phase 1 Gate

- [ ] [AI] Verify `evidence/phase-1/` contains the immediately preceding green predecessor baseline and
      its command/target records before the first Plan 01 scenario, binding, or test. Inspect the isolated
      RED ledger: only named absent Plan 01 behavior may be nonzero; a baseline, target/configuration, or
      unrelated failure blocks Phase 2. Do not require the full green matrix until Phase 2 completes.
- [ ] [AI] **Owner: Phase 1 integrator; contract gate.** Rerun the exact specs, Redocly, Mermaid, and
      four-project static behavior-coverage commands above. Acceptance: every command exits 0, the
      OpenAPI path/method inventory equals `tech-docs/006-api-contract-delta.md`, and
      `evidence/phase-1/specs.txt`, `evidence/phase-1/openapi.txt`,
      `evidence/phase-1/architecture.txt`, `evidence/phase-1/adapter-map.txt`, plus the resolved RED ledger
      are current. Save the combined gate record at `evidence/phase-1/gate.txt`; any mismatch reopens its
      first owning Phase 1 checkbox and blocks Phase 2.

> **Pause Safety:** reviewable contracts exist with no runtime changes. Safe to stop. To resume, rerun
> the Phase 1 static behavior coverage command and compare the binding ledger.

---

## Phase 2: Four Project Scaffolds and Disabled Runtime

**Input:** Phase 1 contracts and Phase 0 generator evidence.
**Outcome:** all four projects compile with production-disabled guards and no identity routes.
**Proof:** focused RED/GREEN/REFACTOR outputs for AC-FND-04, AC-FND-06, and AC-FND-07.

### AC-FND-04 and AC-FND-06 — Safe backend/web hosts

- [ ] [AI] **RED:** generate only the four minimal project/test shells at the Phase 0-confirmed paths,
      then add tests for Local/Test acceptance, missing/unknown/Staging/Production rejection, and absent
      account/token/company/admin routes. Run each new project's `test:quick`; acceptance: tests fail
      because the runtime guard and route inventory do not exist. Save output under `evidence/phase-2-red/`.
      _Suggested executors: `swe-csharp-dev`, `swe-typescript-dev`._
- [ ] [AI] **GREEN:** implement the startup-mode parser/guard in `apps/ose-id-be/` and
      `apps/ose-id-web/`, remove sample endpoints/pages, and add the local disabled-status shell. Rerun
      both `test:quick` targets; acceptance: allowed and denied branches plus route-negative tests pass.
- [ ] [AI] **REFACTOR:** align namespaces, nullable/warnings-as-errors, TypeScript strictness, tags,
      public APIs, project target names, and README/env-example content with the selected siblings. Add
      architecture tests or equivalent project-boundary checks proving Domain has no framework/data/
      transport dependency and Application exposes no ASP.NET, EF, OpenIddict, GraphQL, or MCP type.
      Record the exact logical-ring-to-project/namespace map in backend architecture docs. Run the
      Phase 2 Mandatory Nx Quality Matrix; acceptance: both application builds and every project's
      applicable `typecheck`, `lint`, and `test:quick` exit 0, no generated sample remains, no
      speculative GraphQL/MCP dependency or adapter exists, and forbidden outward dependencies fail the
      focused architecture test.

### AC-FND-07 — Accessible status shell

- [ ] [AI] **RED:** in `apps/ose-id-web-e2e/`, add keyboard, 320px viewport, heading, named status-region,
      and non-color-only assertions. Run its focused E2E target; acceptance: failure identifies absent
      semantic status content, not environment startup.
- [ ] [AI] **GREEN:** build the shell with existing OSE UI/tokens in `apps/ose-id-web/`; rerun focused
      E2E and component tests; acceptance: all accessibility assertions pass without introducing auth UI.
- [ ] [AI] **REFACTOR:** remove duplicate status styles/components and run web build/typecheck/lint/quick/E2E;
      acceptance: behavior and accessible names remain stable.

### Phase 2 Gate

- [ ] [AI] Run the Phase 2 Mandatory Nx Quality Matrix and the focused web E2E target through HIPPO;
      acceptance: both application builds and all four projects' real typecheck/lint/quick targets are
      green, production modes fail closed in tests, and identity route inventory is empty.

> **Pause Safety:** four inert, build-valid projects exist and cannot serve in production-like modes.
> Safe to stop. To resume, rerun all four projects' quick targets.

---

## Phase 3: PostgreSQL, Migrations, and Privilege Boundaries

**Input:** backend host, AC-FND-02/03/08, and resolved PostgreSQL/Npgsql versions.
**Outcome:** forward migration, universal audit metadata, and least-privilege readiness work against owned PostgreSQL.
**Proof:** fresh/current database, complete catalog, and privilege/hard-delete-negative backend E2E evidence.

### AC-FND-03 — Migration and application roles

- [ ] [AI] **RED:** add backend E2E cases under `apps/ose-id-be-e2e/` that apply an empty-schema
      migration twice, start with the application role, and attempt create/alter/drop/grant operations.
      Add Unit/Integration contracts in the Phase 0-discovered backend test paths for the
      Npgsql/SqlKata persistence seam: compiled SQL uses the PostgreSQL compiler, names every projected
      column, binds every value, propagates cancellation, applies a bounded command timeout, and has no
      EF change-tracking, LINQ-to-database, or `SELECT *` runtime path. Run the focused Unit,
      Integration, and E2E targets; acceptance: they fail only because roles, migration, and the
      persistence seam do not exist, with no connection string printed. Save outputs to
      `evidence/phase-3-red/`; setup or unrelated failures are fixed before GREEN.
- [ ] [AI] **GREEN:** add minimal EF Core migration tooling, the Npgsql/SqlKata runtime persistence seam,
      and owned E2E PostgreSQL bootstrap
      at `apps/ose-id-be/src/OseId.Infrastructure/Persistence/Migrations/` with separate bootstrap,
      migration, and application roles. Create only the physical history table/columns/PK/owner/grants
      in `tech-docs/002-runtime-persistence-and-statelessness.md`. Apply the six-column audit envelope,
      named lifecycle constraints, `BEFORE DELETE` guard, and `ON DELETE RESTRICT` policy from
      `tech-docs/007-database-audit-and-soft-delete-contract.md` to the migration-history table before
      serving; grant the application role only active-row `SELECT`, never `DELETE`. Rerun focused E2E;
      acceptance: migration succeeds, a real SQL `DELETE` of migration history fails, the immutable row
      remains visible to readiness, and every forbidden DDL probe is denied. No test-only lifecycle
      command or route may be introduced because foundation metadata has no removal lifecycle.
- [ ] [AI] **REFACTOR:** remove placeholder entities/tables, centralize configuration validation, and
      add committed compiled-SQL snapshots plus catalog assertions for the foundation seam. Unit proof
      must show insert/update actor stamping, immutable history policy, and explicit `deleted_at IS NULL`; Integration
      must inventory all six fields, constraints, guards, FK actions, and grants; E2E must prove the
      built-service readiness plus serving-role delete rejection and retained row evidence for AC-FND-08
      with no layer exemption. The first real soft-delete lifecycle is exercised in Plan 02. Capture
      bounded-row and index evidence with PostgreSQL catalog queries and synthetic `EXPLAIN`; use
      `EXPLAIN ANALYZE` only for safe synthetic data. Run the Phase 3 Mandatory Nx Quality Matrix plus
      backend Integration and E2E targets. Acceptance: snapshots prove explicit projections, bound
      parameters, timeouts, and cancellation; the schema contains only migration/foundation metadata;
      planned row bounds are met; and sanitized evidence records stable schema digests.
- [ ] [AI] Generate and compare old/new PostgreSQL catalog manifests covering every column type,
      nullability, default, PK/index, owner, and grant; record explicit no-backfill/no-contract rows,
      zero domain-data before/after, old-code/new-schema PASS, new-code/old-schema fail-closed, rollback,
      and forward-fix proof under `evidence/phase-3-schema/`.

### Phase 3 Gate

- [ ] [AI] Recreate PostgreSQL from empty storage and rerun migration/current-schema/privilege tests;
      acceptance: green twice consecutively, `evidence/phase-3-persistence/` proves the SqlKata/Npgsql
      contract and absence of any EF runtime query path, and no container/volume survives the E2E target.

> **Pause Safety:** durable behavior is limited to an empty versioned schema with least privilege. Safe
> to stop. To resume, rerun the backend E2E migration target against a fresh owned database.

---

## Phase 4: Health, Statelessness, and Local Runner

**Input:** project hosts, PostgreSQL boundary, AC-FND-01/02/05.
**Outcome:** truthful health plus owned readiness-driven lifecycle and multi-instance proof.
**Proof:** outage/recovery, no-affinity, failure-path cleanup, and two clean consecutive runs.

### AC-FND-02 — Truthful health

- [ ] [AI] **RED:** add Unit/Integration/backend-E2E tests for liveness independence, readiness config/
      database/schema codes, outage and recovery, and response redaction. Run focused targets; acceptance:
      tests fail on missing health mapping and save sanitized RED output.
- [ ] [AI] **GREEN:** implement allowlisted `/health/live` and `/health/ready` handlers in
      `apps/ose-id-be/`; rerun focused targets. Acceptance: HTTP/body states match PRD and PostgreSQL
      recovery does not require backend restart.
- [ ] [AI] **REFACTOR:** isolate health application ports from persistence/HTTP details, prove no EF
      runtime query/change-tracking path exists, and run backend regression
      targets; acceptance: no exception/connection/host-path data appears in responses or logs.

### AC-FND-01 and AC-FND-05 — Owned lifecycle and no affinity

- [ ] [AI] **RED:** add runner E2E cases for normal startup, failure at each stage, signal termination,
      collision, two parallel run IDs, two backend instances, and empty final inventory. Run the new
      stack target; acceptance: failure is caused only by absent orchestration.
- [ ] [AI] **GREEN:** implement the current-convention Nx/script runner in the owning E2E project with
      bounded readiness, earliest-failure preservation, reverse cleanup, ownership labels, and
      alternating A/B backend dispatch. Acceptance: each scenario passes without sleep or assertion retry.
- [ ] [AI] **REFACTOR:** deduplicate lifecycle primitives without moving network/container use into Unit
      or Integration. Run backend/web E2E twice; acceptance: identical results and no owned resources remain.

### Phase 4 Gate

- [ ] [AI] Run the delivered standalone local stack, outage/recovery suite, failure-path suite, and
      two-instance suite twice; acceptance: every readiness transition is observed and final inventory is empty.

> **Pause Safety:** the complete local foundation starts and cleans deterministically, while remaining
> identity-inert. Safe to stop. To resume, rerun the full-stack E2E target.

---

## Phase 5: Repository Rules, Documentation, and Manual Verification

**Input:** complete foundation behavior and actual project/port/target changes.
**Outcome:** canonical registries, enforcement, docs, and manual proof agree with implementation.
**Proof:** rules-propagation manifest, rendered diagrams, sanitized curl/browser evidence.

### Automatic Rule-Impact Coverage

- [ ] [AI] Inventory project names/tags, dependency edges, target/test boundaries, ports, environment
      names, app/spec indexes, and any normative wording across `AGENTS.md`, `repo-governance/`,
      `repo-config.yml`, `.claude/`, `.opencode/`, `apps/rhino-cli/`, and `docs/reference/`. Save normalized
      intake under `local-tmp/rules-propagation/ose-id-init-01-intake.md`.
- [ ] [AI] Classify conflicts/duplicates and place each fact in the narrowest existing canonical source;
      edit only the file-impact paths justified by the inventory. Record enforcement disposition for every fact.
- [ ] [AI] If a hand-authored harness source changed, run the repository binding dry-run and
      `rtk npm run generate:bindings`; otherwise record `not applicable` with proof. Never hand-edit generated mirrors.
- [ ] [AI] Run repo-config, dependency-boundary, port/environment, test-boundary, docs/index, binding-sync,
      and rules-quality gates discovered by the rules-propagation workflow. Save a sanitized manifest with
      canonical placement, enforcement, generation, verification, sibling obligation, and
      `final-status: partial` pending delivery.

### Documentation and manual proof

- [ ] [AI] Update the four project READMEs and affected reference/index files with exact delivered
      commands, responsibilities, runtime guard, health meanings, local resources, and cleanup. Run
      Markdown lint, heading, link, and Mermaid validators on changed documentation; acceptance: all pass.
- [ ] [AI] Follow `tech-docs/003-local-stack-and-verification.md` manually. Save sanitized liveness,
      readiness, outage/recovery, route-negative, two-instance, accessible web, and empty-inventory proof
      under `evidence/manual/`. Delete temporary raw logs/config after extracting allowed evidence.

### Copyable HTTP Verification

The E2E worker owns the fixture profiles and the orchestrator owns the manual run. Before this phase,
`apps/ose-id-be-e2e/project.json` must expose `serve` with profiles `foundation-ready`,
`foundation-postgres-down`, and `foundation-backend-down`; every profile binds only the documented local
ports, seeds no domain rows, prints a run ID, waits for the declared state, and cleans its owned resources
on termination. Run each profile in Terminal A through:

```bash
rtk ./hippo run --class service --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=foundation-ready
```

In Terminal B, run the following block from the execution-worktree root. It contains no credential,
cookie, capability, or other secret. `record_probe` retains only allowlisted metadata; raw bodies and
headers stay under `local-tmp/` and are deleted by the owned runner after the assertions.

```bash
set -eu
OSE_FND_VERIFY_DIR="local-tmp/ose-id-init-01-http"
OSE_FND_EVIDENCE="plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/manual-http-matrix.txt"
rtk mkdir -p "$OSE_FND_VERIFY_DIR" "$(dirname "$OSE_FND_EVIDENCE")"
: > "$OSE_FND_EVIDENCE"

probe() {
  OSE_FND_LABEL="$1"
  OSE_FND_METHOD="$2"
  OSE_FND_URL="$3"
  OSE_FND_EXPECTED_STATUS="$4"
  OSE_FND_EXPECTED_MEDIA="$5"
  OSE_FND_EXPECTED_FIELD="$6"
  OSE_FND_EXPECTED_VALUE="$7"
  shift 7
  OSE_FND_HEADERS="$OSE_FND_VERIFY_DIR/$OSE_FND_LABEL.headers"
  OSE_FND_BODY="$OSE_FND_VERIFY_DIR/$OSE_FND_LABEL.body"
  OSE_FND_STATUS="$(rtk curl --silent --show-error --request "$OSE_FND_METHOD" --dump-header "$OSE_FND_HEADERS" --output "$OSE_FND_BODY" --write-out '%{http_code}' "$@" "$OSE_FND_URL")"
  test "$OSE_FND_STATUS" = "$OSE_FND_EXPECTED_STATUS"
  rtk rg -q "^Content-Type: $OSE_FND_EXPECTED_MEDIA" "$OSE_FND_HEADERS"
  rtk rg -q '^X-Correlation-ID:' "$OSE_FND_HEADERS"
  rtk node -e 'const fs=require("fs");const value=JSON.parse(fs.readFileSync(process.argv[1],"utf8"))[process.argv[2]];if(String(value)!==process.argv[3])process.exit(1)' "$OSE_FND_BODY" "$OSE_FND_EXPECTED_FIELD" "$OSE_FND_EXPECTED_VALUE"
  rtk awk -v label="$OSE_FND_LABEL" -v method="$OSE_FND_METHOD" -v status="$OSE_FND_STATUS" 'BEGIN { print label " " method " status=" status " headers=content-type,cache-control,x-correlation-id body=validated" }' >> "$OSE_FND_EVIDENCE"
}

probe_no_capability() {
  OSE_FND_LABEL="$1"
  OSE_FND_METHOD="$2"
  OSE_FND_URL="$3"
  OSE_FND_HEADERS="$OSE_FND_VERIFY_DIR/$OSE_FND_LABEL.headers"
  OSE_FND_BODY="$OSE_FND_VERIFY_DIR/$OSE_FND_LABEL.body"
  OSE_FND_STATUS="$(rtk curl --silent --show-error --request "$OSE_FND_METHOD" --dump-header "$OSE_FND_HEADERS" --output "$OSE_FND_BODY" --write-out '%{http_code}' "$OSE_FND_URL")"
  test "$OSE_FND_STATUS" = "404"
  if rtk rg -q 'capability_disabled' "$OSE_FND_BODY"; then exit 1; fi
  rtk awk -v label="$OSE_FND_LABEL" -v method="$OSE_FND_METHOD" 'BEGIN { print label " " method " status=404 body=ordinary-route-not-found" }' >> "$OSE_FND_EVIDENCE"
}

probe live-success GET http://127.0.0.1:8501/health/live 200 application/json status live
probe ready-success GET http://127.0.0.1:8501/health/ready 200 application/json status ready
probe oidc-disabled GET http://127.0.0.1:8501/connect/authorize 404 application/problem+json code capability_disabled
probe_no_capability oidc-method-error POST http://127.0.0.1:8501/connect/authorize
probe token-disabled POST http://127.0.0.1:8501/connect/token 404 application/problem+json code capability_disabled --header 'Content-Type: application/x-www-form-urlencoded' --data 'grant_type=authorization_code'
probe_no_capability token-method-error GET http://127.0.0.1:8501/connect/token
probe google-disabled GET http://127.0.0.1:8501/external/google/challenge 404 application/problem+json code capability_disabled
probe_no_capability google-method-error POST http://127.0.0.1:8501/external/google/challenge
probe scim-disabled POST http://127.0.0.1:8501/scim/v2/Users 404 application/problem+json code capability_disabled --header 'Content-Type: application/scim+json' --data '{}'
probe_no_capability scim-method-error GET http://127.0.0.1:8501/scim/v2/Users
probe platform-admin-disabled GET http://127.0.0.1:8501/platform/admin/companies 404 application/problem+json code capability_disabled
probe_no_capability platform-admin-method-error POST http://127.0.0.1:8501/platform/admin/companies

OSE_FND_WEB_HEADERS="$OSE_FND_VERIFY_DIR/web-success.headers"
OSE_FND_WEB_BODY="$OSE_FND_VERIFY_DIR/web-success.body"
OSE_FND_WEB_STATUS="$(rtk curl --silent --show-error --dump-header "$OSE_FND_WEB_HEADERS" --output "$OSE_FND_WEB_BODY" --write-out '%{http_code}' http://127.0.0.1:3500/)"
test "$OSE_FND_WEB_STATUS" = "200"
rtk rg -q '^Content-Type: text/html; charset=utf-8' "$OSE_FND_WEB_HEADERS"
rtk rg -q '^Cache-Control: no-cache' "$OSE_FND_WEB_HEADERS"
rtk rg -q 'OSE ID service status' "$OSE_FND_WEB_BODY"
rtk awk 'BEGIN { print "web-success GET status=200 headers=content-type,cache-control body=status-shell" }' >> "$OSE_FND_EVIDENCE"
```

Stop Terminal A, confirm its cleanup, then run the PostgreSQL-down profile in Terminal A and execute:

```bash
rtk ./hippo run --class service --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=foundation-postgres-down
```

After Terminal A reports the expected state, continue in the same Terminal B shell used above:

```bash
set -eu
OSE_FND_STATUS="$(rtk curl --silent --show-error --dump-header local-tmp/ose-id-init-01-http/ready-error.headers --output local-tmp/ose-id-init-01-http/ready-error.body --write-out '%{http_code}' http://127.0.0.1:8501/health/ready)"
test "$OSE_FND_STATUS" = "503"
rtk rg -q '^Content-Type: application/problem+json' local-tmp/ose-id-init-01-http/ready-error.headers
rtk rg -q '^Cache-Control: no-store' local-tmp/ose-id-init-01-http/ready-error.headers
rtk rg -q '^X-Correlation-ID:' local-tmp/ose-id-init-01-http/ready-error.headers
rtk node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if(x.code!=="database_unavailable")process.exit(1)' local-tmp/ose-id-init-01-http/ready-error.body
```

The liveness operation defines no dependency-derived HTTP error. While the same PostgreSQL-down profile
is running, repeat `GET /health/live`; then stop Terminal A, wait for its cleanup message, and require
curl status `000` with no fabricated HTTP response:

```bash
probe live-postgres-down GET http://127.0.0.1:8501/health/live 200 application/json status live
OSE_FND_STATUS="$(rtk curl --silent --show-error --output local-tmp/ose-id-init-01-http/live-absent.body --write-out '%{http_code}' http://127.0.0.1:8501/health/live || true)"
test "$OSE_FND_STATUS" = "000"
test ! -s local-tmp/ose-id-init-01-http/live-absent.body
```

Run `foundation-backend-down` in Terminal A:

```bash
rtk ./hippo run --class service --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=foundation-backend-down
```

After Terminal A reports the expected state, continue in Terminal B:

```bash
set -eu
OSE_FND_STATUS="$(rtk curl --silent --show-error --dump-header local-tmp/ose-id-init-01-http/web-error.headers --output local-tmp/ose-id-init-01-http/web-error.body --write-out '%{http_code}' http://127.0.0.1:3500/)"
test "$OSE_FND_STATUS" = "503"
rtk rg -q '^Content-Type: text/html; charset=utf-8' local-tmp/ose-id-init-01-http/web-error.headers
rtk rg -q '^Cache-Control: no-cache' local-tmp/ose-id-init-01-http/web-error.headers
if rtk rg -q 'stack trace|connection string|127\.0\.0\.1:8501|/Users/|/home/|C:\\' local-tmp/ose-id-init-01-http/web-error.body; then exit 1; fi
```

- [ ] [AI] Run all three profiles and blocks exactly. Acceptance: every added HTTP method/path has its
      contracted result and representative method/error boundary; health covers ready, dependency-down,
      dependency-independent liveness, and connection absence; the web covers `200` and sanitized `503`;
      required media/cache/correlation headers and body fields match; the runner cleanup inventory is
      empty. Save only the allowlisted matrix and runner run IDs under `evidence/phase-5/`. Any mismatch
      reopens Phase 4; a disabled-route mismatch reopens Phase 2. Do not continue to the API gate.

### Mandatory API Quality Gate

- [ ] [AI] Before the Phase 5 gate, execute the complete
      [API Quality Gate](../../../repo-governance/workflows/api/api-quality-gate.md) in `strict` mode.
      Its immutable scope is the running `http://127.0.0.1:8501` backend, `GET /health/live`,
      `GET /health/ready`, the five disabled-capability method/path pairs in
      `tech-docs/006-api-contract-delta.md`, and matching foundation Gherkin. Its machine-readable
      contract input is exactly the OpenAPI 3.1.0 file
      `specs/apps/ose/id-be/contracts/openapi.yaml`; prose and Gherkin cannot substitute for it. Start a
      fresh owned stack and confirm base-URL reachability plus empty domain state before tester delegation.
- [ ] [AI] Invoke the agent at `.claude/agents/general/api-exploratory-tester.md` for workflow discovery
      with `output-mode: delivery`,
      `plan-path: plans/in-progress/ose-id-init-01-foundation`, the exact scope above, and
      `max-concurrency: 3`. It appends every `AET-###` finding as an unchecked delivery checkbox. Save
      the sanitized request/response matrix, tester report, OpenAPI comparison, run ID, and resource
      inventory under `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/api-quality-gate/`.
- [ ] [AI] If discovery has an in-threshold defect, triage it against `strict`, delegate one bounded fix
      pass to `swe-csharp-dev`, run the affected Unit/Integration/E2E and OpenAPI gates, rebuild/restart
      the same stack once, then invoke `.claude/agents/general/api-exploratory-tester.md` in scoped
      verification mode over every
      original finding plus affected-API regressions. Tick a finding only with passing retest evidence.
      `partial`, `fail`, a regression, or pending lifecycle evidence blocks Phase 5 and reopens the
      earliest implementation phase; never waive, retry, or start an unbounded second fix loop.

### Mandatory Static and Live UI Gates

- [ ] [AI] Execute the complete
      [UI Quality Gate](../../../repo-governance/workflows/ui/ui-quality-gate.md) in `strict` mode with
      scope `apps/ose-id-web/` and `apps/ose-id-web-e2e/`, including the status component, error state,
      responsive 320-pixel layout, accessibility semantics, tokens, and dark mode. Invoke
      `swe-ui-checker`; if it reports an in-threshold finding, invoke `swe-ui-fixer` for the workflow's
      single bounded fix pass, rerun affected component/Unit/E2E checks, then invoke the checker for
      scoped verification. Save the report and sanitized verification proof under
      `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/ui-quality-gate/`. Only
      `final-status: pass` with `lifecycle-status: verified` proceeds.
- [ ] [AI] Against the same running `http://127.0.0.1:3500/` status shell, execute the
      [Web UX Test-Fixing Planning workflow](../../../repo-governance/workflows/web/web-ux-test-fixing-planning.md)
      in its required order: `.claude/agents/web/web-exploratory-tester.md`, then
      `.claude/agents/web/web-usability-tester.md`, then
      `.claude/agents/web/web-design-tester.md`. Give each `output-mode: delivery`,
      `plan-path: plans/in-progress/ose-id-init-01-foundation`, and scope covering ready,
      PostgreSQL-unavailable, backend-unavailable, keyboard/screen-reader, 320-pixel, and supported
      desktop/dark-mode states. Store sanitized screenshots/reports under
      `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/web-live-gates/`.
- [ ] [AI] Before delegating the three live reviews, perform the Rule-9 manual browser pass against the
      built shell—not a dev-server substitute. Use the browser driver operations named
      `browser_navigate` to open `http://127.0.0.1:3500/`, `browser_snapshot` after each ready/loading/
      dependency-failure/restored transition, `browser_console_messages` at level `warning` and above,
      and `browser_take_screenshot` for each candidate state at 320, 375, 768, 1024, 1280, and 1440 CSS
      pixels in light and dark mode. Repeat keyboard-only navigation, 200% zoom, and the repository's
      supported default and pseudo/long-string locales. Acceptance: selected Option A matches the PRD,
      use `browser_click` on `Refresh status` in every ready/dependency-failure/restored state and take a
      second snapshot after each live-region update; no clipping or horizontal scroll occurs, focus
      order/visible focus/live announcements are correct,
      console findings are zero, and every screenshot/snapshot/console transcript is stored beneath
      `evidence/phase-5/web-live-gates/manual-browser/` with run ID, build SHA, viewport, locale, and state.
- [ ] [AI] Append every `EWT-###`, `UWT-###`, and `DWT-###` defect as its own unchecked delivery task;
      append each `SG-###`/`USS-###` proposal separately. Route validated source fixes to
      `swe-typescript-dev` or `swe-ui-fixer`, rebuild the status shell, and rerun the affected state plus
      the full smoke. Every defect must be fixed and checked with retest evidence; proposals need an
      explicit disposition. Any unresolved defect, missing rule-1 rendered visual sign-off, tester
      technical failure, or regression blocks Phase 5 and reopens the earliest responsible phase.

### Phase 5 Gate

- [ ] [AI] Re-run rule gates and the manual runbook from a clean stack; acceptance: docs match observed
      commands, no secret/absolute path is recorded, and propagation has no unresolved finding.
- [ ] [AI] Confirm the API and UI workflows both report `final-status: pass` and
      `lifecycle-status: verified`, rule-1 rendered visual sign-off is recorded, the three live tester
      passes cover every declared state, and no unchecked `AET/EWT/UWT/DWT` defect remains. Archival is
      forbidden until this evidence exists on the current candidate.

> **Pause Safety:** implementation and repository contracts are reconciled with repeatable evidence.
> Safe to stop. To resume, rerun the documented local stack smoke target and rules-quality gate.

---

## Phase 6: Knowledge Capture, Preliminary Audit, and Archival Commit

**Input:** complete implementation, manual evidence, reconciled rules, and `learnings.md`.
**Outcome:** reusable knowledge is triaged; the preliminary audit passes; the plan move and every index/reference update are committed on the delivery branch before final review.
**Proof:** learning dispositions, preliminary audit matrix, resolved completion date, full archive diff, and delivery-branch commit SHA.

### Knowledge Capture

- [ ] [AI] Review every entry in `plans/in-progress/ose-id-init-01-foundation/learnings.md`. Promote general knowledge to its narrow durable owner, link duplicates, and justify plan-specific dispositions. If no entry exists, append an explicit reviewed/none disposition. Run affected Markdown, link, and rules gates; acceptance: every entry has exactly one disposition.
- [ ] [AI] Reconcile any durable documentation/rule edit with the file-impact ledger before continuing. Acceptance: no newly discovered path or rule change remains unplanned.

### Preliminary Delivery Audit

- [ ] [AI] Trace AC-FND-01..08, approved scope, every file-impact row, physical schema/migration proof, old-code/new-schema compatibility, no-loss manifests, runtime guard, rollback/forward-fix, automated/manual evidence, rules propagation, license record, and Knowledge Capture into `plans/in-progress/ose-id-init-01-foundation/evidence/preliminary-delivery-audit.md`. Reopen the earliest failed phase for any unsupported row; checked boxes alone are not evidence.
- [ ] [AI] Run foundation smoke and multi-instance E2E from a fresh owned stack and the changed-surface documentation/spec/plan gates. Acceptance: all pass without retry/sleep, resources clean up, and no account, provider, company, product-token, or deployment behavior is present.
- [ ] [AI] Verify all applicable rule-15 EWT/UWT/DWT and rule-16 AET defects are fixed. A defect deferral requires explicit user permission; SG proposals/suggestions receive an explicit disposition.

### Plan Archival in the Delivering PR

- [ ] [AI] Only after the preliminary audit passes, run `rtk date +%F` and record its output as `<completion-date>` in the preliminary audit. Never predict or reuse the authoring date.
- [ ] [AI] Run `rtk git mv plans/in-progress/ose-id-init-01-foundation/ plans/done/<completion-date>__ose-id-init-01-foundation/`. Update `plans/in-progress/README.md` by removing the active entry, update `plans/done/README.md` with the resolved date, and update every repository reference found by `rtk rg -n "plans/in-progress/ose-id-init-01-foundation|ose-id-init-01-foundation" . --glob '*.md'` so no active-plan link remains.
- [ ] [AI] Run Markdown, link, plan, and `rtk git diff --check` validation against the moved `plans/done/<completion-date>__ose-id-init-01-foundation/` path and changed indexes. Acceptance: the archive folder contains `evidence/`, all links resolve, and no duplicate backlog/in-progress folder remains.
- [ ] [AI] Inspect the complete merge-base diff and `rtk git status --short`. Acceptance: implementation, tests, specs, documentation, evidence, plan archive move, and index/reference edits are all present; no post-merge documentation commit is planned.
- [ ] [AI] Do not stage or commit until the user explicitly authorizes the named change set. Once authorized, create the fewest coherent build-valid Conventional Commits, including the archive move/index/reference changes in this delivering PR; use `feat(ose-id): add local foundation` for the feature commit and `chore(plans): archive ose-id-init-01-foundation` only when a separate archival commit is needed for reviewability.

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
      `rtk ./hippo run --class transactional --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`;
      acceptance: every live registry gate exits 0. Save sanitized output and the inventory from
      `rtk apps/rhino-cli/scripts/rhino-bin.sh gate list --surface=pre-push --format=text`.
- [ ] [AI] Run the Mandatory Nx Quality Matrix, then
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`;
      acceptance: both application builds, all four projects' typecheck/lint/quick targets, and every
      applicable higher-layer/static target pass. Save the commands and exits in
      `evidence/phase-7/nx-quality.txt`; any failure reopens its owning phase.
- [ ] [AI] Run the repository specs/OpenAPI, Markdown, plan, schema/migration, dependency/rules/binding, secret, and changed-surface gates required by the final diff. Acceptance: every gate exits 0 against the archive-containing HEAD.
- [ ] [AI] Run `ose-id-be:test:unit` and `ose-id-web:test:unit` with native coverage enabled;
      acceptance: each enforces and reports **at least 99% Unit line coverage for authored production code**, with canonical exclusions only.
      Run every applicable project-local static `test:coverage:unit`, `:integration`, `:e2e`, and
      `:behaviour` target; acceptance: all scenario/adapter obligations and exemptions validate.
- [ ] [AI] Inspect `rtk git diff --check`, `rtk git status --short`, and the full `origin/main...HEAD` diff. Acceptance: the tree is clean, generated files trace to exact sources, all plan lifecycle changes are present, and account, provider, company, product-token, or deployment remains absent.
- [ ] [AI] Fix every failure, including preexisting failures encountered by these gates, at root cause. Any repair changes HEAD and invalidates all current-head review evidence; recommit only with user authorization, then rerun this phase from its first check. Never retry, sleep, widen, loosen, skip, or quarantine.

### Push and Exact-Head Review

- [ ] [AI] After explicit authorization, push the delivery branch and open or update its draft PR to `main`. Record exact 40-character head/base SHAs; the head must already include the archived plan.
- [ ] [AI] Poll GitHub Actions every two minutes without `gh run watch`. Fix root causes, push authorized repairs, and restart all exact-head gates whenever HEAD changes.
- [ ] [AI] Require the PR's exact current head/base Quality gate, applicable finite API/E2E/schema gates, one authenticated clean current-head `pr-leak-review`, and the repository-required semantic review for identity/security code. Resolve every blocking finding and rerun invalidated proof.
- [ ] [AI] Merge under default `[AI]` authority only when all hardened checks refer to the same current head/base and the archive move is visible in the PR diff. Record the PR URL, reviewed head, base, merge SHA, and merge timestamp in the workflow final report; make no post-merge plan edit.

### Phase 7 Gate

- [ ] [AI] Verify `origin/main` contains the merge SHA and `plans/done/<completion-date>__ose-id-init-01-foundation/`, while backlog/in-progress paths are absent. Do not clean the worktree before the terminal audit.

> **Pause Safety:** the delivery is merged and its archived plan is already on `origin/main`; only containment confirmation, terminal audit, and cleanup remain. Safe to stop. To resume, fetch `origin/main` and verify the recorded merge SHA before auditing.

---

## Phase 8: Post-Merge Terminal Audit and Cleanup

**Input:** confirmed merge containment and the archived plan already delivered on `origin/main`.
**Outcome:** workflow terminal audit passes and only then are the worktree and delivery branch cleaned.
**Proof:** terminal audit verdict/final report, containment proof, branch classification, removal and prune output.

- [ ] [AI] Run `rtk git fetch origin`; verify the recorded merge SHA is an ancestor of `origin/main`, the reviewed head matches the merged PR, and the archived plan/index state is present. A mismatch reopens Phase 7 and blocks cleanup.
- [ ] [AI] Run the workflow-owned terminal plan-execution audit against the delivered merge head. It must trace AC-FND-01..08, scope, schema/no-loss/compatibility evidence, reviews, and archive state. Record the verdict in the plan-execution final report, not by editing the merged plan. Failure reopens the earliest affected phase.
- [ ] [AI] Update the rules-propagation manifest's external final report/disposition to delivered only after the terminal audit passes; make no repository mutation that would require an unreviewed post-merge commit.
- [ ] [AI] Classify every Phase 0-created Delivery Branch Inventory entry as delivered, unused, or retained/escalated using merged PR and 40-character reviewed-head proof. Ambiguous/active rows retain the worktree and escalate.
- [ ] [AI] Run the mandatory pre-removal checks, reconcile the declared route with `rtk git worktree list --porcelain`, and remove non-force with `rtk git worktree remove worktrees/ose-id-init-01-foundation`. Then complete canonical branch cleanup and run `rtk git worktree prune`. Never remove on a partial/failing terminal audit.
- [ ] [AI] Publish the final execution report with merge containment, terminal verdict, cleanup proof, and the statement: Plan 02 remains blocked until this terminal audit passes.

### Phase 8 Gate

- [ ] [AI] Confirm terminal audit PASS, no retained unexplained branch, declared worktree absent, branch cleanup complete, and `origin/main` still contains the reviewed archive state.

> **Pause Safety:** delivery, audit, archival, and cleanup are complete. No repository mutation remains for this plan.
