---
description: "Defines the expected behaviour for autonomous bug fixing, what autonomous means, handling failing CI tests, and preexisting errors found during other work."
when_to_use: Use when an agent discovers a bug or a failing test while doing unrelated work and must decide whether to fix it autonomously.
---

# Autonomous Bug Fixing

When given a bug report, fix it. Do not ask for hand-holding.

## Expected Behaviour

- Point at the error message, log output, or failing test
- Read the relevant code to understand the cause
- Apply the fix
- Verify the fix works
- Report what was done and why

## What Autonomous Means

Autonomous does not mean undisclosed. Agents must:

- Explain what root cause was found
- Describe the fix applied and why it addresses the root cause
- Report any edge cases considered
- Flag anything that warrants user awareness

Autonomous means no unnecessary questions when the path forward is clear. It does not mean working silently without communicating findings.

## Failing CI Tests

When CI tests fail, fix them without being told how. The steps are:

1. Read the test output to identify which tests fail and why
2. Read the failing test code and the code it tests
3. Determine the root cause (broken code, broken test, or environment issue)
4. Apply the fix
5. Verify locally before reporting completion

## Preexisting Errors Discovered During Other Work

Autonomous bug fixing applies not only when a bug report is the primary task, but also when broken state is discovered incidentally during any other work. An agent that opens a file to add a feature and finds a broken import, a failing test, or an incorrect configuration is responsible for fixing it.

The required behaviour is identical whether the error was assigned or discovered:

1. Diagnose the root cause before proceeding with the primary task
2. Fix the root cause — not around it, not in a note at the end of a response
3. Verify the fix works
4. Communicate what was found and what was fixed

Scope judgment determines commit strategy: small fixes go inline, medium fixes get their own commit, large fixes require a plan in `plans/in-progress/` with execution underway. A defect in a pinned upstream tool is fixed at its owner instead, per [Upstream Tool Defects](../../workflow/upstream-tool-defects.md).

See [Proactive Preexisting Error Resolution](../../../development/practice/proactive-preexisting-error-resolution.md) for the full practice including the three anti-patterns to avoid (acting ignorant, monkey-patching, passive mentioning) and the complete agent checklist.
