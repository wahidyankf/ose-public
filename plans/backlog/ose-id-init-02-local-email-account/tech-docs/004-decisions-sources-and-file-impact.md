# Decisions, Sources, and File Impact

## Decision Summary

| ID        | Decision                                                       | Consequence and revisit trigger                                                                        |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ACC-DD-01 | Backend-only email/password lifecycle                          | No end-user UI yet; later UI consumes application contracts                                            |
| ACC-DD-02 | Person exists without Company                                  | Personal accounts are real; company behavior waits for Plan 03                                         |
| ACC-DD-03 | ASP.NET Core Identity password hash/validation primitives only | Avoids custom crypto; no EF Identity store or `UserManager` persistence                                |
| ACC-DD-04 | Opaque server-side account sessions                            | Database lookup/state required; no product token confusion                                             |
| ACC-DD-05 | Typed notification port and Mailpit Local/Test adapter         | Deterministic email proof; production delivery remains unresolved by design                            |
| ACC-DD-06 | Shared PostgreSQL security/rate/session state                  | Supports stateless instances; revisit shared cache only with measured need                             |
| ACC-DD-07 | Inherit production-disabled guard                              | Safe main state; future deploy blocked on private K3s cluster plan and platform gates                  |
| ACC-DD-08 | Root MIT covers OSE source/docs; dependencies retain licenses  | Notices must reflect exact resolved third-party terms                                                  |
| ACC-DD-09 | SqlKata + Npgsql for all OSE-owned runtime persistence         | Visible SQL and explicit mapping; exact query, catalog, and plan tests offset weaker identifier typing |

## Alternatives

Passkeys, magic links, Google, and UI are viable later methods/surfaces, not substitutes for the requested
verified email/password baseline. A managed email sandbox was rejected because it needs network and
credentials. A process-local session was rejected because it breaks restart/horizontal scale. JWT
sessions were rejected because revocation/security-version behavior becomes less direct and could be
mistaken for future OAuth tokens.

SqlKata is selected for SQL visibility, predictable projections, and the absence of hidden change
tracking or lazy loading—not because a query builder automatically makes SQL faster. Its string table/
column identifiers provide weaker compile-time schema safety than a typed ORM model. Centralized
code-owned identifier allowlists, no `SELECT *`, compiled-SQL snapshot/contract tests, catalog-backed
Integration tests, and synthetic `EXPLAIN` budgets mitigate that cost. EF runtime persistence is rejected;
migration-time EF remains, and Plan 04 implements version-pinned custom OpenIddict stores over the same
SqlKata/Npgsql boundary so protocol data also obeys audit and soft-delete rules.

## Source Record

All sources were accessed on **2026-09-15**. Excerpts are short supporting evidence; Phase 0 re-verifies exact versions and flags.

| Confidence   | Supported claim                                                                       | Supporting excerpt                                                                                 | Official URL                                                                                                                                                                 | Access date |
| ------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [Verified]   | PasswordHasher provides framework password hash/verify operations                     | “Implements the standard Identity password hashing”                                                | [PasswordHasher API](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.identity.passwordhasher-1)                                                            | 2026-09-15  |
| [Verified]   | SqlKata compiles parameterized SQL and its execution package supports Npgsql          | Query values are parameterized; `SqlKata.Execution` accepts an Npgsql connection                   | [SqlKata documentation](https://sqlkata.com/docs), [execution setup](https://sqlkata.com/docs/execution/setup)                                                               | 2026-09-15  |
| [Verified]   | Npgsql supports parameterized and asynchronous command execution                      | PostgreSQL parameters and asynchronous methods are documented                                      | [Npgsql basic usage](https://www.npgsql.org/doc/basic-usage.html)                                                                                                            | 2026-09-15  |
| [Verified]   | SqlKata uses MIT terms compatible with OSE-authored MIT distribution                  | The repository declares the MIT License                                                            | [SqlKata license](https://github.com/sqlkata/querybuilder/blob/master/LICENSE)                                                                                               | 2026-09-15  |
| [Verified]   | OpenIddict officially supports EF Core and custom stores                              | EF Core integration and custom stores are documented                                               | [OpenIddict EF Core integration](https://documentation.openiddict.com/integrations/entity-framework-core), [introduction](https://documentation.openiddict.com/introduction) | 2026-09-15  |
| [Verified]   | Npgsql's permissive license can accompany OSE's MIT source with notices retained      | Use, modification, and distribution are permitted subject to notices                               | [Npgsql license](https://github.com/npgsql/npgsql/blob/main/LICENSE)                                                                                                         | 2026-09-15  |
| [Verified]   | OpenIddict's Apache-2.0 packages can accompany OSE's MIT source with notices retained | The package declares `Apache-2.0`                                                                  | [OpenIddict package license](https://github.com/openiddict/openiddict-core/blob/dev/Directory.Build.props)                                                                   | 2026-09-15  |
| [Verified]   | Public authentication responses must resist enumeration                               | “An application should respond ... in a generic manner”                                            | [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)                                                           | 2026-09-15  |
| [Verified]   | Reset tokens must be random, linked, expiring, and single-use                         | “Randomly generated ... Linked to an individual user ... Invalidated after use”                    | [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)                                                         | 2026-09-15  |
| [Verified]   | Session identifiers require strict lifecycle protection                               | “The session ID is temporarily equivalent to the strongest authentication method used by the user” | [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)                                                   | 2026-09-15  |
| [Verified]   | Mailpit is a local email testing tool under its own MIT license                       | “An email and SMTP testing tool with API for developers”                                           | [Mailpit repository](https://github.com/axllent/mailpit)                                                                                                                     | 2026-09-15  |
| [Verified]   | Mailpit documents SMTP and web UI defaults/configuration                              | “By default, the web UI binds to port 8025 and SMTP server on port 1025”                           | [Mailpit usage](https://mailpit.axllent.org/docs/usage/)                                                                                                                     | 2026-09-15  |
| [Unverified] | Exact Identity token-provider behavior and Mailpit flags match resolved versions      | Verify installed binaries/packages before implementation                                           | [ASP.NET Core release notes](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0)                                                                    | 2026-09-15  |

The delivered Plan 01 schema, runner, runtime guard, and health contracts are [Verified] repository prior
art only after Phase 0 confirms their merge SHA on `origin/main`. Exact configuration remains
[Unverified] until that check; implementation stops rather than guessing.

## File-Impact Analysis

```text
.
├── plans/
│   ├── backlog/
│   │   ├── ose-id-init-02-local-email-account/ [D] — removed by the pure pre-execution promotion
│   │   └── README.md [E] — remove backlog entry at promotion
│   ├── in-progress/
│   │   ├── ose-id-init-02-local-email-account/ [D] — moved to done inside the delivering PR
│   │   └── README.md [E] — add at promotion, remove in the delivering PR
│   └── done/
│       ├── <completion-date>__ose-id-init-02-local-email-account/ [N] — exact moved plan/evidence
│       └── README.md [E] — add resolved completion-date entry in the delivering PR
├── apps/
│   ├── ose-id-be/ [E] — Person/email/password/capability/session source, Unit and Integration tests
│   ├── ose-id-be-e2e/ [E] — Mailpit, migration, API, concurrency, multi-instance, and cleanup E2E
│   ├── ose-id-web/README.md [E] — account UI remains disabled
│   └── ose-id-web-e2e/ [E] — only future-route absence regression
├── specs/apps/ose/
│   ├── README.md [E] — retain deployed-surface ownership index
│   └── id-be/
│       ├── README.md [E] — index account behavior/contracts
│       ├── behaviours/account/*.feature [N] — AC-ACC-01..09 account scenarios
│       ├── behaviours/persistence/account-soft-delete.feature [N] — AC-ACC-10 audit/retirement scenario
│       ├── contracts/account.openapi.yaml [N] — backend account API
│       └── architecture/account.md [N] — account/session/Mailpit boundary
├── package.json [E] — exact runner/dependency changes only
├── package-lock.json [G] — npm-generated lock resolution when package.json changes
├── repo-config.yml [E] — account behavior adapters, test ownership, and Mailpit ports
└── docs/reference/web-sites.md [E] — fixed Mailpit 1026/8026 reservations
```

### More Detail

No unbounded contract/coverage output is authorized. Static behavior coverage reads the exact
`specs/apps/ose/id-be/behaviours/account/*.feature` corpus and repository-configured adapter paths; any
generated artifact discovered at execution requires a ledger amendment before creation. Account
migrations are additive and remain on rollback. The tree excludes OIDC, Next.js account UI, providers,
company/RLS behavior, LMS, deployment, and sibling plan edits.
