---
description: The five-point checklist for AI agents doing qualifying multi-step work, its relationship to plan delivery checklists, and links to related documentation
when_to_use: Use as a quick-reference checklist before starting qualifying multi-step work, or to find related conventions and principles.
---

# For AI Agents and Related Documentation

## For AI Agents

Every agent — main thread and delegated alike — must follow this practice for any task, conversational ones included:

1. **Create the task list before execution** — record the known primary tasks in the harness's native task list
2. **Mark each task `in_progress` before starting it** — never start work on a pending task without updating its status first
3. **Mark each task `completed` immediately after verification** — same turn or immediately following
4. **Add discovered tasks on the spot** — no deferring, no "I'll add it later"
5. **One task per concrete outcome** — split bundled tasks before starting them
6. **Preserve active rule decisions** — record their statement, scope, source, and status; restore
   and reconcile them before acting after compaction or handoff

### Relationship to Plans Delivery Checklists

The [Plans Convention](../../../conventions/structure/plans.md) governs the delivery checklist inside plan documents (`delivery.md`). That checklist is the authoritative progress record for plan-mediated work. This practice governs the live working task list for everyday multi-step execution outside a plan document — and for the in-session tracking state during plan execution itself. Both require continuous sync. Neither exempts the other.

That checklist is also the only written progress record. `local-tmp/` holds what an execution needs and then discards — scripts, assets, logs, intermediate data, the touched-file ledger — and never a copy of the checklist, its ticks, or its status, because two written records drift apart and nothing decides which one was true. Outside plan-mediated work there is no `delivery.md`, and a scratch file may carry working notes that have to survive a context boundary.

## Related Documentation

- [File-Touch Discipline](../file-touch-discipline.md) - The structural sibling: the same append-only, survives-compaction shape applied to files already touched rather than work still intended. An agent that keeps one and not the other is only half-recoverable — the task list says what it meant to do, the ledger says what it actually changed
- [Continuation-State Integrity](../../agents/agent-workflow-orchestration/continuation-state-integrity.md) - Governs the active-decision record and the before-resume reconciliation gate
- [Plans Convention](../../../conventions/structure/plans.md) - Governs plan-file delivery checklists; complementary scope to this practice
- [Proactive Preexisting Error Resolution](../proactive-preexisting-error-resolution.md) - Handling discovered errors during work; pairs with Standard 4 on adding discovered tasks
- [Agent Workflow Orchestration Convention](../../agents/agent-workflow-orchestration.md) - Broader agent task management strategy including plan mode and verification loops
- [Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md) - Think before acting; surface assumptions; do not proceed without a plan
- [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) - Explicit state over implicit context
