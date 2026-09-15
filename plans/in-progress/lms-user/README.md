# LMS Username and Password Authentication

**Status:** In Progress — planning complete; implementation has not started

**Delivery mode:** `worktree-to-pr`

Add registration and authentication to `apps/ose-lms-be` for direct API consumers, mobile apps,
and web clients that call through a backend-for-frontend (BFF). An account is identified only by a
username and password. Successful login returns a short-lived JWT access token and a rotating opaque
refresh token; PostgreSQL stores users, session families, refresh-token digests, and throttle state.

The design deliberately validates every access token against its persisted session family. JWT
signature validation still prevents token forgery, while the database check makes logout and
refresh-token replay revocation effective immediately. [Judgment call]

## Scope

In scope: create-only registration, login, protected access, refresh rotation, current-session
logout, PostgreSQL persistence and migrations, configurable throttling, RFC 9457 errors, canonical
specifications and OpenAPI, Unit/Integration/E2E coverage, manual API verification, and supporting
documentation and repository configuration.

Out of scope: email, profile data, roles, authorization policies beyond authenticated/anonymous,
MFA, password reset, account verification, OAuth/social login, direct browser-to-LMS authentication,
and a maximum-device or maximum-login limit. The previously discussed three-device cap is withdrawn:
the API MUST NOT accept a device identifier, count devices, evict an older session, or cap concurrent
session families.

## Approach Summary

1. Extend Gherkin and OpenAPI first, preserving a reproducible RED state before production code.
2. Add Flyway-managed PostgreSQL persistence and a Testcontainers Integration boundary.
3. Deliver registration, login/JWT access, refresh/logout revocation, and throttling as separate
   RED→GREEN→REFACTOR slices.
4. Complete real-process E2E, manual `curl`, API exploratory testing, documentation, and PR gates.

## Navigation

- [Business requirements](./brd.md) — why the capability matters and its business boundaries
- [Product requirements](./prd.md) — public behavior, user stories, and canonical acceptance criteria
- [Technical design](./tech-docs.md) — architecture, data model, security decisions, and file impact
- [Delivery plan](./delivery.md) — ordered execution checklist, phase gates, and evidence requirements
- [Learnings](./learnings.md) — transient observations collected during execution

## Related

- [Current LMS backend](../../../apps/ose-lms-be/README.md) [Repo-grounded]
- [Canonical LMS backend specifications](../../../specs/apps/ose/lms-be/README.md) [Repo-grounded]
- [BDD standard](../../../repo-governance/development/behaviour-driven-development.md) [Repo-grounded]
