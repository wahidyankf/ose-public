# Sanitized Request/Response Matrix — verification-mode retest `aet-c4b3191bca34`

Retest of `AET-001`/`AET-002`/`AET-003` (discovery run `aet-2ecbb6945fdd`) against a fresh instance of
`http://127.0.0.1:8501`. Every request below was issued with `curl`. No credential, cookie, token, or
secret was ever sent or received; none is redacted below because none was present. Correlation IDs are
real (generated per request) and included verbatim since they carry no secret.

## 0. Baseline — genuinely nonexistent paths (control)

| #   | Method | Path                                         | Status                               | Headers (besides `Date`)                                      | Body                                                                                               |
| --- | ------ | -------------------------------------------- | ------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| B1  | GET    | `/nonexistent-foo-bar`                       | 404                                  | `Content-Length: 0`, `Server: Kestrel`                        | empty                                                                                              |
| B2  | POST   | `/this-truly-does-not-exist-9f3a`            | 404                                  | `Content-Length: 0`, `Server: Kestrel`                        | empty                                                                                              |
| B3  | HEAD   | `/this-path-genuinely-does-not-exist-abc123` | (no response within 6s `--max-time`) | headers received: `Server: Kestrel` only, no `Content-Length` | connection held open, `curl: (28) Operation timed out after 6001ms with 0 bytes received` — see §4 |

## 1. AET-001 retest — wrong method on every one of the 7 routes now returns a bare `404`, not `405`

22 individual wrong-method probes across all 7 routes (both health routes + all 5 disabled-capability
routes), including the original 14 core probes plus 8 additional methods (`DELETE`, `PATCH`) to
confirm the fix is method-agnostic.

| #   | Method  | Path                         | Status (was `405`)                         | `Allow` header (was leaked)        | `Content-Length` | Body  |
| --- | ------- | ---------------------------- | ------------------------------------------ | ---------------------------------- | ---------------- | ----- |
| 1   | HEAD    | `/health/live`               | 404 (after ~131s, see §4/AET-004)          | absent                             | absent           | empty |
| 2   | OPTIONS | `/health/live`               | 404                                        | absent                             | `0`              | empty |
| 3   | POST    | `/health/live`               | 404                                        | absent                             | `0`              | empty |
| 4   | DELETE  | `/health/live`               | 404                                        | absent                             | `0`              | empty |
| 5   | TRACE   | `/health/live`               | 404                                        | absent                             | `0`              | empty |
| 6   | POST    | `/health/ready`              | 404                                        | absent                             | `0`              | empty |
| 7   | PATCH   | `/health/ready`              | 404                                        | absent                             | `0`              | empty |
| 8   | POST    | `/connect/authorize`         | 404                                        | absent                             | `0`              | empty |
| 9   | HEAD    | `/connect/authorize`         | (hang, killed at 6s; same signature as B3) | absent (only `Date`/`Server` seen) | absent           | empty |
| 10  | OPTIONS | `/connect/authorize`         | 404                                        | absent                             | `0`              | empty |
| 11  | PUT     | `/connect/authorize`         | 404                                        | absent                             | `0`              | empty |
| 12  | DELETE  | `/connect/authorize`         | 404                                        | absent                             | `0`              | empty |
| 13  | PATCH   | `/connect/authorize`         | 404                                        | absent                             | `0`              | empty |
| 14  | GET     | `/connect/token`             | 404                                        | absent                             | `0`              | empty |
| 15  | PATCH   | `/connect/token`             | 404                                        | absent                             | `0`              | empty |
| 16  | POST    | `/external/google/challenge` | 404                                        | absent                             | `0`              | empty |
| 17  | DELETE  | `/external/google/challenge` | 404                                        | absent                             | `0`              | empty |
| 18  | GET     | `/scim/v2/Users`             | 404                                        | absent                             | `0`              | empty |
| 19  | PATCH   | `/scim/v2/Users`             | 404                                        | absent                             | `0`              | empty |
| 20  | TRACE   | `/scim/v2/Users`             | 404                                        | absent                             | `0`              | empty |
| 21  | POST    | `/platform/admin/companies`  | 404                                        | absent                             | `0`              | empty |
| 22  | DELETE  | `/platform/admin/companies`  | 404                                        | absent                             | `0`              | empty |

**22/22 wrong-method probes: bare `404`, zero `Allow` leakage, across `GET`/`POST`/`HEAD`/`OPTIONS`/
`PUT`/`DELETE`/`PATCH`/`TRACE` and all 7 routes. AET-001 does not reproduce. Method-agnostic — the fix
is not verb-specific.**

Sample raw exchange (`POST /connect/authorize`, was `405 Allow: GET` at discovery time):

```text
> POST /connect/authorize HTTP/1.1
> Host: 127.0.0.1:8501

< HTTP/1.1 404 Not Found
< Content-Length: 0
< Date: Wed, 16 Sep 2026 15:54:32 GMT
< Server: Kestrel
```

## 2. AET-002 retest — header shape on the rewritten `404` now matches the absent-path baseline exactly

The originally-suggested remedy for AET-002 ("add `X-Correlation-ID`/`Cache-Control: no-store` to the
`405`") was **not** what got implemented. Instead, the wrong-method answer is rewritten to the bare
`404` shape and **all four** headers the disabled-capability/health routes normally carry on a
matched request (`Content-Type`, `Cache-Control`, `X-Correlation-ID`, and the previously-leaked
`Allow`) are now **absent**, matching the framework's genuinely-unregistered-route answer exactly —
not matching the augmented shape originally proposed.

| Probe (same 22 as §1)                       | `Content-Type` | `Cache-Control: no-store` | `X-Correlation-ID` | `Allow` | Matches baseline (§0, B1/B2)?                                |
| ------------------------------------------- | -------------- | ------------------------- | ------------------ | ------- | ------------------------------------------------------------ |
| all 22, non-`HEAD` (21)                     | absent         | absent                    | absent             | absent  | **yes, byte-for-byte** (see §3 diff)                         |
| `HEAD` × 2 (health/live, connect/authorize) | absent         | absent                    | absent             | absent  | **yes** — including the shared no-`Content-Length` hang (§4) |

**22/22 probed wrong-method responses now omit `X-Correlation-ID`/`Cache-Control: no-store` — the
same way the genuinely-absent-path baseline always has. This is the contract-conforming shape per
the new `specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature`: "OSE ID answers
exactly as it answers an unregistered path" (an unregistered path never carried these headers
either). AET-002 does not reproduce under the correct interpretation of "matches the absent-path
baseline," which is the interpretation the new spec fixes as ground truth.**

## 3. Byte-for-byte diff — rewritten wrong-method `404` vs. genuinely-absent-path baseline

`diff` of the two responses' headers with the (necessarily time-varying) `Date` line stripped:

```text
$ diff <(grep -v '^Date:' headers_wm_connect_authorize_post.txt) <(grep -v '^Date:' headers_baseline_get_nonexistent.txt)
(no output — identical)

$ diff <(grep -v '^Date:' headers_wm_platform_admin_delete.txt) <(grep -v '^Date:' headers_baseline_post_nonexistent2.txt)
(no output — identical)
```

Both diffs are empty: status line, `Content-Length: 0`, and `Server: Kestrel` are the only fields
present in both cases, in the same order, with the same values. Body is empty (`0` bytes) in both
cases. This directly satisfies the task's requirement 2 ("byte-for-byte indistinguishable from a
genuinely-absent path").

## 4. New observation — AET-004 (Minor, not part of AET-001/002/003's scope): `HEAD` requests to any bare `404` hang for ~131s

While retesting `HEAD /health/live` (one of the original AET-001/AET-002 probes), the request did not
return immediately like every other method. It resolved after `TIME=131.411577` seconds with the same
`Content-Length`-absent, `Allow`-absent shape as every other probe. `HEAD /connect/authorize`
reproduced the same signature (killed at a 6s `--max-time` rather than waiting the full ~131s, since
the framing signature was already conclusive). Critically, **the same hang reproduces on `HEAD` to a
genuinely-nonexistent baseline path never touched by the new middleware** (`/this-path-genuinely-does-
not-exist-abc123`, §0 B3) — `RouteDisclosurePolicy.DisclosesRegisteredPath(404)` is `false`, so
`RouteDisclosureGuard` does not run its rewrite branch for that request at all. This means:

- The hang is **not introduced by `RouteDisclosureGuard`**; it is a pre-existing characteristic of the
  framework's own bare-404 middleware when answering `HEAD` specifically (every non-`HEAD` method,
  including on the exact same paths, gets an explicit `Content-Length: 0` and returns in under 2ms —
  see §1's `Content-Length` column and `headers_wm_health_live_options.txt`/
  `headers_wm_health_live_post.txt` for two same-path, same-route, non-`HEAD` comparisons that do not
  hang).
- It does **not** break the AET-001/AET-002 "indistinguishable from absent path" requirement — both
  sides of the comparison hang identically (confirmed via matching `curl -v` framing diagnostics:
  `"no chunk, no close, no size. Assume close to signal end"` on both the disclosure-guard-rewritten
  path and the untouched baseline path).
- It **is** a newly-surfaced side effect of the fix in one narrow sense: pre-fix, a wrong-method `HEAD`
  request hit the `405` short-circuit, which explicitly set `Content-Length: 0` and returned in
  under 2ms (see the discovery run's own `request-response-matrix.md` §3, `HEAD /health/live → 405`
  row — fast, not hung). Post-fix, that same request is now routed into the framework's slow,
  ambiguous-framing bare-404 path and takes ~131 seconds. This is a real, reproducible latency
  regression for `HEAD` callers specifically (e.g. lightweight uptime probes that prefer `HEAD` over
  `GET`), even though it does not violate the specific contract clause this delivery unit's fix
  targets.

**Root-cause hypothesis (not verified against source, offered for the maintainer's triage only):**
ASP.NET Core/Kestrel's automatic Content-Length computation for a response with nothing written
appears to run in the normal completion path for every method except `HEAD`; for `HEAD`, Kestrel
seems to skip declaring `Content-Length: 0` even when the response is otherwise empty, leaving
HTTP/1.1 framing ambiguous until the connection's own keep-alive timeout (Kestrel default ~120s)
elapses and signals end-of-message via close. This affects the framework's `MapFallback`/terminal
404 middleware globally, not anything `RouteDisclosureGuard` or `RouteDisclosurePolicy` wrote.

**Disposition recommendation:** file separately from AET-001/AET-002/AET-003 (this retest does not
formally track it as a delivery-blocking item per the task's scope, which asked only for
AET-001/002/003 dispositions); flagged here so the maintainer can decide whether to open a new item.
Severity assessed as Minor (no data disclosure, no crash, self-heals after ~131s, and pre-dates this
delivery unit's own change), not Major, because the practical exposure is narrow (only `HEAD`
requests to a `404`-returning path, using a client that waits for connection-close framing).

## 5. Regression — the 7 documented operations' correct method/path (unchanged conformance)

| Operation                              | Method/Path                      | Status | Content-Type                 | Cache-Control | X-Correlation-ID | Body                                                                             |
| -------------------------------------- | -------------------------------- | ------ | ---------------------------- | ------------- | ---------------- | -------------------------------------------------------------------------------- |
| `getLiveness`                          | `GET /health/live`               | 200 ✓  | `application/json` ✓         | `no-store` ✓  | present ✓        | `{"status":"live","service":"ose-id-be"}` ✓                                      |
| `getReadiness`                         | `GET /health/ready`              | 200 ✓  | `application/json` ✓         | `no-store` ✓  | present ✓        | `{"status":"ready","components":{"postgresql":"ready","schema":"compatible"}}` ✓ |
| `rejectDisabledOidcAuthorization`      | `GET /connect/authorize`         | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | `{"status":404,"code":"capability_disabled",...}` ✓                              |
| `rejectDisabledTokenIssuance`          | `POST /connect/token`            | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same shape ✓                                                                     |
| `rejectDisabledGoogleSignIn`           | `GET /external/google/challenge` | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same shape ✓                                                                     |
| `rejectDisabledScimUserProvisioning`   | `POST /scim/v2/Users`            | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same shape ✓                                                                     |
| `rejectDisabledPlatformAdministration` | `GET /platform/admin/companies`  | 404 ✓  | `application/problem+json` ✓ | `no-store` ✓  | present ✓        | same shape ✓                                                                     |

**7/7 documented operations: unchanged, full conformance — no regression from the new middleware on
the correct-method path.**

## 6. Regression — closed-surface sweep (same 28 paths as the discovery run)

All 28 previously-probed out-of-scope paths (`/`, `/health`, `/healthz`, `/api/health`, `/swagger`,
`/swagger/index.html`, `/openapi.json`, `/openapi.yaml`, `/.well-known/openid-configuration`,
`/connect/userinfo`, `/connect/logout`, `/connect/endsession`, `/account/login`, `/account/register`,
`/account/logout`, `/company`, `/companies`, `/v1/health/live`, `/api/v1/health/live`, `/metrics`,
`/robots.txt`, `/favicon.ico`, `/scim/v2/ServiceProviderConfig`, `/platform/admin`,
`/platform/admin/companies/1`, `/external/google`, `/connect`, `/oidc`, `/.well-known/jwks.json`):
**28/28 still return bare `404`, `Content-Length: 0`, no `Content-Type` — unchanged from the discovery
run. No new leakage, no new Swagger/OpenAPI self-exposure, no capability-code bleed.**

## 7. AET-003 retest — `Server: Kestrel` still disclosed (unchanged, out of scope, not fixed)

Every response captured this pass — all 22 wrong-method probes, all 7 regression probes, all 28
closed-surface probes, both baseline probes — carries `Server: Kestrel`. This was explicitly
out of scope for this retest per the task's own instructions ("deliberately not fixed, not in scope
for this retest"). Confirmed unchanged; no new evidence needed beyond the header captures above.

## 8. Not covered this pass (recorded honestly, consistent with the discovery run's own scope limits)

- Waiting out the full ~131s `HEAD` hang to natural completion on every route (only one full
  reproduction was allowed to complete — `/health/live` — plus one 6s-bounded partial reproduction on
  `/connect/authorize` and one on the untouched baseline; the framing signature is conclusive without
  spending ~15 more minutes of wall time re-confirming it 20 more times against an owned stack that
  must be left for the orchestrator).
- `GET /health/ready` → `503` reproduction — not re-triggered live this pass either (same
  non-destructive constraint as the discovery run; this dimension was not part of AET-001/002/003 and
  is out of this retest's scope).
- `ose-id-web` (port 3500) — out of scope, never requested.
