# Adopt BeaverNest Test-Automation Contracts Across OSE Repositories

**Status:** In Progress — planning complete; implementation has not started

**Created:** 2026-08-30
**Delivery mode:** `worktree-to-pr`

This plan is single-sourced in `ose-public` and delivers coordinated changes to both `ose-public`
and the private sibling. Each repository retains its own worktree, branch, PR, gates, rules-propagation
manifest, and recovery proof.

## Context

[Repo-grounded] OSE already names unit, integration, and end-to-end targets, but its current
automation proves only that a Gherkin step is bound somewhere. It does not prove that every feature,
expanded scenario, and step is covered by every applicable test adapter. Target wiring also varies
by project family, which makes an echo target indistinguishable from an intentionally inapplicable
layer without reading each `project.json`.

[Web-cited] The independent
[BeaverNest BDD contract](https://github.com/wahidyankf/beaver-nest/blob/main/repo-governance/development/behaviour-driven-development.md)
solves the useful part of this problem: recursive corpus discovery, role-based unit/integration/E2E
adapters, exact-one bindings, no unused bindings, explicit per-adapter exemptions, and fast static
behavior coverage in `test:quick`. This plan adopts that contract in OSE's vocabulary and Nx
structure; it does not copy BeaverNest projects, commands, spelling, or framework choices. Accessed
2026-08-30; excerpt: “Run every feature, expanded scenario, and step in each applicable adapter.”

[Judgment call] The user also resolved that OSE will retire DDD testing and documentation on
engineering surfaces until the concept is mature enough for a new approved design. Production
domain code and AyoKoding educational DDD content stay unchanged.

[Repo-grounded] Across the two OSE repositories, test sources and project metadata are also inconsistent: tests appear under several
project-specific paths, and 20 explicit project-local `package.json` files mix true package
boundaries with scripts or dependencies that may be owned by Nx/root workspace configuration.
The private sibling adds two direct library manifests and its own test/spec surfaces.

## Outcome

[Judgment call] Every Nx project in each repository has one explicit test-layer contract in its `project.json`, and
every logical application/library corpus has a compact specification entry point containing its
as-built C4 model beside a recursively discovered behavior corpus. Static compliance proves exact
corpus/driver/binding coverage before expensive integration or E2E runtime tests run. DDD-specific
engineering validators, Gherkin, specs artifacts, targets, and prescriptive governance are removed
in a separate natural delivery unit. Executable tests live under non-overlapping `tests/unit/`,
`tests/integration/`, or `tests/e2e/` roots, and project-local package manifests remain only where a
real package/tool boundary requires them; Nx commands never depend on a proxy manifest or script.

## Scope

- [Repo-grounded] Inventory all 28 `ose-public` Nx projects currently returned by
  `rtk nx show projects`,
  including inferred contract projects and the 26 projects backed by `apps/**/project.json` or
  `libs/**/project.json`.
- [Repo-grounded] Inventory the three current the private sibling Nx projects (`rhino-cli`, `ts-ui`, and
  `ts-ui-tokens`) and re-resolve the actual set from current `origin/main` at execution because the
  Rhino rewrite is independently in progress; `rhino-cli-fsharp` is currently absent.
- [Judgment call] Define application, executable-tool, library, contract-library, and dedicated-E2E
  project profiles with explicit layer applicability.
- [Judgment call] Move executable test sources into non-overlapping `tests/unit/`,
  `tests/integration/`, and `tests/e2e/` roots, with dedicated E2E suites under their E2E project.
- [Judgment call] Audit every project-local `package.json`; remove manifests without a proven
  package/tooling boundary, move all such project commands to `project.json`, and prohibit proxy
  manifests or forwarding scripts.
- [Judgment call] Standardize OSE-native Nx targets and attach commands, inputs, dependencies,
  outputs, and cache behavior to every applicable `project.json` or inferred project definition.
- [Repo-grounded] Make all 211 current `ose-public` and 76 current the private sibling feature files under
  `specs/apps/` and `specs/libs/` discoverable recursively, measured and enforced independently per
  repository with no manual file registration.
- [Judgment call] Extend Rhino's compliance machinery to prove corpus completeness, driver
  completeness, exactly one binding per step per applicable adapter, no unused bindings, and
  exact 100% applicable-adapter coverage with no per-item exemptions.
- [Web-cited] Reshape `specs/` around BeaverNest's logical application corpus: one product/surface
  entry point, one canonical as-built `architecture.md`, and one recursive behavior directory,
  while retaining useful OSE contracts and product grouping. The
  [source standard](https://github.com/wahidyankf/beaver-nest/blob/main/repo-governance/development/architecture-specifications.md)
  was accessed 2026-08-30; excerpt: “Every logical application corpus under
  `specs/apps/<product>/<surface>/` must contain a canonical `architecture.md` C4 model.”
- [Judgment call] Apply C4 synchronization rules: system context and useful container views,
  component views only when material, searchable constraints, split-on-reader-need, and same-change
  reconciliation with as-built boundaries.
- [Repo-grounded] Retire engineering-facing DDD test and documentation surfaces, including the OSE
  and OrganicLever DDD specs registries and Rhino DDD/domain-coverage commands in both repositories.
- [Judgment call] Delete every DDD-specific artifact under either repository's `specs/**`; no DDD
  specification is retained or migrated into the new logical corpus.
- [Judgment call] Wire fast static behavior compliance into `test:quick`; keep runtime integration
  and E2E outside quick/pre-push and in their existing scheduled/full gates.
- [Judgment call] As explicitly directed by the user, raise every governed numeric
  application/library coverage slice to a
  hard minimum of 99% lines and add repository-level enforcement that rejects lower or missing
  thresholds, placeholder coverage commands, conflicting runner configuration, and unjustified
  exclusions.
- [Judgment call] As explicitly directed by the user, enforce exactly 100% Gherkin/BDD coverage for
  every canonical feature, expanded example, scenario, and step across every applicable adapter;
  one uncovered item fails without rounding or per-item exemptions.
- [Judgment call] Run the rules-propagation workflow separately in both repositories for every new
  or changed enforcement contract, reconciling canonical rules, config, agents/skills, generated
  bindings, project targets, hooks/CI, indexes, and enforcement disposition before delivery.

## Non-Goals

- Rewriting production application architecture or renaming production domain folders.
- Removing AyoKoding DDD tutorials or other explicitly educational content.
- Copying BeaverNest applications, test frameworks, or the `ex-bdd` implementation.
- Making integration or E2E runtime tests part of `test:quick`.
- Adding cloud services, schemas, persistent storage, or network-dependent integration tests.
- Treating placeholder echo commands as proof that a test layer exists.
- Removing a project-local `package.json` that is proven necessary for publishing, workspace
  package resolution, deployment/build tooling, or another direct consumer.
- Copying public-only product/application owners into the private sibling; private scope follows its own
  project inventory while shared Rhino/governance surfaces preserve required parity.

## Resolved Material Decisions

| Decision                   | Selected option                                                                                                                                                                                             | Why                                                                                                                                                                            | Revisit trigger                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Behavior target vocabulary | Preserve `specs:behavior:coverage` for recursive structural compliance; add `test:behavior:coverage:{unit,integration,e2e}` plus aggregate `test:behavior:coverage`                                         | [Judgment call] Separates specification integrity from per-adapter proof and matches OSE's American-English naming                                                             | A repository-wide target-vocabulary ADR selects a different stable contract                                 |
| Runtime separation         | Static per-adapter compliance may run in quick; integration/E2E runtime stays scheduled/full                                                                                                                | [Repo-grounded] Preserves the current quick-gate latency boundary while closing structural gaps                                                                                | Measured CI evidence shows a runtime layer is deterministic and cheap enough for quick                      |
| Numeric coverage           | Enforce at least 99% line coverage per governed unit/integration slice                                                                                                                                      | [Judgment call] Explicitly selected by the user; BeaverNest prior art is supporting evidence, not the decision source                                                          | A new approved testing ADR presents cross-runner evidence and an equally strong replacement                 |
| Gherkin/BDD coverage       | Require exact 100% item and applicable-adapter coverage; no rounding or per-item exemption                                                                                                                  | [Judgment call] Explicitly selected by the user; makes one uncovered behavior a deterministic failure                                                                          | A new approved testing ADR provides an equally complete, mechanically stronger proof                        |
| Test layout                | `tests/unit/`, `tests/integration/`, and `tests/e2e/`, with layer-neutral non-executable support separated                                                                                                  | [Judgment call] Explicitly selected by the user; BeaverNest prior art supports but does not decide the OSE layout                                                              | A native runner proves the same non-overlap with a clearer cross-language layout                            |
| Project-local manifests    | Delete any `apps/`/`libs/` `package.json` without a proven package/tool boundary; put commands directly in `project.json`; no proxy                                                                         | [Judgment call] Explicitly selected by the user; removes duplicate command ownership without breaking real package consumers                                                   | A tool proves a manifest is a required direct boundary that `project.json` cannot represent                 |
| Repository scope           | Execute independently in `ose-public` and the private sibling, with paired shared-rule/Rhino outcomes                                                                                                       | [Judgment call] Explicitly selected by the user; enforcement is incomplete if the private sibling can drift                                                                    | The repositories stop sharing the affected contract through an approved parity decision                     |
| Rules propagation          | Run per repository whenever enforcement/rules surfaces change                                                                                                                                               | [Repo-grounded] Both repositories define rules as normative prose plus config, machinery, bindings, hooks, and CI; propagation makes the new gates discoverable and consistent | No revisit; this is a repository workflow obligation                                                        |
| DDD disposition            | Remove engineering tests/docs/gates; preserve production code and education                                                                                                                                 | [Judgment call] Explicitly selected by the user; avoids enforcing an immature concept without destructive product refactors                                                    | A new approved DDD concept/ADR defines bounded contexts, ownership, adoption criteria, and enforcement      |
| Specs/C4 structure         | `specs/{apps,libs}/<owner>/` entry with `architecture.md` and `behaviors/`, grouped by product/surface                                                                                                      | [Judgment call] Explicitly selected by the user; adopts BeaverNest's coherent corpus without copying British spelling or discarding useful OSE contracts                       | Evidence shows a distinct view needs a mapped `architecture/` split                                         |
| Delivery allocation        | Preserve the full scope through a catalog of natural cohesive, independently deployable units: named Phase 4 policy fixtures, exact ownership, private whole-foundation parity, and separate Ayo test seams | [Repo-grounded] Discovery identified independently buildable seams; each keeps its consistency artifacts and rollout/recovery path together                                    | New evidence shows a listed unit is not cohesive or its resulting `main` state is not production-deployable |
| Technical shape            | `tech-docs/` with five mapped companions                                                                                                                                                                    | [Judgment call] Project owners, tooling authors, spec owners, and DDD-retirement reviewers have distinct reader jobs                                                           | Merge companions only if the concerns converge under one owner                                              |
| Worktree                   | Use the narrow authoring-worktree exception in `ose-public`; provision matching `worktrees/adopt-beavernest-test-automation/` paths in both repositories at execution Step 0                                | [Judgment call] Explicitly selected by the user because this plan depends on unlanded planning rules in the user-mandated `rules-update` worktree                              | Not revisitable during execution; either pending worktree blocks implementation                             |

The alternatives and consequences for these delivered-solution choices—not editorial history of
this plan—are recorded in [Technical Decisions](./tech-docs/current-state-and-decisions.md).

## Document Map

- [Business Requirements](./brd.md) — why the testing contract matters and how success is measured.
- [Product Requirements](./prd.md) — personas, user stories, scope, and canonical acceptance criteria.
- [Technical Documentation](./tech-docs/README.md) — mapped technical design and evidence.
- [Delivery](./delivery.md) — bootcamp-executable action checklists inside cohesive outcomes,
  natural delivery seams, and proof.
- [Learnings](./learnings.md) — transient execution learning log.
- [Implementation notes](./implementation-notes.md) — sanitized per-binding execution ledger and
  compact summary; raw evidence remains ignored.

## Related Repository Sources

- [OSE Three-Level Testing Standard](../../../repo-governance/development/quality/three-level-testing-standard.md)
- [OSE Nx Target Standards](../../../repo-governance/development/infra/nx-targets.md)
- [OSE Feature Change Completeness](../../../repo-governance/development/quality/feature-change-completeness.md)
- [BeaverNest BDD contract](https://github.com/wahidyankf/beaver-nest/blob/main/repo-governance/development/behaviour-driven-development.md)
- [BeaverNest architecture specification](https://github.com/wahidyankf/beaver-nest/blob/main/repo-governance/development/architecture-specifications.md)
- [BeaverNest Bnest spec entry](https://github.com/wahidyankf/beaver-nest/tree/main/specs/apps/bnest/app)
- [BeaverNest application wiring](https://github.com/wahidyankf/beaver-nest/blob/main/apps/bnest-app/project.json)
- [BeaverNest executable-tool wiring](https://github.com/wahidyankf/beaver-nest/blob/main/apps/badakmini-cli/project.json)
- [BeaverNest Go tool wiring](https://github.com/wahidyankf/beaver-nest/blob/main/apps/resource-guard/project.json)
- [BeaverNest exempt runner wiring](https://github.com/wahidyankf/beaver-nest/blob/main/libs/ex-bdd/project.json)
