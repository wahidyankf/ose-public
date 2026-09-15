# Email, Capabilities, and Password Security

## Notification Port

Application code depends on an `INotificationSender`-style port representing a typed notification, not
SMTP concepts. A verification request provides recipient, safe template data, opaque capability URL,
locale if supported, correlation/audit context, and cancellation. It does not expose a generic
“send arbitrary HTML” primitive to domain callers.

Adapters:

- Local/Test SMTP adapter sends only to the owned Mailpit endpoint.
- Unit fake captures typed notifications in memory inside the test process.
- Production has no configured adapter and startup rejects Local/Test SMTP/Mailpit values.

## Mailpit Contract

Use an exact version/digest verified in Phase 0, bind SMTP and inbox/API to loopback, disable relay, and
use synthetic `.test` recipients. The local runner creates a fresh mailbox/resource per run or deletes
all owned messages at cleanup. Backend E2E may query the Mailpit API to locate a message by unique
synthetic recipient/correlation; application code never depends on the Mailpit API.

Mailpit is a third-party component under its own MIT terms; it is not relicensed as OSE code. Record its
version, source, license, and notice disposition.

## Capability Design

Verification and reset capabilities are purpose-bound, high-entropy, expiring, and single-use. Bind
them to the intended aggregate/security version and public origin. A verification capability cannot be
used as reset, sign-in, or session credential.

Prefer framework-provided cryptographic token primitives when they support purpose, expiry,
security-stamp binding, and safe multi-instance key/state operation without requiring an EF Identity
store or `UserManager` persistence. If their token material depends on an ASP.NET Data
Protection key ring, the key ring must be shared durable state—not local disk. The executor must prove
instance A issue / instance B consume. If the framework primitive cannot meet that contract locally,
use a database-backed opaque capability with only a keyed digest stored, and record the decision.

## Enumeration Resistance

The anonymous registration/resend/recovery contract returns the same status and response shape for
unknown, pending, verified, suspended, and duplicate states where disclosure is unnecessary. Do not
promise exact microsecond equality; instead avoid deliberate branches that create observable class
differences and test bounded distribution at a coarse, non-flaky level only if repository security
guidance supports it. Primary proof is schema/status/header/log equivalence and rate-limit consistency.

## Password Handling

- Use ASP.NET Core Identity's supported password hasher and automatic rehash signaling.
- Invoke hasher/validator primitives behind an outbound password port; persist their encoded result and
  credential version through SqlKata/Npgsql, never through an EF Identity store or `UserManager`.
- Select password length/quality rules from current repository/security policy in Phase 0; do not invent
  composition rules that reduce usability or paste support.
- Accept password-manager paste/autofill at later UI; API validation must support long generated values
  within a documented maximum body/field size.
- Never trim or normalize password bytes silently.
- Compare through framework verifier and erase references as soon as practical; never log request bodies.
- Successful reset increments security state and revokes previous sessions atomically or through a
  single explicit Npgsql transaction proven by tests. An outbox requires a separately justified
  cross-resource side effect; it is not needed for these same-database writes.

## Rate Limits and Lockout

Account-probing limits must be shared across instances. Key by privacy-preserving combinations of
network/client action and normalized account discriminator without putting raw email in metric labels.
Define separate policies for registration, resend, sign-in failure, recovery request, and capability
consumption. A limit response remains non-disclosing and carries safe retry semantics where appropriate.

Rate-limit/lockout records in PostgreSQL are accepted for this local initial scale. Redis is not added
speculatively. Revisit when measured load or production architecture justifies a shared low-latency store.

## Email Change Is Deferred

This slice does not implement change-email. Later work must reauthenticate, verify the new address,
handle uniqueness races, retain security audit, and decide session consequences. The omission is
explicit so “update profile email” cannot bypass the verified-login-method lifecycle.
