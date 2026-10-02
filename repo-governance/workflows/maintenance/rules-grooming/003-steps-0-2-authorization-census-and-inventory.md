---
description: Freezing the run's inputs, measuring the corpus to confirm a sweep is due, and capturing the pre-run obligation snapshot that the preservation proof diffs against.
when_to_use: Use when starting a grooming sweep — establishing authorization, baseline metrics, and the preservation baseline.
---

# Steps 0-2 — Authorization, Census, and Inventory

## Step 0: Authorization and Snapshot (Sequential)

**Procedure**: Confirm the run was explicitly invoked by a maintainer or an agent acting on their
behalf. Never infer authorization from a rule change, a failing word budget, a review request, or
another workflow's findings.

Freeze: `scope`, `classes`, `dry-run`, the Git revision, and any dirty paths. A material change to
a frozen input ends the run as `halted` rather than restarting it.

- **Output**: Frozen run header, written to the manifest.
- **On failure**: No authorization, no run. Report and stop.

## Step 1: Corpus Census (Parallel)

**Procedure**: Measure the corpus before looking for anything to change, so that every later yield
claim is stated against a recorded baseline rather than an impression.

Per file, and aggregated per directory: total lines, frontmatter lines, word count, word-budget
headroom against the file's surface class, shard depth, inbound link count, and whether the file is
an index. Aggregate: file count, metadata ratio, and the count of index files.

- **Output**: Census table in the manifest; the three recurrence-trigger values evaluated.
- **Success criteria**: Every file in `scope` is measured, and the trigger evaluation is explicit
  about which condition fired.
- **On failure**: Report the unmeasurable paths and continue; an incomplete census caps the run at
  `partial`.

If no trigger condition fired, record `no-op` and stop. A sweep that nothing called for is not run
just because it was invoked.

## Step 2: Obligation Inventory — Pre-Run (Conditional, Parallel)

**Agent**: `rules-checker`

**Condition**: Live runs only. Under `dry-run` no hand-off occurs, so there is nothing for Step 7
to verify and the inventory buys no preservation guarantee; skip it and record the skip. A dry run
may still emit the deterministic sentence-level extract Step 3b consumes, which is a discovery
input, not a preservation baseline, and must not be labelled as one.

This step exists to make the workflow's central claim falsifiable. "Reduces volume without losing
meaning" is unverifiable as prose; it becomes verifiable as a set diff, and Step 7 is the diff.

**Procedure**: Extract every distinct normative obligation in `scope`. One entry per obligation,
carrying: a stable identifier derived from the obligation's own text rather than its location, the
canonical location, the audience it binds, its pass condition, its violation condition, and every
qualifier and exception attached to it.

Two surfaces stating the same obligation produce **one** entry with two locations — that
co-location is itself the duplication signal Step 3b consumes, so the two steps share one pass over
the corpus.

- **Args**: `scope` from Step 0; census from Step 1.
- **Output**: `local-tmp/rules-grooming/rules-grooming__<slug>__obligations-pre.md`.
- **Depends on**: Step 1.
- **Success criteria**: Every rule file in `scope` contributes at least one entry, or carries a
  recorded reason it contributes none. A file that yields no obligation and no reason is itself a
  retirement candidate, and is passed to Step 3c rather than silently dropped.
- **On failure**: Halt. Without a pre-run inventory there is no preservation proof, and without
  that proof no hand-off may proceed. A live run that cannot complete this step never reaches
  Step 5.
