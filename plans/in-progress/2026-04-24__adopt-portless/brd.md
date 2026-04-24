# BRD: Adopt Portless for Local Development

## Business Problem

### Worktree parallelism is blocked by port conflicts

OSE Platform's git workflow uses named worktrees (`<subrepo>/.claude/worktrees/<name>/`) to enable parallel feature development and plan execution. Each worktree runs on a dedicated branch. When a developer (or AI agent) needs to compare `main` against a feature branch — or when two plans execute concurrently — they must start the same app in two different worktrees simultaneously.

Today this is impossible. All four Next.js apps have hardcoded ports in `project.json`. Two instances of `wahidyankf-web` cannot both bind port 3201. The second process dies immediately.

### Current state causes downstream problems

1. **Parallel plan execution blocked**: The `plan-execution` workflow creates worktrees for isolation. If a plan executor and a developer both `nx dev wahidyankf-web` from different worktrees, one silently fails.
2. **Visual regression comparison impossible**: Comparing UI changes between `main` and a feature branch requires running both simultaneously — currently cannot be done.
3. **Contributor friction**: New contributors running more than one app face manual port-management overhead. Port documentation lives only in `CLAUDE.md` prose, not machine-enforced.
4. **No HTTPS in local dev**: All apps run HTTP on localhost. Some browser features (secure cookies, Web Crypto, PWA service workers) require HTTPS. Production runs HTTPS (Vercel); local dev does not. This gap causes hard-to-reproduce bugs.

## Goals

| ID  | Goal                                                                           |
| --- | ------------------------------------------------------------------------------ |
| G-1 | Any app can run simultaneously in two or more worktrees without port conflicts |
| G-2 | Dev URLs are stable, named, and memorable (not `localhost:3201`)               |
| G-3 | Local dev runs HTTPS, matching production Vercel environment                   |
| G-4 | No manual port management for contributors                                     |
| G-5 | Zero change to CI pipelines or Docker Compose configuration                    |

## Non-Goals

| ID   | Non-Goal                                                     | Reason                                                                     |
| ---- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| NG-1 | Change production URLs or Vercel config                      | Portless is dev-only; `PORTLESS=0` in CI                                   |
| NG-2 | Port management for Docker Compose                           | Container networking is separate concern                                   |
| NG-3 | Full portless integration for `organiclever-be` (F# Giraffe) | ASP.NET Core binds its own URLs; alias proxy is sufficient for dev         |
| NG-4 | Support for Windows contributors                             | Not a current platform target; portless Windows cert trust is undocumented |

## Success Criteria

- Developer can run `nx dev wahidyankf-web` from `main` worktree AND from `adopt-portless` worktree simultaneously — both accessible in browser without conflict
- Dev URLs resolve in Chrome/Firefox/Edge without `/etc/hosts` changes
- `CLAUDE.md` and `worktree-setup.md` reflect new workflow
- All pre-push hooks pass after adoption (no regressions)

## Risks and Mitigations

| Risk                                                                        | Likelihood | Impact | Mitigation                                                                                                   |
| --------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| portless is pre-1.0 (v0.10.3) — breaking API changes possible               | Medium     | Low    | Pin exact version in `package.json`; document upgrade process                                                |
| `portless proxy start` must run before `nx dev` — forgotten by contributors | High       | Medium | Add proxy startup to `worktree-setup.md` doctor step; document in CLAUDE.md                                  |
| Safari requires `/etc/hosts` sync for `.localhost` subdomains               | High       | Low    | Document `portless hosts sync` in setup guide; Chrome/Firefox work without it                                |
| `@nx/next` dev server executor may override `PORT` env var                  | Low        | High   | Verify during implementation; fallback to explicit `portless wahidyankf-web next dev --port $PORT` if needed |
| Port 443 requires `sudo` on first proxy start                               | Certain    | Low    | One-time; auto-elevation. Document in setup guide.                                                           |

## Stakeholders

- **Primary**: Developers (human + AI agents) running parallel worktrees
- **Secondary**: New contributors setting up local environment
- **Tertiary**: CI pipelines (no change expected; portless no-ops in CI)
