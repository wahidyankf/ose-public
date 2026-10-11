---
description: Turning tasks into verifiable goals with measurable success criteria, and planning multi-step tasks with per-step verification.
when_to_use: Use when starting a task and turning a vague request into a measurable success criterion before writing code.
---

# Goal-Driven Execution — Defining and Planning Goals

## Principle: Define Success Criteria, Loop Until Verified

Transform every task into verifiable goals with clear success criteria.

**Core Process**:

1. **Define the goal** with measurable success criteria
2. **Execute** the implementation
3. **Verify** against success criteria
4. **Loop** until verification passes

## Transforming Tasks into Verifiable Goals

**Pattern**: `[Task]` → `[Verifiable Goal with Test]`

### Example Transformations

**Task: "Add validation"**

```
❌ Weak: "Add validation" (what counts as success?)
✅ Strong: "Write tests for invalid inputs (empty string, null, malformed), then make them pass"
```

**Task: "Fix the bug"**

```
❌ Weak: "Fix the bug" (how do you know it's fixed?)
✅ Strong: "Write a test that reproduces the bug, verify it fails, then make it pass"
```

**Task: "Refactor X"**

```
❌ Weak: "Refactor X" (how do you verify it's safe?)
✅ Strong: "Run named affected-boundary cases before and after refactoring; preserve their behaviour"
```

**Task: "Optimize performance"**

```
❌ Weak: "Make it faster" (faster by how much?)
✅ Strong: "Measure current performance, optimize, measure again, verify ≥20% improvement"
```

Refactor selections and phase/pre-PR full regression follow
[Focused Runs and Regression Gates](../test-driven-development/the-red-green-refactor-cycle.md#focused-runs-and-regression-gates).

## Multi-Step Task Planning

For complex tasks, state a brief plan with verification steps.

**Format**:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

### Example: Adding Authentication

**Plan**:

```
1. Add login endpoint → verify: curl returns 200 for valid credentials, 401 for invalid
2. Add JWT generation → verify: token decodes correctly and contains user ID
3. Add auth middleware → verify: protected routes reject requests without valid token
4. Add logout endpoint → verify: invalidated tokens are rejected
```

Each step has a clear, testable verification criterion.

## Strong vs Weak Success Criteria

| Weak (requires clarification) | Strong (enables independent work)                                              |
| ----------------------------- | ------------------------------------------------------------------------------ |
| "Make it work"                | "All tests pass and API returns expected JSON"                                 |
| "Add error handling"          | "Invalid input returns 400 with error message, network errors retry 3x"        |
| "Improve UX"                  | "Form validation shows errors on blur, submit disabled until valid"            |
| "Update docs"                 | "README has install steps, example usage, and API reference"                   |
| "Deploy"                      | "Application accessible at URL, health check returns 200, logs show no errors" |

**Key difference**: Strong criteria let you verify success independently. Weak criteria require asking "Is this what you meant?"
