# BeaverNest App Setup

## Status

**CLOSED — delivered-as-descoped (2026-08-10).** Carried from `beaver-nest`'s own
`plans/in-progress/beaver-nest-app-setup/` into `ose-public` by the `beaver-nest-repo-consolidation`
plan's Phase 4, at 72.5% completion (279 of 385 delivery checkboxes ticked). Phases 0-5 shipped and
are reflected in `ose-public`'s ported `beavernest-be`/`beavernest-app-web` apps: the generalized
governance real-database testing rules (Phase 1), the SQLite + DbUp migration + recovery backend and
readiness contract (Phases 2-3), and the Vite client-side-rendered SPA migration with the combined
same-origin Compose runtime (Phases 4-5). **Did not ship**: Phase 6 (human runtime attestation and
full-story hardening), Phase 7 (Knowledge Capture), and Phase 8 (archival, plus the Unit 3 PR/merge)
— Phases 4-6 had already reached `beaver-nest`'s `main` by direct push before this plan stalled, so
no PR #3 ever opened, the PR-review cycles never ran against it, and the branch and worktrees behind
it are gone. This disposition closes the plan rather than resuming it: its remaining real work —
picking BeaverNest's first stateful product feature — was represented by the carried
`beavernest-persistence-layer` idea brief, so nothing is lost by stopping here.

**Superseded 2026-08-21.** BeaverNest left this repository for
[`beaver-nest`](https://github.com/wahidyankf/beaver-nest); the `beavernest-*` apps, specs, dev
stack, and the `beavernest-persistence-layer` brief were all removed here. This plan is retained
only as a record of what ran while BeaverNest lived in `ose-public`. See
[Related Repositories](../../../docs/reference/related-repositories.md#beavernest-moved-out).

> The body below is retained verbatim as a historical record of what this plan targeted while it
> executed inside `beaver-nest`, before the port and rename — it still says `beaver-nest-be`/
> `beaver-nest-fe`, not `beavernest-be`/`beavernest-app-web`, and still cites `plans/ideas/` paths
> that predate this repo's Eisenhower-quadrant reorganization. That is expected and left unedited.

## Context

[Repo-grounded] BeaverNest currently has a stateless F#/Giraffe backend and a Next.js page that
performs backend data fetching in an async Server Component. The local Compose stack publishes the
frontend on port `19310` and the backend on port `19320`; the backend has no database.

[Judgment call] This plan replaces that walking skeleton with a local-first application foundation for
an individual or a small trusted group. It runs on one host behind an existing encrypted VPN, uses
one shared workspace without application authentication, stores state in SQLite, and renders the
web client entirely in the browser.

This plan resolves the SQLite foundation prerequisite referenced by
`plans/ideas/beaver-nest-persistence-layer.md`; that brief remains active for the first concrete
feature that durably stores and retrieves product data. Its former PostgreSQL sketch is replaced by
the user-selected SQLite architecture. Deploy provisioning remains a separate idea because this
plan creates no public, staging, Vercel, k3s, DNS, or VPN infrastructure.

## Scope

### In scope

- Migrate `beaver-nest-fe` from Next.js to a Vite + React client-side-rendered SPA while preserving
  its project name and BeaverNest design tokens.
- Replace the promotional landing page with a minimal private workspace home containing an
  accessible readiness panel and neutral empty state.
- Remove the obsolete greeting UI and `GET /api/v1/hello` API.
- Add `GET /api/v1/readiness` while retaining `GET /api/v1/health` as liveness.
- Add an infrastructure-only SQLite database, explicit DbUp SQL migrations, WAL, foreign-key
  enforcement, finite busy timeout, and no domain tables.
- Use no ORM. Use parameterized SQL directly; introduce a query builder only when a later concrete
  feature demonstrates a need.
- Produce one Compose-managed runtime container: ASP.NET/Giraffe serves the built SPA and the API
  on one origin, mounts a durable operator-owned production directory outside the repository, and
  never shares it with the explicit local-development SQLite directory.
- Publish the application only on a configured VPN host address over HTTP inside the encrypted VPN;
  source-peer isolation remains an external VPN/firewall responsibility.
- Add verified manual backup and restore tooling using SQLite's provider-aware online backup.
- Generalize canonical database-testing guidance from PostgreSQL-specific wording to the real
  production database selected by each app.
- Align OpenAPI, Gherkin, C4/spec documentation, Nx targets, tests, E2E suites, app documentation,
  and local runtime documentation with the target architecture.

### Out of scope

- Assistant, LLM, capture, notes, drafts, posting, scheduling, or workflow-engine features.
- Domain tables, domain repositories, query-builder selection, ORM adoption, or per-user ownership.
- Application login, individual accounts, roles, authorization, or VPN-derived identity.
- VPN provisioning, public internet exposure, HTTPS certificate provisioning, DNS, staging or
  production deployment/provisioning targets, Vercel, k3s, or horizontal replicas. The local
  production-mode image/runtime remains in scope.
- Network filesystems or direct SQLite access by clients.
- Automatic backup scheduling or retention management.
- Redesigning the established BeaverNest brand tokens.

## Resolved Decisions

| Concern           | Decision                                                                         |
| ----------------- | -------------------------------------------------------------------------------- |
| Product increment | Local-first foundation only                                                      |
| Trust model       | Existing VPN; one trusted shared workspace; no app auth                          |
| Database          | SQLite on one local host                                                         |
| Persisted schema  | Migration journal only; no product/domain tables                                 |
| Data access       | No ORM; explicit parameterized SQL; query builder only if later needed           |
| Migration runner  | `dbup-sqlite` with ordered plain SQL and fatal startup failure                   |
| Frontend          | Vite + React SPA; client-side rendering only                                     |
| Origin            | ASP.NET/Giraffe serves SPA and `/api/*` from one origin                          |
| Runtime           | One Docker Compose application container                                         |
| Network           | HTTP bound to an explicit existing VPN host address                              |
| Ports             | Local Vite/API `19310`/`19320`; production public app `19300`                    |
| Durable data      | Explicit local-development directory; distinct bind-mounted production directory |
| Backup            | Verified manual backup/restore plus operator off-host-copy attestation           |
| Workspace UI      | Compact header, centered readiness panel, neutral empty state                    |
| Theme             | Existing BeaverNest tokens with system light/dark preference                     |
| Delivery          | `worktree-to-pr`; three sequential delivery units                                |

## Approach Summary

The implementation follows a serial three-unit spine because each unit changes the foundation
relied on by the next:

1. Generalize the repository's real-database testing rules without changing application contracts.
2. Add the SQLite/migration/readiness contract, companion specs, backend foundation, and
   real-database tests while temporarily retaining the greeting route used by the current frontend.
3. Land the target frontend/routing specs, migrate to Vite, retire greeting atomically, integrate
   static hosting into the backend image, harden Compose, verify the VPN-facing flow, capture
   knowledge, and archive the plan in the final PR.

## Documents

- [Business requirements](./brd.md)
- [Product requirements and UI design funnel](./prd.md)
- [Technical architecture and decisions](./tech-docs.md)
- [Executable delivery checklist](./delivery.md)
- [Running learnings log](./learnings.md)

## Affected Projects

- `beaver-nest-contracts`
- `beaver-nest-be`
- `beaver-nest-be-e2e`
- `beaver-nest-fe`
- `beaver-nest-fe-e2e`
- `rhino-cli` only as an existing validation dependency; no planned source change

## Definition of Done

The archived plan artifact reaches **Delivery Ready** after implementation, evidence, knowledge
capture, and pre-PR archival gates are green, before the final delivery-unit PR opens. The delivery
workflow terminates only after all three PRs are green, fully reviewed, up to date, satisfy the
hardened merge preconditions, and `[AI]` merges them in dependency order; post-merge verification is
recorded in executor state without an unauthorized status-only mutation. The delivered behavior must
let a VPN peer use the CSR status screen
through the single exact-address publication, publish no wildcard/LAN/public/loopback destination,
survive an application restart, demonstrate backup/restore, align companion specs/canonical docs,
triage all learnings, and archive the plan inside the final delivery PR. Explicitly retaining clean
worktrees after a declined cleanup prompt is a valid terminal state.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
