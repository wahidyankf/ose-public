# Delivery — FERRET Init 02 Protocol-Independent Local Backend

**Evidence scope:** Existing workflow commands and Plan 01 contracts are **[Repo-grounded]**. Every FERRET
source/test/spec path, symbol, Nx target, port, limit, and evidence path below is an approved **[Judgment call —
new artifact]** unless labelled otherwise. Dependency/image versions are **[Unverified]** until locked.

> **Legend:** `[AI]` executes repository work. `[HUMAN]` is only for unavoidable privileged/out-of-band work.
> `[AI+HUMAN]` prepares exact evidence for a human action. This local-only delivery expects no human-only
> implementation step; git mutations still follow explicit repository authority.

## Lifecycle and Dependency Prerequisites

Do not implement from backlog. This plan may be authored and reviewed in the same planning bundle as Plan 01,
but implementation is blocked until Plan 01's exact-head PR is merged, its done archive is visible on current
`origin/main`, its terminal audit has passed, and canonical cleanup proves its worktree plus local/remote
delivery branch absent. Then move this plan to
`plans/in-progress/ferret-init-02-local-backend/` in a pure lifecycle/index change. Reconcile this plan against
the delivered Plan 01 event/schema/CLI/project/harness contracts and amend it before code if they differ.

## Worktree

Worktree path: `worktrees/ferret-init-02-local-backend/`. This declaration follows the
[Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and the
[plan Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md).

Provisioning status: pending under the narrow Authoring-Worktree Exception. The user explicitly confirmed that
this plan-authoring session must continue in the active `worktrees/oseval-plan-init/` worktree. The Plan 01/Plan
02 backlog artifacts there are unlanded, so a second execution worktree cannot truthfully start from
`origin/main` with these plan contracts yet. The exception authorizes plan authoring only. After both plans land
and Plan 01 completes, Phase 0 provisions/enters the matching execution worktree from current `origin/main`;
implementation in the authoring worktree is forbidden. Execution identity and branch inventory are recorded
immediately after provisioning.

At Phase 0, run from the primary repository root through the canonical worktree entrypoint:

```bash
claude --worktree ferret-init-02-local-backend
```

If the branch already exists, attach the declared route. On failure, prune once, inspect worktree/branch state,
reuse the one valid plan worktree or preserve evidence and stop. Never force-delete or create a second worktree.

## Delivery Mode: worktree-to-pr

One implementation PR targets `main`. It becomes ready to merge only after the exact head/base Quality gate,
one clean authenticated current-head `pr-leak-review`, and applicable API/schema/E2E/rules gates pass. This plan
does not add a broad semantic-review requirement; run one only when the repository workflow or user requests
it. No direct push is authorized.

## Parallelization Model

Use N=3 workers plus one orchestrator when capacity exists. A Python backend worker owns domain/application and
REST Unit code without migrations; a persistence worker owns SQLAlchemy/Alembic/PostgreSQL plus Integration; an
E2E worker owns TypeScript/Playwright and fault fixtures. The orchestrator owns OpenAPI/specs, CLI sync migration,
shared contracts, local runner, migrations integration, rules, generated artifacts, and phase gates. Shared
schema/migration files stay serial.

## Delivery Boundaries

| Phase(s) | Natural seam                             | Branch                              | Delivery opportunity          | Resulting safe state and rollback                                                                                                                      |
| -------- | ---------------------------------------- | ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0        | Predecessor/setup baseline               | `ferret-init-02-local-backend-base` | none                          | No product change; verified Plan 01 baseline only.                                                                                                     |
| 1–5      | Complete local backend and optional sync | same                                | one PR after Phase 6          | Backend is Local/Test loopback only; CLI sync defaults disabled and standalone behavior remains. Disable sync before reverting backend; preserve data. |
| 6        | Knowledge capture/archive                | same                                | included in implementation PR | Archived plan and implementation share one reviewed head.                                                                                              |
| 7        | Exact-head review, readiness, and merge  | same                                | mandatory squash merge        | Contract, migrations, implementation, tests, evidence, and archive share one reviewed head; the merge commit is contained on `origin/main`.            |
| 8        | Terminal audit and canonical cleanup     | none                                | mandatory terminal node       | Workflow-owned terminal PASS precedes non-force cleanup; primary `main` ends equal to `origin/main`.                                                   |

One seam is necessary because enabling CLI delivery without the idempotent API loses correctness, while exposing
the API without auth/migrations/query proof is unsafe. No temporary feature flag is needed: backend sync is
disabled by default and non-Local/Test backend startup fails before listening. Enabled/disabled tests are
mandatory.

## Executable TDD and Evidence Contract

Backend paths are fixed as `apps/ferret-be/src/ferret_be/{domain,application,adapters}/`; CLI extensions use
`apps/ferret-cli/src/ferret/`; owner tests stay under each production app and public-process tests stay in the
dedicated E2E app. Every path and symbol below is a **[Judgment call — new artifact]**. There are no
No unresolved operation, validator, target, or path placeholder remains.

For every packet below, perform and record exactly three steps:

1. **RED:** create only the named test/scenario, run its exact focused command, and require an assertion failure
   naming the missing behavior—not import/configuration/infrastructure failure.
2. **GREEN:** implement only the named production symbol, rerun the same command, and require zero exit.
3. **REFACTOR:** improve names/structure without behavior growth, then run the exact regression command and
   require zero exit.

Each run records command, exit, test IDs, 40-character HEAD, timestamp, and diff reference at
`evidence/phase-<n>/<packet-id>-{red,green,refactor}.txt`. `FR-U` routes an unexpected Unit RED to its fixture or
test bootstrap; `FR-PG` routes runner/connectivity failure to Phase 0 and schema/query failure to the owning
packet; `FR-HTTP` routes wire/schema failure to the named REST mapper or canonical contract and forbids loosening
either; `FR-CLI` routes SQLite/state failure to the owning CLI packet and HTTP mismatch to the batch contract.
Any failed GREEN/REFACTOR or unrelated baseline failure stops the packet; fix root cause and rerun all three
steps before checking it off.

### Phase 1 contract and architecture packets

| Packet   | Acceptance/scenarios                    | Exact RED test and production symbol                                                                                                                                                                                                       | Focused command                                                                                                                                                                                                                    | Regression command                                                                                                                                                                                       | Failure/evidence                                                                                  |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `BE-C01` | AC-BE-03, 08–10; API contract structure | `specs/apps/ferret/be/contracts/{project.json,.spectral.yaml,openapi.yaml,paths/*.yaml,schemas/*.yaml}`; generated bundles under `generated/`                                                                                              | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-contracts:lint`                                                                                                             | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t lint,bundle,test:quick --projects=ferret-contracts`                                              | `FR-HTTP`; `evidence/phase-1/BE-C01-*`                                                            |
| `BE-C02` | AC-BE-12 architecture direction         | `apps/ferret-be/tests/unit/architecture/test_dependency_rules.py::test_domain_and_application_do_not_import_adapters`; `apps/ferret-be/src/ferret_be/{domain,application}/__init__.py`                                                     | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/architecture/test_dependency_rules.py::test_domain_and_application_do_not_import_adapters'` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:unit --projects=ferret-be`                                                   | `FR-U`; `evidence/phase-1/BE-C02-*`                                                               |
| `BE-C03` | AC-BE-01..12 and API-LIVE..CAPABILITIES | exact feature paths/titles in `tech-docs/004-bdd-spec-delta-and-adapter-map.md`; bindings in `apps/ferret-be/tests/{unit,integration}/steps/` and `apps/ferret-be-e2e/src/steps/`                                                          | `rtk npm exec nx -- run-many -t test:coverage:behaviour --projects=<affected-projects>`                                                                                                                                            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour,test:quick --projects=ferret-cli,ferret-cli-e2e,ferret-be,ferret-be-e2e` | missing/duplicate/untagged scenario returns to owner feature/binding; `evidence/phase-1/BE-C03-*` |
| `BE-C04` | AC-BE-02/08/11; pinned local stack      | `apps/ferret-be/tests/integration/runtime/test_local_stack.py::{test_postgres_health,test_migration_before_ready,test_loopback_guard,test_cleanup}`; `infra/dev/ferret/{docker-compose.yml,run.sh}`                                        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:integration --args='tests/integration/runtime/test_local_stack.py'`                                                 | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t build,typecheck,lint,test:quick --projects=ferret-be,ferret-be-e2e,ferret-contracts`             | `FR-PG`; `evidence/phase-1/BE-C04-*`                                                              |
| `BE-C05` | reproducible Phase 1–7 gates            | `apps/ferret-be/tests/unit/scripts/test_verify_delivery_phase.py::{test_closed_phase_map,test_missing_evidence_fails,test_noop_target_fails}`; `apps/ferret-be/scripts/verify_delivery_phase.py::main` and `project.json::verify:delivery` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/scripts/test_verify_delivery_phase.py'`                                                     | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:unit --projects=ferret-be`                                                   | `FR-U`; `evidence/phase-1/BE-C05-*`                                                               |

### Phase 2 core and PostgreSQL packets

| Packet   | Acceptance/scenarios                                   | Exact RED test path and symbol                                                                                                                                                                           | Exact production path and symbol                                                                                                 | Focused command                                                                                                                                                                             | Regression command                                                                                                                                                       | Route/evidence                       |
| -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `BE-U01` | AC-BE-03/05/06; Plan 01 field invariants               | `apps/ferret-be/tests/unit/domain/test_models.py::{test_event_contract,test_capability_snapshot_contract}`                                                                                               | `apps/ferret-be/src/ferret_be/domain/models.py::{Event,CapabilitySnapshot,CapabilityEntry}`                                      | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/domain/test_models.py'`                              | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:unit --projects=ferret-be`                   | `FR-U`; `evidence/phase-2/BE-U01-*`  |
| `BE-U02` | AC-BE-08/12                                            | `apps/ferret-be/tests/unit/application/test_authorization.py::{test_closed_scopes,test_typed_errors}`                                                                                                    | `apps/ferret-be/src/ferret_be/application/{authorization.py,errors.py}::{authorize,ApplicationError}`                            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/application/test_authorization.py'`                  | same Phase 2 Unit regression command from `BE-U01`                                                                                                                       | `FR-U`; `evidence/phase-2/BE-U02-*`  |
| `BE-U03` | AC-BE-03..06; API-BATCH-01..07                         | `apps/ferret-be/tests/unit/application/test_ingest_telemetry_batch.py::{test_new_batch,test_same_batch_hash_replays_stored_response,test_same_batch_different_hash_conflicts,test_ordered_mixed_result}` | `apps/ferret-be/src/ferret_be/application/commands.py::IngestTelemetryBatch`                                                     | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/application/test_ingest_telemetry_batch.py'`         | same Phase 2 Unit regression command from `BE-U01`                                                                                                                       | `FR-U`; `evidence/phase-2/BE-U03-*`  |
| `BE-U04` | AC-BE-09; API-EVENTS-01..04                            | `apps/ferret-be/tests/unit/application/test_list_events.py::{test_keyset_watermark,test_prune_epoch_invalidates}`                                                                                        | `apps/ferret-be/src/ferret_be/application/queries.py::{ListEvents,EventCursor}`                                                  | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/application/test_list_events.py'`                    | same Phase 2 Unit regression command from `BE-U01`                                                                                                                       | `FR-U`; `evidence/phase-2/BE-U04-*`  |
| `BE-U05` | AC-BE-10; API-USAGE-01..03; API-OUTCOMES-01..03        | `apps/ferret-be/tests/unit/application/test_analytics.py::{test_usage_groups,test_outcome_duration_visibility,test_prune_epoch_invalidates}`                                                             | `apps/ferret-be/src/ferret_be/application/queries.py::{SummarizeUsage,SummarizeOutcomes,AggregateCursor}`                        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/application/test_analytics.py'`                      | same Phase 2 Unit regression command from `BE-U01`                                                                                                                       | `FR-U`; `evidence/phase-2/BE-U05-*`  |
| `BE-U06` | AC-BE-10; API-CAPABILITIES-01..04                      | `apps/ferret-be/tests/unit/application/test_list_capabilities.py::{test_full_unique_key,test_latest_at_watermark,test_prune_epoch_invalidates}`                                                          | `apps/ferret-be/src/ferret_be/application/queries.py::{ListCapabilities,CapabilityCursor}`                                       | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/application/test_list_capabilities.py'`              | same Phase 2 Unit regression command from `BE-U01`                                                                                                                       | `FR-U`; `evidence/phase-2/BE-U06-*`  |
| `BE-U07` | AC-BE-11/12                                            | `apps/ferret-be/tests/unit/application/test_prune_and_publish.py::{test_dry_run,test_execute_increments_epoch,test_publish_after_commit_only}`                                                           | `apps/ferret-be/src/ferret_be/application/{commands.py,ports.py}::{PruneEvents,ChangePublisher}`                                 | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/application/test_prune_and_publish.py'`              | same Phase 2 Unit regression command from `BE-U01`                                                                                                                       | `FR-U`; `evidence/phase-2/BE-U07-*`  |
| `BE-I01` | AC-BE-03/11; schema constraints                        | `apps/ferret-be/tests/integration/postgresql/test_migrations.py::{test_fresh_schema_constraints,test_empty_downgrade_upgrade}`                                                                           | `apps/ferret-be/src/ferret_be/adapters/outbound/postgresql/migrations/versions/0001_initial_backend.py::upgrade`                 | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:integration --args='tests/integration/postgresql/test_migrations.py'`        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:integration,test:coverage:integration --projects=ferret-be` | `FR-PG`; `evidence/phase-2/BE-I01-*` |
| `BE-I02` | API-BATCH-01..07; replay/race constraints              | `apps/ferret-be/tests/integration/postgresql/test_batch_replay.py::{test_same_id_hash_replays_identical_response,test_same_id_different_hash_conflicts,test_concurrent_replay,test_item_constraints}`    | `apps/ferret-be/src/ferret_be/adapters/outbound/postgresql/{models.py,repositories.py}::{EventBatchRow,PostgresEventRepository}` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:integration --args='tests/integration/postgresql/test_batch_replay.py'`      | same Phase 2 Integration regression command from `BE-I01`                                                                                                                | `FR-PG`; `evidence/phase-2/BE-I02-*` |
| `BE-I03` | AC-BE-03/05; hash/lossless round trip                  | `apps/ferret-be/tests/integration/postgresql/test_event_round_trip.py::{test_event_fixed_vector,test_capability_fixed_vector,test_all_fields_round_trip}`                                                | `apps/ferret-be/src/ferret_be/adapters/outbound/postgresql/mappers.py::{event_to_row,event_from_row,snapshot_to_rows}`           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:integration --args='tests/integration/postgresql/test_event_round_trip.py'`  | same Phase 2 Integration regression command from `BE-I01`                                                                                                                | `FR-PG`; `evidence/phase-2/BE-I03-*` |
| `BE-I04` | AC-BE-09/10/11; event/aggregate insert and prune races | `apps/ferret-be/tests/integration/postgresql/test_cursor_watermark.py::{test_backdated_insert_excluded,test_event_prune_invalidates,test_aggregate_prune_invalidates}`                                   | `apps/ferret-be/src/ferret_be/adapters/outbound/postgresql/queries.py::{list_events,summarize_usage,summarize_outcomes}`         | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:integration --args='tests/integration/postgresql/test_cursor_watermark.py'`  | same Phase 2 Integration regression command from `BE-I01`                                                                                                                | `FR-PG`; `evidence/phase-2/BE-I04-*` |
| `BE-I05` | AC-BE-10; capability key/watermark/prune races         | `apps/ferret-be/tests/integration/postgresql/test_capability_cursor.py::{test_identical_keys_across_installations,test_later_snapshot_excluded,test_prune_invalidates}`                                  | `apps/ferret-be/src/ferret_be/adapters/outbound/postgresql/queries.py::list_capabilities`                                        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:integration --args='tests/integration/postgresql/test_capability_cursor.py'` | same Phase 2 Integration regression command from `BE-I01`                                                                                                                | `FR-PG`; `evidence/phase-2/BE-I05-*` |

### Phase 3 REST and runtime packets

Each REST packet owns the exact adapter Unit file and public-process spec below. RED runs the Unit command;
GREEN reruns it; REFACTOR runs the E2E command. The production route modules are new artifacts.

| Packet   | Acceptance/scenarios                | Unit test → production symbol                                                                                                                                                               | Unit command                                                                                                                                                                                  | E2E spec/title and regression command                                                                                                                                                                                                | Route/evidence                         |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `BE-R01` | API-LIVE-01                         | `tests/unit/adapters/inbound/rest/test_get_liveness.py::test_live_contract` → `adapters/inbound/rest/routes/health.py::get_liveness`                                                        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_get_liveness.py'`           | `apps/ferret-be-e2e/src/get-liveness.spec.ts` / `API-LIVE-01`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'API-LIVE-01'`                       | `FR-HTTP`; `evidence/phase-3/BE-R01-*` |
| `BE-R02` | API-READY-01..02                    | `tests/unit/adapters/inbound/rest/test_get_readiness.py::test_ready_contract` → `adapters/inbound/rest/routes/health.py::get_readiness`                                                     | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_get_readiness.py'`          | `apps/ferret-be-e2e/src/get-readiness.spec.ts` / `API-READY-01..02`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'API-READY-'`                  | `FR-HTTP`; `evidence/phase-3/BE-R02-*` |
| `BE-R03` | AC-BE-03/05/06/08; API-BATCH-01..07 | `tests/unit/adapters/inbound/rest/test_ingest_telemetry_batch.py::test_batch_contract` → `adapters/inbound/rest/routes/batches.py::ingest_telemetry_batch`                                  | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_ingest_telemetry_batch.py'` | `apps/ferret-be-e2e/src/ingest-telemetry-batch.spec.ts` / `API-BATCH-01..07`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'API-BATCH-'`         | `FR-HTTP`; `evidence/phase-3/BE-R03-*` |
| `BE-R04` | AC-BE-09; API-EVENTS-01..04         | `tests/unit/adapters/inbound/rest/test_list_events.py::test_event_page_contract` → `adapters/inbound/rest/routes/events.py::list_events`                                                    | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_list_events.py'`            | `apps/ferret-be-e2e/src/list-events.spec.ts` / `API-EVENTS-01..04`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'API-EVENTS-'`                  | `FR-HTTP`; `evidence/phase-3/BE-R04-*` |
| `BE-R05` | AC-BE-10; API-USAGE-01..03          | `tests/unit/adapters/inbound/rest/test_get_usage_analytics.py::test_usage_page_contract` → `adapters/inbound/rest/routes/analytics.py::get_usage_analytics`                                 | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_get_usage_analytics.py'`    | `apps/ferret-be-e2e/src/get-usage-analytics.spec.ts` / `API-USAGE-01..03`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'API-USAGE-'`            | `FR-HTTP`; `evidence/phase-3/BE-R05-*` |
| `BE-R06` | AC-BE-10; API-OUTCOMES-01..03       | `tests/unit/adapters/inbound/rest/test_get_outcome_analytics.py::test_outcome_page_contract` → `adapters/inbound/rest/routes/analytics.py::get_outcome_analytics`                           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_get_outcome_analytics.py'`  | `apps/ferret-be-e2e/src/get-outcome-analytics.spec.ts` / `API-OUTCOMES-01..03`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'API-OUTCOMES-'`    | `FR-HTTP`; `evidence/phase-3/BE-R06-*` |
| `BE-R07` | AC-BE-10; API-CAPABILITIES-01..04   | `tests/unit/adapters/inbound/rest/test_get_capabilities.py::test_capability_page_contract` → `adapters/inbound/rest/routes/capabilities.py::get_capabilities`                               | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_get_capabilities.py'`       | `apps/ferret-be-e2e/src/get-capabilities.spec.ts` / `API-CAPABILITIES-01..04`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'API-CAPABILITIES-'` | `FR-HTTP`; `evidence/phase-3/BE-R07-*` |
| `BE-R08` | AC-BE-02/08/11; local runtime       | `tests/unit/adapters/inbound/rest/test_local_runtime.py::{test_token_file,test_loopback_guard,test_prune_cli}` → `adapters/inbound/rest/{app.py,security.py}` and `ferret_be/management.py` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:test:unit --args='tests/unit/adapters/inbound/rest/test_local_runtime.py'`          | `apps/ferret-be-e2e/src/local-runtime.spec.ts` / `Local runtime`; `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be-e2e:test:e2e -- --grep 'Local runtime'`                  | `FR-HTTP`; `evidence/phase-3/BE-R08-*` |

### Phase 4 CLI synchronization packets

| Packet    | Acceptance/scenarios                                       | Exact RED test → production symbol                                                                                                                                                                                                                                     | Focused command                                                                                                                                                                | Regression command                                                                                                                                                       | Route/evidence                         |
| --------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `CLI-S01` | AC-BE-01/02/11; configuration, migration, split counters   | `apps/ferret-cli/tests/integration/test_delivery_state.py::{test_atomic_configure_capture,test_counter_migration_non_retroactive,test_state_specific_expiry}` → `apps/ferret-cli/src/ferret/adapters/sqlite.py::{migrate_delivery_state,expire_records}`               | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_delivery_state.py'` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:unit,test:integration --projects=ferret-cli` | `FR-CLI`; `evidence/phase-4/CLI-S01-*` |
| `CLI-S02` | AC-BE-03/04/06/07; lease and ACK state machine             | `apps/ferret-cli/tests/unit/test_sync_state.py::{test_lease_reclaim,test_ack_identity,test_replay_accepts_current_header_and_original_body_request_ids,test_retry_backoff}` → `apps/ferret-cli/src/ferret/application/sync.py::{lease_batch,apply_ack,schedule_retry}` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_sync_state.py'`                   | same Phase 4 CLI regression command from `CLI-S01`                                                                                                                       | `FR-CLI`; `evidence/phase-4/CLI-S02-*` |
| `CLI-S03` | AC-BE-03/07/08; stdlib transport and opportunistic trigger | `apps/ferret-cli/tests/unit/test_backend_transport.py::{test_batch_mapping,test_timeout,test_due_trigger}` → `apps/ferret-cli/src/ferret/adapters/http.py::UrllibBackendClient` and `application/sync.py::trigger_if_due`                                              | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_backend_transport.py'`            | same Phase 4 CLI regression command from `CLI-S01`                                                                                                                       | `FR-CLI`; `evidence/phase-4/CLI-S03-*` |
| `CLI-S04` | AC-BE-04/06/07; process crash/fault matrix                 | `apps/ferret-cli-e2e/tests/test_sync_crash_recovery.py::{test_commit_then_drop_replay_new_header_original_body_request_id_delivers_once,test_partial_ack,test_backend_down_capture}` → built `apps/ferret-cli/dist/ferret.pyz` plus live BE                            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_sync_crash_recovery.py'`            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:e2e,test:quick --projects=ferret-cli-e2e,ferret-be-e2e`     | `FR-CLI`; `evidence/phase-4/CLI-S04-*` |
| `CLI-S05` | AC-BE-01; standalone compatibility                         | `apps/ferret-cli-e2e/tests/test_standalone_regression.py::test_backend_absent_preserves_plan01` → no new compatibility shim; Plan 01 commands are the public contract                                                                                                  | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_standalone_regression.py'`          | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run-many -t build,test:quick,test:e2e --projects=ferret-cli,ferret-cli-e2e`  | `FR-CLI`; `evidence/phase-4/CLI-S05-*` |

## Phase-Gate and Resume Command Registry

Every `Phase N Gate` uses the one literal resume command below. Phases 1–5 store stdout/stderr/exit/HEAD at
`evidence/phase-<n>/gate.txt`; immutable Phases 6–7 store the same fields under
`local-tmp/plan-execution/ferret-init-02-local-backend/phase-<n>-gate.txt` and never write tracked evidence.
Phase 1 creates
`apps/ferret-be/scripts/verify_delivery_phase.py` and `ferret-be:verify:delivery`; the script accepts only
phases 1–7 plus an explicit evidence-output path, rejects a tracked output path for Phases 6–7, invokes the exact
packet commands and matrix declared in this document, verifies required evidence, and returns non-zero on a
missing/no-op target, unchecked required finding, stale candidate fingerprint, or failed cleanup. Unit tests at
`apps/ferret-be/tests/unit/scripts/test_verify_delivery_phase.py` pin its command map and immutable-output rule.
This is the single reproducible gate entrypoint, not a substitute for RED/GREEN/REFACTOR evidence.

| Gate | Single literal resume command                                                                                                                                                                                                          | Expected observation                                                                                                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-0  | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- ./rhino gate run --surface=pre-push`                                                                                                                         | zero exit after the explicit Phase 0 predecessor/port/dependency checks; Plan 01 remains terminal and green                                               |
| G-1  | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:verify:delivery --args='--phase=1'`                                                                                          | `ferret-contracts` lint/bundle/quick and specs pass; only named production-behavior REDs remain                                                           |
| G-2  | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ferret-be:verify:delivery --args='--phase=2'`                                                                                             | all BE-U/BE-I packets, migrations/races/hashes, coverage ≥99%, and measured storage pass                                                                  |
| G-3  | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ferret-be:verify:delivery --args='--phase=3'`                                                                                             | BE-R01..08, OpenAPI drift, M1–M7 twice from clean state, and cleanup pass                                                                                 |
| G-4  | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ferret-be:verify:delivery --args='--phase=4'`                                                                                             | CLI-S01..05, four-project matrix, cross-store reconciliation, and standalone compatibility pass                                                           |
| G-5  | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ferret-be:verify:delivery --args='--phase=5'`                                                                                             | complete matrix, M1–M7, terminal API/rules reports, candidate fingerprint, and all AET defects pass                                                       |
| G-6  | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:verify:delivery --args='--phase=6 --evidence-output=local-tmp/plan-execution/ferret-init-02-local-backend/phase-6-gate.txt'` | plan/archive indexes, links, Markdown, diff, and preliminary audit pass                                                                                   |
| G-7  | `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ferret-be:verify:delivery --args='--phase=7 --evidence-output=local-tmp/plan-execution/ferret-init-02-local-backend/phase-7-gate.txt'`    | exact local head passes pre-push and records current PR head/base Quality/leak/API checks                                                                 |
| G-8  | `rtk git worktree list --porcelain`                                                                                                                                                                                                    | run only after the exact controlled `plan-execution-checker` call below returns terminal PASS; delivered ancestry and branch/worktree inventory reconcile |

The Phase 8 controlled call is: invoke `plan-execution-checker` with
`plan-path=plans/done/<completion-date>__ferret-init-02-local-backend/` and
`delivered-ref=<reviewed-merge-sha>`. A code, schema, spec, rule, generated binding, dependency, or candidate-head
change invalidates its phase and every downstream gate.

## Mandatory Quality Matrix

After project creation, every implementation/final gate runs through HIPPO:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t build,typecheck,lint,test:quick --projects=ferret-cli,ferret-cli-e2e,ferret-be,ferret-be-e2e
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t test:integration,test:e2e,test:coverage --projects=ferret-cli,ferret-cli-e2e,ferret-be,ferret-be-e2e
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t install --projects=ferret-cli,ferret-cli-e2e,ferret-be
```

Run only applicable targets: the executor inspects each `project.json` first and records intentional omissions.
For Python projects `install` means `uv sync --locked`; it is dependency synchronization, not user executable
installation. User CLI installation remains `python apps/ferret-cli/dist/ferret.pyz self install --target user`.
The TypeScript `ferret-be-e2e` project has no project `install` target because root `npm install` owns it.
Both production owners run native Unit coverage with at least 99% line coverage. A missing/no-op/aliased target,
unrelated baseline failure, or test retry/sleep blocks progression.

## Phase 0: Predecessor, Environment, Ports, and Baseline

**Input:** delivered/terminal-audited/cleaned Plan 01 and promoted Plan 02.
**Outcome:** one execution worktree, verified predecessor contracts, available ports/resources, resolved locks,
and green baseline.
**Proof:** sanitized `evidence/phase-0/`.

- [ ] [AI] Verify Plan 01 archive, merge containment, terminal report, canonical cleanup report, installed
      artifact contract, SQLite schema, storage results, owner corpora, target topology, and harness capability
      matrix on `origin/main`. From the primary checkout, require
      `git worktree list --porcelain` to omit `worktrees/ferret-init-01-local-cli`,
      `git show-ref --verify refs/heads/ferret-init-01-local-cli` to exit 1, and
      `git ls-remote --exit-code --heads origin refs/heads/ferret-init-01-local-cli` to exit 2. Stop on an
      incomplete predecessor or amend this plan for drift.
- [ ] [AI] Provision/enter the declared worktree, record repository-relative identity/branch inventory, run
      transactional dependency convergence and Doctor, and keep unrelated/user edits untouched.
- [ ] [AI] Run and retain this exact setup/baseline packet; resolve every failure, including unrelated
      pre-existing failures, before Phase 1:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply
rtk npm run doctor
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD
rtk git diff --check
```

- [ ] [AI] Inspect current repository Python/FastAPI/PostgreSQL/Compose/Playwright precedents, ports, runner
      ownership, migration roles, secrets/env rules, API quality workflow, and generated contract conventions.
      Verify the author-time resolved ports `127.0.0.1:8601` and `127.0.0.1:5440` are available; stop and amend
      this plan on collision rather than silently choosing another wire/registry contract.
- [ ] [AI] Resolve/lock current compatible FastAPI, Uvicorn, Pydantic/settings, SQLAlchemy 2, Alembic, psycopg,
      pytest stack, PostgreSQL 18 image digest, and licenses using official sources. The contract toolchain is
      already resolved from repository precedent as Redocly bundle plus Spectral lint behind
      `ferret-contracts:{lint,bundle,test:quick}`. CLI runtime dependencies must remain empty.
- [ ] [AI] Reverify OpenAPI 3.1/FastAPI schema behavior and current GraphQL/MCP official guidance only to confirm
      deferral/adapter boundaries. Do not add GraphQL/MCP dependencies or freeze a future protocol version.
- [ ] [AI] Run the delivered Plan 01 full matrix twice plus repository pre-push/docs/spec/rules/secret baselines.
      Fix failures at root cause. Create the exact file-impact ledger and generated-source map.

### Phase 0 Gate

- [ ] [AI] Run the single G-0 command after the explicit predecessor/port/dependency checks. Confirm Plan 01
      remains green/standalone, fixed ports are free, dependencies are resolved, the local machine has benchmark
      capacity, and no open architecture/API/schema decision remains.

> **Pause Safety:** no Plan 02 code/spec/rule file changed. Safe to stop. To resume, rerun Plan 01 baseline and
> port/container inventory, then run the single G-0 resume command.

---

## Phase 1: Specs, OpenAPI, Architecture, and Projects (RED)

**Input:** AC-BE-01..12 and exact predecessor/tooling evidence.
**Outcome:** canonical CLI/BE behavior, contract-first OpenAPI, C4/hexagonal contracts, project skeletons, and
isolated RED adapters precede production code.
**Proof:** OpenAPI/spec validation, operation/scenario map, import-rule RED, and target RED in `evidence/phase-1/`.

- [ ] [AI] Execute `BE-C01` RED → GREEN → REFACTOR, including new `ferret-contracts` project, exact path/schema
      fragments, Spectral/Redocly targets, committed bundles, normalized FastAPI drift fixture, and handwritten
      CLI fixture validation. Keep tokens/bodies outside tracked evidence.
- [ ] [AI] Execute `BE-C02` RED → GREEN → REFACTOR for the dependency rule and exact framework-free package
      skeleton. Keep GraphQL/MCP packages absent.
- [ ] [AI] Execute `BE-C03` RED → GREEN → REFACTOR: copy every exact owner scenario and API scenario into its
      declared feature, create no E2E-owned corpus, and bind every scenario at required layers.
- [ ] [AI] Execute `BE-C04` RED → GREEN → REFACTOR for pinned PostgreSQL health, isolated resources,
      migration-before-readiness, loopback-only listener, cleanup, and non-Local/Test rejection.
- [ ] [AI] Execute `BE-C05` RED → GREEN → REFACTOR for the closed phase-command map and evidence/fingerprint/
      no-op-target failure policy.
- [ ] [AI] Create `ferret-be`, `ferret-be-e2e`, and `ferret-contracts` project metadata with README/LICENSE,
      uv lock, Pyright strict, Ruff, pytest/pytest-bdd/coverage, TypeScript/Playwright, exact cache inputs, and the
      `verify:delivery` target/script/unit test declared above.
- [ ] [AI] Inventory any lasting Python backend/Nx/API/harness/rules change and start a per-repository
      rules-propagation manifest. Do not edit a rule already made sufficient by Plan 01.

### Phase 1 Gate

- [ ] [AI] Run the single G-1 command. Acceptance: plan/spec validation, `ferret-contracts:{lint,bundle,
test:quick}`, project install/typecheck/lint, and BE-C01..05 evidence pass; remaining REDs name only the next
      unimplemented packet. Fix the owning packet and rerun G-1 before Phase 2.

> **Pause Safety:** no backend listener or SQLite migration is usable. Safe to stop. To resume, rerun OpenAPI
> validation and the isolated RED ledger with the single G-1 command.

---

## Phase 2: Framework-Free Core and PostgreSQL Adapter (RED → GREEN → REFACTOR)

**Input:** valid contracts and RED use-case/persistence tests.
**Outcome:** protocol-independent application/domain behavior and PostgreSQL adapter implement ingestion,
queries, analytics, capabilities, pruning, migrations, and post-commit notices.
**Proof:** ordered TDD outputs, migration matrices, query plans, and storage measurements in `evidence/phase-2/`.

### Domain and Application Use Cases

- [ ] [AI] Execute `BE-U01` RED → GREEN → REFACTOR for exact Event/CapabilitySnapshot/CapabilityEntry fields,
      per-field visibility capabilities, canonical hashes, and invariants.
- [ ] [AI] Execute `BE-U02` RED → GREEN → REFACTOR for the closed principal/scope/error policy.
- [ ] [AI] Execute `BE-U03` RED → GREEN → REFACTOR for batch ID/hash replay, stored response, item order/count,
      event/snapshot duplicate/conflict, and transaction result.
- [ ] [AI] Execute `BE-U04` RED → GREEN → REFACTOR for event keyset, watermark, and prune-epoch invalidation.
- [ ] [AI] Execute `BE-U05` RED → GREEN → REFACTOR for usage/outcome grouping, observed-duration rules,
      deterministic aggregate keysets, and prune-epoch invalidation.
- [ ] [AI] Execute `BE-U06` RED → GREEN → REFACTOR for capability installation keyset, eligible-snapshot
      watermark-before-ranking, deterministic tie-break, and prune invalidation.
- [ ] [AI] Execute `BE-U07` RED → GREEN → REFACTOR for dry-run/execute prune, epoch increment, authorization,
      commit-before-publication, rollback silence, and publisher-failure policy.

### PostgreSQL and Alembic

- [ ] [AI] Execute `BE-I01` RED → GREEN → REFACTOR for fresh/current/empty downgrade-upgrade schema and exact
      batch/item/capability/state constraints, roles, cascades, and indexes.
- [ ] [AI] Execute `BE-I02` RED → GREEN → REFACTOR for same-batch replay, different-hash conflict, concurrent
      race, stored-response reconstruction, contiguous ordinals, and count reconciliation.
- [ ] [AI] Execute `BE-I03` RED → GREEN → REFACTOR for Plan 01 fixed hashes and lossless Event/CapabilitySnapshot
      PostgreSQL round trips.
- [ ] [AI] Execute `BE-I04` RED → GREEN → REFACTOR for event/aggregate keysets, recent/backdated inserts, and
      raw/aggregate traversal invalidation across execute-prune.
- [ ] [AI] Execute `BE-I05` RED → GREEN → REFACTOR for two installations with identical logical capability keys,
      later snapshots, deterministic ranking, and execute-prune invalidation.
- [ ] [AI] Inspect compiled SQL and synthetic `EXPLAIN (ANALYZE, BUFFERS)` after the five packets; failures in
      bounds/projection/index use return to the owning BE-I packet, never to a widened timeout or blind index.

### Change Publisher and Storage

- [ ] [AI] Complete the publisher portion of `BE-U07` with no-op production and in-memory test adapters; keep
      typed notices minimal and make no outbox/pub-sub/subscription claim.
- [ ] [AI] Run deterministic 100k/1m PostgreSQL benchmarks for heap/TOAST/index/WAL, batch sizes, duplicate/
      conflict/query/prune latency, dead tuples/vacuum, and monthly projections at 5k/20k/100k events/day.
      Replace the provisional 1–2 KiB estimate with measured operational documentation and correct unjustified
      indexes/schema before proceeding.

### Phase 2 Gate

- [ ] [AI] Run the single G-2 command. Acceptance: at least 99% Unit line coverage, BE-U01..07 and BE-I01..05
      evidence, migrations/query plans/races, architecture rules, and storage reconciliation pass. Route failure
      to its packet and rerun G-2 before Phase 3.

> **Pause Safety:** core and persistence are green but no REST route or CLI sync is enabled. Safe to stop. To
> resume, run the single G-2 command; it recreates PostgreSQL and reruns the complete matrix.

---

## Phase 3: REST/OpenAPI Adapter and Local Runtime (RED → GREEN → REFACTOR)

**Input:** green application/persistence and canonical OpenAPI.
**Outcome:** loopback FastAPI implements every operation exactly, token/startup guards work, and local runner is
deterministic.
**Proof:** contract drift, Unit/Integration/E2E, manual wire, and cleanup evidence in `evidence/phase-3/`.

- [ ] [AI] Execute `BE-R01` RED → GREEN → REFACTOR for API-LIVE-01.
- [ ] [AI] Execute `BE-R02` RED → GREEN → REFACTOR for API-READY-01..02 and finite dependency checks.
- [ ] [AI] Execute `BE-R03` RED → GREEN → REFACTOR for API-BATCH-01..07, including batch-ID replay/conflict and
      exact stored response.
- [ ] [AI] Execute `BE-R04` RED → GREEN → REFACTOR for API-EVENTS-01..04 and `cursor_invalidated`.
- [ ] [AI] Execute `BE-R05` RED → GREEN → REFACTOR for API-USAGE-01..03 and aggregate prune invalidation.
- [ ] [AI] Execute `BE-R06` RED → GREEN → REFACTOR for API-OUTCOMES-01..03 and observed-duration rules.
- [ ] [AI] Execute `BE-R07` RED → GREEN → REFACTOR for API-CAPABILITIES-01..04, including `installationId`,
      watermark-before-ranking, full keyset, and prune invalidation.
- [ ] [AI] Execute `BE-R08` RED → GREEN → REFACTOR for token init, management prune, migration/start commands,
      Local/Test/loopback pre-listener guard, Compose readiness, cleanup, and safe diagnostics.
- [ ] [AI] Refactor shared Pydantic/problem/auth/cursor mapping only after BE-R01..08 pass; run their regression
      commands and architecture import test to prove no Pydantic/FastAPI/SQLAlchemy type leaks inward and no
      GraphQL/MCP/realtime dependency appears.
- [ ] [AI] Run canonical-vs-generated OpenAPI comparison and CLI fixture schema validation. Any normalized
      operation/schema/security difference returns to the contract or handler; never regenerate over the
      canonical document silently.
- [ ] [AI] Execute the API delta's literal `rtk curl` recipes for all success/failure cases using ignored
      synthetic fixtures. M1–M7 are the acceptance packets; their setup, response assertions, persistence
      assertions, and cleanup are mandatory. Never save a token or raw request body as evidence.

### Phase 3 Gate

- [ ] [AI] Run the single G-3 command. Acceptance: BE-R01..08, exact OpenAPI drift, M1–M7, and clean-stack
      cleanup pass twice; readiness follows migration/token/DB state, non-Local/non-loopback rejects before
      listening, and no resource remains. Route failure to the owning packet and rerun G-3 before Phase 4.

> **Pause Safety:** a complete local REST backend works, but the CLI remains disabled/standalone. Safe to stop.
> To resume, run the single G-3 command.

---

## Phase 4: CLI Durable Synchronization (RED → GREEN → REFACTOR)

**Input:** delivered Plan 01 CLI schema and green REST batch operation.
**Outcome:** optional config, additive SQLite migration, leasing/backoff/manual/opportunistic sync, and all crash
paths preserve the 30-day local boundary.
**Proof:** no-loss reconciliation, fault matrix, built CLI-to-BE E2E, and standalone regression in
`evidence/phase-4/`.

- [ ] [AI] Execute `CLI-S01` RED → GREEN → REFACTOR for additive SQLite migration, atomic
      enable/reconfigure/capture, live-lease refusal, delivery revisions, and non-retroactive counter split:
      `expired_local_total` only for `local`; `expired_before_ack_total` only for `pending`/`leased`/`rejected`.
- [ ] [AI] Execute `CLI-S02` RED → GREEN → REFACTOR for bounded prefix leasing, reclaim, ACK identity/cardinality,
      the current response-header/original replay-body request-ID split, state transitions,
      Retry-After/backoff/jitter, 401 automatic disable, and permanent rejection.
- [ ] [AI] Execute `CLI-S03` RED → GREEN → REFACTOR for the stdlib `urllib` mapper, OpenAPI fixture validation,
      ten-second deadline, batch-ID/hash semantics, five-minute due acquisition, detached attempt, and no token
      in argv/log/config/evidence.
- [ ] [AI] Execute `CLI-S04` RED → GREEN → REFACTOR for two processes, refusal/timeout/429/503, malformed/partial
      ACK, stale lease, process death, commit-then-drop replay with a new header request ID and the stored
      original body request ID marking the lease delivered exactly once, duplicate replay, and 30-day expiry.
- [ ] [AI] Execute `CLI-S05` RED → GREEN → REFACTOR with backend absent, disabled, down, and unauthorized; all
      Plan 01 commands/retention/privacy remain compatible except declared sync fields. No daemon/loop appears.

### Phase 4 Gate

- [ ] [AI] Run the single G-4 command. Acceptance: both owners meet 99% Unit line coverage, CLI-S01..05 pass,
      cross-store reconciliation proves no lost accepted record or duplicate PostgreSQL row within the 30-day
      limitation, and standalone behavior remains green. Route failure to its packet and rerun G-4.

> **Pause Safety:** complete optional synchronization is green and defaults disabled. Safe to stop. To resume,
> run the single G-4 command.

---

## Phase 5: Rules, Documentation, API Quality, and Full Verification

**Input:** complete implementation/contracts and rule-impact manifest.
**Outcome:** lasting rules are propagated, C4/docs agree, every API/behavior passes automated and exploratory
proof, and GraphQL/MCP remain genuinely deferred.
**Proof:** rules manifest, API Quality Gate, Rule-16 retest, storage report, and reconciled matrix in
`evidence/phase-5/`.

### Automatic Rule-Impact Coverage

- [ ] [AI] **Exact packet:** create
      `local-tmp/rules-propagation/rules-propagation__<run-id>__manifest.md` covering only
      `repo-governance/development/infra/nx-targets/mandatory-targets-cli-e2e.md`,
      `repo-governance/development/infra/nx-targets/mandatory-targets-behaviour-coverage.md`,
      `repo-governance/development/infra/nx-targets/tag-convention-current-tags-and-examples.md`,
      `repo-governance/workflows/infra/development-environment-setup/phase-6-python-ecosystem.md`,
      `repo-config.yml`, and `scripts/behaviour-coverage.mjs` plus its test. Mark
      a path no-edit with inspected evidence when Plan 01 already suffices. GraphQL and MCP surfaces are
      excluded.
- [ ] [AI] **Inventory:** enumerate every changed rule/enforcement surface across governance, instruction files,
      canonical/generated skills, `repo-config.yml`, CI/hooks, scripts, setup/style guides, API/schema rules, and
      project tags. Separate declarations from product enforcement.
- [ ] [AI] **Conflict/precedence:** compare Python backend/mixed E2E/local API/port/migration behavior against
      repository hierarchy and Plan 01 rules. Resolve at the narrow owner; stop on contradiction.
- [ ] [AI] **Placement/eviction:** add only missing durable rules; remove/redirect duplicates and stale "no Python
      apps" statements. Do not make this product plan the permanent rule owner.
- [ ] [AI] **Canonical/enforcement edits:** update exact Nx/Python/API/port/setup declarations and validators
      with failing-before/passing-after tests. If Plan 01 support is sufficient, record no-edit evidence.
- [ ] [AI] **Enforcement dispositions:** map every normative change to an automated gate, an already-required
      named human review surface, or justified intentional non-enforcement.
- [ ] [AI] **Bindings/generation:** hand-edit canonical sources only, run official generators for any affected
      binding, inspect generated diffs, and verify harness/catalog parity. No GraphQL/MCP binding is added.
- [ ] [AI] **Verification/manifest:** run the structure/content/link/rule/BDD/project/API validation commands
      declared by this delivery and record every frozen input, manifest row, finding, fix, and final status.
      Do not invoke `rules-quality-gate`; it requires a separate user-named invocation or an authorized
      rules-grooming Step 8 and is not authorized by this product plan.
- [ ] [AI] **Sibling obligation:** record cloud deployment as a separately authorized future `ose-private` plan;
      make no private-repository mutation or parity claim.

### Documentation, Manual, and Exploratory Proof

- [ ] [AI] Update C4, README/setup, runner, token rotation/redaction, migration, sync/retry/expiry, query recipes,
      prune/recovery, storage measurements, and protocol-extension ADR. State that no GraphQL/MCP adapter,
      subscription durability, or cloud security exists.
- [ ] [AI] Update non-normative product registry `docs/reference/web-sites.md` with HTTP 8601/PostgreSQL 5440 and
      validate its links/table separately; do not add it to the rules-propagation manifest.
- [ ] [AI] Run the full four-project matrix, OpenAPI drift, specs/Gherkin implementation, schema/migration,
      Markdown/link, license, secret/absolute-path, rules/binding, project graph, and clean-stack gates.
- [ ] [AI] Execute every API delta manual recipe and management command from fresh state; verify all responses,
      row/ACK counts, auth/privacy, cursors/aggregates, dry-run/execute prune, storage results, and cleanup.
- [ ] [AI] Follow
      `repo-governance/workflows/plan/plan-execution/finalization-rule16-api-retest.md` and invoke
      `api-exploratory-tester`. First create the current fingerprint with the exact safe command
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-be:candidate:fingerprint --args='--output=local-tmp/ferret-api/candidate.json'`; the target records current
      40-character HEAD, OpenAPI SHA-256, Alembic head, running image ID, and base URL without a token. Then use
      this exact tester packet:

```yaml
scope:
  base-url: http://127.0.0.1:8601
  contract: specs/apps/ferret/be/contracts/openapi.yaml
  behaviours: specs/apps/ferret/be/behaviours/
  operations: all-seven
  faults: batch-replay,cursor-prune,auth,sqlite-sync
output-mode: delivery
plan-path: plans/in-progress/ferret-init-02-local-backend/
quality-gate-phase: discovery
candidate-fingerprint-file: local-tmp/ferret-api/candidate.json
```

- [ ] [AI] Require the tester to append every defect as
      `- [ ] AET-###: <defect> — api-exploratory-tester; fix before archival` and every proposal as
      `- [ ] SG-###: <proposal> — api-exploratory-tester; triage before archival` under the exact
      `Rule-16 API exploratory-test retest follow-ups` heading at the end of this delivery checklist. Create one
      native harness task per checkbox. Fix every AET defect at root cause, run its scoped packet and affected
      gate, tick it only through task/checklist atomic sync, rebuild/restart, recompute all five candidate
      fingerprint values, and rerun the tester in verification mode. A defect may be deferred only with explicit
      user permission and evidence that fixing it is genuinely impossible; SG proposals may be deferred only
      with written rationale. Any unchecked AET, stale fingerprint, `final-status != pass`, or
      `lifecycle-status != verified` blocks Phase 6.
- [ ] [AI] Classify UI/browser design/usability verification not applicable because no frontend/browser route
      exists. If the diff contradicts this, stop and amend before review.

### Phase 5 Gate

- [ ] [AI] Run the single G-5 command after the exact Rule-16 call and this plan's rules-propagation verification
      packet. Require a complete rules manifest with every row dispositioned, terminal current-candidate API
      evidence, every AET fixed/ticked, M1–M7, AC-BE-01..12, every API scenario,
      bindings/Markdown/links/rules/C4/file impact, and all non-goals to pass before Phase 6.

> **Pause Safety:** local backend/sync behavior is complete and reproducible. Safe to stop. To resume, rerun the
> single G-5 command; if it reports a stale API candidate, recompute the fingerprint and rerun the exact Rule-16
> packet first.

---

## Phase 6: Knowledge Capture, Preliminary Audit, and Archival Commit

**Input:** complete implementation, manual/API evidence, reconciled rules, and learnings.
**Outcome:** knowledge dispositions and preliminary audit pass; archive/index move is committed before final
review.
**Proof:** audit matrix, resolved completion date, archive diff, and authorized commit SHA.

- [ ] [AI] Convert every learning in top-level `learnings.md` into a disposition row with `Learning`,
      `Reusable?`, `Destination`, `Action`, `Evidence`, and `Status`. Choose exactly one: promote to the narrow
      durable owner, link to an existing owner, retain as plan-specific, or report out-of-scope. Never promote
      secrets, absolute paths, raw telemetry, or generated evidence. Record a dated `reviewed; none` row if
      empty and rerun affected gates after any promotion.
- [ ] [AI] Before promotion, pass sensitivity, repository-relevance, destination-type, and authorization/
      overlap gates. Code/test learnings return to their owning delivery phase, never inline docs. Search durable
      docs and `plans/ideas/`; creating an idea requires literal user authorization. Terminal statuses are only
      `promoted`, `linked`, `retained-plan-specific`, `reported-without-plan-authorization`, or
      `reviewed-none`; any `open` row blocks archival.
- [ ] [AI] Build `evidence/preliminary-delivery-audit.md` tracing AC-BE-01..12, all API scenarios, OpenAPI drift,
      schema/migrations/reconciliation, sync crash/replay, auth/privacy, queries, pruning/storage, architecture,
      rules, reviews, rollback, non-goals, and cleanup. Reopen earliest unsupported phase.
- [ ] [AI] Reconcile the Phase 0 file ledger against `rtk git status --short`. After explicit commit
      authorization, stage exactly the implementation, contract, migration, spec, rule/binding, sanitized
      evidence, and still-in-progress plan paths; exclude every done-plan/index move. Require the cached
      name-status to equal the ledger and `rtk git diff --cached --check` to pass, then commit
      `feat(ferret): add local telemetry backend`. Require clean status.
- [ ] [AI] While the plan remains at `plans/in-progress/ferret-init-02-local-backend/`, record exact
      `candidate-sha=$(rtk git rev-parse HEAD)` and `candidate-tree=$(rtk git rev-parse 'HEAD^{tree}')` rows in
      `local-tmp/plan-execution/ferret-init-02-local-backend/candidate.txt`. Make one independent
      `plan-execution-checker` Agent call with this literal resolved input:

```text
Validate completed implementation for plan-path=plans/in-progress/ferret-init-02-local-backend/ at candidate-ref=<candidate-sha> and candidate-tree=<candidate-tree>.
Check every BRD outcome, PRD AC-BE-01..12, delivery checkbox and evidence path, API scenario, OpenAPI contract/drift proof, migrations and recovery, CLI sync compatibility, Rule-16 API retest, rules manifest, privacy/retention/storage proof, and file ledger.
Write the normal report under local-tmp/plan-execution/. Return Status Complete and Total Findings 0 only when no required proof is missing.
```

Replace placeholders with literals. Require exactly one `**Status**: Complete` and one
`**Total Findings**: 0` row in the resolved report, then prove HEAD/tree still equal the recorded values and
status is clean. Record report path/hash/prompt/dispositions only in the external candidate file. A finding or
identity drift returns to the earliest owner, creates a new authorized implementation commit, and requires a
fresh checker call.

- [ ] [AI] Only after that immutable candidate passes, resolve `<completion-date>` with `rtk date +%F`, move the
      whole plan to `plans/done/<completion-date>__ferret-init-02-local-backend/`, update only the in-progress/
      done indexes and active links targeting the moved plan, and ensure no duplicate backlog/in-progress folder
      remains. Save all post-checker commands/outputs only in the external candidate file; never mutate tracked
      evidence or plan content.
- [ ] [AI] Validate the moved plan, links, Markdown, Mermaid, full rename/index diff, generated provenance, and
      `rtk git diff --check`. Then stage only the lifecycle rename/index/link delta, require its cached inventory
      to contain no product/spec/rule/evidence content change, and commit
      `docs(plan): archive ferret local backend delivery`. Record exact `archive-sha=$(rtk git rev-parse HEAD)`
      externally and require `rtk git rev-parse 'HEAD^'` to equal the checked candidate SHA. Any other delta
      invalidates the checker and requires restoring the in-progress lifecycle and a fresh candidate/checker.

### Phase 6 Gate

- [ ] [AI] Run the single G-6 command with its output explicitly directed to the external Phase 6 gate path.
      Confirm HEAD equals the recorded archive SHA, its sole parent equals the checked candidate SHA, the diff
      between them contains only the audited plan rename/index/link delta, and the working tree is clean. Confirm
      the parent contains implementation, contracts/migrations/evidence, learning dispositions, and preliminary
      PASS while HEAD adds only the complete archive/index move.

> **Pause Safety:** complete delivery and archive are committed locally but not merged. Safe to stop. To resume,
> run the single G-6 command.

---

## Phase 7: Exact-Head Quality, PR Readiness, and Merge

**Input:** immutable archive-containing delivery HEAD.
**Outcome:** exact head passes all required local/CI/leak/API gates and is squash-merged under the repository's
default `[AI]` authority; the merge commit and done archive are contained on `origin/main`.
**Proof:** gate/check IDs, current 40-character head/base, review dispositions, PR URL, merge SHA/time, and
containment.

- [ ] [AI] Run registry pre-push via HIPPO, mandatory four-project matrix, Unit 99% proof, affected targets,
      OpenAPI/spec/schema/migration/API/rules/binding/docs/secret gates, and clean-stack cleanup. Any repair
      restores the plan to `plans/in-progress/`, returns to the earliest owning phase, creates a fresh authorized
      implementation candidate, repeats the independent zero-finding checker, and recreates the archive-only
      commit before restarting Phase 7; no post-checker substantive repair may remain under the archived plan.
      The pre-push command is
      `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- ./rhino gate run --surface=pre-push`.
- [ ] [AI] Inspect `origin/main...HEAD`, diff-check/status, lock/licenses, generated provenance, migration and
      rollback paths, archive state, and absence of GraphQL/MCP/frontend/cloud artifacts.
- [ ] [AI] After explicit authorization, push and open/update draft PR; record exact head/base. Poll CI every two
      minutes without `gh run watch`, fixing root causes only.
- [ ] [AI] Require exact-head/base Quality gate, applicable API/E2E/schema/migration/rules finite gates, and one
      clean authenticated current-head `pr-leak-review`. Semantic review is required only when the repository
      workflow or user requests it. All API exploratory fixes must be retested against this head.
- [ ] [AI] After every hardened proof names the same current head/base and the archive is in the PR, mark the
      draft ready, recheck all five hardened merge preconditions, and squash-merge without requesting branch
      deletion. Record `FERRET_REVIEWED_HEAD`, `FERRET_MERGE_SHA`, `mergedAt`, and the PR URL externally. A
      human merge gate or external blocker may produce a ready-unmerged handoff only when explicitly selected;
      it is paused/incomplete, never terminal completion.
- [ ] [AI] Fetch `origin/main`, prove the PR's historical `headRefOid` still equals
      `FERRET_REVIEWED_HEAD`, prove `FERRET_MERGE_SHA` is an ancestor of `origin/main`, and prove the archived
      Plan 02 `delivery.md` exists in that merge. Never test reviewed-head ancestry after a squash merge.

### Phase 7 Gate

- [ ] [AI] Run the single G-7 command and verify the PR head/base and required checks are current, then require
      the merged PR, nonempty squash merge SHA, `origin/main` merge containment, and done-plan path. Keep the
      worktree until mandatory Phase 8 completes.

> **Pause Safety:** the archive is merged and merge containment is proven; the worktree remains for terminal
> audit. To resume, run the single G-7 command.

---

## Phase 8: Mandatory Post-Merge Terminal Audit and Cleanup

**Input:** confirmed merged head.
**Outcome:** terminal audit passes; worktree/branch cleanup follows.
**Proof:** final report, ancestry, terminal verdict, branch classification, and removal/prune output.

- [ ] [AI] Fetch `origin`, verify reviewed-head/merge ancestry and delivered app/spec/contract/migration/archive
      state. Any mismatch reopens Phase 7.
- [ ] [AI] Continue the already-calling top-level plan-execution workflow at its terminal completeness step; do
      not recursively invoke it. Call `plan-execution-checker` with the archived plan path,
      `delivered-ref=$FERRET_MERGE_SHA`, and `reviewed-pr-head=$FERRET_REVIEWED_HEAD`; require `Status: Complete`,
      `Total Findings: 0`, and the calling workflow's external `final-status: pass` report before cleanup.
- [ ] [AI] Execute `repo-governance/workflows/dev-artifact-clean-up.md` as the mandatory terminal workflow with
      the Plan 02 worktree/branch/reviewed head/merge SHA. Classify every plan-created branch and every Docker,
      PostgreSQL, coverage, build, or evidence artifact by positive session ownership; active/ambiguous entries
      block cleanup, and user SQLite/PostgreSQL data is never deleted.
- [ ] [AI] For a live remote delivery branch, fetch without pruning, prove local and remote tips both equal
      `FERRET_REVIEWED_HEAD`, set that verified upstream, remove the worktree non-force, use ordinary
      `git branch -d`, then delete only that exact remote. For an already deleted remote after squash, allow
      `git branch -D` only with all four canonical proofs: local tip equals reviewed head, merge SHA is contained
      in `origin/main`, repository `delete_branch_on_merge` was enabled, and the exact branch has a
      `HEAD_REF_DELETED_EVENT` at or after `mergedAt`. Retain/escalate on any mismatch.
- [ ] [AI] Prune worktrees, fast-forward the clean primary `main`, inspect the full incoming diff, and require
      the worktree plus local/remote branch absent and
      `git rev-list --left-right --count HEAD...origin/main` equal `0 0`.
- [ ] [AI] Publish final execution report with containment, terminal PASS, cleanup, measured storage, and explicit
      deferral of GraphQL/MCP adapters/dashboard and cloud deployment to separately authorized plans.

### Phase 8 Gate

- [ ] [AI] After the controlled audit and calling workflow return terminal PASS, run the single G-8 command and
      confirm no unexplained retained branch, canonical cleanup complete, local main divergence `0 0`, and
      `origin/main` still contains the reviewed archive.

> **Pause Safety:** delivery, audit, archival, and cleanup are complete. No repository mutation remains. To
> recheck inventory, run the single G-8 command.

## Rule-16 API exploratory-test retest follow-ups

`api-exploratory-tester` appends `AET-###` defects and `SG-###` proposals below this heading using the exact
unchecked formats declared in Phase 5. An empty section before the tester runs is expected; any unchecked AET
after the run blocks archival.
