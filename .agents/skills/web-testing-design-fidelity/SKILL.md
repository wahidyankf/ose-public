---
name: web-testing-design-fidelity
description: Complete methodology for design-aware live-site evaluation — inputs, the swe-reviewer boundary, non-destructive constraint, design-fidelity + design-practice evaluation, the five ground-truth sources, dimensions checklist, mandatory systematic checks, browser driving, finding anatomy, and output modes. Backs the swe-web-tester (design charter) agent.
---

# Web Testing: Design Fidelity

Methodology for judging whether a **running, rendered** page matches its intended design and
follows good visual-design practice — the design-team advocate of the live-site tester triad
(alongside spec-aware exploratory testing and spec-blind usability testing).

## Reference Modules

1. [Why This Agent Exists](reference/why-this-agent-exists.md) and [Inputs](reference/inputs.md)
   — the design-fidelity gap this agent closes; URL(s), design goal, and optional refinements.
2. [Relationships and Boundary](reference/relationships-and-boundary.md) and
   [Non-Destructive Constraint](reference/non-destructive-constraint.md) — relationship to other
   agents, the `swe-reviewer` hard boundary, allowed/forbidden actions.
3. [Methodology](reference/methodology.md) and
   [Ground-Truth Sources](reference/ground-truth-sources.md) — design-fidelity comparison,
   design-practice review's seven principles, the five ground-truth sources.
4. [Design Dimensions Checklist](reference/design-dimensions-checklist.md) — the full
   dimension-by-dimension checklist.
5. [Mandatory Systematic Checks](reference/mandatory-systematic-checks.md) — the two forcing
   functions (raw-element audit, styling-consistency matrix).
6. [Browser Driving](reference/browser-driving.md) — how to drive the browser, Locale + Evidence
   Awareness.
7. [Finding Anatomy and Severity](reference/finding-anatomy-and-severity.md) — `DWT-###` anatomy,
   severity and priority scales.
8. [Output Modes Overview](reference/output-modes-overview.md) and
   [Output Mode: plan](reference/output-mode-plan.md) — the output-mode selection table and the
   explicitly authorized `plan` mode's document set.
9. [Output Modes: delivery/local-tmp, and Procedure](reference/output-modes-delivery-localtmp-and-procedure.md)
   — the `delivery` and `local-tmp` modes, and the procedure summary.
10. [Quality Guidelines and Constraints](reference/quality-guidelines-and-constraints.md) — quality
    guidelines and hard constraints.

## Core Principles

- **Runtime, not source** — this agent drives a browser against the rendered page; it never reads
  component source or audits static tokens (that is `swe-reviewer`'s charter).
- **Cite the ground truth** — every fidelity claim points at one of the five sources, never a vibe.
- **Enumerate, never sample** — the mandatory checks sweep every raw element and every shared
  control, not a spot check.

## Related Skills

- `web-testing-exploratory-methodology` — spec-aware functional/correctness sibling.
- `web-testing-usability-heuristics` — spec-blind comprehension sibling.
- `plan-creating-project-plans`, `plan-writing-gherkin-criteria`, `docs-applying-content-quality`.
