---
description: >-
  Fixes what happens when a pinned upstream tool misbehaves: watch for defects in every use, check for an existing
  report, file a two-pager at the owner and continue, and fix through a bug-fix plan only a defect that blocks the work
  with no workaround.
when_to_use: >-
  Use when a pinned command-line tool, library, or service the repository consumes behaves unexpectedly, or when
  recording which consumed tools this standard covers.
---

# Upstream Tool Defects

A pinned tool that is still maturing fails in ways its own tests have not met, and a consumer is often the first to see
it. A defect noticed and silently worked around is found again by the next consumer at the same cost. This standard
turns each sighting into a record at the owner, and a blocking one into a fix there.

## Scope

It covers tools the repository consumes as pinned releases from an upstream it can contribute to. The adopter records
which tools those are and which repository owns each. A tool the repository cannot change is reported through its
project's own channel per [Bug Reports](../../conventions/writing/bug-reports.md); the plan steps below do not apply.

## Watch While Using

Every use is also a check. A defect is behaviour that contradicts the tool's documentation, its own output, or its
stated contract: a wrong exit status, a misleading message, a crash, a silent no-op, a documented option that does
nothing. A peculiarity — behaviour that is not wrong but surprises a careful user — counts too, because the next user is
surprised the same way; its fix may be documentation.

## On a Sighting

1. **Reproduce** on the pinned version, then on the owner's latest trunk. A defect already fixed there needs a repin,
   not a plan.
2. **Check for duplicates** in the owning repository — open issues, open pull requests, in-flight plans, and idea briefs
   — per [Bug Reports](../../conventions/writing/bug-reports.md).
3. **When a match exists, wait for it.** Link it from the current work, add to it what it lacks, and continue on a
   workaround. Repin once it lands. With no workaround, a match already in repair leaves the current work blocked on
   that link, while a match that is only an idea brief is promoted to a bug-fix plan as in step 5.
4. **When the defect has a workaround or does not block the work in hand, file it and continue.** Write an idea brief
   in the owner's `plans/ideas/`, in the owner's own ideas layout — here a
   [two-pager](../../conventions/structure/plans/two-pager-template.md) — with the report in its problem section and the
   duplicate check and references in its prior art. Land it through the owner's route, then resume the current work on
   the workaround.
5. **Only when the defect blocks the work in hand and no workaround exists, fix it.** Write a
   [bug-fix plan](../../conventions/structure/plans/bug-fix-plan.md) in the owning repository, researching the cause and
   the solution and citing every source. Land the plan alone on the owner's trunk through its route first, run its plan
   quality gate, and on `PASS` execute it through the owner's delivery, regression test first. Release where the owner
   releases, and repin every consumer.

A workaround is any route to the current work's outcome that does not edit the tool or its pin: another option or
command, a documented manual step, or a retry that reliably succeeds. It is recorded beside the link or brief so the
next consumer reuses it.

The brief's or plan's pull request is the report; no separate issue is opened. A security defect skips every public
step and goes through the owner's private security channel.

## Relationship to Root Cause Orientation

This is [Root Cause Orientation](../../principles/general/root-cause-orientation.md) applied across a repository
boundary: the cause lives in the owner, so the fix does too, and the consumer never carries a local patch or a vendored
copy. The work that found the defect continues on a workaround rather than absorbing the fix, so it stays reviewable.

## Adopter Decision

| Tool  | Owner; route is a pull request to its `origin/main` |
| ----- | --------------------------------------------------- |
| HIPPO | [hippo](https://github.com/wahidyankf/hippo)        |
| RHINO | [rhino](https://github.com/wahidyankf/rhino)        |

Adopting this standard is the standing request under which a defect's idea brief, and a blocking defect's bug-fix plan,
need no further authorization. FERRET, built here in `apps/ferret-cli`, is fixed in place under
[Proactive Preexisting Error Resolution](../practice/proactive-preexisting-error-resolution.md) instead; as its owner,
this repository accepts consumers' FERRET two-pagers and bug-fix plans through its worktree-to-PR route. Adopted from the
[ose-rules](https://github.com/wahidyankf/ose-rules) catalog by explicit copy.
