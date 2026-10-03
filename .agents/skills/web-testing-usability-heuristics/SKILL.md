---
name: web-testing-usability-heuristics
description: Spec-blind heuristic usability evaluation methodology for swe-usability-tester — Nielsen's 10 heuristics, cognitive walkthrough, first-click/information-scent analysis, the usability dimensions checklist, four mandatory systematic probes, URL naturalness, responsive usability, finding anatomy, and the three output modes (plan/delivery/local-tmp).
when_to_use: When performing spec-blind, first-time-user usability evaluation of a live website, or extending/auditing the swe-usability-tester agent's methodology.
---

# Web Usability Testing — Heuristic Evaluation Methodology

Full methodology for `swe-usability-tester`: how to evaluate a live site's first-time comprehension
against established usability science, without reading specs, source, or mockups.

## Reference Modules

- `reference/01-why-this-agent-exists-and-inputs.md` — why this agent exists, invocation inputs.
- `reference/02-spec-blind-discipline.md` — the Spec-Blind Discipline (hard rule).
- `reference/03-relationships-and-nondestructive-constraint.md` — relationship to
  `swe-web-tester` (exploratory charter)/`swe-web-tester` (design charter)/`swe-reviewer`, the Non-Destructive Constraint.
- `reference/04-heuristic-evaluation-and-walkthrough.md` — Nielsen's 10 heuristics, the
  cognitive-walkthrough four questions, first-click/information-scent analysis, the naive-user
  stance.
- `reference/05-usability-dimensions-checklist-part1.md` and
  `reference/06-usability-dimensions-checklist-part2.md` — the full dimensions checklist
  (predictability, consistency, information scent, edge states, error prevention, cognitive load,
  affordance, etc.).
- `reference/07-mandatory-probes-a-b-c.md` and
  `reference/08-mandatory-probe-d-and-url-naturalness.md` — the four Mandatory Systematic Probes
  (conditional-control discoverability, jargon scan, cross-view redundancy, unit/currency
  consistency) and URL Naturalness.
- `reference/09-responsive-usability.md` — Responsive Usability at mobile/tablet/desktop.
- `reference/10-browser-driving.md` — how to drive the browser (WebFetch/curl/Playwright).
- `reference/11-suggesting-new-behaviour-for-specs.md` — how to propose `spec-suggestions.md`
  entries without breaking the spec-blind stance.
- `reference/12-finding-anatomy-and-severity.md` — the full `UWT-###` finding anatomy and the
  Nielsen 0-4 severity scale.
- `reference/13-output-modes-overview.md` and `reference/14-output-mode-plan-and-delivery.md` — the
  output-mode selection table and the `plan`/`delivery` modes' document sets.
- `reference/15-output-mode-localtmp-procedure-and-quality.md` — the `local-tmp` mode, the
  11-step procedure summary, and quality guidelines.
- `reference/16-constraints.md` — hard constraints.

## Core Principles

**Stay blind, always.** The moment the evaluator learns the intended behaviour, first-time
comprehension can no longer be judged — never read `specs/**`, source, or mockups to decide what is
"correct". **Cite the principle, never a vibe** — every finding names the heuristic, walkthrough
question, UX law, or WCAG criterion it violates; no principle, no finding. **Enumerate, never
sample** — the four Mandatory Systematic Probes exist because a heuristic sweep reads past exactly
these failure classes once the evaluator has already explored the page.

## Related

`swe-web-tester` (exploratory charter) (the spec-aware functional/correctness sibling), `swe-web-tester` (design charter) (the
design-aware third lens of the live-site advocate triad), `plan-creating-project-plans` (explicit
plan-mode structure), `plan-writing-gherkin-criteria` (Gherkin ACs and `spec-suggestions.md` scenarios),
`docs-applying-content-quality`.
