---
description: "Runs web-exploratory-tester first and alone, then integrates its EWT-### findings and SG-### spec-gap proposals into the plan skeleton before Phase 2 starts."
when_to_use: "Use when checking exactly what the exploratory tester is dispatched with, or how its results get folded into the new/merged plan."
---

# Phase 1 — Exploratory Pass + Integrate

Run the spec-aware tester **first, alone**, then fold its results into the plan before the usability
pass starts. It is **non-destructive / passive** — it reads, clicks, resizes, and probes but never
mutates server state.

**Agent**: `web-exploratory-tester` — spec-aware. Compares live behaviour against existing
`specs/**` Gherkin; actively hunts edge cases and boundary conditions; produces a findings catalog
`EWT-###` (functional, behavioural-consistency, edge-case/boundary, UI/UX, responsive, accessibility,
URL/IA, passive security) plus spec-gap proposals `SG-###` (Gherkin scenarios for correct-but-unspecced
behaviour, edge cases especially).

- **Args**: `target-urls: {input.target-urls}`, `testing-goal: {input.testing-goal}`,
  `breakpoints: {input.breakpoints}`, `locales: {input.locales}`, plus the Phase 0 **recurrence
  re-check list** (prior-finding classes for this target) and **changed-surface list** (source changed
  since the last run) as mandatory coverage, and the instruction to record its enumerated coverage
  matrices in the coverage map.
- **Output**: Returns its full findings set as structured text (README/brd/prd/findings/spec-gaps
  bodies). Subagents cannot write under `plans/` directly, so the orchestrator captures the returned
  text.

**Integrate**: Establish the plan skeleton under `plan-path` (or, for `plan-mode=merge`, open the
existing folder) and write the Exploratory half: a `## Exploratory findings (EWT-###)` section in
`findings.md`, the `spec-gaps.md` proposals, and the exploratory slice of README/brd/prd. Preserve
the tester's original IDs.

**Success criteria**: Exploratory findings (possibly empty) integrated into the plan.
**On failure**: If the tester fails, record the gap prominently in the plan README and proceed to
Phase 2 with the usability and design perspectives — never silently drop a perspective.
