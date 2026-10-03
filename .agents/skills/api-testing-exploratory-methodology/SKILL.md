---
name: api-testing-exploratory-methodology
description: Complete methodology for spec-aware, contract-aware session-based exploratory testing of a live REST or GraphQL API — inputs, relationships, non-destructive constraint, charter/tour/SFDIPOT methodology, test dimensions, mandatory systematic sweeps, driving the API, contract-and-specs ground truth, defect anatomy, and output modes. Backs the swe-api-tester (exploratory charter) agent.
---

# API Testing: Exploratory Methodology

Methodology for hunting contract-conformance, functional, edge-case, auth, and consistency defects on
a **running** REST or GraphQL API — the API-surface counterpart to the web tester triad.

## Reference Modules

1. [Why This Agent Exists](reference/why-this-agent-exists.md)
2. [Inputs](reference/inputs.md)
3. [Relationship to Other Agents](reference/relationship-to-other-agents.md)
4. [Non-Destructive Constraint](reference/non-destructive-constraint.md) — the hard rule.
5. [Session-Based Methodology](reference/session-based-methodology.md) — charters, tours, SFDIPOT,
   CRUSSPIC STMPL.
6. [Test Dimensions Checklist Part 1](reference/test-dimensions-checklist-part1.md) and
   [Part 2](reference/test-dimensions-checklist-part2.md) — contract conformance, status codes,
   error envelopes, edge cases, auth, consistency, pagination, idempotency, GraphQL, performance,
   security.
7. [Mandatory Systematic Sweeps Part 1](reference/mandatory-sweeps-part1.md) and
   [Part 2](reference/mandatory-sweeps-part2.md) — operation × property matrix, convention
   round-trip, declared-invariant conformance, self-completeness check.
8. [Driving the API and Contract Comparison](reference/driving-and-contract-comparison.md) — how
   to drive curl/GraphQL, contract-and-specs comparison.
9. [Spec-Gap Detection](reference/spec-gap-detection.md) — proposing behaviours for `specs/**`.
10. [Defect Anatomy and Severity](reference/defect-anatomy-and-severity.md) — `AET-###` anatomy,
    severity/priority scales.
11. [Output Modes Overview](reference/output-modes-overview.md) and
    [Output Mode `plan`](reference/output-mode-plan.md) — the output-mode selection table and the
    explicitly authorized `plan` mode's document set.
12. [Output Modes `delivery`/`local-tmp` and Procedure](reference/output-modes-delivery-localtmp-and-procedure.md)
    — the other two output modes and the 10-step procedure summary.
13. [Quality Guidelines and Constraints](reference/quality-guidelines-and-constraints.md)

## Core Principles

- **Enumerate, never sample** — the mandatory sweeps cover every operation, not a spot check.
- **Cite the contract or spec, never a vibe** — every "expected" quotes an OpenAPI clause, SDL type,
  or `.feature` scenario.
- **Non-destructive by default** — read-only unless per-run authorized; redact every credential.

## Quality-Gate Lifecycle Handoff

Under a quality gate, never report or fix a property the gate's Deterministic Boundary lists; its declared tool
owns it, per the [Quality Gate Contract](../../../repo-governance/development/workflow/quality-gate-contract.md). The live contract,
authorization, edge, and runtime sweeps stay in scope.

The API gate uses the complete methodology once for discovery. After its single fix and
rebuild/redeployment pass, verification reproduces only the original in-threshold findings and
smoke-tests affected API behaviour. It does not repeat mandatory full-discovery sweeps or probe
unrelated endpoints. A clean discovery passes immediately; no result automatically starts another
run.

## Related Skills

- `web-testing-exploratory-methodology` — rendered-UI counterpart (disjoint surface).
- `plan-creating-project-plans`, `plan-writing-gherkin-criteria`, `docs-applying-content-quality`.
