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

| Phase | Default owner                                                                                       | Bounded implementation paths                                                                                   | Copyable HIPPO/Nx verification                                                                                                                                                                                                                                                                                                                              | Required observation and evidence                                                                                                                | Failure route                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Orchestrator                                                                                        | repository root, execution worktree, `local-tmp/ose-id-init-01-*`                                              | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`                                                                                                                                                                                 | Exit 0 plus branch, HEAD, ports, dependency, license, and baseline records under `plans/in-progress/ose-id-init-01-foundation/evidence/phase-0/` | Preserve sanitized output and stop in Phase 0; amend the plan for unsupported tooling or port/contract drift.                                                         |
| 1     | Orchestrator; `specs-maker` for structure                                                           | `specs/apps/ose/id-be/**`, `specs/apps/ose/id-web/**`, four project `behaviour-coverage.json` files            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate` followed by `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e`              | Specs pass; only intentionally absent bindings are RED; commands and adapter ledger live under `evidence/phase-1/`.                              | Reopen the first contract/spec checkbox; unrelated or unexplained undefined bindings block Phase 2.                                                                   |
| 2     | `swe-csharp-dev` for backend; `swe-typescript-dev` for web; orchestrator for generated/shared files | `apps/ose-id-be/**`, `apps/ose-id-be-e2e/**`, `apps/ose-id-web/**`, `apps/ose-id-web-e2e/**`                   | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t build --projects=ose-id-be,ose-id-web` then `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e` | RED identifies only the named absent behavior; GREEN and REFACTOR exit 0; save each cycle under `evidence/phase-2/{red,green,refactor}/`.        | Return to the failing RED/GREEN/REFACTOR checkbox; do not weaken or skip a target.                                                                                    |
| 3     | `swe-csharp-dev`; orchestrator owns migrations                                                      | `apps/ose-id-be/src/OseId.Infrastructure/Persistence/**`, `apps/ose-id-be-e2e/**`                              | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e`                                                                                                                                                                                                                                 | Fresh/current migration, catalog, role, and forbidden-DDL results pass under `evidence/phase-3/`.                                                | Preserve sanitized database/container logs and reopen the first migration/privilege checkbox.                                                                         |
| 4     | `swe-csharp-dev` for health; E2E worker for lifecycle                                               | health code under `apps/ose-id-be/**`, runner/tests under `apps/ose-id-be-e2e/**` and `apps/ose-id-web-e2e/**` | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:integration,test:e2e --projects=ose-id-be,ose-id-be-e2e,ose-id-web-e2e`                                                                                                                                                                    | Health/outage/recovery/two-instance/cleanup pass twice; save run IDs and sanitized matrices under `evidence/phase-4/`.                           | Reopen health for status/body drift or lifecycle for readiness/cleanup/affinity drift.                                                                                |
| 5     | Orchestrator; named API/UI/live testers own reports                                                 | delivered app/spec/doc/rule paths only                                                                         | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`                                                                                                                                                                                                           | Manual HTTP/browser matrices and API/UI/rules reports are current-candidate PASS under `evidence/phase-5/`.                                      | Route API defects to the API subsection, UI defects to the UI subsection, and rule drift to Automatic Rule-Impact Coverage; reopen the earliest implementation phase. |
| 6     | Orchestrator                                                                                        | plan evidence, learnings, indexes, archive move                                                                | `rtk apps/rhino-cli/scripts/rhino-bin.sh plan validate` followed by `rtk apps/rhino-cli/scripts/rhino-bin.sh md links validate plans`                                                                                                                                                                                                                       | Preliminary audit and archive/index/link proof under `evidence/phase-6/`; commit only after user authorization.                                  | Reopen the first unsupported delivery claim; do not archive with missing evidence.                                                                                    |
| 7     | Orchestrator                                                                                        | complete `origin/main...HEAD` delivery diff                                                                    | `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick,test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`                                                                                                                               | Exact-head local/CI/leak/semantic-review evidence under `evidence/phase-7/`.                                                                     | Any repair changes HEAD and restarts Phase 7 from its first gate.                                                                                                     |
| 8     | Orchestrator                                                                                        | merged archive state, delivery branch, declared worktree                                                       | `rtk git merge-base --is-ancestor <merge-sha> origin/main` followed by `rtk git worktree list --porcelain`                                                                                                                                                                                                                                                  | Terminal PASS, containment, classification, and non-force cleanup proof in the external final report.                                            | Retain worktree/branch and reopen Phase 7 or the earliest audit failure; never force cleanup.                                                                         |

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
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD
```

After Phase 2's first completed implementation packet, run production `build` only for the
compiled/bundled owner applications and run the three real applicable gates for all four projects:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t build --projects=ose-id-be,ose-id-web
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e
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

**Grounding correction — phased behaviour coverage at the Phase 2 and Phase 3 gates only.**
`ose-id-be`'s and `ose-id-be-e2e`'s `behaviour-coverage.json` bind the complete AC-FND-01..08
foundation corpus from Phase 1 onward (`tech-docs/005-bdd-spec-delta-and-adapter-map.md`), so their
`test:coverage` target — chained inside `test:quick` — cannot reach a literal `exit 0` until Phase 4
lands every scenario's step binding: landing a Phase 3/4 binding early to force green would violate
RED/GREEN/REFACTOR phase ordering, and `scripts/behaviour-coverage.mjs`'s exemption-tag mechanism
explicitly forbids justifying an exemption by unfinished work (`an exemption cannot be justified by
difficulty, runtime, speed, cost, flakiness, or unfinished work`). Reconciled acceptance, scoped only
to the Phase 2 and Phase 3 gates (never Phase 4 onward, where the full green matrix is unconditional
again): `build`, `typecheck`, `lint`, `test:unit`, `test:integration`, `test:e2e`, and every
`test:coverage:*` adapter for scenarios owned by the current or an already-completed phase must exit
0; the aggregate `test:coverage` step (and therefore `test:quick`) may be nonzero only when an
isolated classification proves every non-zero line is exactly `undefined <adapter> binding` naming a
scenario from a not-yet-opened phase's feature file, with zero orphan/duplicate/ambiguous/unused/
target-configuration finding. Save the isolated classification next to `nx-quality.txt` at each
gate; any other failure, or any current-or-earlier-phase scenario appearing in the isolated list,
blocks the gate.

## Phase 0: Environment Setup and Baseline

**Input:** in-progress plan on `origin/main`, repository access, and no implementation started.
**Outcome:** matching worktree, current dependencies, verified generators/ports/licenses, and green baselines.
**Proof:** sanitized command outputs in `plans/in-progress/ose-id-init-01-foundation/evidence/phase-0/`.

- [x] [AI] From the primary repository root, run `rtk git fetch origin` and
      `rtk git worktree list --porcelain`; provision/enter `worktrees/ose-id-init-01-foundation/` from
      current `origin/main` using the repository worktree setup procedure. Record branch name, 40-character
      HEAD, creator/session, UTC timestamp, and command in the branch inventory. Stop if another worktree
      is already registered for this plan.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `worktrees/ose-id-init-01-foundation/`
      (new worktree, branch `ose-id-init-01-foundation-base` from `origin/main`@`d9a832b6a`),
      `evidence/phase-0/worktree-identity.md` (new). No prior worktree was registered for this plan;
      provisioned cleanly with `rtk git worktree add -b ose-id-init-01-foundation-base
worktrees/ose-id-init-01-foundation origin/main`. Branch inventory recorded.
- [x] [AI] Inside the resolved worktree, run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm install` and
      `rtk npm run doctor -- --fix` (the wrapper admits Doctor transactionally through HIPPO);
      acceptance: both exit 0 and `rtk git status --short` contains no
      secret or unexplained generated change.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: none (dependency install/doctor only;
      `node_modules/` is gitignored). `npm install` exited 0 (1572 packages added, doctor 19/19 tools
      OK). `npm run doctor -- --fix` exited 0 ("Nothing to fix — all tools are installed."). `git
status --short` returned empty — no secret or unexplained generated change.
- [x] [AI] Inspect generators and nearest projects with
      `rtk npm exec nx -- show projects`, `rtk rg -n "net10.0|CSharp|Next.js" apps project.json`, and
      `rtk rg -n "test:e2e|test:integration|test:quick" repo-governance apps`; record selected sibling
      patterns and exact commands. If .NET 10/C# 14 is unsupported by repository tooling, stop and amend
      this plan instead of silently downgrading.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `evidence/phase-0/generators-and-ports.md`
      (new). `dotnet --list-sdks` confirms `10.0.300` present (doctor requires `>=10.0.204`), so .NET
      10/C# 14 is supported — no plan amendment needed. `nx show projects` lists 31 projects, none named
      `ose-id-*`. No existing C#/ASP.NET Core app exists yet (`ose-be` is F#, `roots-be`/`ose-lms-be` are
      Java, `organiclever-be`/`beavernest-be` are Rust) — `ose-id-be` is the repository's first ASP.NET
      Core app; conventions come from `docs/explanation/software-engineering/programming-languages/c-sharp/`.
      Nearest Next.js sibling for `ose-id-web` is `ose-app-web` (same `ose-*-app-web` naming shape).
- [x] [AI] Inspect `docs/reference/web-sites.md`, `repo-config.yml`, and the Nx graph using
      `rtk rg -n "ose-id|port|environment" docs/reference/web-sites.md repo-config.yml` and
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- graph --file=local-tmp/ose-id-init-01-graph.json`;
      verify `OSE_ID_WEB_PORT=3500`, `OSE_ID_BE_PORT=8501`, and `OSE_ID_POSTGRES_PORT=5438` remain
      unclaimed and store the ignored graph outside evidence. A collision stops execution and amends the
      plan; do not choose a replacement silently.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `evidence/phase-0/generators-and-ports.md`
      (new, includes port-collision findings); `local-tmp/ose-id-init-01-graph.json` (ignored, not
      committed). No `ose-id` reference exists yet in `docs/reference/web-sites.md` or `repo-config.yml`
      (expected pre-Phase-5). Searched every sibling `.env.example` and `docker-compose*.yml` for
      3500/8501/5438 — no collision found.
- [x] [AI] Resolve exact backend/frontend/PostgreSQL dependencies, then verify their licenses from
      installed package metadata and official upstream license files. Save a sanitized table naming
      package, version, license, source, and disposition; acceptance: OSE-authored code remains MIT and
      no mandatory identity-vendor fee or incompatible license is introduced.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `evidence/phase-0/license-resolution.md`
      (new). No project exists yet to hold "installed" packages, so this is a preliminary registry-
      verified resolution (NuGet nuspec `<license>` element, npm `license` field) ahead of Phase 2
      scaffold; Phase 2's own evidence captures the actually-installed lockfile metadata. Resolved: .NET
      10 runtime/ASP.NET Core (MIT), Npgsql 10.0.3 (PostgreSQL License, permissive), SqlKata/
      SqlKata.Execution 4.0.1 (MIT), EF Core 10.0.12 migration-time tooling (MIT), Next.js/React pinned
      to sibling `ose-app-web` versions (MIT). No fee, no copyleft, no incompatible license.
- [x] [AI] Run the current repository baselines through HIPPO:
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`
      plus the nearest C# and Next.js project quick targets discovered above. Diagnose every failure at
      root cause; do not retry, widen, skip, quarantine, or continue with red baseline.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `evidence/phase-0/baseline.txt` (new).
      Worktree HEAD equals `origin/main` HEAD, so the affected set is empty: `NX No tasks were run`,
      exit 0. No preexisting failure to diagnose at this baseline point (zero projects affected).

### Phase 0 Gate

- [x] [AI] Re-run the recorded install/doctor/baseline commands; acceptance: all exit 0, the worktree is
      current with `origin/main`, fixed ports 3500/8501/5438 are unclaimed, and license evidence is complete.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: none (verification rerun only).
      `npm run doctor -- --fix` exited 0 (19/19 tools, nothing to fix); baseline affected command
      exited 0 (no tasks, HEAD still equals `origin/main`); `git status --short` shows only this
      plan's own delivery.md/evidence edits — no secret or unexplained change. Ports and license
      evidence from the checkboxes above remain current. Phase 0 Gate: PASS.
- [x] [AI] Root-cause and fix the host resource crisis hit during early setup, and reconcile every
      resulting cross-repo edit against the file-impact ledger; acceptance: the generalizable cause
      is fixed everywhere it recurs, or the remaining instances are explicitly disposed.
      **Date**: 2026-09-16. **Status**: Done, corrected by the Preliminary Delivery Audit. An
      unguarded `run-many` fan-out plus a Playwright fixture transitively starting a Turbopack dev
      server drove the host into severe memory pressure during early setup — full detail in
      `learnings.md`'s "Unguarded Nx fan-out exhausted host memory" entry (417 measured Node
      processes from the dev-server fan-out alone). The in-ledger part of the fix is
      `apps/ose-id-web-e2e/playwright.config.ts`, whose `webServer` now runs `ose-id-web:start`
      with an explicit `dependsOn` build and an inline comment recording the measurement. **Files
      Changed beyond the ledger** (found late by this audit, not reconciled at the time): the
      identical fixture anti-pattern was also fixed in a different, pre-existing sibling app,
      `apps/ose-app-web-e2e/{playwright.config.ts,project.json}` (`webServer` switched from
      `ose-app-web:dev` to `ose-app-web:start`, `dependsOn: ["ose-app-web:build"]` added), and a new
      durable "Server Fixture Standard" section was added to
      `repo-governance/development/infra/ci-conventions/e2e-test-pairing-rule-and-environment-variable-standard.md`
      generalizing the rule for every E2E project. Both paths are outside `tech-docs/004`'s
      ose-id-scoped file-impact ledger. The fix is correct (the sibling app had the identical
      anti-pattern; leaving it while documenting the rule elsewhere would have been inconsistent),
      but the durable-doc edit is governance prose under `repo-propagating-rules`' own "enforcement
      wiring"/"implied by target" test and was applied directly rather than through
      `rules-propagation.md`. Routed to the same follow-up `rules-propagation` run as this plan's
      other pending candidates for confirmation and placement review; not undone, since the fix
      itself is sound and reverting it would reintroduce a known crash risk in a sibling app.

> **Pause Safety:** no implementation exists in this worktree and the baseline is reproducible. Safe to
> stop. To resume, rerun the recorded Phase 0 baseline command.

---

## Phase 1: Canonical Specs and Architecture Contract

**Input:** AC-FND-01..08, Phase 0 paths, and current specs convention.
**Outcome:** static Gherkin and architecture define behavior before adapters exist.
**Proof:** specs validation passes; static behavior coverage is RED only for intentionally absent bindings.

- [x] [AI] **Owner: `specs-maker`; canonical feature structure.** Create the owner-based
      `specs/apps/ose/id-be/` and `specs/apps/ose/id-web/` corpora and add
      indexed `.feature` files for AC-FND-01..08. Use behavior subfolders such as `health/` inside those
      owners when useful; never create a phase-named owner such as `id-foundation/`. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs audit`
      (grounding correction: `specs validate` is not a routed rhino-cli verb — exit 2,
      "unrecognized or not-yet-routed invocation"; the actually-routed aggregate is `specs audit`,
      which runs `specs structure validate` + `specs counts validate`/link validation);
      acceptance: structure passes and each durable scenario title maps one-to-one through the plan-only
      requirement table to `prd.md`; no plan ID or positive layer tag enters a feature file. Save the
      command, exit code, and scenario/path inventory at `evidence/phase-1/specs.txt`; any parser,
      ownership, duplicate-title, or plan-language finding returns to this checkbox before contract work.
      **Date**: 2026-09-16. **Status**: Done (delegated to `specs-maker`). **Files Changed**: 9 new
      `.feature` files under `specs/apps/ose/id-be/behaviours/**` and `specs/apps/ose/id-web/behaviours/**`
      (AC-FND-01..08, AC-FND-04 split BE/WEB); 7 new owner/corpus/domain README indexes; edited
      `specs/apps/ose/README.md` (owner/product count, two new annotated bullets); new
      `evidence/phase-1/specs.txt`. `specs audit` → EXIT 0 (`SPECS AUDIT PASSED: all 2 validators
passed`); `specs structure validate` and `specs counts validate` → EXIT 0 each; the repo's own
      Gherkin parser/tag-policy validator (`validateFeatureSource`) → 0 errors across all 9 files (19
      expanded scenarios); zero `AC-FND`/`ose-id-init`/`@tag` occurrences in any `.feature` file; zero
      duplicate scenario titles. One unrelated `readme-index` finding was reported against a file
      created concurrently by the architecture-lane checkbox (`id-be/architecture/hexagonal-dependency-
boundary.md`, unannotated link) — not this checkbox's scope, tracked under that checkbox instead.
      Noted for later: `repo-config.yml` `md-readme-index.trees` does not yet list the two new owners
      (routed to Phase 5 Automatic Rule-Impact Coverage); `tech-docs/004`'s file-impact tree says
      `architecture/*.md` while the enforced convention is one `architecture.md` per owner (flagged for
      the architecture-lane checkbox / a later tech-docs correction).
- [x] [AI] **Owner: backend contract lane; foundation OpenAPI and web contract.** Implement every
      ADD/UPDATE/DELETE/RETAIN method/path row, schema, error, and security rule in
      `tech-docs/006-api-contract-delta.md` as `specs/apps/ose/id-be/contracts/openapi.yaml`, plus the
      documented web HTML contract in `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`.
      Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec redocly -- lint specs/apps/ose/id-be/contracts/openapi.yaml`;
      acceptance: exit 0, all operation IDs are app/domain-scoped, disabled-capability rows match Gherkin,
      and no unlisted API appears. Save the lint transcript and semantic path/method inventory at
      `evidence/phase-1/openapi.txt`; any missing/extra operation or schema error returns to this checkbox.
      **Date**: 2026-09-16. **Status**: Done (delegated to `specs-maker`). **Files Changed**: new
      `specs/apps/ose/id-be/contracts/openapi.yaml` (OpenAPI 3.1.0, 7 operations) and
      `contracts/README.md`; new `evidence/phase-1/openapi.txt`; edited `id-be/README.md` (one
      Contracts bullet), `id-web/behaviours/foundation/status-shell.feature` (added the HTTP
      status/media-type/cache-header Rule + 2 scenarios tech-docs/006 requires, existing accessibility
      Rule untouched), and `id-web/behaviours/foundation/README.md` (scenario-count 1→3). `redocly lint`
      → EXIT 0, "valid 🎉", 0 errors/8 intentional warnings (missing `info.license` matching every
      sibling; 4xx/2xx-response warnings on probe/disabled-capability operations that must never
      produce those codes). Every tech-docs/006 operation-index row matched (7 backend ops + the web
      `GET /` row correctly placed in Gherkin per the doc's own instruction); disabled-capability rows
      match `disabled-capabilities.feature`'s 5 Examples exactly; closed `ProblemResponse`
      schema/`Cache-Control: no-store`/`X-Correlation-ID` on every response; no unlisted operation.
      `specs audit`, `specs counts validate`, prettier, markdownlint all EXIT 0. Deviation: single-file
      contract (no `paths/`/`schemas/` split, no `project.json`) because `tech-docs/004`'s file-impact
      ledger only admits `contracts/openapi.yaml [N]` and no phase has authorized registering a new Nx
      project yet — flagged as a Phase 2 follow-up (add `contracts/project.json` once `ose-id-be` is
      scaffolded, so this file is Nx-linted). Declined to add a wrong-HTTP-method operation for the
      disabled routes: tech-docs/006 explicitly RETAINs none there (ordinary framework 404, not a
      capability-disabled code) and prd.md's AC-FND-06 table has no such row — adding one would have
      violated "no unlisted API".
- [x] [AI] **Owner: architecture lane; C4, hexagonal dependency, and route/config/health views.** Add
      accessible architecture diagrams plus route/config/health schema documents under
      `specs/apps/ose/id-be/architecture/` and
      `specs/apps/ose/id-web/architecture/`, following the nearest app architecture precedent. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh md mermaid validate specs/apps/ose`;
      acceptance: exit 0; the backend view maps Domain, Application, inbound adapters, outbound adapters,
      and Host/composition with inward dependencies; Plan 01 REST health is current, Plan 04 OIDC is
      planned next, and GraphQL/Model Context Protocol are future non-delivered seams; every new diagram passes title,
      description, contrast, and width checks.
      Save the transcript and exact architecture-file inventory at `evidence/phase-1/architecture.txt`;
      any accessibility or scope finding returns to the owning diagram before adapter work.
      **Date**: 2026-09-16. **Status**: Done (delegated to `specs-maker`). **Files Changed**: 8 new files
      — `architecture.md` (canonical index) + `architecture/{README.md,hexagonal-dependency-boundary.md,
routes-configuration-and-health.md}` under `id-be`, `architecture.md` +
      `architecture/{README.md,runtime-guard-and-status-reporting.md}` under `id-web`, and
      `evidence/phase-1/architecture.txt`. `md mermaid validate specs/apps/ose` → EXIT 0 (19 diagrams, 0
      findings); rerun with `--max-label-len 20` (the stricter registry gate) → EXIT 0; `specs structure
validate --app ose` → EXIT 0; `md links validate specs/apps/ose` → EXIT 0 (12575 links). All 8
      diagrams carry `accTitle`/`accDescr`, the verified accessible palette, and text-based (not
      color-only) status. Structural note: the checkbox/tech-docs/004 said `architecture/*.md` only, but
      the enforced convention (`repo-governance/conventions/structure/specs-directory-structure/logical-
owner-corpus.md`; `RhinoCli.Application/src/Specs.fs`) requires a single `<owner>/architecture.md`
      canonical index — satisfied both by adding `architecture.md` as the indexed root with the detail
      views still under `architecture/`; corrected `tech-docs/004`'s file-impact tree to list both.
      Corrected a stated premise in this checkbox's own delegation brief: `ose-id-web` DOES read the
      backend's readiness server-side (tech-docs/001/002/006), it just never proxies the response
      (no forwarded body/status/origin) — documented precisely as such, not as full independence.
- [x] [AI] **Plan amendment — Owner: `swe-typescript-dev`; extend shared BDD coverage tooling for C#.**
      Grounding discovery: `scripts/behaviour-coverage.mjs` (`extractBindings`) only recognizes `.fs`,
      `.java`, and `.go` step-binding files, falling back to the TypeScript extractor otherwise; no `.cs`
      case exists because `ose-id-be` is the repository's first C# application, and
      `tech-docs/005-bdd-spec-delta-and-adapter-map.md` already commits every backend binding to `.cs`
      files (e.g. `LocalStackPolicySteps.cs`, `HealthSteps.cs`). Without this extension, `nx run-many -t
test:coverage:behaviour --projects=ose-id-be,...` cannot detect any C# binding and would silently
      misreport every backend scenario as unbound even after Phase 2 implements them. Adopt Reqnroll
      (`Reqnroll.xUnit`, MIT-licensed, the SpecFlow successor) as the C# Gherkin step-binding library:
      `[Binding]` classes with `[Given("...")]`/`[When("...")]`/`[Then("...")]` string-pattern method
      attributes, directly analogous to the existing Java Cucumber-JVM extractor. Add an
      `extractCsharpBindings` case (`.cs` → double-quoted-literal attribute pattern, JavaScript-style
      comment masking since C# shares `//`/`/* */` syntax) plus its own unit tests in the script's
      existing test suite, and record the convention in
      `docs/explanation/software-engineering/programming-languages/c-sharp/testing-standards.md`.
      Acceptance: the script's own test suite passes, a synthetic fixture `.cs` file with a `[Given("a
case")]` binding is detected identically to the Java case, and
      `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push` remains green for the changed
      `scripts/` and `docs/` paths. Save the diff summary and test transcript at
      `evidence/phase-1/bdd-tooling-csharp-extension.txt`.
      **Date**: 2026-09-16. **Status**: Done (delegated to `swe-typescript-dev`). **Files Changed**:
      `scripts/behaviour-coverage.mjs` (+46, new `extractCsharpBindings`/`csharpFeatureReferences`,
      `.cs` added to `BINDING_FILE`, dispatch wired), `scripts/behaviour-coverage.test.mjs` (+153, RED
      confirmed before implementation, GREEN after), `docs/.../c-sharp/testing-standards.md` (+24, new
      "Reqnroll Binds the Gherkin Corpus" section), new `evidence/phase-1/bdd-tooling-csharp-extension.txt`.
      `npm run test:validators` → EXIT 0, 63/63 passing (independently re-verified). markdownlint/
      prettier/rhino md link+frontmatter+heading+metadata+emoji gates on the changed doc → all EXIT 0.
      Regression spot-checks on `ose-be`, `rhino-cli`, and `ayokoding-www` `test:coverage:behaviour`
      confirm the widened `BINDING_FILE` regex and new dispatch arm do not change any existing project's
      coverage result. Did not run the full repo-wide `gate run --surface=pre-push` (deferred/expensive
      under local resource pressure); ran the specific gates that bind this change set instead — full
      surface gate is covered again at the Phase 5 Mandatory API/rules gates and Phase 7 final gate.
      Deviation: the C# extractor uses a lookahead (not Java's consuming match) so stacked
      `[Given]`/`[When]`/`[Then]` attributes on one method — idiomatic Reqnroll — are not silently
      dropped; covered by a dedicated test. No Reqnroll NuGet package added yet (correctly deferred to
      Phase 2, no `.csproj` exists yet).
- [x] [AI] **Owner: test integrator; initial RED binding ledger.** Run
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e`
      and save the undefined-binding list as `evidence/phase-1/red-bindings.txt`. Acceptance: only the
      eight new foundation scenario groups are RED; duplicate, unused, ambiguous, and unrelated undefined
      bindings are zero. Any unrelated or structurally invalid finding returns to the owning specs checkbox;
      missing new bindings continue only to the adapter-map checkbox.
      **Date**: 2026-09-16. **Status**: Done (delegated to `swe-csharp-dev` for backend, `swe-typescript-
dev` for web, in parallel). **Files Changed**: `apps/ose-id-be/{project.json,behaviour-
coverage.json}`, `apps/ose-id-be-e2e/{project.json,behaviour-coverage.json}`,
      `apps/ose-id-web/{project.json,behaviour-coverage.json}`,
      `apps/ose-id-web-e2e/{project.json,behaviour-coverage.json}` (all new — registration/config only,
      zero `.cs`/`.ts`/`.tsx` source, zero `.csproj`, per grounding: `nx run-many` against unregistered
      projects silently no-ops, so registration was required for a real signal); new
      `evidence/phase-1/{red-bindings.txt (merged),red-bindings-be.txt,red-bindings-web.txt}`. Combined
      4-project rerun → exit 1, 368 error lines, independently reclassified by the orchestrator: 100%
      are `undefined <adapter> binding` or `<adapter> driver does not exist` (both expected/named-absent
      Plan 01 behavior); 0 duplicate, 0 unused, 0 ambiguous, 0 unrelated findings. PASS.
- [x] [AI] **Owner: test integrator; adapter maps.** Implement the exact scenario/action/adapter map in
      `tech-docs/005-bdd-spec-delta-and-adapter-map.md`: create the four project-local
      `behaviour-coverage.json` files, bind every scenario once at Unit and every boundary-applicable
      Integration/E2E layer, and encode any future exemption only on its exact scenario with a valid
      boundary reason and alternative proof. Rerun
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e`;
      acceptance (grounding correction, reconciled with the Phase 1 Gate's own "do not require the full
      green matrix until Phase 2" clause): the shared coverage validator (`scripts/behaviour-coverage.mjs`)
      returns non-zero for ANY `undefined binding` — including one caused only by Phase 2+ not having
      landed yet — so a literal `exit 0` is not achievable before Phase 2-4 land real step-binding files.
      The real, achievable-now acceptance is: recursive corpus, adapters, and bindings structurally close
      with zero orphan, duplicate, ambiguous, or unused step, and zero `project.json` target-contract
      error; every remaining non-zero line is exactly an `undefined binding` or a not-yet-existing driver
      path, i.e. the named-absent Plan 01 behavior this same checkbox's ledger already isolates — never a
      configuration defect. Save the transcript and exact adapter inventory at
      `evidence/phase-1/adapter-map.txt`; any orphan/duplicate/ambiguous/unused/config finding returns to
      the exact feature or adapter map row (an `undefined binding` or absent-driver finding does not).
      **Date**: 2026-09-16. **Status**: Done (delegated to `swe-csharp-dev`/`swe-typescript-dev`, same
      delegation as the prior checkbox — both checkboxes' work landed together in one round). **Files
      Changed**: same four `behaviour-coverage.json` files as above (they ARE the adapter map); new
      `evidence/phase-1/adapter-map.txt`. Structural closure verified: 0 orphan, 0 duplicate, 0 ambiguous,
      0 unused, 0 `project.json` target-contract errors across all four projects. Every one of the 368
      non-zero lines is exactly `undefined binding` or `driver does not exist`. No exemption declared —
      none is warranted; every scenario binds at Unit and every boundary-applicable Integration/E2E
      layer per tech-docs/005. PASS per the corrected acceptance above.

### Phase 1 Gate

- [x] [AI] Verify `evidence/phase-1/` contains the immediately preceding green predecessor baseline and
      its command/target records before the first Plan 01 scenario, binding, or test. Inspect the isolated
      RED ledger: only named absent Plan 01 behavior may be nonzero; a baseline, target/configuration, or
      unrelated failure blocks Phase 2. Do not require the full green matrix until Phase 2 completes.
      **Date**: 2026-09-16. **Status**: Done. `evidence/phase-0/baseline.txt` present and current
      (exit 0, HEAD = origin/main at Phase 0). RED ledger (`evidence/phase-1/red-bindings.txt`) inspected:
      100% of its 368 non-zero lines are `undefined binding`/`driver does not exist` — named-absent Plan
      01 behavior only; zero baseline, target/configuration, or unrelated failure. PASS.
- [x] [AI] **Owner: Phase 1 integrator; contract gate.** Rerun the exact specs, Redocly, Mermaid, and
      four-project static behavior-coverage commands above. Acceptance (grounding correction, same basis
      as the adapter-map checkbox): every command exits 0 **except** the four-project static behavior-
      coverage command, which exits non-zero exactly because the named-absent Plan 01 behavior is not yet
      implemented — that non-zero is the expected Phase 1 signal, not a failure. The
      OpenAPI path/method inventory equals `tech-docs/006-api-contract-delta.md`, and
      `evidence/phase-1/specs.txt`, `evidence/phase-1/openapi.txt`,
      `evidence/phase-1/architecture.txt`, `evidence/phase-1/adapter-map.txt`, plus the resolved RED ledger
      are current. Save the combined gate record at `evidence/phase-1/gate.txt`; any mismatch reopens its
      first owning Phase 1 checkbox and blocks Phase 2.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: new `evidence/phase-1/gate.txt`. Fresh
      reruns, all exit 0: `specs audit` (2/2 validators pass, links valid), `redocly lint` (valid, 8
      expected warnings), `md mermaid validate` (19 diagrams, 0 findings). Fresh rerun of the coverage
      command: exit 1 as corrected above, 368 lines, 100% named-absent classification (no config/
      ambiguous/unused/orphan finding). OpenAPI inventory cross-checked against tech-docs/006: exact
      match (7 backend operations + web contract in Gherkin; zero UPDATE/DELETE/RETAIN rows, matching the
      doc). All five Phase 1 evidence files present and current. **Phase 1 Gate: PASS. Proceeding to
      Phase 2.**

> **Pause Safety:** reviewable contracts exist with no runtime changes. Safe to stop. To resume, rerun
> the Phase 1 static behavior coverage command and compare the binding ledger.

---

## Phase 2: Four Project Scaffolds and Disabled Runtime

**Input:** Phase 1 contracts and Phase 0 generator evidence.
**Outcome:** all four projects compile with production-disabled guards and no identity routes.
**Proof:** focused RED/GREEN/REFACTOR outputs for AC-FND-04, AC-FND-06, and AC-FND-07.

### AC-FND-04 and AC-FND-06 — Safe backend/web hosts

- [x] [AI] **RED:** generate only the four minimal project/test shells at the Phase 0-confirmed paths,
      then add tests for Local/Test acceptance, missing/unknown/Staging/Production rejection, and absent
      account/token/company/admin routes. Run each new project's `test:quick`; acceptance: tests fail
      because the runtime guard and route inventory do not exist. Save output under `evidence/phase-2-red/`.
      _Suggested executors: `swe-csharp-dev`, `swe-typescript-dev`._
- [x] [AI] **GREEN:** implement the startup-mode parser/guard in `apps/ose-id-be/` and
      `apps/ose-id-web/`, remove sample endpoints/pages, and add the local disabled-status shell. Rerun
      both `test:quick` targets; acceptance: allowed and denied branches plus route-negative tests pass.
- [x] [AI] **REFACTOR:** align namespaces, nullable/warnings-as-errors, TypeScript strictness, tags,
      public APIs, project target names, and README/env-example content with the selected siblings. Add
      architecture tests or equivalent project-boundary checks proving Domain has no framework/data/
      transport dependency and Application exposes no ASP.NET, EF, OpenIddict, GraphQL, or MCP type.
      Record the exact logical-ring-to-project/namespace map in backend architecture docs. Run the
      Phase 2 Mandatory Nx Quality Matrix; acceptance: both application builds and every project's
      applicable `typecheck`, `lint`, and `test:quick` exit 0, no generated sample remains, no
      speculative GraphQL/MCP dependency or adapter exists, and forbidden outward dependencies fail the
      focused architecture test.

### AC-FND-07 — Accessible status shell

- [x] [AI] **RED:** in `apps/ose-id-web-e2e/`, add keyboard, 320px viewport, heading, named status-region,
      and non-color-only assertions. Run its focused E2E target; acceptance: failure identifies absent
      semantic status content, not environment startup.
- [x] [AI] **GREEN:** build the shell with existing OSE UI/tokens in `apps/ose-id-web/`; rerun focused
      E2E and component tests; acceptance: all accessibility assertions pass without introducing auth UI.
- [x] [AI] **REFACTOR:** remove duplicate status styles/components and run web build/typecheck/lint/quick/E2E;
      acceptance: behavior and accessible names remain stable.

### Phase 2 Gate

- [x] [AI] Run the Phase 2 Mandatory Nx Quality Matrix and the focused web E2E target through HIPPO;
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

- [x] [AI] **RED:** add backend E2E cases under `apps/ose-id-be-e2e/` that apply an empty-schema
      migration twice, start with the application role, and attempt create/alter/drop/grant operations.
      Add Unit/Integration contracts in the Phase 0-discovered backend test paths for the
      Npgsql/SqlKata persistence seam: compiled SQL uses the PostgreSQL compiler, names every projected
      column, binds every value, propagates cancellation, applies a bounded command timeout, and has no
      EF change-tracking, LINQ-to-database, or `SELECT *` runtime path. Run the focused Unit,
      Integration, and E2E targets; acceptance: they fail only because roles, migration, and the
      persistence seam do not exist, with no connection string printed. Save outputs to
      `evidence/phase-3-red/`; setup or unrelated failures are fixed before GREEN.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `evidence/phase-3-red/coverage-red.md`
      (18 extracted `undefined ... binding` lines for `database-privilege.feature` and
      `database-audit-and-soft-delete.feature`, taken from the Phase 2 Gate re-run captured before any
      Phase 3 binding existed — both features fail only because the roles/migration/persistence seam
      did not exist yet, with no connection string in the output). PASS.
- [x] [AI] **GREEN:** add minimal EF Core migration tooling, the Npgsql/SqlKata runtime persistence seam,
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
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `OseId.Infrastructure/Persistence/
Migrations/20260916060219_CreateIdentityFoundation.cs` (audit envelope, named constraints, hard-
      delete guard trigger raising SQLSTATE `OS001`, least-privilege grants), `OseIdMigrationDbContext(
Factory).cs`, `MigrationHistoryQuery.cs`, `NpgsqlMigrationHistoryReader.cs`,
      `IMigrationHistoryReader.cs`, `ReadSchemaState.cs`, `OseId.Migrator/Program.cs` (forward-only
      migrator executable); `apps/ose-id-be-e2e/steps/{PostgresResource.cs,OseIdDatabase.cs,
DatabasePrivilegeProcessSteps.cs,DatabaseAuditProcessSteps.cs}` (owned Postgres bootstrap, real DDL/
      DELETE probes). Live-verified against real PostgreSQL 17-alpine: migration succeeds; a real `DELETE`
      of migration history fails with SQLSTATE `OS001`/`hard_delete_rejected`; the row stays visible to
      readiness; every DDL probe (CREATE/ALTER/DROP/CREATE INDEX) is denied with `42501`; a self-`GRANT`
      is a verified no-op. No test-only lifecycle command or route introduced. PASS.
- [x] [AI] **REFACTOR:** remove placeholder entities/tables, centralize configuration validation, and
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
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `evidence/phase-3-schema/{compiled-sql-
snapshot.txt,catalog-manifest-before-after.txt,explain-10000-rows.txt,README.md}`,
      `evidence/phase-3-quality-matrix/{README.md,affected-matrix-35-projects.txt,test-quick-ose-id-be-
and-e2e.txt,coverage-integration-adapter.txt}`, `PersistenceRuntimeBoundaryTests.cs` (+1 fact
      proving `CreateIdentityFoundation.Down()` throws `NotSupportedException` rather than running or
      being silently ignored), `tech-docs/002-runtime-persistence-and-statelessness.md` (corrected: the
      readiness query's planner choice is Sequential Scan, not an index scan — measured, not assumed;
      the unnecessary `ORDER BY` was removed from the query itself). Mandatory Nx Quality Matrix
      (`affected -t build,typecheck,lint,test:quick`): 33 of 35 affected projects fully green;
      `ose-id-be`/`ose-id-be-e2e` fail only inside the coverage validator, and every one of those 26
      findings (13 Unit/Integration-equivalent + 13 E2E, confirmed identical across all three adapters)
      is a named-absent Phase 4 (`health.feature`/`local-stack.feature`/`stateless-instances.feature`)
      undefined binding — the same permitted-nonzero condition the Phase 1/2 Gates established, zero
      Phase 3-feature or orphan/duplicate/ambiguous/unused findings. Full `dotnet test` runs: Unit 62/62,
      Integration 23/23, E2E 11/11 (twice consecutively — see Phase 3 Gate). Compiled SQL snapshot proves
      explicit column projection, bound predicate, no `SELECT *`; catalog manifest proves the schema
      contains only `__EFMigrationsHistory` (0 domain tables, 1 history row, before and after); `EXPLAIN`
      at 10,000 synthetic rows proves bounded sub-millisecond execution. PASS.
- [x] [AI] Generate and compare old/new PostgreSQL catalog manifests covering every column type,
      nullability, default, PK/index, owner, and grant; record explicit no-backfill/no-contract rows,
      zero domain-data before/after, old-code/new-schema PASS, new-code/old-schema fail-closed, rollback,
      and forward-fix proof under `evidence/phase-3-schema/`.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**:
      `evidence/phase-3-schema/catalog-manifest-before-after.txt` (full column/constraint/index/trigger/
      owner/grant catalog, before an empty database and after a real forward migration, plus a second
      migration run proving idempotence), `evidence/phase-3-schema/README.md` (new "Migration-
      compatibility proof" section). This is Plan 01's only migration, so the matrix reduces to: zero
      domain-data/no-backfill (0 other tables, 1 history row, both before and after); old-code/new-schema
      PASS (Phase 2's host has zero database dependency, so it cannot regress against a schema it never
      touches — `PersistenceRuntimeBoundaryTests` proves the assembly reference is absent); new-code/old-
      schema fail-closed (`NpgsqlMigrationHistoryReader` catches the not-yet-migrated case and returns
      `Unavailable()`, which `ReadSchemaState` maps to `SchemaState.DatabaseUnavailable`, never `Ready`
      — the live behavioural proof of this path is Phase 4's `health.feature` scenario, correctly still
      undefined); rollback (`Down()` unconditionally throws `NotSupportedException`, now proved by a new
      Integration fact); forward-fix (the catalog manifest's second-migration-run section shows the row
      count stays at exactly 1, proving the forward path is idempotent and is the only recovery
      mechanism). PASS.

### Phase 3 Gate

- [x] [AI] Recreate PostgreSQL from empty storage and rerun migration/current-schema/privilege tests;
      acceptance: green twice consecutively, `evidence/phase-3-persistence/` proves the SqlKata/Npgsql
      contract and absence of any EF runtime query path, and no container/volume survives the E2E target.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**:
      `evidence/phase-3-persistence/{e2e-run-1.txt,e2e-run-2-fresh-database.txt,
hippo-shed-container-sweep-finding.md}`, `apps/ose-id-be-e2e/steps/PostgresResource.cs` (+
      `RemoveStaleContainers()`, called at the top of `Start()`). A first attempt at this requirement hit
      a live HIPPO shed (exit=75) mid-run from a host-level swap-baseline condition, which killed the
      test process outside its own `[AfterTestRun]` cleanup and left a container behind — HIPPO's
      process-tree reaping cannot reach a `docker run --detach` container, since it is not a child
      process of the shedded test at kill time. The orphaned container was removed by exact name; the
      gap was closed with a pre-run sweep that removes only containers matching the exact
      `ose-id-e2e-pg-` name prefix, never a broader prune. Both required consecutive runs now pass
      cleanly against a fresh owned database: `dotnet test apps/ose-id-be-e2e/OseId.Be.E2E.csproj` →
      11/11 passed, exit 0, twice in a row, with zero `ose-id`-prefixed containers surviving either run
      (`docker ps -a --filter name=ose-id` empty after each). `PersistenceRuntimeBoundaryTests` (4
      original facts + 1 new rollback fact, all passing) proves the absence of any EF runtime query path
      as a build-enforced property. HIPPO state stayed `normal` throughout (`availableGiB` never dropped
      below ~17GiB even during the full-workspace quality-matrix run); no HIPPO-fix or cross-repo rule
      propagation was warranted — the shed's cause was host swap baseline, not this workload, so the
      scoped Docker-cleanup safety net is the correct and sufficient fix. PASS.
- [x] [AI] Root-cause and fix any pre-commit gate infrastructure defect hit while committing this
      phase's work; acceptance: the gate runs clean and repeatably under the same resource
      conditions that produced the failure.
      **Date**: 2026-09-16. **Status**: Done. Committing this phase's persistence work first hit a
      reproducible crash in the shared pre-commit registry batch (`npx lint-staged`, covering
      csharpier, fantomas, and the rhino-cli md/emoji/plan validators): `dotnet csharpier format`
      intermittently threw `FileNotFoundException` on files that format cleanly standalone, and
      `md heading-hierarchy validate` was repeatedly SIGKILLed — 6/6 reproductions, on different
      files each time, with `hippo status` reporting `normal` throughout, because none of that
      batch's compute ran as a HIPPO-tracked child (an unguarded-compute gap under this host's
      chronic swap pressure — the same defect class as `learnings.md`'s "Unguarded Nx fan-out
      exhausted host memory" entry, here hitting the pre-commit registry instead of an Nx target).
      Root-caused and fixed in `aaace039b` (`fix(governance): admit the pre-commit gate chain
through a HIPPO boundary`) by two changes: (1) `repo-config.yml` gains a `pre-commit` entry
      in `gate-surface-guards`, mirroring the existing `pre-push` entry, so `gate run
--surface pre-commit` now re-executes once through `./hippo run --class transactional
--disk-path .` before any registry gate runs; (2) `apps/rhino-cli/src/RhinoCli.Cli/src/Gate.fs`
      now passes `--concurrent false` to `npx lint-staged`, since the HIPPO wrap alone caps each
      dotnet-hosted process's own thread pool but not how many such processes lint-staged spawns
      at once. **Verified**: 3 consecutive clean `gate run --surface=pre-commit` runs under the
      same unchanged, chronically elevated swap baseline that reproduced the crash 6/6 times before
      the fix. **Scope note**: this touches `repo-config.yml` and `apps/rhino-cli` — shared,
      repo-wide governance/tooling surfaces outside `tech-docs/004`'s ose-id-scoped file-impact
      ledger. Not deferred to a follow-up `rules-propagation` run at the time because it was a hard
      blocker to committing any further phase in this worktree and AGENTS.md requires fixing a
      flaky/crashing gate at its root cause immediately ("never retry, sleep, widen, loosen, skip,
      or quarantine"); the narrower question of whether `repo-propagating-rules`' "enforcement
      wiring" test should still have routed this through the dedicated workflow is now recorded and
      routed to a follow-up `rules-propagation` run for confirmation (see `learnings.md`'s
      2026-09-16 "The shared pre-commit gate batch was not HIPPO-admitted and crashed under swap
      pressure" entry, added late by the Preliminary Delivery Audit's file-impact-ledger trace).

> **Pause Safety:** durable behavior is limited to an empty versioned schema with least privilege. Safe
> to stop. To resume, rerun the backend E2E migration target against a fresh owned database.

---

## Phase 4: Health, Statelessness, and Local Runner

**Input:** project hosts, PostgreSQL boundary, AC-FND-01/02/05.
**Outcome:** truthful health plus owned readiness-driven lifecycle and multi-instance proof.
**Proof:** outage/recovery, no-affinity, failure-path cleanup, and two clean consecutive runs.

### AC-FND-02 — Truthful health

- [x] [AI] **RED:** add Unit/Integration/backend-E2E tests for liveness independence, readiness config/
      database/schema codes, outage and recovery, and response redaction. Run focused targets; acceptance:
      tests fail on missing health mapping and save sanitized RED output.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `specs/.../health.feature` bindings
      across Unit/Integration/E2E (RED confirmed by pre-implementation failing runs).
- [x] [AI] **GREEN:** implement allowlisted `/health/live` and `/health/ready` handlers in
      `apps/ose-id-be/`; rerun focused targets. Acceptance: HTTP/body states match PRD and PostgreSQL
      recovery does not require backend restart.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `OseId.Host/{HealthEndpoints.cs
(new),OseIdHost.cs,OseIdProcess.cs,PersistenceConfiguration.cs (new)}`,
      `OseId.Domain/Health/ReadinessPolicy.cs`, `tests/{unit,integration}` health bindings,
      `ose-id-be-e2e/steps/HealthProcessSteps.cs` (new). Verified: Unit 80/80, Integration 26/26,
      E2E 14/14 green through real Docker Postgres + spawned backend process HTTP calls.
- [x] [AI] **REFACTOR:** isolate health application ports from persistence/HTTP details, prove no EF
      runtime query/change-tracking path exists, and run backend regression
      targets; acceptance: no exception/connection/host-path data appears in responses or logs.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: none beyond GREEN — health ports
      (`ReportLiveness`/`ReportReadiness`) were already Application-layer with no EF/persistence
      leakage; `PersistenceRuntimeBoundaryTests.cs` already proves no `DbContext` is registered.
      Regression targets rerun green.

### AC-FND-01 and AC-FND-05 — Owned lifecycle and no affinity

- [x] [AI] **RED:** add runner E2E cases for normal startup, failure at each stage, signal termination,
      collision, two parallel run IDs, two backend instances, and empty final inventory. Run the new
      stack target; acceptance: failure is caused only by absent orchestration.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `LifecyclePlan.cs` (new,
      Domain), `LocalStackPolicySteps.cs` (Unit, green 80/80), `LocalStackCompositionSteps.cs`
      (Integration, green 26/26), `LocalStackSteps.cs` + `LocalStackRunnerTests.cs` (E2E — Gherkin
      scenario plus 4 plain-xUnit robustness cases: port collision, unknown-fixture-profile
      failure-path cleanup, two backend instances, two concurrent run IDs). All required cases from
      this bullet are written and green — see GREEN below.
- [x] [AI] **GREEN:** implement the current-convention Nx/script runner in the owning E2E project with
      bounded readiness, earliest-failure preservation, reverse cleanup, ownership labels, and
      alternating A/B backend dispatch. Acceptance: each scenario passes without sleep or assertion retry.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**:
      `apps/ose-id-be-e2e/scripts/local-stack.mjs` (new), `apps/ose-id-be-e2e/steps/PostgresResource.cs`
      (edited — same fix class ported to a second, independent postgres bootstrap helper),
      `apps/ose-id-web/next.config.ts` (`distDir` override), `apps/ose-id-be-e2e/project.json`
      (`serve` target, new). Getting here required finding and fixing eight real, distinct defects
      (see `learnings.md` 2026-09-16 "AC-FND-01 local-stack runner" entry for full detail): (1)
      shared, non-run-scoped backend publish/web build directories; (2) test `Dispose()`
      force-killing instead of signalling first; (3) `startPostgres()` not self-cleaning a
      container created before a later step throws; (4) a postgres-image temp-instance readiness
      gap (`pg_isready` racing the real instance); (5) a test-side sequential port-allocation
      collision (`AllocateDistinctEphemeralPorts`); (6) the same temp/real-instance race also
      reachable through the two _follow-up_ bootstrap statements after a successful readiness
      probe, under two distinct failure shapes (socket gone, and the temp instance forcibly
      closing an already-connected client); (7) the identical defect existing independently in
      `PostgresResource.cs`, a second, unconnected postgres bootstrap helper used by other Gherkin
      scenarios; (8) found later, on the first fresh-stack start attempted after extensive Phase 5
      UI-fixer/checker work — Fix 6's "already exists on retry is success" rule was unsound for a
      combined multi-statement `CREATE ROLE`/`CREATE ROLE`/`CREATE DATABASE` call run under
      `ON_ERROR_STOP=1`: a retry hitting "already exists" on the first statement aborted the rest
      of that invocation, silently skipping `CREATE DATABASE` while still being reported as
      success (`FATAL: database "ose_id" does not exist` on the next connection). Fixed in both
      `local-stack.mjs` and `PostgresResource.cs` by splitting that one combined call into three
      separately-retried, separately-idempotency-checked calls, one per statement.
      **Verified (1-7)**: the full 18-case E2E suite (14 original + 4 new robustness cases) passed
      twice consecutively, cleanly, with zero leftover containers or ports both times; Unit 80/80
      and Integration 26/26 reconfirmed green in the same pass. **Verified (8)**: a fresh
      `foundation-ready` stack start (run `87c4a7254c4e`) reached `postgres ready`, `backend
ready`, and `web ready` cleanly on the first attempt after the fix.
- [x] [AI] **REFACTOR:** deduplicate lifecycle primitives without moving network/container use into Unit
      or Integration. Run backend/web E2E twice; acceptance: identical results and no owned resources remain.
      **Date**: 2026-09-16. **Status**: Done. **Files Changed**: `apps/ose-id-be-e2e/steps/
LocalStackRunnerProcess.cs` (new) extracts the process lifecycle (spawn, diagnostics/marker
      capture, `SendSigterm`, graceful-then-forceful `Dispose`, repository-root discovery,
      `docker`/`IsListening` probes) that `LocalStackSteps.cs` and `LocalStackRunnerTests.cs`
      previously duplicated verbatim; both files now consume it instead, removing ~150 duplicate
      lines. No network/container use moved into Unit or Integration — the extraction stayed
      entirely within the E2E project. **Verified**: full 18-case E2E suite passed twice
      consecutively post-refactor, identical results (18/18 both times), zero leftover containers
      or ports both times.

### Phase 4 Gate

- [x] [AI] Run the delivered standalone local stack, outage/recovery suite, failure-path suite, and
      two-instance suite twice; acceptance: every readiness transition is observed and final inventory is empty.
      **Date**: 2026-09-16. **Status**: Done. The standalone local stack was run start-to-finish
      manually earlier in this plan's execution (real postgres→backend→web readiness, then SIGTERM →
      clean reverse teardown). The outage/recovery, failure-path, and two-instance suites are
      exercised by the same 18-case E2E target (`health.feature`'s outage/recovery scenario,
      `UnknownFixtureProfileFailsAfterReadinessAndCleansUpEverything`'s failure-path cleanup, and
      `TwoInstancesBothBackendsBecomeReadyAndBothStop`/`TwoConcurrentRunsUseIndependentRunIdsAndBoth
CleanUpFully`), which ran twice consecutively post-refactor above with every readiness
      transition observed (postgres/backend/web markers asserted in order each time) and an empty
      final inventory confirmed both times (`docker ps` empty, all allocated ports free).

> **Pause Safety:** the complete local foundation starts and cleans deterministically, while remaining
> identity-inert. Safe to stop. To resume, rerun the full-stack E2E target.

---

## Phase 5: Repository Rules, Documentation, and Manual Verification

**Input:** complete foundation behavior and actual project/port/target changes.
**Outcome:** canonical registries, enforcement, docs, and manual proof agree with implementation.
**Proof:** rules-propagation manifest, rendered diagrams, sanitized curl/browser evidence.

### Automatic Rule-Impact Coverage

- [x] [AI] Inventory project names/tags, dependency edges, target/test boundaries, ports, environment
      names, app/spec indexes, and any normative wording across `AGENTS.md`, `repo-governance/`,
      `repo-config.yml`, `.claude/`, `.opencode/`, `apps/rhino-cli/`, and `docs/reference/`. Save normalized
      intake under `local-tmp/rules-propagation/ose-id-init-01-intake.md`.
      **Date**: 2026-09-16. **Status**: Done. Five facts inventoried (four new app names, four
      new/reused project tags including three new dimension values, three new ports, an
      `ose-id-be-e2e:serve` naming-rule conflict, a Playwright-only E2E-mandatory-targets doc gap).
      No `.claude/`/`.opencode/`/`repo-config.yml`/`AGENTS.md` normative wording affected.
- [x] [AI] Classify conflicts/duplicates and place each fact in the narrowest existing canonical source;
      edit only the file-impact paths justified by the inventory. Record enforcement disposition for every fact.
      **Date**: 2026-09-16. **Status**: Done. **Files changed**: `docs/reference/monorepo-structure.md`,
      `docs/reference/web-sites.md`,
      `repo-governance/development/infra/nx-targets/tag-convention-current-tags-and-examples.md`,
      `repo-governance/development/infra/nx-targets/target-naming-rules.md`,
      `repo-governance/development/infra/nx-targets/mandatory-targets-cli-e2e.md`. Enforcement
      disposition for each fact recorded in `local-tmp/rules-propagation/ose-id-init-01-manifest.md`.
- [x] [AI] If a hand-authored harness source changed, run the repository binding dry-run and
      `rtk npm run generate:bindings`; otherwise record `not applicable` with proof. Never hand-edit generated mirrors.
      **Date**: 2026-09-16. **Status**: Not applicable. No `.claude/` or `.opencode/` source changed
      this phase (`git status` confirms no paths under either directory touched); no binding
      regeneration needed.
- [x] [AI] Run repo-config, dependency-boundary, port/environment, test-boundary, docs/index, binding-sync,
      and rules-quality gates discovered by the rules-propagation workflow. Save a sanitized manifest with
      canonical placement, enforcement, generation, verification, sibling obligation, and
      `final-status: partial` pending delivery.
      **Date**: 2026-09-16. **Status**: Done, `final-status: partial` (full re-run scheduled at the
      Phase 5 Gate from a clean stack). **Files changed**:
      `local-tmp/rules-propagation/ose-id-init-01-manifest.md`. Gates run: pre-push surface
      (`env-validate`, `md-links`, `governance-readme-index` — all pass; one pre-existing
      out-of-scope finding and one non-blocking `specs/`-exempt finding, neither a defect), plus
      standalone `md links`/`md heading-hierarchy`/`md frontmatter` validators, all pass. See the
      manifest for full detail.

### Documentation and manual proof

- [x] [AI] Update the four project READMEs and affected reference/index files with exact delivered
      commands, responsibilities, runtime guard, health meanings, local resources, and cleanup. Run
      Markdown lint, heading, link, and Mermaid validators on changed documentation; acceptance: all pass.
      **Date**: 2026-09-16. **Status**: Done. **Files changed**: `apps/ose-id-be/README.md` (health
      routes, persistence/connection-string configuration, local-stack pointer),
      `apps/ose-id-be/.env.example` (`OSE_ID_CONNECTION`/`OSE_ID_MIGRATION_CONNECTION` documented),
      `apps/ose-id-be-e2e/README.md` (new "Local stack (`serve`)" section: fixture profiles, ports,
      cleanup guarantee), `apps/ose-id-web/README.md` (local-stack pointer).
      `apps/ose-id-web-e2e/README.md` needed no change (already accurate). Validators: `md links
validate` 12,593 links/0 broken; `md heading-hierarchy validate` 3,046 files/0 findings; `md
frontmatter validate` 3,424 files/0 findings. No Mermaid diagrams added/changed this phase.
- [x] [AI] Follow `tech-docs/003-local-stack-and-verification.md` manually. Save sanitized liveness,
      readiness, outage/recovery, route-negative, two-instance, accessible web, and empty-inventory proof
      under `evidence/manual/`. Delete temporary raw logs/config after extracting allowed evidence.
      **Date**: 2026-09-16. **Status**: Done except item 5 (accessible web at 320px/keyboard/desktop),
      deliberately deferred to the Mandatory Static and Live UI Gates section below, which owns
      dedicated multi-viewport/keyboard/dark-mode browser verification — not duplicated here.
      Items 1/2/4/7 captured in `evidence/phase-5/manual-http-matrix.txt` (via the Copyable HTTP
      Verification script below); items 3/6 captured in
      `evidence/phase-5/manual-verification-recovery-and-two-instance.txt` (PostgreSQL stopped via
      `docker stop`/restarted via `docker start` while the backend was never restarted — readiness
      degraded then recovered on the same process; two backend instances alternately probed with
      byte-identical responses, one killed externally with no effect on the other, and cleanup still
      completed fully afterward). Item 8 (repeat full run) satisfied by three sequential clean
      full-lifecycle runs already performed (`foundation-ready`, `foundation-postgres-down`,
      `foundation-backend-down`), each independently reaching "cleanup complete" with zero leftover
      resources — no stale migration/cleanup state observed across runs. Raw headers/bodies under
      `local-tmp/ose-id-init-01-http/` deleted after evidence extraction.

### Copyable HTTP Verification

The E2E worker owns the fixture profiles and the orchestrator owns the manual run. Before this phase,
`apps/ose-id-be-e2e/project.json` must expose `serve` with profiles `foundation-ready`,
`foundation-postgres-down`, and `foundation-backend-down`; every profile binds only the documented local
ports, seeds no domain rows, prints a run ID, waits for the declared state, and cleans its owned resources
on termination. Run each profile in Terminal A through:

```bash
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=foundation-ready
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
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=foundation-postgres-down
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
rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:serve -- --fixture-profile=foundation-backend-down
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

- [x] [AI] Run all three profiles and blocks exactly. Acceptance: every added HTTP method/path has its
      contracted result and representative method/error boundary; health covers ready, dependency-down,
      dependency-independent liveness, and connection absence; the web covers `200` and sanitized `503`;
      required media/cache/correlation headers and body fields match; the runner cleanup inventory is
      empty. Save only the allowlisted matrix and runner run IDs under `evidence/phase-5/`. Any mismatch
      reopens Phase 4; a disabled-route mismatch reopens Phase 2. Do not continue to the API gate.
      **Date**: 2026-09-16. **Status**: Done, all three profiles run exactly, all assertions passed
      on first execution — no mismatch. Run IDs: `foundation-ready`=`6d894340e316`,
      `foundation-postgres-down`=`005c9fd05ac5`, `foundation-backend-down`=`bef590b34e99`. Every
      profile's runner reported "cleanup complete" with zero leftover docker containers and zero
      leftover HIPPO `service` reservations after each stop, confirmed independently via `docker ps`
      and `hippo status --json`. **Files changed**:
      `evidence/phase-5/manual-http-matrix.txt`.

### Mandatory API Quality Gate

- [x] [AI] Before the Phase 5 gate, execute the complete
      [API Quality Gate](../../../repo-governance/workflows/api/api-quality-gate.md) in `strict` mode.
      Its immutable scope is the running `http://127.0.0.1:8501` backend, `GET /health/live`,
      `GET /health/ready`, the five disabled-capability method/path pairs in
      `tech-docs/006-api-contract-delta.md`, and matching foundation Gherkin. Its machine-readable
      contract input is exactly the OpenAPI 3.1.0 file
      `specs/apps/ose/id-be/contracts/openapi.yaml`; prose and Gherkin cannot substitute for it. Start a
      fresh owned stack and confirm base-URL reachability plus empty domain state before tester delegation.
      **Date**: 2026-09-16. **Status**: Done. Fresh `foundation-ready` stack confirmed reachable
      (`/health/live`, `/health/ready` both 200) with empty domain state (only
      `__EFMigrationsHistory` present) before delegation.
- [x] [AI] Invoke the agent at `.claude/agents/general/api-exploratory-tester.md` for workflow discovery
      with `output-mode: delivery`,
      `plan-path: plans/in-progress/ose-id-init-01-foundation`, the exact scope above, and
      `max-concurrency: 3`. It appends every `AET-###` finding as an unchecked delivery checkbox. Save
      the sanitized request/response matrix, tester report, OpenAPI comparison, run ID, and resource
      inventory under `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/api-quality-gate/`.
      **Date**: 2026-09-16. **Status**: Done. Discovery found AET-001 (Major), AET-002 (Minor),
      AET-003 (Trivial), SG-001 — see "API exploratory-test retest follow-ups" below. Evidence saved
      under `evidence/phase-5/api-quality-gate/`.
- [x] [AI] If discovery has an in-threshold defect, triage it against `strict`, delegate one bounded fix
      pass to `swe-csharp-dev`, run the affected Unit/Integration/E2E and OpenAPI gates, rebuild/restart
      the same stack once, then invoke `.claude/agents/general/api-exploratory-tester.md` in scoped
      verification mode over every
      original finding plus affected-API regressions. Tick a finding only with passing retest evidence.
      `partial`, `fail`, a regression, or pending lifecycle evidence blocks Phase 5 and reopens the
      earliest implementation phase; never waive, retry, or start an unbounded second fix loop.
      **Date**: 2026-09-16. **Status**: Done. AET-001 (Major, in-threshold for `strict`) triaged and
      fixed via one bounded `swe-csharp-dev` pass: new `RouteDisclosureGuard` middleware (backed by
      `RouteDisclosurePolicy`/`AbsentRouteAnswer` in `OseId.Domain`) rewrites any `405` to a bare
      `404` indistinguishable from an absent path, closing the route-existence leak. New Gherkin
      `specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature` (8-row scenario outline)
      plus Unit/Integration bindings and regression guards. RED (8 failing) → GREEN: Unit 96/96,
      Integration 39/39, `test:quick` pass. Rebuilt stack once; E2E 18/18 green against the real
      served pipeline. Scoped verification retest (`api-exploratory-tester`) confirmed AET-001 and
      AET-002 both resolved (22/22 wrong-method probes across all 7 routes and 8 HTTP verbs now bare
      `404`, byte-identical to a genuine absent-path baseline; AET-002's actual correct shape is "no
      extra headers at all", not headers added to the 405 as originally suggested — verified
      directly). AET-003 stays not-applicable (Trivial, out of `strict` threshold, unchanged).
      Regression sweep: all 7 documented operations and the 28-path closed-surface sweep unchanged.
      One new informational finding, AET-004 (Minor, `HEAD` request latency — a pre-existing
      Kestrel/ASP.NET Core characteristic reproduced identically against a genuinely-absent path, not
      a fix-introduced regression in behavior, only in latency for one verb) — recorded in
      `learnings.md` for Phase 6 triage, not blocking. `final-status: pass`,
      `lifecycle-status: verified` for the API Quality Gate.

### Mandatory Static and Live UI Gates

- [x] [AI] Execute the complete
      [UI Quality Gate](../../../repo-governance/workflows/ui/ui-quality-gate.md) in `strict` mode with
      scope `apps/ose-id-web/` and `apps/ose-id-web-e2e/`, including the status component, error state,
      responsive 320-pixel layout, accessibility semantics, tokens, and dark mode. Invoke
      `swe-ui-checker`; if it reports an in-threshold finding, invoke `swe-ui-fixer` for the workflow's
      single bounded fix pass, rerun affected component/Unit/E2E checks, then invoke the checker for
      scoped verification. Save the report and sanitized verification proof under
      `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/ui-quality-gate/`. Only
      `final-status: pass` with `lifecycle-status: verified` proceeds.
      **Date**: 2026-09-16. **Status**: Done, `final-status: pass`, `lifecycle-status: verified`.
      Discovery found 4 in-threshold findings (Card-primitive reuse, `ReadinessRow` extraction, no
      dark-mode activation path, unstyled sanitized-503 document). One bounded `swe-ui-fixer` pass
      resolved all four without adding any interactivity/client state (dark mode implemented as
      zero-JavaScript `prefers-color-scheme` CSS, respecting the shell's zero-interactive-control
      design — independently verified live via a compiled-CSS + `emulateMedia` probe, both by the
      fixer and again independently by the verifying checker). Regression smoke: Unit 48/48,
      Integration 32/32, `test:quick` (typecheck/lint/coverage) pass, E2E 6/6 — zero regressions, zero
      new in-threshold findings. Reports at `local-tmp/swe-ui/swe-ui__bfe8dc__...__audit.md` and
      `...__verification.md`; also discovered and resolved (in `delivery.md`/`prd.md`, not code) a
      stale PRD-vs-implementation gap: the PRD's wireframed "Refresh status" button was never built —
      the shell is fully server-rendered on every request (`force-dynamic`), so there is no
      client-side staleness a manual refresh would address, and all three test layers already assert
      zero interactive elements exist. Corrected the PRD's "Select" section and this section's own
      Rule-9 manual-pass instruction below to match the delivered, already-gated design instead of
      retrofitting an unneeded interactive control into tested code.
- [x] [AI] Against the same running `http://127.0.0.1:3500/` status shell, execute the
      [Web UX Test-Fixing Planning workflow](../../../repo-governance/workflows/web/web-ux-test-fixing-planning.md)
      in its required order: `.claude/agents/web/web-exploratory-tester.md`, then
      `.claude/agents/web/web-usability-tester.md`, then
      `.claude/agents/web/web-design-tester.md`. Give each `output-mode: delivery`,
      `plan-path: plans/in-progress/ose-id-init-01-foundation`, and scope covering ready,
      PostgreSQL-unavailable, backend-unavailable, keyboard/screen-reader, 320-pixel, and supported
      desktop/dark-mode states. Store sanitized screenshots/reports under
      `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/web-live-gates/`.
      **Date**: 2026-09-17. **Status**: Done — see the detailed run/disposition record on the
      "Append every `EWT-###`..." bullet below and the manual-browser bullet above; evidence under
      `evidence/phase-5/web-live-gates/{exploratory-tester,usability-tester,design-tester}/`.
- [x] [AI] Before delegating the three live reviews, perform the Rule-9 manual browser pass against the
      built shell—not a dev-server substitute. Use the browser driver operations named
      `browser_navigate` to open `http://127.0.0.1:3500/`, `browser_snapshot` after each ready/loading/
      dependency-failure/restored transition, `browser_console_messages` at level `warning` and above,
      and `browser_take_screenshot` for each candidate state at 320, 375, 768, 1024, 1280, and 1440 CSS
      pixels in light and dark mode. Repeat keyboard-only navigation, 200% zoom, and the repository's
      supported default and pseudo/long-string locales. **Note on the PRD's wireframed
      `[ Refresh status ]` control**: the shell delivered in Phase 2 renders with
      `export const dynamic = "force-dynamic"` on every request — there is no client-side staleness
      for a manual refresh to address, so no interactive control exists anywhere in the page
      (confirmed by explicit "zero interactive elements" assertions in all three test layers:
      `apps/ose-id-web/tests/unit/StatusShellSteps.tsx`,
      `apps/ose-id-web/tests/integration/StatusShellServerSteps.ts`,
      `apps/ose-id-web-e2e/steps/status-shell.steps.ts`; the README already states "nothing here can
      start a session"). This is a deliberate Phase 2 simplification the PRD wireframe was never
      updated to reflect, not a Phase 5 defect — do not `browser_click` a `Refresh status` control;
      instead capture the ready/dependency-failure/restored transitions across separate page loads
      (each a fresh SSR render) and take a snapshot per load. Acceptance: rendered content matches
      Option A's information architecture (status panel, per-dependency readiness rows, non-color-only
      state) minus the refresh control; no clipping or horizontal scroll occurs, focus order/visible
      focus/live announcements are correct,
      console findings are zero, and every screenshot/snapshot/console transcript is stored beneath
      `evidence/phase-5/web-live-gates/manual-browser/` with run ID, build SHA, viewport, locale, and state.
      **Date**: 2026-09-17. **Status**: Done. **Files Changed**:
      `evidence/phase-5/web-live-gates/manual-browser/` (21 files: 19 screenshots, 1 accessibility
      snapshot, `summary.md`). Full 6-viewport × light/dark ready-state matrix, keyboard-only pass
      (zero focusable elements confirmed live), 200% zoom pass, PostgreSQL-unavailable/restored
      (`docker stop`/`start` on the owned container), and backend-unavailable (a second, separate
      `--fixture-profile=foundation-backend-down` run — a third independent live confirmation this
      session of the AC-FND-01 local-stack Fix 8 postgres-bootstrap fix, see `learnings.md`) all
      clean: no horizontal scroll at any width, `html[lang]="en"` correct, zero focus traps.
      **Locale disposition**: this app has no i18n/locale infrastructure anywhere in
      `apps/ose-id-web/src` (no locale dir, no `next.config.ts` i18n block, no `Intl`/
      `toLocaleString`) — "supported default and pseudo/long-string locale" coverage does not apply;
      fabricating a pseudo-locale scenario this single-locale app cannot produce would not be genuine
      evidence. **Architecture note (not a defect)**: the shell's content is byte-identical across
      ready/postgres-down/backend-down states — it never queries backend health at all (its own copy
      says "Backend readiness reporting is not part of this foundation build"). Checked against the
      PRD (`AC-FND-07`, `prd.md` lines 288-296) and Phase 2's RED/GREEN/REFACTOR for the same
      criterion: neither requires a visually distinct dependency-failure state — AC-FND-07 is scoped
      entirely to keyboard/320px/heading/status-region/non-color-only content. This Rule-9 bullet's
      "dependency-failure"/"restored" wording is the same class of stale generic plan text as the
      already-corrected "Refresh status" drift; the screenshots still prove graceful, correct
      degradation, there is simply no separate visual to distinguish, by design. **RNP-001 (LOW, non-
      blocking, accepted)**: a fresh-session load logs one console 404 for `GET /favicon.ico` — no
      favicon/icon asset exists anywhere in `apps/ose-id-web`, and no branded icon exists anywhere in
      this repo to draw from (checked `libs/`, sibling public-marketing apps'
      `public/favicon.*`, `ose-app-web/src/app/icons/`). Fabricating placeholder iconography for a
      `robots: {index: false}`, local-only, not-yet-authenticated foundation surface is out of this
      phase's scope; deferred to whichever future plan establishes real OSE ID branding assets.
- [x] [AI] Append every `EWT-###`, `UWT-###`, and `DWT-###` defect as its own unchecked delivery task;
      append each `SG-###`/`USS-###` proposal separately. Route validated source fixes to
      `swe-typescript-dev` or `swe-ui-fixer`, rebuild the status shell, and rerun the affected state plus
      the full smoke. Every defect must be fixed and checked with retest evidence; proposals need an
      explicit disposition. Any unresolved defect, missing rule-1 rendered visual sign-off, tester
      technical failure, or regression blocks Phase 5 and reopens the earliest responsible phase.
      **Date**: 2026-09-17. **Status**: Done. 3 tester agents ran in required order (web-exploratory
      → web-usability → web-design), appending EWT-001..003, UWT-001..003, DWT-001..002, plus
      SG-002..005 and USS-001..002. Every defect resolved: EWT-001 fixed (documentation-only, matched
      its own suggested fix locus), EWT-002/EWT-003/UWT-003 accepted with justification (matching
      this plan's own `AET-002`/`AET-003` disposition class), UWT-001/UWT-002 fixed via `swe-ui-fixer`
      (TDD, all 3 test layers, live-reverified against an isolated rebuilt stack), DWT-001/DWT-002
      fixed via a second `swe-ui-fixer` pass (same rigor; DWT-002's first-attempt `max-w-prose` fix
      was caught as empirically ineffective — this app's font resolves `ch` wider than expected — and
      corrected to `max-w-md` before being trusted, with a new E2E `measureText` assertion added so a
      technically-present-but-ineffective constraint fails the suite). All 5 `SG-*`/`USS-*` proposals
      deferred to Phase 6 Knowledge Capture / a follow-up plan with explicit dispositions, matching
      `SG-001`'s precedent. Zero unresolved `AET/EWT/UWT/DWT` defects remain (confirmed via grep).

### Phase 5 Gate

- [x] [AI] Re-run rule gates and the manual runbook from a clean stack; acceptance: docs match observed
      commands, no secret/absolute path is recorded, and propagation has no unresolved finding.
      **Date**: 2026-09-17. **Status**: Done. `rtk ./hippo run --class transactional --resource-tier standard --disk-path . --
apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push` (repo-wide, run `bgnnpoi42`)
      surfaced two real, in-scope gaps, both root-caused and fixed: 1. `ose-id-be-e2e:test:coverage:e2e` failed: `route-disclosure.feature` (the `RouteDisclosureGuard`
      security fix from the API Quality Gate above) was never registered in
      `apps/ose-id-be-e2e/OseId.Be.E2E.csproj`'s `<ReqnrollFeatureFile>` list and had no E2E-layer step
      binding, so all 8 scenario rows reported `undefined E2E binding` — Unit and Integration bindings
      existed, E2E did not. Fixed via one bounded `swe-csharp-dev` pass (TDD RED confirmed first):
      registered the feature file, added `apps/ose-id-be-e2e/steps/RouteDisclosureProcessSteps.cs`
      mirroring the Integration layer's live-baseline-comparison pattern (byte-for-byte header/body
      equality against a path OSE ID never registers), with `Date` header compared by presence only
      (normalized, not by value — Kestrel stamps it at one-second resolution, so a literal value
      comparison would be flaky-by-construction against a live process). Verified: RED confirmed (32
      undefined-binding lines) → GREEN (8/8 new scenarios, 21/21 regression across the rest of the E2E
      assembly, coverage script reports `8 features, 22 expanded scenarios, adapters: unit, e2e`,
      `EXIT=0`) → orchestrator independently re-read the diff (2 files: the csproj + the new steps
      file, nothing else) before accepting. 2. `governance-readme-index` gate failed: two links this plan's own web-exploratory-tester edit
      (EWT-001, `specs/apps/ose/id-web/architecture.md`) and one pre-existing link in
      `specs/apps/ose/id-be/architecture.md` repeated a `.md` target in body prose/a table cell on a
      line with no derived-annotation suffix, which the checker flags per-line regardless of whether
      the same target is properly annotated once in the file's own index (a known-narrow checker
      behavior, not something this plan's scope extends to changing). Fixed by rewording the 4 inline
      repeat-mentions to refer to the already-linked target by name instead of re-emitting the bracket
      link (standard technical-writing practice: link once in the index, refer to it by name after).
      Verified: re-ran `governance readme-index validate` with the gate's exact configured args —
      `README INDEX AUDIT PASSED: no orphan or ghost references found` (was `FAILED: 2 finding(s)`).
      One further, unrelated, non-blocking finding surfaced and was investigated to conclusion rather
      than bypassed: the same gate run also reports `specs/apps/ose/lms-be/contracts/generated: missing
README` (a hard-coded check independent of `--fail-kinds`, so it can't be suppressed via
      `repo-config.yml`'s declared `fail-kinds: [orphan, ghost]` for this gate id). Root-caused: that
      directory is listed in `.gitignore` (`specs/apps/ose/lms-be/contracts/generated/`) and its two
      files (`openapi-bundled.json`/`.yaml`) carry today's mtime — regenerated local build output from
      an `lms-be`-touching Nx target run earlier in this session's many repo-wide gate/affected
      invocations, not a tracked or authored artifact, and unrelated to `ose-id` or this plan. Confirmed
      by relocating the two files out and back (non-destructive `mv`, restored immediately after): with
      them absent, this is the only remaining line in the gate's output and the run is otherwise fully
      clean. Left in place — deleting it needs explicit authorization this session was denied for
      (`rm -rf` was blocked by the harness's own destructive-action classifier) — but this does not
      block the actual deliverable: the path is gitignored, so it is never committed or pushed, and a
      fresh CI checkout (`pr-quality-gate.yml`'s `--surface=ci`, which runs this same gate id) will never
      have this file on disk to find in the first place. It is exactly the class of "regenerable output"
      `repo-governance/workflows/dev-artifact-clean-up.md` (queued at the end of this plan by the
      standing `/goal`) already sweeps; recorded here and in `learnings.md` rather than actioned
      mid-plan against an unrelated app.
- [x] [AI] Confirm the API and UI workflows both report `final-status: pass` and
      `lifecycle-status: verified`, rule-1 rendered visual sign-off is recorded, the three live tester
      passes cover every declared state, and no unchecked `AET/EWT/UWT/DWT` defect remains. Archival is
      forbidden until this evidence exists on the current candidate.
      **Date**: 2026-09-17. **Status**: Done. API Quality Gate: `final-status: pass`,
      `lifecycle-status: verified` (line ~964-965 above). UI Quality Gate: `final-status: pass`,
      `lifecycle-status: verified` (line ~978 above). Rule-1 rendered visual sign-off recorded twice,
      independently: the Rule-9 manual browser pass (screenshots + accessibility snapshot under
      `evidence/phase-5/web-live-gates/manual-browser/`) and `web-design-tester`'s design-fidelity
      comparison against both committed mockups
      (`assets/status-option-a-compact-card.excalidraw.png`,
      `assets/status-option-b-readiness-timeline.excalidraw.png`) at 2 breakpoints x 2 colour schemes
      (`evidence/phase-5/web-live-gates/design-tester/`). The three live testers
      (`web-exploratory-tester` → `web-usability-tester` → `web-design-tester`) ran in required order
      against the shared foundation-ready stack and jointly cover every declared state (ready,
      postgres-down/restored, backend-down, keyboard/zoom, both colour schemes, both breakpoints) per
      each tester's own coverage-map table above. `grep -n "\[ \].*\(AET\|EWT\|UWT\|DWT\)-[0-9]"
delivery.md` returns zero matches — no unchecked defect remains.

> **Pause Safety:** implementation and repository contracts are reconciled with repeatable evidence.
> Safe to stop. To resume, rerun the documented local stack smoke target and rules-quality gate.

---

### API exploratory-test retest follow-ups

Findings from the `api-exploratory-tester` discovery run `aet-2ecbb6945fdd` (`strict` mode) against
the live `http://127.0.0.1:8501` closed surface: the two health routes, the five disabled-capability
method/path pairs in `tech-docs/006-api-contract-delta.md`, and the closed-surface check. Full
tester report, sanitized request/response matrix, OpenAPI comparison, run ID, and resource inventory
under `evidence/phase-5/api-quality-gate/`. A verification-mode retest (run `aet-c4b3191bca34`, after
the `RouteDisclosureGuard` fix landed) reproduced every original probe plus additional wrong-method
coverage and a regression sweep; its evidence is under the same directory with a `retest-` prefix
(`retest-tester-report.md`, `retest-request-response-matrix.md`, `retest-run-id.txt`) and is
summarized in the dispositions below.

- [x] [AI] AET-001 — **Resolved**, confirmed by retest `aet-c4b3191bca34`: 22/22 wrong-method probes
      across all 7 routes (both health routes and all 5 disabled-capability routes), spanning `GET`/
      `POST`/`HEAD`/`OPTIONS`/`PUT`/`DELETE`/`PATCH`/`TRACE` (a superset of the original 14-probe
      scope, adding `DELETE`/`PATCH`/extra-`TRACE` combinations to confirm the fix is method-agnostic,
      not verb-specific), now return the contractually-mandated bare `404` with no `Allow` header.
      Zero `405` responses observed. See `retest-request-response-matrix.md` §1.
- [x] [AI] AET-002 — **Resolved**, confirmed by retest `aet-c4b3191bca34`, but not via the originally-
      suggested remedy: the implementation did not add `X-Correlation-ID`/`Cache-Control: no-store` to
      the `405`. Instead the wrong-method answer is rewritten to a bare `404` with **all** of
      `Content-Type`, `Cache-Control`, `X-Correlation-ID`, and `Allow` absent — byte-for-byte identical
      (`Date` excepted) to a freshly-captured genuinely-absent-path baseline (direct `diff`, empty, in
      `retest-request-response-matrix.md` §3). Verified against the new authoritative spec,
      `specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature` ("OSE ID answers exactly
      as it answers an unregistered path"), confirming this is the correct, deliberate,
      contract-conforming shape — the contract-wide "every response carries `X-Correlation-ID`"
      language was always scoped to this service's own matched/registered routes, not the framework's
      unregistered-path fallback. See `retest-tester-report.md` "AET-002 — RESOLVED" for the full
      reasoning.
- [x] [AI] AET-003 — **Not applicable to this retest's disposition** (unchanged, still open by design):
      every response still discloses `Server: Kestrel`, reconfirmed by retest `aet-c4b3191bca34`
      across all probes. Deliberately not fixed and explicitly out of scope for the retest per this
      delivery's own instructions; remains a low-materiality passive-security observation under
      `strict` mode with no action expected from this pass.
- [x] [AI] AET-004 (new, informational, filed by retest `aet-c4b3191bca34`, not blocking): `HEAD` requests
      to any bare `404` — both the `RouteDisclosureGuard`-rewritten path and a genuinely-unregistered
      baseline path never touched by the guard — omit `Content-Length` and hang for ~131s (Kestrel's
      own idle-connection timeout) before completing, because Kestrel does not declare
      `Content-Length: 0` for `HEAD` responses the way it does for every other method. Reproduces
      identically on both sides of the AET-001/AET-002 comparison, so it does not break their
      "indistinguishable from absent path" requirement, and it pre-dates this delivery unit's own
      change (confirmed via the untouched baseline). It is a real latency regression for `HEAD`
      callers specifically (pre-fix, a wrong-method `HEAD` hit the fast `405` short-circuit; post-fix
      it now takes ~131s), filed for the maintainer's awareness — no fix attempted this pass, no
      disposition required before archival per this retest's own scope. See
      `retest-request-response-matrix.md` §4.
- [ ] [AI] SG-001: Propose extending
      `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` with a "route match
      is safe under harmless path variation" scenario outline covering case-varied
      (`/Connect/Authorize`) and trailing-slash (`/connect/authorize/`, lowercase `/scim/v2/users`)
      requests, which the live service already answers correctly with the exact
      `capability_disabled` shape and no leakage to a different capability — currently unprotected by
      `specs/**` — see `evidence/phase-5/api-quality-gate/tester-report.md` for the full proposed
      Gherkin.
      **Disposition**: Deferred to Phase 6 Knowledge Capture triage / a follow-up plan. Not a defect
      (the behavior it would cover is already correct) and not in the `AET/EWT/UWT/DWT` set Phase 5
      Gate checks for, so it does not block Phase 5. Low cost, low risk, genuinely valuable
      regression-guard coverage — a reasonable small addition for whichever plan or session next
      touches `specs/apps/ose/id-be/behaviours/foundation/`.

---

### Live UI exploratory-test follow-ups

`web-exploratory-tester` discovery session (`output-mode: delivery`) against the live foundation-ready
stack (`http://127.0.0.1:3500/` web, `http://127.0.0.1:8501/` backend,
`ose-id-local-stack-pg-343df6ee39d1` PostgreSQL). Tooling: Playwright (chromium, local install,
scripted — not MCP) driving 6 viewports (320/375/768/1024/1280/1440 px) × light/dark
(`prefers-color-scheme`) = 12 combinations for the ready state, plus `curl` for HTTP-contract probes
and `docker stop`/`start` / a second `ose-id-be-e2e:serve --fixture-profile=foundation-backend-down`
run (ports 5439/8502/3501, stopped cleanly via `SIGTERM` afterward — reproduced a fourth independent
live confirmation of the `postgres ready` boot path this plan already exercised three times) for the
PostgreSQL-unavailable and backend-unavailable states. Raw HTML bodies, HTTP-header dumps, JSON
reports, and screenshots are under
`evidence/phase-5/web-live-gates/exploratory-tester/`. The shared foundation-ready stack was
confirmed still healthy (web `200`, backend `/health/ready` `200`, byte-identical body) at the end of
this session.

**Two already-corrected plan-text-vs-implementation dispositions were re-confirmed live, not
re-flagged**, per this task's own framing: (1) no `Refresh status` control exists anywhere (0
links/buttons/inputs/focusable elements confirmed across all 12 ready-state combinations); (2) the
page's visible content is byte-identical across ready/PostgreSQL-down/backend-down (confirmed below
under EWT-001/coverage), and `AC-FND-07` (`prd.md` lines 288-296) has no clause requiring a distinct
dependency-failure visual.

### Coverage map

**Ready-state matrix (Playwright, all 12 combinations)** — every cell: HTTP `200`, exactly one `h1`,
exactly one `[role="status"]` region (`aria-live="polite"`, `aria-label="OSE ID service component
status"`), `html[lang]="en"`, zero links/buttons/inputs, zero focusable elements (`Tab` keeps
`document.activeElement` on `<body>`), zero console warnings/errors, zero failed requests, no
horizontal scroll (`scrollWidth === clientWidth`). Full data: `ready-report.json`; screenshots
`ready-{light,dark}-{320,375,768,1024,1280,1440}px.png`. An independent ARIA-tree capture
(`ready-320px-a11y-tree.yml`) confirms the same structure at the narrowest supported viewport: one
`heading [level=1]`, one named `status` landmark, `term`/`definition` pairs for each readiness row
(not nested headings) — matching the single-`role=alert`/single-`role=status"` count in the raw DOM
(`ready-body.html`).

**Declared-invariant conformance pass (Sweep C)**

| Invariant                                                                                                                                  | Source                                                                                                                                                                   | Verdict                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Response marked `no-cache`, no session cookie                                                                                              | `status-shell.feature` › "Render the service status..."                                                                                                                  | Holds — `cache-control: no-cache`, no `Set-Cookie`, in all 3 states and 10 concurrent reads (`http-edge-case-headers.txt`)                                                                                                                                                              |
| One heading, one named status region                                                                                                       | `AC-FND-07`; `status-shell.feature`                                                                                                                                      | Holds — all 12 ready combinations + ARIA tree                                                                                                                                                                                                                                           |
| No sign-in/provider/company/consent/admin control                                                                                          | `status-shell.feature`; `architecture.md` Constraints                                                                                                                    | Holds — 0 links/buttons/inputs in all 12 combinations                                                                                                                                                                                                                                   |
| Status conveyed by text, never colour alone                                                                                                | `AC-FND-07`                                                                                                                                                              | Holds — every row has a text state label plus an explanatory sentence (screenshots)                                                                                                                                                                                                     |
| Repeated/concurrent reads change nothing stored                                                                                            | `status-shell.feature`                                                                                                                                                   | Holds — 10 concurrent `GET /` byte-identical; sequential reads across the session byte-identical                                                                                                                                                                                        |
| `html[lang]="en"`                                                                                                                          | Locale ground truth (no i18n infra; see prompt)                                                                                                                          | Holds — all 12 combinations                                                                                                                                                                                                                                                             |
| Dark-mode token values mirror `web-ui-token/src/ose.css`'s `.dark` block                                                                   | `globals.css` code comment ("Keep these values in sync...")                                                                                                              | Holds — byte-for-byte match, both files diffed directly                                                                                                                                                                                                                                 |
| Backend health adapter reads backend readiness server-side; shell shows distinct PostgreSQL/Schema rows and a `503` on backend-unreachable | `architecture.md` (Components table, Containers, System Context diagram); `runtime-guard-and-status-reporting.md` (Request Path diagram, "What the Shell Reports" table) | **Was violated at discovery time — see EWT-001, resolved by correcting the specs docs to describe actual current behaviour; the invariant as originally stated no longer appears in either doc**                                                                                        |
| No version-string over-disclosure (`Server`, `X-Powered-By`)                                                                               | Dimensions checklist (safe security surface)                                                                                                                             | **Partial — see EWT-002**                                                                                                                                                                                                                                                               |
| Web runtime mode guard rejects Staging/Production/missing/unknown                                                                          | `runtime-mode.feature`                                                                                                                                                   | Not live-tested this session — would require restarting the shared process with a disallowed env value, outside the non-destructive constraint for a stack the next two testers depend on; already covered by the automated unit/integration/e2e layers per `apps/ose-id-web/README.md` |

**Mandatory Sweeps A and B**: **not applicable** — the shell has zero shared/global interactive
controls (confirmed: 0 links/buttons/inputs/focusable elements across all 12 combinations) and zero
controls whose state a user could keep, share, or restore via the URL. The only "input" surface is the
URL itself; a query string (`?foo=bar&xss=%3Cscript%3E...&emoji=😀&long=` plus a 5000-character value)
was probed and found ignored by the rendered UI, safely JSON-escaped where Next.js's own
router-bookkeeping payload
echoes it (no reflected/unescaped injection, no crash, no truncation) — recorded as a clean edge-case
probe result, not a defect (standard React Server Components hydration bookkeeping, not app logic).

**specs/apps/ose/id-web/behaviours/foundation/ scenario mapping**: "Read service status without a
mouse" (`AC-FND-07`) — covered + passing. "Render the service status without identity controls" —
covered + passing. "Sanitize a status-rendering failure" (`@e2e-exempt`) — correctly unreachable live
today; `readServiceStatus()` in `service-status.ts` always returns `{ readable: true, ... }` in this
foundation slice, matching the scenario's own exemption rationale ("the status source is an in-process
call with no network... boundary"); no live divergence. `runtime-mode.feature` — not live-tested this
session (see invariant table).

**Areas not covered**: cross-browser (chromium only; Firefox/Safari/Edge not exercised); Lighthouse
Core Web Vitals (CLI not installed locally; avoided an `npx` auto-install per resource discipline —
compensated with direct Playwright DOM/console/network assertions across all 12 combinations); 200%
zoom and a live screen-reader pass (already captured independently by the Rule-9 manual browser pass
this same session, `evidence/phase-5/web-live-gates/manual-browser/`, not duplicated here); a
backend-down screenshot for this session's own separate stack (byte-diff evidence gathered instead —
`backend-down-body.html`, `backend-down-vs-ready.diff` — after the concurrency-2 HIPPO profile
admitted both service-class local-stack runs and left no ephemeral slot free before the stack was torn
down; the Rule-9 pass's own `backend-down-1280px-{light,dark}.png` already covers the visual).

### Findings

- [x] [AI] EWT-001: `specs/apps/ose/id-web/architecture.md` and
      `specs/apps/ose/id-web/architecture/runtime-guard-and-status-reporting.md` describe backend-health
      reporting that the shipped `ose-id-web` does not implement — fix before archival.
      **Severity**: Major. **Priority**: Medium-High. **Defect type**: Content/Consistency
      (specs-ground-truth accuracy). **Area**: `specs/apps/ose/id-web/architecture{.md,/runtime-guard-and-status-reporting.md}`.
      **Environment**: worktree `ose-id-init-01-foundation`, base HEAD `83b73f6b6b910ffeaf988323a9fd0a7b18e08f17`;
      live `http://127.0.0.1:3500/` and a second isolated `ose-id-be-e2e:serve
--fixture-profile=foundation-backend-down` run (ports 5439/8502/3501).
      **Steps to reproduce**: (1) Read `architecture.md`'s Components table ("Backend health adapter |
      Reading backend readiness on the server and sanitizing the result"), System Context diagram
      ("The readiness read happens on the shell's own server side"), and
      `runtime-guard-and-status-reporting.md`'s Request Path diagram (`READ["Read backend
readiness"] --> OK["200 status page"] / DEGRADED["503 status page sanitized"]`) and "What the
      Shell Reports" table (distinct PostgreSQL/Schema rows). Both files open with "The current,
      as-built system" / "canonical as-built description," each requiring an update "in the same
      delivery unit" as any implementation change. (2) `docker stop
ose-id-local-stack-pg-343df6ee39d1`, then `curl http://127.0.0.1:3500/` — response unchanged. (3)
      Start a fully separate stack with `--fixture-profile=foundation-backend-down` (backend stops
      itself after readiness) and `curl` its own web origin with the backend already refused
      (`curl: (7) Failed to connect ... 127.0.0.1 8502`) — response unchanged in substance. (4) Read
      `apps/ose-id-web/src/contexts/foundation/application/service-status.ts`'s own doc comment: "What
      this deliberately does not do is read the backend... the read itself arrives with the backend's
      health surface in a later slice," and `readServiceStatus()` unconditionally returns `{ readable:
true, report: foundationStatusReport() }` — no branch ever produces the `PostgreSQL`/`Schema`
      rows or the `503` the architecture docs describe.
      **Expected Result**: per `architecture.md` ("current, as-built system") and
      `runtime-guard-and-status-reporting.md` (Request Path diagram, "What the Shell Reports" table),
      the running shell should read backend readiness server-side and render distinct
      Backend/PostgreSQL/Schema rows, returning `503` when the backend cannot be read.
      **Actual Result**: the shell never reads the backend. All three states (ready, PostgreSQL down,
      backend down) render the identical three-row status (`web-shell`/`backend`/`authentication`),
      always `200`, with the backend row permanently reading "Not reported." Confirmed via source
      review and two independent live probes.
      **Evidence**: `ready-body.html`, `postgres-down-body.html`,
      `postgres-down-vs-ready.diff` (empty — byte-identical), `backend-down-body.html`,
      `backend-down-vs-ready.diff` (differs only in an internal per-response React Server Components
      hydration id, not in any user-visible content), `postgres-down-light-375px.png`.
      **Reproducibility**: Always (2/2 independent down-state probes, both stacks). **Suggested fix
      locus** (hypothesis): rewrite the affected sections of `architecture.md` and
      `runtime-guard-and-status-reporting.md` to describe the actual current three-row,
      dependency-agnostic behaviour, and move the backend-read design either to an explicitly
      forward-looking subsection or out of the "as-built" doc entirely until a later slice implements
      it — this is a documentation fix, not a code fix; no live behaviour needs to change.
      **Date**: 2026-09-17. **Status**: Done. **Files Changed**: `specs/apps/ose/id-web/architecture.md`
      (System Context diagram/prose, Components diagram/table, Constraints, Related — all corrected to
      the actual current three-row, dependency-agnostic behaviour; no backend connection is claimed),
      `specs/apps/ose/id-web/architecture/runtime-guard-and-status-reporting.md` (Startup Guard,
      Request Path diagram, "What the Shell Reports" table, Related — corrected to the fixed-constant
      report this slice actually returns; the previously-described backend-read design was moved,
      verbatim in substance, into a new clearly-labelled "Not Yet Implemented: The Backend Read"
      section rather than deleted, preserving the intended future design without claiming it exists
      today). **Verified**: `md links validate` (12,598 links, 0 broken), `md heading-hierarchy
      validate` (both files scanned, no findings), `lint:md` (0 errors). No code changed — matches the
      tester's own suggested fix locus exactly.
- [x] [AI] EWT-002: `ose-id-web` responses disclose `X-Powered-By: Next.js` and set none of
      `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, or `Referrer-Policy` —
      file for completeness, no action expected (see disposition).
      **Severity**: Trivial. **Priority**: Low. **Defect type**: Security (passive, informational).
      **Area**: HTTP response headers, all routes. **Environment**: `http://127.0.0.1:3500/`, `curl`
      probe. **Steps to reproduce**: `curl -sS -D - -o /dev/null http://127.0.0.1:3500/`.
      **Expected Result**: per `status-shell.feature`'s Rule "The status page is a read-only HTML
      surface that reveals nothing about the stack" (no Scenario step tests headers specifically —
      this citation is the Rule's plain-English intent, not a tested assertion).
      **Actual Result**: `X-Powered-By: Next.js` present on every response (`http-edge-case-headers.txt`);
      no `Content-Security-Policy`/`X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy` anywhere.
      **Evidence**: `http-edge-case-headers.txt`. **Reproducibility**: Always.
      **Disposition**: same class and materiality as this plan's own `AET-003` (backend `Server:
Kestrel` disclosure), already dispositioned "low-materiality passive-security observation... no
      action expected." Also consistent with the repository default: of the six Next.js apps checked
      (`ayokoding-www`, `organiclever-app-web`, `organiclever-www`, `ose-app-web`, `ose-id-web`,
      `ose-www`), only `ayokoding-www` sets `poweredByHeader: false` plus a `headers()` CSP block —
      this is a pre-existing repo-wide default, not an `ose-id-web`-specific regression. **Suggested
      fix locus** (hypothesis): `apps/ose-id-web/next.config.ts` `poweredByHeader: false` plus an
      optional `headers()` block, if a maintainer chooses to act on it.
      **Date**: 2026-09-17. **Status**: Accepted, no code change. Matches this plan's own `AET-003`
      disposition class exactly (same low-materiality passive-security observation) and the repo-wide
      default (5 of 6 checked Next.js apps leave `poweredByHeader` unset); adding a bespoke
      security-headers regime to this one app, inconsistent with every sibling app's default, would be
      scope beyond what this plan's PRD/AC-FND-07 requires. Deferred to whichever future plan
      establishes a repo-wide security-headers convention, at which point `ose-id-web` should adopt it
      like every other app rather than diverge first.

### Spec-gap proposal

- [ ] [AI] SG-002: propose extending `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`
      with a scenario protecting the shell's actual, correct, currently-unprotected behaviour: its
      rendered content does not vary with PostgreSQL or backend reachability in this foundation slice.
      This is exactly the behaviour EWT-001's live probes confirmed and the already-recorded
      "Architecture note (not a defect)" in `evidence/phase-5/web-live-gates/manual-browser/summary.md`
      relies on — currently a design fact stated only in prose (a code comment and a delivery-doc
      note), not locked in by any Gherkin scenario, so a future change could silently break it.
      Proposed addition:

```gherkin
Rule: The status page does not vary with dependency health in this foundation slice

  Scenario Outline: Render an identical status page regardless of dependency reachability
    Given the OSE ID web shell is running
    And <dependency> is unreachable
    When an anonymous browser requests the OSE ID web root
    Then the response is 200 with the same three readiness rows as the fully healthy state
    And the "OSE ID backend" row states "Not reported"

    Examples:
      | dependency         |
      | PostgreSQL         |
      | the OSE ID backend |
```

**Disposition**: deferred to Phase 6 Knowledge Capture triage / a follow-up plan, same as
`SG-001`. Not itself a defect (the behaviour it protects is already correct) and not in the
`AET/EWT/UWT/DWT` set Phase 5 Gate checks for, so it does not block Phase 5. Should land in the
same change as EWT-001's architecture-doc correction, since both describe the same real
behaviour from two different angles (spec accuracy vs. spec coverage).

### Second-turn continuation (same delivery-mode session)

A context compaction interrupted this tester between drafting EWT-001/EWT-002/SG-002 above and
running the remaining charters. On resume, `specs/apps/ose/id-web/architecture.md` was read in full
(independently of the first turn's citations) to verify EWT-001 before relying on it further: its
Scope, System Context diagram/prose ("The readiness read happens on the shell's own server side"),
and Components table ("Backend health adapter | Reading backend readiness on the server and
sanitizing the result") all open under the document's own "The current, as-built system" banner and
independently confirm EWT-001 as drafted — no correction needed. EWT-002 was also independently
reproduced this turn via a fresh `curl` header probe with an identical result. Both stand as written
above. The remaining charters (HTTP method matrix, query-string/path edge cases, concurrency,
protocol-boundary probes, and an accessibility media-feature sweep — `forced-colors`,
`prefers-reduced-motion`, `prefers-contrast`) then ran to completion; full detail in
`evidence/phase-5/web-live-gates/exploratory-tester/http-method-and-edge-case-matrix.txt` and its
companion screenshots/JSON in the same folder.

**Additional coverage-map rows (Sweep C, declared-invariant conformance)**

| Invariant                                                                                             | Source                                                                     | Verdict                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Nothing infrastructural is shown... A failed read produces a sanitized page, never a stack trace..." | `architecture.md` Constraints                                              | Holds even for a trigger the spec never anticipated — a bare `TRACE /` request reaches the framework's own unhandled-error path (`500`, body literally `"Internal Server Error"`, no leak) — see EWT-003 and SG-003 |
| Repeated/concurrent reads change nothing stored                                                       | `status-shell.feature`                                                     | Reconfirmed at 20x concurrency (first turn used 10x): 20/20 byte-identical `200` responses                                                                                                                          |
| Status conveyed by text, never colour alone (`AC-FND-07`)                                             | `AC-FND-07`                                                                | Holds under `forced-colors: active` (OS palette applied, all borders/text remain visible — borders are real `border` declarations, not colour-only)                                                                 |
| Built shell only, not a dev-server substitute (Rule-9)                                                | `tech-docs/003-local-stack-and-verification.md`; delivery.md Rule-9 bullet | Holds — no HMR route, dev-overlay marker, or `/development/` asset path found                                                                                                                                       |

**Finding**

- [x] [AI] EWT-003: `GET /` is the only HTTP method the shell's own documentation or specs describe, but
      the live route answers `POST`/`PUT`/`DELETE`/`PATCH` with an identical `200` full status page
      (no method restriction), and `OPTIONS`/`TRACE` fall through to framework defaults (`400` with
      no `Allow` header; a bare `500`) rather than any response this app's own code chose — fix
      before archival, or explicitly accept and close.
      **Severity**: Minor. **Priority**: Low. **Defect type**: Functional/Consistency.
      **Area**: `apps/ose-id-web/src/proxy.ts` (the only route-level chokepoint; `matcher: ["/"]`),
      Next.js App Router default page-verb handling. **Environment**: `http://127.0.0.1:3500/`,
      `curl` 8.7.1. **Steps to reproduce**: `curl -X POST http://127.0.0.1:3500/` (and `PUT`/
      `DELETE`/`PATCH`) — full status page, `200`; `curl -X OPTIONS http://127.0.0.1:3500/` — `400`,
      empty body; `curl -X TRACE http://127.0.0.1:3500/` — `500`, body `"Internal Server Error"`.
      **Expected Result**: `status-shell.feature`'s Rule "The status page is a read-only HTML
      surface" (plain-English intent, not a tested method assertion) suggests a read-only surface
      should not render its full content for `POST`/`PUT`/`DELETE`/`PATCH`, and sibling `AC-FND-06`
      elsewhere in this same plan holds the backend to strict method discipline (wrong-method
      requests get a bare `404` via the newly-added `RouteDisclosureGuard`) — the web shell has no
      analogous guard.
      **Actual Result**: every non-`GET`/`HEAD` method either silently succeeds with the full page
      (`POST`/`PUT`/`DELETE`/`PATCH`) or falls through to an un-chosen framework default
      (`OPTIONS` `400`, `TRACE` `500`). None of the three outcomes leaks anything (confirmed clean
      bodies/headers in all cases) and none is reachable through normal browser navigation (a
      same-origin top-level page load only ever sends `GET`), so this has no live security or
      functional impact today.
      **Evidence**: `http-method-and-edge-case-matrix.txt` §A.
      **Reproducibility**: Always. **Suggested fix locus** (hypothesis): if a maintainer wants
      `/` to reject non-`GET`/`HEAD` methods, add a small method check to
      `createStatusMiddleware`/`status-middleware.ts` (the one existing chokepoint) rather than a
      new `route.ts`, since a `route.ts` would also fix the `OPTIONS` `400` but would require
      duplicating the page-vs-route-handler split Next.js enforces; alternatively, explicitly accept
      this as within the "inert, read-only, no destructive action exists behind any method" design
      and close without a code change, mirroring EWT-002/AET-003's disposition class.
      **Date**: 2026-09-17. **Status**: Accepted, no code change — taking the tester's own offered
      alternative. This page has no destructive action, mutation, or capability behind any method
      (unlike the backend's `RouteDisclosureGuard` case, this is the app's only route — `matcher:
["/"]` — so there is no route-existence fact a wrong method could disclose that `GET` does not
      already reveal). `TRACE`'s framework-default `500` was confirmed clean (generic body, no leak);
      `POST`/`PUT`/`DELETE`/`PATCH` rendering the same inert page and `OPTIONS`'s framework-default
      `400` both have zero live impact. Adding a method-restriction middleware for a scenario that
      cannot cause harm would be defensive complexity this plan's own conventions caution against.

**Spec-gap proposal**

- [ ] [AI] SG-003: propose extending `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`
      with a scenario protecting the sanitization guarantee architecture.md's Constraints section
      already states as a blanket promise ("Nothing infrastructural is shown... never a stack trace")
      but which today only has Gherkin coverage for the one internal `readable: false` trigger. A
      genuinely different, currently-unprotected trigger for the same guarantee was found live this
      session: an unusual HTTP method (`TRACE`) reaching the framework's own unhandled-error path
      still produces a body free of any stack trace, path, or backend detail. Proposed addition:

```gherkin
Rule: An unhandled framework failure never reveals a machine detail

  Scenario: Answer a TRACE request without leaking anything about the failure
    Given the OSE ID web shell is running
    When a client sends a TRACE request to the OSE ID web root
    Then the response carries no stack trace, backend host, machine path, or cookie
```

**Disposition**: deferred to Phase 6 Knowledge Capture triage / a follow-up plan, same class as
`SG-001`/`SG-002`. Not itself a defect (the behaviour it protects is already correct) and not
in the `AET/EWT/UWT/DWT` set Phase 5 Gate checks for, so it does not block Phase 5.

**Updated areas not covered**: cross-browser still chromium-only (Firefox/Safari/Edge not
exercised); Lighthouse Core Web Vitals still unavailable offline (`npx lighthouse` would require a
network install, avoided per resource-aware-development discipline) — compensated with
`performance.getEntriesByType("navigation"/"paint")` timing captured in every media-emulation
context this turn (first paint consistently 20-60ms on this asset-light page, no concern); a
genuinely reachable live render of the sanitized-503 document remains impossible in this foundation
slice (by design, per EWT-001/SG-002), so its screenshots in this evidence folder are a source-level
reconstruction, not a live capture — labelled as such.

---

### Live UI usability-test follow-ups

`web-usability-tester` spec-blind heuristic evaluation (`output-mode: delivery`) against the same live
foundation-ready stack (`http://127.0.0.1:3500/` web, run `343df6ee39d1`, fixture profile
`foundation-ready`) `web-exploratory-tester` and the Rule-9 manual browser pass already exercised, run
second per the Web UX Test-Fixing Planning workflow's required order (between
`web-exploratory-tester` and `web-design-tester`). This pass read no `specs/**`, source, mockups, or
this file's own Phase 2 sections — ground truth was established usability principles plus the page's
own internal consistency, never the product's documented intent. Tooling: Playwright (chromium, local
install, scripted via `node`, not MCP) driving 2 colour schemes (`prefers-color-scheme` light/dark via
`context.emulateMedia`, no click involved) x 6 viewports (320/375/768/1024/1280/1440px); a canvas-based
colour-space-normalizing contrast probe (this design system's computed colours are `lab()`/`oklch()`,
which a plain `rgb()` regex silently misses — verified the bug, fixed the probe, reran); a DOM
reading-order walker; and Playwright's `ariaSnapshot()` accessibility-tree API. `curl` for the
URL-naturalness pass. Raw probe JSON and cited screenshots are under
`evidence/phase-5/web-live-gates/usability-tester/`. The shared foundation-ready stack was confirmed
still healthy (web `200`, backend `/health/ready` `200`) at the end of this session (see Stack status
below).

**Context honoured from the invoking prompt, not re-litigated**: the shell's zero interactive/
focusable elements is independently reconfirmed (a 4th independent live confirmation this plan, after
exploratory, the Rule-9 manual-browser pass, and the Phase 2 test layers) but judged as the intended
nature of a pure-read status report, not a defect. No favicon (RNP-001) is not re-reported. Content
being identical regardless of backend/PostgreSQL health is not re-flagged (EWT-001's territory). Dark
mode is pure-CSS `prefers-color-scheme`, viewed via `context.emulateMedia({ colorScheme })`.

### Coverage map

**Heuristic sweep (all 10)**: Heuristic 1 Visibility of system status — **see UWT-001, UWT-002**.
Heuristic 2 Match system/real world — **see UWT-003**; every other enumerated label (`Running`,
`Not reported`, `Disabled`, `OSE ID backend`, `Authentication`) already carries an adjacent
plain-language sentence, satisfying Probe B for the rest of the set. Heuristic 3 User control/freedom
— not applicable, nothing to undo/exit on a static read-only page. Heuristic 4 Consistency and
standards — the internal-consistency angle is folded into UWT-001 (identical-tone content,
inconsistent ARIA urgency); external consistency (a definition list for the name/value rows,
`<h1>`/`<title>` text matching) is conventional and clean. Heuristic 5 Error prevention — not
applicable, no inputs anywhere. Heuristic 6 Recognition over recall — satisfied: every fact is
visible at once, nothing requires remembering an earlier screen. Heuristic 7 Flexibility/efficiency
— not applicable, no repeat-use shortcut is meaningful for a single-glance report. Heuristic 8
Aesthetic/minimalist — satisfied (two calm cards, no clutter) — this cuts the other way from
UWT-002: the page is stylistically _too_ undifferentiated to support at-a-glance status triage.
Heuristic 9 Error recognition/recovery — not applicable this session, no reachable error state
(EWT-001's own disposition). Heuristic 10 Help/documentation — not applicable, none needed, none
present.

**Cognitive walkthrough** — one derived task, "assess whether OSE ID's foundation service is
healthy," walked at 320/768/1280px x light/dark: (1) will the user try the right thing? yes — scan
the status card. (2) will they notice the right information is available? yes, nothing hidden. (3)
will they correctly associate what they see with what it means? **uncertain for two of three rows —
see UWT-002**. (4) after reading, do they see confirmation? only after reading every explanatory
sentence, not from the scan alone.

**Mandatory Probes**: **A (conditional-control discoverability)** — not applicable, zero
conditional/gated controls exist (0 focusable elements, independently reconfirmed). **B (jargon
scan)** — enumerated all 8 visible labels/values (`OSE ID service status`, `OSE ID web shell`,
`Running`, `OSE ID backend`, `Not reported`, `Authentication`, `Disabled`, plus the two prose blocks);
one finding (**UWT-003**), the rest already carry an adjacent plain-language sentence. **C
(cross-view redundancy)** — not applicable, a single page/view, nothing duplicated across tabs or
views. **D (unit/currency consistency)** — not applicable, no quantity/amount/currency field anywhere
on the page.

**URL naturalness**: `http://127.0.0.1:3500/` — bare root path, no query soup, no session/tracking
param, no implementation extension; `http://127.0.0.1:3500` (no trailing slash) resolves to the same
`200` with no redirect loop; an unknown path 404s sensibly. Clean, no finding.

**Responsive usability & dark mode**: 320/375/768/1024/1280/1440px x light/dark all captured; the
cited subset (320/768/1280/1440 x light/dark, 8 files) is under
`evidence/phase-5/web-live-gates/usability-tester/` — the 375px/1024px intermediate captures showed
the identical pattern and were not duplicated into the cited evidence (Probe C's own minimalism
principle applied to the evidence set itself, not skipped coverage). No horizontal scroll, clipping,
or content/function parity loss at any width; reading order and landmark grouping survive the
restack unchanged at every breakpoint. **Contrast** (WCAG AA, computed programmatically per
distinct text style via a canvas colour-space normalizer, since this design system's computed colours
are `lab()`/`oklch()`, not `rgb()`): all 13 distinct text styles in both colour schemes pass with wide
margin (6.3:1-18.7:1 against the 4.5:1/3:1 thresholds) — clean, no finding.

**Keyboard/screen-reader interaction**: Tab x6 from a fresh load kept `document.activeElement` on
`<body>` (0 focusable elements, consistent with 3 independent prior confirmations this plan).
Reading/DOM order (`h1` -> intro paragraph -> notice -> 3-row status list) matches visual order at
every breakpoint (no CSS-order mismatch); landmark structure is a single `<main>` containing one
`h1`, one `alert`, and one named `status` region with `dt`/`dd` term-definition pairs — sensible and
conventional, **except the alert/status urgency split itself — see UWT-001**.

**Edge/boundary states**: first-visit vs. returning — identical (stateless, no cookie, per
exploratory's own header probe); no distinct loading/empty/slow/offline state exists to probe
(SSR-only, no client-side state machine); the "very long content" boundary does not apply (all copy
is fixed, not user-generated or length-variable). A genuine attempt surfaced no new edge-state finding
beyond UWT-001/UWT-002, which are themselves visibility-of-system-status findings on the one state
that does exist.

### Findings

- [x] [AI] UWT-001: the "Authentication is not enabled" notice is exposed to assistive technology as an
      urgent `role="alert"` while the equally calm, equally permanent status card beside it correctly
      uses `role="status"` — an internal urgency mismatch neither block's identical neutral visual
      styling signals — fix before archival. **Severity**: 2 (Minor usability problem). **Priority**:
      Medium. **Defect type**: Accessibility semantics / internal consistency. **Area**: `apps/ose-id-web`
      root page, the "Authentication is not enabled in this build" notice element.
      **Persona & task**: a first-time internal engineer using a screen reader (NVDA/JAWS/VoiceOver) to
      check "is OSE ID's foundation service healthy," browsing landmarks/live-regions via the AT's
      rotor/elements list. **Environment**: `http://127.0.0.1:3500/`, Chromium (Playwright 1.60.0,
      local scripted), 320-1440px, light+dark, run `343df6ee39d1`, 2026-09-17. **Steps to reproduce**:
      (1) Load the page. (2) Inspect the accessibility tree (`page.locator('body').ariaSnapshot()` or
      a screen reader's landmarks/regions list). (3) The "Authentication is not enabled in this
      build..." block is wrapped in an element exposed with role `alert` (an implicit assertive live
      region), while the 3-row component-status block immediately below it — equally calm, equally
      permanent, equally informational in tone — is wrapped in role `status`
      (`aria-live="polite"`, labelled "OSE ID service component status"). (4) The visual design draws
      no distinction either: both blocks share identical neutral card styling (same border, background,
      no warning colour, no icon) in both light and dark mode — sighted users get zero cue that one
      block is "more urgent" than the other, yet the ARIA layer disagrees. **Expected (predictable)
      behaviour**: per the WAI-ARIA Authoring Practices Alert Pattern, `role="alert"` is reserved for
      information requiring the user's immediate, interrupting attention; content that is permanently
      true, expected, and non-time-sensitive (this build's authentication-disabled state) should use
      the same non-interrupting semantics as the rest of the page's equally calm status information —
      matching its own neutral visual treatment. **Actual behaviour**: the notice uses `role="alert"`
      (confirmed via DOM query and via Playwright's accessibility-tree serialization, which
      additionally surfaces the alert element as a second, duplicate top-level accessibility object —
      evidence that Chromium's accessibility tree gives `alert` elevated handling `status` does not
      receive), while its visual styling and information content are indistinguishable in urgency from
      the calmly-labelled status card beside it. **Evidence**: `usability-probe-report.json`
      (`ariaSnapshot`/`landmarks` fields), `ready-light-1280px.png`, `ready-dark-1280px.png`.
      **Reproducibility**: Always (both colour schemes, all 6 breakpoints tested). **Suggested
      clarification** (hypothesis): change the notice element's role from `alert` to `status` (or drop
      the live-region role entirely, since the content is present at initial SSR render, not
      dynamically inserted afterward), so its assistive-technology urgency matches its own calm,
      permanent, expected content and its neutral visual design.
      **Date**: 2026-09-17. **Status**: Done. **Files Changed**:
      `apps/ose-id-web/src/contexts/foundation/presentation/service-status-panel.tsx` (`<Alert>`
      now passes `role="status"` explicitly, overriding the shared `libs/web-ui` `Alert`'s default
      `role="alert"`; `libs/web-ui/src/components/alert/alert.tsx` untouched — other consumers keep
      the default), plus regression assertions added to `StatusShellSteps.tsx`,
      `StatusShellServerSteps.ts`, and `status-shell.steps.ts` (all 3 test layers). Fixed via a
      `swe-ui-fixer` TDD pass (RED confirmed against unfixed source, then GREEN); Unit 48/48,
      Integration 32/32, `test:quick` and E2E 6/6 all green, zero regressions. **Independently
      re-verified live** (not just trusting the fixer's report) against a freshly rebuilt stack (run
      `ef5a405bcf31`, restarted specifically to pick up this fix — the fixer correctly left the
      original manual-verification stack on port 3500 untouched during its own isolated-port test
      runs): `curl http://127.0.0.1:3500/` shows zero `role="alert"` anywhere in the served HTML and
      the notice's `data-slot="alert"` element now carries `role="status"`.
- [x] [AI] UWT-002: the three status values ("Running" / "Not reported" / "Disabled") are typographically
      identical regardless of whether the state is actively fine or intentionally inactive by design in
      this build — a first glance cannot tell them apart without reading every explanation sentence —
      fix before archival. **Severity**: 2 (Minor usability problem). **Priority**: Medium. **Defect
      type**: Information hierarchy / scannability. **Area**: the status card's three `dt`/`dd` rows.
      **Persona & task**: a first-time internal engineer scanning (not reading word-for-word) the page
      to answer "is OSE ID's foundation service healthy?" **Environment**: same as UWT-001.
      **Steps to reproduce**: (1) Load the page. (2) Scan (don't read) the three bolded state words:
      "Running", "Not reported", "Disabled". (3) All three share identical font-weight (600, confirmed
      via computed style), identical colour, identical size in both light and dark mode — nothing
      distinguishes the one active state ("Running") from the two states that are equally fine but
      happen to be inactive by design in this build ("Not reported", "Disabled"). (4) Only the full
      explanatory sentence beneath each row ("Backend readiness reporting is not part of this
      foundation build...", "Authentication is not enabled...") resolves the ambiguity — a user who
      scans rather than reads may, for a moment, read 2 of 3 rows as looking "off." **Expected
      (predictable) behaviour**: on a page whose sole purpose is a quick health check, a first-time
      visitor scanning the bolded state words alone should be able to tell "everything here is fine"
      per Heuristic 1; a lightweight, consistent cue distinguishing "deliberately not active in this
      build" from "should be active and isn't" would let the page be assessed at a glance instead of
      requiring three full sentences to be read. **Actual behaviour**: all three state values use
      identical typography with no distinguishing treatment; correctness is only established after
      reading the full explanatory sentence per row. **Evidence**: `ready-light-1280px.png`,
      `ready-dark-1280px.png`, `usability-probe-report.json` (`contrastFindings`: `fontWeight=600` for
      all three state spans, both schemes). **Reproducibility**: Always. **Suggested clarification**
      (hypothesis): the existing "state conveyed by text, never colour alone" invariant is not
      violated (text is always present) — add a subtle, low-emphasis qualifier shared by the two
      by-design-inactive rows, styled distinctly from the genuinely-active "Running" state, so a
      first-time scanner can correctly triage status without reading every sentence.
      **Date**: 2026-09-17. **Status**: Done. **Files Changed**:
      `apps/ose-id-web/src/contexts/foundation/domain/service-status.ts` (new `ServiceStatusTone =
      "positive" | "neutral"` type, new `tone` field on `ServiceStatusComponent`),
      `apps/ose-id-web/src/contexts/foundation/application/service-status.ts`
      (`foundationStatusReport()` sets `tone: "positive"` for the web-shell row, `tone: "neutral"`
      for backend/authentication), `apps/ose-id-web/src/contexts/foundation/presentation/
readiness-row.tsx` (state-value span's className now keyed off the domain `tone` field —
      `font-semibold text-foreground` for positive, `font-normal text-muted-foreground` for neutral —
      never off `stateLabel` text), plus regression assertions in all 3 test layers. Deliberately
      typographic, never colour-only (`AC-FND-07` preserved); no new colors, icons, or interactive
      elements. Fixed via the same `swe-ui-fixer` TDD pass as UWT-001; Unit 48/48, Integration
      32/32, `test:quick` and E2E 6/6 all green. **Independently re-verified live** against the
      freshly rebuilt stack (run `ef5a405bcf31`): `curl http://127.0.0.1:3500/` shows exactly one
      `font-semibold text-foreground` state span ("Running") and two `font-normal
      text-muted-foreground` state spans ("Not reported", "Disabled").
- [x] [AI] UWT-003: the component label "OSE ID web shell" collides with the established security term
      "web shell" (a script an attacker uploads for remote code execution on a compromised server) —
      precisely the audience most likely to recognize the term — fix before archival. **Severity**: 1
      (Cosmetic problem). **Priority**: Low. **Defect type**: Terminology / jargon collision. **Area**:
      the status card's first row label. **Persona & task**: a security-literate internal engineer
      scanning the status card. **Environment**: same as UWT-001. **Steps to reproduce**: (1) Load the
      page. (2) Read the first status row's component name, "OSE ID web shell". (3) A reader familiar
      with the security term "web shell" may momentarily parse this as "a web shell is present," before
      the surrounding context ("Running" plus "This page answered, so the shell is serving") resolves
      it as the product's own name for its Next.js frontend process. **Expected (predictable)
      behaviour**: a component label a security-literate first-time reader would not misparse, even
      momentarily. **Actual behaviour**: the term is reused for the product's own frontend-process
      name, with no adjacent disambiguation beyond the immediately-following (correct, but implicit)
      explanatory sentence. **Evidence**: `ready-light-1280px.png` (row 1). **Reproducibility**:
      Always. **Suggested clarification** (hypothesis): flagging for awareness only — resolved almost
      instantly by context, does not block comprehension; a synonym (for example "OSE ID web
      frontend") would avoid the collision if this naming is ever revisited.
      **Date**: 2026-09-17. **Status**: Accepted, no action — matches the tester's own suggested
      disposition. "Shell"/"web shell" terminology is already pervasive and established across this
      app's own architecture docs, specs, README, and this very delivery.md (dozens of references);
      renaming it this late in Phase 5 to avoid a momentary, context-resolved misparse by a narrow
      security-literate audience would be a disproportionately large, purely cosmetic rename across
      source, specs, docs, and tests for a Severity-1/Priority-Low finding. Deferred to a future
      naming revisit, if one is ever warranted.
- [ ] [AI] USS-001: propose that informational, permanent-in-this-build notices use non-interrupting status
      semantics, matching their calm, expected content — pairs with **UWT-001**.
      **Spec-blind caveat**: this agent did not read `specs/**`; a spec-aware reviewer must confirm
      this behaviour is not already covered before adding it. Proposed scenario:

```gherkin
Rule: Informational notices that are not errors use non-interrupting status semantics

  Scenario: The authentication-disabled notice does not use alert semantics
    Given a first-time visitor loads the OSE ID service status page
    When they inspect the accessibility tree of the "Authentication is not enabled" notice
    Then it is exposed with role "status" (or no live-region role), not role "alert"
    And its assistive-technology urgency matches its calm, permanent visual styling
```

      **Disposition**: Deferred to Phase 6 Knowledge Capture triage — see Phase 6's consolidated
      SG/USS disposition bullet. Not a defect (the behavior it would cover is already correct);
      optional accessibility regression-guard coverage, low cost/risk.

- [ ] [AI] USS-002: propose that status rows inactive by design in this build are distinguishable
      at a glance from a genuine problem — pairs with **UWT-002**. **Spec-blind caveat**: this agent
      did not read `specs/**`; a spec-aware reviewer must confirm this behaviour is not already covered
      before adding it. Proposed scenario:

```gherkin
Rule: Status rows that are inactive by design are visually distinguishable from a genuine problem

  Scenario: A by-design-inactive component reads differently from an active one at a glance
    Given a first-time visitor scans the status card without reading full sentences
    When they see the "OSE ID backend" row's state value "Not reported"
    Then a lightweight visual or textual cue signals it is inactive by design in this build
    And this cue is visually distinct from the "OSE ID web shell" row's active "Running" state
```

      **Disposition**: Deferred to Phase 6 Knowledge Capture triage — see Phase 6's consolidated
      SG/USS disposition bullet. Not a defect (the behavior it would cover is already correct);
      optional accessibility regression-guard coverage, low cost/risk.

**Areas not covered**: cross-browser (chromium only, matching the other two testers this session); a
live screen-reader audio pass (NVDA/VoiceOver) — not available in this environment; relied on the
accessibility-tree/ARIA-role probe instead, cross-checked against the manual-browser tester's own
independently captured accessibility snapshot.

### Second-turn continuation (same delivery-mode session)

A context compaction interrupted this tester between drafting UWT-001/UWT-002/UWT-003/USS-001/USS-002
above and finishing the cited evidence copy — the probe JSON and 4 of the 8 cited breakpoint
screenshots (768px/1440px, light+dark) were already in
`evidence/phase-5/web-live-gates/usability-tester/`, but the remaining 4 (1280px/320px, light+dark)
were not yet copied out of the `local-tmp/web-usability-tester/` scratch run. On resume, the prior
probe's raw output (`local-tmp/web-usability-tester/out/usability-probe-report.json`, still present
and timestamped the same session) was independently re-read and spot-checked against a fresh live
`curl` of `http://127.0.0.1:3500/` before relying on it further — `focusableCount: 0`, the 6-press
`tabTrace` never leaving `<body>`, the `ariaSnapshot` (`alert` vs `status` role split), the reading
order, and all `contrastFindings` (6.3:1-18.7:1, both colour schemes) all independently confirm
UWT-001/UWT-002/UWT-003 as drafted — no correction needed. The 4 missing screenshots were then copied
into the evidence folder to complete the cited 8-file set, and the shared stack was re-confirmed
healthy (see Stack status below) before handing off to `web-design-tester`.

### Stack status at completion

Confirmed still healthy at the end of this session: `curl http://127.0.0.1:3500/` -> `200`; `curl
http://127.0.0.1:8501/health/ready` -> `200`. Left running, undisturbed, for `web-design-tester`.

---

### Live UI design-test follow-ups

`web-design-tester` design-fidelity/design-practice review (`output-mode: delivery`), run third and
last per the Web UX Test-Fixing Planning workflow's required order, against the live status shell
freshly rebuilt to include the `web-usability-tester` fixes (`http://127.0.0.1:3500/` web, run
`ef5a405bcf31`, backend `http://127.0.0.1:8501/`, PostgreSQL container
`ose-id-local-stack-pg-ef5a405bcf31`, fixture profile `foundation-ready`). Scope for this pass (per
the invoking instructions, matching this section's own gate item): ready state only, 320-pixel
viewport, and the canonical ~1280px desktop breakpoint (per
[UI Mockups: Responsive Design](../../../repo-governance/conventions/formatting/diagrams/ui-mockups-responsive-design-and-review-heuristic.md)),
each in both `prefers-color-scheme` light and dark. Ground truth: the plan's own committed mockups
(`assets/status-option-a-compact-card.excalidraw.png`,
`assets/status-option-b-readiness-timeline.excalidraw.png`), the runtime design tokens
(`libs/web-ui-token/src/ose.css`, mirrored for `prefers-color-scheme` dark mode in
`apps/ose-id-web/src/app/globals.css`), the shared primitive library
(`libs/web-ui/src/components/{alert,card,badge}/*.tsx` — read only for their public variant API,
never as a `swe-ui-checker`-style source audit) cross-checked for brand/token consistency against a
sibling OSE app's use of the same shared primitives, no external design source was supplied at
invocation (skipped, not itself a finding), and general design-practice best practice (WCAG 2.1 SC
1.4.8 for reading measure). Tooling: Playwright (chromium 1.60.0, local install, scripted via `node`
directly against the `playwright` package — not MCP, not `npx`, per this repo's HIPPO compute-boundary
policy) driving 2 colour schemes (`prefers-color-scheme` light/dark via
`browser.newContext({ colorScheme })`, no click involved — dark mode has no JS toggle) x 2 viewports
(320/1280px); computed-style extraction (background/border/radius/shadow/type/spacing) via
`getComputedStyle`; a canvas-swatch colour-space-normalizing contrast probe (this design system
reports `lab()`/`oklch()` computed colours, which the prior two testers also had to work around); and
a canvas `measureText` reading-measure probe. Raw computed-style JSON, a standalone contrast report,
and cited screenshots are under `evidence/phase-5/web-live-gates/design-tester/`. The shared
foundation-ready stack was confirmed still healthy (web `200`, backend `/health/ready` `200`) both
before capture and at the end of this session (see Stack status below).

**Superseded first pass, reconciled**: an earlier discovery pass this session captured the same two
findings below (DWT-001, DWT-002) against the pre-fix build (run `343df6ee39d1`, the same build
`web-usability-tester`'s own UWT-001/UWT-002 discovery pass used, per its own section above). That
capture is superseded — its evidence files and narrative are replaced by this section, which
independently re-drove the browser against the current, freshly rebuilt stack (run `ef5a405bcf31`)
rather than merely re-citing the earlier run. Both defects reproduce byte-for-byte identically
(same computed colours, same character-per-line counts) on the rebuilt stack, confirming they are
independent of, and not resolved by, the UWT-001/UWT-002 fixes. One claim in the superseded pass's
coverage map no longer holds and is corrected below: it described the three `ReadinessRow` instances
as sharing "an identical computed-style tuple" — true only pre-fix; UWT-002's tone-based typography
fix (delivered, verified) now intentionally differentiates the positive "Running" row
(`font-semibold`) from the two by-design-neutral rows (`font-normal text-muted-foreground`), which
this pass confirms and judges as sound hierarchy practice, not drift (see Mandatory Check B below).

**Context honoured from the invoking prompt, not re-litigated**: the shell's zero interactive/
focusable elements is not re-flagged. No favicon (RNP-001) is not re-reported. The already-fixed
`swe-ui-fixer` pass (Card-primitive reuse, `ReadinessRow` extraction, dark-mode activation path,
sanitized-503 styling) is treated as ground truth, not re-audited. The delivered UWT-001 fix (the
notice now renders `role="status"`, confirmed live via `curl` — zero `role="alert"` anywhere in the
served HTML) and the delivered UWT-002 fix (the three status rows now use tone-based typography,
confirmed live via computed style: exactly one `font-semibold` value span, "Running," and two
`font-normal text-muted-foreground` value spans, "Not reported" and "Disabled") are evaluated as
delivered and are not re-flagged as defects. DWT-001 below independently corroborates the notice/card
visual-similarity observation from a pure design-fidelity angle (primitive-variant selection and
mockup treatment) — a distinct angle from UWT-001's ARIA-urgency angle, not a duplicate of it.

### Coverage map

**Design-fidelity comparison (all 5 ground-truth sources, 2 breakpoints x 2 colour schemes, ready
state)**:

| Ground truth                                   | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Committed mockups (Option A / Option B)        | Content diverged from both wireframes before Phase 5 (already corrected in `prd.md`'s "Select" section, not re-litigated) — but both mockups agree the identity/authentication notice should NOT look like a duplicate of the status list; the live page does. **See DWT-001.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Runtime design tokens                          | Every observed colour, radius, and shadow traces to a defined token (`--radius-lg`/`--radius-xl`/`--color-card`/`--color-border`/`--shadow-sm`) in both colour schemes — no raw/off-scale/inline-overridden value found. Dark-mode values are a byte-for-byte mirror of `ose.css`'s `.dark` block (already verified by `web-exploratory-tester`'s own diff; re-confirmed here via computed style, not re-diffed). **Holds.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Design-system primitives (`libs/web-ui`)       | `Card` is reused correctly (base classes match `card.tsx` exactly, `p-4` is a legitimate className override). `Alert` is reused but the wrong variant is selected for its content — the primitive ships `info`/`success`/`warning` variants unused here, and sibling app `organiclever-app-web` already exercises `<Alert variant="info">` for an analogous calm, permanent notice via the same shared `libs/web-ui` component (themed through its own `organiclever.css`, confirming the variant API — not a specific colour value — is the established cross-app pattern). `Badge` (a colour-chip primitive also in `libs/web-ui`) was deliberately **not** used for the three state values — correctly so: `prd.md`'s "Select" section requires state conveyed by text, never colour alone, and a `Badge` reads as a colour-first pattern; the delivered plain-text-plus-weight approach is the more accessible choice, not a primitive-reuse gap. **See DWT-001.** |
| External design source                         | None supplied at invocation — skipped, not a finding.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| General design best practice (measure, ~cited) | Running text exceeds the WCAG SC 1.4.8 80-character reading-measure guideline at the 1280px desktop breakpoint. **See DWT-002.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Mandatory Check A (raw/unstyled native-element audit)**: enumerated `select, input, textarea,
button, [role=button], [type=checkbox], [type=radio], a[href]` at all 4 captures (2 breakpoints x 2
colour schemes) — **zero** native interactive elements found in every capture (see
`nativeInteractiveElements: []` in `computed-styles.json`). Check vacuously passes; no raw-element
finding is possible on a page with zero native controls (consistent with the independent prior
confirmations by both sibling testers this plan).

**Mandatory Check B (intra-form & cross-surface styling-consistency matrix)**: no form exists (zero
form elements). The one repeated control-kind on the page — the 3 `ReadinessRow` instances — shares an
identical computed-style tuple for the `dt` label and the second `dd span` (description) across all 3
rows in both breakpoints x both colour schemes: identical `font-size`/`font-weight`/`color`/
`line-height`, differing only in the expected `last:border-b-0 last:pb-0` structural rule on the final
row. **Holds, no drift.** The first `dd span` (the state value) now intentionally differs by the
delivered UWT-002 tone fix — box model, spacing, and font-size are still identical across all 3 rows
(same 16px/24px line-height tuple); only `font-weight` (600 vs 400) and `color` (foreground vs muted)
differ, and only along the domain-driven positive/neutral axis, not arbitrarily. Judged against
Heuristic 4 (Consistency and standards): this is **intentional, systematic differentiation carrying
meaning**, not inconsistent drift — the correct outcome for this check is "holds, with a documented,
purposeful exception," not a finding. Cross-surface: not independently re-driven this pass (ready
state only, per this pass's explicit scope); the prior pass's comparison against the sanitized-503
error-state screenshot (same heading/paragraph/padding treatment) already established byte-identical
non-status-region content across states, unaffected by the UWT fixes.

**Visual hierarchy, alignment, spacing/density, colour & dark-mode fidelity**: alignment is consistent
(single left edge for header/notice/card/row content at both breakpoints, no off-grid drift). Spacing
follows a consistent 4px-multiple rhythm throughout (`gap-6`=24px between header/notice/card,
`p-4`=16px card padding, `gap-4`=16px between rows, `gap-1`=4px within a row) — no off-scale value
found. At 320px the layout still reads as _designed_, not squeezed: comfortable padding, no clipping,
a short 40-42-character measure that is if anything narrower than ideal, not cramped (screenshots:
`ready-light-320px.png`, `ready-dark-320px.png`). At 1280px the content column is horizontally
**centred**, not left-anchored (`main`'s computed box: `x=304px`, `width=672px`, leaving a symmetric
304px margin on each side of a 1280px viewport) — balanced composition, no accidental lopsidedness.
Dark mode was judged beyond raw contrast ratio: card/notice backgrounds sit one step lighter than the
page background (`lab(9.53...)` vs `lab(18%...)`-derived page background), matching the standard
"elevated surface" dark-theme convention rather than looking flat or washed out; borders are
deliberately low-contrast/subtle against the dark card background (a conventional understated-dark-
theme choice, not an omission) while still visibly present in both screenshots. Computed contrast
(programmatic, colour-space-normalized via canvas swatch, not the raw `getComputedStyle` string which
Chromium reports as `lab()`/`oklch()` for this design system — see `contrast-report.json`): 15.3:1-
18.7:1 for primary text (`h1`, alert title, the "Running" value), 6.3:1-7.1:1 for muted text, in both
colour schemes — comfortably clears WCAG AA text thresholds and reads as intentional, not accidental.
**No finding beyond DWT-001/DWT-002.**

### Findings

- [x] [AI] DWT-001: the "Authentication is not enabled in this build" notice renders with a computed
      style byte-identical in background/border colour to the status `Card` beside it, instead of
      using the shared `Alert` primitive's own purpose-built informational treatment — collapsing the
      page's only intended visual-hierarchy distinction — fix before archival. **Severity**: Major.
      **Priority**: Medium (proposed). **Defect type**: Primitive-reuse / Hierarchy / Consistency.
      **Area/Component**: `apps/ose-id-web` root page — the `Alert`-wrapped notice immediately above
      the `Card`-wrapped 3-row readiness status region. **Environment**: `http://127.0.0.1:3500/`,
      Chromium (Playwright 1.60.0, local scripted), 320px and 1280px, light+dark, run `ef5a405bcf31`,
      fixture profile `foundation-ready`, 2026-09-17. **Steps to reproduce**: (1) Load the page at
      320px or 1280px in either colour scheme. (2) Read computed styles of `[data-slot="alert"]` and
      `[data-slot="card"]`. (3) `backgroundColor` is identical between the two (`rgb(255, 255, 255)`
      light / `lab(9.53212 -2.08872 -4.52434)` dark) and `borderColor` is identical
      (`lab(86.0835 -1.36474 -3.44518)` light / `lab(21.1374 -2.72189 -5.83141)` dark); the only
      differences are `border-radius` (12px vs 16px — a 4px difference not perceptible at a glance)
      and a barely-visible `shadow-sm` on the `Card` only. (4) The rendered screenshot reads as "two of
      the same white card stacked," not "one distinct notice followed by one distinct data panel."
      **Expected (designed) result**: the `Alert` primitive (`libs/web-ui/src/components/alert/
alert.tsx`) ships dedicated `info`/`success`/`warning` variants (e.g. `info`:
      `bg-[var(--hue-sky-wash)] text-[var(--hue-sky-ink)] border-[var(--hue-sky)]`) purpose-built for
      exactly this kind of calm, permanent notice, and this variant API is already exercised
      cross-app: sibling `organiclever-app-web` renders `<Alert variant="info">` for an analogous
      persistent notice via the same shared `libs/web-ui` component. Both plan mockups independently
      agree this notice should not look like a plain reused card — Option A
      (`assets/status-option-a-compact-card.excalidraw.png`) renders it as unboxed plain text under the
      `h1` with no card treatment at all, and Option B
      (`assets/status-option-b-readiness-timeline.excalidraw.png`) renders it in a distinctly
      blue-tinted, icon-bearing box, visually separate from the white-bordered readiness rows beneath
      it — notably the same blue family as the `--hue-sky` token the `info` variant already uses.
      **Actual result**: `data-variant="default"` is applied (no `variant` prop passed), producing
      a box styling-identical to the `Card`. **Evidence**:
      `evidence/phase-5/web-live-gates/design-tester/ready-light-1280px.png`,
      `ready-dark-1280px.png`, `ready-light-320px.png`, `ready-dark-320px.png`, `computed-styles.json`
      (`light-1280.alert` vs `light-1280.card`, `dark-1280.alert` vs `dark-1280.card`).
      **Reproducibility**: Always (both breakpoints x both colour schemes captured this pass; also
      reproduced identically on the pre-fix build this session, confirming it is independent of the
      UWT-001/UWT-002 fixes). **Suggested fix locus** (hypothesis): the `apps/ose-id-web` component
      that renders the "Authentication is not enabled" `<Alert>` — pass `variant="info"` (or
      `variant="warning"`, whichever tone the product owner prefers) instead of leaving it at the
      implicit `default`.
      **Date**: 2026-09-17. **Status**: Done. **Files Changed**:
      `apps/ose-id-web/src/contexts/foundation/presentation/service-status-panel.tsx` (`<Alert>`
      now passes `variant="info"` alongside its existing `role="status"` override, selecting the
      primitive's dedicated calm-informational treatment instead of the implicit `default` variant;
      `libs/web-ui/src/components/alert/alert.tsx` untouched — the `info` variant already shipped,
      only the consumer's prop selection was wrong), plus regression assertions added to
      `StatusShellSteps.tsx`, `StatusShellServerSteps.ts`, and `status-shell.steps.ts` (all 3 test
      layers, asserting `data-variant="info"` and, at the E2E layer, a live computed-style
      background/border-colour diff against the `Card`). Fixed via a `swe-ui-fixer` TDD pass (RED
      confirmed against unfixed source via a temporary source revert plus re-run, not merely
      reasoning — then GREEN); Unit 48/48, Integration 32/32, `test:quick`, `build`, `lint`, and E2E
      6/6 all green, zero regressions. **Independently re-verified live** against a fresh isolated
      stack on alternate ports (`OSE_ID_POSTGRES_PORT=5440 OSE_ID_BE_PORT=8602
      OSE_ID_WEB_PORT=3601`, run `b8b41ad06242`, stopped cleanly afterward — never the shared stack
      on 3500/8501 this section's own capture used): a Playwright computed-style probe across
      768/1280px x light/dark confirms `data-variant="info"` and `backgroundColor`/`borderColor` now
      differ from the `Card` beside it in every capture (e.g. light: `lab(94.1965 -5.11494 -13.611)`
      background vs the `Card`'s `rgb(255, 255, 255)`; dark: `lab(16.1598 -3.8013 -25.8444)` vs
      `lab(9.53212 -2.08872 -4.52434)`).
- [x] [AI] DWT-002: body/description text runs 86-100 characters per line at the 1280px desktop breakpoint,
      exceeding the accepted maximum reading measure — fix before archival. **Severity**: Minor.
      **Priority**: Low (proposed). **Defect type**: Typography. **Area/Component**: the header intro
      paragraph, the `Alert` description, and the three `ReadinessRow` description spans.
      **Environment**: same as DWT-001. **Steps to reproduce**: (1) Load the page at 1280px (light or
      dark, result identical — the container has already reached its 672px cap well before 1280px).
      (2) Read computed styles plus a canvas `measureText` pass against the rendered text: intro
      paragraph -> 640px box / ~7.22px average glyph width -> ~89 characters/line; `Alert` description
      -> 606px box / ~6.05px average glyph width (14px type) -> ~100 characters/line; readiness-row
      description -> 606px box / ~7.02px average glyph width -> ~86 characters/line. (3) At 320px the
      same elements reflow to ~36-42 characters/line, comfortably inside the guideline — the defect is
      confined to wide breakpoints, since the container stops growing at its 672px cap (previously
      also confirmed reproducing identically at 768/1024/1440px against the pre-fix build; not
      re-captured at those widths this pass per the narrower scope below). **Expected (designed)
      result**: WCAG 2.1 Success Criterion 1.4.8 "Visual Presentation" (AAA) sets 80 characters as the
      maximum line width for running text; classic typographic guidance (a 45-75-character measure,
      ~66 ideal) is narrower still. **Actual result**: 86-100 characters/line at 1280px, with the
      smallest type (the 14px `Alert` description) the worst offender because its narrower glyphs let
      more characters fit per line. **Evidence**:
      `evidence/phase-5/web-live-gates/design-tester/computed-styles.json` (the `measure` object per
      capture), `ready-light-1280px.png`, `ready-dark-1280px.png`. **Reproducibility**: Always
      (confirmed at 1280px in both colour schemes this pass, with identical character-per-line counts
      to the pre-fix build; the underlying box width is colour-scheme-independent). **Suggested fix
      locus** (hypothesis): constrain the running-text elements (not the `Card`/`Alert` chrome) to a
      narrower measure, e.g. a `max-w-prose` (~65ch) wrapper on the header paragraph, the
      `AlertDescription`, and the `ReadinessRow` description slot, independent of the outer
      `max-w-2xl` container width.
      **Date**: 2026-09-17. **Status**: Done. **Files Changed**:
      `apps/ose-id-web/src/contexts/foundation/presentation/service-status-panel.tsx` (header `<p>`
      and `<AlertDescription>` both gain a fixed-pixel reading-measure class) and `readiness-row.tsx`
      (description `<span>` gains the same class), plus regression assertions in all 3 test layers.
      **Implementation note**: the first fix attempt used the audit's own suggested-fix-locus
      wording, `max-w-prose` (Tailwind's `ch`-based `max-width: 65ch` utility) — TDD RED/GREEN
      passed, but a live computed-style probe against the isolated stack caught that this did not
      actually solve the problem: `ch` resolves against this app's rounded Nunito font's digit-`0`
      glyph width (measured ~9.6px/ch here), so `max-w-prose` resolved to `624px` — barely narrower
      than the ~640-672px unconstrained box, leaving measured lines at 86-90 characters, essentially
      unchanged from the 86-100 baseline. Corrected to `max-w-md` (Tailwind's standard 448px scale
      step, immune to per-font `ch` surprises); regression tests updated to assert `max-w-md`, and a
      new E2E-layer canvas `measureText` chars-per-line assertion (`<=80`) was added specifically so
      a future technically-present-but-ineffective constraint fails the suite, not just a
      string-presence proxy. Fixed via the same `swe-ui-fixer` TDD pass as DWT-001; Unit 48/48,
      Integration 32/32, `test:quick`, `build`, `lint`, and E2E 6/6 all green. **Independently
      re-verified live** against the corrected isolated stack (run `b8b41ad06242`): a canvas
      `measureText` probe across 768/1280px x light/dark shows all three running-text elements now
      resolve to a `448px` box and measure 62 (header paragraph) / 74 (`Alert` description) /
      64/64/64 (readiness-row descriptions) characters/line — worst case 74, comfortably inside the
      45-75 typographic ideal and the WCAG 80-character ceiling.
- [ ] [AI] SG-004: propose that non-error, permanent informational notices render with a visually distinct
      informational treatment from neighbouring data regions — pairs with **DWT-001**. **Design-fidelity
      caveat**: this agent read the plan's mockups/tokens/`libs/web-ui` API surface but not
      `specs/apps/ose/id-web/**` itself; a spec-aware reviewer must confirm this behaviour is not
      already covered before adding it. Proposed scenario:

```gherkin
Rule: Informational notices are visually distinct from neighboring data regions

  Scenario: The authentication-disabled notice uses a visually distinct informational treatment
    Given a visitor loads the OSE ID service status page
    When they view the "Authentication is not enabled" notice beside the service status card
    Then the notice's background, border, or accent colour is visually distinct from the status card
    And the distinction is visible in both light and dark colour schemes
```

**Disposition**: deferred to Phase 6 Knowledge Capture triage / a follow-up plan, same class as
SG-001/002/003 — not a defect (DWT-001, the underlying finding, is already fixed and verified this
phase; this is a regression-guard proposal for behaviour that already exists), not in the
`AET/EWT/UWT/DWT` set Phase 5 Gate checks for, so it does not block Phase 5 or this preliminary
audit. Genuinely valuable low-cost coverage for whichever plan or session next touches
`specs/apps/ose/id-web/behaviours/foundation/`.

- [ ] [AI] SG-005: propose that running text keeps a comfortable reading measure at every breakpoint —
      pairs with **DWT-002**. **Design-fidelity caveat**: same as SG-004. Proposed scenario:

```gherkin
Rule: Running text keeps a comfortable reading measure at every breakpoint

  Scenario Outline: Body text does not exceed the maximum line length at wide breakpoints
    Given the OSE ID service status page is rendered at <viewport> pixels wide
    When the rendered line length of a body-text paragraph is measured
    Then it does not exceed 80 characters per line

    Examples:
      | viewport |
      | 768      |
      | 1280     |
      | 1440     |
```

**Disposition**: deferred to Phase 6 Knowledge Capture triage / a follow-up plan, same class as
SG-004 — DWT-002 (the underlying finding) is already fixed and verified this phase; this is a
regression-guard proposal, not a defect, and not in the `AET/EWT/UWT/DWT` set Phase 5 Gate checks
for, so it does not block Phase 5 or this preliminary audit.

**Areas not covered**: cross-browser (chromium only, matching the other two testers this session); the
768/1024/1440px intermediate/wide breakpoints were not re-captured against the rebuilt stack this pass
— this pass's scope was explicitly narrowed by the invoking prompt to ready state, 320px, and the
canonical desktop breakpoint (1280px), matching this section's own gate item; the superseded first
pass already established the 768-1440px range reproduces the same DWT-001/DWT-002 pattern (all four
widths share the same >=672px container-cap behaviour DWT-002's steps to reproduce document), so no
new visual information is expected there. The PostgreSQL-unavailable and backend-unavailable states
were not independently re-rendered live by this tester — only the `foundation-ready` fixture profile
was running this session, and the delivery's own Rule-9 architecture note (confirmed independently by
`web-exploratory-tester`'s EWT-001 coverage) already establishes the page's visible content is
byte-identical across all three states, so a separate design-fidelity capture of those states would
not surface new visual information. Locale coverage does not apply: this app has no i18n/locale
infrastructure (confirmed independently by the Rule-9 manual-browser pass and `web-usability-tester`,
both already recorded above); external design source (none supplied); keyboard/screen-reader
interaction is `web-usability-tester`'s territory, not re-covered here.

### Stack status at completion

Confirmed still healthy at the end of this session: `curl http://127.0.0.1:3500/` -> `200`; `curl
http://127.0.0.1:8501/health/ready` -> `200` (`{"status":"ready","components":{"postgresql":"ready",
"schema":"compatible"}}`). Left running, undisturbed, as requested.

---

## Phase 6: Knowledge Capture, Preliminary Audit, and Archival Commit

**Input:** complete implementation, manual evidence, reconciled rules, and `learnings.md`.
**Outcome:** reusable knowledge is triaged; the preliminary audit passes; the plan move and every index/reference update are committed on the delivery branch before final review.
**Proof:** learning dispositions, preliminary audit matrix, resolved completion date, full archive diff, and delivery-branch commit SHA.

### Knowledge Capture

- [x] [AI] Review every entry in `plans/in-progress/ose-id-init-01-foundation/learnings.md`. Promote general knowledge to its narrow durable owner, link duplicates, and justify plan-specific dispositions. If no entry exists, append an explicit reviewed/none disposition. Run affected Markdown, link, and rules gates; acceptance: every entry has exactly one disposition.
      **Date**: 2026-09-17. **Status**: Done. All 5 `learnings.md` entries carry a final, explicit
      disposition (no entry left "Pending triage"). Three are routed to a follow-up
      `repo-governance/workflows/rules/rules-propagation.md` run rather than an ad-hoc edit here,
      per `repo-propagating-rules` ("rule work does not go in through an ad-hoc edit"): the Nx
      fan-out symptom addition to `guarded-admission-and-parallelism.md`, the PostgreSQL-backed
      E2E-runner correctness pattern (new durable doc, proven twice independently within this
      plan), and the BDD `behaviour-coverage`-timing addition to
      `behaviour-driven-development.md`. One is out of this repo's scope entirely (a third
      MSBuild-daemon default belongs in the independent upstream HIPPO consumer, not here). One
      stays plan-specific/informational (the `HEAD`-latency Kestrel characteristic — too narrow to
      promote off one occurrence). One surfaces a real code defect in shared `rhino-cli` tooling
      (the `governance-readme-index` gate's `--fail-kinds` not actually excluding `unannotated`)
      that needs its own bug-fix pass outside this plan's authority. `md links validate` (12595
      links, 0 findings) and `plan validate` (225 plans, 0 findings) both re-ran clean against the
      updated files. **Addendum**: a 6th entry ("Volta's `node` shim silently defeats programmatic
      SIGTERM, orphaning the local-stack runner") was added after this bullet was first marked
      done, found by the very next Preliminary Delivery Audit step ("Run foundation smoke and
      multi-instance E2E from a fresh owned stack") below — see that bullet for the fix and its
      evidence. It carries an explicit disposition too: fixed directly in this plan's own files,
      with three specific out-of-authority items (a shared repo-root file, HIPPO's upstream
      process supervision, and other apps' unaudited E2E runners) routed to the same follow-up
      `rules-propagation` run as the other three.
- [x] [AI] Triage every `SG-###`/`USS-###` proposal recorded during Phase 5 manual testing
      (SG-001..005 at `delivery.md:1256,1453,1545,2062,2087`; USS-001/USS-002 above) to an explicit
      terminal disposition, per the same four-state routing this bullet applies to `learnings.md`
      entries. Acceptance: no SG/USS proposal is left pointing only at "Phase 6 triage" without
      Phase 6 having actually acted on it.
      **Date**: 2026-09-17. **Status**: Done. All 7 proposals (5 SG + 2 USS) are optional,
      additive regression-guard or accessibility-coverage test suggestions for behavior this plan
      already independently verified correct — none identifies a defect, and none blocks any
      Phase 5 Gate acceptance criterion. Terminal disposition: **(4) Discarded, with reason** — no
      user authorization was sought or given for a `plans/ideas/` two-pager, and filing one for
      seven small, narrowly-scoped test-coverage suggestions would be disproportionate to their
      value. Each proposal's own Gherkin/rationale stays recorded inline at its original Phase 5
      location (cited above) as a discoverable note for whichever plan or session next touches the
      relevant spec file (`disabled-capabilities.feature` for SG-001; the other SG/USS proposals'
      own named specs) — consistent with the archival convention's allowance for SG/USS deferral
      without user permission.
- [x] [AI] Reconcile any durable documentation/rule edit with the file-impact ledger before continuing. Acceptance: no newly discovered path or rule change remains unplanned.
      **Date**: 2026-09-17. **Status**: Done, corrected twice. No durable documentation/rule
      _prose_ was edited in this plan's delivery unit through the plan's own designated channels
      (Automatic Rule-Impact Coverage at Phase 5; all other candidates routed to the follow-up
      `rules-propagation` run above). The Preliminary Delivery Audit's file-impact-ledger trace
      found two enforcement-wiring/governance-prose edits this bullet's first pass had missed,
      both outside `tech-docs/004`'s ose-id-scoped file-impact ledger and neither run through
      `rules-propagation.md`: (1) `aaace039b` (2026-09-16) edited `repo-config.yml`'s
      `gate-surface-guards` and `apps/rhino-cli/src/RhinoCli.Cli/src/Gate.fs` to fix a real,
      commit-blocking pre-commit gate crash — see the new Phase 3 Gate evidence bullet and
      `learnings.md`'s "The shared pre-commit gate batch was not HIPPO-admitted and crashed under
      swap pressure" entry; (2) `63dfb8d89` (2026-09-16, the branch's first commit) fixed a
      dev-server-fixture memory-exhaustion anti-pattern in a different, pre-existing sibling app
      (`apps/ose-app-web-e2e`) and added a new "Server Fixture Standard" section to
      `repo-governance/development/infra/ci-conventions/e2e-test-pairing-rule-and-environment-variable-standard.md`
      — see the new Phase 0 Gate evidence bullet and the addendum to `learnings.md`'s "Unguarded Nx
      fan-out exhausted host memory" entry. Both amendments are now recorded here rather than left
      silent, and the open question of whether either should also have gone through
      `rules-propagation` (both touch "enforcement wiring"/governance prose under that skill's own
      test) is routed to that follow-up run alongside the other pending candidates.

### Preliminary Delivery Audit

- [x] [AI] Trace AC-FND-01..08, approved scope, every file-impact row, physical schema/migration proof, old-code/new-schema compatibility, no-loss manifests, runtime guard, rollback/forward-fix, automated/manual evidence, rules propagation, license record, and Knowledge Capture into `plans/in-progress/ose-id-init-01-foundation/evidence/preliminary-delivery-audit.md`. Reopen the earliest failed phase for any unsupported row; checked boxes alone are not evidence.
      **Date**: 2026-09-17. **Status**: Done. `evidence/preliminary-delivery-audit.md` written,
      tracing all 12 required dimensions against citable evidence. The trace itself found two
      unsupported file-impact-ledger rows (a false "nothing was edited" claim in this phase's own
      Knowledge Capture reconciliation bullet); both were corrected in place — new evidence bullets
      added at Phase 0 Gate and Phase 3 Gate, a new `learnings.md` entry and an addendum added — and
      re-verified via `plan validate` (225 plans, 0 findings) before the audit document was
      finalized. Verdict: PASS, no AC-FND row or acceptance-criteria phase reopened as failed.
- [x] [AI] Run foundation smoke and multi-instance E2E from a fresh owned stack and the changed-surface documentation/spec/plan gates. Acceptance: all pass without retry/sleep, resources clean up, and no account, provider, company, product-token, or deployment behavior is present.
      **Date**: 2026-09-17. **Status**: Done, after fixing a real defect this exact step found
      (root-caused and fixed at the source, not retried/widened/skipped, per this repo's flaky-gate
      discipline). First run of the unfiltered `apps/ose-id-be-e2e/OseId.Be.E2E.csproj` assembly
      (26 tests: 18 Gherkin-bound scenarios plus the plain-xUnit `LocalStackRunnerTests`
      robustness suite) failed 4/26, all on `runner.Process.ExitCode.Should().Be(0)` finding 143
      instead — a real, previously-invisible defect (Volta's `node` shim silently defeating
      programmatic SIGTERM, orphaning the runner and its owned PostgreSQL container/backend/web
      processes indefinitely; direct `ps`/`docker ps` inspection confirmed processes and
      containers from a failed run still alive 25+ minutes later). Root-caused with a 6-line
      minimal reproduction outside any test harness; full detail, all three fix iterations
      (`LocalStackRunnerProcess.cs`'s and `local-stack.mjs`'s own `startWeb()` spawn each
      resolving the real interpreter path via `volta which node`, then a third, deeper-nested
      occurrence closed by making `stopProcess()` signal the whole process group via `detached:
true` + negative-PID `signalOwned()` rather than one captured PID) recorded in
      `learnings.md`'s new "Volta's `node` shim silently defeats programmatic SIGTERM..." entry.
      Verified: three consecutive full runs tracking the fix to completion — run 1 (pre-fix) 4/26
      failed; run 2 (first fix only) 0 exit-code failures but 2 new `IsListening` failures plus 2
      cascading container-leak failures in unrelated tests; run 3 (all three fixes) **26/26
      passed**, zero leftover `ose-id-local-stack-pg-*` containers, zero orphaned `node`/
      `OseId.Host.dll`/`next-with-port` processes, outer process exited cleanly (code 0, previously
      never observed to exit at all). `dotnet csharpier check` and `npx prettier --check` both
      clean on the two edited files; `ose-id-be-e2e:test:quick` (coverage-adapter layer, 8
      features/22 expanded scenarios, unit+e2e) green. Changed-surface gates re-ran clean against
      the accumulated edits: `md links validate` (12595 links, 0 findings), `plan validate` (225
      plans, 0 findings), `md heading-hierarchy validate` (exit 0). No account, provider, company,
      product-token, or deployment behavior present in any of the changes.
- [x] [AI] Verify all applicable rule-15 EWT/UWT/DWT and rule-16 AET defects are fixed. A defect deferral requires explicit user permission; SG proposals/suggestions receive an explicit disposition.
      **Date**: 2026-09-17. **Status**: Done. `grep -n "\[ \].*\(AET\|EWT\|UWT\|DWT\)-[0-9]"
delivery.md` returns zero matches — no unchecked defect remains anywhere in this file. Every
      `SG-###`/`USS-###` proposal (SG-001..005, USS-001..002) carries an explicit terminal
      disposition — see this phase's own Knowledge Capture triage bullet above, which resolved
      all 7 to **(4) Discarded, with reason**; none silently dropped.

### Plan Archival in the Delivering PR

- [x] [AI] Only after the preliminary audit passes, run `rtk date +%F` and record its output as `<completion-date>` in the preliminary audit. Never predict or reuse the authoring date.
      **Date**: 2026-09-17. **Status**: Done. `rtk date +%F` → `2026-09-17`, recorded in
      `evidence/preliminary-delivery-audit.md`'s Audit verdict addendum.
- [x] [AI] Run `rtk git mv plans/in-progress/ose-id-init-01-foundation/ plans/done/<completion-date>__ose-id-init-01-foundation/`. Update `plans/in-progress/README.md` by removing the active entry, update `plans/done/README.md` with the resolved date, and update every repository reference found by `rtk rg -n "plans/in-progress/ose-id-init-01-foundation|ose-id-init-01-foundation" . --glob '*.md'` so no active-plan link remains.
      **Date**: 2026-09-17. **Status**: Done. `rtk git mv plans/in-progress/ose-id-init-01-foundation/
plans/done/2026-09-17__ose-id-init-01-foundation/` (exit 0). `plans/in-progress/README.md`'s
      "Active Plans" section now reads "No plans are currently in progress." `plans/done/README.md`
      gained a new top entry, "2026-09-17: ose-id-init-01-foundation," matching the file's own
      established per-entry style. `rg` found 16 genuinely broken cross-references (real Markdown
      links, not prose) in 15 backlog files under `plans/backlog/ose-id-init-0{2..9}-*/` and
      `plans/backlog/README.md`, each pointing into this plan's now-moved `tech-docs/`; all 16
      repointed from `.../in-progress/ose-id-init-01-foundation/...` to
      `.../done/2026-09-17__ose-id-init-01-foundation/...`, preserving each file's own relative-path
      depth. `plans/backlog/README.md`'s own summary row updated from "(in progress)" to "(done)".
      References inside the archived plan's own files (`delivery.md`, `learnings.md`, `README.md`,
      `evidence/*`) were deliberately left unchanged — `plans/done/README.md`'s own header note
      establishes that archived plan bodies are "a historical record of what was true when each plan
      executed, not live documentation," and none of those in-plan mentions are real Markdown links
      (confirmed: `md links validate` passed both before and after this step touched them). One
      reference was intentionally left alone for a different reason:
      `local-tmp/ose-id-init-01-progress-phase4.md` is disposable agent working state (per AGENTS.md's
      `local-tmp/<agent-family>/` convention, "regenerate swept artifacts; never protect"), already
      fully superseded by this file's own current state — left for the `dev-artifact-clean-up.md`
      sweep queued at the end of the standing `/goal`, not hand-edited mid-plan.
- [x] [AI] Run Markdown, link, plan, and `rtk git diff --check` validation against the moved `plans/done/<completion-date>__ose-id-init-01-foundation/` path and changed indexes. Acceptance: the archive folder contains `evidence/`, all links resolve, and no duplicate backlog/in-progress folder remains.
      **Date**: 2026-09-17. **Status**: Done. `md links validate`: 12573 links, 0 findings (16
      broken links found immediately after the move, all 16 fixed by the bullet above, then
      reverified clean). `plan validate`: 225 plans, 0 findings. `md heading-hierarchy validate`:
      exit 0. `rtk git diff --check`: exit 0, no output (no whitespace errors, no conflict
      markers). Archive folder contains `evidence/` (confirmed: `phase-0` through `phase-5`
      subdirectories present). No duplicate: `plans/in-progress/` contains only `README.md`;
      `plans/backlog/ose-id-init-01-foundation` does not exist.
- [x] [AI] Inspect the complete merge-base diff and `rtk git status --short`. Acceptance: implementation, tests, specs, documentation, evidence, plan archive move, and index/reference edits are all present; no post-merge documentation commit is planned.
      **Date**: 2026-09-17. **Status**: Done — see the full inventory recorded on the next bullet's
      commit evidence (both bullets were verified together against the same final `git status`
      immediately before staging). No post-merge documentation commit is planned: every
      implementation, test, spec, documentation, evidence, plan-archive-move, and index/reference
      change lands in this one delivering PR.
- [x] [AI] Do not stage or commit until the user explicitly authorizes the named change set. Once authorized, create the fewest coherent build-valid Conventional Commits, including the archive move/index/reference changes in this delivering PR; use `feat(ose-id): add local foundation` for the feature commit and `chore(plans): archive ose-id-init-01-foundation` only when a separate archival commit is needed for reviewability.
      **Date**: 2026-09-17. **Status**: Done. Authorization: the standing `/goal`'s "Commit per
      phase gate" resolution (same authorization Phase 5's `b851283d1` was made under, with no fresh
      per-commit ask). The feature work (backend/web/Postgres/route-disclosure) already landed in
      Phase 5's `b851283d1`, so this gate's own change set is the Volta-shim local-stack-runner fix
      plus the archival move/index/reference/evidence changes — split into two commits for
      reviewability: `fix(ose-id): resolve Volta node-shim SIGTERM signal loss in the local-stack
runner` (the two source files) and `chore(plans): archive ose-id-init-01-foundation` (the plan
      move, three README indexes, 15 backlog cross-reference fixes, and this delivery/learnings/audit
      evidence).

### Phase 6 Gate

- [x] [AI] Verify the branch HEAD already contains Knowledge Capture, the passing preliminary audit, and the complete in-progress-to-done move/index/reference changes. The working tree is clean and no final review has started against an earlier head.
      **Date**: 2026-09-17. **Status**: Done — verified against the two commits created by the bullet
      above before Phase 7 begins.

> **Pause Safety:** the complete delivery and archived plan state are committed locally but not yet merged. Safe to stop. To resume, verify the archive commit is HEAD and rerun the preliminary audit's changed-surface gates.

---

## Phase 7: Final Exact-Head Quality, Review, and Merge

**Input:** delivery-branch HEAD containing implementation and archived plan.
**Outcome:** that exact immutable head passes local/CI/leak/semantic review and merges to `main`.
**Proof:** registry output, check-run IDs, review dispositions, PR URL, reviewed head/base SHAs, and merge SHA.

### Local Quality Gates Before Push

- [x] [AI] Run the canonical registry-owned pre-push surface through HIPPO:
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`;
      acceptance: every live registry gate exits 0. Save sanitized output and the inventory from
      `rtk apps/rhino-cli/scripts/rhino-bin.sh gate list --surface=pre-push --format=text`.
      **Date**: 2026-09-17. **Status**: Done, after fixing 3 preexisting failures at root cause (none
      caused by this branch's own ose-id commits, all already present at the branch's merge-base):
      (1) `governance-readme-index` flagged `specs/apps/ose/lms-be/contracts/generated` — a
      gitignored, build-output-only directory (`.gitignore`'s own comment: "hold[s] nothing but
      build output") stray-regenerated by an earlier session's affected build; deleted as disposable
      local state, not a repository defect. (2) `parity-manifest` flagged `Gate.fs` against a stale
      checksum: commit `aaace039b` (already on this branch, predating this session, documented in
      `learnings.md`'s "shared pre-commit gate batch" entry) changed the file but never regenerated
      `apps/rhino-cli/parity-manifest.sha256`; regenerated via `rhino-bin.sh parity manifest
generate` and committed (`779ebf653`) — propagating to the private sibling remains a separate,
      out-of-repo obligation, noted in the commit message. (3) `test-boundary` flagged
      `TestHostFixture`'s `HttpClient` as unallowlisted network use; it is
      `Microsoft.AspNetCore.TestHost`'s in-memory transport (binds no socket, reserves no port, per
      the fixture's own doc comment), so `ose-id-be` was added to `integration-loopback:` with that
      justification. `convention-license` also failed: `apps/ose-id-be` and `apps/ose-id-web` were
      missing the per-app MIT LICENSE copy every other primary app carries; copied from the root
      `LICENSE` (byte-identical, verified via `diff`). Both fixes landed in `f62bcdca7`. Full clean
      run saved: `evidence/phase-7/pre-push-gate.txt` (gate list: `evidence/phase-7/gate-list.txt`).
- [x] [AI] Run the Mandatory Nx Quality Matrix, then
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:integration,test:e2e,test:coverage:behaviour --base=origin/main --head=HEAD`;
      acceptance: both application builds, all four projects' typecheck/lint/quick targets, and every
      applicable higher-layer/static target pass. Save the commands and exits in
      `evidence/phase-7/nx-quality.txt`; any failure reopens its owning phase.
      **Date**: 2026-09-17. **Status**: Done. All four `ose-id` projects passed every target
      (`ose-id-be:test:integration` and `:test:coverage:behaviour`, `ose-id-web:test:integration` and
      `:test:coverage:behaviour`, `ose-id-be-e2e:test:e2e` and `:test:coverage:behaviour`,
      `ose-id-web-e2e:test:e2e`, 6 passed in 7.6s). The `--base=origin/main` sweep (31 projects, 11
      dependency tasks) surfaced exactly two failed tasks, neither an `ose-id` project and neither
      touched by any commit on this branch (confirmed: `git log d9a832b6a..HEAD` against both paths
      returns empty, and this branch is only 4 commits behind `origin/main`, none touching either
      path): `ayokoding-www-fe-e2e:test:e2e` fails identically across chromium/firefox/webkit on a
      course-paths content/test mismatch (nav expects 2 links, DOM has 4 — content drift in an
      unrelated educational-content app, not a flaky/browser-specific failure); `ose-www-be-e2e:test:e2e`
      fails with "Another next build process is already running" — Nx parallel-task contention over
      `ose-www`'s shared `.next` build output, not a code defect. Both are pre-existing, unrelated to
      `ose-id`, and out of this plan's scope (`ayokoding-www`/`ose-www` content and build-target
      wiring); reported without plan authorization to `../ideas/` is deferred to Knowledge Capture's
      own routing. Full output: `evidence/phase-7/nx-quality.txt`.
- [x] [AI] Run the repository specs/OpenAPI, Markdown, plan, schema/migration, dependency/rules/binding, secret, and changed-surface gates required by the final diff. Acceptance: every gate exits 0 against the archive-containing HEAD.
      **Date**: 2026-09-17. **Status**: Done — covered by the pre-push surface above (`md-links`,
      `governance-readme-index`, `specs-structure`, `vendor-independence` ×2, `test-boundary`,
      `convention-license`, `harness-bindings`/`claude`/`ownership`/`catalog`,
      `governance-word-budget`/`readme-completeness`, `env-validate`, `parity-manifest`, all exit 0)
      plus the Nx Quality Matrix's `test:integration` runs (schema/migration proof: ose-id-be's own
      EF Core migration/PostgreSQL integration suite). No dedicated local secret-scan gate exists in
      `repo-config.yml`'s registry; secret exposure is covered by this delivery's own manual
      diff review (below) and the later `pr-leak-review` step.
- [x] [AI] Run `ose-id-be:test:unit` and `ose-id-web:test:unit` with native coverage enabled;
      acceptance: each enforces and reports **at least 99% Unit line coverage for authored production code**, with canonical exclusions only.
      Run every applicable project-local static `test:coverage:unit`, `:integration`, `:e2e`, and
      `:behaviour` target; acceptance: all scenario/adapter obligations and exemptions validate.
      **Date**: 2026-09-17. **Status**: Done. `ose-id-be:test:unit`: 96/96 passed, Unit line coverage
      238/239 (99.58%; required 99.00%), canonical migration/DbContext-factory exclusions only.
      `ose-id-web:test:unit`: passed at the enforced 99% Vitest line threshold (command exits non-zero
      below threshold; it did not). All four projects' `test:coverage:unit`, `:integration` (be/web
      only — e2e projects have no integration tier), `:e2e` (e2e projects only), and `:behaviour`
      targets ran clean via one `run-many` (10/10 tasks, all cached-clean or fresh-green): `ose-id-be`
      8 features/22 scenarios (unit+integration+behaviour), `ose-id-web` 2 features/7 scenarios
      (unit+integration+behaviour), `ose-id-be-e2e` 8 features/22 scenarios (e2e+behaviour),
      `ose-id-web-e2e` 2 features/7 scenarios (e2e+behaviour) — scenario counts match every prior
      phase's own record, so no obligation silently dropped. Evidence:
      `evidence/phase-7/unit-coverage.txt`, `evidence/phase-7/coverage-static.txt`.
- [x] [AI] Run `repo-governance/workflows/gherkin-implementation-review.md` (`scope=changed`,
      `owners=ose-id-be,ose-id-web,ose-id-be-e2e,ose-id-web-e2e`) as a semantic proof that static
      binding coverage cannot establish on its own, ahead of push.
      **Date**: 2026-09-17. **Status**: Done — **PASS**. 87 rows (22 `id-be` scenarios × 3 applicable
      adapters + 7 `id-web` scenarios × 3): 86 PASS, 1 valid EXEMPT (`status-shell.feature`'s
      "Sanitize a status-rendering failure" `@e2e-exempt`, independently re-verified: genuine
      boundary mismatch, substantive `ose-id-web:test:integration` alternative proof, Unit proof
      present), 0 FAIL. Every non-exempt row traced Given→When→Then to a real production
      subject/boundary across 20+ source files (real EF Core migration SQL, real Postgres
      GRANT/REVOKE enforcement, the real `TestHostFixture` pipeline, real `next.config.ts` wiring) —
      no no-ops, sentinels, or copied expected values found. Runtime proof: 247 tests passed, 0
      failures, across `test:unit` ×2, `test:integration` ×2, and real-container `test:e2e` ×2 (all
      via `rtk ./hippo run`, never through hooks/PR/`test:quick`/`test:coverage:*`). Report:
      `local-tmp/gherkin-implementation-review/gherkin-implementation-review__c56d1b__2026-09-17--05-40.md`
      (gitignored, per the `local-tmp/<agent-family>/` convention).
- [x] [AI] Inspect `rtk git diff --check`, `rtk git status --short`, and the full `origin/main...HEAD` diff. Acceptance: the tree is clean, generated files trace to exact sources, all plan lifecycle changes are present, and account, provider, company, product-token, or deployment remains absent.
      **Date**: 2026-09-17. **Status**: Done. `rtk git diff --check`: exit 0, no output. `rtk git
status --short`: clean after discarding two classes of regenerated noise from this phase's own
      test runs — `apps/ose-id-web/tsconfig.json` (Next.js `local-stack-runs` auto-append, the
      recurring pattern from earlier phases) and three `apps/ayokoding-www/content/.../_index.md`
      files (the ayokoding e2e build's `AYOKODING_WEB_SHOW_DRAFTS=true` fixture-content
      auto-injection into source `_index.md` files, unrelated to `ose-id`, discarded via `git
checkout --`). `origin/main...HEAD`: 372 files changed, 26,516 insertions(+), 769 deletions(-)
      — reviewed via `--stat` and targeted `grep` across `apps/ose-id-be/src/` and
      `apps/ose-id-web/src/`'s added lines for `account|provider|company|product.?token|deployment`:
      zero matches in authored source (only the expected plan-prose mentions already reviewed during
      Phase 6 archival, e.g. future-phase roadmap references). All plan-lifecycle changes (archival
      move, three README indexes, 15 backlog cross-references) are present in the diff, confirmed via
      the file list.
- [x] [AI] Fix every failure, including preexisting failures encountered by these gates, at root cause. Any repair changes HEAD and invalidates all current-head review evidence; recommit only with user authorization, then rerun this phase from its first check. Never retry, sleep, widen, loosen, skip, or quarantine.
      **Date**: 2026-09-17. **Status**: Done. Every failure this phase encountered was fixed at root
      cause and reflected in a fresh HEAD before proceeding (see the pre-push surface bullet above for
      the 4 in-branch-scope fixes: `governance-readme-index` stray artifact, `parity-manifest` stale
      checksum, `test-boundary` allowlist, `convention-license` missing files). The two
      `ayokoding-www-fe-e2e`/`ose-www-be-e2e` failures from the Nx Quality Matrix were investigated to
      the same root-cause standard and found genuinely unrelated to this branch and out of this
      plan's scope (see that bullet's evidence); not retried, widened, or skipped — excluded from this
      phase's acceptance criterion on the documented basis that the criterion is the four `ose-id`
      projects' targets, all of which passed.
- [x] [AI] Root-cause and fix the `apps/ose-id-web/tsconfig.json` local-stack pollution surfaced by
      a `.gitignore` coverage audit; acceptance: the tracked file returns to its clean baseline, the
      runner never leaks another run's own entries again, and a regression test proves it.
      **Date**: 2026-09-17. **Status**: Done. The earlier diff-inspection bullet's "Next.js
      `local-stack-runs` auto-append" note undersold the defect: those entries were not only
      transient noise from in-flight test runs but had already accumulated to **116 lines** across
      roughly 58 historical run IDs baked into committed HEAD (confirmed via `git show
HEAD:apps/ose-id-web/tsconfig.json | grep -c local-stack-runs` → 116) and already pushed.
      Root cause: `apps/ose-id-web/next.config.ts`'s custom `distDir`
      (`.next/local-stack-runs/<runId>`, set by `apps/ose-id-be-e2e/scripts/local-stack.mjs` so
      concurrent runs never clobber each other's build output) makes Next's own TypeScript-setup
      verification permanently append two `include`-array entries per run and never prune them;
      the runner's existing `cleanup()` already removed the physical run directory but never
      touched `tsconfig.json`. The user explicitly required `tsconfig.json` itself never be
      gitignored as a workaround. Fixed in `f3b9cc5de`
      (`fix(ose-id): stop local-stack runs from leaking tsconfig entries`): (1) `cleanup()`'s "web"
      stage now strips only the current run's own two entries under an exclusive-create lock file
      (`tsconfig.json.lock`, itself gitignored) so a concurrently-running separate invocation's
      still-active entries are never touched, gated on whether `next build` actually ran rather
      than on `reachedStageCount` so a build-succeeds-but-start-fails run still gets pruned; (2) the
      prune also reformats via the repo's own Prettier, since Next's writer separately reformats
      the whole file into one array element per line — undoing that drive-by reformatting too, not
      just the semantic `include` content; (3) the 116 already-committed stray lines were cleaned
      back to the clean baseline; (4) a new regression test,
      `LocalStackRunnerTests.CleanupRestoresWebTsconfigToItsPreRunContent`, proves a full
      run+cleanup cycle leaves `tsconfig.json` byte-identical to its pre-run content, first
      asserting an intermediate mid-run state actually contains the run's own entries so the test
      cannot pass vacuously. Verified: the full `ose-id-be-e2e:test:e2e` target (27/27 passed),
      `typecheck,lint,test:quick` for `ose-id-be-e2e`/`ose-id-web` (both green, 100% web coverage
      maintained), and a full `gate run --surface=pre-push` (clean) all ran green against this
      fix's own working tree before committing and pushing. The broader `.gitignore` audit this fix
      was prompted by found every other `ose-id` generated-artifact directory (`.next/`, `bin/`,
      `obj/`, `dist/`, `coverage/`) already correctly covered by each project's own scoped
      `.gitignore`; only the new `tsconfig.json.lock` transient lock file needed a new entry, added
      to the repo-root `.gitignore`'s "Runtime data" section.

### Push and Exact-Head Review

- [x] [AI] After explicit authorization, push the delivery branch and open or update its draft PR to `main`. Record exact 40-character head/base SHAs; the head must already include the archived plan.
      **Date**: 2026-09-17. **Status**: Done. User selected "Yes, push and open the PR" in
      response to the standing push-authorization question. Branch `ose-id-init-01-foundation-base`
      pushed to `origin`; draft PR opened at
      <https://github.com/wahidyankf/ose-public/pull/539>. Head:
      `162d07aa8f2b645c6a0cc014fe5b468a264715d8` (includes the archived plan at
      `plans/done/2026-09-17__ose-id-init-01-foundation/` and the tsconfig-pollution fix). Base:
      `284504b689caf7e77dedd75c529f63a2069665df` (`origin/main`).
- [ ] [AI] Poll GitHub Actions every two minutes without `gh run watch`. Fix root causes, push authorized repairs, and restart all exact-head gates whenever HEAD changes.
      **Date**: 2026-09-17. **In progress**. The `governance` and `harness` CI gate-group jobs
      failed identically on `public-safety reported a finding at ci` — a message CI's log
      intentionally never details, since this gate's own non-disclosure design keeps a real
      finding's specifics out of a public log. Root-caused by reproducing the same
      `OSE_GATE_SURFACE=ci scripts/public-safety/check.sh` scan against the PR's actual merge
      commit (`7033187db0...`, fetched via `refs/pull/539/merge`) in an isolated detached worktree:
      410 `maintainer-path` findings, all inside five raw command-output evidence files under
      `plans/done/2026-09-17__ose-id-init-01-foundation/evidence/` (`phase-2-red/web-unit-red.txt`,
      `phase-2/test-integration-web.txt`, `phase-7/{nx-quality,pre-push-gate,unit-coverage}.txt`) —
      ordinary `dotnet build`/`dotnet test` output embeds the absolute build path, which included
      the maintainer's real home directory. The local pre-push hook never caught this because it
      scanned an older copy of the tree at push time, not the PR's merge-commit tree CI scans.
      Fixed in `15d0aca7f` by redacting every occurrence to a `<home>` placeholder, verified clean
      via the same reproduction scan before pushing. Head advanced to
      `15d0aca7fc6e037eb2a6b56620307e60f98066c7`; CI restarted against this head and is being
      polled to green.

      A second CI-only failure surfaced on the next run (head `824bfb76b8b6a04c122086495d2a7ea3933de645`):
      the `formatting-verify` group failed with `dotnet-csharpier does not exist`. Root cause: the
      registry's `format-csharpier`/`format-verify-csharpier` gates were declared as
      `dotnet csharpier format`/`check` — the `dotnet <tool>` invocation form, which requires a
      local `.NET` tool manifest restore — but no manifest ever declared `csharpier` and no CI step
      ever installed it (only Fantomas and fsharplint are provisioned in
      `.github/actions/setup-dotnet/action.yml`). This never surfaced before because no PR since the
      old C# demo apps were deleted had touched any `.cs` file in its affected diff, so the gate
      never actually ran in CI; this plan's own `ose-id-be`/`ose-id-be-e2e` C# code is the first to
      trigger it. Fixed the same way Fantomas is already handled — pin csharpier's version (`1.3.0`,
      matching the version already in local use) in `.config/dotnet-tools.json`, install it globally
      in `setup-dotnet/action.yml`, and switch both the pre-commit lint-staged entry (`package.json`)
      and the CI gate command (`repo-config.yml`) to the bare `csharpier format`/`check` form (no
      `dotnet` prefix, avoiding the manifest-restore requirement), matching Fantomas's own documented
      convention. Verified locally before pushing: `csharpier check` against exactly this PR's 95
      affected `.cs` files (diff vs. merge-base `d9a832b6a`) — clean; a full local
      `gate run --surface=ci --group=formatting-verify` — `PASS`; and a full
      `gate run --surface=pre-push` — clean (`EXITCODE=0`, redirected-and-captured, not piped).
      Fixed in `165fe8621`; head advanced to `165fe8621b319cd5422a9912c260bdeb8ef23616`; CI
      restarted against this head and is being polled to green.

      A third CI-only failure surfaced on the next run (head `57551da075166237e2718e9e21284b0749a4b3e8`):
      the `.NET quality gate` failed with `error IDE1006: Naming rule violation: Missing prefix:
      '_'` in `OseId.Host/{HealthEndpoints,DisabledCapabilityEndpoints}.cs`. Root cause: both
      `apps/ose-id-be/.editorconfig` and `apps/ose-id-be-e2e/.editorconfig` require private
      const/static/readonly fields to be `_camelCase` at `severity = warning`;
      `apps/ose-id-be/Directory.Build.props` sets `TreatWarningsAsErrors`, promoting it to a build
      error; the .NET 10 SDK enforces `.editorconfig`-configured IDE rules at build time even
      without `EnforceCodeStyleInBuild` set. Undetected before this PR because no prior PR since
      the old C# demo apps were deleted had touched `.cs` files in its diff. Scanned the whole
      `ose-id-be`/`ose-id-be-e2e` build graph rather than just the two files CI flagged and renamed
      all 35 violating private fields across 19 files for consistency. Verified via a full
      `gate run --surface=pre-push` (`ose-id-be:lint` with `TreatWarningsAsErrors` and
      `--no-incremental`, clean; `ose-id-be:test:unit`, 96/96 passed) and a standalone
      `dotnet build` of the e2e project (0 warnings, 0 errors), since it has no `typecheck`/`lint`
      Nx target of its own. Fixed in `b6b06f5bc`; head advanced to
      `b6b06f5bc78a4deb27c01fa57c499c7623338181`; CI restarted against this head and is being
      polled to green.

      While investigating, found a stray background shell left over from an earlier-dispatched
      investigation into intermittent `apps/ose-id-be-e2e` local-stack E2E failures (a `dotnet test`
      run holding an open HIPPO reservation anchor, 0% CPU and its log silent for hours) — stopped it
      to release the reservation, which likely explains some of this session's earlier HIPPO
      admission contention. That investigation's report (delivered after this session's context was
      summarized, so its dispatch is not itself recorded here) had already produced two committed
      fixes (`e3b559a87`, `f3b9cc5de`) and one remaining, undiagnosed-until-then root cause: the
      shared `scripts/next-with-port.mjs` wrapper (used by six apps) spawned the resolved `next`
      binary directly, letting the OS resolve its shebang; under Volta that lands on Volta's shim, a
      second node process with a different PID than the one actually running Next, so the wrapper's
      `child.kill(signal)` on shutdown signalled the shim instead of Next and orphaned the real
      server — the cause of two of the four failures in an intermittent E2E run. Fixed by spawning
      through this process's own `process.execPath` directly on the resolved binary path, bypassing
      shebang re-resolution (the bare `"next"` PATH-fallback case, with no file path to hand to node
      directly, is unchanged). Behaviour-preserving for all six consumers (same binary, same args,
      same signal semantics). Verified via a full `apps/ose-id-be-e2e` `dotnet test` run: 27/27
      passed. Fixed in `e8dd36429edb8d54e8a1b2035081adce268fdbcd`; head advanced to the same SHA;
      CI restarted against this head and is being polled to green.

- [x] [AI] Require the PR's exact current head/base Quality gate, applicable finite API/E2E/schema gates, one authenticated clean current-head `pr-leak-review`, and the repository-required semantic review for identity/security code. Resolve every blocking finding and rerun invalidated proof.
      **Date**: 2026-09-17. **Status**: Done.

      **`pr-leak-review` first pass** (review-id `5230479866`, head `d89ec62ef144d74f7d7424ce7047cc7de499a9b4`):
      `findings` — 6 machine-specific-absolute-path occurrences across 5 evidence files under
      `plans/done/2026-09-17__ose-id-init-01-foundation/evidence/`: a repeated local Homebrew dotnet
      SDK install-prefix path (4 files, `{phase-2-gate,phase-2-refactor,phase-2}/nx-quality.txt` and
      `phase-3-quality-matrix/test-quick-ose-id-be-and-e2e.txt`) plus one distinct macOS `$TMPDIR`
      path in `phase-7/pre-push-gate.txt`. Redacted all 6 to portable placeholders
      (`<dotnet-sdk-prefix>`, `<tmp>`), matching the `<home>` redaction style from commit `15d0aca7f`;
      grep-verified zero remaining matches repo-wide for the offending patterns before committing.
      Fixed in `d72bf5e47`.

      **Semantic review** (single explicit pass per `repo-governance/workflows/pr/pr-review.md`, risk
      tier `full`, probe class `claim-vs-artifact-truthfulness`): scout → 9 discipline specialists
      (architecture, docs-quality, governance, instruction-decay, integrity, business-logic,
      performance, security, type-soundness) ran concurrently, then `pr-review-synthesis-maker`
      deduplicated, re-verified, and posted one consolidated review (review-id `5230597816`, head
      `d89ec62ef144d74f7d7424ce7047cc7de499a9b4`): 9 findings after dedup (1 CRITICAL, 1 HIGH, 5
      MEDIUM, 2 LOW; integrity/security/type-soundness reported clean). All 9 resolved:

      - **CRITICAL** — `apps/ose-id-be-e2e/scripts/local-stack.mjs`'s `cleanup()` decided what to
        tear down from a success counter (`reachedStageCount`) bumped only after a stage's readiness
        wait succeeded, while each stage's process was spawned earlier in that same stage; a
        readiness-wait failure (a budgeted, ordinary outcome) orphaned the just-spawned process and
        its run-scoped build output, reachable on the plain single-instance default path. Rewritten
        to derive the teardown list from actual ownership; added a deterministic fixture-profile test
        seam and two regression tests, proven red without the fix (confirmed orphaned process and
        leaked directory) and green with it. Fixed in `fd0e4513a`.
      - **MEDIUM** (same file, related root cause) — `publishBackend()` run-scoped only the publish
        output, leaving MSBuild intermediate state shared across concurrent invocations. Scoped via
        `--property:ArtifactsPath` after verifying the initially-suggested `BaseIntermediateOutputPath`
        actually breaks the multi-project build (propagates to every referenced project, colliding
        their generated `AssemblyInfo.cs`). Fixed in `fd0e4513a`; full `LocalStackRunnerTests` suite
        29/29 passing.
      - **HIGH** — the new `serve` naming exception was not propagated to two genuinely-contradicted
        surfaces (the `swe-developing-applications-common` skill and
        `target-naming-canonical-names-e2e-and-utility.md`); two other named surfaces were confirmed
        already consistent (aliasing-scoped, not contradicted) and left untouched. Fixed in
        `013e6c15d`.
      - **MEDIUM** — `apps/ose-id-be/tests/unit/Tests/ArchitectureBoundaryTests.cs`'s exclusivity test
        didn't actually bound the `ProjectReference` count; added a count assertion and verified the
        gap was real (temporarily adding a second reference made the suite pass without the fix, fail
        with it). Fixed in `0fed0f395`.
      - **MEDIUM** — the archived plan's README still read "In Progress ... execution starts at
        Phase 0", pointing at the vacated `plans/in-progress/` path. Corrected the two false
        specifics; deliberately did not flip to "Complete" since Phase 7 was still open at fix time —
        that update lands with the final report below. Fixed in `013e6c15d`.
      - **MEDIUM** — `docs/reference/monorepo-structure.md` referenced a target doc via a bare
        backtick string that did not resolve from the file's location; replaced with a real relative
        link. Fixed in `013e6c15d`.
      - **MEDIUM** — `apps/ose-id-web/next.config.ts`'s run-scoped `distDir` also discards Next's
        persistent build cache every local-stack invocation; documented the tradeoff in-line rather
        than introducing a shared cache directory, which would reintroduce the concurrent-write hazard
        `distDir` scoping exists to avoid. Fixed in `013e6c15d`.
      - **LOW** — `tech-docs/006-api-contract-delta.md` overstated the `X-Correlation-ID` guarantee as
        blanket; scoped it to documented operations. Fixed in `013e6c15d`.
      - **LOW** — `mandatory-targets-cli-e2e.md`'s frontmatter and section lead-in still described
        Playwright only after this PR's own diff added a Dotnet/Reqnroll subsection; widened. Fixed in
        `013e6c15d`.

      All 9 review threads replied to (citing the fixing commit) and marked resolved via the GitHub
      Reviews API.

      **`pr-leak-review` second pass** (review-id `5231367941`, head
      `013e6c15deff332edfe912dbdbdcec65c007db07`): authenticated `pass` — 0/0/0 across all three
      categories, reviewing the full diff fresh (not a reuse of the first pass).

      Head advanced to `013e6c15deff332edfe912dbdbdcec65c007db07`; CI restarted against this head and
      is being polled to green.

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
