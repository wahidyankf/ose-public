---
description: Optional semantic pull-request review workflows
when_to_use: Use when a user explicitly requests semantic PR review.
---

# PR Review Workflows

Broad semantic PR review is explicit-only. Every push first passes the private push leak review of
each outgoing commit. Every PR separately requires one focused, authenticated current-head leak
review, enforced by the `leak-review` commit status, plus exact-head/base `pr-quality-gate.yml`.

## Available Workflows

- [`pr-leak-review`](./pr-leak-review.md) — Mandatory review of every outbound commit for only real
  sensitive values, protected environment properties, and machine-specific values: privately before
  each push, and as one posted record per PR head before merge.
- [`pr-review`](./pr-review.md) — Runs one pinned, risk-routed semantic review; posts exactly one
  `COMMENT` review; never fixes, waits for CI, retries, or controls merge readiness.
- [`pr-review-cycle`](./pr-review-cycle.md) — Explicitly requested bounded maker-to-fixer loop that
  composes `pr-review` passes with fixer and exact-head CI steps.

## Related Documentation

- [PR Reviewer Disciplines](../../development/quality/pr-review-disciplines.md) — Semantic review
  boundaries and routing.
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) — Pattern used by
  the optional cycle.
- [Workflows Index](../README.md) — All available workflows.
