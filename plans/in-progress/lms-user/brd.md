# Business Requirements — LMS User Identity Integration

## Business Goal

Give LMS users authenticated access through the shared OSE identity and company model without making
LMS another credential authority or weakening its ownership of learning-domain permissions.

## Why Now

The original LMS plan was the first concrete identity need, but its local password/JWT design would
create the silo that OSE ID is intended to prevent. The correct sequence is to deliver OSE ID first and
then integrate LMS as its first relying party and API resource.

## Business Outcomes

- One OSE account signs into LMS through the same identity authority future products can reuse.
- LMS stores no password, provider token, recovery secret, signing private key, or refresh-token family.
- A companyless person can enter LMS with a personal entitlement and no synthetic company.
- A company member enters LMS only when the active company grants LMS entitlement.
- LMS domain roles remain independently evolvable and cannot be escalated through an identity claim.
- Developers run the authenticated LMS journey locally through one deterministic owned stack.

## Affected Roles

| Role               | Need                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| Personal LMS user  | Predictable OSE ID sign-in without being forced into a company.            |
| LMS user           | Predictable OSE ID sign-in, context selection, logout, and errors.         |
| Multi-company user | Enter LMS under exactly one entitled active company and switch explicitly. |
| LMS developer      | One local target for LMS and every identity dependency.                    |
| LMS maintainer     | Standards-based validation with no credential/session implementation.      |
| Security operator  | Clear issuer/audience/tenant boundary and auditable denial.                |

## Success Measures

- End-to-end LMS login completes through OSE ID Authorization Code + PKCE and reaches a protected LMS
  resource in both an entitled personal context and a selected entitled company context.
- Wrong issuer, signature, audience, expiry, entitlement, context type, membership, or company context
  is denied.
- Repository searches and schema inspection find no LMS password hash, auth signing secret, local token
  issuer, refresh-token table, provider token, or credential endpoint.
- `(iss, sub)` remains the request principal key when email/profile data changes; this slice introduces
  no LMS profile table before a learning-domain feature needs one.
- The authenticated local stack, including the concrete `ose-lms-app-web` BFF and its session database,
  passes twice from clean state and leaves no owned resource.

## Business Non-Goals

- Implementing identity-provider features in LMS.
- Moving instructor/learner/course permissions to OSE ID.
- Production rollout or forcing other apps to integrate in the same delivery.
- Replacing OSE ID's company-admin area with an LMS membership console.

## Risks and Mitigations

| Risk                                         | Consequence                                   | Mitigation                                                                                          |
| -------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Stale tenant/entitlement claim               | Removed member keeps temporary access         | Short upstream token life plus reauthorization/revocation policy for sensitive operations           |
| Email used as local key                      | Profile change duplicates or hijacks identity | Unique `(issuer, subject)` mapping; email is display/contact only                                   |
| LMS trusts broad token                       | Cross-client token substitution               | Exact issuer, signature, algorithm, audience, time, entitlement, and company validation             |
| OSE ID unavailable locally                   | Developers bypass authentication              | Clear dependency error; composed local stack; no debug principal/header/password fallback           |
| Domain roles leak into shared ID             | Product coupling and escalation               | LMS-local role tables/policies after identity and tenant validation                                 |
| Personal users are forced into a fake tenant | False tenancy and isolation semantics         | Discriminated personal/company context; personal rows are person-scoped and contain no `company_id` |
