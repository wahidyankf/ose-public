---
description: The four terminal states — no-op, landed, halted, partial — and the conditions that produce each.
when_to_use: Use when deciding whether a propagation run is finished, and what to report.
---

# Termination Criteria

A run ends in exactly one of four states. There is no state in which a rule is written but
unaccounted for.

## No-op

The Step 3 semantic sufficiency gate proves that the effective rules already satisfy the requested
meaning, strength, scope, boundaries, exceptions, and discoverability. The manifest names the
canonical source and verification evidence, the ledger is reconciled, and the rule produces no
tracked diff. A no-op does not open a delivery PR solely to restate existing wording.

## Landed

Every rule in the batch satisfies **all** of:

- Normalized into a falsifiable statement with both observations recorded.
- Placed on a decided surface, with the placement recorded.
- Free of unresolved contradiction; every supersession recorded.
- Subject-scoped consolidation complete: every rule surface has a keep, amend, merge, delete,
  relocate, or supersede verdict, plus a surviving canonical home and any keep rationale.
- Carrying one of the three enforcement dispositions.
- Verification clean and the ledger reconciled.
- PR open with its checks green.

## Halted

The run stops without writing, for one of two reasons only:

1. **Unfalsifiable rule.** Step 0 could not produce a checkable statement and the human did not
   rule it unenforceable by design.
2. **Higher-layer conflict.** Step 3 found the new rule contradicting a rule in a higher layer.
   Resolving it is a governance decision, escalated to the human, never made by the run.

A halt is reported with the specific rule and the specific blocker. "Could not proceed" is not a
halt report.

## Partial

Some rules in a batch landed and others halted. The landed rules ship; the halted ones are named in
the PR body with their blockers, and nothing about them is written.

Partial is a legitimate outcome, not a failure. Batching rules is a convenience of intake, not a
commitment to ship them together.

## Never Terminate By

- Softening an unfalsifiable rule into "guidance" so it can be written.
- Recording an enforcement disposition of "unclear" or leaving it blank.
- Raising a word-budget threshold, or adding an exemption entry, so a placement fits.
- Weakening, generalizing, omitting, or ambiguously paraphrasing any obligation, named audience,
  strength, scope, boundary, exception, pass/violation condition, or enforcement disposition to make
  a word counter pass.
- Declaring a deterministic gate's or direct checker's pre-existing findings as this run's, or this
  run's findings as pre-existing, without demonstrating the baseline.

## Related Documents

- [Success Criteria](./success-criteria.md) — the Gherkin form of these conditions.
- [Safety Features](./safety-features.md) — the guards that keep a run from terminating wrongly.
