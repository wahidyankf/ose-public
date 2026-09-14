---
description: Before a number is allowed to justify a decision, prove the command produced it, prove it measures the path that actually runs, and prove the metric responds to the thing being changed
when_to_use: Use before any benchmark timing, CI metric, or measured number is used to justify a decision, a plan's remedy, or an acceptance-clause threshold.
---

# Trustworthy Measurement

A measurement is a claim about the system. Most bad measurements in this repo have not been slightly
wrong — they have been claims about something else entirely, while looking exactly like a good
result. A harness that never ran the command reports a spectacular speedup. A benchmark of an
isolated invocation reports a saving the integrated path never pays. A metric that cannot respond to
the change reports a regression the change did not cause.

None is caught by looking harder at the number. Each needs its own check before the number
justifies anything.

## Principles Implemented/Respected

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)** —
  understand what a measurement actually measured before acting on it.
- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)** — a metric moving
  is not a cause; the component on the critical path is.

## Contents

- [Rule 1 — Prove the Command Ran](./trustworthy-measurement/rule-1-prove-the-command-ran.md) — the false-zero timing-harness trap and how to guard against it.
- [Rules 2-4](./trustworthy-measurement/rules-2-to-4.md) — measure the integrated path, establish the critical path, and treat a pre-authored remedy as a hypothesis.
- [Rule 5 — Probes and Scans Must Assert Their Reach](./trustworthy-measurement/rule-5-probes-and-scans-must-assert-their-reach.md) — a probe must move the guarded byte; a scan must assert where it stopped.
- [Rule 6 — An Assertion Must Outlive Its Moment](./trustworthy-measurement/rule-6-an-assertion-must-outlive-its-moment.md) — a baseline read from `HEAD` expires when the change lands; an assertion inside a parity boundary must hold in every repository.
- [Rule 7 — Prove the Run Finished](./trustworthy-measurement/rule-7-prove-the-run-finished.md) — a killed run's partial output reads as a finished one; a terminal exit marker is what tells them apart.

## Scope

Applies to any number justifying a decision: benchmark timings, CI metrics, disk measurements,
coverage figures, and acceptance-clause thresholds. Diagnostic prints no decision depends on are out
of scope — but the moment one is quoted in a plan, a gate, or a PR, it is in scope.

## Related Documentation

- [Acceptance clauses must be falsifiable](../quality/plan-anti-hallucination/absence-and-completeness-claims-zero-result-search-evidence-checklist.md) — a target that
  cannot fail is not a target; these rules are how you keep it from failing for the wrong reason.
- [Mechanize Cross-File Invariants](../practice/mechanize-cross-file-invariants.md) — the same instinct
  applied to rules rather than numbers.
- [CI Monitoring](../workflow/ci-monitoring.md) — where CI figures come from and how to read a run.
- [Evidence Capture](../quality/evidence-capture.md) — where a recorded measurement belongs.

## Conventions Implemented/Respected

- [Factual Validation](../../conventions/writing/factual-validation.md) — a reported measurement is
  a factual claim whose command, scope, and responsiveness need evidence.
- [Dynamic Collection References](../../conventions/writing/dynamic-collection-references.md) —
  measured inventories must derive from the live collection rather than a copied list.
