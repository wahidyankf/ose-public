---
description: The SSOT practice that mandates enumerate-not-sample forcing-functions for the three live-site testers and the ux-review-fix-planning workflow
when_to_use: "Use when a live-site tester agent needs to enumerate coverage instead of sampling it."
---

# Live-Tester Systematic Coverage

This practice mandates enumerate-not-sample forcing-functions for the three live-site testers, so systematic defect classes are never missed by spot-checking a sample.

## Documents

- [Principles and Conventions Implemented/Respected](./live-tester-systematic-coverage/principles-and-conventions-implemented-respected.md) — Principles/conventions implemented. Use to trace this practice's rationale.
- [The Problem: Sampling Misses Whole Defect Classes](./live-tester-systematic-coverage/the-problem-sampling-misses-whole-defect-classes.md) — Why sampling-based live testing misses entire defect classes. Use when deciding whether a live-test pass can sample instead of enumerate.
- [The Six Forcing-Functions (1-2)](./live-tester-systematic-coverage/forcing-functions-1-2.md) — Forcing-functions 1-2: shared-control matrix, per-control round-trip. Use when applying the shared-control or round-trip forcing-function.
- [The Six Forcing-Functions (3-4)](./live-tester-systematic-coverage/forcing-functions-3-4.md) — Forcing-functions 3-4: declared-invariant conformance, styling consistency. Use when applying the invariant-conformance or styling-consistency forcing-function.
- [The Six Forcing-Functions (5-6)](./live-tester-systematic-coverage/forcing-functions-5-6.md) — Forcing-functions 5-6: usability probes, recurrence/diff/completeness critic. Use when applying the usability-probe or recurrence-critic forcing-function.
- [Motivating Example](./live-tester-systematic-coverage/motivating-example.md) — The incident that motivated the six forcing-functions. Use when you need the rationale behind these forcing-functions.
- [Relationship to the Three Live-Site Testers](./live-tester-systematic-coverage/relationship-to-the-three-live-site-testers.md) — How the forcing-functions apply across the three live-site tester agents. Use when deciding how a live-site tester agent should apply these forcing-functions.

## Related Documentation

- [User-Facing Delivery Hardening Convention](./user-facing-delivery-hardening.md) -- Rule 15
  (near-end three-tester retest before archival) that this practice makes thorough
- [Manual Behavioural Verification Convention](./manual-behavioural-verification.md) -- Per-locale,
  per-breakpoint discipline that this practice extends with element-level enumeration
- [Evidence Capture Convention](./evidence-capture.md) -- Where and how to record findings and
  matrices from each forcing-function
- [Regression Test Mandate](./regression-test-mandate.md) -- Every defect found by these testers
  must land with a reproducing test when fixed
- [Behaviour-Driven Development](../behaviour-driven-development.md) -- Automated testing
  architecture that systematic live testing complements (not replaces)
- [ux-review-fix-planning workflow](../../workflows/quality/ux-review-fix-planning.md) --
  The orchestration workflow that sequences all three testers against the same target

## Scope

This practice applies to:

- All runs of `web-exploratory-tester`, `web-usability-tester`, and `web-design-tester` against
  any live web surface in `apps/`.
- All runs of `api-exploratory-tester` against any live REST or GraphQL API in `apps/`.
- All invocations of the `ux-review-fix-planning` workflow.
- The Rule-15 near-end retest required by the
  [User-Facing Delivery Hardening Convention](./user-facing-delivery-hardening.md) before plan
  archival.

It does not apply to:

- Automated Playwright E2E tests (those follow the [Behaviour-Driven Development](../behaviour-driven-development.md)).
- API-only verification (covered by [Manual Behavioural Verification](./manual-behavioural-verification.md)).
- Library-only changes with no UI surface.
