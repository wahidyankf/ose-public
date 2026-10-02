---
description: Covers D5-D6 of Phase D — the mandatory cross-plan learnings consolidation pass and the final summary report before the run reports pass.
when_to_use: Use when consolidating recurring or cross-cutting learnings across every plan in a run, or emitting the run's final summary report.
---

# Phase D — Cross-Plan Knowledge Capture and Finalization

Continued from
[Phase D — Per-Plan Full Lifecycle and Failure Isolation](./008-phase-d-lifecycle-and-failure-isolation.md).

**D5. Cross-plan learnings solidification (mandatory before the run reports `pass`).** After every
plan has completed its own Knowledge Capture (D4), run one **consolidation pass over all plans
executed in this run** so recurring and cross-cutting learnings reach a durable home instead of being
stranded in individual archived plan folders:

1. **Gather.** Read every executed plan's final `learnings.md` (including quarantined plans — a
   quarantine reason is itself a learning) plus the DAG report (A7) and this workflow's own scheduling
   observations (mis-inferred dependency edges, resource conflicts that surprised the schedule,
   parallelism that had to be dialed back).
2. **Cluster into cross-cutting themes.** Identify learnings that appear in **two or more** plans, or
   that concern the multi-plan run itself (scheduling, byte-identity serialization, worktree
   contention, shared-toolchain effects). A theme seen once in a single plan stays that plan's own
   business — it was already routed in D4; do not double-file it.
3. **Route each theme to a durable home**, applying the [Knowledge Capture
   Convention](../../../development/quality/knowledge-capture.md) rubric and **both safety gates** (the
   secret/sensitivity gate and the repo-relevance gate) to every surviving item: a recurring
   engineering insight → the relevant `repo-governance/` convention or development doc; a scheduling
   or workflow insight → this workflow or `plan-execution.md`; a follow-up worth its own work → a new
   user-authorized `plans/ideas/` two-pager, never a `plans/backlog/` artifact; otherwise
   `Reported without plan authorization` with handoff evidence; anything that fails a gate or the
   litmus test → discarded with a one-line reason. **Zero cross-cutting themes may be left in an
   open, undecided state.**
4. **Record the consolidation** in the summary report (D6) — each theme, the plans it spanned, and its
   terminal routing decision — so the solidification is auditable, not implicit.

This is the multi-plan analogue of the per-plan Knowledge Capture gate: D4 ensures no single plan
loses its learnings; D5 ensures the **portfolio-level** signal (what these plans taught _together_)
is not lost when each plan's folder is archived in isolation.

**D6. Finalization.** When all plans have reached a terminal state AND cross-plan learnings
solidification (D5) is complete, emit the summary report to
`local-tmp/multi-plans-execution/multi-plans-execution__<uuid>__<timestamp>__summary.md`: per-plan terminal status
(done / handed-off / quarantined / partial), the parallelism actually achieved, quarantines with
reasons, all preexisting fixes made, and the **consolidated cross-plan learnings** with their routing
decisions (D5.4). Report `partial` if any plan was quarantined or hit `max-cycles`; `pass` only
when every plan reached its clean terminal state **and** cross-plan learnings were solidified.
