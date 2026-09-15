# Business Requirements — OSE ID Init 02 Local Email Account

## Business Goal

Prove the first complete identity lifecycle locally, without UI or product protocol complexity: a
person registers an email, receives a verification message, establishes a password-backed account,
signs in, recovers access, reviews sessions, and revokes them safely.

## Why This Is a Separate Delivery

Credential and recovery code is security-sensitive enough to deserve a focused review and rollback
boundary. Mixing it with UI, Google federation, OIDC, or tenancy would make failures ambiguous and
create a large irreversible data model. The foundation already owns process/database/lifecycle safety;
this plan adds only one authentication method and its account state.

## Business Outcomes

1. An individual can own a verified OSE identity without belonging to a company.
2. Email confirmation and recovery are demonstrated end-to-end locally without sending real mail.
3. Public responses do not disclose whether an email is registered.
4. Password/session compromise can be bounded through rotation, revocation, expiry, rate limits, and audit.
5. Two backend instances produce the same account/security result without sticky routing.
6. Later UI/protocol/tenancy plans consume a stable application boundary rather than embedding ASP.NET
   Core Identity or SMTP details.

## Affected Roles

| Role                       | Need                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Individual user            | A real account that does not require a company.                                    |
| Local developer/tester     | Inspectable verification/recovery mail and deterministic fixtures.                 |
| Security reviewer          | Negative proof for enumeration, replay, expiry, races, leakage, and revocation.    |
| Later UI/protocol executor | Stable account/session APIs and notification ports.                                |
| Maintainer                 | Forward migration, rollback compatibility, licenses, and clean runner composition. |

## Success Measures

- A `.test` address registers, receives one Mailpit verification message, verifies once, signs in, lists
  the current session, signs out, and cannot reuse its old opaque cookie.
- Recovery request gives the same public result for known and unknown addresses; only a known verified
  address receives a message; reset handles are expiring and single-use.
- Concurrent verification/reset consumption produces exactly one success and one safe terminal result.
- Stored password material is framework-generated salted hash data; plaintext passwords, capability
  handles, cookies, SMTP content, and connection strings do not enter logs/evidence/repository files.
- Security-sensitive account change revokes or invalidates affected sessions consistently across two instances.
- Local runner starts Mailpit and PostgreSQL before the backend and proves an empty resource/message inventory on cleanup.
- The backend Unit target enforces at least 99% Unit line coverage for authored production code, while static BDD
  validation proves every account scenario has Unit, Integration, and E2E bindings or an exact valid
  scenario/adapter exemption.

## Options and Tradeoffs

| Option                                | Benefits                                                                    | Costs and risks                                                                       | Decision                                       |
| ------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Backend-only account API with Mailpit | Isolates credential correctness; deterministic local proof; no premature UX | Temporary API is not an end-user product and must stay local-only                     | **Chosen**                                     |
| Add Next.js UI now                    | Immediate human usability                                                   | Couples UX/BFF/session decisions to unfinished domain/protocol work                   | Deferred to a later thematic plan              |
| Passwordless email links only         | Removes password storage                                                    | Makes email delivery the sole authenticator and changes recovery/session threat model | Rejected for requested email/password baseline |
| External email sandbox                | Closer to provider integration                                              | Requires credentials/network and makes CI/local behavior non-deterministic            | Rejected for this slice                        |

## Risks and Mitigations

| Risk                                          | Consequence                            | Mitigation or stop condition                                                                    |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Account enumeration                           | Privacy leak and targeted attacks      | Generic status/body/timing class, rate limits, and known/unknown comparison tests               |
| Capability replay/race                        | Unauthorized verification/reset        | Hashed single-use handle, expiry, atomic consumption, concurrency E2E                           |
| Session theft/fixation                        | Account takeover                       | Opaque Secure/HttpOnly/SameSite cookie, rotation, server record, revocation, no browser storage |
| Local SMTP leaks outward                      | Synthetic or real data sent externally | Loopback-only Mailpit, `.test` fixtures, no relay, production adapter rejection                 |
| Password implementation drifts from framework | Weak hashing or upgrade bugs           | Use ASP.NET Core Identity hasher/policy; no custom crypto                                       |
| Backend-only API becomes production surface   | Unreviewed public account system       | Inherit Plan 01 startup guard; Test/Local only and route-level local guard                      |

## Business Non-Goals

This slice does not make OSE ID usable by LMS or any product. It proves an internal identity account
capability and preserves a safe main state for the next plan.
