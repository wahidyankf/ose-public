---
description: Covers A1-A3 — resolving plan scope, gating unvetted plans, and parsing delivery checklists into DAG nodes.
when_to_use: Use when resolving plan scope, gating on plan-quality-gate, or building DAG nodes from a delivery.md.
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

**A2. Refuse unvetted plans before side effects.** Confirm every frozen member passed
`plan-quality-gate` (a `PASS` verdict — check its ledger or re-run the gate). If any
member fails, report the full result and stop the run before creating recovery state or promotion
artifacts; never promote a subset around it.

**Execute-mode promotion gate.** Only after A2 accepts the complete caller-confirmed set, apply
[Frozen Scope Recovery](./004-phase-a-frozen-scope-recovery.md), then promote every `plans/backlog/`
member with the canonical
[Starting Work procedure](../../../conventions/structure/plans/starting-and-completing-work.md#starting-work).
Create or resume and merge the pure-move PR from the delivery mode's declared work location; use a
direct push only when that selected mode permits it. Schedule no node until every promotion is
reachable from `origin/main`, resolves under `plans/in-progress/`, and is verified in the durable
run record. `plan-only` skips this gate and parses each member at its observed path.

**A3. Parse each plan's delivery checklist into nodes.** Read every plan's `delivery.md`
top-to-bottom (disk is truth). Every action checkbox becomes one **node**, including each separate
RED, GREEN, and REFACTOR checkbox. The enclosing outcome section's acceptance reference plus
Input/Outcome/Proof travel with every child node as context; they are not nodes themselves. A node
carries: `plan-id`, `phase`, outcome context, exact checkbox prose, its `[AI]`/`[HUMAN]` tag, and a
computed **resource-set** (A5).
