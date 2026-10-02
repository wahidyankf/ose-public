---
description: >-
  Gives each quality-gate family exactly one writer, `<family>-propagation`, run by `<family>-fixer`, and sets the eight
  rules that keep its repairs confined to a frozen ledger, idempotent, and non-recursive.
when_to_use: >-
  Use when writing or adopting a `<family>-propagation` workflow, when a gate hands over a frozen ledger, or when
  deciding whether a repair may touch something its finding did not name.
---

# Sole-Writer Propagation

Each quality-gate family has exactly one writer: the workflow `<family>-propagation`, executed by the agent
`<family>-fixer`. The gate and its checker judge and never write, per the
[Quality Gate Contract](quality-gate-contract.md). This document holds the rules every writer shares, so each family
file stays thin and states only what differs.

This standard implements One Source Per Fact and
[Minimal Sufficiency](../../principles/general/simplicity-over-complexity.md).

## Why One Writer

A single writer bound to a frozen ledger is what lets three cycles suffice:

- **The input is fixed.** The writer receives a frozen ledger and may touch only what its rows require. A repair cannot
  grow into an edit made "while I'm here" that the next audit reports as a new finding, so nitpicks do not cascade.
- **It is idempotent.** The same ledger against the same state produces the same change. Running it again on an
  already-repaired state changes nothing, so the open count can only fall.
- **Judging and writing stay separate.** The checker never writes, so each audit after a repair is independent of it.

## Shared Rules

1. **Entry.** A propagation runs with a frozen ledger, handed over by its gate or by an explicit request that names the
   rows. It also keeps any automatic trigger its repository already gives it, such as running before a rule change or
   before a commit that changes documentation.
2. **Re-validate first.** The fixer re-reads each row against the current state before editing, and rates its confidence
   per [Finding Criticality and Confidence](../quality/criticality-levels.md). A row that no
   longer holds is `not-applicable`, with evidence. A row whose correct repair is a judgement the ledger does not settle
   is `needs-decision`, and the writer does not guess.
3. **Edit only for the row.** Each change traces to one row ID. No formatting sweep, rename, or refactor goes beyond
   what the row requires.
4. **Verify each row.** After its edit, the writer proves the row closed with the narrowest check that shows it, and
   records the evidence.
5. **Idempotency.** Before editing, the writer checks whether the row's target state already holds. If it does, the row
   is `resolved` with no edit.
6. **No recursion.** A propagation never starts its own gate or another propagation. The caller decides whether to audit
   again, which keeps the call graph acyclic.
7. **No delivery.** A propagation never commits, pushes, or opens a pull request; its caller owns delivery. One named
   exception: `pr-review-propagation` commits each repair to the reviewed change's own branch and pushes only that
   branch.
8. **Revert on red exit.** When the gate's exit tooling run turns red, the writer reverts the repairs that caused it and
   marks those rows `not-resolved`.

Each row ends `resolved`, `not-resolved`, `not-applicable`, or `needs-decision`, with evidence. A row the writer did not
reach stays `open`, and the gate counts it.

## Family File Shape

A `<family>-propagation.md` workflow carries these headings, in this order. Where the repository declares a structural
check for propagations, it enforces their presence.

| Heading               | Holds                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| `## Contract`         | One line linking this shared propagation contract                          |
| `## Scope`            | The paths this writer may edit for the family                              |
| `## Executor`         | `<family>-fixer`, plus any family skill it loads                           |
| `## Row Verification` | How a row is proven closed for this family                                 |
| `## Family Rules`     | Rules only this family needs, such as an idempotency gate for rule changes |

The family file never restates a shared rule. It may narrow one, for example by shrinking its scope, but never loosens
it.

## Executor Naming

The writer is always `<family>-propagation`, and its executor is always `<family>-fixer`, in every family. A maker
authors; a fixer repairs only ledger rows. One agent never holds both roles in the same gate run.

## Existing Writers Keep Their Rules

Where a family's propagation already holds stricter writer rules than these, such as an idempotency gate that separates
a real rule change from a non-normative edit, its family file keeps them under `## Family Rules`. Adopting this contract
removes nothing such a writer does today.
