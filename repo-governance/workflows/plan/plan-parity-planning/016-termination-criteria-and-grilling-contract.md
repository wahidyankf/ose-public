---
description: Defines pass/partial/fail outcomes and summarizes why the workflow's grilling is intentionally exhaustive.
when_to_use: Use when determining the workflow's final status, or understanding why every cross-repo difference must be grilled.
---

# Termination Criteria

**Success** (`pass`):

- Every plan receives a `PASS` or `PASS_WITH_FINDINGS` verdict from plan-quality-gate
- Every plan is delivered per the selected mode
- Zero undecided matrix rows (every deviation has a recorded decision and justification)

**Partial** (`partial`):

- Some plans gated and delivered; at least one plan is in `partial` or `fail` gate state, or
  at least one delivery target was not reached

**Failure** (`fail`):

- Technical errors that prevent step completion, or the invoker abandons grilling (Step 3 or
  Step 5) before all matrix rows are resolved — partial grilling produces no valid plans

## Grilling Contract

This workflow is intentionally exhaustive in its grilling. The invoker should expect multiple
AskUserQuestion-style multiple-choice rounds per the
[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md).

The workflow's value proposition is precisely that no cross-repo difference survives unexamined.
The grilling is not bureaucratic overhead — it is the core mechanism that transforms an ad-hoc
"let's do the same thing in each repo" impulse into a durable, auditable set of decisions.

The result is NOT a set of 1-to-1 identical repos. It is a set of repos whose every difference
from each other is intended. A repo that deviates from the others because of a real constraint
(private CI, different language stack, existing convention) and records that deviation is a
healthy outcome. A repo that deviates silently — because the grilling skipped the row — is a
workflow failure.

Every deviation requires:

1. A recorded resolution in the deviation matrix in each plan's chosen technical form
2. A recorded justification (why this repo differs)
3. A rationale doc in the repo's `docs/explanation/` tree (or equivalent location) describing
   the decision in plain language for future contributors

"We didn't discuss it" is never an acceptable justification.
