---
description: "Universal confidence level system for fixer agents to assess and apply validated fixes"
when_to_use: "Read this index to find the right Fixer Confidence Levels Convention child document."
---

# Fixer Confidence Levels Convention

- [Principles Implemented/Respected](./principles-implemented-respected.md) — Principles this convention implements. Use to trace this convention's principle rationale.
- [Conventions Implemented/Respected](./conventions-implemented-respected.md) — Conventions this convention implements. Use to trace this convention's cross-references.
- [Overview](./overview.md) — Overview of the fixer confidence-level system. Use to orient to the fixer confidence-level system.
- [Purpose](./purpose.md) — Why this convention exists. Use when orienting to why fixer confidence levels exist.
- [Scope](./scope.md) — Which fixer agents this convention covers. Use when checking whether a fixer is in scope.
- [The Three Confidence Levels: HIGH_CONFIDENCE](./the-three-confidence-levels-high-confidence.md) — HIGH_CONFIDENCE: apply the fix automatically. Use when deciding whether a finding is HIGH_CONFIDENCE.
- [The Three Confidence Levels: MEDIUM_CONFIDENCE](./the-three-confidence-levels-medium-confidence.md) — MEDIUM_CONFIDENCE: skip, manual review needed. Use when deciding whether a finding is MEDIUM_CONFIDENCE.
- [The Three Confidence Levels: FALSE_POSITIVE](./the-three-confidence-levels-false-positive.md) — FALSE_POSITIVE: skip, report to the user. Use when deciding whether a finding is a false positive.
- [Why Re-Validation Is Mandatory](./why-re-validation-is-mandatory.md) — Why fixers must re-validate before applying a fix. Use when tempted to apply a checker finding without re-validating.
- [Confidence Assessment Process](./confidence-assessment-process.md) — The process for assessing confidence in a finding. Use when implementing a fixer's confidence-assessment step.
- [Domain-Specific vs Universal Criteria](./domain-specific-vs-universal-criteria.md) — Universal vs domain-specific confidence criteria. Use when writing confidence criteria for a new fixer.
- [Integration with Fixer Agents](./integration-with-fixer-agents.md) — How fixer agents integrate confidence assessment. Use when wiring confidence levels into a fixer agent.
- [Integration with Criticality Levels: Orthogonal Dimensions and Decision Matrix](./integration-with-criticality-levels-orthogonal-dimensions-and-decision-matrix.md) — Confidence vs criticality as orthogonal dimensions, plus the decision matrix. Use when combining a criticality level with a confidence level.
- [Integration with Criticality Levels: Priority-Based Execution Order](./integration-with-criticality-levels-priority-based-execution-order.md) — The priority-based execution order for fixes. Use when ordering fixes by priority.
- [Integration with Criticality Levels: Updated Fix Report Format](./integration-with-criticality-levels-updated-fix-report-format.md) — The updated fix-report format and why priority-based execution matters. Use when authoring a fix report with priority-based sections.
- [False Positive Feedback Loop: How False Positives Improve Checker Accuracy](./false-positive-feedback-loop-how-it-improves-checker-accuracy.md) — How false-positive findings feed back into checker accuracy. Use when reporting a false positive back to a checker's maintainer.
- [False Positive Feedback Loop: Example (part 1)](./false-positive-feedback-loop-example-initial-state-to-fixer-report.md) — A worked feedback-loop example: initial state through fixer report. Use for the first half of a worked feedback-loop example.
- [False Positive Feedback Loop: Example (part 2)](./false-positive-feedback-loop-example-checker-update-to-references.md) — A worked feedback-loop example: checker update through references. Use for the second half of a worked feedback-loop example.
