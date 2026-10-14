---
name: pr-leak-review
description: >-
  Defines a leak and reviews every commit bound for a remote for one, privately before each push and before each merge,
  with the delivery harness acting on the verdict.
when_to_use: >-
  Use before every push to a remote, and for every open pull request before merge and whenever its head moves.
---

# PR Leak Review

A **leak** is anything in outbound history a reader of the remote could use to reach an environment or identify its
source machine. [Leak Classes](pr-leak-review/001-scope-and-exclusions.md) defines the three classes and what is not one.
History is the subject, not the final tree: a value added and later deleted remains in every clone. The review binds
from adoption onward; earlier published history is out of scope.

Judgement is delegated: the delivery harness spawns a fresh-context `leak-reviewer` agent to read and judge, and the
harness alone acts on the verdict. No human is on the merge path; a self-judged verdict satisfies nothing.

## Entry

Two entry points share one judgement:

- **Push.** Before any push to a remote, review the outgoing range privately per
  [Push Review](pr-leak-review/002-push-review.md). Nothing is posted; a finding blocks the push.
- **Merge.** A pull request is about to merge, and the harness holds no `pass` verdict for its current head. The
  delivery harness runs this workflow for that head before merge. `pull-request` (`string`, required): its number or
  address.

## Sequence

1. **Pin the head.** The harness resolves the pull request through the forge's API and records the repository, base
   branch and revision, and exact head revision. Later steps concern that head alone.
2. **Spawn a fresh-context reviewer.** One `leak-reviewer` for this head alone: no part in authoring the change, no
   memory of an earlier head, read-only, never posting. It receives only the pin, the title and body, and the three leak
   classes. A failed spawn ends the run as `failed`; no self-judging fallback, and no human substitutes.
3. **Read every commit at that head.** The reviewer reads each base-to-head diff (configuration, generated files,
   localized content, binary metadata, file names, messages) plus the title and body. A summary or memory is not a
   reading, and no file is skipped because another gate covers it.
4. **Judge candidates against the three [leak classes](pr-leak-review/001-scope-and-exclusions.md) and no others.** A candidate
   is a finding only when shape and context show the value is real. Never copy one into notes, commands, or logs.
5. **Return each finding without its value.** The reviewer returns the result, the count per class, and each finding's
   class, commit, location, reason, and remediation per [Push Review](pr-leak-review/002-push-review.md#remediation),
   never the value in any form.
6. **Confirm the head before acting.** If the live head differs from the pin, end as `stale`.
7. **Gate on the verdict.** The harness merges or pushes only on `pass`, after a second live-head check immediately
   before the action. A `findings`, `failed`, or `stale` outcome refuses it.
8. **Post an optional audit comment.** On the merge entry, after a `pass` or `findings` verdict, the harness may post
   one comment on the pull request holding only the pinned head, the result, and the per-class counts. It is non-gating:
   no check, status, or review is posted, and nothing reads the comment as authority.

## Exit

The run ends with `result` (`enum`: `pass`, `findings`, `stale`, `failed`), `reviewed-head` (`string`), and `counts` per
class. `pass` means every count is zero; `findings`, any nonzero count. Only `pass` for the head about to merge or push
lets the harness proceed; every other result refuses it.

`stale` means the head moved and authorizes nothing for the new head. `failed` means a spawn, API, or read error left no
verdict. Neither retries within the run.

## Example Usage

```text
Run pr-leak-review for the current head of pull request 412.
Run the push leak review on this branch's outgoing commits.
```

## Related Workflows

- [`pr-review`](pr-review.md) is the optional broad pass; it never repeats these predicates.

## One Head, One Review

A moved head needs one new review from a new `leak-reviewer` spawn. Earlier verdicts say nothing about the head about to
merge, so the run neither retries nor waits for a clean streak. The optional comment is an audit trail that nothing
reads as authority. [Enforcement](pr-leak-review/003-enforcement.md) records how the harness refuses every outcome
except `pass`.

## Principles

Fail Closed: `stale` and `failed` never satisfy the precondition.
Evidence Over Assertion: the verdict is one reviewer's reading of one
pinned head, and the harness acts on that reading alone.
