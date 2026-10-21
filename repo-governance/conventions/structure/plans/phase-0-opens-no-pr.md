---
description: States that Phase 0 never opens a PR, pushes a branch, runs PR CI, or merges under any delivery mode.
when_to_use: Use when scoping a plan's Phase 0 to confirm it contains no PR-creation or merge step.
---

# Phase 0 Opens No PR — the Earliest PR Is Phase 1 (HARD RULE)

**Phase 0 never opens a pull request. The earliest phase that may open one is Phase 1.**

Phase 0 is [Environment Setup and Baseline](./phases-as-natural-pauses.md#phases-as-natural-pauses-with-clear-gates-hard-rule): it installs dependencies, converges the polyglot toolchain, records a baseline test run, and resolves preexisting failures. It changes nothing a reviewer can review — no source, no docs, no governance, no specs. Under **every** Delivery Mode, including the default `worktree-to-pr`, Phase 0 therefore:

- opens **no** PR — `gh pr create` never appears in a Phase 0 step or gate;
- pushes **no** branch to `origin`;
- runs **no** PR CI or optional semantic review;
- merges **nothing**; and
- has **no** CI run of its own to monitor.

Its gate is the recorded clean baseline, and nothing more. The pure move from `backlog/` is not Phase 0 work: it is
delivered in its own promotion PR or commit and verified on `origin/main` before Phase 0 begins, under
[Starting and Completing Work](./starting-and-completing-work.md#starting-work). Phase 0 itself still opens no PR.

This is not an exception to [Delivery Checklists Express a DAG](./delivery-checklists-express-a-dag.md#delivery-checklists-express-a-dag-hard-rule) — it follows from it. That rule binds each independent DAG node **that produces changes**. Phase 0 produces none, so it is not a delivery node at all; it is the precondition every delivery node depends on.

See [Phase 0 Opens No PR — Baseline Artifacts, Rationale, and Enforcement](./phase-0-opens-no-pr-rationale-and-enforcement.md) for where evidence files land, why this is a hard rule, and how it is enforced.
