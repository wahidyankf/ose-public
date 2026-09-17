---
title: "How to Configure App Environments"
description: Select and load the correct tiered .env file for local, test, staging, and production runs using the repo-wide APP_ENV contract
category: how-to
tags:
  - env
  - configuration
  - app-env
  - secrets
  - nextjs
  - fsharp
  - flutter
  - playwright
created: 2026-08-12
---

# How to Configure App Environments

Every Next.js app and F# backend in this monorepo selects its runtime configuration tier through a
single process variable, `APP_ENV`, and loads exactly one `.env.<tier>` file for that tier. This
guide shows you how to work with that contract across those applications and their Playwright e2e
suites. The Flutter Web client is a deliberate no-runtime-environment exception.

## Prerequisites

- A working checkout with guarded `./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` and
  transactional `npm run doctor -- --fix` already run
- An `apps/<app>/.env.local` file for the app you are configuring (scaffold one with
  `rhino-cli env init`, or copy `apps/<app>/.env.example`)

## The four tiers

`APP_ENV` selects one of four tiers. It defaults to `local` when unset.

| Tier    | `APP_ENV` value   | File loaded  | Used for                  |
| ------- | ----------------- | ------------ | ------------------------- |
| `local` | `local` (default) | `.env.local` | Your dev machine          |
| `test`  | `test`            | `.env.test`  | CI and e2e test runs      |
| `stag`  | `stag`            | `.env.stag`  | Staging deploy secrets    |
| `prod`  | `prod`            | `.env.prod`  | Production deploy secrets |

`.env.stag` and `.env.prod` hold real staging and production credentials. AI agents cannot read,
write, or edit either file directly — see
[Agent access to `.env.stag` and `.env.prod` is restricted](#agent-access-to-envstag-and-envprod-is-restricted)
below. Every other tier file (`.env.local`, `.env.test`, and the committed `.env.example`
template) is agent-readable and agent-editable.

The `test` tier exists as its own file rather than reusing `local` because Next.js deliberately
skips `.env.local` whenever `NODE_ENV=test` — [documented
upstream](https://nextjs.org/docs/pages/guides/environment-variables#test-environment-variables) as
"you expect tests to produce the same results for everyone." There is no framework option to make
tests read `.env.local` instead; `.env.test` is the only tier file Next.js's own loader will pick up
during a test run.

## The `APP_ENV` contract

Every tier loader in the repo — Next.js and F# alike — implements the same five rules:

1. **Tier selector** — read `APP_ENV` from the process environment; unset means `local`.
2. **One file** — load `.env.<tier>` and no other tier file.
3. **Process env wins** — a variable already present in the process environment is never
   replaced by a file value.
4. **Missing file is not an error** — a tier file that doesn't exist on disk is the normal case
   in CI, where real environment variables are set with no file present.
5. **Fail loudly only on required-but-absent config, not on the missing file itself** — that
   validation is a separate concern (`env.ts`'s `createEnv()` for Next.js, `envy`/typed config
   parsing for F#), unchanged by the loader.

Rule 3 is what makes rule 4 safe: because a file value can never overwrite a process-set value,
CI can inject real secrets as process environment variables with no tier file on disk at all, and
a developer's `.env.local` values are never silently clobbered by a stray tier file.

## Per-language loader behaviour

### Next.js

All five Next.js apps (`ayokoding-www`, `ose-www`, `organiclever-www`, `ose-app-web`,
`organiclever-app-web`) use the same loader pattern, canonically implemented at
`apps/ayokoding-www/src/env-loader.ts`. It calls `dotenv.config({ override: false })` against the
resolved `.env.<tier>` path, then runs immediately as a module-level side effect
(`loadTierEnv()` at the bottom of the file).

Wire it as the **first** import in the app's `next.config.ts`, before any other config module —
including the `./env.ts` import that runs `createEnv()` validation — so every later module
observes the tier file's values:

```typescript
import "./src/env-loader.ts";
import "./src/env.ts";
import type { NextConfig } from "next";
```

Next.js's own `@next/env` loader auto-loads a bare `.env` (and, in a production build,
`.env.production`) in addition to whatever tier file `env-loader.ts` loads explicitly. `.env.local`
is the sharpest case: Next.js auto-loads it in **every** environment, not just production, and
that auto-load runs before `next.config.ts` is even evaluated — so its values are already set by
the time `env-loader.ts` runs, silently winning over an explicit `.env.stag` or `.env.prod` with no
error. At any tier other than `local`, `env-loader.ts` throws if `.env`, `.env.production`, or
`.env.local` exists beside the real tier file, so a leftover file can never silently leak local
values into a staging or production build. The `local` tier is exempt from this guard, since
Next.js auto-loading these files alongside an explicit `.env.local` tier file is not a deploy risk.

### F# backends

Both F# backends (`ose-be`, `organiclever-be`) use the same loader shape, in
`Contexts/**/Infrastructure/EnvTier.fs`. `loadEnvTier()` reads `.env.<tier>` line by
line, applying each `KEY=VALUE` pair to the process environment only when that key is not already
set (rule 3), and does nothing if no matching tier file is found in any of its search directories
(rule 4).

Call `loadEnvTier()` as the first statement in `Program.fs`'s `main`, before any other config is
read:

```fsharp
// apps/ose-be/src/OseBe/Program.fs
open OseBe.Contexts.Config.Infrastructure

[<EntryPoint>]
let main args =
    loadEnvTier ()
    // ...
```

### Playwright e2e

All 11 `apps/*-e2e/playwright.config.ts` files pin the tier deterministically, right after the
`playwright-bdd` import:

```typescript
import { defineBddConfig } from "playwright-bdd";

process.env.APP_ENV ??= "test";
```

`??=` only sets `APP_ENV` when it is not already defined, so a CI job that explicitly sets
`APP_ENV` still wins — the e2e suite never overrides an already-set tier. Without this line, an
e2e run with `APP_ENV` unset would fall back to `local` and read a developer's real
`.env.local` instead of test fixtures.

## Why CI needs no env file

No `.env.test`, `.env.stag`, or `.env.prod` file is ever committed or present on a CI runner's
disk. CI relies entirely on rules 3 and 4 of the `APP_ENV` contract: it either leaves `APP_ENV`
unset or sets it to `test`, and injects real values directly as process-level environment
variables through GitHub Actions `env:`/`secrets:` — never through a file. Because rule 3 (process
env wins) guarantees a file value can never overwrite a process-set value, and rule 4 (missing
file is not an error) guarantees the loader won't fail when no tier file exists, CI's absence of
any `.env.*` file on disk is by design, not an oversight.

See the tiered injection standard in
[Secrets and Environment-Variable Standards](../../repo-governance/conventions/security/secrets-and-env-standards/tiered-injection-standard.md#tiered-injection-standard)
for the full mapping of which platform (GitHub Environment, Vercel, k3s) injects which key at
each stage.

## The `NEXT_PUBLIC_*` build-time constraint

In Next.js, only environment variables prefixed `NEXT_PUBLIC_` are inlined into the client
JavaScript bundle at build time. Every other variable stays server-side and is never sent to the
browser. This is a Next.js framework constraint, not something the `APP_ENV` loader or
`env-loader.ts` changes — it applies after the tier file has already been loaded into
`process.env`.

This matters when choosing a tier value for a variable:

- A server-only variable (no `NEXT_PUBLIC_` prefix) can safely hold a different value per tier
  without that value ever reaching the browser.
- A `NEXT_PUBLIC_`-prefixed variable's value, from whichever tier built the bundle, becomes
  visible to anyone inspecting the client bundle. Never put a secret behind a `NEXT_PUBLIC_`
  prefix, regardless of tier.

Each app's `apps/<app>/src/env.ts` declares its variables through `@t3-oss/env-nextjs`'s
`createEnv()`, under a `server` key (server-only) or a `client` key (must be `NEXT_PUBLIC_`-
prefixed, and is enforced by TypeScript types — a client variable without the prefix is a compile
error). See
[Secrets and Environment-Variable Standards §5](../../repo-governance/conventions/security/secrets-and-env-standards/startup-validation.md#startup-validation)
for the full `createEnv()` pattern.

## Agent access to `.env.stag` and `.env.prod` is restricted

AI agents must not directly read, write, or edit `.env.prod` or `.env.stag` — the
`guard-env-file-access` policy. This is enforced on a **best-effort basis** by a `PreToolUse` hook
(`.claude/hooks/block-env-file-access.sh`), not a hard technical guarantee: the hook denies the
tool calls and Bash command shapes it can recognize, but it cannot see every way a shell command
could reference a file, so treat it as a strong deterrent rather than a sandbox boundary. As the
human operator, you are the primary and most reliable way to create or edit those two files, and
you should apply compensating controls (secrets-manager storage, access logging, least-privilege
credentials) rather than relying on the hook alone to keep production and staging secrets safe.
Every other tier file (`.env.local`, `.env.test`) and the committed `.env.example` template
remain agent-readable and agent-editable.

This is a named-file rule, not a blanket deny on every `.env*` file — only `.env.prod` and
`.env.stag` are denied. It is also independent of commit policy: commit policy stays deny-all for
every real `.env*` file (everything except `.env.example`), enforced by
`rhino-cli env staged-guard validate` in the pre-commit path, regardless of which tier files an
agent is allowed to read.

## Related

- [Secrets and Environment-Variable Standards](../../repo-governance/conventions/security/secrets-and-env-standards.md) —
  the authoritative reference for env var naming, `.env.example` layout, startup validation, the
  `rhino-cli env` toolchain, the tiered injection standard, and the full `guard-env-file-access`
  policy (§9)
- [Set up your development environment](./setup-development-environment.md) — install the tools
  needed before configuring an app's `.env.local`
- [Add a new app](./add-new-app.md) — creating a new app that needs its own `.env.example` and
  tier loader wiring
