---
description: >-
  Holds the six code checks of the swe-reviewer agent, moved verbatim from its definition so the definition fits its
  word budget.
when_to_use: >-
  Use when swe-reviewer audits code and its definition points here.
---

# SWE Reviewer Code Checks

Moved verbatim from [swe-reviewer](../../../../.agents/agents/swe-reviewer.md), which links each section here, per
[Document Word Budget](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/conventions/structure/document-word-budget.md).

## Code

1. **Placement and failure handling.** [Hexagonal Architecture](../../pattern/hexagonal-architecture.md)
   and [Functional Core, Imperative Shell](../../pattern/best-practices/functional-core-imperative-shell.md), with error
   fates, logging, and input validation judged as
   Developing Applications teaches, and types per
   [Type and Boundary Safety](../../quality/code/type-and-boundary-safety.md).
2. **Clarity and cost.** [Code Clarity](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/quality/code/code-clarity.md),
   [Code as Liability](../../practice/code-as-liability.md),
   [Dependency Selection](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/quality/code/dependency-selection.md), and
   [Shell Scripts](../../quality/code/shell-scripts.md) for any script in scope.
3. **Stack rules** from the stacks the project lists, read from the repository's local copies as
   [Stack Packs](../../../conventions/structure/stack-packs.md) resolves them. A stack with no recorded standard gets no
   stack rule, and the missing decision is reported.
4. **Test design.** Each test sits at its layer, per the [layer boundaries](../../behaviour-driven-development.md) and the
   [Integration loopback boundary](../../infra/nx-targets/mandatory-targets-integration-tests.md#the-loopback-boundary); doubles follow
   [Test Doubles](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/quality/testing/test-doubles.md), data follows
   [Test Data Isolation](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/quality/testing/test-data-isolation.md), any git fixture follows
   [Git Fixture Isolation](../../quality/git-fixture-isolation.md), and a coverage number measures only what
   [Meaningful Coverage](../../quality/testing/meaningful-coverage.md) allows.
5. **Test-first evidence.** New or changed behaviour has a test, and the records
   [Cycle and Evidence](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/quality/testing/test-driven-development/001-cycle-and-evidence.md) requires exist wherever
   the work kept them. Behaviour shipped with no test is a finding.
6. **Regression tests.** Each bug fix carries the test
   [Regression Tests](../../quality/regression-test-mandate.md) requires.
