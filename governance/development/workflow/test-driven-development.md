---
title: "Test-Driven Development Convention"
description: Mandates TDD (Red→Green→Refactor) as the required practice for all code changes across the repository
category: explanation
subcategory: development
tags:
  - development
  - workflow
  - tdd
  - testing
  - red-green-refactor
created: 2026-05-02
---

# Test-Driven Development Convention

**Write the failing test first, then make it pass, then refactor** — Test-Driven Development
(TDD) is the required practice for all code changes in this repository. Red → Green → Refactor.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Writing
  a failing test first forces you to state the desired behavior explicitly before implementing it.
  Tests are a form of specification — they crystallize what "done" means before you start.
- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: Tests written
  after the fact often conform to the implementation rather than the requirement. Writing tests
  first ensures you verify the right behavior, not just that the current code runs without crashing.
- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**:
  TDD produces a growing automated test suite that replaces manual re-verification on every change.
- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: A
  test-first suite provides deterministic, reproducible verification of behavior for every future
  contributor and CI run.
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**:
  Test scenarios make expected behavior explicit and machine-checkable rather than understood only
  by the original author.

## Conventions Implemented/Respected

- **[Three-Level Testing Standard](../quality/three-level-testing-standard.md)**: TDD operates
  across all three levels — unit, integration, and E2E. The test you write first determines which
  level it belongs to based on scope.
- **[Acceptance Criteria Convention](../infra/acceptance-criteria.md)**: Gherkin acceptance
  criteria in plans are the natural starting material for the first failing tests in a feature.
  The chain is: Gherkin scenario → failing step implementation → passing implementation.
- **[Implementation Workflow Convention](./implementation.md)**: TDD is the mechanism that makes
  Stage 1 ("Make it work") verifiable. A failing test defines what "work" means; a passing test
  confirms it. Refactor only happens once tests are green, which maps directly to Stage 2 ("Make
  it right").

## Scope: Which Tests TDD Covers

TDD applies to **every level of automated and manual verification** that backs a behavioral
guarantee. Pick the level that best captures the behavior under change and write the failing
test there first. A single feature often spans multiple levels — write each level's first
failing test before the implementation for that level lands.

| Test level                       | What it covers                                                       | Tooling examples                                                             |
| -------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Unit**                         | A single function, class, or module in isolation; deps mocked        | Vitest, Go `testing` + Godog, JUnit, ExUnit, xUnit, Pytest, Hspec            |
| **Integration**                  | Real boundaries inside one process or one service                    | MSW, Godog with `//go:build integration`, real PostgreSQL via docker-compose |
| **E2E (UI + API)**               | Real HTTP, real browser, end-to-end flow across services             | Playwright (UI), Playwright API tests (HTTP), Pact-style contract checks     |
| **Contract**                     | API contracts (OpenAPI, Pact) — request/response shape and semantics | OpenAPI spec lint, codegen drift checks, contract round-trip tests           |
| **Property / fuzz**              | Invariants over generated inputs, not handwritten cases              | fast-check (TS), gopter (Go), QuickCheck-family in F#/Elixir/Rust            |
| **Snapshot / visual regression** | Stable rendered output (UI, generated docs)                          | Vitest snapshots, Playwright visual diff                                     |
| **Manual verification**          | Human-driven behavioral check that cannot or should not be automated | Playwright MCP browser session, `curl` for API, Storybook walkthrough        |
| **Performance / load**           | Latency, throughput, resource usage budgets                          | k6, Lighthouse CI, `nx run [project]:bench` targets                          |
| **Accessibility (a11y)**         | WCAG AA conformance, semantic HTML, focus order                      | axe, Storybook a11y addon, Playwright a11y assertions                        |
| **Security**                     | Authn/authz boundaries, input validation, OWASP-class regressions    | Targeted unit/integration tests, fuzz harnesses, security-focused E2E        |

**TDD rule for every level above**: write the failing check first, watch it fail for the
right reason, then implement to make it pass, then refactor.

### Manual verification is part of TDD

Manual verification is not a hand-wavy "click around and see." When TDD is applied to manual
work, the failing test is a **written, dated, repeatable verification script** that captures
the exact steps and expected observations. Treat it like an automated test:

1. **Red (write the script)**: Author a step-by-step script in the plan's `delivery.md` (or a
   linked checklist) — preconditions, steps, expected observations. Mark each expected
   observation as a discrete check. The script is "red" because the implementation does not
   yet satisfy it.
2. **Run the script**: Execute the steps using Playwright MCP for UI, `curl` for HTTP APIs,
   or whatever boundary tool fits. Confirm each expected observation fails (right reason).
3. **Green (implement)**: Make the minimum change needed for every check in the script to
   pass. Re-run the entire script. Every check must pass.
4. **Refactor**: Clean up the implementation; re-run the script to confirm it still passes.
5. **Promote when feasible**: If the script can be automated cheaply (Playwright spec,
   integration test), automate it as part of the same delivery item. Manual scripts that
   cover a recurring behavior are technical debt — automate them.

See [Manual Behavioral Verification Convention](../quality/manual-behavioral-verification.md)
for the script structure and tooling defaults (Playwright MCP for UI, `curl` for API).

### Picking the right level

When in doubt, prefer the cheapest test that meaningfully exercises the behavior:

- A pure function bug → unit test (fastest feedback, deterministic).
- A database query bug → integration test (real DB via docker-compose for `organiclever-be`,
  in-process mocks otherwise).
- A user-visible flow bug → E2E (Playwright) plus manual verification before merge.
- A contract change → contract test on the OpenAPI spec round-trip; both producer and
  consumer get failing tests first.

Do not duplicate coverage across levels for the same behavior. One TDD-shaped check per
behavior, at the right level, plus higher-level smoke coverage where flows cross boundaries.

## The Red-Green-Refactor Cycle

Every code change follows this loop:

1. **Red** — Write a failing test that captures the desired behavior. Run it and confirm it fails
   for the right reason (not due to a syntax error, missing import, or wrong test setup). A test
   that fails for the wrong reason is not a useful test.
2. **Green** — Write the minimum amount of code to make the failing test pass. Do not add behavior
   beyond what the test requires. Hard-code return values if that is the fastest path to green —
   the refactor step is for cleaning that up.
3. **Refactor** — With all tests green, improve the implementation: remove duplication, improve
   names, extract functions, apply clean-code principles. Tests must remain green after every
   refactor step. If they go red during refactoring, that is a bug introduced by the refactor, not
   a deliberate failure.

Repeat the cycle for the next behavior.

## Mini-TDD Passes

A single feature or bug fix does not require one large test up front. Split it into multiple small
Red→Green→Refactor cycles:

- Write the simplest scenario first (the happy path or the most constrained input).
- Pass it.
- Write the next scenario (an edge case, an error condition, a boundary).
- Pass it.
- Continue until all required behavior is covered.

This keeps each cycle short, observable, and safe to commit. A delivery checklist item like
"implement email validation" becomes a sequence of mini-cycles:

```
Red:   test "empty string is invalid"     → Green → Refactor
Red:   test "string without @ is invalid" → Green → Refactor
Red:   test "valid address is accepted"   → Green → Refactor
Red:   test "address without domain is invalid" → Green → Refactor
```

Each mini-cycle is independently committable. Prefer granular commits over one large "implement
feature" commit.

## Applying TDD to Plans

### Plan Creation (plan-maker)

When `plan-maker` authors a `delivery.md` checklist, items that ship code MUST be expressed as
TDD-shaped steps. Do not write "implement X, then write tests."

Write instead:

```markdown
- [ ] Write failing test for [behavior]
- [ ] Implement [behavior] to make test pass
- [ ] Refactor implementation (keep tests green)
```

Or, when one delivery item spans multiple mini-cycles, group them explicitly:

```markdown
- [ ] TDD cycle: [feature name]
  - [ ] Red: write failing test for happy path
  - [ ] Green: implement minimum code to pass
  - [ ] Red: write failing test for error path
  - [ ] Green: implement error handling to pass
  - [ ] Refactor: clean up, remove duplication
```

Acceptance criteria in `prd.md` are written as Gherkin scenarios (per the
[plan-writing-gherkin-criteria skill](../../../.claude/skills/plan-writing-gherkin-criteria/SKILL.md)).
Those Gherkin scenarios are the natural source of the first failing tests. The chain:

```
prd.md Gherkin scenario → first failing test → minimum implementation → refactor
```

`plan-checker` will flag delivery checklist items that reference code changes without a
corresponding test-first step as a HIGH finding.

### Plan Execution

`plan-executor` (the calling context orchestrating the plan-execution workflow) and all
language-specific `swe-*-dev` agents follow TDD when implementing delivery items:

- Before writing any production code for a checklist item, write a failing test.
- Confirm the test fails for the right reason.
- Write the minimum implementation to pass.
- Refactor.
- Run the full test suite (`nx run [project]:test:quick`) to confirm no regressions.

This applies inside subrepo worktrees too. The worktree execution context does not change the
TDD requirement.

## Enforcement

The pre-push hook runs `test:quick` for affected projects before every push. A code change with
no accompanying test will not be caught by the hook (the hook cannot detect missing tests), but
a test written first and then made to pass produces the artifact the hook checks. TDD is an
intent-level rule — CI is the safety net, not the primary enforcement mechanism.

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
  literal does not warrant a new test. The existing suite already covers the behavior.
- **Exploratory spikes**: Throwaway code written to learn an API or validate a hypothesis. Spikes
  are deleted before merging; they never enter `main`.
- **Configuration-only changes**: Changing a value in `nx.json`, `.prettierrc`, or
  `tsconfig.base.json` where no executable behavior is being altered.

Keep the exception list short. When in doubt, write the test first.

## Examples

### TypeScript (Vitest)

```typescript
// Red: write failing test
import { describe, it, expect } from "vitest";
import { calculateDiscount } from "./pricing";

describe("calculateDiscount", () => {
  it("applies 10% discount to positive price", () => {
    expect(calculateDiscount(100, 0.1)).toBe(90);
  });
});

// Run: npx nx run [project]:test:unit  → FAIL (calculateDiscount not defined)

// Green: implement minimum code
export function calculateDiscount(price: number, rate: number): number {
  return price * (1 - rate);
}

// Run: npx nx run [project]:test:unit  → PASS

// Refactor: add type guard, improve naming if needed — keep tests green
```

### Go (Godog / standard testing)

```go
// Red: write failing test
func TestCalculateDiscount(t *testing.T) {
    result := calculateDiscount(100, 0.1)
    if result != 90 {
        t.Errorf("expected 90, got %v", result)
    }
}

// Run: go test ./... → FAIL (calculateDiscount undefined)

// Green: implement
func calculateDiscount(price float64, rate float64) float64 {
    return price * (1 - rate)
}

// Run: go test ./... → PASS
```

### Gherkin-to-Test Chain (BDD)

For behavior driven by a Gherkin scenario in `prd.md`:

```gherkin
Scenario: 10% discount reduces price
  Given a product priced at 100
  When a 10% discount is applied
  Then the final price should be 90
```

This Gherkin scenario directly becomes the first failing step implementation (Godog for Go,
Playwright for E2E, Vitest describe/it for TypeScript). See
[plan-writing-gherkin-criteria skill](../../../.claude/skills/plan-writing-gherkin-criteria/SKILL.md)
and [Acceptance Criteria Convention](../infra/acceptance-criteria.md).

## Relationship to Implementation Workflow

TDD and the
[Implementation Workflow Convention](./implementation.md) are complementary, not competing:

| Implementation Stage    | TDD Role                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| Make it work (Stage 1)  | Red→Green: write failing test, then minimum passing code                 |
| Make it right (Stage 2) | Refactor with tests green; add tests for edge cases found during cleanup |
| Make it fast (Stage 3)  | Optimize with tests green; add performance assertions if needed          |

TDD does not add a fourth stage. It is the mechanism that makes each stage of the Implementation
Workflow verifiable and safe.

## Related Documentation

- [Implementation Workflow Convention](./implementation.md) - Three-stage workflow that TDD operates inside
- [Three-Level Testing Standard](../quality/three-level-testing-standard.md) - Where TDD-produced tests belong (unit, integration, E2E)
- [Acceptance Criteria Convention](../infra/acceptance-criteria.md) - Gherkin criteria as the source of first failing tests
- [plan-writing-gherkin-criteria skill](../../../.claude/skills/plan-writing-gherkin-criteria/SKILL.md) - Writing Gherkin scenarios that map to first failing tests
- [BDD Spec-to-Test Mapping Convention](../infra/bdd-spec-test-mapping.md) - Mandatory 1:1 mapping between specs and tests
- [Code Quality Convention](../quality/code.md) - Pre-push hooks that run the test suite TDD produces
