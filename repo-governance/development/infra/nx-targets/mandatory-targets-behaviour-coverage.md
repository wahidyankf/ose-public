---
description: "Contract for test:coverage:behaviour and the per-adapter static coverage validators"
when_to_use: "Use when adding or debugging static Gherkin coverage validation."
---

# Mandatory Static Behaviour Coverage

Every behaviour owner and dedicated E2E project exposes `test:coverage:behaviour`. It recursively
discovers the canonical corpus and statically rejects empty/malformed features, missing explicit
When/Then steps, undefined or ambiguous steps, unused bindings, incomplete applicable adapters,
missing Unit proof, forbidden `@wip`/positive selection tags, and invalid exemptions.

Layer-specific `test:coverage:<layer>` targets prove exactly-one implementation or a valid
higher-layer exemption for every expanded scenario. Coverage targets never execute tests and never
depend on runtime targets. Every applicable validator runs through `test:quick`, directly or via
`test:coverage`.

**Python (pytest-bdd).** A Python project binds Gherkin with pytest-bdd step definitions in `.py` files: `@given`,
`@when`, `@then`, or `@step` taking a plain string, `parsers.parse`, `parsers.cfparse`, or `parsers.re`. The static
validator counts a registration only in code, never in a comment or docstring, and requires every expanded scenario step to
resolve to exactly one. A registration spelled another way, such as an aliased import or a computed argument, does not
register and reads as undefined. A Python owner's `test:unit` command names both `--cov=<package>` and `--cov-fail-under=<n>` with `n`
at least 99; a threshold without a source selection enforces nothing and is rejected. A project whose targets run pytest
declares `lang:python` ([tag convention](./tag-convention-four-dimension-scheme.md)) and is rejected without it. The
validator also enforces the [Python target sets](./mandatory-targets-cli-e2e.md): a `lang:python` project declares
`install` (running `uv sync --locked`), `lint`, and `typecheck`, a CLI owner also `build` and `run`; no target is a
placeholder command; and a dedicated E2E project owns no Unit or Integration target.

**Pending corpus.** A project whose corpus has not received its first feature declares `"pending": true` in its
`behaviour-coverage.json`. The marker is a state, not an exemption: it holds only while the corpus has no feature and no
step is registered, and the validator rejects it once a feature exists, so it removes no scenario from coverage. The
target contract and the adapter drivers are still checked.

Static coverage cannot prove that a binding invokes production code or observes independent
evidence. Material changes also require the
[Gherkin implementation review](../../../workflows/gherkin-implementation-review.md).
