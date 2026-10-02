---
description: Invokes plan-planning with the full inventory, approved bump table, and a Definition of Done for the plan it must author.
when_to_use: Use when handing the approved bump set off to plan-planning to author the backlog plan.
---

# Phase 5: Backlog Plan Establishment (Sequential)

Invoke the [plan-planning workflow](../../plan/plan-planning.md) with:

- **Input** `target-stage`: `backlog` (lands at `plans/backlog/<identifier>/`).
- **Input** `push-target`: forwarded from this workflow's input.
- **Input** `prompt`: a self-contained handoff containing the full inventory, the approved bump
  table, the Security & Functional Clearance Status, the recorded cutoff date, a link to the
  `clearance-report`, and this **Definition of Done** for the plan it must author:
  - Every in-scope manifest is pinned (exact, no `^`/`~`) to its approved target version.
  - Lockfiles regenerated through separate transactional HIPPO boundaries (`npm install`,
    `cargo update -p`, `go mod tidy`, etc.).
  - Post-bump re-audit clean through ephemeral HIPPO boundaries (`npm audit --audit-level=moderate`,
    `govulncheck ./...`).
  - Post-bump CISA KEV cross-reference clean (no remaining KEV-listed CVEs in pinned versions).
  - All `WAIVER`/`FUNCTIONAL-HOLD`/`KEV-listed` entries propagated to `docs/reference/security-waivers.md` with KEV and EPSS columns populated.
  - Affected-project quality gates pass (typecheck, lint, and `test:quick`, including Unit runtime
    and every applicable static `test:coverage:*` validator).
  - The delivery checklist mirrors the policy's [Application Workflow](../../../development/workflow/dependency-bump-policy.md)
    steps 8–12, grouped per ecosystem, TDD-shaped where code changes are required.

Because `plan-planning` runs its own grill + (optional) research + `plan-maker` +
`plan-quality-gate` + push, this phase yields a gate-passing backlog plan.

**Output**: `plan-path`, `final-status`, `final-report` (from the nested quality gate).
