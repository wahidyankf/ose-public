---
description: "Documents the enumerate-don't-sample forcing function all three testers carry, plus the three cross-tester obligations this workflow layers on top: coverage matrices, recurrence re-checks, and changed-surface targeting."
when_to_use: "Use when verifying the testers were handed mandatory recurrence and changed-surface coverage, or when checking what a coverage-matrix artifact must contain."
---

# Systematic Coverage & Recurrence (all three testers)

A standing finding from re-running this workflow on the same target: dimension- and charter-driven
testing reliably surfaces _representative_ defects yet repeatedly misses the **"enumerate every element
and assert one property"** class — a shared control that no-ops on one tab, an input whose state never
reaches the URL, a stated invariant only half-implemented, a raw unstyled control, a hidden affordance,
a jargon label, a redundantly duplicated panel. The three testers now each carry **mandatory
forcing-function sweeps** for these (see each tester's _Mandatory Systematic Sweeps/Probes/Checks_
section). This workflow adds three cross-tester obligations on top:

- **Coverage-matrix artifact** — each tester records its enumerated matrices (control × surface,
  control × URL-round-trip, element × styling, declared-invariant conformance) in its coverage map; the
  consolidated plan's `README.md` keeps them so a reviewer can see _what was enumerated_, not just _what
  was found_. A sampled or empty matrix is not coverage.
- **Recurrence re-check** — the prior-class list compiled in Phase 0 is handed to every tester as a
  mandatory re-check, so a target does not keep re-yielding a class a fresh charter would skip.
- **Changed-surface targeting** — the diff-since-last-run list from Phase 0 directs explicit coverage of
  features added/changed after the previous test (the highest-risk untested surface).

These obligations are passed to each tester as part of its Phase 1–3 args and verified by the
cross-tester completeness critic in Phase 3.5.
