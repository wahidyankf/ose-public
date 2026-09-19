# Decisions, Sources, and File Impact

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

Evidence labels are plan-wide: `[Judgment call]` marks an approved design or new artifact, `[Repo-grounded]`
marks inspected repository fact, `[Web-cited]` marks an authoritative external publication, and `[Unverified]`
marks a claim requiring delivery-time proof. External sources were accessed 2026-09-18. Unless a narrower label
overrides it, every FERRET path/symbol/target below is `[Judgment call — new artifact]`; every named existing
repository precedent is `[Repo-grounded]`.

Repository prior art inspected before this draft: `apps/rhino-cli` and `apps/crane-cli` for CLI/Nx packaging;
existing dedicated `*-e2e` projects for owner/E2E separation; `repo-governance/development/infra/nx-targets/`
for target naming; `scripts/behaviour-coverage.mjs` for static BDD coverage; and
`docs/reference/web-sites.md` for local port registration. These patterns are precedent, not proof that Python
FastAPI support already exists.

| Decision                | Repository evidence inspected                                                                   | What it establishes                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| D1 REST/OpenAPI         | `specs/apps/ose/be/contracts/openapi.yaml`; `specs/apps/organiclever/be/contracts/openapi.yaml` | checked-in owner contracts are established; FERRET still owns its v1 schema                     |
| D2 ports/adapters       | `specs/apps/ose/be/architecture.md`; `specs/apps/organiclever/be/architecture.md`               | app architecture ownership exists; FERRET's Python dependency rule is a new judgment            |
| D3 realtime deferral    | no FERRET consumer/dashboard found by targeted `apps/`, `libs/`, and `specs/` search            | no current subscription requirement exists                                                      |
| D4 MCP deferral         | `docs/reference/platform-bindings.md`; `repo-config.yml` harness catalog                        | harness adapters are governed, but no FERRET MCP contract exists                                |
| D5 delivery/idempotency | Plan 01 SQLite contract; `apps/ose-be/docker-compose.integration.yml`                           | local persistence and real backend Integration precedents exist; cross-store atomicity does not |
| D6 token/loopback       | `repo-governance/conventions/security/secrets-and-env-standards.md`; backend Compose files      | secrets stay untracked and local fixtures use explicit configuration                            |
| D7 explicit prune       | no FERRET/backend retention owner found; Plan 01's requested local boundary                     | backend retention is separately unowned, so automatic deletion is not inferred                  |
| D8 no daemon            | Plan 01 hook deadline; `apps/rhino-cli`; `apps/crane-cli`                                       | short-lived CLI flows exist; no per-user service installer precedent was found                  |
| D9 resumable gate       | plan phase-gate convention; no existing FERRET project/target                                   | one tested project-local dispatcher is needed to make every phase resume command executable     |

## Material Decisions

### D1 — REST/OpenAPI for synchronization and scripting

**Selected [Judgment call — user-approved]:** contract-first OpenAPI 3.1 REST adapter.

- Need: a stdlib Python CLI needs simple bounded batch request/response and local scripts need stable raw/
  aggregate access.
- Alternative 1: GraphQL first. It offers flexible dashboard queries but complicates ingestion, errors, and
  client dependencies before a dashboard exists.
- Alternative 2: MCP first. It integrates agent hosts but tool invocation is not a reliable automatic lifecycle
  delivery channel and its primitives are not a batch telemetry contract.
- Consequence: REST remains the automatic ingestion interface; later protocols are peers over the same core.
  Revisit only if a consumer proves a missing capability, not merely to offer protocol variety.

`[Web-cited]` OpenAPI defines a language-agnostic HTTP interface description, matching the need for a
shared contract without generated runtime coupling:
[OpenAPI 3.1 specification](https://spec.openapis.org/oas/v3.1.0) (the specification defines the standard,
language-agnostic description for HTTP APIs).

### D2 — Hexagonal ports and adapters

**Selected [Judgment call — user-approved]:** framework-free domain/application packages, inbound protocol adapters, outbound persistence and
change ports.

- Need: user-approved future REST, GraphQL, and MCP surfaces must share behavior without handler reuse.
- Alternative 1: conventional FastAPI routes calling SQLAlchemy services. It is smaller initially but exposes
  framework/storage types as the reusable boundary.
- Alternative 2: separate services per protocol. It isolates protocols but duplicates policy, analytics,
  persistence, migration, and local operations.
- Consequence: explicit mapping and architecture tests are mandatory. Revisit if the core becomes trivial
  enough that the abstraction has no second-adapter value; adding GraphQL/MCP is itself that value test.

### D3 — Defer GraphQL subscriptions

**Selected [Judgment call]:** no GraphQL endpoint; provide post-commit change port and no-op adapter.

- Need: a future dashboard may want realtime updates, but no UI/frequency/latency requirement exists now.
- Alternative 1: implement Strawberry queries/subscriptions immediately. It prepares a dashboard but adds SDL,
  long-lived transport, auth, reconnect, race, and pub/sub work with no current consumer.
- Alternative 2: omit every realtime seam. It is minimal now but risks publishing directly from handlers later.
- Consequence: future subscriptions attach at the change port but must add a durable outbox/pub-sub if delivery
  guarantees are needed. Revisit when a dashboard demonstrates frequent incremental updates where polling is
  inadequate.

`[Web-cited]` Official GraphQL guidance identifies subscriptions as long-lived and commonly backed by
pub/sub: [GraphQL subscriptions](https://graphql.org/learn/subscriptions/). The reconnect/scaling consequence is
this plan's engineering judgment, not a quotation.

### D4 — Defer MCP while preserving an adapter seam

**Selected [Judgment call — user-approved]:** no MCP SDK/endpoint; future tools/resources call application ports.

- Need: MCP may make analytics available to agents, but automatic telemetry cannot depend on voluntary tool use.
- Alternative 1: expose ingestion/query tools now. It broadens access but creates a second contract/auth/test
  matrix before core REST behavior is proven.
- Alternative 2: treat MCP as JSON-over-REST. It avoids an SDK but violates MCP capability negotiation,
  JSON-RPC, tools/resources, and transport semantics.
- Consequence: future plan selects then-current spec/version and stdio/Streamable HTTP. Revisit when one
  supported harness has a concrete MCP consumer workflow.

`[Web-cited]` [MCP July 2026 release](https://blog.modelcontextprotocol.io/posts/2026-07-28/) describes a
stateless protocol core with capabilities around it. The future plan must verify the then-current normative
specification; this release post is evidence for direction, not a pinned wire contract.

### D5 — At-least-once delivery plus server idempotency

**Selected [Judgment call]:** durable SQLite leases and per-record idempotent ACK.

- Need: no transaction can atomically span SQLite and PostgreSQL/HTTP.
- Alternative 1: delete locally before send (at-most-once). It avoids duplicates but loses events on failure.
- Alternative 2: distributed/exactly-once transaction. It is unavailable across these stores and would add
  disproportionate infrastructure.
- Consequence: duplicate requests are normal and must be cheap/correct. Revisit only if the transport/store
  boundary changes to one transactional system.

### D6 — Local bearer token and loopback guard

**Selected [Judgment call]:** 256-bit token file, constant-time comparison, loopback Local/Test only.

- Need: local APIs still expose behavioral metadata and must not be unauthenticated to arbitrary processes or a
  misbound network interface.
- Alternative 1: no authentication on loopback. It is simpler but any local process can read/write.
- Alternative 2: full OAuth/OIDC. It supports remote/multi-user access but belongs to cloud deployment/security
  planning.
- Consequence: token rotation is restart/reconfigure; token never enters tracked config/logs/evidence. Revisit in
  the private cloud plan.

### D7 — PostgreSQL retention only by explicit prune

**Selected [Judgment call]:** unlimited age until dry-run + explicit execute.

- Need: backend is the durable history and its capacity policy is not yet known.
- Alternative 1: inherit 30 days. It defeats backend history.
- Alternative 2: automatic fixed long retention. It guesses product/storage policy before measured use.
- Consequence: operators must monitor measured growth and prune intentionally. Revisit with cloud cost/privacy
  requirements.

### D8 — Opportunistic and manual synchronization, no daemon

**Selected [Judgment call — user-approved]:** `ferret sync --once` plus one detached attempt when capture observes that the five-minute interval
is due.

- Need: recent events should move without requiring an always-running client process, while capture remains
  independent of network work.
- Alternative 1: permanent per-user daemon/service. It provides predictable scheduling but adds OS-specific
  installation, lifecycle, upgrade, resource, and recovery behavior before the backend is deployed.
- Alternative 2: manual synchronization only. It is simplest but silently leaves data local unless the user
  remembers to run it.
- Consequence: sync timing is best effort when no harness activity occurs; users run `sync --once` for immediate
  delivery. Revisit when cloud deployment demonstrates a need for an explicitly installed scheduler.

### D9 — One tested delivery-verification dispatcher

**Selected [Judgment call]:** `ferret-be:verify:delivery --args='--phase=N'` delegates only to the exact
project/contract/manual commands declared in `delivery.md` and verifies their evidence.

- Need: the phase-gate rule requires one copyable resume command per phase, while this delivery spans Python,
  TypeScript, OpenAPI, PostgreSQL, manual wire packets, and workflow reports; no current repository target owns
  that FERRET combination.
- Alternative 1: repeat multi-command prose at every pause. It is not one executable resume command and is easy
  to resume partially.
- Alternative 2: add seven shell scripts. It multiplies untested orchestration and platform quoting surfaces.
- Consequence: the dispatcher has a closed phase map, no secret handling, and Unit tests for commands/evidence/
  no-op failure. It remains useful after delivery as reproducible release verification; revisit and simplify it
  when canonical Nx targets can express external evidence predicates without a project script.

## Dependencies and Licenses

- **[Unverified]** Backend runtime: Python 3.14, FastAPI, Uvicorn, Pydantic/settings, SQLAlchemy 2, Alembic, psycopg, PostgreSQL
  driver dependencies resolved and locked by `uv`.
- Backend development: pytest, pytest-bdd, coverage.py, Pyright, Ruff, contract/schema validator.
- E2E: repository-standard TypeScript/Playwright API stack.
- **[Unverified]** Local infrastructure: PostgreSQL 18 container pinned by immutable image digest
  after Phase 0 verification.
- CLI runtime remains standard-library only.

Phase 0 resolves compatible current versions, checks official docs/changelogs and licenses, and commits locks.
OSE-authored code/docs inherit root MIT; every third party retains its license/notices.

## File-Impact Analysis

```text
.
├── apps/
│   ├── ferret-cli/ [E] — backend config, SQLite delivery migration, lease/backoff/sync, tests, docs
│   ├── ferret-cli-e2e/ [E] — standalone regression plus sync crash/outage process scenarios
│   ├── ferret-be/ [N] — domain/application ports, FastAPI REST, SQLAlchemy/Alembic, management CLI, tests
│   └── ferret-be-e2e/ [N] — TypeScript/Playwright API E2E adapter and local-stack fixtures
├── specs/apps/ferret/
│   ├── overview.md [E] — local backend and future-protocol boundaries
│   ├── cli/
│   │   ├── README.md [E] — new sync adapter ownership
│   │   ├── architecture.md [E] — CLI-to-BE container relationship
│   │   └── behaviours/**/*.feature [E] — backend config/sync/standalone regressions
│   └── be/
│       ├── README.md [N] — backend logical owner and adapter ownership
│       ├── architecture.md [N] — C4 plus hexagonal dependency direction
│       ├── contracts/project.json [N] — `ferret-contracts` Nx lint/bundle/quick targets
│       ├── contracts/.spectral.yaml [N] — local OpenAPI lint policy extending repository precedent
│       ├── contracts/openapi.yaml [N] — canonical OpenAPI 3.1 REST contract and component refs
│       ├── contracts/paths/*.yaml [N] — seven operation path fragments
│       ├── contracts/schemas/*.yaml [N] — event, capability, batch, query, cursor, health, and problem schemas
│       ├── contracts/generated/openapi-bundled.{yaml,json} [N] — committed generated bundles matching existing owners
│       ├── contracts/generated/README.md [N] — generated ownership/provenance
│       └── behaviours/**/*.feature [N] — ingestion/query/auth/prune/architecture corpus
├── infra/dev/ferret/ [N] — local PostgreSQL Compose, pinned image, health/cleanup contract
├── docs/reference/web-sites.md [E] — local BE/PostgreSQL port registry
├── docs/reference/monorepo-structure.md [E] — only if Python FastAPI/E2E topology needs clarification
├── repo-governance/
│   ├── development/infra/nx-targets/mandatory-targets-cli-e2e.md [E?] — only if mixed CLI/E2E text is insufficient
│   ├── development/infra/nx-targets/mandatory-targets-behaviour-coverage.md [E?] — only if Python BE is absent
│   ├── development/infra/nx-targets/tag-convention-current-tags-and-examples.md [E?] — only if BE/E2E tags are absent
│   └── workflows/infra/development-environment-setup/phase-6-python-ecosystem.md [E] — backend dependencies
├── scripts/
│   ├── behaviour-coverage.mjs [E] — backend pytest-bdd adapter recognition if Plan 01 support is insufficient
│   └── behaviour-coverage.test.mjs [E] — backend owner/E2E regression fixtures
├── repo-config.yml [E] — project tags, port/ownership/gate inventory
└── plans/
    ├── in-progress/ferret-init-02-local-backend/** [E→D] — execution evidence then lifecycle move
    ├── done/<completion-date>__ferret-init-02-local-backend/** [N] — archived plan and evidence
    ├── in-progress/README.md [E] — active-plan index
    └── done/README.md [E] — completion index
```

### More Detail

The wildcard paths above denote an enumerated family of new artifacts, not an unresolved owner/target decision.
Before editing, Phase 0 confirms the delivered Plan 01 paths still match this inventory.
If Plan 01 already added sufficient Python/BDD governance, mark proposed rule/script edits not applicable with
evidence instead of touching them. The backend core and REST adapter remain in one deployable app; hexagonal
packages are module boundaries, not separate deployables/libraries.

The exact normative rule-propagation inventory is limited to the three named Nx documents above, Python
ecosystem setup, `repo-config.yml`, `scripts/behaviour-coverage.mjs` and its tests, and any directly linked
generated binding whose canonical source actually changes. `docs/reference/web-sites.md` is a non-normative
product-reference registry update: it remains in file impact and documentation verification, but stays outside
the propagation manifest. Project-local inputs own the new projects. Execution creates
`local-tmp/rules-propagation/rules-propagation__<run-id>__manifest.md`, records declaration/enforcement/mirror/
test disposition for each normative sentence, and runs `npm run generate:bindings` only if a canonical binding
source changes. This product plan does not invoke `rules-quality-gate`; that workflow remains available only
through a separate user-named invocation or an authorized rules-grooming Step 8.

No GraphQL/MCP file, dependency, endpoint, schema, or generated client belongs in this tree. A future plan adds
an adapter under the backend only after updating its own contract/spec/test/rule surfaces.

## Rollback Boundary

Disable CLI backend sync first, stop the local stack, and preserve SQLite/PostgreSQL data. Revert REST/backend/
runner code and specs in a reviewed PR. Do not contract SQLite delivery columns or delete the PostgreSQL volume
automatically. Reverting one adapter never changes domain event meaning. A future protocol adapter must be
removable without modifying core/persistence contracts.
