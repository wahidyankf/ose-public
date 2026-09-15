# Business Requirements — OSE ID Init 04

## Business Problem

OSE applications need one reusable identity authority. Init 03 can verify an email identity, but an
application still cannot delegate sign-in to OSE ID or validate a token issued for its own API. If each
product invents that bridge, OSE accumulates incompatible issuers, duplicated secrets, and credentials
that cannot support shared sign-in.

## Business Outcome

Deliver a local-only OSE issuer that follows OIDC for sign-in and OAuth for scoped API access. The
result gives later OSE applications a stable protocol contract without claiming that production
identity infrastructure exists.

## Success Measures

- A synthetic local BFF completes Authorization Code with PKCE S256 and validates an OSE ID token.
- The LMS resource accepts an access token intended for LMS and rejects tokens with the wrong issuer,
  audience, signature, time window, client, context, or scope.
- Personal access contains no company identifier; company access contains exactly one server-resolved
  company identifier.
- Discovery and JWKS allow offline signature validation during an intentional signing-key overlap.
- Consent cancellation, revocation, logout, replay, malformed redirect, and unsupported grant tests
  fail safely without leaking protocol secrets.
- Two backend instances can start an authorization on one instance and redeem it on the other without
  affinity.
- Production mode cannot start with local keys, localhost clients, or test-only adapters.
- OSE ID source files carry the repository's MIT license; dependency notices preserve their upstream
  licenses.

## Affected Roles

- **OSE application developer:** receives one documented client/resource/claims profile.
- **End user:** can later approve a named client and one explicit personal or company context.
- **Security maintainer:** receives tested redirect, grant, key, token, and revocation boundaries.
- **Local tester:** can run the full protocol deterministically without Google or an internet service.

## Business Scope

This milestone owns the authorization-server protocol, backend transaction contract, consent records,
client/resource registration, signing and validation material, and local conformance evidence. It
preserves the identity, company, entitlement, session, and audit domain from earlier milestones.

## Business Non-Goals

- Shipping or operating production infrastructure.
- Completing a consumer application integration.
- Designing polished user-facing pages.
- Adding upstream social identity, passkeys, MFA, cross-company operator tools, or product roles.

## Risks and Responses

| Risk                                    | Consequence                          | Required response                                                                                  |
| --------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Incorrect protocol configuration        | Account takeover or token replay     | Negative-first tests for grants, redirects, PKCE, nonce, issuer, audience, and code reuse          |
| Overloaded token                        | Privacy leak and stale authorization | Allowlisted minimal claims and exact resource audiences                                            |
| Local key mistaken for production key   | Unsafe production startup            | Runtime-mode validation rejects local material outside local/test                                  |
| Consent becomes UI-owned policy         | Inconsistent authorization           | Backend creates and validates a versioned transaction; UI only renders and confirms it             |
| In-memory authorization state           | Horizontal scaling failure           | Persist codes, grants, consent, and sessions in shared PostgreSQL and prove cross-instance handoff |
| Framework treated as a complete product | Security gaps remain hidden          | Independent protocol/security review and a Keycloak reconsideration checkpoint                     |

## Delivery Boundary

One delivery unit covers this milestone because server metadata, authorization, token exchange,
claims, consent, keys, and revocation form one protocol trust boundary. Splitting them across `main`
would leave a misleading or unsafe issuer. The unit may contain several phases, but it is one branch
and one PR. Local/test enablement remains explicit; production stays inert.
