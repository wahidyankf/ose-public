---
description: >-
  Holds the Apply Findings mode procedure of the swe-developer agent, moved verbatim from its definition so the
  definition fits its word budget.
when_to_use: >-
  Use when swe-developer runs Apply Findings mode and its definition points here.
---

# SWE Developer Apply Findings

Moved verbatim from [swe-developer](../../../../.agents/agents/swe-developer.md), which links each section here, per
[Document Word Budget](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/conventions/structure/document-word-budget.md).

## Apply Findings

1. **Read the findings and the accepted false positives,** and order them by priority, as
   [Assessing Criticality and Confidence](../../../../.agents/skills/repo-assessing-criticality-confidence/SKILL.md)
   explains.
2. **Re-validate each one** at the stated file and line under the stated standard, or by replaying its reproduction
   steps or request against the running service, and rate confidence per
   [Confidence and Re-Validation](../../quality/fixer-confidence-levels.md).
3. **Dispose of it.** `HIGH`: apply the fix, changing only what the finding names. `MEDIUM`: leave it for a person with
   the evidence. `FALSE_POSITIVE`: record the disproof and what would stop it being raised again.
4. **Fix test-first where a fix needs a test.** A missing regression test, untested behaviour, or a fix that changes
   what renders, what a keyboard operates, or what a request returns lands with a test seen to fail first, per
   [Regression Tests](../../quality/regression-test-mandate.md).
5. **Confirm each fix** by reading the code again and running the static checks and unit layer over the edited projects.
   A fix that did not land, or turns a passing test red, is undone and recorded as failed.
6. **Write the fix report** per
   [Generating Validation Reports](../../../../.agents/skills/repo-generating-validation-reports/SKILL.md), naming each
   disposition, the red and green runs, and the changed files a scoped re-validation needs.

A fix is `HIGH` only when the code and the cited standard leave one correct edit, such as an unused import or a query
rewritten with parameters. Moving code across layers, removing duplication that may be deliberate, a change for speed
without a measurement, a new token, a changed public interface, and any change to observable behaviour are `MEDIUM`, per
[Applying Maker, Checker, and Fixer](../../../../.agents/skills/repo-applying-maker-checker-fixer/SKILL.md).

Inside a quality gate's propagation, such as [UI Web Propagation](../../../workflows/quality/ui-web-propagation.md) or
[API HTTP Propagation](../../../workflows/quality/api-http-propagation.md), it follows that workflow's sequence once per
frozen row: correct but unspecified behaviour gains scenarios, as
[Writing Gherkin Criteria](../../../../.agents/skills/plan-writing-gherkin-criteria/SKILL.md) teaches; a design-system
change or a breaking contract change is `needs-decision`; and a served interface is rebuilt and redeployed before
verification. It never re-runs the audit, repairs a row twice, or widens scope.
