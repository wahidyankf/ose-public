---
description: How the PR quality gate and plan-checker enforce TDD, and the five kinds of change TDD does not apply to.
when_to_use: Use when checking whether TDD's enforcement mechanism would catch a given gap, or whether a change qualifies for an exception.
---

# Enforcement and Exceptions

## Enforcement

The PR quality gate runs `test:quick` for affected projects on every pull request; no hook runs it. A code change with
no accompanying implementation is caught by mandatory static Unit/adaptor coverage when it maps to
Gherkin. The semantic review catches placeholder bindings that static coverage cannot. TDD order
remains an intent-level rule; CI is a safety net, not its only enforcement mechanism.

The `plan-checker` enforces the plan-creation side: delivery checklist items that ship code
without TDD-shaped steps are flagged as HIGH findings.

## Exceptions

TDD does not apply to the following:

- **Pure documentation and markdown edits**: README updates, governance rule text, `docs/` content,
  plan documents. No test target covers prose.
- **Generated or codegen output**: Files produced by `nx run [project]:codegen` or similar
  generator targets. The generator's own tests cover the output; you do not write tests for
  generated files directly.
- **Trivial typo or comment fixes**: A one-character typo correction in a comment or string
  literal does not warrant a new test. The existing suite already covers the behaviour.
- **Exploratory spikes**: Throwaway code written to learn an API or validate a hypothesis. Spikes
  are deleted before merging; they never enter `main`.
- **Configuration-only changes**: Changing a value where no executable behaviour or gate contract
  changes. Gate behaviour changes require a failing validator fixture first.

Keep the exception list short. When in doubt, write the test first.
