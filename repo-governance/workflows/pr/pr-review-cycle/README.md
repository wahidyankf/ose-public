---
description: "Index of optional iterative PR-review cycle mechanics."
when_to_use: "Use to locate an explicitly requested PR-review-cycle child document."
---

# PR-Review Maker→Fixer Cycle Workflow

- [Purpose and Execution Mode](./purpose-and-execution-mode.md) — explicit-only invocation.
- [Participants](./participants.md) — single-pass participants and the cycle-only fixer.
- [Loop Algorithm](./loop-algorithm.md) — bounded composition of `pr-review`.
- [Cycle Authority and Restart Recovery](./cycle-authority-and-restart-recovery.md) — durable
  history and live-head gates.
- [Cycle Record Authentication](./cycle-record-authentication.md) — authenticating API objects.
- [Sibling-Handoff Record](./sibling-handoff-record.md) — paired-repository schema.
- [Cycle Credit Record](./cycle-non-credit-record.md) — positive clean and stale non-credit state.
- [Pipeline Diagrams](./pipeline-diagrams.md) — optional-cycle sequence.
- [GitHub Reviews API Mechanics — Part 1](./github-reviews-api-mechanics-review-posting.md) — review-posting
  and line-anchor mechanics.
- [GitHub Reviews API Mechanics — Part 2](./github-reviews-api-mechanics-threads.md) — thread,
  untrusted-input, and write-scope mechanics.
- [Review STATE Is Never the Gate](./review-state-is-never-the-gate.md) — COMMENT-state rule and
  severity-based blocking.
- [Steps 0-1: Resolve and Review](./steps-0-1-resolve-and-review.md) — hydrate and invoke one pass.
- [Step 2: Pass Result](./step-2-pass-result.md) — authenticate the pass record.
- [Steps 3-5: Fixer, CI, Done](./steps-3-5-fixer-ci-and-done.md) — triage, CI, credit, and exit.
- [Cycle-Local Done Definition](./route-specific-done-definition.md) — cycle result, not merge state.
- [Scope-Deferral Exit](./scope-deferral-exit.md) — linked follow-up handling.
- [Scope Guard](./scope-guard-no-scope-creep.md) — no scope creep.
- [Loop-Exit and Block Rules](./loop-exit-and-block-rules.md) — clean exit and ceiling.
- [Convergence Measurement](./convergence-measurement.md) — cause tags and checkpoints.
- [Probe Variation](./probe-variation-and-exit.md) — distinct-probe clean credit.
- [Restatement by Value](./restatement-by-value.md) — duplicated-fact defect class.
- [What Code-Related Means](./what-code-related-means.md) — finding qualifier.
- [Explicit Invocation](./explicit-invocation.md) — the only applicability signal.
- [Related Workflows and Metrics](./related-workflows-and-success-metrics.md) — optional-cycle
  composition and metrics.
- [PR Review Cycle — Success Criteria](./success-criteria.md) — explicit invocation, clean-streak
  exit, and default-delivery non-applicability.
- [Notes](./notes.md) — operating notes.
- [Principles and Conventions](./principles-and-conventions.md) — compliance summary.
