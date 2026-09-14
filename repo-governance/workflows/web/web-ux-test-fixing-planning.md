---
description: "Run the three live-site UX-quality testers (exploratory, usability, design) sequentially against the same URL(s), then solidify one source-attributed fix plan with tech-docs.md and a TDD-shaped delivery.md."
when_to_use: "Use before hardening a user-facing feature, to get a combined correctness/usability/design-fidelity read on a running site, or to refresh an existing findings plan via plan-mode=merge."
---

# Web UX Test-Fixing Planning Workflow

**Purpose**: Run the three complementary live-site UX-quality testers — spec-aware exploratory,
spec-blind usability, and design-aware design-fidelity — sequentially against the same live URL(s),
integrating each result set before the next runs, then solidify one source-attributed, fix-ready plan.
**The outcome is always the plan, never the implementation** — this workflow never edits app/lib
source or lands a behaviour change.

> The full `inputs:`/`outputs:` contract, and its readable Inputs-at-a-Glance summary, now live in
> the Contents children below.

## Goal and Termination

**Goal**: Run the three live-site UX-quality testers — spec-aware exploratory (correctness), spec-blind heuristic-usability, and design-aware design-fidelity — against the same live URL(s) and goal, sequentially, integrating each result set into the plan before the next runs, then solidify one fix-ready plan whose findings section keeps the three sources clearly separated (exploratory EWT-### vs usability UWT-### vs design DWT-###) and which carries a tech-docs.md (root-cause + fix approach), a TDD-shaped delivery.md describing how to fix every finding, and — when the plan is UI-bearing — an assets/ folder of both-tier (lo-fi + hi-fi) UI mockups. The deliverable is the plan, never the fixes.

**Termination**: A grill-validated plan exists under plans/in-progress/<identifier>/ containing README.md, brd.md, prd.md, findings.md (with separate Exploratory, Usability, and Design sections), tech-docs.md, and delivery.md, receives a PASS verdict from plan-quality-gate, and is pushed to the requested git target. No application or library source under apps/ or libs/ is modified by this workflow.

## Contents

### Overview

- [Purpose, Execution Mode, and When to Use](./web-ux-test-fixing-planning/purpose-execution-mode-and-when-to-use.md) — purpose, delegation vs manual mode, when to run it.
- [Inputs at a Glance and Grilling](./web-ux-test-fixing-planning/inputs-at-a-glance-and-grilling.md) — input quick-reference table and human checkpoints.
- [Inputs Reference — Part 1](./web-ux-test-fixing-planning/inputs-reference-parameter-contract.md) — YAML contract, target-urls through locales.
- [Inputs Reference — Part 2 and Outputs](./web-ux-test-fixing-planning/inputs-reference-part-2-and-outputs.md) — YAML contract, remaining inputs and all outputs.
- [Systematic Coverage & Recurrence](./web-ux-test-fixing-planning/systematic-coverage-and-recurrence.md) — the enumerate-don't-sample forcing function.

### Phases

- [Phase 0 — Pre-flight](./web-ux-test-fixing-planning/phase-0-pre-flight.md) — clean tree, reachable targets, recurrence memory.
- [Phase 1 — Exploratory Pass + Integrate](./web-ux-test-fixing-planning/phase-1-exploratory-pass-and-integrate.md) — spec-aware correctness pass.
- [Phase 2 — Usability Pass + Integrate](./web-ux-test-fixing-planning/phase-2-usability-pass-and-integrate.md) — spec-blind usability pass.
- [Phase 3 — Design Pass + Integrate](./web-ux-test-fixing-planning/phase-3-design-pass-and-completeness-critic.md) — design-fidelity pass.
- [Phase 3.5 — Cross-Tester Completeness Critic](./web-ux-test-fixing-planning/phase-3-5-completeness-critic.md) — pre-solidification critic.
- [Phase 4 — Solidify](./web-ux-test-fixing-planning/phase-4-solidify.md) — tech-docs.md, delivery.md, conditional UI assets.
- [Phases 5 and 6 — Quality Gate and Push](./web-ux-test-fixing-planning/phase-5-and-6-quality-gate-and-push.md) — hardening gate and final push.

### Reference

- [Gherkin Success Criteria — Part 1](./web-ux-test-fixing-planning/gherkin-success-criteria-plan-output-and-integration.md) — first four scenarios.
- [Gherkin Success Criteria — Part 2](./web-ux-test-fixing-planning/gherkin-success-criteria-merge-mode-and-escalation.md) — remaining four scenarios.
- [Related Documents, Principles, and Conventions](./web-ux-test-fixing-planning/related-documents-principles-and-conventions.md) — agents, workflows, principles, conventions.
