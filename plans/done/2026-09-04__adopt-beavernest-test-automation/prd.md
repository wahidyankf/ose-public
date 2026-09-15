# Product Requirements

## Product Overview

[Judgment call] The product of this plan is a coordinated `ose-public` and the private sibling testing contract expressed through Nx targets,
recursive Gherkin ownership, adapter-specific compliance, project documentation, and CI gates. A
developer uses the same target vocabulary across TypeScript, F#, applications, libraries, CLIs,
contracts, and dedicated E2E harnesses while each project retains its native runner.

## Personas

### Project maintainer

Maintains an application or library and needs to know which test layers apply and which commands
prove them.

### Delivery agent

Changes production behavior and must follow Gherkin → failing applicable adapter → implementation
without inventing a project-specific workflow.

### Reviewer

Needs a deterministic requirement-to-adapter coverage report and natural-seam delivery evidence.

### Tooling maintainer

Maintains Rhino/Nx compliance logic and needs a language-neutral manifest plus thin runner adapters.

## User Stories

- As a project maintainer, I want my project profile and target contract declared next to the
  project so that applicable and inapplicable layers are explicit.
- As a delivery agent, I want recursive corpus discovery and per-adapter failures so that I cannot
  accidentally bind a scenario only at one layer.
- As a reviewer, I want static compliance and runtime proof separated so that I know what a green
  target actually establishes.
- As a tooling maintainer, I want one normalized coverage manifest so that different test frameworks
  do not duplicate ownership logic.
- As a new-to-stack engineer, I want unit, integration, and E2E sources in named physical roots so
  that I can identify the boundary before reading runner configuration.
- As a project maintainer, I want task commands owned directly by `project.json` and local package
  manifests retained only for real package/tool consumers so that no proxy layer can drift.
- As a maintainer pausing DDD, I want its engineering enforcement removed without application or
  educational-content churn.

## Functional Requirements

- **FR-01 Project profiles:** Every Nx project is classified as application, executable tool,
  library, contract library, or dedicated E2E harness.
- **FR-02 Layer applicability:** Each profile declares whether unit, integration, and E2E are
  required, conditional, delegated, or inapplicable.
- **FR-03 Recursive corpus:** Behavior owners discover all `.feature` files recursively below one
  canonical root; no per-file registration is permitted.
- **FR-04 Exact adapter coverage:** Every feature, expanded scenario, and step is accounted for in
  every applicable adapter.
- **FR-05 Binding integrity:** Applicable adapters reject undefined, ambiguous, multiply-bound,
  unused, and uncovered bindings; per-item exemptions are not permitted.
- **FR-06 Nx wiring:** Each project exposes the standard runtime, static behavior, aggregate, quick,
  and full targets appropriate to its profile with correct inputs/dependencies/cache/output metadata.
- **FR-07 Gate separation:** Quick runs unit runtime plus static compliance; full/scheduled gates run
  integration and E2E runtime.
- **FR-08 DDD retirement:** DDD engineering specs, tests, validators, target wiring, and prescriptive
  docs are removed; production code and AyoKoding education remain.
- **FR-09 Reconciliation:** Governance, project READMEs, CI, C4 applicability, and plan evidence are
  reconciled before completion.
- **FR-10 Specs corpus structure:** Each logical app/tool/library owner has one mapped specification
  entry beside its canonical architecture and recursively discovered behaviors.
- **FR-11 C4 as-built discipline:** Architecture models cover current actors, systems, useful
  containers/components, stores, interfaces, material flows, and trust boundaries; proposals stay
  in plans, and affected as-built views update in the same implementation change.
- **FR-12 Numeric coverage floor:** Every code-owning application/library numeric unit or integration
  slice enforces at least 99% line coverage through its native runner.
- **FR-13 Coverage governance:** Repository validation rejects lower/missing thresholds, conflicting
  runner values, successful echo placeholders, broad/unowned exclusions, and aggregates that omit an
  applicable numeric slice.
- **FR-14 Complete BDD coverage:** Static compliance computes exact file, expanded-example,
  scenario, step, and owner-adapter counts and requires 100% for every applicable adapter without
  rounding or per-item exemptions.
- **FR-15 Physical test-layer roots:** Executable tests live under exactly one of `tests/unit/`,
  `tests/integration/`, or `tests/e2e/`; runner includes, Nx inputs, and outputs cannot overlap
  layers. Dedicated E2E projects own their own `tests/e2e/` root.
- **FR-16 Project manifest ownership:** Every direct project-local `package.json` has a proven
  package/tooling consumer or is deleted after its commands move to `project.json`; proxy manifests
  and forwarding scripts are invalid.
- **FR-17 Multi-repository enforcement:** Both repositories apply the contract to their actual
  project/spec inventories, with separate gates/evidence and byte-identical shared Rhino surfaces.
- **FR-18 Rules propagation:** Every changed enforcement subject runs the rules-propagation workflow
  in each affected repository and reconciles canonical prose, config, machinery, bindings,
  project/CI hooks, discoverability indexes, and enforcement disposition.
- **FR-19 DDD specs deletion:** Every DDD-specific artifact under either `specs/**` is deleted rather
  than retained, relocated, or grandfathered.

## Acceptance Criteria

```gherkin
Feature: OSE project test automation contract

  Scenario: AC-TEST-01 Every Nx project has one explicit test profile
    Given the current project set returned by Nx
    When the test-contract registry is validated
    Then every project is classified exactly once with its applicable test layers

  Scenario: AC-TEST-02 Canonical feature files are discovered recursively
    Given canonical feature roots under specs/apps and specs/libs
    When behavior corpus discovery runs from the repository root
    Then every feature file is assigned to exactly one behavior owner without manual registration

  Scenario: AC-TEST-03 Every applicable adapter covers the complete owner corpus
    Given a behavior owner with unit integration or E2E adapters marked applicable
    When per-adapter behavior coverage is validated
    Then every feature expanded scenario and step is accounted for in each applicable adapter

  Scenario: AC-TEST-04 Binding defects fail static compliance
    Given an undefined ambiguous duplicate or unused adapter binding
    When the project's static behavior coverage target runs
    Then the target fails with the project adapter feature and step identity

  Scenario: AC-TEST-05 Test quick remains fast and boundary-safe
    Given a project with unit integration and E2E layers
    When its test quick target runs
    Then unit runtime and static behavior compliance run without integration or E2E runtime

  Scenario: AC-TEST-06 Full gates execute applicable runtime layers
    Given a project profile and its explicit adapter applicability
    When its full or scheduled test gates run
    Then every applicable runtime layer executes and every inapplicable layer has a governed reason

  Scenario: AC-TEST-07 DDD engineering enforcement is retired safely
    Given the user-approved engineering-surface DDD retirement scope
    When DDD tests specs validators targets configuration and prescriptive docs are removed
    Then production domain code and AyoKoding educational DDD content remain unchanged

  Scenario: AC-TEST-08 Delivery remains reviewable and reversible
    Given the project-family migration and DDD-retirement work
    When delivery boundaries are selected
    Then each PR is one independently reviewable verifiable revertible natural seam
    And its exact resulting main state is immediately safe to deploy to production
    And incomplete behavior is internally complete and inert behind a temporary production-disabled flag with both paths tested and rollout rollback and removal recorded

  Scenario: AC-TEST-09 Final reconciliation proves the complete outcome
    Given all delivery packets and surface gates report completion
    When the end-to-end completeness audit maps requirements to artifacts and proof
    Then every acceptance criterion has current evidence or execution reopens at the earliest gap

  Scenario: AC-TEST-10 Test sources have one physical layer owner
    Given executable tests in an application library tool or dedicated E2E project
    When test layout and runner discovery are validated
    Then every test belongs to exactly one unit integration or E2E root without cross-layer overlap

  Scenario: AC-TEST-11 Unnecessary package manifests are removed without proxies
    Given a direct apps or libs project-local package manifest
    When package-boundary policy validation runs
    Then the manifest has a proven direct consumer or is absent with every command owned by project.json

  Scenario: AC-TEST-12 One missing BDD item fails complete coverage
    Given one canonical feature example scenario or step missing from an applicable adapter
    When exact Gherkin BDD coverage is calculated
    Then coverage fails below 100 percent with the missing item identity and no rounded pass

  Scenario: AC-REPO-01 Both OSE repositories enforce the testing contract
    Given the current ose-public and private-sibling project and specification inventories
    When repository testing and parity gates run
    Then each repository passes its own enforcement and every shared Rhino surface remains identical

  Scenario: AC-RULES-01 Enforcement changes propagate through repository rules
    Given a testing specs C4 coverage layout or manifest policy change
    When the affected repository rules-propagation workflow completes
    Then canonical rules bindings configuration project gates hooks CI and indexes agree on enforcement

  Scenario: AC-DDD-01 No DDD specification artifact is retained
    Given DDD-specific content anywhere under specs in either repository
    When DDD engineering retirement completes
    Then every such specification artifact is absent while preserved non-spec production education and history remain unchanged

  Scenario: AC-SPECS-01 Logical corpora have one navigable specification entry
    Given the current OSE application tool and library specification trees
    When they are migrated to the approved logical corpus structure
    Then each owner has one README architecture entry and recursive behaviors directory without duplicate canonical content

  Scenario: AC-C4-01 Canonical C4 models describe only the as-built system
    Given a logical corpus with current architecture material
    When its canonical architecture model is validated
    Then required actors boundaries relationships stores interfaces and constraints match the implemented system

  Scenario: AC-C4-02 Architecture changes reconcile in the implementation delivery unit
    Given a production change that alters a documented C4 element
    When the affected implementation delivery unit completes
    Then every affected canonical view and searchable constraint is updated with as-built proof

  Scenario: AC-COVERAGE-01 Numeric coverage fails below the repository floor
    Given a governed application or library numeric coverage slice
    When its measured line coverage is below 99 percent
    Then the native Nx coverage target fails without a lower project override

  Scenario: AC-COVERAGE-02 Coverage declarations cannot weaken enforcement
    Given a project target runner configuration and exclusion manifest
    When repository coverage policy validation runs
    Then lower missing conflicting placeholder or unowned coverage declarations fail with an actionable project path

  Scenario: AC-COVERAGE-03 E2E-only harnesses use the correct coverage proof
    Given a dedicated E2E project with no owned production-code denominator
    When its project test contract is validated
    Then numeric line coverage is explicitly inapplicable and complete behavior adapter coverage remains mandatory
```

## Product Scope

### In scope

- Nx target contracts and project-level attachment for all current projects.
- Rhino static compliance and normalized manifests.
- Test runner adapter changes required for full corpus coverage.
- CI/scheduled workflow composition.
- Gherkin ownership and applicable-adapter coverage.
- Specs directory migration and C4 governance/validation.
- A 99% numeric line-coverage migration and enforcement for code-owning apps/libs.
- Exact 100% Gherkin/BDD item and applicable-adapter coverage enforcement.
- Physical test migration to non-overlapping `tests/unit/`, `tests/integration/`, and `tests/e2e/`.
- Removal of unnecessary direct project-local package manifests and proxy scripts after a
  direct-consumer audit.
- Coordinated adoption, enforcement, rules propagation, CI, and proof in both `ose-public` and
  the private sibling.
- Complete deletion of DDD-specific artifacts under both repositories' `specs/**`.
- DDD engineering-surface retirement and link/index reconciliation.

### Out of scope

- Product features unrelated to test infrastructure.
- Production DDD/domain refactors.
- AyoKoding educational DDD removal.
- Hosted external test infrastructure.
- Runtime integration over public networks.

## Product Risks

- A profile can be syntactically valid but semantically wrong; representative negative fixtures and
  manual target inspection are required.
- Dedicated E2E projects may accidentally become independent behavior owners; ownership validation
  must reject that shape.
- Inferred Nx projects need the same contract even when no dedicated `project.json` exists.
- Removing DDD docs can leave dangling links; full internal-link validation and README index checks
  are mandatory.
- Manifest deletion can break install/build/deployment when package identity is a real boundary;
  direct-consumer evidence and representative project-family verification are mandatory.
- A test move can create false green results if runner globs stop discovering it; exact pre/post
  test inventories and misplaced-test negative fixtures are mandatory.
