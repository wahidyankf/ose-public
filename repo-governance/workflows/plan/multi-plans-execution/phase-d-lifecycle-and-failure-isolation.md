---
description: Covers D1-D4 of Phase D — the full per-plan lifecycle arc, byte-identity propagation as a unit, quarantine on failure, and inherited per-plan Knowledge Capture.
when_to_use: Use when driving one plan through its full lifecycle inside a multi-plan run, or handling a node failure without cascading it to independent plans.
---

# Phase D — Per-Plan Full Lifecycle and Failure Isolation

Continued in
[Phase D — Cross-Plan Knowledge Capture and Finalization](./phase-d-knowledge-capture-and-finalization.md).

**D1. Full lifecycle per plan.** Each plan proceeds through the complete `plan-execution.md` arc:
execute all `[AI]` items → validation via `plan-execution-checker` → iterate to zero findings → for a
`*-to-pr` plan, exact-head/base PR CI plus one current-head [`pr-leak-review`](../../pr/pr-leak-review.md)
→ merge or `[HUMAN]` handoff per the plan's Delivery Mode → archival to `plans/done/`. Multi-plan
scheduling changes _when_ these steps run relative to other plans, never _whether_ they run.

**D2. Byte-identity plans propagate as a unit.** A plan whose changes fall under the `apps/rhino-cli`
byte-identity boundary lands byte-identically across `ose-public`/the private sibling. Two such
plans are always serialized (A6.2) so their propagations never race.

**D3. Failure isolation (quarantine).** If a node fails and cannot be fixed (per Iron Rule 3, fix ALL
issues including preexisting first — only a genuine hard blocker counts as failure): mark that plan
**quarantined**, stop scheduling any of its remaining nodes AND any plan that `Depends-on` it, and
record the reason. **Independent plans keep running** — one plan's blocker never halts the disjoint
work. Never bypass a failing gate to keep a plan moving.

**D4. Per-plan Knowledge Capture is inherited (not skipped).** Each plan still runs its own
[Knowledge Capture pre-archival gate](../plan-execution/finalization-pre-archival-gates.md)
before that plan archives — every entry in its `learnings.md` reaches a terminal state (routed
inline, filed as an explicitly authorized `plans/ideas/` two-pager (never a directly created
backlog folder), reported without plan authorization with handoff evidence, or discarded with a
one-line reason), both safety gates applied. Multi-plan scheduling never lets a plan archive with an
open, undecided `learnings.md`.
