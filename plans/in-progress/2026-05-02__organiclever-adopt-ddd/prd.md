# PRD — OrganicLever DDD Adoption

## Product overview

Restructure `apps/organiclever-web` and `specs/apps/organiclever` around explicit bounded contexts and ubiquitous language. Behavior must remain unchanged. The migration must be reversible per phase and verifiable via existing tests.

## In scope

- `apps/organiclever-web/src/**` — code reorganization into `src/contexts/<bc>/{domain,application,infrastructure,presentation}/`.
- `specs/apps/organiclever/ubiquitous-language/**` — new per-bounded-context glossary.
- `specs/apps/organiclever/fe/gherkin/**` — reorganized by bounded context.
- ESLint boundary configuration.
- One ADR under `apps/organiclever-web/docs/explanation/`.
- Updates to `apps/organiclever-web/README.md` and `apps/organiclever-web/CLAUDE.md` if changed structure requires it.

## Out of scope

- Behavior changes, new features, DB schema changes.
- `organiclever-be`, other apps, governance-level DDD docs (already authoritative).

## Functional requirements

### FR-1 — Per-bounded-context glossary

A new top-level folder `specs/apps/organiclever/ubiquitous-language/` MUST exist as a sibling to `be/`, `fe/`, `c4/`, and `contracts/`. It is the shared platform-agnostic glossary for the OrganicLever product — consumed by `fe/` today and available to `be/` when a future plan adopts DDD on the backend. The folder MUST contain:

- `README.md` — index and authoring rules. MUST state: (a) one file per bounded context; (b) glossary updates ride with code/feature changes in the same commit; (c) Gherkin step text MUST use only terms defined in the relevant context's glossary; (d) code identifiers MUST match glossary `Code identifier(s)` column verbatim.
- One file per bounded context: `<context>.md` (e.g. `journal.md`, `routine.md`, `workout-session.md`, `stats.md`, `settings.md`, `app-shell.md`, `health.md`, `landing.md`, `routing.md`).

Each context glossary file MUST contain:

- One-line context summary.
- Term table with columns `Term | Definition | Code identifier(s) | Used in features`.
- Section listing forbidden synonyms (terms outside this context that mean something different).

`specs/apps/organiclever/README.md` MUST be updated so that:

- The "Structure" tree shows `ubiquitous-language/` at the top level.
- The "Spec Artifacts" list includes a "Ubiquitous Language" entry linking the new folder.

`specs/apps/organiclever/fe/README.md` MUST link the glossary folder.

### FR-2 — Spec reorganization

`specs/apps/organiclever/fe/gherkin/` MUST be reorganized so each subfolder is a bounded context, not a route. Existing routes still map to features but each `.feature` file lives under exactly one bounded context. The mapping is decided in Phase 0 of `delivery.md`. The `fe/gherkin/README.md` MUST be updated to reflect the new layout and link the glossary.

`specs/apps/organiclever/be/` is unchanged.

### FR-3 — Source layering

For each bounded context `<bc>` in the map, `apps/organiclever-web/src/contexts/<bc>/` MUST contain only the layers required by that context, with this rule set:

- `domain/` — pure types, value objects, aggregates, domain events, pure business functions. No I/O. No React. No Effect runtime.
- `application/` — use-case orchestration. May depend on `domain/` and on infrastructure ports (interfaces only). Pure where possible.
- `infrastructure/` — adapters (PGlite store, BE-client wiring, Effect Layers). May depend on `domain/` and `application/` ports.
- `presentation/` — React hooks, components, page sub-trees specific to the context. May depend on `application/` and `domain/`. May not import from another context's `domain/` or `infrastructure/`.

A context that does not need a layer MAY omit it. Empty layer folders MUST NOT be left behind.

`src/app/**` (Next.js App Router) is the **outermost presentation entry**; it MAY import from any context's `presentation/` but MUST NOT import directly from a context's `domain/`, `application/`, or `infrastructure/`.

### FR-4 — Cross-context contracts

Cross-context dependencies MUST flow only through a context's published `application/` API (an `index.ts` re-export). A context's `domain/` and `infrastructure/` symbols MUST NOT be imported by any other context.

The journal context is the system of record for events. Other contexts that need event data MUST consume it through journal's `application/` API, not by reading PGlite directly.

### FR-5 — Boundary enforcement

ESLint configuration MUST fail the build when any of FR-3 or FR-4 is violated. The check MUST run in `nx lint organiclever-web` and therefore in the pre-push hook.

### FR-6 — ADR

`apps/organiclever-web/docs/explanation/bounded-context-map.md` MUST exist and document:

- Each bounded context, its responsibility, and its persistence strategy.
- Context relationships (Customer/Supplier, Conformist, Shared Kernel, Anticorruption Layer, etc.) using the standard DDD vocabulary.
- An accessible Mermaid diagram per the Mermaid accessibility convention.
- Links to each context's glossary file.

### FR-7 — No behavior regression

All of the following MUST remain green:

- `nx run organiclever-web:typecheck`
- `nx run organiclever-web:lint`
- `nx run organiclever-web:test:quick` (≥70% line coverage)
- `nx run organiclever-web:spec-coverage`
- `nx run organiclever-web-e2e:test:e2e`

## Non-functional requirements

| #     | Requirement                                                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | Migration phased; each phase ends with all gates green.                                                                                                                       |
| NFR-2 | Every code move follows TDD discipline — tests for moved code MUST pass before and after the move.                                                                            |
| NFR-3 | Each phase commits independently; commit messages follow Conventional Commits (`refactor(organiclever-web): ...`).                                                            |
| NFR-4 | No new external dependencies beyond an ESLint boundaries plugin already used elsewhere in the workspace (or its first introduction).                                          |
| NFR-5 | All Mermaid diagrams in new docs comply with the [Accessible Diagrams Skill](../../../.claude/skills/docs-creating-accessible-diagrams/SKILL.md).                             |
| NFR-6 | All new markdown follows [Content Quality](../../../governance/conventions/writing/quality.md) and [Markdown Standards](../../../governance/development/quality/markdown.md). |
| NFR-7 | All file names follow the [File Naming Convention](../../../governance/conventions/structure/file-naming.md) (lowercase kebab-case).                                          |

## Acceptance criteria (Gherkin)

```gherkin
Feature: OrganicLever DDD adoption acceptance

  Background:
    Given the plan "2026-05-02__organiclever-adopt-ddd" has been executed
    And the working tree is clean

  Scenario: Per-bounded-context glossary exists
    When I list "specs/apps/organiclever/ubiquitous-language/"
    Then I see a file "README.md"
    And I see one ".md" file for every bounded context in the map
    And every glossary file has a "Term | Definition | Code identifier(s) | Used in features" table

  Scenario: Specs are organized by bounded context
    When I list "specs/apps/organiclever/fe/gherkin/"
    Then every direct child folder name matches a bounded context in the map
    And no folder name is a route segment that does not also name a bounded context

  Scenario: Code is organized by bounded context and layer
    When I list "apps/organiclever-web/src/contexts/"
    Then I see a folder for every bounded context in the map
    And each context folder contains only "domain", "application", "infrastructure", or "presentation" subfolders
    And no empty layer subfolder is left behind

  Scenario: Inward dependency rule is enforced
    Given the file "apps/organiclever-web/src/contexts/journal/domain/journal-event.ts" exists
    When I edit it to "import { something } from '../infrastructure/journal-store'"
    And I run "nx run organiclever-web:lint"
    Then the lint command exits non-zero
    And the error mentions a boundary violation

  Scenario: Cross-context boundary is enforced
    Given the file "apps/organiclever-web/src/contexts/stats/application/compute.ts" exists
    When I edit it to "import { drizzle } from '../../journal/infrastructure/journal-store'"
    And I run "nx run organiclever-web:lint"
    Then the lint command exits non-zero
    And the error mentions a forbidden cross-context import

  Scenario: App Router stays in presentation
    Given the file "apps/organiclever-web/src/app/app/journal/page.tsx" exists
    When I edit it to import directly from "src/contexts/journal/domain/journal-event"
    And I run "nx run organiclever-web:lint"
    Then the lint command exits non-zero

  Scenario: ADR documents the bounded-context map
    When I read "apps/organiclever-web/docs/explanation/bounded-context-map.md"
    Then it lists every bounded context in the map
    And it contains a Mermaid diagram
    And it links to every per-context glossary file

  Scenario: No behavior regression
    When I run "nx run organiclever-web:typecheck"
    And I run "nx run organiclever-web:lint"
    And I run "nx run organiclever-web:test:quick"
    And I run "nx run organiclever-web:spec-coverage"
    And I run "nx run organiclever-web-e2e:test:e2e"
    Then all five commands exit zero

  Scenario: Coverage threshold preserved
    When I run "nx run organiclever-web:test:quick"
    Then line coverage for "apps/organiclever-web" is at least 70%

  Scenario: README and CLAUDE.md mention the new layout
    When I read "apps/organiclever-web/README.md"
    Then it mentions "src/contexts/<context>/{domain,application,infrastructure,presentation}/"
    And it links to the bounded-context-map ADR
    And it links to the ubiquitous-language folder

  Scenario: Glossary terms appear in Gherkin features
    Given each glossary file lists terms in its "Term" column
    When I scan "specs/apps/organiclever/fe/gherkin/<context>/" for each context
    Then every term used in a Gherkin step is present in that context's glossary
```

## Dependencies

- [DDD Standards (authoritative)](../../../docs/explanation/software-engineering/architecture/domain-driven-design-ddd/README.md)
- [BDD with DDD Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/bdd-with-ddd-standards.md)
- [TDD with DDD Standards](../../../docs/explanation/software-engineering/development/test-driven-development-tdd/tdd-with-ddd-standards.md)
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)
- [File Naming Convention](../../../governance/conventions/structure/file-naming.md)
- [Markdown Standards](../../../governance/development/quality/markdown.md)
