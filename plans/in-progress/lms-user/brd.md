# Business Requirements — LMS Authentication

## Business Goal

Enable an LMS user to create an account and return later through the same stable authentication
contract, whether the caller is a mobile app, an automated API consumer, or a web BFF. The current
service exposes only health and greeting routes and owns no user or credential state
[Repo-grounded: `apps/ose-lms-be/README.md`; `specs/apps/ose/lms-be/architecture.md`].

## Why Now

The next authenticated LMS capabilities need a trusted account identity. Adding isolated feature
data before authentication would either make that data public or force each feature to invent an
identity placeholder. This plan establishes one reusable identity and session boundary first.

## Business Outcomes

- A person can create one username-based account without supplying email or other profile data.
- Mobile and API clients receive a standard bearer-token contract; web clients can use the same
  contract server-to-server through a BFF.
- A leaked or replayed refresh token has a bounded blast radius because rotation revokes its current
  session family, while other logins remain usable.
- Operators can tune authentication throttles without a rebuild and can revoke the session that
  logs out immediately.

## Affected Roles

- **LMS learner:** registers, logs in, refreshes a session, and logs out.
- **Client developer:** integrates either directly from a trusted mobile/API client or through a
  BFF that owns browser cookies.
- **Operator:** supplies database and signing secrets, observes health, and tunes security limits.
- **Maintainer/agent:** evolves the contract-first Java service and proves it at every applicable
  test layer.

## Success Measures

- Every product acceptance criterion in [`prd.md`](./prd.md) has Unit proof and applicable
  Integration and E2E proof or a valid boundary exemption. [Observable fact]
- OpenAPI, generated models, controllers, and observed HTTP responses agree under contract lint,
  compilation, tests, and manual evidence. [Observable fact]
- Passwords, raw refresh tokens, signing secrets, and raw source-address throttle keys are absent
  from persisted rows, error bodies, and captured logs. [Observable fact]
- Register, login, refresh, logout, protected hello, and public health journeys pass the local and
  exact-head PR quality gates. [Observable fact]

## Business Non-Goals

- User profile, email ownership, password recovery, account deletion, organization membership,
  course authorization, roles, permissions, MFA, federation, or social login.
- Direct browser token storage or cookie issuance by `ose-lms-be`; the web BFF owns its browser
  session and CSRF protection.
- A device registry, device identifier, device fingerprint, concurrent-login cap, session eviction,
  or “maximum three devices” behavior.
- Production deployment, secret provisioning, key-distribution infrastructure, or asymmetric JWT
  verification by other services.

## Risks and Mitigations

| Risk                                                               | Mitigation                                                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| A stolen refresh token is replayed                                 | Rotate on every use; atomically consume it; revoke the entire current family on reuse.                                |
| JWT logout is assumed to be stateless                              | Validate the persisted `sid` on every protected request so revocation is immediate.                                   |
| Username existence leaks through login                             | Return the same status/body and perform a dummy Argon2 verification for unknown and wrong-password attempts.          |
| A proxy collapses source throttles or lets callers spoof addresses | Trust forwarded addresses only from explicitly configured proxy CIDRs; otherwise use the direct peer.                 |
| HMAC key replacement invalidates outstanding access tokens         | Keep access lifetime at 15 minutes; refresh with a still-valid persisted family issues a token signed by the new key. |
| Authentication dependencies introduce licensing drift              | Use Spring-managed dependencies and Apache-2.0 Flyway artifacts from `org.flywaydb`; run dependency/license gates.    |
