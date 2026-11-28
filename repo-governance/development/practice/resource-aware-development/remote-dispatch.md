---
description: >-
  States when a contributor may dispatch compute to another machine, the lifecycle each dispatch follows, and the
  confidentiality rules that already bind it.
when_to_use: >-
  Use when dispatching compute to another controlled machine, or when reviewing whether a dispatch was admitted.
---

# Remote Dispatch

Adopted by explicit copy from the shared catalog (`origin/main` commit `48f2085`), adapted to this repository's
homes. A contributor dispatches remote compute only through a local binding found at `REMOTE_DISPATCH_HOME`. The
binding stays with the contributor: this module names the variable only, never a value. A remote payload carries its
single HIPPO boundary on the target host, never locally, under the
[resource rule](../resource-aware-development.md): for a dispatched node, that one outer boundary sits on the target.

## Binding

- When `REMOTE_DISPATCH_HOME` is set and readable, the remote-dispatch rules found there govern the dispatch, and
  targets come from that ruleset only, never guessed. (RD-A1, unenforced by decision: which ruleset governed a past
  dispatch is judged from dispatch evidence kept on the machine, which no catalog check reads.)
- When `REMOTE_DISPATCH_HOME` is unset or unreadable, dispatch must not happen: the attempt ends with a recorded
  refusal, and no session, worktree, artifact, or compute starts on a target. (RD-A2, gated by
  `remote-dispatch-refusal`: a fixture with no readable binding must meet the documented refusal.)

## Lifecycle

- Dispatch only when the most recent local HIPPO reading before dispatch is non-normal, with that reading recorded.
  (RD-B1, unenforced by decision: the reading's timestamp needs the live local status history at dispatch time.)
- Immediately before any remote work, a fresh target query must read normal. (RD-B2, unenforced by decision: freshness
  and the target's state need a live query of another host, which no check here can replay.)
- Remote compute carries exactly one HIPPO boundary, placed on the target host: one target-side admission, or an
  already-guarded target script supplying that one admission, and no second local or nested boundary. (RD-B3, unenforced
  by decision: no checker proves how many admissions a quoted payload received, or the remote host's identity; review
  compares the transcript with target admission evidence.)
- Remove each artifact a dispatched task creates on the target once the step that needed it ends. At a handoff, the
  target holds only the task worktree and its installed dependencies. After the work ends, remove the worktree and its
  branch, then delete the dispatch record last. The dispatch note lists the target's `/var/tmp` entries, `git worktree
list`, containers, and disk use before the first remote step and after teardown. Never remove what existed before the
  task or what another session made. (RD-B4, unenforced by decision: the state exists only on the target; review
  compares the listings with what the task created.)
- Each dispatch has one dispatch record identifying the dispatch semantically and listing what it created and what
  teardown left. Write the record before remote work and delete it last, as RD-B4 orders, so a dropped session leaves
  evidence rather than silence; delete a record only once nothing it lists remains. (RD-B5, unenforced by decision: a
  record's agreement with the target needs the target's own listing, which no shape check proves.)
- Dispatch-created worktrees count toward the same max-worktree caps that plan-execution and multi-plans-execution
  enforce, per-repo and global: every active dispatch-created worktree is included in the cap count, and a dispatch
  waits or moves to another eligible host when the cap is full. (RD-B6, unenforced by decision: active worktrees live
  only on their hosts, which no catalog check lists.)
- A project may clean up state on a target only when that state is proven unused: confirm over ssh on the target that no
  live session or process uses it, remove only the confirmed-unused items, and report what was removed; cleaning by age
  alone never suffices. (RD-B7, unenforced by decision: live use needs the target's own session and process listing at
  cleanup time, which no check here can replay.)

## Confidentiality

[Public Outbound Safety](../../../conventions/security/public-outbound-safety.md),
[No Secrets in Committed Files](../../../conventions/security/no-secrets-in-committed-files.md), and
[No Machine-Specific Commits](../../quality/no-machine-specific-commits.md) already bind every committed or published
artifact touching this rule, and this module adds nothing to them. An SSH alias is read by review, never by a shape:
an alias is an ordinary token no shape tells from code.

## Enforcement

RD-A2 is gated; every other statement above is unenforced by decision, with its reason beside it.
