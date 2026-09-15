---
description: "Canonical Gherkin, adapter, exemption, and test-coverage contract for every testable OSE project"
when_to_use: "Use before changing observable behaviour, adding a test adapter, or reviewing Gherkin coverage."
---

# Behaviour-Driven Development

Every testable application, library, and executable tool expresses observable behaviour in canonical
Gherkin `.feature` files below `specs/apps/` or `specs/libs/`. Discover the corpus recursively; never
maintain another list. Dedicated E2E projects implement their owner's corpus, not an independent spec.

Canonical Gherkin uses its owner's durable domain language. A Feature,
Rule, Background, Scenario, Scenario Outline, Examples table, step, comment, or tag destined for
`specs/` must exclude plan-specific slugs, plan numbers, plan phases, plan delivery-unit names, and
plan-specific acceptance-criterion identifiers. Plans expire; owner corpora do not. Plans map
requirements to scenario titles and owner-relative feature paths outside copy-ready Gherkin.

**Unenforced by decision:** plan and specs checkers review this semantically because keyword gates
would misclassify domain terms.

## Principles Implemented/Respected

- [Automation over Manual](../principles/software-engineering/automation-over-manual.md) — binding,
  coverage, and execution topology are mechanically enforced.
- [Explicit over Implicit](../principles/software-engineering/explicit-over-implicit.md) — layer
  ownership and every higher-layer exemption are declared and reviewable.
- [Pure Functions](../principles/software-engineering/pure-functions.md) — Unit proof isolates all
  operating-system and resource boundaries behind injected ports.

## Conventions Implemented/Respected

- [Specs Directory Structure](../conventions/structure/specs-directory-structure.md) — canonical
  behaviour corpora live under their owning Specs tree and are discovered recursively.
- [Repository Working Language](../conventions/writing/repository-working-language.md) — repository
  prose and owned identifiers use British `behaviour` terminology.

## Iron Rule

Before changing production behaviour, read the relevant feature, scenario, steps, and tests. Then
update Gherkin, bind a failing Unit test and every applicable higher-layer adapter, confirm the
appropriate Nx runtime target fails, and implement the production change. Finish without
placeholder, ambiguous, unused, or unimplemented steps. Unit proof is mandatory for every active
scenario, has no exemption, and its runtime target must enforce at least 99% line coverage over the
production denominator it owns. Exclusions may assign a real higher-layer boundary to another
runtime slice; they must never hide retained production behaviour from all numeric coverage.

Refactors and implementation-only changes preserve Gherkin and begin from a green characterization
baseline. The [TDD convention](workflow/test-driven-development.md) governs their Red–Green–Refactor
cycle.

## Project Roles and Applicable Adapters

| Project role          | Applicable adapters                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Application           | Unit; Integration when it owns a real local-resource boundary; E2E in a dedicated project when it exposes a public boundary |
| Library               | Unit; Integration for an owned local-resource boundary; E2E only for a genuine public browser/runtime boundary              |
| Executable tool       | Unit; Integration for owned local resources; E2E for a public process boundary                                              |
| Dedicated E2E project | E2E for its owning application's corpus; no independent Unit or Integration adapter                                         |

Omit an inapplicable target and explain the omission, corpus, adapters, and owning targets in the
project README. Never add a no-op, echo, success-sentinel, or aliased test target for naming
symmetry.

## Test Boundaries

- **Unit** runs in-process. Replace filesystem, database, environment, clock, randomness, child
  process, network, and every other OS-facing dependency with injected mocks, fakes, or stubs.
  Setup and assertions must not access those real resources. The owner enforces a hard minimum of
  99% line coverage during `test:unit`.
- **Integration** may use isolated local files, embedded databases, environment state, child
  processes, standard streams, and an
  [allowlisted loopback socket](./infra/nx-targets/mandatory-targets-integration-tests.md) it owns.
  It must not reach an external network or a service it did not start. Isolate and clean resources
  deterministically.
- **E2E** observes a real public browser, HTTP, or process boundary. It may use OS resources,
  processes, and network communication, but only with synthetic isolated data and identities.
  Production data and uncontrolled external services are forbidden without explicit authorization.

Classify a test by the strongest real boundary touched by its setup, subject, or assertion. Network
permission alone does not make a test E2E; it must observe the public boundary.

## Scenario Coverage and Exemptions

Every scenario requires explicit `When` and `Then` steps. A scenario may repeat primary keywords
when they express one continuous user journey; do not split an existing journey merely for
keyword uniformity. Each expanded Scenario Outline example counts separately. Each non-exempt scenario
resolves exactly once in every applicable adapter; every step has one binding, and every binding is used.

- [BDD Coverage, Exemptions, and Execution](./behaviour-driven-development/coverage-exemptions-and-execution.md) — Static coverage targets, higher-layer exemptions, test:quick composition, and runtime execution surfaces. Use when defining BDD coverage targets, documenting an Integration/E2E exemption, or selecting a runtime execution surface.

Run the [Gherkin implementation review](../workflows/gherkin-implementation-review.md) after adding
or materially changing a feature, adapter, exemption, or coverage mechanism. Static binding
coverage cannot prove semantic implementation.
