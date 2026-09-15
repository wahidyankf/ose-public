# Entitlements and Authorization Contexts

## Responsibility Split

OSE ID owns whether a Person may enter a registered product in personal context or through an active
company membership. The product owns what that Person can do after entry. Therefore OSE ID may store
`LMS enabled for Person P` or `LMS enabled for Company A`, but never learner, instructor, course owner,
auditor, billing role, or product permission.

## Product Resource Policy

A local fixture registers a product resource key, allowed context kinds (`personal`, `company`, or
both), and entitlement policy. Public product onboarding/client registration is deferred to a protocol
plan. The resource key is stable and non-secret.

Personal entitlement is `(PersonId, ProductKey, status, version/audit)`. Company entitlement is
`(CompanyId, ProductKey, status, version/audit)`. Company access additionally requires active Company,
active Membership, and active Person. A future membership-specific entitlement may be added only if a
real product requires it; it is not generalized now.

## Discriminated Context

```text
AccessContext = Personal(PersonId)
              | Company(PersonId, CompanyId, MembershipId)
```

The future token representation is reserved but not emitted here:

- personal: `context_type=personal`, no `company_id`;
- company: `context_type=company`, exactly one `company_id`.

This plan's application result includes context kind, opaque company ID/display label where authorized,
resource, and freshness/version data required by a future protocol service. It does not create a JWT,
grant, consent, OIDC session, or browser token.

## Evaluation Algorithm

1. Validate current Plan 02 account session and active Person/security version.
2. Load the registered resource policy.
3. If personal is allowed, evaluate current personal entitlement.
4. If company is allowed, list current active memberships visible to the Person.
5. For each membership, evaluate Company status and company entitlement under tenant context.
6. Return separate minimal eligible choices; do not auto-combine or infer a company from email/domain.
7. On selection, accept only the context kind/opaque ID as a request.
8. Re-evaluate every condition in a fresh transaction and return one current context or safe rejection.

## Selection and Switching

No global “active company” column is stored on Person. A selected context belongs to a future client
authorization/session, not the human forever. This backend core may return an evaluation result and
audit it, but does not persist an OIDC client selection. Concurrent evaluations are independent.

Removing membership/entitlement or suspending Company increments an authorization version/event so a
later protocol implementation can revoke/re-authorize grants. Until that plan exists, E2E proves fresh
evaluation rejects immediately and the invalidation signal is durable.

## Failure Semantics

- Unknown/ineligible requested company uses non-disclosing not-found/forbidden semantics defined by API.
- A company-required resource with no company returns a clear no-eligible-context result, not account failure.
- A personal-disabled resource never manufactures company membership.
- An entitlement never bypasses account, company, or membership state.
- Another tenant's display name/count does not leak through eligible-context or admin results.

## Alternatives

Putting all eligible companies into one token was rejected because a request could accidentally cross
company boundaries and revocation becomes unclear. Storing current company on Person was rejected
because concurrent products/tabs legitimately need different contexts. Product-local entitlement was
not selected for this identity-entry fact because each product would need to rediscover company access,
but product-local domain roles remain mandatory.
