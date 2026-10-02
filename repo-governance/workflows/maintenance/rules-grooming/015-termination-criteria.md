---
description: The four terminal states — no-op, groomed, halted, partial — and the conditions that produce each.
when_to_use: Use when deciding whether a grooming run is finished, and what to report.
---

# Termination Criteria

A run ends in exactly one of four states. There is no state in which a reduction is handed off but
unaccounted for.

## No-op

Step 1's census fired no recurrence trigger, or every discovered candidate fell under the yield
noise floor. The PR records the census and the three trigger values. No discovery sweep runs in
the first case, and no hand-off occurs in either.

Unlike a `*-check-fix` workflow, grooming has no zero-findings convergence to reach and never
re-runs itself to confirm one. It is a **grooming-class** workflow: a bounded sweep over existing
state, ending when its manifest is exhausted rather than when findings reach zero.

## Groomed

All of:

- The census is complete and its trigger evaluation recorded.
- Every candidate carries a class, measured yield, evidence, and a disposition.
- Every approved item carries a propagation terminal status.
- The post-run obligation inventory differs from the pre-run inventory only by the approved
  retirements, with every survivor unchanged and reachable.
- The rules quality gate returned `PASS_EFFECTIVE`, or returned `NEEDS_PROPAGATION` and the
  propagation it handed off to landed.
- The PR record is written, including the metrics delta, the gate verdict, every finding bounded
  out to the next sweep, and the next trigger evaluation.

## Halted

The run stops, for one reason only: **preservation verification failed.** An obligation was lost,
changed, or made unreachable, and that is not a defect to be worked around. The offending
delivery is identified, its revert is handed to propagation, and the loss is reported to the
maintainer whether or not the revert lands.

An authorization failure at Step 0 is not a halt — the run never started.

## Partial

Some subject groups landed and others did not: a propagation run halted on a conflict, a class
sweep could not complete, the census could not measure every path, or the checkpoint went
unanswered. The landed groups stay landed; the rest are named in the PR with their blockers.

Partial is a legitimate outcome. The ranking at Step 4 is built so that stopping after any batch
leaves the corpus coherent.

## Never Terminate By

- Writing a rule edit directly instead of handing it to propagation.
- Approving retirements as a batch.
- Accepting a `See` link to a target that omits a case the removed text covered.
- Raising a word-budget threshold so a merge fits.
- Rewording, generalizing, or densifying a rule to increase a run's yield.
- Recording a preservation diff as clean without re-running the inventory under identical
  extraction rules.
- Declaring an obligation loss acceptable because the reduction was large.
- Skipping the governance verdict because the run's class was the zero-risk one. Every run is
  gated; preserving every obligation does not prove the corpus still coheres.
- Re-running the gate to confirm its own repair, or repairing a gate finding on a surface this run
  never touched instead of recording it for the next sweep.

## Related Documents

- [Success Criteria](./011-success-criteria.md) — the Gherkin form of these conditions.
- [Step 7](./008-step-7-preservation-verification.md) — the verification that
  decides between groomed and halted.
