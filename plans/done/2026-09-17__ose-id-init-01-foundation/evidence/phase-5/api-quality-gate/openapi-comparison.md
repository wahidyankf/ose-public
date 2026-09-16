# OpenAPI Comparison — run `aet-2ecbb6945fdd`

Ground truth: `specs/apps/ose/id-be/contracts/openapi.yaml` (OpenAPI 3.1.0), compared directly
against the live `http://127.0.0.1:8501` responses. Every one of the 7 declared operations was
enumerated (no sampling).

## Operation-by-operation

### `getLiveness` — `GET /health/live`

- Schema `LivenessResponse` (`additionalProperties: false`, `status` enum `[live]`, `service` enum
  `[ose-id-be]`): live body `{"status":"live","service":"ose-id-be"}` — exact match.
- `200` response headers `Cache-Control: no-store` (ref `CacheControlNoStore`) and `X-Correlation-ID`
  (ref `CorrelationId`, required): both present and correctly valued.
- `Content-Type: application/json`: matches.
- `CorrelationId` request parameter (`maxLength: 128`, optional): a valid caller value round-tripped
  unchanged; a 300-char oversized value was replaced with a freshly generated value, matching "An
  invalid value is replaced with a generated one rather than reflected back."
- **Verdict: full conformance.**

### `getReadiness` — `GET /health/ready`

- Schema `ReadinessResponse` → `ReadinessComponents` (`additionalProperties: false` at both levels):
  live body `{"status":"ready","components":{"postgresql":"ready","schema":"compatible"}}` — exact
  match, no extra keys at either nesting level.
- Headers/content-type: same as liveness, both present and correct.
- `503`/`ReadinessProblem` path not exercised live this pass (see "not covered" in
  `request-response-matrix.md` §7); cross-referenced against existing plan evidence which already
  captured `503 database_unavailable` with the correct shape for this stack lineage.
- **Verdict: full conformance on the `200` path documented in the OpenAPI; `503` path not
  independently reverified this pass (non-destructive constraint), cross-referenced instead.**

### `rejectDisabledOidcAuthorization` — `GET /connect/authorize`

- `CapabilityDisabledProblem` (`allOf` `ProblemResponse` + closed enums `status:404`,
  `code:capability_disabled`, `title:"Capability is not available"`): exact match, `jq -S keys`
  confirms no extra/missing keys.
- `CapabilityDisabled` response headers: both present.
- Description promise "Query input is bounded and then ignored; no redirect is issued and no query
  value is logged" — verified with realistic OIDC query params (`response_type`, `client_id`,
  `redirect_uri`, `state`) and a 5000-char value: same exact `capability_disabled` body, no
  `Location` header.
- **Correct-method verdict: full conformance.**
- **Wrong-method verdict: violates the OpenAPI's own top-level `description` — "Any other request —
  including a different method on one of these paths — falls through to the framework's ordinary
  not-found behaviour" — see AET-001.**

### `rejectDisabledTokenIssuance` — `POST /connect/token`

- Schema/headers: exact match.
- "A bounded body is drained or rejected without parsing a grant" — verified with a realistic
  `client_credentials` form body, a truncated/malformed JSON body, and a 2 MB body (sub-millisecond
  response each time, confirming no parse attempt).
- **Correct-method verdict: full conformance. Wrong-method verdict: AET-001 (405, not 404).**

### `rejectDisabledGoogleSignIn` — `GET /external/google/challenge`

- Schema/headers: exact match. "No location header, state, nonce, or cookie is returned" — verified
  with realistic `redirect_uri`/`state` query params: no `Location`, no `Set-Cookie`.
- **Correct-method verdict: full conformance. Wrong-method verdict: AET-001.**

### `rejectDisabledScimUserProvisioning` — `POST /scim/v2/Users`

- Schema/headers: exact match. "A bounded body is never parsed into a user" — verified with a
  realistic SCIM-shaped `application/scim+json` body and a 2 MB body: sub-millisecond, exact
  `capability_disabled` shape, no SCIM resource/error body.
- **Correct-method verdict: full conformance. Wrong-method verdict: AET-001.**

### `rejectDisabledPlatformAdministration` — `GET /platform/admin/companies`

- Schema/headers: exact match. "No company list, count, or identifier is returned, not even an empty
  collection" — verified: body is the fixed problem object only, even with a forged `Authorization:
Bearer` header and `page`/`pageSize` query params present.
- **Correct-method verdict: full conformance. Wrong-method verdict: AET-001.**

## Global `components` conformance

- `ProblemResponse`/`CapabilityDisabledProblem` `additionalProperties: false`: held for all 5 disabled
  routes (§1/§6 of `request-response-matrix.md`); no extra field ever observed.
- `CacheControlNoStore` header (`required: true`, enum `[no-store]`) and `CorrelationId` header
  (`required: true`): held for all 7 operations' correct-method responses; **absent on the framework
  `405` fallback for the same 7 routes' wrong methods (AET-002)** — the OpenAPI marks both headers
  `required: true` on every declared `200`/`404` response, and the contract-wide prose in
  `tech-docs/006-api-contract-delta.md` (line 39/41) frames this as a blanket "every response" rule
  for this service's own registered routes, not merely the documented happy path.
- `security: []` (top-level, zero security requirements): held — no operation rejected an
  unauthenticated request, none required a bearer/cookie/tenant, consistent across all 7 operations
  and the negative probes (forged bearer token on `/platform/admin/companies` had no effect on the
  response).

## `specs/**` Gherkin cross-check

- `specs/apps/ose/id-be/behaviours/foundation/health.feature` — "Report PostgreSQL becoming
  unavailable after startup" targets the liveness/readiness-under-outage scenario; not independently
  re-run live this pass (see "not covered"), cross-referenced against existing plan evidence. The
  happy-path liveness/readiness shape this scenario also implies (via the health contract packet in
  `tech-docs/006`) is confirmed live.
- `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` — "Reject a disabled
  identity capability" Scenario Outline, all 5 example rows: confirmed live, exact match on status
  and `capability_disabled` code, for every row.
- The feature file's Scenario Outline does not itself carry a wrong-method example row (that
  requirement lives only in `tech-docs/006-api-contract-delta.md`'s "Copy-Ready API Contract
  Scenarios" packet and the OpenAPI description, both cited above) — AET-001 is filed against those
  ground-truth sources plus the task's own explicit scope requirement, not against a Gherkin scenario
  gap.

## Self-completeness check

All 7/7 OpenAPI operations enumerated; all 5/5 disabled-capability routes' wrong-method dimension
enumerated (10/10 individual method probes); both health routes' non-GET dimension enumerated (5
methods × 2 routes); the 28-path closed-surface sweep enumerated. The one dimension left
intentionally unexercised (readiness `503` reproduction) is recorded under "not covered" with its
reason and a cross-reference to existing evidence, not silently skipped.
