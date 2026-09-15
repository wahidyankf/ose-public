# API Contract Delta

## Contract Boundary

This slice adds one protected web page and a same-origin BFF contract in `ose-id-web`. It does not add,
update, or delete any `ose-id-be` operation. Every BFF handler derives the active Person and company from
the server-side opaque session, calls the exact backend operation delivered by the company-tenancy
slice, and projects only task-required fields.

`specs/apps/ose/id-web/contracts/company-admin.openapi.yaml` is the machine-readable OpenAPI 3.1 contract
for the running BFF and the API quality gate. The unchanged authoritative backend contract remains
`specs/apps/ose/id-be/contracts/tenancy.openapi.yaml` composed by
`specs/apps/ose/id-be/contracts/openapi.yaml`.

## Operation Index

| Action | Method and exact path                                            | Purpose                               | Detailed section                                       |
| ------ | ---------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| ADD    | `GET /admin/company`                                             | protected administration page         | [Page contract](#1-company-administration-page)        |
| ADD    | `GET /api/bff/company-admin/context`                             | current company/admin view            | [Context](#2-current-company-administration-context)   |
| ADD    | `GET /api/bff/company-admin/members`                             | member roster page                    | [Members](#3-list-company-members)                     |
| ADD    | `PATCH /api/bff/company-admin/members/{membershipId}`            | member status/authority mutation      | [Change member](#4-change-a-company-member)            |
| ADD    | `GET /api/bff/company-admin/invitations`                         | invitation roster page                | [Invitations](#5-list-company-invitations)             |
| ADD    | `POST /api/bff/company-admin/invitations`                        | create invitation                     | [Create invitation](#6-create-a-company-invitation)    |
| ADD    | `POST /api/bff/company-admin/invitations/{invitationId}/resends` | resend invitation                     | [Resend invitation](#7-resend-a-company-invitation)    |
| ADD    | `DELETE /api/bff/company-admin/invitations/{invitationId}`       | revoke invitation                     | [Revoke invitation](#8-revoke-a-company-invitation)    |
| ADD    | `GET /api/bff/company-admin/entitlements`                        | product-entry entitlement roster      | [Entitlements](#9-list-company-entitlements)           |
| ADD    | `PUT /api/bff/company-admin/entitlements/{productKey}`           | grant product entry                   | [Grant entitlement](#10-grant-company-product-entry)   |
| ADD    | `DELETE /api/bff/company-admin/entitlements/{productKey}`        | revoke product entry                  | [Revoke entitlement](#11-revoke-company-product-entry) |
| ADD    | `POST /api/bff/company-admin/context-exit`                       | leave admin area and reselect context | [Exit](#12-exit-the-company-administration-context)    |

No operation is updated or deleted.

## Shared BFF Contract

- Every request is same-origin. Mutations require the delivered opaque `HttpOnly` session cookie,
  exact `Origin`, CSRF proof, correct media type, and size limit. GET requests require the session but
  no CSRF proof.
- The BFF never accepts `companyId`, `personId`, provider identity, product role, or arbitrary return URL
  from the browser. It reloads active company/membership/authority and lets the backend enforce policy,
  transactions, RLS, last-admin, invitation, entitlement, and audit invariants.
- JSON successes use `application/json`; failures use a closed render-safe
  `application/problem+json` body:

```json
{
  "status": 409,
  "code": "version_conflict",
  "message": "The company information changed. Review the latest state and try again.",
  "recoveryAction": "reload",
  "correlationId": "50000000-0000-4000-8000-000000000008"
}
```

- Stable BFF codes are `invalid_request`, `authentication_required`, `csrf_invalid`, `company_admin_required`,
  `recent_auth_required`, `resource_not_found`, `version_conflict`,
  `administrator_transfer_required`, `invitation_exists`, `invitation_terminal`,
  `entitlement_terminal`, `idempotency_conflict`, `rate_limited`, and `dependency_unavailable`. Unknown
  backend status/body maps to `dependency_unavailable`; it is never passed through.
- Every response is `Cache-Control: private, no-store` and has a safe correlation ID. Bodies/logs/traces/
  metrics/evidence omit provider subject, credential/method inventory, password/hash, raw session,
  invitation capability/digest, notification body, private/global audit, IP/device fingerprint, Company B
  data/counts, and backend/RLS details.
- `membershipId` and `invitationId` are opaque UUIDs; `productKey` follows the delivered bounded product
  key grammar. A malformed identifier fails before an upstream call.

## Detailed Operation Contracts

### 1. Company administration page

`GET /admin/company`

**Owner, caller, authentication, and context.** `ose-id-web` owns this HTML route. A browser is the
only caller. The request carries the opaque `ose_id_session` cookie; there is no OAuth scope or API
audience because this is a first-party HTML navigation. The server reloads the Person, active company,
active membership, and current `membership_admin` authority from the backend. No browser value selects
the company. The route exists only in explicit Local/Test mode.

**Request contract.** The path has no parameters, query, request body, or CSRF requirement. The only
accepted representation is HTML. A representative request is:

```http
GET /admin/company HTTP/1.1
Host: 127.0.0.1:8501
Accept: text/html
Cookie: ose_id_session=<opaque>
```

Any query string is rejected with `400 invalid_request`; a non-HTML `Accept` value returns `406
representation_not_acceptable`. Header and cookie limits are the existing web-shell limits.

**Success contract.** Success is `200 text/html; charset=utf-8`. The response renders only the company
display label, administration tabs, and a server-derived bootstrap state. It never embeds a complete
member, invitation, or entitlement roster in HTML or React Server Component state.

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000081
Content-Security-Policy: frame-ancestors 'none'
Referrer-Policy: no-referrer

<!doctype html><html lang="en"><body><main><h1>Company A administration</h1></main></body></html>
```

**Stable failures.** `400` covers any query; `406` covers a representation other than HTML. Signed-out
navigation returns `302` with an allowlisted relative sign-in continuation. A personal, ordinary-member,
foreign, suspended, or stale context returns the same `403` HTML denied state without confirming any
company. A disabled runtime returns `404` route absence. `429` includes integer `Retry-After`. Backend
unavailability returns a retryable `503` HTML state. No backend body is forwarded.

```http
HTTP/1.1 403 Forbidden
Content-Type: text/html; charset=utf-8
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000082

<!doctype html><html lang="en"><body><main><h1>Company administration is unavailable</h1></main></body></html>
```

**Validation and operational semantics.** This safe GET is read-idempotent, creates no replayable
command, performs no optimistic write, and has no pagination. It uses the existing bounded page-request
limiter; exceeding it returns `429` HTML with integer `Retry-After`. Every render reauthorizes, so an
authority change racing the request either produces the old authorized response before the committed
change or the denied response after it; no authority is cached in process memory.

**State, privacy, cache, and logging.** The operation persists nothing. Every outcome is `private,
no-store` and varies on the session cookie. Logs contain route template, status, duration, and safe
correlation ID only. They exclude session values, Person/company/membership identifiers, roster data,
provider identity, contact values, and backend/RLS details.

**Publication, compatibility, and rollback.** This HTML route is documented in the web route manifest;
OpenAPI, discovery metadata, generated API clients, and codegen are `none`. Rollout updates the route
manifest, implements the disabled route, verifies it, renders the UI, and only then enables the local
feature flag. It is additive for existing web consumers. Roll back on unsafe disclosure, incorrect
authorization, or backend-contract mismatch by disabling/removing the route; backend data and Plan 03
operations remain untouched.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A current company administrator opens the administration page
  Given an authenticated Person has active membership-administrator authority in Company A
  When the browser requests the company administration page
  Then the page returns the Company A administration shell with no complete roster in rendered state

Scenario Outline: Company administration page requests fail safely
  Given the company administration page has <condition>
  When the browser requests the company administration page
  Then the page returns <status> without disclosing a company identifier or backend detail

  Examples:
    | condition | status |
    | an unexpected query string | 400 |
    | a signed-out browser | 302 |
    | a personal or non-admin context | 403 |
    | a disabled runtime | 404 |
    | an unavailable backend | 503 |

Scenario: Repeated company administration page reads remain private
  Given a current Company A administrator repeatedly opens the administration page
  When each request is authorized against current backend state
  Then no command is replayed and no response or authority is cached
  And logs omit session tenant membership roster contact provider and backend details
```

Unit proof covers request validation, render-state projection, failure mapping, headers, and redaction.
Integration proof uses the real route, session store, generated backend client, and authority changes.
E2E proof uses Company A, Company B, personal, signed-out, disabled-runtime, and dependency-failure
fixtures. No Unit, Integration, or E2E exemption applies.

### 2. Current company-administration context

`GET /api/bff/company-admin/context`

**Owner, caller, authentication, and context.** `ose-id-web` owns the BFF operation and the generated
browser client. A same-origin company-administration page calls it with the opaque session cookie. OAuth
scopes and API audience are `none`. The BFF reloads the active Person/company/membership and requires
current `membership_admin` authority; `companyId` is never accepted as input.

**Request contract.** Required headers are `Accept: application/json` and `Cookie:
ose_id_session=<opaque>`; `X-Correlation-ID` is optional and, when present, must be a UUID. Query, path
parameters, body, `Content-Type`, `Origin`, and CSRF proof are `none`.

```http
GET /api/bff/company-admin/context HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Cookie: ose_id_session=<opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000083
```

**Success contract.** Success is `200 application/json`; `companyId` and `membershipId` are opaque UUID
display references, `displayName` is 1–200 Unicode scalar values after normalization, `authority` is the
literal `membership_admin`, `version` is an integer greater than zero, and the three booleans are render
hints rather than authorization grants. Additional fields are forbidden.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000083

{"company":{"companyId":"60000000-0000-4000-8000-000000000008","displayName":"Company A"},"currentMembership":{"membershipId":"61000000-0000-4000-8000-000000000008","authority":"membership_admin","version":7},"actions":{"manageMembers":true,"manageInvitations":true,"manageEntitlements":true}}
```

**Stable failures.** `400 invalid_request` covers an invalid correlation header or unexpected query;
`401 authentication_required` covers a missing/invalid/expired session; `403 company_admin_required`
enumeration-safely covers personal, ordinary-member, suspended, foreign, stale, or absent company
context; `429 rate_limited` includes integer `Retry-After`; `503 dependency_unavailable` covers timeout,
unavailable backend, and unknown upstream status/body.

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000084

{"status":403,"code":"company_admin_required","message":"Company administration is unavailable for the current context.","recoveryAction":"reselect_context","correlationId":"50000000-0000-4000-8000-000000000084"}
```

**Validation and operational semantics.** Unknown headers are ignored except security-sensitive
forwarding headers, which are rejected. The GET is read-idempotent, has no replay key, performs no write,
uses no version precondition, and has no pagination. It uses the existing per-session/network BFF read
limiter. Concurrent authority loss becomes visible on the next read and blocks all mutations.

**State, privacy, cache, and logging.** The BFF persists nothing and keeps no correctness state in its
process. Responses are `private, no-store` and vary on the cookie. The browser may receive only the
documented company/current-membership/action fields. Logs omit cookie, Person/company/membership values,
contacts, provider identities, credential/method inventory, and backend/RLS detail.

**Publication, compatibility, and rollback.** Add this exact operation and closed schemas to
`company-admin.openapi.yaml`; the generated browser client changes, discovery and AsyncAPI are `none`,
and the generated backend client is retained. Rollout validates the OpenAPI, generates the browser
client, implements and verifies the disabled handler, then enables its UI call. Existing web routes
remain compatible because this path is additive. Roll back on schema drift, unsafe disclosure, or
authorization mismatch by disabling/removing the guarded BFF route and browser call without modifying
backend state.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A current company administrator reads the safe administration context
  Given an authenticated Person has active membership-administrator authority in Company A
  When the browser requests the company administration context
  Then the BFF returns only Company A current membership version and render-hint actions

Scenario Outline: Company administration context errors remain stable
  Given the context request has <condition>
  When the browser requests the company administration context
  Then the BFF returns <status> and <code> without another company or backend detail

  Examples:
    | condition | status | code |
    | an unexpected query | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | no current administrator authority | 403 | company_admin_required |
    | an exceeded read limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Repeated administration context reads reauthorize and remain private
  Given a current Company A administrator reads the administration context twice
  When administrator authority is removed between the reads
  Then the second read is denied and no command is replayed or state cached
  And logs omit session tenant membership contact provider and backend details
```

Unit proof covers closed schemas, header validation, projection, problem mapping, and redaction.
Integration proof exercises the real handler, session persistence, generated client, rate limiter, and
authority race. E2E proof covers successful, personal, member, cross-company, expired-session, limited,
and dependency-failure journeys. No Unit, Integration, or E2E exemption applies.

### 3. List company members

`GET /api/bff/company-admin/members?query={verified-email-prefix}&cursor={opaque}&limit={1..100}`

**Owner, caller, authentication, and context.** `ose-id-web` owns the BFF operation. The same-origin
members tab calls it with an opaque session. OAuth scopes/audience are `none`. The BFF derives the Person
and active company and requires current `membership_admin` authority before it calls the Plan 03 member
directory; browser query data never selects a company or establishes identity authority.

**Request contract.** Required headers are JSON `Accept` and the session cookie. Optional `query` is a
literal normalized verified-email prefix of 2–320 characters; wildcard/regex/control characters are
forbidden. Optional `cursor` is an opaque 16–2048 character backend cursor bound to company, query, and
order. Optional `limit` is a base-10 integer from 1 through 100 and defaults to 50. Repeated parameters,
unknown query keys, body, `Content-Type`, `Origin`, and CSRF proof are forbidden/`none`.

```http
GET /api/bff/company-admin/members?query=member.a%40example.test&limit=50 HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Cookie: ose_id_session=<opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000085
```

**Success contract.** Success is `200 application/json`. `items` contains at most `limit` entries.
Each item has an opaque UUID `membershipId`, a normalized `verifiedEmailAddress` up to 320 characters,
closed `status` (`active` or `suspended`), closed `authority` (`member` or `membership_admin`), and a
positive integer `version`. `nextCursor` is `null` or an opaque string. Additional fields and totals are
forbidden. Ordering is normalized verified email, then membership ID.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000085

{"items":[{"membershipId":"62000000-0000-4000-8000-000000000008","verifiedEmailAddress":"member.a@example.test","status":"active","authority":"member","version":3}],"nextCursor":null}
```

**Stable failures.** `400 invalid_request` covers malformed/repeated/unknown parameters and a cursor
bound to another company/query/order; `401 authentication_required`; `403 company_admin_required`; `429
rate_limited` with integer `Retry-After`; and `503 dependency_unavailable`. Invalid and foreign-bound
cursors intentionally share `400` so the result cannot enumerate a company.

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000086

{"status":400,"code":"invalid_request","message":"The member list request is invalid.","recoveryAction":"reset_filters","correlationId":"50000000-0000-4000-8000-000000000086"}
```

**Validation and operational semantics.** Validation completes before the upstream call. The GET is
read-idempotent, has no replay key or write concurrency, and preserves the backend's query-bound keyset
pagination. The existing per-session/network roster-read limiter applies. Authority is reloaded on each
page, so authority loss or roster change between cursors either returns a valid current-company page or
fails safely; the cursor never provides authority.

**State, privacy, cache, and logging.** The BFF stores no roster or cursor state. Responses are
`private, no-store` and vary on the cookie. Verified contact is browser-visible solely to the current
company administrator for roster identification. Logs/traces/metrics/evidence exclude query text,
cursor, contact, membership/company/Person IDs, totals, provider identity, session, and backend detail.

**Publication, compatibility, and rollback.** Add this path, parameters, closed item/page/problem
schemas, headers, and examples to `company-admin.openapi.yaml`; regenerate the browser client only.
Discovery, AsyncAPI, and backend-client codegen changes are `none`. Rollout validates the OpenAPI,
generates the browser client, implements and verifies the disabled handler, then enables the members tab.
The operation is additive and does not alter Plan 03 pagination. Roll back on cursor drift,
authorization error, or disclosure by disabling the route and UI tab; no backend roster state changes.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator lists one bounded current-company member page
  Given a current Company A administrator and members in Company A and Company B
  When the browser lists Company A members with a verified-email prefix and limit
  Then the BFF returns the ordered Company A member fields and an opaque next cursor only

Scenario Outline: Member-list failures do not enumerate another company
  Given the member-list request has <condition>
  When the browser lists company members
  Then the BFF returns <status> and <code> without a roster count or foreign-company hint

  Examples:
    | condition | status | code |
    | an invalid or foreign-bound cursor | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | no current administrator authority | 403 | company_admin_required |
    | an exceeded roster-read limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Member pagination is read-idempotent and private
  Given a current Company A administrator receives a query-bound member cursor
  When the same page request is repeated while authority and roster state remain current
  Then the BFF returns the same ordered page without creating a command or caching authority
  And logs omit the query cursor contact tenant membership session and provider values
```

Unit proof covers query/limit/cursor validation, schema projection, ordering, problem parity, and
redaction. Integration proof uses the real handler and backend cursor with Company A/B data, authority
loss, and limiter. E2E proof covers filtering, next-page navigation, invalid cursor, personal/member
denial, dependency failure, and browser/log leak assertions. No Unit, Integration, or E2E exemption
applies.

### 4. Change a company member

`PATCH /api/bff/company-admin/members/{membershipId}`

**Owner, caller, authentication, and context.** `ose-id-web` owns the BFF operation. The same-origin
member editor calls it. The opaque session identifies the Person; the BFF reloads the active company and
current `membership_admin` authority. OAuth scopes/audience are `none`. The opaque path ID identifies a
membership only after tenant authorization; it never selects the company.

**Request contract.** Required headers are `Accept: application/json`, `Content-Type:
application/json`, the session cookie, exact `Origin: http://127.0.0.1:8501`, and matching opaque
`X-CSRF-Token`. The body limit is 1 KiB. `membershipId` is a canonical UUID. The closed JSON object has
required positive integer `version`; optional `status` is `active` or `suspended`; optional `authority`
is `member` or `membership_admin`; at least one optional field must be present and non-null. Unknown
fields, query parameters, email, Person/company identifiers, entitlements, and product roles are
forbidden.

```http
PATCH /api/bff/company-admin/members/62000000-0000-4000-8000-000000000008 HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Content-Type: application/json
Origin: http://127.0.0.1:8501
Cookie: ose_id_session=<opaque>
X-CSRF-Token: <opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000087

{"status":"suspended","version":3}
```

**Success contract.** Success is `200 application/json` with the authoritative updated member. Fields
are an opaque UUID `membershipId`, normalized `verifiedEmailAddress` up to 320 characters, closed
`status`, closed `authority`, and positive integer incremented `version`; additional fields are
forbidden.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000087

{"membershipId":"62000000-0000-4000-8000-000000000008","verifiedEmailAddress":"member.a@example.test","status":"suspended","authority":"member","version":4}
```

**Stable failures.** `400 invalid_request` covers invalid UUID/body/media and illegal transition shape;
`401 authentication_required`; `403 csrf_invalid` covers an absent/mismatched origin or CSRF proof;
`403 company_admin_required` covers tenant/authority failure; safe `404 resource_not_found`; `409
version_conflict` for stale compare-and-swap;
`409 administrator_transfer_required` for the final-active-admin invariant; `429 rate_limited` with
integer `Retry-After`; and `503 dependency_unavailable`.

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000088

{"status":409,"code":"version_conflict","message":"The company information changed. Review the latest state and try again.","recoveryAction":"reload","correlationId":"50000000-0000-4000-8000-000000000088"}
```

**Validation and operational semantics.** Browser validation is advisory; BFF schema/origin/CSRF and
backend domain validation are mandatory. The operation has no `Idempotency-Key`; compare-and-swap on
`version` makes one concurrent command win and stale replay return `version_conflict` without reapplying.
Pagination is `none`. The existing per-session/member-mutation limiter applies. A final-admin transfer
must complete through a legal authority change before removal/suspension can succeed.

**State, privacy, cache, and logging.** Only the backend transaction persists the membership change and
company audit event; the BFF persists no command or authority. Responses are `private, no-store` and
vary on the cookie. Logs contain route template, status, safe code, duration, and correlation ID, not
membership/version/contact/session/CSRF/tenant values, proposed authority/status, or backend details.

**Publication, compatibility, and rollback.** Add the exact path, request/member/problem schemas,
security headers, examples, and stable statuses to `company-admin.openapi.yaml`; regenerate the browser
client only. Discovery/AsyncAPI/backend codegen are `none`. Rollout validates the OpenAPI, generates the
browser client, implements and verifies the disabled handler, then enables the member editor. The path
is additive and forwards the unchanged Plan 03 compare-and-swap contract. Disable the BFF/UI on
authorization, schema, or projection failure; rollback never reverses committed membership/audit state.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator changes a member with the current version
  Given a current Company A administrator views an active member at version 3
  When the browser suspends that member with version 3
  Then the BFF returns the authoritative suspended member at version 4

Scenario Outline: Company member changes return stable safe failures
  Given the member-change request has <condition>
  When the browser submits the member change
  Then the BFF returns <status> and <code> without a foreign membership or backend detail

  Examples:
    | condition | status | code |
    | an invalid body or media type | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | an invalid origin or CSRF proof | 403 | csrf_invalid |
    | no current administrator authority | 403 | company_admin_required |
    | a missing or foreign membership | 404 | resource_not_found |
    | a stale version | 409 | version_conflict |
    | removal of the final active administrator | 409 | administrator_transfer_required |
    | an exceeded mutation limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: A stale company member change cannot replay
  Given two Company A administrator requests use membership version 3
  When the first request commits and the second request replays
  Then only the first mutation and audit event commit
  And the second returns version conflict while logs omit command and identity values
```

Unit proof covers closed-body validation, origin/CSRF, projection, error mapping, compare-and-swap, and
redaction. Integration proof uses the real handler/backend/database for concurrent mutation, final-admin,
audit, limiter, and cross-company parity. E2E proof covers successful edit, stale UI reload, last-admin,
malformed/unauthorized requests, and leak assertions. No Unit, Integration, or E2E exemption applies.

### 5. List company invitations

`GET /api/bff/company-admin/invitations?cursor={opaque}&limit={1..100}`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF read. The same-origin
invitations tab calls it with the opaque session cookie. OAuth scopes/audience are `none`. The BFF
derives the Person and active company and reloads current `membership_admin` authority; neither query
parameter can select a tenant.

**Request contract.** Required headers are `Accept: application/json` and `Cookie:
ose_id_session=<opaque>`. Optional `cursor` is an opaque 16–2048 character value bound to company and
ordering. Optional `limit` is a base-10 integer from 1 through 100 and defaults to 50. Repeated or unknown
parameters, body, `Content-Type`, `Origin`, and CSRF proof are forbidden/`none`.

```http
GET /api/bff/company-admin/invitations?limit=50 HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Cookie: ose_id_session=<opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000089
```

**Success contract.** Success is `200 application/json`. Each item contains an opaque UUID
`invitationId`, normalized `recipientEmail` up to 320 characters, closed `intendedAuthority` (`member`
or `membership_admin`), closed `status` (`pending`, `accepted`, `revoked`, or `expired`), UTC RFC 3339
`expiresAt`, and positive integer `version`. `nextCursor` is `null` or opaque. Additional fields and a
total are forbidden; ordering and cursor semantics remain the Plan 03 backend order.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000089

{"items":[{"invitationId":"63000000-0000-4000-8000-000000000008","recipientEmail":"invitee.a@example.test","intendedAuthority":"member","status":"pending","expiresAt":"2026-09-16T10:00:00Z","version":1}],"nextCursor":null}
```

**Stable failures.** `400 invalid_request` covers malformed/repeated/unknown parameters and foreign- or
order-bound cursors; `401 authentication_required`; `403 company_admin_required`; `429 rate_limited`
with integer `Retry-After`; and `503 dependency_unavailable`. Invalid and foreign-bound cursors share
the same enumeration-safe problem.

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000090

{"status":400,"code":"invalid_request","message":"The invitation list request is invalid.","recoveryAction":"reload","correlationId":"50000000-0000-4000-8000-000000000090"}
```

**Validation and operational semantics.** Validation precedes the backend call. The GET is
read-idempotent, has no replay key or write concurrency, and preserves query-bound keyset pagination.
The existing per-session/network invitation-read limiter applies. An authority change between pages is
reauthorized; a cursor is never authority and never reveals whether a foreign invitation exists.

**State, privacy, cache, and logging.** The BFF persists no invitation/cursor data. Responses are
`private, no-store` and vary on the cookie. Recipient contact is visible only to a current administrator.
Capability, digest, notification body/address, Person/company identifiers, cursor, session, provider
identity, and backend detail are absent from responses beyond the listed fields and from observability.

**Publication, compatibility, and rollback.** Add this operation, parameters, page/item/problem
schemas, headers, and examples to `company-admin.openapi.yaml`; regenerate the browser client only.
Discovery, AsyncAPI, and backend codegen are `none`. Rollout validates the OpenAPI, generates the browser
client, implements and verifies the disabled handler, then enables the invitations tab. It is additive
and preserves Plan 03 ordering. Disable the BFF/UI on pagination, authorization, or disclosure failure;
backend invitations remain.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator lists one bounded invitation page
  Given a current Company A administrator and invitations in Company A and Company B
  When the browser lists Company A invitations with a limit
  Then the BFF returns ordered Company A invitation view fields and an opaque cursor only

Scenario Outline: Invitation-list errors remain tenant-safe
  Given the invitation-list request has <condition>
  When the browser lists company invitations
  Then the BFF returns <status> and <code> without a foreign invitation or total

  Examples:
    | condition | status | code |
    | an invalid or foreign-bound cursor | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | no current administrator authority | 403 | company_admin_required |
    | an exceeded invitation-read limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Invitation pagination is read-idempotent and redacted
  Given a current Company A administrator receives an invitation cursor
  When the same page is read again under unchanged authority and data
  Then no command is replayed and the same ordered page is returned
  And capability digest delivery session tenant and provider values are not returned or logged
```

Unit proof covers parameter/cursor validation, closed projection, problem parity, and redaction.
Integration proof exercises the real handler/backend cursor, Company A/B data, limiter, and authority
loss. E2E proof covers paging, invalid cursor, personal/member denial, dependency failure, and browser/log
leak checks. No Unit, Integration, or E2E exemption applies.

### 6. Create a company invitation

`POST /api/bff/company-admin/invitations`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF command. The same-origin
invitation form is its only caller. The opaque session identifies the Person; the BFF derives the active
company and reloads current `membership_admin` authority. OAuth scopes/audience are `none`; recipient
data never selects a tenant or establishes identity authority.

**Request contract.** Required headers are JSON `Accept`/`Content-Type`, the session cookie, exact local
`Origin`, matching `X-CSRF-Token`, and `Idempotency-Key` containing 16–128 visible ASCII characters. The
key is bound to session, derived company, operation, and canonical request digest. The body limit is 2
KiB. The closed JSON object requires normalized `recipientEmail` of 3–320 characters and
`intendedAuthority` equal to `member` or `membership_admin`. Unknown fields, query, company/Person ID,
product role, and capability are forbidden.

```http
POST /api/bff/company-admin/invitations HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Content-Type: application/json
Origin: http://127.0.0.1:8501
Cookie: ose_id_session=<opaque>
X-CSRF-Token: <opaque>
Idempotency-Key: invite-000000000008
X-Correlation-ID: 50000000-0000-4000-8000-000000000091

{"recipientEmail":"invitee.a@example.test","intendedAuthority":"member"}
```

**Success contract.** Success is `201 application/json` with same-origin relative `Location`. The body
has opaque UUID `invitationId`, normalized `recipientEmail`, closed `intendedAuthority`, literal
`pending` status, UTC RFC 3339 `expiresAt`, and positive integer `version`; additional fields are
forbidden. Notification publication/delivery remains a backend transaction and local Mailpit concern.

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/bff/company-admin/invitations/63000000-0000-4000-8000-000000000008
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000091

{"invitationId":"63000000-0000-4000-8000-000000000008","recipientEmail":"invitee.a@example.test","intendedAuthority":"member","status":"pending","expiresAt":"2026-09-16T10:00:00Z","version":1}
```

**Stable failures.** `400 invalid_request` covers header/media/body/email/authority/key validation; `401
authentication_required`; `403 csrf_invalid` covers an absent/mismatched origin or CSRF proof; `403
company_admin_required`; `409 invitation_exists` for an existing eligible/pending relationship; `409
idempotency_conflict` for the same key with another digest; `429 rate_limited` with integer
`Retry-After`; and `503 dependency_unavailable`.

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000092

{"status":409,"code":"idempotency_conflict","message":"This request key was already used for different invitation data.","recoveryAction":"use_new_request_key","correlationId":"50000000-0000-4000-8000-000000000092"}
```

**Validation and operational semantics.** Validation precedes backend work. Same key/digest replay
returns the original status, safe body, and `Location`; same key/different digest conflicts. Concurrent
equivalent creation converges on one pending invitation and at-most-one delivery publication. Pagination
is `none`. Backend address/company and BFF session/network invitation-create limits both apply; any limit
maps to the stable `429` response.

**State, privacy, cache, and logging.** The backend alone persists invitation, idempotency, outbox, and
company-audit state. BFF instances persist no key/digest/result. Responses are `private, no-store` and
vary on the cookie. Logs omit recipient, idempotency key/digest, session/CSRF, invitation/company/Person
IDs, capability/digest, notification body/address, provider identity, and backend detail.

**Publication, compatibility, and rollback.** Add this exact path, security/idempotency headers,
closed request/invitation/problem schemas, statuses, examples, and `Location` to
`company-admin.openapi.yaml`; regenerate the browser client only. Discovery/AsyncAPI/backend codegen are
`none`. Rollout validates the OpenAPI, generates the browser client, implements and verifies the disabled
handler, then enables the create form. The additive BFF maps to the unchanged Plan 03 command. Disable it
on replay, notification, or authorization defect; rollback never deletes or redelivers a committed
invitation/outbox/audit record.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator creates one company invitation
  Given a current Company A administrator enters a valid synthetic recipient and authority
  When the browser creates the invitation with a new idempotency key
  Then one pending invitation and one delivery publication are committed
  And the BFF returns only the safe invitation view and relative location

Scenario Outline: Invitation creation returns stable failures
  Given the create-invitation request has <condition>
  When the browser creates the invitation
  Then the BFF returns <status> and <code> without capability delivery or tenant detail

  Examples:
    | condition | status | code |
    | an invalid header body email authority or key | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | an invalid origin or CSRF proof | 403 | csrf_invalid |
    | no current administrator authority | 403 | company_admin_required |
    | an existing invitation | 409 | invitation_exists |
    | a reused key with different data | 409 | idempotency_conflict |
    | an exceeded create limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Invitation creation replay is result-idempotent and private
  Given two equivalent Company A invitation requests use the same idempotency key and digest
  When both requests complete concurrently or one is replayed
  Then both return the original safe result while one invitation and delivery publication exist
  And logs omit recipient key digest capability delivery session tenant and provider values
```

Unit proof covers schema/header/origin/CSRF/key validation, safe projection, problem mapping, replay, and
redaction. Integration proof uses real BFF/backend/PostgreSQL/outbox/Mailpit for replay, concurrency,
limits, cross-company parity, and failure recovery. E2E proof covers successful form submission,
duplicate/conflicting replay, validation, denial, rate limit, Mailpit boundary, and leak checks. No Unit,
Integration, or E2E exemption applies.

### 7. Resend a company invitation

`POST /api/bff/company-admin/invitations/{invitationId}/resends`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF command. The same-origin
invitation row action calls it. The opaque session identifies the Person; the BFF derives the active
company and reloads `membership_admin` authority. OAuth scopes/audience are `none`. The UUID identifies
an invitation only after tenant authorization.

**Request contract.** Required headers are JSON `Accept`/`Content-Type`, session cookie, exact local
`Origin`, matching `X-CSRF-Token`, and a 16–128 visible-ASCII `Idempotency-Key` bound to session, derived
company, invitation ID, operation, and empty-body digest. `invitationId` must be a canonical UUID. Body
is the exact closed empty object and limited to 128 bytes. Query and all fields are forbidden.

```http
POST /api/bff/company-admin/invitations/63000000-0000-4000-8000-000000000008/resends HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Content-Type: application/json
Origin: http://127.0.0.1:8501
Cookie: ose_id_session=<opaque>
X-CSRF-Token: <opaque>
Idempotency-Key: resend-000000000008
X-Correlation-ID: 50000000-0000-4000-8000-000000000093

{}
```

**Success contract.** Success is `202 application/json`. The response contains opaque UUID
`invitationId`, normalized `recipientEmail`, closed `intendedAuthority`, literal `pending` status, new
UTC RFC 3339 `expiresAt`, and incremented positive integer `version`; additional fields are forbidden.
The capability, digest, and notification content never cross the BFF boundary.

```http
HTTP/1.1 202 Accepted
Content-Type: application/json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000093

{"invitationId":"63000000-0000-4000-8000-000000000008","recipientEmail":"invitee.a@example.test","intendedAuthority":"member","status":"pending","expiresAt":"2026-09-17T10:00:00Z","version":2}
```

**Stable failures.** `400 invalid_request` covers UUID/header/body/key validation; `401
authentication_required`; `403 csrf_invalid` covers an absent/mismatched origin or CSRF proof; `403
company_admin_required`; safe `404 resource_not_found`; `409 invitation_terminal` for accepted, revoked,
or expired state; `409 idempotency_conflict` for same key/different digest; `429 rate_limited` with
integer `Retry-After`; and `503 dependency_unavailable`.

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000094

{"status":409,"code":"invitation_terminal","message":"The invitation can no longer be resent.","recoveryAction":"reload","correlationId":"50000000-0000-4000-8000-000000000094"}
```

**Validation and operational semantics.** BFF validation precedes the backend. Same key/digest replay
returns the original `202` result; same key/different digest conflicts. Concurrent resend/revoke/accept
resolves through backend locking to one legal authoritative state; a successful resend atomically
invalidates the old capability and publishes at most one replacement delivery. Pagination is `none`.
Backend invitation/address and BFF session/network mutation limits apply.

**State, privacy, cache, and logging.** Backend persistence owns capability invalidation, replacement
invitation delivery, idempotency result, outbox, and audit; the BFF persists none. Responses are
`private, no-store`. Logs omit invitation/contact/key/digest/capability/message/delivery/session/CSRF/
tenant/provider values and backend details.

**Publication, compatibility, and rollback.** Add the exact path, headers, empty-body request,
invitation/problem schemas, statuses, and examples to `company-admin.openapi.yaml`; regenerate the
browser client only. Discovery/AsyncAPI/backend codegen are `none`. Rollout validates the OpenAPI,
generates the browser client, implements and verifies the disabled handler, then enables the resend
action. This additive route preserves Plan 03 semantics. Disable it on replay or disclosure defects;
rollback does not revalidate an old capability or undo a committed delivery/audit record.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator resends one pending invitation
  Given a current Company A administrator has a pending invitation
  When the browser resends it with a new idempotency key
  Then the old capability is invalidated and one replacement delivery is published
  And the BFF returns only the updated safe invitation view

Scenario Outline: Invitation resend returns stable safe failures
  Given the resend request has <condition>
  When the browser resends the invitation
  Then the BFF returns <status> and <code> without capability delivery or tenant detail

  Examples:
    | condition | status | code |
    | an invalid UUID header body or key | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | an invalid origin or CSRF proof | 403 | csrf_invalid |
    | no current administrator authority | 403 | company_admin_required |
    | a missing or foreign invitation | 404 | resource_not_found |
    | a terminal invitation | 409 | invitation_terminal |
    | a reused key with different data | 409 | idempotency_conflict |
    | an exceeded resend limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Invitation resend replay and concurrency preserve one result
  Given equivalent resend requests race with revoke or acceptance
  When the backend resolves the commands and a resend is replayed
  Then one legal invitation state and at most one replacement delivery exist
  And logs omit contact key digest capability delivery session tenant and provider values
```

Unit proof covers UUID/header/body/origin/CSRF/key validation, safe projection, stable errors, replay,
and redaction. Integration proof uses real BFF/backend/PostgreSQL/outbox/Mailpit for concurrent
resend/revoke/accept, limits, and cross-company parity. E2E proof covers success, terminal/missing/
unauthorized/conflicting replay, delivery visibility only in Mailpit, and leak checks. No exemption
applies at Unit, Integration, or E2E.

### 8. Revoke a company invitation

`DELETE /api/bff/company-admin/invitations/{invitationId}`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF command. The same-origin
invitation row action calls it. The opaque session identifies the Person; the BFF derives the active
company and reloads current `membership_admin` authority. OAuth scopes/audience are `none`; the UUID is
resolved only inside that server-derived tenant.

**Request contract.** Required headers are the session cookie, exact local `Origin`, and matching
`X-CSRF-Token`; `Accept: application/json` is allowed but no success representation is returned.
`invitationId` is a canonical UUID. Query, `Content-Type`, body, `Idempotency-Key`, company ID, and
Person ID are forbidden/`none`.

```http
DELETE /api/bff/company-admin/invitations/63000000-0000-4000-8000-000000000008 HTTP/1.1
Host: 127.0.0.1:8501
Origin: http://127.0.0.1:8501
Cookie: ose_id_session=<opaque>
X-CSRF-Token: <opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000095
```

**Success contract.** Success is `204` with an explicitly empty body. An already-revoked invitation
owned by the derived company also returns `204`. The browser subsequently issues a fresh list read.

```http
HTTP/1.1 204 No Content
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000095
Content-Length: 0
```

**Stable failures.** `400 invalid_request` covers UUID/header validation; `401
authentication_required`; `403 csrf_invalid` covers an absent/mismatched origin or CSRF proof; `403
company_admin_required`; safe `404 resource_not_found`; `409 invitation_terminal` for an
accepted/expired state that cannot be represented as revoke; `429 rate_limited` with integer
`Retry-After`; and `503 dependency_unavailable`.

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000096

{"status":404,"code":"resource_not_found","message":"The invitation is unavailable.","recoveryAction":"reload","correlationId":"50000000-0000-4000-8000-000000000096"}
```

**Validation and operational semantics.** Validation precedes the backend. The command has no replay
key, but revoke is state-idempotent for an owned already-revoked invitation. Concurrent revoke/resend/
accept uses backend locking and capability invalidation to commit one legal state. Pagination and
version header are `none`. The existing per-session/network invitation-mutation limiter applies.

**State, privacy, cache, and logging.** Backend persistence owns the atomic revoke, capability
invalidation, outbox disposition, and audit; the BFF persists none. Responses are `private, no-store`.
Logs omit invitation/company/Person IDs, contact, capability/digest/message/delivery, session/CSRF,
provider identity, and backend detail. Missing and foreign resources are indistinguishable.

**Publication, compatibility, and rollback.** Add the exact path, security headers, empty success,
problem schemas, statuses, and examples to `company-admin.openapi.yaml`; regenerate the browser client
only. Discovery/AsyncAPI/backend codegen are `none`. Rollout validates the OpenAPI, generates the browser
client, implements and verifies the disabled handler, then enables the revoke action. The additive route
preserves Plan 03 idempotent revoke. Disable it on authorization or disclosure failure; rollback never
restores a revoked capability or removes committed audit state.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator revokes one pending invitation
  Given a current Company A administrator has a pending invitation
  When the browser revokes that invitation
  Then the backend atomically revokes it and invalidates its capability
  And the BFF returns an empty no-content response

Scenario Outline: Invitation revoke returns stable safe failures
  Given the revoke request has <condition>
  When the browser revokes the invitation
  Then the BFF returns <status> and <code> without confirming a foreign invitation

  Examples:
    | condition | status | code |
    | an invalid UUID or header | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | an invalid origin or CSRF proof | 403 | csrf_invalid |
    | no current administrator authority | 403 | company_admin_required |
    | a missing or foreign invitation | 404 | resource_not_found |
    | an incompatible terminal invitation | 409 | invitation_terminal |
    | an exceeded mutation limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Invitation revoke is state-idempotent and concurrency-safe
  Given revoke resend and acceptance race for one Company A invitation
  When the commands complete and an owned revoke is repeated
  Then one legal terminal state exists and an already-revoked invitation returns no content
  And logs omit invitation contact capability delivery session tenant and provider values
```

Unit proof covers UUID/origin/CSRF validation, empty response, error parity, idempotent state mapping,
and redaction. Integration proof uses real BFF/backend/PostgreSQL for revoke/replay/concurrent resend or
accept, limiter, audit, and cross-company parity. E2E proof uses isolated synthetic invitations for the
successful destructive path and covers errors and leaks; live API discovery excludes successful
destruction. No Unit, Integration, or E2E exemption applies.

### 9. List company entitlements

`GET /api/bff/company-admin/entitlements`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF read. The same-origin
entitlements tab calls it with the opaque session cookie. OAuth scopes/audience are `none`. The BFF
derives Person and active company and reloads current `membership_admin` authority. No browser field can
select company, product role, or product-domain permission.

**Request contract.** Required headers are `Accept: application/json` and the session cookie. Optional
`X-Correlation-ID`, when present, is a UUID. Path/query parameters, body, `Content-Type`, `Origin`, and
CSRF proof are forbidden/`none`.

```http
GET /api/bff/company-admin/entitlements HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Cookie: ose_id_session=<opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000097
```

**Success contract.** Success is `200 application/json`. `items` is bounded by the local product
registry and ordered by `productKey`. Each item has bounded lower-kebab `productKey`, normalized
`displayName` of 1–100 Unicode scalar values, closed `status` (`active` or `revoked`), and positive
integer `version`. Additional fields, pagination cursor, total, product-domain roles, and permissions are
forbidden.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000097

{"items":[{"productKey":"ose-lms","displayName":"OSE LMS","status":"active","version":4}]}
```

**Stable failures.** `400 invalid_request` covers unexpected query/body or invalid correlation header;
`401 authentication_required`; `403 company_admin_required`; `429 rate_limited` with integer
`Retry-After`; and `503 dependency_unavailable`. All authority/tenant failures intentionally share the
same `403` shape.

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000098

{"status":403,"code":"company_admin_required","message":"Company administration is unavailable for the current context.","recoveryAction":"reselect_context","correlationId":"50000000-0000-4000-8000-000000000098"}
```

**Validation and operational semantics.** The GET is read-idempotent, has no replay key or write
concurrency, and is deliberately non-paginated because the local registry is bounded. The existing
per-session/network entitlement-read limiter applies. Current authority and company entitlement state
are reloaded on each read; process memory is not authoritative.

**State, privacy, cache, and logging.** The BFF persists no entitlement state. Responses are `private,
no-store` and vary on cookie. Browser-visible fields are limited to product entry only. Logs omit
session, Person/company IDs, product state/version, provider identity, product roles/permissions,
private audit, and backend detail.

**Publication, compatibility, and rollback.** Add the exact operation, closed collection/item/problem
schemas, headers, statuses, and examples to `company-admin.openapi.yaml`; regenerate the browser client
only. Discovery/AsyncAPI/backend codegen are `none`. Rollout validates the OpenAPI, generates the browser
client, implements and verifies the disabled handler, then enables the entitlements tab. This additive
read preserves the unchanged Plan 03 registry contract. Disable the route/UI on projection,
authorization, or disclosure failure; backend entitlements remain.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator lists company product-entry entitlements
  Given a current Company A administrator and a bounded local product registry
  When the browser lists company entitlements
  Then the BFF returns ordered product key display status and version fields only

Scenario Outline: Entitlement-list errors remain stable and tenant-safe
  Given the entitlement-list request has <condition>
  When the browser lists company entitlements
  Then the BFF returns <status> and <code> without product roles or foreign-company detail

  Examples:
    | condition | status | code |
    | an unexpected query or invalid correlation header | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | no current administrator authority | 403 | company_admin_required |
    | an exceeded entitlement-read limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Repeated entitlement reads remain stateless and private
  Given a current Company A administrator reads company entitlements twice
  When company state is reloaded for each request
  Then no command is replayed and no entitlement or authority is cached in process
  And logs omit session tenant product state provider role permission and backend details
```

Unit proof covers request validation, closed projection, ordering, error parity, and redaction.
Integration proof uses real handler/backend/database, authority loss, limiter, and Company A/B
entitlements. E2E proof covers successful list, personal/member denial, unexpected input, dependency
failure, and browser/log leak checks. No Unit, Integration, or E2E exemption applies.

### 10. Grant company product entry

`PUT /api/bff/company-admin/entitlements/{productKey}`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF command. The same-origin
entitlement control calls it. The opaque session identifies Person; the BFF derives active company and
reloads `membership_admin` authority. OAuth scopes/audience are `none`. `productKey` identifies only a
bounded local product; it does not select company or grant a product-domain role.

**Request contract.** Required headers are JSON `Accept`/`Content-Type`, session cookie, exact local
`Origin`, and matching `X-CSRF-Token`. `productKey` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`, is 1–64
characters, and must exist in the local registry. The body is the exact closed empty object and limited
to 128 bytes. Query, `Idempotency-Key`, version, company/Person ID, product role, and permission are
forbidden.

```http
PUT /api/bff/company-admin/entitlements/ose-lms HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Content-Type: application/json
Origin: http://127.0.0.1:8501
Cookie: ose_id_session=<opaque>
X-CSRF-Token: <opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000099

{}
```

**Success contract.** Success is `204` with an explicitly empty body. The browser must perform a fresh
entitlement list to obtain status/version; no optimistic state is returned.

```http
HTTP/1.1 204 No Content
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000099
Content-Length: 0
```

**Stable failures.** `400 invalid_request` covers key/media/body validation; `401
authentication_required`; `403 csrf_invalid` covers an absent/mismatched origin or CSRF proof; `403
company_admin_required`; safe `404 resource_not_found` for unknown, missing, or non-visible product;
`409 entitlement_terminal` only when backend policy forbids transition; `429 rate_limited` with integer
`Retry-After`; and `503 dependency_unavailable`.

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000100

{"status":404,"code":"resource_not_found","message":"The product entry is unavailable.","recoveryAction":"reload","correlationId":"50000000-0000-4000-8000-000000000100"}
```

**Validation and operational semantics.** Validation precedes the backend. No idempotency key or
version is used; the backend conditional upsert makes repeated identical grant commands
state-idempotent. Concurrent grant/revoke resolves under the Plan 03 transaction to one legal state.
Pagination is `none`. The existing per-session/network entitlement-mutation limiter applies.

**State, privacy, cache, and logging.** Backend persistence owns entitlement mutation, authorization
version change, and audit; the BFF persists none. Responses are `private, no-store`. Logs omit
session/CSRF, Person/company/product identifiers, entitlement state/version, provider identity, product
roles/permissions, and backend details. Missing and foreign resources are indistinguishable.

**Publication, compatibility, and rollback.** Add the exact path, product-key rule, security headers,
empty request/success, problem schemas, statuses, and examples to `company-admin.openapi.yaml`;
regenerate the browser client only. Discovery/AsyncAPI/backend codegen are `none`. Rollout validates the
OpenAPI, generates the browser client, implements and verifies the disabled handler, then enables the
grant control. This additive command preserves Plan 03 semantics. Disable it on authorization/
concurrency/projection defects; rollback never reverses committed entitlement/audit state.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator grants product entry
  Given a current Company A administrator and a revoked OSE LMS company entitlement
  When the browser grants OSE LMS product entry
  Then the backend activates the company entitlement and advances authorization state
  And the BFF returns an empty no-content response without a product role

Scenario Outline: Product-entry grant returns stable safe failures
  Given the grant request has <condition>
  When the browser grants company product entry
  Then the BFF returns <status> and <code> without product-role or foreign-company detail

  Examples:
    | condition | status | code |
    | an invalid key body or media type | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | an invalid origin or CSRF proof | 403 | csrf_invalid |
    | no current administrator authority | 403 | company_admin_required |
    | an unknown or non-visible product | 404 | resource_not_found |
    | a forbidden terminal transition | 409 | entitlement_terminal |
    | an exceeded mutation limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Product-entry grant is state-idempotent and concurrency-safe
  Given grant and revoke race for the Company A OSE LMS entitlement
  When the commands complete and the winning grant is repeated
  Then one legal entitlement state and its audit history exist
  And logs omit session tenant product state provider role permission and backend details
```

Unit proof covers product-key/body/origin/CSRF validation, empty response, problems, state-idempotence,
and redaction. Integration proof uses real BFF/backend/PostgreSQL for repeat/racing grant-revoke,
authorization version, audit, limiter, and cross-company parity. E2E proof uses isolated company/product
fixtures for success and covers errors, fresh list reload, and leaks. No Unit, Integration, or E2E
exemption applies.

### 11. Revoke company product entry

`DELETE /api/bff/company-admin/entitlements/{productKey}`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF command. The same-origin
entitlement control calls it. The opaque session identifies Person; the BFF derives active company and
reloads `membership_admin` authority. OAuth scopes/audience are `none`. `productKey` identifies a bounded
local product only after tenant authorization and never a product-domain role.

**Request contract.** Required headers are the session cookie, exact local `Origin`, and matching
`X-CSRF-Token`; JSON `Accept` is allowed for failures. `productKey` matches the 1–64 character lower-kebab
grammar and must exist in the local registry. Query, body, `Content-Type`, `Idempotency-Key`, version,
company/Person ID, role, and permission are forbidden/`none`.

```http
DELETE /api/bff/company-admin/entitlements/ose-lms HTTP/1.1
Host: 127.0.0.1:8501
Origin: http://127.0.0.1:8501
Cookie: ose_id_session=<opaque>
X-CSRF-Token: <opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000101
```

**Success contract.** Success is `204` with an explicitly empty body after the atomic active-to-revoked
transition. An already-revoked entitlement in the derived company also returns `204`. The browser then
reloads the authoritative list.

```http
HTTP/1.1 204 No Content
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000101
Content-Length: 0
```

**Stable failures.** `400 invalid_request` covers key/header validation; `401 authentication_required`;
`403 csrf_invalid` covers an absent/mismatched origin or CSRF proof; `403 company_admin_required`; safe
`404 resource_not_found`; `409 entitlement_terminal` only when backend policy forbids transition; `429
rate_limited` with integer `Retry-After`; and `503 dependency_unavailable`.

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000102

{"status":403,"code":"company_admin_required","message":"Company administration is unavailable for the current context.","recoveryAction":"reselect_context","correlationId":"50000000-0000-4000-8000-000000000102"}
```

**Validation and operational semantics.** Validation precedes the backend. No idempotency key/version is
used; already-revoked state is result-idempotent. Concurrent grant/revoke resolves through the Plan 03
transaction to one legal state and authorization version. Pagination is `none`. The existing
per-session/network entitlement-mutation limiter applies.

**State, privacy, cache, and logging.** Backend persistence owns entitlement transition, authorization
version, and audit; the BFF persists none. Responses are `private, no-store`. Logs omit session/CSRF,
Person/company/product identifiers, entitlement state/version, provider identity, product roles/
permissions, and backend details. Missing and foreign resources are indistinguishable.

**Publication, compatibility, and rollback.** Add the exact path, key rule, security headers, empty
success, problem schemas, statuses, and examples to `company-admin.openapi.yaml`; regenerate the browser
client only. Discovery/AsyncAPI/backend codegen are `none`. Rollout validates the OpenAPI, generates the
browser client, implements and verifies the disabled handler, then enables the revoke control. The
additive command preserves Plan 03 state-idempotent revoke. Disable it on authorization/concurrency
defects; rollback never reactivates a committed entitlement or deletes audit state.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: A company administrator revokes product entry
  Given a current Company A administrator and an active OSE LMS company entitlement
  When the browser revokes OSE LMS product entry
  Then the backend revokes the company entitlement and advances authorization state
  And the BFF returns an empty no-content response without changing an LMS role

Scenario Outline: Product-entry revoke returns stable safe failures
  Given the revoke-entitlement request has <condition>
  When the browser revokes company product entry
  Then the BFF returns <status> and <code> without product-role or foreign-company detail

  Examples:
    | condition | status | code |
    | an invalid key or header | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | an invalid origin or CSRF proof | 403 | csrf_invalid |
    | no current administrator authority | 403 | company_admin_required |
    | an unknown or foreign product entry | 404 | resource_not_found |
    | a forbidden terminal transition | 409 | entitlement_terminal |
    | an exceeded mutation limit | 429 | rate_limited |
    | an unavailable backend | 503 | dependency_unavailable |

Scenario: Product-entry revoke is state-idempotent and concurrency-safe
  Given grant and revoke race for the Company A OSE LMS entitlement
  When the commands complete and an owned completed revoke is repeated
  Then one legal entitlement state exists and the repeat returns no content
  And logs omit session tenant product state provider role permission and backend details
```

Unit proof covers key/origin/CSRF validation, empty response, stable errors, state-idempotence, and
redaction. Integration proof uses real BFF/backend/PostgreSQL for repeat/racing revoke-grant,
authorization version, audit, limiter, and cross-company parity. E2E proof uses isolated company/product
fixtures for successful destruction and covers errors, reload, and leak checks; live API discovery does
not execute successful destruction. No Unit, Integration, or E2E exemption applies.

### 12. Exit the company-administration context

`POST /api/bff/company-admin/context-exit`

**Owner, caller, authentication, and context.** `ose-id-web` owns this BFF command. The same-origin exit
control calls it. The opaque session identifies the Person and current presentation selection. Company
administrator authority is not required to exit, but the BFF never trusts a browser tenant or return
path. OAuth scope/audience are `none`; the delivered authorization-context flow performs the next
eligibility decision.

**Request contract.** Required headers are JSON `Accept`/`Content-Type`, session cookie, exact local
`Origin`, and matching `X-CSRF-Token`. The body is the exact closed empty object and limited to 128 bytes.
Path/query parameters, `Idempotency-Key`, company/Person ID, and return URL are forbidden.

```http
POST /api/bff/company-admin/context-exit HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
Content-Type: application/json
Origin: http://127.0.0.1:8501
Cookie: ose_id_session=<opaque>
X-CSRF-Token: <opaque>
X-Correlation-ID: 50000000-0000-4000-8000-000000000103

{}
```

**Success contract.** Success is `200 application/json`. The closed body contains only literal
allowlisted `nextPath` value `/authorize/context`; additional fields are forbidden. The command clears
only presentation selection and forces fresh backend context evaluation; it does not mutate membership,
entitlement, or durable authorization eligibility.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000103

{"nextPath":"/authorize/context"}
```

**Stable failures.** `400 invalid_request` covers media/body/header validation; `401
authentication_required`; `403 csrf_invalid` covers an absent/mismatched origin or CSRF proof; `429
rate_limited` with integer `Retry-After`; and `503 dependency_unavailable`. The operation never reflects
a supplied redirect.

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
Cache-Control: private, no-store
Vary: Cookie
X-Correlation-ID: 50000000-0000-4000-8000-000000000104

{"status":400,"code":"invalid_request","message":"The context exit request is invalid.","recoveryAction":"reload","correlationId":"50000000-0000-4000-8000-000000000104"}
```

**Validation and operational semantics.** Validation precedes selection clearing. No idempotency key or
version is used; repeated exit is result-idempotent and returns the same allowlisted path. Concurrent
exit and company changes cannot preserve stale eligibility because the next context flow reloads backend
state. Pagination is `none`. The existing per-session/network BFF mutation limiter applies.

**State, privacy, cache, and logging.** Only presentation selection is cleared from the delivered
server-side session store; company membership/entitlement and backend audit are unchanged. BFF instances
retain no selection in process. Responses are `private, no-store`. Logs omit session/CSRF, former or
eligible contexts, company/Person IDs, provider identity, return paths beyond the route template, and
backend detail.

**Publication, compatibility, and rollback.** Add the exact path, headers, empty request, closed
success/problem schemas, statuses, and examples to `company-admin.openapi.yaml`; regenerate the browser
client only. Discovery/AsyncAPI/backend codegen are `none`. Rollout validates the OpenAPI, generates the
browser client, implements and verifies the disabled handler, then enables the exit control. The additive
operation points only to the already-delivered context route. Disable it on open-redirect, stale-context,
or session-clearing defect; rollback leaves durable company state untouched and the user can navigate
through the existing context flow.

**Contract scenarios and proof.** Canonical destination:
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`; scenario titles are exact below.

```gherkin
Scenario: Leaving company administration forces fresh context evaluation
  Given an authenticated Person is viewing Company A administration
  When the browser exits company administration
  Then the BFF clears only presentation selection and returns the allowlisted context path
  And the next flow reloads current personal and company eligibility

Scenario Outline: Company administration exit returns stable failures
  Given the context-exit request has <condition>
  When the browser exits company administration
  Then the BFF returns <status> and <code> without reflecting a return path or tenant detail

  Examples:
    | condition | status | code |
    | an invalid body or media type | 400 | invalid_request |
    | no valid session | 401 | authentication_required |
    | an invalid origin or CSRF proof | 403 | csrf_invalid |
    | an exceeded mutation limit | 429 | rate_limited |
    | an unavailable session dependency | 503 | dependency_unavailable |

Scenario: Repeated company administration exit is result-idempotent and private
  Given an authenticated Person exits company administration twice while company state changes
  When the delivered context flow begins after each response
  Then both responses use only the allowlisted context path and eligibility is reloaded
  And logs omit session previous context tenant provider and backend values
```

Unit proof covers empty-body/header/origin/CSRF validation, allowlisted output, errors, idempotence, and
redaction. Integration proof uses the real BFF/session store and backend context flow for repeated and
concurrent changes plus limiter behavior. E2E proof covers successful exit, personal/company eligibility
reload, invalid/unauthorized/limited/dependency states, open-redirect rejection, and leak checks. No
Unit, Integration, or E2E exemption applies.

### 13. Backend API no-delta disposition

Plan 08 consumes the Plan 03 backend API but owns no backend operation. The executor must not treat a
typed-client regeneration, web projection, or BFF error mapping as permission to change the backend
contract. Phase 0 must bundle `specs/apps/ose/id-be/contracts/openapi.yaml`, record the predecessor
commit and SHA-256 semantic digest, and extract the exact ten consumed operations:

```json
{
  "schemaVersion": "1.0",
  "surface": "ose-id-be-company-admin-consumer",
  "operations": [
    "GET /api/v1/account/contexts",
    "GET /api/v1/companies/{companyId}/members",
    "PATCH /api/v1/companies/{companyId}/members/{membershipId}",
    "GET /api/v1/companies/{companyId}/invitations",
    "POST /api/v1/companies/{companyId}/invitations",
    "POST /api/v1/companies/{companyId}/invitations/{invitationId}/resends",
    "DELETE /api/v1/companies/{companyId}/invitations/{invitationId}",
    "GET /api/v1/companies/{companyId}/entitlements",
    "PUT /api/v1/companies/{companyId}/entitlements/{productKey}",
    "DELETE /api/v1/companies/{companyId}/entitlements/{productKey}"
  ],
  "semanticSha256": "<64-lowercase-hex>",
  "sourceCommit": "<40-character-commit>"
}
```

Before BFF implementation and again after typed-client generation, a structural OpenAPI comparison must
prove equality for every consumed operation's method, path, operation ID, parameters, security,
request/response media types, status codes, headers, closed schemas, serialized examples, stable
problems, pagination, idempotency, replay, concurrency, rate-limit, cache, privacy, and deprecation
metadata. Formatting and local reference layout are the only ignored differences. No ignore rule may be
added during execution.

The BFF always derives the active Person and company from its opaque server-side session and forwards
only fields already accepted by Plan 03. It may narrow a successful backend response into the explicitly
documented browser response above and map unknown upstream failures to
`503 dependency_unavailable`; it may not widen authority, accept a company selector, invent a backend
status, expose an upstream body, or create a second domain implementation.

Any semantic difference is an undeclared backend API `UPDATE`. It blocks Plan 08 until the API index,
per-operation packets, machine-readable source, compatibility policy, migration/no-loss analysis,
rollback, and app-scoped Gherkin are amended. Rollback removes the additive page, BFF routes, generated
consumer, and local feature flag while leaving the Plan 03 API, migrations, company data, invitations,
entitlements, and audit history unchanged.

```gherkin
Feature: Company administration backend consumer compatibility

  Scenario: The company administration BFF consumes the unchanged backend contract
    Given the ten consumed backend operations match the recorded company API semantic digest
    When the company administration typed client and BFF are generated
    Then every consumed method path parameter security schema status and problem remains unchanged
    And the BFF projects only fields declared by its own browser contract

  Scenario: Backend contract drift blocks the company administration slice
    Given a consumed backend operation differs from the recorded company API baseline
    When the structural contract comparison runs
    Then company administration activation stops before the route is enabled
    And the report identifies the operation JSON pointer expected value and observed value
    And no generated client or ignore rule is accepted as a workaround
```

## Gherkin-Style Contract Scenarios

The canonical destination is
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`. These scenarios are app-scoped
and copy-ready; plan requirement mapping remains in technical document 005.

```gherkin
Feature: Company administration web API

  Scenario: A current company administrator receives one safe context
    Given an authenticated Person has current membership-administrator authority in Company A
    When the browser opens company administration
    Then the BFF returns only Company A and the current membership administration actions
    And it does not return another company provider identity credentials sessions capabilities or private audit

  Scenario: A personal or non-admin context fails closed
    Given an authenticated Person has no current company-administrator authority
    When the browser requests any company-administration operation
    Then the BFF returns the stable company-admin-required result
    And no company member invitation entitlement or count is disclosed

  Scenario: The roster identifies only current-company members
    Given a current Company A administrator and members in Company A and Company B
    When the browser requests the member roster
    Then the BFF returns Company A membership identity status authority and version fields only
    And the verified contact is used only to distinguish authorized roster members
    And no Company B or provider login credential session or private global field is returned or logged

  Scenario: Member filtering remains bound to the current company
    Given a current Company A administrator filters members by a verified-email prefix
    When the browser requests the next roster page with the returned cursor
    Then the BFF preserves the same Company A query and deterministic order
    And a cursor from another company or query is rejected without disclosing a result

  Scenario: A stale member change reloads authoritative state
    Given a current administrator views a member at version 3
    And another request changes that membership to version 4
    When the browser submits a change for version 3
    Then the BFF returns the stable version-conflict recovery result
    And it reloads the current company roster without predicting the mutation

  Scenario: The final administrator cannot be removed by the web flow
    Given Company A has one active membership administrator
    When that administrator submits a change that would remove the final administrator
    Then the BFF returns the stable administrator-transfer-required result
    And the membership and administration access remain unchanged

  Scenario: Invitation delivery never crosses the browser boundary
    Given a current Company A administrator enters a synthetic recipient email
    When the browser creates or resends an invitation
    Then the BFF returns only recipient status authority expiry and version
    And the capability digest message body and delivery address are absent from logs traces storage and evidence
    And the local message is observable only through the owned Mailpit test boundary

  Scenario: A company entitlement never becomes a product role
    Given a current Company A administrator manages product entry
    When the browser grants or revokes the OSE LMS entitlement
    Then the BFF returns only product key display status and version
    And it accepts no LMS role permission or domain-policy field

  Scenario: Leaving administration forces fresh context evaluation
    Given a Person is viewing Company A administration
    When the browser exits the administration context
    Then the BFF returns only the allowlisted authorization-context path
    And the next flow reloads current personal and company eligibility from the identity service

  Scenario: The browser never supplies tenant authority
    Given a signed-in browser has Company A active
    When it submits every company-administration request
    Then no request contains a company Person provider subject or arbitrary return value as authority
    And the server derives and reauthorizes the current company for every operation

  Scenario Outline: A company-administration adapter preserves its backend operation
    Given the browser has a current Company A administrator session
    When the BFF invokes <backend operation> for the matching administration action
    Then the backend remains the sole authority for tenant authorization validation mutation and audit
    And the adapter preserves the delivered success error replay concurrency rate and privacy contract
    And the adapter returns only the narrower company-administration view model

    Examples:
      | backend operation |
      | GET /api/v1/account/contexts?productKey={productKey} |
      | GET /api/v1/companies/{companyId}/members |
      | PATCH /api/v1/companies/{companyId}/members/{membershipId} |
      | GET /api/v1/companies/{companyId}/invitations |
      | POST /api/v1/companies/{companyId}/invitations |
      | POST /api/v1/companies/{companyId}/invitations/{invitationId}/resends |
      | DELETE /api/v1/companies/{companyId}/invitations/{invitationId} |
      | GET /api/v1/companies/{companyId}/entitlements |
      | PUT /api/v1/companies/{companyId}/entitlements/{productKey} |
      | DELETE /api/v1/companies/{companyId}/entitlements/{productKey} |
```

## OpenAPI, Compatibility, and Proof

The web contract file defines closed schemas, examples, every stable status/code, CSRF/session/origin
requirements, pagination, idempotency headers, and `additionalProperties: false`. Validate it and test
the running BFF against it; do not hand-edit any generated consumer. The backend OpenAPI diff must be
empty. Removing or changing a BFF field/status/path is a separately planned API update; ordinary rollback
disables/removes the entire guarded web slice while retaining backend data.

| Layer/gate       | Mandatory proof                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit             | runtime schemas, backend-to-view projections, problem mapping, auth/context, CSRF/origin, pagination, idempotency/version, redaction, page states, focus/status semantics    |
| Integration      | real Next.js handlers with generated backend client/session, current-company derivation, stale/last-admin/invitation/entitlement mapping, Mailpit handoff without capability |
| E2E              | built browser+BFF/backend/PostgreSQL/Mailpit for Company A/B/personal, roster, mutation conflicts, invitations, entitlements, exit, accessibility/responsive/leak checks     |
| API quality gate | strict `api-exploratory-tester` against web base URL and `company-admin.openapi.yaml`; successful destructive mutations remain isolated Integration/E2E-owned                |
| UI/live web      | strict static UI gate plus sequential exploratory, usability, and design testers over every tab/state/locale/breakpoint                                                      |

There are no default layer exemptions. Any genuinely inapplicable Integration/E2E adapter is declared
only per canonical scenario with the exact repository exemption comment and static coverage proof.
