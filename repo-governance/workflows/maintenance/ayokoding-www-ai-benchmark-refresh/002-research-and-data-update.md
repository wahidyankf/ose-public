---
description: "Steps 0-3 of the AI benchmark refresh: open the worktree, research in parallel, hold the methodology checkpoint, and apply the data."
when_to_use: "Use when starting a refresh or working out what the research and data-edit steps require."
---

# Research and Data Update

Paths starting `core/` or `shell/` are relative to `apps/ayokoding-www/src/features/ai-benchmark/`. The
[Data-Sourcing Prompt](../../../../apps/ayokoding-www/docs/ai-benchmark/data-sourcing-prompt.md) names the
roster, the boards, the catalog harnesses, and the substitute harnesses; this page uses neutral terms for
them.

## 0. Worktree (Procedure, Sequential)

**Procedure**: Bring the primary checkout's `main` level with `origin/main`, per
[Terminal Reconcile](../../../development/workflow/bare-repo-landing-method/terminal-reconcile.md) for its
topology. Create `worktrees/ai-benchmark-refresh-<date>` per the `worktree-to-pr` mode in
[Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode), then
initialize it per [Worktree Toolchain Initialization](../../../development/workflow/worktree-setup.md). All
compute runs through `./hippo run`, per
[Resource-Aware Development](../../../development/practice/resource-aware-development.md).

- **Output**: an initialized worktree on its own branch
- **On failure**: stop as `failed`; nothing has changed yet

## 1. Research (Parallel)

**Agent**: `web-researcher`, up to three instances (never more than `max-concurrency`):

- **Roster and prices**: Prompt 1 item 2, the frontier vendors' roster and API prices
- **Results**: Prompt 2, the independent benchmark results and each board's last-updated date
- **Catalog harnesses and availability**: Prompt 1 items 1, 3, and 4, each catalog harness's roster
  with its listed prices, the plan's own model list behind each plan-scoped harness, and per-model
  harness availability

- **Args**: the matching prompt in the Data-Sourcing Prompt; its rules govern the research
- **Output**: cited rows plus each board's last-updated date. The researcher is read-only, so the main
  thread saves them to `local-tmp/ayokoding-benchmark-refresh/` in the worktree.
- **Condition**: `scope=prices` skips the results instance; `scope=results` runs only the results instance
- **Depends on**: Step 0
- **On failure**: an instance that cannot fetch a page names it; the main thread reads a client-rendered
  board in a real browser, as the prompt directs. A source still unreadable keeps its current row.

**Success criteria**: every instance returns cited rows, or names the page it could not fetch.

## 2. Methodology Checkpoint (Conditional, Human Checkpoint)

A data refresh never changes methodology silently. Methodology means the pinned benchmark versions in
`BENCHMARK_SPECS`, the per-benchmark tier anchors in `benchmarkTierAnchors`, and the tier rules in
`core/tiers.ts`: a model's tier on one benchmark is set by that benchmark's anchors, and its overall
tier is the consensus tier — the tier it holds on the most benchmarks, ties to the highest tied tier,
from at least two tiered benchmarks. The page computes no composite or average score. The shared JSON
still carries `tierAnchors`, `weight`, and `compositeIndexMax` for the Go port; a www data refresh
never removes them.

This workflow runs on demand only; no schedule triggers it.

One candidate benchmark is waitlisted: SWE-bench Pro (Scale standardized public set). Add it as a new
benchmark only when its standardized board covers most of the current frontier roster including
usable tier anchors — at the 2026-11-15 check it covered 3 of 109 roster models, with current frontier
models present only as vendor-reported scores, which the roster never records.

- **Condition**: research shows a pinned benchmark version superseded, a tier anchor retired, aged past
  the two-year cap, or no longer general-access, or a reason to change the tier rule
- **Depends on**: Step 1
- **Prompt**: report the finding with its sources and ask through `AskUserQuestion`, per
  [Human Checkpoints](../../../conventions/structure/workflow-pattern/human-checkpoints.md): "Methodology change found.
  How should this refresh proceed?"
- **Options**:
  - Keep the methodology → continue to Step 3 with the current pinned versions and anchors
  - Change the methodology → stop as `halted` with the evidence in the final report, then run Step 7;
    the change is its own reviewed work, not this refresh
- **Timeout**: none; the workflow waits

## 3. Apply Data (Procedure, Sequential)

**Procedure**: Carry out steps 1-5 of
[After you get the data](../../../../apps/ayokoding-www/docs/ai-benchmark/data-sourcing-prompt.md#after-you-get-the-data);
its step 6 runs in Step 4 here.

- **Depends on**: Step 1, and Step 2 when it triggered and the user kept the methodology
- **Output**: the edited data files
- **On no change**: when no figure, price, or roster row differs, discard the date-only edits, set
  `final-status` to `no-change`, record the evidence in the final report, and go straight to Step 7
- **On failure**: a tier invariant that breaks on new figures means the methodology no longer fits the
  data; report it and stop as `halted`
