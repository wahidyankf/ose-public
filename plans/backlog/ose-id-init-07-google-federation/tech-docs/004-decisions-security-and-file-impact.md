# Decisions, Security, and File Impact

## Decision Record

| ID    | Decision                                      | Rejected alternatives                                 | Revisit trigger                                             |
| ----- | --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| GF-01 | Google is the only external provider          | Facebook; provider marketplace                        | A separately authorized provider need                       |
| GF-02 | Provider issuer/subject is the link key       | Email; display name                                   | Upstream standard no longer supplies stable subject         |
| GF-03 | Provider-neutral port isolates account policy | Direct handler mutations; generic plugin runtime      | Boundary proves more complex than provider code             |
| GF-04 | Deterministic fake upstream for automation    | Real Google in CI; mocked callback DTO only           | Official conformance sandbox becomes deterministic          |
| GF-05 | No upstream token retention                   | Persist access/refresh tokens                         | A concrete Google API integration is authorized             |
| GF-06 | Local/test only and production fail-closed    | Partial deployment configuration; hidden debug bypass | Future deployment plan clears platform gates                |
| GF-07 | SqlKata/Npgsql for provider state             | EF application mapping; handwritten concatenated SQL  | Measured query-plan or correctness evidence requires change |

## Security Checklist

- Exact registered redirects and safe return paths only.
- State, nonce, correlation, issuer, audience, signature/key, time, code single-use, and subject checks.
- Correlation and provider-link operations are atomic and instance-independent.
- No email-only lookup/linking, raw upstream error reflection, or account-existence disclosure.
- No provider/OSE token in browser storage, URL evidence, logs, analytics, traces, or screenshots.
- Recent-auth link/unlink, last-method protection, OSE session rotation, and sanitized audit.
- Fake provider and loopback settings rejected outside explicit local/test runtime.
- Rate/abuse controls reuse the shared OSE ID infrastructure and key on privacy-safe dimensions.

## Licensing

OSE ID source and repository-authored docs inherit the repository's root MIT license. Third-party NuGet,
npm, image, and provider SDK artifacts retain their own licenses. Phase 0 records exact resolved versions
and license evidence; no library enters merely to save a small adapter.

## Deployment Deferral

No workflow, manifest, container registry, DNS, production callback, secret, or cloud resource is in
scope. The future deployment plan remains blocked at minimum on private plan
`start-infra-04-deploy-tencent-lighthouse-k3s-cluster` and then-current security/platform handoff gates.

## File-Impact Analysis

```text
.
├── apps/
│   ├── ose-id-be/
│   │   ├── project.json [E] — register Google federation build and test inputs
│   │   └── src/
│   │       ├── OseId.Application/Federation/Google/ [N] — provider-neutral application orchestration
│   │       ├── OseId.Infrastructure/Federation/Google/ [N] — Google protocol adapter
│   │       ├── OseId.Infrastructure/Persistence/Federation/ [N] — explicit SqlKata/Npgsql provider-link and correlation queries
│   │       ├── OseId.Api/Federation/Google/ [N] — backend challenge, callback, link, and unlink routes
│   │       └── OseId.Infrastructure/Persistence/Migrations/*_add_google_federation.cs [N] — additive migration resolved in Phase 0
│   ├── ose-id-be-e2e/
│   │   ├── project.json [E] — register provider E2E targets
│   │   └── src/
│   │       ├── google-federation/ [N] — backend provider E2E adapter
│   │       └── fake-google-provider/ [N] — deterministic local provider
│   ├── ose-id-web/
│   │   ├── project.json [E] — register web/BFF provider tests
│   │   └── src/
│   │       ├── features/google-federation/ [N] — Google sign-in and linking UI
│   │       └── app/
│   │           ├── api/bff/federation/google/ [N] — sign-in BFF routes
│   │           ├── api/bff/account/federation/google/ [N] — link/unlink BFF routes
│   │           └── auth/google/callback/ [N] — browser callback route
│   └── ose-id-web-e2e/
│       ├── project.json [E] — register browser federation tests
│       └── src/google-federation/ [N] — browser journey adapter
├── specs/apps/ose/
│   ├── id-be/
│   │   ├── contracts/google-federation.openapi.yaml [N] — backend provider contract
│   │   ├── behaviours/federation/google-federation.feature [N] — backend behaviour
│   │   └── behaviours/persistence/federation-soft-delete.feature [N] — audited unlink behaviour
│   └── id-web/
│       ├── contracts/google-federation.openapi.yaml [N] — BFF provider contract
│       └── behaviours/federation/google-federation.feature [N] — browser behaviour
└── plans/in-progress/ose-id-init-07-google-federation/ [E] — executing delivery record and evidence
```

### More Detail

Phase 0 discovers the exact solution namespaces, migration filename, route files, existing test target
names, and generated contract ownership delivered by plans 01–05. The bounded migration pattern contains
exactly the one generated additive Google-federation migration recorded in the frozen ledger. The
executor updates this tree before code if those concrete paths differ. `[E]` authorizes only Google-related edits; it excludes Facebook,
deployment, Kubernetes, production secrets, company-admin behavior, and passkey/MFA implementation.
No whole-app wildcard is authorized; an additional exact path requires a recorded boundary amendment
before edit.

## Evidence Confidence

- **[Repo-grounded]** Delivered Plans 01–05 define actual namespaces/routes and can refine the planned `[N]`
  layout after Phase 0 reconciliation.
- **[Web-cited, official, accessed 2026-09-15]** Google
  [branding guidance](https://developers.google.com/identity/branding-guidelines) requires compliant
  Sign in with Google display for verification.
- **[Judgment call]** The proposed exact feature folders isolate provider-specific code behind the
  provider-neutral port; Phase 0 may rename them without widening scope.

## Rollback

Disable Google through the explicit local feature setting, remove the UI action, and preserve existing
provider-link rows during ordinary rollback so users do not receive reassigned identities. A schema
rollback may drop newly added structures only when evidence proves no durable links exist; otherwise
forward-fix. Email/password and other completed methods remain available throughout.
