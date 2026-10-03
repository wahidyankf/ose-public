---
description: Walks through four invocation examples (default, reduced cycles, from backlog, quick validation) and one full cycle trace.
when_to_use: Use when learning how to invoke plan execution with different arguments, or tracing a typical execute-validate cycle.
---

# Example Usage

## Execute Plan with Default Settings

```
User: "Execute plan plans/in-progress/new-feature/plan.md"
```

The calling context orchestrates directly and invokes specialized agents via the Agent tool (default max 3 cycles):

- Read delivery checklist and materialize 1:1 Task list in the calling context
- Delegate each item to the appropriate specialized agent (e.g., `swe-developer`)
- Tick checkboxes progressively as each item completes (Atomic Sync Ritual)
- Validate implementation by invoking `plan-execution-checker` delegated agent
- Repeat, at most three cycles, until no blocking finding remains and all deliverables complete
- Move plan folder to plans/done/ on success

## Execute with Fewer Cycles

```
User: "Execute plan plans/in-progress/complex-migration/plan.md with max-cycles=2"
```

The AI will invoke agents with a reduced cycle limit:

- Allow up to 2 execute-validate cycles; three is the ceiling
- A plan still blocked after its last cycle ends `partial`, never with another cycle

## Execute Plan from Backlog

```
User: "Execute plan plans/backlog/future-feature/plan.md"
```

The AI runs Step 0 before any implementation begins. With the default `worktree-to-pr` mode, it:

- Resolves the delivery mode and confirms the repository restrictions.
- Creates a dedicated worktree branch from current `origin/main`.
- Moves `plans/backlog/future-feature/` to `plans/in-progress/future-feature/` and updates the two
  required indexes, with no implementation or ride-along changes.
- Pushes the branch, opens the pure-move PR, completes its PR quality gate, and merges it into
  `origin/main`.
- Refreshes the implementation branch from that merge, resolves `plan-path` to
  `plans/in-progress/future-feature/plan.md`, and continues with Step 1.
- Implement plan requirements via orchestrated specialized agents
- Won't move to done while a blocking finding remains
- Plan archived to plans/done/ only on complete success

Only a selected direct-push mode that the repository permits replaces the promotion PR with a
direct push. Execution never runs from `plans/backlog/`; see the canonical
[Starting Work procedure](../../../conventions/structure/plans/starting-and-completing-work.md#starting-work).

## Quick Validation Only

```
User: "Execute plan plans/in-progress/new-feature/plan.md with max-cycles=1"
```

The AI will invoke agents for a single cycle:

- Single execute-validate cycle
- Reports findings without a further cycle
- Useful for quick validation pass

## Iteration Example

Typical execution flow:

```
Step 1: Load checklist — 12 items across 3 phases, 12 tasks created

Step 2: Execute all items sequentially
  Phase 1 (Infrastructure):
    Item 1 → swe-developer → checkbox ticked
    Item 2 → swe-developer → checkbox ticked
    Item 3 → docs-maker              → checkbox ticked
  Phase 2 (Implementation):
    Item 4 → swe-developer → checkbox ticked
    Item 5 → swe-developer → checkbox ticked
    Item 6 → swe-developer → checkbox ticked
    ...and so on without stopping between phases

Step 3: Validate → 4 findings (quality issues, missing tests)

Step 5: Address findings
  Finding 1 → swe-developer → resolved
  Finding 2 → swe-developer → resolved
  Finding 3 → docs-maker               → resolved
  Finding 4 → swe-developer → resolved

Step 6: Re-validate → 0 findings

Result: SUCCESS → Plan moved to plans/done/
```
