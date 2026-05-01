---
title: "Agent Workflow Orchestration Convention"
description: Standards for how AI agents plan, execute, verify, and self-improve during multi-step tasks
category: explanation
subcategory: development
tags:
  - ai-agents
  - workflow
  - orchestration
  - planning
  - verification
  - subagents
created: 2026-03-09
---

# Agent Workflow Orchestration Convention

This document defines how AI agents plan, execute, verify, and improve their work during multi-step tasks. It covers when to enter plan mode, how to use subagents, how to manage task state, and how to verify completion before declaring a task done.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Plan mode requires agents to think before acting. Breaking complex tasks into steps with verification criteria prevents hidden confusion from propagating through multi-step work.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: Verification before done enforces the senior engineer standard. The self-improvement loop demands root cause analysis after any mistake rather than moving on.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Subagents keep the main context clean by offloading focused subtasks. One task per subagent prevents multi-purpose subagents that are harder to reason about.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Autonomous bug fixing eliminates unnecessary user hand-holding. Agents run tests, read logs, and resolve failures without requiring step-by-step instruction.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Plan documents and lessons files follow active voice, clear structure, and actionable content - not vague notes.

- **[CI Monitoring Convention](../workflow/ci-monitoring.md)**: Agents performing post-push CI verification MUST check every 3-5 minutes via `ScheduleWakeup(delaySeconds=180)` + one `gh run view` per wakeup. `gh run watch` is only safe for jobs <5 min (it polls every ~3s and exhausts the 5,000 req/hour quota on longer jobs). Manual tight-loop polling is forbidden. When rate-limited (HTTP 403): `ScheduleWakeup(delaySeconds=2100)` — not a retry loop.

## When to Plan

Enter plan mode for any non-trivial task. A task is non-trivial if it meets any of these criteria:

- Three or more distinct steps are required
- The task involves architectural decisions or file structure choices
- Multiple files or components will be changed
- The correct approach is not immediately obvious from the request

**When not to plan**: Simple, obvious fixes with a single step and no ambiguity. Documenting a plan for "fix this typo" wastes time without adding clarity.

### Plan Format

Write the plan as a checklist in `local-temp/todo.md`. Each item should be independently verifiable.

```
## Plan: [Brief task description]

- [ ] Step 1 → verify: [how you will know this is done]
- [ ] Step 2 → verify: [how you will know this is done]
- [ ] Step 3 → verify: [how you will know this is done]

## Review

[Added after completion: what worked, what did not, what would change]
```

**Verify before starting implementation**: For significant architectural decisions, check in before executing. For straightforward multi-step tasks, proceed with the plan.

### Re-planning When Things Go Wrong

Stop and re-plan when the current approach is not working. The signal to re-plan is when:

- Multiple consecutive steps produce unexpected results
- A fundamental assumption in the plan turns out to be false
- The approach is technically feasible but increasingly complex

Do not keep pushing forward hoping the situation improves. Stopping to re-plan is faster than accumulating a chain of workarounds.

## Subagent Strategy

Use subagents to keep the main context window focused and clean.

### When to Use Subagents

Offload work to subagents when:

- **Research and exploration**: Reading many files to understand a codebase section, gathering facts before a decision
- **Parallel analysis**: Multiple independent questions can be answered simultaneously
- **Complex subtasks**: A subtask is large enough to have its own plan

### Subagent Rules

- **One task per subagent**: Each subagent has a single, focused responsibility. Do not bundle multiple concerns into one subagent
- **Use fork skills for structured delegation**: When the task fits a known skill pattern, prefer fork skills over ad hoc subagent invocation
- **Return summarized results**: Subagents return findings, not raw dumps. The main conversation receives what it needs to make decisions, not everything the subagent read

### When Not to Use Subagents

Do not spawn a subagent for simple reads or lookups that take one or two tool calls. The overhead is not worth it for small operations.

## Verification Before Done

Never declare a task complete without proving it works.

### Verification Requirements

Before marking any task complete:

1. **Run the relevant tests** - If code changed, tests must pass
2. **Check logs for errors** - Silent failures are still failures
3. **Demonstrate the behavior** - Show that the output matches the requirement, not just that the code was written
4. **Apply the senior engineer test** - Ask "would a senior engineer approve this?" If not, keep working

### Verification for Different Task Types

| Task Type            | Verification Method                                         |
| -------------------- | ----------------------------------------------------------- |
| Code change          | Run `nx run [project]:test:quick`, check no regressions     |
| Documentation update | Verify links work, content renders correctly                |
| Bug fix              | Show the failing test now passes; existing tests still pass |
| Refactor             | All tests pass before and after; behavior unchanged         |
| New feature          | Tests cover the new behavior; edge cases handled            |

### Diffs and Behavior Comparison

When a change might have unintended side effects, compare behavior before and after. This is especially relevant for:

- Changes to shared utilities used by many consumers
- Changes to configuration that affects build or test behavior
- Refactors touching core logic

## Autonomous Bug Fixing

When given a bug report, fix it. Do not ask for hand-holding.

### Expected Behavior

- Point at the error message, log output, or failing test
- Read the relevant code to understand the cause
- Apply the fix
- Verify the fix works
- Report what was done and why

### What Autonomous Means

Autonomous does not mean undisclosed. Agents must:

- Explain what root cause was found
- Describe the fix applied and why it addresses the root cause
- Report any edge cases considered
- Flag anything that warrants user awareness

Autonomous means no unnecessary questions when the path forward is clear. It does not mean working silently without communicating findings.

### Failing CI Tests

When CI tests fail, fix them without being told how. The steps are:

1. Read the test output to identify which tests fail and why
2. Read the failing test code and the code it tests
3. Determine the root cause (broken code, broken test, or environment issue)
4. Apply the fix
5. Verify locally before reporting completion

### Preexisting Errors Discovered During Other Work

Autonomous bug fixing applies not only when a bug report is the primary task, but also when broken state is discovered incidentally during any other work. An agent that opens a file to add a feature and finds a broken import, a failing test, or an incorrect configuration is responsible for fixing it.

The required behavior is identical whether the error was assigned or discovered:

1. Diagnose the root cause before proceeding with the primary task
2. Fix the root cause — not around it, not in a note at the end of a response
3. Verify the fix works
4. Communicate what was found and what was fixed

Scope judgment determines commit strategy: small fixes go inline, medium fixes get their own commit, large fixes require a plan in `plans/in-progress/` with execution underway.

See [Proactive Preexisting Error Resolution](../../development/practice/proactive-preexisting-error-resolution.md) for the full practice including the three anti-patterns to avoid (acting ignorant, monkey-patching, passive mentioning) and the complete agent checklist.

## Demand Elegance (Balanced)

For non-trivial changes, pause and ask: "Is there a more elegant way to do this?"

If a solution feels hacky, reframe the task: "Knowing everything I now know, what is the elegant solution?" Then implement that instead.

**When to skip this step**: Simple, obvious fixes with a single clear approach. Do not over-engineer a one-line correction.

**Elegance is not complexity**: The more elegant solution is usually simpler, not more abstract. The question is whether the current approach is unnecessarily convoluted, not whether a more sophisticated pattern could be applied.

## Self-Improvement Loop

After any correction from the user, extract the lesson.

### The Process

1. **Identify the pattern**: What category of mistake was made? (misread requirement, wrong assumption, insufficient verification, scope creep, etc.)
2. **Write a rule**: Write a concrete rule in `local-temp/lessons.md` that would prevent this mistake
3. **Iterate**: After repeated mistakes of the same type, revise the rule until the mistake stops occurring
4. **Review at session start**: Check `local-temp/lessons.md` at the beginning of work on a project to activate relevant lessons

### Lessons File Format

```markdown
## Lessons

### [Date] - [Category]

**Mistake**: [What went wrong]
**Rule**: [Specific, actionable rule to prevent recurrence]
**Context**: [What triggered this lesson]
```

### What Makes a Good Lesson

A useful lesson is specific and actionable:

```
FAIL: "Be more careful when reading requirements."

PASS: "When a requirement says 'update the index', read the existing index first
      to understand its structure before making changes. Assumptions about format
      have caused overwrites twice."
```

Rules that are too general provide no guidance when the situation arises again. Rules that name the specific failure mode and the specific check to perform are actionable.

## Task Management

### Plan First

Write the plan before starting implementation. This is not optional for non-trivial tasks.

### Track Progress

Mark items complete as you go. An updated checklist shows what has been done and what remains. This matters when tasks are interrupted or when reporting progress.

### Use Granular Task Items

Each item in a task list or plan checklist must represent one independently completable unit of work. This applies to `local-temp/todo.md` plans and to any checklist an agent produces in delivery plans.

**Rule**: One item = one concrete action. Never bundle multiple steps behind a single checkbox.

**Bad** (too coarse):

```markdown
- [ ] Add coverage merging with all formats and tests
```

**Good** (granular):

```markdown
- [ ] Create `internal/testcoverage/merge.go` with format-agnostic merge logic
- [ ] Implement `CoverageMap` type for normalized per-line data
- [ ] Add parsers to return `CoverageMap` from each format
- [ ] Write unit tests for merge logic (same format, cross-format, overlapping)
```

**Why this matters**:

- Progress visibility during long-running operations — each completed item is observable progress
- Resume capability when context is compacted — a granular list shows exactly where execution stopped
- Clear audit trail — coarse items leave ambiguity about what was actually done

**Test for granularity**: Can you verify the item is done without completing anything else on the list? If the answer is no, split it.

### Use the Task Tool for Multi-Step Work

When working on tasks with multiple steps, agents MUST use `TaskCreate` and `TaskUpdate` to track progress programmatically. This is in addition to updating markdown checklists.

- **TaskCreate**: Create a task for each granular work item before starting
- **TaskUpdate** (`in_progress`): Mark the task when you begin working on it
- **TaskUpdate** (`completed`): Mark the task when it is done

This provides real-time progress tracking that survives context compaction and makes the agent's work observable to the user without needing to read files.

### Document Results

Add a review section to `local-temp/todo.md` after completing the task. The review captures:

- What the task accomplished
- Any significant decisions made during execution
- Anything that should inform future similar tasks

### Capture Lessons

After any correction, update `local-temp/lessons.md`. This is the direct application of the self-improvement loop to task management.

## Anti-Patterns

### Pushing Through When Lost

**Problem**: Continuing to implement when the approach is clearly not working, hoping it resolves itself.

**Why it fails**: Each step based on a flawed premise compounds the problem. Re-planning from a known-good state is always faster than accumulating a chain of adjustments to a broken foundation.

**Fix**: Stop. Re-plan. State explicitly what assumption failed and what the revised approach is.

### Premature Completion

**Problem**: Declaring a task done when tests pass, without verifying the actual behavior.

**Why it fails**: Tests are necessary but not sufficient. Verification requires demonstrating that the correct behavior is present, not just that no existing test fails.

**Fix**: After tests pass, demonstrate the behavior directly. Read the output. Confirm it matches the requirement.

### Context Bloat

**Problem**: Conducting extensive research and exploration in the main context rather than using subagents.

**Why it fails**: The main context fills with details that were needed for the research but are not needed for the decision. This degrades the quality of subsequent reasoning.

**Fix**: Offload research to subagents. Return only the findings needed to make the decision.

### Vague Lessons

**Problem**: Writing lessons that describe the mistake in general terms without specifying a concrete preventive action.

**Why it fails**: A vague lesson is easy to write and easy to ignore. When the same situation arises, the lesson provides no actionable check.

**Fix**: Write rules that name the specific trigger and the specific check. Test the rule against the original failure: "Would this rule have prevented the mistake?"

## References

**Related Principles:**

- [Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md) - Think before acting; surface assumptions
- [Root Cause Orientation](../../principles/general/root-cause-orientation.md) - Fix root causes; minimal impact; senior engineer standard
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) - Simple subagent structures; focused responsibilities

**Related Practices:**

- [Implementation Workflow](../workflow/implementation.md) - Make it work, make it right, make it fast; surgical changes; goal-driven execution
- [Maker-Checker-Fixer Pattern](../pattern/maker-checker-fixer.md) - Multi-agent orchestration for content quality workflows
- [AI Agents Convention](./ai-agents.md) - Agent structure, frontmatter, and tool access standards
- [Skill Context Architecture](./skill-context-architecture.md) - Inline vs fork skills for subagent delegation
- [CI Post-Push Verification Convention](../workflow/ci-post-push-verification.md) - Trigger and monitor CI after every push; required final step in plan execution
- [CI Monitoring Convention](../workflow/ci-monitoring.md) - Check every 3-5 min via ScheduleWakeup; `gh run watch` only for <5 min jobs; rate-limit recovery uses `ScheduleWakeup(delaySeconds=2100)`

**Related Agents / Workflows:**

- `plan-maker` - Creates structured plans following the plan format in this convention
- [plan-execution workflow](../../workflows/plan/plan-execution.md) - Execute plans with progress tracking and verification (calling context orchestrates; no dedicated subagent)
