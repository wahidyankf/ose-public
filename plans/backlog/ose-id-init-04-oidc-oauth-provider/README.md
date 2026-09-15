# OSE ID Init 04 — OIDC and OAuth Provider

> **Status:** Backlog — execute only after `ose-id-init-03-company-tenancy-core` is complete and this plan has
> moved to `plans/in-progress/` through a plan-only PR merged to `origin/main`.

Turn the verified local identity from Init 03 into a standards-based local identity provider. This
slice configures OpenIddict on `ose-id-be`, registers explicit clients and resources, implements
Authorization Code with PKCE S256, produces purpose-separated ID and access tokens, persists consent,
and proves signing-key rotation. It does not build the polished first-party web experience; Init 05
will render the backend-owned authorization transaction.

## Scope

- OpenID Connect discovery, authorization, token, end-session, revocation, and JWKS endpoints in the
  C# backend. UserInfo and refresh-token issuance are not enabled in this milestone.
- Authorization Code only, with mandatory PKCE `S256`, exact redirect URIs, OIDC nonce, and client
  state/correlation expectations.
- One local synthetic OSE LMS BFF client, one LMS API resource, exact scopes, and audience-restricted
  access tokens.
- Minimal claims for either `personal` or exactly one `company` authorization context.
- Backend consent and context-selection contracts that Init 05 can render without owning policy.
- Asymmetric local signing keys with active/verify-only overlap and negative key tests.
- Stateless backend instances: authorization codes, grants, consent, and keys live in shared stores,
  never process memory or local disk.
- OSE ID source/docs inherit the repository root MIT license; third-party components retain their own
  licenses.

## Non-Goals

- Production deployment, DNS, Kubernetes, cloud key custody, production certificates, or production
  client registrations. Those wait for the Kubernetes platform planned in the private sibling.
- Next.js sign-in, consent, context, or account-security UI; Init 05 owns those screens. This slice
  owns only the backend-rendered `GET /connect/logout` confirmation/cancellation surface required to
  prevent logout-by-GET.
- Google, Facebook, or another upstream provider. This slice creates only the provider seam.
- Passkeys, TOTP, or recovery codes; Init 06 owns them.
- Product-domain roles or LMS implementation.

## Dependency and Result

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Gray #808080
flowchart TD
  accTitle: Init 04 dependency and result
  accDescr: The completed company tenancy core milestone enables this OIDC provider milestone. It creates a local issuer contract used by the later first-party web and LMS integration milestones.
  A["Init 03 tenancy core"] --> B["04 OIDC provider"]
  B --> C["05 First-party web"]
  B --> D["Later LMS client"]
  B -. "production remains off" .-> E["Future Kubernetes delivery"]

  classDef prior fill:#808080,stroke:#000000,color:#000000,stroke-width:2px
  classDef current fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef later fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  class A prior
  class B current
  class C,D,E later
```

Every arrow is a dependency, not an instruction to deploy. After this plan, `main` contains a complete
localhost issuer that fails closed outside explicit local/test mode.

## Navigation

- [Business requirements](brd.md)
- [Product requirements and acceptance criteria](prd.md)
- [Technical design](tech-docs/README.md)
- [Delivery checklist](delivery.md)
- [Execution learnings](learnings.md)

## Related Milestones

- Successor: [first-party web](../ose-id-init-05-first-party-web/README.md).
- Production deployment remains blocked at minimum on
  `private-sibling/plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` and then-current
  platform handoff gates.
