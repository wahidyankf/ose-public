# Tech Docs: Adopt Portless for Local Development

## Architecture Overview

```
Developer / AI Agent
        │
        ▼
  portless proxy (port 443, local CA HTTPS)
        │
        ├── wahidyankf-web.localhost ──────────► next dev (PORT=4xxx, random)
        ├── oseplatform-web.localhost ─────────► next dev (PORT=4xxx, random)
        ├── ayokoding-web.localhost ───────────► next dev (PORT=4xxx, random)
        ├── organiclever-web.localhost ────────► next dev (PORT=4xxx, random)
        └── organiclever-be.localhost ─────────► static alias → :8202
```

In a worktree (branch `adopt-portless`):

```
adopt-portless.wahidyankf-web.localhost ──► next dev (PORT=4yyy, different random)
```

Both routes coexist. No port collision.

## Installation

Add to root `package.json` `devDependencies`:

```json
"portless": "^0.10.3"
```

Then `npm install`. Portless binary lands at `node_modules/.bin/portless`.

**One-time machine setup** (each developer runs once):

```bash
# Generates local CA and trusts it system-wide (requires sudo on macOS)
npx portless trust

# Start the HTTPS proxy daemon (runs in background, survives shell exit)
npx portless proxy start
```

Add `npx portless proxy start` to your shell login profile (`~/.zshrc`) to
auto-start on login, or run it manually at the start of each dev session.

## Per-App Changes

### 1. project.json — dev target

**Pattern**: Remove `--port XXXX`, wrap command with `portless <name>`.

The `start` target (production server) keeps its hardcoded port — portless is
dev-only.

#### apps/oseplatform-web/project.json

```json
// Before
"dev": {
  "command": "next dev --port 3100"
}

// After
"dev": {
  "command": "portless oseplatform-web next dev"
}
```

#### apps/ayokoding-web/project.json

```json
// Before
"dev": {
  "command": "next dev --port 3101"
}

// After
"dev": {
  "command": "portless ayokoding-web next dev"
}
```

#### apps/organiclever-web/project.json

```json
// Before
"dev": {
  "command": "next dev --port 3200"
}

// After
"dev": {
  "command": "portless organiclever-web next dev"
}
```

#### apps/wahidyankf-web/project.json

```json
// Before
"dev": {
  "command": "next dev --port 3201"
}

// After
"dev": {
  "command": "portless wahidyankf-web next dev"
}
```

### 2. next.config.ts — allowedDevOrigins

Next.js 15+ blocks cross-origin requests from the portless proxy unless
explicitly allowed. Add `allowedDevOrigins` to each app's config.

#### apps/oseplatform-web/next.config.ts

```ts
const nextConfig: NextConfig = {
  // existing config...
  allowedDevOrigins: ["oseplatform-web.localhost", "*.oseplatform-web.localhost"],
};
```

#### apps/ayokoding-web/next.config.ts

```ts
const nextConfig: NextConfig = {
  // existing config...
  allowedDevOrigins: ["ayokoding-web.localhost", "*.ayokoding-web.localhost"],
};
```

#### apps/organiclever-web/next.config.ts

```ts
const nextConfig: NextConfig = {
  // existing config...
  allowedDevOrigins: ["organiclever-web.localhost", "*.organiclever-web.localhost"],
};
```

#### apps/wahidyankf-web/next.config.ts

```ts
const nextConfig: NextConfig = {
  // existing config...
  allowedDevOrigins: ["wahidyankf-web.localhost", "*.wahidyankf-web.localhost"],
};
```

### 3. organiclever-be — static alias

`organiclever-be` is an F# Giraffe (ASP.NET Core) app. It binds its own port
via `UseUrls("http://+:8202")` in `Program.fs`. We do not wrap the .NET process
with portless. Instead, register a static alias after starting the backend:

```bash
# Run once; persists across sessions
npx portless alias organiclever-be 8202
```

The alias makes `https://organiclever-be.localhost` route to the already-running
process on port 8202. In a worktree, the alias + branch prefix creates
`https://adopt-portless.organiclever-be.localhost`.

Note: the alias is per-machine state. Document it as part of one-time setup.

## URL Reference Table

| App                | worktree   | URL                                           |
| ------------------ | ---------- | --------------------------------------------- |
| `oseplatform-web`  | `main`     | `https://oseplatform-web.localhost`           |
| `oseplatform-web`  | `<branch>` | `https://<branch>.oseplatform-web.localhost`  |
| `ayokoding-web`    | `main`     | `https://ayokoding-web.localhost`             |
| `ayokoding-web`    | `<branch>` | `https://<branch>.ayokoding-web.localhost`    |
| `organiclever-web` | `main`     | `https://organiclever-web.localhost`          |
| `organiclever-web` | `<branch>` | `https://<branch>.organiclever-web.localhost` |
| `wahidyankf-web`   | `main`     | `https://wahidyankf-web.localhost`            |
| `wahidyankf-web`   | `<branch>` | `https://<branch>.wahidyankf-web.localhost`   |
| `organiclever-be`  | `main`     | `https://organiclever-be.localhost`           |
| `organiclever-be`  | `<branch>` | `https://<branch>.organiclever-be.localhost`  |

## Worktree Branch Name → Subdomain Mapping

Portless uses the current git worktree's branch name, lowercased, replacing
`/` with `-`. Examples:

| Branch                          | Subdomain prefix                |
| ------------------------------- | ------------------------------- |
| `main`                          | _(none — top-level URL)_        |
| `adopt-portless`                | `adopt-portless`                |
| `feat/wahidyankf-new-portfolio` | `feat-wahidyankf-new-portfolio` |
| `worktree-adopt-portless`       | `worktree-adopt-portless`       |

Nx worktrees in this repo use branch name `worktree-<name>` by convention
(from `claude --worktree <name>`). So the worktree named `adopt-portless` on
branch `worktree-adopt-portless` resolves as:
`https://worktree-adopt-portless.wahidyankf-web.localhost`.

## Nx Integration Detail

Nx `@nx/next` executor for the `dev` target passes the `--port` flag if
`devServerPort` is set in the executor options. After this change, the
`project.json` `dev` target uses `command` (raw shell command), not the
`@nx/next:dev-server` executor — so Nx has no port override opportunity.

The `portless <name> next dev` command:

1. Assigns a random ephemeral port (4000–4999) and injects it as `PORT`
2. Injects `PORTLESS_URL` as the stable named URL
3. Starts `next dev` with the injected `PORT`
4. Registers the route with the running proxy

Next.js respects the `PORT` env var natively — no `--port` flag needed.

## CLAUDE.md Updates

Replace the dev port table in the "Web Sites" section. Current form:

```
- **Dev port**: 3201
```

New form:

```
- **Dev URL**: `https://wahidyankf-web.localhost` (requires portless proxy)
```

Also add a portless setup section referencing `worktree-setup.md`.

## PORTLESS=0 Escape Hatch

Any command can bypass portless by setting `PORTLESS=0`:

```bash
PORTLESS=0 nx dev wahidyankf-web   # Falls back to next dev on default port 3000
```

Useful for debugging portless itself. Document in setup guide.

## Safari Workaround

`.localhost` subdomains auto-resolve in Chrome, Firefox, Edge. Safari requires
explicit `/etc/hosts` entries. Run once:

```bash
npx portless hosts sync
```

Re-run when new app names are added. Document in setup guide.

## CI Behavior

Portless proxy is not running in CI. When portless CLI is invoked without a
running proxy, it exits with a non-zero code and an informative error. This
means `nx dev` in CI would fail — but CI does not run `nx dev`. CI runs
`test:quick`, `build`, `lint`, `typecheck`. None of these invoke `portless`.

The `test:quick` target is unchanged; portless is only in the `dev` target.

## Files Changed Summary

| File                                                | Change                                      |
| --------------------------------------------------- | ------------------------------------------- |
| `package.json`                                      | Add `portless ^0.10.3` to devDependencies   |
| `apps/oseplatform-web/project.json`                 | `dev` target: portless command              |
| `apps/oseplatform-web/next.config.ts`               | Add `allowedDevOrigins`                     |
| `apps/ayokoding-web/project.json`                   | `dev` target: portless command              |
| `apps/ayokoding-web/next.config.ts`                 | Add `allowedDevOrigins`                     |
| `apps/organiclever-web/project.json`                | `dev` target: portless command              |
| `apps/organiclever-web/next.config.ts`              | Add `allowedDevOrigins`                     |
| `apps/wahidyankf-web/project.json`                  | `dev` target: portless command              |
| `apps/wahidyankf-web/next.config.ts`                | Add `allowedDevOrigins`                     |
| `CLAUDE.md`                                         | Update dev URLs, add portless setup section |
| `governance/development/workflow/worktree-setup.md` | Add portless one-time setup steps           |
| `apps/oseplatform-web/README.md`                    | Update dev URL                              |
| `apps/ayokoding-web/README.md`                      | Update dev URL                              |
| `apps/organiclever-web/README.md`                   | Update dev URL                              |
| `apps/wahidyankf-web/README.md`                     | Update dev URL                              |
