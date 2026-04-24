# Plan: Adopt Portless for Local Development

## Status

**In Progress** | Started: 2026-04-24 | Scope: `ose-public`

## Problem

Running the same app in two parallel git worktrees fails immediately: both
instances bind the same hardcoded port. Example — two concurrent `wahidyankf-web`
dev servers both attempt port 3201. The second one dies. There is no way to run
`main` + `feature-branch` side-by-side today.

Hardcoded ports in `project.json` also mean every new contributor must manually
audit and resolve collisions when running more than two apps simultaneously.

## Solution

Adopt [`portless`](https://github.com/vercel-labs/portless) (v0.10.3,
Vercel Labs) as a dev dependency. Portless replaces hardcoded `localhost:<port>`
URLs with stable named `.localhost` URLs:

- `https://wahidyankf-web.localhost` (main worktree)
- `https://adopt-portless.wahidyankf-web.localhost` (feature worktree)

Each app gets an ephemeral random port (4000–4999) injected as `PORT` env var;
portless proxies it through the stable named URL. Git worktree branch names
become automatic subdomains — zero config, zero collision.

## Scope

**In scope:**

- Install portless as dev dependency in root `package.json`
- Update `dev` Nx target in `project.json` for all 4 Next.js apps:
  `oseplatform-web`, `ayokoding-web`, `organiclever-web`, `wahidyankf-web`
- Add `allowedDevOrigins` to `next.config.ts` for each app (required by
  Next.js 15+)
- Add portless proxy alias for `organiclever-be` (port 8202)
- Update `CLAUDE.md` with new dev URLs and proxy startup instructions
- Update `governance/development/workflow/worktree-setup.md` with portless
  one-time setup steps (`portless trust`, `portless proxy start`)
- Document Safari `/etc/hosts` workaround

**Out of scope:**

- Docker Compose configuration (container ports are unrelated)
- CI/CD pipelines (portless explicitly fails fast in CI — correct behavior)
- Production environment configuration
- `storybook` target (separate concern, address later)
- `organiclever-be` full portless integration (F# Giraffe; alias-only for now)

## Documents

| Document                       | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| [README.md](./README.md)       | This file — overview and navigation                  |
| [brd.md](./brd.md)             | Business rationale and goals                         |
| [prd.md](./prd.md)             | Product requirements and Gherkin acceptance criteria |
| [tech-docs.md](./tech-docs.md) | Implementation details and file-by-file changes      |
| [delivery.md](./delivery.md)   | Step-by-step delivery checklist                      |

## URL Mapping (after adoption)

| App                | Main worktree URL                    | Feature worktree URL (branch: `adopt-portless`)     |
| ------------------ | ------------------------------------ | --------------------------------------------------- |
| `oseplatform-web`  | `https://oseplatform-web.localhost`  | `https://adopt-portless.oseplatform-web.localhost`  |
| `ayokoding-web`    | `https://ayokoding-web.localhost`    | `https://adopt-portless.ayokoding-web.localhost`    |
| `organiclever-web` | `https://organiclever-web.localhost` | `https://adopt-portless.organiclever-web.localhost` |
| `wahidyankf-web`   | `https://wahidyankf-web.localhost`   | `https://adopt-portless.wahidyankf-web.localhost`   |
| `organiclever-be`  | `https://organiclever-be.localhost`  | `https://adopt-portless.organiclever-be.localhost`  |

## Related

- [portless GitHub](https://github.com/vercel-labs/portless)
- [governance/development/workflow/worktree-setup.md](../../../governance/development/workflow/worktree-setup.md)
