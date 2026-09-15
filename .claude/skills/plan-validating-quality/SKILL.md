---
name: plan-validating-quality
description: >-
  Full validation methodology for project plans used by plan-checker: structure, BRD and PRD requirements, technical
  documentation, delivery-checklist executability, and 21 numbered rules from operational readiness to Vercel MCP
  capability.
when_to_use: >-
  When validating a project plan before execution, or extending/auditing the plan-checker agent's methodology.
---

# Validating Plan Quality

Full methodology for `plan-checker`: what "complete, clear, and executable" means for a project plan,
across prospective structure, bootcamp-graduate readability, requirements, material
alternatives/prior art, technical docs, granular delivery checklists, and 21 numbered
validation rules layered on top of the base five validation-scope sections.

## Reference Modules

- `reference/structure-and-requirements-validation.md` and
  `reference/technical-documentation-validation.md` — Validation Scope 1-3: folder/file structure,
  BRD/PRD content placement, technical documentation and the File-Impact tree HARD RULE.
- `reference/delivery-checklist-validation-part1.md` and
  `reference/delivery-checklist-validation-part2.md` — Validation Scope 4: the full HARD RULE
  summary layer for delivery checklists and the granularity standard.
- `reference/pr-step-authorization-check.md` and
  `reference/pr-boundary-detection-and-consistency-validation.md` — the PR Step Authorization
  Check (with detection scripts), No PR Outside a Declared Delivery Boundary, and Validation Scope 5
  (Consistency).
- `reference/workflow-overview.md` — the Step 0-7 execution sequence (false-positive skip list,
  re-validation mode, codebase inspection).
- `reference/factual-accuracy-validation.md` — Factual Accuracy Validation (Step 4b).
- `reference/rule8-operational-readiness-validation.md`,
  `reference/rule9-manual-behavioural-assertion-validation.md`,
  `reference/rule10-worktree-specification-validation.md`, and
  `reference/rule11-execution-grade-clarity-validation.md` — rules 8-11: Operational Readiness
  (5b), Manual Behavioural Assertion (5c), Worktree Specification (5d), Execution-Grade Clarity (5e).
- `reference/rule12-anti-hallucination-scan.md`,
  `reference/rule13-harness-neutrality-scan.md`,
  `reference/rule14-executor-tag-validation.md`, and
  `reference/rule15-phase-gate-and-natural-pause-validation.md` — rules 12-15:
  Anti-Hallucination Scan (5f), Harness-Neutrality Scan (5g), Executor-Tag Validation (5h),
  Phase-Gate & Natural-Pause (5i).
- `reference/rules16-specs-gherkin-and-regression-test.md`,
  `reference/rule17-ui-design-funnel-completeness.md`, and
  `reference/rule18-knowledge-capture-phase-presence.md` — rules 16-18: Specs & Gherkin Coverage
  (5j) plus the Regression Test Mandate, UI-Design-Funnel Completeness (5k), Knowledge Capture Phase
  Presence (5l).
- `reference/rule19-delivery-mode-validation-part1.md` and
  `reference/rule19-delivery-mode-validation-part2.md` — rule 19: Delivery Mode Validation (5m).
- `reference/rule20-learning-bearing-syllabus-completeness.md` — rule 20: Learning-Bearing
  Syllabus Completeness (5n).
- `reference/rule21-vercel-mcp-capability-declaration.md` — rule 21: Vercel MCP Capability
  Declaration (5o).

## Core Principles

**Every rule states its own criticality** (CRITICAL/HIGH/MEDIUM/LOW) — never freelance a severity not
listed in the owning reference module. **Falsifiable both ways**: every detection command's acceptance
criterion must be checked against both the pre-violation and post-violation state before trusting it.
**Conditional rules skip cleanly**: Harness-Neutrality (13), Learning-Bearing Syllabus (20), and Vercel
MCP (21) are scope-gated — record the exemption explicitly rather than silently omitting the check.

**Minimal sufficiency is reviewed contextually**: treat the outcome, non-goals and out-of-scope
items, acceptance criteria, every applicable repository rule, and required lifecycle obligations
and gates as the stop condition. A plan introducing a lasting mechanism must name its concrete need
and explain why existing mechanisms are insufficient; scope outside that boundary or mandatory
safeguards omitted in the name of minimalism is a finding.

**Delivery boundaries are contextual**: LOC and file counts never create, erase, or force them.
Validate one natural cohesive seam per unit, every artifact needed for internal consistency, and an
immediately production-deployable resulting `main` state. Incomplete behaviour requires a temporary
production-disabled flag, tests for both paths, and rollout/rollback/removal.

## Quality-Gate Lifecycle Handoff

When the plan quality gate provides `delegated-gate-ids` and an evidence ledger, omit only exact
registry IDs or predicates connected through `verifies`. Deterministic gates own links, maps, word
budgets, formatting, and Mermaid mechanics. Project-local `test:coverage:behaviour` owns static
Gherkin corpus, adapter, exemption, and journey-shape evidence; semantic journey quality remains in
scope. Preserve pending state; never rerun or infer delegated work. Plan structure, semantics,
evidence, and executability remain in scope. See the
[lifecycle ownership policy](../../../repo-governance/workflows/meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md).

## Related

`repo-generating-validation-reports` (report format, Convergence Safeguards), `repo-applying-maker-checker-fixer`
(workflow shape), `docs-validating-factual-accuracy` (Step 4b methodology), `plan-writing-gherkin-criteria`
(Gherkin authoring rules this validates against), `plan-creating-project-plans` (the authoring-side
counterpart plan-checker validates against).
