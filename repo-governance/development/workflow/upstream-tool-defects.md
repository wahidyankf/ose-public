---
description: >-
  Handles a misbehaving pinned upstream tool: watch every use, check for an existing report, file a two-pager at the
  owner and continue, and fix through a bug-fix plan only a blocking defect with no workaround.
when_to_use: >-
  Use when a consumed pinned tool, library, or service behaves unexpectedly, or when recording which tools this standard
  covers.
---

# Upstream Tool Defects

A maturing pinned tool fails in ways its tests have not met, often first seen by a consumer. A defect silently worked
around costs the next consumer the same again. This standard turns each sighting into a record at the owner, and a
blocking one into a fix there.

## Scope

It covers tools the repository consumes as pinned releases from an upstream it can contribute to. The adopter records
those tools and each one's owner. A tool the repository cannot change is reported through its project's own channel per
[Bug Reports](../../conventions/writing/bug-reports.md); the plan steps below do not apply.

## Watch While Using

Every use is also a check. A defect is behaviour contradicting the tool's documentation, its own output, or its stated
contract: a wrong exit status, misleading message, crash, silent no-op, or documented option that does nothing. A
peculiarity, not wrong but surprising to a careful user, counts too, since the next user is surprised the same way; its
fix may be documentation.

## On a Sighting

1. **Reproduce** on the pin, then on the owner's latest trunk. A defect already fixed there needs a repin, not a plan.
2. **Check for duplicates** in the owning repository (open issues and pull requests, in-flight plans, and idea briefs)
   per [Bug Reports](../../conventions/writing/bug-reports.md).
3. **When a match exists, wait for it.** Link it from the current work, add what it lacks, and continue on a workaround.
   Repin once it lands, releasing it first per step 5 if no release carries it. With no workaround, a match in repair
   blocks the current work on that link, while a match that is only an idea brief becomes a bug-fix plan as in step 5.
4. **When the defect has a workaround or does not block the work in hand, file it and continue.** Write an idea brief in
   the owner's `plans/ideas/`, in its own ideas layout (here a
   [two-pager](../../conventions/structure/plans/two-pager-template.md)), with the report in its problem section and the
   duplicate check and references in its prior art. Land it through the owner's route, then resume on the workaround.
5. **Only when the defect blocks the work in hand and no workaround exists, fix it.** Write a
   [bug-fix plan](../../conventions/structure/plans/bug-fix-plan.md) in the owner, researching cause and solution and citing
   every source. Land the plan alone on the owner's trunk through its route first, run its plan quality gate, and on
   `PASS` execute it through the owner's delivery, regression test first. Once its regression test and the owner's full
   release gate pass on the exact revision, release the fix through the owner's release process without a further
   prompt, skipping no step, and repin every consumer.

A workaround is any route to the current work's outcome that does not edit the tool or its pin: another option or
command, a documented manual step, or a reliably succeeding retry. It is recorded beside the link or brief for the next
consumer.

The brief's or plan's pull request is the report, not a separate issue. A security defect skips every public step and
goes through the owner's private security channel.

## Relationship to Root Cause Orientation

This is [Root Cause Orientation](../../principles/general/root-cause-orientation.md) applied across a repository
boundary: the cause lives in the owner, so the fix does too, and the consumer never carries a local patch or vendored
copy. The finding work continues on a workaround instead of absorbing the fix, so it stays reviewable.

## Adopter Decision

| Tool  | Owner; route is a pull request to its `origin/main` |
| ----- | --------------------------------------------------- |
| HIPPO | [hippo](https://github.com/wahidyankf/hippo)        |
| RHINO | [rhino](https://github.com/wahidyankf/rhino)        |

Adopting this standard is the standing request under which a defect's idea brief, a blocking defect's bug-fix plan, and
a merged fix's release once its tests pass need no further authorization. FERRET, built here in `apps/ferret-cli`, is
fixed in place under [Proactive Preexisting Error Resolution](../practice/proactive-preexisting-error-resolution.md)
instead; as its owner, this repository accepts consumers' FERRET two-pagers and bug-fix plans through its worktree-to-PR
route and releases any merged FERRET defect fix, a consumer's or its own, per step 5 with an annotated
`ferret-cli/vX.Y.Z` tag. Adopted from the [ose-rules](https://github.com/wahidyankf/ose-rules) catalog by explicit copy.
