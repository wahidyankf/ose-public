# Business Requirements

## Business Goal

[Judgment call] Give maintainers and delivery agents one trustworthy answer to two questions for
every project in `ose-public` and the private sibling: “which test layers apply?” and “has every specified
behavior been covered at each applicable layer?” The answer must be visible through Nx targets
rather than tribal knowledge.

## Current Pain

- [Repo-grounded] OSE has named unit, integration, E2E, code-coverage, and specs-coverage targets,
  but target bodies vary across TypeScript, F#, web, CLI, library, and dedicated E2E projects.
- [Repo-grounded] Current declared line thresholds range from 70% to 95%, and some coverage targets
  are successful echo placeholders rather than executable numeric gates.
- [Repo-grounded] `specs:behavior:coverage` proves shared step availability, not per-adapter corpus
  completeness or absence of unused adapter bindings.
- [Repo-grounded] Many inapplicable test levels are represented by successful echo commands, so a
  green target alone cannot explain whether a boundary was tested or intentionally exempt.
- [Repo-grounded] The current C4-aware five-folder tree separates one logical application's
  architecture across product, system-context, containers, components, and behavior directories,
  increasing navigation and reconciliation cost for small and multi-surface projects.
- [Repo-grounded] DDD engineering documentation and validators currently bind OSE to a concept the
  maintainer has explicitly chosen to pause.
- [Repo-grounded] Executable tests are distributed across `src/**`, project-specific test paths,
  and dedicated E2E roots, so folder location does not reliably communicate runtime boundary.
- [Repo-grounded] Twenty project-local `package.json` files exist under direct `ose-public` project
  roots and two under the private sibling; some are real dependency/package boundaries, while others may
  duplicate commands that Nx already owns in `project.json`.

## Affected Roles

- Application and library maintainers deciding which tests a change requires.
- Delivery agents attaching commands and gates to Nx projects.
- Reviewers tracing Gherkin requirements to unit, integration, and E2E evidence.
- Tooling maintainers extending Rhino validation without framework-specific duplication.
- New-to-stack engineers learning why a layer applies or does not apply.

## Expected Benefits

- [Judgment call] Missing adapter coverage fails deterministically before a behavior can be declared
  complete.
- [Judgment call] Quick gates stay fast because static compliance is separated from expensive
  runtime suites.
- [Judgment call] Project profiles and explicit whole-layer dispositions make inapplicable
  boundaries auditable without weakening an applicable adapter.
- [Judgment call] Co-locating each logical corpus's `architecture.md` and `behaviors/` lets a new
  engineer trace boundary → behavior → test adapters without reconstructing a product-wide tree.
- [Judgment call] DDD enforcement no longer creates false confidence while its model is under review.
- [Judgment call] Natural delivery units let reviewers land or revert cohesive project-family
  migrations independently instead of coupling unrelated purposes in one PR.
- [Judgment call] Physical layer roots make accidental unit/integration/E2E overlap visible to a
  new-to-stack engineer and mechanically detectable by Nx inputs and test-runner includes.
- [Judgment call] Removing unnecessary project manifests gives each command one owner in
  `project.json` and avoids package-script proxy chains.

## Business Success Measures

1. [Repo-grounded] All projects returned by `rtk nx show projects` appear in the committed project
   test-contract registry or an equally deterministic inferred-project source.
2. [Judgment call] Every canonical `.feature` file resolves to exactly one behavior owner and all
   applicable adapters, or the compliance gate fails with the missing owner/adapter.
3. [Judgment call] Every applicable adapter has zero undefined, ambiguous, multiply-bound, unused,
   and uncovered steps, with no per-item exemptions.
4. [Judgment call] `test:quick` runs unit runtime tests plus static behavior compliance without
   integration/E2E runtime.
5. [Judgment call] As explicitly directed by the user, every governed numeric unit/integration slice fails below 99% line
   coverage, and the repository validator rejects any lower declaration or unowned exclusion.
6. [Judgment call] Exactly 100% of canonical features, expanded examples, scenarios, and steps are
   covered by every applicable BDD adapter; a single missing item fails by count, not rounded rate.
7. [Judgment call] Every executable test belongs to exactly one of `tests/unit/`,
   `tests/integration/`, or `tests/e2e/`, and every corresponding target discovers only its layer.
8. [Judgment call] Every direct `apps/*/package.json` and `libs/*/package.json` has deterministic
   retention evidence or is removed, with commands attached directly to `project.json` and no proxy.
9. [Judgment call] Every logical app/tool/library corpus has a mapped README, canonical as-built C4
   entry, recursive behaviors directory, and bidirectional implementation links.
10. [Judgment call] As explicitly directed by the user, DDD engineering test/docs/gate surfaces are absent, while production
    domain code and AyoKoding educational content remain unchanged.
11. [Judgment call] Each delivery PR follows one natural cohesive seam, keeps its build, verification,
    operation, rollback, and consistency artifacts together, and leaves the exact resulting `main`
    state immediately safe to deploy. Incomplete behavior is internally complete and inert behind a
    temporary production-disabled flag with both paths tested and rollout, rollback, and removal recorded.
12. [Judgment call] Both repositories pass their own registry, 99% numeric, exact 100% BDD,
    layout/manifest, specs/C4, CI, and rules-propagation reconciliation gates; shared Rhino content
    remains byte-identical where the parity contract applies.

## Business Non-Goals

- Guaranteeing a particular line-coverage percentage for integration or E2E suites.
- Standardizing all underlying test frameworks into one language or runner.
- Defining OSE's future DDD model during this plan.
- Using testing automation to change product behavior unrelated to testability.

## Risks and Mitigations

| Risk                                                    | Consequence                                      | Mitigation                                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural compliance is mistaken for runtime proof     | Green static gate hides broken behavior          | Keep static `test:behavior:coverage:*` distinct from runtime `test:*` targets and require both in full gates                                        |
| Unrelated migrations are coupled in one PR              | Review quality and reversibility decline         | Deliver by natural, independently deployable project-family seams defined in `delivery.md`                                                          |
| Inapplicable layers become silent gaps                  | Behavior lacks required boundary proof           | Require an explicit whole-layer profile disposition with boundary evidence; never accept an unclassified echo or per-item waiver                    |
| DDD removal deletes product behavior                    | Unintended application regression                | Scope deletion to tests, specs, validators, docs, configuration, and target wiring; preserve production code and education                          |
| Recursive discovery captures the wrong corpus           | Duplicate ownership or slow gates                | Define exact owner roots and fail on duplicate/unowned feature files before adapter execution                                                       |
| Specs migration loses useful C4 detail                  | Architecture understanding regresses             | Consolidate only as-built material, compare old/new statement and relationship inventories, and split `architecture/` only at reader seams          |
| Raising coverage encourages gaming                      | Meaningless tests or broad exclusions reach 99%  | Require TDD behavior value, bounded exclusion ownership, alternate proof, mutation/negative review samples, and a deterministic exclusion validator |
| A missing BDD item is hidden by rounding or exemptions  | Report says 100% while behavior is absent        | Compare exact normalized counts, reject every uncovered applicable pair, and prohibit per-item exemptions                                           |
| Folder moves silently change test discovery             | A suite stops running while targets stay green   | Prove before/after inventories, enforce one-layer ownership, and run negative misplaced-test fixtures                                               |
| Removing a needed manifest breaks install or deployment | A project loses dependency or tooling resolution | Require direct-consumer evidence before deletion and verify install/build/deploy configuration per project family                                   |
| Public rules land without private enforcement           | Repository behavior diverges silently            | Treat shared enforcement as paired per-repo delivery, run rules propagation and exact gates in each repo, and block closure on parity drift         |

## Approval Model

[Repo-grounded] Code review and the repository's delivery gates are the approval mechanism. This
BRD does not introduce stakeholder sign-offs or a separate governance board.
