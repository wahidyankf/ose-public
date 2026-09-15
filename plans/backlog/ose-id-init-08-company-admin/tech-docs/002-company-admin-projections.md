# 002 — Company-Admin Projections

## Ownership Rule

Plan 03 is the sole owner of company, membership, invitation, entitlement, authorization, audit,
persistence, migration, and PostgreSQL RLS behavior. Plan 08 creates a presentation adapter only. It does
not extend aggregates, commands, API operations, schema, or RLS. If an operation required by the PRD is
absent from the delivered Plan 03 API, execution stops for dependency correction.

## Allowlisted View Models

| View model                      | Permitted shape                                                                                        | Explicit exclusions                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `CompanyAdminContextView`       | company display label; current authority/status; navigation availability                               | arbitrary company selector, legal/internal fields, global identifiers |
| `CompanyMemberListItemView`     | opaque membership identifier/version, verified contact email, membership status, company authority     | provider subjects, credentials, recovery/device/IP data, global audit |
| `CompanyMemberDetailView`       | list fields plus only the status/authority actions supported by the company API                        | product-domain roles/permissions, inferred policy, invented profile   |
| `CompanyInvitationListItemView` | recipient email, status, intended company authority, expiry time, opaque invitation identifier/version | raw capability/link token, hash, internal audit metadata              |
| `CompanyEntitlementView`        | registered product identifier/label and current entry state                                            | product role/permission fields                                        |
| `CompanyAdminProblemView`       | safe code, localized summary, field issues, recovery action, correlation value safe for users          | upstream body, exception, SQL/tenant detail, account-existence hint   |

The BFF maps rather than mirrors upstream DTOs. Unknown fields are dropped. Unknown problem/status values
fail closed to a generic recoverable error. Browser values never select authority or active company.

## Existing Operation Mapping

The adapter uses only the Plan 03 routes resolved in Phase 0: contexts, company members, company
invitations and acceptance, and company entitlements. Create/resend/revoke/suspend/reactivate/grant/revoke
actions submit only the established request fields and concurrency/version token. The UI always renders
the authoritative returned result; it does not reproduce last-admin, expiry, invitation, entitlement,
recent-auth, or RLS rules.

Consume the Plan 05 backend client surface as delivered. Because this plan changes no **backend**
OpenAPI operation, it does not regenerate that client. It adds the separately owned
`specs/apps/ose/id-web/contracts/company-admin.openapi.yaml` for the running BFF contract and validates
its handler/runtime-schema boundary. If the delivered backend client cannot express a required
projection, stop and amend the plan instead of expanding the backend or generated-file boundary
implicitly.

## State and Cache Rules

- Server session context is the only call context.
- Authorization/tenant outcomes are never cached in client state or a Next.js process.
- Optimistic UI may display pending affordance but may not commit a predicted domain result.
- Error recovery refetches current state after conflicts.
- `localStorage` and `sessionStorage` hold no token, company dataset, invitation capability, provider
  subject, or upstream response.
- No persistence migration is permitted.

## Source Confidence

- **[Repo-grounded]** Plan 03's delivered API and archived terminal evidence are authoritative; Phase 0
  resolves exact paths because backlog plans may move on completion.
- **[Repo-grounded]** Plan 05's delivered session/BFF conventions are authoritative for adapter placement.
- **[Judgment call]** Named view models are the minimum presentation boundary; Phase 0 may adjust names to
  repository conventions without broadening fields or ownership.
