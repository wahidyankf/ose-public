# Decisions, Sources, and File Impact

## Decision Summary

| ID        | Decision                                                         | Consequence and revisit trigger                                                                                                                  |
| --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| FND-DD-01 | Deliver foundation separately before credentials                 | More PRs, but a safe inert seam; revisit only if the repository cannot represent disabled deployables                                            |
| FND-DD-02 | Four projects: C# backend/E2E and Next.js web/E2E                | Establishes final topology now; revisit before Plan 02 if repository generators make this invalid                                                |
| FND-DD-03 | PostgreSQL with separate migration/runtime roles                 | Adds local setup; mandatory prerequisite for later credential and RLS safety                                                                     |
| FND-DD-04 | Process instances stateless                                      | Shared storage required; sticky affinity/local correctness state remains forbidden                                                               |
| FND-DD-05 | Local/Test only, fail closed elsewhere                           | Remove only in a production plan blocked on the named private K3s plan and current handoff gates                                                 |
| FND-DD-06 | Root MIT covers OSE source/docs; third parties retain licenses   | Preserve repository distribution model and exact dependency notices                                                                              |
| FND-DD-07 | Readiness-driven owned runner                                    | More lifecycle code; prevents flaky sleeps and resource leakage                                                                                  |
| FND-DD-08 | Pragmatic hexagonal DDD backend with transport-neutral use cases | Plan 01 REST health and Plan 04 OIDC use inbound adapters; future GraphQL/MCP adapters reuse policy and domain logic without speculative runtime |
| FND-DD-09 | SqlKata + Npgsql is the OSE runtime persistence path             | Explicit SQL/mapping/tests are required; EF stays migration-time and Plan 04 supplies custom OpenIddict stores                                   |

## Alternatives and Prior Art

The existing OSE ID source plan selected ASP.NET Core 10/C# 14, Next.js, PostgreSQL, Nx ownership, and
local-only operation. This slice preserves those decisions while moving credential features later.

- Keycloak remains the strongest fallback if later protocol/security work proves unbounded; it does not
  improve the value of this C# foundation slice enough to justify changing direction now.
- SQLite/in-memory persistence is rejected because it cannot exercise PostgreSQL roles, migration
  compatibility, or future RLS.
- Docker Compose alone may remain an implementation detail, but Nx owns the developer interface so
  dependency order, evidence, and cleanup integrate with repository targets.
- Kubernetes manifests are deferred until the private sibling
  `plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` plus then-current platform handoff
  gates are complete and a public OSE ID production plan defines environment contracts.

## Backend Architecture Trade-offs

The selected form is a **modular monolith with pragmatic hexagonal boundaries and DDD for real identity
invariants**. It keeps one deployable and one operational lifecycle while preventing ASP.NET/REST,
OpenIddict, SqlKata/Npgsql, migration-time EF, Google, and email concerns from becoming the account/tenant
policy itself. REST and
OIDC are the only delivered inbound protocols; future GraphQL or Model Context Protocol support is an
adapter decision, not a rewrite of use cases.

| Option                                                                                                                               | Benefits                                                                                                                                                                 | Costs/risks                                                                                                                                           | Disposition and revisit trigger                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Selected modular monolith + pragmatic hexagonal DDD                                                                                  | One deployable; central security invariants; testable use cases; future inbound adapters reuse authorization, tenant, transaction, idempotency, privacy, and audit logic | More mapping and dependency discipline than controller-to-EF code; architectural tests and clear module ownership required                            | Keep through Init 01–09. Revisit module extraction only with independently deployable ownership, scale, compliance, or failure-isolation evidence |
| Thin ASP.NET endpoints over EF/Identity/OpenIddict                                                                                   | Fastest first endpoint and fewer types                                                                                                                                   | Couples policy to HTTP/framework/entity shapes; makes GraphQL/MCP a parallel security path; encourages direct cross-tenant query exposure             | Rejected for CIAM. Identity hashing/validation primitives do not authorize framework-owned runtime persistence                                    |
| Full Clean Architecture template with one assembly per ring, mediator/CQRS, generic repositories, event bus, and separate read store | Strong physical seams and many extension points                                                                                                                          | High ceremony, indirection, speculative abstractions, duplicated persistence concepts, and harder transactional reasoning before real consumers exist | Rejected now. Add only the smallest abstraction justified by an implemented use case and measured change pressure                                 |
| Identity microservices split by account/tenant/factor/protocol                                                                       | Independent deployment and theoretical scaling                                                                                                                           | Distributed transactions, duplicated policy, larger key/audit/availability surface, and premature operations burden                                   | Rejected. Revisit only when bounded contexts have independent teams/SLOs and a proven transactional split                                         |
| GraphQL or MCP directly over persistence/framework services                                                                          | Minimal adapter code and flexible data access                                                                                                                            | Bypasses use-case authorization, RLS setup, privacy filtering, replay/idempotency, and audit; exposes unstable entities                               | Forbidden. Future transports call application ports and receive transport-specific projections only                                               |

GraphQL becomes worth planning when real consumers need composable projections that REST/BFF contracts
cannot provide without material over-fetching or endpoint proliferation. MCP becomes worth planning when a
concrete agent workflow, authenticated principal/audience model, allowlisted tool surface, confirmation
policy, and prompt-injection/privacy controls exist. Neither is justified merely as a future possibility.

SqlKata is selected for SQL visibility, predictable explicit projections, and no hidden change tracking
or lazy loading—not because a query builder automatically makes SQL faster. Its string table/column
identifiers have weaker compile-time schema safety than a typed ORM. Centralized code-owned identifier
allowlists, no `SELECT *`, exact compiled-SQL snapshots, live-catalog Integration tests, and synthetic
`EXPLAIN` index/row budgets mitigate that tradeoff. The EF migration assembly remains tooling, not the
runtime persistence model.

## Source Record

All sources were accessed on **2026-09-15**. Quoted supporting excerpts stay below 25 words per source; Phase 0 re-verifies exact resolved versions.

| Confidence   | Supported claim                                                                                    | Supporting excerpt                                                                                   | Official URL                                                                                                                                                                                                 | Access date |
| ------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| [Verified]   | ASP.NET Core is the selected C# web host                                                           | “ASP.NET Core is a cross-platform, high-performance, open-source framework”                          | [ASP.NET Core overview](https://learn.microsoft.com/en-us/aspnet/core/overview)                                                                                                                              | 2026-09-15  |
| [Verified]   | EF migrations incrementally evolve schema, independently of runtime access                         | “Migrations provide a way to incrementally update the database schema”                               | [EF Core migrations overview](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)                                                                                                        | 2026-09-15  |
| [Verified]   | SqlKata compiles parameterized SQL and its execution package supports Npgsql                       | Query values are parameterized; `SqlKata.Execution` accepts an Npgsql connection                     | [SqlKata documentation](https://sqlkata.com/docs), [execution setup](https://sqlkata.com/docs/execution/setup)                                                                                               | 2026-09-15  |
| [Verified]   | Npgsql parameters protect data values while identifiers remain code-owned                          | PostgreSQL positional parameters are supported; parameters cannot represent table or column names    | [Npgsql basic usage](https://www.npgsql.org/doc/basic-usage.html)                                                                                                                                            | 2026-09-15  |
| [Verified]   | OpenIddict permits custom stores and exposes replacement registration seams                        | Custom stores are supported and replaceable through the core builder                                 | [OpenIddict introduction](https://documentation.openiddict.com/introduction), [OpenIddict core builder](https://github.com/openiddict/openiddict-core/blob/dev/src/OpenIddict.Core/OpenIddictCoreBuilder.cs) | 2026-09-15  |
| [Verified]   | SqlKata is compatible with the repository MIT distribution model                                   | The project is licensed under MIT                                                                    | [SqlKata license](https://github.com/sqlkata/querybuilder/blob/master/LICENSE)                                                                                                                               | 2026-09-15  |
| [Verified]   | Npgsql's permissive license can accompany MIT-distributed OSE code with its notice retained        | Its license permits use, modification, and distribution subject to retaining notices                 | [Npgsql license](https://github.com/npgsql/npgsql/blob/main/LICENSE)                                                                                                                                         | 2026-09-15  |
| [Verified]   | OpenIddict's Apache-2.0 packages can accompany MIT-distributed OSE code with their notice retained | The package declares `Apache-2.0`                                                                    | [OpenIddict package license](https://github.com/openiddict/openiddict-core/blob/dev/Directory.Build.props)                                                                                                   | 2026-09-15  |
| [Verified]   | PostgreSQL roles separate runtime and migration privilege                                          | “A database role can have a number of attributes that define its privileges”                         | [PostgreSQL role attributes](https://www.postgresql.org/docs/current/role-attributes.html)                                                                                                                   | 2026-09-15  |
| [Verified]   | ASP.NET Core source uses MIT terms                                                                 | “The MIT License (MIT)”                                                                              | [ASP.NET Core license](https://github.com/dotnet/aspnetcore/blob/main/LICENSE.txt)                                                                                                                           | 2026-09-15  |
| [Unverified] | Exact generator output, target names, and port availability remain current                         | Execution must inspect the live checkout; no external source can prove repository-local availability | [Nx project configuration](https://nx.dev/reference/project-configuration)                                                                                                                                   | 2026-09-15  |

Repository evidence was also accessed on 2026-09-15: `repo-config.yml` declares machine-readable
project/gate facts; `docs/reference/web-sites.md` is the port registry; the project dependency graph and
Nx-target/test-boundary conventions bind ownership. These are [Verified] repository facts at authoring
HEAD but must be re-read after syncing `origin/main`.

MIT compatibility does not relicense dependencies. Phase 0 records the exact resolved SqlKata,
`SqlKata.Execution`, Npgsql, OpenIddict, EF tooling, and transitive-package license/notice closure; an
incompatible or unresolved obligation stops implementation.

Confidence is high for the selected boundaries, licenses, and PostgreSQL/EF principles. Exact package
versions, generated file names, and whether reserved local defaults remain free stay [Unverified] until
Phase 0 records live evidence; a conflict stops implementation and amends the plan.

## File-Impact Analysis

```text
.
├── plans/
│   ├── backlog/
│   │   ├── ose-id-init-01-foundation/ [D] — removed by the pre-execution pure lifecycle move
│   │   └── README.md [E] — remove backlog entry during that pure move
│   ├── in-progress/
│   │   ├── ose-id-init-01-foundation/ [D] — moved into done inside the delivering implementation PR
│   │   └── README.md [E] — add at promotion, remove in the delivering PR
│   └── done/
│       ├── <completion-date>__ose-id-init-01-foundation/ [N] — exact moved plan, learnings, and evidence
│       └── README.md [E] — add resolved completion-date entry in the delivering PR
├── apps/
│   ├── README.md [E] — index four projects
│   ├── ose-id-be/ [N] — ASP.NET Core host with domain/application/inbound/outbound boundaries, Unit tests, migration assembly, README, safe env example
│   ├── ose-id-be-e2e/ [N] — PostgreSQL roles/lifecycle, built API, migration, and multi-instance E2E
│   ├── ose-id-web/ [N] — Next.js status shell, Unit/component tests, README, safe env example
│   └── ose-id-web-e2e/ [N] — Playwright status-shell and outer-stack lifecycle E2E
├── specs/apps/ose/
│   ├── README.md [E] — index the two deployed-surface owners
│   ├── id-be/
│   │   ├── README.md [N] — backend owner index
│   │   ├── behaviours/foundation/*.feature [N] — AC-FND backend foundation scenarios
│   │   ├── behaviours/persistence/database-audit-and-soft-delete.feature [N] — durable audit/soft-delete behaviour
│   │   ├── contracts/openapi.yaml [N] — health/readiness contract
│   │   ├── architecture.md [N] — canonical as-built C4 zoom-level index (enforced owner-corpus shape)
│   │   └── architecture/*.md [N] — backend/database/local-stack C4 detail views
│   └── id-web/
│       ├── README.md [N] — web owner index
│       ├── behaviours/foundation/*.feature [N] — AC-FND web scenarios
│       ├── architecture.md [N] — canonical as-built C4 zoom-level index (enforced owner-corpus shape)
│       └── architecture/*.md [N] — web/status-shell C4 detail views
├── package.json [E] — exact project scripts and dependencies
├── package-lock.json [G] — npm-generated lock resolution for package.json
├── nx.json [E] — exact verified project/default relationships
├── repo-config.yml [E] — project tags, boundaries, ports, behavior adapters, and test ownership
├── docs/reference/
│   ├── monorepo-structure.md [E] — four project purposes
│   └── web-sites.md [E] — fixed 3500, 8501, and 5438 local reservations
└── docs/reference/project-dependency-graph.md [E] — exact project edges
```

### More Detail

The wildcard patterns are bounded to one named owner and artifact kind; no repository-wide generated
placeholder exists. Nx/project generators may create files only inside the four explicitly named new app
directories. `package-lock.json` is the only known root generated file. A newly discovered path or rule
surface requires file-ledger amendment before editing. This tree excludes account/company/protocol/
provider behavior, production manifests/workflows/secrets, LMS files, and sibling plan folders.

Within `apps/ose-id-be/`, Phase 0 maps the logical Domain, Application, inbound-adapter,
outbound-adapter, and Host/composition rings from
[the backend architecture](./001-system-boundaries-and-project-topology.md#backend-architecture-pragmatic-hexagonal-ddd)
to the nearest current C# layout. Record the selected namespace/project mapping before scaffolding and
enforce inward dependencies. Do not create empty GraphQL/MCP projects, packages, schemas, or adapters.
