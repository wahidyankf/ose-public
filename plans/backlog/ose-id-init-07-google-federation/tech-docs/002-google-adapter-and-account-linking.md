# Google Adapter and Account Linking

## Adapter Responsibilities

The Google adapter owns upstream protocol mechanics only:

- construct the exact authorization request from registered configuration;
- redeem the one-time authorization code server-side;
- validate issuer, client audience, signature/key, times, nonce, and required subject;
- normalize approved claims;
- classify denial, transient failure, and invalid response; and
- dispose of upstream tokens without surfacing them to account or UI layers.

The account application service owns Person creation, provider-link uniqueness, recent-auth checks,
session rotation, link/unlink policy, audit, and continuation into OSE authorization context.

## Persistent Model

A provider link records:

| Field              | Rule                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `provider_link_id` | Opaque OSE-generated stable ID.                                       |
| `person_id`        | References the global Person, not a company.                          |
| `provider_id`      | Internal registered adapter key such as `google`.                     |
| `provider_issuer`  | Canonical validated issuer.                                           |
| `provider_subject` | Opaque upstream subject.                                              |
| profile snapshot   | Optional allowlisted display/contact hints; never identity authority. |
| timestamps         | Created, last authenticated, updated, and revoked as policy requires. |

Enforce a unique key on canonical provider issuer plus provider subject. Store provider tokens only if a
separate concrete downstream need exists; this plan has none, so discard them after validation.

## Resolution Algorithm

1. Validate the full provider response before any Person lookup.
2. Load the provider link by canonical issuer and subject.
3. If present and active, load the Person, apply OSE account state policy, rotate the OSE session, and
   continue.
4. If absent and the journey explicitly requests new-account creation, create Person and link in one
   transaction after any required OSE terms/profile confirmation.
5. If absent and the journey requests linking, require recent OSE reauthentication and explicit
   confirmation; insert only if the provider key remains unclaimed.
6. Otherwise present a safe choice without searching by email.

## Concurrency

Two callbacks for one new provider subject may race. The database unique constraint is the final arbiter.
The losing transaction returns the same safe result as a preexisting-link conflict and never creates a
second Person. Session creation happens only after the account/link transaction commits.

Two users attempting to link the same provider subject cannot learn who owns it. One succeeds; the other
receives a generic conflict and retains their existing session.

## Link and Unlink Ceremony

Linking requires:

- an authenticated OSE session;
- recent verification through an existing method;
- a new correlation marked for `link`, not `sign-in`;
- a fresh valid provider callback;
- an explicit confirmation naming Google; and
- session rotation and a sanitized audit event.

Unlinking requires recent authentication and a transactional last-method check. It revokes the link and
related OSE sessions/grants according to policy without calling Google token APIs because no upstream
token is retained.

## Personal and Company Semantics

Provider links belong to a Person globally. They do not include `company_id`. After sign-in, the existing
authorization-context policy determines whether the user proceeds personally or selects one eligible
company. Suspending one company membership does not unlink Google; disabling the Person account prevents
Google from creating an OSE session.

## Alternatives

- **ASP.NET handler directly mutates Identity user:** smaller initial code but fuses transport with
  account policy; rejected.
- **Email-first auto-link:** lower friction but unsafe because email is mutable and provider-scoped;
  rejected.
- **Persist upstream refresh token:** supports later Google API access but adds encryption, scopes,
  revocation, and breach impact without a current need; rejected.
