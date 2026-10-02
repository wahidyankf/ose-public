---
description: The mandatory read-only quality-gate pass that confirms what a grooming run left behind is still coherent, and the bound that keeps it from chasing the whole corpus.
when_to_use: Use when submitting a completed grooming sweep for its governance verdict.
---

# Step 8 — Governance Verdict

Step 7 asks whether anything was **lost**. This step asks whether what survived is still **sound**.
A run can pass the first and fail the second: moving an obligation intact into a parent that
already contradicts it loses nothing and still leaves the corpus worse.

**Workflow**: [rules-quality-gate](../../quality/rules-quality-gate.md), subject `effective`

Runs on **every** grooming run, every class — including fragmentation, whose reductions Step 7
already proves verbatim. The cost of a full gate pass is accepted deliberately: a reduction that
preserves every obligation can still leave the corpus incoherent, and only a semantic read finds
that.

This is a **named** caller, not an inferred one. The gate's `## Entry` lists Rules Grooming; grooming
may not start it on any other basis, and no other workflow inherits that permission.

**Procedure**: Invoke the gate once with an `effective` subject, the run's manifest as the requested
outcome and its rationale, mode `normal`, and `max-cycles` `3`. Inside its cycles the gate hands each
frozen blocking ledger to [propagation](../../quality/rules-propagation.md), run by `rules-fixer`, without
a further user instruction.

- **`PASS`** or **`PASS_WITH_FINDINGS`** — record the verdict and continue to Step 9.
- **`FAIL`** or **`BLOCKED`** — record the verdict, give each open blocking row an owner, and continue to
  Step 9; the verdict is advisory and never stops the run.

**One run, bounded.** The gate runs once per grooming run and is never re-run to confirm its own
repair. Establish the pre-run baseline explicitly, then bound the ledger to surfaces this run
touched: a finding on an untouched surface is **recorded as input for the next sweep, not repaired
here**. This mirrors propagation's own stance on pre-existing gate failures, and without it a
grooming run chases the whole corpus.

- **Depends on**: Step 7 passing. A run that lost an obligation is not submitted for a verdict.
- **On failure**: A propagation halt inside the gate leaves its rows `not-resolved`; the gate's
  verdict records it, and the run ends `partial` with the blocker named.

## Related

- [Step 7](./008-step-7-preservation-verification.md) — the loss check that must pass first.
- [Step 9](./010-step-9-record-and-recurrence.md) — the record that carries this verdict.
