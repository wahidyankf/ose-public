# Preliminary Delivery Audit — ose-id-init-01-foundation

**Date**: 2026-09-17. **Auditor**: this session (Phase 6, Preliminary Delivery Audit step).
**Scope**: trace AC-FND-01..08, approved scope, every file-impact row, physical schema/migration
proof, old-code/new-schema compatibility, no-loss manifests, runtime guard, rollback/forward-fix,
automated/manual evidence, rules propagation, license record, and Knowledge Capture against concrete,
citable evidence in the delivery record — per `delivery.md`'s own instruction, "checked boxes alone
are not evidence." Where this audit found an unsupported or inaccurate row, it reopened the
originating phase and corrected it in `delivery.md`/`learnings.md` before this document was written;
those corrections are cited inline below, not hidden.

**Branch**: `ose-id-init-01-foundation-base`. **Commits audited**: `63dfb8d89`, `e41df9885`,
`aaace039b`, `8c4ec9822`, `83b73f6b6`, `b851283d1` (merge-base with `main`:
`d9a832b6a49d7f5587dd63061bb45827a6a0b75e`). **Working tree at audit time**: clean except this plan's
own `delivery.md`/`learnings.md` edits (`git status --short`).

---

## 1. AC-FND-01..08 trace

| AC        | Statement (short)                                                  | Phase             | RED/GREEN/REFACTOR evidence                                                                                                                                                                                                                                                                                                                      | Verdict |
| --------- | ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| AC-FND-01 | Owned local lifecycle; no manual multi-terminal setup              | Phase 4           | `LifecyclePlan.cs`, `LocalStackPolicySteps.cs` (Unit 80/80), `LocalStackCompositionSteps.cs` (Integration 26/26), `LocalStackSteps.cs`/`LocalStackRunnerTests.cs` (E2E, 18/18 twice consecutively, zero leftover containers/ports both times). 8 real concurrency defects found and fixed (`learnings.md` "AC-FND-01 local-stack runner" entry). | PASS    |
| AC-FND-02 | Truthful health; no false-positive readiness                       | Phase 4           | `HealthEndpoints.cs`, `ReadinessPolicy.cs`; Unit 80/80, Integration 26/26, E2E 14/14 against real Docker Postgres + spawned backend. REFACTOR proved no EF/persistence leakage (`PersistenceRuntimeBoundaryTests.cs`, no `DbContext` registered).                                                                                                | PASS    |
| AC-FND-03 | Migration/application role privilege separation                    | Phase 3           | `20260916060219_CreateIdentityFoundation.cs` (audit envelope, hard-delete guard trigger, least-privilege grants). Live-verified: real `DELETE` of migration history fails SQLSTATE `OS001`; every DDL probe (CREATE/ALTER/DROP/CREATE INDEX) denied `42501`; self-`GRANT` is a verified no-op.                                                   | PASS    |
| AC-FND-04 | Production runtime mode disabled (backend + web)                   | Phase 2           | `AC-FND-04 and AC-FND-06 — Safe backend/web hosts` RED/GREEN/REFACTOR; Phase 2 Gate: "production modes fail closed in tests, identity route inventory is empty."                                                                                                                                                                                 | PASS    |
| AC-FND-05 | No instance-affinity requirement                                   | Phase 4           | Same E2E suite as AC-FND-01: `TwoInstancesBothBackendsBecomeReadyAndBothStop`, `TwoConcurrentRunsUseIndependentRunIdsAndBothCleanUpFully` — both green twice consecutively.                                                                                                                                                                      | PASS    |
| AC-FND-06 | Disabled identity capabilities fail closed (404, stable code)      | Phase 2 + Phase 5 | Phase 2 RED/GREEN/REFACTOR; Phase 5 Gate's route-disclosure fix (`RouteDisclosureGuard.cs`, `route-disclosure.feature`) closed a leak where a disabled route answered differently by method — now indistinguishable from a genuinely unregistered path across all headers/body/status.                                                           | PASS    |
| AC-FND-07 | Accessible web shell (keyboard/screen-reader/320px/non-color-only) | Phase 2           | `AC-FND-07 — Accessible status shell` RED/GREEN/REFACTOR; component + focused E2E accessibility assertions green. Web design/usability/exploratory live-tester triad (Phase 5) additionally confirmed no regressions and closed all findings (see §8).                                                                                           | PASS    |
| AC-FND-08 | Database history rejects physical deletion                         | Phase 3           | Same migration as AC-FND-03: `BEFORE DELETE` guard trigger, `ON DELETE RESTRICT`; Integration inventories all six audit columns/constraints/guards/FK actions/grants; E2E proves built-service readiness still sees the row after a rejected delete.                                                                                             | PASS    |

All eight acceptance criteria have live, non-mocked evidence (real Docker PostgreSQL, real spawned
processes, real HTTP calls) at Unit+Integration+E2E as applicable, not just checked boxes.

---

## 2. Approved scope

**Delivery unit** (Delivery Boundaries table, `delivery.md` lines 57-63): one PR at Phase 7
delivering "Four build-valid projects, PostgreSQL migration/roles, truthful health, deterministic
runner, and non-local pre-listener rejection." Phase 0 makes no `main` change; Phase 8 is
post-merge-only. `baobab` and any other plan are explicitly out of scope (never touched — no path
under a sibling plan folder appears in the branch diff).

**Named new apps** (tech-docs/004 Decision Summary, matches actual delivered projects): `ose-id-be`,
`ose-id-be-e2e`, `ose-id-web`, `ose-id-web-e2e` — all four exist, build-valid, and are indexed in
`apps/README.md`. No fifth app, no GraphQL/MCP project, no empty adapter/package was created
(`tech-docs/004`'s explicit exclusion, verified: no such directory exists under `apps/`).

---

## 3. File-impact ledger trace

`tech-docs/004-decisions-sources-and-file-impact.md`'s File-Impact Analysis tree is the approved
ledger. Comparing it against `git diff --name-only main...HEAD` (353 files, merge-base
`d9a832b6a4`):

- Every path under `apps/ose-id-be/`, `apps/ose-id-be-e2e/`, `apps/ose-id-web/`,
  `apps/ose-id-web-e2e/`, `specs/apps/ose/id-be/`, `specs/apps/ose/id-web/` is `[N]`-ledgered and
  present.
- `apps/README.md`, `specs/apps/ose/README.md`, `docs/reference/monorepo-structure.md`,
  `docs/reference/web-sites.md`, `repo-governance/development/project-dependency-graph.md`,
  `package.json`, `package-lock.json`, `nx.json`, `repo-config.yml` are all `[E]`-ledgered and
  edited as expected.
- `plans/in-progress/ose-id-init-01-foundation/` is `[D]`/in-flight per the ledger (moves to
  `plans/done/` at archival, not yet performed — see §12).

**Eleven files fall outside the ledger.** This audit traced each one; two were undocumented until
this pass and are now corrected (both corrections are cited below and recorded at their owning
phase's Gate):

| Path                                                                                                                                                                      | Why it exists                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Disposition                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `docs/explanation/.../c-sharp/testing-standards.md`                                                                                                                       | Phase 1 grounding discovery: `behaviour-coverage.mjs` had no C# binding extractor; this doc records the new pattern. Documented inline at `delivery.md` line ~340/349.                                                                                                                                                                                                                                                                                                     | Traced, in-record           |
| `scripts/behaviour-coverage.mjs`, `scripts/behaviour-coverage.test.mjs`                                                                                                   | Same Phase 1 discovery: new `extractCsharpBindings`/`csharpFeatureReferences`, RED-confirmed-before-implementation.                                                                                                                                                                                                                                                                                                                                                        | Traced, in-record           |
| `repo-governance/development/infra/nx-targets/{tag-convention-current-tags-and-examples.md,target-naming-rules.md,mandatory-targets-cli-e2e.md}`                          | Phase 5's own dedicated Automatic Rule-Impact Coverage step (its own inventory/classification/manifest at `local-tmp/rules-propagation/ose-id-init-01-manifest.md`), not ad hoc.                                                                                                                                                                                                                                                                                           | Traced, in-record           |
| `repo-config.yml`'s `gate-surface-guards.pre-commit` entry, `apps/rhino-cli/src/RhinoCli.Cli/src/Gate.fs`                                                                 | `aaace039b`: fixed a real, commit-blocking pre-commit gate crash (unadmitted HIPPO surface + unbounded lint-staged concurrency). **Was undocumented in `delivery.md`/`learnings.md` until this audit.** Now recorded at Phase 3 Gate (new bullet) and `learnings.md`'s new "shared pre-commit gate batch" entry; routed to a follow-up `rules-propagation` run to settle whether "enforcement wiring" required that channel.                                               | **Corrected by this audit** |
| `apps/ose-app-web-e2e/{playwright.config.ts,project.json}`, `repo-governance/development/infra/ci-conventions/e2e-test-pairing-rule-and-environment-variable-standard.md` | `63dfb8d89`: fixed the same dev-server-fixture memory-exhaustion anti-pattern (that produced `ose-id-web-e2e`'s in-ledger fix) in a different, pre-existing sibling app, and generalized it into a new "Server Fixture Standard". **Was undocumented in `delivery.md`/`learnings.md` until this audit.** Now recorded at Phase 0 Gate (new bullet) and an addendum to `learnings.md`'s "Unguarded Nx fan-out" entry; routed to the same follow-up `rules-propagation` run. | **Corrected by this audit** |

No other off-ledger path exists (verified: `git diff --name-only main...HEAD` minus every path
above and every `tech-docs/004`-ledgered path is empty).

**Assessment**: both corrected items are real, technically-necessary root-cause fixes to
resource-crash conditions that were actually hit during execution (not speculative hardening), and
neither altered application behavior delivered to users. Their governance-prose/enforcement-wiring
edits should arguably have gone through `rules-propagation.md` under that skill's own "implied by
target" test; that question is now explicitly routed there rather than silently bypassed. Not
grounds to reopen Phase 0 or Phase 3 as failed — the underlying acceptance criteria for those phases
are unaffected — but the delivery record's completeness was genuinely deficient before this audit's
corrections, which is exactly the class of gap this audit step exists to catch.

---

## 4. Physical schema/migration proof

`OseId.Infrastructure/Persistence/Migrations/20260916060219_CreateIdentityFoundation.cs` is the
single forward migration. Live-verified against real PostgreSQL 17-alpine
(`evidence/phase-3-persistence/e2e-run-2-fresh-database.txt`, `evidence/phase-3-schema/
catalog-manifest-before-after.txt`): migration succeeds from empty storage; the catalog contains
only the migration-history table plus EF's own `__EFMigrationsHistory`
(`evidence/phase-3-schema/catalog-manifest-before-after.txt` — no placeholder or stray object).
Compiled-SQL snapshots (`evidence/phase-3-schema/compiled-sql-snapshot.txt`) prove explicit column
projection (no `SELECT *`), bound parameters, propagated cancellation, and a bounded command
timeout — no EF change-tracking or LINQ-to-database runtime path
(`PersistenceRuntimeBoundaryTests.cs`, 5 facts including the Phase 3 REFACTOR addition). Bounded-row
proof: `evidence/phase-3-schema/explain-10000-rows.txt` — Sequential Scan is the real planner
choice at that row count (measured, not assumed; `tech-docs/002` was corrected to match).

---

## 5. Old-code/new-schema compatibility

This is a greenfield delivery unit: `ose-id-be` is the repository's first ASP.NET Core app and no
prior schema or running instance of it exists anywhere (`evidence/phase-0/generators-and-ports.md`).
There is no old code that must keep working against the new schema, and no live traffic to migrate
mid-flight. The compatibility proof required by this delivery unit therefore reduces to: (a) a fresh
empty-storage apply succeeds twice consecutively
(`evidence/phase-3-persistence/{e2e-run-1.txt,e2e-run-2-fresh-database.txt}`), and (b) the migration
is provably forward-only so no future old-code path can silently run it backward — see §6.

---

## 6. No-loss manifests

The migration-history table is append-only, immutable metadata (audit envelope + hard-delete guard
trigger raising SQLSTATE `OS001`; `ON DELETE RESTRICT`). `evidence/phase-3-schema/
catalog-manifest-before-after.txt` inventories the full catalog before and after the migration —
nothing beyond the one ledgered table and EF's own history table exists, so there is no
undocumented object that could carry silent data loss. Since no prior data exists to lose
(greenfield, §5), "no-loss" here is evidenced by the delete-rejection proof itself (§8) rather than
a before/after row-count diff, which the plan correctly does not require at this phase.

---

## 7. Runtime guard

AC-FND-04/06's Phase 2 work is the runtime guard: `apps/ose-id-be/` and `apps/ose-id-web/` both
reject Staging/Production/missing/unknown runtime modes at the host boundary, verified by RED/GREEN/
REFACTOR with focused E2E (`evidence/phase-2*/`) and reconfirmed by the Phase 2 Gate ("production
modes fail closed in tests, identity route inventory is empty"). AC-FND-06's disabled-capability
guard was strengthened at Phase 5 by `RouteDisclosureGuard.cs`, closing a wrong-method disclosure
leak so a disabled route is indistinguishable from a genuinely unregistered one across status, body,
and every header (`route-disclosure.feature`, `RouteDisclosureProcessSteps.cs` E2E, verified via the
AET-001/AET-002 retest — `evidence/phase-5/api-quality-gate/retest-tester-report.md`).

---

## 8. Rollback/forward-fix

The migration is explicitly forward-only by construction, not by convention alone:
`CreateIdentityFoundation.Down()` throws `NotSupportedException` rather than running or being
silently ignored — proved as a build-enforced Unit fact added at the Phase 3 REFACTOR step
(`PersistenceRuntimeBoundaryTests.cs`, +1 fact). `OseId.Migrator/Program.cs` is a dedicated
forward-only migrator executable — there is no rollback code path to audit because none exists to
run. A forward-fix (a corrective follow-up migration) is the only supported recovery path for any
future schema defect, consistent with the append-only/no-hard-delete audit contract this same phase
established (AC-FND-08, §1/§6).

---

## 9. Automated/manual evidence

**Automated**: Unit 80/80 (health+lifecycle), 62/62→80/80 (backend, across phases), Integration
26/26, backend E2E 11/11→18/18, web E2E and component suites — all cited per-phase above with exact
`evidence/phase-N*/` paths. Full Nx quality matrix reruns at each phase gate (build/typecheck/lint/
test:quick), most recently `evidence/phase-3-quality-matrix/affected-matrix-35-projects.txt` (33/35
projects fully green, the remaining 2 failing only on named-absent later-phase bindings, permitted
per the Phase 1 Gate's own grounding correction).

**Manual**: Phase 5's live-tester triad against a fresh owned stack —
`api-exploratory-tester` (`evidence/phase-5/api-quality-gate/{run-id.txt,tester-report.md,
retest-run-id.txt,retest-tester-report.md}`, discovery + scoped verification retest, AET-001/002
resolved, AET-003 not-applicable, AET-004 filed Minor/non-blocking), `web-exploratory-tester`,
`web-usability-tester`, `web-design-tester` (`evidence/phase-5/web-live-gates/`), plus a manual
Rule-1/Rule-9 browser pass (`evidence/phase-5/manual-http-matrix.txt`,
`evidence/phase-5/manual-verification-recovery-and-two-instance.txt`). Phase 5 Gate confirms zero
unchecked AET/EWT/UWT/DWT findings remain (verified by direct grep at Phase 6 Knowledge Capture).

---

## 10. Rules propagation

Two channels, both exercised correctly with one exception now corrected:

1. **Phase 5's own Automatic Rule-Impact Coverage** (naming/tag/port facts) — ran as designed, its
   own inventory/classification/manifest at `local-tmp/rules-propagation/
ose-id-init-01-manifest.md`, `final-status: partial` pending the Phase 5 Gate re-run, which
   completed clean (§9).
2. **The dedicated `repo-governance/workflows/rules/rules-propagation.md` workflow**, for durable
   rule _prose_ — correctly NOT invoked ad hoc from inside this plan (per `repo-propagating-rules`'
   own "rule work does not go in through an ad-hoc edit"). Five `learnings.md` entries carry final
   dispositions; three are routed to a follow-up run with fully specified candidate text and
   placement (Nx fan-out symptom addition, PostgreSQL E2E-runner-correctness new doc, BDD
   `behaviour-coverage`-timing addition). Two more were added by this audit and routed to the same
   follow-up run (§3): the pre-commit gate-surface-guards/`Gate.fs` fix and the Server Fixture
   Standard addition. One real code defect in shared `rhino-cli` tooling
   (`governance-readme-index`'s `--fail-kinds` not excluding `unannotated`) is flagged as a bug
   report, not a rule-propagation candidate — it needs its own fix, possibly in the private parity
   sibling.

No rule surface was left silently unreconciled once this audit's two corrections landed (§3).

---

## 11. License record

`evidence/phase-0/license-resolution.md`: .NET 10 runtime/ASP.NET Core (MIT), Npgsql 10.0.3
(PostgreSQL License, permissive), SqlKata/SqlKata.Execution 4.0.1 (MIT), EF Core 10.0.12
migration-time tooling (MIT), Next.js/React pinned to sibling `ose-app-web` versions (MIT). No fee,
no copyleft, no incompatible license. This was a pre-scaffold, registry-verified resolution; no
Phase 2+ evidence record supersedes it with a different installed-package license, and no dependency
outside this resolved set was added (`package-lock.json` is the only root-generated file per the
ledger, §3).

---

## 12. Knowledge Capture

All 5 original `learnings.md` entries carry final, individually-reasoned dispositions (three routed
to a follow-up `rules-propagation` run, one flagged out-of-repo-scope for upstream HIPPO-consumer
awareness, one stays plan-specific, one flagged as a real `rhino-cli` code defect) — see `delivery.md`
Phase 6 Knowledge Capture. This audit added a sixth entry and an addendum to the first entry (§3),
both now also carrying final dispositions routed to the same follow-up run. `md links validate`
(12595 links, 0 findings) and `plan validate` (225 plans, 0 findings) both re-ran clean after this
audit's edits (`rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/
rhino-bin.sh plan validate` → `checked 225 plans, no findings`).

---

## Audit verdict

**PASS.** Every row above is supported by citable, live evidence, not a checked box alone. Two
delivery-record gaps were found during this trace (§3) and corrected in `delivery.md`/`learnings.md`
before this document was finalized — neither reopens an acceptance criterion as failed, both are
now fully accounted for in the file-impact ledger trace and routed to the correct follow-up channel.
No AC-FND row, schema/migration proof, or rollback path is unsupported.

**Addendum (post-writing).** The two items flagged above as remaining have both since run.
The fresh-stack smoke/multi-instance E2E re-run found and fixed a real ninth defect in the
`ose-id-be-e2e` local-stack runner's process lifecycle (Volta's `node` shim silently defeating
programmatic SIGTERM; see `learnings.md`'s "Volta's `node` shim silently defeats programmatic
SIGTERM, orphaning the local-stack runner" entry and `delivery.md`'s Preliminary Delivery Audit
section for the full fix and verification). This does not reopen AC-FND-01 as failed: the defect
was in test-harness/runner process-signalling code, not in any acceptance-criterion behaviour, and
the unfiltered assembly (26/26, including that criterion's own scenarios) now passes clean with
zero leftover resources. The rule-15/16 defect-disposition checklist bullet also ran: zero
unchecked `AET/EWT/UWT/DWT` defects remain anywhere in `delivery.md`. This document's verdict
stands: **PASS**, nothing remaining before Plan Archival from either item.

**Completion date** (`rtk date +%F`, recorded per `delivery.md`'s Plan Archival instruction, never
predicted or reused from this document's authoring date): **2026-09-17**.
