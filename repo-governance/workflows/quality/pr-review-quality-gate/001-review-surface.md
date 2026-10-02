---
name: 001-review-surface
description: >-
  Fixes the two surfaces a PR review quality gate runs on, a hosted pull request or a local commit range, and maps what
  each supplies onto the gate's one cycle.
when_to_use: >-
  Use when adopting the PR review quality gate, or when mapping its subject, pass record, answers, and pipeline onto a
  repository.
---

# Review Surface

The gate's cycle speaks of a subject, its head, one record per pass, answers to findings, and a pipeline. Either surface
below supplies all five, so the cycle reads the same under both. A repository chooses one and records the choice where
contributors find it.

## Two Surfaces

**Hosted pull request.**

- Subject and head: an open pull request and its head revision.
- Pass record and answers: the posted review; each answer replies on its finding's thread.
- Pipeline: the hosted checks reported for that exact head.
- Trade-off: threads outlive the run and no contributor can quietly skip a check, at the cost of forge access and hosted
  wait time.

**Local commit range.**

- Subject and head: a base ref and a head ref pinned to a commit.
- Pass record and answers: one findings report file per pass, read back after writing, each answer beside its finding.
- Pipeline: the repository's local gates run on that head, exit statuses recorded.
- Trade-off: it needs no remote, but history lasts only as long as its files, and the gates prove only what ran on one
  machine.

## Mapping a Pass Onto Each Surface

On a hosted pull request, [PR Review](../pr-review.md) runs as written. The gate waits for hosted evidence on the exact
head instead of rerunning those checks locally, and pending evidence is never read as green.

On a local commit range, the pass pins the head ref to a commit, its one post becomes writing the findings report for
that commit, and its read-back becomes reading that file back. A head ref that moved from its pin makes the pass
`stale`. The reports sit beside the gate's ledger in the scratch location, and earlier reports are the history a later
run reads for `prior-findings`.

## Why Either Surface Works

A repository without a remote or a hosted pipeline cannot supply threads or hosted checks, and a gate that demanded them
would never run there. Both surfaces keep what the cycle depends on: one pinned head per pass, every blocking finding
answered, a green pipeline on the exact head, and a clean audit only on recorded evidence. Those guarantees attach to
the cycle, not to the surface.
