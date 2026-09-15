# Current State, Prior Art, and Technical Decisions

## Current OSE State

### `ose-public`

[Repo-grounded] `rtk nx show projects` currently returns 28 projects: 10 behavior-owning
applications/tools, 11 dedicated E2E harnesses, five libraries with `project.json`, and two inferred
contract projects. The 26 explicit project files already expose the base unit/integration/E2E target
names, but none exposes per-adapter behavior-compliance targets.

[Repo-grounded] Recursive inspection finds 211 `.feature` files across 10 owner families:

| Canonical family root          | Feature files |
| ------------------------------ | ------------: |
| `specs/apps/ayokoding`         |            46 |
| `specs/apps/crane`             |            12 |
| `specs/apps/organiclever`      |            26 |
| `specs/apps/ose`               |            24 |
| `specs/apps/rhino`             |            69 |
| `specs/apps/wahidyankf`        |             9 |
| `specs/libs/fsharp-crane-core` |             1 |
| `specs/libs/ts-env-loader`     |             2 |
| `specs/libs/web-ui`            |            21 |
| `specs/libs/web-ui-token`      |             1 |

[Repo-grounded] OSE's existing
[Three-Level Testing Standard](../../../../repo-governance/development/quality/three-level-testing-standard.md)
already gives unit, integration, and E2E different runtime boundaries and keeps integration/E2E out
of `test:quick`. Its current structural `specs:behavior:coverage` target, however, proves shared step
availability rather than a complete owner × adapter matrix.

[Repo-grounded] Direct project roots contain 20 local `package.json` files: six web applications,
11 dedicated E2E projects, and three TypeScript libraries. The manifests range from real package
identity/dependency declarations to E2E script/dependency containers; whether each is a required
direct boundary is not currently recorded. Test locations likewise vary, including project-root
tests, `src/tests/**`, and dedicated E2E source trees.

### The private sibling

[Repo-grounded] `rtk nx show projects --json` currently returns three projects: `rhino-cli`, `ts-ui`,
and `ts-ui-tokens`; `rhino-cli-fsharp` is absent. Recursive inspection finds 76 feature files. The
two TypeScript libraries have direct local `package.json` files; Rhino tests and specs use their own
current layouts. Execution re-inventories current `origin/main` because the independent Rhino
rewrite may change which implementation project remains.

[Repo-grounded] `apps/rhino-cli` is governed as a byte-identical shared surface across the two
repositories. Testing/DDD/spec changes to that subtree must reconcile both repositories rather than
landing a public-only variant.

[Repo-grounded] Earlier plans established the current foundation:

- `plans/done/2026-04-22__testing-standardization/`
- `plans/done/2026-04-22__spec-coverage-full-enforcement/`
- `plans/done/2026-05-03__organiclever-rhino-cli-ddd-enforcement/`

This plan evolves those contracts prospectively; it does not rewrite archived plans.

## Useful BeaverNest Prior Art

[Web-cited] BeaverNest's
[BDD contract](https://github.com/wahidyankf/beaver-nest/blob/main/repo-governance/development/behaviour-driven-development.md)
requires applications, libraries, executable tools, and dedicated E2E harnesses to share a canonical
recursive corpus according to role. It separates unit, local integration, and public-boundary E2E;
requires exact per-adapter coverage and explicit exemptions; and keeps runtime integration/E2E out
of quick while running static behavior compliance there. Accessed 2026-08-30; excerpt: “Dedicated
E2E harnesses implement their owning application's corpus, not an independent specification.”

[Web-cited] Its project files demonstrate that the contract can be attached to different stacks
without one test runner. Each source below was accessed 2026-08-30:

- [Web-cited] [Elixir application](https://github.com/wahidyankf/beaver-nest/blob/main/apps/bnest-app/project.json)
  — accessed 2026-08-30; excerpt: `"test:unit"`, `"test:integration"`, and
  `"test:coverage:behaviour"`.
- [Web-cited] [F# executable tool](https://github.com/wahidyankf/beaver-nest/blob/main/apps/badakmini-cli/project.json)
  — accessed 2026-08-30; excerpt: `/p:Threshold=99 /p:ThresholdType=line`.
- [Web-cited] [Go executable tool](https://github.com/wahidyankf/beaver-nest/blob/main/apps/resource-guard/project.json)
  — accessed 2026-08-30; excerpt: `./tests/unit`, `./tests/integration`, and
  `./tests/e2e/run.sh`.
- [Web-cited] [Exempt behavior runner](https://github.com/wahidyankf/beaver-nest/blob/main/libs/ex-bdd/project.json)
  — accessed 2026-08-30; excerpt: targets include `test:unit` and `test:coverage`, but no
  behavior-coverage target.

[Judgment call] The portable idea is the contract and target composition, not BeaverNest's exact
commands, British spelling, project set, or runner implementation.

## Decision 1: Target Vocabulary and Responsibility

### Selected — preserve structural specs coverage and add adapter behavior targets

[Judgment call] Keep `specs:behavior:coverage` as the fast, language-neutral specification
integrity gate. Add:

- `test:behavior:coverage:unit`
- `test:behavior:coverage:integration`
- `test:behavior:coverage:e2e`
- `test:behavior:coverage` as the profile-aware aggregate

Runtime behavior remains under `test:unit`, `test:integration`, and `test:e2e`. `test:coverage`
continues to mean code coverage, avoiding a breaking semantic rename.

### Alternative A — copy BeaverNest's `test:coverage:behaviour:*` names

Viable because it has working prior art and puts related targets together. Rejected because OSE
already uses American `behavior`, already reserves `test:coverage` for code coverage, and would make
the same word mean structural and code coverage.

### Alternative B — expand only `specs:behavior:coverage`

Viable because it minimizes target count. Rejected because a single aggregate cannot show which
adapter is missing, cannot express a delegated E2E harness cleanly, and blurs specification
integrity with adapter completeness.

[Repo-grounded] Current native line thresholds are heterogeneous: project commands and runner
configs contain 70, 74, 75, 80, 82, 86, 88, 90, and 95 percent floors, while at least one library
uses an echo placeholder instead of numeric collection. Threshold sources can also disagree between
`project.json` and Vitest configuration.

### Alternative C — keep current targets

Viable for zero migration cost. Rejected because “bound somewhere” is weaker than “covered in every
applicable adapter,” the central requested outcome.

**Consequences:** More explicit targets and registry metadata; clearer failure ownership.

**Revisit trigger:** A repository-wide Nx target ADR replaces the coverage vocabulary while
preserving per-adapter proof.

## Decision 2: Registry-Driven Project Profiles

### Selected — one normalized manifest consumed by Rhino and Nx wiring

[Judgment call] Add the exact `testing.schema`, `testing.coverage`, and `testing.projects` roots in
`repo-config.yml` defined by the
[Registry Schema and Migration Contract](./gherkin-coverage-and-adapter-design.md#registry-schema-and-migration-contract).
Each project declares its profile, migration state, stable behavior ID, behavior lifecycle
(`bootstrap` or `active`), behavior owner, corpus roots, and exact unit/integration/E2E
dispositions. During migration, a typed compatibility map preserves immutable legacy values while
mapping them to current canonical owner/behavior/runtime identities; owner deliveries update the
canonical row and mapping atomically when paths move. Rhino validates both. Project targets pass
only the project/adapter identity, not duplicate corpus lists. A companion file or alternate key
spelling is not allowed.

### Alternative A — infer everything from file layout

Viable for conventional web app/E2E pairs. Rejected because CLIs, inferred contract projects,
multi-surface sites, and libraries with conditional integration boundaries cannot be classified
reliably from names alone.

### Alternative B — duplicate metadata in every `project.json`

Viable because configuration sits next to commands. Rejected because behavior ownership spans an
application and its E2E harness, so duplicate roots and applicability dispositions can drift.

### Alternative C — hard-code project rules in Rhino

Viable for the current finite project set. Rejected because every new project would require a CLI
release instead of a declarative registry edit.

**Consequences:** One new governed manifest and validation command; project files stay thin.

**Revisit trigger:** Nx gains an equivalent typed project-metadata mechanism that can be queried
without duplicating ownership.

## Decision 3: Static Compliance Versus Runtime Execution

### Selected — static all-adapter proof in quick, runtime boundary tests in full/scheduled gates

[Judgment call] `test:quick` runs typecheck, lint, unit runtime, code coverage, specs integrity, and
static adapter coverage. `test`/scheduled workflows add integration and E2E runtime. Static adapter
coverage validates manifests, feature/scenario/step enumeration, drivers, bindings, and exact counts;
it does not claim the production boundary executed.

### Alternative A — run every runtime layer in quick

Viable for small deterministic projects. Rejected repository-wide because browser, process, and
local-resource suites violate the current quick-gate latency and isolation contract.

### Alternative B — keep all adapter compliance out of quick

Viable for minimal pre-push work. Rejected because stale or missing bindings would reach scheduled
CI even though they can be detected statically.

### Alternative C — unit-only behavior compliance

Viable when unit is the dominant layer. Rejected because it cannot prove the requested integration
and E2E separation or detect a corpus that the public-boundary adapter silently ignores.

**Consequences:** Quick remains deterministic; full gates remain the runtime source of truth.

**Revisit trigger:** Measured runtime evidence supports moving an individual deterministic adapter
into quick without expanding the repository-wide default.

## Decision 4: DDD Engineering-Surface Retirement

### Selected — remove engineering enforcement and documentation, preserve code and education

[Judgment call] As explicitly directed by the user, delete DDD registries/specs, Rhino DDD/domain-coverage behavior and
implementation, project targets, configuration allowlists, and prescriptive engineering docs or
sections. Preserve production application code, generic architecture guidance not dependent on the
retired model, archived plans, and AyoKoding educational content.

### Alternative A — disable only CI gates

Viable and highly reversible. Rejected because stale normative docs and commands would continue to
present an immature contract as supported.

### Alternative B — remove all DDD references including education and production naming

Viable as a clean reset. Rejected because it exceeds the user's engineering-surface scope, destroys
useful educational material, and risks product behavior churn.

### Alternative C — retain current DDD enforcement

Viable for zero work and continuity. Rejected by the explicit maintainer decision to pause the
concept until it is more mature.

**Consequences:** DDD commands and specs cease to exist; links and indexes must be reconciled.
Archived records remain historical, not current guidance.

**Revisit trigger:** A new authorized plan follows an approved DDD concept/ADR that defines
terminology, boundaries, ownership, adoption profiles, migration, and deterministic enforcement.

## Decision 5: Specs and C4 Structure

### Selected — logical corpus entry with OSE-native naming

[Judgment call] As explicitly directed by the user, migrate to
`specs/apps/<product>/<surface>/{README.md,architecture.md,behaviors/}` and
`specs/libs/<library>/{README.md,architecture.md,behaviors/}`. Keep product grouping, use OSE's
American-English `behaviors`, retain applicable contracts beside their owning surface, and allow
`architecture/` companions only when one file no longer serves its readers.

### Alternative A — preserve OSE's five-folder C4 tree

Viable because it contains useful outside-in material and already has validators. Rejected because
one logical surface is spread across product/system-context/container/component/behavior paths,
which complicates ownership, test-corpus attachment, and same-change reconciliation.

### Alternative B — copy BeaverNest paths and `behaviours` spelling exactly

Viable because the sibling demonstrates the shape. Rejected as blind copying: OSE already standardizes
American `behavior`, has product families with multiple logical surfaces, and owns API contracts
that must remain close to the relevant surface.

### Alternative C — one flat folder per Nx project

Viable for direct project mapping. Rejected because dedicated E2E projects must share—not duplicate—
their owner's corpus and architecture, while multi-surface sites need one logical owner across
frontend/backend E2E harnesses.

**Consequences:** Many spec paths move, indexes and project links change, and validators need a new
map contract. Useful as-built C4 content is consolidated rather than discarded.

**Revisit trigger:** An architecture entry becomes illegible or generates repeated unrelated merge
conflicts; split only that entry into mapped `architecture/` companions.

## Decision 6: Enforced Numeric Coverage Floor

### Selected — 99% line coverage for every governed numeric slice

[Judgment call] As explicitly directed by the user, set the repository floor to 99% lines. A layered project may
have `test:coverage:unit` and `test:coverage:integration`; each numeric slice independently meets the
floor. `test:coverage` aggregates every applicable numeric slice. Dedicated E2E harnesses without an
owned production-code denominator declare numeric coverage inapplicable and remain subject to full
behavior coverage.

[Web-cited] BeaverNest is supporting prior art, not the decision authority: its
[F# project target](https://github.com/wahidyankf/beaver-nest/blob/main/apps/badakmini-cli/project.json)
was accessed 2026-08-30; excerpt: `/p:Threshold=99 /p:ThresholdType=line`.

### Alternative A — keep project-tiered 70–95% thresholds

Viable because it reflects current runner economics and minimizes migration work. Rejected by the
explicit 99% requirement and because inconsistent floors make the same Nx target mean different
quality contracts.

### Alternative B — require 100% line coverage

Viable as the strongest simple numeric rule. Rejected because BeaverNest demonstrates 99% as a
strict floor that leaves a narrow allowance for instrumentation artifacts without normalizing broad
exclusions.

### Alternative C — require 99% for lines, branches, functions, and statements

Viable for Vitest projects. Rejected as the common repository contract because F#/Coverlet and
other runners do not expose identical metrics; it would create false cross-language equivalence.
Projects may enforce stronger metrics in addition to the 99% line floor.

**Consequences:** Significant tests must be added before each threshold rises; migration cannot be a
single config-only PR. Coverage exclusions become governed records with alternate proof.

**Revisit trigger:** A literally authorized testing ADR supplies measured cross-runner evidence and
an equally strong replacement; schedule pressure or one difficult project is not a trigger.

## Decision 7: Exact Gherkin/BDD Coverage

### Selected — 100% by exact count for every applicable adapter

[Judgment call] As explicitly directed by the user, every canonical feature, expanded scenario
example, scenario, and step must be present in every applicable owner-adapter pair. The validator
compares integer covered/total counts and requires equality; a displayed rounded percentage is not
the gate. Once an adapter is applicable to a corpus, no feature-, scenario-, or step-level exemption
can reduce its denominator.

Whole-layer inapplicability remains valid only when the project profile proves the runtime boundary
does not exist. A multi-surface owner may define disjoint, named corpus partitions before coverage
calculation, but every partition must have an owner and every adapter applicable to that partition
must cover 100% of it.

### Alternative A — allow adapter-specific step exemptions

Viable and present in BeaverNest's more flexible contract. Rejected because one exemption would
make an applicable adapter less than completely covered and would weaken the user's zero-gap rule.

### Alternative B — require only one automated adapter per scenario

Viable as a broad BDD automation metric. Rejected because it cannot prove the requested
unit/integration/E2E separation and permits an owner to omit an applicable boundary silently.

### Alternative C — require a rounded 100% report

Viable for dashboards. Rejected because rounding can hide one missing item in a large corpus.

**Consequences:** Existing partial adapters must become complete or their whole-layer applicability
must be corrected with boundary evidence before migration.

**Revisit trigger:** A new approved testing ADR provides a mechanically stronger zero-gap proof.

## Decision 8: Physical Test-Layer Layout

### Selected — non-overlapping roots under every project

[Judgment call] As explicitly directed by the user, executable tests use `tests/unit/`,
`tests/integration/`, and `tests/e2e/`, adapting the useful physical separation demonstrated by
BeaverNest. A dedicated E2E Nx project puts its suite in its own `tests/e2e/`; the application does
not duplicate that suite. Layer-neutral fixtures, support, and generated artifacts may use named
non-executable siblings under `tests/`, but runner discovery must exclude them as standalone tests.

[Web-cited] BeaverNest supports the physical-layout precedent: its
[Go project](https://github.com/wahidyankf/beaver-nest/blob/main/apps/resource-guard/project.json)
was accessed 2026-08-30; excerpt: `./tests/unit`, `./tests/integration`, and `./tests/e2e/run.sh`.

### Alternative A — keep tests beside production source

Viable for component locality. Rejected because current mixed conventions make layer ownership
hard to scan and easier for runner globs to overlap.

### Alternative B — central repository-wide test trees

Viable for uniform discovery. Rejected because it separates tests from Nx ownership and increases
cross-project coupling.

### Alternative C — distinguish layers by filename only

Viable with strict runner patterns. Rejected because it is less readable for junior engineers and
does not provide BeaverNest's clear physical seam.

**Consequences:** Imports, runner includes, coverage configuration, Nx inputs/outputs, IDE settings,
and Gherkin drivers must move atomically per project family.

**Revisit trigger:** A language tool cannot support these roots and an approved equivalent proves
the same one-layer ownership and discoverability.

## Decision 9: Project-Local Package Manifest Ownership

### Selected — retain only proven direct package/tool boundaries

[Judgment call] As explicitly directed by the user, every direct `apps/*/package.json` and
`libs/*/package.json` is audited. If no publishing/package-resolution, deployment/build-tool,
workspace dependency, or other direct consumer requires it, migrate its commands and relevant Nx
metadata into `project.json`, move dependencies to the narrowest valid retained workspace manifest,
update the lockfile, and delete it. Never retain or create a manifest merely to forward a command to
Nx or to proxy one `project.json` target through an npm script.

### Alternative A — retain every workspace manifest

Viable because npm workspaces already discover them. Rejected because it preserves duplicate task
ownership even when no package boundary exists.

### Alternative B — delete every project-local manifest

Viable as the simplest shape. Rejected because Next/Vercel, package-name resolution, exports,
peer-dependency contracts, or project-local dependency boundaries may be direct consumers.

### Alternative C — keep thin proxy manifests

Viable as a compatibility bridge. Rejected explicitly: it creates two command entry points and
allows them to drift.

**Consequences:** The execution inventory must name a direct consumer for every retained manifest;
removals update root/workspace dependencies and verify install, build, test, and applicable deploy
configuration.

**Revisit trigger:** A concrete direct consumer appears that cannot read Nx metadata or a retained
workspace manifest.

## Decision 10: Multi-Repository Enforcement and Propagation

### Selected — one plan, independent per-repository proof, paired shared outcomes

[Judgment call] As explicitly directed by the user, this plan governs both `ose-public` and
the private sibling. The plan remains single-sourced in public, while execution provisions one matching
worktree per repository and creates separate branches/PRs/gate evidence. Shared Rhino and common
governance contracts are delivered as paired outcomes; repository-specific projects retain their
own owner matrices.

Every new or changed testing/specs/C4/coverage/layout/manifest enforcement subject runs that
repository's rules-propagation workflow. Its manifest must classify and reconcile normative prose,
`AGENTS.md`/harness instructions, `repo-config.yml`, Rhino or other enforcement code, Nx project
targets, hooks/CI, agents/skills and generated mirrors, and README/index discoverability.

### Alternative A — implement only in `ose-public`

Viable for the larger product surface. Rejected by the explicit scope and because shared Rhino/rule
behavior could diverge in private.

### Alternative B — copy the public project matrix into private

Viable as superficial parity. Rejected because private has a distinct project/spec inventory and
must apply the same contract to its actual owners, not nonexistent public apps.

### Alternative C — copy rule prose without running propagation

Viable as documentation-only alignment. Rejected because config, bindings, project targets,
hooks/CI, or generated mirrors could continue enforcing the old contract.

**Consequences:** Every shared delivery boundary carries two independent PR/gate records and cannot
close until both are green; repository-specific owner units land only where they exist.

**Revisit trigger:** An approved repository-boundary ADR removes the affected parity contract.

## Operational and Recovery Contract

- [Judgment call] Roll out by delivery unit, with the registry/tooling contract landing before
  project-family wiring that consumes it.
- [Judgment call] Do not leave compatibility aliases for retired DDD commands; their successful
  presence would imply support. Release notes name the intentional removal.
- [Judgment call] A test-automation delivery unit is reverted as a whole when its project profile or
  gate composition produces false failures that cannot be corrected within the unit.
- [Judgment call] DDD retirement is independently revertible from testing adoption until dependent
  documentation and links have passed validation.
- [Judgment call] No persisted product-data migration, user-data loss, or deployment rollback
  applies. The repository-owned registry/config schema does migrate: per-project transition state
  remains until every owner is terminal, then Phase 20 removes compatibility.
