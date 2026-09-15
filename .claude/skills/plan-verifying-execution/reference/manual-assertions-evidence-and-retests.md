# Manual Behavioural Assertion Verification (Step 5c continued): Evidence Capture and Retests

1. **Evidence Capture**
   - Verify each ticked manual-verification checkbox carries committed evidence: **Screenshots** —
     the plan's `evidence/` subfolder contains at least one screenshot per locale per breakpoint
     tested, and `delivery.md` references them; **API wire evidence** — every changed HTTP-accessible
     operation has separately attributable sanitized success/failure evidence for the literal `rtk curl`
     recipes, including asserted status, headers, media type, body/schema, and stable failure code. Every
     changed non-HTTP RPC/event operation has equivalent evidence from its protocol-native wire client.
     Evidence identifies the synthetic fixture, cleanup result, and owner of any mismatch.
   - A bare "verified manually" note with no screenshot or per-operation wire evidence: **HIGH** finding
   - UI-verification checkbox ticked but `evidence/` has zero screenshots for it: **HIGH** finding

2. **Rule-15 Three-Tester Retest (web-UI feature-change plans)**
   - If the plan was a web-UI **feature-change** plan, verify it carried a near-end "Rule-15
     three-tester retest" round — the
     [`web-ux-test-fixing-planning`](../../../../repo-governance/workflows/web/web-ux-test-fixing-planning.md)
     triad (`web-exploratory-tester` + `web-usability-tester` + `web-design-tester`) — that ran across
     ALL supported locales, and that every resulting `EWT-###`/`UWT-###`/`DWT-###` defect checkbox in
     `delivery.md` is `- [x]` (fixed) before archival. Deferral of EWT/UWT/DWT defect findings is NOT
     permitted — an unfixed defect checkbox at archival time is a **HIGH** finding. (`SG-###`/`USS-###`
     are proposals, not defects, and may be triaged or deferred with written rationale.)
   - A web-UI feature-change plan archived with no three-tester retest round, single-locale-only
     scope, or any unfixed rule-15 defect checkbox: **HIGH** finding. CLI/text output and pure
     governance/agent-definition plans are exempt. Per
     [User-Facing Delivery Hardening](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
     Rule 15.

3. **Rule-16 API Exploratory Retest (API feature-change plans)**
   - If the plan was an API **feature-change** plan (REST or GraphQL endpoints in a backend or tRPC
     app), verify it carried a near-end "Rule-16 API exploratory retest" round —
     `api-exploratory-tester` run with `output-mode: delivery` against the running endpoint(s) with
     the contract (OpenAPI 3.x / GraphQL SDL) as ground truth — and that every resulting `AET-###`
     defect checkbox in `delivery.md` is `- [x]` (fixed) before archival. Deferral is NOT permitted —
     an unfixed defect checkbox at archival time is a **HIGH** finding.
   - An API feature-change plan archived with no API exploratory retest round, or any unfixed rule-16
     `AET-###` defect checkbox: **HIGH** finding. Frontend-only, CLI/text output, and pure
     governance/agent-definition plans are exempt. Per
     [User-Facing Delivery Hardening](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
     Rule 16.

### Finding Severity

- Broken UI (JS errors, rendering failures): **CRITICAL**
- Broken API (error responses, wrong data): **CRITICAL**
- Missing manual UI verification for UI changes: **HIGH**
- Missing manual API verification for API changes: **HIGH**
- End-to-end flow broken: **CRITICAL**
- Verification covered only the default locale on a multi-locale app: **HIGH**
- "Verified manually" with no committed evidence (no screenshot or per-operation wire output): **HIGH**
- UI-verification checkbox ticked but no screenshot in `evidence/`: **HIGH**
