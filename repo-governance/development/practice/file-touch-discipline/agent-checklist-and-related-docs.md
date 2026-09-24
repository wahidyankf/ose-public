---
description: A nine-point summary checklist for AI agents applying File-Touch Discipline, plus links to related conventions
when_to_use: Use as a quick-reference checklist before and during any session that mutates files, or to find the conventions this practice relates to.
---

# Agent Checklist and Related Documentation

## For AI Agents

1. **Open the ledger before the first mutation** — not at commit time.
2. **Append every path as you touch it**, with the operation and a one-phrase reason.
3. **Reproduce the ledger in full in every summary, compaction, and handoff** — it is a required
   section, never droppable detail.
4. **Never derive the ledger from `git status` or `git diff`** — those are the union of all actors.
5. **Reconcile ledger against tree before staging**, and state the delta in both directions.
6. **Stage explicit paths only**, per the
   [No Destructive Git Operations Convention](../../workflow/no-destructive-git-operations.md).
7. **Leave foreign paths untouched** — report and stop rather than resolving them yourself.
8. **Without a ledger, assume nothing is yours** — reconstruct from the transcript, or ask.
9. **Count generated mirrors as yours** — a canonical `.claude/` agent or Skill edit produces
   registry-declared generated changes under `.opencode/`, `.codex/`, and `.agents/` that belong on
   your ledger and in the same commit; regenerate with
   `./rhino harness adapters generate`, verify with `./rhino harness adapters validate`
   (all-harness), and never hand-edit a `class: generated` mirror — a
   `class: vendored` path is the exception, covering two structurally different subclasses; see
   [the two vendored
   subclasses](../../../glossary/vendored-exception-subclasses.md)
   for which one applies before hand-editing.

## Related Documentation

- [No Destructive Git Operations Convention](../../workflow/no-destructive-git-operations.md) — the
  prohibitions this practice supplies the precondition for, including the whole-tree-staging ban
- [Task List Discipline](../task-list-discipline.md) — the structural sibling; the same
  append-and-survive-compaction shape applied to intended work
- [Worktree and Artifact Cleanup](../../workflow/worktree-and-artifact-cleanup.md) — cleanup is where
  this failure is most costly
- [Subagent Orchestration Convention](../../agents/subagent-orchestration.md) — delegated agents each
  return their own ledger
- [Agent Workflow Orchestration Convention](../../agents/agent-workflow-orchestration.md) — the
  same-machine assumption this practice operationalizes
- [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) — the
  governing principle
