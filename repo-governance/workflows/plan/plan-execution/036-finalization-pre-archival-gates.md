---
description: Defines the UI- and API-bearing plan pre-archival gates and the rule-15 three-tester web retest that must pass before archival.
when_to_use: Use when a UI-bearing or web-UI feature-change plan approaches archival and must run its pre-archival visual and retest gates.
---

# 8. Finalization and Archival (Sequential)

Use these gates plus the preliminary audit to establish `ready-for-archive`; this is not final
status. Archive through the resolved delivery mode, then assign `pass` only after delivered-head
proof and the workflow-owned terminal audit succeed.

**UI-bearing plan pre-archival gate (rules 1, 10, 15)**: For plans that add or change user-facing
screens or components, archival MUST NOT proceed until the production visual sign-off is confirmed
(rule 1 — a human or Playwright observer verifies rendered output against the design mockups in the
live or staging environment). Zero automated-gate findings are necessary but not sufficient. See
[User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md)
rules 1, 10, and 15.

**API-bearing plan pre-archival gate (rule 16)**: For API feature-change plans (REST or GraphQL
endpoints in a backend or tRPC app), archival MUST NOT proceed until the near-end
`swe-api-tester` (exploratory charter) retest has run against the running endpoint(s) and every resulting `AET-###`
defect checkbox in `delivery.md` is `- [x]` (fixed) — exactly as the rule-15 retest gates UI plans. See
[User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md)
rule 16.

**Rule-15 web-UI three-tester retest (near-end, before archival)**: For **web-UI feature-change**
plans specifically, after the implementation lands and the rule-1 visual sign-off is recorded, run a
**three-tester** round against the running target URL(s) across all supported locales — the
[`ux-review-fix-planning`](../../quality/ux-review-fix-planning.md) workflow:
`swe-web-tester` (exploratory charter) (correctness), `swe-usability-tester` (usability), and `swe-web-tester` (design charter)
(design fidelity). Invoke each tester with **`output-mode: delivery`** and the executing plan's
`plan-path`; this is the unified mechanism that appends findings directly into THIS plan's
`delivery.md` rather than filing a separate plan. Its output is folded back into THIS plan, not a separate plan:

1. Each tester with `output-mode: delivery` appends each finding to `delivery.md` as a **new
   unchecked task-list checkbox**, source-attributed (`- [ ] EWT-NNN:` / `- [ ] UWT-NNN:` /
   `- [ ] DWT-NNN: <defect> — fix before archival`), and each SG-### spec-gap / USS-### spec-suggestion
   as its own unchecked checkbox folded into the specs/\*\* coverage steps. Findings land in a clearly
   labelled "Rule-15 three-tester retest follow-ups" section at the end of the checklist.
2. Each new checkbox materializes as exactly one harness task per the
   [Task-Checklist Synchronization](./008-task-checklist-synchronization.md) 1:1 mapping, giving the user
   live visibility of the retest backlog.
3. Loop back into execution (Steps 2–7) to fix each finding and tick its checkbox via the Atomic
   Sync Ritual. Every EWT-NNN/UWT-NNN/DWT-NNN defect finding MUST be fixed and ticked — deferral
   of a defect finding requires explicit user permission and is allowed only when the fix is genuinely impossible. (`SG-###` spec-gap proposals and `USS-###` spec-suggestions
   are proposals, not defects, and may be triaged or deferred with written rationale recorded under
   the checkbox.)
4. Archival is blocked until every rule-15 EWT/UWT/DWT defect checkbox is `- [x]` (fixed).
