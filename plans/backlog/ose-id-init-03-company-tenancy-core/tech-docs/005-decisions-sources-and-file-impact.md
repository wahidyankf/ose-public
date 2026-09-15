# Decisions, Sources, and File Impact

## Decision Summary

| ID        | Decision                                                     | Consequence and revisit trigger                                                                            |
| --------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| TEN-DD-01 | Company is an optional tenant, never a Person container      | Personal accounts require explicit context branch                                                          |
| TEN-DD-02 | Multi-company Membership with Member/MembershipAdmin only    | More context tests; custom/platform roles deferred                                                         |
| TEN-DD-03 | Shared PostgreSQL RLS under non-bypass runtime role          | Policy/pool complexity accepted for defense in depth                                                       |
| TEN-DD-04 | Transaction-local subject/company context                    | Every tenant repository operation needs explicit transaction                                               |
| TEN-DD-05 | Personal and company entitlements; product roles local       | OSE ID governs entry, not domain authorization                                                             |
| TEN-DD-06 | Context evaluation now, OIDC token issuance later            | Safe backend seam but no product integration yet                                                           |
| TEN-DD-07 | Narrow shared-store resolver                                 | Preserves future dedicated stores without building sharding                                                |
| TEN-DD-08 | Company/product creation is test bootstrap only              | Public onboarding remains a later product decision                                                         |
| TEN-DD-09 | Inherit Local/Test-only guard; no deployment                 | Future deploy blocked on private K3s plan and platform handoff gates                                       |
| TEN-DD-10 | Root MIT covers OSE source/docs; third parties keep licenses | Exact notices remain dependency-specific                                                                   |
| TEN-DD-11 | Admin roster exposes tenant contact and bounded prefix query | Recognizable, pageable people without private/cross-tenant identity                                        |
| TEN-DD-12 | SqlKata + Npgsql for OSE-owned tenant persistence            | Visible SQL/RLS/transactions; centralized identifiers and query-plan contracts offset weaker schema typing |

## Alternatives

Application filters alone and synthetic personal tenants are rejected as unsafe/semantically false.
Database-per-company is a valid future isolation option but lacks a current operational driver and would
require routing, fleet migrations, backups, copy/cutover, and rollback. Central product roles are
rejected because they couple identity to every product's changing authorization model. A platform
operator console is higher blast radius and excluded.

For administrator directory identity, opaque IDs alone were rejected because admins could not reliably
distinguish people. A new mutable profile/display-name field was deferred because the account schema has
no profile lifecycle and this slice should not invent one. The selected narrow projection reads a
member's active verified `email_logins.email_display` and an invitation's stored normalized recipient
email only after same-company MembershipAdmin authorization. Revisit when an explicit profile/contact-
preference plan defines display names or restricts administrative contact disclosure.

Loaded-page browser filtering was rejected because it produces incomplete results across cursors.
Cross-company/global search was rejected because it expands disclosure and authorization scope. The
selected backend filter is a bounded literal prefix over normalized verified email, ordered by email and
Membership ID, with an opaque cursor bound to company/filter/order. Invitation search is deferred because
the known admin consumer requires invitation pagination and actions but not cross-page invitation filtering.

SqlKata is chosen for visible SQL/projections and explicit Npgsql connection, RLS-context, and transaction
ownership. It does not automatically generate faster SQL. Its string identifiers are less schema-safe at
compile time than typed ORM expressions, so the implementation centralizes allowlisted identifiers,
forbids `SELECT *`, snapshots exact compiled SQL/bindings, tests projections against live PostgreSQL
catalogs, and records synthetic `EXPLAIN` index/row-budget evidence. The benefit is predictability and no
hidden change tracking/lazy loading, not a blanket benchmark claim. EF remains migration-time tooling.
Plan 04's version-pinned custom OpenIddict stores use the same query-builder/Npgsql boundary and cannot
access OSE domain tables.

## Source Record

All sources were accessed on **2026-09-15**. Excerpts directly support the physical isolation and concurrency choices.

| Confidence   | Supported claim                                                                       | Supporting excerpt                                                            | Official URL                                                                                                                                                                 | Access date |
| ------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [Verified]   | Enabled RLS defaults to policy-controlled access                                      | “all normal access to the table ... must be allowed by a row security policy” | [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)                                                                                      | 2026-09-15  |
| [Verified]   | Transaction-local tenant values end with the transaction                              | “The effects of SET LOCAL last only till the end of the current transaction”  | [PostgreSQL SET](https://www.postgresql.org/docs/current/sql-set.html)                                                                                                       | 2026-09-15  |
| [Verified]   | Npgsql pools connections by default, requiring context-reset proof                    | “By default, pooling is enabled”                                              | [Npgsql connection pooling](https://www.npgsql.org/doc/basic-usage.html#pooling)                                                                                             | 2026-09-15  |
| [Verified]   | Tenant context must not be trusted from an unvalidated client selector                | “Never trust tenant IDs from client input without validation”                 | [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)                                             | 2026-09-15  |
| [Verified]   | SqlKata parameterizes values and compiles query objects for PostgreSQL                | Values are stored in bindings and PostgreSQL compilation is documented        | [SqlKata documentation](https://sqlkata.com/docs)                                                                                                                            | 2026-09-15  |
| [Verified]   | SqlKata.Execution supports Npgsql connections                                         | An Npgsql connection is an official setup option                              | [SqlKata execution setup](https://sqlkata.com/docs/execution/setup)                                                                                                          | 2026-09-15  |
| [Verified]   | Npgsql supports parameters, async execution, and explicit transactions                | Data-source, command, parameter, async, and transaction APIs are documented   | [Npgsql basic usage](https://www.npgsql.org/doc/basic-usage.html)                                                                                                            | 2026-09-15  |
| [Verified]   | SqlKata is MIT-compatible                                                             | The project declares the MIT License                                          | [SqlKata license](https://github.com/sqlkata/querybuilder/blob/master/LICENSE)                                                                                               | 2026-09-15  |
| [Verified]   | OpenIddict supports an official EF adapter and custom stores                          | Both EF integration and custom-store extensibility are documented             | [OpenIddict EF Core integration](https://documentation.openiddict.com/integrations/entity-framework-core), [introduction](https://documentation.openiddict.com/introduction) | 2026-09-15  |
| [Verified]   | Npgsql's permissive license can accompany OSE's MIT source with notices retained      | Use, modification, and distribution are permitted subject to notices          | [Npgsql license](https://github.com/npgsql/npgsql/blob/main/LICENSE)                                                                                                         | 2026-09-15  |
| [Verified]   | OpenIddict's Apache-2.0 packages can accompany OSE's MIT source with notices retained | The package declares `Apache-2.0`                                             | [OpenIddict package license](https://github.com/openiddict/openiddict-core/blob/dev/Directory.Build.props)                                                                   | 2026-09-15  |
| [Unverified] | Exact resolved SqlKata/Npgsql APIs and compiled SQL match the manifests               | Inspect compiled SQL, parameters, catalogs, and plans before GREEN            | [SqlKata execution](https://sqlkata.com/docs/execution)                                                                                                                      | 2026-09-15  |

Delivered Plans 01/02 are [Verified] repository prior art only after Phase 0 checks their merge SHAs,
terminal audits, schema manifests, and current `origin/main` files. Personal/company semantics and RLS
principles have high confidence; resolved query-builder/driver APIs and compiled SQL conformance to the exact
policy contract remain [Unverified] until live generation/catalog verification.

## File-Impact Analysis

```text
.
├── plans/
│   ├── backlog/
│   │   ├── ose-id-init-03-company-tenancy-core/ [D] — removed by the pure pre-execution promotion
│   │   └── README.md [E] — remove backlog entry at promotion
│   ├── in-progress/
│   │   ├── ose-id-init-03-company-tenancy-core/ [D] — moved to done inside the delivering PR
│   │   └── README.md [E] — add at promotion, remove in the delivering PR
│   └── done/
│       ├── <completion-date>__ose-id-init-03-company-tenancy-core/ [N] — exact moved plan/evidence
│       └── README.md [E] — add resolved completion-date entry in the delivering PR
├── apps/
│   ├── ose-id-be/ [E] — company/membership/invitation/entitlement/context/RLS source and tests
│   ├── ose-id-be-e2e/ [E] — fixtures, invitation Mailpit, RLS/pool/concurrency/multi-instance E2E
│   ├── ose-id-web/README.md [E] — company UI remains disabled
│   └── ose-id-web-e2e/ [E] — only disabled-route regression
├── specs/apps/ose/
│   ├── README.md [E] — retain deployed-surface ownership index
│   └── id-be/
│       ├── README.md [E] — index tenancy behavior/contracts
│       ├── behaviours/tenancy/*.feature [N] — AC-TEN-01..11 tenancy scenarios
│       ├── behaviours/persistence/tenancy-soft-delete.feature [N] — AC-TEN-12 audit/retirement scenario
│       ├── contracts/tenancy.openapi.yaml [N] — backend tenancy API
│       └── architecture/tenancy.md [N] — membership/context/RLS boundaries
├── repo-config.yml [E] — tenancy behavior adapters and E2E/RLS ownership
└── docs/reference/web-sites.md [E] — verify inherited fixed local reservations only
```

### More Detail

No unbounded generated contract/coverage output is authorized. Static behavior coverage reads the exact
owner corpus and configured adapter paths; a newly discovered output/path requires a ledger amendment.
Migrations/policies are additive and forward-repaired. The tree excludes company/admin UI, OIDC/token
claims, LMS, providers, production email/deployment/Kubernetes, database-per-company machinery,
platform-admin APIs, and sibling plan edits.
