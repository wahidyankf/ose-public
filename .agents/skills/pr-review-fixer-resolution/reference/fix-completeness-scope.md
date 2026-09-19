# Fix the Class, Not the Sites the Finding Names

A finding cites the occurrences its author happened to read. That is evidence, not an inventory.
How wide the fix goes is the fixer's call, and this is the rule for making it.

A finding naming a stale count or term (e.g. "eight" → "nine") is fixed by a repo-wide grep for
the **old** term, not only the cited files. Fixing just the named occurrences reliably leaves a
contradicting instance in a file the citing specialist never read in full — this has recurred
across cycles. Grep before replying `Fixed`, not after a later cycle rediscovers the miss.

A fact restated across several files is a
[restatement by value](../../../../repo-governance/workflows/pr/pr-review-cycle/restatement-by-value.md):
reduce how many copies exist rather than syncing them.

## Why This Is Not Scope Creep

Widening a fix to every site of the **same** defect stays inside the PR — one defect stated in six
files is one problem, and fixing only the cited file leaves the other five contradicting it. Adding
a **different** defect is creep. See
[Scope Guard](../../../../repo-governance/workflows/pr/pr-review-cycle/scope-guard-no-scope-creep.md).

## A Fix That Crosses a Word Budget Is a Structural Change

Governance and skill prose carry the configured
[Governance Word-Budget](../../../../repo-governance/conventions/structure/governance-word-budget.md).
A file already near its ceiling does not accept a one-sentence fix: the remedy is progressive
disclosure, so the fix becomes a new shard, two index entries, and a regenerated mirror set. That
is new surface, and the next cycle reviews it.

Use `wc -w` only as a pre-write estimate, then run `./rhino governance word-budget validate` and
treat its count as authoritative. When a fix would cross the ceiling, choose the structure first —
which shard the rule belongs in, or which existing paragraph should move out to make room. A split
forced by the validator lands wherever the text happened to be longest, which is how a coherent
shard becomes a grab-bag. Raising a threshold is never the remedy.

## What the Reply Must Say

A reply claiming `Fixed` after a class-wide fix states the grep that was run and how many sites it
touched, so a later cycle can tell a complete fix from a partial one without re-deriving it.

A fix that added or moved a shard says so too. Re-reviewing a changed line and re-reviewing a new
file are different jobs, and the reviewer needs to know which one they have.
