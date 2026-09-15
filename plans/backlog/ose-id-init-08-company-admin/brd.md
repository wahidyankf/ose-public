# Business Requirements — OSE ID Init 08 Company Administration

## Business Goal

Let a delegated company administrator manage who belongs to one company and which OSE products those
members may enter, without granting any cross-company or product-domain authority.

## Problem

Plan 03 supplies company-scoped membership, invitation, and entitlement APIs, but people still need a
safe and usable way to invoke them. A broad superadmin console would create a much larger trust boundary
than company self-service needs. The smallest responsible slice is a company-scoped BFF and UI inside
the existing identity web application, with no new domain or persistence ownership.

## Business Outcomes

1. An authorized company admin can use an accessible screen to view and invoke the Plan 03 operations
   for only their active company.
2. Invitation states and locally delivered Mailpit messages are understandable without exposing raw
   capabilities or reimplementing invitation rules in the browser/BFF.
3. The UI distinguishes entry entitlements from product roles and submits only Plan 03-supported fields.
4. Denial, last-admin conflict, stale mutation, and cross-company results from Plan 03 are rendered safely.
5. The screens remain usable by keyboard, assistive technology, and mobile users.
6. No C# domain/API/persistence/migration/RLS change is needed to ship this slice.

## Affected Roles

| Role                  | Need                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| Company administrator | Invite, review, suspend, reactivate, and entitle members in one active company. |
| Invited person        | Receive and accept one clear, secure company invitation.                        |
| Ordinary member       | Remain unable to view or mutate company administration.                         |
| Multi-company admin   | Reauthorize/switch context explicitly before managing another company.          |
| Product team          | Rely on entitlement facts while retaining domain-role ownership.                |
| Security reviewer     | Prove the BFF/UI preserves Plan 03 authorization and leaks no tenant data.      |

## Success Measures

- BFF contract tests cover allowlisted projection and safe mapping of Plan 03 success, denial, not-found,
  validation, stale-version, recent-auth, and last-admin responses.
- Browser tests cover create/resend/revoke invitation and entitlement/member actions by invoking the
  existing Plan 03 API, never a duplicate domain implementation.
- UI tests cover empty/loading/error/paginated member states and responsive table-to-card behavior at
  375, 768, and 1280 CSS px.
- No web route, adapter, view model, log, response, or browser store exposes another company's data or
  provider/credential/global-audit fields.

## Options and Tradeoffs

| Option                           | Benefits                                                       | Costs and risks                                                                        | Decision                        |
| -------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| `/admin/company` in `ose-id-web` | Reuses session, design system, backend policy, and local stack | Requires strong logical route/authorization separation                                 | **Selected**                    |
| Separate company-admin app       | Strong deployable boundary                                     | Adds fifth project/client/session/E2E/deployment surface without a distinct trust role | Rejected for now                |
| Platform superadmin console      | Central operational power                                      | Cross-company blast radius, impersonation/key/audit concerns                           | Deferred to a separate plan/app |
| Database-only operations         | No UI work                                                     | Unsafe, unauditable, and unusable for delegated administrators                         | Rejected                        |

## Risks and Controls

| Risk                       | Consequence                     | Control                                                                        |
| -------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| Client-selected tenant     | Cross-company access            | BFF forwards server session context; Plan 03 remains the authority             |
| Predicted domain outcome   | UI disagrees with current state | Render authoritative API result/conflict; never duplicate Plan 03 rules        |
| Invitation data leakage    | Capability/account exposure     | Allowlisted projection; never return raw capability/provider/credential fields |
| Entitlement/role confusion | Excessive product access        | UI submits only Plan 03 entry-entitlement fields; product roles remain local   |
| Email list disclosure      | Privacy breach                  | Least-data projection, scoped queries, generic errors, audit redaction         |
| Broad console creep        | Platform-wide privilege surface | Explicit route/API/non-goal checks and file-impact boundary                    |

## Licensing and Deployment Boundary

OSE-authored source and docs inherit the root MIT license. Third-party UI, email, database, and testing
components retain their licenses and require audit evidence.

This plan stops at deterministic local operation. The separate production deployment plan cannot begin
until the private Kubernetes plan `start-infra-04-deploy-tencent-lighthouse-k3s-cluster` and all
then-current platform, security, email, key, observability, backup, and handoff gates complete.
