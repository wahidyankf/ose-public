# Business Requirements — OSE ID Init 06

## Business Problem

Email/password alone leaves OSE ID exposed to phishing and credential reuse. Requiring a phone number
or external paid service would exclude users and add operational scope. OSE needs stronger local
authenticators and recoverability without creating a new account-takeover route or locking a user out.

## Business Outcome

Deliver a local account-hardening milestone where users can choose passkeys and TOTP, retain one-time
recovery codes, and manage those methods safely. The OIDC layer receives truthful authentication method
and freshness evidence while product applications remain unaware of credential implementation.

## Success Measures

- A user can register multiple passkeys and sign in with one; the private key never reaches OSE ID.
- Wrong RP ID, origin, challenge, credential owner, signature, type, or replay attempt is rejected.
- TOTP becomes active only after the user proves one current code; invalid/replayed/rate-limited codes
  do not authenticate.
- Recovery codes are shown once, stored only as nonreversible verifiers, consumed once, and invalidated
  as a set when regenerated.
- Removing a method cannot leave the account without a usable login plus recovery path.
- Sensitive enrollment/removal/regeneration requires recent authentication and rotates/revokes affected
  sessions/grants according to documented policy.
- Passkey/TOTP/recovery journeys work with keyboard, screen reader, zoom, mobile, and clear fallback.
- Two backend/web instances continue challenges using shared state without sticky routing.
- No Google/Facebook code/config/UI or production deployment enters the milestone.
- OSE-authored source/docs remain under the root MIT license.

## Affected Roles

- **User:** gains a phishing-resistant sign-in and an optional second factor.
- **User recovering access:** can use a one-time stored recovery code without SMS.
- **Security maintainer:** receives auditable enrollment, use, removal, replay, and revocation controls.
- **Application developer:** receives accurate `amr`/freshness without credential details.
- **Local tester:** proves authenticator behavior without real accounts or external providers.

## Business Non-Goals

- Mandating passkeys or TOTP for all users in this milestone.
- Guaranteeing a particular assurance level or certification.
- Storing biometric templates, private passkey keys, raw TOTP secrets after display where avoidable, or
  plaintext recovery codes.
- Production hosting, domain/RP rollout, customer support operations, or social login.

## Risks and Responses

| Risk                                | Consequence                             | Required response                                                                         |
| ----------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Wrong WebAuthn RP/origin validation | Credential phishing or cross-origin use | Pin configuration and negative-test RP, origin, challenge, type, signature, owner         |
| Removing final method               | Permanent lockout                       | Server-side last-path invariant and recent-auth confirmation                              |
| TOTP/recovery brute force           | Account takeover                        | Rate limits, generic errors, replay/single-use, audit without secrets                     |
| QR/recovery UI excludes users       | Inaccessible security                   | text/manual key alternative, accessible download/copy, password-manager-friendly fallback |
| Challenge stored in process         | Restart/scale failure                   | shared short-lived atomic challenge state and cross-instance tests                        |
| `amr` overstates authentication     | Incorrect step-up decisions             | derive claims from completed server evidence, never requested method                      |

## Delivery Boundary

Passkey, TOTP, recovery-code, method-management, session consequence, and truthful OIDC evidence form one
account-security boundary. One delivery unit keeps incomplete enrollment or recovery off `main`. A
temporary local/test feature gate protects reachability until backend and UI paths are complete;
production remains fail-closed and deployment remains separate.
