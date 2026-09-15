# API Contract Delta

## Contract boundary

`ose-id-be` owns authenticator verification, factor policy, shared challenges, recent authentication,
session consequences, and OIDC evidence. `ose-id-web` owns same-origin BFF commands and accessible
browser presentation. WebAuthn browser objects are untrusted inputs until backend verification.
OIDC/OAuth endpoints remain OpenIddict standards endpoints rather than generic REST.

## Operation index

Every operation has one action and one complete packet. `RETAIN` is limited to three adjacent email
fallback BFF operations whose unchanged behavior is part of the authenticator rollout. There is no
`DELETE` operation.

| Action | Exact operation                                     | Detailed packet                                                                |
| ------ | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| ADD    | `GET /api/account/security-methods`                 | [Security methods](#operation-06-security-methods)                             |
| ADD    | `POST /api/passkeys/registration/options`           | [Passkey registration options](#operation-06-passkey-registration-options)     |
| ADD    | `POST /api/passkeys/registration/verify`            | [Passkey registration verify](#operation-06-passkey-registration-verify)       |
| ADD    | `POST /api/passkeys/authentication/options`         | [Passkey authentication options](#operation-06-passkey-authentication-options) |
| ADD    | `POST /api/passkeys/authentication/verify`          | [Passkey authentication verify](#operation-06-passkey-authentication-verify)   |
| ADD    | `DELETE /api/passkeys/{credentialId}`               | [Passkey removal](#operation-06-passkey-delete)                                |
| ADD    | `POST /api/totp/enrollments`                        | [TOTP enrollment](#operation-06-totp-enrollment)                               |
| ADD    | `POST /api/totp/enrollments/{enrollmentId}/confirm` | [TOTP confirmation](#operation-06-totp-confirm)                                |
| ADD    | `POST /api/totp/challenges/{challengeId}/verify`    | [TOTP challenge](#operation-06-totp-verify)                                    |
| ADD    | `DELETE /api/totp`                                  | [TOTP removal](#operation-06-totp-delete)                                      |
| ADD    | `POST /api/recovery-codes/regenerate`               | [Recovery regeneration](#operation-06-recovery-regenerate)                     |
| ADD    | `POST /api/recovery-codes/verify`                   | [Recovery verification](#operation-06-recovery-verify)                         |
| ADD    | `GET /sign-in/passkey`                              | [Passkey sign-in page](#operation-06-passkey-page)                             |
| ADD    | `GET /account/security/passkeys/add`                | [Passkey add page](#operation-06-passkey-add-page)                             |
| ADD    | `GET /account/security/totp/setup`                  | [TOTP setup page](#operation-06-totp-page)                                     |
| ADD    | `GET /challenge/mfa`                                | [MFA challenge page](#operation-06-mfa-page)                                   |
| ADD    | `GET /account/security/recovery-codes`              | [Recovery codes page](#operation-06-recovery-page)                             |
| ADD    | `POST /api/bff/passkeys/registration-options`       | [BFF registration options](#operation-06-bff-passkey-registration-options)     |
| ADD    | `POST /api/bff/passkeys/registration-verify`        | [BFF registration verify](#operation-06-bff-passkey-registration-verify)       |
| ADD    | `POST /api/bff/passkeys/authentication-options`     | [BFF authentication options](#operation-06-bff-passkey-authentication-options) |
| ADD    | `POST /api/bff/passkeys/authentication-verify`      | [BFF authentication verify](#operation-06-bff-passkey-authentication-verify)   |
| ADD    | `POST /api/bff/passkeys/remove`                     | [BFF passkey removal](#operation-06-bff-passkey-remove)                        |
| ADD    | `POST /api/bff/totp/start`                          | [BFF TOTP start](#operation-06-bff-totp-start)                                 |
| ADD    | `POST /api/bff/totp/confirm`                        | [BFF TOTP confirmation](#operation-06-bff-totp-confirm)                        |
| ADD    | `POST /api/bff/totp/verify`                         | [BFF TOTP verification](#operation-06-bff-totp-verify)                         |
| ADD    | `POST /api/bff/totp/disable`                        | [BFF TOTP disable](#operation-06-bff-totp-disable)                             |
| ADD    | `POST /api/bff/recovery-codes/regenerate`           | [BFF recovery regeneration](#operation-06-bff-recovery-regenerate)             |
| ADD    | `POST /api/bff/recovery-codes/verify`               | [BFF recovery verification](#operation-06-bff-recovery-verify)                 |
| UPDATE | `GET /account/security`                             | [Security page update](#operation-06-security-page-update)                     |
| UPDATE | `GET /sign-in`                                      | [Sign-in page update](#operation-06-sign-in-update)                            |
| UPDATE | `GET /connect/authorize`                            | [Authorization update](#operation-06-authorize-update)                         |
| UPDATE | `POST /connect/token`                               | [Token update](#operation-06-token-update)                                     |
| RETAIN | `POST /api/bff/sign-in/identify`                    | [Email identifier fallback](#operation-06-retain-identify)                     |
| RETAIN | `POST /api/bff/sign-in/password`                    | [Email password fallback](#operation-06-retain-password)                       |
| RETAIN | `POST /api/bff/recovery/request`                    | [Email recovery fallback](#operation-06-retain-recovery)                       |

## Delta summary

### ADD — backend account and authenticator JSON surface

All authenticated account mutations require the active Person session, CSRF/origin enforcement at the
BFF, and recent server-proven authentication. Problems use repository `application/problem+json` with
safe app-scoped codes and correlation ID. The backend never returns stored private key/biometric/PIN,
plaintext TOTP seed after its setup window, or a previously displayed recovery code.

| Method and exact path                               | Caller          | Authentication, authorization, context                                  | Request / success                                                                                                          | Errors, idempotency, concurrency, rate limit                                                                              |
| --------------------------------------------------- | --------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/account/security-methods`                 | first-party BFF | authenticated account owner; global Person scope, never company context | `200` safe method summaries, passkey public IDs/labels/status, TOTP status, recovery availability, recent-auth requirement | `401`; no secret/count detail beyond approved UX; safe conditional cache disabled                                         |
| `POST /api/passkeys/registration/options`           | first-party BFF | owner with recent auth and another safe access path                     | optional sanitized label; `200` WebAuthn creation options plus opaque transaction ID                                       | `409` policy/conflict; shared user limiter; repeated call creates a new challenge and invalidates no credential           |
| `POST /api/passkeys/registration/verify`            | first-party BFF | same bound owner/session/transaction                                    | WebAuthn credential response and label; `201` safe credential summary                                                      | `400` malformed; `403` origin/RP/policy; `409` consumed/duplicate credential; one challenge and credential insert wins    |
| `POST /api/passkeys/authentication/options`         | first-party BFF | signed-out opaque attempt; no claimed account authority                 | optional identifier hint handled enumeration-safely; `200` assertion options and opaque transaction                        | Same public shape for unknown/known; shared attempt limiter; short expiry; no credential-owner list                       |
| `POST /api/passkeys/authentication/verify`          | first-party BFF | bound assertion transaction                                             | WebAuthn assertion; `200` opaque authenticated-session transition                                                          | Generic `401`; `409` replay/stale; atomic challenge consumption; signature/counter/owner faults never enumerate           |
| `DELETE /api/passkeys/{credentialId}`               | first-party BFF | owner, recent auth, last-safe-path policy                               | `204` after lifecycle removal                                                                                              | `403` ownership/policy; `404` safe absent; repeated removal idempotent; concurrent removals serialize on Person/version   |
| `POST /api/totp/enrollments`                        | first-party BFF | owner with recent auth and safe fallback                                | empty object; `201` opaque enrollment ID, one-time protected setup URI/manual key                                          | New pending setup replaces prior pending generation; shared limiter; no active-factor mutation yet                        |
| `POST /api/totp/enrollments/{enrollmentId}/confirm` | first-party BFF | same bound owner/session/generation                                     | JSON current-code request; `200` activates TOTP and returns one-time recovery-code set                                     | `400/401` generic invalid; `409` stale/already handled; time-step replay blocked; bounded attempt/skew policy             |
| `POST /api/totp/challenges/{challengeId}/verify`    | first-party BFF | bound signed-in/step-up attempt                                         | JSON current-code request; `204` advances authenticated session evidence                                                   | Generic `401`; `409` replay/stale; shared attempt/rate state; exactly one accepted time step                              |
| `DELETE /api/totp`                                  | first-party BFF | owner, recent auth, last-safe-path policy                               | `204` lifecycle-disables factor and rotates affected session                                                               | `403` last path; repeated disable idempotent; concurrent method removals serialize                                        |
| `POST /api/recovery-codes/regenerate`               | first-party BFF | owner, recent auth, active eligible factor                              | empty object; `200` one-time plaintext codes and opaque generation                                                         | One transaction replaces prior generation; concurrent request has one winner; response is `no-store` and never replayable |
| `POST /api/recovery-codes/verify`                   | first-party BFF | bound fallback/step-up attempt                                          | JSON recovery-code request; `204` consumes once and advances session evidence                                              | Generic `401`; atomic verifier consumption; duplicate/cross-instance use denied; shared limiter                           |

WebAuthn creation/assertion options and responses use W3C field names and base64url without padding for
binary JSON members. Unknown members are ignored only where the verified library/spec allows; missing
required fields and wrong type/challenge/origin/RP/signature fail closed. Mutation responses carry no
cacheable secret except the deliberately one-time TOTP/recovery setup display.

### ADD — web page and BFF routes

| Method and exact route                          | Caller                         | Contract                                                                                        |
| ----------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `GET /sign-in/passkey`                          | browser                        | Explain platform action/fallback; start only after user action; never auto-loop a native prompt |
| `GET /account/security/passkeys/add`            | authenticated browser          | Focused add/cancel/success/unsupported states and label entry                                   |
| `GET /account/security/totp/setup`              | authenticated/recent browser   | QR plus manual/copy alternative, confirmation, invalid/expired, and cancel states               |
| `GET /challenge/mfa`                            | bound browser session          | TOTP and recovery alternatives required by current step-up transaction                          |
| `GET /account/security/recovery-codes`          | authenticated/recent browser   | One-time display/copy/download/confirm/regenerate flow; revisits show status only               |
| `POST /api/bff/passkeys/registration-options`   | same-origin browser UI         | Opaque session/CSRF plus size/type validation; maps only to backend registration options        |
| `POST /api/bff/passkeys/registration-verify`    | same-origin browser UI         | Validates creation response and maps only to backend registration verification                  |
| `POST /api/bff/passkeys/authentication-options` | same-origin browser UI         | Enumeration-safe request maps only to backend assertion options                                 |
| `POST /api/bff/passkeys/authentication-verify`  | same-origin browser UI         | Validates assertion response and maps only to backend assertion verification                    |
| `POST /api/bff/passkeys/remove`                 | same-origin authenticated UI   | Requires recent auth and opaque credential ID; maps only to backend removal                     |
| `POST /api/bff/totp/start`                      | same-origin authenticated UI   | Starts one pending setup; seed never enters RSC/logs                                            |
| `POST /api/bff/totp/confirm`                    | same-origin authenticated UI   | Confirms bound enrollment with submitted code; no code logging                                  |
| `POST /api/bff/totp/verify`                     | same-origin bound challenge UI | Verifies one current challenge code and advances safe session state                             |
| `POST /api/bff/totp/disable`                    | same-origin authenticated UI   | Requires recent auth and last-path approval; maps only to backend disable                       |
| `POST /api/bff/recovery-codes/regenerate`       | same-origin authenticated UI   | Requires recent auth; one-time plaintext response bypasses cache/RSC/history                    |
| `POST /api/bff/recovery-codes/verify`           | same-origin bound challenge UI | Maps only the submitted code to atomic backend verification; clears UI state after response     |

Each BFF command accepts only the corresponding backend request fields shown above plus opaque UI
references; server-bound session/correlation data is injected, never accepted from the browser. It
preserves safe success/status semantics and maps dependency/timeout/malformed-response failures to
app-scoped problems without forwarding backend internals. It does not automatically retry a ceremony
or one-time mutation. Backend idempotency, optimistic concurrency, atomic consumption, and shared rate
limits remain authoritative; duplicate browser submission is disabled and still safe if raced.

### UPDATE — existing application and protocol behavior

| Method and exact path    | Change                                                                                                 | Compatibility and error behavior                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET /account/security`  | Existing page adds eligible passkey, TOTP, and recovery method cards plus recent-auth/last-path states | Email/password/session content remains; no enrolled method is implied; unsupported browser gets explicit fallback             |
| `GET /sign-in`           | Show passkey only when delivered runtime/browser eligibility permits; email remains available          | Google/Facebook and ineligible factors remain absent; failure/cancel returns stable email path                                |
| `GET /connect/authorize` | Continue a bound authorization through required step-up before context/consent                         | Existing non-step-up clients/flows remain unchanged; insufficient factor returns to challenge, not a misleading consent/error |
| `POST /connect/token`    | ID-token/session evidence may include allowlisted `amr` and `auth_time` derived from completed factors | Exact issuer/audience/scopes/context remain; omit unsupported `acr`; no credential/factor inventory claim                     |

The token endpoint request/response media type and grant remain unchanged. This is an authentication-
evidence extension, not a new grant, token type, scope, or resource audience.

### DELETE

None. Email/password/recovery-link sign-in, existing sessions, context, consent, callbacks, protocol
endpoints, scopes, and claims remain unless the explicit UPDATE rows narrow their display/evidence.

### RETAIN

Retain the three indexed email fallback BFF operations with their accepted enumeration defenses and
session/token custody. Discovery, JWKS, revocation, logout, LMS registration/audience/scopes, PKCE S256,
personal/company discrimination, process statelessness, and provider absence remain invariants but are
not neighboring operation deltas.

## Detailed operation packets

These packets are normative. All JSON requests require `Content-Type: application/json`, reject
unknown members unless the verified WebAuthn decoder requires otherwise, enforce size limits, and use
`Cache-Control: no-store`. Authenticated mutations also require the opaque protected session, exact
origin, CSRF, and recent authentication. Common stable problems are `invalid_request` (`400`, with
safe field errors), `session_required` (`401`), `csrf_invalid`/`recent_auth_required` (`403`),
`rate_limited` (`429` plus `Retry-After`), and `dependency_unavailable` (`503`). Packets list additional
codes. No operation paginates in this release; no ceremony or one-time mutation is automatically
retried. Logs contain route, stable result code, timing bucket, and correlation only—never challenge,
credential response, seed, TOTP, recovery code, cookie, token, Person/company ID, or PII. Backend ADD
operations enter `specs/apps/ose/id-be/contracts/openapi.yaml` and generated BFF code; page routes do
not, while every BFF HTTP operation enters `specs/apps/ose/id-web/contracts/openapi.yaml`. A packet's
**Exact Gherkin proof** must link the companion document's exact titled scenario heading, name the
canonical `specs/apps/ose/id-{be,web}/behaviours/**` destination, and state its Unit/Integration/E2E
mapping; a generic adapter-map pointer is insufficient. No exemption applies in this plan.

### Operation 06 security methods

- **Operation/action:** `GET /api/account/security-methods` — `ADD`.

- **Caller/auth/context/request:** first-party BFF for authenticated Person owner, never company
  context; `Accept: application/json`, no params/body.
- **Success:** `200`; the response uses opaque identifiers and contains no secrets. Example:

  ```json
  {
    "passkeys": [
      {
        "credentialId": "pk_01",
        "label": "Work laptop",
        "status": "active",
        "createdAt": "2026-09-15T08:00:00Z"
      }
    ],
    "totp": {
      "status": "active"
    },
    "recovery": {
      "available": true
    },
    "recentAuthRequired": false
  }
  ```

- **Errors/traffic/privacy:** common `401/503`; idempotent read, concurrent changes reflected on reload,
  account limit. No caching; public credential IDs are browser-safe opaque references but not logged.
  Add to OpenAPI/codegen; additive rollback leaves methods intact.
- **Exact Gherkin proof:** [`ID06-METHOD-001` — “A user cannot remove the final safe access path”](./005-bdd-spec-delta-and-adapter-map.md#final-access-path--id06-method-001)
  → `specs/apps/ose/id-web/behaviours/account-security/method-removal.feature`; and
  [`ID05-METHOD-001` UPDATE — “Only delivered and eligible sign-in methods are shown”](./005-bdd-spec-delta-and-adapter-map.md#available-methods--id05-method-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`; Unit, Integration, and E2E
  required for each, no exemption.

### Operation 06 passkey registration options

- **Operation/action:** `POST /api/passkeys/registration/options` — `ADD`.

- **Caller/auth/context/request:** owner with recent auth and another safe path; JSON has an optional
  label within the repository limit. Example:

  ```json
  {
    "label": "Work laptop"
  }
  ```

- **Success:** `200`; WebAuthn creation-options schema plus opaque `transactionId`, including RP,
  challenge, user handle, algorithms, timeout, attestation policy, and exclusions; binary is unpadded
  base64url. Example challenge is synthetic:

  ```json
  {
    "transactionId": "passkey_registration_opaque",
    "publicKey": {
      "rp": { "id": "127.0.0.1", "name": "OSE ID" },
      "user": {
        "id": "c3ludGhldGljX3VzZXI",
        "name": "person.personal@example.test",
        "displayName": "Example Person"
      },
      "challenge": "c3ludGhldGljX2NoYWxsZW5nZQ",
      "pubKeyCredParams": [{ "type": "public-key", "alg": -7 }],
      "timeout": 60000,
      "attestation": "none",
      "excludeCredentials": []
    }
  }
  ```

- **Errors/traffic/privacy:** common plus `safe_path_required` (`403`) and
  `passkey_registration_conflict` (`409`). Each call creates an expiring challenge without mutating
  credentials; concurrent starts coexist per policy; user limiter. Challenge/options never logged.
  OpenAPI/codegen ADD; rollback expires challenge.
- **Exact Gherkin proof:** [`ID06-PASSKEY-001` — “A recently authenticated user adds a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`; and
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003)
  → `specs/apps/ose/id-be/behaviours/passkeys/assertion-validation.feature`; Unit, Integration, and E2E
  are required for each, with no exemption.

### Operation 06 passkey registration verify

- **Operation/action:** `POST /api/passkeys/registration/verify` — `ADD`.

- **Caller/auth/context/request:** same owner/session/registration transaction; synthetic base64url
  values only. Example:

  ```json
  {
    "transactionId": "passkey_registration_opaque",
    "label": "Work laptop",
    "credential": {
      "id": "synthetic_credential_id",
      "rawId": "c3ludGhldGljX2NyZWRlbnRpYWw",
      "type": "public-key",
      "response": {
        "clientDataJSON": "c3ludGhldGljX2NsaWVudF9kYXRh",
        "attestationObject": "c3ludGhldGljX2F0dGVzdGF0aW9u",
        "transports": ["internal"]
      }
    }
  }
  ```

- **Success:** `201`, `Location: /api/passkeys/<opaque>`; safe response example:

  ```json
  {
    "credentialId": "pk_01",
    "label": "Work laptop",
    "status": "active",
    "createdAt": "2026-09-15T08:00:00Z"
  }
  ```

- **Errors/traffic/privacy:** common plus `passkey_verification_failed` (`403`),
  `passkey_challenge_consumed|passkey_credential_exists` (`409`),
  `passkey_challenge_expired` (`410`). Validate type/challenge/origin/RP/attestation/library result and
  owner. Atomic challenge/credential insert: one concurrent winner, replay denied; user limiter. Never
  persist/log raw response. OpenAPI/codegen; rollback retains created credential.
- **Exact Gherkin proof:** [`ID06-PASSKEY-001` — “A recently authenticated user adds a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002),
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003),
  and [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{passkeys,runtime}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 passkey authentication options

- **Operation/action:** `POST /api/passkeys/authentication/options` — `ADD`.

- **Caller/auth/context/request:** signed-out opaque attempt; the optional hint confers no authority.
  Synthetic example:

  ```json
  {
    "identifierHint": "person.personal@example.test"
  }
  ```

- **Success:** `200`; assertion-options schema plus opaque transaction, RP ID, challenge, allowed
  credential policy, timeout, and user-verification requirement; known/unknown inputs share safe shape.
- **Errors/traffic/privacy:** common public variants omit session/recent-auth errors; use
  `authentication_unavailable` (`503`). Each call creates short-lived challenge; no credential mutation;
  concurrent attempts isolated; address/network limiter. Hint/challenge/list never logged and response
  does not enumerate owner. OpenAPI/codegen; rollback expires.
- **Exact Gherkin proof:** [`ID06-PASSKEY-002` — “A user signs in with a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`; and
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003)
  → `specs/apps/ose/id-be/behaviours/passkeys/assertion-validation.feature`; Unit, Integration, and E2E
  are required for each, with no exemption.

### Operation 06 passkey authentication verify

- **Operation/action:** `POST /api/passkeys/authentication/verify` — `ADD`.

- **Caller/auth/context/request:** bound assertion transaction; synthetic base64url values only.
  Example:

  ```json
  {
    "transactionId": "passkey_authentication_opaque",
    "credential": {
      "id": "synthetic_credential_id",
      "rawId": "c3ludGhldGljX2NyZWRlbnRpYWw",
      "type": "public-key",
      "response": {
        "clientDataJSON": "c3ludGhldGljX2NsaWVudF9kYXRh",
        "authenticatorData": "c3ludGhldGljX2F1dGhlbnRpY2F0b3I",
        "signature": "c3ludGhldGljX3NpZ25hdHVyZQ",
        "userHandle": "c3ludGhldGljX3VzZXI"
      }
    }
  }
  ```

- **Success:** `200`; no cookie or token is present in the API body. Example:

  ```json
  {
    "transitionRef": "session_transition_opaque",
    "next": "authorization"
  }
  ```

- **Errors/traffic/privacy:** `invalid_request` (`400`), generic `invalid_credentials` (`401`),
  `passkey_verification_failed` (`403`), `passkey_challenge_consumed|counter_conflict` (`409`),
  `passkey_challenge_expired` (`410`), `rate_limited` (`429`). Validate origin/RP/challenge/signature/
  owner/library counter policy. Atomic consumption/session transition gives one winner; replay denied.
  Never log assertion/user handle. OpenAPI/codegen; rollback cannot undo accepted authentication.
- **Exact Gherkin proof:** [`ID06-PASSKEY-002` — “A user signs in with a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002),
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003),
  and [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{passkeys,runtime}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 passkey delete

- **Operation/action:** `DELETE /api/passkeys/{credentialId}` — `ADD`.

- **Caller/auth/context/request:** owner with recent auth and last-safe-path approval; opaque path ID,
  no body.
- **Success:** `204` empty.
- **Errors/traffic/privacy:** common plus `safe_path_required|passkey_forbidden` (`403`), safe
  `passkey_not_found` (`404`), `security_methods_stale` (`409`). Validate ownership/fresh method set.
  Repeated delete is idempotent; concurrent method removals serialize by Person version; account limit.
  Do not log ID. OpenAPI/codegen; rollback never resurrects lifecycle-removed credential.
- **Exact Gherkin proof:** [`ID06-PASSKEY-001` — “A recently authenticated user adds a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`; and
  [`ID06-METHOD-001` — “A user cannot remove the final safe access path”](./005-bdd-spec-delta-and-adapter-map.md#final-access-path--id06-method-001)
  → `specs/apps/ose/id-web/behaviours/account-security/method-removal.feature`; Unit, Integration, and
  E2E are required for each, with no exemption.

### Operation 06 totp enrollment

- **Operation/action:** `POST /api/totp/enrollments` — `ADD`.

- **Caller/auth/context/request:** owner with recent auth and safe fallback; empty JSON request:

  ```json
  {}
  ```

- **Success:** `201`; the seed is protected pending confirmation. Synthetic one-time example:

  ```json
  {
    "enrollmentId": "totp_enrollment_opaque",
    "otpauthUri": "otpauth://totp/OSE%20ID:person.personal%40example.test?secret=REDACTED&issuer=OSE%20ID",
    "manualKey": "REDACTED",
    "algorithm": "SHA1",
    "digits": 6,
    "period": 30
  }
  ```

- **Errors/traffic/privacy:** common plus `safe_path_required` (`403`), `totp_already_active` (`409`). A
  new pending generation invalidates the prior pending one but not an active factor; concurrent starts
  have one current generation; account limit. Seed never logs/caches and is not returned again.
  OpenAPI/codegen; rollback destroys only unconfirmed pending material.
- **Exact Gherkin proof:** [`ID06-TOTP-001` — “TOTP activates after confirmation”](./005-bdd-spec-delta-and-adapter-map.md#totp-enrollment--id06-totp-001)
  → `specs/apps/ose/id-web/behaviours/mfa/totp-enrollment.feature`; and
  [`ID06-TOTP-002` — “An unconfirmed TOTP secret cannot authenticate”](./005-bdd-spec-delta-and-adapter-map.md#unconfirmed-totp--id06-totp-002)
  → `specs/apps/ose/id-be/behaviours/mfa/totp-enrollment.feature`; Unit, Integration, and E2E are
  required for each, with no exemption.

### Operation 06 totp confirm

- **Operation/action:** `POST /api/totp/enrollments/{enrollmentId}/confirm` — `ADD`.

- **Caller/auth/context/request:** bound owner/session/generation; opaque path ID; JSON requires exactly
  six digits. Synthetic example:

  ```json
  {
    "code": "123456"
  }
  ```

- **Success:** `200`; one-time recovery-code set and generation ID. Synthetic example:

  ```json
  {
    "recoveryCodes": ["SYNTHETIC-RECOVERY-01", "SYNTHETIC-RECOVERY-02"],
    "generationId": "recovery_generation_opaque"
  }
  ```

  Example codes are never accepted as evidence.

- **Errors/traffic/privacy:** common plus `totp_invalid` (`401`),
  `totp_enrollment_stale|totp_step_replayed` (`409`), `totp_enrollment_expired` (`410`). Validate bound
  encrypted seed, skew policy, unused timestep. Atomic activation/generation gives one winner; attempt
  limit. No code/seed/recovery log/cache. OpenAPI/codegen; rollback retains confirmed factor/codes.
- **Exact Gherkin proof:** [`ID06-TOTP-001` — “TOTP activates after confirmation”](./005-bdd-spec-delta-and-adapter-map.md#totp-enrollment--id06-totp-001),
  [`ID06-TOTP-002` — “An unconfirmed TOTP secret cannot authenticate”](./005-bdd-spec-delta-and-adapter-map.md#unconfirmed-totp--id06-totp-002),
  and [`ID06-RECOVERY-001` — “A recovery code works once”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{mfa,recovery}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 totp verify

- **Operation/action:** `POST /api/totp/challenges/{challengeId}/verify` — `ADD`.

- **Caller/auth/context/request:** bound sign-in/step-up challenge; opaque path ID; JSON six-digit code:

  ```json
  {
    "code": "123456"
  }
  ```

- **Success:** `204`; advances server-side authentication evidence only.
- **Errors/traffic/privacy:** common applicable session errors plus generic `totp_invalid` (`401`),
  `totp_challenge_stale|totp_step_replayed` (`409`), `totp_challenge_expired` (`410`). Atomic timestep/
  challenge consumption; one winner; challenge/account/network limits. No code/path logs. OpenAPI/
  codegen; rollback cannot downgrade completed evidence.
- **Exact Gherkin proof:** [`ID06-STEPUP-001` — “A TOTP policy requires a second factor”](./005-bdd-spec-delta-and-adapter-map.md#step-up--id06-stepup-001)
  → `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`; and
  [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → `specs/apps/ose/id-be/behaviours/runtime/authenticator-statelessness.feature`; Unit, Integration,
  and E2E are required for each, with no exemption.

### Operation 06 totp delete

- **Operation/action:** `DELETE /api/totp` — `ADD`.

- **Caller/auth/context/request:** owner with recent auth and last-safe-path approval; no params/body.
- **Success:** `204`; lifecycle-disables TOTP and rotates affected sessions.
- **Errors/traffic/privacy:** common plus `safe_path_required` (`403`), `totp_not_enabled` (`404`),
  `security_methods_stale` (`409`). Repeat converges on disabled state; concurrent removals serialize;
  account limit. No seed/factor detail logs. OpenAPI/codegen; rollback does not reactivate secret.
- **Exact Gherkin proof:** [`ID06-METHOD-001` — “A user cannot remove the final safe access path”](./005-bdd-spec-delta-and-adapter-map.md#final-access-path--id06-method-001)
  → `specs/apps/ose/id-web/behaviours/account-security/method-removal.feature`; and
  [`ID06-STEPUP-001` — “A TOTP policy requires a second factor”](./005-bdd-spec-delta-and-adapter-map.md#step-up--id06-stepup-001)
  → `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`; Unit, Integration, and E2E are required for
  each, with no exemption.

### Operation 06 recovery regenerate

- **Operation/action:** `POST /api/recovery-codes/regenerate` — `ADD`.

- **Caller/auth/context/request:** owner with recent auth and eligible active factor; empty JSON request:

  ```json
  {}
  ```

- **Success:** `200`, `no-store`; response is never repeatable. Synthetic example:

  ```json
  {
    "generationId": "recovery_generation_opaque",
    "recoveryCodes": ["SYNTHETIC-RECOVERY-01", "SYNTHETIC-RECOVERY-02"]
  }
  ```

- **Errors/traffic/privacy:** common plus `recovery_not_eligible` (`403`),
  `recovery_generation_conflict` (`409`). One concurrent generation wins and invalidates prior verifier
  generation atomically; account limit. Plaintext never persists/logs/caches. OpenAPI/codegen; rollback
  retains newest valid hashed generation.
- **Exact Gherkin proof:** [`ID06-RECOVERY-001` — “A recovery code works once” and
  `ID06-RECOVERY-002` — “Regeneration invalidates the old set”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002)
  → `specs/apps/ose/id-be/behaviours/recovery/recovery-codes.feature`; Unit, Integration, and E2E are
  required for each, with no exemption.

### Operation 06 recovery verify

- **Operation/action:** `POST /api/recovery-codes/verify` — `ADD`.

- **Caller/auth/context/request:** bound fallback/step-up attempt; JSON requires one code within the
  repository limit. Synthetic example:

  ```json
  {
    "code": "SYNTHETIC-RECOVERY-01"
  }
  ```

- **Success:** `204`; atomically advances server-side authentication evidence.
- **Errors/traffic/privacy:** `invalid_request` (`400`), generic `recovery_code_invalid` (`401`),
  `recovery_code_replayed|challenge_stale` (`409`), `rate_limited` (`429`). Atomic verifier consumption
  gives one success across instances; attempt/network limits. Never log/cache code. OpenAPI/codegen;
  rollback cannot restore consumed verifier.
- **Exact Gherkin proof:** [`ID06-RECOVERY-001` — “A recovery code works once”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002)
  → `specs/apps/ose/id-be/behaviours/recovery/recovery-codes.feature`; and
  [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → `specs/apps/ose/id-be/behaviours/runtime/authenticator-statelessness.feature`; Unit, Integration,
  and E2E are required for each, with no exemption.

### Operation 06 passkey page

- **Operation/action:** `GET /sign-in/passkey` — `ADD`.

  ```http
  GET /sign-in/passkey HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque-attempt>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Sign in with a passkey</h1>
    <button type="button">Continue with a passkey</button>
    <a href="/sign-in">Use email instead</a>
    <p role="status" aria-live="polite"></p>
  </main>
  ```

- **Caller/auth/context/request:** public browser bound to opaque sign-in attempt; `Accept: text/html`,
  no body or company context.
- **Success:** `200 text/html`; no native prompt starts before explicit activation. Example render
  model:

  ```json
  {
    "state": "ready",
    "startLabel": "Continue with a passkey",
    "emailFallbackHref": "/sign-in"
  }
  ```

- **Errors/traffic/privacy:** safe `attempt_stale` (`409`) and `authentication_unavailable` (`503`)
  become recoverable UI; read idempotent, concurrent tabs isolated, network limit. Never cache/log
  credential hints. Outside OpenAPI/codegen; rollback removes page and retains email.
- **Exact Gherkin proof:** [`ID06-PASSKEY-002` — “A user signs in with a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`;
  [`ID06-A11Y-001` — “Account hardening has an accessible fallback”](./005-bdd-spec-delta-and-adapter-map.md#accessible-fallback--id06-a11y-001)
  → `specs/apps/ose/id-web/behaviours/accessibility/account-hardening.feature`; and
  [`ID05-METHOD-001` UPDATE — “Only delivered and eligible sign-in methods are shown”](./005-bdd-spec-delta-and-adapter-map.md#available-methods--id05-method-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`; Unit, Integration, and E2E
  required for each, no exemption.

### Operation 06 passkey add page

- **Operation/action:** `GET /account/security/passkeys/add` — `ADD`.

  ```http
  GET /account/security/passkeys/add HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Add a passkey</h1>
    <label for="passkey-label">Passkey name</label>
    <input id="passkey-label" name="label" autocomplete="off" />
    <button type="button">Create passkey</button>
    <a href="/account/security">Cancel</a>
  </main>
  ```

- **Caller/auth/context/request:** authenticated/recent Person owner with safe fallback; no query/body.
- **Success:** `200 text/html`; example render model:

  ```json
  {
    "state": "ready",
    "label": "",
    "cancelHref": "/account/security"
  }
  ```

- **Errors/traffic/privacy:** `session_required` (`401`), `recent_auth_required|safe_path_required`
  (`403`), `dependency_unavailable` (`503`); idempotent page read, method version refresh, account limit.
  No credential/challenge cache/log. Outside OpenAPI; rollback removes page.
- **Exact Gherkin proof:** [`ID06-PASSKEY-001` — “A recently authenticated user adds a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002),
  [`ID06-METHOD-001` — “A user cannot remove the final safe access path”](./005-bdd-spec-delta-and-adapter-map.md#final-access-path--id06-method-001),
  and [`ID06-A11Y-001` — “Account hardening has an accessible fallback”](./005-bdd-spec-delta-and-adapter-map.md#accessible-fallback--id06-a11y-001)
  → their exact indexed `specs/apps/ose/id-web/behaviours/{passkeys,account-security,accessibility}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 totp page

- **Operation/action:** `GET /account/security/totp/setup` — `ADD`.

  ```http
  GET /account/security/totp/setup HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Set up an authenticator app</h1>
    <img src="<protected-one-time-qr>" alt="Scan this QR code with an authenticator app" />
    <button type="button">Copy manual key</button>
    <label for="totp-code">Authentication code</label>
    <input id="totp-code" name="code" inputmode="numeric" autocomplete="one-time-code" />
  </main>
  ```

- **Caller/auth/context/request:** authenticated/recent owner with safe fallback; optional opaque pending
  enrollment resolved server-side; no body.
- **Success:** `200 text/html`; the actual seed is delivered only in protected one-time response
  state, not RSC persistence. Example render model:

  ```json
  {
    "state": "ready",
    "qrImageDescription": "Scan this QR code with an authenticator app",
    "manualKeyMasked": "•••• •••• •••• ••••",
    "code": ""
  }
  ```

- **Errors/traffic/privacy:** `recent_auth_required|safe_path_required` (`403`),
  `enrollment_stale` (`409`), `enrollment_expired` (`410`), `dependency_unavailable` (`503`). Read is
  safe; one pending generation authoritative; account limit. Seed/code never cache/log/screenshot.
  Outside OpenAPI; rollback destroys pending setup.
- **Exact Gherkin proof:** [`ID06-TOTP-001` — “TOTP activates after confirmation”](./005-bdd-spec-delta-and-adapter-map.md#totp-enrollment--id06-totp-001),
  [`ID06-TOTP-002` — “An unconfirmed TOTP secret cannot authenticate”](./005-bdd-spec-delta-and-adapter-map.md#unconfirmed-totp--id06-totp-002),
  and [`ID06-A11Y-001` — “Account hardening has an accessible fallback”](./005-bdd-spec-delta-and-adapter-map.md#accessible-fallback--id06-a11y-001)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{mfa,accessibility}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 mfa page

- **Operation/action:** `GET /challenge/mfa` — `ADD`.

  ```http
  GET /challenge/mfa HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque-challenge>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Verify it is you</h1>
    <label for="mfa-code">Authenticator code</label>
    <input id="mfa-code" name="code" inputmode="numeric" autocomplete="one-time-code" />
    <button type="submit">Verify</button>
    <button type="button">Use a recovery code</button>
  </main>
  ```

- **Caller/auth/context/request:** browser bound to authenticated sign-in/step-up transaction; no
  caller-selected factor/context/body.
- **Success:** `200 text/html`; the render model comes from backend eligibility. Example:

  ```json
  {
    "methods": ["totp", "recovery"],
    "selected": "totp",
    "state": "ready",
    "code": ""
  }
  ```

- **Errors/traffic/privacy:** `session_required` (`401`), `challenge_stale` (`409`),
  `challenge_expired` (`410`), `dependency_unavailable` (`503`); idempotent read, concurrent success
  redirects stale tab safely, attempt limit. No code/challenge cache/log. Outside OpenAPI; rollback
  returns to email recovery policy.
- **Exact Gherkin proof:** [`ID06-STEPUP-001` — “A TOTP policy requires a second factor”](./005-bdd-spec-delta-and-adapter-map.md#step-up--id06-stepup-001),
  [`ID06-RECOVERY-001` — “A recovery code works once”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002),
  and [`ID06-A11Y-001` — “Account hardening has an accessible fallback”](./005-bdd-spec-delta-and-adapter-map.md#accessible-fallback--id06-a11y-001)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{mfa,recovery,accessibility}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 recovery page

- **Operation/action:** `GET /account/security/recovery-codes` — `ADD`.

  ```http
  GET /account/security/recovery-codes HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Recovery codes</h1>
    <p>Your current recovery-code set is available.</p>
    <button type="button">Generate new recovery codes</button>
    <p role="status" aria-live="polite"></p>
  </main>
  ```

- **Caller/auth/context/request:** authenticated/recent owner; no query/body.
- **Success:** `200 text/html`; ordinary revisits use a status-only render model:

  ```json
  {
    "available": true,
    "actions": ["regenerate"]
  }
  ```

  Immediately after generation, the protected one-time render may instead contain:

  ```json
  {
    "codes": ["SYNTHETIC-RECOVERY-01", "SYNTHETIC-RECOVERY-02"],
    "actions": ["copy", "download", "confirm"]
  }
  ```

- **Errors/traffic/privacy:** `recent_auth_required|recovery_not_eligible` (`403`),
  `generation_stale` (`409`), `dependency_unavailable` (`503`); revisits never replay codes; concurrent
  generation has one winner; account limit. Codes excluded from RSC cache/history/log/screenshot.
  Outside OpenAPI; rollback preserves current hashed generation.
- **Exact Gherkin proof:** [`ID06-RECOVERY-001` — “A recovery code works once” and
  `ID06-RECOVERY-002` — “Regeneration invalidates the old set”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002),
  and [`ID06-A11Y-001` — “Account hardening has an accessible fallback”](./005-bdd-spec-delta-and-adapter-map.md#accessible-fallback--id06-a11y-001)
  → their exact indexed `specs/apps/ose/id-{be,web}/behaviours/{recovery,accessibility}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 bff passkey registration options

- **Operation/action:** `POST /api/bff/passkeys/registration-options` — `ADD`.

- **Caller/request/success:** same-origin authenticated/recent UI. Example request:

  ```json
  {
    "label": "Work laptop"
  }
  ```

  A `200` response passes validated creation options plus an opaque transaction:

  ```json
  {
    "transactionId": "passkey_registration_opaque",
    "publicKey": {
      "rp": { "id": "127.0.0.1", "name": "OSE ID" },
      "user": {
        "id": "c3ludGhldGljX3VzZXI",
        "name": "person.personal@example.test",
        "displayName": "Example Person"
      },
      "challenge": "c3ludGhldGljX2NoYWxsZW5nZQ",
      "pubKeyCredParams": [{ "type": "public-key", "alg": -7 }],
      "timeout": 60000,
      "attestation": "none",
      "excludeCredentials": []
    }
  }
  ```

- **Errors/traffic:** common plus `safe_path_required` (`403`), `registration_conflict` (`409`);
  duplicate click disabled but each accepted call creates a new expiring challenge; account limit.
- **Privacy/publication/rollback:** never cache/log options/challenge; add to id-web OpenAPI and map
  only to the generated backend operation. Rollback expires transaction.
- **Exact Gherkin proof:** [`ID06-PASSKEY-001` — “A recently authenticated user adds a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`; and
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003)
  → `specs/apps/ose/id-be/behaviours/passkeys/assertion-validation.feature`; Unit, Integration, and E2E
  are required for each, with no exemption.

### Operation 06 bff passkey registration verify

- **Operation/action:** `POST /api/bff/passkeys/registration-verify` — `ADD`.

- **Caller/request/success:** bound same-origin UI; the JSON creation credential, opaque transaction,
  and label match the backend schema. Exact synthetic request:

  ```json
  {
    "transactionId": "passkey_registration_opaque",
    "label": "Work laptop",
    "credential": {
      "id": "synthetic_credential_id",
      "rawId": "c3ludGhldGljX2NyZWRlbnRpYWw",
      "type": "public-key",
      "response": {
        "clientDataJSON": "c3ludGhldGljX2NsaWVudF9kYXRh",
        "attestationObject": "c3ludGhldGljX2F0dGVzdGF0aW9u",
        "transports": ["internal"]
      }
    }
  }
  ```

  Safe `201` response example:

  ```json
  {
    "credentialId": "pk_01",
    "label": "Work laptop",
    "status": "active",
    "createdAt": "2026-09-15T08:00:00Z"
  }
  ```

- **Errors/traffic:** common plus `passkey_verification_failed` (`403`),
  `challenge_consumed|credential_exists` (`409`), `challenge_expired` (`410`); no retry; one winner.
- **Privacy/publication/rollback:** raw credential never RSC/log/cache; add to id-web OpenAPI with exact
  generated backend mapping. Rollback retains created method.
- **Exact Gherkin proof:** [`ID06-PASSKEY-001` — “A recently authenticated user adds a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002),
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003),
  and [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{passkeys,runtime}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 bff passkey authentication options

- **Operation/action:** `POST /api/bff/passkeys/authentication-options` — `ADD`.

- **Caller/request/success:** same-origin public sign-in UI. Example request:

  ```json
  {
    "identifierHint": "person.personal@example.test"
  }
  ```

  A `200` response returns validated enumeration-safe assertion options plus an opaque transaction:

  ```json
  {
    "transactionId": "passkey_authentication_opaque",
    "publicKey": {
      "challenge": "c3ludGhldGljX2NoYWxsZW5nZQ",
      "rpId": "127.0.0.1",
      "allowCredentials": [],
      "timeout": 60000,
      "userVerification": "required"
    }
  }
  ```

- **Errors/traffic:** `invalid_request` (`400`), `csrf_invalid` (`403`), `rate_limited` (`429`),
  `authentication_unavailable` (`503`); no automatic retry, isolated concurrent attempts.
- **Privacy/publication/rollback:** hint/credential list/challenge not cached/logged; add to id-web
  OpenAPI with generated backend mapping. Rollback expires.
- **Exact Gherkin proof:** [`ID06-PASSKEY-002` — “A user signs in with a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`; and
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003)
  → `specs/apps/ose/id-be/behaviours/passkeys/assertion-validation.feature`; Unit, Integration, and E2E
  are required for each, with no exemption.

### Operation 06 bff passkey authentication verify

- **Operation/action:** `POST /api/bff/passkeys/authentication-verify` — `ADD`.

- **Caller/request/success:** bound same-origin attempt; the JSON assertion credential and transaction
  match the backend schema. Exact synthetic request:

  ```json
  {
    "transactionId": "passkey_authentication_opaque",
    "credential": {
      "id": "synthetic_credential_id",
      "rawId": "c3ludGhldGljX2NyZWRlbnRpYWw",
      "type": "public-key",
      "response": {
        "clientDataJSON": "c3ludGhldGljX2NsaWVudF9kYXRh",
        "authenticatorData": "c3ludGhldGljX2F1dGhlbnRpY2F0b3I",
        "signature": "c3ludGhldGljX3NpZ25hdHVyZQ",
        "userHandle": "c3ludGhldGljX3VzZXI"
      }
    }
  }
  ```

  A `200` response rotates the protected cookie and returns no token. Example:

  ```json
  {
    "next": "authorization",
    "location": "/authorize/context"
  }
  ```

- **Errors/traffic:** `invalid_request` (`400`), generic `invalid_credentials` (`401`),
  `passkey_verification_failed` (`403`), `challenge_consumed|counter_conflict` (`409`),
  `challenge_expired` (`410`), `rate_limited` (`429`); one winner, replay denied.
- **Privacy/publication/rollback:** assertion/session not cached/logged; add to id-web OpenAPI and
  generated backend mapping. Rollback cannot undo accepted evidence.
- **Exact Gherkin proof:** [`ID06-PASSKEY-002` — “A user signs in with a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002),
  [`ID06-PASSKEY-003` — “A passkey assertion fails closed”](./005-bdd-spec-delta-and-adapter-map.md#passkey-validation--id06-passkey-003),
  and [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{passkeys,runtime}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 bff passkey remove

- **Operation/action:** `POST /api/bff/passkeys/remove` — `ADD`.

- **Caller/request/success:** authenticated/recent owner. Example request:

  ```json
  {
    "credentialId": "pk_01"
  }
  ```

  Success is an empty `204` response.

- **Errors/traffic:** common plus `safe_path_required|passkey_forbidden` (`403`),
  `passkey_not_found` (`404`), `security_methods_stale` (`409`); idempotent, removals serialize.
- **Privacy/publication/rollback:** opaque ID not logged/cached; add to id-web OpenAPI and map to the
  generated backend DELETE. Rollback never resurrects.
- **Exact Gherkin proof:** [`ID06-PASSKEY-001` — “A recently authenticated user adds a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`; and
  [`ID06-METHOD-001` — “A user cannot remove the final safe access path”](./005-bdd-spec-delta-and-adapter-map.md#final-access-path--id06-method-001)
  → `specs/apps/ose/id-web/behaviours/account-security/method-removal.feature`; Unit, Integration, and
  E2E are required for each, with no exemption.

### Operation 06 bff totp start

- **Operation/action:** `POST /api/bff/totp/start` — `ADD`.

- **Caller/request/success:** authenticated/recent owner with fallback; the request is:

  ```json
  {}
  ```

  Success `201` returns opaque enrollment plus one-time setup URI/manual key validated from backend:

  ```json
  {
    "enrollmentId": "totp_enrollment_opaque",
    "setupUri": "otpauth://totp/OSE%20ID:example?secret=SYNTHETIC&issuer=OSE%20ID",
    "manualKey": "SYNTHETIC-EXAMPLE-KEY",
    "expiresAt": "2026-09-15T08:10:00Z"
  }
  ```

- **Errors/traffic:** common plus `safe_path_required` (`403`), `totp_already_active` (`409`); one current
  pending generation, concurrent starts resolve by backend version.
- **Privacy/publication/rollback:** seed never enters RSC, logs, or caches; add to id-web OpenAPI and the
  generated backend mapping. Rollback destroys pending state.
- **Exact Gherkin proof:** [`ID06-TOTP-001` — “TOTP activates after confirmation”](./005-bdd-spec-delta-and-adapter-map.md#totp-enrollment--id06-totp-001)
  → `specs/apps/ose/id-web/behaviours/mfa/totp-enrollment.feature`; and
  [`ID06-TOTP-002` — “An unconfirmed TOTP secret cannot authenticate”](./005-bdd-spec-delta-and-adapter-map.md#unconfirmed-totp--id06-totp-002)
  → `specs/apps/ose/id-be/behaviours/mfa/totp-enrollment.feature`; Unit, Integration, and E2E are
  required for each, with no exemption.

### Operation 06 bff totp confirm

- **Operation/action:** `POST /api/bff/totp/confirm` — `ADD`.

- **Caller/request/success:** bound owner. Example request:

  ```json
  {
    "enrollmentId": "totp_enrollment_opaque",
    "code": "123456"
  }
  ```

  Protected one-time `200` response example:

  ```json
  {
    "generationId": "recovery_generation_opaque",
    "recoveryCodes": ["SYNTHETIC-RECOVERY-01", "SYNTHETIC-RECOVERY-02"]
  }
  ```

- **Errors/traffic:** common plus `totp_invalid` (`401`), `enrollment_stale|step_replayed` (`409`),
  `enrollment_expired` (`410`); no retry; one activation winner; attempt limit.
- **Privacy/publication/rollback:** seed, TOTP, and codes never enter logs, caches, or RSC; add to id-web
  OpenAPI and the generated backend mapping. Rollback retains the confirmed method.
- **Exact Gherkin proof:** [`ID06-TOTP-001` — “TOTP activates after confirmation”](./005-bdd-spec-delta-and-adapter-map.md#totp-enrollment--id06-totp-001),
  [`ID06-TOTP-002` — “An unconfirmed TOTP secret cannot authenticate”](./005-bdd-spec-delta-and-adapter-map.md#unconfirmed-totp--id06-totp-002),
  and [`ID06-RECOVERY-001` — “A recovery code works once”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002)
  → their exact indexed `specs/apps/ose/id-{web,be}/behaviours/{mfa,recovery}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 bff totp verify

- **Operation/action:** `POST /api/bff/totp/verify` — `ADD`.

- **Caller/request/success:** bound challenge UI. Example request:

  ```json
  {
    "challengeId": "totp_challenge_opaque",
    "code": "123456"
  }
  ```

  Success is `204` with safe continuation state.

- **Errors/traffic:** common plus `totp_invalid` (`401`), `challenge_stale|step_replayed` (`409`),
  `challenge_expired` (`410`); one winner, replay denied, attempt limit.
- **Privacy/publication/rollback:** challenge/code not cached or logged; add to id-web OpenAPI and the
  generated backend mapping. Rollback cannot downgrade accepted evidence.
- **Exact Gherkin proof:** [`ID06-STEPUP-001` — “A TOTP policy requires a second factor”](./005-bdd-spec-delta-and-adapter-map.md#step-up--id06-stepup-001)
  → `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`; and
  [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → `specs/apps/ose/id-be/behaviours/runtime/authenticator-statelessness.feature`; Unit, Integration,
  and E2E are required for each, with no exemption.

### Operation 06 bff totp disable

- **Operation/action:** `POST /api/bff/totp/disable` — `ADD`.

- **Caller/request/success:** authenticated/recent owner; the request is:

  ```json
  {}
  ```

  Success is `204`; the affected cookie/session rotates when required.

- **Errors/traffic:** common plus `safe_path_required` (`403`), `totp_not_enabled` (`404`),
  `security_methods_stale` (`409`); idempotent convergence, method removals serialize.
- **Privacy/publication/rollback:** no factor detail enters logs or caches; add to id-web OpenAPI and map
  to the generated backend DELETE. Rollback never reactivates the factor.
- **Exact Gherkin proof:** [`ID06-METHOD-001` — “A user cannot remove the final safe access path”](./005-bdd-spec-delta-and-adapter-map.md#final-access-path--id06-method-001)
  → `specs/apps/ose/id-web/behaviours/account-security/method-removal.feature`; and
  [`ID06-STEPUP-001` — “A TOTP policy requires a second factor”](./005-bdd-spec-delta-and-adapter-map.md#step-up--id06-stepup-001)
  → `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`; Unit, Integration, and E2E are required for
  each, with no exemption.

### Operation 06 bff recovery regenerate

- **Operation/action:** `POST /api/bff/recovery-codes/regenerate` — `ADD`.

- **Caller/request/success:** authenticated/recent eligible owner; the request is:

  ```json
  {}
  ```

  Success is `200` with a one-time generation ID and recovery-code array:

  ```json
  {
    "generationId": "recovery_generation_opaque",
    "recoveryCodes": ["SYNTHETIC-RECOVERY-01", "SYNTHETIC-RECOVERY-02"]
  }
  ```

- **Errors/traffic:** common plus `recovery_not_eligible` (`403`), `generation_conflict` (`409`); no
  retry; one concurrent generation wins and invalidates older hashes.
- **Privacy/publication/rollback:** plaintext never enters RSC, logs, cache, or history; add to id-web
  OpenAPI and the generated backend mapping. Rollback retains the newest hashes.
- **Exact Gherkin proof:** [`ID06-RECOVERY-001` — “A recovery code works once” and
  `ID06-RECOVERY-002` — “Regeneration invalidates the old set”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002)
  → `specs/apps/ose/id-be/behaviours/recovery/recovery-codes.feature`; Unit, Integration, and E2E are
  required for each, with no exemption.

### Operation 06 bff recovery verify

- **Operation/action:** `POST /api/bff/recovery-codes/verify` — `ADD`.

- **Caller/request/success:** bound fallback UI; JSON request:

  ```json
  {
    "code": "SYNTHETIC-RECOVERY-01"
  }
  ```

  Success is `204` with safe continuation state.

- **Errors/traffic:** `invalid_request` (`400`), `recovery_code_invalid` (`401`), `csrf_invalid` (`403`),
  `recovery_code_replayed|challenge_stale` (`409`), `rate_limited` (`429`),
  `dependency_unavailable` (`503`); one success across instances.
- **Privacy/publication/rollback:** code never enters logs, cache, or RSC; add to id-web OpenAPI and the
  generated backend mapping. Rollback cannot restore a consumed verifier.
- **Exact Gherkin proof:** [`ID06-RECOVERY-001` — “A recovery code works once”](./005-bdd-spec-delta-and-adapter-map.md#recovery-codes--id06-recovery-001-and-id06-recovery-002)
  → `specs/apps/ose/id-be/behaviours/recovery/recovery-codes.feature`; and
  [`ID06-STATE-001` — “Another instance completes an authenticator ceremony”](./005-bdd-spec-delta-and-adapter-map.md#stateless-authenticator-challenge--id06-state-001)
  → `specs/apps/ose/id-be/behaviours/runtime/authenticator-statelessness.feature`; Unit, Integration,
  and E2E are required for each, with no exemption.

### Operation 06 security page update

- **Operation/action:** `GET /account/security` — `UPDATE`.

  ```http
  GET /account/security HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Account security</h1>
    <section>
      <h2>Passkeys</h2>
      <a href="/account/security/passkeys/add">Add passkey</a>
    </section>
    <section>
      <h2>Authenticator app</h2>
      <a href="/account/security/totp/setup">Set up</a>
    </section>
    <section>
      <h2>Recovery codes</h2>
      <a href="/account/security/recovery-codes">Review</a>
    </section>
  </main>
  ```

- **Contract:** same authenticated Person caller, headers, status, cache, errors, limits, and rollback as
  predecessor page; response render model additively gains eligible method cards and recent-auth/last-
  path states. When eligibility is true, the render model may add:

  ```json
  {
    "methods": ["passkey", "totp", "recovery"]
  }
  ```

  There is no request change, pagination, secret, provider, or company data. Outside OpenAPI/codegen.
  Rollback hides new cards while preserving methods.

- **Exact Gherkin proof:** [`ID06-METHOD-001` — “A user cannot remove the final safe access path”](./005-bdd-spec-delta-and-adapter-map.md#final-access-path--id06-method-001),
  [`ID06-A11Y-001` — “Account hardening has an accessible fallback”](./005-bdd-spec-delta-and-adapter-map.md#accessible-fallback--id06-a11y-001),
  and [`ID05-METHOD-001` UPDATE — “Only delivered and eligible sign-in methods are shown”](./005-bdd-spec-delta-and-adapter-map.md#available-methods--id05-method-001)
  → their exact indexed `specs/apps/ose/id-web/behaviours/{account-security,accessibility,sign-in}/**/*.feature`
  destinations; Unit, Integration, and E2E are required for each, with no exemption.

### Operation 06 sign in update

- **Operation/action:** `GET /sign-in` — `UPDATE`.

  ```http
  GET /sign-in HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Sign in to continue</h1>
    <a href="/sign-in/passkey">Continue with a passkey</a>
    <form method="post" action="/api/bff/sign-in/identify">
      <label for="email">Email</label><input id="email" name="email" type="email" />
      <button type="submit">Continue with email</button>
    </form>
  </main>
  ```

- **Contract:** predecessor public request/status/errors/privacy remain; render model additively offers
  passkey only when runtime/browser eligibility is true and always retains email. Example:

  ```json
  {
    "methods": ["passkey", "email"]
  }
  ```

  Cancel or failure returns to email. The read is idempotent, has no pagination, uses the network
  limit, and does not enumerate, log, or cache account details. Outside OpenAPI. Rollback hides passkey.

- **Exact Gherkin proof:** [`ID05-METHOD-001` UPDATE — “Only delivered and eligible sign-in methods are
  shown”](./005-bdd-spec-delta-and-adapter-map.md#available-methods--id05-method-001) →
  `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`; and
  [`ID06-PASSKEY-002` — “A user signs in with a passkey”](./005-bdd-spec-delta-and-adapter-map.md#passkey-lifecycle--id06-passkey-001-and-id06-passkey-002)
  → `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`; Unit, Integration, and E2E
  are required for each, with no exemption.

### Operation 06 authorize update

- **Operation/action:** `GET /connect/authorize` — `UPDATE`.

- **Contract:** exact protocol request, redirect validation, status/headers, errors, limits, privacy,
  discovery exclusion from OpenAPI, and rollback stay as accepted. Server may pause a bound request for
  required step-up, then resume the same context/consent transaction; no new query field/client
  authority. Concurrent tabs share terminal transaction rules. Rollback applies prior assurance policy
  without falsifying completed evidence.
- **Exact Gherkin proof:** [`ID06-STEPUP-001` — “A TOTP policy requires a second factor”](./005-bdd-spec-delta-and-adapter-map.md#step-up--id06-stepup-001)
  → `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`; Unit, Integration, and E2E are required, with
  no exemption.

### Operation 06 token update

- **Operation/action:** `POST /connect/token` — `UPDATE`.

- **Contract:** form request, grant, statuses/headers/errors, replay/concurrency/limits, discovery, and
  privacy remain exact. Successful ID token may add allowlisted `amr` string array and integer
  `auth_time` derived from server evidence. Example claim fragment:

  ```json
  {
    "amr": ["pwd", "otp"],
    "auth_time": 1789434000
  }
  ```

  Never accept these from caller or disclose inventory; omit unsupported `acr`. Excluded from OpenAPI/codegen.
  Rollback omits new claims but never rewrites issued JWTs.

- **Exact Gherkin proof:** [`ID06-STEPUP-001` — “A TOTP policy requires a second factor”](./005-bdd-spec-delta-and-adapter-map.md#step-up--id06-stepup-001)
  → `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`; Unit, Integration, and E2E are required, with
  no exemption.

### Operation 06 retain identify

- **Operation/action:** `POST /api/bff/sign-in/identify` — `RETAIN`.

- **Caller/auth/context:** same-origin public email form with CSRF/origin proof; no authenticated Person
  or company authority.
- **Request:** `Content-Type: application/json`, accepted correlation header, size limit, and:

  ```json
  {
    "email": "person.personal@example.test"
  }
  ```

- **Success:** retain `202 application/json`, `no-store`, and an enumeration-equivalent next-step
  descriptor for known and unknown accounts:

  ```json
  {
    "next": "check-or-enter-credentials",
    "message": "Continue with the available sign-in step."
  }
  ```

- **Errors/semantics:** retain `400 invalid_request`, `403 csrf_invalid`, `429 rate_limited` with
  `Retry-After`, and `503 identity_unavailable`. Repeats are response-equivalent; attempts remain
  isolated across concurrent stateless instances; no pagination or automatic retry.
- **Privacy/publication/rollback:** email/existence/attempt values never enter logs, cache, RSC, or
  evidence. Retain the id-web OpenAPI operation and backend-client mapping unchanged; rollback hides
  passkey without altering this route.
- **Exact Gherkin proof:** [`ID05-SIGNIN-002` RETAIN — “Sign-in guidance does not enumerate an
  account”](#id06-retain-identify-001--identifier-first-compatibility) →
  `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### Operation 06 retain password

- **Operation/action:** `POST /api/bff/sign-in/password` — `RETAIN`.

- **Caller/auth/context:** same-origin browser bound to an opaque sign-in attempt; no company authority.
- **Request:** `Content-Type: application/json`, exact origin/CSRF/session-attempt proof, and:

  ```json
  {
    "password": "synthetic-password"
  }
  ```

- **Success:** retain `200 application/json`, a rotated protected cookie, `no-store`, and:

  ```json
  {
    "next": "authorization",
    "location": "/authorize/context"
  }
  ```

- **Errors/semantics:** retain `400 invalid_request`, generic `401 invalid_credentials`, `409
attempt_stale`, `429 rate_limited`, and `503 identity_unavailable`. One session rotation wins;
  mutation is not automatically retried or paginated.
- **Privacy/publication/rollback:** password/cookie/attempt never enter logs, caches, RSC, or evidence.
  Retain id-web OpenAPI and generated backend mapping. Rollback preserves email/password fallback.
- **Exact Gherkin proof:** [`ID05-SIGNIN-001` RETAIN — “A verified user signs in through OSE ID
  web”](#id06-retain-password-001--password-sign-in-compatibility) →
  `specs/apps/ose/id-web/behaviours/sign-in/email-sign-in.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### Operation 06 retain recovery

- **Operation/action:** `POST /api/bff/recovery/request` — `RETAIN`.

- **Caller/auth/context:** same-origin public recovery form with CSRF/origin proof; no Person/company
  authority.
- **Request:** `Content-Type: application/json`, accepted correlation header, size limit, and:

  ```json
  {
    "email": "person.personal@example.test"
  }
  ```

- **Success:** retain `202 application/json`, `no-store`, equal status/body/timing for known and unknown
  accounts:

  ```json
  {
    "accepted": true,
    "message": "If recovery is available, check your email."
  }
  ```

- **Errors/semantics:** retain `400 invalid_request`, `403 csrf_invalid`, `429 rate_limited`, and `503
recovery_unavailable`. Repeats follow backend cooldown/capability invalidation and shared limiter;
  no pagination or automatic mutation retry.
- **Privacy/publication/rollback:** no email/existence/capability in logs, caches, RSC, or evidence.
  Retain id-web OpenAPI/generated backend mapping and Plan 02 Mailpit ownership. Rollback preserves the
  link-based recovery fallback.
- **Exact Gherkin proof:** [`ID05-SIGNIN-002` RETAIN — “Sign-in guidance does not enumerate an
  account”](#id06-retain-recovery-001--recovery-request-compatibility) →
  `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### DELETE operation packet

There is no `DELETE` operation. A discovered removal blocks delivery until a plan amendment supplies a
dedicated packet, migration/compatibility strategy, and full U/I/E mapping. No Google or Facebook
operation exists to retain, update, or delete.

## Copy-ready authenticator contract scenarios

Every indexed ADD or UPDATE operation maps to the scenario titles below. Unit, Integration, and E2E
bindings are required for every scenario and example row; no adapter exemption applies. “Mutation” is
not applicable only to read-only page and query operations.

| Operation                                           | Action | Success                | Boundary               | Mutation               | Privacy                |
| --------------------------------------------------- | ------ | ---------------------- | ---------------------- | ---------------------- | ---------------------- |
| `GET /api/account/security-methods`                 | ADD    | exact success          | stable failure         | none                   | artifact boundary      |
| `POST /api/passkeys/registration/options`           | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/passkeys/registration/verify`            | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/passkeys/authentication/options`         | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/passkeys/authentication/verify`          | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `DELETE /api/passkeys/{credentialId}`               | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/totp/enrollments`                        | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/totp/enrollments/{enrollmentId}/confirm` | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/totp/challenges/{challengeId}/verify`    | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `DELETE /api/totp`                                  | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/recovery-codes/regenerate`               | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/recovery-codes/verify`                   | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `GET /sign-in/passkey`                              | ADD    | exact success          | stable failure         | none                   | artifact boundary      |
| `GET /account/security/passkeys/add`                | ADD    | exact success          | stable failure         | none                   | artifact boundary      |
| `GET /account/security/totp/setup`                  | ADD    | exact success          | stable failure         | none                   | artifact boundary      |
| `GET /challenge/mfa`                                | ADD    | exact success          | stable failure         | none                   | artifact boundary      |
| `GET /account/security/recovery-codes`              | ADD    | exact success          | stable failure         | none                   | artifact boundary      |
| `POST /api/bff/passkeys/registration-options`       | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/passkeys/registration-verify`        | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/passkeys/authentication-options`     | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/passkeys/authentication-verify`      | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/passkeys/remove`                     | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/totp/start`                          | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/totp/confirm`                        | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/totp/verify`                         | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/totp/disable`                        | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/recovery-codes/regenerate`           | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/recovery-codes/verify`               | ADD    | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `GET /account/security`                             | UPDATE | exact success          | stable failure         | none                   | artifact boundary      |
| `GET /sign-in`                                      | UPDATE | exact success          | stable failure         | none                   | artifact boundary      |
| `GET /connect/authorize`                            | UPDATE | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /connect/token`                               | UPDATE | exact success          | stable failure         | safe convergence       | artifact boundary      |
| `POST /api/bff/sign-in/identify`                    | RETAIN | retained compatibility | retained compatibility | retained compatibility | retained compatibility |
| `POST /api/bff/sign-in/password`                    | RETAIN | retained compatibility | retained compatibility | retained compatibility | retained compatibility |
| `POST /api/bff/recovery/request`                    | RETAIN | retained compatibility | retained compatibility | retained compatibility | retained compatibility |

The short mapping labels expand to these exact scenario titles: **Authenticator operation returns its
exact success contract**, **Invalid authenticator authority or input returns a stable error**,
**Concurrent and replayed authenticator mutations converge safely**, and **Authenticator artifacts
remain private and correctly cached**. **Retained compatibility** expands to **Retained email fallback
remains compatible**.

```gherkin
Feature: OSE ID authenticator operation success contracts
  Rule: Every authenticator operation returns only its declared success shape

    Scenario Outline: Authenticator operation returns its exact success contract
      Given the caller session and authentication context satisfy the contract for <operation>
      When the caller sends the valid request for <operation>
      Then the response status is <status>
      And the response contains <result> with the declared headers and no undeclared authority

      Examples:
        | operation | status | result |
        | GET /api/account/security-methods | 200 | safe method summaries without verifier material |
        | POST /api/passkeys/registration/options | 200 | bound WebAuthn creation options and opaque transaction |
        | POST /api/passkeys/registration/verify | 201 | one safe active credential summary |
        | POST /api/passkeys/authentication/options | 200 | enumeration-safe assertion options and opaque transaction |
        | POST /api/passkeys/authentication/verify | 200 | one opaque authenticated-session transition |
        | DELETE /api/passkeys/{credentialId} | 204 | an empty lifecycle-removal result |
        | POST /api/totp/enrollments | 201 | one protected pending enrollment and one-time setup material |
        | POST /api/totp/enrollments/{enrollmentId}/confirm | 200 | active TOTP and one-time recovery codes |
        | POST /api/totp/challenges/{challengeId}/verify | 204 | advanced server-side authentication evidence |
        | DELETE /api/totp | 204 | disabled TOTP and required session consequences |
        | POST /api/recovery-codes/regenerate | 200 | one new one-time plaintext recovery generation |
        | POST /api/recovery-codes/verify | 204 | one consumed recovery verifier and advanced evidence |
        | GET /sign-in/passkey | 200 | ready unsupported cancelled or failed passkey UI with email fallback |
        | GET /account/security/passkeys/add | 200 | focused passkey add cancel success or unsupported UI |
        | GET /account/security/totp/setup | 200 | equivalent QR manual confirmation and recovery UI |
        | GET /challenge/mfa | 200 | only currently eligible TOTP and recovery choices |
        | GET /account/security/recovery-codes | 200 | status or protected one-time recovery-code custody UI |
        | POST /api/bff/passkeys/registration-options | 200 | validated creation options from the backend |
        | POST /api/bff/passkeys/registration-verify | 201 | a safe passkey summary from backend verification |
        | POST /api/bff/passkeys/authentication-options | 200 | enumeration-safe assertion options from the backend |
        | POST /api/bff/passkeys/authentication-verify | 200 | a rotated protected web session and safe continuation |
        | POST /api/bff/passkeys/remove | 204 | an empty passkey-removal result |
        | POST /api/bff/totp/start | 201 | a protected one-time TOTP setup result |
        | POST /api/bff/totp/confirm | 200 | protected one-time recovery codes after confirmation |
        | POST /api/bff/totp/verify | 204 | a safe completed challenge continuation |
        | POST /api/bff/totp/disable | 204 | an empty TOTP-disable result |
        | POST /api/bff/recovery-codes/regenerate | 200 | protected one-time replacement recovery codes |
        | POST /api/bff/recovery-codes/verify | 204 | a safe completed recovery continuation |
        | GET /account/security | 200 | eligible authenticator cards without implying enrollment |
        | GET /sign-in | 200 | passkey only when eligible and email always available |
        | GET /connect/authorize | 302 | the same bound authorization continued through required step-up |
        | POST /connect/token | 200 | exact tokens with truthful allowlisted amr and auth_time when available |
```

```gherkin
Feature: OSE ID authenticator contract failures
  Rule: Invalid factor input or authority fails with a stable non-leaking contract

    Scenario Outline: Invalid authenticator authority or input returns a stable error
      Given <fault> applies to <operation>
      When OSE ID validates the request before changing authenticator or session state
      Then the response is <status> with <error>
      And no factor session recovery verifier consent or token authority is created or widened

      Examples:
        | operation | fault | status | error |
        | GET /api/account/security-methods | the protected session is absent | 401 | session_required |
        | POST /api/passkeys/registration/options | the user would lose the last safe path | 403 | safe_path_required |
        | POST /api/passkeys/registration/verify | the response has the wrong origin or RP | 403 | passkey_verification_failed |
        | POST /api/passkeys/authentication/options | the shared attempt limit is exceeded | 429 | rate_limited with Retry-After |
        | POST /api/passkeys/authentication/verify | the assertion signature is invalid | 401 | invalid_credentials |
        | DELETE /api/passkeys/{credentialId} | the credential belongs to another Person | 403 | passkey_forbidden |
        | POST /api/totp/enrollments | a TOTP factor is already active | 409 | totp_already_active |
        | POST /api/totp/enrollments/{enrollmentId}/confirm | the submitted code is invalid | 401 | totp_invalid |
        | POST /api/totp/challenges/{challengeId}/verify | the time step was already accepted | 409 | totp_step_replayed |
        | DELETE /api/totp | deletion would remove the last safe path | 403 | safe_path_required |
        | POST /api/recovery-codes/regenerate | the account has no eligible active factor | 403 | recovery_not_eligible |
        | POST /api/recovery-codes/verify | the recovery code is invalid | 401 | recovery_code_invalid |
        | GET /sign-in/passkey | the opaque attempt is stale | 409 | attempt_stale |
        | GET /account/security/passkeys/add | recent authentication is absent | 403 | recent_auth_required |
        | GET /account/security/totp/setup | the pending enrollment is stale | 409 | enrollment_stale |
        | GET /challenge/mfa | the bound challenge expired | 410 | challenge_expired |
        | GET /account/security/recovery-codes | recent authentication is absent | 403 | recent_auth_required |
        | POST /api/bff/passkeys/registration-options | the anti-forgery proof is invalid | 403 | csrf_invalid |
        | POST /api/bff/passkeys/registration-verify | the backend challenge was consumed | 409 | challenge_consumed |
        | POST /api/bff/passkeys/authentication-options | the request limit is exceeded | 429 | rate_limited with Retry-After |
        | POST /api/bff/passkeys/authentication-verify | the assertion is invalid | 401 | invalid_credentials |
        | POST /api/bff/passkeys/remove | the method is the last safe path | 403 | safe_path_required |
        | POST /api/bff/totp/start | an active TOTP factor conflicts | 409 | totp_already_active |
        | POST /api/bff/totp/confirm | the enrollment expired | 410 | enrollment_expired |
        | POST /api/bff/totp/verify | the accepted step is replayed | 409 | step_replayed |
        | POST /api/bff/totp/disable | the method set changed concurrently | 409 | security_methods_stale |
        | POST /api/bff/recovery-codes/regenerate | another generation won | 409 | generation_conflict |
        | POST /api/bff/recovery-codes/verify | the recovery code was consumed | 409 | recovery_code_replayed |
        | GET /account/security | the protected session is absent | 401 | session_required |
        | GET /sign-in | the identity dependency is unavailable | 503 | dependency_unavailable |
        | GET /connect/authorize | required step-up is incomplete | 403 | interaction_required through the safe protocol path |
        | POST /connect/token | the authorization code is replayed | 400 | invalid_grant |
```

```gherkin
Feature: OSE ID authenticator replay and concurrency
  Rule: Every ceremony and one-time mutation has one authoritative outcome

    Scenario Outline: Concurrent and replayed authenticator mutations converge safely
      Given two requests race the same valid state for <operation>
      When different stateless OSE ID instances process both requests
      Then <outcome>
      And a later replay cannot create another authenticator or authorization effect

      Examples:
        | operation | outcome |
        | POST /api/passkeys/registration/options | independent expiring challenges are bound to their own transactions |
        | POST /api/passkeys/registration/verify | one challenge and credential insertion wins |
        | POST /api/passkeys/authentication/options | independent attempts cannot borrow one another's challenge |
        | POST /api/passkeys/authentication/verify | one challenge consumption and session transition wins |
        | DELETE /api/passkeys/{credentialId} | removals serialize and converge on removed state |
        | POST /api/totp/enrollments | one pending generation is current without changing an active factor |
        | POST /api/totp/enrollments/{enrollmentId}/confirm | one confirmation activates TOTP and creates one recovery generation |
        | POST /api/totp/challenges/{challengeId}/verify | one challenge and time step is accepted |
        | DELETE /api/totp | removals serialize and converge on disabled state |
        | POST /api/recovery-codes/regenerate | one generation wins and invalidates every older verifier generation |
        | POST /api/recovery-codes/verify | one verifier is consumed once across instances |
        | POST /api/bff/passkeys/registration-options | each accepted command maps to one backend transaction without retry |
        | POST /api/bff/passkeys/registration-verify | one backend ceremony result is forwarded without retry |
        | POST /api/bff/passkeys/authentication-options | attempts stay isolated without account enumeration |
        | POST /api/bff/passkeys/authentication-verify | one protected web-session rotation wins |
        | POST /api/bff/passkeys/remove | repeated commands converge on removed state |
        | POST /api/bff/totp/start | one pending backend generation remains authoritative |
        | POST /api/bff/totp/confirm | one activation result and recovery generation is displayed once |
        | POST /api/bff/totp/verify | one accepted challenge advances the session |
        | POST /api/bff/totp/disable | repeated commands converge on disabled state |
        | POST /api/bff/recovery-codes/regenerate | one replacement generation is displayed once |
        | POST /api/bff/recovery-codes/verify | one accepted code advances the session once |
        | GET /connect/authorize | one bound transaction resumes after step-up without duplicated consent |
        | POST /connect/token | one code exchange succeeds and every replay receives invalid_grant |
```

```gherkin
Feature: OSE ID authenticator privacy and cache boundaries
  Rule: Authenticator secrets and ceremony material stay on their declared side of each boundary

    Scenario Outline: Authenticator artifacts remain private and correctly cached
      Given a valid request completes at <operation>
      When responses URLs history storage RSC payloads caches analytics logs traces and evidence are inspected
      Then <protected> is absent from every forbidden surface
      And the response uses no-store and exposes only its declared safe fields

      Examples:
        | operation | protected |
        | GET /api/account/security-methods | private keys seeds recovery values cookies and hidden method inventory |
        | POST /api/passkeys/registration/options | challenge user handle and hidden credential-owner list in logs |
        | POST /api/passkeys/registration/verify | raw client data attestation object and private credential material |
        | POST /api/passkeys/authentication/options | identifier existence challenge and credential-owner list in logs |
        | POST /api/passkeys/authentication/verify | raw assertion signature authenticator data and session secret |
        | DELETE /api/passkeys/{credentialId} | raw credential and Person identifiers in logs |
        | POST /api/totp/enrollments | plaintext seed outside its one-time protected setup response |
        | POST /api/totp/enrollments/{enrollmentId}/confirm | TOTP seed submitted code and recovery values outside the one-time response |
        | POST /api/totp/challenges/{challengeId}/verify | submitted TOTP and challenge identifier |
        | DELETE /api/totp | seed and factor detail |
        | POST /api/recovery-codes/regenerate | plaintext recovery codes outside the one-time response |
        | POST /api/recovery-codes/verify | plaintext recovery code and stored verifier |
        | GET /sign-in/passkey | credential hints native ceremony material and account existence |
        | GET /account/security/passkeys/add | challenge credential response and hidden method state |
        | GET /account/security/totp/setup | seed QR payload TOTP and recovery codes in cache logs or screenshots |
        | GET /challenge/mfa | submitted code challenge identifier and hidden method inventory |
        | GET /account/security/recovery-codes | plaintext codes on revisit or in cache logs history and screenshots |
        | POST /api/bff/passkeys/registration-options | challenge and session secret in RSC logs or cache |
        | POST /api/bff/passkeys/registration-verify | raw credential response and session secret |
        | POST /api/bff/passkeys/authentication-options | identifier existence challenge and credential-owner list |
        | POST /api/bff/passkeys/authentication-verify | raw assertion token and session cookie value |
        | POST /api/bff/passkeys/remove | raw credential and Person identifiers |
        | POST /api/bff/totp/start | plaintext seed outside the protected one-time response |
        | POST /api/bff/totp/confirm | seed TOTP and recovery codes outside the protected one-time response |
        | POST /api/bff/totp/verify | submitted TOTP and challenge identifier |
        | POST /api/bff/totp/disable | seed factor detail and session cookie value |
        | POST /api/bff/recovery-codes/regenerate | plaintext codes outside the protected one-time response |
        | POST /api/bff/recovery-codes/verify | plaintext code verifier and session cookie value |
        | GET /account/security | verifier material hidden method inventory and company data |
        | GET /sign-in | account existence credential hints and undelivered provider controls |
        | GET /connect/authorize | factor secrets challenge values and duplicated consent authority |
        | POST /connect/token | credential inventory client secret code verifier and token values in logs or cache |
```

```gherkin
Feature: OSE ID authenticator contract compatibility
  Rule: Account hardening preserves delivered email and protocol access paths

    Scenario Outline: Retained email fallback remains compatible
      Given the accepted contract for <operation>
      When authenticator operations and authentication evidence are added
      Then <outcome>
      And its retained Unit Integration and E2E adapters still pass

      Examples:
        | operation | outcome |
        | POST /api/bff/sign-in/identify | enumeration-equivalent email identification remains unchanged |
        | POST /api/bff/sign-in/password | generic credential denial and protected session rotation remain unchanged |
        | POST /api/bff/recovery/request | enumeration-equivalent recovery and Mailpit handoff remain unchanged |

    Scenario: No accepted operation is deleted
      Given the authenticator API delta declares no delete action
      When machine contracts and discovery are compared with the accepted predecessor
      Then no accepted operation scope audience grant or fallback is removed
      And any discovered deletion blocks delivery as a contract amendment
```

### ID06-RETAIN-IDENTIFY-001 — Identifier-first compatibility

**Canonical destination:** `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Sign-in guidance does not enumerate an account after authenticators are added
  Given one known email and one unknown email are syntactically valid
  When each starts identifier-first sign-in after passkeys and MFA are enabled
  Then both receive enumeration-equivalent method guidance
  And their attempts remain isolated across stateless web instances
```

### ID06-RETAIN-PASSWORD-001 — Password sign-in compatibility

**Canonical destination:** `specs/apps/ose/id-web/behaviours/sign-in/email-sign-in.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: A verified user still signs in with password after authenticators are added
  Given a verified user selects the retained email sign-in method
  When the user submits a valid password
  Then one protected session rotation continues the authorization journey
  And invalid credentials remain generic without exposing account or authenticator state
```

### ID06-RETAIN-RECOVERY-001 — Recovery-request compatibility

**Canonical destination:** `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Recovery requests remain non-enumerating after authenticators are added
  Given one known email and one unknown email are syntactically valid
  When each requests the retained email-recovery journey
  Then both receive the same accepted response and timing class
  And only an eligible account may receive a single-use Mailpit capability
```

## Discovery, OpenAPI, and code generation

- Discovery retains its endpoint/grant/scope/algorithm set. Do not advertise `acr_values_supported`
  because this contract defines no assurance-level taxonomy; `amr` and `auth_time` are token claims, not
  new discovery endpoints.
- OIDC/OAuth endpoints remain excluded from OpenAPI/codegen and are tested through protocol clients.
- Add all `/api/account`, `/api/passkeys`, `/api/totp`, and `/api/recovery-codes` backend operations,
  WebAuthn schemas, safe method summaries, and problem variants to
  `specs/apps/ose/id-be/contracts/openapi.yaml` and its split path/schema owners.
- Regenerate the repository-owned backend-to-web client. Base64url codecs and one-time-secret response
  handling receive direct tests; generated output is never hand-edited.
- Web page routes are not OpenAPI. Add every BFF operation and request/response/problem schema to
  `specs/apps/ose/id-web/contracts/openapi.yaml`; validate or generate its TypeScript handler boundary
  through the owning target. BFF schemas must agree with the generated backend client and reject
  unexpected secret-bearing fields.

## Compatibility and rollback

Backend tables and endpoints are additive; existing email/protocol consumers keep working. The web
feature gate keeps routes inert until backend schema/API/UI land together. Rollback reverts the complete
delivery, disables authenticator routes, and lets prior code run against retained additive tables. It
must not down-migrate, delete/tombstone valid methods, regenerate recovery codes, or falsely downgrade
session evidence. A forward fix owns schema/data defects. Production rejects localhost RP/origin, test
authenticator, and local key/protector settings before listen.

## Proof obligations

| Layer       | Required proof                                                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | RP/origin/challenge/type/signature/owner policies, option/response codecs, factor lifecycle, recent-auth/last-path, TOTP skew/replay/limit, recovery generation/consumption, safe errors, truthful `amr`/`auth_time`, UI/BFF state          |
| Integration | PostgreSQL atomic challenge/code/method transitions, Identity/OpenIddict session and token pipeline, OpenAPI/generated client, shared limiter, one-time secret handling, concurrent removals/regeneration                                   |
| E2E         | Built browser virtual authenticator, passkey add/sign-in/cancel/fallback/remove, TOTP setup/challenge, recovery display/use/regenerate/replay, step-up through consent/token, instance A-to-B, leak/a11y/responsive, production no-listener |

Every durable scenario retains the BDD map's default Unit/Integration/E2E bindings. There are no
contract-level exemptions and no positive layer tags.
