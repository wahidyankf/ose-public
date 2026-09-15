# Business Requirements — OSE ID Init 07 Google Federation

## Business Goal

Let an OSE user choose Google as a convenient sign-in method while OSE retains control of its person,
company, entitlement, consent, session, and token contracts.

## Problem

Email/password alone creates more recovery and credential-handling work for users. A social provider can
reduce that friction, but a provider-specific implementation woven directly into account code would
make later federation risky and could accidentally treat email equality as proof that two accounts are
the same person.

The plan therefore delivers one narrow provider boundary and only one real provider: Google. It proves
the boundary through deterministic local tests rather than adding speculative adapters.

## Business Outcomes

1. A new user can establish an OSE Person by completing an approved Google authentication response.
2. An existing user can link Google only from a recently reauthenticated OSE session.
3. Matching email addresses never merge, link, or reveal whether another account exists.
4. Google denial or failure returns the user to a safe OSE-owned recovery path.
5. Local and CI tests cover provider success and adversarial responses without real credentials or
   internet access.
6. No Facebook-related artifact enters the repository.
7. The change remains inert outside explicit local/test configuration and adds no deployment work.

## Affected Roles

| Role              | Need                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------- |
| End user          | Choose Google without losing access to OSE-owned recovery and account controls.             |
| Existing OSE user | Link or unlink Google without accidental account takeover or lockout.                       |
| Product client    | Continue receiving tokens from the same OSE issuer and subject contract.                    |
| Maintainer        | Exercise every provider branch locally with synthetic identities and deterministic cleanup. |
| Security reviewer | Verify issuer, audience, nonce, state, correlation, subject, and linking controls.          |

## Success Measures

- Automated acceptance tests prove first sign-in, repeat sign-in, explicit linking, safe unlinking,
  denial, replay, malformed response, wrong issuer/audience/signature, and subject collision behavior.
- Tests prove a matching verified email alone produces neither a link nor an account-existence signal.
- The fake provider runs only in the backend E2E/local test boundary and production startup rejects it.
- The browser stores no Google token, provider assertion, authorization code, or OSE access token.
- The repository contains no case-insensitive active reference matching `facebook` under OSE ID source,
  tests, UI, configuration, environment examples, or generated contracts, except an explicit non-goal in
  plan/history documentation.
- License evidence records that OSE-authored code/docs use root MIT and every new third-party dependency
  retains an approved license.

## Options and Tradeoffs

| Option                                       | Benefit                                                           | Cost or risk                                                    | Decision     |
| -------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- | ------------ |
| Provider port plus Google adapter            | Keeps account policy provider-neutral and makes behavior testable | Adds normalization and error-mapping code                       | **Selected** |
| Direct Google logic inside account endpoints | Fewer initial types                                               | Couples provider claims and failures to core identity logic     | Rejected     |
| Generic plugin marketplace                   | Supports many providers immediately                               | Builds unused extension machinery and broadens security surface | Rejected     |
| Managed CIAM federation                      | Reduces provider protocol ownership                               | Adds vendor cost, control, and local-test constraints           | Rejected     |

## Business Risks and Controls

| Risk                                   | Consequence                   | Control                                                                       |
| -------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| Email-based collision                  | Account takeover              | Provider issuer/subject key; explicit recent-auth link ceremony               |
| Provider outage or denial              | User lockout                  | Preserve OSE-owned methods and show another-method recovery                   |
| Google-specific code leaks into domain | Expensive future providers    | Normalized provider result and provider-independent application service       |
| Fake provider reaches non-test runtime | Trust bypass                  | Compile/runtime boundary plus production startup rejection                    |
| Browser token exposure                 | Token theft                   | OSE BFF owns callback and server-side exchange; secure opaque browser session |
| Provider branding drift                | Confusing or non-compliant UI | Recheck current official branding at execution and use approved assets        |

## Business Non-Goals

- Guaranteeing production availability or provider approval.
- Replacing OSE ID with Google as issuer or user directory.
- Removing email/password, passkeys, MFA, or recovery choices.
- Supporting cross-company platform administration.
- Delivering the future Kubernetes-based hosting platform.

## Licensing and Deployment Boundary

OSE ID source and repository-authored docs inherit the root MIT license. Google protocols and branding
do not change that license; any library or asset introduced by execution keeps its own license and must
pass the dependency/license gate.

This is a local-run-only product slice. A separate deployment plan may begin only after the private
Kubernetes prerequisite `start-infra-04-deploy-tencent-lighthouse-k3s-cluster` and all then-current
security, secret, key, email, observability, backup, and platform handoff gates complete.
