---
description: "Contract for test:behaviour:coverage, the shared static behaviour corpus check"
when_to_use: "Use when adding or debugging static Gherkin coverage validation."
---

# Mandatory Static Behaviour Coverage

Every behaviour owner and dedicated E2E project exposes `test:behaviour:coverage`, which runs RHINO's shared
static check, `./rhino behaviour coverage validate`. The check runs no test. It recursively discovers the
canonical corpus and statically rejects empty/malformed features, missing explicit When/Then steps, undefined
or ambiguous steps, unused bindings, incomplete applicable adapters, missing Unit proof, forbidden
`@wip`/positive selection tags, and invalid exemptions.

The check replaces the retired per-layer `test:coverage:<layer>` targets and their repo-local script. A
scenario needs a `@scenario` reference at its unit level, and at its integration and e2e levels unless it
carries a valid exemption with a stated reason. The check never depends on runtime targets.
`test:behaviour:coverage` runs through `test:quick` directly.

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

Static coverage cannot prove that a binding invokes production code or observes independent
evidence. Material changes also require the
[Gherkin implementation review](../../../workflows/quality/gherkin-implementation-review.md).
