---
description: Explains where Phase 0's evidence artifacts land, why opening a Phase 0 PR is prohibited, and how plan-maker, plan-checker, and plan-quality-gate enforce it.
when_to_use: Use when a Phase 0 step writes an evidence artifact, or when checking why a Phase 0 PR was flagged as a violation.
---

# Phase 0 Opens No PR — Baseline Artifacts, Rationale, and Enforcement

Continues [Phase 0 Opens No PR — the Earliest PR Is Phase 1](./phase-0-opens-no-pr.md).

**Baseline artifacts land with the first change-producing delivery unit.** Under `*-to-pr`, that is
the first PR the plan opens, no earlier than Phase 1. Under a permitted direct mode, they land at the
first direct checkpoint. A baseline artifact never justifies its own integration.

The pure move from `backlog/` is the one exception the other way: it is delivered in
its **own promotion PR or commit before Phase 0** under
[Starting and Completing Work](./starting-and-completing-work.md#starting-work), so promoted plans can be
worktreed in parallel; it is not Phase 0 work and does not make Phase 0 open a PR.

**Why this is a hard rule**: a PR whose diff is empty, or holds only a baseline text file, still
consumes PR CI and creates branch, merge, and cleanup obligations for no shippable increment. It
also trains executors to treat "phase complete" and "PR merged" as synonyms, which is exactly the
conflation the [Delivery Mode](./delivery-mode-the-four-modes.md#delivery-mode) table prevents.

**A plan whose Phase 0 genuinely produces reviewable changes has a mis-scoped Phase 0**, not an exemption. Move that work into Phase 1 (or a later phase) and leave Phase 0 as setup and baseline only. Splitting the work is always available; opening a Phase 0 PR is not.

**Enforcement**: `plan-maker` never emits a PR-creation, optional semantic-review, PR-CI, or merge
step inside Phase 0. `plan-checker` flags any such step as **HIGH** regardless of delivery mode.
The gate's repair pass removes the offending step and folds any Phase 0 evidence artifact into the first
change-producing unit's mode-specific integration. `plan-execution-checker` flags a PR actually
opened for Phase 0 as **HIGH**, and flags a plan whose promotion was **not** landed on `origin/main` in
its own promotion PR or commit before Phase 0 as **HIGH**.
`repo-setup-manager` carries no push or PR step.
