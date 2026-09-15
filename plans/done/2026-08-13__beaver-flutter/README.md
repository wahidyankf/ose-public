# BeaverNest Flutter Web Client

**Status**: Done
**Completed**: 2026-08-13

## Context

[Repo-grounded] `beavernest-app-web` is a Vite/React client that renders a Foundation status panel
and calls same-origin `GET /api/v1/readiness`. Its production files are copied into
`beavernest-be`'s `wwwroot`; local development uses Vite on port `19310` and the backend on
`19320`.

This plan replaces that client with `apps/beavernest-app`, a Flutter Web application. It preserves
the single-origin deployment and turns the readiness screen into a status-first operational Web
surface with a safe backend diagnostics snapshot.

## Execution Prerequisite

This plan is **blocked from execution** until the cross-repository
the private sibling `restrict-env-access-to-prod-and-stag` plan is genuinely complete.
[Repo-grounded: checked 2026-08-13] Its `ose-public` implementation is merged as PR #176, but a
dated archive path alone is not enough: an archive can retain an `In Progress` status or unresolved
delivery checklist. Executing this Flutter replacement before semantic completion would race or
silently inherit an unfinished environment-tier and agent-access contract for the existing BeaverNest
projects.

Completion is not inferred from a path, check box, or PR description. Before this plan's Phase 0
begins, its executor must verify that the upstream plan is archived under `private-sibling/plans/done/`
on `main`, absent from `plans/in-progress/`, has a recognized terminal README status (`Done`,
`Complete`, or `Completed`), and has no unchecked delivery items. It must also verify that the
corresponding `ose-public` implementation PR is merged and reachable from `origin/main`; record the
resolved private archive path, private and public `main` SHAs, and public PR/merge commit in this
plan's Phase 0 evidence. Only then may this plan create its first delivery branch or alter BeaverNest
code.

## Scope

In scope:

- Atomic replacement of the Vite/React project, its E2E project, and their spec identities with
  Flutter Web `beavernest-app` identities.
- Repo-pinned FVM tooling, a Flutter Web build, generated Dart API types, and same-origin browser
  runtime proof.
- The Foundation status, loading/unavailable/retry behavior, and a safe diagnostics snapshot.
- A new safe `GET /api/v1/diagnostics` contract and backend implementation.
- Browser-specific install-as-app guidance for supported browsers, without claiming PWA guarantees.

Out of scope:

- macOS, Android, iOS, Windows, Linux, native endpoint profiles, native local history, app signing,
  distribution, app stores, CORS, authentication, service discovery, and telemetry. Standards-compliant
  PWA installation, service workers, offline support, and immediate auto-update are also out of scope
  until a private HTTPS delivery plan exists. These require later, separate plans after the Flutter Web
  migration is stable.

## Resolved Decisions

| Concern         | Decision                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------- |
| Current target  | Flutter Web only                                                                              |
| Future targets  | macOS and Android in a later separate plan                                                    |
| Web connection  | Same-origin relative `/api` only                                                              |
| Client behavior | Status-first readiness plus safe diagnostics view                                             |
| Contract        | Generated Dart SDK from OpenAPI via a Dart-native generator selected by a compatibility spike |
| App structure   | Lightweight hexagonal architecture: pure domain and use cases behind explicit ports/adapters  |
| SDK             | Exact FVM pin                                                                                 |
| Cutover         | Strict atomic replacement; approved exception to the default feature-flag rollout             |
| Phone install   | Browser-specific install-as-app shortcut only; no PWA guarantee on production HTTP            |
| Update model    | Fresh assets on normal navigation via cache policy; no service-worker immediate auto-update   |

## Approach Summary

The delivery proves a Dart-native OpenAPI generator and pins the Flutter toolchain, extends the
backend contract safely, builds the Flutter Web client with TDD, and atomically removes every live
Vite/React frontend reference. The generated client is confined to outer platform adapters: Flutter
widgets call application use cases, which depend on explicit repository ports and pure domain models.
A later plan may add native adapters only after this Web baseline is merged and independently stable. This
delivery starts only after the environment-access predecessor has semantically completed, been
archived, and landed its public implementation on `origin/main`.

## Documents

- [Business requirements](./brd.md)
- [Product requirements and UI design funnel](./prd.md)
- [Technical design](./tech-docs.md)
- [Delivery checklist](./delivery.md)
- [Running learnings log](./learnings.md)
- [Visual-asset inventory](./assets/README.md)

## Definition of Done

`beavernest-app` is the only BeaverNest frontend project identity. Its Flutter Web bundle is served
same-origin by `beavernest-be`; status, retry, and safe diagnostics behavior have matching Gherkin,
unit, integration, and browser proof; and no live Vite/React source, test suite, project reference,
or Docker copy path remains.
