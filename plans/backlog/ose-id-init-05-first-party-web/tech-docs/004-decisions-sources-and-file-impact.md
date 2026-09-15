# Decisions, Sources, and File Impact

## Decisions and Tradeoffs

### DR-05-01 — Next.js BFF plus UI

**Selected:** a separate Next.js `ose-id-web` reuses repository UI/i18n/testing systems while keeping
browser tokens server-side. A SPA is simpler to host but enlarges browser-token risk. ASP.NET-rendered
pages reduce one network boundary but duplicate the OSE web system and selected design. Revisit only if
the BFF/backend split creates measured reliability or security cost that shared components cannot offset.

### DR-05-02 — Identifier first

**Selected:** Option A from the PRD. It is direct for the email-only slice and supports future methods
without asking for company knowledge before identity. Method-first is viable when several methods are
equally primary but adds a redundant step now. Company-first is rejected for personal-access and
privacy reasons. Revisit after multiple providers ship and usability evidence shows discovery problems.

### DR-05-03 — Hide undelivered methods

**Selected:** future passkey/Google elements in the trajectory board are absent until implemented.
Disabled/coming-soon controls create dead ends; a fake local implementation lies about security.
Facebook remains excluded. Later milestones extend the same composition.

### DR-05-04 — Shared session state, stateless web

**Selected:** an opaque cookie resolves the dedicated PostgreSQL-backed `ose_id_web.web_session` state
through a server-only Kysely + `pg` adapter and least-privilege web runtime role. Kysely is a TypeScript
SQL query builder, not an ORM; explicit projections, predicates, transactions, compiled-SQL tests, and
bounded query plans remain mandatory. Signed self-contained browser state reduces store calls but
risks stale authority and larger cookies; instance-local sessions require affinity. Redis adds another
consistency/operational dependency without a measured need. Phase 0 may detect a predecessor collision
but does not choose the mechanism; changing the selected store requires a plan amendment and no-loss
contract.

### DR-05-05 — Local-only and MIT

OSE-authored web source/docs inherit the root MIT license; third-party components retain their own
licenses. Production deployment is intentionally absent and blocked at minimum on
`private-sibling/plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` plus then-current
platform handoff gates. Production mode rejects local settings before listen.

## Primary Source and Prior-Art Record

All external sources were accessed on **2026-09-15**. Excerpts are intentionally short evidence for a
design boundary; execution still rereads the current official page.

| Confidence | Official source                                                                                                                | Short supporting excerpt                                          | Design use                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| [Verified] | [Next.js App Router](https://nextjs.org/docs/app)                                                                              | “file-system based router”                                        | Route groups and server/client composition                   |
| [Verified] | [WCAG 2.2](https://www.w3.org/TR/WCAG22/)                                                                                      | “success criteria are written as testable statements”             | Accessibility contract and evidence matrix                   |
| [Verified] | [WCAG accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)           | “support for password entry by password managers”                 | Paste/autofill and cognitive-accessibility requirements      |
| [Verified] | [Microsoft Entra username lookup](https://learn.microsoft.com/en-us/entra/identity/users/signin-realm-discovery)               | “reading organization and user settings for the username entered” | External prior art for identifier-first progression          |
| [Verified] | [GOV.UK One Login](https://www.gov.uk/using-your-gov-uk-one-login)                                                             | “change your sign in details”                                     | External prior art for one first-party account-security home |
| [Verified] | [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)                 | “Session ID properties”                                           | Opaque cookie/session boundary                               |
| [Verified] | [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) | “Synchronizer Token Pattern”                                      | Same-origin state-changing BFF commands                      |
| [Verified] | [Kysely documentation](https://kysely.dev/)                                                                                    | Type-safe SQL query builder with PostgreSQL support               | Server-only explicit web-session persistence                 |
| [Verified] | [Repository root license](../../../../LICENSE)                                                                                 | “MIT License”                                                     | OSE-authored source/docs inherit root MIT                    |

Repository prior art is `libs/web-ui`, OSE tokens, Storybook, sibling app shells, and the numbered Init
04 predecessor's archived as-built evidence. Phase 0 inventories them at the delivered head and records
each reused/new component with [Verified] confidence.

Framework APIs and component inventory are **medium confidence** until Phase 0 verifies current
versions/paths. Security, accessibility, personal/company, and local-only invariants are **high
confidence**.

## File-Impact Analysis

```text
.
├── plans/
│   ├── in-progress/ose-id-init-05-first-party-web/ [E] — delivery record moved in the delivering PR
│   ├── in-progress/README.md [E] — remove active-plan entry in the delivering PR
│   ├── done/<completion-date>__ose-id-init-05-first-party-web/ [N] — archived plan/assets/evidence
│   └── done/README.md [E] — add completion entry in the delivering PR
├── apps/
│   ├── ose-id-web/src/app/(auth)/sign-in/page.tsx [N] — identifier-first sign-in
│   ├── ose-id-web/src/app/(auth)/verify-email/page.tsx [N] — Init 02 verification presentation
│   ├── ose-id-web/src/app/(auth)/recover/page.tsx [N] — Init 02 recovery presentation
│   ├── ose-id-web/src/app/(authorize)/context/page.tsx [N] — personal/company choice
│   ├── ose-id-web/src/app/(authorize)/consent/page.tsx [N] — client/scope decision
│   ├── ose-id-web/src/app/(account)/security/page.tsx [E] — delivered-method security view
│   ├── ose-id-web/src/app/(account)/sessions/page.tsx [N] — current session view/actions
│   ├── ose-id-web/src/features/identity/identity-shell.tsx [N] — stable accessible shell
│   ├── ose-id-web/src/features/identity/authorization-context-picker.tsx [N] — opaque context choices
│   ├── ose-id-web/src/features/identity/consent-summary.tsx [N] — exact client/scope rendering
│   ├── ose-id-web/src/features/identity/error-summary.tsx [N] — focusable error/status behavior
│   ├── ose-id-web/src/server/session/opaque-session-store.ts [N] — shared session adapter
│   ├── ose-id-web/src/server/session/postgres-session-store.ts [N] — PostgreSQL implementation
│   ├── ose-id-web/src/server/migrations/runner.ts [N] — advisory-lock/checksum versioned-SQL runner
│   ├── ose-id-web/src/server/session/cookie-policy.ts [N] — browser cookie boundary
│   ├── ose-id-web/db/migrations/0001-web-session.sql [N] — additive history/session schema, guards, and role grants
│   ├── ose-id-web/project.json [E] — add `migrate:local` target and Kysely/pg quality inputs
│   ├── ose-id-web/src/middleware.ts [E] — navigation only; never sole authorization
│   ├── ose-id-web/tests/identity.test.tsx [N] — component/a11y/security Unit tests
│   ├── ose-id-web-e2e/src/identity/authorization.steps.ts [N] — built-browser journeys
│   ├── ose-id-web-e2e/project.json [E] — `serve-local`, cleanup, and E2E target wiring
│   └── ose-id-be/src/OseIdBe/Authorization/WebContract/AuthorizationWebContract.cs [E] — accepted narrow contract corrections only
├── specs/apps/ose/id-web/
│   ├── contracts/openapi.yaml [N] — machine-readable same-origin BFF HTTP contract
│   ├── behaviours/sign-in/email-sign-in.feature [N] — email journey
│   ├── behaviours/sign-in/enumeration-safety.feature [N] — safe public guidance
│   ├── behaviours/sign-in/method-availability.feature [N] — delivered methods only
│   ├── behaviours/authorization/context-selection.feature [N] — personal/company choices
│   ├── behaviours/authorization/consent.feature [N] — allow/cancel callback
│   ├── behaviours/security/browser-artifacts.feature [N] — browser secret absence
│   ├── behaviours/accessibility/authorization-journey.feature [N] — responsive keyboard flow
│   ├── behaviours/runtime/statelessness.feature [N] — instance replacement
│   ├── behaviours/session/web-session-soft-delete.feature [N] — auditable terminal-session cleanup
│   ├── behaviours/config/production-guard.feature [N] — fail-closed startup
│   └── README.md [E] — web behavior navigation
├── apps/ose-id-web/behaviour-coverage.json [N] — static Unit/Integration/E2E adapter map
├── repo-config.yml [E] — scoped project/test/network registry changes only
├── docs/reference/web-sites.md [E] — scoped local web/session/test ports only
└── apps/ose-id-web-e2e/behaviour-coverage.json [N] — built-browser adapter map
```

### More Detail

Phase 0 reconciles these proposed paths against the delivered Init 04 layout. It may rename a proposed
path to the delivered repository convention, but it must preserve the table, role, migration, and
no-loss contract from document 007; an existing conflicting session mechanism blocks RED until the plan
is amended. Any governance/rule change triggers full rules propagation. This plan excludes
social-provider code/config/assets, passkey/MFA code, company admin, LMS source, deployment workflows/
manifests, production environment files, and the private sibling edits.
