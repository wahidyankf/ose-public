# Business Requirements — OSE ID Init 05

## Business Problem

The local issuer can authenticate and authorize through machine-tested contracts after Init 04, but a
person has no coherent OSE-owned journey. Shipping ad hoc forms inside each product would duplicate
credential UX, expose protocol details, and make accessibility and recovery inconsistent.

## Business Outcome

Deliver one trustworthy local OSE ID web experience that applications can redirect to. It supports
email identity now while establishing stable UI/BFF seams for passkeys, MFA, and Google in later plans.
The slice is useful locally and deliberately unusable as a production deployment.

## Success Measures

- A person signs in with verified email/password and returns to the synthetic client without any OSE ID
  token in browser storage, URL history beyond the one-time callback, RSC payload, log, or screenshot.
- A companyless person can select personal access when the client accepts it.
- A multi-company person selects exactly one eligible company and can cancel without changing an
  existing product context.
- Consent identifies the client, context, and requested scopes; allow and cancel are equally reachable.
- Core flows work with keyboard only, meaningful focus/status behavior, 200% zoom, and no horizontal
  scrolling at 320, 768, and 1280 CSS pixels.
- Two web instances complete one journey without affinity or process-local session state.
- The UI does not advertise Google, Facebook, passkeys, or MFA before their plans deliver them.
- Production mode rejects localhost backend/callbacks and local session configuration before listen.
- All OSE-authored code and docs remain under the repository MIT license.

## Affected Roles

- **Individual:** signs in and authorizes personal access without a synthetic company.
- **Company member:** chooses one current company and sees why that context matters.
- **Application developer:** redirects to one first-party identity experience.
- **Support/security maintainer:** receives consistent non-disclosing errors and session/account views.
- **Local developer/tester:** runs deterministic UI journeys without an internet identity provider.

## Business Non-Goals

- Production hosting, operational readiness for internet traffic, or deployment to Kubernetes.
- Social-provider, passkey, or MFA implementation.
- Company administration, platform administration, or application-domain authorization.
- Replacing the backend's identity, membership, entitlement, consent, or token authority.

## Risks and Responses

| Risk                                        | Consequence                 | Required response                                                                         |
| ------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| BFF leaks protocol artifacts                | Browser/session compromise  | Opaque cookie, server-side exchange, no-store/referrer policy, storage/network inspection |
| Identifier-first screen enumerates accounts | Privacy and targeted attack | Backend-neutral responses and indistinguishable UI copy/timing boundaries                 |
| Context picker trusts browser data          | Cross-company access        | Render opaque choices; backend re-resolves authority at confirmation                      |
| Visual design excludes assistive users      | Identity lockout            | WCAG 2.2 AA contract, keyboard/focus/status/manual proof across breakpoints               |
| Future methods shown before delivery        | Broken trust and dead ends  | Only delivered methods are actionable; future assets are trajectory, not shipped state    |
| Web session stored in one process           | Scale/restart failure       | Shared state and no-affinity cross-instance test                                          |

## Delivery Boundary

One PR delivers the web shell, BFF security boundary, email journey, context, consent, and account
security because those pieces must form one safe redirect loop. A half-built page or BFF must never be
reachable on `main`; a temporary local/test-only feature gate keeps the route inert until every contract
and browser proof passes. Production remains fail-closed.
