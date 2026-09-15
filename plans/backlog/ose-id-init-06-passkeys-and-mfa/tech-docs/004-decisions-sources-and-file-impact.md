# Decisions, Sources, and File Impact

## Decisions and Tradeoffs

### DR-06-01 — Passkeys plus optional TOTP

**Selected:** passkeys provide phishing-resistant public-key authentication; TOTP supplies an
interoperable optional second factor; recovery codes provide offline fallback. Password-only status quo
does not meet account-hardening goals. SMS introduces phone dependency, delivery cost, and weaker
security and is rejected. A passkey-only mandate would lock out unsupported/local environments and is
deferred until adoption evidence exists.

### DR-06-02 — No attestation inventory initially

**Selected:** validate WebAuthn ceremonies without requiring device attestation inventory. Strict
attestation can constrain authenticators but adds metadata trust, privacy, update, and support burdens
without a local product risk requiring it. “Accept anything” is not selected: RP, origin, challenge,
type, signature, ownership, and user-verification policy remain mandatory. Revisit for a documented
regulated/hardware-bound client requirement.

### DR-06-03 — Hashed one-time recovery codes

**Selected:** high-entropy codes shown once and stored as verifiers. Reversible encrypted storage could
redisplay them but increases breach impact and key custody. Email/SMS reset as the only fallback depends
on delivery systems and does not cover second-factor recovery. Regeneration replaces the entire set to
make uncertain exposure understandable.

### DR-06-04 — Security method cards

**Selected:** PRD Option A gives optional methods stable management locations and responsive actions.
The guided checklist overstates a required order; the dense table compromises mobile use and action
clarity. Revisit only when users typically manage enough credentials that card scanning becomes poor.

### DR-06-05 — Shared challenges and stateless processes

**Selected:** shared short-lived state with atomic consumption enables restart/no-affinity and replay
protection. Client-carried signed challenge state reduces storage but complicates one-time/concurrency
revocation. Instance-local state is rejected. Redis remains a future measured optimization.

### DR-06-06 — Local-only and MIT

OSE-authored source/docs inherit the root MIT license; framework/browser libraries retain their own
licenses. Production WebAuthn RP/domain, key custody, support, operations, and deployment wait for a
future deploy plan blocked at minimum by
`private-sibling/plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` plus then-current
platform handoff gates.

## Primary Source and Prior-Art Record

All external sources were accessed on **2026-09-15**. Excerpts are intentionally short and support the
listed boundary; Phase 0 rereads current official guidance for exact resolved APIs.

| Confidence | Official source                                                                                                      | Short supporting excerpt                              | Design use                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| [Verified] | [Web Authentication Level 3](https://www.w3.org/TR/webauthn-3/)                                                      | “scoped, public key-based credentials”                | RP/origin-scoped passkey model                           |
| [Verified] | [WebAuthn credential private key](https://www.w3.org/TR/webauthn-3/#credential-private-key)                          | “expected to never be exposed to any other party”     | OSE stores public verifier material only                 |
| [Verified] | [ASP.NET Core MFA and passkeys](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/mfa)           | “MFA using TOTP is supported by default”              | Framework adapter starting point; exact API rechecked    |
| [Verified] | [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)                                                  | “Verifiers SHALL implement a rate-limiting mechanism” | Online factor attempt controls                           |
| [Verified] | [WCAG accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) | “copy and paste to reduce the cognitive burden”       | TOTP/recovery input and fallback design                  |
| [Verified] | [GOV.UK One Login passkeys](https://www.gov.uk/guidance/using-a-passkey-to-sign-in-to-govuk-one-login)               | “select Manage your sign in details”                  | External prior art for a persistent security-method home |
| [Verified] | [GOV.UK One Login passkey fallback](https://www.gov.uk/guidance/using-a-passkey-to-sign-in-to-govuk-one-login)       | “select Sign in another way”                          | Explicit accessible alternate path                       |
| [Verified] | [Repository root license](../../../../LICENSE)                                                                       | “MIT License”                                         | OSE-authored source/docs inherit root MIT                |

Repository prior art is the numbered Init 05 plan and its archived as-built web evidence, resolved during
Phase 0 and verified against its delivered head.

Exact .NET/browser APIs and virtual-authenticator support are **medium confidence** until Phase 0
checks resolved versions/current official docs. WebAuthn security properties, shared-state, no-secret,
local-only, and license boundaries are **high confidence**.

## File-Impact Analysis

```text
.
├── plans/
│   ├── in-progress/ose-id-init-06-passkeys-and-mfa/ [E] — delivery record moved in the delivering PR
│   ├── in-progress/README.md [E] — remove the active entry in the delivering PR
│   ├── done/<completion-date>__ose-id-init-06-passkeys-and-mfa/ [N] — archived plan/assets/evidence
│   └── done/README.md [E] — add completion entry in the delivering PR
├── apps/
│   ├── ose-id-be/src/OseIdBe/Authentication/PasskeyService.cs [N] — ceremonies and credential policy
│   ├── ose-id-be/src/OseIdBe/Authentication/TotpService.cs [N] — enrollment and verification
│   ├── ose-id-be/src/OseIdBe/Authentication/RecoveryCodeService.cs [N] — generation/atomic consumption
│   ├── ose-id-be/src/OseIdBe/Authentication/AccessPathPolicy.cs [N] — recent-auth/last-path decisions
│   ├── ose-id-be/src/OseIdBe/Authorization/ClaimsPolicy.cs [E] — truthful method/freshness projection
│   ├── ose-id-be/src/OseIdBe/Infrastructure/Authentication/AuthenticatorStore.cs [N] — SqlKata/Npgsql adapter with explicit projections and transactions
│   ├── ose-id-be/db/migrations/*_add_authenticators.cs [N] — one additive authenticator migration
│   ├── ose-id-be/tests/unit/Authentication/AuthenticatorPolicyTests.cs [N] — policy/claims Unit proof
│   ├── ose-id-be/tests/integration/Authentication/AuthenticatorStoreTests.cs [N] — DB/concurrency proof
│   ├── ose-id-be-e2e/src/authentication/authenticator.steps.ts [N] — no-affinity/API adapter
│   ├── ose-id-web/src/app/(account)/security/page.tsx [E] — selected method-card experience
│   ├── ose-id-web/src/app/(auth)/sign-in/passkey/page.tsx [N] — passkey sign-in/ceremony route
│   ├── ose-id-web/src/app/(auth)/challenge/mfa/page.tsx [N] — TOTP/recovery challenge route
│   ├── ose-id-web/src/app/(account)/security/passkeys/add/page.tsx [N] — passkey setup route
│   ├── ose-id-web/src/app/(account)/security/totp/setup/page.tsx [N] — TOTP setup route
│   ├── ose-id-web/src/app/(account)/security/recovery-codes/page.tsx [N] — recovery custody route
│   ├── ose-id-web/src/features/authentication/passkey-panel.tsx [N] — ceremony UI states
│   ├── ose-id-web/src/features/authentication/totp-panel.tsx [N] — setup/challenge UI states
│   ├── ose-id-web/src/features/authentication/recovery-code-panel.tsx [N] — one-time recovery UX
│   ├── ose-id-web-e2e/src/authentication/authenticator.steps.ts [N] — UI/a11y/virtual authenticator
│   └── ose-id-web-e2e/project.json [E] — `serve-local`, cleanup, and E2E target wiring
├── specs/apps/ose/
│   ├── id-be/contracts/openapi.yaml [E] — backend authenticator operation contracts
│   ├── id-web/contracts/openapi.yaml [E] — same-origin BFF operation contracts
│   ├── id-be/behaviours/passkeys/assertion-validation.feature [N] — passkey failures
│   ├── id-be/behaviours/mfa/totp-enrollment.feature [N] — inactive pending TOTP
│   ├── id-be/behaviours/mfa/step-up.feature [N] — truthful factor requirement
│   ├── id-be/behaviours/recovery/recovery-codes.feature [N] — one-use generations
│   ├── id-be/behaviours/runtime/authenticator-statelessness.feature [N] — shared challenges
│   ├── id-be/behaviours/persistence/authenticator-soft-delete.feature [N] — audited terminal cleanup
│   ├── id-web/behaviours/passkeys/passkey-lifecycle.feature [N] — add/sign-in UX
│   ├── id-web/behaviours/mfa/totp-enrollment.feature [N] — setup UX
│   ├── id-web/behaviours/account-security/method-removal.feature [N] — final-path refusal
│   ├── id-web/behaviours/accessibility/account-hardening.feature [N] — responsive fallback
│   └── id-web/behaviours/config/authenticator-production-guard.feature [N] — startup guard
├── apps/ose-id-be/behaviour-coverage.json [E] — backend adapter map
├── apps/ose-id-web/behaviour-coverage.json [E] — web adapter map
├── apps/ose-id-be-e2e/behaviour-coverage.json [E] — built backend adapter map
├── apps/ose-id-web-e2e/behaviour-coverage.json [E] — built browser adapter map
├── repo-config.yml [E] — scoped test/network/feature metadata only when proven necessary
└── docs/reference/web-sites.md [E] — pinned local URLs/ports only
```

### More Detail

Phase 0 resolves exact test/project paths, framework APIs, database tables, feature-gate mechanism,
locale set, browser support, and generated ownership. Any rule/enforcement edit triggers full rules
propagation. This plan excludes social providers, company admin, LMS source, production environment
files, deployment workflows/manifests, Kubernetes, and edits to the private sibling.
