---
description: "Summarizes every workflow input in a quick-reference table, then documents exactly which decision points must be grilled with the user via AskUserQuestion."
when_to_use: "Use when checking a specific input's default/requirement, or when confirming which decisions this workflow always asks the user about rather than assumes."
---

# Inputs at a Glance and Grilling

## Inputs at a glance

| Input              | Required | Default               | Notes                                     |
| ------------------ | -------- | --------------------- | ----------------------------------------- |
| `target-urls`      | yes      | —                     | Same set handed to all three testers      |
| `testing-goal`     | yes      | —                     | Shared charter, interpreted per lens      |
| `plan-mode`        | no       | `new`                 | `new` creates a plan; `merge` updates one |
| `plan-identifier`  | no       | derived from target   | New-plan slug (no date prefix)            |
| `target-plan-path` | no       | —                     | Required when `plan-mode=merge`           |
| `breakpoints`      | no       | testers' standard set | Responsive viewports                      |
| `locales`          | no       | ALL supported locales | Locale path segments (never default-only) |
| `push-target`      | no       | `origin main`         | Git destination for the finished plan     |

## Grilling (Human Checkpoints)

This workflow **grills the user hard whenever a decision is genuinely needed** — it never guesses a
material choice. Every grill question is asked with the `AskUserQuestion` tool as a multiple-choice
prompt per the
[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md), and every
question always offers the standing options required by that convention (a blank-state / "none of
these" type answer **and** a "let's chat about this" escape hatch). Grill only when the answer
changes what the workflow does; when a sensible default exists, take it and state it.

Decision points that trigger a grill:

- **Pre-flight** — ambiguous or multi-candidate target URLs; `plan-mode` (new vs merge) when not
  given; the new-plan `plan-identifier`; which `locales`/`breakpoints` to cover when the target is
  multi-locale or the responsive scope is unclear.
- **After all three passes are integrated (entering Phase 4)** — which findings are in scope vs
  deferred; prioritization/severity disputes; the **fix approach** where more than one valid option
  exists; whether to accept each `SG-###` (exploratory or design) as a specs addition.
- **UI direction (UI-bearing plans)** — which low-fidelity alternative advances to high-fidelity, and
  which high-fidelity finalist is selected (the design-funnel decision), grilled before the
  `.excalidraw.png` finalists are committed.
- **Before push** — confirm the `push-target` when it differs from the default.

The Phase 4 `plan-maker` invocation performs its own before/after grill as part of authoring; this
section governs the workflow-level checkpoints around it so no material decision is made silently.
