# Technical Design — OSE ID Init 07 Google Federation

## Purpose

These documents explain how Google becomes one external authenticator behind an OSE-owned federation
boundary. They assume plans 01–05 have already delivered the C# backend, PostgreSQL identity model,
personal/company context, OIDC/OAuth provider, Next.js BFF, and first-party email UI.

## Document Map

1. [Provider boundary and runtime flow](001-provider-boundary-and-runtime-flow.md)
2. [Google adapter and account linking](002-google-adapter-and-account-linking.md)
3. [Fake provider and verification](003-fake-provider-and-verification.md)
4. [Decisions, security, and file impact](004-decisions-security-and-file-impact.md)
5. [BDD spec delta and adapter map](005-bdd-spec-delta-and-adapter-map.md)
6. [Physical schema and migration contract](006-physical-schema-and-migration-contract.md)
7. [API contract delta](007-api-contract-delta.md)

## Non-Negotiable Contracts

- Google authenticates an external account; OSE ID remains the issuer and authorization authority.
- The stable link key is provider issuer plus provider subject, never email.
- The normalized provider port carries only allowlisted claims needed by OSE account policy.
- The fake provider cannot start or register outside explicit local/test execution.
- Provider state survives instance changes; no sticky session or process-local correlation store exists.
- Only Google ships. The abstraction must not produce Facebook artifacts or speculative providers.
- OSE-authored code/docs inherit root MIT; dependencies retain and disclose their own licenses.
- Deployment is absent and remains gated by the private Kubernetes prerequisite and later handoff gates.

## Traceability

| Product area                               | Technical owner       |
| ------------------------------------------ | --------------------- |
| Google initiation and callback             | Documents 001 and 002 |
| Link/unlink and collision policy           | Document 002          |
| Adversarial provider behavior              | Document 003          |
| Runtime guards and rollback                | Documents 003 and 004 |
| File scope and alternatives                | Document 004          |
| Canonical Gherkin and test layers          | Document 005          |
| Exact tables, migration, and no-loss proof | Document 006          |
| Backend, BFF, callback, and page contracts | Document 007          |
