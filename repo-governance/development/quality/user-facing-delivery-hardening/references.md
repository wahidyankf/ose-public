---
description: "References and related documentation for this convention."
when_to_use: "Use when you need a related workflow or convention document."
---

# References

**Related Conventions:**

- [Manual Behavioural Verification](.././manual-behavioural-verification.md) — the visual/behavioural verification baseline this hardens.
- [Evidence Capture Convention](.././evidence-capture.md) — where and how to store committed verification evidence: screenshots in `evidence/`, HTTP or native wire results inline or saved as named sanitized evidence, and locale/breakpoint coverage requirements.
- [Feature Change Completeness](.././feature-change-completeness.md) — completeness for app/lib changes.
- [Test-Driven Development](../../workflow/test-driven-development.md) — RED/GREEN/REFACTOR shape and value-bearing tests.
- [UI Mockups in Plan Docs](../../../conventions/formatting/diagrams.md) — both-tiers mockups, design funnel, theme-token colors.
- [Plans Organization Convention](../../../conventions/structure/plans.md) — plan folder, phases, Atomic Sync Ritual, reopen path.
- [CI Post-Push Verification](../../workflow/ci-post-push-verification.md) — post-push CI + live-URL checks.

**Workflows:**

- [Plan Execution](../../../workflows/plan/plan-execution.md) — execution, finalization, archival gate.
- [Plan Quality Gate](../../../workflows/plan/plan-quality-gate.md) — pre-execution plan validation.
- [Web UX Test-Fixing Planning](../../../workflows/web/web-ux-test-fixing-planning.md) — workflow that runs the three-tester near-end retest (Rule 15).
- [API Quality Gate](../../../workflows/api/api-quality-gate.md) — workflow that runs the near-end `api-exploratory-tester` round (Rule 16); the API counterpart to the web triad.
- [UI Quality Gate](../../../workflows/ui/ui-quality-gate.md) — static component-source gate a UI-bearing plan runs alongside the Rule 15 triad.
- [PR Merge Protocol](../../workflow/pr-merge-protocol.md) — keeps applicable surface gates merge-blocking.

**Agents:**

- `plan-maker`, `plan-checker`, `plan-execution-checker`, `swe-ui-maker`, `swe-ui-checker`,
  `web-exploratory-tester`, `web-usability-tester`, `web-design-tester` (Rule 15 web triad),
  `api-exploratory-tester` (Rule 16 API counterpart).
