---
title: "Root Cause Orientation"
description: Find root causes and fix them properly - no temporary fixes, no laziness, senior engineer standards
category: explanation
subcategory: principles
tags:
  - principles
  - quality
  - root-cause
  - senior-engineer
  - minimal-impact
created: 2026-03-09
---

# Root Cause Orientation

Find root causes and fix them properly. No temporary patches. No workarounds that paper over underlying problems. Changes should touch only what is necessary to solve the actual problem - nothing more, nothing less.

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of building trustworthy, long-lived Shariah-compliant enterprise systems.

**How this principle serves the vision:**

- **Trustworthy Financial Systems**: Islamic finance applications handle real transactions with religious obligations. Temporary fixes that hide underlying problems erode trust and can cause compliance failures that are difficult to trace
- **Sustainable Open Source**: A codebase held together by patches accumulates technical debt faster than contributors can address it. Root cause fixes make the codebase accessible and maintainable by a broad community
- **Auditability**: Shariah compliance requires clear, traceable logic. Workarounds obscure intent and make audits harder. Properly resolved problems leave the system in a state that can be understood and verified
- **Long-Term Democratization**: Systems that degrade through accumulated hacks become inaccessible to junior contributors. Proper fixes keep the codebase approachable to anyone who wants to participate

**Vision alignment**: Democratizing Shariah-compliant enterprise depends on building systems that remain understandable, trustworthy, and maintainable over time. Root cause orientation is what makes that possible.

## Principle

**Fix the actual problem. Touch only what is necessary. Hold yourself to the standard a senior engineer would approve.**

Three inseparable ideas form this principle:

1. **Root causes, not symptoms** - Diagnose before acting. Never apply a workaround when the underlying problem can be resolved properly
2. **Minimal impact** - Changes should affect only the code, files, or configuration required to solve the problem. Unrelated code is left alone
3. **Senior engineer standard** - Before considering a task complete, ask: "Would a senior engineer approve this?" If the answer is no, keep working

## Why This Matters

Ignoring root causes produces compounding problems:

- **Symptom fixes hide real failures** - The underlying issue remains, ready to surface again under different conditions
- **Patches multiply** - Each workaround often requires another workaround, increasing complexity and coupling
- **Minimal impact violations spread bugs** - Changes that touch unrelated code introduce regressions that are difficult to associate with the original task
- **Low standards normalize mediocrity** - Accepting "good enough" work sets a baseline that degrades over time

Root cause orientation prevents these failure modes by demanding proper analysis before action and restraint in scope.

## Core Practices

### 1. Diagnose Before Acting

**Do**: Understand the actual cause of the problem before writing any fix.

**Don't**: Apply the first change that makes the symptom disappear.

```
PASS: "The test fails because the function returns nil when the input map has no key.
       I'll add a guard for the missing-key case and return a proper default."

FAIL: "The test fails. I'll catch the nil pointer and return an empty string to stop the crash."
```

**Diagnosis checklist**:

- What is the exact failure mode? (error message, wrong output, crash)
- What code path produces this failure?
- What is the root cause of that path being taken?
- Is the fix I'm considering addressing the cause or masking the symptom?

### 2. Apply Minimal Impact Changes

**Do**: Change exactly what needs to change to solve the root cause.

**Don't**: Improve adjacent code, rename things you disagree with, or refactor while fixing.

```
PASS: Fix the one function that incorrectly handles the edge case.

FAIL: Fix the function AND rename variables you find unclear AND restructure the file
      because it seemed like a good opportunity.
```

**Minimal impact rules**:

- Every changed line traces directly to the problem being solved
- Unrelated code is left in its current state, even if it could be improved
- Unrelated code improvements (style, refactoring, naming) that are noticed are mentioned, not silently applied. Exception: preexisting errors and broken state are fixed at root cause per [Proactive Preexisting Error Resolution](../../development/practice/proactive-preexisting-error-resolution.md)
- Style preferences are not applied to unchanged lines

See [Implementation Workflow - Surgical Changes](../../development/workflow/implementation.md#surgical-changes) for detailed guidance on applying minimal impact in practice.

### 3. Hold to Senior Engineer Standards

**Do**: Ask "would a senior engineer approve this?" before declaring a task complete.

**Don't**: Ship the first solution that passes the test or satisfies the literal requirement.

```
PASS: The fix handles the immediate case, all edge cases, does not break existing behavior,
      and does not introduce unnecessary complexity.

FAIL: The fix passes the test. Moving on.
```

**Senior engineer test questions**:

- Does this solution handle edge cases, or only the specific case that triggered the bug?
- Is this the simplest correct solution, or just the fastest one to write?
- Will this solution hold up under different conditions, or will the problem resurface?
- Does this change introduce new coupling or complexity that will need to be resolved later?

## Relationship to Other Principles

- **[Deliberate Problem-Solving](./deliberate-problem-solving.md)**: Diagnosing root causes requires the same deliberate analysis that problem-solving demands. The two principles reinforce each other - deliberate analysis is how you find the root cause
- **[Simplicity Over Complexity](./simplicity-over-complexity.md)**: Proper root cause fixes are often simpler than accumulations of workarounds. Minimal impact changes prevent scope creep that adds unnecessary complexity
- **[Explicit Over Implicit](../software-engineering/explicit-over-implicit.md)**: Root cause orientation demands explicit understanding of the problem before acting - no implicit assumptions about what the fix "should" be

## Application Examples

### Example 1: Bug Fix

**Situation**: A validation function rejects valid inputs in one specific case.

**FAIL - Symptom fix**:

```
Add a special case: "if input equals X, skip validation and return true"
```

This makes the test pass but hides the fact that the validation logic is wrong.

**PASS - Root cause fix**:

```
Identify why the validation rejects input X. The regex pattern is too strict - it
does not account for a valid format variant. Fix the regex to correctly accept all
valid inputs, including X.
```

### Example 2: Cascading Failure

**Situation**: A downstream service fails when the upstream returns an unexpected shape.

**FAIL - Symptom fix**:

```
Wrap the downstream call in try/catch and return a default value on failure.
```

The upstream contract is broken; swallowing the error means no one knows.

**PASS - Root cause fix**:

```
Identify that the upstream changed its response shape without updating the contract.
Fix the contract, update both sides, add a test that would catch shape mismatches
in the future.
```

### Example 3: Scope Creep

**Situation**: Fixing a bug in a payment calculation function while noticing other functions in the file could be simplified.

**FAIL - Minimal impact violation**:

```
Fix the bug AND refactor the three other functions because "they're in the same file
and I have context."
```

**PASS - Minimal impact**:

```
Fix only the payment calculation bug. Note in the PR description that other functions
in the file could be simplified in a follow-up task.
```

## Verification Checklist

Before declaring a task complete:

- [ ] The actual root cause has been identified, not just the symptom
- [ ] Every changed line traces directly to the problem being solved
- [ ] No unrelated code has been modified
- [ ] All edge cases related to the root cause are handled
- [ ] A senior engineer would approve the approach and the scope
- [ ] Preexisting errors encountered during this work have been fixed at root cause, not mentioned and deferred

## For AI Agents

All agents must follow this principle by:

1. **Diagnosing before acting** - Read the relevant code and understand the actual cause before proposing changes
2. **Scoping precisely** - Limit changes to what the task requires; do not improve adjacent code
3. **Applying the senior engineer test** - Evaluate solutions against what a senior engineer would approve, not just what makes tests pass
4. **Proactively fixing preexisting errors** - When encountering preexisting bugs, broken tests, or incorrect configurations, fix the root cause rather than mentioning without action or working around the problem. See [Proactive Preexisting Error Resolution](../../development/practice/proactive-preexisting-error-resolution.md) for the full practice including scope judgment and agent requirements.

See [Implementation Workflow - Surgical Changes](../../development/workflow/implementation.md#surgical-changes) for the detailed surgical changes practice that implements minimal impact for software changes.

See [Agent Workflow Orchestration](../../development/agents/agent-workflow-orchestration.md) for how this principle applies to planning, verification, and autonomous work in multi-step agent tasks.

## Related Documentation

- [Deliberate Problem-Solving](./deliberate-problem-solving.md) - Think before coding; surface assumptions and tradeoffs
- [Simplicity Over Complexity](./simplicity-over-complexity.md) - Minimum viable changes; avoid over-engineering
- [Implementation Workflow](../../development/workflow/implementation.md) - Three-stage workflow with surgical changes practice
- [Agent Workflow Orchestration](../../development/agents/agent-workflow-orchestration.md) - How this principle applies to AI agent task execution
- [Proactive Preexisting Error Resolution](../../development/practice/proactive-preexisting-error-resolution.md) - Practice extending this principle: fix preexisting errors on encounter rather than noting and deferring
