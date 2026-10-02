---
description: What this backlog-grooming workflow does to plans/ideas/, and the two-condition recurrence trigger that governs when to run it.
when_to_use: Use when deciding whether a repo's plans/ideas/ is due for a grooming sweep.
---

# Purpose and When to Use

**Purpose**: Sweep one or more repos' `plans/ideas/` folders and converge them into a
deduplicated, Eisenhower-quadrant-organized, strictly-formatted, correctly-resident set of
two-pagers — the direct analogy to Scrum's "backlog grooming" practice applied to this repo's idea
corpus. Concretely, this workflow merges or splits near-duplicate ideas (within a repo and across
the `repos` input's repo set), classifies every surviving idea into an Eisenhower quadrant folder
using two falsifiable rubrics, reshapes each into strict two-pager compliance, corrects cross-repo
residency per three placement rules, and renames a filename that no longer matches its content —
with every rename's inbound/outbound links rewritten by the same mechanism relocation already uses.

## When to use

- A repo's `plans/ideas/` (summed across its quadrant folders, excluding `README.md`) exceeds
  **60** flat idea-doc files.
- **90 days** have elapsed since this workflow's last recorded run against that repo, tracked via
  the `> Last groomed: YYYY-MM-DD` line this workflow appends to that repo's
  `plans/ideas/README.md` on every run.
- Whichever of the two conditions above occurs first is this workflow's own stated **recurrence
  trigger** — it is a real, recurring commitment against `plans/ideas/`, not a one-time migration
  wearing a recurring name. A maintainer or an agent acting on their behalf invokes it explicitly
  against the `repos` it should sweep; it never self-triggers.
- Do **not** use it to file a brand-new idea (write the two-pager directly per the
  [Ideas Folder convention](../../../conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers)), and do
  not use it to promote a single ripe idea into a full plan (that is
  [`plan-planning`](../plan-planning.md), per
  [Promoting a Two-Pager](../../../conventions/structure/plans/promoting-ideas-and-worked-examples.md)).
