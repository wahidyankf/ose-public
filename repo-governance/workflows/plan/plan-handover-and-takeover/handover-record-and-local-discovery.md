---
description: The handover record template and the local paths, candidates, and limits the handover-and-takeover sequence uses in this repository.
when_to_use: Use when writing a handover record, or when resolving where takeover looks for records, candidates, and its report.
---

# Handover Record and Local Discovery

These are this repository's extensions to [Plan Handover and Takeover](../plan-handover-and-takeover.md): a fixed
record template, and the local paths and candidates its steps use.

## Record Template

Every handover uses these headings in this order; takeover depends on the predictable shape.

```markdown
# Handover: <plan-identifier>

**Written**: <date>
**Plan-identifier**: `<plan-identifier>`
**Plan folder**: `plans/<stage>/<plan-identifier>/` (in `<repo>`, on `origin/main` or `<branch>`)
**Consuming workflow**: [`plan-handover-and-takeover.md`](../../repo-governance/workflows/plan/plan-handover-and-takeover.md)

## One-line status

## Per-repo state

### `<repo-name>` — <label: "done, merged" / "in progress, paused" / "untouched">

## What to do next

## Active user-established rule decisions

## Learned constraints and gotchas

## Files this session touched (ledger)

## Do not re-litigate
```

- **One-line status** and **What to do next** are never empty. The status names the phase or step and whether work is
  paused, blocked, or mid-step. Next steps are numbered and name the `delivery.md` item, the first command, and any
  setup not yet done, so a reader can start without re-reading anything else.
- **Per-repo state** holds only facts verified this session: pull request number and state, merge commit, branch,
  worktree path, head commit, and uncommitted changes. Write one subsection per repository with something to report.
- **Active user-established rule decisions** lists each decision's operative statement, scope, source, and status per
  [Continuation-State Integrity](../../../development/agents/agent-workflow-orchestration/continuation-state-integrity.md).
  Write `None` only after checking the session record; learned constraints never substitute for it.
- **Learned constraints and gotchas** records what happened, the mechanism, and the future response, with the reason
  [Knowledge Capture](../../../development/quality/knowledge-capture.md) asks of every learning.
- **Files this session touched** lists the files or points to where they are listed, such as a pull request diff. It is
  never absent.
- **Do not re-litigate** is omitted when nothing applies.

## Local Paths and Candidates

- **Records** live at `local-tmp/handovers/<date>__<plan-identifier>-implementation.md`. `local-tmp/` is gitignored, so
  a record serves the next session on the same machine only. Earlier dated records stay in place, takeover reads the
  newest by filename date, and finding none is a non-event.
- **Candidates** always include the current repository and, when it exists as a sibling checkout, the parity sibling
  named in [Related Repositories](../../../../docs/reference/related-repositories.md). The plan's documents or a handover
  can widen that floor; nothing narrows it.
- **Probes** look for `worktrees/<plan-identifier>/` per the
  [Worktree Path Convention](../../../conventions/structure/worktree-path.md). Within one repository they run in order,
  because a found branch narrows the next query. Independent repositories and independent cleanup candidates may fan
  out up to the default of three background agents under the
  [Agent Workflow Orchestration Convention](../../../development/agents/agent-workflow-orchestration.md).
- **The takeover report** is written as probing proceeds, to
  `local-tmp/plan-handover-and-takeover/plan-handover-and-takeover__<uuid-chain>__discovery.md`.
- **Adoption and cleanup** stay within
  [No Destructive Git Operations](../../../development/workflow/no-destructive-git-operations.md) and
  [Worktree and Artifact Cleanup](../../../development/workflow/worktree-and-artifact-cleanup.md). The touched-file
  record is rebuilt per [File-Touch Discipline](../../../development/practice/file-touch-discipline.md).
- **Execution mode** is direct orchestration. The calling context runs every probe, because read-only Git and `gh`
  queries gain nothing from a delegated agent.
