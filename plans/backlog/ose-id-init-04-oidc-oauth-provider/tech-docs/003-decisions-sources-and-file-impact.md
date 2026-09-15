# Decisions, Sources, and File Impact

## Decision Record

### DR-04-01 — OpenIddict inside `ose-id-be`

**Selected:** configure OpenIddict over ASP.NET Core with version-pinned custom application,
authorization, scope, and token stores over SqlKata + Npgsql. Register those stores through the supported
OpenIddict replacement seams. This keeps the issuer in the chosen C# service while making protocol
delete/prune operations obey OSE ID's universal audit, soft-delete, transaction, and explicit-query rules.
EF Core remains migration-time tooling only.

**Alternatives:** official OpenIddict EF stores reduce adapter code, but their physical delete/prune
semantics conflict with the no-hard-delete invariant; Keycloak reduces custom protocol
ownership but adds a separate Java platform and themed/admin integration; custom OAuth/OIDC protocol
logic is disqualified by avoidable security risk. The selected stores require a frozen interface-member
inventory, compile-failing upstream drift, and complete conformance tests. Revisit Keycloak if security
review cannot close high/medium findings without substantial custom protocol code.

### DR-04-02 — Authorization Code with mandatory PKCE S256

**Selected:** one interactive code profile for the local BFF, with exact redirects and OIDC nonce.
Implicit/hybrid exposes tokens through the browser and is rejected; resource-owner password grant
teaches products to collect OSE credentials and is rejected. Device and machine flows solve different
use cases and require later plans.

### DR-04-03 — JWT access token per resource

**Selected:** asymmetric signed access tokens with exact resource audience for initial local
interoperability. Reference tokens improve immediate revocation but require online introspection and HA
design not justified by the local-only milestone. A universal OSE token is rejected because compromise
would cross product boundaries. Revisit per resource when production risk and latency are measurable.

### DR-04-04 — Shared stores, stateless processes

**Selected:** PostgreSQL/OpenIddict stores and a shared key provider own correctness state. Process-local
sessions are simpler but prevent no-affinity scale and lose transactions on restart. Redis is a viable
future shared optimization but adds a second operational state system without a current need.

### DR-04-05 — Backend-owned consent transaction

**Selected:** the backend owns client, scope, context, entitlement, and consent decisions; Init 05 only
renders a safe read model and posts a narrow command. UI-owned policy is rejected because alternate
clients could bypass it. A backend-rendered MVC UI is viable but rejects the selected shared Next.js UX.

### DR-04-06 — Local-only, MIT OSE source

OSE ID-authored source/docs inherit the repository root MIT license. OpenIddict (Apache-2.0) and other
dependencies retain their own license obligations. Production configuration is absent and fail-closed;
deployment waits for the private-sibling Kubernetes plan rather than embedding temporary hosting here.

## Primary Source Record

All external sources were accessed on **2026-09-15**. Each excerpt is short evidence for the stated
design boundary, not a substitute for reading the complete normative source during execution.

| Confidence | Official source                                                                                                                | Short supporting excerpt                                               | Design use                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [Verified] | [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)                                               | “simple identity layer on top of the OAuth 2.0 protocol”               | Separate authentication/ID-token semantics from OAuth API access     |
| [Verified] | [OAuth Security BCP, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700)                                                         | “clients SHOULD NOT use the implicit grant”                            | Code-only response profile and negative tests                        |
| [Verified] | [PKCE, RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)                                                                       | “Proof Key for Code Exchange”                                          | Bind authorization code redemption to the initiating BFF             |
| [Verified] | [OAuth Resource Indicators, RFC 8707](https://www.rfc-editor.org/rfc/rfc8707)                                                  | “indicate the protected resource”                                      | Exact resource/audience selection                                    |
| [Verified] | [JWT Access Token Profile, RFC 9068](https://www.rfc-editor.org/rfc/rfc9068)                                                   | “defines a profile for issuing OAuth 2.0 access tokens in JWT format”  | Interoperable local resource-token shape                             |
| [Verified] | [OpenIddict documentation](https://documentation.openiddict.com/)                                                              | “implement OpenID Connect client, server and token validation support” | Framework boundary rather than custom protocol implementation        |
| [Verified] | [OpenIddict coupling](https://documentation.openiddict.com/introduction)                                                       | “custom stores can also be implemented”                                | Confirms the selected custom-store seam                              |
| [Verified] | [OpenIddict core builder](https://github.com/openiddict/openiddict-core/blob/dev/src/OpenIddict.Core/OpenIddictCoreBuilder.cs) | Store replacement methods are public builder APIs                      | Registers version-pinned custom stores without custom protocol logic |
| [Verified] | [SqlKata documentation](https://sqlkata.com/docs)                                                                              | “Query Builder and Executor”                                           | Default OSE-owned PostgreSQL query composition                       |
| [Verified] | [Npgsql basic usage](https://www.npgsql.org/doc/basic-usage.html)                                                              | “starting point for any database operation is NpgsqlDataSource”        | Explicit connection, transaction, parameter, and execution owner     |
| [Verified] | [ASP.NET Core security documentation](https://learn.microsoft.com/en-us/aspnet/core/security/)                                 | “Security and Identity”                                                | Platform integration entry point; exact APIs rechecked in Phase 0    |
| [Verified] | [Repository root license](../../../../LICENSE)                                                                                 | “MIT License”                                                          | OSE-authored source/docs inherit root MIT                            |

Repository evidence comprises the numbered predecessor plans and their archived as-built evidence,
resolved during Phase 0 with [Verified] confidence against the delivered head.

Exact package APIs and resolved versions are **medium confidence** until Phase 0 checks current official
documentation and the lockfile. Protocol and repository invariants are **high confidence**.

## File-Impact Analysis

```text
.
├── plans/
│   ├── in-progress/ose-id-init-04-oidc-oauth-provider/ [E] — delivery record moved in the delivering PR
│   ├── in-progress/README.md [E] — remove the active-plan entry in the delivering PR
│   ├── done/<completion-date>__ose-id-init-04-oidc-oauth-provider/ [N] — archived plan and evidence
│   └── done/README.md [E] — add the resolved completion entry in the delivering PR
├── apps/
│   ├── ose-id-be/src/OseIdBe/Program.cs [E] — OpenIddict and production-guard composition
│   ├── ose-id-be/src/OseIdBe/Authorization/AuthorizationTransactionService.cs [N] — atomic orchestration
│   ├── ose-id-be/src/OseIdBe/Authorization/ClientCatalog.cs [N] — exact client/resource/scope policy
│   ├── ose-id-be/src/OseIdBe/Authorization/ClaimsPolicy.cs [N] — minimal personal/company claims
│   ├── ose-id-be/src/OseIdBe/Logout/ [N] — selected backend-rendered confirmation, cancel, and error view
│   ├── ose-id-be/src/OseIdBe/Infrastructure/Oidc/OidcConfiguration.cs [N] — OpenIddict endpoint profile
│   ├── ose-id-be/src/OseIdBe/Infrastructure/Oidc/Stores/ [N] — custom application/authorization/scope/token stores over SqlKata/Npgsql
│   ├── ose-id-be/src/OseIdBe/Infrastructure/Oidc/SharedSigningKeyProvider.cs [N] — shared key lifecycle
│   ├── ose-id-be/src/OseIdBe/Infrastructure/Persistence/Authorization/ [N] — SqlKata/Npgsql OSE-owned consent/context queries
│   ├── ose-id-be/db/migrations/*_add_oidc_provider.cs [N] — one additive provider migration
│   ├── ose-id-be/tests/unit/Authorization/OidcPolicyTests.cs [N] — policy/claims/transaction Unit proof
│   ├── ose-id-be/tests/unit/Logout/ [N] — rendering, safe-return, anti-forgery, and accessibility Unit proof
│   ├── ose-id-be/tests/integration/OidcStoreTests.cs [N] — complete interface, audit/soft-delete, SQL/query-plan, migration, and atomic PostgreSQL proof
│   ├── ose-id-be-e2e/src/oidc/authorization.steps.ts [N] — synthetic client protocol adapter
│   ├── ose-id-be-e2e/src/oidc/logout.steps.ts [N] — built-browser confirmation/cancel adapter
│   └── ose-id-be-e2e/project.json [E] — `serve-local`, cleanup, and E2E target wiring
├── specs/apps/ose/id-be/
│   ├── behaviours/authorization/authorization-code.feature [N] — personal/company code flows
│   ├── behaviours/authorization/request-validation.feature [N] — invalid request matrix
│   ├── behaviours/tokens/token-safety.feature [N] — replay and exact audience
│   ├── behaviours/persistence/protocol-soft-delete.feature [N] — auditable protocol-record retirement
│   ├── behaviours/keys/signing-key-lifecycle.feature [N] — overlap/rotation behavior
│   ├── behaviours/runtime/statelessness.feature [N] — cross-instance completion
│   ├── behaviours/config/production-guard.feature [N] — fail-closed production startup
│   ├── behaviours/providers/provider-seam.feature [N] — dormant provider seam
│   └── README.md [E] — contract/architecture navigation
├── repo-config.yml [E] — only scoped target/network metadata proven necessary
├── docs/reference/web-sites.md [E] — only exact local API/client ports delivered here
├── apps/ose-id-be/behaviour-coverage.json [N] — static Unit/Integration/E2E adapter map
└── apps/ose-id-be-e2e/behaviour-coverage.json [N] — built-process adapter map
```

### More Detail

Phase 0 reconciles these proposed paths with the delivered Init 03 layout before freezing the ledger;
an equivalent existing file replaces, rather than duplicates, a proposed file. This plan does not edit `ose-id-web`, LMS source,
deployment workflows, Kubernetes files, production environment files, or any Google/Facebook surface.
If a repository rule or enforcement surface must change, delivery invokes the full rules-propagation
workflow for that concrete rule rather than treating this tree as authority to edit governance.
