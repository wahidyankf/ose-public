# Manual Verification — Rule-15 and Rule-16 Pre-Archival Retests

## For Web-UI Feature-Change Plans — Rule-15 Three-Tester Retest

Near the end of the checklist, before archival: run the three live-site testers (the
`ux-review-fix-planning` workflow: `swe-web-tester` (exploratory charter) + `swe-usability-tester` +
`swe-web-tester` (design charter)) against the running target across ALL supported locales; append each finding as
a new unchecked checkbox, source-attributed (`EWT-###`/`UWT-###`/`DWT-###`), and fix (or explicitly
defer) before archival. See
[User-Facing Delivery Hardening Convention](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md) Rule 15.

**Not applicable** for plans touching only documentation, governance, CLI/text output, or non-code files.

## For API Feature-Change Plans — Rule-16 API Exploratory Retest

Near the end of the checklist, before archival: run `swe-api-tester` (exploratory charter) (`output-mode: delivery`,
the plan's `plan-path`) against the running REST or GraphQL endpoint(s), with the contract
(OpenAPI 3.x / GraphQL SDL) as ground truth; append each finding as a new unchecked checkbox,
source-attributed (`AET-###`), and — exactly as with the rule-15 web-triad findings — fix every defect
during execution before archival (deferral requires explicit user permission, only when genuinely
impossible; `SG-###` spec-gap proposals may be triaged). The API counterpart is a single specialist
tester (no triad, no dedicated workflow), HTTP/curl-driven, never a browser; a plan changing both a web
UI and its API carries both retest sections. See
[User-Facing Delivery Hardening Convention](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md) Rule 16.

**Not applicable** for frontend-only, documentation, governance, CLI/text output, or non-code plans.
