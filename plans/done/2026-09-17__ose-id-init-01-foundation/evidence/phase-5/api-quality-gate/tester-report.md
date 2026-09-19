# API Exploratory Tester Report — discovery run `aet-2ecbb6945fdd`

**Target**: `http://127.0.0.1:8501` (`ose-id-be`, foundation-ready fixture profile, empty domain
state). **Goal**: verify the two health routes and the five disabled-capability routes are watertight
against `specs/apps/ose/id-be/contracts/openapi.yaml` and matching foundation Gherkin, and that
nothing outside this closed surface answers with anything but an ordinary `404`. **Mode**: `strict`.
**Output mode**: `delivery` → `plans/in-progress/ose-id-init-01-foundation`. **Protocol**: REST
(auto-confirmed via the named OpenAPI 3.1.0 contract). **Depth**: thorough (full operation sweep plus
deeper edge/auth-context/security passes, per the mandatory sweeps).

## Charters run

1. **Contract-conformance charter** — enumerate all 7 OpenAPI operations, assert status/schema/
   headers/content-type on the correct method/path.
2. **Watertight-boundary charter** — for the 5 disabled-capability routes, exhaustively probe every
   plausible wrong method (GET/POST/HEAD/OPTIONS/PUT/DELETE/TRACE as applicable) and confirm the
   contract's documented fallback behaviour.
3. **Closed-surface charter** — probe 28 plausible-but-undocumented paths (account, OIDC well-known,
   Swagger/OpenAPI self-exposure, metrics, company/admin variants) to confirm zero leakage outside the
   7 documented operations.
4. **Edge/negative/security charter** — boundary correlation-ID values, oversized/malformed bodies and
   query strings, path traversal, null bytes, case/trailing-slash variants, CORS, TRACE, concurrency
   storms.

## Findings

### AET-001 — Wrong HTTP method on a disabled-capability route returns `405`, not the contracted ordinary `404`

- **Severity**: Major. **Priority (proposed)**: High.
- **Operation/Component**: all 5 disabled-capability routes — `GET /connect/authorize`,
  `POST /connect/token`, `GET /external/google/challenge`, `POST /scim/v2/Users`,
  `GET /platform/admin/companies`.
- **Environment**: `http://127.0.0.1:8501`, worktree HEAD `83b73f6b6b910ffeaf988323a9fd0a7b18e08f17`,
  anonymous (synthetic, no auth context available or required), observed 2026-09-16.
- **Steps to reproduce**:
  1. `curl -sS -D - -o - -X POST http://127.0.0.1:8501/connect/authorize`
  2. `curl -sS -D - -o - -X GET http://127.0.0.1:8501/connect/token`
  3. `curl -sS -D - -o - -X POST http://127.0.0.1:8501/external/google/challenge`
  4. `curl -sS -D - -o - -X GET http://127.0.0.1:8501/scim/v2/Users`
  5. `curl -sS -D - -o - -X POST http://127.0.0.1:8501/platform/admin/companies`

     (Also reproduced with `HEAD`/`OPTIONS`/`PUT`/`DELETE` against `/connect/authorize` — same result
     every time; `POST /connect/authorize` reproduced twice with identical output.)

- **Expected result**: OpenAPI `paths./connect/authorize` (and siblings) top-level `description`:
  "Any other request — including a different method on one of these paths — falls through to the
  framework's ordinary not-found behaviour, which carries no capability code and is not part of this
  contract." `tech-docs/006-api-contract-delta.md` line 71: "Unknown routes use the framework's
  ordinary `404` contract without a capability code." Task scope (this run's own literal
  instructions): "every one of these must answer 404 ... for its documented method/path, and an
  ordinary framework 404 (no capability_disabled code) for any other method on those same paths."
  All three sources agree: **404**.
- **Actual result**: `405 Method Not Allowed`, `Content-Length: 0`, `Allow: <the one registered
method>`, e.g.:

  ```text
  HTTP/1.1 405 Method Not Allowed
  Content-Length: 0
  Date: Wed, 16 Sep 2026 13:08:18 GMT
  Server: Kestrel
  Allow: GET
  ```

- **Evidence**: `evidence/phase-5/api-quality-gate/request-response-matrix.md` §2 (full 5-route ×
  wrong-method matrix, raw exchange sample).
- **Reproducibility**: Always (10/10 individual wrong-method probes across the 5 routes; explicit
  double-reproduction on one).
- **Defect type**: Contract / Status-code.
- **Cross-reference to existing plan evidence**: the plan's own prior manual-verification capture at
  `evidence/phase-5/manual-http-matrix.txt` (lines `oidc-method-error`, `token-method-error`,
  `google-method-error`, `scim-method-error`, `platform-admin-method-error`) recorded `status=404
body=ordinary-route-not-found` for exactly this condition against this same stack lineage. This
  discovery pass's live observation disagrees with that recorded evidence. This is worth the
  implementer's attention as a possible **regression** introduced after that evidence was captured —
  or, if the dispatcher never actually produced `404` for a wrong method, a gap in how that earlier
  evidence was captured. Either way, the currently-running instance's real behaviour is `405`, not
  `404`, as reproduced above.
- **Suggested fix locus (hypothesis, not verified against source)**: the 5 disabled-capability routes
  are most likely registered as method-constrained minimal-API/MVC routes (e.g. `MapGet`/`MapPost`
  with an implicit method constraint), which gives ASP.NET Core routing's default method-mismatch
  behaviour (`405` + `Allow`) before the capability-disabled handler ever runs. Achieving the
  contracted "falls through to the framework's ordinary not-found behaviour" likely requires either
  registering the exact method/path pair via a mechanism that does not add a method constraint to the
  route match (so an unmatched method simply falls through to the 404 catch-all), or explicitly
  intercepting the `405` case for these 5 paths and re-emitting the ordinary-404 shape.

### AET-002 — The framework's `405` fallback omits the contract-wide `X-Correlation-ID` and `Cache-Control: no-store` headers

- **Severity**: Minor. **Priority (proposed)**: Medium.
- **Operation/Component**: the framework's `405 Method Not Allowed` response, observed on both health
  routes (`/health/live`, `/health/ready` for any non-`GET` method) and all 5 disabled-capability
  routes (for any wrong method) — 14 requests probed, 14/14 affected.
- **Environment**: same as AET-001.
- **Steps to reproduce**: `curl -sS -D - -o /dev/null -X HEAD http://127.0.0.1:8501/health/live` (or
  any of the 14 requests listed in `request-response-matrix.md` §3).
- **Expected result**: `tech-docs/006-api-contract-delta.md` line 39: "Every response carries a
  generated or validated `X-Correlation-ID`"; line 41: "Backend API responses use
  `Cache-Control: no-store`." The OpenAPI marks both headers `required: true` on every declared
  response for these routes.
- **Actual result**: neither header is present on any of the 14 probed `405` responses; only `Date`,
  `Server`, and `Allow` are returned.
- **Evidence**: `evidence/phase-5/api-quality-gate/request-response-matrix.md` §3.
- **Reproducibility**: Always (14/14).
- **Defect type**: Consistency / Error-envelope.
- **Note**: this is a distinct symptom from AET-001 (which is about the wrong status-code family);
  fixing AET-001 so the 5 disabled routes' wrong-method requests reach the ordinary-404 pipeline will
  likely make those 10 cases pass this header check too, but the 2 health-route cases (5 non-GET
  methods each) are independent of AET-001 and need their own confirmation once whatever handles the
  method-mismatch path is adjusted.
- **Suggested fix locus (hypothesis)**: the correlation-ID/no-store middleware appears to run only for
  matched routes that reach a handler; ASP.NET Core's built-in method-mismatch short-circuit likely
  responds before that middleware executes. If the contract truly intends "every response" to include
  the `405` case, the middleware ordering needs to run ahead of (or independent of) routing's
  method-constraint short-circuit.

### AET-003 — `Server: Kestrel` banner disclosed on every response

- **Severity**: Trivial. **Priority (proposed)**: Low.
- **Operation/Component**: all responses, all 7 operations and the framework fallback paths.
- **Steps to reproduce**: `curl -sS -D - -o /dev/null http://127.0.0.1:8501/health/live | grep -i
server` → `Server: Kestrel`.
- **Expected result**: OWASP passive-security dimension (this Skill's Test Dimensions Checklist,
  "Safe security surface"): "no version/stack over-disclosure (`Server`, `X-Powered-By`)." No
  contract clause explicitly forbids the `Server` header either way — this is a dimension check, not
  a cited contract violation.
- **Actual result**: `Server: Kestrel` present on every response (no version number disclosed).
- **Reproducibility**: Always.
- **Defect type**: Security (passive/informational only).
- **Note**: low materiality — no version is disclosed, only the web-server family, which is Kestrel's
  ASP.NET Core default and extremely common. Recorded for completeness under `strict` mode rather than
  as an urgent risk; the maintainer may reasonably decide this does not warrant action.

## Spec-gap proposal

### SG-001 — Disabled-capability route matching is case-insensitive and trailing-slash-tolerant without leaking to a sibling capability

While probing case/trailing-slash edges (dimension: edge cases & boundary conditions), `GET
/Connect/Authorize` (different case) and `GET /connect/authorize/` (trailing slash) both correctly
returned the exact same `capability_disabled` problem body as the canonical `GET /connect/authorize`
— they did not silently 404 through the ordinary/unmatched path, and did not leak into a different
capability's problem instance. This is correct, safe, intended behaviour (ASP.NET Core's default
case-insensitive, slash-tolerant routing, applied consistently across all 5 disabled routes) that
neither the OpenAPI nor the Gherkin currently protects. Proposed scenario, extending
`specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`:

```gherkin
Rule: A disabled capability's route match is safe under harmless path variation

  Scenario Outline: Reject a disabled identity capability through a case or trailing-slash variant of its exact route
    Given <capability> is disabled and no authentication or tenant scheme exists for it
    When an anonymous caller sends <method> <path variant> instead of the exact registered path
    Then the response is still 404 with the stable capability-disabled problem code
    And no other capability's route is reached

    Examples:
      | capability          | method | path variant           |
      | OIDC authorization   | GET    | /Connect/Authorize      |
      | OIDC authorization   | GET    | /connect/authorize/     |
      | SCIM user provisioning | POST | /scim/v2/users          |
```

This is a proposal for maintainer confirmation, not a verdict that the spec is wrong.

## Coverage summary

- **Operations enumerated**: 7/7 (100%), all asserted for status, schema, headers, content-type.
- **Wrong-method dimension**: 5/5 disabled routes × every plausible alternate method (10 individual
  probes) + 2/2 health routes × 5 alternate methods each.
- **Closed-surface dimension**: 28 out-of-scope paths, 28/28 clean.
- **Concurrency**: 100-way and 30-way concurrent bursts on both health routes, zero inconsistency.
- **Boundary/malformed payloads**: oversized correlation ID, 2 MB bodies, malformed JSON, 20000-char
  URI, null-byte path, 8000-byte arbitrary header, duplicate headers — all handled safely.
- **Auth/authz**: not applicable — `security: []` is declared and confirmed (zero operations require
  or react to credentials; a forged bearer token on the platform-admin route had no effect).
- **Areas not covered** (see `request-response-matrix.md` §7 for full reasoning): readiness `503`
  live reproduction (destructive to the owned stack, prohibited this pass — cross-referenced against
  existing plan evidence instead); backend/web startup guard (process-level, no listener, out of
  HTTP-only scope); `ose-id-web` status shell (explicitly out of this pass's immutable scope); raw
  TCP-level CRLF header-injection (exceeds the standard `curl`-based technique set); direct
  database-row verification (no DB credentials in scope).

## Summary for the orchestrator

- **Findings by severity**: 1 Major (AET-001), 1 Minor (AET-002), 1 Trivial (AET-003).
- **Spec gaps**: 1 (SG-001).
- **Top risk**: AET-001 — the disabled-capability routes' wrong-method fallback returns `405`
  instead of the contracted `404`, on 100% of probed combinations, directly contradicting the task's
  own literal "watertight" acceptance requirement and the plan's own prior evidence file. This should
  be treated as in-threshold for the `strict`-mode gate.
- **Output path**: findings appended to
  `plans/in-progress/ose-id-init-01-foundation/delivery.md` under a new
  `## API exploratory-test retest follow-ups` section; full evidence bundle under
  `plans/in-progress/ose-id-init-01-foundation/evidence/phase-5/api-quality-gate/`.
- **Not covered**: see above; no destructive or out-of-scope action was taken, and the running stack
  was left untouched for the orchestrator to tear down.
