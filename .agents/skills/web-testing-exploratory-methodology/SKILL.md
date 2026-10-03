---
name: web-testing-exploratory-methodology
description: Spec-aware session-based exploratory testing methodology for swe-web-tester (exploratory charter) — charter framing, testing tours, SFDIPOT/CRUSSPIC STMPL coverage models, the test dimensions checklist, three mandatory systematic sweeps, specs-as-ground-truth comparison and spec-gap detection, defect anatomy, and the three output modes (plan/delivery/local-tmp).
when_to_use: When performing spec-aware exploratory testing of a live website for functional/correctness defects, or extending/auditing the swe-web-tester (exploratory charter) agent's methodology.
---

# Web Exploratory Testing — Session-Based Methodology

Full methodology for `swe-web-tester` (exploratory charter): how to hunt functional, edge-case, and consistency
defects on a live site using Session-Based Test Management, comparing against `specs/**` as ground
truth.

## Reference Modules

- `reference/01-why-this-agent-exists-and-inputs.md` — why this agent exists, invocation inputs.
- `reference/02-relationships-and-nondestructive-constraint.md` — relationship to
  `swe-usability-tester`/`swe-web-tester` (design charter)/`swe-reviewer`, the Non-Destructive Constraint.
- `reference/03-session-based-methodology.md` — charter framing (Hendrickson template), testing
  tours (Whittaker taxonomy), SFDIPOT coverage, CRUSSPIC STMPL quality criteria.
- `reference/04-test-dimensions-checklist-part1.md` and
  `reference/05-test-dimensions-checklist-part2.md` — the full dimensions checklist (functional
  flows, edge cases, behavioural consistency, forms, navigation, URL/IA, responsive, accessibility,
  performance, cross-browser, safe security surface).
- `reference/06-mandatory-sweeps-part1.md` and `reference/07-mandatory-sweeps-part2.md` — the three
  Mandatory Systematic Sweeps (shared-control × surface matrix, per-control URL/state round-trip,
  declared-invariant conformance) and the self-completeness check.
- `reference/08-browser-driving.md` — how to drive the browser (WebFetch/curl/Playwright/Lighthouse).
- `reference/09-specs-ground-truth-and-spec-gaps.md` — comparing live behaviour against `specs/**`
  and spec-gap detection.
- `reference/10-defect-anatomy-and-severity.md` — the full `EWT-###` defect anatomy and the
  severity/priority scales.
- `reference/11-output-modes-overview.md` and `reference/12-output-mode-plan.md` — the output-mode
  selection table and the explicitly authorized `plan` mode's document set.
- `reference/13-output-modes-delivery-localtmp-and-procedure.md` — the `delivery` and `local-tmp`
  modes, and the 10-step procedure summary.
- `reference/14-quality-guidelines-and-constraints.md` — quality guidelines and hard constraints.

## Core Principles

**Enumerate, never sample** — the three Mandatory Systematic Sweeps exist because charter-and-tour
testing reliably finds representative defects yet misses the "assert one property for every element"
class. **Cite the ground truth** — every "expected" points to a mockup, spec, contract, or
independent computation, never a guess. **Spec gaps are proposals, not verdicts** — a live behaviour
that contradicts an existing scenario is a defect for `findings.md`; only correct-but-unprotected
behaviour becomes a `spec-gaps.md` proposal.

## Related

`swe-usability-tester` (the spec-blind first-time-comprehension sibling), `swe-web-tester` (design charter) (the
design-aware third lens of the live-site advocate triad), `plan-creating-project-plans` (explicit
plan-mode structure), `plan-writing-gherkin-criteria` (Gherkin ACs and `spec-gaps.md` scenarios),
`docs-applying-content-quality`.
