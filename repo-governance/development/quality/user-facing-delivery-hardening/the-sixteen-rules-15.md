---
description: "Rule 15: the near-end web-UI live tester triad retest before archival."
when_to_use: "Use when a web-UI feature-change plan is nearing archival."
---

# The Sixteen Rules (15)

1. **(Verification) A web-UI feature-change plan MUST run a near-end round of all three live-site
   testers — `swe-web-tester` (exploratory charter) (correctness), `swe-usability-tester` (usability), and
   `swe-web-tester` (design charter) (design fidelity), i.e. the
   [`ux-review-fix-planning`](../../../workflows/quality/ux-review-fix-planning.md) workflow —
   against the running UI to iron out rough edges and inconsistencies, and fix their findings before
   archival.** Gap: the visual-parity sign-off (Rule 10) confirms the screen matches the mockups but
   does not hunt for functional, behavioural-consistency, responsive, accessibility, URL/IA, or
   passive-security defects (exploratory), first-time-user confusion (usability), or runtime
   design-token / design-system / spacing drift (design) on the live build — exactly the classes of
   defect that ship past green gates. Apply: after the web UI is implemented and the Rule 10 visual
   sign-off is recorded, run the three testers against the plan's running target URL(s) **across all
   supported locales** (e.g., `/en/` and `/id/` paths for a bilingual app — a single-locale retest is
   incomplete). **Record each resulting finding in `delivery.md` as a new unchecked task-list
   checkbox**, source-attributed (`- [ ] EWT-NNN:` / `- [ ] UWT-NNN:` / `- [ ] DWT-NNN: <defect> —
fix before archival`), in a labelled "Rule-15 three-tester retest follow-ups" section, and each
   SG-### spec-gap / USS-### spec-suggestion as its own unchecked checkbox folded into the `specs/**`
   coverage steps per [Feature Change Completeness](.././feature-change-completeness.md). The
   in-place append is performed by invoking each tester with **`output-mode: delivery`** and the
   executing plan's `plan-path` — this is the unified mechanism for the three-tester retest fold-in.
   During plan-execution these checkboxes materialize 1:1 as harness Task items, are fixed within the same
   plan, and are ticked (`- [x]`) via the Atomic Sync Ritual. Every EWT-NNN/UWT-NNN/DWT-NNN defect
   finding MUST be fixed and ticked before archival — deferral requires explicit user permission and is allowed only when the fix is genuinely impossible. (`SG-###` spec-gap
   suggestions and `USS-###` spec-suggestions are proposals, not defects, and may be triaged or deferred
   with written rationale recorded under the checkbox.) Archival is blocked until every rule-15 defect
   checkbox is ticked (fixed). `plan-maker` emits this step (with the follow-ups section scaffold and a
   locale-coverage note); `plan-checker` flags its absence or single-locale-only scope on web-UI
   feature-change plans; `plan-execution-checker` verifies the three-tester round ran across all locales
   and every rule-15 EWT/UWT/DWT defect checkbox is fixed (ticked) before archival. Applies to web-UI
   **feature-change** plans
   (browser-rendered apps) only — not CLI/text user-facing output (which the testers cannot exercise)
   and not pure governance/agent-definition or no-behaviour-change plans.
