---
description: Covers A1-A3 — resolving plan scope, recording each plan's advisory verdict state, and parsing delivery checklists into DAG nodes.
when_to_use: Use when resolving plan scope, recording verdict history, or building DAG nodes from a delivery.md.
---

# Phase A — Load Plans and Build the Dependency DAG (Scope and Nodes)

Continued in
[Phase A — Edges, Report, and Diagram](./005-phase-a-edges-report-and-diagram.md).

**A1. Resolve the caller's scope to a concrete, frozen plan set.** The `plans` input is either an
explicit list or a set-selector; both resolve once into one enumerated set.

- **Explicit list** — for each named plan, resolve its folder (in `plans/in-progress/` or, if named
  there, `plans/backlog/`). Fail fast with a clear error if a named plan does not exist.
- **Set-selector** — enumerate the named bucket's folders: `all-in-progress` → every folder directly
  under `plans/in-progress/`; `all-backlog` → every folder directly under `plans/backlog/`; `all` →
  both. Skip non-plan entries (`README.md`, the `ideas/` folder, `.gitkeep`).
- **Exclusion (`except …`)** — subtract every named plan from the resolved set. Each excluded name
  MUST match a plan actually in the set; a no-op exclusion (name not in scope) is a caller error —
  report it rather than silently ignoring, so a typo'd exclusion never fails open into executing a
  plan the caller meant to hold back.
- **Echo the in-memory frozen set and execution mode.** Print the list and selector/exclusions for
  caller confirmation. An empty set terminates `fail`. `plan-only` observes current lifecycle
  paths without creating an issue, branch, pull request, merge, or direct push. `execute` likewise
  defers every durable mutation until A2 accepts the complete set.

**A2. Record each member's verdict state before side effects.** Note every frozen member's `plan-quality-gate`
state from its `delivery.md` when present. Verdicts are advisory history: `FAIL` and `BLOCKED` stop nothing, and
their open blocking rows keep the owners the gate gave them. A missing verdict is recorded as
`plan-quality-gate: not run (manual-only)` and never stops the run; never promote a subset around a member
silently — report each member's state before promotion.

**Execute-mode promotion gate.** Only after A2 accepts the complete caller-confirmed set, apply
[Frozen Scope Recovery](./004-phase-a-frozen-scope-recovery.md), then promote every `plans/backlog/`
member with the canonical
[Starting Work procedure](../../../conventions/structure/plans/starting-and-completing-work.md#starting-work).
Deliver each member's pure move to `origin/main` in its **own promotion pull request** (or permitted direct
commit), including the [Plan-Order Graph](../../../conventions/structure/plans/plan-order-graph-and-legend.md)
class, marker, and colour change, **before Phase 0**. Schedule a member's nodes only after its move is
verified on `origin/main`, its path resolves under `plans/in-progress/`, and that state is in the durable
run record. `plan-only` skips this gate and parses each member at its observed path.

**A3. Parse each plan's delivery checklist into nodes.** Read every plan's `delivery.md`
top-to-bottom (disk is truth). Every action checkbox becomes one **node**, including each separate
RED, GREEN, and REFACTOR checkbox. In planned delivery a cohesive batch is **one** such trio — one
RED node, one GREEN node, one REFACTOR node covering the batch's scenarios together, per
[Batched Cycles](../../../development/workflow/test-driven-development/tdd-shape-for-delivery-checklists.md#batched-cycles-in-planned-delivery);
never expand it into per-scenario trios, and never schedule production code before its batch's RED
node. The enclosing outcome section's acceptance reference plus Input/Outcome/Proof travel with every
child node as context; they are not nodes themselves. A node carries: `plan-id`, `phase`, outcome
context, exact checkbox prose, its `[AI]`/`[HUMAN]` tag, and a computed **resource-set** (A5).
