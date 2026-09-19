---
description: Six worked invocation examples — default parallelism, set-selectors, exclusions, parallelism overrides, plan-only mode, and an explicit Depends-on declaration.
when_to_use: Use when you need a concrete invocation pattern to copy for running multi-plans-execution with a particular scope or mode.
---

# Example Usage

## Execute three plans with default parallelism (3)

```text
User: "Run multi-plans-execution for e2e-coverage-rule-feature-skip-fixme-gap
       git-root-test-fixture-race rust-cargo-target-dir-sharing"
```

The orchestrator loads the three plans, builds the DAG, materializes the union granular Task list, and
schedules ≤3 nodes at a time through each plan's full lifecycle.

In the real 2026-07-18 run of exactly these three plans, the DAG came out **more serial than a
file-level reading suggests** — a worked illustration of why A5/A6 are re-derived per run rather than
assumed:

- All four edit **different** files, so their disjoint on-disk footprints were initially
  parallelizable. An explicit shared-source declaration would still serialize its named steps —
  disjoint-on-disk does **not** imply parallelizable-to-merge.
- `rust-cargo-target-dir-sharing` had pivoted from a `scripts/*.sh` helper into a shared toolchain
  concern. A stale pre-pivot reading would have scheduled it as disjoint. **Re-read each plan's
  current scope; do not trust a prior run's classification.**
- A **safety-first ordering edge** was added by inference, not declaration: `git-root-test-fixture-race`
  fixes the very bug where parallel `nx affected` fixture tests corrupt the real repo, so running
  the other two plans' test suites in parallel _before_ that fix landed could re-trigger the corruption.
  It was therefore scheduled first and fully. **A plan that repairs the execution environment itself is
  a prerequisite of every plan that runs in that environment**, even with zero file overlap.

## Select a whole bucket with a set-selector

```text
User: "Run multi-plans-execution for all-in-progress"
User: "…for all plans in in-progress and backlog"          # → all
```

The orchestrator enumerates the bucket's folders at Phase A1, echoes the resolved plan set for
confirmation, then schedules exactly as for an explicit list. The set is frozen at resolution.

## Set-selector minus an exclusion list

```text
User: "Run multi-plans-execution for everything in in-progress and backlog except planC planD"
User: "…for all-in-progress except flaky-migration"
```

`all` (or `all-in-progress` / `all-backlog`) resolves the bucket, then subtracts the named plans.
Each excluded name must be in the resolved set or the run reports a scope error (a mistyped exclusion
never fails open into running a plan the caller meant to hold back).

## Override the parallelism

```text
User: "…with parallelism 2"     # ceiling of 2 nodes in flight
User: "…serially"               # parallelism 1 — dependency order only, no parallelism
```

## Review the schedule first

```text
User: "…in plan-only mode"      # emit the DAG report and stop for review
```

## Explicit dependency in a plan

```text
# In planB/README.md:
Depends-on: [source-drift-reconciliation]
# → planB's every node is scheduled only after that plan reaches its terminal state.
```
