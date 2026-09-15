# Local APIs, Statelessness, and Verification

## API Areas

Use the repository versioning convention. Logical areas are:

- `/account/contexts`: list/evaluate personal and company contexts for a fixture product;
- `/companies/{companyId}/members`: list and membership state/authority mutations;
- `/companies/{companyId}/invitations`: create/list/resend/revoke;
- invitation acceptance endpoint bound to authenticated Person plus capability;
- `/companies/{companyId}/entitlements`: list/grant/revoke product entry;
- test-only bootstrap commands for company/product/fixture setup, unreachable in normal host.

Every cookie-authenticated mutation uses Plan 02's CSRF/recent-session policy. Sensitive admin actions
may require recent authentication. IDs from paths/bodies are selectors only; use cases re-resolve them
under current Person/company/RLS state.

An authorized MembershipAdmin directory projection includes a member's opaque Person/Membership IDs,
current verified contact email, membership status, authority, and row version. Invitation projections
include the intended recipient email, status, intended authority, expiry, and row version. The contact
fields exist so an admin can distinguish people and invitations; provider subjects, login IDs,
credentials, session state, capabilities/digests, private global fields, and foreign-tenant contacts are
excluded. Contact emails are response-only allowlisted data and never enter logs, traces, metrics, or
audit payloads.

## Stateless Instance Requirements

Company/membership/invitation/entitlement/context/audit/rate-limit state is shared in PostgreSQL. No
instance remembers the active company or admin authority. A request through B must reject immediately
after A suspends a membership. Local multi-instance E2E alternates list, invitation, accept, entitlement,
evaluation, suspension, and denial operations without affinity.

## Local Stack Fixtures

Extend the Plan 02 runner; do not add a second orchestration path. Seed through compile/runtime-isolated
E2E fixtures:

- `ose-id-web` stays on `http://127.0.0.1:3500` through `OSE_ID_WEB_PORT=3500`;
- `ose-id-be` stays on `http://127.0.0.1:8501` through `OSE_ID_BE_PORT=8501`;
- PostgreSQL stays on `127.0.0.1:5438` through `OSE_ID_POSTGRES_PORT=5438`;
- Mailpit SMTP stays on `127.0.0.1:1026` through `OSE_ID_MAILPIT_SMTP_PORT=1026`;
- Mailpit UI/API stays on `http://127.0.0.1:8026` through `OSE_ID_MAILPIT_UI_PORT=8026`.

Phase 0 proves all five registry/live reservations are still free and stops to amend the plan on a
collision. This plan adds no listener and never silently selects another default.

- active verified Persons: companyless, A member/admin, B member/admin, multi-company;
- Companies A/B with opaque IDs and shared-store keys;
- resources: personal-only, company-only, and both;
- active/inactive personal/company entitlements;
- pending/expired/revoked invitations.

Fixtures are synthetic and scenario-isolated. Cleanup removes database state and Mailpit messages with
the owned run. No bootstrap endpoint appears in production route discovery.

## Verification Matrix

| Concern                                    | Unit       | Integration           | Backend E2E                      |
| ------------------------------------------ | ---------- | --------------------- | -------------------------------- |
| Membership/invitation state and last admin | Yes        | Yes                   | concurrency/constraint           |
| Context eligibility/selection              | Yes        | Yes                   | two instances/current data       |
| RLS select/write/join/soft-delete          | policy map | schema/adapter wiring | mandatory real PostgreSQL        |
| Pool context reset                         | lifecycle  | controlled Npgsql     | mandatory real pool/database     |
| Invitation email                           | typed fake | adapter wiring        | Mailpit SMTP/API                 |
| Admin roster query/cursor/disclosure/CSRF  | mapping    | indexed pipeline      | multi-page/misuse/negative cases |
| Tenant-store resolver                      | Yes        | Yes                   | shared target/missing route      |

## Compiled-SQL and Query-Plan Gate

Every persistence operation has a named manifest entry containing its explicit projection, closed
identifier set, parameter names/types, transaction/RLS requirement, deterministic order, expected
index, maximum rows fetched, and exact allowed affected-row count. Unit tests snapshot normalized
SqlKata-compiled PostgreSQL SQL and reject `SELECT *`, literal request values, missing tenant/status/
version predicates, or an unbounded read. Integration tests execute the compiled query with the real
Npgsql adapter/application role and compare projection mappings against the live catalog.

Seed at least 10,000 synthetic rows per exercised table, split across Companies A/B, personal scope,
terminal/deleted state, and the target page. Record `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for
read-only paths. Use `EXPLAIN (FORMAT JSON)` for mutations, or `ANALYZE` only inside an always-rolled-back
transaction. Point queries return at most one row; member/invitation/entitlement pages fetch at most
`limit + 1` (maximum 101); context enumeration returns at most 100; each conditional mutation affects
zero or one business row plus its declared audit insert. The plan must show the named index in the
physical schema contract and no sequential scan on those index-bound synthetic paths. Timing is recorded
for diagnostics, but the portable gate is query shape/index/row count—not a claim that SqlKata is
inherently faster than EF.

## Manual API Verification

1. Start clean stack and seed synthetic Persons/Companies/resources through E2E fixture tooling.
2. Prove companyless Person gets personal context and no company row.
3. Invite an existing/new Person, inspect Mailpit, register/verify if needed, accept once, and prove reuse fails.
4. Filter and page Company A members by a literal verified-email prefix as A admin; verify deterministic
   email/ID order, recognizable verified/recipient contacts, no private identity/capability fields, and
   rejection when the cursor is reused with Company B or a different filter. Then attempt Company B
   guessed IDs and record denial.
5. Exercise suspension/reactivation, authority transfer, and last-admin conflict.
6. Grant/revoke personal and company entitlements; observe fresh context eligibility changes.
7. Run direct runtime-role RLS probes for missing/A/B/stale contexts across every tenant table/operation.
8. Reuse pooled connections A→B→personal and inspect only safe counts/statuses.
9. Alternate operations across two backend instances and stop one mid-journey.
10. Capture compiled-SQL snapshots and the synthetic `EXPLAIN` evidence above; fail on a wildcard,
    non-allowlisted identifier, parameter interpolation, missing RLS transaction, wrong index, or row-budget excess.
11. Scan logs/evidence for contact emails, secrets, invitation links, raw cookies, foreign tenant data,
    and host paths; separately verify response allowlists contain contact email only on authorized
    same-company member/invitation directory operations.
12. Stop and verify empty process/container/network/volume/message/port inventory.

## Failure and Recovery

- RLS/policy uncertainty is fail-closed: tenant endpoints remain disabled until fresh database proof passes.
- Mailpit failure blocks new invitation send/resend but does not corrupt existing membership.
- Concurrent acceptance/admin mutation uses database constraints/transaction isolation and stable conflicts.
- Database outage removes account/company readiness while liveness remains useful.
- Cleanup failure is reported separately and must be repaired at root cause before rerun.
