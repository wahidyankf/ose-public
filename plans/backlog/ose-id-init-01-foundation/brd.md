# Business Requirements — OSE ID Init 01 Local Foundation

## Business Goal

Establish a trustworthy, reusable local platform boundary for OSE identity work before any credential
or authorization behavior is written. Later identity slices should build on one registered project
layout, one database lifecycle, one health contract, and one local execution model.

## Problem

Implementing email login, providers, or tenancy directly would force each feature to invent ports,
process ownership, database startup, migration execution, runtime-mode checks, and cleanup. Those
choices are difficult to change after credential data exists. A foundation-only delivery reduces that
risk while remaining safe to merge because it contains no enabled identity behavior.

## Business Outcomes

1. Maintainers can start and stop OSE ID locally through one documented command without guessing
   process order, ports, readiness, or cleanup.
2. The repository recognizes all four OSE ID projects, their dependencies, and their test boundaries.
3. Future slices inherit a PostgreSQL schema and migration contract proven from an empty checkout.
4. A staging/production configuration cannot accidentally expose the unfinished service.
5. Backend and web replicas can be restarted or alternated without correctness loss because instances
   hold no durable identity state.
6. OSE-authored source/docs inherit the repository root MIT license, while dependency-license evidence
   preserves each third-party component's own terms.
7. Later slices inherit one explicit, inspectable SQL runtime path rather than coupling identity rules to
   an ORM entity model.
8. Every database record remains attributable and investigable through a universal six-column audit
   envelope, soft-delete, and retained security audit events; no application lifecycle erases rows.

## Affected Roles

| Role                  | Need in this slice                                                                   |
| --------------------- | ------------------------------------------------------------------------------------ |
| Repository maintainer | Predictable Nx projects, targets, ports, and documentation.                          |
| Backend engineer      | A C# host, persistence boundary, migration path, and diagnostics.                    |
| Web engineer          | A standard Next.js shell that does not invent authentication behavior.               |
| Test engineer         | Owned local resources, bounded readiness, deterministic cleanup, and evidence paths. |
| Security reviewer     | Proof that non-local startup fails closed and no identity endpoint exists.           |
| Later plan executor   | Stable contracts for plans 02 and 03 to consume rather than duplicate.               |

## Success Measures

- All four projects build, typecheck, lint, test, and appear in the Nx graph with intended tags and dependency edges.
- A clean local run starts PostgreSQL, migrates the OSE ID schema, starts backend and web, reaches
  readiness without sleeps, and cleans every owned process/container twice consecutively.
- Backend liveness remains available during a database outage while readiness becomes non-successful
  with a stable machine-readable reason; readiness recovers after PostgreSQL returns.
- A migration role can apply schema changes while the application role cannot create, alter, or bypass
  schema objects.
- Every OSE ID table contains `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, and
  `deleted_by`; catalog and behavior proof show that hard delete is unavailable and a soft-deleted
  record remains auditable but unusable.
- Staging/production-mode startup exits non-zero before binding a public listener and names the absent
  production plan/configuration without printing secrets.
- A two-backend-instance test alternates health and database-backed diagnostic requests without affinity.
- Repository and dependency notices accurately preserve the MIT license and identify any differently
  licensed dependencies.
- Each source-owner Unit target enforces at least 99% Unit line coverage for authored production code, and static BDD
  validation proves every Gherkin scenario has Unit, Integration, and E2E bindings or an exact valid
  scenario/adapter exemption.

## Options and Tradeoffs

| Option                                | Benefits                                                                                      | Costs and risks                                                                                     | Decision                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Foundation-only delivery              | Small, reviewable seam; safe main state; later work inherits verified contracts               | Delays user-visible login and requires disciplined follow-up                                        | **Chosen**                                                                   |
| Build foundation with email login     | Earlier visible behavior                                                                      | Mixes platform failures with security-sensitive credential work and enlarges rollback               | Rejected for this slice                                                      |
| Adopt Keycloak immediately            | Faster mature protocol surface                                                                | Adds JVM/runtime customization and diverges from requested C# ownership                             | Rejected; checkpoint remains available later                                 |
| Build directly for Kubernetes         | Exercises production topology earlier                                                         | Blocked by the private cluster plan and introduces premature deployment choices                     | Deferred                                                                     |
| SqlKata + Npgsql for OSE runtime data | Explicit PostgreSQL SQL, projections, binding, and transaction ownership without ORM tracking | More deliberate mapping and query-contract tests than LINQ-to-entities                              | **Chosen**                                                                   |
| EF Core for runtime data              | Familiar unit-of-work and LINQ experience                                                     | Hides SQL shape and OpenIddict's stock stores physically delete rows during delete/prune operations | Rejected; retain only migration tooling and implement custom protocol stores |

## Risks and Mitigations

| Risk                                           | Consequence                                                          | Mitigation or stop condition                                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Scaffold becomes speculative framework         | Later work fights unused abstractions                                | Add only ports required by health, persistence, runtime guard, and runner; delete unused template code                            |
| Readiness is mistaken for liveness             | Orchestrators restart healthy processes during dependency outages    | Separate endpoints and write outage/recovery E2E before implementation                                                            |
| Local runner leaks resources                   | Ports and databases contaminate later tests                          | Unique run IDs, explicit ownership labels, trap/finally cleanup, and post-run inventory assertion                                 |
| Application role is overprivileged             | Later tenant controls can be bypassed                                | Separate migration/runtime credentials and privilege-negative E2E                                                                 |
| “Stateless” is interpreted as no database      | Critical state moves to unsafe local memory                          | Define statelessness only for process instances; PostgreSQL remains authoritative                                                 |
| License assumption is wrong                    | Distribution obligations are missed                                  | Resolve exact versions and licenses in Phase 0; stop on incompatible terms                                                        |
| Query shape or plan regresses                  | Identity paths scan too many rows or exceed request deadlines        | Explicit projections, compiled-SQL contracts, synthetic `EXPLAIN` evidence, and per-query row budgets                             |
| A mutation or cleanup erases identity evidence | Security incidents and authorization changes cannot be reconstructed | Universal audit columns, retained security events, `ON DELETE RESTRICT`, no runtime delete privilege, and hard-delete guard tests |

## Business Non-Goals

- Delivering an end-user identity experience.
- Claiming production readiness, high availability, regulatory compliance, or zero operating cost.
- Selecting production email, secrets, Kubernetes, database, telemetry, or incident platforms.
- Starting a deploy plan before the private sibling
  `plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` and then-current platform handoff
  gates have completed.
