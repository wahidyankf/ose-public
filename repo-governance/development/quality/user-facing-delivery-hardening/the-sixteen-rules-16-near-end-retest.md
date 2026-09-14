---
description: "Rule 16: the near-end api-exploratory-tester retest before archival."
when_to_use: "Use when an API feature-change plan is nearing archival."
---

# The Sixteen Rules (16, part 1)

1. **(Verification) An API feature-change plan MUST run a near-end `api-exploratory-tester` retest of
   the running API and fix its findings before archival.** Gap: contract-codegen, unit, and BE E2E
   gates assert the API does what its fixed tests say — they do not hunt for contract-conformance,
   status-code, error-envelope, payload-boundary, auth/authz, pagination, idempotency, or (for
   GraphQL) nullability / partial-error / depth defects on the running build, exactly the classes of
   defect that ship past green gates on a backend change. An API is a user-facing surface for its
   client and integrator consumers, so the same near-end live-system retest discipline as Rule 15
   applies — with a **single specialist tester instead of a triad**, because the API surface has one
   exploratory lens. Apply: after the API is implemented and its contract (OpenAPI 3.x spec or GraphQL
   SDL) is updated, run `api-exploratory-tester` against the plan's running endpoint(s) by invoking it
   with **`output-mode: delivery`** and the executing plan's `plan-path`. **Record each resulting
   finding in `delivery.md` as a new unchecked task-list checkbox**, source-attributed
   (`- [ ] AET-NNN: <defect> — fix before archival`), in a labelled "Rule-16 API exploratory-test
   retest follow-ups" section, and each `SG-###` spec-gap as its own unchecked checkbox folded into the
   `specs/**` coverage steps per [Feature Change Completeness](.././feature-change-completeness.md).
   During plan-execution these checkboxes materialize 1:1 as harness Task items, are fixed within the
   same plan, and are ticked (`- [x]`) via the Atomic Sync Ritual. Every `AET-NNN` defect finding MUST
   be fixed and ticked before archival — deferral requires explicit user permission and is allowed only
   when the fix is genuinely impossible. (`SG-###` spec-gap proposals are proposals, not defects, and
   may be triaged or deferred with written rationale recorded under the checkbox.) Archival is blocked
   until every rule-16 defect checkbox is ticked. `plan-maker` emits this step (with the follow-ups
   section scaffold); `plan-checker` flags its absence on API feature-change plans;
   `plan-execution-checker` verifies the retest ran and every rule-16 `AET-###` defect checkbox is
   fixed (ticked) before archival. Applies to **API feature-change** plans (REST or GraphQL endpoints
   in a backend or tRPC app) only — not pure governance/agent-definition or no-behaviour-change plans.
   The API tester is HTTP/curl-driven and never drives a browser, so it does not overlap the Rule 15
   web triad — a plan that changes BOTH a web UI and its API runs both the Rule 15 and the Rule 16
   rounds.
