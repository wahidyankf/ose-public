---
title: "Proactive Preexisting Error Resolution"
description: When encountering preexisting errors, bugs, or broken state during any work, fix the root cause rather than ignoring, monkey-patching, or passively mentioning the problem
category: explanation
subcategory: development
tags:
  - root-cause
  - quality
  - preexisting-errors
  - proactive
  - bug-fixing
  - ai-agents
created: 2026-03-28
---

# Proactive Preexisting Error Resolution

When you encounter a preexisting error, broken test, incorrect configuration, or degraded code during your work — fix the root cause. Not around it. Not after it. Not in a note at the bottom of a PR description. Fix it now.

This practice extends [Root Cause Orientation](../../principles/general/root-cause-orientation.md) from governing assigned bug reports to also governing errors discovered incidentally during other work: every encounter with broken state is an obligation to leave the codebase healthier than you found it.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: The foundational requirement is to find root causes and fix them properly. This practice operationalizes that requirement for errors encountered incidentally — not only when given a direct bug report.

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Encountering broken state and continuing anyway is the opposite of deliberate. Recognizing and resolving the problem before proceeding is the deliberate choice.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Monkey-patching adds layers of complexity that obscure the real problem. A proper root cause fix is almost always simpler in the long run than a workaround that accumulates alongside the original defect.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Agents that fix errors autonomously reduce the human overhead of maintaining a backlog of known-but-unresolved problems. Every passively mentioned issue that lands in a backlog requires human triage, scheduling, and re-investigation.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: When fixing preexisting errors in documentation — broken links, incorrect headings, outdated examples — the same root cause standard applies. The fix belongs in the document, not in a review comment.

## Why This Matters

### The Backlog Problem

Mentioning without fixing creates an ever-growing list of known-but-unresolved problems. Each item requires human triage to schedule, re-investigation to understand, and context-switching to execute. A codebase that accumulates acknowledged defects degrades trust and slows all contributors.

Every encounter with a preexisting error is a zero-cost opportunity: the relevant code is already open, the context is already loaded, the root cause is either understood or discoverable with minimal effort. That opportunity expires the moment the context window closes.

### The Monkey-Patch Problem

Working around a preexisting problem adds a second layer of code on top of a broken first layer. Both layers now exist in the codebase. The original problem is still there. Future contributors encounter both the workaround and the underlying defect without understanding the relationship between them.

Monkey-patches compound. A patch on a patch on a patch is a codebase that nobody can reason about safely.

### The Normalization Problem

Ignoring preexisting errors normalizes broken state. When broken tests, dead links, or failing configurations persist without resolution, they signal that degraded state is acceptable. That signal travels to every contributor who reads the code. Quality bars drift downward.

## The Three Anti-Patterns

### Anti-Pattern 1: Acting Ignorant

Seeing broken state and proceeding as if it does not exist.

**Example**: A CI test has been failing intermittently for two weeks. You re-run the pipeline three times hoping the flake clears. It clears. You move on without investigating why the test fails.

**What happened**: The root cause — a race condition in the test setup — remains. The next CI run will fail again. The next developer will re-run it three times too.

**What to do instead**: Read the test output. Understand the actual failure mode. Fix the test or the code it tests. Verify locally. Commit the fix.

---

**Example**: You open a file to add a feature and notice a broken import reference from a previous refactor. The import is unused in the code path you are touching. You add your feature and ignore the broken import.

**What to do instead**: Fix the broken import. It takes thirty seconds and it removes a latent error before it causes a runtime failure.

### Anti-Pattern 2: Monkey-Patching

Working around the problem instead of solving it.

**Example**: An upstream API contract changed and now a call throws an exception on certain inputs. You wrap the call in a `try/catch` that swallows the exception and returns a default value. The contract mismatch remains; the error is now hidden.

**What to do instead**: Update the contract, fix the call site, and regenerate types if applicable. The swallowed exception will resurface as a data integrity problem downstream.

---

**Example**: A configuration file has an incorrect base URL that causes integration tests to fail. You hardcode the correct URL in the test setup to make the tests pass.

**What to do instead**: Fix the configuration file. The incorrect base URL will break other consumers of that configuration in production.

### Anti-Pattern 3: Passive Mentioning

Noting the problem without taking action.

**Example**: A PR description contains: "Note: I noticed the validation function in `user-service.ts` has a bug where empty strings pass validation. This is pre-existing and unrelated to this PR."

**What happened**: The bug is now documented and still present. The reviewer reads the note, acknowledges it, and merges. The bug is added to a backlog where it waits indefinitely.

**What to do instead**: Fix the validation function. Add a test that covers the empty string case. Include it in the same PR or a separate commit within the same session with a clear commit message explaining the preexisting bug that was found.

## The Expected Behavior

### 1. Diagnose

Before touching anything, understand the root cause of the preexisting error. Read the relevant code, test output, or configuration. Do not guess. Do not assume the fix is obvious without verification.

### 2. Fix

Apply a proper root cause fix. Not a workaround. Not a suppression. Not a TODO comment.

### 3. Verify

Confirm the fix works. Run the affected tests. Check that the configuration loads correctly. Verify the link resolves. Evidence of a working fix is required before proceeding.

### 4. Scope

If the fix is small enough to complete within a few minutes, fix it inline as part of your current work. If it requires its own commit for clarity, make a separate commit with a descriptive commit message explaining the preexisting bug that was resolved.

If the fix is too large to address within the current session — an architectural issue or a systemic problem — create a plan and begin executing it. Do not defer it to "someday." A plan that gets executed is categorically different from a noted issue that sits in a backlog.

### 5. Communicate

Explain what was found and what was fixed. Transparency is not optional. The communication belongs in the commit message, PR description, or conversation — wherever the context lives.

## Scope Judgment

### Small Fixes (fix inline)

These require no separate commit and no deliberation:

- Broken links in documentation
- Incorrect or outdated configuration values
- Dead imports or unused variables created by a previous refactor
- Typos in error messages or comments
- Minor validation gaps (empty string edge cases, null checks)

Fix these as part of your current work. They take seconds to minutes.

### Medium Fixes (fix in a separate commit)

These warrant their own commit but belong in the current session:

- Broken tests (failing or flaking)
- Incorrect implementations that produce wrong results on valid inputs
- Incorrect contracts between modules
- Environment configuration that fails on standard inputs

Fix these within the current session. Write a commit message that references the preexisting bug, for example: `fix(user-service): validate empty strings in user input (preexisting bug)`.

### Large Fixes (create a plan and execute it)

These require more than a single commit:

- Architectural problems where the wrong abstraction is used throughout a module
- Systemic configuration issues affecting multiple services
- Test suites with fundamental structural problems (testing implementation instead of behavior)

Create a plan in `plans/in-progress/` and begin executing it. The presence of a plan does not defer the work — it organizes it. Execution starts immediately.

## Checklist

Before considering any work complete:

- [ ] All preexisting errors encountered during this work have been diagnosed
- [ ] Each error has a root cause fix, not a workaround or suppression
- [ ] Each fix has been verified to work
- [ ] Small fixes are committed inline or as part of the current changeset
- [ ] Medium fixes have their own commit with a descriptive message
- [ ] Large fixes have a plan in `plans/in-progress/` with execution underway
- [ ] All findings and fixes have been communicated clearly

## For AI Agents

All agents encountering preexisting errors must follow this practice:

1. **Diagnose the root cause** before proceeding with the primary task
2. **Fix the root cause**, not the symptom, not around the symptom
3. **Verify the fix works** with the relevant tests or checks
4. **Scope the fix appropriately**: inline for small issues, separate commit for medium issues, plan for large issues
5. **Communicate what was found and what was fixed** — never proceed in silence

### What Agents Must Not Do

- Continue working on a primary task while leaving a discovered preexisting error unfixed
- Add a workaround that makes a broken system appear to work
- Write "I noticed X is broken" in a response without taking action on X
- Re-run a failing test hoping it passes without investigating the failure

### Relationship to Autonomous Bug Fixing

[Autonomous Bug Fixing](../agents/agent-workflow-orchestration.md#autonomous-bug-fixing) covers what to do when a bug report is the primary task. This practice covers what to do when a preexisting error is discovered incidentally during other work. Both require the same behavior: diagnose, fix, verify, communicate.

The distinction is task origin. The behavior is identical.

## Related Documentation

- [Root Cause Orientation](../../principles/general/root-cause-orientation.md) - The foundational principle this practice extends into proactive action
- [Implementation Workflow](../workflow/implementation.md) - Development workflow that includes surgical changes and goal-driven execution
- [Agent Workflow Orchestration](../agents/agent-workflow-orchestration.md) - How agents plan, execute, verify, and fix bugs autonomously
- [Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md) - Think before acting; surface assumptions; do not proceed on broken foundations
- [Git Push Default Convention](../workflow/git-push-default.md) — Domain-specific application of Standard 4 (fix preexisting unsolicited PR steps when encountered in delivery checklists)
