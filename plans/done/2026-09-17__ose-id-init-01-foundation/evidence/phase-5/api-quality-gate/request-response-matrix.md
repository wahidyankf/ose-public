# Sanitized Request/Response Matrix — run `aet-2ecbb6945fdd`

Every request below was issued against `http://127.0.0.1:8501` with `curl`. No credential, cookie,
token, or secret was ever sent or received; none is redacted below because none was present.
Correlation IDs are real (generated per request) and included verbatim since they carry no secret.

## 1. Contract-documented operations (correct method/path) — operation × property matrix

| #   | Operation                              | Method/Path                      | Status | Content-Type                 | Cache-Control | X-Correlation-ID | Body                                                                                                                                   |
| --- | -------------------------------------- | -------------------------------- | ------ | ---------------------------- | ------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `getLiveness`                          | `GET /health/live`               | 200 ✓  | `application/json` ✓         | `no-store` ✓  | present ✓        | `{"status":"live","service":"ose-id-be"}` ✓ exact-match, no extra keys                                                                 |
| 2   | `getReadiness`                         | `GET /health/ready`              | 200 ✓  | `application/json` ✓         | `no-store` ✓  | present ✓        | `{"status":"ready","components":{"postgresql":"ready","schema":"compatible"}}` ✓ exact-match, no extra keys                            |
| 3   | `rejectDisabledOidcAuthorization`      | `GET /connect/authorize`         | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | `{"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"..."}` ✓ exact-match, no extra keys |
| 4   | `rejectDisabledTokenIssuance`          | `POST /connect/token`            | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same exact shape ✓                                                                                                                     |
| 5   | `rejectDisabledGoogleSignIn`           | `GET /external/google/challenge` | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same exact shape ✓                                                                                                                     |
| 6   | `rejectDisabledScimUserProvisioning`   | `POST /scim/v2/Users`            | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same exact shape ✓                                                                                                                     |
| 7   | `rejectDisabledPlatformAdministration` | `GET /platform/admin/companies`  | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same exact shape ✓                                                                                                                     |

All 7/7 documented operations: full conformance on the happy path. Body shapes were validated with
`jq -S keys` against `additionalProperties: false` — exact key sets, no leakage, no omission.

## 2. Cross-cutting convention round-trip — wrong method on the same 5 disabled-capability paths

Contract requirement (OpenAPI top-level `description`; `tech-docs/006-api-contract-delta.md` line 71;
task scope): "Any other request — including a different method on one of these paths — falls through
to the framework's ordinary not-found behaviour, which carries no capability code."

| Path                         | Correct method (→ capability_disabled 404) | Wrong method(s) probed           | **Observed status**                         | Expected       | Verdict |
| ---------------------------- | ------------------------------------------ | -------------------------------- | ------------------------------------------- | -------------- | ------- |
| `/connect/authorize`         | GET → 404 ✓                                | POST, HEAD, OPTIONS, PUT, DELETE | **405** `Method Not Allowed`, `Allow: GET`  | ordinary `404` | ✗ FAIL  |
| `/connect/token`             | POST → 404 ✓                               | GET                              | **405** `Method Not Allowed`, `Allow: POST` | ordinary `404` | ✗ FAIL  |
| `/external/google/challenge` | GET → 404 ✓                                | POST                             | **405** `Method Not Allowed`, `Allow: GET`  | ordinary `404` | ✗ FAIL  |
| `/scim/v2/Users`             | POST → 404 ✓                               | GET                              | **405** `Method Not Allowed`, `Allow: POST` | ordinary `404` | ✗ FAIL  |
| `/platform/admin/companies`  | GET → 404 ✓                                | POST                             | **405** `Method Not Allowed`, `Allow: GET`  | ordinary `404` | ✗ FAIL  |

5/5 disabled-capability routes fail this convention for every wrong-method probe (10/10 individual
requests across the 5 routes). Reproduced twice for `POST /connect/authorize` with identical results
(deterministic, not intermittent). See finding **AET-001**.

Sample raw exchange (`POST /connect/authorize`):

```text
> POST /connect/authorize HTTP/1.1
> Host: 127.0.0.1:8501

< HTTP/1.1 405 Method Not Allowed
< Content-Length: 0
< Date: Wed, 16 Sep 2026 13:08:18 GMT
< Server: Kestrel
< Allow: GET
```

## 3. Header-presence convention round-trip on the 405 fallback path

Contract-wide rule (`tech-docs/006-api-contract-delta.md` line 39): "Every response carries a
generated or validated `X-Correlation-ID`"; line 41: "Backend API responses use
`Cache-Control: no-store`."

| Probe                                   | X-Correlation-ID present? | Cache-Control: no-store present? |
| --------------------------------------- | ------------------------- | -------------------------------- |
| `HEAD /health/live` → 405               | ✗ absent                  | ✗ absent                         |
| `OPTIONS /health/live` → 405            | ✗ absent                  | ✗ absent                         |
| `POST /health/live` → 405               | ✗ absent                  | ✗ absent                         |
| `POST /health/ready` → 405              | ✗ absent                  | ✗ absent                         |
| `TRACE /health/live` → 405              | ✗ absent                  | ✗ absent                         |
| `POST /connect/authorize` → 405         | ✗ absent                  | ✗ absent                         |
| `HEAD /connect/authorize` → 405         | ✗ absent                  | ✗ absent                         |
| `OPTIONS /connect/authorize` → 405      | ✗ absent                  | ✗ absent                         |
| `PUT /connect/authorize` → 405          | ✗ absent                  | ✗ absent                         |
| `DELETE /connect/authorize` → 405       | ✗ absent                  | ✗ absent                         |
| `GET /connect/token` → 405              | ✗ absent                  | ✗ absent                         |
| `POST /external/google/challenge` → 405 | ✗ absent                  | ✗ absent                         |
| `GET /scim/v2/Users` → 405              | ✗ absent                  | ✗ absent                         |
| `POST /platform/admin/companies` → 405  | ✗ absent                  | ✗ absent                         |

14/14 probed `405` responses omit both headers. Contrast: every `200`/`404` response on the 7
documented operations (§1) carries both headers correctly. See finding **AET-002**.

## 4. Declared-invariant conformance pass

| Invariant (source)                                                                                                                                                 | Enumerated over                                                                                                                                                      | Verdict                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| No secret/connection-string/DB host/stack trace/absolute path in any response (contract-wide rule)                                                                 | All probes in this run, including 2 MB bodies, malformed JSON, null-byte path (400), 20000-char URI (414), TRACE (405)                                               | ✓ holds — every body observed was either the documented JSON/problem shape or empty                                      |
| No redirect (`Location`) from disabled OIDC/Google routes                                                                                                          | `GET /connect/authorize`, `GET /external/google/challenge`, each with realistic OIDC/OAuth query params (`response_type`, `client_id`, `redirect_uri`, `state`)      | ✓ holds — no `Location` header in any response                                                                           |
| No `Set-Cookie` from any of the 7 documented operations                                                                                                            | All 7 operations, correct method                                                                                                                                     | ✓ holds                                                                                                                  |
| No CORS header (`Access-Control-Allow-Origin`) reflected for an arbitrary `Origin`                                                                                 | `GET /health/live`, `GET /connect/authorize`, `OPTIONS /health/live` with `Access-Control-Request-Method`                                                            | ✓ holds — no CORS headers present at all                                                                                 |
| Bounded query input is accepted and ignored, not validated/reflected (disabled-capability routes)                                                                  | 5000-char query value on `/connect/authorize`                                                                                                                        | ✓ holds — still exact `capability_disabled` 404                                                                          |
| Bounded body is drained/rejected without parsing (POST disabled routes)                                                                                            | 2 MB form body to `/connect/token`; 2 MB JSON body to `/scim/v2/Users`; malformed truncated JSON to `/connect/token`; realistic SCIM-shaped body to `/scim/v2/Users` | ✓ holds — sub-millisecond (`~0.0005s`–`0.0006s`) exact `capability_disabled` 404 every time, confirming no parse attempt |
| Repeated/concurrent calls return the identical no-write result (all 7 operations)                                                                                  | 100-way concurrent burst on `/health/live` and `/health/ready` (`xargs -P 25`); 30-way burst; 10x sequential; 2x reproduction of `POST /connect/authorize`           | ✓ holds — 100/100 and 30/30 identical `200`s each burst; identical `405` on both `POST /connect/authorize` reproductions |
| Correlation ID: caller-supplied valid value is honoured verbatim; invalid/oversized is replaced, never reflected (OpenAPI `CorrelationId` param, `maxLength: 128`) | Valid custom value; 300-char oversized value; value containing `%`, `:`, non-ASCII                                                                                   | ✓ holds — valid value echoed unchanged; the 300-char value was replaced with a freshly generated `corr_<32-hex>` value   |
| Wrong method on the 5 disabled-capability routes falls through to the framework's ordinary `404` (contract-wide + task scope)                                      | 10 wrong-method requests across the 5 routes                                                                                                                         | ✗ **breaks — see AET-001**                                                                                               |
| Every response (documented operations) carries `X-Correlation-ID` + `Cache-Control: no-store`                                                                      | 7 documented operations' correct-method responses (✓) vs. 14 `405` fallback responses (✗)                                                                            | **partial — see AET-002**                                                                                                |

## 5. Closed-surface sweep (requirement (c): nothing outside scope answers anything but ordinary 404)

28 paths probed (full list and rationale in `resource-inventory.md`): all 28 returned bare `404`,
`Content-Length: 0`, no `Content-Type`, no body — the same shape as the deliberately-unmatched control
path `/nonexistent-foo-bar`. Zero Swagger/OpenAPI self-exposure, zero accidental
account/company/OIDC-userinfo/metrics/robots surface. Requirement (c) holds in full.

## 6. Edge/negative/security probes (dimension coverage)

| Probe                                                   | Result                                             | Verdict                                                                      |
| ------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Case-varied path `GET /Connect/Authorize`               | 404 `capability_disabled` (same as canonical case) | consistent, safe — see **SG-001**                                            |
| Trailing slash `GET /connect/authorize/`                | 404 `capability_disabled`                          | consistent, safe — see **SG-001**                                            |
| Trailing slash `GET /health/live/`                      | 200, identical body                                | consistent                                                                   |
| Lowercase SCIM path `POST /scim/v2/users`               | 404 `capability_disabled`                          | consistent                                                                   |
| Dot-segment path traversal `GET /health/../health/live` | 200, normalizes to `/health/live`                  | expected Kestrel path normalization; no restricted resource exists behind it |
| Encoded dot-segment `GET /connect/%2e%2e/health/live`   | 200, normalizes to `/health/live`                  | same                                                                         |
| Null byte in path `GET /health/live%00`                 | 400 Bad Request, empty body                        | safe rejection at the HTTP layer, no crash, no leak                          |
| 20000-char query string                                 | 414 URI Too Long, empty body                       | Kestrel request-line limit, safe, no leak                                    |
| 8000-byte arbitrary header                              | 200, handled normally                              | no crash                                                                     |
| Duplicate `X-Correlation-ID` headers                    | 200, first value honoured                          | reasonable, undocumented but harmless                                        |
| `Accept: application/xml` on `/health/live`             | 200 `application/json` (no 406)                    | contract does not require content negotiation; acceptable                    |
| `--http1.0` request to `/health/live`                   | 200, `Connection: close`, identical body           | acceptable                                                                   |
| `TRACE /health/live`                                    | 405, no reflection of request                      | no Cross-Site-Tracing exposure                                               |

## 7. Not covered this pass (recorded honestly)

- **`GET /health/ready` → 503 `database_unavailable` / `schema_incompatible`** — not re-triggered live
  this pass; doing so would require `docker stop` on the owned PostgreSQL container, which this pass's
  non-destructive/non-disruptive mandate ("do not stop or restart the running stack") prohibits.
  Cross-referenced against the plan's own prior evidence at
  `evidence/phase-5/manual-verification-recovery-and-two-instance.txt`, which already exercised this
  exact scenario against this same stack lineage and recorded the correct `503`
  `database_unavailable` shape with recovery.
- **Backend/web startup guard (`runtime_mode_disabled`)** — explicitly process-level (no HTTP
  listener exists during the failure); out of this pass's HTTP-only immutable scope and would require
  restarting the service under a different runtime mode, prohibited this pass.
- **`ose-id-web` status shell (`GET /` on port 3500)** — explicitly out of this pass's immutable
  scope; never requested.
- **True raw-socket CRLF header-injection probe** — `curl -H` cannot transmit literal CR/LF bytes in a
  header value (it either rejects or the shell/tool escapes them); the percent-encoded literal string
  probe sent instead confirmed permissive-but-bounded acceptance, not true injection. A genuine
  raw-socket probe would exceed the standard `curl`-based technique set for this pass.
- **Database-row-level confirmation of "zero identity/authorization/audit rows created"** — not
  independently queried; no database credentials were in scope (the immutable scope is HTTP-only).
  Inferred from deterministic, side-effect-free, sub-millisecond responses under repeated/concurrent
  load and from the documented architecture (fixed problem response, no persistence call on this
  path), not directly verified via SQL.
