---
description: "PASS examples of knowledge capture."
when_to_use: "Use for a correct knowledge-capture example."
---

# Examples

## PASS: Learning routed inline (non-code, small)

```markdown
## Learning: worktree-setup doc omitted a step

- **Context**: Provisioning the worktree for this plan required an undocumented
  `npm run doctor` re-run after a stale toolchain cache.
- **Observation**: `repo-governance/development/workflow/worktree-setup.md` did not mention this
  re-run step.
- **Why it might generalize**: the next plan author will hit the same stale-cache surprise.

**Routing**: `repo-governance/development/workflow/worktree-setup.md` (non-code, small) — routed
INLINE, landed in commit `abc1234` of this plan.
```

## PASS: Learning filed as an authorized idea two-pager

```markdown
## Learning: a toolchain doctor command silently swallows a missing-tool exit code

- **Context**: Noticed while running `./rhino toolchain provision --apply` during Phase 0.
- **Observation**: a missing tool that fails to install still reports "0 warnings" in the summary
  line.
- **Why it might generalize**: a future contributor could believe their toolchain is healthy when
  it is not — the system would not catch this without a code fix.

**Routing**: upstream Rhino (code) — user authorized a follow-up artifact in conversation turn 42.
Filed at `plans/ideas/q2-not-urgent-important/fix-doctor-silent-tool-failure.md`; backlog promotion
remains a later ripeness decision. NOT landed inline in this plan's PR.
```

## PASS: Code learning reported without plan authorization

```markdown
## Learning: a toolchain doctor command silently swallows a missing-tool exit code

**Routing**: `Reported without plan authorization` — reported in the final handoff under
"Future code work"; no `plans/ideas/` artifact created and no code landed inline.
```

## PASS: Learning discarded (fails the litmus)

```markdown
## Learning: the executor personally found Nx's cache output confusing at first

- **Context**: Ran `nx affected` for the first time in this session.
- **Observation**: took a moment to parse the cache-hit summary.
- **Litmus**: no durable surface would change behaviour by routing this — it is a one-time
  orientation moment, not a gap in documentation (the docs already explain cache output).

**Routing**: discard — not generalizable; existing docs already cover this, no gap found.
```

## PASS: Explicit "none" escape

```markdown
No generalizable learnings — this plan renamed one file and updated its three inbound links; no
new pattern, rule, or gap surfaced during execution.
```
