---
description: "Compatibility entry point for the canonical OSE test-layer boundaries and applicability rules"
when_to_use: "Use when scoping, writing, or reviewing a Unit, Integration, or E2E test."
---

# Unit, Integration, and E2E Testing Standard

## Principles Implemented/Respected

- [Pure Functions](../../principles/software-engineering/pure-functions.md) — Unit tests keep real
  resource boundaries behind injected ports.
- [Explicit over Implicit](../../principles/software-engineering/explicit-over-implicit.md) — each
  test layer owns a distinct, named boundary.

## Conventions Implemented/Respected

- [Specs Directory Structure](../../conventions/structure/specs-directory-structure.md) — runtime
  adapters consume the owner's canonical Gherkin corpus.
- [Repository Working Language](../../conventions/writing/repository-working-language.md) — active
  test documentation uses British `behaviour` terminology.

The canonical [Behaviour-Driven Development standard](../behaviour-driven-development.md) defines
the repository's Unit, Integration, and E2E boundaries; project-role applicability; shared Gherkin
contract; static coverage validators; exemptions; and execution surfaces.

This entry point remains for discoverability from older testing references. It does not establish a
second testing contract. In particular:

- every active scenario requires Unit proof and Unit has no exemption;
- Integration and E2E apply only when the project role owns their real boundary;
- inapplicable targets are omitted, never implemented as no-op or echo placeholders;
- `test:*` executes tests while `test:behaviour:coverage` validates the corpus statically, without executing
  tests;
- `test:quick` runs typecheck, lint, Unit tests, BDD Unit bindings, and `test:behaviour:coverage`;
- `test:integration` runs in the pull-request gate for affected projects, and `test:e2e` runs on a schedule or on
  `main`, never per pull request; and
- no git hook runs a test, a lint, or a document check: pre-commit formats staged files, commit-msg lints the
  message, and pre-push runs the leak scan.

Use the [coverage, exemption, and execution contract](../behaviour-driven-development/coverage-exemptions-and-execution.md)
for the canonical higher-layer exemption syntax and runtime-surface rules.
