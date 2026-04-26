# OrganicLever — Remove Google Auth

## Overview

Strip every Google OAuth touchpoint from the OrganicLever stack — backend code, frontend
client, OpenAPI contract, Gherkin specs, e2e suites, C4 diagrams, env wiring, and CI secret
references — until the surface is clean. Authentication is **out of scope** for OrganicLever
v0; it will be re-added in a future plan when an actual sign-in story is needed.

This is a deletion plan. Nothing replaces what is removed: there is no anonymous-auth
fallback, no placeholder identity layer, no stubbed `/auth/me`. The endpoints, files,
schemas, env vars, and tests vanish together so no half-wired auth surface remains to
mislead future contributors or the codegen.

**Status**: In Progress
**Branch / worktree**: `worktree-organiclever-remove-google-auth`
(per Subrepo Worktree Workflow — see [Git Workflow](#git-workflow))

## Scope

Modifications happen entirely inside `ose-public/`:

- `apps/organiclever-be/` — F# auth handlers, `GoogleAuthService`, JWT middleware,
  refresh-token repo paths, fsproj package refs, DB migration, test fixtures, BDD steps,
  `Dockerfile.integration` (remove `GOOGLE_CLIENT_ID` reference from comment).
- `apps/organiclever-be-e2e/` — Playwright steps for `google-login` / `me`, token store,
  README sections.
- `apps/organiclever-web/` — `auth-service.ts`, `lib/auth/cookies.ts`, `.env.local`
  client-id var, `Dockerfile` ARG/ENV.
- `apps/organiclever-web-e2e/` — Google Sign-In references in accessibility and
  disabled-routes step regexes.
- `specs/apps/organiclever/contracts/` — `paths/auth.yaml`, `schemas/auth.yaml`,
  `schemas/user.yaml`, `examples/auth-login.yaml`, root `openapi.yaml`, README adoption table.
- `specs/apps/organiclever/be/gherkin/` — `authentication/` feature dir, README counts.
- `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature` — drop `/login`,
  `/profile`, `/api/auth/*` rows or rewrite the feature so it stops referencing auth at all.
- `specs/apps/organiclever/c4/` — `container.md`, `context.md`, `component-be.md`,
  `component-fe.md`, `README.md` — remove auth components, update mappings.
- `.github/workflows/test-and-deploy-organiclever-web-development.yml` — drop
  `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env passthrough.

Not in scope:

- Removing the actual GitHub repository secrets (`GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`) — workflow stops reading them, secret cleanup is a manual ops
  step the human operator can do later.
- `next/font/google` import in `app/layout.tsx` — that is Google **Fonts**, not auth.
- Cookie infrastructure design for a future auth system — out of scope, tracked elsewhere.
- Anything outside `ose-public/`.

## Navigation

| Document                       | Contents                                        |
| ------------------------------ | ----------------------------------------------- |
| [brd.md](./brd.md)             | Why we are removing Google auth now             |
| [prd.md](./prd.md)             | Removal inventory + Gherkin acceptance criteria |
| [tech-docs.md](./tech-docs.md) | File-by-file changes, ordering, gotchas         |
| [delivery.md](./delivery.md)   | Step-by-step `- [ ]` checklist                  |

## Git Workflow

`ose-public` is gitlinked; per the Subrepo Worktree Workflow, all edits run inside
`ose-public/.claude/worktrees/organiclever-remove-google-auth/` on branch
`worktree-organiclever-remove-google-auth`. Work commits to that branch, pushes to
`origin`, surfaces as a draft PR against `wahidyankf/ose-public:main`. Parent-repo
gitlink bump (if any) waits until the subrepo PR merges.

Conventional Commits — types likely used: `chore`, `refactor`, `test`, `docs`, `ci`.
Split commits by domain: contracts, BE code, BE tests, FE code, FE e2e, BE e2e, C4 docs,
CI workflow.

## Phases at a Glance

| Phase | Scope                                                                         | Status |
| ----- | ----------------------------------------------------------------------------- | ------ |
| 0     | Worktree setup, doctor, baseline `nx affected -t typecheck lint test:quick`   | todo   |
| 1     | Specs — delete auth Gherkin, prune contracts, regenerate bundled OpenAPI      | todo   |
| 2     | BE code — delete auth handlers / services / middleware, edit Program.fs       | todo   |
| 3     | BE tests — delete auth steps / runners, prune fsproj, retune coverage filters | todo   |
| 4     | BE migration — drop `users` + `refresh_tokens` tables from initial schema     | todo   |
| 5     | FE code — delete `auth-service.ts`, `lib/auth/`, env var, Dockerfile ARG/ENV  | todo   |
| 6     | FE + BE e2e — delete `google-login` / `me` steps, prune disabled-routes specs | todo   |
| 7     | C4 docs — strip auth blocks, update component / container diagrams + README   | todo   |
| 8     | CI workflow — drop `GOOGLE_CLIENT_ID` / `_SECRET` env passthrough             | todo   |
| 9     | Final `nx affected -t typecheck lint test:quick spec-coverage`, archive plan  | todo   |
