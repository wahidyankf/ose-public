---
name: 003-clean-audits-and-the-ceiling
description: >-
  Fixes when a PR review quality gate's audit counts as clean, why each audit takes a new probe class, how a run ends at
  its ceiling of three cycles, and where blocking status is read.
when_to_use: >-
  Use when deciding whether a PR review quality gate's audit is clean, whether another cycle may start, or how a run
  ends.
---

# Clean Audits and the Ceiling

## A Clean Audit

An audit is clean, and ends the run early as the gate contract's termination table directs, only when all of these hold:

1. [PR Review](../pr-review.md) returned `clean` or `findings` with no open blocking row for the audited head.
2. The pipeline passed on that exact head.
3. The live head still equals it when the verdict is recorded.

The result is written to the subject's surface record and read back before the verdict. An empty finding list is not a
clean audit without the pipeline evidence, and cleanliness is never inferred afterwards from review prose, closed
threads, or a check observed later.

## A Moved Head Ends the Run

A head moved by anyone other than this run's writer, before the post, the repair, or the verdict, changes the frozen
subject. The run ends `BLOCKED` (input-changed), and its ledger is kept for a fresh run. Attaching a new revision to old
results is forbidden, because a verdict must describe the commit the reviewers read.

## Each Audit Asks a New Question

Each audit names its probe class, such as a different failure mode, reader, or level of the change, so a new probe is
checkable rather than asserted. An audit that repeats the previous question converges on that question, not on
correctness. A clean audit under a fresh probe is a stopping rule, not a proof.

## Durable History

Earlier runs' records on the surface, posted reviews or report files, inform `prior-findings`, so a settled finding is
not argued again. They never add a cycle and never count toward a new run's ceiling. Missing, malformed, or
contradictory history is reported in the verdict block and never silently reset.

## The Ceiling

A run holds at most `max-cycles` cycles, and `max-cycles` is at most 3. From the second audit on, the open blocking
count must fall strictly, or the run ends `FAIL` with no further cycle. At the ceiling, no further audit runs: the
writer's repairs are verified row by row against the pipeline on the final head, and the run ends `PASS` or
`PASS_WITH_FINDINGS` when every blocking row is `resolved`, and `FAIL` otherwise.

No record, authorization, or checkpoint raises the ceiling, and no verdict waives a finding. Another run needs another
explicit request after new work.

## Review State Is Never the Gate

A review posted under the change author's own identity may be unable to request changes, and a pass never approves, so
every review reads alike whatever it found. A consumer that decides blocking from review state therefore reads a
blocking finding as absent, silently. Blocking lives in each finding's criticality, stated in the finding text and the
ledger, and every consumer reads it there.
