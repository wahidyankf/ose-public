---
description: Regenerating derived surfaces, running deterministic gates, performing semantic closure, and reconciling the file-touch ledger.
when_to_use: Use after every rule is written and dispositioned, before opening the PR.
---

# Step 8: Verification

Four verifications run, in order. Each one can send the run back to an earlier step.

## 1. Regenerate

Regenerate every derived surface the run's edits affect, and confirm the regenerated output lands
in the same commit as its source. A mirror that regenerates in a later commit is a mirror that was
wrong in this one.

## 2. Deterministic Gates

Run the gates covering the surfaces the ledger names — word budget, index completeness, link
validity, frontmatter, vendor neutrality, layer coherence, formatting, and lint.

**Assert exit codes.** Never conclude from the absence of a failure token: several validators emit
no such token and still fail. Never read an exit code through a pipe — the code belongs to the last
stage, so a filtered check reports the filter's success. Redirect output to a file and inspect both
the code and the file.

Where a gate was already failing before the run, establish that baseline explicitly and confirm the
run's paths are absent from the failure set. A pre-existing failure is not this run's to fix, but
"pre-existing" is a claim that has to be demonstrated.

## 3. Semantic Closure

Read the repaired surfaces once for semantic closure. Resolve only repair-caused conflicts, using
layer-aware precedence and the
[Minimal Sufficiency Test](../../../principles/general/simplicity-over-complexity/minimal-sufficiency-test.md).
Never broaden the ledger, reopen a settled preference, or seek perfection. Every semantic row must
now be closed, or have returned its specific blocker from Step 3 or Step 4.

This step never invokes [rules-quality-gate](../rules-quality-gate.md). That gate hands work _to_
propagation and propagation never calls back: the two form an acyclic pair, and a gate that ran
inside its own sole writer would make its verdict circular. Where a repository-wide duplication,
contradiction, or traceability concern is suspected beyond this run's subject, invoke `rules-checker`
directly and treat anything it finds as new propagation input, not as this run's blocker.

## 4. Reconcile the Ledger

Compare the file-touch ledger against the repository's reported status. Every path must appear in
both. A path in the status and not the ledger is an unintended edit — most often a neighbour swept
in by a formatting hook — and it is investigated before delivery, never quietly staged.

## Failure Routing

| Failure                  | Return to |
| ------------------------ | --------- |
| Budget exceeded          | Step 5    |
| Contradiction found      | Step 3    |
| Duplication found        | Step 6    |
| Gate declaration invalid | Step 7    |

## Related Documents

- [Step 9: Delivery](./step-9-delivery-and-sibling-obligation.md) — the next step.
- [Termination Criteria](./termination-criteria.md) — what a clean verification permits.
