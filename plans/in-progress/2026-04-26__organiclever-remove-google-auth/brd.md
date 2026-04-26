# BRD — Remove Google Auth from OrganicLever

## Why now

OrganicLever v0 is a **local-first life-event tracker** (see
[`2026-04-25__organiclever-web-app`](../2026-04-25__organiclever-web-app/README.md)). The
v0 storyboard has zero authenticated screens: every event log, workout, routine, and
analytics view is meant to live in the user's browser via `localStorage`, behind the
landing page CTA. There is no remote sync, no shared account, no protected route.

The Google OAuth surface that exists today (`/api/v1/auth/google`, `/api/v1/auth/refresh`,
`/api/v1/auth/me`, `Login Page`, `Auth Guard`, `Auth Proxy Routes`, `GoogleAuthService`,
JWT middleware, `users` + `refresh_tokens` tables, FE `AuthService`, env client id, CI
secret passthrough) was scaffolded as part of the original `organiclever-be` bring-up
and the C4 docs reflect that intent. None of it is wired up to a real product flow today,
and the v0 plan does not consume any of it.

Keeping it costs more than removing it:

1. **Drift risk** — auth code that nobody uses rots. The next contributor extending
   `organiclever-be` (e.g. for the workout sync feature) will land on a broken auth
   pipeline and either spend hours fixing it or work around it badly.
2. **Test surface area** — auth feature files and step defs run on every push. They
   pin a contract that v0 does not honor, and the `users` / `refresh_tokens` tables show
   up in every integration-test DB reset.
3. **Mental model pollution** — C4 diagrams claim "Google OAuth login" and
   "Protected user profile" are part of the current product. Onboarding contributors read
   that and ask wrong questions.
4. **Secret hygiene** — `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` flow through a
   workflow that does not need them, increasing the leakage blast radius.

Removing now is cheap; removing later (after more code accretes around the dead
endpoints) is not.

## Goals

- Delete every Google-OAuth-related file, scenario, and reference inside
  `apps/organiclever-*` and `specs/apps/organiclever/`.
- Reduce the `organiclever-be` build to: health endpoint + (optional) test reset
  endpoint. Nothing else survives that requires auth.
- Reduce the OpenAPI contract to one tag (`Health`) until auth is intentionally
  re-introduced.
- Keep all gates green (`nx affected -t typecheck lint test:quick spec-coverage`,
  link checking, BDD spec coverage).

## Non-goals

- Designing a replacement auth scheme.
- Touching repo-level secrets in GitHub.
- Removing `next/font/google` (Google Fonts ≠ Google auth).
- Touching anything outside `ose-public/`.

## Success criteria

1. `grep -rli "google" apps/organiclever-* specs/apps/organiclever` returns only
   matches in `next/font/google`, generated artefacts (`.next/`, `bin/`, `obj/`,
   `node_modules/`), or unrelated text — never a runtime, contract, or test reference.
2. `nx affected -t typecheck lint test:quick spec-coverage` passes against `main`
   after the worktree merges.
3. The bundled OpenAPI contains exactly the `Health` tag and the
   `/api/v1/health` path; the `Authentication` tag and `auth.yaml` schema are gone.
4. C4 diagrams render and describe only what the codebase actually contains.
5. The merged PR description records that the GitHub repository secrets
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) can be deleted by a human operator —
   the workflow no longer reads them.

## Business Risks

| Risk                                                                                                                                | Likelihood                                                | Mitigation                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Compounding auth rot — dead auth code grows harder to remove as more code accretes around the stale endpoints                       | Medium (each plan that touches the BE increases risk)     | Remove now while the surface is isolated and small                                                    |
| Future contributor confusion — onboarders read C4 diagrams and assume Google OAuth is live, then spend hours diagnosing a non-issue | High (diagrams are the first thing new contributors read) | Delete diagrams and specs in the same PR as the code                                                  |
| Missed reference leaves a broken import or compile error post-merge                                                                 | Low (thorough phase-by-phase typecheck gates)             | Per-phase `nx run organiclever-be:typecheck` gates catch references before they reach `main`          |
| Secret leakage blast radius — unused GitHub secrets remain accessible to any workflow that requests them                            | Low (secrets already exist; risk is static)               | PR description instructs operator to delete `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` after merge |

## Affected Roles

- **OrganicLever maintainer** — executes the worktree; directly responsible for all
  deletion and verification steps.
- **Any contributor reading BE or FE code next** — benefits from a clean surface; no
  longer encounters dead auth handlers, misleading C4 diagrams, or stale env vars.
